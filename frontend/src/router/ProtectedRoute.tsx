import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="h-14 w-14 animate-ping rounded-xl bg-neutral-900/10 dark:bg-white/10"
              style={{ animationDuration: '1.5s' }}
            />
          </div>
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-white">
            <img src="/favicon.png" alt="Outlive" className="h-10 w-10" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
