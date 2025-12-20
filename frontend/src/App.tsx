import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
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
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
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
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        {/* Logo and Desktop Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
              OL
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

        {/* Right Side: Profile + Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle - visible on mobile */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 sm:hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Profile Dropdown */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((open) => !open)}
                className="hidden h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-xs font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 sm:inline-flex dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
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

          {/* Mobile Menu Button */}
          <div className="relative sm:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              aria-label="Open menu"
            >
              {isMobileMenuOpen ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
              <div className="animate-fade-in absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white py-2 text-sm shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                {user && (
                  <div className="border-b border-neutral-100 px-3 pb-2 pt-1 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    <div className="mb-1 text-[11px] uppercase tracking-wide">Signed in as</div>
                    <div className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-50">
                      {user.email ?? 'Admin'}
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="border-b border-neutral-100 py-1 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => handleRouteChange('dashboard')}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                      activeRoute === 'dashboard'
                        ? 'bg-neutral-50 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                        : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRouteChange('patients')}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                      activeRoute === 'patients'
                        ? 'bg-neutral-50 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                        : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                    Patients
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRouteChange('categories')}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                      activeRoute === 'categories'
                        ? 'bg-neutral-50 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                        : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                    Categories
                  </button>
                </div>

                {/* Page Size Selector */}
                <div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
                  <div className="mb-1.5 text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Rows per page</div>
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

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

const AppInner: React.FC = () => {
  const { user, isReady } = useAuth();
  const [route, setRoute] = useState<AdminRoute>('dashboard');

  if (!isReady) {
    // Loading splash screen with skeleton
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-lg bg-neutral-900 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
            OL
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-2 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Loading admin console...</p>
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
