# JAYWALK J1 — SPLITS · THE MATCH MOMENTS · THE NIGHT GLOW FIX (+ the city's END-SCREEN HEADER) — Nov 21, 2026

**RE-PUBLISH: nothing** — no rules change (no new node a phone writes; the best splits are server-written inside `pstats`).
Built on THE PROOF WRITER (`kit/proof-writer.js` + `proof-io.js`) and THE CONSOLE FIX (`view.js#holdsRun` / `runLive`) — neither touched.
The detail lives in `docs/jaywalk.md` "J1"; the owner's decisions in `docs/games/plan.md` "JAYWALK J1".

## STEP 0
`docs/games/plan.md` "JAYWALK J1" (9a799e1d). The lab export at the start: 224 marks, no open FIX. The inbox: no open entry for this pass
(the Nov 19 flyers.js gate was closed by CITY PART 1; the lab's "zero server calls" doc line stays the owner's call — OPEN FOR BEN).

## GROUP 1 — THE NIGHT GLOW FIX (6f152c0d)
The bloom drew the lights (layer 1) alone, so a box truck's trailer looked see-through at night. Now `night-fx.js#createBloom` draws the
SOLID scene first into its target as flat black depth (`OCC_LAYER` — every opaque instanced kind but the tufts: vehicles, trains, trees,
posts, barricades, logs, the areas' props, shops, the kid), then the lights depth-tested against it. ONE shared override material `OCC_MAT`
(black, no fog, both faces, a hair of polygon offset), warmed with the rest (the warm frame renders the bloom). Tier 2 night only.
- **Test:** `tests/integration/jaywalk-bloom.mjs` — a light behind K.trucks' own geometry: **9,180 → 0** on the target; a light beside it
  and the near-face marker (z + 0.4 — the side facing the camera) unchanged (10,200 / 10,710 both ways).
- **Frame rate, 4× CPU, tier 2 by night** (`jaywalk-lab.mjs --bloom-ab`; before = `&occ=0`):

  | | before | after |
  | --- | --- | --- |
  | 390 a run | 59.4 fps · worst 83.2 ms · 33 calls | 59.9 fps · worst 33.3 ms · 55 calls |
  | 390 DOWNTOWN | 60 · 17 · 35 | 60 · 17 · 58 |
  | 430 a run | 59.9 · 33.2 · 33 | 59.8 · 33.3 · 53 |
  | 430 DOWNTOWN | 60 · 17 · 35 | 60 · 17 · 58 |

  `--perf` 127 / 127 green (every area, both looks, both tiers ≥ 59.7 fps; the 8-kid tier-2 frame 63 draw calls — the ≤ 64 line holds).
- **Shots:** `Downloads\NEON\jaywalk-j1\glow-before-after-390.png` (the SAME frozen night frame, `--glow`): the UFO beam's haze and the
  lights behind the trailers no longer bloom over the box trucks. Honest note: the sweep found trucks in front of lane lights, the UFO, cars;
  a truck exactly in front of a street lamp / a train was not staged on its own.

## GROUP 2 — SPLIT TIMES (3a9c0d8c)
The engine's `run.sp` (the tick each 50 lanes is first landed on) → THE JUDGE's / the server's / the daily try's rows (`sp`) → the server's
best splits (`pstats.jsp`, `core/splits.js#splitBests` — counted results only, through `matchStep` for solo + match and `creditTry` for the
daily) → the answer `{ r, b, n }` → THE END CARD's YOUR SPLITS (`splits-card.js` — solo, match, the local end, the daily, the lab's end).
Boxes at once from the phone's own engine; NEW BEST + the gain only from the server; its numbers win. Shots at 390 / 402 / 430 / 375 / 1440,
night + day: `Downloads\NEON\jaywalk-j1\splits\` (sheet `splits-sheet.png`) — refine 1: the NEW BEST box grew wider than the rest and the
fourth box fell off a 390 screen → the gain on its own line, 78 px boxes: four in one row at 390; refine 2: the day look + a 9-split row
(it scrolls, snapping).
- **Tests:** `tests/jaywalk-splits.test.mjs` (10) — the engine = the lanes' own first ticks; phone = host = server for solo
  (`jaywalkSolo`), a 3-player match (`jaywalkMatch`) and the daily (`scoreTry`); none under 50; a refused log records nothing; a first reach
  = the best, never NEW BEST; only faster is new; the daily never commits a null into pstats. `e2e-jaywalk.mjs` checks the real end card.

## GROUP 3 — THE MATCH MOMENTS (3a9c0d8c, the overlap fix 10113ab7)
`moments.js` (PURE: every out = that player's OWN end — `e` / this phone's engine — never the host's; THE MOTHERSHIP is no out; a rejoin =
a baseline) + `moments-view.js` + `view.js#pumpMoments`: the bigger order list (22 pt, a red X + struck name), the OUT banner (merging,
the sound once), the red X where the ghost fell, HEAD TO HEAD + the siren ONCE when 3+ narrows to two (the edge pulse, one flash, then THE
DUEL STRIP), a 2-player match: the strip from GO and never a siren, LAST ONE STANDING for the survivor.
- Refine 1 (the 2-phone shot): LAST ONE STANDING landed ON the OUT banner when both fired together → the big words sit under the banner's band
  (top + 160 px). Refine 2 (the 3-phone shots): HEAD TO HEAD → the strip, the red X at the water's edge, LAST ONE STANDING — all in the top
  band, the lanes' middle clear (`Downloads\NEON\jaywalk-j1\moments-sheet.png`).
- **The sounds** (original, CC0 1.0 Ben; `scripts/build-jaywalk-sounds.mjs` — mono MP3, the pure-JS encoder outside the repo):
  out-drop 8.3 KB · h2h-siren 59.1 KB · last-standing 18.7 KB, fetched for a MATCH only. **THE MIX** (`jaywalk-mix.mjs`, now a guard):

  | cue | gain | into the SFX bus (LUFS · loudest 0.4 s · peak dBFS) |
  | --- | --- | --- |
  | out-drop | 0.28 | −27 · −24.7 · −19.8 (your own hit: −26) |
  | h2h-siren | 0.19 | −30.9 · −27.7 · −22.7 (bell −21 / −20.9 · train horn −19 / −16.6 · car horn −27.1 / −25.1 · truck horn −27.1 / −24.7) |
  | last-standing | 0.6 | −20.4 · −17.5 · −11.4 |

  Music off (podcast mode): 15 of 15 JAYWALK sounds start (`jaywalk-podcast.mjs`).
- **Tests:** `tests/jaywalk-moments.test.mjs` (9) · `e2e-jaywalk-match.mjs` (3 phones: the banner once on every other phone, never on the
  out phone; HEAD TO HEAD + the siren once on every phone; the strip live; LAST ONE STANDING once for ALICE; the host's END GAME never names a
  player without his own end) · `--two` (the strip from GO, a refresh mid-duel redraws it with nothing replayed, LAST ONE STANDING, no siren
  ever) · `--four` (4 → 3 → 2: HEAD TO HEAD only at two).

## GROUP 4 — THE END-SCREEN HEADER (10113ab7)
`metas.js` NEON `modes` (PRISM DROP, HOLD'EM) → `fin-neon.js#endMode` → the console frame's header: PRISM DROP · SCORE RUSH / BATTLE /
SURVIVAL, HOLD'EM · CASH / TOURNAMENT; JAYWALK, HIGH RISE, OVERCLOCK keep SOLO / MATCH. One line at 375 × 667 (fitHeader). Before / after:
`Downloads\NEON\jaywalk-j1\header-before-after-375.png`. Marked DONE for the city in the inbox. Test: `tests/city-part2-endneon.test.mjs`.

## SIZE (never raised)
JAYWALK alone 38 modules / 434 KB → **42 / 459 KB**; its per-game line (the city's boot graph + the cartridge) **2,520 KB / 163 modules** of
2,600 / 165 (the line since THE PROOF PASS's named raise; the prompt's "2,450" was the line before it). The match sounds are not in the line
(audio) and a solo run never fetches them.

## OPEN FOR BEN
1. The lab's "ZERO SERVER CALLS" line (the inbox, Nov 19 12:55 am (2)): the shared audio engine counts a leave once from any phone — give the
   lab HIGH RISE's DOOR, or correct the doc line? (unchanged — yours).
2. Named calls (overrule any): a split reached for the FIRST time is your best, never NEW BEST · the OUT banner never shows on the out phone
   itself (its OUT card says it) · HEAD TO HEAD + the siren play on every phone in the match, watchers too · LAST ONE STANDING only on the
   survivor's phone; behind the farthest out it reads "12 LANES TO THE LEAD · KEEP GOING" · the duel strip's leader = a small white triangle ·
   the big moments sit just under the banner's band (≈ 160 px from the top at 390 × 844).
