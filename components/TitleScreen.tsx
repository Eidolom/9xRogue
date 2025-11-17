import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Award, Info } from 'lucide-react-native';
import CRTBackground from './CRTBackground';
import { COLORS, BORDER } from '@/constants/theme';

interface TitleScreenProps {
  onStart: () => void;
  onProgress: () => void;
}

export default function TitleScreen({ onStart, onProgress }: TitleScreenProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <CRTBackground />

      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://rork.app/pa/1yt0z6bavpg1xinpmla1g/logo' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>9x ROGUE</Text>
          <Text style={styles.subtitle}>SUDOKU ROGUELIKE</Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.menuContainer,
            { opacity: fadeAnim },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onStart}
            activeOpacity={0.8}
          >
            <Play size={20} color="#000000" fill="#000000" />
            <Text style={styles.primaryButtonText}>START GAME</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onProgress}
            activeOpacity={0.8}
          >
            <Award size={18} color={COLORS.primary.cyan} />
            <Text style={styles.secondaryButtonText}>PROGRESS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
          >
            <Info size={18} color={COLORS.primary.cyan} />
            <Text style={styles.secondaryButtonText}>HOW TO PLAY</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.footerText}>▓ v1.0.0 ▓</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  logoContainer: {
    marginBottom: 24,
    padding: 0,
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold' as const,
    color: COLORS.accent.amber,
    textAlign: 'center' as const,
    letterSpacing: 6,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 8,
    letterSpacing: 4,
    fontWeight: 'bold' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  menuContainer: {
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.primary.cyan,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#000000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 3,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    gap: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: COLORS.primary.cyan,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 3,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.text.muted,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 2,
  },
});
