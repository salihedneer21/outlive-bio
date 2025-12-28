import React, { useEffect, useState } from 'react';
import { fetchAllNotifications, type AdminNotification } from '@/api/chat';

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

const TableSkeletonRow: React.FC = () => (
  <tr className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800">
    <td className="px-4 py-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </td>
    <td className="hidden px-4 py-4 md:table-cell">
      <Skeleton className="h-5 w-20 rounded-full" />
    </td>
    <td className="hidden px-4 py-4 lg:table-cell">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="px-4 py-4">
      <Skeleton className="h-4 w-20" />
    </td>
  </tr>
);

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
      <svg className="h-7 w-7 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.938L3 20l1.352-3.157A7.829 7.829 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </div>
    <p className="mt-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
      No notifications yet
    </p>
    <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
      When patients send messages or you communicate with them, notifications will appear here.
    </p>
  </div>
);

export const ChatNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 25;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAllNotifications(page, PAGE_SIZE);
        setNotifications(res.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-50">
          Chat Notifications
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          View all message notifications from patient conversations.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Failed to load notifications
            </p>
            <p className="mt-0.5 text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setPage(page)}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {/* Table Header Label */}
        <div className="border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            All notifications
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Message
                  </span>
                </th>
                <th className="hidden px-4 py-3 text-left md:table-cell">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Direction
                  </span>
                </th>
                <th className="hidden px-4 py-3 text-left lg:table-cell">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Patient
                  </span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Time
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => <TableSkeletonRow key={index} />)
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState />
                  </td>
                </tr>
              ) : (
                notifications.map((n) => {
                  const isFromPatient = n.metadata?.direction === 'patient_to_admin';
                  const messagePreview = typeof n.metadata?.messagePreview === 'string'
                    ? n.metadata.messagePreview
                    : n.body;

                  return (
                    <tr
                      key={n.id}
                      className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                            isFromPatient
                              ? 'bg-neutral-100 dark:bg-neutral-800'
                              : 'bg-neutral-900 dark:bg-neutral-100'
                          }`}>
                            <svg
                              className={`h-4 w-4 ${
                                isFromPatient
                                  ? 'text-neutral-500 dark:text-neutral-400'
                                  : 'text-white dark:text-neutral-900'
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              {isFromPatient ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              )}
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                              {n.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
                              {messagePreview}
                            </p>
                            {/* Mobile-only badges */}
                            <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                isFromPatient
                                  ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              }`}>
                                {isFromPatient ? 'From patient' : 'Sent'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-4 md:table-cell">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          isFromPatient
                            ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}>
                          {isFromPatient ? (
                            <>
                              <svg className="mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                              Received
                            </>
                          ) : (
                            <>
                              <svg className="mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                              Sent
                            </>
                          )}
                        </span>
                      </td>
                      <td className="hidden px-4 py-4 lg:table-cell">
                        <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                          {(n.metadata?.patientId as string | undefined)?.slice(0, 8) ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {formatDate(n.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && notifications.length > 0 && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Page {page}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1 || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <button
                type="button"
                disabled={notifications.length < PAGE_SIZE || loading}
                onClick={() => setPage((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                Next
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
