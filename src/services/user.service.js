const { User } = require('../database/models');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth.util');

// Get user by ID
const getUserById = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    return user;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

// Register new user
const registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email: userData.email
      }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = hashPassword(userData.password);

    // Create new user
    const newUser = await User.create({
      ...userData,
      password: hashedPassword
    });

    // Remove password from response
    const userResponse = newUser.toJSON();
    delete userResponse.password;

    return userResponse;
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
};

// Login user
const loginUser = async (email, password) => {
  try {
    // Find user by email
    const user = await User.findOne({
      where: {
        email: email
      }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Your account is inactive. Please contact administrator');
    }

    // Verify password
    const isPasswordValid = comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return {
      user: userResponse,
      token
    };
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
};

// Update user profile
const updateUserProfile = async (userId, userData) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Handle password update separately
    if (userData.password) {
      userData.password = hashPassword(userData.password);
    }

    // Update user data
    await user.update(userData);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return userResponse;
  } catch (error) {
    throw new Error(`Update failed: ${error.message}`);
  }
};

module.exports = {
  getUserById,
  registerUser,
  loginUser,
  updateUserProfile
}; 