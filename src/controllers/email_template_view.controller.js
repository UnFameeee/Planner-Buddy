const settingService = require('../services/setting.service');

// Render email templates management page
exports.renderEmailTemplatesPage = async (req, res) => {
  try {
    // Get theme color from settings
    let themeColor = '#72d1a8';
    try {
      themeColor = await settingService.getThemeColor();
    } catch (error) {
      console.error('Error getting theme color:', error);
    }
    
    res.render('email_templates/index', {
      title: 'Email Templates Management',
      user: req.user,
      themeColor
    });
  } catch (error) {
    console.error('Error rendering email templates page:', error);
    res.status(500).send('Server Error');
  }
}; 