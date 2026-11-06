/**
 * Seller onboarding drafts, kept on this device with AsyncStorage so a vendor can leave
 * the form and come back. Drafts belong to one Firebase account (claimDrafts) and are
 * deleted on sign-out and after a successful submit.
 *
 * Never stored: the full bank account number (the app never asks for it).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VendorApplicationView } from '../../services/vendorApi/account';

export const DRAFT_KEYS = {
  a: 'onb_step_a',
  b: 'onb_step_b',
  c: 'onb_step_c',
  d: 'onb_step_d',
} as const;

/** The Firebase uid the drafts belong to, so another vendor on this device never sees them. */
const DRAFT_OWNER_KEY = 'onb_owner_uid';
/** The onboarding step to resume. Holds step names only. */
const RESUME_KEY = 'vendor_onboarding_status';

export type StepRoute = 'step-a' | 'step-b' | 'step-c' | 'step-d';

export interface StoreDraft {
  storeName: string;
  ownerName: string;
  /** 10 digits, without +91. */
  contactNumber: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  /** Pincodes the store delivers to; always includes the store's own pincode. */
  servicePincodes: string[];
  openTime: string; // 24-hour "HH:mm", e.g. "09:00"
  closeTime: string; // 24-hour "HH:mm", e.g. "21:00"
  latitude: number | null;
  longitude: number | null;
  /** True until the vendor saves: the values were copied from the application on the server. */
  seededFromServer?: boolean;
  updatedAt?: string;
}

export interface TaxDraft {
  gstin: string;
  pan: string;
  businessRegistrationNumber: string;
  /** Last 4 characters of the PAN already on file (resubmission hint only). */
  panLast4OnFile?: string;
  updatedAt?: string;
}

export interface BankDraft {
  holderName: string;
  bankName: string;
  ifsc: string;
  branch: string;
  /** Only the last four digits of the account number. */
  accLast4: string;
  upiVpa: string;
  /** Masked IFSC already on file (resubmission hint only). */
  ifscOnFile?: string;
  updatedAt?: string;
}

export interface CatalogDraft {
  categories: string[];
  updatedAt?: string;
}

export async function loadDraft<T>(key: string): Promise<Partial<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}

/** Throws when storage fails, so callers only report "Draft saved" after a real save. */
export async function saveDraft(key: string, data: object): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }));
}

export async function setResumeStep(step: StepRoute): Promise<void> {
  try {
    await AsyncStorage.setItem(RESUME_KEY, step);
  } catch {}
}

export async function getResumeStep(): Promise<StepRoute | null> {
  try {
    const v = await AsyncStorage.getItem(RESUME_KEY);
    return v === 'step-a' || v === 'step-b' || v === 'step-c' || v === 'step-d' ? v : null;
  } catch {
    return null;
  }
}

export async function clearResumeStep(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RESUME_KEY);
  } catch {}
}

/** Deletes every onboarding draft on this device (sign-out, successful submit). */
export async function clearAllDrafts(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([...Object.values(DRAFT_KEYS), RESUME_KEY, DRAFT_OWNER_KEY]);
  } catch {}
}

/** Drops drafts saved by a different account. Call once the signed-in uid is known. */
export async function claimDrafts(uid: string): Promise<void> {
  try {
    const owner = await AsyncStorage.getItem(DRAFT_OWNER_KEY);
    if (owner !== uid) {
      await AsyncStorage.multiRemove([...Object.values(DRAFT_KEYS), RESUME_KEY]);
      await AsyncStorage.setItem(DRAFT_OWNER_KEY, uid);
    }
  } catch {}
}

/** "+919876543210" -> "9876543210" */
function tenDigits(v: string): string {
  const d = String(v || '').replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}

/**
 * Fills the drafts from an application already on the server, so "Edit and resubmit" opens a
 * filled form. A draft edited on this device after the server copy was saved is kept.
 * PAN and IFSC come back masked, so the vendor types them again (the draft notes what is on file).
 */
export async function seedDraftsFromApplication(app: VendorApplicationView): Promise<void> {
  const existing = await loadDraft<StoreDraft>(DRAFT_KEYS.a);
  const localMs = existing?.updatedAt ? Date.parse(existing.updatedAt) : 0;
  if (existing && localMs > (app.updatedAt || 0)) return;

  const store: StoreDraft = {
    storeName: app.storeName || '',
    ownerName: app.ownerName || '',
    contactNumber: tenDigits(app.contactNumber),
    address: app.streetAddress || '',
    locality: '',
    city: app.city || '',
    state: app.state || '',
    pincode: app.pincode || '',
    servicePincodes: Array.isArray(app.servicePincodes) ? app.servicePincodes : [],
    openTime: app.operatingHours?.openTime || '',
    closeTime: app.operatingHours?.closeTime || '',
    latitude: null,
    longitude: null,
    seededFromServer: true,
  };
  const tax: TaxDraft = {
    gstin: app.gstNumber || '',
    pan: '',
    businessRegistrationNumber: app.businessRegistrationNumber || '',
    panLast4OnFile: app.panLast4 || '',
  };
  const bank: BankDraft = {
    holderName: app.bank?.holderName || '',
    bankName: app.bank?.bankName || '',
    ifsc: '',
    branch: '',
    accLast4: app.bank?.accLast4 || '',
    upiVpa: app.bank?.upiVpa || '',
    ifscOnFile: app.bank?.ifscMasked || '',
  };
  const catalog: CatalogDraft = { categories: Array.isArray(app.categories) ? app.categories : [] };
  await saveDraft(DRAFT_KEYS.a, store);
  await saveDraft(DRAFT_KEYS.b, tax);
  await saveDraft(DRAFT_KEYS.c, bank);
  await saveDraft(DRAFT_KEYS.d, catalog);
}

export function formatSavedTime(d = new Date()): string {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
