const appointmentService = require('../services/appointment.service');
const settingService = require('../services/setting.service');

// Get all appointments for current user
const getAllAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Extract query parameters for filtering, pagination, and sorting
    const { date, start_date, end_date, search, page, limit, sortBy, sortOrder, view, year, month } = req.query;

    console.log('Appointment query params:', req.query);
    
    // Handle calendar views
    if (view === 'week' && date) {
      // Handle week view
      const appointments = await appointmentService.getAppointmentsByWeek(userId, date);
      return res.status(200).json({
        success: true,
        data: appointments
      });
    } else if (date && !view) {
      // Handle day view
      const appointments = await appointmentService.getAppointmentsByDay(userId, date);
      return res.status(200).json({
        success: true,
        data: appointments
      });
    } else if (year && month && view === 'month') {
      // Handle month view
      const appointments = await appointmentService.getAppointmentsByMonth(userId, year, month);
      return res.status(200).json({
        success: true,
        data: appointments
      });
    }
    
    // Default: Get appointments with options 
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
    console.error('Error in getAllAppointments:', error);
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

// Get upcoming appointments
const getUpcomingAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;
    
    // Get upcoming appointments
    const appointments = await appointmentService.getUpcomingAppointments(userId, limit);
    
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

// Render appointments page
const renderAppointmentsPage = async (req, res) => {
  try {
    const themeColor = await settingService.getThemeColor();
    const appName = await settingService.getAppName();
    
    // If authentication failed but we're still here
    if (!req.user) {
      return res.render('appointments/calendar', {
        title: `Appointments | ${appName}`,
        themeColor,
        user: null,
        view: req.query.view || 'month',
        error: req.authError || 'Authentication required'
      });
    }
    
    res.render('appointments/calendar', {
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
    
    // If authentication failed but we're still here
    if (!req.user) {
      return res.render('appointments/create', {
        title: `Create Appointment | ${appName}`,
        themeColor,
        user: null,
        error: req.authError || 'Authentication required'
      });
    }
    
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
    const themeColor = await settingService.getThemeColor();
    const appName = await settingService.getAppName();
    
    // If authentication failed but we're still here
    if (!req.user) {
      return res.render('appointments/edit', {
        title: `Edit Appointment | ${appName}`,
        themeColor,
        user: null,
        error: req.authError || 'Authentication required',
        appointment: null
      });
    }
    
    const userId = req.user.id;
    const appointmentId = req.params.id;
    
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
  getUpcomingAppointments,
  renderAppointmentsPage,
  renderCreateAppointmentPage,
  renderEditAppointmentPage
}; 