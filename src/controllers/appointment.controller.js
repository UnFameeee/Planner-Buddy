const appointmentService = require('../services/appointment.service');
const settingService = require('../services/setting.service');

// Get all appointments for current user
const getAllAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Extract query parameters for filtering, pagination, and sorting
    const { start_date, end_date, search, page, limit, sortBy, sortOrder } = req.query;
    
    // Get appointments with options
    const result = await appointmentService.getUserAppointments(userId, {
      start_date,
      end_date,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sortBy: sortBy || 'start_time',
      sortOrder: sortOrder || 'ASC'
    });
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get appointments by day
const getAppointmentsByDay = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    // Get appointments for the specified day
    const appointments = await appointmentService.getAppointmentsByDay(userId, date);
    
    return res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get appointments by week
const getAppointmentsByWeek = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    // Get appointments for the specified week
    const appointments = await appointmentService.getAppointmentsByWeek(userId, date);
    
    return res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get appointments by month
const getAppointmentsByMonth = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }
    
    // Get appointments for the specified month
    const appointments = await appointmentService.getAppointmentsByMonth(userId, year, month);
    
    return res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single appointment by ID
const getAppointmentById = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointmentId = req.params.id;
    
    // Get appointment
    const appointment = await appointmentService.getAppointmentById(appointmentId, userId);
    
    return res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Create a new appointment
const createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointmentData = req.body;
    
    // Validate required fields
    if (!appointmentData.title || !appointmentData.start_time || !appointmentData.end_time) {
      return res.status(400).json({
        success: false,
        message: 'Title, start time, and end time are required for appointment'
      });
    }
    
    // Create appointment
    const newAppointment = await appointmentService.createAppointment(appointmentData, userId);
    
    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: newAppointment
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update an existing appointment
const updateAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointmentId = req.params.id;
    const appointmentData = req.body;
    
    // Update appointment
    const updatedAppointment = await appointmentService.updateAppointment(appointmentId, appointmentData, userId);
    
    return res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete an appointment
const deleteAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointmentId = req.params.id;
    
    // Delete appointment
    const result = await appointmentService.deleteAppointment(appointmentId, userId);
    
    return res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Render appointments page
const renderAppointmentsPage = async (req, res) => {
  try {
    const themeColor = await settingService.getThemeColor();
    const appName = await settingService.getAppName();
    
    res.render('appointments/index', {
      title: `Appointments | ${appName}`,
      themeColor,
      user: req.user,
      view: req.query.view || 'month'
    });
  } catch (error) {
    res.render('error', {
      message: 'Error loading appointments page',
      error
    });
  }
};

// Render create appointment page
const renderCreateAppointmentPage = async (req, res) => {
  try {
    const themeColor = await settingService.getThemeColor();
    const appName = await settingService.getAppName();
    
    res.render('appointments/create', {
      title: `Create Appointment | ${appName}`,
      themeColor,
      user: req.user
    });
  } catch (error) {
    res.render('error', {
      message: 'Error loading create appointment page',
      error
    });
  }
};

// Render edit appointment page
const renderEditAppointmentPage = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointmentId = req.params.id;
    const themeColor = await settingService.getThemeColor();
    const appName = await settingService.getAppName();
    
    // Get appointment
    const appointment = await appointmentService.getAppointmentById(appointmentId, userId);
    
    res.render('appointments/edit', {
      title: `Edit Appointment | ${appName}`,
      themeColor,
      user: req.user,
      appointment
    });
  } catch (error) {
    res.render('error', {
      message: 'Error loading edit appointment page',
      error
    });
  }
};

module.exports = {
  getAllAppointments,
  getAppointmentsByDay,
  getAppointmentsByWeek,
  getAppointmentsByMonth,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  renderAppointmentsPage,
  renderCreateAppointmentPage,
  renderEditAppointmentPage
}; 