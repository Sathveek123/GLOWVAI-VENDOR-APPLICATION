/**
 * GlowVAI wordmark. "Glow" in Fraunces italic, "VAI" in tracked Plus Jakarta Sans.
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
}

export default function Wordmark({
  size = 18,
  color = Colors.textPrimary,
  accent = Colors.primary,
  style,
}: WordmarkProps) {
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
