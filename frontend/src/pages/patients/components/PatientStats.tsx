import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getPatientStats } from '@/api/patients';
import type { AdminPatientsStats } from '@outlive/shared';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{value}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
        )}
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const StatCardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-10 w-10 rounded-lg" />
    </div>
  </div>
);

const INTAKE_COLORS = {
  completed: '#10b981',
  in_progress: '#f59e0b',
  not_started: '#6b7280'
};

const GENDER_COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#6b7280'];

export const PatientStats: React.FC = () => {
  const [stats, setStats] = useState<AdminPatientsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getPatientStats();
        setStats(response.data);
      } catch (err) {
        const message =
          typeof err === 'object' && err && 'message' in err
            ? (err as { message?: string }).message ?? 'Failed to load stats'
            : 'Failed to load stats';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStats();
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </div>
    );
  }

  const intakePieData = stats
    ? [
        { name: 'Completed', value: stats.intakeStatusCounts.completed, color: INTAKE_COLORS.completed },
        { name: 'In Progress', value: stats.intakeStatusCounts.in_progress, color: INTAKE_COLORS.in_progress },
        { name: 'Not Started', value: stats.intakeStatusCounts.not_started, color: INTAKE_COLORS.not_started }
      ]
    : [];

  const genderPieData = stats
    ? Object.entries(stats.genderCounts).map(([name, value], index) => ({
        name: name === 'null' ? 'Unknown' : name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: GENDER_COLORS[index % GENDER_COLORS.length]
      }))
    : [];

  const chartData = stats?.dailyRegistrations.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: point.count
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Total Patients"
              value={stats.totalPatients.toLocaleString()}
              subtitle="All registered patients"
              icon={
                <svg className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              color="bg-cyan-100 dark:bg-cyan-900/30"
            />
            <StatCard
              title="Completed Intake"
              value={stats.intakeStatusCounts.completed.toLocaleString()}
              subtitle={`${stats.totalPatients > 0 ? Math.round((stats.intakeStatusCounts.completed / stats.totalPatients) * 100) : 0}% of total`}
              icon={
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="bg-emerald-100 dark:bg-emerald-900/30"
            />
            <StatCard
              title="In Progress"
              value={stats.intakeStatusCounts.in_progress.toLocaleString()}
              subtitle={`${stats.totalPatients > 0 ? Math.round((stats.intakeStatusCounts.in_progress / stats.totalPatients) * 100) : 0}% of total`}
              icon={
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="bg-amber-100 dark:bg-amber-900/30"
            />
            <StatCard
              title="Not Started"
              value={stats.intakeStatusCounts.not_started.toLocaleString()}
              subtitle={`${stats.totalPatients > 0 ? Math.round((stats.intakeStatusCounts.not_started / stats.totalPatients) * 100) : 0}% of total`}
              icon={
                <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="bg-neutral-100 dark:bg-neutral-800"
            />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Registrations Chart */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 flex flex-col">
          <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Patient Registrations
          </h3>
          {isLoading ? (
            <Skeleton className="flex-1 mx-4 mb-4 min-h-[200px]" />
          ) : chartData.length > 0 ? (
            <div className="flex-1 min-h-[200px] px-2 pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-neutral-800" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, rgba(255, 255, 255, 0.95))',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--tooltip-text, #171717)'
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: '4px', color: 'var(--tooltip-text, #171717)' }}
                    wrapperClassName="chart-tooltip"
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    name="Registrations"
                    baseValue={0}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-1 min-h-[200px] items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
              No registration data available
            </div>
          )}
        </div>

        {/* Pie Charts */}
        <div className="space-y-6">
          {/* Intake Status Pie */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Intake Status
            </h3>
            {isLoading ? (
              <Skeleton className="mx-auto h-32 w-32 rounded-full" />
            ) : (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={intakePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {intakePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--tooltip-bg, rgba(255, 255, 255, 0.95))',
                        border: '1px solid var(--tooltip-border, #e5e7eb)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--tooltip-text, #171717)'
                      }}
                      itemStyle={{
                        color: 'var(--tooltip-text, #171717)'
                      }}
                      labelStyle={{
                        color: 'var(--tooltip-text, #171717)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {intakePieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-neutral-600 dark:text-neutral-400">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gender Distribution Pie */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Gender Distribution
            </h3>
            {isLoading ? (
              <Skeleton className="mx-auto h-32 w-32 rounded-full" />
            ) : genderPieData.length > 0 ? (
              <>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {genderPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--tooltip-bg, rgba(255, 255, 255, 0.95))',
                          border: '1px solid var(--tooltip-border, #e5e7eb)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'var(--tooltip-text, #171717)'
                        }}
                        itemStyle={{
                          color: 'var(--tooltip-text, #171717)'
                        }}
                        labelStyle={{
                          color: 'var(--tooltip-text, #171717)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {genderPieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-neutral-600 dark:text-neutral-400">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
