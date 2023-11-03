// auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { usersCollection, Snowflake } = require('../database/mongo');
const { userSchema, signInSchema } = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');


// Secret key for JWT
const secretKey = 'my-secret-key';

// Route to sign up a new user
router.post('/signup', async (req, res) => {
  const { error } = userSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    // Check if the email is already in use
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user document
    const newUser = {
      _id:Snowflake.generate(),
      name,
      email,
      password: hashedPassword,
      created_at: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    if (result.acknowledged && result.insertedId) {
      // Retrieve the inserted user data by its ID
      const insertedUser = await usersCollection.findOne({ _id: result.insertedId });

      // Generate an access token
      const accessToken = jwt.sign({ id: insertedUser._id }, secretKey);
      const { _id, name, email,created_at} = insertedUser;
      res.status(200).json({
        status: true,
        content: {
          data: {
            id:_id,
            name,
            email,
            created_at,
          },
          meta: {
            access_token: accessToken,
          },
        },
      });
    }
  } catch (err) {
    console.error('Error creating a new user:', err);
    res.status(500).json({ message: 'Failed to create a new user' });
  }
});

// Route to sign in a user
router.post('/signin', async (req, res) => {
  const { error } = signInSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate and sign a JWT token
    const token = jwt.sign({ id: user._id }, secretKey);
    const {_id,name,created_at} = user;
    // Respond with a success message and the access token
    res.json({
      status: true,
      content: {
        data: {
          id:_id,
          name,
          email:user.email,
          created_at,
        
        },
        meta: {
          access_token: token,
        },
      },
    });
  } catch (err) {
    console.error('Error signing in a user:', err);
    res.status(500).json({ message: 'Failed to sign in a user' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    // Get the currently signed-in user's details from MongoDB
    const user = await usersCollection.findOne({ _id: req.user.id });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove sensitive data (e.g., password) before sending the response
    const { _id, name, email, created_at } = user;

    res.json({
      status: true,
      content: {
        data: { id: _id, name, email, created_at },
      },
    });
  } catch (err) {
    console.error('Error getting user details:', err);
    res.status(500).json({ message: 'Failed to get user details' });
  }
});


// Export the router
module.exports = router;