/**
 * Loading hooks for the store's inventory (vendor backend) and the GlowVai master
 * catalogue (Firestore, read-only). Each reports loading, ready or error honestly;
 * nothing falls back to sample data.
 * File: mobile/src/features/catalog/hooks.ts
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { inventoryApi } from '../../services/api';
import { useVendorSession } from '../../services/session';
import useVendorStore, { type InventoryItem } from '../../store/useVendorStore';
import { CatalogError, getCatalogProducts, type CatalogProduct } from './catalogSource';
import { friendlyError } from './stock';

export type LoadState = 'loading' | 'ready' | 'error';

export function useStoreInventory() {
  const session = useVendorSession();
  const { inventory, setInventory, updateInventoryItem, addInventoryItem } = useVendorStore();
  const items = useMemo(() => (Array.isArray(inventory) ? inventory.filter(i => i.status !== 'deleted') : []), [inventory]);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!session.loaded) return;
    setError('');
    try {
      const res: any = await inventoryApi.getAll(session.storeId || undefined);
      setInventory(Array.isArray(res?.items) ? (res.items as InventoryItem[]) : []);
      setState('ready');
    } catch (err) {
      setError(friendlyError(err, 'We could not load your stock. Please try again.'));
      setState('error');
    }
  }, [session.loaded, session.storeId, setInventory]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, state, error, reload, updateInventoryItem, addInventoryItem };
}

export function useCatalogue() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');

  const reload = useCallback(async (force = false) => {
    setError('');
    try {
      const list = await getCatalogProducts(force);
      setProducts(list);
      setState('ready');
    } catch (err) {
      setError(err instanceof CatalogError ? err.message : 'We could not load the GlowVai catalogue. Please try again.');
      setState('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const byId = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  return { products, byId, state, error, reload };
}
