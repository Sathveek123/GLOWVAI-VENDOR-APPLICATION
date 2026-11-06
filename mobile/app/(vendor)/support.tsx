/**
 * Help & support (PRD screen 20): report a problem as a support ticket and follow your tickets.
 * GET/POST /api/vendor/support; each ticket opens in the GlowVai admin panel and staff replies
 * show here. GlowVai support is reached through a ticket, never through customer chat.
 *
 * Params (all optional): ?orderId=… prefills the order reference (order detail links here);
 * ?category=ACCOUNT_ISSUE&subject=… prefills a change request from Profile or Bank account.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { formatDateIST } from '../../src/features/money/format';
import { Button, Card, ErrorCard, LinkRow, LoadingCard, Note, Pill, SectionLabel, StateCard, kit, page } from '../../src/features/money/ui';
import { Banner, SelectField, TextField } from '../../src/features/onboarding/kit';
import { isTicketCategory, looksSensitive, ticketErrors, ticketStatus, type TicketDraft } from '../../src/features/support/cases';
import { SupportContactActions } from '../../src/features/support/contact';
import { hasSellerSupport } from '../../src/features/onboarding/support';
import { friendlyError, VendorApiError } from '../../src/services/vendorApi/http';
import {
  TICKET_CATEGORIES,
  TICKET_LIMITS,
  supportApi,
  ticketCategoryLabel,
  type SupportTicket,
} from '../../src/services/vendorApi/support';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; items: SupportTicket[] };

const FIELD_KEYS: Record<string, keyof TicketDraft> = { category: 'category', subject: 'subject', description: 'description', orderId: 'orderId' };

const param = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');

export default function SupportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string; category?: string; subject?: string }>();
  const initialCategory = param(params.category).toUpperCase();

  const [draft, setDraft] = useState<TicketDraft>({
    category: isTicketCategory(initialCategory) ? initialCategory : '',
    subject: param(params.subject).slice(0, TICKET_LIMITS.subjectMax),
    description: '',
    orderId: param(params.orderId),
  });
  const [showAll, setShowAll] = useState(false);
  const [serverField, setServerField] = useState<{ key: keyof TicketDraft; message: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sentId, setSentId] = useState('');
  const [tickets, setTickets] = useState<Load>({ state: 'loading' });

  const loadTickets = useCallback(async () => {
    setTickets({ state: 'loading' });
    try {
      const res = await supportApi.list();
      setTickets({ state: 'ready', items: Array.isArray(res.tickets) ? res.tickets : [] });
    } catch (err) {
      setTickets({ state: 'error', message: friendlyError(err) });
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const set = (key: keyof TicketDraft) => (value: string) => {
    setDraft(d => ({ ...d, [key]: value }));
    setSendError('');
    setSentId('');
    if (serverField?.key === key) setServerField(null);
  };

  const errors = ticketErrors(draft);
  const err = (k: keyof TicketDraft) => (serverField?.key === k ? serverField.message : showAll ? errors[k] : '');
  const sensitive = looksSensitive(`${draft.subject} ${draft.description}`);

  const send = async () => {
    setShowAll(true);
    setSendError('');
    if (Object.values(errors).some(Boolean) || !draft.category || sending) return;
    setSending(true);
    try {
      const res = await supportApi.create({
        category: draft.category,
        subject: draft.subject,
        description: draft.description,
        orderId: draft.orderId || undefined,
      });
      setSentId(res.ticketId);
      setDraft({ category: '', subject: '', description: '', orderId: '' });
      setShowAll(false);
      loadTickets();
    } catch (e) {
      const field = e instanceof VendorApiError && typeof e.details.field === 'string' ? FIELD_KEYS[e.details.field] : undefined;
      if (field) setServerField({ key: field, message: friendlyError(e) });
      else setSendError(`Your ticket was not sent. ${friendlyError(e)}`);
    } finally {
      setSending(false);
    }
  };

  const categoryLabels = TICKET_CATEGORIES.map(c => c.label);
  const chosenLabel = draft.category ? ticketCategoryLabel(draft.category) : '';

  return (
    <ScreenShell header={{ title: 'Help & support', showBack: true }} backgroundColor={Colors.canvas} keyboardAvoiding>
      <View style={page.body}>
        <SectionLabel>Report a problem</SectionLabel>
        <Card>
          {sentId ? (
            <Banner
              tone="success"
              title="Ticket sent"
              message={`Your ticket ${sentId} reached GlowVai’s support team. Their replies will show under Your tickets.`}
            />
          ) : null}
          {sendError ? <Banner tone="error" message={sendError} /> : null}

          <SelectField
            label="What is it about?"
            value={chosenLabel}
            options={categoryLabels}
            onChange={label => set('category')(TICKET_CATEGORIES.find(c => c.label === label)?.id ?? '')}
            placeholder="Choose a topic"
            error={err('category')}
            testID="ticket-category"
          />
          <TextField
            label="Subject"
            placeholder="A few words, e.g. Payout not received"
            value={draft.subject}
            onChangeText={set('subject')}
            error={err('subject')}
            maxLength={TICKET_LIMITS.subjectMax}
            testID="ticket-subject"
          />
          <TextField
            label="Order reference"
            optional
            placeholder="As shown on the order"
            value={draft.orderId}
            onChangeText={v => set('orderId')(v.replace(/\s/g, ''))}
            error={err('orderId')}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={64}
            inputStyle={draft.orderId ? { fontFamily: FontFamily.mono, fontSize: 15 } : undefined}
            testID="ticket-order"
          />
          <TextField
            label="What happened?"
            placeholder="Describe the problem: what you expected and what happened instead"
            value={draft.description}
            onChangeText={set('description')}
            error={err('description')}
            helper={`${draft.description.trim().length} of ${TICKET_LIMITS.descriptionMax} characters`}
            multiline
            maxLength={TICKET_LIMITS.descriptionMax}
            inputStyle={s.multiline}
            textAlignVertical="top"
            testID="ticket-description"
          />
          {sensitive ? (
            <Banner
              tone="warning"
              message="This looks like a phone number, PIN or password. Never share OTPs, passwords, UPI PINs or customer phone numbers in a ticket."
            />
          ) : null}
          <Button label="Send ticket" icon="paper-plane-outline" onPress={send} loading={sending} />
          <View style={{ marginTop: Spacing.md }}>
            <Note icon="image-outline">Photos can’t be attached in the app yet. If our team needs photos, they will ask in a reply.</Note>
          </View>
        </Card>

        <SectionLabel>Your tickets</SectionLabel>
        {tickets.state === 'loading' ? <LoadingCard label="Loading your tickets" /> : null}
        {tickets.state === 'error' ? <ErrorCard title="Could not load your tickets" message={tickets.message} onRetry={loadTickets} /> : null}
        {tickets.state === 'ready' && tickets.items.length === 0 ? (
          <StateCard
            icon="chatbox-ellipses-outline"
            title="No tickets yet"
            body="When you report a problem above, it is listed here with its status and replies from GlowVai’s team."
          />
        ) : null}
        {tickets.state === 'ready' && tickets.items.length > 0 ? (
          <Card padded={false}>
            {tickets.items.map((t, i) => {
              const meta = ticketStatus(t.status);
              const created = Date.parse(t.createdAt);
              const line = [
                ticketCategoryLabel(t.category),
                t.orderId ? `Order ${t.orderId}` : null,
                Number.isFinite(created) ? formatDateIST(created, { weekday: false }) : null,
              ]
                .filter(Boolean)
                .join(' · ');
              const lastReply = t.messages?.length ? t.messages[t.messages.length - 1] : null;
              return (
                <View key={t.id} style={[s.ticket, i < tickets.items.length - 1 && s.divider]}>
                  <View style={s.ticketHead}>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Text style={s.subject}>{t.subject || 'Support ticket'}</Text>
                      <Text style={s.ticketId}>{t.id}</Text>
                    </View>
                    <Pill label={meta.label} tone={meta.tone} />
                  </View>
                  {line ? <Text style={kit.muted}>{line}</Text> : null}
                  {lastReply?.text ? (
                    <View style={s.reply}>
                      <Text style={s.replyLabel}>Reply from GlowVai</Text>
                      <Text style={s.replyText}>{lastReply.text}</Text>
                    </View>
                  ) : null}
                  {t.resolution ? (
                    <View style={s.reply}>
                      <Text style={s.replyLabel}>Resolution</Text>
                      <Text style={s.replyText}>{t.resolution}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Card>
        ) : null}

        {hasSellerSupport() ? (
          <>
            <SectionLabel>Other ways to reach us</SectionLabel>
            <Card style={{ gap: Spacing.md }}>
              <Text style={s.body}>For something urgent, contact GlowVai seller support directly.</Text>
              <SupportContactActions subject="GlowVai Seller support" />
            </Card>
          </>
        ) : null}

        <Card padded={false}>
          <LinkRow label="Bank account" icon="card-outline" onPress={() => router.push('/(vendor)/bank-edit')} />
          <LinkRow label="Store profile" icon="storefront-outline" onPress={() => router.push('/(vendor)/profile')} last />
        </Card>
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  multiline: { minHeight: 120, paddingTop: 12 },
  body: { ...TypeScale.body, color: Colors.textSecondary },
  ticket: { padding: Spacing.lg, gap: Spacing.sm },
  ticketHead: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  subject: { ...TypeScale.body, fontFamily: FontFamily.semibold, color: Colors.textPrimary },
  ticketId: { fontFamily: FontFamily.mono, fontSize: 12, color: Colors.textMuted },
  reply: { backgroundColor: Colors.surface, borderRadius: 10, padding: Spacing.md, gap: 2 },
  replyLabel: { ...TypeScale.caption, fontFamily: FontFamily.semibold, color: Colors.textSecondary },
  replyText: { ...TypeScale.body, color: Colors.textPrimary },
});
