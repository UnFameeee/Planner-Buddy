const { EmailProgress, EmailQueue, User } = require('../database/models');
const emailUtil = require('../utils/email.util');
const { Op } = require('sequelize');

/**
 * Chuyển email từ queue sang progress
 * @param {Object} emailQueue - Email queue cần chuyển
 * @return {Promise<Object>} - Email progress đã tạo
 */
const transferToProgress = async (emailQueue) => {
  try {
    // Lấy thông tin user
    const user = await User.findByPk(emailQueue.user_id, {
      attributes: ['id', 'email', 'username']
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Tạo email progress mới
    const emailProgress = await EmailProgress.create({
      email_queue_id: emailQueue.id,
      user_id: emailQueue.user_id,
      appointment_id: emailQueue.appointment_id,
      recipient_email: user.email,
      email_subject: emailQueue.email_subject,
      email_content: emailQueue.email_content,
      status: 'processing',
      priority: 1,
      attempts: 0
    });

    // Cập nhật trạng thái của email queue
    await emailQueue.update({
      status: 'transferred'
    });

    return emailProgress;
  } catch (error) {
    console.error('Error transferring email to progress:', error);
    throw error;
  }
};

/**
 * Lấy email tiếp theo cần xử lý
 * @return {Promise<Object>} - Email tiếp theo cần xử lý
 */
const getNextEmailToProcess = async () => {
  try {
    // Lấy email trong progress mà chưa được xử lý
    const emailToProcess = await EmailProgress.findOne({
      where: {
        status: 'processing',
        attempts: {
          [Op.lt]: 3 // Chỉ lấy email đã thử gửi ít hơn 3 lần
        }
      },
      order: [
        ['priority', 'ASC'], // Ưu tiên theo priority (1 là cao nhất)
        ['created_at', 'ASC'] // Sau đó theo thời gian tạo
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'username']
        }
      ]
    });

    return emailToProcess;
  } catch (error) {
    console.error('Error getting next email to process:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái của email trong progress
 * @param {string} id - ID của email trong progress
 * @param {string} status - Trạng thái mới
 * @param {string} errorMessage - Thông báo lỗi (nếu có)
 * @return {Promise<Object>} - Email progress đã cập nhật
 */
const updateProgressStatus = async (id, status, errorMessage = null) => {
  try {
    const emailProgress = await EmailProgress.findByPk(id);
    
    if (!emailProgress) {
      throw new Error('Email progress not found');
    }

    emailProgress.status = status;
    emailProgress.processed_at = new Date();
    
    if (status === 'failed') {
      emailProgress.attempts += 1;
      emailProgress.error_message = errorMessage;
      
      // Nếu đã thử gửi quá 3 lần, đánh dấu là failed
      if (emailProgress.attempts >= 3) {
        emailProgress.status = 'failed';
      }
    }

    await emailProgress.save();
    return emailProgress;
  } catch (error) {
    console.error('Error updating email progress status:', error);
    throw error;
  }
};

/**
 * Gửi email
 * @param {Object} emailProgress - Email progress cần gửi
 * @return {Promise<boolean>} - Kết quả gửi email
 */
const sendEmail = async (emailProgress) => {
  try {
    // Nếu đã thử gửi quá 3 lần, bỏ qua
    if (emailProgress.attempts >= 3) {
      await updateProgressStatus(emailProgress.id, 'failed', 'Max attempts reached');
      return false;
    }

    // Gửi email
    await emailUtil.sendMail({
      to: emailProgress.recipient_email,
      subject: emailProgress.email_subject,
      html: emailProgress.email_content
    });

    // Cập nhật trạng thái
    await updateProgressStatus(emailProgress.id, 'sent');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Cập nhật trạng thái
    await updateProgressStatus(emailProgress.id, 'failed', error.message);
    return false;
  }
};

/**
 * Lấy danh sách email đã gửi của một appointment
 * @param {string} appointmentId - ID của appointment
 * @return {Promise<Array>} - Danh sách email đã gửi
 */
const getSentEmailsByAppointment = async (appointmentId) => {
  try {
    const sentEmails = await EmailProgress.findAll({
      where: {
        appointment_id: appointmentId,
        status: 'sent'
      },
      order: [['processed_at', 'DESC']]
    });

    return sentEmails;
  } catch (error) {
    console.error('Error getting sent emails by appointment:', error);
    throw error;
  }
};

module.exports = {
  transferToProgress,
  getNextEmailToProcess,
  updateProgressStatus,
  sendEmail,
  getSentEmailsByAppointment
}; 