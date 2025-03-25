const nodemailer = require('nodemailer');
const axios = require('axios');

// Gmail API OAuth2 configuration
const getGmailAccessToken = async () => {
  try {
    // In a real app, you would use the refresh token to get a new access token
    // For now, we'll simulate this process
    return 'simulated_access_token';
  } catch (error) {
    console.error('Error getting Gmail access token:', error);
    throw error;
  }
};

// Create mail transporter
const createTransporter = async () => {
  try {
    // Get Gmail access token
    const accessToken = await getGmailAccessToken();

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER || 'user@example.com',
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken
      }
    });

    return transporter;
  } catch (error) {
    console.error('Error creating mail transporter:', error);
    throw error;
  }
};

// Send todo reminder email
const sendTodoReminder = async (user, todo) => {
  try {
    // Create transporter
    const transporter = await createTransporter();

    // Email content
    const mailOptions = {
      from: process.env.GMAIL_USER || 'planner-buddy@example.com',
      to: user.email,
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
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending todo reminder email:', error);
    throw error;
  }
};

// Send appointment reminder email
const sendAppointmentReminder = async (user, appointment) => {
  try {
    // Create transporter
    const transporter = await createTransporter();

    // Email content
    const mailOptions = {
      from: process.env.GMAIL_USER || 'planner-buddy@example.com',
      to: user.email,
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
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending appointment reminder email:', error);
    throw error;
  }
};

module.exports = {
  sendTodoReminder,
  sendAppointmentReminder
}; 