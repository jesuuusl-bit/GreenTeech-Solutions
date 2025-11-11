const mongoose = require('mongoose');

const productionDataSchema = new mongoose.Schema({
  plantId: {
    type: String,
    required: true,
    index: true
  },
  plantName: {
    type: String,
    required: true
  },
  plantType: {
    type: String,
    enum: ['solar', 'wind', 'hybrid'],
    required: true
  },
  location: {
    country: String,
    region: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  production: {
    current: {
      type: Number,
      required: true,
      default: 0
    },
    capacity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: 'MW'
    }
  },
  efficiency: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'offline', 'warning'],
    default: 'operational'
  },
  metrics: {
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    solarIrradiance: Number,
    voltage: Number,
    frequency: Number
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

productionDataSchema.index({ plantId: 1, timestamp: -1 });

module.exports = mongoose.model('ProductionData', productionDataSchema);