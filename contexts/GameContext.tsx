import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, GamePhase, Upgrade, Cell, GameGrid, LevelModifier, MoveHistory, AmbiguityZone, Grid } from '@/types/game';
import { ShopSession, ShopOffer } from '@/types/shop';
import { createShopSession, rerollShop, purchaseOffer as purchaseShopOffer, calculateRerollCost, calculateEDRerollCost, emitShopAnalytics } from '@/utils/shop';
import { generatePuzzle, checkPuzzleComplete, countFilledCells } from '@/utils/sudoku';
import { getModifiersForFloor, getDifficultyForFloor, getDescriptionForFloor } from '@/constants/difficulty';
import { 
  initializeCell, 
  processDelayedValidation, 
  applyFogModifier, 
  applyProbabilisticHints,
  applyCandidateSuppression,
  applyRecentHide,
  applyCellLockout,
  shouldSuppressValidation,
} from '@/utils/modifiers';
import {
  generateAmbiguityZones,
  applyAmbiguityInjection,
  checkAmbiguityResolution,
  calculateAmbiguityCorruption,
  spreadAmbiguityCorruption,
} from '@/utils/ambiguity';
import {
  spreadCorruption,
  applyCorruptionDegradation,
  distortInputsInCorruptedZone,
  triggerCorruptionEvent,
  calculateShopInflation,
  getTotalCorruption,
  getCorruptionThreshold,
  cleanseCells,
  checkCorruptionThresholdEvent,
  eraseAllCandidates,
  applyFogToRandomBoxes,
  lockMultipleBoxes,
} from '@/utils/corruption';
import { Achievement, GameStats } from '@/types/achievements';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { applyNumberUpgradeEffect, applyRogueUpgradesAtStart } from '@/utils/numberUpgrades';

function createGameGrid(puzzle: Grid, solution: Grid, modifiers: LevelModifier[]): { grid: GameGrid; zones: AmbiguityZone[] } {
  let grid: GameGrid = puzzle.map((row, i) => 
    row.map((cell, j) => initializeCell(cell, cell !== null))
  );

  let zones: AmbiguityZone[] = [];

  for (const modifier of modifiers) {
    switch (modifier.type) {
      case 'fog':
        grid = applyFogModifier(grid, solution, modifier);
        break;
      case 'probabilistic_hints':
        grid = applyProbabilisticHints(grid, solution, modifier);
        break;
      case 'candidate_suppression':
        grid = applyCandidateSuppression(grid, solution, modifier);
        break;
      case 'ambiguity_injection':
        if (modifier.ambiguityTier && modifier.pocketCount) {
          zones = generateAmbiguityZones(puzzle, solution, modifier.ambiguityTier, modifier.pocketCount);
          grid = applyAmbiguityInjection(grid, solution, modifier, zones);
        }
        break;
    }
  }

  return { grid, zones };
}

export const [GameContext, useGame] = createContextHook(() => {
  const [phase, setPhase] = useState<GamePhase>('title');
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [stats, setStats] = useState<GameStats>({
    totalGamesPlayed: 0,
    totalFloorsCompleted: 0,
    highestFloor: 0,
    perfectFloorsCompleted: 0,
    totalCurrencyEarned: 0,
    totalUpgradesPurchased: 0,
    fastestFloorTime: null,
    totalMistakes: 0,
    gamesWon: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
  });
  const [floorStartTime, setFloorStartTime] = useState<number>(Date.now());
  const [runMistakes, setRunMistakes] = useState<number>(0);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const savedStats = await AsyncStorage.getItem('gameStats');
      const savedAchievements = await AsyncStorage.getItem('achievements');
      
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
      
      if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements));
      }
    } catch (error) {
      console.log('Failed to load progress:', error);
    }
  };

  const saveProgress = async (newStats: GameStats, newAchievements: Achievement[]) => {
    try {
      await AsyncStorage.setItem('gameStats', JSON.stringify(newStats));
      await AsyncStorage.setItem('achievements', JSON.stringify(newAchievements));
    } catch (error) {
      console.log('Failed to save progress:', error);
    }
  };

  const updateAchievements = (newStats: GameStats) => {
    const updatedAchievements = achievements.map(achievement => {
      let progress = achievement.progress;
      let unlocked = achievement.unlocked;

      switch (achievement.id) {
        case 'first_steps':
          progress = newStats.totalFloorsCompleted;
          break;
        case 'floor_master':
          progress = newStats.totalFloorsCompleted;
          break;
        case 'floor_legend':
          progress = newStats.totalFloorsCompleted;
          break;
        case 'perfectionist':
          progress = newStats.perfectFloorsCompleted;
          break;
        case 'flawless_master':
          progress = newStats.perfectFloorsCompleted;
          break;
        case 'rich_collector':
          progress = newStats.totalCurrencyEarned;
          break;
        case 'upgrade_addict':
          progress = newStats.totalUpgradesPurchased;
          break;
        case 'speed_runner':
          if (newStats.fastestFloorTime && newStats.fastestFloorTime <= achievement.requirement) {
            progress = 1;
          }
          break;
        case 'survivor':
          progress = newStats.highestFloor;
          break;
        case 'victory_first':
          progress = newStats.gamesWon;
          break;
        case 'win_streak':
          progress = newStats.bestWinStreak;
          break;
        case 'mistake_free':
          if (newStats.gamesWon > 0 && runMistakes === 0) {
            progress = 1;
          }
          break;
      }

      if (progress >= achievement.requirement) {
        unlocked = true;
      }

      return { ...achievement, progress, unlocked };
    });

    setAchievements(updatedAchievements);
    saveProgress(newStats, updatedAchievements);
  };

  const [gameState, setGameState] = useState<GameState>(() => {
    const { puzzle, solution } = generatePuzzle(35);
    const modifiers = getModifiersForFloor(1);
    const { grid, zones } = createGameGrid(puzzle, solution, modifiers);
    const baseMaxMistakes = 3;
    const runSeed = Date.now();
    const starterConsumable: Upgrade = {
      id: 'starter_hint',
      name: '▓ HINT ▓',
      description: 'Solves one selected tile. Use it wisely.',
      type: 'consumable',
      effect: 'solve_tile',
      cost: 0,
      rarity: 'common',
      charges: 1,
      maxCharges: 1,
    };
    const initialCorruption = getTotalCorruption(grid);
    return {
      floor: 1,
      maxFloors: 9,
      grid,
      solution,
      selectedCell: null,
      mistakes: 0,
      maxMistakes: baseMaxMistakes,
      corruption: initialCorruption,
      currency: 100,
      entropyDust: 0,
      upgrades: [starterConsumable],
      isComplete: false,
      gameOver: false,
      completedCells: countFilledCells(puzzle),
      totalCells: 81,
      modifiers,
      moveHistory: [],
      turnNumber: 0,
      pendingValidations: [],
      delayedValidationMoves: 3,
      timedHideActive: false,
      timedHideRegion: null,
      shuffleTimestamp: Date.now(),
      ambiguityZones: zones,
      truthBeaconUsed: false,
      insightMarkersRemaining: 0,
      runSeed,
      shopsOpened: 0,
      raresSeenCount: 0,
      lockedBoxes: [],
    };
  });

  const selectCell = useCallback((row: number, col: number) => {
    if (gameState.grid[row][col].isFixed) return;
    
    setGameState(prev => ({
      ...prev,
      selectedCell: { row, col },
    }));

    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, [gameState.grid]);

  const placeNumber = useCallback((num: number) => {
    if (!gameState.selectedCell || gameState.isComplete || gameState.gameOver) return;

    const { row, col } = gameState.selectedCell;
    const cell = gameState.grid[row][col];
    
    if (cell.isFixed || cell.isLocked) return;
    
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);
    const boxIndex = boxRow * 3 + boxCol;
    if (gameState.lockedBoxes.includes(boxIndex)) {
      console.log(`[CellLock] Cannot place number in locked box ${boxIndex}`);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const delayedMod = gameState.modifiers.find(m => m.type === 'delayed_validation');
    const delayedMoves = delayedMod ? delayedMod.intensity : 0;
    const suppressValidation = shouldSuppressValidation(row, col, gameState.modifiers);

    const move: MoveHistory = {
      row,
      col,
      value: num,
      turnNumber: gameState.turnNumber + 1,
    };

    const lockoutMod = gameState.modifiers.find(m => m.type === 'cell_lockout');
    const lockDuration = lockoutMod ? lockoutMod.intensity : 0;
    
    const corruptionDistortion = distortInputsInCorruptedZone(gameState.grid, row, col, num);
    const finalLockDuration = corruptionDistortion.shouldLock ? Math.max(lockDuration, 3) : lockDuration;

    let newGrid = gameState.grid.map((r, i) => 
      r.map((c, j) => {
        if (i === row && j === col) {
          return {
            ...c,
            value: num,
            isCorrect: suppressValidation ? true : c.isCorrect,
            lockTurnsRemaining: finalLockDuration,
            isLocked: finalLockDuration > 0,
            isHidden: corruptionDistortion.shouldHide ? true : c.isHidden,
          };
        }
        return c;
      })
    );

    const recentHideMod = gameState.modifiers.find(m => m.type === 'recent_hide');
    if (recentHideMod) {
      newGrid = applyRecentHide(newGrid, [...gameState.moveHistory, move], gameState.turnNumber + 1, recentHideMod.intensity);
    }

    newGrid = applyCellLockout(newGrid, lockDuration);

    let newPendingValidations = [...gameState.pendingValidations, move];
    let newMistakes = gameState.mistakes;
    let newCurrency = gameState.currency;
    let upgradeTriggered = false;
    let newAmbiguityZones = gameState.ambiguityZones;
    let newUpgrades = gameState.upgrades.map(u => ({ ...u }));

    if (newPendingValidations.length >= delayedMoves) {
      const toValidate = newPendingValidations.splice(0, newPendingValidations.length - delayedMoves + 1);
      const validationResult = processDelayedValidation(newGrid, gameState.solution, toValidate);
      newGrid = validationResult.grid;
      
      let mistakesToAdd = validationResult.mistakes;
      
      const corruptedCore = gameState.upgrades.find(u => u.effect === 'corrupt_gold');
      if (corruptedCore && mistakesToAdd > 0) {
        const goldBonus = mistakesToAdd * 10;
        newCurrency += goldBonus;
        console.log(`[CorruptedCore] Gained ${goldBonus} gold from ${mistakesToAdd} mistakes`);
      }
      
      let mistakesNeutralized = 0;
      for (let i = 0; i < newUpgrades.length; i++) {
        const upgrade = newUpgrades[i];
        if (upgrade.effect.startsWith('mistake_neutralize_') && upgrade.charges && upgrade.charges > 0) {
          if (mistakesToAdd > 0) {
            const neutralizeCount = Math.min(mistakesToAdd, upgrade.charges);
            mistakesToAdd -= neutralizeCount;
            mistakesNeutralized += neutralizeCount;
            newUpgrades[i].charges = (upgrade.charges || 0) - neutralizeCount;
            console.log(`[Mistake] Neutralized ${neutralizeCount} mistakes using ${upgrade.name}. Charges left: ${newUpgrades[i].charges}`);
            if (mistakesToAdd === 0) break;
          }
        }
      }
      
      newMistakes += mistakesToAdd;
      
      if (validationResult.mistakes > 0) {
        setRunMistakes(prev => prev + validationResult.mistakes);
        
        const noSpread = gameState.upgrades.find(u => u.effect === 'no_spread');
        const hazmatSuit = gameState.upgrades.find(u => u.effect === 'first_mistake_safe');
        const isFirstMistakeInPuzzle = gameState.mistakes === 0 && hazmatSuit;
        
        if (!noSpread && !isFirstMistakeInPuzzle) {
          for (const validatedMove of toValidate) {
            const isCorrect = gameState.solution[validatedMove.row][validatedMove.col] === validatedMove.value;
            if (!isCorrect) {
              const previousCorruption = getTotalCorruption(newGrid);
              const spreadResult = spreadCorruption(newGrid, validatedMove.row, validatedMove.col);
              newGrid = spreadResult.grid;
              
              const currentCorruption = getTotalCorruption(newGrid);
              console.log(`[Corruption] Spread from (${validatedMove.row},${validatedMove.col}). Count: ${previousCorruption} -> ${currentCorruption}`);
            }
          }
        } else if (isFirstMistakeInPuzzle) {
          console.log('[HazmatSuit] First mistake - no corruption spread');
        }
      }
    }
    
    const upgradeEffects = gameState.upgrades.map(u => u.effect);
    newGrid = applyCorruptionDegradation(newGrid, gameState.solution, upgradeEffects);
    
    let newLockedBoxes = [...gameState.lockedBoxes];
    
    const previousCorruptionCount = gameState.corruption;
    const currentCorruptionCount = getTotalCorruption(newGrid);
    
    const thresholdEvent = checkCorruptionThresholdEvent(
      previousCorruptionCount,
      currentCorruptionCount,
      upgradeEffects
    );
    
    if (thresholdEvent.eventType) {
      if (thresholdEvent.eventType === 'lose') {
        console.log('[Corruption] Reached 50 - Game Over!');
        setGameState(prev => ({
          ...prev,
          gameOver: true,
        }));
        setPhase('defeat');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      } else if (thresholdEvent.eventType === 'candidate_chaos') {
        if (thresholdEvent.threshold === 10) {
          console.log('[Corruption Threshold 10] Erasing all pencil marks');
          newGrid = eraseAllCandidates(newGrid);
        } else if (thresholdEvent.threshold === 30) {
          console.log('[Corruption Threshold 30] Erasing all pencil marks + fogging 3 boxes');
          newGrid = eraseAllCandidates(newGrid);
          newGrid = applyFogToRandomBoxes(newGrid, 3);
        }
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } else if (thresholdEvent.eventType === 'cell_lock') {
        if (thresholdEvent.threshold === 20) {
          console.log('[Corruption Threshold 20] Locking 1 box');
          const eventResult = triggerCorruptionEvent(newGrid, 'cell_lock', row, col);
          if (eventResult.lockedBox !== undefined && !newLockedBoxes.includes(eventResult.lockedBox)) {
            newLockedBoxes.push(eventResult.lockedBox);
          }
        } else if (thresholdEvent.threshold === 40) {
          console.log('[Corruption Threshold 40] Locking 3 boxes');
          newLockedBoxes = lockMultipleBoxes(newGrid, newLockedBoxes, 3);
        }
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    }
    
    const currentCell = newGrid[row][col];
    if (currentCell.isAmbiguous && !suppressValidation) {
      const isCorrect = gameState.solution[row][col] === num;
      
      if (!isCorrect) {
        const divergenceCharm = gameState.upgrades.find(u => u.effect === 'ambiguity_contain');
        
        if (divergenceCharm) {
          newGrid = newGrid.map((r, i) => 
            r.map((c, j) => {
              if (i === row && j === col) {
                return { ...c, corruption: 1 };
              }
              return c;
            })
          );
        } else {
          newGrid = spreadAmbiguityCorruption(newGrid, row, col, currentCell.ambiguityLevel);
        }
      }
      
      newAmbiguityZones = checkAmbiguityResolution(newAmbiguityZones, newGrid, gameState.solution);
    }
    
    const isCorrectPlacement = gameState.solution[row][col] === num;
    
    const goldenDie = gameState.upgrades.find(u => u.effect === 'golden_number');
    if (goldenDie && isCorrectPlacement) {
      const goldenNumber = goldenDie.number || Math.floor(Math.random() * 9) + 1;
      if (num === goldenNumber) {
        newCurrency += 1;
        console.log(`[GoldenDie] Placed golden number ${goldenNumber}! +1 gold`);
      }
    }
    
    if (isCorrectPlacement) {
      const numberUpgrades = gameState.upgrades.filter(
        u => u.type === 'number' && u.number === num
      );
      
      if (numberUpgrades.length > 0) {
        console.log(`[NumberUpgrade] Found ${numberUpgrades.length} upgrades for number ${num}`);
        
        for (const upgrade of numberUpgrades) {
          const currentCorruption = getTotalCorruption(newGrid);
          const result = applyNumberUpgradeEffect(
            upgrade,
            newGrid,
            gameState.solution,
            row,
            col,
            num,
            currentCorruption,
            newCurrency,
            gameState.upgrades
          );
          
          newGrid = result.grid;
          if (result.currency !== undefined) {
            newCurrency = result.currency;
          }
          if (result.inflationReduction !== undefined) {
            console.log(`[NumberUpgrade] Inflation reduction: ${result.inflationReduction}%`);
          }
          if (result.maxMistakesBonus !== undefined) {
            console.log(`[NumberUpgrade] Max mistakes bonus: +${result.maxMistakesBonus}`);
          }
          upgradeTriggered = true;
          console.log(`[NumberUpgrade] Triggered: ${upgrade.effect}`);
        }
      } else {
        console.log(`[NumberUpgrade] No upgrades found for number ${num} - number does nothing`);
      }
    }
    
    if (upgradeTriggered && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newCompletedCells = countFilledCells(newGrid.map(row => row.map(cell => cell.value)));
    const finalCorruption = getTotalCorruption(newGrid);
    
    const puzzleGrid = newGrid.map(row => row.map(cell => cell.value));
    const isComplete = checkPuzzleComplete(puzzleGrid, gameState.solution);
    const gameOver = newMistakes >= gameState.maxMistakes;

    if (isComplete) {
      const validationResult = processDelayedValidation(newGrid, gameState.solution, newPendingValidations);
      newGrid = validationResult.grid;
      newMistakes += validationResult.mistakes;
      newPendingValidations = [];
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else if (gameOver) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setPhase('defeat');
    }

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      mistakes: newMistakes,
      corruption: finalCorruption,
      currency: newCurrency,
      upgrades: newUpgrades,
      completedCells: newCompletedCells,
      isComplete,
      gameOver,
      moveHistory: [...prev.moveHistory, move],
      turnNumber: prev.turnNumber + 1,
      pendingValidations: newPendingValidations,
      ambiguityZones: newAmbiguityZones,
      lockedBoxes: newLockedBoxes,
    }));
  }, [gameState]);

  const clearCell = useCallback(() => {
    if (!gameState.selectedCell || gameState.isComplete || gameState.gameOver) return;

    const { row, col } = gameState.selectedCell;
    const cell = gameState.grid[row][col];
    
    if (cell.isFixed || cell.value === null) return;

    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }

    const newGrid = gameState.grid.map((r, i) => 
      r.map((c, j) => {
        if (i === row && j === col) {
          return {
            ...c,
            value: null,
            isCorrect: true,
          };
        }
        return c;
      })
    );

    const newCompletedCells = countFilledCells(newGrid.map(row => row.map(cell => cell.value)));

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      completedCells: newCompletedCells,
    }));
  }, [gameState]);

  const toggleCandidate = useCallback((num: number) => {
    if (!gameState.selectedCell || gameState.isComplete || gameState.gameOver) return;

    const { row, col } = gameState.selectedCell;
    const cell = gameState.grid[row][col];
    
    if (cell.isFixed || cell.value !== null) return;

    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }

    const newGrid = gameState.grid.map((r, i) => 
      r.map((c, j) => {
        if (i === row && j === col) {
          const currentCandidates = c.candidates || [];
          const hasCandidate = currentCandidates.includes(num);
          
          return {
            ...c,
            candidates: hasCandidate
              ? currentCandidates.filter(n => n !== num)
              : [...currentCandidates, num].sort((a, b) => a - b),
          };
        }
        return c;
      })
    );

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
    }));
  }, [gameState]);

  const clearCandidates = useCallback(() => {
    if (!gameState.selectedCell || gameState.isComplete || gameState.gameOver) return;

    const { row, col } = gameState.selectedCell;
    const cell = gameState.grid[row][col];
    
    if (cell.isFixed || cell.value !== null) return;

    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }

    const newGrid = gameState.grid.map((r, i) => 
      r.map((c, j) => {
        if (i === row && j === col) {
          return {
            ...c,
            candidates: [],
          };
        }
        return c;
      })
    );

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
    }));
  }, [gameState]);

  const startGame = useCallback(() => {
    setRunMistakes(0);
    setFloorStartTime(Date.now());
    setPhase('puzzle');
  }, []);

  const showProgress = useCallback(() => {
    setPhase('progress');
  }, []);

  const backToTitle = useCallback(() => {
    setPhase('title');
  }, []);

  const completeFloor = useCallback(() => {
    let reward = 50 + (gameState.floor * 20);
    
    const goldenTouchUpgrade = gameState.upgrades.find(
      u => u.id === 'golden_touch' || u.id === 'run_golden_touch' || u.effect === 'currency_multiplier'
    );
    if (goldenTouchUpgrade) {
      reward = reward * 2;
      console.log('[CompleteFloor] Golden Touch active - reward doubled to', reward);
    }
    
    const floorTime = (Date.now() - floorStartTime) / 1000;
    const isPerfect = gameState.mistakes === 0;
    
    const newStats: GameStats = {
      ...stats,
      totalFloorsCompleted: stats.totalFloorsCompleted + 1,
      highestFloor: Math.max(stats.highestFloor, gameState.floor),
      perfectFloorsCompleted: isPerfect ? stats.perfectFloorsCompleted + 1 : stats.perfectFloorsCompleted,
      totalCurrencyEarned: stats.totalCurrencyEarned + reward,
      fastestFloorTime: stats.fastestFloorTime === null ? floorTime : Math.min(stats.fastestFloorTime, floorTime),
      totalMistakes: stats.totalMistakes + gameState.mistakes,
    };

    setStats(newStats);
    updateAchievements(newStats);
    
    setGameState(prev => ({
      ...prev,
      currency: prev.currency + reward,
    }));

    if (gameState.floor >= gameState.maxFloors) {
      const finalStats = {
        ...newStats,
        gamesWon: newStats.gamesWon + 1,
        currentWinStreak: newStats.currentWinStreak + 1,
        bestWinStreak: Math.max(newStats.bestWinStreak, newStats.currentWinStreak + 1),
      };
      setStats(finalStats);
      updateAchievements(finalStats);
      setRunMistakes(0);
      setPhase('victory');
    } else {
      setPhase('shop');
    }
  }, [gameState.floor, gameState.maxFloors, gameState.mistakes, stats, floorStartTime, runMistakes]);

  const purchaseUpgrade = useCallback((upgrade: Upgrade) => {
    if (gameState.currency < upgrade.cost) return;

    const existingUpgrade = gameState.upgrades.find(u => u.id === upgrade.id);
    if (existingUpgrade) {
      console.log('[Purchase] Upgrade already owned:', upgrade.id);
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newStats = {
      ...stats,
      totalUpgradesPurchased: stats.totalUpgradesPurchased + 1,
    };
    setStats(newStats);
    updateAchievements(newStats);

    const upgradeWithCharges = {
      ...upgrade,
      charges: upgrade.maxCharges || upgrade.charges,
    };

    let maxMistakesBonus = 0;
    if (upgrade.effect === 'max_mistakes') {
      maxMistakesBonus = upgrade.id.includes('reinforced_buffer') ? 1 : 2;
      console.log(`[Purchase] ${upgrade.name} purchased - increasing max mistakes by ${maxMistakesBonus}`);
    }
    
    if (upgrade.effect === 'golden_number') {
      const goldenNumber = Math.floor(Math.random() * 9) + 1;
      upgradeWithCharges.number = goldenNumber;
      console.log(`[Purchase] Golden Die selected number: ${goldenNumber}`);
    }

    setGameState(prev => ({
      ...prev,
      currency: prev.currency - upgrade.cost,
      upgrades: [...prev.upgrades, upgradeWithCharges],
      maxMistakes: prev.maxMistakes + maxMistakesBonus,
    }));
  }, [gameState.currency, gameState.upgrades, stats]);

  const nextFloor = useCallback(() => {
    const newFloor = gameState.floor + 1;
    const difficulty = getDifficultyForFloor(newFloor);
    const { puzzle, solution } = generatePuzzle(difficulty);
    const modifiers = getModifiersForFloor(newFloor);
    let { grid, zones } = createGameGrid(puzzle, solution, modifiers);

    setFloorStartTime(Date.now());
    
    let baseMaxMistakes = 3;
    const maxMistakesUpgrades = gameState.upgrades.filter(u => u.effect === 'max_mistakes');
    for (const upgrade of maxMistakesUpgrades) {
      const bonus = upgrade.id.includes('reinforced_buffer') ? 1 : 2;
      baseMaxMistakes += bonus;
      console.log(`[NextFloor] ${upgrade.name} active - max mistakes increased by ${bonus}`);
    }

    let startCurrency = gameState.currency;
    const rogueResult = applyRogueUpgradesAtStart(grid, solution, gameState.upgrades, startCurrency);
    grid = rogueResult.grid;
    startCurrency = rogueResult.currency;
    console.log('[RogueUpgrades] Applied at floor start. New currency:', startCurrency);
    
    const initialCorruption = getTotalCorruption(grid);

    setGameState(prev => ({
      ...prev,
      floor: newFloor,
      grid,
      solution,
      selectedCell: null,
      mistakes: 0,
      maxMistakes: baseMaxMistakes,
      corruption: initialCorruption,
      currency: startCurrency,
      isComplete: false,
      gameOver: false,
      completedCells: countFilledCells(puzzle),
      modifiers,
      moveHistory: [],
      turnNumber: 0,
      pendingValidations: [],
      timedHideActive: false,
      timedHideRegion: null,
      shuffleTimestamp: Date.now(),
      ambiguityZones: zones,
      truthBeaconUsed: false,
      insightMarkersRemaining: prev.upgrades.filter(u => u.effect === 'ambiguity_hedge').length,
      lockedBoxes: [],
    }));

    setPhase('puzzle');
  }, [gameState.floor, gameState.upgrades]);

  const restartGame = useCallback(() => {
    const { puzzle, solution } = generatePuzzle(35);
    const modifiers = getModifiersForFloor(1);
    const { grid, zones } = createGameGrid(puzzle, solution, modifiers);
    const runSeed = Date.now();
    
    const starterConsumable: Upgrade = {
      id: 'starter_hint',
      name: '▓ HINT ▓',
      description: 'Solves one selected tile. Use it wisely.',
      type: 'consumable',
      effect: 'solve_tile',
      cost: 0,
      rarity: 'common',
      charges: 1,
      maxCharges: 1,
    };
    
    const newStats = {
      ...stats,
      totalGamesPlayed: stats.totalGamesPlayed + 1,
      currentWinStreak: 0,
    };
    setStats(newStats);
    setRunMistakes(0);
    setFloorStartTime(Date.now());
    
    const initialCorruption = getTotalCorruption(grid);
    
    setGameState({
      floor: 1,
      maxFloors: 9,
      grid,
      solution,
      selectedCell: null,
      mistakes: 0,
      maxMistakes: 3,
      corruption: initialCorruption,
      currency: 100,
      entropyDust: 0,
      upgrades: [starterConsumable],
      isComplete: false,
      gameOver: false,
      completedCells: countFilledCells(puzzle),
      totalCells: 81,
      modifiers,
      moveHistory: [],
      turnNumber: 0,
      pendingValidations: [],
      delayedValidationMoves: 3,
      timedHideActive: false,
      timedHideRegion: null,
      shuffleTimestamp: Date.now(),
      ambiguityZones: zones,
      truthBeaconUsed: false,
      insightMarkersRemaining: 0,
      runSeed,
      shopsOpened: 0,
      raresSeenCount: 0,
      lockedBoxes: [],
    });

    setPhase('puzzle');
  }, [stats]);

  const useConsumable = useCallback((consumableId: string) => {
    const consumable = gameState.upgrades.find(u => u.id === consumableId && u.type === 'consumable');
    
    if (!consumable || !consumable.charges || consumable.charges === 0) {
      console.log('[Consumable] Cannot use - no charges or not found:', consumableId);
      return;
    }

    console.log(`[Consumable] Using ${consumable.name} (${consumable.effect})`);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    let newGrid = gameState.grid.map(row => row.map(cell => ({ ...cell })));
    let newCurrency = gameState.currency;

    switch (consumable.effect) {
      case 'purify_global':
      case 'cleanse_corruption': {
        const cellsToCleanse = consumable.maxCharges || 3;
        const cleanseResult = cleanseCells(newGrid, cellsToCleanse);
        newGrid = cleanseResult.grid;
        console.log(`[Consumable] Cleansed ${cleanseResult.cellsCleansed} cells`);
        break;
      }

      case 'reveal_cells': {
        const emptyCells: Array<{ row: number; col: number }> = [];
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            if (newGrid[i][j].value === null && !newGrid[i][j].isFixed) {
              emptyCells.push({ row: i, col: j });
            }
          }
        }

        const revealCount = Math.min(3, emptyCells.length);
        for (let k = 0; k < revealCount; k++) {
          const randomIndex = Math.floor(Math.random() * emptyCells.length);
          const { row, col } = emptyCells[randomIndex];
          emptyCells.splice(randomIndex, 1);

          newGrid[row][col] = {
            ...newGrid[row][col],
            value: gameState.solution[row][col],
            isCorrect: true,
            isFixed: true,
          };
        }
        console.log(`[Consumable] Revealed ${revealCount} cells`);
        break;
      }

      case 'currency_boost': {
        const bonus = 50;
        newCurrency += bonus;
        console.log(`[Consumable] Added ${bonus} currency`);
        break;
      }

      case 'mistake_heal': {
        const newMistakes = Math.max(0, gameState.mistakes - 1);
        setGameState(prev => ({
          ...prev,
          mistakes: newMistakes,
        }));
        console.log('[Consumable] Healed 1 mistake');
        break;
      }
      
      case 'shield_next':
      case 'discount_next': {
        console.log(`[Consumable] ${consumable.name} will take effect automatically`);
        break;
      }

      case 'solve_tile': {
        if (!gameState.selectedCell) {
          console.log('[Consumable] No cell selected');
          return;
        }

        const { row, col } = gameState.selectedCell;
        const cell = newGrid[row][col];

        if (cell.isFixed) {
          console.log('[Consumable] Cannot solve fixed cell');
          return;
        }

        newGrid[row][col] = {
          ...newGrid[row][col],
          value: gameState.solution[row][col],
          isCorrect: true,
          isFixed: true,
          corruption: 0,
          isHidden: false,
        };
        console.log(`[Consumable] Solved cell at (${row}, ${col}) with value ${gameState.solution[row][col]}`);
        break;
      }
      
      case 'clear_fog': {
        newGrid = newGrid.map(row => row.map(cell => ({
          ...cell,
          isFogged: false,
          candidates: [],
        })));
        console.log('[Consumable] Glimmercap - cleared all fog and phantom candidates');
        break;
      }
      
      case 'cleanse_box': {
        if (!gameState.selectedCell) {
          console.log('[Consumable] No cell selected for box cleansing');
          return;
        }
        const { row, col } = gameState.selectedCell;
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = boxRow; i < boxRow + 3; i++) {
          for (let j = boxCol; j < boxCol + 3; j++) {
            newGrid[i][j] = {
              ...newGrid[i][j],
              corruption: 0,
              isFogged: false,
              isHidden: false,
            };
          }
        }
        console.log('[Consumable] Purifying Salt - cleansed 3x3 box');
        break;
      }
      
      case 'solve_random': {
        const emptyCells: Array<{ row: number; col: number }> = [];
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            if (newGrid[i][j].value === null && !newGrid[i][j].isFixed) {
              emptyCells.push({ row: i, col: j });
            }
          }
        }
        
        if (emptyCells.length > 0) {
          const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
          newGrid[randomCell.row][randomCell.col] = {
            ...newGrid[randomCell.row][randomCell.col],
            value: gameState.solution[randomCell.row][randomCell.col],
            isCorrect: true,
            isFixed: true,
          };
          console.log('[Consumable] Logical Leap - solved random cell');
        }
        break;
      }

      default:
        console.log('[Consumable] Unknown effect:', consumable.effect);
    }

    const updatedUpgrades = gameState.upgrades.map(u => {
      if (u.id === consumableId) {
        const newCharges = (u.charges || 0) - 1;
        return { ...u, charges: newCharges };
      }
      return u;
    });

    const filteredUpgrades = updatedUpgrades.filter(u => {
      if (u.type === 'consumable' && (!u.charges || u.charges === 0)) {
        return false;
      }
      return true;
    });
    
    const finalCorruption = getTotalCorruption(newGrid);

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      corruption: finalCorruption,
      currency: newCurrency,
      upgrades: filteredUpgrades,
      completedCells: countFilledCells(newGrid.map(row => row.map(cell => cell.value))),
    }));
  }, [gameState]);

  const clearPuzzle = useCallback(() => {
    console.log('[Debug] Clearing puzzle for testing');
    
    const newGrid = gameState.grid.map((row, i) => 
      row.map((cell, j) => {
        if (cell.isFixed) {
          return cell;
        }
        return {
          ...cell,
          value: null,
          isCorrect: true,
          isLocked: false,
          lockTurnsRemaining: 0,
          isHidden: false,
        };
      })
    );

    const newCompletedCells = countFilledCells(newGrid.map(row => row.map(cell => cell.value)));

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      selectedCell: null,
      completedCells: newCompletedCells,
      isComplete: false,
      gameOver: false,
      moveHistory: [],
      turnNumber: 0,
      pendingValidations: [],
    }));

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [gameState]);

  const solvePuzzle = useCallback(() => {
    console.log('[Debug] Solving entire puzzle for testing');
    
    const newGrid = gameState.grid.map((row, i) => 
      row.map((cell, j) => ({
        ...cell,
        value: gameState.solution[i][j],
        isCorrect: true,
        isFixed: false,
        isLocked: false,
        lockTurnsRemaining: 0,
        isHidden: false,
        corruption: 0,
      }))
    );

    const newCompletedCells = countFilledCells(newGrid.map(row => row.map(cell => cell.value)));
    const isComplete = checkPuzzleComplete(newGrid.map(row => row.map(cell => cell.value)), gameState.solution);

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      selectedCell: null,
      completedCells: newCompletedCells,
      isComplete,
      gameOver: false,
      pendingValidations: [],
    }));

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [gameState]);

  return {
    phase,
    gameState,
    stats,
    achievements,
    selectCell,
    placeNumber,
    clearCell,
    toggleCandidate,
    clearCandidates,
    completeFloor,
    purchaseUpgrade,
    nextFloor,
    restartGame,
    startGame,
    showProgress,
    backToTitle,
    useConsumable,
    clearPuzzle,
    solvePuzzle,
    getFloorDescription: () => getDescriptionForFloor(gameState.floor),
  };
});
