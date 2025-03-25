const { verifyToken } = require('./auth.util');
const { User } = require('../database/models');

// Middleware xác thực JWT token
const authenticate = async (req, res, next) => {
  try {
    // Kiểm tra token trong header Authorization
    let token = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // Nếu không có token, trả về lỗi hoặc chuyển hướng
    if (!token) {
      // Kiểm tra xem đây có phải là API call không
      const isApiCall = req.path.startsWith('/api') || 
                      req.xhr || 
                      (req.headers.accept && req.headers.accept.includes('application/json'));
      
      if (isApiCall) {
        return res.status(401).json({ 
          success: false, 
          message: 'Access denied. No token provided.' 
        });
      }
      
      // Đối với route view, chuyển hướng đến trang đăng nhập
      return res.redirect('/auth/login');
    }

    // Xác thực token
    const decoded = verifyToken(token);
    if (!decoded) {
      // Đối với API, trả về lỗi JSON
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token. Please login again.' 
        });
      }
      
      // Đối với route view, chuyển hướng đến trang đăng nhập
      return res.redirect('/auth/login');
    }

    // Tìm người dùng theo ID từ token
    const user = await User.findByPk(decoded.id);

    // Kiểm tra người dùng tồn tại và đang hoạt động
    if (!user || !user.is_active) {
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found or inactive.' 
        });
      }
      
      return res.redirect('/auth/login');
    }

    // Đặt thông tin người dùng vào request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_active: user.is_active,
      timezone: user.timezone
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication error.', 
        error: error.message 
      });
    }
    
    return res.redirect('/auth/login');
  }
};

// Middleware kiểm tra quyền admin
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    // Kiểm tra người dùng có phải admin không
    if (req.user.username !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin rights required.' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Authorization error.', 
      error: error.message 
    });
  }
};

module.exports = {
  authenticate,
  isAdmin
}; 