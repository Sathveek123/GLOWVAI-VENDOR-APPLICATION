import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NOT_AVAILABLE_CODE,
  NOT_AVAILABLE_COPY,
  describeFailure,
  isNotAvailableFailure,
} from '../../src/services/vendorApi/errorRules.ts';

test('a 503 NOT_AVAILABLE shows the not-available copy when the server sends no sentence', () => {
  const failure = describeFailure(503, { ok: false, code: 'NOT_AVAILABLE' });
  assert.equal(failure.message, 'This is not available yet.');
  assert.equal(failure.message, NOT_AVAILABLE_COPY);
  assert.equal(failure.code, NOT_AVAILABLE_CODE);
});

test('a 503 NOT_AVAILABLE keeps the server gated message when it sends one', () => {
  const failure = describeFailure(503, { ok: false, code: 'NOT_AVAILABLE', error: 'Store analytics is switched off for now.' });
  assert.equal(failure.message, 'Store analytics is switched off for now.');
  assert.equal(failure.code, 'NOT_AVAILABLE');
});

test('a 404 with no JSON body (route not deployed) shows the not-available copy, never a made-up result', () => {
  const failure = describeFailure(404, null);
  assert.equal(failure.message, 'This is not available yet.');
  assert.equal(failure.code, 'NOT_AVAILABLE');
  assert.deepEqual(failure.details, {});
});

test('a 404 with a server NOT_FOUND code is a missing record, not a missing route', () => {
  const failure = describeFailure(404, { ok: false, code: 'NOT_FOUND', error: 'Could not find that.' });
  assert.equal(failure.code, 'NOT_FOUND');
  assert.equal(failure.message, 'We could not find that.');
});

test('a 503 with another code is not treated as not available', () => {
  const failure = describeFailure(503, { ok: false, code: 'INTERNAL', error: 'Try later.' });
  assert.equal(failure.code, 'INTERNAL');
  assert.equal(failure.message, 'Try later.');
});

test('isNotAvailableFailure is true only for a 503 NOT_AVAILABLE or a code-less 404', () => {
  assert.equal(isNotAvailableFailure(503, 'NOT_AVAILABLE'), true);
  assert.equal(isNotAvailableFailure(404, 'HTTP_404'), true);
  assert.equal(isNotAvailableFailure(404, 'NOT_FOUND'), false);
  assert.equal(isNotAvailableFailure(500, 'NOT_AVAILABLE'), false);
  assert.equal(isNotAvailableFailure(500, 'HTTP_500'), false);
});

test('a non-JSON server error gets the generic copy with its HTTP code', () => {
  const failure = describeFailure(500, null);
  assert.equal(failure.code, 'HTTP_500');
  assert.equal(failure.message, 'Something went wrong. Please try again.');
});

test('a 429 without a code is rate limited', () => {
  const failure = describeFailure(429, null);
  assert.equal(failure.code, 'RATE_LIMITED');
  assert.equal(failure.message, 'Too many requests. Please wait a minute and try again.');
});

test('extra fields from the server are kept as details, without ok, error and code', () => {
  const failure = describeFailure(409, { ok: false, code: 'OUT_OF_STOCK', error: 'x', missing: ['sku-1'] });
  assert.equal(failure.code, 'OUT_OF_STOCK');
  assert.deepEqual(failure.details, { missing: ['sku-1'] });
});

test('an unknown server code keeps the server sentence', () => {
  const failure = describeFailure(400, { ok: false, code: 'INVALID_INPUT', error: 'Enter the brand.', field: 'brand' });
  assert.equal(failure.message, 'Enter the brand.');
  assert.deepEqual(failure.details, { field: 'brand' });
});
