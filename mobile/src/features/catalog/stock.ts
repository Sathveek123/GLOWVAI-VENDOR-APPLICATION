/**
 * Stock and expiry rules shared by Inventory, Add from catalogue and Batches & expiry.
 * File: mobile/src/features/catalog/stock.ts
 */
import type { InventoryItem } from '../../store/useVendorStore';
import { ApiError } from '../../services/api';
import { catalogIdFromSku, type CatalogProduct } from './catalogSource';

export const LOW_STOCK_DEFAULT = 5;
/** Stock expiring within this many days is flagged as "expiring soon". */
export const NEAR_EXPIRY_DAYS = 30;

/** Units on the shelf (the backend's stockOnHand, falling back to the older stock field). */
export function onHand(item: InventoryItem): number {
  return Math.max(0, Math.floor(item.stockOnHand ?? item.stock ?? 0));
}

/** Units held for open orders. */
export function reserved(item: InventoryItem): number {
  const r = (item as InventoryItem & { reservedStock?: number }).reservedStock;
  return Math.max(0, Math.floor(r ?? 0));
}

export function lowThreshold(item: InventoryItem): number {
  const t = (item as InventoryItem & { lowStockThreshold?: number }).lowStockThreshold;
  return typeof t === 'number' && t > 0 ? t : LOW_STOCK_DEFAULT;
}

export function isOut(item: InventoryItem) {
  return onHand(item) === 0;
}

export function isLow(item: InventoryItem) {
  const n = onHand(item);
  return n > 0 && n <= lowThreshold(item);
}

/** Parses YYYY-MM-DD as a local calendar date. Returns null for missing or impossible dates. */
export function parseDate(value?: string | null): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value || '').trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

/** Whole days from today to the date (0 = expires today, negative = already expired). */
export function daysUntil(value?: string | null): number | null {
  const date = parseDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

export type ExpiryState = 'none' | 'ok' | 'soon' | 'expired';

export function expiryState(item: Pick<InventoryItem, 'expiryDate'>): ExpiryState {
  const days = daysUntil(item.expiryDate);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= NEAR_EXPIRY_DAYS) return 'soon';
  return 'ok';
}

export function formatDate(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function expiryLine(value?: string | null): string {
  const days = daysUntil(value);
  if (days === null) return '';
  const when = formatDate(value);
  if (days < 0) return `Expired on ${when}`;
  if (days === 0) return `Expires today (${when})`;
  if (days === 1) return `Expires tomorrow (${when})`;
  return `Expires ${when} · ${days} days`;
}

export function formatRupees(amount: number) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** The catalogue product behind a store item: by GV- SKU first, then by brand and name. */
export function findCatalogMatch(item: InventoryItem, byId: Map<string, CatalogProduct>, all: CatalogProduct[]): CatalogProduct | undefined {
  const id = catalogIdFromSku(item.sku);
  if (id && byId.has(id)) return byId.get(id);
  const name = (item.name || '').trim().toLowerCase();
  const brand = (item.brand || '').trim().toLowerCase();
  if (!name) return undefined;
  return all.find(p => p.productName.toLowerCase() === name && (!brand || p.brandName.toLowerCase() === brand));
}

export type SellState = 'selling' | 'paused' | 'out' | 'expired' | 'pending' | 'rejected';

/** What a shop owner needs to know about whether this item can be sold now. */
export function sellState(item: InventoryItem): SellState {
  if (expiryState(item) === 'expired') return 'expired';
  if (item.approvalStatus === 'REJECTED') return 'rejected';
  if (isOut(item)) return 'out';
  if (!item.active) return 'paused';
  if (item.approvalStatus === 'PENDING') return 'pending';
  return 'selling';
}

export const SELL_LABEL: Record<SellState, string> = {
  selling: 'Selling',
  paused: 'Paused',
  out: 'Out of stock',
  expired: 'Expired · not for sale',
  pending: 'Waiting for GlowVai approval',
  rejected: 'Not approved',
};

/** Turns any thrown error into one calm sentence for a shop owner. */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return 'Your session has ended. Please sign in again.';
    if (err.status === 404) return 'This item was not found in your store. Pull down to refresh.';
    if (err.status === 409) return err.message || 'This product is already in your store.';
    if (err.status >= 500) return 'GlowVai is not responding right now. Please try again in a minute.';
    if (err.status === 400 && err.message && err.message.length < 140) return err.message;
    return fallback;
  }
  const msg = err instanceof Error ? err.message : '';
  if (/failed to fetch|network|load failed|timed? ?out/i.test(msg)) {
    return 'We could not reach GlowVai. Check your internet connection and try again.';
  }
  return fallback;
}
