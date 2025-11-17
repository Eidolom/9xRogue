export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  unlocked: boolean;
  progress: number;
  category: 'floors' | 'perfect' | 'currency' | 'upgrades' | 'speed' | 'survival';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface GameStats {
  totalGamesPlayed: number;
  totalFloorsCompleted: number;
  highestFloor: number;
  perfectFloorsCompleted: number;
  totalCurrencyEarned: number;
  totalUpgradesPurchased: number;
  fastestFloorTime: number | null;
  totalMistakes: number;
  gamesWon: number;
  currentWinStreak: number;
  bestWinStreak: number;
}
