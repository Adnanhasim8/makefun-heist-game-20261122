# Velvet Rook — The Gilded Vault Heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Adnanhasim8/makefun-heist-game-20261122/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Adnanhasim8/makefun-heist-game-20261122/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

An original top-down stealth heist game for the make.fun "best heist game"
competition. Rook the thief crosses three rooms of a gilded vault house —
the Marble Gallery, the Vault Hall and the Inner Sanctum — lifts the Aurora
Diamond and slips out the getaway door.

## How it plays

- **WASD / arrows** move, **Shift** sneaks (slower, harder to spot).
- **E (hold)** lifts the Aurora Diamond from its pedestal; moving breaks the lift.
- **Click** throws a coin (3 per room) to pull guards to the ping.
- **F / right-click** drops a smoke pellet (2 per room) that blocks sight.
- **Guards** patrol with amber vision cones and a suspicion meter; at full
  suspicion they chase, and being grabbed ends the run.
- **Cameras** sweep red cones; crossing one fills the alarm fast.
- **Alarm meter** (top right) rises on detection and cools when hidden;
  at 100% the vault locks down. Leaving with a cool alarm pays a stealth bonus.
- Grab side gems ($150), the diamond ($2,000), then reach the GETAWAY door.

## Layout

- `game/index.html` + `game/style.css` — page and canvas.
- `game/src/config.js` — rooms, tuning, all level data.
- `game/src/level.js` — collision and line-of-sight geometry.
- `game/src/guards.js` — guard patrol / suspicion / chase / investigate AI.
- `game/src/cameras.js` — sweeping security cameras.
- `game/src/game.js` — rules: movement, loot, tools, alarm, win/lose.
- `game/src/render.js` — all canvas drawing, HUD and screens.
- `game/src/audio.js` — synthesized Web Audio sounds, no audio files.
- `game/src/input.js` — keyboard and mouse.
- `game/src/shots.js` — staged screenshot states (`?shot=cover|stealth|alarm|win`).
- `game/src/main.js` — boot and frame loop.
- `main.ts` — hand-in program: copies `game/` + `screenshots/` to `/output`
  and writes `dossier.json` with `vendor/makefun-game.ts`.
- `screenshots/` — real renders of the game's own code, taken in Chromium.

Everything is original: own names, art, sounds and rooms. No network
requests — the game runs from its own static files. License: MIT.
