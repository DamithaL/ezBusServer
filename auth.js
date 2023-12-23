// auth.js
// For user authentication - Login and Sign up

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { mongoose } = require('./db'); // Import mongoose from db.js


const router = express.Router();

// mongoose.connect('mongodb://localhost/auth_demo', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const db = mongoose.connection;

// db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

router.use(bodyParser.json());

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {

    console.log('request body: ' + req.body);
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(208).json({ message: 'Already registered' });
    }
    else {

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({ name, email, password: hashedPassword });
      await newUser.save();

      res.status(201).json({ message: 'User created successfully' });
      console.log('user: ' + newUser);
    }


  } catch (error) {

    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // // Create a JWT token for authentication
    // const token = jwt.sign({ email: user.email }, 'your-secret-key', { expiresIn: '1h' });

    // res.json({ token });

    console.log('user: ' + user);

    const objToSend = {
      name: user.name,
      email: user.email
    }

    console.log('objToSend: ' + objToSend);

    console.log('objToSend: ' + JSON.stringify(objToSend));

    res.status(200).send(JSON.stringify(objToSend))



  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// Protected route example
router.get('/protected', (req, res) => {
  // Middleware to check the JWT token before accessing the protected route
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  jwt.verify(token, 'your-secret-key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    // The decoded object contains the payload of the JWT
    res.json({ message: 'Protected route accessed', user: decoded });
  });
});

module.exports = router;

