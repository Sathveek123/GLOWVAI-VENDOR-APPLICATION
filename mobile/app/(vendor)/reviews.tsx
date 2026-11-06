/**
 * Ratings and reviews (PRD screen 19). Order-linked reviews are not connected for stores
 * yet, so there is no rating to show. No sample ratings or reviews.
 * File: mobile/app/(vendor)/reviews.tsx
 */
import React from 'react';
import ComingLater from '../../src/features/catalog/ComingLater';

export default function ReviewsScreen() {
  return (
    <ComingLater
      title="Ratings and reviews"
      heading="Reviews are not available yet"
      icon="star-outline"
      message="Customer ratings for orders from your store will appear here once GlowVai connects them. Only verified orders will be able to leave a review."
      action={{ label: 'Go to Home', route: '/(vendor)/home' }}
    />
  );
}
