const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../database/models');
const { Op } = require('sequelize');
const authService = require('../services/auth.service');
const settingService = require('../services/setting.service');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Register new user
exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body);

    if (req.accepts('html')) {
      // Set token in cookie for web clients
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });

      // Get user data for the view
      const user = await User.findOne({
        where: {
          id: result.user.id,
          is_active: true,
          deleted: false
        },
        include: ['todos', 'appointments']
      });

      // Get theme color
      let themeColor = '#72d1a8';
      try {
        themeColor = await settingService.getThemeColor();
      } catch (error) {
        console.error('Error getting theme color:', error);
      }

      return res.render('dashboard', {
        title: 'Dashboard | Planner Buddy',
        themeColor,
        user,
        success: 'Registration successful! Welcome to Planner Buddy.'
      });
    }

    // Return token for API clients
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (req.accepts('html')) {
      return res.render('auth/register', {
        title: 'Register | Planner Buddy',
        themeColor: '#72d1a8',
        user: null,
        error: error.message || 'Registration failed. Please try again.'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);

    if (req.accepts('html')) {
      // Set token in cookie for web clients
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });
      
      // Redirect to original URL or dashboard
      const returnTo = req.session?.returnTo || '/dashboard';
      delete req.session?.returnTo;
      return res.redirect(returnTo);
    }

    // Return token for API clients
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    console.error('Login error:', error);
    if (req.accepts('html')) {
      return res.render('auth/login', {
        title: 'Login | Planner Buddy',
        themeColor: '#72d1a8',
        user: null,
        error: error.message || 'Login failed. Please try again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

// Logout user
exports.logout = (req, res) => {
  res.clearCookie('token', { path: '/' });
  if (req.accepts('html')) {
    return res.redirect('/auth/login');
  }
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    return res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user information'
    });
  }
}; 