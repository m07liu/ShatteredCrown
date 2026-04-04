// ── Constants ────────────────────────────────────────────────────────────────
const BOARD_SIZE = 8;
const Team = { WHITE: "White", BLACK: "Black" };
const PieceType = { PAWN:"Pawn", ROOK:"Rook", KNIGHT:"Knight", BISHOP:"Bishop", QUEEN:"Queen", KING:"King" };
const SYMBOLS = {
  [Team.WHITE]: { [PieceType.KING]:"♔", [PieceType.QUEEN]:"♕", [PieceType.ROOK]:"♖", [PieceType.BISHOP]:"♗", [PieceType.KNIGHT]:"♘", [PieceType.PAWN]:"♙" },
  [Team.BLACK]: { [PieceType.KING]:"♚", [PieceType.QUEEN]:"♛", [PieceType.ROOK]:"♜", [PieceType.BISHOP]:"♝", [PieceType.KNIGHT]:"♞", [PieceType.PAWN]:"♟" },
};

// ── Piece stats (mirrors src/pieces/stats.py) ─────────────────────────────────
// All HP = 50 placeholder. Speed = 0 placeholder. Abilities = [] placeholder.
const PIECE_DEFAULTS = {
  [PieceType.PAWN]:   { maxHp:50, attack:10, speed:0, abilities:[] },
  [PieceType.ROOK]:   { maxHp:50, attack:20, speed:0, abilities:[] },
  [PieceType.KNIGHT]: { maxHp:50, attack:15, speed:0, abilities:[] },
  [PieceType.BISHOP]: { maxHp:50, attack:15, speed:0, abilities:[] },
  [PieceType.QUEEN]:  { maxHp:50, attack:25, speed:0, abilities:[] },
  [PieceType.KING]:   { maxHp:50, attack:10, speed:0, abilities:[] },
};

// ── Pieces ───────────────────────────────────────────────────────────────────
class Piece {
  constructor(team, type) {
    this.team     = team;
    this.type     = type;
    this.hasMoved = false;
    const d       = PIECE_DEFAULTS[type];
    this.maxHp    = d.maxHp;
    this.hp       = d.maxHp;
    this.attack   = d.attack;
    this.speed    = d.speed;       // placeholder
    this.abilities= [...d.abilities]; // placeholder
  }
  isEnemy(other) { return other !== null && other.team !== this.team; }
  legalMoves(pos, board) { return []; }
  get hpPercent() { return Math.max(0, this.hp / this.maxHp); }
}

function slide(piece, pos, board, dirs) {
  const moves = [];
  for (const [dr, dc] of dirs) {
    let [r, c] = [pos[0]+dr, pos[1]+dc];
    while (r>=0 && r<8 && c>=0 && c<8) {
      const t = board.get(r, c);
      if (t === null)            { moves.push([r, c]); }
      else if (piece.isEnemy(t)) { moves.push([r, c]); break; }
      else                       { break; }
      r += dr; c += dc;
    }
  }
  return moves;
}

class Pawn extends Piece {
  constructor(team) { super(team, PieceType.PAWN); }
  legalMoves([row, col], board) {
    const moves = [];
    const dir = this.team === Team.WHITE ? -1 : 1;
    const startRow = this.team === Team.WHITE ? 6 : 1;
    const fwd = [row+dir, col];
    if (fwd[0]>=0 && fwd[0]<8 && board.get(...fwd)===null) {
      moves.push(fwd);
      const fwd2 = [row+2*dir, col];
      if (!this.hasMoved && row===startRow && board.get(...fwd2)===null) moves.push(fwd2);
    }
    for (const dc of [-1,1]) {
      const cap = [row+dir, col+dc];
      if (cap[0]>=0&&cap[0]<8&&cap[1]>=0&&cap[1]<8 && this.isEnemy(board.get(...cap))) moves.push(cap);
    }
    return moves;
  }
}
class Rook   extends Piece { constructor(t){super(t,PieceType.ROOK);}   legalMoves(p,b){return slide(this,p,b,[[1,0],[-1,0],[0,1],[0,-1]]);} }
class Knight extends Piece {
  constructor(t){super(t,PieceType.KNIGHT);}
  legalMoves([row,col],board){
    return [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
      .map(([dr,dc])=>[row+dr,col+dc])
      .filter(([r,c])=>r>=0&&r<8&&c>=0&&c<8&&(board.get(r,c)===null||this.isEnemy(board.get(r,c))));
  }
}
class Bishop extends Piece { constructor(t){super(t,PieceType.BISHOP);} legalMoves(p,b){return slide(this,p,b,[[1,1],[1,-1],[-1,1],[-1,-1]]);} }
class Queen  extends Piece { constructor(t){super(t,PieceType.QUEEN);}  legalMoves(p,b){return slide(this,p,b,[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);} }
class King   extends Piece {
  constructor(t){super(t,PieceType.KING);}
  legalMoves([row,col],board){
    const moves=[];
    for(const dr of[-1,0,1]) for(const dc of[-1,0,1]){
      if(dr===0&&dc===0) continue;
      const [r,c]=[row+dr,col+dc];
      if(r>=0&&r<8&&c>=0&&c<8&&(board.get(r,c)===null||this.isEnemy(board.get(r,c)))) moves.push([r,c]);
    }
    return moves;
  }
}

// ── Board ────────────────────────────────────────────────────────────────────
class Board {
  constructor() {
    this._grid = Array.from({length:8}, ()=>Array(8).fill(null));
    this._setup();
  }
  _setup() {
    const back = [Rook,Knight,Bishop,Queen,King,Bishop,Knight,Rook];
    for (let c=0;c<8;c++) {
      this._grid[0][c] = new back[c](Team.BLACK);
      this._grid[7][c] = new back[c](Team.WHITE);
      this._grid[1][c] = new Pawn(Team.BLACK);
      this._grid[6][c] = new Pawn(Team.WHITE);
    }
  }
  get(row,col)        { return this._grid[row][col]; }
  set(row,col,piece)  { this._grid[row][col] = piece; }
  applyMove([sr,sc],[dr,dc]) {
    const captured = this._grid[dr][dc];
    this._grid[dr][dc] = this._grid[sr][sc];
    this._grid[sr][sc] = null;
    if (this._grid[dr][dc]) this._grid[dr][dc].hasMoved = true;
    return captured;
  }
  undoMove([sr,sc],[dr,dc],captured,movedBefore) {
    this._grid[sr][sc] = this._grid[dr][dc];
    this._grid[dr][dc] = captured;
    if (this._grid[sr][sc]) this._grid[sr][sc].hasMoved = movedBefore;
  }
  findKing(team) {
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const p=this._grid[r][c];
      if(p&&p.team===team&&p.type===PieceType.KING) return [r,c];
    }
    return null;
  }
  allPieces(team) {
    const result=[];
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const p=this._grid[r][c];
      if(p&&p.team===team) result.push({pos:[r,c],piece:p});
    }
    return result;
  }
  isInCheck(team) {
    const kp=this.findKing(team);
    if(!kp) return false;
    const opp=team===Team.WHITE?Team.BLACK:Team.WHITE;
    return this.allPieces(opp).some(({pos,piece})=>
      piece.legalMoves(pos,this).some(([r,c])=>r===kp[0]&&c===kp[1])
    );
  }
}

// ── Combat ────────────────────────────────────────────────────────────────────
function resolveAttack(attacker, defender) {
  const damage = attacker.attack;
  defender.hp -= damage;
  return { damage, defenderSurvived: defender.hp > 0 };
}

// ── Game ─────────────────────────────────────────────────────────────────────
class Game {
  constructor() {
    this.board       = new Board();
    this.turn        = Team.WHITE;
    this.status      = "ongoing";
    this.history     = [];
    this.lastCombat  = null; // { damage, defenderSurvived, attackerPos, defenderPos }
  }
  legalMovesFor([row,col]) {
    const piece=this.board.get(row,col);
    if(!piece||piece.team!==this.turn) return [];
    return piece.legalMoves([row,col],this.board)
      .filter(dst=>!this._wouldLeaveInCheck([row,col],dst));
  }
  move(src, dst) {
    if(!this.legalMovesFor(src).some(([r,c])=>r===dst[0]&&c===dst[1])) return false;

    const attacker = this.board.get(...src);
    const defender = this.board.get(...dst);
    this.lastCombat = null;

    if (defender !== null) {
      const result = resolveAttack(attacker, defender);
      this.lastCombat = { ...result, attackerPos: src, defenderPos: dst };

      if (result.defenderSurvived) {
        // Attacker stays — turn advances, no board move
        this.history.push({ src, dst: src, captured: null, combat: result });
        this._switchTurn();
        this._updateStatus();
        return true;
      }
      // Defender died — fall through to normal move
    }

    const movedBefore = attacker.hasMoved;
    const captured    = this.board.applyMove(src, dst);
    this.history.push({ src, dst, captured, combat: this.lastCombat });
    this._switchTurn();
    this._updateStatus();
    return true;
  }
  _wouldLeaveInCheck(src, dst) {
    const attacker   = this.board.get(...src);
    const defender   = this.board.get(...dst);
    const savedHp    = defender?.hp;
    const movedBefore= attacker?.hasMoved ?? false;

    // Force kill for simulation so captures always succeed in check detection
    if (defender) defender.hp = 0;

    const captured = this.board.applyMove(src, dst);
    const inCheck  = this.board.isInCheck(this.turn);
    this.board.undoMove(src, dst, captured, movedBefore);

    if (defender && savedHp !== undefined) defender.hp = savedHp;
    return inCheck;
  }
  _switchTurn() { this.turn=this.turn===Team.WHITE?Team.BLACK:Team.WHITE; }
  _updateStatus() {
    const hasLegal=this.board.allPieces(this.turn).some(({pos})=>this.legalMovesFor(pos).length>0);
    if(!hasLegal) this.status=this.board.isInCheck(this.turn)?"checkmate":"stalemate";
  }
}

// ── UI ────────────────────────────────────────────────────────────────────────
let game        = new Game();
let selected    = null;
let legalDsts   = [];
let lastMove    = null;
let inspectedPos= null;   // last clicked piece pos (any team, any turn)
let isAnimating = false;
let killedPieces = { [Team.WHITE]:[], [Team.BLACK]:[] };
let moveNumber=1, whiteNotation="";

const boardEl   = document.getElementById("board");
const turnDot   = document.getElementById("turn-dot");
const turnLabel = document.getElementById("turn-label");
const statusBan = document.getElementById("status-banner");
const logEl     = document.getElementById("move-log");
const capWhite  = document.getElementById("cap-white");
const capBlack  = document.getElementById("cap-black");
const overlay   = document.getElementById("overlay");
const overlayH2 = document.getElementById("overlay-title");
const overlayP  = document.getElementById("overlay-msg");
const pieceInfo = document.getElementById("piece-info");

function buildBoard() {
  boardEl.innerHTML="";
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const cell=document.createElement("div");
    cell.className=`cell ${(r+c)%2===0?"light":"dark"}`;
    cell.dataset.row=r; cell.dataset.col=c;
    cell.addEventListener("click", onCellClick);
    boardEl.appendChild(cell);
  }
}

function getCell(r,c){ return boardEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`); }

// HP bar element for a piece
function makeHpBar(piece) {
  const wrap = document.createElement("div");
  wrap.className = "hp-bar-wrap";
  const fill = document.createElement("div");
  fill.className = "hp-bar-fill";
  fill.style.width = `${piece.hpPercent * 100}%`;
  // Colour: green → yellow → red as HP drops
  if      (piece.hpPercent > 0.5) fill.style.background = "#4caf50";
  else if (piece.hpPercent > 0.25) fill.style.background = "#f0c040";
  else                              fill.style.background = "#e04040";
  wrap.appendChild(fill);
  return wrap;
}

// Floating damage number animation
function spawnDamageNumber(cell, damage, survived) {
  const el = document.createElement("div");
  el.className = "dmg-number";
  el.textContent = `-${damage}`;
  el.style.color = survived ? "#f0c040" : "#e04040";
  cell.appendChild(el);
  // Remove after animation
  el.addEventListener("animationend", () => el.remove());
}

function render() {
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const cell  = getCell(r,c);
    const piece = game.board.get(r,c);
    cell.classList.remove("selected","legal-move","legal-capture","in-check","last-move","just-hit");
    cell.innerHTML="";
    if(piece){
      const span=document.createElement("span");
      span.className=`piece ${piece.team===Team.WHITE?"white":"black"}`;
      span.textContent=SYMBOLS[piece.team][piece.type];
      cell.appendChild(span);
      cell.appendChild(makeHpBar(piece));
    }
  }

  // Last move highlight
  if(lastMove){
    if(lastMove.survived){
      // Attacker stayed — highlight its square
      getCell(...lastMove.src).classList.add("last-move");
    } else {
      getCell(...lastMove.src).classList.add("last-move");
      getCell(...lastMove.dst).classList.add("last-move");
    }
  }

  if(selected){
    getCell(...selected).classList.add("selected");
    for(const [r,c] of legalDsts){
      const cell=getCell(r,c);
      game.board.get(r,c) ? cell.classList.add("legal-capture") : cell.classList.add("legal-move");
    }
  }
  if(game.board.isInCheck(game.turn)){
    const kp=game.board.findKing(game.turn);
    if(kp) getCell(...kp).classList.add("in-check");
  }

  renderPieceInfo();
  renderPanel();
}

function renderPieceInfo() {
  // Show stats for the selected piece, or the last clicked piece (any team/turn)
  const inspectPos = selected ?? inspectedPos;
  const piece = inspectPos ? game.board.get(...inspectPos) : null;

  if (!piece) {
    pieceInfo.className = "piece-info empty";
    pieceInfo.innerHTML = `<span class="piece-info-hint">Click a piece to inspect</span>`;
    return;
  }

  pieceInfo.className = "piece-info";
  const teamClass = piece.team === Team.WHITE ? "white" : "black";
  const hpPct     = Math.max(0, piece.hp / piece.maxHp) * 100;
  const hpColor   = hpPct > 50 ? "#4caf50" : hpPct > 25 ? "#f0c040" : "#e04040";
  const abilities = piece.abilities.length
    ? piece.abilities.map(a => a.name).join(", ")
    : "None (placeholder)";

  pieceInfo.innerHTML = `
    <div class="piece-info-header">
      <span class="piece-info-symbol ${teamClass}">${SYMBOLS[piece.team][piece.type]}</span>
      <div>
        <div class="piece-info-name">${piece.type}</div>
        <div class="piece-info-team">${piece.team}</div>
      </div>
    </div>

    <div class="stat-row">
      <span class="stat-label">HP</span>
      <div class="pi-hp-bar-wrap">
        <div class="pi-hp-bar-fill" style="width:${hpPct}%;background:${hpColor}"></div>
      </div>
      <span class="stat-value">${piece.hp} / ${piece.maxHp}</span>
    </div>

    <div class="stat-row">
      <span class="stat-label">Attack</span>
      <span class="stat-value">${piece.attack}</span>
    </div>

    <div class="stat-row">
      <span class="stat-label">Speed</span>
      <span class="stat-value">${piece.speed} (placeholder)</span>
    </div>

    <div class="stat-row">
      <span class="stat-label">Abilities</span>
      <span class="abilities-list">${abilities}</span>
    </div>
  `;
}

function renderPanel() {
  const white=game.turn===Team.WHITE;
  turnDot.className=white?"white":"black";
  turnLabel.textContent=`${game.turn}'s turn`;
  if(game.status==="ongoing"){
    if(game.board.isInCheck(game.turn)){ statusBan.textContent="CHECK!"; statusBan.className="alert"; }
    else { statusBan.textContent=""; statusBan.className=""; }
  } else {
    const msg=game.status==="checkmate"
      ? `Checkmate — ${game.turn===Team.WHITE?Team.BLACK:Team.WHITE} wins!`
      : "Stalemate — draw!";
    statusBan.textContent=msg; statusBan.className="gameover";
    showOverlay();
  }
  capWhite.textContent=killedPieces[Team.BLACK].map(p=>SYMBOLS[Team.BLACK][p.type]).join(" ")||"—";
  capBlack.textContent=killedPieces[Team.WHITE].map(p=>SYMBOLS[Team.WHITE][p.type]).join(" ")||"—";
}

function showOverlay() {
  if(game.status==="checkmate"){
    const winner=game.turn===Team.WHITE?Team.BLACK:Team.WHITE;
    overlayH2.textContent="Checkmate!";
    overlayP.textContent=`${winner} wins the crown.`;
  } else {
    overlayH2.textContent="Stalemate";
    overlayP.textContent="The battle ends in a draw.";
  }
  overlay.classList.add("show");
}

function logMove(src, dst, piece, combat) {
  const files="abcdefgh";
  const toAlg=([r,c])=>`${files[c]}${8-r}`;
  const sym=SYMBOLS[piece.team][piece.type];
  let notation;
  if(combat && combat.defenderSurvived){
    notation=`${sym}${toAlg(src)}⚔${toAlg(dst)} (-${combat.damage}hp)`;
  } else if(combat){
    notation=`${sym}${toAlg(src)}→${toAlg(dst)}× (-${combat.damage}hp)`;
  } else {
    notation=`${sym}${toAlg(src)}→${toAlg(dst)}`;
  }
  if(piece.team===Team.WHITE){ whiteNotation=notation; }
  else {
    const entry=document.createElement("div");
    entry.className="log-entry";
    entry.innerHTML=`<span class="num">${moveNumber}.</span><span class="notation">${whiteNotation}</span><span class="notation">${notation}</span>`;
    logEl.appendChild(entry);
    logEl.scrollTop=logEl.scrollHeight;
    moveNumber++; whiteNotation="";
  }
}

// ── Attack animation ──────────────────────────────────────────────────────────
function animateAttack(src, dst, attackerPiece, defenderPiece, combat, onComplete) {
  isAnimating = true;

  const srcCell = getCell(...src);
  const dstCell = getCell(...dst);
  const sr  = srcCell.getBoundingClientRect();
  const dr  = dstCell.getBoundingClientRect();
  const sx  = sr.left + sr.width  / 2;
  const sy  = sr.top  + sr.height / 2;
  const offX = (dr.left + dr.width  / 2) - sx;
  const offY = (dr.top  + dr.height / 2) - sy;
  const arc  = Math.min(32, Math.hypot(offX, offY) * 0.28);
  const spin = offX >= 0 ? 10 : -10;

  // Floating ghost of the attacker
  const ghost = document.createElement("span");
  ghost.className = `piece ${attackerPiece.team === Team.WHITE ? "white" : "black"}`;
  ghost.textContent = SYMBOLS[attackerPiece.team][attackerPiece.type];
  Object.assign(ghost.style, {
    position:      "fixed",
    left:          `${sx}px`,
    top:           `${sy}px`,
    fontSize:      "44px",
    lineHeight:    "1",
    zIndex:        "50",
    pointerEvents: "none",
    willChange:    "transform",
    transform:     "translate(-50%,-50%)",
    filter:        "drop-shadow(1px 2px 4px rgba(0,0,0,.8)) drop-shadow(0 0 14px rgba(255,210,60,.9))",
  });
  document.body.appendChild(ghost);

  // Hide the real piece at src while the ghost is airborne
  const srcSpan = srcCell.querySelector(".piece");
  if (srcSpan) srcSpan.style.opacity = "0";

  // ── Arc flight to defender ────────────────────────────────────────────────
  const fly = ghost.animate([
    { transform: `translate(-50%,-50%) scale(1) rotate(0deg)` },
    { transform: `translate(calc(-50% + ${offX * .5}px), calc(-50% + ${offY * .5 - arc}px)) scale(1.22) rotate(${spin}deg)`, offset: .45 },
    { transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(.85) rotate(0deg)` },
  ], { duration: 210, easing: "ease-in", fill: "forwards" });

  fly.onfinish = () => {
    // Damage number at the exact moment of impact
    spawnDamageNumber(dstCell, combat.damage, combat.defenderSurvived);

    // Clash spark (⚔ hit / 💥 kill)
    const clash = document.createElement("div");
    clash.className = "clash-fx";
    clash.textContent = combat.defenderSurvived ? "⚔" : "💥";
    dstCell.appendChild(clash);
    clash.addEventListener("animationend", () => clash.remove(), { once: true });

    if (combat.defenderSurvived) {
      // ── Defender survived: flash cell, bounce attacker back ───────────────
      dstCell.classList.add("hit-flash");
      setTimeout(() => dstCell.classList.remove("hit-flash"), 400);

      const bounce = ghost.animate([
        { transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(.85)` },
        { transform: `translate(calc(-50% + ${offX * .12}px), calc(-50% + ${offY * .12}px)) scale(1.06)`, offset: .62 },
        { transform: "translate(-50%,-50%) scale(1)" },
      ], { duration: 195, easing: "ease-out", fill: "forwards" });

      bounce.onfinish = () => {
        ghost.remove();
        if (srcSpan) srcSpan.style.opacity = "";
        isAnimating = false;
        onComplete();
      };

    } else {
      // ── Defender killed: spin defender out, then commit board state ───────
      const dstSpan = dstCell.querySelector(".piece");
      if (dstSpan) dstSpan.style.animation = "deathSpin .45s ease-in forwards";

      setTimeout(() => {
        ghost.remove();
        isAnimating = false;
        onComplete();
      }, 460);
    }
  };
}

function onCellClick(e){
  if(game.status!=="ongoing" || isAnimating) return;
  const row=parseInt(e.currentTarget.dataset.row);
  const col=parseInt(e.currentTarget.dataset.col);

  // Track last clicked piece for info panel (any team, any turn)
  if(game.board.get(row,col)) inspectedPos = [row, col];

  if(selected){
    const isLegal=legalDsts.some(([r,c])=>r===row&&c===col);
    if(isLegal){
      const movingPiece=game.board.get(...selected);
      const targetPiece=game.board.get(row,col);
      const src=[...selected];
      const dst=[row,col];
      game.move(src, dst);
      const combat=game.lastCombat;
      if(targetPiece && combat && !combat.defenderSurvived){
        killedPieces[movingPiece.team].push(targetPiece);
      }
      const survived = combat?.defenderSurvived ?? false;
      lastMove={ src, dst, survived };
      logMove(src, dst, movingPiece, combat);
      selected=null; legalDsts=[];

      // Combat: run animation, defer render until it finishes
      if(targetPiece && combat){
        animateAttack(src, dst, movingPiece, targetPiece, combat, () => render());
        return;
      }
    } else {
      const piece=game.board.get(row,col);
      if(piece?.team===game.turn){ selected=[row,col]; legalDsts=game.legalMovesFor(selected); }
      else { selected=null; legalDsts=[]; }
    }
  } else {
    const piece=game.board.get(row,col);
    if(piece?.team===game.turn){ selected=[row,col]; legalDsts=game.legalMovesFor(selected); }
  }
  render();
}

function newGame(){
  game=new Game(); selected=null; legalDsts=[]; lastMove=null; inspectedPos=null; isAnimating=false;
  killedPieces={[Team.WHITE]:[],[Team.BLACK]:[]}; moveNumber=1; whiteNotation="";
  logEl.innerHTML=""; overlay.classList.remove("show");
  pieceInfo.className="piece-info empty";
  pieceInfo.innerHTML=`<span class="piece-info-hint">Click a piece to inspect</span>`;
  render();
}

document.getElementById("new-game-btn").addEventListener("click",newGame);
document.getElementById("overlay-btn").addEventListener("click",newGame);

buildBoard();
render();
