import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyticsPath, normalizeAnalytics } from '../../src/services/vendorApi/analyticsRules.ts';

test('the analytics request is GET /api/vendor/analytics with days 7 or 30', () => {
  assert.equal(analyticsPath(7), '/api/vendor/analytics?days=7');
  assert.equal(analyticsPath(30), '/api/vendor/analytics?days=30');
});

test('missing server numbers stay null (no data yet), never zero', () => {
  const a = normalizeAnalytics({ days: 7, totals: { orders: 0, accepted: 0, declined: 0 } });
  assert.equal(a.averageAcceptSeconds, null);
  assert.equal(a.fulfilmentRate, null);
  assert.equal(a.totals.orders, 0);
});

test('a null metric from the server stays null, and a real zero stays zero', () => {
  const a = normalizeAnalytics({ averageAcceptSeconds: null, fulfilmentRate: 0 });
  assert.equal(a.averageAcceptSeconds, null);
  assert.equal(a.fulfilmentRate, 0);
});

test('the order value is always labelled as not earnings', () => {
  const a = normalizeAnalytics({ orderValue: { amount: 1200, orderCount: 2, label: 'Earnings' } });
  assert.equal(a.orderValue.label, 'Order value — not your earnings');
  assert.equal(a.orderValue.amount, 1200);
  assert.equal(a.orderValue.orderCount, 2);
});

test('an unknown period falls back to 7 days, and the day rows keep their counts', () => {
  const a = normalizeAnalytics({
    days: 14,
    ordersPerDay: [{ date: '2026-11-11', orders: 3, accepted: 2, declined: 1 }],
    bounds: { perQueryLimit: 500, truncated: true },
  });
  assert.equal(a.days, 7);
  assert.deepEqual(a.ordersPerDay, [{ date: '2026-11-11', orders: 3, accepted: 2, declined: 1 }]);
  assert.equal(a.bounds.truncated, true);
});

test('an empty payload normalises to an empty, honest result', () => {
  const a = normalizeAnalytics(undefined);
  assert.equal(a.days, 7);
  assert.deepEqual(a.ordersPerDay, []);
  assert.deepEqual(a.itemsSold, []);
  assert.equal(a.timezone, 'Asia/Kolkata');
});
