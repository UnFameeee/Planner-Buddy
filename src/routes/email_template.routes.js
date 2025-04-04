const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/email_template.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all email templates
router.get('/', emailTemplateController.getAllTemplates);

// Get template by ID
router.get('/id/:id', emailTemplateController.getTemplateById);

// Get template by name
router.get('/name/:name', emailTemplateController.getTemplateByName);

// Create a new email template
router.post('/', emailTemplateController.createTemplate);

// Update an email template
router.put('/:id', emailTemplateController.updateTemplate);

// Delete an email template
router.delete('/:id', emailTemplateController.deleteTemplate);

module.exports = router; 