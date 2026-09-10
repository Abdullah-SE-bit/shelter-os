import api from './axiosConfig';

export const notificationsApi = {
  // Get all notifications for current user
  list: () => api.get('/notifications/'),
  
  // Get unread count
  unreadCount: () => api.get('/notifications/unread-count/'),
  
  // Mark single notification as read
  markRead: (id) => api.put(`/notifications/${id}/mark-read/`),
  
  // Mark all notifications as read
  markAllRead: () => api.put('/notifications/mark-all-read/'),
  
  // Register FCM token for push notifications
  registerFCMToken: (token, deviceType = 'WEB') => 
    api.post('/notifications/fcm-token/', { token, device_type: deviceType }),
  
  // Get notification preferences
  getPreferences: () => api.get('/notifications/preferences/'),
  
  // Update notification preferences
  updatePreferences: (preferences) => api.put('/notifications/preferences/', preferences),
};
