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

// ── Security configuration (refuses to start in production without secrets) ──
const {
  IS_PROD, DEV_OTP, loadSecurityConfig, safeEqual, buildCorsOriginCheck, parseServiceAccountEnv,
} = require('./lib/config');
const { signVendorToken, verifyVendorToken, bearerToken, normalizePhone } = require('./lib/vendorAuth');
const P = require('./lib/products');

let SECURITY;
try {
  SECURITY = loadSecurityConfig(logger);
} catch (_) {
  process.exit(1);
}

// ── Firebase Admin SDK ──────────────────────────────────────────────────────
const admin = require('firebase-admin');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'glowvai-v2';
const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || `${FIREBASE_PROJECT_ID}.firebasestorage.app`;

let firebaseInitialized = false;
try {
  const saPath = path.resolve(
    __dirname,
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '../service-account.json'
  );
  let credentialSource = null;
  let serviceAccount = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = parseServiceAccountEnv(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    credentialSource = 'FIREBASE_SERVICE_ACCOUNT_JSON';
  } else if (fs.existsSync(saPath)) {
    serviceAccount = require(saPath);
    credentialSource = saPath;
  }
  if (serviceAccount) {
    admin.initializeApp({
      credential:    admin.credential.cert(serviceAccount),
      databaseURL:   process.env.FIREBASE_DATABASE_URL || `https://${FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
      projectId:     FIREBASE_PROJECT_ID,
      storageBucket: FIREBASE_STORAGE_BUCKET,
    });
    firebaseInitialized = true;
    logger.info(`✅ Firebase Admin SDK initialized from ${credentialSource}`);
  } else {
    logger.warn('⚠️  Firebase service account not found — running in MOCK mode (data kept in memory)');
  }
} catch (err) {
  if (IS_PROD) {
    logger.error(`Firebase init failed in production: ${err.message}`);
    process.exit(1);
  }
  logger.warn(`⚠️  Firebase init failed: ${err.message} — running in MOCK mode`);
}
if (IS_PROD && !firebaseInitialized) {
  logger.error('Refusing to start in production without Firebase credentials (set FIREBASE_SERVICE_ACCOUNT_JSON). Mock mode keeps data in memory only.');
  process.exit(1);
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
  storefront: new Map(), // MOCK copy of Firestore products/{productId}
  uploads: new Map(),    // MOCK image uploads: id -> { buffer, contentType }
};

// MOCK only: the seed products belong to seed vendor VND-001 and are pre-approved so
// the mock storefront is not empty. Products created through the API start PENDING.
const SEED_SHOP_CATEGORY = {
  'SKU-NIAC-001': 'Serums',
  'SKU-FACE-WASH-002': 'Cleansers',
  'SKU-SPF-003': 'Suncare',
  'SKU-RETINOL-004': 'Treatments',
};
for (const p of mockStore.inventory) {
  const shop = SEED_SHOP_CATEGORY[p.productId];
  Object.assign(p, {
    vendorId: 'VND-001',
    storeId: 'DS-VIJ-01',
    category: shop ? 'Skincare' : p.category,
    categoryId: shop ? 'skincare' : p.categoryId,
    shopCategory: shop || null,
    keyActives: [],
    deleted: false,
    approvalStatus: 'APPROVED',
    rejectionReason: null,
    approvedAt: p.updatedAt,
    createdAt: p.updatedAt,
  });
}

// ── Express App & HTTP Server ────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const PORT   = parseInt(process.env.PORT || '4000');
const CORS   = buildCorsOriginCheck(logger);

// Render (and most hosts) terminate TLS at a proxy; trust it so req.protocol is https.
app.set('trust proxy', 1);

// ── Socket.IO — Real-time Push ───────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:  CORS.check,
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

// Vendor sockets authenticate with the same session token as the REST API
// (socket.io `auth: { token }`). Outside production an unauthenticated socket may
// still name its vendorId, so the mock demo keeps working.
io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  socket.data.vendor = token ? verifyVendorToken(token, SECURITY.vendorTokenSecret) : null;
  next();
});

function socketVendor(socket, claimed) {
  const session = socket.data.vendor;
  if (session && session.vendorId) return { vendorId: session.vendorId, storeId: session.storeId };
  if (!IS_PROD && claimed && claimed.vendorId) return { vendorId: claimed.vendorId, storeId: claimed.storeId };
  return null;
}

io.on('connection', (socket) => {
  logger.info(`📡 Socket connected: ${socket.id}`);

  // Vendor registers itself with location
  socket.on('vendor:register', ({ vendorId, storeId, lat, lng, name } = {}) => {
    const who = socketVendor(socket, { vendorId, storeId });
    if (!who) {
      socket.emit('vendor:registered', { ok: false, error: 'Sign in required' });
      return;
    }
    const vid = who.vendorId;
    vendorSockets.set(vid, socket.id);
    socket.join(`vendor:${vid}`);
    if (who.storeId) socket.join(`store:${who.storeId}`);

    dispatchEngine.attachSocketToVendor(vid, socket.id);
    if (lat && lng) {
      dispatchEngine.registerVendorLocation(vid, lng, lat, { storeId: who.storeId, name, socketId: socket.id });
    }

    logger.info(`🏪 Vendor ${vid} registered on socket ${socket.id}`);
    socket.emit('vendor:registered', { ok: true, vendorId: vid, storeId: who.storeId });
  });

  // Real-time vendor GPS location ping
  socket.on('vendor:location:update', ({ vendorId, latitude, longitude } = {}) => {
    const who = socketVendor(socket, { vendorId });
    if (!who) return;
    dispatchEngine.registerVendorLocation(who.vendorId, longitude, latitude, { socketId: socket.id });
  });

  // Vendor updates online/offline duty status
  socket.on('vendor:setStatus', async ({ vendorId, isOnline } = {}) => {
    const who = socketVendor(socket, { vendorId });
    if (!who) return;
    try {
      await setVendorOnlineStatus(who.vendorId, isOnline);
      dispatchEngine.setVendorOnlineStatus(who.vendorId, isOnline);
      io.to(`vendor:${who.vendorId}`).emit('vendor:statusUpdated', { isOnline });
    } catch (err) {
      logger.warn(`vendor:setStatus failed: ${err.message}`);
    }
  });

  // Orders are routed to the vendor that owns the products, so accepting is an
  // ownership check plus the shared accept logic (stock commit + storefront sync).
  socket.on('ACCEPT_ORDER', async ({ orderId, vendorId } = {}) => {
    const who = socketVendor(socket, { vendorId });
    if (!who) {
      socket.emit('ORDER_CLAIM_FAILED', { ok: false, orderId, message: 'Sign in required' });
      return;
    }
    const result = await acceptOrder(orderId, { vendorId: who.vendorId });
    if (result.ok) {
      socket.emit('ORDER_CONFIRMED', {
        ok: true,
        orderId,
        vendorId: who.vendorId,
        message: 'Order accepted',
        order: result.order,
      });
    } else {
      socket.emit('ORDER_CLAIM_FAILED', { ok: false, orderId, message: result.error });
    }
  });

  // Vendor declines an offer
  socket.on('DECLINE_ORDER', ({ orderId, vendorId } = {}) => {
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

// Helper: push a new order only to the vendor (and store room) that owns it.
function pushOrderToVendor(order) {
  const payload = { type: 'NEW_ORDER', order, orderId: order.orderId, sentAt: Date.now() };
  const room = io.to(`vendor:${order.vendorId}`).to(`store:${order.storeId}`);
  room.emit('order:incoming', payload);
  room.emit('ORDER_OFFER', payload);
}

// ── Firebase Realtime Database Direct Sync Engine ───────────────────────────
const FIREBASE_RTDB_URL = (process.env.FIREBASE_DATABASE_URL || 'https://glowvai-v2-default-rtdb.firebaseio.com').replace(/\/$/, '');

// Off by default. Writes go to the live database without credentials, so enable this
// only for a local emulator (FIREBASE_DIRECT_SYNC=true). The startup seeding was removed.
const FIREBASE_DIRECT_SYNC = process.env.FIREBASE_DIRECT_SYNC === 'true';

async function syncToFirebaseRTDB(dbPath, payload, method = 'PUT') {
  if (!FIREBASE_DIRECT_SYNC) return;
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

// ── Security Headers ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ── CORS ────────────────────────────────────────────────────────────────────
// Allowed: https://glowvai.in, https://www.glowvai.in, http://localhost:3100, plus
// ALLOWED_ORIGINS (comma-separated). Outside production any localhost origin is allowed.
app.use(cors({
  origin: CORS.check,
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

// ── Sessions: vendor token (Authorization: Bearer) and admin key (x-admin-key) ──
app.use((req, _res, next) => {
  const token = bearerToken(req);
  req.vendor = token ? verifyVendorToken(token, SECURITY.vendorTokenSecret) : null;
  const key = req.headers['x-admin-key'];
  req.isAdmin = typeof key === 'string' && key.length > 0 && safeEqual(key, SECURITY.adminApiKey);
  next();
});

function requireVendor(req, res, next) {
  if (req.vendor && req.vendor.vendorId) return next();
  return res.status(401).json({ ok: false, error: 'Vendor sign-in required', code: 'VENDOR_AUTH_REQUIRED' });
}

// A phone-verified session (vendorId may still be null before onboarding).
function requirePhoneSession(req, res, next) {
  if (req.vendor && req.vendor.phone) return next();
  return res.status(401).json({ ok: false, error: 'Verify your phone number first', code: 'VENDOR_AUTH_REQUIRED' });
}

function requireAdmin(req, res, next) {
  if (req.isAdmin) return next();
  return res.status(401).json({ ok: false, error: 'Admin key required (x-admin-key)', code: 'ADMIN_AUTH_REQUIRED' });
}

function requireVendorOrAdmin(req, res, next) {
  if (req.isAdmin || (req.vendor && req.vendor.vendorId)) return next();
  return res.status(401).json({ ok: false, error: 'Vendor sign-in or admin key required', code: 'AUTH_REQUIRED' });
}

// The vendor in the token may only act on its own records; admins may act on any.
function ownsRecord(req, record) {
  if (req.isAdmin) return true;
  return !!(record && req.vendor && record.vendorId === req.vendor.vendorId);
}

function sendError(res, err) {
  const status = err.status || 500;
  if (status >= 500) logger.error(err.stack || err.message);
  return res.status(status).json({ ok: false, error: err.message, ...(err.code ? { code: err.code } : {}) });
}

// ── Request Logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ════════════════════════════════════════════════════════════════════════════
// ── DATA ACCESS (Firestore in real mode, mockStore in MOCK mode) ─────────────
// ════════════════════════════════════════════════════════════════════════════

class HttpError extends Error {
  constructor(status, message, code, extra) {
    super(message);
    this.status = status;
    if (code) this.code = code;
    if (extra) this.extra = extra;
  }
}

async function getProduct(productId) {
  if (!productId || typeof productId !== 'string') return null;
  if (db) {
    const d = await db.collection('inventory').doc(productId).get();
    return d.exists ? { productId: d.id, ...d.data() } : null;
  }
  return mockStore.inventory.find(p => p.productId === productId) || null;
}

async function createProduct(product) {
  if (db) await db.collection('inventory').doc(product.productId).set(product);
  else mockStore.inventory.unshift(product);
  syncToFirebaseRTDB(`inventory/${product.productId}`, product);
  return product;
}

async function saveProductChanges(productId, changes, historyEntry = null) {
  if (db) {
    const update = { ...changes };
    if (historyEntry) update.stockHistory = admin.firestore.FieldValue.arrayUnion(historyEntry);
    await db.collection('inventory').doc(productId).update(update);
    return getProduct(productId);
  }
  const p = mockStore.inventory.find(i => i.productId === productId);
  if (!p) return null;
  Object.assign(p, changes);
  if (historyEntry) p.stockHistory = [historyEntry, ...(p.stockHistory || [])].slice(0, 100);
  return p;
}

async function listProducts({ storeId, vendorId, approvalStatus } = {}) {
  if (db) {
    let q = db.collection('inventory');
    if (storeId) q = q.where('storeId', '==', storeId);
    if (vendorId) q = q.where('vendorId', '==', vendorId);
    if (approvalStatus) q = q.where('approvalStatus', '==', approvalStatus);
    const snap = await q.limit(500).get();
    return snap.docs.map(d => ({ productId: d.id, ...d.data() }));
  }
  return mockStore.inventory.filter(p =>
    (!storeId || p.storeId === storeId) &&
    (!vendorId || p.vendorId === vendorId) &&
    (!approvalStatus || p.approvalStatus === approvalStatus));
}

async function getVendor(vendorId) {
  if (!vendorId || typeof vendorId !== 'string') return null;
  if (db) {
    const d = await db.collection('vendors').doc(vendorId).get();
    return d.exists ? { vendorId: d.id, ...d.data() } : null;
  }
  return mockStore.vendors.find(v => v.vendorId === vendorId) || null;
}

async function findVendorByPhone(phone) {
  if (!phone) return null;
  if (db) {
    const snap = await db.collection('vendors').where('phone', '==', phone).limit(1).get();
    return snap.empty ? null : { vendorId: snap.docs[0].id, ...snap.docs[0].data() };
  }
  return mockStore.vendors.find(v => normalizePhone(v.phone) === phone) || null;
}

async function saveVendor(vendorId, fields) {
  if (db) {
    await db.collection('vendors').doc(vendorId).set(fields, { merge: true });
    return getVendor(vendorId);
  }
  let v = mockStore.vendors.find(x => x.vendorId === vendorId);
  if (!v) { v = { vendorId }; mockStore.vendors.unshift(v); }
  Object.assign(v, fields);
  return v;
}

async function listVendors({ kycStatus } = {}) {
  if (db) {
    let q = db.collection('vendors');
    if (kycStatus) q = q.where('kycStatus', '==', kycStatus);
    const snap = await q.limit(500).get();
    return snap.docs.map(d => ({ vendorId: d.id, ...d.data() }));
  }
  return mockStore.vendors.filter(v => !kycStatus || v.kycStatus === kycStatus);
}

// ════════════════════════════════════════════════════════════════════════════
// ── STOREFRONT PUBLISHING (Firestore products/{productId}) ───────────────────
// ════════════════════════════════════════════════════════════════════════════
// A product is listed when it is APPROVED, its vendor is APPROVED, it is an active
// Skincare product with a shop category, and it has available stock. Otherwise its
// storefront document (if one was ever written) is set to active:false.

async function syncStorefront(productId, cachedVendor = null) {
  try {
    const product = await getProduct(productId);
    let vendor = null;
    if (product) {
      vendor = cachedVendor && cachedVendor.vendorId === product.vendorId
        ? cachedVendor
        : await getVendor(product.vendorId);
    }
    const blockers = P.listingBlockers(product, vendor);
    const now = Date.now();

    if (!blockers.length) {
      const doc = P.toStorefrontDoc(product, { vendor, httpsOnly: !!db, now });
      if (db) await db.collection('products').doc(productId).set(doc, { merge: true });
      else mockStore.storefront.set(productId, doc);
      return { live: true, blockers };
    }

    const available = Math.max(0, Number(product && product.availableStock) || 0);
    const hide = { active: false, inStock: available > 0, availableStock: available, updatedAt: new Date(now).toISOString() };
    if (db) {
      try {
        await db.collection('products').doc(productId).update(hide);
      } catch (e) {
        if (e.code !== 5) throw e; // 5 = NOT_FOUND: never published, nothing to hide
      }
    } else if (mockStore.storefront.has(productId)) {
      Object.assign(mockStore.storefront.get(productId), hide);
    }
    return { live: false, blockers };
  } catch (err) {
    logger.error(`Storefront sync failed for ${productId}: ${err.message}`);
    return { live: false, blockers: ['storefront sync failed'], error: err.message };
  }
}

async function syncVendorStorefront(vendorId) {
  const vendor = await getVendor(vendorId);
  const products = await listProducts({ vendorId });
  let live = 0;
  for (const p of products) {
    const r = await syncStorefront(p.productId, vendor);
    if (r.live) live++;
  }
  return { products: products.length, live };
}

function withListing(product, vendor) {
  const blockers = P.listingBlockers(product, vendor);
  return { ...product, listing: { live: blockers.length === 0, blockers } };
}

// ════════════════════════════════════════════════════════════════════════════
// ── ATOMIC STOCK ENGINE ─────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
// reserve: order placed (available - qty)      release: rejected/cancelled before accept
// commit:  order accepted (on hand - qty)      restock: cancelled after accept
// Each order records stockState so a movement is applied at most once.

const STOCK_TRANSITIONS = {
  reserve: [null, 'RESERVED'],
  release: ['RESERVED', 'RELEASED'],
  commit:  ['RESERVED', 'COMMITTED'],
  restock: ['COMMITTED', 'RELEASED'],
};

function orderLines(items) {
  const byProduct = new Map();
  for (const it of items || []) {
    if (!it || !it.productId) continue;
    const qty = Math.max(1, Math.floor(Number(it.qty ?? it.quantity ?? 1)) || 1);
    byProduct.set(it.productId, (byProduct.get(it.productId) || 0) + qty);
  }
  return [...byProduct].map(([productId, qty]) => ({ productId, qty }));
}

function nextStock(prod, qty, kind) {
  let onHand = prod.stockOnHand ?? prod.stock ?? 0;
  let reserved = prod.reservedStock ?? 0;
  if (kind === 'reserve') reserved += qty;
  else if (kind === 'release') reserved = Math.max(0, reserved - qty);
  else if (kind === 'commit') { onHand = Math.max(0, onHand - qty); reserved = Math.max(0, reserved - qty); }
  else if (kind === 'restock') onHand += qty;
  return P.stockFields(onHand, reserved);
}

function outOfStock(prod, qty) {
  return new HttpError(409,
    `"${prod.name}" is out of stock or already reserved (available ${prod.availableStock ?? 0}, requested ${qty})`,
    'OUT_OF_STOCK',
    { productId: prod.productId, productName: prod.name, availableStock: prod.availableStock ?? 0, requestedQty: qty });
}

/**
 * Moves stock for an order atomically. With kind 'reserve', `newOrders` are created
 * in the same step (all-or-nothing). For other kinds `orderId` is required and the
 * movement is skipped when the order's stockState does not match.
 */
async function moveOrderStock({ kind, lines, orderId = null, newOrders = [] }) {
  const [fromState, toState] = STOCK_TRANSITIONS[kind];
  let skipped = false;
  const now = Date.now();

  if (db) {
    try {
      await db.runTransaction(async (tx) => {
        skipped = false;
        const refs = lines.map(l => db.collection('inventory').doc(l.productId));
        const snaps = refs.length ? await tx.getAll(...refs) : [];
        let orderRef = null;
        if (orderId) {
          orderRef = db.collection('orders').doc(orderId);
          const os = await tx.get(orderRef);
          if (!os.exists) throw new HttpError(404, 'Order not found');
          if ((os.data().stockState || null) !== fromState) { skipped = true; return; }
        }
        const writes = [];
        snaps.forEach((snap, i) => {
          if (!snap.exists) {
            if (kind === 'reserve') throw new HttpError(400, `Unknown product ${lines[i].productId}`, 'UNKNOWN_PRODUCT');
            return;
          }
          const prod = { productId: snap.id, ...snap.data() };
          if (kind === 'reserve' && (prod.availableStock ?? 0) < lines[i].qty) throw outOfStock(prod, lines[i].qty);
          writes.push([refs[i], nextStock(prod, lines[i].qty, kind)]);
        });
        writes.forEach(([ref, f]) => tx.update(ref, { ...f, updatedAt: now }));
        if (orderRef) tx.update(orderRef, { stockState: toState });
        newOrders.forEach(o => tx.create(db.collection('orders').doc(o.orderId), { ...o, stockState: toState }));
      });
    } catch (e) {
      if (e.code === 6) throw new HttpError(409, 'Order already exists', 'DUPLICATE_ORDER'); // 6 = ALREADY_EXISTS
      throw e;
    }
  } else {
    // Single-threaded: check everything first, then apply, with no await in between.
    let order = null;
    if (orderId) {
      order = mockStore.orders.find(o => o.orderId === orderId);
      if (!order) throw new HttpError(404, 'Order not found');
      if ((order.stockState || null) !== fromState) skipped = true;
    }
    if (!skipped) {
      for (const o of newOrders) {
        if (mockStore.orders.some(x => x.orderId === o.orderId)) {
          throw new HttpError(409, `Order ${o.orderId} already exists`, 'DUPLICATE_ORDER');
        }
      }
      const prods = lines.map(l => mockStore.inventory.find(p => p.productId === l.productId));
      prods.forEach((prod, i) => {
        if (!prod && kind === 'reserve') throw new HttpError(400, `Unknown product ${lines[i].productId}`, 'UNKNOWN_PRODUCT');
        if (prod && kind === 'reserve' && (prod.availableStock ?? 0) < lines[i].qty) throw outOfStock(prod, lines[i].qty);
      });
      prods.forEach((prod, i) => { if (prod) Object.assign(prod, nextStock(prod, lines[i].qty, kind), { updatedAt: now }); });
      if (order) order.stockState = toState;
      newOrders.forEach(o => mockStore.orders.unshift({ ...o, stockState: toState }));
    }
  }

  if (skipped) return { ok: true, skipped: true };

  for (const l of lines) {
    await syncStorefront(l.productId);
    const prod = await getProduct(l.productId);
    if (prod) {
      io.to(`vendor:${prod.vendorId}`).emit('inventory:stockUpdated', {
        productId: prod.productId,
        stockOnHand: prod.stockOnHand,
        availableStock: prod.availableStock,
        reservedStock: prod.reservedStock,
      });
    }
  }
  return { ok: true, skipped: false };
}

// ════════════════════════════════════════════════════════════════════════════
// ── HELPER FUNCTIONS ────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

async function getOrders(filter = {}) {
  let orders;
  if (db) {
    // Equality filters only, sorted in memory: avoids needing composite indexes.
    let query = db.collection('orders');
    if (filter.storeId)  query = query.where('storeId', '==', filter.storeId);
    if (filter.vendorId) query = query.where('vendorId', '==', filter.vendorId);
    if (filter.status)   query = query.where('status', '==', filter.status);
    const snap = await query.limit(500).get();
    orders = snap.docs.map(d => ({ orderId: d.id, ...d.data() }));
  } else {
    orders = mockStore.orders.filter(o =>
      (!filter.storeId || o.storeId === filter.storeId) &&
      (!filter.vendorId || o.vendorId === filter.vendorId) &&
      (!filter.status || o.status === filter.status));
  }
  return orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 200);
}

async function getOrderById(orderId) {
  if (!orderId || typeof orderId !== 'string') return null;
  if (db) {
    const doc = await db.collection('orders').doc(orderId).get();
    return doc.exists ? { orderId: doc.id, ...doc.data() } : null;
  }
  return mockStore.orders.find(o => o.orderId === orderId) || null;
}

async function updateOrderStatus(orderId, status, extraFields = {}) {
  const updatedAt = Date.now();
  const { note = '', ...fields } = extraFields;
  const entry = { status, timestamp: updatedAt, note };
  if (db) {
    await db.collection('orders').doc(orderId).update({
      status, updatedAt, ...fields,
      timeline: admin.firestore.FieldValue.arrayUnion(entry),
    });
    syncToFirebaseRTDB(`orders/${orderId}`, { status, updatedAt, ...fields }, 'PATCH');
    return getOrderById(orderId);
  }
  const idx = mockStore.orders.findIndex(o => o.orderId === orderId);
  if (idx === -1) return null;
  const prev = mockStore.orders[idx];
  mockStore.orders[idx] = { ...prev, status, updatedAt, ...fields, timeline: [...(prev.timeline || []), entry] };
  syncToFirebaseRTDB(`orders/${orderId}`, mockStore.orders[idx]);
  return mockStore.orders[idx];
}

async function setVendorOnlineStatus(vendorId, isOnline) {
  const updatedAt = Date.now();
  if (db) {
    await db.collection('vendors').doc(vendorId).set({ isOnline: !!isOnline, updatedAt }, { merge: true });
    syncToFirebaseRTDB(`vendors/${vendorId}/isOnline`, isOnline);
    syncToFirebaseRTDB(`vendors/${vendorId}/updatedAt`, updatedAt);
  } else {
    const v = mockStore.vendors.find(v => v.vendorId === vendorId);
    if (v) {
      v.isOnline = !!isOnline;
      v.updatedAt = updatedAt;
      syncToFirebaseRTDB(`vendors/${vendorId}`, v);
    }
  }
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
// ── VENDOR SIGN-IN ────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

// POST /api/auth/vendor/login
//   { phone, otp }         outside production only; otp must equal VENDOR_DEV_OTP (default 4892)
//   { firebaseIdToken }    a Firebase Phone Auth ID token (real mode); the phone comes from the token
// → { ok, token, phone, registered, vendorId, storeId, kycStatus, kycRejectionReason }
// The token is phone-only (vendorId null) until onboarding is submitted.
app.post('/api/auth/vendor/login', async (req, res) => {
  try {
    const { otp, firebaseIdToken } = req.body || {};
    let phone = null;

    if (firebaseIdToken) {
      if (!firebaseInitialized) {
        return res.status(400).json({ ok: false, error: 'Firebase sign-in is not available in mock mode', code: 'FIREBASE_UNAVAILABLE' });
      }
      try {
        const decoded = await admin.auth().verifyIdToken(String(firebaseIdToken));
        phone = normalizePhone(decoded.phone_number);
      } catch (_) {
        return res.status(401).json({ ok: false, error: 'Phone sign-in could not be verified', code: 'INVALID_ID_TOKEN' });
      }
      if (!phone) return res.status(401).json({ ok: false, error: 'The sign-in has no phone number', code: 'INVALID_ID_TOKEN' });
    } else {
      if (IS_PROD) {
        return res.status(400).json({ ok: false, error: 'Use phone sign-in (firebaseIdToken)', code: 'OTP_PROVIDER_REQUIRED' });
      }
      phone = normalizePhone(req.body && req.body.phone);
      if (!phone) return res.status(400).json({ ok: false, error: 'Enter a valid 10-digit mobile number', code: 'INVALID_PHONE' });
      if (String(otp || '') !== DEV_OTP) {
        return res.status(401).json({ ok: false, error: 'Incorrect verification code', code: 'INVALID_OTP' });
      }
    }

    const vendor = await findVendorByPhone(phone);
    const token = signVendorToken({ vendorId: vendor && vendor.vendorId, storeId: vendor && vendor.storeId, phone }, SECURITY.vendorTokenSecret);
    return res.json({
      ok: true,
      token,
      phone,
      registered: !!vendor,
      vendorId: vendor ? vendor.vendorId : null,
      storeId: vendor ? vendor.storeId : null,
      kycStatus: vendor ? vendor.kycStatus || 'PENDING' : null,
      kycRejectionReason: vendor ? vendor.kycRejectionReason || null : null,
    });
  } catch (err) {
    return sendError(res, err);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── VENDOR ENDPOINTS ─────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

// GET /api/vendor/me → { ok, vendor } for the signed-in vendor (used to poll KYC status).
app.get('/api/vendor/me', requireVendor, async (req, res) => {
  try {
    const vendor = await getVendor(req.vendor.vendorId);
    if (!vendor) return res.status(404).json({ ok: false, error: 'Vendor not found' });
    return res.json({ ok: true, vendor });
  } catch (err) {
    return sendError(res, err);
  }
});

function requireSelfOrAdmin(req, res, next) {
  if (req.isAdmin || (req.vendor && req.vendor.vendorId === req.params.vendorId)) return next();
  return res.status(req.vendor || req.isAdmin ? 403 : 401).json({ ok: false, error: 'Not allowed for this vendor', code: 'FORBIDDEN' });
}

app.get('/api/vendor/:vendorId', requireSelfOrAdmin, async (req, res) => {
  try {
    const vendor = await getVendor(req.params.vendorId);
    if (!vendor) return res.status(404).json({ ok: false, error: 'Vendor not found' });
    res.json({ ok: true, vendor });
  } catch (err) {
    sendError(res, err);
  }
});

app.patch('/api/vendor/:vendorId/status', requireSelfOrAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { isOnline }  = req.body;
    await setVendorOnlineStatus(vendorId, isOnline);
    pushToVendor(vendorId, 'vendor:statusUpdated', { isOnline, updatedAt: Date.now() });
    res.json({ ok: true, vendorId, isOnline, updatedAt: Date.now() });
  } catch (err) {
    sendError(res, err);
  }
});

app.patch('/api/vendor/:vendorId/fcm-token', requireSelfOrAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { fcmToken }  = req.body;
    if (!fcmToken || typeof fcmToken !== 'string') return res.status(400).json({ ok: false, error: 'fcmToken required' });
    const vendor = await getVendor(vendorId);
    if (!vendor) return res.status(404).json({ ok: false, error: 'Vendor not found' });
    await saveVendor(vendorId, { fcmToken, updatedAt: Date.now() });
    res.json({ ok: true, vendorId, fcmToken });
  } catch (err) {
    sendError(res, err);
  }
});

// Profile fields a vendor may change. KYC status, ids and phone are never taken from the body.
const VENDOR_EDITABLE_FIELDS = [
  'name', 'shopName', 'email', 'shopType', 'city', 'pinCode', 'locality', 'address',
  'latitude', 'longitude', 'openTime', 'closeTime', 'categories', 'avatarUrl',
];

app.patch('/api/vendor/:vendorId', requireSelfOrAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const existing = await getVendor(vendorId);
    if (!existing) return res.status(404).json({ ok: false, error: 'Vendor not found' });
    const updates = {};
    for (const k of VENDOR_EDITABLE_FIELDS) {
      if (req.body && req.body[k] !== undefined) updates[k] = req.body[k];
    }
    if (req.body && req.body.pincode !== undefined && updates.pinCode === undefined) updates.pinCode = req.body.pincode;
    const previousShopName = existing.shopName;
    const vendor = await saveVendor(vendorId, { ...updates, updatedAt: Date.now() });
    // storeName on the storefront docs comes from shopName.
    if (updates.shopName !== undefined && updates.shopName !== previousShopName) await syncVendorStorefront(vendorId);
    return res.json({ ok: true, vendor });
  } catch (err) {
    sendError(res, err);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── ORDER ENDPOINTS ──────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

// Order reads are scoped: a vendor sees its own orders, an admin sees all.
app.get('/api/orders', requireVendorOrAdmin, async (req, res) => {
  try {
    const { storeId, status, vendorId } = req.query;
    const filter = req.isAdmin
      ? { storeId, status, vendorId }
      : { vendorId: req.vendor.vendorId, status };
    const orders = await getOrders(filter);
    res.json({ ok: true, orders, count: orders.length });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/orders/all', requireAdmin, async (req, res) => {
  try {
    const orders = await getOrders({});
    res.json({ ok: true, orders, count: orders.length });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/orders/pending', requireVendorOrAdmin, async (req, res) => {
  try {
    const orders = await getOrders(req.isAdmin ? { status: 'PENDING' } : { status: 'PENDING', vendorId: req.vendor.vendorId });
    res.json({ ok: true, orders, count: orders.length });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/orders/:orderId', requireVendorOrAdmin, async (req, res) => {
  try {
    const order = await getOrderById(req.params.orderId);
    if (!order || !ownsRecord(req, order)) return res.status(404).json({ ok: false, error: 'Order not found' });
    res.json({ ok: true, order });
  } catch (err) {
    sendError(res, err);
  }
});

// ── Order placement ───────────────────────────────────────────────────────────
// Every line must carry a productId (vendorId optional; if given it must match the
// product). Lines are priced from the catalog and the order is routed to the vendor
// that owns the products. A cart spanning several vendors becomes one order per
// vendor, sharing a groupId. Stock is reserved for all lines atomically.

function cleanText(v, fallback, max = 200) {
  if (typeof v !== 'string' && typeof v !== 'number') return fallback;
  const s = String(v).trim().slice(0, max);
  return s || fallback;
}

function money(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

async function createMarketplaceOrders(body = {}, { note }) {
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (!rawItems.length) throw new HttpError(400, 'items[] required', 'ITEMS_REQUIRED');
  if (rawItems.length > 50) throw new HttpError(400, 'Too many items in one order', 'TOO_MANY_ITEMS');
  if (rawItems.some(it => !it || typeof it.productId !== 'string' || !it.productId)) {
    throw new HttpError(400, 'Every item needs a productId', 'PRODUCT_ID_REQUIRED');
  }

  const vendorCache = new Map();
  const groups = new Map(); // vendorId -> { storeId, items }
  for (const it of rawItems) {
    const prod = await getProduct(it.productId);
    if (!prod || prod.deleted) throw new HttpError(400, `Unknown product ${it.productId}`, 'UNKNOWN_PRODUCT');
    if (it.vendorId && it.vendorId !== prod.vendorId) {
      throw new HttpError(400, `Product ${it.productId} is not sold by vendor ${it.vendorId}`, 'VENDOR_MISMATCH');
    }
    if (!vendorCache.has(prod.vendorId)) vendorCache.set(prod.vendorId, await getVendor(prod.vendorId));
    // Stock is checked atomically during reservation; everything else must allow listing.
    const blockers = P.listingBlockers(prod, vendorCache.get(prod.vendorId)).filter(b => b !== 'out of stock');
    if (blockers.length) {
      throw new HttpError(409, `"${prod.name}" is not available (${blockers.join(', ')})`, 'PRODUCT_UNAVAILABLE', { productId: prod.productId });
    }
    const qty = Math.max(1, Math.floor(Number(it.qty ?? it.quantity ?? 1)) || 1);
    const price = Number(prod.sellingPrice ?? prod.price) || 0;
    const line = {
      productId: prod.productId,
      vendorId: prod.vendorId,
      storeId: prod.storeId,
      sku: prod.sku || '',
      name: prod.name,
      productName: prod.name,
      brand: prod.brand || '',
      packSize: prod.packSize || '',
      image: (prod.images && prod.images[0]) || null,
      qty,
      quantity: qty,
      price,
      lineTotal: Math.round(price * qty * 100) / 100,
    };
    if (!groups.has(prod.vendorId)) groups.set(prod.vendorId, { storeId: prod.storeId, items: [] });
    groups.get(prod.vendorId).items.push(line);
  }

  const requestedId = typeof body.orderId === 'string' && /^[A-Za-z0-9_-]{4,64}$/.test(body.orderId) ? body.orderId : null;
  const baseId = requestedId || ('ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase());
  const multi = groups.size > 1;
  const now = Date.now();
  const pricingIn = body.pricing && typeof body.pricing === 'object' ? body.pricing : {};
  const paymentIn = body.payment && typeof body.payment === 'object' ? body.payment : {};
  const shippingAddress = body.shippingAddress && typeof body.shippingAddress === 'object'
    ? body.shippingAddress
    : { fullAddress: cleanText(body.deliveryAddress, '', 500) };

  const orders = [...groups.entries()].map(([vendorId, g], i) => {
    const subtotal = Math.round(g.items.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
    const deliveryFee = i === 0 ? money(pricingIn.deliveryFee) : 0;
    const discount = i === 0 ? Math.min(money(pricingIn.discount), subtotal + deliveryFee) : 0;
    const grandTotal = Math.round((subtotal + deliveryFee - discount) * 100) / 100;
    return {
      orderId: multi ? `${baseId}-${i + 1}` : baseId,
      ...(multi ? { groupId: baseId } : {}),
      customerId:    cleanText(body.customerId, 'anon', 128),
      customerName:  cleanText(body.customerName, 'Customer', 120),
      customerPhone: cleanText(body.customerPhone, '', 20),
      shippingAddress,
      items: g.items,
      pricing: { subtotal, deliveryFee, discount, grandTotal, vendorEarnings: Math.round(subtotal * 0.88) },
      payment: {
        method: cleanText(paymentIn.method || body.paymentMethod, 'CASH ON DELIVERY', 60),
        status: cleanText(paymentIn.status || body.paymentStatus, 'PENDING', 30),
      },
      storeId: g.storeId,
      vendorId,
      status: 'PENDING',
      otp: /^\d{4}$/.test(String(body.deliveryOtp || '')) ? String(body.deliveryOtp) : String(crypto.randomInt(1000, 10000)),
      createdAt: now,
      updatedAt: now,
      timeline: [{ status: 'PENDING', timestamp: now, note }],
    };
  });

  await moveOrderStock({ kind: 'reserve', lines: orderLines(orders.flatMap(o => o.items)), newOrders: orders });
  const created = [];
  for (const o of orders) {
    const order = (await getOrderById(o.orderId)) || o;
    created.push(order);
    syncToFirebaseRTDB(`orders/${order.orderId}`, order);
    pushOrderToVendor(order);
    await notifyVendorOfOrder(order);
    logger.info(`✅ Order ${order.orderId} routed to vendor ${order.vendorId} (₹${order.pricing.grandTotal})`);
  }
  return created;
}

async function notifyVendorOfOrder(order) {
  const notif = {
    id:        uuidv4(),
    vendorId:  order.vendorId,
    type:      'NEW_ORDER',
    title:     '🛍️ New Order!',
    body:      `Order #${order.orderId} from ${order.customerName} — ₹${order.pricing.grandTotal}`,
    orderId:   order.orderId,
    read:      false,
    createdAt: Date.now(),
  };
  try {
    if (db) await db.collection('notifications').add(notif);
    else mockStore.notifications.unshift(notif);
  } catch (e) {
    logger.warn(`Notification write failed: ${e.message}`);
  }
  if (fcm) {
    try {
      const vendor = await getVendor(order.vendorId);
      if (vendor && vendor.fcmToken) {
        await fcm.send({
          token: vendor.fcmToken,
          notification: { title: '🛍️ New Order Incoming!', body: notif.body },
          data: { orderId: order.orderId, type: 'NEW_ORDER' },
        });
      }
    } catch (fcmErr) {
      logger.warn(`FCM push failed: ${fcmErr.message}`);
    }
  }
}

function orderErrorResponse(res, err) {
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ ok: false, error: err.code || 'BAD_REQUEST', message: err.message, details: err.extra || null });
  }
  return sendError(res, err);
}

// POST /api/orders
// { items: [{ productId, vendorId?, qty }], customerId?, customerName?, customerPhone?,
//   shippingAddress?, pricing?: { deliveryFee?, discount? }, payment?: { method, status } }
// → 201 { ok, order, orders, orderId }
app.post('/api/orders', async (req, res) => {
  try {
    const orders = await createMarketplaceOrders(req.body, { note: 'Order placed by customer' });
    res.status(201).json({ ok: true, orderId: orders[0].orderId, order: orders[0], orders });
  } catch (err) {
    orderErrorResponse(res, err);
  }
});

// Customer app bridge: same as POST /api/orders, also accepts orderId, deliveryAddress
// and paymentMethod. → 200 { ok, orderId, order, orders, message }
app.post('/api/orders/create', async (req, res) => {
  try {
    const orders = await createMarketplaceOrders(req.body, { note: 'Order placed by customer via shop' });
    res.status(200).json({ ok: true, orderId: orders[0].orderId, order: orders[0], orders, message: 'Order sent to vendor' });
  } catch (err) {
    orderErrorResponse(res, err);
  }
});

// ── Customer Payment Verification Bridge ──────────────────────────────────────
app.post('/api/payment/verify', (req, res) => {
  const { orderId, amount } = req.body;
  res.json({ ok: true, orderId, amount, status: 'SUCCESS', verifiedAt: Date.now() });
});

// ── Order lifecycle (vendor that owns the order, or admin) ───────────────────

async function acceptOrder(orderId, { vendorId = null, isAdmin = false } = {}) {
  try {
    const order = await getOrderById(orderId);
    if (!order) return { ok: false, status: 404, error: 'Order not found' };
    if (!isAdmin && order.vendorId !== vendorId) return { ok: false, status: 403, error: 'This order belongs to another vendor' };
    if (order.status !== 'PENDING') return { ok: false, status: 409, error: `Order is ${order.status}, not PENDING` };

    // Reserved stock becomes sold stock; the storefront doc is republished.
    await moveOrderStock({ kind: 'commit', lines: orderLines(order.items), orderId });
    const now = Date.now();
    const updated = await updateOrderStatus(orderId, 'ACCEPTED', {
      acceptedAt: now,
      acceptedBy: isAdmin ? 'admin' : vendorId,
      note: 'Accepted by vendor',
    });
    pushToVendor(order.vendorId, 'order:statusUpdated', { orderId, status: 'ACCEPTED', updatedAt: now });
    return { ok: true, order: updated };
  } catch (err) {
    logger.error(`Accept order ${orderId} failed: ${err.message}`);
    return { ok: false, status: err.status || 500, error: err.message };
  }
}

// Returns stock for an order that will not be fulfilled.
async function releaseOrderStock(order) {
  const lines = orderLines(order.items);
  if (order.stockState === 'RESERVED') await moveOrderStock({ kind: 'release', lines, orderId: order.orderId });
  else if (order.stockState === 'COMMITTED') await moveOrderStock({ kind: 'restock', lines, orderId: order.orderId });
}

async function loadOwnedOrder(req, res) {
  const order = await getOrderById(req.params.orderId);
  if (!order || !ownsRecord(req, order)) {
    res.status(404).json({ ok: false, error: 'Order not found' });
    return null;
  }
  return order;
}

const FINAL_STATUSES = ['DELIVERED', 'CANCELLED', 'REJECTED', 'VENDOR_TIMEOUT'];

app.patch('/api/orders/:orderId/accept', requireVendorOrAdmin, async (req, res) => {
  const result = await acceptOrder(req.params.orderId, { vendorId: req.vendor && req.vendor.vendorId, isAdmin: req.isAdmin });
  if (!result.ok) return res.status(result.status).json({ ok: false, error: result.error });
  res.json({ ok: true, order: result.order, message: `Order ${req.params.orderId} accepted` });
});

app.patch('/api/orders/:orderId/prepare', requireVendorOrAdmin, async (req, res) => {
  try {
    if (!(await loadOwnedOrder(req, res))) return;
    const { orderId } = req.params;
    const now = Date.now();
    const order = await updateOrderStatus(orderId, 'PREPARING', { preparingAt: now });
    pushToVendor(order.vendorId, 'order:statusUpdated', { orderId, status: 'PREPARING', updatedAt: now });
    res.json({ ok: true, order });
  } catch (err) {
    sendError(res, err);
  }
});

app.patch('/api/orders/:orderId/ready', requireVendorOrAdmin, async (req, res) => {
  try {
    if (!(await loadOwnedOrder(req, res))) return;
    const { orderId } = req.params;
    const { pickupBay } = req.body;
    const now = Date.now();
    const order = await updateOrderStatus(orderId, 'READY_FOR_PICKUP', {
      readyAt: now,
      pickupBay: cleanText(pickupBay, 'Bay-01', 20),
    });
    pushToVendor(order.vendorId, 'order:statusUpdated', { orderId, status: 'READY_FOR_PICKUP', updatedAt: now });
    res.json({ ok: true, order });
  } catch (err) {
    sendError(res, err);
  }
});

app.patch('/api/orders/:orderId/pack', requireVendorOrAdmin, async (req, res) => {
  try {
    if (!(await loadOwnedOrder(req, res))) return;
    const { orderId }  = req.params;
    const { pickupBay } = req.body;
    const now = Date.now();
    const order = await updateOrderStatus(orderId, 'PACKED', {
      packedAt:  now,
      pickupBay: cleanText(pickupBay, 'Bay-01', 20),
    });
    pushToVendor(order.vendorId, 'order:statusUpdated', { orderId, status: 'PACKED', pickupBay: order.pickupBay, updatedAt: now });
    res.json({ ok: true, order });
  } catch (err) {
    sendError(res, err);
  }
});

app.patch('/api/orders/:orderId/handover', requireVendorOrAdmin, async (req, res) => {
  try {
    if (!(await loadOwnedOrder(req, res))) return;
    const { orderId } = req.params;
    const { riderId, riderName, riderPhone } = req.body;
    const now = Date.now();
    const order = await updateOrderStatus(orderId, 'DISPATCHED', {
      dispatchedAt: now,
      rider: { riderId: cleanText(riderId, '', 60), riderName: cleanText(riderName, '', 120), riderPhone: cleanText(riderPhone, '', 20) },
    });
    pushToVendor(order.vendorId, 'order:statusUpdated', { orderId, status: 'DISPATCHED', updatedAt: now });
    res.json({ ok: true, order });
  } catch (err) {
    sendError(res, err);
  }
});

app.patch('/api/orders/:orderId/dispatch', requireVendorOrAdmin, async (req, res) => {
  try {
    if (!(await loadOwnedOrder(req, res))) return;
    const { orderId } = req.params;
    const { riderId, riderName, riderPhone } = req.body;
    const now = Date.now();
    const order = await updateOrderStatus(orderId, 'DISPATCHED', {
      dispatchedAt: now,
      rider: { riderId: cleanText(riderId, '', 60), riderName: cleanText(riderName, '', 120), riderPhone: cleanText(riderPhone, '', 20) },
    });
    res.json({ ok: true, order });
  } catch (err) {
    sendError(res, err);
  }
});

app.patch('/api/orders/:orderId/deliver', requireVendorOrAdmin, async (req, res) => {
  try {
    const order = await loadOwnedOrder(req, res);
    if (!order) return;
    const { orderId } = req.params;
    const { otp }     = req.body;
    const now         = Date.now();

    if (order.otp && otp && order.otp !== String(otp)) {
      return res.status(400).json({ ok: false, error: 'Invalid OTP' });
    }

    const updated = await updateOrderStatus(orderId, 'DELIVERED', {
      deliveredAt: now,
      otpVerified: true,
    });

    // Update earnings
    const earnings = order.pricing?.vendorEarnings || Math.round((order.pricing?.subtotal || order.pricing?.grandTotal || 0) * 0.88);
    if (db) {
      const inc = admin.firestore.FieldValue.increment;
      await db.collection('earnings').doc(order.vendorId).set({
        today: { orders: inc(1), revenue: inc(order.pricing?.grandTotal || 0), earnings: inc(earnings) },
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
    sendError(res, err);
  }
});

app.patch('/api/orders/:orderId/cancel', requireVendorOrAdmin, async (req, res) => {
  try {
    const existing = await loadOwnedOrder(req, res);
    if (!existing) return;
    if (FINAL_STATUSES.includes(existing.status)) {
      return res.status(409).json({ ok: false, error: `Order is already ${existing.status}` });
    }
    const { orderId } = req.params;
    const now = Date.now();
    await releaseOrderStock(existing);
    const order = await updateOrderStatus(orderId, 'CANCELLED', {
      cancelledAt: now,
      cancellationReason: cleanText(req.body.reason, 'Cancelled by vendor', 300),
    });
    pushToVendor(order.vendorId, 'order:statusUpdated', { orderId, status: 'CANCELLED', updatedAt: now });
    res.json({ ok: true, order });
  } catch (err) {
    sendError(res, err);
  }
});

app.patch('/api/orders/:orderId/reject', requireVendorOrAdmin, async (req, res) => {
  try {
    const existing = await loadOwnedOrder(req, res);
    if (!existing) return;
    if (existing.status !== 'PENDING') {
      return res.status(409).json({ ok: false, error: `Order is ${existing.status}, not PENDING` });
    }
    const { orderId } = req.params;
    const reason = cleanText(req.body.reason, 'Item unavailable', 300);
    const now = Date.now();
    await releaseOrderStock(existing);
    const order = await updateOrderStatus(orderId, 'REJECTED', {
      rejectedAt: now,
      rejectionReason: reason,
      rejectedBy: req.isAdmin ? 'admin' : req.vendor.vendorId,
    });
    pushToVendor(order.vendorId, 'order:rejected', { orderId, status: 'REJECTED', reason, updatedAt: now });
    res.json({ ok: true, order, message: `Order ${orderId} rejected: ${reason}` });
  } catch (err) {
    sendError(res, err);
  }
});

app.patch('/api/orders/:orderId/timeout', requireVendorOrAdmin, async (req, res) => {
  try {
    const existing = await loadOwnedOrder(req, res);
    if (!existing) return;
    if (existing.status !== 'PENDING') {
      return res.status(409).json({ ok: false, error: `Order is ${existing.status}, not PENDING` });
    }
    const { orderId } = req.params;
    const now = Date.now();
    await releaseOrderStock(existing);
    const order = await updateOrderStatus(orderId, 'VENDOR_TIMEOUT', { timedOutAt: now });
    pushToVendor(order.vendorId, 'order:statusUpdated', { orderId, status: 'VENDOR_TIMEOUT', updatedAt: now });
    res.json({ ok: true, order });
  } catch (err) {
    sendError(res, err);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── INVENTORY ENDPOINTS ───────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

// Write routes take vendorId/storeId from the session token, never from the body.
// Each change re-evaluates the product's storefront listing (see syncStorefront).

// GET /api/inventory → { ok, items: [product + listing{live, blockers}], count }
// Vendor: own products. Admin: optional ?storeId= / ?vendorId=.
app.get('/api/inventory', requireVendorOrAdmin, async (req, res) => {
  try {
    const filter = req.isAdmin && !(req.vendor && req.vendor.vendorId)
      ? { storeId: req.query.storeId, vendorId: req.query.vendorId }
      : { vendorId: req.vendor.vendorId };
    const products = (await listProducts(filter)).filter(p => !p.deleted);
    const vendors = new Map();
    for (const p of products) {
      if (!vendors.has(p.vendorId)) vendors.set(p.vendorId, await getVendor(p.vendorId));
    }
    const items = products
      .map(p => withListing(p, vendors.get(p.vendorId)))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json({ ok: true, items, count: items.length });
  } catch (err) {
    sendError(res, err);
  }
});

async function findVendorSku(vendorId, sku, exceptProductId = null) {
  if (!sku) return null;
  const products = await listProducts({ vendorId });
  return products.find(p => !p.deleted && p.sku === sku && p.productId !== exceptProductId) || null;
}

function newProductId() {
  return 'SKU-' + uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase();
}

// POST /api/inventory → 201 { ok, item }   (approvalStatus PENDING)
// Body: name, brand, category, shopCategory (required when category is Skincare), description,
// images[], packSize, keyActives[], sku, mrp, sellingPrice, stock, lowStockThreshold, bin, gstPercent, status
app.post('/api/inventory', requireVendor, async (req, res) => {
  try {
    const { vendorId, storeId } = req.vendor;
    const productId = newProductId();
    const product = P.buildNewProduct(req.body || {}, {
      productId,
      vendorId,
      storeId,
      initialStock: (req.body && (req.body.stockOnHand ?? req.body.stock)) || 0,
    });
    if (await findVendorSku(vendorId, product.sku)) {
      return res.status(409).json({ ok: false, error: `SKU ${product.sku} already exists in your catalog`, code: 'DUPLICATE_SKU' });
    }
    await createProduct(product);
    const listing = await syncStorefront(productId);
    io.to(`vendor:${vendorId}`).emit('inventory:created', { item: product });
    res.status(201).json({ ok: true, item: { ...product, listing } });
  } catch (err) {
    sendError(res, err);
  }
});

async function loadOwnedProduct(req, res) {
  const product = await getProduct(req.params.productId);
  if (!product || product.deleted || !ownsRecord(req, product)) {
    res.status(404).json({ ok: false, error: 'Product not found' });
    return null;
  }
  return product;
}

/** Stock adjustment by delta or to an exact quantity, atomically, with history. */
async function adjustProductStock(productId, { delta, exactQuantity, reason }) {
  const now = Date.now();
  const exact = exactQuantity !== undefined && exactQuantity !== null && exactQuantity !== '';
  const compute = (cur) => {
    let onHand = cur.stockOnHand ?? cur.stock ?? 0;
    let actual;
    if (exact) {
      const target = Math.floor(Number(exactQuantity));
      if (!Number.isFinite(target) || target < 0) throw new HttpError(400, 'exactQuantity must be a number ≥ 0');
      actual = target - onHand;
      onHand = target;
    } else {
      const d = Math.trunc(Number(delta));
      if (delta === undefined || delta === null || !Number.isFinite(d)) throw new HttpError(400, 'delta or exactQuantity required');
      actual = Math.max(-onHand, d);
      onHand += actual;
    }
    const fields = { ...P.stockFields(onHand, cur.reservedStock), updatedAt: now };
    const entry = {
      type: exact ? 'SET_EXACT' : (actual >= 0 ? 'RESTOCK' : 'DEDUCTION'),
      delta: actual,
      stockOnHand: fields.stockOnHand,
      availableStock: fields.availableStock,
      reason: cleanText(reason, 'Manual stock adjustment', 200),
      timestamp: now,
    };
    return { fields, entry, actual };
  };

  let result;
  if (db) {
    await db.runTransaction(async (tx) => {
      const ref = db.collection('inventory').doc(productId);
      const snap = await tx.get(ref);
      if (!snap.exists) throw new HttpError(404, 'Product not found');
      result = compute(snap.data());
      tx.update(ref, { ...result.fields, stockHistory: admin.firestore.FieldValue.arrayUnion(result.entry) });
    });
  } else {
    const p = mockStore.inventory.find(i => i.productId === productId);
    if (!p) throw new HttpError(404, 'Product not found');
    result = compute(p);
    Object.assign(p, result.fields);
    p.stockHistory = [result.entry, ...(p.stockHistory || [])].slice(0, 100);
  }

  const listing = await syncStorefront(productId);
  const item = await getProduct(productId);
  io.to(`vendor:${item.vendorId}`).emit('inventory:stockUpdated', {
    productId,
    stockOnHand: item.stockOnHand,
    availableStock: item.availableStock,
    delta: result.actual,
    reason: result.entry.reason,
  });
  return { item: { ...item, listing }, delta: result.actual };
}

// PATCH /api/inventory/:productId → { ok, item, reapprovalRequired }
// Editing name, brand, category, shopCategory, description, images, packSize or keyActives
// sends an approved/rejected product back to PENDING. Price and stock edits do not.
app.patch('/api/inventory/:productId', requireVendorOrAdmin, async (req, res) => {
  try {
    const existing = await loadOwnedProduct(req, res);
    if (!existing) return;
    const { productId } = req.params;
    const body = req.body || {};
    const { changes } = P.applyProductUpdate(existing, body);
    if (changes.sku && await findVendorSku(existing.vendorId, changes.sku, productId)) {
      return res.status(409).json({ ok: false, error: `SKU ${changes.sku} already exists in your catalog`, code: 'DUPLICATE_SKU' });
    }
    if (Object.keys(changes).length) await saveProductChanges(productId, changes);

    const stockTarget = body.stockOnHand ?? body.stock;
    let item;
    if (stockTarget !== undefined && Number(stockTarget) !== (existing.stockOnHand ?? existing.stock)) {
      ({ item } = await adjustProductStock(productId, { exactQuantity: stockTarget, reason: 'Edited in product form' }));
    } else {
      const listing = await syncStorefront(productId);
      item = { ...(await getProduct(productId)), listing };
    }
    io.to(`vendor:${existing.vendorId}`).emit('inventory:updated', { productId, ...changes });
    res.json({ ok: true, item, reapprovalRequired: changes.approvalStatus === 'PENDING' });
  } catch (err) {
    sendError(res, err);
  }
});

// PATCH /api/inventory/:productId/stock  { delta } | { exactQuantity }, reason? → { ok, item, delta }
app.patch('/api/inventory/:productId/stock', requireVendorOrAdmin, async (req, res) => {
  try {
    const existing = await loadOwnedProduct(req, res);
    if (!existing) return;
    const { delta, exactQuantity, reason } = req.body || {};
    const result = await adjustProductStock(req.params.productId, { delta, exactQuantity, reason });
    res.json({ ok: true, ...result });
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE /api/inventory/:productId → soft delete; the storefront doc is set to active:false.
app.delete('/api/inventory/:productId', requireVendorOrAdmin, async (req, res) => {
  try {
    const existing = await loadOwnedProduct(req, res);
    if (!existing) return;
    const { productId } = req.params;
    const now = Date.now();
    const item = await saveProductChanges(productId, {
      deleted: true, status: 'deleted', active: false, isAvailable: false, deletedAt: now, updatedAt: now,
    });
    await syncStorefront(productId);
    io.to(`vendor:${existing.vendorId}`).emit('inventory:updated', { productId, deleted: true });
    res.json({ ok: true, message: `Product ${productId} deleted`, item });
  } catch (err) {
    sendError(res, err);
  }
});

// Minimal CSV parser (supports quoted fields with commas and "" escapes).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field.trim()); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field.trim()); field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function csvToItems(csvText) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.toLowerCase());
  const col = (pred) => headers.findIndex(pred);
  const idx = {
    name: col(h => h === 'name' || h.includes('product name') || h === 'product' || h === 'title'),
    brand: col(h => h.includes('brand')),
    shopCategory: col(h => h.includes('shop')),
    category: col(h => h.includes('cat') && !h.includes('shop')),
    mrp: col(h => h.includes('mrp')),
    sellingPrice: col(h => h.includes('selling') || h === 'price' || h.includes('sale')),
    stock: col(h => h.includes('stock') || h.includes('qty') || h.includes('quantity')),
    sku: col(h => h.includes('sku') || h.includes('code')),
    packSize: col(h => h.includes('pack') || h.includes('size') || h.includes('volume')),
    description: col(h => h.includes('desc')),
    images: col(h => h.includes('image')),
    keyActives: col(h => h.includes('active') && h.includes('key')),
  };
  return rows.slice(1).map(cols => {
    const item = {};
    for (const [k, i] of Object.entries(idx)) {
      if (i >= 0 && cols[i] !== undefined && cols[i] !== '') item[k] = cols[i];
    }
    if (idx.name < 0 && cols[0]) item.name = cols[0];
    if (item.images) item.images = item.images.split(/[|\s]+/).filter(Boolean);
    if (item.keyActives) item.keyActives = item.keyActives.split('|');
    return item;
  });
}

// POST /api/inventory/bulk-upload  { items: [...] } | { csvText }
// → { ok, count, created, updated, items, errors: [{ row, error }] }
// New rows become PENDING products with the same fields as POST /api/inventory. A row
// whose sku matches an existing product of this vendor updates it (same rules as PATCH).
app.post('/api/inventory/bulk-upload', requireVendor, async (req, res) => {
  try {
    const { vendorId, storeId } = req.vendor;
    const { items, csvText } = req.body || {};
    let rows = [];
    if (Array.isArray(items) && items.length > 0) rows = items;
    else if (typeof csvText === 'string' && csvText.trim()) rows = csvToItems(csvText);
    if (!rows.length) return res.status(400).json({ ok: false, error: 'No valid products provided for bulk upload' });
    if (rows.length > 500) return res.status(400).json({ ok: false, error: 'At most 500 products per upload' });

    const results = [];
    const errors = [];
    let created = 0;
    let updated = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || {};
      try {
        const input = { ...row };
        if (input.sellingPrice === undefined && input.price === undefined && input.mrp !== undefined) input.sellingPrice = input.mrp;
        const stock = input.stockOnHand ?? input.stock;
        const existing = input.sku ? await findVendorSku(vendorId, String(input.sku).trim()) : null;
        if (existing) {
          const { changes } = P.applyProductUpdate(existing, input);
          if (Object.keys(changes).length) await saveProductChanges(existing.productId, changes);
          if (stock !== undefined && Number(stock) !== existing.stockOnHand) {
            await adjustProductStock(existing.productId, { exactQuantity: stock, reason: 'Bulk upload' });
          } else {
            await syncStorefront(existing.productId);
          }
          results.push(await getProduct(existing.productId));
          updated++;
        } else {
          const product = P.buildNewProduct(input, { productId: newProductId(), vendorId, storeId, initialStock: stock || 0 });
          await createProduct(product);
          await syncStorefront(product.productId);
          results.push(product);
          created++;
        }
      } catch (e) {
        if (!e.status || e.status >= 500) throw e;
        errors.push({ row: i + 1, error: e.message });
      }
    }

    io.to(`vendor:${vendorId}`).emit('inventory:bulk_updated', { storeId, count: results.length, timestamp: Date.now() });
    logger.info(`📦 Bulk upload for ${vendorId}: ${created} created, ${updated} updated, ${errors.length} rejected`);
    return res.status(results.length ? 200 : 400).json({
      ok: results.length > 0,
      message: `${created} created, ${updated} updated, ${errors.length} rejected`,
      count: results.length,
      created,
      updated,
      items: results,
      errors,
    });
  } catch (err) {
    logger.error(`Bulk upload failed: ${err.message}`);
    return sendError(res, err);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── IMAGE UPLOADS ────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
// POST /api/uploads/image (multipart/form-data, field "file"; JPEG, PNG or WebP, ≤ 5 MB)
// → 201 { ok, url, path, contentType, size }
// Real mode: stored in Firebase Storage under vendor-uploads/{vendorId}/ and returned as a
// Firebase download URL. MOCK mode: kept in memory and served from GET /uploads/:id.

const multer = require('multer');

const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MOCK_UPLOAD_LIMIT = 300;

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_TYPES[file.mimetype]) return cb(null, true);
    return cb(new HttpError(415, 'Only JPEG, PNG or WebP images are allowed', 'UNSUPPORTED_TYPE'));
  },
});

// The declared type comes from the client, so check the file's magic bytes too.
function sniffImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

function publicBaseUrl(req) {
  return (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

app.post('/api/uploads/image', requireVendor, (req, res) => {
  imageUpload.single('file')(req, res, async (err) => {
    try {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ ok: false, error: 'Image must be 5 MB or smaller', code: 'FILE_TOO_LARGE' });
        if (err.status) return res.status(err.status).json({ ok: false, error: err.message, code: err.code });
        return res.status(400).json({ ok: false, error: err.message, code: 'UPLOAD_FAILED' });
      }
      if (!req.file) return res.status(400).json({ ok: false, error: 'Attach the image as multipart field "file"', code: 'FILE_REQUIRED' });
      const contentType = sniffImageType(req.file.buffer);
      if (!contentType) return res.status(415).json({ ok: false, error: 'The file is not a valid JPEG, PNG or WebP image', code: 'UNSUPPORTED_TYPE' });

      const { vendorId } = req.vendor;
      const fileName = `${uuidv4()}.${IMAGE_TYPES[contentType]}`;
      let url;
      let objectPath;
      if (firebaseInitialized) {
        const bucket = admin.storage().bucket();
        objectPath = `vendor-uploads/${vendorId}/${fileName}`;
        const downloadToken = uuidv4();
        await bucket.file(objectPath).save(req.file.buffer, {
          resumable: false,
          contentType,
          metadata: {
            contentType,
            cacheControl: 'public, max-age=31536000',
            metadata: { firebaseStorageDownloadTokens: downloadToken, vendorId },
          },
        });
        url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;
      } else {
        objectPath = `uploads/${fileName}`;
        mockStore.uploads.set(fileName, { buffer: req.file.buffer, contentType, vendorId });
        while (mockStore.uploads.size > MOCK_UPLOAD_LIMIT) {
          mockStore.uploads.delete(mockStore.uploads.keys().next().value);
        }
        url = `${publicBaseUrl(req)}/uploads/${fileName}`;
      }
      return res.status(201).json({ ok: true, url, path: objectPath, contentType, size: req.file.size });
    } catch (e) {
      return sendError(res, e);
    }
  });
});

// MOCK mode image serving.
app.get('/uploads/:fileName', (req, res) => {
  const f = mockStore.uploads.get(req.params.fileName);
  if (!f) return res.status(404).json({ ok: false, error: 'Not found' });
  res.set('Content-Type', f.contentType);
  res.set('Cache-Control', 'public, max-age=86400');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  return res.send(f.buffer);
});

// ════════════════════════════════════════════════════════════════════════════
// ── STOREFRONT (read-only, public) ───────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
// GET /api/storefront/products?category=Serums&vendorId=  → { ok, products, count, source }
// GET /api/storefront/products/:productId                 → { ok, product }
// Only active documents. Real mode reads Firestore products; MOCK mode reads the mock copy.

async function readStorefront() {
  if (db) {
    const snap = await db.collection('products').where('active', '==', true).limit(1000).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return [...mockStore.storefront.values()].filter(p => p.active).map(p => ({ ...p }));
}

app.get('/api/storefront/products', async (req, res) => {
  try {
    let products = await readStorefront();
    if (req.query.category) products = products.filter(p => p.category === req.query.category);
    if (req.query.vendorId) products = products.filter(p => p.vendorId === req.query.vendorId);
    products.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, products, count: products.length, source: db ? 'firestore' : 'mock' });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/storefront/products/:productId', async (req, res) => {
  try {
    let product = null;
    if (db) {
      const d = await db.collection('products').doc(req.params.productId).get();
      product = d.exists ? { id: d.id, ...d.data() } : null;
    } else {
      product = mockStore.storefront.get(req.params.productId) || null;
    }
    if (!product || !product.active) return res.status(404).json({ ok: false, error: 'Product not found' });
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, product });
  } catch (err) {
    sendError(res, err);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ── ADMIN: vendor KYC and product approval (header x-admin-key) ──────────────
// ════════════════════════════════════════════════════════════════════════════

function statusParam(v, allowed) {
  if (v === undefined || v === '') return undefined;
  const s = String(v).toUpperCase();
  if (!allowed.includes(s)) throw new HttpError(400, `Status must be one of ${allowed.join(', ')}`);
  return s;
}

function requireReason(body) {
  const reason = cleanText(body && body.reason, '', 500);
  if (!reason) throw new HttpError(400, 'A reason is required', 'REASON_REQUIRED');
  return reason;
}

// GET /api/admin/vendors?kycStatus=PENDING → { ok, vendors, count }
app.get('/api/admin/vendors', requireAdmin, async (req, res) => {
  try {
    const kycStatus = statusParam(req.query.kycStatus, P.APPROVAL_STATUSES);
    const vendors = (await listVendors({ kycStatus })).sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
    res.json({ ok: true, vendors, count: vendors.length });
  } catch (err) {
    sendError(res, err);
  }
});

async function setVendorKyc(req, res, kycStatus) {
  try {
    const { vendorId } = req.params;
    if (!(await getVendor(vendorId))) return res.status(404).json({ ok: false, error: 'Vendor not found' });
    const now = Date.now();
    const reason = kycStatus === 'REJECTED' ? requireReason(req.body) : null;
    const vendor = await saveVendor(vendorId, {
      kycStatus,
      kycRejectionReason: reason,
      kycReviewedAt: now,
      updatedAt: now,
    });
    const storefront = await syncVendorStorefront(vendorId);
    pushToVendor(vendorId, 'vendor:kycUpdated', { vendorId, kycStatus, reason });
    logger.info(`🛂 Vendor ${vendorId} ${kycStatus} (${storefront.live}/${storefront.products} products live)`);
    return res.json({ ok: true, vendor, storefront });
  } catch (err) {
    return sendError(res, err);
  }
}

// POST /api/admin/vendors/:vendorId/approve            → { ok, vendor, storefront: { products, live } }
// POST /api/admin/vendors/:vendorId/reject { reason }  → same
app.post('/api/admin/vendors/:vendorId/approve', requireAdmin, (req, res) => setVendorKyc(req, res, 'APPROVED'));
app.post('/api/admin/vendors/:vendorId/reject', requireAdmin, (req, res) => setVendorKyc(req, res, 'REJECTED'));

// GET /api/admin/products?approvalStatus=PENDING&vendorId= → { ok, products, count }
app.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const approvalStatus = statusParam(req.query.approvalStatus, P.APPROVAL_STATUSES);
    const products = (await listProducts({ approvalStatus, vendorId: req.query.vendorId }))
      .filter(p => !p.deleted)
      .sort((a, b) => (a.submittedAt || a.createdAt || 0) - (b.submittedAt || b.createdAt || 0));
    const vendors = new Map();
    for (const p of products) {
      if (!vendors.has(p.vendorId)) vendors.set(p.vendorId, await getVendor(p.vendorId));
    }
    const items = products.map(p => {
      const v = vendors.get(p.vendorId);
      const { stockHistory, ...rest } = p;
      return { ...withListing(rest, v), vendor: v ? { vendorId: v.vendorId, shopName: v.shopName, kycStatus: v.kycStatus } : null };
    });
    res.json({ ok: true, products: items, count: items.length });
  } catch (err) {
    sendError(res, err);
  }
});

async function setProductApproval(req, res, approvalStatus) {
  try {
    const { productId } = req.params;
    const existing = await getProduct(productId);
    if (!existing || existing.deleted) return res.status(404).json({ ok: false, error: 'Product not found' });
    const now = Date.now();
    const reason = approvalStatus === 'REJECTED' ? requireReason(req.body) : null;
    await saveProductChanges(productId, {
      approvalStatus,
      rejectionReason: reason,
      approvedAt: approvalStatus === 'APPROVED' ? now : null,
      reviewedAt: now,
      updatedAt: now,
    });
    const listing = await syncStorefront(productId);
    const product = await getProduct(productId);
    pushToVendor(product.vendorId, 'inventory:approvalUpdated', { productId, approvalStatus, rejectionReason: reason });
    logger.info(`🧾 Product ${productId} ${approvalStatus}${listing.live ? ' (live on shop)' : ''}`);
    return res.json({ ok: true, product: { ...product, listing } });
  } catch (err) {
    return sendError(res, err);
  }
}

// POST /api/admin/products/:productId/approve            → { ok, product: { ..., listing: { live, blockers } } }
// POST /api/admin/products/:productId/reject { reason }  → same
app.post('/api/admin/products/:productId/approve', requireAdmin, (req, res) => setProductApproval(req, res, 'APPROVED'));
app.post('/api/admin/products/:productId/reject', requireAdmin, (req, res) => setProductApproval(req, res, 'REJECTED'));

// ════════════════════════════════════════════════════════════════════════════
// ── EARNINGS ENDPOINTS ────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/earnings/:vendorId', requireSelfOrAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const earnings = await getEarnings(vendorId);
    res.json({ ok: true, vendorId, earnings });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/earnings/:vendorId/history', requireSelfOrAdmin, async (req, res) => {
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

app.get('/api/notifications/:vendorId', requireSelfOrAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const notifications = await getNotifications(vendorId);
    res.json({ ok: true, notifications, count: notifications.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/notifications/:notificationId/read', requireVendorOrAdmin, async (req, res) => {
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

app.post('/api/notifications/broadcast', requireAdmin, async (req, res) => {
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

app.get('/api/analytics/:storeId', requireVendorOrAdmin, async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!req.isAdmin && req.vendor.storeId !== storeId) {
      return res.status(403).json({ ok: false, error: 'Not allowed for this store' });
    }
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
      vendorId:     (req.vendor && req.vendor.vendorId) || vendorId || null,
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

// Test and simulation routes are development-only (they bypass ownership and mutate stock).
app.use('/api/test', (req, res, next) => {
  if (IS_PROD) return res.status(404).json({ ok: false, error: 'Endpoint not found' });
  return next();
});

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
    pushOrderToVendor(newOrder);

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
      const reserve = await moveOrderStock({ kind: 'reserve', lines: orderLines(items) }).catch(e => ({ ok: false, error: e.message }));
      if (!reserve.ok) {
        return { ok: false, status: 409, error: 'OUT_OF_STOCK', customer: 'Customer A (Ananya)', message: `Item "${prod.name}" already reserved by another customer.` };
      }
      const orderId = 'ORD-A-' + Math.floor(100000 + Math.random() * 900000);
      return { ok: true, status: 201, orderId, customer: 'Customer A (Ananya)', reservedQty: 1 };
    })();

    const orderPromise2 = (async () => {
      const items = [{ productId: prod.productId, name: prod.name, price: prod.price, quantity: 1 }];
      const reserve = await moveOrderStock({ kind: 'reserve', lines: orderLines(items) }).catch(e => ({ ok: false, error: e.message }));
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
// POST /api/onboarding/submit   (Authorization: Bearer <token from /api/auth/vendor/login>)
// Body: ownerName, shopName, email, shopType, city, locality, address, pincode (or pinCode),
//   openTime, closeTime, latitude, longitude, gstin, pan, cosmeticLicense, licenseExpiry,
//   tradeLicense, beneficiaryName, bankName, maskedAccountNumber, ifsc, upiVpa,
//   categories (or selectedCats), seedSkus
// → { ok, vendorId, storeId, kycStatus: 'PENDING', token, vendor }
// The phone comes from the verified session. kycStatus stays PENDING until an admin
// approves the vendor; the returned token carries the new vendorId/storeId.
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

app.post('/api/onboarding/submit', requirePhoneSession, async (req, res) => {
  try {
    const b = req.body || {};
    const t = (v, max = 200) => cleanText(v, '', max);
    const phone = req.vendor.phone;

    let existing = req.vendor.vendorId ? await getVendor(req.vendor.vendorId) : null;
    if (!existing) existing = await findVendorByPhone(phone);
    if (existing && existing.kycStatus === 'APPROVED') {
      return res.status(409).json({ ok: false, error: 'This store is already approved. Edit details from your profile.', code: 'ALREADY_APPROVED' });
    }

    const ownerName = t(b.ownerName, 120);
    const shopName = t(b.shopName || b.storeName, 160);
    if (!ownerName || !shopName) {
      return res.status(400).json({ ok: false, error: 'ownerName and shopName are required', code: 'MISSING_FIELDS' });
    }
    const gstin = t(b.gstin, 15).toUpperCase();
    const pan = t(b.pan, 10).toUpperCase();
    if (gstin && !GSTIN_RE.test(gstin)) return res.status(400).json({ ok: false, error: 'GSTIN format is invalid', code: 'INVALID_GSTIN' });
    if (pan && !PAN_RE.test(pan)) return res.status(400).json({ ok: false, error: 'PAN format is invalid', code: 'INVALID_PAN' });

    const city = t(b.city, 80);
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const vendorId = existing ? existing.vendorId : `VND-${suffix}`;
    const storeId = existing && existing.storeId
      ? existing.storeId
      : `DS-${(city.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'GV')}-${suffix}`;
    const categories = (Array.isArray(b.categories) ? b.categories : Array.isArray(b.selectedCats) ? b.selectedCats : [])
      .map(c => t(c, 60)).filter(Boolean).slice(0, 20);
    const lat = Number(b.latitude);
    const lng = Number(b.longitude);
    const now = Date.now();

    const vendorRecord = {
      vendorId,
      storeId,
      phone,
      name:            ownerName,
      shopName,
      email:           t(b.email, 160),
      shopType:        t(b.shopType, 80) || 'Retailer',
      city,
      locality:        t(b.locality, 160),
      address:         t(b.address, 400),
      pinCode:         t(b.pinCode ?? b.pincode, 10),
      latitude:        Number.isFinite(lat) ? lat : null,
      longitude:       Number.isFinite(lng) ? lng : null,
      openTime:        t(b.openTime, 20),
      closeTime:       t(b.closeTime, 20),
      gstin,
      pan,
      cosmeticLicense: t(b.cosmeticLicense, 80),
      licenseExpiry:   t(b.licenseExpiry, 20),
      tradeLicense:    t(b.tradeLicense, 80),
      // Only the masked account number is accepted; the full number never reaches this API.
      bankDetails: {
        bankName:         t(b.bankName, 120),
        holderName:       t(b.beneficiaryName, 120),
        accNumberMasked:  t(b.maskedAccountNumber, 24),
        ifsc:             t(b.ifsc, 11).toUpperCase(),
        upiId:            t(b.upiVpa, 120),
      },
      categories,
      seedSkus:        Array.isArray(b.seedSkus) ? b.seedSkus.slice(0, 100) : [],
      kycStatus:       'PENDING',
      kycRejectionReason: null,
      kycSubmittedAt:  now,
      isOnline:        existing ? !!existing.isOnline : false,
      joinedAt:        (existing && existing.joinedAt) || now,
      updatedAt:       now,
    };

    const vendor = await saveVendor(vendorId, vendorRecord);
    if (existing) await syncVendorStorefront(vendorId); // a resubmission puts KYC back to PENDING

    const token = signVendorToken({ vendorId, storeId, phone }, SECURITY.vendorTokenSecret);
    logger.info(`✨ Vendor onboarding submitted: ${shopName} (${vendorId}), KYC PENDING`);

    return res.status(200).json({
      ok: true,
      message: 'Onboarding submitted. Your store is under review.',
      vendorId,
      storeId,
      kycStatus: 'PENDING',
      token,
      vendor,
    });
  } catch (err) {
    return sendError(res, err);
  }
});

// ── Admin Panel APIs ───────────────────────────────────────────────────────────
app.get('/api/admin/overview', requireAdmin, async (_req, res) => {
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

app.get('/api/admin/vendor/:vendorId', requireAdmin, async (req, res) => {
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
  if (err.type === 'entity.parse.failed') return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ ok: false, error: 'Request body too large' });
  logger.error(`Unhandled: ${err.message}`);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

// MOCK mode: publish the pre-approved seed products to the mock storefront.
if (!db) {
  Promise.all(mockStore.inventory.map(p => syncStorefront(p.productId)))
    .then(r => logger.info(`🛍️  Mock storefront: ${r.filter(x => x.live).length} seed products listed`));
}

// ── Start Server ──────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`🚀 GlowVAI Vendor Backend running on http://localhost:${PORT}`);
  logger.info(`📡 WebSocket (Socket.IO) ready`);
  logger.info(`🔥 Firebase: ${firebaseInitialized ? 'Connected' : 'MOCK mode'}`);
  logger.info('');
  logger.info(`🌐 CORS origins: ${CORS.allowed.join(', ')}${IS_PROD ? '' : ' (+ any localhost in development)'}`);
  logger.info('═══ Marketplace endpoints ═════════════════════════════');
  logger.info('  POST   /api/auth/vendor/login            (public)');
  logger.info('  POST   /api/onboarding/submit            (phone session)');
  logger.info('  GET    /api/vendor/me                    (vendor)');
  logger.info('  GET    /api/inventory                    (vendor | admin)');
  logger.info('  POST   /api/inventory                    (vendor)');
  logger.info('  PATCH  /api/inventory/:productId         (vendor | admin)');
  logger.info('  PATCH  /api/inventory/:productId/stock   (vendor | admin)');
  logger.info('  DELETE /api/inventory/:productId         (vendor | admin)');
  logger.info('  POST   /api/inventory/bulk-upload        (vendor)');
  logger.info('  POST   /api/uploads/image                (vendor, multipart "file")');
  logger.info('  POST   /api/orders | /api/orders/create  (public, items need productId)');
  logger.info('  PATCH  /api/orders/:orderId/<action>     (vendor | admin)');
  logger.info('  GET    /api/storefront/products[/:id]    (public)');
  logger.info('  GET    /api/admin/vendors?kycStatus=     (admin)');
  logger.info('  POST   /api/admin/vendors/:id/approve|reject');
  logger.info('  GET    /api/admin/products?approvalStatus= (admin)');
  logger.info('  POST   /api/admin/products/:id/approve|reject');
  logger.info('═══════════════════════════════════════════════════════');
});

module.exports = { app, server, io };
