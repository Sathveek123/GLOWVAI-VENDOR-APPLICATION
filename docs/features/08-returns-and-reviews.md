# Feature 08: Returns and reviews

**Status:** screens are built. Returns use the backend `GET /api/returns` and `POST /api/returns` endpoints when available. Mobile screens are Coming-soon placeholders in production.
**Screens:** [Mobile: returns, reviews, messages and support](../mobile/08-returns-reviews-messages-support.md), [Web: returns, reviews and messages](../web/05-returns-reviews-and-messages.md)

## What it does

Customers can return items that arrive damaged, leaking, wrong, or expired. The store inspects the photo evidence and accepts or rejects the claim. Customers also leave ratings, and the store can reply publicly.

## Returns

**Reasons:** damaged, leaking seal, incorrect item, expired item.

**Inspection checklist:** unboxing photo evidence, seal, batch and expiry check, product condition. The vendor records a decision and, for a rejection, selects a reason.

**Claim fields:** order and claim ID, customer (privacy safe), product item, claim reason, refund request, SLA status.

**States:** unreadable evidence (ask for a new photo), undo, and a submit confirmation.

## Reviews

- Rating filters: all, unreplied, 5 star, 4 star, 3 star and below.
- Category filter: product quality and others.
- Each review shows the customer's name in a privacy-safe form, the order and item, the rating, the date, and the excerpt.
- Reply: the store writes a public reply, which can be saved as a draft.

## Rules shown in the screens

- Customer names are shown in a "Privacy Safe" form.
- Store replies are public, so they should be written as if every customer can read them.

## Known gaps

- Photo evidence is shown from sample data. Upload is not connected.
- Reviews and replies use sample data on the web.
- No moderation action (removing a review) appears in the screens.
