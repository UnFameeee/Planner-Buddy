require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;
const settingService = require('./services/setting.service');
const { User } = require('./database/models');
const { authenticateToken, requireAuth } = require('./middleware/auth.middleware');

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(express.static(path.join(__dirname, '../assets')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
const todoRoutes = require('./routes/todo.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const settingRoutes = require('./routes/setting.routes');
const authRoutes = require('./routes/auth.routes');

// Authentication middleware - apply to all routes except public ones
app.use((req, res, next) => {
  if (req.path.startsWith('/auth/') || req.path === '/') {
    return next();
  }
  authenticateToken(req, res, next);
});

// Public routes (no auth required)
app.use('/auth', authRoutes);

// Home route
app.get('/', async (req, res) => {
  try {
    // Get theme color from settings
    let themeColor = '#72d1a8';
    try {
      themeColor = await settingService.getThemeColor();
    } catch (error) {
      console.error('Error getting theme color:', error);
    }
    
    if (req.user) {
      return res.redirect('/dashboard');
    }
    
    res.render('index', { 
      title: 'Planner Buddy',
      themeColor,
      user: null
    });
  } catch (error) {
    console.error('[Home Route] Error rendering home page:', error);
    res.status(500).send('Server Error');
  }
});

// Protected routes
app.use('/todos', requireAuth, todoRoutes);
app.use('/appointments', requireAuth, appointmentRoutes);
app.use('/settings', requireAuth, settingRoutes);

// Dashboard route (protected)
app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // Get theme color from settings
    let themeColor = '#72d1a8';
    try {
      themeColor = await settingService.getThemeColor();
    } catch (error) {
      console.error('Error getting theme color:', error);
    }

    // Get user with todos and appointments
    const user = await User.findByPk(req.user.id, {
      include: ['todos', 'appointments'],
      order: [
        ['todos', 'created_at', 'DESC'],
        ['appointments', 'start_time', 'ASC']
      ]
    });

    res.render('dashboard', {
      title: 'Dashboard | Planner Buddy',
      themeColor,
      user
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Server Error');
  }
});

// 404 handler - must be before error handler
app.use(async (req, res, next) => {
  try {
    let themeColor = '#72d1a8';
    try {
      themeColor = await settingService.getThemeColor();
    } catch (error) {
      console.error('Error getting theme color:', error);
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
  
  let themeColor = '#72d1a8';
  try {
    themeColor = await settingService.getThemeColor();
  } catch (error) {
    console.error('Error getting theme color:', error);
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