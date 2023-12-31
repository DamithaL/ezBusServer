// index.js
const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');
const punycode = require('punycode/');
const authRoutes = require('./auth');
const locationRoutes = require('./location');
const fareRoutes = require('./fareCalculator');
const paymentRouter = require("./payment");
const path = require('path');

// Connect to MongoDB
const { connectToDatabase, mongoose } = require('./db'); // Import connectToDatabase and mongoose from db.js
connectToDatabase();



// Use modules
app.use('/auth', authRoutes);
app.use('/location', locationRoutes); // Mount the updated location module
app.use('/fareCalculator', fareRoutes);
app.use('/payment', paymentRouter);


// const options = {
//   key: fs.readFileSync('localhost.key'),
//   cert: fs.readFileSync('localhost.crt'),
// };


// const server = https.createServer(options, app);

// app.get('/welcome', (req, res) => {
//   console.log(`Hi!`);
//   res.send('Hello, Jananie!');
// });

// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'WelcomePage', 'index.html'));
// });

app.use(express.static('public'));

// Define a fallback route for unknown paths
app.use((req, res) => {
  res.status(404).send('Page not found!');
});

//const PORT = process.env.PORT || 3000;
const PORT = 3000;
app.listen(PORT, '0.0.0.0' ,() => {
  console.log(`Server listening on port ${PORT}`);
});
