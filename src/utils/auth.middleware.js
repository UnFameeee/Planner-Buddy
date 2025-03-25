const { verifyToken } = require('./auth.util');
const { User } = require('../database/models');

// Middleware to authenticate JWT token
const authenticate = async (req, res, next) => {
  try {
    // Check for token in Authorization header (for API calls)
    let token = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If no token in header and it's not an API call, check if it's a view route
    // For view routes, redirect to login instead of sending JSON error
    if (!token) {
      const isApiCall = req.path.startsWith('/api') || 
                        req.xhr || 
                        req.headers.accept && req.headers.accept.includes('application/json');
      
      if (!isApiCall) {
        return res.redirect('/auth/login');
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      // For API calls, return JSON error
      if (req.xhr || req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token. Please login again.' 
        });
      }
      
      // For view routes, redirect to login
      return res.redirect('/auth/login');
    }

    // Find user by id
    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active) {
      if (req.xhr || req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found or inactive.' 
        });
      }
      
      return res.redirect('/auth/login');
    }

    // Set user in request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_active: user.is_active,
      timezone: user.timezone
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (req.xhr || req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication error.', 
        error: error.message 
      });
    }
    
    return res.redirect('/auth/login');
  }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    // In a real application, you would check for admin role
    // Here we're simplifying by checking username
    if (req.user.username !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin rights required.' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Authorization error.', 
      error: error.message 
    });
  }
};

module.exports = {
  authenticate,
  isAdmin
}; 