/**
 * Product requests: a store asks GlowVai to add a product that is not in the catalogue yet.
 * Contract: docs/VENDOR_API.md (GET / POST /api/vendor/product-requests). Staff review the
 * request in the admin panel; the store sees the status here.
 */
import { vendorFetch } from './http';

/** Status values the server sends. Staff decide them; the app only shows them. */
export type ProductRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';

export interface ProductRequest {
  id: string;
  name: string;
  brand: string;
  category: string;
  mrp: number;
  barcode: string | null;
  pictureUrls: string[];
  reason: string;
  status: ProductRequestStatus;
  /** A note from GlowVai, when staff wrote one. */
  staffNote: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ProductRequestInput {
  name: string;
  brand: string;
  category: string;
  mrp: number;
  barcode?: string;
  pictureUrls?: string[];
  reason: string;
}

export const PRODUCT_REQUEST_CATEGORIES: { code: string; label: string }[] = [
  { code: 'skincare', label: 'Skincare' },
  { code: 'haircare', label: 'Haircare' },
  { code: 'makeup', label: 'Makeup' },
  { code: 'fragrance', label: 'Fragrance' },
  { code: 'bath-body', label: 'Bath and body' },
  { code: 'mens-grooming', label: "Men's grooming" },
  { code: 'wellness', label: 'Wellness' },
];

export const PICTURE_HOSTS = ['images.unsplash.com', 'firebasestorage.googleapis.com', 'storage.googleapis.com'] as const;
export const MAX_PICTURES = 3;
export const MAX_MRP = 1_000_000;
/** The server allows this many requests per store per IST day. */
export const DAILY_REQUEST_LIMIT = 5;

export const REQUEST_STATUS_LABEL: Record<ProductRequestStatus, string> = {
  PENDING: 'Waiting for review',
  APPROVED: 'Approved',
  REJECTED: 'Not approved',
  NEEDS_INFO: 'More information needed',
};

export function isPictureUrlAllowed(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return false;
  }
  return url.protocol === 'https:' && (PICTURE_HOSTS as readonly string[]).includes(url.hostname);
}

export type RequestValidation =
  | { ok: true; value: ProductRequestInput }
  | { ok: false; field: 'name' | 'brand' | 'category' | 'mrp' | 'barcode' | 'pictureUrls' | 'reason'; error: string };
// Note: the failure branch carries `ok: false` so callers can narrow on it.

/** Mirrors the server's checks so the vendor sees the problem before sending. The server still decides. */
export function validateProductRequest(input: {
  name: string;
  brand: string;
  category: string;
  mrp: string;
  barcode: string;
  pictureUrls: string[];
  reason: string;
}): RequestValidation {
  const name = input.name.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 120) return { ok: false, field: 'name', error: 'Enter the product name (2 to 120 characters).' };
  const brand = input.brand.trim().replace(/\s+/g, ' ');
  if (brand.length < 2 || brand.length > 80) return { ok: false, field: 'brand', error: 'Enter the brand (2 to 80 characters).' };
  if (!PRODUCT_REQUEST_CATEGORIES.some(c => c.code === input.category)) {
    return { ok: false, field: 'category', error: 'Choose a category.' };
  }
  const mrpText = input.mrp.trim();
  const mrp = /^\d+$/.test(mrpText) ? Number(mrpText) : NaN;
  if (!Number.isInteger(mrp) || mrp < 1 || mrp > MAX_MRP) {
    return { ok: false, field: 'mrp', error: 'Enter the MRP as whole rupees, more than ₹0.' };
  }
  const barcode = input.barcode.trim();
  if (barcode && !/^\d{8,14}$/.test(barcode)) return { ok: false, field: 'barcode', error: 'The barcode is 8 to 14 digits, or leave it empty.' };
  const pictures = input.pictureUrls.map(u => u.trim()).filter(Boolean);
  if (pictures.length > MAX_PICTURES) return { ok: false, field: 'pictureUrls', error: `Add up to ${MAX_PICTURES} picture links.` };
  if (pictures.some(u => !isPictureUrlAllowed(u))) {
    return { ok: false, field: 'pictureUrls', error: 'Picture links must start with https:// and come from an allowed image host.' };
  }
  const reason = input.reason.trim();
  if (reason.length < 10 || reason.length > 500) return { ok: false, field: 'reason', error: 'Tell us why (10 to 500 characters).' };
  return {
    ok: true,
    value: {
      name,
      brand,
      category: input.category,
      mrp,
      ...(barcode ? { barcode } : {}),
      ...(pictures.length ? { pictureUrls: pictures } : {}),
      reason,
    },
  };
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeProductRequest(raw: any): ProductRequest | null {
  const id = typeof raw?.id === 'string' ? raw.id : '';
  if (!id) return null;
  const status: ProductRequestStatus = (['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFO'] as const).includes(raw?.status)
    ? raw.status
    : 'PENDING';
  return {
    id,
    name: String(raw?.name ?? ''),
    brand: String(raw?.brand ?? ''),
    category: String(raw?.category ?? ''),
    mrp: num(raw?.mrp),
    barcode: typeof raw?.barcode === 'string' && raw.barcode ? raw.barcode : null,
    pictureUrls: Array.isArray(raw?.pictureUrls) ? raw.pictureUrls.filter((u: unknown): u is string => typeof u === 'string') : [],
    reason: String(raw?.reason ?? ''),
    status,
    staffNote: typeof raw?.staffNote === 'string' && raw.staffNote.trim() ? raw.staffNote.trim() : null,
    createdAt: num(raw?.createdAt),
    updatedAt: num(raw?.updatedAt),
  };
}

export const productRequestsApi = {
  list: async (): Promise<ProductRequest[]> => {
    const res = await vendorFetch<{ ok: true; requests?: unknown[] }>('/api/vendor/product-requests');
    return (Array.isArray(res.requests) ? res.requests : [])
      .map(normalizeProductRequest)
      .filter((r): r is ProductRequest => r !== null);
  },
  create: async (input: ProductRequestInput): Promise<ProductRequest | null> => {
    const res = await vendorFetch<{ ok: true; request?: unknown }>('/api/vendor/product-requests', { method: 'POST', body: input });
    return normalizeProductRequest(res.request);
  },
};
