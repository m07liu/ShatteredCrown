"""
Combat resolution for ShatteredCrown.

When an attacker moves onto an enemy square, resolve_attack() is called.
The attacker deals its attack stat as damage to the defender's HP.
  - Defender HP ≤ 0 → defender is removed, attacker occupies the square.
  - Defender HP > 0 → defender survives, attacker stays in its original square.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.core.piece import Piece


@dataclass
class CombatResult:
    damage:            int
    defender_survived: bool   # True  → defender still on board
                              # False → defender dead, attacker advances


def resolve_attack(attacker: "Piece", defender: "Piece") -> CombatResult:
    """Apply attacker's damage to defender; return the outcome."""
    damage = attacker.stats.attack
    defender.stats.take_damage(damage)
    return CombatResult(
        damage=damage,
        defender_survived=defender.stats.is_alive,
    )
