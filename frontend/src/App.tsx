import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CategoriesPage } from '@/pages/categories';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { PreferencesProvider, usePreferences } from './preferences/PreferencesContext';
import { ToastProvider } from './components/Toaster';

type AdminRoute = 'dashboard' | 'patients' | 'categories';

const AdminNavbar: React.FC<{
  activeRoute: AdminRoute;
  onRouteChange: (route: AdminRoute) => void;
}> = ({ activeRoute, onRouteChange }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pageSize, setPageSize } = usePreferences();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    logout();
  };

  const handleToggleTheme = () => {
    setIsProfileOpen(false);
    toggleTheme();
  };

  const handleSelectPageSize = (size: number) => {
    setPageSize(size);
  };

  const handleRouteChange = (route: AdminRoute) => {
    onRouteChange(route);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Slide-out Menu */}
      <div
        className={`fixed inset-0 z-50 sm:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-neutral-900 shadow-xl transform transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                  <img src="/favicon.png" alt="Outlive" className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Outlive Admin</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Clinic console</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* User Info */}
              {user && (
                <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Signed in as</div>
                  <div className="mt-0.5 truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                    {user.email ?? 'Admin'}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <nav className="p-2">
                <div className="mb-2 px-2 text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Navigation</div>
                <button
                  type="button"
                  onClick={() => handleRouteChange('dashboard')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    activeRoute === 'dashboard'
                      ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                      : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </span>
                  <span className="font-medium">Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRouteChange('patients')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    activeRoute === 'patients'
                      ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                      : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                    <svg className="h-4 w-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </span>
                  <span className="font-medium">Patients</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRouteChange('categories')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    activeRoute === 'categories'
                      ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                      : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </span>
                  <span className="font-medium">Categories</span>
                </button>
              </nav>

              {/* Settings */}
              <div className="border-t border-neutral-100 p-2 dark:border-neutral-800">
                <div className="mb-2 px-2 text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Settings</div>

                {/* Dark Mode */}
                <button
                  type="button"
                  onClick={handleToggleTheme}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      {theme === 'dark' ? (
                        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                    </span>
                    <span className="font-medium">Dark mode</span>
                  </span>
                  <div className={`relative h-6 w-11 rounded-full transition-colors ${theme === 'dark' ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                    <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </button>

                {/* Rows per page */}
                <div className="flex items-center justify-between rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      <svg className="h-4 w-4 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Rows per page</span>
                  </div>
                  <select
                    value={pageSize}
                    onChange={(e) => handleSelectPageSize(Number(e.target.value))}
                    className="h-8 rounded-lg border border-neutral-200 bg-white px-2 pr-7 text-sm font-medium text-neutral-900 transition-colors focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer - Sign out */}
            <div className="border-t border-neutral-200 p-2 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
                <span className="font-medium">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          {/* Mobile: Hamburger on left */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 sm:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo - centered on mobile, left on desktop */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white dark:bg-white">
              <img src="/favicon.png" alt="Outlive" className="h-6 w-6" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                Outlive Admin
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Clinic console</div>
            </div>
          </div>

          {/* Desktop Navigation Pills */}
          <div className="hidden items-center gap-1 rounded-full bg-neutral-100 p-1 text-xs font-medium sm:flex dark:bg-neutral-800">
            <button
              type="button"
              onClick={() => onRouteChange('dashboard')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all ${
                activeRoute === 'dashboard'
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onRouteChange('patients')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all ${
                activeRoute === 'patients'
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              Patients
            </button>
            <button
              type="button"
              onClick={() => onRouteChange('categories')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all ${
                activeRoute === 'categories'
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              Categories
            </button>
          </div>
        </div>

        {/* Right Side: Profile (desktop only) + placeholder for mobile balance */}
        <div className="flex items-center">
          {/* Mobile: empty space for visual balance */}
          <div className="w-9 sm:hidden" />

          {/* Desktop Profile Dropdown */}
          {user && (
            <div className="relative hidden sm:block" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((open) => !open)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-xs font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
              >
                <span className="sr-only">Open profile menu</span>
                {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
              </button>

              {isProfileOpen && (
                <div className="animate-fade-in absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white py-2 text-sm shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="border-b border-neutral-100 px-3 pb-2 pt-1 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    <div className="mb-1 text-[11px] uppercase tracking-wide">Signed in as</div>
                    <div className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-50">
                      {user.email ?? 'Admin'}
                    </div>
                  </div>
                  <div className="border-b border-neutral-100 px-3 pb-2 pt-2 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    <div className="mb-1.5 text-[11px] uppercase tracking-wide">Rows per page</div>
                    <div className="flex gap-1">
                      {[10, 25, 50].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSelectPageSize(size)}
                          className={`inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full border px-2 text-[11px] transition-colors ${
                            pageSize === size
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-950 dark:text-cyan-100'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleTheme}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <span className="flex items-center gap-2">
                      {theme === 'dark' ? (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      Dark mode
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      theme === 'dark'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                      {theme === 'dark' ? 'On' : 'Off'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
    </>
  );
};

const AppInner: React.FC = () => {
  const { user, isReady } = useAuth();
  const [route, setRoute] = useState<AdminRoute>('dashboard');

  if (!isReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="relative">
          {/* Pulsing ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-14 w-14 animate-ping rounded-xl bg-neutral-900/10 dark:bg-white/10" style={{ animationDuration: '1.5s' }} />
          </div>
          {/* Logo */}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-white">
            <img src="/favicon.png" alt="Outlive" className="h-10 w-10" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-50">
      <AdminNavbar activeRoute={route} onRouteChange={setRoute} />
      <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        {route === 'dashboard' && <DashboardPage />}
        {route === 'patients' && <PatientsPage />}
        {route === 'categories' && <CategoriesPage />}
      </main>
    </div>
  );
};

export const App: React.FC = () => (
  <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <PreferencesProvider>
          <AppInner />
        </PreferencesProvider>
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
);
