// models/route.js
const { mongoose } = require('../db');

const routeSchema = new mongoose.Schema({
  routeId: { type: String, unique: true, required: true },
  routeName: { type: String, required: true },

  // Add a reference to the 'routeStop' model
  //routeStops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RouteStop' }],
});

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
