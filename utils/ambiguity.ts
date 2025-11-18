import { Grid, GameGrid, AmbiguityLevel, AmbiguityZone, LevelModifier } from '@/types/game';
import { getCandidatesForCell, getCellRegion } from './modifiers';

export function createAmbiguityZone(
  grid: Grid,
  solution: Grid,
  tier: AmbiguityLevel,
  targetRow?: number,
  targetRegion?: number
): AmbiguityZone | null {
  const pocketSize = getAmbiguityPocketSize(tier);
  const cells: { row: number; col: number }[] = [];
  
  if (targetRow !== undefined) {
    const emptyCells = findEmptyCellsInRow(grid, targetRow, pocketSize);
    cells.push(...emptyCells);
  } else if (targetRegion !== undefined) {
    const emptyCells = findEmptyCellsInRegion(grid, targetRegion, pocketSize);
    cells.push(...emptyCells);
  } else {
    return null;
  }
  
  if (cells.length < 2) return null;
  
  const alternativeSolutions: number[][] = [];
  for (const cell of cells) {
    const candidates = getCandidatesForCell(grid, cell.row, cell.col);
    if (candidates.length > 1) {
      alternativeSolutions.push(candidates.slice(0, Math.min(candidates.length, pocketSize)));
    } else {
      const solutionValue = solution[cell.row][cell.col];
      alternativeSolutions.push(solutionValue !== null ? [solutionValue] : []);
    }
  }
  
  return {
    cells,
    tier,
    alternativeSolutions,
    resolved: false,
  };
}

function getAmbiguityPocketSize(tier: AmbiguityLevel): number {
  switch (tier) {
    case 'A1': return 2;
    case 'A2': return 3;
    case 'A3': return 4;
    case 'A4': return 5;
    default: return 0;
  }
}

function findEmptyCellsInRow(grid: Grid, row: number, count: number): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  
  for (let col = 0; col < 9 && cells.length < count; col++) {
    const cellValue = grid[row][col];
    if (cellValue === null || cellValue === 0) {
      cells.push({ row, col });
    }
  }
  
  return cells;
}

function findEmptyCellsInRegion(grid: Grid, region: number, count: number): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  const startRow = Math.floor(region / 3) * 3;
  const startCol = (region % 3) * 3;
  
  for (let i = 0; i < 3 && cells.length < count; i++) {
    for (let j = 0; j < 3 && cells.length < count; j++) {
      const row = startRow + i;
      const col = startCol + j;
      const cellValue = grid[row][col];
      if (cellValue === null || cellValue === 0) {
        cells.push({ row, col });
      }
    }
  }
  
  return cells;
}

export function applyAmbiguityInjection(
  gameGrid: GameGrid,
  solution: Grid,
  modifier: LevelModifier,
  zones: AmbiguityZone[]
): GameGrid {
  let newGrid = gameGrid;
  
  for (const zone of zones) {
    for (const cell of zone.cells) {
      const { row, col } = cell;
      if (!newGrid[row][col].isFixed && newGrid[row][col].value === null) {
        const candidates = getCandidatesForCell(solution, row, col);
        
        newGrid = newGrid.map((r, i) => 
          r.map((c, j) => {
            if (i === row && j === col) {
              return {
                ...c,
                isAmbiguous: candidates.length > 1,
                ambiguousValues: candidates,
                ambiguityLevel: zone.tier,
              };
            }
            return c;
          })
        );
      }
    }
  }
  
  return newGrid;
}

export function generateAmbiguityZones(
  grid: Grid,
  solution: Grid,
  tier: AmbiguityLevel,
  pocketCount: number
): AmbiguityZone[] {
  const zones: AmbiguityZone[] = [];
  const usedRows = new Set<number>();
  const usedRegions = new Set<number>();
  
  for (let i = 0; i < pocketCount; i++) {
    const useRow = Math.random() > 0.5;
    
    if (useRow) {
      const availableRows = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(r => !usedRows.has(r));
      if (availableRows.length > 0) {
        const row = availableRows[Math.floor(Math.random() * availableRows.length)];
        const zone = createAmbiguityZone(grid, solution, tier, row, undefined);
        if (zone && zone.cells.length >= 2) {
          zones.push(zone);
          usedRows.add(row);
        }
      }
    } else {
      const availableRegions = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(r => !usedRegions.has(r));
      if (availableRegions.length > 0) {
        const region = availableRegions[Math.floor(Math.random() * availableRegions.length)];
        const zone = createAmbiguityZone(grid, solution, tier, undefined, region);
        if (zone && zone.cells.length >= 2) {
          zones.push(zone);
          usedRegions.add(region);
        }
      }
    }
  }
  
  return zones;
}

export function checkAmbiguityResolution(
  zones: AmbiguityZone[],
  grid: GameGrid,
  solution: Grid
): AmbiguityZone[] {
  return zones.map(zone => {
    if (zone.resolved) return zone;
    
    let correctPlacements = 0;
    for (const cell of zone.cells) {
      const gridCell = grid[cell.row][cell.col];
      if (gridCell.value === solution[cell.row][cell.col]) {
        correctPlacements++;
      }
    }
    
    const resolved = correctPlacements >= Math.ceil(zone.cells.length * 0.6);
    
    return {
      ...zone,
      resolved,
    };
  });
}

export function calculateAmbiguityCorruption(
  tier: AmbiguityLevel,
  isCorrect: boolean
): number {
  if (isCorrect) return 0;
  
  switch (tier) {
    case 'A1': return 5;
    case 'A2': return 10;
    case 'A3': return 15;
    case 'A4': return 25;
    default: return 0;
  }
}

export function getAmbiguitySpreadPattern(tier: AmbiguityLevel): 'single' | 'row' | 'subgrid' | 'chain' | 'dual' {
  switch (tier) {
    case 'A1': return 'single';
    case 'A2': return 'row';
    case 'A3': return 'subgrid';
    case 'A4': return 'chain';
    default: return 'single';
  }
}

export function spreadAmbiguityCorruption(
  grid: GameGrid,
  row: number,
  col: number,
  tier: AmbiguityLevel
): GameGrid {
  const pattern = getAmbiguitySpreadPattern(tier);
  let newGrid = grid;
  
  switch (pattern) {
    case 'single':
      newGrid = newGrid.map((r, i) => 
        r.map((c, j) => {
          if (i === row && j === col) {
            return { ...c, corruption: c.corruption + 1 };
          }
          return c;
        })
      );
      break;
      
    case 'row':
      newGrid = newGrid.map((r, i) => 
        r.map((c, j) => {
          if (i === row) {
            return { ...c, corruption: c.corruption + 1 };
          }
          return c;
        })
      );
      break;
      
    case 'subgrid':
      const region = getCellRegion(row, col);
      const startRow = Math.floor(region / 3) * 3;
      const startCol = (region % 3) * 3;
      newGrid = newGrid.map((r, i) => 
        r.map((c, j) => {
          if (i >= startRow && i < startRow + 3 && j >= startCol && j < startCol + 3) {
            return { ...c, corruption: c.corruption + 1 };
          }
          return c;
        })
      );
      break;
      
    case 'chain':
      newGrid = newGrid.map((r, i) => 
        r.map((c, j) => {
          if (i === row || j === col) {
            return { ...c, corruption: c.corruption + 1 };
          }
          return c;
        })
      );
      break;
      
    case 'dual':
      const region1 = getCellRegion(row, col);
      const startRow1 = Math.floor(region1 / 3) * 3;
      const startCol1 = (region1 % 3) * 3;
      newGrid = newGrid.map((r, i) => 
        r.map((c, j) => {
          if ((i === row || j === col) || 
              (i >= startRow1 && i < startRow1 + 3 && j >= startCol1 && j < startCol1 + 3)) {
            return { ...c, corruption: c.corruption + 1 };
          }
          return c;
        })
      );
      break;
  }
  
  return newGrid;
}
