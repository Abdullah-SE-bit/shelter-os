import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenUtils } from '../utils/tokenUtils';
import api from '../api/axiosConfig';
import { useIdleTimer } from '../hooks/useIdleTimer';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!tokenUtils.isLoggedIn()) { setLoading(false); return; }
    try {
      const { data } = await api.get('/users/me/');
      setUser(data.data);
    } catch {
      tokenUtils.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password });
    tokenUtils.setTokens(data.data.access, data.data.refresh);
    await loadUser();
    return data.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/', { refresh: tokenUtils.getRefresh() });
    } catch {}
    tokenUtils.clearTokens();
    setUser(null);
  };

  // GEN-06: Auto-logout on inactivity (15 minutes)
  // Only activate idle timer when user is logged in
  useIdleTimer(
    () => {
      if (user && tokenUtils.isLoggedIn()) {
        console.log('User inactive for 15 minutes - logging out...');
        logout();
        // Optionally show a notification to the user
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?reason=idle';
        }
      }
    },
    15 * 60 * 1000, // 15 minutes
  );

  const isRole = (...roles) => roles.includes(user?.role);

  const hasAnyRole = (...roles) => roles.some(r => user?.role === r);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loadUser, isRole, hasAnyRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
