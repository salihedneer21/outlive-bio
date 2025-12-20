import React from 'react';
import type { AdminCategory } from '@outlive/shared';

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
      <div className="flex justify-end gap-2">
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

type SortColumn = 'order' | 'created_at' | null;
type SortDirection = 'asc' | 'desc';

interface CategoryListProps {
  categories: AdminCategory[];
  isLoading: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  isLoading,
  sortColumn,
  sortDirection,
  onSort,
  onEdit,
  onDelete
}) => {
  const renderSortableHeader = (label: string, column: SortColumn) => {
    const isActive = sortColumn === column;
    const isAsc = sortDirection === 'asc';

    return (
      <button
        type="button"
        onClick={() => onSort(column)}
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

  return (
    <>
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
              onEdit={onEdit}
              onDelete={onDelete}
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
