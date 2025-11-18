import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

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
          duration: 8000,
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
    outputRange: [-300, height + 300],
  });

  return (
    <>
      <View style={styles.crtBackground}>
        {Array.from({ length: Math.ceil(height / 4) }).map((_, i) => (
          <View key={i} style={[styles.scanline, { top: i * 4 }]} />
        ))}
      </View>
      
      <View style={styles.noiseOverlay} />
      
      <Animated.View 
        style={[
          styles.scanlineOverlay, 
          { transform: [{ translateY: scanlineTranslateY }] }
        ]} 
      />
      
      <View style={styles.vignette} />
      
      {showVignette && (
        <View style={[styles.corruptionVignette, { 
          opacity: vignetteIntensity,
        }]} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  crtBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d0e15',
  },
  scanline: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.03,
  },
  scanlineOverlay: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(192, 203, 220, 0.02)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderTopWidth: 60,
    borderBottomWidth: 60,
    borderTopColor: 'rgba(0, 0, 0, 0.4)',
    borderBottomColor: 'rgba(0, 0, 0, 0.4)',
  },
  corruptionVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderLeftColor: 'rgba(255, 0, 68, 0.3)',
    borderRightColor: 'rgba(255, 0, 68, 0.3)',
  },
});
