/**
 * DEV TOOL: AppHeader Preview Workstation (/dev/header)
 * Displays AppHeader in every variant (default, large, search),
 * simulated notch insets, and 130% font scale toggle.
 * File: mobile/app/dev/header.tsx
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AppHeader from '../../src/components/AppHeader';
import ScreenShell from '../../src/components/ScreenShell';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';

function DevHeaderPreview() {
  const router = useRouter();
  const [simulatedNotch, setSimulatedNotch] = useState(true);
  const [fontScale130, setFontScale130] = useState(false);
  const [elevated, setElevated] = useState(true);
  const [showBell, setShowBell] = useState(true);
  const [unreadCount, setUnreadCount] = useState(3);

  return (
    <SafeAreaView style={styles.root}>
      {/* Dev Control Bar */}
      <View style={styles.controlBar}>
        <View style={styles.controlHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.controlTitle}>🛠️ AppHeader Dev Preview Workstation</Text>
        </View>

        <View style={styles.togglesRow}>
          <View style={styles.toggleGroup}>
            <Text style={styles.toggleLabel}>Simulate Notch (insets.top=44):</Text>
            <Switch value={simulatedNotch} onValueChange={setSimulatedNotch} />
          </View>

          <View style={styles.toggleGroup}>
            <Text style={styles.toggleLabel}>Font Scale 130%:</Text>
            <Switch value={fontScale130} onValueChange={setFontScale130} />
          </View>

          <View style={styles.toggleGroup}>
            <Text style={styles.toggleLabel}>Show Bell Badge ({unreadCount}):</Text>
            <Switch value={showBell} onValueChange={setShowBell} />
          </View>
        </View>
      </View>

      {/* Main Preview Workspace */}
      <ScrollView style={styles.previewScroll} contentContainerStyle={styles.scrollContent}>
        {/* Simulated iPhone Device Frame with Notch */}
        <View style={[styles.deviceFrame, fontScale130 && { transform: [{ scale: 1.05 }] }]}>
          {simulatedNotch && (
            <View style={styles.simulatedNotchBar}>
              <View style={styles.simulatedDynamicIsland}>
                <View style={styles.simulatedCameraDot} />
              </View>
            </View>
          )}

          {/* Variant 1: Default AppHeader */}
          <Text style={styles.variantLabel}>1. DEFAULT VARIANT (56px inner height + safe area inset)</Text>
          <View style={styles.headerContainerBorder}>
            <AppHeader
              title="Store Command Center"
              subtitle="Sri Lakshmi Beauty Store • DS-VIJ-01"
              showBack={true}
              showBell={showBell}
              unreadBellCount={unreadCount}
              elevated={elevated}
              testID="header-default-variant"
            />
          </View>

          {/* Variant 2: Large AppHeader */}
          <Text style={styles.variantLabel}>2. LARGE VARIANT (With 28px Sub-Header Title Row)</Text>
          <View style={styles.headerContainerBorder}>
            <AppHeader
              variant="large"
              title="Orders & Dispatch"
              subtitle="14 active quick commerce orders in prep"
              showBack={true}
              showBell={showBell}
              unreadBellCount={unreadCount}
              elevated={elevated}
              testID="header-large-variant"
            />
          </View>

          {/* Variant 3: Search AppHeader */}
          <Text style={styles.variantLabel}>3. SEARCH VARIANT (Replacing Title with Search Field)</Text>
          <View style={styles.headerContainerBorder}>
            <AppHeader
              variant="search"
              title="Search Catalog"
              showBack={true}
              elevated={elevated}
              testID="header-search-variant"
            />
          </View>

          {/* Variant 4: ScreenShell Wrapped Full Screen Test */}
          <Text style={styles.variantLabel}>4. FULL SCREEN IN ScreenShell</Text>
          <View style={styles.shellPreviewBox}>
            <ScreenShell
              header={{
                title: 'ScreenShell Integration',
                subtitle: 'Unified Layout Wrapper',
                showBack: true,
              }}
              scroll={false}
            >
              <View style={styles.shellContentDemo}>
                <Text style={styles.shellDemoText}>
                  This screen content is wrapped inside ScreenShell. The status bar insets are automatically handled by AppHeader, and left/right safe area edges are applied cleanly.
                </Text>
              </View>
            </ScreenShell>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  controlBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 16,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  controlTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  togglesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
  },
  previewScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  deviceFrame: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  simulatedNotchBar: {
    height: 44,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatedDynamicIsland: {
    width: 110,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatedCameraDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E293B',
  },
  variantLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  headerContainerBorder: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  shellPreviewBox: {
    height: 240,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  shellContentDemo: {
    padding: 16,
  },
  shellDemoText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
});

// Developer-only preview. Never rendered in release builds.
export default function DevHeaderPreviewScreen() {
  return __DEV__ ? <DevHeaderPreview /> : null;
}
