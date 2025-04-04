const db = require('../database/models');
const EmailTemplate = db.EmailTemplate;
const { Op } = require('sequelize');

// Get all email templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.findAll();
    res.status(200).json(templates);
  } catch (error) {
    console.error('Error retrieving email templates:', error);
    res.status(500).json({ message: 'Failed to retrieve email templates', error: error.message });
  }
};

// Get template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const template = await EmailTemplate.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    
    res.status(200).json(template);
  } catch (error) {
    console.error('Error retrieving email template:', error);
    res.status(500).json({ message: 'Failed to retrieve email template', error: error.message });
  }
};

// Get template by name
exports.getTemplateByName = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      where: { name: req.params.name }
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    
    res.status(200).json(template);
  } catch (error) {
    console.error('Error retrieving email template:', error);
    res.status(500).json({ message: 'Failed to retrieve email template', error: error.message });
  }
};

// Create a new email template
exports.createTemplate = async (req, res) => {
  try {
    // Check if template with the same name already exists
    const existingTemplate = await EmailTemplate.findOne({
      where: { name: req.body.name }
    });
    
    if (existingTemplate) {
      return res.status(400).json({ message: 'Template with this name already exists' });
    }
    
    const template = await EmailTemplate.create(req.body);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ message: 'Failed to create email template', error: error.message });
  }
};

// Update an email template
exports.updateTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    
    await template.update(req.body);
    res.status(200).json(template);
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ message: 'Failed to update email template', error: error.message });
  }
};

// Delete an email template
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    
    await template.destroy();
    res.status(200).json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ message: 'Failed to delete email template', error: error.message });
  }
}; 