# Admin Products & Telegra Integration (Backend)

This document describes the backend implementation for:

- Admin product management (CRUD, tiers, states, Stripe, Telegra IDs).
- Reusable image upload via Supabase Storage.
- Telegra product integration for the admin panel.

All endpoints are mounted under the `/api` prefix in `src/app.ts`.

---

## 1. Configuration & Constants

**File:** `src/config/subscriptions.ts`

- `SUBSCRIPTION_CATEGORY_ID = 18`
  - Category row in `categories` that represents “Subscription Plans”.
  - All subscription plan products (Standard/Premium) live in this category.

- `TIER_2_STATES = ['NY', 'NJ', 'CT', 'MA', 'NH', 'RI']`
  - States that use the premium subscription tier (`pricing_tier = 'tier_2'`).
  - RI is currently blocked at the intake layer.

- `BIOREFERENCE_STATES = ['NY', 'NJ']`
  - States that use BioReference and require at‑home phlebotomy.

- `BLOCKED_STATES = ['RI']`
  - States we do not support for subscription onboarding.

- `DEFAULT_PHLEBOTOMY_PRICE_CENTS = 9900`
  - Default at‑home phlebotomy add‑on price in cents.

**File:** `src/config/env.ts`

Environment variables used by this module:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PATIENT_PORTAL_BASE_URL` (unused here but supported)
- `TELEGRA_EMAIL`
- `TELEGRA_PASSWORD`
- `TELEGRA_BASE_URL`

---

## 2. Reusable image upload helper

**File:** `src/lib/storage.ts`

- `uploadImageToBucket({ bucket, fileBuffer, originalName, mimeType }): Promise<string>`
  - Uploads a file buffer to a Supabase storage `bucket` and returns the public URL.
  - Used by the admin image upload endpoint (see below).

- `deleteImageFromBucketByUrl({ bucket, url }): Promise<void>`
  - Best‑effort delete of a file given its public URL.
  - Not currently wired into product deletion (safe to add later if needed).

---

## 3. Admin Products API

**Module:** `src/modules/products`

### 3.1 Types

**File:** `src/modules/products/products.types.ts`

Defines backend‑side admin DTOs:

- `ProductType = 'subscription' | 'device' | 'medication' | 'telegra' | 'one-off'`
- `PricingTier = 'tier_1' | 'tier_2'`

Core types:

- `AdminProductCategoryInfo`
  - `id`, `name`, `description?`, `color`, `frequency: 'one-time' | 'subscription' | null`

- `AdminProduct`
  - Core fields: `id`, `name`, `description`, `slug`, `productUrl`, `imageUrl`
  - Category: `categoryId`, optional `category: AdminProductCategoryInfo | null`
  - Inventory/type: `stockQuantity`, `productType`
  - Pricing: `price`, `priceDiscounted`, `subscriptionPrice`, `quarterlyPrice`, `annualPrice`
  - Flags: `isBestSeller`, `showInCatalog`, `isUpsell`, `optInDuringUpsell`
  - Stripe: `stripeProductId`, `stripePriceId`
  - Telegra: `telegraProductId`
  - Subscription tiers: `pricingTier`, `tierDisplayName`, `applicableStates`
  - Audit: `createdAt`, `updatedAt`

- `AdminProductsQuery`
  - `page`, `pageSize`
  - `search?`
  - `sortBy?: 'id' | 'created_at' | 'stock_quantity' | 'product_type'`
  - `sortOrder?: 'asc' | 'desc'`
  - `categoryId?`, `productType?`, `showInCatalog?`, `isUpsell?`

- `AdminProductsResult`
  - `{ products: AdminProduct[]; pagination: { page, pageSize, total, totalPages, hasNextPage, hasPrevPage } }`

- `CreateAdminProductInput`, `UpdateAdminProductInput`
  - Shapes used by controller + service; mirror `AdminProduct` with appropriate optional fields.

### 3.2 Service

**File:** `src/modules/products/products.service.ts`

Uses `getSupabaseServiceClient()` and `SUBSCRIPTION_CATEGORY_ID`.

Functions:

- `getAdminProducts(query: AdminProductsQuery): Promise<AdminProductsResult>`
  - Reads from `products` with a join on `categories`.
  - Supports:
    - Pagination via `page`/`pageSize`.
    - Search across `name`, `slug`, and numeric `id`.
    - Filters: `categoryId`, `productType`, `showInCatalog`, `isUpsell`.
    - Sorting by `id`, `created_at`, `stock_quantity`, `product_type`.

- `getAdminProductById(id: number): Promise<AdminProduct>`
  - Fetches single product with category join.
  - Throws `Error` with `code = 'NOT_FOUND'` if missing.

- `createAdminProduct(input: CreateAdminProductInput): Promise<AdminProduct>`
  - Generates `slug` if missing and sets `product_url = /products/{slug}`.
  - If `categoryId === SUBSCRIPTION_CATEGORY_ID`:
    - Validates `pricingTier`, `tierDisplayName`, `applicableStates` (non‑empty).
    - Expects `stripeProductId` and `stripePriceId`.
    - Stores `applicable_states` as JSON string.
  - Sets sane defaults for legacy pricing and quantity/dose.
  - Inserts into `products` and returns the mapped `AdminProduct`.

- `updateAdminProduct(id: number, input: UpdateAdminProductInput): Promise<AdminProduct>`
  - Loads existing product first.
  - Determines whether the effective category is `SUBSCRIPTION_CATEGORY_ID`.
  - If subscription category:
    - Validates tier fields (same rules as create).
  - Allows partial updates (name, description, slug, productUrl, imageUrl, category, prices, flags, Stripe, Telegra, tier fields).
  - Recomputes `product_url` when slug changes.
  - Clears subscription tier fields if product is moved out of subscription category.
  - Throws `NOT_FOUND` on missing row.

- `deleteAdminProduct(id: number): Promise<{ id: number }>`
  - Confirms product exists first.
  - Deletes row from `products` table.
  - Throws `NOT_FOUND` on missing row.

### 3.3 Controller & routes

**File:** `src/modules/products/products.controller.ts`  
**File:** `src/modules/products/products.routes.ts`

All routes require admin auth (`requireAdmin`) and are mounted under `/api`.

#### 3.3.1 List products

- **GET** `/api/admin/products`

Query params:

- `page` (number, default 1)
- `pageSize` (number, default 10)
- `search` (string, optional)
- `sortBy` (`id` | `created_at` | `stock_quantity` | `product_type`)
- `sortOrder` (`asc` | `desc`)
- `categoryId` (number, optional)
- `productType` (string, optional)
- `showInCatalog` (`true` | `false`)
- `isUpsell` (`true` | `false`)

Response:

```json
{
  "data": {
    "products": [ /* AdminProduct[] */ ],
    "pagination": { "page": 1, "pageSize": 10, "total": 0, "totalPages": 0, "hasNextPage": false, "hasPrevPage": false }
  },
  "message": "Products fetched successfully"
}
```

#### 3.3.2 Get product by id

- **GET** `/api/admin/products/:id`

Responses:

- `200` with `{ data: AdminProduct, message }`.
- `400` if `id` invalid.
- `404` if product not found.

#### 3.3.3 Create product

- **POST** `/api/admin/products`
- Body: `CreateAdminProductInput` shape in JSON.

Important rules:

- `name`, `description`, `categoryId`, `stockQuantity`, `productType`, `imageUrl` are required.
- If `categoryId === SUBSCRIPTION_CATEGORY_ID` (18):
  - Must include `pricingTier`, `tierDisplayName`, `applicableStates`.
  - Must include `stripeProductId` and `stripePriceId`.

Responses:

- `201` with `{ data: AdminProduct, message: 'Product created successfully' }`.
- `400` for missing/invalid required fields.
- `409` if subscription config is invalid (e.g. missing tier fields).
- `500` on Supabase errors.

#### 3.3.4 Update product

- **PUT** `/api/admin/products/:id`
- Body: partial `UpdateAdminProductInput`.

Behavior:

- Validates subscription tier fields if product is (or becomes) a subscription category product.
- Recomputes `productUrl` when slug is changed.

Responses:

- `200` with `{ data: AdminProduct, message: 'Product updated successfully' }`.
- `400` for invalid `id`.
- `404` if product not found.
- `409` if subscription config is invalid.
- `500` on errors.

#### 3.3.5 Delete product

- **DELETE** `/api/admin/products/:id`

Responses:

- `200` with `{ data: { id }, message: 'Product deleted successfully' }`.
- `400` for invalid `id`.
- `404` if product not found.

#### 3.3.6 Upload product image (reusable)

- **POST** `/api/admin/products/image`
- Content-Type: `multipart/form-data`
- Field: `file` (image file)

Behavior:

- Validates file is present and `mimetype` starts with `image/`.
- Uploads to Supabase storage bucket `product-images` using `uploadImageToBucket`.
- Returns the public URL.

Response:

```json
{
  "data": { "imageUrl": "https://.../product-images/..." },
  "message": "Image uploaded successfully"
}
```

Use this endpoint from the admin UI to get an `imageUrl`, then pass that URL into the product create/update payloads.

---

## 4. Telegra Admin Integration

**Module:** `src/modules/telegra`

### 4.1 Service

**File:** `src/modules/telegra/telegra.service.ts`

Environment variables:

- `TELEGRA_EMAIL`, `TELEGRA_PASSWORD`, `TELEGRA_BASE_URL`
  - If missing, service throws “Telegra credentials are not configured”.

Types:

- `TelegraProductVariation`
  - `_id`, `name`, `description?`, `price?`, `affiliate?`
  - `medication? { name, activeIngredient?, strength?, form? }`

Functions:

- `testTelegraConnection()`
  - Calls Telegra auth endpoint using Basic auth.
  - Returns `{ success: boolean; message: string; affiliateId?: string }`.

- `getTelegraProductVariations()`
  - Authenticates to Telegra.
  - Tries multiple affiliate endpoints to fetch products/variations.
  - Normalizes responses into `TelegraProductVariation[]`.
  - Returns `{ products, affiliateId }`.

- `getTelegraProductVariationById(id)`
  - Loads all variations and returns the one with matching `_id`, or `null`.

### 4.2 Controller & routes

**File:** `src/modules/telegra/telegra.controller.ts`  
**File:** `src/modules/telegra/telegra.routes.ts`

All routes are mounted under `/api` and require admin auth (`requireAdmin`).

#### 4.2.1 Test connection

- **GET** `/api/admin/telegra/connection`

Response:

```json
{
  "data": {
    "success": true,
    "message": "Successfully connected to Telegra API",
    "affiliateId": "..."
  },
  "message": "Telegra connection successful"
}
```

On failure, `success` is `false`, `message` explains the error, and HTTP status is 500.

#### 4.2.2 List Telegra products

- **GET** `/api/admin/telegra/products`

Response:

```json
{
  "data": {
    "products": [ /* TelegraProductVariation[] */ ],
    "affiliateId": "..."
  },
  "message": "Telegra products fetched successfully"
}
```

The new admin Telegra Product Manager can call this endpoint to display available variations.

#### 4.2.3 Get Telegra product by id

- **GET** `/api/admin/telegra/products/:id`

Responses:

- `200` with `{ data: TelegraProductVariation, message }`.
- `400` if `id` is missing.
- `404` if no variation with that `_id` is found.

---

## 5. Wiring & Auth

**File:** `src/routes/index.ts`

Routers mounted under `/api`:

- `healthRouter`
- `authRouter`
- `patientsRouter`
- `categoriesRouter`
- `productsRouter`
- `telegraRouter`

All `/admin/...` routes are protected by `requireAdmin`, consistent with existing modules.

---

## 6. Testing Checklist

After setting env vars in `backend/.env` and starting the server (`pnpm dev` from `backend`):

1. **Image upload**
   - `POST /api/admin/products/image` with `file` field (image).
   - Expect `201` with `data.imageUrl`.

2. **Products**
   - `GET /api/admin/products`
   - `POST /api/admin/products` with a valid payload and `imageUrl` from step 1.
   - `GET /api/admin/products/:id`
   - `PUT /api/admin/products/:id`
   - `DELETE /api/admin/products/:id`

3. **Telegra**
   - `GET /api/admin/telegra/connection`
   - `GET /api/admin/telegra/products`
   - `GET /api/admin/telegra/products/:id`

These endpoints are additive and do not change the existing Next.js client application or old admin behaviour. They are intended to be used by the new admin frontend via the shared DTO shapes reflected in `products.types.ts`.

