/**
 * Inventory: how many of each GlowVai catalogue product this store has, from the vendor API.
 * Contract: docs/VENDOR_API.md (GET / PUT /api/vendor/inventory).
 *
 * Products themselves are read from the published GlowVai catalogue
 * (src/features/catalog/catalogSource.ts); this file only carries the store's own numbers.
 *
 * Variants: a product with variants (sizes, shades, packs) has read-only variant data from
 * the GlowVai catalogue (`variants` on GET ?variants=1). The store sets stock and availability
 * per variant with `variantId`. A product-level line has `variantId: null`.
 */
import { vendorFetch } from './http';

export interface InventoryRecord {
  productId: string;
  /** Null for the product-level line; the variant id for a variant line. */
  variantId: string | null;
  /** Whole units on the shelf, 0 to 100000. */
  stock: number;
  /** False when the store has paused this product (or this variant). */
  isAvailable: boolean;
  /** The store's own price, when set (> 0 and at most the product's MRP). Product-level lines only. */
  unitPriceOverride?: number;
  updatedAt: number;
  lastRestockedAt: number;
}

export interface InventoryInput {
  productId: string;
  /** Leave out for the product-level line. */
  variantId?: string;
  stock: number;
  isAvailable: boolean;
  /** Leave out to use the GlowVai catalogue price. Not allowed with variantId. */
  unitPriceOverride?: number;
}

/** A variant as the GlowVai catalogue lists it. Read-only in the app. */
export interface CatalogVariant {
  id: string;
  label: string;
  price: number;
  mrp: number;
  /** Units GlowVai holds for sale, or null when not tracked. */
  stock: number | null;
  isAvailable: boolean;
  sku?: string;
}

export const MAX_STOCK = 100_000;
/** The server accepts at most this many items in one PUT. */
export const INVENTORY_BATCH_MAX = 100;

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Keeps only the fields the app uses, with safe types. */
export function normalizeInventory(raw: any): InventoryRecord | null {
  const productId = typeof raw?.productId === 'string' ? raw.productId.trim() : '';
  if (!productId) return null;
  const variantId = typeof raw?.variantId === 'string' && raw.variantId.trim() ? raw.variantId.trim() : null;
  const override = num(raw?.unitPriceOverride, NaN);
  return {
    productId,
    variantId,
    stock: Math.max(0, Math.floor(num(raw?.stock))),
    isAvailable: raw?.isAvailable !== false,
    unitPriceOverride: !variantId && Number.isFinite(override) && override > 0 ? override : undefined,
    updatedAt: num(raw?.updatedAt),
    lastRestockedAt: num(raw?.lastRestockedAt),
  };
}

/** Reads one catalogue variant, keeping only well-formed entries. */
export function normalizeCatalogVariant(raw: any): CatalogVariant | null {
  const id = typeof raw?.id === 'string' ? raw.id.trim() : '';
  if (!id) return null;
  const stock = raw?.stock === null || raw?.stock === undefined ? null : Math.max(0, Math.floor(num(raw.stock)));
  const sku = typeof raw?.sku === 'string' && raw.sku.trim() ? raw.sku.trim() : undefined;
  return {
    id,
    label: typeof raw?.label === 'string' && raw.label.trim() ? raw.label.trim() : id,
    price: num(raw?.price),
    mrp: num(raw?.mrp),
    stock,
    isAvailable: raw?.isAvailable !== false,
    sku,
  };
}

/** Key of a line in a list or map: the product id for the product line, "productId::variantId" for a variant. */
export function inventoryKey(productId: string, variantId?: string | null): string {
  return variantId ? `${productId}::${variantId}` : productId;
}

function clean(input: InventoryInput): InventoryInput {
  const out: InventoryInput = {
    productId: input.productId,
    stock: Math.min(MAX_STOCK, Math.max(0, Math.floor(input.stock))),
    isAvailable: !!input.isAvailable,
  };
  if (input.variantId) {
    out.variantId = input.variantId;
    return out;
  }
  if (typeof input.unitPriceOverride === 'number' && input.unitPriceOverride > 0) {
    out.unitPriceOverride = Math.round(input.unitPriceOverride * 100) / 100;
  }
  return out;
}

export interface InventoryList {
  records: InventoryRecord[];
  variants: Record<string, CatalogVariant[]>;
}

export const inventoryApi = {
  /** The store's lines. With `withVariants`, also the catalogue variants of those products (read-only). */
  list: async (opts: { withVariants?: boolean } = {}): Promise<InventoryList> => {
    const res = await vendorFetch<{ ok: true; items?: unknown[]; variants?: Record<string, unknown[]> }>(
      opts.withVariants ? '/api/vendor/inventory?variants=1' : '/api/vendor/inventory',
    );
    const records = (Array.isArray(res.items) ? res.items : [])
      .map(normalizeInventory)
      .filter((r): r is InventoryRecord => r !== null);
    const variants: Record<string, CatalogVariant[]> = {};
    for (const [productId, list] of Object.entries(res.variants ?? {})) {
      if (!Array.isArray(list)) continue;
      const cleaned = list.map(normalizeCatalogVariant).filter((v): v is CatalogVariant => v !== null);
      if (cleaned.length) variants[productId] = cleaned;
    }
    return { records, variants };
  },

  /**
   * Saves one or more items. Larger edits are sent in batches of 100, one after another;
   * a failed batch stops the rest and throws (items saved before it stay saved and are
   * returned through `onSaved`).
   */
  save: async (
    items: InventoryInput[],
    onSaved?: (saved: InventoryRecord[]) => void,
  ): Promise<InventoryRecord[]> => {
    const all: InventoryRecord[] = [];
    for (let i = 0; i < items.length; i += INVENTORY_BATCH_MAX) {
      const chunk = items.slice(i, i + INVENTORY_BATCH_MAX).map(clean);
      const res = await vendorFetch<{ ok: true; items?: unknown[] }>('/api/vendor/inventory', {
        method: 'PUT',
        body: { items: chunk },
      });
      // The server answered ok; if it did not echo the items, what was sent is what it saved.
      const echoed = Array.isArray(res.items)
        ? res.items
        : chunk.map(c => ({ ...c, variantId: c.variantId ?? null, updatedAt: Date.now() }));
      const saved = echoed.map(normalizeInventory).filter((r): r is InventoryRecord => r !== null);
      all.push(...saved);
      onSaved?.(saved);
    }
    return all;
  },
};
