const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const settingService = require('../services/setting.service');

// Helper function to get theme color
const getThemeColor = async () => {
  try {
    return await settingService.getThemeColor();
  } catch (error) {
    console.error('Error getting theme color:', error);
    return '#72d1a8';
  }
};

// View routes - render EJS templates
router.get('/login', async (req, res) => {
  const themeColor = await getThemeColor();
  res.render('auth/login', {
    title: 'Login | Planner Buddy',
    themeColor,
    user: null,
    path: req.path,
    error: req.query.error || null,
    success: req.query.success || null
  });
});

router.get('/register', async (req, res) => {
  const themeColor = await getThemeColor();
  res.render('auth/register', {
    title: 'Register | Planner Buddy',
    themeColor,
    user: null,
    path: req.path,
    error: req.query.error || null,
    success: req.query.success || null
  });
});

// Form processing routes
router.post('/login', login);
router.post('/register', register);
router.get('/logout', logout);

module.exports = router; 