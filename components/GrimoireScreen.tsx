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
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedNumber(null)}
        >
          <View style={styles.modalContent}>
            {selectedNumber !== null && (
              <>
                <TouchableOpacity 
                  style={styles.modalClose}
                  onPress={() => setSelectedNumber(null)}
                >
                  <X size={20} color={COLORS.accent.red} />
                </TouchableOpacity>

                <View style={styles.modalHeader}>
                  <View style={[styles.modalNumberBadge, { backgroundColor: COLORS.primary.cyan }]}>
                    <PixelIcon number={selectedNumber} size={32} color="#000000" />
                  </View>
                  <Text style={styles.modalTitle}>NUMBER {selectedNumber}</Text>
                </View>

                <View style={styles.modalDivider} />

                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
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
                          styles.upgradeRow,
                          {
                            borderColor: isOwned ? COLORS.primary.cyan : isNext ? COLORS.accent.amber : COLORS.text.muted,
                            backgroundColor: isOwned ? 'rgba(93, 188, 210, 0.12)' : COLORS.background.primary,
                          }
                        ]}
                      >
                        <View style={styles.upgradeHeader}>
                          <View style={[styles.levelBadge, { 
                            backgroundColor: isOwned ? COLORS.primary.cyan : isNext ? COLORS.accent.amber : COLORS.text.muted 
                          }]}>
                            <Text style={styles.levelBadgeText}>L{upgrade.level}</Text>
                          </View>
                          <Text style={styles.upgradeName}>{upgrade.name}</Text>
                        </View>

                        <Text style={styles.upgradeDescription}>{upgrade.description}</Text>

                        <View style={styles.upgradeFooter}>
                          <Text style={styles.upgradeCost}>{upgrade.cost} GOLD</Text>
                          {isOwned && (
                            <Text style={[styles.upgradeStatus, { color: COLORS.primary.cyan }]}>OWNED</Text>
                          )}
                          {isNext && !isOwned && (
                            <TouchableOpacity
                              style={[styles.buyButton, { 
                                backgroundColor: canAfford ? COLORS.primary.cyan : COLORS.background.secondary,
                                borderColor: canAfford ? COLORS.primary.cyan : COLORS.text.muted,
                              }]}
                              onPress={() => handlePurchase(selectedNumber, upgrade.level)}
                              disabled={!canAfford}
                            >
                              <Text style={[styles.buyButtonText, { 
                                color: canAfford ? '#000000' : COLORS.text.muted 
                              }]}>
                                {canAfford ? 'BUY' : 'LOCKED'}
                              </Text>
                            </TouchableOpacity>
                          )}
                          {isLocked && (
                            <Text style={[styles.upgradeStatus, { color: COLORS.text.muted }]}>LOCKED</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.background.primary,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalNumberBadge: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER.medium,
    borderColor: COLORS.background.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalDivider: {
    height: 2,
    backgroundColor: COLORS.primary.cyan,
    marginBottom: 16,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  upgradeRow: {
    borderWidth: BORDER.medium,
    padding: 12,
    marginBottom: 12,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: BORDER.thin,
    borderColor: COLORS.background.primary,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  upgradeName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  upgradeDescription: {
    fontSize: 11,
    color: COLORS.text.secondary,
    lineHeight: 16,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  upgradeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeCost: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  upgradeStatus: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  buyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: BORDER.medium,
  },
  buyButtonText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
});
