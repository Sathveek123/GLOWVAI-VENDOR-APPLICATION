# Web pages 10: multi-store, admin dashboard and integrations

**Covers:** `page-multi-store`, `page-admin`, `page-integrations`
**Feature docs:** [Feature 11](../features/11-team-security-and-compliance.md), [Feature 10](../features/10-analytics-promotions-and-pricing.md)
**Related:** [Development: admin console](../development/04-release-and-deployment.md)

## Multi-store hub (`page-multi-store`)

**Title:** "Multi-store and location hub".

- **Views:** brand admin (all stores) and store manager view.
- **Filters:** all stores, open only, paused only.
- *Add new store location*: store name, store code, store type, address and GPS pin, delivery radius (km), store manager.
- *Create location*.

## Fleet supervisor (`page-admin`)

**Title:** "Fleet supervisor and multi-store dashboard".

- This page is a placeholder with little content. It should be built out or removed before release.
- It is not the same as the standalone admin console (`docs/index.html`, see [Development: release and deployment](../development/04-release-and-deployment.md)).

## Integrations (`page-integrations`)

**Title:** "Integrations and data connections".

- Connection cards for POS, ERP, inventory sync and shipping webhooks, with masked credentials.
- States: auth expired, webhook error, syncing, empty directory.
- Actions: *Create bulk catalogue pricing rule*, *Create stock transfer request*, segment cohort details.
- **Size:** the page is about 195 KB of markup, the largest page in the prototype. Consider splitting it when it is built out.

## Known gaps

- Integrations are not connected to any external system.
- The fleet supervisor page is a stub.
- Credentials are displayed as masked text only; no credential storage exists yet.
