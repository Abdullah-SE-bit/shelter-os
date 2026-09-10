import api from './axiosConfig';

export const messagingApi = {
  // Get all conversations for current user
  listConversations: () => api.get('/conversations/'),
  
  // Create a new conversation
  createConversation: (data) => api.post('/conversations/', data),
  
  // Get messages in a conversation
  getMessages: (conversationId) => api.get(`/conversations/${conversationId}/messages/`),
  
  // Send a message in a conversation
  sendMessage: (conversationId, body, attachments = []) => 
    api.post(`/conversations/${conversationId}/messages/`, { body, attachments }),
  
  // Mark conversation as read
  markConversationRead: (conversationId) => 
    api.put(`/conversations/${conversationId}/mark-read/`),

  // Delete a conversation
  deleteConversation: (conversationId) =>
    api.delete(`/conversations/${conversationId}/`),
};
