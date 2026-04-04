"""8×8 board — holds pieces and handles move execution."""
from __future__ import annotations
from typing import Optional, List, Tuple
from src.core.constants import (
    BOARD_SIZE, WHITE, BLACK,
    PAWN, ROOK, KNIGHT, BISHOP, QUEEN, KING,
)
from src.core.position import Position
from src.core.piece import Piece, Pawn, Rook, Knight, Bishop, Queen, King


class Board:
    def __init__(self):
        self._grid: List[List[Optional[Piece]]] = [
            [None] * BOARD_SIZE for _ in range(BOARD_SIZE)
        ]
        self._setup()

    # ------------------------------------------------------------------
    # Setup
    # ------------------------------------------------------------------

    def _setup(self):
        back_row = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook]

        for col, cls in enumerate(back_row):
            self._grid[0][col] = cls(BLACK)
            self._grid[7][col] = cls(WHITE)

        for col in range(BOARD_SIZE):
            self._grid[1][col] = Pawn(BLACK)
            self._grid[6][col] = Pawn(WHITE)

    # ------------------------------------------------------------------
    # Access
    # ------------------------------------------------------------------

    def get(self, pos: Position) -> Optional[Piece]:
        return self._grid[pos.row][pos.col]

    def set(self, pos: Position, piece: Optional[Piece]):
        self._grid[pos.row][pos.col] = piece

    def find_king(self, team: str) -> Optional[Position]:
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                p = self._grid[row][col]
                if p and p.piece_type == KING and p.team == team:
                    return Position(row, col)
        return None

    def all_pieces(self, team: str) -> List[Tuple[Position, Piece]]:
        result = []
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                p = self._grid[row][col]
                if p and p.team == team:
                    result.append((Position(row, col), p))
        return result

    # ------------------------------------------------------------------
    # Move execution
    # ------------------------------------------------------------------

    def apply_move(self, src: Position, dst: Position) -> Optional[Piece]:
        """Move piece from src→dst, return any captured piece."""
        piece = self.get(src)
        captured = self.get(dst)
        self.set(dst, piece)
        self.set(src, None)
        if piece:
            piece.has_moved = True
        return captured

    def is_in_check(self, team: str) -> bool:
        king_pos = self.find_king(team)
        if king_pos is None:
            return False
        opponent = BLACK if team == WHITE else WHITE
        for pos, piece in self.all_pieces(opponent):
            if king_pos in piece.legal_moves(pos, self):
                return True
        return False

    # ------------------------------------------------------------------
    # Display
    # ------------------------------------------------------------------

    def render(self) -> str:
        lines = ["  a b c d e f g h"]
        for row in range(BOARD_SIZE):
            rank = 8 - row
            cells = []
            for col in range(BOARD_SIZE):
                p = self._grid[row][col]
                cells.append(p.symbol() if p else ".")
            lines.append(f"{rank} {' '.join(cells)}")
        return "\n".join(lines)
