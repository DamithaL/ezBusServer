const express = require('express');
const router = express.Router();
const Route = require("./models/route");

// API endpoint to create a new route
router.post('/route', async (req, res) => {
  try {
    const { routeNumber, routeName } = req.body;

    // Create a new route instance
    const newRoute = new Route({
      routeNumber,
      routeName,
    });

    // Save the route to the database
    const savedRoute = await newRoute.save();

    res.status(201).json(savedRoute);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
