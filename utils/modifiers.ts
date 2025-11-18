import { GameGrid, Cell, LevelModifier, MoveHistory, Grid } from '@/types/game';

export function getCellRegion(row: number, col: number): number {
  const regionRow = Math.floor(row / 3);
  const regionCol = Math.floor(col / 3);
  return regionRow * 3 + regionCol;
}

export function getCandidatesForCell(grid: Grid, row: number, col: number): number[] {
  const candidates: number[] = [];
  
  for (let num = 1; num <= 9; num++) {
    let valid = true;
    
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) {
        valid = false;
        break;
      }
    }
    
    if (valid) {
      for (let x = 0; x < 9; x++) {
        if (grid[x][col] === num) {
          valid = false;
          break;
        }
      }
    }
    
    if (valid) {
      const startRow = row - (row % 3);
      const startCol = col - (col % 3);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (grid[i + startRow][j + startCol] === num) {
            valid = false;
            break;
          }
        }
        if (!valid) break;
      }
    }
    
    if (valid) {
      candidates.push(num);
    }
  }
  
  return candidates;
}

export function applyFogModifier(
  grid: GameGrid,
  solution: Grid,
  modifier: LevelModifier
): GameGrid {
  if (!modifier.regions) return grid;
  
  return grid.map((row, i) => 
    row.map((cell, j) => {
      const region = getCellRegion(i, j);
      if (modifier.regions!.includes(region) && !cell.isFixed) {
        return {
          ...cell,
          isFogged: true,
        };
      }
      return cell;
    })
  );
}

export function applyProbabilisticHints(
  grid: GameGrid,
  solution: Grid,
  modifier: LevelModifier
): GameGrid {
  return grid;
}

export function applyCandidateSuppression(
  grid: GameGrid,
  solution: Grid,
  modifier: LevelModifier
): GameGrid {
  return grid;
}

export function applyRecentHide(
  grid: GameGrid,
  moveHistory: MoveHistory[],
  turnNumber: number,
  hideCount: number
): GameGrid {
  const recentMoves = moveHistory.filter(m => turnNumber - m.turnNumber <= hideCount);
  const hiddenPositions = new Set(recentMoves.map(m => `${m.row}-${m.col}`));
  
  return grid.map((row, i) => 
    row.map((cell, j) => ({
      ...cell,
      isHidden: hiddenPositions.has(`${i}-${j}`) && !cell.isFixed,
    }))
  );
}

export function applyCellLockout(
  grid: GameGrid,
  lockDuration: number
): GameGrid {
  return grid.map(row => 
    row.map(cell => {
      if (cell.lockTurnsRemaining > 0) {
        return {
          ...cell,
          lockTurnsRemaining: cell.lockTurnsRemaining - 1,
          isLocked: cell.lockTurnsRemaining - 1 > 0,
        };
      }
      return cell;
    })
  );
}

export function applyInvertedSignals(
  grid: GameGrid,
  modifier: LevelModifier
): GameGrid {
  if (!modifier.regions) return grid;
  
  return grid.map((row, i) => 
    row.map((cell, j) => {
      const region = getCellRegion(i, j);
      if (modifier.regions!.includes(region) && !cell.isFixed && cell.value !== null) {
        return {
          ...cell,
          isCorrect: !cell.isCorrect,
        };
      }
      return cell;
    })
  );
}

export function initializeCell(value: number | null, isFixed: boolean): Cell {
  return {
    value,
    isFixed,
    isCorrect: true,
    corruption: 0,
    isFogged: false,
    candidates: [],
    isHidden: false,
    isLocked: false,
    lockTurnsRemaining: 0,
    ambiguityLevel: 'none',
    ambiguousValues: [],
    isAmbiguous: false,
    ambiguityMarked: false,
  };
}
