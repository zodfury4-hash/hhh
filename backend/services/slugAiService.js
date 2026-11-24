const mongoose = require('mongoose');
const { z } = require('zod');
const { RESERVED_SLUGS } = require('../middleware/validation');
const { containsProfanity } = require('../utils/profanityBlocklist');
const { generateCryptoSlug } = require('../utils/slugGenerator');
const { inspectUrlSecurity } = require('./abuse-service');
const { fetchSafePageMetadata } = require('./pageMetadataService');
const { complete, isAiConfigured } = require('./llm');
const memStore = require('../utils/memStore');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const slugCandidateSchema = z.object({
  slugs: z.array(
    z.object({
      slug: z.string(),
      reason: z.string().optional(),
      score: z.number().optional()
    })
  )
});

/**
 * Clean and normalize a slug candidate
 */
function cleanSlug(raw = '') {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * Deterministic fallback generator when AI model is not configured or unavailable
 */
function generateDeterministicFallbackSlugs({ url, title, keywords, brandName, count = 5 }) {
  const seeds = [];

  if (brandName) seeds.push(brandName);
  if (title) {
    const words = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['and', 'for', 'the', 'with', 'this', 'that', 'your'].includes(w));
    if (words.length >= 2) seeds.push(`${words[0]}-${words[1]}`);
    if (words.length >= 1) seeds.push(words[0]);
  }
  if (keywords) {
    const kwWords = keywords
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);
    if (kwWords.length >= 2) seeds.push(`${kwWords[0]}-${kwWords[1]}`);
    if (kwWords.length >= 1) seeds.push(kwWords[0]);
  }

  try {
    const parsed = new URL(url);
    const hostParts = parsed.hostname.replace(/^www\./, '').split('.');
    if (hostParts.length > 0 && hostParts[0].length > 2) {
      seeds.push(hostParts[0]);
    }
    const pathParts = parsed.pathname.split('/').filter((p) => p.length > 2 && !p.includes('.'));
    if (pathParts.length > 0) {
      seeds.push(pathParts[pathParts.length - 1]);
    }
  } catch (_e) {}

  seeds.push('link', 'promo', 'drop', 'launch', 'hub');

  const candidates = [];
  const seen = new Set();

  for (const base of seeds) {
    const cleaned = cleanSlug(base);
    if (cleaned.length >= 3 && !seen.has(cleaned) && !RESERVED_SLUGS.has(cleaned) && !containsProfanity(cleaned)) {
      seen.add(cleaned);
      candidates.push({
        slug: cleaned,
        reason: 'Keyword-based direct slug',
        score: 85
      });
    }
    if (candidates.length >= count) break;
  }

  // Ensure count candidates by appending short crypto suffixes
  while (candidates.length < count) {
    const base = candidates[0]?.slug || 'link';
    const suffix = generateCryptoSlug(3).toLowerCase();
    const candidate = `${base}-${suffix}`;
    if (!seen.has(candidate)) {
      seen.add(candidate);
      candidates.push({
        slug: candidate,
        reason: 'Variation with unique suffix',
        score: 80
      });
    }
  }

  return candidates.slice(0, count);
}

/**
 * Filter and verify availability against the database in a single query
 */
async function verifyAndResolveAvailability(candidates, targetCount) {
  const Link = mongoose.models.Link || require('../models/Link');
  const validCandidates = [];
  const seen = new Set();

  for (const item of candidates) {
    const slug = cleanSlug(item.slug);
    if (
      slug.length >= 3 &&
      slug.length <= 40 &&
      !seen.has(slug) &&
      !RESERVED_SLUGS.has(slug) &&
      !containsProfanity(slug)
    ) {
      seen.add(slug);
      validCandidates.push({
        slug,
        reason: item.reason || 'AI generated contextual slug',
        score: item.score || 90
      });
    }
  }

  const slugsToCheck = validCandidates.map((c) => c.slug);
  let takenSlugs = new Set();

  if (isDbConnected()) {
    const clashDocs = await Link.find({ slug: { $in: slugsToCheck } }).select('slug');
    clashDocs.forEach((doc) => takenSlugs.add(doc.slug.toLowerCase()));
  } else {
    const memLinks = Array.isArray(memStore.links) ? memStore.links : [];
    memLinks.forEach((l) => {
      if (l.slug && slugsToCheck.includes(l.slug.toLowerCase())) {
        takenSlugs.add(l.slug.toLowerCase());
      }
    });
  }

  const available = [];
  for (const c of validCandidates) {
    if (!takenSlugs.has(c.slug)) {
      available.push({
        slug: c.slug,
        reason: c.reason,
        rationale: c.reason,
        score: c.score,
        confidence: (c.score || 90) / 100,
        available: true,
        isAvailable: true
      });
    }
  }

  // If fewer than targetCount are free, append crypto suffixes to taken ones and verify
  if (available.length < targetCount) {
    for (const c of validCandidates) {
      if (available.length >= targetCount) break;
      if (takenSlugs.has(c.slug)) {
        const altSlug = `${c.slug}-${generateCryptoSlug(3).toLowerCase()}`;
        available.push({
          slug: altSlug,
          reason: `${c.reason} (unique suffix added)`,
          rationale: `${c.reason} (unique suffix added)`,
          score: Math.max(70, (c.score || 90) - 10),
          confidence: Math.max(0.7, ((c.score || 90) - 10) / 100),
          available: true,
          isAvailable: true
        });
      }
    }
  }

  return available.slice(0, targetCount);
}

/**
 * Generate AI Slugs with safe metadata inspection, LLM query, and fallback
 */
async function generateAiSlugs({ url, title, keywords, tone = 'short', count = 5, brandName }) {
  // 1. Security Check on Destination URL
  const security = await inspectUrlSecurity(url);
  if (!security.safe) {
    const err = new Error(security.reason || 'Disallowed destination URL');
    err.status = 400;
    err.code = 'URL_BLOCKED';
    throw err;
  }

  // 2. Safe Metadata Fetch (Optional)
  const meta = await fetchSafePageMetadata(url);
  const effectiveTitle = title || meta.title || '';
  const effectiveDesc = meta.description || '';

  // 3. Fallback if AI is not configured
  if (!isAiConfigured()) {
    const fallbackList = generateDeterministicFallbackSlugs({
      url,
      title: effectiveTitle,
      keywords,
      brandName,
      count
    });
    const verified = await verifyAndResolveAvailability(fallbackList, count);
    return {
      suggestions: verified,
      usedAI: false,
      notice: 'Rule-based suggestions (AI model not connected)'
    };
  }

  // 4. Prompt Anthropic Fast Model
  const systemPrompt = `You are the HEA Link AI Slug Architect. Generate concise, memorable, high-converting URL back-halves (slugs) for shortlinks.
You must respond with valid, strict JSON ONLY matching this schema:
{
  "slugs": [
    { "slug": "example-slug", "reason": "brief 3-7 word explanation", "score": 95 }
  ]
}

Rules:
- Slugs must only contain lowercase English letters (a-z), digits (0-9), and single hyphens.
- Length must be between 3 and 25 characters.
- Never use profanity, offensive terms, slurs, or trademark violations.
- Never output markdown formatting, backticks, or prose outside the JSON object.
- Strictly adhere to tone requested (e.g. short, brandable, descriptive, campaign).`;

  const userPrompt = `Generate exactly ${count} candidate slugs based on this webpage context:
<user_supplied_context>
<destination_url>${url}</destination_url>
<page_title>${effectiveTitle}</page_title>
<page_description>${effectiveDesc}</page_description>
<user_keywords>${keywords || ''}</user_keywords>
<brand_name>${brandName || ''}</brand_name>
<requested_tone>${tone}</requested_tone>
</user_supplied_context>`;

  let candidateSlugs = [];
  try {
    const response = await complete({
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      max_tokens: 600,
      temperature: 0.4
    });

    // Parse JSON with clean extraction (support both { slugs: [...] } and bare [ ... ])
    let jsonText = (response.text || '').trim();
    let parsed = null;
    try {
      const jsonMatch = jsonText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : jsonText);
    } catch (_e) {}

    if (Array.isArray(parsed)) {
      candidateSlugs = parsed.map((item) => ({
        slug: typeof item === 'string' ? item : item.slug || '',
        reason: item.reason || item.rationale || '',
        score: item.score || (item.confidence ? Math.round(item.confidence * 100) : 90)
      }));
    } else if (parsed && typeof parsed === 'object') {
      const validated = slugCandidateSchema.safeParse(parsed);
      if (validated.success && validated.data.slugs.length > 0) {
        candidateSlugs = validated.data.slugs;
      }
    }

    if (candidateSlugs.length === 0) {
      // Retry once if invalid JSON
      const retryResponse = await complete({
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: jsonText },
          { role: 'user', content: 'Your previous response was not valid JSON. Output raw JSON only.' }
        ],
        max_tokens: 600,
        temperature: 0.2
      });

      let retryText = (retryResponse.text || '').trim();
      const retryMatch = retryText.match(/\{[\s\S]*\}/);
      if (retryMatch) retryText = retryMatch[0];
      const retryParsed = JSON.parse(retryText);
      const retryValidated = slugCandidateSchema.parse(retryParsed);
      candidateSlugs = retryValidated.slugs;
    }
  } catch (_llmErr) {
    // If LLM fails or returns non-JSON, fallback gracefully and honestly
    const fallbackList = generateDeterministicFallbackSlugs({
      url,
      title: effectiveTitle,
      keywords,
      brandName,
      count
    });
    const verified = await verifyAndResolveAvailability(fallbackList, count);
    return {
      suggestions: verified,
      usedAI: false,
      notice: 'Rule-based suggestions (AI provider temporarily unavailable)'
    };
  }

  // 5. Verify availability and filter
  const verified = await verifyAndResolveAvailability(candidateSlugs, count);

  return {
    suggestions: verified,
    usedAI: true,
    inputMetadata: {
      title: effectiveTitle || null,
      description: effectiveDesc || null
    }
  };
}

module.exports = {
  cleanSlug,
  generateAiSlugs,
  generateDeterministicFallbackSlugs
};
