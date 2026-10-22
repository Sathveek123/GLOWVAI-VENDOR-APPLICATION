/**
 * Finance & Profile Data Adapter
 * File: mobile/src/features/finance/adapter.ts
 * Manages earnings ledgers, bank settlements, UTR receipts, GST invoices, and KYC profile state
 */

export const USE_MOCK_FINANCE_EXTRAS = true;

export interface EarningsSummary {
  period: string;
  grossSalesPaise: number;
  platformFeePaise: number;
  vendorNetPaise: number;
  platformRate: number; // e.g. 12
  vendorRate: number;   // e.g. 88
  orderCount: number;
  pendingPayoutPaise: number;
  settledAmountPaise: number;
  asOf: string;
}

export interface LedgerEntry {
  entryId: string;
  date: string;
  orderId: string;
  type: 'Sale' | 'Refund' | 'Adjustment' | 'Fee reversal';
  grossPaise: number;
  platformFeePaise: number;
  vendorNetPaise: number;
  status: 'Pending' | 'Settled' | 'Reversed';
  settlementId?: string;
}

export interface SettlementItem {
  settlementId: string;
  cycleLabel: string;
  periodStart: string;
  periodEnd: string;
  grossSalesPaise: number;
  platformFeePaise: number;
  netPayoutPaise: number;
  status: 'Scheduled' | 'Processing' | 'Paid' | 'Failed' | 'On hold';
  utr?: string;
  paidAt?: string;
  destinationBank: string;
  orderCount: number;
}

export interface TaxDocumentItem {
  documentId: string;
  kind: 'GST Invoice' | 'Sales Summary' | 'TCS Statement' | 'TDS Statement';
  number: string;
  period: string;
  issuedAt: string;
  amountPaise: number;
  taxAmountPaise: number;
  status: 'Ready' | 'Generating';
}

export interface PayoutAccountDetails {
  holderName: string;
  bankName: string;
  branch: string;
  accountLast4: string;
  ifsc: string;
  upiIdMasked: string;
  status: 'Verified' | 'Pending verification' | 'Failed' | 'Change in progress';
  verifiedAt: string;
  lastChangedAt: string;
}

export interface BankChangeRequest {
  requestId: string;
  newAccountLast4: string;
  status: 'OTP pending' | 'Verifying' | 'Cooling period' | 'Applied' | 'Rejected';
  effectiveAt: string;
  reason?: string;
}

export interface BankPolicy {
  coolingHours: number;
  holdPayoutsDuringChange: boolean;
  maxChangesPerMonth: number;
}

export interface KycDocument {
  docId: string;
  kind: 'GST certificate' | 'PAN' | 'Store front photo' | 'Owner ID' | 'Trade license' | 'Cosmetics license';
  numberMasked: string;
  status: 'Verified' | 'In review' | 'Rejected' | 'Expiring' | 'Expired' | 'Not submitted';
  verifiedAt: string;
  expiresAt?: string;
  rejectionReason?: string;
  fileName: string;
  fileSize: string;
}

export interface StoreProfileDetails {
  storeName: string;
  ownerName: string;
  phone: string;
  email: string;
  shopType: string;
  address: string;
  locality: string;
  city: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  logoUrl: string;
  bannerUrl: string;
  description: string;
  categories: string[];
  openTime: string;
  closeTime: string;
  openDays: string[];
  rating: number;
  reviewCount: number;
  joinedAt: string;
  vendorId: string;
  storeId: string;
  kycStatus: 'Verified' | 'In review' | 'Action needed';
}

export interface RecentBankChange {
  changeId: string;
  date: string;
  type: 'Bank Account' | 'UPI VPA';
  result: 'Verified & Active' | 'Cancelled' | 'Rejected';
}

// ── Initial Mock Finance Data ────────────────────────────────────────────────
const MOCK_SUMMARY: EarningsSummary = {
  period: 'This week (Oct 01 - Oct 07)',
  grossSalesPaise: 4892000,   // ₹48,920.00
  platformFeePaise: 587000,   // ₹5,870.00 (12%)
  vendorNetPaise: 4305000,    // ₹43,050.00 (88%)
  platformRate: 12,
  vendorRate: 88,
  orderCount: 28,
  pendingPayoutPaise: 1205000, // ₹12,050.00
  settledAmountPaise: 3100000, // ₹31,000.00
  asOf: 'Today at 10:30 PM',
};

const MOCK_LEDGER: LedgerEntry[] = [
  {
    entryId: 'LEDG-001',
    date: '2026-10-07',
    orderId: 'GV-9912',
    type: 'Sale',
    grossPaise: 119800,
    platformFeePaise: 14376,
    vendorNetPaise: 105424,
    status: 'Pending',
  },
  {
    entryId: 'LEDG-002',
    date: '2026-10-06',
    orderId: 'GV-9911',
    type: 'Sale',
    grossPaise: 99900,
    platformFeePaise: 11988,
    vendorNetPaise: 87912,
    status: 'Settled',
    settlementId: 'SET-W40-01',
  },
  {
    entryId: 'LEDG-003',
    date: '2026-10-05',
    orderId: 'GV-9908',
    type: 'Refund',
    grossPaise: -34900,
    platformFeePaise: 0,
    vendorNetPaise: -34900,
    status: 'Reversed',
  },
];

const MOCK_SETTLEMENTS: SettlementItem[] = [
  {
    settlementId: 'SET-W40-01',
    cycleLabel: 'Week 40 (Sep 28 - Oct 04)',
    periodStart: '2026-09-28',
    periodEnd: '2026-10-04',
    grossSalesPaise: 3502000,
    platformFeePaise: 420240,
    netPayoutPaise: 3081760,
    status: 'Paid',
    utr: 'UTR-4021-8856-3321',
    paidAt: '2026-10-05 10:15 AM',
    destinationBank: 'HDFC Bank •••• 4589',
    orderCount: 22,
  },
];

const MOCK_TAX_DOCUMENTS: TaxDocumentItem[] = [
  {
    documentId: 'TAX-DOC-01',
    kind: 'GST Invoice',
    number: 'INV-GVA-2026-W40',
    period: 'September 2026',
    issuedAt: '2026-10-01',
    amountPaise: 587000,
    taxAmountPaise: 105660, // 18% GST on fee
    status: 'Ready',
  },
  {
    documentId: 'TAX-DOC-02',
    kind: 'TCS Statement',
    number: 'TCS-194O-2026-Q2',
    period: 'Q2 (Jul - Sep 2026)',
    issuedAt: '2026-10-05',
    amountPaise: 489200,
    taxAmountPaise: 48920,
    status: 'Ready',
  },
];

const MOCK_BANK_ACCOUNT: PayoutAccountDetails = {
  holderName: 'Sathvik Ramanujan',
  bankName: 'HDFC Bank',
  branch: 'Benz Circle Branch, Vijayawada',
  accountLast4: '4589',
  ifsc: 'HDFC0001234',
  upiIdMasked: 'glow****@hdfcbank',
  status: 'Verified',
  verifiedAt: '2026-03-15',
  lastChangedAt: '2026-03-15',
};

const MOCK_BANK_POLICY: BankPolicy = {
  coolingHours: 24,
  holdPayoutsDuringChange: true,
  maxChangesPerMonth: 2,
};

const MOCK_RECENT_CHANGES: RecentBankChange[] = [
  { changeId: 'CHG-001', date: '2026-03-15', type: 'Bank Account', result: 'Verified & Active' },
  { changeId: 'CHG-002', date: '2026-01-10', type: 'UPI VPA', result: 'Verified & Active' },
];

const MOCK_STORE_PROFILE: StoreProfileDetails = {
  storeName: 'Sri Lakshmi Beauty Store',
  ownerName: 'Sathvik Ramanujan',
  phone: '+91 98765 43210',
  email: 'vendor@glowvai.com',
  shopType: 'Cosmetics & Skincare Retailer',
  address: 'Door #40-1-52, MG Road',
  locality: 'Benz Circle',
  city: 'Vijayawada',
  pinCode: '520010',
  latitude: 16.5062,
  longitude: 80.6480,
  logoUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150&auto=format&fit=crop&q=80',
  bannerUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
  description: 'Authorized retailer of premium cosmetics, clinical skincare, and luxury beauty products.',
  categories: ['Skincare', 'Makeup', 'Hair Care', 'Cosmetics'],
  openTime: '09:00 AM',
  closeTime: '11:00 PM',
  openDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  rating: 4.8,
  reviewCount: 142,
  joinedAt: 'March 2026',
  vendorId: 'VND-001',
  storeId: 'DS-VIJ-01',
  kycStatus: 'Verified',
};

const MOCK_KYC_DOCUMENTS: KycDocument[] = [
  {
    docId: 'KYC-01',
    kind: 'GST certificate',
    numberMasked: '37AAAAA0000A1Z5',
    status: 'Verified',
    verifiedAt: '2026-03-16',
    fileName: 'gst_cert_2026.pdf',
    fileSize: '1.2 MB',
  },
  {
    docId: 'KYC-02',
    kind: 'PAN',
    numberMasked: 'ABCDE1234F',
    status: 'Verified',
    verifiedAt: '2026-03-16',
    fileName: 'pan_card_front.pdf',
    fileSize: '850 KB',
  },
  {
    docId: 'KYC-03',
    kind: 'Store front photo',
    numberMasked: 'ST-FRONT-01',
    status: 'Verified',
    verifiedAt: '2026-03-16',
    fileName: 'storefront_exterior.jpg',
    fileSize: '3.4 MB',
  },
  {
    docId: 'KYC-04',
    kind: 'Owner ID',
    numberMasked: 'AADHAAR-XXXX-5890',
    status: 'Verified',
    verifiedAt: '2026-03-16',
    fileName: 'aadhaar_owner.pdf',
    fileSize: '1.8 MB',
  },
  {
    docId: 'KYC-05',
    kind: 'Trade license',
    numberMasked: 'TL-VIJ-2026-88',
    status: 'Verified',
    verifiedAt: '2026-03-16',
    expiresAt: '2027-03-31',
    fileName: 'trade_license.pdf',
    fileSize: '950 KB',
  },
  {
    docId: 'KYC-06',
    kind: 'Cosmetics license',
    numberMasked: 'COS-AP-2026-44',
    status: 'Expiring',
    verifiedAt: '2025-11-01',
    expiresAt: '2026-10-31',
    fileName: 'cosmetics_retail_lic.pdf',
    fileSize: '1.1 MB',
  },
];

// ── Finance Adapter Methods ──────────────────────────────────────────────────

export async function fetchEarningsSummary(): Promise<EarningsSummary> {
  return MOCK_SUMMARY;
}

export async function fetchLedgerEntries(): Promise<LedgerEntry[]> {
  return MOCK_LEDGER;
}

export async function fetchSettlements(): Promise<SettlementItem[]> {
  return MOCK_SETTLEMENTS;
}

export async function fetchTaxDocuments(): Promise<TaxDocumentItem[]> {
  return MOCK_TAX_DOCUMENTS;
}

export async function fetchBankAccountDetails(): Promise<PayoutAccountDetails> {
  return MOCK_BANK_ACCOUNT;
}

export async function fetchBankPolicy(): Promise<BankPolicy> {
  return MOCK_BANK_POLICY;
}

export async function fetchRecentBankChanges(): Promise<RecentBankChange[]> {
  return MOCK_RECENT_CHANGES;
}

export async function fetchStoreProfile(): Promise<StoreProfileDetails> {
  return MOCK_STORE_PROFILE;
}

export async function fetchKycDocuments(): Promise<KycDocument[]> {
  return MOCK_KYC_DOCUMENTS;
}

export function formatPaiseToINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(rupees);
}
