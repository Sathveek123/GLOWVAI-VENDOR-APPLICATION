/**
 * Settlements: weekly payouts to the store's bank account, with UTR references.
 * File: mobile/app/(vendor)/payout-detail.tsx
 *
 * No settlements endpoint exists in the vendor API yet, so production shows the empty state.
 * Adapter sample rows appear only in __DEV__ builds, behind a "Sample data" banner.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenShell from '../../src/components/ScreenShell';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import { fetchSettlements, type SettlementItem } from '../../src/features/finance/adapter';
import { Colors } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type SettlementStatus = SettlementItem['status'];
type FilterKey = 'ALL' | 'Paid' | 'Processing' | 'Failed';
type LoadStatus = 'loading' | 'ready' | 'error';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'Paid', label: 'Paid' },
  { key: 'Processing', label: 'In progress' },
  { key: 'Failed', label: 'Failed' },
];

const STATUS_STYLE: Record<SettlementStatus, { bg: string; fg: string }> = {
  Paid: { bg: Colors.successLight, fg: Colors.success },
  Processing: { bg: Colors.warningLight, fg: '#B45309' },
  Scheduled: { bg: Colors.primaryLight, fg: Colors.primary },
  'On hold': { bg: Colors.warningLight, fg: '#B45309' },
  Failed: { bg: Colors.dangerLight, fg: Colors.danger },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats an ISO date (YYYY-MM-DD) as "4 Oct 2026". Returns the input when it cannot be read. */
function fmtDate(iso?: string): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

const inr = (paise: number) => `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;

function PayoutDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [rows, setRows] = useState<SettlementItem[]>([]);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [selected, setSelected] = useState<SettlementItem | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Settlements | GlowVAI Vendor';
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    // Live settlements are not connected yet. Only __DEV__ builds read adapter sample rows.
    (async () => {
      try {
        const items = __DEV__ ? await fetchSettlements() : [];
        if (!cancelled) {
          setRows(items);
          setStatus('ready');
        }
      } catch (_) {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const visible = rows.filter((r) => filter === 'ALL' || r.status === filter);
  const showingSample = __DEV__ && rows.length > 0;

  const closeDetail = () => setSelected(null);

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{ title: 'Settlements', subtitle: 'Weekly payouts and UTR numbers', showBack: true }}
        contentContainerStyle={s.shellContent}
      >
        <View style={[s.page, { padding: isWide ? 24 : 16 }]}>
          {showingSample && (
            <View style={s.sampleBanner}>
              <Ionicons name="flask-outline" size={15} color="#B45309" />
              <Text style={s.sampleBannerText}>Sample data. These payouts are not from your store.</Text>
            </View>
          )}

          {status === 'loading' && (
            <View style={[s.card, s.centerBox]}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={s.mutedText}>Loading settlements</Text>
            </View>
          )}

          {status === 'error' && (
            <View style={s.card}>
              <Text style={s.cardTitle}>We could not load settlements</Text>
              <Text style={s.mutedText}>Check your connection and try again.</Text>
              <Pressable
                onPress={() => setAttempt((n) => n + 1)}
                style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]}
                accessibilityRole="button"
              >
                <Text style={s.primaryBtnText}>Try again</Text>
              </Pressable>
            </View>
          )}

          {status === 'ready' && rows.length === 0 && (
            <View style={[s.card, s.centerBox]}>
              <View style={s.emptyIcon}>
                <Ionicons name="swap-horizontal-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={s.cardTitle}>No settlements yet</Text>
              <Text style={[s.mutedText, s.textCenter]}>
                Weekly payouts and their UTR numbers will be listed here after your first settlement cycle.
              </Text>
            </View>
          )}

          {status === 'ready' && rows.length > 0 && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
                {FILTERS.map((f) => {
                  const active = filter === f.key;
                  return (
                    <Pressable
                      key={f.key}
                      onPress={() => setFilter(f.key)}
                      style={[s.chip, active && s.chipActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {visible.length === 0 ? (
                <View style={[s.card, s.centerBox]}>
                  <Text style={s.cardTitle}>No settlements with this status</Text>
                  <Text style={[s.mutedText, s.textCenter]}>Choose another filter to see other payouts.</Text>
                </View>
              ) : (
                visible.map((item) => {
                  const st = STATUS_STYLE[item.status] ?? STATUS_STYLE.Scheduled;
                  return (
                    <Pressable
                      key={item.settlementId}
                      onPress={() => setSelected(item)}
                      style={({ pressed }) => [s.card, pressed && s.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.cycleLabel}, ${item.status}, net ${inr(item.netPayoutPaise)}`}
                    >
                      <View style={s.rowTop}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.cardTitle}>{item.cycleLabel}</Text>
                          <Text style={s.mutedText}>
                            {fmtDate(item.periodStart)} to {fmtDate(item.periodEnd)} • {item.orderCount} orders
                          </Text>
                        </View>
                        <View style={[s.statusPill, { backgroundColor: st.bg }]}>
                          <Text style={[s.statusPillText, { color: st.fg }]}>{item.status}</Text>
                        </View>
                      </View>
                      <View style={s.rowBottom}>
                        <View>
                          <Text style={s.mutedSmall}>Net payout</Text>
                          <Text style={s.netAmount}>{inr(item.netPayoutPaise)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
                          <Text style={s.mutedSmall}>UTR</Text>
                          <Text style={s.utr} selectable numberOfLines={1}>
                            {item.utr ?? 'Not issued yet'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </>
          )}

          <View style={s.noteBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
            <Text style={s.noteText}>
              Payouts are sent to your registered bank account. Use Payout account to check the account they go to.
            </Text>
          </View>
        </View>
      </ScreenShell>

      <MobileBottomNav currentTab="earnings" />

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={closeDetail}>
        <Pressable style={s.backdrop} onPress={closeDetail} accessibilityLabel="Close settlement details" />
        {selected && (
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetTitle}>{selected.cycleLabel}</Text>
                <Text style={s.mutedText}>{selected.settlementId}</Text>
              </View>
              <Pressable onPress={closeDetail} style={s.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 2 }}>
              <DetailRow label="Gross sales" value={inr(selected.grossSalesPaise)} />
              <DetailRow label="Platform fee" value={`−${inr(selected.platformFeePaise)}`} />
              <DetailRow label="Net payout" value={inr(selected.netPayoutPaise)} strong />
              <DetailRow label="Orders" value={String(selected.orderCount)} />
              <DetailRow label="Bank account" value={selected.destinationBank} />
              <DetailRow label="Paid on" value={selected.paidAt ?? 'Not paid yet'} />
              <DetailRow label="UTR" value={selected.utr ?? 'Not issued yet'} mono />
            </ScrollView>

            {(selected.status === 'Failed' || selected.status === 'On hold') && (
              <View style={s.alertBox}>
                <Text style={s.alertText}>
                  {selected.status === 'Failed'
                    ? 'This payout did not reach your account. Check your payout account details, then contact support.'
                    : 'This payout is on hold. Support can explain the reason and the next steps.'}
                </Text>
              </View>
            )}

            <View style={s.sheetActions}>
              {selected.status === 'Failed' && (
                <Pressable
                  onPress={() => {
                    closeDetail();
                    router.push('/(vendor)/bank-edit');
                  }}
                  style={({ pressed }) => [s.secondaryBtn, pressed && s.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={s.secondaryBtnText}>Check payout account</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  closeDetail();
                  router.push('/(vendor)/support');
                }}
                style={({ pressed }) => [s.primaryBtn, { marginTop: 0 }, pressed && s.pressed]}
                accessibilityRole="button"
              >
                <Text style={s.primaryBtnText}>Contact support</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

function DetailRow({ label, value, strong, mono }: { label: string; value: string; strong?: boolean; mono?: boolean }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text
        selectable
        style={[s.detailValue, strong && s.detailValueStrong, mono && s.mono]}
      >
        {value}
      </Text>
    </View>
  );
}

export default PayoutDetailScreen;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  shellContent: { paddingBottom: 32 },
  page: { gap: 12, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  pressed: { opacity: 0.85 },

  sampleBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10,
    borderRadius: 10, backgroundColor: Colors.warningLight, borderWidth: 1, borderColor: Colors.warningBorder,
  },
  sampleBannerText: { ...TypeScale.label, color: '#92400E', flex: 1 },

  card: {
    backgroundColor: Colors.background, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 8,
  },
  centerBox: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
  emptyIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  cardTitle: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary },
  mutedText: { ...TypeScale.caption, color: Colors.textSubtle, fontSize: 13, lineHeight: 18 },
  mutedSmall: { ...TypeScale.caption, color: Colors.textSubtle },
  textCenter: { textAlign: 'center' },
  primaryBtn: {
    marginTop: 8, minHeight: 44, borderRadius: 10, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  primaryBtnText: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFFFFF' },
  secondaryBtn: {
    minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: Colors.inputBorder,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, backgroundColor: Colors.background,
  },
  secondaryBtnText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.textPrimary },

  filterRow: { gap: 8, paddingBottom: 4 },
  chip: {
    minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1,
    borderColor: Colors.inputBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: '#FFFFFF' },

  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusPillText: { fontFamily: FontFamily.semibold, fontSize: 12 },
  rowBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12,
    marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  netAmount: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, color: Colors.textPrimary, marginTop: 2 },
  utr: { fontFamily: FontFamily.mono, fontSize: 12, color: Colors.textPrimary, marginTop: 2, maxWidth: 200 },

  noteBox: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  noteText: { flex: 1, ...TypeScale.caption, fontSize: 13, lineHeight: 19, color: Colors.textSecondary },

  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  sheet: {
    backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 28, maxHeight: '85%', gap: 12,
    width: '100%', maxWidth: 640, alignSelf: 'center',
  },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sheetTitle: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, color: Colors.textPrimary },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: -10, marginRight: -10 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16,
    minHeight: 44, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 8,
  },
  detailLabel: { ...TypeScale.body, color: Colors.textSubtle, flexShrink: 1 },
  detailValue: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary, textAlign: 'right', flexShrink: 1 },
  detailValueStrong: { fontFamily: FontFamily.bold, fontSize: 16 },
  mono: { fontFamily: FontFamily.mono, fontSize: 13 },
  alertBox: { backgroundColor: Colors.warningLight, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.warningBorder },
  alertText: { ...TypeScale.caption, fontSize: 13, lineHeight: 19, color: '#92400E' },
  sheetActions: { gap: 8 },
});
