/**
 * Batches and expiry (PRD screen 16).
 * Built from the expiry date saved on each store item (inventoryApi). Expired stock is
 * shown in its own blocked section: the only actions are to stop selling it and remove it
 * from stock. Near-expiry stock is flagged so it is sold first. There are no discount or
 * "priority shelf" promotions. Batch-level tracking is not connected yet and says so.
 * File: mobile/app/(vendor)/expiry.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import { View, Text, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenShell from '../../src/components/ScreenShell';
import { inventoryApi } from '../../src/services/api';
import type { InventoryItem } from '../../src/store/useVendorStore';
import { Colors, Spacing as S } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';
import { Banner, Button, useLayout, useDocumentTitle } from '../../src/features/onboarding/kit';
import { useCatalogue, useStoreInventory } from '../../src/features/catalog/hooks';
import {
  daysUntil,
  expiryLine,
  expiryState,
  findCatalogMatch,
  friendlyError,
  onHand,
  reserved,
  NEAR_EXPIRY_DAYS,
} from '../../src/features/catalog/stock';
import { EmptyState, Pill, ProductThumb, SectionTitle, Sheet, SkeletonRows, Toast, cardStyle, useToast } from '../../src/features/catalog/ui';

export default function ExpiryScreen() {
  const router = useRouter();
  const { isPhone } = useLayout();
  useDocumentTitle('Batches and expiry');

  const { items, state, error, reload, updateInventoryItem } = useStoreInventory();
  const catalogue = useCatalogue();
  const { toast, showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<InventoryItem | null>(null);
  const [actionError, setActionError] = useState('');

  const photoOf = (item: InventoryItem) =>
    item.images?.[0] || findCatalogMatch(item, catalogue.byId, catalogue.products)?.pictures[0];

  const groups = useMemo(() => {
    const byDays = (a: InventoryItem, b: InventoryItem) => (daysUntil(a.expiryDate) ?? 0) - (daysUntil(b.expiryDate) ?? 0);
    return {
      expired: items.filter(i => expiryState(i) === 'expired' && (onHand(i) > 0 || i.active)).sort(byDays),
      soon: items.filter(i => expiryState(i) === 'soon' && onHand(i) > 0).sort(byDays),
      fine: items.filter(i => expiryState(i) === 'ok').length,
      missing: items.filter(i => expiryState(i) === 'none' && onHand(i) > 0).length,
    };
  }, [items]);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const stopSelling = async (item: InventoryItem) => {
    if (busyId) return;
    setBusyId(item.productId);
    setActionError('');
    try {
      const res: any = await inventoryApi.update(item.productId, { active: false });
      updateInventoryItem(item.productId, res?.item || { active: false, status: 'paused', updatedAt: Date.now() });
      showToast('Selling stopped. Customers will not see this product.');
    } catch (err) {
      setActionError(`Selling was not stopped. ${friendlyError(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const removeFromStock = async (item: InventoryItem) => {
    setBusyId(item.productId);
    setActionError('');
    try {
      const res: any = await inventoryApi.setStockExact(item.productId, 0, 'Expired: removed from stock');
      updateInventoryItem(item.productId, res?.item || { stock: 0, stockOnHand: 0, updatedAt: Date.now() });
      setRemoving(null);
      showToast('Removed from stock. Keep expired units away from the shelf.');
    } catch (err) {
      setActionError(`Stock was not changed. ${friendlyError(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const pad = isPhone ? S.lg : S.xl;
  const issues = groups.expired.length + groups.soon.length;

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{
          title: 'Batches and expiry',
          subtitle: state === 'ready' ? (issues ? `${issues} need attention` : 'Nothing expiring soon') : undefined,
          showBack: true,
        }}
        backgroundColor={Colors.surface}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        testID="expiry-screen"
      >
        <View style={[s.body, { paddingHorizontal: pad }]}>
          {state === 'loading' ? (
            <SkeletonRows count={3} />
          ) : state === 'error' ? (
            <EmptyState
              tone="danger"
              icon="cloud-offline-outline"
              title="Expiry dates did not load"
              message={error}
              action={{ label: 'Try again', onPress: () => void reload() }}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No stock to check yet"
              message="Expiry dates appear here once you add products to your store with the date printed on the pack."
              action={{ label: 'Add from GlowVai catalogue', onPress: () => router.push('/(vendor)/add-sku') }}
            />
          ) : (
            <>
              {actionError ? <Banner tone="error" message={actionError} style={{ marginBottom: 0 }} /> : null}

              {groups.expired.length > 0 ? (
                <View style={[cardStyle, s.section]}>
                  <View style={[s.sectionHead, s.dangerHead]}>
                    <Ionicons name="ban-outline" size={18} color={Colors.danger} />
                    <View style={{ flex: 1 }}>
                      <Text accessibilityRole="header" style={[s.sectionTitle, { color: Colors.danger }]}>Expired · not for sale</Text>
                      <Text style={s.sectionHint}>Take these off the shelf. They must not be packed for any order.</Text>
                    </View>
                  </View>
                  {groups.expired.map(item => {
                    const held = reserved(item);
                    return (
                      <View key={item.productId} style={s.row}>
                        <ProductThumb uri={photoOf(item)} brand={item.brand} label={item.name} size={48} />
                        <View style={s.rowInfo}>
                          <Text style={s.name} numberOfLines={2}>{item.name}</Text>
                          <Text style={[s.meta, { color: Colors.danger }]}>{expiryLine(item.expiryDate)}</Text>
                          <Text style={s.meta}>{onHand(item)} on the shelf{held ? ` · ${held} held for orders` : ''}</Text>
                          {item.active ? <Pill label="Still visible to customers" tone="danger" icon="alert-circle" /> : <Pill label="Selling stopped" tone="neutral" />}
                          {held ? (
                            <Text style={s.meta}>Units are held for open orders. Do not pack them; contact GlowVai support.</Text>
                          ) : null}
                          <View style={s.actions}>
                            {item.active ? (
                              <Button label="Stop selling" compact loading={busyId === item.productId} onPress={() => stopSelling(item)} accessibilityLabel={`Stop selling ${item.name}`} />
                            ) : null}
                            {onHand(item) > 0 && !held ? (
                              <Button label="Remove from stock" variant="danger" compact onPress={() => { setActionError(''); setRemoving(item); }} accessibilityLabel={`Remove ${item.name} from stock`} />
                            ) : null}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <View style={[cardStyle, s.section]}>
                <View style={s.sectionHead}>
                  <Ionicons name="time-outline" size={18} color={Colors.warning} />
                  <SectionTitle
                    title={`Expiring within ${NEAR_EXPIRY_DAYS} days`}
                    hint={groups.soon.length ? 'Sell these first. Earliest expiry is at the top.' : undefined}
                    style={{ flex: 1 }}
                  />
                </View>
                {groups.soon.length === 0 ? (
                  <Text style={[s.meta, s.none]}>Nothing expires in the next {NEAR_EXPIRY_DAYS} days.</Text>
                ) : (
                  groups.soon.map(item => (
                    <View key={item.productId} style={s.row}>
                      <ProductThumb uri={photoOf(item)} brand={item.brand} label={item.name} size={48} />
                      <View style={s.rowInfo}>
                        <Text style={s.name} numberOfLines={2}>{item.name}</Text>
                        <Text style={[s.meta, { color: Colors.warning }]}>{expiryLine(item.expiryDate)}</Text>
                      </View>
                      <Text style={s.qty}>{onHand(item)}</Text>
                    </View>
                  ))
                )}
              </View>

              <View style={[cardStyle, s.summary]}>
                <SummaryLine icon="checkmark-circle-outline" color={Colors.success} text={`${groups.fine} ${groups.fine === 1 ? 'product has' : 'products have'} more than ${NEAR_EXPIRY_DAYS} days left`} />
                {groups.missing > 0 ? (
                  <SummaryLine
                    icon="help-circle-outline"
                    color={Colors.textMuted}
                    text={`${groups.missing} ${groups.missing === 1 ? 'product has' : 'products have'} no expiry date saved. Add it when you next receive stock.`}
                  />
                ) : null}
              </View>

              <Banner
                tone="info"
                title="Batch tracking is not available yet"
                message="Dates here are one per product, taken from when the stock was added. Batch numbers, quarantine and return to supplier will come with batch tracking."
                style={{ marginBottom: 0 }}
              />
            </>
          )}
        </View>
      </ScreenShell>

      <Sheet
        visible={!!removing}
        title="Remove expired stock?"
        onClose={() => setRemoving(null)}
        footer={
          removing ? (
            <Button
              label={`Remove ${onHand(removing)} from stock`}
              variant="danger"
              loading={busyId === removing.productId}
              onPress={() => removeFromStock(removing)}
            />
          ) : null
        }
      >
        {removing ? (
          <>
            <Text style={s.sheetText}>
              {removing.name}: stock goes from {onHand(removing)} to 0, recorded as "Expired: removed from stock". Keep the units aside for disposal or return to the supplier.
            </Text>
            {actionError ? <Banner tone="error" message={actionError} style={{ marginTop: S.md, marginBottom: 0 }} /> : null}
          </>
        ) : null}
      </Sheet>

      <Toast text={toast} />
    </View>
  );
}

function SummaryLine({ icon, color, text }: { icon: keyof typeof Ionicons.glyphMap; color: string; text: string }) {
  return (
    <View style={s.summaryLine}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[s.meta, { flex: 1, fontSize: 14, lineHeight: 20 }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  body: { paddingTop: S.lg, paddingBottom: S.xxl * 2, gap: S.md },

  section: { overflow: 'hidden' },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, padding: S.lg, paddingBottom: S.sm },
  dangerHead: { backgroundColor: Colors.dangerLight, paddingBottom: S.md },
  sectionTitle: { ...TypeScale.bodyStrong, fontSize: 15 },
  sectionHint: { ...TypeScale.caption, color: Colors.textSecondary, marginTop: 2 },
  none: { paddingHorizontal: S.lg, paddingBottom: S.lg },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.md,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  rowInfo: { flex: 1, minWidth: 0, gap: 4 },
  name: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20, color: Colors.textPrimary },
  meta: { ...TypeScale.caption, color: Colors.textSecondary },
  qty: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.xs },

  summary: { padding: S.lg, gap: S.sm },
  summaryLine: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  sheetText: { ...TypeScale.body, color: Colors.textPrimary },
});
