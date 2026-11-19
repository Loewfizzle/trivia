# HIGH RISE — S1: THE RULES (Nov 18 2026 — on the Beelink; engine + replay + server judge + bot sims + the lab)

The owner's decisions: `docs/games/plan.md` "HIGH RISE — S1 (approved Nov 18)". The game's page: `docs/highrise.md`. HIGH RISE is a NEW
mini game (id `highrise`, was STACK); JAYWALK is its benchmark + engine formula. **Nothing is registered** — no GAMES entry, no
`config.js` change, no boot / cartridge change, no `/api` endpoint wiring, **no rules change (nothing to re-publish)**. HIGH RISE stays
invisible to players; the one new address is the unlisted lab: **https://neonspeakeasy.com/highrise-lab**.

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| Step 0 | 29fd741c | the owner's approved plan in `docs/games/plan.md`; `lab-export.mjs https://www.neonspeakeasy.com`: 224 marks, **no open FIX**. The inbox: no entry for this pass (re-read after every group — none arrived) |
| 1 — THE ENGINE | 5248caef | `js/games/highrise/` tuning · engine · logic · replay · bot; `tests/highrise-engine.test.mjs` (19 → 20 after the review) |
| 2 — THE JUDGE | b9c3f39d | `api/_lib/highrise.js` (pure, the same modules, not an endpoint, not wired); `tests/highrise-server.test.mjs` (5) |
| 3 — THE SIMS + THE TUNING | 93bbd8cc | `scripts/highrise-sim.mjs`; `tests/highrise-sim.test.mjs` (4 — the fast bands); the speed curve tuned |
| 4 — THE LAB | 9ad29785 | `highrise-lab.html` · `lab.js` · `graybox.js` · `css/highrise.css`; `tests/highrise-lab.test.mjs` (5 → 6) + `tests/integration/highrise-lab.mjs` (40 → 45); THE PAGES LOAD + `serve.mjs` know the page |
| 5 — THE DOCS + THE FRESH-EYES REVIEW | (this pass's close) | `docs/highrise.md`, this log, ROADMAP, CLAUDE.md (2 lines), `docs/testing.md`; the reviewer's findings fixed (below) — `tower.js` + the engine's `land` event |

## WHAT WAS BUILT
- **THE ENGINE** (pure, integers only, event-driven): `createRun` · `stepTo(run, tick)` · `tap(run, tick)` · `slabAt` · `resultOf` + the
  events for a view + `flyerFor(seed)` / `paletteFor(seed, floor)`. Every rule of the plan has a hand-built test: the perfect snap, the
  cut, grow-back + its cap, too thin, a miss, THE FUSE = TOO SLOW, the finish = MADE IT, the cap, the alternating axes, the seeded
  ends, the wobble in its band, integer-only state, the same log twice = the same run (in jumps AND tick by tick).
- **THE JUDGE**: `judgeRun({ seed, mode, taps })` — the cheap bounds, then the replay through the engine's own `tap()`; ten named
  refusals (`docs/highrise.md` "THE JUDGE"). The server half imports the phone's modules; the judge == the live engine for 500 bot runs.
- **THE SIMS**: four Gaussian-timing bots; the table below; the curve tuned to the targets.
- **THE LAB**: the graybox on the diagonal camera, fair taps, the plain-text HUD, REPLAY = LIVE ✓ after every run, and it NEVER COUNTS.

## THE TUNING — every number changed (from → to, why)
| number | the owner's start | final | why |
| --- | --- | --- | --- |
| `SWEEP` at floor 1 | 96 ticks | **140** | at 96 the sloppy bot (σ 60 ms) lasted 0:19 and the good one 0:51 — the targets are 30–60 s and 2–3 min. A slower start = fewer units of error per ms AND more seconds per floor |
| `SWEEP` by floor 120 (then held) | 45 ticks | **84** | at 45 the near-perfect bot reached floor 200 in 2:21 (target ≈ 3:30) with only 82 % of its runs; at 84 it is home in 3:28, every run — and a pass keeps 2–3 PERFECT ticks (33–50 ms) instead of 1–2 |
| the PERFECT window (500) | 500 | 500 | not needed |
| GROW-BACK (400 after 6) | 400 | 400 | not needed |
| the wobble | "± a few ticks" | ±3 | the builder's pick, clamped to the curve's band [84, 140] |

With the starting numbers (2,000 seeds, solo): sloppy 0:19 · casual 0:29 · good 0:51 · near-perfect on floor 200 at 2:21, 81.7 % of runs.
Candidates tried (600 seeds): 132 → 80 (good 2:03 — the low edge) · 150 → 84 (sloppy 0:46, good 2:30, floor 200 at 3:33) · 140 → 90
(good 2:34, floor 200 at 3:35) · **140 → 84 chosen** — every target near the middle of its band, floor 200 at 3:28 (the plan's ≈ 3:30).

## THE SIM TABLE (final — `node scripts/highrise-sim.mjs 2000`)
| mode | bot | σ ms | time med (p10–p90) | floor med (p10–p90) | ≥ 60 | ≥ 200 | to floor 200 med (p10–p90) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| solo | sloppy | 60 | 0:41 (0:31–0:52) | 30 (23–39) | 0.0 % | 0.0 % | — |
| solo | casual | 40 | 1:10 (0:56–1:27) | 55 (43–70) | 33.4 % | 0.0 % | — |
| solo | good | 25 | 2:20 (1:59–2:45) | 124 (102–152) | 100.0 % | 0.1 % | 3:28 (3:27–3:28) |
| solo | near-perfect | 10 | never out (all 2,000 stopped at floor 1200, 18:35) | 1200 | 100.0 % | 100.0 % | 3:28 (3:28–3:28) |
| match | sloppy | 60 | 0:41 (0:31–0:52) | 30 (23–39) | 0.0 % | 0.0 % | — |
| match | casual | 40 | 1:10 (0:56–1:27) | 55 (43–70) | 33.4 % | 0.0 % | — |
| match | good | 25 | 2:20 (1:59–2:45) | 124 (102–152) | 100.0 % | 0.1 % | 3:28 (3:27–3:28) |
| match | near-perfect | 10 | 3:28 (3:28–3:28) | 200 (200–200) | 100.0 % | 100.0 % | 3:28 (3:28–3:28) |

Targets: sloppy median 30–60 s ✓ (0:41) · good 2–3 min ✓ (2:20) · near-perfect on floor 200 in ≈ 3:00–4:00, most runs ✓ (3:28, all) ·
casual between ✓ (1:10).

## THE CALLS MADE (obvious / established pattern — named, the owner may overrule)
- The travel is centred on THE TOP SLAB (the plan: "around the tower centre") — "dead on" is always half a sweep after a slab enters.
- With the travel at ±1.5 widths THE FUSE's slab is fully off the tower when it drops: the fuse is ALWAYS a miss = TOO SLOW. The code is
  still the one generic drop (a fuse drop that lands would simply land) — as the plan words it.
- The base "lands" at tick 0: the first slab enters at tick 12 (a landing beat before it). A tap AT the fuse's / the cap's tick is too late.
- Grow-back is centred on the slab (half each side). A missed / slipped slab is not a floor; the ranking's tick = when the last floor landed.
- The cap's end words: **TIME'S UP** (the plan names the other four).
- A touch's time → the NEAREST tick. `?seed=` keeps the same slabs on every retry.
- The lab's test is split JAYWALK's way: the static half is the unit test (`tests/highrise-lab.test.mjs` — THE UNIT JOB INSTALLS
  NOTHING), the browser half is `tests/integration/highrise-lab.mjs` (outside the sandbox).
- The lab's imports are all STATIC (no skew wrapper: its deploy check is a `/api/time` call — the lab makes none); no web font; the CSS
  prefix is `hi-` (`hr-` is the harbor remote's).
- `MAX_TAPS` 20000 (an endless run that tall is 4 h+); `paletteFor` walks 24 colours, one step a floor.

## THE LOOK REVIEW (the lab at 390 × 844 · 375 × 667 · 1440 × 900 — `Downloads\NEON\highrise-s1\`)
- Refine 1: a tap flashed the WHOLE SCREEN blue (the browser's tap highlight on the play area) → `-webkit-tap-highlight-color:
  transparent`; a tower of perfects read as one block → every other slab a touch lighter; the end's second line wrapped badly → FLOOR on
  its own line.
- Refine 2 (the reviewer's notes): the start + the end's words moved UP into the free band between the HUD and the top slab (they sat on the
  action: the missed slab fell behind them); the PERFECT flash = the whole top face + thicker bars (a thin outline was ~1.6:1 on a light
  slab); the slabs darker mid grays, every other one clearly lighter (floors read; the pale sliding slab + the flash stand out); a shot WITH
  the sliding slab (`lab-390x844-slide.png`) and of the longest end states (`-made.png`, `-timesup-bad.png` — they fit).

## THE FRESH-EYES REVIEW (a subagent that did not build the pass — read-only, its own probe scripts)
**Its headline: it could not break determinism or the judge's verdict.** Checked and found sound: FAIR TAPS (7,200 fuzzed live sessions
with stalls, ~42,000 taps earlier than the stepped tick, out-of-order touches, the lab's cap grace — zero live ≠ replay) · every
off-by-one (402,300 single-tap cases round the beat, the fuse, the cap: the live `tap()` accepts exactly when the judge does) · the
integer maths (`slideOff` == exact BigInt arithmetic for every sweep + tick; no −0) · ~45 hostile inputs to `judgeRun` (none throws) ·
4,000 mutated honest logs (every `ok` re-accepted tap by tap) · a 20,000-tap log judged in < 20 ms · the lab's static graph (clean).

| # | its finding | what was done |
| --- | --- | --- |
| 1 | BUG (view only): the graybox landed its slab at the END of an event batch — a batch with two drops (two touches inside a long frame; a tap + the fuse behind a hidden tab) lost a slab; the picture stayed wrong until the next run (the engine + the replay were right) | FIXED at the root: the engine emits its own `land { floor, x0, x1, z0, z1 }` event; the tower a view draws moved to the PURE `tower.js`, which lays the slab where `land` says. A unit test feeds 40 bot runs in four batchings (one batch · one event at a time · random chunks · split after every drop) + the review's two repros: the view's tower == the engine's |
| 2 | BUG (robustness): `judgePacked(null)` threw; `unpackTaps` ran its regex on unbounded input (a 6.4 MB string overflowed the stack) and accepted non-canonical parts | FIXED: both entries take any input without throwing; a string longer than any log packs to is refused unread; canonical only (`packTaps(unpackTaps(s)) === s`) |
| 3 | RISK: the mode tabs were live during a run, in the thumb zone — a touch there threw the run away | FIXED: the mode switch + the seed are off the screen while a run is live (a thumb at the foot is a DROP) and back with the end's words; the browser check taps the foot every other drop |
| 4 | RISK (S2's wiring): a missing `mode` was quietly judged as solo; an empty log is `ok`; nothing ties ticks to the server's clock | `mode` is now REQUIRED (`why: 'mode'`); the other two are S2's — written into `docs/highrise.md` "FOR S2" |
| 5 | NIT: PERFECT is tested before "no overlap" — a slab cut to exactly 500, dropped exactly 500 off, snaps on | KEPT (the plan's own order: PERFECT first) + PINNED by a test; named below |
| 6 | NIT: `stepTo(NaN)` ran the fuse; `stepTo(12.5)` put a float in the state; `replay({ until: NaN })` ended the run | FIXED: a tick that is not a whole number moves nothing; a bad `until` counts nothing |
| 7 | NIT (the claim's precision): on a phone the site's service worker already controls, `sw.js` itself asks `/api/time` at a navigation to the lab (ONE DEPLOY AT A TIME — the same for /jaywalk-lab) | NOT the page's code, read-only, nothing of the run in it — said plainly in `docs/highrise.md` "THE LAB"; `sw.js` untouched (no boot change in this pass). Named below |
| 8 | NITS (the shots): the panels hid the action · no shot showed the sliding slab · the longest end states unshot · the flash weak on light slabs · floors barely separate | all five done — THE LOOK REVIEW, refine 2 |
| 9 | NITS: the `?fps=1` line froze after ~5.5 min · a clicked tab kept the keyboard (Space restarted instead of dropping) · the 350 ms retry guard was short | FIXED: its own frame counter · the tab blurs · 600 ms |
| 10 | NIT: the wobble's clamp is one-sided at the band's edges (past floor 120: 84 … 87, never 81 … 83) | KEPT — the plan: "never leaves the curve's band"; the sims measure it as it is |
| 11 | NIT: a seed could hold NUL / lone surrogates / astral characters | FIXED: 1 … 64 printable ASCII, no space |
| 12 | NIT: a tap between the real fuse and the cheap 292-tick bound is refused as `past the end`, not `after the fuse` | KEPT — the verdict is right; the doc's table says which name means what |

## THE FINAL RUN (the Beelink, this pass's OWN fresh emulators + `serve.mjs --emu`, nothing else busy)
- unit `node --test tests/*.test.mjs`: **2,291 / 2,291** (was 2,256 — + 35 HIGH RISE: engine 20 · server 5 · sim 4 · lab 6) — the CLAUDE.md
  size test (33,044 B of 40 KB), the boot-budget test (`boot-budget.json` + `game-budget.json` unchanged: HIGH RISE adds nothing to the
  boot), the doc links, the file hashes, parse-all, unit-imports all green
- `/api` (`server.test.mjs`): **66 / 66** · the rules tests: not run — NO rules change
- `tests/integration/highrise-lab.mjs`: **45 / 45** (Chromium, 390 × 844 @3 + 375 × 667 + 1440 × 900 — the shots in `Downloads\NEON\highrise-s1\`)
- THE PAGES LOAD (`kit/page-loads.mjs`): **14 / 14** — the seven pages incl. /highrise-lab, Chromium + WebKit
- `node scripts/highrise-sim.mjs 2000`: the table above, unchanged by the review's fixes
- the servers this pass started (the emulators + `serve.mjs --emu` on :5173) STOPPED at its end; the owner's :5190 preview server untouched

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules change).
2. **YOUR PHONE CHECK:** https://neonspeakeasy.com/highrise-lab on the iPhone — play a few runs: REPLAY = LIVE ✓ under every end, and how the
   speed FEELS (the sims set 140 → 84 ticks a sweep; your starting 96 → 45 was 2–3× too hard for the targets).
3. **SOLO PAST FLOOR 200:** the speed is held from floor 120, so a 10-ms-accurate bot NEVER falls (all 2,000 were stopped at floor 1200).
   Should the endless curve keep tightening past floor 200 (only SOLO would change)? Yours — the plan says "→ held".
4. **TWO CLEAN FINISHERS IN A MATCH:** every clean run reaches floor 200 at 3:28 ± 1 s (the curve sets the pace), so "the earlier tick"
   between two finishers is decided by a few ticks — who tapped a hair early each floor. Fine as the tie-break, or should S4 rank
   finishers another way (e.g. perfects first)? S4's call.
5. **HIDING THE APP ENDS A RUN** (the run is on the clock; the fuse drops the slab) — fine for the lab; a decision for S2's solo game +
   S5's daily (JAYWALK's daily: "no pauses").
6. Named calls, yours to overrule: the cap's words **TIME'S UP** · the travel centred on the top slab (so THE FUSE is always a miss =
   TOO SLOW) · PERFECT judged before "no overlap" · the wobble ±3 clamped to the band · the lab's mode switch hidden during a run ·
   the lab's test split into a unit half + a browser half.
