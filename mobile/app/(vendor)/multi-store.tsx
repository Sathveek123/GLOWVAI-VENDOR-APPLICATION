/**
 * Locations. Lists the store linked to the signed-in account. Adding more locations is not
 * connected yet, so that action is shown as unavailable rather than faked.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { vendorApi } from '../../src/services/api';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import { TypeScale } from '../../src/theme/typography';

type LoadState = 'loading' | 'ready' | 'error';

interface StoreLocation {
  id: string;
  name: string;
  address: string;
  isOnline: boolean;
  sample?: boolean;
}

// Development-only sample locations, so the list layout can be reviewed. Never shown in production.
const SAMPLE_LOCATIONS: StoreLocation[] = __DEV__
  ? [
      { id: 'SAMPLE-LOC-1', name: 'Sample dark store', address: 'Sample area, Sample city', isOnline: true, sample: true },
      { id: 'SAMPLE-LOC-2', name: 'Sample counter', address: 'Sample mall, Sample city', isOnline: false, sample: true },
    ]
  : [];

export default function MultiStoreScreen() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>('loading');
  const [stores, setStores] = useState<StoreLocation[]>([]);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await vendorApi.me();
      const v = res?.vendor || {};
      const list: StoreLocation[] = [];
      if (v.storeId || v.shopName) {
        list.push({
          id: v.storeId || 'store',
          name: v.shopName || 'Your store',
          address: [v.locality, v.city].filter(Boolean).join(', ') || 'Address not added yet',
          isOnline: !!v.isOnline,
        });
      }
      setStores(list);
      setState('ready');
    } catch (_) {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = [...stores, ...SAMPLE_LOCATIONS];

  return (
    <ScreenShell
      header={{ title: 'Locations', showBack: true }}
      backgroundColor={Colors.surface}
      contentContainerStyle={s.content}
    >
      {state === 'error' ? (
        <View style={s.errorBox} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={20} color={Colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={s.errorTitle}>We could not load your locations</Text>
            <Text style={s.errorBody}>Check your connection and try again.</Text>
          </View>
          <Pressable onPress={load} accessibilityRole="button" style={({ pressed }) => [s.retryBtn, pressed && { opacity: 0.7 }]}>
            <Text style={s.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={s.sectionLabel}>Your locations</Text>

      {state === 'loading' ? (
        <View style={s.loadingBox}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={s.loadingText}>Loading locations</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="storefront-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={s.emptyTitle}>No store linked yet</Text>
          <Text style={s.emptyBody}>Finish store onboarding to see your location here.</Text>
        </View>
      ) : (
        rows.map(loc => (
          <View key={loc.id} style={s.card}>
            <View style={s.cardIcon}>
              <Ionicons name="storefront-outline" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={s.nameRow}>
                <Text style={s.storeName} numberOfLines={1}>{loc.name}</Text>
                {loc.sample ? (
                  <View style={s.sampleChip}>
                    <Text style={s.sampleChipText}>Sample data</Text>
                  </View>
                ) : null}
              </View>
              <Text style={s.storeAddress} numberOfLines={2}>{loc.address}</Text>
              <View style={[s.pill, loc.isOnline ? s.pillOk : s.pillNeutral]}>
                <Text style={[s.pillText, { color: loc.isOnline ? '#15803D' : Colors.textSecondary }]}>
                  {loc.isOnline ? 'Accepting orders' : 'Not accepting orders'}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}

      <Text style={s.sectionLabel}>Add a location</Text>
      <View style={s.notice}>
        <View style={s.noticeIcon}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.noticeTitle}>Adding locations is not available yet</Text>
          <Text style={s.noticeBody}>
            Additional stores will be added here once multi-store management is connected.
          </Text>
        </View>
      </View>

      {stores.length > 0 ? (
        <Pressable
          onPress={() => router.push('/(vendor)/orders')}
          accessibilityRole="button"
          style={({ pressed }) => [s.linkCard, pressed && { backgroundColor: Colors.surface }]}
        >
          <Text style={s.linkText}>View orders</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSubtle} />
        </Pressable>
      ) : null}
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  errorTitle: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  errorBody: { ...TypeScale.caption, color: Colors.textSecondary, marginTop: 2 },
  retryBtn: { minHeight: 44, minWidth: 44, paddingHorizontal: Spacing.md, justifyContent: 'center', alignItems: 'center' },
  retryText: { ...TypeScale.bodyStrong, color: Colors.primary },

  sectionLabel: { ...TypeScale.label, color: Colors.textSecondary, textTransform: 'uppercase', marginTop: Spacing.md, marginBottom: Spacing.sm },
  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  loadingText: { ...TypeScale.body, color: Colors.textSecondary },

  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  storeName: { ...TypeScale.title, color: Colors.textPrimary, flexShrink: 1 },
  storeAddress: { ...TypeScale.body, color: Colors.textSecondary, marginTop: 2 },
  sampleChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  sampleChipText: { ...TypeScale.label, color: '#B45309' },
  pill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadii.pill, borderWidth: 1, alignSelf: 'flex-start', marginTop: Spacing.sm },
  pillOk: { backgroundColor: Colors.successLight, borderColor: Colors.successBorder },
  pillNeutral: { backgroundColor: Colors.surface, borderColor: Colors.border },
  pillText: { ...TypeScale.label },

  empty: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { ...TypeScale.title, color: Colors.textPrimary, textAlign: 'center' },
  emptyBody: { ...TypeScale.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },

  notice: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  noticeIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  noticeTitle: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  noticeBody: { ...TypeScale.body, color: Colors.textSecondary, marginTop: 2 },

  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkText: { ...TypeScale.bodyStrong, color: Colors.primary },
});
