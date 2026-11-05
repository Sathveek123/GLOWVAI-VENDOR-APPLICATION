/**
 * Demand and stock suggestions (PRD screen 17) are a later-phase feature (PRD 13.3).
 * They will be built from real GlowVai order data once there is enough of it.
 * File: mobile/app/(vendor)/recommended-skus.tsx
 */
import React from 'react';
import ComingLater from '../../src/features/catalog/ComingLater';

export default function RecommendedSkusScreen() {
  return (
    <ComingLater
      title="Stock suggestions"
      message="Suggestions on what to stock will come once GlowVai has enough real orders from stores near you. Until then, add products from the GlowVai catalogue."
    />
  );
}
