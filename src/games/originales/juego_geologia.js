// --- 1. CONSTANTES Y CONFIGURACIÓN ---
const ROWS = 10;
const COLS = 10;
const CELL_SIZE = 50;
const INSTABILITY_LIMIT = 100;

const ROCK_TYPES = {
  HARD: { name: "Roca Dura", color: "#696969", health: 3 },
  SOFT: { name: "Roca Blanda", color: "#D2B48C", health: 2 },
  SEDIMENT: { name: "Sedimento", color: "#8B7355", health: 1 },
};

let grid = [];
let specimens = [];
let instability = 0;
let selectedTool = "hammer";
let gameOver = false;
let specimensCollected = 0;
let totalSpecimens = 0;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const toolButtons = document.querySelectorAll(".tool-button");
const instabilityBar = document.getElementById("instability-bar");
const instabilityText = document.getElementById("instability-text");
const messageLog = document.getElementById("message-log");
const modal = document.getElementById("game-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalCloseBtn = document.getElementById("modal-close-btn");
const rulesModalGeologia = document.getElementById("rules-modal-geologia");
const rulesCloseGeologia = document.getElementById("rules-close-geologia");

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
      if (this.specimenId) {
        const specimen = specimens.find((s) => s.id === this.specimenId);
        specimen.draw(x, y);
      }
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
      if (this.isSpecimenRevealed && this.specimenId) {
        const specimen = specimens.find((s) => s.id === this.specimenId);
        ctx.fillStyle = specimen.isFragile ? "rgba(255, 0, 0, 0.5)" : "rgba(0, 255, 0, 0.5)";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", x + CELL_SIZE / 2, y + CELL_SIZE / 2);
      }
    }
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
  }
}

class Specimen {
  constructor(id, name, isFragile, color, cells) {
    this.id = id;
    this.name = name;
    this.isFragile = isFragile;
    this.color = color;
    this.cells = cells;
    this.status = "hidden";
  }
  draw(x, y) {
    ctx.fillStyle = this.color;
    ctx.fillRect(x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10);
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
    if (allCellsExcavated && this.status !== "perfect" && this.status !== "damaged") {
      this.status = "perfect";
      specimensCollected++;
      logMessage(`¡Espécimen extraído! Has encontrado un ${this.name} (Perfecto).`, "success");
      showModal("¡Descubrimiento!", `¡Has extraído un ${this.name} en perfectas condiciones!`);
    }
  }
}

function init() {
  createGrid();
  placeSpecimens();
  addEventListeners();
  drawGame();
  logMessage("Excavación iniciada. ¡Buena suerte, geólogo!");
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
  specimens = [
    new Specimen(1, "Cuarzo Robusto", false, "#E6E6FA", [{ row: 2, col: 2 }]),
    new Specimen(2, "Fósil de Trilobites (Frágil)", true, "#A0522D", [
      { row: 5, col: 5 },
      { row: 5, col: 6 },
    ]),
    new Specimen(3, "Amatista", false, "#9966CC", [
      { row: 8, col: 1 },
      { row: 8, col: 2 },
      { row: 9, col: 2 },
    ]),
    new Specimen(4, "Pirita (Frágil)", true, "#DAA520", [{ row: 1, col: 8 }]),
  ];
  totalSpecimens = specimens.length;
  specimens.forEach((specimen) => {
    specimen.cells.forEach(({ row, col }) => {
      if (grid[row] && grid[row][col]) grid[row][col].specimenId = specimen.id;
    });
  });
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
      init();
    }
  });
  if (rulesCloseGeologia && rulesModalGeologia) {
    rulesCloseGeologia.addEventListener("click", () => {
      rulesModalGeologia.classList.add("hidden");
    });
  }
}

function handleCanvasClick(e) {
  if (gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);
  if (row >= 0 && row < ROWS && col >= 0 && col < COLS) excavate(row, col);
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
        specimen.status = "damaged";
        logMessage(`¡OH NO! Has golpeado un ${specimen.name} frágil con el martillo y lo has dañado.`, "error");
      }
      break;
    case "chisel":
      instabilityIncrease = 3;
      cell.health -= 1;
      logMessage("Tac, tac, tac... Cincelando.");
      break;
    case "brush":
      instabilityIncrease = 1;
      logMessage("Fsssh... Limpiando el polvo.");
      if (specimen) {
        cell.isSpecimenRevealed = true;
        logMessage(`¡Interesante! Parece que hay un ${specimen.name} aquí. Es ${specimen.isFragile ? "FRÁGIL" : "ROBUSTO"}.`, "info");
      }
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
    logMessage("¡Nivel completado! Has encontrado todos los especímenes.", "success");
    showModal("¡Expedición Exitosa!", "¡Felicidades! Has extraído todos los especímenes de esta pared.");
  } else {
    logMessage("¡DERRUMBE! La pared es inestable y se ha venido abajo. ¡Evacuación inmediata!", "error");
    showModal("¡DERRUMBE!", "La pared se ha derrumbado. Has perdido los especímenes que quedaban. Ten más cuidado la próxima vez.");
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
  const p = document.createElement("p");
  p.innerText = message;
  switch (type) {
    case "error":
      p.className = "text-red-400 text-sm";
      break;
    case "success":
      p.className = "text-green-400 text-sm font-bold";
      break;
    case "info":
      p.className = "text-blue-300 text-sm italic";
      break;
    default:
      p.className = "text-gray-300 text-sm";
      break;
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

init();