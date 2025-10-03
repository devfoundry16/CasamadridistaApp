import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserService, AuthResponse } from '@/services/authApi';

interface User {
  email: string;
  nicename: string;
  displayName: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const isValid = await UserService.validateToken();
      if (isValid) {
        const userData = await UserService.getCurrentUser();
        if (userData) {
          setUser({
            email: userData.email,
            nicename: userData.username,
            displayName: userData.name,
          });
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[Auth] Check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (username: string, password: string): Promise<void> => {
    try {
      const response: AuthResponse = await UserService.login(username, password);
      setUser({
        email: response.user_email,
        nicename: response.user_nicename,
        displayName: response.user_display_name,
      });
      setIsAuthenticated(true);
      console.log('[Auth] Login successful');
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      throw error;
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string): Promise<void> => {
    try {
      await UserService.register(username, email, password);
      await login(username, password);
      console.log('[Auth] Registration successful');
    } catch (error) {
      console.error('[Auth] Registration failed:', error);
      throw error;
    }
  }, [login]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await UserService.logout();
      setUser(null);
      setIsAuthenticated(false);
      console.log('[Auth] Logout successful');
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
      throw error;
    }
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  }), [user, isLoading, isAuthenticated, login, register, logout, checkAuth]);
});
