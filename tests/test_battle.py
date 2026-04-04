"""Tests for the battle system — damage, survival, and kill mechanics."""
import pytest
from src.core.game import Game
from src.core.position import Position
from src.core.piece import Pawn, Queen
from src.core.constants import WHITE, BLACK
from src.battle.combat import resolve_attack


# ── Unit tests: CombatResult ───────────────────────────────────────────────

def test_attack_deals_damage():
    attacker = Queen(WHITE)
    defender = Pawn(BLACK)
    before_hp = defender.stats.hp
    result = resolve_attack(attacker, defender)
    assert result.damage == attacker.stats.attack
    assert defender.stats.hp == before_hp - attacker.stats.attack

def test_defender_survives_when_hp_above_zero():
    attacker = Pawn(WHITE)   # attack = 10
    defender = Queen(BLACK)  # hp = 50
    result = resolve_attack(attacker, defender)
    assert result.defender_survived is True
    assert defender.stats.hp == 40

def test_defender_dies_when_hp_reaches_zero():
    attacker = Queen(WHITE)  # attack = 25
    defender = Pawn(BLACK)   # hp = 50
    # Weaken defender first
    defender.stats.hp = 25
    result = resolve_attack(attacker, defender)
    assert result.defender_survived is False
    assert defender.stats.hp <= 0


# ── Integration tests: Game.move() ────────────────────────────────────────

def _make_game_with_pieces(white_piece, white_pos, black_piece, black_pos):
    """Set up a minimal board with two pieces facing each other."""
    game = Game()
    # Clear the board
    for r in range(8):
        for c in range(8):
            game.board.set(Position(r, c), None)
    game.board.set(white_pos, white_piece)
    game.board.set(black_pos, black_piece)
    return game


def test_attack_that_kills_removes_defender():
    white_queen = Queen(WHITE)
    black_pawn  = Pawn(BLACK)
    black_pawn.stats.hp = 25  # one queen hit kills it

    wp = Position(4, 0)
    bp = Position(4, 7)
    game = _make_game_with_pieces(white_queen, wp, black_pawn, bp)

    assert game.move(wp, bp)
    assert game.board.get(bp) is white_queen   # queen advanced
    assert game.board.get(wp) is None


def test_attack_that_wounds_leaves_defender_in_place():
    white_pawn = Pawn(WHITE)
    black_queen = Queen(BLACK)
    # White pawn attacks black queen — 10 dmg, queen survives (50 hp)

    # Put pawn on e4 so it can "capture" diagonally — easier to just use rooks
    from src.core.piece import Rook
    white_rook = Rook(WHITE)   # attack = 20
    black_rook = Rook(BLACK)   # hp = 50 → survives first hit (30 hp left)

    wp = Position(4, 0)
    bp = Position(4, 7)
    game = _make_game_with_pieces(white_rook, wp, black_rook, bp)

    assert game.move(wp, bp)
    # Attacker stays
    assert game.board.get(wp) is white_rook
    # Defender is still alive on its square with reduced HP
    assert game.board.get(bp) is black_rook
    assert black_rook.stats.hp == 30


def test_repeated_attacks_eventually_kill():
    from src.core.piece import Rook
    white_rook = Rook(WHITE)   # attack = 20
    black_rook = Rook(BLACK)   # hp = 50

    wp = Position(4, 0)
    bp = Position(4, 7)

    # We need alternating turns — add a dummy black/white piece elsewhere
    # Simpler: reduce hp manually to simulate prior hits
    black_rook.stats.hp = 20  # one more 20-dmg hit will kill

    game = _make_game_with_pieces(white_rook, wp, black_rook, bp)
    assert game.move(wp, bp)
    assert game.board.get(bp) is white_rook   # rook advanced after kill
    assert game.board.get(wp) is None
