// src/js/testimonials.js
// Fetch sample users from randomuser.me and render testimonial cards.
// Also fetch and render attribution from /copyright endpoint.

const SAMPLE_QUOTES = [
  "Los juegos hicieron que aprender fuera divertido y memorable.",
  "Ahora entiendo mejor los conceptos y puedo explicarlos en clase.",
  "Excelente recurso para estudiantes y profesores, muy recomendable.",
  "Actividades interactivas que realmente ayudan a asimilar los contenidos.",
  "Mis calificaciones mejoraron después de practicar con estos juegos.",
  "Divertido, claro y práctico: lo recomiendo a mis compañeros.",
  "Me gustó cómo los conceptos se aplican con ejemplos reales.",
  "Aprendí jugando: retuve la información mucho mejor.",
  "Buena mezcla de teoría y práctica para repasar temas clave."
];

async function fetchRandomUsers(count = 3){
  try{
    const res = await fetch(`https://randomuser.me/api/?results=${count}&nat=us,gb,es,fr`);
    if (!res.ok) throw new Error('RandomUser API error');
    const data = await res.json();
    return data.results || [];
  }catch(e){
    console.warn('fetchRandomUsers failed', e);
    return [];
  }
}

async function fetchAttribution(){
  try{
    const res = await fetch('https://randomuser.me/copyright');
    if (!res.ok) throw new Error('copyright fetch failed');
    const data = await res.json();
    return data;
  }catch(e){
    console.warn('fetchAttribution failed', e);
    return null;
  }
}

function pickQuote(i){ return SAMPLE_QUOTES[i % SAMPLE_QUOTES.length]; }

function renderCard(user, quote){
  const name = `${user.name.first} ${user.name.last}`;
  const role = user.location && user.location.city ? `${user.location.city}` : 'Estudiante';
  const photo = user.picture && user.picture.large ? user.picture.large : '';
  const initials = (user.name.first ? user.name.first.charAt(0) : '') + (user.name.last ? user.name.last.charAt(0) : '');

  const card = document.createElement('div');
  card.className = 'bg-gray-50 p-6 rounded-lg shadow-md';
  card.innerHTML = `
    <div class="flex items-center mb-4">
      <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mr-4 overflow-hidden" style="background:linear-gradient(135deg,#1E6F5C,#289672);">
        ${photo ? `<img src="${photo}" alt="${name}" class="w-full h-full object-cover">` : `<span>${initials}</span>`}
      </div>
      <div>
        <h4 class="font-semibold">${name}</h4>
        <p class="text-sm text-gray-500">${role}</p>
      </div>
    </div>
    <p class="text-gray-600 italic">"${quote}"</p>
  `;
  return card;
}

async function initTestimonials(){
  const container = document.getElementById('testimonials-container');
  const attrEl = document.getElementById('testimonials-attribution');
  if (!container) return;

  // config: how many per page and how many to fetch
  const perPage = 3;
  const totalFetch = 9; // rotate through 3 pages of 3
  let users = [];
  let attribution = null;

  // show loading placeholders
  container.innerHTML = Array.from({length:perPage}).map(()=>`<div class="bg-gray-100 animate-pulse p-6 rounded-lg"><div class="h-12 w-12 bg-gray-300 rounded-full mb-4"></div><div class="h-4 bg-gray-300 rounded mb-2 w-3/4"></div><div class="h-3 bg-gray-300 rounded w-full"></div></div>`).join('');

  try{
    const results = await Promise.all([fetchRandomUsers(totalFetch), fetchAttribution()]);
    users = results[0] || [];
    attribution = results[1] || null;
  }catch(e){ console.warn('initTestimonials fetch failed', e); }

  // fallback to 3 empty items if fetch failed
  if (!users || !users.length) {
    users = [];
  }

  // Shuffle users for variety
  function shuffle(arr){ for (let i = arr.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i+1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  users = shuffle(users.slice());

  // prepare quotes pool, shuffle to avoid repetition
  const quotesPool = shuffle(SAMPLE_QUOTES.slice());

  // state for paging
  let pageStart = 0;
  let rotateTimer = null;

  function renderPage(startIndex){
    // smooth fade-out -> update -> fade-in
    try{ container.style.transition = 'opacity 300ms ease'; container.style.opacity = '0'; }catch(e){}
    setTimeout(()=>{
      container.innerHTML = '';
      for (let i = 0; i < perPage; i++){
        const idx = (startIndex + i) % Math.max(users.length, perPage);
        const user = users.length ? users[idx] : null;
        // pick a unique quote for this visible set
        const quote = quotesPool[(startIndex + i) % quotesPool.length] || pickQuote(i);
        if (user){ container.appendChild(renderCard(user, quote)); }
        else {
          // fallback card
          const f = { name: ['María Sánchez','Juan Rodríguez','Laura Pérez'][i] || 'Estudiante', role: ['Estudiante de Biología','Profesor de Ciencias','Estudiante de Secundaria'][i] || 'Estudiante', quote };
          const card = document.createElement('div'); card.className='bg-gray-50 p-6 rounded-lg shadow-md';
          card.innerHTML = `<div class="flex items-center mb-4"><div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mr-4">${(f.name.split(' ').map(s=>s[0]).join('').slice(0,2))}</div><div><h4 class="font-semibold">${f.name}</h4><p class="text-sm text-gray-500">${f.role}</p></div></div><p class="text-gray-600 italic">"${f.quote}"</p>`;
          container.appendChild(card);
        }
      }
      try{ container.style.opacity = '1'; }catch(e){}
    }, 320);
  }

  // initial render
  renderPage(pageStart);

  // attribution
  if (attrEl){
    if (attribution && attribution.copyright && attribution.copyright.text){
      attrEl.innerHTML = `<div>Datos de usuario: <a href="https://randomuser.me/" target="_blank" rel="noopener noreferrer" class="underline">randomuser.me</a>. ${attribution.copyright.text}</div>`;
    } else {
      attrEl.innerHTML = `<div>Fotos y datos de ejemplo por <a href="https://randomuser.me/" target="_blank" rel="noopener noreferrer" class="underline">Random User</a>.</div>`;
    }
  }

  // rotate every 30s
  rotateTimer = setInterval(()=>{
    pageStart = (pageStart + perPage) % Math.max(users.length, perPage);
    renderPage(pageStart);
  }, 30000);

  // expose stop/start for debugging if needed
  if (window.__testimonialsControl === undefined) window.__testimonialsControl = {};
  window.__testimonialsControl.stop = ()=>{ if (rotateTimer) clearInterval(rotateTimer); };
  window.__testimonialsControl.start = ()=>{ if (rotateTimer) clearInterval(rotateTimer); rotateTimer = setInterval(()=>{ pageStart = (pageStart + perPage) % Math.max(users.length, perPage); renderPage(pageStart); }, 30000); };
}

document.addEventListener('DOMContentLoaded', ()=>{ initTestimonials(); });

export { initTestimonials };
