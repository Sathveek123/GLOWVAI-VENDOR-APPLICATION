/**
 * GlowVai Vendor App — Socket.IO client (one shared connection).
 *
 * The socket wakes the app up: it delivers new order offers and status changes.
 * It is not the source of truth. Accept, decline and pack go through the REST API,
 * whose answer is what the screens show (see src/features/orders).
 */
import { io, Socket } from 'socket.io-client';
import { getSessionToken } from './session';

const BACKEND_URL = process.env.EXPO_PUBLIC_VENDOR_API_URL || 'http://localhost:4000';

/** Server events the order flow listens to. */
export const ORDER_EVENTS = {
  /** New order offer. The backend sends both names for the same order; dedupe by orderId. */
  offer: ['order:incoming', 'ORDER_OFFER'] as const,
  /** Another store took the order. */
  claimedByOther: 'ORDER_CLAIMED_BY_OTHER',
  statusUpdated: 'order:statusUpdated',
  rejected: 'order:rejected',
} as const;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 10000,
      autoConnect: true,
      // The backend takes the vendor's identity from this token, not from event payloads.
      auth: (cb: (data: object) => void) => {
        getSessionToken().then(token => cb({ token })).catch(() => cb({}));
      },
    });

    // Vendor registration happens in IncomingOfferHost (src/features/orders) on every connect.
    socket.on('disconnect', (reason) => {
      if (__DEV__) console.warn('[socket] disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      if (__DEV__) console.warn('[socket] connect error:', err.message);
    });
  }
  return socket;
}

export function registerVendor(vendorId: string, storeId: string, location?: { lat: number; lng: number }) {
  const s = getSocket();
  s.emit('vendor:register', {
    vendorId,
    storeId,
    lat: location?.lat,
    lng: location?.lng,
  });
}

export function setVendorStatus(vendorId: string, isOnline: boolean) {
  const s = getSocket();
  s.emit('vendor:setStatus', { vendorId, isOnline });
}

export function updateVendorLocation(vendorId: string, latitude: number, longitude: number) {
  const s = getSocket();
  s.emit('vendor:location:update', { vendorId, latitude, longitude });
}

/**
 * Fire-and-forget socket accept. The order flow does not use it: it accepts through
 * ordersApi.accept so it can wait for the server's answer before showing success.
 */
export function acceptOrderOffer(orderId: string, vendorId: string) {
  const s = getSocket();
  s.emit('ACCEPT_ORDER', { orderId, vendorId });
}

/** Socket decline does not record a reason. The order flow uses ordersApi.reject instead. */
export function declineOrderOffer(orderId: string, vendorId: string) {
  const s = getSocket();
  s.emit('DECLINE_ORDER', { orderId, vendorId });
}

/** Call after sign-in or onboarding so the next connection carries the new session token. */
export function resetSocket() {
  disconnectSocket();
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default {
  getSocket,
  registerVendor,
  setVendorStatus,
  updateVendorLocation,
  acceptOrderOffer,
  declineOrderOffer,
  disconnectSocket,
};
