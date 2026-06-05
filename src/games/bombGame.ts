import { state, appRoot, setScreen, handleGameFinished, sfx, savePlayerPersistentData, getPlayerAvatarHTML, getRoundEliminationStatus, renderLiveScoreHUD } from '../globals';

export function renderBombGame() {
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
  
  const playerCableColor: { [id: number]: number } = {};
  activePlayers.forEach(p => playerCableColor[p.id] = 0);
  
  const playerClaimed: { [id: number]: boolean } = {};
  const localScores: { [id: number]: number } = {};
  activePlayers.forEach(p => {
    localScores[p.id] = 0;
    playerClaimed[p.id] = false;
  });

  const container = document.createElement('div');
  container.className = "w-full max-w-4xl relative z-10 flex flex-col gap-5 animate-fade-in text-black select-none my-auto";

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
              <div class="w-full h-10 border-2 border-black relative flex items-center justify-center overflow-hidden bg-white text-black">
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
        <div class="flex items-center justify-between bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
          <div class="flex items-center gap-3 min-w-0">
            <span class="font-mono text-xs text-black font-black">#${idx+1}</span>
            ${getPlayerAvatarHTML(playerObj, "w-8 h-8 text-sm")}
            <span class="font-black text-black text-sm truncate max-w-[80px] sm:max-w-none">${playerObj.name}</span>
            ${statusBadgeHTML}
          </div>
          <div class="text-right flex items-center gap-2 shrink-0">
            <div class="text-right flex flex-col leading-tight shrink-0">
              <span class="text-[10px] font-bold text-black/60 font-mono">${ptsEarned} Defusal Puan</span>
              <span class="font-black text-xs bg-[#FF7675] border border-black px-2 mt-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] text-black">+${ptsReward} Puan</span>
            </div>
            <span class="font-extrabold text-xs bg-[#FFEAA7] border border-black px-2 py-1 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0 flex items-center gap-0.5 text-black">🪙+${ptsReward}</span>
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
