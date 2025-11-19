import { GameGrid, Grid, Upgrade } from '@/types/game';

export interface UpgradeEffectResult {
  grid: GameGrid;
  corruption?: number;
  currency?: number;
  message?: string;
  chargesUsed?: number;
  shieldActive?: boolean;
  maxMistakesBonus?: number;
  inflationReduction?: number;
}

interface NumberUpgradeState {
  digit: number;
  momentumStacks?: number;
  onesRevealed?: boolean;
  shieldCharges?: number;
  maxShieldCharges?: number;
  realityWarpUsed?: boolean;
  purificationUsed?: number;
}

const upgradeState: Map<number, NumberUpgradeState> = new Map();

function getUpgradeState(digit: number): NumberUpgradeState {
  if (!upgradeState.has(digit)) {
    upgradeState.set(digit, { digit });
  }
  return upgradeState.get(digit)!;
}

export function resetUpgradeState(): void {
  upgradeState.clear();
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
      case 'scout_omniscience':
        console.log('[Scout] Omniscience active - will reveal ones on first placement');
        break;

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
        console.log('[Catalyst] Overclock activated - all numbers +1 level');
        break;

      case 'gambler_reality_warp':
        console.log('[Gambler] Reality Warp ready');
        break;

      case 'sniper_domino':
        console.log('[Sniper] Domino Effect ready');
        break;

      case 'powerhouse_purification':
        console.log('[Powerhouse] Purification ready - can be used once');
        getUpgradeState(8).purificationUsed = 0;
        break;

      case 'finisher_completionist':
        console.log('[Finisher] Completionist ready');
        break;
    }
  }

  return { grid: newGrid, currency: newCurrency };
}

function getEffectiveLevel(
  placedNumber: number,
  effect: string,
  allUpgrades: Upgrade[]
): number {
  const hasOverclock = allUpgrades.some(u => u.effect === 'catalyst_overclock');
  
  const effectLevel = effect.includes('_l1') ? 1 :
                     effect.includes('_l2') ? 2 :
                     effect.includes('_l3') ? 3 :
                     effect.includes('_l4') ? 4 :
                     effect.includes('_l5') ? 5 : 0;
  
  if (hasOverclock && placedNumber !== 5) {
    return Math.min(effectLevel + 1, 5);
  }
  
  return effectLevel;
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
  const effectiveLevel = getEffectiveLevel(placedNumber, upgrade.effect, allUpgrades || []);

  console.log(`[NumberUpgrade] ${upgrade.name} (effective level: ${effectiveLevel})`);

  switch (upgrade.effect) {
    case 'scout_clear_box_fog': {
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const cells = getBoxCells(boxIndex);
      result.grid = clearFogInCells(grid, cells);
      console.log('[Scout L1] Cleared fog in 3x3 box');
      break;
    }

    case 'scout_clear_rowcol_fog': {
      result.grid = clearFogInRow(grid, row);
      result.grid = clearFogInColumn(result.grid, col);
      console.log('[Scout L2] Cleared fog in row and column');
      break;
    }

    case 'scout_remove_phantoms': {
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const cells = getBoxCells(boxIndex);
      result.grid = removePhantomCandidatesInCells(grid, solution, cells);
      console.log('[Scout L3] Removed phantom candidates from box');
      break;
    }

    case 'scout_clarity': {
      result.grid = revealHiddenInRow(grid, row);
      result.grid = revealHiddenInColumn(result.grid, col);
      console.log('[Scout L4] Revealed hidden numbers in row and column');
      break;
    }

    case 'scout_total_clarity': {
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const cells = getBoxCells(boxIndex);
      result.grid = clearFogInCells(grid, cells);
      result.grid = clearFogInRow(result.grid, row);
      result.grid = clearFogInColumn(result.grid, col);
      result.grid = removePhantomCandidatesInCells(result.grid, solution, cells);
      result.grid = revealHiddenInRow(result.grid, row);
      result.grid = revealHiddenInColumn(result.grid, col);
      console.log('[Scout L5] Total Clarity - all effects triggered');
      break;
    }
    
    case 'scout_omniscience': {
      if (!state.onesRevealed) {
        result.grid = grid.map((r, i) =>
          r.map((c, j) => {
            if (solution[i][j] === 1 && !c.isFixed) {
              return { ...c, value: 1, isCorrect: true, isFixed: false };
            }
            return c;
          })
        );
        state.onesRevealed = true;
        console.log('[Scout ROGUE] Omniscience - revealed all 1s on the board');
      }
      const adjacentCells = getAdjacentCells(row, col);
      result.grid = clearFogInCells(result.grid, adjacentCells);
      console.log('[Scout ROGUE] Cleared fog in adjacent cells');
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

    case 'jester_trio': {
      const threesInRow = countNumberInRow(grid, row, 3);
      const bonus = threesInRow - 1;
      if (bonus > 0) {
        result.currency = currency + bonus;
        console.log(`[Jester L1] Trio: +${bonus} gold`);
      }
      break;
    }

    case 'jester_trio_plus': {
      const threesInRow = countNumberInRow(grid, row, 3);
      const threesInCol = countNumberInColumn(grid, col, 3);
      const bonus = (threesInRow - 1) + (threesInCol - 1);
      if (bonus > 0) {
        result.currency = currency + bonus;
        console.log(`[Jester L2] Trio+: +${bonus} gold`);
      }
      break;
    }

    case 'jester_flow_state':
      console.log('[Jester L3] Flow State - immune to candidate shuffling (passive)');
      break;

    case 'jester_unstoppable':
      result.grid = grid.map(r => r.map(c => ({
        ...c,
        isLocked: false,
        lockTurnsRemaining: 0,
      })));
      console.log('[Jester L4] Unstoppable - instantly broke all cell locks');
      break;

    case 'jester_full_house': {
      const threesInRow = countNumberInRow(grid, row, 3);
      const threesInCol = countNumberInColumn(grid, col, 3);
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const threesInBox = countNumberInBox(grid, boxIndex, 3);
      const bonus = (threesInRow - 1) + (threesInCol - 1) + (threesInBox - 1);
      if (bonus > 0) {
        result.currency = currency + bonus;
        console.log(`[Jester L5] Full House: +${bonus} gold`);
      }
      break;
    }

    case 'jester_master_flow': {
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
        console.log('[Jester ROGUE] Master of Flow - triggered Takedown');
      }
      break;
    }

    case 'fortress_hp_1':
      result.maxMistakesBonus = 1;
      console.log('[Fortress L1] +1 mistake buffer');
      break;

    case 'fortress_shield': {
      const hasL4 = allUpgrades?.some(u => u.number === 4 && u.effect === 'fortress_reinforce');
      const shieldValue = hasL4 ? 2 : 1;
      console.log(`[Fortress L2] Shield granted (blocks ${shieldValue} mistakes)`);
      break;
    }

    case 'fortress_hp_2':
      result.maxMistakesBonus = 2;
      console.log('[Fortress L3] +2 mistake buffer (total)');
      break;

    case 'fortress_reinforce':
      console.log('[Fortress L4] Reinforce - shield now blocks 2 mistakes');
      break;

    case 'fortress_start_shield':
      console.log('[Fortress L5] Bastion - start with shield (passive)');
      break;

    case 'catalyst_ignite':
    case 'catalyst_synergy':
    case 'catalyst_potency':
    case 'catalyst_catalyze':
    case 'catalyst_fusion':
      console.log(`[Catalyst] ${upgrade.effect} will trigger other abilities`);
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

    case 'gambler_reality_warp':
      console.log('[Gambler ROGUE] Reality Warp - once per puzzle (passive)');
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
          const hasNumberUpgrade = allUpgrades?.some(
            u => u.type === 'number' && u.number === value
          );
          result.grid = grid.map((r, i) =>
            r.map((c, j) => {
              if (i === hRow && j === hCol) {
                if (hasNumberUpgrade) {
                  return { ...c, candidates: [value] };
                } else {
                  return { ...c, isFogged: false };
                }
              }
              return c;
            })
          );
          console.log('[Sniper L2] Focus Fire - highlighted hidden single');
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
        console.log('[Sniper L3] Takedown - solved hidden single');
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

    case 'sniper_domino': {
      console.log('[Sniper ROGUE] Domino Effect ready (implemented in chain)');
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
      
      const scoutUpgrades = (allUpgrades || []).filter(u => u.number === 1);
      for (const scoutUpgrade of scoutUpgrades) {
        const scoutResult = applyNumberUpgradeEffect(
          scoutUpgrade,
          result.grid,
          solution,
          row,
          col,
          1,
          globalCorruption,
          currency,
          allUpgrades
        );
        result.grid = scoutResult.grid;
      }
      
      console.log('[Powerhouse L5] System Restore - triggered Scout effects');
      break;
    }

    case 'powerhouse_purification': {
      const purificationState = getUpgradeState(8);
      if (purificationState.purificationUsed === 0) {
        result.grid = grid.map(r => r.map(c => ({
          ...c,
          corruption: 0,
          isFogged: false,
          candidates: [],
          lockTurnsRemaining: 0,
          isLocked: false,
        })));
        purificationState.purificationUsed = 1;
        console.log('[Powerhouse ROGUE] Purification - cleansed entire board');
      } else {
        console.log('[Powerhouse ROGUE] Purification already used this puzzle');
      }
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
      console.log(`[Finisher L3] Momentum stack ${state.momentumStacks} (+${state.momentumStacks}% gold)`);
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
      console.log('[Finisher L5] Head Start - bonus in next shop (passive)');
      break;

    case 'finisher_completionist':
      console.log('[Finisher ROGUE] Completionist ready (passive)');
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
