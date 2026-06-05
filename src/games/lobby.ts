import { state, appRoot, setScreen, lastScreenBeforeShop, sfx, getPlayerAvatarHTML, renderGlobalMuteToggle, loginPlaygamaPlayer, renderTrigger } from '../globals';
import { hasAnyUnclaimedBonus, renderDailyBonusModal, renderHowToPlayModal, renderEditPlayersModal } from './modals';
import { safeLocalStorage } from '../safeStorage';

export function renderLobby() {
  const container = document.createElement('div');
  container.className = "w-full max-w-2xl bg-white border-4 border-black p-6 sm:p-10 text-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative z-10 flex flex-col items-center space-y-8 animate-fade-in my-auto";
  
  const bridge = (window as any).playgamaBridge;
  let playgamaConnectorHTML = '';
  
  if (bridge) {
    const isAuth = bridge.player && bridge.player.isAuthorized;
    if (isAuth) {
      const name = bridge.player.name || "Playgama Oyuncusu";
      const avatar = bridge.player.avatar || bridge.player.avatarUrl || "";
      playgamaConnectorHTML = `
        <!-- Connected Account Card -->
        <div class="w-full bg-[#E5F6FD] border-4 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rotate-[-0.5deg]">
          <div class="flex items-center gap-3">
            <div class="relative w-12 h-12 rounded-full border-2 border-black bg-white overflow-hidden flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              ${avatar ? `<img src="${avatar}" class="w-full h-full object-cover" referrerpolicy="no-referrer" />` : `<span class="text-xl flex items-center justify-center w-full h-full bg-[#A29BFE]">👤</span>`}
            </div>
            <div class="text-left">
              <div class="text-[10px] font-black uppercase text-blue-700 tracking-wider">Playgama Bulut Kaydı Aktif</div>
              <div class="text-sm font-black truncate max-w-[180px] sm:max-w-xs">${name} (Oyuncu 1)</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="bg-blue-500 border-2 border-black text-white text-[10px] font-black px-2 py-1 rotate-[2deg] shadow-[1px_1px_0_rgba(0,0,0,1)] uppercase">BAĞLANDI</span>
          </div>
        </div>
      `;
    } else {
      playgamaConnectorHTML = `
        <!-- Unconnected Account Card -->
        <div class="w-full bg-[#FFF9C4] border-4 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rotate-[0.5deg]">
          <div class="text-left space-y-0.5 max-w-sm">
            <h4 class="text-[10px] font-black uppercase text-black/60 tracking-wider">Playgama Bulut Servisleri</h4>
            <div class="text-xs font-bold text-black/80">Altınlarını, özelleştirmelerini buluta kaydedip, resmi avatarını kullanmak için hesabını bağla!</div>
          </div>
          <button id="playgama-connect-btn" class="px-4 py-2 bg-[#A29BFE] hover:bg-black hover:text-white border-2 border-black text-black font-black font-display text-[11px] uppercase cursor-pointer transition-all transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
            Giriş Yap ⚡
          </button>
        </div>
      `;
    }
  }

  container.innerHTML = `
    <!-- Top Decorative Header -->
    <div class="flex items-center gap-2 px-4 py-2 border-2 border-black bg-[#4ECDC4] text-black font-display text-xs sm:text-sm tracking-wider uppercase font-black rotate-[-1deg] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      ⚡ ÇILGIN PARTY ARENASI 🏁
    </div>
 
    <!-- Main Title -->
    <div class="relative space-y-4 w-full flex flex-col items-center">
      <h1 class="text-6xl sm:text-7xl font-display font-black tracking-tighter text-black uppercase select-none drop-shadow-[4px_4px_0_#A29BFE] animate-bounce-short">
        BS PARTY
      </h1>
      <div class="h-1 bg-black w-24 mx-auto"></div>
      <p class="text-black font-bold max-w-md mx-auto text-sm sm:text-base">
        Aynı klavyede veya ekranda arkadaşlarınla kapışabileceğin çılgın, hızlı mini oyun dünyasına katıl!
      </p>
      
      <button id="lobby-how-to-play-btn" class="mt-1 text-[11px] font-black uppercase bg-[#FFD2E8] text-black border-2 border-black py-1.5 px-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-white cursor-pointer w-fit flex items-center gap-1.5 transition-all select-none">
        📖 OYUNLARIN KURAL REHBERİ (NASIL OYNANIR?)
      </button>
    </div>
 
    <!-- Play Button -->
    <div class="w-full max-w-sm space-y-2 mx-auto">
      <button id="lobby-play-btn" class="w-full py-4 px-4 bg-[#55EFC4] text-black hover:bg-black hover:text-white border-4 border-black font-display font-black text-lg sm:text-xl uppercase cursor-pointer rounded-none select-none transition-all duration-200 shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_rgba(0,0,0,1)] flex items-center justify-center gap-3">
        🎮 OYUNA GİR 🚀
      </button>
      <div class="grid grid-cols-2 gap-2 w-full pt-1">
        <button id="lobby-shop-btn" class="py-2.5 px-3 bg-[#A29BFE] hover:bg-black hover:text-white text-black font-black border-2 border-black uppercase text-[11px] cursor-pointer shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all leading-none rounded select-none">
          🛍️ MAĞAZA
        </button>
        <button id="lobby-achievements-btn" class="py-2.5 px-3 bg-[#FF7675] hover:bg-black hover:text-white text-white font-black border-2 border-black uppercase text-[11px] cursor-pointer shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all leading-none rounded select-none">
          🏆 BAŞARIMLAR
        </button>
      </div>
    </div>

    <!-- Device Mode Select (PC vs Mobile) -->
    <div class="w-full max-w-sm space-y-2 mx-auto pt-1">
      <label class="block text-black font-display text-[11px] tracking-widest uppercase font-black bg-black text-white py-0.5 px-2">CİHAZ / KONTROL AYARI</label>
      <div class="grid grid-cols-2 gap-2.5 select-none">
        <button id="devicemode-pc" class="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${!state.isMobileMode ? 'bg-[#55EFC4] font-black' : 'bg-white font-bold text-black/60'}">
          <div class="text-[11px] font-display font-black">💻 Bilgisayar (PC)</div>
          <div class="text-[8px] uppercase font-black tracking-wider leading-none mt-0.5 ${!state.isMobileMode ? 'text-black/80' : 'text-black/40'}">Klavye Tuşları</div>
        </button>
        <button id="devicemode-mobile" class="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${state.isMobileMode ? 'bg-[#81ECEC] font-black' : 'bg-white font-bold text-black/60'}">
          <div class="text-[11px] font-display font-black">📱 Mobil Cihaz</div>
          <div class="text-[8px] uppercase font-black tracking-wider leading-none mt-0.5 ${state.isMobileMode ? 'text-black/80' : 'text-black/40'}">Dokunmatik Mod</div>
        </button>
      </div>
    </div>

    <!-- Tournament Mode Select -->
    <div class="w-full max-w-sm space-y-2 mx-auto pt-1">
      <label class="block text-black font-display text-[11px] tracking-widest uppercase font-black bg-black text-white py-0.5 px-2">TURNUVA MODU SEÇİN</label>
      <div class="grid grid-cols-2 gap-2.5 select-none hover:text-black">
        <button id="tmode-standard" class="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${!state.isEliminationMode ? 'bg-[#FFEAA7] font-black' : 'bg-white font-bold'}">
          <div class="text-[11px] font-display font-black">🏆 Standart Turnuva</div>
          <div class="text-[8px] uppercase text-black/65 font-black tracking-wider leading-none mt-0.5">Puan Toplama</div>
        </button>
        <button id="tmode-elimination" class="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${state.isEliminationMode ? 'bg-[#FF7675] text-white font-black animate-pulse' : 'bg-white text-black font-bold'}">
          <div class="text-[11px] font-display font-black">🔥 Elemeli Nakavt</div>
          <div class="text-[8px] uppercase ${state.isEliminationMode ? 'text-white/85' : 'text-black/65'} font-black tracking-wider leading-none mt-0.5">Kazanan Tur Atlar</div>
        </button>
      </div>
    </div>

    <!-- Customized Character & Control settings Card -->
    <div class="w-full bg-[#FFEAA7] border-4 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rotate-[0.5deg]">
      <div class="text-left space-y-0.5 max-w-sm select-none">
        <h4 class="text-[10px] font-black uppercase text-black/60 tracking-wider">⚙️ Oyuncu Özelleştirme & Tuş Ayarları</h4>
        <div class="text-xs font-bold text-black/85 leading-tight">Oyuncu isimlerini değiştirebilir, karakter simgelerini özelleştirebilir ve klavye tuşlarını dilediğiniz gibi atayabilirsiniz!</div>
      </div>
      <button id="lobby-edit-players-btn" class="w-full sm:w-auto px-5 py-2.5 bg-[#FF7675] hover:bg-black hover:text-white border-2 border-black text-white font-black font-display text-[11px] uppercase cursor-pointer transition-all transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none whitespace-nowrap">
        OYUNCULARI DÜZENLE ⚙️
      </button>
    </div>

    ${playgamaConnectorHTML}

    <!-- Daily Reward Card -->
    <div class="w-full bg-[#EBFBEE] border-4 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rotate-[0.5deg] relative overflow-hidden">
      <div class="flex items-center gap-3">
        <div class="relative flex items-center justify-center">
          <span class="text-3xl animate-bounce-short">🎁</span>
          ${hasAnyUnclaimedBonus() ? `<span class="absolute -top-1 -right-0.5 w-3 h-3 bg-red-500 border-2 border-black rounded-full animate-ping"></span><span class="absolute -top-1 -right-0.5 w-3 h-3 bg-red-500 border-2 border-black rounded-full"></span>` : ''}
        </div>
        <div class="text-left select-none">
          <div class="text-[10px] font-black uppercase text-emerald-800 tracking-wider">HER GÜN BEDAVA ALTIN COIN! 📅</div>
          <div class="text-xs font-bold text-black/85 leading-tight">Günlük Giriş Bonusu aktif. Hemen bugünün ödülünü topla!</div>
        </div>
      </div>
      <button id="lobby-daily-bonus-btn" class="px-5 py-2.5 bg-yellow-400 hover:bg-black hover:text-white border-2 border-black text-black font-black font-display text-[11px] uppercase cursor-pointer transition-all transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none whitespace-nowrap">
        Ödülü Al 🪙
      </button>
    </div>
 
    <!-- Instruction Panel -->
    <div class="w-full bg-[#FDCB6E] border-4 border-black p-5 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
      <div class="space-y-2">
        <span class="font-display font-black text-sm tracking-wider flex items-center gap-1.5 uppercase">⌨️ KLAVYE KONTROLLERİ</span>
        ${!state.isMobileMode ? `
        <ul class="space-y-2 font-mono leading-none">
          ${state.players.filter(p => p.active).map(p => `
            <li class="flex items-center gap-1.5 select-none font-bold">
              <span>${p.emoji}</span> 
              <span>${p.name}:</span> 
              <strong class="bg-white border-2 border-black px-1.5 py-0.5 text-[11px] rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">${p.keyLabel}</strong> tuşu
            </li>
          `).join('')}
        </ul>
        ` : `
        <div class="text-xs font-bold font-sans text-black/85 leading-relaxed bg-white/40 border-2 border-black/20 p-2.5">
          📱 Mobil Dokunmatik Mod aktif! Oyuncuların ekrandaki dev köşelerden oluşan renkli butonları kullanarak kontrol yapması yeterlidir. Klavye tuşları atanmamıştır.
        </div>
        `}
      </div>
 
      <div class="space-y-2 border-t sm:border-t-0 sm:border-l border-black pt-2 sm:pt-0 sm:pl-4">
        <span class="font-display font-black text-sm tracking-wider flex items-center gap-1.5 uppercase">📱 MOBİL KONTROLLER</span>
        <p class="leading-relaxed font-bold text-black/80">
          Akıllı telefon ve tabletlerde ekranda belirecek devasa renkli köşe butonlarına basarak kusursuz bir mobil parti yaşayabilirsiniz!
        </p>
      </div>
    </div>
  `;
 
  appRoot.appendChild(container);
 
  // Setup Event Listeners
  const playBtn = document.getElementById('lobby-play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      sfx.playPowerUp();
      setScreen('charSelect');
    });
  }

  document.getElementById('lobby-shop-btn')?.addEventListener('click', () => {
    sfx.playTick();
    lastScreenBeforeShop.value = 'lobby';
    setScreen('costumeShop');
  });

  document.getElementById('lobby-achievements-btn')?.addEventListener('click', () => {
    sfx.playTick();
    setScreen('achievements');
  });

  // Setup Device Select Listeners
  const pcModeBtn = document.getElementById('devicemode-pc');
  const mobileModeBtn = document.getElementById('devicemode-mobile');
  if (pcModeBtn && mobileModeBtn) {
    pcModeBtn.addEventListener('click', () => {
      sfx.playTick();
      state.isMobileMode = false;
      safeLocalStorage.setItem('bs_party_is_mobile_mode', 'false');
      renderTrigger(); // Redraw instantly
    });
    mobileModeBtn.addEventListener('click', () => {
      sfx.playTick();
      state.isMobileMode = true;
      safeLocalStorage.setItem('bs_party_is_mobile_mode', 'true');
      renderTrigger(); // Redraw instantly
    });
  }

  const stdBtn = document.getElementById('tmode-standard');
  const elimBtn = document.getElementById('tmode-elimination');
  if (stdBtn && elimBtn) {
    stdBtn.addEventListener('click', () => {
      sfx.playTick();
      state.isEliminationMode = false;
      stdBtn.className = "py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#FFEAA7] font-black";
      elimBtn.className = "py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white font-bold";
      
      const elimSub = elimBtn.querySelector('div')?.nextElementSibling;
      if (elimSub) {
        elimSub.className = "text-[8px] uppercase text-black/65 font-black tracking-wider leading-none mt-0.5";
      }
    });

    elimBtn.addEventListener('click', () => {
      sfx.playTick();
      state.isEliminationMode = true;
      stdBtn.className = "py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white font-bold";
      elimBtn.className = "py-2 px-1 border-2 border-black text-white cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#FF7675] font-black animate-pulse";
      
      const elimSub = elimBtn.querySelector('div')?.nextElementSibling;
      if (elimSub) {
        elimSub.className = "text-[8px] uppercase text-white/85 font-black tracking-wider leading-none mt-0.5";
      }
    });
  }

  const connectBtn = document.getElementById('playgama-connect-btn');
  if (connectBtn) {
    connectBtn.addEventListener('click', () => {
      loginPlaygamaPlayer();
    });
  }

  const lobbyDailyBonusBtn = document.getElementById('lobby-daily-bonus-btn');
  if (lobbyDailyBonusBtn) {
    lobbyDailyBonusBtn.addEventListener('click', () => {
      sfx.playTick();
      renderDailyBonusModal();
    });
  }

  const lobbyHowBtn = document.getElementById('lobby-how-to-play-btn');
  if (lobbyHowBtn) {
    lobbyHowBtn.addEventListener('click', () => {
      sfx.playTick();
      renderHowToPlayModal();
    });
  }

  const lobbyEditBtn = document.getElementById('lobby-edit-players-btn');
  if (lobbyEditBtn) {
    lobbyEditBtn.addEventListener('click', () => {
      sfx.playTick();
      renderEditPlayersModal();
    });
  }
}
