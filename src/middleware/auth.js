const jwt = require('jsonwebtoken');
const { secretKey } = require('../../config/config'); // Replace with your actual secret key

const verifyToken = (req, res, next) => {
  // Get the token from the request headers
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Verify the token
  jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Attach the user data from the token to the request object for future use
    req.user = decoded;
    next();
  });
};

module.exports = {verifyToken};
