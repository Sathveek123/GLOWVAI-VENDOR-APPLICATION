/**
 * Standard screen frame for the vendor app: AppHeader, a scrolling body on the
 * #F4F6FA canvas, an optional sticky footer, and an error boundary around the body.
 *
 * Navigation (bottom tabs on phones, the left sidebar on desktop) is drawn by
 * app/(vendor)/_layout.tsx. Screens must not draw their own tab bar or sidebar rail.
 */
import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader, { AppHeaderProps, useHeaderHeight } from './AppHeader';
import ErrorBoundary from './ErrorBoundary';
import { Colors, Spacing, Breakpoints } from '../theme/tokens';

export { default as ErrorBoundary, withErrorBoundary, ErrorFallback } from './ErrorBoundary';

export interface ScreenShellProps {
  header?: AppHeaderProps;
  children: React.ReactNode;
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  stickyFooter?: React.ReactNode;
  refreshControl?: React.ReactElement;
  /** Page background. Defaults to the canvas (#F4F6FA); cards on it are white. */
  backgroundColor?: string;
  testID?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Wraps the body in an ErrorBoundary (default true). The header stays usable after a crash. */
  errorBoundary?: boolean;
  /** Maximum content width on wide screens (default 1200). */
  maxContentWidth?: number;
}

export default function ScreenShell({
  header,
  children,
  scroll = true,
  keyboardAvoiding = false,
  stickyFooter,
  refreshControl,
  backgroundColor = Colors.canvas,
  testID = 'screen-shell',
  contentContainerStyle,
  errorBoundary = true,
  maxContentWidth = 1200,
}: ScreenShellProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { width } = useWindowDimensions();
  const isExpanded = width >= Breakpoints.desktop;
  const centered = isExpanded ? { maxWidth: maxContentWidth, alignSelf: 'center' as const } : null;

  const body = <View style={[s.content, centered]}>{children}</View>;

  const main = scroll ? (
    <ScrollView
      style={s.flex}
      contentContainerStyle={[s.scrollContent, contentContainerStyle]}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {body}
    </ScrollView>
  ) : (
    <View style={[s.flex, contentContainerStyle]}>{body}</View>
  );

  const guarded = errorBoundary ? <ErrorBoundary screen={header?.title}>{main}</ErrorBoundary> : main;

  const wrapped = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      {guarded}
    </KeyboardAvoidingView>
  ) : (
    guarded
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={[s.flex, { backgroundColor }]} testID={testID}>
      {header ? <AppHeader {...header} /> : null}
      <View style={s.flex}>{wrapped}</View>
      {stickyFooter ? (
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={[s.content, centered]}>{stickyFooter}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, width: '100%' },
  footer: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
});
