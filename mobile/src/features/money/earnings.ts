/**
 * Earnings data, read from the existing endpoints and shaped for the screen.
 *
 *   GET /api/earnings/:vendorId          -> { earnings: { today, weekly, total } }   (rupees)
 *   GET /api/earnings/:vendorId/history  -> { history: [{ date, orders, revenue, earnings, ... }] }
 *
 * Rules:
 * - Only server figures are shown. Nothing is derived from a commission rate.
 * - "revenue" is what the customer paid (it can include delivery), so it is never used as sales.
 * - A sales / fees / refunds breakdown is shown only when the server sends every part
 *   and the parts add up to the net amount. Otherwise only the net amount is shown.
 */
import { earningsApi } from '../../services/api';
import { istDayKey, num, pickNum, toMs } from './format';

export type PeriodKey = 'today' | 'week' | 'all';

export interface PeriodFigures {
  net: number | null;
  orders: number | null;
  sales: number | null;
  fees: number | null;
  refunds: number | null;
  adjustments: number | null;
}

export interface DayRow {
  key: string; // YYYY-MM-DD (India time)
  ms: number;
  orders: number | null;
  net: number | null;
}

export interface EarningsData {
  periods: Record<PeriodKey, PeriodFigures | null>;
  /** Earned but not yet paid out, when the server reports it. */
  pendingPayout: number | null;
  days: DayRow[];
  /** True when the daily history could not be loaded (the summary still shows). */
  historyFailed: boolean;
  /** The raw summary, for the shared store that the home screen reads. */
  rawSummary: any;
}

const NET_KEYS = ['net', 'netEarnings', 'vendorEarnings', 'earnings'];
const SALES_KEYS = ['sales', 'itemValue', 'grossSales', 'productValue', 'revenueBasis'];
const FEE_KEYS = ['fees', 'platformFee', 'commission', 'platformCommission'];
const REFUND_KEYS = ['refunds', 'refundAdjustments', 'refundAmount'];
const ADJUST_KEYS = ['adjustments', 'otherAdjustments'];

function figures(raw: any): PeriodFigures | null {
  if (!raw || typeof raw !== 'object') return null;
  const f: PeriodFigures = {
    net: pickNum(raw, NET_KEYS),
    orders: pickNum(raw, ['orders', 'orderCount']),
    sales: pickNum(raw, SALES_KEYS),
    fees: pickNum(raw, FEE_KEYS),
    refunds: pickNum(raw, REFUND_KEYS),
    adjustments: pickNum(raw, ADJUST_KEYS),
  };
  return f.net === null && f.orders === null ? null : f;
}

/** Sums one field across rows. Null unless every row has it. */
function sumField(rows: PeriodFigures[], key: keyof PeriodFigures): number | null {
  if (rows.length === 0) return null;
  let total = 0;
  for (const r of rows) {
    const v = r[key];
    if (v === null) return null;
    total += v;
  }
  return Math.round(total * 100) / 100;
}

function extractHistory(res: any): any[] {
  if (Array.isArray(res)) return res;
  for (const key of ['history', 'entries', 'days', 'items']) {
    if (Array.isArray(res?.[key])) return res[key];
  }
  return [];
}

export async function loadEarnings(vendorId: string): Promise<EarningsData> {
  const [summaryRes, historyRes] = await Promise.allSettled([
    earningsApi.getSummary(vendorId),
    earningsApi.getHistory(vendorId),
  ]);
  if (summaryRes.status === 'rejected') throw summaryRes.reason;

  const summary = summaryRes.value?.earnings ?? null;

  const historyRows = historyRes.status === 'fulfilled' ? extractHistory(historyRes.value) : [];
  const parsed = historyRows
    .map((r) => {
      const ms = toMs(r?.date ?? r?.day ?? r?.createdAt);
      const f = figures(r);
      return ms && f ? { ms, f } : null;
    })
    .filter((x): x is { ms: number; f: PeriodFigures } => x !== null)
    .sort((a, b) => b.ms - a.ms);

  // Last 7 days, India time, counting today.
  const todayKey = istDayKey(Date.now());
  const weekStartKey = istDayKey(Date.now() - 6 * 86400000);
  const weekRows = parsed.filter((p) => {
    const key = istDayKey(p.ms);
    return key >= weekStartKey && key <= todayKey;
  });
  const week: PeriodFigures | null =
    historyRes.status === 'fulfilled'
      ? {
          net: weekRows.length ? sumField(weekRows.map((r) => r.f), 'net') : 0,
          orders: weekRows.length ? sumField(weekRows.map((r) => r.f), 'orders') : 0,
          sales: sumField(weekRows.map((r) => r.f), 'sales'),
          fees: sumField(weekRows.map((r) => r.f), 'fees'),
          refunds: sumField(weekRows.map((r) => r.f), 'refunds'),
          adjustments: sumField(weekRows.map((r) => r.f), 'adjustments'),
        }
      : null;

  return {
    periods: {
      today: figures(summary?.today),
      week,
      all: figures(summary?.total),
    },
    pendingPayout: num(summary?.total?.pendingPayout ?? summary?.pendingPayout),
    days: parsed.map((p) => ({ key: istDayKey(p.ms), ms: p.ms, orders: p.f.orders, net: p.f.net })),
    historyFailed: historyRes.status === 'rejected',
    rawSummary: summary,
  };
}

export interface BreakdownLine {
  label: string;
  amount: number;
}

/**
 * The lines that make up "You'll receive", or null when the server did not send every part
 * or the parts do not add up to the net amount.
 */
export function breakdown(p: PeriodFigures): BreakdownLine[] | null {
  if (p.net === null || p.sales === null || p.fees === null) return null;
  const lines: BreakdownLine[] = [
    { label: 'Sales', amount: p.sales },
    { label: 'GlowVai fees', amount: -Math.abs(p.fees) },
  ];
  if (p.refunds !== null) lines.push({ label: 'Refunds', amount: -Math.abs(p.refunds) });
  if (p.adjustments !== null && p.adjustments !== 0) lines.push({ label: 'Adjustments', amount: p.adjustments });
  const totalPaise = lines.reduce((sum, l) => sum + Math.round(l.amount * 100), 0);
  return totalPaise === Math.round(p.net * 100) ? lines : null;
}
