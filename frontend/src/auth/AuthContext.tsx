import React, { createContext, useContext, useEffect, useState } from 'react';
import { logoutRequest, refreshRequest } from '@/api/auth';

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

  const login = (user: AuthUser) => {
    setState({
      user
    });
  };

  const logout = () => {
    void logoutRequest().catch(() => {
      // ignore network/logout failures on client side
    });
    setState(initialState);
  };

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
  }, []);

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
