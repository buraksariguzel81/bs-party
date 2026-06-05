import { state, appRoot, setScreen, sfx, render, savePlayerPersistentData } from '../globals';
import { SHOP_ITEMS } from '../data';

export function renderCostumeShop() {
  const container = document.createElement('div');
  container.className = "w-full max-w-4xl relative z-10 flex flex-col gap-2 animate-fade-in text-black select-none max-h-screen my-auto justify-center";

  const activePlayer = state.players[0] || state.players.filter(p => p.active)[0];

  if (!activePlayer) {
    setScreen('lobby');
    return;
  }

  if (!activePlayer.unlockedAccessories) {
    activePlayer.unlockedAccessories = [];
  }

  const headerDiv = document.createElement('div');
  headerDiv.className = "bg-white border-2 sm:border-4 border-black p-2 flex items-center justify-between gap-2 shadow-[3px_3px_0px_rgba(0,0,0,1)]";
  headerDiv.innerHTML = `
    <div class="flex items-center gap-1.5">
      <span class="text-lg shrink-0">🛍️</span>
      <div class="text-left">
        <h2 class="text-[10px] sm:text-xs font-display font-black uppercase text-black leading-none">MAĞAZA</h2>
        <p class="text-[8px] text-black/60 font-semibold leading-none mt-1">Oyuncunuza aksesuarlar giydirin!</p>
      </div>
      <div class="ml-2 flex items-center gap-1 bg-[#FFF9C4] border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] text-[9px] font-black shrink-0">
        <span>🪙</span>
        <span>${activePlayer.globalCoins || 0}</span>
      </div>
    </div>
    <div class="flex items-center gap-1.5 shrink-0">
      <button id="shop-lobby-btn" class="px-2 py-1 bg-white hover:bg-neutral-100 text-black border border-black font-black text-[9px] uppercase cursor-pointer shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all leading-none rounded">
        🏠 LOBİ
      </button>
      <button id="shop-arena-btn" class="px-2 py-1 bg-black hover:bg-zinc-800 text-white border border-black font-black text-[9px] uppercase cursor-pointer shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all leading-none rounded">
        🎮 ARENA
      </button>
    </div>
  `;
  container.appendChild(headerDiv);

  const catalogGrid = document.createElement('div');
  catalogGrid.className = "grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 w-full pr-1 max-h-[190px] overflow-y-auto";

  SHOP_ITEMS.forEach(item => {
    const isUnlocked = activePlayer.unlockedAccessories?.includes(item.id);
    const isEquipped = activePlayer.activeAccessory === item.id;
    const canAfford = (activePlayer.globalCoins || 0) >= item.cost;
    
    let actionBtnHTML = '';
    if (isUnlocked) {
      if (isEquipped) {
        actionBtnHTML = `
          <button id="btn-equip-${item.id}" class="w-full py-1 bg-[#FF6B6B] hover:bg-black hover:text-white border border-black font-black text-[8px] uppercase tracking-wider transition-all cursor-pointer shadow-[1px_1px_0_rgba(0,0,0,1)] rounded whitespace-nowrap text-white">
            ❌ ÇIKAR
          </button>
        `;
      } else {
        actionBtnHTML = `
          <button id="btn-equip-${item.id}" class="w-full py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black font-black text-[8px] uppercase tracking-wider transition-all cursor-pointer shadow-[1px_1px_0_rgba(0,0,0,1)] rounded whitespace-nowrap text-black hover:text-white">
            👕 GİY
          </button>
        `;
      }
    } else {
      actionBtnHTML = `
        <button id="btn-buy-${item.id}" ${canAfford ? '' : 'disabled'} class="w-full py-1 ${canAfford ? 'bg-yellow-400 text-black hover:bg-black hover:text-white' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'} border border-black font-black text-[8px] uppercase transition-all cursor-pointer shadow-[1px_1px_0_rgba(0,0,0,1)] flex items-center justify-center gap-0.5 leading-none rounded whitespace-nowrap">
          🪙 ${item.cost} AL
        </button>
      `;
    }

    const card = document.createElement('div');
    card.className = `border-2 border-black bg-white p-2 flex flex-col justify-between shadow-[2px_2px_0_rgba(0,0,0,1)] relative transition-all rounded-md min-h-[95px] ${isEquipped ? 'bg-yellow-50/50 border-yellow-500' : ''}`;
    card.innerHTML = `
      ${isEquipped ? `
        <div class="absolute -top-1 -right-0.5 px-1 py-0.2 text-[6px] font-mono font-black text-white bg-black border border-black uppercase rotate-6 shadow-[0.5px_0.5px_0_rgba(0,0,0,1)]">
          GİYİLDİ
        </div>
      ` : ''}

      <div class="flex items-start gap-1.5 mb-1 text-left">
        <div class="w-7 h-7 rounded border border-black flex items-center justify-center text-sm shrink-0 shadow-[0.5px_0.5px_0_rgba(0,0,0,1)] bg-neutral-50 select-none">
          ${item.emoji}
        </div>
        <div class="min-w-0 flex-1 leading-tight">
          <h4 class="text-[8.5px] font-black text-black uppercase leading-none truncate">${item.name}</h4>
          <span class="inline-block text-[6px] font-mono font-black bg-neutral-100 border border-black px-0.5 text-black/60 scale-90 origin-left uppercase mt-0.5">${item.type}</span>
          <p class="text-[7.5px] text-gray-400 leading-tight block truncate mt-0.5">${item.description}</p>
        </div>
      </div>

      <div class="pt-1 border-t border-dashed border-black/10">
        ${actionBtnHTML}
      </div>
    `;
    catalogGrid.appendChild(card);
  });

  container.appendChild(catalogGrid);
  appRoot.appendChild(container);

  setTimeout(() => {
    document.getElementById('shop-lobby-btn')?.addEventListener('click', () => {
      sfx.playTick();
      setScreen('lobby');
    });

    document.getElementById('shop-arena-btn')?.addEventListener('click', () => {
      sfx.playTick();
      setScreen('gamesHub');
    });

    SHOP_ITEMS.forEach(item => {
      const isUnlocked = activePlayer.unlockedAccessories?.includes(item.id);
      if (isUnlocked) {
        document.getElementById(`btn-equip-${item.id}`)?.addEventListener('click', () => {
          if (activePlayer.activeAccessory === item.id) {
            activePlayer.activeAccessory = null;
          } else {
            activePlayer.activeAccessory = item.id;
          }
          savePlayerPersistentData(activePlayer);
          sfx.playPowerUp();
          render();
        });
      } else {
        document.getElementById(`btn-buy-${item.id}`)?.addEventListener('click', () => {
          if ((activePlayer.globalCoins || 0) >= item.cost) {
            activePlayer.globalCoins = (activePlayer.globalCoins || 0) - item.cost;
            if (!activePlayer.unlockedAccessories) activePlayer.unlockedAccessories = [];
            activePlayer.unlockedAccessories.push(item.id);
            activePlayer.activeAccessory = item.id;
            savePlayerPersistentData(activePlayer);
            sfx.playPowerUp();
            render();
          }
        });
      }
    });

  }, 0);
}
