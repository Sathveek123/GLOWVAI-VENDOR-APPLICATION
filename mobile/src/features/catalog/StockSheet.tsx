/**
 * Set stock for one GlowVai product: how many are on the shelf, whether the store is
 * selling it, and an optional own price (at most the MRP). One Save, one PUT
 * /api/vendor/inventory; the sheet closes only after GlowVai confirms.
 * File: mobile/src/features/catalog/StockSheet.tsx
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Switch, TextInput, Platform } from 'react-native';
import { Colors, Spacing as S } from '../../theme/tokens';
import { FontFamily, TypeScale } from '../../theme/typography';
import { friendlyError } from '../../services/vendorApi/http';
import { MAX_STOCK, type InventoryRecord } from '../../services/vendorApi/inventory';
import { Banner, PrimaryButton } from '../orders/ui';
import { catalogTitle, type CatalogProduct } from './catalogSource';
import { saveInventory } from './inventory';
import { ProductThumb, Sheet } from './ui';
import { formatRupees, priceError } from './stock';

const QUICK = [1, 6, 12];

export default function StockSheet({
  product,
  record,
  onClose,
  onSaved,
}: {
  product: CatalogProduct | null;
  record?: InventoryRecord;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [qty, setQty] = useState('');
  const [available, setAvailable] = useState(true);
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!product) return;
    setQty(record ? String(record.stock) : '');
    setAvailable(record ? record.isAvailable : true);
    setPrice(record?.unitPriceOverride ? String(record.unitPriceOverride) : '');
    setError('');
    setSaving(false);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!product) return <Sheet visible={false} title="" onClose={onClose}>{null}</Sheet>;

  const trimmed = qty.trim();
  const parsed = /^\d+$/.test(trimmed) ? Number(trimmed) : NaN;
  let qtyError = '';
  if (trimmed === '') qtyError = 'Enter how many are on the shelf now.';
  else if (!Number.isInteger(parsed)) qtyError = 'Use whole numbers only, 0 or more.';
  else if (parsed > MAX_STOCK) qtyError = `That is more than ${MAX_STOCK.toLocaleString('en-IN')}. Check the number.`;
  const pErr = priceError(price, product.mrp);
  const priceValue = price.trim() ? Number(price.trim()) : undefined;

  const changed =
    !record ||
    parsed !== record.stock ||
    available !== record.isAvailable ||
    (priceValue ?? 0) !== (record.unitPriceOverride ?? 0);
  const canSave = !qtyError && !pErr && changed && !saving;

  const bump = (n: number) => {
    const base = Number.isInteger(parsed) ? parsed : 0;
    setQty(String(Math.min(MAX_STOCK, base + n)));
    setError('');
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      await saveInventory([{ productId: product.id, stock: parsed, isAvailable: available, unitPriceOverride: priceValue }]);
      onSaved(
        !available
          ? 'Saved. This product is paused for your store.'
          : parsed === 0
            ? 'Saved. This product is out of stock in your store.'
            : `Saved: ${parsed} on the shelf.`,
      );
    } catch (err) {
      setError(`Not saved. ${friendlyError(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      visible
      title={record ? 'Update stock' : 'Add to your store'}
      onClose={onClose}
      footer={
        <PrimaryButton
          label={saving ? 'Saving' : 'Save'}
          onPress={save}
          busy={saving}
          disabled={!canSave}
          accessibilityLabel={`Save stock for ${product.productName}`}
        />
      }
    >
      <View style={st.product}>
        <ProductThumb uri={product.pictures[0]} brand={product.brandName} label={product.productName} size={56} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          {product.brandName ? <Text style={st.brand}>{product.brandName}</Text> : null}
          <Text style={st.name} numberOfLines={2}>{catalogTitle(product)}</Text>
          <Text style={st.meta}>
            GlowVai price {formatRupees(product.brandPrice)}{product.mrp > product.brandPrice ? ` · MRP ${formatRupees(product.mrp)}` : ''}
          </Text>
        </View>
      </View>

      <Text style={st.label} nativeID="qtyLabel">How many are on the shelf now?</Text>
      <TextInput
        value={qty}
        onChangeText={t => {
          setQty(t.replace(/[^0-9]/g, '').slice(0, 6));
          setError('');
        }}
        keyboardType="number-pad"
        inputMode="numeric"
        placeholder="0"
        placeholderTextColor={Colors.textSubtle}
        accessibilityLabel="Units on the shelf"
        style={[st.input, st.qtyInput, !!qtyError && trimmed !== '' && st.inputError]}
      />
      {qtyError && trimmed !== '' ? <Text style={st.error}>{qtyError}</Text> : null}
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
      <Text style={st.hint}>Count every unit you have for sale. Stock held for accepted orders is already taken off.</Text>

      <View style={st.switchRow}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={st.label}>Sell this product</Text>
          <Text style={st.hint}>{available ? 'GlowVai can send you orders for it.' : 'Paused: GlowVai will not send you orders for it.'}</Text>
        </View>
        <Switch
          value={available}
          onValueChange={v => {
            setAvailable(v);
            setError('');
          }}
          trackColor={{ false: Colors.borderStrong, true: Colors.primary }}
          thumbColor={Colors.card}
          {...({ activeThumbColor: Colors.card } as object)}
          accessibilityLabel="Sell this product"
        />
      </View>

      <Text style={[st.label, { marginTop: S.lg }]}>Your price (optional)</Text>
      <View style={[st.input, st.priceWrap, !!pErr && st.inputError]}>
        <Text style={st.rupee}>₹</Text>
        <TextInput
          value={price}
          onChangeText={t => {
            setPrice(t.replace(/[^0-9.]/g, '').slice(0, 9));
            setError('');
          }}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder={String(Math.round(product.brandPrice))}
          placeholderTextColor={Colors.textSubtle}
          accessibilityLabel="Your price in rupees, optional"
          style={st.priceInput}
        />
      </View>
      {pErr ? (
        <Text style={st.error}>{pErr}</Text>
      ) : (
        <Text style={st.hint}>
          Leave empty to use the GlowVai price.{product.mrp > 0 ? ` At most the MRP, ${formatRupees(product.mrp)}.` : ''}
        </Text>
      )}

      {error ? <View style={{ marginTop: S.md }}><Banner tone="danger" message={error} /></View> : null}
    </Sheet>
  );
}

const st = StyleSheet.create({
  product: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginBottom: S.lg },
  brand: { ...TypeScale.caption, color: Colors.textMuted },
  name: { ...TypeScale.bodyStrong, color: Colors.textPrimary },
  meta: { ...TypeScale.caption, color: Colors.textSecondary },

  label: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, color: Colors.textPrimary, marginBottom: 6 },
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
  inputError: { borderColor: Colors.danger },
  qtyInput: { fontFamily: FontFamily.semibold, fontSize: 20, fontVariant: ['tabular-nums'] },
  error: { ...TypeScale.caption, color: Colors.dangerText, marginTop: 4 },
  hint: { ...TypeScale.caption, color: Colors.textSecondary, marginTop: 4 },
  quickRow: { flexDirection: 'row', gap: S.sm, marginTop: S.sm },
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

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginTop: S.lg,
    paddingTop: S.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  priceWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rupee: { fontFamily: FontFamily.semibold, fontSize: 16, color: Colors.textSecondary },
  priceInput: {
    flex: 1,
    minHeight: 46,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: Colors.textPrimary,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
});
