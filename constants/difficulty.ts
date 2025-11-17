import { LevelModifier } from '@/types/game';

export interface DifficultyLevel {
  floor: number;
  description: string;
  modifiers: LevelModifier[];
  baseDifficulty: number;
}

export const DIFFICULTY_CURVE: DifficultyLevel[] = [
  {
    floor: 1,
    description: 'Foundational discipline',
    baseDifficulty: 35,
    modifiers: [
      {
        type: 'delayed_validation',
        intensity: 3,
      },
    ],
  },
  {
    floor: 2,
    description: 'Mild opacity',
    baseDifficulty: 38,
    modifiers: [
      {
        type: 'delayed_validation',
        intensity: 3,
      },
      {
        type: 'fog',
        intensity: 0.3,
        regions: [1, 4, 7],
      },
    ],
  },
  {
    floor: 3,
    description: 'Localised uncertainty',
    baseDifficulty: 42,
    modifiers: [
      {
        type: 'delayed_validation',
        intensity: 4,
      },
      {
        type: 'fog',
        intensity: 0.4,
        regions: [2, 5],
      },
      {
        type: 'probabilistic_hints',
        intensity: 0.6,
        regions: [0],
      },
      {
        type: 'ambiguity_injection',
        intensity: 1,
        ambiguityTier: 'A1',
        pocketCount: 1,
      },
    ],
  },
  {
    floor: 4,
    description: 'Deterministic guess points',
    baseDifficulty: 46,
    modifiers: [
      {
        type: 'delayed_validation',
        intensity: 5,
      },
      {
        type: 'fog',
        intensity: 0.5,
        regions: [3, 6],
      },
      {
        type: 'probabilistic_hints',
        intensity: 0.5,
        regions: [1, 4],
      },
      {
        type: 'forced_bifurcation',
        intensity: 1,
      },
      {
        type: 'ambiguity_injection',
        intensity: 1,
        ambiguityTier: 'A2',
        pocketCount: 2,
      },
    ],
  },
  {
    floor: 5,
    description: 'Interference mechanics',
    baseDifficulty: 50,
    modifiers: [
      {
        type: 'delayed_validation',
        intensity: 5,
      },
      {
        type: 'fog',
        intensity: 0.5,
        regions: [0, 8],
      },
      {
        type: 'candidate_shuffle',
        intensity: 1,
        regions: [2],
        duration: 3000,
      },
      {
        type: 'timed_hide',
        intensity: 1,
        duration: 5000,
      },
      {
        type: 'ambiguity_injection',
        intensity: 1,
        ambiguityTier: 'A2',
        pocketCount: 3,
      },
    ],
  },
  {
    floor: 6,
    description: 'Constraint distortion',
    baseDifficulty: 54,
    modifiers: [
      {
        type: 'delayed_validation',
        intensity: 5,
      },
      {
        type: 'fog',
        intensity: 0.6,
        regions: [1, 4, 7],
      },
      {
        type: 'constraint_suppression',
        intensity: 1,
        regions: [5],
      },
      {
        type: 'recent_hide',
        intensity: 3,
      },
      {
        type: 'ambiguity_injection',
        intensity: 1,
        ambiguityTier: 'A3',
        pocketCount: 2,
      },
    ],
  },
  {
    floor: 7,
    description: 'Layered ambiguity',
    baseDifficulty: 56,
    modifiers: [
      {
        type: 'delayed_validation',
        intensity: 5,
      },
      {
        type: 'fog',
        intensity: 0.7,
        regions: [0, 2, 6, 8],
      },
      {
        type: 'inverted_signals',
        intensity: 1,
        regions: [4],
      },
      {
        type: 'candidate_suppression',
        intensity: 0.5,
      },
      {
        type: 'candidate_shuffle',
        intensity: 1,
        regions: [1, 7],
        duration: 3000,
      },
      {
        type: 'ambiguity_injection',
        intensity: 1,
        ambiguityTier: 'A3',
        pocketCount: 4,
      },
    ],
  },
  {
    floor: 8,
    description: 'Systemic risk escalation',
    baseDifficulty: 58,
    modifiers: [
      {
        type: 'delayed_validation',
        intensity: 5,
      },
      {
        type: 'fog',
        intensity: 0.8,
        regions: [0, 1, 2, 6, 7, 8],
      },
      {
        type: 'cell_lockout',
        intensity: 3,
      },
      {
        type: 'candidate_shuffle',
        intensity: 1,
        regions: [3, 4, 5],
        duration: 2500,
      },
      {
        type: 'recent_hide',
        intensity: 4,
      },
      {
        type: 'candidate_suppression',
        intensity: 0.6,
      },
      {
        type: 'ambiguity_injection',
        intensity: 1,
        ambiguityTier: 'A3',
        pocketCount: 5,
      },
    ],
  },
  {
    floor: 9,
    description: 'High-pressure composite logic',
    baseDifficulty: 60,
    modifiers: [
      {
        type: 'delayed_validation',
        intensity: 5,
      },
      {
        type: 'fog',
        intensity: 0.9,
        regions: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      },
      {
        type: 'cell_lockout',
        intensity: 5,
      },
      {
        type: 'candidate_shuffle',
        intensity: 1,
        regions: [0, 2, 4, 6, 8],
        duration: 2000,
      },
      {
        type: 'inverted_signals',
        intensity: 1,
        regions: [1, 7],
      },
      {
        type: 'constraint_suppression',
        intensity: 1,
        regions: [3, 5],
      },
      {
        type: 'candidate_suppression',
        intensity: 0.7,
      },
      {
        type: 'forced_bifurcation',
        intensity: 1,
      },
      {
        type: 'ambiguity_injection',
        intensity: 1,
        ambiguityTier: 'A4',
        pocketCount: 6,
      },
    ],
  },
];

export function getModifiersForFloor(floor: number): LevelModifier[] {
  if (floor <= 9) {
    const level = DIFFICULTY_CURVE.find(l => l.floor === floor);
    return level ? level.modifiers : [];
  }

  const allModifierTypes: LevelModifier[] = [
    { type: 'delayed_validation', intensity: 5 },
    { type: 'fog', intensity: Math.random() * 0.5 + 0.5, regions: getRandomRegions(3, 6) },
    { type: 'cell_lockout', intensity: Math.floor(Math.random() * 3) + 3 },
    { type: 'candidate_shuffle', intensity: 1, regions: getRandomRegions(2, 4), duration: Math.random() * 1000 + 2000 },
    { type: 'inverted_signals', intensity: 1, regions: getRandomRegions(1, 2) },
    { type: 'constraint_suppression', intensity: 1, regions: getRandomRegions(1, 2) },
    { type: 'candidate_suppression', intensity: Math.random() * 0.3 + 0.5 },
    { type: 'forced_bifurcation', intensity: 1 },
    { type: 'timed_hide', intensity: 1, duration: Math.random() * 2000 + 3000 },
    { type: 'recent_hide', intensity: Math.floor(Math.random() * 2) + 3 },
  ];

  const numModifiers = Math.min(Math.floor(Math.random() * 3) + 5, allModifierTypes.length);
  const selectedModifiers: LevelModifier[] = [];
  
  const shuffled = [...allModifierTypes].sort(() => Math.random() - 0.5);
  for (let i = 0; i < numModifiers; i++) {
    selectedModifiers.push(shuffled[i]);
  }

  return selectedModifiers;
}

function getRandomRegions(min: number, max: number): number[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const regions: number[] = [];
  const available = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    regions.push(available[idx]);
    available.splice(idx, 1);
  }
  
  return regions;
}

export function getDifficultyForFloor(floor: number): number {
  if (floor <= 9) {
    const level = DIFFICULTY_CURVE.find(l => l.floor === floor);
    return level ? level.baseDifficulty : 60;
  }
  
  return Math.min(60 + (floor - 9), 70);
}

export function getDescriptionForFloor(floor: number): string {
  if (floor <= 9) {
    const level = DIFFICULTY_CURVE.find(l => l.floor === floor);
    return level ? level.description : 'Endless mode';
  }
  
  return 'Procedural volatility';
}
