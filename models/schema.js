// models/bus.js
const { mongoose } = require("../db"); // Import mongoose from db.js
const { v4: uuidv4 } = require("uuid");

//------------------------------------- BUS --------------------------------------------------//

//------------ Bus Fleet Details ------------//
const busFleetSchema = new mongoose.Schema({
	fleetId: { type: String, default: uuidv4(), unique: true, required: true },
	fleetName: { type: String, required: true },
	fleetRegistered: { type: Boolean, default: false },
	fleetRegistrationNumber: { type: String, unique: true, required: true },
	timestamp: { type: Date, default: Date.now },
});

const BusFleet = mongoose.model("BusFleet", busFleetSchema);

//------------ Bus Details ------------//
const busSchema = new mongoose.Schema({
	busId: { type: String, default: uuidv4(), unique: true, required: true },
	busNumber: { type: String, unique: true, required: true },
	busFleetId: { type: String, required: true },
	busManagerId: { type: String, required: true },
	busConductorId: { type: String, unique: true },
	routeId: { type: String, required: true },
	busColor: { type: String, required: true },
	emergencyNumber: { type: String, required: true },
	timestamp: { type: Date, default: Date.now },
});

const Bus = mongoose.model("Bus", busSchema);

//------------ Bus Location ------------//
const busLocationSchema = new mongoose.Schema({
	busId: { type: String, unique: true, required: true },
	location: {
		latitude: { type: Number, required: true },
		longitude: { type: Number, required: true },
	},
	direction: { type: String, required: true }, // Add direction property
	timestamp: { type: Date, default: Date.now },
});

const BusLocation = mongoose.model("BusLocation", busLocationSchema);

//-------------------------------------------------- PERSONS --------------------------------------------------//

//------------ Manager ------------//
const managerSchema = new mongoose.Schema({
	managerId: { type: String, default: uuidv4(), unique: true, required: true },
	busFleetId: { type: String, default: uuidv4(), unique: true, required: true },
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
		default: uuidv4(),
		unique: true,
		required: true,
	},
	email: { type: String, unique: true, required: true }, // this email is authorised by Bus Manager. Manager can give or remove permission
	busId: { type: String, default: null },
	name: { type: String, required: true },
	password: { type: String, required: true },
	isVerified: { type: Boolean, default: false },
	timestamp: { type: Date, default: Date.now },
});

const Conductor = mongoose.model("Conductor", conductorSchema);

//------------ Passenger ------------//
const userSchema = new mongoose.Schema({
	id: { type: String, default: uuidv4(), unique: true, required: true },
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
