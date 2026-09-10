import axios from 'axios';
import { tokenUtils } from '../utils/tokenUtils';
import { API_BASE } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = tokenUtils.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // File uploads: the axios instance defaults Content-Type to application/json.
  // For FormData we must drop that header so the browser sets
  // `multipart/form-data` WITH the required boundary — otherwise the server
  // receives a multipart body mislabeled as JSON and the file/fields are lost.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

// Handle 401 — refresh and retry once
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Don't run token-refresh/redirect logic for the auth endpoints themselves.
    // A 401 from login/refresh means "bad credentials" or "invalid refresh token",
    // not "expired access token" — so let the caller handle it (e.g. show an error).
    const url = original?.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login/') ||
      url.includes('/auth/token/refresh/') ||
      url.includes('/auth/refresh/') ||
      url.includes('/auth/register/');

    if (error.response?.status === 401 && !isAuthEndpoint && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing    = true;
      const refresh   = tokenUtils.getRefresh();
      if (!refresh) {
        tokenUtils.clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      let newAccess;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
        newAccess = data.access;
        tokenUtils.setTokens(data.access, null);
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);
      } catch (err) {
        processQueue(err, null);
        tokenUtils.clearTokens();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    }
    return Promise.reject(error);
  }
);

export default api;
