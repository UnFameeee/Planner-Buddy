const express = require('express');
const router = express.Router();
const appointmentController = require('../../controllers/appointment.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// API Routes
router.get('/', appointmentController.getAllAppointments);
router.post('/', appointmentController.createAppointment);
router.get('/upcoming', appointmentController.getUpcomingAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.put('/:id', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router; 