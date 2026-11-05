/**
 * Packing now lives in the single Pick & pack screen (order-detail).
 * This route stays so existing links and notifications keep working.
 * File: mobile/app/(vendor)/pack-order.tsx
 */
import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function PackOrderRedirect() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  if (!orderId) return <Redirect href="/(vendor)/orders" />;
  return <Redirect href={{ pathname: '/(vendor)/order-detail', params: { orderId } } as any} />;
}
