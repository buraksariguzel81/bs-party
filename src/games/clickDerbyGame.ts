import { state, appRoot, setScreen, handleGameFinished, sfx, savePlayerPersistentData, getPlayerAvatarHTML, getRoundEliminationStatus, renderLiveScoreHUD } from '../globals';

export function renderClickDerbyGame() {
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
  container.className = "w-full max-w-5xl relative z-10 flex flex-col min-h-[580px] justify-between space-y-4 animate-fade-in select-none text-black my-auto";

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
  mainChamber.className = "md:col-span-3 bg-white border-4 border-black p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-h-[300px] transition-colors duration-250 text-black";
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
      spawnSpark(`-1 CEZA`, `bg-[#F1C40F] text-blackColor`, pId, true);
    } else if (lightState === 'red') {
      activeScores[pId] = Math.max(0, activeScores[pId] - 2);
      sfx.playExplode();
      spawnSpark(`-2 BOMBA!`, `bg-[#EA2027] text-white`, pId, true);
    }
    renderSidePanel();
  }

  function spawnSpark(text: string, colorClass: string, pId: number, isError = false) {
    const item = document.createElement('div');
    item.className = `absolute text-[10px] font-black border-2 border-black px-2 py-0.5 ${colorClass} uppercase tracking-wider animate-bounce shadow-[1px_1px_0px_rgba(0,0,0,1)] z-20 text-black`;
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
        <div class="flex flex-col items-center space-y-3.5 animate-bounce relative text-black">
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
        <div class="flex flex-col items-center space-y-3.5 text-black">
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
        <div class="flex flex-col items-center space-y-3.5 animate-pulse text-black">
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

    const delay = 900 + Math.random() * 1400;
    if (centralTimer) clearTimeout(centralTimer);
    centralTimer = setTimeout(changeLight, delay);
  }

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
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="font-mono text-xs text-black font-black">#${idx + 1}</span>
            ${getPlayerAvatarHTML(plyObj, "w-7 h-7 text-xs")}
            <span class="font-black text-xs text-black truncate max-w-[80px] sm:max-w-none">${plyObj.name}</span>
            ${statusBadgeHTML}
          </div>
          <div class="flex items-center gap-1.5 font-semibold text-black shrink-0">
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
