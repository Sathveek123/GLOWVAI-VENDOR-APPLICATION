/**
 * Money, date and error formatting for the money, profile and support screens.
 *
 * - One INR formatter. It keeps paise and writes negatives as -₹350.
 * - Dates are shown in India time (UTC+5:30) without relying on Intl time-zone support,
 *   which is missing on some Android JavaScript engines.
 */
import { ApiError } from '../../services/api';

/** Indian digit grouping for a whole, non-negative number: 1234567 -> "12,34,567". */
function groupIndian(whole: number): string {
  const digits = String(whole);
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/**
 * Rupees (as the server sends them) to text. Paise are kept: 1054.24 -> "₹1,054.24".
 * Whole amounts drop the ".00" unless `alwaysPaise` is set. Negatives: -350 -> "-₹350".
 */
export function formatINR(rupees: number, opts: { alwaysPaise?: boolean } = {}): string {
  if (!Number.isFinite(rupees)) return '—';
  const totalPaise = Math.round(rupees * 100);
  const negative = totalPaise < 0;
  const abs = Math.abs(totalPaise);
  const whole = Math.floor(abs / 100);
  const paise = abs % 100;
  const paiseText = paise > 0 || opts.alwaysPaise ? `.${String(paise).padStart(2, '0')}` : '';
  return `${negative ? '-' : ''}₹${groupIndian(whole)}${paiseText}`;
}

/** Integer paise to text, for records the server keeps in paise. */
export function formatPaise(paise: number, opts: { alwaysPaise?: boolean } = {}): string {
  if (!Number.isFinite(paise)) return '—';
  return formatINR(Math.round(paise) / 100, opts);
}

/** Reads a number the server sent as a number or a numeric string. Anything else is null. */
export function num(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** The first field of `obj` among `keys` that holds a number. */
export function pickNum(obj: any, keys: string[]): number | null {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of keys) {
    const n = num(obj[k]);
    if (n !== null) return n;
  }
  return null;
}

/** The first non-empty string field of `obj` among `keys`. */
export function pickStr(obj: any, keys: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return null;
}

/** Accepts epoch ms, numeric strings, ISO strings, "YYYY-MM-DD" and Firestore { seconds }. */
export function toMs(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && asNumber > 0) return asNumber;
    // A bare date is a day in India, not UTC midnight.
    const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (day) return Date.UTC(+day[1], +day[2] - 1, +day[3]) - IST_OFFSET_MS;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value && typeof value === 'object') {
    const v = value as any;
    if (typeof v.seconds === 'number') return v.seconds * 1000;
    if (typeof v._seconds === 'number') return v._seconds * 1000;
  }
  return null;
}

const IST_OFFSET_MS = 330 * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The calendar parts of an instant in India time. */
export function istParts(ms: number) {
  const d = new Date(ms + IST_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    weekday: d.getUTCDay(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
  };
}

/** "YYYY-MM-DD" for the India-time day of an instant. */
export function istDayKey(ms: number): string {
  const p = istParts(ms);
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** "Thu, 1 Oct 2026" (year left out when `withYear` is false). */
export function formatDateIST(ms: number, opts: { weekday?: boolean; withYear?: boolean } = {}): string {
  const p = istParts(ms);
  const base = `${p.day} ${MONTHS[p.month]}${opts.withYear === false ? '' : ` ${p.year}`}`;
  return opts.weekday === false ? base : `${WEEKDAYS[p.weekday]}, ${base}`;
}

/** "1:30 pm" in India time. */
export function formatTimeIST(ms: number): string {
  const p = istParts(ms);
  const h12 = p.hours % 12 === 0 ? 12 : p.hours % 12;
  return `${h12}:${String(p.minutes).padStart(2, '0')} ${p.hours < 12 ? 'am' : 'pm'}`;
}

/** "1 Oct 2026, 1:30 pm" in India time. */
export function formatDateTimeIST(ms: number): string {
  return `${formatDateIST(ms, { weekday: false })}, ${formatTimeIST(ms)}`;
}

/** Indian financial year that contains `ms`: April to March. Returns the starting year. */
export function financialYearStart(ms: number): number {
  const p = istParts(ms);
  return p.month >= 3 ? p.year : p.year - 1;
}

/** "FY 2026-27" for the financial year starting in April of `startYear`. */
export function financialYearLabel(startYear: number): string {
  return `FY ${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

/** Keeps only the last four digits: "•••• 4589". Null when there are fewer than four digits. */
export function maskTail(value: unknown, prefix = '•••• '): string | null {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length < 4) return null;
  return `${prefix}${digits.slice(-4)}`;
}

/** Plain-language copy for a failed request. Never shows raw messages such as "Failed to fetch". */
export function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Your sign-in has expired. Sign in again to continue.';
    if (err.status === 403) return 'This account cannot open this information.';
    if (err.status === 404) return 'We could not find this information for your store.';
    if (err.status >= 500) return 'GlowVai could not load this right now. Try again in a moment.';
    return 'Something went wrong while loading this. Try again.';
  }
  return 'We could not reach GlowVai. Check your internet connection and try again.';
}
