'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLES } from '@/utils/constants';

const AuthContext = createContext(null);

const STORAGE_KEY = 'shelter-os-mock-role';

// The three magic strings this playground recognizes on the sign-in form.
// Typing one of these into the email/username field and submitting logs
// you in as that role and routes you straight to its dashboard — no
// password, no backend, nothing to configure.
export const MAGIC_LOGINS = {
  'super-admin': ROLES.SUPER_ADMIN,
  'shelter-admin': ROLES.SHELTER_ADMIN,
  employee: ROLES.EMPLOYEE,
};

export const ROLE_HOME = {
  [ROLES.SUPER_ADMIN]: '/dashboard',
  [ROLES.SHELTER_ADMIN]: '/shelter/dashboard',
  [ROLES.EMPLOYEE]: '/employees/assignments',
  [ROLES.PET_OWNER]: '/pets',
  [ROLES.ADOPTER]: '/adoption',
};

const MOCK_USERS = {
  [ROLES.SUPER_ADMIN]: {
    id: 'mock-super-admin',
    role: ROLES.SUPER_ADMIN,
    email: 'super-admin@shelteros.mock',
    is_email_verified: true,
    created_at: '2024-01-10T00:00:00Z',
    profile: { first_name: 'Sam', last_name: 'Rivera', bio: '', phone: '', date_of_birth: '' },
  },
  [ROLES.SHELTER_ADMIN]: {
    id: 'mock-shelter-admin',
    role: ROLES.SHELTER_ADMIN,
    email: 'shelter-admin@shelteros.mock',
    is_email_verified: true,
    created_at: '2024-02-14T00:00:00Z',
    profile: { first_name: 'Jordan', last_name: 'Blake', bio: 'Running day-to-day operations at Happy Paws Shelter.', phone: '', date_of_birth: '' },
  },
  [ROLES.EMPLOYEE]: {
    id: 'mock-employee',
    role: ROLES.EMPLOYEE,
    email: 'employee@shelteros.mock',
    is_email_verified: true,
    created_at: '2024-05-20T00:00:00Z',
    profile: { first_name: 'Casey', last_name: 'Nguyen', bio: 'Weekend dog walker and pet socializer.', phone: '', date_of_birth: '' },
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read the mock session back on mount (client-only — localStorage isn't
  // available during the server render pass).
  useEffect(() => {
    try {
      const storedRole = window.localStorage.getItem(STORAGE_KEY);
      if (storedRole && MOCK_USERS[storedRole]) setUser(MOCK_USERS[storedRole]);
    } catch {}
    setLoading(false);
  }, []);

  // Reads the raw sign-in input, maps it to a role via MAGIC_LOGINS, and
  // logs in as that role's mock user. Returns the matched role, or null if
  // the input didn't match one of the three magic strings.
  const login = useCallback((rawInput) => {
    const key = String(rawInput || '').trim().toLowerCase();
    const role = MAGIC_LOGINS[key];
    if (!role) return null;
    const mockUser = MOCK_USERS[role];
    setUser(mockUser);
    try {
      window.localStorage.setItem(STORAGE_KEY, role);
    } catch {}
    return role;
  }, []);

  // Mock profile edits: merges into the in-session user so the Profile page
  // reflects changes made on Edit Profile — nothing persists past a refresh.
  const updateProfile = useCallback((patch) => {
    setUser((u) => (u ? { ...u, profile: { ...u.profile, ...patch } } : u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const isRole = (...roles) => roles.includes(user?.role);
  const hasAnyRole = (...roles) => roles.some((r) => user?.role === r);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, isRole, hasAnyRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
