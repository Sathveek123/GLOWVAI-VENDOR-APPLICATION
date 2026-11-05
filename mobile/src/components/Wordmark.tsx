/**
 * GlowVai brand: the wordmark ("GlowVai" in Inter Bold, "Vai" in GlowVai blue)
 * and the square brand mark used on the splash screen and the sidebar.
 *
 * Use these instead of typing the brand name as plain text, so it is written the
 * same way on every screen.
 */
import React from 'react';
import { Text, View, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Wordmark as Lockup } from '../theme/typography';
import { Colors } from '../theme/tokens';

interface WordmarkProps {
  size?: number;
  color?: string;
  accent?: string;
  style?: StyleProp<TextStyle>;
  /** Small "Seller" or "Sellers" label after the wordmark. */
  suffix?: string;
  /** @deprecated The brand is always written "GlowVai". Kept so older call sites still compile. */
  lowercase?: boolean;
}

export default function Wordmark({
  size = 18,
  color = Colors.textPrimary,
  accent = Colors.primary,
  style,
  suffix,
}: WordmarkProps) {
  return (
    <Text
      accessibilityLabel={suffix ? `GlowVai ${suffix}` : 'GlowVai'}
      style={[{ fontSize: size, lineHeight: Math.round(size * 1.25), color, letterSpacing: -0.4 }, style]}
    >
      <Text style={[Lockup.glow, { color }]}>Glow</Text>
      <Text style={[Lockup.vai, { color: accent }]}>Vai</Text>
      {suffix ? (
        <Text style={[Lockup.glow, { color: Colors.textMuted, fontSize: Math.max(12, Math.round(size * 0.62)), letterSpacing: 0 }]}>
          {'  '}
          {suffix}
        </Text>
      ) : null}
    </Text>
  );
}

/** Rounded blue tile with a white "G": the app's brand mark. */
export function BrandMark({ size = 40, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          backgroundColor: Colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={[
          Lockup.glow,
          { color: Colors.textOnPrimary, fontSize: Math.round(size * 0.52), lineHeight: Math.round(size * 0.66), letterSpacing: -0.5 },
        ]}
      >
        G
      </Text>
    </View>
  );
}
