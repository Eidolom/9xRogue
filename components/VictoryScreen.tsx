import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/contexts/GameContext';
import { Trophy, Sparkles, Target, Shield } from 'lucide-react-native';
import CRTBackground from './CRTBackground';
import { COLORS, BORDER } from '@/constants/theme';

export default function VictoryScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, restartGame } = useGame();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CRTBackground />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconBox}>
            <Trophy size={80} color={COLORS.accent.amber} />
          </View>
        </View>

        <Text style={styles.title}>▓▓ VICTORY ▓▓</Text>
        <Text style={styles.subtitle}>CONQUERED ALL {gameState.maxFloors} FLOORS</Text>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>[ FINAL STATISTICS ]</Text>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Target size={24} color={COLORS.primary.cyan} />
              <Text style={styles.statLabel}>FLOORS</Text>
              <Text style={styles.statValue}>{gameState.floor}</Text>
            </View>

            <View style={styles.statItem}>
              <Sparkles size={24} color={COLORS.accent.amber} />
              <Text style={styles.statLabel}>COINS</Text>
              <Text style={styles.statValue}>{gameState.coins}</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Shield size={24} color={COLORS.accent.red} />
              <Text style={styles.statLabel}>MISTAKES</Text>
              <Text style={styles.statValue}>{gameState.mistakes}</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.upgradeIcon}>▓</Text>
              <Text style={styles.statLabel}>UPGRADES</Text>
              <Text style={styles.statValue}>{gameState.upgrades.length}</Text>
            </View>
          </View>
        </View>

        {gameState.upgrades.length > 0 && (
          <View style={styles.upgradesCard}>
            <Text style={styles.upgradesTitle}>[ RELICS COLLECTED ]</Text>
            {gameState.upgrades.map((upgrade) => (
              <View key={upgrade.id} style={styles.upgradeItem}>
                <Text style={styles.upgradeName}>▸ {upgrade.name}</Text>
                <Text style={styles.upgradeDesc}>{upgrade.description}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.playButton}
          onPress={restartGame}
          activeOpacity={0.8}
        >
          <Text style={styles.playText}>[ PLAY AGAIN ]</Text>
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
    borderColor: COLORS.accent.amber,
    backgroundColor: COLORS.background.primary,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold' as const,
    color: COLORS.accent.amber,
    marginBottom: 8,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 32,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
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
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    letterSpacing: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.text.secondary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  },
  upgradeIcon: {
    fontSize: 24,
    color: COLORS.primary.cyan,
  },
  upgradesCard: {
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  upgradesTitle: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: COLORS.primary.cyan,
    marginBottom: 16,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    letterSpacing: 2,
  },
  upgradeItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: BORDER.thin,
    borderBottomColor: COLORS.primary.cyan,
  },
  upgradeName: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  },
  upgradeDesc: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  },
  playButton: {
    width: '100%',
    backgroundColor: COLORS.primary.cyan,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    paddingVertical: 18,
    alignItems: 'center',
  },
  playText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#000000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    letterSpacing: 3,
  },
});
