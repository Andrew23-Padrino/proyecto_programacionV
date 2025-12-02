const gameData = {
  cell: {
    title: "La Célula Animal",
    image: "assets/img/Celula_animal.jpg",
    hotspots: [
      { name: "Núcleo", x: 51, y: 50, description: "Almacena el material genético (ADN)." },
      { name: "Mitocondria", x: 78, y: 58, description: "Genera la mayor parte de la energía (ATP) de la célula." },
      { name: "Membrana Celular", x: 92, y: 46, description: "Controla qué sustancias entran y salen de la célula." },
      { name: "Citoplasma", x: 60, y: 66, description: "Sustancia gelatinosa que llena la célula." },
      { name: "Retículo Endoplasmático", x: 47, y: 58, description: "Sintetiza proteínas y lípidos." },
      { name: "Lisosoma", x: 34, y: 32, description: "Se encarga de la digestión celular." },
    ],
  },
  skeleton: {
    title: "El Esqueleto Humano",
    image: "assets/img/Esqueleto_humano.jpg",
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
    image: "assets/img/Flor.png",
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
  score = 0;
  updateScore();
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