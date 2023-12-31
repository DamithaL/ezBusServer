// db.js
const mongoose = require('mongoose');


// async function connectToDatabase() {
//   try {
//     await mongoose.connect(process.env.MONGO_URL);
//    // await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/ezbus');
//     //, {
//       // useNewUrlParser: true,
//       // useUnifiedTopology: true,
//       useCreateIndex: true,
//    // });
//     console.log('Connected to MongoDB');
//   } catch (error) {
//     console.error('Error connecting to MongoDB:', error.message);
//     process.exit(1); // Exit the application if MongoDB connection fails
//   }
// }



const { MongoClient, ServerApiVersion } = require('mongodb');

async function connectToDatabase() {
  try {
    const uri = process.env.MONGO_URL || "mongodb+srv://<username>:<password>@cluster0.x8bk2yi.mongodb.net/<database>?retryWrites=true&w=majority";
    // Use the MongoDB Cloud client URI from the environment variable or replace it with your URI

    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    // Close the client after successful ping
    await client.close();

    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit the application if MongoDB connection fails
  }
}

module.exports = { connectToDatabase, mongoose }; // Export both connectToDatabase function and mongoose object
