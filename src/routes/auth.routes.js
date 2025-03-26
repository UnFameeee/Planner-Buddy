const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Get login page
router.get('/login', (req, res) => {
  res.render('auth/login', { 
    title: 'Login | Planner Buddy',
    themeColor: '#72d1a8',
    user: null,
    error: null 
  });
});

// Get register page
router.get('/register', (req, res) => {
  res.render('auth/register', { 
    title: 'Register | Planner Buddy',
    themeColor: '#72d1a8',
    user: null,
    error: null 
  });
});

// Logout route
router.get('/logout', authController.logout);

module.exports = router; 