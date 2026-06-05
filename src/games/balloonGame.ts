import { state, appRoot, setScreen, handleGameFinished, sfx, checkAndAwardAchievement, savePlayerPersistentData, getPlayerAvatarHTML, getRoundEliminationStatus, renderLiveScoreHUD } from '../globals';

export function renderBalloonGame() {
  const activePlayers = state.isEliminationMode
    ? state.players.filter(p => p.active && !p.isEliminated)
    : state.players.filter(p => p.active);
  
  const pBalloons: { [id: number]: number } = {};
  activePlayers.forEach(p => pBalloons[p.id] = 0);
  
  let isGameOver = false;
  const finishedPlayers: number[] = [];
  const endButtonContainer = document.createElement('div');
  endButtonContainer.id = "balloon-end-early-container";
  endButtonContainer.className = "hidden w-full flex justify-center py-2 animate-fade-in";

  const container = document.createElement('div');
  container.className = "w-full max-w-6xl relative z-10 flex flex-col h-[90vh] max-h-[850px] justify-between space-y-4 animate-fade-in select-none my-auto";

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
      <div class="w-full space-y-3 relative z-10 text-black">
        <div class="flex justify-between items-center text-[10px] font-mono font-black border-2 border-black bg-white px-2 py-0.5 shadow-[2px_2px_0_rgba(0,0,0,1)] text-black">
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
        <button id="balloon-end-early-btn" class="w-full max-w-sm py-3.5 bg-[#FF7675] text-white hover:bg-black border-4 border-black font-display font-black text-xs uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_rgba(0,0,0,1)] flex items-center justify-center gap-2 select-none text-black font-sans">
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
        <div class="flex items-center justify-between bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
          <div class="flex items-center gap-3 min-w-0">
            <span class="font-mono text-xs text-black font-black">#${idx + 1}</span>
            ${getPlayerAvatarHTML(playerObj, "w-8 h-8 text-sm")}
            <span class="font-black text-black text-sm truncate max-w-[80px] sm:max-w-none">${playerObj.name}</span>
            ${statusBadgeHTML}
          </div>
          <div class="flex items-center gap-2 font-semibold text-black shrink-0">
            <span class="text-[10px] font-mono font-bold">%${scoreVal} vana</span>
            <span class="font-extrabold text-[10px] sm:text-xs bg-[#FDCB6E] border border-black px-1.5 sm:px-2 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">+${awarded} Puan</span>
            <span class="font-extrabold text-[10px] sm:text-xs bg-[#FFEAA7] border border-black px-1.5 sm:px-2 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0 flex items-center gap-0.5">🪙+${awarded}</span>
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
  const observer = new MutationObserver(() => {
    if (!document.getElementById('balloon-quit')) {
      window.removeEventListener('keydown', keysListener);
      observer.disconnect();
    }
  });
  observer.observe(appRoot, { childList: true });
}
