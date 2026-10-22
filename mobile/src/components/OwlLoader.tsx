/**
 * GlowVAI Vendor App — Universal Animated Loader (popular-owl-27 style)
 * ═══════════════════════════════════════════════════════════════════════════
 * High-performance, cross-platform animated liquid-dot loader with #1D4ED8 glow
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface OwlLoaderProps {
  label?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export const OwlLoader: React.FC<OwlLoaderProps> = ({
  label = 'Loading live data...',
  color = '#1D4ED8',
  size = 'medium',
}) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 3-dot staggered wave animation
    const createBounce = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createBounce(dot1, 0);
    const anim2 = createBounce(dot2, 160);
    const anim3 = createBounce(dot3, 320);

    const spinAnim = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    anim1.start();
    anim2.start();
    anim3.start();
    spinAnim.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
      spinAnim.stop();
    };
  }, [dot1, dot2, dot3, rotate]);

  const dotSize = size === 'small' ? 8 : size === 'large' ? 14 : 11;
  const containerPadding = size === 'small' ? 8 : 16;

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { padding: containerPadding }]}>
      <Animated.View style={[styles.orbitRing, { borderColor: `${color}25`, transform: [{ rotate: spin }] }]}>
        <View style={[styles.orbitSatellite, { backgroundColor: color }]} />
      </Animated.View>

      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((anim, idx) => {
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -10],
          });
          const scale = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1.25],
          });
          const opacity = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
          });

          return (
            <Animated.View
              key={idx}
              style={[
                styles.dot,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: color,
                  opacity,
                  transform: [{ translateY }, { scale }],
                },
              ]}
            />
          );
        })}
      </View>

      {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  orbitSatellite: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: -3,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
  },
  dot: {
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});

export default OwlLoader;
