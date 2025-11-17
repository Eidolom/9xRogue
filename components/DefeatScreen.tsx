import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/contexts/GameContext';
import { Skull, Target, AlertTriangle } from 'lucide-react-native';
import CRTBackground from './CRTBackground';
import { COLORS, BORDER } from '@/constants/theme';

export default function DefeatScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, restartGame } = useGame();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CRTBackground showVignette vignetteIntensity={0.3} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconBox}>
            <Skull size={80} color={COLORS.accent.red} />
          </View>
        </View>

        <Text style={styles.title}>▓▓ CORRUPTED ▓▓</Text>
        <Text style={styles.subtitle}>OVERWHELMED ON FLOOR {gameState.floor}</Text>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>[ RUN SUMMARY ]</Text>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Target size={24} color={COLORS.primary.cyan} />
              <Text style={styles.statLabel}>FLOORS</Text>
              <Text style={styles.statValue}>{gameState.floor}</Text>
            </View>

            <View style={styles.statItem}>
              <AlertTriangle size={24} color={COLORS.accent.amber} />
              <Text style={styles.statLabel}>MISTAKES</Text>
              <Text style={styles.statValue}>{gameState.mistakes}</Text>
            </View>
          </View>

          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>PUZZLE PROGRESS</Text>
            <Text style={styles.progressValue}>
              {gameState.completedCells} / {gameState.totalCells} CELLS
            </Text>
          </View>
        </View>

        {gameState.upgrades.length > 0 && (
          <View style={styles.upgradesCard}>
            <Text style={styles.upgradesTitle}>[ RELICS YOU HAD ]</Text>
            {gameState.upgrades.map((upgrade) => (
              <View key={upgrade.id} style={styles.upgradeItem}>
                <Text style={styles.upgradeName}>▸ {upgrade.name}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.tipText}>
          ░ TIP: USE UPGRADES WISELY TO MANAGE CORRUPTION ░
        </Text>

        <TouchableOpacity
          style={styles.playButton}
          onPress={restartGame}
          activeOpacity={0.8}
        >
          <Text style={styles.playText}>[ TRY AGAIN ]</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBox: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: BORDER.thick,
    borderColor: COLORS.accent.red,
    backgroundColor: COLORS.background.primary,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold' as const,
    color: COLORS.accent.red,
    marginBottom: 8,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 32,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 2,
  },
  statsCard: {
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    padding: 24,
    width: '100%',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: COLORS.primary.cyan,
    marginBottom: 20,
    textAlign: 'center' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.text.secondary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  progressInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: BORDER.medium,
    borderTopColor: COLORS.primary.cyan,
  },
  progressLabel: {
    fontSize: 9,
    color: COLORS.text.secondary,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 1,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  upgradesCard: {
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  upgradesTitle: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: COLORS.primary.cyan,
    marginBottom: 16,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 2,
  },
  upgradeItem: {
    marginBottom: 8,
  },
  upgradeName: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  tipText: {
    fontSize: 10,
    color: COLORS.text.muted,
    marginBottom: 24,
    textAlign: 'center' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 1,
  },
  playButton: {
    width: '100%',
    backgroundColor: COLORS.accent.red,
    borderWidth: BORDER.thick,
    borderColor: COLORS.accent.red,
    paddingVertical: 18,
    alignItems: 'center',
  },
  playText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#000000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 3,
  },
});
