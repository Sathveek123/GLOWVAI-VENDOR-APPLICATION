/**
 * Stock rules shared by Inventory, Add from catalogue and Home.
 * A row is a published GlowVai product plus this store's inventory record, if any.
 * File: mobile/src/features/catalog/stock.ts
 */
import type { InventoryRecord } from '../../services/vendorApi/inventory';
import type { CatalogProduct } from './catalogSource';
import { LOW_STOCK_LEVEL } from './inventory';

export type RowState = 'not_stocked' | 'selling' | 'low' | 'out' | 'paused';

export interface ProductRow {
  product: CatalogProduct;
  record?: InventoryRecord;
  state: RowState;
}

export function rowState(record: InventoryRecord | undefined): RowState {
  if (!record) return 'not_stocked';
  if (!record.isAvailable) return 'paused';
  if (record.stock === 0) return 'out';
  if (record.stock <= LOW_STOCK_LEVEL) return 'low';
  return 'selling';
}

export const STATE_LABEL: Record<RowState, string> = {
  not_stocked: 'Not in your store',
  selling: 'Selling',
  low: 'Running low',
  out: 'Out of stock',
  paused: 'Paused',
};

export type StateTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export const STATE_TONE: Record<RowState, StateTone> = {
  not_stocked: 'neutral',
  selling: 'success',
  low: 'warning',
  out: 'danger',
  paused: 'neutral',
};

export function formatRupees(amount: number) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** Builds rows for every published product, in catalogue order. */
export function buildRows(products: CatalogProduct[], inventory: Record<string, InventoryRecord>): ProductRow[] {
  return products.map(product => {
    const record = inventory[product.id];
    return { product, record, state: rowState(record) };
  });
}

/** Checks a price override: empty is fine (GlowVai price), otherwise > 0 and at most the MRP. */
export function priceError(text: string, mrp: number): string {
  const t = text.trim();
  if (!t) return '';
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return 'Enter a price in rupees, for example 499.';
  const n = Number(t);
  if (n <= 0) return 'The price must be more than ₹0.';
  if (mrp > 0 && n > mrp) return `The price cannot be more than the MRP, ${formatRupees(mrp)}.`;
  return '';
}
