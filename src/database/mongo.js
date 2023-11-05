const { MongoClient } = require('mongodb');
const { Snowflake } = require('@theinternetfolks/snowflake');
require('dotenv').config();


const mongoURI = process.env.MONGODB_URL; 
const client = new MongoClient(mongoURI, {});

// Connect to the database
async function connectToMongo() {
  try {
    await client.connect();
    // console.log('Connected to MongoDB');
    await createIndexes();
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}



// validation schemas for collections
const usersValidation = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['name', 'email', 'password', 'created_at'],
    properties: {
      name: {
        bsonType: 'string',
      },
      email: {
        bsonType: 'string',
      },
      password: {
        bsonType: 'string',
      },
      created_at: {
        bsonType: 'date',
      },
    },
  },
};

const communitiesValidation = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['name', 'slug', 'owner', 'created_at', 'updated_at'],
    properties: {
      name: {
        bsonType: 'string',
      },
      slug: {
        bsonType: 'string',
      },
      owner: {
        bsonType: 'string',
      },
      created_at: {
        bsonType: 'date',
      },
      updated_at: {
        bsonType: 'date',
      },
    },
  },
};

const rolesValidation = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['name', 'created_at', 'updated_at'],
    properties: {
      name: {
        bsonType: 'string',
      },
      created_at: {
        bsonType: 'date',
      },
      updated_at: {
        bsonType: 'date',
      },
    },
  },
};

const membersValidation = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['community', 'user', 'role', 'created_at'],
    properties: {
      community: {
        bsonType: 'string',
      },
      user: {
        bsonType: 'string',
      },
      role: {
        bsonType: 'string',
      },
      created_at: {
        bsonType: 'date',
      },
    },
  },
};

// Function to create indexes for collections
async function createIndexes() {
  await usersCollection.createIndex({ name: 1 });
  await usersCollection.createIndex({ email: 1 }, { unique: true });
  await usersCollection.createIndex({ created_at: 1 });

  await communitiesCollection.createIndex({ name: 1 });
  await communitiesCollection.createIndex({ slug: 1 }, { unique: true });
  await communitiesCollection.createIndex({ created_at: 1 });
  await communitiesCollection.createIndex({ updated_at: 1 });

  await rolesCollection.createIndex({ name: 1 }, { unique: true });
  await rolesCollection.createIndex({ created_at: 1 });
  await rolesCollection.createIndex({ updated_at: 1 });

  await membersCollection.createIndex({ community: 1});
  await membersCollection.createIndex({ user: 1});
  await membersCollection.createIndex({ created_at: 1 });
  await membersCollection.createIndex({ role: 1 });
}


// MongoDB collections for each collection with validation rules
const usersCollection = client
  .db()
  .collection('users', { validator: usersValidation });

const communitiesCollection = client
  .db()
  .collection('communities', { validator: communitiesValidation });

const rolesCollection = client
  .db()
  .collection('roles', { validator: rolesValidation });

const membersCollection = client
  .db()
  .collection('members', { validator: membersValidation });

module.exports = {
  connectToMongo,
  usersCollection,
  communitiesCollection,
  rolesCollection,
  membersCollection,
  Snowflake,
};
