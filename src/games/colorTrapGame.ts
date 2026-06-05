import { state, appRoot, setScreen, handleGameFinished, sfx, checkAndAwardAchievement, savePlayerPersistentData, getPlayerAvatarHTML, getRoundEliminationStatus, renderLiveScoreHUD } from '../globals';

export function renderColorTrapGame() {
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

  const container = document.createElement('div');
  container.className = "w-full max-w-5xl relative z-10 flex flex-col min-h-[580px] justify-between space-y-4 animate-fade-in select-none text-black my-auto";

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
      <div class="text-center space-y-4.5 flex flex-col items-center min-w-[260px] sm:min-w-[380px] text-black">
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
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="font-mono text-xs text-black font-black">#${idx + 1}</span>
            ${getPlayerAvatarHTML(plyObj, "w-7 h-7 text-xs")}
            <span class="font-black text-xs text-black truncate max-w-[80px] sm:max-w-none">${plyObj.name}</span>
            ${statusBadgeHTML}
          </div>
          <div class="flex items-center gap-1.5 font-semibold text-black shrink-0">
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
