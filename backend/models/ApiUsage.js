const mongoose = require('mongoose');
const memStore = require('../utils/memStore');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const apiUsageSchema = new mongoose.Schema(
  {
    keyId: {
      type: String,
      required: true,
      index: true
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true
    },
    count: {
      type: Number,
      default: 0
    },
    statusBuckets: {
      s2xx: { type: Number, default: 0 },
      s4xx: { type: Number, default: 0 },
      s5xx: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

apiUsageSchema.index({ keyId: 1, date: 1 }, { unique: true });

let ApiUsageModel = null;
try {
  ApiUsageModel = mongoose.model('ApiUsage', apiUsageSchema);
} catch (_e) {
  ApiUsageModel = mongoose.model('ApiUsage');
}

if (!Array.isArray(memStore.apiUsage)) {
  memStore.apiUsage = [];
}

const ApiUsage = {
  schema: apiUsageSchema,
  model: ApiUsageModel,

  async recordRequest({ keyId, userEmail, statusCode = 200 }) {
    const today = new Date().toISOString().split('T')[0];
    const bucket = statusCode >= 500 ? 's5xx' : statusCode >= 400 ? 's4xx' : 's2xx';

    if (isDbConnected()) {
      try {
        await ApiUsageModel.updateOne(
          { keyId, date: today },
          {
            $setOnInsert: { userEmail: (userEmail || '').toLowerCase().trim() },
            $inc: {
              count: 1,
              [`statusBuckets.${bucket}`]: 1
            }
          },
          { upsert: true }
        );
      } catch (_e) {}
    } else {
      let entry = (memStore.apiUsage || []).find((u) => u.keyId === keyId && u.date === today);
      if (!entry) {
        entry = {
          keyId,
          userEmail: (userEmail || '').toLowerCase().trim(),
          date: today,
          count: 0,
          statusBuckets: { s2xx: 0, s4xx: 0, s5xx: 0 }
        };
        memStore.apiUsage.push(entry);
      }
      entry.count += 1;
      entry.statusBuckets[bucket] = (entry.statusBuckets[bucket] || 0) + 1;
    }
  },

  async getMonthUsage(userEmail) {
    const email = (userEmail || '').toLowerCase().trim();
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM

    if (isDbConnected()) {
      const records = await ApiUsageModel.find({
        userEmail: email,
        date: { $regex: `^${currentMonthPrefix}` }
      }).lean();
      return records.reduce((sum, r) => sum + (r.count || 0), 0);
    }

    return (memStore.apiUsage || [])
      .filter((u) => u.userEmail === email && u.date.startsWith(currentMonthPrefix))
      .reduce((sum, u) => sum + (u.count || 0), 0);
  }
};

module.exports = ApiUsage;
