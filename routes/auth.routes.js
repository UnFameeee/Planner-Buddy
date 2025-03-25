const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../utils/auth.middleware');

// API Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

// View Routes
router.get('/login', authController.renderLogin);
router.get('/register', authController.renderRegister);

module.exports = router; 