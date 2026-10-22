/**
 * GlowVAI Vendor App — Customer Storefront Redirect Button (short-lion-13 style)
 * ═══════════════════════════════════════════════════════════════════════════
 * Compact, interactive floating button for vendor navigation bars:
 *   • Direct link to GlowVAI Customer App & Web Storefront
 *   • Brand Royal Blue border glow (#1D4ED8) with live pulse beacon
 *   • Compact footprint designed for mobile viewports
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';

interface CustomerAppRedirectButtonProps {
  customUrl?: string;
  storeName?: string;
}

export const CustomerAppRedirectButton: React.FC<CustomerAppRedirectButtonProps> = ({
  customUrl = process.env.EXPO_PUBLIC_CUSTOMER_APP_URL || '',
  storeName = 'GlowVAI Store',
}) => {
  // Hidden until a storefront URL is configured. It never points at a developer's localhost.
  if (!customUrl) return null;

  const handleOpenStorefront = async () => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(customUrl, '_blank');
      } else {
        const canOpen = await Linking.canOpenURL(customUrl);
        if (canOpen) {
          await Linking.openURL(customUrl);
        } else {
          Alert.alert('GlowVAI Customer App', `Could not open the storefront for ${storeName}.`);
        }
      }
    } catch (_) {
      Alert.alert('GlowVAI App', 'The storefront could not be opened. Please try again.');
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.82}
      onPress={handleOpenStorefront}
    >
      <View style={styles.glowAura} />

      <View style={styles.contentRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="bag-handle" size={11} color="#ffffff" />
          <View style={styles.livePulseDot} />
        </View>

        <View style={styles.textCol}>
          <Text style={styles.badgeText}>glowvai</Text>
          <Text style={styles.mainText}>customer app</Text>
        </View>

        <Feather name="arrow-up-right" size={12} color="#1D4ED8" style={styles.arrowIcon} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1D4ED8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  glowAura: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    backgroundColor: '#e6eeff',
    opacity: 0.6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  iconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  livePulseDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  textCol: {
    flexDirection: 'column',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#1D4ED8',
    letterSpacing: -0.2,
  },
  mainText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748b',
    marginTop: -1,
    textTransform: 'lowercase',
  },
  arrowIcon: {
    marginLeft: 1,
  },
});

export default CustomerAppRedirectButton;
