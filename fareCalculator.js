// fareCalculator.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const RouteStop = require('./models/routeStop');
const Route = require('./models/route');
const BusStop = require('./models/busStop');

const FareTable = require('./models/fareTable');

router.use(express.json());

// New API endpoint to enter fare entries
router.post('/enter-fare-entry', async (req, res) => {
    try {
        const { fareLevel, farePrice } = req.body;
        console.log(`Fare entry received:`, fareLevel, farePrice);

        // Check if the fare entry with the given Fare level already exists
        const existingFareLevel = await FareTable.findOne({ fareLevel});

        if (existingFareLevel) {
            return res.status(409).json({ message: 'Fare level already exists' });
        }
        // create a new fare entry

        const newFareEntry = new FareTable({
            fareLevel, farePrice

        });

        // Save the new fare entry to the database
        await newFareEntry.save();

        res.status(201).json({ message: 'Fare entry created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to enter a route
router.post('/addRoute', async (req, res) => {
    try {

        const { routeId, routeName } = req.body;
        console.log(`New route entry received:`, routeId, routeName);

        // Check if the route entry with the given routeId already exists
        const existingRoute = await Route.findOne({ routeId: routeId.toLowerCase()  });

        if (existingRoute) {
            return res.status(409).json({ message: 'Route already exists' });
        }
        // create a new route entry

        const newRoute = new Route({
            routeId:routeId.toLowerCase(), routeName: routeName.toLowerCase()

        });

        // Save the new route entry to the database
        await newRoute.save();

        res.status(201).json({ message: 'Route created successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// API endpoint to enter a bus stop
router.post('/addBusStop', async (req, res) => {
    try {


        const { stopId, stopName, latitude, longitude } = req.body;
        console.log(`New bus stop entry received:`, stopId, stopName, latitude, longitude);

        // Check if the bus stop entry with the given stopId already exists
        const existingBusStop = await BusStop.findOne({ stopId: stopId.toLowerCase() });

        if (existingBusStop) {
            return res.status(409).json({ message: 'Bus Stop already exists' });
        }
        // create a new bus stop

        const newBusStop = new BusStop({
            stopId: stopId.toLowerCase(), 
            stopName: stopName.toLowerCase(), latitude, longitude

        });

        // Save the new route entry to the database
        await newBusStop.save();

        res.status(201).json({ message: 'Bus Stop created successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// API endpoint to enter a routeStop
router.post('/addRouteStop', async (req, res) => {
    try {
        const { routeId, stopName, sequenceNumber, fareLevel } = req.body;
        console.log(`New route stop entry received:`, routeId, stopName, sequenceNumber, fareLevel);


        // Find the routeId based on routeName
        const route = await Route.findOne({ routeId: routeId.toLowerCase() });
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }


        // Find the stopId based on stopName
        const busStop = await BusStop.findOne({ stopName: stopName.toLowerCase() });
        if (!busStop) {
            return res.status(404).json({ error: 'Bus stop not found' });
        }


        // Check if a RouteStop entry already exists for the given route and bus stop
        const existingRouteStop = await RouteStop.findOne({ routeId: routeId.toLowerCase(), stopId: busStop.stopId.toLowerCase() });
        if (existingRouteStop) {
            return res.status(400).json({ error: 'RouteStop entry already exists for the given route and bus stop' });
        }

        // Create a new RouteStop entry
        const newRouteStop = new RouteStop({
            routeId: routeId.toLowerCase(),
            stopId: busStop.stopId.toLowerCase(),
            sequenceNumber,
            fareLevel,
        });

        // Save the new RouteStop entry
        await newRouteStop.save();

        res.json({ message: 'RouteStop entry added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// endpoint to get fare price
router.get('/get-fare/:routeId/:startStopName/:endStopName', async (req, res) => {
    try {
        const routeId = req.params.routeId.toLowerCase();
        const startStopName = req.params.startStopName.toLowerCase();
        const endStopName = req.params.endStopName.toLowerCase();

        console.log(`Fare price check request received:`, routeId, startStopName, endStopName);

        // Find the routeId
        const route = await RouteStop.findOne({ routeId });
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        // Find the startStopId based on stopName
        const startStop = await BusStop.findOne({ stopName: startStopName });
        if (!startStop) {
            return res.status(404).json({ error: 'Start bus stop not found' });
        }

        console.log(`Start bus stop found:`, startStop);

        // Find the endtStopId based on stopName
        const endStop = await BusStop.findOne({ stopName: endStopName });
        if (!endStop) {
            return res.status(404).json({ error: 'End bus stop not found' });
        }

        console.log(`Bus stops found:`, startStop, endStop);

        // Find the corresponding entry in RouteStop based on routeId and stopId
        const routeStopForStartStop = await RouteStop.findOne({
            routeId: routeId, 
            stopId: startStop.stopId 
        });

        if (!routeStopForStartStop) {
            return res.status(404).json({ error: 'RouteStop entry not found for startStop' });
        }

        const startStopFareLevel = routeStopForStartStop.fareLevel;

    
        console.log(`Fare Level for startStop:`, startStopFareLevel);

        // Find the corresponding entry in RouteStop based on routeId and stopId
        const routeStopForEndStop = await RouteStop.findOne({
            routeId: routeId, 
            stopId: endStop.stopId 
        });

        if (!routeStopForEndStop) {
            return res.status(404).json({ error: 'RouteStop entry not found for endStop' });
        }

        const endStopFareLevel = routeStopForEndStop.fareLevel;

    
        console.log(`Fare Level for endStop:`, endStopFareLevel);

        // Calculate fare level difference
        const fareLevelDifference = Math.abs(startStopFareLevel - endStopFareLevel);
        
        console.log(`fareLevelDifference:`, fareLevelDifference);

        const fareLevel = await FareTable.findOne({ fareLevel: fareLevelDifference });
        if (!fareLevel) {
            return res.status(404).json({ error: 'Fare level difference not found' });
        }
    
        const farePrice = fareLevel.farePrice.toFixed(2).toString();
        console.log(`farePrice:`, farePrice);
        res.status(200).send(farePrice);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
