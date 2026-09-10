import api from './axiosConfig';
export const fosterApi = {
  register:         (data)           => api.post('/foster/register/', data),
  list:             (params)         => api.get('/foster/profiles/', { params }),
  get:              (id)             => api.get(`/foster/profiles/${id}/`),
  place:            (data)           => api.post('/foster/placements/', data),
  myPlacements:     ()               => api.get('/foster/placements/me/'),
  shelterPlacements:(shelterId, p)   => api.get(`/foster/placements/${shelterId}/`, { params: p }),
  checkIn:          (id, data)       => api.put(`/foster/placements/${id}/checkin/`, data),
  returnToShelter:  (id)             => api.put(`/foster/placements/${id}/return/`),
  // Aliases used by pages
  adminList:        (params)         => api.get('/foster/placements/', { params }),
  submitUpdate:     (id, data)       => api.post(`/foster/placements/${id}/checkin/`, data),
};
