const { EmailQueue, User, Appointment, Todo } = require('../database/models');
const { Op } = require('sequelize');
const { DateTime } = require('luxon');
const emailTemplateService = require('./email_template.service');

/**
 * Thêm email vào hàng đợi
 * @param {Object} emailData - Dữ liệu email cần thêm vào hàng đợi
 * @return {Promise<Object>} - Email queue đã tạo
 */
const addToQueue = async (emailData) => {
  try {
    console.log('Attempting to add email to queue:', JSON.stringify(emailData, null, 2));
    
    const {
      user_id,
      appointment_id,
      todo_id,
      scheduled_time,
      email_type,
      email_subject,
      email_content,
      timezone
    } = emailData;

    // Kiểm tra xem user có tồn tại không
    const user = await User.findByPk(user_id);
    if (!user) {
      console.error(`User not found with id: ${user_id}`);
      throw new Error('User not found');
    }

    // Kiểm tra xem appointment hoặc todo có tồn tại không
    if (appointment_id) {
      const appointment = await Appointment.findByPk(appointment_id);
      if (!appointment) {
        console.error(`Appointment not found with id: ${appointment_id}`);
        throw new Error('Appointment not found');
      }
      console.log(`Creating email queue entry for appointment: ${appointment.title}, scheduled for: ${scheduled_time}`);
    } else if (todo_id) {
      const todo = await Todo.findByPk(todo_id);
      if (!todo) {
        console.error(`Todo not found with id: ${todo_id}`);
        throw new Error('Todo not found');
      }
      console.log(`Creating email queue entry for todo: ${todo.title}, scheduled for: ${scheduled_time}`);
    } else {
      throw new Error('Either appointment_id or todo_id must be provided');
    }

    // Tạo email queue mới
    const emailQueue = await EmailQueue.create({
      user_id,
      appointment_id,
      todo_id,
      scheduled_time,
      email_type: email_type || 'reminder',
      email_subject,
      email_content,
      status: 'pending',
      timezone: timezone || user.timezone || 'UTC'
    });

    console.log(`Email added to queue successfully with id: ${emailQueue.id}`);
    return emailQueue;
  } catch (error) {
    console.error('Error adding email to queue:', error);
    throw error;
  }
};

/**
 * Lấy danh sách email cần chuyển từ queue sang progress
 * @return {Promise<Array>} - Danh sách email cần chuyển
 */
const getEmailsToTransfer = async () => {
  try {
    const now = new Date();
    console.log(`Checking emails to transfer at: ${now.toISOString()}`);

    // Lấy danh sách email trong queue mà đã đến thời gian gửi
    const emailsToTransfer = await EmailQueue.findAll({
      where: {
        status: 'pending',
        scheduled_time: {
          [Op.lte]: now
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'timezone']
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'title', 'start_time'],
          required: false
        },
        {
          model: Todo,
          as: 'todo',
          attributes: ['id', 'title', 'due_date'],
          required: false
        }
      ]
    });

    console.log(`Found ${emailsToTransfer.length} potential emails to transfer`);

    // Lọc dựa trên múi giờ của người dùng
    const filteredEmails = emailsToTransfer.filter(email => {
      const userTimezone = email.timezone || email.user?.timezone || 'UTC';
      const scheduledTimeInUserTimezone = DateTime.fromJSDate(email.scheduled_time)
        .setZone(userTimezone);
      const nowInUserTimezone = DateTime.now().setZone(userTimezone);

      console.log(`Email ID: ${email.id}, Type: ${email.email_type}, Scheduled time in ${userTimezone}: ${scheduledTimeInUserTimezone.toISO()}, Now: ${nowInUserTimezone.toISO()}`);

      // Chỉ trả về email nếu thời gian đã tới theo múi giờ của người dùng
      return scheduledTimeInUserTimezone <= nowInUserTimezone;
    });

    console.log(`${filteredEmails.length} emails are ready to be transferred to progress`);
    
    if (filteredEmails.length > 0) {
      console.log(`Email IDs to transfer: ${filteredEmails.map(e => e.id).join(', ')}`);
    }

    return filteredEmails;
  } catch (error) {
    console.error('Error getting emails to transfer:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái của email trong queue
 * @param {string} id - ID của email trong queue
 * @param {string} status - Trạng thái mới
 * @return {Promise<Object>} - Email queue đã cập nhật
 */
const updateQueueStatus = async (id, status) => {
  try {
    const emailQueue = await EmailQueue.findByPk(id);
    if (!emailQueue) {
      throw new Error('Email queue not found');
    }

    emailQueue.status = status;
    await emailQueue.save();

    return emailQueue;
  } catch (error) {
    console.error('Error updating email queue status:', error);
    throw error;
  }
};

/**
 * Xoá email khỏi queue
 * @param {string} id - ID của email trong queue
 * @return {Promise<boolean>} - Kết quả xoá
 */
const removeFromQueue = async (id) => {
  try {
    const result = await EmailQueue.destroy({
      where: {
        id
      }
    });

    return result > 0;
  } catch (error) {
    console.error('Error removing email from queue:', error);
    throw error;
  }
};

/**
 * Tạo email reminder cho appointment và thêm vào queue
 * @param {Object} appointment - Appointment cần tạo reminder
 * @param {Object} user - User của appointment
 * @return {Promise<Object>} - Email queue đã tạo
 */
const createAppointmentReminder = async (appointment, user) => {
  try {
    console.log(`Creating appointment reminder for appointment ID: ${appointment.id}, Title: ${appointment.title}`);
    
    // Lấy cài đặt reminder từ appointment
    const reminderSettings = appointment.reminder_settings || {
      enabled: true,
      minutes_before: 30,
      email_notification: true
    };
    
    console.log('Reminder settings:', JSON.stringify(reminderSettings, null, 2));

    // Nếu không bật email notification thì không tạo reminder
    if (!reminderSettings.enabled || !reminderSettings.email_notification) {
      console.log('Email notification is disabled for this appointment, skipping reminder creation');
      return null;
    }

    // Tính thời gian gửi reminder
    const minutesBefore = reminderSettings.minutes_before || 30;
    const startTime = new Date(appointment.start_time);
    const scheduledTime = new Date(startTime.getTime() - minutesBefore * 60 * 1000);
    const now = new Date();
    
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Appointment start time: ${startTime.toISOString()}`);
    console.log(`Calculated reminder time (${minutesBefore} mins before): ${scheduledTime.toISOString()}`);

    // Kiểm tra xem đã có reminder cho appointment này chưa
    const existingReminders = await EmailQueue.findAll({
      where: {
        appointment_id: appointment.id,
        status: 'pending'
      }
    });
    
    if (existingReminders.length > 0) {
      console.log(`Found ${existingReminders.length} existing pending reminders for this appointment. Cancelling them before creating new one.`);
      // Hủy các reminder cũ
      for (const reminder of existingReminders) {
        await reminder.update({ status: 'canceled' });
        console.log(`Canceled existing reminder with ID: ${reminder.id}`);
      }
    }

    // Lấy template email từ service
    const emailTemplate = await emailTemplateService.renderAppointmentReminderTemplate(appointment, user);

    // Thêm vào queue
    console.log('Adding reminder to email queue...');
    const emailQueue = await addToQueue({
      user_id: user.id,
      appointment_id: appointment.id,
      scheduled_time: scheduledTime,
      email_type: 'reminder',
      email_subject: emailTemplate.subject,
      email_content: emailTemplate.html,
      timezone: user.timezone
    });

    console.log(`Reminder added to queue successfully with ID: ${emailQueue.id}`);
    return emailQueue;
  } catch (error) {
    console.error('Error creating appointment reminder:', error);
    throw error;
  }
};

/**
 * Tạo email reminder cho todo và thêm vào queue
 * @param {Object} todo - Todo cần tạo reminder
 * @param {Object} user - User của todo
 * @return {Promise<Object>} - Email queue đã tạo
 */
const createTodoReminder = async (todo, user) => {
  try {
    console.log(`Creating todo reminder for todo ID: ${todo.id}, Title: ${todo.title}`);
    
    // Nếu không có reminder_time thì không tạo reminder
    if (!todo.reminder_time) {
      console.log('No reminder time set for this todo, skipping reminder creation');
      return null;
    }

    // Kiểm tra xem đã có reminder cho todo này chưa
    const existingReminders = await EmailQueue.findAll({
      where: {
        todo_id: todo.id,
        status: 'pending'
      }
    });
    
    if (existingReminders.length > 0) {
      console.log(`Found ${existingReminders.length} existing pending reminders for this todo. Cancelling them before creating new one.`);
      // Hủy các reminder cũ
      for (const reminder of existingReminders) {
        await reminder.update({ status: 'canceled' });
        console.log(`Canceled existing reminder with ID: ${reminder.id}`);
      }
    }

    // Lấy template email từ service
    const emailTemplate = await emailTemplateService.renderTodoReminderTemplate(todo, user);

    // Thêm vào queue
    console.log('Adding todo reminder to email queue...');
    const emailQueue = await addToQueue({
      user_id: user.id,
      todo_id: todo.id,
      scheduled_time: todo.reminder_time,
      email_type: 'todo_reminder',
      email_subject: emailTemplate.subject,
      email_content: emailTemplate.html,
      timezone: user.timezone
    });

    console.log(`Todo reminder added to queue successfully with ID: ${emailQueue.id}`);
    return emailQueue;
  } catch (error) {
    console.error('Error creating todo reminder:', error);
    throw error;
  }
};

module.exports = {
  addToQueue,
  getEmailsToTransfer,
  updateQueueStatus,
  removeFromQueue,
  createAppointmentReminder,
  createTodoReminder
}; 