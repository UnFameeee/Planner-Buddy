const { EmailQueue, User, Appointment } = require('../database/models');
const { Op } = require('sequelize');
const { DateTime } = require('luxon');

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

    // Kiểm tra xem appointment có tồn tại không
    const appointment = await Appointment.findByPk(appointment_id);
    if (!appointment) {
      console.error(`Appointment not found with id: ${appointment_id}`);
      throw new Error('Appointment not found');
    }

    // Tạo email queue mới
    console.log(`Creating email queue entry for appointment: ${appointment.title}, scheduled for: ${scheduled_time}`);
    const emailQueue = await EmailQueue.create({
      user_id,
      appointment_id,
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
          attributes: ['id', 'title', 'start_time']
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

      console.log(`Email ID: ${email.id}, Scheduled time in ${userTimezone}: ${scheduledTimeInUserTimezone.toISO()}, Now: ${nowInUserTimezone.toISO()}`);

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

    // Tạo subject và content cho email
    const emailSubject = `Reminder: ${appointment.title}`;
    const emailContent = `
      <h2>Appointment Reminder</h2>
      <p>This is a reminder for your upcoming appointment:</p>
      <p><strong>Title:</strong> ${appointment.title}</p>
      <p><strong>Time:</strong> ${new Date(appointment.start_time).toLocaleString()}</p>
      <p><strong>Location:</strong> ${appointment.location || 'Not specified'}</p>
      <p><strong>Description:</strong> ${appointment.description || 'Not provided'}</p>
    `;

    // Thêm vào queue
    console.log('Adding reminder to email queue...');
    const emailQueue = await addToQueue({
      user_id: user.id,
      appointment_id: appointment.id,
      scheduled_time: scheduledTime,
      email_type: 'reminder',
      email_subject: emailSubject,
      email_content: emailContent,
      timezone: user.timezone
    });

    console.log(`Reminder added to queue successfully with ID: ${emailQueue.id}`);
    return emailQueue;
  } catch (error) {
    console.error('Error creating appointment reminder:', error);
    throw error;
  }
};

module.exports = {
  addToQueue,
  getEmailsToTransfer,
  updateQueueStatus,
  removeFromQueue,
  createAppointmentReminder
}; 