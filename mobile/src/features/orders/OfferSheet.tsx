/**
 * The incoming offer as a bottom sheet on phones and a centred dialog on wide screens.
 * File: mobile/src/features/orders/OfferSheet.tsx
 */
import React from 'react';
import { Modal, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../theme/tokens';
import OfferCard, { OfferCardProps } from './OfferCard';

export default function OfferSheet(props: Omit<OfferCardProps, 'variant'> & { visible: boolean }) {
  const { visible, ...cardProps } = props;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 768;
  return (
    <Modal
      visible={visible}
      transparent
      animationType={wide ? 'fade' : 'slide'}
      statusBarTranslucent
      // Android back must not decline. It only closes; the offer stays in Orders.
      onRequestClose={props.onClose}
    >
      <View style={[sh.scrim, wide ? sh.scrimWide : sh.scrimPhone]}>
        <View
          style={[
            sh.sheet,
            wide ? sh.sheetWide : sh.sheetPhone,
            !wide && { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
          ]}
          accessibilityViewIsModal
          {...(Platform.OS === 'web' ? { role: 'dialog', 'aria-label': 'New order offer' } : {})}
        >
          {!wide && <View style={sh.grabber} />}
          <OfferCard {...cardProps} variant="sheet" />
        </View>
      </View>
    </Modal>
  );
}

const sh = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: `${Colors.textPrimary}66` },
  scrimPhone: { justifyContent: 'flex-end' },
  scrimWide: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  sheet: { backgroundColor: Colors.card, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  sheetPhone: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  sheetWide: { width: '100%', maxWidth: 520, borderRadius: 16, paddingBottom: Spacing.xl, paddingTop: Spacing.xl },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
});
