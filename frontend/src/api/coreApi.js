import api from './axiosConfig';
export const coreApi = {
  getLookup:    (category)        => api.get(`/lookup/${category}/`),
  addLookup:    (category, data)  => api.post(`/lookup/${category}/`, data),
  getConfigs:   ()                => api.get('/config/'),
  updateConfig: (key, value)      => api.put(`/config/${key}/`, { value }),
};
