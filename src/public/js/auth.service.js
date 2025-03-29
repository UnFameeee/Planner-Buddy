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
      const response = await axios.post('/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (response.data.success) {
        this.setToken(response.data.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await axios.post('/auth/login', credentials);
      if (response.data.success) {
        this.setToken(response.data.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Logout user
  async logout() {
    try {
      await axios.get('/auth/logout');
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
      const response = await axios.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

// Remove navigation prevention logic
// document.addEventListener('DOMContentLoaded', () => {
//   const path = window.location.pathname;
//   if ((path === '/auth/login' || path === '/auth/register') && authService.isAuthenticated()) {
//     window.location.href = '/';
//   }
// }); 