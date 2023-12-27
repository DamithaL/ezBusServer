// index.js
const express = require('express');
const app = express();
const punycode = require('punycode/');
const {router: authRoutes, User} = require('./auth');
const locationRoutes = require('./location');
const fareRoutes = require('./fareCalculator');
const paymentRouter = require("./payment");
const paymentRouterStripe = require("./pay_stripe");

// Connect to MongoDB
const { connectToDatabase, mongoose } = require('./db'); // Import connectToDatabase and mongoose from db.js
connectToDatabase();

// Use modules
app.use('/auth', authRoutes);
app.use('/location', locationRoutes); // Mount the updated location module
app.use('/fareCalculator', fareRoutes);
app.use('/payment', paymentRouter);
app.use('/pay_stripe', paymentRouterStripe);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
