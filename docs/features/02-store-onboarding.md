# Feature 02: Store onboarding

**Status:** the four steps and the review screens are built. Document upload and the server submit are not connected.
**Screens:** [Mobile: onboarding steps A–D](../mobile/02-onboarding-steps-a-to-d.md), [Mobile: pending and approved](../mobile/03-onboarding-pending-and-approved.md), [Web: onboarding A–D and pending](../web/02-onboarding-and-approval.md)

## What it does

A new dark-store owner registers the store in four steps, then waits for compliance review. Approval unlocks the vendor console.

## Steps

| Step | Screen | Collects | Validation |
|---|---|---|---|
| A | `step-a.tsx` | Store name, owner name, city, locality, pincode, opening and closing times, GPS pin | All required fields. GPS is required. Closing time cannot conflict with opening time. |
| B | `step-b.tsx` | GSTIN, business/owner PAN, cosmetics retail licence number and expiry, trade licence (optional), store-front photo, owner ID, GST certificate | GSTIN is 15 characters, PAN is 10 characters. Files up to 5 MB, PDF/JPG/PNG. |
| C | `step-c.tsx` | Account number (typed twice to confirm), IFSC, beneficiary name, UPI handle (optional) | IFSC is 11 characters. Account numbers must match. |
| D | `step-d.tsx` | Beauty categories and starter SKUs | At least one category. Terms must be accepted. |

Defaults are empty on purpose. The app does not pre-fill a store, a GSTIN, or a bank account.

## Submit

Step D calls `onboardingApi.submit` (`POST /api/onboarding/submit`) with the data from steps A–C. Until the backend accepts it, the screen shows the API failure state.

## Review states

- **Pending** (`pending.tsx`): "Your store is under review", a timeline of compliance checks, the submitted copy (read only), and an option to edit and resubmit.
- **Rejected:** shows the reason and an action to correct the application.
- **Approved** (`approved.tsx`): a "You're live" confirmation with a button into the vendor console.

## Known gaps

- Documents are picked on the device only. Nothing is uploaded.
- Approval is not automatic. Only the backend or an admin should move a store to `approved`, and that workflow is not built yet.
- The "under review" timeline shows steps as not started until the backend reports progress.

## Related

- [Feature 07](07-earnings-payouts-and-tax.md) for how the bank details are used after approval.
- [Feature 11](11-team-security-and-compliance.md) for compliance audit trails.
