import React, { useEffect, useState } from 'react';
import type {
  AdminProduct,
  AdminCategory,
  CreateAdminProductInput,
  UpdateAdminProductInput
} from '@outlive/shared';
import { PRODUCT_TYPES, PRICING_TIERS } from '@outlive/shared';
import { uploadProductImage } from '@/api/products';
import { listCategories } from '@/api/categories';
import { TelegraProductModal } from './TelegraProductModal';

interface ProductFormProps {
  initialValues?: AdminProduct | null;
  isSubmitting: boolean;
  onSubmit: (data: CreateAdminProductInput | UpdateAdminProductInput) => void;
  onCancel: () => void;
}

const US_STATES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming'
};

const US_STATE_CODES = Object.keys(US_STATES);

const TIER_2_STATES = ['NY', 'NJ', 'CT', 'MA', 'NH', 'RI'] as const;
const TIER_1_STATES: string[] = US_STATE_CODES.filter(
  (code) => !(TIER_2_STATES as readonly string[]).includes(code)
);

export const ProductForm: React.FC<ProductFormProps> = ({
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel
}) => {
  const isEdit = Boolean(initialValues);

  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [slug, setSlug] = useState(initialValues?.slug ?? '');
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? '');
  const [categoryId, setCategoryId] = useState<number>(initialValues?.categoryId ?? 0);
  const [stockQuantity, setStockQuantity] = useState<number>(initialValues?.stockQuantity ?? 0);
  const [productType, setProductType] = useState(initialValues?.productType ?? 'subscription');
  const [price, setPrice] = useState<number | null>(initialValues?.price ?? null);
  const [isBestSeller, setIsBestSeller] = useState(initialValues?.isBestSeller ?? false);
  const [showInCatalog, setShowInCatalog] = useState(initialValues?.showInCatalog ?? true);
  const [isUpsell, setIsUpsell] = useState(initialValues?.isUpsell ?? false);
  const [optInDuringUpsell, setOptInDuringUpsell] = useState(
    initialValues?.optInDuringUpsell ?? false
  );
  const [stripeProductId, setStripeProductId] = useState(initialValues?.stripeProductId ?? '');
  const [stripePriceId, setStripePriceId] = useState(initialValues?.stripePriceId ?? '');
  const [pricingTier, setPricingTier] = useState(initialValues?.pricingTier ?? null);
  const [tierDisplayName, setTierDisplayName] = useState(initialValues?.tierDisplayName ?? '');
  const [applicableStates, setApplicableStates] = useState<string[]>(
    initialValues?.applicableStates ?? []
  );
  const [telegraProductId, setTelegraProductId] = useState(initialValues?.telegraProductId ?? '');

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isTelegraModalOpen, setIsTelegraModalOpen] = useState(false);

  const isSubscriptionCategory = categoryId === 18;

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      setCategoriesError(null);
      try {
        const response = await listCategories({
          page: 1,
          pageSize: 100,
          sortBy: 'order',
          sortOrder: 'asc'
        });
        setCategories(response.data.categories);

        // For create mode, if no category selected yet, default to first category if available
        if (!initialValues && response.data.categories.length > 0 && categoryId === 0) {
          const first = response.data.categories[0];
          setCategoryId(first.id);
          // Derive type from frequency
          const isSub = first.frequency === 'subscription';
          setProductType(isSub ? 'subscription' : 'device');
        }
      } catch (error) {
        const message =
          typeof error === 'object' && error && 'message' in error
            ? (error as { message?: string }).message ?? 'Failed to load categories'
            : 'Failed to load categories';
        setCategoriesError(message);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    void loadCategories();
  }, [initialValues, categoryId]);

  useEffect(() => {
    if (!slug && name) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setSlug(generated);
    }
  }, [name, slug]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    setUploadError(null);
    setIsUploadingImage(true);

    try {
      const result = await uploadProductImage(file);
      setImageUrl(result.data.imageUrl);
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? (error as { message?: string }).message ?? 'Failed to upload image'
          : 'Failed to upload image';
      setUploadError(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleToggleState = (state: string) => {
    setApplicableStates((current) => {
      const next = current.includes(state)
        ? current.filter((s) => s !== state)
        : [...current, state];

      // Auto-detect tier based on full set match
      if (next.length === TIER_1_STATES.length && TIER_1_STATES.every((s) => next.includes(s))) {
        setPricingTier('tier_1');
        if (!tierDisplayName) {
          setTierDisplayName('Standard');
        }
      } else if (
        next.length === (TIER_2_STATES as readonly string[]).length &&
        (TIER_2_STATES as readonly string[]).every((s) => next.includes(s))
      ) {
        setPricingTier('tier_2');
        if (!tierDisplayName) {
          setTierDisplayName('Premium');
        }
      }

      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const base: CreateAdminProductInput = {
      name: name.trim(),
      description: description || '',
      slug: slug.trim() || undefined,
      imageUrl: imageUrl || '',
      categoryId,
      stockQuantity,
      productType,
      price,
      subscriptionPrice: null,
      quarterlyPrice: null,
      annualPrice: null,
      isBestSeller,
      showInCatalog,
      isUpsell,
      optInDuringUpsell,
      stripeProductId: stripeProductId || null,
      stripePriceId: stripePriceId || null,
      telegraProductId: telegraProductId || null,
      pricingTier: isSubscriptionCategory ? pricingTier ?? null : null,
      tierDisplayName: isSubscriptionCategory ? tierDisplayName || null : null,
      applicableStates: isSubscriptionCategory ? applicableStates : null
    };

    if (initialValues) {
      const updatePayload: UpdateAdminProductInput = {
        ...base
      };
      onSubmit(updatePayload);
    } else {
      onSubmit(base);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
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
          Slug
        </label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">/products/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="product-slug"
            className="flex h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Image
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] text-neutral-400 dark:text-neutral-500">
                No image
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isUploadingImage || isSubmitting}
              className="block w-full text-xs text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-neutral-800 disabled:opacity-50 dark:text-neutral-300 dark:file:bg-neutral-100 dark:file:text-neutral-900 dark:hover:file:bg-white"
            />
            {uploadError && (
              <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
            )}
            {isUploadingImage && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Uploading image...</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Category
          </label>
          <select
            value={categoryId || ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              setCategoryId(id);
              const category = categories.find((c) => c.id === id) ?? null;
              const isSub = category?.frequency === 'subscription';
              setProductType(isSub ? 'subscription' : 'device');
            }}
            disabled={isLoadingCategories || categories.length === 0}
            className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
          >
            <option value="" disabled>
              {isLoadingCategories ? 'Loading categories...' : 'Select a category'}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.frequency})
              </option>
            ))}
          </select>
          {categoriesError && (
            <p className="text-[11px] text-red-600 dark:text-red-400">{categoriesError}</p>
          )}
          {isSubscriptionCategory && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              This category is treated as a subscription plans category.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Stock quantity
          </label>
          <input
            type="number"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(Number(e.target.value))}
            min={0}
            required
            className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Product type
          </label>
          <div className="flex h-10 items-center">
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {productType}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Derived from category frequency.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Base price (cents)
          </label>
          <input
            type="number"
            value={price ?? ''}
            onChange={(e) => setPrice(e.target.value === '' ? null : Number(e.target.value))}
            min={0}
            placeholder="0"
            className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Stripe product ID
          </label>
          <input
            type="text"
            value={stripeProductId}
            onChange={(e) => setStripeProductId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
            placeholder="prod_..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Stripe price ID
          </label>
          <input
            type="text"
            value={stripePriceId}
            onChange={(e) => setStripePriceId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
            placeholder="price_..."
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Telegra product ID (optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={telegraProductId}
            onChange={(e) => setTelegraProductId(e.target.value)}
            className="flex h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
            placeholder="Telegra product variation ID"
          />
          <button
            type="button"
            onClick={() => setIsTelegraModalOpen(true)}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Browse
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Flags
        </label>
        <div className="grid grid-cols-2 gap-3 text-sm sm:flex sm:flex-wrap">
          <label className="inline-flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 focus:ring-offset-0 dark:border-neutral-600 dark:bg-neutral-800 dark:checked:bg-neutral-100 dark:checked:text-neutral-900"
            />
            Best seller
          </label>
          <label className="inline-flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={showInCatalog}
              onChange={(e) => setShowInCatalog(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 focus:ring-offset-0 dark:border-neutral-600 dark:bg-neutral-800 dark:checked:bg-neutral-100 dark:checked:text-neutral-900"
            />
            Show in catalog
          </label>
          <label className="inline-flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={isUpsell}
              onChange={(e) => setIsUpsell(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 focus:ring-offset-0 dark:border-neutral-600 dark:bg-neutral-800 dark:checked:bg-neutral-100 dark:checked:text-neutral-900"
            />
            Upsell
          </label>
          <label className="inline-flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={optInDuringUpsell}
              onChange={(e) => setOptInDuringUpsell(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 focus:ring-offset-0 dark:border-neutral-600 dark:bg-neutral-800 dark:checked:bg-neutral-100 dark:checked:text-neutral-900"
            />
            Auto opt-in
          </label>
        </div>
      </div>

      {isSubscriptionCategory && (
        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                Subscription tier configuration
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                Required for state-based subscription plans.
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-emerald-800 dark:text-emerald-200">
                Pricing tier
              </label>
              <select
                value={pricingTier ?? ''}
                onChange={(e) => {
                  const value = e.target.value as (typeof PRICING_TIERS)[number] | '';
                  if (!value) {
                    setPricingTier(null);
                    return;
                  }
                  setPricingTier(value);
                  if (value === 'tier_1') {
                    setApplicableStates(TIER_1_STATES);
                    if (!tierDisplayName) {
                      setTierDisplayName('Standard');
                    }
                  } else if (value === 'tier_2') {
                    setApplicableStates(Array.from(TIER_2_STATES));
                    if (!tierDisplayName) {
                      setTierDisplayName('Premium');
                    }
                  }
                }}
                className="flex h-9 w-full rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm text-neutral-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
              >
                <option value="">Select tier</option>
                {PRICING_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier === 'tier_2' ? 'Tier 2 (Premium)' : 'Tier 1 (Standard)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-emerald-800 dark:text-emerald-200">
                Tier display name
              </label>
              <input
                type="text"
                value={tierDisplayName}
                onChange={(e) => setTierDisplayName(e.target.value)}
                placeholder="e.g. Standard, Premium"
                className="flex h-9 w-full rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-50 dark:placeholder:text-emerald-300/50 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-emerald-800 dark:text-emerald-200">
              Applicable states ({applicableStates.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {US_STATE_CODES.map((code) => {
                const active = applicableStates.includes(code);
                return (
                  <div key={code} className="group relative">
                    <button
                      type="button"
                      onClick={() => handleToggleState(code)}
                      className={`inline-flex h-6 items-center justify-center rounded-full border px-2 text-[10px] font-medium transition-colors ${
                        active
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-800 dark:text-emerald-100'
                          : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-800'
                      }`}
                    >
                      {code}
                    </button>
                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-neutral-100 dark:text-neutral-900">
                      {US_STATES[code]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || !imageUrl}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
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

      <TelegraProductModal
        isOpen={isTelegraModalOpen}
        onClose={() => setIsTelegraModalOpen(false)}
        onSelect={(id) => setTelegraProductId(id)}
      />
    </form>
  );
};
