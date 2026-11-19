# HIGH RISE — S2 FIX: THE LAG HUNT (Nov 19 2026 — on the Beelink; time-boxed to ~70 minutes)

The owner's decisions: `docs/games/plan.md` "HIGH RISE — S2 FIX". The game's page: `docs/highrise.md` ("THE LAG RULES", "THE END's
FOOT", "THE HITCH COUNTER", "THE LINES", "THE SOUNDS"). The owner's phone check of S2: the glass, the sliding slab, the cuts + sparks +
the perfect's ring and the backdrops approved, 60 fps at tier 2 on his iPhone — **but RANDOM LAG SPIKES he can feel**. The inbox held no
entry TO HIGH RISE S2 FIX (read at the start, after each group, before the final tests).

## THE GROUPS (all five built — nothing skipped)
| group | commit | what |
| --- | --- | --- |
| 0 | 9a3838d6 | the owner's decisions → `docs/games/plan.md` |
| 1 | f20915f5 | THE LAG HUNT: the causes found + fixed, THE HITCH COUNTER, `--hitch` |
| 2 | 241ad6cd (+ the close) | THE GOLD TAPE = a thin glowing gold outline |
| 3 | ffcdbe22 | THE END's FOOT: the PLAY AGAIN bar |
| 4 | 2677c5ef | the sounds ship as MP3 (633 → 121 KB) |
| 5 | d73aee86 | JAYWALK: silent with the site's MUSIC OFF — fixed (its own commit) |

## GROUP 1 — THE LAG HUNT

### How it was measured
`node tests/integration/highrise-play.mjs "<chromium>" --hitch` (new): ONE long solo run at 390 × 844 @3, tier unpinned — a bot taps at
each slab's perfect moment (every 9th drop late: a cut, its sparks, a falling piece), from the rooftops up through the bands' seams;
an in-page recorder logs EVERY frame over 25 ms after the first second with its floor and (from this pass on) the page's own cause
tag, and Chromium reports the garbage made a second (`performance.memory`). BEFORE = S2's code (a worktree of `9109f145` served on
:5174), AFTER = this pass (:5173), the same harness, the same seed, the same three runs side by side (Chromium 1× · Chromium 4× CPU ·
Playwright's WebKit as an iPhone).

### What was found (each suspect ruled in or out)
| suspect | verdict | what |
| --- | --- | --- |
| (a) a plate decoded at a band's seam | **IN — the seam hitches** | three's `TextureLoader` hands the GPU an `<img>`; a browser decodes an `<img>` at its FIRST DRAW — a 720 × 1280 WebP decoded + uploaded inside the frame the cross-fade began. Measured at 4× CPU: **33 ms at floor 22, 50 ms at floor 55, 33 ms at floor 107** — exactly the three seams the run crossed (camera floors 21 · 54 · 106). On a phone the decode is slower than on this desktop. |
| (b) first-use shader compiles | mostly out | S2's warm frame already built every program incl. the bloom's (9 programs before the first slab, none later — now counted: a program built in a later frame is tagged `compile`). IN for one case: (f). |
| (c) garbage per frame | **IN — the "random" ones** | **≈ 2.7 MB of garbage a second, ~2 collections a second** (20 s: 2,658 KB/s, 38 collections). The cause was NOT the page's own loop: three.js gives a material a different program when it is drawn into a render target (the target's colour space differs from the screen's), and every time it changes it re-works the program's whole KEY — a ~150-field parameters object + a long joined string — for the glass, the sparks and the rings, into the bloom's target and back: **six times a frame**. A collector's pause lands on a random frame: the owner's "random lag spikes". Also in the page's own loop: the tier rule sorted 120 samples three times EVERY frame, the HUD built a key string every frame, the tag's transform string every frame, the plates' list walked (with a fresh pair a plate) every frame. |
| (d) audio decode / node creation at the first play | small, fixed | the decode was already at the unlock; the limiter + its trim were built inside the first drop's frame → now built with the decode. (A buffer source + a gain a sound is the Web Audio way — not pooled.) |
| (e) HUD layout churn | small, fixed | the HUD's writes were already "on change"; the per-frame strings are gone, the tag is written only when it moved ≥ 0.25 px. The big number is rebuilt once a landing (three spans) — tagged `dom` if a hitch ever lands there. |
| (f) bloom / tier thrash | **IN — Low Power Mode** | the kit's tier rule has its hysteresis (never back to a tier that failed), but its CAP PROBE steps 2 → 1 → 2 within four seconds on a phone whose frame rate is only capped: each step DISPOSED the bloom (its programs + three targets) and BUILT it again mid-run — a compile inside the run. The bloom is now kept; a bloom built after the warm frame gets its own warm frame. |

### What was fixed (`docs/highrise.md` "THE LAG RULES")
1. **A plate is decoded + uploaded AHEAD**: its bytes → `createImageBitmap` (off the main thread; an `<img>.decode()` where it is
   missing) → `renderer.initTexture` at once — a whole band before its seam. The shader flips an ImageBitmap (`uFlipA / uFlipB`).
2. **The bloom pass draws TWINS**: each mesh has a twin material (the same shader, the SAME uniforms object) only ever drawn into the
   bloom's target — no material changes program any more.
3. the tier rule asked 6×/s (was 60×/s) · the HUD compared by two numbers · the tag written only when it moved · the plates' list walked
   only at a seam's edge · the drop zone's corners without a list · the sparks' hot colour one constant.
4. the limiter built at the unlock · the bloom kept through a tier step · the tape's program in the warm frame.
5. **THE HITCH COUNTER** on `?fps=1`: `… · HITCH 2 (last: plate 48 ms @21)` — frames over 33 ms this run + the last one's cause
   (plate / compile / audio / dom / gc / unknown) and floor; `window.__hiPlay.hitches()`.

### BEFORE / AFTER (the mini PC; frames after the first second)
| run | | frames over 25 ms | over 33 ms | where | garbage | collections seen |
| --- | --- | --- | --- | --- | --- | --- |
| Chromium 1×, 150 s (floor 135) | before | 0 (+ the stall) | 0 (+ the stall) | — | 2,723 KB/s | 292 |
| | **after** | **0** (+ the stall) | **0** (+ the stall) | — | **440 KB/s** | **87** |
| Chromium 4× CPU, 150 s (floor 130) | before | 3 (+ the stall) | 3 (+ the stall) | floors 22 · 55 · 107 — the three seams (33 · 50 · 33 ms) | 2,730 KB/s | 292 |
| | **after** | **0** (+ the stall) | **0** (+ the stall) | — | **450 KB/s** | **90** |
| Chromium 1×, 20 s (the harness reading the page 4×/s) | before → after | 0 → 0 | 0 → 0 | — | 2,658 → **567 KB/s** | 38 → **12** |

**THE FINAL CODE, alone on the machine:**
| run | frames | over 25 ms | over 33 ms | garbage | notes |
| --- | --- | --- | --- | --- | --- |
| **Chromium 1×, 240 s — to floor 236** (every seam: 22 · 55 · 107 · 167, + the tightening past 200) | 14,304 | **0** (+ the stall: 633 ms at 119 s) | **0** (+ the stall) | 451 KB/s, 143 collections | tier 2 the whole run, 12 programs, none built after the warm frame |
| Chromium 4× CPU, 150 s — to floor 133 | 8,903 | **0** (+ the stall: 650 ms at 119 s) | **0** (+ the stall) | 447 KB/s, 87 collections | the three seam hitches of the BEFORE run are gone |
| `--perf` (10 s a tier, 1× + 4×) | 580 a run | 0 (worst frame 18.0 ms) | 0 | — | 60.0 fps at every tier |

So, against the target ("zero frames over 33 ms in a 4-minute run after the first second"): **met in Chromium at 1× (4 minutes) and
at 4× CPU, the browser's own two-minute stall aside; NOT MEASURABLE in WebKit on this machine** (below) — the owner's iPhone has the
last word (`?fps=1` → HITCH).

- **"THE STALL" is the headless browser's, not the game's**: every Chromium run — before AND after, at 1× and 4× (the same 650–683 ms,
  which a CPU throttle would have quadrupled were it the page's work) — freezes ONCE, ~119 s after the page opened. Proof it follows
  the clock and not the floor: the same run with 30 s on the start screen first stalled at **89 s into the run, on floor 73** instead
  of floor ~100. The page's counter tags it `gc` (nothing of the page's ran). It is left in the tables, named.
- **What garbage is left (≈ 440 KB/s)** includes the measure's own (the bot polls the page 250 times a second; `?fps=1`'s line) and
  three.js's own per-frame lists; the engine's two small slab objects a frame are the rules' (pure, tested) and were left.
- **WebKit could not give frame times here**: Playwright's WebKit on this Windows machine draws WebGL in SOFTWARE — ~21 fps, the usual
  frame 48 ms (every frame is "over 33 ms": 2,980 of 2,980 before, 2,958 of 2,958 after; frames 25 ms over ITS usual frame: 4). It
  proves the code path in WebKit (createImageBitmap + the flipped plate, every shader, the twins — `--webkit`: 6 / 6) — the target
  "zero frames over 33 ms in a 4-minute WebKit run" can only be read on the owner's iPhone: **`?fps=1` → the HITCH number**.

## GROUP 2 — THE GOLD TAPE
YOUR BEST's tape was four gold boxes round the slab (0.02 thick × 0.05 tall — "it read as a slab"). Now: ONE line of light at the mid
height of the slab of that floor, all the way round — ≈ 3 px at 3× (its width follows the pixel: never under ~2 device px at any
tier), a soft glow off it, no fill, no lid; a deeper, warmer gold (beside cyan slabs the page's `#ffc83c` read as lemon); the line
COVERS what is behind it (premultiplied — added light turned it green on a cyan slab) and is held down in the bloom pass. The edges
towards the camera are drawn WITH depth (the sliding slab + a falling piece pass in front of it); the edges turned away are drawn
FAINT through the glass, and only once the tape lies 2 … 6 floors under the top (the fresh-eyes look: just crossed, they drew a
bright diamond inside the top slab — in the aim zone). The line and its glow never ADD past the gold itself (1.4 × the colour
clipped its red: lemon). The tag "BEST 57 ▲12", NEW BEST's flash + ring: unchanged. 12–13 draw calls a frame with the tape on, 10 without.

## GROUP 3 — THE END's FOOT
ONE big SOLID glowing **PLAY AGAIN** bar (`--hi-accent` = the sign's hot pink `#ff4fd8`, dark ink): full width inside the 16 pt
gutters, 62 pt tall (58 on a short phone), 8 px corners (a rectangle — the page's own test forbids a radius ≥ 10 px), the replay arrow
+ the words, the glow static, its own press + lift. A tap anywhere after 0.6 s is still PLAY AGAIN; the bar keeps the same wait.
The card's own "TAP TO PLAY AGAIN" line is gone (one cue). `?fps=1`: the line moves up clear of the bar. The page's note sits on its
own dark strip now (the tower's stripes ran through its words under the bar — the fresh-eyes look).

## GROUP 4 — THE SOUNDS SHIP COMPRESSED
`scripts/build-highrise-sounds.mjs` — a pure-JS MP3 encoder from npm (`@breezystack/lamejs` 1.2.7), used ONLY as a build tool (given by
path; never in package.json, never shipped): ten files, **633 KB of WAV → 121 KB of MP3** (44.1 kHz mono, 128 kbps CBR).
| file | WAV | MP3 | energy vs the WAV (decoded) | the MP3's lead-in (first audible sample) |
| --- | --- | --- | --- | --- |
| drop | 34 KB | 6.5 KB | −0.38 dB | 28 ms (the WAV: 4 ms) |
| perfect | 86 KB | 16.3 KB | −1.00 dB | 13 ms (1 ms) |
| slice · slice-b | 32 · 16 KB | 6.5 · 3.7 KB | −0.44 · −0.36 dB | 31 · 60 ms (7 · 35 ms) |
| falling-piece | 67 KB | 12.7 KB | −0.44 dB | 50 ms (25 ms) |
| grow-back | 48 KB | 9.4 KB | −0.45 dB | 26 ms (1 ms) |
| streak | 103 KB | 19.2 KB | −0.44 dB | 26 ms (0.5 ms) |
| out | 120 KB | 22.4 KB | −0.83 dB | 31 ms (11 ms) |
| pass | 28 KB | 5.7 KB | −0.45 dB | 43 ms (16 ms) |
| band-arrival | 98 KB | 18.4 KB | −0.45 dB | 34 ms (9 ms) |
- **The same loudness**: no gain, no normalising; each file's energy is within 0.4–1.0 dB of its WAV (what the encoder's low-pass
  takes off the very top — the bell + the glass lose the most).
- **An MP3 starts ~25 ms LATE** (the encoder's lead-in): `sfx.js#leadOf` finds each file's first audible sample when its decode
  lands and starts the sound THERE — a drop's sound is now a little EARLIER than the WAV's was (the WAV's own few ms of silence go too).
- The game + the audition load the MP3s (`HI_SFX_REV` 2); `CREDITS.md` keeps every source + licence (+ one line: what ships).

## GROUP 5 — JAYWALK's SILENT BUG (its own commit)
`js/games/jaywalk/sfx.js`'s play gate asked for `ctx.state === 'running'`; with the site's MUSIC OFF (PODCAST MODE) the shared engine
suspends the context between effects and a source's own start wakes it — so every sound was refused. Measured on the unfixed code on
/jaywalk-lab: **0 of 12 sounds started, 0 of 3 in the audition**; fixed (one clause, HIGH RISE S2's fix): **12 of 12, 3 of 3**.
Tests: `tests/jaywalk-podcast.test.mjs` + `tests/integration/jaywalk-podcast.mjs` (5). Nothing else in JAYWALK was touched.

## THE FRESH-EYES LOOK (a subagent that did not build the pass — the new end screen + the tape at 390 × 844 and the other sizes)
- **CLEAR PROBLEM, fixed**: just after the crossing the tape's back edges showed bright through the top slab — a yellow diamond in
  the aim zone — and its front line drew over the sliding slab → the front line has depth, the back edges come in 2 … 6 floors down.
- minor, fixed: the gold read as lemon → a warmer gold, held down in the bloom pass, a wider glow; the note's words crossed by the
  tower's stripes under the bar → its own dark strip.
- minor, left: four floors down the back edges' two thin diagonals can pass for stray lines at a glance (the owner asked for "back
  edges faint" — his call); a missed slab's corner is seen falling beside the bar for a moment (a still of the fall).
- fine: the bar is a rounded rectangle everywhere (no pill), readable, centred with its arrow, covers nothing important, nothing
  overlaps or clips at 390 × 844 · 375 × 667 · 390 × 664 · 430 × 739 · 430 × 932 · 1440 × 900; the fps line sits between the card and the bar.

## THE CALLS MADE (obvious / established pattern — the owner may overrule)
- HIGH RISE's accent for the bar = its sign's hot pink `#ff4fd8` (the HUD's glow); one variable, `--hi-accent`.
- the bar keeps the 0.6 s wait a tap anywhere has; the card's "TAP TO PLAY AGAIN" line is removed.
- the tape's gold is deeper than the page's other golds (`night.js#TAPE_GOLD`), so it reads against cyan / blue slabs.
- 128 kbps for the MP3s (the target was ~120 KB: 121).
- a hitch = a frame over 33 ms; the counter resets each run; the cause "gc" = none of the page's own marks + its frame code was quick.

## THE FINAL RUN (the Beelink, this pass's OWN servers — nothing else busy)
- unit `node --test tests/*.test.mjs`: **2,305 / 2,305** (was 2,304 — + `tests/jaywalk-podcast.test.mjs`; `tests/highrise-play.test.mjs`
  re-pinned: the plates' loader, the twins, the bloom kept, the MP3s) — the CLAUDE.md size test, the doc links, the file hashes,
  parse-all, unit-imports all green
- `tests/integration/highrise-play.mjs`: **93 / 93** (was 86: + THE END's FOOT at 390 × 844 and at 375 × 667 with the fps line, the
  bar's own press, THE HITCH COUNTER's words, no `.wav` asked) · `--perf` **12 / 12** (60.0 fps at every tier at 1× + 4× CPU, worst
  frame 18.0 ms) · `--webkit` **6 / 6** · `--hitch`: the tables above
- `tests/integration/highrise-lab.mjs`: **45 / 45** (S1's lab, unchanged)
- `tests/integration/jaywalk-podcast.mjs`: **5 / 5** (the unfixed code: 3 / 5 — 0 of 12 sounds, 0 of 3 in the audition)
- THE PAGES LOAD (`kit/page-loads.mjs`, on this pass's own emulators + `serve.mjs --emu` on :5175): **16 / 16** — the eight pages
  incl. /highrise-play, Chromium + WebKit
- `/api` + the rules tests: not run — nothing under `/api` or the rules changed. JAYWALK's own long E2Es: not run — one clause of its
  sounds' gate changed, covered by the two new tests + its unit tests (in the 2,305)
- the look shots the fresh-eyes look read: `Downloads/NEON/highrise-s2-fix-look/` (out of git)
- the servers this pass started (`serve.mjs` on :5173, the S2 baseline's on :5174 from a worktree — removed, `serve.mjs --emu` on
  :5175, the emulators) STOPPED at its end, each by its own PID; the owner's :5190 preview server untouched

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules-file change).
2. **YOUR PHONE CHECK — https://neonspeakeasy.com/highrise-play?fps=1** : play a long run (past floor 60 crosses two seams) and
   screenshot the fps line — **HITCH n (last: cause ms @floor)**. 0 is the target; if it is not 0 the cause word says where to look
   next. (Frame times could not be measured in WebKit on the build machine — it draws in software there.)
3. the tape: thin gold outline — thick / bright enough on the phone? (one number each: `night-fx.js` TAPE_LINE · `night.js` TAPE_GOLD);
   the faint back edges through the glass: keep, or front edges only?
4. the PLAY AGAIN bar's colour = the sign's hot pink — or cyan / another accent (`--hi-accent`).
5. S2's open items stay open (the bands' names, solo past 200's time, the audition picks: SOUNDS → COPY MY PICKS).
6. JAYWALK: `js/games/jaywalk/flyers.js` (lines 92 + 111) and `js/games/holdem/sfx.js:106` keep a "running only" gate of the same
   kind — not touched here (the prompt: nothing else in JAYWALK); in the inbox for their next passes.
