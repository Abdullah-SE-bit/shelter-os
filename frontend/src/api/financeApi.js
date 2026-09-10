import api from './axiosConfig';
export const financeApi = {
  // Donation endpoints
  donate:           (data)       => api.post('/donations/', data),
  listDonations:    (params)     => api.get('/donations/', { params }),
  createDonation:   (data)       => api.post('/donations/', data),
  myDonations:      (params)     => api.get('/donations/me/', { params }),
  shelterDonations: (id, params) => api.get(`/donations/shelter/${id}/`, { params }),
  
  // Campaign endpoints
  listCampaigns:    (params)     => api.get('/donations/campaigns/', { params }),
  getCampaign:      (id)         => api.get(`/donations/campaigns/${id}/`),
  createCampaign:   (data)       => api.post('/donations/campaigns/', data),
  updateCampaign:   (id, data)   => api.put(`/donations/campaigns/${id}/`, data),
  
  // Expense endpoints
  listExpenses:     (id, params) => api.get(`/finance/${id}/expenses/`, { params }),
  addExpense:       (id, data)   => api.post(`/finance/${id}/expenses/`, data),
  createExpense:    (id, data)   => api.post(`/finance/${id}/expenses/`, data),
  
  // Financial summary and reports
  summary:          (id, params) => api.get(`/finance/${id}/summary/`, { params }),
  report:           (id, params) => api.get(`/finance/${id}/report/`, { params }),
};
