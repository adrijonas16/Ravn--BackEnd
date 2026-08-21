import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Al montar, valida la sesión guardada contra el backend.
  useEffect(() => {
    let active = true;

    async function validateSavedSession() {
      const savedToken = localStorage.getItem('token');

      if (!savedToken) {
        if (active) setIsAuthLoading(false);
        return;
      }

      setToken(savedToken);

      try {
        const { data } = await authApi.me();
        localStorage.setItem('user', JSON.stringify(data.user));
        if (active) setUser(data.user);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setIsAuthLoading(false);
      }
    }

    void validateSavedSession();

    return () => {
      active = false;
    };
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token, isAuthLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
