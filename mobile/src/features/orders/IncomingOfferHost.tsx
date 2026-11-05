/**
 * IncomingOfferHost: listens for new order offers and shows the offer sheet over any screen.
 *
 * Mount it once in app/(vendor)/_layout.tsx:  <IncomingOfferHost />
 * Home and Orders also mount <IncomingOfferHost fallback /> so offers keep working until
 * the layout does. Only one instance is ever active: a layout instance wins over fallbacks.
 *
 * What it does
 *  - Registers the vendor on every socket connect and keeps the store's isConnected current.
 *  - Queues offers from 'order:incoming' / 'ORDER_OFFER' (deduped by orderId).
 *  - Re-reads pending offers from the API on connect and every 30 s, because push
 *    delivery is not guaranteed (PRD 3.2).
 *  - Applies 'order:statusUpdated' and 'order:rejected' to the shared order store.
 *  - Marks an open offer as taken on 'ORDER_CLAIMED_BY_OTHER', or as gone when cancelled.
 *  - Repeats the alert chime until the vendor responds or closes the sheet.
 * File: mobile/src/features/orders/IncomingOfferHost.tsx
 */
import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { useRouter } from 'expo-router';
import { create } from 'zustand';
import useVendorStore, { normalizeOrder } from '../../store/useVendorStore';
import type { Order } from '../../store/useVendorStore';
import { ordersApi } from '../../services/api';
import { useVendorSession } from '../../services/session';
import { ORDER_EVENTS, getSocket, registerVendor } from '../../services/socket';
import { soundService } from '../../services/sound';
import { bucketOf } from './model';
import OfferSheet from './OfferSheet';

const POLL_MS = 30_000;
const CHIME_EVERY_MS = 4_000;

interface QueuedOffer {
  order: Order;
  receivedAt: number;
  /** Expiry on this device's clock, only when the server sent one. */
  expiresAt?: number;
  outcome?: 'taken' | 'gone';
}

interface OfferQueueState {
  queue: QueuedOffer[];
  /** Offers the vendor answered or closed this session. Not offered again. */
  handled: Record<string, true>;
  enqueue: (offer: QueuedOffer) => void;
  markOutcome: (orderId: string, outcome: 'taken' | 'gone') => void;
  close: (orderId: string) => void;
}

export const useOfferQueue = create<OfferQueueState>((set) => ({
  queue: [],
  handled: {},
  enqueue: (offer) =>
    set((s) => {
      const id = offer.order.orderId;
      if (!id || s.handled[id] || s.queue.some((q) => q.order.orderId === id)) return {};
      return { queue: [...s.queue, offer] };
    }),
  markOutcome: (orderId, outcome) =>
    set((s) => ({
      queue: s.queue.map((q) => (q.order.orderId === orderId && !q.outcome ? { ...q, outcome } : q)),
    })),
  close: (orderId) =>
    set((s) => ({
      queue: s.queue.filter((q) => q.order.orderId !== orderId),
      handled: { ...s.handled, [orderId]: true },
    })),
}));

function toMs(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
    const p = Date.parse(value);
    return Number.isNaN(p) ? undefined : p;
  }
  return undefined;
}

/** Builds a queued offer from a socket payload ({ order, sentAt, expiresAt? }) or a bare order. */
function toOffer(payload: any): { raw: any; offer: QueuedOffer } | null {
  const raw = payload?.order ?? payload;
  const order = normalizeOrder(raw);
  if (!order.orderId || bucketOf(order.status) !== 'incoming') return null;
  const receivedAt = Date.now();
  const serverExpiry = toMs(payload?.offerExpiresAt) ?? toMs(payload?.expiresAt) ?? order.offerExpiresAt;
  let expiresAt: number | undefined;
  if (serverExpiry) {
    // Correct for clock difference using the server's send time, when it is plausible.
    const sentAt = toMs(payload?.serverTime) ?? toMs(payload?.sentAt);
    const offset = sentAt ? receivedAt - sentAt : 0;
    expiresAt = serverExpiry + (Math.abs(offset) < 10 * 60_000 ? offset : 0);
  }
  return { raw, offer: { order, receivedAt, expiresAt } };
}

// ── Single active instance ────────────────────────────────────────────────────
let hostSeq = 0;
let hosts: { id: number; fallback: boolean }[] = [];
const hostListeners = new Set<() => void>();
const notifyHosts = () => hostListeners.forEach((fn) => fn());

function activeHostId(): number | undefined {
  return (hosts.find((h) => !h.fallback) ?? hosts[0])?.id;
}

function useIsActiveHost(fallback: boolean): boolean {
  const idRef = useRef(0);
  if (!idRef.current) idRef.current = ++hostSeq;
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const id = idRef.current;
    hosts.push({ id, fallback });
    hostListeners.add(force);
    notifyHosts();
    return () => {
      hosts = hosts.filter((h) => h.id !== id);
      hostListeners.delete(force);
      notifyHosts();
    };
  }, [fallback]);
  return activeHostId() === idRef.current;
}

export function IncomingOfferHost({ fallback = false }: { fallback?: boolean }) {
  const active = useIsActiveHost(fallback);
  return active ? <OfferHostRuntime /> : null;
}

export default IncomingOfferHost;

function OfferHostRuntime() {
  const router = useRouter();
  const session = useVendorSession();
  const upsertOrder = useVendorStore((s) => s.upsertOrder);
  const updateOrder = useVendorStore((s) => s.updateOrder);
  const setConnected = useVendorStore((s) => s.setConnected);
  const queue = useOfferQueue((s) => s.queue);
  const enqueue = useOfferQueue((s) => s.enqueue);
  const markOutcome = useOfferQueue((s) => s.markOutcome);
  const closeOffer = useOfferQueue((s) => s.close);

  const current = queue[0];
  const respondedRef = useRef<string | null>(null);

  const receive = useCallback(
    (payload: any) => {
      const built = toOffer(payload);
      if (!built) return;
      upsertOrder(built.raw);
      enqueue(built.offer);
    },
    [enqueue, upsertOrder],
  );

  const pollPending = useCallback(() => {
    ordersApi
      .getPending()
      .then((res: any) => {
        (Array.isArray(res?.orders) ? res.orders : []).forEach((o: any) => receive({ order: o }));
      })
      .catch(() => {
        // The socket and the Orders screen still work; the next poll retries.
      });
  }, [receive]);

  // Socket wiring. Re-run when the session ids load.
  useEffect(() => {
    if (!session.loaded) return;
    let socket: ReturnType<typeof getSocket>;
    try {
      socket = getSocket();
    } catch (_) {
      return;
    }
    const register = () => registerVendor(session.vendorId || '', session.storeId || '');
    const onConnect = () => {
      // Deferred: updating state inside the connect callback crashed the web renderer before.
      setTimeout(() => {
        setConnected(true);
        register();
        pollPending();
      }, 0);
    };
    const onDisconnect = () => setConnected(false);
    const onOffer = (payload: any) => receive(payload);
    const onClaimed = (p: any) => p?.orderId && markOutcome(String(p.orderId), 'taken');
    const onStatus = (p: any) => {
      if (!p?.orderId) return;
      const id = String(p.orderId);
      const fields: Partial<Order> = { status: p.status };
      if (p.pickupBay) fields.pickupBay = p.pickupBay;
      if (p.updatedAt) fields.updatedAt = Number(p.updatedAt) || undefined;
      updateOrder(id, fields);
      const bucket = bucketOf(p.status);
      if (bucket === 'cancelled') markOutcome(id, 'gone');
    };
    const onRejected = (p: any) => {
      if (!p?.orderId) return;
      updateOrder(String(p.orderId), { status: p.status || 'REJECTED', rejectionReason: p.reason });
    };

    setConnected(socket.connected);
    if (socket.connected) register();
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    ORDER_EVENTS.offer.forEach((ev) => socket.on(ev, onOffer));
    socket.on(ORDER_EVENTS.claimedByOther, onClaimed);
    socket.on(ORDER_EVENTS.statusUpdated, onStatus);
    socket.on(ORDER_EVENTS.rejected, onRejected);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      ORDER_EVENTS.offer.forEach((ev) => socket.off(ev, onOffer));
      socket.off(ORDER_EVENTS.claimedByOther, onClaimed);
      socket.off(ORDER_EVENTS.statusUpdated, onStatus);
      socket.off(ORDER_EVENTS.rejected, onRejected);
    };
  }, [session.loaded, session.vendorId, session.storeId, receive, markOutcome, updateOrder, setConnected, pollPending]);

  // Pending offers from the API: once on start, then on a timer.
  useEffect(() => {
    if (!session.loaded) return;
    pollPending();
    const timer = setInterval(pollPending, POLL_MS);
    return () => clearInterval(timer);
  }, [session.loaded, pollPending]);

  // Alert sound and vibration until the vendor responds to the current offer.
  const currentId = current?.order.orderId;
  const currentOutcome = current?.outcome;
  useEffect(() => {
    if (!currentId || currentOutcome || respondedRef.current === currentId) return;
    soundService.playIncomingOrderChime();
    const timer = setInterval(() => {
      if (respondedRef.current !== currentId) soundService.playIncomingOrderChime();
    }, CHIME_EVERY_MS);
    return () => {
      clearInterval(timer);
      soundService.stopRinging();
    };
  }, [currentId, currentOutcome]);

  // If the order moved on elsewhere (accepted from Order detail, cancelled), stop offering it.
  // The sheet's own accept is left alone so it can show "Order accepted".
  const storeStatus = useVendorStore((s) =>
    currentId ? s.orders.find((o) => o.orderId === currentId)?.status : undefined,
  );
  useEffect(() => {
    if (!currentId || !storeStatus || respondedRef.current === currentId) return;
    const bucket = bucketOf(storeStatus);
    if (bucket === 'incoming') return;
    if (bucket === 'cancelled') markOutcome(currentId, 'gone');
    else closeOffer(currentId);
  }, [currentId, storeStatus, markOutcome, closeOffer]);

  if (!current) return null;

  const close = () => closeOffer(current.order.orderId);

  return (
    <OfferSheet
      visible
      order={current.order}
      expiresAt={current.expiresAt}
      receivedAt={current.receivedAt}
      serverOutcome={current.outcome}
      onInteract={() => {
        respondedRef.current = current.order.orderId;
        soundService.stopRinging();
      }}
      onStartPicking={(order) => {
        close();
        router.push({ pathname: '/(vendor)/order-detail', params: { orderId: order.orderId } } as any);
      }}
      onClose={close}
    />
  );
}
