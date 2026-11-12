import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCT_REQUESTS_PATH,
  normalizeProductRequest,
  validateProductRequest,
} from '../../src/services/vendorApi/productRequestRules.ts';

const base = {
  name: '  Vitamin C   Serum ',
  brand: 'Glow Lab',
  category: 'skincare',
  mrp: '799',
  barcode: '',
  pictureUrls: [] as string[],
  reason: 'Customers keep asking for this serum.',
};

test('the route is the product-requests route on the shop host path', () => {
  assert.equal(PRODUCT_REQUESTS_PATH, '/api/vendor/product-requests');
});

test('a valid request becomes the body with exactly the server field names, trimmed and whole-rupee MRP', () => {
  const checked = validateProductRequest(base);
  assert.equal(checked.ok, true);
  if (!checked.ok) return;
  assert.deepEqual(checked.value, {
    name: 'Vitamin C Serum',
    brand: 'Glow Lab',
    category: 'skincare',
    mrp: 799,
    reason: 'Customers keep asking for this serum.',
  });
  assert.deepEqual(Object.keys(checked.value).sort(), ['brand', 'category', 'mrp', 'name', 'reason']);
});

test('barcode and picture links are sent only when the vendor gave them', () => {
  const checked = validateProductRequest({
    ...base,
    barcode: ' 8901234567890 ',
    pictureUrls: ['https://images.unsplash.com/photo-1', '  ', 'https://storage.googleapis.com/a.jpg'],
  });
  assert.equal(checked.ok, true);
  if (!checked.ok) return;
  assert.equal(checked.value.barcode, '8901234567890');
  assert.deepEqual(checked.value.pictureUrls, ['https://images.unsplash.com/photo-1', 'https://storage.googleapis.com/a.jpg']);
});

test('an invalid request names the field to show the message on, and sends nothing', () => {
  const cases: [Partial<typeof base>, string][] = [
    [{ name: 'A' }, 'name'],
    [{ brand: 'X' }, 'brand'],
    [{ category: 'snacks' }, 'category'],
    [{ mrp: '0' }, 'mrp'],
    [{ mrp: '12.5' }, 'mrp'],
    [{ barcode: '123' }, 'barcode'],
    [{ pictureUrls: ['http://images.unsplash.com/a.jpg'] }, 'pictureUrls'],
    [{ pictureUrls: ['https://example.com/a.jpg'] }, 'pictureUrls'],
    [{ pictureUrls: ['a', 'b', 'c', 'd'].map(() => 'https://images.unsplash.com/a.jpg') }, 'pictureUrls'],
    [{ reason: 'short' }, 'reason'],
  ];
  for (const [patch, field] of cases) {
    const checked = validateProductRequest({ ...base, ...patch });
    assert.equal(checked.ok, false, `expected ${field} to fail`);
    if (checked.ok === false) assert.equal(checked.field, field);
  }
});

test('a stored request reads its status and keeps a missing id out of the list', () => {
  const request = normalizeProductRequest({
    id: 'PR-1',
    name: 'Serum',
    brand: 'Glow Lab',
    category: 'skincare',
    mrp: 799,
    reason: 'Reason text here',
    status: 'NEEDS_INFO',
    staffNote: '  Add a clearer photo.  ',
    createdAt: 1,
    updatedAt: 2,
  });
  assert.equal(request?.status, 'NEEDS_INFO');
  assert.equal(request?.staffNote, 'Add a clearer photo.');
  assert.equal(normalizeProductRequest({ status: 'APPROVED' }), null);
});

test('an unknown status from the server is shown as waiting for review', () => {
  const request = normalizeProductRequest({ id: 'PR-2', status: 'SOMETHING_NEW' });
  assert.equal(request?.status, 'PENDING');
});
