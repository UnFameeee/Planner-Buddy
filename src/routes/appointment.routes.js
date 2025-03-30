const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// View Routes
router.get('/create', appointmentController.renderCreateAppointmentPage);
router.get('/calendar', appointmentController.renderAppointmentsPage);
router.get('/edit/:id', appointmentController.renderEditAppointmentPage);

module.exports = router; 