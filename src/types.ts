export interface Player {
  id: number; // 1, 2, 3, 4, 5
  name: string;
  color: string; // Tailwind bg class
  hexColor: string; // Hex color for inline styles/canvas/shadows
  borderColor: string; // Tailwind border class
  textColor: string; // Tailwind text class
  glowClass: string; // Pulsing glow class
  emoji: string;
  avatarName: string;
  score: number;
  key: string; // Hotkey
  keyLabel: string;
  active: boolean;
  customImage?: string | null;
  globalCoins?: number;
  unlockedAccessories?: string[];
  activeAccessory?: string | null;
  lastRewardClaimDate?: string | null;
  rewardStreak?: number;
  unlockedAchievements?: string[];
  balloonWinsCount?: number;
  isEliminated?: boolean; // Turlu elemede elendi mi?
}

export interface GameState {
  playerCount: number;
  players: Player[];
  currentScreen: 'lobby' | 'charSelect' | 'gamesHub' | 'balloonGame' | 'memoryGame' | 'colorTrapGame' | 'clickDerbyGame' | 'raceGame' | 'bombGame' | 'mathDashGame' | 'gameOver' | 'costumeShop' | 'achievements';
  scores: { [playerId: number]: number };
  gamePlaylist?: ('balloonGame' | 'memoryGame' | 'colorTrapGame' | 'clickDerbyGame' | 'raceGame' | 'bombGame' | 'mathDashGame')[];
  playlistActive?: boolean;
  currentPlaylistIndex?: number;
  isEliminationMode?: boolean; // Elemeli turnuva modu aktif mi?
  isMobileMode: boolean; // Mobil mi PC mi ayari
}

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  type: 'hat' | 'glasses' | 'mask' | 'badge';
  description: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  badgeEmoji: string;
  category: 'balloon' | 'memory' | 'reaction' | 'streak' | 'rich' | 'shop';
}
