const { Setting } = require('../database/models');

// Get all settings
const getAllSettings = async () => {
  try {
    const settings = await Setting.findAll();
    
    // Convert to key-value object for easier access
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = {
        value: setting.value,
        description: setting.description
      };
    });
    
    return settingsObj;
  } catch (error) {
    throw new Error(`Error fetching settings: ${error.message}`);
  }
};

// Get setting by key
const getSettingByKey = async (key) => {
  try {
    const setting = await Setting.findOne({
      where: { key }
    });
    
    if (!setting) {
      throw new Error(`Setting with key '${key}' not found`);
    }
    
    return setting;
  } catch (error) {
    throw new Error(`Error fetching setting: ${error.message}`);
  }
};

// Create or update setting
const updateSetting = async (key, value, description = null) => {
  try {
    // Check if setting exists
    const existingSetting = await Setting.findOne({
      where: { key }
    });
    
    if (existingSetting) {
      // Update existing setting
      await existingSetting.update({ 
        value, 
        description: description || existingSetting.description 
      });
      return existingSetting;
    } else {
      // Create new setting
      const newSetting = await Setting.create({
        key,
        value,
        description
      });
      return newSetting;
    }
  } catch (error) {
    throw new Error(`Error updating setting: ${error.message}`);
  }
};

// Delete setting
const deleteSetting = async (key) => {
  try {
    const setting = await Setting.findOne({
      where: { key }
    });
    
    if (!setting) {
      throw new Error(`Setting with key '${key}' not found`);
    }
    
    // Soft delete the setting
    await setting.destroy();
    
    return { success: true, message: `Setting '${key}' deleted successfully` };
  } catch (error) {
    throw new Error(`Error deleting setting: ${error.message}`);
  }
};

// Get application theme color
const getThemeColor = async () => {
  try {
    const themeColorSetting = await getSettingByKey('theme_color');
    return themeColorSetting.value || '#72d1a8'; // Default theme color
  } catch (error) {
    // Return default theme color if there's an error
    return '#72d1a8';
  }
};

// Get application name
const getAppName = async () => {
  try {
    const appNameSetting = await getSettingByKey('app_name');
    return appNameSetting.value || 'Planner Buddy'; // Default app name
  } catch (error) {
    // Return default app name if there's an error
    return 'Planner Buddy';
  }
};

module.exports = {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  deleteSetting,
  getThemeColor,
  getAppName
}; 