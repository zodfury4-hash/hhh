const { OAuth2Client } = require('google-auth-library');
const { createRemoteJWKSet, jwtVerify } = require('jose');
const config = require('../config');

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URL = new URL('https://appleid.apple.com/auth/keys');

let cachedGoogleClient = null;
let cachedGoogleClientId = null;
let cachedAppleJwks = null;

function getGoogleClient(clientId) {
  if (!cachedGoogleClient || cachedGoogleClientId !== clientId) {
    cachedGoogleClient = new OAuth2Client(clientId);
    cachedGoogleClientId = clientId;
  }
  return cachedGoogleClient;
}

function getAppleJwks() {
  if (!cachedAppleJwks) {
    cachedAppleJwks = createRemoteJWKSet(APPLE_JWKS_URL);
  }
  return cachedAppleJwks;
}

function makeAuthError(message, statusCode = 401, code = 'INVALID_TOKEN') {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

/**
 * Verify Google ID token using google-auth-library OAuth2Client.
 * Rejects unverified emails, mismatched audience, or invalid signatures.
 */
async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw makeAuthError('Google ID token (credential) is required.', 400, 'MISSING_CREDENTIAL');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || config.google.clientId;
  if (!clientId) {
    throw makeAuthError('Google Sign-In is not configured on this server.', 503, 'GOOGLE_NOT_CONFIGURED');
  }

  const client = getGoogleClient(clientId);
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: clientId
    });
  } catch (_err) {
    throw makeAuthError('Invalid or expired Google credential.', 401, 'INVALID_GOOGLE_TOKEN');
  }

  const payload = ticket && typeof ticket.getPayload === 'function' ? ticket.getPayload() : null;
  if (!payload || !payload.sub || !payload.email) {
    throw makeAuthError('Google credential did not contain required account claims.', 401, 'INVALID_GOOGLE_CLAIMS');
  }

  if (payload.email_verified !== true) {
    throw makeAuthError('Google account email is not verified.', 401, 'EMAIL_NOT_VERIFIED');
  }

  return {
    sub: String(payload.sub),
    email: String(payload.email).toLowerCase().trim(),
    name: payload.name ? String(payload.name).trim() : '',
    avatar: payload.picture ? String(payload.picture).trim() : '',
    emailVerified: true
  };
}

/**
 * Verify Apple Sign-In identityToken JWT against Apple JWKS using jose.
 * Validates signature, iss=https://appleid.apple.com, aud=APPLE_CLIENT_ID, and exp.
 */
async function verifyAppleIdentityToken(identityToken) {
  const clientId = process.env.APPLE_CLIENT_ID || config.apple.clientId;
  if (!clientId) {
    throw makeAuthError('Apple Sign-In is not configured on this server.', 503, 'APPLE_NOT_CONFIGURED');
  }

  if (!identityToken || typeof identityToken !== 'string') {
    throw makeAuthError('Apple identityToken is required.', 400, 'MISSING_CREDENTIAL');
  }

  const jwks = getAppleJwks();
  let result;
  try {
    result = await jwtVerify(identityToken, jwks, {
      issuer: APPLE_ISSUER,
      audience: clientId
    });
  } catch (_err) {
    throw makeAuthError('Invalid or expired Apple identityToken.', 401, 'INVALID_APPLE_TOKEN');
  }

  const payload = result && result.payload;
  if (!payload || !payload.sub) {
    throw makeAuthError('Apple token missing subject claim.', 401, 'INVALID_APPLE_CLAIMS');
  }

  const email = payload.email ? String(payload.email).toLowerCase().trim() : '';
  const emailVerified =
    payload.email_verified === true || payload.email_verified === 'true';

  if (email && payload.email_verified !== undefined && !emailVerified) {
    throw makeAuthError('Apple account email is not verified.', 401, 'EMAIL_NOT_VERIFIED');
  }

  return {
    sub: String(payload.sub),
    email,
    emailVerified: email ? emailVerified : false,
    isPrivateEmail: payload.is_private_email === true || payload.is_private_email === 'true'
  };
}

module.exports = {
  verifyGoogleIdToken,
  verifyAppleIdentityToken
};
