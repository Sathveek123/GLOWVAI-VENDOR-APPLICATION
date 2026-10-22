# Design 02: states (loading, empty, error, offline)

Every data screen must show a deliberate state for each case below. The audit found many screens that failed silently or showed invented data. The rules here prevent that.

## The five states

| State | When | What to show | Copy style |
|---|---|---|---|
| **Loading** | Request in flight | Skeleton rows matching the layout, or a spinner for short actions | "Fetching orders…" |
| **Empty** | Request succeeded, no records | What the list is for and the next action | "No orders yet", "No team members found" |
| **Error** | Request failed | Plain reason and a retry button | "The backend financial service did not respond. Check network connection." |
| **Offline** | No connection | Banner, last known data marked stale | "Offline mode" |
| **Permission denied** | The role cannot see the data | Say so; do not hide the screen silently | "Permission denied" |

## Rules

1. **Never invent data for an error.** If the request fails, show the error state, not sample numbers.
2. **Sample data is for development only.** Production builds show the Coming-soon placeholder for screens not yet connected.
3. **Say what happened in plain words.** Avoid codes and jargon in messages. Put the technical detail in a log.
4. **Every error has a next step:** retry, check connection, or contact support.
5. **Confirm destructive actions.** Sign out, remove item, pause deliveries, and sign out other devices all need a confirmation.
6. **Keep the layout stable.** Skeletons match the final layout so the screen does not jump.
7. **Use alerts sparingly.** The web command centre uses toasts (`showToast()`), not browser alerts.

## Where the states live

- Mobile: the screen itself, and the stores in `mobile/src/store/useVendorStore.ts`.
- Web: each `page-*` section, with a state strip for review.

## Coverage

Coverage is checked screen by screen. The per-screen docs list the states each screen shows:

- [Mobile screens](../mobile/01-entry-and-auth.md)
- [Web pages](../web/01-login-splash-and-otp.md)

The offline and realtime behaviour is described in [Feature 12](../features/12-realtime-and-offline-behaviour.md).
