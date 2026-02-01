import axios from 'axios';
import { getAccessToken, getCurrentUser, clearSession } from './auth';

const rawApiUrl = import.meta.env.VITE_API_URL;
let API_ORIGIN;
if (rawApiUrl && rawApiUrl.trim() !== '') {
  // Always enforce HTTPS in production/remote environments unless it's explicitly localhost
  const isLocalhost = rawApiUrl.includes('localhost') || rawApiUrl.includes('127.0.0.1');
  let url = rawApiUrl;

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Upgrade http to https if not localhost
  if (!isLocalhost && url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }

  API_ORIGIN = url;
} else {
  API_ORIGIN = import.meta.env.DEV ? 'http://localhost:8000' : window.location.origin;
}

const apiClient = axios.create({
  baseURL: API_ORIGIN,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
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
let authErrorCallback = null;

export const registerAuthErrorCallback = (callback) => {
  authErrorCallback = callback;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      // Handle unauthorized
      if (authErrorCallback) {
        authErrorCallback();
      } else {
        // fallback
        clearSession();
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
