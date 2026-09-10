import api from './axiosConfig';
export const mapsApi = {
  markers:     (params) => api.get('/map/markers/', { params }),
  shelters:    ()       => api.get('/map/shelters/'),
  rescue:      (params) => api.get('/map/rescue-reports/', { params }),
  lostCats:    (params) => api.get('/map/lost-cats/', { params }),
  heatmap:     (params) => api.get('/map/heatmap/rescue/', { params }),
  abandonment: ()       => api.get('/map/heatmap/abandonment/'),
  // Alias: fetches all layers and combines into one response
  getMapData:  ()       => api.get('/map/markers/'),
};
