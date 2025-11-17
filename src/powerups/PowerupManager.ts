import { Powerup, PowerupParams, getPowerupById, getAutoTriggerPowerups } from './PowerupModel';
import { GameGrid, Grid } from '@/types/game';
import { cleanseCells, getConnectedCells } from '@/utils/corruption';
import { checkPuzzleComplete } from '@/utils/sudoku';

export interface RunState {
  grid: GameGrid;
  solution: Grid;
  currency: number;
  entropyDust: number;
  globalCorruption: number;
  activePowerups: ActivePowerup[];
  appliedEffects: AppliedEffect[];
  forbiddenSlots: ForbiddenSlot[];
  boxLocks: BoxLock[];
  runSeed: number;
  turnNumber: number;
}

export interface ActivePowerup {
  id: string;
  powerup: Powerup;
  chargesRemaining?: number;
  durationRemaining?: number;
}

export interface AppliedEffect {
  powerupId: string;
  effectKey: string;
  turnNumber: number;
  beforeStateHash: string;
  afterStateHash: string;
  metadata: any;
}

export interface ForbiddenSlot {
  row: number;
  col: number;
  digit: number;
}

export interface BoxLock {
  boxIndex: number;
  durationMoves: number;
  affectRow?: boolean;
  rowIndex?: number;
}

export interface PowerupApplicationResult {
  grid: GameGrid;
  currency?: number;
  corruption?: number;
  appliedEffects: AppliedEffect[];
  forbiddenSlots?: ForbiddenSlot[];
  boxLocks?: BoxLock[];
  message?: string;
  fallback?: boolean;
}

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

function computeStateHash(grid: GameGrid): string {
  let hash = 0;
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const cell = grid[i][j];
      hash = ((hash << 5) - hash + (cell.value || 0) + cell.corruption) | 0;
    }
  }
  return hash.toString(36);
}

function getBoxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
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

function findEmptyCellsForNumber(
  grid: GameGrid,
  solution: Grid,
  number: number,
  rng: SeededRandom
): [number, number][] {
  const cells: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j].value === null && solution[i][j] === number && !grid[i][j].isFixed) {
        cells.push([i, j]);
      }
    }
  }
  return rng.shuffle(cells);
}

function checkUniquenessAfterAutoPlace(
  grid: GameGrid,
  solution: Grid,
  placements: [number, number, number][]
): boolean {
  const testGrid: Grid = grid.map(row => row.map(cell => cell.value));
  
  for (const [row, col, value] of placements) {
    testGrid[row][col] = value;
  }
  
  const isComplete = checkPuzzleComplete(testGrid, solution);
  if (!isComplete) {
    return true;
  }
  
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (testGrid[i][j] !== solution[i][j]) {
        console.log('[PowerupManager] Uniqueness check failed: mismatch at', i, j);
        return false;
      }
    }
  }
  
  return true;
}

function applyPurify(
  grid: GameGrid,
  params: PowerupParams,
  row?: number,
  col?: number
): GameGrid {
  let newGrid = grid.map(r => r.map(c => ({ ...c })));
  
  const scope = params.scope || 'row';
  const amount = params.amount || 0;
  const cells = params.cells;
  
  if (scope === 'row' && row !== undefined) {
    if (cells === 'all') {
      for (let j = 0; j < 9; j++) {
        newGrid[row][j].corruption = 0;
        newGrid[row][j].isFogged = false;
        newGrid[row][j].isHidden = false;
      }
    } else if (typeof cells === 'number') {
      const corruptedInRow = newGrid[row]
        .map((cell, col) => ({ cell, col, corruption: cell.corruption }))
        .filter(c => c.corruption > 0)
        .sort((a, b) => b.corruption - a.corruption)
        .slice(0, cells);
      
      for (const { col } of corruptedInRow) {
        newGrid[row][col].corruption = 0;
        newGrid[row][col].isFogged = false;
        newGrid[row][col].isHidden = false;
      }
    } else if (amount > 0) {
      for (let j = 0; j < 9; j++) {
        if (newGrid[row][j].corruption > 0) {
          newGrid[row][j].corruption = Math.max(0, newGrid[row][j].corruption - amount);
        }
      }
    }
  } else if (scope === 'rowcol' && row !== undefined && col !== undefined) {
    for (let j = 0; j < 9; j++) {
      newGrid[row][j].corruption = 0;
      newGrid[row][j].isFogged = false;
      newGrid[row][j].isHidden = false;
    }
    for (let i = 0; i < 9; i++) {
      newGrid[i][col].corruption = 0;
      newGrid[i][col].isFogged = false;
      newGrid[i][col].isHidden = false;
    }
  } else if (scope === 'global' && typeof cells === 'number') {
    newGrid = cleanseCells(newGrid, cells);
  }
  
  return newGrid;
}

function applyAutoPlace(
  grid: GameGrid,
  solution: Grid,
  params: PowerupParams,
  rng: SeededRandom
): { grid: GameGrid; fallback: boolean } {
  const digit = params.digit || 2;
  const count = params.count || 1;
  
  const emptyCells = findEmptyCellsForNumber(grid, solution, digit, rng);
  const selected = emptyCells.slice(0, count);
  
  if (selected.length === 0) {
    console.log('[PowerupManager] No empty cells for autoPlace, skipping');
    return { grid, fallback: false };
  }
  
  const placements: [number, number, number][] = selected.map(([row, col]) => [row, col, digit]);
  
  const isUnique = checkUniquenessAfterAutoPlace(grid, solution, placements);
  if (!isUnique) {
    console.warn('[PowerupManager] AutoPlace would break uniqueness, fallback to revealCandidate');
    return { grid: applyRevealCandidate(grid, solution, { digit, count }, rng), fallback: true };
  }
  
  const newGrid = grid.map(r => r.map(c => ({ ...c })));
  for (const [row, col] of selected) {
    newGrid[row][col].value = digit;
    newGrid[row][col].isCorrect = true;
  }
  
  console.log(`[PowerupManager] AutoPlaced ${selected.length} cells for digit ${digit}`);
  return { grid: newGrid, fallback: false };
}

function applyRevealCandidate(
  grid: GameGrid,
  solution: Grid,
  params: PowerupParams,
  rng: SeededRandom
): GameGrid {
  const digit = params.digit || 2;
  const count = params.count || 1;
  
  const emptyCells = findEmptyCellsForNumber(grid, solution, digit, rng);
  const selected = emptyCells.slice(0, count);
  
  const newGrid = grid.map(r => r.map(c => ({ ...c })));
  for (const [row, col] of selected) {
    newGrid[row][col].candidates = [solution[row][col]];
  }
  
  return newGrid;
}

function applyLockBox(
  grid: GameGrid,
  params: PowerupParams,
  row?: number,
  col?: number
): { grid: GameGrid; boxLocks: BoxLock[] } {
  const newGrid = grid.map(r => r.map(c => ({ ...c })));
  const boxLocks: BoxLock[] = [];
  
  if (params.boxLock && row !== undefined && col !== undefined) {
    const boxIndex = getBoxIndex(row, col);
    const duration = params.durationMoves || 1;
    const cells = getBoxCells(boxIndex);
    
    for (const [r, c] of cells) {
      newGrid[r][c].lockTurnsRemaining = Math.max(newGrid[r][c].lockTurnsRemaining, duration);
    }
    
    const lock: BoxLock = { boxIndex, durationMoves: duration };
    
    if (params.affectRow) {
      lock.affectRow = true;
      lock.rowIndex = row;
      for (let j = 0; j < 9; j++) {
        newGrid[row][j].lockTurnsRemaining = Math.max(newGrid[row][j].lockTurnsRemaining, duration);
      }
    }
    
    boxLocks.push(lock);
    console.log(`[PowerupManager] Locked box ${boxIndex} for ${duration} moves`);
  } else if (params.boxEffect === 'slowSpread' && row !== undefined && col !== undefined) {
    const boxIndex = getBoxIndex(row, col);
    const cells = getBoxCells(boxIndex);
    const amountPct = params.amountPct || 10;
    
    for (const [r, c] of cells) {
      if (newGrid[r][c].corruption > 0) {
        newGrid[r][c].corruption = Math.max(
          0,
          Math.floor(newGrid[r][c].corruption * (1 - amountPct / 100))
        );
      }
    }
  }
  
  return { grid: newGrid, boxLocks };
}

function applyForbidSlots(
  grid: GameGrid,
  solution: Grid,
  params: PowerupParams,
  digit: number,
  rng: SeededRandom
): { grid: GameGrid; forbiddenSlots: ForbiddenSlot[] } {
  const count = params.count || 1;
  const forbiddenSlots: ForbiddenSlot[] = [];
  
  const incorrectCells: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j].value === null && solution[i][j] !== digit && !grid[i][j].isFixed) {
        incorrectCells.push([i, j]);
      }
    }
  }
  
  const shuffled = rng.shuffle(incorrectCells);
  const selected = shuffled.slice(0, count);
  
  for (const [row, col] of selected) {
    forbiddenSlots.push({ row, col, digit });
  }
  
  console.log(`[PowerupManager] Marked ${forbiddenSlots.length} forbidden slots for digit ${digit}`);
  return { grid, forbiddenSlots };
}

function applyResolveAmbiguity(
  grid: GameGrid,
  solution: Grid,
  params: PowerupParams,
  row?: number,
  col?: number,
  rng?: SeededRandom
): GameGrid {
  const scope = params.scope || 'row';
  const count = params.count || 1;
  const newGrid = grid.map(r => r.map(c => ({ ...c })));
  
  let candidates: [number, number][] = [];
  
  if (scope === 'row' && row !== undefined) {
    for (let j = 0; j < 9; j++) {
      if (newGrid[row][j].value === null && !newGrid[row][j].isFixed) {
        candidates.push([row, j]);
      }
    }
  } else if (scope === 'col' && col !== undefined) {
    for (let i = 0; i < 9; i++) {
      if (newGrid[i][col].value === null && !newGrid[i][col].isFixed) {
        candidates.push([i, col]);
      }
    }
  } else if (scope === 'global') {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (newGrid[i][j].value === null && newGrid[i][j].isAmbiguous && !newGrid[i][j].isFixed) {
          candidates.push([i, j]);
        }
      }
    }
  }
  
  if (rng && candidates.length > 0) {
    candidates = rng.shuffle(candidates);
  }
  
  const selected = candidates.slice(0, count);
  
  for (const [r, c] of selected) {
    newGrid[r][c].value = solution[r][c];
    newGrid[r][c].isCorrect = true;
    newGrid[r][c].isAmbiguous = false;
  }
  
  console.log(`[PowerupManager] Resolved ${selected.length} ambiguous cells`);
  return newGrid;
}

function applyCleanAnywhere(
  grid: GameGrid,
  params: PowerupParams,
  row?: number,
  col?: number
): GameGrid {
  let newGrid = grid;
  
  if (params.amount) {
    const nearby = row !== undefined && col !== undefined ? getConnectedCells(row, col) : [];
    for (const [r, c] of nearby) {
      if (newGrid[r][c].corruption > 0) {
        newGrid = newGrid.map((rr, i) =>
          rr.map((cell, j) => {
            if (i === r && j === c) {
              return { ...cell, corruption: Math.max(0, cell.corruption - params.amount!) };
            }
            return cell;
          })
        );
      }
    }
  }
  
  if (params.cells) {
    newGrid = cleanseCells(newGrid, params.cells);
  }
  
  return newGrid;
}

function applyGrantCurrency(
  currency: number,
  params: PowerupParams,
  grid?: GameGrid
): { currency: number; grid?: GameGrid } {
  const amount = params.amount || 0;
  let newCurrency = currency + amount;
  let newGrid = grid;
  
  if (params.cleanCell && grid) {
    newGrid = cleanseCells(grid, params.cleanCell);
  }
  
  console.log(`[PowerupManager] Granted ${amount} OF, new currency: ${newCurrency}`);
  return { currency: newCurrency, grid: newGrid };
}

function applyClearPhantom(grid: GameGrid, solution: Grid, params: PowerupParams): GameGrid {
  const phantomCount = params.phantomCount || 1;
  
  const corruptedCells: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j].corruption > 0 && grid[i][j].candidates.length > 0) {
        corruptedCells.push([i, j]);
      }
    }
  }
  
  const selected = corruptedCells.slice(0, phantomCount);
  const newGrid = grid.map(r => r.map(c => ({ ...c })));
  
  for (const [row, col] of selected) {
    const correctValue = solution[row][col];
    newGrid[row][col].candidates = newGrid[row][col].candidates.filter(
      c => c === correctValue || Math.random() < 0.5
    );
  }
  
  console.log(`[PowerupManager] Cleared phantom candidates from ${selected.length} cells`);
  return newGrid;
}

export function applyRogueStart(runState: RunState): RunState {
  const rogueUpgrades = runState.activePowerups.filter(p => p.powerup.autoTrigger);
  if (rogueUpgrades.length === 0) {
    return runState;
  }
  
  console.log(`[PowerupManager] Applying ${rogueUpgrades.length} Rogue upgrades at level start`);
  
  let newState = { ...runState };
  const rng = new SeededRandom(runState.runSeed + runState.turnNumber);
  
  for (const active of rogueUpgrades) {
    const result = applyPowerupEffect(
      newState,
      active.powerup,
      undefined,
      undefined,
      undefined,
      rng,
      'rogue'
    );
    newState = {
      ...newState,
      grid: result.grid,
      currency: result.currency !== undefined ? result.currency : newState.currency,
      globalCorruption: result.corruption !== undefined ? result.corruption : newState.globalCorruption,
      appliedEffects: [...newState.appliedEffects, ...result.appliedEffects],
      forbiddenSlots: result.forbiddenSlots
        ? [...newState.forbiddenSlots, ...result.forbiddenSlots]
        : newState.forbiddenSlots,
      boxLocks: result.boxLocks ? [...newState.boxLocks, ...result.boxLocks] : newState.boxLocks,
    };
    
    console.log(`[Analytics] powerup_auto_triggered`, {
      id: active.powerup.id,
      floor: 'current',
      runSeed: runState.runSeed,
    });
  }
  
  return newState;
}

export function applyOnPlacement(
  runState: RunState,
  powerupId: string,
  placedDigit: number,
  row: number,
  col: number
): RunState {
  const active = runState.activePowerups.find(p => p.id === powerupId);
  if (!active || active.powerup.digit !== placedDigit) {
    return runState;
  }
  
  const rng = new SeededRandom(runState.runSeed + runState.turnNumber);
  
  const result = applyPowerupEffect(runState, active.powerup, row, col, placedDigit, rng, 'shop');
  
  return {
    ...runState,
    grid: result.grid,
    currency: result.currency !== undefined ? result.currency : runState.currency,
    globalCorruption: result.corruption !== undefined ? result.corruption : runState.globalCorruption,
    appliedEffects: [...runState.appliedEffects, ...result.appliedEffects],
    forbiddenSlots: result.forbiddenSlots
      ? [...runState.forbiddenSlots, ...result.forbiddenSlots]
      : runState.forbiddenSlots,
    boxLocks: result.boxLocks ? [...runState.boxLocks, ...result.boxLocks] : runState.boxLocks,
  };
}

export function applyRunPurchase(runState: RunState, powerupId: string): RunState {
  const powerup = getPowerupById(powerupId);
  if (!powerup) {
    console.error(`[PowerupManager] Powerup not found: ${powerupId}`);
    return runState;
  }
  
  const existing = runState.activePowerups.find(p => p.id === powerupId);
  if (existing) {
    console.warn(`[PowerupManager] Powerup already active: ${powerupId}`);
    return runState;
  }
  
  const active: ActivePowerup = {
    id: powerupId,
    powerup,
    chargesRemaining: powerup.effectKey === 'neutralizeMistake' ? powerup.params.count : undefined,
  };
  
  console.log(`[PowerupManager] Purchased powerup: ${powerupId}`);
  console.log(`[Analytics] powerup_applied`, {
    id: powerupId,
    floor: 'current',
    runSeed: runState.runSeed,
    method: 'shop',
  });
  
  return {
    ...runState,
    activePowerups: [...runState.activePowerups, active],
  };
}

function applyPowerupEffect(
  runState: RunState,
  powerup: Powerup,
  row?: number,
  col?: number,
  placedDigit?: number,
  rng?: SeededRandom,
  method: 'shop' | 'rogue' | 'script' = 'shop'
): PowerupApplicationResult {
  const beforeHash = computeStateHash(runState.grid);
  let grid = runState.grid;
  let currency = runState.currency;
  let corruption = runState.globalCorruption;
  let forbiddenSlots: ForbiddenSlot[] = [];
  let boxLocks: BoxLock[] = [];
  let fallback = false;
  
  const effectRng = rng || new SeededRandom(runState.runSeed + runState.turnNumber);
  
  switch (powerup.effectKey) {
    case 'purify':
      grid = applyPurify(grid, powerup.params, row, col);
      break;
    
    case 'autoPlace': {
      const result = applyAutoPlace(grid, runState.solution, powerup.params, effectRng);
      grid = result.grid;
      fallback = result.fallback;
      break;
    }
    
    case 'revealCandidate':
      grid = applyRevealCandidate(grid, runState.solution, powerup.params, effectRng);
      break;
    
    case 'lockBox': {
      const result = applyLockBox(grid, powerup.params, row, col);
      grid = result.grid;
      boxLocks = result.boxLocks;
      break;
    }
    
    case 'forbidSlots': {
      const result = applyForbidSlots(
        grid,
        runState.solution,
        powerup.params,
        placedDigit || powerup.digit,
        effectRng
      );
      grid = result.grid;
      forbiddenSlots = result.forbiddenSlots;
      break;
    }
    
    case 'resolveAmbiguity':
      grid = applyResolveAmbiguity(grid, runState.solution, powerup.params, row, col, effectRng);
      break;
    
    case 'cleanAnywhere':
      grid = applyCleanAnywhere(grid, powerup.params, row, col);
      break;
    
    case 'grantCurrency': {
      const result = applyGrantCurrency(currency, powerup.params, grid);
      currency = result.currency;
      if (result.grid) grid = result.grid;
      break;
    }
    
    case 'clearPhantom':
      grid = applyClearPhantom(grid, runState.solution, powerup.params);
      break;
    
    case 'neutralizeMistake':
      break;
  }
  
  const afterHash = computeStateHash(grid);
  
  const appliedEffect: AppliedEffect = {
    powerupId: powerup.id,
    effectKey: powerup.effectKey,
    turnNumber: runState.turnNumber,
    beforeStateHash: beforeHash,
    afterStateHash,
    metadata: { method, fallback },
  };
  
  console.log(`[Analytics] powerup_effect_result`, {
    id: powerup.id,
    effectKey: powerup.effectKey,
    beforeStateHash: beforeHash,
    afterStateHash,
  });
  
  return {
    grid,
    currency,
    corruption,
    appliedEffects: [appliedEffect],
    forbiddenSlots,
    boxLocks,
    fallback,
  };
}
