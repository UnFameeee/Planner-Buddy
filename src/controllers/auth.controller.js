const { User } = require('../database/models');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth.util');
const settingService = require('../services/setting.service');
const { Op } = require('sequelize');

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Kiểm tra người dùng đã tồn tại chưa
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    // Hash mật khẩu và tạo người dùng mới
    const hashedPassword = await hashPassword(password);
    
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      is_active: true
    });
    
    // Tạo token
    const token = generateToken(newUser);
    
    // Trả về thông tin đăng ký thành công
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    console.log('[Auth Controller] Login attempt:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('[Auth Controller] Login failed: Missing username or password');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Tìm người dùng theo username
    const user = await User.findOne({
      where: { username }
    });
    
    if (!user) {
      console.log(`[Auth Controller] Login failed: User "${username}" not found`);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    // Kiểm tra mật khẩu
    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      console.log(`[Auth Controller] Login failed: Invalid password for user "${username}"`);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    // Kiểm tra tài khoản có hoạt động không
    if (!user.is_active) {
      console.log(`[Auth Controller] Login failed: User "${username}" is inactive`);
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive'
      });
    }
    
    // Tạo token
    const token = generateToken(user);
    console.log(`[Auth Controller] Login successful: Generated token for "${username}"`);
    
    // Trả về token và thông tin người dùng
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          timezone: user.timezone
        }
      }
    });
  } catch (error) {
    console.error('[Auth Controller] Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    // Người dùng đã được xác thực qua middleware
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'timezone', 'created_at', 'updated_at']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { email, timezone, password } = req.body;
    const userId = req.user.id;
    
    // Tìm người dùng để cập nhật
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Cập nhật các trường đã gửi
    if (email) user.email = email;
    if (timezone) user.timezone = timezone;
    
    // Nếu mật khẩu được gửi lên, hash và cập nhật
    if (password) {
      user.password = await hashPassword(password);
    }
    
    // Lưu thay đổi
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          timezone: user.timezone
        }
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Render login page
const renderLogin = async (req, res) => {
  try {
    // Nếu đã đăng nhập từ server, chuyển hướng đến trang chính
    if (req.user) {
      return res.redirect('/');
    }
    
    let themeColor = '#72d1a8';
    try {
      themeColor = await settingService.getThemeColor();
    } catch (error) {
      console.error('Error getting theme color:', error);
    }
    
    res.render('auth/login', {
      title: 'Login | Planner Buddy',
      themeColor
    });
  } catch (error) {
    console.error('Error rendering login page:', error);
    res.status(500).send('Server Error');
  }
};

// Render register page
const renderRegister = async (req, res) => {
  try {
    // Nếu đã đăng nhập từ server, chuyển hướng đến trang chính
    if (req.user) {
      return res.redirect('/');
    }
    
    let themeColor = '#72d1a8';
    try {
      themeColor = await settingService.getThemeColor();
    } catch (error) {
      console.error('Error getting theme color:', error);
    }
    
    res.render('auth/register', {
      title: 'Register | Planner Buddy',
      themeColor
    });
  } catch (error) {
    console.error('Error rendering register page:', error);
    res.status(500).send('Server Error');
  }
};

// Create test user if none exists
const createTestUser = async (req, res) => {
  try {
    // Kiểm tra xem đã có user test chưa
    const existingUser = await User.findOne({
      where: { username: 'testuser' }
    });
    
    if (existingUser) {
      console.log('[Auth Controller] Test user already exists');
      return res.status(200).json({
        success: true,
        message: 'Test user already exists',
        username: 'testuser',
        password: 'password123'
      });
    }
    
    // Tạo user test mới
    const hashedPassword = await hashPassword('password123');
    const newUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      is_active: true
    });
    
    console.log('[Auth Controller] Test user created successfully');
    return res.status(201).json({
      success: true,
      message: 'Test user created successfully',
      username: 'testuser',
      password: 'password123'
    });
  } catch (error) {
    console.error('[Auth Controller] Error creating test user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating test user',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  renderLogin,
  renderRegister,
  createTestUser
}; 