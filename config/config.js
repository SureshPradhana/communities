module.exports = {
  // MongoDB connection URL
  mongoURI: process.env.MONGODB_URL || 'mongodb://localhost/mydb', // Replace with your actual MongoDB connection URL

  // Secret key for JWT token verification
  secretKey: 'my-secret-key', // Replace with your actual secret key

  // Other configuration options
};
