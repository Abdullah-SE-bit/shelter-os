import api from './axiosConfig';
export const analyticsApi = {
  overview:         ()        => api.get('/analytics/overview/'),
  shelterDashboard: (id)      => api.get(`/analytics/shelter/${id}/`),
  adoptionTrends:   (params)  => api.get('/analytics/adoption-trends/', { params }),
  rescueMetrics:    (params)  => api.get('/analytics/rescue-metrics/', { params }),
  adoptionReport:   (params)  => api.get('/reports/adoptions/', { params }),
  rescueReport:     (params)  => api.get('/reports/rescues/', { params }),
  donationReport:   (params)  => api.get('/reports/donations/', { params }),
  complianceReport: (params)  => api.get('/reports/vaccinations/compliance/', { params }),
  volunteerReport:  (params)  => api.get('/reports/volunteers/activity/', { params }),
  exportReport:     (type, p) => api.get(`/reports/export/${type}/`, { params: p, responseType: 'blob' }),
  // K1: real report aggregates for the Reports screen
  reports:          (params)  => api.get('/reports/summary/', { params }),
  reportSummary:    (params)  => api.get('/reports/summary/', { params }),
};
