/**
 * Request a product (PRD screen 15, the part not in the catalogue). A store asks GlowVai to add a
 * product that is not published yet. GlowVai staff review every request in the admin panel; the
 * store sees the status here (waiting, approved, not approved, more information needed).
 * The form checks what it can before sending; the server decides. Max 5 requests per IST day.
 * File: mobile/app/(vendor)/product-request.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, TextInput, View, Pressable, Platform } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { Card, LoadingCard, Note, SectionLabel, StateCard, ErrorCard, page } from '../../src/features/money/ui';
import { Banner, PrimaryButton } from '../../src/features/orders/ui';
import { Pill, type PillTone } from '../../src/features/catalog/ui';
import { friendlyError, isNotAvailableError, VendorApiError } from '../../src/services/vendorApi/http';
import {
  DAILY_REQUEST_LIMIT,
  MAX_PICTURES,
  PRODUCT_REQUEST_CATEGORIES,
  REQUEST_STATUS_LABEL,
  productRequestsApi,
  validateProductRequest,
  type ProductRequest,
  type ProductRequestStatus,
} from '../../src/services/vendorApi/productRequests';
import { formatDayTime } from '../../src/features/orders';
import { Colors, Spacing as S } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type Field = 'name' | 'brand' | 'category' | 'mrp' | 'barcode' | 'pictureUrls' | 'reason';

const STATUS_TONE: Record<ProductRequestStatus, PillTone> = {
  PENDING: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  NEEDS_INFO: 'warning',
};

/** Start of today in India time, as an epoch millisecond value. */
function startOfIstDay(now = Date.now()): number {
  const IST = 5.5 * 3600_000;
  return Math.floor((now + IST) / 86_400_000) * 86_400_000 - IST;
}

export default function ProductRequestScreen() {
  const [requests, setRequests] = useState<ProductRequest[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loadUnavailable, setLoadUnavailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [mrp, setMrp] = useState('');
  const [barcode, setBarcode] = useState('');
  const [pictures, setPictures] = useState<string[]>(['']);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError('');
    setLoadUnavailable(false);
    try {
      setRequests(await productRequestsApi.list());
    } catch (err) {
      setLoadUnavailable(isNotAvailableError(err));
      setLoadError(friendlyError(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const sentToday = useMemo(() => {
    if (!requests) return 0;
    const from = startOfIstDay();
    return requests.filter(r => r.createdAt >= from).length;
  }, [requests]);
  const dailyFull = sentToday >= DAILY_REQUEST_LIMIT;

  const clearError = (field: Field) => setErrors(e => ({ ...e, [field]: undefined }));

  const submit = async () => {
    if (saving || dailyFull) return;
    setSubmitError('');
    setSubmitted('');
    const checked = validateProductRequest({ name, brand, category, mrp, barcode, pictureUrls: pictures, reason });
    if (checked.ok === false) {
      setErrors({ [checked.field]: checked.error });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const created = await productRequestsApi.create(checked.value);
      setSubmitted(`Request sent for ${checked.value.name}. GlowVai will review it and show the status below.`);
      setName('');
      setBrand('');
      setCategory('');
      setMrp('');
      setBarcode('');
      setPictures(['']);
      setReason('');
      if (created) setRequests(list => [created, ...(list ?? [])]);
      else void load();
    } catch (err) {
      if (err instanceof VendorApiError && err.code === 'INVALID_INPUT' && typeof err.details.field === 'string') {
        setErrors({ [err.details.field as Field]: err.message });
      } else if (err instanceof VendorApiError && err.code === 'DAILY_LIMIT') {
        setSubmitError(err.message);
        void load();
      } else {
        setSubmitError(friendlyError(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const setPicture = (i: number, v: string) => {
    setPictures(list => list.map((p, idx) => (idx === i ? v : p)));
    clearError('pictureUrls');
  };

  return (
    <ScreenShell
      header={{ title: 'Request a product', showBack: true }}
      backgroundColor={Colors.surface}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      stickyFooter={
        <View style={s.footer}>
          {submitError ? <Banner tone="danger" message={submitError} /> : null}
          {submitted ? <Banner tone="success" message={submitted} /> : null}
          <PrimaryButton
            label={dailyFull ? 'Daily limit reached' : 'Send request'}
            tall
            icon="paper-plane-outline"
            onPress={submit}
            busy={saving}
            disabled={dailyFull || saving}
            accessibilityLabel="Send product request to GlowVai"
          />
        </View>
      }
    >
      <View style={page.body}>
        <Card>
          <Text style={s.lead}>Not in the GlowVai catalogue?</Text>
          <Text style={s.body}>
            Tell GlowVai about it. Product details are checked by GlowVai before it goes on sale. You can send up to {DAILY_REQUEST_LIMIT} requests a day.
          </Text>
          {requests ? (
            <Text style={s.counter} accessibilityLiveRegion="polite">
              {sentToday} of {DAILY_REQUEST_LIMIT} sent today
            </Text>
          ) : null}
        </Card>

        <SectionLabel>Product</SectionLabel>
        <Card style={{ gap: S.md }}>
          <Field2 label="Product name" value={name} onChange={v => { setName(v); clearError('name'); }} error={errors.name} placeholder="For example, Niacinamide 10% Serum" maxLength={120} />
          <Field2 label="Brand" value={brand} onChange={v => { setBrand(v); clearError('brand'); }} error={errors.brand} placeholder="Brand name" maxLength={80} />

          <Text style={s.label}>Category</Text>
          <View style={s.chips}>
            {PRODUCT_REQUEST_CATEGORIES.map(c => {
              const on = category === c.code;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => { setCategory(c.code); clearError('category'); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Category ${c.label}`}
                  style={({ pressed }) => [s.chip, on && s.chipOn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={[s.chipText, on && s.chipTextOn]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {errors.category ? <Text style={s.error}>{errors.category}</Text> : null}

          <Field2
            label="MRP (₹)"
            value={mrp}
            onChange={v => { setMrp(v.replace(/[^0-9]/g, '').slice(0, 7)); clearError('mrp'); }}
            error={errors.mrp}
            placeholder="For example, 699"
            keyboardType="number-pad"
          />
          <Field2
            label="Barcode (optional)"
            value={barcode}
            onChange={v => { setBarcode(v.replace(/[^0-9]/g, '').slice(0, 14)); clearError('barcode'); }}
            error={errors.barcode}
            placeholder="8 to 14 digits"
            keyboardType="number-pad"
          />
        </Card>

        <SectionLabel>Pictures (optional)</SectionLabel>
        <Card style={{ gap: S.md }}>
          <Text style={s.body}>Up to {MAX_PICTURES} links to clear product photos. Links must start with https:// and come from an allowed image host.</Text>
          {pictures.map((p, i) => (
            <Field2
              key={i}
              label={`Picture ${i + 1}`}
              value={p}
              onChange={v => setPicture(i, v)}
              placeholder="https://"
              autoCapitalize="none"
              error={i === 0 ? errors.pictureUrls : undefined}
            />
          ))}
          {pictures.length < MAX_PICTURES ? (
            <Pressable
              onPress={() => setPictures(list => [...list, ''])}
              accessibilityRole="button"
              accessibilityLabel="Add another picture link"
              style={({ pressed }) => [s.addLink, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="add" size={18} color={Colors.primary} />
              <Text style={s.addLinkText}>Add another picture</Text>
            </Pressable>
          ) : null}
        </Card>

        <SectionLabel>Why it should be added</SectionLabel>
        <Card style={{ gap: S.sm }}>
          <TextInput
            value={reason}
            onChangeText={v => { setReason(v.slice(0, 500)); clearError('reason'); }}
            multiline
            placeholder="For example, customers in my area ask for it, and it sells well at my store."
            placeholderTextColor={Colors.textSubtle}
            accessibilityLabel="Why the product should be added"
            style={[s.input, s.textarea, !!errors.reason && s.inputError]}
          />
          <View style={s.row}>
            {errors.reason ? <Text style={s.error}>{errors.reason}</Text> : <Text style={s.body}>10 to 500 characters.</Text>}
            <Text style={s.body}>{reason.length}/500</Text>
          </View>
        </Card>

        <SectionLabel>Your requests</SectionLabel>
        {loadError && !requests && loadUnavailable ? (
          <StateCard icon="time-outline" title={loadError} body="Product requests are not live yet. Nothing is shown until they are." />
        ) : loadError && !requests ? (
          <ErrorCard message={loadError} onRetry={() => void load()} title="Could not load your requests" />
        ) : !requests ? (
          <LoadingCard label="Loading your requests" />
        ) : requests.length === 0 ? (
          <StateCard icon="document-text-outline" title="No requests yet" body="Requests you send will show here with their status." />
        ) : (
          <Card padded={false}>
            {requests.map((r, i) => (
              <View key={r.id} style={[s.reqRow, i < requests.length - 1 && s.divider]}>
                <View style={s.reqHead}>
                  <Text style={s.reqName} numberOfLines={2}>{r.brand ? `${r.brand} · ` : ''}{r.name}</Text>
                  <Pill label={REQUEST_STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} />
                </View>
                <Text style={s.body}>Sent {formatDayTime(r.createdAt)}</Text>
                {r.staffNote ? (
                  <View style={s.note}>
                    <Text style={s.noteLabel}>Note from GlowVai</Text>
                    <Text style={s.body}>{r.staffNote}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </Card>
        )}
        {loadError && requests ? <Note>{`Could not refresh: ${loadError}`}</Note> : null}
        <Note>Approved products go on sale in the GlowVai catalogue. Then you can add them to your store from Add from catalogue.</Note>
      </View>
    </ScreenShell>
  );
}

function Field2({
  label,
  value,
  onChange,
  error,
  placeholder,
  maxLength,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  keyboardType?: 'default' | 'number-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSubtle}
        maxLength={maxLength}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        accessibilityLabel={label}
        style={[s.input, !!error && s.inputError]}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  footer: { gap: S.sm, paddingBottom: S.xs },
  lead: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  body: { ...TypeScale.caption, color: Colors.textSecondary, lineHeight: 18 },
  counter: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.primary, marginTop: S.xs },
  label: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: S.md,
    backgroundColor: Colors.card,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: Colors.textPrimary,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  textarea: { minHeight: 110, paddingTop: S.sm, textAlignVertical: 'top' },
  inputError: { borderColor: Colors.danger },
  error: { ...TypeScale.caption, color: Colors.dangerText },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: S.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  chip: {
    minHeight: 44,
    paddingHorizontal: S.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
  chipTextOn: { color: Colors.primary, fontFamily: FontFamily.semibold },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  addLinkText: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.primary },
  reqRow: { paddingHorizontal: S.lg, paddingVertical: S.md, gap: 6 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  reqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.sm },
  reqName: { flex: 1, minWidth: 0, fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20, color: Colors.textPrimary },
  note: { backgroundColor: Colors.surface, borderRadius: 10, padding: S.sm, gap: 2, marginTop: 4 },
  noteLabel: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.textSecondary },
});
