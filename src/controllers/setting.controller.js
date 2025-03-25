const settingService = require('../services/setting.service');

// Get all settings
const getAllSettings = async (req, res) => {
  try {
    // Get all settings
    const settings = await settingService.getAllSettings();
    
    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get setting by key
const getSettingByKey = async (req, res) => {
  try {
    const key = req.params.key;
    
    // Get setting
    const setting = await settingService.getSettingByKey(key);
    
    return res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Update setting
const updateSetting = async (req, res) => {
  try {
    const key = req.params.key;
    const { value, description } = req.body;
    
    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'Value is required for setting'
      });
    }
    
    // Update setting
    const updatedSetting = await settingService.updateSetting(key, value, description);
    
    return res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      data: updatedSetting
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete setting
const deleteSetting = async (req, res) => {
  try {
    const key = req.params.key;
    
    // Delete setting
    const result = await settingService.deleteSetting(key);
    
    return res.status(200).json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Render settings page (admin only)
const renderSettingsPage = async (req, res) => {
  try {
    // Get all settings
    const settings = await settingService.getAllSettings();
    const themeColor = await settingService.getThemeColor();
    const appName = await settingService.getAppName();
    
    res.render('settings/index', {
      title: `Settings | ${appName}`,
      themeColor,
      settings,
      user: req.user
    });
  } catch (error) {
    res.render('error', {
      message: 'Error loading settings page',
      error
    });
  }
};

module.exports = {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  deleteSetting,
  renderSettingsPage
}; 