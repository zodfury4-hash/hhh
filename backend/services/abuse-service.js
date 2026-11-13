const AbuseReport = require('../models/AbuseReport');
const { isValidDestinationUrl, BLOCKED_DOMAINS } = require('../middleware/validation');

async function checkGoogleSafeBrowsing(url) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    return { safe: true, checked: false };
  }

  try {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
    const payload = {
      client: {
        clientId: 'healink-app',
        clientVersion: '2.0.0'
      },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }]
      }
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.matches && data.matches.length > 0) {
        return {
          safe: false,
          checked: true,
          threatType: data.matches[0].threatType
        };
      }
      return { safe: true, checked: true };
    }
  } catch (err) {
    console.warn('[Google Safe Browsing Check Warning]', err.message);
  }

  return { safe: true, checked: false };
}

async function inspectUrlSecurity(url) {
  if (!isValidDestinationUrl(url)) {
    return {
      safe: false,
      reason: 'URL scheme or host is disallowed (SSRF protection / private network / blocked domain).'
    };
  }

  const safeBrowsingResult = await checkGoogleSafeBrowsing(url);
  if (!safeBrowsingResult.safe) {
    return {
      safe: false,
      reason: `Destination URL was identified as dangerous (${safeBrowsingResult.threatType}) by Google Safe Browsing.`
    };
  }

  return { safe: true };
}

module.exports = {
  checkGoogleSafeBrowsing,
  inspectUrlSecurity
};
