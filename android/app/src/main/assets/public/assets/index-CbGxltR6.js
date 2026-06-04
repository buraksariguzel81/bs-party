(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const p of s)if(p.type==="childList")for(const u of p.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&n(u)}).observe(document,{childList:!0,subtree:!0});function t(s){const p={};return s.integrity&&(p.integrity=s.integrity),s.referrerPolicy&&(p.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?p.credentials="include":s.crossOrigin==="anonymous"?p.credentials="omit":p.credentials="same-origin",p}function n(s){if(s.ep)return;s.ep=!0;const p=t(s);fetch(s.href,p)}})();/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */function V(e){const a=window.playgamaBridge;if(a&&a.storage)try{const n=(typeof a.storage.isSupported=="function"?a.storage.isSupported("platform_internal"):!1)?"platform_internal":"local_storage";return a.storage.get(e,n).then(s=>s&&typeof s=="object"&&s[e]!==void 0?s[e]:s||null).catch(s=>(console.warn(`Playgama storage.get for ${e} failed:`,s),null))}catch(t){console.warn("Playgama storage.get invocation failed",t)}return Promise.resolve(null)}function G(e,a){const t=window.playgamaBridge;if(t&&t.storage)try{const s=(typeof t.storage.isSupported=="function"?t.storage.isSupported("platform_internal"):!1)?"platform_internal":"local_storage";return t.storage.set(e,a,s).catch(p=>(console.warn("Playgama storage.set with type failed, trying without type:",p),t.storage.set(e,a))).then(()=>{}).catch(p=>{console.warn(`Playgama storage.set completely failed for key ${e}:`,p)})}catch(n){console.warn("Playgama storage.set invocation failed",n)}return Promise.resolve()}function me(){const e=window.playgamaBridge;if(e&&e.player&&e.player.isAuthorized){const a=e.player.name||"Playgama Oyuncusu",t=e.player.avatar||e.player.avatarUrl||null;if(typeof i<"u"&&i.players&&i.players[0]){const n=i.players[0];n.name=a,t&&(n.customImage=t),z(n)}}}function ue(){const e=window.playgamaBridge;if(!e||!e.storage||typeof i>"u"||!i.players)return;console.log("🔄 Playgama Storage: Fetching cloud saves for all players...");const a=i.players.map(async t=>{const n=`bs_party_custom_image_${t.id}`,s=`bs_party_global_coins_${t.id}`,p=`bs_party_unlocked_${t.id}`,u=`bs_party_active_acc_${t.id}`,d=`bs_party_last_reward_claim_${t.id}`,w=`bs_party_reward_streak_${t.id}`,y=await V(n),x=await V(s),k=await V(p),o=await V(u),f=await V(d),b=await V(w);let m=!1;if(y!==null&&y!==""&&(t.customImage=y,localStorage.setItem(n,y),m=!0),x!==null&&x!==""){const c=parseInt(x,10);isNaN(c)||(t.globalCoins=c,localStorage.setItem(s,x),m=!0)}if(k!==null&&k!=="")try{t.unlockedAccessories=JSON.parse(k),localStorage.setItem(p,k),m=!0}catch(c){console.warn("Failed to parse cloud unlocked json",c)}if(o!==null&&(t.activeAccessory=o||null,o?localStorage.setItem(u,o):localStorage.removeItem(u),m=!0),f!==null&&(t.lastRewardClaimDate=f||null,f?localStorage.setItem(d,f):localStorage.removeItem(d),m=!0),b!==null&&b!==""){const c=parseInt(b,10);isNaN(c)||(t.rewardStreak=c,localStorage.setItem(w,b),m=!0)}return m});Promise.all(a).then(t=>{t.some(s=>s===!0)&&(console.log("✅ Playgama Storage: Successfully synchronized cloud save with local state."),K())})}function ve(){const e=window.playgamaBridge;e&&e.player&&(typeof e.player.authorize=="function"?e.player.authorize().then(()=>{console.log("✅ Playgama Player authorized successfully."),me(),ue(),K()}).catch(a=>{console.error("❌ Playgama Player auth failed:",a)}):console.warn("bridge.player.authorize is not a function"))}function de(){const e=window.playgamaBridge;e?(console.log("🎮 Playgama SDK detected, initializing..."),e.initialize().then(()=>{console.log("✅ Playgama SDK Initialized successfully.");try{e.game.loadingComplete()}catch(a){console.warn("loadingComplete call failed",a)}try{me(),ue()}catch(a){console.warn("Playgama player/storage sync failed",a)}try{e.game.on("pause",()=>{console.log("⏸ Playgama: GAME PAUSE received (Ad started or Tab hidden)"),window.isGameSuspendedBySDK=!0}),e.game.on("resume",()=>{console.log("▶ Playgama: GAME RESUME received (Ad finished)"),window.isGameSuspendedBySDK=!1})}catch(a){console.warn("Failed to subscribe to pause/resume events",a)}}).catch(a=>{console.error("❌ Playgama SDK initialization failed:",a)})):console.log("ℹ️ Playgama SDK not detected (Preview / Local Sandbox). Mock ready.")}function pe(){const e=window.playgamaBridge;return e&&e.advertisement?(console.log("🎬 Triggering Playgama Interstitial Ad..."),e.advertisement.showInterstitial().then(()=>{console.log("✅ Interstitial Ad finished successfully.")}).catch(a=>{console.warn("⚠️ Interstitial Ad failed or blocked:",a)})):(console.log("🎬 [Sandbox] Playgama Interstitial Ad action simulated."),Promise.resolve())}document.readyState==="complete"?de():window.addEventListener("load",de);const J=[{id:"crown",name:"Şampiyon Tacı",emoji:"👑",cost:15,type:"hat",description:"Hakiki bir lider için altın taç!"},{id:"glasses",name:"Havalı Gözlük",emoji:"🕶️",cost:8,type:"glasses",description:"Aşırı derece karizma kazandırır."},{id:"sheriff",name:"Şerif Şapkası",emoji:"🤠",cost:12,type:"hat",description:"Kasabanın yeni kanun koruyucusu!"},{id:"wizard",name:"Sihirbaz Şapkası",emoji:"🎩",cost:20,type:"hat",description:"Rakipleri büyülemek isteyenlere."},{id:"pink_bow",name:"Sevimli Fiyonk",emoji:"🎀",cost:5,type:"badge",description:"Ekstra tatlılık katmak isteyenlere."},{id:"headphones",name:"Oyuncu Kulaklığı",emoji:"🎧",cost:18,type:"glasses",description:"Yüksek kaliteli ses ve odaklanma."},{id:"horn",name:"Tekboynuz Boynuzu",emoji:"🦄",cost:22,type:"hat",description:"Efsanevi mitolojik bir güç."},{id:"ninja",name:"Siyah Ninja Maskesi",emoji:"🥷",cost:25,type:"mask",description:"Görünmez ol, sessizce oyna!"},{id:"angel",name:"Melek Halesi",emoji:"😇",cost:30,type:"hat",description:"Altın renkli saf melek parıltısı."}],Z=[{id:"balloon_wins_5",name:"Balon Şampiyonu",description:"Balon şişirme oyununda 5 kez zafer kazan.",badgeEmoji:"🎈🏆",category:"balloon"},{id:"perfect_memory",name:"Kusursuz Akıl",description:"Hafıza kartı elinde en az 2 eşleşme bulurken 0 hata (mismatch) yap.",badgeEmoji:"🧠💯",category:"memory"},{id:"speed_demon_220",name:"Işık Hızı",description:"Reaksiyon oyununda ganimeti 250ms altı sürede kap.",badgeEmoji:"⚡🚀",category:"reaction"},{id:"streak_3",name:"Sadık Oyuncu",description:"Günlük girişte en az 3 günlük bir seri (streak) yakala.",badgeEmoji:"🔥📆",category:"streak"},{id:"coin_lord_100",name:"Zenginlik Simgesi",description:"Toplamda 100 altın coine (küresek birikim) ulaş.",badgeEmoji:"💎💰",category:"rich"},{id:"collector_3",name:"Moda İkonu",description:"Kostüm Mağazasında en az 3 aksesuar aç.",badgeEmoji:"👑🕶️",category:"shop"}];let ae=1,re="gamesHub";function ye(e){try{const a=localStorage.getItem(`bs_party_custom_image_${e}`),t=localStorage.getItem(`bs_party_global_coins_${e}`),n=localStorage.getItem(`bs_party_unlocked_${e}`),s=localStorage.getItem(`bs_party_active_acc_${e}`),p=localStorage.getItem(`bs_party_last_reward_claim_${e}`),u=localStorage.getItem(`bs_party_reward_streak_${e}`),d=localStorage.getItem(`bs_party_unlocked_achiers_${e}`),w=localStorage.getItem(`bs_party_balloon_wins_${e}`),y=localStorage.getItem(`bs_party_player_name_${e}`),x=localStorage.getItem(`bs_party_player_emoji_${e}`),k=localStorage.getItem(`bs_party_player_avatar_name_${e}`),o=localStorage.getItem(`bs_party_player_key_${e}`),f=localStorage.getItem(`bs_party_player_key_label_${e}`),b=t?parseInt(t,10):0,m=n?JSON.parse(n):[],c=u?parseInt(u,10):0,h=d?JSON.parse(d):[],A=w?parseInt(w,10):0;return{customImage:a,globalCoins:b,unlockedAccessories:m,activeAccessory:s,lastRewardClaimDate:p,rewardStreak:c,unlockedAchievements:h,balloonWinsCount:A,name:y,emoji:x,avatarName:k,key:o,keyLabel:f}}catch(a){return console.error("Local storage failed to load player data",a),{customImage:null,globalCoins:0,unlockedAccessories:[],activeAccessory:null,lastRewardClaimDate:null,rewardStreak:0,unlockedAchievements:[],balloonWinsCount:0,name:null,emoji:null,avatarName:null,key:null,keyLabel:null}}}function z(e){var a,t;try{const n=`bs_party_custom_image_${e.id}`,s=`bs_party_global_coins_${e.id}`,p=`bs_party_unlocked_${e.id}`,u=`bs_party_active_acc_${e.id}`,d=`bs_party_last_reward_claim_${e.id}`,w=`bs_party_reward_streak_${e.id}`,y=`bs_party_unlocked_achiers_${e.id}`,x=`bs_party_balloon_wins_${e.id}`;if(e.customImage?localStorage.setItem(n,e.customImage):localStorage.removeItem(n),localStorage.setItem(s,(e.globalCoins||0).toString()),localStorage.setItem(p,JSON.stringify(e.unlockedAccessories||[])),e.activeAccessory?localStorage.setItem(u,e.activeAccessory):localStorage.removeItem(u),e.lastRewardClaimDate?localStorage.setItem(d,e.lastRewardClaimDate):localStorage.removeItem(d),localStorage.setItem(w,(e.rewardStreak||0).toString()),localStorage.setItem(y,JSON.stringify(e.unlockedAchievements||[])),localStorage.setItem(x,(e.balloonWinsCount||0).toString()),localStorage.setItem(`bs_party_player_name_${e.id}`,e.name),localStorage.setItem(`bs_party_player_emoji_${e.id}`,e.emoji),e.avatarName&&localStorage.setItem(`bs_party_player_avatar_name_${e.id}`,e.avatarName),localStorage.setItem(`bs_party_player_key_${e.id}`,e.key),localStorage.setItem(`bs_party_player_key_label_${e.id}`,e.keyLabel),(e.globalCoins||0)>=100&&!((a=e.unlockedAchievements)!=null&&a.includes("coin_lord_100"))){e.unlockedAchievements||(e.unlockedAchievements=[]),e.unlockedAchievements.push("coin_lord_100"),localStorage.setItem(y,JSON.stringify(e.unlockedAchievements));const o=Z.find(f=>f.id==="coin_lord_100");o&&setTimeout(()=>le(e,o),100)}if(e.unlockedAccessories&&e.unlockedAccessories.length>=3&&!((t=e.unlockedAchievements)!=null&&t.includes("collector_3"))){e.unlockedAchievements||(e.unlockedAchievements=[]),e.unlockedAchievements.push("collector_3"),localStorage.setItem(y,JSON.stringify(e.unlockedAchievements));const o=Z.find(f=>f.id==="collector_3");o&&setTimeout(()=>le(e,o),150)}const k=window.playgamaBridge;k&&k.storage&&(e.customImage?G(n,e.customImage):G(n,""),G(s,(e.globalCoins||0).toString()),G(p,JSON.stringify(e.unlockedAccessories||[])),G(u,e.activeAccessory||""),G(d,e.lastRewardClaimDate||""),G(w,(e.rewardStreak||0).toString()),G(y,JSON.stringify(e.unlockedAchievements||[])),G(x,(e.balloonWinsCount||0).toString())),we()}catch(n){console.error("Failed to save player persistent data",n)}}let be=0;function we(){const e=Date.now();if(e-be<3e3)return;be=e;const a=document.getElementById("saved-toast-notification");a&&a.remove();const t=document.getElementById("saved-toast-container")||(()=>{const s=document.createElement("div");return s.id="saved-toast-container",s.className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-[240px] pointer-events-none select-none font-sans",document.body.appendChild(s),s})(),n=document.createElement("div");n.id="saved-toast-notification",n.className="pointer-events-auto bg-white border-2 border-black py-2 px-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 relative overflow-hidden animate-fade-in text-black",n.innerHTML=`
    <div class="absolute left-0 top-0 bottom-0 w-1 bg-[#2ECC71]"></div>
    <span class="text-xs ml-1 select-none">💾</span>
    <div class="flex flex-col leading-none">
      <span class="text-[10px] font-black uppercase text-black">Veriler Kaydedildi</span>
    </div>
  `,t.appendChild(n),setTimeout(()=>{n.style.transition="all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.25)",n.style.opacity="0",n.style.transform="translateY(-15px) scale(0.9)",setTimeout(()=>{n.remove()},300)},2200)}function le(e,a){const t=document.getElementById("achievement-toast-container")||(()=>{const s=document.createElement("div");return s.id="achievement-toast-container",s.className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none select-none font-sans",document.body.appendChild(s),s})(),n=document.createElement("div");if(n.className="pointer-events-auto bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3.5 relative overflow-hidden shrink-0",n.style.animation="slideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.25) forwards",!document.getElementById("achievement-slide-styles")){const s=document.createElement("style");s.id="achievement-slide-styles",s.innerHTML=`
      @keyframes slideIn {
        0% { transform: translateY(100px) scale(0.9); opacity: 0; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }
      @keyframes slideOut {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(50px) scale(0.9); opacity: 0; }
      }
    `,document.head.appendChild(s)}n.innerHTML=`
    <div class="absolute top-0 left-0 right-0 h-1.5 ${e.color} border-b-2 border-black"></div>
    <div class="w-12 h-12 flex items-center justify-center text-3xl shrink-0 bg-yellow-105 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
      ${a.badgeEmoji}
    </div>
    <div class="flex-1 text-left min-w-0 pr-2">
      <span class="block text-[8px] font-mono font-black tracking-wider text-black/50">${e.name} BAŞARI KAZANDI!</span>
      <h4 class="font-display font-black text-xs text-black uppercase tracking-tight truncate">${a.name}</h4>
      <p class="text-[9px] font-bold text-black/75 truncate mt-0.5">${a.description}</p>
    </div>
    <button class="text-xs font-black p-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black rounded-none cursor-pointer text-black" onclick="this.parentElement.remove()">
      ✕
    </button>
  `,t.appendChild(n);try{_.playPowerUp()}catch(s){console.warn("Could not play custom audio banner sfx",s)}setTimeout(()=>{n.style.animation="slideOut 0.3s cubic-bezier(0.175, 0.885, 0.32, 1) forwards",setTimeout(()=>{n.remove()},300)},5e3)}function oe(e,a){if(e.unlockedAchievements||(e.unlockedAchievements=[]),e.unlockedAchievements.includes(a))return;const t=Z.find(n=>n.id===a);t&&(e.unlockedAchievements.push(a),z(e),le(e,t))}function _e(e,a,t){const n=new FileReader;n.onload=s=>{var u;const p=new Image;p.onload=()=>{var f;const d=document.createElement("canvas"),w=120,y=120;let x=p.width,k=p.height;x>k?x>w&&(k*=w/x,x=w):k>y&&(x*=y/k,k=y),d.width=x,d.height=k;const o=d.getContext("2d");if(o){o.drawImage(p,0,0,x,k);const b=d.toDataURL("image/jpeg",.82);t(b)}else t((f=s.target)==null?void 0:f.result)},p.src=(u=s.target)==null?void 0:u.result},n.readAsDataURL(a)}function X(e){const a={};if(!i.isEliminationMode)return a;const t=e.length;return e.forEach((n,s)=>{let p="advanced",u="🟢 ÜST TURA ÇIKTI",d="bg-emerald-100 text-emerald-800 border-emerald-500";t===4||t===3?s>=2&&(p="eliminated",u="❌ ELENDİ",d="bg-red-100 text-red-800 border-red-500 line-through"):t===2&&(s===0?(p="champion",u="👑 BÜYÜK ŞAMPİYON",d="bg-yellow-100 text-yellow-850 border-yellow-500 animate-bounce"):(p="eliminated",u="❌ ELENDİ",d="bg-red-100 text-red-850 border-red-500 line-through")),a[n.id]={status:p,label:u,colorClass:d}}),a}function O(e,a="w-16 h-16 text-3xl"){const t=a.includes("w-24")||a.includes("w-32")||a.includes("w-20");let n="";e.customImage?n=`<img src="${e.customImage}" class="w-full h-full object-cover rounded-full" alt="avatar" />`:n=`<span class="select-none font-sans font-black">${e.emoji}</span>`;let s="";if(e.activeAccessory){const d=J.find(w=>w.id===e.activeAccessory);if(d){let w="";d.type==="hat"?w=`absolute ${t?"-top-6":"-top-4.5"} left-1/2 -translate-x-1/2 ${t?"text-4.5xl":"text-2.5xl"} select-none pointer-events-none drop-shadow-[2px_2px_0_rgba(0,0,0,1)] z-10`:d.type==="glasses"?w=`absolute ${t?"top-6.5":"top-3"} left-1/2 -translate-x-1/2 ${t?"text-4xl":"text-xl"} select-none pointer-events-none z-10`:d.type==="mask"?w=`absolute ${t?"top-8.5":"top-4.5"} left-1/2 -translate-x-1/2 ${t?"text-4.5xl":"text-2xl"} select-none pointer-events-none z-10`:w=`absolute ${t?"-top-5":"-top-3"} left-1/2 -translate-x-1/2 ${t?"text-3xl":"text-xl"} select-none pointer-events-none z-10`,s=`<span class="${w}">${d.emoji}</span>`}}const u=a.includes("bg-")?"":e.color;return`
    <div class="relative ${a} ${u} rounded-full border-4 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-visible shrink-0 select-none">
      ${n}
      ${s}
    </div>
  `}const W=[{name:"Ateş Topu",emoji:"🔥",description:"Hızlı ve yakıcı!"},{name:"Su Damlası",emoji:"💧",description:"Sakin ama dalgalı!"},{name:"Rüzgar Gülü",emoji:"🌀",description:"Tahmin edilemez esinti!"},{name:"Yıldırım",emoji:"⚡",description:"Göz açıp kapayıncaya kadar!"},{name:"Orman Şamanı",emoji:"🌿",description:"Doğanın öfkesi!"},{name:"Altın Taç",emoji:"👑",description:"Asil bir şampiyon!"},{name:"Demir Kalkan",emoji:"🛡️",description:"Yıkılmaz savunma!"},{name:"Uzay Roketi",emoji:"🚀",description:"Sınırların ötesinde!"}];class Ee{constructor(){this.ctx=null,this.isMuted=!1,this.isMuted=localStorage.getItem("sfx_global_muted")==="true"}toggleMute(){return this.isMuted=!this.isMuted,localStorage.setItem("sfx_global_muted",this.isMuted?"true":"false"),this.isMuted}isSoundMuted(){return this.isMuted}init(){this.ctx||(this.ctx=new(window.AudioContext||window.webkitAudioContext)),this.ctx.state==="suspended"&&this.ctx.resume()}playTick(){if(this.isMuted||(this.init(),!this.ctx))return;const a=this.ctx.createOscillator(),t=this.ctx.createGain();a.type="sine",a.frequency.setValueAtTime(300,this.ctx.currentTime),a.frequency.exponentialRampToValueAtTime(150,this.ctx.currentTime+.08),t.gain.setValueAtTime(.08,this.ctx.currentTime),t.gain.linearRampToValueAtTime(.01,this.ctx.currentTime+.08),a.connect(t),t.connect(this.ctx.destination),a.start(),a.stop(this.ctx.currentTime+.08)}playPop(){if(this.isMuted||(this.init(),!this.ctx))return;const a=this.ctx.currentTime,t=this.ctx.createOscillator(),n=this.ctx.createGain();t.type="triangle",t.frequency.setValueAtTime(180,a),t.frequency.exponentialRampToValueAtTime(900,a+.12),n.gain.setValueAtTime(.15,a),n.gain.linearRampToValueAtTime(.01,a+.12),t.connect(n),n.connect(this.ctx.destination),t.start(),t.stop(a+.12)}playSuccess(){if(this.isMuted||(this.init(),!this.ctx))return;const a=this.ctx.currentTime;[523.25,659.25,783.99].forEach((t,n)=>{if(!this.ctx)return;const s=this.ctx.createOscillator(),p=this.ctx.createGain();s.type="sine",s.frequency.setValueAtTime(t,a+n*.06),p.gain.setValueAtTime(.1,a+n*.06),p.gain.linearRampToValueAtTime(.01,a+n*.06+.25),s.connect(p),p.connect(this.ctx.destination),s.start(a+n*.06),s.stop(a+n*.06+.25)})}playFail(){if(this.isMuted||(this.init(),!this.ctx))return;const a=this.ctx.currentTime,t=this.ctx.createOscillator(),n=this.ctx.createGain();t.type="sawtooth",t.frequency.setValueAtTime(200,a),t.frequency.linearRampToValueAtTime(80,a+.25),n.gain.setValueAtTime(.12,a),n.gain.linearRampToValueAtTime(.01,a+.25),t.connect(n),n.connect(this.ctx.destination),t.start(),t.stop(a+.25)}playExplode(){if(this.isMuted||(this.init(),!this.ctx))return;const a=this.ctx.currentTime;try{const t=this.ctx.sampleRate*.4,n=this.ctx.createBuffer(1,t,this.ctx.sampleRate),s=n.getChannelData(0);for(let w=0;w<t;w++)s[w]=Math.random()*2-1;const p=this.ctx.createBufferSource();p.buffer=n;const u=this.ctx.createBiquadFilter();u.type="lowpass",u.frequency.setValueAtTime(250,a),u.frequency.exponentialRampToValueAtTime(10,a+.4);const d=this.ctx.createGain();d.gain.setValueAtTime(.3,a),d.gain.exponentialRampToValueAtTime(.01,a+.4),p.connect(u),u.connect(d),d.connect(this.ctx.destination),p.start(),p.stop(a+.4)}catch{const n=this.ctx.createOscillator(),s=this.ctx.createGain();n.type="triangle",n.frequency.setValueAtTime(120,a),n.frequency.linearRampToValueAtTime(30,a+.4),s.gain.setValueAtTime(.3,a),s.gain.linearRampToValueAtTime(.01,a+.4),n.connect(s),s.connect(this.ctx.destination),n.start(),n.stop(a+.4)}}playPowerUp(){if(this.isMuted||(this.init(),!this.ctx))return;const a=this.ctx.currentTime,t=this.ctx.createOscillator(),n=this.ctx.createGain();t.type="sine",t.frequency.setValueAtTime(440,a),t.frequency.exponentialRampToValueAtTime(880,a+.15),n.gain.setValueAtTime(.12,a),n.gain.linearRampToValueAtTime(.01,a+.15),t.connect(n),n.connect(this.ctx.destination),t.start(),t.stop(a+.15)}playFanfare(){if(this.isMuted||(this.init(),!this.ctx))return;const a=this.ctx.currentTime;[[261.63,329.63,392],[349.23,440,523.25],[392,493.88,587.33],[523.25,659.25,783.99]].forEach((n,s)=>{n.forEach(p=>{if(!this.ctx)return;const u=this.ctx.createOscillator(),d=this.ctx.createGain();u.type="triangle",u.frequency.setValueAtTime(p,a+s*.2),d.gain.setValueAtTime(.08,a+s*.2),d.gain.linearRampToValueAtTime(.001,a+s*.2+.35),u.connect(d),d.connect(this.ctx.destination),u.start(a+s*.2),u.stop(a+s*.2+.4)})})}}const _=new Ee;let i={playerCount:4,gamePlaylist:[],playlistActive:!1,currentPlaylistIndex:0,isEliminationMode:!1,players:[{id:1,name:"Oyuncu 1",color:"bg-[#FF6B6B]",hexColor:"#FF6B6B",borderColor:"border-black",textColor:"text-black",glowClass:"shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",emoji:"🔥",avatarName:"Ateş Topu",score:0,key:"KeyA",keyLabel:"A",active:!0},{id:2,name:"Oyuncu 2",color:"bg-[#4ECDC4]",hexColor:"#4ECDC4",borderColor:"border-black",textColor:"text-black",glowClass:"shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",emoji:"💧",avatarName:"Su Damlası",score:0,key:"KeyL",keyLabel:"L",active:!0},{id:3,name:"Oyuncu 3",color:"bg-[#A29BFE]",hexColor:"#A29BFE",borderColor:"border-black",textColor:"text-black",glowClass:"shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",emoji:"🌿",avatarName:"Orman Şamanı",score:0,key:"KeyZ",keyLabel:"Z",active:!0},{id:4,name:"Oyuncu 4",color:"bg-[#FDCB6E]",hexColor:"#FDCB6E",borderColor:"border-black",textColor:"text-black",glowClass:"shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",emoji:"⚡",avatarName:"Yıldırım",score:0,key:"KeyM",keyLabel:"M",active:!0}],currentScreen:"lobby",scores:{1:0,2:0,3:0,4:0}};i.players.forEach(e=>{const a=ye(e.id);e.customImage=a.customImage,e.globalCoins=a.globalCoins,e.unlockedAccessories=a.unlockedAccessories,e.activeAccessory=a.activeAccessory,e.lastRewardClaimDate=a.lastRewardClaimDate,e.rewardStreak=a.rewardStreak,e.unlockedAchievements=a.unlockedAchievements||[],e.balloonWinsCount=a.balloonWinsCount||0,a.name&&(e.name=a.name),a.emoji&&(e.emoji=a.emoji),a.avatarName&&(e.avatarName=a.avatarName),a.key&&(e.key=a.key),a.keyLabel&&(e.keyLabel=a.keyLabel)});const P=document.getElementById("root")||document.body;function xe(e){const a=_.isSoundMuted(),t=document.createElement("button");t.id="global-sound-toggle",t.className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-50 flex items-center justify-center gap-1 px-2 py-1 bg-[#FFEAA7] hover:bg-black hover:text-white text-black border-2 border-black font-sans font-black text-[9px] sm:text-[10px] uppercase tracking-wider cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all select-none",t.innerHTML=a?'🔇 <span class="text-[8px] font-bold">KAPALI</span>':'🔊 <span class="text-[8px] font-bold">AÇIK</span>',t.addEventListener("click",n=>{n.stopPropagation();const s=_.toggleMute();t.innerHTML=s?'🔇 <span class="text-[8px] font-bold">KAPALI</span>':'🔊 <span class="text-[8px] font-bold">AÇIK</span>',s||_.playTick()}),e.appendChild(t)}function Q(){if(i.isEliminationMode&&i.players.filter(a=>a.active&&!a.isEliminated).length<=1){i.playlistActive=!1,i.gamePlaylist=[],i.currentPlaylistIndex=0,_.playFanfare(),N("gameOver");return}if(i.playlistActive&&i.gamePlaylist&&i.gamePlaylist.length>0)if(i.currentPlaylistIndex=(i.currentPlaylistIndex||0)+1,i.currentPlaylistIndex<i.gamePlaylist.length){const e=i.gamePlaylist[i.currentPlaylistIndex];N(e);return}else{i.playlistActive=!1,i.gamePlaylist=[],i.currentPlaylistIndex=0,_.playFanfare(),N("gameOver");return}N("gamesHub")}function N(e){_.playTick();const a=i.currentScreen,t=s=>["balloonGame","memoryGame","colorTrapGame","clickDerbyGame","raceGame"].includes(s),n=window.playgamaBridge;if(t(a)&&!t(e)){if(n&&n.game)try{n.game.gameplayStop()}catch(s){console.warn("Playgama gameplayStop failed",s)}pe()}if(!t(a)&&t(e)&&n&&n.game)try{n.game.gameplayStart()}catch(s){console.warn("Playgama gameplayStart failed",s)}e==="gameOver"&&pe(),i.currentScreen=e,K()}function K(){P.className="min-h-screen brutalist-grid-bg text-black relative flex flex-col items-center justify-center p-3 sm:p-6 font-sans select-none border-[8px] sm:border-[16px] border-black overflow-x-hidden",P.innerHTML="";const e=document.createElement("div");switch(e.className="absolute inset-0 pointer-events-none overflow-hidden z-0",P.appendChild(e),i.currentScreen){case"lobby":$e(),xe(P);break;case"charSelect":Te();break;case"gamesHub":Ce(),xe(P);break;case"balloonGame":Se();break;case"memoryGame":Ie();break;case"colorTrapGame":Be();break;case"clickDerbyGame":Me();break;case"raceGame":Fe();break;case"gameOver":Ne();break;case"costumeShop":je();break}}let ne=1;function fe(){const e=new Date,a=`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`;return i.players.filter(t=>t.active).some(t=>t.lastRewardClaimDate!==a)}function se(){const e="daily-bonus-modal",a=document.getElementById(e);a&&a.remove();const t=document.createElement("div");t.id=e,t.className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none antialiased";const n=i.players.filter(l=>l.active);let s=n.find(l=>l.id===ne);s||(s=n[0]||i.players[0],ne=s.id);const p=s.lastRewardClaimDate||"",u=s.rewardStreak||0,d=new Date,w=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,y=new Date(d);y.setDate(y.getDate()-1);const x=`${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,"0")}-${String(y.getDate()).padStart(2,"0")}`;let k=!1,o=1,f=!1;p===w?(k=!0,f=!1,o=u||1):p===x?(k=!1,f=!0,o=u>=7?1:u+1):(k=!1,f=!0,o=1);const b=[5,10,15,20,25,30,50],m=document.createElement("div");m.className="w-full max-w-xl bg-white border-4 border-black p-5 sm:p-7 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative text-black scale-95 opacity-0 animate-scale-up",m.style.animation="scaleUp 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards";let c="";n.length>1&&(c=`
      <div class="flex flex-wrap gap-1.5 justify-center mb-5 border-b-2 border-dashed border-black pb-4">
        ${n.map(l=>{const g=l.id===ne,L=(l.lastRewardClaimDate||"")!==w;return`
            <button data-player-id="${l.id}" class="bonus-player-tab px-3 py-1.5 border-2 border-black font-black uppercase text-[10px] tracking-wide relative duration-100 cursor-pointer ${g?"bg-black text-white":`${l.color} text-black hover:bg-black hover:text-white`}">
              <div class="flex items-center gap-1">
                <span>${l.customImage?"🖼️":l.emoji}</span>
                <span>${l.name}</span>
                ${L?'<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-black rounded-full animate-ping"></span><span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-black rounded-full"></span>':""}
              </div>
            </button>
          `}).join("")}
      </div>
    `);let h="";for(let l=1;l<=7;l++){const g=b[l-1];let E="",L="",B="";k?l<o?(E="bg-[#E5F6FD] border-gray-400 text-gray-500 opacity-60",L="ALINDI",B=`
          <div class="absolute inset-0 flex items-center justify-center bg-black/5">
            <span class="text-3xl text-emerald-500 font-bold rotate-[-10deg] drop-shadow-[1px_1px_0_rgba(0,0,0,1)] select-none">✅</span>
          </div>
        `):l===o?(E="bg-emerald-100 border-[#4ECDC4] text-[#2D3748] ring-4 ring-[#4ECDC4]/30 scale-105",L="BUGÜN",B=`
          <div class="absolute inset-0 flex items-center justify-center bg-black/5">
            <span class="text-3xl text-emerald-500 font-bold rotate-[-10deg] drop-shadow-[1px_1px_0_rgba(0,0,0,1)] select-none">✅</span>
          </div>
        `):(E="bg-neutral-50 border-[#E2E8F0] text-gray-400",L=`Gün ${l}`):l<o?(E="bg-[#E5F6FD] border-[#93C5FD] text-gray-400 opacity-65",L="ALINDI",B=`
          <div class="absolute inset-0 flex items-center justify-center bg-black/5">
            <span class="text-3xl text-emerald-500 font-bold rotate-[-10deg] drop-shadow-[1px_1px_0_rgba(0,0,0,1)] select-none">✅</span>
          </div>
        `):l===o?(E="bg-[#FFEAA7] border-black text-[#2D3748] border-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] scale-105 animate-pulse-gentle relative z-10 font-bold",L="KAZAN!"):(E="bg-neutral-50 border-[#E2E8F0] font-medium text-gray-400",L=`Gün ${l}`);const D=l===7;h+=`
      <div class="relative rounded-none border-2 border-black p-3 flex flex-col items-center justify-between min-h-[105px] overflow-hidden ${E} ${D?"col-span-2 sm:col-span-1":""} transition-all">
        <span class="text-[9px] font-mono font-black uppercase tracking-wider relative z-10">${L}</span>
        ${B}
        <div class="my-1.5 flex flex-col items-center relative z-10">
          <span class="text-2xl drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">${D?"🎁":"🪙"}</span>
          <span class="font-display font-black text-xs text-black mt-0.5">${g} Coin</span>
        </div>
      </div>
    `}let A="";if(f?A=`
      <button id="bonus-claim-btn" class="w-full py-4 bg-[#4ECDC4] hover:bg-black hover:text-white text-black border-4 border-black font-display font-black text-sm uppercase tracking-wider cursor-pointer shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none hover:shadow-[4px_4px_0_rgba(0,0,0,1)] transition-transform select-none flex items-center justify-center gap-2">
        <span>⚡ ÖDÜLÜ AL (+${b[o-1]} COIN)</span>
      </button>
    `:A=`
      <div class="w-full bg-emerald-100 border-4 border-black p-3.5 text-center shadow-[4px_4px_0_rgba(0,0,0,1)] text-black rotate-[0.5deg]">
        <div class="font-display font-black text-sm uppercase text-emerald-800">🎉 BUGÜNÜN ÖDÜLÜ ALINDI!</div>
        <p class="text-[10px] font-bold text-black/70 mt-0.5">Yarının hediyesi için 24 saat sonra tekrar gel!</p>
      </div>
    `,m.innerHTML=`
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

    ${c}

    <!-- Reward streak tracker banner -->
    <div class="bg-[#FFF9C4] border-3 border-black p-3 flex items-center justify-between mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black rotate-[-0.5deg]">
      <div class="text-left">
        <span class="block text-[8px] font-mono font-black text-black/50 uppercase tracking-widest leading-none">AKTİF SERİ TAKİBİ</span>
        <div class="text-sm font-black mt-0.5 text-black">Ateş Serisi: <span class="text-orange-500 font-display">${u} Gün 🔥</span></div>
      </div>
      <div class="text-right text-[10px] font-bold text-black/70 leading-tight">
        Son Alım: <span class="font-mono text-black font-extrabold">${p||"İlk Kez! 🚀"}</span>
      </div>
    </div>

    <div class="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
      ${h}
    </div>

    <div class="w-full">
      ${A}
    </div>

    <p class="text-center text-[9px] font-mono font-black text-black/45 uppercase tracking-widest mt-4">
      *Serinizi bozmamak için her gün giriş yapmalısınız
    </p>
  `,t.appendChild(m),P.appendChild(t),!document.getElementById("bonus-animation-style")){const l=document.createElement("style");l.id="bonus-animation-style",l.innerHTML=`
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
    `,document.head.appendChild(l)}t.querySelectorAll(".bonus-player-tab").forEach(l=>{l.addEventListener("click",()=>{ne=parseInt(l.getAttribute("data-player-id")||"1",10),_.playTick(),se()})});const r=t.querySelector("#bonus-close-btn");r&&r.addEventListener("click",()=>{_.playTick(),t.remove()});const v=t.querySelector("#bonus-claim-btn");v&&v.addEventListener("click",()=>{_.playSuccess();const l=b[o-1];s.globalCoins=(s.globalCoins||0)+l,s.lastRewardClaimDate=w,s.rewardStreak=o,s.rewardStreak>=3&&oe(s,"streak_3"),z(s);const g=document.createElement("div");g.className="absolute inset-0 bg-yellow-400 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in border-8 border-black",g.innerHTML=`
        <div class="text-7xl animate-bounce mb-4">🪙💥</div>
        <h3 class="text-4xl font-display font-black text-black uppercase tracking-tight">KAZANDIN!</h3>
        <p class="text-lg font-bold text-black mt-2 leading-relaxed">
          ${s.name} hesabına tam <span class="bg-black text-white px-2.5 py-1 font-mono font-black">${l} COIN</span> yüklendi!
        </p>
        <p class="text-xs text-black/60 font-mono mt-4 uppercase font-black font-semibold">Yarın yine gel ve ödülünü büyüt!</p>
        
        <button id="splash-continue-btn" class="mt-8 px-6 py-3 bg-black hover:bg-white border-2 border-black text-white hover:text-black font-display font-black text-xs uppercase tracking-wider cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
          MÜKEMMEL! DEVAM ET ⚡
        </button>
      `,m.appendChild(g);const E=g.querySelector("#splash-continue-btn");E&&E.addEventListener("click",()=>{_.playTick(),g.remove(),se(),K()})}),t.addEventListener("click",l=>{l.target===t&&(_.playTick(),t.remove())})}function ge(e="general"){const a="how-to-play-modal",t=document.getElementById(a);t&&t.remove();let n=[];function s(){n.forEach(x=>clearInterval(x)),n=[]}const p=document.createElement("div");p.id=a,p.className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none antialiased text-black";const u=document.createElement("div");u.className="w-full max-w-2xl bg-white border-4 border-black p-4 sm:p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative text-black scale-95 opacity-0 animate-scale-up flex flex-col max-h-[90vh]",u.style.animation="scaleUp 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards",p.appendChild(u),P.appendChild(p);const d=[{id:"general",label:"📢 Genel Bilgi"},{id:"memory",label:"🧩 Hafıza Kartları"},{id:"balloon",label:"🎈 Balon Şişirme"},{id:"colorTrap",label:"🎨 Renk Tuzağı"},{id:"clickDerby",label:"⚡ Işık Avcısı"}];let w=e;function y(){s(),u.innerHTML=`
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
        ${d.map(f=>{const b=f.id===w;return`
            <button data-tab-id="${f.id}" class="how-tab-btn px-2 sm:px-3 py-1 sm:py-1.5 border-2 border-black text-black font-black uppercase text-[9px] sm:text-[10px] tracking-wide relative duration-100 cursor-pointer shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] ${b?"bg-black text-white hover:bg-black hover:text-white":"bg-white hover:bg-black hover:text-white"}">
              <span>${f.label}</span>
            </button>
          `}).join("")}
      </div>

      <!-- Content Chamber -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-4 text-left" id="how-content-chamber">
        <!-- Content gets programmatically injected below -->
      </div>
    `,u.querySelectorAll(".how-tab-btn").forEach(f=>{f.addEventListener("click",()=>{w=f.getAttribute("data-tab-id")||"general",_.playTick(),y()})});const k=u.querySelector("#how-close-btn");k&&k.addEventListener("click",()=>{_.playTick(),s(),p.remove()});const o=u.querySelector("#how-content-chamber");if(o){if(w==="general")o.innerHTML=`
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
                  <span><b>Playlist Kuyruğu:</b> Ana ekranda istediğin oyunları sıraya ekleyip sırayla kesintisiz bir turnuva maratonuna başlayabilirsin.</span>
                </li>
                <li class="flex items-start gap-1.5">
                  <span class="text-[#FF6B6B] font-extrabold">✔</span>
                  <span><b>Mağaza & Özelleştirme:</b> Her oyundan kazandığın 🪙 Altınlar ile Mağazaya girip oyuncun için eğlenceli şapkalar, kostümler ve yeni karakter stilleri satın alabilirsin!</span>
                </li>
                <li class="flex items-start gap-1.5">
                  <span class="text-blue-500 font-extrabold">✔</span>
                  <span><b>Kürsü Ödülleri:</b> Turnuva sonlandığında genel liderlik tablosu kesinleşir ve en büyük kupa şampiyona gider!</span>
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
      `;else if(w==="memory"){o.innerHTML=`
        <div class="space-y-3.5">
          <div class="text-xs sm:text-sm leading-relaxed">
            <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
              🧩 Hafıza Kartları (Memory Pairs)
            </h4>
            <p class="font-semibold text-black/80">
              Oyun tahtasında kapalı duran kartları sırayla aç. Eğer aynı iki simgeyi arka arkaya bulursan, puanı kaparsın! Rakiplerinin açtığı kartları iyi gözlemle ve nerede olduklarını ezberle.
            </p>
          </div>

          <!-- Dynamic Interaction Box -->
          <div class="border-4 border-black bg-purple-50 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center">
            <h5 class="text-[10px] font-black uppercase text-indigo-700 mb-2 tracking-wider">🛠️ PRATİK DENEME ALANI (2x2 Mini Kartlar)</h5>
            
            <div class="grid grid-cols-2 gap-3 w-32" id="pract-mem-grid">
              <!-- Dynamically populated below -->
            </div>

            <div id="pract-mem-status" class="mt-3 font-bold text-[11px] sm:text-xs text-black text-center min-h-[1.25rem]">
              Bir kart seçerek eşleştirmeye başla!
            </div>
          </div>
        </div>
      `;const f=["🍏","🍇","🍏","🍇"],b=[0,1,2,3].sort(()=>Math.random()-.5),m=o.querySelector("#pract-mem-grid"),c=o.querySelector("#pract-mem-status");let h=[],A=[];b.forEach($=>{const r=document.createElement("button");r.className="w-12 h-12 border-3 border-black bg-white flex items-center justify-center text-xl font-bold hover:bg-[#A29BFE]/40 transition duration-150 cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] hover:-translate-y-[1px]",r.innerText="❓",r.addEventListener("click",()=>{const v=f[$];if(!(A.includes($)||h.some(l=>l.index===$)||h.length>=2))if(_.playTick(),r.innerText=v,r.className="w-12 h-12 border-3 border-black bg-white flex items-center justify-center text-xl font-bold shadow-inner bg-indigo-100",h.push({btn:r,symbol:v,index:$}),h.length===2){const[l,g]=h;l.symbol===g.symbol?(A.push(l.index,g.index),h=[],_.playSuccess(),l.btn.className="w-12 h-12 border-3 border-black bg-emerald-100 flex items-center justify-center text-xl font-bold shadow-[2px_2px_0_rgba(0,0,0,1)] scale-105 pointer-events-none duration-150",g.btn.className="w-12 h-12 border-3 border-black bg-emerald-100 flex items-center justify-center text-xl font-bold shadow-[2px_2px_0_rgba(0,0,0,1)] scale-105 pointer-events-none duration-150",A.length===4?c.innerHTML='<span class="text-emerald-600 font-extrabold animate-bounce block">🎉 Tebrikler! Tüm kartları başarıyla eşleştirdin! 🥳</span>':c.innerHTML='<span class="text-green-600 font-extrabold">Harika! Bir çift buldun!</span>'):(c.innerHTML='<span class="text-red-500 font-bold">Uyuşmuyor, aklında tut ve tekrar dene!</span>',setTimeout(()=>{_.playFail(),l.btn.innerText="❓",l.btn.className="w-12 h-12 border-3 border-black bg-white flex items-center justify-center text-xl font-bold hover:bg-[#A29BFE]/40 cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]",g.btn.innerText="❓",g.btn.className="w-12 h-12 border-3 border-black bg-white flex items-center justify-center text-xl font-bold hover:bg-[#A29BFE]/40 cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]",h=[]},800))}else c.innerHTML="<span>İkinci kartını seç...</span>"}),m.appendChild(r)})}else if(w==="balloon"){o.innerHTML=`
        <div class="space-y-3.5">
          <div class="text-xs sm:text-sm leading-relaxed">
            <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
              🎈 Balon Şişirme (Balloon Mash)
            </h4>
            <p class="font-semibold text-black/80">
              Bu oyunda amaç en hızlı şekilde kendi balonunu şişirip gökyüzüne fırlatmak! Kendi oyuncu butonuna seri bir şekilde tıkla ya da klavyeden kendi oyuncu tuşuna (Örn: Oyuncu 1 için 'A' tuşu) sürekli basarak rakibinden hızlı davran!
            </p>
          </div>

          <!-- Dynamic Interaction Box -->
          <div class="border-4 border-black bg-red-50 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center">
            <h5 class="text-[10px] font-black uppercase text-red-600 mb-2 tracking-wider">🛠️ PRATİK DENEME ALANI (Balon Pompası)</h5>
            
            <div class="flex items-center justify-center h-24 relative w-full overflow-hidden border-2 border-dashed border-black/10 bg-white shadow-inner mb-3 rounded">
              <div id="pract-balloon" class="rounded-full bg-[#FF6B6B] border-3 border-black relative transition-all duration-75 flex items-center justify-center text-xs text-white font-extrabold shadow-[2px_2px_0_rgba(0,0,0,1)]" style="width: 45px; height: 45px;">
                🎈
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-center gap-2">
              <button id="pract-balloon-pump" class="px-5 py-2 bg-[#FF6B6B] hover:bg-black hover:text-white border-2 border-black font-black uppercase text-xs tracking-wider cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none transition-all">
                🎈 Balonu Şişir!
              </button>
              <button id="pract-balloon-reset" class="px-3 py-2 bg-white hover:bg-red-200 border-2 border-black font-bold uppercase text-[10px] cursor-pointer shadow-[1px_1px_0_rgba(0,0,0,1)]">
                🔄 Sıfırla
              </button>
            </div>

            <div id="pract-balloon-status" class="mt-3 font-semibold text-xs text-black/60 text-center uppercase tracking-wider">
              Yüzde: <span class="font-black text-black font-mono">0%</span> Şişirildi!
            </div>
          </div>
        </div>
      `;const f=o.querySelector("#pract-balloon"),b=o.querySelector("#pract-balloon-pump"),m=o.querySelector("#pract-balloon-reset"),c=o.querySelector("#pract-balloon-status");let h=0;const A=()=>{if(h>=100){f.style.width="85px",f.style.height="85px",f.className="rounded-full bg-red-400 border-3 border-black relative transition-all duration-75 flex items-center justify-center text-sm animate-ping",f.innerText="💥 GÜM",c.innerHTML='<span class="text-orange-500 font-black animate-pulse">PATLADI! TEBRİKLER! 🎈🚀</span>';return}const $=Math.min(45+h*.45,85);f.style.width=`${$}px`,f.style.height=`${$}px`,f.innerText="🎈",f.className="rounded-full bg-[#FF6B6B] border-3 border-black relative transition-all duration-75 flex items-center justify-center text-xs text-white font-extrabold shadow-[2px_2px_0_rgba(0,0,0,1)]",c.innerHTML=`Yüzde: <span class="font-black text-black font-mono">${h}%</span> Şişirildi!`};b.addEventListener("click",()=>{h>=100||(h+=10,h>=100?_.playPop():_.playTick(),A())}),m.addEventListener("click",()=>{h=0,_.playTick(),A()})}else if(w==="colorTrap"){o.innerHTML=`
        <div class="space-y-3.5">
          <div class="text-xs sm:text-sm leading-relaxed">
            <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
              🎨 Renk Tuzağı (Color Stroop Game)
            </h4>
            <p class="font-semibold text-black/80">
              Klasik stroop etkisi tuzağı! Kelimenin kendisiyle boyandığı yazı rengiyi karşılaştır. Eğer <b class="text-slate-800">Yazı rengi ile kelimenin kendisi AYNI ise</b> hemen kendi tuşuna bas! Yanlış basarsan puan kaybedersin!
            </p>
          </div>

          <!-- Dynamic Interaction Box -->
          <div class="border-4 border-black bg-yellow-50 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center">
            <h5 class="text-[10px] font-black uppercase text-amber-600 mb-2 tracking-wider">🛠️ PRATİK DENEME ALANI (Renk & Anlam Eşleştirme)</h5>
            
            <div class="border-3 border-black w-full max-w-xs bg-white p-3 text-center shadow-[2px_2px_0_rgba(0,0,0,1)] mb-3 rounded">
              <h3 id="pract-stroop-word" class="text-2xl sm:text-3xl font-black uppercase tracking-wide select-none" style="color: #FF6B6B">KIRMIZI</h3>
            </div>

            <div class="flex items-center gap-2 mb-3">
              <button id="pract-stroop-same" class="px-4 py-2 border-2 border-black font-black bg-green-400 hover:bg-green-500 text-black text-xs uppercase cursor-pointer shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] active:translate-y-[1px]">
                ✔ AYNI
              </button>
              <button id="pract-stroop-different" class="px-4 py-2 border-2 border-black font-black bg-red-400 hover:bg-red-500 text-black text-xs uppercase cursor-pointer shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] active:translate-y-[1px]">
                ✕ FARKLI
              </button>
            </div>

            <div id="pract-stroop-result" class="font-mono text-xs font-bold uppercase min-h-[1.5rem] tracking-wide text-center">
              Puanın: <span class="text-emerald-700 bg-white border border-black px-1.5 font-bold">0</span>
            </div>
          </div>
        </div>
      `;const f=o.querySelector("#pract-stroop-word"),b=o.querySelector("#pract-stroop-same"),m=o.querySelector("#pract-stroop-different"),c=o.querySelector("#pract-stroop-result"),h=[{text:"KIRMIZI",colorHex:"#FF6B6B"},{text:"MAVİ",colorHex:"#A29BFE"},{text:"YEŞİL",colorHex:"#2EC4B6"}];let A=0,$=0,r=0;const v=()=>{A=Math.floor(Math.random()*h.length),$=Math.floor(Math.random()*h.length),f.innerText=h[A].text,f.style.color=h[$].colorHex},l=g=>{g===(A===$)?(r++,_.playSuccess(),c.innerHTML=`<span class="text-green-600 font-extrabold animate-bounce">✓ DOĞRU! Skor: ${r}</span>`):(r=Math.max(0,r-1),_.playFail(),c.innerHTML=`<span class="text-red-500 font-bold">✖ YANLIŞ TUZAK! Skor: ${r}</span>`),v()};b.addEventListener("click",()=>l(!0)),m.addEventListener("click",()=>l(!1)),v()}else if(w==="clickDerby"){o.innerHTML=`
        <div class="space-y-3.5">
          <div class="text-xs sm:text-sm leading-relaxed">
            <h4 class="font-display font-black text-black uppercase text-xs sm:text-sm flex items-center gap-1.5">
              ⚡ Işık Avcısı (Traffic Clicker)
            </h4>
            <p class="font-semibold text-black/80">
              Aşırı dikkat ve refleks gerektiren çılgın tıklama maratonu! Ortadaki lamba <span class="text-emerald-600 font-extrabold">YEŞİL</span> yandığında olabildiğince hızlı tıkla/bas. Ama dikkat et! <span class="text-yellow-500 font-extrabold">SARI</span> yanarsa -1, <span class="text-red-600 font-extrabold">KIRMIZI</span> yanarsa -2 efsane bir ceza yersin!
            </p>
          </div>

          <!-- Dynamic Interaction Box -->
          <div class="border-4 border-black bg-emerald-50 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center">
            <h5 class="text-[10px] font-black uppercase text-emerald-600 mb-2 tracking-wider">🛠️ PRATİK DENEME ALANI (Sinyal Simülatörü)</h5>
            
            <div class="flex items-center justify-center gap-4 py-2 px-6 border-3 border-black bg-white shadow-[2px_2px_0_rgba(0,0,0,1)] mb-3 rounded">
              <div id="pract-light-red" class="w-6 h-6 rounded-full bg-red-950 border-2 border-black shadow"></div>
              <div id="pract-light-yellow" class="w-6 h-6 rounded-full bg-yellow-950 border-2 border-black shadow"></div>
              <div id="pract-light-green" class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-black shadow animate-pulse"></div>
            </div>

            <button id="pract-signal-tap" class="w-full max-w-xs py-2.5 border-2 border-black font-black bg-emerald-400 text-black text-xs uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-y-[1px]">
              🚨 TIKLA!
            </button>

            <div id="pract-signal-status" class="mt-3 text-xs tracking-wide uppercase font-mono font-bold leading-normal text-center">
              Skor: <span class="text-black font-black">0 Puan</span>
            </div>
          </div>
        </div>
      `;const f=o.querySelector("#pract-light-red"),b=o.querySelector("#pract-light-yellow"),m=o.querySelector("#pract-light-green"),c=o.querySelector("#pract-signal-tap"),h=o.querySelector("#pract-signal-status");let A="green",$=0;const r=()=>{const l=Math.random();l<.45?(A="green",f.className="w-6 h-6 rounded-full bg-red-950 border-2 border-black shadow",b.className="w-6 h-6 rounded-full bg-yellow-950 border-2 border-black shadow",m.className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-black shadow animate-pulse",c.className="w-full max-w-xs py-2.5 border-2 border-black font-black bg-emerald-400 text-black text-xs uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]"):l<.7?(A="yellow",f.className="w-6 h-6 rounded-full bg-red-950 border-2 border-black shadow",b.className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-black shadow animate-bounce",m.className="w-6 h-6 rounded-full bg-emerald-950 border-2 border-black shadow",c.className="w-full max-w-xs py-2.5 border-2 border-black font-black bg-yellow-300 text-black text-xs uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]"):(A="red",f.className="w-6 h-6 rounded-full bg-red-600 border-2 border-black shadow animate-bounce",b.className="w-6 h-6 rounded-full bg-yellow-950 border-2 border-black shadow",m.className="w-6 h-6 rounded-full bg-emerald-950 border-2 border-black shadow",c.className="w-full max-w-xs py-2.5 border-2 border-black font-black bg-red-500 text-white text-xs uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]")};c.addEventListener("click",()=>{A==="green"?($++,_.playTick(),h.innerHTML=`Skor: <span class="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 border border-black rounded">+1 (Toplam: ${$})</span>`):A==="yellow"?($=Math.max(0,$-1),_.playFail(),h.innerHTML=`Skor: <span class="bg-yellow-100 text-yellow-800 font-bold px-1.5 py-0.5 border border-black rounded">-1 CEZA (Toplam: ${$})</span>`):($=Math.max(0,$-2),_.playExplode(),h.innerHTML=`Skor: <span class="bg-red-100 text-red-800 font-bold px-1.5 py-0.5 border border-black rounded">-2 CEZA! (Toplam: ${$})</span>`)});const v=setInterval(r,1300);n.push(v)}}}y(),p.addEventListener("click",x=>{x.target===p&&(_.playTick(),s(),p.remove())})}function Ae(){const e="edit-players-modal",a=document.getElementById(e);a&&a.remove();const t=document.createElement("div");t.id=e,t.className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none antialiased text-black";const n=document.createElement("div");n.className="w-full max-w-2xl bg-white border-4 border-black p-4 sm:p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative text-black scale-95 opacity-0 animate-scale-up flex flex-col max-h-[90vh]",n.style.animation="scaleUp 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards",t.appendChild(n),P.appendChild(t);let s=1,p=null;function u(){p&&(window.removeEventListener("keydown",p,{capture:!0}),p=null)}function d(x,k){return x.startsWith("Key")&&x.length===4?x.substring(3):x.startsWith("Digit")&&x.length===6?x.substring(5):x==="Space"?"SPACE":x==="Enter"?"ENTER":x==="ArrowUp"?"▲":x==="ArrowDown"?"▼":x==="ArrowLeft"?"◀":x==="ArrowRight"?"▶":x.startsWith("Numpad")?x.replace("Numpad","NUM "):k.toUpperCase()}function w(){var x;u(),n.innerHTML=`
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
      <div class="grid grid-cols-4 gap-1.5 mb-4 shrink-0">
        ${i.players.map(k=>{const o=s===k.id,f=o?k.color:"bg-zinc-100 hover:bg-zinc-200",b=o?"font-black text-black":"font-bold text-black/60";return`
            <button data-player-id="${k.id}" class="tab-btn py-2 px-1 border-2 border-black ${f} ${b} rounded-lg text-xs cursor-pointer select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col sm:flex-row items-center justify-center gap-1">
              <span class="text-xs sm:text-sm select-none">${k.emoji}</span>
              <span class="truncate max-w-[50px] sm:max-w-none text-[10px] sm:text-[11px] select-none">${k.name}</span>
            </button>
          `}).join("")}
      </div>

      <!-- Tab Content Area -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-4 text-left" id="edit-tabs-content">
        <!-- Replaced dynamically inside renderTab() -->
      </div>
    `,(x=document.getElementById("modal-close-btn"))==null||x.addEventListener("click",()=>{_.playTick(),u(),t.remove(),N("lobby")}),n.querySelectorAll(".tab-btn").forEach(k=>{k.addEventListener("click",()=>{const o=parseInt(k.getAttribute("data-player-id")||"1",10);o!==s&&(_.playTick(),s=o,w())})}),y()}function y(){const x=i.players.find(h=>h.id===s),k=document.getElementById("edit-tabs-content");if(!k)return;k.innerHTML=`
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Left Column: Name & Key controls -->
        <div class="space-y-4">
          <!-- Name Group -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-black uppercase tracking-wider text-black/70">✍️ OYUNCU İSMİ</label>
            <input type="text" id="edit-name-input" class="w-full border-4 border-black p-2.5 font-display font-black text-sm sm:text-base focus:bg-yellow-50 focus:outline-none transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-lg text-black" value="${x.name}" placeholder="Oyuncu Adı..." maxlength="12" />
          </div>

          <!-- Key Cap Customizer Group -->
          <div class="border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center space-y-3 rounded-lg relative overflow-hidden text-black">
            <span class="text-[11px] font-black uppercase tracking-wider text-black/70">⌨️ KLAVYE TETİKLEME TUŞU</span>
            
            <div id="capture-box" class="w-20 h-20 border-4 border-black rounded-xl bg-amber-50 flex items-center justify-center font-display font-black text-2xl sm:text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-none transition-colors duration-150 relative">
              <span id="capture-key-label" class="animate-bounce-short">${x.keyLabel}</span>
            </div>

            <button id="assign-btn" class="px-5 py-2.5 bg-black hover:bg-[#FF7675] hover:text-white border-2 border-black text-white font-black uppercase text-xs cursor-pointer select-none transition-colors w-full rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none text-center">
              Yeni Tuş Ata ⚙️
            </button>

            <div id="key-warning-text" class="text-[10px] font-bold text-center leading-tight transition-all duration-150 min-h-[20px]">
              Tıklayıp değiştirmek istediğiniz tuşa basın. (Varsayılan: ${x.id===1?"A":x.id===2?"L":x.id===3?"Z":"M"})
            </div>
          </div>
        </div>

        <!-- Right Column: Avatar/Emoji selection -->
        <div class="space-y-2">
          <label class="block text-[11px] font-black uppercase tracking-wider text-black/70">👑 KARAKTER SEÇ (SİMGE)</label>
          <div class="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto p-1 border-2 border-black bg-zinc-50 rounded-lg">
            ${W.map(h=>{const A=x.emoji===h.emoji,$=A?"border-4 border-black bg-yellow-100 scale-[1.01] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]":"border-2 border-zinc-300 bg-white opacity-85 hover:opacity-100 hover:border-black",r=A?"font-black":"font-bold text-black/70";return`
                <button type="button" data-emoji="${h.emoji}" data-name="${h.name}" class="avatar-select-card p-2 flex items-center gap-2 rounded-lg ${$} cursor-pointer transition-all text-xs text-left select-none text-black">
                  <span class="text-xl shrink-0 select-none">${h.emoji}</span>
                  <div class="leading-none overflow-hidden select-none">
                    <div class="truncate ${r} select-none">${h.name}</div>
                    <div class="text-[8px] text-black/50 select-none">${h.description}</div>
                  </div>
                </button>
              `}).join("")}
          </div>
        </div>
      </div>
    `;const o=document.getElementById("edit-name-input");o&&o.addEventListener("input",()=>{x.name=o.value.trim()||`Oyuncu ${x.id}`,z(x);const h=n.querySelector(`button[data-player-id="${x.id}"]`);if(h){const A=h.querySelector("span:last-child");A&&(A.textContent=x.name)}}),k.querySelectorAll(".avatar-select-card").forEach(h=>{h.addEventListener("click",()=>{const A=h.getAttribute("data-emoji")||"",$=h.getAttribute("data-name")||"";if(A){_.playTick(),x.emoji=A,x.avatarName=$,z(x),y();const r=n.querySelector(`button[data-player-id="${x.id}"]`);if(r){const v=r.querySelector("span:first-child");v&&(v.textContent=x.emoji)}}})});const f=document.getElementById("assign-btn"),b=document.getElementById("capture-box"),m=document.getElementById("capture-key-label"),c=document.getElementById("key-warning-text");f&&b&&m&&c&&f.addEventListener("click",()=>{_.playTick(),u(),f.textContent="TUŞ BEKLENİYOR... ⌨️",f.disabled=!0,b.classList.remove("bg-amber-50"),b.classList.add("bg-rose-100","animate-pulse","border-[#FF7675]"),m.textContent="⏱️",c.className="text-[10px] font-black text-rose-600 text-center leading-tight animate-pulse",c.textContent="Kaydetmek için klavyeden bir tuşa basın veya ESC ile çıkın...";const h=A=>{A.preventDefault(),A.stopPropagation();const $=A.code;if($==="Escape"){_.playFail(),u(),y();return}const r=i.players.find(l=>l.id!==x.id&&l.key===$);if(r){_.playFail(),c.textContent=`⚠️ Bu tuş zaten ${r.name} tarafından kullanılıyor! Başka bir tuş deneyin.`;return}const v=d($,A.key);x.key=$,x.keyLabel=v,z(x),_.playTick(),u(),y()};p=h,window.addEventListener("keydown",h,{capture:!0})})}w(),t.addEventListener("click",x=>{x.target===t&&(_.playTick(),u(),t.remove(),N("lobby"))})}function $e(){const e=document.createElement("div");e.className="w-full max-w-2xl bg-white border-4 border-black p-6 sm:p-10 text-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative z-10 flex flex-col items-center space-y-8 animate-fade-in";const a=window.playgamaBridge;let t="";if(a)if(a.player&&a.player.isAuthorized){const x=a.player.name||"Playgama Oyuncusu",k=a.player.avatar||a.player.avatarUrl||"";t=`
        <!-- Connected Account Card -->
        <div class="w-full bg-[#E5F6FD] border-4 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rotate-[-0.5deg]">
          <div class="flex items-center gap-3">
            <div class="relative w-12 h-12 rounded-full border-2 border-black bg-white overflow-hidden flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              ${k?`<img src="${k}" class="w-full h-full object-cover" referrerpolicy="no-referrer" />`:'<span class="text-xl flex items-center justify-center w-full h-full bg-[#A29BFE]">👤</span>'}
            </div>
            <div class="text-left">
              <div class="text-[10px] font-black uppercase text-blue-700 tracking-wider">Playgama Bulut Kaydı Aktif</div>
              <div class="text-sm font-black truncate max-w-[180px] sm:max-w-xs">${x} (Oyuncu 1)</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="bg-blue-500 border-2 border-black text-white text-[10px] font-black px-2 py-1 rotate-[2deg] shadow-[1px_1px_0_rgba(0,0,0,1)] uppercase">BAĞLANDI</span>
          </div>
        </div>
      `}else t=`
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
      `;e.innerHTML=`
    <!-- Top Decorative Header -->
    <div class="flex items-center gap-2 px-4 py-2 border-2 border-black bg-[#4ECDC4] text-black font-display text-xs sm:text-sm tracking-wider uppercase font-black rotate-[-1deg] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      ⚡ 4 KİŞİLİK EĞLENCE ARENASI
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
 
    <!-- Player Select Buttons -->
    <div class="w-full max-w-sm space-y-2 mx-auto">
      <label class="block text-black font-display text-[11px] tracking-widest uppercase font-black bg-black text-white py-0.5 px-2">OYUNCU SAYISINI SEÇİN</label>
      <div class="grid grid-cols-3 gap-2.5">
        <button id="pcount-2" class="py-2.5 px-2 bg-[#FF6B6B] hover:bg-black hover:text-white border-2 border-black text-black cursor-pointer group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div class="text-xl sm:text-2xl font-display font-black transition-transform">2</div>
          <div class="text-[9px] font-black uppercase tracking-wide">Oyuncu</div>
        </button>
        
        <button id="pcount-3" class="py-2.5 px-2 bg-[#4ECDC4] hover:bg-black hover:text-white border-2 border-black text-black cursor-pointer group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div class="text-xl sm:text-2xl font-display font-black transition-transform">3</div>
          <div class="text-[9px] font-black uppercase tracking-wide">Oyuncu</div>
        </button>
        
        <button id="pcount-4" class="py-2.5 px-2 bg-[#A29BFE] hover:bg-black hover:text-white border-2 border-black text-black cursor-pointer group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div class="text-xl sm:text-2xl font-display font-black transition-transform">4</div>
          <div class="text-[9px] font-black uppercase tracking-wide">Oyuncu</div>
        </button>
      </div>
    </div>

    <!-- Tournament Mode Select -->
    <div class="w-full max-w-sm space-y-2 mx-auto pt-1">
      <label class="block text-black font-display text-[11px] tracking-widest uppercase font-black bg-black text-white py-0.5 px-2">TURNUVA MODU SEÇİN</label>
      <div class="grid grid-cols-2 gap-2.5 select-none hover:text-black">
        <button id="tmode-standard" class="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${i.isEliminationMode?"bg-white font-bold":"bg-[#FFEAA7] font-black"}">
          <div class="text-[11px] font-display font-black">🏆 Standart Turnuva</div>
          <div class="text-[8px] uppercase text-black/65 font-black tracking-wider leading-none mt-0.5">Puan Toplama</div>
        </button>
        <button id="tmode-elimination" class="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${i.isEliminationMode?"bg-[#FF7675] text-white font-black animate-pulse":"bg-white text-black font-bold"}">
          <div class="text-[11px] font-display font-black">🔥 Elemeli Nakavt</div>
          <div class="text-[8px] uppercase ${i.isEliminationMode?"text-white/85":"text-black/65"} font-black tracking-wider leading-none mt-0.5">Kazanan Tur Atlar</div>
        </button>
      </div>
    </div>

    <!-- Customized Character & Control settings Card -->
    <div class="w-full bg-[#FFEAA7] border-4 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rotate-[0.5deg]">
      <div class="text-left space-y-0.5 max-w-sm select-none">
        <h4 class="text-[10px] font-black uppercase text-black/60 tracking-wider">⚙️ Oyuncu Özelleştirme & Tuş Ayarları</h4>
        <div class="text-xs font-bold text-black/85 leading-tight">Oyuncu isimlerini değiştirebilir, karakter simgelerini (Ateş, Su, Yaprak vb.) özelleştirebilir ve klavye tuşlarını dilediğiniz gibi atayabilirsiniz!</div>
      </div>
      <button id="lobby-edit-players-btn" class="w-full sm:w-auto px-5 py-2.5 bg-[#FF7675] hover:bg-black hover:text-white border-2 border-black text-white font-black font-display text-[11px] uppercase cursor-pointer transition-all transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none whitespace-nowrap">
        OYUNCULARI DÜZENLE ⚙️
      </button>
    </div>

    ${t}

    <!-- Daily Reward Card -->
    <div class="w-full bg-[#EBFBEE] border-4 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rotate-[0.5deg] relative overflow-hidden">
      <div class="flex items-center gap-3">
        <div class="relative flex items-center justify-center">
          <span class="text-3xl animate-bounce-short">🎁</span>
          ${fe()?'<span class="absolute -top-1 -right-0.5 w-3 h-3 bg-red-500 border-2 border-black rounded-full animate-ping"></span><span class="absolute -top-1 -right-0.5 w-3 h-3 bg-red-500 border-2 border-black rounded-full"></span>':""}
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
        <ul class="space-y-2 font-mono leading-none">
          <li class="flex items-center gap-1.5 select-none font-bold">🔴 ${i.players[0].emoji} ${i.players[0].name}: <strong class="bg-white border-2 border-black px-1.5 py-0.5 text-[11px] rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">${i.players[0].keyLabel}</strong> tuşu</li>
          <li class="flex items-center gap-1.5 select-none font-bold">🔵 ${i.players[1].emoji} ${i.players[1].name}: <strong class="bg-white border-2 border-black px-1.5 py-0.5 text-[11px] rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">${i.players[1].keyLabel}</strong> tuşu</li>
          <li class="flex items-center gap-1.5 select-none font-bold">🌿 ${i.players[2].emoji} ${i.players[2].name}: <strong class="bg-white border-2 border-black px-1.5 py-0.5 text-[11px] rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">${i.players[2].keyLabel}</strong> tuşu</li>
          <li class="flex items-center gap-1.5 select-none font-bold">⚡ ${i.players[3].emoji} ${i.players[3].name}: <strong class="bg-white border-2 border-black px-1.5 py-0.5 text-[11px] rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">${i.players[3].keyLabel}</strong> tuşu</li>
        </ul>
      </div>
 
      <div class="space-y-2 border-t sm:border-t-0 sm:border-l border-black pt-2 sm:pt-0 sm:pl-4">
        <span class="font-display font-black text-sm tracking-wider flex items-center gap-1.5 uppercase">📱 MOBİL KONTROLLER</span>
        <p class="leading-relaxed font-bold text-black/80">
          Akıllı telefon ve tabletlerde ekranda belirecek devasa renkli köşe butonlarına basarak kusursuz bir mobil parti yaşayabilirsiniz!
        </p>
      </div>
    </div>
  `,P.appendChild(e),[2,3,4].forEach(y=>{const x=document.getElementById(`pcount-${y}`);x&&x.addEventListener("click",()=>{i.playerCount=y,i.players.forEach(k=>{k.active=k.id<=y,k.score=0,k.isEliminated=!1}),N("charSelect")})});const n=document.getElementById("tmode-standard"),s=document.getElementById("tmode-elimination");n&&s&&(n.addEventListener("click",()=>{var x;_.playTick(),i.isEliminationMode=!1,n.className="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#FFEAA7] font-black",s.className="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white font-bold";const y=(x=s.querySelector("div"))==null?void 0:x.nextElementSibling;y&&(y.className="text-[8px] uppercase text-black/65 font-black tracking-wider leading-none mt-0.5")}),s.addEventListener("click",()=>{var x;_.playTick(),i.isEliminationMode=!0,n.className="py-2 px-1 border-2 border-black text-black cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white font-bold",s.className="py-2 px-1 border-2 border-black text-white cursor-pointer text-center group transition-all transform active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#FF7675] font-black animate-pulse";const y=(x=s.querySelector("div"))==null?void 0:x.nextElementSibling;y&&(y.className="text-[8px] uppercase text-white/85 font-black tracking-wider leading-none mt-0.5")}));const p=document.getElementById("playgama-connect-btn");p&&p.addEventListener("click",()=>{ve()});const u=document.getElementById("lobby-daily-bonus-btn");u&&u.addEventListener("click",()=>{_.playTick(),se()});const d=document.getElementById("lobby-how-to-play-btn");d&&d.addEventListener("click",()=>{_.playTick(),ge()});const w=document.getElementById("lobby-edit-players-btn");w&&w.addEventListener("click",()=>{_.playTick(),Ae()})}function Te(){var s,p,u;const e=document.createElement("div");e.className="w-full max-w-5xl relative z-10 flex flex-col items-center space-y-4 animate-fade-in";const a=document.createElement("div");a.className="text-center space-y-1 w-full max-w-3xl",a.innerHTML=`
    <div class="bg-white border-2 border-black p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
      <h2 class="text-xl sm:text-2xl font-display font-black text-black uppercase">Karakterini Özelleştir!</h2>
      <p class="text-black font-bold text-[10.5px]">Oyuncu ismini gir, tuşunu öğren ve avatarını değiştir!</p>
    </div>
  `,e.appendChild(a);const t=document.createElement("div");t.className=`grid w-full gap-4 ${i.playerCount===2?"grid-cols-1 md:grid-cols-2 max-w-3xl":i.playerCount===3?"grid-cols-1 md:grid-cols-3 max-w-4xl text-sm":"grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`,i.players.forEach(d=>{if(!d.active)return;const w=document.createElement("div");w.className=`${d.color} border-2 border-black p-3.5 flex flex-col items-center text-center space-y-3 focus-within:ring-2 focus-within:ring-black transition-all duration-300 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`;let y=W.findIndex(x=>x.name===d.avatarName);y===-1&&(y=d.id-1),w.innerHTML=`
      <div class="absolute -top-2.5 left-3 px-2 py-0.5 text-[9px] font-display font-black text-white uppercase bg-black border border-black rotate-[-1deg] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        OYUNCU ${d.id}
      </div>

      <!-- Avatar Big Bubble -->
      <div id="avatar-container-${d.id}" class="mt-2 relative">
        ${O(d,"w-16 h-16 text-3xl animate-float")}
      </div>

      <!-- Name input -->
      <div class="w-full space-y-0.5 text-left">
        <label class="block text-[9px] font-display uppercase tracking-wider text-black font-black">OYUNCU ADI</label>
        <input 
          type="text" 
          id="pname-input-${d.id}" 
          value="${d.name}"
          class="w-full bg-white border-2 border-black text-center text-xs font-black text-black py-1.5 px-2 rounded-none focus:outline-none transition-all duration-200 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
          placeholder="İsim gir..."
        />
      </div>

      <!-- Key assignment reminder -->
      <div class="w-full bg-white border border-black rounded-none py-1 px-2 flex items-center justify-between text-[10.5px] font-mono font-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
        <span class="text-black uppercase tracking-widest text-[8px] font-bold">TETİK TUŞU:</span>
        <span class="font-extrabold px-1.5 py-0.5 bg-black text-white border border-black text-[10px]">${d.keyLabel}</span>
      </div>

      <!-- Avatar Selector Slider Controls -->
      <div class="w-full space-y-1 text-left">
        <label class="block text-[9px] font-display uppercase tracking-wider text-black font-black">AVATAR SEÇİMİ</label>
        <div class="flex items-center gap-1">
          <button id="avatar-prev-${d.id}" class="py-1 px-2 cursor-pointer bg-white border border-black text-[10px] text-black font-black hover:bg-black hover:text-white transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none">
            ◀
          </button>
          <div class="flex-1 bg-white border border-black p-1 text-center text-[10.5px] text-black font-black select-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] truncate">
            <div class="font-black avatar-name-${d.id} truncate text-[10px]">${d.avatarName}</div>
          </div>
          <button id="avatar-next-${d.id}" class="py-1 px-2 cursor-pointer bg-white border border-black text-[10px] text-black font-black hover:bg-black hover:text-white transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none">
            ▶
          </button>
        </div>
      </div>
    `,t.appendChild(w),e.appendChild(t),setTimeout(()=>{const x=document.getElementById(`pname-input-${d.id}`);x&&x.addEventListener("input",m=>{d.name=m.target.value||`Oyuncu ${d.id}`});const k=document.getElementById(`avatar-prev-${d.id}`),o=document.getElementById(`avatar-next-${d.id}`),f=w.querySelector(`.avatar-name-${d.id}`);function b(m){y=(y+m+W.length)%W.length;const c=W[y];d.avatarName=c.name,d.emoji=c.emoji,d.customImage=null,z(d);const h=document.getElementById(`avatar-container-${d.id}`);h&&(h.innerHTML=O(d,"w-16 h-16 text-3xl animate-float")),f&&(f.innerText=c.name),_.playTick()}k&&k.addEventListener("click",()=>b(-1)),o&&o.addEventListener("click",()=>b(1))},0)});const n=document.createElement("div");n.className="flex flex-col sm:flex-row gap-2.5 w-full justify-center pt-2",n.innerHTML=`
    <button id="char-back-btn" class="px-5 py-2 bg-white border-2 border-black hover:bg-black hover:text-white text-black font-black tracking-wide cursor-pointer duration-205 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase text-[10px] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none">
      ◀ Geri Dön
    </button>
    <button id="char-shop-btn" class="px-5 py-2 bg-[#FDCB6E] border-2 border-black hover:bg-black hover:text-white text-black font-black tracking-wide cursor-pointer duration-205 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase text-[10px] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none">
      🛒 Mağaza & Gardırop
    </button>
    <button id="char-start-btn" class="px-6 py-2 bg-black text-white border-2 border-black font-black tracking-wider text-[11px] uppercase cursor-pointer hover:bg-white hover:text-black shadow-[3px_3px_0px_0px_rgba(255,222,0,1)] duration-200 transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none">
      Mücadeleyi Başlat 🚀
    </button>
  `,e.appendChild(n),P.appendChild(e),(s=document.getElementById("char-back-btn"))==null||s.addEventListener("click",()=>N("lobby")),(p=document.getElementById("char-shop-btn"))==null||p.addEventListener("click",()=>{re="charSelect",N("costumeShop")}),(u=document.getElementById("char-start-btn"))==null||u.addEventListener("click",()=>{i.players.forEach(d=>{i.scores[d.id]=0,d.score=0}),N("gamesHub")})}const Le={balloonGame:{name:"Balon Şişirme",emoji:"🎈",color:"bg-[#FF6B6B]"},memoryGame:{name:"Hafıza Kartları",emoji:"🧩",color:"bg-[#A29BFE]"},colorTrapGame:{name:"Renk Tuzağı",emoji:"🎨",color:"bg-[#FDCB6E]"},clickDerbyGame:{name:"Işık Avcısı",emoji:"⚡",color:"bg-[#55EFC4]"},raceGame:{name:"Sevimli Koşu",emoji:"🏃",color:"bg-[#FCA311]"}};function Ce(){var b,m,c,h,A,$,r,v,l,g,E,L,B,D,j,T,C,M;if(i.isEliminationMode&&i.players.filter(I=>I.active&&!I.isEliminated).length<=1){setTimeout(()=>{_.playFanfare(),N("gameOver")},50);return}const e=document.createElement("div");e.className="w-full max-w-5xl relative z-10 flex flex-col space-y-5 animate-fade-in";const a=document.createElement("div");a.className="w-full bg-white border-4 border-black p-3 flex flex-wrap items-center justify-between gap-3 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-black relative";let t=`
    <!-- Brand / Title -->
    <div class="flex items-center gap-2 select-none">
      <button id="hub-back-btn" class="px-3 py-1 bg-black text-white hover:bg-red-605 border-2 border-black text-[10px] font-black uppercase cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center transition-colors">
        ⬅ GİRİŞE DÖN
      </button>
      <span class="text-[10px] font-black uppercase font-display hidden sm:inline-block tracking-wider text-black/55">⚡ ARENA KONTROLÜ</span>
    </div>

    <!-- Quick action buttons -->
    <div class="flex flex-wrap gap-2 justify-end">
      <button id="hub-shop-btn" class="text-[10px] font-black uppercase bg-[#FDCB6E] border-2 border-black py-1 px-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-[#FDCB6E] cursor-pointer flex items-center gap-1 transition-all">
        🛍️ MAĞAZA & GİYSİLER
      </button>
      <button id="hub-daily-btn" class="text-[10px] font-black uppercase bg-[#4ECDC4] border-2 border-black py-1 px-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-white cursor-pointer flex items-center gap-1 transition-all relative">
        <span>🎁 GÜNLÜK HEDİYE</span>
        ${fe()?'<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-black rounded-full animate-ping"></span><span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-black rounded-full"></span>':""}
      </button>
      <button id="hub-how-btn" class="text-[10px] font-black uppercase bg-[#FFD2E8] border-2 border-black py-1 px-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-black hover:text-white cursor-pointer flex items-center gap-1 transition-all">
        📖 NASIL OYNANIR?
      </button>
    </div>
  `;a.innerHTML=t;const n=document.createElement("div");n.className="w-full bg-[#EBFBEE] border-2 border-black p-2 sm:p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black flex flex-col space-y-2";const s=i.gamePlaylist||[];let p="";if(s.length===0?p=`
      <div class="flex-1 border border-dashed border-black/25 p-1.5 text-center text-[10.5px] font-bold text-black/60 select-none bg-emerald-50/40">
        📋 Liste Boş. Alttaki butonlardan "➕ Ekle" ile oyun ekleyin veya hızlı sıra yükleyin!
      </div>
    `:p=`
      <div class="flex flex-wrap items-center gap-1 flex-1 p-1 bg-emerald-50/70 border border-black min-h-[30px]">
        ${s.map((S,I)=>{const F=Le[S];return F?`
            <div class="flex items-center gap-1 ${F.color} border border-black py-0.5 px-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[9px] font-black uppercase text-black">
              <span>${I+1}. ${F.emoji} ${F.name}</span>
              <button data-remove-idx="${I}" class="ml-1 px-0.5 text-red-600 hover:bg-black hover:text-white rounded transition-colors select-none font-bold text-[9px]" title="Kaldır">✕</button>
            </div>
            ${I<s.length-1?'<span class="text-black font-black text-[9px]">➔</span>':""}
          `:""}).join("")}
      </div>
    `,n.innerHTML=`
    <div class="flex items-center justify-between gap-1.5 border-b border-black/20 pb-1">
      <div>
        <h4 class="text-xs font-black text-black uppercase leading-none font-display">Sıralı Turnuva Planlayıcı</h4>
      </div>
      <div class="flex items-center gap-1">
        <button id="playlist-preset-btn" class="text-[8.5px] font-black uppercase bg-[#FDCB6E] hover:bg-black hover:text-[#FDCB6E] border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all">
          ⚡ Hızlı Sıra
        </button>
        <button id="playlist-clear-btn" class="text-[8.5px] font-black uppercase bg-red-50 hover:bg-red-600 hover:text-white border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all">
          🗑️ Temizle
        </button>
      </div>
    </div>
    
    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
      ${p}
      <button id="playlist-start-btn" class="py-1.5 px-3 shrink-0 bg-black text-white hover:bg-[#4ECDC4] hover:text-black border border-black font-black tracking-wide text-[10px] uppercase cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] transition-colors active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center justify-center gap-1 ${s.length===0?"opacity-40 pointer-events-none":""}">
        🚀 Turnuvayı Başlat (${s.length} Oyun)
      </button>
    </div>
  `,e.appendChild(a),i.isEliminationMode){const S=document.createElement("div");S.className="w-full",S.innerHTML=`
      <div class="w-full bg-[#FFF0F2] border-4 border-[#FF7675] p-3 text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] relative select-none">
        <div class="flex items-center gap-2 mb-2 pb-1.5 border-b-2 border-[#FF7675]/35 justify-between flex-wrap">
          <div class="flex items-center gap-1.5">
            <span class="text-xl animate-pulse">🔥</span>
            <div>
              <h4 class="text-xs font-display font-black uppercase text-black leading-none">ELEMELİ TURNUVA STATÜSÜ</h4>
            </div>
          </div>
          <span class="text-[8.5px] font-black uppercase bg-[#FF7675] text-white px-2 py-0.5 border-2 border-black shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">KÜRSÜ DURUMU</span>
        </div>
        
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          ${i.players.filter(I=>I.active).map(I=>I.isEliminated?`
                <div class="flex items-center justify-between p-2 bg-neutral-100 border-2 border-neutral-400 opacity-55 text-neutral-500 line-through">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="text-xs shrink-0 select-none">💀</span>
                    <span class="font-bold text-[10px] truncate">${I.name}</span>
                  </div>
                  <span class="font-mono text-[8px] bg-red-100 text-red-700 px-1 py-0.5 border border-red-300 font-extrabold tracking-wide rounded">ELENDİ</span>
                </div>
              `:`
                <div class="flex items-center justify-between p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="text-xs shrink-0 select-none">🔋</span>
                    <span class="font-extrabold text-[10.5px] truncate text-black">${I.name}</span>
                  </div>
                  <span class="font-mono text-[8.5px] bg-[#55EFC4] text-black px-1.5 py-0.5 border border-black font-extrabold flex items-center gap-0.5 shadow-[0.5px_0.5px_0_rgba(0,0,0,1)] animate-pulse rounded">AKTİF</span>
                </div>
              `).join("")}
        </div>
      </div>
    `,e.appendChild(S)}e.appendChild(n);const u=document.createElement("div");u.className="text-left pl-1 mt-1 shrink-0 select-none",u.innerHTML=`
    <h3 class="text-xs sm:text-sm font-display font-black text-black uppercase tracking-wider flex items-center gap-1.5">🎮 MİNİ OYUN SEÇİMİ</h3>
    <p class="text-black/60 text-[10px] font-bold">Hızlıca tek oyun başlat veya turnuva playlistine sırayla ekle!</p>
  `,e.appendChild(u);const d=document.createElement("div");d.className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 w-full";const w=document.createElement("div");w.className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2.5 group transition-all duration-350 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",w.innerHTML=`
    <div class="space-y-1.5 text-left text-black flex items-center gap-2">
      <div class="w-7 h-7 shrink-0 rounded-none bg-[#A29BFE] border border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        🧩
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-display font-black text-black truncate leading-tight">Hafıza Kartları</h4>
        <p class="text-black/60 text-[9.5px] font-bold truncate leading-tight mt-0.5">
          Kart çiftlerini eşleştir!
        </p>
      </div>
    </div>
    <div class="flex gap-1 w-full pt-1 border-t border-dashed border-black/10">
      <button id="play-now-memory" class="flex-1 py-1 bg-black hover:bg-[#A29BFE] text-white hover:text-black border border-black font-black text-[10px] uppercase transition-colors cursor-pointer text-center">
        ▶ OYNA
      </button>
      <button id="add-queue-memory" class="px-2 py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black text-black font-black text-[10px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Ortak Listeye Ekle">
        ➕ Ekle
      </button>
    </div>
  `,d.appendChild(w);const y=document.createElement("div");y.className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2.5 group transition-all duration-350 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",y.innerHTML=`
    <div class="space-y-1.5 text-left text-black flex items-center gap-2">
      <div class="w-7 h-7 shrink-0 rounded-none bg-[#FF6B6B] border border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        🎈
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-display font-black text-black truncate leading-tight">Balon Şişirme</h4>
        <p class="text-black/60 text-[9.5px] font-bold truncate leading-tight mt-0.5">
          Seri tuşlayıp balonu patlat!
        </p>
      </div>
    </div>
    <div class="flex gap-1 w-full pt-1 border-t border-dashed border-black/10">
      <button id="play-now-balloon" class="flex-1 py-1 bg-black hover:bg-[#FF6B6B] text-white hover:text-black border border-black font-black text-[10px] uppercase transition-colors cursor-pointer text-center">
        ▶ OYNA
      </button>
      <button id="add-queue-balloon" class="px-2 py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black text-black font-black text-[10px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Ortak Listeye Ekle">
        ➕ Ekle
      </button>
    </div>
  `,d.appendChild(y);const x=document.createElement("div");x.className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2.5 group transition-all duration-350 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",x.innerHTML=`
    <div class="space-y-1.5 text-left text-black flex items-center gap-2">
      <div class="w-7 h-7 shrink-0 rounded-none bg-[#FDCB6E] border border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        🎨
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-display font-black text-black truncate leading-tight">Renk Tuzağı</h4>
        <p class="text-black/60 text-[9.5px] font-bold truncate leading-tight mt-0.5">
          Kelime ve yazı rengi aynıysa bas!
        </p>
      </div>
    </div>
    <div class="flex gap-1 w-full pt-1 border-t border-dashed border-black/10">
      <button id="play-now-colorTrap" class="flex-1 py-1 bg-black hover:bg-[#FDCB6E] text-white hover:text-black border border-black font-black text-[10px] uppercase transition-colors cursor-pointer text-center">
        ▶ OYNA
      </button>
      <button id="add-queue-colorTrap" class="px-2 py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black text-black font-black text-[10px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Ortak Listeye Ekle">
        ➕ Ekle
      </button>
    </div>
  `,d.appendChild(x);const k=document.createElement("div");k.className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2.5 group transition-all duration-350 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",k.innerHTML=`
    <div class="space-y-1.5 text-left text-black flex items-center gap-2">
      <div class="w-7 h-7 shrink-0 rounded-none bg-[#55EFC4] border border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        ⚡
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-display font-black text-black truncate leading-tight">Işık Avcısı</h4>
        <p class="text-black/60 text-[9.5px] font-bold truncate leading-tight mt-0.5">
          Lamba yeşil olduğunda tıkla!
        </p>
      </div>
    </div>
    <div class="flex gap-1 w-full pt-1 border-t border-dashed border-black/10">
      <button id="play-now-clickDerby" class="flex-1 py-1 bg-black hover:bg-[#55EFC4] text-white hover:text-black border border-black font-black text-[10px] uppercase transition-colors cursor-pointer text-center">
        ▶ OYNA
      </button>
      <button id="add-queue-clickDerby" class="px-2 py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black text-black font-black text-[10px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Oyunu Listeye Ekle">
        ➕ Ekle
      </button>
    </div>
  `,d.appendChild(k);const o=document.createElement("div");o.className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2.5 group transition-all duration-350 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",o.innerHTML=`
    <div class="space-y-1.5 text-left text-black flex items-center gap-2">
      <div class="w-7 h-7 shrink-0 rounded-none bg-[#FCA311] border border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        🏃
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-display font-black text-black truncate leading-tight">Sevimli Koşu</h4>
        <p class="text-black/60 text-[9.5px] font-bold truncate leading-tight mt-0.5">
          Muzlardan kaçıp finişe koş!
        </p>
      </div>
    </div>
    <div class="flex gap-1 w-full pt-1 border-t border-dashed border-black/10">
      <button id="play-now-raceGame" class="flex-1 py-1 bg-black hover:bg-[#FCA311] text-white hover:text-black border border-black font-black text-[10px] uppercase transition-colors cursor-pointer text-center">
        ▶ OYNA
      </button>
      <button id="add-queue-raceGame" class="px-2 py-1 bg-[#4ECDC4] hover:bg-black hover:text-white border border-black text-black font-black text-[10px] uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Oyunu Listeye Ekle">
        ➕ Ekle
      </button>
    </div>
  `,d.appendChild(o),e.appendChild(d);const f=document.createElement("div");f.className="flex justify-center w-full pt-2",f.innerHTML=`
    <button id="end-party-btn" class="px-8 py-3.5 bg-[#FF6B6B] text-black border-4 border-black font-black font-sans tracking-widest text-xs uppercase rounded-none cursor-pointer hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
      🏆 TURNUVAYI SONLANDIR VE KAZANANI GÖR!
    </button>
  `,e.appendChild(f),P.appendChild(e),(b=document.getElementById("end-party-btn"))==null||b.addEventListener("click",()=>{_.playFanfare(),N("gameOver")}),(m=document.getElementById("hub-back-btn"))==null||m.addEventListener("click",()=>{_.playTick(),N("lobby")}),(c=document.getElementById("hub-shop-btn"))==null||c.addEventListener("click",()=>{re="gamesHub",N("costumeShop")}),(h=document.getElementById("hub-daily-btn"))==null||h.addEventListener("click",()=>{_.playTick(),se()}),(A=document.getElementById("hub-how-btn"))==null||A.addEventListener("click",()=>{_.playTick(),ge("general")}),($=document.getElementById("play-now-memory"))==null||$.addEventListener("click",()=>{i.playlistActive=!1,N("memoryGame")}),(r=document.getElementById("play-now-balloon"))==null||r.addEventListener("click",()=>{i.playlistActive=!1,N("balloonGame")}),(v=document.getElementById("play-now-colorTrap"))==null||v.addEventListener("click",()=>{i.playlistActive=!1,N("colorTrapGame")}),(l=document.getElementById("play-now-clickDerby"))==null||l.addEventListener("click",()=>{i.playlistActive=!1,N("clickDerbyGame")}),(g=document.getElementById("play-now-raceGame"))==null||g.addEventListener("click",()=>{i.playlistActive=!1,N("raceGame")}),(E=document.getElementById("add-queue-memory"))==null||E.addEventListener("click",()=>{i.gamePlaylist||(i.gamePlaylist=[]),i.gamePlaylist.push("memoryGame"),_.playPowerUp(),N("gamesHub")}),(L=document.getElementById("add-queue-balloon"))==null||L.addEventListener("click",()=>{i.gamePlaylist||(i.gamePlaylist=[]),i.gamePlaylist.push("balloonGame"),_.playPowerUp(),N("gamesHub")}),(B=document.getElementById("add-queue-colorTrap"))==null||B.addEventListener("click",()=>{i.gamePlaylist||(i.gamePlaylist=[]),i.gamePlaylist.push("colorTrapGame"),_.playPowerUp(),N("gamesHub")}),(D=document.getElementById("add-queue-clickDerby"))==null||D.addEventListener("click",()=>{i.gamePlaylist||(i.gamePlaylist=[]),i.gamePlaylist.push("clickDerbyGame"),_.playPowerUp(),N("gamesHub")}),(j=document.getElementById("add-queue-raceGame"))==null||j.addEventListener("click",()=>{i.gamePlaylist||(i.gamePlaylist=[]),i.gamePlaylist.push("raceGame"),_.playPowerUp(),N("gamesHub")}),(T=document.getElementById("playlist-preset-btn"))==null||T.addEventListener("click",()=>{i.gamePlaylist=["balloonGame","memoryGame","colorTrapGame","clickDerbyGame","raceGame"],_.playPowerUp(),N("gamesHub")}),(C=document.getElementById("playlist-clear-btn"))==null||C.addEventListener("click",()=>{i.gamePlaylist=[],i.playlistActive=!1,i.currentPlaylistIndex=0,_.playTick(),N("gamesHub")}),(M=document.getElementById("playlist-start-btn"))==null||M.addEventListener("click",()=>{if(i.gamePlaylist&&i.gamePlaylist.length>0){i.playlistActive=!0,i.currentPlaylistIndex=0;const S=i.gamePlaylist[0];N(S)}}),e.querySelectorAll("[data-remove-idx]").forEach(S=>{S.addEventListener("click",I=>{I.stopPropagation();const F=parseInt(S.getAttribute("data-remove-idx")||"0");i.gamePlaylist&&F>=0&&(i.gamePlaylist.splice(F,1),_.playTick(),N("gamesHub"))})})}function Se(){var k;const e=i.isEliminationMode?i.players.filter(o=>o.active&&!o.isEliminated):i.players.filter(o=>o.active),a={};e.forEach(o=>a[o.id]=0);let t=!1;const n=document.createElement("div");n.className="w-full max-w-6xl relative z-10 flex flex-col h-[90vh] max-h-[850px] justify-between space-y-4 animate-fade-in select-none";const s=document.createElement("div");s.className="bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4",s.innerHTML=`
    <div>
      <h2 class="text-xl sm:text-2xl font-display font-black text-black uppercase">🎈 BALON ŞİŞİRME GEÇİDİ</h2>
      <p class="text-black font-bold text-xs">Butonuna art arda en HIZLI tıklayan kendi balonunu %100 yapıp patlatarak kazanır!</p>
    </div>
    <button id="balloon-quit" class="px-4 py-2 text-xs font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
      ◀ Arenaya Dön
    </button>
  `,n.appendChild(s);const p=document.createElement("div");p.className=`grid gap-4 flex-1 ${e.length===2?"grid-cols-2":e.length===3?"grid-cols-3":e.length===4?"grid-cols-4":"grid-cols-1"}`,e.forEach(o=>{const f=document.createElement("div");f.className=`${o.color} border-4 border-black p-4 flex flex-col justify-between items-center relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`,f.id=`balloon-col-${o.id}`,f.innerHTML=`
      <!-- Score banner -->
      <div class="flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative z-10 select-none">
        ${O(o,"w-8 h-8 text-md")}
        <span class="font-black text-xs text-black uppercase">${o.name}</span>
      </div>

      <!-- Balloon Visual area -->
      <div class="flex-1 flex flex-col items-center justify-center relative w-full h-full p-4 min-h-[220px]">
        <!-- SVG Balloon representing growth -->
        <div id="balloon-svg-${o.id}" class="relative transition-all duration-150 ease-out flex flex-col items-center justify-center" style="transform: scale(0.65); transform-origin: center;">
          
          <!-- Balloon Body -->
          <svg class="w-28 h-32 sm:w-32 sm:h-36 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M 50 10 C 20 10, 10 40, 10 70 C 10 90, 30 110, 50 110 C 70 110, 90 90, 90 70 C 90 40, 80 10, 50 10 Z" fill="${o.hexColor}" stroke="black" stroke-width="4"/>
            <!-- Triangle Knot -->
            <polygon points="50,110 42,118 58,118" fill="black"/>
          </svg>
          
          <!-- Cute interactive cartoon facial details -->
          <div id="face-${o.id}" class="absolute text-4xl font-bold select-none leading-none mt-[-10px]">
            😐
          </div>

          <!-- Balloon base hanger line -->
          <div class="w-1 h-12 bg-black absolute top-[115px]"></div>
        </div>

        <div id="burst-effect-${o.id}" class="hidden absolute text-5xl font-black text-black bg-white border-4 border-black px-4 py-2 rotate-[-4deg] animate-bounce select-none shadow-[4px_4px_0_rgba(0,0,0,1)] z-20">💥 PATLADI!</div>
      </div>

      <!-- Dynamic Info and Interactive Button -->
      <div class="w-full space-y-3 relative z-10">
        <div class="flex justify-between items-center text-[10px] font-mono font-black border-2 border-black bg-white px-2 py-0.5 shadow-[2px_2px_0_rgba(0,0,0,1)]">
          <span class="text-black uppercase">ŞİŞME ORANI:</span>
          <span id="percent-txt-${o.id}" class="font-extrabold text-black">0%</span>
        </div>
        
        <div class="w-full bg-white border-4 border-black h-7 relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div id="bar-${o.id}" class="h-full bg-black transition-all duration-150" style="width: 0%"></div>
        </div>

        <!-- Big touchable action button container -->
        <button id="tap-btn-${o.id}" class="w-full py-3.5 bg-white border-4 border-black font-black text-xs text-black uppercase tracking-widest cursor-pointer hover:bg-black hover:text-white transition shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex flex-col items-center">
          <span>ŞİŞİR!</span>
          <span class="text-[9px] text-black/60 font-mono mt-0.5 font-bold">TUŞ: [${o.keyLabel}]</span>
        </button>
      </div>
    `,p.appendChild(f)}),n.appendChild(p);const u=document.createElement("div");u.id="balloon-result-modal",u.className="hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in",n.appendChild(u),P.appendChild(n);function d(o){return o<30?"😐":o<60?"😮":o<85?"🥵":"🤯"}function w(o){var A;if(t)return;a[o]=Math.min(100,a[o]+3);const f=a[o];_.playTick();const b=document.getElementById(`bar-${o}`),m=document.getElementById(`percent-txt-${o}`),c=document.getElementById(`balloon-svg-${o}`),h=document.getElementById(`face-${o}`);if(b&&(b.style.width=`${f}%`),m&&(m.innerText=`${f}%`),h&&(h.innerText=d(f)),c){const $=.65+f/100*.95;c.style.transform=`scale(${$})`}if(f>=100){t=!0,_.playExplode();const $=i.players.find(B=>B.id===o);$.balloonWinsCount=($.balloonWinsCount||0)+1,z($),$.balloonWinsCount>=5&&oe($,"balloon_wins_5");const r=document.getElementById(`burst-effect-${o}`);r&&(r.className="absolute text-6xl text-amber-400 font-extrabold animate-bounce z-20 flex flex-col items-center"),c&&(c.className="hidden");const v=Object.entries(a).sort((B,D)=>D[1]-B[1]),l=v.map(([B])=>i.players.find(D=>D.id===parseInt(B))),g=X(l),E=[35,20,10,5];let L=`
        <div class="bg-white border-4 border-black p-6 sm:p-10 max-w-xl w-full flex flex-col items-center space-y-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black animate-fade-in relative z-40">
          <div class="w-16 h-16 rounded-full ${$.color} border-4 border-black flex items-center justify-center text-4xl shadow animate-bounce">
            🎈
          </div>
          <div>
            <h3 class="text-3xl font-display font-black text-black uppercase tracking-tight">BALON GÖKLERE UÇTU!</h3>
            <p class="text-sm font-bold text-black/70 mt-1">${$.name} hız rekoru kırarak balonunu ilk uçuran şampiyon oldu!</p>
          </div>

          <div class="w-full space-y-3.5 my-4">
            <span class="block text-[10px] font-mono text-black/60 font-black uppercase tracking-widest text-left">FİNAL SKOR KAZANIMLARI</span>
      `;v.forEach(([B,D],j)=>{const T=parseInt(B),C=i.players.find(F=>F.id===T),M=E[j]||0;let S="";const I=g[C.id];i.isEliminationMode&&I&&(S=`<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${I.colorClass}">${I.label}</span>`,I.status==="eliminated"&&(C.isEliminated=!0)),C.score+=M,C.globalCoins=(C.globalCoins||0)+M,z(C),L+=`
          <div class="flex items-center justify-between bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div class="flex items-center gap-3">
              <span class="font-mono text-xs text-black font-black">#${j+1}</span>
              ${O(C,"w-8 h-8 text-sm")}
              <span class="font-black text-black text-sm">${C.name}</span>
              ${S}
            </div>
            <div class="flex items-center gap-2 font-semibold text-black">
              <span class="text-xs font-mono font-bold">%${D} vana</span>
              <span class="font-extrabold text-[11px] bg-[#FDCB6E] border border-black px-2 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">+${M} Puan</span>
              <span class="font-extrabold text-[11px] bg-[#FFEAA7] border border-black px-2 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0 flex items-center gap-0.5">🪙+${M}</span>
            </div>
          </div>
        `}),L+=`
         </div>
         <button id="balloon-modal-continue" class="w-full py-4 bg-[#4ECDC4] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer">
           Liderlik Kürsüsüne Dön
         </button>
        </div>
      `,u&&(u.innerHTML=L,u.classList.remove("hidden"),(A=document.getElementById("balloon-modal-continue"))==null||A.addEventListener("click",()=>{Q()}))}}e.forEach(o=>{const f=document.getElementById(`tap-btn-${o.id}`);if(f){f.addEventListener("click",()=>w(o.id)),f.addEventListener("touchstart",m=>{m.preventDefault(),f.classList.add("scale-95","bg-black","text-white"),w(o.id)},{passive:!1});const b=()=>{f.classList.remove("scale-95","bg-black","text-white")};f.addEventListener("touchend",m=>{m.preventDefault(),setTimeout(b,50)},{passive:!1}),f.addEventListener("touchcancel",b)}});const y=o=>{if(o.repeat)return;const f=e.find(b=>b.key===o.code);if(f){const b=document.getElementById(`tap-btn-${f.id}`);b&&(b.classList.add("bg-black","text-white","scale-95"),setTimeout(()=>b.classList.remove("bg-black","text-white","scale-95"),80)),w(f.id)}};window.addEventListener("keydown",y),(k=document.getElementById("balloon-quit"))==null||k.addEventListener("click",()=>{window.removeEventListener("keydown",y),N("gamesHub")});const x=new MutationObserver(o=>{document.getElementById("balloon-quit")||(window.removeEventListener("keydown",y),x.disconnect())});x.observe(P,{childList:!0})}function Ie(){var r;const e=i.isEliminationMode?i.players.filter(v=>v.active&&!v.isEliminated):i.players.filter(v=>v.active);let a=0;const t=["👑","⚔️","💎","🛡️","🪙","🔑","🍎","⚡"];let n=[...t,...t];for(let v=n.length-1;v>0;v--){const l=Math.floor(Math.random()*(v+1));[n[v],n[l]]=[n[l],n[v]]}let s=[],p=[];const u={};e.forEach(v=>u[v.id]=0);const d={};e.forEach(v=>d[v.id]=0);let w=!1;const y=document.createElement("div");y.className="w-full max-w-5xl relative z-10 flex flex-col gap-5 animate-fade-in select-none text-black";const x=document.createElement("div");x.className="bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4",x.innerHTML=`
    <div>
      <h2 class="text-xl sm:text-2xl font-display font-black text-black uppercase">🧩 HAFIZA KART MÜCADELESİ</h2>
      <p class="text-black font-semibold text-xs mt-1">Kart çiftlerini eşleştirerek her çift için +15 puan kazanın. Sıra dönmektedir!</p>
    </div>
    <div class="flex items-center gap-2">
      <button id="memory-quit" class="px-4 py-2 text-xs font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
        ◀ Arenaya Dön
      </button>
    </div>
  `,y.appendChild(x);const k=document.createElement("div");k.className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start";const o=document.createElement("div");o.className="bg-white border-4 border-black p-4 space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",k.appendChild(o);const f=document.createElement("div");f.className="md:col-span-3 flex flex-col items-center space-y-4";const b=document.createElement("div");b.className="grid grid-cols-4 gap-3 bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full aspect-square max-w-[480px]",f.appendChild(b),k.appendChild(f),y.appendChild(k);const m=document.createElement("div");m.className="hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in",y.appendChild(m),P.appendChild(y);function c(){const v=e[a];o.innerHTML=`
      <div class="space-y-1.5 text-center sm:text-left border-b-2 border-black pb-3">
        <span class="text-[10px] font-mono text-black/60 uppercase tracking-widest block font-black">AKTİF SIRADA</span>
        <div id="active-p-glow" class="px-4 py-2.5 bg-black border-2 border-black text-white font-black flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] animate-pulse">
          <span class="text-xl">${v.emoji}</span>
          <span>${v.name}</span>
        </div>
      </div>

      <div class="space-y-2.5">
        <span class="block text-[10px] font-mono text-black/60 uppercase tracking-widest font-black">MİNİ SKORLAR</span>
        <div class="space-y-2">
    `,e.forEach((l,g)=>{const E=g===a;o.innerHTML+=`
        <div class="flex items-center justify-between p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${E?l.color+" translate-y-0.5 shadow-none":""} transition-all">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full ${l.color} border-2 border-black flex items-center justify-center text-sm shadow animate-bounce" style="animation-duration: ${1+g*.2}s">
              ${l.emoji}
            </div>
            <span class="text-xs font-black text-black">${l.name}</span>
          </div>
          <div class="text-xs font-mono font-black text-black bg-white border border-black px-1.5 py-0.5">
            ${u[l.id]} px
          </div>
        </div>
      `}),o.innerHTML+=`
        </div>
      </div>
    `,b.className=`grid grid-cols-4 gap-3 bg-white border-4 ${v.borderColor} p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full aspect-square max-w-[480px] transition-all duration-300`}function h(){b.innerHTML="",n.forEach((v,l)=>{const g=document.createElement("div");g.className="perspective-1000 aspect-square cursor-pointer";const E=s.includes(l)||p.includes(l);g.innerHTML=`
        <div class="w-full h-full duration-450 preserve-3d relative transition-transform ${E?"rotate-y-180":""}">
          <!-- Card Front Face (Mystery side) -->
          <div class="absolute inset-0 bg-[#FF6B6B] border-4 border-black hover:bg-black hover:text-white rounded-none flex items-center justify-center text-xl sm:text-3xl backface-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black text-black select-none">
            ?
          </div>
          <!-- Card Back Face (Symbol side) -->
          <div class="absolute inset-0 bg-white border-4 border-black rounded-none flex items-center justify-center text-3xl sm:text-5xl backface-hidden rotate-y-180 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-br from-yellow-105 to-white">
            ${v}
          </div>
        </div>
      `,!E&&!w&&g.addEventListener("click",()=>A(l)),b.appendChild(g)})}function A(v){if(!(w||s.length>=2||s.includes(v))&&(s.push(v),_.playTick(),h(),s.length===2)){w=!0;const[l,g]=s;if(n[l]===n[g])_.playSuccess(),setTimeout(()=>{p.push(l,g);const E=e[a];u[E.id]+=1,s=[],w=!1,h(),c(),p.length===n.length&&$()},600);else{_.playFail();const E=e[a];d[E.id]=(d[E.id]||0)+1,setTimeout(()=>{s=[],w=!1,a=(a+1)%e.length,h(),c()},1200)}}}function $(){var B;_.playFanfare();const v=[35,20,10,5],l=Object.entries(u).sort((D,j)=>j[1]-D[1]),g=l.map(([D])=>i.players.find(j=>j.id===parseInt(D))),E=X(g);let L=`
      <div class="bg-white border-4 border-black p-6 sm:p-10 max-w-xl w-full flex flex-col items-center space-y-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black relative overflow-hidden animate-fade-in z-40">
        <div class="text-5xl animate-bounce">🏆</div>
        <div>
          <h3 class="text-2xl sm:text-3xl font-display font-black text-black uppercase tracking-tight">Hafıza Arenası Tamamlandı!</h3>
          <p class="text-black/70 font-semibold text-xs mt-1">Eşleştirme mücadelesi bitti. Arena kupaları sahiplerine dağıtıldı!</p>
        </div>

        <div class="w-full space-y-3.5 my-4">
          <span class="block text-left text-[10px] font-mono text-black/60 font-black uppercase tracking-wider">SKOR KAZANIMLARI</span>
    `;l.forEach(([D,j],T)=>{const C=parseInt(D),M=i.players.find(U=>U.id===C),S=(v[T]||0)+j*5;let I="";const F=E[M.id];i.isEliminationMode&&F&&(I=`<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${F.colorClass}">${F.label}</span>`,F.status==="eliminated"&&(M.isEliminated=!0)),M.score+=S,M.globalCoins=(M.globalCoins||0)+S;const R=d[M.id]||0;j>=2&&R===0&&oe(M,"perfect_memory"),z(M),L+=`
        <div class="flex items-center justify-between bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs text-black font-black">#${T+1}</span>
            ${O(M,"w-8 h-8 text-sm")}
            <span class="font-black text-black text-sm">${M.name}</span>
            ${I}
          </div>
          <div class="text-right flex items-center gap-2">
            <div class="text-right flex flex-col leading-tight shrink-0">
              <span class="text-[10px] font-bold text-black/60 font-mono">${j} Eşleşme</span>
              <span class="font-black text-xs bg-[#FDCB6E] border border-black px-2 mt-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">+${S} Puan</span>
            </div>
            <span class="font-extrabold text-xs bg-[#FFEAA7] border border-black px-2 py-1 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0 flex items-center gap-0.5">🪙+${S}</span>
          </div>
        </div>
      `}),L+=`
        </div>
        <button id="memory-modal-continue" class="w-full py-4 bg-[#A29BFE] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer">
          Liderlik Kürsüsüne Dön
        </button>
      </div>
    `,m&&(m.innerHTML=L,m.classList.remove("hidden"),(B=document.getElementById("memory-modal-continue"))==null||B.addEventListener("click",()=>{Q()}))}(r=document.getElementById("memory-quit"))==null||r.addEventListener("click",()=>N("gamesHub")),c(),h()}function Be(){var j;const e=i.isEliminationMode?i.players.filter(T=>T.active&&!T.isEliminated):i.players.filter(T=>T.active);let a=1;const t=10,n=1800;let s=!1;const p={},u={};e.forEach(T=>{p[T.id]=!1,u[T.id]=0});const d=[{name:"KIRMIZI",hex:"#FF6B6B",turkish:"KIRMIZI"},{name:"MAVİ",hex:"#A29BFE",turkish:"MAVİ"},{name:"YEŞİL",hex:"#2EC4B6",turkish:"YEŞİL"},{name:"SARI",hex:"#E6C619",turkish:"SARI"}];let w="",y="",x="",k=!1,o=null,f=null;const b=document.createElement("div");b.className="w-full max-w-5xl relative z-10 flex flex-col min-h-[580px] justify-between space-y-4 animate-fade-in select-none text-black";const m=document.createElement("div");m.className="bg-white border-4 border-black p-3.5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-3",m.innerHTML=`
    <div class="text-center sm:text-left">
      <h2 class="text-lg sm:text-xl font-display font-black text-black uppercase">🎨 RENK TUZAĞI (COLOR TRAP)</h2>
      <p class="text-black font-semibold text-[11px] mt-0.5">Kelimenin kendisi ile yazı rengi AYNIYSA tuşuna bas! Yanlış basarsan ceza puanı alırsın!</p>
    </div>
    <button id="color-trap-quit" class="px-3.5 py-1.5 text-[11px] font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
      ◀ Ayrıl
    </button>
  `,b.appendChild(m);const c=document.createElement("div");c.className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 items-stretch",b.appendChild(c);const h=document.createElement("div");h.className="md:col-span-1 bg-white border-4 border-black p-3.5 flex flex-col justify-between shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-black",c.appendChild(h);const A=document.createElement("div");A.className="md:col-span-3 bg-white border-4 border-black p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-h-[300px] text-black",c.appendChild(A);const $=document.createElement("div");$.className=`grid gap-2.5 ${e.length===2?"grid-cols-2 lg:grid-cols-2":e.length===3?"grid-cols-3":"grid-cols-2 md:grid-cols-4"}`,b.appendChild($),e.forEach(T=>{const C=document.createElement("button");C.id=`ct-bumper-${T.id}`,C.className=`py-3 bg-white border-4 ${T.borderColor} text-black font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center space-y-1 hover:bg-black hover:text-white active:scale-95 transition-all duration-100 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden`,C.innerHTML=`
      <div class="h-7 w-7 flex items-center justify-center text-lg bg-white border-2 border-black rounded-full select-none shadow">
        ${T.emoji}
      </div>
      <span class="font-bold text-[11px]">${T.name} BASTI!</span>
      <span class="text-[8px] text-black/50 font-mono font-black">TUŞ: [${T.keyLabel}]</span>
    `,C.addEventListener("click",()=>l(T.id)),$.appendChild(C)});const r=document.createElement("div");r.className="hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-4 text-center animate-fade-in",b.appendChild(r),P.appendChild(b);function v(){h.innerHTML=`
      <div class="space-y-3.5">
        <div class="flex items-center justify-between text-xs font-mono font-black border-2 border-black bg-white px-2 py-1 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <span>RAUND:</span>
          <span class="font-black text-[#FF6B6B]">${a} / ${t}</span>
        </div>
        <span class="block text-[8px] font-mono text-black/45 uppercase tracking-widest font-black mt-2">AKTİF TURNUVA SKORLARI</span>
        <div class="space-y-1.5 mt-1">
          ${e.map(T=>`
            <div id="score-sidebar-p-${T.id}" class="flex items-center justify-between p-1.5 bg-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
              <div class="flex items-center gap-1 font-semibold text-black">
                <span class="text-xs">${T.emoji}</span>
                <span class="font-bold text-[11px]">${T.name}</span>
              </div>
              <span class="font-mono text-[11px] font-black bg-white border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">
                ${u[T.id]} Puan
              </span>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="pt-2 border-t-2 border-dashed border-black/20 mt-3">
        <div class="p-2 bg-yellow-50 border-2 border-black font-sans font-bold text-[9px] text-black/80 leading-normal text-center">
          💡 Doğru eşleşmede ilk basan <b class="text-[#FF6B6B] font-extrabold">+2 Puan</b> alır, diğer doğru basanlar <b class="text-black font-black">+1 Puan</b>, yanlış basanlar ise <b class="text-red-500 font-extrabold">-1 Puan</b> kaybeder!
        </div>
      </div>
    `}v();function l(T){var M;if(s||p[T])return;p[T]=!0;const C=document.getElementById(`ct-bumper-${T}`);if(C&&C.classList.add("bg-black","text-white"),k){const I=Object.values(p).filter(F=>F).length===1?2:1;u[T]+=I,_.playSuccess(),g(`+${I} ${(M=i.players.find(F=>F.id===T))==null?void 0:M.name}`,T)}else u[T]=Math.max(0,u[T]-1),_.playFail(),g("-1 CEZA!",T,!0);v()}function g(T,C,M=!1){const S=i.players.find(F=>F.id===C),I=document.createElement("div");I.className=`absolute text-xs font-black border-2 border-black px-2 py-0.5 ${M?"bg-red-500 text-white":S.color+" text-black"} shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] animate-bounce z-20`,I.style.top=`${30+Math.random()*40}%`,I.style.left=`${20+Math.random()*60}%`,I.innerText=T,A.appendChild(I),setTimeout(()=>I.remove(),1e3)}function E(){if(a>t){L();return}e.forEach(S=>{p[S.id]=!1;const I=document.getElementById(`ct-bumper-${S.id}`);I&&I.classList.remove("bg-black","text-white")});const T=Math.floor(Math.random()*d.length);if(Math.random()<.45)w=d[T].name,y=d[T].hex,x=d[T].turkish,k=!0;else{w=d[T].name;const S=(T+1+Math.floor(Math.random()*(d.length-1)))%d.length;y=d[S].hex,x=d[S].turkish,k=w===x}v(),A.innerHTML=`
      <div class="text-center space-y-4.5 flex flex-col items-center min-w-[260px] sm:min-w-[380px]">
        <div>
          <span class="text-[9px] font-mono font-black border-2 border-black bg-black text-white px-2 py-0.5 shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
            SORU RAUNDU: ${a} / ${t}
          </span>
        </div>
        
        <div class="p-6 sm:p-8 border-4 border-black w-full bg-[#FAFAFA] flex flex-col items-center justify-center relative shadow-[4px_4px_0_rgba(0,0,0,1)] select-none">
          <h2 class="text-4xl sm:text-5xl font-sans font-black tracking-tight select-none uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.15)]" style="color: ${y};">
            ${w}
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
    `,_.playTick();let M=n;f&&clearInterval(f),f=setInterval(()=>{M-=100;const S=document.getElementById("ct-round-bar");S&&(S.style.width=`${M/n*100}%`)},100),o&&clearTimeout(o),o=setTimeout(()=>{a++,E()},n)}function L(){var U;s=!0,o&&clearTimeout(o),f&&clearInterval(f);const T=Object.entries(u).sort((H,q)=>q[1]-H[1]),C=T.map(([H])=>i.players.find(q=>q.id===parseInt(H))),M=X(C),S=parseInt(T[0][0]),I=i.players.find(H=>H.id===S),F=[35,20,10,5];let R=`
      <div class="bg-white border-4 border-black p-5 sm:p-8 max-w-xl w-full flex flex-col items-center space-y-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black animate-fade-in relative z-45">
        <div class="w-14 h-14 rounded-full ${I.color} border-4 border-black flex items-center justify-center text-4xl shadow animate-bounce">
          🎨
        </div>
        <div>
          <h3 class="text-xl sm:text-2xl font-display font-black text-black uppercase tracking-tight">RENK ŞAMPİYONU</h3>
          <p class="text-xs font-bold text-black/70 mt-1">${I.name} renk algısını mükemmel şekilde çözerek galibiyete ulaştı!</p>
        </div>

        <div class="w-full space-y-2.5 my-3">
          <span class="block text-[9px] font-mono text-black/60 font-black uppercase tracking-widest text-left">FİNAL PUAN DAĞILIMI</span>
    `;T.forEach(([H,q],ie)=>{const he=parseInt(H),Y=i.players.find(ke=>ke.id===he),ee=F[ie]||0;let ce="";const te=M[Y.id];i.isEliminationMode&&te&&(ce=`<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${te.colorClass}">${te.label}</span>`,te.status==="eliminated"&&(Y.isEliminated=!0)),Y.score+=ee,Y.globalCoins=(Y.globalCoins||0)+ee,z(Y),R+=`
        <div class="flex items-center justify-between bg-white border-2 border-black p-2.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <div class="flex items-center gap-2.5">
            <span class="font-mono text-xs text-black font-black">#${ie+1}</span>
            ${O(Y,"w-7 h-7 text-xs")}
            <span class="font-black text-xs text-black">${Y.name}</span>
            ${ce}
          </div>
          <div class="flex items-center gap-1.5 font-semibold text-black">
            <span class="text-xs font-mono font-black">${q} Pts</span>
            <span class="font-extrabold text-[9px] bg-[#FDCB6E] border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">+${ee} Tur Pts</span>
            <span class="font-extrabold text-[9px] bg-[#FFEAA7] border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">🪙+${ee}</span>
          </div>
        </div>
      `}),R+=`
       </div>
       <button id="color-trap-modal-continue" class="w-full py-3.5 bg-[#4ECDC4] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
         Arena Kürsüsüne İlerle
       </button>
      </div>
    `,_.playFanfare(),r.innerHTML=R,r.classList.remove("hidden"),(U=document.getElementById("color-trap-modal-continue"))==null||U.addEventListener("click",()=>{Q()})}const B=T=>{if(T.repeat)return;const C=e.find(M=>M.key===T.code);if(C){const M=document.getElementById(`ct-bumper-${C.id}`);M&&(M.classList.add("bg-black","text-white","scale-95"),setTimeout(()=>M.classList.remove("scale-95"),80)),l(C.id)}};window.addEventListener("keydown",B),(j=document.getElementById("color-trap-quit"))==null||j.addEventListener("click",()=>{o&&clearTimeout(o),f&&clearInterval(f),window.removeEventListener("keydown",B),N("gamesHub")});const D=new MutationObserver(()=>{document.getElementById("color-trap-quit")||(o&&clearTimeout(o),f&&clearInterval(f),window.removeEventListener("keydown",B),D.disconnect())});D.observe(P,{childList:!0}),E()}function Me(){var v;const e=i.isEliminationMode?i.players.filter(l=>l.active&&!l.isEliminated):i.players.filter(l=>l.active);let a=15,t=!1;const n={};e.forEach(l=>{n[l.id]=0});let s="red",p=null,u=null;const d=document.createElement("div");d.className="w-full max-w-5xl relative z-10 flex flex-col min-h-[580px] justify-between space-y-4 animate-fade-in select-none text-black";const w=document.createElement("div");w.className="bg-white border-4 border-black p-3 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-3",w.innerHTML=`
    <div class="text-center sm:text-left">
      <h2 class="text-lg sm:text-xl font-display font-black text-black uppercase">⚡ IŞIK AVCISI (LIGHT HUNTER)</h2>
      <p class="text-black font-semibold text-[11px] mt-0.5">Lamba <b class="text-emerald-500 font-extrabold">YEŞİL</b> yandığında çılgınlar gibi bas! <b class="text-yellow-500 font-extrabold">SARI</b> yandığında -1, <b class="text-red-500 font-extrabold">KIRMIZI</b> yandığında -2 ceza alırsın!</p>
    </div>
    <button id="click-derby-quit" class="px-3.5 py-1.5 text-[11px] font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
      ◀ Ayrıl
    </button>
  `,d.appendChild(w);const y=document.createElement("div");y.className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 items-stretch",d.appendChild(y);const x=document.createElement("div");x.className="md:col-span-1 bg-white border-4 border-black p-3.5 flex flex-col justify-between shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-black",y.appendChild(x);const k=document.createElement("div");k.className="md:col-span-3 bg-[#FAFAFA] border-4 border-black p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-h-[300px] transition-colors duration-250 text-black",y.appendChild(k);const o=document.createElement("div");o.className=`grid gap-2.5 ${e.length===2?"grid-cols-2 lg:grid-cols-2":e.length===3?"grid-cols-3":"grid-cols-2 md:grid-cols-4"}`,d.appendChild(o),e.forEach(l=>{const g=document.createElement("button");g.id=`cd-bumper-${l.id}`,g.className=`py-3 bg-white border-4 ${l.borderColor} text-black font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center space-y-1 hover:bg-black hover:text-white active:scale-95 transition-all duration-100 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden`,g.innerHTML=`
      <div class="h-7 w-7 flex items-center justify-center text-lg bg-white border-2 border-black rounded-full select-none shadow">
        ${l.emoji}
      </div>
      <span class="font-extrabold text-[11px]">${l.name}</span>
      <span class="text-[8px] text-black/50 font-mono font-bold">TUŞ: [${l.keyLabel}]</span>
    `,g.addEventListener("click",()=>m(l.id)),o.appendChild(g)});const f=document.createElement("div");f.className="hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-4 text-center animate-fade-in",d.appendChild(f),P.appendChild(d);function b(){x.innerHTML=`
      <div class="space-y-3.5">
        <div class="flex items-center justify-between text-xs font-mono font-black border-2 border-black bg-white px-2 py-1 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <span>SÜRE:</span>
          <span class="font-black text-[#FF6B6B] animate-pulse">${a} saniye</span>
        </div>
        <span class="block text-[8px] font-mono text-black/45 uppercase tracking-widest font-black mt-2">CANLI MASH SKORLARI</span>
        <div class="space-y-1.5 mt-1">
          ${e.map(l=>`
            <div id="side-score-p-${l.id}" class="flex items-center justify-between p-1.5 bg-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
              <div class="flex items-center gap-1.5 font-semibold text-black">
                <span class="text-xs">${l.emoji}</span>
                <span class="font-bold text-[11px]">${l.name}</span>
              </div>
              <span class="font-mono text-xs font-black bg-white border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">
                ${n[l.id]} tık
              </span>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="pt-2 border-t-2 border-dashed border-black/20 mt-3 text-center">
        <div class="p-2 bg-rose-50 border-2 border-black font-sans font-bold text-[9px] text-black/80 leading-normal">
          🚨 Dikkat! Yeşil harici her tuş vuruşu ağır puan cezası keser! Gözlerin her an lambada olsun!
        </div>
      </div>
    `}b();function m(l){if(t)return;const g=i.players.find(E=>E.id===l);s==="green"?(n[l]++,_.playTick(),c("+1",g.color)):s==="yellow"?(n[l]=Math.max(0,n[l]-1),_.playFail(),c("-1 CEZA","bg-[#F1C40F] text-black",l,!0)):s==="red"&&(n[l]=Math.max(0,n[l]-2),_.playExplode(),c("-2 BOMBA!","bg-[#EA2027] text-white",l,!0)),b()}function c(l,g,E,L=!1){const B=document.createElement("div");B.className=`absolute text-[10px] font-black border-2 border-black px-2 py-0.5 ${g} uppercase tracking-wider animate-bounce shadow-[1px_1px_0px_rgba(0,0,0,1)] z-20`,B.style.top=`${25+Math.random()*50}%`,B.style.left=`${15+Math.random()*70}%`,B.innerText=l,k.appendChild(B),setTimeout(()=>B.remove(),800)}function h(){if(t)return;const l=Math.random();l<.5?s="green":l<.75?s="yellow":s="red";let g="",E="bg-[#FAFAFA]";s==="green"?(E="bg-[#EBFBEE]",g=`
        <div class="flex flex-col items-center space-y-3.5 animate-bounce relative">
          <div class="w-20 h-20 rounded-full bg-emerald-500 border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] animate-ping absolute opacity-30" style="animation-duration: 2.5s;"></div>
          <div class="w-20 h-20 rounded-full bg-[#2ECC71] border-4 border-black flex items-center justify-center text-3xl select-none shadow-[3px_3px_0_rgba(0,0,0,1)] z-10">
            🟢
          </div>
          <h3 class="text-2xl font-display font-black text-[#2ECC71] drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] animate-pulse uppercase leading-none">ABAN! MASH! GO!</h3>
          <p class="text-[9px] font-sans font-bold text-black/60 uppercase">DURMA, TUŞUNA SÜREKLİ BAS!</p>
        </div>
      `):s==="yellow"?(E="bg-[#FFF9E6]",g=`
        <div class="flex flex-col items-center space-y-3.5">
          <div class="w-20 h-20 rounded-full bg-[#F1C40F] border-4 border-black flex items-center justify-center text-3xl select-none shadow-[3px_3px_0_rgba(0,0,0,1)]">
            🟡
          </div>
          <h3 class="text-2xl font-display font-black text-[#F1C40F] drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] uppercase leading-none">DURAKSAMA SÜRESİ</h3>
          <p class="text-[9px] font-sans font-bold text-black/60 uppercase">BASMAYI KES, CEZA YAKINDA!</p>
        </div>
      `):(E="bg-[#FFEBEE]",g=`
        <div class="flex flex-col items-center space-y-3.5 animate-pulse">
          <div class="w-20 h-20 rounded-full bg-[#E74C3C] border-4 border-black flex items-center justify-center text-3xl select-none shadow-[3px_3px_0_rgba(0,0,0,1)]">
            🔴
          </div>
          <h3 class="text-2xl font-display font-black text-[#E74C3C] drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] uppercase leading-none">⚠️ DUR! BASMA! ⚠️</h3>
          <p class="text-[9px] font-sans font-bold text-black/60 uppercase">BU DURUMDA MASH YAPMAK PUANINI ERİTİR!</p>
        </div>
      `),k.className=`md:col-span-3 ${E} border-4 border-black p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-h-[300px] transition-colors duration-200 text-black`,k.innerHTML=g;const L=900+Math.random()*1400;p&&clearTimeout(p),p=setTimeout(h,L)}h(),u=setInterval(()=>{a--,b(),a<=0&&A()},1e3);function A(){var T;t=!0,p&&clearTimeout(p),u&&clearInterval(u);const l=Object.entries(n).sort((C,M)=>M[1]-C[1]),g=l.map(([C])=>i.players.find(M=>M.id===parseInt(C))),E=X(g),L=parseInt(l[0][0]),B=i.players.find(C=>C.id===L),D=[35,20,10,5];let j=`
      <div class="bg-white border-4 border-black p-5 sm:p-8 max-w-xl w-full flex flex-col items-center space-y-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black animate-fade-in relative z-45">
        <div class="w-14 h-14 rounded-full ${B.color} border-4 border-black flex items-center justify-center text-4xl shadow animate-bounce">
          ⚡
        </div>
        <div>
          <h3 class="text-xl sm:text-2xl font-display font-black text-black uppercase tracking-tight">IŞIK USTASI</h3>
          <p class="text-xs font-bold text-black/70 mt-1">${B.name} ışık hızında harika refleks göstererek birinci oldu!</p>
        </div>

        <div class="w-full space-y-2.5 my-3">
          <span class="block text-[9px] font-mono text-black/60 font-black uppercase tracking-widest text-left">FİNAL PUAN DAĞILIMI</span>
    `;l.forEach(([C,M],S)=>{const I=parseInt(C),F=i.players.find(q=>q.id===I),R=D[S]||0;let U="";const H=E[F.id];i.isEliminationMode&&H&&(U=`<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${H.colorClass}">${H.label}</span>`,H.status==="eliminated"&&(F.isEliminated=!0)),F.score+=R,F.globalCoins=(F.globalCoins||0)+R,z(F),j+=`
        <div class="flex items-center justify-between bg-white border-2 border-black p-2.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <div class="flex items-center gap-2.5">
            <span class="font-mono text-xs text-black font-black">#${S+1}</span>
            ${O(F,"w-7 h-7 text-xs")}
            <span class="font-black text-xs text-black">${F.name}</span>
            ${U}
          </div>
          <div class="flex items-center gap-1.5 font-semibold text-black">
            <span class="text-xs font-mono font-black">${M} tık</span>
            <span class="font-extrabold text-[9px] bg-[#FDCB6E] border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">+${R} Tur Pts</span>
            <span class="font-extrabold text-[9px] bg-[#FFEAA7] border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">🪙+${R}</span>
          </div>
        </div>
      `}),j+=`
       </div>
       <button id="click-derby-modal-continue" class="w-full py-3.5 bg-[#4ECDC4] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
         Arena Kürsüsüne İlerle
       </button>
      </div>
    `,_.playFanfare(),f.innerHTML=j,f.classList.remove("hidden"),(T=document.getElementById("click-derby-modal-continue"))==null||T.addEventListener("click",()=>{Q()})}const $=l=>{if(l.repeat)return;const g=e.find(E=>E.key===l.code);if(g){const E=document.getElementById(`cd-bumper-${g.id}`);E&&(E.classList.add("bg-black","text-white","scale-95"),setTimeout(()=>E.classList.remove("scale-95"),80)),m(g.id)}};window.addEventListener("keydown",$),(v=document.getElementById("click-derby-quit"))==null||v.addEventListener("click",()=>{p&&clearTimeout(p),u&&clearInterval(u),window.removeEventListener("keydown",$),N("gamesHub")});const r=new MutationObserver(()=>{document.getElementById("click-derby-quit")||(p&&clearTimeout(p),u&&clearInterval(u),window.removeEventListener("keydown",$),r.disconnect())});r.observe(P,{childList:!0})}function Ne(){var f,b;const e=i.players.filter(m=>m.active),a=[...e].sort((m,c)=>c.score-m.score),t=a[0],n=document.createElement("div");n.className="w-full max-w-4xl bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 flex flex-col items-center space-y-8 animate-fade-in text-center text-black";let s=`
    <!-- Top badge ribbon -->
    <div class="flex items-center gap-1.5 px-4 py-1.5 bg-[#FDCB6E] border-2 border-black text-black font-mono text-xs tracking-widest uppercase font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      👑 PARTİ ARENASI SONUÇLANDI
    </div>

    <!-- Celebration Crown text -->
    <div class="space-y-2">
      <h2 class="text-4xl sm:text-5xl font-display font-black text-black uppercase tracking-tight">KAZANAN: ${t.name}!</h2>
      <p class="text-black font-semibold text-sm">Katılan tüm yolculara şükranlarımızı sunarız. İşte genel kapışma sıralaması:</p>
    </div>

    <!-- Decorative visual Podium cards layout -->
    <div class="flex flex-col sm:flex-row items-end justify-center gap-6 w-full max-w-2xl py-6 select-none leading-none">
  `;const p=[];a.length>=3?(p.push(a[1]),p.push(a[0]),p.push(a[2]),a[3]&&p.push(a[3])):(p.push(a[0]),p.push(a[1])),p.forEach(m=>{const c=a.indexOf(m)+1,h=c===1?"h-40 sm:h-48":c===2?"h-32 sm:h-36":c===3?"h-24 sm:h-28":"h-16 sm:h-20",A=c===1?"bg-[#FFEAA7]":c===2?"bg-[#DFE6E9]":c===3?"bg-[#FAB1A0]":"bg-gray-100",$=c===1?"bg-[#F1C40F]":c===2?"bg-[#BDC3C7]":c===3?"bg-[#E67E22]":"bg-gray-400";s+=`
      <div class="flex-1 flex flex-col items-center w-full">
        <!-- Badge Avatar bubble -->
        <div class="relative ${c===1?"animate-bounce":""} mb-3.5 flex items-center justify-center">
          ${O(m,"w-16 h-16 text-3xl")}
          <!-- Crown on P1 -->
          ${c===1?'<span class="absolute -top-5 text-2xl rotate-12 z-20">👑</span>':""}
        </div>
        
        <div class="text-sm font-black text-black max-w-[120px] truncate mb-1">${m.name}</div>
        <div class="text-[10px] font-mono text-black/60 tracking-wider mb-2">${m.avatarName}</div>

        <!-- Standing Podium Block -->
        <div class="w-full ${A} border-4 border-black rounded-2xl ${h} flex flex-col justify-center items-center gap-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-4 ${$} border-b-2 border-black"></div>
          <span class="text-4xl font-display font-black text-black mt-2">${c}.</span>
          ${i.isEliminationMode&&m.isEliminated?`
            <span class="font-black text-[10px] text-red-700 font-mono bg-[#FFF0F2] border-2 border-[#FF7675] px-2 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] rounded select-none">❌ ELENDİ</span>
          `:`
            <span class="font-black text-xs text-black font-mono bg-white border border-black px-2 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">${m.score} <span class="text-[9px] text-black/60 font-black">Pts</span></span>
          `}
        </div>
      </div>
    `});const u=e.reduce((m,c)=>m+c.score,0),d=Math.max(...e.map(m=>m.score),1);let w="";a.forEach(m=>{const c=i.isEliminationMode&&m.isEliminated?'<strong class="text-red-650 font-black">ELENDİ</strong>':`<span>Puan: <strong class="underline">${m.score}</strong></span>`;w+=`
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-black text-[9px] font-mono font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        <span class="w-2.5 h-2.5 border border-black shrink-0" style="background-color: ${m.hexColor};"></span>
        <span>${m.name}: ${c}</span>
      </span>
    `}),s+=`
    </div>

    <!-- Live Performance Dominator Chart Section -->
    <div class="w-full bg-white border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left flex flex-col space-y-4 my-2 select-none">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between border-b-4 border-black pb-3 gap-2">
        <div>
          <span class="text-[9px] font-mono uppercase tracking-widest text-black/60 font-black block">ARENA ANALİZ MERKEZİ</span>
          <h3 class="text-lg sm:text-xl font-display font-black text-black uppercase">📊 DOMİNASYON GRAFİĞİ</h3>
        </div>
        <div class="flex flex-wrap gap-1.5 max-w-full">
          ${w}
        </div>
      </div>

      <!-- Chart Content Base Screen -->
      <div class="relative w-full overflow-hidden bg-[#fafafa] border-4 border-black p-3 select-none flex items-center justify-center min-h-[290px]">
         <!-- Custom Responsive Dynamic SVG Chart -->
         <svg id="dominance-chart" class="w-full h-64 max-w-xl overflow-visible" viewBox="0 0 500 240"></svg>
         
         <!-- HTML Floating Neo-Brutalist Tooltip inside chart frame -->
         <div id="chart-tooltip" class="absolute pointer-events-none opacity-0 bg-white text-black text-xs font-black p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-30 transition-opacity duration-150 rounded-none max-w-[220px]"></div>
      </div>
      
      <!-- Dominance insights custom tailored footer -->
      <div id="dominance-insight" class="bg-[#FFEAA7] border-4 border-black p-4 text-xs font-black leading-relaxed text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
         <!-- Will be computed dynamically below -->
      </div>
    </div>

    <!-- Restart Panel trigger buttons -->
    <div class="flex flex-col sm:flex-row gap-4 w-full justify-center pt-2">
      <button id="restart-to-char" class="px-8 py-4 bg-white hover:bg-black hover:text-white text-black border-4 border-black font-black tracking-wider uppercase text-xs transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer font-display">
        ◀ Karakter Değiştir
      </button>
      <button id="restart-to-lobby" class="px-10 py-4 bg-[#A29BFE] hover:bg-black hover:text-white text-black border-4 border-black font-black tracking-widest text-sm uppercase transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer font-display">
        🎮 YENİ PARTİ BAŞLAT
      </button>
    </div>
  `,n.innerHTML=s,P.appendChild(n);const y=document.getElementById("dominance-chart");if(y){let m="";m+=`
      <style>
        .grid-line {
          stroke: #000000;
          stroke-opacity: 0.12;
          stroke-dasharray: 4 4;
          stroke-width: 2px;
        }
        .axis-baseline {
          stroke: #000000;
          stroke-width: 4px;
        }
        .chart-label {
          font-family: 'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif;
          font-weight: 900;
          fill: #000000;
        }
        .chart-value-label {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 950;
          font-size: 10px;
          fill: #000000;
        }
        .chart-bar-interactive {
          cursor: pointer;
          transition: filter 0.15s ease;
        }
        .chart-bar-interactive:hover {
          filter: brightness(1.1);
        }
        @keyframes pop-emoji {
          0% { transform: scale(0); opacity: 0; }
          80% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        .emoji-actor {
          transform-box: fill-box;
          transform-origin: center;
          opacity: 0;
          animation: pop-emoji 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      </style>
    `;const c=30,h=190,A=h-c;[.25,.5,.75,1].forEach(g=>{const E=Math.round(g*d),L=h-g*A;m+=`
        <!-- Horizontal grid line -->
        <line x1="45" y1="${L}" x2="470" y2="${L}" class="grid-line" />
        <text x="22" y="${L+3}" class="chart-value-label" text-anchor="middle">${E}</text>
      `}),m+=`
      <line x1="45" y1="${h}" x2="470" y2="${h}" class="axis-baseline" />
    `;const v=410/e.length,l=Math.min(v*.55,60);e.forEach((g,E)=>{const L=u>0?Math.round(g.score/u*100):0,B=d>0?g.score/d*A:0,D=h-B,j=50+v*E+v/2,T=j-l/2,C=E*150;m+=`
        <style>
          @keyframes rise-bar-${g.id} {
            from { y: ${h}px; height: 0px; }
            to { y: ${D}px; height: ${B}px; }
          }
          @keyframes rise-shadow-${g.id} {
            from { y: ${h+4}px; height: 0px; }
            to { y: ${D+4}px; height: ${B}px; }
          }
          .bar-animated-${g.id} {
            animation: rise-bar-${g.id} 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
            animation-delay: ${C}ms;
          }
          .shadow-animated-${g.id} {
            animation: rise-shadow-${g.id} 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
            animation-delay: ${C}ms;
          }
        </style>
        
        <!-- Neo-brutalist shadow blocks -->
        <rect x="${T+4}" y="${h+4}" width="${l}" height="0" fill="black" class="shadow-animated-${g.id}" />
        
        <!-- Interactive Bar rects -->
        <rect 
          id="chart-bar-shape-${g.id}"
          x="${T}" 
          y="${h}" 
          width="${l}" 
          height="0" 
          fill="${g.hexColor}" 
          stroke="black" 
          stroke-width="3.5" 
          class="chart-bar-interactive bar-animated-${g.id}" 
          data-id="${g.id}"
          data-name="${g.name}"
          data-score="${g.score}"
          data-emoji="${g.emoji}"
          data-share="${L}"
          data-color="${g.hexColor}"
        />
        
        <!-- Champion Mini bouncing icon on Top of Bar -->
        <text 
          x="${j}" 
          y="${D-12}" 
          font-size="22" 
          text-anchor="middle" 
          class="emoji-actor"
          style="animation-delay: ${C+500}ms;"
        >
          ${g.emoji}
        </text>
        
        <!-- Player Label Under the Base Line -->
        <text x="${j}" y="${h+22}" font-size="11" class="chart-label" text-anchor="middle">
          ${g.name}
        </text>
      `}),y.innerHTML=m}const x=n.querySelectorAll(".chart-bar-interactive"),k=n.querySelector("#chart-tooltip");x.forEach(m=>{m.addEventListener("mousemove",c=>{var E;const h=c,A=h.currentTarget,$=A.getAttribute("data-name"),r=A.getAttribute("data-score"),v=A.getAttribute("data-emoji"),l=A.getAttribute("data-share"),g=A.getAttribute("data-color");if(k&&$){k.style.opacity="1",k.style.borderColor="black",k.style.backgroundColor=g||"#ffffff",k.innerHTML=`
          <div class="flex items-center gap-1.5 mb-1 bg-white border border-black px-1 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">
            <span class="text-sm select-none">${v}</span>
            <span class="font-black text-[10px] uppercase text-black font-display">${$}</span>
          </div>
          <div class="space-y-0.5 leading-none text-[9.5px] font-mono text-black font-black">
            <div>TOPLAM PUAN: <span class="underline">${r} Pts</span></div>
            <div>DOMİNE ORANI: <span>%${l}</span></div>
          </div>
        `;const L=(E=n.querySelector("#dominance-chart"))==null?void 0:E.getBoundingClientRect();if(L){const B=h.clientX-L.left+15,D=h.clientY-L.top-75;k.style.left=`${B}px`,k.style.top=`${D}px`}}}),m.addEventListener("mouseleave",()=>{k&&(k.style.opacity="0")})});const o=n.querySelector("#dominance-insight");if(o){let m="";const c=a[0],h=a[1];c&&h?c.score>=h.score*2?m=`⚔️ <strong>DEHŞET-ÜL VAHŞET KUPASI!</strong> <span class="underline">${c.name}</span>, en yakın rakibi <strong>${h.name}</strong> oyuncusunu tam manasıyla sürklase etti! Toplam puanların %${Math.round(c.score/u*100)} kısmını elinde tutarak hakiki arenanın hükümdarı olduğunu ispatladı! 👑`:c.score-h.score<=12?m=`🔥 <strong>BURUN FARKIYLA NEFES KESEN ŞAMPİYONLUK!</strong> <span class="underline">${c.name}</span> ve <strong>${h.name}</strong> final anına dek omuz omuza yarıştı. Sadece <strong>${c.score-h.score} puanlık</strong> ufacık bir mesafe farkıyla tacı kafasına geçiren ${c.name} oldu! Tebrikler!`:m=`🏆 <strong>MUAZZAM TAKTİKSEL ÜSTÜNLÜK!</strong> <span class="underline">${c.name}</span> bu seride temposunu hiç düşürmeyerek toplamda <strong>${c.score} puana</strong> ulaştı. Genel gücün %${Math.round(c.score/u*100)}'lik dilimini domine ederek kürsünün ebedi sahibi oldu! ⚡`:m=`🏆 Şampiyonumuz <strong>${c.name}</strong>, toplamda topladığı muazzam <strong>${c.score} puan</strong> ile bu partinin mutlak galibi oldu!`,o.innerHTML=m}(f=document.getElementById("restart-to-char"))==null||f.addEventListener("click",()=>N("charSelect")),(b=document.getElementById("restart-to-lobby"))==null||b.addEventListener("click",()=>{i.players.forEach(m=>m.score=0),N("lobby")})}function Fe(){var $;const e=i.isEliminationMode?i.players.filter(r=>r.active&&!r.isEliminated):i.players.filter(r=>r.active);let a=!1;const t={},n={},s={},p={};e.forEach(r=>{t[r.id]=0,n[r.id]=0,s[r.id]=0,p[r.id]=[]});const u=document.createElement("div");u.className="w-full max-w-5xl relative z-10 flex flex-col min-h-[580px] justify-between space-y-4 animate-fade-in select-none text-black";const d=document.createElement("div");d.className="bg-white border-4 border-black p-3 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-3",d.innerHTML=`
    <div class="text-center sm:text-left">
      <h2 class="text-lg sm:text-xl font-display font-black text-black uppercase">🏃 SEVİMLİ KOŞU (ANIMAL SPRINT)</h2>
      <p class="text-black font-semibold text-[11px] mt-0.5">Kendi kulvarında koşmak için tuşuna <b class="text-amber-500 font-extrabold">SERİCE BAS!</b> 🍬 Şeker ve ⭐ Yıldızlar hızlandırır, 🍌 Muz kaydırır, 💩 Çamur yavaşlatır!</p>
    </div>
    <button id="race-game-quit" class="px-3.5 py-1.5 text-[11px] font-black bg-white border-2 border-black hover:bg-black hover:text-white transition duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
      ◀ Ayrıl
    </button>
  `,u.appendChild(d);const w=document.createElement("div");w.className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 items-stretch",u.appendChild(w);const y=document.createElement("div");y.className="md:col-span-1 bg-white border-4 border-black p-3.5 flex flex-col justify-between shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-black",w.appendChild(y);const x=document.createElement("div");x.className="md:col-span-3 bg-zinc-100 border-4 border-black p-4 flex flex-col justify-around relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-h-[350px] transition-colors text-black rounded-lg",w.appendChild(x);const k=document.createElement("div");k.className=`grid gap-2.5 ${e.length===2?"grid-cols-2 lg:grid-cols-2":e.length===3?"grid-cols-3":"grid-cols-2 md:grid-cols-4"}`,u.appendChild(k),e.forEach(r=>{const v=document.createElement("button");v.id=`cd-bumper-${r.id}`,v.className=`py-3 bg-white border-4 ${r.borderColor} text-black font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center space-y-1 hover:bg-black hover:text-white active:scale-95 transition-all duration-100 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden`,v.innerHTML=`
      <div class="h-7 w-7 flex items-center justify-center text-lg bg-white border-2 border-black rounded-full select-none shadow">
        ${r.emoji}
      </div>
      <span class="font-extrabold text-[11px]">${r.name}</span>
      <span class="text-[8px] text-black/50 font-mono font-black">TUŞ: [${r.keyLabel}]</span>
    `,v.addEventListener("click",()=>m(r.id)),k.appendChild(v)});const o=document.createElement("div");o.className="hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-4 text-center animate-fade-in",u.appendChild(o),P.appendChild(u);function f(){y.innerHTML=`
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs font-mono font-black border-2 border-black bg-white px-2 py-1 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <span>PARKUR:</span>
          <span class="text-emerald-600 font-black animate-pulse">100 Metre</span>
        </div>
        <span class="block text-[8px] font-mono text-black/45 uppercase tracking-widest font-black mt-2">ANLIK MESAFELER</span>
        <div class="space-y-2 mt-1">
          ${e.map(r=>{const v=Math.round(t[r.id]),l=n[r.id]&&Date.now()<n[r.id]?"💫 SERSEM":s[r.id]&&s[r.id]>0?"💩 ÇAMURDA":"🏃 KOŞUYOR",g=l==="💫 SERSEM"?"bg-[#FF7675] text-white":l==="💩 ÇAMURDA"?"bg-[#D6A2E8] text-black":"bg-emerald-100 text-emerald-800";return`
              <div class="flex flex-col p-1.5 bg-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
                <div class="flex items-center justify-between font-semibold text-black">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs">${r.emoji}</span>
                    <span class="font-extrabold text-[11px] truncate max-w-[80px]">${r.name}</span>
                  </div>
                  <span class="font-mono text-xs font-black bg-zinc-100 border border-black px-1 py-0.5 shadow-[0.5px_0.5px_0_rgba(0,0,0,1)]">
                    ${v}m
                  </span>
                </div>
                <div class="flex items-center justify-between mt-1 pt-1 border-t border-dashed border-zinc-100">
                  <span class="text-[7.5px] font-black uppercase text-black/45 tracking-widest">DURUM:</span>
                  <span class="font-mono text-[7px] font-black px-1 rounded uppercase ${g}">${l}</span>
                </div>
              </div>
            `}).join("")}
        </div>
      </div>
      <div class="pt-2 border-t-2 border-dashed border-black/20 mt-3 text-center">
        <div class="p-2 bg-yellow-50 border-2 border-black font-sans font-bold text-[9px] text-black/80 leading-normal">
          🥕 Çocuklar için harika tek-tuş oyunu! Durmadan tuşuna basıp zirveye uç!
        </div>
      </div>
    `,x.innerHTML=`
      <div class="w-full h-full flex flex-col justify-around py-2 space-y-3">
        ${e.map(r=>{var E;const v=t[r.id],l=n[r.id]&&Date.now()<n[r.id];s[r.id]&&s[r.id]>0;const g=r.activeAccessory?`
            <span class="absolute -top-3.5 left-1/2 -translate-x-1/2 text-base select-none">${((E=J.find(L=>L.id===r.activeAccessory))==null?void 0:E.emoji)||""}</span>
          `:"";return`
            <!-- Player Lane -->
            <div class="relative w-full h-[62px] border-4 border-black bg-zinc-50 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-between">
              
              <!-- Grassy Lane Background Texture -->
              <div class="absolute inset-x-0 h-full bg-linear-to-r from-emerald-50 to-emerald-100/40 z-0"></div>
              
              <!-- Track Milestones (Visually plotted at exact positions) -->
              
              <!-- Candy 🍬 at 25% -->
              <div class="absolute left-[25%] -translate-x-1/2 flex flex-col items-center z-10" style="opacity: ${p[r.id].includes("candy")?"0.35":"1"}">
                <span class="text-xs sm:text-sm animate-bounce" style="animation-duration: 2s">🍬</span>
                <span class="text-[6.5px] font-black bg-white border border-black/30 px-0.5 rounded leading-none">ŞEKER (+5)</span>
              </div>

              <!-- Banana 🍌 at 50% -->
              <div class="absolute left-[50%] -translate-x-1/2 flex flex-col items-center z-10" style="opacity: ${p[r.id].includes("banana")?"0.35":"1"}">
                <span class="text-xs sm:text-sm">🍌</span>
                <span class="text-[6.5px] font-black bg-white border border-black/30 px-0.5 rounded leading-none text-amber-600">MUZ (DUR!)</span>
              </div>

              <!-- Star ⭐ at 72% -->
              <div class="absolute left-[72%] -translate-x-1/2 flex flex-col items-center z-10" style="opacity: ${p[r.id].includes("star")?"0.35":"1"}">
                <span class="text-xs sm:text-sm animate-pulse">⭐</span>
                <span class="text-[6.5px] font-black bg-white border border-black/30 px-0.5 rounded leading-none text-violet-600">YILDIZ (+8)</span>
              </div>

              <!-- Mud Puddle 💩 at 85% -->
              <div class="absolute left-[85%] -translate-x-1/2 flex flex-col items-center z-10" style="opacity: ${p[r.id].includes("mud")?"0.35":"1"}">
                <span class="text-xs sm:text-sm">💩</span>
                <span class="text-[6.5px] font-black bg-white border border-black/30 px-0.5 rounded leading-none text-purple-700">ÇAMUR (AĞIR)</span>
              </div>

              <!-- Finish Flag checkered waving 🏁 at 100% -->
              <div class="absolute right-[0px] h-full w-8 bg-zinc-200 border-l border-zinc-400/40 z-10 flex items-center justify-center font-bold text-lg select-none">
                🏁
              </div>

              <!-- Live Lane Score background hint -->
              <div class="absolute left-3 top-1/2 -translate-y-1/2 z-10 select-none">
                <span class="font-display font-black text-xs uppercase text-black/15 tracking-wider">${r.name}'s Track</span>
              </div>

              <!-- Moving Sprinting Avatar Card -->
              <div id="race-avatar-${r.id}" class="absolute top-[8px] h-10 w-10 rounded-full border-2 border-black flex items-center justify-center shadow-[1px_1.5px_0_rgba(0,0,0,1)] ${r.color} transition-all duration-150 z-20 ${l?"animate-spin":""}" style="left: calc(${v/100*85}% + 8px);">
                <!-- Accessory Wearable overlay if any -->
                ${g}
                
                <!-- Avatar Emoji or custom picture -->
                ${r.customImage?`<img src="${r.customImage}" class="w-full h-full rounded-full object-cover" />`:`<span class="text-xl select-none">${r.emoji}</span>`}
              </div>

            </div>
          `}).join("")}
      </div>
    `}f();function b(r,v,l="bg-white text-black"){const g=document.createElement("div");g.className=`absolute text-[9px] font-black border-2 border-black px-1.5 py-0.5 ${l} uppercase tracking-wider animate-bounce shadow-[1px_1px_0px_rgba(0,0,0,1)] z-30 rounded`;const E=e.findIndex(L=>L.id===v);if(E!==-1){const L=10+E*25;g.style.top=`${L}%`,g.style.left=`${30+Math.random()*40}%`}else g.style.top=`${15+Math.random()*50}%`,g.style.left=`${20+Math.random()*60}%`;g.innerText=r,x.appendChild(g),setTimeout(()=>g.remove(),750)}function m(r){if(a)return;i.players.find(L=>L.id===r);const v=Date.now();if(n[r]&&v<n[r]){_.playFail(),b("💫 DIZZY! (KAYDI!)",r,"bg-red-500 text-white");return}let l=2.4;s[r]&&s[r]>0&&(l=1,s[r]--),t[r]=Math.min(100,t[r]+l);const g=t[r];_.playTick();const E=p[r];if(g>=25&&!E.includes("candy")&&(E.push("candy"),t[r]=Math.min(100,t[r]+5),_.playPowerUp(),b("🍬 ŞEKER HIZI! +5m",r,"bg-[#55EFC4] text-black")),g>=50&&!E.includes("banana")){E.push("banana"),n[r]=v+1200,_.playExplode(),b("🍌 MUZ KABUĞUNDA KAYDIN! -1.2s",r,"bg-[#F39C12] text-white animate-pulse");const L=document.getElementById(`race-avatar-${r}`);L&&(L.classList.add("animate-spin"),setTimeout(()=>{L.classList.remove("animate-spin")},1200))}g>=72&&!E.includes("star")&&(E.push("star"),t[r]=Math.min(100,t[r]+8),_.playPowerUp(),b("⭐ SÜPER KOŞU! +8m",r,"bg-[#FDCB6E] text-black")),g>=85&&!E.includes("mud")&&(E.push("mud"),s[r]=5,_.playFail(),b("💩 ÇAMURDAN GEÇTİN! YAVAŞLA!",r,"bg-amber-800 text-white")),f(),t[r]>=100&&c(r)}function c(r){var D;a=!0;const v=Object.entries(t).sort((j,T)=>T[1]-j[1]),l=v.map(([j])=>i.players.find(T=>T.id===parseInt(j))),g=X(l),E=i.players.find(j=>j.id===r),L=[35,20,10,5];let B=`
      <div class="bg-white border-4 border-black p-5 sm:p-8 max-w-xl w-full flex flex-col items-center space-y-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black animate-fade-in relative z-45">
        <div class="w-14 h-14 rounded-full ${E.color} border-4 border-black flex items-center justify-center text-4xl shadow animate-bounce">
          🏆
        </div>
        <div>
          <h3 class="text-xl sm:text-2xl font-display font-black text-black uppercase tracking-tight">KOŞU ŞAMPİYONU</h3>
          <p class="text-xs font-bold text-black/70 mt-1">${E.name} rüzgar gibi esip finişe 🏁 ilk ulaşan oyuncu oldu!</p>
        </div>

        <div class="w-full space-y-2.5 my-3">
          <span class="block text-[9px] font-mono text-black/60 font-black uppercase tracking-widest text-left">FİNAL PUAN DAĞILIMI</span>
    `;v.forEach(([j,T],C)=>{const M=parseInt(j),S=i.players.find(U=>U.id===M),I=L[C]||0;let F="";const R=g[S.id];i.isEliminationMode&&R&&(F=`<span class="font-extrabold text-[9.5px] border-2 px-1.5 py-0.5 rounded shadow-[1px_1px_0_rgba(0,0,0,1)] ${R.colorClass}">${R.label}</span>`,R.status==="eliminated"&&(S.isEliminated=!0)),S.score+=I,S.globalCoins=(S.globalCoins||0)+I,z(S),B+=`
        <div class="flex items-center justify-between bg-white border-2 border-black p-2.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
          <div class="flex items-center gap-2.5">
            <span class="font-mono text-xs text-black font-black">#${C+1}</span>
            ${O(S,"w-7 h-7 text-xs")}
            <span class="font-black text-xs text-black">${S.name}</span>
            ${F}
          </div>
          <div class="flex items-center gap-1.5 font-semibold text-black">
            <span class="text-xs font-mono font-black">${Math.round(T)} metre</span>
            <span class="font-extrabold text-[9px] bg-[#FDCB6E] border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">+${I} Tur Pts</span>
            <span class="font-extrabold text-[9px] bg-[#FFEAA7] border border-black px-1.5 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] shrink-0">🪙+${I}</span>
          </div>
        </div>
      `}),B+=`
       </div>
       <button id="race-modal-continue" class="w-full py-3.5 bg-[#4ECDC4] hover:bg-black hover:text-white border-4 border-black text-black font-black text-xs tracking-widest uppercase transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">
         Arena Kürsüsüne İlerle
       </button>
      </div>
    `,_.playFanfare(),o.innerHTML=B,o.classList.remove("hidden"),(D=document.getElementById("race-modal-continue"))==null||D.addEventListener("click",()=>{Q()})}const h=r=>{if(r.repeat)return;const v=e.find(l=>l.key===r.code);if(v){const l=document.getElementById(`cd-bumper-${v.id}`);l&&(l.classList.add("bg-black","text-white","scale-95"),setTimeout(()=>l.classList.remove("scale-95"),80)),m(v.id)}};window.addEventListener("keydown",h),($=document.getElementById("race-game-quit"))==null||$.addEventListener("click",()=>{window.removeEventListener("keydown",h),N("gamesHub")});const A=new MutationObserver(()=>{document.getElementById("race-game-quit")||(window.removeEventListener("keydown",h),A.disconnect())});A.observe(P,{childList:!0})}function je(){var f;const e=document.createElement("div");e.className="w-full max-w-5xl relative z-10 flex flex-col space-y-6 animate-fade-in";const a=i.players.filter(b=>b.active);let t=a.find(b=>b.id===ae);if(t||(t=a[0],t&&(ae=t.id)),!t){N("lobby");return}const n=document.createElement("div");n.className="bg-white border-4 border-black p-5 sm:p-6 text-center space-y-2.5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden text-black",n.innerHTML=`
    <div class="absolute -top-10 -right-10 w-24 h-24 bg-yellow-200 border-4 border-black rotate-45 pointer-events-none"></div>
    <div class="text-3xl sm:text-4xl">🛍️</div>
    <h2 class="text-2xl sm:text-3.5xl font-display font-black uppercase tracking-tight text-black leading-none">Kostüm Arenası & Gardırop</h2>
    <p class="text-black/80 font-bold text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
      Raundlardan topladığın altınlarla kahramanına havalı aksesuarlar satın al veya bilgisayarından / telefonundan kendi fotoğrafını yükleyerek arenaya doğrudan kendi yüzünle katıl!
    </p>
  `,e.appendChild(n);const s=document.createElement("div");s.className="flex flex-wrap gap-2 w-full justify-center",a.forEach(b=>{const m=b.id===ae,c=document.createElement("button");c.className=`px-5 py-3 border-4 border-black font-black uppercase tracking-wider text-xs cursor-pointer transition-all ${m?"bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]":`${b.color} text-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-black hover:text-white`}`,c.innerHTML=`
      <div class="flex items-center gap-2">
        <span class="text-sm shrink-0">${b.customImage?"🖼️":b.emoji}</span>
        <span>${b.name}</span>
      </div>
    `,c.addEventListener("click",()=>{ae=b.id,_.playTick(),K()}),s.appendChild(c)}),e.appendChild(s);const p=document.createElement("div");p.className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch",e.appendChild(p);const u=document.createElement("div");u.className="lg:col-span-5 bg-white border-4 border-black p-5 flex flex-col justify-between space-y-6 shadow-[8px_8px_0_rgba(0,0,0,1)] text-center text-black";const d=t.unlockedAchievements&&t.unlockedAchievements.length>0?`<div class="flex flex-wrap gap-1.5 justify-center py-1.5 select-none bg-neutral-50/50 border-2 border-black border-dashed">
         ${t.unlockedAchievements.map(b=>{const m=Z.find(c=>c.id===b);return m?`<span class="inline-flex items-center justify-center bg-[#FFEAA7] border border-black px-2 py-1 text-sm shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 duration-100 cursor-help" title="${m.name}: ${m.description}">
                     ${m.badgeEmoji}
                   </span>`:""}).join("")}
       </div>`:'<div class="text-[8px] font-mono uppercase text-gray-400 tracking-widest py-1.5">Kazanılmış rozet bulunmuyor</div>';u.innerHTML=`
    <div class="space-y-4">
      <div class="border-b-2 border-black pb-2">
        <span class="text-[10px] font-mono font-black uppercase tracking-widest text-black/50">AKTİF PROFİLİZASYON</span>
        <h3 class="text-xl font-black text-black uppercase leading-normal">${t.name}</h3>
      </div>

      <!-- Badges Display Area -->
      <div class="space-y-1">
        <span class="block text-[8px] font-mono font-black text-black/40 uppercase tracking-widest text-center">ROZET VİTRİNİ</span>
        ${d}
      </div>

      <!-- Drag & Drop Container with Active Avatar preview -->
      <div id="shop-drop-zone" class="mx-auto my-3 p-4 border-4 border-dashed border-gray-400 hover:border-black rounded-none cursor-pointer bg-neutral-50 transition-colors flex flex-col items-center justify-center space-y-4 min-h-[200px] relative group select-none shadow-inner">
        <div class="scale-125 transform mt-2 relative">
          ${O(t,"w-24 h-24 text-5xl animate-float")}
        </div>
        <div class="text-center space-y-1">
          <p class="text-xs font-black text-black">Fotoğrafını Sürükle Bırak</p>
          <p class="text-[10px] text-gray-500 font-semibold font-mono uppercase">Veya Tıklayıp Dosya Seç</p>
        </div>
        <input type="file" id="shop-file-input" accept="image/*" class="hidden" />
      </div>

      <div class="flex flex-col gap-2">
        <button id="shop-upload-trigger-btn" class="w-full py-3 bg-[#4ECDC4] hover:bg-black hover:text-white border-2 border-black text-black font-black text-xs uppercase tracking-wider transition-colors shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-1.5">
          📷 KENDİ RESMİNİ SEÇ
        </button>
        ${t.customImage?`
          <button id="shop-remove-img-btn" class="w-full py-2 bg-[#FF6B6B] hover:bg-black hover:text-white border-2 border-black text-black font-black text-[10px] uppercase tracking-wider transition-colors shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer">
            🛑 Özel Fotoğrafı Kaldır
          </button>
        `:""}
      </div>
    </div>

    <!-- Balance panel -->
    <div class="bg-[#FFEAA7] border-4 border-black p-4 mt-4 shadow-[4px_4px_0_rgba(0,0,0,1)] relative overflow-hidden">
      <div class="absolute -bottom-8 -right-8 text-6xl opacity-15 pointer-events-none select-none">🪙</div>
      <div class="text-left leading-tight">
        <span class="block text-[9px] font-mono font-black text-black/50 uppercase tracking-widest">KULLANILABİLİR HESAP BAKİYESİ</span>
        <div class="flex items-center gap-1.5 mt-1">
          <span class="text-3xl font-black font-display text-black">${t.globalCoins||0}</span>
          <span class="text-sm font-black font-mono">ALTIN COIN</span>
        </div>
        <p class="text-[9px] font-semibold text-black/60 mt-1.5 leading-relaxed">Puanlar her oyun tamamlandığında altın olarak hesabına eklenir.</p>
      </div>
    </div>
  `,p.appendChild(u);const w=document.createElement("div");w.className="lg:col-span-7 bg-white border-4 border-black p-5 flex flex-col justify-between space-y-4 shadow-[8px_8px_0_rgba(0,0,0,1)] text-black";let y=`
    <div class="border-b-2 border-black pb-2 mb-2 flex justify-between items-center">
      <div>
        <span class="text-[10px] font-mono font-black uppercase tracking-widest text-black/50">MAĞAZA KATALOĞU</span>
        <h3 class="text-xl font-black text-black">Aksesuarlar & Kostümler</h3>
      </div>
      <span class="text-xs bg-black text-white font-mono font-black px-2.5 py-1 uppercase">${J.length} Ürün Mevcut</span>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
  `;J.forEach(b=>{var $;const m=($=t.unlockedAccessories)==null?void 0:$.includes(b.id),c=t.activeAccessory===b.id,h=(t.globalCoins||0)>=b.cost;let A="";m?c?A=`
          <button id="btn-equip-${b.id}" class="w-full py-2 bg-[#FF6B6B] text-black border-2 border-black font-black text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-all cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            Çıkar
          </button>
        `:A=`
          <button id="btn-equip-${b.id}" class="w-full py-2 bg-[#4ECDC4] text-black border-2 border-black font-black text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-all cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            Giy
          </button>
        `:A=`
        <button id="btn-buy-${b.id}" ${h?"":"disabled"} class="w-full py-2 ${h?"bg-yellow-400 text-black hover:bg-black hover:text-white":"bg-gray-100 text-gray-400 cursor-not-allowed"} border-2 border-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1">
          🪙 ${b.cost} Altın Al
        </button>
      `,y+=`
      <div class="border-2 border-black bg-white p-3 flex flex-col justify-between shadow-[3px_3px_0_rgba(0,0,0,1)] relative group ${c?"bg-yellow-50/50 border-yellow-500":""}">
        ${c?`
          <div class="absolute -top-2.5 -right-2 px-1.5 py-0.5 text-[8px] font-mono font-black text-white bg-black border border-black uppercase rotate-6">
            KuŞanıldı
          </div>
        `:""}

        <div class="flex items-start gap-3 mb-2.5">
          <div class="w-12 h-12 rounded-none bg-neutral-100 border-2 border-black flex items-center justify-center text-3xl shrink-0 shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] relative select-none">
            ${b.emoji}
          </div>
          <div class="space-y-0.5">
            <h4 class="text-xs sm:text-sm font-black text-black uppercase leading-none">${b.name}</h4>
            <span class="inline-block text-[8px] font-mono font-black bg-neutral-100 border border-black px-1 uppercase text-black/60 scale-90 origin-left">${b.type}</span>
            <p class="text-[10px] text-gray-500 font-semibold leading-normal mt-1">${b.description}</p>
          </div>
        </div>

        <div class="pt-1.5">
          ${A}
        </div>
      </div>
    `}),y+="</div>",w.innerHTML=y,p.appendChild(w);const x=document.createElement("div");x.className="bg-white border-4 border-black p-5 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black mt-2";let k=`
    <div class="border-b-2 border-black pb-2.5 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div>
        <span class="text-[10px] font-mono font-black uppercase tracking-widest text-black/50">ROZET VİTRİNİ & BAŞARIMLAR</span>
        <h3 class="text-xl sm:text-2xl font-display font-black text-black">MİLLETİN KUPALARI & BAŞARIMLARI</h3>
      </div>
      <div class="text-xs bg-[#4ECDC4] border-2 border-black text-black font-mono font-black px-3 py-1.5 uppercase shadow-[2.5px_2.5px_0_rgba(0,0,0,1)] select-none">
        KAZANILAN: ${((f=t.unlockedAchievements)==null?void 0:f.length)||0} / ${Z.length}
      </div>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
  `;Z.forEach(b=>{var h,A;const m=((h=t.unlockedAchievements)==null?void 0:h.includes(b.id))||!1;let c="";b.id==="balloon_wins_5"?c=` <span class="font-mono text-[9px] font-bold text-gray-500">(${t.balloonWinsCount||0}/5)</span>`:b.id==="collector_3"?c=` <span class="font-mono text-[9px] font-bold text-gray-500">(${((A=t.unlockedAccessories)==null?void 0:A.length)||0}/3)</span>`:b.id==="coin_lord_100"?c=` <span class="font-mono text-[9px] font-bold text-gray-500">(${t.globalCoins||0}/100)</span>`:b.id==="streak_3"&&(c=` <span class="font-mono text-[9px] font-bold text-gray-500">(${t.rewardStreak||0}/3)</span>`),m?k+=`
        <div class="border-2 border-black bg-[#EBFBEE] p-3 flex items-start gap-3 shadow-[2.5px_2.5px_0_rgba(0,0,0,1)] relative overflow-hidden group">
          <div class="absolute -top-1 -right-7 w-20 h-6 bg-emerald-500 text-white border-b border-black flex items-center justify-center text-[7px] font-mono font-black uppercase rotate-45 select-none opacity-80">
            AÇILDI
          </div>
          <div class="w-11 h-11 shrink-0 rounded-none bg-white border-2 border-black flex items-center justify-center text-2xl shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
            ${b.badgeEmoji}
          </div>
          <div class="text-left min-w-0 flex-1">
            <h4 class="text-xs font-black text-black uppercase pr-4 truncate">${b.name}${c}</h4>
            <p class="text-[9px] text-[#2D3748]/85 font-semibold leading-tight mt-0.5">${b.description}</p>
            <div class="mt-1 flex items-center gap-1">
              <span class="text-[8px] font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-1 py-0.2">AÇILDI ✅</span>
            </div>
          </div>
        </div>
      `:k+=`
        <div class="border-2 border-black bg-neutral-50/55 p-3 flex items-start gap-3 shadow-[1.5px_1.5px_0_rgba(0,0,0,0.1)] relative overflow-hidden opacity-75">
          <div class="absolute top-1.5 right-1.5 flex items-center justify-center text-[10px] opacity-45">
            🔒
          </div>
          <div class="w-11 h-11 shrink-0 rounded-none bg-neutral-100 border-2 border-gray-300 flex items-center justify-center text-2xl grayscale pointer-events-none select-none">
            ${b.badgeEmoji.substring(0,2)}
          </div>
          <div class="text-left min-w-0 flex-1">
            <h4 class="text-xs font-black text-gray-400 uppercase truncate pr-3">${b.name}${c}</h4>
            <p class="text-[9px] text-gray-400 font-semibold leading-tight mt-0.5">${b.description}</p>
            <div class="mt-1 flex items-center gap-1">
              <span class="text-[8px] font-mono font-bold bg-gray-100 text-gray-400 border border-gray-200 px-1 py-0.2">KİLİTLİ</span>
            </div>
          </div>
        </div>
      `}),k+="</div>",x.innerHTML=k,e.appendChild(x);const o=document.createElement("div");o.className="flex w-full justify-center pt-3",o.innerHTML=`
    <button id="shop-quit-btn" class="px-10 py-4.5 bg-black text-white border-4 border-black font-black tracking-widest text-xs uppercase cursor-pointer hover:bg-white hover:text-black shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] duration-200 transition-all active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      ◀ Arenaya Dön ve Başla!
    </button>
  `,e.appendChild(o),P.appendChild(e),setTimeout(()=>{var A,$;const b=document.getElementById("shop-upload-trigger-btn"),m=document.getElementById("shop-file-input");b==null||b.addEventListener("click",()=>{m==null||m.click()});const c=document.getElementById("shop-drop-zone");c==null||c.addEventListener("dragover",r=>{r.preventDefault(),c.classList.add("bg-neutral-200")}),c==null||c.addEventListener("dragleave",()=>{c.classList.remove("bg-neutral-200")}),c==null||c.addEventListener("drop",r=>{var l;r.preventDefault(),c.classList.remove("bg-neutral-200");const v=(l=r.dataTransfer)==null?void 0:l.files;v&&v.length>0&&h(v[0])}),m==null||m.addEventListener("change",()=>{const r=m.files;r&&r.length>0&&h(r[0])});function h(r){r.type.startsWith("image/")&&_e(t.id,r,v=>{t.customImage=v,z(t),_.playPowerUp(),K()})}(A=document.getElementById("shop-remove-img-btn"))==null||A.addEventListener("click",()=>{t.customImage=null,z(t),_.playTick(),K()}),J.forEach(r=>{var l,g,E;((l=t.unlockedAccessories)==null?void 0:l.includes(r.id))?(g=document.getElementById(`btn-equip-${r.id}`))==null||g.addEventListener("click",()=>{t.activeAccessory===r.id?t.activeAccessory=null:t.activeAccessory=r.id,z(t),_.playPowerUp(),K()}):(E=document.getElementById(`btn-buy-${r.id}`))==null||E.addEventListener("click",()=>{(t.globalCoins||0)>=r.cost&&(t.globalCoins=(t.globalCoins||0)-r.cost,t.unlockedAccessories||(t.unlockedAccessories=[]),t.unlockedAccessories.push(r.id),t.activeAccessory=r.id,z(t),_.playPowerUp(),K())})}),($=document.getElementById("shop-quit-btn"))==null||$.addEventListener("click",()=>{N(re)})},0)}K();
