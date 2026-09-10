import api from './axiosConfig';
export const auditApi = {
  list:          (params)   => api.get('/audit/logs/', { params }),
  entityHistory: (type, id) => api.get(`/audit/logs/entity/${type}/${id}/`),
  userHistory:   (userId)   => api.get(`/audit/logs/user/${userId}/`),
};
