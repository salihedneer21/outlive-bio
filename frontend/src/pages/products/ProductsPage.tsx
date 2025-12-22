import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePreferences } from '@/preferences/PreferencesContext';
import { useToast } from '@/components/Toaster';
import { Modal } from '@/components/Modal';
import { ProductList } from './components/ProductList';
import { ProductForm } from './components/ProductForm';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '@/api/products';
import type {
  AdminProduct,
  AdminProductsResult,
  CreateAdminProductInput,
  UpdateAdminProductInput
} from '@outlive/shared';

type SortColumn = 'id' | 'created_at' | 'stock_quantity' | 'product_type' | null;
type SortDirection = 'asc' | 'desc';

export const ProductsPage: React.FC = () => {
  const { pageSize } = usePreferences();
  const toast = useToast();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, AdminProductsResult>>(new Map());

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchProducts = useCallback(
    async (pageToLoad: number, searchValue: string) => {
      const cacheKey = `${pageToLoad}:${pageSize}:${searchValue.trim()}:${sortColumn ?? 'none'}:${sortDirection}`;
      const cached = cacheRef.current.get(cacheKey);

      if (cached) {
        setProducts(cached.products);
        setTotalPages(cached.pagination.totalPages || 1);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await listProducts({
          page: pageToLoad,
          pageSize,
          search: searchValue || undefined,
          sortBy: sortColumn ?? 'id',
          sortOrder: sortDirection
        });

        cacheRef.current.set(cacheKey, response.data);
        setProducts(response.data.products);
        setTotalPages(response.data.pagination.totalPages || 1);
      } catch (err) {
        const message =
          typeof err === 'object' && err && 'message' in err
            ? (err as { message?: string }).message ?? 'Failed to load products'
            : 'Failed to load products';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, sortColumn, sortDirection]
  );

  useEffect(() => {
    void fetchProducts(page, searchQuery);
  }, [page, searchQuery, fetchProducts]);

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
      setSortDirection('desc');
      return column;
    });
    cacheRef.current.clear();
  };

  useEffect(() => {
    setPage(1);
    cacheRef.current.clear();
  }, [pageSize]);

  // CRUD handlers
  const handleCreate = async (data: CreateAdminProductInput | UpdateAdminProductInput) => {
    setIsSubmitting(true);
    setModalError(null);

    try {
      const response = await createProduct(data as CreateAdminProductInput);
      setIsCreateModalOpen(false);
      cacheRef.current.clear();
      await fetchProducts(page, searchQuery);
      toast.success(`Product "${response.data.name}" created`);
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Failed to create product'
          : 'Failed to create product';
      setModalError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: AdminProduct) => {
    setSelectedProduct(product);
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: CreateAdminProductInput | UpdateAdminProductInput) => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      const response = await updateProduct(selectedProduct.id, data as UpdateAdminProductInput);
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      cacheRef.current.clear();
      await fetchProducts(page, searchQuery);
      toast.success(`Product "${response.data.name}" updated`);
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Failed to update product'
          : 'Failed to update product';
      setModalError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (product: AdminProduct) => {
    setSelectedProduct(product);
    setModalError(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    const productName = selectedProduct.name;
    setIsSubmitting(true);
    setModalError(null);

    try {
      await deleteProduct(selectedProduct.id);
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      cacheRef.current.clear();
      await fetchProducts(page, searchQuery);
      toast.success(`Product "${productName}" deleted`);
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Failed to delete product'
          : 'Failed to delete product';
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
            Products
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage Outlive products, subscriptions, and Telegra‑linked items.
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
          Add Product
        </button>
      </div>

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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 6a5 5 0 015 5m-5 5a5 5 0 100-10 5 5 0 000 10z"
              />
            </svg>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products by name, slug, or id..."
              className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Search
          </button>
        </form>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}
      </section>

      {/* List */}
      <section className="space-y-3">
        <ProductList
          products={products}
          isLoading={isLoading}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-neutral-500 dark:text-neutral-400">
            <div>
              Page <span className="font-medium">{page}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1 || isLoading}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages || isLoading}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Create modal */}
      <Modal
        isOpen={isCreateModalOpen}
        title="Add product"
        size="lg"
        onClose={() => {
          if (!isSubmitting) {
            setIsCreateModalOpen(false);
          }
        }}
        error={modalError}
      >
        <ProductForm
          initialValues={null}
          isSubmitting={isSubmitting}
          onSubmit={handleCreate}
          onCancel={() => {
            if (!isSubmitting) {
              setIsCreateModalOpen(false);
            }
          }}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={isEditModalOpen}
        title="Edit product"
        size="lg"
        onClose={() => {
          if (!isSubmitting) {
            setIsEditModalOpen(false);
            setSelectedProduct(null);
          }
        }}
        error={modalError}
      >
        <ProductForm
          initialValues={selectedProduct}
          isSubmitting={isSubmitting}
          onSubmit={handleUpdate}
          onCancel={() => {
            if (!isSubmitting) {
              setIsEditModalOpen(false);
              setSelectedProduct(null);
            }
          }}
        />
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        title="Delete product"
        onClose={() => {
          if (!isSubmitting) {
            setIsDeleteModalOpen(false);
            setSelectedProduct(null);
          }
        }}
        message={
          selectedProduct ? (
            <span>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                {selectedProduct.name}
              </span>
              ? This action cannot be undone.
            </span>
          ) : (
            'Are you sure you want to delete this product?'
          )
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

