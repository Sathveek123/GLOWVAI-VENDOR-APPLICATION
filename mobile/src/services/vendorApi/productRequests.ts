/**
 * Product requests: a store asks GlowVai to add a product that is not in the catalogue yet.
 * Contract: docs/VENDOR_API.md (GET / POST /api/vendor/product-requests). Staff review the
 * request in the admin panel; the store sees the status here.
 * The pure rules (validation, body fields, normalising) are in productRequestRules.ts.
 */
import { vendorFetch } from './http';
import { normalizeProductRequest, PRODUCT_REQUESTS_PATH, type ProductRequest, type ProductRequestInput } from './productRequestRules';

export * from './productRequestRules';

export const productRequestsApi = {
  list: async (): Promise<ProductRequest[]> => {
    const res = await vendorFetch<{ ok: true; requests?: unknown[] }>(PRODUCT_REQUESTS_PATH);
    return (Array.isArray(res.requests) ? res.requests : [])
      .map(normalizeProductRequest)
      .filter((r): r is ProductRequest => r !== null);
  },
  create: async (input: ProductRequestInput): Promise<ProductRequest | null> => {
    const res = await vendorFetch<{ ok: true; request?: unknown }>(PRODUCT_REQUESTS_PATH, { method: 'POST', body: input });
    return normalizeProductRequest(res.request);
  },
};
