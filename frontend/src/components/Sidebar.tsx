import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  UserMultipleIcon,
  Tag01Icon,
  Package01Icon,
  File02Icon,
  UserSettings01Icon,
  Logout01Icon,
  Moon01Icon,
  Sun03Icon,
  Message01Icon,
  Menu01Icon,
  Cancel01Icon,
  ShieldUserIcon
} from '@hugeicons/core-free-icons';

type NavItem = {
  path: string;
  label: string;
  icon: typeof Home01Icon;
};

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: Home01Icon },
  { path: '/patients', label: 'Patients', icon: UserMultipleIcon },
  { path: '/categories', label: 'Categories', icon: Tag01Icon },
  { path: '/products', label: 'Products', icon: Package01Icon },
  { path: '/logs', label: 'Logs', icon: File02Icon },
  { path: '/admins', label: 'Admins', icon: UserSettings01Icon },
  { path: '/chat-notifications', label: 'Messages', icon: Message01Icon }
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  // Sidebar content (shared between desktop and mobile)
  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center">
          <img
            src="/logo.svg"
            alt="Outlive"
            className="h-6 dark:invert"
          />
        </div>
        {isMobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`
                flex items-center gap-3 w-full rounded-xl px-3 py-2.5
                transition-all duration-200
                ${isActive(item.path)
                  ? 'bg-gradient-to-r from-[#fdb482] to-[#ff7c66] text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }
              `}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={20}
                color={isActive(item.path) ? 'white' : 'currentColor'}
              />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-neutral-100 dark:border-neutral-800">
        {/* User Info */}
        {user && (
          <div className="mb-3 px-3 py-3 rounded-xl bg-gradient-to-r from-[#fdb482]/10 to-[#ff7c66]/10 border border-[#fdb482]/20">
            <div className="flex items-center gap-2 mb-1">
              <HugeiconsIcon icon={ShieldUserIcon} size={14} className="text-[#ff7c66]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[#ff7c66]">
                Admin
              </span>
            </div>
            <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">
              {user.email}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
          >
            <HugeiconsIcon icon={theme === 'dark' ? Sun03Icon : Moon01Icon} size={20} />
            <span className="text-sm font-medium">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <HugeiconsIcon icon={Logout01Icon} size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 lg:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
        >
          <HugeiconsIcon icon={Menu01Icon} size={22} />
        </button>
        <img
          src="/logo.svg"
          alt="Outlive"
          className="h-5 dark:invert"
        />
        <div className="w-10" /> {/* Spacer for balance */}
      </header>

      {/* Mobile Slide-out Menu */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
        {/* Drawer */}
        <aside
          className={`absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white dark:bg-neutral-900 transform transition-transform duration-300 ease-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent isMobile />
        </aside>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className="fixed left-0 top-0 z-40 h-[calc(100vh-20px)] m-2.5 w-[240px] rounded-[22px] bg-white dark:bg-neutral-900 hidden lg:flex flex-col"
      >
        <SidebarContent />
      </aside>
    </>
  );
};
