'use strict';

/**
 * Product rules shared by the inventory, bulk-upload and admin routes:
 * input validation, approval rules and the storefront (shop) document shape.
 */

const VENDOR_CATEGORIES = ['Skincare', 'Makeup', 'Hair care', 'Fragrance', 'Bath & Body', 'Tools & Brushes'];
const SHOP_CATEGORIES = ['Serums', 'Moisturizers', 'Suncare', 'Cleansers', 'Treatments'];
const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

// Editing any of these on an approved (or rejected) product sends it back to PENDING.
const CONTENT_FIELDS = ['name', 'brand', 'category', 'shopCategory', 'description', 'images', 'packSize', 'keyActives'];

const MAX_IMAGES = 6;

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

const has = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined;

function str(v, field, max = 200) {
  if (v === null) return '';
  if (typeof v !== 'string' && typeof v !== 'number') throw new ValidationError(`${field} must be text`);
  const s = String(v).trim();
  if (s.length > max) throw new ValidationError(`${field} is too long (max ${max} characters)`);
  return s;
}

function num(v, field, { min = 0, integer = false } = {}) {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new ValidationError(`${field} must be a number`);
  if (n < min) throw new ValidationError(`${field} must be at least ${min}`);
  return integer ? Math.floor(n) : Math.round(n * 100) / 100;
}

function images(v) {
  if (v === null) return [];
  const list = Array.isArray(v) ? v : [v];
  if (list.length > MAX_IMAGES) throw new ValidationError(`At most ${MAX_IMAGES} images are allowed`);
  return list.map((u, i) => {
    if (typeof u !== 'string' || !/^https?:\/\/[^\s]+$/i.test(u.trim())) {
      throw new ValidationError(`images[${i}] must be an http(s) URL`);
    }
    return u.trim();
  });
}

function keyActives(v) {
  if (v === null) return [];
  const list = Array.isArray(v) ? v : String(v).split(',');
  return list.map(s => String(s).trim()).filter(Boolean).slice(0, 12).map(s => s.slice(0, 60));
}

/**
 * Normalizes the editable fields present in `body`. Unknown and protected fields
 * (vendorId, storeId, approvalStatus, stock counters, ...) are ignored.
 */
function normalizeProductInput(body = {}) {
  const out = {};
  if (has(body, 'name')) out.name = str(body.name, 'name');
  if (has(body, 'brand')) out.brand = str(body.brand, 'brand', 100);
  if (has(body, 'category')) out.category = str(body.category, 'category', 60);
  if (has(body, 'shopCategory')) {
    const sc = body.shopCategory === null ? '' : str(body.shopCategory, 'shopCategory', 40);
    if (sc && !SHOP_CATEGORIES.includes(sc)) {
      throw new ValidationError(`shopCategory must be one of ${SHOP_CATEGORIES.join(', ')}`);
    }
    out.shopCategory = sc || null;
  }
  if (has(body, 'description')) out.description = str(body.description, 'description', 4000);
  if (has(body, 'images')) out.images = images(body.images);
  if (has(body, 'packSize')) out.packSize = str(body.packSize, 'packSize', 40);
  if (has(body, 'keyActives')) out.keyActives = keyActives(body.keyActives);
  if (has(body, 'sku')) out.sku = str(body.sku, 'sku', 80);
  if (has(body, 'unitType')) out.unitType = str(body.unitType, 'unitType', 30);
  if (has(body, 'bin')) out.bin = str(body.bin, 'bin', 60);
  if (has(body, 'expiryDate')) out.expiryDate = str(body.expiryDate, 'expiryDate', 30) || null;
  if (has(body, 'mrp')) out.mrp = num(body.mrp, 'mrp');
  const selling = has(body, 'sellingPrice') ? body.sellingPrice : (has(body, 'price') ? body.price : undefined);
  if (selling !== undefined) out.sellingPrice = num(selling, 'sellingPrice');
  if (has(body, 'compareAtPrice') && body.compareAtPrice !== null) out.compareAtPrice = num(body.compareAtPrice, 'compareAtPrice');
  if (has(body, 'lowStockThreshold')) out.lowStockThreshold = num(body.lowStockThreshold, 'lowStockThreshold', { integer: true });
  if (has(body, 'gstPercent')) out.gstPercent = num(body.gstPercent, 'gstPercent');
  if (has(body, 'status')) {
    const st = str(body.status, 'status', 20).toLowerCase();
    if (!['active', 'paused'].includes(st)) throw new ValidationError('status must be "active" or "paused"');
    out.status = st;
  } else if (has(body, 'active')) {
    out.status = body.active === false || body.active === 'false' ? 'paused' : 'active';
  }
  return out;
}

/** Checks a complete (merged) product. Throws ValidationError. */
function validateProduct(p) {
  if (!p.name) throw new ValidationError('Product name is required');
  if (!(p.sellingPrice > 0)) throw new ValidationError('sellingPrice must be greater than 0');
  if (p.mrp && p.sellingPrice > p.mrp) throw new ValidationError('sellingPrice cannot exceed mrp');
  if (p.category === 'Skincare' && !SHOP_CATEGORIES.includes(p.shopCategory)) {
    throw new ValidationError(`shopCategory is required for Skincare products (one of ${SHOP_CATEGORIES.join(', ')})`);
  }
}

function stockFields(stockOnHand, reservedStock) {
  const onHand = Math.max(0, Math.floor(stockOnHand || 0));
  const reserved = Math.max(0, Math.floor(reservedStock || 0));
  const available = Math.max(0, onHand - reserved);
  return { stockOnHand: onHand, reservedStock: reserved, availableStock: available, stock: onHand, isAvailable: available > 0 };
}

function statusFields(status) {
  return { status, active: status === 'active' };
}

function slug(s) {
  return String(s || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
}

/** Builds a new product document (approval PENDING). */
function buildNewProduct(input, { productId, vendorId, storeId, initialStock = 0, now = Date.now() }) {
  const fields = normalizeProductInput(input);
  const name = fields.name || '';
  const sellingPrice = fields.sellingPrice ?? fields.mrp ?? 0;
  const mrp = fields.mrp || sellingPrice;
  const onHand = num(initialStock || 0, 'stock', { integer: true });
  const product = {
    productId,
    vendorId,
    storeId,
    name,
    brand: fields.brand || '',
    category: fields.category || 'General',
    categoryId: slug(fields.category),
    shopCategory: fields.shopCategory || null,
    description: fields.description || '',
    images: fields.images || [],
    packSize: fields.packSize || '',
    keyActives: fields.keyActives || [],
    sku: fields.sku || ('SKU-' + (name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ITEM') + '-' + productId.slice(-4)),
    unitType: fields.unitType || 'piece',
    mrp,
    sellingPrice,
    price: sellingPrice,
    compareAtPrice: fields.compareAtPrice ?? mrp,
    lowStockThreshold: fields.lowStockThreshold ?? 5,
    bin: fields.bin || 'BIN-UNASSIGNED',
    gstPercent: fields.gstPercent ?? 18,
    expiryDate: fields.expiryDate || null,
    ...stockFields(onHand, 0),
    ...statusFields(fields.status || 'active'),
    deleted: false,
    approvalStatus: 'PENDING',
    rejectionReason: null,
    approvedAt: null,
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    stockHistory: [{ type: 'INITIAL', delta: onHand, stockOnHand: onHand, reason: 'Initial setup', timestamp: now }],
  };
  validateProduct(product);
  return product;
}

function sameValue(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Applies an edit. Returns { changes, contentChanged }. `changes` holds only the
 * fields to write (including approval reset when content changed).
 */
function applyProductUpdate(existing, body, now = Date.now()) {
  const fields = normalizeProductInput(body);
  const changes = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!sameValue(existing[k], v)) changes[k] = v;
  }
  if (has(changes, 'sellingPrice')) changes.price = changes.sellingPrice;
  if (has(changes, 'category')) changes.categoryId = slug(changes.category);
  if (has(changes, 'status')) Object.assign(changes, statusFields(changes.status));

  const merged = { ...existing, ...changes };
  validateProduct(merged);

  const contentChanged = CONTENT_FIELDS.some(k => has(changes, k));
  if (contentChanged && existing.approvalStatus !== 'PENDING') {
    changes.approvalStatus = 'PENDING';
    changes.rejectionReason = null;
    changes.approvedAt = null;
    changes.submittedAt = now;
  }
  if (Object.keys(changes).length) changes.updatedAt = now;
  return { changes, contentChanged };
}

/** Reasons a product is not listed on the shop. Empty array means it is listed. */
function listingBlockers(product, vendor) {
  const reasons = [];
  if (!product || product.deleted) return ['deleted'];
  if (product.approvalStatus !== 'APPROVED') reasons.push(`product approval ${String(product.approvalStatus || 'PENDING').toLowerCase()}`);
  if (!vendor || vendor.kycStatus !== 'APPROVED') reasons.push('vendor not approved yet');
  if (product.category !== 'Skincare') reasons.push('only Skincare products are listed on the shop for now');
  else if (!SHOP_CATEGORIES.includes(product.shopCategory)) reasons.push('shop category missing');
  if (product.status !== 'active' || product.active === false) reasons.push('paused');
  if (!((product.availableStock ?? 0) > 0)) reasons.push('out of stock');
  return reasons;
}

const iso = (t) => (t ? new Date(t).toISOString() : null);

/** Storefront document written to Firestore products/{productId}. */
function toStorefrontDoc(product, { vendor = null, httpsOnly = true, now = Date.now() } = {}) {
  const imgs = (product.images || []).filter(u => (httpsOnly ? /^https:\/\//i.test(u) : /^https?:\/\//i.test(u)));
  const available = Math.max(0, Number(product.availableStock) || 0);
  const price = Number(product.sellingPrice ?? product.price) || 0;
  return {
    id: product.productId,
    vendorId: product.vendorId,
    storeId: product.storeId,
    storeName: (vendor && vendor.shopName) || '',
    brand: product.brand || '',
    name: product.name,
    category: product.shopCategory,
    price,
    originalPrice: Number(product.mrp) || price,
    volume: product.packSize || '',
    description: product.description || '',
    keyActives: Array.isArray(product.keyActives) ? product.keyActives : [],
    images: imgs,
    inStock: available > 0,
    availableStock: available,
    active: true,
    approvedAt: iso(product.approvedAt),
    updatedAt: iso(now),
  };
}

module.exports = {
  VENDOR_CATEGORIES,
  SHOP_CATEGORIES,
  APPROVAL_STATUSES,
  CONTENT_FIELDS,
  ValidationError,
  normalizeProductInput,
  validateProduct,
  buildNewProduct,
  applyProductUpdate,
  stockFields,
  statusFields,
  listingBlockers,
  toStorefrontDoc,
};
