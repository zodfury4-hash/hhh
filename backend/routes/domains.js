const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const CustomDomain = require('../models/CustomDomain');
const User = require('../models/User');
const config = require('../config');
const memStore = require('../utils/memStore');
const { authMiddleware } = require('../middleware/auth');
const { validate, customDomainSchema } = require('../middleware/validation');
const { normalizeDomain, verifyDomainDns } = require('../services/dns-service');
const { getEntitlements, assertWithinLimit } = require('../config/plans');
const { createNotification } = require('../services/notificationService');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function generateVerificationToken() {
  return `hea-verify-${crypto.randomBytes(16).toString('hex')}`;
}

/* =========================================================
   CUSTOM DOMAINS API (OWNERSHIP, DNS & VERIFICATION)
   ========================================================= */

// 1. List user custom domains
router.get('/api/domains', authMiddleware, async (req, res) => {
  try {
    const email = (req.user.email || '').toLowerCase().trim();
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    let list = [];

    if (isDbConnected()) {
      const query = isAdmin ? {} : { ownerEmail: email };
      list = await CustomDomain.find(query).sort({ createdAt: -1 });
    } else {
      list = isAdmin
        ? memStore.domains
        : memStore.domains.filter((d) => d.ownerEmail.toLowerCase() === email);
    }

    res.json({ domains: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Add custom domain (starts in pending_verification)
router.post('/api/domains', authMiddleware, validate(customDomainSchema), async (req, res) => {
  try {
    const email = (req.user.email || '').toLowerCase().trim();
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const { domain } = req.body;
    const cleanDomain = normalizeDomain(domain);

    if (!cleanDomain) {
      return res.status(400).json({ error: 'Valid domain is required' });
    }

    let userEntity = req.user;
    if (isDbConnected()) {
      const dbUser = await User.findOne({ email }).lean();
      if (dbUser) userEntity = dbUser;
    } else {
      const memUser = memStore.users.find((u) => (u.email || '').toLowerCase() === email);
      if (memUser) userEntity = memUser;
    }
    const entitlements = getEntitlements(userEntity);
    if (!isAdmin) {
      let currentUsage = 0;
      if (isDbConnected()) {
        currentUsage = await CustomDomain.countDocuments({ ownerEmail: email });
      } else {
        currentUsage = memStore.domains.filter((d) => d.ownerEmail.toLowerCase() === email).length;
      }
      assertWithinLimit(entitlements, 'customDomains', currentUsage);
    }

    // Check if domain is active under another owner
    if (isDbConnected()) {
      const activeClash = await CustomDomain.findOne({ domain: cleanDomain, status: 'active' });
      if (activeClash && activeClash.ownerEmail !== email) {
        return res.status(409).json({
          error: 'This domain has already been claimed and verified by another account.',
          code: 'DOMAIN_ALREADY_ACTIVE'
        });
      }

      // Check if current user already added it
      let existing = await CustomDomain.findOne({ domain: cleanDomain, ownerEmail: email });
      if (existing) {
        return res.json({
          success: true,
          domain: existing,
          message: 'Domain already pending verification',
          instructions: {
            cname: { host: cleanDomain, target: existing.cnameTarget },
            txt: { host: `_hea-challenge.${cleanDomain}`, value: existing.verificationToken }
          }
        });
      }

      const verificationToken = generateVerificationToken();
      const item = new CustomDomain({
        ownerEmail: email,
        domain: cleanDomain,
        status: 'pending_verification',
        verificationToken,
        cnameTarget: config.cnameTarget || 'cname.healink.store'
      });
      await item.save();

      return res.json({
        success: true,
        domain: item,
        instructions: {
          cname: { host: cleanDomain, target: item.cnameTarget },
          txt: { host: `_hea-challenge.${cleanDomain}`, value: item.verificationToken }
        }
      });
    }

    // In-memory fallback
    const activeMem = memStore.domains.find((d) => d.domain === cleanDomain && d.status === 'active');
    if (activeMem && activeMem.ownerEmail !== email) {
      return res.status(409).json({
        error: 'This domain has already been claimed and verified by another account.',
        code: 'DOMAIN_ALREADY_ACTIVE'
      });
    }

    let existingMem = memStore.domains.find((d) => d.domain === cleanDomain && d.ownerEmail === email);
    if (!existingMem) {
      const verificationToken = generateVerificationToken();
      existingMem = {
        id: 'dom_' + Date.now(),
        domain: cleanDomain,
        ownerEmail: email,
        status: 'pending_verification',
        verificationToken,
        cnameTarget: config.cnameTarget || 'cname.healink.store',
        verifiedAt: null,
        lastCheckedAt: null,
        lastError: null,
        createdAt: new Date()
      };
      memStore.domains.unshift(existingMem);
    }

    res.json({
      success: true,
      domain: existingMem,
      instructions: {
        cname: { host: cleanDomain, target: existingMem.cnameTarget },
        txt: { host: `_hea-challenge.${cleanDomain}`, value: existingMem.verificationToken }
      }
    });
  } catch (err) {
    if (err.name === 'PlanError') {
      return res.status(err.statusCode || 403).json({
        ok: false,
        error: err.message,
        code: err.code,
        meta: err.meta
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// 3. Verify custom domain DNS records
router.post('/api/domains/:id/verify', authMiddleware, async (req, res) => {
  try {
    const email = (req.user.email || '').toLowerCase().trim();
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const id = req.params.id;

    let dom = null;
    if (isDbConnected()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        dom = await CustomDomain.findById(id);
      }
      if (!dom) {
        dom = await CustomDomain.findOne({ domain: normalizeDomain(id) });
      }
    } else {
      dom = memStore.domains.find((d) => d.id === id || d.domain === normalizeDomain(id));
    }

    if (!dom) return res.status(404).json({ error: 'Domain not found' });
    if (!isAdmin && dom.ownerEmail.toLowerCase() !== email) {
      return res.status(403).json({ error: 'Forbidden: You do not own this domain' });
    }

    // Execute DNS verification (allows injecting mock resolver via req.app.get('dnsResolver') for tests)
    const resolver = req.app.get('dnsResolver');
    const result = await verifyDomainDns(dom, { resolver });

    const now = new Date();
    if (result.verified) {
      dom.status = 'active';
      dom.verifiedAt = now;
      dom.lastCheckedAt = now;
      dom.lastError = null;

      if (isDbConnected()) {
        await dom.save();
      }

      try {
        createNotification({
          ownerEmail: dom.ownerEmail,
          type: 'domain_verified',
          title: 'Custom Domain Verified! 🌐',
          body: `Your custom branded domain ${dom.domain} is verified and active.`,
          link: '#domains',
          refId: `dom_${dom.domain}_verified`
        }).catch(() => {});
      } catch (_nErr) {}

      return res.json({
        success: true,
        verified: true,
        status: 'active',
        method: result.method,
        message: '🎉 Custom domain verified and active!',
        domain: dom
      });
    }

    // Verification failed
    dom.status = 'failed';
    dom.lastCheckedAt = now;
    dom.lastError = result.reason;

    if (isDbConnected()) {
      await dom.save();
    }

    try {
      createNotification({
        ownerEmail: dom.ownerEmail,
        type: 'domain_failed',
        title: 'Domain Verification Failed',
        body: `DNS verification failed for ${dom.domain}: ${result.reason}`,
        link: '#domains',
        refId: `dom_${dom.domain}_failed`
      }).catch(() => {});
    } catch (_nErr) {}

    res.status(400).json({
      success: false,
      verified: false,
      status: 'failed',
      error: result.reason,
      details: result.details,
      domain: dom
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete custom domain
router.delete('/api/domains/:id', authMiddleware, async (req, res) => {
  try {
    const email = (req.user.email || '').toLowerCase().trim();
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    const id = req.params.id;

    if (isDbConnected()) {
      let dom = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        dom = await CustomDomain.findById(id);
      }
      if (!dom) {
        dom = await CustomDomain.findOne({ domain: normalizeDomain(id) });
      }

      if (!dom) return res.status(404).json({ error: 'Domain not found' });
      if (!isAdmin && dom.ownerEmail.toLowerCase() !== email) {
        return res.status(403).json({ error: 'Forbidden: You do not own this domain' });
      }

      await CustomDomain.deleteOne({ _id: dom._id });
    } else {
      const clean = normalizeDomain(id);
      const dom = memStore.domains.find((d) => d.id === id || d.domain === clean);
      if (!dom) return res.status(404).json({ error: 'Domain not found' });
      if (!isAdmin && dom.ownerEmail.toLowerCase() !== email) {
        return res.status(403).json({ error: 'Forbidden: You do not own this domain' });
      }

      memStore.domains = memStore.domains.filter((d) => d.id !== dom.id);
    }

    res.json({ success: true, message: 'Custom domain removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Internal reverse-proxy ask endpoint (authenticated via secret header)
router.get('/internal/domain-allowed', async (req, res) => {
  try {
    const secret = req.headers['x-router-secret'];
    if (!secret || secret !== config.internalRouterSecret) {
      return res.status(401).json({ error: 'Unauthorized: Invalid router secret' });
    }

    const domainQuery = normalizeDomain(req.query.domain);
    if (!domainQuery) {
      return res.status(400).json({ error: 'domain query parameter is required' });
    }

    let activeDoc = null;
    if (isDbConnected()) {
      activeDoc = await CustomDomain.findOne({ domain: domainQuery, status: 'active' });
    } else {
      activeDoc = memStore.domains.find((d) => d.domain === domainQuery && d.status === 'active');
    }

    if (activeDoc) {
      return res.json({
        allowed: true,
        domain: domainQuery,
        ownerEmail: activeDoc.ownerEmail,
        verifiedAt: activeDoc.verifiedAt
      });
    }

    res.json({
      allowed: false,
      domain: domainQuery
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
