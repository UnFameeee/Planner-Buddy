const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../database/models');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.render('auth/register', {
        title: 'Register | Planner Buddy',
        themeColor: '#72d1a8',
        user: null,
        error: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', {
      title: 'Register | Planner Buddy',
      themeColor: '#72d1a8',
      user: null,
      error: 'Registration failed. Please try again.'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { username }
    });

    if (!user) {
      return res.render('auth/login', {
        title: 'Login | Planner Buddy',
        themeColor: '#72d1a8',
        user: null,
        error: 'Invalid username or password'
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.render('auth/login', {
        title: 'Login | Planner Buddy',
        themeColor: '#72d1a8',
        user: null,
        error: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    // Redirect to original URL or dashboard
    const returnTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login | Planner Buddy',
      themeColor: '#72d1a8',
      user: null,
      error: 'Login failed. Please try again.'
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.redirect('/auth/login');
}; 