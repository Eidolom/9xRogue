import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
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
          <SudokuGrid />

          <Animated.View style={{
            transform: [{
              translateX: glitchAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, showGlitch ? 4 : 0]
              })
            }]
          }}>
            <Text style={[styles.title, showGlitch && styles.glitchTitle]}>
              {glitchText}
            </Text>
          </Animated.View>
          
          <View style={styles.subtitleContainer}>
            <View style={styles.corruptionBar}>
              <Animated.View style={[
                styles.corruptionFill,
                { transform: [{ scale: corruptionPulse }] }
              ]} />
            </View>
            <Text style={styles.subtitle}>[ LOGIC UNDER SIEGE ]</Text>
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
  sudokuGrid: {
    marginBottom: 32,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    backgroundColor: COLORS.background.primary,
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
    fontSize: 46,
    fontWeight: 'bold' as const,
    color: COLORS.primary.cyan,
    textAlign: 'center' as const,
    letterSpacing: 8,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace',
    textShadowColor: COLORS.primary.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 16,
  },
  glitchTitle: {
    color: COLORS.accent.magenta,
    textShadowColor: COLORS.accent.magenta,
  },
  subtitleContainer: {
    alignItems: 'center',
    gap: 8,
  },
  corruptionBar: {
    width: 200,
    height: 6,
    backgroundColor: 'rgba(93, 188, 210, 0.2)',
    borderWidth: BORDER.thin,
    borderColor: COLORS.primary.cyan,
    overflow: 'hidden',
  },
  corruptionFill: {
    width: '35%',
    height: '100%',
    backgroundColor: COLORS.accent.magenta,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.text.muted,
    letterSpacing: 3,
    fontWeight: 'bold' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace',
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
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace',
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
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace',
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
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace',
    letterSpacing: 2,
  },
});
