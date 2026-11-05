/**
 * Support cases (PRD screen 20). The backend has no support-case endpoint yet, so:
 * - SUPPORT_CASES_CONNECTED is false and the report form is shown read-only, with a notice
 *   before anything can be typed;
 * - fetchCases reports `connected: false`.
 * When POST /api/support/cases and GET /api/support/cases exist, wire them here.
 */
import { pickStr, toMs } from '../money/format';
import type { Tone } from '../money/ui';

export const SUPPORT_CASES_CONNECTED = false;

export type CaseStatus = 'open' | 'waiting_for_you' | 'in_review' | 'resolved' | 'unknown';

export interface SupportCase {
  id: string;
  subject: string;
  status: CaseStatus;
  orderId: string | null;
  updatedMs: number | null;
}

export const CASE_STATUS: Record<CaseStatus, { label: string; tone: Tone }> = {
  open: { label: 'Open', tone: 'info' },
  waiting_for_you: { label: 'Waiting for you', tone: 'warning' },
  in_review: { label: 'In review', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
  unknown: { label: 'Status not available', tone: 'neutral' },
};

export function normalizeCase(raw: any): SupportCase | null {
  const id = pickStr(raw, ['caseId', 'id']);
  if (!id) return null;
  const s = String(raw?.status ?? '').toLowerCase();
  const status: CaseStatus = s in CASE_STATUS ? (s as CaseStatus) : 'unknown';
  return {
    id,
    subject: pickStr(raw, ['subject', 'title']) || 'Support case',
    status,
    orderId: pickStr(raw, ['orderId']),
    updatedMs: toMs(raw?.updatedAt ?? raw?.createdAt),
  };
}

export async function fetchCases(): Promise<{ connected: false } | { connected: true; items: SupportCase[] }> {
  return { connected: false };
}

export const ISSUE_TYPES = [
  { key: 'order', label: 'Order problem' },
  { key: 'payout', label: 'Payout' },
  { key: 'account', label: 'Account' },
  { key: 'other', label: 'Something else' },
] as const;
