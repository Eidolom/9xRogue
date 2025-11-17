import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Trophy, TrendingUp, Award, ShoppingBag } from 'lucide-react-native';
import { Achievement } from '@/types/achievements';
import { GameStats } from '@/types/achievements';
import CRTBackground from './CRTBackground';
import { COLORS, BORDER } from '@/constants/theme';

interface ProgressScreenProps {
  stats: GameStats;
  achievements: Achievement[];
  onBack: () => void;
}

export default function ProgressScreen({ stats, achievements, onBack }: ProgressScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<'stats' | 'achievements'>('stats');

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const achievementProgress = (unlockedCount / achievements.length) * 100;

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return COLORS.primary.cyan;
      case 'rare': return COLORS.primary.cyan;
      case 'epic': return COLORS.accent.magenta;
      case 'legendary': return COLORS.accent.amber;
    }
  };

  const renderAchievement = (achievement: Achievement) => {
    const progress = Math.min((achievement.progress / achievement.requirement) * 100, 100);
    const rarityColor = getRarityColor(achievement.rarity);

    return (
      <View 
        key={achievement.id} 
        style={[
          styles.achievementCard,
          achievement.unlocked && styles.achievementUnlocked,
        ]}
      >
        <View style={styles.achievementHeader}>
          <View style={[styles.achievementIcon, { borderColor: rarityColor }]}>
            <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
            {achievement.unlocked && (
              <View style={styles.unlockedBadge}>
                <Award size={12} color={COLORS.primary.cyan} />
              </View>
            )}
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementName, { color: rarityColor }]}>
              {achievement.name}
            </Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
          </View>
        </View>
        
        {!achievement.unlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: rarityColor }]} />
            </View>
            <Text style={styles.progressText}>
              {achievement.progress}/{achievement.requirement}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderStatsContent = () => (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Trophy size={28} color={COLORS.accent.amber} />
        <Text style={styles.statValue}>{stats.gamesWon}</Text>
        <Text style={styles.statLabel}>GAMES WON</Text>
      </View>

      <View style={styles.statCard}>
        <TrendingUp size={28} color={COLORS.primary.cyan} />
        <Text style={styles.statValue}>{stats.highestFloor}</Text>
        <Text style={styles.statLabel}>HIGHEST</Text>
      </View>

      <View style={styles.statCard}>
        <Award size={28} color={COLORS.accent.magenta} />
        <Text style={styles.statValue}>{stats.perfectFloorsCompleted}</Text>
        <Text style={styles.statLabel}>PERFECT</Text>
      </View>

      <View style={styles.statCard}>
        <ShoppingBag size={28} color={COLORS.primary.cyan} />
        <Text style={styles.statValue}>{stats.totalUpgradesPurchased}</Text>
        <Text style={styles.statLabel}>UPGRADES</Text>
      </View>

      <View style={[styles.statCard, styles.statCardWide]}>
        <Text style={styles.statValue}>{stats.totalFloorsCompleted}</Text>
        <Text style={styles.statLabel}>TOTAL FLOORS</Text>
      </View>

      <View style={[styles.statCard, styles.statCardWide]}>
        <Text style={styles.statValue}>{stats.totalCurrencyEarned}</Text>
        <Text style={styles.statLabel}>TOTAL CURRENCY</Text>
      </View>

      <View style={[styles.statCard, styles.statCardWide]}>
        <Text style={styles.statValue}>{stats.currentWinStreak}</Text>
        <Text style={styles.statLabel}>WIN STREAK</Text>
      </View>

      <View style={[styles.statCard, styles.statCardWide]}>
        <Text style={styles.statValue}>{stats.bestWinStreak}</Text>
        <Text style={styles.statLabel}>BEST STREAK</Text>
      </View>
    </View>
  );

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const renderAchievementsContent = () => (
    <View style={styles.achievementsContainer}>
      <View style={styles.achievementOverview}>
        <Text style={styles.achievementOverviewText}>
          {unlockedCount} / {achievements.length} UNLOCKED
        </Text>
        <View style={styles.overviewProgressBar}>
          <View style={[styles.overviewProgressFill, { width: `${achievementProgress}%` }]} />
        </View>
      </View>

      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>▸ {category.toUpperCase()}</Text>
          {categoryAchievements.map(renderAchievement)}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <CRTBackground />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>▓ PROGRESS ▓</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'stats' && styles.tabActive]}
          onPress={() => setSelectedTab('stats')}
          activeOpacity={0.7}
        >
          <TrendingUp size={20} color={selectedTab === 'stats' ? '#000000' : COLORS.primary.cyan} />
          <Text style={[styles.tabText, selectedTab === 'stats' && styles.tabTextActive]}>
            STATS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'achievements' && styles.tabActive]}
          onPress={() => setSelectedTab('achievements')}
          activeOpacity={0.7}
        >
          <Award size={20} color={selectedTab === 'achievements' ? '#000000' : COLORS.primary.cyan} />
          <Text style={[styles.tabText, selectedTab === 'achievements' && styles.tabTextActive]}>
            ACHIEVEMENTS
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'stats' ? renderStatsContent() : renderAchievementsContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.accent.amber,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 3,
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    gap: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary.cyan,
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: COLORS.primary.cyan,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 2,
  },
  tabTextActive: {
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.background.primary,
    padding: 20,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    alignItems: 'center',
  },
  statCardWide: {
    width: '100%',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    marginTop: 12,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginTop: 4,
    textAlign: 'center' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 1,
  },
  achievementsContainer: {
    gap: 20,
  },
  achievementOverview: {
    backgroundColor: COLORS.background.primary,
    padding: 20,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
  },
  achievementOverviewText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 2,
  },
  overviewProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden' as const,
  },
  overviewProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary.cyan,
  },
  categorySection: {
    gap: 12,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: 'bold' as const,
    color: COLORS.primary.cyan,
    letterSpacing: 2,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  achievementCard: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderWidth: BORDER.medium,
    borderColor: COLORS.primary.cyan,
  },
  achievementUnlocked: {
    backgroundColor: 'rgba(93, 188, 210, 0.1)',
    borderColor: COLORS.primary.cyan,
    borderWidth: BORDER.thick,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.medium,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' as const,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  unlockedBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    backgroundColor: COLORS.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    marginBottom: 2,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  achievementDescription: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden' as const,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 10,
    color: COLORS.text.secondary,
    textAlign: 'right' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
});
