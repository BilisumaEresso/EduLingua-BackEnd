const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['auth', 'content', 'security', 'system', 'quiz', 'chat'],
    default: 'system'
  },
  action: { type: String, required: true },
  message: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

// TTL Index to automatically delete logs older than 30 days
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
