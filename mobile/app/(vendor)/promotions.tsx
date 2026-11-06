/**
 * Promotions are a later phase. Who funds a discount is not decided yet, and discounts change
 * vendor money, so nothing here can create or show a campaign.
 * File: mobile/app/(vendor)/promotions.tsx
 */
import React from 'react';
import ComingLater from '../../src/features/catalog/ComingLater';

export default function PromotionsScreen() {
  return (
    <ComingLater
      title="Promotions"
      heading="Promotions are not available yet"
      icon="pricetags-outline"
      message="Running discounts on your products will come in a later update. Until then, no discounts are applied to your products from this app. You can set your own price, up to the MRP, in Inventory."
    />
  );
}
