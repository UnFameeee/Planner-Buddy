const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');

// View Routes - must be placed before parameterized routes
router.get('/create', appointmentController.renderCreateAppointmentPage);
router.get('/calendar', appointmentController.renderAppointmentsPage);
router.get('/edit/:id', appointmentController.renderEditAppointmentPage);

// API Routes
router.get('/', appointmentController.getAllAppointments);
router.post('/', appointmentController.createAppointment);
router.get('/:id', appointmentController.getAppointmentById);
router.put('/:id', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router; 