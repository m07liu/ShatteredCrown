"""Entry point — play ShatteredCrown from the terminal."""
import sys
from src.core.game import Game
from src.core.position import Position


def parse_square(token: str) -> Position:
    token = token.strip().lower()
    if len(token) != 2:
        raise ValueError(f"Bad square: {token!r}")
    col = ord(token[0]) - ord("a")
    row = 8 - int(token[1])
    return Position(row, col)


def main():
    game = Game()
    print("ShatteredCrown — Battle Chess")
    print("Commands:  <src> <dst>  (e.g. 'e2 e4')  |  quit\n")

    while game.status == "ongoing":
        print(game.render())
        print()
        try:
            raw = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            sys.exit(0)

        if raw.lower() in ("quit", "exit", "q"):
            print("Bye!")
            sys.exit(0)

        parts = raw.split()
        if len(parts) != 2:
            print("Enter two squares, e.g. 'e2 e4'")
            continue

        try:
            src = parse_square(parts[0])
            dst = parse_square(parts[1])
        except ValueError as e:
            print(e)
            continue

        if not game.move(src, dst):
            print("Illegal move.")
            continue

    print(game.render())
    print(f"\nGame over: {game.status}!")


if __name__ == "__main__":
    main()
