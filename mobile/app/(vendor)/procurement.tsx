/**
 * Supplier purchase orders are outside the vendor app's launch scope (PRD 1.1, 13.3).
 * File: mobile/app/(vendor)/procurement.tsx
 */
import React from 'react';
import ComingLater from '../../src/features/catalog/ComingLater';

export default function ProcurementScreen() {
  return (
    <ComingLater
      title="Purchase orders"
      heading="Purchase orders are not available yet"
      icon="clipboard-outline"
      message="Ordering from suppliers is not part of the GlowVai seller app yet. Keep buying stock the way you do today and update quantities in Inventory."
    />
  );
}
