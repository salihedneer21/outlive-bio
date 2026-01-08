import React, { useEffect, useMemo, useState } from 'react';
import type { AdminDashboardStats } from '@outlive/shared';
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
  NotificationSquareIcon,
  Cancel01Icon
} from '@hugeicons/core-free-icons';

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

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  change?: { value: string; positive: boolean };
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, change }) => {
  return (
    <div className="flex flex-1 items-center gap-4 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        {icon}
      </div>
      <div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold tabular-nums text-neutral-900 dark:text-white">
            {value.toLocaleString()}
          </span>
          {change && (
            <span
              className={`flex items-center gap-0.5 text-xs font-medium ${
                change.positive ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              <svg
                className={`h-3 w-3 ${change.positive ? '' : 'rotate-180'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {change.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple line chart component
interface LineChartProps {
  data: { label: string; value: number }[];
  color?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, color = '#3b82f6' }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = 0;
  const range = maxValue - minValue || 1;

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 600;
  const height = 200;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight,
    ...d
  }));

  // Determine how many labels to skip for readability
  const labelStep = data.length > 15 ? Math.ceil(data.length / 8) : 1;

  const createSmoothPath = () => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const createAreaPath = () => {
    const linePath = createSmoothPath();
    if (!linePath) return '';
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    return `${linePath} L ${lastPoint.x} ${padding.top + chartHeight} L ${firstPoint.x} ${padding.top + chartHeight} Z`;
  };

  const yLabels = [0, Math.round(maxValue / 2), maxValue];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const scaleX = width / rect.width;
    let closestIndex = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - x * scaleX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });
    if (closestDist < 50) {
      setHoveredIndex(closestIndex);
      setMousePos({ x: points[closestIndex].x, y: points[closestIndex].y });
    } else {
      setHoveredIndex(null);
    }
  };

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yLabels.map((val, i) => {
          const y = padding.top + chartHeight - (i / 2) * chartHeight;
          return (
            <g key={val}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-neutral-400 text-[10px]">{val}</text>
            </g>
          );
        })}
        {/* Show labels at intervals for readability */}
        {points.map((p, i) => (
          (i % labelStep === 0 || i === points.length - 1) && (
            <text key={i} x={p.x} y={height - 10} textAnchor="middle" className="fill-neutral-400 text-[10px]">{p.label}</text>
          )
        ))}
        <path d={createAreaPath()} fill="url(#chartGradient)" />
        <path d={createSmoothPath()} fill="none" stroke={color} strokeWidth="2" />
        {/* Show dots only on hover when many points */}
        {points.map((p, i) => (
          (data.length <= 10 || hoveredIndex === i) && (
            <circle key={i} cx={p.x} cy={p.y} r={hoveredIndex === i ? 6 : 4} fill="white" stroke={color} strokeWidth="2" className="transition-all duration-150" />
          )
        ))}
        {hoveredIndex !== null && (
          <line x1={mousePos.x} y1={padding.top} x2={mousePos.x} y2={padding.top + chartHeight} stroke={color} strokeOpacity="0.3" strokeDasharray="4 4" />
        )}
      </svg>
      {hoveredIndex !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-neutral-900"
          style={{ left: `${(mousePos.x / width) * 100}%`, top: `${(mousePos.y / height) * 100 - 15}%`, transform: 'translate(-50%, -100%)' }}
        >
          <div className="font-medium">{data[hoveredIndex].label}</div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span>{data[hoveredIndex].value} registrations</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Notification Panel that slides from right
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
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel Container with margin */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md p-2.5 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel with border radius */}
        <div className="relative flex h-full flex-col overflow-hidden rounded-[22px] bg-white shadow-2xl dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Outlive" className="h-5 dark:invert" />
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Notifications</span>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <img src="/logo.svg" alt="Loading" className="h-8 animate-pulse dark:invert" />
                <p className="mt-4 text-sm text-neutral-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <HugeiconsIcon icon={NotificationSquareIcon} size={28} className="text-neutral-400" />
                </div>
                <p className="mt-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">No notifications</p>
                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">You're all caught up!</p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => {
                  const isFromPatient = n.metadata?.direction === 'patient_to_admin';
                  return (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-5 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                        !n.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                        isFromPatient
                          ? 'bg-neutral-200 dark:bg-neutral-700'
                          : 'bg-emerald-100 dark:bg-emerald-900/50'
                      }`}>
                        {isFromPatient ? (
                          <svg className="h-4 w-4 text-neutral-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900 dark:text-white">
                            {n.title}
                          </span>
                          <span className="text-xs text-neutral-400 dark:text-neutral-500">
                            {formatNotificationTime(n.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                          {n.body}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!n.read && (
                        <div className="flex-shrink-0 pt-1">
                          <span className="block h-2 w-2 rounded-full bg-blue-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <button
              onClick={onViewAll}
              className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
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
  const [registrations, setRegistrations] = useState<AdminDashboardStats['registrations']>([]);
  const [isTotalsLoading, setIsTotalsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

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

  // Load registrations based on period
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

        console.log(`[Chart API] Period: ${period}, From: ${from}, To: ${to}`);
        const res = await getDashboardStats({ from, to });
        console.log(`[Chart API] Response:`, res.data.registrations);

        if (!cancelled) {
          setRegistrations(res.data.registrations);
        }
      } catch (err) {
        console.error('[Chart API] Error:', err);
      } finally {
        if (!cancelled) setIsChartLoading(false);
      }
    };
    void loadRegistrations();
    return () => { cancelled = true; };
  }, [period]);

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
          <button
            onClick={() => setIsNotificationPanelOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <HugeiconsIcon icon={NotificationSquareIcon} size={22} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
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
              icon={<HugeiconsIcon icon={UserMultipleIcon} size={22} className="text-neutral-600 dark:text-neutral-400" />}
              label="Total Patients"
              value={totals?.patients ?? 0}
            />
            <StatItem
              icon={<HugeiconsIcon icon={Tag01Icon} size={22} className="text-neutral-600 dark:text-neutral-400" />}
              label="Categories"
              value={totals?.categories ?? 0}
            />
            <StatItem
              icon={<HugeiconsIcon icon={Package01Icon} size={22} className="text-neutral-600 dark:text-neutral-400" />}
              label="Products"
              value={totals?.products ?? 0}
            />
            <StatItem
              icon={<HugeiconsIcon icon={File02Icon} size={22} className="text-neutral-600 dark:text-neutral-400" />}
              label="Audit Logs"
              value={totals?.logs ?? 0}
            />
          </section>
        )}

        {/* Performance Chart */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Patient Registrations
            </h2>
            <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
              <button
                onClick={() => setPeriod('weekly')}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  period === 'weekly'
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPeriod('monthly')}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  period === 'monthly'
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="mt-6">
            {isChartLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-blue-500" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">No registration data</p>
                <p className="mt-1 text-sm text-neutral-500">Data will appear here once patients start registering.</p>
              </div>
            ) : (
              <LineChart data={chartData} color="#3b82f6" />
            )}
          </div>
        </section>
      </div>

      {/* Notification Panel */}
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
    </>
  );
};
