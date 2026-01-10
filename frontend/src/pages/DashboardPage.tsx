import React, { useEffect, useMemo, useState } from 'react';
import type { AdminDashboardStats, StateRegistrationData, GenderDistribution, OutstandingLab } from '@outlive/shared';
import { getDashboardStats } from '@/api/dashboard';
import { useAuth } from '@/auth/AuthContext';
import { fetchChatNotifications, type AdminNotification } from '@/api/chat';
import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserMultipleIcon,
  Tag01Icon,
  Package01Icon,
  File02Icon,
  Notification01Icon,
  Cancel01Icon
} from '@hugeicons/core-free-icons';
import { USMapChart } from '@/components/USMapChart';
import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { PieChart } from '@mui/x-charts/PieChart';

// Generate sparkline data based on growth percentage
const generateSparklineData = (growthPercent: number | null | undefined): number[] => {
  if (growthPercent == null) {
    // Neutral flat line with slight variation
    return [50, 52, 48, 51, 49, 50, 51];
  }

  const baseValue = 50;
  const points = 7;
  const data: number[] = [];

  // Create a trend line that reflects the growth direction
  const trend = growthPercent / 100;
  const startValue = baseValue - (trend * 20);
  const endValue = baseValue + (trend * 20);

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const trendValue = startValue + (endValue - startValue) * progress;
    // Add some natural variation
    const variation = (Math.sin(i * 1.5) * 5) + (Math.random() * 3 - 1.5);
    data.push(Math.max(10, Math.min(90, trendValue + variation)));
  }

  return data;
};

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

const StatCardsSkeleton: React.FC = () => (
  <div className="flex items-center divide-x divide-neutral-200 rounded-2xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex flex-1 items-center gap-4 p-5">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-10" />
        </div>
      </div>
    ))}
  </div>
);

const ChartSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-9 w-32 rounded-lg" />
    </div>
    <div className="mt-8">
      <Skeleton className="h-[200px] w-full rounded-xl" />
    </div>
  </div>
);

// Line chart skeleton with wave shape
const LineChartSkeleton: React.FC = () => (
  <div className="flex h-[220px] items-end gap-1 px-4">
    <svg className="h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="skeletonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" className="animate-pulse" style={{ stopColor: '#e5e7eb', stopOpacity: 0.8 }} />
          <stop offset="100%" className="animate-pulse" style={{ stopColor: '#e5e7eb', stopOpacity: 0.2 }} />
        </linearGradient>
      </defs>
      <path
        d="M0,180 C50,160 80,140 120,100 C160,60 200,80 240,70 C280,60 320,90 360,50 L400,40 L400,200 L0,200 Z"
        fill="url(#skeletonGradient)"
        className="animate-pulse"
      />
      <path
        d="M0,180 C50,160 80,140 120,100 C160,60 200,80 240,70 C280,60 320,90 360,50 L400,40"
        fill="none"
        stroke="#d1d5db"
        strokeWidth="3"
        className="animate-pulse"
      />
    </svg>
  </div>
);

// Donut/Pie chart skeleton
const PieChartSkeleton: React.FC = () => (
  <div className="flex h-[180px] items-center justify-center">
    <div className="relative h-[140px] w-[140px]">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="20"
          className="dark:stroke-neutral-800"
        />
        {/* Animated segments */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="20"
          strokeDasharray="100 151.4"
          strokeDashoffset="0"
          className="animate-pulse dark:stroke-neutral-700"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="20"
          strokeDasharray="60 191.4"
          strokeDashoffset="-100"
          className="animate-pulse dark:stroke-neutral-600"
        />
      </svg>
    </div>
  </div>
);


// Outstanding labs list skeleton
const LabsListSkeleton: React.FC = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50">
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <Skeleton className="h-5 w-14 rounded" />
      </div>
    ))}
  </div>
);

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, trend = 'neutral', sparklineData }) => {
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#9ca3af';
  const gradientId = `sparkline-gradient-${trend}-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className="flex flex-1 items-center justify-between gap-3 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
          {icon}
        </div>
        <div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
          <span className="text-lg font-semibold tabular-nums text-neutral-900 dark:text-white">
            {value.toLocaleString()}
          </span>
        </div>
      </div>
      {sparklineData && sparklineData.length > 0 && (
        <div className="h-12 w-24 shrink-0">
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <SparkLineChart
            data={sparklineData}
            height={48}
            curve="natural"
            area
            colors={[trendColor]}
            sx={{
              '& .MuiAreaElement-root': {
                fill: `url(#${gradientId})`,
              },
              '& .MuiLineElement-root': {
                stroke: trendColor,
                strokeWidth: 2,
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

// Notification Dropdown Panel
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotification[];
  isLoading: boolean;
  onViewAll: () => void;
}

const formatNotificationTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, notifications, isLoading, onViewAll }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - transparent click to close */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown Panel */}
      <div className="fixed right-2 left-2 top-16 sm:absolute sm:left-auto sm:top-full sm:right-0 sm:mt-2 z-50 sm:w-80 md:w-96 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">Notifications</span>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-blue-500" />
                <p className="mt-3 text-xs text-neutral-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <HugeiconsIcon icon={Notification01Icon} size={20} className="text-neutral-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">No notifications</p>
                <p className="mt-0.5 text-xs text-neutral-400">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {notifications.slice(0, 5).map((n) => {
                  const isFromPatient = n.metadata?.direction === 'patient_to_admin';
                  return (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                        !n.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        isFromPatient
                          ? 'bg-neutral-200 dark:bg-neutral-700'
                          : 'bg-emerald-100 dark:bg-emerald-900/50'
                      }`}>
                        {isFromPatient ? (
                          <svg className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">
                            {formatNotificationTime(n.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                          {n.body}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
            <button
              onClick={onViewAll}
              className="w-full rounded-lg bg-neutral-900 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            >
              View all messages
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Separate state for totals (loaded once) and registrations (loaded per period)
  const [totals, setTotals] = useState<AdminDashboardStats['totals'] | null>(null);
  const [growth, setGrowth] = useState<AdminDashboardStats['growth'] | null>(null);
  const [registrations, setRegistrations] = useState<AdminDashboardStats['registrations']>([]);
  const [stateRegistrations, setStateRegistrations] = useState<StateRegistrationData[]>([]);
  const [genderDistribution, setGenderDistribution] = useState<GenderDistribution[]>([]);
  const [outstandingLabs, setOutstandingLabs] = useState<OutstandingLab[]>([]);
  const [isTotalsLoading, setIsTotalsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [mapPeriod, setMapPeriod] = useState<'today' | '7d' | '30d' | '1y' | 'all'>('all');

  // Notifications state
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  const userName = useMemo(() => {
    if (!user?.email) return 'Admin';
    const namePart = user.email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }, [user?.email]);

  // Load totals once on mount
  useEffect(() => {
    let cancelled = false;
    const loadTotals = async () => {
      try {
        setIsTotalsLoading(true);
        setError(null);
        const res = await getDashboardStats();
        if (!cancelled) {
          setTotals(res.data.totals);
          setGrowth(res.data.growth);
          setGenderDistribution(res.data.genderDistribution ?? []);
          setOutstandingLabs(res.data.outstandingLabs ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = typeof err === 'object' && err && 'message' in err
            ? (err as { message?: string }).message ?? 'Failed to load dashboard stats'
            : 'Failed to load dashboard stats';
          setError(msg);
        }
      } finally {
        if (!cancelled) setIsTotalsLoading(false);
      }
    };
    void loadTotals();
    return () => { cancelled = true; };
  }, []);

  // Load registrations based on period (for chart)
  useEffect(() => {
    let cancelled = false;
    const loadRegistrations = async () => {
      try {
        setIsChartLoading(true);

        const today = new Date();
        const to = today.toISOString().slice(0, 10);
        let from: string;

        if (period === 'weekly') {
          const fromDate = new Date(today);
          fromDate.setDate(fromDate.getDate() - 6);
          from = fromDate.toISOString().slice(0, 10);
        } else {
          const fromDate = new Date(today);
          fromDate.setMonth(fromDate.getMonth() - 11);
          fromDate.setDate(1);
          from = fromDate.toISOString().slice(0, 10);
        }

        const res = await getDashboardStats({ from, to });

        if (!cancelled) {
          setRegistrations(res.data.registrations);
        }
      } catch (err) {
        console.error('[Chart API] Error:', err);
      } finally {
        if (!cancelled) {
          setIsChartLoading(false);
        }
      }
    };
    void loadRegistrations();
    return () => { cancelled = true; };
  }, [period]);

  // Load state registrations based on map period
  useEffect(() => {
    let cancelled = false;
    const loadStateRegistrations = async () => {
      try {
        setIsMapLoading(true);

        const today = new Date();
        const to = today.toISOString().slice(0, 10);
        let from: string | undefined;

        if (mapPeriod === 'today') {
          from = to;
        } else if (mapPeriod === '7d') {
          const fromDate = new Date(today);
          fromDate.setDate(fromDate.getDate() - 6);
          from = fromDate.toISOString().slice(0, 10);
        } else if (mapPeriod === '30d') {
          const fromDate = new Date(today);
          fromDate.setDate(fromDate.getDate() - 29);
          from = fromDate.toISOString().slice(0, 10);
        } else if (mapPeriod === '1y') {
          const fromDate = new Date(today);
          fromDate.setFullYear(fromDate.getFullYear() - 1);
          from = fromDate.toISOString().slice(0, 10);
        }
        // For 'all', don't set from (no date filter)

        const res = await getDashboardStats(from ? { from, to } : undefined);

        if (!cancelled) {
          setStateRegistrations(res.data.stateRegistrations ?? []);
        }
      } catch (err) {
        console.error('[Map API] Error:', err);
      } finally {
        if (!cancelled) {
          setIsMapLoading(false);
        }
      }
    };
    void loadStateRegistrations();
    return () => { cancelled = true; };
  }, [mapPeriod]);

  // Load notifications
  useEffect(() => {
    if (!user) return;
    const loadNotifications = async () => {
      setIsNotificationsLoading(true);
      try {
        const res = await fetchChatNotifications();
        setNotifications(res.data ?? []);
      } catch {
        // Silent failure
      } finally {
        setIsNotificationsLoading(false);
      }
    };
    void loadNotifications();
  }, [user]);

  const chartData = useMemo(() => {
    if (period === 'weekly') {
      // Last 7 days - show daily
      return registrations.map((d) => ({
        label: new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }),
        value: d.count
      }));
    } else {
      // Aggregate by month for last 12 months
      const monthlyData = new Map<string, number>();

      registrations.forEach((d) => {
        const date = new Date(d.date + 'T00:00:00');
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(monthKey, (monthlyData.get(monthKey) ?? 0) + d.count);
      });

      // Sort by month and convert to array
      return Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, count]) => {
          const [year, month] = monthKey.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, 1);
          return {
            label: date.toLocaleDateString(undefined, { month: 'short' }),
            value: count
          };
        });
    }
  }, [registrations, period]);

  const totalRegistrations = useMemo(
    () => registrations.reduce((sum, d) => sum + d.count, 0),
    [registrations]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="space-y-6">
        {/* Top Bar with Welcome and Notifications */}
        <div className="flex items-start justify-between pt-2">
          <div className="py-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
              Hello, {userName} 👋
            </h1>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">
              Track your clinic's progress here. Here's what's happening today.
            </p>
          </div>

          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationPanelOpen(true)}
              className="relative p-2 text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              <HugeiconsIcon icon={Notification01Icon} size={24} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {/* Notification Panel Dropdown */}
            <NotificationPanel
              isOpen={isNotificationPanelOpen}
              onClose={() => setIsNotificationPanelOpen(false)}
              notifications={notifications}
              isLoading={isNotificationsLoading}
              onViewAll={() => {
                setIsNotificationPanelOpen(false);
                navigate('/chat-notifications');
              }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Stat Cards - Single Row with Dividers */}
        {isTotalsLoading ? (
          <StatCardsSkeleton />
        ) : (
          <section className="flex flex-col divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 lg:flex-row lg:divide-x lg:divide-y-0">
            <StatItem
              icon={<HugeiconsIcon icon={UserMultipleIcon} size={20} className="text-neutral-600 dark:text-neutral-400" />}
              label="Total Patients"
              value={totals?.patients ?? 0}
              trend={growth?.patients != null ? (growth.patients > 0 ? 'up' : growth.patients < 0 ? 'down' : 'neutral') : 'neutral'}
              sparklineData={generateSparklineData(growth?.patients)}
            />
            <StatItem
              icon={<HugeiconsIcon icon={Tag01Icon} size={20} className="text-neutral-600 dark:text-neutral-400" />}
              label="Categories"
              value={totals?.categories ?? 0}
              trend="neutral"
              sparklineData={generateSparklineData(null)}
            />
            <StatItem
              icon={<HugeiconsIcon icon={Package01Icon} size={20} className="text-neutral-600 dark:text-neutral-400" />}
              label="Products"
              value={totals?.products ?? 0}
              trend={growth?.products != null ? (growth.products > 0 ? 'up' : growth.products < 0 ? 'down' : 'neutral') : 'neutral'}
              sparklineData={generateSparklineData(growth?.products)}
            />
            <StatItem
              icon={<HugeiconsIcon icon={File02Icon} size={20} className="text-neutral-600 dark:text-neutral-400" />}
              label="Audit Logs"
              value={totals?.logs ?? 0}
              trend={growth?.logs != null ? (growth.logs > 0 ? 'up' : growth.logs < 0 ? 'down' : 'neutral') : 'neutral'}
              sparklineData={generateSparklineData(growth?.logs)}
            />
          </section>
        )}

        {/* Charts Row - Patient Registrations + Gender + Outstanding Labs */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {/* Performance Chart - 2/4 width on desktop */}
          <section className="xl:col-span-2 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                Patient Registrations
              </h2>
              <div className="flex items-center gap-0.5 rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
                <button
                  onClick={() => setPeriod('weekly')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    period === 'weekly'
                      ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setPeriod('monthly')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    period === 'monthly'
                      ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="mt-4">
              {/* SVG gradient definition for area chart */}
              <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#37a4ff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#37a4ff" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
              </svg>
              {isChartLoading ? (
                <LineChartSkeleton />
              ) : chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[220px] text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">No registration data</p>
                  <p className="mt-1 text-xs text-neutral-500">Data will appear once patients register.</p>
                </div>
              ) : (
                <MuiLineChart
                  height={220}
                  series={[
                    {
                      data: chartData.map(d => d.value),
                      color: '#37a4ff',
                      area: true,
                      curve: 'catmullRom',
                    },
                  ]}
                  xAxis={[
                    {
                      data: chartData.map(d => d.label),
                      scaleType: 'point',
                      tickLabelStyle: {
                        fontSize: 10,
                        fill: '#9ca3af',
                      },
                    },
                  ]}
                  yAxis={[
                    {
                      tickLabelStyle: {
                        fontSize: 10,
                        fill: '#9ca3af',
                      },
                    },
                  ]}
                  sx={{
                    '& .MuiAreaElement-root': {
                      fill: 'url(#chartGradient)',
                    },
                    '& .MuiLineElement-root': {
                      strokeWidth: 2,
                    },
                    '& .MuiChartsAxis-line': {
                      stroke: 'transparent',
                    },
                    '& .MuiChartsAxis-tick': {
                      stroke: 'transparent',
                    },
                  }}
                  slotProps={{
                    legend: { hidden: true },
                  }}
                />
              )}
            </div>
          </section>

          {/* Gender Distribution - 1/4 width on desktop */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Gender Distribution
            </h2>
            <div className="mt-4 flex items-center justify-center">
              {isTotalsLoading ? (
                <PieChartSkeleton />
              ) : genderDistribution.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[180px] text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                    <HugeiconsIcon icon={UserMultipleIcon} size={20} />
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">No data available</p>
                </div>
              ) : (
                <PieChart
                  series={[
                    {
                      data: genderDistribution.map((g, i) => ({
                        id: i,
                        value: g.count,
                        label: g.gender,
                        color: g.gender.toLowerCase() === 'male' ? '#ff7e67' :
                               g.gender.toLowerCase() === 'female' ? '#359fff' : '#9ca3af',
                      })),
                      innerRadius: 40,
                      outerRadius: 70,
                      paddingAngle: 2,
                      cornerRadius: 4,
                      highlightScope: { faded: 'global', highlighted: 'item' },
                    },
                  ]}
                  width={180}
                  height={180}
                  slotProps={{
                    legend: { hidden: true },
                  }}
                  sx={{
                    '& .MuiChartsLegend-root': { display: 'none' },
                  }}
                />
              )}
            </div>
            {/* Legend */}
            {genderDistribution.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
                {genderDistribution.map((g) => (
                  <div key={g.gender} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: g.gender.toLowerCase() === 'male' ? '#ff7e67' :
                                        g.gender.toLowerCase() === 'female' ? '#ff7e67' : '#9ca3af',
                      }}
                    />
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {g.gender} ({g.count})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Outstanding Labs - 1/4 width on desktop */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Outstanding Labs
            </h2>
            <div className="mt-4">
              {isTotalsLoading ? (
                <LabsListSkeleton />
              ) : outstandingLabs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[180px] text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="mt-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">All caught up!</p>
                  <p className="text-[10px] text-neutral-400">No pending lab results</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {outstandingLabs.slice(0, 5).map((lab) => (
                    <div
                      key={lab.patientId}
                      className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                          {lab.patientName}
                        </p>
                        <p className="truncate text-[10px] text-neutral-500">
                          {new Date(lab.orderedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="ml-2 shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Pending
                      </span>
                    </div>
                  ))}
                  {outstandingLabs.length > 5 && (
                    <p className="pt-1 text-center text-xs text-neutral-400">
                      +{outstandingLabs.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Members by State Map */}
        <div className="mt-6">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                Members by State
              </h2>
              <div className="flex items-center gap-0.5 rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
                {(['today', '7d', '30d', '1y', 'all'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setMapPeriod(p)}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      mapPeriod === p
                        ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                  >
                    {p === 'today' ? 'Today' : p === '7d' ? '7D' : p === '30d' ? '30D' : p === '1y' ? '1Y' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Map - always show, with empty data while loading */}
                <div className="flex-1 min-w-0">
                  <USMapChart data={isMapLoading ? [] : stateRegistrations} />
                </div>
                {/* Top States List */}
                <div className="w-full lg:w-48 shrink-0 border-t lg:border-t-0 lg:border-l border-neutral-100 dark:border-neutral-800 pt-4 lg:pt-0 lg:pl-6">
                  <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">Top States</h3>
                  {isMapLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                          <Skeleton className="h-4 w-6" />
                        </div>
                      ))}
                    </div>
                  ) : stateRegistrations.length > 0 ? (
                    <div className="space-y-2">
                      {stateRegistrations.slice(0, 8).map((item, index) => (
                        <div
                          key={item.state}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-neutral-100 text-[10px] font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                              {item.state}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {item.count}
                          </span>
                        </div>
                      ))}
                      {stateRegistrations.length > 8 && (
                        <p className="pt-1 text-xs text-neutral-400 dark:text-neutral-500">
                          +{stateRegistrations.length - 8} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <svg className="h-8 w-8 text-neutral-200 dark:text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="mt-2 text-xs font-medium text-neutral-400 dark:text-neutral-500">No data</p>
                      <p className="text-[10px] text-neutral-300 dark:text-neutral-600 mt-0.5">
                        {mapPeriod === 'today' ? 'for today' : mapPeriod === 'all' ? '' : `last ${mapPeriod}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};
