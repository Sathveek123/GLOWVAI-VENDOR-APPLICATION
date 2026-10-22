import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadii } from '../theme/tokens';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftSlot?: React.ReactNode;
  rightActions?: React.ReactNode;
  variant?: 'default' | 'large' | 'search';
  showBell?: boolean;
  unreadBellCount?: number;
  onBellPress?: () => void;
  elevated?: boolean;
  testID?: string;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onCancelSearch?: () => void;
}

export function useHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const topInset = Platform.OS === 'android' ? (insets.top || StatusBar.currentHeight || 0) : insets.top;
  const baseHeight = width >= 1024 ? 64 : 56;
  return topInset + baseHeight;
}

export default function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  leftSlot,
  rightActions,
  variant = 'default',
  showBell = false,
  unreadBellCount = 0,
  onBellPress,
  elevated = false,
  testID = 'app-header',
  searchValue = '',
  onSearchChange,
  onCancelSearch,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 1024;

  const topPadding = Platform.OS === 'android' ? (insets.top || StatusBar.currentHeight || 0) : insets.top;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(vendor)/home');
    }
  };

  const handleBell = () => {
    if (onBellPress) {
      onBellPress();
    } else {
      router.push('/(vendor)/notifications' as any);
    }
  };

  return (
    <View
      testID={testID}
      style={[
        s.outerContainer,
        { paddingTop: topPadding },
        elevated && s.elevatedBorder,
      ]}
    >
      <View style={[s.innerRow, isTabletOrDesktop && s.innerRowDesktop]}>
        {/* Left Section: Back Button or Custom Left Slot */}
        <View style={s.leftSection}>
          {leftSlot ? (
            leftSlot
          ) : showBack ? (
            <TouchableOpacity
              style={s.touchTarget48}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              testID="header-back-button"
            >
              <Text style={s.backIcon}>←</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Center Section: Title & Subtitle or Search Field */}
        <View style={s.centerSection}>
          {variant === 'search' ? (
            <View style={s.searchFieldWrap}>
              <Ionicons name="search-outline" size={18} color="#475569" style={s.searchFieldIcon} />
              <TextInput
                style={s.searchFieldInput}
                placeholder={title || "Search products, orders..."}
                placeholderTextColor={Colors.textMuted || '#94A3B8'}
                value={searchValue}
                onChangeText={onSearchChange}
                autoFocus
                accessibilityLabel="Search input"
              />
              {searchValue.length > 0 && (
                <TouchableOpacity
                  style={s.searchClearBtn}
                  onPress={() => onSearchChange?.('')}
                >
                  <Ionicons name="close" size={18} style={{ color: '#475569' }} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={s.titleWrap}>
              {title ? (
                <Text style={s.titleText} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text style={s.subtitleText} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Right Section: Actions & Notification Bell */}
        <View style={s.rightSection}>
          {variant === 'search' && onCancelSearch ? (
            <TouchableOpacity
              style={s.cancelSearchBtn}
              onPress={onCancelSearch}
              activeOpacity={0.7}
            >
              <Text style={s.cancelSearchText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <>
              {rightActions}
              {showBell && (
                <TouchableOpacity
                  style={s.touchTarget48}
                  onPress={handleBell}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                  testID="header-bell-button"
                >
                  <Ionicons name="notifications-outline" size={22} color="#0F172A" />
                  {unreadBellCount > 0 && (
                    <View style={s.bellBadge}>
                      <Text style={s.bellBadgeText}>
                        {unreadBellCount > 9 ? '9+' : unreadBellCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {/* Large Variant Secondary Title Row */}
      {variant === 'large' && title && (
        <View style={s.largeTitleRow}>
          <Text style={s.largeTitleText} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 1000,
  },
  elevatedBorder: {
    borderBottomColor: '#CBD5E1',
  },
  innerRow: {
    height: 56,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  innerRowDesktop: {
    height: 64,
    minHeight: 64,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
  },
  touchTarget48: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadii.input || 12,
  },
  backIcon: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary || '#0F172A',
  },
  centerSection: {
    flex: 1,
    paddingHorizontal: Spacing.xs || 8,
    justifyContent: 'center',
  },
  titleWrap: {
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary || '#0F172A',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontWeight: '500',
    color: Colors.textSecondary || '#64748B',
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
    gap: 4,
  },
  bellIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
  },
  bellBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary || '#1D4ED8',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  searchFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchFieldIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    marginRight: 6,
  },
  searchFieldInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textPrimary || '#0F172A',
    padding: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted || '#94A3B8',
  },
  cancelSearchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelSearchText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary || '#1D4ED8',
  },
  largeTitleRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  largeTitleText: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary || '#0F172A',
    letterSpacing: -0.6,
  },
});
