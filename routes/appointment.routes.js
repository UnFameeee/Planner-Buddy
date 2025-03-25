const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { authenticate } = require('../utils/auth.middleware');

// Protect all routes with authentication
router.use(authenticate);

// View Routes - phải đặt trước các route có path param
router.get('/view/calendar', appointmentController.renderAppointmentsPage);
router.get('/view/create', appointmentController.renderCreateAppointmentPage);
router.get('/view/edit/:id', appointmentController.renderEditAppointmentPage);

// API Routes với path cụ thể
router.get('/day', appointmentController.getAppointmentsByDay);
router.get('/week', appointmentController.getAppointmentsByWeek);
router.get('/month', appointmentController.getAppointmentsByMonth);

// API Routes với path param
router.get('/', appointmentController.getAllAppointments);
router.post('/', appointmentController.createAppointment);
router.get('/:id', appointmentController.getAppointmentById);
router.put('/:id', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router; 