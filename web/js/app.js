// ── Constants ────────────────────────────────────────────────────────────────
const BOARD_SIZE = 8;
const Team = { WHITE: "White", BLACK: "Black" };
const PieceType = { PAWN:"Pawn", ROOK:"Rook", KNIGHT:"Knight", BISHOP:"Bishop", QUEEN:"Queen", KING:"King" };
const SYMBOLS = {
  [Team.WHITE]: { [PieceType.KING]:"♔", [PieceType.QUEEN]:"♕", [PieceType.ROOK]:"♖", [PieceType.BISHOP]:"♗", [PieceType.KNIGHT]:"♘", [PieceType.PAWN]:"♙" },
  [Team.BLACK]: { [PieceType.KING]:"♚", [PieceType.QUEEN]:"♛", [PieceType.ROOK]:"♜", [PieceType.BISHOP]:"♝", [PieceType.KNIGHT]:"♞", [PieceType.PAWN]:"♟" },
};

// ── Pieces ───────────────────────────────────────────────────────────────────
class Piece {
  constructor(team, type) { this.team = team; this.type = type; this.hasMoved = false; }
  isEnemy(other) { return other !== null && other.team !== this.team; }
  legalMoves(pos, board) { return []; }
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

// ── Game ─────────────────────────────────────────────────────────────────────
class Game {
  constructor() {
    this.board  = new Board();
    this.turn   = Team.WHITE;
    this.status = "ongoing";
    this.history= [];
  }
  legalMovesFor([row,col]) {
    const piece=this.board.get(row,col);
    if(!piece||piece.team!==this.turn) return [];
    return piece.legalMoves([row,col],this.board)
      .filter(dst=>!this._wouldLeaveInCheck([row,col],dst));
  }
  move(src,dst) {
    if(!this.legalMovesFor(src).some(([r,c])=>r===dst[0]&&c===dst[1])) return false;
    const movedBefore=this.board.get(...src)?.hasMoved??false;
    const captured=this.board.applyMove(src,dst);
    this.history.push({src,dst,captured,movedBefore});
    this._switchTurn();
    this._updateStatus();
    return true;
  }
  _wouldLeaveInCheck(src,dst) {
    const mb=this.board.get(...src)?.hasMoved??false;
    const cap=this.board.applyMove(src,dst);
    const inCheck=this.board.isInCheck(this.turn);
    this.board.undoMove(src,dst,cap,mb);
    return inCheck;
  }
  _switchTurn() { this.turn=this.turn===Team.WHITE?Team.BLACK:Team.WHITE; }
  _updateStatus() {
    const hasLegal=this.board.allPieces(this.turn).some(({pos})=>this.legalMovesFor(pos).length>0);
    if(!hasLegal) this.status=this.board.isInCheck(this.turn)?"checkmate":"stalemate";
  }
}

// ── UI ────────────────────────────────────────────────────────────────────────
let game     = new Game();
let selected = null;
let legalDsts= [];
let lastMove = null;
let captured = { [Team.WHITE]:[], [Team.BLACK]:[] };
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

function render() {
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const cell=getCell(r,c);
    const piece=game.board.get(r,c);
    cell.classList.remove("selected","legal-move","legal-capture","in-check","last-move");
    cell.innerHTML="";
    if(piece){
      const span=document.createElement("span");
      span.className=`piece ${piece.team===Team.WHITE?"white":"black"}`;
      span.textContent=SYMBOLS[piece.team][piece.type];
      cell.appendChild(span);
    }
  }
  if(lastMove){
    getCell(...lastMove.src).classList.add("last-move");
    getCell(...lastMove.dst).classList.add("last-move");
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
  renderPanel();
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
  capWhite.textContent=captured[Team.BLACK].map(p=>SYMBOLS[Team.BLACK][p.type]).join(" ")||"—";
  capBlack.textContent=captured[Team.WHITE].map(p=>SYMBOLS[Team.WHITE][p.type]).join(" ")||"—";
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

function logMove(src,dst,piece,cap){
  const files="abcdefgh";
  const toAlg=([r,c])=>`${files[c]}${8-r}`;
  const sym=SYMBOLS[piece.team][piece.type];
  const notation=`${sym}${toAlg(src)}→${toAlg(dst)}${cap?"×":""}`;
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

function onCellClick(e){
  if(game.status!=="ongoing") return;
  const row=parseInt(e.currentTarget.dataset.row);
  const col=parseInt(e.currentTarget.dataset.col);
  if(selected){
    const isLegal=legalDsts.some(([r,c])=>r===row&&c===col);
    if(isLegal){
      const movingPiece=game.board.get(...selected);
      const targetPiece=game.board.get(row,col);
      game.move(selected,[row,col]);
      if(targetPiece) captured[movingPiece.team].push(targetPiece);
      lastMove={src:selected,dst:[row,col]};
      logMove(selected,[row,col],movingPiece,!!targetPiece);
      selected=null; legalDsts=[];
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
  game=new Game(); selected=null; legalDsts=[]; lastMove=null;
  captured={[Team.WHITE]:[],[Team.BLACK]:[]}; moveNumber=1; whiteNotation="";
  logEl.innerHTML=""; overlay.classList.remove("show"); render();
}

document.getElementById("new-game-btn").addEventListener("click",newGame);
document.getElementById("overlay-btn").addEventListener("click",newGame);

buildBoard();
render();
