import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientsPage } from '@/pages/patients';
import { CategoriesPage } from '@/pages/categories';
import { ProductsPage } from '@/pages/products';
import { LogsPage } from '@/pages/logs';
import { AdminsPage } from '@/pages/admins';
import { ChatPage } from '@/pages/ChatPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <DashboardPage />
      },
      {
        path: 'patients',
        element: <PatientsPage />
      },
      {
        path: 'categories',
        element: <CategoriesPage />
      },
      {
        path: 'products',
        element: <ProductsPage />
      },
      {
        path: 'logs',
        element: <LogsPage />
      },
      {
        path: 'admins',
        element: <AdminsPage />
      },
      {
        path: 'chat-notifications',
        element: <ChatPage />
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />
  }
]);
