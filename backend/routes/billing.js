const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const ProcessedPayment = require('../models/ProcessedPayment');
const firebaseRtdb = require('../firebase-service');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/* =========================================================
   STRIPE PAYMENT GATEWAY & SECURE PRO CHECKOUT ENGINE
   ========================================================= */

const stripeKey = process.env.STRIPE_SECRET_KEY;
const isStripeConfigured = !!(
  stripeKey &&
  !stripeKey.includes('placeholder') &&
  (stripeKey.startsWith('sk_test_') || stripeKey.startsWith('sk_live_'))
);

let stripeClient = null;
if (isStripeConfigured) {
  try {
    stripeClient = require('stripe')(stripeKey);
    console.log('💳 [Stripe Gateway] Active and Initialized');
  } catch (err) {
    console.error('Failed to initialize Stripe client:', err.message);
  }
}

// 1. Get Public Stripe Configuration
router.get('/api/stripe/config', (req, res) => {
  const isReady = isStripeConfigured && !!stripeClient;
  res.json({
    configured: isReady,
    isConfigured: isReady,
    publishableKey: isStripeConfigured ? (process.env.STRIPE_PUBLISHABLE_KEY || '') : ''
  });
});

// 2. Create Stripe Checkout Session (Production Strict / Dev Sandbox)
router.post('/api/stripe/create-checkout-session', optionalAuth, async (req, res) => {
  try {
    const { plan, billingCycle } = req.body;
    const userEmail = (req.user && req.user.email) || req.body.userEmail || '';
    const userName = (req.user && req.user.name) || req.body.userName || '';

    const planKey = (plan || 'pro').toLowerCase();
    const cycle = (billingCycle || 'monthly').toLowerCase();

    const planPrices = {
      monthly: { growth: 800, pro: 3500, enterprise: 19900 },
      annual: { growth: 7200, pro: 33600, enterprise: 190800 }
    };

    const planDisplayNames = {
      growth: 'Growth Plan',
      pro: 'Core PRO Plan',
      enterprise: 'Enterprise Plan'
    };

    const amountInCents = (planPrices[cycle] && planPrices[cycle][planKey]) || 3500;
    const planName = planDisplayNames[planKey] || 'Core PRO Plan';
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}` || 'http://localhost:3000';

    // Sandbox / Demo mode only available in development
    if (!isStripeConfigured || !stripeClient) {
      if (process.env.NODE_ENV === 'development') {
        return res.json({
          ok: true,
          demoMode: true,
          message: 'Running in development sandbox mode (Stripe API keys not set in .env).',
          plan: planName,
          billingCycle: cycle,
          amount: amountInCents / 100
        });
      }
      return res.status(503).json({
        error: 'Stripe payments are not configured on this server.',
        code: 'STRIPE_NOT_CONFIGURED'
      });
    }

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `HEA Link - ${planName} (${cycle.toUpperCase()})`,
              description: 'Unlimited Short Links, 4K Vector QR Codes, Custom Domains & Real-Time Analytics.'
            },
            unit_amount: amountInCents
          },
          quantity: 1
        }
      ],
      metadata: {
        userEmail: userEmail || '',
        userName: userName || '',
        plan: planName,
        billingCycle: cycle
      },
      success_url: `${origin}/#checkout-success?session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(planName)}`,
      cancel_url: `${origin}/#pricing`
    });

    return res.json({
      ok: true,
      demoMode: false,
      url: session.url,
      sessionId: session.id
    });
  } catch (err) {
    console.error('Stripe session creation error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. Verify Stripe Session & Activate PRO Membership with Idempotency
router.get('/api/stripe/verify-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    let userEmail = '';
    let plan = 'Core PRO';
    let amountTotal = 0;

    if (isStripeConfigured && stripeClient) {
      const session = await stripeClient.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: 'Payment not completed or pending' });
      }

      userEmail = session.metadata?.userEmail || session.customer_email || '';
      plan = session.metadata?.plan || 'Core PRO';
      amountTotal = session.amount_total || 0;
    } else {
      // In production, refuse unauthenticated verify-session without Stripe
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Stripe payments not configured in production.' });
      }
      userEmail = req.query.email || '';
      plan = req.query.plan || 'Core PRO';
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'No associated customer email found for this payment session.' });
    }

    const cleanEmail = userEmail.toLowerCase().trim();

    // Idempotency check: Ensure payment session is never applied twice
    if (isDbConnected()) {
      const alreadyProcessed = await ProcessedPayment.findOne({ paymentId: sessionId });
      if (alreadyProcessed) {
        return res.json({
          ok: true,
          verified: true,
          alreadyProcessed: true,
          userEmail: cleanEmail,
          plan: alreadyProcessed.plan
        });
      }

      // Record this processed payment
      await ProcessedPayment.create({
        paymentId: sessionId,
        email: cleanEmail,
        plan,
        amount: amountTotal,
        source: isStripeConfigured ? 'verify_session' : 'sandbox'
      });

      // Update User in MongoDB
      const u = await User.findOne({ email: cleanEmail });
      if (u) {
        u.isPro = true;
        u.plan = plan;
        u.subscriptionDate = new Date();
        await u.save();
      }
    }

    // Sync to Firebase RTDB if active
    try {
      await firebaseRtdb.saveUserProfile(cleanEmail, {
        isPro: true,
        plan: plan,
        subscriptionDate: new Date().toISOString()
      });
    } catch (fbErr) {}

    return res.json({
      ok: true,
      verified: true,
      userEmail: cleanEmail,
      plan
    });
  } catch (err) {
    console.error('Stripe verification error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. Secure Stripe Webhook with Signature Verification & Idempotency
router.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.includes('placeholder')) {
    console.error('🚨 Webhook rejected: STRIPE_WEBHOOK_SECRET is not configured in .env');
    return res.status(500).send('Webhook secret is not configured.');
  }

  if (!sig) {
    return res.status(400).send('Missing stripe-signature header.');
  }

  let event;
  try {
    const rawBody = req.rawBody || req.body;
    event = stripeClient.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.metadata?.userEmail || session.customer_email;
    const plan = session.metadata?.plan || 'Core PRO';
    const eventId = event.id;

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      try {
        if (isDbConnected()) {
          // Idempotency check: Ignore duplicate webhook deliveries
          const alreadyProcessed = await ProcessedPayment.findOne({ paymentId: eventId });
          if (alreadyProcessed) {
            return res.json({ received: true, alreadyProcessed: true });
          }

          await ProcessedPayment.create({
            paymentId: eventId,
            email: cleanEmail,
            plan,
            amount: session.amount_total || 0,
            source: 'webhook'
          });

          await User.findOneAndUpdate(
            { email: cleanEmail },
            {
              isPro: true,
              plan: plan,
              subscriptionDate: new Date()
            }
          );
        }

        await firebaseRtdb.saveUserProfile(cleanEmail, { isPro: true, plan: plan });
      } catch (e) {
        console.error('Error applying webhook payment:', e);
      }
    }
  }

  res.json({ received: true });
});

module.exports = router;
