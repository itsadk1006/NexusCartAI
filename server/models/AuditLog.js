const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  userQuery: { type: String, required: true },
  spendLimit: { type: Number, required: true },
  calculatedTotal: { type: Number, required: true },
  status: { type: String, enum: ['APPROVED', 'HITL_TRIGGERED', 'BLOCKED'], required: true },
  trace: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
