// hi.js
const express = require('express');
const router = express.Router();


// Route to create a new community
router.get('/', async (req, res) => {
    console.log('hi from hi')
  res.send('Hello from /v1/hi');
 
});


// Add more community-related routes or features here

module.exports = router;
