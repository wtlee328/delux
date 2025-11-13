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

// Export configured instance
export default axiosInstance;
