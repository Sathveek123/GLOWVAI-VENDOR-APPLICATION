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
/** Read by app/index.tsx to resume onboarding at the right step. */
const RESUME_KEY = 'vendor_onboarding_status';

export type StepRoute = 'step-a' | 'step-b' | 'step-c' | 'step-d';

export interface StoreDraft {
  storeName: string;
  ownerName: string;
  email: string;
  address: string;
  locality: string;
  city: string;
  pincode: string;
  openTime: string;   // "08:00 AM"
  closeTime: string;  // "10:00 PM"
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

export async function setResumeStep(step: StepRoute | 'pending'): Promise<void> {
  try {
    await AsyncStorage.setItem(RESUME_KEY, step);
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
