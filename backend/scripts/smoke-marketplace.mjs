#!/usr/bin/env node
/**
 * Marketplace smoke test: vendor onboarding → product → admin approval → storefront → orders.
 *
 * Run against a MOCK backend (no Firebase credentials):
 *   PORT=4100 node src/server.js            # in backend/
 *   node scripts/smoke-marketplace.mjs      # SMOKE_BASE_URL defaults to http://localhost:4100
 *
 * Env: SMOKE_BASE_URL, ADMIN_API_KEY (defaults to the development key "dev-admin-key").
 * Exits with code 1 if any check fails.
 */

const BASE = (process.env.SMOKE_BASE_URL || 'http://localhost:4100').replace(/\/$/, '');
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key';
const DEV_OTP = process.env.VENDOR_DEV_OTP || '4892';
const SEED_VENDOR_PHONE = '8977855998'; // mock seed vendor VND-001

let passed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL ${name}${detail !== undefined ? ` -> ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
  }
}

async function api(method, path, { body, token, admin, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (admin) headers['x-admin-key'] = ADMIN_KEY;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, { method, headers, body: payload });
  let data = null;
  try { data = await res.json(); } catch (_) { /* non-JSON */ }
  return { status: res.status, data };
}

const storefrontIds = async () => (await api('GET', '/api/storefront/products')).data.products.map(p => p.id);
const storefrontDoc = async (id) => (await api('GET', '/api/storefront/products')).data.products.find(p => p.id === id);
const inventoryItem = async (token, id) => (await api('GET', '/api/inventory', { token })).data.items.find(p => p.productId === id);

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

async function main() {
  console.log(`Marketplace smoke test against ${BASE}\n`);

  const health = await api('GET', '/health');
  check('backend is up in mock mode', health.status === 200 && health.data.firebase === 'mock', health.data);

  // ── 1. Vendor login + onboarding ───────────────────────────────────────────
  console.log('\n1. Vendor sign-in and onboarding');
  const phone = '9' + String(Math.floor(100000000 + Math.random() * 899999999));
  const bad = await api('POST', '/api/auth/vendor/login', { body: { phone, otp: '0000' } });
  check('wrong OTP is rejected (401)', bad.status === 401, bad.status);

  const login1 = await api('POST', '/api/auth/vendor/login', { body: { phone, otp: DEV_OTP } });
  check('OTP login returns a phone-only token for a new number', login1.status === 200 && login1.data.token && login1.data.registered === false && login1.data.vendorId === null, login1.data);

  const noAuthOnboard = await api('POST', '/api/onboarding/submit', { body: { ownerName: 'X', shopName: 'Y' } });
  check('onboarding without a session is rejected (401)', noAuthOnboard.status === 401, noAuthOnboard.status);

  const onboard = await api('POST', '/api/onboarding/submit', {
    token: login1.data.token,
    body: {
      vendorId: 'VND-001', // must be ignored
      ownerName: 'Smoke Test Owner',
      shopName: 'Smoke Test Beauty',
      city: 'Vijayawada',
      locality: 'Benz Circle',
      pincode: '520010',
      openTime: '09:00 AM',
      closeTime: '09:00 PM',
      latitude: 16.5,
      longitude: 80.6,
      gstin: '37AAACG1234F1Z8',
      pan: 'AAACG1234F',
      cosmeticLicense: 'CL-123',
      licenseExpiry: '2028-01-01',
      tradeLicense: 'TL-9',
      beneficiaryName: 'Smoke Test Owner',
      bankName: 'HDFC Bank',
      maskedAccountNumber: 'XXXXXX4589',
      ifsc: 'HDFC0001824',
      upiVpa: 'smoke@okhdfc',
      categories: ['skincare'],
      seedSkus: [],
    },
  });
  const v = onboard.data && onboard.data.vendor;
  check('onboarding returns vendorId, storeId and token', onboard.status === 200 && onboard.data.vendorId && onboard.data.storeId && onboard.data.token, onboard.data);
  check('onboarding does not reuse a vendorId from the body', onboard.data.vendorId !== 'VND-001', onboard.data.vendorId);
  check('onboarding sets kycStatus PENDING', onboard.data.kycStatus === 'PENDING' && v.kycStatus === 'PENDING', v && v.kycStatus);
  check('onboarding stores gstin, pan, licences, pinCode and categories', v.gstin === '37AAACG1234F1Z8' && v.pan === 'AAACG1234F' && v.cosmeticLicense === 'CL-123' && v.tradeLicense === 'TL-9' && v.pinCode === '520010' && v.categories[0] === 'skincare', v);

  const vendorId = onboard.data.vendorId;
  const storeId = onboard.data.storeId;
  const login2 = await api('POST', '/api/auth/vendor/login', { body: { phone, otp: DEV_OTP } });
  check('login after onboarding returns the vendor session', login2.data.registered === true && login2.data.vendorId === vendorId && login2.data.storeId === storeId && login2.data.kycStatus === 'PENDING', login2.data);
  const token = login2.data.token;

  const me = await api('GET', '/api/vendor/me', { token });
  check('GET /api/vendor/me returns the vendor', me.status === 200 && me.data.vendor.vendorId === vendorId, me.status);

  // ── 2. Image upload ────────────────────────────────────────────────────────
  console.log('\n2. Image upload');
  const form = new FormData();
  form.append('file', new Blob([PNG_1X1], { type: 'image/png' }), 'pixel.png');
  const up = await api('POST', '/api/uploads/image', { token, form });
  check('PNG upload returns a URL', up.status === 201 && /^https?:\/\//.test(up.data.url), up.data);
  const img = await fetch(up.data.url);
  check('uploaded image is served back', img.status === 200 && img.headers.get('content-type') === 'image/png', img.status);

  const txtForm = new FormData();
  txtForm.append('file', new Blob(['hello'], { type: 'text/plain' }), 'a.txt');
  const upTxt = await api('POST', '/api/uploads/image', { token, form: txtForm });
  check('non-image upload is rejected (415)', upTxt.status === 415, upTxt.status);

  const bigForm = new FormData();
  const big = Buffer.alloc(5 * 1024 * 1024 + 10);
  PNG_1X1.copy(big);
  bigForm.append('file', new Blob([big], { type: 'image/png' }), 'big.png');
  const upBig = await api('POST', '/api/uploads/image', { token, form: bigForm });
  check('upload over 5 MB is rejected (413)', upBig.status === 413, upBig.status);

  const upAnon = await api('POST', '/api/uploads/image', { form });
  check('upload without a session is rejected (401)', upAnon.status === 401, upAnon.status);

  // ── 3. Add a product ───────────────────────────────────────────────────────
  console.log('\n3. Add a Skincare product');
  const productBody = {
    vendorId: 'VND-001', storeId: 'DS-VIJ-01', approvalStatus: 'APPROVED', // all must be ignored
    name: 'Smoke Test Niacinamide Serum',
    brand: 'SmokeLab',
    category: 'Skincare',
    shopCategory: 'Serums',
    description: 'A light serum for the smoke test.',
    images: [up.data.url],
    packSize: '30 ml',
    keyActives: ['Niacinamide', 'Zinc'],
    mrp: 899,
    sellingPrice: 799,
    stock: 10,
    bin: 'A-1',
  };
  const anonAdd = await api('POST', '/api/inventory', { body: productBody });
  check('adding a product without a session is rejected (401)', anonAdd.status === 401, anonAdd.status);

  const noShopCat = await api('POST', '/api/inventory', { token, body: { ...productBody, shopCategory: undefined } });
  check('Skincare product without a shop category is rejected (400)', noShopCat.status === 400, noShopCat.data);

  const add = await api('POST', '/api/inventory', { token, body: productBody });
  const product = add.data && add.data.item;
  check('product is created (201)', add.status === 201 && product && product.productId, add.data);
  const productId = product.productId;
  check('product takes vendorId/storeId from the token', product.vendorId === vendorId && product.storeId === storeId, { vendorId: product.vendorId, storeId: product.storeId });
  check('new product is PENDING', product.approvalStatus === 'PENDING' && product.rejectionReason === null, product.approvalStatus);
  check('PENDING product is not on the storefront', !(await storefrontIds()).includes(productId));

  // ── 4. Admin approval ──────────────────────────────────────────────────────
  console.log('\n4. Admin approval');
  const noKey = await api('GET', '/api/admin/vendors?kycStatus=PENDING');
  check('admin endpoints need x-admin-key (401)', noKey.status === 401, noKey.status);
  const wrongKey = await fetch(BASE + '/api/admin/vendors', { headers: { 'x-admin-key': 'wrong' } });
  check('wrong admin key is rejected (401)', wrongKey.status === 401, wrongKey.status);

  const pendingVendors = await api('GET', '/api/admin/vendors?kycStatus=PENDING', { admin: true });
  check('admin lists the vendor as PENDING', pendingVendors.data.vendors.some(x => x.vendorId === vendorId), pendingVendors.data.count);
  const pendingProducts = await api('GET', '/api/admin/products?approvalStatus=PENDING', { admin: true });
  check('admin lists the product as PENDING', pendingProducts.data.products.some(x => x.productId === productId), pendingProducts.data.count);

  const apP = await api('POST', `/api/admin/products/${productId}/approve`, { admin: true });
  check('product approved, but not live while the vendor is PENDING', apP.status === 200 && apP.data.product.approvalStatus === 'APPROVED' && apP.data.product.listing.live === false && apP.data.product.listing.blockers.includes('vendor not approved yet'), apP.data.product && apP.data.product.listing);
  check('approved product of a PENDING vendor is not on the storefront', !(await storefrontIds()).includes(productId));

  const rejV = await api('POST', `/api/admin/vendors/${vendorId}/reject`, { admin: true, body: {} });
  check('vendor reject requires a reason (400)', rejV.status === 400, rejV.status);

  const apV = await api('POST', `/api/admin/vendors/${vendorId}/approve`, { admin: true });
  check('vendor approved; its product goes live', apV.status === 200 && apV.data.vendor.kycStatus === 'APPROVED' && apV.data.storefront.live === 1, apV.data.storefront);

  // ── 5. Storefront document ─────────────────────────────────────────────────
  console.log('\n5. Storefront document');
  const doc = await storefrontDoc(productId);
  check('product appears on /api/storefront/products', !!doc);
  if (doc) {
    const expected = {
      id: productId, vendorId, storeId, storeName: 'Smoke Test Beauty', brand: 'SmokeLab', name: 'Smoke Test Niacinamide Serum',
      category: 'Serums', price: 799, originalPrice: 899, volume: '30 ml',
      description: 'A light serum for the smoke test.', inStock: true, availableStock: 10, active: true,
    };
    const mismatched = Object.entries(expected).filter(([k, val]) => doc[k] !== val).map(([k]) => k);
    check('storefront fields match', mismatched.length === 0, mismatched.map(k => `${k}=${JSON.stringify(doc[k])}`).join(', '));
    check('storefront keyActives and images are arrays', JSON.stringify(doc.keyActives) === '["Niacinamide","Zinc"]' && doc.images[0] === up.data.url, { keyActives: doc.keyActives, images: doc.images });
    check('storefront approvedAt/updatedAt are ISO timestamps', !Number.isNaN(Date.parse(doc.approvedAt)) && !Number.isNaN(Date.parse(doc.updatedAt)), { approvedAt: doc.approvedAt, updatedAt: doc.updatedAt });
    const allowed = ['id', 'vendorId', 'storeId', 'storeName', 'brand', 'name', 'category', 'price', 'originalPrice', 'volume', 'description', 'keyActives', 'images', 'inStock', 'availableStock', 'active', 'approvedAt', 'updatedAt'];
    check('storefront doc has exactly the agreed fields', Object.keys(doc).sort().join() === allowed.sort().join(), Object.keys(doc));
  }
  const rename = await api('PATCH', `/api/vendor/${vendorId}`, { token, body: { shopName: 'Smoke Test Beauty Studio', kycStatus: 'REJECTED' } });
  check('vendor profile edit cannot change kycStatus', rename.status === 200 && rename.data.vendor.kycStatus === 'APPROVED', rename.data.vendor && rename.data.vendor.kycStatus);
  check('shop rename updates storeName on the storefront', (await storefrontDoc(productId))?.storeName === 'Smoke Test Beauty Studio');
  const one = await api('GET', `/api/storefront/products/${productId}`);
  check('GET /api/storefront/products/:id returns it', one.status === 200 && one.data.product.id === productId, one.status);
  const byCat = await api('GET', '/api/storefront/products?category=Serums');
  check('category filter works', byCat.data.products.every(p => p.category === 'Serums') && byCat.data.products.some(p => p.id === productId));

  // ── 6. Edits and re-approval ───────────────────────────────────────────────
  console.log('\n6. Edits, re-approval and pause');
  const priceEdit = await api('PATCH', `/api/inventory/${productId}`, { token, body: { sellingPrice: 749 } });
  check('price edit keeps APPROVED', priceEdit.status === 200 && priceEdit.data.item.approvalStatus === 'APPROVED' && priceEdit.data.reapprovalRequired === false, priceEdit.data.item && priceEdit.data.item.approvalStatus);
  check('price edit republishes the storefront price', (await storefrontDoc(productId))?.price === 749);

  const nameEdit = await api('PATCH', `/api/inventory/${productId}`, { token, body: { name: 'Smoke Test Niacinamide Serum 10%' } });
  check('name edit sends the product back to PENDING', nameEdit.data.item.approvalStatus === 'PENDING' && nameEdit.data.reapprovalRequired === true, nameEdit.data.item.approvalStatus);
  check('product needing re-approval leaves the storefront', !(await storefrontIds()).includes(productId));
  await api('POST', `/api/admin/products/${productId}/approve`, { admin: true });
  check('re-approved product is back with the new name', (await storefrontDoc(productId))?.name === 'Smoke Test Niacinamide Serum 10%');

  const seedLogin = await api('POST', '/api/auth/vendor/login', { body: { phone: SEED_VENDOR_PHONE, otp: DEV_OTP } });
  const otherToken = seedLogin.data.token;
  check('seed vendor VND-001 can sign in', seedLogin.data.vendorId === 'VND-001', seedLogin.data.vendorId);
  const foreignEdit = await api('PATCH', `/api/inventory/${productId}`, { token: otherToken, body: { sellingPrice: 1 } });
  check("another vendor cannot edit this product (404)", foreignEdit.status === 404, foreignEdit.status);

  const pause = await api('PATCH', `/api/inventory/${productId}`, { token, body: { active: false } });
  check('pausing works', pause.status === 200 && pause.data.item.status === 'paused', pause.data.item && pause.data.item.status);
  check('paused product disappears from the storefront', !(await storefrontIds()).includes(productId));
  await api('PATCH', `/api/inventory/${productId}`, { token, body: { active: true } });
  check('unpaused product reappears (no re-approval needed)', (await storefrontIds()).includes(productId));

  // ── 7. Orders and stock ────────────────────────────────────────────────────
  console.log('\n7. Orders and stock');
  const noPid = await api('POST', '/api/orders', { body: { items: [{ name: 'x', qty: 1 }] } });
  check('order line without productId is rejected (400)', noPid.status === 400, noPid.data);
  const wrongVendor = await api('POST', '/api/orders', { body: { items: [{ productId, vendorId: 'VND-001', qty: 1 }] } });
  check('order line with the wrong vendorId is rejected (400)', wrongVendor.status === 400, wrongVendor.data);

  const order = await api('POST', '/api/orders', {
    body: { customerName: 'Smoke Customer', customerPhone: '9999999999', items: [{ productId, vendorId, qty: 2, price: 1 }] },
  });
  const o = order.data && order.data.order;
  check('order is created (201)', order.status === 201 && o && o.orderId, order.data);
  check('order is routed to the product vendor', o.vendorId === vendorId && o.storeId === storeId, { vendorId: o.vendorId, storeId: o.storeId });
  check('order line is priced from the catalog', o.items[0].price === 749 && o.pricing.subtotal === 1498, o.items[0]);
  let inv = await inventoryItem(token, productId);
  check('placing the order reserves stock (available 10 -> 8)', inv.availableStock === 8 && inv.reservedStock === 2 && inv.stockOnHand === 10, inv && { a: inv.availableStock, r: inv.reservedStock, h: inv.stockOnHand });
  check('storefront availableStock is republished (8)', (await storefrontDoc(productId))?.availableStock === 8);

  const tooMany = await api('POST', '/api/orders', { body: { items: [{ productId, qty: 100 }] } });
  check('ordering more than available is rejected (409 OUT_OF_STOCK)', tooMany.status === 409 && tooMany.data.error === 'OUT_OF_STOCK', tooMany.data);

  const myOrders = await api('GET', '/api/orders', { token });
  check('vendor sees the order in its list', myOrders.data.orders.some(x => x.orderId === o.orderId));
  const seedOrders = await api('GET', '/api/orders', { token: otherToken });
  check("another vendor does not see the order", !seedOrders.data.orders.some(x => x.orderId === o.orderId));
  const anonOrders = await api('GET', '/api/orders');
  check('order list needs a session (401)', anonOrders.status === 401, anonOrders.status);

  const foreignAccept = await api('PATCH', `/api/orders/${o.orderId}/accept`, { token: otherToken });
  check('another vendor cannot accept the order', foreignAccept.status === 403, foreignAccept.status);
  const accept = await api('PATCH', `/api/orders/${o.orderId}/accept`, { token });
  check('vendor accepts the order', accept.status === 200 && accept.data.order.status === 'ACCEPTED', accept.data);
  inv = await inventoryItem(token, productId);
  check('accepting commits stock (on hand 10 -> 8, reserved 0)', inv.stockOnHand === 8 && inv.reservedStock === 0 && inv.availableStock === 8, { a: inv.availableStock, r: inv.reservedStock, h: inv.stockOnHand });
  const again = await api('PATCH', `/api/orders/${o.orderId}/accept`, { token });
  check('accepting twice is rejected (409) and stock is unchanged', again.status === 409 && (await inventoryItem(token, productId)).stockOnHand === 8, again.status);

  const order2 = await api('POST', '/api/orders/create', { body: { orderId: 'SMOKE-' + Date.now(), deliveryOtp: '1234', items: [{ productId, vendorId, qty: 8 }] } });
  check('shop bridge keeps the given deliveryOtp', order2.data.order && order2.data.order.otp === '1234', order2.data.order && order2.data.order.otp);
  check('second order (shop bridge) takes the last 8 units', order2.status === 200 && order2.data.order.vendorId === vendorId, order2.data);
  check('sold-out product is hidden from the storefront', !(await storefrontIds()).includes(productId));
  const reject = await api('PATCH', `/api/orders/${order2.data.orderId}/reject`, { token, body: { reason: 'Smoke test' } });
  check('vendor rejects the second order', reject.status === 200 && reject.data.order.status === 'REJECTED', reject.status);
  check('rejecting releases the reservation and relists the product', (await storefrontDoc(productId))?.availableStock === 8);

  const cancel = await api('PATCH', `/api/orders/${o.orderId}/cancel`, { token, body: { reason: 'Customer cancelled' } });
  inv = await inventoryItem(token, productId);
  check('cancelling the accepted order restocks (on hand 8 -> 10)', cancel.status === 200 && inv.stockOnHand === 10 && inv.availableStock === 10, { status: cancel.status, h: inv.stockOnHand });

  // ── 8. Stock route, rejection, deletion, bulk upload ───────────────────────
  console.log('\n8. Stock edits, rejection, deletion and bulk upload');
  const zero = await api('PATCH', `/api/inventory/${productId}/stock`, { token, body: { exactQuantity: 0, reason: 'Count' } });
  check('stock set to 0 hides the product', zero.status === 200 && !(await storefrontIds()).includes(productId), zero.status);
  const restock = await api('PATCH', `/api/inventory/${productId}/stock`, { token, body: { delta: 5 } });
  check('restock relists the product', restock.status === 200 && (await storefrontDoc(productId))?.availableStock === 5, restock.data);
  const missingStock = await api('PATCH', '/api/inventory/SKU-DOES-NOT-EXIST/stock', { token, body: { delta: 1 } });
  check('stock route returns 404 for unknown products', missingStock.status === 404, missingStock.status);

  const rejP = await api('POST', `/api/admin/products/${productId}/reject`, { admin: true, body: { reason: 'Blurry photo' } });
  check('admin rejects the product with a reason', rejP.status === 200 && rejP.data.product.approvalStatus === 'REJECTED' && rejP.data.product.rejectionReason === 'Blurry photo', rejP.data.product);
  check('rejected product leaves the storefront', !(await storefrontIds()).includes(productId));
  const raw = (await api('GET', `/api/storefront/products/${productId}`));
  check('hidden product returns 404 on the single-product route', raw.status === 404, raw.status);

  await api('POST', `/api/admin/products/${productId}/approve`, { admin: true });
  const del = await api('DELETE', `/api/inventory/${productId}`, { token });
  check('deleting the product hides it', del.status === 200 && !(await storefrontIds()).includes(productId), del.status);
  check('deleted product is gone from the vendor catalog', !(await inventoryItem(token, productId)));

  const csvText = [
    'name,brand,category,shop category,mrp,selling price,stock,sku,pack size,description',
    'Smoke Bulk Sunscreen,SmokeLab,Skincare,Suncare,599,549,12,SMK-SPF-1,50 g,"Broad spectrum, SPF 50"',
    'Smoke Bulk No Shop Cat,SmokeLab,Skincare,,299,249,5,SMK-X-2,30 ml,Missing shop category',
  ].join('\n');
  const bulk = await api('POST', '/api/inventory/bulk-upload', { token, body: { csvText } });
  const bulkItem = bulk.data.items && bulk.data.items[0];
  check('bulk upload creates valid rows and reports invalid ones', bulk.status === 200 && bulk.data.created === 1 && bulk.data.errors.length === 1, { created: bulk.data.created, errors: bulk.data.errors });
  check('bulk product has full fields and PENDING approval', bulkItem && bulkItem.vendorId === vendorId && bulkItem.storeId === storeId && bulkItem.approvalStatus === 'PENDING' && bulkItem.shopCategory === 'Suncare' && bulkItem.packSize === '50 g' && bulkItem.description === 'Broad spectrum, SPF 50' && bulkItem.availableStock === 12 && bulkItem.sellingPrice === 549 && bulkItem.mrp === 599, bulkItem);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('Failed checks:\n - ' + failures.join('\n - '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
