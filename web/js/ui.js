import { Game } from "./core/game.js";
import { SYMBOLS, Team, PieceType } from "./core/constants.js";

// ── State ──────────────────────────────────────────────────────────────────
let game      = new Game();
let selected  = null;   // [row, col] | null
let legalDsts = [];
let lastMove  = null;   // { src, dst }
let captured  = { [Team.WHITE]: [], [Team.BLACK]: [] };

// ── DOM refs ───────────────────────────────────────────────────────────────
const boardEl    = document.getElementById("board");
const turnDot    = document.getElementById("turn-dot");
const turnLabel  = document.getElementById("turn-label");
const statusBan  = document.getElementById("status-banner");
const logEl      = document.getElementById("move-log");
const capWhiteEl = document.getElementById("cap-white");
const capBlackEl = document.getElementById("cap-black");
const overlay    = document.getElementById("overlay");
const overlayH2  = document.getElementById("overlay-title");
const overlayP   = document.getElementById("overlay-msg");

// ── Build board DOM ────────────────────────────────────────────────────────
function buildBoard() {
  boardEl.innerHTML = "";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = document.createElement("div");
      cell.className = `cell ${(r + c) % 2 === 0 ? "light" : "dark"}`;
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener("click", onCellClick);
      boardEl.appendChild(cell);
    }
  }
}

function getCell(r, c) {
  return boardEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
}

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  // Piece symbols
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell  = getCell(r, c);
      const piece = game.board.get(r, c);

      // Reset overlays
      cell.classList.remove("selected", "legal-move", "legal-capture", "in-check", "last-move");
      cell.innerHTML = "";

      if (piece) {
        const span = document.createElement("span");
        span.className = `piece ${piece.team === Team.WHITE ? "white" : "black"}`;
        span.textContent = SYMBOLS[piece.team][piece.type];
        cell.appendChild(span);
      }
    }
  }

  // Last move
  if (lastMove) {
    getCell(...lastMove.src).classList.add("last-move");
    getCell(...lastMove.dst).classList.add("last-move");
  }

  // Selection + legal moves
  if (selected) {
    getCell(...selected).classList.add("selected");
    for (const [r, c] of legalDsts) {
      const cell = getCell(r, c);
      if (game.board.get(r, c)) cell.classList.add("legal-capture");
      else                       cell.classList.add("legal-move");
    }
  }

  // Check highlight
  if (game.board.isInCheck(game.turn)) {
    const kp = game.board.findKing(game.turn);
    if (kp) getCell(...kp).classList.add("in-check");
  }

  // Panel
  renderPanel();
}

function renderPanel() {
  const white = game.turn === Team.WHITE;
  turnDot.className   = white ? "white" : "black";
  turnLabel.textContent = `${game.turn}'s turn`;

  if (game.status === "ongoing") {
    if (game.board.isInCheck(game.turn)) {
      statusBan.textContent = "CHECK!";
      statusBan.className   = "alert";
    } else {
      statusBan.textContent = "";
      statusBan.className   = "";
    }
  } else {
    const msg = game.status === "checkmate"
      ? `Checkmate — ${game.turn === Team.WHITE ? Team.BLACK : Team.WHITE} wins!`
      : "Stalemate — draw!";
    statusBan.textContent = msg;
    statusBan.className   = "gameover";
    showOverlay();
  }

  capWhiteEl.textContent = captured[Team.BLACK].map(p => SYMBOLS[Team.BLACK][p.type]).join(" ") || "—";
  capBlackEl.textContent = captured[Team.WHITE].map(p => SYMBOLS[Team.WHITE][p.type]).join(" ") || "—";
}

function showOverlay() {
  if (game.status === "checkmate") {
    const winner = game.turn === Team.WHITE ? Team.BLACK : Team.WHITE;
    overlayH2.textContent = "Checkmate!";
    overlayP.textContent  = `${winner} wins the crown.`;
  } else {
    overlayH2.textContent = "Stalemate";
    overlayP.textContent  = "The battle ends in a draw.";
  }
  overlay.classList.add("show");
}

// ── Move log ───────────────────────────────────────────────────────────────
let moveNumber = 1;
let whiteNotation = "";

function logMove(src, dst, piece, cap) {
  const files = "abcdefgh";
  const toAlg = ([r, c]) => `${files[c]}${8 - r}`;
  const sym   = SYMBOLS[piece.team][piece.type];
  const notation = `${sym}${toAlg(src)}→${toAlg(dst)}${cap ? "×" : ""}`;

  if (piece.team === Team.WHITE) {
    whiteNotation = notation;
  } else {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.innerHTML = `<span class="num">${moveNumber}.</span><span class="notation">${whiteNotation}</span><span class="notation">${notation}</span>`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
    moveNumber++;
    whiteNotation = "";
  }
}

// ── Click handler ──────────────────────────────────────────────────────────
function onCellClick(e) {
  if (game.status !== "ongoing") return;
  const row = parseInt(e.currentTarget.dataset.row);
  const col = parseInt(e.currentTarget.dataset.col);

  // If a square is already selected
  if (selected) {
    const isLegal = legalDsts.some(([r, c]) => r === row && c === col);

    if (isLegal) {
      const movingPiece = game.board.get(...selected);
      const targetPiece = game.board.get(row, col);

      game.move(selected, [row, col]);

      if (targetPiece) captured[movingPiece.team].push(targetPiece);
      lastMove = { src: selected, dst: [row, col] };
      logMove(selected, [row, col], movingPiece, !!targetPiece);

      selected  = null;
      legalDsts = [];
    } else {
      // Re-select own piece
      const piece = game.board.get(row, col);
      if (piece?.team === game.turn) {
        selected  = [row, col];
        legalDsts = game.legalMovesFor(selected);
      } else {
        selected  = null;
        legalDsts = [];
      }
    }
  } else {
    const piece = game.board.get(row, col);
    if (piece?.team === game.turn) {
      selected  = [row, col];
      legalDsts = game.legalMovesFor(selected);
    }
  }

  render();
}

// ── New game ───────────────────────────────────────────────────────────────
function newGame() {
  game       = new Game();
  selected   = null;
  legalDsts  = [];
  lastMove   = null;
  captured   = { [Team.WHITE]: [], [Team.BLACK]: [] };
  moveNumber = 1;
  whiteNotation = "";
  logEl.innerHTML = "";
  overlay.classList.remove("show");
  render();
}

document.getElementById("new-game-btn").addEventListener("click", newGame);
document.getElementById("overlay-btn").addEventListener("click", newGame);

// ── Init ───────────────────────────────────────────────────────────────────
buildBoard();
render();
