# Web pages 05: returns, reviews and messages

**Covers:** `page-returns`, `page-reviews`, `page-messages`
**Feature docs:** [Feature 08: returns and reviews](../features/08-returns-and-reviews.md), [Feature 09: chat, support and notifications](../features/09-chat-support-and-notifications.md)
**Mobile equivalents:** [mobile screens 08](../mobile/08-returns-reviews-messages-support.md)

## Returns and inspection (`page-returns`)

**Title:** "Customer returns and inspection".

- **Reason filters:** all, damaged, leaking seal, incorrect item, expired item.
- **Table:** order and claim ID, customer (privacy safe), product, claim reason, refund request, SLA status, status.
- **Inspection action:** *Open inspection →*.

## Ratings and reviews (`page-reviews`)

**Title:** "Ratings and reviews". Period selector: last 30 days.

- Overall rating and product quality score.
- **Tabs:** all, unreplied, 5 star, 4 star, 3 star and below.
- **Table or cards:** customer (privacy safe), order and item, rating, date, excerpt, reply status.
- **Actions:** *Reply →*, *View reply*.

## Order chat (`page-messages`)

**Title:** "Vendor–customer order chat".

- Order list on the left, thread on the right.
- Quick replies (for example "Your replacement is ready", "Order is being packed", "Sealed and ready for pickup").
- *Send →*. *Escalate to support* and *Open order details workspace →*.

## Known gaps

- Sample data throughout.
- Chat does not connect to a messaging service.
- Replies and decisions are not saved.
