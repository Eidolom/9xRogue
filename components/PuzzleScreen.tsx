import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/contexts/GameContext';
import { Trash2, Sparkles, ShoppingBag, Eye, DollarSign, Laugh, Shield, Zap, Dices, Target, PowerIcon, Trophy, RotateCcw, Check, Edit3 } from 'lucide-react-native';
import CRTBackground from './CRTBackground';
import InventoryScreen from './InventoryScreen';
import { COLORS, BORDER } from '@/constants/theme';
import { getFloorName } from '@/constants/floorNames';

const { width } = Dimensions.get('window');
const GRID_PADDING = 32;
const GRID_SIZE = Math.min(width - GRID_PADDING, 380);
const CELL_SIZE = Math.floor(GRID_SIZE / 9);

const NUMBER_ICONS = [
  null,
  Eye,
  DollarSign,
  Laugh,
  Shield,
  Zap,
  Dices,
  Target,
  PowerIcon,
  Trophy,
] as const;

const NUMBER_NAMES = [
  '',
  'Scout',
  'Merchant',
  'Jester',
  'Fortress',
  'Catalyst',
  'Gambler',
  'Sniper',
  'Powerhouse',
  'Finisher',
] as const;

export default function PuzzleScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, selectCell, placeNumber, clearCell, toggleCandidate, completeFloor, clearPuzzle, solvePuzzle } = useGame();
  const corruptionAnim = useRef(new Animated.Value(0)).current;
  const [showInventory, setShowInventory] = useState(false);
  const [pencilMode, setPencilMode] = useState(false);

  const numberUpgradeLevels = useMemo(() => {
    const levels: Record<number, { level: number; color: string; rarity: string }> = {};
    for (let num = 1; num <= 9; num++) {
      const numUpgrades = gameState.upgrades.filter(
        u => u.type === 'number' && u.number === num
      );
      if (numUpgrades.length > 0) {
        const highestRarity = numUpgrades.reduce((max, u) => {
          const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, rogue: 5 };
          const current = rarityOrder[u.rarity] || 0;
          return current > rarityOrder[max.rarity] ? u : max;
        });
        const rarityColors = {
          common: COLORS.text.secondary,
          uncommon: COLORS.primary.cyan,
          rare: COLORS.accent.amber,
          epic: '#9D5CE8',
          rogue: COLORS.accent.magenta,
        };
        levels[num] = {
          level: numUpgrades.length,
          color: rarityColors[highestRarity.rarity] || COLORS.text.primary,
          rarity: highestRarity.rarity,
        };
      }
    }
    return levels;
  }, [gameState.upgrades]);

  useEffect(() => {
    if (gameState.isComplete) {
      setTimeout(() => completeFloor(), 1000);
    }
  }, [gameState.isComplete, completeFloor]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(corruptionAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(corruptionAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [gameState.corruption]);

  const renderCell = (row: number, col: number) => {
    const cell = gameState.grid[row][col];
    const isSelected = gameState.selectedCell?.row === row && gameState.selectedCell?.col === col;
    const corruption = cell.corruption / 3;
    
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);
    const boxIndex = boxRow * 3 + boxCol;
    const isBoxLocked = gameState.lockedBoxes.includes(boxIndex);

    let backgroundColor = cell.isFixed ? 'rgba(192, 203, 220, 0.1)' : '#0d0e15';
    if (!cell.isFixed && corruption > 0) {
      backgroundColor = `rgba(255, 0, 68, ${Math.min(corruption, 0.6)})`;
    }
    if (cell.isFogged && !cell.isFixed) {
      backgroundColor = 'rgba(192, 203, 220, 0.15)';
    }
    if (cell.isLocked) {
      backgroundColor = 'rgba(255, 204, 51, 0.2)';
    }
    if (isBoxLocked && !cell.isFixed) {
      backgroundColor = 'rgba(255, 0, 68, 0.4)';
    }

    const isThickBorderRight = col % 3 === 2 && col !== 8;
    const isThickBorderBottom = row % 3 === 2 && row !== 8;
    
    const cellKey = `${row}-${col}`;
    
    return (
      <TouchableOpacity
        key={cellKey}
        style={[
          styles.cell,
          isSelected && styles.selectedCell,
          !cell.isCorrect && styles.incorrectCell,
          {
            borderRightWidth: isThickBorderRight ? BORDER.thick : BORDER.thin,
            borderBottomWidth: isThickBorderBottom ? BORDER.thick : BORDER.thin,
            backgroundColor,
            opacity: cell.isHidden ? 0.3 : 1,
          },
        ]}
        onPress={() => selectCell(row, col)}
        activeOpacity={0.7}
        disabled={cell.isLocked || isBoxLocked}
      >
        {cell.value !== null && !cell.isHidden ? (
          <Text
            style={[
              styles.cellText,
              cell.isFixed && styles.fixedText,
              !cell.isCorrect && styles.incorrectText,
              cell.isLocked && styles.lockedText,
            ]}
          >
            {cell.value}
          </Text>
        ) : cell.candidates && cell.candidates.length > 0 ? (
          <View style={styles.candidatesContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <View key={num} style={styles.candidateCell}>
                {cell.candidates.includes(num) && (
                  <Text style={styles.candidateText}>{num}</Text>
                )}
              </View>
            ))}
          </View>
        ) : null}
        {cell.isLocked && (
          <View style={styles.lockIcon}>
            <Text style={styles.lockText}>🔒</Text>
          </View>
        )}
        {isBoxLocked && !cell.isFixed && (
          <View style={styles.boxLockOverlay}>
            <Text style={styles.boxLockText}>✖</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < 9; i++) {
      const cells = [];
      for (let j = 0; j < 9; j++) {
        cells.push(renderCell(i, j));
      }
      rows.push(
        <View key={i} style={styles.row}>
          {cells}
        </View>
      );
    }
    return rows;
  };

  const renderNumberButton = (num: number) => {
    const upgradeInfo = numberUpgradeLevels[num];
    const Icon = NUMBER_ICONS[num];
    const hasUpgrade = !!upgradeInfo;
    
    const handlePress = () => {
      if (pencilMode) {
        toggleCandidate(num);
      } else {
        placeNumber(num);
      }
    };
    
    return (
      <TouchableOpacity
        key={num}
        style={[
          styles.numberButton,
          hasUpgrade && {
            borderColor: upgradeInfo.color,
            backgroundColor: `${upgradeInfo.color}15`,
          },
          pencilMode && styles.numberButtonPencil,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {Icon && hasUpgrade && (
          <Icon
            size={10}
            color={upgradeInfo.color}
            style={styles.numberIcon}
          />
        )}
        <Text
          style={[
            styles.numberText,
            hasUpgrade && { color: upgradeInfo.color },
          ]}
        >
          {num}
        </Text>
      </TouchableOpacity>
    );
  };

  const mistakeBar = gameState.mistakes / gameState.maxMistakes;
  const progressBar = gameState.completedCells / gameState.totalCells;
  const corruptionBar = gameState.corruption / 50;

  return (
    <View style={styles.container}>
      <CRTBackground 
        showVignette={corruptionBar > 0.4}
        vignetteIntensity={Math.min(corruptionBar * 0.5, 0.4)}
      />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>FLR</Text>
              <Text style={styles.infoValue}>{gameState.floor}/{gameState.maxFloors}</Text>
            </View>
            <View style={styles.infoCard}>
              <Sparkles size={14} color={COLORS.accent.amber} />
              <Text style={styles.infoValue}>{gameState.currency}</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.bagButton}
              onPress={() => setShowInventory(true)}
              activeOpacity={0.7}
            >
              <ShoppingBag size={18} color={COLORS.accent.amber} />
              {gameState.upgrades.length > 0 && (
                <View style={styles.bagBadge}>
                  <Text style={styles.bagBadgeText}>{gameState.upgrades.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.clearPuzzleButton}
              onPress={clearPuzzle}
              activeOpacity={0.7}
            >
              <RotateCcw size={16} color={COLORS.primary.cyan} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.solvePuzzleButton}
              onPress={solvePuzzle}
              activeOpacity={0.7}
            >
              <Check size={16} color={COLORS.accent.green} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.pencilButton, pencilMode && styles.pencilButtonActive]}
              onPress={() => setPencilMode(!pencilMode)}
              activeOpacity={0.7}
            >
              <Edit3 size={18} color={pencilMode ? COLORS.accent.amber : COLORS.primary.cyan} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearCell}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={COLORS.accent.red} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>ERR: {gameState.mistakes}/{gameState.maxMistakes}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: `${mistakeBar * 100}%`, backgroundColor: COLORS.accent.red }]} />
            </View>
          </View>

          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>PGS: {gameState.completedCells}/81</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: `${progressBar * 100}%`, backgroundColor: COLORS.primary.cyan }]} />
            </View>
          </View>
        </View>

        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>
            ░ PENDING {gameState.pendingValidations.length === 0 ? '0' : gameState.pendingValidations.length}
          </Text>
        </View>

        <Animated.View
          style={[
            styles.corruptionContainer,
            {
              opacity: corruptionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
            },
          ]}
        >
          <Text style={styles.statLabel}>CRP: {gameState.corruption}/50</Text>
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { width: `${corruptionBar * 100}%`, backgroundColor: COLORS.accent.magenta }]} />
            <View style={styles.thresholdMarker10} />
            <View style={styles.thresholdMarker20} />
            <View style={styles.thresholdMarker30} />
            <View style={styles.thresholdMarker40} />
          </View>
          <View style={styles.thresholdLabels}>
            <Text style={styles.thresholdLabel}>10</Text>
            <Text style={styles.thresholdLabel}>20</Text>
            <Text style={styles.thresholdLabel}>30</Text>
            <Text style={styles.thresholdLabel}>40</Text>
            <Text style={styles.thresholdLabel}>50</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.gameArea}>
        <View style={styles.gridContainer}>
          <View style={styles.floorNameContainer}>
            <Text style={styles.floorNameText}>
              FLOOR {gameState.floor}: {getFloorName(gameState.floor).toUpperCase()}
            </Text>
          </View>
          <View style={[styles.grid, { width: GRID_SIZE, height: GRID_SIZE }]}>
            {renderGrid()}
          </View>
        </View>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.numberPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(renderNumberButton)}
        </View>
      </View>

      {gameState.isComplete && (
        <View style={styles.completeOverlay}>
          <View style={styles.completeCard}>
            <Text style={styles.completeTitle}>▓▓ FLOOR COMPLETE ▓▓</Text>
            <Text style={styles.completeText}>[ ENTERING SHOP ]</Text>
          </View>
        </View>
      )}

      <InventoryScreen 
        visible={showInventory} 
        onClose={() => setShowInventory(false)} 
      />
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
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    gap: 6,
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    fontWeight: 'bold' as const,
    fontFamily: (Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace') as 'monospace',
  },
  infoValue: {
    fontSize: 12,
    color: COLORS.text.primary,
    fontWeight: 'bold' as const,
    fontFamily: (Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace') as 'monospace',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  statContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: BORDER.medium,
    borderColor: COLORS.primary.cyan,
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.text.secondary,
    marginBottom: 3,
    fontWeight: 'bold' as const,
    fontFamily: (Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace') as 'monospace',
  },
  barContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  barFill: {
    height: '100%',
  },
  thresholdMarker10: {
    position: 'absolute' as const,
    left: '20%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.accent.amber,
    opacity: 0.6,
  },
  thresholdMarker20: {
    position: 'absolute' as const,
    left: '40%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.accent.red,
    opacity: 0.6,
  },
  thresholdMarker30: {
    position: 'absolute' as const,
    left: '60%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.accent.amber,
    opacity: 0.6,
  },
  thresholdMarker40: {
    position: 'absolute' as const,
    left: '80%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.accent.red,
    opacity: 0.6,
  },
  thresholdLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 2,
  },
  thresholdLabel: {
    fontSize: 7,
    color: COLORS.text.secondary,
    fontWeight: 'bold' as const,
    fontFamily: (Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace') as 'monospace',
    opacity: 0.5,
  },
  corruptionContainer: {
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 6,
    borderWidth: BORDER.medium,
    borderColor: COLORS.accent.magenta,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  grid: {
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    overflow: 'hidden' as const,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: COLORS.primary.cyan,
  },
  selectedCell: {
    backgroundColor: 'rgba(93, 188, 210, 0.3)',
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
  },
  incorrectCell: {
    backgroundColor: 'rgba(230, 76, 76, 0.3)',
  },
  cellText: {
    fontSize: CELL_SIZE * 0.5,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    fontFamily: (Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace') as 'monospace',
  },
  fixedText: {
    color: COLORS.text.secondary,
  },
  incorrectText: {
    color: COLORS.accent.red,
  },
  lockedText: {
    color: COLORS.accent.amber,
  },
  lockIcon: {
    position: 'absolute' as const,
    top: 2,
    right: 2,
  },
  lockText: {
    fontSize: 10,
  } as const,
  pendingBadge: {
    padding: 4,
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.medium,
    borderColor: COLORS.accent.amber,
    marginTop: 6,
  },
  pendingText: {
    color: COLORS.accent.amber,
    fontSize: 9,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    fontFamily: (Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace') as 'monospace',
    letterSpacing: 1,
  },
  controls: {
    paddingHorizontal: 16,
  },
  numberPad: {
    flexDirection: 'row',
    gap: 6,
  },
  numberButton: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
  },
  numberText: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    fontFamily: (Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace') as 'monospace',
  },
  numberIcon: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bagButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.accent.amber,
    position: 'relative',
  },
  bagBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.accent.amber,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER.thin,
    borderColor: COLORS.background.primary,
  },
  bagBadgeText: {
    fontSize: 9,
    fontWeight: 'bold' as const,
    color: '#000000',
    fontFamily: (Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace') as 'monospace',
  },
  clearPuzzleButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
  },
  solvePuzzleButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.accent.green,
  },
  pencilButton: {
    width: 44,
    height: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
  },
  pencilButtonActive: {
    backgroundColor: 'rgba(230, 176, 76, 0.2)',
    borderColor: COLORS.accent.amber,
  },
  clearButton: {
    width: 44,
    height: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.accent.red,
  },
  completeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  completeCard: {
    padding: 32,
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.thick,
    borderColor: COLORS.primary.cyan,
    alignItems: 'center',
    minWidth: 280,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.primary.cyan,
    marginBottom: 12,
    fontFamily: (Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace') as 'monospace',
    letterSpacing: 2,
  },
  completeText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: (Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace') as 'monospace',
    letterSpacing: 1,
  },
  boxLockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxLockText: {
    fontSize: 16,
    color: COLORS.accent.red,
    fontWeight: 'bold' as const,
  },
  candidatesContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    width: '100%',
    height: '100%',
    padding: 1,
  },
  candidateCell: {
    width: '33.33%',
    height: '33.33%',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  candidateText: {
    fontSize: CELL_SIZE * 0.25,
    color: COLORS.text.secondary,
    fontWeight: 'bold' as const,
    fontFamily: (Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace') as 'monospace',
  },
  numberButtonPencil: {
    backgroundColor: 'rgba(230, 176, 76, 0.1)',
  },
  floorNameContainer: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.background.primary,
    borderWidth: BORDER.medium,
    borderColor: COLORS.primary.cyan,
  },
  floorNameText: {
    fontSize: 13,
    fontWeight: 'bold' as const,
    color: COLORS.primary.cyan,
    textAlign: 'center' as const,
    fontFamily: (Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) || 'monospace') as 'monospace',
    letterSpacing: 2,
  },
});
