const mongoose = require('mongoose');
const memStore = require('../utils/memStore');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const waitlistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    provider: {
      type: String,
      required: true,
      index: true
    },
    useCase: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

let WaitlistModel = null;
try {
  WaitlistModel = mongoose.model('IntegrationWaitlist', waitlistSchema);
} catch (_e) {
  WaitlistModel = mongoose.model('IntegrationWaitlist');
}

if (!Array.isArray(memStore.integrationWaitlist)) {
  memStore.integrationWaitlist = [];
}

const IntegrationWaitlist = {
  schema: waitlistSchema,
  model: WaitlistModel,

  async join({ email, provider, useCase = '' }) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanProvider = provider.toLowerCase().trim();

    const entry = {
      email: cleanEmail,
      provider: cleanProvider,
      useCase: (useCase || '').slice(0, 300),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isDbConnected()) {
      await WaitlistModel.findOneAndUpdate(
        { email: cleanEmail, provider: cleanProvider },
        { $set: entry },
        { upsert: true, new: true }
      );
    } else {
      const idx = (memStore.integrationWaitlist || []).findIndex(
        (w) => w.email === cleanEmail && w.provider === cleanProvider
      );
      if (idx !== -1) {
        memStore.integrationWaitlist[idx] = entry;
      } else {
        memStore.integrationWaitlist.push(entry);
      }
    }
    return entry;
  },

  async count(provider = null) {
    if (isDbConnected()) {
      const q = provider ? { provider } : {};
      return await WaitlistModel.countDocuments(q);
    } else {
      return (memStore.integrationWaitlist || []).filter(
        (w) => !provider || w.provider === provider
      ).length;
    }
  }
};

module.exports = IntegrationWaitlist;
