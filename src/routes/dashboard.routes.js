const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Dashboard routes
router.get('/', dashboardController.renderDashboard);
router.get('/statistics', dashboardController.renderStatisticsPage);

module.exports = router; 