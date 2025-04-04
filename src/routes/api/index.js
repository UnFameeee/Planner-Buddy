const express = require('express');
const router = express.Router();

// Import API routes
const todoRoutes = require('./todo.routes');
const appointmentRoutes = require('./appointment.routes');
const settingRoutes = require('./setting.routes');
const authRoutes = require('./auth.routes');

// Register API routes
router.use('/todos', todoRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/settings', settingRoutes);
router.use('/auth', authRoutes);

module.exports = router; 