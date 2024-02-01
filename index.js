// index.js
const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');
const punycode = require('punycode/');
const authRoutes = require('./auth');
const busRoutes = require('./bus');
const locationRoutes = require('./location');
const fareRoutes = require('./fareCalculator');
const paymentRouter = require("./payment");
const adminRouter = require("./admin");
const path = require('path');

app.use(express.json()); // Make sure this line is before your route handlers


// Configure passport and sessions
const cors = require('cors');
const session = require('express-session');
const passport = require('./passport-config');

app.use(session({ secret: 'ezbus-secret-key', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
const { connectToDatabase, mongoose } = require('./db'); // Import connectToDatabase and mongoose from db.js
connectToDatabase();

// Use modules
app.use('/auth', authRoutes);
app.use('/bus', busRoutes);
app.use('/location', locationRoutes); // Mount the updated location module
app.use('/fareCalculator', fareRoutes);
app.use('/payment', paymentRouter);
app.use('/add', adminRouter); // later create and add all these to a admin route


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

// Serve public pages
app.use(express.static('public'));
// Enable CORS
app.use(cors({
  origin: 'http://127.0.0.1:3000/admin', // Replace with the URL of your front-end app
  credentials: true, // This is important for cookies, authorization headers with HTTPS 
}))

// Serve React app at /admin
app.use('/admin', express.static(path.join(__dirname, 'admin-portal/build')));

// Authentication route
app.post('/login', (req, res, next) => {
  console.log('Login route hit');
 
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Error during authentication:', err);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

    if (!user) {
      console.error('Authentication failed:', info.message);
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('Error during login:', loginErr);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
      }

      // Authentication succeeded
      console.log('User authenticated:', user.username);
      return res.status(200).json({ success: true, user });
    });
  })(req, res, next);
});

//---------------- check connectivity - for All ----------------//
app.get('/check', (req, res) => {
  console.log(`Hi!`);
  // make a good message to send to the client when checking connectivity
  res.send('Hello from ezBus!');
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

    // Redirect to the login page after successful logout
    console.log('Logged out');
    res.redirect('/admin');
  });
});



// Define a fallback route for unknown paths
app.use((req, res) => {
  res.status(404).send('Page not found! Please check the URL and try again.');
});

//const PORT = process.env.PORT || 3000;
const PORT = 3000;
app.listen(PORT, '0.0.0.0' ,() => {
  console.log(`Server listening on port ${PORT}`);
});


