import { state, appRoot, setScreen, lastScreenBeforeShop, sfx } from '../globals';
import { hasAnyUnclaimedBonus, renderDailyBonusModal, renderHowToPlayModal } from './modals';

export const GAME_DETAILS: { [key: string]: { name: string; emoji: string; color: string; desc: string } } = {
  balloonGame: { name: 'Balon Şişirme', emoji: '🎈', color: 'bg-[#FF6B6B]', desc: 'Seri tuşlayıp balonu patlat!' },
  memoryGame: { name: 'Hafıza Kartları', emoji: '🧩', color: 'bg-[#A29BFE]', desc: 'Eşleşen kart çiftlerini bul!' },
  colorTrapGame: { name: 'Renk Tuzağı', emoji: '🎨', color: 'bg-[#FDCB6E]', desc: 'Renk ve metin eşleşirse bas!' },
  clickDerbyGame: { name: 'Işık Avcısı', emoji: '⚡', color: 'bg-[#55EFC4]', desc: 'Yeşil lamba yanar yanmaz tıkla!' },
  raceGame: { name: 'Sevimli Koşu', emoji: '🏃', color: 'bg-[#FCA311]', desc: 'Muzlardan kaç, hızlanıp yarışı kazan!' },
  bombGame: { name: 'Bomba İmha', emoji: '💣', color: 'bg-[#FF7675]', desc: 'Patlama gerçekleşmeden kabloyu kes!' },
  mathDashGame: { name: 'Sayı Avcısı', emoji: '🔢', color: 'bg-[#74B9FF]', desc: 'Belirtilen hedef sayıyı ilk yakalayan ol!' }
};

export function renderGamesHub() {
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
  container.className = "w-full max-w-6xl relative z-10 flex flex-col animate-fade-in text-black select-none gap-4 my-auto";

  // Side-by-side Grid Wrapper for Portrait vs Landscape
  const hubGrid = document.createElement('div');
  hubGrid.className = "grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch";

  // Left Column: Navigation controls, Playlist plan & Eliminasyon Status
  const leftCol = document.createElement('div');
  leftCol.className = "lg:col-span-4 flex flex-col gap-4";

  // Navigation Panel (Back, Shop, Gifts, Guides)
  const navCard = document.createElement('div');
  navCard.className = "bg-white border-4 border-black p-4 flex flex-col gap-3.5 shadow-[5px_5px_0_rgba(0,0,0,1)]";
  
  navCard.innerHTML = `
    <div class="flex items-center justify-between border-b pb-2.5 border-black/10 select-none">
      <h3 class="text-xs font-display font-black tracking-wider uppercase text-black">⚡ ARENA KONTROLÜ</h3>
      <button id="hub-back-btn" class="px-2.5 py-1 bg-black text-white hover:bg-neutral-805 border-2 border-black text-[9px] font-black uppercase cursor-pointer shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-colors font-bold">
        ⬅ GİRİŞ
      </button>
    </div>
    <div class="grid grid-cols-4 gap-1.5 font-bold">
      <button id="hub-shop-btn" class="text-[9.5px] font-black uppercase bg-[#FDCB6E] border-2 border-black py-1.5 px-1 shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-black hover:text-[#FDCB6E] cursor-pointer flex flex-col items-center justify-center gap-1 transition-all rounded">
        <span>🛍️</span>
        <span class="truncate w-full text-center select-none font-bold">MAĞAZA</span>
      </button>
      <button id="hub-achievements-btn" class="text-[9.5px] font-black uppercase bg-[#FF7675] border-2 border-black py-1.5 px-1 shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-black hover:text-white cursor-pointer flex flex-col items-center justify-center gap-1 transition-all rounded">
        <span>🏆</span>
        <span class="truncate w-full text-center select-none font-bold">ROZET</span>
      </button>
      <button id="hub-daily-btn" class="text-[9.5px] font-black uppercase bg-[#4ECDC4] border-2 border-black py-1.5 px-0.5 shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-black hover:text-white cursor-pointer flex flex-col items-center justify-center gap-1 transition-all relative rounded font-bold">
        <span>🎁</span>
        <span class="truncate w-full text-center select-none">HEDİYE</span>
        ${hasAnyUnclaimedBonus() ? `<span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border border-black rounded-full animate-ping"></span><span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 border border-black rounded-full"></span>` : ''}
      </button>
      <button id="hub-how-btn" class="text-[9.5px] font-black uppercase bg-[#FFD2E8] border-2 border-black py-1.5 px-1 shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-black hover:text-white cursor-pointer flex flex-col items-center justify-center gap-1 transition-all rounded font-bold">
        <span>📖</span>
        <span class="truncate w-full text-center select-none">REHBER</span>
      </button>
    </div>
  `;
  leftCol.appendChild(navCard);

  // Elimination Banner (if elimination mode is active)
  if (state.isEliminationMode) {
    const elimBanner = document.createElement('div');
    elimBanner.className = "bg-[#FFF0F2] border-4 border-[#FF7675] p-3 text-black shadow-[5px_5px_0_rgba(0,0,0,1)] select-none";
    elimBanner.innerHTML = `
      <div class="flex items-center gap-1 mb-2 pb-1.5 border-b-2 border-[#FF7675]/30">
        <span class="text-base shrink-0 animate-bounce-short">🔥</span>
        <h4 class="text-[10px] font-display font-black uppercase text-black leading-none">NOCAKOUT DURUMU</h4>
      </div>
      <div class="grid grid-cols-2 gap-2">
        ${state.players.filter(p => p.active).map(p => {
          if (p.isEliminated) {
            return `
              <div class="flex items-center justify-between p-1.5 bg-neutral-100 border-2 border-neutral-400 opacity-55 text-neutral-500 line-through">
                <span class="font-bold text-[9px] truncate">💀 ${p.name}</span>
                <span class="font-mono text-[7px] bg-red-100 text-red-700 px-1 py-0.5 rounded border border-red-200">ELENDİ</span>
              </div>
            `;
          } else {
            return `
              <div class="flex items-center justify-between p-1.5 bg-white border-2 border-black shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
                <span class="font-extrabold text-[9px] truncate text-black">🔋 ${p.name}</span>
                <span class="font-mono text-[7px] bg-[#55EFC4] text-black px-1 border border-black font-extrabold animate-pulse rounded">HAZIR</span>
              </div>
            `;
          }
        }).join('')}
      </div>
    `;
    leftCol.appendChild(elimBanner);
  }

  // Playlist Planner Widget
  const playlistPlanner = document.createElement('div');
  playlistPlanner.className = "bg-[#EBFBEE] border-4 border-black p-4 shadow-[5px_5px_0_rgba(0,0,0,1)] flex flex-col gap-2.5";
  
  const currentPlaylist = state.gamePlaylist || [];
  let playlistItemsHTML = '';
  if (currentPlaylist.length === 0) {
    playlistItemsHTML = `
      <div class="flex-1 border-2 border-dashed border-black/25 p-2 bg-emerald-50/40 text-center text-[10px] font-bold text-black/60 select-none rounded">
        📋 Sıralı turnuva listesi boş. Sağ panelden "➕ Ekle" butonuna basarak listenizi hazırlayın!
      </div>
    `;
  } else {
    playlistItemsHTML = `
      <div class="flex flex-wrap items-center gap-1.5 p-1.5 bg-emerald-50/70 border-2 border-black max-h-[120px] overflow-y-auto">
        ${currentPlaylist.map((gType, idx) => {
          const det = GAME_DETAILS[gType];
          if (!det) return '';
          return `
            <div class="flex items-center gap-1 ${det.color} border-2 border-black py-0.5 px-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[8px] font-black uppercase text-black rounded font-bold">
              <span>${idx + 1}. ${det.emoji} ${det.name}</span>
              <button data-remove-idx="${idx}" class="ml-1 px-1 bg-white hover:bg-black hover:text-white border border-black transition-colors select-none font-black text-[8px]" title="Kaldır">✕</button>
            </div>
            ${idx < currentPlaylist.length - 1 ? '<span class="text-black font-black text-[9px]">➔</span>' : ''}
          `;
        }).join('')}
      </div>
    `;
  }

  playlistPlanner.innerHTML = `
    <div class="flex items-center justify-between border-b pb-1.5 border-black/10 select-none">
      <h4 class="text-xs font-black text-black uppercase font-display">Turnuva Listesi</h4>
      <div class="flex items-center gap-1 font-bold">
        <button id="playlist-preset-btn" class="text-[8.5px] font-black uppercase bg-[#FDCB6E] hover:bg-black hover:text-[#FDCB6E] border-2 border-black px-1.5 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all">
          ⚡ Tümü
        </button>
        <button id="playlist-clear-btn" class="text-[8.5px] font-black uppercase bg-red-50 hover:bg-red-600 hover:text-white border-2 border-black px-1.5 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all">
          🗑️ Sil
        </button>
      </div>
    </div>
    
    <div class="flex flex-col gap-2">
      ${playlistItemsHTML}
      <button id="playlist-start-btn" class="w-full py-2.5 bg-black text-white hover:bg-[#4ECDC4] hover:text-black border-4 border-black font-black tracking-wide text-[10px] uppercase cursor-pointer shadow-[3px_3px_0_rgba(0,0,0,1)] transition-colors active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center justify-center gap-1.5 font-bold ${currentPlaylist.length === 0 ? 'opacity-40 pointer-events-none' : ''}">
        🚀 TURNUVAYI BAŞLAT (${currentPlaylist.length} Oyun)
      </button>
    </div>
  `;
  leftCol.appendChild(playlistPlanner);

  // Big End/Result button as the footer of left column (saves screen height!)
  const endDiv = document.createElement('div');
  endDiv.className = "w-full";
  endDiv.innerHTML = `
    <button id="end-party-btn" class="w-full py-2.5 bg-[#FF6B6B] text-black border-4 border-black font-black font-sans tracking-widest text-[10px] uppercase cursor-pointer hover:bg-black hover:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none rounded">
      🏆 TURNUVAYI BİTİR VE SKORLARI GÖR!
    </button>
  `;
  leftCol.appendChild(endDiv);

  hubGrid.appendChild(leftCol);

  // Right Column: Selection panel of the 7 mini-games
  const rightCol = document.createElement('div');
  rightCol.className = "lg:col-span-8 flex flex-col gap-3";

  // Section Title inside right column
  const selectHeader = document.createElement('div');
  selectHeader.className = "bg-black text-white p-3 border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-between";
  selectHeader.innerHTML = `
    <h3 class="text-xs sm:text-xs font-display font-black text-white uppercase tracking-wider flex items-center gap-1.1">
      🎮 MİNİ OYUN SEÇİM ARENASI
    </h3>
    <span class="text-[8.5px] font-black uppercase text-emerald-400 font-mono">7 AKTİF MOD</span>
  `;
  rightCol.appendChild(selectHeader);

  // Grid of mini-games (2 columns in tiny, 3 standard landscape, scrollable if needed)
  const gamesGrid = document.createElement('div');
  gamesGrid.className = "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 w-full max-h-[390px] overflow-y-auto pr-1";

  const keyToId: { [key: string]: string } = {
    memoryGame: 'memory',
    balloonGame: 'balloon',
    colorTrapGame: 'colorTrap',
    clickDerbyGame: 'clickDerby',
    raceGame: 'raceGame',
    bombGame: 'bomb',
    mathDashGame: 'mathDash'
  };

  Object.entries(GAME_DETAILS).forEach(([gKey, gDet]) => {
    const actId = keyToId[gKey];
    const card = document.createElement('div');
    card.className = "bg-white border-4 border-black p-3 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col justify-between gap-3 group transition-all hover:bg-zinc-50 rounded-lg relative overflow-hidden";
    card.innerHTML = `
      <div class="flex items-start gap-2 text-left">
        <div class="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded border-2 border-black flex items-center justify-center text-base sm:text-lg ${gDet.color} shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] select-none">
          ${gDet.emoji}
        </div>
        <div class="min-w-0 flex-1">
          <h4 class="text-[10px] sm:text-[11px] font-display font-black text-black uppercase truncate leading-none">${gDet.name}</h4>
          <p class="text-black/60 text-[8.5px] leading-tight font-bold mt-1">
            ${gDet.desc}
          </p>
        </div>
      </div>
      <div class="flex gap-1 pt-1.5 border-t border-dashed border-black/15">
        <button id="play-now-${actId}" class="flex-1 py-1.5 bg-black hover:bg-zinc-850 text-white border-2 border-black font-black text-[9px] uppercase transition-colors cursor-pointer text-center rounded shadow-[1px_1px_0_rgba(0,0,0,1)] whitespace-nowrap font-bold">
          ▶ OYNA
        </button>
        <button id="add-queue-${actId}" class="px-2 py-1.5 bg-[#4ECDC4] hover:bg-black hover:text-white border-2 border-black text-black font-black text-[9px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0_rgba(0,0,0,1)] rounded whitespace-nowrap font-bold" title="Sıralı Turnuvaya Ekle">
          ➕ EKLE
        </button>
      </div>
    `;
    gamesGrid.appendChild(card);
  });

  rightCol.appendChild(gamesGrid);
  hubGrid.appendChild(rightCol);
  container.appendChild(hubGrid);
  appRoot.appendChild(container);

  // Wire up Left Column events
  document.getElementById('end-party-btn')?.addEventListener('click', () => {
    sfx.playFanfare();
    setScreen('gameOver');
  });

  document.getElementById('hub-back-btn')?.addEventListener('click', () => {
    sfx.playTick();
    setScreen('lobby');
  });

  document.getElementById('hub-shop-btn')?.addEventListener('click', () => {
    lastScreenBeforeShop.value = 'gamesHub';
    setScreen('costumeShop');
  });

  document.getElementById('hub-achievements-btn')?.addEventListener('click', () => {
    sfx.playTick();
    setScreen('achievements');
  });

  document.getElementById('hub-daily-btn')?.addEventListener('click', () => {
    sfx.playTick();
    renderDailyBonusModal();
  });

  document.getElementById('hub-how-btn')?.addEventListener('click', () => {
    sfx.playTick();
    renderHowToPlayModal('general');
  });

  // Wire up Preset and queue manage actions
  document.getElementById('playlist-preset-btn')?.addEventListener('click', () => {
    state.gamePlaylist = ['balloonGame', 'memoryGame', 'colorTrapGame', 'clickDerbyGame', 'raceGame', 'bombGame', 'mathDashGame'];
    sfx.playPowerUp();
    setScreen('gamesHub');
  });

  document.getElementById('playlist-clear-btn')?.addEventListener('click', () => {
    state.gamePlaylist = [];
    state.playlistActive = false;
    state.currentPlaylistIndex = 0;
    sfx.playTick();
    setScreen('gamesHub');
  });

  document.getElementById('playlist-start-btn')?.addEventListener('click', () => {
    if (state.gamePlaylist && state.gamePlaylist.length > 0) {
      state.playlistActive = true;
      state.currentPlaylistIndex = 0;
      const initialGame = state.gamePlaylist[0];
      setScreen(initialGame);
    }
  });

  // Wire up individual game buttons and queues
  Object.keys(keyToId).forEach((gKey) => {
    const actId = keyToId[gKey];
    
    document.getElementById(`play-now-${actId}`)?.addEventListener('click', () => {
      state.playlistActive = false;
      setScreen(gKey as any);
    });

    document.getElementById(`add-queue-${actId}`)?.addEventListener('click', () => {
      if (!state.gamePlaylist) state.gamePlaylist = [];
      state.gamePlaylist.push(gKey as any);
      sfx.playPowerUp();
      setScreen('gamesHub');
    });
  });

  // Remove individual items from list
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
