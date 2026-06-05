import { state, appRoot, setScreen, handleGameFinished, sfx, savePlayerPersistentData, getPlayerAvatarHTML, getRoundEliminationStatus, renderLiveScoreHUD } from '../globals';
import { SHOP_ITEMS } from '../data';

export function renderRaceGame() {
  const activePlayers = state.isEliminationMode
    ? state.players.filter(p => p.active && !p.isEliminated)
    : state.players.filter(p => p.active);

  let isGameOver = false;
  const finishedPlayers: number[] = [];
  const endButtonContainer = document.createElement('div');
  endButtonContainer.id = "race-end-early-container";
  endButtonContainer.className = "hidden w-full flex justify-center py-2 animate-fade-in";

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
  container.className = "w-full max-w-5xl relative z-10 flex flex-col min-h-[580px] justify-between space-y-4 animate-fade-in select-none text-black my-auto";

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

  function updateRaceTracks() {
    renderLiveScoreHUD(container, activePlayers, playerProgress, ' Metre');
    sidePanel.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs font-mono font-black border-2 border-black bg-white px-2 py-1 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <span>PARKUR:</span>
          <span class="text-emerald-600 font-black animate-pulse">100 Metre</span>
        </div>
        <span class="block text-[8px] font-mono text-black/45 uppercase tracking-widest font-black mt-2">ANLIK MESAFELER</span>
        <div class="space-y-2 mt-1 w-full flex flex-col">
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
          Carrot kids friendly tab play system, mash and rush to finish!
        </div>
      </div>
    `;

    mainChamber.innerHTML = `
      <div class="w-full h-full flex flex-col justify-around py-2 space-y-3">
        ${activePlayers.map(p => {
          const progress = playerProgress[p.id];
          const isStunned = playerStunGrace[p.id] && Date.now() < playerStunGrace[p.id];
          const accessoryHTML = p.activeAccessory ? `
            <span class="absolute -top-3.5 left-1/2 -translate-x-1/2 text-base select-none">${
              SHOP_ITEMS.find(item => item.id === p.activeAccessory)?.emoji || ''
            }</span>
          ` : '';

          return `
            <div class="relative w-full h-[62px] border-4 border-black bg-zinc-50 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-between">
              <div class="absolute inset-x-0 h-full bg-gradient-to-r from-emerald-50 to-emerald-100/40 z-0"></div>
              
              <div class="absolute left-[25%] -translate-x-1/2 flex flex-col items-center z-10" style="opacity: ${itemsClaimed[p.id].includes('candy') ? '0.35' : '1'}">
                <span class="text-xs sm:text-sm animate-bounce" style="animation-duration: 2s">🍬</span>
                <span class="text-[6.5px] font-black bg-white border border-black/30 px-0.5 rounded leading-none">ŞEKER (+5)</span>
              </div>

              <div class="absolute left-[50%] -translate-x-1/2 flex flex-col items-center z-10" style="opacity: ${itemsClaimed[p.id].includes('banana') ? '0.35' : '1'}">
                <span class="text-xs sm:text-sm">🍌</span>
                <span class="text-[6.5px] font-black bg-white border border-black/30 px-0.5 rounded leading-none text-amber-600">MUZ (DUR!)</span>
              </div>

              <div class="absolute left-[72%] -translate-x-1/2 flex flex-col items-center z-10" style="opacity: ${itemsClaimed[p.id].includes('star') ? '0.35' : '1'}">
                <span class="text-xs sm:text-sm animate-pulse">⭐</span>
                <span class="text-[6.5px] font-black bg-white border border-black/30 px-0.5 rounded leading-none text-violet-600">YILDIZ (+8)</span>
              </div>

              <div class="absolute left-[85%] -translate-x-1/2 flex flex-col items-center z-10" style="opacity: ${itemsClaimed[p.id].includes('mud') ? '0.35' : '1'}">
                <span class="text-xs sm:text-sm">💩</span>
                <span class="text-[6.5px] font-black bg-white border border-black/30 px-0.5 rounded leading-none text-purple-700">ÇAMUR (AĞIR)</span>
              </div>

              <div class="absolute right-[0px] h-full w-8 bg-zinc-200 border-l border-zinc-400/40 z-10 flex items-center justify-center font-bold text-lg select-none">
                🏁
              </div>

              <div class="absolute left-3 top-1/2 -translate-y-1/2 z-10 select-none">
                <span class="font-display font-black text-xs uppercase text-black/15 tracking-wider">${p.name}'s Track</span>
              </div>

              <div id="race-avatar-${p.id}" class="absolute top-[8px] h-10 w-10 rounded-full border-2 border-black flex items-center justify-center shadow-[1px_1.5px_0_rgba(0,0,0,1)] ${p.color} transition-all duration-150 z-20 ${isStunned ? 'animate-spin' : ''}" style="left: calc(${(progress / 100) * 85}% + 8px);">
                ${accessoryHTML}
                ${p.customImage ? `<img src="${p.customImage}" class="w-full h-full rounded-full object-cover" />` : `<span class="text-xl select-none">${p.emoji}</span>`}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  updateRaceTracks();

  function spawnTapText(text: string, pId: number, bgClass = "bg-white text-black") {
    const item = document.createElement('div');
    item.className = `absolute text-[9px] font-black border-2 border-black px-1.5 py-0.5 ${bgClass} uppercase tracking-wider animate-bounce shadow-[1px_1px_0px_rgba(0,0,0,1)] z-30 rounded text-black`;
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
    const now = Date.now();
    if (playerStunGrace[pId] && now < playerStunGrace[pId]) {
      sfx.playFail();
      spawnTapText("💫 DIZZY! (KAYDI!)", pId, "bg-red-500 text-white");
      return;
    }

    let step = 2.4;
    if (playerMudTaps[pId] && playerMudTaps[pId] > 0) {
      step = 1.0;
      playerMudTaps[pId]--;
    }

    playerProgress[pId] = Math.min(100, playerProgress[pId] + step);
    const pos = playerProgress[pId];

    sfx.playTick();

    const claimed = itemsClaimed[pId];

    if (pos >= 25 && !claimed.includes('candy')) {
      claimed.push('candy');
      playerProgress[pId] = Math.min(100, playerProgress[pId] + 5);
      sfx.playPowerUp();
      spawnTapText("🍬 ŞEKER HIZI! +5m", pId, "bg-[#55EFC4] text-black");
    }

    if (pos >= 50 && !claimed.includes('banana')) {
      claimed.push('banana');
      playerStunGrace[pId] = now + 1200;
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

    if (pos >= 72 && !claimed.includes('star')) {
      claimed.push('star');
      playerProgress[pId] = Math.min(100, playerProgress[pId] + 8);
      sfx.playPowerUp();
      spawnTapText("⭐ SÜPER KOŞU! +8m", pId, "bg-[#FDCB6E] text-black");
    }

    if (pos >= 85 && !claimed.includes('mud')) {
      claimed.push('mud');
      playerMudTaps[pId] = 5;
      sfx.playFail();
      spawnTapText("💩 ÇAMURDAN GEÇTİN! YAVAŞLA!", pId, "bg-amber-800 text-white");
    }

    updateRaceTracks();

    if (playerProgress[pId] >= 100) {
      if (!finishedPlayers.includes(pId)) {
        finishedPlayers.push(pId);
        sfx.playFanfare();

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
        <button id="race-end-early-btn" class="w-full max-w-sm py-3.5 bg-[#FF7675] text-white hover:bg-black border-4 border-black font-display font-black text-xs uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_rgba(0,0,0,1)] flex items-center justify-center gap-2 select-none text-black">
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

    const remainingSorted = activePlayers
      .filter(p => !finishedPlayers.includes(p.id))
      .sort((a, b) => playerProgress[b.id] - playerProgress[a.id]);
    
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

        <div class="w-full space-y-2.5 my-3 text-black">
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
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="font-mono text-xs text-black font-black">#${idx + 1}</span>
            ${getPlayerAvatarHTML(plyObj, "w-7 h-7 text-xs")}
            <span class="font-black text-xs text-black truncate max-w-[80px] sm:max-w-none">${plyObj.name}</span>
            ${statusBadgeHTML}
          </div>
          <div class="flex items-center gap-1.5 font-semibold text-black shrink-0">
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

  document.getElementById('race-game-quit')?.addEventListener('click', () => {
    window.removeEventListener('keydown', keyMapHandler);
    setScreen('gamesHub');
  });

  const observer = new MutationObserver(() => {
    if (!document.getElementById('race-game-quit')) {
      window.removeEventListener('keydown', keyMapHandler);
      observer.disconnect();
    }
  });
  observer.observe(appRoot, { childList: true });
}
