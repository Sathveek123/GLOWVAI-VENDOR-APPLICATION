# Mobile screens 09: profile, notifications, security, team, multi-store and compliance

**Covers:** `profile.tsx` (live), `notifications.tsx`, `security.tsx`, `team.tsx`, `multi-store.tsx`, `compliance.tsx`
**Feature docs:** [Feature 09: notifications](../features/09-chat-support-and-notifications.md), [Feature 11: team, security and compliance](../features/11-team-security-and-compliance.md)

| Screen | Route | Production |
|---|---|---|
| Profile | `/(vendor)/profile` | Live |
| Notifications | `/(vendor)/notifications` | Coming soon |
| Security | `/(vendor)/security` | Coming soon |
| Team | `/(vendor)/team` | Coming soon |
| Multi-store | `/(vendor)/multi-store` | Coming soon |
| Compliance | `/(vendor)/compliance` | Coming soon |

## Profile (`profile.tsx`)

**Title:** "Profile". Store ID and "partner since" line.

- **Store details:** name, owner, street address, description, city, pincode, phone.
- **Operating hours:** opening and closing windows for customer fulfilment.
- **Payout:** UPI destination, masked. Link to bank edit.
- **Save profile changes**, with an "Unsaved changes" indicator.
- **Log out:** clears the saved session (see [Feature 01](../features/01-authentication-and-session.md)) and returns to login.
- **Avatar:** a storefront icon. No stock photo.
- **States:** session expired, simulated secure upload (development only).

## Notifications (`notifications.tsx`)

**Title:** "Notifications".

- **Filter tabs:** all, orders, inventory, payouts, compliance, system.
- **List and detail pane:** select an item to see its full details and its action link.
- **Preferences:** WhatsApp Business, SMS (+91), weekly bank settlement UTR updates, urgent inventory restock reminders, real-time audio for order offers. *Save preferences* and *Restore alerts*. Preferences are local only.
- **States:** "Target workspace link expired" when an action link is stale.

## Security (`security.tsx`)

**Title:** "Security". Health indicator ("Security health: excellent").

- **This device:** device name and location, marked as current.
- **Active sessions:** sign out one session or sign out all other devices (confirmation first).
- **Mobile number** used for sign-in ("Used for OTP login and security alerts"), with "Verified".
- **Team RBAC scope:** link to team permissions.

## Team (`team.tsx`)

**Title:** "Team access and permissions".

- **Roster:** filters by role (owners, managers, packers, inventory staff) and status (pending, suspended, revoked).
- **Invite:** mobile number or email, then *Send SMS / email invite →*.
- **Permission matrix** for the selected member. "Select any team member to inspect role permissions and audit logs."
- **Recent staff audit trail.**
- **Notices:** "Owner account security guarantee".
- **States:** no team members, offline mode.

## Multi-store (`multi-store.tsx`)

**Title:** "Multi-store locations".

- **Network totals:** total sales today, orders, prep target under 3 minutes.
- **Store list:** location name, unique store code, address with geofence pin, store type.
- **Add a location:** name, code, address and pin, type.
- **Switch active view** and *View active orders queue →*.

## Compliance (`compliance.tsx`)

**Title:** "Audit trail and compliance".

- **Audit log:** timestamp, object reference ID, previous state to new state, result.
- **Privacy masking** is on for exports. Export is role based, with an expiring download link.
- **View trail →** opens the event detail.

## Known gaps

- Only the profile is live. Everything else is a placeholder in production, and none of it is connected to the backend.
- Role-based access is shown in the screens but not enforced by the server.
