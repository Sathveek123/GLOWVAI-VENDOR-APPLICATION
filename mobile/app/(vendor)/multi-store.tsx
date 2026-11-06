/**
 * More than one store under one account is not available yet.
 * File: mobile/app/(vendor)/multi-store.tsx
 */
import React from 'react';
import ComingLater from '../../src/features/catalog/ComingLater';

export default function MultiStoreScreen() {
  return (
    <ComingLater
      title="Stores"
      heading="Managing several stores is not available yet"
      icon="storefront-outline"
      message="Each GlowVai sign-in runs one store for now. If you run another store, it needs its own application. Managing several stores from one account will come later."
      action={{ label: 'Go to Home', route: '/(vendor)/home' }}
    />
  );
}
