const { Appointment, User, EmailQueue } = require('../database/models');
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
    console.log('Appointment type from request:', appointmentData.appointment_type);
    
    // Convert start_time and end_time to Date objects if they are strings
    if (typeof appointmentData.start_time === 'string') {
      appointmentData.start_time = new Date(appointmentData.start_time);
    }
    if (typeof appointmentData.end_time === 'string') {
      appointmentData.end_time = new Date(appointmentData.end_time);
    }
    
    // Set set_reminder = true by default if not explicitly set
    if (appointmentData.set_reminder === undefined) {
      appointmentData.set_reminder = true;
    }
    
    console.log(`set_reminder: ${appointmentData.set_reminder}`);
    console.log(`reminder_method: ${appointmentData.reminder_method || 'not specified'}`);
    
    // Đảm bảo các trường reminder_settings được khởi tạo đúng
    appointmentData.reminder_settings = {
      enabled: appointmentData.set_reminder !== false, // true by default unless explicitly set to false
      minutes_before: appointmentData.reminderTime ? parseInt(appointmentData.reminderTime) : 30,
      email_notification: true, // always enable email notification
      reminder_type: 'once'
    };
    
    console.log('Reminder settings:', JSON.stringify(appointmentData.reminder_settings, null, 2));
    
    // Create the appointment
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
    
    // Chỉ tạo email reminder nếu reminder được bật
    if (appointmentData.reminder_settings.enabled && appointmentData.reminder_settings.email_notification) {
      console.log('Creating email reminder for the appointment...');
      try {
        const emailQueue = await emailQueueService.createAppointmentReminder(newAppointment, user);
        if (emailQueue) {
          console.log(`Email reminder created successfully with queue ID: ${emailQueue.id}`);
        } else {
          console.log('No email reminder was created (reminder settings disabled)');
        }
      } catch (reminderError) {
        console.error('Error creating email reminder:', reminderError);
        console.error('Error stack:', reminderError.stack);
        // Tiếp tục luồng xử lý ngay cả khi không thể tạo reminder
      }
    } else {
      console.log('Email notification is disabled for this appointment, skipping reminder creation');
    }
    
    return newAppointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Error creating appointment: ${error.message}`);
  }
};

// Update an existing appointment
const updateAppointment = async (appointmentId, appointmentData, userId) => {
  try {
    console.log(`Updating appointment ID: ${appointmentId} for user: ${userId}`);
    console.log('Appointment update data:', JSON.stringify(appointmentData, null, 2));
    console.log('Appointment type from update request:', appointmentData.appointment_type);
    
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
    
    // Kiểm tra xem email đã được transfer sang progress chưa
    const emailsTransferred = await EmailQueue.findOne({
      where: {
        appointment_id: appointmentId,
        status: 'transferred'
      }
    });
    
    if (emailsTransferred) {
      throw new Error('Appointment reminder has already been processed and cannot be modified. Please create a new appointment instead.');
    }
    
    // Lưu thời gian cũ để kiểm tra xem có thay đổi không
    const oldStartTime = appointment.start_time;
    const oldReminderSettings = appointment.reminder_settings;
    
    // Prepare reminder settings if needed
    if (appointmentData.set_reminder !== undefined && !appointmentData.reminder_settings) {
      appointmentData.reminder_settings = {
        enabled: Boolean(appointmentData.set_reminder),
        minutes_before: appointmentData.set_reminder ? parseInt(appointmentData.reminderTime || 30) : 30,
        email_notification: appointmentData.reminder_method ? 
          (appointmentData.reminder_method === 'email' || appointmentData.reminder_method === 'both') : 
          true,
        reminder_type: 'once'
      };
    }
    
    // Update appointment
    await appointment.update(appointmentData);
    console.log(`Appointment updated successfully, ID: ${appointment.id}`);
    
    // Check if time, reminder settings or reminder status changed
    const timeChanged = new Date(oldStartTime).getTime() !== new Date(appointment.start_time).getTime();
    const reminderSettingsChanged = JSON.stringify(oldReminderSettings) !== JSON.stringify(appointment.reminder_settings);
    const reminderStatusChanged = oldReminderSettings?.enabled !== appointment.reminder_settings?.enabled;
    
    console.log(`Time changed: ${timeChanged}`);
    console.log(`Reminder settings changed: ${reminderSettingsChanged}`);
    console.log(`Reminder status changed: ${reminderStatusChanged}`);
    
    // Nếu thời gian, cài đặt reminder thay đổi và reminder được bật -> tạo reminder mới
    if ((timeChanged || reminderSettingsChanged) && appointment.reminder_settings?.enabled) {
      console.log('Time or reminder settings changed and reminder is enabled, updating email reminder...');
      
      // Hủy các reminder cũ trước khi tạo mới
      const pendingEmails = await EmailQueue.findAll({
        where: {
          appointment_id: appointmentId,
          status: 'pending'
        }
      });
      
      console.log(`Found ${pendingEmails.length} pending email reminders to cancel`);
      
      for (const email of pendingEmails) {
        await email.update({ status: 'canceled' });
        console.log(`Canceled email queue with ID: ${email.id}`);
      }
      
      // Chỉ tạo reminder mới nếu reminder được bật
      if (appointment.reminder_settings.enabled && appointment.reminder_settings.email_notification) {
        try {
          // Lấy thông tin user
          const user = await User.findByPk(userId);
          if (!user) {
            throw new Error('User not found');
          }
          
          // Tạo reminder mới
          const emailQueue = await emailQueueService.createAppointmentReminder(appointment, user);
          if (emailQueue) {
            console.log(`New email reminder created with queue ID: ${emailQueue.id}`);
          } else {
            console.log('No new reminder was created');
          }
        } catch (error) {
          console.error('Error creating new reminder:', error);
        }
      } else {
        console.log('Email notification is disabled, not creating a new reminder');
      }
    } else {
      console.log('No changes that require updating the reminder');
    }
    
    return appointment;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
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
    
    // Chỉ hủy các email đang ở trạng thái pending trong queue
    try {
      const pendingEmails = await EmailQueue.findAll({
        where: {
          appointment_id: appointmentId,
          status: 'pending'
        }
      });
      
      console.log(`Found ${pendingEmails.length} pending email reminders for appointment ${appointmentId}`);
      
      // Hủy các email đang pending
      for (const email of pendingEmails) {
        await email.update({ status: 'canceled' });
        console.log(`Canceled email reminder with ID: ${email.id}`);
      }
    } catch (emailError) {
      console.error('Error canceling email reminders:', emailError);
      // Continue with appointment deletion even if canceling emails fails
    }
    
    // Các email đã chuyển sang progress vẫn để nguyên, người dùng vẫn nhận được email reminder
    console.log(`Deleting appointment ${appointmentId} (any transferred emails will still be processed)`);
    
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

// Process reminders for appointments - DEPRECATED (reminders are now created directly when appointment is created/updated)
const processAppointmentReminders = async () => {
  console.log('This function is deprecated. Reminders are now created directly when appointments are created or updated.');
  return 0;
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