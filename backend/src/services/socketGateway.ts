/**
 * GlowVAI Real-Time Socket Gateway & Redis Distributed Lock Engine
 * ═══════════════════════════════════════════════════════════════════════════
 * Rapido / Blinkit Grade Distributed Dispatcher:
 *   • Atomic First-to-Accept Concurrency Lock (Redis SET NX PX)
 *   • Vendor Real-Time Presence & Socket Heartbeats
 *   • 45s SLA Order Countdown Broadcast Fanout
 *   • Seamless Race-Condition Handling
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import Redis from 'ioredis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => `[SocketGateway] ${timestamp} ${level}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

export interface SocketGatewayConfig {
  redisUrl?: string;
  broadcastTtlMs?: number;
}

export class GlowvaiSocketGateway {
  private io: SocketIOServer;
  private redisClient: Redis;
  private redisSub: Redis;
  private broadcastTtlMs: number;

  // In-memory fallback if Redis connection is in local development mode
  private memoryLocks = new Map<string, { winnerId: string; expiresAt: number }>();
  private activeVendorSockets = new Map<string, string>(); // vendorId -> socketId

  constructor(io: SocketIOServer, config?: SocketGatewayConfig) {
    this.io = io;
    this.broadcastTtlMs = config?.broadcastTtlMs || 45000;

    const redisHost = process.env.REDIS_URL || config?.redisUrl || 'redis://localhost:6379';
    this.redisClient = new Redis(redisHost, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 2000)),
    });
    this.redisSub = new Redis(redisHost, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });

    this.initRedis();
    this.registerSocketEvents();
  }

  private async initRedis() {
    try {
      await this.redisClient.connect();
      await this.redisSub.connect();
      logger.info('✅ Connected to Redis Distributed Lock cluster');
    } catch (err: any) {
      logger.warn(`⚠️ Redis not active (${err.message}). Using in-memory atomic distributed lock fallback.`);
    }
  }

  /**
   * Acquire atomic lock for order assignment (First-to-accept race condition prevention)
   */
  public async acquireOrderLock(orderId: string, vendorId: string, ttlMs: number = 45000): Promise<{ success: boolean; winnerId: string }> {
    const lockKey = `lock:order:${orderId}`;

    if (this.redisClient.status === 'ready') {
      try {
        // Atomic SET if Not Exists with millisecond expiration
        const result = await this.redisClient.set(lockKey, vendorId, 'PX', ttlMs, 'NX');
        if (result === 'OK') {
          return { success: true, winnerId: vendorId };
        }
        const existingWinner = await this.redisClient.get(lockKey);
        return { success: false, winnerId: existingWinner || 'ANOTHER_VENDOR' };
      } catch (e: any) {
        logger.error(`Redis lock error: ${e.message}. Falling back to memory lock.`);
      }
    }

    // Atomic In-Memory Fallback
    const now = Date.now();
    const current = this.memoryLocks.get(orderId);
    if (!current || now > current.expiresAt) {
      this.memoryLocks.set(orderId, { winnerId: vendorId, expiresAt: now + ttlMs });
      return { success: true, winnerId: vendorId };
    }
    return { success: false, winnerId: current.winnerId };
  }

  /**
   * Broadcast an incoming customer order to candidate dark stores
   */
  public broadcastOrderOffer(order: any, candidateVendorIds: string[]) {
    const payload = {
      orderId: order.orderId || order.id,
      order,
      expiresInSeconds: 45,
      broadcastAt: Date.now(),
      expiresAt: Date.now() + this.broadcastTtlMs,
    };

    logger.info(`📢 Broadcasting Order #${payload.orderId} to ${candidateVendorIds.length} candidate vendors`);

    candidateVendorIds.forEach(vendorId => {
      this.io.to(`vendor:${vendorId}`).emit('ORDER_OFFER', payload);
    });

    // Also broadcast to store room
    if (order.storeId) {
      this.io.to(`store:${order.storeId}`).emit('order:incoming', payload);
    }
  }

  private registerSocketEvents() {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`📡 Client connected: ${socket.id}`);

      // ── Vendor Registration & Heartbeat ─────────────────────────────────────
      socket.on('VENDOR_REGISTER', async ({ vendorId, storeId, lat, lng }) => {
        if (!vendorId) return;

        socket.join(`vendor:${vendorId}`);
        if (storeId) socket.join(`store:${storeId}`);
        this.activeVendorSockets.set(vendorId, socket.id);

        if (this.redisClient.status === 'ready') {
          await this.redisClient.hset('active_vendors', vendorId, JSON.stringify({ socketId: socket.id, storeId, lat, lng, lastSeen: Date.now() }));
          if (lat && lng) {
            await this.redisClient.geoadd('vendor_locations', lng, lat, vendorId);
          }
        }

        socket.emit('REGISTER_SUCCESS', { ok: true, vendorId, storeId, registeredAt: Date.now() });
        logger.info(`🏪 Vendor ${vendorId} joined room (Store: ${storeId || 'N/A'})`);
      });

      // ── Vendor Duty Status Toggle (Go Online / Go Offline) ─────────────────
      socket.on('vendor:status_change', async ({ vendorId, isOnline, reason }) => {
        logger.info(`🔄 Vendor ${vendorId} duty changed to: ${isOnline ? 'ONLINE 🟢' : 'OFFLINE 🔴'}`);

        if (this.redisClient.status === 'ready') {
          if (isOnline) {
            await this.redisClient.sadd('online_vendors', vendorId);
          } else {
            await this.redisClient.srem('online_vendors', vendorId);
          }
        }

        this.io.emit('vendor:statusUpdated', { vendorId, isOnline, reason, updatedAt: Date.now() });
        socket.emit('vendor:statusAck', { ok: true, isOnline });
      });

      // ── Atomic First-to-Accept Order Claim ─────────────────────────────────
      socket.on('ACCEPT_ORDER', async ({ orderId, vendorId }, ackCallback) => {
        logger.info(`⚡ Vendor ${vendorId} attempting to accept Order #${orderId}`);

        const lockResult = await this.acquireOrderLock(orderId, vendorId, this.broadcastTtlMs);

        if (lockResult.success) {
          logger.info(`🎯 Order #${orderId} LOCKED for Vendor ${vendorId}! Winner confirmed.`);

          // 1. Notify winning vendor with confirmation payload
          socket.emit('ORDER_CONFIRMED', {
            ok: true,
            orderId,
            vendorId,
            message: 'Order successfully assigned to your dark store!',
            confirmedAt: Date.now(),
          });

          // 2. Dismiss offer popup from all other candidate vendor screens
          socket.broadcast.emit('ORDER_CLAIMED_BY_OTHER', {
            orderId,
            winnerVendorId: vendorId,
            message: 'This order was accepted by another nearby vendor.',
          });

          if (typeof ackCallback === 'function') {
            ackCallback({ ok: true, winner: true });
          }
        } else {
          logger.warn(`❌ Order #${orderId} claim failed for Vendor ${vendorId}. Already won by ${lockResult.winnerId}`);

          socket.emit('ORDER_CLAIM_FAILED', {
            ok: false,
            orderId,
            winnerVendorId: lockResult.winnerId,
            message: 'Order no longer available. Another nearby partner accepted it first.',
          });

          if (typeof ackCallback === 'function') {
            ackCallback({ ok: false, winner: false, winnerId: lockResult.winnerId });
          }
        }
      });

      // ── Vendor Rejection of Offer ──────────────────────────────────────────
      socket.on('DECLINE_ORDER', ({ orderId, vendorId, reason }) => {
        logger.info(`🚫 Vendor ${vendorId} declined Order #${orderId} (Reason: ${reason || 'Busy'})`);
        socket.emit('ORDER_DISMISSED', { orderId });
      });

      // ── Disconnect Cleanup ────────────────────────────────────────────────
      socket.on('disconnect', async () => {
        for (const [vId, sId] of this.activeVendorSockets.entries()) {
          if (sId === socket.id) {
            this.activeVendorSockets.delete(vId);
            if (this.redisClient.status === 'ready') {
              await this.redisClient.hdel('active_vendors', vId);
              await this.redisClient.srem('online_vendors', vId);
            }
            logger.info(`❌ Vendor ${vId} disconnected from socket`);
            break;
          }
        }
      });
    });
  }
}
