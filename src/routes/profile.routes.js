const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const userService = require('../services/user.service');
const settingService = require('../services/setting.service');
const { comparePassword } = require('../utils/auth.util');

// Profile page
router.get('/', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect('/auth/login');
    }

    // Get theme color from settings
    let themeColor = '#72d1a8';
    try {
      themeColor = await settingService.getThemeColor();
    } catch (error) {
      console.error('Error getting theme color:', error);
    }

    res.render('profile/index', {
      title: 'User Profile',
      user: req.user,
      themeColor
    });
  } catch (error) {
    console.error('Error rendering profile page:', error);
    res.status(500).send('Server Error');
  }
});

// Update profile
router.post('/update', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { username, email, timezone } = req.body;
    
    // Validate input
    if (!username || !email) {
      return res.status(400).json({ success: false, message: 'Username and email are required' });
    }

    const updatedUser = await userService.updateUserProfile(req.user.id, {
      username,
      email,
      timezone: timezone || 'UTC'
    });

    return res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }

    // Get user with password
    const user = await userService.getUserById(req.user.id);
    
    // Check current password
    const isMatch = comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password
    await userService.updateUserProfile(req.user.id, {
      password: newPassword
    });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 