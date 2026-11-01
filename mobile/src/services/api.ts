/**
 * GlowVAI Vendor App — API Service
 * All HTTP calls to the vendor backend
 */

import { getSessionToken } from './session';

const BASE_URL = (process.env.EXPO_PUBLIC_VENDOR_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

/** Error with the HTTP status and the backend's error code, when there is one. */
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Sends the vendor session token (from OTP sign-in or onboarding) on every call.
async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = await getSessionToken();
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const res  = await fetch(url, {
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }
  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    throw new ApiError(message, res.status, data?.code || (typeof data?.error === 'string' && data?.message ? data.error : undefined));
  }
  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface VendorLoginResponse {
  ok: boolean;
  token: string;
  phone: string;
  registered: boolean;
  vendorId: string | null;
  storeId: string | null;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  kycRejectionReason: string | null;
}

export const authApi = {
  /** Development/mock backends accept the test OTP; production expects a Firebase phone-auth ID token. */
  login: (body: { phone: string; otp: string } | { firebaseIdToken: string }) =>
    apiFetch<VendorLoginResponse>('/api/auth/vendor/login', {
      method: 'POST',
      body:   JSON.stringify(body),
    }),
};

// ── Vendor ────────────────────────────────────────────────────────────────────
export const vendorApi = {
  /** The signed-in vendor (includes kycStatus and kycRejectionReason). */
  me: () => apiFetch('/api/vendor/me'),

  getProfile: (vendorId: string) =>
    apiFetch(`/api/vendor/${vendorId}`),

  setStatus: (vendorId: string, isOnline: boolean, reason?: string) =>
    apiFetch(`/api/vendor/${vendorId}/status`, {
      method: 'PATCH',
      body:   JSON.stringify({ isOnline, reason }),
    }),

  updateFcmToken: (vendorId: string, fcmToken: string) =>
    apiFetch(`/api/vendor/${vendorId}/fcm-token`, {
      method: 'PATCH',
      body:   JSON.stringify({ fcmToken }),
    }),

  updateProfile: (vendorId: string, profile: Record<string, any>) =>
    apiFetch(`/api/vendor/${vendorId}`, {
      method: 'PATCH',
      body:   JSON.stringify(profile),
    }),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll: (filters?: { storeId?: string; status?: string }) => {
    const params = new URLSearchParams(filters as Record<string, string>).toString();
    return apiFetch(`/api/orders${params ? '?' + params : ''}`);
  },

  getPending: () => apiFetch('/api/orders/pending'),

  getById: (orderId: string) => apiFetch(`/api/orders/${orderId}`),

  accept: (orderId: string, vendorId: string) =>
    apiFetch(`/api/orders/${orderId}/accept`, {
      method: 'PATCH',
      body:   JSON.stringify({ vendorId }),
    }),

  reject: (orderId: string, vendorId: string, reason: string) =>
    apiFetch(`/api/orders/${orderId}/reject`, {
      method: 'PATCH',
      body:   JSON.stringify({ vendorId, reason }),
    }),

  prepare: (orderId: string, vendorId: string) =>
    apiFetch(`/api/orders/${orderId}/prepare`, {
      method: 'PATCH',
      body:   JSON.stringify({ vendorId }),
    }),

  ready: (orderId: string, vendorId: string, pickupBay?: string) =>
    apiFetch(`/api/orders/${orderId}/ready`, {
      method: 'PATCH',
      body:   JSON.stringify({ vendorId, pickupBay }),
    }),

  handover: (orderId: string, rider?: { riderId?: string; riderName?: string; riderPhone?: string }) =>
    apiFetch(`/api/orders/${orderId}/handover`, {
      method: 'PATCH',
      body:   JSON.stringify(rider || {}),
    }),

  pack: (orderId: string, vendorId: string, pickupBay?: string) =>
    apiFetch(`/api/orders/${orderId}/pack`, {
      method: 'PATCH',
      body:   JSON.stringify({ vendorId, pickupBay }),
    }),

  dispatch: (orderId: string, rider: { riderId?: string; riderName?: string; riderPhone?: string; otp?: string }) =>
    apiFetch(`/api/orders/${orderId}/dispatch`, {
      method: 'PATCH',
      body:   JSON.stringify(rider),
    }),

  deliver: (orderId: string, otp: string) =>
    apiFetch(`/api/orders/${orderId}/deliver`, {
      method: 'PATCH',
      body:   JSON.stringify({ otp }),
    }),

  cancel: (orderId: string, reason: string) =>
    apiFetch(`/api/orders/${orderId}/cancel`, {
      method: 'PATCH',
      body:   JSON.stringify({ reason }),
    }),

  timeout: (orderId: string) =>
    apiFetch(`/api/orders/${orderId}/timeout`, {
      method: 'PATCH',
    }),
};

// ── Inventory ─────────────────────────────────────────────────────────────────
export const inventoryApi = {
  getAll: (storeId?: string) =>
    apiFetch(`/api/inventory${storeId ? '?storeId=' + storeId : ''}`),

  add: (item: Record<string, any>) =>
    apiFetch('/api/inventory', {
      method: 'POST',
      body:   JSON.stringify(item),
    }),

  bulkUpload: (items: any[], csvText?: string, storeId?: string) =>
    apiFetch('/api/inventory/bulk-upload', {
      method: 'POST',
      body:   JSON.stringify({ items, csvText, storeId }),
    }),

  update: (productId: string, fields: Record<string, any>) =>
    apiFetch(`/api/inventory/${productId}`, {
      method: 'PATCH',
      body:   JSON.stringify(fields),
    }),

  adjustStock: (productId: string, delta: number, reason?: string) =>
    apiFetch(`/api/inventory/${productId}/stock`, {
      method: 'PATCH',
      body:   JSON.stringify({ delta, reason }),
    }),

  setStockExact: (productId: string, exactQuantity: number, reason?: string) =>
    apiFetch(`/api/inventory/${productId}/stock`, {
      method: 'PATCH',
      body:   JSON.stringify({ exactQuantity, reason }),
    }),

  deactivate: (productId: string) =>
    apiFetch(`/api/inventory/${productId}`, { method: 'DELETE' }),
};

// ── Uploads ───────────────────────────────────────────────────────────────────
export interface PickedImage {
  uri: string;
  name: string;
  mimeType: string;
  /** Present on web: the browser File from the picker. */
  file?: Blob;
}

export const uploadsApi = {
  /** Uploads one product photo (JPEG, PNG or WebP, max 5 MB). Returns its public URL. */
  image: async (img: PickedImage): Promise<{ ok: boolean; url: string }> => {
    const form = new FormData();
    if (img.file) {
      form.append('file', img.file, img.name);
    } else {
      // React Native's FormData accepts { uri, name, type } for local files.
      form.append('file', { uri: img.uri, name: img.name, type: img.mimeType } as any);
    }
    return apiFetch('/api/uploads/image', { method: 'POST', body: form });
  },
};

// ── Onboarding ────────────────────────────────────────────────────────────────
export const onboardingApi = {
  submit: (payload: Record<string, any>) =>
    apiFetch('/api/onboarding/submit', {
      method: 'POST',
      body:   JSON.stringify(payload),
    }),
};

// ── Earnings ──────────────────────────────────────────────────────────────────
export const earningsApi = {
  getSummary: (vendorId: string) => apiFetch(`/api/earnings/${vendorId}`),

  getHistory: (vendorId: string, from?: string, to?: string) => {
    const params = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
    return apiFetch(`/api/earnings/${vendorId}/history${params ? '?' + params : ''}`);
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (vendorId: string) => apiFetch(`/api/notifications/${vendorId}`),

  markRead: (notificationId: string) =>
    apiFetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: (storeId: string) => apiFetch(`/api/analytics/${storeId}`),
};

// ── Test / Simulation ─────────────────────────────────────────────────────────
export const testApi = {
  simulateOrder: (storeId?: string, vendorId?: string) =>
    apiFetch('/api/test/simulate-order', {
      method: 'POST',
      body:   JSON.stringify({ storeId, vendorId }),
    }),
};

export const healthApi = {
  check: () => apiFetch('/health'),
};

export default {
  BASE_URL,
  authApi,
  uploadsApi,
  vendorApi,
  ordersApi,
  inventoryApi,
  earningsApi,
  notificationsApi,
  analyticsApi,
  testApi,
  healthApi,
};
