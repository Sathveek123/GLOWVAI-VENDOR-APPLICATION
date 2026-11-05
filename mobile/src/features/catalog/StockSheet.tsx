/**
 * Update stock: one exact quantity, one reason, one save. Quick-add chips only change
 * the number on screen; nothing is sent until Save. Also pauses or resumes selling.
 * File: mobile/src/features/catalog/StockSheet.tsx
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { inventoryApi } from '../../services/api';
import type { InventoryItem } from '../../store/useVendorStore';
import { Colors, Spacing as S } from '../../theme/tokens';
import { FontFamily, TypeScale } from '../../theme/typography';
import { Banner, Button, TextField } from '../onboarding/kit';
import { ProductThumb, Sheet, Pill } from './ui';
import { expiryLine, expiryState, friendlyError, onHand, reserved, sellState, SELL_LABEL } from './stock';

const REASONS = ['Received new stock', 'Counted the shelf', 'Damaged or expired', 'Sold in the shop'] as const;
type Reason = (typeof REASONS)[number];
const QUICK = [1, 6, 12];
const MAX_QTY = 9999;

export default function StockSheet({
  item,
  photo,
  volume,
  onClose,
  onSaved,
}: {
  item: InventoryItem | null;
  photo?: string;
  volume?: string;
  onClose: () => void;
  onSaved: (productId: string, fields: Partial<InventoryItem>, message: string) => void;
}) {
  const current = item ? onHand(item) : 0;
  const held = item ? reserved(item) : 0;
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState<Reason | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!item) return;
    setQty(String(onHand(item)));
    setReason(null);
    setError('');
    setSaving(false);
    setToggling(false);
  }, [item?.productId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return <Sheet visible={false} title="" onClose={onClose}>{null}</Sheet>;

  const trimmed = qty.trim();
  const parsed = /^\d+$/.test(trimmed) ? Number(trimmed) : NaN;
  let qtyError = '';
  if (trimmed === '') qtyError = 'Enter how many are on the shelf now.';
  else if (!Number.isInteger(parsed)) qtyError = 'Use whole numbers only, 0 or more.';
  else if (parsed > MAX_QTY) qtyError = `That is more than ${MAX_QTY}. Check the number.`;
  else if (parsed < held) qtyError = `${held} ${held === 1 ? 'unit is' : 'units are'} held for open orders, so stock cannot go below ${held}.`;
  const changed = !qtyError && parsed !== current;
  const canSave = changed && !!reason && !saving;

  const expired = expiryState(item) === 'expired';
  const state = sellState(item);
  const canResume = !item.active && !expired && current > 0 && item.approvalStatus !== 'REJECTED';

  const bump = (n: number) => {
    const base = Number.isInteger(parsed) ? parsed : current;
    setQty(String(Math.min(MAX_QTY, base + n)));
    if (!reason) setReason('Received new stock');
  };

  const save = async () => {
    if (!canSave || !reason) return;
    setSaving(true);
    setError('');
    try {
      const res: any = await inventoryApi.setStockExact(item.productId, parsed, reason);
      const fields: Partial<InventoryItem> = res?.item
        ? res.item
        : { stock: parsed, stockOnHand: parsed, updatedAt: Date.now() };
      onSaved(item.productId, fields, `Stock saved: ${parsed} on the shelf.`);
    } catch (err) {
      setError(`Stock not saved. ${friendlyError(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleSelling = async () => {
    if (toggling) return;
    const next = !item.active;
    setToggling(true);
    setError('');
    try {
      const res: any = await inventoryApi.update(item.productId, { active: next });
      onSaved(
        item.productId,
        res?.item ? res.item : { active: next, status: next ? 'active' : 'paused', updatedAt: Date.now() },
        next ? 'Selling resumed.' : 'Selling paused. Customers will not see this product.',
      );
    } catch (err) {
      setError(`${next ? 'Could not resume selling' : 'Could not pause selling'}. ${friendlyError(err)}`);
    } finally {
      setToggling(false);
    }
  };

  const tone = state === 'selling' ? 'success' : state === 'expired' || state === 'rejected' || state === 'out' ? 'danger' : state === 'pending' ? 'info' : 'neutral';

  return (
    <Sheet
      visible
      title="Update stock"
      onClose={onClose}
      footer={
        <Button
          label={saving ? 'Saving' : 'Save stock'}
          onPress={save}
          loading={saving}
          disabled={!canSave}
          accessibilityLabel={`Save stock for ${item.name}`}
        />
      }
    >
      <View style={st.product}>
        <ProductThumb uri={photo} brand={item.brand} label={item.name} size={56} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          {item.brand ? <Text style={st.brand}>{item.brand}</Text> : null}
          <Text style={st.name} numberOfLines={2}>{item.name}</Text>
          {volume ? <Text style={st.meta}>{volume}</Text> : null}
        </View>
      </View>

      <View style={st.figures}>
        <Figure label="On the shelf" value={current} />
        <Figure label="Held for orders" value={held} />
        <Figure label="Can be sold" value={Math.max(0, current - held)} />
      </View>

      {expired ? (
        <Banner
          tone="error"
          title="Expired: not for sale"
          message={`${expiryLine(item.expiryDate)}. Take it off the shelf, pause selling and set the stock to 0 with the reason "Damaged or expired".`}
        />
      ) : null}

      <TextField
        label="How many are on the shelf now?"
        value={qty}
        onChangeText={t => {
          setQty(t.replace(/[^0-9]/g, '').slice(0, 5));
          setError('');
        }}
        keyboardType="number-pad"
        inputMode="numeric"
        error={trimmed !== String(current) ? qtyError || undefined : undefined}
        helper={held ? `${held} held for open orders are included in this number.` : 'Count every unit you have for sale.'}
        inputStyle={st.qtyInput}
      />

      <View style={st.quickRow}>
        {QUICK.map(n => (
          <Pressable
            key={n}
            onPress={() => bump(n)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${n}`}
            style={({ pressed }) => [st.quick, pressed && { backgroundColor: Colors.primaryLight }]}
          >
            <Text style={st.quickText}>+{n}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={st.label} nativeID="reasonLabel">Why is the stock changing?</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Reason for the change" style={st.reasons}>
        {REASONS.map(r => {
          const on = reason === r;
          return (
            <Pressable
              key={r}
              onPress={() => setReason(r)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, selected: on }}
              style={[st.reason, on && st.reasonOn]}
            >
              <View style={[st.radio, on && st.radioOn]}>{on ? <View style={st.radioDot} /> : null}</View>
              <Text style={[st.reasonText, on && { color: Colors.primary }]}>{r}</Text>
            </Pressable>
          );
        })}
      </View>
      {changed && !reason ? <Text style={st.hint}>Choose a reason to save.</Text> : null}

      {error ? <Banner tone="error" message={error} style={{ marginTop: S.md, marginBottom: 0 }} /> : null}

      <View style={st.sellBox}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={st.label}>On the GlowVai shop</Text>
          <Pill label={SELL_LABEL[state]} tone={tone} />
          {!item.active && !canResume ? (
            <Text style={st.hint}>
              {expired
                ? 'Expired stock cannot be put back on sale.'
                : current === 0
                  ? 'Add stock before you resume selling.'
                  : 'GlowVai has not approved this product.'}
            </Text>
          ) : null}
        </View>
        {item.active || canResume ? (
          <Button
            label={item.active ? 'Pause selling' : 'Resume selling'}
            variant="secondary"
            compact
            loading={toggling}
            onPress={toggleSelling}
            accessibilityLabel={`${item.active ? 'Pause' : 'Resume'} selling ${item.name}`}
          />
        ) : null}
      </View>
    </Sheet>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <View style={st.figure} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={st.figureValue}>{value}</Text>
      <Text style={st.figureLabel}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  product: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginBottom: S.lg },
  brand: { ...TypeScale.caption, color: Colors.textMuted },
  name: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  meta: { ...TypeScale.caption, color: Colors.textSecondary },

  figures: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginBottom: S.lg,
  },
  figure: { flex: 1, paddingVertical: S.md, alignItems: 'center' },
  figureValue: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 26, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  figureLabel: { ...TypeScale.caption, color: Colors.textSecondary, textAlign: 'center' },

  qtyInput: { fontFamily: FontFamily.semibold, fontSize: 20, fontVariant: ['tabular-nums'] },
  quickRow: { flexDirection: 'row', gap: S.sm, marginTop: -S.sm, marginBottom: S.lg },
  quick: {
    minWidth: 64,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.primary },

  label: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: Colors.textPrimary, marginBottom: 6 },
  reasons: { gap: S.xs },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    minHeight: 44,
    paddingHorizontal: S.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.inputBorder, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  reasonText: { ...TypeScale.body, color: Colors.textPrimary },
  hint: { ...TypeScale.caption, color: Colors.textSecondary, marginTop: S.xs },

  sellBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginTop: S.xl,
    paddingTop: S.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
