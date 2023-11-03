// roles.js
const express = require('express');
const router = express.Router();

const { rolesCollection } = require('../database/mongo');
const { roleSchema } = require('../middleware/validation');
const { Snowflake } = require('@theinternetfolks/snowflake')

// Route to create roles
router.post('/', async (req, res) => {
  const { error } = roleSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const roleData = {
      _id: Snowflake.generate(),
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await rolesCollection.insertOne(roleData);

    if (result.acknowledged && result.insertedId) {
      const insertedRole = await rolesCollection.findOne({ _id: result.insertedId });
      const { _id, name, created_at, updated_at } = insertedRole;
      res.status(200).json({
        status: true,
        content: {
          data: {
            id: _id,
            name,
            created_at,
            updated_at,
          },
        },
      });
    } else {
      console.error('Failed to insert role into the database.');
      res.status(500).json({ message: 'Failed to create a new role',err });
    }
  } catch (err) {
    console.error('Error creating a new role:', err);
    res.status(500).json({ message: 'Failed to create a new role' });
  }
});


// Route to get a list of roles
router.get('/', async (req, res) => {
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
      .project({
        _id: 0,
        id: '$_id',
        name: 1,
        created_at: 1,
        updated_at: 1
      })
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


module.exports = router;
