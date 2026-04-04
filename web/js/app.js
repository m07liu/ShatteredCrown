// ── Constants ────────────────────────────────────────────────────────────────
const BOARD_SIZE = 8;
const Team = { WHITE: "White", BLACK: "Black" };
const PieceType = { PAWN:"Pawn", ROOK:"Rook", KNIGHT:"Knight", BISHOP:"Bishop", QUEEN:"Queen", KING:"King" };
const SYMBOLS = {
  [Team.WHITE]: { [PieceType.KING]:"♔", [PieceType.QUEEN]:"♕", [PieceType.ROOK]:"♖", [PieceType.BISHOP]:"♗", [PieceType.KNIGHT]:"♘", [PieceType.PAWN]:"♙" },
  [Team.BLACK]: { [PieceType.KING]:"♚", [PieceType.QUEEN]:"♛", [PieceType.ROOK]:"♜", [PieceType.BISHOP]:"♝", [PieceType.KNIGHT]:"♞", [PieceType.PAWN]:"♟" },
};

// ── Piece stats ───────────────────────────────────────────────────────────────
const PIECE_DEFAULTS = {
  [PieceType.PAWN]:   { maxHp:40,  attack:10, speed:0 },
  [PieceType.ROOK]:   { maxHp:50,  attack:20, speed:0 },
  [PieceType.KNIGHT]: { maxHp:60,  attack:12, speed:0 },
  [PieceType.BISHOP]: { maxHp:30,  attack:20, speed:0 },
  [PieceType.QUEEN]:  { maxHp:100, attack:25, speed:0 },
  [PieceType.KING]:   { maxHp:35,  attack:4,  speed:0 },
};

// ── Ability definitions (for display) ────────────────────────────────────────
const ABILITY_DEFS = {
  [PieceType.PAWN]:   [
    { name:"Strength in Numbers", type:"End-of-Turn",  desc:"+1 HP if adjacent to a friendly pawn" },
  ],
  [PieceType.BISHOP]: [
    { name:"I'm Pope-ing Off",    type:"Active",       desc:"Heal friendly 3×3 neighbours by 7 HP (costs turn)" },
  ],
  [PieceType.ROOK]:   [
    { name:"Its Hammer Time",     type:"Passive",      desc:"Pierce — also damages the enemy behind the target" },
  ],
  [PieceType.KNIGHT]: [
    { name:"Hippity Hoppity",     type:"Active",       desc:"Chain up to 3 attacks; always returns to origin" },
  ],
  [PieceType.QUEEN]:  [
    { name:"Stunning Beauty",     type:"Passive",      desc:"Hit pieces cannot attack on the next turn" },
    { name:"HP Tax",              type:"Passive",      desc:"+10% of target's current HP as bonus damage" },
  ],
  [PieceType.KING]:   [
    { name:"King's Choice",       type:"Once / Match", desc:"One powerful ability chosen before the game" },
  ],
};

const KING_ABILITY_DEFS = [
  { id:"higher_morale", name:"Higher Morale",  desc:"Spawn a Rook on any empty square & King recovers 25% HP" },
  { id:"za_wardou",     name:"Za Wardou",       desc:"Toki wa tomare — opponent loses their next turn" },
  { id:"dirty_deeds",   name:"Dirty Deeds",     desc:"Swap the King's position with any friendly piece" },
  { id:"epitath",       name:"Epitath",          desc:"Reverse the opponent's last move" },
];

// ── Piece factory ─────────────────────────────────────────────────────────────
function createPiece(team, type) {
  switch(type) {
    case PieceType.PAWN:   return new Pawn(team);
    case PieceType.ROOK:   return new Rook(team);
    case PieceType.KNIGHT: return new Knight(team);
    case PieceType.BISHOP: return new Bishop(team);
    case PieceType.QUEEN:  return new Queen(team);
    case PieceType.KING:   return new King(team);
  }
}

// ── Pieces ────────────────────────────────────────────────────────────────────
class Piece {
  constructor(team, type) {
    this.team      = team;
    this.type      = type;
    this.hasMoved  = false;
    const d        = PIECE_DEFAULTS[type];
    this.maxHp     = d.maxHp;
    this.hp        = d.maxHp;
    this.attack    = d.attack;
    this.speed     = d.speed;
    this.stunned   = false;   // cannot capture next turn (Queen: Stunning Beauty)
    this.stunTurns = 0;       // turns of stun remaining
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

// ── Board ─────────────────────────────────────────────────────────────────────
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
  let damage   = attacker.attack;
  let bonusDmg = 0;

  // Queen HP Tax: +10% of defender's current HP (tracked separately for animation)
  if (attacker.type === PieceType.QUEEN) {
    bonusDmg = Math.floor(defender.hp * 0.10);
    damage  += bonusDmg;
  }

  damage = Math.max(1, damage);
  defender.hp -= damage;

  const defenderSurvived = defender.hp > 0;
  const stunApplied      = attacker.type === PieceType.QUEEN && defenderSurvived;

  // Queen Stunning Beauty: stun the defender for their next turn
  // stunTurns=2 because _switchTurn decrements once before the affected team acts
  if (stunApplied) {
    defender.stunned   = true;
    defender.stunTurns = 2;
  }

  return { damage, defenderSurvived, stunApplied, bonusDamage: bonusDmg };
}

// Bishop: heal friendly pieces in 3×3 area around pos (excluding self)
function applyBishopHeal(board, bishopPos) {
  const bishop = board.get(...bishopPos);
  const healed = [];
  const [br, bc] = bishopPos;
  for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) {
    if (dr===0 && dc===0) continue;
    const r=br+dr, c=bc+dc;
    if (r<0||r>=8||c<0||c>=8) continue;
    const piece = board.get(r, c);
    if (piece && piece.team === bishop.team) {
      const healAmt = 7;
      const before  = piece.hp;
      piece.hp = Math.min(piece.maxHp, piece.hp + healAmt);
      if (piece.hp > before) healed.push({ pos:[r,c], amount: piece.hp - before });
    }
  }
  return healed;
}

// Pawn "Strength in Numbers": at end of every turn, rows/cols of 3+ same-team
// pawns each earn +1 HP per pawn in that line.
function applyPawnStrengthInNumbers(board) {
  const buffed = []; // { pos, amount }
  const adj = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for (const team of [Team.WHITE, Team.BLACK]) {
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      const p = board.get(r, c);
      if (!p || p.type !== PieceType.PAWN || p.team !== team) continue;
      const hasNeighbor = adj.some(([dr,dc]) => {
        const nr=r+dr, nc=c+dc;
        if (nr<0||nr>=8||nc<0||nc>=8) return false;
        const n = board.get(nr, nc);
        return n && n.type === PieceType.PAWN && n.team === team;
      });
      if (hasNeighbor) {
        const before = p.hp;
        p.hp = Math.min(p.maxHp, p.hp + 1);
        if (p.hp > before) buffed.push({ pos:[r,c], amount:1 });
      }
    }
  }
  return buffed;
}

// ── Game ──────────────────────────────────────────────────────────────────────
class Game {
  constructor() {
    this.board       = new Board();
    this.turn        = Team.WHITE;
    this.status      = "ongoing";
    this.history     = [];
    this.lastCombat  = null;
    this.lastPawnBuff= [];
    this.lastHeal    = [];
    this.zaWardouSkip= { [Team.WHITE]:0, [Team.BLACK]:0 };
    this.lastSkipped = null;           // team whose turn was just skipped (Za Wardou)
    // Per-team snapshots for Epitath (saved before that team's last move)
    this.epitathSnapshot = { [Team.WHITE]:null, [Team.BLACK]:null };
    this._pendingSnap    = null;       // snapshot taken at start of move()
    // King abilities
    this.kingAbilityChosen = { [Team.WHITE]:null, [Team.BLACK]:null };
    this.kingAbilityUsed   = { [Team.WHITE]:false, [Team.BLACK]:false };
  }

  // ── Standard move ──────────────────────────────────────────────────────────
  move(src, dst) {
    if (!this.legalMovesFor(src).some(([r,c])=>r===dst[0]&&c===dst[1])) return false;

    const attacker = this.board.get(...src);
    const defender = this.board.get(...dst);
    this.lastCombat   = null;
    this.lastPawnBuff = [];
    this.lastHeal     = [];
    const snap        = this._snapshotBoard();

    if (defender !== null) {
      const result = resolveAttack(attacker, defender);
      this.lastCombat = { ...result, attackerPos:src, defenderPos:dst };

      // Rook pierce: hit enemy behind target
      if (attacker.type === PieceType.ROOK) {
        const pr = this._rookPierce(src, dst, attacker);
        if (pr) this.lastCombat.pierce = pr;
      }

      if (result.defenderSurvived) {
        this.history.push({ src, dst:src, captured:null, combat:result });
        this._finishTurn(attacker.team, snap);
        return true;
      }
    }

    this.board.applyMove(src, dst);
    this.history.push({ src, dst, captured:defender, combat:this.lastCombat });
    this._finishTurn(attacker.team, snap);
    return true;
  }

  // ── Knight chain attack (attacker stays at origin) ─────────────────────────
  // Does NOT switch turn. Call finishKnightTurn() when chain is complete.
  knightChainAttack(src, dst) {
    const attacker = this.board.get(...src);
    const defender = this.board.get(...dst);
    if (!defender || !attacker || !attacker.isEnemy(defender)) return null;

    const result = resolveAttack(attacker, defender);
    this.lastCombat = { ...result, attackerPos:src, defenderPos:dst };

    if (!result.defenderSurvived) {
      // Rook pierce also applies on knight chains? No — this is knight.
      this.board.set(...dst, null); // remove dead defender; attacker stays at src
    }
    return result;
  }

  startKnightChain() {
    this._knightChainSnap = this._snapshotBoard();
    this._knightChainTeam = this.turn;
  }

  finishKnightTurn() {
    this.lastPawnBuff = applyPawnStrengthInNumbers(this.board);
    this.epitathSnapshot[this._knightChainTeam] = this._knightChainSnap;
    this._knightChainSnap = null;
    this._switchTurn();
    this._updateStatus();
  }

  // ── Bishop active: heal 3×3 allies, consumes turn ─────────────────────────
  useBishopAbility(pos) {
    const bishop = this.board.get(...pos);
    if (!bishop || bishop.type !== PieceType.BISHOP || bishop.team !== this.turn) return null;
    const snap     = this._snapshotBoard();
    this.lastHeal  = applyBishopHeal(this.board, pos);
    this.lastPawnBuff = [];
    this.history.push({ type:"bishop_ability", pos, healed:this.lastHeal });
    this._finishTurn(this.turn, snap);
    return this.lastHeal;
  }

  // ── King abilities (do not consume a turn) ─────────────────────────────────
  useHigherMorale(targetPos) {
    if (this.board.get(...targetPos) !== null) return false;
    const kingPos = this.board.findKing(this.turn);
    if (!kingPos) return false;
    const rook = new Rook(this.turn);
    rook.hasMoved = true;
    this.board.set(...targetPos, rook);
    const king = this.board.get(...kingPos);
    king.hp = Math.min(king.maxHp, king.hp + Math.floor(king.maxHp * 0.25));
    this.kingAbilityUsed[this.turn] = true;
    return true;
  }

  useZaWardou() {
    const opp = this.turn === Team.WHITE ? Team.BLACK : Team.WHITE;
    this.zaWardouSkip[opp]++;
    this.kingAbilityUsed[this.turn] = true;
    return true;
  }

  useDirtyDeeds(targetPos) {
    const kingPos = this.board.findKing(this.turn);
    if (!kingPos) return false;
    const targetPiece = this.board.get(...targetPos);
    if (!targetPiece || targetPiece.team !== this.turn || targetPiece.type === PieceType.KING) return false;
    const king = this.board.get(...kingPos);
    this.board.set(...kingPos, targetPiece);
    this.board.set(...targetPos, king);
    this.kingAbilityUsed[this.turn] = true;
    return true;
  }

  useEpitath() {
    const opp = this.turn === Team.WHITE ? Team.BLACK : Team.WHITE;
    const snap = this.epitathSnapshot[opp];
    if (!snap) return false;
    this._restoreSnapshot(snap);
    this.epitathSnapshot[opp] = null; // consumed
    this.kingAbilityUsed[this.turn] = true;
    this.status = "ongoing";
    this._updateStatus();
    return true;
  }

  // ── Internals ─────────────────────────────────────────────────────────────
  legalMovesFor([row,col]) {
    const piece = this.board.get(row,col);
    if (!piece || piece.team !== this.turn) return [];
    let moves = piece.legalMoves([row,col], this.board);
    // Stunned: cannot capture
    if (piece.stunned) moves = moves.filter(([r,c]) => this.board.get(r,c) === null);
    return moves.filter(dst => !this._wouldLeaveInCheck([row,col], dst));
  }

  _rookPierce(src, dst, attacker) {
    const dr = Math.sign(dst[0]-src[0]);
    const dc = Math.sign(dst[1]-src[1]);
    const behind = [dst[0]+dr, dst[1]+dc];
    if (behind[0]<0||behind[0]>=8||behind[1]<0||behind[1]>=8) return null;
    const behindPiece = this.board.get(...behind);
    if (!behindPiece || !attacker.isEnemy(behindPiece)) return null;
    const result = resolveAttack(attacker, behindPiece);
    if (!result.defenderSurvived) this.board.set(...behind, null);
    return { pos:behind, ...result };
  }

  _finishTurn(teamThatMoved, snapBefore) {
    this.epitathSnapshot[teamThatMoved] = snapBefore;
    this.lastPawnBuff = applyPawnStrengthInNumbers(this.board);
    this._switchTurn();
    this._updateStatus();
  }

  _wouldLeaveInCheck(src, dst) {
    const attacker    = this.board.get(...src);
    const defender    = this.board.get(...dst);
    const savedHp     = defender?.hp;
    const movedBefore = attacker?.hasMoved ?? false;
    if (defender) defender.hp = 0;
    const captured = this.board.applyMove(src, dst);
    const inCheck  = this.board.isInCheck(this.turn);
    this.board.undoMove(src, dst, captured, movedBefore);
    if (defender && savedHp !== undefined) defender.hp = savedHp;
    return inCheck;
  }

  _switchTurn() {
    this.lastSkipped = null;
    this.turn = this.turn === Team.WHITE ? Team.BLACK : Team.WHITE;
    // Za Wardou: skip turn if pending
    if (this.zaWardouSkip[this.turn] > 0) {
      this.zaWardouSkip[this.turn]--;
      this.lastSkipped = this.turn;
      this.turn = this.turn === Team.WHITE ? Team.BLACK : Team.WHITE;
    }
    // Decrement stun timers for the now-active team
    for (const { piece } of this.board.allPieces(this.turn)) {
      if (piece.stunTurns > 0) {
        piece.stunTurns--;
        if (piece.stunTurns === 0) piece.stunned = false;
      }
    }
  }

  _updateStatus() {
    const hasLegal = this.board.allPieces(this.turn)
      .some(({ pos }) => this.legalMovesFor(pos).length > 0);
    if (!hasLegal) this.status = this.board.isInCheck(this.turn) ? "checkmate" : "stalemate";
  }

  _snapshotBoard() {
    const grid = [];
    for (let r=0;r<8;r++) {
      grid[r] = [];
      for (let c=0;c<8;c++) {
        const p = this.board._grid[r][c];
        grid[r][c] = p ? {
          type:p.type, team:p.team, hasMoved:p.hasMoved,
          hp:p.hp, maxHp:p.maxHp, stunned:p.stunned, stunTurns:p.stunTurns
        } : null;
      }
    }
    return grid;
  }

  _restoreSnapshot(snap) {
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      const s = snap[r][c];
      if (s) {
        const piece     = createPiece(s.team, s.type);
        piece.hasMoved  = s.hasMoved;
        piece.hp        = s.hp;
        piece.maxHp     = s.maxHp;
        piece.stunned   = s.stunned;
        piece.stunTurns = s.stunTurns;
        this.board._grid[r][c] = piece;
      } else {
        this.board._grid[r][c] = null;
      }
    }
  }
}

// ── UI state ──────────────────────────────────────────────────────────────────
let game         = new Game();
let selected     = null;
let legalDsts    = [];
let lastMove     = null;
let inspectedPos = null;
let isAnimating  = false;
let killedPieces = { [Team.WHITE]:[], [Team.BLACK]:[] };
let moveNumber   = 1;
let whiteNotation= "";

// Knight chain state
let knightChain        = null;  // { origin, attackPos, chainsLeft }
let knightChainTargets = [];

// King ability targeting state
let kingAbilityMode    = null;  // "higher_morale" | "dirty_deeds" | null
let kingAbilityTargets = [];

// Pre-game setup
let setupPhase = true;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const boardEl      = document.getElementById("board");
const turnDot      = document.getElementById("turn-dot");
const turnLabel    = document.getElementById("turn-label");
const statusBan    = document.getElementById("status-banner");
const logEl        = document.getElementById("move-log");
const capWhite     = document.getElementById("cap-white");
const capBlack     = document.getElementById("cap-black");
const overlay      = document.getElementById("overlay");
const overlayH2    = document.getElementById("overlay-title");
const overlayP     = document.getElementById("overlay-msg");
const pieceInfo    = document.getElementById("piece-info");
const abilityBtn   = document.getElementById("ability-btn");
const chainSkipBtn = document.getElementById("chain-skip-btn");
const abilityHint  = document.getElementById("ability-hint");
const kSelectOvl   = document.getElementById("king-select-overlay");
const ksTitle      = document.getElementById("ks-title");
const ksOptions    = document.getElementById("ks-options");

// ── Build board ───────────────────────────────────────────────────────────────
function buildBoard() {
  boardEl.innerHTML = "";
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const cell = document.createElement("div");
    cell.className = `cell ${(r+c)%2===0?"light":"dark"}`;
    cell.dataset.row = r; cell.dataset.col = c;
    cell.addEventListener("click", onCellClick);
    boardEl.appendChild(cell);
  }
}

function getCell(r, c) { return boardEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`); }

// ── HP bar ────────────────────────────────────────────────────────────────────
function makeHpBar(piece) {
  const wrap = document.createElement("div");
  wrap.className = "hp-bar-wrap";
  const fill = document.createElement("div");
  fill.className = "hp-bar-fill";
  fill.style.width = `${piece.hpPercent * 100}%`;
  fill.style.background = piece.hpPercent > 0.5 ? "#4caf50" : piece.hpPercent > 0.25 ? "#f0c040" : "#e04040";
  wrap.appendChild(fill);
  return wrap;
}

// ── Floating numbers ──────────────────────────────────────────────────────────
function spawnDamageNumber(cell, damage, survived) {
  const el = document.createElement("div");
  el.className = "dmg-number";
  el.textContent = `-${damage}`;
  el.style.color = survived ? "#f0c040" : "#e04040";
  cell.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once:true });
}

function spawnHealNumber(cell, amount) {
  const el = document.createElement("div");
  el.className = "heal-number";
  el.textContent = `+${amount}`;
  cell.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once:true });
}

// ── Heal visual ───────────────────────────────────────────────────────────────
function showHealEffect(healArr) {
  for (const { pos, amount } of healArr) {
    if (amount <= 0) continue;
    const cell = getCell(...pos);
    cell.classList.add("heal-flash");
    cell.addEventListener("animationend", () => cell.classList.remove("heal-flash"), { once:true });
    spawnHealNumber(cell, amount);
  }
}

function showPawnBuff(buffArr) {
  for (const { pos, amount } of buffArr) {
    if (amount <= 0) continue;
    spawnHealNumber(getCell(...pos), amount);
    const cell = getCell(...pos);
    cell.classList.add("strength-glow");
    cell.addEventListener("animationend", () => cell.classList.remove("strength-glow"), { once:true });
  }
}

// ── Ability animations ────────────────────────────────────────────────────────

// Queen: Stunning Beauty — purple ★ burst
function animateStunApplied(cell) {
  const el = document.createElement("div");
  el.className = "stun-burst-fx";
  el.textContent = "★ STUNNED";
  cell.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once:true });
}

// Queen: HP Tax — gold "TAX" text
function animateHpTax(cell, bonusDmg) {
  if (bonusDmg <= 0) return;
  const el = document.createElement("div");
  el.className = "tax-fx";
  el.textContent = `+${bonusDmg} TAX`;
  cell.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once:true });
}

// Rook: pierce — ⊕ ripple on the behind-target cell + death spin if killed
function animatePierceFx(behindCell, pierceResult) {
  const el = document.createElement("div");
  el.className = "pierce-fx";
  el.textContent = "⊕";
  behindCell.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once:true });
  spawnDamageNumber(behindCell, pierceResult.damage, pierceResult.defenderSurvived);
  if (!pierceResult.defenderSurvived) {
    const sp = behindCell.querySelector(".piece");
    if (sp) sp.style.animation = "deathSpin .45s ease-in forwards";
  }
}

// Bishop: heal ripple that radiates from the bishop cell
function animateBishopAbility(bishopCell, healArr) {
  const ripple = document.createElement("div");
  ripple.className = "bishop-ripple";
  bishopCell.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once:true });
  // Delay each healed cell's flash slightly for a wave feel
  healArr.forEach(({ pos, amount }, i) => {
    setTimeout(() => {
      const cell = getCell(...pos);
      cell.classList.add("heal-flash");
      cell.addEventListener("animationend", () => cell.classList.remove("heal-flash"), { once:true });
      spawnHealNumber(cell, amount);
    }, 80 + i * 60);
  });
}

// King: generic golden activation glow on the king cell
function animateKingActivation(kingCell) {
  const el = document.createElement("div");
  el.className = "king-activate-fx";
  kingCell.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once:true });
}

// King: Higher Morale — sparkle at rook spawn + heal number at king
function animateHigherMorale(rookPos, kingPos, healAmt) {
  const rookCell = getCell(...rookPos);
  rookCell.classList.add("summon-fx");
  rookCell.addEventListener("animationend", () => rookCell.classList.remove("summon-fx"), { once:true });
  if (healAmt > 0) spawnHealNumber(getCell(...kingPos), healAmt);
  animateKingActivation(getCell(...kingPos));
}

// King: Za Wardou — full-screen time-stop overlay
function animateZaWardou() {
  const el = document.createElement("div");
  el.className = "za-wardou-overlay";
  el.innerHTML = `<div class="za-wardou-text"><span>⏸</span><p>TOKI WA TOMARE</p></div>`;
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once:true });
}

// King: Dirty Deeds — blue flash on both swapped cells
function animateDirtyDeeds(pos1, pos2) {
  for (const pos of [pos1, pos2]) {
    const cell = getCell(...pos);
    cell.classList.add("dirty-swap-fx");
    cell.addEventListener("animationend", () => cell.classList.remove("dirty-swap-fx"), { once:true });
  }
}

// King: Epitath — full-screen rewind flash
function animateEpitath() {
  const el = document.createElement("div");
  el.className = "epitath-overlay";
  el.innerHTML = `<div class="epitath-text"><span>↩</span><p>REVERSED</p></div>`;
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once:true });
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const boardWrap = document.querySelector(".board-wrap");
  boardWrap.classList.toggle("turn-white", game.turn === Team.WHITE);
  boardWrap.classList.toggle("turn-black", game.turn === Team.BLACK);

  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const cell  = getCell(r,c);
    const piece = game.board.get(r,c);
    cell.classList.remove(
      "selected","legal-move","legal-capture","in-check","last-move",
      "just-hit","stunned-piece","chain-target","ability-target","ability-swap"
    );
    cell.innerHTML = "";

    if (piece) {
      const span = document.createElement("span");
      span.className = `piece ${piece.team===Team.WHITE?"white":"black"}`;
      span.textContent = SYMBOLS[piece.team][piece.type];
      cell.appendChild(span);
      cell.appendChild(makeHpBar(piece));
      if (piece.stunned) cell.classList.add("stunned-piece");
    }
  }

  // Last move
  if (lastMove) {
    getCell(...lastMove.src).classList.add("last-move");
    if (!lastMove.survived) getCell(...lastMove.dst).classList.add("last-move");
  }

  // Selection + legal moves
  if (selected) {
    getCell(...selected).classList.add("selected");
    for (const [r,c] of legalDsts) {
      const cell = getCell(r,c);
      game.board.get(r,c) ? cell.classList.add("legal-capture") : cell.classList.add("legal-move");
    }
  }

  // Knight chain targets
  for (const [r,c] of knightChainTargets) getCell(r,c).classList.add("chain-target");

  // King ability targets
  for (const [r,c] of kingAbilityTargets) {
    getCell(r,c).classList.add(kingAbilityMode === "dirty_deeds" ? "ability-swap" : "ability-target");
  }

  // Check highlight
  if (game.board.isInCheck(game.turn)) {
    const kp = game.board.findKing(game.turn);
    if (kp) getCell(...kp).classList.add("in-check");
  }

  renderPieceInfo();
  renderPanel();
}

// ── Piece info panel ──────────────────────────────────────────────────────────
function renderPieceInfo() {
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
  const stunText  = piece.stunned ? ' <span style="color:#a855f7;font-size:.7rem">[STUNNED]</span>' : "";

  // Build ability list
  const abils = ABILITY_DEFS[piece.type] || [];
  let abilHtml = "";
  if (piece.type === PieceType.KING) {
    const chosen = game.kingAbilityChosen[piece.team];
    const def    = chosen ? KING_ABILITY_DEFS.find(k=>k.id===chosen) : null;
    abilHtml = def
      ? `<div class="ability-entry"><span class="ability-name">${def.name}</span> <span class="ability-tag">[Once/Match${game.kingAbilityUsed[piece.team]?" — USED":""}]</span><div class="ability-desc">${def.desc}</div></div>`
      : `<div class="ability-entry"><span class="ability-name">Not yet chosen</span></div>`;
  } else {
    abilHtml = abils.map(a =>
      `<div class="ability-entry"><span class="ability-name">${a.name}</span> <span class="ability-tag">[${a.type}]</span><div class="ability-desc">${a.desc}</div></div>`
    ).join("");
  }

  pieceInfo.innerHTML = `
    <div class="piece-info-header">
      <span class="piece-info-symbol ${teamClass}">${SYMBOLS[piece.team][piece.type]}</span>
      <div>
        <div class="piece-info-name">${piece.type}${stunText}</div>
        <div class="piece-info-team">${piece.team}</div>
      </div>
    </div>
    <div class="stat-row">
      <span class="stat-label">HP</span>
      <div class="pi-hp-bar-wrap"><div class="pi-hp-bar-fill" style="width:${hpPct}%;background:${hpColor}"></div></div>
      <span class="stat-value">${piece.hp} / ${piece.maxHp}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Attack</span>
      <span class="stat-value">${piece.attack}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Speed</span>
      <span class="stat-value">${piece.speed}</span>
    </div>
    <div class="abilities-section"><div class="abilities-label">ABILITIES</div>${abilHtml}</div>
  `;
}

// ── Panel ─────────────────────────────────────────────────────────────────────
function renderPanel() {
  const white = game.turn === Team.WHITE;
  turnDot.className   = white ? "white" : "black";
  turnLabel.textContent = `${game.turn}'s turn`;

  if (game.status === "ongoing") {
    if (game.board.isInCheck(game.turn)) {
      statusBan.textContent = "CHECK!"; statusBan.className = "alert";
    } else if (game.lastSkipped) {
      statusBan.textContent = `Za Wardou! ${game.lastSkipped}'s turn skipped.`;
      statusBan.className = "info";
    } else if (knightChain) {
      statusBan.textContent = `Knight chain — ${knightChain.chainsLeft} attack(s) left`;
      statusBan.className = "info";
    } else if (kingAbilityMode) {
      const msgs = {
        higher_morale: "Click any empty square to place the Rook",
        dirty_deeds:   "Click a friendly piece to swap with the King",
      };
      statusBan.textContent = msgs[kingAbilityMode] || "";
      statusBan.className = "info";
    } else {
      statusBan.textContent = ""; statusBan.className = "";
    }
  } else {
    const msg = game.status === "checkmate"
      ? `Checkmate — ${game.turn===Team.WHITE?Team.BLACK:Team.WHITE} wins!`
      : "Stalemate — draw!";
    statusBan.textContent = msg; statusBan.className = "gameover";
    showOverlay();
  }

  capWhite.textContent = killedPieces[Team.BLACK].map(p=>SYMBOLS[Team.BLACK][p.type]).join(" ")||"—";
  capBlack.textContent = killedPieces[Team.WHITE].map(p=>SYMBOLS[Team.WHITE][p.type]).join(" ")||"—";

  // Ability button visibility
  updateAbilityButton();

  // Chain skip button
  chainSkipBtn.style.display = knightChain ? "block" : "none";

  // Ability hint
  if (kingAbilityMode) {
    abilityHint.textContent = "";
  } else if (knightChain) {
    abilityHint.textContent = `Chain ${3 - knightChain.chainsLeft}/3`;
  } else {
    abilityHint.textContent = "";
  }
}

function updateAbilityButton() {
  if (game.status !== "ongoing" || knightChain || kingAbilityMode || isAnimating) {
    abilityBtn.style.display = "none";
    return;
  }
  if (!selected) { abilityBtn.style.display = "none"; return; }
  const piece = game.board.get(...selected);
  if (!piece || piece.team !== game.turn) { abilityBtn.style.display = "none"; return; }

  if (piece.type === PieceType.BISHOP) {
    abilityBtn.textContent = "⛪ I'm Pope-ing Off";
    abilityBtn.style.display = "block";
  } else if (piece.type === PieceType.KING && !game.kingAbilityUsed[game.turn] && game.kingAbilityChosen[game.turn]) {
    const def = KING_ABILITY_DEFS.find(k=>k.id===game.kingAbilityChosen[game.turn]);
    abilityBtn.textContent = `👑 ${def.name}`;
    abilityBtn.style.display = "block";
  } else {
    abilityBtn.style.display = "none";
  }
}

function showOverlay() {
  if (game.status === "checkmate") {
    const winner = game.turn===Team.WHITE?Team.BLACK:Team.WHITE;
    overlayH2.textContent = "Checkmate!";
    overlayP.textContent  = `${winner} wins the crown.`;
  } else {
    overlayH2.textContent = "Stalemate";
    overlayP.textContent  = "The battle ends in a draw.";
  }
  overlay.classList.add("show");
}

// ── Move log ──────────────────────────────────────────────────────────────────
function pushLogEntry(notation, team) {
  if (team === Team.WHITE) {
    whiteNotation = notation;
  } else {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.innerHTML = `<span class="num">${moveNumber}.</span><span class="notation">${whiteNotation}</span><span class="notation">${notation}</span>`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
    moveNumber++; whiteNotation = "";
  }
}

function logMove(src, dst, piece, combat) {
  const files = "abcdefgh";
  const toAlg = ([r,c]) => `${files[c]}${8-r}`;
  const sym   = SYMBOLS[piece.team][piece.type];
  let notation;
  if (combat?.defenderSurvived) {
    notation = `${sym}${toAlg(src)}⚔${toAlg(dst)} (-${combat.damage}hp)`;
  } else if (combat) {
    notation = `${sym}${toAlg(src)}→${toAlg(dst)}× (-${combat.damage}hp)`;
    if (combat.pierce) {
      notation += ` ⊕${toAlg(combat.pierce.pos)}(-${combat.pierce.damage}hp)`;
    }
  } else {
    notation = `${sym}${toAlg(src)}→${toAlg(dst)}`;
  }
  pushLogEntry(notation, piece.team);
}

function logAbility(pos, piece, abilityName) {
  const files = "abcdefgh";
  const toAlg = ([r,c]) => `${files[c]}${8-r}`;
  const sym   = SYMBOLS[piece.team][piece.type];
  pushLogEntry(`${sym}${toAlg(pos)} [${abilityName}]`, piece.team);
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

  const ghost = document.createElement("span");
  ghost.className = `piece ${attackerPiece.team===Team.WHITE?"white":"black"}`;
  ghost.textContent = SYMBOLS[attackerPiece.team][attackerPiece.type];
  Object.assign(ghost.style, {
    position:"fixed", left:`${sx}px`, top:`${sy}px`,
    fontSize:"44px", lineHeight:"1", zIndex:"50", pointerEvents:"none",
    willChange:"transform", transform:"translate(-50%,-50%)",
    filter:"drop-shadow(1px 2px 4px rgba(0,0,0,.8)) drop-shadow(0 0 14px rgba(255,210,60,.9))",
  });
  document.body.appendChild(ghost);

  const srcSpan = srcCell.querySelector(".piece");
  if (srcSpan) srcSpan.style.opacity = "0";

  const fly = ghost.animate([
    { transform:`translate(-50%,-50%) scale(1) rotate(0deg)` },
    { transform:`translate(calc(-50% + ${offX*.5}px),calc(-50% + ${offY*.5-arc}px)) scale(1.22) rotate(${spin}deg)`, offset:.45 },
    { transform:`translate(calc(-50% + ${offX}px),calc(-50% + ${offY}px)) scale(.85) rotate(0deg)` },
  ], { duration:210, easing:"ease-in", fill:"forwards" });

  fly.onfinish = () => {
    spawnDamageNumber(dstCell, combat.damage, combat.defenderSurvived);

    const clash = document.createElement("div");
    clash.className = "clash-fx";
    clash.textContent = combat.defenderSurvived ? "⚔" : "💥";
    dstCell.appendChild(clash);
    clash.addEventListener("animationend", () => clash.remove(), { once:true });

    if (combat.defenderSurvived) {
      dstCell.classList.add("hit-flash");
      setTimeout(() => dstCell.classList.remove("hit-flash"), 400);

      const bounce = ghost.animate([
        { transform:`translate(calc(-50% + ${offX}px),calc(-50% + ${offY}px)) scale(.85)` },
        { transform:`translate(calc(-50% + ${offX*.12}px),calc(-50% + ${offY*.12}px)) scale(1.06)`, offset:.62 },
        { transform:"translate(-50%,-50%) scale(1)" },
      ], { duration:195, easing:"ease-out", fill:"forwards" });

      bounce.onfinish = () => {
        ghost.remove();
        if (srcSpan) srcSpan.style.opacity = "";
        isAnimating = false;
        onComplete();
      };
    } else {
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

// ── Knight chain helpers ──────────────────────────────────────────────────────
const KNIGHT_JUMPS = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];

function findKnightChainTargets(origin, lastAttackPos) {
  const knight = game.board.get(...origin);
  if (!knight) return [];
  const [kr, kc] = lastAttackPos;
  const targets = [];
  for (const [dr, dc] of KNIGHT_JUMPS) {
    const r = kr+dr, c = kc+dc;
    if (r<0||r>=8||c<0||c>=8) continue;
    if (r===origin[0] && c===origin[1]) continue; // don't target own square
    const piece = game.board.get(r, c);
    if (piece && piece.team !== knight.team) targets.push([r, c]);
  }
  return targets;
}

function endKnightChain() {
  const origin = knightChain.origin;
  lastMove = { src: origin, dst: knightChain.attackPos, survived: true };
  game.finishKnightTurn();
  if (game.lastPawnBuff.length > 0) setTimeout(() => showPawnBuff(game.lastPawnBuff), 50);
  knightChain = null;
  knightChainTargets = [];
  render();
}

// ── King ability helpers ──────────────────────────────────────────────────────
function getEmptySquares() {
  const sq = [];
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (game.board.get(r,c)===null) sq.push([r,c]);
  return sq;
}

function getFriendlyNonKingPositions() {
  return game.board.allPieces(game.turn)
    .filter(({ piece }) => piece.type !== PieceType.KING)
    .map(({ pos }) => pos);
}

// ── Click handler ─────────────────────────────────────────────────────────────
function onCellClick(e) {
  if (game.status !== "ongoing" || isAnimating || setupPhase) return;
  const row = parseInt(e.currentTarget.dataset.row);
  const col = parseInt(e.currentTarget.dataset.col);

  // ── King ability targeting ────────────────────────────────────────────────
  if (kingAbilityMode === "higher_morale") {
    if (game.board.get(row,col) === null) {
      const kingPos    = game.board.findKing(game.turn);
      const king       = game.board.get(...kingPos);
      const kingHpBefore = king.hp;
      game.useHigherMorale([row,col]);
      logAbility(kingPos, king, "Higher Morale");
      const healAmt = king.hp - kingHpBefore;
      kingAbilityMode = null; kingAbilityTargets = [];
      selected = null; legalDsts = [];
      render();
      requestAnimationFrame(() => animateHigherMorale([row,col], kingPos, healAmt));
      return;
    }
    kingAbilityMode = null; kingAbilityTargets = [];
    selected = null; legalDsts = [];
    render(); return;
  }

  if (kingAbilityMode === "dirty_deeds") {
    const piece = game.board.get(row, col);
    if (piece && piece.team === game.turn && piece.type !== PieceType.KING) {
      const kingPos = game.board.findKing(game.turn);
      const king    = game.board.get(...kingPos);
      animateDirtyDeeds(kingPos, [row,col]);       // flash before the swap
      game.useDirtyDeeds([row,col]);
      logAbility(kingPos, king, "Dirty Deeds");
    }
    kingAbilityMode = null; kingAbilityTargets = [];
    selected = null; legalDsts = [];
    render(); return;
  }

  // ── Knight chain ──────────────────────────────────────────────────────────
  if (knightChain !== null) {
    const isTarget = knightChainTargets.some(([r,c])=>r===row&&c===col);
    if (isTarget) {
      const origin  = knightChain.origin;
      const dst     = [row, col];
      const knight  = game.board.get(...origin);
      const target  = game.board.get(...dst);
      const result  = game.knightChainAttack(origin, dst);
      if (result && !result.defenderSurvived) killedPieces[knight.team].push(target);

      knightChain.chainsLeft--;
      knightChain.attackPos = dst;

      const nextTargets = knightChain.chainsLeft > 0 ? findKnightChainTargets(origin, dst) : [];
      knightChainTargets = nextTargets;

      if (result) {
        animateAttack(origin, dst, knight, target, result, () => {
          if (knightChainTargets.length === 0 || knightChain.chainsLeft <= 0) {
            endKnightChain();
          } else {
            render();
          }
          requestAnimationFrame(() => {

            if (result.stunApplied) animateStunApplied(getCell(...dst));
            if (result.bonusDamage) animateHpTax(getCell(...dst), result.bonusDamage);
          });
        });
      } else {
        if (knightChainTargets.length === 0 || knightChain.chainsLeft <= 0) endKnightChain();
        else render();
      }
    } else {
      // Clicked elsewhere: end the chain
      endKnightChain();
    }
    return;
  }

  // ── Normal flow ───────────────────────────────────────────────────────────
  if (game.board.get(row,col)) inspectedPos = [row,col];

  if (selected) {
    const isLegal = legalDsts.some(([r,c])=>r===row&&c===col);
    if (isLegal) {
      const src         = [...selected];
      const dst         = [row, col];
      const movingPiece = game.board.get(...src);
      const targetPiece = game.board.get(...dst);

      // Knight attacking: use chain mode (always returns to origin)
      if (movingPiece.type === PieceType.KNIGHT && targetPiece !== null) {
        game.startKnightChain();
        const result = game.knightChainAttack(src, dst);
        if (result && !result.defenderSurvived) killedPieces[movingPiece.team].push(targetPiece);
        logMove(src, dst, movingPiece, result);

        const chainTargets = findKnightChainTargets(src, dst);
        selected = null; legalDsts = [];

        // Always set knightChain so endKnightChain() can read origin/attackPos
        knightChain = { origin: src, attackPos: dst, chainsLeft: 2 };
        knightChainTargets = chainTargets;

        if (result) {
          animateAttack(src, dst, movingPiece, targetPiece, result, () => {
            if (knightChainTargets.length === 0) endKnightChain();
            else render();
            requestAnimationFrame(() => {
  
              if (result.stunApplied) animateStunApplied(getCell(...dst));
              if (result.bonusDamage) animateHpTax(getCell(...dst), result.bonusDamage);
            });
          });
        } else {
          if (knightChainTargets.length === 0) endKnightChain();
          else render();
        }
        return;
      }

      // Normal move
      game.move(src, dst);
      const combat = game.lastCombat;
      if (targetPiece && combat && !combat.defenderSurvived) killedPieces[movingPiece.team].push(targetPiece);
      lastMove = { src, dst, survived: combat?.defenderSurvived ?? false };
      logMove(src, dst, movingPiece, combat);
      selected = null; legalDsts = [];

      if (targetPiece && combat) {
        animateAttack(src, dst, movingPiece, targetPiece, combat, () => {
          if (game.lastPawnBuff.length > 0) setTimeout(() => showPawnBuff(game.lastPawnBuff), 80);
          render();
          requestAnimationFrame(() => {

            if (combat.stunApplied) animateStunApplied(getCell(...dst));
            if (combat.bonusDamage) animateHpTax(getCell(...dst), combat.bonusDamage);
            if (combat.pierce)      animatePierceFx(getCell(...combat.pierce.pos), combat.pierce);
          });
        });
        return;
      }
      if (game.lastPawnBuff.length > 0) setTimeout(() => showPawnBuff(game.lastPawnBuff), 60);
    } else {
      const piece = game.board.get(row,col);
      if (piece?.team === game.turn) { selected=[row,col]; legalDsts=game.legalMovesFor(selected); }
      else { selected=null; legalDsts=[]; }
    }
  } else {
    const piece = game.board.get(row,col);
    if (piece?.team === game.turn) { selected=[row,col]; legalDsts=game.legalMovesFor(selected); }
  }
  render();
}

// ── Ability button click ──────────────────────────────────────────────────────
abilityBtn.addEventListener("click", () => {
  if (!selected || game.status !== "ongoing" || isAnimating) return;
  const piece = game.board.get(...selected);
  if (!piece || piece.team !== game.turn) return;

  if (piece.type === PieceType.BISHOP) {
    const pos    = [...selected];
    const healed = game.useBishopAbility(pos);
    if (healed !== null) {
      logAbility(pos, piece, "I'm Pope-ing Off");
      selected = null; legalDsts = [];
      if (game.lastPawnBuff.length > 0) setTimeout(() => showPawnBuff(game.lastPawnBuff), 400);
      render();
      requestAnimationFrame(() => animateBishopAbility(getCell(...pos), healed));
    }
    return;
  }

  if (piece.type === PieceType.KING) {
    const ability  = game.kingAbilityChosen[game.turn];
    const kingPos  = [...selected];
    if (!ability || game.kingAbilityUsed[game.turn]) return;

    if (ability === "za_wardou") {
      game.useZaWardou();
      logAbility(kingPos, piece, "Za Wardou!");
      selected = null; legalDsts = [];
      render();
      requestAnimationFrame(() => {
        animateKingActivation(getCell(...kingPos));
        animateZaWardou();
      });
    } else if (ability === "epitath") {
      if (game.useEpitath()) {
        logAbility(kingPos, piece, "Epitath!");
        selected = null; legalDsts = [];
        animateEpitath();
        setTimeout(() => {
          render();
          requestAnimationFrame(() => animateKingActivation(getCell(...kingPos)));
        }, 600);
      }
    } else if (ability === "higher_morale") {
      kingAbilityMode    = "higher_morale";
      kingAbilityTargets = getEmptySquares();
      render();
      requestAnimationFrame(() => animateKingActivation(getCell(...kingPos)));
    } else if (ability === "dirty_deeds") {
      kingAbilityMode    = "dirty_deeds";
      kingAbilityTargets = getFriendlyNonKingPositions();
      render();
      requestAnimationFrame(() => animateKingActivation(getCell(...kingPos)));
    }
  }
});

chainSkipBtn.addEventListener("click", () => { if (knightChain) endKnightChain(); });

// ── King selection overlay ────────────────────────────────────────────────────
function showKingSelection(team) {
  kSelectOvl.classList.add("show");
  ksTitle.textContent = `${team} — Choose Your King's Ability`;
  ksOptions.innerHTML = KING_ABILITY_DEFS.map(ab =>
    `<button class="ks-btn" data-id="${ab.id}">
       <strong>${ab.name}</strong>
       <span>${ab.desc}</span>
     </button>`
  ).join("");
  ksOptions.querySelectorAll(".ks-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      game.kingAbilityChosen[team] = btn.dataset.id;
      kSelectOvl.classList.remove("show");
      if (team === Team.WHITE) {
        showKingSelection(Team.BLACK);
      } else {
        setupPhase = false;
        render();
      }
    });
  });
}

// ── New game ──────────────────────────────────────────────────────────────────
function newGame() {
  game            = new Game();
  selected        = null;
  legalDsts       = [];
  lastMove        = null;
  inspectedPos    = null;
  isAnimating     = false;
  knightChain     = null;
  knightChainTargets = [];
  kingAbilityMode = null;
  kingAbilityTargets = [];
  killedPieces    = { [Team.WHITE]:[], [Team.BLACK]:[] };
  moveNumber      = 1;
  whiteNotation   = "";
  setupPhase      = true;
  logEl.innerHTML = "";
  overlay.classList.remove("show");
  pieceInfo.className = "piece-info empty";
  pieceInfo.innerHTML = `<span class="piece-info-hint">Click a piece to inspect</span>`;
  abilityBtn.style.display   = "none";
  chainSkipBtn.style.display = "none";
  render();
  showKingSelection(Team.WHITE);
}

document.getElementById("new-game-btn").addEventListener("click", newGame);
document.getElementById("overlay-btn").addEventListener("click", newGame);
document.getElementById("help-btn").addEventListener("click", () => document.getElementById("help-overlay").classList.add("show"));
document.querySelector(".win-close").addEventListener("click", () => document.getElementById("help-overlay").classList.remove("show"));
document.querySelector(".win-max").addEventListener("click", () => document.getElementById("help-box").classList.toggle("maximized"));

// ── Init ──────────────────────────────────────────────────────────────────────
buildBoard();
render();
showKingSelection(Team.WHITE);
