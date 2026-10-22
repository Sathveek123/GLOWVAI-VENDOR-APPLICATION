import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator, ImageStyle, ViewStyle } from 'react-native';
import { Colors } from '../theme/tokens';

interface ProductImageThumbnailProps {
  uri?: string;
  category?: string;
  fallbackEmoji?: string;
  style?: ImageStyle | ViewStyle;
  size?: number;
}

export default function ProductImageThumbnail({
  uri,
  category = '',
  fallbackEmoji = '🧴',
  size = 48,
}: ProductImageThumbnailProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Category to default emoji mapper
  const getCategoryEmoji = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('skincare') || c.includes('serum') || c.includes('cleanser')) return '🧴';
    if (c.includes('makeup') || c.includes('lipstick') || c.includes('foundation')) return '💄';
    if (c.includes('hair') || c.includes('shampoo')) return '💇‍♀️';
    if (c.includes('fragrance') || c.includes('perfume')) return '✨';
    if (c.includes('tool') || c.includes('brush')) return '🖌️';
    if (c.includes('bath') || c.includes('body') || c.includes('cream')) return '🧼';
    return fallbackEmoji || '🧴';
  };

  const hasValidUri = Boolean(uri && typeof uri === 'string' && uri.trim().length > 0 && uri.startsWith('http'));

  if (!hasValidUri || error) {
    return (
      <View style={[styles.fallbackContainer, { width: size, height: size, borderRadius: size > 40 ? 10 : 8 }]}>
        <Text style={[styles.fallbackEmoji, { fontFamily: 'PlusJakartaSans_400Regular', fontSize: size * 0.45 }]}>{getCategoryEmoji(category)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.imageContainer, { width: size, height: size, borderRadius: size > 40 ? 10 : 8 }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size > 40 ? 10 : 8 }]}
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    backgroundColor: '#F1F5F9',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  fallbackContainer: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackEmoji: {
    textAlign: 'center',
  },
});
