import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdminUser, AdminUserSearchUser } from '@outlive/shared';
import { addAdmin, listAdmins, removeAdmin, searchAdminCandidates } from '@/api/admins';
import { useToast } from '@/components/Toaster';
import { Modal } from '@/components/Modal';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

const TableSkeletonRow: React.FC = () => (
  <tr className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800">
    <td className="px-3 py-3 sm:px-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
    </td>
    <td className="hidden px-3 py-3 sm:table-cell sm:px-4">
      <Skeleton className="h-5 w-16 rounded-full" />
    </td>
    <td className="hidden px-3 py-3 md:table-cell sm:px-4">
      <Skeleton className="h-4 w-32" />
    </td>
    <td className="px-3 py-3 sm:px-4">
      <Skeleton className="h-7 w-16 rounded-full" />
    </td>
  </tr>
);

const CardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
      <Skeleton className="h-7 w-16 rounded-full" />
    </div>
  </div>
);

const getInitials = (name: string | null | undefined, email: string | null | undefined): string => {
  if (name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
};

const getAvatarColor = (id: string): string => {
  const colors = [
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
    'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

interface AdminCardProps {
  admin: AdminUser;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}

const AdminCard: React.FC<AdminCardProps> = ({ admin, onRemove, isRemoving }) => {
  const displayName = admin.name?.full || admin.email || 'Unknown';
  const initials = getInitials(admin.name?.full, admin.email);
  const avatarColor = getAvatarColor(admin.id);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarColor}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-neutral-900 dark:text-neutral-50">
              {displayName}
            </div>
            {admin.name?.full && admin.email && (
              <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                {admin.email}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                {admin.role || 'admin'}
              </span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                {admin.createdAt ? `Joined ${formatDate(admin.createdAt)}` : ''}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(admin.id)}
          disabled={isRemoving}
          className="inline-flex flex-shrink-0 items-center rounded-full border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminIds: Set<string>;
  onAdminAdded: () => void;
}

const AddAdminModal: React.FC<AddAdminModalProps> = ({ isOpen, onClose, adminIds, onAdminAdded }) => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<AdminUserSearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset state when modal closes
      setSearch('');
      setSearchResults([]);
      setSearchError(null);
    }
  }, [isOpen]);

  // Search effect
  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setIsSearching(true);
        setSearchError(null);

        const res = await searchAdminCandidates(q);
        if (!cancelled) {
          setSearchResults(res.data.users);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            typeof err === 'object' && err && 'message' in err
              ? (err as { message?: string }).message ?? 'Failed to search users'
              : 'Failed to search users';
          setSearchError(msg);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void load();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const handleAddAdmin = useCallback(async (userId: string) => {
    try {
      setIsAdding(true);
      await addAdmin(userId);
      toast.success('Admin role granted');
      onAdminAdded();
      onClose();
    } catch (err) {
      const msg =
        typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Failed to grant admin role'
          : 'Failed to grant admin role';
      toast.error(msg);
    } finally {
      setIsAdding(false);
    }
  }, [onAdminAdded, onClose, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[10vh]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Add Admin
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Search for a user to grant admin access
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-700"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 min-h-[200px] overflow-y-auto">
          {!search ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Search for users
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                Enter a name or email to find users
              </p>
            </div>
          ) : isSearching ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600 dark:border-neutral-700 dark:border-t-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Searching...</p>
            </div>
          ) : searchError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{searchError}</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                No users found
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                Try a different search term
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {searchResults.map((user) => {
                const isAlreadyAdmin = adminIds.has(user.id) || user.isAdmin;
                const initials = getInitials(user.name.full, user.email);
                const avatarColor = getAvatarColor(user.id);

                return (
                  <li
                    key={user.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor}`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {user.name.full || user.email || user.id.slice(0, 8)}
                        </div>
                        <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {user.email ?? 'No email'}
                        </div>
                      </div>
                    </div>
                    {isAlreadyAdmin ? (
                      <span className="inline-flex flex-shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        Admin
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isAdding}
                        onClick={() => handleAddAdmin(user.id)}
                        className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                      >
                        {isAdding ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white dark:border-neutral-900/30 dark:border-t-neutral-900" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </>
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminsPage: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<AdminUser | null>(null);
  const toast = useToast();

  const loadAdmins = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await listAdmins();
      setAdmins(res.data.admins);
    } catch (err) {
      const msg =
        typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Failed to load admins'
          : 'Failed to load admins';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const adminIds = useMemo(() => new Set(admins.map((a) => a.id)), [admins]);

  const handleRemoveAdmin = async () => {
    if (!removeConfirm) return;

    try {
      setRemovingId(removeConfirm.id);
      await removeAdmin(removeConfirm.id);
      setAdmins((prev) => prev.filter((a) => a.id !== removeConfirm.id));
      toast.success('Admin role removed');
      setRemoveConfirm(null);
    } catch (err) {
      const msg =
        typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Failed to remove admin role'
          : 'Failed to remove admin role';
      toast.error(msg);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-50">
            Admins
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage users with administrative access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {!isLoading && admins.length > 0 && `${admins.length} admin${admins.length !== 1 ? 's' : ''}`}
          </span>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Admin
          </button>
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
          Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} />)
        ) : admins.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">No admins yet</p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
              Add your first admin to get started.
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Admin
            </button>
          </div>
        ) : (
          admins.map((admin) => (
            <AdminCard
              key={admin.id}
              admin={admin}
              onRemove={() => setRemoveConfirm(admin)}
              isRemoving={removingId === admin.id}
            />
          ))
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm sm:block dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Admin users
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
              <tr>
                <th className="px-3 py-3 text-left sm:px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    User
                  </span>
                </th>
                <th className="hidden px-3 py-3 text-left sm:table-cell sm:px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Role
                  </span>
                </th>
                <th className="hidden px-3 py-3 text-left md:table-cell sm:px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Joined
                  </span>
                </th>
                <th className="px-3 py-3 text-right sm:px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => <TableSkeletonRow key={index} />)
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="mt-3 text-sm font-medium">No admins yet</p>
                    <p className="mt-1 text-xs text-neutral-500">Add your first admin to get started.</p>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Admin
                    </button>
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const displayName = admin.name?.full || admin.email || 'Unknown';
                  const initials = getInitials(admin.name?.full, admin.email);
                  const avatarColor = getAvatarColor(admin.id);

                  return (
                    <tr key={admin.id} className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-3 py-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor}`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-neutral-900 dark:text-neutral-50">
                              {displayName}
                            </div>
                            {admin.name?.full && admin.email && (
                              <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                {admin.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-3 py-3 sm:table-cell sm:px-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          {admin.role || 'admin'}
                        </span>
                      </td>
                      <td className="hidden px-3 py-3 text-neutral-600 md:table-cell sm:px-4 dark:text-neutral-300">
                        {admin.createdAt ? formatDate(admin.createdAt) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right sm:px-4">
                        <button
                          type="button"
                          onClick={() => setRemoveConfirm(admin)}
                          disabled={removingId === admin.id}
                          className="inline-flex items-center rounded-full border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      <AddAdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        adminIds={adminIds}
        onAdminAdded={loadAdmins}
      />

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        title="Remove Admin"
        message={
          <span>
            Are you sure you want to remove admin access for{' '}
            <strong>{removeConfirm?.name?.full || removeConfirm?.email || 'this user'}</strong>?
            They will no longer be able to access the admin panel.
          </span>
        }
        confirmLabel="Remove"
        variant="danger"
        isLoading={removingId !== null}
        onConfirm={handleRemoveAdmin}
      />
    </div>
  );
};
