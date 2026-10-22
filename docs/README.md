# 📚 GlowVAI Dark Store Vendor App — Master Documentation Portal

Welcome to the complete, end-to-end technical documentation suite for the **GlowVAI Vendor App & Enterprise Dark Store Management Platform**.

This documentation suite covers system architecture, API specifications, real-time socket events, geospatial candidate dispatch, atomic inventory algorithms, database schemas, mobile navigation, state management, admin portal hosting, financial payout ledgers, and troubleshooting workflows.

---

## 🗂️ Documentation Suite Modules

| # | Documentation Module | Description | Key Focus Areas |
| :-: | :--- | :--- | :--- |
| **00** | [**Master Overview & System Architecture**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/docs/00_MASTER_OVERVIEW_AND_ARCHITECTURE.md) | High-level system design, technology stack, directory map, and quick-commerce execution flow. | System Map, Tech Stack, End-to-End Workflow |
| **01** | [**Backend Server & API Specification**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/docs/01_BACKEND_SERVER_AND_API_SPECIFICATION.md) | Express server configuration, middleware, rate limiting, and complete REST API endpoint reference. | REST API, Security Headers, Express Endpoints |
| **02** | [**Real-Time Socket & Geospatial Dispatch**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/docs/02_REALTIME_SOCKET_AND_GEOSPATIAL_DISPATCH.md) | WebSocket protocol, Redis geospatial fanout algorithm, and Rapido-style SETNX distributed locking. | Socket.IO, Candidate Fanout, SETNX Locking |
| **03** | [**Atomic Inventory & Stock Engine**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/docs/03_ATOMIC_INVENTORY_AND_STOCK_ENGINE.md) | 3-state stock model (`stockOnHand`, `reservedStock`, `availableStock`), warehouse bin tracking, and alerts. | Atomic Stock, Warehouse Bins, Low-Stock Alerts |
| **04** | [**Firebase Sync & Database Schemas**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/docs/04_FIREBASE_REALTIME_SYNC_AND_DATABASE_SCHEMA.md) | Firebase Admin SDK, Realtime Database (RTDB) sync engine, and JSON data schemas for Vendors, Orders, SKUs. | Firestore, RTDB REST Sync, Document Schemas |
| **05** | [**Mobile App Architecture & Expo Router**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/docs/05_MOBILE_APP_ARCHITECTURE_AND_EXPO_ROUTER.md) | React Native Expo Router file-based screens, navigation layout, design tokens, and order picking flow. | Expo Router, Picking UI, Dark Glassmorphism |
| **06** | [**Zustand State Management & Client API**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/docs/06_ZUSTAND_STATE_MANAGEMENT_AND_API_INTEGRATION.md) | Zustand global store, Axios HTTP client, real-time socket event hooks, and local storage persistence. | Zustand Store, Socket Hooks, AsyncStorage |
| **07** | [**Enterprise Admin Console & GitHub Pages**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/docs/07_ENTERPRISE_ADMIN_CONSOLE_AND_FIREBASE_PORTAL.md) | Multi-vendor admin console (`index.html`), 1-click GitHub Pages deployment, order simulator, JSON backup. | Admin Web Console, GitHub Pages, Simulator |
| **08** | [**Financial Ledger & Vendor Payout Engine**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/docs/08_FINANCIAL_LEDGER_AND_PAYOUT_CALCULATION.md) | Commercial revenue split calculation (88% vendor net / 12% platform take-rate), GST, bank UPI payouts. | Payout Ledger, 88/12 Split, GST Tax Rules |
| **09** | [**Testing, Simulation & Troubleshooting**](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/docs/09_TESTING_SIMULATION_AND_TROUBLESHOOTING_GUIDE.md) | Local run guide, order push simulation scripts, race-condition testing endpoint, and diagnostic FAQ. | Running Locally, Race Condition Test, FAQ |

---

## ⚡ Quick Start Command Cheat Sheet

### 1. Launch Backend API & WebSocket Server
```bash
cd "d:\Client Projects\GlowVai\GLOW VAI VENDOR\glowvai-vendor-app\backend"
npm start
```

### 2. Launch Mobile App on Web / Metro
```bash
cd "d:\Client Projects\GlowVai\GLOW VAI VENDOR\glowvai-vendor-app\mobile"
npx expo start --web
```

### 3. Open Admin Portal
Simply double-click or open [index.html](file:///d:/Client%20Projects/GlowVai/GLOW%20VAI%20VENDOR/glowvai-vendor-app/docs/index.html) in any modern browser or host it on GitHub Pages.
