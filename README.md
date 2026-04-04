# ♛ ShatteredCrown — Battle Chess

> *Chess, but pieces fight for their lives.*

ShatteredCrown is a browser-based battle chess game where every piece carries **HP**, wields **unique abilities**, and must survive combat to claim a square. Pieces don't vanish on contact — they bleed, endure, and sometimes make a last desperate stand.

---

## ✨ Features

### ⚔ HP-Based Combat
Every piece has health and attack stats. Moving onto an enemy square triggers a fight — the defender loses HP equal to the attacker's attack. If the defender survives, the attacker is repelled and the turn ends. Only a killing blow earns the square.

| Piece | HP | ATK | Ability |
|---|---|---|---|
| ♙ Pawn | 40 | 10 | **Strength in Numbers** — Adjacent friendly pawns gain +1 HP at end of turn |
| ♖ Rook | 50 | 20 | **Its Hammer Time** — Attacks pierce through to the enemy behind the target |
| ♘ Knight | 60 | 12 | **Hippity Hoppity** — First attack opens a chain: hit up to 3 enemies in sequence |
| ♗ Bishop | 30 | 20 | **I'm Pope-ing Off** — Active: heal all friendly pieces in 3×3 area by 7 HP |
| ♕ Queen | 100 | 25 | **Stunning Beauty** — Hits stun the target; **HP Tax** — deals +10% of target's current HP |
| ♔ King | 35 | 4 | **King's Choice** — One powerful ability chosen before the match |

### 💀 Last Stand
When a piece is about to deliver a killing blow, a **Last Stand challenge** triggers — a full-screen duel screen where both pieces rush toward each other. The attacker must correctly type **5 random letters within 7 seconds** to execute the capture. Fail, and the turn ends with nothing gained.

### 👑 King's Choice
Before each match, both kings independently choose one **once-per-game** ability:

- **Higher Morale** — Spawn a friendly Rook on any empty square; King recovers 25% HP
- **Za Wardou** *(Toki wa Tomare)* — Time stops: the opponent loses their next turn
- **Dirty Deeds** — Swap the King's position with any other friendly piece
- **Epitath** — Reverse the opponent's last move entirely

### 🌋 Battlefield Maps
Four distinct battlefields, switchable at any time from the sidebar (switching resets the match):

| Map | Hazards |
|---|---|
| ⚔ Standard | Classic board — no environmental effects |
| 🌋 Hybrid | Volcano tiles deal 10 damage/turn; Repair squares grant +5 ATK permanently |
| 🌊 Flood | Water tiles block movement and line-of-sight for sliding pieces |
| 🌫 Foggy | Enemy pieces in fog are invisible unless a friendly piece is adjacent |

Each map tile has a live CSS animation — lava flows, waves shimmer, fog drifts.

### 🎨 Visual Polish
- Animated intro screen with game overview before every session
- Floating lava embers, water ripples, and fog wisps surround the board based on active map
- Per-piece HP bars, floating damage numbers, stun indicators
- Attack animations with ghost pieces flying across the board
- Clash, death-spin, pierce, heal, and ability-specific visual effects
- Ambient board glow that changes color with the active map

---

## 🚀 Getting Started

No installation needed — open `index.html` in any modern browser.

```bash
# Clone the repo
git clone https://github.com/irisxu/ShatteredCrown.git
cd ShatteredCrown

# Open in browser
open index.html
```

For the Python CLI version:

```bash
python main.py          # Play in terminal
python -m pytest tests/ # Run tests
```

---

## 🗂 Project Structure

```
ShatteredCrown/
├── index.html              # Game entry point
├── web/
│   ├── js/
│   │   └── app.js          # All game logic, UI, animations (single-file web build)
│   └── css/
│       └── style.css       # All styles and animations
├── src/                    # Python backend (CLI version)
│   ├── core/               # Chess engine — board, pieces, movement, game state
│   ├── pieces/             # Piece stats and ability definitions
│   └── battle/             # Combat resolution
├── tests/                  # Python test suite
└── main.py                 # CLI entry point
```

---

## 👥 Collaborators

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/irisxu">
        <strong>Iris Xu</strong>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/AndrewLu-1">
        <strong>Andrew Lu</strong>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/IzzMk8301">
        <strong>Aiden Geng</strong>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/michaelliutennis">
        <strong>Michael Liu</strong>
      </a>
    </td>
  </tr>
</table>
