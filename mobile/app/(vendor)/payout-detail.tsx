/**
 * Settlements (PRD screen 22): each bank transfer with its reference, amount, date,
 * UTR (with copy), status and, when it failed, the reason from the server.
 *
 * The backend has no settlements endpoint yet, so the screen says so instead of showing samples.
 * No payout cycle or hold period is stated here.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { copyText } from '../../src/features/money/clipboard';
import { formatDateIST, formatINR, friendlyError } from '../../src/features/money/format';
import { fetchSettlements, SETTLEMENT_STATUS, type Settlement } from '../../src/features/money/records';
import { Card, ErrorCard, LoadingCard, Pill, StateCard, kit, page } from '../../src/features/money/ui';
import { SupportContactActions } from '../../src/features/support/contact';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type Load =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'not-connected' }
  | { state: 'ready'; items: Settlement[] };

export default function SettlementsScreen() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });

  const fetchData = useCallback(async () => {
    setLoad({ state: 'loading' });
    try {
      const res = await fetchSettlements();
      setLoad(res.connected ? { state: 'ready', items: res.items } : { state: 'not-connected' });
    } catch (err) {
      setLoad({ state: 'error', message: friendlyError(err) });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <ScreenShell header={{ title: 'Settlements', showBack: true }} backgroundColor={Colors.surface}>
      <View style={page.body}>
        {load.state === 'loading' ? <LoadingCard label="Loading settlements" /> : null}
        {load.state === 'error' ? <ErrorCard title="Could not load settlements" message={load.message} onRetry={fetchData} /> : null}
        {load.state === 'not-connected' ? (
          <StateCard
            icon="swap-horizontal-outline"
            title="Settlements are not shown in the app yet"
            body="Each bank transfer from GlowVai will be listed here with its reference, amount, date, bank reference (UTR) and status. For a payout question now, contact GlowVai support."
          >
            <SupportContactActions subject="Payout question" />
          </StateCard>
        ) : null}
        {load.state === 'ready' && load.items.length === 0 ? (
          <StateCard
            icon="swap-horizontal-outline"
            title="No settlements yet"
            body="When GlowVai sends money to your bank account, each transfer will appear here with its bank reference (UTR)."
          />
        ) : null}
        {load.state === 'ready' && load.items.length > 0 ? (
          <Card padded={false}>
            {load.items.map((item, i) => (
              <SettlementRow key={item.id} item={item} last={i === load.items.length - 1} />
            ))}
          </Card>
        ) : null}
      </View>
    </ScreenShell>
  );
}

function SettlementRow({ item, last }: { item: Settlement; last: boolean }) {
  const [copied, setCopied] = useState(false);
  const meta = SETTLEMENT_STATUS[item.status];

  const copyUtr = async () => {
    if (!item.utr) return;
    const ok = await copyText(item.utr);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[s.row, !last && s.divider]}>
      <View style={s.top}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.ref} selectable>
            {item.reference}
          </Text>
          <Text style={kit.muted}>{item.dateMs ? formatDateIST(item.dateMs) : 'Date not available'}</Text>
        </View>
        <View style={s.right}>
          <Text style={kit.amount}>{item.amount !== null ? formatINR(item.amount) : '—'}</Text>
          <Pill label={item.statusLabel || meta.label} tone={meta.tone} />
        </View>
      </View>

      {item.utr ? (
        <View style={s.utrRow}>
          <Text style={kit.muted}>UTR</Text>
          <Text style={s.utr} selectable numberOfLines={1}>
            {item.utr}
          </Text>
          <Pressable
            onPress={copyUtr}
            accessibilityRole="button"
            accessibilityLabel={copied ? 'UTR copied' : `Copy UTR ${item.utr}`}
            style={({ pressed }) => [s.copyBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={Colors.primary} />
            <Text style={s.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
          </Pressable>
        </View>
      ) : null}

      {item.status === 'failed' && item.failureReason ? (
        <View style={s.failBox} accessibilityRole="alert">
          <Text style={s.failText}>{item.failureReason}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { padding: Spacing.lg, gap: Spacing.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  top: { flexDirection: 'row', gap: Spacing.md },
  right: { alignItems: 'flex-end', gap: Spacing.xs },
  ref: { fontFamily: FontFamily.mono, fontSize: 13, color: Colors.textPrimary },
  utrRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  utr: { flex: 1, fontFamily: FontFamily.mono, fontSize: 13, color: Colors.textPrimary },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: Spacing.sm },
  copyText: { ...TypeScale.bodyStrong, color: Colors.primary },
  failBox: { backgroundColor: Colors.dangerLight, borderRadius: 8, padding: Spacing.md },
  failText: { ...TypeScale.body, color: Colors.textPrimary },
});
