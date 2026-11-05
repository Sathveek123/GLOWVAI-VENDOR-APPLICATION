/**
 * Seller sign-in and onboarding: input masks and validators.
 * Each validator returns an error message, or '' when the value is valid.
 */

export const PHONE_RE = /^[6-9]\d{9}$/;
export const PINCODE_RE = /^[1-9]\d{5}$/;
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const GST_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** A format example that passes the checksum below (shown as a placeholder and in errors). */
export const GSTIN_EXAMPLE = '27AAPFU0939F1ZV';

/** The 15th GSTIN character is a check digit over the first 14 (mod-36 scheme used by GSTN). */
export function gstinChecksumOk(gstin: string): boolean {
  if (!GSTIN_RE.test(gstin)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = GST_CHARS.indexOf(gstin[i]) * (i % 2 ? 2 : 1);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GST_CHARS[(36 - (sum % 36)) % 36] === gstin[14];
}

// ── Masks ─────────────────────────────────────────────────────────────────────
export const digitsOnly = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);
export const upperAlnum = (v: string, max: number) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, max);

/** Accepts pasted or autofilled numbers like "+91 98765 43210" or "098765 43210". */
export function normalizeIndianMobile(v: string): string {
  let d = v.replace(/\D/g, '');
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
  if (d.length > 10 && d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 10);
}

/** "9876543210" -> "98765 43210" */
export const formatMobile = (d: string) => (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);

// ── Validators ────────────────────────────────────────────────────────────────
export function validateMobile(d: string): string {
  if (!d) return 'Enter your mobile number';
  if (!/^[6-9]/.test(d)) return 'Indian mobile numbers start with 6, 7, 8 or 9';
  if (d.length < 10) return `Enter all 10 digits (${d.length} entered)`;
  return '';
}

export function validateRequired(v: string, what: string, min = 2): string {
  if (!v.trim()) return `Enter ${what}`;
  if (v.trim().length < min) return `${what[0].toUpperCase()}${what.slice(1)} looks too short`;
  return '';
}

export function validateEmailOptional(v: string): string {
  if (!v.trim()) return '';
  return EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email, like name@example.com';
}

export function validatePincode(v: string): string {
  if (!v) return 'Enter the 6-digit pincode';
  if (v.length < 6) return 'Pincode has 6 digits';
  if (!PINCODE_RE.test(v)) return 'Pincodes don’t start with 0';
  return '';
}

export function validateGstin(v: string, required = true): string {
  if (!v) return required ? 'Enter your GSTIN' : '';
  if (v.length < 15) return `GSTIN has 15 characters (${v.length} entered)`;
  if (!GSTIN_RE.test(v)) return `This doesn’t match the GSTIN format, e.g. ${GSTIN_EXAMPLE}`;
  if (!gstinChecksumOk(v)) return 'This GSTIN has a typo. Check it against your GST certificate';
  return '';
}

export function validatePan(v: string, gstin?: string): string {
  if (!v) return 'Enter your PAN';
  if (v.length < 10) return `PAN has 10 characters (${v.length} entered)`;
  if (!PAN_RE.test(v)) return 'PAN format is 5 letters, 4 digits, 1 letter, e.g. AAAAA0000A';
  if (gstin && GSTIN_RE.test(gstin) && gstin.slice(2, 12) !== v) {
    return 'This PAN doesn’t match your GSTIN (characters 3 to 12 of a GSTIN are the PAN)';
  }
  return '';
}

export function validateIfsc(v: string): string {
  if (!v) return 'Enter the IFSC';
  if (v.length < 11) return `IFSC has 11 characters (${v.length} entered)`;
  if (!IFSC_RE.test(v)) return 'IFSC format is 4 letters, 0, then 6 letters or digits, e.g. HDFC0001234';
  return '';
}

export function validateAccountNumber(v: string): string {
  if (!v) return 'Enter your account number';
  if (v.length < 9) return 'Account numbers have 9 to 18 digits';
  return '';
}

export function validateUpiOptional(v: string): string {
  if (!v.trim()) return '';
  return UPI_RE.test(v.trim()) ? '' : 'Enter a UPI ID like yourstore@okhdfcbank';
}

export type Meridiem = 'AM' | 'PM';

/** "08:00" + "AM" style time. Returns minutes after midnight, or null when invalid. */
export function parseTime(hhmm: string, meridiem: Meridiem): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 1 || h > 12 || min > 59) return null;
  return ((h % 12) + (meridiem === 'PM' ? 12 : 0)) * 60 + min;
}

/** Inserts the colon while typing: "0830" -> "08:30". */
export function maskTime(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** "09:30" + "PM" -> "21:30" (24-hour "HH:MM", the format the shop stores). '' when invalid. */
export function to24h(hhmm: string, meridiem: Meridiem): string {
  const min = parseTime(hhmm, meridiem);
  if (min === null) return '';
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/**
 * Reads a stored time for the 12-hour editor. Accepts 24-hour "21:30" and older
 * "09:30 PM" drafts. Returns ['', 'AM'] when it can't be read.
 */
export function from24h(value?: string | null): [string, Meridiem] {
  const v = (value || '').trim();
  const twelve = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(v);
  if (twelve) return [`${twelve[1].padStart(2, '0')}:${twelve[2]}`, twelve[3].toUpperCase() as Meridiem];
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!m) return ['', 'AM'];
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return ['', 'AM'];
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return [`${String(h12).padStart(2, '0')}:${m[2]}`, h < 12 ? 'AM' : 'PM'];
}

/** "21:30" -> "9:30 PM" for summaries. Returns the input when it isn't a 24-hour time. */
export function format24hForDisplay(value?: string | null): string {
  const [hm, mer] = from24h(value);
  if (!hm) return value || '';
  return `${hm.replace(/^0/, '')} ${mer}`;
}
