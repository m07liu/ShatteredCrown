import { BOARD_SIZE, Team, PieceType } from "./constants.js";
import { Pawn, Rook, Knight, Bishop, Queen, King } from "./piece.js";

export class Board {
  constructor() {
    this._grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    this._setup();
  }

  _setup() {
    const back = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook];
    for (let c = 0; c < 8; c++) {
      this._grid[0][c] = new back[c](Team.BLACK);
      this._grid[7][c] = new back[c](Team.WHITE);
      this._grid[1][c] = new Pawn(Team.BLACK);
      this._grid[6][c] = new Pawn(Team.WHITE);
    }
  }

  get(row, col)           { return this._grid[row][col]; }
  set(row, col, piece)    { this._grid[row][col] = piece; }

  applyMove([sr, sc], [dr, dc]) {
    const captured = this._grid[dr][dc];
    this._grid[dr][dc] = this._grid[sr][sc];
    this._grid[sr][sc] = null;
    if (this._grid[dr][dc]) this._grid[dr][dc].hasMoved = true;
    return captured;
  }

  undoMove([sr, sc], [dr, dc], captured, movedBefore) {
    this._grid[sr][sc] = this._grid[dr][dc];
    this._grid[dr][dc] = captured;
    if (this._grid[sr][sc]) this._grid[sr][sc].hasMoved = movedBefore;
  }

  findKing(team) {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = this._grid[r][c];
        if (p?.team === team && p.type === PieceType.KING) return [r, c];
      }
    return null;
  }

  allPieces(team) {
    const result = [];
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = this._grid[r][c];
        if (p?.team === team) result.push({ pos: [r, c], piece: p });
      }
    return result;
  }

  isInCheck(team) {
    const kingPos = this.findKing(team);
    if (!kingPos) return false;
    const opp = team === Team.WHITE ? Team.BLACK : Team.WHITE;
    for (const { pos, piece } of this.allPieces(opp)) {
      if (piece.legalMoves(pos, this).some(([r,c]) => r===kingPos[0] && c===kingPos[1]))
        return true;
    }
    return false;
  }
}
