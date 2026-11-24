const crypto = require('crypto');
const mongoose = require('mongoose');
const memStore = require('./memStore');

// Base58-like alphanumeric charset (avoids ambiguous characters: 0, O, I, l)
const ALPHABET = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Generate a cryptographically random slug
 * @param {number} length - Slug length (default 6)
 * @returns {string}
 */
function generateCryptoSlug(length = 6) {
  let result = '';
  const alphabetLength = ALPHABET.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, alphabetLength);
    result += ALPHABET.charAt(randomIndex);
  }
  return result;
}

/**
 * Generate a unique slug that does not collide with existing links
 * @param {number} length - Slug length
 * @param {number} maxRetries - Max collision attempts (default 5)
 * @returns {Promise<string>}
 */
async function generateUniqueSlug(length = 6, maxRetries = 5) {
  const Link = mongoose.models.Link || require('../models/Link');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const candidate = generateCryptoSlug(length + (attempt >= 3 ? 1 : 0)).toLowerCase();

    let exists = false;
    if (isDbConnected()) {
      const clash = await Link.findOne({ slug: candidate });
      exists = !!clash;
    } else {
      exists = Array.isArray(memStore.links) && memStore.links.some((l) => l.slug.toLowerCase() === candidate);
    }

    if (!exists) {
      return candidate;
    }
  }

  // Fallback if multiple collisions: append crypto timestamp suffix
  return `${generateCryptoSlug(length)}-${crypto.randomInt(100, 999)}`.toLowerCase();
}

module.exports = {
  ALPHABET,
  generateCryptoSlug,
  generateRandomSlug: generateCryptoSlug,
  generateUniqueSlug
};
