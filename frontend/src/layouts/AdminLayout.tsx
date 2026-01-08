import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-50">
      <Sidebar />
      <main className="min-h-screen p-6 pt-20 transition-all duration-300 lg:ml-[260px] lg:pt-6">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
