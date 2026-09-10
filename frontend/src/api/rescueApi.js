import api from './axiosConfig';
export const rescueApi = {
  list:         (params)     => api.get('/rescue/reports/', { params }),
  nearby:       (params)     => api.get('/rescue/reports/nearby/', { params }),
  get:          (id)         => api.get(`/rescue/reports/${id}/`),
  submit:       (formData)   => api.post('/rescue/reports/', formData,
                                  { headers: { 'Content-Type': 'multipart/form-data' } }),
  assign:       (id, data)   => api.put(`/rescue/reports/${id}/assign/`, data),
  updateStatus: (id, status) => api.put(`/rescue/reports/${id}/status/`, { status }),
  resolve:      (id, data)   => api.post(`/rescue/reports/${id}/resolve/`, data),
  suggest:      (reportId)   => api.post(`/rescue-engine/suggest/${reportId}/`),
  autoAssign:   (reportId)   => api.post(`/rescue-engine/auto-assign/${reportId}/`),
};
