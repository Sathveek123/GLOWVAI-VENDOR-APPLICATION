# GlowVAI Vendor App: documentation index

Start here. This index covers the features, every screen in the mobile app and the PC command centre, the development guides, and the design rules. The architecture specs from earlier phases are listed at the end.

> **Status: front-end preview.** Most screens show sample data or a Coming-soon placeholder in production. Each screen doc says which parts are live.

## Quick links

- New to the project: [Development 01: local setup](development/01-local-setup.md)
- Checking a screen: [Mobile screens](#mobile-screens) and [Web pages](#web-pages)
- What a feature does: [Features](#features)
- Before a release: [Development 04: release and deployment](development/04-release-and-deployment.md)

## Features

What each feature does, the rules it follows, and what is not built yet.

| # | Feature | Status |
|---|---|---|
| 01 | [Authentication and session](features/01-authentication-and-session.md) | Front end only |
| 02 | [Store onboarding](features/02-store-onboarding.md) | Front end; no server submit |
| 03 | [Order queue and picking](features/03-order-queue-and-picking.md) | Live on mobile; needs backend |
| 04 | [Packing and rider handover](features/04-packing-and-rider-handover.md) | PIN check must move to server |
| 05 | [Catalogue, stock and batches](features/05-catalog-stock-and-batches.md) | Live stock actions; batches placeholder |
| 06 | [Recommendations and procurement](features/06-recommendations-and-procurement.md) | Sample data |
| 07 | [Earnings, payouts and tax](features/07-earnings-payouts-and-tax.md) | Sample data |
| 08 | [Returns and reviews](features/08-returns-and-reviews.md) | Sample data |
| 09 | [Chat, support and notifications](features/09-chat-support-and-notifications.md) | Sample data |
| 10 | [Analytics, promotions and pricing](features/10-analytics-promotions-and-pricing.md) | Sample data |
| 11 | [Team, security and compliance](features/11-team-security-and-compliance.md) | Display only; server must enforce |
| 12 | [Realtime, offline and error behaviour](features/12-realtime-and-offline-behaviour.md) | Home stall open |

## Mobile screens

Each file lists the screens in its group, what each one shows, and its states. Route paths are in the `mobile/app/` folder.

| # | Group | Screens |
|---|---|---|
| 01 | [Entry and sign-in](mobile/01-entry-and-auth.md) | Splash, login, OTP |
| 02 | [Onboarding steps A–D](mobile/02-onboarding-steps-a-to-d.md) | Store, compliance, bank, categories |
| 03 | [Pending and approved](mobile/03-onboarding-pending-and-approved.md) | Review status, approved |
| 04 | [Home, orders and order detail](mobile/04-home-and-orders.md) | Console, order queue, picking |
| 05 | [Packing and handover](mobile/05-packing-and-handover.md) | Pack order, ready for pickup |
| 06 | [Catalogue and stock](mobile/06-catalog-and-stock.md) | Catalogue, add SKU, expiry, recommendations, procurement |
| 07 | [Finance and tax](mobile/07-finance-and-tax.md) | Earnings, payout detail, bank, tax documents |
| 08 | [Returns, reviews, messages and support](mobile/08-returns-reviews-messages-support.md) | Four screens |
| 09 | [Account, team, security and compliance](mobile/09-account-team-security.md) | Profile, notifications, security, team, multi-store, compliance |
| 10 | [Analytics and promotions](mobile/10-analytics-and-promotions.md) | Two screens |
| 11 | [Admin and developer screens](mobile/11-admin-and-dev-screens.md) | Admin console, header preview (development only) |

## Web pages

The PC command centre is one HTML page with a section per screen (`web/index.html`, ids `page-*`). Each file below covers a group of sections.

| # | Group | Pages |
|---|---|---|
| 01 | [Splash, login and OTP](web/01-login-splash-and-otp.md) | 3 |
| 02 | [Onboarding and approval](web/02-onboarding-and-approval.md) | 5 |
| 03 | [Command centre, orders and packing](web/03-command-center-and-orders.md) | 4 |
| 04 | [Catalogue, stock and transfers](web/04-catalog-stock-and-transfers.md) | 6 |
| 05 | [Returns, reviews and messages](web/05-returns-reviews-and-messages.md) | 3 |
| 06 | [Earnings, settlements, tax and bank](web/06-earnings-settlements-and-tax.md) | 4 |
| 07 | [Profile, KYC, security and notifications](web/07-profile-kyc-and-account.md) | 4 |
| 08 | [Team, support and compliance](web/08-team-support-and-compliance.md) | 3 |
| 09 | [Insights, growth and operations](web/09-insights-growth-and-operations.md) | 5 |
| 10 | [Multi-store, admin and integrations](web/10-multi-store-admin-and-integrations.md) | 3 |

## Development

| # | Guide |
|---|---|
| 01 | [Local setup](development/01-local-setup.md) |
| 02 | [Environment variables](development/02-environment-variables.md) |
| 03 | [Testing and QA](development/03-testing-and-qa.md) |
| 04 | [Release and deployment](development/04-release-and-deployment.md) |
| 05 | [Troubleshooting](development/05-troubleshooting.md) |

## Design

| # | Guide |
|---|---|
| 01 | [Colour, spacing and components](design/01-colour-spacing-and-components.md) |
| 02 | [States: loading, empty, error, offline](design/02-states-empty-loading-error.md) |
| | [Typography system](12_TYPOGRAPHY_SYSTEM.md) |

## Architecture and specifications

These documents come from the earlier design phases. Some describe the planned system rather than the current build. Check the status notes in the feature docs first.

| Document | Covers |
|---|---|
| [00 Master overview and architecture](00_MASTER_OVERVIEW_AND_ARCHITECTURE.md) | System design |
| [01 Backend server and API](01_BACKEND_SERVER_AND_API_SPECIFICATION.md) | REST endpoints |
| [02 Realtime socket and geospatial dispatch](02_REALTIME_SOCKET_AND_GEOSPATIAL_DISPATCH.md) | Socket events, dispatch |
| [03 Atomic inventory and stock engine](03_ATOMIC_INVENTORY_AND_STOCK_ENGINE.md) | Stock model |
| [04 Firebase realtime sync and schema](04_FIREBASE_REALTIME_SYNC_AND_DATABASE_SCHEMA.md) | Database |
| [05 Mobile architecture and Expo Router](05_MOBILE_APP_ARCHITECTURE_AND_EXPO_ROUTER.md) | Mobile structure |
| [06 Zustand state and API integration](06_ZUSTAND_STATE_MANAGEMENT_AND_API_INTEGRATION.md) | State |
| [07 Admin console and Firebase portal](07_ENTERPRISE_ADMIN_CONSOLE_AND_FIREBASE_PORTAL.md) | Admin |
| [08 Financial ledger and payouts](08_FINANCIAL_LEDGER_AND_PAYOUT_CALCULATION.md) | Money rules |
| [09 Testing, simulation and troubleshooting](09_TESTING_SIMULATION_AND_TROUBLESHOOTING_GUIDE.md) | Older test guide |
| [10 Product UX and architecture audit](10_PRODUCT_UX_AND_ARCHITECTURE_AUDIT.md) | Audit |
| [11 UI front-end full audit](11_UI_FRONTEND_FULL_AUDIT.md) | Audit and fixes |

## Superseded folders

These were written for earlier screen numbering. They are kept for reference. Use the docs above for current information.

- `screen_docs/` (root): mobile screen specs, numbered for an earlier plan
- `web_screen_docs/` (root): web screen spec index
- `docs/pc_docs/`: web page specs, with duplicate numbers
- `docs/phone_docs/` and `docs/phone_docs.zip`: older mobile specs
- `docs/index.html`: standalone admin console (see [release and deployment](development/04-release-and-deployment.md))
