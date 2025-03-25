const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Hash mật khẩu với bcrypt
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// So sánh mật khẩu với hash
const comparePassword = async (password, hashedPassword) => {
  try {
    console.log('[Auth Util] Comparing password, hash length:', hashedPassword?.length || 0);
    if (!password || !hashedPassword) {
      console.log('[Auth Util] Missing password or hashedPassword');
      return false;
    }
    const result = await bcrypt.compare(password, hashedPassword);
    console.log('[Auth Util] Password comparison result:', result);
    return result;
  } catch (error) {
    console.error('[Auth Util] Error comparing password:', error.message);
    return false;
  }
};

// Tạo JWT token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };
  
  return jwt.sign(
    payload, 
    process.env.JWT_SECRET, 
    { expiresIn: '1d' } // Token hết hạn sau 1 ngày
  );
};

// Xác thực token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
}; 