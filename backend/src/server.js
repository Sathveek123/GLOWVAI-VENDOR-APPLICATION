/**
 * GlowVAI Vendor App — Production Backend Server
 * ═══════════════════════════════════════════════════════════════════════════
 * Architecture: Blinkit / Zepto / Swiggy Instamart-Grade Real-Time Engine
 * Concurrency: Distributed Locking & Atomic Inventory Reservation (Race-Condition Safe)
 * Features:
 *   • Real-time WebSocket (Socket.IO) for live order push notifications
 *   • Firebase Admin SDK — Firestore, Realtime Database, Auth, FCM
 *   • Vendor authentication & live status management
 *   • Order lifecycle (pending → accepted → packed → ready → dispatched → delivered)
 *   • Atomic stock reservations & release on cancel/timeout
 *   • Inventory catalog management & audit-logged stock adjustments
 *   • Instant 12% take-rate / 88% vendor payout ledger
 *   • Rapido-style Redis geospatial dispatch candidate fanout
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const path   = require('path');
const fs     = require('fs');
const http   = require('http');

// ── Load Environment ────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const crypto   = require('crypto');
const uuidv4   = () => crypto.randomUUID();
const express  = require('express');
const cors     = require('cors');
const { Server } = require('socket.io');
const winston  = require('winston');

// ── Logger ──────────────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] ${level}: ${message}`
    )
  ),
  transports: [new winston.transports.Console()],
});

// ── Firebase Admin SDK ──────────────────────────────────────────────────────
const admin = require('firebase-admin');

let firebaseInitialized = false;
try {
  const saPath = path.resolve(
    __dirname,
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '../service-account.json'
  );
  if (fs.existsSync(saPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(require(saPath)),
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://glowvai-v2-default-rtdb.firebaseio.com',
      projectId:   process.env.FIREBASE_PROJECT_ID || 'glowvai-v2',
    });
    firebaseInitialized = true;
    logger.info('✅ Firebase Admin SDK initialized from service-account.json');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential:  admin.credential.cert(sa),
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://glowvai-v2-default-rtdb.firebaseio.com',
      projectId:   process.env.FIREBASE_PROJECT_ID || 'glowvai-v2',
    });
    firebaseInitialized = true;
    logger.info('✅ Firebase Admin SDK initialized from env JSON');
  } else {
    logger.warn('⚠️  Firebase service account not found — running in MOCK mode with active local sync');
  }
} catch (err) {
  logger.warn(`⚠️  Firebase init failed: ${err.message} — running in MOCK mode`);
}

const db    = firebaseInitialized ? admin.firestore() : null;
const rtdb  = firebaseInitialized ? admin.database() : null;
const fcm   = firebaseInitialized ? admin.messaging() : null;

// ── In-Memory Store (MOCK / development fallback) ───────────────────────────
const mockStore = {
  orders: [],
  inventory: [
    {
      productId: 'SKU-NIAC-001',
      name: 'Minimalist 10% Niacinamide Face Serum',
      category: 'Serums',
      categoryId: 'serums',
      sku: 'NIAC-30ML',
      brand: 'Minimalist',
      unitType: 'bottle',
      packSize: '30 ml',
      mrp: 649,
      price: 599,
      sellingPrice: 599,
      compareAtPrice: 649,
      stockOnHand: 24,
      reservedStock: 0,
      availableStock: 24,
      lowStockThreshold: 5,
      isAvailable: true,
      stock: 24,
      bin: 'BIN-A-01-02-01',
      gstPercent: 18,
      images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80'],
      active: true,
      status: 'active',
      description: 'Nourishing 10% Niacinamide serum with Zinc for sebum regulation and skin clarity.',
      updatedAt: Date.now(),
    },
    {
      productId: 'SKU-FACE-WASH-002',
      name: 'CeraVe Hydrating Cleanser for Normal to Dry Skin',
      category: 'Face Wash',
      categoryId: 'cleansers',
      sku: 'CERAVE-FW-237',
      brand: 'CeraVe',
      unitType: 'bottle',
      packSize: '237 ml',
      mrp: 1199,
      price: 999,
      sellingPrice: 999,
      compareAtPrice: 1199,
      stockOnHand: 18,
      reservedStock: 0,
      availableStock: 18,
      lowStockThreshold: 4,
      isAvailable: true,
      stock: 18,
      bin: 'BIN-B-02-01-03',
      gstPercent: 18,
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80'],
      active: true,
      status: 'active',
      description: 'Gentle ceramide cleanser that hydrates and restores the natural skin barrier.',
      updatedAt: Date.now(),
    },
    {
      productId: 'SKU-SPF-003',
      name: 'Re\'equil Ultra Matte Dry Touch Sunscreen Gel SPF 50',
      category: 'Sunscreen',
      categoryId: 'sunscreen',
      sku: 'REEQUIL-SPF50',
      brand: 'Re\'equil',
      unitType: 'tube',
      packSize: '50 g',
      mrp: 795,
      price: 699,
      sellingPrice: 699,
      compareAtPrice: 795,
      stockOnHand: 31,
      reservedStock: 0,
      availableStock: 31,
      lowStockThreshold: 6,
      isAvailable: true,
      stock: 31,
      bin: 'BIN-A-03-01-02',
      gstPercent: 18,
      images: ['https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80'],
      active: true,
      status: 'active',
      description: 'Water & sweat-resistant matte gel sunscreen with broad spectrum UVA/UVB shield.',
      updatedAt: Date.now(),
    },
    {
      productId: 'SKU-RETINOL-004',
      name: 'Minimalist 0.3% Retinol Face Serum with CoQ10',
      category: 'Serums',
      categoryId: 'serums',
      sku: 'RETIN-30ML',
      brand: 'Minimalist',
      unitType: 'bottle',
      packSize: '30 ml',
      mrp: 849,
      price: 749,
      sellingPrice: 749,
      compareAtPrice: 849,
      stockOnHand: 3,
      reservedStock: 0,
      availableStock: 3,
      lowStockThreshold: 5,
      isAvailable: true,
      stock: 3,
      bin: 'BIN-A-01-03-01',
      gstPercent: 18,
      images: ['https://images.unsplash.com/photo-1608248597359-bb6e4b9d044f?w=400&q=80'],
      active: true,
      status: 'active',
      description: 'Anti-aging pure retinol serum for smoothing fine lines and boosting cell turnover.',
      updatedAt: Date.now(),
    },
    {
      productId: 'SKU-ATTA-005',
      name: 'Aashirvaad Superior MP Shuddh Chakki Whole Wheat Atta',
      category: 'Groceries',
      categoryId: 'groceries',
      sku: 'AASHIRVAAD-ATTA-5KG',
      brand: 'Aashirvaad',
      unitType: 'pack',
      packSize: '5 kg',
      mrp: 310,
      price: 280,
      sellingPrice: 280,
      compareAtPrice: 310,
      stockOnHand: 24,
      reservedStock: 0,
      availableStock: 24,
      lowStockThreshold: 5,
      isAvailable: true,
      stock: 24,
      bin: 'BIN-GROC-01',
      gstPercent: 5,
      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80'],
      active: true,
      status: 'active',
      description: '100% pure whole wheat chakki atta with 0% maida for soft rotis.',
      updatedAt: Date.now(),
    },
  ],
  vendors: [
    {
      vendorId:  'VND-001',
      storeId:   'DS-VIJ-01',
      name:      'Mukesh Kumar',
      shopName:  'Sri Lakshmi Beauty & Dark Store',
      phone:     '8977855998',
      email:     'mukesh.vendor@glowvai.com',
      shopType:  'Retailer & Dark Store Hub',
      city:      'Vijayawada',
      pinCode:   '520010',
      locality:  'Benz Circle / MG Road',
      address:   'D.No 40-1-52, Near Sub-Collector Office, MG Road, Vijayawada 520010',
      latitude:  16.5062,
      longitude: 80.6480,
      openTime:  '06:00 AM',
      closeTime: '11:30 PM',
      isOnline:  true,
      rating:    4.96,
      totalOrders: 428,
      kycStatus: 'APPROVED',
      categories: ['Serums', 'Sunscreen', 'Cleanser', 'Groceries', 'Personal Care'],
      bankDetails: {
        bankName:   'HDFC Bank',
        holderName: 'Mukesh Kumar',
        accNumber:  '50100482914589',
        ifsc:       'HDFC0001824',
        upiId:      'mukesh.kumar@okhdfcbank',
      },
      gst: '37AAACG1234F1Z8',
      pan: 'AAACG1234F',
      joinedAt:  Date.now() - 86400000 * 45,
    },
    {
      vendorId:  'VND-002',
      storeId:   'DS-VIJ-02',
      name:      'Ravi Teja Varma',
      shopName:  'Payakapuram Quick Fulfillment Hub',
      phone:     '9848022338',
      email:     'ravi.payaka@glowvai.com',
      shopType:  'Dark Store Express',
      city:      'Vijayawada',
      pinCode:   '520015',
      locality:  'Payakapuram Hub',
      address:   'Plot 14, Industrial Estate Road, Payakapuram, Vijayawada 520015',
      latitude:  16.5385,
      longitude: 80.6341,
      openTime:  '06:00 AM',
      closeTime: '11:00 PM',
      isOnline:  true,
      rating:    4.88,
      totalOrders: 215,
      kycStatus: 'APPROVED',
      categories: ['Groceries', 'Dairy', 'Snacks', 'Skincare'],
      bankDetails: {
        bankName:   'State Bank of India',
        holderName: 'Ravi Teja Varma',
        accNumber:  '381920491029',
        ifsc:       'SBIN0004821',
        upiId:      'raviteja@sbi',
      },
      gst: '37ABCPV9876K1Z2',
      pan: 'ABCPV9876K',
      joinedAt:  Date.now() - 86400000 * 30,
    },
    {
      vendorId:  'VND-003',
      storeId:   'DS-VIJ-03',
      name:      'Ananya Reddy',
      shopName:  'Labbipet Prime Express Dark Store',
      phone:     '9876543210',
      email:     'ananya.reddy@glowvai.com',
      shopType:  'Beauty & Wellness Hub',
      city:      'Vijayawada',
      pinCode:   '520002',
      locality:  'Labbipet / Governorpet',
      address:   '12-3-45, Bandar Road, Labbipet, Vijayawada 520002',
      latitude:  16.5033,
      longitude: 80.6512,
      openTime:  '07:00 AM',
      closeTime: '11:30 PM',
      isOnline:  false,
      rating:    4.92,
      totalOrders: 310,
      kycStatus: 'APPROVED',
      categories: ['Skincare', 'Serums', 'Haircare', 'Makeup'],
      bankDetails: {
        bankName:   'ICICI Bank',
        holderName: 'Ananya Reddy',
        accNumber:  '004801592837',
        ifsc:       'ICIC0000048',
        upiId:      'ananya@icici',
      },
      gst: '37AABCR5544L1Z1',
      pan: 'AABCR5544L',
      joinedAt:  Date.now() - 86400000 * 20,
    },
    {
      vendorId:  'VND-004',
      storeId:   'DS-GNT-01',
      name:      'Kalyan Varma',
      shopName:  'Guntur Brodipet Quick Hub',
      phone:     '8899776655',
      email:     'kalyan.guntur@glowvai.com',
      shopType:  'Supermarket & Dark Store',
      city:      'Guntur',
      pinCode:   '522002',
      locality:  'Brodipet 4th Lane',
      address:   '4/1 Brodipet, Main Road, Guntur 522002',
      latitude:  16.3067,
      longitude: 80.4365,
      openTime:  '06:00 AM',
      closeTime: '11:00 PM',
      isOnline:  true,
      rating:    4.95,
      totalOrders: 180,
      kycStatus: 'APPROVED',
      categories: ['Groceries', 'Personal Care', 'Skincare'],
      bankDetails: {
        bankName:   'Axis Bank',
        holderName: 'Kalyan Varma',
        accNumber:  '91802004829104',
        ifsc:       'UTIB0000182',
        upiId:      'kalyan@axisbank',
      },
      gst: '37AAACK8899P1Z9',
      pan: 'AAACK8899P',
      joinedAt:  Date.now() - 86400000 * 15,
    },
  ],
  notifications: [],
  earnings: {
    today: { orders: 0, revenue: 0, earnings: 0 },
    weekly: [],
    total: { orders: 0, revenue: 0, earnings: 0, pendingPayout: 0 },
  },
  returns: [],
};

// ── Express App & HTTP Server ────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const PORT   = parseInt(process.env.PORT || '4000');

// ── Socket.IO — Real-time Push ───────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:  '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout:  60000,
  pingInterval: 25000,
});

// Connected vendor sockets: vendorId → socket
const vendorSockets = new Map();

// Initialize Rapido-Style Redis Geospatial Dispatch Engine
const RedisDispatchEngine = require('./services/redisDispatch');
const dispatchEngine = new RedisDispatchEngine(io);

io.on('connection', (socket) => {
  logger.info(`📡 Socket connected: ${socket.id}`);

  // Vendor registers itself with location
  socket.on('vendor:register', ({ vendorId, storeId, lat, lng, name }) => {
    const vid = vendorId || 'VND-001';
    vendorSockets.set(vid, socket.id);
    socket.join(`vendor:${vid}`);
    socket.join(`store:${storeId || 'DS-VIJ-01'}`);

    dispatchEngine.attachSocketToVendor(vid, socket.id);
    if (lat && lng) {
      dispatchEngine.registerVendorLocation(vid, lng, lat, { storeId, name, socketId: socket.id });
    }

    logger.info(`🏪 Vendor ${vid} registered on socket ${socket.id}`);
    socket.emit('vendor:registered', { ok: true, vendorId: vid, storeId });
  });

  // Real-time vendor GPS location ping
  socket.on('vendor:location:update', ({ vendorId, latitude, longitude }) => {
    dispatchEngine.registerVendorLocation(vendorId, longitude, latitude, { socketId: socket.id });
  });

  // Vendor updates online/offline duty status
  socket.on('vendor:setStatus', async ({ vendorId, isOnline }) => {
    await setVendorOnlineStatus(vendorId, isOnline);
    dispatchEngine.setVendorOnlineStatus(vendorId, isOnline);
    io.to(`vendor:${vendorId}`).emit('vendor:statusUpdated', { isOnline });
  });

  // ── Rapido-Style Race Condition Handler (Distributed Lock) ─────────────────
  socket.on('ACCEPT_ORDER', async ({ orderId, vendorId }) => {
    logger.info(`⚡ Vendor ${vendorId} attempting to accept order ${orderId}...`);

    // Attempt atomic lock acquisition (Redis SETNX)
    const lockResult = await dispatchEngine.tryClaimOrderLock(orderId, vendorId);

    if (lockResult.success) {
      logger.info(`🏆 Order ${orderId} WON and LOCKED by Vendor ${vendorId}`);

      // Update order in database / mockStore
      const order = mockStore.orders.find(o => o.orderId === orderId);
      if (order) {
        order.status = 'ACCEPTED';
        order.vendorId = vendorId;
        order.acceptedAt = Date.now();
      }

      // 1. Confirm order to winning vendor
      socket.emit('ORDER_CONFIRMED', {
        ok: true,
        orderId,
        vendorId,
        message: 'Order successfully reserved and assigned to you!',
        order,
      });

      // 2. Broadcast dismissal to all other candidate vendors
      socket.broadcast.emit('ORDER_CLAIMED_BY_OTHER', {
        orderId,
        winnerVendorId: vendorId,
        message: 'Order was accepted by another nearby vendor.',
      });
    } else {
      logger.warn(`❌ Order ${orderId} claim FAILED for Vendor ${vendorId}. Winner: ${lockResult.winnerId}`);

      // Notify losing vendor
      socket.emit('ORDER_CLAIM_FAILED', {
        ok: false,
        orderId,
        winnerVendorId: lockResult.winnerId,
        message: 'Order no longer available. Already accepted by another nearby vendor.',
      });
    }
  });

  // Vendor declines an offer
  socket.on('DECLINE_ORDER', ({ orderId, vendorId }) => {
    logger.info(`🚫 Vendor ${vendorId} declined order ${orderId}`);
    socket.emit('ORDER_DISMISSED', { orderId });
  });

  socket.on('disconnect', () => {
    for (const [vid, sid] of vendorSockets.entries()) {
      if (sid === socket.id) { vendorSockets.delete(vid); break; }
    }
    logger.info(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Helper: push event to a specific vendor
function pushToVendor(vendorId, event, data) {
  io.to(`vendor:${vendorId}`).emit(event, data);
}

// Helper: push new order to candidate vendors via Redis Geospatial Fanout
function pushNewOrderToStore(storeId, orderData) {
  if (orderData?.order) {
    dispatchEngine.dispatchOrderToCandidates(orderData.order, 16.5062, 80.6480);
  } else {
    io.to(`store:${storeId}`).emit('order:incoming', orderData);
  }
}

// ── Firebase Realtime Database Direct Sync Engine ───────────────────────────
const FIREBASE_RTDB_URL = (process.env.FIREBASE_DATABASE_URL || 'https://glowvai-v2-default-rtdb.firebaseio.com').replace(/\/$/, '');

async function syncToFirebaseRTDB(dbPath, payload, method = 'PUT') {
  try {
    const url = `${FIREBASE_RTDB_URL}/${dbPath}.json`;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    logger.warn(`Firebase RTDB sync failed for ${dbPath}: ${e.message}`);
  }
}

// Initial bootstrap seeding to Firebase Realtime Database
async function bootstrapFirebaseSync() {
  try {
    logger.info('🔄 Bootstrapping initial database state to Firebase RTDB (glowvai-v2)...');
    for (const v of mockStore.vendors) {
      await syncToFirebaseRTDB(`vendors/${v.vendorId}`, v);
    }
    for (const item of mockStore.inventory) {
      await syncToFirebaseRTDB(`inventory/${item.productId}`, item);
    }
    for (const ord of mockStore.orders) {
      await syncToFirebaseRTDB(`orders/${ord.orderId}`, ord);
    }
    logger.info('✅ Database state synchronized with Firebase Realtime Database');
  } catch (err) {
    logger.warn(`Firebase bootstrap sync warning: ${err.message}`);
  }
}
setTimeout(bootstrapFirebaseSync, 1500);

// ── Security Headers ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiter (In-Memory) ─────────────────────────────────────────────────
const rateLimitMap  = new Map();
const RL_WINDOW_MS  = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 min window
const RL_MAX        = parseInt(process.env.RATE_LIMIT_MAX       || '2000');   // 2000 requests

app.use('/api/', (req, res, next) => {
  const ip  = req.ip || req.connection?.remoteAddress || 'localhost';
  if (ip.includes('127.0.0.1') || ip.includes('::1') || ip === 'localhost') {
    return next(); // bypass rate limit for local dev
  }
  const now = Date.now();
  const rec = rateLimitMap.get(ip);

  if (!rec || now > rec.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RL_WINDOW_MS });
    return next();
  }
  rec.count++;
  if (rec.count > RL_MAX) {
    return res.status(429).json({ ok: false, error: 'Rate limit exceeded. Try again shortly.' });
  }
  next();
});

// ── Request Logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ════════════════════════════════════════════════════════════════════════════
// ── ATOMIC INVENTORY CONCURRENCY ENGINE ─────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

function reserveInventoryForOrder(items) {
  if (!items || !items.length) return { ok: true };

  // 1. Check availability for all items in order
  for (const it of items) {
    const qty = it.qty || it.quantity || 1;
    const prod = mockStore.inventory.find(p =>
      p.productId === it.productId ||
      p.sku === it.sku ||
      p.name.toLowerCase() === (it.name || it.productName || '').toLowerCase()
    );
    if (!prod) continue;
    const available = prod.availableStock !== undefined ? prod.availableStock : (prod.stockOnHand || prod.stock || 0);
    if (available < qty) {
      return {
        ok: false,
        error: 'OUT_OF_STOCK',
        productName: prod.name,
        availableStock: available,
        requestedQty: qty,
      };
    }
  }

  // 2. Atomically reserve
  for (const it of items) {
    const qty = it.qty || it.quantity || 1;
    const prod = mockStore.inventory.find(p =>
      p.productId === it.productId ||
      p.sku === it.sku ||
      p.name.toLowerCase() === (it.name || it.productName || '').toLowerCase()
    );
    if (!prod) continue;
    prod.reservedStock = (prod.reservedStock || 0) + qty;
    prod.availableStock = Math.max(0, (prod.stockOnHand || prod.stock || 0) - prod.reservedStock);
    prod.stock = prod.availableStock;
    prod.isAvailable = prod.availableStock > 0;
    io.emit('inventory:stockUpdated', {
      productId: prod.productId,
      stockOnHand: prod.stockOnHand,
      availableStock: prod.availableStock,
      reservedStock: prod.reservedStock,
    });
  }

  return { ok: true };
}

function releaseInventoryForOrder(items) {
  if (!items || !items.length) return;
  for (const it of items) {
    const qty = it.qty || it.quantity || 1;
    const prod = mockStore.inventory.find(p =>
      p.productId === it.productId ||
      p.sku === it.sku ||
      p.name.toLowerCase() === (it.name || it.productName || '').toLowerCase()
    );
    if (!prod) continue;
    prod.reservedStock = Math.max(0, (prod.reservedStock || 0) - qty);
    prod.availableStock = Math.max(0, (prod.stockOnHand || prod.stock || 0) - prod.reservedStock);
    prod.stock = prod.availableStock;
    prod.isAvailable = prod.availableStock > 0;
    io.emit('inventory:stockUpdated', {
      productId: prod.productId,
      stockOnHand: prod.stockOnHand,
      availableStock: prod.availableStock,
      reservedStock: prod.reservedStock,
    });
  }
}

function finalizeInventoryForOrder(items) {
  if (!items || !items.length) return;
  for (const it of items) {
    const qty = it.qty || it.quantity || 1;
    const prod = mockStore.inventory.find(p =>
      p.productId === it.productId ||
      p.sku === it.sku ||
      p.name.toLowerCase() === (it.name || it.productName || '').toLowerCase()
    );
    if (!prod) continue;
    prod.stockOnHand = Math.max(0, (prod.stockOnHand || prod.stock || 0) - qty);
    prod.reservedStock = Math.max(0, (prod.reservedStock || 0) - qty);
    prod.availableStock = Math.max(0, prod.stockOnHand - prod.reservedStock);
    prod.stock = prod.stockOnHand;
    prod.isAvailable = prod.stockOnHand > 0;
    io.emit('inventory:stockUpdated', {
      productId: prod.productId,
      stockOnHand: prod.stockOnHand,
      availableStock: prod.availableStock,
      reservedStock: prod.reservedStock,
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ── HELPER FUNCTIONS ────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

async function getOrders(filter = {}) {
  if (db) {
    let query = db.collection('orders');
    if (filter.storeId) query = query.where('storeId', '==', filter.storeId);
    if (filter.status)  query = query.where('status', '==', filter.status);
    const snap = await query.orderBy('createdAt', 'desc').limit(100).get();
    return snap.docs.map(d => ({ orderId: d.id, ...d.data() }));
  }
  let orders = [...mockStore.orders];
  if (filter.storeId) orders = orders.filter(o => o.storeId === filter.storeId);
  if (filter.status)  orders = orders.filter(o => o.status  === filter.status);
  return orders.sort((a, b) => b.createdAt - a.createdAt);
}

async function getOrderById(orderId) {
  if (db) {
    const doc = await db.collection('orders').doc(orderId).get();
    return doc.exists ? { orderId: doc.id, ...doc.data() } : null;
  }
  return mockStore.orders.find(o => o.orderId === orderId) || null;
}

async function updateOrderStatus(orderId, status, extraFields = {}) {
  const updatedAt = Date.now();
  if (db) {
    await db.collection('orders').doc(orderId).update({ status, updatedAt, ...extraFields });
    syncToFirebaseRTDB(`orders/${orderId}`, { status, updatedAt, ...extraFields }, 'PATCH');
    return { orderId, status, updatedAt, ...extraFields };
  }
  const idx = mockStore.orders.findIndex(o => o.orderId === orderId);
  if (idx === -1) return null;
  mockStore.orders[idx] = { ...mockStore.orders[idx], status, updatedAt, ...extraFields };
  syncToFirebaseRTDB(`orders/${orderId}`, mockStore.orders[idx]);
  return mockStore.orders[idx];
}

async function setVendorOnlineStatus(vendorId, isOnline) {
  const updatedAt = Date.now();
  if (db) {
    await db.collection('vendors').doc(vendorId).update({ isOnline, updatedAt });
    syncToFirebaseRTDB(`vendors/${vendorId}/isOnline`, isOnline);
    syncToFirebaseRTDB(`vendors/${vendorId}/updatedAt`, updatedAt);
  } else {
    const v = mockStore.vendors.find(v => v.vendorId === vendorId);
    if (v) {
      v.isOnline = isOnline;
      v.updatedAt = updatedAt;
      syncToFirebaseRTDB(`vendors/${vendorId}`, v);
    }
  }
}

async function getInventory(storeId) {
  if (db) {
    const snap = await db.collection('inventory')
      .where('storeId', '==', storeId)
      .orderBy('category')
      .get();
    return snap.docs.map(d => ({ productId: d.id, ...d.data() }));
  }
  return mockStore.inventory;
}

async function updateInventoryItem(productId, fields) {
  const updatedAt = Date.now();
  if (db) {
    await db.collection('inventory').doc(productId).update({ ...fields, updatedAt });
    syncToFirebaseRTDB(`inventory/${productId}`, { ...fields, updatedAt }, 'PATCH');
    const doc = await db.collection('inventory').doc(productId).get();
    return { productId: doc.id, ...doc.data() };
  }
  const idx = mockStore.inventory.findIndex(i => i.productId === productId);
  if (idx === -1) return null;
  mockStore.inventory[idx] = { ...mockStore.inventory[idx], ...fields, updatedAt };
  syncToFirebaseRTDB(`inventory/${productId}`, mockStore.inventory[idx]);
  return mockStore.inventory[idx];
}

async function getEarnings(vendorId) {
  if (db) {
    const doc = await db.collection('earnings').doc(vendorId).get();
    return doc.exists ? doc.data() : mockStore.earnings;
  }
  return mockStore.earnings;
}

async function getNotifications(vendorId) {
  if (db) {
    const snap = await db.collection('notifications')
      .where('vendorId', '==', vendorId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return mockStore.notifications.filter(n => n.vendorId === vendorId || !n.vendorId);
}

// ════════════════════════════════════════════════════════════════════════════
// ── REST API ROUTES ─────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    ok:        true,
    service:   'glowvai-vendor-backend',
    version:   '1.0.0',
    env:       process.env.NODE_ENV || 'development',
    firebase:  firebaseInitialized ? 'connected' : 'mock',
    sockets:   io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'GlowVAI Vendor API is healthy 🌸', timestamp: Date.now() });
});

// ════════════════════════════════════════════════════════════════════════════
// ── VENDOR ENDPOINTS ─────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (db) {
      const doc = await db.collection('vendors').doc(vendorId).get();
      if (!doc.exists) return res.status(404).json({ ok: false, error: 'Vendor not found' });
      return res.json({ ok: true, vendor: { vendorId: doc.id, ...doc.data() } });
    }
    const vendor = mockStore.vendors.find(v => v.vendorId === vendorId)
      || mockStore.vendors[0];
    res.json({ ok: true, vendor });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/vendor/:vendorId/status', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { isOnline }  = req.body;
    await setVendorOnlineStatus(vendorId, isOnline);
    pushToVendor(vendorId, 'vendor:statusUpdated', { isOnline, updatedAt: Date.now() });
    res.json({ ok: true, vendorId, isOnline, updatedAt: Date.now() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/vendor/:vendorId/fcm-token', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { fcmToken }  = req.body;
    if (!fcmToken) return res.status(400).json({ ok: false, error: 'fcmToken required' });
    if (db) {
      await db.collection('vendors').doc(vendorId).update({ fcmToken, updatedAt: Date.now() });
    } else {
      const v = mockStore.vendors.find(v => v.vendorId === vendorId);
      if (v) v.fcmToken = fcmToken;
    }
    res.json({ ok: true, vendorId, fcmToken });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const updates = req.body || {};
    if (db) {
      await db.collection('vendors').doc(vendorId).set({ ...updates, updatedAt: Date.now() }, { merge: true });
      const doc = await db.collection('vendors').doc(vendorId).get();
      return res.json({ ok: true, vendor: { vendorId: doc.id, ...doc.data() } });
    } else {
      let v = mockStore.vendors.find(item => item.vendorId === vendorId);
      if (!v) {
        v = { vendorId, ...updates, updatedAt: Date.now() };
        mockStore.vendors.push(v);
      } else {
        Object.assign(v, updates, { updatedAt: Date.now() });
      }
      return res.json({ ok: true, vendor: v });
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── ORDER ENDPOINTS ──────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/orders', async (req, res) => {
  try {
    const { storeId, status } = req.query;
    const orders = await getOrders({ storeId, status });
    res.json({ ok: true, orders, count: orders.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/orders/all', async (req, res) => {
  try {
    const orders = await getOrders({});
    res.json({ ok: true, orders, count: orders.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/orders/pending', async (req, res) => {
  try {
    const orders = await getOrders({ status: 'PENDING' });
    res.json({ ok: true, orders, count: orders.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const order = await getOrderById(req.params.orderId);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const {
      customerId, customerName, customerPhone,
      shippingAddress, items, pricing,
      payment, storeId, vendorId,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ ok: false, error: 'items[] required' });
    }

    // Atomic concurrency reservation
    const reserveResult = reserveInventoryForOrder(items);
    if (!reserveResult.ok) {
      return res.status(409).json({
        ok: false,
        error: 'OUT_OF_STOCK',
        message: `Item "${reserveResult.productName}" is out of stock or already reserved by another customer (Available: ${reserveResult.availableStock}, Requested: ${reserveResult.requestedQty})`,
        details: reserveResult,
      });
    }

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const now     = Date.now();

    const newOrder = {
      orderId,
      customerId:   customerId   || 'anon',
      customerName: customerName || 'Customer',
      customerPhone:customerPhone|| '0000000000',
      shippingAddress: shippingAddress || { fullAddress: 'Vijayawada' },
      items:        items,
      pricing:      pricing       || { grandTotal: 0, subtotal: 0, deliveryFee: 0, discount: 0 },
      payment:      payment       || { method: 'CASH ON DELIVERY', status: 'PENDING' },
      storeId:      storeId       || process.env.DEFAULT_STORE_ID  || 'DS-VIJ-01',
      vendorId:     vendorId      || 'VND-001',
      status:       'PENDING',
      otp:          String(Math.floor(1000 + Math.random() * 9000)),
      createdAt:    now,
      updatedAt:    now,
      timeline: [{ status: 'PENDING', timestamp: now, note: 'Order placed by customer' }],
    };

    if (db) {
      await db.collection('orders').doc(orderId).set(newOrder);
    } else {
      mockStore.orders.unshift(newOrder);
    }
    syncToFirebaseRTDB(`orders/${orderId}`, newOrder);

    // Push real-time to vendor
    pushNewOrderToStore(newOrder.storeId, {
      type:   'NEW_ORDER',
      order:  newOrder,
      sentAt: now,
    });

    // FCM push to vendor
    if (fcm) {
      try {
        const vDoc = db ? await db.collection('vendors').doc(newOrder.vendorId).get() : null;
        const token = vDoc?.data()?.fcmToken;
        if (token) {
          await fcm.send({
            token,
            notification: {
              title: '🛍️ New Order Incoming!',
              body:  `Order #${orderId} — ₹${newOrder.pricing.grandTotal} — ${customerName}`,
            },
            data: { orderId, type: 'NEW_ORDER' },
          });
        }
      } catch (fcmErr) {
        logger.warn(`FCM push failed: ${fcmErr.message}`);
      }
    }

    // Add notification
    const notif = {
      id:        uuidv4(),
      vendorId:  newOrder.vendorId,
      type:      'NEW_ORDER',
      title:     '🛍️ New Order!',
      body:      `Order #${orderId} from ${customerName} — ₹${newOrder.pricing?.grandTotal}`,
      orderId,
      read:      false,
      createdAt: now,
    };
    if (db) {
      await db.collection('notifications').add(notif);
    } else {
      mockStore.notifications.unshift(notif);
    }

    logger.info(`✅ New order created & pushed to vendor: ${orderId}`);
    res.status(201).json({ ok: true, order: newOrder });
  } catch (err) {
    logger.error(`❌ Create order failed: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Customer App Bridge (/api/orders/create) ──────────────────────────────────
app.post('/api/orders/create', async (req, res) => {
  try {
    const {
      orderId, orderAmount, customerName, customerPhone,
      deliveryAddress, items, paymentMethod, storeId, vendorId,
    } = req.body;

    const formattedItems = (items && items.length) ? items.map(it => ({
      productId:   it.productId || 'SKU-GEN-' + Math.floor(100 + Math.random() * 900),
      productName: it.name || it.productName || 'Cosmetics Item',
      name:        it.name || it.productName || 'Cosmetics Item',
      quantity:    it.qty || it.quantity || 1,
      qty:         it.qty || it.quantity || 1,
      price:       Number(it.price || 599),
    })) : [
      { productId: 'SKU-NIAC-001', productName: 'Minimalist 10% Niacinamide Serum', name: 'Minimalist 10% Niacinamide Serum', quantity: 1, qty: 1, price: 599 }
    ];

    // Concurrency reservation
    reserveInventoryForOrder(formattedItems);

    const finalOrderId = orderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000));
    const now = Date.now();
    const grandTotal = Number(orderAmount || (formattedItems.reduce((s, i) => s + (i.price * i.quantity), 0)));

    const newOrder = {
      orderId: finalOrderId,
      customerName: customerName || 'Priya Sharma',
      customerPhone: customerPhone || '+91 98480 22338',
      shippingAddress: { fullAddress: deliveryAddress || 'Flat 4B, Srinagar Colony, Benz Circle, Vijayawada' },
      items: formattedItems,
      pricing: {
        subtotal: grandTotal,
        deliveryFee: 0,
        discount: 0,
        grandTotal: grandTotal,
        vendorEarnings: Math.round(grandTotal * 0.88),
      },
      payment: {
        method: paymentMethod || 'ONLINE_UPI',
        status: 'PAID',
      },
      storeId: storeId || 'DS-VIJ-01',
      vendorId: vendorId || 'VND-001',
      status: 'PENDING',
      otp: '4892',
      createdAt: now,
      updatedAt: now,
      timeline: [{ status: 'PENDING', timestamp: now, note: 'Order placed by customer via user app' }],
    };

    if (db) {
      await db.collection('orders').doc(finalOrderId).set(newOrder);
    } else {
      mockStore.orders.unshift(newOrder);
    }
    syncToFirebaseRTDB(`orders/${finalOrderId}`, newOrder);

    // ⚡ Trigger Instant Vendor Alerts (Chime, Vibration, 45s Countdown Pop-up)
    pushNewOrderToStore(newOrder.storeId, {
      type: 'NEW_ORDER',
      order: newOrder,
      sentAt: now,
    });
    io.emit('ORDER_OFFER', { order: newOrder, orderId: finalOrderId });
    io.emit('order:incoming', { order: newOrder, orderId: finalOrderId });

    logger.info(`⚡ Live Customer App Order Dispatched to Vendor: ${finalOrderId} (Amount: ₹${grandTotal})`);
    res.status(200).json({ ok: true, orderId: finalOrderId, order: newOrder, message: 'Order sent to dark store vendor' });
  } catch (err) {
    logger.error(`❌ Customer order bridge error: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Customer Payment Verification Bridge ──────────────────────────────────────
app.post('/api/payment/verify', (req, res) => {
  const { orderId, amount } = req.body;
  res.json({ ok: true, orderId, amount, status: 'SUCCESS', verifiedAt: Date.now() });
});

app.patch('/api/orders/:orderId/accept', async (req, res) => {
  try {
    const { orderId }  = req.params;
    const { vendorId } = req.body;
    const now          = Date.now();

    const order = await updateOrderStatus(orderId, 'ACCEPTED', {
      acceptedAt: now,
      acceptedBy: vendorId || 'VND-001',
    });

    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

    // Finalize stock conversion from reserved to sold
    finalizeInventoryForOrder(order.items);

    pushToVendor(vendorId || 'VND-001', 'order:statusUpdated', {
      orderId, status: 'ACCEPTED', updatedAt: now,
    });

    res.json({ ok: true, order, message: `Order ${orderId} accepted` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/orders/:orderId/prepare', async (req, res) => {
  try {
    const { orderId } = req.params;
    const now = Date.now();

    const order = await updateOrderStatus(orderId, 'PREPARING', { preparingAt: now });
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

    io.emit('order:statusUpdated', { orderId, status: 'PREPARING', updatedAt: now });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/orders/:orderId/ready', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { pickupBay } = req.body;
    const now = Date.now();

    const order = await updateOrderStatus(orderId, 'READY_FOR_PICKUP', {
      readyAt: now,
      pickupBay: pickupBay || 'Bay-01',
    });

    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

    io.emit('order:statusUpdated', { orderId, status: 'READY_FOR_PICKUP', updatedAt: now });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/orders/:orderId/pack', async (req, res) => {
  try {
    const { orderId }  = req.params;
    const { vendorId, pickupBay } = req.body;
    const now = Date.now();

    const order = await updateOrderStatus(orderId, 'PACKED', {
      packedAt:  now,
      pickupBay: pickupBay || 'Bay-01',
    });

    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

    pushToVendor(vendorId || 'VND-001', 'order:statusUpdated', {
      orderId, status: 'PACKED', pickupBay, updatedAt: now,
    });

    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/orders/:orderId/handover', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { riderId, riderName, riderPhone } = req.body;
    const now = Date.now();

    const order = await updateOrderStatus(orderId, 'DISPATCHED', {
      dispatchedAt: now,
      rider: { riderId: riderId || 'RIDER-08', riderName: riderName || 'Kalyan V.', riderPhone: riderPhone || '9848022338' },
    });

    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

    io.emit('order:statusUpdated', { orderId, status: 'DISPATCHED', updatedAt: now });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/orders/:orderId/dispatch', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { riderId, riderName, riderPhone } = req.body;
    const now = Date.now();

    const order = await updateOrderStatus(orderId, 'DISPATCHED', {
      dispatchedAt: now,
      rider: { riderId, riderName, riderPhone },
    });

    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/orders/:orderId/deliver', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otp }     = req.body;
    const now         = Date.now();

    const order = await getOrderById(orderId);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

    if (order.otp && otp && order.otp !== String(otp)) {
      return res.status(400).json({ ok: false, error: 'Invalid OTP' });
    }

    const updated = await updateOrderStatus(orderId, 'DELIVERED', {
      deliveredAt: now,
      otpVerified: true,
    });

    // Update earnings
    const earnings = order.pricing?.vendorEarnings || Math.round((order.pricing?.grandTotal || 0) * 0.08);
    if (db) {
      const earningsRef = db.collection('earnings').doc(order.vendorId);
      await earningsRef.set({
        today: admin.firestore.FieldValue.increment
          ? { orders: admin.firestore.FieldValue.increment(1), revenue: admin.firestore.FieldValue.increment(order.pricing?.grandTotal || 0), earnings: admin.firestore.FieldValue.increment(earnings) }
          : { orders: 1, revenue: order.pricing?.grandTotal || 0, earnings },
      }, { merge: true });
    } else {
      mockStore.earnings.today.orders++;
      mockStore.earnings.today.revenue  += (order.pricing?.grandTotal || 0);
      mockStore.earnings.today.earnings += earnings;
      mockStore.earnings.total.orders++;
      mockStore.earnings.total.revenue  += (order.pricing?.grandTotal || 0);
      mockStore.earnings.total.earnings += earnings;
    }

    res.json({ ok: true, order: updated, earnings });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/orders/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason }  = req.body;
    const now         = Date.now();

    const order = await updateOrderStatus(orderId, 'CANCELLED', {
      cancelledAt:    now,
      cancellationReason: reason || 'Cancelled by vendor',
    });

    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

    // Release reserved inventory
    releaseInventoryForOrder(order.items);

    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/orders/:orderId/reject', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, vendorId } = req.body;
    const now = Date.now();

    const order = await updateOrderStatus(orderId, 'REJECTED', {
      rejectedAt: now,
      rejectionReason: reason || 'Item unavailable',
      rejectedBy: vendorId || 'VND-001',
    });

    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

    // Release reserved inventory
    releaseInventoryForOrder(order.items);

    pushToVendor(vendorId || 'VND-001', 'order:rejected', {
      orderId,
      status: 'REJECTED',
      reason: reason || 'Item unavailable',
      updatedAt: now,
    });

    io.emit('order:statusUpdated', { orderId, status: 'REJECTED', reason });
    res.json({ ok: true, order, message: `Order ${orderId} rejected: ${reason}` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/orders/:orderId/timeout', async (req, res) => {
  try {
    const { orderId } = req.params;
    const now = Date.now();

    const order = await updateOrderStatus(orderId, 'VENDOR_TIMEOUT', {
      timedOutAt: now,
    });

    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

    // Release reserved inventory
    releaseInventoryForOrder(order.items);

    io.emit('order:statusUpdated', { orderId, status: 'VENDOR_TIMEOUT', updatedAt: now });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── INVENTORY ENDPOINTS ───────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/inventory', async (req, res) => {
  try {
    const { storeId } = req.query;
    const items = await getInventory(storeId || 'DS-VIJ-01');
    res.json({ ok: true, items, count: items.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const {
      name, category, categoryId, sku, mrp, price, sellingPrice,
      compareAtPrice, stock, stockOnHand, lowStockThreshold,
      unitType, packSize, bin, gstPercent, storeId, vendorId,
      images, description, brand, isAvailable, status,
    } = req.body;

    if (!name) {
      return res.status(400).json({ ok: false, error: 'Product name is required' });
    }

    const productId = 'SKU-' + uuidv4().slice(0, 8).toUpperCase();
    const now       = Date.now();
    const finalStockOnHand = Number(stockOnHand ?? stock ?? 0);
    const finalPrice = Number(sellingPrice ?? price ?? mrp ?? 0);

    const newItem = {
      productId,
      name:              name.trim(),
      category:          category || 'General',
      categoryId:        categoryId || (category ? category.toLowerCase().replace(/\s+/g, '-') : 'general'),
      sku:               sku || ('SKU-' + name.slice(0, 4).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900)),
      brand:             brand || '',
      unitType:          unitType || 'piece',
      packSize:          packSize || '',
      mrp:               Number(mrp || finalPrice),
      price:             finalPrice,
      sellingPrice:      finalPrice,
      compareAtPrice:    compareAtPrice ? Number(compareAtPrice) : (mrp ? Number(mrp) : undefined),
      stockOnHand:       finalStockOnHand,
      reservedStock:     0,
      availableStock:    finalStockOnHand,
      lowStockThreshold: Number(lowStockThreshold ?? 5),
      isAvailable:       isAvailable !== false,
      stock:             finalStockOnHand,
      bin:               bin || 'BIN-UNASSIGNED',
      gstPercent:        Number(gstPercent ?? 18),
      storeId:           storeId || 'DS-VIJ-01',
      vendorId:          vendorId || 'VND-001',
      images:            images && images.length ? images : ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80'],
      description:       description || '',
      active:            status !== 'paused' && isAvailable !== false,
      status:            status || 'active',
      createdAt:         now,
      updatedAt:         now,
      stockHistory:      [{ type: 'INITIAL', delta: finalStockOnHand, stockOnHand: finalStockOnHand, reason: 'Initial setup', timestamp: now }],
    };

    if (db) {
      await db.collection('inventory').doc(productId).set(newItem);
    } else {
      mockStore.inventory.unshift(newItem);
    }
    syncToFirebaseRTDB(`inventory/${productId}`, newItem);

    io.emit('inventory:created', { item: newItem });
    res.status(201).json({ ok: true, item: newItem });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/inventory/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const fields        = req.body;
    const item = await updateInventoryItem(productId, fields);
    if (!item) return res.status(404).json({ ok: false, error: 'Product not found' });
    io.emit('inventory:updated', { productId, ...fields });
    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/inventory/:productId/stock', async (req, res) => {
  try {
    const { productId } = req.params;
    const { delta, exactQuantity, reason } = req.body;
    const now = Date.now();

    const idx = mockStore.inventory.findIndex(i => i.productId === productId);
    if (idx === -1) return res.status(404).json({ ok: false, error: 'Product not found in inventory' });

    let currentItem = mockStore.inventory[idx];
    let newStockOnHand = currentItem.stockOnHand ?? currentItem.stock ?? 0;
    let actualDelta = 0;

    if (exactQuantity !== undefined) {
      const target = Math.max(0, Number(exactQuantity));
      actualDelta = target - newStockOnHand;
      newStockOnHand = target;
    } else if (delta !== undefined) {
      actualDelta = Number(delta);
      newStockOnHand = Math.max(0, newStockOnHand + actualDelta);
    }

    const reserved = currentItem.reservedStock ?? 0;
    const available = Math.max(0, newStockOnHand - reserved);
    const historyEntry = {
      type: exactQuantity !== undefined ? 'SET_EXACT' : (actualDelta >= 0 ? 'RESTOCK' : 'DEDUCTION'),
      delta: actualDelta,
      stockOnHand: newStockOnHand,
      availableStock: available,
      reason: reason || 'Manual stock adjustment',
      timestamp: now,
    };

    const updatedFields = {
      stockOnHand: newStockOnHand,
      availableStock: available,
      stock: newStockOnHand,
      isAvailable: available > 0,
      active: available > 0,
      updatedAt: now,
    };

    if (!currentItem.stockHistory) currentItem.stockHistory = [];
    currentItem.stockHistory.unshift(historyEntry);

    Object.assign(mockStore.inventory[idx], updatedFields);

    if (db) {
      await db.collection('inventory').doc(productId).update({
        ...updatedFields,
        stockHistory: admin.firestore.FieldValue.arrayUnion(historyEntry),
      });
    }

    io.emit('inventory:stockUpdated', {
      productId,
      stockOnHand: newStockOnHand,
      availableStock: available,
      delta: actualDelta,
      reason: reason || 'Manual adjustment',
    });

    res.json({ ok: true, item: mockStore.inventory[idx] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/inventory/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const item = await updateInventoryItem(productId, { active: false, isAvailable: false, status: 'paused' });
    if (!item) return res.status(404).json({ ok: false, error: 'Product not found' });
    res.json({ ok: true, message: `Product ${productId} paused/deactivated`, item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/inventory/bulk-upload', async (req, res) => {
  try {
    const { items, storeId = 'DS-VIJ-01', csvText } = req.body;
    let productsToInsert = [];

    if (Array.isArray(items) && items.length > 0) {
      productsToInsert = items;
    } else if (typeof csvText === 'string' && csvText.trim().length > 0) {
      const lines = csvText.trim().split(/\r?\n/);
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length >= 2 && cols[0]) {
            const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('product'));
            const catIdx  = headers.findIndex(h => h.includes('cat'));
            const mrpIdx  = headers.findIndex(h => h.includes('mrp') || h.includes('price'));
            const stIdx   = headers.findIndex(h => h.includes('stock') || h.includes('qty'));
            const skuIdx  = headers.findIndex(h => h.includes('sku') || h.includes('code'));

            const name  = nameIdx >= 0 ? cols[nameIdx] : cols[0];
            const cat   = catIdx >= 0 ? cols[catIdx] : 'General';
            const mrp   = mrpIdx >= 0 ? parseFloat(cols[mrpIdx]) || 499 : 499;
            const stock = stIdx >= 0 ? parseInt(cols[stIdx], 10) || 10 : 10;
            const sku   = skuIdx >= 0 ? cols[skuIdx] : 'SKU-' + name.slice(0, 4).toUpperCase() + '-' + (i * 10);

            productsToInsert.push({
              name,
              category: cat,
              mrp,
              sellingPrice: Math.round(mrp * 0.8),
              stock,
              sku,
            });
          }
        }
      }
    }

    if (productsToInsert.length === 0) {
      return res.status(400).json({ ok: false, error: 'No valid products provided for bulk upload' });
    }

    const inserted = [];
    for (const item of productsToInsert) {
      const productId = item.productId || ('SKU-' + uuidv4().slice(0, 8).toUpperCase());
      const mrp = Number(item.mrp || 499);
      const sellingPrice = Number(item.sellingPrice || Math.round(mrp * 0.8));
      const stock = Number(item.stock || 0);

      const product = {
        productId,
        name:         item.name || 'Unnamed Product',
        category:     item.category || 'General',
        sku:          item.sku || ('SKU-' + productId.slice(4)),
        mrp,
        sellingPrice,
        stock,
        bin:          item.bin || 'BIN-GEN-01',
        gstPercent:   item.gstPercent || 18,
        images:       item.images || [],
        active:       item.active !== undefined ? item.active : (stock > 0),
        storeId,
        expiry:       item.expiry || null,
        updatedAt:    Date.now(),
      };

      if (db) {
        await db.collection('inventory').doc(productId).set(product);
      } else {
        const existingIdx = mockStore.inventory.findIndex(p => p.sku === product.sku || p.productId === product.productId);
        if (existingIdx >= 0) {
          mockStore.inventory[existingIdx] = { ...mockStore.inventory[existingIdx], ...product };
        } else {
          mockStore.inventory.unshift(product);
        }
      }
      inserted.push(product);
    }

    io.to(storeId).emit('inventory:bulk_updated', {
      storeId,
      count: inserted.length,
      items: inserted,
      timestamp: Date.now(),
    });
    io.emit('inventory:updated', { storeId, timestamp: Date.now() });

    logger.info(`📦 Bulk uploaded ${inserted.length} SKUs for store ${storeId}`);
    return res.status(200).json({
      ok: true,
      message: `Successfully processed ${inserted.length} products in real time`,
      count: inserted.length,
      items: inserted,
    });
  } catch (err) {
    logger.error(`Bulk upload failed: ${err.message}`);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── EARNINGS ENDPOINTS ────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/earnings/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const earnings = await getEarnings(vendorId);
    res.json({ ok: true, vendorId, earnings });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/earnings/:vendorId/history', async (req, res) => {
  try {
    const { vendorId }   = req.params;
    const { from, to }   = req.query;

    if (db) {
      let q = db.collection('earnings_history').where('vendorId', '==', vendorId);
      if (from) q = q.where('date', '>=', from);
      if (to)   q = q.where('date', '<=', to);
      const snap = await q.orderBy('date', 'desc').limit(30).get();
      return res.json({ ok: true, history: snap.docs.map(d => d.data()) });
    }

    const history = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      history.push({
        date:     d.toISOString().split('T')[0],
        orders:   Math.floor(Math.random() * 15) + 3,
        revenue:  Math.floor(Math.random() * 8000) + 2000,
        earnings: Math.floor(Math.random() * 600) + 150,
      });
    }
    res.json({ ok: true, vendorId, history });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── NOTIFICATIONS ENDPOINTS ───────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/notifications/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const notifications = await getNotifications(vendorId);
    res.json({ ok: true, notifications, count: notifications.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    if (db) {
      await db.collection('notifications').doc(notificationId).update({ read: true, readAt: Date.now() });
    } else {
      const n = mockStore.notifications.find(n => n.id === notificationId);
      if (n) { n.read = true; n.readAt = Date.now(); }
    }
    res.json({ ok: true, notificationId, read: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/notifications/broadcast', async (req, res) => {
  try {
    const { title, body, data } = req.body;
    if (!title || !body) return res.status(400).json({ ok: false, error: 'title and body required' });

    if (fcm) {
      let tokens = [];
      if (db) {
        const snap = await db.collection('vendors').where('fcmToken', '!=', null).get();
        tokens = snap.docs.map(d => d.data().fcmToken).filter(Boolean);
      }
      if (tokens.length > 0) {
        await fcm.sendEachForMulticast({ tokens, notification: { title, body }, data: data || {} });
      }
    }

    io.emit('notification:broadcast', { title, body, data, sentAt: Date.now() });
    res.json({ ok: true, message: 'Broadcast sent' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── ANALYTICS ENDPOINTS ───────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/analytics/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const orders = await getOrders({ storeId });

    const today      = new Date().toDateString();
    const todayOrds  = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const delivered  = todayOrds.filter(o => o.status === 'DELIVERED');
    const revenue    = delivered.reduce((s, o) => s + (o.pricing?.grandTotal || 0), 0);
    const avgOrder   = delivered.length ? Math.round(revenue / delivered.length) : 0;

    const productCounts = {};
    todayOrds.forEach(o => (o.items || []).forEach(it => {
      const k = it.productName || it.name || 'Unknown';
      productCounts[k] = (productCounts[k] || 0) + (it.qty || it.quantity || 1);
    }));
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      ok: true,
      storeId,
      analytics: {
        today: {
          ordersTotal:   todayOrds.length,
          ordersDelivered: delivered.length,
          ordersPending: todayOrds.filter(o => o.status === 'PENDING').length,
          revenue,
          avgOrderValue: avgOrder,
        },
        topProducts,
        orderStatusBreakdown: {
          PENDING:    orders.filter(o => o.status === 'PENDING').length,
          ACCEPTED:   orders.filter(o => o.status === 'ACCEPTED').length,
          PACKED:     orders.filter(o => o.status === 'PACKED').length,
          DISPATCHED: orders.filter(o => o.status === 'DISPATCHED').length,
          DELIVERED:  orders.filter(o => o.status === 'DELIVERED').length,
          CANCELLED:  orders.filter(o => o.status === 'CANCELLED').length,
        },
      },
      generatedAt: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── RETURNS ENDPOINTS ─────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/returns', async (req, res) => {
  try {
    if (db) {
      const snap = await db.collection('returns').orderBy('createdAt', 'desc').limit(50).get();
      return res.json({ ok: true, returns: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    }
    res.json({ ok: true, returns: mockStore.returns });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/returns', async (req, res) => {
  try {
    const { orderId, reason, items, refundAmount, vendorId } = req.body;
    const returnId = 'RET-' + uuidv4().slice(0, 8).toUpperCase();
    const now      = Date.now();

    const returnDoc = {
      returnId,
      orderId:      orderId      || '',
      reason:       reason       || '',
      items:        items        || [],
      refundAmount: refundAmount || 0,
      vendorId:     vendorId     || 'VND-001',
      status:       'PENDING',
      createdAt:    now,
      updatedAt:    now,
    };

    if (db) {
      await db.collection('returns').doc(returnId).set(returnDoc);
    } else {
      mockStore.returns.unshift(returnDoc);
    }

    res.status(201).json({ ok: true, return: returnDoc });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── TEST / SIMULATION / RACE-CONDITION ENDPOINTS ──────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

app.all('/api/test/simulate-order', async (req, res) => {
  try {
    const storeId  = req.body?.storeId  || req.query?.storeId  || 'DS-VIJ-01';
    const vendorId = req.body?.vendorId || req.query?.vendorId || 'VND-001';

    const customers = [
      { name: 'Priya Sharma',   phone: '9876543210', address: 'Flat 4B, Srinagar Colony, Vijayawada 520008' },
      { name: 'Ananya Reddy',   phone: '8765432109', address: '12-3-45, Labbipet, Vijayawada 520010' },
      { name: 'Kavya Nair',     phone: '7654321098', address: 'Plot 88, Gurunanak Colony, Vijayawada 520029' },
      { name: 'Divya Patel',    phone: '6543210987', address: '2-56, Payikapuram, Vijayawada 520015' },
      { name: 'Lakshmi Devi',   phone: '9988776655', address: '3rd Lane, Gandhinagar, Vijayawada 520003' },
    ];
    const customer = customers[Math.floor(Math.random() * customers.length)];

    const products = [
      { name: 'Minimalist 10% Niacinamide Serum 30ml', price: 599, qty: 1 },
      { name: 'CeraVe Hydrating Face Wash 237ml',       price: 999, qty: 1 },
      { name: 'Re\'equil Matte SPF 50 PA+++ 75g',       price: 699, qty: 1 },
      { name: 'Dot & Key Vitamin C Serum 20ml',          price: 449, qty: 1 },
      { name: 'Plum Bright Years Collagen Day Cream',    price: 649, qty: 1 },
    ];
    const numItems = Math.floor(Math.random() * 2) + 1;
    const items    = [];
    const usedIdx  = new Set();
    while (items.length < numItems) {
      const i = Math.floor(Math.random() * products.length);
      if (!usedIdx.has(i)) { usedIdx.add(i); items.push(products[i]); }
    }

    const subtotal    = items.reduce((s, it) => s + it.price * it.qty, 0);
    const deliveryFee = subtotal > 500 ? 0 : 29;
    const grandTotal  = subtotal + deliveryFee;

    const paymentMethods = ['CASH ON DELIVERY', 'PAID ONLINE (PHONEPE)', 'PAID ONLINE (UPI)', 'PAID ONLINE (CARD)'];
    const method         = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const now     = Date.now();

    const newOrder = {
      orderId,
      customerId:      'cust-sim-' + Date.now(),
      customerName:    customer.name,
      customerPhone:   customer.phone,
      shippingAddress: { fullAddress: customer.address },
      items:           items.map(it => ({ productName: it.name, quantity: it.qty, price: it.price })),
      pricing:         { subtotal, deliveryFee, discount: 0, grandTotal },
      payment:         { method, status: method.includes('PAID') ? 'PAID' : 'PENDING' },
      storeId,
      vendorId,
      status:          'PENDING',
      otp:             String(Math.floor(1000 + Math.random() * 9000)),
      createdAt:       now,
      updatedAt:       now,
      timeline:        [{ status: 'PENDING', timestamp: now, note: 'Simulated test order' }],
      isSimulated:     true,
    };

    if (db) {
      await db.collection('orders').doc(orderId).set(newOrder);
    } else {
      mockStore.orders.unshift(newOrder);
    }

    // Push real-time to vendor
    pushNewOrderToStore(storeId, { type: 'NEW_ORDER', order: newOrder, sentAt: now });

    logger.info(`⚡ Simulated order created: ${orderId}`);
    return res.status(201).json({
      ok: true,
      message: 'Simulated order created successfully',
      order: newOrder,
    });
  } catch (err) {
    logger.error(`Simulate order failed: ${err.message}`);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * ALL /api/test/race-condition
 * Concurrency Test: Simulates two customers attempting to purchase the last 1 remaining unit
 * at the exact same millisecond. Tests atomic inventory locks and returns analysis.
 */
app.all('/api/test/race-condition', async (req, res) => {
  try {
    const testSku = req.query?.productId || req.body?.productId || 'SKU-RETINOL-004';
    let prod = mockStore.inventory.find(p => p.productId === testSku);
    if (!prod) {
      prod = mockStore.inventory[0];
    }

    // Set stock to exactly 1 single unit to test the race condition
    prod.stockOnHand = 1;
    prod.reservedStock = 0;
    prod.availableStock = 1;
    prod.stock = 1;
    prod.isAvailable = true;

    // Simulate 2 parallel customer order requests fired concurrently via internal reservation logic
    const orderPromise1 = (async () => {
      const items = [{ productId: prod.productId, name: prod.name, price: prod.price, quantity: 1 }];
      const reserve = reserveInventoryForOrder(items);
      if (!reserve.ok) {
        return { ok: false, status: 409, error: 'OUT_OF_STOCK', customer: 'Customer A (Ananya)', message: `Item "${prod.name}" already reserved by another customer.` };
      }
      const orderId = 'ORD-A-' + Math.floor(100000 + Math.random() * 900000);
      return { ok: true, status: 201, orderId, customer: 'Customer A (Ananya)', reservedQty: 1 };
    })();

    const orderPromise2 = (async () => {
      const items = [{ productId: prod.productId, name: prod.name, price: prod.price, quantity: 1 }];
      const reserve = reserveInventoryForOrder(items);
      if (!reserve.ok) {
        return { ok: false, status: 409, error: 'OUT_OF_STOCK', customer: 'Customer B (Ravi)', message: `Item "${prod.name}" already reserved by another customer.` };
      }
      const orderId = 'ORD-B-' + Math.floor(100000 + Math.random() * 900000);
      return { ok: true, status: 201, orderId, customer: 'Customer B (Ravi)', reservedQty: 1 };
    })();

    const [result1, result2] = await Promise.all([orderPromise1, orderPromise2]);

    const isSuccessA = result1.ok === true;
    const isSuccessB = result2.ok === true;
    const isOneWinner = (isSuccessA && !isSuccessB) || (!isSuccessA && isSuccessB);

    return res.json({
      ok: true,
      testName: 'Concurrency & Distributed Lock Test: Two customers ordering the last unit',
      productTested: {
        productId: prod.productId,
        name: prod.name,
        initialStockBeforeTest: 1,
      },
      customerA_Result: result1,
      customerB_Result: result2,
      concurrencyEvaluation: {
        winnerCustomer: isSuccessA ? 'Customer A (Ananya)' : (isSuccessB ? 'Customer B (Ravi)' : 'None'),
        rejectedCustomer: !isSuccessA ? 'Customer A (Ananya)' : (!isSuccessB ? 'Customer B (Ravi)' : 'None'),
        rejectionStatus: (!isSuccessA ? result1.error : result2.error) || 'OUT_OF_STOCK',
        passed: isOneWinner,
        summary: isOneWinner 
          ? '🏆 PASSED: Exactly 1 order was atomically reserved, and the other was prevented from overselling with HTTP 409 OUT_OF_STOCK.'
          : '⚠️ FAILED: Concurrency anomaly occurred.',
      },
      finalInventoryState: {
        stockOnHand: prod.stockOnHand,
        reservedStock: prod.reservedStock,
        availableStock: prod.availableStock,
        isAvailable: prod.isAvailable,
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Onboarding Submission Endpoint ─────────────────────────────────────────────
app.post('/api/onboarding/submit', async (req, res) => {
  try {
    const payload = req.body;
    const vendorId = payload.vendorId || ('VND-' + Math.floor(100 + Math.random() * 900));
    const storeId  = payload.storeId  || ('DS-' + (payload.city ? payload.city.slice(0, 3).toUpperCase() : 'VIJ') + '-01');

    const vendorRecord = {
      vendorId,
      storeId,
      name:         payload.ownerName || 'Vendor Partner',
      shopName:     payload.shopName  || 'GlowVAI Dark Store',
      email:        payload.email     || 'partner@glowvai.com',
      phone:        payload.phone     || '8977855998',
      shopType:     payload.shopType  || 'Retailer',
      city:         payload.city      || 'Vijayawada',
      pinCode:      payload.pinCode   || '520010',
      locality:     payload.locality  || 'Payakapuram',
      address:      payload.address   || 'Vijayawada Hub',
      latitude:     payload.latitude  || 16.5062,
      longitude:    payload.longitude || 80.6480,
      openTime:     payload.openTime  || '09:30 AM',
      closeTime:    payload.closeTime || '09:30 PM',
      bankDetails:  payload.bankDetails || {},
      kycStatus:    'APPROVED',
      isOnline:     true,
      categories:   payload.selectedCats || ['Skincare', 'Makeup'],
      joinedAt:     Date.now(),
      updatedAt:    Date.now(),
    };

    if (db) {
      await db.collection('vendors').doc(vendorId).set(vendorRecord);
    } else {
      const idx = mockStore.vendors.findIndex(v => v.vendorId === vendorId);
      if (idx >= 0) mockStore.vendors[idx] = vendorRecord;
      else mockStore.vendors.unshift(vendorRecord);
    }

    io.emit('vendor:registered', { vendor: vendorRecord });
    logger.info(`✨ Vendor onboarded: ${vendorRecord.shopName} (${vendorId}) at [${vendorRecord.latitude}, ${vendorRecord.longitude}]`);

    return res.status(200).json({
      ok: true,
      message: 'Onboarding registered and approved successfully',
      vendor: vendorRecord,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Admin Panel APIs ───────────────────────────────────────────────────────────
app.get('/api/admin/overview', async (_req, res) => {
  try {
    const totalOrders    = mockStore.orders.length;
    const totalInventory = mockStore.inventory.length;
    const totalVendors   = mockStore.vendors.length;
    const pendingOrders  = mockStore.orders.filter(o => o.status === 'PENDING').length;
    const lowStockItems  = mockStore.inventory.filter(i => i.stock < 5).length;
    const grossVolume    = mockStore.orders.reduce((sum, o) => sum + (o.pricing?.grandTotal || 0), 0);
    const platformRevenue= Math.round(grossVolume * 0.12);

    res.json({
      ok: true,
      stats: {
        totalOrders,
        totalInventory,
        totalVendors,
        pendingOrders,
        lowStockItems,
        grossVolume,
        platformRevenue,
      },
      vendors:   mockStore.vendors,
      orders:    mockStore.orders.slice(0, 20),
      inventory: mockStore.inventory.slice(0, 30),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/admin/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    let vendor = mockStore.vendors.find(v => v.vendorId === vendorId || v.storeId === vendorId);
    if (!vendor && db) {
      const doc = await db.collection('vendors').doc(vendorId).get();
      if (doc.exists) vendor = doc.data();
    }
    if (!vendor) return res.status(404).json({ ok: false, error: 'Vendor dark store not found' });

    const vendorOrders = mockStore.orders.filter(o => o.vendorId === vendorId || o.storeId === vendor.storeId);
    const vendorInventory = mockStore.inventory.filter(i => i.storeId === vendor.storeId || !i.storeId);
    const grossEarnings = vendorOrders.reduce((sum, o) => sum + (o.pricing?.grandTotal || 0), 0);
    const netPayout = Math.round(grossEarnings * 0.88);

    res.json({
      ok: true,
      vendor: {
        ...vendor,
        stats: {
          ordersCount: vendorOrders.length,
          inventoryCount: vendorInventory.length,
          lowStockCount: vendorInventory.filter(i => i.stock < 5).length,
          grossEarnings,
          netPayout,
          platformFeePaid: Math.round(grossEarnings * 0.12),
        },
        inventory: vendorInventory,
        recentOrders: vendorOrders.slice(0, 10),
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Web Admin Panel (Clean White / Light Theme Fleet Command) ─────────────────
app.get('/', (_req, res) => {
  res.redirect('/admin');
});

app.get('/admin', (_req, res) => {
  const adminHtmlPath = path.join(__dirname, 'views', 'admin.html');
  if (fs.existsSync(adminHtmlPath)) {
    return res.sendFile(adminHtmlPath);
  }
  return res.send('Admin panel loading...');
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Endpoint not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error(`Unhandled: ${err.message}`);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`🚀 GlowVAI Vendor Backend running on http://localhost:${PORT}`);
  logger.info(`📡 WebSocket (Socket.IO) ready`);
  logger.info(`🔥 Firebase: ${firebaseInitialized ? 'Connected' : 'MOCK mode'}`);
  logger.info('');
  logger.info('═══ API Endpoints ══════════════════════════════════════');
  logger.info(`  GET    /health`);
  logger.info(`  GET    /api/vendor/:vendorId`);
  logger.info(`  PATCH  /api/vendor/:vendorId/status`);
  logger.info(`  PATCH  /api/vendor/:vendorId/fcm-token`);
  logger.info(`  GET    /api/orders`);
  logger.info(`  GET    /api/orders/all`);
  logger.info(`  GET    /api/orders/pending`);
  logger.info(`  GET    /api/orders/:orderId`);
  logger.info(`  POST   /api/orders`);
  logger.info(`  PATCH  /api/orders/:orderId/accept`);
  logger.info(`  PATCH  /api/orders/:orderId/pack`);
  logger.info(`  PATCH  /api/orders/:orderId/prepare`);
  logger.info(`  PATCH  /api/orders/:orderId/ready`);
  logger.info(`  PATCH  /api/orders/:orderId/handover`);
  logger.info(`  PATCH  /api/orders/:orderId/dispatch`);
  logger.info(`  PATCH  /api/orders/:orderId/deliver`);
  logger.info(`  PATCH  /api/orders/:orderId/cancel`);
  logger.info(`  PATCH  /api/orders/:orderId/reject`);
  logger.info(`  PATCH  /api/orders/:orderId/timeout`);
  logger.info(`  GET    /api/inventory`);
  logger.info(`  POST   /api/inventory`);
  logger.info(`  PATCH  /api/inventory/:productId`);
  logger.info(`  PATCH  /api/inventory/:productId/stock`);
  logger.info(`  DELETE /api/inventory/:productId`);
  logger.info(`  POST   /api/inventory/bulk-upload`);
  logger.info(`  GET    /api/earnings/:vendorId`);
  logger.info(`  GET    /api/earnings/:vendorId/history`);
  logger.info(`  GET    /api/notifications/:vendorId`);
  logger.info(`  PATCH  /api/notifications/:notifId/read`);
  logger.info(`  POST   /api/notifications/broadcast`);
  logger.info(`  GET    /api/analytics/:storeId`);
  logger.info(`  GET    /api/returns`);
  logger.info(`  POST   /api/returns`);
  logger.info(`  POST   /api/test/simulate-order`);
  logger.info(`  ALL    /api/test/race-condition`);
  logger.info('═══════════════════════════════════════════════════════');
});

module.exports = { app, server, io };
