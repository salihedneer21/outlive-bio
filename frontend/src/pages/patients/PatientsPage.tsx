import React, { useEffect, useState } from 'react';
import { PatientList, PatientStats } from './components';
import { getPatientStats } from '@/api/patients';
import type { AdminPatientsStats } from '@outlive/shared';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserMultipleIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  MoreHorizontalCircle01Icon
} from '@hugeicons/core-free-icons';

type Tab = 'list' | 'stats';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle?: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, subtitle }) => (
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
        {subtitle && (
          <span className="text-xs text-neutral-400 dark:text-neutral-500">{subtitle}</span>
        )}
      </div>
    </div>
  </div>
);

const StatCardsSkeleton: React.FC = () => (
  <div className="flex items-center divide-x divide-neutral-200 rounded-2xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex flex-1 items-center gap-4 p-5">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    ))}
  </div>
);

export const PatientsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [stats, setStats] = useState<AdminPatientsStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Load stats once on mount
  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        setIsStatsLoading(true);
        const response = await getPatientStats();
        if (!cancelled) setStats(response.data);
      } catch {
        // Silent failure - stats are supplementary
      } finally {
        if (!cancelled) setIsStatsLoading(false);
      }
    };
    void loadStats();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-50">
            Patients
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Overview of all patients in the system.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'list'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'stats'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Statistics</span>
          </button>
        </div>
      </div>

      {/* Stat Cards - Only show on Statistics tab */}
      {activeTab === 'stats' && (
        isStatsLoading ? (
          <StatCardsSkeleton />
        ) : stats ? (
          <section className="flex flex-col divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 lg:flex-row lg:divide-x lg:divide-y-0">
            <StatItem
              icon={<HugeiconsIcon icon={UserMultipleIcon} size={22} className="text-neutral-600 dark:text-neutral-400" />}
              label="Total Patients"
              value={stats.totalPatients}
            />
            <StatItem
              icon={<HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} className="text-emerald-600 dark:text-emerald-400" />}
              label="Completed Intake"
              value={stats.intakeStatusCounts.completed}
              subtitle={stats.totalPatients > 0 ? `${Math.round((stats.intakeStatusCounts.completed / stats.totalPatients) * 100)}%` : undefined}
            />
            <StatItem
              icon={<HugeiconsIcon icon={Clock01Icon} size={22} className="text-amber-600 dark:text-amber-400" />}
              label="In Progress"
              value={stats.intakeStatusCounts.in_progress}
              subtitle={stats.totalPatients > 0 ? `${Math.round((stats.intakeStatusCounts.in_progress / stats.totalPatients) * 100)}%` : undefined}
            />
            <StatItem
              icon={<HugeiconsIcon icon={MoreHorizontalCircle01Icon} size={22} className="text-neutral-500 dark:text-neutral-400" />}
              label="Not Started"
              value={stats.intakeStatusCounts.not_started}
              subtitle={stats.totalPatients > 0 ? `${Math.round((stats.intakeStatusCounts.not_started / stats.totalPatients) * 100)}%` : undefined}
            />
          </section>
        ) : null
      )}

      {/* Content - both tabs stay mounted to preserve state */}
      <div className={activeTab === 'list' ? 'block' : 'hidden'}>
        <PatientList />
      </div>
      <div className={activeTab === 'stats' ? 'block' : 'hidden'}>
        <PatientStats />
      </div>
    </div>
  );
};
