import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../theme/tokens';

export type MobileTab = 'home' | 'orders' | 'catalog' | 'earnings' | 'profile';

interface MobileBottomNavProps {
  currentTab: MobileTab;
}

export default function MobileBottomNav({ currentTab }: MobileBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Hide on desktop view (width >= 1024) where left sidebar rail is visible
  if (width >= 1024) return null;

  const tabs: { key: MobileTab; label: string; icon: string; route: string }[] = [
    { key: 'home', label: 'Home', icon: '🏠', route: '/(vendor)/home' },
    { key: 'orders', label: 'Orders', icon: '📋', route: '/(vendor)/orders' },
    { key: 'catalog', label: 'Catalog', icon: '🧴', route: '/(vendor)/catalog' },
    { key: 'earnings', label: 'Earnings', icon: '💳', route: '/(vendor)/earnings' },
    { key: 'profile', label: 'Profile', icon: '👤', route: '/(vendor)/profile' },
  ];

  const handleNavigation = (targetRoute: string, targetKey: MobileTab) => {
    router.replace(targetRoute as any);
  };

  const bottomInsetPadding = Math.max(insets.bottom, 8);

  return (
    <View style={[s.container, { paddingBottom: bottomInsetPadding }]}>
      <View style={s.bar}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[s.tabItem, isActive && s.activeTabItem]}
              onPress={() => handleNavigation(tab.route, tab.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <Text style={[s.icon, isActive && s.activeIcon]}>{tab.icon}</Text>
              <Text style={[s.label, isActive && s.activeLabel]} numberOfLines={1}>
                {tab.label}
              </Text>
              {isActive && <View style={s.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border || '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 6,
    zIndex: 9999,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xs || 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: BorderRadii.input || 12,
    position: 'relative',
  },
  activeTabItem: {
    backgroundColor: '#F1F5F9',
  },
  icon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.65,
  },
  activeIcon: {
    opacity: 1.0,
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary || '#64748B',
  },
  activeLabel: {
    color: Colors.primary || '#1D4ED8',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 3,
    backgroundColor: Colors.primary || '#1D4ED8',
    borderRadius: 2,
  },
});
