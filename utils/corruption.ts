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

export function getCorruptionThreshold(): number {
  return 50;
}

export function getCorruptionThresholds(): number[] {
  return [10, 20, 30, 40, 50];
}

export function getCorruptionEventAtThreshold(threshold: number): CorruptionEventType | 'lose' | null {
  switch (threshold) {
    case 10:
      return 'candidate_chaos';
    case 20:
      return 'cell_lock';
    case 30:
      return 'candidate_chaos';
    case 40:
      return 'cell_lock';
    case 50:
      return 'lose';
    default:
      return null;
  }
}

export function spreadCorruption(
  grid: GameGrid,
  sourceRow: number,
  sourceCol: number
): CorruptionSpreadResult {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  
  newGrid[sourceRow][sourceCol].corruption = 1;
  
  const connectedCells = getConnectedCells(sourceRow, sourceCol);
  const uncorruptedCells = connectedCells.filter(
    ([r, c]) => newGrid[r][c].corruption === 0
  );
  
  const spreadTargets: [number, number][] = [];
  for (let i = 0; i < Math.min(2, uncorruptedCells.length); i++) {
    const randomIndex = Math.floor(Math.random() * uncorruptedCells.length);
    spreadTargets.push(uncorruptedCells[randomIndex]);
    uncorruptedCells.splice(randomIndex, 1);
  }
  
  for (const [row, col] of spreadTargets) {
    newGrid[row][col].corruption = 1;
  }
  
  return {
    grid: newGrid,
    corruptionAdded: 1 + spreadTargets.length,
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

export function checkCorruptionThresholdEvent(
  previousCount: number,
  currentCount: number,
  upgradeEffects?: string[]
): { eventType: CorruptionEventType | 'lose' | null; threshold: number } {
  const thresholds = getCorruptionThresholds();
  
  for (const threshold of thresholds) {
    if (previousCount < threshold && currentCount >= threshold) {
      const eventType = getCorruptionEventAtThreshold(threshold);
      
      const flowStateImmunity = upgradeEffects?.includes('jester_flow_state') || false;
      if (eventType === 'candidate_chaos' && flowStateImmunity) {
        console.log('[FlowState] Candidate Chaos blocked by Jester immunity at threshold', threshold);
        return { eventType: null, threshold };
      }
      
      console.log(`[Corruption Threshold] Reached ${threshold} - triggering ${eventType}`);
      return { eventType, threshold };
    }
  }
  
  return { eventType: null, threshold: 0 };
}

export function triggerCorruptionEvent(
  grid: GameGrid,
  eventType: CorruptionEventType,
  mistakeRow?: number,
  mistakeCol?: number
): { grid: GameGrid; lockedBox?: number } {
  const result = applyCorruptionEvent(grid, eventType, mistakeRow, mistakeCol);
  return { grid: result.grid, lockedBox: result.lockedBox };
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
      const boxToLock = findBoxWithMostCorruption(grid);
      
      console.log(`[CellLock] Box ${boxToLock} locked by corruption event (most corrupted)`);
      
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
  corruptionCount: number,
  basePrice: number
): number {
  const inflationRate = corruptionCount / 100;
  return Math.floor(basePrice * (1 + inflationRate));
}

export function shouldDegradeUpgrade(corruption: number): boolean {
  return corruption > 30 && Math.random() < 0.15;
}

export function getTotalCorruption(grid: GameGrid): number {
  let count = 0;
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j].corruption > 0) {
        count++;
      }
    }
  }
  return count;
}

export function getCorruptedCellsInBox(grid: GameGrid, boxIndex: number): number {
  const boxRow = Math.floor(boxIndex / 3) * 3;
  const boxCol = (boxIndex % 3) * 3;
  
  let count = 0;
  for (let i = boxRow; i < boxRow + 3; i++) {
    for (let j = boxCol; j < boxCol + 3; j++) {
      if (grid[i][j].corruption > 0) {
        count++;
      }
    }
  }
  return count;
}

export function findBoxWithMostCorruption(grid: GameGrid): number {
  let maxCorruption = 0;
  let maxBox = 0;
  
  for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
    const corruption = getCorruptedCellsInBox(grid, boxIndex);
    if (corruption > maxCorruption) {
      maxCorruption = corruption;
      maxBox = boxIndex;
    }
  }
  
  return maxBox;
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
  
  for (let i = corruptedCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [corruptedCells[i], corruptedCells[j]] = [corruptedCells[j], corruptedCells[i]];
  }
  
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

export function eraseAllCandidates(grid: GameGrid): GameGrid {
  return grid.map(row => 
    row.map(cell => ({
      ...cell,
      candidates: [],
    }))
  );
}

export function applyFogToRandomBoxes(grid: GameGrid, boxCount: number): GameGrid {
  const availableBoxes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const boxesToFog: number[] = [];
  
  for (let i = 0; i < Math.min(boxCount, availableBoxes.length); i++) {
    const randomIndex = Math.floor(Math.random() * availableBoxes.length);
    boxesToFog.push(availableBoxes[randomIndex]);
    availableBoxes.splice(randomIndex, 1);
  }
  
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  
  for (const boxIndex of boxesToFog) {
    const boxRow = Math.floor(boxIndex / 3) * 3;
    const boxCol = (boxIndex % 3) * 3;
    
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        newGrid[i][j].isFogged = true;
      }
    }
  }
  
  return newGrid;
}

export function lockMultipleBoxes(grid: GameGrid, existingLockedBoxes: number[], count: number): number[] {
  const availableBoxes = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(
    box => !existingLockedBoxes.includes(box)
  );
  
  availableBoxes.sort((a, b) => 
    getCorruptedCellsInBox(grid, b) - getCorruptedCellsInBox(grid, a)
  );
  
  const boxesToLock = availableBoxes.slice(0, Math.min(count, availableBoxes.length));
  
  return [...existingLockedBoxes, ...boxesToLock];
}
