# Feature 11: Team, security and compliance

**Status:** screens are built. Roles and permissions are shown as a matrix, but the server does not enforce them yet. Mobile versions are Coming-soon placeholders in production.
**Screens:** [Mobile: account, team, security and compliance](../mobile/09-account-team-security.md), [Web: team, support and compliance](../web/08-team-support-and-compliance.md), [Web: profile, KYC and security](../web/07-profile-kyc-and-account.md)

## Team and roles

Roles: **Owner**, **Manager**, **Packer**, **Inventory staff**. Member status: pending, active, suspended, revoked.

- An invite is sent by SMS or email to a mobile number or address, with a role.
- The permission matrix sets per-feature access (orders, catalogue, payouts, team).
- Protections shown in the screens: "Last Owner Protection" and an "Active Order Warning" when a change would affect live orders.
- The team screen lists a recent staff audit trail.

## Security

- Active sessions by device, with a flag for unknown devices.
- Sign out one session, or sign out all other devices.
- Update the mobile number used for sign-in ("Update Mobile Number" button; the flow is not built).
- Security health score and a link to payout bank settings.

## Compliance and audit

- Audit events: timestamp, actor, object reference ID, previous state to new state, result.
- Privacy masking is an option on the audit screen.
- Export: choose a date scope and a file format. "Generate 24-Hour Expiring Link" creates a link that expires.
- Compliance dossier: upload or renew licence documents with the document type, number, and issuing authority.

## Known gaps

- Role checks happen in the app only. The backend must enforce them before any staff use the system.
- The admin console's role check is not implemented (see [Development: release checklist](../development/04-release-and-deployment.md)).
- Exports and audit events use sample data.
