import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Award, Info } from 'lucide-react-native';
import CRTBackground from './CRTBackground';
import { COLORS, BORDER } from '@/constants/theme';

const { width } = Dimensions.get('window');
const isDesktop = width > 768;

interface TitleScreenProps {
  onStart: () => void;
  onProgress: () => void;
}

export default function TitleScreen({ onStart, onProgress }: TitleScreenProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const corruptionPulse = useRef(new Animated.Value(1)).current;
  const [glitchText, setGlitchText] = useState('9x ROGUE');
  const [showGlitch, setShowGlitch] = useState(false);

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

    const glitchLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glitchAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glitchAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(corruptionPulse, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(corruptionPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    glitchLoop.start();
    pulseLoop.start();

    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setShowGlitch(true);
        const glitchVariants = ['9█ R0GU█', '█x ROGUE', '9x R█GUE', '9x RO█UE'];
        setGlitchText(glitchVariants[Math.floor(Math.random() * glitchVariants.length)]);
        setTimeout(() => {
          setGlitchText('9x ROGUE');
          setShowGlitch(false);
        }, 150);
      }
    }, 3000);

    return () => {
      glitchLoop.stop();
      pulseLoop.stop();
      clearInterval(glitchInterval);
    };
  }, [fadeAnim, scaleAnim, glitchAnim, corruptionPulse]);

  const SudokuGrid = () => {
    const corruptedNumbers = ['▓', '█', '▒', '░'];
    const grid = [
      [5, 3, null, null, 7, null, null, null, null],
      [6, null, null, 1, 9, 5, null, null, null],
      [null, 9, 8, null, null, null, null, 6, null],
    ];

    return (
      <View style={styles.sudokuGrid}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.sudokuRow}>
            {row.slice(0, 9).map((cell, colIndex) => {
              const isCorrupted = Math.random() > 0.7 && cell !== null;
              return (
                <Animated.View
                  key={colIndex}
                  style={[
                    styles.sudokuCell,
                    isCorrupted && styles.corruptedCell,
                    {
                      transform: [{
                        scale: isCorrupted ? corruptionPulse : 1
                      }]
                    }
                  ]}
                >
                  <Text style={[
                    styles.sudokuNumber,
                    isCorrupted && styles.corruptedNumber
                  ]}>
                    {isCorrupted 
                      ? corruptedNumbers[Math.floor(Math.random() * corruptedNumbers.length)]
                      : (cell || '·')}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CRTBackground />
      
      <View style={styles.scanlineOverlay} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainContainer, { paddingTop: insets.top + (isDesktop ? 80 : 40) }]}>
          
          <Animated.View 
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <SudokuGrid />

            <View style={styles.titleWrapper}>
              <Text style={styles.title}>{glitchText}</Text>
              <Animated.Text 
                style={[
                  styles.title, 
                  styles.glitchTitle,
                  {
                    transform: [{
                      translateX: glitchAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, showGlitch ? -3 : 0]
                      })
                    }]
                  }
                ]}
              >
                {glitchText}
              </Animated.Text>
            </View>
            
            <View style={styles.subtitleContainer}>
              <Text style={styles.statusText}>SYSTEM STATUS: CRITICAL</Text>
              <View style={styles.corruptionWrapper}>
                <View style={styles.corruptionBar}>
                  <Animated.View style={[
                    styles.corruptionFill,
                    { transform: [{ scale: corruptionPulse }] }
                  ]} />
                </View>
                <Text style={styles.corruptionText}>CORRUPTION: 35%</Text>
              </View>
            </View>
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
              <Text style={styles.primaryButtonText}>[ INITIATE RUN ]</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onProgress}
              activeOpacity={0.8}
            >
              <Award size={18} color={COLORS.primary.cyan} />
              <Text style={styles.secondaryButtonText}>{'//'} PROGRESS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.8}
            >
              <Info size={18} color={COLORS.primary.cyan} />
              <Text style={styles.secondaryButtonText}>{'//'} HOW TO PLAY</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.footerText}>SYSTEM_ID: SUDOKU_RL_VER_1.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scanlineOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    pointerEvents: 'none' as const,
    borderWidth: 0,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 100,
  },
  mainContainer: {
    width: '100%',
    maxWidth: 1000,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerSection: {
    marginBottom: 60,
    alignItems: 'center',
    width: '100%',
  },
  titleWrapper: {
    position: 'relative' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sudokuGrid: {
    marginBottom: 32,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    backgroundColor: COLORS.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  sudokuRow: {
    flexDirection: 'row',
  },
  sudokuCell: {
    width: 36,
    height: 36,
    borderWidth: BORDER.thin,
    borderColor: 'rgba(93, 188, 210, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corruptedCell: {
    backgroundColor: 'rgba(196, 76, 196, 0.2)',
    borderColor: COLORS.accent.magenta,
  },
  sudokuNumber: {
    fontSize: 16,
    color: COLORS.primary.cyan,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace',
    fontWeight: 'bold' as const,
  },
  corruptedNumber: {
    color: COLORS.accent.magenta,
  },
  title: {
    fontSize: isDesktop ? 72 : 46,
    fontWeight: '900' as const,
    color: COLORS.primary.cyan,
    textAlign: 'center' as const,
    letterSpacing: isDesktop ? 12 : 8,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace',
    textShadowColor: 'rgba(32, 224, 128, 0.5)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    marginBottom: 20,
  },
  glitchTitle: {
    position: 'absolute' as const,
    top: 0,
    left: 2,
    color: COLORS.accent.magenta,
    textShadowColor: '#ffffff',
    textShadowOffset: { width: -2, height: 0 },
    textShadowRadius: 0,
    opacity: 0.7,
  },
  subtitleContainer: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  statusText: {
    fontSize: 12,
    color: COLORS.text.primary,
    letterSpacing: 4,
    fontWeight: 'bold' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace',
    textTransform: 'uppercase' as const,
  },
  corruptionWrapper: {
    alignItems: 'center',
    marginTop: 10,
  },
  corruptionBar: {
    width: isDesktop ? 400 : 280,
    height: 24,
    backgroundColor: '#000000',
    borderWidth: BORDER.thick,
    borderColor: COLORS.text.primary,
    padding: 2,
    shadowColor: COLORS.accent.magenta,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  corruptionFill: {
    width: '35%',
    height: '100%',
    backgroundColor: COLORS.accent.magenta,
  },
  corruptionText: {
    marginTop: 8,
    fontSize: 10,
    color: COLORS.accent.magenta,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace',
    letterSpacing: 1,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 20,
    marginBottom: 60,
  },
  primaryButton: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary.cyan,
    borderWidth: BORDER.thick,
    borderColor: '#ffffff',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#000000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: BORDER.thin,
    borderColor: COLORS.text.primary,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  footer: {
    width: '100%',
    paddingVertical: 30,
    alignItems: 'center',
    borderTopWidth: BORDER.thin,
    borderTopColor: COLORS.text.muted,
    marginTop: 40,
  },
  footerText: {
    fontSize: 10,
    color: COLORS.text.muted,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace',
    letterSpacing: 1,
  },
});
