/**
 * Order stepper: Offer, Pick & pack, Ready for pickup, With rider.
 * Done steps show a check, the current step is filled blue, later steps are grey.
 * File: mobile/src/features/orders/StatusStrip.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '../../theme/tokens';
import { FontFamily } from '../../theme/typography';
import { ORDER_STEPS, stepIndex } from './model';

export default function StatusStrip({ status }: { status: string }) {
  const current = stepIndex(status);
  if (current < 0) return null;
  return (
    <View
      style={st.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current + 1} of ${ORDER_STEPS.length}: ${ORDER_STEPS[current]}`}
    >
      {ORDER_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={label} style={st.step}>
            <View style={st.markRow}>
              <View style={[st.line, (done || active) && st.lineOn, i === 0 && st.lineHidden]} />
              <View style={[st.dot, done && st.dotDone, active && st.dotActive]}>
                {done ? (
                  <Ionicons name="checkmark" size={14} color={Colors.background} />
                ) : (
                  <Text style={[st.dotText, active && st.dotTextActive]}>{i + 1}</Text>
                )}
              </View>
              <View style={[st.line, done && st.lineOn, i === ORDER_STEPS.length - 1 && st.lineHidden]} />
            </View>
            <Text style={[st.label, active && st.labelActive, done && st.labelDone]} numberOfLines={2}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  markRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  line: { flex: 1, height: 2, backgroundColor: Colors.border },
  lineOn: { backgroundColor: Colors.primary },
  lineHidden: { backgroundColor: 'transparent' },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  dotText: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.textMuted },
  dotTextActive: { color: Colors.primary },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xs,
  },
  labelActive: { fontFamily: FontFamily.semibold, color: Colors.primary },
  labelDone: { color: Colors.textSecondary },
});
