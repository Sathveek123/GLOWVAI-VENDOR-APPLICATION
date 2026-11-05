/**
 * Promotions are a later phase. Who funds a discount is not decided yet, and discounts change
 * vendor money, so nothing here can create or show a campaign. Nothing in the app links here;
 * an old link lands on this one honest card.
 */
import React from 'react';
import { View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { StateCard, page } from '../../src/features/money/ui';
import { Colors } from '../../src/theme/tokens';

export default function PromotionsScreen() {
  return (
    <ScreenShell header={{ title: 'Promotions', showBack: true }} backgroundColor={Colors.surface}>
      <View style={page.body}>
        <StateCard
          icon="pricetags-outline"
          title="Promotions are coming later"
          body="You will be able to run discounts on your products here in a later update. Until then, no discounts are applied to your products from this app."
        />
      </View>
    </ScreenShell>
  );
}
