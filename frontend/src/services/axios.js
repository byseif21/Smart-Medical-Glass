import axios from 'axios';
import { getAccessToken, getCurrentUser, clearSession } from './auth';

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add user ID header for connection endpoints
    const user = getCurrentUser();
    if (user?.id) {
      config.headers['X-User-ID'] = user.id;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      // Handle unauthorized
      clearSession();
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
