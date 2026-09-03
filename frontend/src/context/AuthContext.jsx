import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  function login(data) {
    setToken(data.token);
    setUser(data.user);
  }

  function updateUser(next) {
    setUser((prev) => (prev ? { ...prev, ...next } : next));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function hasPermission(...perms) {
    if (!user) return false;
    if (user.permissions?.includes('*')) return true;
    return perms.some((p) => user.permissions?.includes(p));
  }

  function canWrite(module) {
    return hasPermission(`${module}:write`, '*');
  }

  function canAccessBranch(branchId) {
    if (!user) return false;
    if (user.allBranches || user.permissions?.includes('*')) return true;
    return (user.branchIds || []).includes(Number(branchId));
  }

  return (
    <AuthContext.Provider value={{
      user, token, login, logout, updateUser, hasPermission, canWrite, canAccessBranch,
    }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
