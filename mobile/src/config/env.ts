/**
 * GlowVai Vendor App: build configuration and the production config gate.
 *
 * Every EXPO_PUBLIC_* value is read here, once, with a static `process.env.NAME`
 * expression. Expo inlines these at build time and only recognises the static form,
 * so never read them with a computed key.
 *
 * Production builds (release APK/AAB and `expo export`, where __DEV__ is false) must
 * not run against a missing or local server, or against the wrong Firebase project.
 * `getConfigStatus()` reports that; the root layout shows `CONFIG_ERROR_COPY` instead
 * of the app when `ok` is false. Development builds only get warnings.
 */

/** The shared GlowVai Firebase project (same as the shop and the admin panel). */
export const EXPECTED_FIREBASE_PROJECT_ID = 'glowvai-38bde';

const read = (value: string | undefined): string => (value ?? '').trim();

export const ENV = {
  /** Vendor API base URL. No fallback: a missing value is reported, never replaced with localhost. */
  apiUrl: read(process.env.EXPO_PUBLIC_VENDOR_API_URL).replace(/\/+$/, ''),
  customerAppUrl: read(process.env.EXPO_PUBLIC_CUSTOMER_APP_URL),
  firebase: {
    apiKey: read(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
    authDomain: read(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: read(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: read(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: read(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    appId: read(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
  },
} as const;

export interface ConfigIssue {
  /** The environment variable at fault. */
  key: string;
  /** A short developer-facing explanation. */
  message: string;
}

export interface ConfigStatus {
  ok: boolean;
  /** True when the check ran with production rules (issues are fatal). */
  production: boolean;
  issues: ConfigIssue[];
}

/** Copy for the error screen the root layout shows when a production build is misconfigured. */
export const CONFIG_ERROR_COPY = {
  title: 'This version of the app is not set up',
  message:
    'The app cannot reach GlowVai because this build is missing its server settings. ' +
    'Please install the latest GlowVai Vendor app, or contact GlowVai support if this keeps happening.',
  detailsLabel: 'Details for the GlowVai team',
} as const;

/**
 * True for hosts that only exist on a developer machine or a local network:
 * localhost, loopback, the Android emulator alias, *.local and private IPv4 ranges.
 */
export function isLocalUrl(url: string): boolean {
  const match = /^[a-z][a-z0-9+.-]*:\/\/(\[[^\]]+\]|[^/:?#]+)/i.exec(url.trim());
  if (!match) return false;
  const host = match[1].toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (host === '::1' || host === '0.0.0.0') return true;
  const ip = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!ip) return false;
  const [a, b] = [Number(ip[1]), Number(ip[2])];
  return (
    a === 127 ||
    a === 10 ||
    (a === 192 && b === 168) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 169 && b === 254)
  );
}

/** Problems with the vendor API URL. */
export function apiConfigIssues(production: boolean): ConfigIssue[] {
  const key = 'EXPO_PUBLIC_VENDOR_API_URL';
  const url = ENV.apiUrl;
  if (!url) return [{ key, message: 'is not set.' }];
  if (!/^https?:\/\//i.test(url)) return [{ key, message: 'must start with https://.' }];
  if (production && isLocalUrl(url)) {
    return [{ key, message: 'points at a local address; a production build needs the public server URL.' }];
  }
  if (production && !/^https:\/\//i.test(url)) {
    return [{ key, message: 'must use https:// in a production build.' }];
  }
  return [];
}

/** Problems with the Firebase web config (missing keys or the wrong project). */
export function firebaseConfigIssues(): ConfigIssue[] {
  const fb = ENV.firebase;
  const issues: ConfigIssue[] = [];
  const required: [string, string][] = [
    ['EXPO_PUBLIC_FIREBASE_API_KEY', fb.apiKey],
    ['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', fb.authDomain],
    ['EXPO_PUBLIC_FIREBASE_PROJECT_ID', fb.projectId],
    ['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', fb.storageBucket],
    ['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', fb.messagingSenderId],
    ['EXPO_PUBLIC_FIREBASE_APP_ID', fb.appId],
  ];
  for (const [key, value] of required) {
    if (!value) issues.push({ key, message: 'is not set.' });
  }
  if (fb.projectId && fb.projectId !== EXPECTED_FIREBASE_PROJECT_ID) {
    issues.push({
      key: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
      message: `is "${fb.projectId}"; the vendor app must use the shared project "${EXPECTED_FIREBASE_PROJECT_ID}".`,
    });
  }
  return issues;
}

/**
 * Checks the build configuration. With production rules (the default outside __DEV__),
 * any issue means the app must not start: render CONFIG_ERROR_COPY instead.
 * In development the same issues are returned with ok=true and logged as warnings.
 */
export function getConfigStatus(production: boolean = !__DEV__): ConfigStatus {
  const issues = [...apiConfigIssues(production), ...firebaseConfigIssues()];
  if (!production && issues.length) {
    console.warn(
      '[config] ' + issues.map(i => `${i.key} ${i.message}`).join(' ') +
        ' A production build with these settings will refuse to start.',
    );
  }
  return { ok: production ? issues.length === 0 : true, production, issues };
}
