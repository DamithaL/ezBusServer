// models/bus.js
const { mongoose } = require('../db'); // Import mongoose from db.js

const busSchema = new mongoose.Schema({
  busId: { type: String, unique: true, required: true },
  busNumber: { type: String, unique: true },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  routeId: { type: String },
  busColor: { type: String },
  direction: { type: String }, // Add direction property
  timestamp: { type: Date, default: Date.now }
},
);

const Bus = mongoose.model('Bus', busSchema);

module.exports = Bus;
