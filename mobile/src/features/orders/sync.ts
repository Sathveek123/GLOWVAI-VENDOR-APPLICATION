/**
 * Keeps the order list and the store's presence current, following docs/VENDOR_API.md.
 *
 * Orders (GET /api/vendor/orders):
 *  - First load without `since` (the server replaces the lists), then `since = serverTime - 5000`
 *    and the results are merged by orderId; `removed` ids are dropped.
 *  - Polls only while the app is in the foreground, a screen that shows orders is focused
 *    (useOrdersDemand) and a vendor is signed in: every 20 s while the store is online,
 *    every 60 s while it is offline. Never faster. Nothing runs in the background.
 *  - After a failure it waits 40 s, 80 s, 160 s, then 5 minutes at most, keeps the last good
 *    list, and the screens show a quiet "Couldn't refresh · Retry" line.
 *
 * Presence (POST /api/vendor/status { isOnline: true }):
 *  - A heartbeat every 60 s while the store is online and the app is in the foreground, so
 *    GlowVai knows the store is still there (offers stop 3 minutes after the last one).
 *
 * File: mobile/src/features/orders/sync.ts
 */
import { useCallback } from 'react';
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import { useFocusEffect } from 'expo-router';
import useVendorStore from '../../store/useVendorStore';
import { ordersApi } from '../../services/vendorApi/orders';
import { accountApi, loadVendorMe, updateVendorMe } from '../../services/vendorApi/account';
import { VendorApiError, friendlyError } from '../../services/vendorApi/http';

const ONLINE_POLL_MS = 20_000;
const OFFLINE_POLL_MS = 60_000;
const FIRST_BACKOFF_MS = 40_000;
const MAX_BACKOFF_MS = 5 * 60_000;
/** A Retry or pull-to-refresh is ignored if the last poll started less than this ago. */
const MANUAL_MIN_GAP_MS = 5_000;
/** The server returns at most 60 changed orders per poll; a full page means some may be missing. */
const SINCE_PAGE_LIMIT = 60;
const SINCE_OVERLAP_MS = 5_000;

const HEARTBEAT_MS = 60_000;
/** Every Nth heartbeat re-reads /me first, so a store switched offline elsewhere is not switched back on. */
const RECHECK_EVERY = 5;

interface SyncConfig {
  signedIn: boolean;
  /** Approved by GlowVai (active or paused), so the orders route is open. */
  allowed: boolean;
  /** Approved and active, so the store may be online and send heartbeats. */
  canOperate: boolean;
  online: boolean;
}

const s = {
  config: { signedIn: false, allowed: false, canOperate: false, online: false } as SyncConfig,
  foreground: AppState.currentState == null || AppState.currentState === 'active',
  demand: 0,
  since: 0,
  failures: 0,
  lastPollAt: 0,
  timer: null as ReturnType<typeof setTimeout> | null,
  current: null as Promise<void> | null,
  /** Bumped on sign-out so answers to old requests are ignored. */
  generation: 0,
  appStateSub: null as NativeEventSubscription | null,
  hbTimer: null as ReturnType<typeof setTimeout> | null,
  lastHeartbeatAt: 0,
  heartbeats: 0,
  hbInflight: false,
};

// ── Orders polling ───────────────────────────────────────────────────────────

function canPoll() {
  const c = s.config;
  return c.signedIn && c.allowed && s.foreground && s.demand > 0;
}

function pollDelay() {
  if (s.failures > 0) return Math.min(FIRST_BACKOFF_MS * 2 ** (s.failures - 1), MAX_BACKOFF_MS);
  return s.config.online ? ONLINE_POLL_MS : OFFLINE_POLL_MS;
}

function clearPollTimer() {
  if (s.timer) clearTimeout(s.timer);
  s.timer = null;
}

/** Schedules the next poll for when it is due (now, if it is overdue). */
function reschedule() {
  clearPollTimer();
  if (!canPoll() || s.current) return;
  const wait = Math.max(0, s.lastPollAt + pollDelay() - Date.now());
  s.timer = setTimeout(() => void poll(), wait);
}

function poll(): Promise<void> {
  if (s.current) return s.current;
  if (!canPoll()) return Promise.resolve();
  clearPollTimer();
  const gen = s.generation;
  const since = s.since;
  s.lastPollAt = Date.now();
  const store = useVendorStore.getState();
  if (!store.ordersSync.hasLoaded) store.setOrdersSync({ state: 'loading' });

  s.current = ordersApi
    .list(since)
    .then(res => {
      if (gen !== s.generation) return;
      const offers = Array.isArray(res.offers) ? res.offers : [];
      const orders = Array.isArray(res.orders) ? res.orders : [];
      const removed = Array.isArray(res.removed) ? res.removed.filter(id => typeof id === 'string') : [];
      const full = res.full === true || !since;
      useVendorStore.getState().applyOrdersPage({ offers, orders, removed, full });
      const serverTime = Number(res.serverTime);
      const truncated = !full && offers.length + orders.length + removed.length >= SINCE_PAGE_LIMIT;
      // A full page of changes may hide more: load everything again next time.
      s.since = truncated || !Number.isFinite(serverTime) ? 0 : serverTime - SINCE_OVERLAP_MS;
      s.failures = 0;
      useVendorStore.getState().setOrdersSync({ state: 'ready', hasLoaded: true, error: null, lastSyncedAt: Date.now() });
    })
    .catch(err => {
      if (gen !== s.generation) return;
      const code = err instanceof VendorApiError ? err.code : 'NETWORK';
      if (code === 'NOT_APPROVED' || code === 'EMAIL_NOT_VERIFIED' || code === 'NOT_A_VENDOR_ACCOUNT') {
        // The account changed under us: stop until the account state says otherwise.
        s.config = { ...s.config, allowed: false };
        void loadVendorMe(true).catch(() => {});
      } else {
        s.failures += 1;
      }
      useVendorStore.getState().setOrdersSync({ state: 'error', error: friendlyError(err) });
    })
    .finally(() => {
      s.current = null;
      if (gen === s.generation) reschedule();
    });
  return s.current;
}

/**
 * Refreshes now (Retry, pull-to-refresh, after going online). `full` reloads everything,
 * for example to pick up offers after the store went online.
 */
export function refreshOrdersNow(opts: { full?: boolean } = {}): Promise<void> {
  if (opts.full) s.since = 0;
  if (s.current) return s.current;
  const c = s.config;
  if (!c.signedIn || !c.allowed) return Promise.resolve();
  if (Date.now() - s.lastPollAt < MANUAL_MIN_GAP_MS) {
    reschedule();
    return Promise.resolve();
  }
  s.failures = 0;
  // A manual refresh is allowed from any screen, even if no orders screen is focused.
  const demandBefore = s.demand;
  if (demandBefore === 0) s.demand = 1;
  const p = poll();
  s.demand = demandBefore;
  return p;
}

function setDemand(delta: number) {
  s.demand = Math.max(0, s.demand + delta);
  reschedule();
}

// ── Presence heartbeat ───────────────────────────────────────────────────────

function clearHeartbeat() {
  if (s.hbTimer) clearTimeout(s.hbTimer);
  s.hbTimer = null;
}

function canBeat() {
  const c = s.config;
  return c.signedIn && c.canOperate && c.online && s.foreground;
}

function rescheduleHeartbeat() {
  clearHeartbeat();
  if (!canBeat() || s.hbInflight) return;
  const wait = Math.max(0, s.lastHeartbeatAt + HEARTBEAT_MS - Date.now());
  s.hbTimer = setTimeout(() => void beat(), wait);
}

async function beat() {
  if (!canBeat() || s.hbInflight) return;
  s.hbInflight = true;
  const gen = s.generation;
  s.heartbeats += 1;
  try {
    if (s.heartbeats % RECHECK_EVERY === 0) {
      const me = await loadVendorMe(true);
      if (gen !== s.generation) return;
      if (!me.vendor.isOnline || !me.vendor.canOperate) return; // the layout reconfigures from /me
    }
    const res = await accountApi.setOnline(true);
    if (gen !== s.generation) return;
    updateVendorMe({ isOnline: res.isOnline !== false, lastSeenAt: res.lastSeenAt ?? Date.now() });
    useVendorStore.getState().setHeartbeatFailed(false);
  } catch (err) {
    if (gen !== s.generation) return;
    const code = err instanceof VendorApiError ? err.code : 'NETWORK';
    if (code === 'NOT_APPROVED') void loadVendorMe(true).catch(() => {});
    useVendorStore.getState().setHeartbeatFailed(true);
  } finally {
    s.hbInflight = false;
    if (gen === s.generation) {
      s.lastHeartbeatAt = Date.now();
      rescheduleHeartbeat();
    }
  }
}

/** Call after the store was switched online or offline with POST /status (it counts as a heartbeat). */
export function noteStatusWritten() {
  s.lastHeartbeatAt = Date.now();
  useVendorStore.getState().setHeartbeatFailed(false);
  rescheduleHeartbeat();
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

function onAppState(next: AppStateStatus) {
  const fg = next === 'active';
  if (fg === s.foreground) return;
  s.foreground = fg;
  if (fg) {
    reschedule();
    rescheduleHeartbeat();
  } else {
    clearPollTimer();
    clearHeartbeat();
  }
}

function ensureAppStateListener() {
  if (!s.appStateSub) s.appStateSub = AppState.addEventListener('change', onAppState);
}

/** Stops everything and forgets the orders and inventory (sign-out). */
export function stopSync() {
  s.generation += 1;
  clearPollTimer();
  clearHeartbeat();
  s.current = null;
  s.hbInflight = false;
  s.since = 0;
  s.failures = 0;
  s.lastPollAt = 0;
  s.lastHeartbeatAt = 0;
  s.heartbeats = 0;
  s.config = { signedIn: false, allowed: false, canOperate: false, online: false };
  useVendorStore.getState().reset();
}

/** Feeds the controller the account state. Called by the vendor shell whenever it changes. */
export function configureSync(next: SyncConfig) {
  ensureAppStateListener();
  const prev = s.config;
  if (prev.signedIn && !next.signedIn) {
    stopSync();
    return;
  }
  s.config = next;
  if (prev.online && !next.online) {
    // Offline stores are offered nothing.
    useVendorStore.getState().clearOffers();
  }
  if (!prev.online && next.online && next.signedIn) {
    // Fetch offers straight away.
    s.since = 0;
    if (s.demand > 0 && s.foreground) void refreshOrdersNow({ full: true });
  }
  if (!prev.allowed && next.allowed) s.since = 0;
  reschedule();
  rescheduleHeartbeat();
}

/** Screens that show orders call this; polling runs only while one of them is focused. */
export function useOrdersDemand() {
  useFocusEffect(
    useCallback(() => {
      setDemand(1);
      return () => setDemand(-1);
    }, []),
  );
}

/** The sync state for a screen: loading, last error, and Retry. */
export function useOrdersSync() {
  const sync = useVendorStore(st => st.ordersSync);
  const orders = useVendorStore(st => st.orders);
  const retry = useCallback(() => refreshOrdersNow(), []);
  return { orders, ...sync, retry };
}
