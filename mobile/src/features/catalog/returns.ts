/**
 * Returns and issue requests: the shape the vendor app expects, and the inspection rules.
 * GlowVai decides refunds; the vendor only records what they find and where the unit goes.
 * There is no vendor-scoped returns API yet, so loadVendorReturns reports "not connected"
 * instead of returning sample claims.
 * File: mobile/src/features/catalog/returns.ts
 */

export type ReturnReason = 'Damaged' | 'Leaking' | 'Wrong item' | 'Expired' | 'Changed mind' | 'Other';
export type ReturnStage = 'needs_inspection' | 'with_glowvai' | 'closed';

export interface Inspection {
  seal: 'Intact' | 'Broken' | 'Unsure';
  authentic: 'Yes' | 'No' | 'Unsure';
  expiry: 'Valid' | 'Expired';
  packaging: 'Complete' | 'Missing';
  disposition: Disposition;
  note: string;
}

export type Disposition = 'quarantine' | 'request_restock' | 'write_off';

export interface ReturnClaim {
  claimId: string;
  /** Order reference only; never customer contact details. */
  orderRef: string;
  productName: string;
  brand?: string;
  photo?: string;
  reason: ReturnReason;
  customerNote?: string;
  /** Amount under review, as sent by GlowVai. */
  amount?: number;
  /** When the vendor's inspection is due (ms since epoch), if GlowVai set one. */
  dueAt?: number;
  stage: ReturnStage;
  evidencePhotos: string[];
  inspection?: Inspection;
  /** GlowVai's decision text once made. Read-only for the vendor. */
  decision?: string;
}

export const DEFAULT_INSPECTION: Inspection = {
  seal: 'Unsure',
  authentic: 'Unsure',
  expiry: 'Valid',
  packaging: 'Complete',
  disposition: 'quarantine',
  note: '',
};

/** A unit may only be proposed for return to stock when every check passes. */
export function canRequestRestock(claim: Pick<ReturnClaim, 'reason'>, i: Inspection): boolean {
  if (['Damaged', 'Leaking', 'Expired'].includes(claim.reason)) return false;
  return i.seal === 'Intact' && i.authentic === 'Yes' && i.expiry === 'Valid' && i.packaging === 'Complete';
}

export function isOverdue(claim: ReturnClaim, now = Date.now()): boolean {
  return claim.stage === 'needs_inspection' && typeof claim.dueAt === 'number' && claim.dueAt < now;
}

export type ReturnsResult = { connected: false } | { connected: true; claims: ReturnClaim[] };

/** Returns for the signed-in store. Not connected to a backend yet. */
export async function loadVendorReturns(): Promise<ReturnsResult> {
  return { connected: false };
}
