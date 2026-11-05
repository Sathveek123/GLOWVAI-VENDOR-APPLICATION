/**
 * Order flow: status buckets, labels and small formatters shared by Home, Orders,
 * Pick & pack, Ready for pickup and the incoming offer sheet.
 * File: mobile/src/features/orders/model.ts
 */
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { Order } from '../../store/useVendorStore';
import { ApiError } from '../../services/api';

export type OrderBucket = 'incoming' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'other';

/** Maps both vocabularies (vendor backend and GlowVai shop) to the five vendor tabs. */
const BUCKET_BY_STATUS: Record<string, OrderBucket> = {
  PENDING: 'incoming',
  PLACED: 'incoming',
  VENDOR_PENDING: 'incoming',
  ACCEPTED: 'preparing',
  VENDOR_ACCEPTED: 'preparing',
  PREPARING: 'preparing',
  PACKED: 'ready',
  READY_FOR_PICKUP: 'ready',
  DISPATCHED: 'completed',
  OUT_FOR_DELIVERY: 'completed',
  DELIVERED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'cancelled',
  VENDOR_REJECTED: 'cancelled',
  VENDOR_TIMEOUT: 'cancelled',
};

export function bucketOf(status: string | undefined): OrderBucket {
  return (status && BUCKET_BY_STATUS[status]) || 'other';
}

type IconName = keyof typeof Ionicons.glyphMap;
export type StatusTone = 'action' | 'progress' | 'success' | 'neutral' | 'danger';

export interface StatusMeta {
  label: string;
  icon: IconName;
  tone: StatusTone;
}

const STATUS_META: Record<string, StatusMeta> = {
  PENDING: { label: 'New offer', icon: 'notifications-outline', tone: 'action' },
  PLACED: { label: 'New offer', icon: 'notifications-outline', tone: 'action' },
  VENDOR_PENDING: { label: 'New offer', icon: 'notifications-outline', tone: 'action' },
  ACCEPTED: { label: 'To pack', icon: 'basket-outline', tone: 'progress' },
  VENDOR_ACCEPTED: { label: 'To pack', icon: 'basket-outline', tone: 'progress' },
  PREPARING: { label: 'Picking', icon: 'basket-outline', tone: 'progress' },
  PACKED: { label: 'Packed, awaiting rider', icon: 'cube-outline', tone: 'progress' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', icon: 'cube-outline', tone: 'progress' },
  DISPATCHED: { label: 'With rider', icon: 'bicycle-outline', tone: 'success' },
  OUT_FOR_DELIVERY: { label: 'With rider', icon: 'bicycle-outline', tone: 'success' },
  DELIVERED: { label: 'Delivered', icon: 'checkmark-circle-outline', tone: 'success' },
  CANCELLED: { label: 'Cancelled', icon: 'close-circle-outline', tone: 'danger' },
  REJECTED: { label: 'Declined', icon: 'close-circle-outline', tone: 'neutral' },
  VENDOR_REJECTED: { label: 'Declined', icon: 'close-circle-outline', tone: 'neutral' },
  VENDOR_TIMEOUT: { label: 'Offer expired', icon: 'time-outline', tone: 'neutral' },
};

export function statusMeta(status: string | undefined): StatusMeta {
  return (status && STATUS_META[status]) || { label: 'Updating', icon: 'sync-outline', tone: 'neutral' };
}

/** Orders tabs, in PRD screen 11 order. */
export const ORDER_TABS: { key: Exclude<OrderBucket, 'other'>; label: string }[] = [
  { key: 'incoming', label: 'Incoming' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready for pickup' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

/** Steps shown in the order stepper. */
export const ORDER_STEPS = ['Offer', 'Pick & pack', 'Ready for pickup', 'With rider'] as const;

/** Index of the current step, or -1 when the order is closed (cancelled or declined). */
export function stepIndex(status: string | undefined): number {
  switch (bucketOf(status)) {
    case 'incoming':
      return 0;
    case 'preparing':
      return 1;
    case 'ready':
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

export const formatINR = (value: number) =>
  `₹${Math.round(value).toLocaleString('en-IN')}`;

export function formatAgo(timestamp: number | undefined, now = Date.now()): string {
  if (!timestamp) return '';
  const diff = now - timestamp;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  return new Date(timestamp).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export function formatClock(timestamp: number | undefined): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function isToday(timestamp: number | undefined, now = Date.now()): boolean {
  if (!timestamp) return false;
  const d = new Date(now);
  return timestamp >= new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Estimated earnings, only when the server sent a number. */
export function serverEarnings(order: Pick<Order, 'pricing'> | null | undefined): number | undefined {
  const v = order?.pricing?.vendorEarnings;
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/** Friendly copy for any failed request. Raw server text is never shown. */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Try again.'): string {
  const e = err as { status?: number; message?: string; name?: string } | null;
  if (e && e.name === 'TimeoutError') {
    return 'The server did not answer in time. Check your connection, then try again.';
  }
  if (err instanceof ApiError || typeof e?.status === 'number') {
    const status = (e as { status: number }).status;
    if (status === 401 || status === 403) return 'Your session has ended. Sign in again to continue.';
    if (status === 404) return 'We could not find this order. It may have been removed.';
    if (status >= 500) return 'GlowVai is having trouble right now. Try again in a moment.';
    return fallback;
  }
  // fetch() network failures: "Failed to fetch", "Network request failed", TypeError
  return 'We could not reach GlowVai. Check your internet connection and try again.';
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

/** True when an accept failed because the order is no longer open to this store. */
export function isOfferGone(err: unknown): boolean {
  const e = err as { status?: number; code?: string } | null;
  return !!e && (e.code === 'ORDER_ALREADY_ASSIGNED' || e.status === 409 || e.status === 410);
}

/** True when the server says another store holds the order. */
export function isTakenByOther(err: unknown): boolean {
  const e = err as { status?: number; code?: string; message?: string } | null;
  if (!e) return false;
  if (e.code === 'ORDER_ALREADY_ASSIGNED') return true;
  return e.status === 409 && /ACCEPTED|ASSIGNED|PREPARING|PACKED/i.test(e.message || '');
}

/** Decline reasons (PRD 3.2: a reason is required). */
export const DECLINE_REASONS = [
  'Item out of stock',
  'Store too busy',
  'Closing soon',
  'Other',
] as const;
