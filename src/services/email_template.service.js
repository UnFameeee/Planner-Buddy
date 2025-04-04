const { EmailTemplate } = require('../database/models');

/**
 * Lấy template email theo tên
 * @param {string} name - Tên template cần lấy
 * @return {Promise<Object>} - Template email
 */
const getTemplateByName = async (name) => {
  try {
    const template = await EmailTemplate.findOne({
      where: {
        name,
        is_active: true
      }
    });
    
    if (!template) {
      throw new Error(`Template không tồn tại hoặc không active: ${name}`);
    }
    
    return template;
  } catch (error) {
    console.error(`Error getting email template ${name}:`, error);
    throw error;
  }
};

/**
 * Thay thế merge tags trong template
 * @param {string} content - Nội dung template với merge tags
 * @param {Object} data - Dữ liệu để thay thế
 * @return {string} - Nội dung đã thay thế merge tags
 */
const replaceMergeTags = (content, data) => {
  let result = content;
  
  // Thay thế tất cả merge tags
  Object.keys(data).forEach(key => {
    const value = data[key] || '';
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
};

/**
 * Render template email appointment với dữ liệu thực tế
 * @param {Object} appointment - Dữ liệu appointment
 * @param {Object} user - Dữ liệu người dùng
 * @return {Promise<Object>} - Template email đã render
 */
const renderAppointmentReminderTemplate = async (appointment, user) => {
  try {
    // Lấy template appointment reminder
    const template = await getTemplateByName('appointment_reminder');
    
    // Chuẩn bị dữ liệu để thay thế
    const data = {
      recipient_name: user.username || user.email.split('@')[0],
      appointment_title: appointment.title,
      appointment_time: new Date(appointment.start_time).toLocaleString(),
      appointment_end_time: appointment.end_time ? new Date(appointment.end_time).toLocaleString() : 'Not specified',
      appointment_location: appointment.location || 'Not specified',
      appointment_description: appointment.description || 'No description provided',
      company_address: process.env.COMPANY_ADDRESS || '',
      unsubscribe_link: '#',
      privacy_policy_link: '#',
      app_url: process.env.APP_URL || '#'
    };
    
    // Thay thế merge tags trong subject
    const subject = replaceMergeTags(template.subject, data);
    
    // Thay thế merge tags trong content
    const content = replaceMergeTags(template.content, data);
    
    return {
      subject,
      html: content
    };
  } catch (error) {
    console.error('Error rendering appointment reminder template:', error);
    // Fallback to basic template if error occurs
    return {
      subject: `Reminder: ${appointment.title}`,
      html: `
        <h2>Appointment Reminder</h2>
        <p>Hello ${user.username},</p>
        <p>This is a reminder for your appointment: <strong>${appointment.title}</strong></p>
        <p><strong>Start Time:</strong> ${new Date(appointment.start_time).toLocaleString()}</p>
        <p><strong>End Time:</strong> ${appointment.end_time ? new Date(appointment.end_time).toLocaleString() : 'Not specified'}</p>
        <p><strong>Location:</strong> ${appointment.location || 'Not specified'}</p>
        <p><strong>Description:</strong> ${appointment.description || 'No description'}</p>
        <hr>
        <p>Log in to Planner Buddy to view more details.</p>
      `
    };
  }
};

/**
 * Render template email todo với dữ liệu thực tế
 * @param {Object} todo - Dữ liệu todo
 * @param {Object} user - Dữ liệu người dùng
 * @return {Promise<Object>} - Template email đã render
 */
const renderTodoReminderTemplate = async (todo, user) => {
  try {
    // Lấy template todo reminder
    const template = await getTemplateByName('todo_reminder');
    
    // Chuẩn bị dữ liệu để thay thế
    const data = {
      recipient_name: user.username || user.email.split('@')[0],
      todo_title: todo.title,
      todo_due_date: todo.due_date ? new Date(todo.due_date).toLocaleString() : 'Not specified',
      todo_priority: todo.priority || 'Normal',
      todo_description: todo.description || 'No description provided',
      company_address: process.env.COMPANY_ADDRESS || '',
      unsubscribe_link: '#',
      privacy_policy_link: '#',
      app_url: process.env.APP_URL || '#'
    };
    
    // Thay thế merge tags trong subject
    const subject = replaceMergeTags(template.subject, data);
    
    // Thay thế merge tags trong content
    const content = replaceMergeTags(template.content, data);
    
    return {
      subject,
      html: content
    };
  } catch (error) {
    console.error('Error rendering todo reminder template:', error);
    // Fallback to basic template if error occurs
    return {
      subject: `Todo Reminder: ${todo.title}`,
      html: `
        <h2>Todo Reminder</h2>
        <p>Hello ${user.username},</p>
        <p>This is a reminder for your todo: <strong>${todo.title}</strong></p>
        <p><strong>Due Date:</strong> ${todo.due_date ? new Date(todo.due_date).toLocaleString() : 'Not specified'}</p>
        <p><strong>Description:</strong> ${todo.description || 'No description'}</p>
        <p><strong>Priority:</strong> ${todo.priority || 'Normal'}</p>
        <hr>
        <p>Log in to Planner Buddy to view more details or mark this todo as completed.</p>
      `
    };
  }
};

module.exports = {
  getTemplateByName,
  replaceMergeTags,
  renderAppointmentReminderTemplate,
  renderTodoReminderTemplate
}; 