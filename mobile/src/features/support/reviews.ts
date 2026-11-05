/**
 * Ratings and reviews (PRD screen 19). Only verified, delivered orders produce reviews.
 * The vendor backend has no reviews endpoint yet, so fetchReviews reports `connected: false`.
 * Reporting a review is not connected either (REVIEW_REPORTING_CONNECTED).
 */
import { pickNum, pickStr, toMs } from '../money/format';

export const REVIEW_REPORTING_CONNECTED = false;

export interface Review {
  id: string;
  rating: number; // 1-5
  /** First name only. Never a full name, phone or address. */
  firstName: string | null;
  product: string | null;
  text: string | null;
  atMs: number | null;
  orderId: string | null;
}

export interface RatingSummary {
  average: number;
  count: number;
  /** Count of reviews per star, index 0 = 1 star ... index 4 = 5 stars. */
  distribution: [number, number, number, number, number];
}

export function normalizeReview(raw: any): Review | null {
  const id = pickStr(raw, ['reviewId', 'id']);
  const rating = pickNum(raw, ['rating', 'stars']);
  if (!id || rating === null || rating < 1 || rating > 5) return null;
  const name = pickStr(raw, ['customerFirstName', 'firstName', 'displayName']);
  return {
    id,
    rating: Math.round(rating),
    firstName: name ? name.split(/\s+/)[0] : null,
    product: pickStr(raw, ['productName', 'product']),
    text: pickStr(raw, ['text', 'comment', 'review']),
    atMs: toMs(raw?.createdAt),
    orderId: pickStr(raw, ['orderId']),
  };
}

/** Computes the summary from the reviews themselves, so the numbers always match the list. */
export function summarize(reviews: Review[]): RatingSummary | null {
  if (reviews.length === 0) return null;
  const distribution: RatingSummary['distribution'] = [0, 0, 0, 0, 0];
  let total = 0;
  for (const r of reviews) {
    distribution[r.rating - 1] += 1;
    total += r.rating;
  }
  return { average: Math.round((total / reviews.length) * 10) / 10, count: reviews.length, distribution };
}

export async function fetchReviews(): Promise<{ connected: false } | { connected: true; items: Review[] }> {
  return { connected: false };
}
