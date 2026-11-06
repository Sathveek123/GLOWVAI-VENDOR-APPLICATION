/**
 * Support tickets (PRD screen 20) for the Help & support screen: status labels and the
 * on-device checks for a new ticket (the server applies the same limits).
 * Data: supportApi (src/services/vendorApi/support.ts), GET/POST /api/vendor/support.
 */
import type { Tone } from '../money/ui';
import { ORDER_ID_RE, TICKET_CATEGORIES, TICKET_LIMITS, type TicketCategory } from '../../services/vendorApi/support';

const STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: 'Open', tone: 'info' },
  IN_PROGRESS: { label: 'In progress', tone: 'info' },
  WAITING_CUSTOMER: { label: 'Waiting for you', tone: 'warning' },
  RESOLVED: { label: 'Resolved', tone: 'success' },
};

export function ticketStatus(status: string): { label: string; tone: Tone } {
  return STATUS[String(status || '').toUpperCase()] ?? { label: 'Status not available', tone: 'neutral' };
}

export const isTicketCategory = (v: string): v is TicketCategory => TICKET_CATEGORIES.some(c => c.id === v);

export interface TicketDraft {
  category: TicketCategory | '';
  subject: string;
  description: string;
  orderId: string;
}

export function ticketErrors(t: TicketDraft): Record<keyof TicketDraft, string> {
  const subject = t.subject.trim();
  const description = t.description.trim();
  const orderId = t.orderId.trim();
  return {
    category: t.category ? '' : 'Choose what the problem is about',
    subject:
      subject.length < TICKET_LIMITS.subjectMin
        ? 'Add a short subject'
        : subject.length > TICKET_LIMITS.subjectMax
          ? `Keep the subject under ${TICKET_LIMITS.subjectMax} characters`
          : '',
    description:
      description.length < TICKET_LIMITS.descriptionMin
        ? `Describe the problem in at least ${TICKET_LIMITS.descriptionMin} characters`
        : description.length > TICKET_LIMITS.descriptionMax
          ? `Keep it under ${TICKET_LIMITS.descriptionMax} characters`
          : '',
    orderId: orderId && !ORDER_ID_RE.test(orderId) ? 'Use the order reference exactly as shown on the order' : '',
  };
}

/** Text that looks like a secret or a customer contact, which must never go into a ticket. */
const SENSITIVE = /\b(otp|cvv|upi ?pin|password|pin code is)\b|(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/i;

export const looksSensitive = (text: string) => SENSITIVE.test(text);
