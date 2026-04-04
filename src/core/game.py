"""Game controller — turn management, move validation, win detection, combat."""
from __future__ import annotations
from typing import Optional, List, Tuple
from src.core.constants import WHITE, BLACK, KING
from src.core.board import Board
from src.core.position import Position
from src.core.piece import Piece
from src.battle.combat import CombatResult, resolve_attack


class Game:
    def __init__(self):
        self.board        = Board()
        self.current_turn = WHITE
        self.history: List[Tuple[Position, Position, Optional[Piece], Optional[CombatResult]]] = []
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
        """
        Attempt a move. Returns True if the action was legal and applied.

        Combat rule:
          - Moving onto an enemy square triggers an attack.
          - If the defender's HP drops to 0 or below, it is removed and
            the attacker occupies the square (classic capture).
          - If the defender survives, the attacker stays put; the turn
            still advances.
        """
        if dst not in self.legal_moves_for(src):
            return False

        attacker = self.board.get(src)
        defender = self.board.get(dst)
        combat: Optional[CombatResult] = None

        if defender is not None:
            combat = resolve_attack(attacker, defender)
            if combat.defender_survived:
                # Attacker stays — only turn advances
                self.history.append((src, src, None, combat))
                self._switch_turn()
                self._update_status()
                return True
            # Defender died — fall through to normal move

        captured = self.board.apply_move(src, dst)
        self.history.append((src, dst, captured, combat))
        self._switch_turn()
        self._update_status()
        return True

    def render(self) -> str:
        check_notice = " — CHECK!" if self.board.is_in_check(self.current_turn) else ""
        lines = [
            self.board.render(),
            f"\nTurn: {self.current_turn}{check_notice}",
            f"Status: {self.status}",
        ]
        # Show last combat result if any
        if self.history:
            _, _, _, combat = self.history[-1]
            if combat:
                outcome = "survived" if combat.defender_survived else "killed"
                lines.append(f"Last attack: {combat.damage} dmg — defender {outcome}")
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _would_leave_in_check(self, src: Position, dst: Position) -> bool:
        """
        Simulate the move to check for self-check.
        For simulation, captures are always treated as kills regardless of HP,
        so that legal move generation stays consistent.
        """
        attacker = self.board.get(src)
        defender = self.board.get(dst)

        # Temporarily kill defender so apply_move always removes it
        saved_hp = None
        if defender is not None:
            saved_hp = defender.stats.hp
            defender.stats.hp = 0

        captured = self.board.apply_move(src, dst)
        in_check = self.board.is_in_check(self.current_turn)

        # Undo move
        self.board.apply_move(dst, src)
        self.board.set(dst, captured)
        self.board.get(src).has_moved = False

        # Restore defender HP
        if defender is not None and saved_hp is not None:
            defender.stats.hp = saved_hp

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
