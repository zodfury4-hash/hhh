'use strict';

/**
 * Central Plans & Entitlements Configuration
 * Single Source of Truth for SaaS Tiers, Resource Limits, and Feature Gates.
 */

class PlanError extends Error {
  constructor(message, code, meta = {}) {
    super(message);
    this.name = 'PlanError';
    this.code = code; // 'PLAN_LIMIT_REACHED' | 'FEATURE_NOT_IN_PLAN'
    this.statusCode = 403;
    this.meta = meta;
  }
}

const PLANS = {
  free: {
    planKey: 'free',
    name: 'Free Starter',
    badge: 'Free',
    description: 'Essential URL shortening and personal link tools.',
    priceMonthly: 0,
    priceAnnual: 0,
    currency: 'PKR',
    limits: {
      links: 25,
      qrCodes: 5,
      bioPages: 1,
      customDomains: 0,
      seats: 1,
      workspaces: 0, // No client workspaces
      analyticsRetentionDays: 30,
      apiKeys: 0,
      apiRateLimit: 30,
      aiRequestsPerDay: 5,
      sso: false,
      auditLogs: false,
      exportData: false
    },
    features: [
      '25 Active short links',
      '5 Vector QR codes',
      '1 Link-in-bio page',
      '30-Day analytics retention',
      'Standard community support'
    ]
  },
  pro: {
    planKey: 'pro',
    name: 'Pro Creator',
    badge: 'Most Popular',
    description: 'High-performance links, custom domains, and extended analytics.',
    priceMonthly: 1499,
    priceAnnual: 14990,
    currency: 'PKR',
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual',
    limits: {
      links: 500,
      qrCodes: 50,
      bioPages: 5,
      customDomains: 3,
      seats: 1,
      workspaces: 0,
      analyticsRetentionDays: 90,
      apiKeys: 2,
      apiRateLimit: 120,
      aiRequestsPerDay: 50,
      sso: false,
      auditLogs: false,
      exportData: true
    },
    features: [
      '500 Active short links',
      '50 Vector QR codes',
      '5 Link-in-bio pages',
      '3 Custom branded domains',
      '90-Day analytics retention',
      'CSV / JSON data exports',
      '2 REST API keys (120 req/min)'
    ]
  },
  business: {
    planKey: 'business',
    name: 'Business Team',
    badge: 'For Teams',
    description: 'Multi-seat team workspace, shared links, and full audit logs.',
    priceMonthly: 4999,
    priceAnnual: 49990,
    currency: 'PKR',
    stripePriceIdMonthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_monthly',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL || 'price_business_annual',
    limits: {
      links: 5000,
      qrCodes: 500,
      bioPages: 25,
      customDomains: 10,
      seats: 5,
      workspaces: 0,
      analyticsRetentionDays: 365,
      apiKeys: 10,
      apiRateLimit: 300,
      aiRequestsPerDay: 200,
      sso: false,
      auditLogs: true,
      exportData: true
    },
    features: [
      '5,000 Active short links',
      '500 Vector QR codes',
      '25 Link-in-bio pages',
      '10 Custom branded domains',
      '5 Team workspace seats',
      '365-Day analytics retention',
      'Full workspace audit logs',
      '10 REST API keys (300 req/min)'
    ]
  },
  agency: {
    planKey: 'agency',
    name: 'Agency Scale',
    badge: 'Multi-Client',
    description: 'Multi-client workspace architecture, client isolation, and reporting.',
    priceMonthly: 12999,
    priceAnnual: 129990,
    currency: 'PKR',
    stripePriceIdMonthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY || 'price_agency_monthly',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_AGENCY_ANNUAL || 'price_agency_annual',
    limits: {
      links: 25000,
      qrCodes: 2500,
      bioPages: 100,
      customDomains: 50,
      seats: 15,
      workspaces: 10, // 10 client workspaces
      analyticsRetentionDays: 730,
      apiKeys: 25,
      apiRateLimit: 600,
      aiRequestsPerDay: 500,
      sso: false,
      auditLogs: true,
      exportData: true
    },
    features: [
      '25,000 Active short links',
      '2,500 Vector QR codes',
      '10 Client workspaces with isolation',
      '15 Team seats across clients',
      '50 Custom branded domains',
      '730-Day analytics retention',
      'Client reporting exports (CSV & PDF)',
      '25 REST API keys (600 req/min)'
    ]
  },
  enterprise: {
    planKey: 'enterprise',
    name: 'Enterprise Custom',
    badge: 'Enterprise',
    description: 'Unlimited capacity, SAML/OIDC SSO, custom security, and dedicated support.',
    priceMonthly: 29999,
    priceAnnual: 299990,
    currency: 'PKR',
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || 'price_enterprise_annual',
    limits: {
      links: -1, // Unlimited
      qrCodes: -1,
      bioPages: -1,
      customDomains: -1,
      seats: 50,
      workspaces: 50,
      analyticsRetentionDays: 1095, // 3 Years
      apiKeys: -1,
      apiRateLimit: 1200,
      aiRequestsPerDay: -1,
      sso: true,
      auditLogs: true,
      exportData: true
    },
    features: [
      'Unlimited links, QR codes & bio pages',
      'Unlimited custom branded domains',
      'Enterprise SSO (SAML 2.0 & OIDC)',
      '50 Workspace seats & 50 child workspaces',
      '3-Year analytics retention',
      'Granular RBAC & IP allowlisting',
      'Dedicated SLA support & manager'
    ]
  }
};

/**
 * Resolve plan entitlements for a user or workspace entity.
 * @param {Object} entity - User or Workspace object
 * @returns {Object} Complete plan object with limits and features
 */
function getEntitlements(entity) {
  let planKey = 'free';

  if (entity) {
    if (typeof entity.planKey === 'string' && PLANS[entity.planKey]) {
      planKey = entity.planKey;
    } else if (typeof entity.plan === 'string' && PLANS[entity.plan]) {
      planKey = entity.plan;
    } else if (entity.isPro === true) {
      planKey = 'pro';
    }
  }

  const basePlan = PLANS[planKey] || PLANS.free;

  // Clone so caller cannot mutate central config
  return {
    planKey: basePlan.planKey,
    name: basePlan.name,
    badge: basePlan.badge,
    description: basePlan.description,
    priceMonthly: basePlan.priceMonthly,
    priceAnnual: basePlan.priceAnnual,
    currency: basePlan.currency,
    ...basePlan.limits,
    features: [...basePlan.features]
  };
}

/**
 * Assert that a requested resource operation is within the entity's plan limits.
 * @param {Object} entitlements - Output of getEntitlements
 * @param {string} key - Limit key to check (e.g. 'links', 'customDomains', 'sso')
 * @param {number} [currentUsage=0] - Current count of resources used
 * @throws {PlanError}
 */
function assertWithinLimit(entitlements, key, currentUsage = 0) {
  if (!entitlements || typeof entitlements !== 'object') {
    throw new PlanError('Invalid plan entitlements provided', 'INVALID_ENTITLEMENTS');
  }

  const limit = entitlements[key];

  // Boolean feature flag check (e.g., sso, auditLogs, exportData)
  if (typeof limit === 'boolean') {
    if (!limit) {
      throw new PlanError(
        `Feature '${key}' is not available in the ${entitlements.name} plan. Upgrade to unlock this capability.`,
        'FEATURE_NOT_IN_PLAN',
        { feature: key, plan: entitlements.planKey }
      );
    }
    return true;
  }

  // Numeric limit check (e.g., links, qrCodes, seats)
  if (typeof limit === 'number') {
    if (limit === -1) {
      return true; // Unlimited
    }
    if (currentUsage >= limit) {
      throw new PlanError(
        `Plan limit reached for ${key}. Current usage: ${currentUsage}, maximum allowed: ${limit}. Please upgrade your plan.`,
        'PLAN_LIMIT_REACHED',
        { limitKey: key, max: limit, current: currentUsage, plan: entitlements.planKey }
      );
    }
    return true;
  }

  return true;
}

/**
 * Returns public-safe plans directory for client consumption (pricing cards, checkout modals).
 */
function getPublicPlans() {
  return Object.values(PLANS).map((p) => ({
    planKey: p.planKey,
    name: p.name,
    badge: p.badge,
    description: p.description,
    priceMonthly: p.priceMonthly,
    priceAnnual: p.priceAnnual,
    currency: p.currency,
    limits: { ...p.limits },
    features: [...p.features]
  }));
}

module.exports = {
  PLANS,
  PlanError,
  getEntitlements,
  assertWithinLimit,
  getPublicPlans
};
