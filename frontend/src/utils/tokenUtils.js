const ACCESS_KEY  = 'catconnect_access';
const REFRESH_KEY = 'catconnect_refresh';

export const tokenUtils = {
  getAccess:   () => localStorage.getItem(ACCESS_KEY),
  getRefresh:  () => localStorage.getItem(REFRESH_KEY),
  setTokens:   (access, refresh) => {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clearTokens: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  isLoggedIn:  () => !!localStorage.getItem(ACCESS_KEY),
};
