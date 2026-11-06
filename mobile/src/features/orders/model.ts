/**
 * Order flow: status buckets, labels, stock coverage and small formatters shared by Home,
 * Orders, Order detail, Pack order, Ready for pickup and the offer sheet.
 * Statuses are the GlowVai shop's (docs/VENDOR_API.md): PLACED (offer), VENDOR_ACCEPTED,
 * PACKED, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED.
 * File: mobile/src/features/orders/model.ts
 */
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { Order } from '../../store/useVendorStore';
import type { InventoryRecord } from '../../services/vendorApi/inventory';

export type OrderBucket = 'offers' | 'preparing' | 'packed' | 'completed' | 'cancelled' | 'other';

const BUCKET_BY_STATUS: Record<string, OrderBucket> = {
  VENDOR_ACCEPTED: 'preparing',
  PACKED: 'packed',
  READY_FOR_PICKUP: 'packed',
  OUT_FOR_DELIVERY: 'completed',
  DELIVERED: 'completed',
  CANCELLED: 'cancelled',
};

export function bucketOf(order: Pick<Order, 'status' | 'isOffer' | 'cancelled'> | null | undefined): OrderBucket {
  if (!order) return 'other';
  if (order.cancelled || order.status === 'CANCELLED') return 'cancelled';
  if (order.isOffer) return 'offers';
  return BUCKET_BY_STATUS[order.status] || 'other';
}

type IconName = keyof typeof Ionicons.glyphMap;
export type StatusTone = 'action' | 'progress' | 'success' | 'neutral' | 'danger';

export interface StatusMeta {
  label: string;
  icon: IconName;
  tone: StatusTone;
}

const META: Record<OrderBucket, StatusMeta> = {
  offers: { label: 'New offer', icon: 'notifications-outline', tone: 'action' },
  preparing: { label: 'Preparing', icon: 'basket-outline', tone: 'progress' },
  packed: { label: 'Packed', icon: 'cube-outline', tone: 'progress' },
  completed: { label: 'With delivery partner', icon: 'bicycle-outline', tone: 'success' },
  cancelled: { label: 'Cancelled', icon: 'close-circle-outline', tone: 'danger' },
  other: { label: 'Updating', icon: 'sync-outline', tone: 'neutral' },
};

export function statusMeta(order: Pick<Order, 'status' | 'isOffer' | 'cancelled'>): StatusMeta {
  const bucket = bucketOf(order);
  if (bucket === 'packed' && order.status === 'READY_FOR_PICKUP') {
    return { ...META.packed, label: 'Ready for pickup' };
  }
  if (bucket === 'completed' && order.status === 'DELIVERED') {
    return { label: 'Delivered', icon: 'checkmark-circle-outline', tone: 'success' };
  }
  return META[bucket];
}

/** Orders tabs (PRD screen 11). */
export const ORDER_TABS: { key: Exclude<OrderBucket, 'other'>; label: string }[] = [
  { key: 'offers', label: 'Offers' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'packed', label: 'Packed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

/** Steps shown in the order stepper. Pickup and delivery are GlowVai's. */
export const ORDER_STEPS = ['Offer', 'Preparing', 'Packed', 'With delivery'] as const;

/** Index of the current step, or -1 when the order is closed (cancelled). */
export function stepIndex(order: Pick<Order, 'status' | 'isOffer' | 'cancelled'>): number {
  switch (bucketOf(order)) {
    case 'offers':
      return 0;
    case 'preparing':
      return 1;
    case 'packed':
      return 2;
    case 'completed':
      return 3;
    default:
      return -1;
  }
}

export function unitCount(order: Pick<Order, 'items'> | null | undefined): number {
  return (order?.items ?? []).reduce((n, it) => n + (Number(it.quantity) || 0), 0);
}

export function unitsLabel(n: number): string {
  return `${n} ${n === 1 ? 'unit' : 'units'}`;
}

export function itemsSummary(order: Pick<Order, 'items'>, max = 2): string {
  const items = order.items ?? [];
  const names = items.slice(0, max).map(it => `${it.productName} x${it.quantity}`);
  const more = items.length - max;
  return more > 0 ? `${names.join(', ')} +${more} more` : names.join(', ');
}

export const formatINR = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

/** "Placed 4 min ago" style age. */
export function formatAgo(timestamp: number | undefined, now = Date.now()): string {
  if (!timestamp) return '';
  const diff = Math.max(0, now - timestamp);
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  return `on ${new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

export function formatClock(timestamp: number | undefined): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function formatDayTime(timestamp: number | undefined, now = Date.now()): string {
  if (!timestamp) return '';
  if (isToday(timestamp, now)) return `Today, ${formatClock(timestamp)}`;
  return `${new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${formatClock(timestamp)}`;
}

export function startOfDay(now = Date.now()): number {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function isToday(timestamp: number | undefined, now = Date.now()): boolean {
  return !!timestamp && timestamp >= startOfDay(now);
}

/** Rejects with a TimeoutError if the promise takes longer than ms. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error('timeout');
      err.name = 'TimeoutError';
      reject(err);
    }, ms);
    promise.then(
      v => { clearTimeout(timer); resolve(v); },
      e => { clearTimeout(timer); reject(e); },
    );
  });
}

// ── Stock coverage (computed on this device from the store's inventory) ─────────

export interface CoverageLine {
  productId: string;
  title: string;
  need: number;
  have: number;
}

export type Coverage =
  | { kind: 'unknown' }
  | { kind: 'covered' }
  | { kind: 'short'; lines: CoverageLine[] };

/**
 * Whether the store's recorded stock covers every item of an order. An item counts as
 * available only when the product is on (isAvailable) and has enough stock. The server
 * checks again when the vendor accepts; this is a hint, not a promise.
 */
export function stockCoverage(
  order: Pick<Order, 'items'>,
  inventory: Record<string, InventoryRecord>,
  inventoryLoaded: boolean,
): Coverage {
  if (!inventoryLoaded) return { kind: 'unknown' };
  const need = new Map<string, { title: string; qty: number }>();
  for (const it of order.items) {
    const prev = need.get(it.productId);
    need.set(it.productId, { title: it.productName, qty: (prev?.qty ?? 0) + it.quantity });
  }
  const lines: CoverageLine[] = [];
  need.forEach((v, productId) => {
    const rec = inventory[productId];
    const have = rec && rec.isAvailable ? rec.stock : 0;
    if (have < v.qty) lines.push({ productId, title: v.title, need: v.qty, have });
  });
  return lines.length ? { kind: 'short', lines } : { kind: 'covered' };
}
