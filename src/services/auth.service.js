const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../database/models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
  // Register new user
  async register(userData) {
    const { username, email, password, timezone } = userData;

    // Check if user exists
    const existingUser = await User.findOne({
      where: {
        username,
        deleted: false
      }
    });

    if (existingUser) {
      throw new Error('Username already exists.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      timezone: timezone || 'UTC',
      is_active: true
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  // Login user
  async login(credentials) {
    const { username, password } = credentials;

    // Find user
    const user = await User.findOne({
      where: {
        username,
        deleted: false
      }
    });

    if (!user) {
      throw new Error('Invalid username or password.');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is inactive. Please contact administrator.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid username or password.');
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  // Get user by ID
  async getUserById(userId) {
    const user = await User.findOne({
      where: {
        id: userId,
        deleted: false
      }
    });

    if (!user) {
      throw new Error('User not found.');
    }

    return this.sanitizeUser(user);
  }

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        timezone: user.timezone,
        is_admin: user.is_admin
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Remove sensitive data from user object
  sanitizeUser(user) {
    const sanitized = user.toJSON();
    delete sanitized.password;
    delete sanitized.deleted;
    delete sanitized.deleted_at;
    return sanitized;
  }
}

module.exports = new AuthService(); 