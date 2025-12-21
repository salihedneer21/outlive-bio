import React, { useCallback, useEffect, useRef, useState } from 'react';
import { listPatients } from '@/api/patients';
import { usePreferences } from '@/preferences/PreferencesContext';
import type { AdminPatient, AdminPatientsResult } from '@outlive/shared';

type SortColumn = 'name' | 'registrationDate' | 'intakeStatus' | null;
type SortDirection = 'asc' | 'desc';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

const TableSkeletonRow: React.FC = () => (
  <tr className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800">
    <td className="px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-28 sm:w-36" />
        <Skeleton className="h-3 w-36 sm:w-44" />
      </div>
    </td>
    <td className="hidden px-3 py-3 sm:table-cell sm:px-4">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="hidden px-3 py-3 md:table-cell sm:px-4">
      <Skeleton className="h-4 w-20" />
    </td>
    <td className="hidden px-3 py-3 lg:table-cell sm:px-4">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="px-3 py-3 sm:px-4">
      <Skeleton className="h-6 w-20 rounded-full sm:w-24" />
    </td>
    <td className="hidden px-3 py-3 xl:table-cell sm:px-4">
      <Skeleton className="h-4 w-10" />
    </td>
  </tr>
);

const CardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </div>
);

const PatientCard: React.FC<{ patient: AdminPatient }> = ({ patient }) => {
  const fullName = patient.name.full || 'N/A';
  const email = patient.email || 'No email';
  const intakeStatus = patient.intake.status;

  const intakeClasses =
    intakeStatus === 'completed'
      ? 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:bg-emerald-950'
      : intakeStatus === 'in_progress'
      ? 'border-amber-500 text-amber-700 bg-amber-50 dark:border-amber-500 dark:text-amber-300 dark:bg-amber-950'
      : 'border-neutral-300 text-neutral-700 bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:bg-neutral-800';

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-neutral-900 dark:text-neutral-50">
            {fullName}
          </div>
          <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {email}
          </div>
        </div>
        <span
          className={`inline-flex flex-shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${intakeClasses}`}
        >
          {patient.intake.step ? patient.intake.step.replace(/_/g, ' ') : 'Not started'}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-neutral-500 dark:text-neutral-400">Phone</div>
          <div className="font-medium text-neutral-900 dark:text-neutral-100">
            {patient.phone || 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-neutral-500 dark:text-neutral-400">Registered</div>
          <div className="font-medium text-neutral-900 dark:text-neutral-100">
            {patient.registrationDate
              ? new Date(patient.registrationDate).toLocaleDateString()
              : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PatientList: React.FC = () => {
  const { pageSize } = usePreferences();
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('registrationDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, AdminPatientsResult>>(new Map());

  const sortPatients = useCallback(
    (items: AdminPatient[]): AdminPatient[] => {
      if (!sortColumn) return items;

      const sorted = [...items];

      sorted.sort((a, b) => {
        const directionFactor = sortDirection === 'asc' ? 1 : -1;

        if (sortColumn === 'name') {
          const nameA = a.name.full ?? a.email ?? '';
          const nameB = b.name.full ?? b.email ?? '';
          return nameA.localeCompare(nameB) * directionFactor;
        }

        if (sortColumn === 'intakeStatus') {
          const getStatusRank = (status: AdminPatient['intake']['status']): number => {
            if (status === 'completed') return 3;
            if (status === 'in_progress') return 2;
            if (status === 'not_started') return 1;
            return 0;
          };

          const statusA = getStatusRank(a.intake.status);
          const statusB = getStatusRank(b.intake.status);
          return (statusA - statusB) * directionFactor;
        }

        const dateA = a.registrationDate ? new Date(a.registrationDate).getTime() : 0;
        const dateB = b.registrationDate ? new Date(b.registrationDate).getTime() : 0;
        return (dateA - dateB) * directionFactor;
      });

      return sorted;
    },
    [sortColumn, sortDirection]
  );

  const fetchPatients = useCallback(
    async (pageToLoad: number, searchValue: string) => {
      const cacheKey = `${pageToLoad}:${pageSize}:${searchValue.trim()}:${sortColumn ?? 'none'}:${sortDirection}`;
      const cached = cacheRef.current.get(cacheKey);

      if (cached) {
        setPatients(sortPatients(cached.patients));
        setTotalPages(cached.pagination.totalPages || 1);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await listPatients({
          page: pageToLoad,
          pageSize,
          search: searchValue || undefined,
          sortBy: sortColumn === 'registrationDate' || !sortColumn ? 'created_at' : undefined,
          sortOrder: sortDirection
        });

        cacheRef.current.set(cacheKey, response.data);
        setPatients(sortPatients(response.data.patients));
        setTotalPages(response.data.pagination.totalPages || 1);
      } catch (err) {
        const message =
          typeof err === 'object' && err && 'message' in err
            ? (err as { message?: string }).message ?? 'Failed to load patients'
            : 'Failed to load patients';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, sortColumn, sortDirection, sortPatients]
  );

  useEffect(() => {
    void fetchPatients(page, searchQuery);
  }, [page, searchQuery, fetchPatients]);

  useEffect(() => {
    if (!searchInput.trim()) {
      if (searchQuery) {
        const timeoutId = window.setTimeout(() => {
          setPage(1);
          setSearchQuery('');
        }, 400);
        return () => window.clearTimeout(timeoutId);
      }
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, searchQuery]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleHeaderSort = (column: SortColumn) => {
    if (!column) return;

    setPage(1);
    setSortColumn((current) => {
      if (current === column) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        return current;
      }

      setSortDirection('asc');
      return column;
    });
    cacheRef.current.clear();
  };

  const renderSortableHeader = (label: string, column: SortColumn) => {
    const isActive = sortColumn === column;
    const isAsc = sortDirection === 'asc';

    return (
      <button
        type="button"
        onClick={() => handleHeaderSort(column)}
        className={`group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
          isActive
            ? 'text-neutral-900 dark:text-neutral-50'
            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
        }`}
      >
        <span>{label}</span>
        <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
          {isAsc ? (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </button>
    );
  };

  useEffect(() => {
    setPage(1);
    cacheRef.current.clear();
  }, [pageSize]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full items-center gap-2 sm:max-w-md" onSubmit={handleSearchSubmit}>
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              placeholder="Search by name or email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Search
          </button>
        </form>

        <div className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-right">
          {patients.length > 0
            ? `Showing ${patients.length} patients${searchQuery ? ` for "${searchQuery}"` : ''}`
            : searchQuery
            ? `No patients found for "${searchQuery}"`
            : 'No patients found'}
        </div>
      </section>

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
        ) : patients.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            No patients found.
          </div>
        ) : (
          patients.map((patient) => <PatientCard key={patient.id} patient={patient} />)
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm sm:block dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
              <tr>
                <th className="px-3 py-3 text-left sm:px-4">{renderSortableHeader('Name', 'name')}</th>
                <th className="hidden px-3 py-3 text-left sm:table-cell sm:px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Phone</span>
                </th>
                <th className="hidden px-3 py-3 text-left md:table-cell sm:px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Date of birth</span>
                </th>
                <th className="hidden px-3 py-3 text-left lg:table-cell sm:px-4">{renderSortableHeader('Registered', 'registrationDate')}</th>
                <th className="px-3 py-3 text-left sm:px-4">{renderSortableHeader('Status', 'intakeStatus')}</th>
                <th className="hidden px-3 py-3 text-left xl:table-cell sm:px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Sex</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => <TableSkeletonRow key={index} />)
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => {
                  const fullName = patient.name.full || 'N/A';
                  const email = patient.email || 'No email';
                  const intakeStatus = patient.intake.status;
                  const intakeClasses =
                    intakeStatus === 'completed'
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:bg-emerald-950'
                      : intakeStatus === 'in_progress'
                      ? 'border-amber-500 text-amber-700 bg-amber-50 dark:border-amber-500 dark:text-amber-300 dark:bg-amber-950'
                      : 'border-neutral-300 text-neutral-600 bg-neutral-50 dark:border-neutral-600 dark:text-neutral-400 dark:bg-neutral-800';

                  return (
                    <tr key={patient.id} className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-3 py-3 sm:px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-900 dark:text-neutral-50">{fullName}</span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">{email}</span>
                        </div>
                      </td>
                      <td className="hidden px-3 py-3 text-neutral-700 sm:table-cell sm:px-4 dark:text-neutral-200">
                        {patient.phone || 'N/A'}
                      </td>
                      <td className="hidden px-3 py-3 text-neutral-700 md:table-cell sm:px-4 dark:text-neutral-200">
                        {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="hidden px-3 py-3 text-neutral-700 lg:table-cell sm:px-4 dark:text-neutral-200">
                        {patient.registrationDate ? new Date(patient.registrationDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${intakeClasses}`}>
                          {patient.intake.step ? patient.intake.step.replace(/_/g, ' ') : 'Not started'}
                        </span>
                      </td>
                      <td className="hidden px-3 py-3 text-neutral-700 xl:table-cell sm:px-4 dark:text-neutral-200">
                        {patient.sexAtBirth ? patient.sexAtBirth.toUpperCase() : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-neutral-500 dark:text-neutral-400">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
