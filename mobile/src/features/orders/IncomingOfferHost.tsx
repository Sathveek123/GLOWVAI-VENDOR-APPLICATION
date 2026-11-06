/**
 * IncomingOfferHost: shows a new order offer as a sheet over any screen, and feeds the
 * Orders tab badge. Mounted once in app/(vendor)/_layout.tsx.
 *
 * Offers come from the order list kept current by src/features/orders/sync.ts (polling;
 * there is no push yet). Each offer opens the sheet once. Closing the sheet without an
 * answer keeps the offer in Orders > Offers. A short chime and vibration mark a new offer.
 * File: mobile/src/features/orders/IncomingOfferHost.tsx
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import useVendorStore, { type Order } from '../../store/useVendorStore';
import { soundService } from '../../services/sound';
import { useNavBadge } from '../../components/MobileBottomNav';
import { bucketOf, itemsSummary } from './model';
import OfferSheet from './OfferSheet';

/** The chime repeats this often, a few times, until the vendor answers or closes the sheet. */
const CHIME_EVERY_MS = 12_000;
const CHIME_REPEATS = 3;

export function IncomingOfferHost() {
  const router = useRouter();
  const orders = useVendorStore(s => s.orders);

  // Orders tab badge: offers waiting plus orders to pack.
  const badge = useMemo(
    () => orders.reduce((n, o) => {
      const b = bucketOf(o);
      return b === 'offers' || b === 'preparing' ? n + 1 : n;
    }, 0),
    [orders],
  );
  useNavBadge('orders', badge);

  const [closed, setClosed] = useState<Record<string, true>>({});
  const [active, setActive] = useState<Order | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const answered = useRef<string | null>(null);

  const waiting = useMemo(
    () => orders
      .filter(o => bucketOf(o) === 'offers' && !closed[o.orderId])
      .sort((a, b) => a.placedAt - b.placedAt),
    [orders, closed],
  );

  // Open the oldest waiting offer when nothing is showing.
  useEffect(() => {
    if (!active && waiting[0]) setActive(waiting[0]);
  }, [active, waiting]);

  const activeId = active?.orderId;
  const live = activeId ? orders.find(o => o.orderId === activeId) : undefined;
  const outcome: 'gone' | 'cancelled' | undefined = !activeId
    ? undefined
    : !live
      ? 'gone'
      : live.cancelled
        ? 'cancelled'
        : undefined;

  // A short alert for each offer the first time it appears.
  useEffect(() => {
    if (!activeId || seen.current.has(activeId)) return;
    seen.current.add(activeId);
    answered.current = null;
    soundService.playIncomingOrderChime(active ? itemsSummary(active) : undefined);
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      if (answered.current === activeId || count > CHIME_REPEATS) {
        clearInterval(timer);
        return;
      }
      soundService.playIncomingOrderChime();
    }, CHIME_EVERY_MS);
    return () => clearInterval(timer);
    // `active` is read only for the notification text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  if (!active) return null;

  const close = () => {
    answered.current = active.orderId;
    setClosed(c => ({ ...c, [active.orderId]: true }));
    setActive(null);
  };

  return (
    <OfferSheet
      visible
      order={live && live.isOffer ? live : active}
      serverOutcome={outcome}
      onInteract={() => {
        answered.current = active.orderId;
      }}
      onStartPacking={order => {
        close();
        router.push({ pathname: '/(vendor)/pack-order', params: { orderId: order.orderId } } as any);
      }}
      onClose={close}
    />
  );
}

export default IncomingOfferHost;
