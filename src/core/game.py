"""Game controller — turn management, move validation, win detection."""
from __future__ import annotations
from typing import Optional, List, Tuple
from src.core.constants import WHITE, BLACK, KING
from src.core.board import Board
from src.core.position import Position
from src.core.piece import Piece


class Game:
    def __init__(self):
        self.board        = Board()
        self.current_turn = WHITE
        self.history: List[Tuple[Position, Position, Optional[Piece]]] = []
        self.status       = "ongoing"  # "ongoing" | "checkmate" | "stalemate"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def legal_moves_for(self, pos: Position) -> List[Position]:
        """All moves for the piece at pos that don't leave own king in check."""
        piece = self.board.get(pos)
        if piece is None or piece.team != self.current_turn:
            return []
        candidates = piece.legal_moves(pos, self.board)
        return [dst for dst in candidates if not self._would_leave_in_check(pos, dst)]

    def move(self, src: Position, dst: Position) -> bool:
        """Attempt a move. Returns True if legal and applied."""
        if dst not in self.legal_moves_for(src):
            return False

        captured = self.board.apply_move(src, dst)
        self.history.append((src, dst, captured))
        self._switch_turn()
        self._update_status()
        return True

    def render(self) -> str:
        check_notice = " — CHECK!" if self.board.is_in_check(self.current_turn) else ""
        return (
            self.board.render()
            + f"\n\nTurn: {self.current_turn}{check_notice}"
            + f"\nStatus: {self.status}"
        )

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _would_leave_in_check(self, src: Position, dst: Position) -> bool:
        """Simulate move and check if own king ends up in check."""
        captured = self.board.apply_move(src, dst)
        in_check = self.board.is_in_check(self.current_turn)
        # Undo
        self.board.apply_move(dst, src)
        self.board.set(dst, captured)
        self.board.get(src).has_moved = False  # rough undo of flag
        return in_check

    def _switch_turn(self):
        self.current_turn = BLACK if self.current_turn == WHITE else WHITE

    def _update_status(self):
        team = self.current_turn
        has_legal = any(
            self.legal_moves_for(pos)
            for pos, _ in self.board.all_pieces(team)
        )
        if not has_legal:
            self.status = "checkmate" if self.board.is_in_check(team) else "stalemate"
