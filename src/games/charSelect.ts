import { state, appRoot, setScreen, lastScreenBeforeShop, sfx, getPlayerAvatarHTML, savePlayerPersistentData } from '../globals';

export function renderCharSelect() {
  const container = document.createElement('div');
  container.className = "w-full max-w-6xl relative z-10 flex flex-col items-center space-y-4 animate-fade-in my-auto";
  
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
      <button id="char-back-btn" class="px-3.5 py-1.5 bg-white border-2 border-black hover:bg-neutral-100 text-black font-black tracking-wide cursor-pointer duration-205 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase text-[10px] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none select-none">
        ◀ GERİ
      </button>
      <button id="char-home-btn" class="px-3.5 py-1.5 bg-white border-2 border-black hover:bg-neutral-100 text-black font-black tracking-wide cursor-pointer duration-205 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase text-[10px] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none select-none flex items-center gap-1" title="Anasayfa">
        🏠 LOBİ
      </button>
      <button id="char-shop-btn" class="px-3.5 py-1.5 bg-[#FDCB6E] border-2 border-black hover:bg-black hover:text-[#FDCB6E] text-black font-black tracking-wide cursor-pointer duration-205 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase text-[10px] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none select-none">
        🛒 MAĞAZA
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
  gridDiv.className = "grid w-full gap-2 grid-cols-5 max-w-5xl shrink-0";

  state.players.forEach((player) => {
    const playerDiv = document.createElement('div');
    playerDiv.id = `player-card-${player.id}`;
    
    if (player.active) {
      playerDiv.className = `${player.color} border-2 border-black p-1.5 sm:p-2 flex flex-col items-center justify-between text-center space-y-1.5 focus-within:ring-2 focus-within:ring-black transition-all duration-300 relative shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] opacity-100 scale-100 rounded-lg`;
    } else {
      playerDiv.className = `bg-zinc-50 grayscale opacity-55 hover:opacity-100 hover:grayscale-0 border-2 border-black border-dashed p-1.5 sm:p-2 flex flex-col items-center justify-between text-center space-y-1.5 transition-all duration-300 relative shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] scale-98 rounded-lg`;
    }
    
    playerDiv.innerHTML = `
      <!-- Absolutely positioned P1/P5 Badge -->
      <div class="absolute -top-2 left-1.5 px-1 py-0.5 text-[7px] font-display font-black text-white uppercase bg-black border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)] select-none">
        P${player.id}
      </div>

      <!-- Avatar Bubble: Stacked Top -->
      <div id="avatar-container-${player.id}" class="relative flex-shrink-0 flex items-center justify-center bg-white border-2 border-black rounded-full w-9 h-9 sm:w-12 sm:h-12 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] select-none mt-1">
        ${getPlayerAvatarHTML(player, "w-6 h-6 sm:w-8 sm:h-8 text-sm sm:text-base")}
      </div>
      
      <!-- Name Input: Stacked Middle -->
      <div class="w-full bg-white border border-black p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
        <input 
          type="text" 
          id="pname-input-${player.id}" 
          value="${player.name || `Oyuncu ${player.id}`}"
          class="w-full bg-zinc-50/80 border border-black/25 text-center text-[9px] sm:text-[10.5px] font-black text-black py-0.5 px-0.5 focus:outline-none transition-all duration-200 focus:bg-white font-sans leading-none truncate"
          placeholder="..."
          maxlength="8"
        />
      </div>

      <!-- Toggle Active Status: Stacked Bottom -->
      <button id="toggle-active-${player.id}" class="w-full py-1 bg-black hover:bg-zinc-800 border-2 border-black text-white font-black text-[8px] sm:text-[9.5px] tracking-wide uppercase transition-all shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer select-none rounded whitespace-nowrap font-bold">
        ${player.active ? '🟢 SEÇİLDİ' : '⚪ SEÇ'}
      </button>

      <!-- Key assignment reminder -->
      ${!state.isMobileMode ? `
      <div class="w-full bg-white border border-black rounded py-0.5 px-1 flex items-center justify-between text-[7px] sm:text-[8px] font-mono leading-none shadow-[1px_1px_0px_rgba(0,0,0,1)]">
        <span class="text-black font-semibold uppercase">TUŞUMIZ:</span>
        <span class="font-extrabold px-1 bg-black text-white text-[8px] border border-black">${player.keyLabel}</span>
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
  
  // Bind top bar events in next tick
  setTimeout(() => {
    document.getElementById('char-back-btn')?.addEventListener('click', () => {
      sfx.playTick();
      setScreen('lobby');
    });

    document.getElementById('char-home-btn')?.addEventListener('click', () => {
      sfx.playTick();
      setScreen('lobby');
    });

    document.getElementById('char-shop-btn')?.addEventListener('click', () => {
      sfx.playPowerUp();
      lastScreenBeforeShop.value = 'charSelect';
      setScreen('costumeShop');
    });

    document.getElementById('char-start-btn')?.addEventListener('click', () => {
      if (isKadroReady) {
        sfx.playFanfare();
        state.playerCount = currentlyActiveCount;
        state.players.forEach(p => {
          state.scores[p.id] = 0;
          p.score = 0;
          if (p.active) {
            savePlayerPersistentData(p);
          }
        });
        setScreen('gamesHub');
      }
    });
  }, 0);

  const previousContainer = appRoot.firstElementChild;
  if (previousContainer) {
    appRoot.replaceChild(container, previousContainer);
  } else {
    appRoot.appendChild(container);
  }
}
