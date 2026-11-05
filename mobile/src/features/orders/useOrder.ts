/**
 * Order data hooks. Orders always live in the shared store, so an action on one
 * screen (accept, pack, a socket status update) shows on every other screen.
 * File: mobile/src/features/orders/useOrder.ts
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import useVendorStore from '../../store/useVendorStore';
import type { Order } from '../../store/useVendorStore';
import { ordersApi } from '../../services/api';
import { friendlyError } from './model';

export type LoadState = 'loading' | 'ready' | 'missing' | 'error';

/**
 * One order: from the store when it is there, otherwise fetched and written into the store.
 * refresh() always re-reads it from the server.
 */
export function useOrder(orderId: string | undefined) {
  const order = useVendorStore(st => (orderId ? st.orders.find(o => o.orderId === orderId) : undefined));
  const upsertOrder = useVendorStore(st => st.upsertOrder);
  const [state, setState] = useState<LoadState>(order ? 'ready' : 'loading');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const hasOrder = !!order;

  useEffect(() => {
    if (!orderId) {
      setState('missing');
      return;
    }
    let cancelled = false;
    if (!hasOrder) setState('loading');
    ordersApi
      .getById(orderId)
      .then((res: any) => {
        if (cancelled) return;
        if (res?.order) {
          upsertOrder(res.order);
          setState('ready');
        } else if (!hasOrder) {
          setState('missing');
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        // A failed background refresh keeps the order we already have.
        if (hasOrder) return;
        if (err?.status === 404) {
          setState('missing');
        } else {
          setError(friendlyError(err));
          setState('error');
        }
      });
    return () => {
      cancelled = true;
    };
    // hasOrder is read once per attempt on purpose: a store update must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, attempt, upsertOrder]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);

  /** Re-reads the order from the server. Resolves true when it succeeded. */
  const refresh = useCallback(async () => {
    if (!orderId) return false;
    try {
      const res: any = await ordersApi.getById(orderId);
      if (res?.order) upsertOrder(res.order);
      return true;
    } catch (_) {
      return false;
    }
  }, [orderId, upsertOrder]);

  return {
    order: order as Order | undefined,
    state: order ? ('ready' as LoadState) : state,
    error,
    retry,
    refresh,
  };
}

/**
 * The store's full order list, loaded from the API. Used by Home and Orders.
 * pollMs re-reads the list while the screen is open, so it stays current if the
 * socket drops.
 */
export function useOrdersFeed(pollMs = 30_000) {
  const orders = useVendorStore(st => st.orders);
  const setOrders = useVendorStore(st => st.setOrders);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const res: any = await ordersApi.getAll();
      setOrders(Array.isArray(res?.orders) ? res.orders : []);
      setHasLoaded(true);
      setError('');
      setState('ready');
    } catch (err) {
      setError(friendlyError(err));
      setState('error');
    } finally {
      loadingRef.current = false;
    }
  }, [setOrders]);

  useEffect(() => {
    load();
    if (!pollMs) return;
    const timer = setInterval(load, pollMs);
    return () => clearInterval(timer);
  }, [load, pollMs]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { orders, state, error, hasLoaded, refreshing, refresh };
}
