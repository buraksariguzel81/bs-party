import { state, appRoot, setScreen, handleGameFinished, sfx, activeMemoryGameStateContainer, clearActiveMemoryTimers, activeMemoryTimers, checkAndAwardAchievement, savePlayerPersistentData, getPlayerAvatarHTML, getRoundEliminationStatus, renderLiveScoreHUD } from '../globals';

const MEMORY_MODES = [
  {
    id: 'emojis',
    name: 'Emoji Eşleştirme',
    emoji: '🦁',
    color: 'bg-[#FFEAA7]',
    desc: 'Alışıldık eğlenceli emojileri hızlıca eşleştir!',
    cards: [
      { display: '🦁', matchId: 1 }, { display: '🦁', matchId: 1 },
      { display: '🐯', matchId: 2 }, { display: '🐯', matchId: 2 },
      { display: '🦊', matchId: 3 }, { display: '🦊', matchId: 3 },
      { display: '🐻', matchId: 4 }, { display: '🐻', matchId: 4 },
      { display: '🐨', matchId: 5 }, { display: '🐨', matchId: 5 },
      { display: '🐼', matchId: 6 }, { display: '🐼', matchId: 6 },
      { display: '🐸', matchId: 7 }, { display: '🐸', matchId: 7 },
      { display: '🐵', matchId: 8 }, { display: '🐵', matchId: 8 }
    ]
  },
  {
    id: 'math',
    name: 'İşlem Hafızası',
    emoji: '🧮',
    color: 'bg-[#FAB1A0]',
    desc: 'Matematik işlemlerini doğru yanıtları ile eşleştir!',
    cards: [
      { display: '2 + 3', matchId: 1 }, { display: '5', matchId: 1 },
      { display: '8 - 4', matchId: 2 }, { display: '4', matchId: 2 },
      { display: '3 x 3', matchId: 3 }, { display: '9', matchId: 3 },
      { display: '10 - 3', matchId: 4 }, { display: '7', matchId: 4 },
      { display: '12 - 10', matchId: 5 }, { display: '2', matchId: 5 },
      { display: '5 + 7', matchId: 6 }, { display: '12', matchId: 6 },
      { display: '16 - 10', matchId: 7 }, { display: '6', matchId: 7 },
      { display: '4 + 11', matchId: 8 }, { display: '15', matchId: 8 }
    ]
  }
];

export function renderMemoryGame() {
  const activePlayers = state.isEliminationMode
    ? state.players.filter(p => p.active && !p.isEliminated)
    : state.players.filter(p => p.active);

  if (activeMemoryGameStateContainer.value) {
    startGame(activeMemoryGameStateContainer.value.mode, true);
    return;
  }

  // Render Selection Mode Card
  const choiceContainer = document.createElement('div');
  choiceContainer.className = "w-full max-w-2xl bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col items-center space-y-6 text-black select-none z-10 animate-fade-in my-auto";
  choiceContainer.innerHTML = `
    <div class="text-center space-y-2">
      <span class="text-4xl animate-bounce block">🧩</span>
      <h2 class="text-2xl sm:text-3xl font-display font-black uppercase tracking-tight">Hafıza Kartı Türleri</h2>
      <p class="text-black/60 text-xs font-semibold">Mücadeleye başlamak için bir hafıza oyunu türü seçin!</p>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      ${MEMORY_MODES.map(mode => `
        <button id="btn-mode-${mode.id}" class="flex items-center gap-4 border-4 border-black p-4 text-left ${mode.color} hover:bg-black hover:text-white group transition-all duration-200 cursor-pointer shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5">
          <span class="text-3xl bg-white border-2 border-black p-2 shadow-[2px_2px_0_rgba(0,0,0,1)] text-black group-hover:scale-110 transition-transform">${mode.emoji}</span>
          <div class="min-w-0">
            <h4 class="font-black text-xs sm:text-sm uppercase tracking-wide group-hover:underline">${mode.name}</h4>
            <p class="text-[10px] font-bold opacity-80 mt-1 leading-tight">${mode.desc}</p>
          </div>
        </button>
      `).join('')}
    </div>

    <button id="btn-mode-quit" class="px-6 py-2.5 bg-neutral-100 hover:bg-black hover:text-white border-2 border-black text-xs font-black uppercase transition-all duration-150 cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5">
      ◀ Arenaya Kaç
    </button>
  `;

  appRoot.appendChild(choiceContainer);

  document.getElementById('btn-mode-quit')?.addEventListener('click', () => {
    setScreen('gamesHub');
  });

  MEMORY_MODES.forEach(mode => {
    document.getElementById(`btn-mode-${mode.id}`)?.addEventListener('click', () => {
      sfx.playPowerUp();
      appRoot.removeChild(choiceContainer);
      startGame(mode);
    });
  });

  function startGame(mode: typeof MEMORY_MODES[0], isResumed: boolean = false) {
    clearActiveMemoryTimers();
    if (!isResumed) {
      // Copy the cards list
      let initialDeck = JSON.parse(JSON.stringify(mode.cards));
      
      // Shuffle deck
      for (let i = initialDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialDeck[i], initialDeck[j]] = [initialDeck[j], initialDeck[i]];
      }

      const initialLocalScores: { [id: number]: number } = {};
      activePlayers.forEach(p => initialLocalScores[p.id] = 0);
      const initialPlayerMismatches: { [id: number]: number } = {};
      activePlayers.forEach(p => initialPlayerMismatches[p.id] = 0);

      activeMemoryGameStateContainer.value = {
        mode: mode,
        deck: initialDeck,
        flippedIndices: [],
        matchedIndices: [],
        localScores: initialLocalScores,
        playerMismatches: initialPlayerMismatches,
        activeTurnIndex: 0
      };
    }

    const gameStateRef = activeMemoryGameStateContainer.value!;
    let deck = gameStateRef.deck;
    let flippedIndices = gameStateRef.flippedIndices;
    let matchedIndices = gameStateRef.matchedIndices;
    const localScores = gameStateRef.localScores;
    const playerMismatches = gameStateRef.playerMismatches;
    let activeTurnIndex = gameStateRef.activeTurnIndex;

    let lockGrid = false;

    const container = document.createElement('div');
    container.className = "w-full max-w-5xl relative z-10 flex flex-col gap-4 sm:gap-5 animate-fade-in select-none text-black my-auto";

    // Panel Header
    const header = document.createElement('div');
    header.className = "bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4";
    header.innerHTML = `
      <div>
        <h2 class="text-xl sm:text-2xl font-display font-black text-black uppercase flex items-center gap-2">🧩 HAFIZA ARENASI: <span class="underline">${mode.name}</span></h2>
        <p class="text-black font-semibold text-xs mt-1">Kart çiftlerini eşleştirerek her çift için +15 puan kazanın. Sıra dönmektedir!</p>
      </div>
      <div class="flex items-center gap-2">
        <button id="memory-quit" class="px-4 py-2 text-xs font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
          ◀ Arenaya Dön
        </button>
      </div>
    `;
    container.appendChild(header);

    // Main game flex block
    const flexArea = document.createElement('div');
    flexArea.className = "flex flex-col md:grid md:grid-cols-4 gap-4 md:gap-6 items-center md:items-start w-full";

    // Sidebar detailing players stats and active turn
    const sidebar = document.createElement('div');
    sidebar.className = "bg-white border-2 md:border-4 border-black p-3 md:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full md:col-span-1";
    flexArea.appendChild(sidebar);

    // Card center grid board box
    const cardGridWrapper = document.createElement('div');
    cardGridWrapper.className = "md:col-span-3 flex flex-col items-center space-y-4 w-full";
    
    const gridDiv = document.createElement('div');
    gridDiv.className = "grid grid-cols-4 gap-1.5 sm:gap-3 bg-white border-2 sm:border-4 border-black p-2 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full aspect-square max-w-[420px] transition-all duration-300";
    cardGridWrapper.appendChild(gridDiv);
    flexArea.appendChild(cardGridWrapper);

    container.appendChild(flexArea);

    // Result dialog box
    const resultModal = document.createElement('div');
    resultModal.className = "hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center overflow-y-auto p-4 sm:p-6 text-center animate-fade-in";
    container.appendChild(resultModal);

    appRoot.appendChild(container);

    // --- RENDERING ROUTINES ---
    function updateTurnVisuals() {
      // Re-render sidebar players panel
      const currentActivePlayer = activePlayers[activeTurnIndex];
      
      sidebar.innerHTML = `
        <div class="flex flex-col gap-3 justify-between items-stretch w-full overflow-hidden">
          <!-- Active Player Block (Top) -->
          <div class="flex items-center justify-between border-b-2 border-black pb-1.5 shrink-0 w-full">
            <span class="text-[9px] font-mono text-[#FF6B6B] uppercase font-black animate-pulse font-sans">SIRA SENDE:</span>
            <div id="active-p-glow" class="px-1.5 py-0.5 ${currentActivePlayer.color} border border-black text-black font-black flex items-center justify-center gap-1 shadow-[1px_1px_0px_rgba(0,0,0,1)] rounded-sm text-[9px] max-w-[65%]">
              <span>${currentActivePlayer.emoji}</span>
              <span class="truncate uppercase text-[9px] font-sans">${currentActivePlayer.name}</span>
            </div>
          </div>

          <!-- Mini Scores Block (Bottom) -->
          <div class="space-y-1 select-none w-full">
            <span class="block text-[8px] font-mono text-black/50 uppercase tracking-wider font-extrabold text-center md:text-left">MİNİ SKORLAR</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-1 gap-1">
      `;

      activePlayers.forEach((p, idx) => {
        const isMyTurn = idx === activeTurnIndex;
        sidebar.innerHTML += `
          <div class="flex items-center justify-between p-1 bg-white border border-black shadow-[1px_1px_0_rgba(0,0,0,1)] ${isMyTurn ? p.color + ' translate-y-0.5 shadow-none' : ''} transition-all font-semibold rounded-sm text-[10px] select-none">
            <div class="flex items-center gap-1 min-w-0">
              <div class="w-5 h-5 rounded-full ${p.color} border border-black flex items-center justify-center text-[10px] shadow shrink-0 animate-bounce" style="animation-duration: ${1 + idx * 0.2}s">
                ${p.emoji}
              </div>
              <span class="text-[9px] font-black text-black truncate">${p.name}</span>
            </div>
            <div class="text-[9px] font-mono font-black text-black bg-white border border-black px-1 py-0.2 shrink-0 ml-1">
              ${localScores[p.id]} px
            </div>
          </div>
        `;
      });

      sidebar.innerHTML += `
            </div>
          </div>
        </div>
      `;

      // Highlight card board perimeter glow matching current player
      gridDiv.className = `grid grid-cols-4 gap-1.5 sm:gap-3 bg-white border-2 sm:border-4 ${currentActivePlayer.borderColor} p-2 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full aspect-square max-w-[420px] transition-all duration-300`;
    }

    function renderGrid() {
      gridDiv.innerHTML = '';
      
      deck.forEach((cardObj: { display: string; matchId: number }, index: number) => {
        const card = document.createElement('div');
        card.className = "perspective-1000 aspect-square cursor-pointer";
        
        const isFlipped = flippedIndices.includes(index) || matchedIndices.includes(index);
        
        card.innerHTML = `
          <div class="w-full h-full duration-450 preserve-3d relative transition-transform ${isFlipped ? 'rotate-y-180' : ''}">
            <!-- Card Front Face (Mystery side) -->
            <div class="absolute inset-0 bg-[#FF6B6B] border-2 sm:border-4 border-black hover:bg-black hover:text-white rounded-none flex items-center justify-center text-lg sm:text-2xl backface-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black text-black select-none text-center">
              ?
            </div>
            <!-- Card Back Face -->
            <div class="absolute inset-0 bg-white border-2 sm:border-4 border-black rounded-none flex items-center justify-center backface-hidden rotate-y-180 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-br from-yellow-50 to-white text-center leading-none">
              <span class="${mode.id === 'math' ? 'text-[9.5px] sm:text-xs md:text-sm font-mono font-black px-0.5 text-black' : 'text-xl sm:text-3xl'} font-display font-black truncate">${cardObj.display}</span>
            </div>
          </div>
        `;

        if (!isFlipped && !lockGrid) {
          card.addEventListener('click', () => handleCardClick(index));
        }
        gridDiv.appendChild(card);
      });
    }

    function handleCardClick(index: number) {
      if (lockGrid || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedIndices.includes(index)) return;

      flippedIndices.push(index);
      sfx.playTick();
      renderGrid();

      if (flippedIndices.length === 2) {
        lockGrid = true;
        const [first, second] = flippedIndices;

        if (deck[first].matchId === deck[second].matchId) {
          // MATCH MADE!
          sfx.playSuccess();
          const matchTimer = setTimeout(() => {
            matchedIndices.push(first, second);
            
            // Reward current active player
            const actPlayer = activePlayers[activeTurnIndex];
            localScores[actPlayer.id] += 1;

            gameStateRef.flippedIndices = [];
            flippedIndices = gameStateRef.flippedIndices;
            lockGrid = false;
            
            renderGrid();
            updateTurnVisuals();
            renderLiveScoreHUD(container, activePlayers, localScores, ' Çift');

            // Check if completion is reached
            if (matchedIndices.length === deck.length) {
              handleGameCompletion();
            }
          }, 600);
          activeMemoryTimers.push(matchTimer);
        } else {
          // FAIL MISMATCH
          sfx.playFail();
          const actPlayer = activePlayers[activeTurnIndex];
          playerMismatches[actPlayer.id] = (playerMismatches[actPlayer.id] || 0) + 1;
          const mismatchTimer = setTimeout(() => {
            gameStateRef.flippedIndices = [];
            flippedIndices = gameStateRef.flippedIndices;
            lockGrid = false;
            
            // Switch Turn
            activeTurnIndex = (activeTurnIndex + 1) % activePlayers.length;
            gameStateRef.activeTurnIndex = activeTurnIndex;
            
            renderGrid();
            updateTurnVisuals();
          }, 1200);
          activeMemoryTimers.push(mismatchTimer);
        }
      }
    }

    function handleGameCompletion() {
      sfx.playFanfare();

      // Sum final points
      const rewardRatios = [35, 20, 10, 5];
      const sorted = Object.entries(localScores).sort((a,b) => b[1] - a[1]);
      const sortedPlayersList = sorted.map(([idStr]) => state.players.find(p => p.id === parseInt(idStr))!);
      const eliminationStatus = getRoundEliminationStatus(sortedPlayersList);

      let finalHTML = `
        <div class="my-auto bg-white border-4 border-black p-6 sm:p-10 max-w-xl w-full flex flex-col items-center space-y-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black relative overflow-hidden animate-fade-in z-40">
          <div class="text-5xl animate-bounce">🏆</div>
          <div>
            <h3 class="text-2xl sm:text-3xl font-display font-black text-black uppercase tracking-tight">Hafıza Arenası Tamamlandı!</h3>
            <p class="text-black/70 font-semibold text-xs mt-1">Eşleştirme mücadelesi bitti. Arena kupaları sahiplerine dağıtıldı!</p>
          </div>

          <div class="w-full space-y-3.5 my-4">
            <span class="block text-left text-[10px] font-mono text-black/60 font-black uppercase tracking-wider">SKOR KAZANIMLARI</span>
      `;

      sorted.forEach(([idStr, matchCount], idx) => {
        const pId = parseInt(idStr);
        const playerObj = state.players.find(p => p.id === pId)!;
        const ptsReward = (rewardRatios[idx] || 0) + (matchCount * 5); // Base match points + ranking points!

        let statusBadgeHTML = '';
        const elimInfo = eliminationStatus[playerObj.id];
        if (state.isEliminationMode && elimInfo) {
          statusBadgeHTML = `<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${elimInfo.colorClass}">${elimInfo.label}</span>`;
          if (elimInfo.status === 'eliminated') {
            playerObj.isEliminated = true;
          }
        }

        // Update historic points & persistant gold coins
        playerObj.score += ptsReward;
        playerObj.globalCoins = (playerObj.globalCoins || 0) + ptsReward;

        // Check perfect memory achievement
        const mismatches = playerMismatches[playerObj.id] || 0;
        if (matchCount >= 2 && mismatches === 0) {
          checkAndAwardAchievement(playerObj, 'perfect_memory');
        }

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
                <span class="text-[10px] font-bold text-black/60 font-mono">${matchCount} Eşleşme</span>
                <span class="font-black text-[10px] sm:text-xs bg-[#FDCB6E] border border-black px-1.5 sm:px-2 mt-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] text-black">+${ptsReward} Puan</span>
              </div>
              <span class="font-extrabold text-[10px] sm:text-xs bg-[#FFEAA7] border border-black px-1.5 sm:px-2 py-1 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0 flex items-center gap-0.5 text-black">🪙+${ptsReward}</span>
            </div>
          </div>
        `;
      });

      finalHTML += `
          </div>
          <button id="memory-modal-continue" class="w-full py-4 bg-[#A29BFE] hover:bg-[#A29BFE] border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer">
            Liderlik Kürsüsüne Dön
          </button>
        </div>
      `;

      if (resultModal) {
        resultModal.innerHTML = finalHTML;
        resultModal.classList.remove('hidden');

        document.getElementById('memory-modal-continue')?.addEventListener('click', () => {
          clearActiveMemoryTimers();
          activeMemoryGameStateContainer.value = null;
          handleGameFinished();
        });
      }
    }

    // Bind initial configurations
    document.getElementById('memory-quit')?.addEventListener('click', () => {
      clearActiveMemoryTimers();
      activeMemoryGameStateContainer.value = null;
      setScreen('gamesHub');
    });
    updateTurnVisuals();
    renderGrid();
    renderLiveScoreHUD(container, activePlayers, localScores, ' Çift');
  }
}
