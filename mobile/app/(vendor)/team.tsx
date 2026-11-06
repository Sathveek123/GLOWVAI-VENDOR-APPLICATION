/**
 * Staff access. One sign-in per store for now; adding staff accounts is not available yet.
 * File: mobile/app/(vendor)/team.tsx
 */
import React from 'react';
import ComingLater from '../../src/features/catalog/ComingLater';

export default function TeamScreen() {
  return (
    <ComingLater
      title="Team"
      heading="Staff accounts are not available yet"
      icon="people-outline"
      message="Each store has one GlowVai sign-in for now. Adding staff with their own sign-in will come later. Do not share your password; contact GlowVai support if someone else needs access."
      action={{ label: 'Go to Home', route: '/(vendor)/home' }}
    />
  );
}
