require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;
const settingService = require('./services/setting.service');
const { User } = require('./database/models');
const { authenticate } = require('./middleware/auth.middleware');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

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

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
const todoRoutes = require('./routes/todo.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const settingRoutes = require('./routes/setting.routes');
const authRoutes = require('./routes/auth.routes');
const apiRoutes = require('./routes/api');

// Public routes (no auth required)
app.use('/auth', authRoutes);

// API routes (with /api prefix)
app.use('/api', apiRoutes);

// Legacy API compatibility - ensure old API calls still work while transitioning to new structure
// This forwards non-HTML requests to the new API endpoints
app.use((req, res, next) => {
  const path = req.path;
  // Only apply to auth, todos, appointments endpoints and POST, PUT, DELETE, PATCH methods
  // Also apply to GET methods that are likely to be API calls (exclude rendering routes)
  const apiPaths = ['/auth/login', '/auth/register', '/auth/logout', '/auth/me', 
                   '/todos', '/appointments', '/settings'];
  
  const isApiCall = apiPaths.some(apiPath => path.startsWith(apiPath)) && 
                   (!req.accepts('html') || req.method !== 'GET' || 
                   (path.includes('/api/') || path === '/auth/me'));
  
  if (isApiCall) {
    console.log(`Forwarding legacy API call from ${req.path} to /api${req.path}`);
    // Change the URL but maintain the same HTTP method and request body
    req.url = `/api${req.path}`;
    return next();
  }
  next();
});

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
    
    // Get user if authenticated
    let user = null;
    if (req.cookies.token) {
      try {
        const decoded = jwt.verify(req.cookies.token, JWT_SECRET);
        user = await User.findOne({
          where: {
            id: decoded.id,
            is_active: true,
            deleted: false
          }
        });
      } catch (error) {
        console.error('Error getting user:', error);
      }
    }
    
    res.render('index', { 
      title: 'Planner Buddy',
      themeColor,
      user
    });
  } catch (error) {
    console.error('[Home Route] Error rendering home page:', error);
    res.status(500).send('Server Error');
  }
});

// Apply authentication to routes but allow them to continue even if authentication fails
app.use('/todos', authenticate, todoRoutes);
app.use('/appointments', authenticate, appointmentRoutes);
app.use('/settings', authenticate, settingRoutes);

// Dashboard routes
const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/dashboard', authenticate, dashboardRoutes);

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