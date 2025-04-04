const nodemailer = require('nodemailer');
const axios = require('axios');

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
    
    // Email content
    const mailOptions = {
      to: user.email,
      from: fromAddress,
      subject: `Reminder: ${todo.title}`,
      html: `
        <h2>Todo Reminder</h2>
        <p>Hello ${user.username},</p>
        <p>This is a reminder for your todo: <strong>${todo.title}</strong></p>
        <p><strong>Due Date:</strong> ${new Date(todo.due_date).toLocaleString()}</p>
        <p><strong>Description:</strong> ${todo.description || 'No description'}</p>
        <p><strong>Priority:</strong> ${todo.priority}</p>
        <hr>
        <p>Log in to Planner Buddy to view more details or mark this todo as completed.</p>
      `
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
    
    // Email content
    const mailOptions = {
      to: user.email,
      from: fromAddress,
      subject: `Reminder: ${appointment.title}`,
      html: `
        <h2>Appointment Reminder</h2>
        <p>Hello ${user.username},</p>
        <p>This is a reminder for your appointment: <strong>${appointment.title}</strong></p>
        <p><strong>Start Time:</strong> ${new Date(appointment.start_time).toLocaleString()}</p>
        <p><strong>End Time:</strong> ${new Date(appointment.end_time).toLocaleString()}</p>
        <p><strong>Location:</strong> ${appointment.location || 'No location specified'}</p>
        <p><strong>Description:</strong> ${appointment.description || 'No description'}</p>
        <hr>
        <p>Log in to Planner Buddy to view more details.</p>
      `
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