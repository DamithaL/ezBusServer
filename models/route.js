// models/route.js
const { mongoose } = require('../db');
const { v4: uuidv4 } = require("uuid");

const routeSchema = new mongoose.Schema({
  routeId: {type: String, unique: true, required: true ,  default: uuidv4 },
  routeNumber: { type: String, required: true },
  routeName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }

  // Add a reference to the 'routeStop' model
  //routeStops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RouteStop' }],
});



const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
