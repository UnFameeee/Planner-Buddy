const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');
const { authenticate, isAdmin } = require('../utils/auth.middleware');

// Protect all routes with authentication and admin check
router.use(authenticate, isAdmin);

// API Routes
router.get('/', settingController.getAllSettings);
router.get('/:key', settingController.getSettingByKey);
router.put('/:key', settingController.updateSetting);
router.delete('/:key', settingController.deleteSetting);

// View Routes
router.get('/view/admin', settingController.renderSettingsPage);

module.exports = router; 