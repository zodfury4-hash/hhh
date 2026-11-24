const mongoose = require('mongoose');

const helpFeedbackSchema = new mongoose.Schema({
  articleSlug: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  helpful: {
    type: Boolean,
    required: true
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  ipHash: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

helpFeedbackSchema.index({ articleSlug: 1, ipHash: 1, createdAt: -1 });

// In-memory fallback
const memFeedback = [];

helpFeedbackSchema.statics.recordFeedback = async function ({ articleSlug, helpful, comment, ipHash }) {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      // 24h deduplication check
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await this.findOne({
        articleSlug,
        ipHash,
        createdAt: { $gte: dayAgo }
      });
      if (existing) {
        return { duplicate: true, feedback: existing };
      }
      const record = await this.create({ articleSlug, helpful, comment, ipHash });
      return { duplicate: false, feedback: record };
    }
  } catch (_err) {
    // Fall back to in-memory
  }

  // Memory fallback
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const existing = memFeedback.find(
    f => f.articleSlug === articleSlug && f.ipHash === ipHash && f.createdAt >= dayAgo
  );
  if (existing) {
    return { duplicate: true, feedback: existing };
  }
  const record = {
    _id: 'fb_' + Date.now().toString(36),
    articleSlug,
    helpful: Boolean(helpful),
    comment: comment || '',
    ipHash,
    createdAt: Date.now()
  };
  memFeedback.push(record);
  return { duplicate: false, feedback: record };
};

const HelpFeedback = mongoose.models.HelpFeedback || mongoose.model('HelpFeedback', helpFeedbackSchema);

module.exports = HelpFeedback;
