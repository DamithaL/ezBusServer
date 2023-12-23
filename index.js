// index.js
const express = require('express');

const punycode = require('punycode/');
const { connectToDatabase, mongoose } = require('./db'); // Import connectToDatabase and mongoose from db.js
const authRoutes = require('./auth');
const locationRoutes = require('./location');
const fareRoutes = require('./fareCalculator');


const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectToDatabase();

// Use the auth module
app.use('/auth', authRoutes);
app.use('/location', locationRoutes); // Mount the updated location module
app.use('/fareCalculator', fareRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
