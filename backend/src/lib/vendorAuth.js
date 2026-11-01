'use strict';

/**
 * Vendor session tokens: "gv1.<base64url payload>.<base64url HMAC-SHA256>".
 *
 * Payload: { vendorId, storeId, phone, iat, exp }. vendorId and storeId are null
 * for a phone-verified session that has not finished onboarding yet.
 */

const crypto = require('crypto');

const PREFIX = 'gv1';
const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function hmac(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

function signVendorToken(claims, secret, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    vendorId: claims.vendorId || null,
    storeId: claims.storeId || null,
    phone: claims.phone || null,
    iat: now,
    exp: now + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${PREFIX}.${body}.${hmac(secret, `${PREFIX}.${body}`)}`;
}

function verifyVendorToken(token, secret) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX) return null;
  const expected = Buffer.from(hmac(secret, `${PREFIX}.${parts[1]}`));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

function bearerToken(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

module.exports = { signVendorToken, verifyVendorToken, bearerToken, normalizePhone };
