import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Sparkles, Package } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useGame } from '@/contexts/GameContext';
import { Upgrade } from '@/types/game';
import { COLORS, BORDER } from '@/constants/theme';
import CRTBackground from './CRTBackground';
import PixelIcon from './PixelIcon';



interface InventoryScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function InventoryScreen({ visible, onClose }: InventoryScreenProps) {
  const insets = useSafeAreaInsets();
  const { gameState, useConsumable } = useGame();
  const [selectedUpgrade, setSelectedUpgrade] = useState<Upgrade | null>(null);

  const passiveUpgrades = gameState.upgrades.filter(u => u.type === 'passive');
  const consumables = gameState.upgrades.filter(u => u.type === 'consumable');

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'rogue':
        return '#C44CC4';
      case 'epic':
        return '#9D5CE8';
      case 'rare':
        return COLORS.accent.amber;
      case 'uncommon':
        return COLORS.primary.cyan;
      default:
        return COLORS.text.secondary;
    }
  };

  const getRarityBg = (rarity: string): string => {
    switch (rarity) {
      case 'rogue':
        return 'rgba(196, 76, 196, 0.15)';
      case 'epic':
        return 'rgba(157, 92, 232, 0.12)';
      case 'rare':
        return 'rgba(230, 176, 76, 0.1)';
      case 'uncommon':
        return 'rgba(93, 188, 210, 0.1)';
      default:
        return 'rgba(93, 188, 210, 0.05)';
    }
  };

  const renderUpgradeCard = (upgrade: Upgrade, index: number) => {
    const rarityColor = getRarityColor(upgrade.rarity);
    const rarityBg = getRarityBg(upgrade.rarity);

    return (
      <TouchableOpacity
        key={`${upgrade.id}-${index}`}
        style={[styles.card, { borderColor: rarityColor, backgroundColor: rarityBg }]}
        onPress={() => setSelectedUpgrade(upgrade)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
            <Text style={styles.rarityText}>{upgrade.rarity.toUpperCase()}</Text>
          </View>
          {upgrade.type === 'number' && upgrade.number && (
            <View style={[styles.iconBadge, { backgroundColor: rarityColor }]}>
              <PixelIcon number={upgrade.number} size={20} color="#000000" />
            </View>
          )}
        </View>
        
        <Text style={styles.cardTitle} numberOfLines={2}>
          {upgrade.name}
        </Text>
        
        <View style={styles.cardType}>
          <Text style={styles.cardTypeText}>
            {upgrade.type === 'number' ? `NUM ${upgrade.number}` : upgrade.type.toUpperCase()}
          </Text>
        </View>
        
        {upgrade.type === 'consumable' && upgrade.charges !== undefined && (
          <View style={styles.chargesInfo}>
            <Text style={styles.chargesText}>{upgrade.charges} x</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <CRTBackground showVignette={false} vignetteIntensity={0} />

        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerContent}>
            <Package size={20} color={COLORS.accent.amber} />
            <Text style={styles.title}>▓ INVENTORY ▓</Text>
          </View>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={20} color={COLORS.accent.red} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          {passiveUpgrades.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sparkles size={16} color={COLORS.accent.amber} />
                <Text style={styles.sectionTitle}>RELICS & PASSIVES ({passiveUpgrades.length})</Text>
              </View>
              <View style={styles.cardGrid}>
                {passiveUpgrades.map((upgrade, index) => renderUpgradeCard(upgrade, index))}
              </View>
            </View>
          )}

          {consumables.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Package size={16} color={COLORS.accent.magenta} />
                <Text style={styles.sectionTitle}>CONSUMABLES ({consumables.length})</Text>
              </View>
              <View style={styles.cardGrid}>
                {consumables.map((upgrade, index) => renderUpgradeCard(upgrade, index))}
              </View>
            </View>
          )}

          {passiveUpgrades.length === 0 && consumables.length === 0 && (
            <View style={styles.emptyState}>
              <Package size={48} color={COLORS.text.muted} />
              <Text style={styles.emptyText}>▓ INVENTORY EMPTY ▓</Text>
              <Text style={styles.emptySubtext}>Purchase items from the shop</Text>
            </View>
          )}
        </ScrollView>

        <Modal
          visible={selectedUpgrade !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedUpgrade(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedUpgrade(null)}
          >
            <View style={styles.modalContent}>
              {selectedUpgrade && (
                <>
                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setSelectedUpgrade(null)}
                  >
                    <Text style={styles.modalCloseText}>[ X ]</Text>
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.modalRarityBadge,
                      { backgroundColor: getRarityColor(selectedUpgrade.rarity) },
                    ]}
                  >
                    <Text style={styles.modalRarityText}>
                      {selectedUpgrade.rarity.toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.modalTitle}>{selectedUpgrade.name}</Text>
                  <Text style={styles.modalType}>
                    {selectedUpgrade.type === 'number'
                      ? `NUMBER ${selectedUpgrade.number} UPGRADE`
                      : selectedUpgrade.type.toUpperCase()}
                  </Text>
                  <View style={styles.modalDivider} />
                  <Text style={styles.modalDescription}>{selectedUpgrade.description}</Text>

                  <View style={styles.modalEffect}>
                    <Text style={styles.modalEffectLabel}>EFFECT:</Text>
                    <Text style={styles.modalEffectText}>{selectedUpgrade.effect}</Text>
                  </View>

                  {selectedUpgrade.type === 'consumable' && selectedUpgrade.charges && selectedUpgrade.charges > 0 && (
                    <>
                      <View style={styles.modalCharges}>
                        <Text style={styles.modalChargesText}>
                          CHARGES: {selectedUpgrade.charges} / {selectedUpgrade.maxCharges || selectedUpgrade.charges}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.useButton}
                        onPress={() => {
                          useConsumable(selectedUpgrade.id);
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          }
                          setSelectedUpgrade(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.useButtonText}>[ USE CONSUMABLE ]</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {selectedUpgrade.type === 'consumable' && (!selectedUpgrade.charges || selectedUpgrade.charges === 0) && (
                    <View style={styles.depleted}>
                      <Text style={styles.depletedText}>▓ DEPLETED ▓</Text>
                    </View>
                  )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: BORDER.thick,
    borderBottomColor: COLORS.primary.cyan,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent.amber,
    letterSpacing: 3,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.accent.red,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.medium,
    borderColor: COLORS.primary.cyan,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    letterSpacing: 1,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  cardGrid: {
    gap: 12,
  },
  card: {
    borderWidth: BORDER.thick,
    padding: 16,
    minHeight: 120,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: BORDER.medium,
    borderColor: COLORS.background.primary,
  },
  iconBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER.medium,
    borderColor: COLORS.background.primary,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  cardType: {
    marginTop: 4,
  },
  cardTypeText: {
    fontSize: 10,
    color: COLORS.text.secondary,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
    letterSpacing: 1,
  },
  chargesInfo: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.accent.amber,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: BORDER.medium,
    borderColor: COLORS.background.primary,
  },
  chargesText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.secondary,
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
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
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 8,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.accent.red,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  modalRarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: BORDER.medium,
    borderColor: COLORS.background.primary,
    marginBottom: 12,
  },
  modalRarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  modalType: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
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
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  modalEffect: {
    backgroundColor: COLORS.background.primary,
    padding: 12,
    borderWidth: BORDER.medium,
    borderColor: COLORS.primary.cyan,
    gap: 6,
  },
  modalEffectLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
    letterSpacing: 1,
  },
  modalEffectText: {
    fontSize: 12,
    color: COLORS.primary.cyan,
    fontWeight: 'bold',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  modalCharges: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.medium,
    borderColor: COLORS.accent.amber,
    alignItems: 'center',
  },
  modalChargesText: {
    fontSize: 11,
    color: COLORS.accent.amber,
    fontWeight: 'bold',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
    letterSpacing: 1,
  },
  useButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary.cyan,
    borderWidth: BORDER.thick,
    borderColor: COLORS.text.primary,
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: 'bold',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
    letterSpacing: 1.5,
  },
  depleted: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.text.muted,
    alignItems: 'center',
  },
  depletedText: {
    fontSize: 13,
    color: COLORS.text.muted,
    fontWeight: 'bold',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
    letterSpacing: 2,
  },
});
