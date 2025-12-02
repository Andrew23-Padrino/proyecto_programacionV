// --- 1. CONSTANTES Y CONFIGURACIÓN ---
const ROWS = 10;
const COLS = 10;
const CELL_SIZE = 50;
const INSTABILITY_LIMIT = 100;
const INSTABILITY_ENABLED = true;

const ROCK_TYPES = {
  HARD: { name: "Roca Dura", color: "#696969", health: 3 },
  SOFT: { name: "Roca Blanda", color: "#D2B48C", health: 2 },
  SEDIMENT: { name: "Sedimento", color: "#8B7355", health: 1 },
};

const SPECIMEN_IMAGE_SRC = {
  "Cuarzo Robusto": "/img/JuegoGeologia/minerales-fosiles/cuarzo.png",
  "Fósil de Trilobites (Frágil)": "/img/JuegoGeologia/minerales-fosiles/fosil.png",
  "Amatista": "/img/JuegoGeologia/minerales-fosiles/amatista.png",
  "Pirita (Frágil)": "/img/JuegoGeologia/minerales-fosiles/pirita.png",
};

const SPECIMEN_PATTERNS = {
  "Cuarzo Robusto": [ [ { r:0, c:0 } ] ],
  "Fósil de Trilobites (Frágil)": [ [ { r:0, c:0 }, { r:0, c:1 } ], [ { r:0, c:0 }, { r:1, c:0 } ] ],
  "Amatista": [ [ { r:0, c:0 }, { r:0, c:1 }, { r:1, c:1 } ], [ { r:0, c:0 }, { r:1, c:0 }, { r:1, c:1 } ] ],
  "Pirita (Frágil)": [ [ { r:0, c:0 } ] ],
};

let grid = [];
let specimens = [];
let instability = 0;
let selectedTool = "hammer";
let gameOver = false;
let specimensCollected = 0;
let totalSpecimens = 0;
let damageCount = 0;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const toolButtons = document.querySelectorAll(".tool-button");
const instabilityBar = document.getElementById("instability-bar");
const instabilityText = document.getElementById("instability-text");
const instabilityContainer = document.getElementById("instability-bar-container");
const messageLog = document.getElementById("message-log");
const modal = document.getElementById("game-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalCloseBtn = document.getElementById("modal-close-btn");
const rulesModalGeologia = document.getElementById("rules-modal-geologia");
const rulesCloseGeologia = document.getElementById("rules-close-geologia");
const bagDrop = document.getElementById("bag-drop");
let activeToken = null;
const bagStatsEl = document.getElementById("bag-stats");
let bagInventory = {};

class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.rockType = null;
    this.health = 0;
    this.specimenId = null;
    this.isSpecimenRevealed = false;
    this.isExcavated = false;
  }
  draw() {
    const x = this.col * CELL_SIZE;
    const y = this.row * CELL_SIZE;
  if (this.isExcavated) {
    ctx.fillStyle = "#654321";
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    if (this.specimenId) { /* no dibujar espécimen dentro del canvas cuando excavado */ }
  } else {
    ctx.fillStyle = this.rockType.color;
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (this.health < this.rockType.health) ctx.moveTo(x + 10, y + 10);
      ctx.lineTo(x + CELL_SIZE - 10, y + CELL_SIZE - 10);
      if (this.health < this.rockType.health - 1) ctx.moveTo(x + 10, y + CELL_SIZE - 10);
      ctx.lineTo(x + CELL_SIZE - 10, y + 10);
      ctx.stroke();
      
    }
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
  }
}

class Specimen {
  constructor(id, name, isFragile, color, cells, imageSrc) {
    this.id = id;
    this.name = name;
    this.isFragile = isFragile;
    this.color = color;
    this.cells = cells;
    this.status = "hidden";
    this.image = null;
    this.imageLoaded = false;
    if (imageSrc) {
      const img = new Image();
      img.onload = () => { this.image = img; this.imageLoaded = true; try{ drawGame(); }catch(_){} };
      img.src = imageSrc;
    }
  }
  draw(x, y) {
    if (this.status === "collected" || this.status === "extracted") return;
    if (this.image && this.imageLoaded) {
      ctx.drawImage(this.image, x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10);
    }
    if (this.status === "damaged") {
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 10);
      ctx.lineTo(x + CELL_SIZE - 10, y + CELL_SIZE - 10);
      ctx.stroke();
    }
  }
  checkCollected() {
    const allCellsExcavated = this.cells.every(({ row, col }) => grid[row][col].isExcavated);
    if (allCellsExcavated && this.status !== "collected" && this.status !== "extracted") {
      this.status = "extracted";
      spawnSpecimenToken(this);
      logMessage(`¡Espécimen disponible: ${this.name}! Arrástralo a la bolsa.`, "info");
    }
  }
}

function init() {
  createGrid();
  placeSpecimens();
  addEventListeners();
  drawGame();
  logMessage("Excavación iniciada. ¡Buena suerte, geólogo!");
  if (!INSTABILITY_ENABLED) {
    instability = 0;
    if (instabilityContainer) instabilityContainer.classList.add("hidden");
  }
  bagInventory = {};
  damageCount = 0;
  updateBagStats();
}

function createGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const cell = new Cell(r, c);
      const rand = Math.random();
      if (rand < 0.33) cell.rockType = ROCK_TYPES.HARD;
      else if (rand < 0.66) cell.rockType = ROCK_TYPES.SOFT;
      else cell.rockType = ROCK_TYPES.SEDIMENT;
      cell.health = cell.rockType.health;
      row.push(cell);
    }
    grid.push(row);
  }
}

function placeSpecimens() {
  const occ = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const defs = [
    { name: "Cuarzo Robusto", fragile: false, color: "#E6E6FA" },
    { name: "Fósil de Trilobites (Frágil)", fragile: true, color: "#A0522D" },
    { name: "Amatista", fragile: false, color: "#9966CC" },
    { name: "Pirita (Frágil)", fragile: true, color: "#DAA520" },
  ];
  const SPECIMENS_TO_PLACE = 12;
  specimens = [];
  let nextId = 1;
  for (let i = 0; i < SPECIMENS_TO_PLACE; i++) {
    const pick = defs[Math.floor(Math.random() * defs.length)];
    const patternList = SPECIMEN_PATTERNS[pick.name] || [ [ { r:0, c:0 } ] ];
    const pattern = patternList[Math.floor(Math.random() * patternList.length)];
    const cells = allocatePatternRandom(pattern, occ);
    const sp = new Specimen(nextId++, pick.name, pick.fragile, pick.color, cells, SPECIMEN_IMAGE_SRC[pick.name]);
    specimens.push(sp);
  }
  totalSpecimens = specimens.length;
  specimens.forEach((specimen) => {
    specimen.cells.forEach(({ row, col }) => {
      if (grid[row] && grid[row][col]) grid[row][col].specimenId = specimen.id;
    });
  });
}

function allocatePatternRandom(pattern, occ){
  const maxTries = 500;
  for (let t=0; t<maxTries; t++){
    const baseRow = Math.floor(Math.random() * ROWS);
    const baseCol = Math.floor(Math.random() * COLS);
    const cells = pattern.map(p => ({ row: baseRow + p.r, col: baseCol + p.c }));
    const fits = cells.every(c => c.row >= 0 && c.row < ROWS && c.col >=0 && c.col < COLS && !occ[c.row][c.col]);
    if (fits){
      cells.forEach(c => { occ[c.row][c.col] = true; });
      return cells;
    }
  }
  // fallback: first available single cell
  for (let r=0;r<ROWS;r++){
    for (let c=0;c<COLS;c++){
      if (!occ[r][c]) { occ[r][c] = true; return [ { row:r, col:c } ]; }
    }
  }
  return [ { row: 0, col: 0 } ];
}

function addEventListeners() {
  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedTool = button.dataset.tool;
      toolButtons.forEach((btn) => btn.classList.remove("selected"));
      button.classList.add("selected");
      logMessage(`Herramienta seleccionada: ${selectedTool}.`);
    });
  });
  canvas.addEventListener("click", handleCanvasClick);
  modalCloseBtn.addEventListener("click", () => {
    hideModal();
    if (gameOver) {
      instability = 0;
      specimensCollected = 0;
      gameOver = false;
      bagInventory = {};
      updateBagStats();
      init();
    }
  });
  if (rulesCloseGeologia && rulesModalGeologia) {
    rulesCloseGeologia.addEventListener("click", () => {
      rulesModalGeologia.classList.add("hidden");
    });
  }
  if (bagDrop) {
    bagDrop.addEventListener("dragenter", ()=> bagDrop.classList.add("ring-4","ring-amber-300"));
    bagDrop.addEventListener("dragleave", ()=> bagDrop.classList.remove("ring-4","ring-amber-300"));
  }
}

function handleCanvasClick(e) {
  if (gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
  if (selectedTool === "grab") {
    const cell = grid[row][col];
    const specimen = cell.specimenId ? specimens.find((s) => s.id === cell.specimenId) : null;
    if (specimen && specimen.status === "extracted") {
      spawnSpecimenToken(specimen);
      return;
    }
    logMessage("No hay espécimen listo para recoger aquí.", "info");
    return;
  }
  excavate(row, col);
}

function excavate(row, col) {
  const cell = grid[row][col];
  if (cell.isExcavated) return;
  let instabilityIncrease = 0;
  const specimen = cell.specimenId ? specimens.find((s) => s.id === cell.specimenId) : null;
  switch (selectedTool) {
    case "hammer":
      instabilityIncrease = cell.rockType.name === "Roca Dura" ? 10 : 8;
      cell.health -= 2;
      logMessage("¡CLANG! Golpe de martillo.");
      if (specimen && specimen.isFragile && specimen.status === "hidden") {
        specimen.status = "damaged"; damageCount++;
        logMessage(`¡OH NO! Has golpeado un ${specimen.name} frágil con el martillo y lo has dañado.`, "error");
      }
      break;
    case "chisel":
      instabilityIncrease = 3;
      cell.health -= 1;
      logMessage("Tac, tac, tac... Cincelando.");
      break;
    
  }
  if (cell.health <= 0) {
    cell.isExcavated = true;
    logMessage(`Roca ${cell.rockType.name} eliminada en [${row}, ${col}].`);
    if (specimen) specimen.checkCollected();
  }
  updateInstability(instabilityIncrease);
  drawGame();
  if (specimensCollected === totalSpecimens) endGame(true);
}

function updateInstability(increase) {
  if (!INSTABILITY_ENABLED) return;
  if (gameOver) return;
  instability += increase;
  if (instability > INSTABILITY_LIMIT) {
    instability = INSTABILITY_LIMIT;
    endGame(false);
  }
  const percentage = (instability / INSTABILITY_LIMIT) * 100;
  instabilityBar.style.width = `${percentage}%`;
  instabilityText.innerText = `${instability} / ${INSTABILITY_LIMIT}`;
  if (percentage > 80) instabilityBar.style.backgroundColor = "#dc3545";
  else if (percentage > 50) instabilityBar.style.backgroundColor = "#ffc107";
  else instabilityBar.style.backgroundColor = "#28a745";
}

function endGame(didWin) {
  gameOver = true;
  if (didWin) {
    logMessage("¡Ganaste! Obtuviste todos los minerales y fósiles de la pared.", "success");
    const summaryHtml = buildCollectedSummaryHTML();
    showModalHTML("¡Ganaste! — Obtuviste todo", summaryHtml);
    (async ()=>{ try{ const { firebaseServices_ap } = await import('/src/games/originales/firebase-services.js'); const uid = firebaseServices_ap && firebaseServices_ap.auth && firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : null; if (uid){ let grade = Math.round(20 - (instability/10)); if (grade > 20) grade = 20; if (grade < 0) grade = 0; await firebaseServices_ap.setSubjectGrade_ap(uid, 'geologia', grade); try{ await firebaseServices_ap.addMatchResult_ap({ winnerUid: uid, loserUid: null, materia: 'geologia', subjectScore: grade, pointsAwarded: 10, attempts: [{ instability, damageCount }] }); }catch(e){} try{ await firebaseServices_ap.addUserMatchSummary_ap(uid, { materia: 'geologia', subjectScore: grade, pointsAwarded: 10, attemptsCount: damageCount, fecha: new Date() }); }catch(e){} } }catch(e){} })();
  } else {
    logMessage("¡DERRUMBE! La pared es inestable y se ha venido abajo. ¡Evacuación inmediata!", "error");
    const summaryHtml = buildCollectedSummaryHTML();
    showModalHTML("Derrumbe — Hallazgos recogidos", summaryHtml);
    (async ()=>{ try{ const { firebaseServices_ap } = await import('/src/games/originales/firebase-services.js'); const uid = firebaseServices_ap && firebaseServices_ap.auth && firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : null; if (uid){ let grade = Math.round(20 - (instability/10)); if (grade > 20) grade = 20; if (grade < 0) grade = 0; await firebaseServices_ap.setSubjectGrade_ap(uid, 'geologia', grade); try{ await firebaseServices_ap.addMatchResult_ap({ winnerUid: null, loserUid: uid, materia: 'geologia', subjectScore: grade, pointsAwarded: 0, attempts: [{ instability, damageCount }] }); }catch(e){} try{ await firebaseServices_ap.addUserMatchSummary_ap(uid, { materia: 'geologia', subjectScore: grade, pointsAwarded: 0, attemptsCount: damageCount, fecha: new Date() }); }catch(e){} } }catch(e){} })();
  }
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r][c].draw();
    }
  }
}

function logMessage(message, type = "normal") {
  if (!messageLog) { try{ console.debug(message); }catch(_){ } return; }
  const p = document.createElement("p");
  p.innerText = message;
  switch (type) {
    case "error": p.className = "text-red-400 text-sm"; break;
    case "success": p.className = "text-green-400 text-sm font-bold"; break;
    case "info": p.className = "text-blue-300 text-sm italic"; break;
    default: p.className = "text-gray-300 text-sm"; break;
  }
  messageLog.appendChild(p);
  messageLog.scrollTop = messageLog.scrollHeight;
}

function showModal(title, message) {
  modalTitle.innerText = title;
  modalMessage.innerText = message;
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0", "scale-90");
    modal.classList.add("opacity-100", "scale-100");
  }, 10);
}

function hideModal() {
  modal.classList.add("opacity-0", "scale-90");
  modal.classList.remove("opacity-100", "scale-100");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

function spawnSpecimenToken(specimen) {
  if (!specimen || specimen.status !== "extracted") return;
  if (specimen._tokenSpawned) return;
  const first = specimen.cells[0];
  const rect = canvas.getBoundingClientRect();
  const token = document.createElement("div");
  token.style.position = "absolute";
  token.style.left = `${rect.left + first.col * CELL_SIZE + 5}px`;
  token.style.top = `${rect.top + first.row * CELL_SIZE + 5}px`;
  token.style.width = `${CELL_SIZE - 10}px`;
  token.style.height = `${CELL_SIZE - 10}px`;
  token.style.zIndex = "1000";
  token.style.cursor = "grab";
  token.style.borderRadius = "6px";
  if (specimen.image && specimen.imageLoaded) {
    token.style.backgroundImage = `url(${specimen.image.src})`;
    token.style.backgroundSize = "cover";
    token.style.backgroundPosition = "center";
  } else {
    token.style.background = specimen.color;
  }
  token.dataset.specimenId = String(specimen.id);
  let dragging = false; let ox = 0; let oy = 0;
  const onDown = (e)=>{ dragging = true; token.style.cursor = "grabbing"; ox = e.clientX - token.offsetLeft; oy = e.clientY - token.offsetTop; document.addEventListener("pointermove", onMove); document.addEventListener("pointerup", onUp, { once: true }); };
  const onMove = (e)=>{ if (!dragging) return; const x = e.clientX - ox; const y = e.clientY - oy; token.style.left = `${x}px`; token.style.top = `${y}px`; const bagRect = bagDrop ? bagDrop.getBoundingClientRect() : null; if (bagRect){ const centerX = x + (CELL_SIZE-10)/2; const centerY = y + (CELL_SIZE-10)/2; const inside = centerX >= bagRect.left && centerX <= bagRect.right && centerY >= bagRect.top && centerY <= bagRect.bottom; bagDrop.classList.toggle("ring-4", inside); bagDrop.classList.toggle("ring-amber-300", inside); }};
  const onUp = (e)=>{ dragging = false; token.style.cursor = "grab"; document.removeEventListener("pointermove", onMove); const bagRect = bagDrop ? bagDrop.getBoundingClientRect() : null; if (bagRect){ const x = token.offsetLeft; const y = token.offsetTop; const centerX = x + (CELL_SIZE-10)/2; const centerY = y + (CELL_SIZE-10)/2; const inside = centerX >= bagRect.left && centerX <= bagRect.right && centerY >= bagRect.top && centerY <= bagRect.bottom; if (inside){ token.remove(); specimen.status = "collected"; specimensCollected++; addToBag(specimen); logMessage(`Has guardado en la bolsa: ${specimen.name}.`, specimen.isFragile ? "normal" : "success"); drawGame(); if (specimensCollected === totalSpecimens) endGame(true); return; } }
    token.style.left = `${rect.left + first.col * CELL_SIZE + 5}px`; token.style.top = `${rect.top + first.row * CELL_SIZE + 5}px`;
  };
  token.addEventListener("pointerdown", onDown);
  document.body.appendChild(token);
  activeToken = token;
  specimen._tokenSpawned = true;
}

function addToBag(specimen){ const n = specimen && specimen.name ? specimen.name : 'Desconocido'; bagInventory[n] = (bagInventory[n]||0) + 1; updateBagStats(); }

function updateBagStats(){ if (!bagStatsEl) return; const entries = Object.entries(bagInventory); if (!entries.length){ bagStatsEl.innerHTML = '<span class="text-gray-600">Vacía</span>'; return } bagStatsEl.innerHTML = entries.map(([name,count])=> `<div>${name}: <strong>${count}</strong></div>`).join(''); }

init();
function showModalHTML(title, html) {
  modalTitle.innerText = title;
  modalMessage.innerHTML = html;
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0", "scale-90");
    modal.classList.add("opacity-100", "scale-100");
  }, 10);
}

const SPECIMEN_KNOWLEDGE = {
  "Cuarzo Robusto": {
    label: "Cuarzo (Robusto)",
    desc: "Es uno de los minerales más abundantes y resistentes de la corteza terrestre.",
    dato: "Compuesto de sílice; dureza 7 en Mohs; usado en relojes y electrónica.",
  },
  "Fósil de Trilobites (Frágil)": {
    label: "Fósil de Trilobites",
    desc: "Restos petrificados de antiguos artrópodos marinos de la Era Paleozoica.",
    dato: "Cuerpo dividido en tres lóbulos; excelentes guías para datar rocas.",
  },
  "Amatista": {
    label: "Amatista",
    desc: "Variedad violeta del cuarzo, considerada piedra semipreciosa.",
    dato: "Color por trazas de hierro e irradiación natural; asociada históricamente con realeza.",
  },
  "Pirita (Frágil)": {
    label: "Pirita",
    desc: "Mineral metálico amarillo latón con cristales cúbicos casi perfectos.",
    dato: "Conocida como 'oro de los tontos'; realmente es disulfuro de hierro.",
  },
};

function buildCollectedSummaryHTML(){
  const entries = Object.entries(bagInventory || {});
  if (!entries.length) {
    return `<div>No recogiste minerales en esta partida.</div>`;
  }
  const rows = entries.map(([name,count])=>{
    const info = SPECIMEN_KNOWLEDGE[name] || { label: name, desc: '', dato: '' };
    return `<div style="text-align:left;margin-bottom:10px">
      <div style="font-weight:600">${info.label} — x${count}</div>
      <div style="font-size:13px;color:#ddd">Descripción: ${info.desc}</div>
      <div style="font-size:13px;color:#ddd">Dato clave: ${info.dato}</div>
    </div>`;
  }).join('');
  return `<div>${rows}</div>`;
}
