// Render dashboard page
const renderDashboard = async (req, res) => {
  try {
    const settingService = require('../services/setting.service');
    const todoService = require('../services/todo.service');
    const appointmentService = require('../services/appointment.service');
    
    const themeColor = await settingService.getThemeColor();
    const appName = await settingService.getAppName();
    
    // Get user's todos and appointments for display on dashboard
    const todoResult = await todoService.getUserTodos(req.user.id, { limit: 5 });
    const appointments = await appointmentService.getUpcomingAppointments(req.user.id, 5);
    
    // Add todos and appointments to user object for dashboard display
    const userWithData = { 
      ...req.user,
      todos: todoResult.todos || [],
      appointments: appointments || []
    };
    
    res.render('dashboard', {
      title: `Dashboard | ${appName}`,
      themeColor,
      user: userWithData
    });
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.render('error', {
      message: 'Error loading dashboard',
      error
    });
  }
};

// Render statistics page
const renderStatisticsPage = async (req, res) => {
  try {
    const settingService = require('../services/setting.service');
    const todoService = require('../services/todo.service');
    const appointmentService = require('../services/appointment.service');
    
    const themeColor = await settingService.getThemeColor();
    const appName = await settingService.getAppName();
    
    // Get current date in YYYY-MM-DD format
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    // Get today's todos
    const todayTodos = await todoService.getTodosByDate(req.user.id, formattedDate);
    
    // Get today's appointments
    const todayAppointments = await appointmentService.getAppointmentsByDay(req.user.id, formattedDate);
    
    res.render('statistics', {
      title: `Statistics | ${appName}`,
      themeColor,
      user: req.user,
      todayTodos,
      todayAppointments,
      currentDate: today
    });
  } catch (error) {
    console.error('Error rendering statistics page:', error);
    res.render('error', {
      message: 'Error loading statistics page',
      error
    });
  }
};

module.exports = {
  renderDashboard,
  renderStatisticsPage
}; 