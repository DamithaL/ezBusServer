// location.js
const express = require("express");
const router = express.Router();
const geolib = require("geolib");

const { BusFleet, BusLocation, Bus } = require("./models/schema"); // Assuming your bus model is in a 'models' directory
const e = require("express");

router.use(express.json());

//--------------------------------------- UPDATE LOCATIONS ---------------------------------------//
// Location update new endpoint

router.post("/update", async (req, res) => {
	console.log(`Bus location update received`);
	console.log("Request Body:", JSON.stringify(req.body));

	try {
		// // Verify JWT token for authentication (example)
		// const token = req.header('Authorization');
		// if (!token) {
		//     return res.status(401).json({ message: 'Unauthorized - No token provided' });
		// }

		// // Decode the token to get user information (example)
		// const decoded = jwt.verify(token, 'your-secret-key');
		// const { busId } = decoded;

		// Get location data from the request body
		const { busRegNumber, latitude, longitude } = req.body;

		const bus = await Bus.findOne({ busRegNumber });

		if (!bus) {
			console.log(`Bus not found for the given bus number ${busRegNumber}`);
			return res.status(404).json({ message: "Bus not found" });
		}

		const filter = { busRegNumber: bus.busRegNumber };
		const update = {
			$set: {
				location: { latitude, longitude },
				direction: "citybound", // Replace with the actual direction or get it from bus data
			},
		};
		const options = { upsert: true, new: true };

		const updatedBusLocation = await BusLocation.findOneAndUpdate(
			filter,
			update,
			options
		);

		console.log(
			`Bus location ${
				updatedBusLocation ? "updated" : "created"
			} successfully for bus number ${bus.busRegNumber}`
		);

		res.status(200).json({
			message: `Bus location ${
				updatedBusLocation ? "updated" : "created"
			} successfully`,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
});

//--------------------------------------- FETCH LOCATIONS ---------------------------------------//

//------------ BY ROUTE ------------//
router.get("/fetch-buses/:routeNumber/:routeName", async (req, res) => {
	try {
		const routeNumber = req.params.routeNumber;
		const routeName = req.params.routeName;
		console.log(`Request received for route  ${routeNumber}:${routeName}`);
		// Find buses with the specified routeId
		const busesOnRoute = await Bus.find({
			busRouteNumber: routeNumber,
			busRouteName: routeName,
		});

		if (!busesOnRoute || busesOnRoute.length === 0) {
			console.log(
				`Buses not found for the given route ${routeNumber} : ${routeName}`
			);
			return res
				.status(404)
				.json({ message: "No buses available on the route currently." });
		} else {
			console.log(
				`Buses found for the given route ${routeNumber} : ${routeName}`
			);
			// Map the buses to the desired format (BusLocationModel)
			const busLocations = await Promise.all(
				busesOnRoute.map(async (eachBus) => {
					const mostRecentLocation = await BusLocation.findOne({
						busRegNumber: eachBus.busRegNumber,
					}) // Use bus.busRegNumber instead of just busRegNumber
						.sort({ timestamp: -1 })
						.limit(1)
						.exec();
					try {
						if (!mostRecentLocation) {
							console.log(`No location found for bus ${eachBus.busRegNumber}`);
							return null;
						}
						const bus = {
							busRegNumber: eachBus.busRegNumber,
							busRouteNumber: eachBus.busRouteNumber,
							busRouteName: eachBus.busRouteName,
							busColor: eachBus.busColor,
						};

						const location = mostRecentLocation.location;
						const timeStamp = mostRecentLocation.timestamp;

						return {
							bus,
							location,
							timeStamp,
						};
					} catch (err) {
						console.error(
							`Error while fetching bus location for bus number ${eachBus.busRegNumber}:`,
							err
						);
						return null; // Handle the error gracefully, returning null for this bus
					}
				})
			);

			// Filter out null values
			const filteredBusLocations = busLocations.filter(
				(location) => location !== null
			);

			if (filteredBusLocations.length === 0) {
				console.log(`No buses available on the route currently.`);
				return res
					.status(404)
					.json({ message: "No buses available on the route currently." });
			} else {
				console.log(`Buses found: ${JSON.stringify(filteredBusLocations)}`);
				console.log("Sent found bus details");
				return res.status(200).json(filteredBusLocations);
			}
		}
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: error.message });
	}
});

//------------ BY BUS REG NUMBERS [LIST] ------------//
router.post("/get-updated-locations", async (req, res) => {
	try {
		// Get bus reg numbers from the request body
		const busRegNumbers = req.body;

		console.log(`Request received for updated bus locations`);
		console.log("Request Body:", JSON.stringify(req.body));

		// Map the buses to the desired format (BusLocationModel)

		const busLocations = await Promise.all(
			busRegNumbers.map(async (busRegNumber) => {
				const mostRecentLocation = await BusLocation.findOne({
					busRegNumber: busRegNumber,
				}) // Use bus.busRegNumber instead of just busRegNumber
					.sort({ timestamp: -1 })
					.limit(1)
					.exec();
				try {
					if (!mostRecentLocation) {
						console.log(`No location found for bus ${busRegNumber}`);
						return null;
					}
					const bus = {
						busRegNumber: busRegNumber,
					};

					const location = mostRecentLocation.location;
					const timeStamp = mostRecentLocation.timestamp;

					return {
						bus,
						location,
						timeStamp,
					};
				} catch (err) {
					console.error(
						`Error while fetching bus location for bus number ${busRegNumber}:`,
						err
					);
					return null; // Handle the error gracefully, returning null for this bus
				}
			})
		);

		// Filter out null values
		const filteredBusLocations = busLocations.filter(
			(location) => location !== null
		);

		if (filteredBusLocations.length === 0) {
			console.log(`No buses available on the route currently.`);
			return res
				.status(404)
				.json({ message: "No buses available on the route currently." });
		} else {
			console.log(`Buses found: ${JSON.stringify(filteredBusLocations)}`);
			console.log("Sent found bus details");
			return res.status(200).json(filteredBusLocations);
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
});

// For Calculating if the bus has passeda a stop or not
router.get("/is-bus-gone/:routeId/:selectedStopId", async (req, res) => {
	try {
		const routeId = req.params.routeId;
		const selectedStopId = req.params.selectedStopId;

		// Find the bus stops for the specified route and their sequence order
		const routeStops = await RouteStop.find({ routeId }).sort(
			"sequence_number"
		);

		// Get the index of the selected bus stop in the route
		const selectedStopIndex = routeStops.findIndex(
			(stop) => stop.stopId.toString() === selectedStopId
		);

		if (selectedStopIndex === -1) {
			return res
				.status(404)
				.json({ message: "Selected bus stop not found on the route" });
		}

		// Find buses on the specified route
		const busesOnRoute = await Bus.find({ routeId });

		// Determine the status of each bus at the selected bus stop
		const busesWithStatus = busesOnRoute.map((bus) => {
			// Assuming bus.location contains latitude and longitude
			const busLocation = bus.location;

			// Check if the bus has passed the selected bus stop
			const hasBusPassedBusStop = busHasPassedStop(
				busLocation,
				routeStops,
				selectedStopIndex
			);

			return {
				busId: bus.busId,
				location: busLocation,
				hasBusPassedBusStop,
			};
		});

		res.status(200).json(busesWithStatus);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
});

// Helper function to check if a bus has passed a specific bus stop
function busHasPassedStop(busLocation, routeStops, selectedStopIndex) {
	const distanceThreshold = 100; // Set an appropriate distance threshold in meters

	for (let i = 0; i < selectedStopIndex; i++) {
		const stopLocation = routeStops[i].location;
		const distance = calculateDistance(busLocation, stopLocation);

		if (distance <= distanceThreshold) {
			return true; // Bus has passed the selected bus stop
		}
	}

	return false; // Bus has not passed the selected bus stop
}

// Helper function to calculate distance between two points using geolib
function calculateDistance(location1, location2) {
	const distance = geolib.getDistance(location1, location2);

	return distance;
}

module.exports = router;
