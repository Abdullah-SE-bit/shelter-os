import api from './axiosConfig';

export const catsApi = {
  list:         (params)        => api.get('/cats/', { params }),
  listPublic:   (params)        => api.get('/cats/public/', { params }),
  get:          (id)            => api.get(`/cats/${id}/`),
  create:       (data)          => api.post('/cats/', data),
  update:       (id, data)      => api.put(`/cats/${id}/`, data),
  delete:       (id)            => api.delete(`/cats/${id}/`),
  changeStatus: (id, status)    => api.put(`/cats/${id}/status/`, { status }),
  uploadPhotos: (id, formData)  => api.post(`/cats/${id}/photos/`, formData,
                                     { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto:  (catId, photoId)=> api.delete(`/cats/${catId}/photos/${photoId}/`),
  listBreeds:   ()              => api.get('/lookup/BREED/'),
};
