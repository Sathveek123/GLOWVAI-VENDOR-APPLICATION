/**
 * The signed-in vendor's store, from GET /api/vendor/me (VendorMe), shaped for the Profile,
 * Bank account and Verification screens. Read-only: KYC data changes go through a support ticket.
 * The server never sends a full PAN, IFSC or account number; the app shows what it gets.
 */
import type { VendorMe, VendorState } from '../../services/vendorApi/account';
import { categoryName } from '../onboarding/application';
import { format24hForDisplay } from '../onboarding/validation';
import type { Tone } from '../money/ui';

export interface StateView {
  label: string;
  tone: Tone;
  /** A sentence for a banner, when the store cannot take orders normally. */
  banner: string | null;
}

export function stateView(state: VendorState): StateView {
  switch (state) {
    case 'APPROVED_ACTIVE':
      return { label: 'Approved', tone: 'success', banner: null };
    case 'APPROVED_PAUSED':
      return {
        label: 'Paused by GlowVai',
        tone: 'warning',
        banner: 'GlowVai has paused your store, so it does not receive new orders. You can still update stock. Contact support to find out more.',
      };
    case 'SUSPENDED':
      return { label: 'Suspended', tone: 'danger', banner: 'Your store is suspended and cannot receive orders. Contact GlowVai support.' };
    case 'UNDER_REVIEW':
      return { label: 'Under review', tone: 'info', banner: 'Your store is under review.' };
    case 'SUBMITTED':
      return { label: 'Submitted', tone: 'info', banner: 'Your application is waiting for review.' };
    case 'DOCUMENTS_REQUESTED':
      return { label: 'More information needed', tone: 'warning', banner: 'Our team needs more information before approving your store.' };
    case 'REJECTED':
      return { label: 'Not approved', tone: 'danger', banner: 'Your application was not approved.' };
    default:
      return { label: 'Not submitted', tone: 'neutral', banner: 'Your store details have not been submitted yet.' };
  }
}

/** "+919876543210" -> "+91 98765 43210" */
export function formatContact(v?: string | null): string {
  const d = String(v || '').replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : '';
}

export function hoursText(h?: { openTime: string; closeTime: string } | null): string {
  if (!h?.openTime || !h?.closeTime) return '';
  return `${format24hForDisplay(h.openTime)} to ${format24hForDisplay(h.closeTime)}`;
}

export function categoriesText(list?: string[] | null): string {
  return (list ?? []).map(categoryName).join(', ');
}

export function addressText(app: VendorMe['application']): string {
  if (!app) return '';
  return [app.streetAddress, app.city, app.state, app.pincode].filter(Boolean).join(', ');
}

/** "HDFC Bank •••• 1234" */
export function bankSummary(app: VendorMe['application']): string {
  const b = app?.bank;
  if (!b) return '';
  return [b.bankName, b.accLast4 ? `•••• ${b.accLast4}` : ''].filter(Boolean).join(' ');
}

/** Opens a prefilled support ticket asking GlowVai to change verified details. */
export function changeRequestRoute(subject: string): string {
  return `/(vendor)/support?category=ACCOUNT_ISSUE&subject=${encodeURIComponent(subject)}`;
}
