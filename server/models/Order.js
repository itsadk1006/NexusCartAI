const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  items: [
    {
      name: String,
      quantity: Number,
      unitPrice: Number
    }
  ],
  total: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    enum: ['AI_BUYER', 'HUMAN_CHAT'],
    default: 'AI_BUYER'
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);
