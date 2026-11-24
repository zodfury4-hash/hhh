const dns = require('dns').promises;
const config = require('../config');

/**
 * Clean & normalize domain name (strips protocol, port, trailing slashes/dots)
 */
function normalizeDomain(rawDomain = '') {
  if (!rawDomain || typeof rawDomain !== 'string') return '';
  let d = rawDomain.trim().toLowerCase();
  d = d.replace(/^https?:\/\//i, '');
  d = d.split('/')[0];
  d = d.split(':')[0];
  d = d.replace(/\.$/, '');
  return d;
}

/**
 * Verify domain ownership and routing via DNS
 * @param {Object} domainDoc - CustomDomain object (requires domain, verificationToken, cnameTarget)
 * @param {Object} options - Optional resolver overrides for hermetic testing
 */
async function verifyDomainDns(domainDoc, options = {}) {
  const domain = normalizeDomain(domainDoc.domain);
  const token = (domainDoc.verificationToken || '').trim();
  const expectedCname = normalizeDomain(domainDoc.cnameTarget || config.cnameTarget || 'cname.healink.store');

  const resolver = options.resolver || dns;

  let cnameFound = false;
  let txtFound = false;
  const errors = [];

  // 1. Check CNAME record
  try {
    const cnames = await resolver.resolveCname(domain);
    if (Array.isArray(cnames)) {
      cnameFound = cnames.some((c) => normalizeDomain(c) === expectedCname);
    }
  } catch (err) {
    errors.push(`CNAME check: ${err.code || err.message}`);
  }

  if (cnameFound) {
    return {
      verified: true,
      method: 'cname',
      domain
    };
  }

  // 2. Check TXT record at _hea-challenge.<domain>
  if (token) {
    try {
      const challengeHost = `_hea-challenge.${domain}`;
      const records = await resolver.resolveTxt(challengeHost);
      if (Array.isArray(records)) {
        // dns.resolveTxt returns array of string arrays e.g. [['hea-verify-...']]
        const flatStrings = records.flat().map((s) => s.trim());
        txtFound = flatStrings.some((txt) => txt === token || txt.includes(token));
      }
    } catch (err) {
      errors.push(`TXT check: ${err.code || err.message}`);
    }
  }

  if (txtFound) {
    return {
      verified: true,
      method: 'txt',
      domain
    };
  }

  return {
    verified: false,
    reason: `DNS verification failed. Ensure a CNAME record points to "${expectedCname}" or a TXT record at "_hea-challenge.${domain}" contains "${token}".`,
    details: errors
  };
}

module.exports = {
  normalizeDomain,
  verifyDomainDns
};
