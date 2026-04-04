"""Base chess piece with battle stats."""
from __future__ import annotations
from typing import List, TYPE_CHECKING
from src.core.constants import WHITE, BLACK
from src.core.position import Position
from src.pieces.stats import PieceStats, default_stats

if TYPE_CHECKING:
    from src.core.board import Board


class Piece:
    symbol_map = {}  # subclasses register here

    def __init__(self, team: str, piece_type: str):
        self.team       = team          # WHITE or BLACK
        self.piece_type = piece_type
        self.has_moved  = False
        self.stats: PieceStats = default_stats(piece_type)

    # ------------------------------------------------------------------
    # Movement
    # ------------------------------------------------------------------

    def legal_moves(self, pos: Position, board: "Board") -> List[Position]:
        """Return all pseudo-legal destination squares."""
        raise NotImplementedError

    def _filter_valid(self, moves: List[Position], board: "Board") -> List[Position]:
        return [m for m in moves if m.is_valid()]

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def is_enemy(self, other: "Piece") -> bool:
        return other is not None and other.team != self.team

    def symbol(self) -> str:
        sym = self.symbol_map.get(self.piece_type, "?")
        return sym.upper() if self.team == WHITE else sym.lower()

    def __repr__(self) -> str:
        return f"{self.team[0]}{self.piece_type[:2]}"


# ---------------------------------------------------------------------------
# Concrete pieces
# ---------------------------------------------------------------------------

class Pawn(Piece):
    def __init__(self, team: str):
        from src.core.constants import PAWN
        super().__init__(team, PAWN)
        Piece.symbol_map[PAWN] = "P"

    def legal_moves(self, pos: Position, board: "Board") -> List[Position]:
        moves = []
        direction = -1 if self.team == WHITE else 1  # White moves up (decreasing row)
        start_row  = 6 if self.team == WHITE else 1

        # One step forward
        fwd = pos + Position(direction, 0)
        if fwd.is_valid() and board.get(fwd) is None:
            moves.append(fwd)
            # Two steps from starting rank
            if not self.has_moved and pos.row == start_row:
                fwd2 = pos + Position(2 * direction, 0)
                if board.get(fwd2) is None:
                    moves.append(fwd2)

        # Captures (diagonal)
        for dc in (-1, 1):
            cap = pos + Position(direction, dc)
            if cap.is_valid() and self.is_enemy(board.get(cap)):
                moves.append(cap)

        return moves


class Rook(Piece):
    def __init__(self, team: str):
        from src.core.constants import ROOK
        super().__init__(team, ROOK)
        Piece.symbol_map[ROOK] = "R"

    def legal_moves(self, pos: Position, board: "Board") -> List[Position]:
        return _slide(self, pos, board, [(1,0),(-1,0),(0,1),(0,-1)])


class Knight(Piece):
    def __init__(self, team: str):
        from src.core.constants import KNIGHT
        super().__init__(team, KNIGHT)
        Piece.symbol_map[KNIGHT] = "N"

    def legal_moves(self, pos: Position, board: "Board") -> List[Position]:
        offsets = [(-2,-1),(-2,1),(-1,-2),(-1,2),(1,-2),(1,2),(2,-1),(2,1)]
        moves = []
        for dr, dc in offsets:
            dest = pos + Position(dr, dc)
            if dest.is_valid():
                target = board.get(dest)
                if target is None or self.is_enemy(target):
                    moves.append(dest)
        return moves


class Bishop(Piece):
    def __init__(self, team: str):
        from src.core.constants import BISHOP
        super().__init__(team, BISHOP)
        Piece.symbol_map[BISHOP] = "B"

    def legal_moves(self, pos: Position, board: "Board") -> List[Position]:
        return _slide(self, pos, board, [(1,1),(1,-1),(-1,1),(-1,-1)])


class Queen(Piece):
    def __init__(self, team: str):
        from src.core.constants import QUEEN
        super().__init__(team, QUEEN)
        Piece.symbol_map[QUEEN] = "Q"

    def legal_moves(self, pos: Position, board: "Board") -> List[Position]:
        return _slide(self, pos, board,
                      [(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)])


class King(Piece):
    def __init__(self, team: str):
        from src.core.constants import KING
        super().__init__(team, KING)
        Piece.symbol_map[KING] = "K"

    def legal_moves(self, pos: Position, board: "Board") -> List[Position]:
        moves = []
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr == 0 and dc == 0:
                    continue
                dest = pos + Position(dr, dc)
                if dest.is_valid():
                    target = board.get(dest)
                    if target is None or self.is_enemy(target):
                        moves.append(dest)
        return moves


# ---------------------------------------------------------------------------
# Sliding helper
# ---------------------------------------------------------------------------

def _slide(piece: Piece, pos: Position, board: "Board",
           directions: list) -> List[Position]:
    moves = []
    for dr, dc in directions:
        cur = pos + Position(dr, dc)
        while cur.is_valid():
            target = board.get(cur)
            if target is None:
                moves.append(cur)
            elif piece.is_enemy(target):
                moves.append(cur)
                break
            else:
                break
            cur = cur + Position(dr, dc)
    return moves
