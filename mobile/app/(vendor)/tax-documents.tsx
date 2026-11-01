/**
 * Tax documents: GST invoices on platform fees and TCS/TDS statements.
 * File: mobile/app/(vendor)/tax-documents.tsx
 *
 * No tax document endpoint exists in the vendor API yet, so production shows the empty states.
 * Adapter sample rows appear only in __DEV__ builds, behind a "Sample data" banner.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenShell from '../../src/components/ScreenShell';
import MobileBottomNav from '../../src/components/MobileBottomNav';
import { fetchTaxDocuments, type TaxDocumentItem } from '../../src/features/finance/adapter';
import { Colors } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type TabKey = 'INVOICES' | 'TCS_TDS';
type LoadStatus = 'loading' | 'ready' | 'error';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'INVOICES', label: 'Invoices' },
  { key: 'TCS_TDS', label: 'TCS and TDS' },
];

const TAB_KINDS: Record<TabKey, TaxDocumentItem['kind'][]> = {
  INVOICES: ['GST Invoice', 'Sales Summary'],
  TCS_TDS: ['TCS Statement', 'TDS Statement'],
};

const TAB_EMPTY: Record<TabKey, { title: string; body: string }> = {
  INVOICES: {
    title: 'No invoices yet',
    body: 'GST invoices on the platform fee and monthly sales summaries will be listed here.',
  },
  TCS_TDS: {
    title: 'No TCS or TDS statements yet',
    body: 'Quarterly TCS and TDS credit statements will be listed here once they are issued.',
  },
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

function TaxDocumentsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [docs, setDocs] = useState<TaxDocumentItem[]>([]);
  const [tab, setTab] = useState<TabKey>('INVOICES');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Tax documents | GlowVAI Vendor';
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    // Live tax documents are not connected yet. Only __DEV__ builds read adapter sample rows.
    (async () => {
      try {
        const items = __DEV__ ? await fetchTaxDocuments() : [];
        if (!cancelled) {
          setDocs(items);
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

  const showingSample = __DEV__ && docs.length > 0;
  const visible = useMemo(
    () => docs.filter((d) => TAB_KINDS[tab].includes(d.kind)),
    [docs, tab],
  );

  return (
    <View style={s.screen}>
      <ScreenShell
        header={{ title: 'Tax documents', subtitle: 'GST invoices and TCS/TDS statements', showBack: true }}
        contentContainerStyle={s.shellContent}
      >
        <View style={[s.page, { padding: isWide ? 24 : 16 }]}>
          <View style={s.disclaimer}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
            <Text style={s.disclaimerText}>
              These records are for your reference. Check the figures with your tax advisor before you file.
            </Text>
          </View>

          {showingSample && (
            <View style={s.sampleBanner}>
              <Ionicons name="flask-outline" size={15} color="#B45309" />
              <Text style={s.sampleBannerText}>Sample data. These documents are not from your store.</Text>
            </View>
          )}

          <View style={s.segment} accessibilityRole="tablist">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  style={[s.segmentItem, active && s.segmentItemActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[s.segmentText, active && s.segmentTextActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {status === 'loading' && (
            <View style={[s.card, s.centerBox]}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={s.mutedText}>Loading documents</Text>
            </View>
          )}

          {status === 'error' && (
            <View style={s.card}>
              <Text style={s.cardTitle}>We could not load tax documents</Text>
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

          {status === 'ready' && visible.length === 0 && (
            <View style={[s.card, s.centerBox]}>
              <View style={s.emptyIcon}>
                <Ionicons name="document-text-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={s.cardTitle}>{TAB_EMPTY[tab].title}</Text>
              <Text style={[s.mutedText, s.textCenter]}>{TAB_EMPTY[tab].body}</Text>
            </View>
          )}

          {status === 'ready' &&
            visible.map((doc) => {
              const ready = doc.status === 'Ready';
              return (
                <View key={doc.documentId} style={s.card}>
                  <View style={s.rowTop}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.docNumber} selectable numberOfLines={1}>{doc.number}</Text>
                      <Text style={s.mutedText}>{doc.kind} • {doc.period}</Text>
                    </View>
                    <View style={[s.statusPill, { backgroundColor: ready ? Colors.successLight : Colors.warningLight }]}>
                      <Text style={[s.statusPillText, { color: ready ? Colors.success : '#B45309' }]}>
                        {ready ? 'Ready' : 'Generating'}
                      </Text>
                    </View>
                  </View>
                  <View style={s.amountRow}>
                    <View>
                      <Text style={s.mutedSmall}>Amount</Text>
                      <Text style={s.amount}>{inr(doc.amountPaise)}</Text>
                    </View>
                    <View>
                      <Text style={s.mutedSmall}>Tax</Text>
                      <Text style={s.amount}>{inr(doc.taxAmountPaise)}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={s.mutedSmall}>Issued</Text>
                      <Text style={s.issued}>{fmtDate(doc.issuedAt)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}

          {status === 'ready' && visible.length > 0 && (
            <Text style={s.footNote}>Downloads will be available here once document delivery is connected.</Text>
          )}
        </View>
      </ScreenShell>

      <MobileBottomNav currentTab="earnings" />
    </View>
  );
}

export default TaxDocumentsScreen;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  shellContent: { paddingBottom: 32 },
  page: { gap: 12, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  pressed: { opacity: 0.85 },

  disclaimer: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  disclaimerText: { flex: 1, ...TypeScale.caption, fontSize: 13, lineHeight: 19, color: Colors.textSecondary },

  sampleBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10,
    borderRadius: 10, backgroundColor: Colors.warningLight, borderWidth: 1, borderColor: Colors.warningBorder,
  },
  sampleBannerText: { ...TypeScale.label, color: '#92400E', flex: 1 },

  segment: {
    flexDirection: 'row', backgroundColor: Colors.background, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  segmentItem: { flex: 1, minHeight: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentItemActive: { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primaryBorder },
  segmentText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textSecondary },
  segmentTextActive: { color: Colors.primary },

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

  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  docNumber: { fontFamily: FontFamily.mono, fontSize: 13, color: Colors.textPrimary },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusPillText: { fontFamily: FontFamily.semibold, fontSize: 12 },
  amountRow: {
    flexDirection: 'row', gap: 20, marginTop: 6, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  amount: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary, marginTop: 2 },
  issued: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textPrimary, marginTop: 2 },

  footNote: { ...TypeScale.caption, color: Colors.textSubtle, textAlign: 'center', paddingVertical: 4 },
});
