/**
 * One order in a list. The whole card is the tap target. No customer details.
 * File: mobile/src/features/orders/OrderCard.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '../../theme/tokens';
import { FontFamily } from '../../theme/typography';
import type { Order } from '../../store/useVendorStore';
import { formatAgo, formatINR, itemsSummary, statusMeta, unitCount, unitsLabel } from './model';
import { StatusPill, ui } from './ui';

export default function OrderCard({
  order,
  onPress,
  now,
  actionLabel,
}: {
  order: Order;
  onPress: () => void;
  now?: number;
  /** Short verb shown at the right, e.g. "Pack" or "Review". */
  actionLabel?: string;
}) {
  const units = unitCount(order);
  const meta = statusMeta(order);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.reference}, ${meta.label}, ${unitsLabel(units)}, items value ${formatINR(order.itemsValue)}${actionLabel ? `. ${actionLabel}` : ''}`}
      style={({ pressed }) => [ui.card, oc.card, pressed && { backgroundColor: Colors.surface }]}
    >
      <View style={oc.top}>
        <Text style={oc.ref} numberOfLines={1}>{order.reference}</Text>
        <StatusPill order={order} />
      </View>
      <Text style={oc.items} numberOfLines={2}>{itemsSummary(order) || 'No items listed'}</Text>
      <View style={oc.bottom}>
        <Text style={oc.meta} numberOfLines={1}>
          {[unitsLabel(units), formatINR(order.itemsValue), `placed ${formatAgo(order.placedAt, now)}`].join(' · ')}
        </Text>
        {actionLabel ? (
          <View style={oc.action}>
            <Text style={oc.actionText}>{actionLabel}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

const oc = StyleSheet.create({
  card: { gap: 6, paddingVertical: Spacing.md, minHeight: 88 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  ref: { flexShrink: 1, fontFamily: FontFamily.mono, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  items: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: Colors.textSecondary },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  meta: { flex: 1, fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textMuted, fontVariant: ['tabular-nums'] },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },
});
