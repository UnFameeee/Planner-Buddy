const { Appointment, User } = require('../database/models');
const { Op } = require('sequelize');
const { sendAppointmentReminder } = require('../utils/email.util');

// Get all appointments for a user
const getUserAppointments = async (userId, options = {}) => {
  try {
    const { start_date, end_date, search, page = 1, limit = 10, sortBy = 'start_time', sortOrder = 'ASC' } = options;
    
    // Build filters
    const filters = { user_id: userId };
    
    // Filter by date range
    if (start_date && end_date) {
      filters.start_time = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else if (start_date) {
      filters.start_time = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      filters.start_time = {
        [Op.lte]: new Date(end_date)
      };
    }
    
    // Search in title, description, or location
    if (search) {
      filters[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get appointments with pagination
    const { count, rows: appointments } = await Appointment.findAndCountAll({
      where: filters,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      attributes: { exclude: ['deleted'] }
    });
    
    return {
      appointments,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    };
  } catch (error) {
    throw new Error(`Error fetching appointments: ${error.message}`);
  }
};

// Get appointment by day (for calendar view)
const getAppointmentsByDay = async (userId, date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointments = await Appointment.findAll({
      where: {
        user_id: userId,
        start_time: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      order: [['start_time', 'ASC']]
    });
    
    return appointments;
  } catch (error) {
    throw new Error(`Error fetching appointments by day: ${error.message}`);
  }
};

// Get appointment by week (for calendar view)
const getAppointmentsByWeek = async (userId, date) => {
  try {
    const givenDate = new Date(date);
    
    // Calculate start of week (Sunday)
    const startOfWeek = new Date(givenDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate end of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const appointments = await Appointment.findAll({
      where: {
        user_id: userId,
        start_time: {
          [Op.between]: [startOfWeek, endOfWeek]
        }
      },
      order: [['start_time', 'ASC']]
    });
    
    return appointments;
  } catch (error) {
    throw new Error(`Error fetching appointments by week: ${error.message}`);
  }
};

// Get appointment by month (for calendar view)
const getAppointmentsByMonth = async (userId, year, month) => {
  try {
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    
    const appointments = await Appointment.findAll({
      where: {
        user_id: userId,
        start_time: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      },
      order: [['start_time', 'ASC']]
    });
    
    return appointments;
  } catch (error) {
    throw new Error(`Error fetching appointments by month: ${error.message}`);
  }
};

// Get a single appointment by ID
const getAppointmentById = async (appointmentId, userId) => {
  try {
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        user_id: userId
      }
    });
    
    if (!appointment) {
      throw new Error('Appointment not found or access denied');
    }
    
    return appointment;
  } catch (error) {
    throw new Error(`Error fetching appointment: ${error.message}`);
  }
};

// Create a new appointment
const createAppointment = async (appointmentData, userId) => {
  try {
    const newAppointment = await Appointment.create({
      ...appointmentData,
      user_id: userId
    });
    
    return newAppointment;
  } catch (error) {
    throw new Error(`Error creating appointment: ${error.message}`);
  }
};

// Update an existing appointment
const updateAppointment = async (appointmentId, appointmentData, userId) => {
  try {
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        user_id: userId
      }
    });
    
    if (!appointment) {
      throw new Error('Appointment not found or access denied');
    }
    
    // Update appointment
    await appointment.update(appointmentData);
    
    return appointment;
  } catch (error) {
    throw new Error(`Error updating appointment: ${error.message}`);
  }
};

// Delete an appointment
const deleteAppointment = async (appointmentId, userId) => {
  try {
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        user_id: userId
      }
    });
    
    if (!appointment) {
      throw new Error('Appointment not found or access denied');
    }
    
    // Soft delete the appointment
    await appointment.destroy();
    
    return { success: true, message: 'Appointment deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting appointment: ${error.message}`);
  }
};

// Process reminders for appointments
const processAppointmentReminders = async () => {
  try {
    const now = new Date();
    
    // Find appointments with reminders due and not sent yet
    const dueAppointments = await Appointment.findAll({
      where: {
        reminder_time: { [Op.lte]: now },
        reminder_sent: false,
        start_time: { [Op.gt]: now } // Only remind for future appointments
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'timezone']
      }]
    });
    
    for (const appointment of dueAppointments) {
      if (appointment.user) {
        // Send reminder
        await sendAppointmentReminder(appointment.user, appointment);
        
        // Mark reminder as sent
        await appointment.update({ reminder_sent: true });
      }
    }
    
    return { success: true, reminders_sent: dueAppointments.length };
  } catch (error) {
    throw new Error(`Error processing appointment reminders: ${error.message}`);
  }
};

module.exports = {
  getUserAppointments,
  getAppointmentsByDay,
  getAppointmentsByWeek,
  getAppointmentsByMonth,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  processAppointmentReminders
}; 