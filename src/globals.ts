import { GameState, Player, Achievement } from './types';
import { safeLocalStorage } from './safeStorage';
import { sfx } from './audio';
import { SHOP_ITEMS, ACHIEVEMENTS } from './data';

// Service locator callback references for decoupling
export let setScreen: (newScreen: GameState['currentScreen']) => void = () => {};
export let handleGameFinished: () => void = () => {};
export let renderTrigger: () => void = () => {};

export function registerSetScreen(fn: typeof setScreen) {
  setScreen = fn;
}

export function registerHandleGameFinished(fn: typeof handleGameFinished) {
  handleGameFinished = fn;
}

export function registerRenderTrigger(fn: typeof renderTrigger) {
  renderTrigger = fn;
}

export function renderGlobalMuteToggle(parent: HTMLElement) {
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

export function syncPlaygamaPlayerData() {
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

export function syncAllPlayersFromPlaygamaStorage() {
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
      renderTrigger();
    }
  });
}

export function loginPlaygamaPlayer() {
  const bridge = (window as any).playgamaBridge;
  if (bridge && bridge.player) {
    if (typeof bridge.player.authorize === 'function') {
      bridge.player.authorize()
        .then(() => {
          console.log("✅ Playgama Player authorized successfully.");
          syncPlaygamaPlayerData();
          syncAllPlayersFromPlaygamaStorage();
          renderTrigger();
        })
        .catch((err: any) => {
          console.error("❌ Playgama Player auth failed:", err);
        });
    } else {
      console.warn("bridge.player.authorize is not a function");
    }
  }
}

export const state: GameState = {
  playerCount: 4,
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

// Global UI reference
export const appRoot = document.getElementById('root') || document.body;

// Active customized player index in the shop
export let activeShopPlayerId = { value: 1 };
// Keep track of which parent screen opened the shop
export let lastScreenBeforeShop = { value: 'gamesHub' as GameState['currentScreen'] };
// Active player selected for Achievements screen
export let activeAchievementsPlayerId = { value: 1 };

// Persistent memory game state to handle window resizes gracefully without losing matches
export let activeMemoryGameStateContainer: {
  value: {
    mode: any;
    deck: any[];
    flippedIndices: number[];
    matchedIndices: number[];
    localScores: { [id: number]: number };
    playerMismatches: { [id: number]: number };
    activeTurnIndex: number;
  } | null
} = { value: null };

export let activeMemoryTimers: any[] = [];
export function clearActiveMemoryTimers() {
  activeMemoryTimers.forEach(t => clearTimeout(t));
  activeMemoryTimers.length = 0;
}

export function loadPlayerPersistentData(id: number) {
  try {
    const customImage = safeLocalStorage.getItem(`bs_party_custom_image_${id}`);
    const globalCoinsStr = safeLocalStorage.getItem(`bs_party_global_coins_${id}`);
    const unlockedJson = safeLocalStorage.getItem(`bs_party_unlocked_${id}`);
    const activeAcc = safeLocalStorage.getItem(`bs_party_active_acc_${id}`);
    const lastClaimDate = safeLocalStorage.getItem(`bs_party_last_reward_claim_${id}`);
    const streakStr = safeLocalStorage.getItem(`bs_party_reward_streak_${id}`);
    
    const unlockedAchievementsJson = safeLocalStorage.getItem(`bs_party_unlocked_achiers_${id}`);
    const balloonWinsCountStr = safeLocalStorage.getItem(`bs_party_balloon_wins_${id}`);

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

export function getPlaygamaStorageValue(key: string): Promise<string | null> {
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

export function setPlaygamaStorageValue(key: string, value: string): Promise<void> {
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

export function savePlayerPersistentData(player: Player) {
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

    safeLocalStorage.setItem(`bs_party_player_name_${player.id}`, player.name);
    safeLocalStorage.setItem(`bs_party_player_emoji_${player.id}`, player.emoji);
    if (player.avatarName) {
      safeLocalStorage.setItem(`bs_party_player_avatar_name_${player.id}`, player.avatarName);
    }
    safeLocalStorage.setItem(`bs_party_player_key_${player.id}`, player.key);
    safeLocalStorage.setItem(`bs_party_player_key_label_${player.id}`, player.keyLabel);

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
    
    showSavedToast();
  } catch (e) {
    console.error("Failed to save player persistent data", e);
  }
}

let lastSavedToastTime = 0;
export function showSavedToast() {
  const now = Date.now();
  if (now - lastSavedToastTime < 3000) {
    return;
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

export function showAchievementToast(player: Player, achievement: Achievement) {
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

export function checkAndAwardAchievement(player: Player, achievementId: string) {
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

export function getPlayerAvatarHTML(player: Player, extraClasses = "w-16 h-16 text-3xl") {
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

export function getRoundEliminationStatus(sortedRoundPlayers: Player[]): { [id: number]: { status: 'advanced' | 'eliminated' | 'champion', label: string, colorClass: string } } {
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

export function renderLiveScoreHUD(parentContainer: HTMLElement, activePlayers: Player[], scoreMap: { [id: number]: number }, unitLabel: string) {
  let hud = document.getElementById('live-score-hud-bar');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'live-score-hud-bar';
    hud.className = "w-full bg-[#34495E] border-4 border-black p-2 shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-around flex-wrap gap-2 text-white z-10 animate-fade-in text-[10px] sm:text-xs text-center font-bold font-sans rounded-none select-none order-last sm:order-none";
    parentContainer.appendChild(hud);
  }

  const count = activePlayers.length;
  let flexBasisClass = 'basis-[45%]';
  if (count === 3) flexBasisClass = 'basis-[30%]';
  else if (count >= 4) flexBasisClass = 'basis-[22%] sm:basis-auto';

  hud.innerHTML = activePlayers.map(p => `
    <div class="flex items-center gap-1.5 justify-center py-1 px-2.5 bg-black/40 border border-black/50 ${flexBasisClass} truncate rounded-sm">
      <div class="w-5 h-5 rounded-full ${p.color} border border-black flex items-center justify-center text-[11px] shrink-0">
        ${p.emoji}
      </div>
      <div class="min-w-0 text-left leading-tight">
        <div class="truncate text-[8.5px] uppercase opacity-75 font-black text-white">${p.name}</div>
        <div class="text-[10px] font-mono font-black text-[#FFEAA7] animate-pulse">${scoreMap[p.id] || 0}${unitLabel}</div>
      </div>
    </div>
  `).join('');
}

export function triggerPlaygamaAd(): Promise<void> {
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
