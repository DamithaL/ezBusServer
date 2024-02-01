// models/busStop.js
const { mongoose } = require("../db");
const { v4: uuidv4 } = require("uuid");

const busStopSchema = new mongoose.Schema({
	stopId: { type: String, unique: true, required: true, default: uuidv4 },
	stopName: { type: String, required: true },
	location: {
		latitude: { type: Number },
		longitude: { type: Number },
	},
	timestamp: { type: Date, default: Date.now },

	// Add a reference to the 'routeStop' model
	//stopRoutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RouteStop' }],
});

const BusStop = mongoose.model("BusStop", busStopSchema);

module.exports = BusStop;
