/* eslint-env browser */
import apiClient from './axios';

/**
 * Admin: Get all users with pagination and search
 * @param {number} page - Page number
 * @param {number} pageSize - Page size
 * @param {string} q - Search query
 * @param {string} role - Filter by role
 */
export const getAdminUsers = async (page = 1, pageSize = 20, q = '', role = '') => {
  try {
    const params = new window.URLSearchParams({ page, page_size: pageSize });
    if (q) params.append('q', q);
    if (role) params.append('role', role);

    const response = await apiClient.get(`/api/admin/users/?${params.toString()}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch users',
    };
  }
};

/**
 * Admin: Delete a user
 * @param {string} userId - User ID
 */
export const deleteUserAdmin = async (userId) => {
  try {
    const response = await apiClient.delete(`/api/admin/users/${userId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to delete user',
    };
  }
};

/**
 * Admin: Update user details
 * @param {string} userId - User ID
 * @param {Object} data - Data to update (e.g. role)
 */
export const updateUserAdmin = async (userId, data) => {
  try {
    const response = await apiClient.put(`/api/admin/users/${userId}`, data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to update user',
    };
  }
};
