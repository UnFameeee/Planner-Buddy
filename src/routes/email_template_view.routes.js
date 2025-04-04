const express = require('express');
const router = express.Router();
const emailTemplateViewController = require('../controllers/email_template_view.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Render email templates management page
router.get('/', emailTemplateViewController.renderEmailTemplatesPage);

module.exports = router; 