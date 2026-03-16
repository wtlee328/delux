import axios from 'axios';

// Configure axios base URL from environment variable
// In development: uses Vite proxy (empty baseURL)
// In production: uses VITE_API_BASE_URL from .env
const baseURL = import.meta.env.VITE_API_BASE_URL || '';

const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the auth token (skip if undefined during tests)
if (axiosInstance.interceptors && axiosInstance.interceptors.request) {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}

// Add a response interceptor to handle 401 errors globally
if (axiosInstance.interceptors && axiosInstance.interceptors.response) {
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401 && window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

// Export configured instance
export default axiosInstance;
