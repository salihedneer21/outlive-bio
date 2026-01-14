import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { PreferencesProvider } from './preferences/PreferencesContext';
import { ToastProvider } from './components/Toaster';
import { AdminSocketProvider } from './socket/AdminSocketContext';
import { router } from './router';

export const App: React.FC = () => (
  <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <AdminSocketProvider>
          <PreferencesProvider>
            <RouterProvider router={router} />
          </PreferencesProvider>
        </AdminSocketProvider>
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
);
