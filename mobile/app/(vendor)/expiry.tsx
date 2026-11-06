/**
 * Batches and expiry (PRD screen 16). GlowVai does not store batch or expiry data for store
 * stock yet, so nothing can be tracked or blocked here. The screen says so instead of
 * keeping expiry dates on the phone, where GlowVai could not act on them.
 * File: mobile/app/(vendor)/expiry.tsx
 */
import React from 'react';
import ComingLater from '../../src/features/catalog/ComingLater';

export default function ExpiryScreen() {
  return (
    <ComingLater
      title="Batches and expiry"
      heading="Expiry tracking is not available yet"
      icon="calendar-outline"
      message="GlowVai does not store batch numbers or expiry dates for your stock yet, so there is nothing to track here. Until it does, take expired items off the shelf and lower their stock in Inventory."
    />
  );
}
