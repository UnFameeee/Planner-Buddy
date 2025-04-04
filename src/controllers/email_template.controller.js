const db = require('../database/models');
const Setting = db.Setting;
const emailTemplateService = require('../services/email_template.service');
const { Op } = require('sequelize');

// Get all email templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await Setting.findAll({
      where: {
        key: {
          [Op.like]: 'email_template_%'
        }
      }
    });
    
    // Chuyển đổi định dạng để phù hợp với UI
    const formattedTemplates = templates.map(template => {
      let templateData = {};
      try {
        templateData = JSON.parse(template.value);
      } catch (error) {
        console.error(`Error parsing template JSON for ${template.key}:`, error);
        templateData = { subject: '', content: '' };
      }
      
      return {
        id: template.id,
        name: template.key.replace('email_template_', ''),
        subject: templateData.subject || '',
        content: templateData.content || '',
        is_active: true,
        description: template.description,
        created_at: template.created_at,
        updated_at: template.updated_at
      };
    });
    
    res.status(200).json(formattedTemplates);
  } catch (error) {
    console.error('Error retrieving email templates:', error);
    res.status(500).json({ message: 'Failed to retrieve email templates', error: error.message });
  }
};

// Get template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const template = await Setting.findByPk(req.params.id);
    
    if (!template || !template.key.startsWith('email_template_')) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    
    let templateData = {};
    try {
      templateData = JSON.parse(template.value);
    } catch (error) {
      console.error(`Error parsing template JSON for ${template.key}:`, error);
      templateData = { subject: '', content: '' };
    }
    
    const formattedTemplate = {
      id: template.id,
      name: template.key.replace('email_template_', ''),
      subject: templateData.subject || '',
      content: templateData.content || '',
      is_active: true,
      description: template.description,
      created_at: template.created_at,
      updated_at: template.updated_at
    };
    
    res.status(200).json(formattedTemplate);
  } catch (error) {
    console.error('Error retrieving email template:', error);
    res.status(500).json({ message: 'Failed to retrieve email template', error: error.message });
  }
};

// Get template by name
exports.getTemplateByName = async (req, res) => {
  try {
    const template = await Setting.findOne({
      where: { 
        key: `email_template_${req.params.name}` 
      }
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    
    let templateData = {};
    try {
      templateData = JSON.parse(template.value);
    } catch (error) {
      console.error(`Error parsing template JSON for ${template.key}:`, error);
      templateData = { subject: '', content: '' };
    }
    
    const formattedTemplate = {
      id: template.id,
      name: template.key.replace('email_template_', ''),
      subject: templateData.subject || '',
      content: templateData.content || '',
      is_active: true,
      description: template.description,
      created_at: template.created_at,
      updated_at: template.updated_at
    };
    
    res.status(200).json(formattedTemplate);
  } catch (error) {
    console.error('Error retrieving email template:', error);
    res.status(500).json({ message: 'Failed to retrieve email template', error: error.message });
  }
};

// Create a new email template
exports.createTemplate = async (req, res) => {
  try {
    const { name, subject, content, description } = req.body;
    
    // Kiểm tra name chỉ chứa chữ cái, số và dấu gạch dưới
    if (!name.match(/^[a-zA-Z0-9_]+$/)) {
      return res.status(400).json({ message: 'Template name can only contain letters, numbers, and underscores' });
    }
    
    // Kiểm tra xem template đã tồn tại chưa
    const existingTemplate = await Setting.findOne({
      where: { key: `email_template_${name}` }
    });
    
    if (existingTemplate) {
      return res.status(400).json({ message: 'Template with this name already exists' });
    }
    
    // Chuẩn bị dữ liệu template
    const templateData = {
      subject: subject || '',
      content: content || ''
    };
    
    // Tạo template mới
    const template = await Setting.create({
      key: `email_template_${name}`,
      value: JSON.stringify(templateData),
      description: description || `Email template for ${name}`
    });
    
    const formattedTemplate = {
      id: template.id,
      name,
      subject: templateData.subject,
      content: templateData.content,
      is_active: true,
      description: template.description,
      created_at: template.created_at,
      updated_at: template.updated_at
    };
    
    res.status(201).json(formattedTemplate);
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ message: 'Failed to create email template', error: error.message });
  }
};

// Update an email template
exports.updateTemplate = async (req, res) => {
  try {
    const template = await Setting.findByPk(req.params.id);
    
    if (!template || !template.key.startsWith('email_template_')) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    
    const { subject, content, description } = req.body;
    
    // Chuẩn bị dữ liệu template
    const templateData = {
      subject: subject || '',
      content: content || ''
    };
    
    // Cập nhật template
    await template.update({
      value: JSON.stringify(templateData),
      description: description || template.description
    });
    
    const formattedTemplate = {
      id: template.id,
      name: template.key.replace('email_template_', ''),
      subject: templateData.subject,
      content: templateData.content,
      is_active: true,
      description: template.description,
      created_at: template.created_at,
      updated_at: template.updated_at
    };
    
    res.status(200).json(formattedTemplate);
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ message: 'Failed to update email template', error: error.message });
  }
};

// Delete an email template
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await Setting.findByPk(req.params.id);
    
    if (!template || !template.key.startsWith('email_template_')) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    
    // Kiểm tra xem có phải template mặc định không
    const templateName = template.key.replace('email_template_', '');
    if (['appointment_reminder', 'todo_reminder'].includes(templateName)) {
      return res.status(400).json({ message: 'Cannot delete default templates' });
    }
    
    await template.destroy();
    res.status(200).json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ message: 'Failed to delete email template', error: error.message });
  }
}; 