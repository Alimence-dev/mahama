import { createContext, useContext, useEffect, useState } from 'react';
import request from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  async function login(email, password) {
    const data = await request('/auth/login', { method: 'POST', body: { email, password } });
    setToken(data.token);
    setUser(data.user);
    setSessionExpired(false);
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    function handleExpired() {
      setToken(null);
      setUser(null);
      setSessionExpired(true);
    }
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, sessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
