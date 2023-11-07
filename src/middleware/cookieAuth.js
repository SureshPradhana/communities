// cookie-auth-middleware.js
const jwt = require('jsonwebtoken');
const { secretKey } = require('../../config/config'); 

const routeConfig = [
  {
    route: '/v1/community',
    methods: ['POST'],
    message: 'Unauthorized for POST request to /v1/community',
  },
  {
    route: '/v1/members',
    methods: ['POST', 'DELETE'],
    message: 'Unauthorized for POST or DELETE request to /v1/members',
  },
  {
    route: '/v1/auth/me',
    methods: ['GET'],
    message: 'Unauthorized for GET request to /v1/auth/me',
  },
  {
    route: '/v1/community/me/owner',
    methods: ['GET'],
    message: 'Unauthorized for GET request to /v1/community/me/owner',
  },
  {
    route: '/v1/community/me/member',
    methods: ['GET'],
    message: 'Unauthorized for GET request to /v1/community/me/owner',
  },
  // Add more route/method configurations as needed
];

function cookieAuthMiddleware(req, res, next) {
  const matchingConfig = routeConfig.find((config) => {
    const pathMatch = req.path.startsWith(config.route);
    const methodMatch = config.methods.includes(req.method);
    return pathMatch && methodMatch;
  });

  if (matchingConfig) {
    if (req.session.isAuthenticated) {
      // User is authenticated, allow access to the specific route/method

      // jwt.verify(req.session.token, secretKey, (err, decoded) => {
      //   if (err) {
      //     return res.status(401).json({ message: 'Invalid token' });
      //   }

        // Attach the user data from the token to the request object for future use
        // req.session.user = decoded;
        // console.log(req.session.user)
        next();
      // });
    } else {
      // User is not authenticated
      res.status(401).json({ message: matchingConfig.message });
    }
  } else {
    // For other routes or HTTP methods, allow the request to continue
    // jwt.verify(req.session.token, secretKey, (err, decoded) => {
      // if (err) {
      //   return res.status(401).json({ message: 'Invalid token' });
      // }

      // Attach the user data from the token to the request object for future use
      // req.session.user = decoded;
      next();
    // });

  }
}

module.exports = cookieAuthMiddleware;