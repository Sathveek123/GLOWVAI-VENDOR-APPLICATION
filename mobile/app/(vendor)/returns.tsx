/**
 * Returns and issue requests (PRD screen 18). There is no returns connection for stores
 * yet, so the screen says so plainly instead of showing sample claims. GlowVai decides
 * every refund; for a return question now, the vendor contacts GlowVai support.
 * File: mobile/app/(vendor)/returns.tsx
 */
import React from 'react';
import ComingLater from '../../src/features/catalog/ComingLater';

export default function ReturnsScreen() {
  return (
    <ComingLater
      title="Returns"
      heading="Returns are not shown in the app yet"
      icon="return-down-back-outline"
      message="Return and complaint requests for your orders will appear here once GlowVai connects them. GlowVai decides refunds. If a customer return reaches your store now, contact GlowVai support."
      action={{ label: 'Contact support', route: '/(vendor)/support' }}
    />
  );
}
