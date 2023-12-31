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



// const { MongoClient, ServerApiVersion } = require('mongodb');

// async function connectToDatabase() {
//   try {
//     const uri = process.env.MONGO_URL || "mongodb+srv://damithaliyanaarachchi:ezbusmongo93@cluster0.x8bk2yi.mongodb.net/?retryWrites=true&w=majority&authSource=admin";
//     // Use the MongoDB Cloud client URI from the environment variable or replace it with your URI

//     const client = new MongoClient(uri, {
//       serverApi: {
//         version: ServerApiVersion.v1,
//         strict: true,
//         deprecationErrors: true,
//       }
//     });

//     // Connect the client to the server (optional starting in v4.7)
//     await client.connect();

//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });

//     // Close the client after successful ping
//     await client.close();

//     console.log('Connected to MongoDB');
//   } catch (error) {
//     console.error('Error connecting to MongoDB:', error.message);
//     process.exit(1); // Exit the application if MongoDB connection fails
//   }
// }

const { MongoClient } = require("mongodb");
const username = encodeURIComponent("damithaliyanaarachchi");
const password = encodeURIComponent("ezbusmongo93");
const cluster = "cluster0.x8bk2yi.mongodb.net";
const authSource = "admin";
const authMechanism = "SCRAM";
let uri =
  `mongodb+srv://${username}:${password}@${cluster}/?authSource=${authSource}&authMechanism=${authMechanism}`;
const client = new MongoClient(uri);
async function connectToDatabase()  {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
  }
}

module.exports = { connectToDatabase, mongoose }; // Export both connectToDatabase function and mongoose object
