const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Link = require('../models/Link');
const QRCode = require('../models/QRCode');
const BioPage = require('../models/BioPage');
const CustomDomain = require('../models/CustomDomain');
const firebaseRtdb = require('../firebase-service');
const memStore = require('../utils/memStore');
const { authMiddleware, optionalAuth, JWT_SECRET } = require('../middleware/auth');
const {
  VIP_ADMIN_ACCOUNTS,
  isVipAdminEmail,
  devCodeField,
  generateSecureOTP,
  checkOtpRateLimit,
  recordOtpFailure,
  clearOtpRateLimit
} = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail, mailTransporter } = require('../utils/mailer');

const IS_PROD = process.env.NODE_ENV === 'production';
function isDbConnected() { return mongoose.connection.readyState === 1; }

/* =========================================================

   STRIPE PAYMENT GATEWAY & PRO CHECKOUT ENGINE

   ========================================================= */

const stripeKey = process.env.STRIPE_SECRET_KEY;

const isStripeConfigured = !!(stripeKey && !stripeKey.includes('placeholder') && (stripeKey.startsWith('sk_test_') || stripeKey.startsWith('sk_live_')));

let stripeClient = null;

if (isStripeConfigured) {

  try {

    stripeClient = require('stripe')(stripeKey);

    console.log('💳 Stripe Payment Gateway: Active and Initialized');

  } catch (err) {

    console.error('Failed to initialize Stripe client:', err.message);

  }

}

// 1. Get Public Stripe Configuration

router.get('/api/stripe/config', (req, res) => {

  res.json({

    configured: isStripeConfigured && !!stripeClient,

    publishableKey: isStripeConfigured ? (process.env.STRIPE_PUBLISHABLE_KEY || '') : ''

  });

});

// 2. Create Real Stripe Checkout Session

router.post('/api/stripe/create-checkout-session', async (req, res) => {

  try {

    const { plan, billingCycle, userEmail, userName } = req.body;

    const planKey = (plan || 'pro').toLowerCase();

    const cycle = (billingCycle || 'monthly').toLowerCase();

    // Plan pricing in USD cents

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

    if (!isStripeConfigured || !stripeClient) {

      return res.json({

        ok: true,

        demoMode: true,

        message: 'Stripe API keys not yet configured in .env. Running in Sandbox Demo Mode.',

        plan: planName,

        billingCycle: cycle,

        amount: amountInCents / 100

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

              description: `Unlimited Short Links, 4K Vector QR Codes, Custom Domains & Analytics.`,

              images: ['https://healink.store/logo.png']

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

// 3. Verify Stripe Session & Activate PRO Membership

router.get('/api/stripe/verify-session/:sessionId', async (req, res) => {

  try {

    const { sessionId } = req.params;

    if (!sessionId) {

      return res.status(400).json({ error: 'Session ID is required' });

    }

    let userEmail = '';

    let plan = 'Core PRO';

    if (isStripeConfigured && stripeClient) {

      const session = await stripeClient.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {

        return res.status(400).json({ error: 'Payment not completed or pending' });

      }

      userEmail = session.metadata?.userEmail || session.customer_email || '';

      plan = session.metadata?.plan || 'Core PRO';

    } else {

      userEmail = req.query.email || '';

      plan = req.query.plan || 'Core PRO';

    }

    // Update User in MongoDB

    if (userEmail) {

      try {

        const u = await User.findOne({ email: userEmail.toLowerCase() });

        if (u) {

          u.isPro = true;

          u.plan = plan;

          u.subscriptionDate = new Date();

          await u.save();

        }

      } catch (dbErr) {

        console.error('Error updating user in MongoDB:', dbErr);

      }

      // Sync to Firebase Realtime Database

      try {

        await firebaseRtdb.saveUserProfile(userEmail, {

          isPro: true,

          plan: plan,

          subscriptionDate: new Date().toISOString()

        });

      } catch (fbErr) {}

    }

    return res.json({

      ok: true,

      verified: true,

      userEmail,

      plan

    });

  } catch (err) {

    console.error('Stripe verification error:', err);

    return res.status(500).json({ error: err.message });

  }

});

// 4. Stripe Webhook Listener (For async events)

router.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {

  const sig = req.headers['stripe-signature'];

  let event;

  try {

    if (process.env.STRIPE_WEBHOOK_SECRET && stripeClient) {

      event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    } else {

      event = req.body;

    }

  } catch (err) {

    return res.status(400).send(`Webhook Error: ${err.message}`);

  }

  if (event.type === 'checkout.session.completed') {

    const session = event.data.object;

    const email = session.metadata?.userEmail || session.customer_email;

    const plan = session.metadata?.plan || 'Core PRO';

    if (email) {

      try {

        await User.findOneAndUpdate({ email: email.toLowerCase() }, {

          isPro: true,

          plan: plan,

          subscriptionDate: new Date()

        });

        await firebaseRtdb.saveUserProfile(email, { isPro: true, plan: plan });

      } catch (e) {}

    }

  }

  res.json({ received: true });

});

// Explicit redirect paths


module.exports = router;
