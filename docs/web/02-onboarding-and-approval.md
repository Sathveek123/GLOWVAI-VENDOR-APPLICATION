# Web pages 02: onboarding and approval

**Covers:** `page-onboarding-a`, `page-onboarding-b`, `page-onboarding-c`, `page-onboarding-d`, `page-onboarding-pending`
**Feature docs:** [Feature 02: store onboarding](../features/02-store-onboarding.md)

The web onboarding follows the same four steps as the mobile app ([mobile screens 02](../mobile/02-onboarding-steps-a-to-d.md)).

## Step A: store (`page-onboarding-a`)

- "Tell us about your store". Fields: store name, owner or manager name, locality, city, pincode, opening and closing time.
- GPS pin: search and a map. The pin is where riders navigate to.
- Actions: *Save draft* and *Continue to documents →*.

## Step B: compliance (`page-onboarding-b`)

- "Business verification and compliance". Tax identity: GSTIN (15 digits), business or owner PAN.
- Retail licences: cosmetics retail licence number and expiry date.
- Required documents: upload cards. Accepts up to 5 MB per file.
- Action: *Continue to bank setup →*.

## Step C: bank (`page-onboarding-c`)

- "Step 3 of 4: bank payout account and UPI setup". Account number, IFSC, instant payout UPI ID.
- Action: *Proceed to beauty categories*.

## Step D: categories (`page-onboarding-d`)

- "Step 4 of 4: skincare and cosmetics categories".
- Action: *Submit onboarding dossier*.

## Pending and approved (`page-onboarding-pending`)

- "Dark store audit and activation status". Shows the compliance checks.
- When approved: "Store onboarding approved!" with *Launch store command center 🚀*.
- The approval state is not set by any backend yet. The page reflects what the prototype stores locally.

## Known gaps

- Uploads are not sent to a server.
- Approval is not automatic and has no backend workflow yet.
- The step labels use a "Screen 08" number from an older spec. Treat the numbers as internal.
