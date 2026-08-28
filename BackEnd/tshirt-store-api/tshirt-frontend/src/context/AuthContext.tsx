import { useCallback, useMemo, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth';
import { AuthContext } from './authContextValue';
import {
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
} from '../utils/authStorage';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Al montar, valida la sesión guardada contra el backend.
  useEffect(() => {
    let active = true;

    async function validateSavedSession() {
      const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);

      if (!savedToken) {
        if (active) setIsAuthLoading(false);
        return;
      }

      setToken(savedToken);

      try {
        const { data } = await authApi.me();
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        if (active) {
          setToken(localStorage.getItem(AUTH_TOKEN_KEY));
          setUser(data.user);
        }
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
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

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const loginWithRefresh = useCallback(
    (newToken: string, newRefreshToken: string, newUser: User) => {
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, newRefreshToken);
      login(newToken, newUser);
    },
    [login],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const value = useMemo(
    () => ({ user, token, login: loginWithRefresh, logout, updateUser, isAuthenticated: !!token, isAuthLoading }),
    [isAuthLoading, loginWithRefresh, logout, token, updateUser, user],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}
