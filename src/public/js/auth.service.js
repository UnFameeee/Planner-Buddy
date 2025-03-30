class AuthService {
  constructor() {
    this.tokenKey = 'token';
    this.setupAxiosInterceptors();
  }

  // Setup axios interceptors for token handling
  setupAxiosInterceptors() {
    // Request interceptor
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    axios.interceptors.response.use(
      (response) => {
        // Check for new token in response header
        const newToken = response.headers['x-new-token'];
        if (newToken) {
          this.setToken(newToken);
        }
        return response;
      },
      (error) => {
        // Do NOT logout or redirect on 401 errors
        // Just let the error propagate to be handled by the specific component
        return Promise.reject(error);
      }
    );
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Set token in localStorage and cookie
  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
    // The cookie will be set by the server
  }

  // Remove token from localStorage
  removeToken() {
    localStorage.removeItem(this.tokenKey);
    // The cookie will be removed by the server
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Add 5 second buffer to prevent edge cases
      return Date.now() < (payload.exp * 1000) - 5000;
    } catch (error) {
      return false;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await axios.post('/api/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (response.data.success) {
        this.setToken(response.data.data.token);
        
        // After successful registration via API, reload the page to ensure the cookie is used
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await axios.post('/api/auth/login', credentials, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (response.data.success) {
        this.setToken(response.data.data.token);
        
        // After successful login via API, reload the page to ensure the cookie is used
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      }
      return response.data;
    } catch (error) {
      console.error('Auth service login error:', error);
      
      // Properly format error message for client
      if (error.response) {
        // The server responded with an error status
        const errorData = error.response.data;
        if (errorData && typeof errorData === 'object') {
          throw errorData;
        } else if (typeof errorData === 'string') {
          throw new Error(errorData);
        } else {
          throw new Error(`Login failed (${error.response.status})`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your internet connection and try again.');
      } else {
        // Something happened in setting up the request
        throw error;
      }
    }
  }

  // Logout user
  async logout() {
    try {
      await axios.get('/api/auth/logout');
      this.removeToken();
      // Remove the redirect to login page
    } catch (error) {
      console.error('Logout error:', error);
      // Just remove token, no redirect
      this.removeToken();
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await axios.get('/api/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update UI based on authentication status
  updateAuthUI() {
    const isAuthenticated = this.isAuthenticated();
    
    // Get UI elements
    const authNavItems = document.querySelectorAll('.auth-nav-item');
    const nonAuthNavItems = document.querySelectorAll('.non-auth-nav-item');
    const usernamePlaceholder = document.getElementById('username-placeholder');
    
    // Update visibility based on authentication status
    if (authNavItems) {
      authNavItems.forEach(item => {
        item.style.display = isAuthenticated ? 'block' : 'none';
      });
    }
    
    if (nonAuthNavItems) {
      nonAuthNavItems.forEach(item => {
        item.style.display = isAuthenticated ? 'none' : 'block';
      });
    }
    
    // Update username if authenticated
    if (isAuthenticated && usernamePlaceholder) {
      // Try to get username from token
      try {
        const token = this.getToken();
        const payload = JSON.parse(atob(token.split('.')[1]));
        usernamePlaceholder.textContent = payload.username || 'User';
      } catch (error) {
        console.error('Error extracting username from token:', error);
        usernamePlaceholder.textContent = 'User';
      }
    }
  }
}

// Create singleton instance
const authService = new AuthService();

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', () => {
  authService.updateAuthUI();
});

// Remove navigation prevention logic
// document.addEventListener('DOMContentLoaded', () => {
//   const path = window.location.pathname;
//   if ((path === '/auth/login' || path === '/auth/register') && authService.isAuthenticated()) {
//     window.location.href = '/';
//   }
// }); 