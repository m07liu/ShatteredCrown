# ShatteredCrown — Battle Chess

A chess game where every piece has **HP, skills, and unique combat abilities**.
Pieces don't just capture — they *fight*.

## Branch Map

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases |
| `develop` | Integration — merge features here first |
| `feature/core-chess` | Board, pieces, movement rules, game loop ✅ |
| `feature/piece-attributes` | HP, attack, defense, skill definitions |
| `feature/battle-system` | Combat resolution when pieces collide |
| `feature/battlefield` | Terrain, environment effects, map settings |

## Quick Start

```bash
python main.py          # Play in terminal
python -m pytest tests/ # Run tests
```

## Project Structure

```
src/
  core/          # Chess engine (board, pieces, movement, game state)
  pieces/        # Extended piece attributes (HP, skills) — WIP
  battle/        # Battle system — WIP
  battlefield/   # Battlefield environments — WIP
  ui/            # UI layer — WIP
tests/
main.py          # CLI entry point
```

## Planned Features

- **HP & Stats**: Each piece has health, attack, defense, speed
- **Skills**: Unique active/passive abilities per piece type
- **Battle Resolution**: Multi-round combat when pieces occupy the same square
- **Battlefields**: Different maps (forest, lava, dungeon) with terrain effects
