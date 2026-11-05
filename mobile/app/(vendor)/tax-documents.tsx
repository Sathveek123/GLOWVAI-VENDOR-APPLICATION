/**
 * Tax documents (PRD screen 23): documents GlowVai issues for the store, by financial year.
 * A download is offered only where the server provides a file. No tax regime, rate or
 * document type is assumed here; names come from the server.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { financialYearLabel, financialYearStart, formatDateIST, formatINR, friendlyError } from '../../src/features/money/format';
import { fetchTaxDocuments, type TaxDocument } from '../../src/features/money/records';
import { Card, ErrorCard, LoadingCard, Note, Segmented, StateCard, kit, page } from '../../src/features/money/ui';
import { SupportContactActions } from '../../src/features/support/contact';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type Load =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'not-connected' }
  | { state: 'ready'; items: TaxDocument[] };

export default function TaxDocumentsScreen() {
  const years = useMemo(() => {
    const current = financialYearStart(Date.now());
    return [current, current - 1, current - 2].map((y) => ({ key: String(y), label: financialYearLabel(y) }));
  }, []);
  const [fy, setFy] = useState(years[0].key);
  const [load, setLoad] = useState<Load>({ state: 'loading' });

  const fetchData = useCallback(async (year: string) => {
    setLoad({ state: 'loading' });
    try {
      const res = await fetchTaxDocuments(Number(year));
      setLoad(res.connected ? { state: 'ready', items: res.items } : { state: 'not-connected' });
    } catch (err) {
      setLoad({ state: 'error', message: friendlyError(err) });
    }
  }, []);

  useEffect(() => {
    fetchData(fy);
  }, [fetchData, fy]);

  const fyLabel = financialYearLabel(Number(fy));

  return (
    <ScreenShell header={{ title: 'Tax documents', showBack: true }} backgroundColor={Colors.surface}>
      <View style={page.body}>
        <Segmented label="Financial year" options={years} value={fy} onChange={setFy} />
        {load.state === 'not-connected' ? (
          <StateCard
            icon="document-text-outline"
            title="Tax documents are not shown in the app yet"
            body="Invoices and statements that GlowVai issues for your store will be listed here by financial year, with a download where a file is available. If you need a document now, contact GlowVai support."
          >
            <SupportContactActions subject="Tax document request" />
          </StateCard>
        ) : (
          <>
            {load.state === 'loading' ? <LoadingCard label={`Loading documents for ${fyLabel}`} /> : null}
            {load.state === 'error' ? <ErrorCard title="Could not load documents" message={load.message} onRetry={() => fetchData(fy)} /> : null}
            {load.state === 'ready' && load.items.length === 0 ? (
              <StateCard
                icon="document-text-outline"
                title={`No documents for ${fyLabel}`}
                body="Documents GlowVai issues for your store in this financial year will appear here."
              />
            ) : null}
            {load.state === 'ready' && load.items.length > 0 ? (
              <Card padded={false}>
                {load.items.map((doc, i) => (
                  <DocumentRow key={doc.id} doc={doc} last={i === load.items.length - 1} />
                ))}
              </Card>
            ) : null}
          </>
        )}

        <Note>GlowVai will confirm which documents apply to your business. For tax questions, check with your tax adviser.</Note>
      </View>
    </ScreenShell>
  );
}

function DocumentRow({ doc, last }: { doc: TaxDocument; last: boolean }) {
  const meta = [doc.period, doc.issuedMs ? `Issued ${formatDateIST(doc.issuedMs, { weekday: false })}` : null].filter(Boolean).join(' · ');
  return (
    <View style={[s.row, !last && s.divider]}>
      <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.name}>{doc.name}</Text>
        {doc.number ? <Text style={s.number} selectable>{doc.number}</Text> : null}
        {meta ? <Text style={kit.muted}>{meta}</Text> : null}
      </View>
      <View style={s.right}>
        {doc.amount !== null ? <Text style={kit.amount}>{formatINR(doc.amount, { alwaysPaise: true })}</Text> : null}
        {doc.fileUrl ? (
          <Pressable
            onPress={() => Linking.openURL(doc.fileUrl as string).catch(() => undefined)}
            accessibilityRole="button"
            accessibilityLabel={`Download ${doc.name}`}
            style={({ pressed }) => [s.download, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="download-outline" size={18} color={Colors.primary} />
            <Text style={s.downloadText}>Download</Text>
          </Pressable>
        ) : (
          <Text style={kit.muted}>No file yet</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, alignItems: 'flex-start' },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  name: { ...TypeScale.body, fontFamily: FontFamily.medium, color: Colors.textPrimary },
  number: { fontFamily: FontFamily.mono, fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: Spacing.xs },
  download: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  downloadText: { ...TypeScale.bodyStrong, color: Colors.primary },
});
