# Feature 12: Realtime, offline and error behaviour

**Status:** the socket client and the error states are built. Home can stall after the realtime connection is made, which is not yet root-caused.
**Related:** [Backend API](../01_BACKEND_SERVER_AND_API_SPECIFICATION.md), [Realtime socket design](../02_REALTIME_SOCKET_AND_GEOSPATIAL_DISPATCH.md)

## Socket client

One Socket.IO client is shared by the app (`mobile/src/services/socket.ts`).

- **Connect:** `vendorApi` registers the vendor (`registerVendor(VENDOR_ID, STORE_ID)`). No fixed coordinates are sent.
- **Events handled:** `connect`, `disconnect`, `connect_error`, `reconnect` (logged only), and `order:incoming` (opens the incoming-order alert).
- **Teardown:** the home screen removes its listeners when it unmounts, so navigating away does not leave duplicate handlers.
- **Deferred connect handler:** the connect work runs in a `setTimeout(…, 0)` on home. This avoids a render stall seen during testing. It helped in one variant but is not a root-cause fix.

## Offline and error states

The audit asked every data screen to handle these states. Coverage is checked screen by screen; see [Feature 12 status](#known-issue-home-stall) and the per-screen docs for what each one shows:

| State | What the user sees |
|---|---|
| Loading | Skeleton rows or a spinner |
| Empty | "No orders yet" style copy with the next action |
| Offline | Offline banner, last known data labelled "Stale" |
| Error | Plain message with a retry button |
| Permission denied | Message that the role does not have access |

Failed requests must never show invented data. The app shows the error state instead.

## Known issue: home stall

On a live backend, the home screen can stop responding after the socket connects. Observed in headless Chrome, in both development and production builds. The cause is not identified. Test on a physical device before release, and record:

- whether the stall happens with the socket disconnected
- how many `order:incoming` events arrive during the stall
- the JS thread and render timing in the Expo performance monitor

## Configuration

Set `EXPO_PUBLIC_VENDOR_API_URL` to the backend address. On a phone, use your computer's LAN address, not `localhost`. See [Development: environment variables](../development/02-environment-variables.md).
