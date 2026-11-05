/**
 * Read-only client for the GlowVai master catalogue.
 *
 * Source: Firestore `products` where status == 'PUBLISHED' in the shared Firebase
 * project, read through the public Firestore REST API (the collection is
 * public-readable, so no sign-in is needed). Vendors never write to this collection;
 * they only stock products that already exist here.
 *
 * Config: EXPO_PUBLIC_FIREBASE_API_KEY (web API key of the shared project) and,
 * optionally, EXPO_PUBLIC_FIREBASE_PROJECT_ID (defaults to glowvai-38bde).
 * File: mobile/src/features/catalog/catalogSource.ts
 */

/** The five shop categories used by the GlowVai catalogue. */
export const CATALOG_CATEGORIES = ['Serums', 'Moisturizers', 'Suncare', 'Cleansers', 'Treatments'] as const;
export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

export interface CatalogProduct {
  /** Firestore document id, e.g. "minimalist--10-niacinamide-face-serum". */
  id: string;
  brandName: string;
  productName: string;
  category: string;
  volume: string;
  /** Selling price set in the catalogue (₹). */
  brandPrice: number;
  /** Discount in percent, 0 when none. */
  brandDiscount: number;
  /** MRP derived the same way the shop does: round(brandPrice / (1 - discount/100)). */
  mrp: number;
  pictures: string[];
  keyActives: string;
}

/** Error with copy that can be shown to a shop owner as is. */
export class CatalogError extends Error {
  kind: 'config' | 'network' | 'server';
  constructor(kind: CatalogError['kind'], message: string) {
    super(message);
    this.kind = kind;
  }
}

const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'glowvai-38bde';
const CACHE_MS = 5 * 60 * 1000;

let cache: { at: number; products: CatalogProduct[] } | null = null;
let inFlight: Promise<CatalogProduct[]> | null = null;

// ── Firestore REST value decoding ────────────────────────────────────────────
type FsValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  arrayValue?: { values?: FsValue[] };
  mapValue?: { fields?: Record<string, FsValue> };
};

function decode(v: FsValue | undefined): any {
  if (!v) return undefined;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.arrayValue) return (v.arrayValue.values || []).map(decode);
  if (v.mapValue) {
    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v.mapValue.fields || {})) out[k] = decode(val);
    return out;
  }
  return null;
}

function text(v: unknown): string {
  return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
}

function money(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function toProduct(name: string, fields: Record<string, FsValue>): CatalogProduct | null {
  const f: Record<string, any> = {};
  for (const [k, val] of Object.entries(fields)) f[k] = decode(val);
  const productName = text(f.productName);
  if (!productName) return null;
  const brandPrice = money(f.brandPrice);
  const discount = Math.min(Math.max(Number(f.brandDiscount) || 0, 0), 95);
  const mrp = discount > 0 && brandPrice > 0 ? Math.round(brandPrice / (1 - discount / 100)) : brandPrice;
  const keyActives = Array.isArray(f.keyActives) ? f.keyActives.map(text).filter(Boolean).join(', ') : text(f.keyActives);
  return {
    id: name.split('/').pop() || name,
    brandName: text(f.brandName),
    productName,
    category: text(f.category),
    volume: text(f.volume),
    brandPrice,
    brandDiscount: discount,
    mrp,
    pictures: (Array.isArray(f.pictures) ? f.pictures : []).map(text).filter(u => /^https?:\/\//i.test(u)),
    keyActives,
  };
}

async function fetchFromFirestore(): Promise<CatalogProduct[]> {
  const key = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!key) {
    throw new CatalogError('config', 'The GlowVai catalogue is not set up in this build yet. Please contact GlowVai support.');
  }
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${encodeURIComponent(key)}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'products' }],
      where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'PUBLISHED' } } },
    },
  };

  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new CatalogError('network', 'We could not reach the GlowVai catalogue. Check your internet connection and try again.');
  }
  if (!res.ok) {
    throw new CatalogError('server', 'The GlowVai catalogue is not responding right now. Please try again in a minute.');
  }

  let rows: any;
  try {
    rows = await res.json();
  } catch {
    throw new CatalogError('server', 'The GlowVai catalogue sent a reply we could not read. Please try again.');
  }
  if (!Array.isArray(rows)) {
    throw new CatalogError('server', 'The GlowVai catalogue sent a reply we could not read. Please try again.');
  }

  const products: CatalogProduct[] = [];
  for (const row of rows) {
    const doc = row?.document;
    if (!doc?.name || !doc.fields) continue;
    const p = toProduct(doc.name, doc.fields);
    if (p) products.push(p);
  }
  products.sort((a, b) => (a.brandName + a.productName).localeCompare(b.brandName + b.productName));
  return products;
}

/**
 * Published GlowVai products, cached for a few minutes. Pass `force` to skip the cache
 * (pull-to-refresh, Retry). Throws CatalogError with friendly copy.
 */
export async function getCatalogProducts(force = false): Promise<CatalogProduct[]> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.products;
  if (inFlight) return inFlight;
  inFlight = fetchFromFirestore()
    .then(products => {
      cache = { at: Date.now(), products };
      return products;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** SKU the vendor app gives a store item added from the catalogue. One per catalogue product. */
export function catalogSku(productId: string): string {
  return `GV-${productId}`;
}

/** The catalogue product id behind a store SKU, or null for older free-text items. */
export function catalogIdFromSku(sku?: string | null): string | null {
  return sku && sku.startsWith('GV-') ? sku.slice(3) : null;
}

export function catalogTitle(p: Pick<CatalogProduct, 'productName' | 'volume'>): string {
  return p.volume ? `${p.productName} · ${p.volume}` : p.productName;
}

/** Case-insensitive match on brand, product name, category, volume and key actives. */
export function matchesCatalogSearch(p: CatalogProduct, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = `${p.brandName} ${p.productName} ${p.category} ${p.volume} ${p.keyActives}`.toLowerCase();
  return words.every(w => hay.includes(w));
}
