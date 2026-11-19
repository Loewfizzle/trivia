# HIGH RISE — S2: THE NIGHT LOOK + SOLO (Nov 18–19 2026 — on the Beelink; the real game on an unlisted test page)

The owner's decisions: `docs/games/plan.md` "HIGH RISE — S2". The game's page: `docs/highrise.md`. **THE S2 PROMPT NEVER REACHED THIS
PASS** — the owner pasted his PLAN into Claude Code (Nov 18, 10:35 pm; its status line read "S2 PROMPT GIVEN"), nothing else came, the
inbox held no S2 entry and no other session was building it: the pass was BUILT FROM THE PLAN (its S2 row + its sections). Anything the
prompt held that the plan does not is not here (OPEN FOR BEN 3).

**Nothing is registered** — no GAMES entry, no `config.js` / boot / cartridge change, no `/api` wiring, **no rules-file change (nothing
to re-publish)**. HIGH RISE stays invisible to players. The new address, UNLISTED: **https://neonspeakeasy.com/highrise-play** —
**NOTHING COUNTS UNTIL GO-LIVE**.

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| Step 0 | 86019e5f | the owner's S2 plan in `docs/games/plan.md`; `lab-export.mjs https://www.neonspeakeasy.com`: 224 marks, **no open FIX**; the inbox: no entry for this pass (re-read after every group — none arrived). S1's OPEN FOR BEN 3–5 are answered by the plan |
| 1 — THE RULES | 0e1951c7 | SOLO PAST 200 KEEPS TIGHTENING (`tuning.js#TIGHT`) · THE RANKING by perfects (`logic.js`) · the sims; engine 21 · sim 5 |
| 2 — THE ASSETS | 4a05fd9b | `scripts/build-highrise-assets.py`: the five night plates, the reflection map, the ten sound files |
| 3–6 — THE TEST PAGE | d804be1a | `/highrise-play`: the night look, the height areas, the HUD, YOUR BEST, the sounds + the audition, tiers, the warm frame, the lost context, THE DOOR; `tests/highrise-play.test.mjs` (11) + `tests/integration/highrise-play.mjs` (70 → 86 with the review) |
| 7 — THE CLOSE | (this pass's close) | the look review's refines, the WebKit run, THE FRESH-EYES REVIEW's fixes, the docs |

## WHAT WAS BUILT (the detail: `docs/highrise.md` — "THE TEST PAGE" · "THE NIGHT LOOK" · "THE HEIGHT AREAS" · "THE LINES" · "THE SOUNDS" · "THE ASSETS")
- **THE RULES:** past floor 200 the sweep loses 3 ticks every 10 floors, never under 24 — SOLO only by construction (a match / a
  daily ends ON floor 200); the ranking = the floor → the most perfects → the earlier tick; `perfectsLine` for the podium.
- **THE TEST PAGE** (`highrise-play.html` + `play.js`): SOLO, unlisted, open; the run loop on the pure engine (fair taps, no pause),
  the HUD, the start sign, the end card, REPLAY = LIVE ✓ under every end, THE DOOR (zero server calls), the lost-context rebuild.
- **THE NIGHT LOOK** (`night.js` + `night-fx.js`): the glass tower in ONE instanced mesh, the cut + GPU sparks, the perfect's ring,
  grow-back, the plates, the reflection map, the bloom, the tiers, the warm frame.
- **THE HEIGHT AREAS** (`bands.js`), **YOUR BEST** (`best.js`), **THE SOUNDS + THE AUDITION** (`sounds.js` · `sfx.js` · `audition.js`).

## THE TUNING — SOLO PAST 200 (the owner's target: "even a near-perfect player falls — ≈ floors 300–400, 6–7 min")
Up to floor 200 nothing changed (S1's table; MATCH + DAILY pinned tick for tick by digests of S1's runs — four bots × 60 seeds a mode,
taken on `ae444bf3` before the change). Candidates, 400 seeds each, the near-perfect bot (σ 10 ms) — "every 10 floors" is the owner's:

| past floor 200 | σ 10 falls on floor (p10–p90) | at | σ 7 | σ 5 (a machine) | σ 15 |
| --- | --- | --- | --- | --- | --- |
| −1 a notch, ≥ 30 | 589 (540–640) | 8:17 | 853 | never out | 420 |
| −2 a notch, ≥ 30 | 455 (418–489) | 6:25 | 601 | never out | 343 |
| **−3 a notch, ≥ 24 (chosen)** | **383 (360–400)** | **5:33** | 418 | 447 at 5:59 | 315 at 4:57 |
| −3 a notch, ≥ 30 | 383 (360–411) | 5:34 | 499 | never out | 315 |
| −4 a notch, ≥ 30 | 354 (335–383) | 5:10 | 471 | never out | 295 |

- **−3 every 10 floors**: the fall lands INSIDE the owner's floor band (383). The time is 5:33 — half a minute short of "6–7 min":
  the two halves of the target do not meet (at the game's pace floor 400 comes at ≈ 5:50). −2 gives the time (6:25) but floor 455.
  The floor won (the height is what a player sees); the other is one number away (`TIGHT.by`) — OPEN FOR BEN 4.
- **the floor of the tightening = 24 ticks, not 30**: under 30 ticks an ODD sweep has no tick inside the perfect window (the slab is
  never closer than 30000 / (2 S) = 517–600 units; the window is 500) — a cut on every such floor whoever taps. With ≥ 30 a 5-ms
  machine never fell (all 400 stopped at floor 3000); with ≥ 24 it is out by floor ≈ 450. Nobody climbs for ever.
- The final table (2,000 seeds a bot): `docs/highrise.md` "THE SIMS" — the only row that moved is solo near-perfect (never out → 5:33, floor 383).

## THE SOUNDS — THE FIRST MIX (each file's loudest 200 ms, measured; the gain sets its place)
| sound | file | loudest 200 ms | gain | → in play |
| --- | --- | --- | --- | --- |
| drop | drop.wav (0.39 s) | −23.5 dB | 1.5 | −20 dB (heard on every floor: modest) |
| perfect (the chime) | perfect.wav (1.00 s) | −15.8 dB | 0.7 | −19 dB |
| slice A / B | slice.wav (0.37 s) / slice-b.wav (0.19 s) | −21.4 / −26.9 dB | 1.18 / 2.2 | −20 dB |
| falling-piece | falling-piece.wav (0.78 s) | −13.9 dB | 0.32 | −24 dB (behind the slice) |
| grow-back | grow-back.wav (0.56 s) | −12.0 dB | 0.4 | −20 dB |
| streak | streak.wav (1.20 s) | −14.8 dB | 0.78 | −17 dB |
| out | out.wav (1.39 s) | −21.4 dB | 2.1 | −15 dB (the run's end: the loudest) |
| band-arrival | band-arrival.wav (1.14 s) | −12.5 dB | 0.53 | −18 dB |
| pass (S4) | pass.wav (0.33 s) | −14.3 dB | 0.65 | −18 dB |
THE CHIME's two takes are in-code: the crystal bell rings at 2,469 Hz — climbing 16 semitones from there tops out at 6.2 kHz (shrill),
so A starts an octave down (1,235 Hz → 3,111 Hz at the top) and B a fifth down (1,648 Hz → 4,152 Hz). The owner picks in the audition.

## THE LOOK REVIEW (`node tests/integration/highrise-play.mjs "<chromium>" <out> --look` → `Downloads\NEON\highrise-s2\` — 390 × 844 @3 · 375 × 667 · 430 × 932 · 1440 × 900; + WebKit as an iPhone)
- **First shots:** the glass read PALE — the reflection map's lights (HDR, undone in the shader) washed the side faces white and the
  building under the first slab was ONE striped box that grew brighter toward the foot; **the sparks were invisible** (the streak quad
  was wound backwards — culled); the edges were nearly white.
- **Refine 1:** the reflection held in (capped, half-tinted by the glass, a fifth of its strength), the body darker + more saturated,
  the edges in the slab's own colour with a white-hot core; THE BUILDING = real floors, each its own colour (the mock-up's tower from
  the first second); the sparks' winding fixed. Then: the tower dims further under the top slab, finer + more sparks, the trail
  stronger, grow-back's ring smaller, and **a band's arrival no longer said twice** (its name sat right over the same words in the
  announcer lane) — the name under the number swells + lights up instead.
- **Refine 2:** YOUR BEST shot on its own — the right-edge tag ("BEST 9 ▲4"), the gold tape a second after its flash and a few floors
  on: it reads as a gold band round the tower, the floor number gold. The crossing's gold ring was a white-out with the perfect's
  ring on top of it: softened.
- **Refine 3 (WebKit, Playwright's, as an iPhone):** every shader builds (9 programs), the scene draws, real touches drop slabs,
  REPLAY = LIVE. Its shot caught the HUD still fading out UNDER the end card (a 0.25 s cross-over — "26" behind TOO SLOW): the HUD now
  leaves AT ONCE when the card comes.
- Every size: the end card's foot above the top slab; 1440 × 900 = the phone's own column, centred.

## THE MEASURE (`--perf` — the mini PC, 390 × 844 @3, the bot playing 10 s high in the clouds, a cut + its sparks every third drop)
| tier | cpu | fps | frame ms (p95 · worst) | calls | tris | size |
| --- | --- | --- | --- | --- | --- | --- |
| 2 (bloom) | 1× | 60.0 | 16.7 (17.3 · 17.9) | 10 | 1952 | 390×844 @3 |
| 2 (bloom) | 4× | 60.0 | 16.7 (16.8 · 17.0) | 10 | 1952 | 390×844 @3 |
| 1 | 1× | 60.0 | 16.7 (17.1 · 17.6) | 4 | 974 | 390×844 @2 |
| 1 | 4× | 60.0 | 16.7 (16.8 · 16.9) | 4 | 974 | 390×844 @2 |
| 0 | 1× | 60.0 | 16.7 (17.1 · 17.6) | 4 | 962 | 390×844 @1.5 |
| 0 | 4× | 60.0 | 16.7 (16.8 · 16.9) | 4 | 950 | 390×844 @1.5 |
A desktop GPU's numbers (the tiers are the phone's margin; the scene is ≈ 2,000 triangles — its cost on a phone is the fill of the
plate + the glass at DPR 3 and the bloom's passes, exactly what tiers 1 and 0 take away). The owner's iPhone: `?fps=1`.

## THE CALLS MADE (obvious / established pattern — named, the owner may overrule)
- **Built from the plan** (the prompt never arrived — above).
- **THE DOOR**: found while proving "zero server calls" — since CITY G the shared audio engine COUNTS a leave once from ANY phone
  (one anonymous beacon to `/api/log`, kind `snd`); the JAYWALK lab's "zero server calls" predates it. HIGH RISE's page stops every
  `/api/` request before it leaves the phone, in the page itself (no shared / boot file touched). JAYWALK's lab is as it was (not this
  pass's game — named for the JAYWALK chat: OPEN FOR BEN 6).
- The bands' names: THE ROOFTOPS · THE SKYLINE · THE CLOUDS · THE STARS · **DEEP SPACE** (from floor 170 — the plan's fifth plate; S3
  adds what lies past 200).
- The plates are drawn IN WebGL (a screen-filling quad), not as DOM pictures under a see-through canvas: the bloom + the glass blend
  over them in one picture. They cover the screen with 20 % of their height to drift through.
- THE BUILDING under the first slab = floors of the same glass (colours for the floors "below zero" from the same palette walk).
- The announcer lane in SOLO: PERFECT · PERFECT ×N · STREAK ×10 · NEW BEST · FASTER (each notch past 200). A band's arrival lights its
  name up (never said twice).
- NEW BEST's sound = the streak's sparkle a step higher (the delivery has no NEW BEST sound). The falling piece sounds 0.1 s after its slice.
- The tag on your best's own floor reads "BEST 57 · ONE MORE" (the next slab beats it); a first-ever run shows no tag and no tape.
- The end: TAP anywhere = PLAY AGAIN after 0.6 s (a stacker's loop is fast); the card comes 0.7 s after the end.
- REPLAY = LIVE ✓ stays on the end card, small (the owner's determinism check on a real iPhone, as in the labs) — to leave at go-live.
- `?mode=match|daily` on the page (no switch on screen): the pass's own check of the finish + the cap's clock.
- The sounds ship as 16-bit MONO WAV (no MP3 encoder on the build machine) — OPEN FOR BEN 5.
- The reflection map keeps only the HDRI's sky half, blurred: no person, no readable sign of the photo ships.
- `camera.js` holds the camera's numbers for the game; the lab's `graybox.js` keeps its own copy (its test pins its text) — a test pins the two equal.
- The browser check gained `--webkit` (Playwright's WebKit as an iPhone): the phones this game is for.

## THE FRESH-EYES REVIEW (a subagent that did not build the pass — read-only, its own probes in node + headless Chromium)
**Its headline: THE RULES ARE SOUND — it could not break them.** MATCH + DAILY vs S1, tick for tick: 18,000 bot runs (six σ × 1,500
seeds × 2 modes; 9,004 made it) — event streams, final states, tap logs, judge results: 0 differences; 600 second-pass tappers ended
by the cap: 0; 20,000 random / hostile logs through both judges: 0. REPLAY = LIVE past floor 200: 960 solo runs driven the PAGE's
way (jittered frames, long frames, fair taps before / after the frame) to floors 385–689: live ≠ judge 0 · honest logs refused 0 ·
the page's event check ≠ a fresh replay 0 · tower.js ≠ the engine 0. Nobody climbs for ever: a seed-knowing perfect machine ends on
floor 432–669 (5:55–7:30; the longest log 670 taps). The cheap bounds at a 25-tick sweep: no honest log refused, no dishonest one
credited. THE DOOR does not touch the sounds' own fetch; `BOXES` never overflows (54 of 55 at most).

**Every real defect was on the page / the view / the sounds — all 14 fixed, each with a check (`highrise-play.mjs --review`, 16):**
| # | its finding | what was done |
| --- | --- | --- |
| 1 | BUG: with the site's MUSIC OFF (CITY I's PODCAST MODE — the audio context naps between effects) the game was SILENT, the audition too: `sfx.js` refused a context that was not `running` | FIXED: it asks `isUnlocked()` (running or napping) — the source's own start wakes the context. Music off: 12 of 12 sounds start. **`js/games/jaywalk/sfx.js:83` has the same line** — not this pass's game: in the inbox for JAYWALK |
| 2 | BUG: THE END HOLD (0.7 s) never applied to a run a TAP ends (a miss, a slip — the usual end): the card came at once, over the falling slab | FIXED: the frame that first sees the run over sets the end's time, whoever ended it. A miss → the card 707 ms later |
| 3 | BUG (look): the end's title ran into the SOUNDS button on any viewport ≤ 740 px tall — every iPhone in a Safari TAB (390 × ~664), 375 × 667 (the look review shot full-screen sizes with the one short title) | FIXED: the card starts ≥ 58 px down (56 on a short screen); checked at 390 × 664 · 375 × 667 · 430 × 739 with MISSED THE STACK and at 375 × 667 with MADE IT TO THE MOTHERSHIP (a full 200-floor match run) — it still ends above the top slab |
| 4 | BUG (top players): YOUR BEST's tag jumped to the FOOT of its column when the best was > ~190 floors up (the point is behind the diagonal camera: projected, it comes back mirrored) | FIXED: the tag's height is clamped to 100 floors up. A best of 300 → the tag at the top of its column |
| 5 | RISK: on a WebGL 1 context the glass shader did not compile (`fwidth` without the derivatives extension): the WHOLE TOWER invisible | FIXED: `extensions: { derivatives: true }`. A WebGL 1 context: 9 programs, no shader error, the tower drawn |
| 6 | RISK: ONE failed rebuild after a lost context ended the page until a reload | FIXED: the line says so, the run goes on, the rebuild tries again (every 1.5 s × 8, + when the page is back in front); the scene returns by itself |
| 7 | NIT: FASTER was lost when its notch landed with a STREAK / NEW BEST call | FIXED: it waits its turn |
| 8 | NIT: a context lost on the END CARD moved the gold tape to the NEW best | FIXED: the tape keeps its own floor |
| 9 | NIT: Space / Enter were swallowed while the SOUNDS sheet was open (its × could not be keyed) | FIXED |
| 10 | NIT: a first run that never landed a slab printed "YOUR BEST 0" | FIXED: no line |
| 11 | NIT: PLAY AGAIN from high up started with no backdrop picture for a few frames (the first plates had been let go) | FIXED: the first band's plate is asked for again while the end card is up |
| 12 | NIT (a standing rule + a test that could not see it): `void el.offsetWidth` in the announcer + the band's arrival = forced layout reads INSIDE the frame, on every perfect | FIXED: Web Animations one-shots (no reflow); the test now forbids ANY layout read in `play.js` but `sized()`'s; the CSS keeps only its two breathing lines |
| 13 | NIT: the wobble's floor dropped to 24 at floor 201 (floors 201–209 wobbled down to 81) though the first notch is floor 210 | FIXED: floors 201–209 keep S1's band (84–87); the sims' table unchanged |
| 14 | NITS: a blocked storage forgot the best between runs of one visit · the test hook's list of ends grew without bound | FIXED: `Math.max(best, stored)` · the last 50 kept. (`window.__hiPlay` ships to everyone — fine while nothing counts; gate it before S4) |

## THE FINAL RUN (the Beelink, this pass's OWN servers — `serve.mjs` on :5173, the emulators + `serve.mjs --emu` on :5174 for THE PAGES LOAD — nothing else busy)
- unit `node --test tests/*.test.mjs`: **2,304 / 2,304** (was 2,291 — + 13: engine 21 · sim 5 · server 5 · lab 6 · play 11) — the
  CLAUDE.md size test (33,139 B of 40 KB), the boot budget (unchanged: HIGH RISE adds nothing to the boot), the doc links, the file
  hashes, parse-all, unit-imports all green
- `tests/integration/highrise-play.mjs`: **86 / 86** (Chromium, 390 × 844 @3 + the other sizes; the review's 16 inside) · `--perf`
  **12 / 12** (60.0 fps at every tier at 1× + 4× CPU) · `--webkit` **6 / 6** (Playwright's WebKit as an iPhone)
- `tests/integration/highrise-lab.mjs`: **45 / 45** (S1's lab, unchanged)
- THE PAGES LOAD (`kit/page-loads.mjs`): **16 / 16** — the eight pages incl. /highrise-play, Chromium + WebKit
- `node scripts/highrise-sim.mjs 2000`: the table in `docs/highrise.md`
- `/api` + the rules tests: not run — nothing under `/api` or the rules changed
- the servers this pass started (`serve.mjs` on :5173 + :5174, the emulators) STOPPED at its end; the owner's :5190 preview server untouched

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules-file change).
2. **YOUR PHONE CHECK:** https://neonspeakeasy.com/highrise-play — the look, the feel of a drop / a cut / a perfect, the speed past
   floor 200; REPLAY = LIVE ✓ under every end; `?fps=1` for the frame rate on your iPhone (the 60 fps above is the mini PC's).
   **SOUNDS** (top left, between runs) → THE AUDITION → pick A / B for drop · perfect · slice → COPY MY PICKS → paste the line.
3. **THE S2 PROMPT NEVER REACHED THE PASS** — you pasted the PLAN; it was built from the plan. If the prompt asked for anything the
   plan does not say, send it as an add-on (the inbox) — S3 picks it up.
4. **SOLO PAST 200 — the fall:** a near-perfect player now falls on floor ≈ 383 at 5:33 (−3 ticks every 10 floors). Your target read
   "≈ floors 300–400, 6–7 min" — the floor is in, the time is half a minute short (at the game's pace floor 400 comes at ≈ 5:50). −2 a
   notch gives 6:25 but floor ≈ 455. One number (`tuning.js#TIGHT.by`) — yours.
5. **THE SOUNDS SHIP AS WAV (633 KB)** — the build machine has no MP3 encoder (no ffmpeg / lame). With one (or the delivery as MP3)
   the set is ≈ 120 KB. Not urgent while the page is a test page; before go-live it should be MP3.
6. **FOR THE JAYWALK CHAT (found here, not touched — in the inbox):** (a) `js/games/jaywalk/sfx.js:83` refuses a napping audio context —
   JAYWALK is silent with the site's MUSIC OFF (PODCAST MODE), the same bug this pass fixed in HIGH RISE; (b) the JAYWALK lab's "ZERO
   server calls" is no longer exact: since CITY G the shared audio engine COUNTS a leave once from any phone (one anonymous beacon to
   `/api/log`). HIGH RISE's page stops it at THE DOOR; the lab does not.
7. Named calls, yours to overrule: the bands' names (DEEP SPACE from floor 170) · the announcer's calls in solo · NEW BEST's sound =
   the streak's sparkle a step higher · "BEST 57 · ONE MORE" on your best's own floor · TAP anywhere = PLAY AGAIN after 0.6 s ·
   REPLAY = LIVE ✓ kept small on the end card until go-live · the in-code A / B takes for the drop + the chime · the first mix.
