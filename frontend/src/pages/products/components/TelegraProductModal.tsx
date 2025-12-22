import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { listTelegraProducts, testTelegraConnection } from '@/api/telegra';
import type { TelegraProductVariation } from '@/api/telegra';

interface TelegraProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (productId: string) => void;
}

export const TelegraProductModal: React.FC<TelegraProductModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<TelegraProductVariation[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    affiliateId?: string;
  }>({ tested: false, success: false, message: '' });

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const conn = await testTelegraConnection();
        setConnectionStatus({
          tested: true,
          success: conn.data.success,
          message: conn.data.message,
          affiliateId: conn.data.affiliateId
        });

        const result = await listTelegraProducts();
        setProducts(result.data.products);
      } catch (error) {
        setConnectionStatus({
          tested: true,
          success: false,
          message:
            typeof error === 'object' && error && 'message' in error
              ? (error as { message?: string }).message ?? 'Failed to connect to Telegra'
              : 'Failed to connect to Telegra'
        });
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} title="Telegra Products" size="lg" onClose={onClose}>
      <div className="space-y-3">
        {connectionStatus.tested && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
              connectionStatus.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  connectionStatus.success
                    ? 'M5 13l4 4L19 7'
                    : 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                }
              />
            </svg>
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {connectionStatus.success ? 'Connected to Telegra' : 'Telegra connection issue'}
              </div>
              <div className="mt-0.5 text-[11px] leading-snug opacity-80">
                {connectionStatus.message}
                {connectionStatus.affiliateId && (
                  <span className="ml-1 opacity-70">
                    (Affiliate: {connectionStatus.affiliateId})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="max-h-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white sm:max-h-72 dark:border-neutral-800 dark:bg-neutral-900">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-neutral-500 dark:text-neutral-400">
              <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading Telegra products...
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              <svg className="mb-2 h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              No products found from Telegra.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <table className="hidden min-w-full text-xs sm:table">
                <thead className="sticky top-0 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Name</th>
                    <th className="px-3 py-2.5 text-left">Medication</th>
                    <th className="px-3 py-2.5 text-left">Strength</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-3 py-2.5 align-top text-neutral-900 dark:text-neutral-100">
                        <div className="max-w-[160px] truncate font-medium">{p.name}</div>
                        {p.description && (
                          <div className="mt-0.5 line-clamp-2 max-w-[160px] text-[11px] text-neutral-500 dark:text-neutral-400">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top text-[11px] text-neutral-600 dark:text-neutral-300">
                        {p.medication?.name || '—'}
                      </td>
                      <td className="px-3 py-2.5 align-top text-[11px] text-neutral-600 dark:text-neutral-300">
                        <div>{p.medication?.activeIngredient}</div>
                        {p.medication?.strength && <div className="mt-0.5">{p.medication.strength}</div>}
                        {p.medication?.form && <div className="mt-0.5 text-neutral-500 dark:text-neutral-400">{p.medication.form}</div>}
                      </td>
                      <td className="px-3 py-2.5 align-top text-right">
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(p._id);
                            onClose();
                          }}
                          className="inline-flex h-7 items-center justify-center rounded-lg bg-neutral-900 px-3 text-[11px] font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="divide-y divide-neutral-100 sm:hidden dark:divide-neutral-800">
                {products.map((p) => (
                  <div key={p._id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="mt-0.5 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                            {p.description}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(p._id);
                          onClose();
                        }}
                        className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 px-3 text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                      >
                        Select
                      </button>
                    </div>
                    {p.medication && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                        {p.medication.name && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-neutral-400 dark:text-neutral-500">Med:</span>
                            {p.medication.name}
                          </span>
                        )}
                        {p.medication.strength && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-neutral-400 dark:text-neutral-500">Str:</span>
                            {p.medication.strength}
                          </span>
                        )}
                        {p.medication.form && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-neutral-400 dark:text-neutral-500">Form:</span>
                            {p.medication.form}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Selecting a Telegra product will copy its ID into the product form. Telegra products are
          managed externally; this integration only links your product to Telegra.
        </p>
      </div>
    </Modal>
  );
};

