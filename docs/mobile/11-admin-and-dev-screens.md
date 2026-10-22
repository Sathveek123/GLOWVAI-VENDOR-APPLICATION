# Mobile screens 11: admin and developer screens

**Covers:** `mobile/app/admin.tsx`, `mobile/app/dev/header.tsx`

These screens are for GlowVAI staff and developers. They are not part of the vendor experience.

## Admin console (`admin.tsx`)

**Title:** "GlowVAI master control tower" and "Vijayawada dark store central operations".

- Gross sales today, SLA average, riders ready, live orders.
- Live operations list with "Inspect hub" and "Resolve escalation" actions.
- Regulatory and FSSAI compliance section, and daily settlement batches (T+1).
- Two links into the vendor console.

**Production:** the export returns nothing (`__DEV__ ? <AdminConsole /> : null`), so the screen is not reachable in release builds.

**Known gap:** admin role checks are not implemented.

## Developer header preview (`dev/header.tsx`)

A preview of the header component with its states: notch simulation (top inset), font scale at 130%, and sample store and order-count labels.

**Production:** returns nothing, like the admin screen.

**Use:** check header layout and text scaling during development. See [Development: testing](../development/03-testing-and-qa.md).
