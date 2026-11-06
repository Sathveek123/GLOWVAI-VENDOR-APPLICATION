/**
 * GlowVai Vendor App: shared state for orders and inventory.
 *
 * Orders arrive only from GET /api/vendor/orders (the VendorOrder projection, see
 * docs/VENDOR_API.md) and are written here by the polling controller in
 * src/features/orders/sync.ts and by accept / decline / packed results.
 * Inventory arrives from GET /api/vendor/inventory (src/features/catalog/inventory.ts).
 *
 * Privacy (PRD 3.3, 9.1): normalizeOrder keeps an allow-list of fields, so a customer's phone,
 * address, location, email or payment ids never reach the UI even if a server sent them.
 * The customer's first name is kept only on orders this store has accepted.
 */
import { create } from 'zustand';
import type { InventoryRecord } from '../services/vendorApi/inventory';

// ── Orders ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  productId: string;
  productName: string;
  brand?: string;
  quantity: number;
  /** Unit price of the item (₹). */
  price: number;
  imageUrl?: string;
}

/** A vendor-safe order (the server's VendorOrder projection, with safe types). */
export interface Order {
  orderId: string;
  /** What to show and match with GlowVai (the server sends the order id). */
  reference: string;
  status: string;
  vendorStatus?: string;
  /** True while the order is an open offer to this store. */
  isOffer: boolean;
  items: OrderItem[];
  itemCount: number;
  /** Sum of unit price x quantity. Not the customer's bill and not the store's earnings. */
  itemsValue: number;
  placedAt: number;
  updatedAt: number;
  acceptedAt?: number;
  packedAt?: number;
  /** First name only, and only after this store accepted the order. */
  customerFirstName?: string;
  cancelled: boolean;
  cancellationReason?: string;
}

function num(value: unknown): number | undefined {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * Maps a VendorOrder from the server into the app's order shape. Only the projection's
 * fields are read; anything else on the object is dropped.
 */
export function normalizeOrder(raw: any): Order {
  const r = raw || {};
  const items: OrderItem[] = (Array.isArray(r.items) ? r.items : []).map((it: any) => ({
    productId: text(it?.productId) || '',
    productName: text(it?.title) || 'Unnamed item',
    brand: text(it?.brand),
    quantity: Math.max(0, Math.floor(num(it?.quantity) ?? 0)),
    price: num(it?.unitPrice) ?? 0,
    imageUrl: text(it?.imageUrl) && /^https?:\/\//i.test(String(it.imageUrl)) ? String(it.imageUrl).trim() : undefined,
  }));
  const orderId = text(r.orderId) || '';
  const status = text(r.status) || 'UNKNOWN';
  const isOffer = r.isOffer === true;
  const cancelled = r.cancelled === true || status === 'CANCELLED';
  const computedValue = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const firstName = !isOffer ? text(r.customerFirstName)?.split(/\s+/)[0] : undefined;
  return {
    orderId,
    reference: text(r.reference) || orderId,
    status,
    vendorStatus: text(r.vendorStatus),
    isOffer,
    items,
    itemCount: num(r.itemCount) ?? items.reduce((n, it) => n + it.quantity, 0),
    itemsValue: num(r.itemsValue) ?? computedValue,
    placedAt: num(r.placedAt) ?? 0,
    updatedAt: num(r.updatedAt) ?? 0,
    acceptedAt: num(r.acceptedAt),
    packedAt: num(r.packedAt),
    customerFirstName: firstName,
    cancelled,
    cancellationReason: cancelled ? text(r.cancellationReason) : undefined,
  };
}

export interface OrdersPageInput {
  offers: unknown[];
  orders: unknown[];
  removed: string[];
  full: boolean;
}

export type SyncState = 'idle' | 'loading' | 'ready' | 'error';

export interface OrdersSyncStatus {
  state: SyncState;
  /** True once one load has succeeded since sign-in. */
  hasLoaded: boolean;
  /** Friendly copy for the last failed refresh; the last good list is kept. */
  error: string | null;
  lastSyncedAt: number;
}

// ── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryStatus {
  state: SyncState;
  hasLoaded: boolean;
  error: string | null;
  loadedAt: number;
}

// ── Legacy profile (onboarding still writes it; screens read useVendorMe instead) ──

export interface VendorProfile {
  vendorId: string;
  name: string;
  storeId: string;
  phone: string;
  email?: string;
  isOnline: boolean;
  shopName?: string;
  city?: string;
  [key: string]: unknown;
}

// ── Store ────────────────────────────────────────────────────────────────────

interface VendorStore {
  orders: Order[];
  ordersSync: OrdersSyncStatus;
  /** Offers this store declined or closed out this session. They are not offered again. */
  dismissedOffers: Record<string, true>;
  applyOrdersPage: (page: OrdersPageInput) => void;
  upsertOrder: (order: Order) => void;
  removeOrders: (orderIds: string[]) => void;
  dismissOffer: (orderId: string) => void;
  /** Drops open offers (the store went offline, so it is no longer offered anything). */
  clearOffers: () => void;
  setOrdersSync: (patch: Partial<OrdersSyncStatus>) => void;

  inventory: Record<string, InventoryRecord>;
  inventoryStatus: InventoryStatus;
  replaceInventory: (records: InventoryRecord[]) => void;
  mergeInventory: (records: InventoryRecord[]) => void;
  setInventoryStatus: (patch: Partial<InventoryStatus>) => void;

  /** True when the last presence heartbeat failed (GlowVai may stop sending offers). */
  heartbeatFailed: boolean;
  setHeartbeatFailed: (v: boolean) => void;

  vendor: VendorProfile | null;
  setVendor: (v: VendorProfile) => void;

  /** Clears everything (sign-out). */
  reset: () => void;
}

const initialSync: OrdersSyncStatus = { state: 'idle', hasLoaded: false, error: null, lastSyncedAt: 0 };
const initialInventory: InventoryStatus = { state: 'idle', hasLoaded: false, error: null, loadedAt: 0 };

function byId(list: Order[]): Map<string, Order> {
  return new Map(list.map(o => [o.orderId, o]));
}

/** The newer of two copies of an order (polls overlap by 5 seconds, so an older copy can arrive late). */
function newer(current: Order | undefined, incoming: Order): Order {
  if (!current) return incoming;
  if (incoming.updatedAt && current.updatedAt && incoming.updatedAt < current.updatedAt) return current;
  return incoming;
}

const useVendorStore = create<VendorStore>((set) => ({
  orders: [],
  ordersSync: initialSync,
  dismissedOffers: {},

  applyOrdersPage: (page) =>
    set((s) => {
      const incoming = [...page.orders, ...page.offers]
        .map(normalizeOrder)
        .filter(o => !!o.orderId && !(o.isOffer && s.dismissedOffers[o.orderId]));
      if (page.full) {
        const map = new Map<string, Order>();
        // Own orders win over an offer copy of the same order.
        for (const o of incoming) if (!map.has(o.orderId) || !o.isOffer) map.set(o.orderId, o);
        return { orders: [...map.values()] };
      }
      const map = byId(s.orders);
      for (const o of incoming) map.set(o.orderId, newer(map.get(o.orderId), o));
      // "removed": the server says the order is neither this store's nor offered to it any more.
      for (const id of page.removed || []) map.delete(id);
      return { orders: [...map.values()] };
    }),

  upsertOrder: (order) =>
    set((s) => {
      if (!order.orderId) return {};
      const map = byId(s.orders);
      map.set(order.orderId, newer(map.get(order.orderId), order));
      return { orders: [...map.values()] };
    }),

  removeOrders: (ids) =>
    set((s) => {
      const drop = new Set(ids);
      return { orders: s.orders.filter(o => !drop.has(o.orderId)) };
    }),

  dismissOffer: (orderId) =>
    set((s) => ({
      dismissedOffers: { ...s.dismissedOffers, [orderId]: true },
      orders: s.orders.filter(o => !(o.orderId === orderId && o.isOffer)),
    })),

  clearOffers: () => set((s) => ({ orders: s.orders.filter(o => !o.isOffer) })),

  setOrdersSync: (patch) => set((s) => ({ ordersSync: { ...s.ordersSync, ...patch } })),

  inventory: {},
  inventoryStatus: initialInventory,
  replaceInventory: (records) =>
    set({ inventory: Object.fromEntries(records.map(r => [r.productId, r])) }),
  mergeInventory: (records) =>
    set((s) => ({ inventory: { ...s.inventory, ...Object.fromEntries(records.map(r => [r.productId, r])) } })),
  setInventoryStatus: (patch) => set((s) => ({ inventoryStatus: { ...s.inventoryStatus, ...patch } })),

  heartbeatFailed: false,
  setHeartbeatFailed: (heartbeatFailed) => set({ heartbeatFailed }),

  vendor: null,
  setVendor: (vendor) => set((s) => ({ vendor: { ...(s.vendor || {}), ...vendor } })),

  reset: () =>
    set({
      orders: [],
      ordersSync: initialSync,
      dismissedOffers: {},
      inventory: {},
      inventoryStatus: initialInventory,
      heartbeatFailed: false,
      vendor: null,
    }),
}));

export default useVendorStore;
