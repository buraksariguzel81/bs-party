import { state, appRoot, setScreen, sfx, render, getPlayerAvatarHTML } from '../globals';
import { ACHIEVEMENTS } from '../data';

let activeAchievementsPlayerId = 1;

export function renderAchievements() {
  const container = document.createElement('div');
  container.className = "w-full max-w-5xl relative z-10 flex flex-col gap-3.5 animate-fade-in text-black select-none my-auto";

  const activePlayers = state.players.filter(p => p.active);
  let activePlayer = activePlayers.find(p => p.id === activeAchievementsPlayerId);
  if (!activePlayer) {
    activePlayer = activePlayers[0];
    if (activePlayer) {
      activeAchievementsPlayerId = activePlayer.id;
    }
  }

  if (!activePlayer) {
    setScreen('lobby');
    return;
  }

  const headerDiv = document.createElement('div');
  headerDiv.className = "bg-white border-4 border-black p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]";
  headerDiv.innerHTML = `
    <div class="flex items-center gap-2.5">
      <span class="text-2xl shrink-0 animate-bounce-short">🏆</span>
      <div class="text-left">
        <h2 class="text-base sm:text-lg font-display font-black uppercase text-black leading-none">BAŞARIMLAR VİTRİNİ</h2>
        <p class="text-black/60 font-semibold text-[10px] mt-1 leading-none">Oyuncuların oyun içi kupalarını, ödüllerini ve madalyalarını takip et!</p>
      </div>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <button id="ach-lobby-btn" class="px-3 py-1.5 bg-white hover:bg-neutral-100 text-black border-2 border-black font-black text-[10px] uppercase cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all leading-none rounded">
        🏠 LOBİYE DÖN
      </button>
      <button id="ach-arena-btn" class="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white border-2 border-black font-black text-[10px] uppercase cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all leading-none rounded">
        🎮 OYUN SEÇİMİ
      </button>
    </div>
  `;
  container.appendChild(headerDiv);

  const topControlRow = document.createElement('div');
  topControlRow.className = "bg-[#FFF9C4] border-4 border-black p-3 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-3";
  const unlockedCount = activePlayer.unlockedAchievements?.length || 0;
  
  topControlRow.innerHTML = `
    <div class="flex items-center gap-2 flex-wrap text-black">
      <span class="text-[10px] font-mono font-black text-black/50 uppercase select-none">AKTİF SEÇİLİ OYUNCU:</span>
      <div class="flex items-center gap-1.5 bg-white border-2 border-black py-1 px-3 rounded-md shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] text-black">
        <div class="w-6 h-6 rounded-full border border-black overflow-hidden flex items-center justify-center bg-zinc-50">
          ${getPlayerAvatarHTML(activePlayer, "w-5 h-5 text-xs")}
        </div>
        <span class="text-xs font-black uppercase text-black select-none">${activePlayer.name}</span>
        <span class="font-bold text-xs text-[#FCA311] ml-1 select-none">🪙 ${activePlayer.globalCoins || 0}</span>
      </div>
    </div>

    <div class="flex items-center gap-2 flex-wrap text-left text-black">
      <span class="text-[10px] font-mono text-black/55 uppercase font-black">TOPLAM KUPALAR:</span>
      <span class="px-2.5 py-1 bg-[#4ECDC4] border-2 border-black font-mono font-black text-xs text-black shadow-[1px_1px_0_rgba(0,0,0,1)]">
        ${unlockedCount} / ${ACHIEVEMENTS.length} AÇILDI
      </span>
    </div>
  `;
  container.appendChild(topControlRow);

  const tabGrid = document.createElement('div');
  tabGrid.className = "grid grid-cols-2 sm:grid-cols-5 gap-2 w-full max-w-5xl shrink-0";
  activePlayers.forEach(p => {
    const isSelected = p.id === activeAchievementsPlayerId;
    const tabBtn = document.createElement('button');
    tabBtn.className = `px-2 py-1.5 border-2 border-black font-black uppercase text-[10px] sm:text-[11px] cursor-pointer transition-all flex items-center justify-center gap-1.5 rounded-md h-9 truncate ${
      isSelected 
        ? 'bg-black text-white shadow-none' 
        : `${p.color} text-black shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:opacity-90`
    }`;
    tabBtn.innerHTML = `
      <span class="text-sm shrink-0">${p.emoji}</span>
      <span class="truncate leading-none">${p.name}</span>
    `;
    tabBtn.addEventListener('click', () => {
      activeAchievementsPlayerId = p.id;
      sfx.playTick();
      render();
    });
    tabGrid.appendChild(tabBtn);
  });
  container.appendChild(tabGrid);

  const achievementsGrid = document.createElement('div');
  achievementsGrid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full pr-1 overflow-y-auto max-h-[380px]";

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

    const card = document.createElement('div');
    if (isUnlocked) {
      card.className = "border-4 border-black bg-[#EBFBEE] p-3 flex items-start gap-3 shadow-[3px_3px_0_rgba(0,0,0,1)] relative overflow-hidden rounded-md text-left transition-all hover:scale-[1.01] text-black";
      card.innerHTML = `
        <div class="absolute -top-1.5 -right-6 w-16 h-5 bg-emerald-500 text-white border border-black flex items-center justify-center text-[7px] font-mono font-black uppercase rotate-45 select-none opacity-90 shadow-sm leading-none text-white">
          AÇILDI
        </div>
        <div class="w-10 h-10 shrink-0 rounded bg-white border-2 border-black flex items-center justify-center text-xl shadow-[1px_1px_0_rgba(0,0,0,1)] select-none">
          ${ach.badgeEmoji}
        </div>
        <div class="min-w-0 flex-1 leading-normal">
          <h4 class="text-[11px] sm:text-xs font-black text-black uppercase pr-4 truncate">${ach.name}${progressStr}</h4>
          <p class="text-[9.5px] text-[#2D3748]/85 font-semibold mt-0.5 leading-tight">${ach.description}</p>
          <div class="mt-1 flex items-center gap-1 select-none">
            <span class="text-[7.5px] font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-1 py-0.5 rounded">KAZANILDI ✅</span>
          </div>
        </div>
      `;
    } else {
      card.className = "border-4 border-gray-300 bg-neutral-50/70 p-3 flex items-start gap-3 shadow-[2px_2px_0_rgba(0,0,0,0.05)] relative overflow-hidden rounded-md text-left opacity-75 text-black";
      card.innerHTML = `
        <div class="absolute top-1.5 right-1.5 flex items-center justify-center text-[10px] opacity-45 select-none text-black">
          🔒
        </div>
        <div class="w-10 h-10 shrink-0 rounded bg-neutral-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-xl grayscale opacity-50 select-none">
          ${ach.badgeEmoji.substring(0, 2)}
        </div>
        <div class="min-w-0 flex-1 leading-normal">
          <h4 class="text-[11px] sm:text-xs font-black text-gray-400 uppercase truncate pr-3">${ach.name}${progressStr}</h4>
          <p class="text-[9.5px] text-gray-400 font-semibold mt-0.5 leading-tight">${ach.description}</p>
          <div class="mt-1 flex items-center gap-1 select-none">
            <span class="text-[7.5px] font-mono font-bold bg-gray-100 text-gray-400 border border-gray-200 px-1 py-0.5 rounded text-gray-400">KİLİTLİ</span>
          </div>
        </div>
      `;
    }
    achievementsGrid.appendChild(card);
  });

  container.appendChild(achievementsGrid);
  appRoot.appendChild(container);

  setTimeout(() => {
    document.getElementById('ach-lobby-btn')?.addEventListener('click', () => {
      sfx.playTick();
      setScreen('lobby');
    });
    document.getElementById('ach-arena-btn')?.addEventListener('click', () => {
      sfx.playTick();
      setScreen('gamesHub');
    });
  }, 0);
}
