/**
 * The one screen header for the vendor app.
 *
 * - Title and subtitle are always left-aligned. Without a back button the title sits on the
 *   16px page gutter; with one, the arrow sits on the gutter and the title follows it.
 * - The five tab screens (Home, Orders, Inventory, Earnings, Profile) are roots, so a back
 *   arrow is never shown on them even if a screen passes `showBack`.
 * - Every control is at least 44x44.
 */
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Colors, Spacing, BorderRadii, Breakpoints } from '../theme/tokens';
import { FontFamily } from '../theme/typography';
import { isTabRootPath } from './MobileBottomNav';

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

const BAR_HEIGHT = 56;
const BAR_HEIGHT_DESKTOP = 64;

function useTopInset() {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'android' ? insets.top || StatusBar.currentHeight || 0 : insets.top;
}

export function useHeaderHeight(): number {
  const top = useTopInset();
  const { width } = useWindowDimensions();
  return top + (width >= Breakpoints.desktop ? BAR_HEIGHT_DESKTOP : BAR_HEIGHT);
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
  const router = useRouter();
  const pathname = usePathname();
  const topPadding = useTopInset();
  const { width } = useWindowDimensions();
  const isDesktop = width >= Breakpoints.desktop;

  // Tab screens are roots: no back arrow there unless the screen handles back itself.
  const backVisible = showBack && (!!onBack || !isTabRootPath(pathname));
  const hasLeft = !!leftSlot || backVisible;

  const handleBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
    else router.navigate('/(vendor)/home');
  };

  const handleBell = () => {
    if (onBellPress) onBellPress();
    else router.push('/(vendor)/notifications');
  };

  const bellLabel = unreadBellCount > 0 ? `Notifications, ${unreadBellCount} unread` : 'Notifications';

  return (
    <View testID={testID} style={[s.outer, { paddingTop: topPadding }, elevated && s.elevated]}>
      <View style={[s.row, { height: isDesktop ? BAR_HEIGHT_DESKTOP : BAR_HEIGHT }, hasLeft ? s.rowWithLeft : s.rowNoLeft]}>
        {hasLeft ? (
          <View style={s.left}>
            {leftSlot ??
              (backVisible ? (
                <Pressable
                  style={({ pressed }) => [s.iconButton, pressed && s.pressed]}
                  onPress={handleBack}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  testID="header-back-button"
                  hitSlop={4}
                >
                  <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </Pressable>
              ) : null)}
          </View>
        ) : null}

        <View style={s.center}>
          {variant === 'search' ? (
            <View style={s.searchField}>
              <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={s.searchIcon} />
              <TextInput
                style={[s.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                placeholder={title || 'Search'}
                placeholderTextColor={Colors.textSubtle}
                value={searchValue}
                onChangeText={onSearchChange}
                autoFocus
                returnKeyType="search"
                accessibilityLabel={title || 'Search'}
              />
              {searchValue.length > 0 ? (
                <Pressable
                  style={s.searchClear}
                  onPress={() => onSearchChange?.('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          ) : variant === 'large' ? null : (
            <>
              {title ? (
                <Text style={s.title} numberOfLines={1} accessibilityRole="header">
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text style={s.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </>
          )}
        </View>

        <View style={s.right}>
          {variant === 'search' && onCancelSearch ? (
            <Pressable style={s.textButton} onPress={onCancelSearch} accessibilityRole="button" accessibilityLabel="Cancel search">
              <Text style={s.textButtonLabel}>Cancel</Text>
            </Pressable>
          ) : (
            <>
              {rightActions}
              {showBell ? (
                <Pressable
                  style={({ pressed }) => [s.iconButton, pressed && s.pressed]}
                  onPress={handleBell}
                  accessibilityRole="button"
                  accessibilityLabel={bellLabel}
                  testID="header-bell-button"
                >
                  <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
                  {unreadBellCount > 0 ? (
                    <View style={s.badge}>
                      <Text style={s.badgeText}>{unreadBellCount > 9 ? '9+' : unreadBellCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </View>

      {variant === 'large' && title ? (
        <View style={s.largeRow}>
          <Text style={s.largeTitle} numberOfLines={2} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  elevated: {
    borderBottomColor: Colors.borderStrong,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // The 44px back button keeps its arrow on the 16px gutter: 4 + (44 - 22) / 2 = 15.
  rowWithLeft: { paddingLeft: Spacing.xs, paddingRight: Spacing.sm },
  rowNoLeft: { paddingLeft: Spacing.lg, paddingRight: Spacing.sm },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  center: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadii.pill,
  },
  pressed: { backgroundColor: Colors.surface },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  badgeText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    lineHeight: 14,
    fontFamily: FontFamily.semibold,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.button,
    paddingLeft: Spacing.md,
    height: 44,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: Colors.textPrimary,
    padding: 0,
  },
  searchClear: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButtonLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    color: Colors.primary,
  },
  largeRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  largeTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
});
