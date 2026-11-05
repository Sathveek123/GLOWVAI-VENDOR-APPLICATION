/**
 * Settlements, tax documents, bank account and store activity.
 *
 * The vendor backend has no endpoints for settlements, tax documents or store activity yet,
 * so each fetcher reports `connected: false` and the screens say so plainly. The
 * normalisers are ready for when the backend exposes these records (admin_settlements,
 * admin-issued documents, the audit log). No sample records exist in this file.
 */
import { formatDateIST, maskTail, pickNum, pickStr, toMs } from './format';

export type Source<T> = { connected: false } | { connected: true; items: T[] };

const NOT_CONNECTED = { connected: false } as const;

// ── Settlements (PRD screen 22) ──────────────────────────────────────────────
export type SettlementStatus = 'scheduled' | 'processing' | 'paid' | 'failed' | 'on_hold' | 'unknown';

export interface Settlement {
  id: string;
  reference: string;
  /** Rupees. */
  amount: number | null;
  /** Paid date, or the scheduled date when not paid yet. */
  dateMs: number | null;
  utr: string | null;
  status: SettlementStatus;
  /** Wording from the server, when it sends one. */
  statusLabel: string | null;
  failureReason: string | null;
}

export const SETTLEMENT_STATUS: Record<SettlementStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  scheduled: { label: 'Scheduled', tone: 'info' },
  processing: { label: 'Processing', tone: 'info' },
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  on_hold: { label: 'On hold', tone: 'warning' },
  unknown: { label: 'Status not available', tone: 'neutral' },
};

function settlementStatus(raw: unknown): SettlementStatus {
  const v = String(raw ?? '').toLowerCase().replace(/[\s-]+/g, '_');
  if (['paid', 'settled', 'completed', 'success'].includes(v)) return 'paid';
  if (['failed', 'rejected', 'returned'].includes(v)) return 'failed';
  if (['processing', 'in_progress', 'initiated'].includes(v)) return 'processing';
  if (['scheduled', 'pending', 'queued'].includes(v)) return 'scheduled';
  if (['on_hold', 'hold', 'held'].includes(v)) return 'on_hold';
  return 'unknown';
}

export function normalizeSettlement(raw: any): Settlement | null {
  const id = pickStr(raw, ['settlementId', 'id', 'reference']);
  if (!id) return null;
  const amountPaise = pickNum(raw, ['netPayoutPaise', 'amountPaise']);
  return {
    id,
    reference: pickStr(raw, ['reference', 'settlementId', 'id']) || id,
    amount: amountPaise !== null ? amountPaise / 100 : pickNum(raw, ['amount', 'netPayout', 'net']),
    dateMs: toMs(raw?.paidAt ?? raw?.settledAt ?? raw?.scheduledAt ?? raw?.date),
    utr: pickStr(raw, ['utr', 'bankReference']),
    status: settlementStatus(raw?.status),
    statusLabel: pickStr(raw, ['statusLabel']),
    failureReason: pickStr(raw, ['failureReason', 'failedReason', 'reason']),
  };
}

export async function fetchSettlements(): Promise<Source<Settlement>> {
  return NOT_CONNECTED;
}

// ── Tax documents (PRD screen 23) ────────────────────────────────────────────
export interface TaxDocument {
  id: string;
  /** Name from the server, for example "Commission invoice - Sep 2026". */
  name: string;
  number: string | null;
  period: string | null;
  issuedMs: number | null;
  /** Rupees. */
  amount: number | null;
  /** A link to the file. Download is offered only when this is set. */
  fileUrl: string | null;
}

export function normalizeTaxDocument(raw: any): TaxDocument | null {
  const id = pickStr(raw, ['documentId', 'id']);
  const name = pickStr(raw, ['name', 'title', 'kind']);
  if (!id || !name) return null;
  const paise = pickNum(raw, ['amountPaise']);
  const url = pickStr(raw, ['fileUrl', 'downloadUrl', 'url']);
  return {
    id,
    name,
    number: pickStr(raw, ['number', 'documentNumber']),
    period: pickStr(raw, ['period', 'periodLabel']),
    issuedMs: toMs(raw?.issuedAt),
    amount: paise !== null ? paise / 100 : pickNum(raw, ['amount']),
    fileUrl: url && /^https:\/\//i.test(url) ? url : null,
  };
}

export async function fetchTaxDocuments(_fyStartYear: number): Promise<Source<TaxDocument>> {
  return NOT_CONNECTED;
}

// ── Store activity (audit log) ───────────────────────────────────────────────
export interface ActivityEvent {
  id: string;
  /** A plain sentence from the server, for example "Order GV-9912 was packed". */
  summary: string;
  atMs: number;
  actor: string | null;
  icon: 'receipt-outline' | 'cube-outline' | 'wallet-outline' | 'person-outline' | 'shield-checkmark-outline' | 'ellipse-outline';
  flag: 'needs_review' | 'blocked' | null;
}

const ACTIVITY_ICON: Record<string, ActivityEvent['icon']> = {
  order: 'receipt-outline',
  orders: 'receipt-outline',
  inventory: 'cube-outline',
  stock: 'cube-outline',
  payout: 'wallet-outline',
  payouts: 'wallet-outline',
  bank: 'wallet-outline',
  account: 'person-outline',
  profile: 'person-outline',
  security: 'shield-checkmark-outline',
};

export function normalizeActivity(raw: any): ActivityEvent | null {
  const id = pickStr(raw, ['id', 'eventId']);
  const summary = pickStr(raw, ['summary', 'message']);
  const atMs = toMs(raw?.createdAt ?? raw?.at ?? raw?.timestamp);
  if (!id || !summary || !atMs) return null;
  const flagRaw = String(raw?.flag ?? raw?.result ?? '').toLowerCase();
  return {
    id,
    summary,
    atMs,
    actor: pickStr(raw, ['actorName', 'actor']),
    icon: ACTIVITY_ICON[String(raw?.category ?? '').toLowerCase()] || 'ellipse-outline',
    flag: flagRaw === 'blocked' ? 'blocked' : flagRaw === 'needs_review' ? 'needs_review' : null,
  };
}

export async function fetchStoreActivity(): Promise<Source<ActivityEvent>> {
  return NOT_CONNECTED;
}

// ── Bank account (PRD screen 24), read from the vendor record ────────────────
export interface BankAccount {
  bankName: string | null;
  holderName: string | null;
  /** "•••• 4589". Never more than the last four digits. */
  accountMasked: string | null;
  ifsc: string | null;
  upiMasked: string | null;
  /** True or false only when the server says so. */
  verified: boolean | null;
  verifiedOn: string | null;
}

function maskUpi(value: string | null): string | null {
  if (!value || !value.includes('@')) return null;
  const [name, handle] = value.split('@');
  return `${name.slice(0, 2)}•••@${handle}`;
}

/** Reads the payout account from GET /api/vendor/me. Null when nothing is on file. */
export function readBankAccount(vendor: any): BankAccount | null {
  const b = vendor?.bankDetails && typeof vendor.bankDetails === 'object' ? vendor.bankDetails : vendor || {};
  const account = maskTail(b.accNumberMasked ?? b.accountNumberMasked ?? b.accountNumber ?? vendor?.accountNumber);
  const out: BankAccount = {
    bankName: pickStr(b, ['bankName']) || pickStr(vendor, ['bankName']),
    holderName: pickStr(b, ['holderName', 'beneficiaryName']),
    accountMasked: account,
    ifsc: pickStr(b, ['ifsc']),
    upiMasked: maskUpi(pickStr(b, ['upiId', 'upiVpa'])),
    verified: typeof b.verified === 'boolean' ? b.verified : null,
    verifiedOn: (() => {
      const ms = toMs(b.verifiedAt);
      return ms ? formatDateIST(ms, { weekday: false }) : null;
    })(),
  };
  return out.accountMasked || out.bankName || out.upiMasked ? out : null;
}
