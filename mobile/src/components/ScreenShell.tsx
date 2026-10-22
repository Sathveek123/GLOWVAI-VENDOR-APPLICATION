import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader, { AppHeaderProps, useHeaderHeight } from './AppHeader';

export interface ScreenShellProps {
  header?: AppHeaderProps;
  children: React.ReactNode;
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  stickyFooter?: React.ReactNode;
  refreshControl?: React.ReactElement;
  backgroundColor?: string;
  testID?: string;
  contentContainerStyle?: any;
}

export default function ScreenShell({
  header,
  children,
  scroll = true,
  keyboardAvoiding = false,
  stickyFooter,
  refreshControl,
  backgroundColor = '#FFFFFF',
  testID = 'screen-shell',
  contentContainerStyle,
}: ScreenShellProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;

  const bodyContent = (
    <View style={[s.contentWrapper, isExpanded && s.contentWrapperCentered]}>
      {children}
    </View>
  );

  const mainView = scroll ? (
    <ScrollView
      style={s.scrollView}
      contentContainerStyle={[
        s.scrollContent,
        contentContainerStyle,
        stickyFooter && { paddingBottom: 16 },
      ]}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {bodyContent}
    </ScrollView>
  ) : (
    <View style={[s.flex1, contentContainerStyle]}>{bodyContent}</View>
  );

  const wrappedView = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={s.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      {mainView}
    </KeyboardAvoidingView>
  ) : (
    mainView
  );

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[s.root, { backgroundColor }]}
      testID={testID}
    >
      {header && <AppHeader {...header} />}
      <View style={s.flex1}>{wrappedView}</View>
      {stickyFooter && (
        <View
          style={[
            s.stickyFooterContainer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={[s.contentWrapper, isExpanded && s.contentWrapperCentered]}>
            {stickyFooter}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
  contentWrapperCentered: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
  stickyFooterContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    paddingHorizontal: 16,
    zIndex: 99,
  },
});
