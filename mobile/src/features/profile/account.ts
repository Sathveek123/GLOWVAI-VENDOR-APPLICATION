/**
 * The signed-in vendor's account, read from GET /api/vendor/me, shaped for the Profile screen.
 * Identity numbers (GSTIN, PAN, account number) are never shown in full: only "ending 1Z5".
 */
import { formatDateIST, pickNum, pickStr, toMs } from '../money/format';
import type { Tone } from '../money/ui';

export interface Account {
  vendorId: string | null;
  ownerName: string | null;
  storeName: string | null;
  storeType: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  locality: string | null;
  city: string | null;
  pinCode: string | null;
  openTime: string | null;
  closeTime: string | null;
  categories: string[];
  serviceRadiusKm: number | null;
  isOnline: boolean | null;
  verification: Verification;
  documents: DocumentRow[];
}

export interface Verification {
  label: string;
  tone: Tone;
  /** A sentence for the banner at the top of Profile, when the store is not approved. */
  banner: string | null;
  reason: string | null;
}

export interface DocumentRow {
  label: string;
  value: string;
  provided: boolean;
}

/** PRD states: submitted, under review, approved, rejected, more information required, suspended. */
export function verificationFor(statusRaw: unknown, reason: string | null): Verification {
  const status = String(statusRaw ?? '').toUpperCase().replace(/[\s-]+/g, '_');
  switch (status) {
    case 'APPROVED':
    case 'VERIFIED':
      return { label: 'Approved', tone: 'success', banner: null, reason: null };
    case 'PENDING':
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
    case 'IN_REVIEW':
      return { label: 'Under review', tone: 'warning', banner: 'Your store is under review. We will let you know when it is approved.', reason: null };
    case 'MORE_INFO':
    case 'MORE_INFO_REQUIRED':
    case 'MORE_INFORMATION_REQUIRED':
      return { label: 'More information needed', tone: 'warning', banner: 'GlowVai needs more information before approving your store.', reason };
    case 'REJECTED':
      return { label: 'Not approved', tone: 'danger', banner: 'Your application was not approved.', reason };
    case 'SUSPENDED':
      return { label: 'Suspended', tone: 'danger', banner: 'Your store is suspended and cannot receive orders. Contact GlowVai support.', reason };
    case '':
      return { label: 'Not submitted', tone: 'neutral', banner: 'Your store details have not been submitted for review yet.', reason: null };
    default:
      return { label: 'Status not available', tone: 'neutral', banner: 'We could not read your verification status. Contact GlowVai support if this continues.', reason: null };
  }
}

function ending(value: string | null): string | null {
  if (!value) return null;
  const clean = value.replace(/\s/g, '');
  return clean.length >= 4 ? `Provided, ending ${clean.slice(-3)}` : 'Provided';
}

export function toAccount(v: any): Account {
  const reason = pickStr(v, ['kycRejectionReason', 'verificationReason', 'approvalReason']);
  const licenceExpiryMs = toMs(v?.licenseExpiry);
  const cosmetics = pickStr(v, ['cosmeticLicense']);
  const trade = pickStr(v, ['tradeLicense']);
  const gstin = pickStr(v, ['gstin', 'gst']);
  const pan = pickStr(v, ['pan', 'panNumber']);

  const documents: DocumentRow[] = [
    { label: 'GSTIN', value: ending(gstin) || 'Not added', provided: !!gstin },
    { label: 'PAN', value: ending(pan) || 'Not added', provided: !!pan },
    {
      label: 'Cosmetics licence',
      value: cosmetics ? (licenceExpiryMs ? `Provided, valid until ${formatDateIST(licenceExpiryMs, { weekday: false })}` : 'Provided') : 'Not added',
      provided: !!cosmetics,
    },
    { label: 'Trade licence', value: trade ? 'Provided' : 'Not added', provided: !!trade },
  ];

  return {
    vendorId: pickStr(v, ['vendorId', 'id']),
    ownerName: pickStr(v, ['name', 'ownerName']),
    storeName: pickStr(v, ['shopName', 'storeName']),
    storeType: pickStr(v, ['shopType']),
    email: pickStr(v, ['email']),
    phone: pickStr(v, ['phone']),
    address: pickStr(v, ['address']),
    locality: pickStr(v, ['locality']),
    city: pickStr(v, ['city']),
    pinCode: pickStr(v, ['pinCode', 'pincode']),
    openTime: pickStr(v, ['openTime']),
    closeTime: pickStr(v, ['closeTime']),
    categories: Array.isArray(v?.categories) ? v.categories.filter((c: unknown) => typeof c === 'string' && c.trim()) : [],
    serviceRadiusKm: pickNum(v, ['serviceRadiusKm', 'deliveryRadiusKm']),
    isOnline: typeof v?.isOnline === 'boolean' ? v.isOnline : null,
    verification: verificationFor(v?.kycStatus ?? v?.verificationStatus ?? v?.approvalStatus, reason),
    documents,
  };
}
