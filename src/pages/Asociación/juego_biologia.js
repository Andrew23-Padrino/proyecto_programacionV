const gameData = {
  cell: {
    title: "La Célula Animal",
    image: "/src/assets/img/Celula_animal.jpg",
    hotspots: [
      { name: "Núcleo", x: 50, y: 23, description: "Almacena el material genético (ADN)." },
      { name: "Mitocondria", x: 59, y: 68, description: "Genera la mayor parte de la energía (ATP) de la célula." },
      { name: "Membrana Celular", x: 83, y: 50, description: "Controla qué sustancias entran y salen de la célula." },
      { name: "Citoplasma", x: 22, y: 48, description: "Sustancia gelatinosa que llena la célula." },
      { name: "Retículo Endoplasmático", x: 62, y: 42, description: "Sintetiza proteínas y lípidos." },
      { name: "Lisosoma", x: 45, y: 60, description: "Se encarga de la digestión celular." },
    ],
  },
  skeleton: {
    title: "El Esqueleto Humano",
    image: "/src/assets/img/Esqueleto_humano.jpg",
    hotspots: [
      { name: "Cráneo", x: 50, y: 6, description: "Protege el cerebro." },
      { name: "Costillas", x: 50, y: 26, description: "Protegen los pulmones y el corazón." },
      { name: "Húmero", x: 36, y: 31, description: "Hueso de la parte superior del brazo." },
      { name: "Pelvis", x: 50, y: 43, description: "Soporta la columna vertebral y protege órganos." },
      { name: "Fémur", x: 52, y: 58, description: "El hueso más largo y fuerte del cuerpo." },
      { name: "Tibia", x: 52, y: 78, description: "Hueso principal de la espinilla." },
    ],
  },
  flower: {
    title: "La Flor",
    image: "/src/assets/img/Flor.png",
    hotspots: [
      { name: "Pétalo", x: 22, y: 38, description: "Suele ser colorido para atraer a los polinizadores." },
      { name: "Estambre", x: 46, y: 40, description: "Órgano masculino, produce el polen." },
      { name: "Pistilo", x: 50, y: 45, description: "Órgano femenino, contiene el ovario." },
      { name: "Sépalo", x: 50, y: 85, description: "Protege el capullo de la flor antes de que se abra." },
      { name: "Óvulo", x: 49, y: 63, description: "Se convierte en semilla después de la fecundación." },
    ],
  },
};

const levelSelect = document.getElementById("level-select");
const levelTitle = document.getElementById("level-title");
const gameImage = document.getElementById("game-image");
const hotspotContainer = document.getElementById("hotspot-container");
const scoreDisplay = document.getElementById("score-display");
const questionModal = document.getElementById("question-modal");
const modalContent = document.getElementById("modal-content");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const feedbackText = document.getElementById("feedback-text");

let currentLevelKey = null;
let currentLevelData = null;
let currentHotspot = null;
let score = 0;
let totalQuestions = 0;
let answeredHotspots = [];
let wrongAnswers = 0;
let quizScore = 0;

function initGame() {
  Object.keys(gameData).forEach((key) => {
    const level = gameData[key];
    const button = document.createElement("button");
    button.textContent = level.title;
    button.className = "px-4 py-2 bg-white/20 text-white rounded-md font-semibold hover:bg-white/30 transition-all";
    button.onclick = () => loadLevel(key);
    levelSelect.appendChild(button);
  });
  loadLevel(Object.keys(gameData)[0]);
}

function loadLevel(levelKey) {
  currentLevelKey = levelKey;
  currentLevelData = gameData[levelKey];
  levelTitle.textContent = currentLevelData.title;
  gameImage.src = currentLevelData.image;
  hotspotContainer.innerHTML = "";
  answeredHotspots = [];
  totalQuestions = currentLevelData.hotspots.length;
  score = 0; wrongAnswers = 0;
  updateScore();
  syncOverlayToImage();
  if (gameImage.complete) { syncOverlayToImage(); } else { gameImage.onload = () => syncOverlayToImage(); }
  currentLevelData.hotspots.forEach((spot, index) => {
    const hotspotElement = document.createElement("div");
    hotspotElement.className = "hotspot";
    hotspotElement.style.left = `${spot.x}%`;
    hotspotElement.style.top = `${spot.y}%`;
    hotspotElement.dataset.index = index;
    hotspotElement.textContent = "?";
    hotspotElement.onclick = () => onHotspotClick(spot, hotspotElement);
    hotspotContainer.appendChild(hotspotElement);
  });
}

function syncOverlayToImage(){
  try{
    const area = document.getElementById('game-area');
    const imgRect = gameImage.getBoundingClientRect();
    const areaRect = area.getBoundingClientRect();
    const left = Math.max(0, imgRect.left - areaRect.left);
    const top = Math.max(0, imgRect.top - areaRect.top);
    hotspotContainer.style.left = left + 'px';
    hotspotContainer.style.top = top + 'px';
    hotspotContainer.style.width = imgRect.width + 'px';
    hotspotContainer.style.height = imgRect.height + 'px';
  }catch(e){ /* noop */ }
}

window.addEventListener('resize', ()=> syncOverlayToImage());

const QUIZ_POOL = [
  // Célula
  { topic:'celula', q: '¿Qué organelo produce energía (ATP)?', opts: ['Mitocondria','Núcleo','Lisosoma','Ribosoma'], correct: 'Mitocondria' },
  { topic:'celula', q: '¿Qué estructura controla el paso de sustancias?', opts: ['Membrana Celular','Citoplasma','Aparato de Golgi','Centrosoma'], correct: 'Membrana Celular' },
  { topic:'celula', q: '¿Dónde se almacena el material genético?', opts: ['Núcleo','Lisosoma','Retículo Endoplasmático','Citoplasma'], correct: 'Núcleo' },
  { topic:'celula', q: '¿Qué organelo participa en síntesis y transporte de proteínas?', opts: ['Retículo Endoplasmático','Mitocondria','Lisosoma','Ribosoma'], correct: 'Retículo Endoplasmático' },
  // Esqueleto
  { topic:'esqueleto', q: '¿Qué hueso protege el cerebro?', opts: ['Cráneo','Fémur','Pelvis','Costillas'], correct: 'Cráneo' },
  { topic:'esqueleto', q: '¿Qué estructura protege pulmones y corazón?', opts: ['Costillas','Tibia','Húmero','Pelvis'], correct: 'Costillas' },
  { topic:'esqueleto', q: '¿Cuál es el hueso más largo del cuerpo?', opts: ['Fémur','Húmero','Tibia','Radio'], correct: 'Fémur' },
  { topic:'esqueleto', q: '¿Qué hueso principal está en la espinilla?', opts: ['Tibia','Fémur','Radio','Húmero'], correct: 'Tibia' },
  // Flor
  { topic:'flor', q: '¿Qué parte suele ser colorida para atraer polinizadores?', opts: ['Pétalo','Sépalo','Estambre','Pistilo'], correct: 'Pétalo' },
  { topic:'flor', q: '¿Qué órgano masculino produce el polen?', opts: ['Estambre','Pistilo','Sépalo','Pétalo'], correct: 'Estambre' },
  { topic:'flor', q: '¿Qué órgano femenino contiene el ovario?', opts: ['Pistilo','Estambre','Sépalo','Pétalo'], correct: 'Pistilo' },
  { topic:'flor', q: '¿Qué protege el capullo antes de abrirse?', opts: ['Sépalo','Pistilo','Estambre','Pétalo'], correct: 'Sépalo' }
];

function sampleMixedQuiz(count = 5){
  const byTopic = { celula: [], esqueleto: [], flor: [] };
  QUIZ_POOL.forEach(q => { if (byTopic[q.topic]) byTopic[q.topic].push(q); });
  const pick = (arr)=> arr[Math.floor(Math.random()*arr.length)];
  const selected = [];
  // asegurar al menos uno por tema
  ['celula','esqueleto','flor'].forEach(t => { if (byTopic[t].length) selected.push(pick(byTopic[t])); });
  // completar hasta count
  const rest = QUIZ_POOL.filter(q => !selected.includes(q));
  while(selected.length < count && rest.length){ const idx = Math.floor(Math.random()*rest.length); selected.push(rest.splice(idx,1)[0]); }
  // barajar
  return selected.sort(()=> Math.random() - 0.5);
}

function renderQuiz(){
  const cont = document.getElementById('quiz-container');
  if (!cont) return;
  cont.innerHTML = '';
  const questions = sampleMixedQuiz(5);
  questions.forEach((item, idx)=>{
    const block = document.createElement('div');
    const title = document.createElement('div'); title.textContent = `${idx+1}. ${item.q}`; title.className = 'font-medium'; block.appendChild(title);
    const optsWrap = document.createElement('div'); optsWrap.className = 'mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2';
    item.opts.forEach(opt=>{
      const label = document.createElement('label'); label.className = 'flex items-center gap-2 text-sm';
      const input = document.createElement('input'); input.type = 'radio'; input.name = 'quiz_q_'+idx; input.value = opt;
      label.appendChild(input); label.appendChild(document.createTextNode(opt));
      const btn = document.createElement('div'); btn.appendChild(label); optsWrap.appendChild(btn);
    });
    block.appendChild(optsWrap); cont.appendChild(block);
  });
  const submit = document.getElementById('quiz-submit'); const scoreEl = document.getElementById('quiz-score');
  if (submit){
    submit.onclick = ()=>{
      let correct = 0; let answered = 0;
      const n = 5;
      for (let idx=0; idx<n; idx++){
        const sel = document.querySelector('input[name="quiz_q_'+idx+'"]:checked');
        const labelEl = sel ? sel.parentElement : null;
        const text = labelEl ? labelEl.textContent.replace(/^\s+/,'').replace(/\s+$/,'') : '';
        if (sel){ answered++; if (text === questions[idx].correct) correct++; }
      }
      quizScore = Math.min(5, correct) * 0.4;
      if (scoreEl) scoreEl.textContent = `Resultado: ${correct}/5 ( +${quizScore.toFixed(1)} pts )`;
      submit.disabled = true;
      const inputs = Array.from(cont.querySelectorAll('input[type="radio"]')); inputs.forEach(i=> i.disabled = true);
    };
  }
}

document.addEventListener('DOMContentLoaded', renderQuiz);

function onHotspotClick(hotspotData, hotspotElement) {
  if (answeredHotspots.includes(hotspotData.name)) {
    showFeedback(hotspotData, true, true);
    return;
  }
  currentHotspot = { data: hotspotData, element: hotspotElement };
  questionText.textContent = `¿Qué parte es esta?`;
  feedbackText.textContent = "";
  feedbackText.className = "mt-4 p-3 rounded-md text-center font-medium";
  optionsContainer.innerHTML = "";
  const options = generateOptions(hotspotData.name);
  options.forEach((option) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.className = "w-full p-3 bg-gray-100 rounded-lg font-medium text-gray-800 hover:bg-blue-100 hover:text-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500";
    button.onclick = () => checkAnswer(option, button);
    optionsContainer.appendChild(button);
  });
  showModal(true);
}

function generateOptions(correctAnswer) {
  const allNames = currentLevelData.hotspots.map((h) => h.name);
  const wrongAnswers = allNames.filter((name) => name !== correctAnswer);
  wrongAnswers.sort(() => 0.5 - Math.random());
  const options = wrongAnswers.slice(0, 3);
  options.push(correctAnswer);
  options.sort(() => 0.5 - Math.random());
  return options;
}

function checkAnswer(selectedOption, selectedButton) {
  const isCorrect = selectedOption === currentHotspot.data.name;
  Array.from(optionsContainer.children).forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === currentHotspot.data.name) {
      btn.className = "w-full p-3 rounded-lg font-medium transition-all bg-green-500 text-white";
    } else if (btn === selectedButton) {
      btn.className = "w-full p-3 rounded-lg font-medium transition-all bg-red-500 text-white";
    }
  });
  if (isCorrect) {
    score++;
    answeredHotspots.push(currentHotspot.data.name);
    currentHotspot.element.classList.add("answered");
    currentHotspot.element.textContent = "✓";
    showFeedback(currentHotspot.data, true, false);
  } else {
    wrongAnswers++;
    answeredHotspots.push(currentHotspot.data.name);
    currentHotspot.element.classList.add("answered");
    currentHotspot.element.textContent = "✗";
    showFeedback(currentHotspot.data, false, false);
  }
  updateScore();
  setTimeout(() => {
    showModal(false);
    if (score === totalQuestions) {
      showWinMessage();
    }
  }, isCorrect ? 3000 : 2000);
}

function showFeedback(hotspotData, isCorrect, isReview) {
  if (isCorrect) {
    feedbackText.textContent = `¡Correcto! Es ${hotspotData.name}. ${hotspotData.description}`;
    feedbackText.className = "mt-4 p-3 rounded-md text-center font-medium bg-green-100 text-green-800";
  } else if (!isReview) {
    feedbackText.textContent = `Incorrecto. La respuesta correcta es ${hotspotData.name}.`;
    feedbackText.className = "mt-4 p-3 rounded-md text-center font-medium bg-red-100 text-red-800";
  }
  if (isReview) {
    questionText.textContent = `${hotspotData.name}`;
    optionsContainer.innerHTML = `<p class="text-center text-gray-700">${hotspotData.description}</p>`;
    showModal(true);
    setTimeout(() => showModal(false), 2500);
  }
}

function showWinMessage() {
  questionText.textContent = "¡Nivel Completo!";
  optionsContainer.innerHTML = `<p class="text-center text-lg font-semibold text-green-600">¡Felicidades! Has identificado todas las partes.</p>`;
  feedbackText.textContent = "";
  showModal(true);
  setTimeout(() => showModal(false), 3000);
  (async ()=>{
    try{
      const { firebaseServices_ap } = await import('/src/games/originales/firebase-services.js');
      const uid = firebaseServices_ap && firebaseServices_ap.auth && firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : null;
      if (uid){
        let grade = 20 - (3 * wrongAnswers) + (quizScore || 0);
        if (grade > 20) grade = 20; if (grade < 0) grade = 0;
        await firebaseServices_ap.setSubjectGrade_ap(uid, 'biologia', grade);
        try{ await firebaseServices_ap.addMatchResult_ap({ winnerUid: uid, loserUid: null, materia: 'biologia', subjectScore: grade, pointsAwarded: 10, attempts: [{ errors: wrongAnswers }] }); }catch(e){}
        try{ await firebaseServices_ap.addUserMatchSummary_ap(uid, { materia: 'biologia', subjectScore: grade, pointsAwarded: 10, attemptsCount: wrongAnswers, fecha: new Date() }); }catch(e){}
      }
    }catch(e){}
  })();
}

function updateScore() {
  scoreDisplay.textContent = `Puntaje: ${score} / ${totalQuestions}`;
}

function showModal(show) {
  if (show) {
    questionModal.classList.remove("hidden");
    setTimeout(() => {
      modalContent.classList.remove("scale-95", "opacity-0");
      modalContent.classList.add("scale-100", "opacity-100");
    }, 10);
  } else {
    modalContent.classList.remove("scale-100", "opacity-100");
    modalContent.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      questionModal.classList.add("hidden");
    }, 200);
  }
}

initGame();
const rulesModal = document.getElementById("rules-modal");
const rulesClose = document.getElementById("rules-close");
if (rulesClose && rulesModal) {
  rulesClose.onclick = () => rulesModal.classList.add("hidden");
}
