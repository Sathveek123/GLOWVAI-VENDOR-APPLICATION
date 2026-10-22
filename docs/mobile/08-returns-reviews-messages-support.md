# Mobile screens 08: returns, reviews, messages and support

**Covers:** `returns.tsx`, `reviews.tsx`, `messages.tsx`, `support.tsx`
**Feature docs:** [Feature 08: returns and reviews](../features/08-returns-and-reviews.md), [Feature 09: chat, support and notifications](../features/09-chat-support-and-notifications.md)

All four are Coming soon in production. Development builds show the full screens with sample data.

| Screen | Route | Purpose |
|---|---|---|
| Returns | `/(vendor)/returns` | Inspect and decide on customer return claims |
| Reviews | `/(vendor)/reviews` | Read ratings and reply publicly |
| Messages | `/(vendor)/messages` | Order chat with customers and substitution proposals |
| Support | `/(vendor)/support` | Tickets to the GlowVAI support desk |

## Returns (`returns.tsx`)

**Title:** "Returns" (in the Orders breadcrumb).

- **Inspection checklist:** unboxing photo evidence, seal, batch, expiry, condition.
- **Decision:** accept or reject. Rejection needs a reason from the list ("Select rejection reason").
- **Submit decision →** sends the decision.
- **States:** "Unreadable evidence" (ask for a new photo), undo.
- Development strip: "Test returns edge states".

## Reviews (`reviews.tsx`)

**Title:** "Ratings and reviews". Subtitle: "Verified reviews".

- **Filters:** all, unreplied, 5, 4, 3 and below.
- **Review card:** rating, excerpt, product, order, date, reply status.
- **Reply:** "Your public store reply message" field, with *Save draft* and send. Replies are public.
- **States:** skeleton loaders, network error, empty.

## Messages (`messages.tsx`)

**Title:** "Vendor–customer order chat".

- **Thread list:** one per order, with the order total and item count.
- **Composer:** text field with *Send →*. A failed message shows "Tap to retry send".
- **Substitution proposal:** a card suggesting a replacement (for example a shade) with accept or decline shown to the customer.
- **Blocked contact:** a notice when a contact is blocked.
- Development strip: "Test chat edge states", including *Simulate send failure*.

## Support (`support.tsx`)

**Title:** "Merchant support".

- **Ticket list:** filter by status (open, action required, resolved).
- **Ticket detail:** history, *Reopen ticket* for resolved tickets.
- **New ticket form:** subject or headline, priority, optional order or settlement reference, description, *Submit*.
- **Response time:** "Support desk online (about 12 minutes)". This is a fixed estimate.

## Known gaps

- None of these screens is connected to a backend. Replies, decisions, messages and tickets are local only.
- Photo evidence upload is not built.
- Escalation and "Escalate to Support" do not send anything yet.
