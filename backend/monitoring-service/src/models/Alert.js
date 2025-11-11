const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  plantId: {
    type: String,
    required: true,
    index: true
  },
  plantName: String,
  type: {
    type: String,
    enum: ['low-production', 'equipment-failure', 'maintenance-required', 'weather-warning', 'grid-issue'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active'
  },
  acknowledgedBy: {
    userId: mongoose.Schema.Types.ObjectId,
    userName: String,
    acknowledgedAt: Date
  },
  resolvedBy: {
    userId: mongoose.Schema.Types.ObjectId,
    userName: String,
    resolvedAt: Date,
    resolution: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Alert', alertSchema);