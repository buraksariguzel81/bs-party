import { state, appRoot, setScreen, sfx, checkAndAwardAchievement, savePlayerPersistentData, getPlayerAvatarHTML } from '../globals';
import { AVATARS } from '../data';
import { Player } from '../types';

let activeBonusPlayerId = 1;

export function hasAnyUnclaimedBonus(): boolean {
  const today = new Date();
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return state.players.filter(p => p.active).some(p => p.lastRewardClaimDate !== todayDateString);
}

export function renderDailyBonusModal() {
  const modalId = 'daily-bonus-modal';
  const existing = document.getElementById(modalId);
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = modalId;
  overlay.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none antialiased";

  const activePlayers = state.players.filter(p => p.active);
  let activePlayer = activePlayers.find(p => p.id === activeBonusPlayerId);
  if (!activePlayer) {
    activePlayer = activePlayers[0] || state.players[0];
    activeBonusPlayerId = activePlayer.id;
  }

  const lastClaimStr = activePlayer.lastRewardClaimDate || '';
  const currentStreak = activePlayer.rewardStreak || 0;

  const today = new Date();
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateString = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  let hasClaimedToday = false;
  let currentDayOfStreak = 1;
  let canClaim = false;

  if (lastClaimStr === todayDateString) {
    hasClaimedToday = true;
    canClaim = false;
    currentDayOfStreak = currentStreak || 1;
  } else if (lastClaimStr === yesterdayDateString) {
    hasClaimedToday = false;
    canClaim = true;
    currentDayOfStreak = (currentStreak >= 7) ? 1 : currentStreak + 1;
  } else {
    hasClaimedToday = false;
    canClaim = true;
    currentDayOfStreak = 1;
  }

  const rewards = [5, 10, 15, 20, 25, 30, 50];

  const modalBox = document.createElement('div');
  modalBox.className = "w-full max-w-xl bg-white border-4 border-black p-5 sm:p-7 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative text-black scale-95 opacity-0 animate-scale-up";
  modalBox.style.animation = "scaleUp 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards";

  let playerSelectorHTML = '';
  if (activePlayers.length > 1) {
    playerSelectorHTML = `
      <div class="flex flex-wrap gap-1.5 justify-center mb-5 border-b-2 border-dashed border-black pb-4">
        ${activePlayers.map(p => {
          const isSelected = p.id === activeBonusPlayerId;
          const pLastClaim = p.lastRewardClaimDate || '';
          const pCanClaim = pLastClaim !== todayDateString;
          return `
            <button data-player-id="${p.id}" class="bonus-player-tab px-3 py-1.5 border-2 border-black font-black uppercase text-[10px] tracking-wide relative duration-100 cursor-pointer ${
              isSelected 
                ? 'bg-black text-white' 
                : `${p.color} text-black hover:bg-black hover:text-white`
            }">
              <div class="flex items-center gap-1">
                <span>${p.customImage ? '🖼️' : p.emoji}</span>
                <span>${p.name}</span>
                ${pCanClaim ? `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-black rounded-full animate-ping"></span><span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-black rounded-full"></span>` : ''}
              </div>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  let dayCardsHTML = '';
  for (let i = 1; i <= 7; i++) {
    const rewardAmt = rewards[i - 1];
    let cardClass = '';
    let badgeText = '';
    let checkedHTML = '';

    if (hasClaimedToday) {
      if (i < currentDayOfStreak) {
        cardClass = 'bg-[#E5F6FD] border-gray-400 text-gray-500 opacity-60';
        badgeText = 'ALINDI';
        checkedHTML = `
          <div class="absolute inset-0 flex items-center justify-center bg-black/5">
            <span class="text-3xl text-emerald-500 font-bold rotate-[-10deg] drop-shadow-[1px_1px_0_rgba(0,0,0,1)] select-none">✅</span>
          </div>
        `;
      } else if (i === currentDayOfStreak) {
        cardClass = 'bg-emerald-100 border-[#4ECDC4] text-[#2D3748] ring-4 ring-[#4ECDC4]/30 scale-105';
        badgeText = 'BUGÜN';
        checkedHTML = `
          <div class="absolute inset-0 flex items-center justify-center bg-black/5">
            <span class="text-3xl text-emerald-500 font-bold rotate-[-10deg] drop-shadow-[1px_1px_0_rgba(0,0,0,1)] select-none">✅</span>
          </div>
        `;
      } else {
        cardClass = 'bg-neutral-50 border-[#E2E8F0] text-gray-400';
        badgeText = `Gün ${i}`;
      }
    } else {
      if (i < currentDayOfStreak) {
        cardClass = 'bg-[#E5F6FD] border-[#93C5FD] text-gray-400 opacity-65';
        badgeText = 'ALINDI';
        checkedHTML = `
          <div class="absolute inset-0 flex items-center justify-center bg-black/5">
            <span class="text-3xl text-emerald-500 font-bold rotate-[-10deg] drop-shadow-[1px_1px_0_rgba(0,0,0,1)] select-none">✅</span>
          </div>
        `;
      } else if (i === currentDayOfStreak) {
        cardClass = 'bg-[#FFEAA7] border-black text-[#2D3748] border-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] scale-105 animate-pulse-gentle relative z-10 font-bold';
        badgeText = 'KAZAN!';
      } else {
        cardClass = 'bg-neutral-50 border-[#E2E8F0] font-medium text-gray-400';
        badgeText = `Gün ${i}`;
      }
    }

    const isDay7 = i === 7;
    const sizeStyle = isDay7 ? 'col-span-2 sm:col-span-1' : '';

    dayCardsHTML += `
      <div class="relative rounded-none border-2 border-black p-3 flex flex-col items-center justify-between min-h-[105px] overflow-hidden ${cardClass} ${sizeStyle} transition-all">
        <span class="text-[9px] font-mono font-black uppercase tracking-wider relative z-10">${badgeText}</span>
        ${checkedHTML}
        <div class="my-1.5 flex flex-col items-center relative z-10">
          <span class="text-2xl drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">${isDay7 ? '🎁' : '🪙'}</span>
          <span class="font-display font-black text-xs text-black mt-0.5">${rewardAmt} Coin</span>
        </div>
      </div>
    `;
  }

  let claimActionAreaHTML = '';
  if (canClaim) {
    const claimRewardAmt = rewards[currentDayOfStreak - 1];
    claimActionAreaHTML = `
      <button id="bonus-claim-btn" class="w-full py-4 bg-[#4ECDC4] hover:bg-black hover:text-white text-black border-4 border-black font-display font-black text-sm uppercase tracking-wider cursor-pointer shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none hover:shadow-[4px_4px_0_rgba(0,0,0,1)] transition-transform select-none flex items-center justify-center gap-2">
        <span>⚡ ÖDÜLÜ AL (+${claimRewardAmt} COIN)</span>
      </button>
    `;
  } else {
    claimActionAreaHTML = `
      <div class="w-full bg-emerald-100 border-4 border-black p-3.5 text-center shadow-[4px_4px_0_rgba(0,0,0,1)] text-black rotate-[0.5deg]">
        <div class="font-display font-black text-sm uppercase text-emerald-800">🎉 BUGÜNÜN ÖDÜLÜ ALINDI!</div>
        <p class="text-[10px] font-bold text-black/70 mt-0.5">Yarının hediyesi için 24 saat sonra tekrar gel!</p>
      </div>
    `;
  }

  modalBox.innerHTML = `
    <!-- Decorative Header ribbon -->
    <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 border-2 border-black bg-[#A29BFE] text-black font-display text-xs tracking-wider uppercase font-black rotate-[-1deg] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      📅 GÜNLÜK AKTİVİTE ÖDÜLÜ
    </div>

    <!-- Close button -->
    <button id="bonus-close-btn" class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white text-black font-black font-display text-sm cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none select-none">
      ✕
    </button>

    <!-- Modal Title -->
    <div class="text-center mt-3 mb-4">
      <h3 class="text-2xl sm:text-3xl font-display font-black text-black uppercase leading-tight select-none">
        Hediyeler & Bonuslar
      </h3>
      <p class="text-[10px] sm:text-xs font-semibold text-black/75 max-w-sm mx-auto leading-relaxed mt-1">
        Her gün giriş yaparak hediyeni topla! 7 gün üst üste geldiğinde dev bonus paketini kazanacaksın!
      </p>
    </div>

    ${playerSelectorHTML}

    <!-- Reward streak tracker banner -->
    <div class="bg-[#FFF9C4] border-3 border-black p-3 flex items-center justify-between mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black rotate-[-0.5deg]">
      <div class="text-left">
        <span class="block text-[8px] font-mono font-black text-black/50 uppercase tracking-widest leading-none">AKTİF SERİ TAKİBİ</span>
        <div class="text-sm font-black mt-0.5 text-black">Ateş Serisi: <span class="text-orange-500 font-display">${currentStreak} Gün 🔥</span></div>
      </div>
      <div class="text-right text-[10px] font-bold text-black/70 leading-tight">
        Son Alım: <span class="font-mono text-black font-extrabold">${lastClaimStr || 'İlk Kez! 🚀'}</span>
      </div>
    </div>

    <div class="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
      ${dayCardsHTML}
    </div>

    <div class="w-full">
      ${claimActionAreaHTML}
    </div>

    <p class="text-center text-[9px] font-mono font-black text-black/45 uppercase tracking-widest mt-4">
      *Serinizi bozmamak için her gün giriş yapmalısınız
    </p>
  `;

  overlay.appendChild(modalBox);
  appRoot.appendChild(overlay);

  if (!document.getElementById('bonus-animation-style')) {
    const style = document.createElement('style');
    style.id = 'bonus-animation-style';
    style.innerHTML = `
      @keyframes scaleUp {
        0% { transform: scale(0.95); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      .animate-pulse-gentle {
        animation: pulseGentle 1.6s infinite alternate cubic-bezier(0.4, 0, 0.6, 1);
      }
      @keyframes pulseGentle {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.025); filter: brightness(1.03); }
      }
    `;
    document.head.appendChild(style);
  }

  const tabButtons = overlay.querySelectorAll('.bonus-player-tab');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = parseInt(btn.getAttribute('data-player-id') || '1', 10);
      activeBonusPlayerId = pId;
      sfx.playTick();
      renderDailyBonusModal();
    });
  });

  const closeBtn = overlay.querySelector('#bonus-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      sfx.playTick();
      overlay.remove();
    });
  }

  const claimBtn = overlay.querySelector('#bonus-claim-btn');
  if (claimBtn) {
    claimBtn.addEventListener('click', () => {
      sfx.playSuccess();
      const currentReward = rewards[currentDayOfStreak - 1];
      activePlayer.globalCoins = (activePlayer.globalCoins || 0) + currentReward;
      activePlayer.lastRewardClaimDate = todayDateString;
      activePlayer.rewardStreak = currentDayOfStreak;
      if (activePlayer.rewardStreak >= 3) {
        checkAndAwardAchievement(activePlayer, 'streak_3');
      }
      savePlayerPersistentData(activePlayer);

      const splash = document.createElement('div');
      splash.className = "absolute inset-0 bg-yellow-400 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in border-8 border-black";
      splash.innerHTML = `
        <div class="text-7xl animate-bounce mb-4">🪙💥</div>
        <h3 class="text-4xl font-display font-black text-black uppercase tracking-tight">KAZANDIN!</h3>
        <p class="text-lg font-bold text-black mt-2 leading-relaxed">
          ${activePlayer.name} hesabına tam <span class="bg-black text-white px-2.5 py-1 font-mono font-black">${currentReward} COIN</span> yüklendi!
        </p>
        <p class="text-xs text-black/60 font-mono mt-4 uppercase font-black font-semibold">Yarın yine gel ve ödülünü büyüt!</p>
        
        <button id="splash-continue-btn" class="mt-8 px-6 py-3 bg-black hover:bg-white border-2 border-black text-white hover:text-black font-display font-black text-xs uppercase tracking-wider cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
          MÜKEMMEL! DEVAM ET ⚡
        </button>
      `;

      modalBox.appendChild(splash);

      const splashContBtn = splash.querySelector('#splash-continue-btn');
      if (splashContBtn) {
        splashContBtn.addEventListener('click', () => {
          sfx.playTick();
          splash.remove();
          renderDailyBonusModal();
          setScreen(state.currentScreen); // Force a full screen state re-render
        });
      }
    });
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      sfx.playTick();
      overlay.remove();
    }
  });
}

export function renderHowToPlayModal(initialTab = 'general') {
  const modalId = 'how-to-play-modal';
  const existing = document.getElementById(modalId);
  if (existing) {
    existing.remove();
  }

  let activeIntervals: any[] = [];
  function clearModalTimers() {
    activeIntervals.forEach(t => clearInterval(t));
    activeIntervals = [];
  }

  const overlay = document.createElement('div');
  overlay.id = modalId;
  overlay.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none antialiased text-black";

  const modalBox = document.createElement('div');
  modalBox.className = "w-full max-w-2xl bg-white border-4 border-black p-4 sm:p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative text-black scale-95 opacity-0 animate-scale-up flex flex-col max-h-[90vh]";
  modalBox.style.animation = "scaleUp 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards";

  overlay.appendChild(modalBox);
  appRoot.appendChild(overlay);

  const tabs = [
    { id: 'general', label: '📢 Genel Bilgi' },
    { id: 'memory', label: '🧩 Hafıza Kartları' },
    { id: 'balloon', label: '🎈 Balon Şişirme' },
    { id: 'colorTrap', label: '🎨 Renk Tuzağı' },
    { id: 'clickDerby', label: '⚡ Işık Avcısı' },
  ];

  let currentTab = initialTab;

  function renderTabContent() {
    clearModalTimers();
    
    modalBox.innerHTML = `
      <!-- Decorative Header ribbon -->
      <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 border-2 border-black bg-[#FFD2E8] text-black font-display text-[10px] sm:text-xs tracking-wider uppercase font-black rotate-[-1deg] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
        📖 OYUN REHBERİ & PRATİK ALANI
      </div>

      <!-- Close button -->
      <button id="how-close-btn" class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white text-black font-black font-display text-sm cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none select-none z-10">
        ✕
      </button>

      <div class="mt-4 mb-3 shrink-0">
        <h3 class="text-xl sm:text-2xl font-display font-black text-black uppercase leading-tight select-none">
          Oyun Kontrolleri & Kurallar
        </h3>
        <p class="text-[10px] sm:text-xs font-semibold text-black/70 mt-1">
          Turnuva öncesi kuralları öğren ve aşağıdaki <b class="text-[#FF6B6B]">"Pratik Deneme Alanı"</b> üzerinde kendini test et!
        </p>
      </div>

      <!-- Tabs Bar -->
      <div class="flex flex-wrap gap-1 sm:gap-1.5 border-b-2 border-black pb-3 mb-3 shrink-0">
        ${tabs.map(t => {
          const isSelected = t.id === currentTab;
          return `
            <button data-tab-id="${t.id}" class="how-tab-btn px-2 sm:px-3 py-1 sm:py-1.5 border-2 border-black text-black font-black uppercase text-[9px] sm:text-[10px] tracking-wide relative duration-100 cursor-pointer shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] ${
              isSelected 
                ? 'bg-black text-white hover:bg-black hover:text-white' 
                : 'bg-white hover:bg-black hover:text-white'
            }">
              <span>${t.label}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Content Chamber -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-4 text-left" id="how-content-chamber">
        <!-- Content gets programmatically injected below -->
      </div>
    `;

    const tabBtns = modalBox.querySelectorAll('.how-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab-id') || 'general';
        currentTab = tabId;
        sfx.playTick();
        renderTabContent();
      });
    });

    const closeBtn = modalBox.querySelector('#how-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        sfx.playTick();
        clearModalTimers();
        overlay.remove();
      });
    }

    const chamber = modalBox.querySelector('#how-content-chamber') as HTMLDivElement;
    if (!chamber) return;

    if (currentTab === 'general') {
       chamber.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div class="md:col-span-3 space-y-3">
            <div class="space-y-2 text-xs sm:text-sm leading-relaxed">
              <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
                🏟️ Arena Turnuva Düzenlemesi
              </h4>
              <p class="font-semibold text-black/80">
                Bu turnuva, birden fazla oyuncunun en yüksek skoru kaparak zafer basamağına tırmandığı hızlı refleks ve zeka testidir!
              </p>
              <ul class="space-y-2 list-none pl-1 text-[11px] sm:text-xs font-bold text-black/90">
                <li class="flex items-start gap-1.5">
                  <span class="text-emerald-500 font-extrabold">✔</span>
                  <span><b>Playlist Kuyruğu:</b> Playlist kuyruğuna seçtiğin oyunları ekleyip sırayla maraton turnuva yapabilirsin.</span>
                </li>
                <li class="flex items-start gap-1.5">
                  <span class="text-[#FF6B6B] font-extrabold">✔</span>
                  <span><b>Mağaza & Özelleştirme:</b> Kazandığın 🪙 Altınlar ile Mağazaya girip eğlenceli aksesuarlar satın alabilirsin!</span>
                </li>
                <li class="flex items-start gap-1.5">
                  <span class="text-blue-500 font-extrabold">✔</span>
                  <span><b>Kürsü Ödülleri:</b> Turnuva sonlandığında genel liderlik tablosu kesinleşir ve kupa şampiyona gider!</span>
                </li>
              </ul>
            </div>
            
            <div class="p-3 bg-indigo-50 border-2 border-black flex gap-2 items-center">
              <div class="text-2xl shrink-0">🛍️</div>
              <div class="text-[10px] sm:text-[11px] font-bold text-indigo-900 leading-normal">
                <b>İPUCU:</b> Ana ekranda bulunan "🎁 GÜNLÜK HEDİYE" kutusundan her gün ücretsiz gold toplayarak mağaza koleksiyonunu hızla tamamla!
              </div>
            </div>
          </div>

          <div class="md:col-span-2 bg-[#F9F9FB] border-4 border-black p-4 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <span class="text-[8px] font-mono font-black text-black/45 uppercase tracking-widest block mb-1">ARENA KOSTÜM REHBERİ</span>
            <div class="text-4xl animate-bounce my-2 select-none">👑👒🧣</div>
            <div class="font-semibold text-[11px] text-black/85">
              Hemen bir oyuna gir ve rakiplerini yenerek lig bonus puanları elde et!
            </div>
            <div class="mt-4 pt-2 border-t-2 border-dashed border-black/20 flex flex-wrap justify-center gap-1">
              <span class="text-[9px] font-black border border-black bg-[#FFEAA7] px-1 shadow-[1px_1px_0_rgba(0,0,0,1)]">Taktik</span>
              <span class="text-[9px] font-black border border-black bg-[#D2E8FF] px-1 shadow-[1px_1px_0_rgba(0,0,0,1)]">Hız</span>
              <span class="text-[9px] font-black border border-black bg-[#FFD2E8] px-1 shadow-[1px_1px_0_rgba(0,0,0,1)]">Hafıza</span>
            </div>
          </div>
        </div>
      `;
    } 
    else if (currentTab === 'memory') {
      chamber.innerHTML = `
        <div class="space-y-3.5">
          <div class="text-xs sm:text-sm leading-relaxed">
            <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
              🧩 Hafıza Kartları (Memory Pairs)
            </h4>
            <p class="font-semibold text-black/80">
              Kapalı duran kartları sırayla aç. Eğer aynı iki simgeyi arka arkaya bulursan, puanı kaparsın! Rakiplerinin açtığı kartları ezberle.
            </p>
          </div>

          <div class="border-4 border-black bg-purple-50 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center">
            <h5 class="text-[10px] font-black uppercase text-indigo-700 mb-2 tracking-wider">🛠️ PRATİK DENEME ALANI</h5>
            <div class="grid grid-cols-2 gap-3 w-32" id="pract-mem-grid"></div>
            <div id="pract-mem-status" class="mt-3 font-bold text-[11px] sm:text-xs text-black text-center min-h-[1.25rem]">
              Bir kart seçerek eşleştirmeye başla!
            </div>
          </div>
        </div>
      `;

      const symbols = ['🍏', '🍇', '🍏', '🍇'];
      const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      const grid = chamber.querySelector('#pract-mem-grid') as HTMLDivElement;
      const status = chamber.querySelector('#pract-mem-status') as HTMLDivElement;

      let selectedList: { btn: HTMLButtonElement, symbol: string, index: number }[] = [];
      let solvedIndices: number[] = [];

      order.forEach((symIdx) => {
        const btn = document.createElement('button');
        btn.className = "w-12 h-12 border-3 border-black bg-white flex items-center justify-center text-xl font-bold hover:bg-[#A29BFE]/40 transition duration-150 cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] hover:-translate-y-[1px]";
        btn.innerText = '❓';
        
        btn.addEventListener('click', () => {
          const symStr = symbols[symIdx];
          if (solvedIndices.includes(symIdx) || selectedList.some(s => s.index === symIdx) || selectedList.length >= 2) return;

          sfx.playTick();
          btn.innerText = symStr;
          btn.className = "w-12 h-12 border-3 border-black bg-white flex items-center justify-center text-xl font-bold shadow-inner bg-indigo-100";

          selectedList.push({ btn, symbol: symStr, index: symIdx });

          if (selectedList.length === 2) {
            const [first, second] = selectedList;
            if (first.symbol === second.symbol) {
              solvedIndices.push(first.index, second.index);
              selectedList = [];
              sfx.playSuccess();
              first.btn.className = "w-12 h-12 border-3 border-black bg-emerald-100 flex items-center justify-center text-xl font-bold shadow-[2px_2px_0_rgba(0,0,0,1)] scale-105 pointer-events-none duration-150";
              second.btn.className = "w-12 h-12 border-3 border-black bg-emerald-100 flex items-center justify-center text-xl font-bold shadow-[2px_2px_0_rgba(0,0,0,1)] scale-105 pointer-events-none duration-150";
              
              if (solvedIndices.length === 4) {
                status.innerHTML = `<span class="text-emerald-600 font-extrabold animate-bounce block">🎉 Tebrikler Eşleştirdin! 🥳</span>`;
              } else {
                status.innerHTML = `<span class="text-green-600 font-extrabold">Harika! Bir çift buldun!</span>`;
              }
            } else {
              status.innerHTML = `<span class="text-red-500 font-bold">Uyuşmuyor, aklında tut!</span>`;
              setTimeout(() => {
                sfx.playFail();
                first.btn.innerText = '❓';
                first.btn.className = "w-12 h-12 border-3 border-black bg-white flex items-center justify-center text-xl font-bold hover:bg-[#A29BFE]/40 cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]";
                second.btn.innerText = '❓';
                second.btn.className = "w-12 h-12 border-3 border-black bg-white flex items-center justify-center text-xl font-bold hover:bg-[#A29BFE]/40 cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]";
                selectedList = [];
              }, 800);
            }
          } else {
            status.innerHTML = `<span>İkinci kartını seç...</span>`;
          }
        });

        grid.appendChild(btn);
      });
    } 
    else if (currentTab === 'balloon') {
      chamber.innerHTML = `
        <div class="space-y-3.5">
          <div class="text-xs sm:text-sm leading-relaxed">
            <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
              🎈 Balon Şişirme (Balloon Mash)
            </h4>
            <p class="font-semibold text-black/80">
              Butonuna seri şekilde tıkla veya kendi klavye tuşuna sürekli basarak balonu rakipten hızlı şişir!
            </p>
          </div>

          <div class="border-4 border-black bg-red-50 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center">
            <h5 class="text-[10px] font-black uppercase text-red-600 mb-2 tracking-wider">🛠️ PRATİK SEANS</h5>
            
            <div class="flex items-center justify-center h-24 relative w-full overflow-hidden border-2 border-dashed border-black/10 bg-white shadow-inner mb-3 rounded">
              <div id="pract-balloon" class="rounded-full bg-[#FF6B6B] border-3 border-black relative transition-all duration-75 flex items-center justify-center text-xs text-white font-extrabold shadow-[2px_2px_0_rgba(0,0,0,1)]" style="width: 45px; height: 45px;">
                🎈
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-center gap-2">
              <button id="pract-balloon-pump" class="px-5 py-2 bg-[#FF6B6B] border-2 border-black font-black uppercase text-xs tracking-wider cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]">
                🎈 Şişir!
              </button>
              <button id="pract-balloon-reset" class="px-3 py-2 bg-white border-2 border-black font-bold uppercase text-[10px] cursor-pointer shadow-[1px_1px_0_rgba(0,0,0,1)]">
                🔄 Sıfırla
              </button>
            </div>

            <div id="pract-balloon-status" class="mt-3 font-semibold text-xs text-black/60 text-center uppercase tracking-wider">
              Yüzde: <span class="font-black text-black font-mono">0%</span> Şişirildi!
            </div>
          </div>
        </div>
      `;

      const balloon = chamber.querySelector('#pract-balloon') as HTMLDivElement;
      const pumpBtn = chamber.querySelector('#pract-balloon-pump') as HTMLButtonElement;
      const resetBtn = chamber.querySelector('#pract-balloon-reset') as HTMLButtonElement;
      const statusText = chamber.querySelector('#pract-balloon-status') as HTMLDivElement;

      let bPercent = 0;
      
      const updatePractBalloon = () => {
        if (bPercent >= 100) {
          balloon.style.width = '85px';
          balloon.style.height = '85px';
          balloon.className = "rounded-full bg-red-400 border-3 border-black relative transition-all duration-75 flex items-center justify-center text-sm animate-ping";
          balloon.innerText = "💥 GÜM";
          statusText.innerHTML = `<span class="text-orange-500 font-black animate-pulse">PATLADI! 🚀🎈</span>`;
          return;
        }

        const size = Math.min(45 + (bPercent * 0.45), 85);
        balloon.style.width = `${size}px`;
        balloon.style.height = `${size}px`;
        balloon.innerText = '🎈';
        balloon.className = "rounded-full bg-[#FF6B6B] border-3 border-black relative transition-all duration-75 flex items-center justify-center text-xs text-white font-extrabold shadow-[2px_2px_0_rgba(0,0,0,1)]";
        statusText.innerHTML = `Yüzde: <span class="font-black text-black font-mono">${bPercent}%</span> Şişirildi!`;
      };

      pumpBtn.addEventListener('click', () => {
        if (bPercent >= 100) return;
        bPercent += 10;
        if (bPercent >= 100) {
          sfx.playPop();
        } else {
          sfx.playTick();
        }
        updatePractBalloon();
      });

      resetBtn.addEventListener('click', () => {
        bPercent = 0;
        sfx.playTick();
        updatePractBalloon();
      });
    } 
    else if (currentTab === 'colorTrap') {
      chamber.innerHTML = `
        <div class="space-y-3.5">
          <div class="text-xs sm:text-sm leading-relaxed">
            <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
              🎨 Renk Tuzağı (Color Stroop Game)
            </h4>
            <p class="font-semibold text-black/80">
              Yazı rengi ile kelimenin kendisi AYNI ise hemen bas! Yanlış basarsan -1 ceza alırsın.
            </p>
          </div>

          <div class="border-4 border-black bg-yellow-50 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center">
            <h5 class="text-[10px] font-black uppercase text-amber-600 mb-2 tracking-wider">🛠️ STROOP TESTİ</h5>
            
            <div class="border-3 border-black w-full max-w-xs bg-white p-3 text-center shadow-[2px_2px_0_rgba(0,0,0,1)] mb-3 rounded">
              <h3 id="pract-stroop-word" class="text-2xl sm:text-3xl font-black uppercase tracking-wide select-none" style="color: #FF6B6B">KIRMIZI</h3>
            </div>

            <div class="flex items-center gap-2 mb-3">
              <button id="pract-stroop-same" class="px-4 py-2 border-2 border-black font-black bg-green-400 hover:bg-green-500 text-black text-xs uppercase cursor-pointer shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
                ✔ AYNI
              </button>
              <button id="pract-stroop-different" class="px-4 py-2 border-2 border-black font-black bg-red-400 hover:bg-red-500 text-black text-xs uppercase cursor-pointer shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
                ✕ FARKLI
              </button>
            </div>

            <div id="pract-stroop-result" class="font-mono text-xs font-bold uppercase min-h-[1.5rem] tracking-wide text-center">
              Puanın: <span class="text-emerald-700 bg-white border border-black px-1.5 font-bold">0</span>
            </div>
          </div>
        </div>
      `;

      const stroopWord = chamber.querySelector('#pract-stroop-word') as HTMLHeadingElement;
      const sameBtn = chamber.querySelector('#pract-stroop-same') as HTMLButtonElement;
      const diffBtn = chamber.querySelector('#pract-stroop-different') as HTMLButtonElement;
      const resText = chamber.querySelector('#pract-stroop-result') as HTMLDivElement;

      const words = [
        { text: 'KIRMIZI', colorHex: '#FF6B6B' },
        { text: 'MAVİ', colorHex: '#A29BFE' },
        { text: 'YEŞİL', colorHex: '#2EC4B6' }
      ];

      let currentWordIndex = 0;
      let currentColorIndex = 0;
      let scorePractice = 0;

      const refreshStroop = () => {
        currentWordIndex = Math.floor(Math.random() * words.length);
        currentColorIndex = Math.floor(Math.random() * words.length);
        
        stroopWord.innerText = words[currentWordIndex].text;
        stroopWord.style.color = words[currentColorIndex].colorHex;
      };

      const handleUserAnswer = (saidSame: boolean) => {
        const isActuallySame = currentWordIndex === currentColorIndex;
        if (saidSame === isActuallySame) {
          scorePractice++;
          sfx.playSuccess();
          resText.innerHTML = `<span class="text-green-600 font-extrabold">✓ DOĞRU! Skor: ${scorePractice}</span>`;
        } else {
          scorePractice = Math.max(0, scorePractice - 1);
          sfx.playFail();
          resText.innerHTML = `<span class="text-red-500 font-bold">✖ YANLIŞ! Skor: ${scorePractice}</span>`;
        }
        refreshStroop();
      };

      sameBtn.addEventListener('click', () => handleUserAnswer(true));
      diffBtn.addEventListener('click', () => handleUserAnswer(false));

      refreshStroop();
    } 
    else if (currentTab === 'clickDerby') {
      chamber.innerHTML = `
        <div class="space-y-3.5">
          <div class="text-xs sm:text-sm leading-relaxed">
            <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
              ⚡ Işık Avcısı (Traffic Clicker)
            </h4>
            <p class="font-semibold text-black/80">
              Ortadaki lamba YEŞİL yandığında olabildiğince hızlı tıkla! SARI yanarsa -1, KIRMIZI yanarsa -2 ceza alırsın!
            </p>
          </div>

          <div class="border-4 border-black bg-emerald-50 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center">
            <h5 class="text-[10px] font-black uppercase text-emerald-600 mb-2 tracking-wider">🛠️ SİNYALİK TEST</h5>
            
            <div class="flex items-center justify-center gap-4 py-2 px-6 border-3 border-black bg-white shadow-[2px_2px_0_rgba(0,0,0,1)] mb-3 rounded">
              <div id="pract-light-red" class="w-6 h-6 rounded-full bg-red-950 border-2 border-black shadow"></div>
              <div id="pract-light-yellow" class="w-6 h-6 rounded-full bg-yellow-950 border-2 border-black shadow"></div>
              <div id="pract-light-green" class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-black shadow animate-pulse"></div>
            </div>

            <button id="pract-signal-tap" class="w-full max-w-xs py-2.5 border-2 border-black font-black bg-emerald-400 text-black text-xs uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]">
              🚨 TIKLA!
            </button>

            <div id="pract-signal-status" class="mt-3 text-xs tracking-wide uppercase font-mono font-bold leading-normal text-center">
              Skor: <span class="text-black font-black">0 Puan</span>
            </div>
          </div>
        </div>
      `;

      const lRed = chamber.querySelector('#pract-light-red') as HTMLDivElement;
      const lYellow = chamber.querySelector('#pract-light-yellow') as HTMLDivElement;
      const lGreen = chamber.querySelector('#pract-light-green') as HTMLDivElement;
      const clickBtn = chamber.querySelector('#pract-signal-tap') as HTMLButtonElement;
      const statText = chamber.querySelector('#pract-signal-status') as HTMLDivElement;

      let pState: 'green' | 'yellow' | 'red' = 'green';
      let practiceScore = 0;

      const changePracticeLight = () => {
        const rand = Math.random();
        if (rand < 0.45) {
          pState = 'green';
          lRed.className = "w-6 h-6 rounded-full bg-red-950 border-2 border-black shadow";
          lYellow.className = "w-6 h-6 rounded-full bg-yellow-950 border-2 border-black shadow";
          lGreen.className = "w-6 h-6 rounded-full bg-emerald-500 border-2 border-black shadow animate-pulse";
          clickBtn.className = "w-full max-w-xs py-2.5 border-2 border-black font-black bg-emerald-400 text-black text-xs uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]";
        } else if (rand < 0.70) {
          pState = 'yellow';
          lRed.className = "w-6 h-6 rounded-full bg-red-950 border-2 border-black shadow";
          lYellow.className = "w-6 h-6 rounded-full bg-yellow-400 border-2 border-black shadow animate-bounce";
          lGreen.className = "w-6 h-6 rounded-full bg-emerald-950 border-2 border-black shadow";
          clickBtn.className = "w-full max-w-xs py-2.5 border-2 border-black font-black bg-yellow-300 text-black text-xs uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]";
        } else {
          pState = 'red';
          lRed.className = "w-6 h-6 rounded-full bg-red-600 border-2 border-black shadow animate-bounce";
          lYellow.className = "w-6 h-6 rounded-full bg-yellow-950 border-2 border-black shadow";
          lGreen.className = "w-6 h-6 rounded-full bg-emerald-950 border-2 border-black shadow";
          clickBtn.className = "w-full max-w-xs py-2.5 border-2 border-black font-black bg-red-500 text-white text-xs uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]";
        }
      };

      clickBtn.addEventListener('click', () => {
        if (pState === 'green') {
          practiceScore++;
          sfx.playTick();
          statText.innerHTML = `Skor: <span class="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 border border-black rounded">+1 (Toplam: ${practiceScore})</span>`;
        } else if (pState === 'yellow') {
          practiceScore = Math.max(0, practiceScore - 1);
          sfx.playFail();
          statText.innerHTML = `Skor: <span class="bg-yellow-100 text-yellow-800 font-bold px-1.5 py-0.5 border border-black rounded">-1 CEZA (Toplam: ${practiceScore})</span>`;
        } else {
          practiceScore = Math.max(0, practiceScore - 2);
          sfx.playExplode();
          statText.innerHTML = `Skor: <span class="bg-red-100 text-red-800 font-bold px-1.5 py-0.5 border border-black rounded">-2 CEZA! (Toplam: ${practiceScore})</span>`;
        }
      });

      const practiceCycleId = setInterval(changePracticeLight, 1300);
      activeIntervals.push(practiceCycleId);
    }
  }

  renderTabContent();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      sfx.playTick();
      clearModalTimers();
      overlay.remove();
    }
  });
}

export function renderEditPlayersModal() {
  const modalId = 'edit-players-modal';
  const existing = document.getElementById(modalId);
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = modalId;
  overlay.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none antialiased text-black";

  const modalBox = document.createElement('div');
  modalBox.className = "w-full max-w-2xl bg-white border-4 border-black p-4 sm:p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative text-black scale-95 opacity-0 animate-scale-up flex flex-col max-h-[90vh]";
  modalBox.style.animation = "scaleUp 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards";

  overlay.appendChild(modalBox);
  appRoot.appendChild(overlay);

  let currentTabId = 1; 
  let activeKeyCaptures: ((e: KeyboardEvent) => void) | null = null;

  function stopKeyCapture() {
    if (activeKeyCaptures) {
      window.removeEventListener('keydown', activeKeyCaptures, { capture: true });
      activeKeyCaptures = null;
    }
  }

  function getCleanKeyLabel(code: string, key: string): string {
    if (code.startsWith('Key') && code.length === 4) {
      return code.substring(3);
    }
    if (code.startsWith('Digit') && code.length === 6) {
      return code.substring(5);
    }
    if (code === 'Space') return 'SPACE';
    if (code === 'Enter') return 'ENTER';
    if (code === 'ArrowUp') return '▲';
    if (code === 'ArrowDown') return '▼';
    if (code === 'ArrowLeft') return '◀';
    if (code === 'ArrowRight') return '▶';
    if (code.startsWith('Numpad')) return code.replace('Numpad', 'NUM ');
    return key.toUpperCase();
  }

  function renderInner() {
    stopKeyCapture();
    
    modalBox.innerHTML = `
      <!-- Decorative Header ribbon -->
      <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 border-2 border-black bg-[#FFD2E8] text-black font-display text-[10px] sm:text-xs tracking-wider uppercase font-black rotate-[-1deg] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
        ⚙️ OYUNCU AYARLARI VE KONTROLLER
      </div>

      <!-- Close Button -->
      <button id="modal-close-btn" class="absolute top-2 right-2 w-8 h-8 rounded-full border-2 border-black bg-[#FF7675] hover:bg-black hover:text-white font-black flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] text-sm select-none z-10">
        ✕
      </button>

      <div class="mt-4 mb-4 select-none text-center">
        <p class="text-xs font-bold text-black/75">
          Buradan her oyuncunun ismini, karakter simgesini ve oynamak için kullanacağı klavye tuşunu ayarlayabilirsiniz.
        </p>
      </div>

      <!-- Tabs (Player Tabs) -->
      <div class="grid grid-cols-5 gap-1.5 mb-4 shrink-0">
        ${state.players.map(p => {
          const isActive = currentTabId === p.id;
          const bgClass = isActive ? p.color : 'bg-zinc-100 hover:bg-zinc-200';
          const fontClass = isActive ? 'font-black text-black' : 'font-bold text-black/60';
          return `
            <button data-player-id="${p.id}" class="tab-btn py-2 px-1 border-2 border-black ${bgClass} ${fontClass} rounded-lg text-xs cursor-pointer select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col sm:flex-row items-center justify-center gap-1">
              <span class="text-xs sm:text-sm select-none">${p.emoji}</span>
              <span class="truncate max-w-[50px] sm:max-w-none text-[10px] sm:text-[11px] select-none">${p.name}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Tab Content Area -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-4 text-left" id="edit-tabs-content">
        <!-- Replaced dynamically inside renderActiveTabContent() -->
      </div>
    `;

    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
      sfx.playTick();
      stopKeyCapture();
      overlay.remove();
      setScreen('lobby');
    });

    modalBox.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = parseInt(btn.getAttribute('data-player-id') || '1', 10);
        if (pId !== currentTabId) {
          sfx.playTick();
          currentTabId = pId;
          renderInner();
        }
      });
    });

    renderActiveTabContent();
  }

  function renderActiveTabContent() {
    const player = state.players.find(p => p.id === currentTabId)!;
    const contentArea = document.getElementById('edit-tabs-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-[11px] font-black uppercase tracking-wider text-black/70">✍️ OYUNCU İSMİ</label>
            <input type="text" id="edit-name-input" class="w-full border-4 border-black p-2.5 font-display font-black text-sm sm:text-base focus:bg-yellow-50 focus:outline-none transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-lg text-black" value="${player.name}" placeholder="Oyuncu Adı..." maxlength="12" />
          </div>

          ${!state.isMobileMode ? `
          <div class="border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center space-y-3 rounded-lg relative overflow-hidden text-black">
            <span class="text-[11px] font-black uppercase tracking-wider text-black/70">⌨️ KLAVYE TETİKLEME TUŞU</span>
            
            <div id="capture-box" class="w-20 h-20 border-4 border-black rounded-xl bg-amber-50 flex items-center justify-center font-display font-black text-2xl sm:text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-none transition-colors duration-150 relative">
              <span id="capture-key-label" class="animate-bounce-short">${player.keyLabel}</span>
            </div>

            <button id="assign-btn" class="px-5 py-2.5 bg-black hover:bg-[#FF7675] hover:text-white border-2 border-black text-white font-black uppercase text-xs cursor-pointer select-none transition-colors w-full rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
              Yeni Tuş Ata ⚙️
            </button>

            <div id="key-warning-text" class="text-[10px] font-bold text-center leading-tight transition-all duration-150 min-h-[20px]">
              Tıklayıp değiştirmek istediğiniz tuşa basın. (Varsayılan: ${player.id === 1 ? 'A' : player.id === 2 ? 'L' : player.id === 3 ? 'Z' : player.id === 4 ? 'M' : 'P'})
            </div>
          </div>
          ` : `
          <div class="border-4 border-dashed border-zinc-350 p-6 bg-zinc-50 rounded-lg text-zinc-500 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative select-none flex flex-col items-center justify-center">
            <span class="text-3xl block mb-2">📱</span>
            <span class="text-xs font-bold leading-relaxed text-center">Mobil Dokunmatik Modu aktif! Klavyeden tuş atanmasına gerek yoktur. Ekrandaki büyük köşe butonlarına basarak direkt oynayabilirsiniz.</span>
          </div>
          `}
        </div>

        <div class="space-y-2">
          <label class="block text-[11px] font-black uppercase tracking-wider text-black/70">👑 KARAKTER SEÇ (SİMGE)</label>
          <div class="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto p-1 border-2 border-black bg-zinc-50 rounded-lg">
            ${AVATARS.map(av => {
              const isSelected = player.emoji === av.emoji;
              const borderClass = isSelected ? 'border-4 border-black bg-yellow-101 scale-[1.01] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-2 border-zinc-300 bg-white opacity-85 hover:opacity-100 hover:border-black';
              const textClass = isSelected ? 'font-black' : 'font-bold text-black/70';
              return `
                <button type="button" data-emoji="${av.emoji}" data-name="${av.name}" class="avatar-select-card p-2 flex items-center gap-2 rounded-lg ${borderClass} cursor-pointer transition-all text-xs text-left select-none text-black">
                  <span class="text-xl shrink-0 select-none">${av.emoji}</span>
                  <div class="leading-none overflow-hidden select-none">
                    <div class="truncate ${textClass} select-none">${av.name}</div>
                    <div class="text-[8px] text-black/50 select-none">${av.description}</div>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    const nameInput = document.getElementById('edit-name-input') as HTMLInputElement;
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        player.name = nameInput.value.trim() || `Oyuncu ${player.id}`;
        savePlayerPersistentData(player);
        
        const tabBtn = modalBox.querySelector(`button[data-player-id="${player.id}"]`);
        if (tabBtn) {
          const textSpan = tabBtn.querySelector('span:last-child');
          if (textSpan) textSpan.textContent = player.name;
        }
      });
    }

    contentArea.querySelectorAll('.avatar-select-card').forEach(card => {
      card.addEventListener('click', () => {
        const selectedEmoji = card.getAttribute('data-emoji') || '';
        const selectedName = card.getAttribute('data-name') || '';
        if (selectedEmoji) {
          sfx.playTick();
          player.emoji = selectedEmoji;
          player.avatarName = selectedName;
          savePlayerPersistentData(player);
          
          renderActiveTabContent();
          
          const tabBtn = modalBox.querySelector(`button[data-player-id="${player.id}"]`);
          if (tabBtn) {
            const emojiSpan = tabBtn.querySelector('span:first-child');
            if (emojiSpan) emojiSpan.textContent = player.emoji;
          }
        }
      });
    });

    const assignBtn = document.getElementById('assign-btn') as HTMLButtonElement;
    const captureBox = document.getElementById('capture-box');
    const captureLabel = document.getElementById('capture-key-label');
    const warningLabel = document.getElementById('key-warning-text');

    if (assignBtn && captureBox && captureLabel && warningLabel) {
      assignBtn.addEventListener('click', () => {
        sfx.playTick();
        
        stopKeyCapture();

        assignBtn.textContent = 'TUŞ BEKLENİYOR... ⌨️';
        assignBtn.disabled = true;
        
        captureBox.classList.remove('bg-amber-50');
        captureBox.classList.add('bg-rose-100', 'animate-pulse', 'border-[#FF7675]');
        captureLabel.textContent = '⏱️';
        
        warningLabel.className = "text-[10px] font-black text-rose-600 text-center leading-tight animate-pulse";
        warningLabel.textContent = "Kaydetmek için bir tuşa basın veya ESC ile çıkın...";

        const handleKeyDownCapture = (e: KeyboardEvent) => {
          e.preventDefault();
          e.stopPropagation();

          const pressedCode = e.code;
          
          if (pressedCode === 'Escape') {
            sfx.playFail();
            stopKeyCapture();
            renderActiveTabContent();
            return;
          }

          const conflictingPlayer = state.players.find(p => p.id !== player.id && p.key === pressedCode);
          if (conflictingPlayer) {
            sfx.playFail();
            warningLabel.textContent = `⚠️ Bu tuş zaten ${conflictingPlayer.name} tarafından kullanılıyor! Başka bir tuş deneyin.`;
            return;
          }

          const parsedLabel = getCleanKeyLabel(pressedCode, e.key);
          
          player.key = pressedCode;
          player.keyLabel = parsedLabel;
          savePlayerPersistentData(player);

          sfx.playTick();
          stopKeyCapture();
          renderActiveTabContent();
        };

        activeKeyCaptures = handleKeyDownCapture;
        window.addEventListener('keydown', handleKeyDownCapture, { capture: true });
      });
    }
  }

  renderInner();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      sfx.playTick();
      stopKeyCapture();
      overlay.remove();
      setScreen('lobby');
    }
  });
}
