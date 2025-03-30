const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// View Routes
router.get('/', settingController.renderSettingsPage);

// Routes without authentication
router.get('/theme', settingController.getThemeColor);
router.post('/theme', settingController.updateThemeColor);

module.exports = router; 