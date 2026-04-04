import { Team } from "./constants.js";
import { Board } from "./board.js";

export class Game {
  constructor() {
    this.board       = new Board();
    this.turn        = Team.WHITE;
    this.status      = "ongoing"; // "ongoing"|"checkmate"|"stalemate"
    this.history     = [];
  }

  legalMovesFor([row, col]) {
    const piece = this.board.get(row, col);
    if (!piece || piece.team !== this.turn) return [];
    return piece.legalMoves([row, col], this.board)
      .filter(dst => !this._wouldLeaveInCheck([row, col], dst));
  }

  move(src, dst) {
    if (!this.legalMovesFor(src).some(([r,c]) => r===dst[0] && c===dst[1]))
      return false;
    const movedBefore = this.board.get(...src)?.hasMoved ?? false;
    const captured = this.board.applyMove(src, dst);
    this.history.push({ src, dst, captured, movedBefore });
    this._switchTurn();
    this._updateStatus();
    return true;
  }

  isInCheck() { return this.board.isInCheck(this.turn); }

  _wouldLeaveInCheck(src, dst) {
    const movedBefore = this.board.get(...src)?.hasMoved ?? false;
    const captured = this.board.applyMove(src, dst);
    const inCheck  = this.board.isInCheck(this.turn);
    this.board.undoMove(src, dst, captured, movedBefore);
    return inCheck;
  }

  _switchTurn() {
    this.turn = this.turn === Team.WHITE ? Team.BLACK : Team.WHITE;
  }

  _updateStatus() {
    const hasLegal = this.board.allPieces(this.turn)
      .some(({ pos }) => this.legalMovesFor(pos).length > 0);
    if (!hasLegal)
      this.status = this.board.isInCheck(this.turn) ? "checkmate" : "stalemate";
  }
}
