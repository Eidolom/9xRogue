export type CellValue = number | null;
export type Grid = CellValue[][];

export interface Cell {
  value: CellValue;
  isFixed: boolean;
  isCorrect: boolean;
  corruption: number;
  isFogged: boolean;
  candidates: number[];
  isHidden: boolean;
  isLocked: boolean;
  lockTurnsRemaining: number;
  ambiguityLevel: AmbiguityLevel;
  ambiguousValues: number[];
  isAmbiguous: boolean;
  ambiguityMarked: boolean;
}

export type GameGrid = Cell[][];

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  type: 'number' | 'passive' | 'consumable';
  number?: number;
  effect: string;
  cost: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'rogue';
  charges?: number;
  maxCharges?: number;
}

export type AmbiguityLevel = 'none' | 'A1' | 'A2' | 'A3' | 'A4';

export type ModifierType = 
  | 'fog'
  | 'probabilistic_hints'
  | 'forced_bifurcation'
  | 'candidate_shuffle'
  | 'timed_hide'
  | 'constraint_suppression'
  | 'recent_hide'
  | 'inverted_signals'
  | 'candidate_suppression'
  | 'cell_lockout'
  | 'ambiguity_injection';

export interface LevelModifier {
  type: ModifierType;
  intensity: number;
  regions?: number[];
  duration?: number;
  ambiguityTier?: AmbiguityLevel;
  pocketCount?: number;
}

export interface MoveHistory {
  row: number;
  col: number;
  value: number;
  turnNumber: number;
}

export interface GameState {
  floor: number;
  maxFloors: number;
  grid: GameGrid;
  solution: Grid;
  selectedCell: { row: number; col: number } | null;
  mistakes: number;
  maxMistakes: number;
  corruption: number;
  currency: number;
  entropyDust: number;
  upgrades: Upgrade[];
  isComplete: boolean;
  gameOver: boolean;
  completedCells: number;
  totalCells: number;
  modifiers: LevelModifier[];
  moveHistory: MoveHistory[];
  turnNumber: number;
  timedHideActive: boolean;
  timedHideRegion: number | null;
  shuffleTimestamp: number;
  ambiguityZones: AmbiguityZone[];
  truthBeaconUsed: boolean;
  insightMarkersRemaining: number;
  runSeed: number;
  shopsOpened: number;
  raresSeenCount: number;
  lockedBoxes: number[];
  shieldCharges: number;
  maxShieldCharges: number;
  absolutionUsed: boolean;
}

export interface AmbiguityZone {
  cells: { row: number; col: number }[];
  tier: AmbiguityLevel;
  alternativeSolutions: number[][];
  resolved: boolean;
}

export interface NumberUpgradeState {
  digit: number;
  tier: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'rogue';
  effect: string;
  chargesRemaining?: number;
}

export type GamePhase = 'title' | 'puzzle' | 'shop' | 'grimoire' | 'victory' | 'defeat' | 'progress';
