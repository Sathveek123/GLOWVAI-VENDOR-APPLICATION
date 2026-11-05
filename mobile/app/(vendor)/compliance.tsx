/**
 * Store activity: a plain timeline of important changes on the store account
 * (orders cancelled, stock adjusted, payout account changes), grouped by day.
 *
 * The backend has no audit-log endpoint yet, so the screen says so instead of showing samples.
 * Licence, KYC and suspension notices live on the Profile screen.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { formatDateIST, formatTimeIST, friendlyError, istDayKey } from '../../src/features/money/format';
import { fetchStoreActivity, type ActivityEvent } from '../../src/features/money/records';
import { Card, ErrorCard, LoadingCard, Pill, SectionLabel, StateCard, kit, page } from '../../src/features/money/ui';
import { Colors, Spacing } from '../../src/theme/tokens';
import { TypeScale } from '../../src/theme/typography';

type Load =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'not-connected' }
  | { state: 'ready'; items: ActivityEvent[] };

export default function StoreActivityScreen() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });

  const fetchData = useCallback(async () => {
    setLoad({ state: 'loading' });
    try {
      const res = await fetchStoreActivity();
      setLoad(res.connected ? { state: 'ready', items: res.items } : { state: 'not-connected' });
    } catch (err) {
      setLoad({ state: 'error', message: friendlyError(err) });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group by India-time day, newest first.
  const groups: { key: string; label: string; items: ActivityEvent[] }[] = [];
  if (load.state === 'ready') {
    for (const ev of [...load.items].sort((a, b) => b.atMs - a.atMs)) {
      const key = istDayKey(ev.atMs);
      let g = groups.find((x) => x.key === key);
      if (!g) {
        g = { key, label: formatDateIST(ev.atMs), items: [] };
        groups.push(g);
      }
      g.items.push(ev);
    }
  }

  return (
    <ScreenShell header={{ title: 'Store activity', showBack: true }} backgroundColor={Colors.surface}>
      <View style={page.body}>
        {load.state === 'loading' ? <LoadingCard label="Loading store activity" /> : null}
        {load.state === 'error' ? <ErrorCard title="Could not load store activity" message={load.message} onRetry={fetchData} /> : null}
        {load.state === 'not-connected' ? (
          <StateCard
            icon="time-outline"
            title="Store activity is not shown in the app yet"
            body="Important changes on your store, such as cancelled orders, stock adjustments and payout account changes, will be listed here by day."
          />
        ) : null}
        {load.state === 'ready' && load.items.length === 0 ? (
          <StateCard icon="time-outline" title="No activity yet" body="Important changes on your store will be listed here by day." />
        ) : null}

        {groups.map((g) => (
          <View key={g.key} style={{ gap: Spacing.sm }}>
            <SectionLabel>{g.label}</SectionLabel>
            <Card padded={false}>
              {g.items.map((ev, i) => (
                <View key={ev.id} style={[s.item, i < g.items.length - 1 && s.divider]}>
                  <View style={s.icon}>
                    <Ionicons name={ev.icon} size={16} color={Colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text style={s.summary}>{ev.summary}</Text>
                    <Text style={kit.muted}>{[formatTimeIST(ev.atMs), ev.actor].filter(Boolean).join(' · ')}</Text>
                    {ev.flag ? <Pill tone={ev.flag === 'blocked' ? 'danger' : 'warning'} label={ev.flag === 'blocked' ? 'Blocked' : 'Needs review'} /> : null}
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  icon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  summary: { ...TypeScale.body, color: Colors.textPrimary },
});
