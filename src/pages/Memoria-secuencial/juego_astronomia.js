function shuffleArray(arr){
  const a = arr.slice();
  for (let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] }
  return a;
}

let discs = [];
let targetIndex = 1;
let currentMode = 'planetas';
let wrongAttempts = 0;
let isFlipping = false;
let gameStatus = 'playing';
let showRules = true;

function setMessage(msg){ const el = document.getElementById('msg'); if (el) el.textContent = msg; }
function getPlanets(){
  return [
    { key:'mercurio', name:'Mercurio', order:1, img:'/img/JuegoAstronomia/Planetas/mercurio.png' },
    { key:'venus', name:'Venus', order:2, img:'/img/JuegoAstronomia/Planetas/venus.png' },
    { key:'tierra', name:'Tierra', order:3, img:'/img/JuegoAstronomia/Planetas/tierra.png' },
    { key:'marte', name:'Marte', order:4, img:'/img/JuegoAstronomia/Planetas/marte.png' },
    { key:'jupiter', name:'Júpiter', order:5, img:'/img/JuegoAstronomia/Planetas/jupiter.png' },
    { key:'saturno', name:'Saturno', order:6, img:'/img/JuegoAstronomia/Planetas/saturno.png' },
    { key:'uranus', name:'Urano', order:7, img:'/img/JuegoAstronomia/Planetas/uranus.png' },
    { key:'neptuno', name:'Neptuno', order:8, img:'/img/JuegoAstronomia/Planetas/neptuno.png' },
    { key:'pluton', name:'Plutón', order:9, img:'/img/JuegoAstronomia/Planetas/pluton.png' }
  ];
}
function getZodiac(){
  return [
    { key:'aries', name:'Aries', order:1, img:'/img/JuegoAstronomia/Constelaciones/aries.png' },
    { key:'taurus', name:'Tauro', order:2, img:'/img/JuegoAstronomia/Constelaciones/taurus.png' },
    { key:'gemini', name:'Géminis', order:3, img:'/img/JuegoAstronomia/Constelaciones/gemini.png' },
    { key:'cancer', name:'Cáncer', order:4, img:'/img/JuegoAstronomia/Constelaciones/Cancer.png' },
    { key:'leo', name:'Leo', order:5, img:'/img/JuegoAstronomia/Constelaciones/leo.png' },
    { key:'virgo', name:'Virgo', order:6, img:'/img/JuegoAstronomia/Constelaciones/virgo.png' },
    { key:'libra', name:'Libra', order:7, img:'/img/JuegoAstronomia/Constelaciones/libra.png' },
    { key:'scorpius', name:'Escorpio', order:8, img:'/img/JuegoAstronomia/Constelaciones/scorpius.png' },
    { key:'sagittarius', name:'Sagitario', order:9, img:'/img/JuegoAstronomia/Constelaciones/sagittarius.png' },
    { key:'capricorn', name:'Capricornio', order:10, img:'/img/JuegoAstronomia/Constelaciones/capricorn.png' },
    { key:'aquarius', name:'Acuario', order:11, img:'/img/JuegoAstronomia/Constelaciones/aquarius.png' },
    { key:'pisces', name:'Piscis', order:12, img:'/img/JuegoAstronomia/Constelaciones/pisces.png' }
  ];
}
function getDataset(){ return currentMode === 'constelaciones' ? getZodiac() : getPlanets(); }
function getTargetName(){ const ds = getDataset(); const next = ds.find(x=> x.order === targetIndex); return next ? next.name : ''; }
function triggerConfetti(){
  const duration = 3000, end = Date.now()+duration;
  (function frame(){
    if (window.confetti){
      window.confetti({ particleCount:5, angle:60, spread:55, origin:{x:0}, colors:['#d4a373','#eab308','#ffffff'] });
      window.confetti({ particleCount:5, angle:120, spread:55, origin:{x:1}, colors:['#d4a373','#eab308','#ffffff'] });
    }
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function render(){
  const root = document.getElementById('root');
  if (!root) return;
  const modeSelHtml = `<div class="mb-3"><label class="text-sm text-gray-600">Modo</label><select id="mode-select" class="ml-2 border rounded px-2 py-1"><option value="planetas" ${currentMode==='planetas'?'selected':''}>Planetas</option><option value="constelaciones" ${currentMode==='constelaciones'?'selected':''}>Constelaciones</option></select></div>`;
  root.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div class="text-center mb-8 z-10">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Memoria Estelar</h1>
        <p id="msg" class="text-xl text-gray-600 font-medium h-8 transition-all duration-300"></p>
      </div>
      <div class="relative bg-white rounded-3xl shadow-xl p-4 md:p-8 w-full max-w-2xl border-4 border-gray-100">
        ${modeSelHtml}
        <button id="btn-restart" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" title="Reiniciar Juego">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
        </button>
        <div id="grid" class="flex flex-wrap justify-center gap-4 md:gap-6 py-4"></div>
      </div>
      <div class="mt-8 text-gray-500 text-sm text-center max-w-md">
        Selecciona el modo y sigue el orden correcto. El juego se reinicia si recargas.
      </div>
      <div id="win-overlay" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div class="bg-white p-8 rounded-2xl shadow-2xl text-center">
          <h2 class="text-5xl mb-4">🏆</h2>
          <h3 class="text-3xl font-bold text-gray-800 mb-2">¡Excelente!</h3>
          <p class="text-gray-600 mb-6">Has completado la secuencia perfecta.</p>
          <button id="btn-play-again" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform">Jugar de Nuevo</button>
        </div>
      </div>
      <div id="rules" class="${showRules ? '' : 'hidden'} fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h3 class="text-2xl font-bold text-gray-800 mb-3">Cómo jugar</h3>
          <div class="text-gray-700 space-y-2">
            <p>En modo Planetas: selecciona de menor a mayor distancia al Sol.</p>
            <p>En modo Constelaciones: sigue el orden del Zodiaco.</p>
            <p>Si te equivocas, se revela la ficha brevemente.</p>
            <p>Ganas al descubrir todas las fichas en orden.</p>
          </div>
          <button id="btn-ok" class="mt-6 w-full bg-primary hover:bg-dark text-white font-semibold py-2 px-4 rounded-lg">Entendido</button>
        </div>
      </div>
    </div>`;

  document.getElementById('btn-restart')?.addEventListener('click', ()=> initGame(currentMode));
  document.getElementById('btn-play-again')?.addEventListener('click', initGame);
  document.getElementById('btn-ok')?.addEventListener('click', ()=>{
    showRules = false; const r = document.getElementById('rules'); if (r) r.classList.add('hidden');
  });
  const modeSelect = document.getElementById('mode-select');
  if (modeSelect) modeSelect.addEventListener('change', (e)=>{ currentMode = e.target.value === 'constelaciones' ? 'constelaciones' : 'planetas'; initGame(currentMode); });

  const grid = document.getElementById('grid');
  discs.forEach((disc, idx)=>{
    const slot = document.createElement('div'); slot.className = 'relative w-20 h-20 md:w-24 md:h-24';
    const ring = document.createElement('div'); ring.className = 'absolute inset-0 rounded-full table-ring box-border opacity-20 pointer-events-none bg-gray-50 transform scale-110'; slot.appendChild(ring);
    const wrapper = document.createElement('div'); wrapper.className = 'w-full h-full perspective-1000 cursor-pointer group'; slot.appendChild(wrapper);
    const card = document.createElement('div'); card.className = 'relative w-full h-full transition-transform duration-500 transform-style-3d'; wrapper.appendChild(card);
    const front = document.createElement('div'); front.className = 'absolute w-full h-full backface-hidden'; card.appendChild(front);
    const frontInner = document.createElement('div'); frontInner.className = 'w-full h-full rounded-full wood-texture wood-grain shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform'; front.appendChild(frontInner);
    const frontDot = document.createElement('div'); frontDot.className = 'w-16 h-16 rounded-full border border-yellow-900/10 opacity-50'; frontInner.appendChild(frontDot);
    const back = document.createElement('div'); back.className = 'absolute w-full h-full backface-hidden rotate-y-180'; card.appendChild(back);
    const backInner = document.createElement('div'); backInner.className = `w-full h-full rounded-full border-4 ${disc.isRevealed ? 'bg-green-50 border-green-600' : 'bg-white border-gray-800'} shadow-inner flex items-center justify-center overflow-hidden`; back.appendChild(backInner);
    const img = document.createElement('img'); img.src = disc.item.img; img.alt = disc.item.name; img.className = 'w-16 h-16 md:w-20 md:h-20 object-contain'; backInner.appendChild(img);
    function refresh(){
      card.classList.toggle('rotate-y-180', disc.isRevealed || disc.isTempRevealed);
      backInner.className = `w-full h-full rounded-full border-4 ${disc.isRevealed ? 'bg-green-50 border-green-600' : 'bg-white border-gray-800'} shadow-inner flex items-center justify-center overflow-hidden`;
    }
    wrapper.addEventListener('click', ()=> handleDiscClick(disc, refresh));
    grid.appendChild(slot);
  });
  setMessage(gameStatus==='won' ? '¡Ganaste! 🎉' : `Busca: ${getTargetName()}`);
}

function initGame(mode){
  if (mode) currentMode = mode;
  const dataset = getDataset();
  const shuffled = shuffleArray(dataset);
  discs = shuffled.map((item,i)=> ({ id:i, item, isRevealed:false, isTempRevealed:false }));
  targetIndex = 1; isFlipping = false; wrongAttempts = 0; gameStatus = 'playing'; setMessage('Encuentra: ' + getTargetName());
  render();
}

async function handleDiscClick(clickedDisc, refresh){
  if (isFlipping || clickedDisc.isRevealed || gameStatus==='won') return;
  if (clickedDisc.item.order === targetIndex){
    clickedDisc.isRevealed = true; refresh();
    const dataset = getDataset();
    const maxOrder = Math.max(...dataset.map(x=> x.order));
    const next = targetIndex + 1;
    if (next > maxOrder){ gameStatus='won'; setMessage('¡Ganaste! 🎉'); triggerConfetti();
      const ov = document.getElementById('win-overlay'); if (ov) ov.classList.remove('hidden');
      try{
        const { firebaseServices_ap } = await import('/src/games/originales/firebase-services.js');
        const uid = firebaseServices_ap && firebaseServices_ap.auth && firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : null;
        if (uid){
          let grade = 20 - (3 * wrongAttempts);
          if (grade > 20) grade = 20; if (grade < 0) grade = 0;
          await firebaseServices_ap.setSubjectGrade_ap(uid, 'astronomia', grade);
          try{ await firebaseServices_ap.addMatchResult_ap({ winnerUid: uid, loserUid: null, materia: 'astronomia', subjectScore: grade, pointsAwarded: 10, attempts: [{ errors: wrongAttempts }] }); }catch(e){}
          try{ await firebaseServices_ap.addUserMatchSummary_ap(uid, { materia: 'astronomia', subjectScore: grade, pointsAwarded: 10, attemptsCount: wrongAttempts, fecha: new Date() }); }catch(e){}
        }
      }catch(e){}
    } else { targetIndex = next; setMessage('¡Bien! Ahora: ' + getTargetName()); }
  } else {
    isFlipping = true; wrongAttempts++; setMessage('¡Ups! Esa ficha es: ' + clickedDisc.item.name);
    clickedDisc.isTempRevealed = true; refresh();
    setTimeout(()=>{ clickedDisc.isTempRevealed = false; refresh(); isFlipping=false; setMessage('Busca: ' + getTargetName()); }, 1000);
  }
}

document.addEventListener('DOMContentLoaded', ()=> initGame(currentMode));
