/**
 * Authentication Service
 * Centralizes all local storage operations for user sessions.
 */

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER_ID: 'user_id',
  USER_NAME: 'user_name',
  USER_ROLE: 'user_role',
  VIEWING_ID: 'viewing_user_id',
  VIEWING_NAME: 'viewing_user_name',
};

/**
 * Save user session data to local storage
 * @param {Object} data - User data from login API
 */
export const setSession = (data) => {
  if (data.token) localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
  if (data.user_id) localStorage.setItem(STORAGE_KEYS.USER_ID, data.user_id);
  if (data.name) localStorage.setItem(STORAGE_KEYS.USER_NAME, data.name);
  // Default to 'user' if role is missing
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, data.role || 'user');
};

/**
 * Clear all session data (Logout)
 */
export const clearSession = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_ID);
  localStorage.removeItem(STORAGE_KEYS.USER_NAME);
  localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
  localStorage.removeItem(STORAGE_KEYS.VIEWING_ID);
  localStorage.removeItem(STORAGE_KEYS.VIEWING_NAME);
};

/**
 * Get the authentication token
 * @returns {string|null}
 */
export const getAccessToken = () => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

/**
 * Get current user details
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  const id = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!id) return null;

  return {
    id,
    name: localStorage.getItem(STORAGE_KEYS.USER_NAME),
    role: localStorage.getItem(STORAGE_KEYS.USER_ROLE) || 'user',
  };
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getAccessToken() && !!localStorage.getItem(STORAGE_KEYS.USER_ID);
};

/**
 * Check if current user is an admin
 * @returns {boolean}
 */
export const isAdmin = () => {
  const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
  return (role || '').toLowerCase() === 'admin';
};

/**
 * Get the user role
 * @returns {string}
 */
export const getUserRole = () => {
  return localStorage.getItem(STORAGE_KEYS.USER_ROLE) || 'user';
};

/**
 * Set the temporary viewing user (for recognizing others)
 * @param {string} userId
 * @param {string} userName
 */
export const setViewingUser = (userId, userName) => {
  localStorage.setItem(STORAGE_KEYS.VIEWING_ID, userId);
  if (userName) localStorage.setItem(STORAGE_KEYS.VIEWING_NAME, userName);
};
