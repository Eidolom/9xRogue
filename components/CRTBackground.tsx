import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface CRTBackgroundProps {
  showVignette?: boolean;
  vignetteIntensity?: number;
}

export default function CRTBackground({ showVignette = false, vignetteIntensity = 0.2 }: CRTBackgroundProps) {
  const scanlineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanlineAnim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(scanlineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scanlineTranslateY = scanlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-1000, 1000],
  });

  return (
    <>
      <View style={styles.crtBackground}>
        {Array.from({ length: 100 }).map((_, i) => (
          <View key={i} style={[styles.scanline, { top: i * 10 }]} />
        ))}
      </View>
      
      <View style={styles.halftone} />
      
      <Animated.View 
        style={[
          styles.scanlineOverlay, 
          { transform: [{ translateY: scanlineTranslateY }] }
        ]} 
      />
      
      {showVignette && (
        <View style={[styles.vignette, { 
          borderLeftWidth: 40,
          borderRightWidth: 40,
          borderLeftColor: `rgba(196, 76, 196, ${vignetteIntensity})`,
          borderRightColor: `rgba(196, 76, 196, ${vignetteIntensity})`,
        }]} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  crtBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  scanline: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(93, 188, 210, 0.03)',
  },
  halftone: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  scanlineOverlay: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(93, 188, 210, 0.03)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
