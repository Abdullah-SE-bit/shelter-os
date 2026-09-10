import api from './axiosConfig';
export const lostFoundApi = {
  // Breed options (shared BREED lookup used across the app)
  listBreeds:    ()           => api.get('/lookup/BREED/'),

  // Lost cat alerts
  listLost:      (params)     => api.get('/lost-found/lost/', { params }),
  getLost:       (id)         => api.get(`/lost-found/lost/${id}/`),
  createLost:    (data)       => api.post('/lost-found/lost/', data),
  updateLost:    (id, data)   => api.put(`/lost-found/lost/${id}/`, data),
  resolveLost:   (id)         => api.post(`/lost-found/lost/${id}/resolve/`),

  // Found cat reports
  listFound:     (params)     => api.get('/lost-found/found/', { params }),
  getFound:      (id)         => api.get(`/lost-found/found/${id}/`),
  createFound:   (data)       => api.post('/lost-found/found/', data),
  foundMatches:  (id)         => api.get(`/lost-found/found/${id}/matches/`),
  linkFound:     (id, data)   => api.post(`/lost-found/found/${id}/link/`, data),
  intakeFound:   (id, data)   => api.post(`/lost-found/found/${id}/intake/`, data || {}),

  // Matches
  getMatches:    (lostId)     => api.get(`/lost-found/matches/${lostId}/`),
  confirmMatch:  (matchId)    => api.post(`/lost-found/matches/${matchId}/confirm/`),
  rejectMatch:   (matchId)    => api.post(`/lost-found/matches/${matchId}/reject/`),
};
