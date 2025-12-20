import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/api/categories';
import { usePreferences } from '@/preferences/PreferencesContext';
import { useToast } from '@/components/Toaster';
import type {
  AdminCategory,
  AdminCategoriesResult,
  CreateAdminCategoryInput,
  UpdateAdminCategoryInput,
  CategoryFrequency
} from '@outlive/shared';

type SortColumn = 'order' | 'created_at' | null;
type SortDirection = 'asc' | 'desc';

const CATEGORY_FREQUENCIES: CategoryFrequency[] = ['one-time', 'subscription'];

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

// Skeleton Component
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

// Table Skeleton Row
const TableSkeletonRow: React.FC = () => (
  <tr className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800">
    <td className="px-3 py-3 sm:px-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-28 sm:w-36" />
          <Skeleton className="h-3 w-36 sm:w-44" />
        </div>
      </div>
    </td>
    <td className="hidden px-3 py-3 sm:table-cell sm:px-4">
      <Skeleton className="h-6 w-20 rounded-full" />
    </td>
    <td className="hidden px-3 py-3 md:table-cell sm:px-4">
      <Skeleton className="h-4 w-12" />
    </td>
    <td className="px-3 py-3 sm:px-4">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </td>
  </tr>
);

// Card Skeleton for mobile
const CardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="mt-3 flex justify-end gap-2">
      <Skeleton className="h-8 w-16 rounded-lg" />
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  </div>
);

// Category Card for mobile
const CategoryCard: React.FC<{
  category: AdminCategory;
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
}> = ({ category, onEdit, onDelete }) => {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: category.color }}
          >
            {category.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-neutral-900 dark:text-neutral-50">
              {category.name}
            </div>
            <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {category.description || 'No description'}
            </div>
          </div>
        </div>
        <span
          className={`inline-flex flex-shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
            category.frequency === 'subscription'
              ? 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:bg-emerald-950'
              : 'border-cyan-500 text-cyan-700 bg-cyan-50 dark:border-cyan-500 dark:text-cyan-300 dark:bg-cyan-950'
          }`}
        >
          {category.frequency}
        </span>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(category)}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-red-300 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// Modal Component
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Category Form
const CategoryForm: React.FC<{
  initialData?: AdminCategory;
  onSubmit: (data: CreateAdminCategoryInput | UpdateAdminCategoryInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}> = ({ initialData, onSubmit, onCancel, isSubmitting, isEdit = false }) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [color, setColor] = useState(initialData?.color ?? DEFAULT_COLORS[0]);
  const [frequency, setFrequency] = useState<CategoryFrequency>(
    initialData?.frequency ?? 'subscription'
  );
  const [order, setOrder] = useState(initialData?.order ?? 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      const updateData: UpdateAdminCategoryInput = {
        name: name.trim(),
        description: description.trim() || null,
        color,
        order
      };
      onSubmit(updateData);
    } else {
      const createData: CreateAdminCategoryInput = {
        name: name.trim(),
        description: description.trim() || null,
        color,
        frequency,
        order
      };
      onSubmit(createData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          required
          className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={2}
          className="flex w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-lg transition-all ${
                color === c
                  ? 'ring-2 ring-neutral-900 ring-offset-2 dark:ring-neutral-100 dark:ring-offset-neutral-900'
                  : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded-lg border border-neutral-300 dark:border-neutral-700"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Frequency
          {isEdit && (
            <span className="ml-2 text-xs text-neutral-400">(Cannot be changed)</span>
          )}
        </label>
        <div className="flex gap-2">
          {CATEGORY_FREQUENCIES.map((f) => (
            <button
              key={f}
              type="button"
              disabled={isEdit}
              onClick={() => setFrequency(f)}
              className={`inline-flex h-9 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors ${
                frequency === f
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
              } ${isEdit ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {f === 'one-time' ? 'One-time' : 'Subscription'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Display Order
        </label>
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          min={0}
          required
          className="flex h-10 w-24 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : isEdit ? (
            'Update'
          ) : (
            'Create'
          )}
        </button>
      </div>
    </form>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  category: AdminCategory | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  error: string | null;
}> = ({ isOpen, category, onConfirm, onCancel, isDeleting, error }) => {
  if (!isOpen || !category) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Delete Category">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete <strong className="text-neutral-900 dark:text-neutral-50">{category.name}</strong>? This action cannot be undone.
        </p>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </span>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const CategoriesPage: React.FC = () => {
  const { pageSize } = usePreferences();
  const toast = useToast();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, AdminCategoriesResult>>(new Map());

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCategories = useCallback(
    async (pageToLoad: number, searchValue: string) => {
      const cacheKey = `${pageToLoad}:${pageSize}:${searchValue.trim()}:${sortColumn ?? 'none'}:${sortDirection}`;
      const cached = cacheRef.current.get(cacheKey);

      if (cached) {
        setCategories(cached.categories);
        setTotalPages(cached.pagination.totalPages || 1);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await listCategories({
          page: pageToLoad,
          pageSize,
          search: searchValue || undefined,
          sortBy: sortColumn ?? 'order',
          sortOrder: sortDirection
        });

        cacheRef.current.set(cacheKey, response.data);
        setCategories(response.data.categories);
        setTotalPages(response.data.pagination.totalPages || 1);
      } catch (err) {
        const message =
          typeof err === 'object' && err && 'message' in err
            ? (err as { message?: string }).message ?? 'Failed to load categories'
            : 'Failed to load categories';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, sortColumn, sortDirection]
  );

  useEffect(() => {
    void fetchCategories(page, searchQuery);
  }, [page, searchQuery, fetchCategories]);

  // Debounced search
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

  // CRUD handlers
  const handleCreate = async (data: CreateAdminCategoryInput | UpdateAdminCategoryInput) => {
    setIsSubmitting(true);
    setModalError(null);

    try {
      const response = await createCategory(data as CreateAdminCategoryInput);
      setIsCreateModalOpen(false);
      cacheRef.current.clear();
      await fetchCategories(page, searchQuery);
      toast.success(`Category "${response.data.name}" created`);
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Failed to create category'
          : 'Failed to create category';
      setModalError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: AdminCategory) => {
    setSelectedCategory(category);
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: CreateAdminCategoryInput | UpdateAdminCategoryInput) => {
    if (!selectedCategory) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      const response = await updateCategory(selectedCategory.id, data as UpdateAdminCategoryInput);
      setIsEditModalOpen(false);
      setSelectedCategory(null);
      cacheRef.current.clear();
      await fetchCategories(page, searchQuery);
      toast.success(`Category "${response.data.name}" updated`);
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Failed to update category'
          : 'Failed to update category';
      setModalError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (category: AdminCategory) => {
    setSelectedCategory(category);
    setModalError(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;

    const categoryName = selectedCategory.name;
    setIsSubmitting(true);
    setModalError(null);

    try {
      await deleteCategory(selectedCategory.id);
      setIsDeleteModalOpen(false);
      setSelectedCategory(null);
      cacheRef.current.clear();
      await fetchCategories(page, searchQuery);
      toast.success(`Category "${categoryName}" deleted`);
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Failed to delete category'
          : 'Failed to delete category';
      setModalError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-50">
            Categories
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage product categories for the clinic.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setModalError(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Search & Stats */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full items-center gap-2 sm:max-w-md" onSubmit={handleSearchSubmit}>
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              placeholder="Search categories..."
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
          {categories.length > 0
            ? `Showing ${categories.length} categories${searchQuery ? ` for "${searchQuery}"` : ''}`
            : searchQuery
            ? `No categories found for "${searchQuery}"`
            : 'No categories found'}
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Mobile View - Card Layout */}
      <div className="space-y-3 sm:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => <CardSkeleton key={index} />)
        ) : categories.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            No categories found.
          </div>
        ) : (
          categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))
        )}
      </div>

      {/* Desktop View - Table Layout */}
      <div className="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm sm:block dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
              <tr>
                <th className="px-3 py-3 text-left sm:px-4">
                  {renderSortableHeader('Category', 'order')}
                </th>
                <th className="hidden px-3 py-3 text-left sm:table-cell sm:px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Frequency
                  </span>
                </th>
                <th className="hidden px-3 py-3 text-left md:table-cell sm:px-4">
                  {renderSortableHeader('Order', 'order')}
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
                Array.from({ length: 8 }).map((_, index) => <TableSkeletonRow key={index} />)
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr
                    key={category.id}
                    className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-semibold"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-900 dark:text-neutral-50">
                            {category.name}
                          </span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {category.description || 'No description'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell sm:px-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          category.frequency === 'subscription'
                            ? 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:bg-emerald-950'
                            : 'border-cyan-500 text-cyan-700 bg-cyan-50 dark:border-cyan-500 dark:text-cyan-300 dark:bg-cyan-950'
                        }`}
                      >
                        {category.frequency}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 text-neutral-700 md:table-cell sm:px-4 dark:text-neutral-200">
                      {category.order}
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(category)}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(category)}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-red-300 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          Page {page} of {totalPages}
        </div>
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

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Category"
      >
        {modalError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {modalError}
          </div>
        )}
        <CategoryForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
        }}
        title="Edit Category"
      >
        {modalError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {modalError}
          </div>
        )}
        {selectedCategory && (
          <CategoryForm
            initialData={selectedCategory}
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedCategory(null);
            }}
            isSubmitting={isSubmitting}
            isEdit
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        category={selectedCategory}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        isDeleting={isSubmitting}
        error={modalError}
      />
    </div>
  );
};
