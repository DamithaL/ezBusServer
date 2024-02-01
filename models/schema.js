// models/bus.js
const { mongoose } = require("../db"); // Import mongoose from db.js
const Route = require("./route");
const { v4: uuidv4 } = require("uuid");


//------------------------------------- BUS --------------------------------------------------//

//------------ Bus Fleet Details ------------//
const busFleetSchema = new mongoose.Schema({
	fleetId: { type: String, unique: true, required: true, default: uuidv4 },
	managerId: { type: String, ref: "Manager", required: true },
	fleetName: { type: String, required: true },
	fleetStatus: { type: String, required: true },
	fleetRegistrationNumber: { type: String, unique: true, required: true },
	notes: { type: String },
	timestamp: { type: Date, default: Date.now },
});

const BusFleet = mongoose.model("BusFleet", busFleetSchema);

//------------ Bus Details ------------//
const busSchema = new mongoose.Schema({
	busId: { type: String, unique: true, required: true, default: uuidv4 },
	busNickName: { type: String, required: true },
	busRegNumber: { type: String, unique: true, required: true },
	busFleetId: { type: String, ref: "BusFleet", required: true },
	busManagerId: { type: String, ref: "Manager", required: true },
	busConductorEmail: { type: String, ref: "Conductor"},
	//busConductorId: { type: String, ref: "Conductor" },
	//busRouteId: { type: String, required: true },
	busRouteNumber: { type: String, required: true },
	busRouteName: { type: String, required: true },
	busColor: { type: String, required: true },
	busEmergencyNumber: { type: String, required: true },
	timestamp: { type: Date, default: Date.now },
});

const Bus = mongoose.model("Bus", busSchema);

//------------ Bus Location ------------//
const busLocationSchema = new mongoose.Schema({
	busRegNumber: { type: String, ref: "Bus", required: true },
	location: {
		latitude: { type: Number, required: true },
		longitude: { type: Number, required: true },
	},
	direction: { type: String, required: true }, // Add direction property
	timestamp: { type: Date, default: Date.now },
});

// Add TTL index to automatically remove documents after a specified duration (e.g., 1 hour)
busLocationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 3600 });
const BusLocation = mongoose.model("BusLocation", busLocationSchema);

//-------------------------------------------------- PERSONS --------------------------------------------------//

//------------ Manager ------------//
const managerSchema = new mongoose.Schema({
	managerId: { type: String, unique: true, required: true, default: uuidv4 },
	email: { type: String, unique: true, required: true }, // this email is authorised by Bus Manager. Manager can give or remove permission
	name: { type: String, required: true },
	password: { type: String, required: true },
	isVerified: { type: Boolean, default: false },
	timestamp: { type: Date, default: Date.now },
});

const Manager = mongoose.model("Manager", managerSchema);

//------------ Conductor ------------//
const conductorSchema = new mongoose.Schema({
	conductorId: {
		type: String,
		default: uuidv4,
		unique: true,
		required: true,
	},
	email: { type: String, unique: true, required: true }, // this email is authorised by Bus Manager. Manager can give or remove permission
	name: { type: String, required: true },
	password: { type: String, required: true },
	isVerified: { type: Boolean, default: false },
	timestamp: { type: Date, default: Date.now },
});

const Conductor = mongoose.model("Conductor", conductorSchema);

//------------ Passenger ------------//
const userSchema = new mongoose.Schema({
	id: { type: String,  unique: true, required: true,  default: uuidv4  },
	email: { type: String, unique: true, required: true },
	name: { type: String, required: true },
	password: { type: String, required: true },
	isVerified: { type: Boolean, default: false },
	timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

//-------------------------------------------------- EXPORTS --------------------------------------------------//

module.exports = {
	BusLocation,
	Bus,
	BusFleet,
	Conductor,
	Manager,
	User,
};
