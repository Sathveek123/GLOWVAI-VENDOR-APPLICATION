/**
 * Orders: the vendor's order offers and own orders, from the GlowVai vendor API.
 * Contract: docs/VENDOR_API.md (GET /api/vendor/orders, accept, decline, packed, VendorOrder).
 *
 * The server sends only the vendor-safe projection: reference, items, quantities, items value
 * and times; the customer's first name only after this store accepted. Never a phone number,
 * address, location or payment detail.
 */
import { vendorFetch } from './http';

export interface VendorOrderItem {
  productId: string;
  title: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string;
}

/** The only order shape the app receives. */
export interface VendorOrder {
  orderId: string;
  reference: string;
  status: string;
  vendorStatus: string | null;
  isOffer: boolean;
  items: VendorOrderItem[];
  itemCount: number;
  /** Sum of unitPrice x quantity. Not the customer's bill and not the store's earnings. */
  itemsValue: number;
  placedAt: number;
  updatedAt: number;
  acceptedAt?: number;
  packedAt?: number;
  customerFirstName?: string;
  cancelled: boolean;
  cancellationReason?: string;
}

export interface OrdersPage {
  serverTime: number;
  offers: VendorOrder[];
  orders: VendorOrder[];
  removed: string[];
  /** True on a first load: the client replaces its lists instead of merging. */
  full: boolean;
}

export type DeclineReason = 'OUT_OF_STOCK' | 'STORE_BUSY' | 'CLOSING_SOON' | 'ITEM_DAMAGED' | 'OTHER';

export const DECLINE_REASONS: { code: DeclineReason; label: string }[] = [
  { code: 'OUT_OF_STOCK', label: 'Item out of stock' },
  { code: 'STORE_BUSY', label: 'Store too busy' },
  { code: 'CLOSING_SOON', label: 'Closing soon' },
  { code: 'ITEM_DAMAGED', label: 'Item damaged' },
  { code: 'OTHER', label: 'Other reason' },
];

/** Longest note the server accepts with the OTHER reason. */
export const DECLINE_NOTE_MAX = 200;

/** One line of the OUT_OF_STOCK error's `details.missing`. */
export interface MissingStock {
  productId: string;
  title: string;
  need: number;
  have: number;
}

const path = (orderId: string, action: string) =>
  `/api/vendor/orders/${encodeURIComponent(orderId)}/${action}`;

export const ordersApi = {
  /** First load without `since` (or 0); later polls pass `since = serverTime - 5000`. */
  list: (since?: number) =>
    vendorFetch<{ ok: true } & OrdersPage>(
      since && since > 0 ? `/api/vendor/orders?since=${Math.floor(since)}` : '/api/vendor/orders',
    ),
  accept: (orderId: string) =>
    vendorFetch<{ ok: true; order?: VendorOrder }>(path(orderId, 'accept'), { method: 'POST', body: {} }),
  decline: (orderId: string, reason: DeclineReason, note?: string) =>
    vendorFetch<{ ok: true }>(path(orderId, 'decline'), {
      method: 'POST',
      body: reason === 'OTHER' ? { reason, note: (note || '').trim().slice(0, DECLINE_NOTE_MAX) } : { reason },
    }),
  packed: (orderId: string, checkedProductIds: string[]) =>
    vendorFetch<{ ok: true; order?: VendorOrder }>(path(orderId, 'packed'), {
      method: 'POST',
      body: { checkedProductIds },
    }),
};

/** Reads `details.missing` from an OUT_OF_STOCK error, keeping only well-formed lines. */
export function missingStockFrom(details: Record<string, unknown> | undefined): MissingStock[] {
  const raw = details?.missing;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m: any) => ({
      productId: typeof m?.productId === 'string' ? m.productId : '',
      title: typeof m?.title === 'string' && m.title.trim() ? m.title.trim() : 'An item',
      need: Number.isFinite(Number(m?.need)) ? Number(m.need) : 0,
      have: Number.isFinite(Number(m?.have)) ? Math.max(0, Number(m.have)) : 0,
    }))
    .filter(m => m.productId || m.title);
}
