/**
 * Pure rules for store analytics: the request path and how the server numbers are read. No native imports, so the
 * unit tests run in Node. A null metric means "no data yet" and is kept null (never turned into zero).
 * The network call is in analytics.ts.
 */

/** The route, on the shop host. Not live on the shop main branch yet: the screens show "not available yet" then. */
export const ANALYTICS_PATH = '/api/vendor/analytics';

/** The request path for a period. */
export function analyticsPath(days: AnalyticsDays): string {
  return `${ANALYTICS_PATH}?days=${days}`;
}

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
