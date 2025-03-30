const express = require('express');
const router = express.Router();
const { register, login, logout, getCurrentUser } = require('../../controllers/auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Public API routes
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);

// Protected API routes
router.get('/me', authenticate, getCurrentUser);

module.exports = router; 