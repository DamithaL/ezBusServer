/*
bus.js
For bus account related APIs: 
		Bus fleet registration
		Bus fleet verification/suspension
		Bus fleet registration status check
		
		Bus account creation
		Bus conductor assignment
		
		Bus emergency notification

		(Bus location update is on location.js for more clarity)
		*/

const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const uuid = require("uuid");
const fs = require("fs");
const path = require("path");
const Route = require("./models/route");

const { mongoose } = require("./db"); // Import mongoose from db.js
const { ObjectId } = mongoose.Types;
const saltRounds = 12;

const router = express.Router();
router.use(bodyParser.json());

const { Conductor, Manager, User, BusFleet, Bus } = require("./models/schema");

//--------------------------------------- HELPER FUNCTIONS ---------------------------------------//

//------------ read the HTML template file ------------//
const readHTMLTemplate = (verificationCode) => {
	verificationCode = String(verificationCode);

	if (typeof verificationCode !== "string") {
		throw new Error("Verification code must be a string");
	}

	const filePath = path.join(__dirname, "verificationEmail.html");
	let htmlTemplate = fs.readFileSync(filePath, "utf8");
	//htmlTemplate = htmlTemplate.replace('{{verificationCode}}', verificationCode);

	// Replace the placeholders with the actual characters
	for (let i = 0; i < 6; i++) {
		htmlTemplate = htmlTemplate.replace(`{{${i}}}`, verificationCode.charAt(i));
	}

	return htmlTemplate;
};

//------------ send new bus fleet registration email ------------//
const sendNotificationEmail = async (email, notification) => {
	console.log("sendNotificationEmail: started");

	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: "ezbus.srilanka@gmail.com",
			pass: "zpaj bgob mttc pumz",
		},
	});

	console.log("sendNotificationEmail: transporter started");

	const htmlTemplate = readHTMLTemplate(verificationCode);

	const mailOptions = {
		from: "ezbus.srilanka@gmail.com",
		to: email,
		subject: "Verify your | EZBus Passenger | account",
		html: htmlTemplate,
	};

	console.log("\nsendVerificationEmail: mailOptions started");

	await transporter.sendMail(mailOptions);
	console.log("Verification email sent to: " + email);
};

//------------------------------------- BUS FLEET -------------------------------------//

//---------------- create bus fleet - for Bus Managers ----------------//
router.post("/register/busfleet", async (req, res) => {
	console.log("a bus fleet registration request received");
	try {
		const { fleetName, fleetRegistrationNumber, managerEmail } = req.body;
		console.log(
			"request body: " +
				"fleetName: " +
				fleetName +
				", fleetRegistrationNumber: " +
				fleetRegistrationNumber +
				", managerEmail: " +
				managerEmail
		);

		// Check if the manager is registered
		const manager = await Manager.findOne({ email: managerEmail });

		if (manager) {
			// Check if the manager email is verified
			if (manager.isVerified) {
				console.log("Manager is verified");

				// Find the Bus Fleet by Manager ID
				const busFleet = await BusFleet.findOne({
					managerId: manager.managerId,
				});

				if (busFleet) {
					// bus fleet registration request is already available
					console.log("Bus fleet registration request is already available");

					if (busFleet.fleetStatus == "Approved") {
						console.log("Bus fleet is already registered");

						const objToSend = {
							busFleet: busFleet,
							message: "Bus fleet is already registered",
						};
						// if it is 208, manager app should show a message saying "Bus fleet already registered" and load the bus fleet account
						return res.status(201).send(JSON.stringify(objToSend));
					} else if (busFleet.fleetStatus == "Suspended") {
						console.log("Bus fleet is suspended");
						const objToSend = {
							busFleet: busFleet,
							message: "Bus fleet is suspended",
						};
						// if it is 403, manager app should show a message saying "Bus fleet is suspended"
						return res.status(204).send(JSON.stringify(objToSend));
					} else if (busFleet.fleetStatus == "Pending") {
						console.log("Bus fleet registration request is pending");
						const objToSend = {
							busFleet: busFleet,
							message: "Bus fleet registration request is pending",
						};
						// if it is 406, manager app should show a message saying "Bus fleet registration request is pending"
						return res.status(202).send(JSON.stringify(objToSend));
					} else if (busFleet.fleetStatus == "Rejected") {
						console.log("Bus fleet registration request rejected");

						const pendingBusFleet = await BusFleet.findOneAndUpdate(
							{ managerId: manager.managerId },
							{
								$set: {
									fleetName,
									fleetRegistrationNumber,
									fleetStatus: "Pending",
									timestamp: Date.now(),
								},
							},
							{ new: true }
						);

						console.log(pendingBusFleet);

						// SEND EMAIL NOTIFICATION

						// Send a response
						console.log("Bus fleet registration request updated.");
						objToSend = {
							busFleet: pendingBusFleet,
							message: "Bus fleet registration request updated.",
						};
						return res.status(202).send(JSON.stringify(objToSend));
					}
				} else {
					const existingBusFleet = await BusFleet.findOne({
						fleetRegistrationNumber,
					});

					if (existingBusFleet) {
						// bus fleet registration request is already available for different manager
						console.log("Incorrect bus fleet registration number");
						return res
							.status(405)
							.json({ message: "Incorrect bus fleet registration number" });
					} else {
						// Create a new Bus fleet
						console.log("manager.managerId: " + manager.managerId);
						const newBusFleet = new BusFleet({
							fleetName,
							fleetRegistrationNumber,
							fleetStatus: "Pending",
							managerId: manager.managerId,
						});
						console.log("Bus fleet created successfully");

						// Save the Bus fleet to the database
						await newBusFleet.save();
						console.log("newBusFleet: " + JSON.stringify(newBusFleet));

						// Send notification email to the manager about the new bus fleet registration request
						// try {
						// 	// Send verification email
						// 	await sendVerificationEmail(newUser.email, verificationCode);
						// 	console.log(
						// 		"sendVerificationEmail Done: " +
						// 			"email: " +
						// 			newUser.email +
						// 			" verificationToken: " +
						// 			verificationCode
						// 	);

						// } catch (error) {
						// 	console.log(error);
						// }

						objToSend = {
							busFleet: newBusFleet,
							message: "Bus fleet registration request received",
						};
						return res.status(200).send(JSON.stringify(objToSend));
					}
				}
			} else {
				console.log("Manager is not verified");
				return res.status(406).send("Manager is not verified");
			}
		} else {
			console.log("Manager not found");
			return res.status(404).send("Manager not found");
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: error.message });
	}
});

//---------------- verify bus fleet registration - for Admin ----------------//

// Endpoint to update bus fleet registration request
router.post("/verify/busfleet", async (req, res) => {
	const { fleetRegistrationNumber, fleetStatus, notes } = req.body;

	// Find the bus fleet by fleetRegistrationNumber
	const busFleet = await BusFleet.findOne({ fleetRegistrationNumber });

	// Check if the bus fleet exists
	if (!busFleet) {
		console.log("Bus fleet not found.");
		return res.status(404).json({ error: "Bus fleet not found." });
	} else {
		const verifiedBusFleet = await BusFleet.findOneAndUpdate(
			{ fleetRegistrationNumber },
			{
				$set: {
					fleetStatus: fleetStatus,
					notes: notes,
					timestamp: Date.now(),
				},
			},
			{ new: true }
		);

		console.log(verifiedBusFleet);

		// SEND EMAIL NOTIFICATION

		// Send a response
		console.log("Bus fleet registration status updated.");
		return res.status(200).json({
			message: "Bus fleet registration status updated.",
		});
	}
});

//---------------- checking bus fleet registration request status - for Bus Managers ----------------//

// Endpoint to check the bus fleet registration request status
router.post("/check/busfleet-status", async (req, res) => {
	console.log("a bus fleet registration request status check request received");
	const { email } = req.body;

	// Step 1: Find the Manager by Email
	Manager.findOne({ email })
		.exec()
		.then((manager) => {
			if (!manager) {
				// manager with the given email is not found
				console.log("Manager not found");
				return res.status(404).send("Manager not found");
			}

			// Step 2: Find the Bus Fleet by Manager ID
			BusFleet.findOne({ managerId: manager.managerId })
				.exec()
				.then((busFleet) => {
					if (!busFleet) {
						// no bus fleet is associated with the manager
						console.log("No bus fleet found for the manager");
						return res.status(404).send("No bus fleet found for the manager");
					}

					// Bus fleets associated with the manager
					console.log("Bus fleet associated with the manager:", busFleet);

					// Step 3: Check the bus fleet status
					if (busFleet.fleetStatus == "Approved") {
						console.log("Bus fleet is approved");
						// if it is 208, manager app should show a message saying "Bus fleet is approved" and load the bus fleet account
						objToSend = {
							busFleet: busFleet,
							message: "Bus fleet is approved",
						};
						return res.status(201).send(JSON.stringify(objToSend));
					} else if (busFleet.fleetStatus == "Suspended") {
						console.log("Bus fleet is suspended");
						// if it is 403, manager app should show a message saying "Bus fleet is suspended"
						objToSend = {
							busFleet: busFleet,
							message: "Bus fleet is suspended",
						};
						return res.status(204).send(JSON.stringify(objToSend));
					} else if (busFleet.fleetStatus == "Pending") {
						console.log("Bus fleet registration request is pending");
						// if it is 406, manager app should show a message saying "Bus fleet registration request is pending"
						objToSend = {
							busFleet: busFleet,
							message: "Bus fleet registration request is pending",
						};
						return res.status(202).send(JSON.stringify(objToSend));
					} else if (busFleet.fleetStatus == "Rejected") {
						console.log("Bus fleet registration request rejected");
						// if it is 401, manager app should show a message saying "Bus fleet registration request rejected"
						objToSend = {
							busFleet: busFleet,
							message: "Bus fleet registration request rejected",
						};
						return res.status(203).send(JSON.stringify(objToSend));
					}
				})
				.catch((error) => {
					// Handle error in finding bus fleets
					console.error("Error finding bus fleets:", error);
					return res.status(500).send("Error finding bus fleets");
				});
		})
		.catch((error) => {
			// Handle error in finding manager
			console.error("Error finding manager:", error);
			return res.status(500).send("Error finding manager");
		});
});

//------------------------------------- BUS ACCOUNT -------------------------------------//

//---------------- create bus account - for Bus Managers ----------------//
router.post("/register/busaccount", async (req, res) => {
	console.log("a bus account creation request received");
	try {
		// request body has a nested object called "bus", fleetRegistrationNumber and managerEmail. access all of them including nested object
		const {
			bus: {
				busNickName,
				busRegNumber,
				busRouteNumber,
				busRouteName,
				busColor,
				busEmergencyNumber,
			},
			fleetRegistrationNumber,
			managerEmail,
		} = req.body;

		console.log(
			"request body: " +
				"busNickName: " +
				busNickName +
				", busRegNumber: " +
				busRegNumber +
				", busRouteNumber: " +
				busRouteNumber +
				", busRouteName: " +
				busRouteName +
				", busColor: " +
				busColor +
				", busEmergencyNumber: " +
				busEmergencyNumber +
				", fleetRegistrationNumber: " +
				fleetRegistrationNumber +
				", managerEmail: " +
				managerEmail
		);

		const existingBus = await Bus.findOne({ busRegNumber });

		if (existingBus) {
			console.log("Busa ccount is already registered");
			return res
				.status(409)
				.json({ message: "Bus account is already registered" });
		}

		// Check if the manager is registered
		const manager = await Manager.findOne({ email: managerEmail });

		if (manager) {
			// Check if the manager email is verified
			if (manager.isVerified) {
				console.log("Manager is verified");

				const existingBusFleet = await BusFleet.findOne({
					fleetRegistrationNumber,
				});

				// Check if the bus fleet is already requested the registration
				if (existingBusFleet) {
					console.log("Bus fleet found");

					// Check if the bus fleet is already registered
					if (existingBusFleet.fleetStatus == "Approved") {
						console.log("Bus fleet is approved");

						// const route = await Route.findOne({
						// 	routeNumber,
						// 	routeName,
						// });

						const route = await Route.findOne({
							$and: [
								{
									routeNumber: {
										$regex: new RegExp("^" + busRouteNumber + "$", "i"),
									},
								},
								{
									routeName: {
										$regex: new RegExp("^" + busRouteName + "$", "i"),
									},
								},
							],
						});

						if (!route) {
							console.log("Route not found.");
							return res.status(404).send("Route not found.");
						}

						// Create a new Bus fleet
						const newBusAccount = new Bus({
							busNickName,
							busRegNumber,
							busFleetId: existingBusFleet.fleetId,
							busManagerId: manager.managerId,
							busRouteNumber,
							busRouteName,
							busColor,
							busEmergencyNumber,
						});
						console.log("Bus account created successfully");

						// Save the Bus fleet to the database
						await newBusAccount.save();
						console.log("newBusAccount: " + JSON.stringify(newBusAccount));

						return res
							.status(201)
							.json({ message: "Bus account created successfully" });
					} else {
						console.log("Bus fleet is not approved yet");
						return res
							.status(406)
							.json({ message: "Bus fleet is not approved yet" });
					}
				} else {
					console.log("Bus fleet not found");

					return res.status(404).json({ message: "Bus fleet not found" });
				}
			} else {
				console.log("Manager is not verified");
				return res.status(406).send("Manager is not verified");
			}
		} else {
			console.log("Manager not found");
			return res.status(404).send("Manager not found");
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: error.message });
	}
});

//---------------- login bus account - for Bus Conductors ----------------//

router.post("/login/bus-account", async (req, res) => {

	// Get bus details from the request body
	const { email } = req.body;

	// Check if the bus account is registered
	const existingBus = await Bus.findOne({ busConductorEmail: email });

	if (!existingBus) {

		console.log("Bus account not found.");

		return res.status(404).send("Bus account not found.");

	}

	const { busNickName, busRegNumber, busRouteNumber, busRouteName, busEmergencyNumber, busColor } = existingBus;

	const bus = {
		busNickName,
		busRegNumber,
		busRouteNumber,
		busRouteName,
		busEmergencyNumber,
		busColor
	};

	console.log("Found bus: " + bus);
	return res.status(200).json({bus});

});

//---------------- Update bus account - for Bus Managers ----------------//

// Used for assign bus conductor to a bus account

router.post("/update/busaccount", async (req, res) => {
	console.log("a bus conductor assignment request received");
	try {
		const { busRegNumber, busConductorEmail } = req.body;
		console.log(
			"request body: " +
				"busRegNumber: " +
				busRegNumber +
				", busConductorEmail: " +
				busConductorEmail
		);

		// Check if the bus account is registered
		const bus = await Bus.findOne({ busRegNumber });

		if (bus) {
			// check if this conductor email is already assigned to a different bus
			const isConductorEmailAlreadyAssignedToDifferentBus = await Bus.exists({
				busConductorEmail,
				_id: { $ne: bus._id },
			});

			if (isConductorEmailAlreadyAssignedToDifferentBus) {
				console.log(
					"Conductor email is already assigned to a different bus account"
				);
				return res.status(409).json({
					message:
						"This email is already linked to another bus account.",
				});
			}

			// Assign the conductor to the bus account
			const updatedBus = await Bus.findOneAndUpdate(
				{ busRegNumber },
				{
					$set: {
						busConductorEmail: busConductorEmail,
						timestamp: Date.now(),
					},
				},
				{ new: true }
			);

			console.log(updatedBus);

			// SEND EMAIL NOTIFICATION TO CONDUCTOR

			// Send a response
			console.log("Bus account updated successfully");
			return res.status(200).json({
				message: "Bus account updated successfully",
			});
		} else {
			console.log("Bus account not found");
			return res.status(404).send("Bus account not found");
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: error.message });
	}
});

//---------------- emergency notification - for Bus Conductors ----------------//

router.post("/emergency", async (req, res) => {
	// Get bus details from the request body
	const { busRegNumber, latitude, longitude } = req.body;

	// Check if the bus account is registered
	const bus = await Bus.findOne({ busRegNumber });

	if (!bus) {
		console.log("Bus account not found.");
		return res.status(404).send("Bus account not found.");
	}

	const { busManagerId, routeId, busConductorId, emergencyNumber } = bus;

	// Find the manager by manager ID
	const manager = await Manager.findOne({ managerId: busManagerId });

	if (!manager) {
		console.log("Manager not found.");
		//return res.status(404).send("Manager not found.");
	}

	busConductor = await Conductor.findOne({ conductorId: busConductorId });

	if (!busConductor) {
		console.log("Bus conductor not found.");
		//return res.status(404).send("Bus conductor not found.");
	}

	route = await Route.findOne({ routeId: routeId });

	if (!route) {
		console.log("Route not found.");
		//return res.status(404).send("Route not found.");
	}

	busFleet = await BusFleet.findOne({ fleetId: bus.busFleetId });

	if (!busFleet) {
		console.log("Bus fleet not found.");
		//return res.status(404).send("Bus fleet not found.");
	}

	// NOTIFY EMERGENCY CONTACT
	// send SMS notification to emergency contact
	// bus fleet name, bus number, route number, route name, bus condutor name, location, time

	// SEND EMAIL NOTIFICATION TO MANAGER
	// send Email notification to bus manager email
	// bus fleet name, bus number, route number, route name, bus condutor name, location, time

	res.status(200).json({ message: "Emergency contacts notified successfully" });
});

//------------------------------------- ROUTES TO FETCH DATA -------------------------------------//

//---------------- get bus fleet details - for Admin ----------------//
router.get("/get/busfleet", async (req, res) => {
	try {
		const busFleetData = await BusFleet.find();
		res.json(busFleetData);
	} catch (error) {
		console.error("Error fetching bus fleet data:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

const routeNumbers = ["120", "122", "138", "154", "221"]; // Replace with your actual route data

const routeNames = [
	{ routeNumber: "120", name: "Horana-Colombo" },
	{ routeNumber: "138", name: "Maharagama-Colombo" },
	{ routeNumber: "120", name: "Padukka-Colombo" },
	{ routeNumber: "154", name: "Boralla-Colombo" },
	{ routeNumber: "154", name: "Angulana-Kiribathgoda" },
	{ routeNumber: "221", name: "Nittambuwa-Giriulla" },
];

//---------------- get route numbers - for Managers ----------------//
router.get("/fetch/route-numbers", (req, res) => {
	return res.json(routeNumbers);
});

//---------------- get route names - for Managers ----------------//
router.post("/fetch/route-names", (req, res) => {
	console.log("a route name fetch request received");
	try {
		const { routeNumber } = req.body;
		console.log("request body: " + "routeNumber: " + routeNumber);

		if (!routeNumber || routeNumber === "") {
			console.log("Route number not provided: ", routeNames);
			return res.json(routeNames.map((routeName) => routeName.name));
		}

		// Filter the route names based on the route number
		const filteredRouteNames = routeNames
			.filter((routeName) => routeName.routeNumber === routeNumber)
			.map((routeName) => routeName.name);

		// Send the filtered route names
		console.log("filteredRouteNames: ", filteredRouteNames);
		return res.json(filteredRouteNames);
	} catch (error) {
		console.error("Error fetching route names:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
});

//---------------- fetching specific bus fleet bus accounts - for Bus Managers ----------------//

//---------------- fetch all the buses in a fleet - for Managers ----------------//
router.post("/fetch/all-buses", async (req, res) => {
	console.log("a bus fleet buses fetch request received");
	const { fleetRegistrationNumber } = req.body;

	console.log(
		"request body: " + "fleetRegistrationNumber: " + fleetRegistrationNumber
	);
	// Find the bus fleet by fleetRegistrationNumber
	const busFleet = await BusFleet.findOne({ fleetRegistrationNumber });

	// Check if the bus fleet exists
	if (!busFleet) {
		console.log("Bus fleet not found.");
		return res.status(404).json({ error: "Bus fleet not found." });
	}

	// Find all the buses in the bus fleet
	const buses = await Bus.find({ busFleetId: busFleet.fleetId });

	//console.log(buses);

	// Send a response
	console.log("Bus fleet buses sent successfully");
	return res.status(200).json(buses);
});






module.exports = router;
