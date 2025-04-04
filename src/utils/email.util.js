const nodemailer = require('nodemailer');
const axios = require('axios');
const emailTemplateService = require('../services/email_template.service');

// Create mail transporter
const createTransporter = async () => {
  try {
    console.log('Creating email transporter with SMTP settings');
    
    // Lấy thông tin từ env
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    console.log(`SMTP Server: ${smtpHost}:${smtpPort}`);
    console.log(`SMTP User: ${smtpUser}`);
    
    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP user or password is missing');
    }
    
    // Tạo transporter với xác thực cơ bản
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    
    // Verify connection
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    return transporter;
  } catch (error) {
    console.error('Error creating mail transporter:', error);
    throw error;
  }
};

// Send a generic email
const sendMail = async (options) => {
  try {
    console.log(`Sending email to: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    
    // Create transporter
    const transporter = await createTransporter();

    // Set from address if not provided
    if (!options.from) {
      const fromEmail = process.env.SMTP_USER || 'planner-buddy@example.com';
      options.from = `"Planner Buddy" <${fromEmail}>`;
    }

    // Send email
    const info = await transporter.sendMail(options);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send todo reminder email
const sendTodoReminder = async (user, todo) => {
  try {
    // Get email address with display name
    const fromEmail = process.env.SMTP_USER || 'planner-buddy@example.com';
    const fromAddress = `"Planner Buddy" <${fromEmail}>`;
    
    // Lấy template email từ service
    const emailTemplate = await emailTemplateService.renderTodoReminderTemplate(todo, user);
    
    // Email content
    const mailOptions = {
      to: user.email,
      from: fromAddress,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };

    // Send email
    return await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending todo reminder email:', error);
    throw error;
  }
};

// Send appointment reminder email
const sendAppointmentReminder = async (user, appointment) => {
  try {
    // Get email address with display name
    const fromEmail = process.env.SMTP_USER || 'planner-buddy@example.com';
    const fromAddress = `"Planner Buddy" <${fromEmail}>`;
    
    // Lấy template email từ service
    const emailTemplate = await emailTemplateService.renderAppointmentReminderTemplate(appointment, user);
    
    // Email content
    const mailOptions = {
      to: user.email,
      from: fromAddress,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };

    // Send email
    return await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending appointment reminder email:', error);
    throw error;
  }
};

module.exports = {
  sendMail,
  sendTodoReminder,
  sendAppointmentReminder
}; 