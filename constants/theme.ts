export const COLORS = {
  background: {
    primary: '#0d0e15',
    secondary: '#1a1a1a',
    card: 'rgba(192, 203, 220, 0.1)',
  },
  primary: {
    cyan: '#c0cbdc',
    darkCyan: '#a0b0c0',
    gradient: ['#c0cbdc', '#a0b0c0'],
  },
  accent: {
    amber: '#ffcc33',
    magenta: '#ff0044',
    red: '#ff0044',
    green: '#20e080',
  },
  text: {
    primary: '#c0cbdc',
    secondary: '#a0a8b0',
    muted: '#707070',
  },
  rarity: {
    common: '#c0cbdc',
    uncommon: '#20e080',
    rare: '#ffcc33',
    legendary: '#ff0044',
  },
  corruption: {
    low: 'rgba(255, 0, 68, 0.15)',
    medium: 'rgba(255, 0, 68, 0.3)',
    high: 'rgba(255, 0, 68, 0.5)',
  },
} as const;

export const FONTS = {
  pixel: 'monospace' as const,
} as const;

export const BORDER = {
  thick: 4,
  medium: 2,
  thin: 1,
} as const;

export const SHADOW = {
  hard: {
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;
