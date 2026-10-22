# Web pages 08: team, support and compliance

**Covers:** `page-team`, `page-support`, `page-compliance`
**Feature docs:** [Feature 09](../features/09-chat-support-and-notifications.md), [Feature 11](../features/11-team-security-and-compliance.md)
**Mobile equivalents:** [mobile screens 09](../mobile/09-account-team-security.md), [mobile screens 08](../mobile/08-returns-reviews-messages-support.md)

## Team access (`page-team`)

**Title:** "Team access and staff permissions". The largest team page, with developer state strips still visible.

- **Role filters:** all, owners, managers, packers, inventory staff.
- **Status filters:** pending, suspended, revoked.
- **Invite new staff member:** full name, mobile number or email, assigned role (packer, inventory, manager). *Send SMS / email invitation*.
- **Granular permission matrix** for the selected member.
- **Notices:** "Last owner protection", "Active order warning".
- **States:** loading skeletons, offline mode.
- The "Test team access edge states" strip has been removed. The offline banner still works through its own state.

## Merchant support (`page-support`)

**Title:** "Merchant support center".

- **Quick categories:** report order issue, payout not received, document upload problem, catalogue sync issue, account security concern.
- **Ticket list:** all, open, action required, resolved.
- **New ticket form:** category, priority, subject, optional order or settlement reference, issue description, *Submit ticket*.
- **Contact:** GlowVAI support desk.

## Audit reports (`page-compliance`)

**Title:** "Audit reports".

- **Audit events:** date, actor, object reference ID, previous state to new state, result.
- **Event inspection:** *Escalate to GlowVAI support*.
- **Export configuration:** date scope, file format, *Generate 24-hour expiring link*, *Generate and download now*.
- **Compliance dossier:** upload or renew documents (document type, registration or licence number, issuing authority).
- **States:** generating (for example 45%), suspicious finding, stale data, offline, expired link, no filtered results.

## Known gaps

- Team roles and permissions are display only. The server must enforce them.
- Tickets and audit exports are sample data.
- The team page no longer has a developer strip. Other web pages still do (see [web pages 09](09-insights-growth-and-operations.md)).
