import api from './axiosConfig';

export const accountsApi = {
  // General list endpoint for search, booking, vets, etc.
  list: (params) => api.get('/users/', { params }),
  
  
  // Search users by name or email
  searchUsers: (query) => api.get('/users/', { params: { search: query } }),
  
  // Get user by ID
  getUser: (id) => api.get(`/users/${id}/`),
  
  // Get current user profile (alternative to authApi)
  getProfile: () => api.get('/users/me/'),
  
  // Update current user profile
  updateProfile: (data) => api.put('/users/me/', data),
  
  // Get users by role (for filtering)
  getUsersByRole: (role) => api.get('/users/', { params: { role } }),
};

