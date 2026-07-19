# Optimization Changes Report

## 1. Optimization Details

### In-Memory API Caching for Products and Categories
- **Files Modified**: `src/app/api/products/route.ts`, `src/app/api/categories/route.ts`
- **Implementation**:
  - Attached caches (`productsCache` and `categoriesCache`) to `globalThis` to prevent multi-instance problems under webpack/Next.js routes compilation.
  - Expose self-documenting invalidation functions: `invalidateProductsCache` and `invalidateCategoriesCache`.
  - In `GET` handlers, fetch once from Supabase if the cache is null/undefined, store the array, and return. For products, we filter the in-memory array by `categoryId` and `status` dynamically on each request to maintain the correct response per query parameters.
  - In `POST` handlers, reset caches to `null` to ensure data freshness when a new item is created.

### Global Order Count Cache
- **Files Modified**: `src/app/api/orders/route.ts`
- **Implementation**:
  - Cached the order count in `globalThis.cachedOrderCount`.
  - If null, query the database once for the exact count of all orders.
  - Subsequent orders retrieve this count from memory, calculate the next sequential `orderId`, and increment the cache locally by 1 upon successful insertion.
  - Expose `invalidateOrdersCache` to allow resetting the cached count.

### Database Seed Cache Invalidation
- **Files Modified**: `src/app/api/admin/seed/route.ts`
- **Implementation**:
  - Reset `productsCache`, `categoriesCache`, and `cachedOrderCount` on `globalThis` to `null` when the seed endpoint is invoked, ensuring clean state initialization.

### Optimized Customer Creation (Auto-CRM)
- **Files Modified**: `src/app/api/orders/route.ts`
- **Implementation**:
  - Eliminated the select-then-insert/update roundtrips.
  - Replaced the select query and subsequent conditional update/insert with a single `.upsert()` call targeting the `phone` column.

### Image Rendering Optimizations
- **Files Modified**: `src/app/sales/pos/page.tsx`
- **Implementation**:
  - Added `loading="lazy"` and `decoding="async"` to the catalog product image tag inside the POS viewport, deferring offscreen image loads and prioritizing initial layouts.

---

## 2. Load Test Benchmarks (Before vs. After)

Both tests were run with the following parameters:
- **Duration**: 5 seconds
- **Concurrency**: 5 customers
- **Target URL**: `http://localhost:3000`

### Baseline Metrics (Before Optimizations)
```
  Total Requests : 14
  Successful     : 14 ✓
  Failed         : 0 ✗
  Error Rate     : 0.0%
  Throughput     : 2.80 req/s

  Latency Percentiles:
    Average : 2143ms
    p50     : 2079ms
    p90     : 2615ms
    p99     : 3022ms
```

### Optimized Metrics (After Optimizations)
```
  Total Requests : 28
  Successful     : 28 ✓
  Failed         : 0 ✗
  Error Rate     : 0.0%
  Throughput     : 5.60 req/s

  Latency Percentiles:
    Average : 982ms
    p50     : 994ms
    p90     : 1262ms
    p99     : 1710ms
```

### Performance Impact Summary
- **Throughput**: Improved by **100%** (from 2.80 req/s to 5.60 req/s).
- **Average Latency**: Reduced by **54.2%** (from 2143ms down to 982ms).
- **Tail Latency (p99)**: Reduced by **43.4%** (from 3022ms down to 1710ms).

---

## 3. Compilation and Lint Verification

### TypeScript Check
Successfully ran `npx tsc --noEmit` without any errors.
```
d:\Gopal Cake Shop> npx tsc --noEmit
(Completed successfully with exit code 0)
```

### ESLint Check
Successfully verified all modified files with `npx eslint`. No new lint errors were introduced.
```
d:\Gopal Cake Shop> npx eslint src/app/api/products/route.ts src/app/api/categories/route.ts src/app/api/orders/route.ts src/app/api/admin/seed/route.ts src/app/sales/pos/page.tsx
(Completed successfully, 0 errors, 3 pre-existing warnings)
```
