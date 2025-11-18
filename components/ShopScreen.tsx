import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGame } from '@/contexts/GameContext';
import { ShopOffer, ShopSession } from '@/types/shop';
import { Sparkles, AlertTriangle, Info, Zap, Heart } from 'lucide-react-native';
import { calculateShopInflation, getTotalCorruption } from '@/utils/corruption';
import { 
  createShopSession, 
  rerollShop, 
  purchaseOffer, 
  calculateRerollCost,
  calculateEDRerollCost,
  emitShopAnalytics
} from '@/utils/shop';
import { Upgrade } from '@/types/game';
import CRTBackground from './CRTBackground';
import PixelIcon from './PixelIcon';
import { COLORS, BORDER } from '@/constants/theme';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, nextFloor, purchaseUpgrade } = useGame();
  const [shopSession, setShopSession] = useState<ShopSession | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<ShopOffer | null>(null);
  const [rerolling, setRerolling] = useState(false);
  const glitchAnim = useRef(new Animated.Value(0)).current;

  const totalCorruption = getTotalCorruption(gameState.grid) + gameState.corruption;
  const corruptionPercent = Math.min(100, (totalCorruption / 81) * 100);
  const inflationMultiplier = calculateShopInflation(totalCorruption, 100) / 100;

  useEffect(() => {
    const ownedIds = gameState.upgrades.map(u => u.id);
    const session = createShopSession(
      gameState.floor,
      gameState.runSeed,
      ownedIds,
      gameState.raresSeenCount,
      gameState.shopsOpened
    );
    setShopSession(session);

    emitShopAnalytics('shop_open', {
      floor: gameState.floor,
      shopSeed: session.shopSeed,
      totalCorruptionPercent: corruptionPercent,
      availableOF: gameState.currency,
      availableED: gameState.entropyDust,
    });
  }, []);

  useEffect(() => {
    if (corruptionPercent > 40) {
      Animated.loop(
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
      ).start();
    }
  }, [corruptionPercent, glitchAnim]);

  const getInflatedCost = (baseCost: number): number => {
    const finalCost = Math.ceil(baseCost * (1 + inflationMultiplier));
    return finalCost;
  };

  const handleReroll = (method: 'OF' | 'ED' | 'premium') => {
    if (!shopSession || rerolling) return;

    let costOF = 0;
    let costED = 0;
    let canAfford = false;

    if (method === 'OF') {
      costOF = calculateRerollCost(shopSession.rerollCount, true);
      const inflatedCost = getInflatedCost(costOF);
      canAfford = gameState.currency >= inflatedCost;
      costOF = inflatedCost;
    } else if (method === 'ED') {
      costED = calculateEDRerollCost(false);
      canAfford = gameState.entropyDust >= costED;
    } else if (method === 'premium') {
      costED = calculateEDRerollCost(true);
      canAfford = gameState.entropyDust >= costED;
    }

    if (!canAfford) {
      console.log('[Shop] Cannot afford reroll');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setRerolling(true);
    
    setTimeout(() => {
      const ownedIds = gameState.upgrades.map(u => u.id);
      const newSession = rerollShop(
        shopSession,
        gameState.runSeed,
        ownedIds,
        gameState.shopsOpened
      );

      setShopSession(newSession);

      emitShopAnalytics('shop_reroll', {
        floor: gameState.floor,
        rerollCountThisShop: newSession.rerollCount,
        method,
        costPaidOF: costOF,
        costPaidED: costED,
        newOffers: newSession.currentOffers.map(o => o.id),
      });
      
      setRerolling(false);
    }, 300);
  };

  const handlePurchase = (offer: ShopOffer) => {
    if (!shopSession) return;

    const inflatedCostOF = getInflatedCost(offer.baseCostOF);
    const totalOF = inflatedCostOF;
    const totalED = offer.baseCostED;

    if (gameState.currency < totalOF || gameState.entropyDust < totalED) {
      console.log('[Shop] Cannot afford offer');
      return;
    }

    if (shopSession.purchasedOffers.includes(offer.id)) {
      console.log('[Shop] Already purchased');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    let upgrade: Upgrade;
    
    if (offer.type === 'NumberUpgrade') {
      upgrade = {
        id: offer.id,
        name: offer.descriptionShort,
        description: offer.descriptionFull,
        type: 'number',
        number: (offer as any).digit,
        effect: offer.effect,
        cost: totalOF,
        rarity: 'common',
      };
    } else if (offer.type === 'Consumable') {
      upgrade = {
        id: offer.id,
        name: offer.descriptionShort,
        description: offer.descriptionFull,
        type: 'consumable',
        effect: offer.effect,
        cost: totalOF,
        rarity: offer.rarity?.toLowerCase() as 'common' | 'uncommon' | 'rare' | 'epic' | 'rogue' || 'common',
        charges: 1,
        maxCharges: 1,
      };
    } else {
      upgrade = {
        id: offer.id,
        name: offer.descriptionShort,
        description: offer.descriptionFull,
        type: 'passive',
        effect: offer.effect,
        cost: totalOF,
        rarity: offer.rarity?.toLowerCase() as 'common' | 'uncommon' | 'rare' | 'epic' | 'rogue' || 'common',
      };
    }

    purchaseUpgrade(upgrade);

    const newSession = purchaseOffer(shopSession, offer.id);
    setShopSession(newSession);

    emitShopAnalytics('shop_purchase', {
      floor: gameState.floor,
      offerId: offer.id,
      costPaidOF: totalOF,
      costPaidED: totalED,
      shopInflationPercent: inflationMultiplier * 100,
    });

    setSelectedOffer(null);
  };

  const handleSkip = () => {
    emitShopAnalytics('shop_skip', { floor: gameState.floor });
    nextFloor();
  };

  const getRarityColor = (rarity?: string): string => {
    if (!rarity) return COLORS.text.secondary;
    switch (rarity) {
      case 'Rogue':
        return '#C44CC4';
      case 'Epic':
        return '#9D5CE8';
      case 'Rare':
        return COLORS.accent.amber;
      case 'Uncommon':
        return COLORS.primary.cyan;
      default:
        return COLORS.text.secondary;
    }
  };

  const getRarityBg = (rarity?: string): string => {
    if (!rarity) return 'rgba(93, 188, 210, 0.05)';
    switch (rarity) {
      case 'Rogue':
        return 'rgba(196, 76, 196, 0.15)';
      case 'Epic':
        return 'rgba(157, 92, 232, 0.12)';
      case 'Rare':
        return 'rgba(230, 176, 76, 0.1)';
      case 'Uncommon':
        return 'rgba(93, 188, 210, 0.1)';
      default:
        return 'rgba(93, 188, 210, 0.05)';
    }
  };

  const getOfferTypeLabel = (offer: ShopOffer): string => {
    if (offer.type === 'NumberUpgrade') {
      return `NUM ${offer.digit}`;
    }
    if (offer.type === 'RelicPermanent') {
      return 'ARTIFACT • PERMANENT';
    }
    if (offer.type === 'RelicRun') {
      return 'ARTIFACT';
    }
    if (offer.type === 'Consumable') {
      return 'CONSUMABLE';
    }
    if (offer.type === 'RuleMutator') {
      return 'ARTIFACT';
    }
    return offer.type;
  };

  const rerollCostOF = shopSession ? getInflatedCost(calculateRerollCost(shopSession.rerollCount, true)) : 0;
  const canRerollOF = gameState.currency >= rerollCostOF;

  const glitchTranslateX = glitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  return (
    <View style={styles.container}>
      <CRTBackground 
        showVignette={corruptionPercent > 50}
        vignetteIntensity={corruptionPercent > 50 ? 0.3 : 0}
      />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>▓ THE CORRUPTED EXCHANGE ▓</Text>
        
        <View style={styles.statBar}>
          <View style={styles.statItem}>
            <Heart size={16} color={COLORS.accent.red} />
            <Text style={styles.statText}>{gameState.mistakes}/{gameState.maxMistakes}</Text>
          </View>
          <View style={styles.statItem}>
            <Sparkles size={16} color={COLORS.accent.amber} />
            <Text style={styles.statText}>{gameState.currency}</Text>
          </View>
          <View style={styles.statItem}>
            <Zap size={16} color={COLORS.accent.magenta} />
            <Text style={styles.statText}>{gameState.entropyDust}</Text>
          </View>
          <View style={styles.statItem}>
            <AlertTriangle size={16} color={COLORS.accent.red} />
            <Text style={styles.statText}>{corruptionPercent.toFixed(0)}%</Text>
          </View>
        </View>
        
        {corruptionPercent > 30 && (
          <Animated.View style={[styles.corruptionWarning, { transform: [{ translateX: glitchTranslateX }] }]}>
            <Text style={styles.warningText}>
              ⚠ HIGH CORRUPTION • PRICES +{(inflationMultiplier * 100).toFixed(0)}%
            </Text>
          </Animated.View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 180 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardGrid}>
          {rerolling ? (
            <View style={styles.rerollingContainer}>
              <Text style={styles.rerollingText}>▓▓ REROLLING ▓▓</Text>
            </View>
          ) : (
            shopSession?.currentOffers.map((offer, index) => {
              const isPurchased = shopSession.purchasedOffers.includes(offer.id);
              const inflatedCostOF = getInflatedCost(offer.baseCostOF);
              const canAfford = gameState.currency >= inflatedCostOF && gameState.entropyDust >= offer.baseCostED;
              const rarityColor = getRarityColor(offer.rarity);
              const rarityBg = getRarityBg(offer.rarity);
              const hasInflation = inflatedCostOF > offer.baseCostOF;
              const isCorrupted = corruptionPercent > 60 && index % 2 === 0;

              return (
                <TouchableOpacity
                  key={`${offer.id}-${index}`}
                  style={[
                    styles.card,
                    {
                      borderColor: offer.type === 'NumberUpgrade' ? COLORS.primary.cyan : rarityColor,
                      backgroundColor: offer.type === 'NumberUpgrade' ? 'rgba(93, 188, 210, 0.08)' : rarityBg,
                      opacity: isPurchased ? 0.4 : 1,
                    },
                  ]}
                  onPress={() => setSelectedOffer(offer)}
                  activeOpacity={0.7}
                  disabled={isPurchased}
                >
                  {isCorrupted && <View style={styles.corruptedOverlay} />}

                  <View style={styles.cardHeader}>
                    {offer.type === 'NumberUpgrade' ? (
                      <View style={[styles.levelBadge, { backgroundColor: COLORS.primary.cyan }]}>
                        <Text style={styles.levelText}>LVL {offer.tier}</Text>
                      </View>
                    ) : offer.rarity ? (
                      <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                        <Text style={styles.rarityText}>{offer.rarity.toUpperCase()}</Text>
                      </View>
                    ) : null}
                    {offer.type === 'NumberUpgrade' && offer.digit && (
                      <View style={[styles.iconBadge, { backgroundColor: COLORS.primary.cyan }]}>
                        <PixelIcon number={offer.digit} size={20} color="#000000" />
                      </View>
                    )}
                    {(offer.type === 'Consumable' || offer.type === 'RelicRun' || offer.type === 'RelicPermanent' || offer.type === 'RuleMutator') && (
                      <View style={[styles.iconBadge, { backgroundColor: rarityColor }]}>
                        <PixelIcon number={0} size={20} color="#000000" iconType={offer.type === 'Consumable' ? 'potion' : 'artifact'} />
                      </View>
                    )}
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{offer.descriptionShort}</Text>
                    <Text style={styles.cardType}>{getOfferTypeLabel(offer)}</Text>
                  </View>

                  <View style={styles.cardFooter}>
                    {offer.baseCostOF > 0 && (
                      <View style={styles.costDisplay}>
                        {hasInflation && (
                          <Text style={styles.costOriginal}>{offer.baseCostOF}</Text>
                        )}
                        <Text style={styles.costFinal}>{inflatedCostOF} OF</Text>
                      </View>
                    )}
                    {offer.baseCostED > 0 && (
                      <View style={styles.costDisplay}>
                        <Text style={styles.costFinal}>{offer.baseCostED} ED</Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.cardButton, { 
                    backgroundColor: isPurchased ? COLORS.background.secondary : canAfford ? COLORS.primary.cyan : COLORS.background.secondary,
                    borderColor: isPurchased ? COLORS.text.muted : canAfford ? COLORS.primary.cyan : COLORS.text.muted,
                  }]}>
                    <Text style={[styles.cardButtonText, {
                      color: canAfford && !isPurchased ? '#000000' : COLORS.text.muted,
                    }]}>
                      {isPurchased ? '▓▓▓ SOLD ▓▓▓' : canAfford ? '[ BUY ]' : '[ LOCKED ]'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, !canRerollOF && styles.actionButtonDisabled]}
            onPress={() => handleReroll('OF')}
            disabled={!canRerollOF || rerolling}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, !canRerollOF && styles.actionButtonTextDisabled]}>
              REROLL [{rerollCostOF}]
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.exitButtonText}>EXIT ▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={selectedOffer !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOffer(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedOffer(null)}
        >
          <View style={styles.modalContent}>
            {selectedOffer && (
              <>
                <TouchableOpacity 
                  style={styles.modalClose}
                  onPress={() => setSelectedOffer(null)}
                >
                  <Text style={styles.modalCloseText}>[ X ]</Text>
                </TouchableOpacity>

                {selectedOffer.type === 'NumberUpgrade' ? (
                  <View style={[styles.modalLevelBadge, { backgroundColor: COLORS.primary.cyan }]}>
                    <Text style={styles.modalLevelText}>LEVEL {selectedOffer.tier}</Text>
                  </View>
                ) : selectedOffer.rarity ? (
                  <View style={[styles.modalRarityBadge, { backgroundColor: getRarityColor(selectedOffer.rarity) }]}>
                    <Text style={styles.modalRarityText}>{selectedOffer.rarity.toUpperCase()}</Text>
                  </View>
                ) : null}

                <Text style={styles.modalTitle}>{selectedOffer.descriptionShort}</Text>
                <Text style={styles.modalType}>{getOfferTypeLabel(selectedOffer)}</Text>
                <View style={styles.modalDivider} />
                <Text style={styles.modalDescription}>{selectedOffer.descriptionFull}</Text>

                {selectedOffer.dependency && (
                  <View style={styles.modalDependency}>
                    <Info size={16} color={COLORS.accent.amber} />
                    <Text style={styles.modalDependencyText}>
                      REQUIRES: {selectedOffer.dependency}
                    </Text>
                  </View>
                )}

                {selectedOffer.entropyDrainPerFloor > 0 && (
                  <View style={styles.modalWarning}>
                    <AlertTriangle size={16} color={COLORS.accent.red} />
                    <Text style={styles.modalWarningText}>
                      DRAINS {selectedOffer.entropyDrainPerFloor} ED PER FLOOR
                    </Text>
                  </View>
                )}

                <View style={styles.modalCosts}>
                  {selectedOffer.baseCostOF > 0 && (
                    <View style={styles.modalCostRow}>
                      <Text style={styles.modalCostLabel}>ORDER FRAGMENTS:</Text>
                      <View style={styles.modalCostValues}>
                        {getInflatedCost(selectedOffer.baseCostOF) > selectedOffer.baseCostOF && (
                          <Text style={styles.modalOriginalCost}>{selectedOffer.baseCostOF}</Text>
                        )}
                        <Text style={styles.modalCostValue}>{getInflatedCost(selectedOffer.baseCostOF)}</Text>
                      </View>
                    </View>
                  )}
                  {selectedOffer.baseCostED > 0 && (
                    <View style={styles.modalCostRow}>
                      <Text style={styles.modalCostLabel}>ENTROPY DUST:</Text>
                      <Text style={styles.modalCostValue}>{selectedOffer.baseCostED}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.modalBuyButton, { 
                    borderColor: getRarityColor(selectedOffer.rarity),
                    backgroundColor: COLORS.primary.cyan,
                  }]}
                  onPress={() => handlePurchase(selectedOffer)}
                >
                  <Text style={[styles.modalBuyText, { color: '#000000' }]}>[ PURCHASE ]</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: BORDER.thick,
    borderBottomColor: COLORS.primary.cyan,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: COLORS.accent.amber,
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  statBar: {
    flexDirection: 'row' as const,
    gap: 16,
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  corruptionWarning: {
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: BORDER.thick,
    borderColor: COLORS.accent.red,
    marginTop: 8,
  },
  warningText: {
    fontSize: 10,
    color: COLORS.accent.red,
    fontWeight: 'bold' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cardGrid: {
    gap: 16,
  },
  rerollingContainer: {
    height: 400,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  rerollingText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.primary.cyan,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 4,
  },
  card: {
    borderRadius: 0,
    borderWidth: BORDER.thick,
    padding: 16,
    position: 'relative' as const,
    minHeight: 180,
  },
  corruptedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(196, 76, 196, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  rarityBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: BORDER.medium,
    borderColor: COLORS.background.primary,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: 'bold' as const,
    color: '#000000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 1,
  },
  levelBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: BORDER.medium,
    borderColor: COLORS.background.primary,
  },
  levelText: {
    fontSize: 9,
    fontWeight: 'bold' as const,
    color: '#000000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 1,
  },
  iconBadge: {
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: BORDER.medium,
    borderColor: COLORS.background.primary,
  },
  cardBody: {
    marginBottom: 12,
    minHeight: 60,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  cardType: {
    fontSize: 10,
    color: COLORS.text.secondary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 1,
  },
  cardFooter: {
    marginBottom: 8,
    minHeight: 20,
  },
  costDisplay: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 4,
  },
  costOriginal: {
    fontSize: 11,
    fontWeight: 'bold' as const,
    color: COLORS.text.muted,
    textDecorationLine: 'line-through' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  costFinal: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  cardButton: {
    paddingVertical: 10,
    alignItems: 'center' as const,
    borderWidth: BORDER.medium,
  },
  cardButtonText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: BORDER.thick,
    borderTopColor: COLORS.primary.cyan,
  },
  buttonRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingVertical: 14,
    alignItems: 'center' as const,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.background.primary,
    borderColor: COLORS.text.muted,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: 'bold' as const,
    color: COLORS.primary.cyan,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 2,
  },
  actionButtonTextDisabled: {
    color: COLORS.text.muted,
  },
  exitButton: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingVertical: 14,
    alignItems: 'center' as const,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
  },
  exitButtonText: {
    fontSize: 13,
    fontWeight: 'bold' as const,
    color: COLORS.primary.cyan,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.background.primary,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    position: 'relative' as const,
  },
  modalClose: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 8,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: COLORS.accent.red,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  modalRarityBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: BORDER.medium,
    borderColor: COLORS.background.primary,
    marginBottom: 12,
  },
  modalRarityText: {
    fontSize: 10,
    fontWeight: 'bold' as const,
    color: '#000000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 1,
  },
  modalLevelBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: BORDER.medium,
    borderColor: COLORS.background.primary,
    marginBottom: 12,
  },
  modalLevelText: {
    fontSize: 10,
    fontWeight: 'bold' as const,
    color: '#000000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    marginBottom: 8,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  modalType: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  modalDivider: {
    height: 2,
    backgroundColor: COLORS.primary.cyan,
    marginVertical: 12,
  },
  modalDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  modalDependency: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: COLORS.background.primary,
    padding: 10,
    borderWidth: BORDER.medium,
    borderColor: COLORS.accent.amber,
    marginBottom: 12,
  },
  modalDependencyText: {
    fontSize: 11,
    color: COLORS.accent.amber,
    flex: 1,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  modalWarning: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: COLORS.background.primary,
    padding: 10,
    borderWidth: BORDER.medium,
    borderColor: COLORS.accent.red,
    marginBottom: 12,
  },
  modalWarningText: {
    fontSize: 11,
    color: COLORS.accent.red,
    flex: 1,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  modalCosts: {
    gap: 8,
    marginBottom: 20,
  },
  modalCostRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  modalCostLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  modalCostValues: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  modalOriginalCost: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: COLORS.text.muted,
    textDecorationLine: 'line-through' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  modalCostValue: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
  },
  modalBuyButton: {
    paddingVertical: 14,
    alignItems: 'center' as const,
    borderWidth: BORDER.thick,
  },
  modalBuyText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) as const,
    letterSpacing: 2,
  },
});
