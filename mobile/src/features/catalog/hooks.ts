/**
 * The published GlowVai catalogue (Firestore `products` where status == PUBLISHED, read-only).
 * The store's own numbers come from src/features/catalog/inventory.ts.
 * File: mobile/src/features/catalog/hooks.ts
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CatalogError, getCatalogProducts, type CatalogProduct } from './catalogSource';

export type LoadState = 'loading' | 'ready' | 'error';

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
