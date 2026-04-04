"""
Battle stats attached to every piece.

All values are placeholders except attack — health will be tuned later,
speed and abilities will be implemented in their own branches.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List


@dataclass
class Ability:
    """Placeholder — ability details will be filled in later."""
    name: str
    description: str = ""


@dataclass
class PieceStats:
    max_hp:    int
    hp:        int
    speed:     int          # placeholder — movement/initiative system TBD
    attack:    int          # damage dealt per strike
    abilities: List[Ability] = field(default_factory=list)

    # ------------------------------------------------------------------
    # Convenience
    # ------------------------------------------------------------------

    def take_damage(self, amount: int) -> None:
        self.hp -= amount

    @property
    def is_alive(self) -> bool:
        return self.hp > 0

    @property
    def hp_percent(self) -> float:
        return max(0.0, self.hp / self.max_hp)


# ---------------------------------------------------------------------------
# Default stats per piece type
# All HP set to 50 — will be tuned per piece later.
# Speed is 0 (placeholder).
# Abilities list is empty (placeholder).
# ---------------------------------------------------------------------------

from src.core.constants import PAWN, ROOK, KNIGHT, BISHOP, QUEEN, KING  # noqa: E402

PIECE_DEFAULTS: dict[str, PieceStats] = {
    PAWN:   PieceStats(max_hp=50, hp=50, speed=0, attack=10),
    ROOK:   PieceStats(max_hp=50, hp=50, speed=0, attack=20),
    KNIGHT: PieceStats(max_hp=50, hp=50, speed=0, attack=15),
    BISHOP: PieceStats(max_hp=50, hp=50, speed=0, attack=15),
    QUEEN:  PieceStats(max_hp=50, hp=50, speed=0, attack=25),
    KING:   PieceStats(max_hp=50, hp=50, speed=0, attack=10),
}


def default_stats(piece_type: str) -> PieceStats:
    """Return a fresh copy of the default stats for a piece type."""
    base = PIECE_DEFAULTS[piece_type]
    return PieceStats(
        max_hp=base.max_hp,
        hp=base.hp,
        speed=base.speed,
        attack=base.attack,
        abilities=[],
    )
