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
                      <stop offset="0%" stopColor="#37a4ff" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#4ac0ff" stopOpacity={0.05} />
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
                    stroke="#37a4ff"
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
