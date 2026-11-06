/**
 * Support tickets: GET and POST /api/vendor/support (docs/VENDOR_API.md).
 * A ticket opens in the GlowVai admin panel (Customer Support and Trust); staff replies come back
 * on the ticket. Internal notes and staff assignment never reach the app.
 */
import { vendorFetch } from './http';

/** Ticket categories a store may choose (the server's VENDOR_TICKET_CATEGORIES). */
export const TICKET_CATEGORIES = [
  { id: 'ORDER_DELAY', label: 'Order delayed' },
  { id: 'CANCELLATION_REQUEST', label: 'Cancel an order' },
  { id: 'WRONG_PRODUCT', label: 'Wrong product' },
  { id: 'MISSING_PRODUCT', label: 'Missing product' },
  { id: 'DAMAGED_PRODUCT', label: 'Damaged product' },
  { id: 'DELIVERY_PROBLEM', label: 'Delivery or pickup' },
  { id: 'PAYMENT_ISSUE', label: 'Payment or payout' },
  { id: 'ACCOUNT_ISSUE', label: 'My account or store details' },
  { id: 'SUSPECTED_COUNTERFEIT', label: 'Suspected fake product' },
  { id: 'PRODUCT_SAFETY', label: 'Product safety' },
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number]['id'];

export const ticketCategoryLabel = (id: string) => TICKET_CATEGORIES.find(c => c.id === id)?.label ?? 'Other';

export interface TicketMessage {
  at: string | number | null;
  kind: string;
  text: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  /** Admin ticket status: OPEN, IN_PROGRESS, WAITING_CUSTOMER or RESOLVED. */
  status: string;
  orderId: string | null;
  /** ISO time. */
  createdAt: string;
  resolution: string | null;
  messages: TicketMessage[];
}

export interface NewTicket {
  category: TicketCategory;
  /** 3 to 120 characters. */
  subject: string;
  /** 10 to 2000 characters. */
  description: string;
  orderId?: string;
}

/** Same limits as the server (lib/vendor/validation.ts parseTicket). */
export const TICKET_LIMITS = { subjectMin: 3, subjectMax: 120, descriptionMin: 10, descriptionMax: 2000 } as const;
export const ORDER_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export const supportApi = {
  /** My tickets, newest first (up to 30). */
  list: () => vendorFetch<{ ok: true; tickets: SupportTicket[] }>('/api/vendor/support'),
  /** Opens a ticket. Rate limited to 5 per hour per store. */
  create: (ticket: NewTicket) =>
    vendorFetch<{ ok: true; ticketId: string }>('/api/vendor/support', {
      method: 'POST',
      body: {
        category: ticket.category,
        subject: ticket.subject.trim(),
        description: ticket.description.trim(),
        ...(ticket.orderId?.trim() ? { orderId: ticket.orderId.trim() } : {}),
      },
    }),
};
