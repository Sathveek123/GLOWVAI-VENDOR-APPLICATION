/**
 * GlowVAI Vendor App — API Service
 * All HTTP calls to the vendor backend
 */

const BASE_URL = process.env.EXPO_PUBLIC_VENDOR_API_URL || 'http://localhost:4000';

async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res  = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data as T;
}

// ── Vendor ────────────────────────────────────────────────────────────────────
export const vendorApi = {
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
  vendorApi,
  ordersApi,
  inventoryApi,
  earningsApi,
  notificationsApi,
  analyticsApi,
  testApi,
  healthApi,
};
