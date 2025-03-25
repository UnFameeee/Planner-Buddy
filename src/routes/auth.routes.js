const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../utils/auth.middleware');

// API Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

// Thêm endpoint để kiểm tra token
router.get('/check-token', authenticate, (req, res) => {
  try {
    // Middleware authenticate đã xác thực và set req.user
    console.log('[Auth Routes] Token check passed for user:', req.user.username);
    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: {
        id: req.user.id,
        username: req.user.username
      }
    });
  } catch (error) {
    console.error('[Auth Routes] Error checking token:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking token'
    });
  }
});

// View Routes
router.get('/login', authController.renderLogin);
router.get('/register', authController.renderRegister);

// Test Routes
router.get('/create-test-user', authController.createTestUser);

module.exports = router; 