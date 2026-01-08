import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { PreferencesProvider } from './preferences/PreferencesContext';
import { ToastProvider } from './components/Toaster';
import { router } from './router';

export const App: React.FC = () => (
  <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <PreferencesProvider>
          <RouterProvider router={router} />
        </PreferencesProvider>
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
);
