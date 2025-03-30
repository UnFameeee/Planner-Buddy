const jwt = require('jsonwebtoken');
const { User } = require('../database/models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password'
];

// Middleware to handle both cookie and bearer token authentication
const authenticate = async (req, res, next) => {
  try {
    // First check if it's a public route (ignoring query parameters)
    const currentPath = req.path;
    const isPublicRoute = publicRoutes.some(route => currentPath === route);
    
    // For public routes, we still try to attach the user if a token exists
    let token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    
    if (!token) {
      // If it's a public route, allow access without token
      if (isPublicRoute) {
        return next();
      }
      
      console.log('No token found for protected path:', currentPath);
      // Store authentication error for later use (in case we want to show it)
      req.authError = 'No token provided. Please log in.';
      
      // For web clients, redirect to login
      if (req.accepts('html') && !req.originalUrl.startsWith('/api/')) {
        // Store the URL they were trying to access
        req.session.returnTo = req.originalUrl;
        return res.redirect('/auth/login');
      }
      
      // For API requests or non-HTML requests
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token verified for user:', decoded.username);
    } catch (error) {
      console.log('Token verification failed:', error.message);
      
      // If it's a public route, allow access even with invalid token
      if (isPublicRoute) {
        return next();
      }
      
      if (error.name === 'TokenExpiredError') {
        req.authError = 'Your session has expired. Please log in again.';
        
        if (req.accepts('html') && !req.originalUrl.startsWith('/api/')) {
          req.session.returnTo = req.originalUrl;
          return res.redirect('/auth/login?error=expired');
        }
        
        return res.status(401).json({
          success: false,
          message: 'Token expired.'
        });
      }
      
      req.authError = 'Invalid authentication. Please log in again.';
      
      if (req.accepts('html') && !req.originalUrl.startsWith('/api/')) {
        req.session.returnTo = req.originalUrl;
        return res.redirect('/auth/login?error=invalid');
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    // Check if user exists and is active
    const user = await User.findOne({
      where: {
        id: decoded.id,
        is_active: true,
        deleted: false
      }
    });

    if (!user) {
      console.log('User not found or inactive:', decoded.id);
      
      // If it's a public route, allow access even without valid user
      if (isPublicRoute) {
        return next();
      }
      
      req.authError = 'User account not found or inactive.';
      
      if (req.accepts('html') && !req.originalUrl.startsWith('/api/')) {
        req.session.returnTo = req.originalUrl;
        return res.redirect('/auth/login?error=inactive');
      }
      
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive.'
      });
    }

    // Check token expiration with buffer time
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp - currentTime < 300) { // Less than 5 minutes remaining
      console.log('Refreshing token for user:', user.username);
      // Generate new token
      const newToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          timezone: user.timezone,
          is_admin: user.is_admin
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Set new token in cookie for web clients
      if (req.cookies?.token) {
        res.cookie('token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          path: '/'
        });
      }

      // Set new token in response header for API clients
      res.setHeader('X-New-Token', newToken);
    }

    // Attach user to request
    req.user = user;
    console.log('User attached to request:', user.username);
    
    // For protected routes, ensure we have a user
    if (!isPublicRoute && !req.user) {
      console.log('No user found for protected route:', currentPath);
      
      req.authError = 'Authentication required.';
      
      if (req.accepts('html') && !req.originalUrl.startsWith('/api/')) {
        req.session.returnTo = req.originalUrl;
        return res.redirect('/auth/login');
      }
      
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Store the error message
    req.authError = 'Authentication error occurred. Please try again.';
    
    // If it's a public route, allow access even on error
    if (publicRoutes.includes(req.path)) {
      return next();
    }
    
    if (req.accepts('html') && !req.originalUrl.startsWith('/api/')) {
      req.session.returnTo = req.originalUrl;
      return res.redirect('/auth/login?error=server');
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user?.is_admin) {
      if (req.accepts('html')) {
        return res.render('error', {
          title: 'Access Denied | Planner Buddy',
          themeColor: '#72d1a8',
          user: req.user,
          error: 'Access denied. Admin privileges required.'
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    if (req.accepts('html')) {
      return res.render('error', {
        title: 'Error | Planner Buddy',
        themeColor: '#72d1a8',
        user: req.user,
        error: 'An error occurred while checking permissions.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error checking permissions.'
    });
  }
};

module.exports = {
  authenticate,
  isAdmin
}; 