import api from './axiosConfig';
export const inventoryApi = {
  list:        (params)         => api.get('/inventory/items/', { params }),
  listByShelter:(shelterId, p)  => api.get(`/inventory/${shelterId}/items/`, { params: p }),
  get:         (id)             => api.get(`/inventory/items/${id}/`),
  lowStock:    (shelterId)      => api.get(`/inventory/${shelterId}/items/low-stock/`),
  create:      (data)           => api.post('/inventory/items/', data),
  createForShelter:(shelterId, data) => api.post(`/inventory/${shelterId}/items/`, data),
  update:      (id, data)       => api.put(`/inventory/items/${id}/`, data),
  adjustStock: (id, data)       => api.post(`/inventory/items/${id}/restock/`, data),
  restock:     (id, data)       => api.post(`/inventory/items/${id}/restock/`, data),
  use:         (id, data)       => api.post(`/inventory/items/${id}/use/`, data),
  getHistory:  (id, p)          => api.get(`/inventory/items/${id}/history/`, { params: p }),
  history:     (id, p)          => api.get(`/inventory/items/${id}/history/`, { params: p }),
};
