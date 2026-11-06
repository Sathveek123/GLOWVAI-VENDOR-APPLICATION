/**
 * Inventory: how many of each GlowVai catalogue product this store has, from the vendor API.
 * Contract: docs/VENDOR_API.md (GET / PUT /api/vendor/inventory).
 *
 * Products themselves are read from the published GlowVai catalogue
 * (src/features/catalog/catalogSource.ts); this file only carries the store's own numbers.
 */
import { vendorFetch } from './http';

export interface InventoryRecord {
  productId: string;
  /** Whole units on the shelf, 0 to 100000. */
  stock: number;
  /** False when the store has paused this product. */
  isAvailable: boolean;
  /** The store's own price, when set (> 0 and at most the product's MRP). */
  unitPriceOverride?: number;
  updatedAt: number;
  lastRestockedAt: number;
}

export interface InventoryInput {
  productId: string;
  stock: number;
  isAvailable: boolean;
  /** Leave out to use the GlowVai catalogue price. */
  unitPriceOverride?: number;
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
  const override = num(raw?.unitPriceOverride, NaN);
  return {
    productId,
    stock: Math.max(0, Math.floor(num(raw?.stock))),
    isAvailable: raw?.isAvailable !== false,
    unitPriceOverride: Number.isFinite(override) && override > 0 ? override : undefined,
    updatedAt: num(raw?.updatedAt),
    lastRestockedAt: num(raw?.lastRestockedAt),
  };
}

function clean(input: InventoryInput): InventoryInput {
  const out: InventoryInput = {
    productId: input.productId,
    stock: Math.min(MAX_STOCK, Math.max(0, Math.floor(input.stock))),
    isAvailable: !!input.isAvailable,
  };
  if (typeof input.unitPriceOverride === 'number' && input.unitPriceOverride > 0) {
    out.unitPriceOverride = Math.round(input.unitPriceOverride * 100) / 100;
  }
  return out;
}

export const inventoryApi = {
  list: async (): Promise<InventoryRecord[]> => {
    const res = await vendorFetch<{ ok: true; items?: unknown[] }>('/api/vendor/inventory');
    return (Array.isArray(res.items) ? res.items : [])
      .map(normalizeInventory)
      .filter((r): r is InventoryRecord => r !== null);
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
      const echoed = Array.isArray(res.items) ? res.items : chunk.map(c => ({ ...c, updatedAt: Date.now() }));
      const saved = echoed.map(normalizeInventory).filter((r): r is InventoryRecord => r !== null);
      all.push(...saved);
      onSaved?.(saved);
    }
    return all;
  },
};
