const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  predictionType: {
    type: String,
    enum: ['yield', 'weather', 'optimization'],
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Prediction', predictionSchema);