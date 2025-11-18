import { GameGrid, Grid } from '@/types/game';

export interface CorruptionSpreadResult {
  grid: GameGrid;
  corruptionAdded: number;
  eventTriggered: boolean;
  eventType?: CorruptionEventType;
  lockedBox?: number;
}

export type CorruptionEventType = 
  | 'cascade_fog'
  | 'candidate_chaos'
  | 'region_inversion'
  | 'phantom_lock'
  | 'cell_lock';

export function getCorruptionThreshold(floor: number): number {
  return Math.min(20 + (floor * 5), 50);
}

export function spreadCorruption(
  grid: GameGrid,
  sourceRow: number,
  sourceCol: number,
  mistakeCount: number,
  totalCorruption: number
): CorruptionSpreadResult {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  let corruptionAdded = 0;
  
  const baseSpreadChance = 0.3;
  const mistakeMultiplier = Math.min(mistakeCount * 0.15, 0.5);
  const spreadChance = Math.min(baseSpreadChance + mistakeMultiplier, 0.8);
  
  const connectedCells = getConnectedCells(sourceRow, sourceCol);
  
  for (const [row, col] of connectedCells) {
    if (Math.random() < spreadChance) {
      const currentCorruption = newGrid[row][col].corruption;
      const corruptionIncrease = 1 + Math.floor(mistakeCount * 0.5);
      newGrid[row][col].corruption = Math.min(currentCorruption + corruptionIncrease, 5);
      corruptionAdded += corruptionIncrease;
    }
  }
  
  return {
    grid: newGrid,
    corruptionAdded,
    eventTriggered: false,
  };
}

export function getConnectedCells(row: number, col: number): [number, number][] {
  const connected: [number, number][] = [];
  
  for (let c = 0; c < 9; c++) {
    if (c !== col) {
      connected.push([row, c]);
    }
  }
  
  for (let r = 0; r < 9; r++) {
    if (r !== row) {
      connected.push([r, col]);
    }
  }
  
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && !connected.some(([cr, cc]) => cr === r && cc === c)) {
        connected.push([r, c]);
      }
    }
  }
  
  return connected;
}

export function applyCorruptionDegradation(
  grid: GameGrid,
  solution: Grid,
  upgrades: string[]
): GameGrid {
  const hasCorruptionResist = upgrades.includes('corruption_shield');
  const hasDegradationResist = upgrades.includes('degradation_resist');
  const degradationMultiplier = hasDegradationResist ? 0.25 : 1.0;
  
  return grid.map((row, i) => 
    row.map((cell, j) => {
      if (cell.corruption === 0) return cell;
      
      const corruptionLevel = cell.corruption;
      const newCell = { ...cell };
      
      if (corruptionLevel >= 1 && !hasCorruptionResist) {
        const candidates = calculateCandidates(grid, solution, i, j);
        if (Math.random() < 0.3 * corruptionLevel * degradationMultiplier) {
          newCell.candidates = shuffleCandidates(candidates);
        }
      }
      
      if (corruptionLevel >= 2) {
        if (Math.random() < 0.2 * corruptionLevel * degradationMultiplier) {
          const phantomCandidates = [1, 2, 3, 4, 5, 6, 7, 8, 9]
            .filter(n => !newCell.candidates.includes(n))
            .slice(0, Math.floor(Math.random() * 3) + 1);
          newCell.candidates = [...newCell.candidates, ...phantomCandidates];
        }
      }
      
      if (corruptionLevel >= 3) {
        if (Math.random() < 0.15 * degradationMultiplier) {
          newCell.isFogged = true;
        }
      }
      
      if (corruptionLevel >= 4) {
        if (Math.random() < 0.1 * degradationMultiplier && !cell.isFixed && cell.value !== null) {
          newCell.isHidden = true;
        }
      }
      
      if (corruptionLevel >= 5) {
        if (Math.random() < 0.05 * degradationMultiplier) {
          newCell.candidates = [];
        }
      }
      
      return newCell;
    })
  );
}

function calculateCandidates(grid: GameGrid, solution: Grid, row: number, col: number): number[] {
  if (grid[row][col].value !== null) return [];
  
  const used = new Set<number>();
  
  for (let c = 0; c < 9; c++) {
    const val = grid[row][c].value;
    if (val !== null) {
      used.add(val);
    }
  }
  
  for (let r = 0; r < 9; r++) {
    const val = grid[r][col].value;
    if (val !== null) {
      used.add(val);
    }
  }
  
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      const val = grid[r][c].value;
      if (val !== null) {
        used.add(val);
      }
    }
  }
  
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !used.has(n));
}

function shuffleCandidates(candidates: number[]): number[] {
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function distortInputsInCorruptedZone(
  grid: GameGrid,
  row: number,
  col: number,
  value: number
): { shouldLock: boolean; shouldHide: boolean; createsBifurcation: boolean } {
  const corruptionLevel = grid[row][col].corruption;
  
  const shouldLock = corruptionLevel >= 3 && Math.random() < 0.25;
  const shouldHide = corruptionLevel >= 2 && Math.random() < 0.15;
  const createsBifurcation = corruptionLevel >= 4 && Math.random() < 0.1;
  
  return {
    shouldLock,
    shouldHide,
    createsBifurcation,
  };
}

export function triggerCorruptionEvent(
  grid: GameGrid,
  totalCorruption: number,
  threshold: number,
  mistakeRow?: number,
  mistakeCol?: number
): { grid: GameGrid; eventType: CorruptionEventType | null; lockedBox?: number } {
  const corruptionPercent = totalCorruption / threshold;
  
  if (Math.random() > corruptionPercent) {
    return { grid, eventType: null };
  }
  
  const events: CorruptionEventType[] = [
    'cascade_fog',
    'candidate_chaos',
    'region_inversion',
    'phantom_lock',
    'cell_lock',
  ];
  
  const eventType = events[Math.floor(Math.random() * events.length)];
  const result = applyCorruptionEvent(grid, eventType, mistakeRow, mistakeCol);
  
  return { grid: result.grid, eventType, lockedBox: result.lockedBox };
}

function applyCorruptionEvent(
  grid: GameGrid,
  eventType: CorruptionEventType,
  mistakeRow?: number,
  mistakeCol?: number
): { grid: GameGrid; lockedBox?: number } {
  switch (eventType) {
    case 'cascade_fog':
      return {
        grid: grid.map(row => 
          row.map(cell => ({
            ...cell,
            isFogged: cell.corruption > 0 ? true : cell.isFogged
          }))
        ),
      };
      
    case 'candidate_chaos':
      return {
        grid: grid.map(row => 
          row.map(cell => ({
            ...cell,
            candidates: cell.corruption > 0 && cell.candidates.length > 0
              ? shuffleCandidates(cell.candidates)
              : cell.candidates
          }))
        ),
      };
      
    case 'region_inversion': {
      const targetRegion = Math.floor(Math.random() * 9);
      const regionRow = Math.floor(targetRegion / 3) * 3;
      const regionCol = (targetRegion % 3) * 3;
      
      return {
        grid: grid.map((row, i) => 
          row.map((cell, j) => {
            const inRegion = i >= regionRow && i < regionRow + 3 && 
                            j >= regionCol && j < regionCol + 3;
            return inRegion && cell.corruption > 0
              ? { ...cell, isHidden: !cell.isHidden }
              : cell;
          })
        ),
      };
    }
      
    case 'phantom_lock':
      return {
        grid: grid.map(row => 
          row.map(cell => ({
            ...cell,
            isLocked: cell.corruption >= 2 && Math.random() < 0.3 ? true : cell.isLocked,
            lockTurnsRemaining: cell.corruption >= 2 && Math.random() < 0.3 ? 3 : cell.lockTurnsRemaining
          }))
        ),
      };
      
    case 'cell_lock': {
      let boxToLock: number;
      
      if (mistakeRow !== undefined && mistakeCol !== undefined) {
        const boxRow = Math.floor(mistakeRow / 3);
        const boxCol = Math.floor(mistakeCol / 3);
        boxToLock = boxRow * 3 + boxCol;
      } else {
        boxToLock = Math.floor(Math.random() * 9);
      }
      
      console.log(`[CellLock] Box ${boxToLock} locked by corruption event`);
      
      return {
        grid,
        lockedBox: boxToLock,
      };
    }
      
    default:
      return { grid };
  }
}

export function calculateShopInflation(
  corruption: number,
  basePrice: number
): number {
  const inflationRate = Math.min(corruption * 0.02, 0.5);
  return Math.floor(basePrice * (1 + inflationRate));
}

export function shouldDegradeUpgrade(corruption: number): boolean {
  return corruption > 30 && Math.random() < 0.15;
}

export function getTotalCorruption(grid: GameGrid): number {
  return grid.flat().reduce((sum, cell) => sum + cell.corruption, 0);
}

export function cleanseCells(
  grid: GameGrid,
  targetCount: number
): { grid: GameGrid; cellsCleansed: number } {
  const corruptedCells: [number, number][] = [];
  
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j].corruption > 0) {
        corruptedCells.push([i, j]);
      }
    }
  }
  
  corruptedCells.sort((a, b) => 
    grid[b[0]][b[1]].corruption - grid[a[0]][a[1]].corruption
  );
  
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  
  const cleansedCount = Math.min(targetCount, corruptedCells.length);
  
  for (let i = 0; i < cleansedCount; i++) {
    const [row, col] = corruptedCells[i];
    newGrid[row][col].corruption = 0;
    newGrid[row][col].isFogged = false;
    newGrid[row][col].isHidden = false;
  }
  
  return { grid: newGrid, cellsCleansed: cleansedCount };
}
