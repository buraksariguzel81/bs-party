/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.css';

// Safe LocalStorage Wrapper for sandbox/iframe environments
const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
};

// ==========================================
// PLAYGAMA HTML5 BRIDGE SDK WRAPPER
// ==========================================
let playgamaInitialized = false;

function getPlaygamaStorageValue(key: string): Promise<string | null> {
  const bridge = (window as any).playgamaBridge;
  if (bridge && bridge.storage) {
    try {
      const hasPlatformInternal = typeof bridge.storage.isSupported === 'function' ? bridge.storage.isSupported('platform_internal') : false;
      const preferredType = hasPlatformInternal ? 'platform_internal' : 'local_storage';
      
      return bridge.storage.get(key, preferredType)
        .then((res: any) => {
          if (res && typeof res === 'object') {
            if (res[key] !== undefined) return res[key];
          }
          return res || null;
        })
        .catch((err: any) => {
          console.warn(`Playgama storage.get for ${key} failed:`, err);
          return null;
        });
    } catch (e) {
      console.warn("Playgama storage.get invocation failed", e);
    }
  }
  return Promise.resolve(null);
}

function setPlaygamaStorageValue(key: string, value: string): Promise<void> {
  const bridge = (window as any).playgamaBridge;
  if (bridge && bridge.storage) {
    try {
      const hasPlatformInternal = typeof bridge.storage.isSupported === 'function' ? bridge.storage.isSupported('platform_internal') : false;
      const preferredType = hasPlatformInternal ? 'platform_internal' : 'local_storage';
      
      return bridge.storage.set(key, value, preferredType)
        .catch((err: any) => {
          console.warn(`Playgama storage.set with type failed, trying without type:`, err);
          return bridge.storage.set(key, value);
        })
        .then(() => {
          // Success
        })
        .catch((err: any) => {
          console.warn(`Playgama storage.set completely failed for key ${key}:`, err);
        });
    } catch (e) {
      console.warn("Playgama storage.set invocation failed", e);
    }
  }
  return Promise.resolve();
}

function syncPlaygamaPlayerData() {
  const bridge = (window as any).playgamaBridge;
  if (bridge && bridge.player && bridge.player.isAuthorized) {
    const pName = bridge.player.name || "Playgama Oyuncusu";
    const pAvatar = bridge.player.avatar || bridge.player.avatarUrl || null;
    
    if (typeof state !== 'undefined' && state.players && state.players[0]) {
      const p1 = state.players[0];
      p1.name = pName;
      if (pAvatar) {
        p1.customImage = pAvatar;
      }
      savePlayerPersistentData(p1);
    }
  }
}

function syncAllPlayersFromPlaygamaStorage() {
  const bridge = (window as any).playgamaBridge;
  if (!bridge || !bridge.storage) return;
  if (typeof state === 'undefined' || !state.players) return;
  
  console.log("🔄 Playgama Storage: Fetching cloud saves for all players...");
  
  const promises = state.players.map(async (p) => {
    const imageKey = `bs_party_custom_image_${p.id}`;
    const coinsKey = `bs_party_global_coins_${p.id}`;
    const unlockedKey = `bs_party_unlocked_${p.id}`;
    const activeAccKey = `bs_party_active_acc_${p.id}`;
    const claimDateKey = `bs_party_last_reward_claim_${p.id}`;
    const streakKey = `bs_party_reward_streak_${p.id}`;
    
    const cloudImage = await getPlaygamaStorageValue(imageKey);
    const cloudCoins = await getPlaygamaStorageValue(coinsKey);
    const cloudUnlocked = await getPlaygamaStorageValue(unlockedKey);
    const cloudActiveAcc = await getPlaygamaStorageValue(activeAccKey);
    const cloudClaimDate = await getPlaygamaStorageValue(claimDateKey);
    const cloudStreak = await getPlaygamaStorageValue(streakKey);
    
    let updated = false;
    if (cloudImage !== null && cloudImage !== "") {
      p.customImage = cloudImage;
      safeLocalStorage.setItem(imageKey, cloudImage);
      updated = true;
    }
    if (cloudCoins !== null && cloudCoins !== "") {
      const coinsVal = parseInt(cloudCoins, 10);
      if (!isNaN(coinsVal)) {
        p.globalCoins = coinsVal;
        safeLocalStorage.setItem(coinsKey, cloudCoins);
        updated = true;
      }
    }
    if (cloudUnlocked !== null && cloudUnlocked !== "") {
      try {
        p.unlockedAccessories = JSON.parse(cloudUnlocked);
        safeLocalStorage.setItem(unlockedKey, cloudUnlocked);
        updated = true;
      } catch (e) {
        console.warn("Failed to parse cloud unlocked json", e);
      }
    }
    if (cloudActiveAcc !== null) {
      p.activeAccessory = cloudActiveAcc || null;
      if (cloudActiveAcc) {
        safeLocalStorage.setItem(activeAccKey, cloudActiveAcc);
      } else {
        safeLocalStorage.removeItem(activeAccKey);
      }
      updated = true;
    }
    if (cloudClaimDate !== null) {
      p.lastRewardClaimDate = cloudClaimDate || null;
      if (cloudClaimDate) {
        safeLocalStorage.setItem(claimDateKey, cloudClaimDate);
      } else {
        safeLocalStorage.removeItem(claimDateKey);
      }
      updated = true;
    }
    if (cloudStreak !== null && cloudStreak !== "") {
      const streakVal = parseInt(cloudStreak, 10);
      if (!isNaN(streakVal)) {
        p.rewardStreak = streakVal;
        safeLocalStorage.setItem(streakKey, cloudStreak);
        updated = true;
      }
    }
    return updated;
  });
  
  Promise.all(promises).then((results) => {
    const hasAnyUpdates = results.some(r => r === true);
    if (hasAnyUpdates) {
      console.log("✅ Playgama Storage: Successfully synchronized cloud save with local state.");
      render();
    }
  });
}

function loginPlaygamaPlayer() {
  const bridge = (window as any).playgamaBridge;
  if (bridge && bridge.player) {
    if (typeof bridge.player.authorize === 'function') {
      bridge.player.authorize()
        .then(() => {
          console.log("✅ Playgama Player authorized successfully.");
          syncPlaygamaPlayerData();
          syncAllPlayersFromPlaygamaStorage();
          render();
        })
        .catch((err: any) => {
          console.error("❌ Playgama Player auth failed:", err);
        });
    } else {
      console.warn("bridge.player.authorize is not a function");
    }
  }
}

function initPlaygamaSDK() {
  const bridge = (window as any).playgamaBridge;
  if (bridge) {
    console.log("🎮 Playgama SDK detected, initializing...");
    bridge.initialize()
      .then(() => {
        playgamaInitialized = true;
        console.log("✅ Playgama SDK Initialized successfully.");
        try {
          bridge.game.loadingComplete();
        } catch (e) {
          console.warn("loadingComplete call failed", e);
        }
        
        // --- NEW PLAYGAMA PLAYER & STORAGE SYNC ---
        try {
          syncPlaygamaPlayerData();
          syncAllPlayersFromPlaygamaStorage();
        } catch (e) {
          console.warn("Playgama player/storage sync failed", e);
        }
        
        try {
          bridge.game.on('pause', () => {
            console.log("⏸ Playgama: GAME PAUSE received (Ad started or Tab hidden)");
            (window as any).isGameSuspendedBySDK = true;
          });
          bridge.game.on('resume', () => {
             console.log("▶ Playgama: GAME RESUME received (Ad finished)");
             (window as any).isGameSuspendedBySDK = false;
          });
        } catch (e) {
          console.warn("Failed to subscribe to pause/resume events", e);
        }
      })
      .catch((err: any) => {
        console.error("❌ Playgama SDK initialization failed:", err);
      });
  } else {
    console.log("ℹ️ Playgama SDK not detected (Preview / Local Sandbox). Mock ready.");
  }
}

function triggerPlaygamaAd(): Promise<void> {
  const bridge = (window as any).playgamaBridge;
  if (bridge && bridge.advertisement) {
    console.log("🎬 Triggering Playgama Interstitial Ad...");
    return bridge.advertisement.showInterstitial()
      .then(() => {
        console.log("✅ Interstitial Ad finished successfully.");
      })
      .catch((err: any) => {
        console.warn("⚠️ Interstitial Ad failed or blocked:", err);
      });
  } else {
    console.log("🎬 [Sandbox] Playgama Interstitial Ad action simulated.");
    return Promise.resolve();
  }
}

// Bootstrap initialization for Playgama
if (document.readyState === 'complete') {
  initPlaygamaSDK();
} else {
  window.addEventListener('load', initPlaygamaSDK);
}

// --- GAME TYPES ---
interface Player {
  id: number; // 1, 2, 3, 4
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

interface GameState {
  playerCount: number;
  players: Player[];
  currentScreen: 'lobby' | 'charSelect' | 'gamesHub' | 'balloonGame' | 'memoryGame' | 'colorTrapGame' | 'clickDerbyGame' | 'raceGame' | 'bombGame' | 'mathDashGame' | 'gameOver' | 'costumeShop';
  scores: { [playerId: number]: number };
  gamePlaylist?: ('balloonGame' | 'memoryGame' | 'colorTrapGame' | 'clickDerbyGame' | 'raceGame' | 'bombGame' | 'mathDashGame')[];
  playlistActive?: boolean;
  currentPlaylistIndex?: number;
  isEliminationMode?: boolean; // Elemeli turnuva modu aktif mi?
  isMobileMode: boolean; // Mobil mi PC mi ayari
}

interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  type: 'hat' | 'glasses' | 'mask' | 'badge';
  description: string;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'crown', name: 'Şampiyon Tacı', emoji: '👑', cost: 15, type: 'hat', description: 'Hakiki bir lider için altın taç!' },
  { id: 'glasses', name: 'Havalı Gözlük', emoji: '🕶️', cost: 8, type: 'glasses', description: 'Aşırı derece karizma kazandırır.' },
  { id: 'sheriff', name: 'Şerif Şapkası', emoji: '🤠', cost: 12, type: 'hat', description: 'Kasabanın yeni kanun koruyucusu!' },
  { id: 'wizard', name: 'Sihirbaz Şapkası', emoji: '🎩', cost: 20, type: 'hat', description: 'Rakipleri büyülemek isteyenlere.' },
  { id: 'pink_bow', name: 'Sevimli Fiyonk', emoji: '🎀', cost: 5, type: 'badge', description: 'Ekstra tatlılık katmak isteyenlere.' },
  { id: 'headphones', name: 'Oyuncu Kulaklığı', emoji: '🎧', cost: 18, type: 'glasses', description: 'Yüksek kaliteli ses ve odaklanma.' },
  { id: 'horn', name: 'Tekboynuz Boynuzu', emoji: '🦄', cost: 22, type: 'hat', description: 'Efsanevi mitolojik bir güç.' },
  { id: 'ninja', name: 'Siyah Ninja Maskesi', emoji: '🥷', cost: 25, type: 'mask', description: 'Görünmez ol, sessizce oyna!' },
  { id: 'angel', name: 'Melek Halesi', emoji: '😇', cost: 30, type: 'hat', description: 'Altın renkli saf melek parıltısı.' }
];

// --- ACHIEVEMENTS SYSTEM DATA ---
interface Achievement {
  id: string;
  name: string;
  description: string;
  badgeEmoji: string;
  category: 'balloon' | 'memory' | 'reaction' | 'streak' | 'rich' | 'shop';
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'balloon_wins_5',
    name: 'Balon Şampiyonu',
    description: 'Balon şişirme oyununda 5 kez zafer kazan.',
    badgeEmoji: '🎈🏆',
    category: 'balloon'
  },
  {
    id: 'perfect_memory',
    name: 'Kusursuz Akıl',
    description: 'Hafıza kartı elinde en az 2 eşleşme bulurken 0 hata (mismatch) yap.',
    badgeEmoji: '🧠💯',
    category: 'memory'
  },
  {
    id: 'speed_demon_220',
    name: 'Işık Hızı',
    description: 'Reaksiyon oyununda ganimeti 250ms altı sürede kap.',
    badgeEmoji: '⚡🚀',
    category: 'reaction'
  },
  {
    id: 'streak_3',
    name: 'Sadık Oyuncu',
    description: 'Günlük girişte en az 3 günlük bir seri (streak) yakala.',
    badgeEmoji: '🔥📆',
    category: 'streak'
  },
  {
    id: 'coin_lord_100',
    name: 'Zenginlik Simgesi',
    description: 'Toplamda 100 altın coine (küresek birikim) ulaş.',
    badgeEmoji: '💎💰',
    category: 'rich'
  },
  {
    id: 'collector_3',
    name: 'Moda İkonu',
    description: 'Kostüm Mağazasında en az 3 aksesuar aç.',
    badgeEmoji: '👑🕶️',
    category: 'shop'
  }
];

// Active customized player index in the shop
let activeShopPlayerId = 1;
// Keep track of which parent screen opened the shop
let lastScreenBeforeShop: GameState['currentScreen'] = 'gamesHub';

function loadPlayerPersistentData(id: number) {
  try {
    const customImage = safeLocalStorage.getItem(`bs_party_custom_image_${id}`);
    const globalCoinsStr = safeLocalStorage.getItem(`bs_party_global_coins_${id}`);
    const unlockedJson = safeLocalStorage.getItem(`bs_party_unlocked_${id}`);
    const activeAcc = safeLocalStorage.getItem(`bs_party_active_acc_${id}`);
    const lastClaimDate = safeLocalStorage.getItem(`bs_party_last_reward_claim_${id}`);
    const streakStr = safeLocalStorage.getItem(`bs_party_reward_streak_${id}`);
    
    const unlockedAchievementsJson = safeLocalStorage.getItem(`bs_party_unlocked_achiers_${id}`);
    const balloonWinsCountStr = safeLocalStorage.getItem(`bs_party_balloon_wins_${id}`);

    // Customized Name, Avatar emoji/name, and triggers
    const name = safeLocalStorage.getItem(`bs_party_player_name_${id}`);
    const emoji = safeLocalStorage.getItem(`bs_party_player_emoji_${id}`);
    const avatarName = safeLocalStorage.getItem(`bs_party_player_avatar_name_${id}`);
    const key = safeLocalStorage.getItem(`bs_party_player_key_${id}`);
    const keyLabel = safeLocalStorage.getItem(`bs_party_player_key_label_${id}`);

    const globalCoins = globalCoinsStr ? parseInt(globalCoinsStr, 10) : 0;
    const unlockedAccessories = unlockedJson ? JSON.parse(unlockedJson) : [];
    const rewardStreak = streakStr ? parseInt(streakStr, 10) : 0;
    
    const unlockedAchievements = unlockedAchievementsJson ? JSON.parse(unlockedAchievementsJson) : [];
    const balloonWinsCount = balloonWinsCountStr ? parseInt(balloonWinsCountStr, 10) : 0;

    return {
      customImage,
      globalCoins,
      unlockedAccessories,
      activeAccessory: activeAcc,
      lastRewardClaimDate: lastClaimDate,
      rewardStreak: rewardStreak,
      unlockedAchievements,
      balloonWinsCount,
      name,
      emoji,
      avatarName,
      key,
      keyLabel
    };
  } catch (e) {
    console.error("Local storage failed to load player data", e);
    return {
      customImage: null,
      globalCoins: 0,
      unlockedAccessories: [],
      activeAccessory: null,
      lastRewardClaimDate: null,
      rewardStreak: 0,
      unlockedAchievements: [],
      balloonWinsCount: 0,
      name: null,
      emoji: null,
      avatarName: null,
      key: null,
      keyLabel: null
    };
  }
}

function savePlayerPersistentData(player: Player) {
  try {
    const imageKey = `bs_party_custom_image_${player.id}`;
    const coinsKey = `bs_party_global_coins_${player.id}`;
    const unlockedKey = `bs_party_unlocked_${player.id}`;
    const activeAccKey = `bs_party_active_acc_${player.id}`;
    const claimDateKey = `bs_party_last_reward_claim_${player.id}`;
    const streakKey = `bs_party_reward_streak_${player.id}`;
    const achievementsKey = `bs_party_unlocked_achiers_${player.id}`;
    const balloonWinsKey = `bs_party_balloon_wins_${player.id}`;

    if (player.customImage) {
      safeLocalStorage.setItem(imageKey, player.customImage);
    } else {
      safeLocalStorage.removeItem(imageKey);
    }
    safeLocalStorage.setItem(coinsKey, (player.globalCoins || 0).toString());
    safeLocalStorage.setItem(unlockedKey, JSON.stringify(player.unlockedAccessories || []));
    if (player.activeAccessory) {
      safeLocalStorage.setItem(activeAccKey, player.activeAccessory);
    } else {
      safeLocalStorage.removeItem(activeAccKey);
    }
    if (player.lastRewardClaimDate) {
      safeLocalStorage.setItem(claimDateKey, player.lastRewardClaimDate);
    } else {
      safeLocalStorage.removeItem(claimDateKey);
    }
    safeLocalStorage.setItem(streakKey, (player.rewardStreak || 0).toString());
    
    safeLocalStorage.setItem(achievementsKey, JSON.stringify(player.unlockedAchievements || []));
    safeLocalStorage.setItem(balloonWinsKey, (player.balloonWinsCount || 0).toString());

    // Save Name, Avatar, and triggers
    safeLocalStorage.setItem(`bs_party_player_name_${player.id}`, player.name);
    safeLocalStorage.setItem(`bs_party_player_emoji_${player.id}`, player.emoji);
    if (player.avatarName) {
      safeLocalStorage.setItem(`bs_party_player_avatar_name_${player.id}`, player.avatarName);
    }
    safeLocalStorage.setItem(`bs_party_player_key_${player.id}`, player.key);
    safeLocalStorage.setItem(`bs_party_player_key_label_${player.id}`, player.keyLabel);

    // Auto check overall milestones on save (avoiding recursion)
    if ((player.globalCoins || 0) >= 100 && !player.unlockedAchievements?.includes('coin_lord_100')) {
      if (!player.unlockedAchievements) player.unlockedAchievements = [];
      player.unlockedAchievements.push('coin_lord_100');
      safeLocalStorage.setItem(achievementsKey, JSON.stringify(player.unlockedAchievements));
      const ach = ACHIEVEMENTS.find(a => a.id === 'coin_lord_100');
      if (ach) setTimeout(() => showAchievementToast(player, ach), 100);
    }
    if (player.unlockedAccessories && player.unlockedAccessories.length >= 3 && !player.unlockedAchievements?.includes('collector_3')) {
      if (!player.unlockedAchievements) player.unlockedAchievements = [];
      player.unlockedAchievements.push('collector_3');
      safeLocalStorage.setItem(achievementsKey, JSON.stringify(player.unlockedAchievements));
      const ach = ACHIEVEMENTS.find(a => a.id === 'collector_3');
      if (ach) setTimeout(() => showAchievementToast(player, ach), 150);
    }

    // Save asynchronously to Playgama Cloud Storage if available
    const bridge = (window as any).playgamaBridge;
    if (bridge && bridge.storage) {
      if (player.customImage) {
        setPlaygamaStorageValue(imageKey, player.customImage);
      } else {
        setPlaygamaStorageValue(imageKey, "");
      }
      setPlaygamaStorageValue(coinsKey, (player.globalCoins || 0).toString());
      setPlaygamaStorageValue(unlockedKey, JSON.stringify(player.unlockedAccessories || []));
      setPlaygamaStorageValue(activeAccKey, player.activeAccessory || "");
      setPlaygamaStorageValue(claimDateKey, player.lastRewardClaimDate || "");
      setPlaygamaStorageValue(streakKey, (player.rewardStreak || 0).toString());
      setPlaygamaStorageValue(achievementsKey, JSON.stringify(player.unlockedAchievements || []));
      setPlaygamaStorageValue(balloonWinsKey, (player.balloonWinsCount || 0).toString());
    }
    
    // Call custom subtle save notification toast
    showSavedToast();
  } catch (e) {
    console.error("Failed to save player persistent data", e);
  }
}

let lastSavedToastTime = 0;
function showSavedToast() {
  const now = Date.now();
  if (now - lastSavedToastTime < 3000) {
    return; // Limit toast to once every 3 seconds to avoid spamming the screen
  }
  lastSavedToastTime = now;

  const existing = document.getElementById('saved-toast-notification');
  if (existing) {
    existing.remove();
  }

  const container = document.getElementById('saved-toast-container') || (() => {
    const div = document.createElement('div');
    div.id = 'saved-toast-container';
    div.className = "fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-[240px] pointer-events-none select-none font-sans";
    document.body.appendChild(div);
    return div;
  })();

  const toast = document.createElement('div');
  toast.id = 'saved-toast-notification';
  toast.className = "pointer-events-auto bg-white border-2 border-black py-2 px-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 relative overflow-hidden animate-fade-in text-black";
  
  toast.innerHTML = `
    <div class="absolute left-0 top-0 bottom-0 w-1 bg-[#2ECC71]"></div>
    <span class="text-xs ml-1 select-none">💾</span>
    <div class="flex flex-col leading-none">
      <span class="text-[10px] font-black uppercase text-black">Veriler Kaydedildi</span>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.25)";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-15px) scale(0.9)";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2200);
}

function showAchievementToast(player: Player, achievement: Achievement) {
  const toastContainer = document.getElementById('achievement-toast-container') || (() => {
    const div = document.createElement('div');
    div.id = 'achievement-toast-container';
    div.className = "fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none select-none font-sans";
    document.body.appendChild(div);
    return div;
  })();

  const toast = document.createElement('div');
  toast.className = "pointer-events-auto bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3.5 relative overflow-hidden shrink-0";
  toast.style.animation = "slideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.25) forwards";

  if (!document.getElementById('achievement-slide-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'achievement-slide-styles';
    styleEl.innerHTML = `
      @keyframes slideIn {
        0% { transform: translateY(100px) scale(0.9); opacity: 0; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }
      @keyframes slideOut {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(50px) scale(0.9); opacity: 0; }
      }
    `;
    document.head.appendChild(styleEl);
  }

  toast.innerHTML = `
    <div class="absolute top-0 left-0 right-0 h-1.5 ${player.color} border-b-2 border-black"></div>
    <div class="w-12 h-12 flex items-center justify-center text-3xl shrink-0 bg-yellow-105 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
      ${achievement.badgeEmoji}
    </div>
    <div class="flex-1 text-left min-w-0 pr-2">
      <span class="block text-[8px] font-mono font-black tracking-wider text-black/50">${player.name} BAŞARI KAZANDI!</span>
      <h4 class="font-display font-black text-xs text-black uppercase tracking-tight truncate">${achievement.name}</h4>
      <p class="text-[9px] font-bold text-black/75 truncate mt-0.5">${achievement.description}</p>
    </div>
    <button class="text-xs font-black p-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black rounded-none cursor-pointer text-black" onclick="this.parentElement.remove()">
      ✕
    </button>
  `;

  toastContainer.appendChild(toast);

  try {
    sfx.playPowerUp();
  } catch (e) {
    console.warn("Could not play custom audio banner sfx", e);
  }

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s cubic-bezier(0.175, 0.885, 0.32, 1) forwards";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
}

function checkAndAwardAchievement(player: Player, achievementId: string) {
  if (!player.unlockedAchievements) {
    player.unlockedAchievements = [];
  }
  if (player.unlockedAchievements.includes(achievementId)) {
    return;
  }

  const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!ach) return;

  player.unlockedAchievements.push(achievementId);
  savePlayerPersistentData(player);
  showAchievementToast(player, ach);
}

function resizeAndSetCustomImage(playerId: number, file: File, callback: (resizedBase64: string) => void) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 120;
      const MAX_HEIGHT = 120;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82); // High-quality mini image
        callback(dataUrl);
      } else {
        callback(event.target?.result as string);
      }
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function getRoundEliminationStatus(sortedRoundPlayers: Player[]): { [id: number]: { status: 'advanced' | 'eliminated' | 'champion', label: string, colorClass: string } } {
  const result: { [id: number]: { status: 'advanced' | 'eliminated' | 'champion', label: string, colorClass: string } } = {};
  if (!state.isEliminationMode) return result;

  const count = sortedRoundPlayers.length;
  sortedRoundPlayers.forEach((p, idx) => {
    let status: 'advanced' | 'eliminated' | 'champion' = 'advanced';
    let label = '🟢 ÜST TURA ÇIKTI';
    let colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-500';

    if (count === 5) {
      if (idx >= 3) {
        status = 'eliminated';
        label = '❌ ELENDİ';
        colorClass = 'bg-red-100 text-red-800 border-red-500 line-through';
      }
    } else if (count === 4) {
      if (idx >= 2) {
        status = 'eliminated';
        label = '❌ ELENDİ';
        colorClass = 'bg-red-100 text-red-800 border-red-500 line-through';
      }
    } else if (count === 3) {
      if (idx >= 2) {
        status = 'eliminated';
        label = '❌ ELENDİ';
        colorClass = 'bg-red-100 text-red-800 border-red-500 line-through';
      }
    } else if (count === 2) {
      if (idx === 0) {
        status = 'champion';
        label = '👑 BÜYÜK ŞAMPİYON';
        colorClass = 'bg-yellow-100 text-yellow-850 border-yellow-500 animate-bounce';
      } else {
        status = 'eliminated';
        label = '❌ ELENDİ';
        colorClass = 'bg-red-100 text-red-850 border-red-500 line-through';
      }
    }

    result[p.id] = { status, label, colorClass };
  });

  return result;
}

function getPlayerAvatarHTML(player: Player, extraClasses = "w-16 h-16 text-3xl") {
  const isBig = extraClasses.includes('w-24') || extraClasses.includes('w-32') || extraClasses.includes('w-20');
  
  let avatarContent = '';
  if (player.customImage) {
    avatarContent = `<img src="${player.customImage}" class="w-full h-full object-cover rounded-full" alt="avatar" />`;
  } else {
    avatarContent = `<span class="select-none font-sans font-black">${player.emoji}</span>`;
  }

  let accessoryHTML = '';
  if (player.activeAccessory) {
    const item = SHOP_ITEMS.find(i => i.id === player.activeAccessory);
    if (item) {
      let accStyle = '';
      if (item.type === 'hat') {
        const topOffset = isBig ? '-top-6' : '-top-4.5';
        const fontSize = isBig ? 'text-4.5xl' : 'text-2.5xl';
        accStyle = `absolute ${topOffset} left-1/2 -translate-x-1/2 ${fontSize} select-none pointer-events-none drop-shadow-[2px_2px_0_rgba(0,0,0,1)] z-10`;
      } else if (item.type === 'glasses') {
        const topOffset = isBig ? 'top-6.5' : 'top-3';
        const fontSize = isBig ? 'text-4xl' : 'text-xl';
        accStyle = `absolute ${topOffset} left-1/2 -translate-x-1/2 ${fontSize} select-none pointer-events-none z-10`;
      } else if (item.type === 'mask') {
        const topOffset = isBig ? 'top-8.5' : 'top-4.5';
        const fontSize = isBig ? 'text-4.5xl' : 'text-2xl';
        accStyle = `absolute ${topOffset} left-1/2 -translate-x-1/2 ${fontSize} select-none pointer-events-none z-10`;
      } else {
        const topOffset = isBig ? '-top-5' : '-top-3';
        const fontSize = isBig ? 'text-3xl' : 'text-xl';
        accStyle = `absolute ${topOffset} left-1/2 -translate-x-1/2 ${fontSize} select-none pointer-events-none z-10`;
      }
      accessoryHTML = `<span class="${accStyle}">${item.emoji}</span>`;
    }
  }

  const hasBgClass = extraClasses.includes('bg-');
  const bgClass = hasBgClass ? '' : player.color;

  return `
    <div class="relative ${extraClasses} ${bgClass} rounded-full border-4 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-visible shrink-0 select-none">
      ${avatarContent}
      ${accessoryHTML}
    </div>
  `;
}

// All available avatars
const AVATARS = [
  { name: 'Ateş Topu', emoji: '🔥', description: 'Hızlı ve yakıcı!' },
  { name: 'Su Damlası', emoji: '💧', description: 'Sakin ama dalgalı!' },
  { name: 'Rüzgar Gülü', emoji: '🌀', description: 'Tahmin edilemez esinti!' },
  { name: 'Yıldırım', emoji: '⚡', description: 'Göz açıp kapayıncaya kadar!' },
  { name: 'Orman Şamanı', emoji: '🌿', description: 'Doğanın öfkesi!' },
  { name: 'Altın Taç', emoji: '👑', description: 'Asil bir şampiyon!' },
  { name: 'Demir Kalkan', emoji: '🛡️', description: 'Yıkılmaz savunma!' },
  { name: 'Uzay Roketi', emoji: '🚀', description: 'Sınırların ötesinde!' }
];

// --- SOUND ENGINE (Web Audio API) ---
class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    this.isMuted = safeLocalStorage.getItem('sfx_global_muted') === 'true';
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    safeLocalStorage.setItem('sfx_global_muted', this.isMuted ? 'true' : 'false');
    return this.isMuted;
  }

  isSoundMuted(): boolean {
    return this.isMuted;
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playPop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    // Pop high pitch tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.12);
  }

  playSuccess() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Nice double chime
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.1, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.06 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  }

  playFail() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.25);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.25);
  }

  playExplode() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Low frequency blast + noise
    try {
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(10, now + 0.4);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
      noise.stop(now + 0.4);
    } catch (e) {
      // Fallback tone explosion
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.4);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.4);
    }
  }

  playPowerUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Retro upward sliding sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.15);
  }

  playFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [349.23, 440.00, 523.25], // F major
      [392.00, 493.88, 587.33], // G major
      [523.25, 659.25, 783.99]  // C major octave up!
    ];
    
    chords.forEach((chord, chordIdx) => {
      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + chordIdx * 0.2);
        gain.gain.setValueAtTime(0.08, now + chordIdx * 0.2);
        gain.gain.linearRampToValueAtTime(0.001, now + chordIdx * 0.2 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + chordIdx * 0.2);
        osc.stop(now + chordIdx * 0.2 + 0.4);
      });
    });
  }
}

const sfx = new AudioEngine();

// --- INITIAL GAME STATE ---
let state: GameState = {
  playerCount: 4,
  gamePlaylist: [],
  playlistActive: false,
  currentPlaylistIndex: 0,
  isEliminationMode: false,
  isMobileMode: safeLocalStorage.getItem('bs_party_is_mobile_mode') === 'true' || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  players: [
    {
      id: 1,
      name: 'Oyuncu 1',
      color: 'bg-[#FF6B6B]',
      hexColor: '#FF6B6B',
      borderColor: 'border-black',
      textColor: 'text-black',
      glowClass: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      emoji: '🔥',
      avatarName: 'Ateş Topu',
      score: 0,
      key: 'KeyA',
      keyLabel: 'A',
      active: true
    },
    {
      id: 2,
      name: 'Oyuncu 2',
      color: 'bg-[#4ECDC4]',
      hexColor: '#4ECDC4',
      borderColor: 'border-black',
      textColor: 'text-black',
      glowClass: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      emoji: '💧',
      avatarName: 'Su Damlası',
      score: 0,
      key: 'KeyL',
      keyLabel: 'L',
      active: true
    },
    {
      id: 3,
      name: 'Oyuncu 3',
      color: 'bg-[#A29BFE]',
      hexColor: '#A29BFE',
      borderColor: 'border-black',
      textColor: 'text-black',
      glowClass: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      emoji: '🌿',
      avatarName: 'Orman Şamanı',
      score: 0,
      key: 'KeyZ',
      keyLabel: 'Z',
      active: true
    },
    {
      id: 4,
      name: 'Oyuncu 4',
      color: 'bg-[#FDCB6E]',
      hexColor: '#FDCB6E',
      borderColor: 'border-black',
      textColor: 'text-black',
      glowClass: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      emoji: '⚡',
      avatarName: 'Yıldırım',
      score: 0,
      key: 'KeyM',
      keyLabel: 'M',
      active: true
    },
    {
      id: 5,
      name: 'Oyuncu 5',
      color: 'bg-[#FF85A2]',
      hexColor: '#FF85A2',
      borderColor: 'border-black',
      textColor: 'text-black',
      glowClass: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      emoji: '🎀',
      avatarName: 'Sevimli Fiyonk',
      score: 0,
      key: 'KeyP',
      keyLabel: 'P',
      active: false
    }
  ],
  currentScreen: 'lobby',
  scores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
};

// Initialize player dynamic/persistent properties from localStorage
state.players.forEach(p => {
  const persisted = loadPlayerPersistentData(p.id);
  p.customImage = persisted.customImage;
  p.globalCoins = persisted.globalCoins;
  p.unlockedAccessories = persisted.unlockedAccessories;
  p.activeAccessory = persisted.activeAccessory;
  p.lastRewardClaimDate = persisted.lastRewardClaimDate;
  p.rewardStreak = persisted.rewardStreak;
  p.unlockedAchievements = persisted.unlockedAchievements || [];
  p.balloonWinsCount = persisted.balloonWinsCount || 0;

  if (persisted.name) p.name = persisted.name;
  if (persisted.emoji) p.emoji = persisted.emoji;
  if (persisted.avatarName) p.avatarName = persisted.avatarName;
  if (persisted.key) p.key = persisted.key;
  if (persisted.keyLabel) p.keyLabel = persisted.keyLabel;
});

// Global UI reference
const appRoot = document.getElementById('root') || document.body;

function renderGlobalMuteToggle(parent: HTMLElement) {
  const isMuted = sfx.isSoundMuted();
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'global-sound-toggle';
  toggleBtn.className = "absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-50 flex items-center justify-center gap-1 px-2 py-1 bg-[#FFEAA7] hover:bg-black hover:text-white text-black border-2 border-black font-sans font-black text-[9px] sm:text-[10px] uppercase tracking-wider cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all select-none";
  toggleBtn.innerHTML = isMuted ? `🔇 <span class="text-[8px] font-bold">KAPALI</span>` : `🔊 <span class="text-[8px] font-bold">AÇIK</span>`;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const nowMuted = sfx.toggleMute();
    toggleBtn.innerHTML = nowMuted ? `🔇 <span class="text-[8px] font-bold">KAPALI</span>` : `🔊 <span class="text-[8px] font-bold">AÇIK</span>`;
    if (!nowMuted) {
      sfx.playTick();
    }
  });

  parent.appendChild(toggleBtn);
}

// --- UTILITY RENDERER ---
function handleGameFinished() {
  if (state.isEliminationMode) {
    const remaining = state.players.filter(p => p.active && !p.isEliminated).length;
    if (remaining <= 1) {
      // Tournament completed! Go to global leaderboards to see who won!
      state.playlistActive = false;
      state.gamePlaylist = [];
      state.currentPlaylistIndex = 0;
      sfx.playFanfare();
      setScreen('gameOver');
      return;
    }
  }

  if (state.playlistActive && state.gamePlaylist && state.gamePlaylist.length > 0) {
    state.currentPlaylistIndex = (state.currentPlaylistIndex || 0) + 1;
    if (state.currentPlaylistIndex < state.gamePlaylist.length) {
      const nextGame = state.gamePlaylist[state.currentPlaylistIndex];
      setScreen(nextGame);
      return;
    } else {
      // Playlist completed! Reset and go to global leaderboards to see who won the tournament!
      state.playlistActive = false;
      state.gamePlaylist = [];
      state.currentPlaylistIndex = 0;
      sfx.playFanfare();
      setScreen('gameOver');
      return;
    }
  }
  // Default fallback
  setScreen('gamesHub');
}

function setScreen(newScreen: GameState['currentScreen']) {
  sfx.playTick();
  
  const oldScreen = state.currentScreen;
  const isMiniGame = (screen: string) => ['balloonGame', 'memoryGame', 'colorTrapGame', 'clickDerbyGame', 'raceGame', 'bombGame', 'mathDashGame'].includes(screen);
  const bridge = (window as any).playgamaBridge;

  // 1. Leaving a mini-game to return to hub
  if (isMiniGame(oldScreen) && !isMiniGame(newScreen)) {
    if (bridge && bridge.game) {
      try {
        bridge.game.gameplayStop();
      } catch (e) {
        console.warn("Playgama gameplayStop failed", e);
      }
    }
    // Present Interstitial Ads on game exits
    triggerPlaygamaAd();
  }

  // 2. Entering a mini-game
  if (!isMiniGame(oldScreen) && isMiniGame(newScreen)) {
    if (bridge && bridge.game) {
      try {
        bridge.game.gameplayStart();
      } catch (e) {
        console.warn("Playgama gameplayStart failed", e);
      }
    }
  }

  // 3. Entering the final gameOver podium page
  if (newScreen === 'gameOver') {
    triggerPlaygamaAd();
  }

  state.currentScreen = newScreen;
  render();
}

function render() {
  appRoot.className = "min-h-screen brutalist-grid-bg text-black relative flex flex-col items-center justify-center p-3 sm:p-6 font-sans select-none border-[8px] sm:border-[16px] border-black overflow-x-hidden";
  
  // Clean container
  appRoot.innerHTML = '';
  
  const ambientGrid = document.createElement('div');
  ambientGrid.className = "absolute inset-0 pointer-events-none overflow-hidden z-0";
  appRoot.appendChild(ambientGrid);

  // Render content according to state
  switch (state.currentScreen) {
    case 'lobby':
      renderLobby();
      renderGlobalMuteToggle(appRoot);
      break;
    case 'charSelect':
      renderCharSelect();
      break;
    case 'gamesHub':
      renderGamesHub();
      renderGlobalMuteToggle(appRoot);
      break;
    case 'balloonGame':
      renderBalloonGame();
      break;
    case 'memoryGame':
      renderMemoryGame();
      break;
    case 'colorTrapGame':
      renderColorTrapGame();
      break;
    case 'clickDerbyGame':
      renderClickDerbyGame();
      break;
    case 'raceGame':
      renderRaceGame();
      break;
    case 'bombGame':
      renderBombGame();
      break;
    case 'mathDashGame':
      renderMathDashGame();
      break;
    case 'gameOver':
      renderGameOver();
      break;
    case 'costumeShop':
      renderCostumeShop();
      break;
  }
}

// ==========================================
// DAILY LOGIN BONUS SYSTEM
// ==========================================
let activeBonusPlayerId = 1;

function hasAnyUnclaimedBonus(): boolean {
  const today = new Date();
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return state.players.filter(p => p.active).some(p => p.lastRewardClaimDate !== todayDateString);
}

function renderDailyBonusModal() {
  const modalId = 'daily-bonus-modal';
  const existing = document.getElementById(modalId);
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = modalId;
  overlay.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none antialiased";

  const activePlayers = state.players.filter(p => p.active);
  let activePlayer = activePlayers.find(p => p.id === activeBonusPlayerId);
  if (!activePlayer) {
    activePlayer = activePlayers[0] || state.players[0];
    activeBonusPlayerId = activePlayer.id;
  }

  const lastClaimStr = activePlayer.lastRewardClaimDate || '';
  const currentStreak = activePlayer.rewardStreak || 0;

  const today = new Date();
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateString = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  let hasClaimedToday = false;
  let currentDayOfStreak = 1;
  let canClaim = false;

  if (lastClaimStr === todayDateString) {
    hasClaimedToday = true;
    canClaim = false;
    currentDayOfStreak = currentStreak || 1;
  } else if (lastClaimStr === yesterdayDateString) {
    hasClaimedToday = false;
    canClaim = true;
    currentDayOfStreak = (currentStreak >= 7) ? 1 : currentStreak + 1;
  } else {
    hasClaimedToday = false;
    canClaim = true;
    currentDayOfStreak = 1;
  }

  const rewards = [5, 10, 15, 20, 25, 30, 50];

  const modalBox = document.createElement('div');
  modalBox.className = "w-full max-w-xl bg-white border-4 border-black p-5 sm:p-7 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative text-black scale-95 opacity-0 animate-scale-up";
  modalBox.style.animation = "scaleUp 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards";

  let playerSelectorHTML = '';
  if (activePlayers.length > 1) {
    playerSelectorHTML = `
      <div class="flex flex-wrap gap-1.5 justify-center mb-5 border-b-2 border-dashed border-black pb-4">
        ${activePlayers.map(p => {
          const isSelected = p.id === activeBonusPlayerId;
          const pLastClaim = p.lastRewardClaimDate || '';
          const pCanClaim = pLastClaim !== todayDateString;
          return `
            <button data-player-id="${p.id}" class="bonus-player-tab px-3 py-1.5 border-2 border-black font-black uppercase text-[10px] tracking-wide relative duration-100 cursor-pointer ${
              isSelected 
                ? 'bg-black text-white' 
                : `${p.color} text-black hover:bg-black hover:text-white`
            }">
              <div class="flex items-center gap-1">
                <span>${p.customImage ? '🖼️' : p.emoji}</span>
                <span>${p.name}</span>
                ${pCanClaim ? `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-black rounded-full animate-ping"></span><span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-black rounded-full"></span>` : ''}
              </div>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  let dayCardsHTML = '';
  for (let i = 1; i <= 7; i++) {
    const rewardAmt = rewards[i - 1];
    let cardClass = '';
    let badgeText = '';
    let checkedHTML = '';

    if (hasClaimedToday) {
      if (i < currentDayOfStreak) {
        cardClass = 'bg-[#E5F6FD] border-gray-400 text-gray-500 opacity-60';
        badgeText = 'ALINDI';
        checkedHTML = `
          <div class="absolute inset-0 flex items-center justify-center bg-black/5">
            <span class="text-3xl text-emerald-500 font-bold rotate-[-10deg] drop-shadow-[1px_1px_0_rgba(0,0,0,1)] select-none">✅</span>
          </div>
        `;
      } else if (i === currentDayOfStreak) {
        cardClass = 'bg-emerald-100 border-[#4ECDC4] text-[#2D3748] ring-4 ring-[#4ECDC4]/30 scale-105';
        badgeText = 'BUGÜN';
        checkedHTML = `
          <div class="absolute inset-0 flex items-center justify-center bg-black/5">
            <span class="text-3xl text-emerald-500 font-bold rotate-[-10deg] drop-shadow-[1px_1px_0_rgba(0,0,0,1)] select-none">✅</span>
          </div>
        `;
      } else {
        cardClass = 'bg-neutral-50 border-[#E2E8F0] text-gray-400';
        badgeText = `Gün ${i}`;
      }
    } else {
      if (i < currentDayOfStreak) {
        cardClass = 'bg-[#E5F6FD] border-[#93C5FD] text-gray-400 opacity-65';
        badgeText = 'ALINDI';
        checkedHTML = `
          <div class="absolute inset-0 flex items-center justify-center bg-black/5">
            <span class="text-3xl text-emerald-500 font-bold rotate-[-10deg] drop-shadow-[1px_1px_0_rgba(0,0,0,1)] select-none">✅</span>
          </div>
        `;
      } else if (i === currentDayOfStreak) {
        cardClass = 'bg-[#FFEAA7] border-black text-[#2D3748] border-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] scale-105 animate-pulse-gentle relative z-10 font-bold';
        badgeText = 'KAZAN!';
      } else {
        cardClass = 'bg-neutral-50 border-[#E2E8F0] font-medium text-gray-400';
        badgeText = `Gün ${i}`;
      }
    }

    const isDay7 = i === 7;
    const sizeStyle = isDay7 ? 'col-span-2 sm:col-span-1' : '';

    dayCardsHTML += `
      <div class="relative rounded-none border-2 border-black p-3 flex flex-col items-center justify-between min-h-[105px] overflow-hidden ${cardClass} ${sizeStyle} transition-all">
        <span class="text-[9px] font-mono font-black uppercase tracking-wider relative z-10">${badgeText}</span>
        ${checkedHTML}
        <div class="my-1.5 flex flex-col items-center relative z-10">
          <span class="text-2xl drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">${isDay7 ? '🎁' : '🪙'}</span>
          <span class="font-display font-black text-xs text-black mt-0.5">${rewardAmt} Coin</span>
        </div>
      </div>
    `;
  }

  let claimActionAreaHTML = '';
  if (canClaim) {
    const claimRewardAmt = rewards[currentDayOfStreak - 1];
    claimActionAreaHTML = `
      <button id="bonus-claim-btn" class="w-full py-4 bg-[#4ECDC4] hover:bg-black hover:text-white text-black border-4 border-black font-display font-black text-sm uppercase tracking-wider cursor-pointer shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none hover:shadow-[4px_4px_0_rgba(0,0,0,1)] transition-transform select-none flex items-center justify-center gap-2">
        <span>⚡ ÖDÜLÜ AL (+${claimRewardAmt} COIN)</span>
      </button>
    `;
  } else {
    claimActionAreaHTML = `
      <div class="w-full bg-emerald-100 border-4 border-black p-3.5 text-center shadow-[4px_4px_0_rgba(0,0,0,1)] text-black rotate-[0.5deg]">
        <div class="font-display font-black text-sm uppercase text-emerald-800">🎉 BUGÜNÜN ÖDÜLÜ ALINDI!</div>
        <p class="text-[10px] font-bold text-black/70 mt-0.5">Yarının hediyesi için 24 saat sonra tekrar gel!</p>
      </div>
    `;
  }

  modalBox.innerHTML = `
    <!-- Decorative Header ribbon -->
    <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 border-2 border-black bg-[#A29BFE] text-black font-display text-xs tracking-wider uppercase font-black rotate-[-1deg] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      📅 GÜNLÜK AKTİVİTE ÖDÜLÜ
    </div>

    <!-- Close button -->
    <button id="bonus-close-btn" class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white text-black font-black font-display text-sm cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none select-none">
      ✕
    </button>

    <!-- Modal Title -->
    <div class="text-center mt-3 mb-4">
      <h3 class="text-2xl sm:text-3xl font-display font-black text-black uppercase leading-tight select-none">
        Hediyeler & Bonuslar
      </h3>
      <p class="text-[10px] sm:text-xs font-semibold text-black/75 max-w-sm mx-auto leading-relaxed mt-1">
        Her gün giriş yaparak hediyeni topla! 7 gün üst üste geldiğinde dev bonus paketini kazanacaksın!
      </p>
    </div>

    ${playerSelectorHTML}

    <!-- Reward streak tracker banner -->
    <div class="bg-[#FFF9C4] border-3 border-black p-3 flex items-center justify-between mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black rotate-[-0.5deg]">
      <div class="text-left">
        <span class="block text-[8px] font-mono font-black text-black/50 uppercase tracking-widest leading-none">AKTİF SERİ TAKİBİ</span>
        <div class="text-sm font-black mt-0.5 text-black">Ateş Serisi: <span class="text-orange-500 font-display">${currentStreak} Gün 🔥</span></div>
      </div>
      <div class="text-right text-[10px] font-bold text-black/70 leading-tight">
        Son Alım: <span class="font-mono text-black font-extrabold">${lastClaimStr || 'İlk Kez! 🚀'}</span>
      </div>
    </div>

    <div class="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
      ${dayCardsHTML}
    </div>

    <div class="w-full">
      ${claimActionAreaHTML}
    </div>

    <p class="text-center text-[9px] font-mono font-black text-black/45 uppercase tracking-widest mt-4">
      *Serinizi bozmamak için her gün giriş yapmalısınız
    </p>
  `;

  overlay.appendChild(modalBox);
  appRoot.appendChild(overlay);

  if (!document.getElementById('bonus-animation-style')) {
    const style = document.createElement('style');
    style.id = 'bonus-animation-style';
    style.innerHTML = `
      @keyframes scaleUp {
        0% { transform: scale(0.95); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      .animate-pulse-gentle {
        animation: pulseGentle 1.6s infinite alternate cubic-bezier(0.4, 0, 0.6, 1);
      }
      @keyframes pulseGentle {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.025); filter: brightness(1.03); }
      }
    `;
    document.head.appendChild(style);
  }

  const tabButtons = overlay.querySelectorAll('.bonus-player-tab');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = parseInt(btn.getAttribute('data-player-id') || '1', 10);
      activeBonusPlayerId = pId;
      sfx.playTick();
      renderDailyBonusModal();
    });
  });

  const closeBtn = overlay.querySelector('#bonus-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      sfx.playTick();
      overlay.remove();
    });
  }

  const claimBtn = overlay.querySelector('#bonus-claim-btn');
  if (claimBtn) {
    claimBtn.addEventListener('click', () => {
      sfx.playSuccess();
      const currentReward = rewards[currentDayOfStreak - 1];
      activePlayer.globalCoins = (activePlayer.globalCoins || 0) + currentReward;
      activePlayer.lastRewardClaimDate = todayDateString;
      activePlayer.rewardStreak = currentDayOfStreak;
      if (activePlayer.rewardStreak >= 3) {
        checkAndAwardAchievement(activePlayer, 'streak_3');
      }
      savePlayerPersistentData(activePlayer);

      const splash = document.createElement('div');
      splash.className = "absolute inset-0 bg-yellow-400 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in border-8 border-black";
      splash.innerHTML = `
        <div class="text-7xl animate-bounce mb-4">🪙💥</div>
        <h3 class="text-4xl font-display font-black text-black uppercase tracking-tight">KAZANDIN!</h3>
        <p class="text-lg font-bold text-black mt-2 leading-relaxed">
          ${activePlayer.name} hesabına tam <span class="bg-black text-white px-2.5 py-1 font-mono font-black">${currentReward} COIN</span> yüklendi!
        </p>
        <p class="text-xs text-black/60 font-mono mt-4 uppercase font-black font-semibold">Yarın yine gel ve ödülünü büyüt!</p>
        
        <button id="splash-continue-btn" class="mt-8 px-6 py-3 bg-black hover:bg-white border-2 border-black text-white hover:text-black font-display font-black text-xs uppercase tracking-wider cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
          MÜKEMMEL! DEVAM ET ⚡
        </button>
      `;

      modalBox.appendChild(splash);

      const splashContBtn = splash.querySelector('#splash-continue-btn');
      if (splashContBtn) {
        splashContBtn.addEventListener('click', () => {
          sfx.playTick();
          splash.remove();
          renderDailyBonusModal();
          render();
        });
      }
    });
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      sfx.playTick();
      overlay.remove();
    }
  });
}

// ==========================================
// NASIL OYNANIR (HOW TO PLAY) HELP MODAL
// ==========================================
function renderHowToPlayModal(initialTab = 'general') {
  const modalId = 'how-to-play-modal';
  const existing = document.getElementById(modalId);
  if (existing) {
    existing.remove();
  }

  // Active timers tracker for modal cleaning
  let activeIntervals: any[] = [];
  function clearModalTimers() {
    activeIntervals.forEach(t => clearInterval(t));
    activeIntervals = [];
  }

  const overlay = document.createElement('div');
  overlay.id = modalId;
  overlay.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none antialiased text-black";

  const modalBox = document.createElement('div');
  modalBox.className = "w-full max-w-2xl bg-white border-4 border-black p-4 sm:p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative text-black scale-95 opacity-0 animate-scale-up flex flex-col max-h-[90vh]";
  modalBox.style.animation = "scaleUp 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards";

  overlay.appendChild(modalBox);
  appRoot.appendChild(overlay);

  // Tab definitions
  const tabs = [
    { id: 'general', label: '📢 Genel Bilgi' },
    { id: 'memory', label: '🧩 Hafıza Kartları' },
    { id: 'balloon', label: '🎈 Balon Şişirme' },
    { id: 'colorTrap', label: '🎨 Renk Tuzağı' },
    { id: 'clickDerby', label: '⚡ Işık Avcısı' },
  ];

  let currentTab = initialTab;

  function renderTabContent() {
    clearModalTimers();
    
    // Clear inner contents before rebuilding
    modalBox.innerHTML = `
      <!-- Decorative Header ribbon -->
      <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 border-2 border-black bg-[#FFD2E8] text-black font-display text-[10px] sm:text-xs tracking-wider uppercase font-black rotate-[-1deg] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
        📖 OYUN REHBERİ & PRATİK ALANI
      </div>

      <!-- Close button -->
      <button id="how-close-btn" class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white text-black font-black font-display text-sm cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none select-none z-10">
        ✕
      </button>

      <div class="mt-4 mb-3 shrink-0">
        <h3 class="text-xl sm:text-2xl font-display font-black text-black uppercase leading-tight select-none">
          Oyun Kontrolleri & Kurallar
        </h3>
        <p class="text-[10px] sm:text-xs font-semibold text-black/70 mt-1">
          Turnuva öncesi kuralları öğren ve aşağıdaki <b class="text-[#FF6B6B]">"Pratik Deneme Alanı"</b> üzerinde kendini test et!
        </p>
      </div>

      <!-- Tabs Bar -->
      <div class="flex flex-wrap gap-1 sm:gap-1.5 border-b-2 border-black pb-3 mb-3 shrink-0">
        ${tabs.map(t => {
          const isSelected = t.id === currentTab;
          return `
            <button data-tab-id="${t.id}" class="how-tab-btn px-2 sm:px-3 py-1 sm:py-1.5 border-2 border-black text-black font-black uppercase text-[9px] sm:text-[10px] tracking-wide relative duration-100 cursor-pointer shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] ${
              isSelected 
                ? 'bg-black text-white hover:bg-black hover:text-white' 
                : 'bg-white hover:bg-black hover:text-white'
            }">
              <span>${t.label}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Content Chamber -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-4 text-left" id="how-content-chamber">
        <!-- Content gets programmatically injected below -->
      </div>
    `;

    // Reattach tabs listeners
    const tabBtns = modalBox.querySelectorAll('.how-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab-id') || 'general';
        currentTab = tabId;
        sfx.playTick();
        renderTabContent();
      });
    });

    // Reattach close listener
    const closeBtn = modalBox.querySelector('#how-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        sfx.playTick();
        clearModalTimers();
        overlay.remove();
      });
    }

    const chamber = modalBox.querySelector('#how-content-chamber') as HTMLDivElement;
    if (!chamber) return;

    // Inside tab content, render and initialize listeners
    if (currentTab === 'general') {
      chamber.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div class="md:col-span-3 space-y-3">
            <div class="space-y-2 text-xs sm:text-sm leading-relaxed">
              <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
                🏟️ Arena Turnuva Düzenlemesi
              </h4>
              <p class="font-semibold text-black/80">
                Bu turnuva, birden fazla oyuncunun en yüksek skoru kaparak zafer basamağına tırmandığı hızlı refleks ve zeka testidir!
              </p>
              <ul class="space-y-2 list-none pl-1 text-[11px] sm:text-xs font-bold text-black/90">
                <li class="flex items-start gap-1.5">
                  <span class="text-emerald-500 font-extrabold">✔</span>
                  <span><b>Playlist Kuyruğu:</b> Ana ekranda istediğin oyunları sıraya ekleyip sırayla kesintisiz bir turnuva maratonuna başlayabilirsin.</span>
                </li>
                <li class="flex items-start gap-1.5">
                  <span class="text-[#FF6B6B] font-extrabold">✔</span>
                  <span><b>Mağaza & Özelleştirme:</b> Her oyundan kazandığın 🪙 Altınlar ile Mağazaya girip oyuncun için eğlenceli şapkalar, kostümler ve yeni karakter stilleri satın alabilirsin!</span>
                </li>
                <li class="flex items-start gap-1.5">
                  <span class="text-blue-500 font-extrabold">✔</span>
                  <span><b>Kürsü Ödülleri:</b> Turnuva sonlandığında genel liderlik tablosu kesinleşir ve en büyük kupa şampiyona gider!</span>
                </li>
              </ul>
            </div>
            
            <div class="p-3 bg-indigo-50 border-2 border-black flex gap-2 items-center">
              <div class="text-2xl shrink-0">🛍️</div>
              <div class="text-[10px] sm:text-[11px] font-bold text-indigo-900 leading-normal">
                <b>İPUCU:</b> Ana ekranda bulunan "🎁 GÜNLÜK HEDİYE" kutusundan her gün ücretsiz gold toplayarak mağaza koleksiyonunu hızla tamamla!
              </div>
            </div>
          </div>

          <div class="md:col-span-2 bg-[#F9F9FB] border-4 border-black p-4 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <span class="text-[8px] font-mono font-black text-black/45 uppercase tracking-widest block mb-1">ARENA KOSTÜM REHBERİ</span>
            <div class="text-4xl animate-bounce my-2 select-none">👑👒🧣</div>
            <div class="font-semibold text-[11px] text-black/85">
              Hemen bir oyuna gir ve rakiplerini yenerek lig bonus puanları elde et!
            </div>
            <div class="mt-4 pt-2 border-t-2 border-dashed border-black/20 flex flex-wrap justify-center gap-1">
              <span class="text-[9px] font-black border border-black bg-[#FFEAA7] px-1 shadow-[1px_1px_0_rgba(0,0,0,1)]">Taktik</span>
              <span class="text-[9px] font-black border border-black bg-[#D2E8FF] px-1 shadow-[1px_1px_0_rgba(0,0,0,1)]">Hız</span>
              <span class="text-[9px] font-black border border-black bg-[#FFD2E8] px-1 shadow-[1px_1px_0_rgba(0,0,0,1)]">Hafıza</span>
            </div>
          </div>
        </div>
      `;
    } 
    else if (currentTab === 'memory') {
      chamber.innerHTML = `
        <div class="space-y-3.5">
          <div class="text-xs sm:text-sm leading-relaxed">
            <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
              🧩 Hafıza Kartları (Memory Pairs)
            </h4>
            <p class="font-semibold text-black/80">
              Oyun tahtasında kapalı duran kartları sırayla aç. Eğer aynı iki simgeyi arka arkaya bulursan, puanı kaparsın! Rakiplerinin açtığı kartları iyi gözlemle ve nerede olduklarını ezberle.
            </p>
          </div>

          <!-- Dynamic Interaction Box -->
          <div class="border-4 border-black bg-purple-50 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center">
            <h5 class="text-[10px] font-black uppercase text-indigo-700 mb-2 tracking-wider">🛠️ PRATİK DENEME ALANI (2x2 Mini Kartlar)</h5>
            
            <div class="grid grid-cols-2 gap-3 w-32" id="pract-mem-grid">
              <!-- Dynamically populated below -->
            </div>

            <div id="pract-mem-status" class="mt-3 font-bold text-[11px] sm:text-xs text-black text-center min-h-[1.25rem]">
              Bir kart seçerek eşleştirmeye başla!
            </div>
          </div>
        </div>
      `;

      const symbols = ['🍏', '🍇', '🍏', '🍇'];
      const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      const grid = chamber.querySelector('#pract-mem-grid') as HTMLDivElement;
      const status = chamber.querySelector('#pract-mem-status') as HTMLDivElement;

      let selectedList: { btn: HTMLButtonElement, symbol: string, index: number }[] = [];
      let solvedIndexes: number[] = [];

      order.forEach((symIdx) => {
        const btn = document.createElement('button');
        btn.className = "w-12 h-12 border-3 border-black bg-white flex items-center justify-center text-xl font-bold hover:bg-[#A29BFE]/40 transition duration-150 cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] hover:-translate-y-[1px]";
        btn.innerText = '❓';
        
        btn.addEventListener('click', () => {
          const symStr = symbols[symIdx];
          if (solvedIndexes.includes(symIdx) || selectedList.some(s => s.index === symIdx) || selectedList.length >= 2) return;

          sfx.playTick();
          btn.innerText = symStr;
          btn.className = "w-12 h-12 border-3 border-black bg-white flex items-center justify-center text-xl font-bold shadow-inner" + " bg-indigo-100";

          selectedList.push({ btn, symbol: symStr, index: symIdx });

          if (selectedList.length === 2) {
            const [first, second] = selectedList;
            if (first.symbol === second.symbol) {
              solvedIndexes.push(first.index, second.index);
              selectedList = [];
              sfx.playSuccess();
              first.btn.className = "w-12 h-12 border-3 border-black bg-emerald-100 flex items-center justify-center text-xl font-bold shadow-[2px_2px_0_rgba(0,0,0,1)] scale-105 pointer-events-none duration-150";
              second.btn.className = "w-12 h-12 border-3 border-black bg-emerald-100 flex items-center justify-center text-xl font-bold shadow-[2px_2px_0_rgba(0,0,0,1)] scale-105 pointer-events-none duration-150";
              
              if (solvedIndexes.length === 4) {
                status.innerHTML = `<span class="text-emerald-600 font-extrabold animate-bounce block">🎉 Tebrikler! Tüm kartları başarıyla eşleştirdin! 🥳</span>`;
              } else {
                status.innerHTML = `<span class="text-green-600 font-extrabold">Harika! Bir çift buldun!</span>`;
              }
            } else {
              status.innerHTML = `<span class="text-red-500 font-bold">Uyuşmuyor, aklında tut ve tekrar dene!</span>`;
              setTimeout(() => {
                sfx.playFail();
                first.btn.innerText = '❓';
                first.btn.className = "w-12 h-12 border-3 border-black bg-white flex items-center justify-center text-xl font-bold hover:bg-[#A29BFE]/40 cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]";
                second.btn.innerText = '❓';
                second.btn.className = "w-12 h-12 border-3 border-black bg-white flex items-center justify-center text-xl font-bold hover:bg-[#A29BFE]/40 cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]";
                selectedList = [];
              }, 800);
            }
          } else {
            status.innerHTML = `<span>İkinci kartını seç...</span>`;
          }
        });

        grid.appendChild(btn);
      });
    } 
    else if (currentTab === 'balloon') {
      chamber.innerHTML = `
        <div class="space-y-3.5">
          <div class="text-xs sm:text-sm leading-relaxed">
            <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
              🎈 Balon Şişirme (Balloon Mash)
            </h4>
            <p class="font-semibold text-black/80">
              Bu oyunda amaç en hızlı şekilde kendi balonunu şişirip gökyüzüne fırlatmak! Kendi oyuncu butonuna seri bir şekilde tıkla ya da klavyeden kendi oyuncu tuşuna (Örn: Oyuncu 1 için 'A' tuşu) sürekli basarak rakibinden hızlı davran!
            </p>
          </div>

          <!-- Dynamic Interaction Box -->
          <div class="border-4 border-black bg-red-50 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center">
            <h5 class="text-[10px] font-black uppercase text-red-600 mb-2 tracking-wider">🛠️ PRATİK DENEME ALANI (Balon Pompası)</h5>
            
            <div class="flex items-center justify-center h-24 relative w-full overflow-hidden border-2 border-dashed border-black/10 bg-white shadow-inner mb-3 rounded">
              <div id="pract-balloon" class="rounded-full bg-[#FF6B6B] border-3 border-black relative transition-all duration-75 flex items-center justify-center text-xs text-white font-extrabold shadow-[2px_2px_0_rgba(0,0,0,1)]" style="width: 45px; height: 45px;">
                🎈
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-center gap-2">
              <button id="pract-balloon-pump" class="px-5 py-2 bg-[#FF6B6B] hover:bg-black hover:text-white border-2 border-black font-black uppercase text-xs tracking-wider cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none transition-all">
                🎈 Balonu Şişir!
              </button>
              <button id="pract-balloon-reset" class="px-3 py-2 bg-white hover:bg-red-200 border-2 border-black font-bold uppercase text-[10px] cursor-pointer shadow-[1px_1px_0_rgba(0,0,0,1)]">
                🔄 Sıfırla
              </button>
            </div>

            <div id="pract-balloon-status" class="mt-3 font-semibold text-xs text-black/60 text-center uppercase tracking-wider">
              Yüzde: <span class="font-black text-black font-mono">0%</span> Şişirildi!
            </div>
          </div>
        </div>
      `;

      const balloon = chamber.querySelector('#pract-balloon') as HTMLDivElement;
      const pumpBtn = chamber.querySelector('#pract-balloon-pump') as HTMLButtonElement;
      const resetBtn = chamber.querySelector('#pract-balloon-reset') as HTMLButtonElement;
      const statusText = chamber.querySelector('#pract-balloon-status') as HTMLDivElement;

      let bPercent = 0;
      
      const updatePractBalloon = () => {
        if (bPercent >= 100) {
          balloon.style.width = '85px';
          balloon.style.height = '85px';
          balloon.className = "rounded-full bg-red-400 border-3 border-black relative transition-all duration-75 flex items-center justify-center text-sm animate-ping";
          balloon.innerText = "💥 GÜM";
          statusText.innerHTML = `<span class="text-orange-500 font-black animate-pulse">PATLADI! TEBRİKLER! 🎈🚀</span>`;
          return;
        }

        const size = Math.min(45 + (bPercent * 0.45), 85);
        balloon.style.width = `${size}px`;
        balloon.style.height = `${size}px`;
        balloon.innerText = '🎈';
        balloon.className = "rounded-full bg-[#FF6B6B] border-3 border-black relative transition-all duration-75 flex items-center justify-center text-xs text-white font-extrabold shadow-[2px_2px_0_rgba(0,0,0,1)]";
        statusText.innerHTML = `Yüzde: <span class="font-black text-black font-mono">${bPercent}%</span> Şişirildi!`;
      };

      pumpBtn.addEventListener('click', () => {
        if (bPercent >= 100) return;
        bPercent += 10;
        if (bPercent >= 100) {
          sfx.playPop();
        } else {
          sfx.playTick();
        }
        updatePractBalloon();
      });

      resetBtn.addEventListener('click', () => {
        bPercent = 0;
        sfx.playTick();
        updatePractBalloon();
      });
    } 
    else if (currentTab === 'colorTrap') {
      chamber.innerHTML = `
        <div class="space-y-3.5">
          <div class="text-xs sm:text-sm leading-relaxed">
            <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
              🎨 Renk Tuzağı (Color Stroop Game)
            </h4>
            <p class="font-semibold text-black/80">
              Klasik stroop etkisi tuzağı! Kelimenin kendisiyle boyandığı yazı rengiyi karşılaştır. Eğer <b class="text-slate-800">Yazı rengi ile kelimenin kendisi AYNI ise</b> hemen kendi tuşuna bas! Yanlış basarsan puan kaybedersin!
            </p>
          </div>

          <!-- Dynamic Interaction Box -->
          <div class="border-4 border-black bg-yellow-50 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center">
            <h5 class="text-[10px] font-black uppercase text-amber-600 mb-2 tracking-wider">🛠️ PRATİK DENEME ALANI (Renk & Anlam Eşleştirme)</h5>
            
            <div class="border-3 border-black w-full max-w-xs bg-white p-3 text-center shadow-[2px_2px_0_rgba(0,0,0,1)] mb-3 rounded">
              <h3 id="pract-stroop-word" class="text-2xl sm:text-3xl font-black uppercase tracking-wide select-none" style="color: #FF6B6B">KIRMIZI</h3>
            </div>

            <div class="flex items-center gap-2 mb-3">
              <button id="pract-stroop-same" class="px-4 py-2 border-2 border-black font-black bg-green-400 hover:bg-green-500 text-black text-xs uppercase cursor-pointer shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] active:translate-y-[1px]">
                ✔ AYNI
              </button>
              <button id="pract-stroop-different" class="px-4 py-2 border-2 border-black font-black bg-red-400 hover:bg-red-500 text-black text-xs uppercase cursor-pointer shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] active:translate-y-[1px]">
                ✕ FARKLI
              </button>
            </div>

            <div id="pract-stroop-result" class="font-mono text-xs font-bold uppercase min-h-[1.5rem] tracking-wide text-center">
              Puanın: <span class="text-emerald-700 bg-white border border-black px-1.5 font-bold">0</span>
            </div>
          </div>
        </div>
      `;

      const stroopWord = chamber.querySelector('#pract-stroop-word') as HTMLHeadingElement;
      const sameBtn = chamber.querySelector('#pract-stroop-same') as HTMLButtonElement;
      const diffBtn = chamber.querySelector('#pract-stroop-different') as HTMLButtonElement;
      const resText = chamber.querySelector('#pract-stroop-result') as HTMLDivElement;

      const words = [
        { text: 'KIRMIZI', colorHex: '#FF6B6B' },
        { text: 'MAVİ', colorHex: '#A29BFE' },
        { text: 'YEŞİL', colorHex: '#2EC4B6' }
      ];

      let currentWordIndex = 0;
      let currentColorIndex = 0;
      let scorePractice = 0;

      const refreshStroop = () => {
        currentWordIndex = Math.floor(Math.random() * words.length);
        currentColorIndex = Math.floor(Math.random() * words.length);
        
        stroopWord.innerText = words[currentWordIndex].text;
        stroopWord.style.color = words[currentColorIndex].colorHex;
      };

      const handleUserAnswer = (saidSame: boolean) => {
        const isActuallySame = currentWordIndex === currentColorIndex;
        if (saidSame === isActuallySame) {
          scorePractice++;
          sfx.playSuccess();
          resText.innerHTML = `<span class="text-green-600 font-extrabold animate-bounce">✓ DOĞRU! Skor: ${scorePractice}</span>`;
        } else {
          scorePractice = Math.max(0, scorePractice - 1);
          sfx.playFail();
          resText.innerHTML = `<span class="text-red-500 font-bold">✖ YANLIŞ TUZAK! Skor: ${scorePractice}</span>`;
        }
        refreshStroop();
      };

      sameBtn.addEventListener('click', () => handleUserAnswer(true));
      diffBtn.addEventListener('click', () => handleUserAnswer(false));

      refreshStroop();
    } 
    else if (currentTab === 'clickDerby') {
      chamber.innerHTML = `
        <div class="space-y-3.5">
          <div class="text-xs sm:text-sm leading-relaxed">
            <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
              ⚡ Işık Avcısı (Traffic Clicker)
            </h4>
            <p class="font-semibold text-black/80">
              Aşırı dikkat ve refleks gerektiren çılgın tıklama maratonu! Ortadaki lamba <span class="text-emerald-600 font-extrabold">YEŞİL</span> yandığında olabildiğince hızlı tıkla/bas. Ama dikkat et! <span class="text-yellow-500 font-extrabold">SARI</span> yanarsa -1, <span class="text-red-600 font-extrabold">KIRMIZI</span> yanarsa -2 efsane bir ceza yersin!
            </p>
          </div>

          <!-- Dynamic Interaction Box -->
          <div class="border-4 border-black bg-emerald-50 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center">
            <h5 class="text-[10px] font-black uppercase text-emerald-600 mb-2 tracking-wider">🛠️ PRATİK DENEME ALANI (Sinyal Simülatörü)</h5>
            
            <div class="flex items-center justify-center gap-4 py-2 px-6 border-3 border-black bg-white shadow-[2px_2px_0_rgba(0,0,0,1)] mb-3 rounded">
              <div id="pract-light-red" class="w-6 h-6 rounded-full bg-red-950 border-2 border-black shadow"></div>
              <div id="pract-light-yellow" class="w-6 h-6 rounded-full bg-yellow-950 border-2 border-black shadow"></div>
              <div id="pract-light-green" class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-black shadow animate-pulse"></div>
            </div>

            <button id="pract-signal-tap" class="w-full max-w-xs py-2.5 border-2 border-black font-black bg-emerald-400 text-black text-xs uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-y-[1px]">
              🚨 TIKLA!
            </button>

            <div id="pract-signal-status" class="mt-3 text-xs tracking-wide uppercase font-mono font-bold leading-normal text-center">
              Skor: <span class="text-black font-black">0 Puan</span>
            </div>
          </div>
        </div>
      `;

      const lRed = chamber.querySelector('#pract-light-red') as HTMLDivElement;
      const lYellow = chamber.querySelector('#pract-light-yellow') as HTMLDivElement;
      const lGreen = chamber.querySelector('#pract-light-green') as HTMLDivElement;
      const clickBtn = chamber.querySelector('#pract-signal-tap') as HTMLButtonElement;
      const statText = chamber.querySelector('#pract-signal-status') as HTMLDivElement;

      let pState: 'green' | 'yellow' | 'red' = 'green';
      let practiceScore = 0;

      const changePracticeLight = () => {
        const rand = Math.random();
        if (rand < 0.45) {
          pState = 'green';
          lRed.className = "w-6 h-6 rounded-full bg-red-950 border-2 border-black shadow";
          lYellow.className = "w-6 h-6 rounded-full bg-yellow-950 border-2 border-black shadow";
          lGreen.className = "w-6 h-6 rounded-full bg-emerald-500 border-2 border-black shadow animate-pulse";
          clickBtn.className = "w-full max-w-xs py-2.5 border-2 border-black font-black bg-emerald-400 text-black text-xs uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]";
        } else if (rand < 0.70) {
          pState = 'yellow';
          lRed.className = "w-6 h-6 rounded-full bg-red-950 border-2 border-black shadow";
          lYellow.className = "w-6 h-6 rounded-full bg-yellow-400 border-2 border-black shadow animate-bounce";
          lGreen.className = "w-6 h-6 rounded-full bg-emerald-950 border-2 border-black shadow";
          clickBtn.className = "w-full max-w-xs py-2.5 border-2 border-black font-black bg-yellow-300 text-black text-xs uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]";
        } else {
          pState = 'red';
          lRed.className = "w-6 h-6 rounded-full bg-red-600 border-2 border-black shadow animate-bounce";
          lYellow.className = "w-6 h-6 rounded-full bg-yellow-950 border-2 border-black shadow";
          lGreen.className = "w-6 h-6 rounded-full bg-emerald-950 border-2 border-black shadow";
          clickBtn.className = "w-full max-w-xs py-2.5 border-2 border-black font-black bg-red-500 text-white text-xs uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]";
        }
      };

      clickBtn.addEventListener('click', () => {
        if (pState === 'green') {
          practiceScore++;
          sfx.playTick();
          statText.innerHTML = `Skor: <span class="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 border border-black rounded">+1 (Toplam: ${practiceScore})</span>`;
        } else if (pState === 'yellow') {
          practiceScore = Math.max(0, practiceScore - 1);
          sfx.playFail();
          statText.innerHTML = `Skor: <span class="bg-yellow-100 text-yellow-800 font-bold px-1.5 py-0.5 border border-black rounded">-1 CEZA (Toplam: ${practiceScore})</span>`;
        } else {
          practiceScore = Math.max(0, practiceScore - 2);
          sfx.playExplode();
          statText.innerHTML = `Skor: <span class="bg-red-100 text-red-800 font-bold px-1.5 py-0.5 border border-black rounded">-2 CEZA! (Toplam: ${practiceScore})</span>`;
        }
      });

      const practiceCycleId = setInterval(changePracticeLight, 1300);
      activeIntervals.push(practiceCycleId);
    }
  }

  renderTabContent();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      sfx.playTick();
      clearModalTimers();
      overlay.remove();
    }
  });
}

function renderEditPlayersModal() {
  const modalId = 'edit-players-modal';
  const existing = document.getElementById(modalId);
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = modalId;
  overlay.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none antialiased text-black";

  const modalBox = document.createElement('div');
  modalBox.className = "w-full max-w-2xl bg-white border-4 border-black p-4 sm:p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative text-black scale-95 opacity-0 animate-scale-up flex flex-col max-h-[90vh]";
  modalBox.style.animation = "scaleUp 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards";

  overlay.appendChild(modalBox);
  appRoot.appendChild(overlay);

  let currentTabId = 1; // 1, 2, 3, 4 corresponding to Player IDs
  let activeKeyCaptures: ((e: KeyboardEvent) => void) | null = null;

  function stopKeyCapture() {
    if (activeKeyCaptures) {
      window.removeEventListener('keydown', activeKeyCaptures, { capture: true });
      activeKeyCaptures = null;
    }
  }

  function getCleanKeyLabel(code: string, key: string): string {
    if (code.startsWith('Key') && code.length === 4) {
      return code.substring(3);
    }
    if (code.startsWith('Digit') && code.length === 6) {
      return code.substring(5);
    }
    if (code === 'Space') return 'SPACE';
    if (code === 'Enter') return 'ENTER';
    if (code === 'ArrowUp') return '▲';
    if (code === 'ArrowDown') return '▼';
    if (code === 'ArrowLeft') return '◀';
    if (code === 'ArrowRight') return '▶';
    if (code.startsWith('Numpad')) return code.replace('Numpad', 'NUM ');
    return key.toUpperCase();
  }

  function renderInner() {
    stopKeyCapture();
    
    // Clear inner contents before rebuilding
    modalBox.innerHTML = `
      <!-- Decorative Header ribbon -->
      <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 border-2 border-black bg-[#FFD2E8] text-black font-display text-[10px] sm:text-xs tracking-wider uppercase font-black rotate-[-1deg] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
        ⚙️ OYUNCU AYARLARI VE KONTROLLER
      </div>

      <!-- Close Button -->
      <button id="modal-close-btn" class="absolute top-2 right-2 w-8 h-8 rounded-full border-2 border-black bg-[#FF7675] hover:bg-black hover:text-white font-black flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] text-sm select-none z-10">
        ✕
      </button>

      <div class="mt-4 mb-4 select-none text-center">
        <p class="text-xs font-bold text-black/75">
          Buradan her oyuncunun ismini, karakter simgesini ve oynamak için kullanacağı klavye tuşunu ayarlayabilirsiniz.
        </p>
      </div>

      <!-- Tabs (Player Tabs) -->
      <div class="grid grid-cols-5 gap-1.5 mb-4 shrink-0">
        ${state.players.map(p => {
          const isActive = currentTabId === p.id;
          const bgClass = isActive ? p.color : 'bg-zinc-100 hover:bg-zinc-200';
          const fontClass = isActive ? 'font-black text-black' : 'font-bold text-black/60';
          return `
            <button data-player-id="${p.id}" class="tab-btn py-2 px-1 border-2 border-black ${bgClass} ${fontClass} rounded-lg text-xs cursor-pointer select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col sm:flex-row items-center justify-center gap-1">
              <span class="text-xs sm:text-sm select-none">${p.emoji}</span>
              <span class="truncate max-w-[50px] sm:max-w-none text-[10px] sm:text-[11px] select-none">${p.name}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Tab Content Area -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-4 text-left" id="edit-tabs-content">
        <!-- Replaced dynamically inside renderTab() -->
      </div>
    `;

    // Hook Close Button
    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
      sfx.playTick();
      stopKeyCapture();
      overlay.remove();
      // Re-render lobby to reflect name/emoji changes in instructions/UI
      setScreen('lobby');
    });

    // Hook tab buttons
    modalBox.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = parseInt(btn.getAttribute('data-player-id') || '1', 10);
        if (pId !== currentTabId) {
          sfx.playTick();
          currentTabId = pId;
          renderInner();
        }
      });
    });

    renderActiveTabContent();
  }

  function renderActiveTabContent() {
    const player = state.players.find(p => p.id === currentTabId)!;
    const contentArea = document.getElementById('edit-tabs-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Left Column: Name & Key controls -->
        <div class="space-y-4">
          <!-- Name Group -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-black uppercase tracking-wider text-black/70">✍️ OYUNCU İSMİ</label>
            <input type="text" id="edit-name-input" class="w-full border-4 border-black p-2.5 font-display font-black text-sm sm:text-base focus:bg-yellow-50 focus:outline-none transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-lg text-black" value="${player.name}" placeholder="Oyuncu Adı..." maxlength="12" />
          </div>

          <!-- Key Cap Customizer Group -->
          ${!state.isMobileMode ? `
          <div class="border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center space-y-3 rounded-lg relative overflow-hidden text-black">
            <span class="text-[11px] font-black uppercase tracking-wider text-black/70">⌨️ KLAVYE TETİKLEME TUŞU</span>
            
            <div id="capture-box" class="w-20 h-20 border-4 border-black rounded-xl bg-amber-50 flex items-center justify-center font-display font-black text-2xl sm:text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-none transition-colors duration-150 relative">
              <span id="capture-key-label" class="animate-bounce-short">${player.keyLabel}</span>
            </div>

            <button id="assign-btn" class="px-5 py-2.5 bg-black hover:bg-[#FF7675] hover:text-white border-2 border-black text-white font-black uppercase text-xs cursor-pointer select-none transition-colors w-full rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none text-center">
              Yeni Tuş Ata ⚙️
            </button>

            <div id="key-warning-text" class="text-[10px] font-bold text-center leading-tight transition-all duration-150 min-h-[20px]">
              Tıklayıp değiştirmek istediğiniz tuşa basın. (Varsayılan: ${player.id === 1 ? 'A' : player.id === 2 ? 'L' : player.id === 3 ? 'Z' : player.id === 4 ? 'M' : 'P'})
            </div>
          </div>
          ` : `
          <div class="border-4 border-dashed border-zinc-350 p-6 bg-zinc-50 rounded-lg text-zinc-500 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative select-none flex flex-col items-center justify-center">
            <span class="text-3xl block mb-2">📱</span>
            <span class="text-xs font-bold leading-relaxed text-center">Mobil Dokunmatik Modu aktif! Klavyeden tuş atanmasına gerek yoktur. Ekrandaki büyük köşe butonlarına basarak direkt oynayabilirsiniz.</span>
          </div>
          `}
        </div>

        <!-- Right Column: Avatar/Emoji selection -->
        <div class="space-y-2">
          <label class="block text-[11px] font-black uppercase tracking-wider text-black/70">👑 KARAKTER SEÇ (SİMGE)</label>
          <div class="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto p-1 border-2 border-black bg-zinc-50 rounded-lg">
            ${AVATARS.map(av => {
              const isSelected = player.emoji === av.emoji;
              const borderClass = isSelected ? 'border-4 border-black bg-yellow-100 scale-[1.01] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-2 border-zinc-300 bg-white opacity-85 hover:opacity-100 hover:border-black';
              const textClass = isSelected ? 'font-black' : 'font-bold text-black/70';
              return `
                <button type="button" data-emoji="${av.emoji}" data-name="${av.name}" class="avatar-select-card p-2 flex items-center gap-2 rounded-lg ${borderClass} cursor-pointer transition-all text-xs text-left select-none text-black">
                  <span class="text-xl shrink-0 select-none">${av.emoji}</span>
                  <div class="leading-none overflow-hidden select-none">
                    <div class="truncate ${textClass} select-none">${av.name}</div>
                    <div class="text-[8px] text-black/50 select-none">${av.description}</div>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Hook Name Input changes
    const nameInput = document.getElementById('edit-name-input') as HTMLInputElement;
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        player.name = nameInput.value.trim() || `Oyuncu ${player.id}`;
        savePlayerPersistentData(player);
        
        // Refresh the corresponding tab text instantly without full redraw
        const tabBtn = modalBox.querySelector(`button[data-player-id="${player.id}"]`);
        if (tabBtn) {
          const textSpan = tabBtn.querySelector('span:last-child');
          if (textSpan) textSpan.textContent = player.name;
        }
      });
    }

    // Hook Avatar select clicks
    contentArea.querySelectorAll('.avatar-select-card').forEach(card => {
      card.addEventListener('click', () => {
        const selectedEmoji = card.getAttribute('data-emoji') || '';
        const selectedName = card.getAttribute('data-name') || '';
        if (selectedEmoji) {
          sfx.playTick();
          player.emoji = selectedEmoji;
          player.avatarName = selectedName;
          savePlayerPersistentData(player);
          
          // Re-render sub panel to show selected highlight instantly
          renderActiveTabContent();
          
          // Also update the active tab's emoji button instantly
          const tabBtn = modalBox.querySelector(`button[data-player-id="${player.id}"]`);
          if (tabBtn) {
            const emojiSpan = tabBtn.querySelector('span:first-child');
            if (emojiSpan) emojiSpan.textContent = player.emoji;
          }
        }
      });
    });

    // Hook trigger key capturing
    const assignBtn = document.getElementById('assign-btn') as HTMLButtonElement;
    const captureBox = document.getElementById('capture-box');
    const captureLabel = document.getElementById('capture-key-label');
    const warningLabel = document.getElementById('key-warning-text');

    if (assignBtn && captureBox && captureLabel && warningLabel) {
      assignBtn.addEventListener('click', () => {
        sfx.playTick();
        
        // Stop any active pre-existing capture first just in case
        stopKeyCapture();

        assignBtn.textContent = 'TUŞ BEKLENİYOR... ⌨️';
        assignBtn.disabled = true;
        
        captureBox.classList.remove('bg-amber-50');
        captureBox.classList.add('bg-rose-100', 'animate-pulse', 'border-[#FF7675]');
        captureLabel.textContent = '⏱️';
        
        warningLabel.className = "text-[10px] font-black text-rose-600 text-center leading-tight animate-pulse";
        warningLabel.textContent = "Kaydetmek için klavyeden bir tuşa basın veya ESC ile çıkın...";

        const handleKeyDownCapture = (e: KeyboardEvent) => {
          e.preventDefault();
          e.stopPropagation();

          const pressedCode = e.code;
          
          if (pressedCode === 'Escape') {
            sfx.playFail();
            stopKeyCapture();
            renderActiveTabContent();
            return;
          }

          // Check if this physical key is already assigned to a different player
          const conflictingPlayer = state.players.find(p => p.id !== player.id && p.key === pressedCode);
          if (conflictingPlayer) {
            sfx.playFail();
            warningLabel.textContent = `⚠️ Bu tuş zaten ${conflictingPlayer.name} tarafından kullanılıyor! Başka bir tuş deneyin.`;
            return; // Don't allow. Wait for another key!
          }

          // Valid unique key! Store it
          const parsedLabel = getCleanKeyLabel(pressedCode, e.key);
          
          player.key = pressedCode;
          player.keyLabel = parsedLabel;
          savePlayerPersistentData(player);

          sfx.playTick();
          stopKeyCapture();
          renderActiveTabContent();
        };

        activeKeyCaptures = handleKeyDownCapture;
        window.addEventListener('keydown', handleKeyDownCapture, { capture: true });
      });
    }
  }

  renderInner();

  // Close when they click outer overlay background
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      sfx.playTick();
      stopKeyCapture();
      overlay.remove();
      // Refreshes the lobby to make sure instruction and any other custom values refresh correctly!
      setScreen('lobby');
    }
  });
}

// ==========================================
// 1. LOBBY SCREEN (Giriş Sahnesi)
// ==========================================
function renderLobby() {
  const container = document.createElement('div');
  container.className = "w-full max-w-2xl bg-white border-4 border-black p-6 sm:p-10 text-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative z-10 flex flex-col items-center space-y-8 animate-fade-in";
  
  const bridge = (window as any).playgamaBridge;
  let playgamaConnectorHTML = '';
  
  if (bridge) {
    const isAuth = bridge.player && bridge.player.isAuthorized;
    if (isAuth) {
      const name = bridge.player.name || "Playgama Oyuncusu";
      const avatar = bridge.player.avatar || bridge.player.avatarUrl || "";
      playgamaConnectorHTML = `
        <!-- Connected Account Card -->
        <div class="w-full bg-[#E5F6FD] border-4 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rotate-[-0.5deg]">
          <div class="flex items-center gap-3">
            <div class="relative w-12 h-12 rounded-full border-2 border-black bg-white overflow-hidden flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              ${avatar ? `<img src="${avatar}" class="w-full h-full object-cover" referrerpolicy="no-referrer" />` : `<span class="text-xl flex items-center justify-center w-full h-full bg-[#A29BFE]">👤</span>`}
            </div>
            <div class="text-left">
              <div class="text-[10px] font-black uppercase text-blue-700 tracking-wider">Playgama Bulut Kaydı Aktif</div>
              <div class="text-sm font-black truncate max-w-[180px] sm:max-w-xs">${name} (Oyuncu 1)</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="bg-blue-500 border-2 border-black text-white text-[10px] font-black px-2 py-1 rotate-[2deg] shadow-[1px_1px_0_rgba(0,0,0,1)] uppercase">BAĞLANDI</span>
          </div>
        </div>
      `;
    } else {
      playgamaConnectorHTML = `
        <!-- Unconnected Account Card -->
        <div class="w-full bg-[#FFF9C4] border-4 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rotate-[0.5deg]">
          <div class="text-left space-y-0.5 max-w-sm">
            <h4 class="text-[10px] font-black uppercase text-black/60 tracking-wider">Playgama Bulut Servisleri</h4>
            <div class="text-xs font-bold text-black/80">Altınlarını, özelleştirmelerini buluta kaydedip, resmi avatarını kullanmak için hesabını bağla!</div>
          </div>
          <button id="playgama-connect-btn" class="px-4 py-2 bg-[#A29BFE] hover:bg-black hover:text-white border-2 border-black text-black font-black font-display text-[11px] uppercase cursor-pointer transition-all transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
            Giriş Yap ⚡
          </button>
        </div>
      `;
    }
  }

  container.innerHTML = `
    <!-- Top Decorative Header -->
    <div class="flex items-center gap-2 px-4 py-2 border-2 border-black bg-[#4ECDC4] text-black font-display text-xs sm:text-sm tracking-wider uppercase font-black rotate-[-1deg] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      ⚡ ÇILGIN PARTY ARENASI 🏁
    </div>
 
    <!-- Main Title -->
    <div class="relative space-y-4 w-full flex flex-col items-center">
      <h1 class="text-6xl sm:text-7xl font-display font-black tracking-tighter text-black uppercase select-none drop-shadow-[4px_4px_0_#A29BFE] animate-bounce-short">
        BS PARTY
      </h1>
      <div class="h-1 bg-black w-24 mx-auto"></div>
      <p class="text-black font-bold max-w-md mx-auto text-sm sm:text-base">
        Aynı klavyede veya ekranda arkadaşlarınla kapışabileceğin çılgın, hızlı mini oyun dünyasına katıl!
      </p>
      
      <button id="lobby-how-to-play-btn" class="mt-1 text-[11px] font-black uppercase bg-[#FFD2E8] text-black border-2 border-black py-1.5 px-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-white cursor-pointer w-fit flex items-center gap-1.5 transition-all select-none">
        📖 OYUNLARIN KURAL REHBERİ (NASIL OYNANIR?)
      </button>
    </div>
 
    <!-- Play Button -->
    <div class="w-full max-w-sm space-y-2 mx-auto">
      <button id="lobby-play-btn" class="w-full py-4 px-4 bg-[#55EFC4] text-black hover:bg-black hover:text-white border-4 border-black font-display font-black text-lg sm:text-xl uppercase cursor-pointer rounded-none select-none transition-all duration-200 shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_rgba(0,0,0,1)] flex items-center justify-center gap-3">
        🎮 OYUNA GİR 🚀
      </button>
    </div>

    <!-- Device Mode Select (PC vs Mobile) -->
    <div class="w-full max-w-sm space-y-2 mx-auto pt-1">
      <label class="block text-black font-display text-[11px] tracking-widest uppercase font-black bg-black text-white py-0.5 px-2">CİHAZ / KONTROL AYARI</label>
      <div class="grid grid-cols-2 gap-2.5 select-none">
        <button id="devicemode-pc" class="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${!state.isMobileMode ? 'bg-[#55EFC4] font-black' : 'bg-white font-bold text-black/60'}">
          <div class="text-[11px] font-display font-black">💻 Bilgisayar (PC)</div>
          <div class="text-[8px] uppercase font-black tracking-wider leading-none mt-0.5 ${!state.isMobileMode ? 'text-black/80' : 'text-black/40'}">Klavye Tuşları</div>
        </button>
        <button id="devicemode-mobile" class="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${state.isMobileMode ? 'bg-[#81ECEC] font-black' : 'bg-white font-bold text-black/60'}">
          <div class="text-[11px] font-display font-black">📱 Mobil Cihaz</div>
          <div class="text-[8px] uppercase font-black tracking-wider leading-none mt-0.5 ${state.isMobileMode ? 'text-black/80' : 'text-black/40'}">Dokunmatik Mod</div>
        </button>
      </div>
    </div>

    <!-- Tournament Mode Select -->
    <div class="w-full max-w-sm space-y-2 mx-auto pt-1">
      <label class="block text-black font-display text-[11px] tracking-widest uppercase font-black bg-black text-white py-0.5 px-2">TURNUVA MODU SEÇİN</label>
      <div class="grid grid-cols-2 gap-2.5 select-none hover:text-black">
        <button id="tmode-standard" class="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${!state.isEliminationMode ? 'bg-[#FFEAA7] font-black' : 'bg-white font-bold'}">
          <div class="text-[11px] font-display font-black">🏆 Standart Turnuva</div>
          <div class="text-[8px] uppercase text-black/65 font-black tracking-wider leading-none mt-0.5">Puan Toplama</div>
        </button>
        <button id="tmode-elimination" class="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${state.isEliminationMode ? 'bg-[#FF7675] text-white font-black animate-pulse' : 'bg-white text-black font-bold'}">
          <div class="text-[11px] font-display font-black">🔥 Elemeli Nakavt</div>
          <div class="text-[8px] uppercase ${state.isEliminationMode ? 'text-white/85' : 'text-black/65'} font-black tracking-wider leading-none mt-0.5">Kazanan Tur Atlar</div>
        </button>
      </div>
    </div>

    <!-- Customized Character & Control settings Card -->
    <div class="w-full bg-[#FFEAA7] border-4 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rotate-[0.5deg]">
      <div class="text-left space-y-0.5 max-w-sm select-none">
        <h4 class="text-[10px] font-black uppercase text-black/60 tracking-wider">⚙️ Oyuncu Özelleştirme & Tuş Ayarları</h4>
        <div class="text-xs font-bold text-black/85 leading-tight">Oyuncu isimlerini değiştirebilir, karakter simgelerini özelleştirebilir ve klavye tuşlarını dilediğiniz gibi atayabilirsiniz!</div>
      </div>
      <button id="lobby-edit-players-btn" class="w-full sm:w-auto px-5 py-2.5 bg-[#FF7675] hover:bg-black hover:text-white border-2 border-black text-white font-black font-display text-[11px] uppercase cursor-pointer transition-all transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none whitespace-nowrap">
        OYUNCULARI DÜZENLE ⚙️
      </button>
    </div>

    ${playgamaConnectorHTML}

    <!-- Daily Reward Card -->
    <div class="w-full bg-[#EBFBEE] border-4 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rotate-[0.5deg] relative overflow-hidden">
      <div class="flex items-center gap-3">
        <div class="relative flex items-center justify-center">
          <span class="text-3xl animate-bounce-short">🎁</span>
          ${hasAnyUnclaimedBonus() ? `<span class="absolute -top-1 -right-0.5 w-3 h-3 bg-red-500 border-2 border-black rounded-full animate-ping"></span><span class="absolute -top-1 -right-0.5 w-3 h-3 bg-red-500 border-2 border-black rounded-full"></span>` : ''}
        </div>
        <div class="text-left select-none">
          <div class="text-[10px] font-black uppercase text-emerald-800 tracking-wider">HER GÜN BEDAVA ALTIN COIN! 📅</div>
          <div class="text-xs font-bold text-black/85 leading-tight">Günlük Giriş Bonusu aktif. Hemen bugünün ödülünü topla!</div>
        </div>
      </div>
      <button id="lobby-daily-bonus-btn" class="px-5 py-2.5 bg-yellow-400 hover:bg-black hover:text-white border-2 border-black text-black font-black font-display text-[11px] uppercase cursor-pointer transition-all transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none whitespace-nowrap">
        Ödülü Al 🪙
      </button>
    </div>
 
    <!-- Instruction Panel -->
    <div class="w-full bg-[#FDCB6E] border-4 border-black p-5 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
      <div class="space-y-2">
        <span class="font-display font-black text-sm tracking-wider flex items-center gap-1.5 uppercase">⌨️ KLAVYE KONTROLLERİ</span>
        ${!state.isMobileMode ? `
        <ul class="space-y-2 font-mono leading-none">
          ${state.players.filter(p => p.active).map(p => `
            <li class="flex items-center gap-1.5 select-none font-bold">
              <span>${p.emoji}</span> 
              <span>${p.name}:</span> 
              <strong class="bg-white border-2 border-black px-1.5 py-0.5 text-[11px] rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">${p.keyLabel}</strong> tuşu
            </li>
          `).join('')}
        </ul>
        ` : `
        <div class="text-xs font-bold font-sans text-black/85 leading-relaxed bg-white/40 border-2 border-black/20 p-2.5">
          📱 Mobil Dokunmatik Mod aktif! Oyuncuların ekrandaki dev köşelerden oluşan renkli butonları kullanarak kontrol yapması yeterlidir. Klavye tuşları atanmamıştır.
        </div>
        `}
      </div>
 
      <div class="space-y-2 border-t sm:border-t-0 sm:border-l border-black pt-2 sm:pt-0 sm:pl-4">
        <span class="font-display font-black text-sm tracking-wider flex items-center gap-1.5 uppercase">📱 MOBİL KONTROLLER</span>
        <p class="leading-relaxed font-bold text-black/80">
          Akıllı telefon ve tabletlerde ekranda belirecek devasa renkli köşe butonlarına basarak kusursuz bir mobil parti yaşayabilirsiniz!
        </p>
      </div>
    </div>
  `;
 
  appRoot.appendChild(container);
 
  // Setup Event Listeners
  const playBtn = document.getElementById('lobby-play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      sfx.playPowerUp();
      setScreen('charSelect');
    });
  }

  // Setup Device Select Listeners
  const pcModeBtn = document.getElementById('devicemode-pc');
  const mobileModeBtn = document.getElementById('devicemode-mobile');
  if (pcModeBtn && mobileModeBtn) {
    pcModeBtn.addEventListener('click', () => {
      sfx.playTick();
      state.isMobileMode = false;
      safeLocalStorage.setItem('bs_party_is_mobile_mode', 'false');
      render(); // Redraw instantly
    });
    mobileModeBtn.addEventListener('click', () => {
      sfx.playTick();
      state.isMobileMode = true;
      safeLocalStorage.setItem('bs_party_is_mobile_mode', 'true');
      render(); // Redraw instantly
    });
  }

  const stdBtn = document.getElementById('tmode-standard');
  const elimBtn = document.getElementById('tmode-elimination');
  if (stdBtn && elimBtn) {
    stdBtn.addEventListener('click', () => {
      sfx.playTick();
      state.isEliminationMode = false;
      stdBtn.className = "py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#FFEAA7] font-black";
      elimBtn.className = "py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white font-bold";
      
      const elimSub = elimBtn.querySelector('div')?.nextElementSibling;
      if (elimSub) {
        elimSub.className = "text-[8px] uppercase text-black/65 font-black tracking-wider leading-none mt-0.5";
      }
    });

    elimBtn.addEventListener('click', () => {
      sfx.playTick();
      state.isEliminationMode = true;
      stdBtn.className = "py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white font-bold";
      elimBtn.className = "py-2 px-1 border-2 border-black text-white cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#FF7675] font-black animate-pulse";
      
      const elimSub = elimBtn.querySelector('div')?.nextElementSibling;
      if (elimSub) {
        elimSub.className = "text-[8px] uppercase text-white/85 font-black tracking-wider leading-none mt-0.5";
      }
    });
  }

  const connectBtn = document.getElementById('playgama-connect-btn');
  if (connectBtn) {
    connectBtn.addEventListener('click', () => {
      loginPlaygamaPlayer();
    });
  }

  const lobbyDailyBonusBtn = document.getElementById('lobby-daily-bonus-btn');
  if (lobbyDailyBonusBtn) {
    lobbyDailyBonusBtn.addEventListener('click', () => {
      sfx.playTick();
      renderDailyBonusModal();
    });
  }

  const lobbyHowBtn = document.getElementById('lobby-how-to-play-btn');
  if (lobbyHowBtn) {
    lobbyHowBtn.addEventListener('click', () => {
      sfx.playTick();
      renderHowToPlayModal();
    });
  }

  const lobbyEditBtn = document.getElementById('lobby-edit-players-btn');
  if (lobbyEditBtn) {
    lobbyEditBtn.addEventListener('click', () => {
      sfx.playTick();
      renderEditPlayersModal();
    });
  }
}

// ==========================================
// 2. CHARACTER SELECTION (Karakter Seçimi)
// ==========================================
function renderCharSelect() {
  const container = document.createElement('div');
  container.className = "w-full max-w-6xl relative z-10 flex flex-col items-center space-y-4 animate-fade-in";
  
  // Title
  const headerDiv = document.createElement('div');
  headerDiv.className = "text-center space-y-2 w-full max-w-3xl";
  headerDiv.innerHTML = `
    <div class="bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
      <div class="inline-block px-3 py-1 bg-[#A29BFE] text-black border-2 border-black text-[11px] font-black uppercase rotate-[-1deg] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-1">
        👥 Oyuncu Kadrosunu Belirle!
      </div>
      <h2 class="text-2xl sm:text-3xl font-display font-black text-black uppercase tracking-tight">KİMLER OYNAYACAK?</h2>
      <p class="text-black/75 font-semibold text-xs mt-1">Sistemdeki 5 kayıtlı oyuncudan oynamasını istediğiniz kişileri aktif yapın (En az 2 kişi)! En fazla 5 oyuncu birlikte oynayabilir.</p>
    </div>
  `;
  container.appendChild(headerDiv);

  // Top action control buttons
  const currentlyActiveCount = state.players.filter(p => p.active).length;
  const isKadroReady = currentlyActiveCount >= 2 && currentlyActiveCount <= 5;

  const controlsDiv = document.createElement('div');
  controlsDiv.className = "flex flex-col sm:flex-row gap-3 w-full max-w-4xl justify-between items-center bg-white border-4 border-black p-3 shadow-[4px_4px_0_rgba(0,0,0,1)] text-black";
  
  controlsDiv.innerHTML = `
    <div class="flex gap-2">
      <button id="char-back-btn" class="px-4 py-2 bg-white border-2 border-black hover:bg-black hover:text-white text-black font-black tracking-wide cursor-pointer duration-205 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] uppercase text-[10px] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none select-none">
        ◀ Geri Dön
      </button>
      <button id="char-shop-btn" class="px-4 py-2 bg-[#FDCB6E] border-2 border-black hover:bg-black hover:text-white text-black font-black tracking-wide cursor-pointer duration-205 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] uppercase text-[10px] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none select-none">
        🛒 Mağaza & Gardırop
      </button>
    </div>
    
    <button id="char-start-btn" class="px-5 py-2 border-2 border-black font-black tracking-wider text-[11px] uppercase cursor-pointer duration-200 transition-all select-none
      ${isKadroReady 
        ? 'bg-[#55EFC4] text-black hover:bg-black hover:text-white shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] animate-bounce-short cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px]' 
        : 'bg-neutral-300 text-neutral-500 border-neutral-400 cursor-not-allowed opacity-55 shadow-none'
      }">
      Mücadeleyi Başlat 🚀
    </button>
  `;
  container.appendChild(controlsDiv);

  // HUD bar for active count validation
  const activeCountHUD = document.createElement('div');
  activeCountHUD.className = "w-full max-w-4xl bg-black text-white p-3 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] text-center flex flex-col sm:flex-row items-center justify-between gap-3 font-display";
  activeCountHUD.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="px-2 py-0.5 bg-[#FFD2E8] text-black text-[10px] font-black uppercase border border-black">DİNAMİK OYUNCU MODU</span>
    </div>
    
    <div class="flex items-center gap-2">
      <span class="text-xs font-bold font-sans">Seçilen Kadro:</span>
      <span class="px-2.5 py-0.5 font-black text-xs border-2 border-white rounded-none
        ${isKadroReady ? 'bg-[#55EFC4] text-black' : 'bg-[#FF7675] text-white animate-pulse'}">
        ${currentlyActiveCount} / 5 OYUNCU SEÇİLDİ
      </span>
    </div>

    <div class="text-[11px] font-black uppercase text-center sm:text-right">
      ${isKadroReady 
        ? '✅ Kadro Hazır! Oyun Başlayabilir.' 
        : `⚠️ Oyuna başlamak için en az 2 oyuncu seçmelisiniz!`
      }
    </div>
  `;
  container.appendChild(activeCountHUD);

  // Players grid of all 5 system players
  const gridDiv = document.createElement('div');
  gridDiv.className = "grid w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl";

  state.players.forEach((player) => {
    const playerDiv = document.createElement('div');
    playerDiv.id = `player-card-${player.id}`;
    
    // Set classes depending on if active (participating) or standby
    if (player.active) {
      playerDiv.className = `${player.color} border-4 border-black p-3 flex flex-col items-center text-center space-y-2.5 focus-within:ring-2 focus-within:ring-black transition-all duration-300 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-100 scale-100`;
    } else {
      playerDiv.className = `bg-neutral-50 grayscale opacity-50 hover:opacity-100 hover:grayscale-30 border-4 border-black border-dashed p-3 flex flex-col items-center text-center space-y-2.5 transition-all duration-300 relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-98`;
    }
    
    playerDiv.innerHTML = `
      <!-- Active Swap Toggle Button -->
      <button id="toggle-active-${player.id}" class="w-full py-1.5 bg-black hover:bg-neutral-900 border-2 border-black text-white font-black text-[9px] tracking-wide uppercase transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer rounded-none select-none flex items-center justify-center gap-1">
        ${player.active ? '🟢 KATILIYOR ✅' : '⚪ YEDEKTE (SEÇ)'}
      </button>

      <div class="absolute -top-3 left-3 px-1.5 py-0.5 text-[8px] font-display font-black text-white uppercase bg-black border border-black rotate-[-1deg] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        P${player.id}
      </div>

      <!-- Avatar & Name Input Side-By-Side (Super Compact) -->
      <div class="w-full flex items-center gap-2 bg-white border-2 border-black p-1.5 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
        <!-- Compact Avatar Bubble -->
        <div id="avatar-container-${player.id}" class="relative flex-shrink-0 flex items-center justify-center bg-neutral-100 border border-black/30 rounded-full w-9 h-9 select-none">
          ${getPlayerAvatarHTML(player, "w-7 h-7 text-lg")}
        </div>
        
        <!-- Name Input -->
        <div class="flex-1 space-y-0.5 text-left min-w-0">
          <label class="block text-[7.5px] font-display uppercase tracking-wider text-black/65 font-black leading-none">OYUNCU</label>
          <input 
            type="text" 
            id="pname-input-${player.id}" 
            value="${player.name || `Oyuncu ${player.id}`}"
            class="w-full bg-neutral-50 border border-black/40 text-center text-[11px] font-black text-black py-0.5 px-1 rounded-none focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-black font-sans leading-tight truncate"
            placeholder="İsim gir..."
            maxlength="12"
          />
        </div>
      </div>

      <!-- Key assignment reminder -->
      ${!state.isMobileMode ? `
      <div class="w-full bg-white border border-black rounded-none py-0.5 px-1 w-full flex items-center justify-between text-[9px] font-mono font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        <span class="text-black uppercase tracking-widest text-[7px] font-bold">TUŞU:</span>
        <span class="font-extrabold px-1 py-0.5 bg-black text-white border border-black text-[9px] leading-none">${player.keyLabel}</span>
      </div>
      ` : ''}
    `;

    gridDiv.appendChild(playerDiv);

    // Bind events in next cycle to ensure elements are in DOM
    setTimeout(() => {
      // Toggle Active / Participation trigger
      const toggleBtn = document.getElementById(`toggle-active-${player.id}`);
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          player.active = !player.active;
          sfx.playTick();
          savePlayerPersistentData(player);
          // Rerender the whole panel to update HUD & grid highlighting immediately!
          renderCharSelect();
        });
      }

      // Name Input handler
      const nameInput = document.getElementById(`pname-input-${player.id}`) as HTMLInputElement;
      if (nameInput) {
        nameInput.addEventListener('focus', () => {
          nameInput.select();
        });
        nameInput.addEventListener('input', (e) => {
          player.name = (e.target as HTMLInputElement).value || `Oyuncu ${player.id}`;
          savePlayerPersistentData(player);
        });
      }
    }, 0);
  });

  container.appendChild(gridDiv);
  
  // Clear any existing contents of the parent and inject
  const previousContainer = appRoot.firstElementChild;
  if (previousContainer) {
    appRoot.replaceChild(container, previousContainer);
  } else {
    appRoot.appendChild(container);
  }

  // Bind controls
  document.getElementById('char-back-btn')?.addEventListener('click', () => {
    sfx.playTick();
    setScreen('lobby');
  });
  
  document.getElementById('char-shop-btn')?.addEventListener('click', () => {
    sfx.playPowerUp();
    lastScreenBeforeShop = 'charSelect';
    setScreen('costumeShop');
  });
  
  const startBtn = document.getElementById('char-start-btn');
  if (startBtn && isKadroReady) {
    startBtn.addEventListener('click', () => {
      sfx.playFanfare();
      // Set baseline scores and persist all changes
      state.playerCount = currentlyActiveCount;
      state.players.forEach(p => {
        state.scores[p.id] = 0;
        p.score = 0;
        if (p.active) {
          savePlayerPersistentData(p);
        }
      });
      setScreen('gamesHub');
    });
  }
}

// ==========================================
// 3. GAMES HUB (Oyun Arenası Seçim Ekranı)
// ==========================================
const GAME_DETAILS: { [key: string]: { name: string; emoji: string; color: string } } = {
  balloonGame: { name: 'Balon Şişirme', emoji: '🎈', color: 'bg-[#FF6B6B]' },
  memoryGame: { name: 'Hafıza Kartları', emoji: '🧩', color: 'bg-[#A29BFE]' },
  colorTrapGame: { name: 'Renk Tuzağı', emoji: '🎨', color: 'bg-[#FDCB6E]' },
  clickDerbyGame: { name: 'Işık Avcısı', emoji: '⚡', color: 'bg-[#55EFC4]' },
  raceGame: { name: 'Sevimli Koşu', emoji: '🏃', color: 'bg-[#FCA311]' },
  bombGame: { name: 'Bomba İmha', emoji: '💣', color: 'bg-[#FF7675]' },
  mathDashGame: { name: 'Sayı Avcısı', emoji: '🔢', color: 'bg-[#74B9FF]' }
};

function renderGamesHub() {
  if (state.isEliminationMode) {
    const remaining = state.players.filter(p => p.active && !p.isEliminated).length;
    if (remaining <= 1) {
      setTimeout(() => {
        sfx.playFanfare();
        setScreen('gameOver');
      }, 50);
      return;
    }
  }

  const container = document.createElement('div');
  container.className = "w-full max-w-5xl relative z-10 flex flex-col space-y-5 animate-fade-in";

  // Compact Top Navigation Bar (replaces the entire live score panel)
  const navCard = document.createElement('div');
  navCard.className = "w-full bg-white border-4 border-black p-3 flex flex-wrap items-center justify-between gap-3 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-black relative";
  
  let scoreHTML = `
    <!-- Brand / Title -->
    <div class="flex items-center gap-2 select-none">
      <button id="hub-back-btn" class="px-3 py-1 bg-black text-white hover:bg-red-605 border-2 border-black text-[10px] font-black uppercase cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center transition-colors">
        ⬅ GİRİŞE DÖN
      </button>
      <span class="text-[10px] font-black uppercase font-display hidden sm:inline-block tracking-wider text-black/55">⚡ ARENA KONTROLÜ</span>
    </div>

    <!-- Quick action buttons -->
    <div class="flex flex-wrap gap-2 justify-end">
      <button id="hub-shop-btn" class="text-[10px] font-black uppercase bg-[#FDCB6E] border-2 border-black py-1 px-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-[#FDCB6E] cursor-pointer flex items-center gap-1 transition-all">
        🛍️ MAĞAZA & GİYSİLER
      </button>
      <button id="hub-daily-btn" class="text-[10px] font-black uppercase bg-[#4ECDC4] border-2 border-black py-1 px-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-white cursor-pointer flex items-center gap-1 transition-all relative">
        <span>🎁 GÜNLÜK HEDİYE</span>
        ${hasAnyUnclaimedBonus() ? `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-black rounded-full animate-ping"></span><span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-black rounded-full"></span>` : ''}
      </button>
      <button id="hub-how-btn" class="text-[10px] font-black uppercase bg-[#FFD2E8] border-2 border-black py-1 px-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-white cursor-pointer flex items-center gap-1 transition-all">
        📖 NASIL OYNANIR?
      </button>
    </div>
  `;
  navCard.innerHTML = scoreHTML;

  // Dynamic Playlist Planner Dashboard
  const playlistPlanner = document.createElement('div');
  playlistPlanner.className = "w-full bg-[#EBFBEE] border-2 border-black p-2 sm:p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black flex flex-col space-y-2";
  
  const currentPlaylist = state.gamePlaylist || [];
  let playlistItemsHTML = '';
  if (currentPlaylist.length === 0) {
    playlistItemsHTML = `
      <div class="flex-1 border border-dashed border-black/25 p-1.5 text-center text-[10.5px] font-bold text-black/60 select-none bg-emerald-50/40">
        📋 Liste Boş. Alttaki butonlardan "➕ Ekle" ile oyun ekleyin veya hızlı sıra yükleyin!
      </div>
    `;
  } else {
    playlistItemsHTML = `
      <div class="flex flex-wrap items-center gap-1 flex-1 p-1 bg-emerald-50/70 border border-black min-h-[30px]">
        ${currentPlaylist.map((gType, idx) => {
          const det = GAME_DETAILS[gType];
          if (!det) return '';
          return `
            <div class="flex items-center gap-1 ${det.color} border border-black py-0.5 px-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[9px] font-black uppercase text-black">
              <span>${idx + 1}. ${det.emoji} ${det.name}</span>
              <button data-remove-idx="${idx}" class="ml-1 px-0.5 text-red-600 hover:bg-black hover:text-white rounded transition-colors select-none font-bold text-[9px]" title="Kaldır">✕</button>
            </div>
            ${idx < currentPlaylist.length - 1 ? '<span class="text-black font-black text-[9px]">➔</span>' : ''}
          `;
        }).join('')}
      </div>
    `;
  }

  playlistPlanner.innerHTML = `
    <div class="flex items-center justify-between gap-1.5 border-b border-black/20 pb-1">
      <div>
        <h4 class="text-xs font-black text-black uppercase leading-none font-display">Sıralı Turnuva Planlayıcı</h4>
      </div>
      <div class="flex items-center gap-1">
        <button id="playlist-preset-btn" class="text-[8.5px] font-black uppercase bg-[#FDCB6E] hover:bg-black hover:text-[#FDCB6E] border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all">
          ⚡ Hızlı Sıra
        </button>
        <button id="playlist-clear-btn" class="text-[8.5px] font-black uppercase bg-red-50 hover:bg-red-600 hover:text-white border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all">
          🗑️ Temizle
        </button>
      </div>
    </div>
    
    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
      ${playlistItemsHTML}
      <button id="playlist-start-btn" class="py-1.5 px-3 shrink-0 bg-black text-white hover:bg-[#4ECDC4] hover:text-black border border-black font-black tracking-wide text-[10px] uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] transition-colors active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center justify-center gap-1 ${currentPlaylist.length === 0 ? 'opacity-40 pointer-events-none' : ''}">
        🚀 Turnuvayı Başlat (${currentPlaylist.length} Oyun)
      </button>
    </div>
  `;

  // Append Navigation Header first, then the Playlist planner
  container.appendChild(navCard);

  // If elimination mode is active, show the Tournament Standing Banner
  if (state.isEliminationMode) {
    const elimBanner = document.createElement('div');
    elimBanner.className = "w-full";
    elimBanner.innerHTML = `
      <div class="w-full bg-[#FFF0F2] border-4 border-[#FF7675] p-3 text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] relative select-none">
        <div class="flex items-center gap-2 mb-2 pb-1.5 border-b-2 border-[#FF7675]/35 justify-between flex-wrap">
          <div class="flex items-center gap-1.5">
            <span class="text-xl animate-pulse">🔥</span>
            <div>
              <h4 class="text-xs font-display font-black uppercase text-black leading-none">ELEMELİ TURNUVA STATÜSÜ</h4>
            </div>
          </div>
          <span class="text-[8.5px] font-black uppercase bg-[#FF7675] text-white px-2 py-0.5 border-2 border-black shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">KÜRSÜ DURUMU</span>
        </div>
        
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          ${state.players.filter(p => p.active).map(p => {
            if (p.isEliminated) {
              return `
                <div class="flex items-center justify-between p-2 bg-neutral-100 border-2 border-neutral-400 opacity-55 text-neutral-500 line-through">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="text-xs shrink-0 select-none">💀</span>
                    <span class="font-bold text-[10px] truncate">${p.name}</span>
                  </div>
                  <span class="font-mono text-[8px] bg-red-100 text-red-700 px-1 py-0.5 border border-red-300 font-extrabold tracking-wide rounded">ELENDİ</span>
                </div>
              `;
            } else {
              return `
                <div class="flex items-center justify-between p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="text-xs shrink-0 select-none">🔋</span>
                    <span class="font-extrabold text-[10.5px] truncate text-black">${p.name}</span>
                  </div>
                  <span class="font-mono text-[8.5px] bg-[#55EFC4] text-black px-1.5 py-0.5 border border-black font-extrabold flex items-center gap-0.5 shadow-[0.5px_0.5px_0_rgba(0,0,0,1)] animate-pulse rounded">AKTİF</span>
                </div>
              `;
            }
          }).join('')}
        </div>
      </div>
    `;
    container.appendChild(elimBanner);
  }

  container.appendChild(playlistPlanner);

  // Game Selector Section Title — SUPER COMPACT
  const selectHeader = document.createElement('div');
  selectHeader.className = "text-left pl-1 mt-1 shrink-0 select-none";
  selectHeader.innerHTML = `
    <h3 class="text-xs sm:text-sm font-display font-black text-black uppercase tracking-wider flex items-center gap-1.5">🎮 MİNİ OYUN SEÇİMİ</h3>
    <p class="text-black/60 text-[10px] font-bold">Hızlıca tek oyun başlat veya turnuva playlistine sırayla ekle!</p>
  `;
  container.appendChild(selectHeader);

  // List of Available Games Card Grid — 2 columns on mobile, 3 on tablet, 5 on desktop
  const gamesGrid = document.createElement('div');
  gamesGrid.className = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 w-full";

  // Game 1: Memory Game — COMPACT
  const game1 = document.createElement('div');
  game1.className = "bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2.5 group transition-all duration-350 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  game1.innerHTML = `
    <div class="space-y-1.5 text-left text-black flex items-center gap-2">
      <div class="w-7 h-7 shrink-0 rounded-none bg-[#A29BFE] border border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        🧩
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-display font-black text-black truncate leading-tight">Hafıza Kartları</h4>
        <p class="text-black/60 text-[9.5px] font-bold truncate leading-tight mt-0.5">
          Kart çiftlerini eşleştir!
        </p>
      </div>
    </div>
    <div class="flex gap-1 w-full pt-1 border-t border-dashed border-black/10">
      <button id="play-now-memory" class="flex-1 py-1 bg-black hover:bg-[#A29BFE] text-white hover:text-black border border-black font-black text-[10px] uppercase transition-colors cursor-pointer text-center">
        ▶ OYNA
      </button>
      <button id="add-queue-memory" class="px-2 py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black text-black font-black text-[10px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Ortak Listeye Ekle">
        ➕ Ekle
      </button>
    </div>
  `;
  gamesGrid.appendChild(game1);

  // Game 2: Balloon Pop — COMPACT
  const game2 = document.createElement('div');
  game2.className = "bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2.5 group transition-all duration-350 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  game2.innerHTML = `
    <div class="space-y-1.5 text-left text-black flex items-center gap-2">
      <div class="w-7 h-7 shrink-0 rounded-none bg-[#FF6B6B] border border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        🎈
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-display font-black text-black truncate leading-tight">Balon Şişirme</h4>
        <p class="text-black/60 text-[9.5px] font-bold truncate leading-tight mt-0.5">
          Seri tuşlayıp balonu patlat!
        </p>
      </div>
    </div>
    <div class="flex gap-1 w-full pt-1 border-t border-dashed border-black/10">
      <button id="play-now-balloon" class="flex-1 py-1 bg-black hover:bg-[#FF6B6B] text-white hover:text-black border border-black font-black text-[10px] uppercase transition-colors cursor-pointer text-center">
        ▶ OYNA
      </button>
      <button id="add-queue-balloon" class="px-2 py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black text-black font-black text-[10px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Ortak Listeye Ekle">
        ➕ Ekle
      </button>
    </div>
  `;
  gamesGrid.appendChild(game2);

  // Game 3: Color Trap — COMPACT
  const game3 = document.createElement('div');
  game3.className = "bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2.5 group transition-all duration-350 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  game3.innerHTML = `
    <div class="space-y-1.5 text-left text-black flex items-center gap-2">
      <div class="w-7 h-7 shrink-0 rounded-none bg-[#FDCB6E] border border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        🎨
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-display font-black text-black truncate leading-tight">Renk Tuzağı</h4>
        <p class="text-black/60 text-[9.5px] font-bold truncate leading-tight mt-0.5">
          Kelime ve yazı rengi aynıysa bas!
        </p>
      </div>
    </div>
    <div class="flex gap-1 w-full pt-1 border-t border-dashed border-black/10">
      <button id="play-now-colorTrap" class="flex-1 py-1 bg-black hover:bg-[#FDCB6E] text-white hover:text-black border border-black font-black text-[10px] uppercase transition-colors cursor-pointer text-center">
        ▶ OYNA
      </button>
      <button id="add-queue-colorTrap" class="px-2 py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black text-black font-black text-[10px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Ortak Listeye Ekle">
        ➕ Ekle
      </button>
    </div>
  `;
  gamesGrid.appendChild(game3);

  // Game 4: Light Hunter — COMPACT
  const game4 = document.createElement('div');
  game4.className = "bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2.5 group transition-all duration-350 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  game4.innerHTML = `
    <div class="space-y-1.5 text-left text-black flex items-center gap-2">
      <div class="w-7 h-7 shrink-0 rounded-none bg-[#55EFC4] border border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        ⚡
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-display font-black text-black truncate leading-tight">Işık Avcısı</h4>
        <p class="text-black/60 text-[9.5px] font-bold truncate leading-tight mt-0.5">
          Lamba yeşil olduğunda tıkla!
        </p>
      </div>
    </div>
    <div class="flex gap-1 w-full pt-1 border-t border-dashed border-black/10">
      <button id="play-now-clickDerby" class="flex-1 py-1 bg-black hover:bg-[#55EFC4] text-white hover:text-black border border-black font-black text-[10px] uppercase transition-colors cursor-pointer text-center">
        ▶ OYNA
      </button>
      <button id="add-queue-clickDerby" class="px-2 py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black text-black font-black text-[10px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Oyunu Listeye Ekle">
        ➕ Ekle
      </button>
    </div>
  `;
  gamesGrid.appendChild(game4);

  // Game 5: Sevimli Koşu — COMPACT
  const game5 = document.createElement('div');
  game5.className = "bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2.5 group transition-all duration-350 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  game5.innerHTML = `
    <div class="space-y-1.5 text-left text-black flex items-center gap-2">
      <div class="w-7 h-7 shrink-0 rounded-none bg-[#FCA311] border border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        🏃
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-display font-black text-black truncate leading-tight">Sevimli Koşu</h4>
        <p class="text-black/60 text-[9.5px] font-bold truncate leading-tight mt-0.5">
          Muzlardan kaçıp finişe koş!
        </p>
      </div>
    </div>
    <div class="flex gap-1 w-full pt-1 border-t border-dashed border-black/10">
      <button id="play-now-raceGame" class="flex-1 py-1 bg-black hover:bg-[#FCA311] text-white hover:text-black border border-black font-black text-[10px] uppercase transition-colors cursor-pointer text-center">
        ▶ OYNA
      </button>
      <button id="add-queue-raceGame" class="px-2 py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black text-black font-black text-[10px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Oyunu Listeye Ekle">
        ➕ Ekle
      </button>
    </div>
  `;
  gamesGrid.appendChild(game5);

  // Game 6: Bomba İmha — COMPACT
  const game6 = document.createElement('div');
  game6.className = "bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2.5 group transition-all duration-350 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  game6.innerHTML = `
    <div class="space-y-1.5 text-left text-black flex items-center gap-2">
      <div class="w-7 h-7 shrink-0 rounded-none bg-[#FF7675] border border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        💣
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-display font-black text-black truncate leading-tight">Bomba İmha</h4>
        <p class="text-black/60 text-[9.5px] font-bold truncate leading-tight mt-0.5">
          Patlamadan önce kabloyu kes!
        </p>
      </div>
    </div>
    <div class="flex gap-1 w-full pt-1 border-t border-dashed border-black/10">
      <button id="play-now-bomb" class="flex-1 py-1 bg-black hover:bg-[#FF7675] text-white hover:text-black border border-black font-black text-[10px] uppercase transition-colors cursor-pointer text-center">
        ▶ OYNA
      </button>
      <button id="add-queue-bomb" class="px-2 py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black text-black font-black text-[10px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Oyunu Listeye Ekle">
        ➕ Ekle
      </button>
    </div>
  `;
  gamesGrid.appendChild(game6);

  // Game 7: Sayı Avcısı — COMPACT
  const game7 = document.createElement('div');
  game7.className = "bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2.5 group transition-all duration-350 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  game7.innerHTML = `
    <div class="space-y-1.5 text-left text-black flex items-center gap-2">
      <div class="w-7 h-7 shrink-0 rounded-none bg-[#74B9FF] border border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        🔢
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-display font-black text-black truncate leading-tight">Sayı Avcısı</h4>
        <p class="text-black/60 text-[9.5px] font-bold truncate leading-tight mt-0.5">
          Hedefe uyan sayı çıkınca bas!
        </p>
      </div>
    </div>
    <div class="flex gap-1 w-full pt-1 border-t border-dashed border-black/10">
      <button id="play-now-mathDash" class="flex-1 py-1 bg-black hover:bg-[#74B9FF] text-white hover:text-black border border-black font-black text-[10px] uppercase transition-colors cursor-pointer text-center">
        ▶ OYNA
      </button>
      <button id="add-queue-mathDash" class="px-2 py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black text-black font-black text-[10px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Oyunu Listeye Ekle">
        ➕ Ekle
      </button>
    </div>
  `;
  gamesGrid.appendChild(game7);

  container.appendChild(gamesGrid);

  // Big End/Result button
  const endDiv = document.createElement('div');
  endDiv.className = "flex justify-center w-full pt-2";
  endDiv.innerHTML = `
    <button id="end-party-btn" class="px-8 py-3.5 bg-[#FF6B6B] text-black border-4 border-black font-black font-sans tracking-widest text-xs uppercase rounded-none cursor-pointer hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
      🏆 TURNUVAYI SONLANDIR VE KAZANANI GÖR!
    </button>
  `;
  container.appendChild(endDiv);
  appRoot.appendChild(container);

  document.getElementById('end-party-btn')?.addEventListener('click', () => {
    sfx.playFanfare();
    setScreen('gameOver');
  });

  document.getElementById('hub-back-btn')?.addEventListener('click', () => {
    sfx.playTick();
    setScreen('lobby');
  });

  document.getElementById('hub-shop-btn')?.addEventListener('click', () => {
    lastScreenBeforeShop = 'gamesHub';
    setScreen('costumeShop');
  });

  document.getElementById('hub-daily-btn')?.addEventListener('click', () => {
    sfx.playTick();
    renderDailyBonusModal();
  });

  document.getElementById('hub-how-btn')?.addEventListener('click', () => {
    sfx.playTick();
    renderHowToPlayModal('general');
  });

  // Hot-starts for individual games immediately
  document.getElementById('play-now-memory')?.addEventListener('click', () => {
    state.playlistActive = false; // Disable queue if playing individual
    setScreen('memoryGame');
  });
  document.getElementById('play-now-balloon')?.addEventListener('click', () => {
    state.playlistActive = false; // Disable queue if playing individual
    setScreen('balloonGame');
  });
  document.getElementById('play-now-colorTrap')?.addEventListener('click', () => {
    state.playlistActive = false; // Disable queue if playing individual
    setScreen('colorTrapGame');
  });
  document.getElementById('play-now-clickDerby')?.addEventListener('click', () => {
    state.playlistActive = false; // Disable queue if playing individual
    setScreen('clickDerbyGame');
  });
  document.getElementById('play-now-raceGame')?.addEventListener('click', () => {
    state.playlistActive = false; // Disable queue if playing individual
    setScreen('raceGame');
  });
  document.getElementById('play-now-bomb')?.addEventListener('click', () => {
    state.playlistActive = false; // Disable queue if playing individual
    setScreen('bombGame');
  });
  document.getElementById('play-now-mathDash')?.addEventListener('click', () => {
    state.playlistActive = false; // Disable queue if playing individual
    setScreen('mathDashGame');
  });

  // Adding games to the tournament playlist
  document.getElementById('add-queue-memory')?.addEventListener('click', () => {
    if (!state.gamePlaylist) state.gamePlaylist = [];
    state.gamePlaylist.push('memoryGame');
    sfx.playPowerUp();
    setScreen('gamesHub');
  });
  document.getElementById('add-queue-balloon')?.addEventListener('click', () => {
    if (!state.gamePlaylist) state.gamePlaylist = [];
    state.gamePlaylist.push('balloonGame');
    sfx.playPowerUp();
    setScreen('gamesHub');
  });
  document.getElementById('add-queue-colorTrap')?.addEventListener('click', () => {
    if (!state.gamePlaylist) state.gamePlaylist = [];
    state.gamePlaylist.push('colorTrapGame');
    sfx.playPowerUp();
    setScreen('gamesHub');
  });
  document.getElementById('add-queue-clickDerby')?.addEventListener('click', () => {
    if (!state.gamePlaylist) state.gamePlaylist = [];
    state.gamePlaylist.push('clickDerbyGame');
    sfx.playPowerUp();
    setScreen('gamesHub');
  });
  document.getElementById('add-queue-raceGame')?.addEventListener('click', () => {
    if (!state.gamePlaylist) state.gamePlaylist = [];
    state.gamePlaylist.push('raceGame');
    sfx.playPowerUp();
    setScreen('gamesHub');
  });
  document.getElementById('add-queue-bomb')?.addEventListener('click', () => {
    if (!state.gamePlaylist) state.gamePlaylist = [];
    state.gamePlaylist.push('bombGame');
    sfx.playPowerUp();
    setScreen('gamesHub');
  });
  document.getElementById('add-queue-mathDash')?.addEventListener('click', () => {
    if (!state.gamePlaylist) state.gamePlaylist = [];
    state.gamePlaylist.push('mathDashGame');
    sfx.playPowerUp();
    setScreen('gamesHub');
  });

  // Preset loading
  document.getElementById('playlist-preset-btn')?.addEventListener('click', () => {
    state.gamePlaylist = ['balloonGame', 'memoryGame', 'colorTrapGame', 'clickDerbyGame', 'raceGame', 'bombGame', 'mathDashGame'];
    sfx.playPowerUp();
    setScreen('gamesHub');
  });

  // Clear queue
  document.getElementById('playlist-clear-btn')?.addEventListener('click', () => {
    state.gamePlaylist = [];
    state.playlistActive = false;
    state.currentPlaylistIndex = 0;
    sfx.playTick();
    setScreen('gamesHub');
  });

  // Start selected tournament queue
  document.getElementById('playlist-start-btn')?.addEventListener('click', () => {
    if (state.gamePlaylist && state.gamePlaylist.length > 0) {
      state.playlistActive = true;
      state.currentPlaylistIndex = 0;
      const initialGame = state.gamePlaylist[0];
      setScreen(initialGame);
    }
  });

  // Remove individual items from row list
  container.querySelectorAll('[data-remove-idx]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt((btn as HTMLElement).getAttribute('data-remove-idx') || '0');
      if (state.gamePlaylist && idx >= 0) {
        state.gamePlaylist.splice(idx, 1);
        sfx.playTick();
        setScreen('gamesHub');
      }
    });
  });
}

// ==========================================
// LIVE SCORE PANEL (Canlı Skor Paneli) - Disabled by request
// ==========================================
function renderLiveScoreHUD(parentContainer: HTMLElement, activePlayers: Player[], scoreMap: { [id: number]: number }, unitLabel: string) {
  // Completely disabled based on user request ('canli skor olayini kaldir' & 'hafiza kartini secince canli skor var?')
  return;
}

// ==========================================
// 4. BALLOON GAME: HAFIZA BALON ŞİŞİRME
// ==========================================
function renderBalloonGame() {
  const activePlayers = state.isEliminationMode
    ? state.players.filter(p => p.active && !p.isEliminated)
    : state.players.filter(p => p.active);
  
  // Game-specific state in closure
  const pBalloons: { [id: number]: number } = {};
  activePlayers.forEach(p => pBalloons[p.id] = 0);
  
  let isGameOver = false;
  const finishedPlayers: number[] = [];
  const endButtonContainer = document.createElement('div');
  endButtonContainer.id = "balloon-end-early-container";
  endButtonContainer.className = "hidden w-full flex justify-center py-2 animate-fade-in";

  const container = document.createElement('div');
  container.className = "w-full max-w-6xl relative z-10 flex flex-col h-[90vh] max-h-[850px] justify-between space-y-4 animate-fade-in select-none";

  // Top header block
  const header = document.createElement('div');
  header.className = "bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4";
  header.innerHTML = `
    <div>
      <h2 class="text-xl sm:text-2xl font-display font-black text-black uppercase">🎈 BALON ŞİŞİRME GEÇİDİ</h2>
      <p class="text-black font-bold text-xs">Butonuna art arda en HIZLI tıklayan kendi balonunu %100 yapıp patlatarak kazanır!</p>
    </div>
    <button id="balloon-quit" class="px-4 py-2 text-xs font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
      ◀ Arenaya Dön
    </button>
  `;
  container.appendChild(header);
  container.appendChild(endButtonContainer);

  // Main game battle arena
  const arenaGrid = document.createElement('div');
  arenaGrid.className = `grid gap-4 flex-1 ${
    activePlayers.length === 2 ? 'grid-cols-2' : 
    activePlayers.length === 3 ? 'grid-cols-3' : 
    activePlayers.length === 4 ? 'grid-cols-4' : 
    activePlayers.length === 5 ? 'grid-cols-2 md:grid-cols-5 animate-fade-in' : 'grid-cols-1'
  }`;

  activePlayers.forEach(player => {
    const pCol = document.createElement('div');
    pCol.className = `${player.color} border-4 border-black p-4 flex flex-col justify-between items-center relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`;
    pCol.id = `balloon-col-${player.id}`;

    pCol.innerHTML = `
      <!-- Score banner -->
      <div class="flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative z-10 select-none">
        ${getPlayerAvatarHTML(player, "w-8 h-8 text-md")}
        <span class="font-black text-xs text-black uppercase">${player.name}</span>
      </div>

      <!-- Balloon Visual area -->
      <div class="flex-1 flex flex-col items-center justify-center relative w-full h-full p-4 min-h-[220px]">
        <!-- SVG Balloon representing growth -->
        <div id="balloon-svg-${player.id}" class="relative transition-all duration-150 ease-out flex flex-col items-center justify-center" style="transform: scale(0.65); transform-origin: center;">
          
          <!-- Balloon Body -->
          <svg class="w-28 h-32 sm:w-32 sm:h-36 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M 50 10 C 20 10, 10 40, 10 70 C 10 90, 30 110, 50 110 C 70 110, 90 90, 90 70 C 90 40, 80 10, 50 10 Z" fill="${player.hexColor}" stroke="black" stroke-width="4"/>
            <!-- Triangle Knot -->
            <polygon points="50,110 42,118 58,118" fill="black"/>
          </svg>
          
          <!-- Cute interactive cartoon facial details -->
          <div id="face-${player.id}" class="absolute text-4xl font-bold select-none leading-none mt-[-10px]">
            😐
          </div>

          <!-- Balloon base hanger line -->
          <div class="w-1 h-12 bg-black absolute top-[115px]"></div>
        </div>

        <div id="burst-effect-${player.id}" class="hidden absolute text-5xl font-black text-black bg-white border-4 border-black px-4 py-2 rotate-[-4deg] animate-bounce select-none shadow-[4px_4px_0_rgba(0,0,0,1)] z-20">💥 PATLADI!</div>
      </div>

      <!-- Dynamic Info and Interactive Button -->
      <div class="w-full space-y-3 relative z-10">
        <div class="flex justify-between items-center text-[10px] font-mono font-black border-2 border-black bg-white px-2 py-0.5 shadow-[2px_2px_0_rgba(0,0,0,1)]">
          <span class="text-black uppercase">ŞİŞME ORANI:</span>
          <span id="percent-txt-${player.id}" class="font-extrabold text-black">0%</span>
        </div>
        
        <div class="w-full bg-white border-4 border-black h-7 relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div id="bar-${player.id}" class="h-full bg-black transition-all duration-150" style="width: 0%"></div>
        </div>

        <!-- Big touchable action button container -->
        <button id="tap-btn-${player.id}" class="w-full py-3.5 bg-white border-4 border-black font-black text-xs text-black uppercase tracking-widest cursor-pointer hover:bg-black hover:text-white transition shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex flex-col items-center">
          <span>ŞİŞİR!</span>
          ${!state.isMobileMode ? `<span class="text-[9px] text-black/60 font-mono mt-0.5 font-bold">TUŞ: [${player.keyLabel}]</span>` : ''}
        </button>
      </div>
    `;

    arenaGrid.appendChild(pCol);
  });
  container.appendChild(arenaGrid);

  // Modal display for final results
  const resultModal = document.createElement('div');
  resultModal.id = "balloon-result-modal";
  resultModal.className = "hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center overflow-y-auto p-4 sm:p-6 text-center animate-fade-in";
  container.appendChild(resultModal);

  appRoot.appendChild(container);
  renderLiveScoreHUD(container, activePlayers, pBalloons, '%');

  // --- AUDIO & LOGIC HELPERS ---
  function getBalloonFace(percent: number): string {
    if (percent < 30) return '😐';
    if (percent < 60) return '😮';
    if (percent < 85) return '🥵';
    return '🤯';
  }

  function showBalloonEndEarlyOption() {
    if (activePlayers.length >= 2) {
      endButtonContainer.classList.remove('hidden');
      endButtonContainer.innerHTML = `
        <button id="balloon-end-early-btn" class="w-full max-w-sm py-3.5 bg-[#FF7675] text-white hover:bg-black border-4 border-black font-display font-black text-xs uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_rgba(0,0,0,1)] flex items-center justify-center gap-2 select-none">
          🏁 MÜCADELEYİ BİTİR (KÜRSÜYE GİT) ⏭️
        </button>
      `;
      document.getElementById('balloon-end-early-btn')?.addEventListener('click', () => {
        finishBalloonGameReal();
      });
    }
  }

  function finishBalloonGameReal() {
    isGameOver = true;

    // Fill the rest of rank positions based on current progress
    const remainingSorted = activePlayers
      .filter(p => !finishedPlayers.includes(p.id))
      .sort((a, b) => pBalloons[b.id] - pBalloons[a.id]);
    
    // Total ranks combined
    const finalRanks = [...finishedPlayers, ...remainingSorted.map(p => p.id)];
    const sortedPlayersList = finalRanks.map(id => state.players.find(p => p.id === id)!);
    const eliminationStatus = getRoundEliminationStatus(sortedPlayersList);

    const winnerPlayerObj = sortedPlayersList[0];

    // Awarding points based on finish list
    const roundAllocations = [35, 20, 10, 5];
    let resultsHTML = `
      <div class="my-auto bg-white border-4 border-black p-6 sm:p-10 max-w-xl w-full flex flex-col items-center space-y-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black animate-fade-in relative z-40">
        <div class="w-16 h-16 rounded-full ${winnerPlayerObj.color} border-4 border-black flex items-center justify-center text-4xl shadow animate-bounce">
          🎈
        </div>
        <div>
          <h3 class="text-3xl font-display font-black text-black uppercase tracking-tight">BALON GEÇİDİ TAMAMLANDI!</h3>
          <p class="text-sm font-bold text-black/70 mt-1">${winnerPlayerObj.name} hız rekoru kırarak balonu ilk uçuran şampiyon oldu!</p>
        </div>

        <div class="w-full space-y-3.5 my-4">
          <span class="block text-[10px] font-mono text-black/60 font-black uppercase tracking-widest text-left">FİNAL SKOR KAZANIMLARI</span>
    `;

    finalRanks.forEach((pId, idx) => {
      const playerObj = state.players.find(p => p.id === pId)!;
      const scoreVal = pBalloons[pId];
      const awarded = roundAllocations[idx] || 0;
      
      let statusBadgeHTML = '';
      const elimInfo = eliminationStatus[playerObj.id];
      if (state.isEliminationMode && elimInfo) {
        statusBadgeHTML = `<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${elimInfo.colorClass}">${elimInfo.label}</span>`;
        if (elimInfo.status === 'eliminated') {
          playerObj.isEliminated = true;
        }
      }

      // Add permanently to general board
      playerObj.score += awarded;
      playerObj.globalCoins = (playerObj.globalCoins || 0) + awarded;
      savePlayerPersistentData(playerObj);

      resultsHTML += `
        <div class="flex items-center justify-between bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs text-black font-black">#${idx + 1}</span>
            ${getPlayerAvatarHTML(playerObj, "w-8 h-8 text-sm")}
            <span class="font-black text-black text-sm">${playerObj.name}</span>
            ${statusBadgeHTML}
          </div>
          <div class="flex items-center gap-2 font-semibold text-black">
            <span class="text-xs font-mono font-bold">%${scoreVal} vana</span>
            <span class="font-extrabold text-[11px] bg-[#FDCB6E] border border-black px-2 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">+${awarded} Puan</span>
            <span class="font-extrabold text-[11px] bg-[#FFEAA7] border border-black px-2 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0 flex items-center gap-0.5">🪙+${awarded}</span>
          </div>
        </div>
      `;
    });

    resultsHTML += `
       </div>
       <button id="balloon-modal-continue" class="w-full py-4 bg-[#4ECDC4] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer">
         Liderlik Kürsüsüne Dön
       </button>
      </div>
    `;

    if (resultModal) {
      resultModal.innerHTML = resultsHTML;
      resultModal.classList.remove('hidden');
      
      document.getElementById('balloon-modal-continue')?.addEventListener('click', () => {
        handleGameFinished();
      });
    }
  }

  function handleTap(pId: number) {
    if (isGameOver || finishedPlayers.includes(pId)) return;
    
    pBalloons[pId] = Math.min(100, pBalloons[pId] + 3);
    const pVal = pBalloons[pId];

    sfx.playTick();

    // Graphic updates
    const bar = document.getElementById(`bar-${pId}`) as HTMLDivElement;
    const txt = document.getElementById(`percent-txt-${pId}`) as HTMLSpanElement;
    const svg = document.getElementById(`balloon-svg-${pId}`) as HTMLDivElement;
    const face = document.getElementById(`face-${pId}`) as HTMLDivElement;

    if (bar) bar.style.width = `${pVal}%`;
    if (txt) txt.innerText = `${pVal}%`;
    if (face) face.innerText = getBalloonFace(pVal);
    
    // Scale proportional between 0.65 to 1.6
    if (svg) {
      const scaleVal = 0.65 + (pVal / 100) * 0.95;
      svg.style.transform = `scale(${scaleVal})`;
    }

    renderLiveScoreHUD(container, activePlayers, pBalloons, '%');

    if (pVal >= 100) {
      if (!finishedPlayers.includes(pId)) {
        finishedPlayers.push(pId);
        sfx.playExplode();

        // Increment wins statistics for achievement
        const activePlayerObj = state.players.find(p => p.id === pId)!;
        activePlayerObj.balloonWinsCount = (activePlayerObj.balloonWinsCount || 0) + 1;
        savePlayerPersistentData(activePlayerObj);
        if (activePlayerObj.balloonWinsCount >= 5) {
          checkAndAwardAchievement(activePlayerObj, 'balloon_wins_5');
        }

        const burstText = document.getElementById(`burst-effect-${pId}`) as HTMLDivElement;
        if (burstText) burstText.className = "absolute text-6xl text-amber-400 font-extrabold animate-bounce z-20 flex flex-col items-center";
        if (svg) svg.className = "hidden"; // Hide balloon

        // Update button instantly
        const tapBtn = document.getElementById(`tap-btn-${pId}`) as HTMLButtonElement;
        if (tapBtn) {
          const rank = finishedPlayers.indexOf(pId) + 1;
          let medal = '🏆';
          if (rank === 2) medal = '🥈';
          if (rank === 3) medal = '🥉';
          if (rank >= 4) medal = '🎖️';
          tapBtn.innerHTML = `
            <span class="text-emerald-600 font-extrabold text-[11px] uppercase">${rank}. BİTİRDİ ${medal}</span>
            <span class="text-[9px] text-black/50 font-mono mt-0.5 font-bold">TAMAMLANDI</span>
          `;
          tapBtn.disabled = true;
          tapBtn.classList.add('bg-emerald-55', 'border-emerald-600');
        }

        // Show early exit option once someone finished
        if (finishedPlayers.length === 1) {
          showBalloonEndEarlyOption();
        }

        // Auto-end if all finished
        if (finishedPlayers.length === activePlayers.length) {
          finishBalloonGameReal();
        }
      }
    }
  }

  // Bind Buttons & Keys click actions
  activePlayers.forEach(p => {
    const btn = document.getElementById(`tap-btn-${p.id}`);
    if (btn) {
      btn.addEventListener('click', () => handleTap(p.id));

      // Enhanced touch controls with visual haptic scale feedback and zero-latency triggers
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.classList.add('scale-95', 'bg-black', 'text-white');
        handleTap(p.id);
      }, { passive: false });

      const cleanUpTouch = () => {
        btn.classList.remove('scale-95', 'bg-black', 'text-white');
      };

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        setTimeout(cleanUpTouch, 50);
      }, { passive: false });

      btn.addEventListener('touchcancel', cleanUpTouch);
    }
  });

  // Physical keyboard tracking keydown
  const keysListener = (e: KeyboardEvent) => {
    if (e.repeat) return; // Prevent hold cheat key
    const targetPlayer = activePlayers.find(p => p.key === e.code);
    if (targetPlayer) {
      const btn = document.getElementById(`tap-btn-${targetPlayer.id}`);
      if (btn) {
        // Visual button blink
        btn.classList.add('bg-black', 'text-white', 'scale-95');
        setTimeout(() => btn.classList.remove('bg-black', 'text-white', 'scale-95'), 80);
      }
      handleTap(targetPlayer.id);
    }
  };
  window.addEventListener('keydown', keysListener);

  // Setup disconnect/quit actions
  document.getElementById('balloon-quit')?.addEventListener('click', () => {
    window.removeEventListener('keydown', keysListener);
    setScreen('gamesHub');
  });

  // Remove listener automatically on screen tear down
  const observer = new MutationObserver((mutations) => {
    if (!document.getElementById('balloon-quit')) {
      window.removeEventListener('keydown', keysListener);
      observer.disconnect();
    }
  });
  observer.observe(appRoot, { childList: true });
}

// ==========================================
// 5. MEMORY GAME (Hafıza Kartları)
// ==========================================
// ==========================================
// 5. MEMORY GAME (Hafıza Kartları)
// ==========================================
const MEMORY_MODES = [
  {
    id: 'classic',
    name: 'Klasik Simgeler',
    desc: 'Saray simgelerini ve teçhizatları eşleştir',
    emoji: '👑',
    color: 'bg-[#FF6B6B]',
    cards: [
      { display: '👑', matchId: 1 }, { display: '👑', matchId: 1 },
      { display: '⚔️', matchId: 2 }, { display: '⚔️', matchId: 2 },
      { display: '💎', matchId: 3 }, { display: '💎', matchId: 3 },
      { display: '🛡️', matchId: 4 }, { display: '🛡️', matchId: 4 },
      { display: '🪙', matchId: 5 }, { display: '🪙', matchId: 5 },
      { display: '🔑', matchId: 6 }, { display: '🔑', matchId: 6 },
      { display: '🍎', matchId: 7 }, { display: '🍎', matchId: 7 },
      { display: '⚡', matchId: 8 }, { display: '⚡', matchId: 8 }
    ]
  },
  {
    id: 'animals',
    name: 'Hayvanlar Alemi',
    desc: 'Sevimli dostlarımızı eşleştir',
    emoji: '🐱',
    color: 'bg-[#55EFC4]',
    cards: [
      { display: '🐱', matchId: 1 }, { display: '🐱', matchId: 1 },
      { display: '🐶', matchId: 2 }, { display: '🐶', matchId: 2 },
      { display: '🦊', matchId: 3 }, { display: '🦊', matchId: 3 },
      { display: 'Bear', matchId: 4 }, { display: '🐻', matchId: 4 }, // Just using correct elements
      { display: '🐼', matchId: 5 }, { display: '🐼', matchId: 5 },
      { display: '🐸', matchId: 6 }, { display: '🐸', matchId: 6 },
      { display: '🦁', matchId: 7 }, { display: '🦁', matchId: 7 },
      { display: '🐙', matchId: 8 }, { display: '🐙', matchId: 8 }
    ]
  },
  {
    id: 'food',
    name: 'Yiyecek Şöleni',
    desc: 'Nefis yemek ve meyveleri eşleştir',
    emoji: '🍕',
    color: 'bg-[#FDCB6E]',
    cards: [
      { display: '🍕', matchId: 1 }, { display: '🍕', matchId: 1 },
      { display: '🍟', matchId: 2 }, { display: '🍟', matchId: 2 },
      { display: '🍔', matchId: 3 }, { display: '🍔', matchId: 3 },
      { display: '🍩', matchId: 4 }, { display: '🍩', matchId: 4 },
      { display: '🥑', matchId: 5 }, { display: '🥑', matchId: 5 },
      { display: '🍓', matchId: 6 }, { display: '🍓', matchId: 6 },
      { display: '🍦', matchId: 7 }, { display: '🍦', matchId: 7 },
      { display: '🍪', matchId: 8 }, { display: '🍪', matchId: 8 }
    ]
  },
  {
    id: 'math',
    name: 'Matematik Dehası',
    desc: 'Soru kartları ile doğru cevaplarını eşleştir!',
    emoji: '🧠',
    color: 'bg-[#A29BFE]',
    cards: [
      { display: '2 + 3', matchId: 1 }, { display: '5', matchId: 1 },
      { display: '4 x 2', matchId: 2 }, { display: '8', matchId: 2 },
      { display: '3 x 3', matchId: 3 }, { display: '9', matchId: 3 },
      { display: '10 - 3', matchId: 4 }, { display: '7', matchId: 4 },
      { display: '12 - 10', matchId: 2 }, { display: '2', matchId: 2 }, // matchId can be customized, to avoid duplicate values we keep it unique: matchId: 5 for 2
      { display: '5 + 7', matchId: 6 }, { display: '12', matchId: 6 },
      { display: '18 - 9', matchId: 7 }, { display: '9', matchId: 7 },
      { display: '4 + 11', matchId: 8 }, { display: '15', matchId: 8 }
    ]
  }
];

// Correct animals matching
MEMORY_MODES[1].cards[6] = { display: '🐻', matchId: 4 };
MEMORY_MODES[1].cards[7] = { display: '🐻', matchId: 4 };
// Fixed duplicated keys in math
MEMORY_MODES[3].cards[8] = { display: '12 - 10', matchId: 5 };
MEMORY_MODES[3].cards[9] = { display: '2', matchId: 5 };

function renderMemoryGame() {
  const activePlayers = state.isEliminationMode
    ? state.players.filter(p => p.active && !p.isEliminated)
    : state.players.filter(p => p.active);

  // Render Selection Mode Card
  const choiceContainer = document.createElement('div');
  choiceContainer.className = "w-full max-w-2xl bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col items-center space-y-6 text-black select-none z-10 animate-fade-in";
  choiceContainer.innerHTML = `
    <div class="text-center space-y-2">
      <span class="text-4xl animate-bounce block">🧩</span>
      <h2 class="text-2xl sm:text-3xl font-display font-black uppercase tracking-tight">Hafıza Kartı Türleri</h2>
      <p class="text-black/60 text-xs font-semibold">Mücadeleye başlamak için bir hafıza oyunu türü seçin!</p>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      ${MEMORY_MODES.map(mode => `
        <button id="btn-mode-${mode.id}" class="flex items-center gap-4 border-4 border-black p-4 text-left ${mode.color} hover:bg-black hover:text-white group transition-all duration-200 cursor-pointer shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5">
          <span class="text-3xl bg-white border-2 border-black p-2 shadow-[2px_2px_0_rgba(0,0,0,1)] text-black group-hover:scale-110 transition-transform">${mode.emoji}</span>
          <div class="min-w-0">
            <h4 class="font-black text-xs sm:text-sm uppercase tracking-wide group-hover:underline">${mode.name}</h4>
            <p class="text-[10px] font-bold opacity-80 mt-1 leading-tight">${mode.desc}</p>
          </div>
        </button>
      `).join('')}
    </div>

    <button id="btn-mode-quit" class="px-6 py-2.5 bg-neutral-100 hover:bg-black hover:text-white border-2 border-black text-xs font-black uppercase transition-all duration-150 cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5">
      ◀ Arenaya Kaç
    </button>
  `;

  appRoot.appendChild(choiceContainer);

  document.getElementById('btn-mode-quit')?.addEventListener('click', () => {
    setScreen('gamesHub');
  });

  MEMORY_MODES.forEach(mode => {
    document.getElementById(`btn-mode-${mode.id}`)?.addEventListener('click', () => {
      sfx.playPowerUp();
      appRoot.removeChild(choiceContainer);
      startGame(mode);
    });
  });

  function startGame(mode: typeof MEMORY_MODES[0]) {
    let activeTurnIndex = 0; // Starts with player 1 index
    
    // Copy the cards list
    let deck = JSON.parse(JSON.stringify(mode.cards));
    
    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Game tracking variables
    let flippedIndices: number[] = [];
    let matchedIndices: number[] = [];
    const localScores: { [id: number]: number } = {};
    activePlayers.forEach(p => localScores[p.id] = 0);
    const playerMismatches: { [id: number]: number } = {};
    activePlayers.forEach(p => playerMismatches[p.id] = 0);

    let lockGrid = false;

    const container = document.createElement('div');
    container.className = "w-full max-w-5xl relative z-10 flex flex-col gap-5 animate-fade-in select-none text-black";

    // Panel Header
    const header = document.createElement('div');
    header.className = "bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4";
    header.innerHTML = `
      <div>
        <h2 class="text-xl sm:text-2xl font-display font-black text-black uppercase flex items-center gap-2">🧩 HAFIZA ARENASI: <span class="underline">${mode.name}</span></h2>
        <p class="text-black font-semibold text-xs mt-1">Kart çiftlerini eşleştirerek her çift için +15 puan kazanın. Sıra dönmektedir!</p>
      </div>
      <div class="flex items-center gap-2">
        <button id="memory-quit" class="px-4 py-2 text-xs font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
          ◀ Arenaya Dön
        </button>
      </div>
    `;
    container.appendChild(header);

    // Main game flex block
    const flexArea = document.createElement('div');
    flexArea.className = "grid grid-cols-1 md:grid-cols-4 gap-6 items-start";

    // Sidebar detailing players stats and active turn
    const sidebar = document.createElement('div');
    sidebar.className = "bg-white border-4 border-black p-4 space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";
    flexArea.appendChild(sidebar);

    // Card center grid board box
    const cardGridWrapper = document.createElement('div');
    cardGridWrapper.className = "md:col-span-3 flex flex-col items-center space-y-4";
    
    const gridDiv = document.createElement('div');
    gridDiv.className = "grid grid-cols-4 gap-3 bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full aspect-square max-w-[480px]";
    cardGridWrapper.appendChild(gridDiv);
    flexArea.appendChild(cardGridWrapper);

    container.appendChild(flexArea);

    // Result dialog box
    const resultModal = document.createElement('div');
    resultModal.className = "hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center overflow-y-auto p-4 sm:p-6 text-center animate-fade-in";
    container.appendChild(resultModal);

    appRoot.appendChild(container);

    // --- RENDERING ROUTINES ---
    function updateTurnVisuals() {
      // Re-render sidebar players panel
      const currentActivePlayer = activePlayers[activeTurnIndex];
      
      sidebar.innerHTML = `
        <div class="space-y-1.5 text-center sm:text-left border-b-2 border-black pb-3">
          <span class="text-[10px] font-mono text-black/60 uppercase tracking-widest block font-black">AKTİF SIRADA</span>
          <div id="active-p-glow" class="px-4 py-2.5 bg-black border-2 border-black text-white font-black flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] animate-pulse">
            <span class="text-xl">${currentActivePlayer.emoji}</span>
            <span>${currentActivePlayer.name}</span>
          </div>
        </div>

        <div class="space-y-2.5">
          <span class="block text-[10px] font-mono text-black/60 uppercase tracking-widest font-black">MİNİ SKORLAR</span>
          <div class="space-y-2">
      `;

      activePlayers.forEach((p, idx) => {
        const isMyTurn = idx === activeTurnIndex;
        sidebar.innerHTML += `
          <div class="flex items-center justify-between p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isMyTurn ? p.color + ' translate-y-0.5 shadow-none' : ''} transition-all font-semibold rounded select-none text-xs">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full ${p.color} border-2 border-black flex items-center justify-center text-sm shadow animate-bounce" style="animation-duration: ${1 + idx * 0.2}s">
                ${p.emoji}
              </div>
              <span class="text-xs font-black text-black">${p.name}</span>
            </div>
            <div class="text-xs font-mono font-black text-black bg-white border border-black px-1.5 py-0.5">
              ${localScores[p.id]} px
            </div>
          </div>
        `;
      });

      sidebar.innerHTML += `
          </div>
        </div>
      `;

      // Highlight card board perimeter glow matching current player
      gridDiv.className = `grid grid-cols-4 gap-3 bg-white border-4 ${currentActivePlayer.borderColor} p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full aspect-square max-w-[480px] transition-all duration-300`;
    }

    function renderGrid() {
      gridDiv.innerHTML = '';
      
      deck.forEach((cardObj: { display: string; matchId: number }, index: number) => {
        const card = document.createElement('div');
        card.className = "perspective-1000 aspect-square cursor-pointer";
        
        const isFlipped = flippedIndices.includes(index) || matchedIndices.includes(index);
        
        card.innerHTML = `
          <div class="w-full h-full duration-450 preserve-3d relative transition-transform ${isFlipped ? 'rotate-y-180' : ''}">
            <!-- Card Front Face (Mystery side) -->
            <div class="absolute inset-0 bg-[#FF6B6B] border-4 border-black hover:bg-black hover:text-white rounded-none flex items-center justify-center text-xl sm:text-3xl backface-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black text-black select-none text-center">
              ?
            </div>
            <!-- Card Back Face -->
            <div class="absolute inset-0 bg-white border-4 border-black rounded-none flex items-center justify-center backface-hidden rotate-y-180 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-br from-yellow-50 to-white text-center leading-none">
              <span class="${mode.id === 'math' ? 'text-[11px] sm:text-[15px] font-mono font-black px-1 text-black' : 'text-3xl sm:text-5xl'} font-display font-black">${cardObj.display}</span>
            </div>
          </div>
        `;

        if (!isFlipped && !lockGrid) {
          card.addEventListener('click', () => handleCardClick(index));
        }
        gridDiv.appendChild(card);
      });
    }

    function handleCardClick(index: number) {
      if (lockGrid || flippedIndices.length >= 2 || flippedIndices.includes(index)) return;

      flippedIndices.push(index);
      sfx.playTick();
      renderGrid();

      if (flippedIndices.length === 2) {
        lockGrid = true;
        const [first, second] = flippedIndices;

        if (deck[first].matchId === deck[second].matchId) {
          // MATCH MADE!
          sfx.playSuccess();
          setTimeout(() => {
            matchedIndices.push(first, second);
            
            // Reward current active player
            const actPlayer = activePlayers[activeTurnIndex];
            localScores[actPlayer.id] += 1;

            flippedIndices = [];
            lockGrid = false;
            
            renderGrid();
            updateTurnVisuals();
            renderLiveScoreHUD(container, activePlayers, localScores, ' Çift');

            // Check if completion is reached
            if (matchedIndices.length === deck.length) {
              handleGameCompletion();
            }
          }, 600);
        } else {
          // FAIL MISMATCH
          sfx.playFail();
          const actPlayer = activePlayers[activeTurnIndex];
          playerMismatches[actPlayer.id] = (playerMismatches[actPlayer.id] || 0) + 1;
          setTimeout(() => {
            flippedIndices = [];
            lockGrid = false;
            
            // Switch Turn
            activeTurnIndex = (activeTurnIndex + 1) % activePlayers.length;
            
            renderGrid();
            updateTurnVisuals();
          }, 1200);
        }
      }
    }

    function handleGameCompletion() {
      sfx.playFanfare();

      // Sum final points
      const rewardRatios = [35, 20, 10, 5];
      const sorted = Object.entries(localScores).sort((a,b) => b[1] - a[1]);
      const sortedPlayersList = sorted.map(([idStr]) => state.players.find(p => p.id === parseInt(idStr))!);
      const eliminationStatus = getRoundEliminationStatus(sortedPlayersList);

      let finalHTML = `
        <div class="my-auto bg-white border-4 border-black p-6 sm:p-10 max-w-xl w-full flex flex-col items-center space-y-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black relative overflow-hidden animate-fade-in z-40">
          <div class="text-5xl animate-bounce">🏆</div>
          <div>
            <h3 class="text-2xl sm:text-3xl font-display font-black text-black uppercase tracking-tight">Hafıza Arenası Tamamlandı!</h3>
            <p class="text-black/70 font-semibold text-xs mt-1">Eşleştirme mücadelesi bitti. Arena kupaları sahiplerine dağıtıldı!</p>
          </div>

          <div class="w-full space-y-3.5 my-4">
            <span class="block text-left text-[10px] font-mono text-black/60 font-black uppercase tracking-wider">SKOR KAZANIMLARI</span>
      `;

      sorted.forEach(([idStr, matchCount], idx) => {
        const pId = parseInt(idStr);
        const playerObj = state.players.find(p => p.id === pId)!;
        const ptsReward = (rewardRatios[idx] || 0) + (matchCount * 5); // Base match points + ranking points!

        let statusBadgeHTML = '';
        const elimInfo = eliminationStatus[playerObj.id];
        if (state.isEliminationMode && elimInfo) {
          statusBadgeHTML = `<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${elimInfo.colorClass}">${elimInfo.label}</span>`;
          if (elimInfo.status === 'eliminated') {
            playerObj.isEliminated = true;
          }
        }

        // Update historic points & persistant gold coins
        playerObj.score += ptsReward;
        playerObj.globalCoins = (playerObj.globalCoins || 0) + ptsReward;

        // Check perfect memory achievement
        const mismatches = playerMismatches[playerObj.id] || 0;
        if (matchCount >= 2 && mismatches === 0) {
          checkAndAwardAchievement(playerObj, 'perfect_memory');
        }

        savePlayerPersistentData(playerObj);

        finalHTML += `
          <div class="flex items-center justify-between bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div class="flex items-center gap-3">
              <span class="font-mono text-xs text-black font-black">#${idx+1}</span>
              ${getPlayerAvatarHTML(playerObj, "w-8 h-8 text-sm")}
              <span class="font-black text-black text-sm">${playerObj.name}</span>
              ${statusBadgeHTML}
            </div>
            <div class="text-right flex items-center gap-2">
              <div class="text-right flex flex-col leading-tight shrink-0">
                <span class="text-[10px] font-bold text-black/60 font-mono">${matchCount} Eşleşme</span>
                <span class="font-black text-xs bg-[#FDCB6E] border border-black px-2 mt-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">+${ptsReward} Puan</span>
              </div>
              <span class="font-extrabold text-xs bg-[#FFEAA7] border border-black px-2 py-1 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0 flex items-center gap-0.5">🪙+${ptsReward}</span>
            </div>
          </div>
        `;
      });

      finalHTML += `
          </div>
          <button id="memory-modal-continue" class="w-full py-4 bg-[#A29BFE] hover:bg-[#A29BFE] border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer">
            Liderlik Kürsüsüne Dön
          </button>
        </div>
      `;

      if (resultModal) {
        resultModal.innerHTML = finalHTML;
        resultModal.classList.remove('hidden');

        document.getElementById('memory-modal-continue')?.addEventListener('click', () => {
          handleGameFinished();
        });
      }
    }

    // Bind initial configurations
    document.getElementById('memory-quit')?.addEventListener('click', () => setScreen('gamesHub'));
    updateTurnVisuals();
    renderGrid();
    renderLiveScoreHUD(container, activePlayers, localScores, ' Çift');
  }
}

// ==========================================
// 6. COLOR TRAP GAME (Renk Tuzağı)
// ==========================================
function renderColorTrapGame() {
  const activePlayers = state.isEliminationMode
    ? state.players.filter(p => p.active && !p.isEliminated)
    : state.players.filter(p => p.active);
  let currentRound = 1;
  const maxRounds = 10;
  const roundTimeMs = 1800;
  let isGameOver = false;

  const playerRoundPushed: { [id: number]: boolean } = {};
  const activeScores: { [id: number]: number } = {};
  activePlayers.forEach(p => {
    playerRoundPushed[p.id] = false;
    activeScores[p.id] = 0;
  });

  const colorOptions = [
    { name: 'KIRMIZI', hex: '#FF6B6B', turkish: 'KIRMIZI' },
    { name: 'MAVİ', hex: '#A29BFE', turkish: 'MAVİ' },
    { name: 'YEŞİL', hex: '#2EC4B6', turkish: 'YEŞİL' },
    { name: 'SARI', hex: '#E6C619', turkish: 'SARI' }
  ];

  let currentWord = '';
  let currentColorHex = '';
  let currentColorName = '';
  let isSame = false;
  let roundTimer: any = null;
  let countdownTimer: any = null;
  let roundStartTime = 0;

  const container = document.createElement('div');
  container.className = "w-full max-w-5xl relative z-10 flex flex-col min-h-[580px] justify-between space-y-4 animate-fade-in select-none text-black";

  // Header panel
  const header = document.createElement('div');
  header.className = "bg-white border-4 border-black p-3.5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-3";
  header.innerHTML = `
    <div class="text-center sm:text-left">
      <h2 class="text-lg sm:text-xl font-display font-black text-black uppercase">🎨 RENK TUZAĞI (COLOR TRAP)</h2>
      <p class="text-black font-semibold text-[11px] mt-0.5">Kelimenin kendisi ile yazı rengi AYNIYSA tuşuna bas! Yanlış basarsan ceza puanı alırsın!</p>
    </div>
    <button id="color-trap-quit" class="px-3.5 py-1.5 text-[11px] font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
      ◀ Ayrıl
    </button>
  `;
  container.appendChild(header);

  // Layout chambers
  const mainGrid = document.createElement('div');
  mainGrid.className = "grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 items-stretch";
  container.appendChild(mainGrid);

  // Left scores side-bar
  const sideScores = document.createElement('div');
  sideScores.className = "md:col-span-1 bg-white border-4 border-black p-3.5 flex flex-col justify-between shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-black";
  mainGrid.appendChild(sideScores);

  // Central playground chamber
  const coreChamber = document.createElement('div');
  coreChamber.className = "md:col-span-3 bg-white border-4 border-black p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-h-[300px] text-black";
  mainGrid.appendChild(coreChamber);

  // Footer bumper buttons (Clickable)
  const footerBumpers = document.createElement('div');
  footerBumpers.className = `grid gap-2.5 ${
    activePlayers.length === 2 ? 'grid-cols-2 lg:grid-cols-2' : 
    activePlayers.length === 3 ? 'grid-cols-3' : 
    activePlayers.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-5'
  }`;
  container.appendChild(footerBumpers);

  activePlayers.forEach(p => {
    const b = document.createElement('button');
    b.id = `ct-bumper-${p.id}`;
    b.className = `py-3 bg-white border-4 ${p.borderColor} text-black font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center space-y-1 hover:bg-black hover:text-white active:scale-95 transition-all duration-100 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden`;
    b.innerHTML = `
      <div class="h-7 w-7 flex items-center justify-center text-lg bg-white border-2 border-black rounded-full select-none shadow">
        ${p.emoji}
      </div>
      <span class="font-bold text-[11px]">${p.name} BASTI!</span>
      ${!state.isMobileMode ? `<span class="text-[8px] text-black/50 font-mono font-black">TUŞ: [${p.keyLabel}]</span>` : ''}
    `;
    b.addEventListener('click', () => triggerPlayerInput(p.id));
    footerBumpers.appendChild(b);
  });

  const resultModal = document.createElement('div');
  resultModal.className = "hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col items-center overflow-y-auto p-4 text-center animate-fade-in";
  container.appendChild(resultModal);

  appRoot.appendChild(container);

  // Render side scores details
  function updateScoresLayout() {
    renderLiveScoreHUD(container, activePlayers, activeScores, ' Puan');
    sideScores.innerHTML = `
      <div class="space-y-3.5">
        <div class="flex items-center justify-between text-xs font-mono font-black border-2 border-black bg-white px-2 py-1 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <span>RAUND:</span>
          <span class="font-black text-[#FF6B6B]">${currentRound} / ${maxRounds}</span>
        </div>
        <span class="block text-[8px] font-mono text-black/45 uppercase tracking-widest font-black mt-2">AKTİF TURNUVA SKORLARI</span>
        <div class="space-y-1.5 mt-1">
          ${activePlayers.map(p => `
            <div id="score-sidebar-p-${p.id}" class="flex items-center justify-between p-1.5 bg-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
              <div class="flex items-center gap-1 font-semibold text-black">
                <span class="text-xs">${p.emoji}</span>
                <span class="font-bold text-[11px]">${p.name}</span>
              </div>
              <span class="font-mono text-[11px] font-black bg-white border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">
                ${activeScores[p.id]} Puan
              </span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="pt-2 border-t-2 border-dashed border-black/20 mt-3">
        <div class="p-2 bg-yellow-50 border-2 border-black font-sans font-bold text-[9px] text-black/80 leading-normal text-center">
          💡 Doğru eşleşmede ilk basan <b class="text-[#FF6B6B] font-extrabold">+2 Puan</b> alır, diğer doğru basanlar <b class="text-black font-black">+1 Puan</b>, yanlış basanlar ise <b class="text-red-500 font-extrabold">-1 Puan</b> kaybeder!
        </div>
      </div>
    `;
  }

  updateScoresLayout();

  function triggerPlayerInput(pId: number) {
    if (isGameOver || playerRoundPushed[pId]) return;
    playerRoundPushed[pId] = true;

    // Visual effect on button
    const btn = document.getElementById(`ct-bumper-${pId}`);
    if (btn) {
      btn.classList.add('bg-black', 'text-white');
    }

    // Evaluate
    if (isSame) {
      // Correct push
      // Find if anyone already pressed correctly
      const isFirst = Object.values(playerRoundPushed).filter(v => v).length === 1;
      const pts = isFirst ? 2 : 1;
      activeScores[pId] += pts;
      sfx.playSuccess();
      showCenterFloatingText(`+${pts} ${state.players.find(p => p.id === pId)?.name}`, pId);
    } else {
      // Wrong push! Penalized!
      activeScores[pId] = Math.max(0, activeScores[pId] - 1);
      sfx.playFail();
      showCenterFloatingText(`-1 CEZA!`, pId, true);
    }
    updateScoresLayout();
  }

  function showCenterFloatingText(text: string, pId: number, isError = false) {
    const player = state.players.find(p => p.id === pId)!;
    const item = document.createElement('div');
    item.className = `absolute text-xs font-black border-2 border-black px-2 py-0.5 ${isError ? 'bg-red-500 text-white' : player.color + ' text-black'} shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] animate-bounce z-20`;
    item.style.top = `${30 + Math.random() * 40}%`;
    item.style.left = `${20 + Math.random() * 60}%`;
    item.innerText = text;
    coreChamber.appendChild(item);
    setTimeout(() => item.remove(), 1000);
  }

  function startNextRound() {
    if (currentRound > maxRounds) {
      finishGame();
      return;
    }

    activePlayers.forEach(p => {
      playerRoundPushed[p.id] = false;
      const btn = document.getElementById(`ct-bumper-${p.id}`);
      if (btn) btn.classList.remove('bg-black', 'text-white');
    });

    // Make random combination
    const wordIndex = Math.floor(Math.random() * colorOptions.length);
    const colorIndex = Math.floor(Math.random() * colorOptions.length);

    const matchRandomState = Math.random() < 0.45; // 45% chance to be identical
    if (matchRandomState) {
      currentWord = colorOptions[wordIndex].name;
      currentColorHex = colorOptions[wordIndex].hex;
      currentColorName = colorOptions[wordIndex].turkish;
      isSame = true;
    } else {
      currentWord = colorOptions[wordIndex].name;
      const alternativeHexIndex = (wordIndex + 1 + Math.floor(Math.random() * (colorOptions.length - 1))) % colorOptions.length;
      currentColorHex = colorOptions[alternativeHexIndex].hex;
      currentColorName = colorOptions[alternativeHexIndex].turkish;
      isSame = currentWord === currentColorName;
    }

    updateScoresLayout();

    // Draw central graphics
    coreChamber.innerHTML = `
      <div class="text-center space-y-4.5 flex flex-col items-center min-w-[260px] sm:min-w-[380px]">
        <div>
          <span class="text-[9px] font-mono font-black border-2 border-black bg-black text-white px-2 py-0.5 shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
            SORU RAUNDU: ${currentRound} / ${maxRounds}
          </span>
        </div>
        
        <div class="p-6 sm:p-8 border-4 border-black w-full bg-[#FAFAFA] flex flex-col items-center justify-center relative shadow-[4px_4px_0_rgba(0,0,0,1)] select-none">
          <h2 class="text-4xl sm:text-5xl font-sans font-black tracking-tight select-none uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.15)]" style="color: ${currentColorHex};">
            ${currentWord}
          </h2>
        </div>

        <div class="flex flex-col items-center gap-0.5">
          <span class="text-[9px] font-black uppercase text-black/45">KURAL ANALİZİ:</span>
          <span class="text-xs font-black font-sans uppercase bg-yellow-105 border-2 border-black px-3.5 py-1 relative shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
            Yazı Rengi kelimeyle UYUŞUYOR MU?
          </span>
        </div>

        <!-- Timer visual row -->
        <div class="w-full bg-white border-2 border-black h-3.5 relative shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div id="ct-round-bar" class="h-full bg-[#FF6B6B] transition-all duration-100 ease-linear" style="width: 100%"></div>
        </div>
      </div>
    `;

    sfx.playTick();
    roundStartTime = Date.now();

    // Timer animations
    let remaining = roundTimeMs;
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      remaining -= 100;
      const bar = document.getElementById('ct-round-bar');
      if (bar) {
        bar.style.width = `${(remaining / roundTimeMs) * 100}%`;
      }
    }, 100);

    if (roundTimer) clearTimeout(roundTimer);
    roundTimer = setTimeout(() => {
      currentRound++;
      startNextRound();
    }, roundTimeMs);
  }

  function finishGame() {
    isGameOver = true;
    if (roundTimer) clearTimeout(roundTimer);
    if (countdownTimer) clearInterval(countdownTimer);

    // Save outputs
    const sorted = Object.entries(activeScores).sort((a,b) => b[1] - a[1]);
    const sortedPlayersList = sorted.map(([idStr]) => state.players.find(p => p.id === parseInt(idStr))!);
    const eliminationStatus = getRoundEliminationStatus(sortedPlayersList);
    const winnerId = parseInt(sorted[0][0]);
    const winnerPlayer = state.players.find(p => p.id === winnerId)!;

    // Allocate tournament points
    const allocations = [35, 20, 10, 5];
    let modalHTML = `
      <div class="my-auto bg-white border-4 border-black p-5 sm:p-8 max-w-xl w-full flex flex-col items-center space-y-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black animate-fade-in relative z-45">
        <div class="w-14 h-14 rounded-full ${winnerPlayer.color} border-4 border-black flex items-center justify-center text-4xl shadow animate-bounce">
          🎨
        </div>
        <div>
          <h3 class="text-xl sm:text-2xl font-display font-black text-black uppercase tracking-tight">RENK ŞAMPİYONU</h3>
          <p class="text-xs font-bold text-black/70 mt-1">${winnerPlayer.name} renk algısını mükemmel şekilde çözerek galibiyete ulaştı!</p>
        </div>

        <div class="w-full space-y-2.5 my-3">
          <span class="block text-[9px] font-mono text-black/60 font-black uppercase tracking-widest text-left">FİNAL PUAN DAĞILIMI</span>
    `;

    sorted.forEach(([idStr, rndScore], idx) => {
      const pId = parseInt(idStr);
      const plyObj = state.players.find(p => p.id === pId)!;
      const awardVal = allocations[idx] || 0;

      let statusBadgeHTML = '';
      const elimInfo = eliminationStatus[plyObj.id];
      if (state.isEliminationMode && elimInfo) {
        statusBadgeHTML = `<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${elimInfo.colorClass}">${elimInfo.label}</span>`;
        if (elimInfo.status === 'eliminated') {
          plyObj.isEliminated = true;
        }
      }

      plyObj.score += awardVal;
      plyObj.globalCoins = (plyObj.globalCoins || 0) + awardVal;
      savePlayerPersistentData(plyObj);

      modalHTML += `
        <div class="flex items-center justify-between bg-white border-2 border-black p-2.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <div class="flex items-center gap-2.5">
            <span class="font-mono text-xs text-black font-black">#${idx + 1}</span>
            ${getPlayerAvatarHTML(plyObj, "w-7 h-7 text-xs")}
            <span class="font-black text-xs text-black">${plyObj.name}</span>
            ${statusBadgeHTML}
          </div>
          <div class="flex items-center gap-1.5 font-semibold text-black">
            <span class="text-xs font-mono font-black">${rndScore} Pts</span>
            <span class="font-extrabold text-[9px] bg-[#FDCB6E] border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">+${awardVal} Tur Pts</span>
            <span class="font-extrabold text-[9px] bg-[#FFEAA7] border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">🪙+${awardVal}</span>
          </div>
        </div>
      `;
    });

    modalHTML += `
       </div>
       <button id="color-trap-modal-continue" class="w-full py-3.5 bg-[#4ECDC4] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
         Arena Kürsüsüne İlerle
       </button>
      </div>
    `;

    sfx.playFanfare();
    resultModal.innerHTML = modalHTML;
    resultModal.classList.remove('hidden');

    document.getElementById('color-trap-modal-continue')?.addEventListener('click', () => {
      handleGameFinished();
    });
  }

  // Keyboard binding
  const keyboardHandler = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const target = activePlayers.find(p => p.key === e.code);
    if (target) {
      const btn = document.getElementById(`ct-bumper-${target.id}`);
      if (btn) {
        btn.classList.add('bg-black', 'text-white', 'scale-95');
        setTimeout(() => btn.classList.remove('scale-95'), 80);
      }
      triggerPlayerInput(target.id);
    }
  };

  window.addEventListener('keydown', keyboardHandler);

  // Exit cleanup
  document.getElementById('color-trap-quit')?.addEventListener('click', () => {
    if (roundTimer) clearTimeout(roundTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    window.removeEventListener('keydown', keyboardHandler);
    setScreen('gamesHub');
  });

  const observer = new MutationObserver(() => {
    if (!document.getElementById('color-trap-quit')) {
      if (roundTimer) clearTimeout(roundTimer);
      if (countdownTimer) clearInterval(countdownTimer);
      window.removeEventListener('keydown', keyboardHandler);
      observer.disconnect();
    }
  });
  observer.observe(appRoot, { childList: true });

  // Boot first round
  startNextRound();
}

// ==========================================
// 6B. CLICK DERBY GAME (Işık Avcısı)
// ==========================================
function renderClickDerbyGame() {
  const activePlayers = state.isEliminationMode
    ? state.players.filter(p => p.active && !p.isEliminated)
    : state.players.filter(p => p.active);
  let gameTimeLeft = 15; // 15 seconds match
  let isGameOver = false;

  const activeScores: { [id: number]: number } = {};
  activePlayers.forEach(p => {
    activeScores[p.id] = 0;
  });

  // Light states: 'green' (go!), 'yellow' (careful), 'red' (danger)
  let lightState: 'green' | 'yellow' | 'red' = 'red';
  let centralTimer: any = null;
  let gameLoopTimer: any = null;

  const container = document.createElement('div');
  container.className = "w-full max-w-5xl relative z-10 flex flex-col min-h-[580px] justify-between space-y-4 animate-fade-in select-none text-black";

  // Top header panel
  const header = document.createElement('div');
  header.className = "bg-white border-4 border-black p-3 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-3";
  header.innerHTML = `
    <div class="text-center sm:text-left">
      <h2 class="text-lg sm:text-xl font-display font-black text-black uppercase">⚡ IŞIK AVCISI (LIGHT HUNTER)</h2>
      <p class="text-black font-semibold text-[11px] mt-0.5">Lamba <b class="text-emerald-500 font-extrabold">YEŞİL</b> yandığında çılgınlar gibi bas! <b class="text-yellow-500 font-extrabold">SARI</b> yandığında -1, <b class="text-red-500 font-extrabold">KIRMIZI</b> yandığında -2 ceza alırsın!</p>
    </div>
    <button id="click-derby-quit" class="px-3.5 py-1.5 text-[11px] font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
      ◀ Ayrıl
    </button>
  `;
  container.appendChild(header);

  // Main columns
  const arena = document.createElement('div');
  arena.className = "grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 items-stretch";
  container.appendChild(arena);

  // Left comparative panel
  const sidePanel = document.createElement('div');
  sidePanel.className = "md:col-span-1 bg-white border-4 border-black p-3.5 flex flex-col justify-between shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-black";
  arena.appendChild(sidePanel);

  // Big central display chamber
  const mainChamber = document.createElement('div');
  mainChamber.className = "md:col-span-3 bg-[#FAFAFA] border-4 border-black p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-h-[300px] transition-colors duration-250 text-black";
  arena.appendChild(mainChamber);

  // Bottom action buttons
  const bottoms = document.createElement('div');
  bottoms.className = `grid gap-2.5 ${
    activePlayers.length === 2 ? 'grid-cols-2 lg:grid-cols-2' : 
    activePlayers.length === 3 ? 'grid-cols-3' : 
    activePlayers.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-5'
  }`;
  container.appendChild(bottoms);

  activePlayers.forEach(p => {
    const b = document.createElement('button');
    b.id = `cd-bumper-${p.id}`;
    b.className = `py-3 bg-white border-4 ${p.borderColor} text-black font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center space-y-1 hover:bg-black hover:text-white active:scale-95 transition-all duration-100 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden`;
    b.innerHTML = `
      <div class="h-7 w-7 flex items-center justify-center text-lg bg-white border-2 border-black rounded-full select-none shadow">
        ${p.emoji}
      </div>
      <span class="font-extrabold text-[11px]">${p.name}</span>
      ${!state.isMobileMode ? `<span class="text-[8px] text-black/50 font-mono font-bold">TUŞ: [${p.keyLabel}]</span>` : ''}
    `;
    b.addEventListener('click', () => registerClick(p.id));
    bottoms.appendChild(b);
  });

  const resModal = document.createElement('div');
  resModal.className = "hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col items-center overflow-y-auto p-4 text-center animate-fade-in";
  container.appendChild(resModal);

  appRoot.appendChild(container);

  function renderSidePanel() {
    renderLiveScoreHUD(container, activePlayers, activeScores, ' Tıklama');
    sidePanel.innerHTML = `
      <div class="space-y-3.5">
        <div class="flex items-center justify-between text-xs font-mono font-black border-2 border-black bg-white px-2 py-1 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <span>SÜRE:</span>
          <span class="font-black text-[#FF6B6B] animate-pulse">${gameTimeLeft} saniye</span>
        </div>
        <span class="block text-[8px] font-mono text-black/45 uppercase tracking-widest font-black mt-2">CANLI MASH SKORLARI</span>
        <div class="space-y-1.5 mt-1">
          ${activePlayers.map(p => `
            <div id="side-score-p-${p.id}" class="flex items-center justify-between p-1.5 bg-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
              <div class="flex items-center gap-1.5 font-semibold text-black">
                <span class="text-xs">${p.emoji}</span>
                <span class="font-bold text-[11px]">${p.name}</span>
              </div>
              <span class="font-mono text-xs font-black bg-white border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">
                ${activeScores[p.id]} tık
              </span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="pt-2 border-t-2 border-dashed border-black/20 mt-3 text-center">
        <div class="p-2 bg-rose-50 border-2 border-black font-sans font-bold text-[9px] text-black/80 leading-normal">
          🚨 Dikkat! Yeşil harici her tuş vuruşu ağır puan cezası keser! Gözlerin her an lambada olsun!
        </div>
      </div>
    `;
  }

  renderSidePanel();

  function registerClick(pId: number) {
    if (isGameOver) return;

    const player = state.players.find(p => p.id === pId)!;

    if (lightState === 'green') {
      activeScores[pId]++;
      sfx.playTick();
      spawnSpark(`+1`, player.color, pId);
    } else if (lightState === 'yellow') {
      activeScores[pId] = Math.max(0, activeScores[pId] - 1);
      sfx.playFail();
      spawnSpark(`-1 CEZA`, `bg-[#F1C40F] text-black`, pId, true);
    } else if (lightState === 'red') {
      activeScores[pId] = Math.max(0, activeScores[pId] - 2);
      sfx.playExplode();
      spawnSpark(`-2 BOMBA!`, `bg-[#EA2027] text-white`, pId, true);
    }
    renderSidePanel();
  }

  function spawnSpark(text: string, colorClass: string, pId: number, isError = false) {
    const item = document.createElement('div');
    item.className = `absolute text-[10px] font-black border-2 border-black px-2 py-0.5 ${colorClass} uppercase tracking-wider animate-bounce shadow-[1px_1px_0px_rgba(0,0,0,1)] z-20`;
    item.style.top = `${25 + Math.random() * 50}%`;
    item.style.left = `${15 + Math.random() * 70}%`;
    item.innerText = text;
    mainChamber.appendChild(item);
    setTimeout(() => item.remove(), 800);
  }

  function changeLight() {
    if (isGameOver) return;

    const rand = Math.random();
    if (rand < 0.50) lightState = 'green';
    else if (rand < 0.75) lightState = 'yellow';
    else lightState = 'red';

    let contentHTML = '';
    let bgColor = 'bg-[#FAFAFA]';

    if (lightState === 'green') {
      bgColor = 'bg-[#EBFBEE]';
      contentHTML = `
        <div class="flex flex-col items-center space-y-3.5 animate-bounce relative">
          <div class="w-20 h-20 rounded-full bg-emerald-500 border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] animate-ping absolute opacity-30" style="animation-duration: 2.5s;"></div>
          <div class="w-20 h-20 rounded-full bg-[#2ECC71] border-4 border-black flex items-center justify-center text-3xl select-none shadow-[3px_3px_0_rgba(0,0,0,1)] z-10">
            🟢
          </div>
          <h3 class="text-2xl font-display font-black text-[#2ECC71] drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] animate-pulse uppercase leading-none">ABAN! MASH! GO!</h3>
          <p class="text-[9px] font-sans font-bold text-black/60 uppercase">DURMA, TUŞUNA SÜREKLİ BAS!</p>
        </div>
      `;
    } else if (lightState === 'yellow') {
      bgColor = 'bg-[#FFF9E6]';
      contentHTML = `
        <div class="flex flex-col items-center space-y-3.5">
          <div class="w-20 h-20 rounded-full bg-[#F1C40F] border-4 border-black flex items-center justify-center text-3xl select-none shadow-[3px_3px_0_rgba(0,0,0,1)]">
            🟡
          </div>
          <h3 class="text-2xl font-display font-black text-[#F1C40F] drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] uppercase leading-none">DURAKSAMA SÜRESİ</h3>
          <p class="text-[9px] font-sans font-bold text-black/60 uppercase">BASMAYI KES, CEZA YAKINDA!</p>
        </div>
      `;
    } else {
      bgColor = 'bg-[#FFEBEE]';
      contentHTML = `
        <div class="flex flex-col items-center space-y-3.5 animate-pulse">
          <div class="w-20 h-20 rounded-full bg-[#E74C3C] border-4 border-black flex items-center justify-center text-3xl select-none shadow-[3px_3px_0_rgba(0,0,0,1)]">
            🔴
          </div>
          <h3 class="text-2xl font-display font-black text-[#E74C3C] drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] uppercase leading-none">⚠️ DUR! BASMA! ⚠️</h3>
          <p class="text-[9px] font-sans font-bold text-black/60 uppercase">BU DURUMDA MASH YAPMAK PUANINI ERİTİR!</p>
        </div>
      `;
    }

    mainChamber.className = `md:col-span-3 ${bgColor} border-4 border-black p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-h-[300px] transition-colors duration-200 text-black`;
    mainChamber.innerHTML = contentHTML;

    // Schedule next light change
    const delay = 900 + Math.random() * 1400;
    if (centralTimer) clearTimeout(centralTimer);
    centralTimer = setTimeout(changeLight, delay);
  }

  // Start general game logic timers
  changeLight();

  gameLoopTimer = setInterval(() => {
    gameTimeLeft--;
    renderSidePanel();

    if (gameTimeLeft <= 0) {
      finishGame();
    }
  }, 1000);

  function finishGame() {
    isGameOver = true;
    if (centralTimer) clearTimeout(centralTimer);
    if (gameLoopTimer) clearInterval(gameLoopTimer);

    // Leaderboards
    const sorted = Object.entries(activeScores).sort((a,b) => b[1] - a[1]);
    const sortedPlayersList = sorted.map(([idStr]) => state.players.find(p => p.id === parseInt(idStr))!);
    const eliminationStatus = getRoundEliminationStatus(sortedPlayersList);
    const winnerId = parseInt(sorted[0][0]);
    const winnerPlayer = state.players.find(p => p.id === winnerId)!;

    const allocations = [35, 20, 10, 5];
    let modalHTML = `
      <div class="my-auto bg-white border-4 border-black p-5 sm:p-8 max-w-xl w-full flex flex-col items-center space-y-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black animate-fade-in relative z-45">
        <div class="w-14 h-14 rounded-full ${winnerPlayer.color} border-4 border-black flex items-center justify-center text-4xl shadow animate-bounce">
          ⚡
        </div>
        <div>
          <h3 class="text-xl sm:text-2xl font-display font-black text-black uppercase tracking-tight">IŞIK USTASI</h3>
          <p class="text-xs font-bold text-black/70 mt-1">${winnerPlayer.name} ışık hızında harika refleks göstererek birinci oldu!</p>
        </div>

        <div class="w-full space-y-2.5 my-3">
          <span class="block text-[9px] font-mono text-black/60 font-black uppercase tracking-widest text-left">FİNAL PUAN DAĞILIMI</span>
    `;

    sorted.forEach(([idStr, tıkVal], idx) => {
      const pId = parseInt(idStr);
      const plyObj = state.players.find(p => p.id === pId)!;
      const award = allocations[idx] || 0;

      let statusBadgeHTML = '';
      const elimInfo = eliminationStatus[plyObj.id];
      if (state.isEliminationMode && elimInfo) {
        statusBadgeHTML = `<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${elimInfo.colorClass}">${elimInfo.label}</span>`;
        if (elimInfo.status === 'eliminated') {
          plyObj.isEliminated = true;
        }
      }

      plyObj.score += award;
      plyObj.globalCoins = (plyObj.globalCoins || 0) + award;
      savePlayerPersistentData(plyObj);

      modalHTML += `
        <div class="flex items-center justify-between bg-white border-2 border-black p-2.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <div class="flex items-center gap-2.5">
            <span class="font-mono text-xs text-black font-black">#${idx + 1}</span>
            ${getPlayerAvatarHTML(plyObj, "w-7 h-7 text-xs")}
            <span class="font-black text-xs text-black">${plyObj.name}</span>
            ${statusBadgeHTML}
          </div>
          <div class="flex items-center gap-1.5 font-semibold text-black">
            <span class="text-xs font-mono font-black">${tıkVal} tık</span>
            <span class="font-extrabold text-[9px] bg-[#FDCB6E] border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">+${award} Tur Pts</span>
            <span class="font-extrabold text-[9px] bg-[#FFEAA7] border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">🪙+${award}</span>
          </div>
        </div>
      `;
    });

    modalHTML += `
       </div>
       <button id="click-derby-modal-continue" class="w-full py-3.5 bg-[#4ECDC4] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
         Arena Kürsüsüne İlerle
       </button>
      </div>
    `;

    sfx.playFanfare();
    resModal.innerHTML = modalHTML;
    resModal.classList.remove('hidden');

    document.getElementById('click-derby-modal-continue')?.addEventListener('click', () => {
      handleGameFinished();
    });
  }

  // Bind keyboard keydowns
  const keysHandler = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const target = activePlayers.find(p => p.key === e.code);
    if (target) {
      const btn = document.getElementById(`cd-bumper-${target.id}`);
      if (btn) {
        btn.classList.add('bg-black', 'text-white', 'scale-95');
        setTimeout(() => btn.classList.remove('scale-95'), 80);
      }
      registerClick(target.id);
    }
  };

  window.addEventListener('keydown', keysHandler);

  // Quit controls
  document.getElementById('click-derby-quit')?.addEventListener('click', () => {
    if (centralTimer) clearTimeout(centralTimer);
    if (gameLoopTimer) clearInterval(gameLoopTimer);
    window.removeEventListener('keydown', keysHandler);
    setScreen('gamesHub');
  });

  const observer = new MutationObserver(() => {
    if (!document.getElementById('click-derby-quit')) {
      if (centralTimer) clearTimeout(centralTimer);
      if (gameLoopTimer) clearInterval(gameLoopTimer);
      window.removeEventListener('keydown', keysHandler);
      observer.disconnect();
    }
  });
  observer.observe(appRoot, { childList: true });
}

// ==========================================
// UNUSED REFLEX GAME
// ==========================================
function UNUSED_renderReactionGame() {
  const activePlayers = state.players.filter(p => p.active);
  let currentRound = 1;
  const maxRounds = 5;

  let roundState: 'idle' | 'waiting' | 'active' | 'finished' = 'idle';
  let targetItem: { emoji: string; type: 'coin' | 'diamond' | 'apple' | 'bomb'; name: string; score: number } | null = null;
  let activeTimer: any = null;
  let triggerTime = 0;
  let disqualifiedPlayers: number[] = [];

  const roundPoints: { [id: number]: number } = {};
  activePlayers.forEach(p => roundPoints[p.id] = 0);

  const container = document.createElement('div');
  container.className = "w-full max-w-2xl relative z-10 flex flex-col h-[90vh] max-h-[850px] justify-between space-y-4 animate-fade-in select-none text-black";

  // Top header panel
  const header = document.createElement('div');
  header.className = "bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4";
  header.innerHTML = `
    <div>
      <h2 class="text-xl sm:text-2xl font-display font-black text-black uppercase">⚡ REFLEKS REAKSİYONU</h2>
      <p class="text-black font-semibold text-xs mt-1">Orta sahada değerli eşyalar belirdiğinde ilk KAPAN kapar! Ama sakın Bombaya dokunmayın!</p>
    </div>
    <button id="reaction-quit" class="px-4 py-2 text-xs font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
      ◀ Arenadan Ayrıl
    </button>
  `;
  container.appendChild(header);

  // Main playing visual chamber
  const gameArea = document.createElement('div');
  gameArea.className = "grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 items-stretch";
  container.appendChild(gameArea);

  // Side list for points comparison
  const sideScores = document.createElement('div');
  sideScores.className = "md:col-span-1 bg-white border-4 border-black p-4 flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 text-black";
  gameArea.appendChild(sideScores);

  // Big central display dome
  const mainChamber = document.createElement('div');
  mainChamber.className = "md:col-span-3 bg-white border-4 border-black p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[350px] text-black";
  gameArea.appendChild(mainChamber);

  // Footer visual action board
  const reactionFooter = document.createElement('div');
  reactionFooter.className = `grid gap-3 ${
    activePlayers.length === 2 ? 'grid-cols-2 lg:grid-cols-2' : 
    activePlayers.length === 3 ? 'grid-cols-3' : 
    activePlayers.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-5'
  }`;
  container.appendChild(reactionFooter);

  // Register footer player activation panels
  activePlayers.forEach(player => {
    const bumper = document.createElement('button');
    bumper.id = `react-bumper-${player.id}`;
    bumper.className = `py-5 bg-white border-4 ${player.borderColor} text-black font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center space-y-1 hover:bg-black hover:text-white active:scale-95 transition-all duration-100 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden`;
    bumper.innerHTML = `
      <div class="animate-bounce" style="animation-duration: 2s;">
        ${getPlayerAvatarHTML(player, "w-10 h-10 text-xl")}
      </div>
      <span>${player.name} KAP!</span>
      ${!state.isMobileMode ? `<span class="text-[9px] text-black/50 font-mono font-black">TUŞ: [${player.keyLabel}]</span>` : ''}
      <div id="disq-badge-${player.id}" class="hidden absolute inset-0 bg-[#FF6B6B] border-2 border-black flex items-center justify-center text-[10px] font-mono tracking-widest text-black font-black uppercase z-20">
        🚫 FAUL KİLİDİ
      </div>
    `;
    reactionFooter.appendChild(bumper);
  });

  // Modal final results
  const resultModal = document.createElement('div');
  resultModal.className = "hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center overflow-y-auto p-4 sm:p-6 text-center animate-fade-in";
  container.appendChild(resultModal);

  appRoot.appendChild(container);

  // --- RENDERING ROUTINES ---
  function updateScoresUI() {
    renderLiveScoreHUD(container, activePlayers, roundPoints, ' px');
    sideScores.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs font-mono font-black border-2 border-black bg-white px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
          <span>RAUND:</span>
          <span class="font-extrabold text-[#FF6B6B]">${currentRound} / ${maxRounds}</span>
        </div>
        <span class="block text-[10px] font-mono text-black/60 uppercase tracking-widest font-black mt-2">RAUND SKORLARI</span>
        <div class="space-y-2 mt-1">
    `;

    activePlayers.forEach(p => {
      const isDisq = disqualifiedPlayers.includes(p.id);
      sideScores.innerHTML += `
        <div class="flex items-center justify-between p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative text-black">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full ${p.color} border-2 border-black flex items-center justify-center text-sm shadow shadow-black">
              ${p.emoji}
            </div>
            <span class="font-black text-black text-xs">${p.name}</span>
          </div>
          <span class="font-mono text-xs font-black ${isDisq ? 'text-red-500 line-through' : 'text-black'} bg-white border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">
            ${roundPoints[p.id]} px
          </span>
        </div>
      `;
    });

    sideScores.innerHTML += `
        </div>
      </div>
      <div>
        <button id="reaction-action-btn" class="w-full py-4 bg-[#FDCB6E] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-wider uppercase transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer">
          RAUNDU BAŞLAT
        </button>
      </div>
    `;

    // Rebind newly drawn action clickers
    const actBtn = document.getElementById('reaction-action-btn') as HTMLButtonElement;
    if (actBtn) {
      if (roundState === 'idle') {
        actBtn.innerText = "YENİ RAUND BAŞLAT";
        actBtn.disabled = false;
        actBtn.addEventListener('click', () => startRoundSeq());
      } else if (roundState === 'waiting') {
        actBtn.innerText = "BEKLENİYOR...";
        actBtn.disabled = true;
      } else if (roundState === 'active') {
        actBtn.innerText = "REAKSİYON VERİN!";
        actBtn.disabled = true;
      } else if (roundState === 'finished') {
        actBtn.innerText = "SONRAKİ RAUND";
        actBtn.disabled = false;
        actBtn.addEventListener('click', () => nextRoundShift());
      }
    }
  }

  // Sound patterns generators
  const itemsPreset = [
    { emoji: '🪙', type: 'coin' as const, name: 'Altın Sikke', score: 10 },
    { emoji: '💎', type: 'diamond' as const, name: 'Mavi Kristal', score: 20 },
    { emoji: '🍎', type: 'apple' as const, name: 'Parlak Elma', score: 5 },
    { emoji: '💣', type: 'bomb' as const, name: 'Yıkıcı Bomba', score: -15 }
  ];

  function startRoundSeq() {
    roundState = 'waiting';
    disqualifiedPlayers = [];
    
    // Hide disq panels
    activePlayers.forEach(p => {
      const badge = document.getElementById(`disq-badge-${p.id}`);
      if (badge) badge.classList.add('hidden');
    });

    updateScoresUI();

    mainChamber.innerHTML = `
      <div class="text-center space-y-4 animate-pulse flex flex-col items-center">
        <span class="text-7xl">⚔️</span>
        <h3 class="text-3xl font-display font-black text-[#FF6B6B] tracking-wide uppercase">HAZIR OLUN...</h3>
        <p class="text-xs text-black font-semibold tracking-wide uppercase">Ganimet her an düşebilir! Sakın erkenden basmayın!</p>
      </div>
    `;

    // Wait random delay between 1.8s to 4.5s
    const delay = 1800 + Math.random() * 2700;
    
    activeTimer = setTimeout(() => {
      spawnTargetItem();
    }, delay);
  }

  function spawnTargetItem() {
    if (roundState !== 'waiting') return;
    
    roundState = 'active';
    updateScoresUI();

    // Select random item
    targetItem = itemsPreset[Math.floor(Math.random() * itemsPreset.length)];
    triggerTime = Date.now();

    mainChamber.innerHTML = `
      <div class="text-center space-y-6 flex flex-col items-center">
        <!-- Exploding ring light indicator -->
        <div class="absolute inset-0 border-8 border-black bg-yellow-105 pointer-events-none rounded-none"></div>

        <div class="text-7xl scale-[1] select-none text-center animate-bounce shadow-[4px_4px_0_rgba(0,0,0,1)] bg-white border-4 border-black w-28 h-28 flex items-center justify-center">
          ${targetItem.emoji}
        </div>

        <div class="space-y-1">
          <h3 class="text-2xl sm:text-3xl font-display font-black uppercase text-black">${targetItem.name}</h3>
          <p class="text-xs font-mono font-black ${targetItem.score < 0 ? 'text-[#FF6B6B]' : 'text-black'} bg-white border border-black px-2.5 py-1 shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase tracking-tight">
            ${targetItem.score < 0 ? 'DOKUNAN YANAR! (' + targetItem.score + ' Pts)' : 'KAP VE KAZAN! (+' + targetItem.score + ' Pts)'}
          </p>
        </div>
      </div>
    `;

    sfx.playPop();

    // Timeout if user fails to click within 2s
    activeTimer = setTimeout(() => {
      handleItemTimeout();
    }, 2000);
  }

  function handleItemTimeout() {
    if (roundState !== 'active') return;
    
    roundState = 'finished';
    
    mainChamber.innerHTML = `
      <div class="text-center space-y-3 flex flex-col items-center">
        <span class="text-5xl">⏳</span>
        <h3 class="text-xl font-black text-black/60 uppercase">SÜRE BİTTİ!</h3>
        <p class="text-xs font-semibold text-black/80">Kimse reaksiyon göstermedi ve ganimet çürüdü...</p>
      </div>
    `;

    updateScoresUI();
  }

  function handlePlayerAction(pId: number) {
    const playerObj = activePlayers.find(p => p.id === pId)!;

    if (roundState === 'waiting') {
      // EARLY TAP DISQUALIFICATION!
      if (disqualifiedPlayers.includes(pId)) return;
      
      disqualifiedPlayers.push(pId);
      sfx.playFail();

      // Show locked screen banner
      const badge = document.getElementById(`disq-badge-${pId}`);
      if (badge) badge.classList.remove('hidden');

      // Deduct score right away as fault penalty!
      roundPoints[pId] = Math.max(-20, roundPoints[pId] - 6);
      
      // Update middle console informing about foul
      const notes = document.createElement('div');
      notes.className = "absolute top-4 left-4 right-4 bg-[#FF6B6B] text-black border-4 border-black p-3 text-xs text-center font-black tracking-wide shadow-[4px_4px_0_rgba(0,0,0,1)]";
      notes.innerText = `FAUL! ${playerObj.name} erken davrandı! Bu raunt kilitlendi (-6 Pts penalty)`;
      mainChamber.appendChild(notes);
      
      updateScoresUI();

      // If everyone is disqualified, immediately end waiting
      if (disqualifiedPlayers.length === activePlayers.length) {
        clearTimeout(activeTimer);
        roundState = 'finished';
        mainChamber.innerHTML = `
          <div class="text-center space-y-3 flex flex-col items-center">
            <span class="text-5xl">🛑</span>
            <h3 class="text-xl font-black text-[#FF6B6B] uppercase">HERKES DISKALİFİYE!</h3>
            <p class="text-xs font-semibold text-black/70">Bütün oyuncular erken basıp raundu yaktı.</p>
          </div>
        `;
        updateScoresUI();
      }
    } else if (roundState === 'active') {
      // VALID REACTION TRIGGERING!
      if (disqualifiedPlayers.includes(pId)) return; // Disqualified player can't grab positive
      
      clearTimeout(activeTimer);
      roundState = 'finished';

      const reactionTimeMs = Date.now() - triggerTime;
      const grabbedItem = targetItem!;

      if (grabbedItem.type === 'bomb') {
        // HIT BOMB BLOWOUT!
        sfx.playExplode();
        roundPoints[pId] += grabbedItem.score; // Reduce score!

        mainChamber.innerHTML = `
          <div class="text-center space-y-4 flex flex-col items-center">
            <span class="text-7xl">💥</span>
            <h3 class="text-3xl font-display font-black text-red-500 uppercase">GÜM! BAKIŞI KAÇIRDIN!</h3>
            <p class="text-xs font-bold text-black/80">${playerObj.name} bombaya kafa attı ve ${grabbedItem.score} puan kaybetti!</p>
          </div>
        `;
      } else {
        // POSITIVE SECURED CHIME!
        sfx.playSuccess();
        roundPoints[pId] += grabbedItem.score;

        if (reactionTimeMs <= 250) {
          checkAndAwardAchievement(playerObj, 'speed_demon_220');
        }

        mainChamber.innerHTML = `
          <div class="text-center space-y-3 flex flex-col items-center">
            <div class="w-12 h-12 rounded-full ${playerObj.color} border-4 border-black flex items-center justify-center text-sm shadow shadow-black mx-auto">
              ${playerObj.emoji}
            </div>
            <h3 class="text-2xl sm:text-3xl font-display font-black text-black uppercase">HELAL OLSUN!</h3>
            <p class="text-xs font-bold text-black/80">
              <span class="underline">${playerObj.name}</span>, ${grabbedItem.emoji} <strong>${grabbedItem.name}</strong> fırlatmasını <strong class="font-mono text-black underline">${(reactionTimeMs/1000).toFixed(3)}s</strong> sürede kaptı!
            </p>
          </div>
        `;
      }

      updateScoresUI();
    }
  }

  function nextRoundShift() {
    if (currentRound < maxRounds) {
      currentRound += 1;
      roundState = 'idle';
      targetItem = null;
      updateScoresUI();
      
      mainChamber.innerHTML = `
        <div class="text-center space-y-4 flex flex-col items-center">
          <span class="text-5xl">🎯</span>
          <h3 class="text-xl font-black text-black/50 uppercase">Sıradaki Raund Başlıyor!</h3>
          <p class="text-xs font-semibold text-black/80">Konsantre olun ve butonu ateşleme için bekleyin.</p>
        </div>
      `;
    } else {
      // GAME WRAP FINISHING!
      sfx.playFanfare();

      // Distribute points permanently
      const rewardMap = [35, 20, 10, 5];
      const sorted = Object.entries(roundPoints).sort((a,b) => b[1] - a[1]);

      let resultsHTML = `
        <div class="my-auto bg-white border-4 border-black p-6 sm:p-10 max-w-xl w-full flex flex-col items-center space-y-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black relative overflow-hidden animate-fade-in z-45">
          <div class="text-5xl animate-bounce">⚡</div>
          <div>
            <h3 class="text-2xl sm:text-3xl font-display font-black text-black uppercase tracking-tight">Refleks Arenası Tamamlandı!</h3>
            <p class="text-black/70 font-semibold text-xs mt-1">5 tur boyunca en çılgın reaksiyonları gösterenler belirlendi!</p>
          </div>

          <div class="w-full space-y-3.5 my-4">
            <span class="block text-left text-[10px] font-mono text-black/60 font-black uppercase tracking-wider">SKOR KAZANIMLARI</span>
      `;

      sorted.forEach(([idStr, rPts], idx) => {
        const pId = parseInt(idStr);
        const playerObj = state.players.find(p => p.id === pId)!;
        const awarded = rewardMap[idx] || 0;

        // Save progress to global profile score and persistent coins
        playerObj.score += awarded;
        playerObj.globalCoins = (playerObj.globalCoins || 0) + awarded;
        savePlayerPersistentData(playerObj);

        resultsHTML += `
          <div class="flex items-center justify-between bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div class="flex items-center gap-3">
              <span class="font-mono text-xs text-black font-black">#${idx + 1}</span>
              ${getPlayerAvatarHTML(playerObj, "w-8 h-8 text-sm")}
              <span class="font-black text-black text-sm">${playerObj.name}</span>
            </div>
            <div class="text-right flex items-center gap-2 font-black text-black">
              <div class="text-right flex flex-col leading-tight shrink-0">
                <span class="text-[10px] font-bold text-black/60 font-mono">${rPts} Raund Pts</span>
                <span class="font-black text-xs bg-yellow-400 border border-black px-2 mt-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">+${awarded} Puan</span>
              </div>
              <span class="font-extrabold text-xs bg-[#FFEAA7] border border-black px-2 py-1 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0 flex items-center gap-0.5">🪙+${awarded}</span>
            </div>
          </div>
        `;
      });

      resultsHTML += `
         </div>
         <button id="reaction-modal-continue" class="w-full py-4 bg-[#FDCB6E] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer">
           Liderlik Kürsüsüne Dön
         </button>
        </div>
      `;

      if (resultModal) {
        resultModal.innerHTML = resultsHTML;
        resultModal.classList.remove('hidden');

        document.getElementById('reaction-modal-continue')?.addEventListener('click', () => {
          handleGameFinished();
        });
      }
    }
  }

  // Bind individual clickers
  activePlayers.forEach(p => {
    const btn = document.getElementById(`react-bumper-${p.id}`);
    if (btn) {
      btn.addEventListener('click', () => handlePlayerAction(p.id));

      // Enhanced touch controls with visual haptic scale feedback and zero-latency triggers
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.classList.add('scale-95', 'bg-black', 'text-white');
        handlePlayerAction(p.id);
      }, { passive: false });

      const cleanUpTouch = () => {
        btn.classList.remove('scale-95', 'bg-black', 'text-white');
      };

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        setTimeout(cleanUpTouch, 50);
      }, { passive: false });

      btn.addEventListener('touchcancel', cleanUpTouch);
    }
  });

  // Hotkey mapping triggers
  const keyMapList = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const targetPlayer = activePlayers.find(p => p.key === e.code);
    if (targetPlayer) {
      // Button glowing simulation
      const btn = document.getElementById(`react-bumper-${targetPlayer.id}`);
      if (btn) {
        btn.classList.add('scale-95', 'bg-black', 'text-white');
        setTimeout(() => btn.classList.remove('scale-95', 'bg-black', 'text-white'), 80);
      }
      handlePlayerAction(targetPlayer.id);
    }
  };
  window.addEventListener('keydown', keyMapList);

  document.getElementById('reaction-quit')?.addEventListener('click', () => {
    window.removeEventListener('keydown', keyMapList);
    setScreen('gamesHub');
  });

  // Setup memory garbage disposal when navigating away
  const observer = new MutationObserver(() => {
    if (!document.getElementById('reaction-quit')) {
      window.removeEventListener('keydown', keyMapList);
      observer.disconnect();
    }
  });
  observer.observe(appRoot, { childList: true });

  // Draw initial scores panel
  updateScoresUI();
  
  mainChamber.innerHTML = `
    <div class="text-center space-y-4 flex flex-col items-center">
      <span class="text-7xl">⚔️</span>
      <h3 class="text-2xl font-display font-black text-black">BAŞLAMAK İÇİN TIKLAYIN!</h3>
      <p class="text-xs font-semibold text-black/60">Sağdaki "Raundu Başlat" butonuna basın ve heyecan fırtınasına hazır olun.</p>
    </div>
  `;
}

// ==========================================
// 7. GAME OVER SCREEN (Bitiş / Kürsü)
// ==========================================
function renderGameOver() {
  const activePlayers = state.players.filter(p => p.active);
  
  // Sort players high to low
  const podium = [...activePlayers].sort((a,b) => b.score - a.score);
  const absoluteWinner = podium[0];

  const container = document.createElement('div');
  container.className = "w-full max-w-4xl bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 flex flex-col items-center space-y-8 animate-fade-in text-center text-black";

  let podiumHTML = `
    <!-- Top badge ribbon -->
    <div class="flex items-center gap-1.5 px-4 py-1.5 bg-[#FDCB6E] border-2 border-black text-black font-mono text-xs tracking-widest uppercase font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      👑 PARTİ ARENASI SONUÇLANDI
    </div>

    <!-- Celebration Crown text -->
    <div class="space-y-2">
      <h2 class="text-4xl sm:text-5xl font-display font-black text-black uppercase tracking-tight">KAZANAN: ${absoluteWinner.name}!</h2>
      <p class="text-black font-semibold text-sm">Katılan tüm yolculara şükranlarımızı sunarız. İşte genel kapışma sıralaması:</p>
    </div>

    <!-- Decorative visual Podium cards layout -->
    <div class="flex flex-col sm:flex-row items-end justify-center gap-6 w-full max-w-2xl py-6 select-none leading-none">
  `;

  // Draw podium elements: [2nd, 1st, 3rd] if 3 or 4 players, else simple list
  const arrangePodium = [];
  if (podium.length >= 3) {
    arrangePodium.push(podium[1]); // 2nd on left
    arrangePodium.push(podium[0]); // 1st center
    arrangePodium.push(podium[2]); // 3rd right
    if (podium[3]) arrangePodium.push(podium[3]); // 4th appended
  } else {
    // 2 players simple side-by-side
    arrangePodium.push(podium[0]);
    arrangePodium.push(podium[1]);
  }

  arrangePodium.forEach((player) => {
    const rank = podium.indexOf(player) + 1;
    
    // Customize sizes & margins based on rank
    const barHeight = rank === 1 ? 'h-40 sm:h-48' : rank === 2 ? 'h-32 sm:h-36' : rank === 3 ? 'h-24 sm:h-28' : 'h-16 sm:h-20';
    const fillBg = rank === 1 ? 'bg-[#FFEAA7]' : rank === 2 ? 'bg-[#DFE6E9]' : rank === 3 ? 'bg-[#FAB1A0]' : 'bg-gray-100';
    const stripeBg = rank === 1 ? 'bg-[#F1C40F]' : rank === 2 ? 'bg-[#BDC3C7]' : rank === 3 ? 'bg-[#E67E22]' : 'bg-gray-400';

    podiumHTML += `
      <div class="flex-1 flex flex-col items-center w-full">
        <!-- Badge Avatar bubble -->
        <div class="relative ${rank === 1 ? 'animate-bounce' : ''} mb-3.5 flex items-center justify-center">
          ${getPlayerAvatarHTML(player, "w-16 h-16 text-3xl")}
          <!-- Crown on P1 -->
          ${rank === 1 ? '<span class="absolute -top-5 text-2xl rotate-12 z-20">👑</span>' : ''}
        </div>
        
        <div class="text-sm font-black text-black max-w-[120px] truncate mb-1">${player.name}</div>
        <div class="text-[10px] font-mono text-black/60 tracking-wider mb-2">${player.avatarName}</div>

        <!-- Standing Podium Block -->
        <div class="w-full ${fillBg} border-4 border-black rounded-2xl ${barHeight} flex flex-col justify-center items-center gap-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-4 ${stripeBg} border-b-2 border-black"></div>
          <span class="text-4xl font-display font-black text-black mt-2">${rank}.</span>
          ${state.isEliminationMode && player.isEliminated ? `
            <span class="font-black text-[10px] text-red-700 font-mono bg-[#FFF0F2] border-2 border-[#FF7675] px-2 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] rounded select-none">❌ ELENDİ</span>
          ` : `
            <span class="font-black text-xs text-black font-mono bg-white border border-black px-2 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">${player.score} <span class="text-[9px] text-black/60 font-black">Pts</span></span>
          `}
        </div>
      </div>
    `;
  });

  // --- INJECT TOURNAMENT DOMINANCE MAP WITH DYNAMIC SVG BAR CHART ---
  const totalSum = activePlayers.reduce((acc, p) => acc + p.score, 0);
  const maxScore = Math.max(...activePlayers.map(p => p.score), 1);
  
  // Create beautiful mini capsules for the chart legend
  let legendHTML = '';
  podium.forEach(p => {
    const scoreDisplay = state.isEliminationMode && p.isEliminated 
      ? '<strong class="text-red-650 font-black">ELENDİ</strong>'
      : `<span>Puan: <strong class="underline">${p.score}</strong></span>`;
    legendHTML += `
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-black text-[9px] font-mono font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        <span class="w-2.5 h-2.5 border border-black shrink-0" style="background-color: ${p.hexColor};"></span>
        <span>${p.name}: ${scoreDisplay}</span>
      </span>
    `;
  });

  podiumHTML += `
    </div>

    <!-- Live Performance Dominator Chart Section -->
    <div class="w-full bg-white border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left flex flex-col space-y-4 my-2 select-none">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between border-b-4 border-black pb-3 gap-2">
        <div>
          <span class="text-[9px] font-mono uppercase tracking-widest text-black/60 font-black block">ARENA ANALİZ MERKEZİ</span>
          <h3 class="text-lg sm:text-xl font-display font-black text-black uppercase">📊 DOMİNASYON GRAFİĞİ</h3>
        </div>
        <div class="flex flex-wrap gap-1.5 max-w-full">
          ${legendHTML}
        </div>
      </div>

      <!-- Chart Content Base Screen -->
      <div class="relative w-full overflow-hidden bg-[#fafafa] border-4 border-black p-3 select-none flex items-center justify-center min-h-[290px]">
         <!-- Custom Responsive Dynamic SVG Chart -->
         <svg id="dominance-chart" class="w-full h-64 max-w-xl overflow-visible" viewBox="0 0 500 240"></svg>
         
         <!-- HTML Floating Neo-Brutalist Tooltip inside chart frame -->
         <div id="chart-tooltip" class="absolute pointer-events-none opacity-0 bg-white text-black text-xs font-black p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-30 transition-opacity duration-150 rounded-none max-w-[220px]"></div>
      </div>
      
      <!-- Dominance insights custom tailored footer -->
      <div id="dominance-insight" class="bg-[#FFEAA7] border-4 border-black p-4 text-xs font-black leading-relaxed text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
         <!-- Will be computed dynamically below -->
      </div>
    </div>

    <!-- Restart Panel trigger buttons -->
    <div class="flex flex-col sm:flex-row gap-4 w-full justify-center pt-2">
      <button id="restart-to-char" class="px-8 py-4 bg-white hover:bg-black hover:text-white text-black border-4 border-black font-black tracking-wider uppercase text-xs transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer font-display">
        ◀ Karakter Değiştir
      </button>
      <button id="restart-to-lobby" class="px-10 py-4 bg-[#A29BFE] hover:bg-black hover:text-white text-black border-4 border-black font-black tracking-widest text-sm uppercase transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer font-display">
        🎮 YENİ PARTİ BAŞLAT
      </button>
    </div>
  `;

  container.innerHTML = podiumHTML;
  appRoot.appendChild(container);

  // --- DRAW THE DYNAMIC SVG CONTENT ---
  const svg = document.getElementById('dominance-chart') as any;
  if (svg) {
    let svgContent = '';
    
    // CSS Styles embedded securely inside the SVG
    svgContent += `
      <style>
        .grid-line {
          stroke: #000000;
          stroke-opacity: 0.12;
          stroke-dasharray: 4 4;
          stroke-width: 2px;
        }
        .axis-baseline {
          stroke: #000000;
          stroke-width: 4px;
        }
        .chart-label {
          font-family: 'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif;
          font-weight: 900;
          fill: #000000;
        }
        .chart-value-label {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 950;
          font-size: 10px;
          fill: #000000;
        }
        .chart-bar-interactive {
          cursor: pointer;
          transition: filter 0.15s ease;
        }
        .chart-bar-interactive:hover {
          filter: brightness(1.1);
        }
        @keyframes pop-emoji {
          0% { transform: scale(0); opacity: 0; }
          80% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        .emoji-actor {
          transform-box: fill-box;
          transform-origin: center;
          opacity: 0;
          animation: pop-emoji 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      </style>
    `;
    
    // Define layout sizes
    const chartMinY = 30;
    const chartMaxY = 190;
    const chartHeight = chartMaxY - chartMinY; // 160 px max bar height
    
    // Grid reference markings (0.25, 0.5, 0.75, 1.0)
    [0.25, 0.5, 0.75, 1.0].forEach(ratio => {
      const gScore = Math.round(ratio * maxScore);
      const gY = chartMaxY - (ratio * chartHeight);
      
      svgContent += `
        <!-- Horizontal grid line -->
        <line x1="45" y1="${gY}" x2="470" y2="${gY}" class="grid-line" />
        <text x="22" y="${gY + 3}" class="chart-value-label" text-anchor="middle">${gScore}</text>
      `;
    });
    
    // Solid axis line
    svgContent += `
      <line x1="45" y1="${chartMaxY}" x2="470" y2="${chartMaxY}" class="axis-baseline" />
    `;
    
    // Distribute bars
    const N = activePlayers.length;
    const totalColumnsWidth = 410; // from x=50 to x=460
    const colWidth = totalColumnsWidth / N;
    const barWidth = Math.min(colWidth * 0.55, 60);
    
    activePlayers.forEach((player, i) => {
      const sharePercent = totalSum > 0 ? Math.round((player.score / totalSum) * 100) : 0;
      const barHeight = maxScore > 0 ? (player.score / maxScore) * chartHeight : 0;
      const barY = chartMaxY - barHeight;
      const centerX = 50 + (colWidth * i) + (colWidth / 2);
      const barX = centerX - (barWidth / 2);
      
      const delayMs = i * 150;
      svgContent += `
        <style>
          @keyframes rise-bar-${player.id} {
            from { y: ${chartMaxY}px; height: 0px; }
            to { y: ${barY}px; height: ${barHeight}px; }
          }
          @keyframes rise-shadow-${player.id} {
            from { y: ${chartMaxY + 4}px; height: 0px; }
            to { y: ${barY + 4}px; height: ${barHeight}px; }
          }
          .bar-animated-${player.id} {
            animation: rise-bar-${player.id} 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
            animation-delay: ${delayMs}ms;
          }
          .shadow-animated-${player.id} {
            animation: rise-shadow-${player.id} 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
            animation-delay: ${delayMs}ms;
          }
        </style>
        
        <!-- Neo-brutalist shadow blocks -->
        <rect x="${barX + 4}" y="${chartMaxY + 4}" width="${barWidth}" height="0" fill="black" class="shadow-animated-${player.id}" />
        
        <!-- Interactive Bar rects -->
        <rect 
          id="chart-bar-shape-${player.id}"
          x="${barX}" 
          y="${chartMaxY}" 
          width="${barWidth}" 
          height="0" 
          fill="${player.hexColor}" 
          stroke="black" 
          stroke-width="3.5" 
          class="chart-bar-interactive bar-animated-${player.id}" 
          data-id="${player.id}"
          data-name="${player.name}"
          data-score="${player.score}"
          data-emoji="${player.emoji}"
          data-share="${sharePercent}"
          data-color="${player.hexColor}"
        />
        
        <!-- Champion Mini bouncing icon on Top of Bar -->
        <text 
          x="${centerX}" 
          y="${barY - 12}" 
          font-size="22" 
          text-anchor="middle" 
          class="emoji-actor"
          style="animation-delay: ${delayMs + 500}ms;"
        >
          ${player.emoji}
        </text>
        
        <!-- Player Label Under the Base Line -->
        <text x="${centerX}" y="${chartMaxY + 22}" font-size="11" class="chart-label" text-anchor="middle">
          ${player.name}
        </text>
      `;
    });
    
    svg.innerHTML = svgContent;
  }

  // Bind mouse interactive events for the SVG bar elements
  const bars = container.querySelectorAll('.chart-bar-interactive');
  const tooltip = container.querySelector('#chart-tooltip') as HTMLDivElement | null;

  bars.forEach(bar => {
    bar.addEventListener('mousemove', (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const target = mouseEvent.currentTarget as SVGRectElement;
      
      const pName = target.getAttribute('data-name');
      const pScore = target.getAttribute('data-score');
      const pEmoji = target.getAttribute('data-emoji');
      const pShare = target.getAttribute('data-share');
      const pColor = target.getAttribute('data-color');
      
      if (tooltip && pName) {
        tooltip.style.opacity = '1';
        tooltip.style.borderColor = 'black';
        tooltip.style.backgroundColor = pColor || '#ffffff';
        tooltip.innerHTML = `
          <div class="flex items-center gap-1.5 mb-1 bg-white border border-black px-1 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">
            <span class="text-sm select-none">${pEmoji}</span>
            <span class="font-black text-[10px] uppercase text-black font-display">${pName}</span>
          </div>
          <div class="space-y-0.5 leading-none text-[9.5px] font-mono text-black font-black">
            <div>TOPLAM PUAN: <span class="underline">${pScore} Pts</span></div>
            <div>DOMİNE ORANI: <span>%${pShare}</span></div>
          </div>
        `;
        
        const rect = container.querySelector('#dominance-chart')?.getBoundingClientRect();
        if (rect) {
          const x = mouseEvent.clientX - rect.left + 15;
          const y = mouseEvent.clientY - rect.top - 75;
          tooltip.style.left = `${x}px`;
          tooltip.style.top = `${y}px`;
        }
      }
    });

    bar.addEventListener('mouseleave', () => {
      if (tooltip) {
        tooltip.style.opacity = '0';
      }
    });
  });

  // Calculate dynamic dominance insights tailored text
  const insightDiv = container.querySelector('#dominance-insight');
  if (insightDiv) {
    let message = '';
    const p1 = podium[0];
    const p2 = podium[1];
    
    if (p1 && p2) {
      if (p1.score >= p2.score * 2) {
        message = `⚔️ <strong>DEHŞET-ÜL VAHŞET KUPASI!</strong> <span class="underline">${p1.name}</span>, en yakın rakibi <strong>${p2.name}</strong> oyuncusunu tam manasıyla sürklase etti! Toplam puanların %${Math.round((p1.score/totalSum)*100)} kısmını elinde tutarak hakiki arenanın hükümdarı olduğunu ispatladı! 👑`;
      } else if (p1.score - p2.score <= 12) {
        message = `🔥 <strong>BURUN FARKIYLA NEFES KESEN ŞAMPİYONLUK!</strong> <span class="underline">${p1.name}</span> ve <strong>${p2.name}</strong> final anına dek omuz omuza yarıştı. Sadece <strong>${p1.score - p2.score} puanlık</strong> ufacık bir mesafe farkıyla tacı kafasına geçiren ${p1.name} oldu! Tebrikler!`;
      } else {
        message = `🏆 <strong>MUAZZAM TAKTİKSEL ÜSTÜNLÜK!</strong> <span class="underline">${p1.name}</span> bu seride temposunu hiç düşürmeyerek toplamda <strong>${p1.score} puana</strong> ulaştı. Genel gücün %${Math.round((p1.score/totalSum)*100)}'lik dilimini domine ederek kürsünün ebedi sahibi oldu! ⚡`;
      }
    } else {
      message = `🏆 Şampiyonumuz <strong>${p1.name}</strong>, toplamda topladığı muazzam <strong>${p1.score} puan</strong> ile bu partinin mutlak galibi oldu!`;
    }
    
    insightDiv.innerHTML = message;
  }

  // Bind Buttons
  document.getElementById('restart-to-char')?.addEventListener('click', () => setScreen('charSelect'));
  document.getElementById('restart-to-lobby')?.addEventListener('click', () => {
    // Reset general points
    state.players.forEach(p => p.score = 0);
    setScreen('lobby');
  });
}

// ==========================================
// 8. SEVİMLİ KOŞU (RACING MINI-GAME)
// ==========================================
function renderRaceGame() {
  const activePlayers = state.isEliminationMode
    ? state.players.filter(p => p.active && !p.isEliminated)
    : state.players.filter(p => p.active);

  let isGameOver = false;
  const finishedPlayers: number[] = [];
  const endButtonContainer = document.createElement('div');
  endButtonContainer.id = "race-end-early-container";
  endButtonContainer.className = "hidden w-full flex justify-center py-2 animate-fade-in";

  // Track progress (0 to 100)
  const playerProgress: { [id: number]: number } = {};
  const playerStunGrace: { [id: number]: number } = {};
  const playerMudTaps: { [id: number]: number } = {};
  const itemsClaimed: { [id: number]: string[] } = {};

  activePlayers.forEach(p => {
    playerProgress[p.id] = 0;
    playerStunGrace[p.id] = 0;
    playerMudTaps[p.id] = 0;
    itemsClaimed[p.id] = [];
  });

  const container = document.createElement('div');
  container.className = "w-full max-w-5xl relative z-10 flex flex-col min-h-[580px] justify-between space-y-4 animate-fade-in select-none text-black";

  // Top header panel
  const header = document.createElement('div');
  header.className = "bg-white border-4 border-black p-3 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-3";
  header.innerHTML = `
    <div class="text-center sm:text-left">
      <h2 class="text-lg sm:text-xl font-display font-black text-black uppercase">🏃 SEVİMLİ KOŞU (ANIMAL SPRINT)</h2>
      <p class="text-black font-semibold text-[11px] mt-0.5">Kendi kulvarında koşmak için tuşuna <b class="text-amber-500 font-extrabold">SERİCE BAS!</b> 🍬 Şeker ve ⭐ Yıldızlar hızlandırır, 🍌 Muz kaydırır, 💩 Çamur yavaşlatır!</p>
    </div>
    <button id="race-game-quit" class="px-3.5 py-1.5 text-[11px] font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
      ◀ Ayrıl
    </button>
  `;
  container.appendChild(header);
  container.appendChild(endButtonContainer);

  // Arena Grid columns
  const arenaGrid = document.createElement('div');
  arenaGrid.className = "grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 items-stretch";
  container.appendChild(arenaGrid);

  // Left scores comparative HUD
  const sidePanel = document.createElement('div');
  sidePanel.className = "md:col-span-1 bg-white border-4 border-black p-3.5 flex flex-col justify-between shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-black";
  arenaGrid.appendChild(sidePanel);

  // Big central racing track arena chamber
  const mainChamber = document.createElement('div');
  mainChamber.className = "md:col-span-3 bg-zinc-100 border-4 border-black p-4 flex flex-col justify-around relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-h-[350px] transition-colors text-black rounded-lg";
  arenaGrid.appendChild(mainChamber);

  // Bottom action buttons (bumpers)
  const bottoms = document.createElement('div');
  bottoms.className = `grid gap-2.5 ${
    activePlayers.length === 2 ? 'grid-cols-2 lg:grid-cols-2' : 
    activePlayers.length === 3 ? 'grid-cols-3' : 
    activePlayers.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-5'
  }`;
  container.appendChild(bottoms);

  activePlayers.forEach(p => {
    const b = document.createElement('button');
    b.id = `cd-bumper-${p.id}`;
    b.className = `py-3 bg-white border-4 ${p.borderColor} text-black font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center space-y-1 hover:bg-black hover:text-white active:scale-95 transition-all duration-100 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden`;
    b.innerHTML = `
      <div class="h-7 w-7 flex items-center justify-center text-lg bg-white border-2 border-black rounded-full select-none shadow">
        ${p.emoji}
      </div>
      <span class="font-extrabold text-[11px]">${p.name}</span>
      ${!state.isMobileMode ? `<span class="text-[8px] text-black/50 font-mono font-black">TUŞ: [${p.keyLabel}]</span>` : ''}
    `;
    b.addEventListener('click', () => registerTap(p.id));
    bottoms.appendChild(b);
  });

  const resModal = document.createElement('div');
  resModal.className = "hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col items-center overflow-y-auto p-4 text-center animate-fade-in";
  container.appendChild(resModal);

  appRoot.appendChild(container);

  // Dynamic live track renderer function
  function updateRaceTracks() {
    // 1. Update side comparative list
    sidePanel.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs font-mono font-black border-2 border-black bg-white px-2 py-1 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <span>PARKUR:</span>
          <span class="text-emerald-600 font-black animate-pulse">100 Metre</span>
        </div>
        <span class="block text-[8px] font-mono text-black/45 uppercase tracking-widest font-black mt-2">ANLIK MESAFELER</span>
        <div class="space-y-2 mt-1">
          ${activePlayers.map(p => {
            const currentPrg = Math.round(playerProgress[p.id]);
            const statusLabel = (playerStunGrace[p.id] && Date.now() < playerStunGrace[p.id]) 
              ? '💫 SERSEM' 
              : (playerMudTaps[p.id] && playerMudTaps[p.id] > 0)
                ? '💩 ÇAMURDA'
                : '🏃 KOŞUYOR';
            const badgeBg = statusLabel === '💫 SERSEM' ? 'bg-[#FF7675] text-white' : statusLabel === '💩 ÇAMURDA' ? 'bg-[#D6A2E8] text-black' : 'bg-emerald-100 text-emerald-800';
            return `
              <div class="flex flex-col p-1.5 bg-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
                <div class="flex items-center justify-between font-semibold text-black">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs">${p.emoji}</span>
                    <span class="font-extrabold text-[11px] truncate max-w-[80px]">${p.name}</span>
                  </div>
                  <span class="font-mono text-xs font-black bg-zinc-100 border border-black px-1 py-0.5 shadow-[0.5px_0.5px_0_rgba(0,0,0,1)]">
                    ${currentPrg}m
                  </span>
                </div>
                <div class="flex items-center justify-between mt-1 pt-1 border-t border-dashed border-zinc-100">
                  <span class="text-[7.5px] font-black uppercase text-black/45 tracking-widest">DURUM:</span>
                  <span class="font-mono text-[7px] font-black px-1 rounded uppercase ${badgeBg}">${statusLabel}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="pt-2 border-t-2 border-dashed border-black/20 mt-3 text-center">
        <div class="p-2 bg-yellow-50 border-2 border-black font-sans font-bold text-[9px] text-black/80 leading-normal">
          🥕 Çocuklar için harika tek-tuş oyunu! Durmadan tuşuna basıp zirveye uç!
        </div>
      </div>
    `;

    // 2. Build race visual representation inside mainChamber
    mainChamber.innerHTML = `
      <div class="w-full h-full flex flex-col justify-around py-2 space-y-3">
        ${activePlayers.map(p => {
          const progress = playerProgress[p.id];
          const isStunned = playerStunGrace[p.id] && Date.now() < playerStunGrace[p.id];
          const isSlowed = playerMudTaps[p.id] && playerMudTaps[p.id] > 0;
          const accessoryHTML = p.activeAccessory ? `
            <span class="absolute -top-3.5 left-1/2 -translate-x-1/2 text-base select-none">${
              SHOP_ITEMS.find(item => item.id === p.activeAccessory)?.emoji || ''
            }</span>
          ` : '';

          return `
            <!-- Player Lane -->
            <div class="relative w-full h-[62px] border-4 border-black bg-zinc-50 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-between">
              
              <!-- Grassy Lane Background Texture -->
              <div class="absolute inset-x-0 h-full bg-linear-to-r from-emerald-50 to-emerald-100/40 z-0"></div>
              
              <!-- Track Milestones (Visually plotted at exact positions) -->
              
              <!-- Candy 🍬 at 25% -->
              <div class="absolute left-[25%] -translate-x-1/2 flex flex-col items-center z-10" style="opacity: ${itemsClaimed[p.id].includes('candy') ? '0.35' : '1'}">
                <span class="text-xs sm:text-sm animate-bounce" style="animation-duration: 2s">🍬</span>
                <span class="text-[6.5px] font-black bg-white border border-black/30 px-0.5 rounded leading-none">ŞEKER (+5)</span>
              </div>

              <!-- Banana 🍌 at 50% -->
              <div class="absolute left-[50%] -translate-x-1/2 flex flex-col items-center z-10" style="opacity: ${itemsClaimed[p.id].includes('banana') ? '0.35' : '1'}">
                <span class="text-xs sm:text-sm">🍌</span>
                <span class="text-[6.5px] font-black bg-white border border-black/30 px-0.5 rounded leading-none text-amber-600">MUZ (DUR!)</span>
              </div>

              <!-- Star ⭐ at 72% -->
              <div class="absolute left-[72%] -translate-x-1/2 flex flex-col items-center z-10" style="opacity: ${itemsClaimed[p.id].includes('star') ? '0.35' : '1'}">
                <span class="text-xs sm:text-sm animate-pulse">⭐</span>
                <span class="text-[6.5px] font-black bg-white border border-black/30 px-0.5 rounded leading-none text-violet-600">YILDIZ (+8)</span>
              </div>

              <!-- Mud Puddle 💩 at 85% -->
              <div class="absolute left-[85%] -translate-x-1/2 flex flex-col items-center z-10" style="opacity: ${itemsClaimed[p.id].includes('mud') ? '0.35' : '1'}">
                <span class="text-xs sm:text-sm">💩</span>
                <span class="text-[6.5px] font-black bg-white border border-black/30 px-0.5 rounded leading-none text-purple-700">ÇAMUR (AĞIR)</span>
              </div>

              <!-- Finish Flag checkered waving 🏁 at 100% -->
              <div class="absolute right-[0px] h-full w-8 bg-zinc-200 border-l border-zinc-400/40 z-10 flex items-center justify-center font-bold text-lg select-none">
                🏁
              </div>

              <!-- Live Lane Score background hint -->
              <div class="absolute left-3 top-1/2 -translate-y-1/2 z-10 select-none">
                <span class="font-display font-black text-xs uppercase text-black/15 tracking-wider">${p.name}'s Track</span>
              </div>

              <!-- Moving Sprinting Avatar Card -->
              <div id="race-avatar-${p.id}" class="absolute top-[8px] h-10 w-10 rounded-full border-2 border-black flex items-center justify-center shadow-[1px_1.5px_0_rgba(0,0,0,1)] ${p.color} transition-all duration-150 z-20 ${isStunned ? 'animate-spin' : ''}" style="left: calc(${(progress / 100) * 85}% + 8px);">
                <!-- Accessory Wearable overlay if any -->
                ${accessoryHTML}
                
                <!-- Avatar Emoji or custom picture -->
                ${p.customImage ? `<img src="${p.customImage}" class="w-full h-full rounded-full object-cover" />` : `<span class="text-xl select-none">${p.emoji}</span>`}
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Draw initial state
  updateRaceTracks();

  function spawnTapText(text: string, pId: number, bgClass = "bg-white text-black") {
    // Spawn floating words directly near the player avatar lane
    const item = document.createElement('div');
    item.className = `absolute text-[9px] font-black border-2 border-black px-1.5 py-0.5 ${bgClass} uppercase tracking-wider animate-bounce shadow-[1px_1px_0px_rgba(0,0,0,1)] z-30 rounded`;
    // We can position near their tracks
    const activeIdx = activePlayers.findIndex(p => p.id === pId);
    if (activeIdx !== -1) {
      const topOffsetPercent = 10 + (activeIdx * 25);
      item.style.top = `${topOffsetPercent}%`;
      item.style.left = `${30 + Math.random() * 40}%`;
    } else {
      item.style.top = `${15 + Math.random() * 50}%`;
      item.style.left = `${20 + Math.random() * 60}%`;
    }
    item.innerText = text;
    mainChamber.appendChild(item);
    setTimeout(() => item.remove(), 750);
  }

  function registerTap(pId: number) {
    if (isGameOver) return;

    const player = state.players.find(p => p.id === pId)!;

    // Check Stun Lock
    const now = Date.now();
    if (playerStunGrace[pId] && now < playerStunGrace[pId]) {
      sfx.playFail();
      spawnTapText("💫 DIZZY! (KAYDI!)", pId, "bg-red-500 text-white");
      return;
    }

    let step = 2.4; // standard advance
    let isSlowed = false;

    // Check Mud Slow penalty
    if (playerMudTaps[pId] && playerMudTaps[pId] > 0) {
      step = 1.0; // crawl
      playerMudTaps[pId]--;
      isSlowed = true;
    }

    // Add progress
    playerProgress[pId] = Math.min(100, playerProgress[pId] + step);
    const pos = playerProgress[pId];

    // Trigger sfx
    sfx.playTick();

    // Check active items milestones
    const claimed = itemsClaimed[pId];

    // 25% candy
    if (pos >= 25 && !claimed.includes('candy')) {
      claimed.push('candy');
      playerProgress[pId] = Math.min(100, playerProgress[pId] + 5);
      sfx.playPowerUp();
      spawnTapText("🍬 ŞEKER HIZI! +5m", pId, "bg-[#55EFC4] text-black");
    }

    // 50% banana
    if (pos >= 50 && !claimed.includes('banana')) {
      claimed.push('banana');
      playerStunGrace[pId] = now + 1200; // stun for 1.2s
      sfx.playExplode();
      spawnTapText("🍌 MUZ KABUĞUNDA KAYDIN! -1.2s", pId, "bg-[#F39C12] text-white animate-pulse");
      
      const avatarEl = document.getElementById(`race-avatar-${pId}`);
      if (avatarEl) {
        avatarEl.classList.add('animate-spin');
        setTimeout(() => {
          avatarEl.classList.remove('animate-spin');
        }, 1200);
      }
    }

    // 72% star
    if (pos >= 72 && !claimed.includes('star')) {
      claimed.push('star');
      playerProgress[pId] = Math.min(100, playerProgress[pId] + 8);
      sfx.playPowerUp();
      spawnTapText("⭐ SÜPER KOŞU! +8m", pId, "bg-[#FDCB6E] text-black");
    }

    // 85% mud
    if (pos >= 85 && !claimed.includes('mud')) {
      claimed.push('mud');
      playerMudTaps[pId] = 5;
      sfx.playFail();
      spawnTapText("💩 ÇAMURDAN GEÇTİN! YAVAŞLA!", pId, "bg-amber-800 text-white");
    }

    // Refresh UI
    updateRaceTracks();

    // Victory check
    if (playerProgress[pId] >= 100) {
      if (!finishedPlayers.includes(pId)) {
        finishedPlayers.push(pId);
        sfx.playFanfare();

        // Update their bumper button instantly
        const btn = document.getElementById(`cd-bumper-${pId}`) as HTMLButtonElement;
        if (btn) {
          const rank = finishedPlayers.indexOf(pId) + 1;
          let medal = '🏆';
          if (rank === 2) medal = '🥈';
          if (rank === 3) medal = '🥉';
          if (rank >= 4) medal = '🎖️';
          btn.innerHTML = `
            <div class="h-7 w-7 flex items-center justify-center text-lg bg-emerald-100 border-2 border-emerald-500 rounded-full select-none shadow">
              ${medal}
            </div>
            <span class="font-extrabold text-[11px] text-emerald-600">${rank}. TAMAMLADI</span>
            <span class="text-[8px] font-mono text-black/50 font-bold">TAMAMLANDI</span>
          `;
          btn.disabled = true;
          btn.classList.add('bg-emerald-50', 'border-emerald-500');
        }

        spawnTapText(`🏁 FİNİŞE ULAŞTI! #${finishedPlayers.length}`, pId, "bg-[#55EFC4] text-black border-emerald-500");

        if (finishedPlayers.length === 1) {
          showRaceEndEarlyOption();
        }

        if (finishedPlayers.length === activePlayers.length) {
          finishRaceGameReal();
        }
      }
    }
  }

  function showRaceEndEarlyOption() {
    if (activePlayers.length >= 2) {
      endButtonContainer.classList.remove('hidden');
      endButtonContainer.innerHTML = `
        <button id="race-end-early-btn" class="w-full max-w-sm py-3.5 bg-[#FF7675] text-white hover:bg-black border-4 border-black font-display font-black text-xs uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_rgba(0,0,0,1)] flex items-center justify-center gap-2 select-none">
          🏁 MÜCADELEYİ BİTİR (KÜRSÜYE GİT) ⏭️
        </button>
      `;
      document.getElementById('race-end-early-btn')?.addEventListener('click', () => {
        finishRaceGameReal();
      });
    }
  }

  function finishRaceGameReal() {
    isGameOver = true;

    // Fill the rest of rank positions based on current progress
    const remainingSorted = activePlayers
      .filter(p => !finishedPlayers.includes(p.id))
      .sort((a, b) => playerProgress[b.id] - playerProgress[a.id]);
    
    // Total ranks combined
    const finalRanks = [...finishedPlayers, ...remainingSorted.map(p => p.id)];
    const sortedPlayersList = finalRanks.map(id => state.players.find(p => p.id === id)!);
    const eliminationStatus = getRoundEliminationStatus(sortedPlayersList);

    const winnerPlayer = sortedPlayersList[0];

    const allocations = [35, 20, 10, 5];
    let modalHTML = `
      <div class="my-auto bg-white border-4 border-black p-5 sm:p-8 max-w-xl w-full flex flex-col items-center space-y-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black animate-fade-in relative z-45">
        <div class="w-14 h-14 rounded-full ${winnerPlayer.color} border-4 border-black flex items-center justify-center text-4xl shadow animate-bounce">
          🏆
        </div>
        <div>
          <h3 class="text-xl sm:text-2xl font-display font-black text-black uppercase tracking-tight">KOŞU ŞAMPİYONU</h3>
          <p class="text-xs font-bold text-black/70 mt-1">${winnerPlayer.name} rüzgar gibi esip finişe 🏁 ilk ulaşan oyuncu oldu!</p>
        </div>

        <div class="w-full space-y-2.5 my-3">
          <span class="block text-[9px] font-mono text-black/60 font-black uppercase tracking-widest text-left">FİNAL PUAN DAĞILIMI</span>
    `;

    finalRanks.forEach((pId, idx) => {
      const plyObj = state.players.find(p => p.id === pId)!;
      const award = allocations[idx] || 0;
      const posVal = playerProgress[pId];

      let statusBadgeHTML = '';
      const elimInfo = eliminationStatus[plyObj.id];
      if (state.isEliminationMode && elimInfo) {
        statusBadgeHTML = `<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${elimInfo.colorClass}">${elimInfo.label}</span>`;
        if (elimInfo.status === 'eliminated') {
          plyObj.isEliminated = true;
        }
      }

      plyObj.score += award;
      plyObj.globalCoins = (plyObj.globalCoins || 0) + award;
      savePlayerPersistentData(plyObj);

      modalHTML += `
        <div class="flex items-center justify-between bg-white border-2 border-black p-2.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <div class="flex items-center gap-2.5">
            <span class="font-mono text-xs text-black font-black">#${idx + 1}</span>
            ${getPlayerAvatarHTML(plyObj, "w-7 h-7 text-xs")}
            <span class="font-black text-xs text-black">${plyObj.name}</span>
            ${statusBadgeHTML}
          </div>
          <div class="flex items-center gap-1.5 font-semibold text-black">
            <span class="text-xs font-mono font-black">${Math.round(posVal)} metre</span>
            <span class="font-extrabold text-[9px] bg-[#FDCB6E] border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">+${award} Tur Pts</span>
            <span class="font-extrabold text-[9px] bg-[#FFEAA7] border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">🪙+${award}</span>
          </div>
        </div>
      `;
    });

    modalHTML += `
       </div>
       <button id="race-modal-continue" class="w-full py-3.5 bg-[#4ECDC4] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
         Arena Kürsüsüne İlerle
       </button>
      </div>
    `;

    sfx.playFanfare();
    resModal.innerHTML = modalHTML;
    resModal.classList.remove('hidden');

    document.getElementById('race-modal-continue')?.addEventListener('click', () => {
      handleGameFinished();
    });
  }

  // Bind key handlers
  const keyMapHandler = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const target = activePlayers.find(p => p.key === e.code);
    if (target) {
      const btn = document.getElementById(`cd-bumper-${target.id}`);
      if (btn) {
        btn.classList.add('bg-black', 'text-white', 'scale-95');
        setTimeout(() => btn.classList.remove('scale-95'), 80);
      }
      registerTap(target.id);
    }
  };

  window.addEventListener('keydown', keyMapHandler);

  // Quit cleanup
  document.getElementById('race-game-quit')?.addEventListener('click', () => {
    window.removeEventListener('keydown', keyMapHandler);
    setScreen('gamesHub');
  });

  // Watch for page transitions to cleanly unbind
  const observer = new MutationObserver(() => {
    if (!document.getElementById('race-game-quit')) {
      window.removeEventListener('keydown', keyMapHandler);
      observer.disconnect();
    }
  });
  observer.observe(appRoot, { childList: true });
}

// ==========================================
// COSTUME SHOP & CUSTOM PORTRAIT WARDROBE
// ==========================================
function renderCostumeShop() {
  const container = document.createElement('div');
  container.className = "w-full max-w-5xl relative z-10 flex flex-col space-y-6 animate-fade-in";

  // Find currently selected player
  const activePlayers = state.players.filter(p => p.active);
  // Ensure activeShopPlayerId is in the active set
  let activePlayer = activePlayers.find(p => p.id === activeShopPlayerId);
  if (!activePlayer) {
    activePlayer = activePlayers[0];
    if (activePlayer) activeShopPlayerId = activePlayer.id;
  }

  if (!activePlayer) {
    // Fallback if no active player
    setScreen('lobby');
    return;
  }

  const shopActivePlayer = activePlayer;

  // Header Panel
  const headerDiv = document.createElement('div');
  headerDiv.className = "bg-white border-4 border-black p-5 sm:p-6 text-center space-y-2.5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden text-black";
  headerDiv.innerHTML = `
    <div class="absolute -top-10 -right-10 w-24 h-24 bg-yellow-200 border-4 border-black rotate-45 pointer-events-none"></div>
    <div class="text-3xl sm:text-4xl">🛍️</div>
    <h2 class="text-2xl sm:text-3.5xl font-display font-black uppercase tracking-tight text-black leading-none">Kostüm Arenası & Gardırop</h2>
    <p class="text-black/80 font-bold text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
      Raundlardan topladığın altınlarla kahramanına havalı aksesuarlar satın al veya bilgisayarından / telefonundan kendi fotoğrafını yükleyerek arenaya doğrudan kendi yüzünle katıl!
    </p>
  `;
  container.appendChild(headerDiv);

  // Selector for switching between players inside the shop
  const playerTabs = document.createElement('div');
  playerTabs.className = "flex flex-wrap gap-2 w-full justify-center";
  activePlayers.forEach(p => {
    const isSelected = p.id === activeShopPlayerId;
    const tabBtn = document.createElement('button');
    tabBtn.className = `px-5 py-3 border-4 border-black font-black uppercase tracking-wider text-xs cursor-pointer transition-all ${
      isSelected 
        ? 'bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]' 
        : `${p.color} text-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-black hover:text-white`
    }`;
    tabBtn.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-sm shrink-0">${p.customImage ? '🖼️' : p.emoji}</span>
        <span>${p.name}</span>
      </div>
    `;
    tabBtn.addEventListener('click', () => {
      activeShopPlayerId = p.id;
      sfx.playTick();
      render();
    });
    playerTabs.appendChild(tabBtn);
  });
  container.appendChild(playerTabs);

  // Twin Column Panels: Left (Preview & Upload) | Right (Shop items catalogue)
  const twinsGrid = document.createElement('div');
  twinsGrid.className = "grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch";
  container.appendChild(twinsGrid);

  // --- LEFT COLUMN: PROFILE CARD & IMAGE UPLOADER ---
  const leftCol = document.createElement('div');
  leftCol.className = "lg:col-span-5 bg-white border-4 border-black p-5 flex flex-col justify-between space-y-6 shadow-[8px_8px_0_rgba(0,0,0,1)] text-center text-black";
  
  // Custom badges list rendering
  const badgesListHTML = activePlayer.unlockedAchievements && activePlayer.unlockedAchievements.length > 0 
    ? `<div class="flex flex-wrap gap-1.5 justify-center py-1.5 select-none bg-neutral-50/50 border-2 border-black border-dashed">
         ${activePlayer.unlockedAchievements.map(id => {
           const ach = ACHIEVEMENTS.find(a => a.id === id);
           if (!ach) return '';
           return `<span class="inline-flex items-center justify-center bg-[#FFEAA7] border border-black px-2 py-1 text-sm shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 duration-100 cursor-help" title="${ach.name}: ${ach.description}">
                     ${ach.badgeEmoji}
                   </span>`;
         }).join('')}
       </div>`
    : `<div class="text-[8px] font-mono uppercase text-gray-400 tracking-widest py-1.5">Kazanılmış rozet bulunmuyor</div>`;

  leftCol.innerHTML = `
    <div class="space-y-4">
      <div class="border-b-2 border-black pb-2">
        <span class="text-[10px] font-mono font-black uppercase tracking-widest text-black/50">AKTİF PROFİLİZASYON</span>
        <h3 class="text-xl font-black text-black uppercase leading-normal">${activePlayer.name}</h3>
      </div>

      <!-- Badges Display Area -->
      <div class="space-y-1">
        <span class="block text-[8px] font-mono font-black text-black/40 uppercase tracking-widest text-center">ROZET VİTRİNİ</span>
        ${badgesListHTML}
      </div>

      <!-- Drag & Drop Container with Active Avatar preview -->
      <div id="shop-drop-zone" class="mx-auto my-3 p-4 border-4 border-dashed border-gray-400 hover:border-black rounded-none cursor-pointer bg-neutral-50 transition-colors flex flex-col items-center justify-center space-y-4 min-h-[200px] relative group select-none shadow-inner">
        <div class="scale-125 transform mt-2 relative">
          ${getPlayerAvatarHTML(activePlayer, "w-24 h-24 text-5xl animate-float")}
        </div>
        <div class="text-center space-y-1">
          <p class="text-xs font-black text-black">Fotoğrafını Sürükle Bırak</p>
          <p class="text-[10px] text-gray-500 font-semibold font-mono uppercase">Veya Tıklayıp Dosya Seç</p>
        </div>
        <input type="file" id="shop-file-input" accept="image/*" class="hidden" />
      </div>

      <div class="flex flex-col gap-2">
        <button id="shop-upload-trigger-btn" class="w-full py-3 bg-[#4ECDC4] hover:bg-black hover:text-white border-2 border-black text-black font-black text-xs uppercase tracking-wider transition-colors shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-1.5">
          📷 KENDİ RESMİNİ SEÇ
        </button>
        ${activePlayer.customImage ? `
          <button id="shop-remove-img-btn" class="w-full py-2 bg-[#FF6B6B] hover:bg-black hover:text-white border-2 border-black text-black font-black text-[10px] uppercase tracking-wider transition-colors shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer">
            🛑 Özel Fotoğrafı Kaldır
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Balance panel -->
    <div class="bg-[#FFEAA7] border-4 border-black p-4 mt-4 shadow-[4px_4px_0_rgba(0,0,0,1)] relative overflow-hidden">
      <div class="absolute -bottom-8 -right-8 text-6xl opacity-15 pointer-events-none select-none">🪙</div>
      <div class="text-left leading-tight">
        <span class="block text-[9px] font-mono font-black text-black/50 uppercase tracking-widest">KULLANILABİLİR HESAP BAKİYESİ</span>
        <div class="flex items-center gap-1.5 mt-1">
          <span class="text-3xl font-black font-display text-black">${activePlayer.globalCoins || 0}</span>
          <span class="text-sm font-black font-mono">ALTIN COIN</span>
        </div>
        <p class="text-[9px] font-semibold text-black/60 mt-1.5 leading-relaxed">Puanlar her oyun tamamlandığında altın olarak hesabına eklenir.</p>
      </div>
    </div>
  `;
  twinsGrid.appendChild(leftCol);

  // --- RIGHT COLUMN: SHOP ITEMS ---
  const rightCol = document.createElement('div');
  rightCol.className = "lg:col-span-7 bg-white border-4 border-black p-5 flex flex-col justify-between space-y-4 shadow-[8px_8px_0_rgba(0,0,0,1)] text-black";
  
  let catalogHTML = `
    <div class="border-b-2 border-black pb-2 mb-2 flex justify-between items-center">
      <div>
        <span class="text-[10px] font-mono font-black uppercase tracking-widest text-black/50">MAĞAZA KATALOĞU</span>
        <h3 class="text-xl font-black text-black">Aksesuarlar & Kostümler</h3>
      </div>
      <span class="text-xs bg-black text-white font-mono font-black px-2.5 py-1 uppercase">${SHOP_ITEMS.length} Ürün Mevcut</span>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
  `;

  SHOP_ITEMS.forEach(item => {
    const isUnlocked = activePlayer.unlockedAccessories?.includes(item.id);
    const isEquipped = activePlayer.activeAccessory === item.id;
    const canAfford = (activePlayer.globalCoins || 0) >= item.cost;
    
    let actionBtnHTML = '';
    if (isUnlocked) {
      if (isEquipped) {
        actionBtnHTML = `
          <button id="btn-equip-${item.id}" class="w-full py-2 bg-[#FF6B6B] text-black border-2 border-black font-black text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-all cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            Çıkar
          </button>
        `;
      } else {
        actionBtnHTML = `
          <button id="btn-equip-${item.id}" class="w-full py-2 bg-[#4ECDC4] text-black border-2 border-black font-black text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-all cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            Giy
          </button>
        `;
      }
    } else {
      actionBtnHTML = `
        <button id="btn-buy-${item.id}" ${canAfford ? '' : 'disabled'} class="w-full py-2 ${canAfford ? 'bg-yellow-400 text-black hover:bg-black hover:text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} border-2 border-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1">
          🪙 ${item.cost} Altın Al
        </button>
      `;
    }

    catalogHTML += `
      <div class="border-2 border-black bg-white p-3 flex flex-col justify-between shadow-[3px_3px_0_rgba(0,0,0,1)] relative group ${isEquipped ? 'bg-yellow-50/50 border-yellow-500' : ''}">
        ${isEquipped ? `
          <div class="absolute -top-2.5 -right-2 px-1.5 py-0.5 text-[8px] font-mono font-black text-white bg-black border border-black uppercase rotate-6">
            KuŞanıldı
          </div>
        ` : ''}

        <div class="flex items-start gap-3 mb-2.5">
          <div class="w-12 h-12 rounded-none bg-neutral-100 border-2 border-black flex items-center justify-center text-3xl shrink-0 shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] relative select-none">
            ${item.emoji}
          </div>
          <div class="space-y-0.5">
            <h4 class="text-xs sm:text-sm font-black text-black uppercase leading-none">${item.name}</h4>
            <span class="inline-block text-[8px] font-mono font-black bg-neutral-100 border border-black px-1 uppercase text-black/60 scale-90 origin-left">${item.type}</span>
            <p class="text-[10px] text-gray-500 font-semibold leading-normal mt-1">${item.description}</p>
          </div>
        </div>

        <div class="pt-1.5">
          ${actionBtnHTML}
        </div>
      </div>
    `;
  });

  catalogHTML += `</div>`;
  rightCol.innerHTML = catalogHTML;
  twinsGrid.appendChild(rightCol);

  // --- ACHIEVEMENTS GRID ---
  const achievementsDiv = document.createElement('div');
  achievementsDiv.className = "bg-white border-4 border-black p-5 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black mt-2";
  
  let achievementsHTML = `
    <div class="border-b-2 border-black pb-2.5 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div>
        <span class="text-[10px] font-mono font-black uppercase tracking-widest text-black/50">ROZET VİTRİNİ & BAŞARIMLAR</span>
        <h3 class="text-xl sm:text-2xl font-display font-black text-black">MİLLETİN KUPALARI & BAŞARIMLARI</h3>
      </div>
      <div class="text-xs bg-[#4ECDC4] border-2 border-black text-black font-mono font-black px-3 py-1.5 uppercase shadow-[2.5px_2.5px_0_rgba(0,0,0,1)] select-none">
        KAZANILAN: ${activePlayer.unlockedAchievements?.length || 0} / ${ACHIEVEMENTS.length}
      </div>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
  `;

  ACHIEVEMENTS.forEach(ach => {
    const isUnlocked = activePlayer.unlockedAchievements?.includes(ach.id) || false;
    
    let progressStr = '';
    if (ach.id === 'balloon_wins_5') {
      const currentWins = activePlayer.balloonWinsCount || 0;
      progressStr = ` <span class="font-mono text-[9px] font-bold text-gray-500">(${currentWins}/5)</span>`;
    } else if (ach.id === 'collector_3') {
      const currentAcc = activePlayer.unlockedAccessories?.length || 0;
      progressStr = ` <span class="font-mono text-[9px] font-bold text-gray-500">(${currentAcc}/3)</span>`;
    } else if (ach.id === 'coin_lord_100') {
      const currentCoins = activePlayer.globalCoins || 0;
      progressStr = ` <span class="font-mono text-[9px] font-bold text-gray-500">(${currentCoins}/100)</span>`;
    } else if (ach.id === 'streak_3') {
      const currentStreak = activePlayer.rewardStreak || 0;
      progressStr = ` <span class="font-mono text-[9px] font-bold text-gray-500">(${currentStreak}/3)</span>`;
    }

    if (isUnlocked) {
      achievementsHTML += `
        <div class="border-2 border-black bg-[#EBFBEE] p-3 flex items-start gap-3 shadow-[2.5px_2.5px_0_rgba(0,0,0,1)] relative overflow-hidden group">
          <div class="absolute -top-1 -right-7 w-20 h-6 bg-emerald-500 text-white border-b border-black flex items-center justify-center text-[7px] font-mono font-black uppercase rotate-45 select-none opacity-80">
            AÇILDI
          </div>
          <div class="w-11 h-11 shrink-0 rounded-none bg-white border-2 border-black flex items-center justify-center text-2xl shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
            ${ach.badgeEmoji}
          </div>
          <div class="text-left min-w-0 flex-1">
            <h4 class="text-xs font-black text-black uppercase pr-4 truncate">${ach.name}${progressStr}</h4>
            <p class="text-[9px] text-[#2D3748]/85 font-semibold leading-tight mt-0.5">${ach.description}</p>
            <div class="mt-1 flex items-center gap-1">
              <span class="text-[8px] font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-1 py-0.2">AÇILDI ✅</span>
            </div>
          </div>
        </div>
      `;
    } else {
      achievementsHTML += `
        <div class="border-2 border-black bg-neutral-50/55 p-3 flex items-start gap-3 shadow-[1.5px_1.5px_0_rgba(0,0,0,0.1)] relative overflow-hidden opacity-75">
          <div class="absolute top-1.5 right-1.5 flex items-center justify-center text-[10px] opacity-45">
            🔒
          </div>
          <div class="w-11 h-11 shrink-0 rounded-none bg-neutral-100 border-2 border-gray-300 flex items-center justify-center text-2xl grayscale pointer-events-none select-none">
            ${ach.badgeEmoji.substring(0, 2)}
          </div>
          <div class="text-left min-w-0 flex-1">
            <h4 class="text-xs font-black text-gray-400 uppercase truncate pr-3">${ach.name}${progressStr}</h4>
            <p class="text-[9px] text-gray-400 font-semibold leading-tight mt-0.5">${ach.description}</p>
            <div class="mt-1 flex items-center gap-1">
              <span class="text-[8px] font-mono font-bold bg-gray-100 text-gray-400 border border-gray-200 px-1 py-0.2">KİLİTLİ</span>
            </div>
          </div>
        </div>
      `;
    }
  });

  achievementsHTML += `</div>`;
  achievementsDiv.innerHTML = achievementsHTML;
  container.appendChild(achievementsDiv);

  // Footer navigation actions
  const bottomNav = document.createElement('div');
  bottomNav.className = "flex w-full justify-center pt-3";
  bottomNav.innerHTML = `
    <button id="shop-quit-btn" class="px-10 py-4.5 bg-black text-white border-4 border-black font-black tracking-widest text-xs uppercase cursor-pointer hover:bg-white hover:text-black shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] duration-200 transition-all active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      ◀ Arenaya Dön ve Başla!
    </button>
  `;
  container.appendChild(bottomNav);
  appRoot.appendChild(container);

  // Bind interactions & DOM events dynamically
  setTimeout(() => {
    // 1. Files upload trigger click listener
    const uploadTrigger = document.getElementById('shop-upload-trigger-btn');
    const fileInput = document.getElementById('shop-file-input') as HTMLInputElement | null;
    uploadTrigger?.addEventListener('click', () => {
      fileInput?.click();
    });

    // 2. Drag & Drop features
    const dropZone = document.getElementById('shop-drop-zone');
    
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('bg-neutral-200');
    });

    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('bg-neutral-200');
    });

    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('bg-neutral-200');
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleAvatarUpload(files[0]);
      }
    });

    fileInput?.addEventListener('change', () => {
      const files = fileInput.files;
      if (files && files.length > 0) {
        handleAvatarUpload(files[0]);
      }
    });

    function handleAvatarUpload(file: File) {
      if (!file.type.startsWith('image/')) return;
      resizeAndSetCustomImage(shopActivePlayer.id, file, (resizedBase64) => {
        shopActivePlayer.customImage = resizedBase64;
        savePlayerPersistentData(shopActivePlayer);
        sfx.playPowerUp();
        render();
      });
    }

    // 3. Remove custom image trigger
    document.getElementById('shop-remove-img-btn')?.addEventListener('click', () => {
      shopActivePlayer.customImage = null;
      savePlayerPersistentData(shopActivePlayer);
      sfx.playTick();
      render();
    });

    // 4. Buy accessory bindings
    SHOP_ITEMS.forEach(item => {
      const isUnlocked = shopActivePlayer.unlockedAccessories?.includes(item.id);
      if (isUnlocked) {
        document.getElementById(`btn-equip-${item.id}`)?.addEventListener('click', () => {
          if (shopActivePlayer.activeAccessory === item.id) {
            shopActivePlayer.activeAccessory = null;
          } else {
            shopActivePlayer.activeAccessory = item.id;
          }
          savePlayerPersistentData(shopActivePlayer);
          sfx.playPowerUp();
          render();
        });
      } else {
        document.getElementById(`btn-buy-${item.id}`)?.addEventListener('click', () => {
          if ((shopActivePlayer.globalCoins || 0) >= item.cost) {
            shopActivePlayer.globalCoins = (shopActivePlayer.globalCoins || 0) - item.cost;
            if (!shopActivePlayer.unlockedAccessories) shopActivePlayer.unlockedAccessories = [];
            shopActivePlayer.unlockedAccessories.push(item.id);
            shopActivePlayer.activeAccessory = item.id;
            savePlayerPersistentData(shopActivePlayer);
            sfx.playPowerUp();
            render();
          }
        });
      }
    });

    // 5. Back navigation
    document.getElementById('shop-quit-btn')?.addEventListener('click', () => {
      setScreen(lastScreenBeforeShop);
    });

  }, 0);
}

// ==========================================
// 10. BOMB GAME (Bomba İmha)
// ==========================================
function renderBombGame() {
  const activePlayers = state.isEliminationMode
    ? state.players.filter(p => p.active && !p.isEliminated)
    : state.players.filter(p => p.active);

  let currentRound = 1;
  const maxRounds = 5;
  let isRoundActive = false;
  let cycleInterval: any = null;
  
  const COLORS = [
    { name: 'Kırmızı', hex: '#FF7675', bg: 'bg-[#FF7675]' },
    { name: 'Mavi', hex: '#74B9FF', bg: 'bg-[#74B9FF]' },
    { name: 'Yeşil', hex: '#55EFC4', bg: 'bg-[#55EFC4]' },
    { name: 'Sarı', hex: '#FFEAA7', bg: 'bg-[#FFEAA7]' }
  ];

  let targetColorIdx = 0;
  
  // Track dynamic cable color for each player
  const playerCableColor: { [id: number]: number } = {};
  activePlayers.forEach(p => playerCableColor[p.id] = 0);
  
  // Track has pressed in the current target cycle
  const playerClaimed: { [id: number]: boolean } = {};
  const localScores: { [id: number]: number } = {};
  activePlayers.forEach(p => {
    localScores[p.id] = 0;
    playerClaimed[p.id] = false;
  });

  const container = document.createElement('div');
  container.className = "w-full max-w-4xl relative z-10 flex flex-col gap-5 animate-fade-in text-black select-none";

  // Header 
  const header = document.createElement('div');
  header.className = "bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4";
  header.innerHTML = `
    <div>
      <h2 class="text-xl sm:text-2xl font-display font-black text-black">💣 BOMBA İMHA OPERASYONU</h2>
      <p class="text-black font-semibold text-xs mt-1">Hedef renk ile kablo renginiz eşleştiğinde tuşunuza basın! Yanlış basış patlatır!</p>
    </div>
    <button id="bomb-quit" class="px-4 py-2 text-xs font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer shrink-0">
      ◀ Arenaya Dön
    </button>
  `;
  container.appendChild(header);

  // Main game board area
  const board = document.createElement('div');
  board.className = "bg-white border-4 border-black p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col items-center gap-6 relative min-h-[360px]";
  container.appendChild(board);

  appRoot.appendChild(container);

  sfx.playPowerUp();

  function startRound() {
    isRoundActive = true;
    activePlayers.forEach(p => playerClaimed[p.id] = false);
    targetColorIdx = Math.floor(Math.random() * COLORS.length);
    
    // Cycle cables colors
    if (cycleInterval) clearInterval(cycleInterval);
    cycleInterval = setInterval(() => {
      activePlayers.forEach(p => {
        if (!playerClaimed[p.id]) {
          playerCableColor[p.id] = Math.floor(Math.random() * COLORS.length);
        }
      });
      renderBoardUI();
    }, 650);

    renderBoardUI();
  }

  function handleTap(playerId: number) {
    if (!isRoundActive || playerClaimed[playerId]) return;

    playerClaimed[playerId] = true;
    const currentCable = COLORS[playerCableColor[playerId]];
    const targetCable = COLORS[targetColorIdx];

    if (currentCable.name === targetCable.name) {
      sfx.playSuccess();
      localScores[playerId] += 10;
      showFeedbackEffect(playerId, '🎉 HARİKA!', 'text-emerald-500');
    } else {
      sfx.playFail();
      localScores[playerId] = Math.max(0, localScores[playerId] - 5);
      showFeedbackEffect(playerId, '💥 BOM!', 'text-rose-500');
    }

    renderBoardUI();
    renderLiveScoreHUD(container, activePlayers, localScores, ' Puan');

    // Check if everyone claimed or timer ends
    const checkAll = activePlayers.every(p => playerClaimed[p.id]);
    if (checkAll) {
      nextRound();
    }
  }

  function showFeedbackEffect(playerId: number, msg: string, colorClass: string) {
    const feedbackSpan = document.getElementById(`feed-${playerId}`);
    if (feedbackSpan) {
      feedbackSpan.innerText = msg;
      feedbackSpan.className = `absolute -top-6 left-1/2 -translate-x-1/2 font-sans font-black text-xs uppercase animate-bounce ${colorClass}`;
      setTimeout(() => {
        feedbackSpan.innerText = '';
      }, 1000);
    }
  }

  function nextRound() {
    if (cycleInterval) clearInterval(cycleInterval);
    isRoundActive = false;

    if (currentRound < maxRounds) {
      currentRound++;
      setTimeout(() => {
        startRound();
      }, 1500);
    } else {
      setTimeout(() => {
        handleGameCompletion();
      }, 1200);
    }
  }

  function renderBoardUI() {
    const target = COLORS[targetColorIdx];
    
    board.innerHTML = `
      <!-- Bomb Visual -->
      <div class="flex items-center gap-4 border-2 border-black p-3 bg-red-50 text-black max-w-sm w-full justify-center">
        <span class="text-3xl animate-pulse">⏰</span>
        <div class="text-center">
          <span class="text-[10px] font-mono text-gray-500 tracking-wider block font-bold">HEDEF KABLO</span>
          <span class="text-lg font-display font-black uppercase text-red-600 animate-bounce tracking-widest block" style="color: ${target.hex}">
            ${target.name.toUpperCase()}
          </span>
        </div>
      </div>
      
      <!-- Round Indicator -->
      <div class="absolute top-2 right-2 border border-black bg-neutral-100 text-[10px] font-mono px-2 py-0.5 font-bold">
        TUR: ${currentRound} / ${maxRounds}
      </div>

      <!-- Columns of players -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-4">
        ${activePlayers.map(p => {
          const cable = COLORS[playerCableColor[p.id]];
          const hasClaimed = playerClaimed[p.id];
          return `
            <div class="border-2 border-black p-3 flex flex-col items-center justify-between space-y-4 bg-gray-50/50 relative shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <span id="feed-${p.id}" class="absolute -top-6 left-1/2 -translate-x-1/2 font-black text-xs"></span>
              <div class="flex items-center gap-1">
                <span class="text-base">${p.emoji}</span>
                <span class="text-xs font-black truncate max-w-[80px]">${p.name}</span>
              </div>
              
              <!-- cable visual representation -->
              <div class="w-full h-10 border-2 border-black relative flex items-center justify-center overflow-hidden bg-white">
                <div class="w-2.5 h-full absolute left-4 bg-gray-600"></div>
                <div class="w-2.5 h-full absolute right-4 bg-gray-600"></div>
                <div class="w-full h-2 border-t-2 border-b-2 border-black transition-colors duration-300 ${cable.bg}"></div>
              </div>

              <!-- Hotkey controller label button -->
              <div class="w-full">
                <button id="wire-btn-${p.id}" class="w-full py-2 bg-black hover:bg-neutral-800 text-white font-black text-[10px] tracking-wide uppercase transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 shadow-none rounded-none cursor-pointer">
                  ${hasClaimed ? 'KAPTIN!' : `KABLON-KES (${p.keyLabel})`}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Bind dynamic click events for virtual tap
    activePlayers.forEach(p => {
      document.getElementById(`wire-btn-${p.id}`)?.addEventListener('click', () => {
        handleTap(p.id);
      });
    });
  }

  // Keyboard support listening
  const keysListener = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const targetPlayer = activePlayers.find(p => p.key === e.code);
    if (targetPlayer) {
      handleTap(targetPlayer.id);
    }
  };
  window.addEventListener('keydown', keysListener);

  document.getElementById('bomb-quit')?.addEventListener('click', () => {
    if (cycleInterval) clearInterval(cycleInterval);
    window.removeEventListener('keydown', keysListener);
    setScreen('gamesHub');
  });

  // Screen cleanup mutation setup observers
  const observer = new MutationObserver(() => {
    if (!document.getElementById('bomb-quit')) {
      if (cycleInterval) clearInterval(cycleInterval);
      window.removeEventListener('keydown', keysListener);
      observer.disconnect();
    }
  });
  observer.observe(appRoot, { childList: true });

  startRound();
  renderLiveScoreHUD(container, activePlayers, localScores, ' Puan');

  function handleGameCompletion() {
    if (cycleInterval) clearInterval(cycleInterval);
    window.removeEventListener('keydown', keysListener);
    sfx.playFanfare();

    const rewardRatios = [35, 20, 10, 5];
    const sorted = Object.entries(localScores).sort((a,b) => b[1] - a[1]);
    const sortedPlayersList = sorted.map(([idStr]) => state.players.find(p => p.id === parseInt(idStr))!);
    const eliminationStatus = getRoundEliminationStatus(sortedPlayersList);

    let finalHTML = `
      <div class="my-auto bg-white border-4 border-black p-6 sm:p-10 max-w-xl w-full flex flex-col items-center space-y-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black relative overflow-hidden animate-fade-in z-40">
        <div class="text-5xl animate-bounce">🏆</div>
        <div>
          <h3 class="text-2xl sm:text-3xl font-display font-black text-black uppercase tracking-tight">İmha Tamamlandı!</h3>
          <p class="text-black/70 font-semibold text-xs mt-1">Geri sayım durduruldu. Kurtarıcılar madalyalarını paylaşıyor!</p>
        </div>

        <div class="w-full space-y-3.5 my-4">
          <span class="block text-left text-[10px] font-mono text-black/60 font-black uppercase tracking-wider">SKOR KAZANIMLARI</span>
    `;

    sorted.forEach(([idStr, ptsEarned], idx) => {
      const pId = parseInt(idStr);
      const playerObj = state.players.find(p => p.id === pId)!;
      const ptsReward = (rewardRatios[idx] || 0) + (ptsEarned);

      let statusBadgeHTML = '';
      const elimInfo = eliminationStatus[playerObj.id];
      if (state.isEliminationMode && elimInfo) {
        statusBadgeHTML = `<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${elimInfo.colorClass}">${elimInfo.label}</span>`;
        if (elimInfo.status === 'eliminated') {
          playerObj.isEliminated = true;
        }
      }

      playerObj.score += ptsReward;
      playerObj.globalCoins = (playerObj.globalCoins || 0) + ptsReward;

      savePlayerPersistentData(playerObj);

      finalHTML += `
        <div class="flex items-center justify-between bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs text-black font-black">#${idx+1}</span>
            ${getPlayerAvatarHTML(playerObj, "w-8 h-8 text-sm")}
            <span class="font-black text-black text-sm">${playerObj.name}</span>
            ${statusBadgeHTML}
          </div>
          <div class="text-right flex items-center gap-2">
            <div class="text-right flex flex-col leading-tight shrink-0">
              <span class="text-[10px] font-bold text-black/60 font-mono">${ptsEarned} Defusal Puan</span>
              <span class="font-black text-xs bg-[#FF7675] border border-black px-2 mt-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">+${ptsReward} Puan</span>
            </div>
            <span class="font-extrabold text-xs bg-[#FFEAA7] border border-black px-2 py-1 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0 flex items-center gap-0.5">🪙+${ptsReward}</span>
          </div>
        </div>
      `;
    });

    finalHTML += `
        </div>
        <button id="bomb-modal-continue" class="w-full py-4 bg-[#FF7675] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer">
          Liderlik Kürsüsüne Dön
        </button>
      </div>
    `;

    const resultBox = document.createElement('div');
    resultBox.className = "absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center overflow-y-auto p-4 sm:p-6 text-center animate-fade-in";
    resultBox.innerHTML = finalHTML;
    container.appendChild(resultBox);

    document.getElementById('bomb-modal-continue')?.addEventListener('click', () => {
      handleGameFinished();
    });
  }
}

// ==========================================
// 11. MATH DASH GAME (Sayı Avcısı / Hızlı Matematik)
// ==========================================
function renderMathDashGame() {
  const activePlayers = state.isEliminationMode
    ? state.players.filter(p => p.active && !p.isEliminated)
    : state.players.filter(p => p.active);

  let currentTargetNumber = 0;
  let displayedNumber = 0;
  let currentRound = 1;
  const maxRounds = 5;

  let isRoundActive = false;
  let gameInterval: any = null;
  const localScores: { [id: number]: number } = {};
  activePlayers.forEach(p => localScores[p.id] = 0);

  const container = document.createElement('div');
  container.className = "w-full max-w-4xl relative z-10 flex flex-col gap-5 animate-fade-in text-black select-none";

  // Header 
  const header = document.createElement('div');
  header.className = "bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4";
  header.innerHTML = `
    <div>
      <h2 class="text-xl sm:text-2xl font-display font-black text-black">🔢 SAYI AVCISI (FAST MATH)</h2>
      <p class="text-black font-semibold text-xs mt-1">Hedef Sayı yeşil kutuda parladığında canavar hızında tuşuna ilk basan puanı kapar! Yanlış basış can yakar!</p>
    </div>
    <button id="math-quit" class="px-4 py-2 text-xs font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer shrink-0">
      ◀ Arenaya Dön
    </button>
  `;
  container.appendChild(header);

  // Main board display
  const board = document.createElement('div');
  board.className = "bg-white border-4 border-black p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col items-center gap-6 relative min-h-[350px]";
  container.appendChild(board);

  appRoot.appendChild(container);

  sfx.playPowerUp();

  function startRound() {
    isRoundActive = true;
    
    currentTargetNumber = Math.floor(Math.random() * 15) + 3; // number between 3 and 17
    
    // Cycle numbers dynamically
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(() => {
      if (Math.random() < 0.30) {
        displayedNumber = currentTargetNumber;
      } else {
        displayedNumber = Math.floor(Math.random() * 20) + 1;
        while (displayedNumber === currentTargetNumber) {
          displayedNumber = Math.floor(Math.random() * 20) + 1;
        }
      }
      renderBoardUI();
    }, 850);

    renderBoardUI();
  }

  function handlePlayerTap(playerId: number) {
    if (!isRoundActive) return;

    if (displayedNumber === currentTargetNumber) {
      isRoundActive = false;
      if (gameInterval) clearInterval(gameInterval);
      
      sfx.playSuccess();
      localScores[playerId] += 15;
      
      renderBoardUI(playerId, true);
      renderLiveScoreHUD(container, activePlayers, localScores, ' Puan');

      setTimeout(() => {
        if (currentRound < maxRounds) {
          currentRound++;
          startRound();
        } else {
          handleGameCompletion();
        }
      }, 1500);
    } else {
      sfx.playFail();
      localScores[playerId] = Math.max(0, localScores[playerId] - 5);
      renderLiveScoreHUD(container, activePlayers, localScores, ' Puan');
      
      const btn = document.getElementById(`feed-math-${playerId}`);
      if (btn) {
        btn.innerText = '💥 HATALI!';
        btn.className = "absolute -top-6 left-1/3 text-rose-500 font-sans font-black text-xs";
        setTimeout(() => { btn.innerText = ''; }, 1000);
      }
    }
  }

  function renderBoardUI(winnerId: number | null = null, showedWinner: boolean = false) {
    board.innerHTML = `
      <!-- Center Display -->
      <div class="flex flex-col items-center gap-4 w-full">
        <!-- Target Box -->
        <div class="flex items-center gap-6 border-4 border-black px-6 py-3.5 bg-[#E1F5FE] text-black">
          <div class="text-center">
            <span class="text-[10px] font-mono text-gray-500 font-bold block uppercase tracking-widest">KOLAY HEDEF</span>
            <span class="text-3xl font-display font-black text-blue-600 block leading-none select-none">${currentTargetNumber}</span>
          </div>
        </div>

        <!-- Flying Dynamic Screen Box -->
        <div class="w-48 h-28 border-4 border-black flex items-center justify-center bg-gray-900 shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)] transform relative overflow-hidden mt-2">
          ${showedWinner && winnerId !== null ? `
            <div class="text-center animate-bounce">
              <span class="block text-[8px] font-mono text-yellow-350 font-black">AVLANDI!</span>
              <span class="text-sm font-sans text-white font-extrabold">${state.players.find(p => p.id === winnerId)?.name} KAPTİ!</span>
            </div>
          ` : `
            <span class="text-5xl font-mono text-[#55EFC4] font-black tracking-tighter select-none animate-pulse">
              ${displayedNumber}
            </span>
          `}
        </div>
      </div>

      <!-- Turn label count -->
      <div class="absolute top-2 right-2 border border-black bg-neutral-100 text-[10px] font-mono px-2 py-0.5 font-bold">
        EL: ${currentRound} / ${maxRounds}
      </div>

      <!-- Action Controllers Row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-4">
        ${activePlayers.map(p => {
          return `
            <div class="border-2 border-black p-3 bg-gray-50/50 flex flex-col items-center justify-between space-y-4 relative shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <span id="feed-math-${p.id}" class="absolute -top-6"></span>
              <div class="flex items-center gap-1.5">
                <div class="w-6 h-6 rounded-full ${p.color} border border-black flex items-center justify-center text-xs shadow-sm">${p.emoji}</div>
                <span class="text-xs font-black truncate max-w-[80px]">${p.name}</span>
              </div>
              <button id="math-btn-${p.id}" class="w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-black text-[10px] uppercase tracking-wide transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 shadow-none rounded-none cursor-pointer">
                HEDEFİ VUR! (${p.keyLabel})
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Bind dynamic click events for virtual tap
    activePlayers.forEach(p => {
      document.getElementById(`math-btn-${p.id}`)?.addEventListener('click', () => {
        handlePlayerTap(p.id);
      });
    });
  }

  // Keyboard support listening
  const keysListener = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const targetPlayer = activePlayers.find(p => p.key === e.code);
    if (targetPlayer) {
      handlePlayerTap(targetPlayer.id);
    }
  };
  window.addEventListener('keydown', keysListener);

  document.getElementById('math-quit')?.addEventListener('click', () => {
    if (gameInterval) clearInterval(gameInterval);
    window.removeEventListener('keydown', keysListener);
    setScreen('gamesHub');
  });

  // Cleanup component state
  const observer = new MutationObserver(() => {
    if (!document.getElementById('math-quit')) {
      if (gameInterval) clearInterval(gameInterval);
      window.removeEventListener('keydown', keysListener);
      observer.disconnect();
    }
  });
  observer.observe(appRoot, { childList: true });

  startRound();
  renderLiveScoreHUD(container, activePlayers, localScores, ' Puan');

  function handleGameCompletion() {
    if (gameInterval) clearInterval(gameInterval);
    window.removeEventListener('keydown', keysListener);
    sfx.playFanfare();

    const rewardRatios = [35, 20, 10, 5];
    const sorted = Object.entries(localScores).sort((a,b) => b[1] - a[1]);
    const sortedPlayersList = sorted.map(([idStr]) => state.players.find(p => p.id === parseInt(idStr))!);
    const eliminationStatus = getRoundEliminationStatus(sortedPlayersList);

    let finalHTML = `
      <div class="my-auto bg-white border-4 border-black p-6 sm:p-10 max-w-xl w-full flex flex-col items-center space-y-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black relative overflow-hidden animate-fade-in z-40">
        <div class="text-5xl animate-bounce">🏆</div>
        <div>
          <h3 class="text-2xl sm:text-3xl font-display font-black text-black uppercase tracking-tight">Sayı Avı Tamamlandı!</h3>
          <p class="text-black/70 font-semibold text-xs mt-1">Av sona erdi. Kupalar avcılarımıza teslim edildi!</p>
        </div>

        <div class="w-full space-y-3.5 my-4">
          <span class="block text-left text-[10px] font-mono text-black/60 font-black uppercase tracking-wider">SKOR KAZANIMLARI</span>
    `;

    sorted.forEach(([idStr, ptsEarned], idx) => {
      const pId = parseInt(idStr);
      const playerObj = state.players.find(p => p.id === pId)!;
      const ptsReward = (rewardRatios[idx] || 0) + (ptsEarned);

      let statusBadgeHTML = '';
      const elimInfo = eliminationStatus[playerObj.id];
      if (state.isEliminationMode && elimInfo) {
        statusBadgeHTML = `<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${elimInfo.colorClass}">${elimInfo.label}</span>`;
        if (elimInfo.status === 'eliminated') {
          playerObj.isEliminated = true;
        }
      }

      playerObj.score += ptsReward;
      playerObj.globalCoins = (playerObj.globalCoins || 0) + ptsReward;

      savePlayerPersistentData(playerObj);

      finalHTML += `
        <div class="flex items-center justify-between bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs text-black font-black">#${idx+1}</span>
            ${getPlayerAvatarHTML(playerObj, "w-8 h-8 text-sm")}
            <span class="font-black text-black text-sm">${playerObj.name}</span>
            ${statusBadgeHTML}
          </div>
          <div class="text-right flex items-center gap-2">
            <div class="text-right flex flex-col leading-tight shrink-0">
              <span class="text-[10px] font-bold text-black/60 font-mono">${ptsEarned} Av Skor</span>
              <span class="font-black text-xs bg-[#74B9FF] border border-black px-2 mt-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">+${ptsReward} Puan</span>
            </div>
            <span class="font-extrabold text-xs bg-[#FFEAA7] border border-black px-2 py-1 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0 flex items-center gap-0.5">🪙+${ptsReward}</span>
          </div>
        </div>
      `;
    });

    finalHTML += `
        </div>
        <button id="math-modal-continue" class="w-full py-4 bg-[#74B9FF] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer">
          Liderlik Kürsüsüne Dön
        </button>
      </div>
    `;

    const resultBox = document.createElement('div');
    resultBox.className = "absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center overflow-y-auto p-4 sm:p-6 text-center animate-fade-in";
    resultBox.innerHTML = finalHTML;
    container.appendChild(resultBox);

    document.getElementById('math-modal-continue')?.addEventListener('click', () => {
      handleGameFinished();
    });
  }
}

// --- BOOTSTRAP INITIALIZATION ---
// Start with lobby screen
render();
