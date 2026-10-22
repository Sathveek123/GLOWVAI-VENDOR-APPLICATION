# PC Screen 30 — Security & Account Activity Log

## 1. Overview & Purpose
The **Security & Account Activity Workspace** (`/security`) provides store owners with transparent auditability, active session management, and action-oriented security controls. It maintains a calm, trustworthy tone rather than fear-inducing alarms, empowering merchants to audit authentication events, verify connected devices, and manage payout security without exposing sensitive internal tokens, unmasked OTPs, or full session IDs.

---

## 2. Desktop Workspace Architecture (1440×1024 Desktop Grid)

### Layout & Palette
- **Max Content Width**: `1200px` – `1280px`
- **Canvas Background**: Warm Off-White (`#F8FAFC`)
- **Card Surfaces**: Pure White (`#FFFFFF`) with 16px card radius, subtle borders (`#E2E8F0`), and light drop shadows (`rgba(15, 23, 42, 0.04)`).
- **Navigation Shell**: Fixed left rail with **Account** / **Security** active.

### Top Header & Security Status Summary
- **Breadcrumbs**: `Account / Security`
- **Page Title**: `Security & Account Activity`
- **Sub-caption**: `Review important account activity, verify active sessions, and protect your store.`
- **Security Health Pill**: `🟢 Security Health: Excellent` (Emerald `#15803D`)
- **Action Control**: `💻 Active Sessions (2)` drawer trigger.

---

## 3. Security Summary Dashboard Cards (4-Column Layout)

1. **Registered Mobile**: `+91 98••••8812` (Green Verified tick). Used for OTP login & high-sensitivity security alerts.
2. **Connected Devices**: `Windows 11 PC` (Vijayawada • Current session). Shows active active session count.
3. **Payout Bank Protection**: `🔒 HDFC Bank (••••4589)` (Protected). Indicates payout lock status & cooling period status.
4. **Team Security Scope**: `4 Staff Members` (RBAC Active). Indicates owner-only permissions boundary enforcement.

---

## 4. "Protect Your Account" Quick Action Hub
- `📱 Review Active Sessions`: Opens device manager drawer.
- `🚪 Sign Out Other Devices`: Invalidation modal for all remote sessions (preserves current desktop session).
- `📲 Update Mobile Number`: Deep links to secure SMS re-authentication flow.
- `💳 Payout Bank Settings →`: Deep links to dedicated financial account management (`/bank`).

---

## 5. Server-Authoritative Recent Activity Timeline & Table

### Search & Filter Toolbar
- **Search Bar**: Real-time filtering by event title, device description, IP location, or event ID.
- **Filter Tabs**: `All Events`, `Trusted`, `Attention`, `Suspicious`.

### Activity Table Schema & Sample Audit Trail

| Timestamp | Event Type | Device & Location | Affected Area | Status | Audit Detail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Today, 08:30 AM** | Successful Owner Login | Chrome 129 on Windows 11 (Vijayawada) | Account Shell | `Trusted` (Emerald) | Authenticated via 6-digit SMS OTP to owner mobile. |
| **Today, 08:29 AM** | SMS OTP Verification | Mobile SMS Gateway (Vijayawada) | Auth Gateway | `Trusted` (Emerald) | OTP dispatched and verified within 18s. |
| **Yesterday, 04:15 PM**| Staff Invitation Dispatched | Chrome 129 on Windows 11 (Vijayawada) | Team Access | `Trusted` (Emerald) | Invited Ramesh K. as Store Manager. |
| **Oct 05, 02:10 PM** | Payout Bank Change | Firefox 128 on macOS (Guntur) | Payout Bank | `Attention` (Amber) | Bank update requested. 48h cooling period active. |
| **Oct 03, 11:45 PM** | Unrecognized Login | Safari on iPhone 15 (Mumbai) | Account Shell | `Suspicious` (Rose) | Failed login attempt from unrecognized location. |
| **Oct 01, 09:15 AM** | Remote Sign-Out | Chrome 128 on Windows 10 | Session Manager | `Trusted` (Emerald) | Remote sign-out for desktop session in branch store. |

---

## 6. Suspicious Activity Challenge Workflow
When a merchant clicks `Review Event` on an `Attention` or `Suspicious` activity row:
- **"I Recognize This" Path**: Marks event status as `Trusted`, removes review prompt.
- **"I Don't Recognize This" Path**:
  1. Marks event status as `Blocked`.
  2. Temporarily locks sensitive payout & document changes.
  3. Triggers automated priority incident ticket with GlowVAI Risk Desk.
  4. Invalidates unrecognised remote sessions without destructive account deletion.

---

## 7. Shared Desktop UX Compliance & Operational Rules (Screens 26–30)
- **Proposed Extension Notice**: Extension screens 26–30 integrate seamlessly into the desktop shell without disrupting Home, Orders, Catalog, Earnings, or Profile navigation.
- **Backend-Enforced Authorization**: Team permissions and owner-only protection boundaries are server-authoritative; hidden UI controls are paired with strict API guardrails.
- **Privacy & Security Masking**: Zero raw tokens, session secret keys, passwords, or full customer identity numbers are exposed in audit logs or UI timelines.
- **Full Operational Edge States**: All components support `Loading`, `Empty`, `Offline`, `Error Retry`, `Permission Denied`, `Session Expired`, and `Success` UI states.
