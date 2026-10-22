/**
 * GlowVAI Vendor App — Real-Time Resilient Socket.IO Client
 * ═══════════════════════════════════════════════════════════════════════════
 * Handles:
 *  - Auto-reconnect with exponential backoff on network drop
 *  - Live vendor location pinging for Redis GEO queries
 *  - High-speed order acceptance race condition triggers
 *  - Dismissal events when another vendor claims the order
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.EXPO_PUBLIC_VENDOR_API_URL || 'http://localhost:4000';

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
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket] Connected to GlowVAI Dispatch Gateway:', socket?.id);
      // Vendor registration is done by the screen that owns the session (see home.tsx).
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 [Socket] Reconnected after ${attemptNumber} attempts`);
    });

    socket.on('disconnect', (reason) => {
      console.warn('❌ [Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('🔴 [Socket] Connect Error:', err.message);
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
 * ⚡ Send instant order acceptance into the Redis Distributed Lock race
 */
export function acceptOrderOffer(orderId: string, vendorId: string) {
  const s = getSocket();
  s.emit('ACCEPT_ORDER', { orderId, vendorId });
}

export function declineOrderOffer(orderId: string, vendorId: string) {
  const s = getSocket();
  s.emit('DECLINE_ORDER', { orderId, vendorId });
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
