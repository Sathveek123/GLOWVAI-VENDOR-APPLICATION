/**
 * Recommended products: demand-based suggestions for the store.
 * There is no live recommendations API yet, so production shows an honest empty state.
 * Sample suggestions appear only in development builds, labelled "Sample data".
 * File: mobile/app/(vendor)/recommended-skus.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, type DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenShell from '../../src/components/ScreenShell';
import useVendorStore from '../../src/store/useVendorStore';
import {
  Banner,
  Button,
  Section,
  S,
  R,
  SellerColors as C,
  useLayout,
  useDocumentTitle,
} from '../../src/features/onboarding/kit';
import { FontFamily } from '../../src/theme/typography';

const FILTERS = ['All', 'Skincare', 'Makeup', 'Hair care', 'Fragrance'];

export interface AIRecommendationItem {
  id: string;
  brand: string;
  name: string;
  variant: string;
  category: string;
  mrp: number;
  estimatedOrdersPerMonth: number;
  potentialMarginPercent: number;
  confidenceLabel: string;
  suggestedStartQty: number;
  supplierAvailable: boolean;
  reasons: string[];
  comparableProduct?: string;
  expectedPriceBand?: string;
  stockRiskExplanation?: string;
}

// Development-only sample suggestions. Shown only when __DEV__.
const SAMPLE_RECOMMENDATIONS: AIRecommendationItem[] = [
  {
    id: 'REC-101',
    brand: 'Minimalist',
    name: 'Minimalist 2% Alpha Arbutin Serum 30ml',
    variant: '30 ml',
    category: 'Skincare',
    mrp: 549,
    estimatedOrdersPerMonth: 140,
    potentialMarginPercent: 22,
    confidenceLabel: 'High demand signal',
    suggestedStartQty: 12,
    supplierAvailable: true,
    reasons: ['Frequent searches near your store this week', 'Few nearby stores stock it', 'Fast supplier replenishment'],
    comparableProduct: 'Minimalist 10% Niacinamide Serum',
    expectedPriceBand: '₹499 to ₹549',
    stockRiskExplanation: 'Low shelf risk. Long batch shelf life.',
  },
  {
    id: 'REC-102',
    brand: 'Nykaa',
    name: 'Nykaa Matte to Last Liquid Lipstick (Chai)',
    variant: 'Shade 18 Chai',
    category: 'Makeup',
    mrp: 675,
    estimatedOrdersPerMonth: 95,
    potentialMarginPercent: 25,
    confidenceLabel: 'Trending shade',
    suggestedStartQty: 10,
    supplierAvailable: true,
    reasons: ['Popular nude shade in your area', 'Strong margin after GlowVAI fee'],
    comparableProduct: 'Maybelline Sensational Liquid Matte',
    expectedPriceBand: '₹599 to ₹675',
    stockRiskExplanation: 'Moderate trend risk. Watch seasonal demand.',
  },
  {
    id: 'REC-103',
    brand: 'Plum',
    name: 'Plum Green Tea Pore Cleansing Face Wash 100ml',
    variant: '100 ml',
    category: 'Skincare',
    mrp: 349,
    estimatedOrdersPerMonth: 180,
    potentialMarginPercent: 20,
    confidenceLabel: 'Local best seller',
    suggestedStartQty: 15,
    supplierAvailable: true,
    reasons: ['Repeat purchases near your store', 'Steady daily searches'],
    comparableProduct: 'Cetaphil Gentle Skin Cleanser',
    expectedPriceBand: '₹315 to ₹349',
    stockRiskExplanation: 'Low risk. Steady daily sales.',
  },
  {
    id: 'REC-104',
    brand: 'CeraVe',
    name: 'CeraVe Moisturizing Lotion 237ml',
    variant: '237 ml',
    category: 'Skincare',
    mrp: 1199,
    estimatedOrdersPerMonth: 60,
    potentialMarginPercent: 18,
    confidenceLabel: 'Supplier out of stock',
    suggestedStartQty: 5,
    supplierAvailable: false,
    reasons: ['Frequent customer questions about it'],
    comparableProduct: 'Cetaphil Moisturizing Lotion',
    expectedPriceBand: '₹1099 to ₹1199',
    stockRiskExplanation: 'Backordered at the main regional distributor.',
  },
];

function normalizeName(name: string) {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function formatRupees(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function RecommendedSkusScreen() {
  const router = useRouter();
  const { isPhone, canSplit } = useLayout();
  useDocumentTitle('Recommended products');

  const { inventory } = useVendorStore();
  const items = useMemo(() => (Array.isArray(inventory) ? inventory : []), [inventory]);
  const catalogNames = useMemo(() => new Set(items.map(i => normalizeName(i.name))), [items]);

  const [filter, setFilter] = useState('All');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ text: string; onUndo?: () => void } | null>(null);

  // No live source yet: production gets an empty list and the honest empty state below.
  const source = __DEV__ ? SAMPLE_RECOMMENDATIONS : [];
  const visible = source.filter(r => !dismissedIds.includes(r.id) && (filter === 'All' || r.category === filter));

  const cardWidth: DimensionValue = !isPhone && canSplit ? '48.5%' : '100%';
  const pad = isPhone ? S.lg : S.xl;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const dismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
    setToast({ text: 'Suggestion dismissed.', onUndo: () => setDismissedIds(prev => prev.filter(d => d !== id)) });
  };

  const startProduct = (r: AIRecommendationItem) => {
    router.push({
      pathname: '/(vendor)/add-sku',
      params: { name: r.name, brand: r.brand, category: r.category, mrp: String(r.mrp) },
    });
  };

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{ title: 'Recommended products', showBack: true }}
        backgroundColor={C.page}
        testID="recommended-screen"
      >
        <View style={[s.body, { paddingHorizontal: pad }]}>
          {__DEV__ ? (
            <Banner tone="warning" title="Sample data" message="These suggestions are for layout review only. They are not based on your store." />
          ) : null}

          <Banner
            tone="info"
            message="Suggestions are estimates from local search and order signals. They are not guaranteed sales or profit."
          />

          {source.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="sparkles-outline" size={24} color={C.primary} />
              </View>
              <Text accessibilityRole="header" style={s.emptyTitle}>No recommendations yet</Text>
              <Text style={s.emptyMessage}>
                GlowVAI suggests products once there is enough local demand data for your store. Until then, add products from your own list.
              </Text>
              <View style={s.emptyActions}>
                <Button label="Add product" compact onPress={() => router.push('/(vendor)/add-sku')} style={s.emptyBtn} />
                <Button label="Go to catalog" variant="secondary" compact onPress={() => router.push('/(vendor)/catalog')} style={s.emptyBtn} />
              </View>
            </View>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
                {FILTERS.map(f => {
                  const on = filter === f;
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setFilter(f)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      style={[s.chip, on && s.chipOn]}
                    >
                      <Text style={[s.chipText, on && s.chipTextOn]}>{f}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {visible.length === 0 ? (
                <View style={s.empty}>
                  <Text accessibilityRole="header" style={s.emptyTitle}>Nothing left in this filter</Text>
                  <Text style={s.emptyMessage}>You have dismissed or reviewed every suggestion here.</Text>
                  <Button label="Show all" variant="secondary" compact onPress={() => setFilter('All')} style={s.emptyBtn} />
                </View>
              ) : (
                <View style={s.list}>
                  {visible.map(r => {
                    const inCatalog = catalogNames.has(normalizeName(r.name));
                    return (
                      <View key={r.id} style={[s.card, { width: cardWidth }]}>
                        <View style={s.cardTop}>
                          <View style={s.thumb}>
                            <Ionicons name="sparkles-outline" size={20} color={C.primary} />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={s.brand} numberOfLines={1}>{r.brand} · {r.category}</Text>
                            <Text style={s.name}>{r.name}</Text>
                            <Text style={s.variant}>{r.variant}</Text>
                          </View>
                        </View>

                        <Text style={s.signal}>{r.confidenceLabel}</Text>

                        <View style={s.metrics}>
                          <Metric label="Est. orders a month" value={`About ${r.estimatedOrdersPerMonth}`} />
                          <Metric label="Est. margin" value={`${r.potentialMarginPercent}%`} />
                          <Metric label="Suggested start" value={`${r.suggestedStartQty} units`} />
                        </View>

                        <View style={s.reasons}>
                          {r.reasons.map(reason => (
                            <Text key={reason} style={s.reason}>• {reason}</Text>
                          ))}
                        </View>

                        <Text style={s.detail}>
                          MRP {formatRupees(r.mrp)}
                          {r.expectedPriceBand ? `  ·  Expected price ${r.expectedPriceBand}` : ''}
                        </Text>
                        {r.comparableProduct ? <Text style={s.detail}>Similar product: {r.comparableProduct}</Text> : null}
                        {r.stockRiskExplanation ? <Text style={s.detail}>Stock risk: {r.stockRiskExplanation}</Text> : null}

                        <View style={s.cardFooter}>
                          {!r.supplierAvailable ? (
                            <View style={s.unavailable}>
                              <Ionicons name="alert-circle-outline" size={16} color="#B45309" />
                              <Text style={s.unavailableText}>Out of stock at your distributor</Text>
                            </View>
                          ) : inCatalog ? (
                            <View style={s.footerRow}>
                              <Text style={s.inCatalog}>Already in your catalog</Text>
                              <Button label="Open catalog" variant="secondary" compact onPress={() => router.push('/(vendor)/catalog')} />
                            </View>
                          ) : (
                            <View style={s.footerRow}>
                              <Button label="Dismiss" variant="secondary" compact onPress={() => dismiss(r.id)} />
                              <Button label="Start product" compact onPress={() => startProduct(r)} />
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}

          <Section title="How suggestions work" description="The three signals behind each suggestion.">
            <Step n={1} title="Local searches and orders" text="We look at what shoppers search for and order near your store, over the last 30 days." />
            <Step n={2} title="Gaps in nearby stock" text="When a product is in demand but few nearby stores carry it, it is flagged as a gap." />
            <Step n={3} title="Margin and supply" text="We compare MRP with GlowVAI's 12% fee and check whether the distributor has stock." />
            <Text style={s.privacy}>Customer details are never shown. Suggestions are optional and never change your catalog on their own.</Text>
          </Section>
        </View>
      </ScreenShell>

      {toast ? (
        <View style={s.toastWrap} pointerEvents="box-none">
          <View style={s.toast}>
            <Text style={s.toastText}>{toast.text}</Text>
            {toast.onUndo ? (
              <Pressable
                onPress={() => { toast.onUndo?.(); setToast(null); }}
                accessibilityRole="button"
                accessibilityLabel="Undo"
                style={s.toastUndo}
              >
                <Text style={s.toastUndoText}>Undo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metric}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={s.metricValue}>{value}</Text>
    </View>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <View style={s.step}>
      <View style={s.stepNum}>
        <Text style={s.stepNumText}>{n}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.stepTitle}>{title}</Text>
        <Text style={s.stepText}>{text}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.page },
  body: { paddingTop: S.lg, paddingBottom: S.xxl, gap: S.md },

  chipRow: { gap: S.sm, paddingVertical: 2 },
  chip: {
    minHeight: 44,
    paddingHorizontal: S.md,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontFamily: FontFamily.semibold, fontSize: 14, color: C.textSecondary },
  chipTextOn: { color: '#FFFFFF' },

  list: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  card: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.card,
    padding: S.lg,
    gap: S.sm,
  },
  cardTop: { flexDirection: 'row', gap: S.md, alignItems: 'flex-start' },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontFamily: FontFamily.semibold, fontSize: 12, color: C.textSubtle, textTransform: 'uppercase', letterSpacing: 0.3 },
  name: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 21, color: C.textPrimary },
  variant: { fontFamily: FontFamily.regular, fontSize: 13, color: C.textSecondary },
  signal: { fontFamily: FontFamily.semibold, fontSize: 13, color: C.primary },

  metrics: { flexDirection: 'row', gap: S.sm },
  metric: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.input,
    padding: S.sm,
    backgroundColor: C.surface,
  },
  metricLabel: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, color: C.textSubtle },
  metricValue: { fontFamily: FontFamily.bold, fontSize: 14, lineHeight: 20, color: C.textPrimary, marginTop: 2 },

  reasons: { gap: 2 },
  reason: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: C.textSecondary },
  detail: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 19, color: C.textSecondary },

  cardFooter: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: S.sm, marginTop: S.xs },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.sm, flexWrap: 'wrap' },
  inCatalog: { fontFamily: FontFamily.semibold, fontSize: 14, color: '#15803D' },
  unavailable: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  unavailableText: { fontFamily: FontFamily.semibold, fontSize: 14, color: '#B45309' },

  empty: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.card,
    padding: S.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.md,
  },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: C.textPrimary, textAlign: 'center' },
  emptyMessage: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 21, color: C.textSecondary, textAlign: 'center', marginTop: S.xs, maxWidth: 480 },
  emptyActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: S.sm, marginTop: S.lg },
  emptyBtn: { minWidth: 160 },

  step: { flexDirection: 'row', gap: S.md, marginBottom: S.md },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: FontFamily.bold, fontSize: 13, color: C.primary },
  stepTitle: { fontFamily: FontFamily.semibold, fontSize: 15, color: C.textPrimary },
  stepText: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: C.textSecondary, marginTop: 2 },
  privacy: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 19, color: C.textSubtle, marginTop: S.xs },

  toastWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'flex-end' },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: S.lg,
    right: S.lg,
    maxWidth: 560,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.md,
    backgroundColor: '#0F172A',
    borderRadius: R.input,
    paddingLeft: S.lg,
    paddingRight: S.sm,
    paddingVertical: S.sm,
  },
  toastText: { flex: 1, fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20, color: '#FFFFFF' },
  toastUndo: { minHeight: 44, paddingHorizontal: S.md, justifyContent: 'center' },
  toastUndoText: { fontFamily: FontFamily.bold, fontSize: 14, color: '#93C5FD' },
});
