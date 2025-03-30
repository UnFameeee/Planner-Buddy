const { Appointment, User } = require('../database/models');
const { Op } = require('sequelize');
const { sendAppointmentReminder } = require('../utils/email.util');
const emailQueueService = require('./email_queue.service');

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
    console.log(`Creating appointment for user: ${userId}`);
    console.log('Appointment data:', JSON.stringify(appointmentData, null, 2));
    
    // Đảm bảo các trường reminder_settings được khởi tạo đúng nếu không có
    if (!appointmentData.reminder_settings) {
      appointmentData.reminder_settings = {
        enabled: true,
        minutes_before: 30,
        email_notification: true,
        reminder_type: 'once'
      };
    }
    
    const newAppointment = await Appointment.create({
      ...appointmentData,
      user_id: userId
    });
    
    console.log(`Appointment created with ID: ${newAppointment.id}`);
    
    // Lấy thông tin user để tạo email reminder
    const user = await User.findByPk(userId);
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      throw new Error('User not found');
    }
    
    // Tạo email reminder
    console.log('Creating email reminder for the appointment...');
    try {
      const emailQueue = await emailQueueService.createAppointmentReminder(newAppointment, user);
      if (emailQueue) {
        console.log(`Email reminder created successfully with queue ID: ${emailQueue.id}`);
      } else {
        console.log('No email reminder was created (reminder time may have passed or notifications disabled)');
      }
    } catch (reminderError) {
      console.error('Error creating email reminder:', reminderError);
      // Tiếp tục luồng xử lý ngay cả khi không thể tạo reminder
    }
    
    return newAppointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw new Error(`Error creating appointment: ${error.message}`);
  }
};

// Update an existing appointment
const updateAppointment = async (appointmentId, appointmentData, userId) => {
  try {
    console.log(`Updating appointment ID: ${appointmentId} for user: ${userId}`);
    console.log('Appointment update data:', JSON.stringify(appointmentData, null, 2));
    
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        user_id: userId
      }
    });
    
    if (!appointment) {
      console.error(`Appointment not found with ID: ${appointmentId} for user: ${userId}`);
      throw new Error('Appointment not found or access denied');
    }
    
    // Lưu thời gian cũ để kiểm tra xem có thay đổi không
    const oldStartTime = appointment.start_time;
    
    // Update appointment
    await appointment.update(appointmentData);
    console.log(`Appointment updated successfully, ID: ${appointment.id}`);
    
    // Nếu thời gian hoặc reminder settings thay đổi, cập nhật email reminder
    if (new Date(oldStartTime).getTime() !== new Date(appointment.start_time).getTime() || 
        appointmentData.reminder_settings) {
      
      console.log('Start time or reminder settings changed, updating email reminder...');
      
      // Lấy thông tin user
      const user = await User.findByPk(userId);
      if (!user) {
        console.error(`User not found with ID: ${userId}`);
        throw new Error('User not found');
      }
      
      // Tạo email reminder mới
      try {
        const emailQueue = await emailQueueService.createAppointmentReminder(appointment, user);
        if (emailQueue) {
          console.log(`New email reminder created successfully with queue ID: ${emailQueue.id}`);
        } else {
          console.log('No new email reminder was created (reminder time may have passed or notifications disabled)');
        }
      } catch (reminderError) {
        console.error('Error creating updated email reminder:', reminderError);
        // Tiếp tục luồng xử lý ngay cả khi không thể tạo reminder
      }
    } else {
      console.log('No changes to start time or reminder settings, not updating email reminder');
    }
    
    return appointment;
  } catch (error) {
    console.error('Error updating appointment:', error);
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
    
    // Delete appointment
    await appointment.destroy();
    
    return true;
  } catch (error) {
    throw new Error(`Error deleting appointment: ${error.message}`);
  }
};

// Get upcoming appointments
const getUpcomingAppointments = async (userId, limit = 5) => {
  try {
    const now = new Date();
    
    const appointments = await Appointment.findAll({
      where: {
        user_id: userId,
        start_time: {
          [Op.gte]: now
        }
      },
      order: [['start_time', 'ASC']],
      limit
    });
    
    return appointments;
  } catch (error) {
    throw new Error(`Error fetching upcoming appointments: ${error.message}`);
  }
};

// Process reminders for appointments
const processAppointmentReminders = async () => {
  try {
    const now = new Date();
    console.log(`Processing appointment reminders at: ${now.toISOString()}`);
    
    // Find appointments with reminders due and not sent yet
    const dueAppointments = await Appointment.findAll({
      where: {
        reminder_time: { [Op.lte]: now },
        reminder_sent: false,
        deleted: false
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'username', 'timezone']
      }]
    });

    console.log(`Found ${dueAppointments.length} appointments with reminders due`);
    
    // Process each appointment
    for (const appointment of dueAppointments) {
      try {
        console.log(`Processing reminder for appointment: ${appointment.id} - ${appointment.title}`);
        
        // Kiểm tra xem có cần gửi email không
        const reminderSettings = appointment.reminder_settings || {
          enabled: true,
          email_notification: true
        };
        
        if (reminderSettings.enabled && reminderSettings.email_notification) {
          console.log('Email notification is enabled, creating reminder...');
          // Chỉ tạo reminder nếu chưa có trong email_queue
          const user = appointment.user;
          if (!user) {
            console.log(`User not found for appointment ${appointment.id}, skipping reminder`);
            continue;
          }
          
          const emailQueue = await emailQueueService.createAppointmentReminder(appointment, user);
          if (emailQueue) {
            console.log(`Reminder created and added to queue with ID: ${emailQueue.id}`);
          } else {
            console.log('No reminder created (possibly already passed the reminder time)');
          }
        } else {
          console.log('Email notification is disabled for this appointment, skipping reminder creation');
        }
        
        // Đánh dấu là đã gửi
        await appointment.update({ reminder_sent: true });
        
        console.log(`Reminder processed for appointment: ${appointment.id} - ${appointment.title}`);
      } catch (error) {
        console.error(`Error processing reminder for appointment ${appointment.id}:`, error);
      }
    }
    
    return dueAppointments.length;
  } catch (error) {
    console.error('Error processing appointment reminders:', error);
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
  getUpcomingAppointments,
  processAppointmentReminders
}; 