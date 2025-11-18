import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CRTBackgroundProps {
  showVignette?: boolean;
  vignetteIntensity?: number;
}

export default function CRTBackground({ showVignette = false, vignetteIntensity = 0.2 }: CRTBackgroundProps) {
  return (
    <>
      <View style={styles.crtBackground} />
      
      <View style={styles.scanlinePattern} />
      
      {showVignette && (
        <View style={[styles.vignette, { opacity: vignetteIntensity }]} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  crtBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  scanlinePattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(196, 76, 196, 1)',
    borderLeftWidth: 40,
    borderRightWidth: 40,
    borderLeftColor: 'rgba(196, 76, 196, 0.8)',
    borderRightColor: 'rgba(196, 76, 196, 0.8)',
  },
});
