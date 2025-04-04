const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

/**
 * Hash mật khẩu sử dụng bcrypt
 * @param {string} password - Mật khẩu cần hash
 * @returns {string} - Mật khẩu đã hash
 */
const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

/**
 * So sánh mật khẩu với mật khẩu đã hash
 * @param {string} password - Mật khẩu cần kiểm tra
 * @param {string} hashedPassword - Mật khẩu đã hash từ database
 * @returns {boolean} - Kết quả so sánh
 */
const comparePassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

/**
 * Tạo JWT token cho người dùng
 * @param {object} user - Thông tin người dùng
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // Token hết hạn sau 7 ngày
  };

  return jwt.sign(payload, JWT_SECRET);
};

/**
 * Xác thực JWT token
 * @param {string} token - JWT token cần xác thực
 * @returns {object|null} - Thông tin từ token hoặc null nếu không hợp lệ
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
}; 