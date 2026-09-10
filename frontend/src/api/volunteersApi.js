import api from './axiosConfig';
export const volunteersApi = {
  register:      (data)        => api.post('/volunteers/register/', data),
  getMyProfile:  ()            => api.get('/volunteers/me/'),
  updateProfile: (data)        => api.put('/volunteers/me/', data),
  myAssignments: (params)      => api.get('/volunteers/me/assignments/', { params }),
  accept:        (id)          => api.put(`/volunteers/assignments/${id}/accept/`),
  decline:       (id, reason)  => api.put(`/volunteers/assignments/${id}/decline/`, { reason }),
  complete:      (id)          => api.put(`/volunteers/assignments/${id}/complete/`),
  list:          (params)      => api.get('/volunteers/', { params }),
  get:           (id)          => api.get(`/volunteers/${id}/`),
  getProfile:    (id)          => api.get(`/volunteers/${id}/`),
  nearby:        (params)      => api.get('/volunteers/nearby/', { params }),

  // F1: change-shelter request workflow
  myShelterChangeRequests: ()          => api.get('/volunteers/me/shelter-change-request/'),
  requestShelterChange:    (data)      => api.post('/volunteers/me/shelter-change-request/', data),
  listShelterChangeRequests: (params)  => api.get('/volunteers/shelter-change-requests/', { params }),
  approveShelterChange:    (id)        => api.put(`/volunteers/shelter-change-requests/${id}/approve/`),
  rejectShelterChange:     (id)        => api.put(`/volunteers/shelter-change-requests/${id}/reject/`),
};

// Alias for backwards compatibility with pages using the shorter name
export const volunteerApi = volunteersApi;

