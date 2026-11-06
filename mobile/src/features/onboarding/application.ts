/**
 * The vendor application (POST /api/vendor/application) built from the onboarding drafts.
 *
 * Each step validates its own fields with the functions below, and step D runs all of them
 * again before submitting, with the same rules the server applies (docs/VENDOR_API.md).
 * The server validates everything again; these checks only spare the vendor a round trip.
 */
import type { ApplicationInput } from '../../services/vendorApi/account';
import type { BankDraft, CatalogDraft, StoreDraft, TaxDraft } from './draft';
import {
  IFSC_RE,
  MAX_SERVICE_PINCODES,
  minutes24,
  validateAccLast4,
  validateGstin,
  validateIfsc,
  validateMobile,
  validatePan,
  validatePincode,
  validateRegistrationOptional,
  validateRequired,
  validateServicePincodes,
  validateState,
  validateUpiOptional,
} from './validation';

/** What a store can sell. Ids are the server's STORE_CATEGORIES (lib/vendor/validation.ts). */
export const CATEGORIES: { id: string; name: string; desc: string }[] = [
  { id: 'skincare', name: 'Skincare', desc: 'Cleansers, serums, moisturizers and sunscreen' },
  { id: 'haircare', name: 'Haircare', desc: 'Shampoo, conditioner, hair oils and serums' },
  { id: 'makeup', name: 'Makeup', desc: 'Face, eyes, lips and nails' },
  { id: 'fragrance', name: 'Fragrance', desc: 'Perfumes, deodorants and body mists' },
  { id: 'bath-body', name: 'Bath and body', desc: 'Body wash, lotions and scrubs' },
  { id: 'mens-grooming', name: 'Men’s grooming', desc: 'Beard care, shaving and face care' },
  { id: 'wellness', name: 'Wellness', desc: 'Supplements and personal care' },
];

export const categoryName = (id: string) => CATEGORIES.find(c => c.id === id)?.name ?? id;

export type Errors = Record<string, string>;

/** "address, locality" as one street line, the way the server stores it. */
export function streetLine(a: Partial<StoreDraft>): string {
  return [a.address, a.locality].map(v => (v || '').trim()).filter(Boolean).join(', ');
}

export function storeErrors(a: Partial<StoreDraft>): Errors {
  const open = minutes24(a.openTime);
  const close = minutes24(a.closeTime);
  const pins = a.servicePincodes ?? [];
  return {
    storeName: validateRequired(a.storeName || '', 'your store name'),
    ownerName: validateRequired(a.ownerName || '', 'the owner’s full name', 3),
    contactNumber: validateMobile(a.contactNumber || ''),
    address: validateRequired(a.address || '', 'the shop address', 5),
    city: validateRequired(a.city || '', 'the city'),
    state: validateState(a.state || ''),
    pincode: validatePincode(a.pincode || ''),
    servicePincodes: validateServicePincodes(pins, a.pincode || ''),
    openTime: open === null ? 'Enter a time like 09:00' : '',
    closeTime:
      close === null
        ? 'Enter a time like 09:00'
        : open !== null && close === open
          ? 'Closing time must differ from opening time'
          : '',
  };
}

export function taxErrors(b: Partial<TaxDraft>): Errors {
  return {
    gstin: validateGstin(b.gstin || '', false),
    pan: validatePan(b.pan || '', b.gstin || ''),
    businessRegistrationNumber: validateRegistrationOptional(b.businessRegistrationNumber || ''),
  };
}

export function bankErrors(c: Partial<BankDraft>, opts: { bankNameRequired?: boolean } = {}): Errors {
  return {
    holderName: validateRequired(c.holderName || '', 'the account holder’s name', 3),
    ifsc: validateIfsc(c.ifsc || ''),
    bankName: opts.bankNameRequired === false ? '' : validateRequired(c.bankName || '', 'your bank’s name'),
    accLast4: validateAccLast4(c.accLast4 || ''),
    upiVpa: validateUpiOptional(c.upiVpa || ''),
  };
}

export function categoryErrors(d: Partial<CatalogDraft>): Errors {
  const cats = d.categories ?? [];
  return {
    categories: !cats.length
      ? 'Choose at least one category'
      : cats.some(c => !CATEGORIES.some(x => x.id === c))
        ? 'Choose categories from the list'
        : '',
  };
}

export const hasErrors = (e: Errors) => Object.values(e).some(Boolean);

/** The request body for POST /api/vendor/application. Optional empty fields are left out. */
export function toApplicationInput(
  a: Partial<StoreDraft>,
  b: Partial<TaxDraft>,
  c: Partial<BankDraft>,
  d: Partial<CatalogDraft>,
): ApplicationInput {
  const pins = Array.from(new Set([a.pincode || '', ...(a.servicePincodes ?? [])].filter(Boolean))).slice(0, MAX_SERVICE_PINCODES);
  const input: ApplicationInput = {
    storeName: (a.storeName || '').trim(),
    ownerName: (a.ownerName || '').trim(),
    contactNumber: `+91${a.contactNumber || ''}`,
    streetAddress: streetLine(a),
    city: (a.city || '').trim(),
    state: a.state || '',
    pincode: a.pincode || '',
    servicePincodes: pins,
    operatingHours: { openTime: a.openTime || '', closeTime: a.closeTime || '', isOpenToday: true },
    categories: d.categories ?? [],
    pan: (b.pan || '').toUpperCase(),
    bank: {
      holderName: (c.holderName || '').trim(),
      bankName: (c.bankName || '').trim(),
      ifsc: (c.ifsc || '').toUpperCase(),
      accLast4: c.accLast4 || '',
    },
  };
  if (b.gstin) input.gstNumber = b.gstin.toUpperCase();
  if (b.businessRegistrationNumber?.trim()) input.businessRegistrationNumber = b.businessRegistrationNumber.trim();
  if (typeof a.latitude === 'number' && typeof a.longitude === 'number') {
    input.coordinates = { latitude: a.latitude, longitude: a.longitude };
  }
  if (c.upiVpa?.trim() && input.bank) input.bank.upiVpa = c.upiVpa.trim();
  return input;
}

/** True when an IFSC is complete enough to look up. */
export const ifscReady = (v: string) => IFSC_RE.test(v);
