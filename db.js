// db.js
const mongoose = require('mongoose');


async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/ezbus');
    //, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      useCreateIndex: true,
   // });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit the application if MongoDB connection fails
  }
}

module.exports = { connectToDatabase, mongoose }; // Export both connectToDatabase function and mongoose object
