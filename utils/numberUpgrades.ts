import { GameGrid, Grid, Upgrade } from '@/types/game';
import { cleanseCells } from './corruption';
import { getConnectedCells } from './corruption';

export interface UpgradeEffectResult {
  grid: GameGrid;
  corruption?: number;
  currency?: number;
  message?: string;
  chargesUsed?: number;
  shieldActive?: boolean;
  shieldExpiry?: number;
  maxMistakesBonus?: number;
  inflationReduction?: number;
  shieldChargeBonus?: number;
}

interface NumberUpgradeState {
  digit: number;
  activeShield?: number;
  momentumStacks?: number;
  overclockActive?: boolean;
}

const upgradeState: Map<number, NumberUpgradeState> = new Map();

function getUpgradeState(digit: number): NumberUpgradeState {
  if (!upgradeState.has(digit)) {
    upgradeState.set(digit, { digit });
  }
  return upgradeState.get(digit)!;
}

export function applyRogueUpgradesAtStart(
  grid: GameGrid,
  solution: Grid,
  upgrades: Upgrade[],
  currency: number
): { grid: GameGrid; currency: number } {
  let newGrid = grid.map(r => r.map(c => ({ ...c })));
  let newCurrency = currency;

  const rogueUpgrades = upgrades.filter(u => u.rarity === 'rogue');
  console.log('[RogueUpgrades] Applying', rogueUpgrades.length, 'rogue upgrades at start');

  for (const upgrade of rogueUpgrades) {
    console.log('[RogueUpgrade] Triggering:', upgrade.effect);

    switch (upgrade.effect) {
        case 'scout_omniscience': {
        const allOnes = findEmptyCellsForNumber(newGrid, solution, 1);
        for (const [row, col] of allOnes) {
          newGrid[row][col].candidates = [1];
          newGrid[row][col].isFogged = false;
          newGrid[row][col].isHidden = false;
        }
        console.log('[Scout] Revealed all 1s via Omniscience');
        break;
      }

      case 'merchant_monopoly':
        console.log('[Merchant] Monopoly active - immune to inflation');
        break;

      case 'jester_master_flow':
        console.log('[Jester] Master of Flow - immune to all flow disruption');
        break;

      case 'fortress_absolution':
        console.log('[Fortress] Absolution ready');
        break;

      case 'catalyst_overclock':
        getUpgradeState(5).overclockActive = true;
        console.log('[Catalyst] Overclock activated');
        break;

      case 'gambler_reality_warp':
        console.log('[Gambler] Reality Warp ready');
        break;

      case 'sniper_domino':
        console.log('[Sniper] Domino Effect ready');
        break;

      case 'powerhouse_purification':
        newGrid = newGrid.map(row => row.map(cell => ({
          ...cell,
          corruption: 0,
          isFogged: false,
          isHidden: false,
          candidates: [],
          lockTurnsRemaining: 0,
          isLocked: false,
        })));
        console.log('[Powerhouse] Purification - cleansed entire board');
        break;

      case 'finisher_completionist':
        console.log('[Finisher] Completionist ready');
        break;
    }
  }

  return { grid: newGrid, currency: newCurrency };
}

export function applyNumberUpgradeEffect(
  upgrade: Upgrade,
  grid: GameGrid,
  solution: Grid,
  row: number,
  col: number,
  placedNumber: number,
  globalCorruption: number,
  currency: number,
  allUpgrades?: Upgrade[]
): UpgradeEffectResult {
  if (upgrade.number !== placedNumber) {
    return { grid };
  }

  const result: UpgradeEffectResult = { grid };
  const state = getUpgradeState(placedNumber);

  switch (upgrade.effect) {
    case 'scout_find_naked': {
      const nakedSingle = findRandomNakedSingle(grid, solution);
      if (nakedSingle) {
        const [nRow, nCol] = nakedSingle;
        const value = solution[nRow][nCol];
        if (value !== null) {
          result.grid = grid.map((r, i) =>
            r.map((c, j) => {
              if (i === nRow && j === nCol) {
                return { ...c, candidates: [value] };
              }
              return c;
            })
          );
          console.log('[Scout L1] Highlighted naked single at', nRow, nCol);
        }
      } else {
        console.log('[Scout L1] No naked single found');
      }
      break;
    }

    case 'scout_fog_clear': {
      const nakedSingle = findRandomNakedSingle(grid, solution);
      if (nakedSingle) {
        const [nRow, nCol] = nakedSingle;
        const value = solution[nRow][nCol];
        if (value !== null) {
          result.grid = grid.map((r, i) =>
            r.map((c, j) => {
              if (i === nRow && j === nCol) {
                return { ...c, candidates: [value] };
              }
              return c;
            })
          );
        }
      }
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const cells = getBoxCells(boxIndex);
      result.grid = clearFogInCells(result.grid, cells);
      console.log('[Scout L2] Found naked single + cleared fog in box');
      break;
    }

    case 'scout_find_hidden': {
      const hiddenSingle = findRandomHiddenSingle(grid, solution);
      if (hiddenSingle) {
        const [hRow, hCol] = hiddenSingle;
        const value = solution[hRow][hCol];
        if (value !== null) {
          result.grid = grid.map((r, i) =>
            r.map((c, j) => {
              if (i === hRow && j === hCol) {
                return { ...c, candidates: [value] };
              }
              return c;
            })
          );
          console.log('[Scout L3] Highlighted hidden single at', hRow, hCol);
        }
      } else {
        console.log('[Scout L3] No hidden single found');
      }
      break;
    }

    case 'scout_solve_single': {
      const hiddenSingle = findRandomHiddenSingle(grid, solution);
      if (hiddenSingle) {
        const [hRow, hCol] = hiddenSingle;
        result.grid = grid.map((r, i) =>
          r.map((c, j) => {
            if (i === hRow && j === hCol) {
              return {
                ...c,
                value: solution[hRow][hCol],
                isCorrect: true,
                isFixed: false,
              };
            }
            return c;
          })
        );
        console.log('[Scout L4] Solved hidden single at', hRow, hCol);
      } else {
        console.log('[Scout L4] No hidden single found');
      }
      break;
    }

    case 'scout_total_clarity': {
      const hiddenSingle = findRandomHiddenSingle(grid, solution);
      if (hiddenSingle) {
        const [hRow, hCol] = hiddenSingle;
        result.grid = grid.map((r, i) =>
          r.map((c, j) => {
            if (i === hRow && j === hCol) {
              return {
                ...c,
                value: solution[hRow][hCol],
                isCorrect: true,
                isFixed: false,
              };
            }
            return c;
          })
        );
      }
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const cells = getBoxCells(boxIndex);
      result.grid = clearFogInCells(result.grid, cells);
      result.grid = revealHiddenInRow(result.grid, row);
      result.grid = revealHiddenInColumn(result.grid, col);
      console.log('[Scout L5] Total Clarity - solved hidden single + cleared fog + revealed hidden');
      break;
    }
    
    case 'scout_omniscience': {
      const adjacentCells = getAdjacentCells(row, col);
      result.grid = clearFogInCells(grid, adjacentCells);
      result.grid = result.grid.map((r, i) =>
        r.map((c, j) => {
          if (adjacentCells.some(([aRow, aCol]) => aRow === i && aCol === j)) {
            return { ...c, candidates: [] };
          }
          return c;
        })
      );
      console.log('[Scout ROGUE] Omniscience - cleared fog in adjacent cells');
      break;
    }

    case 'merchant_gold_1':
      result.currency = currency + 1;
      console.log('[Merchant L1] +1 gold');
      break;

    case 'merchant_gold_2':
      result.currency = currency + 2;
      console.log('[Merchant L2] +2 gold');
      break;

    case 'merchant_price_check':
      result.currency = currency;
      result.inflationReduction = 2;
      console.log('[Merchant L3] Price Check -2% inflation');
      break;

    case 'merchant_gold_3':
      result.currency = currency + 3;
      console.log('[Merchant L4] +3 gold');
      break;

    case 'merchant_market_crash': {
      const twosPlaced = countNumberOnGrid(grid, 2);
      const totalTwos = countNumberInSolution(solution, 2);
      if (twosPlaced === totalTwos - 1) {
        result.currency = currency + 20;
        result.inflationReduction = 100;
        console.log('[Merchant L5] Market Crash! +20 gold, inflation reset');
      }
      break;
    }

    case 'jester_flow_state':
      console.log('[Jester L1] Flow State - immune to candidate shuffling (passive)');
      break;

    case 'jester_lockpick':
      console.log('[Jester L2] Lockpick - helps break cell locks faster');
      break;

    case 'jester_rule_of_three': {
      const numbersInRow = grid[row].filter(c => c.value !== null).length;
      const numbersInCol = grid.filter(r => r[col].value !== null).length;
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const boxCells = getBoxCells(boxIndex);
      const numbersInBox = boxCells.filter(([r, c]) => grid[r][c].value !== null).length;
      
      if (numbersInRow === 3 || numbersInCol === 3 || numbersInBox === 3) {
        result.currency = currency + 3;
        console.log('[Jester L3] Rule of Three! Placed 3rd - +3 gold');
      }
      break;
    }

    case 'jester_unstoppable':
      result.grid = grid.map(r => r.map(c => ({
        ...c,
        isLocked: false,
        lockTurnsRemaining: 0,
      })));
      console.log('[Jester L4] Unstoppable - instantly broke all cell locks');
      break;

    case 'jester_grand_triplet': {
      const numbersInRow = grid[row].filter(c => c.value !== null).length;
      const numbersInCol = grid.filter(r => r[col].value !== null).length;
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const boxCells = getBoxCells(boxIndex);
      const numbersInBox = boxCells.filter(([r, c]) => grid[r][c].value !== null).length;
      
      if (numbersInRow === 3 || numbersInCol === 3 || numbersInBox === 3) {
        result.currency = currency + 6;
        console.log('[Jester L5] Grand Triplet! Placed 3rd - +6 gold');
      }
      break;
    }

    case 'jester_master_flow': {
      const hasMasterFlow = allUpgrades?.some(u => u.effect === 'jester_master_flow');
      if (hasMasterFlow) {
        result.currency = currency + 6;
        console.log('[Jester ROGUE] Master of Flow - always triggers Grand Triplet +6 gold');
      }
      break;
    }

    case 'fortress_reinforce':
      result.maxMistakesBonus = 1;
      console.log('[Fortress L1] Reinforce +1 mistake buffer');
      break;

    case 'fortress_shield_charge':
      result.shieldChargeBonus = 1;
      console.log('[Fortress L2] Shield Charge +1 charge');
      break;

    case 'fortress_fortify':
      result.maxMistakesBonus = 2;
      console.log('[Fortress L3] Fortify +2 mistake buffer');
      break;

    case 'fortress_armory':
      console.log('[Fortress L4] Armory - max shield charges increased (passive)');
      break;

    case 'fortress_bastion':
      console.log('[Fortress L5] Bastion - start with shield charge (passive)');
      break;

    case 'catalyst_ignite':
    case 'catalyst_synergy':
    case 'catalyst_potency':
    case 'catalyst_catalyze':
    case 'catalyst_fusion':
      console.log(`[Catalyst] ${upgrade.effect} - triggers other abilities`);
      break;

    case 'gambler_fifty_fifty':
      if (Math.random() < 0.5) {
        result.currency = currency + 4;
        console.log('[Gambler L1] Won 50/50! +4 gold');
      } else {
        console.log('[Gambler L1] Lost 50/50');
      }
      break;

    case 'gambler_hedge':
    case 'gambler_tip_odds':
    case 'gambler_safe_bet':
    case 'gambler_all_in':
      console.log(`[Gambler] ${upgrade.effect} - passive protection`);
      break;

    case 'sniper_reroll_1':
    case 'sniper_reroll_2':
      console.log(`[Sniper] ${upgrade.effect} - extra shop rerolls`);
      break;

    case 'sniper_focus_fire': {
      const hiddenSingle = findRandomHiddenSingle(grid, solution);
      if (hiddenSingle) {
        const [hRow, hCol] = hiddenSingle;
        const value = solution[hRow][hCol];
        if (value !== null) {
          result.grid = grid.map((r, i) =>
            r.map((c, j) => {
              if (i === hRow && j === hCol) {
                return { ...c, candidates: [value] };
              }
              return c;
            })
          );
          console.log('[Sniper L2] Highlighted hidden single');
        }
      }
      break;
    }

    case 'sniper_takedown': {
      const hiddenSingle = findRandomHiddenSingle(grid, solution);
      if (hiddenSingle) {
        const [hRow, hCol] = hiddenSingle;
        result.grid = grid.map((r, i) =>
          r.map((c, j) => {
            if (i === hRow && j === hCol) {
              return {
                ...c,
                value: solution[hRow][hCol],
                isCorrect: true,
              };
            }
            return c;
          })
        );
        console.log('[Sniper L3] Solved hidden single');
      }
      break;
    }

    case 'sniper_chain_shot': {
      const randomDigit = Math.floor(Math.random() * 9) + 1;
      const hiddenSingles = findAllHiddenSinglesForDigit(grid, solution, randomDigit);
      result.grid = grid.map((r, i) =>
        r.map((c, j) => {
          if (hiddenSingles.some(([hr, hc]) => hr === i && hc === j)) {
            return {
              ...c,
              value: solution[i][j],
              isCorrect: true,
            };
          }
          return c;
        })
      );
      console.log(`[Sniper L5] Chain Shot - solved all ${randomDigit}s`);
      break;
    }

    case 'powerhouse_cleanse_box': {
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const cells = getBoxCells(boxIndex);
      result.grid = cleanseCorruptionInCells(grid, cells, 1);
      console.log('[Powerhouse L1] Cleansed 1 cell in box');
      break;
    }

    case 'powerhouse_purge_box': {
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const cells = getBoxCells(boxIndex);
      result.grid = cleanseCorruptionInCells(grid, cells, 999);
      console.log('[Powerhouse L2] Purged all corruption in box');
      break;
    }

    case 'powerhouse_purge_rowcol': {
      result.grid = cleanseRow(grid, row);
      result.grid = cleanseColumn(result.grid, col);
      console.log('[Powerhouse L3] Purged row and column');
      break;
    }

    case 'powerhouse_firewall': {
      result.grid = cleanseRow(grid, row);
      result.grid = cleanseColumn(result.grid, col);
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const cells = getBoxCells(boxIndex);
      result.grid = cleanseCorruptionInCells(result.grid, cells, 999);
      console.log('[Powerhouse L4] Firewall - cleansed with immunity');
      break;
    }

    case 'powerhouse_system_restore': {
      result.grid = cleanseRow(grid, row);
      result.grid = cleanseColumn(result.grid, col);
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const cells = getBoxCells(boxIndex);
      result.grid = cleanseCorruptionInCells(result.grid, cells, 999);
      console.log('[Powerhouse L5] System Restore');
      break;
    }

    case 'finisher_box_bonus': {
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      if (isBoxComplete(grid, boxIndex)) {
        result.currency = currency + 3;
        console.log('[Finisher L1] Box completed! +3 gold');
      }
      break;
    }

    case 'finisher_line_bonus': {
      if (isRowComplete(grid, row)) {
        result.currency = currency + 5;
        console.log('[Finisher L2] Row completed! +5 gold');
      } else if (isColumnComplete(grid, col)) {
        result.currency = currency + 5;
        console.log('[Finisher L2] Column completed! +5 gold');
      }
      break;
    }

    case 'finisher_momentum':
      state.momentumStacks = (state.momentumStacks || 0) + 1;
      console.log(`[Finisher L3] Momentum stack ${state.momentumStacks}`);
      break;

    case 'finisher_jackpot': {
      const ninesPlaced = countNumberOnGrid(grid, 9);
      const totalNines = countNumberInSolution(solution, 9);
      if (ninesPlaced === totalNines - 1) {
        result.currency = currency + 50;
        console.log('[Finisher L4] Jackpot! +50 gold');
      }
      break;
    }

    case 'finisher_head_start':
      console.log('[Finisher L5] Head Start - bonus in next shop');
      break;
  }

  return result;
}

function clearFogInCells(grid: GameGrid, cells: [number, number][]): GameGrid {
  return grid.map((r, i) =>
    r.map((c, j) => {
      if (cells.some(([row, col]) => row === i && col === j)) {
        return { ...c, isFogged: false };
      }
      return c;
    })
  );
}

function clearFogInRow(grid: GameGrid, row: number): GameGrid {
  return grid.map((r, i) =>
    r.map((c, j) => {
      if (i === row) {
        return { ...c, isFogged: false };
      }
      return c;
    })
  );
}

function clearFogInColumn(grid: GameGrid, col: number): GameGrid {
  return grid.map((r, i) =>
    r.map((c, j) => {
      if (j === col) {
        return { ...c, isFogged: false };
      }
      return c;
    })
  );
}

function revealHiddenInRow(grid: GameGrid, row: number): GameGrid {
  return grid.map((r, i) =>
    r.map((c, j) => {
      if (i === row) {
        return { ...c, isHidden: false };
      }
      return c;
    })
  );
}

function revealHiddenInColumn(grid: GameGrid, col: number): GameGrid {
  return grid.map((r, i) =>
    r.map((c, j) => {
      if (j === col) {
        return { ...c, isHidden: false };
      }
      return c;
    })
  );
}

function removePhantomCandidatesInCells(
  grid: GameGrid,
  solution: Grid,
  cells: [number, number][]
): GameGrid {
  return grid.map((r, i) =>
    r.map((c, j) => {
      if (cells.some(([row, col]) => row === i && col === j)) {
        const correctValue = solution[i][j];
        return {
          ...c,
          candidates: c.candidates.filter(v => v === correctValue),
        };
      }
      return c;
    })
  );
}

function cleanseCorruptionInCells(
  grid: GameGrid,
  cells: [number, number][],
  maxCells: number
): GameGrid {
  const corruptedCells = cells
    .map(([row, col]) => ({ row, col, corruption: grid[row][col].corruption }))
    .filter(c => c.corruption > 0)
    .sort((a, b) => b.corruption - a.corruption)
    .slice(0, maxCells);

  return grid.map((r, i) =>
    r.map((c, j) => {
      if (corruptedCells.some(({ row, col }) => row === i && col === j)) {
        return {
          ...c,
          corruption: 0,
          isFogged: false,
          isHidden: false,
        };
      }
      return c;
    })
  );
}

function cleanseRow(grid: GameGrid, row: number): GameGrid {
  return grid.map((r, i) =>
    r.map((c, j) => {
      if (i === row) {
        return {
          ...c,
          corruption: 0,
          isFogged: false,
          isHidden: false,
        };
      }
      return c;
    })
  );
}

function cleanseColumn(grid: GameGrid, col: number): GameGrid {
  return grid.map((r, i) =>
    r.map((c, j) => {
      if (j === col) {
        return {
          ...c,
          corruption: 0,
          isFogged: false,
          isHidden: false,
        };
      }
      return c;
    })
  );
}

function countNumberInRow(grid: GameGrid, row: number, num: number): number {
  return grid[row].filter(c => c.value === num).length;
}

function countNumberInColumn(grid: GameGrid, col: number, num: number): number {
  return grid.filter(r => r[col].value === num).length;
}

function countNumberInBox(grid: GameGrid, boxIndex: number, num: number): number {
  const cells = getBoxCells(boxIndex);
  return cells.filter(([row, col]) => grid[row][col].value === num).length;
}

function countNumberOnGrid(grid: GameGrid, num: number): number {
  let count = 0;
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j].value === num) count++;
    }
  }
  return count;
}

function countNumberInSolution(solution: Grid, num: number): number {
  let count = 0;
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (solution[i][j] === num) count++;
    }
  }
  return count;
}

function isBoxComplete(grid: GameGrid, boxIndex: number): boolean {
  const cells = getBoxCells(boxIndex);
  return cells.every(([row, col]) => grid[row][col].value !== null);
}

function isRowComplete(grid: GameGrid, row: number): boolean {
  return grid[row].every(c => c.value !== null);
}

function isColumnComplete(grid: GameGrid, col: number): boolean {
  return grid.every(r => r[col].value !== null);
}

function findRandomHiddenSingle(grid: GameGrid, solution: Grid): [number, number] | null {
  const candidates: [number, number][] = [];
  
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j].value === null && !grid[i][j].isFixed) {
        const canPlace = isOnlyPlaceInUnit(grid, solution, i, j);
        if (canPlace) {
          candidates.push([i, j]);
        }
      }
    }
  }
  
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function findAllHiddenSinglesForDigit(
  grid: GameGrid,
  solution: Grid,
  digit: number
): [number, number][] {
  const singles: [number, number][] = [];
  
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j].value === null && solution[i][j] === digit && !grid[i][j].isFixed) {
        const canPlace = isOnlyPlaceInUnit(grid, solution, i, j);
        if (canPlace) {
          singles.push([i, j]);
        }
      }
    }
  }
  
  return singles;
}

function isOnlyPlaceInUnit(grid: GameGrid, solution: Grid, row: number, col: number): boolean {
  const digit = solution[row][col];
  
  const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  const boxCells = getBoxCells(boxIndex);
  const emptyInBox = boxCells.filter(
    ([r, c]) => grid[r][c].value === null && solution[r][c] === digit
  );
  
  if (emptyInBox.length === 1 && emptyInBox[0][0] === row && emptyInBox[0][1] === col) {
    return true;
  }
  
  return false;
}

function findEmptyCellsForNumber(grid: GameGrid, solution: Grid, number: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j].value === null && solution[i][j] === number && !grid[i][j].isFixed) {
        cells.push([i, j]);
      }
    }
  }
  return cells;
}

function findRandomNakedSingle(grid: GameGrid, solution: Grid): [number, number] | null {
  const candidates: [number, number][] = [];
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col].value === null && !grid[row][col].isFixed) {
        if (isNakedSingle(grid, solution, row, col)) {
          candidates.push([row, col]);
        }
      }
    }
  }
  
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function isNakedSingle(grid: GameGrid, solution: Grid, row: number, col: number): boolean {
  const digit = solution[row][col];
  if (digit === null) return false;
  
  const numbersInRow: Set<number> = new Set();
  const numbersInCol: Set<number> = new Set();
  const numbersInBox: Set<number> = new Set();
  
  for (let i = 0; i < 9; i++) {
    if (grid[row][i].value !== null) {
      numbersInRow.add(grid[row][i].value!);
    }
    if (grid[i][col].value !== null) {
      numbersInCol.add(grid[i][col].value!);
    }
  }
  
  const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  const boxCells = getBoxCells(boxIndex);
  for (const [r, c] of boxCells) {
    if (grid[r][c].value !== null) {
      numbersInBox.add(grid[r][c].value!);
    }
  }
  
  const allNumbers: Set<number> = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const num of numbersInRow) allNumbers.delete(num);
  for (const num of numbersInCol) allNumbers.delete(num);
  for (const num of numbersInBox) allNumbers.delete(num);
  
  return allNumbers.size === 1 && allNumbers.has(digit);
}

function getAdjacentCells(row: number, col: number): [number, number][] {
  const adjacent: [number, number][] = [];
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];
  
  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
      adjacent.push([newRow, newCol]);
    }
  }
  
  return adjacent;
}

function getBoxCells(boxIndex: number): [number, number][] {
  const cells: [number, number][] = [];
  const startRow = Math.floor(boxIndex / 3) * 3;
  const startCol = (boxIndex % 3) * 3;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      cells.push([startRow + i, startCol + j]);
    }
  }
  return cells;
}
