/**
 * GlowVAI Vendor App — Global Zustand Store
 * State for: vendor profile, orders, inventory, earnings, notifications, UI
 */
import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'PACKED'
  | 'READY_FOR_PICKUP'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  sku?: string;
}

export interface Order {
  orderId: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: { fullAddress: string; lat?: number; lng?: number };
  items: OrderItem[];
  pricing: {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    grandTotal: number;
  };
  payment: { method: string; status: string };
  status: OrderStatus;
  otp: string;
  storeId: string;
  vendorId: string;
  createdAt: number;
  updatedAt: number;
  acceptedAt?: number;
  packedAt?: number;
  dispatchedAt?: number;
  deliveredAt?: number;
  pickupBay?: string;
  isSimulated?: boolean;
  timeline?: { status: string; timestamp: number; note?: string }[];
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
  incomingOrder: Order | null;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, fields: Partial<Order>) => void;
  setIncomingOrder: (order: Order | null) => void;
  dismissIncomingOrder: () => void;

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
  activeOrderTab: 'New' | 'Accepted' | 'Ready' | 'Completed' | 'Cancelled';
  setActiveOrderTab: (t: 'New' | 'Accepted' | 'Ready' | 'Completed' | 'Cancelled') => void;
}

const useVendorStore = create<VendorStore>((set, get) => ({
  // Vendor
  vendor: {
    vendorId: 'VND-001',
    name: 'Dark Store Merchant',
    storeId: 'DS-VIJ-01',
    phone: '8977855998',
    shopName: 'GlowVAI Dark Store Hub #1',
    locality: 'Benz Circle Hub, Vijayawada',
    city: 'Vijayawada',
    isOnline: true,
  },
  setVendor: (vendor) => set((s) => ({ vendor: { ...(s.vendor || {}), ...vendor } })),
  setOnlineStatus: (isOnline) =>
    set((s) => ({
      vendor: s.vendor ? { ...s.vendor, isOnline } : {
        vendorId: 'VND-001',
        name: 'Dark Store Merchant',
        storeId: 'DS-VIJ-01',
        phone: '8977855998',
        shopName: 'GlowVAI Dark Store Hub #1',
        locality: 'Benz Circle Hub, Vijayawada',
        city: 'Vijayawada',
        isOnline,
      },
    })),

  // Orders
  orders: [],
  incomingOrder: null,
  setOrders: (orders) => set({ orders }),
  addOrder: (order) =>
    set((s) => ({
      orders: [order, ...s.orders.filter((o) => o.orderId !== order.orderId)],
    })),
  updateOrder: (orderId, fields) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.orderId === orderId ? { ...o, ...fields } : o
      ),
    })),
  setIncomingOrder: (order) => set({ incomingOrder: order }),
  dismissIncomingOrder: () => set({ incomingOrder: null }),

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
  activeOrderTab: 'New',
  setActiveOrderTab: (activeOrderTab) => set({ activeOrderTab }),
}));

export default useVendorStore;
