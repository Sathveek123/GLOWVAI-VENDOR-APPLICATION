# Feature 09: Chat, support and notifications

**Status:** screens are built. Chat, tickets, and notification preferences are front-end only. Mobile versions of messages, support, and notifications are Coming-soon placeholders in production.
**Screens:** [Mobile: messages and support](../mobile/08-returns-reviews-messages-support.md), [Mobile: notifications](../mobile/09-account-team-security.md), [Web: messages, support and notifications](../web/05-returns-reviews-and-messages.md), [Web: profile and notifications](../web/07-profile-kyc-and-account.md), [Web: team, support and compliance](../web/08-team-support-and-compliance.md)

## Chat with customers

- One thread per order. The vendor can send text, and can send a **substitution proposal** when an item is missing (for example, a suggested shade).
- A failed send shows "Tap to retry send".
- The thread has an "Escalate to Support" action. Where it sends the thread is not yet built.

## Support tickets

- Categories: order issue, payout not received, document upload problem, catalogue sync issue, account security.
- Priority, subject, optional order or settlement reference, and a description.
- Tickets show status (open, action required, resolved) and can be reopened.
- Support desk response time is shown as a fixed estimate.

## Notifications

- Feed filters: all, orders, inventory, payouts, compliance, system.
- Each item has an action link to its screen. A link that has expired shows "Target workspace link expired".
- Channels: push, WhatsApp Business, SMS (+91 number), and real-time audio alerts for order offers.
- The app reads notifications and marks them read through `notificationsApi` (`GET /api/notifications/:vendorId`, `PATCH /api/notifications/:notificationId/read`).
- Channel preferences are not saved to the backend yet. "Save Preferences" is front-end only.
- Broadcasts are a backend-only action (`POST /api/notifications/broadcast`).

## Known gaps

- Chat does not connect to a customer messaging service yet.
- Ticket creation is front-end only.
- Push permission denial is shown on web. Native push tokens are sent through `vendorApi.updateFcmToken`, which the backend must store.
