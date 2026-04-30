import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { User, Role } from '../types';
import { AUTH_EXPIRED_EVENT, authAPI } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, name: string, password: string, role: Role, organization?: string) => Promise<User>;
  updateUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function tokenIsUsable(token: string | null): boolean {
  if (!token) return false;

  try {
    const [, payload] = token.split('.');
    if (!payload) return false;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof decoded.exp !== 'number') return true;
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function readStoredUser(): User | null {
  const token = localStorage.getItem('healpath_token');
  if (!tokenIsUsable(token)) {
    localStorage.removeItem('healpath_user');
    localStorage.removeItem('healpath_token');
    return null;
  }

  try {
    const saved = localStorage.getItem('healpath_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem('healpath_user');
    localStorage.removeItem('healpath_token');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      const userData = response.user;
      setUser(userData);
      localStorage.setItem('healpath_user', JSON.stringify(userData));
      localStorage.setItem('healpath_token', response.access_token);
      return userData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, name: string, password: string, role: Role, organization?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.register(email, name, password, role, organization);
      const userData = response.user || response;
      setUser(userData);
      localStorage.setItem('healpath_user', JSON.stringify(userData));
      if (response.access_token) {
        localStorage.setItem('healpath_token', response.access_token);
      }
      return userData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('healpath_user');
    localStorage.removeItem('healpath_token');
    setError(null);
  }, []);

  const updateUser = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('healpath_user', JSON.stringify(userData));
  }, []);

  useEffect(() => {
    const clearSession = (event?: Event) => {
      setUser(null);
      setError(event instanceof CustomEvent ? event.detail?.message || null : null);
    };

    const syncSession = () => {
      setUser(readStoredUser());
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, clearSession);
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, clearSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  const isAuthenticated = !!user && tokenIsUsable(localStorage.getItem('healpath_token'));

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, updateUser, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
