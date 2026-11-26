# FREEFALL — F2: THE NIGHT LOOK + SOLO + THE SOUNDS (Nov 25–26 2026 — on the Beelink; the real game on an unlisted test page)

The owner's decisions: `docs/games/plan.md` "FREEFALL — F2 (approved Nov 25)". The game's page: `docs/freefall.md`. HIGH RISE S2 is the
template (`docs/games/passes/highrise-s2.md`). **Nothing is registered** — no GAMES entry, no `config.js` / meta / boot / cartridge
change, no `/api` wiring, **no rules-file change (nothing to re-publish)**. The new address, UNLISTED:
**https://neonspeakeasy.com/freefall-play** — **NOTHING COUNTS UNTIL GO-LIVE**.

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| Step 0 | f1bae383 | the owner's F2 decisions in `docs/games/plan.md`; `lab-export.mjs https://www.neonspeakeasy.com`: 226 marks, **no open FIX**; the inbox: no entry for this pass |
| 0 — THE RULES FIXES | (below) | THE LANDING AFTER A SHATTER = a bounce · MOVING RED in THE TRENCH · THE HOLD (engine + judge + packed log) · the sims re-run + THE PROOF |

## GROUP 0 — THE RULES FIXES
- **THE LANDING RIGHT AFTER A SHATTER IS NEVER AN OUT** (the owner's rule b — `tuning.js` `shatterSafe`, `engine.js#landing`): red there
  = a BOUNCE (the event `bounce { red: true }` — the view's red flash + the cracked slice); the clean count + the no-bounce run reset as
  for any bounce; the NEXT landing on red is out again. `run.saves` counts them (the sims' column).
- **MOVING RED in THE TRENCH** (solo — floors ≥ 201; `tower-gen.js#moversInto`, `tuning.js` `gen.move { from 201, pace 45, max 4,
  chance 154 + 51 a lap, two 3 }`): a trench floor has up to TWO red slices that walk back and forth along their own TRACK (2–4 solid
  slices side by side), one slice every 45 ticks (0.75 s) — a mover's slice is a pure function of (seed, floor, tick)
  (`moverSlice` / `moversAt` / `kindAtTick`; the engine's landing reads the slice AT ITS OWN TICK). 60 % of the first lap's floors have
  one, 80 % of the second's, every floor from the third — where TWO move on 55 % of the floors. FAIR BY CONSTRUCTION, at every stand
  of every mover: a track never holds a slice straight below a gap of the floor above (twists counted — a ball through a gap never
  lands on moving red, at whatever tick it falls) · ≥ 3 safe slices, red ≤ 8, THE FALL WINDOW + NO ISLAND hold wherever the movers
  stand · a mover only steps to the slice next to it · two tracks never share a slice. A track takes at most ONE static red slice
  (it is the one that moves now) — the first design let a track swallow up to four and made the trench EASIER (the sims said so).
- **THE HOLD** (HIGH RISE's — `engine.js#hold`, `replay.js`): a LOGGED event `{ k: 'hold', t }` the judge replays. SOLO only (`modes.solo.holds`
  3; match + daily 0 — a match never holds). T is a PLAY tick: every landing before T happens, then the ball's flight STARTS OVER at T
  (a bounce's next landing = T + 36, a fall's = T + 18) and the darkness waits exactly as long — the player comes back from the
  3 · 2 · 1 to a whole flight. The next move counts at T + 1 at the earliest. The packed log: `!` + the ticks since the event before.

### THE SIMS PROOF — floors 0–199 did not move
Digests taken on F1's last commit (639f7fca) BEFORE any rule changed (the four bots × 60 seeds, every log + every result, tick for
tick; 300 towers × floors 0–200):

| what | F1 (639f7fca) | F2, the shatter rule OFF (a what-if row) | F2 as shipped |
| --- | --- | --- | --- |
| the tower, floors 0–200 (twist · gaps · red) | `01feecfdacd61711` | `01feecfdacd61711` | `01feecfdacd61711` |
| MATCH — 240 bot runs | `4ec096827cfbf061` | `4ec096827cfbf061` | `74b0b9aef9ae5bcc` (the shatter rule) |
| DAILY — 240 bot runs | `4ec096827cfbf061` | `4ec096827cfbf061` | `74b0b9aef9ae5bcc` |
| SOLO down to floor 200 — 240 bot runs | `4ea09f57d0694530` | `4ea09f57d0694530` | `c2f13808ff03f7b2` |

The tower above THE TRENCH is F1's bit for bit; MOVING RED touches no run above floor 201 (a row without it = the shipped row, tick for
tick, in a match, the daily and solo down to floor 200); the ONLY thing that moves a run on floors 0–199 is the shatter rule itself —
its point. Pinned in `tests/freefall-tower.test.mjs` + `tests/freefall-sim.test.mjs`.

### THE SIM TABLE (`node scripts/freefall-sim.mjs 2000` — F2's rules)
| mode | bot | floor med (p10–p90) | time med (p10–p90) | ≥ 120 | ≥ 200 | to floor 200 med (p10–p90) | red · dark · made · cap | saved by the shatter rule (runs · a run) | the longest stay on a floor | TERMINAL | bounces a floor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| solo | sloppy | 62 (40–94) | 0:48 (0:30–1:17) | 0.7 % | 0.0 % | — | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 51.6 % · 0.74 | 5.1 s | 0.0 % | 0.80 |
| solo | good | 136 (88–160) | 1:41 (1:03–2:05) | 69.7 % | 0.1 % | 2:46 (2:46–2:46) | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 3.7 % · 0.04 | 2.7 s | 0.4 % | 0.75 |
| solo | great | 245 (168–355) | 3:13 (2:03–4:42) | 98.6 % | 76.2 % | 2:32 (2:23–2:41) | 99.8 % · 0.0 % · 0.0 % · 0.0 % | 1.3 % · 0.01 | 2.1 s | 1.1 % | 0.80 |
| solo | human | 149 (101–183) | 1:57 (1:14–2:29) | 81.1 % | 3.0 % | 2:44 (2:37–2:55) | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 1.9 % · 0.02 | 2.1 s | 0.1 % | 0.81 |
| match | sloppy | 62 (40–94) | 0:48 (0:30–1:17) | 0.7 % | 0.0 % | — | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 51.6 % · 0.74 | 5.1 s | 0.0 % | 0.80 |
| match | good | 136 (88–160) | 1:41 (1:03–2:05) | 69.7 % | 0.1 % | 2:46 (2:46–2:46) | 100.0 % · 0.0 % · 0.1 % · 0.0 % | 3.7 % · 0.04 | 2.7 s | 0.4 % | 0.75 |
| match | great | 200 (168–200) | 2:30 (2:03–2:40) | 98.6 % | 76.2 % | 2:32 (2:23–2:41) | 23.8 % · 0.0 % · 76.2 % · 0.0 % | 0.0 % · 0.00 | 2.1 s | 1.0 % | 0.76 |
| match | human | 149 (101–183) | 1:57 (1:14–2:29) | 81.1 % | 3.0 % | 2:44 (2:37–2:55) | 97.0 % · 0.0 % · 3.0 % · 0.1 % | 1.7 % · 0.02 | 2.1 s | 0.1 % | 0.81 |

THE STALLER: 2,000 of 2,000 at 19.0 s (unchanged). (solo great: 3 of 2,000 runs still falling at floor 600 — F1: 24.)
- **What the shatter rule moved (F1 → F2):** SLOPPY 47 (20–77) → **62 (40–94)** — the rule saves 52 % of its runs at least once (0.74
  times a run); GOOD 134 → 136; HUMAN-PACED 149 → 149; GREAT in a match: unchanged to the digit (76.2 % home at 2:32). **SLOPPY is now
  over the owner's 20–50 band** — floors 0–199 were not to be touched, so it is named, not tuned (OPEN FOR BEN).
- **THE TRENCH's new numbers (solo, the GREAT bot — the only one that lives there; 2,000 seeds):** its run ends on floor 245 (168–355)
  — F1 247 (168–418): the deepest tenth 63 floors shallower, the runs still falling at floor 600 down from 1.2 % to 0.15 %. Against
  F2's own static layout (300 seeds, `tests/freefall-sim.test.mjs`): 77 trench floors a run with moving red · 106 without; floor 235
  (157–344) · 244 (157–394); 0 · 7 runs at floor 600. The bots keep off the slice a mover stands on and — the careful ones — the
  slice it is stepping to (`bot.js#planFlight`).
