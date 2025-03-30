const express = require('express');
const router = express.Router();
const settingController = require('../../controllers/setting.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// API Routes
router.get('/', settingController.getAllSettings);
router.put('/:key', settingController.updateSetting);
router.get('/:key', settingController.getSettingByKey);

module.exports = router; 