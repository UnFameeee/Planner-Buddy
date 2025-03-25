require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const settingService = require('./services/setting.service');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'assets')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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
    // Default theme color if settings service fails
    let themeColor = '#72d1a8';
    
    // Try to get theme color from settings
    try {
      themeColor = await settingService.getThemeColor();
    } catch (error) {
      console.error('Error getting theme color:', error);
      // Use default color if error occurs
    }
    
    res.render('index', { 
      title: 'Planner Buddy',
      themeColor,
      user: req.user // This will be undefined for non-authenticated users
    });
  } catch (error) {
    console.error('Error rendering home page:', error);
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