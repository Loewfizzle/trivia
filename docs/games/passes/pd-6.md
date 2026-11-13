# PD-6 — PRISM DROP: THE SPARE-WIDTH COLUMN + THE SOLO PODIUM FITS + TWO SOLO BUTTONS + THE SLAM's WEIGHT (Nov 13 2026)

The plan: docs/games/plan.md "PD-6" (+ THE ADD-ON, Ben 4:30 pm — THE SOLO PODIUM SAYS WHAT IT PAID). On the mini PC. **No database rules change**
(82 / 82). Still 8 functions. City code touched (THE GAME CARD, `cardActions`, the shared podium) → ONE deployment, the final push's top commit
carries the harbor tag. Shots stay out of git (`tests/repo-growth.test.mjs`) — summarised here.

## Step 0 — `c84cce64`
plan.md's PD-6 section appended unchanged; THE ADD-ON's lines appended with Group 2 (`187e367a`).

## Group 1 — THE SPARE-WIDTH COLUMN (`04e44a45`)
`js/games/prism/layout.js` (PURE): HEIGHT-bound (`cellH < cellW` and under `MAX_CELL`) → `railW` = the spare width (34 → `COL_MAX` 72, snapped
to device pixels), the board at the 12-pt margin (nothing left to split unless the column is capped); SLAM = column − 10 between today's 40 and
56, centred (`.pd.is-wide`); the tiles as wide as the column (initial 19 px, rank + KO 10 px); a duel tile's board up to 5-pt cells. Width-bound
= PD-1's numbers exactly.

| screen | cell | column | SLAM |
| --- | --- | --- | --- |
| 390 × 650 — Safari with its toolbars (the owner's screenshot) | 29 | 68 | 56 |
| 402 × 690 — Safari | 31 | 60 | 50 |
| 430 × 746 — Safari | 33.67 | 61.33 | 51 |
| 375 × 553 — an SE in Safari | 24 | 72 (capped) | 56 |
| 390 × 844 / 402 × 874 / 430 × 932 — a home-screen app (safe areas) | 32.33 / 33.33 / 36.33 | 34 | 40 |

**One deviation, named:** the plan's SLAM = column − 16 gave ~45 pt on the real Safari columns (60–68) — not the ~56 the headline asks for;
−10 gives 50–56 (5 pt of air each side; the tap area still ≥ 44). One constant (`SLAM_PAD`) if the owner wants it back.
Unit `prism-layout` 7 / 7 (+2). Look review (`prism-shots.mjs SETS=pd6`, `NOSAFE=1` for Safari): solo, 5 + 7 opponents, LEFT, BUTTONS, the duel,
the day look, at 390 / 402 / 430 Safari + app, 375 × 553, 1440 — three rounds: (1) the column + a centred SLAM read; (2) the app view is PD-1's
look unchanged, the column holds 5 / 7 / the duel / the day look; BUTTONS keeps its smaller board (the column capped at 72, the rest centred —
the plan's "unchanged"); (3) desktop + the SE.

## Group 2 — THE SOLO PODIUM FITS + THE ADD-ON (`187e367a`)
- `ui/final.js`'s `.is-solo` only (CSS in `components.css`): SOLO RUN a 22-px one-line heading (was the 42–66 px hero on two lines), gaps 18 → 12,
  the foot at the screen's foot (`margin-top: auto` — it all fits now, so the foot no longer floats mid-screen). PRISM DROP's solo board at 7-pt
  cells under a 760-pt screen (`victory.js`).
- **Before → after** (Chromium, Safari heights, the podium as it lands — `shots.mjs pd6-pod / -day / -one / -oc`):

  | podium | 390 × 650 | 402 × 690 | 430 × 746 |
  | --- | --- | --- | --- |
  | PRISM DROP solo (night + day) | 148 pt past the fold, MORE BELOW → fits | 112 → fits | 65 → fits |
  | a ROOM OF ONE (HOST → play alone) | 148 → fits | 112 → fits | 65 → fits |
  | OVERCLOCK solo | fit → fits | fit → fits | fit → fits |

- **The multiplayer podium is pixel-identical:** PRISM DROP's 5-player podium (prism-preview, night + day, 390 × 650 + 402 × 874) from a worktree
  of `80b913e5` on :5174 vs this tree — **0 pixels differ** (threshold 24).
- **THE ADD-ON — THE SOLO PODIUM SAYS WHAT IT PAID:** `core/progress.js#step` returns `solo: { n, max }` (this run's place in the streak day's
  solo count) → the outcome's `so` (`api/_lib/stats.js` — the same response; no new call, no rules change) → `profile/callouts.js` draws ONE
  plain line under the score in place of the XP box (`js/core/solo-line.js#soloXpText`, PURE, a NEW module — THE STALE-MODULE RULE): `+15 XP ·
  SOLO RUN · 3 OF 4 TODAY` / `TODAY'S SOLO XP DONE · MORE AT 4 AM`; no count → no line. The XP box is replaced on a solo podium (the line says
  the same + fits; THE MOMENT still opens with the level). A run within 45 s of the last credit waits for the server's retryAfter (M4), so its
  line lands that much later. Unit `solo-line` 2 / 2.

## THE REPORT RACE — found by the add-on's e2e (`df20f0f5`)
The phone reports the moment its match ends; the host's `final` step writes `night/{matchId}` a beat later. A report that came first got
**409 unverifiable — sealed done, that run NEVER credited** (every SURVIVAL solo top-out in the e2e; the same report a moment later: counted).
Now, while the room's game IS the match, a missing record = **425 `not_final`** → the queue's retry. `/api` 56 / 56 (+1).
**Not fixed (a follow-up):** BACK TO THE CITY within ~2 s of a podium closes the solo room before a retried report lands → that run is lost
(the room + its record are gone). The e2e waits for the line before leaving.

## Group 3 — TWO SOLO BUTTONS (`0541b857`)
`SOLO_RUNS = [{ mode, label, sub }]` in a cartridge's meta (the plan's `solo` list — a capital like every meta export, beside the `SOLO`
switch); `checkCartridge` checks it (SOLO only, 1–3, label ≤ 16, sub ≤ 24, each mode a one-player mode). `cardActions({ runs })` → `main` +
`more`; THE GAME CARD draws one tube each (ONE pink MAIN; `.nd-card-sub` the small line); `playSolo(game, { settings: { mode } })` →
`soloSettings(meta, want)`; a guest's setup keeps the mode (`setupSolo`). PRISM DROP: SCORE RUSH · ONE SONG + SURVIVAL · UNTIL YOU TOP OUT.
**THE BOOT BYTES pin 34 → 36 KB — a named raise:** `js/games` at boot was 34 749 of 34 816 bytes (67 left); the contract's check + the list
= +0.9 KB (35 691). Still no game logic at boot. Card shots at 390 / 402 / 430 (+ 390 × 650): the three tubes; OVERCLOCK's single PLAY NOW.

## Group 4 — THE SLAM's WEIGHT (`a620ccb5`)
`audio.js#hard`: the thump 100 → 32 Hz over 0.28 s (was 130 → 42, 0.22), gain 0.23 (0.20); the tonic pluck darker + longer; + a soft tonic an
octave up (0.035) — a phone speaker has little under ~100 Hz, so a deeper fundamental alone would sound QUIETER on an iPhone. Still `note()`,
every tone ≤ a clear's. **THE BOARD KICK** (`view.js#kick`): 2.5 pt down, −0.5 pt back, 0 — 0.12 s, a Web Animation on `.pd-board` + the night
look's `.pd-light` (transform only, compositor, no reflow); OFF under Reduced effects + prefers-reduced-motion. Replaces `.pd-thud` (a 2-px CSS
dip restarted with `void el.offsetWidth` — a forced reflow a slam — the light left behind). Measured per animation frame (390 × 650): night board
+ light peak 2.5 → 0; day board 2.5; reducedFx + prefers-reduced: 0 kicks. **60 fps at 4× CPU, GPU on, SLAM spammed** (`prism-shots.mjs
PERF_SETS=rest,slam,rest,slam`): rest 59.5 / 60 fps, slam 59.2 / 59.7 fps — p50 16.7, p95 16.8 ms both, CPU p75 2.1–2.2 ms (rest 3.0).
Unit `prism-pd6` 2 / 2.

## The close — local runs
My own servers: fresh emulators + `serve.mjs --emu` on :5173 (restarted after each `/api` change); a worktree of `80b913e5` on :5174 for the
BEFORE runs (the podium pixdiff, the vault A/B).

| suite | result |
| --- | --- |
| unit | 1820 / 1820 |
| rules | 82 / 82 (no rules change) |
| `/api` server.test | 56 / 56 (+1: the report race) |
| e2e-prism FAST · full | 63 / 63 · 86 / 86 |
| e2e-playnow WebKit · Chromium (all cases) | 24 / 24 · 24 / 24 (both tubes + their modes, PLAY AGAIN keeps each, the XP line on runs 1–4 + the 5th's DONE) |
| e2e-prism-leak · smoke (all playable games) · e2e-profiles | 6 / 6 · 8 / 8 · 33 / 33 |
| harbor groups touched (shell, roomnote, desktop, gameflows, afterparty, sololook, cartridge, tapfit, corners) | 89 / 89 |
| **FULL e2e-harbor** (4 shards + the tails, ~35 min) | **1309 / 1315** — each red checked: SIGHTINGS' capture hitch (the 4-shard load — green alone); FOUR "A FULL LOBBY of 8 cards at 4× CPU" checks (THE VAULT strips, SPEED's GPU path ×3 → two of them + THE VAULT 2A) — red alone too, AND red on the pre-PD-6 build (`80b913e5` on :5174, the same machine, the same hour: 52 / 58, the same four + THE CARD LAB's finger scroll) — the machine's state today, not this pass (nothing here is in the vault's render path) |

All servers I started were stopped at the end (the emulators, `serve.mjs --emu` :5173, the :5174 worktree server + its worktree removed);
Ben's :5190 preview (PID 17968) left running.
