# JAYWALK — PASS H6B: THE FINAL POLISH (Nov 17 2026)

The owner's decisions: `docs/games/plan.md` "JAYWALK (the owner, Nov 17 — DECIDED, H6B)". What it built, in full: `docs/jaywalk.md`
"THE FINAL POLISH". This page = the log: the groups, the named calls, THE MIX's table, BOTH fresh-eyes reviewers' reports VERBATIM,
what was done with each item, the checks, OPEN FOR BEN. **Everything is VIEW + SOUND (+ the lab's link): the rules, the proof, the
feats are untouched — REPLAY = LIVE stays green. No database rules change. No `/api` file. No boot JS file.**

## THE GROUPS
- **Step 0** (`f40811cb`): the decisions into `docs/games/plan.md`.
- **Group 0:** `scripts/lab-export.mjs` (224 marks — NO open FIX mark); the cloud run of `33702dc9`: tests green, harbor skipped (a
  game pass).
- **Group 1 — THE SKY BY NIGHT + THE LOOK SWITCH** (`ee834633`): 8 painted night skylines COPIED by
  `scripts/build-jaywalk-assets.py --only=skyline` (65–79 KB each; the originals only read), the same machinery as the day set;
  `skymarks.js` + the band's colour wash RETIRED; the lights + windows a landmark covers OFF (`skyline.js#SKY_OFF` — measured by the
  builder off the pictures, not typed in from the notes); night's own rest offset per area; THE LOOK SWITCH = a 1.5 s cross-fade of
  the whole band.
- **Group 2 — THE GATE SIGN, THE CHIPS, THE CARDS, THE LAB LINK** (`41acfb90`): the sign only on the approach; the compact chips;
  `?lane=N`; ONE countdown. **The two redone cards: nothing to rebuild** (below).
- **Group 3 — THE MOMENTS' FINISH** (`8679f8ae`): the solid UFO, the Blackbird's size + burners, the Mothership's port + the traffic
  stopping, DOWNTOWN's storefronts, + the inbox's 6:32 am add-on (THE TAIL LIGHT BAR).
- **Group 4 — THE SOUND MIX + THE CREDITS** (`2f0053bf`): NEW BEST = take B; the mix measured + set; the ducks; JAYWALK's Credits group.
- **Group 5 — THE FRESH-EYES REVIEW, TWICE** + its fix rounds (below). **Group 6 — the checks, the docs, the close.**

## THE NAMED CALLS (obvious / established-pattern — done, not asked)
1. **THE NIGHT CROP IS 84 ROWS HIGHER than H2's** (rows 204–636 of the 720). The prompt said "the same treatment as the day set";
   with the old night crop (the lower 60 %) the lighthouse's lamp + beam, downtown's spires, the control tower's cab and the cranes'
   tops were cut off at the band's top edge. The opening's `skyline-night.webp` is re-cut the same way (a gate's cross-fade must move
   nothing but the landmark): the night band now reads — the stars, the lane count in the sky, the city low, a strip of water, the
   sea wall. The poster keeps the rows it had.
2. **THE GATE SIGN hangs UNDER THE SEA WALL on the approach, not on the gate's crossbar.** 8–10 lanes out the gate itself is behind
   the skyline band and in the full far haze — a sign standing there cannot be read (measured: its foot at 17–22 % of the screen, the
   band's foot is at 24 %). The same painted board is drawn crisp over the far haze strip (the fogged far lanes — never one he is
   about to cross), up from 10 lanes out, gone 3 lanes from the gate; the gate's posts + crossbar come out of the haze under it.
3. **THE UFO is "smaller + higher" as far as the band allows:** 2.3 cells across (was 3.0) at 5.0 (was 4.7). At 6.2 the saucer was
   behind the skyline band whenever its ring was on screen (tried, shot, dropped).
4. **The kid goes INTO the saucer from below** (it is solid now: the hull closes over him as he rises through its middle, the hatch
   glowing under its belly) — not through a hatch drawn on its top, and not by standing the saucer on its edge to show its belly
   (from this camera the belly is only seen past a 50° tip).
5. **THE TWO REDONE CARDS — NOTHING REBUILT.** `Downloads\grok\jaywalk\cards\right-of-way.png` + `mothership.png` are dated Nov 17
   1:58 am and are **byte-identical** (SHA-256 `2f959e58…` / `6b5c8d9f…`) to the copies H6A built from at 2:04 am; the builder re-run
   changes no file. No lab version was bumped — the owner's Nov 17 approvals of RIGHT OF WAY (v2) + BEAM ME UP stand. (If a later
   re-delivery was meant — the prompt says 6:18 am — it is not in the folder.)
6. **THE PER-GAME BUDGET HELD (2,448 / 2,450 KB — not raised)** by shortening the header comments of `night.js` + `view.js` to
   pointers at `docs/jaywalk.md` (6 KB of prose the doc already holds) and by keeping every new piece on demand (`flyers.js`,
   `shops.js`) or in css. `skymarks.js` was already out of the eager graph: its removal freed no budget.
7. **A site-wide two-word css fix:** `.cr-by` / `.cr-lic` (`css/components.css`) now wrap a long address — a required CC BY credit
   line was cut off at the Credits sheet's edge (every game's long lines were).
8. **The chips' look in 3 areas with 8 players is shot in the lab with the game's own markup + css** (the real view's chips are shot
   by the 3- and 4-phone match checks); an 8-phone match to the Mothership was not run (the checks drive 3 and 4 real phones; the
   8-kid scene is the lab's measure, as in H5C / H6A).

## THE MIX — the table (`node tests/integration/jaywalk-mix.mjs "<chromium>" --md`, Chromium's OfflineAudioContext, 48 kHz)
Integrated loudness (ITU-R BS.1770 K-weighting, 400 ms blocks, gated) + the loudest 0.4 s + the sample peak, AT THE SFX BUS'S DOOR
(after the cue's gain → THE SOFT LIMITER → the trim; the city's sounds: after their gain). "out" = at the default Effects slider
(− 6.2 dB); the music at its default sits at ≈ − 34 LUFS out. **22 cues — none clips.**

MIX_TABLE

Before this pass (the same measure): train-bell − 11.2 LUFS into the bus · train-horn − 9.9 · area-arrive − 9.9 (against the hop's
− 28.4, the hit's − 26): 10–17 dB hot. The music ducks: the Blackbird's pass 0.45 · the abduction 0.4 · the Mothership 0.62 → 0.3 ·
the train 0.72 (as it was). **Nobody has heard it on a phone's speaker: the numbers are the engine's.**

REVIEWS

## THE CHECKS (the mini PC, my own fresh emulators + `serve.mjs --emu`)
CHECKS

## REAL vs PLACEHOLDER
**No placeholder is left in the game.** What still waits is not H6B's: the owner's ear on the mix; the audition's `-b` backups of
the hop / the landing / the train pass (he picked all A); `tuning.js` + `CLOCK` (first-pass feel); the daily; the go-live flip.

## THE CARDS TO RE-APPROVE
**None.** (Named call 5: the two pictures are the ones already built + approved.)

## OPEN FOR BEN
OPEN
