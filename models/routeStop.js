// models/routeStop.js
const { mongoose } = require('../db');

const routeStopSchema = new mongoose.Schema({
  routeId: {type: String, ref: 'Route', required: true },
  stopId: { type: String, ref: 'BusStop', required: true },
  sequenceNumber: { type: Number, required: true },
  fareLevel: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Define a unique compound index to enforce the uniqueness of the pair (routeId, stopId)
//routeStopSchema.index({ routeId: 1, stopId: 1 }, { unique: true });

const RouteStop = mongoose.model('RouteStop', routeStopSchema);

module.exports = RouteStop;
