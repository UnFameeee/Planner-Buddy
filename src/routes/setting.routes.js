const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');

// Routes without authentication
router.get('/theme', settingController.getThemeColor);
router.post('/theme', settingController.updateThemeColor);

module.exports = router; 