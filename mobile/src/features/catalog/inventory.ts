/**
 * The store's inventory (GET / PUT /api/vendor/inventory), shared through the vendor store
 * so Home, Inventory, Add product and the offer sheet read one copy.
 * Reads are reused for a minute so moving between screens does not cost extra calls.
 * File: mobile/src/features/catalog/inventory.ts
 */
import { useCallback, useEffect } from 'react';
import useVendorStore from '../../store/useVendorStore';
import { friendlyError } from '../../services/vendorApi/http';
import { inventoryApi, type InventoryInput, type InventoryRecord } from '../../services/vendorApi/inventory';

const FRESH_MS = 60_000;
let inflight: Promise<void> | null = null;

/** Loads inventory into the store. Reuses a copy younger than a minute unless `force` is set. */
export function loadInventory(force = false): Promise<void> {
  const { inventoryStatus } = useVendorStore.getState();
  if (!force && inventoryStatus.hasLoaded && Date.now() - inventoryStatus.loadedAt < FRESH_MS) {
    return Promise.resolve();
  }
  if (inflight) return inflight;
  const store = useVendorStore.getState();
  store.setInventoryStatus({ state: 'loading' });
  inflight = inventoryApi
    .list({ withVariants: true })
    .then(({ records, variants }) => {
      const s = useVendorStore.getState();
      s.replaceInventory(records);
      s.setVariantCatalogue(variants);
      s.setInventoryStatus({ state: 'ready', hasLoaded: true, error: null, loadedAt: Date.now() });
    })
    .catch(err => {
      useVendorStore.getState().setInventoryStatus({ state: 'error', error: friendlyError(err) });
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Marks inventory as old, so the next read fetches it again (for example after an accept). */
export function invalidateInventory() {
  useVendorStore.getState().setInventoryStatus({ loadedAt: 0 });
}

/**
 * Saves stock, availability and price. Throws VendorApiError on failure; anything the
 * server confirmed before a failure is already in the store.
 */
export async function saveInventory(
  items: InventoryInput[],
  onProgress?: (savedSoFar: number) => void,
): Promise<InventoryRecord[]> {
  let count = 0;
  return inventoryApi.save(items, saved => {
    useVendorStore.getState().mergeInventory(saved);
    count += saved.length;
    onProgress?.(count);
  });
}

/** The store's inventory for a screen. Loads on mount (reusing a fresh copy). */
export function useInventory() {
  const inventory = useVendorStore(s => s.inventory);
  const status = useVendorStore(s => s.inventoryStatus);
  useEffect(() => {
    void loadInventory(false);
  }, []);
  const reload = useCallback(() => loadInventory(true), []);
  return { inventory, status, reload };
}

/** Low stock: 3 or fewer units on the shelf. */
export const LOW_STOCK_LEVEL = 3;

export function isLowStock(r: InventoryRecord | undefined): boolean {
  return !!r && r.stock <= LOW_STOCK_LEVEL;
}
