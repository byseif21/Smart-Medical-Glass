import apiClient from './axios';

/**
 * Face Login - Validate face and authenticate
 * @param {FormData} formData - Form data containing face image
 * @returns {Promise} API response with user data
 */
export const loginWithFace = async (formData) => {
  try {
    const response = await apiClient.post('/api/login/face', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'Login failed',
    };
  }
};

/**
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise} API response
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiClient.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to change password',
    };
  }
};

/**
 * Delete user account
 * @param {string} password - User password for confirmation
 * @returns {Promise} API response
 */
export const deleteAccount = async (password) => {
  try {
    const response = await apiClient.post('/api/profile/delete', {
      password: password,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to delete account',
    };
  }
};

export const confirmFaceLogin = async ({ userId, password }) => {
  try {
    const response = await apiClient.post(
      '/api/login/face/confirm',
      {
        user_id: userId,
        password,
      },
      {
        skipAuthRedirect: true,
      }
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'Login failed',
    };
  }
};

/**
 * Register a new user with face image
 * @param {FormData} formData - Form data containing name, age, nationality, etc.
 * @returns {Promise} API response
 */
export const registerUser = async (formData) => {
  try {
    const response = await apiClient.post('/api/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'Registration failed',
    };
  }
};

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise} API response with profile data
 */
export const getProfile = async (userId) => {
  try {
    const response = await apiClient.get(`/api/profile/${userId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch profile',
    };
  }
};

/**
 * Update main info
 * @param {string} userId - User ID
 * @param {Object} data - Main info data
 * @returns {Promise} API response
 */
export const updateMainInfo = async (userId, data) => {
  try {
    const response = await apiClient.put(`/api/profile/main-info/${userId}`, data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update main info',
    };
  }
};

/**
 * Update user privacy settings
 * @param {string} userId - User ID
 * @param {Object} settings - Privacy settings object
 * @returns {Promise} API response
 */
export const updatePrivacySettings = async (userId, settings) => {
  try {
    const response = await apiClient.put(`/api/profile/privacy/${userId}`, settings);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to update privacy settings',
    };
  }
};

/**
 * Update medical info
 * @param {string} userId - User ID
 * @param {Object} data - Medical info data
 * @returns {Promise} API response
 */
export const updateMedicalInfo = async (userId, data) => {
  try {
    const response = await apiClient.put(`/api/profile/medical-info/${userId}`, data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update medical info',
    };
  }
};

/**
 * Update relatives/connections
 * @param {string} userId - User ID
 * @param {Array} relatives - Array of relative objects
 * @returns {Promise} API response
 */
export const updateRelatives = async (userId, relatives) => {
  try {
    const response = await apiClient.put(`/api/profile/relatives/${userId}`, { relatives });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update relatives',
    };
  }
};

/**
 * Update face enrollment for a user
 * @param {string} userId - User ID
 * @param {FormData} formData - Form data containing password and face images
 * @returns {Promise} API response
 */
export const updateFaceEnrollment = async (userId, formData) => {
  try {
    const response = await apiClient.post(`/api/profile/face/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        'Failed to update face enrollment',
    };
  }
};

/**
 * Update profile picture for a user
 * @param {string} userId - User ID
 * @param {FormData} formData - Form data containing image
 * @returns {Promise} API response
 */
export const updateProfilePicture = async (userId, formData) => {
  try {
    const response = await apiClient.post(`/api/profile/avatar/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        'Failed to update profile picture',
    };
  }
};

/**
 * Recognize a person from face image
 * @param {FormData} formData - Form data containing image
 * @returns {Promise} API response
 */
export const recognizeFace = async (formData) => {
  try {
    const response = await apiClient.post('/api/recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Recognition failed',
    };
  }
};

/**
 * Health check endpoint
 * @returns {Promise} API response
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Health check failed',
    };
  }
};

/**
 * Search for users by name or ID
 * @param {string} query - Search query
 * @param {string} currentUserId - Optional current user ID for exclusion and status check
 * @returns {Promise} API response with matching users
 */
export const searchUsers = async (query, currentUserId = null) => {
  try {
    let url = `/api/users/search?q=${encodeURIComponent(query)}`;
    if (currentUserId) {
      url += `&current_user_id=${encodeURIComponent(currentUserId)}`;
    }
    const response = await apiClient.get(url);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Search failed',
    };
  }
};

/**
 * Get all connections for a user (linked and external)
 * @param {string} userId - User ID
 * @returns {Promise} API response with connections
 */
export const getConnections = async (userId) => {
  try {
    const response = await apiClient.get(`/api/connections/${userId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch connections',
    };
  }
};

/**
 * Get pending connection requests for a user
 * @returns {Promise} API response with pending requests
 */
export const getPendingRequests = async () => {
  try {
    const response = await apiClient.get('/api/connections/requests/pending');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch pending requests',
    };
  }
};

/**
 * Accept a connection request
 * @param {string} requestId - Request ID
 * @returns {Promise} API response
 */
export const acceptConnectionRequest = async (requestId) => {
  try {
    const response = await apiClient.post(`/api/connections/requests/${requestId}/accept`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to accept request',
    };
  }
};

/**
 * Reject a connection request
 * @param {string} requestId - Request ID
 * @returns {Promise} API response
 */
export const rejectConnectionRequest = async (requestId) => {
  try {
    const response = await apiClient.post(`/api/connections/requests/${requestId}/reject`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to reject request',
    };
  }
};

/**
 * Create a linked connection request to another user
 * @param {Object} data - Connection data {connected_user_id, relationship}
 * @returns {Promise} API response
 */
export const createLinkedConnection = async (data) => {
  try {
    const response = await apiClient.post('/api/connections/linked/request', data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to send connection request',
    };
  }
};

/**
 * Create an external contact
 * @param {Object} data - Contact data {name, phone, address, relationship}
 * @returns {Promise} API response
 */
export const createExternalContact = async (data) => {
  try {
    const response = await apiClient.post('/api/connections/external', data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to create contact',
    };
  }
};

/**
 * Update a connection
 * @param {string} connectionId - Connection ID
 * @param {Object} data - Updated data
 * @returns {Promise} API response
 */
export const updateConnection = async (connectionId, data, connectionType) => {
  try {
    const type = connectionType || 'external';
    const endpoint =
      type === 'linked'
        ? `/api/connections/linked/${connectionId}`
        : `/api/connections/external/${connectionId}`;

    const response = await apiClient.put(endpoint, data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'Failed to update connection',
      status: error.response?.status,
    };
  }
};

/**
 * Delete a connection
 * @param {string} connectionId - Connection ID
 * @returns {Promise} API response
 */
export const deleteConnection = async (connectionId) => {
  try {
    const response = await apiClient.delete(`/api/connections/${connectionId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to delete connection',
    };
  }
};

export default apiClient;
