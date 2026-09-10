import api from './axiosConfig';

export const sheltersApi = {
  list:            (params)           => api.get('/shelters/', { params }),
  get:             (id)               => api.get(`/shelters/${id}/`),
  create:          (data)             => api.post('/shelters/', data),
  update:          (id, data)         => api.put(`/shelters/${id}/`, data),
  capacity:        (id)               => api.get(`/shelters/${id}/capacity/`),
  addStaff:        (id, data)         => api.post(`/shelters/${id}/staff/`, data),
  removeStaff:     (id, uid)          => api.delete(`/shelters/${id}/staff/${uid}/`),
  getCats:         (id, params)       => api.get(`/shelters/${id}/cats/`, { params }),
  dashboard:       (id)               => api.get(`/shelters/${id}/dashboard/`),
  myDashboard:     ()                 => api.get('/shelters/my/dashboard/'),

  createIntake:    (shelterId, data)  => api.post(`/intake/${shelterId}/`, data),
  listIntake:      (shelterId, p)     => api.get(`/intake/${shelterId}/`, { params: p }),
  createDischarge: (shelterId, data)  => api.post(`/discharge/${shelterId}/`, data),
  listDischarge:   (shelterId, p)     => api.get(`/discharge/${shelterId}/`, { params: p }),
};
