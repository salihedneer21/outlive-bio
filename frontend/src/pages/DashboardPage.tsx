import React from 'react';

const statCards = [
  {
    label: 'Total patients',
    value: '1,248',
    helper: '+32 this week',
    trend: 'up',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    label: 'New intakes in review',
    value: '18',
    helper: 'Avg. 2.3 days to complete',
    trend: 'neutral',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )
  },
  {
    label: 'Completed intakes',
    value: '874',
    helper: 'Last 30 days',
    trend: 'up',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

const weeklyRegistrations = [
  { label: 'Mon', value: 8 },
  { label: 'Tue', value: 12 },
  { label: 'Wed', value: 9 },
  { label: 'Thu', value: 15 },
  { label: 'Fri', value: 11 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 4 }
];

const funnelSteps = [
  { label: 'Started intake', value: 312, percentage: 100 },
  { label: 'Documents uploaded', value: 241, percentage: 77 },
  { label: 'Medical history completed', value: 197, percentage: 63 },
  { label: 'Consents signed', value: 182, percentage: 58 }
];

export const DashboardPage: React.FC = () => {
  const maxRegistrations =
    weeklyRegistrations.length > 0
      ? Math.max(...weeklyRegistrations.map((d) => d.value))
      : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-50">
          Dashboard
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          High-level snapshot of patient volume and intake completion.
        </p>
      </div>

      {/* Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-neutral-100 p-2 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                {card.icon}
              </div>
              {card.trend === 'up' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Up
                </span>
              )}
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {card.label}
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900 sm:text-3xl dark:text-neutral-50">
                {card.value}
              </div>
              <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{card.helper}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Charts Section */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        {/* Weekly Registrations Chart */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Weekly registrations
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                New patient sign-ups this week
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              +18% vs. last week
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {weeklyRegistrations.map((day) => (
              <div key={day.label} className="flex items-center gap-3">
                <span className="w-8 text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  {day.label}
                </span>
                <div className="flex-1">
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500 dark:from-cyan-600 dark:to-cyan-500"
                      style={{ width: `${(day.value / maxRegistrations) * 100 || 0}%` }}
                    />
                  </div>
                </div>
                <span className="w-8 text-right text-[11px] font-semibold tabular-nums text-neutral-700 dark:text-neutral-200">
                  {day.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Intake Funnel */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Intake funnel
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Patients at each intake step
          </p>

          <dl className="mt-5 space-y-4">
            {funnelSteps.map((step, index) => (
              <div key={step.label} className="relative">
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {index + 1}
                    </span>
                    {step.label}
                  </dt>
                  <dd className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                      {step.value}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                      ({step.percentage}%)
                    </span>
                  </dd>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 dark:from-emerald-600 dark:to-emerald-500"
                    style={{ width: `${step.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Sample Data Notice */}
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        All dashboard values are sample data for demonstration purposes.
      </div>
    </div>
  );
};
