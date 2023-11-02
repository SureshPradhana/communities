const { MongoClient, ObjectID } = require('mongodb');
require('dotenv').config();


// Define the MongoDB connection URL
const mongoURI = process.env.MONGODB_URL; // Replace with your actual database URL

// Create a MongoDB client
const client = new MongoClient(mongoURI, {});

// Connect to the database
async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

// Define the User schema
const userSchema = {
  name: null,
  email: { unique: true },
  password: null,
  created_at: new Date(),
};

// Define the Community schema
const communitySchema = {
  name: null,
  slug: { unique: true },
  owner: null, // Reference to the User model
  created_at: new Date(),
  updated_at: new Date(),
};

// Define the Role schema
const roleSchema = {
  name: { unique: true },
  created_at: new Date(),
  updated_at: new Date(),
};

// Define the Member schema
const memberSchema = {
  community: null, // Reference to the Community model
  user: null, // Reference to the User model
  role: null, // Reference to the Role model
  created_at: new Date(),
};

// Define MongoDB collections for each schema
const usersCollection = client.db().collection('users');
const communitiesCollection = client.db().collection('communities');
const rolesCollection = client.db().collection('roles');
const membersCollection = client.db().collection('members');

module.exports = {
  connectToMongo,
  usersCollection,
  communitiesCollection,
  rolesCollection,
  membersCollection,
  ObjectID, // This is used for creating and working with ObjectIDs
};
