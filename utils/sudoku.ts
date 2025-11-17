import { Grid, CellValue } from '@/types/game';

export function createEmptyGrid(): Grid {
  return Array(9).fill(null).map(() => Array(9).fill(null));
}

export function isValid(grid: Grid, row: number, col: number, num: number): boolean {
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num) return false;
  }

  for (let x = 0; x < 9; x++) {
    if (grid[x][col] === num) return false;
  }

  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
}

function solveSudoku(grid: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = numbers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }

        for (const num of numbers) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid)) {
              return true;
            }
            grid[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function generateSolvedGrid(): Grid {
  const grid = createEmptyGrid();
  solveSudoku(grid);
  return grid;
}

export function generatePuzzle(difficulty: number = 40): { puzzle: Grid; solution: Grid } {
  const solution = generateSolvedGrid();
  const puzzle: Grid = solution.map(row => [...row]);

  let cellsToRemove = difficulty;
  while (cellsToRemove > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    
    if (puzzle[row][col] !== null) {
      puzzle[row][col] = null;
      cellsToRemove--;
    }
  }

  return { puzzle, solution };
}

export function checkPuzzleComplete(grid: Grid, solution: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] !== solution[row][col]) {
        return false;
      }
    }
  }
  return true;
}

export function countFilledCells(grid: Grid): number {
  let count = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] !== null) {
        count++;
      }
    }
  }
  return count;
}
