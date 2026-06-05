import { state, appRoot, setScreen, handleGameFinished, sfx, savePlayerPersistentData, getPlayerAvatarHTML, getRoundEliminationStatus, renderLiveScoreHUD } from '../globals';

export function renderMathDashGame() {
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
  container.className = "w-full max-w-4xl relative z-10 flex flex-col gap-5 animate-fade-in text-black select-none my-auto";

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
        <div class="w-48 h-28 border-4 border-black flex items-center justify-center bg-gray-900 shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)] transform relative overflow-hidden mt-2 text-white">
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
        <div class="flex items-center justify-between bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
          <div class="flex items-center gap-3 min-w-0">
            <span class="font-mono text-xs text-black font-black">#${idx+1}</span>
            ${getPlayerAvatarHTML(playerObj, "w-8 h-8 text-sm")}
            <span class="font-black text-black text-sm truncate max-w-[80px] sm:max-w-none">${playerObj.name}</span>
            ${statusBadgeHTML}
          </div>
          <div class="text-right flex items-center gap-2 shrink-0">
            <div class="text-right flex flex-col leading-tight shrink-0">
              <span class="text-[10px] font-bold text-black/60 font-mono">${ptsEarned} Av Skor</span>
              <span class="font-black text-xs bg-[#74B9FF] border border-black px-2 mt-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] text-black">+${ptsReward} Puan</span>
            </div>
            <span class="font-extrabold text-xs bg-[#FFEAA7] border border-black px-2 py-1 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0 flex items-center gap-0.5 text-black">🪙+${ptsReward}</span>
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
