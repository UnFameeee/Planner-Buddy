const jwt = require('jsonwebtoken');
const { User } = require('../database/models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to handle both cookie and bearer token authentication
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookie first (for web clients)
    if (req.cookies?.token) {
      token = req.cookies.token;
    }
    // Then check for bearer token in header (for API clients)
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // Do not redirect for web clients, just provide error but continue
      if (req.accepts('html')) {
        // Store the URL they were trying to access
        req.session.returnTo = req.originalUrl;
        req.authError = 'Please log in to continue.';
        req.user = null; // Explicitly set user to null
        return next();
      }
      
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Do not redirect, just set error and continue
        if (req.accepts('html')) {
          req.authError = 'Your session has expired. Please log in again.';
          return next();
        }
        
        return res.status(401).json({
          success: false,
          message: 'Token expired.'
        });
      }
      
      // Do not redirect, just set error and continue
      if (req.accepts('html')) {
        req.authError = 'Invalid token. Please log in again.';
        return next();
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
      // Do not redirect, just set error and continue
      if (req.accepts('html')) {
        req.authError = 'User account not found or inactive.';
        return next();
      }
      
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive.'
      });
    }

    // Check token expiration with buffer time
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp - currentTime < 300) { // Less than 5 minutes remaining
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
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Do not redirect for web clients, just provide error but continue
    if (req.accepts('html')) {
      req.authError = 'Authentication failed. Please try again.';
      return next();
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