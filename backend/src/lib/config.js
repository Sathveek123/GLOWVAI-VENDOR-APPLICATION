'use strict';

/**
 * Runtime configuration and startup checks for secrets, CORS and Firebase.
 *
 * In production (NODE_ENV=production) the server refuses to start without
 * VENDOR_TOKEN_SECRET and ADMIN_API_KEY. Outside production, fixed development
 * defaults are used so mock mode works with no setup.
 */

const crypto = require('crypto');

const IS_PROD = process.env.NODE_ENV === 'production';

const DEV_VENDOR_TOKEN_SECRET = 'dev-only-vendor-token-secret-not-for-production';
const DEV_ADMIN_API_KEY = 'dev-admin-key';
const DEV_OTP = process.env.VENDOR_DEV_OTP || '4892';

// Origins that may call the API from a browser. Native apps send no Origin header.
const DEFAULT_ORIGINS = [
  'https://glowvai.in',
  'https://www.glowvai.in',
  'http://localhost:3100',
];

function loadSecurityConfig(logger) {
  const missing = [];
  let vendorTokenSecret = process.env.VENDOR_TOKEN_SECRET || '';
  let adminApiKey = process.env.ADMIN_API_KEY || '';

  if (!vendorTokenSecret) {
    if (IS_PROD) missing.push('VENDOR_TOKEN_SECRET');
    else {
      vendorTokenSecret = DEV_VENDOR_TOKEN_SECRET;
      logger.warn('VENDOR_TOKEN_SECRET not set: using the development default (never do this in production)');
    }
  } else if (IS_PROD && vendorTokenSecret.length < 32) {
    missing.push('VENDOR_TOKEN_SECRET (must be at least 32 characters)');
  }

  if (!adminApiKey) {
    if (IS_PROD) missing.push('ADMIN_API_KEY');
    else {
      adminApiKey = DEV_ADMIN_API_KEY;
      logger.warn(`ADMIN_API_KEY not set: using the development default "${DEV_ADMIN_API_KEY}"`);
    }
  } else if (IS_PROD && adminApiKey.length < 24) {
    missing.push('ADMIN_API_KEY (must be at least 24 characters)');
  }

  if (missing.length) {
    const msg = `Refusing to start in production. Missing or weak env vars: ${missing.join(', ')}`;
    logger.error(msg);
    throw new Error(msg);
  }

  return { vendorTokenSecret, adminApiKey };
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function buildCorsOriginCheck(logger) {
  const extra = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const wildcard = extra.includes('*');
  if (wildcard && IS_PROD) logger.warn('ALLOWED_ORIGINS contains "*": ignored in production');
  const allowAll = wildcard && !IS_PROD;
  const allowed = new Set([...DEFAULT_ORIGINS, ...extra.filter(o => o !== '*')]);
  const localDev = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  const check = (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowAll || allowed.has(origin)) return cb(null, true);
    if (!IS_PROD && localDev.test(origin)) return cb(null, true);
    return cb(null, false);
  };
  return { check, allowed: [...allowed] };
}

/**
 * Parses FIREBASE_SERVICE_ACCOUNT_JSON. Accepts raw JSON or base64-encoded JSON,
 * and repairs private keys whose newlines arrived as literal "\n".
 */
function parseServiceAccountEnv(raw) {
  if (!raw) return null;
  let text = raw.trim();
  if (!text.startsWith('{')) {
    text = Buffer.from(text, 'base64').toString('utf8');
  }
  const sa = JSON.parse(text);
  if (sa.private_key && sa.private_key.includes('\\n')) {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  }
  return sa;
}

module.exports = {
  IS_PROD,
  DEV_OTP,
  DEV_ADMIN_API_KEY,
  loadSecurityConfig,
  safeEqual,
  buildCorsOriginCheck,
  parseServiceAccountEnv,
};
