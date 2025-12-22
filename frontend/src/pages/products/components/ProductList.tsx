import React from 'react';
import type { AdminProduct } from '@outlive/shared';

type SortColumn = 'id' | 'created_at' | 'stock_quantity' | 'product_type' | null;
type SortDirection = 'asc' | 'desc';

interface ProductListProps {
  products: AdminProduct[];
  isLoading: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
}

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

const TableSkeletonRow: React.FC = () => (
  <tr className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800">
    <td className="px-3 py-3 sm:px-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </td>
    <td className="hidden px-3 py-3 sm:table-cell sm:px-4">
      <Skeleton className="h-4 w-28" />
    </td>
    <td className="hidden px-3 py-3 md:table-cell sm:px-4">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="hidden px-3 py-3 lg:table-cell sm:px-4">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="px-3 py-3 sm:px-4">
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </td>
  </tr>
);

const sortIcon = (column: SortColumn, current: SortColumn, direction: SortDirection) => {
  if (column !== current) {
    return (
      <svg className="h-3 w-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m-8 6l4 4 4-4" />
      </svg>
    );
  }
  if (direction === 'asc') {
    return (
      <svg className="h-3 w-3 text-neutral-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15l4 4 4-4" />
      </svg>
    );
  }
  return (
    <svg className="h-3 w-3 text-neutral-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4" />
    </svg>
  );
};

export const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  sortColumn,
  sortDirection,
  onSort,
  onEdit,
  onDelete
}) => {
  const handleSortClick = (column: SortColumn) => {
    onSort(column);
  };

  if (!isLoading && products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
        No products found. Try adjusting your search or add a new product.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="hidden sm:block">
        <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
          <thead className="bg-neutral-50 dark:bg-neutral-900/70">
            <tr>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 sm:px-4"
              >
                Product
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 sm:px-4"
              >
                Category
              </th>
              <th
                scope="col"
                className="cursor-pointer px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 sm:px-4"
                onClick={() => handleSortClick('product_type')}
              >
                <span className="inline-flex items-center gap-1">
                  Type
                  {sortIcon('product_type', sortColumn, sortDirection)}
                </span>
              </th>
              <th
                scope="col"
                className="cursor-pointer px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 sm:px-4"
                onClick={() => handleSortClick('stock_quantity')}
              >
                <span className="inline-flex items-center gap-1">
                  Stock
                  {sortIcon('stock_quantity', sortColumn, sortDirection)}
                </span>
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 sm:px-4"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => <TableSkeletonRow key={index} />)
              : products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/80 dark:border-neutral-800 dark:hover:bg-neutral-900/60"
                  >
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                            {product.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {product.name}
                          </div>
                          <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                            {product.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 text-sm text-neutral-600 sm:table-cell sm:px-4 dark:text-neutral-300">
                      {product.category?.name ?? '—'}
                    </td>
                    <td className="hidden px-3 py-3 text-sm text-neutral-600 md:table-cell sm:px-4 dark:text-neutral-300">
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                        {product.productType}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 text-sm text-neutral-600 lg:table-cell sm:px-4 dark:text-neutral-300">
                      {product.stockQuantity}
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(product)}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(product)}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-red-300 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-neutral-100 sm:hidden dark:divide-neutral-800">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
              </div>
            ))
          : products.map((product) => (
              <div key={product.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {product.name}
                      </div>
                      <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {product.category?.name ?? 'No category'}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {product.productType}
                        </span>
                        {product.showInCatalog ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                            Catalog
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                    #{product.id}
                  </span>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(product)}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-950/50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

