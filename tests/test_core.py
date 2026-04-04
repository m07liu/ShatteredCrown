"""Basic tests for the core chess engine."""
import pytest
from src.core.game import Game
from src.core.position import Position
from src.core.constants import WHITE, BLACK


def test_board_initial_piece_count():
    game = Game()
    white = game.board.all_pieces(WHITE)
    black = game.board.all_pieces(BLACK)
    assert len(white) == 16
    assert len(black) == 16


def test_pawn_opening_moves():
    game = Game()
    # e2 pawn can go to e3 or e4
    src = Position(6, 4)  # e2
    moves = game.legal_moves_for(src)
    assert Position(5, 4) in moves  # e3
    assert Position(4, 4) in moves  # e4
    assert len(moves) == 2


def test_legal_move_applied():
    game = Game()
    assert game.move(Position(6, 4), Position(4, 4))  # e2→e4
    assert game.board.get(Position(4, 4)) is not None
    assert game.board.get(Position(6, 4)) is None
    assert game.current_turn == BLACK


def test_illegal_move_rejected():
    game = Game()
    # White rook at a1 cannot move through its own pawn
    assert not game.move(Position(7, 0), Position(5, 0))


def test_turn_enforcement():
    game = Game()
    # Black tries to move first — should fail
    assert not game.move(Position(1, 4), Position(3, 4))
    assert game.current_turn == WHITE


def test_board_render_returns_string():
    game = Game()
    output = game.render()
    assert "White" in output
    assert "a b c d e f g h" in output
