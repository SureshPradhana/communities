

const express = require('express');
const res = require('express/lib/response');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');


// Import the MongoDB driver
const { MongoClient, ObjectId } = require('mongodb');
const { connectToMongo, rolesCollection, usersCollection, communitiesCollection, membersCollection } = require('./schemas/schema');
const app = express();
const port = 3000;



//middlewares

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to connect to MongoDB
app.use(async (req, res, next) => {
  try {
    await connectToMongo();
    next();
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Secret key for JWT
const secretKey = 'my-secret-key';



// Middleware to verify the Bearer Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

app.use(express.json());


app.get('/', (req, res) => {
  // Serve the index.html file
  res.sendFile(__dirname + '/index.html');
});


app.post('/v1/role', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const roleData = {
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await rolesCollection.insertOne(roleData);

    if (result.acknowledged && result.insertedId) {
      // Retrieve the inserted role data by its ID
      const insertedRole = await rolesCollection.findOne({ _id: result.insertedId });

      res.status(200).json({
        status: true,
        content: {
          data: insertedRole,
        },
      });
    } else {
      console.error('Failed to insert role into the database.');
      res.status(500).json({ message: 'Failed to create a new role' });
    }
  } catch (err) {
    console.error('Error creating a new role:', err);
    res.status(500).json({ message: 'Failed to create a new role' });
  }
});


app.get('/v1/role', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;

    const totalRoles = await rolesCollection.countDocuments({});
    const totalPages = Math.ceil(totalRoles / itemsPerPage);

    if (page > totalPages) {
      return res.status(400).json({ message: 'Page out of range' });
    }

    const skip = (page - 1) * itemsPerPage;

    const roles = await rolesCollection
      .find({})
      .skip(skip)
      .limit(itemsPerPage)
      .toArray();

    const responseData = {
      status: true,
      content: {
        meta: {
          total: totalRoles,
          pages: totalPages,
          page,
        },
        data: roles,
      },
    };

    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error getting roles from MongoDB:', err);
    res.status(500).json({ message: 'Failed to get roles' });
  }
});


app.post('/v1/auth/signup', async (req, res) => {
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
      console.log(result.insertedId)
      const accessToken = jwt.sign({ id: insertedUser._id }, secretKey);

      res.status(200).json({
        status: true,
        content: {
          data: {
            id: insertedUser._id,
            name: insertedUser.name,
            email: insertedUser.email,
            created_at: insertedUser.created_at,
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

app.post('/v1/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email (you should use a database query)
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

    // Respond with a success message and the access token
    res.json({
      status: true,
      content: {
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
        meta: {
          access_token: token,
        },
      },
    });
  } catch (err) {
    console.error('Error signing in:', err);
    res.status(500).json({ message: 'Failed to sign in' });
  }
});

//auth/me

// Route to get the currently signed-in user's details
app.get('/v1/auth/me', verifyToken, async (req, res) => {
  try {
    // Get the currently signed-in user's details from MongoDB
    console.log(req.user)
    console.log(new ObjectId(req.user.id))
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });

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


app.post('/v1/community', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;


    // Check if the required 'name' field is provided
    if (!name || name.length < 2) {
      return res.status(400).json({ message: 'Name is required and should be at least 2 characters' });
    }

    // Autogenerate the slug from the name (e.g., remove spaces and make it lowercase)
    const slug = name.toLowerCase().replace(/\s/g, '-');

    // Create a new community object
    const community = {
      name,
      slug,
      owner: new ObjectId(req.user.id), // The user who creates the community is the owner
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Add the community to the MongoDB "communities" collection
    const result = await communitiesCollection.insertOne(community);

    // Generate an ID for the newly created community
    const communityId = result.insertedId;

    let ownerRole = await rolesCollection.findOne({ name: 'Community Admin' });
    if (!ownerRole) {
      return res.status(500).json({ message: 'Owner role not found' });
    }
    // Create a member entry for the community with the owner's user ID and role
    const member = {
      community: communityId,
      user: new ObjectId(req.user.id),
      role: ownerRole._id, // Role for the owner (e.g., 'Community Admin')
      created_at: new Date(),
    };

    // Add the member to the MongoDB "members" collection
    await membersCollection.insertOne(member);

    // Respond with a success message and the community data
    res.status(200).json({
      status: true,
      content: {
        data: {
          id: communityId.toString(),
          name: community.name,
          slug: community.slug,
          owner: community.owner,
          created_at: community.created_at.toISOString(),
          updated_at: community.updated_at.toISOString(),
        },
      },
    });
  } catch (err) {
    console.error('Error creating a new community:', err);
    res.status(500).json({ message: 'Failed to create a new community' });
  }
});

app.get('/v1/community', async (req, res) => {
  try {
    // Pagination parameters
    const itemsPerPage = 10;

    // Extract page number from the request query parameters (default to page 1)
    const currentPage = parseInt(req.query.page) || 1;

    // Calculate the start and end index for the current page
    const startIndex = (currentPage - 1) * itemsPerPage;

    // Query the MongoDB "communities" collection to get communities for the current page
    const cursor = communitiesCollection.find().skip(startIndex).limit(itemsPerPage);
    const communitiesForPage = await cursor.toArray();

    // Get the total count of communities
    const totalItems = await communitiesCollection.countDocuments();

    // Expand the owner details (limit to id and name)
    const expandedCommunities = communitiesForPage.map(async (community) => {
      const owner = await usersCollection.findOne({ _id: community.owner });
      return {
        ...community,
        owner: {
          id: owner._id.toString(),
          name: owner.name,
        },
      };
    });

    // Create an array of expanded communities (use Promise.all to await all owner queries)
    const expandedCommunitiesArray = await Promise.all(expandedCommunities);

    const responseData = {
      status: true,
      content: {
        meta: {
          total: totalItems,
          pages: Math.ceil(totalItems / itemsPerPage),
          page: currentPage,
        },
        data: expandedCommunitiesArray,
      },
    };

    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error fetching communities:', err);
    res.status(500).json({ message: 'Failed to retrieve communities' });
  }
});


app.get('/v1/community/:id/members', async (req, res) => {
  try {
    const communityId = req.params.id;

    // Pagination parameters
    const pageSize = 10;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;

    // Query the MongoDB "members" collection to find members for the specified community
    const membersCursor = membersCollection.find({ community: new ObjectId(communityId) });

    const totalMembers = await membersCursor.countDocuments;
    const totalPages = Math.ceil(totalMembers / pageSize);

    // Use skip and limit to implement pagination
    const membersOnPage = await membersCursor
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    // Expand user and role data
    const expandedMembers = await Promise.all(
      membersOnPage.map(async (member) => {
        const user = await usersCollection.findOne({ _id: member.user });
        const role = await rolesCollection.findOne({ _id: member.role });

        return {
          id: member._id.toString(),
          community: communityId,
          user: {
            id: user._id.toString(),
            name: user.name,
          },
          role: {
            id: role._id.toString(),
            name: role.name,
          },
          created_at: member.created_at,
        };
      })
    );

    res.json({
      status: true,
      content: {
        meta: {
          total: totalMembers,
          pages: totalPages,
          page: page,
        },
        data: expandedMembers,
      },
    });
  } catch (err) {
    console.error('Error fetching community members:', err);
    res.status(500).json({ message: 'Failed to retrieve community members' });
  }
});

app.get('/v1/community/me/owner', verifyToken, async (req, res) => {
  try {
    // Pagination parameters
    const pageSize = 10; // Number of communities per page
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const userId = req.user.id;

    // Query the MongoDB "communities" collection to find communities owned by the currently signed-in user
    const ownedCommunitiesCursor = communitiesCollection.find({ owner: new ObjectId(userId) });

    const totalCommunities = await ownedCommunitiesCursor.countDocuments;
    const totalPages = Math.ceil(totalCommunities / pageSize);

    // Use skip and limit to implement pagination
    const communitiesOnPage = await ownedCommunitiesCursor
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    res.json({
      status: true,
      content: {
        meta: {
          total: totalCommunities,
          pages: totalPages,
          page: page,
        },
        data: communitiesOnPage,
      },
    });
  } catch (err) {
    console.error('Error fetching owned communities:', err);
    res.status(500).json({ message: 'Failed to retrieve owned communities' });
  }
});

app.get('/v1/community/me/member', verifyToken, async (req, res) => {
  try {
    // Pagination parameters
    const pageSize = 10; // Number of communities per page
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const userId = req.user.id;

    // Query the MongoDB "members" collection to find communities joined by the currently signed-in user
    const memberCommunitiesCursor = membersCollection
      .find({ user: new ObjectId(userId) })
      .limit(pageSize)
      .skip((page - 1) * pageSize);

    const totalCommunities = await memberCommunitiesCursor.countDocuments;
    const totalPages = Math.ceil(totalCommunities / pageSize);

    // Fetch communities and expand owner details (id and name)
    const communitiesOnPage = await memberCommunitiesCursor.toArray();
    const expandedCommunities = [];

    for (const communityMember of communitiesOnPage) {
      const community = await communitiesCollection.findOne({
        _id: new ObjectId(communityMember.community),
      });

      if (community) {
        const owner = await usersCollection.findOne({
          _id: new ObjectId(community.owner),
        });

        expandedCommunities.push({
          id: community._id.toString(),
          name: community.name,
          slug: community.slug,
          owner: {
            id: community.owner.toString(),
            name: owner ? owner.name : 'Unknown',  // Replace with actual owner name
          },
          created_at: community.created_at,
          updated_at: community.updated_at,
        });
      }
    }

    res.json({
      status: true,
      content: {
        meta: {
          total: totalCommunities,
          pages: totalPages,
          page: page,
        },
        data: expandedCommunities,
      },
    });
  } catch (err) {
    console.error('Error fetching joined communities:', err);
    res.status(500).json({ message: 'Failed to retrieve joined communities' });
  }
});
// Route to add a member to a community
app.post('/v1/member', verifyToken, async (req, res) => {
  try {
    const { community, user, role } = req.body;
    const userId = req.user.id;

    // Check if the community, user, and role exist in the database
    const communityDocument = await communitiesCollection.findOne({ _id: new ObjectId(community) });
    const userDocument = await usersCollection.findOne({ _id: new ObjectId(user) });
    const roleDocument = await rolesCollection.findOne({ _id: new ObjectId(role) });

    if (!communityDocument || !userDocument || !roleDocument) {
      return res.status(400).json({ message: 'Invalid community, user, or role' });
    }


    // Check if the user has the required role (Community Admin) in the specified community
    if (!communityDocument.owner.equals(new ObjectId(userId))) {
      return res.status(403).json({ message: 'Not allowed to add members' });
    }

    // Generate a unique member ID (you should use a database-generated ID in production)
    const memberId = new ObjectId();  // Replace with a unique ID generation method

    // Create a new member document
    const memberDocument = {
      _id: memberId, // Store the member ID
      community: new ObjectId(community),
      user: new ObjectId(user),
      role: new ObjectId(role),
      created_at: new Date(),
    };

    // Insert the member into the "members" collection in the database
    await membersCollection.insertOne(memberDocument);

    res.json({
      status: true,
      content: {
        data: {
          id: memberId,
          community: community,
          user: user,
          role: role,
          created_at: memberDocument.created_at.toISOString(),
        },
      },
    });
  } catch (err) {
    console.error('Error adding a member to the community:', err);
    res.status(500).json({ message: 'Failed to add a member to the community' });
  }
});

// Route to remove a member
app.delete('/v1/member/:id', verifyToken, async (req, res) => {
  try {
    const memberId = req.params.id;
    const userId = req.user.id;

    // Check if memberId is a valid ObjectId
    if (!ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: 'Invalid member ID' });
    }

    // Check if the member exists in the "members" collection in the database
    const memberDocument = await membersCollection.findOne({ user: new ObjectId(memberId) });

    if (!memberDocument) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Find the community associated with the member
    const communityId = memberDocument.community;
    const communityDocument = await communitiesCollection.findOne({ _id: new ObjectId(communityId) });
    const userRole = await membersCollection.findOne({
      community: communityId,
      user: new ObjectId(userId),
    });
    // Get the role document using UserRole.role
    const roleDocument = await rolesCollection.findOne({ _id: new ObjectId(userRole.role) });

    // Check if the user has the required role (Community Admin or Community Moderator) in the community
    if (roleDocument) {
      const roleName = roleDocument.name;

      // Check if the role name is "Community Admin" or "Community Moderator"
      if (roleName === 'Community Admin' || roleName === 'Community Moderator') {
        // User has the required role, proceed to remove the member
        await membersCollection.deleteOne({ user: new ObjectId(memberId) });
        return res.json({ status: true });
      }
    }

    return res.status(403).json({ message: 'Not allowed to remove members' });
  } catch (err) {
    console.error('Error removing a member:', err);
    res.status(500).json({ message: 'Failed to remove the member' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

