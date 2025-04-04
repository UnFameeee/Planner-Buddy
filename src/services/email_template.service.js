const { Setting } = require('../database/models');

/**
 * Lấy template email theo tên
 * @param {string} name - Tên template cần lấy (key trong settings)
 * @return {Promise<Object>} - Template email
 */
const getTemplateByName = async (name) => {
  try {
    const template = await Setting.findOne({
      where: {
        key: `email_template_${name}`
      }
    });
    
    if (!template) {
      throw new Error(`Template không tồn tại: ${name}`);
    }
    
    // Parse JSON từ value
    try {
      return JSON.parse(template.value);
    } catch (parseError) {
      console.error(`Error parsing template JSON for ${name}:`, parseError);
      throw new Error(`Template format invalid: ${name}`);
    }
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
  if (!content) return '';
  
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

/**
 * Lưu template vào database
 * @param {string} name - Tên template
 * @param {Object} template - Dữ liệu template (có subject và content)
 * @return {Promise<Object>} - Template đã lưu
 */
const saveTemplate = async (name, template) => {
  try {
    // Chuẩn bị key cho settings
    const key = `email_template_${name}`;
    
    // Tìm setting hiện tại
    let setting = await Setting.findOne({
      where: { key }
    });
    
    // Chuyển template thành JSON string
    const templateValue = JSON.stringify(template);
    
    if (setting) {
      // Cập nhật setting hiện có
      setting.value = templateValue;
      await setting.save();
    } else {
      // Tạo setting mới
      setting = await Setting.create({
        key,
        value: templateValue,
        description: `Email template for ${name}`
      });
    }
    
    return template;
  } catch (error) {
    console.error(`Error saving email template ${name}:`, error);
    throw error;
  }
};

/**
 * Tạo mẫu mặc định cho todo reminder
 * @return {Promise<Object>} - Template đã tạo
 */
const createDefaultTodoTemplate = async () => {
  const template = {
    subject: 'Todo Reminder: {{todo_title}}',
    content: `
      <h2>Todo Reminder</h2>
      <p>Hello {{recipient_name}},</p>
      <p>This is a reminder for your todo: <strong>{{todo_title}}</strong></p>
      <p><strong>Due Date:</strong> {{todo_due_date}}</p>
      <p><strong>Description:</strong> {{todo_description}}</p>
      <p><strong>Priority:</strong> {{todo_priority}}</p>
      <hr>
      <p>Log in to Planner Buddy to view more details or mark this todo as completed.</p>
    `
  };
  
  return await saveTemplate('todo_reminder', template);
};

/**
 * Tạo mẫu mặc định cho appointment reminder
 * @return {Promise<Object>} - Template đã tạo
 */
const createDefaultAppointmentTemplate = async () => {
  const template = {
    subject: 'Appointment Reminder: {{appointment_title}}',
    content: `
      <h2>Appointment Reminder</h2>
      <p>Hello {{recipient_name}},</p>
      <p>This is a reminder for your appointment: <strong>{{appointment_title}}</strong></p>
      <p><strong>Start Time:</strong> {{appointment_time}}</p>
      <p><strong>End Time:</strong> {{appointment_end_time}}</p>
      <p><strong>Location:</strong> {{appointment_location}}</p>
      <p><strong>Description:</strong> {{appointment_description}}</p>
      <hr>
      <p>Log in to Planner Buddy to view more details.</p>
    `
  };
  
  return await saveTemplate('appointment_reminder', template);
};

/**
 * Đảm bảo các template mặc định đã được tạo
 * @return {Promise<void>}
 */
const ensureDefaultTemplates = async () => {
  try {
    // Kiểm tra và tạo template todo reminder
    try {
      await getTemplateByName('todo_reminder');
      console.log('Todo reminder template already exists');
    } catch (error) {
      console.log('Creating default todo reminder template');
      await createDefaultTodoTemplate();
    }
    
    // Kiểm tra và tạo template appointment reminder
    try {
      await getTemplateByName('appointment_reminder');
      console.log('Appointment reminder template already exists');
    } catch (error) {
      console.log('Creating default appointment reminder template');
      await createDefaultAppointmentTemplate();
    }
  } catch (error) {
    console.error('Error ensuring default templates:', error);
  }
};

module.exports = {
  getTemplateByName,
  replaceMergeTags,
  renderAppointmentReminderTemplate,
  renderTodoReminderTemplate,
  saveTemplate,
  createDefaultTodoTemplate,
  createDefaultAppointmentTemplate,
  ensureDefaultTemplates
}; 