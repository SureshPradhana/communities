// members.js
const express = require('express');
const router = express.Router();
const { membersCollection, rolesCollection, usersCollection,communitiesCollection, Snowflake } = require('../database/mongo');
const { verifyToken } = require('../middleware/auth');

// Route to create a new member
router.post('/', verifyToken, async (req, res) => {
  try {
    const { community, user, role } = req.body;
    const userId = req.user.id;

    // Check if the community, user, and role exist in the database
    const communityDocument = await communitiesCollection.findOne({ _id: community });
    const userDocument = await usersCollection.findOne({ _id: user });
    const roleDocument = await rolesCollection.findOne({ _id: role });

    if (!communityDocument || !userDocument || !roleDocument) {
      return res.status(400).json({ message: 'Invalid community, user, or role' });
    }
    console.log(communityDocument)
    
    if (!communityDocument.owner==userId) {
      return res.status(403).json({ message: 'Not allowed to add members' });
    }

    // Generate a unique member ID (you should use a database-generated ID in production)
    const memberId = Snowflake.generate();  

    // Create a new member document
    const memberDocument = {
      _id: memberId, 
      community:community,
      user: user,
      role: role,
      created_at: new Date().toISOString(),
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
          created_at: memberDocument.created_at,
        },
      },
    });
  } catch (err) {
    console.error('Error adding a member to the community:', err);
    res.status(500).json({ message: 'Failed to add a member to the community' });
  }
});

// Route to remove a member by ID
router.delete('/:id', verifyToken,async (req, res) => {
  try {
    const memberId = req.params.id;
    const userId = req.user.id;


    // Check if the member exists in the "members" collection in the database
    const memberDocument = await membersCollection.findOne({ user: memberId });

    if (!memberDocument) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Find the community associated with the member
    const communityId = memberDocument.community;
    const communityDocument = await communitiesCollection.findOne({ _id: communityId });
    const userRole = await membersCollection.findOne({
      community: communityId,
      user: userId,
    });
    // Get the role document using UserRole.role
    const roleDocument = await rolesCollection.findOne({ _id:userRole.role });

    // Check if the user has the required role (Community Admin or Community Moderator) in the community
    if (roleDocument) {
      const roleName = roleDocument.name;

      // Check if the role name is "Community Admin" or "Community Moderator"
      if (roleName === 'Community Admin' || roleName === 'Community Moderator') {
        // User has the required role, proceed to remove the member
        await membersCollection.deleteOne({ user: memberId });
        return res.json({ status: true });
      }
    }

    return res.status(403).json({ message: 'Not allowed to remove members' });
  } catch (err) {
    console.error('Error removing a member:', err);
    res.status(500).json({ message: 'Failed to remove the member' });
  }
});


module.exports = router;
