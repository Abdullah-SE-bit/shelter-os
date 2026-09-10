import api from './axiosConfig';

export const authApi = {
  register:           (data)      => api.post('/auth/register/', data),
  login:              (data)      => api.post('/auth/login/', data),
  guestSession:       ()          => api.post('/auth/guest-session/'),
  logout:             (data)      => api.post('/auth/logout/', data),
  refreshToken:       (data)      => api.post('/auth/token/refresh/', data),
  verifyEmail:        (token)     => api.get(`/auth/verify-email/?token=${token}`),
  resendVerification: (email)     => api.post('/auth/resend-verification/', email ? { email } : {}),
  forgotPassword:     (email)     => api.post('/auth/forgot-password/', { email }),
  resetPassword:      (data)      => api.post('/auth/reset-password/', data),
  getMe:              ()          => api.get('/users/me/'),
  updateMe:           (data)      => api.put('/users/me/', data),
  getAddresses:       ()          => api.get('/users/me/addresses/'),
  addAddress:         (data)      => api.post('/users/me/addresses/', data),
  updateAddress:      (id, d)     => api.put(`/users/me/addresses/${id}/`, d),
  deleteAddress:      (id)        => api.delete(`/users/me/addresses/${id}/`),
  getContacts:        ()          => api.get('/users/me/emergency-contacts/'),
  addContact:         (data)      => api.post('/users/me/emergency-contacts/', data),
  listUsers:          (params)    => api.get('/admin/users/', { params }),
  changeRole:         (id, role)  => api.put(`/admin/users/${id}/role/`, { role }),
  setStatus:          (id, active)=> api.put(`/admin/users/${id}/status/`, { is_active: active }),
  verifyUser:         (id, v=true)=> api.put(`/admin/users/${id}/verify/`, { is_verified: v }),
  createAdminUser:    (data)      => api.post('/admin/users/create/', data),
  // Vet approval workflow
  listVetApprovals:   (params)    => api.get('/admin/vets/', { params }),
  superDecideVet:     (id, payload) => api.put(`/admin/vets/${id}/super-approval/`, payload),
  shelterDecideVet:   (id, payload) => api.put(`/admin/vets/${id}/shelter-approval/`, payload),
  getVetAppealDocument: (id)      => api.get(`/admin/vets/${id}/appeal-document/`, { responseType: 'blob' }),
  submitVetAppeal:    (formData)  => api.post('/vets/me/appeal/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // Alias used by EditProfilePage
  updateProfile:      (data)      => api.put('/users/me/', data),
};

