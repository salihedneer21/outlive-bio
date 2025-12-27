import React, { useEffect, useMemo, useState } from 'react';
import type { AdminDashboardStats } from '@outlive/shared';
import { getDashboardStats } from '@/api/dashboard';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

const StatCardSkeleton: React.FC = () => (
  <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start justify-between">
      <Skeleton className="h-9 w-9 rounded-lg" />
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  </div>
);

const ChartSkeleton: React.FC = () => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="space-y-1">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-3 w-48" />
    </div>
    <div className="mt-6 space-y-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-2.5 flex-1 rounded-full" />
          <Skeleton className="h-3 w-6" />
        </div>
      ))}
    </div>
  </div>
);

const QuickStatsSkeleton: React.FC = () => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="space-y-1">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-40" />
    </div>
    <div className="mt-5 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  </div>
);

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'cyan' | 'violet' | 'amber' | 'emerald';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colorClasses = {
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-2.5 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900 sm:text-3xl dark:text-neutral-50">
          {value.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await getDashboardStats();
        if (!cancelled) {
          setStats(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            typeof err === 'object' && err && 'message' in err
              ? (err as { message?: string }).message ?? 'Failed to load dashboard stats'
              : 'Failed to load dashboard stats';
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const weeklyRegistrations = stats?.weeklyRegistrations ?? [];

  const maxRegistrations = useMemo(
    () =>
      weeklyRegistrations.length > 0
        ? Math.max(...weeklyRegistrations.map((d) => d.count))
        : 1,
    [weeklyRegistrations]
  );

  const totalWeeklyRegistrations = useMemo(
    () => weeklyRegistrations.reduce((sum, d) => sum + d.count, 0),
    [weeklyRegistrations]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-50">
          Dashboard
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Overview of your clinic's key metrics and activity.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              label="Total patients"
              value={stats?.totals.patients ?? 0}
              color="cyan"
            />
            <StatCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
              label="Categories"
              value={stats?.totals.categories ?? 0}
              color="violet"
            />
            <StatCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              label="Products"
              value={stats?.totals.products ?? 0}
              color="amber"
            />
            <StatCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              label="Audit logs"
              value={stats?.totals.logs ?? 0}
              color="emerald"
            />
          </>
        )}
      </section>

      {/* Charts Section */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        {/* Weekly Registrations Chart */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Weekly registrations
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  New patient sign-ups over the past 7 days
                </p>
              </div>
              {totalWeeklyRegistrations > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {totalWeeklyRegistrations} this week
                </div>
              )}
            </div>

            {weeklyRegistrations.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  No registration data
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                  Data will appear here once patients start registering.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {weeklyRegistrations.map((day) => {
                  const percentage = maxRegistrations > 0 ? (day.count / maxRegistrations) * 100 : 0;
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="w-10 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                        {new Date(day.date).toLocaleDateString(undefined, {
                          weekday: 'short'
                        })}
                      </span>
                      <div className="flex-1">
                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500 dark:from-cyan-600 dark:to-cyan-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-8 text-right text-xs font-semibold tabular-nums text-neutral-700 dark:text-neutral-200">
                        {day.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick Stats / Summary */}
        {isLoading ? (
          <QuickStatsSkeleton />
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Quick stats
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Key metrics at a glance
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      Patients
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Total registered
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                  {stats?.totals.patients.toLocaleString() ?? 0}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      Products
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      In catalog
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                  {stats?.totals.products.toLocaleString() ?? 0}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      Categories
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Product groups
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                  {stats?.totals.categories.toLocaleString() ?? 0}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
