const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const { connectToMongo } = require('./src/database/mongo');
const authRoutes = require('./src/routes/auth');
const rolesRoutes = require('./src/routes/roles');
const membersRoutes = require('./src/routes/members');
const communitiesRoutes = require('./src/routes/communities');
const errorMiddleware = require('./src/middleware/error');

const session = require('express-session');
const cookieAuthMiddleware = require('./src/middleware/cookieAuth');
const cookieParser = require('cookie-parser'); // Import cookie-parser
// ...

app.use(cookieParser()); // Use cookie-parser

// Connect to MongoDB
connectToMongo();

// Configure express-session
app.use(
  session({
    secret: 'my-secret-key', // Replace with a strong, unique secret
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true in a production environment with HTTPS
      maxAge: 60 * 60 * 1000, // Session duration in milliseconds
    },
  })
);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

//auth middlewares
app.use('/v1/community', cookieAuthMiddleware);
app.use('/v1/members', cookieAuthMiddleware);
app.use('/v1/auth', cookieAuthMiddleware);

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
