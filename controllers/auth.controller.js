const userService = require('../services/user.service');
const settingService = require('../services/setting.service');

// Register new user
const register = async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.username || !userData.email || !userData.password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Register user
    const newUser = await userService.registerUser(userData);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: newUser
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Login user
    const { user, token } = await userService.loginUser(email, password);

    // Get theme color for UI customization
    const themeColor = await settingService.getThemeColor();

    return res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: {
        user,
        token,
        themeColor
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userData = req.body;
    
    // Update user profile
    const updatedUser = await userService.updateUserProfile(userId, userData);
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Render login page
const renderLogin = async (req, res) => {
  try {
    // Default theme color
    let themeColor = '#72d1a8';
    let appName = 'Planner Buddy';
    
    // Try to get theme color and app name from settings
    try {
      themeColor = await settingService.getThemeColor();
      appName = await settingService.getAppName();
    } catch (error) {
      console.error('Error getting settings:', error);
      // Use defaults if error occurs
    }
    
    res.render('auth/login', {
      title: `Login | ${appName}`,
      themeColor,
      user: undefined
    });
  } catch (error) {
    console.error('Error rendering login page:', error);
    res.render('error', {
      message: 'Error loading login page',
      error,
      themeColor: '#72d1a8', // Default theme color
      title: 'Error',
      user: undefined
    });
  }
};

// Render register page
const renderRegister = async (req, res) => {
  try {
    // Default theme color
    let themeColor = '#72d1a8';
    let appName = 'Planner Buddy';
    
    // Try to get theme color and app name from settings
    try {
      themeColor = await settingService.getThemeColor();
      appName = await settingService.getAppName();
    } catch (error) {
      console.error('Error getting settings:', error);
      // Use defaults if error occurs
    }
    
    res.render('auth/register', {
      title: `Register | ${appName}`,
      themeColor,
      user: undefined
    });
  } catch (error) {
    console.error('Error rendering register page:', error);
    res.render('error', {
      message: 'Error loading register page',
      error,
      themeColor: '#72d1a8', // Default theme color
      title: 'Error',
      user: undefined
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  renderLogin,
  renderRegister
}; 