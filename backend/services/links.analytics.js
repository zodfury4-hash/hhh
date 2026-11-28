const Click = require('../models/Click');
const memStore = require('../utils/memStore');

async function getLinkAnalyticsHelper({ slug, ownerEmail, range = '7d', isTest = false, isDbConnected }) {
  const email = ownerEmail.toLowerCase().trim();
  const hours = range === '24h' ? 24 : range === '30d' ? 720 : range === '90d' ? 2160 : 168;
  const since = new Date(Date.now() - hours * 3600 * 1000);

  const filter = {
    slug,
    ownerEmail: email,
    createdAt: { $gte: since },
    isTest: !!isTest
  };

  let totalClicks = 0;
  let uniqueVisitors = 0;
  let topCountries = [];
  let topReferrers = [];

  if (isDbConnected()) {
    const [totals, countries, referrers] = await Promise.all([
      Click.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: 1 }, ips: { $addToSet: '$ipHash' } } }
      ]),
      Click.aggregate([
        { $match: filter },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Click.aggregate([
        { $match: filter },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    if (totals.length > 0) {
      totalClicks = totals[0].total;
      uniqueVisitors = (totals[0].ips || []).length;
    }
    topCountries = countries.map((c) => ({ country: c._id || 'Unknown', count: c.count }));
    topReferrers = referrers.map((r) => ({ referrer: r._id || 'Direct', count: r.count }));
  } else {
    const clicks = (memStore.clicks || []).filter(
      (c) => c.slug === slug && (c.ownerEmail || '').toLowerCase() === email && new Date(c.createdAt) >= since && !!c.isTest === !!isTest
    );
    totalClicks = clicks.length;
    uniqueVisitors = new Set(clicks.map((c) => c.ipHash)).size;
  }

  return {
    slug,
    range,
    isTest: !!isTest,
    totalClicks,
    uniqueVisitors,
    topCountries,
    topReferrers
  };
}

async function getAggregateAnalyticsHelper({ ownerEmail, range = '7d', isTest = false, isDbConnected }) {
  const email = ownerEmail.toLowerCase().trim();
  const hours = range === '24h' ? 24 : range === '30d' ? 720 : range === '90d' ? 2160 : 168;
  const since = new Date(Date.now() - hours * 3600 * 1000);

  const filter = {
    ownerEmail: email,
    createdAt: { $gte: since },
    isTest: !!isTest
  };

  let totalClicks = 0;
  let uniqueVisitors = 0;
  let topCountries = [];
  let topReferrers = [];

  if (isDbConnected()) {
    const [totals, countries, referrers] = await Promise.all([
      Click.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: 1 }, ips: { $addToSet: '$ipHash' } } }
      ]),
      Click.aggregate([
        { $match: filter },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Click.aggregate([
        { $match: filter },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    if (totals.length > 0) {
      totalClicks = totals[0].total;
      uniqueVisitors = (totals[0].ips || []).length;
    }
    topCountries = countries.map((c) => ({ country: c._id || 'Unknown', count: c.count }));
    topReferrers = referrers.map((r) => ({ referrer: r._id || 'Direct', count: r.count }));
  } else {
    const clicks = (memStore.clicks || []).filter(
      (c) => (c.ownerEmail || '').toLowerCase() === email && new Date(c.createdAt) >= since && !!c.isTest === !!isTest
    );
    totalClicks = clicks.length;
    uniqueVisitors = new Set(clicks.map((c) => c.ipHash)).size;
  }

  return {
    range,
    isTest: !!isTest,
    totalClicks,
    uniqueVisitors,
    topCountries,
    topReferrers
  };
}

module.exports = {
  getLinkAnalyticsHelper,
  getAggregateAnalyticsHelper
};
