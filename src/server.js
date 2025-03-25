require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const settingService = require('./services/setting.service');
const { verifyToken } = require('./utils/auth.util');
const { User } = require('./database/models');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../assets')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Custom middleware to extract JWT from authorization header and set user in req
app.use(async (req, res, next) => {
  try {
    // Get token from Authorization header
    let token = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log(`[Auth Middleware] Token found in header for ${req.path}:`, token.substring(0, 20) + '...');
    } else {
      console.log(`[Auth Middleware] No token in header for ${req.path}`);
      // Không có token, move on nhưng đảm bảo req.user là null
      req.user = null;
      return next();
    }

    if (!token || token === 'null' || token === 'undefined') {
      console.log(`[Auth Middleware] Invalid token value: ${token}`);
      req.user = null;
      return next();
    }

    // Decode và verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log(`[Auth Middleware] Token verification failed`);
      req.user = null;
      return next();
    }
    
    console.log(`[Auth Middleware] Token verified for user ID: ${decoded.id}`);
    
    // Find user in database
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      console.log(`[Auth Middleware] User not found in database: ${decoded.id}`);
      req.user = null;
      return next();
    }
    
    if (!user.is_active) {
      console.log(`[Auth Middleware] User account is inactive: ${user.username}`);
      req.user = null;
      return next();
    }
    
    // User found and active - set user info in request
    console.log(`[Auth Middleware] Authentication successful for: ${user.username}`);
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_active: user.is_active,
      timezone: user.timezone
    };

    // Đảm bảo token được gắn vào response headers
    res.setHeader('Authorization', `Bearer ${token}`);
    
    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error.message);
    req.user = null;
    next();
  }
});

// Routes
const authRoutes = require('./routes/auth.routes');
const todoRoutes = require('./routes/todo.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const settingRoutes = require('./routes/setting.routes');

// Use routes
app.use('/auth', authRoutes);
app.use('/todos', todoRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/settings', settingRoutes);

// Home route
app.get('/', async (req, res) => {
  try {
    // Lấy theme color từ settings
    let themeColor = '#72d1a8';
    try {
      themeColor = await settingService.getThemeColor();
    } catch (error) {
      console.error('Error getting theme color:', error);
    }
    
    // Kiểm tra xác thực từ middleware
    if (req.user) {
      console.log('[Home Route] User authenticated:', req.user.username);
      
      // Đã đăng nhập, render trang dashboard
      return res.render('index', { 
        title: 'Dashboard | Planner Buddy',
        themeColor,
        user: req.user // Truyền thông tin user cho client
      });
    }
    
    console.log('[Home Route] No authenticated user, rendering landing page');
    
    // Nếu không authenticated, render landing page
    res.render('index', { 
      title: 'Planner Buddy',
      themeColor,
      user: null // Đảm bảo không có thông tin user
    });
  } catch (error) {
    console.error('[Home Route] Error rendering home page:', error);
    res.status(500).send('Server Error');
  }
});

// 404 handler - must be before error handler
app.use(async (req, res, next) => {
  try {
    // Default theme color
    let themeColor = '#72d1a8';
    
    // Try to get theme color from settings
    try {
      themeColor = await settingService.getThemeColor();
    } catch (error) {
      console.error('Error getting theme color:', error);
      // Use default color if error occurs
    }
    
    res.status(404).render('error', {
      message: 'Page not found',
      error: { status: 404 },
      title: 'Not Found',
      themeColor,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use(async (err, req, res, next) => {
  console.error('Server error:', err);
  
  const statusCode = err.status || 500;
  
  // Default theme color
  let themeColor = '#72d1a8';
  
  // Try to get theme color from settings
  try {
    themeColor = await settingService.getThemeColor();
  } catch (error) {
    console.error('Error getting theme color:', error);
    // Use default color if error occurs
  }
  
  res.status(statusCode).render('error', {
    message: statusCode === 500 ? 'Internal Server Error' : err.message || 'An error occurred',
    error: process.env.NODE_ENV === 'production' ? {} : err,
    title: 'Error',
    themeColor,
    user: req.user
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 