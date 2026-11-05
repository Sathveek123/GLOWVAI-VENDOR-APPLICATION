/**
 * GlowVAI Vendor App — Global Zustand Store
 * State for: vendor profile, orders, inventory, earnings, notifications, UI
 */
import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Order statuses the vendor app understands. The vendor backend writes the first group;
 * the GlowVai shop writes the second. Anything else is shown as "Updating".
 */
export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'PACKED'
  | 'READY_FOR_PICKUP'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'VENDOR_TIMEOUT'
  | 'PLACED'
  | 'VENDOR_PENDING'
  | 'VENDOR_ACCEPTED'
  | 'VENDOR_REJECTED'
  | 'OUT_FOR_DELIVERY';

export interface OrderItem {
  productId?: string;
  sku?: string;
  productName: string;
  /** Shade, size or variant, when the order carries one. */
  variant?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  bin?: string;
}

/** Delivery partner details needed for handover. Never a phone number. */
export interface OrderRider {
  name?: string;
  partner?: string;
  etaMinutes?: number;
  status?: string;
}

/**
 * A vendor-safe order. The customer's phone, precise address, location and delivery
 * OTP are never kept here (PRD 3.3, 9.1): normalizeOrder drops them on the way in.
 */
export interface Order {
  orderId: string;
  status: OrderStatus | (string & {});
  /** First name only, and only shown after the order is accepted. */
  customerFirstName?: string;
  items: OrderItem[];
  pricing?: {
    subtotal?: number;
    grandTotal?: number;
    discount?: number;
    /** Estimated vendor earnings, only when the server sends it. */
    vendorEarnings?: number;
  };
  storeId?: string;
  vendorId?: string;
  createdAt: number;
  updatedAt?: number;
  acceptedAt?: number;
  preparingAt?: number;
  packedAt?: number;
  readyAt?: number;
  dispatchedAt?: number;
  deliveredAt?: number;
  pickupBay?: string;
  packageRef?: string;
  /** Preparation target in minutes, only when the server sends it. */
  prepTimeMinutes?: number;
  /** When the offer stops being acceptable (server time, ms). */
  offerExpiresAt?: number;
  /** Packing-relevant instructions only. */
  packingInstructions?: string;
  rider?: OrderRider;
  rejectionReason?: string;
  timeline?: { status: string; timestamp: number; note?: string }[];
}

function toMs(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const asNum = Number(value);
    if (value.trim() !== '' && Number.isFinite(asNum)) return asNum;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  // Firestore Timestamp shapes
  const v = value as { toMillis?: () => number; seconds?: number; _seconds?: number };
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  if (typeof v._seconds === 'number') return v._seconds * 1000;
  return undefined;
}

function num(value: unknown): number | undefined {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * Maps a raw order from the vendor backend or the GlowVai shop into the vendor-safe shape.
 * Drops the customer's phone, address, coordinates and OTPs so they never reach the UI.
 * (The API must stop sending them too; hiding them here is defence in depth.)
 */
export function normalizeOrder(raw: any): Order {
  const r = raw || {};
  const items: OrderItem[] = (Array.isArray(r.items) ? r.items : []).map((it: any) => ({
    productId: text(it?.productId),
    sku: text(it?.sku),
    productName: text(it?.productName) || text(it?.title) || text(it?.name) || 'Unnamed item',
    variant: text(it?.variant) || text(it?.shade) || text(it?.size),
    quantity: num(it?.quantity) ?? 1,
    price: num(it?.price) ?? num(it?.unitPrice) ?? 0,
    imageUrl: text(it?.imageUrl) || text(it?.image),
    bin: text(it?.bin),
  }));
  const p = r.pricing || {};
  const riderSrc = r.rider || r.deliveryAssignment || null;
  const rider: OrderRider | undefined = riderSrc
    ? {
        name: text(riderSrc.name) || text(riderSrc.riderName),
        partner: text(riderSrc.partner) || text(riderSrc.deliveryPartnerType) || text(riderSrc.partnerName),
        etaMinutes: num(riderSrc.etaMinutes) ?? num(riderSrc.estimatedArrivalMinutes),
        status: text(riderSrc.status),
      }
    : undefined;
  const fullName = text(r.customerFirstName) || text(r.customerName);
  return {
    orderId: String(r.orderId || r.id || ''),
    status: text(r.status) || 'PENDING',
    customerFirstName: fullName ? fullName.split(/\s+/)[0] : undefined,
    items,
    pricing: {
      subtotal: num(p.subtotal),
      grandTotal: num(p.grandTotal),
      discount: num(p.discount) ?? num(p.discountAmount),
      vendorEarnings: num(p.vendorEarnings) ?? num(r.vendorEarnings),
    },
    storeId: text(r.storeId),
    vendorId: text(r.vendorId),
    createdAt: toMs(r.createdAt) ?? 0,
    updatedAt: toMs(r.updatedAt),
    acceptedAt: toMs(r.acceptedAt) ?? toMs(r.vendorAcceptedAt),
    preparingAt: toMs(r.preparingAt),
    packedAt: toMs(r.packedAt) ?? toMs(r.vendorPackedAt),
    readyAt: toMs(r.readyAt),
    dispatchedAt: toMs(r.dispatchedAt) ?? toMs(r.pickedUpAt),
    deliveredAt: toMs(r.deliveredAt),
    pickupBay: text(r.pickupBay),
    packageRef: text(r.packageRef),
    prepTimeMinutes: num(r.prepTimeMinutes) ?? num(r.packTargetMinutes) ?? num(r.preparationTimeMinutes),
    offerExpiresAt: toMs(r.offerExpiresAt) ?? toMs(r.expiresAt),
    // Only packing notes. Customer delivery notes can hold address details, so they are not read.
    packingInstructions: text(r.packingInstructions),
    rider: rider && (rider.name || rider.partner || rider.etaMinutes != null || rider.status) ? rider : undefined,
    rejectionReason: text(r.rejectionReason) || text(r.vendorRejectionReason),
    timeline: Array.isArray(r.timeline)
      ? r.timeline.map((t: any) => ({ status: String(t?.status || ''), timestamp: toMs(t?.timestamp) ?? 0, note: text(t?.note) }))
      : undefined,
  };
}

export interface InventoryItem {
  productId: string;
  name: string;
  category: string;
  sku: string;
  mrp: number;
  sellingPrice: number;
  stock: number;
  bin: string;
  gstPercent: number;
  images: string[];
  active: boolean;
  description?: string;
  brand?: string;
  expiryDate?: string;
  updatedAt: number;
  // Marketplace fields (set by the backend)
  vendorId?: string;
  storeId?: string;
  shopCategory?: string | null;
  packSize?: string;
  keyActives?: string[];
  status?: 'active' | 'paused' | 'deleted';
  stockOnHand?: number;
  availableStock?: number;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  listing?: { live: boolean; blockers: string[] };
}

export interface VendorProfile {
  vendorId: string;
  name: string;
  storeId: string;
  phone: string;
  email?: string;
  address?: string;
  isOnline: boolean;
  fcmToken?: string;
  shopName?: string;
  shopType?: string;
  city?: string;
  locality?: string;
  pincode?: string;
  openTime?: string;
  closeTime?: string;
  rating?: number;
  totalOrders?: number;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  joinedAt?: number;
  avatarUrl?: string;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  gstin?: string;
  fssai?: string;
  panNumber?: string;
}

export interface Notification {
  id: string;
  vendorId?: string;
  type: 'NEW_ORDER' | 'ORDER_CANCELLED' | 'PAYOUT' | 'SYSTEM' | string;
  title: string;
  body: string;
  orderId?: string;
  read: boolean;
  createdAt: number;
}

export interface EarningsSummary {
  today: { orders: number; revenue: number; earnings: number };
  weekly: { date: string; orders: number; revenue: number; earnings: number }[];
  total: { orders: number; revenue: number; earnings: number; pendingPayout: number };
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface VendorStore {
  // Vendor
  vendor: VendorProfile | null;
  setVendor: (v: VendorProfile) => void;
  setOnlineStatus: (v: boolean) => void;

  // Orders
  orders: Order[];
  /** Replaces the order list. Raw API orders are normalised (customer contact data dropped). */
  setOrders: (orders: any[]) => void;
  /** Adds or replaces one order from a raw API or socket payload. */
  upsertOrder: (order: any) => void;
  updateOrder: (orderId: string, fields: Partial<Order>) => void;

  // Inventory
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[] | ((prev: InventoryItem[]) => InventoryItem[])) => void;
  updateInventoryItem: (productId: string, fields: Partial<InventoryItem>) => void;
  removeInventoryItem: (productId: string) => void;
  addInventoryItem: (item: InventoryItem) => void;

  // Earnings
  earnings: EarningsSummary | null;
  setEarnings: (e: EarningsSummary) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  unreadCount: () => number;

  // UI
  isConnected: boolean;
  setConnected: (v: boolean) => void;
  isLoading: boolean;
  setLoading: (v: boolean) => void;
}

const useVendorStore = create<VendorStore>((set, get) => ({
  // Vendor
  vendor: null,
  setVendor: (vendor) => set((s) => ({ vendor: { ...(s.vendor || {}), ...vendor } })),
  setOnlineStatus: (isOnline) =>
    set((s) => ({
      vendor: s.vendor ? { ...s.vendor, isOnline } : null,
    })),

  // Orders
  orders: [],
  setOrders: (orders) =>
    set({ orders: (Array.isArray(orders) ? orders : []).map(normalizeOrder).filter((o) => !!o.orderId) }),
  upsertOrder: (raw) =>
    set((s) => {
      const order = normalizeOrder(raw);
      if (!order.orderId) return {};
      const exists = s.orders.some((o) => o.orderId === order.orderId);
      return {
        orders: exists
          ? s.orders.map((o) => (o.orderId === order.orderId ? order : o))
          : [order, ...s.orders],
      };
    }),
  updateOrder: (orderId, fields) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.orderId === orderId ? { ...o, ...fields } : o
      ),
    })),

  // Inventory
  inventory: [],
  setInventory: (inventory) =>
    set((s) => ({
      inventory: typeof inventory === 'function' ? inventory(s.inventory) : (Array.isArray(inventory) ? inventory : []),
    })),
  updateInventoryItem: (productId, fields) =>
    set((s) => ({
      inventory: (Array.isArray(s.inventory) ? s.inventory : []).map((i) =>
        i.productId === productId ? { ...i, ...fields } : i
      ),
    })),
  removeInventoryItem: (productId) =>
    set((s) => ({
      inventory: (Array.isArray(s.inventory) ? s.inventory : []).filter((i) => i.productId !== productId),
    })),
  addInventoryItem: (item) =>
    set((s) => ({ inventory: [item, ...(Array.isArray(s.inventory) ? s.inventory : [])] })),

  // Earnings
  earnings: null,
  setEarnings: (earnings) => set({ earnings }),

  // Notifications
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (n) =>
    set((s) => ({ notifications: [n, ...s.notifications] })),
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  // UI
  isConnected: false,
  setConnected: (isConnected) => set({ isConnected }),
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

export default useVendorStore;
