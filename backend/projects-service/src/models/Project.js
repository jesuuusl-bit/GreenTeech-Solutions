const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del proyecto es requerido'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['solar', 'wind', 'hybrid'],
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  location: {
    country: String,
    region: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  capacity: {
    value: Number,
    unit: {
      type: String,
      enum: ['MW', 'GW', 'kW'],
      default: 'MW'
    }
  },
  budget: {
    allocated: Number,
    spent: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
  },
  dates: {
    start: Date,
    estimatedEnd: Date,
    actualEnd: Date
  },
  manager: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String
  },
  team: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    role: String
  }],
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  milestones: [{
    name: String,
    description: String,
    dueDate: Date,
    completed: { type: Boolean, default: false },
    completedDate: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);