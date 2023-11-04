// communities.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth'); 
const { communitiesCollection, rolesCollection, membersCollection,usersCollection,Snowflake } = require('../database/mongo');
const {communitySchema}=require('../middleware/validation');
const {ObjectId}=require('mongodb')

// Route to create a new community
router.post('/', verifyToken, async (req, res) => {
  const { error } = communitySchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const { name } = req.body;
    // Check if the required 'name' field is provided
    if (!name || name.length < 2) {
      return res.status(400).json({ message: 'Name is required and should be at least 2 characters' });
    }

    // Autogenerate the slug from the name (e.g., remove spaces and make it lowercase)
    const slug = name.toLowerCase().replace(/\s/g, '-');

    // Create a new community object
    const communityData = {
      _id: Snowflake.generate().toString(), // Convert to string
      name,
      slug,
      owner: req.user.id, // The user who creates the community is the owner
      created_at: new Date().toISOString(), // Convert to string
      updated_at: new Date().toISOString(), // Convert to string
    };

    // Add the community to the MongoDB "communities" collection
    const result = await communitiesCollection.insertOne(communityData);

    // Generate an ID for the newly created community
    const communityId = result.insertedId;

    // Retrieve the owner's role (e.g., 'Community Admin')
    const ownerRole = await rolesCollection.findOne({ name: 'Community Admin' });

    if (!ownerRole) {
      return res.status(500).json({ message: 'Owner role not found' });
    }

    // Create a member entry for the community with the owner's user ID and role
    const memberData = {
      _id: Snowflake.generate().toString(), // Convert to string
      community: communityId,
      user: req.user.id,
      role: ownerRole._id,
      created_at: new Date().toISOString(), // Convert to string
    };

    // Add the member to the MongoDB "members" collection
    await membersCollection.insertOne(memberData);

    res.status(200).json({
      status: true,
      content: {
        data: {
          id: communityData._id, // Keep it as a string
          name: communityData.name,
          slug: communityData.slug,
          owner: communityData.owner,
          created_at: communityData.created_at,
          updated_at: communityData.updated_at,
        },
      },
    });
  } catch (err) {
    console.error('Error creating a new community:', err);
    res.status(500).json({ message: 'Failed to create a new community' ,err});
  }
});


// Route to get a list of communities with pagination
router.get('/', async (req, res) => {
  try {
    // Pagination parameters
    const itemsPerPage = 10; // Number of communities per page
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;

    // Query the MongoDB "communities" collection to get communities for the current page
    const communitiesCursor = communitiesCollection.find().skip((page - 1) * itemsPerPage).limit(itemsPerPage);
    const communitiesForPage = await communitiesCursor.toArray();

    // Get the total count of communities
    const totalItems = await communitiesCollection.countDocuments();

    // Create an array to hold the expanded communities
    const expandedCommunities = [];

    for (const community of communitiesForPage) {
      const owner = await usersCollection.findOne({ _id: community.owner });

      if (owner) {
        expandedCommunities.push({
          id: community._id.toString(),
          name: community.name,
          slug: community.slug,
          owner: {
            id: owner._id.toString(),
            name: owner.name,
          },
          created_at: community.created_at,
          updated_at: community.updated_at,
        });
      }
    }
   

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    res.json({
      status: true,
      content: {
        meta: {
          total: totalItems,
          pages: totalPages,
          page: page,
        },
        data: expandedCommunities,
      },
    });
  } catch (err) {
    console.error('Error fetching communities:', err);
    res.status(500).json({ message: 'Failed to retrieve communities' });
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const communityId = req.params.id;

    // Pagination parameters
    const pageSize = 10;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;

    // Query the MongoDB "members" collection to find members for the specified community
    const membersCursor = await membersCollection.find({ community: communityId});

    const totalMembers = await membersCollection.estimatedDocumentCount({community: communityId});
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

router.get('/me/owner', verifyToken, async (req, res) => {
  try {
    // Pagination parameters
    const pageSize = 10; 
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const userId = req.user.id;

    // Query the MongoDB "communities" collection to find communities owned by the currently signed-in user
    const ownedCommunitiesCursor = await communitiesCollection.find({ owner: userId });

    const totalCommunities = await communitiesCollection.estimatedDocumentCount({owner: userId });
    const totalPages = Math.ceil(totalCommunities / pageSize);

    // skip and limit to implement pagination
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

router.get('/me/member', verifyToken, async (req, res) => {
  try {
    // Pagination parameters
    const pageSize = 10; // Number of communities per page
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const userId = req.user.id;

    // Query the MongoDB "members" collection to find communities joined by the currently signed-in user
    const memberCommunitiesCursor = membersCollection
      .find({ user: userId })
      .limit(pageSize)
      .skip((page - 1) * pageSize);

    const totalCommunities = await membersCollection.estimatedDocumentCount({ user: userId });
    const totalPages = Math.ceil(totalCommunities / pageSize);

    // Fetch communities and expand owner details (id and name)
    const communitiesOnPage = await memberCommunitiesCursor.toArray();
    const expandedCommunities = [];

    for (const communityMember of communitiesOnPage) {
      const community = await communitiesCollection.findOne({
        _id: communityMember.community,
      });

      if (community) {
        const owner = await usersCollection.findOne({
          _id: community.owner,
        });

        expandedCommunities.push({
          id: community._id.toString(),
          name: community.name,
          slug: community.slug,
          owner: {
            id: community.owner.toString(),
            name: owner ? owner.name : 'Unknown',  
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



module.exports = router;
