/**
 * Earnings (PRD screen 21): what the store will receive for a chosen period, and the daily figures.
 * Settlements (screen 22) are a separate screen, linked from here.
 *
 * Data: GET /api/earnings/:vendorId and /history, read through src/features/money/earnings.ts.
 * Only server figures are shown. No commission rate, tax rate or payout cycle is assumed.
 */
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import ScreenShell from '../../src/components/ScreenShell';
import { breakdown, loadEarnings, type EarningsData, type PeriodKey } from '../../src/features/money/earnings';
import { formatDateIST, formatINR, friendlyError } from '../../src/features/money/format';
import { Card, ErrorCard, LinkRow, LoadingCard, Note, SectionLabel, Segmented, StateCard, kit, page } from '../../src/features/money/ui';
import useVendorStore from '../../src/store/useVendorStore';
import { getSession } from '../../src/services/session';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type Load = { state: 'loading' } | { state: 'no-session' } | { state: 'error'; message: string } | { state: 'ready'; data: EarningsData };

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Last 7 days' },
  { key: 'all', label: 'All time' },
];

const PERIOD_PHRASE: Record<PeriodKey, string> = { today: 'today', week: 'in the last 7 days', all: 'so far' };

export default function EarningsScreen() {
  const router = useRouter();
  const setEarnings = useVendorStore((s) => s.setEarnings);
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoad({ state: 'loading' });
      try {
        const session = await getSession();
        if (!session.vendorId) {
          setLoad({ state: 'no-session' });
          return;
        }
        const data = await loadEarnings(session.vendorId);
        if (data.rawSummary) setEarnings(data.rawSummary);
        setLoad({ state: 'ready', data });
      } catch (err) {
        setLoad({ state: 'error', message: friendlyError(err) });
      }
    },
    [setEarnings]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{ title: 'Earnings' }}
        backgroundColor={Colors.surface}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={page.body}>
          {load.state === 'loading' ? <LoadingCard label="Loading your earnings" /> : null}
          {load.state === 'error' ? <ErrorCard title="Could not load earnings" message={load.message} onRetry={() => fetchData()} /> : null}
          {load.state === 'no-session' ? (
            <StateCard
              icon="log-in-outline"
              title="Sign in to see your earnings"
              body="Your store account is not signed in on this device."
              action={{ label: 'Sign in', onPress: () => router.replace('/(auth)/login') }}
            />
          ) : null}

          {load.state === 'ready' ? (
            <>
              <Segmented<PeriodKey> label="Earnings period" options={PERIODS} value={period} onChange={setPeriod} />
              <ReceiveCard data={load.data} period={period} onRetry={() => fetchData()} />

              {load.data.pendingPayout !== null && load.data.pendingPayout > 0 ? (
                <Card>
                  <Text style={s.label}>Earned, not paid out yet</Text>
                  <Text style={s.mid}>{formatINR(load.data.pendingPayout)}</Text>
                </Card>
              ) : null}
            </>
          ) : null}

          <SectionLabel>Payouts</SectionLabel>
          <Card padded={false}>
            <LinkRow icon="swap-horizontal-outline" label="Settlements" detail="Bank transfers, references and UTR" onPress={() => router.push('/(vendor)/payout-detail')} />
            <LinkRow icon="card-outline" label="Bank account" detail="Where your payouts are sent" onPress={() => router.push('/(vendor)/bank-edit')} />
            <LinkRow icon="document-text-outline" label="Tax documents" detail="Invoices and statements by financial year" onPress={() => router.push('/(vendor)/tax-documents')} last />
          </Card>

          {load.state === 'ready' && load.data.days.length > 0 ? (
            <>
              <SectionLabel>Daily earnings</SectionLabel>
              <Card padded={false}>
                {load.data.days.slice(0, 30).map((d, i, arr) => (
                  <View
                    key={d.key}
                    style={[s.dayRow, i < arr.length - 1 && s.divider]}
                    accessible
                    accessibilityLabel={`${formatDateIST(d.ms)}. ${d.orders !== null ? `${d.orders} orders. ` : ''}${d.net !== null ? `You receive ${formatINR(d.net)}` : 'Amount not available'}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.dayDate}>{formatDateIST(d.ms)}</Text>
                      {d.orders !== null ? <Text style={kit.muted}>{d.orders === 1 ? '1 order' : `${d.orders} orders`}</Text> : null}
                    </View>
                    <Text style={kit.amount}>{d.net !== null ? formatINR(d.net) : '—'}</Text>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          <Note>Amounts come from GlowVai's records for your store. Fees and deductions follow your agreement with GlowVai.</Note>
        </View>
      </ScreenShell>
      <MobileBottomNav currentTab="earnings" />
    </View>
  );
}

function ReceiveCard({ data, period, onRetry }: { data: EarningsData; period: PeriodKey; onRetry: () => void }) {
  const p = data.periods[period];

  if (period === 'week' && data.historyFailed) {
    return <ErrorCard title="Could not load the last 7 days" message="Today and all-time figures are still shown. Try again to load the daily figures." onRetry={onRetry} />;
  }
  if (!p || p.net === null) {
    return (
      <StateCard
        icon="wallet-outline"
        title="Not available for this period yet"
        body="GlowVai has not sent figures for this period. Try another period, or check again later."
      />
    );
  }
  if (p.net === 0 && (p.orders === null || p.orders === 0)) {
    return (
      <StateCard
        icon="wallet-outline"
        title={period === 'all' ? 'No earnings yet' : `No earnings ${PERIOD_PHRASE[period]}`}
        body="Earnings appear here after your orders are delivered. Each order adds what you will receive."
      />
    );
  }

  const lines = breakdown(p);
  return (
    <Card>
      <Text style={s.label}>You'll receive {PERIOD_PHRASE[period]}</Text>
      <Text style={s.big} accessibilityLabel={`You'll receive ${formatINR(p.net)} ${PERIOD_PHRASE[period]}`}>
        {formatINR(p.net)}
      </Text>
      {p.orders !== null ? <Text style={kit.muted}>From {p.orders === 1 ? '1 delivered order' : `${p.orders} delivered orders`}</Text> : null}

      {lines ? (
        <View style={s.breakdown}>
          {lines.map((l) => (
            <View key={l.label} style={s.lineRow}>
              <Text style={kit.body}>{l.label}</Text>
              <Text style={kit.amount}>{formatINR(l.amount, { alwaysPaise: true })}</Text>
            </View>
          ))}
          <View style={[s.lineRow, s.totalRow]}>
            <Text style={s.totalLabel}>You'll receive</Text>
            <Text style={s.totalAmount}>{formatINR(p.net, { alwaysPaise: true })}</Text>
          </View>
        </View>
      ) : (
        <Text style={s.breakdownMissing}>
          A breakdown of sales, fees and refunds will show here once GlowVai sends it for this period.
        </Text>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingBottom: 96 },
  label: { ...TypeScale.body, color: Colors.textSecondary },
  big: { fontFamily: FontFamily.semibold, fontSize: 32, lineHeight: 40, color: Colors.textPrimary, marginTop: Spacing.xs, fontVariant: ['tabular-nums'] },
  mid: { ...TypeScale.title, color: Colors.textPrimary, marginTop: 2, fontVariant: ['tabular-nums'] },
  breakdown: { marginTop: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, marginTop: Spacing.xs, paddingTop: Spacing.sm },
  totalLabel: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  totalAmount: { ...TypeScale.bodyStrong, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  breakdownMissing: { ...TypeScale.caption, color: Colors.textSecondary, marginTop: Spacing.md, lineHeight: 18 },
  dayRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minHeight: 56 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  dayDate: { ...TypeScale.body, fontFamily: FontFamily.medium, color: Colors.textPrimary },
});
