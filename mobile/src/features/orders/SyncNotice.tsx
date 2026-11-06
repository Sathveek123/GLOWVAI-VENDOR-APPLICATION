/**
 * The quiet line shown when the last order refresh failed: "Couldn't refresh · Retry".
 * The last good list stays on screen; polling keeps retrying with a longer wait.
 * File: mobile/src/features/orders/SyncNotice.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '../../theme/tokens';
import { FontFamily } from '../../theme/typography';
import useVendorStore from '../../store/useVendorStore';
import { refreshOrdersNow } from './sync';
import { formatClock } from './model';

export default function SyncNotice() {
  const sync = useVendorStore(s => s.ordersSync);
  const [busy, setBusy] = useState(false);
  if (!sync.hasLoaded || sync.state !== 'error') return null;

  const retry = async () => {
    setBusy(true);
    await refreshOrdersNow();
    setBusy(false);
  };

  return (
    <View style={s.row} accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={16} color={Colors.textMuted} />
      <Text style={s.text} numberOfLines={2}>
        Couldn't refresh{sync.lastSyncedAt ? ` · last updated ${formatClock(sync.lastSyncedAt)}` : ''}
      </Text>
      <Pressable onPress={retry} disabled={busy} accessibilityRole="button" accessibilityLabel="Retry refreshing orders" style={s.btn}>
        {busy ? <ActivityIndicator size="small" color={Colors.primary} /> : <Text style={s.btnText}>Retry</Text>}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: 44 },
  text: { flex: 1, fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, color: Colors.textSecondary },
  btn: { minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.sm },
  btnText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },
});
