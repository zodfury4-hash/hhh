const mongoose = require('mongoose');
const Link = require('../models/Link');
const memStore = require('../utils/memStore');
const slugGen = require('../utils/slugGenerator');
const { eventsService } = require('./events');

const { getLinkAnalyticsHelper, getAggregateAnalyticsHelper } = require('./links.analytics');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const linksService = {
  async createLink({ dest, slug, title, tag, password, expiresAt, maxClicks, utm, ownerEmail, isTest = false }) {
    let finalSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '') : '';
    if (finalSlug) {
      const exists = isDbConnected()
        ? await Link.findOne({ slug: finalSlug })
        : (memStore.links || []).find((l) => l.slug === finalSlug);
      if (exists) {
        const err = new Error(`Slug '${finalSlug}' is already taken.`);
        err.code = 'SLUG_CONFLICT';
        throw err;
      }
    } else {
      finalSlug = slugGen.generateRandomSlug(6);
    }

    const doc = {
      slug: finalSlug,
      dest,
      title: (title || `Link ${finalSlug}`).trim(),
      tag: (tag || 'general').trim(),
      ownerEmail: ownerEmail.toLowerCase().trim(),
      password: password || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxClicks: typeof maxClicks === 'number' ? maxClicks : undefined,
      utm: utm || undefined,
      isTest: !!isTest,
      totalClicks: 0,
      humanClicks: 0,
      botClicks: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isDbConnected()) {
      await Link.create(doc);
    } else {
      if (!Array.isArray(memStore.links)) memStore.links = [];
      memStore.links.push(doc);
    }

    try {
      eventsService.emit('link.created', {
        slug: doc.slug,
        dest: doc.dest,
        shortUrl: `https://healink.store/${doc.slug}`,
        title: doc.title,
        tag: doc.tag,
        isTest: doc.isTest,
        totalClicks: 0
      }, ownerEmail);
    } catch (_emitErr) {}

    return {
      slug: doc.slug,
      dest: doc.dest,
      shortUrl: `https://healink.store/${doc.slug}`,
      title: doc.title,
      tag: doc.tag,
      isTest: doc.isTest,
      hasPassword: !!doc.password,
      expiresAt: doc.expiresAt || null,
      maxClicks: doc.maxClicks || null,
      totalClicks: 0,
      createdAt: doc.createdAt
    };
  },

  async listLinks({ ownerEmail, limit = 50, cursor = null, search = '', tag = '', sort = 'desc', isTest = false }) {
    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const email = ownerEmail.toLowerCase().trim();

    if (isDbConnected()) {
      const query = {
        ownerEmail: email,
        isActive: { $ne: false },
        isTest: !!isTest
      };

      if (tag) query.tag = tag;
      if (search) {
        query.$or = [
          { slug: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { dest: { $regex: search, $options: 'i' } }
        ];
      }

      if (cursor) {
        const cursorDate = new Date(cursor);
        if (!isNaN(cursorDate.getTime())) {
          query.createdAt = sort === 'asc' ? { $gt: cursorDate } : { $lt: cursorDate };
        }
      }

      const sortDir = sort === 'asc' ? 1 : -1;
      const links = await Link.find(query)
        .sort({ createdAt: sortDir })
        .limit(lim + 1)
        .lean();

      const hasMore = links.length > lim;
      const results = hasMore ? links.slice(0, lim) : links;
      const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].createdAt.toISOString() : null;

      return {
        items: results.map((l) => ({
          slug: l.slug,
          dest: l.dest,
          shortUrl: `https://healink.store/${l.slug}`,
          title: l.title || '',
          tag: l.tag || 'general',
          isTest: !!l.isTest,
          totalClicks: l.totalClicks || 0,
          hasPassword: !!(l.password || l.passwordHash),
          expiresAt: l.expiresAt || null,
          createdAt: l.createdAt
        })),
        nextCursor,
        hasMore
      };
    }

    // Memory fallback
    let all = (memStore.links || []).filter(
      (l) => (l.ownerEmail || '').toLowerCase() === email && l.isActive !== false && !!l.isTest === !!isTest
    );
    if (tag) all = all.filter((l) => l.tag === tag);
    if (search) {
      const s = search.toLowerCase();
      all = all.filter((l) => (l.slug || '').includes(s) || (l.title || '').toLowerCase().includes(s) || (l.dest || '').toLowerCase().includes(s));
    }

    all.sort((a, b) => {
      const diff = new Date(b.createdAt) - new Date(a.createdAt);
      return sort === 'asc' ? -diff : diff;
    });

    let startIdx = 0;
    if (cursor) {
      const idx = all.findIndex((l) => new Date(l.createdAt).toISOString() === cursor);
      if (idx !== -1) startIdx = idx + 1;
    }

    const slice = all.slice(startIdx, startIdx + lim);
    const hasMore = all.length > startIdx + lim;
    const nextCursor = hasMore && slice.length > 0 ? new Date(slice[slice.length - 1].createdAt).toISOString() : null;

    return {
      items: slice.map((l) => ({
        slug: l.slug,
        dest: l.dest,
        shortUrl: `https://healink.store/${l.slug}`,
        title: l.title || '',
        tag: l.tag || 'general',
        isTest: !!l.isTest,
        totalClicks: l.totalClicks || 0,
        hasPassword: !!l.password,
        expiresAt: l.expiresAt || null,
        createdAt: l.createdAt
      })),
      nextCursor,
      hasMore
    };
  },

  async getLink({ slug, ownerEmail, isTest = false }) {
    const email = ownerEmail.toLowerCase().trim();
    let link = null;

    if (isDbConnected()) {
      link = await Link.findOne({ slug, ownerEmail: email, isActive: { $ne: false }, isTest: !!isTest }).lean();
    } else {
      link = (memStore.links || []).find(
        (l) => l.slug === slug && (l.ownerEmail || '').toLowerCase() === email && l.isActive !== false && !!l.isTest === !!isTest
      );
    }

    if (!link) {
      const err = new Error(`Link not found: ${slug}`);
      err.code = 'NOT_FOUND';
      throw err;
    }

    return {
      slug: link.slug,
      dest: link.dest,
      shortUrl: `https://healink.store/${link.slug}`,
      title: link.title || '',
      tag: link.tag || 'general',
      isTest: !!link.isTest,
      totalClicks: link.totalClicks || 0,
      hasPassword: !!(link.password || link.passwordHash),
      expiresAt: link.expiresAt || null,
      maxClicks: link.maxClicks || null,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt
    };
  },

  async updateLink({ slug, updates, ownerEmail, isTest = false }) {
    const email = ownerEmail.toLowerCase().trim();
    const allowed = {};
    if (updates.dest !== undefined) allowed.dest = updates.dest;
    if (updates.title !== undefined) allowed.title = updates.title;
    if (updates.tag !== undefined) allowed.tag = updates.tag;
    if (updates.password !== undefined) allowed.password = updates.password || null;
    if (updates.expiresAt !== undefined) allowed.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;
    allowed.updatedAt = new Date();

    let updated = null;
    if (isDbConnected()) {
      updated = await Link.findOneAndUpdate(
        { slug, ownerEmail: email, isActive: { $ne: false }, isTest: !!isTest },
        { $set: allowed },
        { new: true }
      ).lean();
    } else {
      const l = (memStore.links || []).find(
        (item) => item.slug === slug && (item.ownerEmail || '').toLowerCase() === email && item.isActive !== false && !!item.isTest === !!isTest
      );
      if (l) {
        Object.assign(l, allowed);
        updated = l;
      }
    }

    if (!updated) {
      const err = new Error(`Link not found: ${slug}`);
      err.code = 'NOT_FOUND';
      throw err;
    }

    return {
      slug: updated.slug,
      dest: updated.dest,
      shortUrl: `https://healink.store/${updated.slug}`,
      title: updated.title,
      tag: updated.tag,
      isTest: !!updated.isTest,
      totalClicks: updated.totalClicks || 0,
      hasPassword: !!(updated.password || updated.passwordHash),
      expiresAt: updated.expiresAt || null,
      updatedAt: updated.updatedAt
    };
  },

  async deleteLink({ slug, ownerEmail, isTest = false }) {
    const email = ownerEmail.toLowerCase().trim();
    let deleted = false;

    if (isDbConnected()) {
      const res = await Link.updateOne(
        { slug, ownerEmail: email, isTest: !!isTest },
        { $set: { isActive: false, deletedAt: new Date() } }
      );
      deleted = res.modifiedCount > 0;
    } else {
      const l = (memStore.links || []).find(
        (item) => item.slug === slug && (item.ownerEmail || '').toLowerCase() === email && !!item.isTest === !!isTest
      );
      if (l) {
        l.isActive = false;
        deleted = true;
      }
    }

    if (!deleted) {
      const err = new Error(`Link not found: ${slug}`);
      err.code = 'NOT_FOUND';
      throw err;
    }

    return { success: true, message: `Link '${slug}' deleted.` };
  },

  async getLinkAnalytics({ slug, ownerEmail, range = '7d', isTest = false }) {
    return getLinkAnalyticsHelper({ slug, ownerEmail, range, isTest, isDbConnected });
  },

  async getAggregateAnalytics({ ownerEmail, range = '7d', isTest = false }) {
    return getAggregateAnalyticsHelper({ ownerEmail, range, isTest, isDbConnected });
  }
};

module.exports = linksService;
