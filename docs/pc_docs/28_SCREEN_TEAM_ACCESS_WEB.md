# PC Screen 28 — Team Members & Staff Permissions

## 1. Overview & Purpose
The **Team Members & Staff Permissions Workspace** (`/team`) enables GlowVAI store owners to onboard, assign, and manage store operational staff (Managers, Order Packers, Inventory Specialist, Counter Staff) without sharing primary owner account credentials. 

To protect financial, legal, and operational integrity, all high-sensitivity management operations (payout bank account edits, GST tax document access, KYC dossier replacements, security credential resets, and team permissions management) are strictly **Owner-Controlled** and locked behind backend verification.

---

## 2. Desktop Workspace Architecture (1440×1024 Desktop Grid)

### Layout Structure
- **Max Content Width**: `1200px` – `1280px`
- **Canvas Background**: Warm Off-White (`#F8FAFC`)
- **Card Styling**: Pure White (`#FFFFFF`) with 16px radius, subtle borders (`#E2E8F0`), and light shadows (`rgba(15, 23, 42, 0.04)`).
- **Navigation Shell**: Fixed left navigation rail with **Account** / **Team access** selected.

### Header & Breadcrumbs
- **Breadcrumbs**: `Account / Team access`
- **Page Title**: `Team access`
- **Sub-caption**: `Invite staff without sharing your login. Delegate order processing and inventory updates securely.`
- **Header Badges**: Active Member Count (`4 Active Staff`), Owner Security Level (`🔒 Backend Enforced RBAC`).
- **Primary CTA**: `+ Invite team member` (Royal Blue `#1D4ED8`).

---

## 3. Owner Security & Protected Actions Banner
A persistent security card reinforces owner protection:
- **Title**: `Owner-Only Protected Security Boundary`
- **Description**: `Sensitive actions remain strictly protected under primary store owner authority:`
- **Protected Actions Pill List**:
  1. `Bank & Payout Changes`
  2. `Tax & GST Documents`
  3. `KYC & Document Replacement`
  4. `Security & Password Resets`
  5. `Team Role Delegation`

---

## 4. Multi-Filter Navigation Bar
Store owners can filter the staff directory using responsive tab buttons with real-time badges:
1. `All Members` (Count: 4)
2. `Owners` (Count: 1)
3. `Managers` (Count: 1)
4. `Packers` (Count: 1)
5. `Inventory Staff` (Count: 1)
6. `Pending Invitations` (Count: 1)
7. `Suspended` (Count: 1)
8. `Revoked` (Count: 1)

---

## 5. Master-Detail Split Workspace

### A. Team Member Master Table (Desktop Grid)
- **Columns**:
  - **Member & Avatar**: Initials avatar with role badge, full name, masked phone number (`••••••8812`) or email (`m•••••@glowvai.in`).
  - **Role & Assigned Store**: Operational role tag (`Store Owner`, `Store Manager`, `Order Packer`, `Inventory Specialist`) and Store Location (`Sri Lakshmi Beauty - Vij`).
  - **Status Pill**: 
    - `Active` (Emerald `#16A34A`)
    - `Invitation Pending` (Amber `#D97706`)
    - `Suspended` (Slate `#64748B`)
    - `Revoked` (Rose `#DC2626`)
  - **Last Active Timestamp**: Dynamic string (`Active 12m ago`, `Active 2h ago`, `Invite sent 1d ago`).
  - **Quick Action Menu**: `Manage Access`, `Resend Invite`, `Suspend`, `Revoke`.

### B. Member Detail Drawer (480px Floating Inspector)
When a member card or row is clicked, the inspector opens showing:
- **Header**: Avatar, Name, Role badge, Status Pill, Masked Contact.
- **Assigned Store**: Multi-store assignment badge.
- **Granular Permission Summary**: View-only checklist of enabled/disabled capability groups.
- **Audit Activity Log**: Recent activity timestamped feed (e.g. `Packed Order #GV-8821`, `Adjusted stock for Maybelline Liner`).
- **Action Toolbar**:
  - `Edit Role & Permissions`
  - `Suspend Access` / `Reactivate Access`
  - `Resend Invitation` (for pending states)
  - `Revoke Access` (Red CTA with confirmation modal)

---

## 6. Granular Permission Matrix

| Permission Key | Display Label | Scope Description | Security Status |
| :--- | :--- | :--- | :--- |
| `view_orders` | View Orders | View live customer incoming order queue & details | Allowed for Staff |
| `accept_orders` | Accept Orders | Accept incoming beauty order offers & start timer | Allowed for Staff |
| `pack_orders` | Pack Orders | Mark items packed & print pickup slips | Allowed for Staff |
| `edit_catalog` | Edit Catalog | Update product titles, descriptions & prices | Allowed for Staff |
| `adjust_stock` | Adjust Stock | Update quick stock counts & mark out-of-stock | Allowed for Staff |
| `review_returns` | Review Returns | Process customer return requests & QC photos | Allowed for Staff |
| `view_earnings` | View Earnings | View store revenue counters and payout logs | Owner Approval Req. |
| `access_tax` | Access Tax Documents | Download GST invoices & TCS/TDS reports | 🔒 Owner Controlled |
| `manage_team` | Manage Team | Invite, modify or revoke staff permissions | 🔒 Owner Controlled |

---

## 7. Operational Safeguards & Edge States

### 1. Last-Owner Protection
- **Trigger**: Attempting to suspend or revoke the sole primary Store Owner account (`DS-VIJ-OWNER-01`).
- **Behavior**: Modal blocks operation with message: `"Cannot Suspend/Revoke Sole Store Owner. Reassign owner authority first."`

### 2. Active Packing Interruption Alert
- **Trigger**: Attempting to suspend or revoke staff currently handling an active order (e.g. `Ramesh Kumar` packing `Order #GV-9912`).
- **Behavior**: Warning banner forces choice: `"Reassign Order #GV-9912 before suspending"` or `"Force suspend and release order back to pending queue"`.

### 3. Duplicate Invite & Invalid Contact Interception
- **Trigger**: Entering an existing staff phone/email or improperly formatted contact string.
- **Behavior**: Instant inline validation error alert preventing invitation dispatch.

### 4. Expired Invitation Recovery
- **Trigger**: Invitation sent >72 hours ago without OTP authentication.
- **Behavior**: Status changes to `Invitation Expired` (Amber). One-click `Resend Fresh Invite Link` action updates expiry timestamp.

---

## 8. Color Palette & Typography Tokens
- **Background**: Warm Off-White `#F8FAFC`
- **Card Containers**: `#FFFFFF`
- **Primary Actions**: Royal Blue `#1D4ED8`
- **Active / Verified**: Emerald `#16A34A` / `#DCFCE7`
- **Pending / Attention**: Amber `#D97706` / `#FEF3C7`
- **Revocation / Security**: Rose `#DC2626` / `#FEE2E2`
- **Font Stack**: Inter, system-ui, -apple-system, sans-serif
