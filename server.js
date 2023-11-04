const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const { connectToMongo } = require('./src/database/mongo');
const authRoutes = require('./src/routes/auth');
const rolesRoutes = require('./src/routes/roles');
const membersRoutes = require('./src/routes/members');
const communitiesRoutes = require('./src/routes/communities');
const errorMiddleware = require('./src/middleware/error');
// You need to define verifyToken

// Connect to MongoDB
connectToMongo();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', async (req, res) => {
  res.sendFile(__dirname +'/index.html');
})


app.use('/v1/auth', authRoutes);
app.use('/v1/role', rolesRoutes);
app.use('/v1/member', membersRoutes);
app.use('/v1/community', communitiesRoutes);

// Error handling middleware
app.use(errorMiddleware);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


module.exports = app;
