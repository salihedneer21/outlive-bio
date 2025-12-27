import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { logoutRequest, refreshRequest } from '@/api/auth';
import { authEvents } from './authEvents';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
}

interface AuthContextValue extends AuthState {
  login: (user: AuthUser) => void;
  logout: () => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
  user: null
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);

  const login = useCallback((user: AuthUser) => {
    setState({ user });
  }, []);

  const logout = useCallback(() => {
    void logoutRequest().catch(() => {
      // ignore network/logout failures on client side
    });
    setState(initialState);
  }, []);

  // Subscribe to auth events from the API client
  useEffect(() => {
    const unsubscribe = authEvents.subscribe((event) => {
      if (event === 'session-expired' || event === 'unauthorized') {
        // Clear local state immediately - no need to call logout API
        // since the session is already invalid
        setState(initialState);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // On first load, attempt to refresh using the HttpOnly cookie.
    const run = async () => {
      try {
        const response = await refreshRequest();
        const { user, role } = response.data;

        if (!role || role !== 'admin') {
          setHasTriedRefresh(true);
          return;
        }

        login({
          id: user.id,
          email: user.email,
          role
        });
      } catch {
        // If refresh fails we stay logged out.
      } finally {
        setHasTriedRefresh(true);
      }
    };

    void run();
  }, [login]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isReady: hasTriedRefresh,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
