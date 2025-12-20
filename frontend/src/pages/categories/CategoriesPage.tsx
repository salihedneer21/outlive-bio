import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/api/categories';
import { usePreferences } from '@/preferences/PreferencesContext';
import { useToast } from '@/components/Toaster';
import { Modal } from '@/components/Modal';
import { CategoryForm, CategoryList } from './components';
import type {
  AdminCategory,
  AdminCategoriesResult,
  CreateAdminCategoryInput,
  UpdateAdminCategoryInput
} from '@outlive/shared';

type SortColumn = 'order' | 'created_at' | null;
type SortDirection = 'asc' | 'desc';

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

  const handleSort = (column: SortColumn) => {
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

      {/* Category List */}
      <CategoryList
        categories={categories}
        isLoading={isLoading}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

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
        error={modalError}
      >
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
        error={modalError}
      >
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

      {/* Delete Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        title="Delete Category"
        message={
          <>
            Are you sure you want to delete <strong className="text-neutral-900 dark:text-neutral-50">{selectedCategory?.name}</strong>? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={isSubmitting}
        error={modalError}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
