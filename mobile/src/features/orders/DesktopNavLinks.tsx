/**
 * Wide screens only: text links to the main vendor screens (the bottom bar hides at 1024px).
 * Temporary until the shell provides its own navigation rail.
 * File: mobile/src/features/orders/DesktopNavLinks.tsx
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BorderRadii, Colors } from '../../theme/tokens';
import { FontFamily } from '../../theme/typography';

const LINKS = [
  { key: 'home', label: 'Home', route: '/(vendor)/home' },
  { key: 'orders', label: 'Orders', route: '/(vendor)/orders' },
  { key: 'catalog', label: 'Catalog', route: '/(vendor)/catalog' },
  { key: 'earnings', label: 'Earnings', route: '/(vendor)/earnings' },
  { key: 'profile', label: 'Profile', route: '/(vendor)/profile' },
];

export default function DesktopNavLinks({ current }: { current: string }) {
  const router = useRouter();
  return (
    <View style={n.row}>
      {LINKS.map(link => {
        const active = link.key === current;
        return (
          <Pressable
            key={link.key}
            onPress={() => { if (!active) router.replace(link.route as any); }}
            accessibilityRole="link"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [n.item, active && n.itemActive, pressed && { opacity: 0.7 }]}
          >
            <Text style={[n.label, active && n.labelActive]}>{link.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const n = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8 },
  item: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderRadius: BorderRadii.input },
  itemActive: { backgroundColor: Colors.primaryLight },
  label: { fontFamily: FontFamily.semibold, fontSize: 14, color: Colors.textSecondary },
  labelActive: { color: Colors.primary },
});
