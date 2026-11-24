const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['general', 'billing', 'technical', 'api', 'abuse'],
    default: 'general'
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  ip: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const memTickets = [];

supportTicketSchema.statics.createTicket = async function (data) {
  const ticketId = 'TICK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const docData = { ...data, ticketId };

  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const ticket = await this.create(docData);
      return ticket;
    }
  } catch (_err) {
    // Fall back to memory
  }

  const record = {
    _id: 't_' + Date.now(),
    ...docData,
    status: 'open',
    createdAt: new Date()
  };
  memTickets.push(record);
  return record;
};

const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);

module.exports = SupportTicket;
