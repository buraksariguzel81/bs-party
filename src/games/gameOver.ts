import { state, appRoot, setScreen, sfx, getPlayerAvatarHTML } from '../globals';

export function renderGameOver() {
  const activePlayers = state.players.filter(p => p.active);
  
  // Sort players high to low
  const podium = [...activePlayers].sort((a,b) => b.score - a.score);
  const absoluteWinner = podium[0];

  const container = document.createElement('div');
  container.className = "w-full max-w-4xl bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 flex flex-col items-center space-y-8 animate-fade-in text-center text-black my-auto";

  let podiumHTML = `
    <!-- Top badge ribbon -->
    <div class="flex items-center gap-1.5 px-4 py-1.5 bg-[#FDCB6E] border-2 border-black text-black font-mono text-xs tracking-widest uppercase font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold">
      👑 PARTİ ARENASI SONUÇLANDI
    </div>

    <!-- Celebration Crown text -->
    <div class="space-y-2">
      <h2 class="text-4xl sm:text-5xl font-display font-black text-black uppercase tracking-tight">KAZANAN: ${absoluteWinner.name}!</h2>
      <p class="text-black font-semibold text-sm">Katılan tüm yolculara şükranlarimizi sunariz. İşte genel kapisşma siralamasi:</p>
    </div>

    <!-- Decorative visual Podium cards layout -->
    <div class="flex flex-col sm:flex-row items-end justify-center gap-6 w-full max-w-2xl py-6 select-none leading-none">
  `;

  // Draw podium elements: [2nd, 1st, 3rd] if 3 or 4 players, else simple list
  const arrangePodium = [];
  if (podium.length >= 3) {
    arrangePodium.push(podium[1]); // 2nd on left
    arrangePodium.push(podium[0]); // 1st center
    arrangePodium.push(podium[2]); // 3rd right
    if (podium[3]) arrangePodium.push(podium[3]); // 4th appended
  } else {
    // 2 players simple side-by-side
    arrangePodium.push(podium[0]);
    arrangePodium.push(podium[1]);
  }

  arrangePodium.forEach((player) => {
    const rank = podium.indexOf(player) + 1;
    
    // Customize sizes & margins based on rank
    const barHeight = rank === 1 ? 'h-40 sm:h-48' : rank === 2 ? 'h-32 sm:h-36' : rank === 3 ? 'h-24 sm:h-28' : 'h-16 sm:h-20';
    const fillBg = rank === 1 ? 'bg-[#FFEAA7]' : rank === 2 ? 'bg-[#DFE6E9]' : rank === 3 ? 'bg-[#FAB1A0]' : 'bg-gray-100';
    const stripeBg = rank === 1 ? 'bg-[#F1C40F]' : rank === 2 ? 'bg-[#BDC3C7]' : rank === 3 ? 'bg-[#E67E22]' : 'bg-gray-400';

    podiumHTML += `
      <div class="flex-1 flex flex-col items-center w-full">
        <!-- Badge Avatar bubble -->
        <div class="relative ${rank === 1 ? 'animate-bounce' : ''} mb-3.5 flex items-center justify-center">
          ${getPlayerAvatarHTML(player, "w-16 h-16 text-3xl")}
          <!-- Crown on P1 -->
          ${rank === 1 ? '<span class="absolute -top-5 text-2xl rotate-12 z-20">👑</span>' : ''}
        </div>
        
        <div class="text-sm font-black text-black max-w-[120px] truncate mb-1">${player.name}</div>
        <div class="text-[10px] font-mono text-black/60 tracking-wider mb-2">${player.avatarName}</div>

        <!-- Standing Podium Block -->
        <div class="w-full ${fillBg} border-4 border-black rounded-2xl ${barHeight} flex flex-col justify-center items-center gap-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-4 ${stripeBg} border-b-2 border-black"></div>
          <span class="text-4xl font-display font-black text-black mt-2">${rank}.</span>
          ${state.isEliminationMode && player.isEliminated ? `
            <span class="font-black text-[10px] text-red-700 font-mono bg-[#FFF0F2] border-2 border-[#FF7675] px-2 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] rounded select-none">❌ ELENDİ</span>
          ` : `
            <span class="font-black text-xs text-black font-mono bg-white border border-black px-2 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)] font-bold">${player.score} <span class="text-[9px] text-black/60 font-black">Pts</span></span>
          `}
        </div>
      </div>
    `;
  });

  // --- INJECT TOURNAMENT DOMINANCE MAP WITH DYNAMIC SVG BAR CHART ---
  const totalSum = activePlayers.reduce((acc, p) => acc + p.score, 0);
  const maxScore = Math.max(...activePlayers.map(p => p.score), 1);
  
  // Create beautiful mini capsules for the chart legend
  let legendHTML = '';
  podium.forEach(p => {
    const scoreDisplay = state.isEliminationMode && p.isEliminated 
      ? '<strong class="text-red-650 font-black">ELENDİ</strong>'
      : `<span>Puan: <strong class="underline">${p.score}</strong></span>`;
    legendHTML += `
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-black text-[9px] font-mono font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        <span class="w-2.5 h-2.5 border border-black shrink-0" style="background-color: ${p.hexColor};"></span>
        <span>${p.name}: ${scoreDisplay}</span>
      </span>
    `;
  });

  podiumHTML += `
    </div>

    <!-- Live Performance Dominator Chart Section -->
    <div class="w-full bg-white border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left flex flex-col space-y-4 my-2 select-none">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between border-b-4 border-black pb-3 gap-2">
        <div>
          <span class="text-[9px] font-mono uppercase tracking-widest text-black/60 font-black block">ARENA ANALİZ MERKEZİ</span>
          <h3 class="text-lg sm:text-xl font-display font-black text-black uppercase">📊 DOMİNASYON GRAFİĞİ</h3>
        </div>
        <div class="flex flex-wrap gap-1.5 max-w-full">
          ${legendHTML}
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
      <div id="dominance-insight" class="bg-[#FFEAA7] border-4 border-black p-4 text-xs font-black leading-relaxed text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold">
         <!-- Will be computed dynamically below -->
      </div>
    </div>

    <!-- Restart Panel trigger buttons -->
    <div class="flex flex-col sm:flex-row gap-4 w-full justify-center pt-2">
      <button id="restart-to-char" class="px-8 py-4 bg-white hover:bg-black hover:text-white text-black border-4 border-black font-black tracking-wider uppercase text-xs transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer font-display font-bold">
        ◀ Karakter Değiştir
      </button>
      <button id="restart-to-lobby" class="px-10 py-4 bg-[#A29BFE] hover:bg-black hover:text-white text-black border-4 border-black font-black tracking-widest text-sm uppercase transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer font-display font-bold">
        🎮 YENİ PARTİ BAŞLAT
      </button>
    </div>
  `;

  container.innerHTML = podiumHTML;
  appRoot.appendChild(container);

  // --- DRAW THE DYNAMIC SVG CONTENT ---
  const svg = document.getElementById('dominance-chart') as any;
  if (svg) {
    let svgContent = '';
    
    // CSS Styles embedded securely inside the SVG
    svgContent += `
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
    `;
    
    // Define layout sizes
    const chartMinY = 30;
    const chartMaxY = 190;
    const chartHeight = chartMaxY - chartMinY; // 160 px max bar height
    
    // Grid reference markings (0.25, 0.5, 0.75, 1.0)
    [0.25, 0.5, 0.75, 1.0].forEach(ratio => {
      const gScore = Math.round(ratio * maxScore);
      const gY = chartMaxY - (ratio * chartHeight);
      
      svgContent += `
        <!-- Horizontal grid line -->
        <line x1="45" y1="${gY}" x2="470" y2="${gY}" class="grid-line" />
        <text x="22" y="${gY + 3}" class="chart-value-label" text-anchor="middle">${gScore}</text>
      `;
    });
    
    // Solid axis line
    svgContent += `
      <line x1="45" y1="${chartMaxY}" x2="470" y2="${chartMaxY}" class="axis-baseline" />
    `;
    
    // Distribute bars
    const N = activePlayers.length;
    const totalColumnsWidth = 410; // from x=50 to x=460
    const colWidth = totalColumnsWidth / N;
    const barWidth = Math.min(colWidth * 0.55, 60);
    
    activePlayers.forEach((player, i) => {
      const sharePercent = totalSum > 0 ? Math.round((player.score / totalSum) * 100) : 0;
      const barHeight = maxScore > 0 ? (player.score / maxScore) * chartHeight : 0;
      const barY = chartMaxY - barHeight;
      const centerX = 50 + (colWidth * i) + (colWidth / 2);
      const barX = centerX - (barWidth / 2);
      
      const delayMs = i * 150;
      svgContent += `
        <style>
          @keyframes rise-bar-${player.id} {
            from { y: ${chartMaxY}px; height: 0px; }
            to { y: ${barY}px; height: ${barHeight}px; }
          }
          @keyframes rise-shadow-${player.id} {
            from { y: ${chartMaxY + 4}px; height: 0px; }
            to { y: ${barY + 4}px; height: ${barHeight}px; }
          }
          .bar-animated-${player.id} {
            animation: rise-bar-${player.id} 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
            animation-delay: ${delayMs}ms;
          }
          .shadow-animated-${player.id} {
            animation: rise-shadow-${player.id} 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
            animation-delay: ${delayMs}ms;
          }
        </style>
        
        <!-- Neo-brutalist shadow blocks -->
        <rect x="${barX + 4}" y="${chartMaxY + 4}" width="${barWidth}" height="0" fill="black" class="shadow-animated-${player.id}" />
        
        <!-- Interactive Bar rects -->
        <rect 
          id="chart-bar-shape-${player.id}"
          x="${barX}" 
          y="${chartMaxY}" 
          width="${barWidth}" 
          height="0" 
          fill="${player.hexColor}" 
          stroke="black" 
          stroke-width="3.5" 
          class="chart-bar-interactive bar-animated-${player.id}" 
          data-id="${player.id}"
          data-name="${player.name}"
          data-score="${player.score}"
          data-emoji="${player.emoji}"
          data-share="${sharePercent}"
          data-color="${player.hexColor}"
        />
        
        <!-- Champion Mini bouncing icon on Top of Bar -->
        <text 
          x="${centerX}" 
          y="${barY - 12}" 
          font-size="22" 
          text-anchor="middle" 
          class="emoji-actor"
          style="animation-delay: ${delayMs + 500}ms;"
        >
          ${player.emoji}
        </text>
        
        <!-- Player Label Under the Base Line -->
        <text x="${centerX}" y="${chartMaxY + 22}" font-size="11" class="chart-label" text-anchor="middle">
          ${player.name}
        </text>
      `;
    });
    
    svg.innerHTML = svgContent;
  }

  // Bind mouse interactive events for the SVG bar elements
  const bars = container.querySelectorAll('.chart-bar-interactive');
  const tooltip = container.querySelector('#chart-tooltip') as HTMLDivElement | null;

  bars.forEach(bar => {
    bar.addEventListener('mousemove', (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const target = mouseEvent.currentTarget as SVGRectElement;
      
      const pName = target.getAttribute('data-name');
      const pScore = target.getAttribute('data-score');
      const pEmoji = target.getAttribute('data-emoji');
      const pShare = target.getAttribute('data-share');
      const pColor = target.getAttribute('data-color');
      
      if (tooltip && pName) {
        tooltip.style.opacity = '1';
        tooltip.style.borderColor = 'black';
        tooltip.style.backgroundColor = pColor || '#ffffff';
        tooltip.innerHTML = `
          <div class="flex items-center gap-1.5 mb-1 bg-white border border-black px-1 py-0.5 shadow-[1px_1px_0_rgba(0,0,0,1)]">
            <span class="text-sm select-none">${pEmoji}</span>
            <span class="font-black text-[10px] uppercase text-black font-display font-bold">${pName}</span>
          </div>
          <div class="space-y-0.5 leading-none text-[9.5px] font-mono text-black font-black font-bold">
            <div>TOPLAM PUAN: <span class="underline">${pScore} Pts</span></div>
            <div>DOMİNE ORANI: <span>%${pShare}</span></div>
          </div>
        `;
        
        const rect = container.querySelector('#dominance-chart')?.getBoundingClientRect();
        if (rect) {
          const x = mouseEvent.clientX - rect.left + 15;
          const y = mouseEvent.clientY - rect.top - 75;
          tooltip.style.left = `${x}px`;
          tooltip.style.top = `${y}px`;
        }
      }
    });

    bar.addEventListener('mouseleave', () => {
      if (tooltip) {
        tooltip.style.opacity = '0';
      }
    });
  });

  // Calculate dynamic dominance insights tailored text
  const insightDiv = container.querySelector('#dominance-insight');
  if (insightDiv) {
    let message = '';
    const p1 = podium[0];
    const p2 = podium[1];
    
    if (p1 && p2) {
      if (p1.score >= p2.score * 2) {
        message = `⚔️ <strong>DEHŞET-ÜL VAHŞET KUPASI!</strong> <span class="underline">${p1.name}</span>, en yakin rakibi <strong>${p2.name}</strong> oyuncusunu tam manasiyla sürklase etti! Toplam puanlarin %${Math.round((p1.score/totalSum)*100)} kismini elinde tutarak hakiki arenanin hükümdari oldugunu ispatladi! 👑`;
      } else if (p1.score - p2.score <= 12) {
        message = `🔥 <strong>BURUN FARKIYLA NEFES KESEN ŞAMPİYONLUK!</strong> <span class="underline">${p1.name}</span> ve <strong>${p2.name}</strong> final anina dek omuz omuza yaristi. Sadece <strong>${p1.score - p2.score} puanlik</strong> ufacik bir mesafe farkiyla taci kafasina geçiren ${p1.name} oldu! Tebrikler!`;
      } else {
        message = `🏆 <strong>MUAZZAM TAKTİKSEL ÜSTÜNLÜK!</strong> <span class="underline">${p1.name}</span> bu seride temposunu hiç düsürmeyerek toplamda <strong>${p1.score} puana</strong> ulasti. Genel gücün %${Math.round((p1.score/totalSum)*100)}'lik dilimini domine ederek kürsünün ebedi sahibi oldu! ⚡`;
      }
    } else {
      message = `🏆 Şampiyonumuz <strong>${p1.name}</strong>, toplamda topladigi muazzam <strong>${p1.score} puan</strong> ile bu partinin mutlak galibi oldu!`;
    }
    
    insightDiv.innerHTML = message;
  }

  // Bind Buttons
  document.getElementById('restart-to-char')?.addEventListener('click', () => setScreen('charSelect'));
  document.getElementById('restart-to-lobby')?.addEventListener('click', () => {
    // Reset general points
    state.players.forEach(p => p.score = 0);
    setScreen('lobby');
  });
}
