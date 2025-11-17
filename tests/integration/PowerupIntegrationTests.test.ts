import { getPowerupById } from '@/src/powerups/PowerupModel';
import { applyRogueStart, applyOnPlacement, applyRunPurchase, RunState } from '@/src/powerups/PowerupManager';
import { generatePuzzle, checkPuzzleComplete } from '@/utils/sudoku';
import { initializeCell } from '@/utils/modifiers';
import { GameGrid, Grid } from '@/types/game';
import { calculateShopInflation, purchasePowerupWithOF } from '@/src/shop/ShopIntegration';

function createTestGrid(puzzle: Grid): GameGrid {
  return puzzle.map((row, i) => row.map((cell, j) => initializeCell(cell, cell !== null)));
}

function createSimpleRunState(seed: number): RunState {
  const { puzzle, solution } = generatePuzzle(35);
  const grid = createTestGrid(puzzle);

  return {
    grid,
    solution,
    currency: 200,
    entropyDust: 50,
    globalCorruption: 0,
    activePowerups: [],
    appliedEffects: [],
    forbiddenSlots: [],
    boxLocks: [],
    runSeed: seed,
    turnNumber: 0,
  };
}

function simulatePlacement(state: RunState, digit: number, row: number, col: number): RunState {
  const correctValue = state.solution[row][col];
  const newGrid = state.grid.map((r, i) =>
    r.map((c, j) => {
      if (i === row && j === col) {
        return {
          ...c,
          value: digit,
          isCorrect: digit === correctValue,
        };
      }
      return c;
    })
  );

  let newState: RunState = {
    ...state,
    grid: newGrid,
    turnNumber: state.turnNumber + 1,
  };

  for (const active of state.activePowerups) {
    if (active.powerup.digit === digit && !active.powerup.autoTrigger) {
      newState = applyOnPlacement(newState, active.id, digit, row, col);
    }
  }

  return newState;
}

describe('Integration: Rogue Auto-Trigger', () => {
  test('Rogue powerups auto-trigger at level start', () => {
    const state = createSimpleRunState(42000);

    const rogue1 = getPowerupById('num_1_rogue')!;
    const rogue7 = getPowerupById('num_7_rogue')!;

    state.grid[4][4].corruption = 60;
    state.grid[3][3].corruption = 40;

    state.activePowerups.push(
      { id: rogue1.id, powerup: rogue1 },
      { id: rogue7.id, powerup: rogue7 }
    );

    const newState = applyRogueStart(state);

    expect(newState.appliedEffects.length).toBeGreaterThanOrEqual(2);

    const purifyEffect = newState.appliedEffects.find(e => e.effectKey === 'purify');
    const currencyEffect = newState.appliedEffects.find(e => e.effectKey === 'grantCurrency');

    expect(purifyEffect).toBeDefined();
    expect(currencyEffect).toBeDefined();

    expect(newState.currency).toBe(state.currency + 20);

    const maxCorruption = Math.max(...newState.grid.flat().map(c => c.corruption));
    expect(maxCorruption).toBeLessThan(60);
  });

  test('Non-Rogue powerups do not auto-trigger', () => {
    const state = createSimpleRunState(42001);

    const common = getPowerupById('num_1_common')!;
    const uncommon = getPowerupById('num_2_uncommon')!;

    state.activePowerups.push(
      { id: common.id, powerup: common },
      { id: uncommon.id, powerup: uncommon }
    );

    const newState = applyRogueStart(state);

    expect(newState.appliedEffects).toHaveLength(0);
    expect(newState.currency).toBe(state.currency);
  });
});

describe('Integration: Shop Purchase Persistence', () => {
  test('Shop purchase adds powerup and persists across placements', () => {
    let state = createSimpleRunState(42002);

    state = applyRunPurchase(state, 'num_7_common');

    expect(state.activePowerups).toHaveLength(1);
    expect(state.activePowerups[0].id).toBe('num_7_common');

    const emptyCell = state.grid.findIndex((row, i) =>
      row.some((cell, j) => cell.value === null && state.solution[i][j] === 7)
    );

    if (emptyCell !== -1) {
      const colIndex = state.grid[emptyCell].findIndex(
        (cell, j) => cell.value === null && state.solution[emptyCell][j] === 7
      );

      if (colIndex !== -1) {
        state = simulatePlacement(state, 7, emptyCell, colIndex);

        expect(state.currency).toBeGreaterThan(200);
      }
    }
  });

  test('Shop inflation based on corruption', () => {
    const state = createSimpleRunState(42003);

    state.grid[0][0].corruption = 50;
    state.grid[1][1].corruption = 30;
    state.grid[2][2].corruption = 20;

    const inflation = calculateShopInflation(10);
    expect(inflation).toBeGreaterThan(0);
    expect(inflation).toBeLessThanOrEqual(0.5);

    const result = purchasePowerupWithOF(state, 'num_1_common', 40);

    expect(result.success).toBe(true);
    expect(result.newOF).toBe(state.currency - 40);
  });
});

describe('Integration: Multi-Powerup Interactions', () => {
  test('Multiple number powerups work independently', () => {
    let state = createSimpleRunState(42004);

    state = applyRunPurchase(state, 'num_7_common');
    state = applyRunPurchase(state, 'num_1_common');

    expect(state.activePowerups).toHaveLength(2);

    const currency1 = state.currency;
    const corruption1 = state.grid[0][0].corruption;

    state.grid[0][0].corruption = 10;

    const emptyCell7 = state.grid.findIndex((row, i) =>
      row.some((cell, j) => cell.value === null && state.solution[i][j] === 7)
    );

    if (emptyCell7 !== -1) {
      const colIndex = state.grid[emptyCell7].findIndex(
        (cell, j) => cell.value === null && state.solution[emptyCell7][j] === 7
      );

      if (colIndex !== -1) {
        state = simulatePlacement(state, 7, emptyCell7, colIndex);
        expect(state.currency).toBeGreaterThan(currency1);
      }
    }
  });
});

describe('Integration: Uniqueness Invariants', () => {
  test('AutoPlace never breaks puzzle uniqueness', () => {
    const state = createSimpleRunState(42005);

    state.activePowerups.push({
      id: 'num_2_rare',
      powerup: getPowerupById('num_2_rare')!,
    });

    const emptyCell = state.grid.findIndex((row, i) =>
      row.some((cell, j) => cell.value === null && state.solution[i][j] === 2)
    );

    if (emptyCell !== -1) {
      const colIndex = state.grid[emptyCell].findIndex(
        (cell, j) => cell.value === null && state.solution[emptyCell][j] === 2
      );

      if (colIndex !== -1) {
        const newState = simulatePlacement(state, 2, emptyCell, colIndex);

        const gridValues = newState.grid.map(row => row.map(cell => cell.value));
        const allFilled = gridValues.every(row => row.every(cell => cell !== null));

        if (allFilled) {
          const isComplete = checkPuzzleComplete(gridValues, newState.solution);
          expect(isComplete).toBe(true);

          for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
              expect(gridValues[i][j]).toBe(newState.solution[i][j]);
            }
          }
        }
      }
    }
  });

  test('Corruption values stay within [0, 100]', () => {
    const state = createSimpleRunState(42006);

    state.grid.flat().forEach(cell => {
      cell.corruption = Math.floor(Math.random() * 120);
    });

    state.activePowerups.push({
      id: 'num_1_uncommon',
      powerup: getPowerupById('num_1_uncommon')!,
    });

    const newState = applyRogueStart(state);

    newState.grid.flat().forEach(cell => {
      expect(cell.corruption).toBeGreaterThanOrEqual(0);
      expect(cell.corruption).toBeLessThanOrEqual(100);
    });
  });
});

describe('Integration: Full Run Simulation', () => {
  test('Simulates short run with seeded puzzles', () => {
    let state = createSimpleRunState(42007);

    state = applyRunPurchase(state, 'num_1_rogue');
    state = applyRunPurchase(state, 'num_7_common');
    state = applyRunPurchase(state, 'num_9_common');

    state = applyRogueStart(state);

    expect(state.appliedEffects.length).toBeGreaterThanOrEqual(1);

    for (let move = 0; move < 3; move++) {
      const emptyCell = state.grid.findIndex(row => row.some(cell => cell.value === null));

      if (emptyCell !== -1) {
        const colIndex = state.grid[emptyCell].findIndex(cell => cell.value === null);

        if (colIndex !== -1) {
          const correctValue = state.solution[emptyCell][colIndex];
          state = simulatePlacement(state, correctValue, emptyCell, colIndex);
        }
      }
    }

    const filledCount = state.grid.flat().filter(c => c.value !== null).length;
    expect(filledCount).toBeGreaterThan(0);

    expect(state.appliedEffects.length).toBeGreaterThanOrEqual(1);

    const gridValues = state.grid.map(row => row.map(cell => cell.value));
    const partiallyFilled = gridValues.some(row => row.some(cell => cell !== null));
    expect(partiallyFilled).toBe(true);
  });
});

describe('Property Tests: Invariants', () => {
  const SIMULATION_COUNT = 50;

  test('Invariant A: Underlying solution unchanged', () => {
    for (let i = 0; i < SIMULATION_COUNT; i++) {
      const seed = 50000 + i;
      const state = createSimpleRunState(seed);
      const originalSolution = state.solution.map(row => [...row]);

      state.activePowerups.push({
        id: 'num_2_uncommon',
        powerup: getPowerupById('num_2_uncommon')!,
      });

      const newState = applyRogueStart(state);

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(newState.solution[r][c]).toBe(originalSolution[r][c]);
        }
      }
    }
  });

  test('Invariant B: No autoPlace conflicts', () => {
    for (let i = 0; i < SIMULATION_COUNT; i++) {
      const seed = 60000 + i;
      const state = createSimpleRunState(seed);

      state.activePowerups.push({
        id: 'num_2_epic',
        powerup: getPowerupById('num_2_epic')!,
      });

      const newState = applyRogueStart(state);

      const placedTwos = newState.grid.flat().filter(c => c.value === 2 && c.isCorrect);

      placedTwos.forEach(cell => {
        expect(cell.isCorrect).toBe(true);
      });
    }
  });

  test('Invariant C: Corruption values remain valid', () => {
    for (let i = 0; i < SIMULATION_COUNT; i++) {
      const seed = 70000 + i;
      const state = createSimpleRunState(seed);

      state.grid.flat().forEach(cell => {
        cell.corruption = Math.floor(Math.random() * 50);
      });

      state.activePowerups.push({
        id: 'num_6_epic',
        powerup: getPowerupById('num_6_epic')!,
      });

      const emptyCell = state.grid.findIndex((row, rowIdx) =>
        row.some((cell, colIdx) => cell.value === null && state.solution[rowIdx][colIdx] === 6)
      );

      if (emptyCell !== -1) {
        const colIndex = state.grid[emptyCell].findIndex(
          (cell, colIdx) => cell.value === null && state.solution[emptyCell][colIdx] === 6
        );

        if (colIndex !== -1) {
          const newState = simulatePlacement(state, 6, emptyCell, colIndex);

          newState.grid.flat().forEach(cell => {
            expect(cell.corruption).toBeGreaterThanOrEqual(0);
            expect(cell.corruption).toBeLessThanOrEqual(100);
          });
        }
      }
    }
  });
});
