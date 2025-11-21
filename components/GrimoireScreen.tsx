import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGame } from '@/contexts/GameContext';
import { Zap, X } from 'lucide-react-native';
import CRTBackground from './CRTBackground';
import PixelIcon from './PixelIcon';
import { COLORS, BORDER } from '@/constants/theme';

type NumberUpgradeLevel = {
  level: number;
  name: string;
  description: string;
  cost: number;
  effect: string;
};

const NUMBER_UPGRADES_CATALOG: Record<number, NumberUpgradeLevel[]> = {
  1: [
    { level: 1, name: 'Scout', description: 'Find Naked Single: Highlights one random "Naked Single"', cost: 10, effect: 'scout_find_naked' },
    { level: 2, name: 'Fog Clear', description: 'Also clears all Fog from its 3x3 box', cost: 25, effect: 'scout_fog_clear' },
    { level: 3, name: 'Hidden Single', description: 'Now highlights a "Hidden Single" (more advanced)', cost: 50, effect: 'scout_find_hidden' },
    { level: 4, name: 'Solve Single', description: 'Automatically solves the "Hidden Single" it finds', cost: 100, effect: 'scout_solve_single' },
    { level: 5, name: 'Total Clarity', description: 'Solves Hidden Single, clears Fog, reveals Hidden Numbers', cost: 200, effect: 'scout_total_clarity' },
  ],
  2: [
    { level: 1, name: 'Investment', description: 'Grants +1 Coin per placement', cost: 10, effect: 'merchant_gold_1' },
    { level: 2, name: 'Compound Interest', description: 'Grants +2 Coins per placement', cost: 25, effect: 'merchant_gold_2' },
    { level: 3, name: 'Price Check', description: 'Grants +2 Coins and reduces shop Inflation by 2%', cost: 50, effect: 'merchant_price_check' },
    { level: 4, name: 'Liquid Assets', description: 'Grants +3 Coins per placement', cost: 100, effect: 'merchant_gold_3' },
    { level: 5, name: 'Market Crash', description: 'Last \'2\' resets Inflation to 0% and grants +20 Coins', cost: 200, effect: 'merchant_market_crash' },
  ],
  3: [
    { level: 1, name: 'Flow State', description: '(Passive) Immune to Candidate Shuffling', cost: 10, effect: 'jester_flow_state' },
    { level: 2, name: 'Lockpick', description: 'Counts as 1 of 3 required placements to break Cell Lock', cost: 25, effect: 'jester_lockpick' },
    { level: 3, name: 'Rule of Three', description: 'Grants +3 Coins if placed 3rd in its box/row/col', cost: 50, effect: 'jester_rule_of_three' },
    { level: 4, name: 'Unstoppable', description: 'Instantly breaks any active Cell Lock', cost: 100, effect: 'jester_unstoppable' },
    { level: 5, name: 'Grand Triplet', description: 'Rule of Three bonus increased from +3 to +6 Coins', cost: 200, effect: 'jester_grand_triplet' },
  ],
  4: [
    { level: 1, name: 'Reinforce', description: '+1 Mistake Buffer (HP)', cost: 10, effect: 'fortress_reinforce' },
    { level: 2, name: 'Shield Charge', description: 'Grants +1 Shield Charge (max 1). Absorbs next mistake', cost: 25, effect: 'fortress_shield_charge' },
    { level: 3, name: 'Fortify', description: '+2 Mistake Buffer (total)', cost: 50, effect: 'fortress_fortify' },
    { level: 4, name: 'Armory', description: 'Max Shield Charges increases to 2', cost: 100, effect: 'fortress_armory' },
    { level: 5, name: 'Bastion', description: 'Start puzzles with 1 Shield Charge. Max increases to 3', cost: 200, effect: 'fortress_bastion' },
  ],
  5: [
    { level: 1, name: 'Ignite', description: 'Triggers a random one of your other Level 1 abilities', cost: 10, effect: 'catalyst_ignite' },
    { level: 2, name: 'Synergy', description: 'Triggers all of your owned Level 1 abilities', cost: 25, effect: 'catalyst_synergy' },
    { level: 3, name: 'Potency', description: 'Abilities trigger at Level 2 (or current level if higher)', cost: 50, effect: 'catalyst_potency' },
    { level: 4, name: 'Catalyze', description: 'Now also triggers all of your owned Level 3 abilities', cost: 100, effect: 'catalyst_catalyze' },
    { level: 5, name: 'Fusion', description: 'Triggers all abilities at their full current level', cost: 200, effect: 'catalyst_fusion' },
  ],
  6: [
    { level: 1, name: '50/50', description: '50% chance to gain +4 Gold per placement', cost: 10, effect: 'gambler_fifty_fifty' },
    { level: 2, name: 'Hedge', description: '50% chance to not trigger Mistake on 2-candidate cells', cost: 25, effect: 'gambler_hedge' },
    { level: 3, name: 'Tip the Odds', description: 'Level 2 chance increases to 75%', cost: 50, effect: 'gambler_tip_odds' },
    { level: 4, name: 'Safe Bet', description: 'Level 2 "Safe Bet" is now 100% guaranteed', cost: 100, effect: 'gambler_safe_bet' },
    { level: 5, name: 'All In', description: 'Safe Bet now works on cells with three candidates', cost: 200, effect: 'gambler_all_in' },
  ],
  7: [
    { level: 1, name: 'Focus', description: 'Grants +1 Shop Reroll per shop visit', cost: 10, effect: 'sniper_reroll_1' },
    { level: 2, name: 'Focus Fire', description: 'Highlights one Hidden Single on the board', cost: 25, effect: 'sniper_focus_fire' },
    { level: 3, name: 'Takedown', description: 'Solves one random Hidden Single on the board', cost: 50, effect: 'sniper_takedown' },
    { level: 4, name: 'Precision', description: 'Grants +2 Shop Rerolls (total)', cost: 100, effect: 'sniper_reroll_2' },
    { level: 5, name: 'Chain Shot', description: 'Solves all Hidden Singles for one random number', cost: 200, effect: 'sniper_chain_shot' },
  ],
  8: [
    { level: 1, name: 'Cleanse', description: 'Cleanses 1 random Corrupted cell in its 3x3 box', cost: 10, effect: 'powerhouse_cleanse_box' },
    { level: 2, name: 'Purge', description: 'Cleanses all Corrupted cells in its 3x3 box', cost: 25, effect: 'powerhouse_purge_box' },
    { level: 3, name: 'Purge+', description: 'Cleanses all Corrupted cells in its row and column', cost: 50, effect: 'powerhouse_purge_rowcol' },
    { level: 4, name: 'Firewall', description: 'Cleansed cells are immune to Corruption for 30 seconds', cost: 100, effect: 'powerhouse_firewall' },
    { level: 5, name: 'System Restore', description: 'Cleanses row, column, and box. Triggers all Number 1 effects', cost: 200, effect: 'powerhouse_system_restore' },
  ],
  9: [
    { level: 1, name: 'Bonus', description: 'Gain +3 Gold for completing any 3x3 box', cost: 10, effect: 'finisher_box_bonus' },
    { level: 2, name: 'Bonus+', description: 'Gain +5 Gold for completing any row or column', cost: 25, effect: 'finisher_line_bonus' },
    { level: 3, name: 'Momentum', description: 'Gain permanent +1% boost to all Gold. Stacks per \'9\'', cost: 50, effect: 'finisher_momentum' },
    { level: 4, name: 'Jackpot', description: 'Placing the last \'9\' grants a +50 Gold bonus', cost: 100, effect: 'finisher_jackpot' },
    { level: 5, name: 'Head Start', description: 'Free Reroll and 10% discount in next shop', cost: 200, effect: 'finisher_head_start' },
  ],
};

interface GrimoireScreenProps {
  visible?: boolean;
  onClose?: () => void;
}

export default function GrimoireScreen({ visible = true, onClose }: GrimoireScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const { gameState, purchaseUpgrade, nextFloor } = useGame();
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  const getCurrentLevel = (num: number): number => {
    const upgrades = gameState.upgrades.filter(u => u.type === 'number' && u.number === num);
    return upgrades.length;
  };

  const handlePurchase = (num: number, level: number) => {
    const upgradeData = NUMBER_UPGRADES_CATALOG[num][level - 1];
    const currentLevel = getCurrentLevel(num);

    if (currentLevel >= level) {
      console.log('[Grimoire] Already owns this level or higher');
      return;
    }

    if (currentLevel !== level - 1) {
      console.log('[Grimoire] Must purchase previous level first');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (gameState.currency < upgradeData.cost) {
      console.log('[Grimoire] Cannot afford upgrade');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    const upgrade = {
      id: `num_${num}_l${level}`,
      name: `${num} — ${upgradeData.name}`,
      description: upgradeData.description,
      type: 'number' as const,
      number: num,
      effect: upgradeData.effect,
      cost: upgradeData.cost,
      rarity: 'common' as const,
    };

    purchaseUpgrade(upgrade);
    setSelectedNumber(null);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleContinue = () => {
    if (onClose) {
      onClose();
    } else {
      nextFloor();
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
      <CRTBackground />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>▓ THE GRIMOIRE ▓</Text>
        <Text style={styles.subtitle}>Strategic Number Upgrades</Text>
        
        <View style={styles.currencyBar}>
          <Zap size={16} color={COLORS.accent.amber} />
          <Text style={styles.currencyText}>{gameState.currency} GOLD</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instructions}>
          Select a number to view its skill tree. All upgrades are always available—provided you have the Gold.
        </Text>

        <View style={styles.numberGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
            const currentLevel = getCurrentLevel(num);
            const nextUpgrade = NUMBER_UPGRADES_CATALOG[num][currentLevel];
            const canAfford = nextUpgrade && gameState.currency >= nextUpgrade.cost;
            const isMaxed = currentLevel >= 5;

            return (
              <TouchableOpacity
                key={num}
                style={[
                  styles.numberCard,
                  {
                    borderColor: isMaxed ? COLORS.accent.magenta : canAfford ? COLORS.primary.cyan : COLORS.text.muted,
                    backgroundColor: isMaxed ? 'rgba(196, 76, 196, 0.15)' : canAfford ? 'rgba(93, 188, 210, 0.1)' : COLORS.background.primary,
                  }
                ]}
                onPress={() => setSelectedNumber(num)}
                activeOpacity={0.7}
              >
                <View style={[styles.numberIconBadge, { 
                  backgroundColor: isMaxed ? COLORS.accent.magenta : canAfford ? COLORS.primary.cyan : COLORS.text.muted 
                }]}>
                  <PixelIcon number={num} size={28} color="#000000" />
                </View>

                <View style={styles.levelIndicator}>
                  {[1, 2, 3, 4, 5].map(l => (
                    <View
                      key={l}
                      style={[
                        styles.levelPip,
                        {
                          backgroundColor: l <= currentLevel 
                            ? (isMaxed ? COLORS.accent.magenta : COLORS.primary.cyan)
                            : COLORS.background.secondary,
                        }
                      ]}
                    />
                  ))}
                </View>

                {nextUpgrade && !isMaxed && (
                  <Text style={styles.nextCost}>{nextUpgrade.cost}g</Text>
                )}
                {isMaxed && (
                  <Text style={[styles.nextCost, { color: COLORS.accent.magenta }]}>MAX</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.7}
        >
          <Text style={styles.continueButtonText}>CONTINUE TO FLOOR {gameState.floor + 1} ▶</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={selectedNumber !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNumber(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedNumber(null)}
          />
          <View style={styles.modalContent}>
            {selectedNumber !== null && (
              <>
                <View style={styles.modalHeaderSection}>
                  <TouchableOpacity 
                    style={styles.modalClose}
                    onPress={() => setSelectedNumber(null)}
                  >
                    <X size={24} color={COLORS.text.primary} />
                  </TouchableOpacity>

                  <View style={styles.modalTopBanner}>
                    <View style={styles.modalNumberDisplay}>
                      <View style={[styles.modalNumberBadge, { 
                        backgroundColor: getCurrentLevel(selectedNumber) >= 5 ? COLORS.accent.magenta : COLORS.primary.cyan 
                      }]}>
                        <PixelIcon number={selectedNumber} size={48} color="#000000" />
                      </View>
                      <View style={styles.numberNameContainer}>
                        <Text style={styles.modalNumberLabel}>NUMBER</Text>
                        <Text style={styles.modalNumberValue}>{selectedNumber}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.progressSection}>
                      <View style={styles.levelProgress}>
                        {[1, 2, 3, 4, 5].map(l => {
                          const currentLevel = getCurrentLevel(selectedNumber);
                          return (
                            <View key={l} style={styles.progressDotContainer}>
                              <View
                                style={[
                                  styles.progressDot,
                                  {
                                    backgroundColor: l <= currentLevel 
                                      ? (currentLevel >= 5 ? COLORS.accent.magenta : COLORS.primary.cyan)
                                      : COLORS.background.secondary,
                                    borderColor: l <= currentLevel 
                                      ? (currentLevel >= 5 ? COLORS.accent.magenta : COLORS.primary.cyan)
                                      : COLORS.text.muted,
                                  }
                                ]}
                              />
                              {l < 5 && <View style={[
                                styles.progressLine,
                                {
                                  backgroundColor: l < currentLevel 
                                    ? (currentLevel >= 5 ? COLORS.accent.magenta : COLORS.primary.cyan)
                                    : COLORS.text.muted,
                                }
                              ]} />}
                            </View>
                          );
                        })}
                      </View>
                      <Text style={styles.levelProgressText}>
                        {getCurrentLevel(selectedNumber) >= 5 ? '★ MAXED ★' : `LEVEL ${getCurrentLevel(selectedNumber)}/5`}
                      </Text>
                    </View>
                  </View>
                </View>

                <ScrollView 
                  style={styles.modalScrollView} 
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {NUMBER_UPGRADES_CATALOG[selectedNumber].map((upgrade, index) => {
                    const currentLevel = getCurrentLevel(selectedNumber);
                    const isOwned = currentLevel >= upgrade.level;
                    const isNext = currentLevel === upgrade.level - 1;
                    const canAfford = gameState.currency >= upgrade.cost;
                    const isLocked = currentLevel < upgrade.level - 1;

                    return (
                      <View
                        key={upgrade.level}
                        style={[
                          styles.upgradeCard,
                          {
                            borderColor: isOwned 
                              ? COLORS.primary.cyan 
                              : isNext && canAfford
                                ? COLORS.accent.amber
                                : COLORS.text.muted,
                            backgroundColor: isOwned 
                              ? 'rgba(93, 188, 210, 0.15)' 
                              : isNext 
                                ? 'rgba(230, 176, 76, 0.08)'
                                : COLORS.background.primary,
                          }
                        ]}
                      >
                        <View style={styles.upgradeCardHeader}>
                          <View style={styles.upgradeCardLeft}>
                            <View style={[
                              styles.levelCircle, 
                              { 
                                backgroundColor: isOwned 
                                  ? COLORS.primary.cyan 
                                  : isNext && canAfford
                                    ? COLORS.accent.amber
                                    : COLORS.background.secondary,
                                borderColor: isOwned 
                                  ? COLORS.primary.cyan 
                                  : isNext
                                    ? COLORS.accent.amber
                                    : COLORS.text.muted,
                              }
                            ]}>
                              <Text style={[
                                styles.levelCircleText,
                                { color: isOwned || (isNext && canAfford) ? '#000000' : COLORS.text.muted }
                              ]}>{upgrade.level}</Text>
                            </View>
                            <View style={styles.upgradeNameSection}>
                              <Text style={[
                                styles.upgradeCardName,
                                { color: isOwned ? COLORS.primary.cyan : COLORS.text.primary }
                              ]}>{upgrade.name}</Text>
                              {isOwned && (
                                <View style={styles.ownedBadge}>
                                  <Text style={styles.ownedBadgeText}>✓ ACTIVE</Text>
                                </View>
                              )}
                              {isLocked && (
                                <View style={[styles.ownedBadge, { backgroundColor: COLORS.background.secondary }]}>
                                  <Text style={[styles.ownedBadgeText, { color: COLORS.text.muted }]}>🔒 LOCKED</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>

                        <Text style={styles.upgradeCardDescription}>{upgrade.description}</Text>

                        <View style={styles.upgradeCardFooter}>
                          <View style={styles.costContainer}>
                            <Zap size={14} color={COLORS.accent.amber} />
                            <Text style={styles.costValue}>{upgrade.cost}</Text>
                            <Text style={styles.costLabel}>GOLD</Text>
                          </View>
                          
                          {isNext && !isOwned && (
                            <TouchableOpacity
                              style={[
                                styles.purchaseButton, 
                                { 
                                  backgroundColor: canAfford ? COLORS.primary.cyan : COLORS.background.secondary,
                                  borderColor: canAfford ? COLORS.primary.cyan : COLORS.text.muted,
                                }
                              ]}
                              onPress={() => handlePurchase(selectedNumber, upgrade.level)}
                              disabled={!canAfford}
                              activeOpacity={0.7}
                            >
                              <Text style={[
                                styles.purchaseButtonText, 
                                { color: canAfford ? '#000000' : COLORS.text.muted }
                              ]}>
                                {canAfford ? '▶ PURCHASE' : '✕ INSUFFICIENT GOLD'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: BORDER.thick,
    borderBottomColor: COLORS.primary.cyan,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent.amber,
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  currencyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: BORDER.medium,
    borderColor: COLORS.primary.cyan,
  },
  currencyText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  instructions: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  numberCard: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: BORDER.thick,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  numberIconBadge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER.medium,
    borderColor: COLORS.background.primary,
  },
  levelIndicator: {
    flexDirection: 'row',
    gap: 3,
  },
  levelPip: {
    width: 6,
    height: 6,
    borderWidth: 1,
    borderColor: COLORS.background.primary,
  },
  nextCost: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: BORDER.thick,
    borderTopColor: COLORS.primary.cyan,
  },
  continueButton: {
    backgroundColor: COLORS.background.primary,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
  },
  continueButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary.cyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: COLORS.background.primary,
    width: '90%',
    maxWidth: 420,
    maxHeight: '90%',
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    position: 'relative',
  },
  modalHeaderSection: {
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: BORDER.thick,
    borderBottomColor: COLORS.primary.cyan,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: COLORS.background.secondary,
    borderWidth: BORDER.medium,
    borderColor: COLORS.text.muted,
  },
  modalTopBanner: {
    padding: 20,
    gap: 16,
  },
  modalNumberDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalNumberBadge: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER.thick,
    borderColor: COLORS.background.primary,
  },
  numberNameContainer: {
    gap: 2,
  },
  modalNumberLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  modalNumberValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressSection: {
    gap: 8,
  },
  levelProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 0,
    borderWidth: BORDER.medium,
  },
  progressLine: {
    width: 24,
    height: 2,
  },
  levelProgressText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    gap: 12,
  },
  upgradeCard: {
    borderWidth: BORDER.thick,
    padding: 16,
    gap: 12,
  },
  upgradeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  upgradeCardLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  levelCircle: {
    width: 40,
    height: 40,
    borderWidth: BORDER.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCircleText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  upgradeNameSection: {
    flex: 1,
    gap: 6,
  },
  upgradeCardName: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 20,
  },
  ownedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(93, 188, 210, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: BORDER.thin,
    borderColor: COLORS.primary.cyan,
  },
  ownedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary.cyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  upgradeCardDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  upgradeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: BORDER.medium,
    borderColor: COLORS.text.muted,
  },
  costValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  costLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  purchaseButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: BORDER.thick,
  },
  purchaseButtonText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1.5,
  },
});
