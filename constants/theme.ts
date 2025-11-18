export const COLORS = {
  background: {
    primary: '#000000',
    secondary: '#1a1a1a',
    card: 'rgba(93, 188, 210, 0.1)',
  },
  primary: {
    cyan: '#5dbcd2',
    darkCyan: '#4a9db0',
    gradient: ['#5dbcd2', '#4a9db0'],
  },
  accent: {
    amber: '#e6b04c',
    magenta: '#c46cc4',
    red: '#e64c4c',
    green: '#4ce64c',
  },
  text: {
    primary: '#ffffff',
    secondary: '#cccccc',
    muted: '#999999',
  },
  rarity: {
    common: '#5dbcd2',
    uncommon: '#5dbcd2',
    rare: '#e6b04c',
    legendary: '#c46cc4',
  },
  corruption: {
    low: 'rgba(196, 76, 196, 0.15)',
    medium: 'rgba(196, 76, 196, 0.3)',
    high: 'rgba(196, 76, 196, 0.5)',
  },
} as const;

export const FONTS = {
  pixel: 'monospace' as const,
} as const;

export const BORDER = {
  thick: 3,
  medium: 2,
  thin: 1,
} as const;
