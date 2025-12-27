import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdminImpersonationLog } from '@outlive/shared';
import { listImpersonationLogs } from '@/api/logs';
import { usePreferences } from '@/preferences/PreferencesContext';

interface PageCache {
  [page: number]: AdminImpersonationLog[];
}

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

const TableSkeletonRow: React.FC = () => (
  <tr className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800">
    <td className="px-3 py-3 sm:px-4">
      <Skeleton className="h-4 w-32" />
    </td>
    <td className="px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </td>
    <td className="px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    </td>
    <td className="hidden px-3 py-3 lg:table-cell sm:px-4">
      <Skeleton className="h-3 w-48" />
    </td>
  </tr>
);

const CardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start justify-between gap-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  </div>
);

const LogCard: React.FC<{ log: AdminImpersonationLog }> = ({ log }) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start justify-between gap-3">
      <div className="font-medium text-neutral-900 dark:text-neutral-50">
        {log.patient.name ?? log.patient.email ?? log.patient.id.slice(0, 8)}
      </div>
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        {new Date(log.createdAt).toLocaleString()}
      </div>
    </div>
    <div className="mt-3 space-y-1.5 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-neutral-500 dark:text-neutral-400">Admin:</span>
        <span className="font-medium text-neutral-700 dark:text-neutral-200">
          {log.actor.email ?? log.actor.id.slice(0, 8)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-neutral-500 dark:text-neutral-400">Patient:</span>
        <span className="text-neutral-700 dark:text-neutral-200">
          {log.patient.email ?? 'No email'}
        </span>
      </div>
      {log.userAgent && (
        <div className="truncate text-[11px] text-neutral-400 dark:text-neutral-500">
          {log.userAgent}
        </div>
      )}
    </div>
  </div>
);

export const LogsPage: React.FC = () => {
  const { pageSize } = usePreferences();
  const [logs, setLogs] = useState<AdminImpersonationLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for pages - reset when pageSize changes
  const cacheRef = useRef<PageCache>({});
  const cachedPageSizeRef = useRef(pageSize);

  // Reset cache when pageSize changes
  useEffect(() => {
    if (cachedPageSizeRef.current !== pageSize) {
      cacheRef.current = {};
      cachedPageSizeRef.current = pageSize;
      setPage(1);
    }
  }, [pageSize]);

  const fetchPage = useCallback(async (targetPage: number, targetPageSize: number) => {
    // Check cache first
    if (cacheRef.current[targetPage]) {
      setLogs(cacheRef.current[targetPage]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await listImpersonationLogs({ page: targetPage, pageSize: targetPageSize });

      // Store in cache
      cacheRef.current[targetPage] = res.data.logs;

      setLogs(res.data.logs);
      setTotalPages(res.data.pagination.totalPages || 1);
      setTotalCount(res.data.pagination.total || 0);
    } catch (err) {
      const msg =
        typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Failed to load logs'
          : 'Failed to load logs';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage(page, pageSize);
  }, [page, pageSize, fetchPage]);

  const hasPrev = useMemo(() => page > 1, [page]);
  const hasNext = useMemo(() => page < totalPages, [page, totalPages]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-50">
            Logs
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Central audit log for admin actions.
          </p>
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          {totalCount > 0 ? `${totalCount} total logs` : ''}
        </div>
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

      {/* Mobile View */}
      <div className="space-y-3 sm:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => <CardSkeleton key={index} />)
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            No logs found.
          </div>
        ) : (
          logs.map((log) => <LogCard key={log.id} log={log} />)
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm sm:block dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Impersonation logins
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
              <tr>
                <th className="whitespace-nowrap px-3 py-3 text-left sm:px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Time
                  </span>
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left sm:px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Admin
                  </span>
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left sm:px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Patient
                  </span>
                </th>
                <th className="hidden whitespace-nowrap px-3 py-3 text-left lg:table-cell sm:px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    User agent
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => <TableSkeletonRow key={index} />)
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No impersonation logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="whitespace-nowrap px-3 py-3 text-neutral-700 sm:px-4 dark:text-neutral-200">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900 dark:text-neutral-50">
                          {log.actor.email ?? log.actor.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {log.actor.role ?? 'unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900 dark:text-neutral-50">
                          {log.patient.name ?? log.patient.email ?? log.patient.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {log.patient.email ?? 'No email'}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 lg:table-cell sm:px-4">
                      <div className="max-w-xs truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {log.userAgent ?? '—'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrev || isLoading}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => (hasNext ? p + 1 : p))}
              disabled={!hasNext || isLoading}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Pagination */}
      <div className="flex items-center justify-between sm:hidden">
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!hasPrev || isLoading}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => (hasNext ? p + 1 : p))}
            disabled={!hasNext || isLoading}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
