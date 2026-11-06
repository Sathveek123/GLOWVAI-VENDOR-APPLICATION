/**
 * One order from the shared order list (kept current by sync.ts). There is no single-order
 * route on the server, so a screen that shows an order also keeps the list polling.
 * File: mobile/src/features/orders/useOrder.ts
 */
import useVendorStore, { type Order } from '../../store/useVendorStore';
import { refreshOrdersNow, useOrdersDemand } from './sync';

export type LoadState = 'loading' | 'ready' | 'missing' | 'error';

export function useOrder(orderId: string | undefined) {
  useOrdersDemand();
  const order = useVendorStore(st => (orderId ? st.orders.find(o => o.orderId === orderId) : undefined));
  const sync = useVendorStore(st => st.ordersSync);

  let state: LoadState;
  if (order) state = 'ready';
  else if (!orderId) state = 'missing';
  else if (sync.hasLoaded) state = 'missing';
  else if (sync.state === 'error') state = 'error';
  else state = 'loading';

  return {
    order: order as Order | undefined,
    state,
    error: sync.error || '',
    retry: () => refreshOrdersNow(),
  };
}
