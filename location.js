// location.js
const express = require('express');
const router = express.Router();
const geolib = require('geolib');

const Bus = require('./models/bus'); // Assuming your bus model is in a 'models' directory

router.use(express.json());


// Endpoint to create a new bus
router.post('/create-bus', async (req, res) => {
  try {
    //   // Verify JWT token for authentication (example)
    //   const token = req.header('Authorization');
    //   if (!token) {
    //     return res.status(401).json({ message: 'Unauthorized - No token provided' });
    //   }

    //   // Decode the token to get user information (example)
    //   const decoded = jwt.verify(token, 'your-secret-key');
    //   const { userId } = decoded; // Assuming the user's ID is stored in the token

    // Get bus details from the request body
    const { busId, busNumber, routeId, busColor/* other bus details */ } = req.body;

    // Check if the bus with the given ID already exists
    const existingBus = await Bus.findOne({ busId });

    if (existingBus) {
      return res.status(409).json({ message: 'Bus already exists' });
    }

    // Create a new bus
    const newBus = new Bus({
      busId, busNumber, routeId, busColor
      // Add other bus details to the model as needed
    });

    // Save the new bus to the database
    await newBus.save();

    res.status(201).json({ message: 'Bus created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Set bus location
router.post('/set-location', async (req, res) => {
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
    const { busId, latitude, longitude } = req.body;

    const bus = await Bus.findOne({ busId: busId });

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Save bus location to the database
    // Assuming you have a 'location' field in your bus model
    bus.location = { latitude, longitude };
    await bus.save();

    res.status(200).json({ message: 'Bus location updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get bus location by Id
router.get('/get-location/busId/:busId', async (req, res) => {
  try {
    const busId = req.params.busId;

    // Find the bus by its ID
    const bus = await Bus.findOne({ busId: busId });

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Extract the location from the bus object
    const { location } = bus;

    res.status(200).json({ location });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});




// Get bus location by route
router.get('/get-location/routeId/:routeId', async (req, res) => {
  try {
    const routeId = req.params.routeId;
    console.log(`Request received for route  ${routeId}`);
    // Find buses with the specified routeId
    const buses = await Bus.find({ routeId: routeId });

    if (!buses || buses.length === 0) {
      console.log(`Buses not found for the given route ${routeId}`);
      return res.status(404).json({ message: 'Buses not found for the given routeId' });
    }

     // Map the buses to the desired format (BusLocationModel)
     const busLocations = buses.map(bus => {
      // Assuming bus.location contains latitude and longitude
      const location = bus.location; 
      const timeStamp = new Date(); // You may replace this with the actual timestamp
      
      // You might get the farePrice from some other source based on your logic
     // const farePrice = 10.00; // Replace this with your logic to get farePrice

      return {
        bus,
        location,
        timeStamp,
       // farePrice,
      };
    });

   console.log(`Buses found: ${busLocations}`);
    res.status(200).json(busLocations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/get-location/get-updated-locations', async (req, res) => {
  try {
    // Get bus IDs from the request body
    const busIds = req.body;

    console.log(`Request received for updated bus locations`);
    console.log('Request Body:', JSON.stringify(req.body));

    // Find buses with the specified bus IDs
    const buses = await Bus.find({ busId: { $in: busIds } });

    if (!buses || buses.length === 0) {
      console.log(`Buses not found for the given bus IDs`);
      return res.status(404).json({ message: 'Buses not found for the given bus IDs' });
    }
    // // Extract bus locations from the bus objects
    // const busLocations = buses.map(bus => ({
    //   busId: bus.busId,
    //   location: bus.location
    // }));


     // Map the buses to the desired format (BusLocationModel)
     const busLocations = buses.map(bus => {
      // Assuming bus.location contains latitude and longitude
      const location = bus.location; 
      const timeStamp = new Date() ; // You may replace this with the actual timestamp
    
      // You might get the farePrice from some other source based on your logic
     // const farePrice = 10.00; // Replace this with your logic to get farePrice

      return {
        bus,
        location,
        timeStamp,
       // farePrice,
      };
    });

  

    console.log(`Sent updated bus locations ${{busLocations}}`);
    res.status(200).json(busLocations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }

});

// For Calculating if the bus has passeda a stop or not
router.get('/is-bus-gone/:routeId/:selectedStopId', async (req, res) => {
  try {
    const routeId = req.params.routeId;
    const selectedStopId = req.params.selectedStopId;

    // Find the bus stops for the specified route and their sequence order
    const routeStops = await RouteStop.find({ routeId }).sort('sequence_number');

    // Get the index of the selected bus stop in the route
    const selectedStopIndex = routeStops.findIndex(stop => stop.stopId.toString() === selectedStopId);

    if (selectedStopIndex === -1) {
      return res.status(404).json({ message: 'Selected bus stop not found on the route' });
    }

    // Find buses on the specified route
    const busesOnRoute = await Bus.find({ routeId });

    // Determine the status of each bus at the selected bus stop
    const busesWithStatus = busesOnRoute.map(bus => {
      // Assuming bus.location contains latitude and longitude
      const busLocation = bus.location;

      // Check if the bus has passed the selected bus stop
      const hasBusPassedBusStop = busHasPassedStop(busLocation, routeStops, selectedStopIndex);

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
