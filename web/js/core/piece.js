import { Team, PieceType } from "./constants.js";

export class Piece {
  constructor(team, type) {
    this.team     = team;
    this.type     = type;
    this.hasMoved = false;
  }

  isEnemy(other) { return other !== null && other.team !== this.team; }

  legalMoves(pos, board) { return []; }

  clone() {
    const p = new this.constructor(this.team);
    p.hasMoved = this.hasMoved;
    return p;
  }
}

// ── helpers ────────────────────────────────────────────────────────────────

function slide(piece, pos, board, dirs) {
  const moves = [];
  for (const [dr, dc] of dirs) {
    let [r, c] = [pos[0] + dr, pos[1] + dc];
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board.get(r, c);
      if (target === null)       { moves.push([r, c]); }
      else if (piece.isEnemy(target)) { moves.push([r, c]); break; }
      else                       { break; }
      r += dr; c += dc;
    }
  }
  return moves;
}

// ── concrete pieces ────────────────────────────────────────────────────────

export class Pawn extends Piece {
  constructor(team) { super(team, PieceType.PAWN); }
  legalMoves([row, col], board) {
    const moves = [];
    const dir      = this.team === Team.WHITE ? -1 : 1;
    const startRow = this.team === Team.WHITE ?  6 : 1;

    const fwd = [row + dir, col];
    if (fwd[0] >= 0 && fwd[0] < 8 && board.get(...fwd) === null) {
      moves.push(fwd);
      const fwd2 = [row + 2 * dir, col];
      if (!this.hasMoved && row === startRow && board.get(...fwd2) === null)
        moves.push(fwd2);
    }
    for (const dc of [-1, 1]) {
      const cap = [row + dir, col + dc];
      if (cap[0] >= 0 && cap[0] < 8 && cap[1] >= 0 && cap[1] < 8 &&
          this.isEnemy(board.get(...cap)))
        moves.push(cap);
    }
    return moves;
  }
}

export class Rook extends Piece {
  constructor(team) { super(team, PieceType.ROOK); }
  legalMoves(pos, board) { return slide(this, pos, board, [[1,0],[-1,0],[0,1],[0,-1]]); }
}

export class Knight extends Piece {
  constructor(team) { super(team, PieceType.KNIGHT); }
  legalMoves([row, col], board) {
    return [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
      .map(([dr,dc]) => [row+dr, col+dc])
      .filter(([r,c]) => r>=0&&r<8&&c>=0&&c<8 &&
              (board.get(r,c)===null || this.isEnemy(board.get(r,c))));
  }
}

export class Bishop extends Piece {
  constructor(team) { super(team, PieceType.BISHOP); }
  legalMoves(pos, board) { return slide(this, pos, board, [[1,1],[1,-1],[-1,1],[-1,-1]]); }
}

export class Queen extends Piece {
  constructor(team) { super(team, PieceType.QUEEN); }
  legalMoves(pos, board) {
    return slide(this, pos, board, [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
  }
}

export class King extends Piece {
  constructor(team) { super(team, PieceType.KING); }
  legalMoves([row, col], board) {
    const moves = [];
    for (const dr of [-1,0,1]) for (const dc of [-1,0,1]) {
      if (dr===0&&dc===0) continue;
      const [r,c] = [row+dr, col+dc];
      if (r>=0&&r<8&&c>=0&&c<8 && (board.get(r,c)===null || this.isEnemy(board.get(r,c))))
        moves.push([r,c]);
    }
    return moves;
  }
}
