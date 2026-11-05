/**
 * Seller onboarding drafts, kept on this device with AsyncStorage.
 * Keys are shared with the pending screen and the vendor home screen.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DRAFT_KEYS = {
  a: 'onb_step_a',
  b: 'onb_step_b',
  c: 'onb_step_c',
  d: 'onb_step_d',
} as const;

/** The phone number the drafts belong to, so another seller on this device never sees them. */
const DRAFT_OWNER_KEY = 'onb_owner_phone';
/** The onboarding step to resume (read by the splash router in status.ts). Holds step names only. */
const RESUME_KEY = 'vendor_onboarding_status';

export type StepRoute = 'step-a' | 'step-b' | 'step-c' | 'step-d';

/**
 * Business types offered in step A. `gstRequired` makes GSTIN and the GST certificate
 * mandatory in step B; for the others GSTIN is optional and PAN is enough.
 * Confirm this list and the GST rule with the GlowVai compliance team before launch.
 */
export const BUSINESS_TYPES = [
  { id: 'retail', label: 'Beauty or cosmetics shop', desc: 'A store that sells to customers', gstRequired: false },
  { id: 'salon', label: 'Salon or spa', desc: 'Sells products alongside services', gstRequired: false },
  { id: 'pharmacy', label: 'Pharmacy or chemist', desc: 'Licensed medical store', gstRequired: false },
  { id: 'distributor', label: 'Distributor or wholesaler', desc: 'Sells in bulk to other businesses', gstRequired: true },
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number]['id'];

export function businessTypeNeedsGst(id?: string | null): boolean {
  return BUSINESS_TYPES.some(t => t.id === id && t.gstRequired);
}

export function businessTypeLabel(id?: string | null): string {
  return BUSINESS_TYPES.find(t => t.id === id)?.label ?? '';
}

export interface StoreDraft {
  storeName: string;
  ownerName: string;
  businessType: BusinessType | '';
  email: string;
  address: string;
  locality: string;
  city: string;
  pincode: string;
  openTime: string;   // 24-hour "HH:MM", e.g. "09:00" (older drafts may hold "09:00 AM")
  closeTime: string;  // 24-hour "HH:MM", e.g. "21:00"
  latitude: number | null;
  longitude: number | null;
  updatedAt?: string;
}

export interface AttachedFile {
  name: string;
  size: number;
  mimeType: string;
  uri: string;
}

export interface TaxDraft {
  gstin: string;
  pan: string;
  tradeLicense: string;
  gstCert: AttachedFile | null;
  storePhoto: AttachedFile | null;
  ownerId: AttachedFile | null;
  updatedAt?: string;
}

export interface BankDraft {
  beneficiaryName: string;
  ifsc: string;
  bankName: string;
  branch: string;
  upiVpa: string;
  /** Only the last four digits are kept; the full number is never written to storage. */
  maskedAccountNumber: string;
  updatedAt?: string;
}

export interface CatalogDraft {
  selectedCats: string[];
  confirmed: boolean;
  updatedAt?: string;
}

export async function loadDraft<T>(key: string): Promise<Partial<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch (_) {
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
  } catch (_) {}
}

export async function clearResumeStep(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RESUME_KEY);
  } catch (_) {}
}

export async function getResumeStep(): Promise<StepRoute | null> {
  try {
    const v = await AsyncStorage.getItem(RESUME_KEY);
    return v === 'step-a' || v === 'step-b' || v === 'step-c' || v === 'step-d' ? v : null;
  } catch (_) {
    return null;
  }
}

/** Drops drafts saved for a different phone number. Call after OTP sign-in. */
export async function claimDrafts(phone: string): Promise<void> {
  try {
    const owner = await AsyncStorage.getItem(DRAFT_OWNER_KEY);
    if (owner && owner !== phone) {
      await AsyncStorage.multiRemove([...Object.values(DRAFT_KEYS), RESUME_KEY]);
    }
    await AsyncStorage.setItem(DRAFT_OWNER_KEY, phone);
  } catch (_) {}
}

export function formatSavedTime(d = new Date()): string {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
