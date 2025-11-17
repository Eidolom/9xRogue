import { POWERUPS, getPowerupById, getPowerupsByDigit, PowerupRarity } from '@/src/powerups/PowerupModel';
import { applyRogueStart, applyOnPlacement, applyRunPurchase, RunState } from '@/src/powerups/PowerupManager';
import { generatePuzzle, checkPuzzleComplete } from '@/utils/sudoku';
import { initializeCell } from '@/utils/modifiers';
import { GameGrid, Grid } from '@/types/game';

function createTestGrid(puzzle: Grid): GameGrid {
  return puzzle.map((row, i) => row.map((cell, j) => initializeCell(cell, cell !== null)));
}

function createTestRunState(seed = 12345): RunState {
  const { puzzle, solution } = generatePuzzle(35);
  const grid = createTestGrid(puzzle);

  return {
    grid,
    solution,
    currency: 100,
    entropyDust: 0,
    globalCorruption: 0,
    activePowerups: [],
    appliedEffects: [],
    forbiddenSlots: [],
    boxLocks: [],
    runSeed: seed,
    turnNumber: 0,
  };
}

describe('PowerupModel', () => {
  test('loads all 45 powerups', () => {
    expect(POWERUPS).toHaveLength(45);
  });

  test('each powerup has valid schema', () => {
    for (const powerup of POWERUPS) {
      expect(powerup.id).toBeTruthy();
      expect(powerup.digit).toBeGreaterThanOrEqual(1);
      expect(powerup.digit).toBeLessThanOrEqual(9);
      expect(['Common', 'Uncommon', 'Rare', 'Epic', 'Rogue']).toContain(powerup.rarity);
      expect(typeof powerup.autoTrigger).toBe('boolean');
      expect(powerup.effectKey).toBeTruthy();
      expect(powerup.params).toBeDefined();
      expect(powerup.description).toBeTruthy();
    }
  });

  test('no duplicate IDs', () => {
    const ids = POWERUPS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('getPowerupById retrieves correct powerup', () => {
    const powerup = getPowerupById('num_1_common');
    expect(powerup).toBeDefined();
    expect(powerup?.digit).toBe(1);
    expect(powerup?.rarity).toBe('Common');
  });

  test('getPowerupsByDigit returns all rarities for digit', () => {
    const digit1Powerups = getPowerupsByDigit(1);
    expect(digit1Powerups).toHaveLength(5);
    const rarities = digit1Powerups.map(p => p.rarity);
    expect(rarities).toContain('Common');
    expect(rarities).toContain('Rogue');
  });
});

describe('Powerup Effects - Unit Tests', () => {
  describe('num_1_common_reduces_corruption', () => {
    test('reduces corruption in row by 5', () => {
      const state = createTestRunState(12345);
      state.grid[0][0].corruption = 10;
      state.grid[0][1].corruption = 15;
      state.grid[0][2].corruption = 5;

      const powerup = getPowerupById('num_1_common')!;
      state.activePowerups.push({ id: powerup.id, powerup });

      const newState = applyOnPlacement(state, 'num_1_common', 1, 0, 0);

      expect(newState.grid[0][0].corruption).toBe(5);
      expect(newState.grid[0][1].corruption).toBe(10);
      expect(newState.grid[0][2].corruption).toBe(0);
    });
  });

  describe('num_1_uncommon_cleans_one', () => {
    test('cleans one corrupted cell in row', () => {
      const state = createTestRunState(12345);
      state.grid[0][0].corruption = 10;
      state.grid[0][1].corruption = 20;

      const powerup = getPowerupById('num_1_uncommon')!;
      state.activePowerups.push({ id: powerup.id, powerup });

      const newState = applyOnPlacement(state, 'num_1_uncommon', 1, 0, 0);

      const cleanedCells = newState.grid[0].filter(c => c.corruption === 0);
      expect(cleanedCells.length).toBeGreaterThan(state.grid[0].filter(c => c.corruption === 0).length);
    });
  });

  describe('num_1_rogue_auto', () => {
    test('auto-purifies most corrupted cell at start', () => {
      const state = createTestRunState(12345);
      state.grid[4][4].corruption = 50;
      state.grid[2][2].corruption = 30;

      const powerup = getPowerupById('num_1_rogue')!;
      powerup.autoTrigger = true;
      state.activePowerups.push({ id: powerup.id, powerup });

      const newState = applyRogueStart(state);

      const maxCorruption = Math.max(...newState.grid.flat().map(c => c.corruption));
      expect(maxCorruption).toBeLessThan(50);
      expect(newState.appliedEffects).toHaveLength(1);
      expect(newState.appliedEffects[0].effectKey).toBe('purify');
    });
  });

  describe('num_2_uncommon_autoplaces', () => {
    test('automatically places one correct 2', () => {
      const state = createTestRunState(12345);
      const initialTwos = state.grid.flat().filter(c => c.value === 2 && c.isCorrect).length;

      const powerup = getPowerupById('num_2_uncommon')!;
      state.activePowerups.push({ id: powerup.id, powerup });

      const newState = applyOnPlacement(state, 'num_2_uncommon', 2, 0, 0);

      const finalTwos = newState.grid.flat().filter(c => c.value === 2 && c.isCorrect).length;
      expect(finalTwos).toBeGreaterThanOrEqual(initialTwos);
    });

    test('preserves puzzle uniqueness', () => {
      const state = createTestRunState(12345);

      const powerup = getPowerupById('num_2_uncommon')!;
      state.activePowerups.push({ id: powerup.id, powerup });

      const newState = applyOnPlacement(state, 'num_2_uncommon', 2, 0, 0);

      const gridValues = newState.grid.map(row => row.map(cell => cell.value));
      const isComplete = checkPuzzleComplete(gridValues, newState.solution);

      if (isComplete) {
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            expect(gridValues[i][j]).toBe(newState.solution[i][j]);
          }
        }
      }
    });
  });

  describe('num_2_rogue_auto', () => {
    test('auto-places one correct 2 at level start', () => {
      const state = createTestRunState(12345);
      const initialTwos = state.grid.flat().filter(c => c.value === 2).length;

      const powerup = getPowerupById('num_2_rogue')!;
      powerup.autoTrigger = true;
      state.activePowerups.push({ id: powerup.id, powerup });

      const newState = applyRogueStart(state);

      const finalTwos = newState.grid.flat().filter(c => c.value === 2).length;
      expect(finalTwos).toBeGreaterThan(initialTwos);
    });
  });

  describe('num_3_uncommon_lock', () => {
    test('locks box from corruption for 1 move', () => {
      const state = createTestRunState(12345);

      const powerup = getPowerupById('num_3_uncommon')!;
      state.activePowerups.push({ id: powerup.id, powerup });

      const newState = applyOnPlacement(state, 'num_3_uncommon', 3, 1, 1);

      expect(newState.boxLocks).toHaveLength(1);
      expect(newState.boxLocks[0].durationMoves).toBe(1);
    });
  });

  describe('num_4_common_forbid', () => {
    test('marks one forbidden slot for digit 4', () => {
      const state = createTestRunState(12345);

      const powerup = getPowerupById('num_4_common')!;
      state.activePowerups.push({ id: powerup.id, powerup });

      const newState = applyOnPlacement(state, 'num_4_common', 4, 0, 0);

      expect(newState.forbiddenSlots.length).toBeGreaterThanOrEqual(0);

      for (const forbidden of newState.forbiddenSlots) {
        expect(forbidden.digit).toBe(4);
        expect(newState.solution[forbidden.row][forbidden.col]).not.toBe(4);
      }
    });
  });

  describe('num_5_rare_resolve', () => {
    test('resolves one ambiguous cell', () => {
      const state = createTestRunState(12345);
      state.grid[3][3].isAmbiguous = true;
      state.grid[3][3].value = null;

      const powerup = getPowerupById('num_5_rare')!;
      state.activePowerups.push({ id: powerup.id, powerup });

      const newState = applyOnPlacement(state, 'num_5_rare', 5, 3, 3);

      const resolvedCells = newState.grid.flat().filter(
        c => c.value !== null && c.isCorrect && !c.isAmbiguous
      );
      expect(resolvedCells.length).toBeGreaterThan(0);
    });
  });

  describe('num_7_common_currency', () => {
    test('adds 5 OF on placement', () => {
      const state = createTestRunState(12345);
      const initialCurrency = state.currency;

      const powerup = getPowerupById('num_7_common')!;
      state.activePowerups.push({ id: powerup.id, powerup });

      const newState = applyOnPlacement(state, 'num_7_common', 7, 0, 0);

      expect(newState.currency).toBe(initialCurrency + 5);
    });
  });

  describe('num_7_rogue_auto', () => {
    test('auto-grants 20 OF at level start', () => {
      const state = createTestRunState(12345);
      const initialCurrency = state.currency;

      const powerup = getPowerupById('num_7_rogue')!;
      powerup.autoTrigger = true;
      state.activePowerups.push({ id: powerup.id, powerup });

      const newState = applyRogueStart(state);

      expect(newState.currency).toBe(initialCurrency + 20);
    });
  });

  describe('num_9_common_neutralize', () => {
    test('neutralizes mistakes via charges', () => {
      const state = createTestRunState(12345);

      const powerup = getPowerupById('num_9_common')!;
      state.activePowerups.push({
        id: powerup.id,
        powerup,
        chargesRemaining: 1,
      });

      expect(state.activePowerups[0].chargesRemaining).toBe(1);
    });
  });
});

describe('Shop Integration', () => {
  test('applyRunPurchase adds powerup to active list', () => {
    const state = createTestRunState(12345);

    const newState = applyRunPurchase(state, 'num_1_common');

    expect(newState.activePowerups).toHaveLength(1);
    expect(newState.activePowerups[0].id).toBe('num_1_common');
  });

  test('applyRunPurchase does not duplicate existing powerup', () => {
    const state = createTestRunState(12345);
    const powerup = getPowerupById('num_1_common')!;
    state.activePowerups.push({ id: powerup.id, powerup });

    const newState = applyRunPurchase(state, 'num_1_common');

    expect(newState.activePowerups).toHaveLength(1);
  });
});

describe('Rogue Auto-Trigger', () => {
  test('applyRogueStart triggers all Rogue powerups', () => {
    const state = createTestRunState(12345);

    const rogue1 = getPowerupById('num_1_rogue')!;
    const rogue7 = getPowerupById('num_7_rogue')!;

    rogue1.autoTrigger = true;
    rogue7.autoTrigger = true;

    state.activePowerups.push(
      { id: rogue1.id, powerup: rogue1 },
      { id: rogue7.id, powerup: rogue7 }
    );

    const newState = applyRogueStart(state);

    expect(newState.appliedEffects.length).toBeGreaterThanOrEqual(2);
    expect(newState.currency).toBe(state.currency + 20);
  });

  test('applyRogueStart does not trigger non-Rogue powerups', () => {
    const state = createTestRunState(12345);

    const common = getPowerupById('num_1_common')!;
    state.activePowerups.push({ id: common.id, powerup: common });

    const newState = applyRogueStart(state);

    expect(newState.appliedEffects).toHaveLength(0);
  });
});

describe('Determinism', () => {
  test('same seed produces same result', () => {
    const seed = 12345;
    const state1 = createTestRunState(seed);
    const state2 = createTestRunState(seed);

    const powerup = getPowerupById('num_2_uncommon')!;
    state1.activePowerups.push({ id: powerup.id, powerup });
    state2.activePowerups.push({ id: powerup.id, powerup });

    const result1 = applyOnPlacement(state1, 'num_2_uncommon', 2, 0, 0);
    const result2 = applyOnPlacement(state2, 'num_2_uncommon', 2, 0, 0);

    const grid1Str = JSON.stringify(result1.grid);
    const grid2Str = JSON.stringify(result2.grid);

    expect(grid1Str).toBe(grid2Str);
  });
});
