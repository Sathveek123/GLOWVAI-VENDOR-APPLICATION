# 💻 PC / Web Screen 24: Bank Account & UPI Management (Web)

## 📍 File & Web Route Specification
- **Mobile/Expo Route**: `mobile/app/(vendor)/bank-edit.tsx`
- **Web App View**: `web/index.html` (View: `#page-bank`)
- **Web URL**: `/settings/bank` or `index.html#bank`
- **Target Viewports**: 1024px, 1280px, 1440px (Reference Grid), 1920px Widescreen Monitors

---

## 🎯 Purpose & Desktop Interaction System
The GlowVAI Vendor Bank Account & UPI Management portal serves as a high-security payout destination manager. It protects store payout funds through strict masking, 2FA identity validation, real-time IFSC branch resolution, penny-drop verification, and a mandatory 24-hour security cooling hold policy.

### Key Desktop Workflows:
1. **Primary Bank Account Card**:
   - Displays current verified bank details: `HDFC Bank`, beneficiary holder name (`Priya Beauty Retail Pvt Ltd`), masked account number (`••••••4589`), IFSC (`HDFC0001234`), branch (`Benz Circle, Vijayawada`), and NPCI penny-drop verification badge.
2. **Masked UPI Payout Destination Card**:
   - Shows VPA handle (`glow••••@hdfcbank`), instant VPA verification ping button, and toggle to set UPI as default payout channel.
3. **Guided 3-Step Secure Change Modal Wizard**:
   - **Step 1 (SMS OTP Identity Verification)**: Requires 6-digit OTP sent to registered owner phone, features 30s resend timer, 3-attempt security lockout, and test chip (`4892`).
   - **Step 2 (New Bank / UPI Details)**: Account number input with paste-blocked confirm field to prevent typo errors, live IFSC lookup, and VPA handle check.
   - **Step 3 (Review & Confirmation)**: Side-by-side comparison matrix of current vs proposed bank details, mandatory confirmation checkbox, and security cooling hold notice.
4. **Mandatory 24-Hour Cooling Lock Notice**:
   `"⚠️ Security Notice: Changing bank details places daily payouts on a 24-hour verification cooling hold to prevent unauthorized redirection."`

---

## 🎨 Color Palette & Typography Tokens
- **Canvas Background**: Warm Off-White `#F8FAFC`
- **Verified Card**: White `#FFFFFF` with Emerald `#16A34A` verification badge
- **Cooling Notice**: Amber Gold `#D97706` / `#FEF3C7` background
- **Primary CTA**: Royal Blue `#1D4ED8`
- **Security Lockout**: Red `#DC2626` / `#FEF2F2`

---

## ⚡ Security & Accessibility Rules
- Confirm Account Number field strictly blocks clipboard `paste` events (`onpaste="return false;"`).
- All account numbers are masked post-submission (`••••••4589`).
- `Esc` key cancels the change modal only after user confirmation prompt.
