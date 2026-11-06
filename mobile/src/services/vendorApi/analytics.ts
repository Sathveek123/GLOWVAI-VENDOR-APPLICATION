/**
 * Store analytics from GET /api/vendor/analytics?days=7|30. The server computes every number
 * from this store's own orders (bounded to the latest 500); the app only shows them. A null
 * metric means "no data yet" and is never shown as zero.
 */
import { vendorFetch } from './http';

export type AnalyticsDays = 7 | 30;

export interface DayCount {
  /** YYYY-MM-DD in India time. */
  date: string;
  orders: number;
  accepted: number;
  declined: number;
}

export interface TopItem {
  productId: string;
  title: string;
  quantity: number;
}

export interface Analytics {
  days: AnalyticsDays;
  from: number;
  to: number;
  timezone: string;
  ordersPerDay: DayCount[];
  totals: { orders: number; accepted: number; declined: number };
  averageAcceptSeconds: number | null;
  fulfilmentRate: number | null;
  fulfilled: number;
  itemsSold: TopItem[];
  orderValue: { amount: number; orderCount: number; label: string };
  bounds: { perQueryLimit: number; truncated: boolean };
  cachedAt: number;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const nullableNum = (v: unknown): number | null => {
  const n = Number(v);
  return v === null || v === undefined || !Number.isFinite(n) ? null : n;
};

export function normalizeAnalytics(raw: any): Analytics {
  const days: AnalyticsDays = raw?.days === 30 ? 30 : 7;
  return {
    days,
    from: num(raw?.from),
    to: num(raw?.to),
    timezone: typeof raw?.timezone === 'string' ? raw.timezone : 'Asia/Kolkata',
    ordersPerDay: (Array.isArray(raw?.ordersPerDay) ? raw.ordersPerDay : []).map((d: any) => ({
      date: String(d?.date ?? ''),
      orders: num(d?.orders),
      accepted: num(d?.accepted),
      declined: num(d?.declined),
    })),
    totals: { orders: num(raw?.totals?.orders), accepted: num(raw?.totals?.accepted), declined: num(raw?.totals?.declined) },
    averageAcceptSeconds: nullableNum(raw?.averageAcceptSeconds),
    fulfilmentRate: nullableNum(raw?.fulfilmentRate),
    fulfilled: num(raw?.fulfilled),
    itemsSold: (Array.isArray(raw?.itemsSold) ? raw.itemsSold : []).map((i: any) => ({
      productId: String(i?.productId ?? ''),
      title: String(i?.title ?? 'Item'),
      quantity: num(i?.quantity),
    })),
    orderValue: {
      amount: num(raw?.orderValue?.amount),
      orderCount: num(raw?.orderValue?.orderCount),
      label: 'Order value — not your earnings',
    },
    bounds: { perQueryLimit: num(raw?.bounds?.perQueryLimit) || 500, truncated: raw?.bounds?.truncated === true },
    cachedAt: num(raw?.cachedAt),
  };
}

export const analyticsApi = {
  get: async (days: AnalyticsDays): Promise<Analytics> => {
    const res = await vendorFetch<{ ok: true } & Record<string, unknown>>(`/api/vendor/analytics?days=${days}`);
    return normalizeAnalytics(res);
  },
};
