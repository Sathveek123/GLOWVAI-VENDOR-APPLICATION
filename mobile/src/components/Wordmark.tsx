/**
 * GlowVai wordmark in Inter, the same type as the shop and admin panel.
 * Use this instead of typing the brand name as plain text.
 */
import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { Wordmark as Lockup } from '../theme/typography';
import { Colors } from '../theme/tokens';

interface WordmarkProps {
  size?: number;
  color?: string;
  accent?: string;
  style?: StyleProp<TextStyle>;
  /** Lowercase "glowvai" lockup, as written on the website (seller sign-in and onboarding). */
  lowercase?: boolean;
}

export default function Wordmark({
  size = 18,
  color = Colors.textPrimary,
  accent = Colors.primary,
  style,
  lowercase = false,
}: WordmarkProps) {
  if (lowercase) {
    return (
      <Text
        accessibilityRole="header"
        accessibilityLabel="glowvai"
        style={[{ fontSize: size, lineHeight: size * 1.25, color, letterSpacing: -0.4 }, style]}
      >
        <Text style={[Lockup.glow, { color }]}>glow</Text>
        <Text style={[Lockup.glow, { color: accent }]}>vai</Text>
      </Text>
    );
  }
  return (
    <Text
      accessibilityRole="header"
      accessibilityLabel="GlowVAI"
      style={[{ fontSize: size, lineHeight: size * 1.25, color, letterSpacing: -0.3 }, style]}
    >
      <Text style={[Lockup.glow, { color }]}>Glow</Text>
      <Text style={[Lockup.vai, { color: accent, fontSize: size * 0.8 }]}>VAI</Text>
    </Text>
  );
}
