# Mobile screens 03: pending review and approved

**Covers:** `mobile/app/(onboarding)/pending.tsx`, `mobile/app/(onboarding)/approved.tsx`
**Feature docs:** [Feature 02: store onboarding](../features/02-store-onboarding.md)

Both screens are live in production.

## Pending review (`pending.tsx`)

**Title:** "Your store is under review". **Reference:** "Application ref ID" shows "Assigned after submission" until a submission exists.

- **Audit timeline:** each compliance check (store identity, business compliance, payout bank account) with a status. Until the backend reports progress, every check shows "Not started".
- **What happens next?** A short explanation of the review.
- **Submitted application copy:** read-only view of steps A–C, with "last updated" and "submitted on" dates.
- **Actions:** *Update documents & resubmit →* and *Edit application & re-apply →* (back into the onboarding steps), *Sign out*, *Launch command center* (only after approval).
- **Need help?** Contact card. Says the operations team is online 24/7.
- **Rejected state:** "Application rejected" with the reason and "Action needed on application".
- **Development strip:** "Test audit edge states" (under review, rejected, maintenance, approved). Hidden in production.

## Approved (`approved.tsx`)

**Title:** "Account approved & live". Message: "Your shop is now visible to nearby customers. Start receiving orders!"

- Summary tiles: rating, orders, earnings (all starting empty for a new store).
- Button: *Go to home*, which opens `/(vendor)/home`.

## Known gaps

- Nothing moves a store from pending to approved yet. Approval has to come from the backend or the admin console.
- The timeline statuses are not connected to any review data.
