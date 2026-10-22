# PC Screen 40 — Integrations & Data Connections

> **PROPOSED EXTENSION** — Requires product-owner approval prior to production release.

## 1. Overview & Purpose

The **Integrations & Data Connections Workspace** (`#page-integrations`) allows merchants and IT administrators to securely manage third-party ERP connectors (Tally Prime), POS billing software (Petpooja), hyperlocal logistics webhooks (Dunzo), payment gateways (Razorpay), and analytics streams.

It strictly enforces **Credential Masking & Vault Encryption**:
- Plain-text API keys or client secrets are **never stored or displayed** after initial configuration.
- Tokens are masked as `••••••••••••928`.
- All data transfers are encrypted via TLS 1.3 with HMAC signature verification.

---

## 2. Desktop Workspace Architecture

- **Max Content Width**: `1200px – 1280px`
- **Canvas Background**: Warm Off-White (`#F8FAFC`)
- **Card Surfaces**: Pure White (`#FFFFFF`), 14px–16px radii, border `#E2E8F0`, shadow `rgba(15,23,42,0.04)`
- **Navigation Location**: Settings / Integrations & API Connections
- **Palette**:
  - **Royal Blue (`#1D4ED8`)**: Active connector badges, primary CTAs
  - **Emerald (`#16A34A`)**: Healthy integration status (200 OK), TLS encrypted badge
  - **Amber (`#D97706`)**: Webhook delivery timeout alerts, sync in progress
  - **Red (`#DC2626`)**: Auth token expired, invalid API secret

---

## 3. Top Header & Security Standard Banner

### Controls & Actions
- **Breadcrumbs**: `Settings / Integrations & API Connections`
- **Page Title**: `Integrations & Data Connections`
- **Proposed Extension Pill**: `PROPOSED EXTENSION — Requires PO Approval` (Amber)
- **Status Indicator**: `● Status: 4 Active Connections`
- **Primary CTA**: `+ Add Integration` → Opens Guided Integration Modal

### TLS Encryption & Credential Shield Banner
Green banner (`#F0FDF4`, border `#BBF7D0`) confirming:
- Permanent masking of API secrets (`••••••••••••928`)
- TLS 1.3 encrypted data streams with HMAC verification
- `✓ TLS 1.3 Encrypted` badge in Emerald

---

## 4. Integration Connector Directory (7 Cards Grid)

1. **Tally Prime ERP Connector** (ERP & Inventory): Connected (Active), Last sync: Oct 09 12:30 IST, Masked Key: `••••••••••••928`, Scope: Org-Wide, Health: Healthy (200 OK).
2. **Petpooja POS Billing** (Point of Sale): Connected (Active), Last sync: Oct 09 12:44 IST, Masked Key: `••••••••••••412`, Scope: Vijayawada Hub, Health: Healthy (200 OK).
3. **Dunzo Hyperlocal Delivery Webhook** (Logistics): Connected (Active), Last sync: Oct 09 12:15 IST, Masked Key: `••••••••••••881`, Scope: Org-Wide, Health: Healthy (200 OK).
4. **Razorpay Merchant Settlement API** (Payment Gateway): Connected (Active), Last sync: Oct 08 23:59 IST, Masked Key: `••••••••••••109`, Scope: Org-Wide, Health: Healthy (200 OK).
5. **Shopify Storefront Sync** (E-Commerce): Available (Not Connected), Last sync: N/A, Masked Key: Unconfigured.
6. **WhatsApp Business Order Alerts** (Customer CRM): Available (Not Connected), Last sync: N/A, Masked Key: Unconfigured.
7. **PowerBI Analytics Webhook** (BI Analytics): Available (Not Connected), Last sync: N/A, Masked Key: Unconfigured.

---

## 5. Guided Integration Setup Modal

- **Modal ID**: `#modal-connect-integration`
- **Configurable Fields**: Connector type, API Base Endpoint URL, API Secret Key / Bearer Token, Permissions Scope (Read Order Stream, Write Stock Counts, Read Settlements).
- **Security Confirmation**: Key automatically masked upon saving with Vault encryption.

---

## 6. UX State Tester Matrix

- **Default Normal** — All 4 active connectors healthy
- **Auth Expired Warning** — Highlights Petpooja POS token renewal alert (Red)
- **Webhook Error Alert** — Shows HTTP 504 delivery timeout warning for Dunzo
- **Syncing In Progress** — Displays active SKU sync loader for Tally Prime
- **Loading** — Connector list loader
- **Stale Data Warning** — 25-minute stale telemetry notice
- **Offline Mode** — Cached offline connectors
- **Empty Directory** — Empty connectors directory
