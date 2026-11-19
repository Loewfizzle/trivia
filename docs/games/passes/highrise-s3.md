# HIGH RISE — S3: THE DAY LOOK + THE FLYERS + DEEP SPACE (Nov 19 2026 — on the Beelink)

The owner's decisions: `docs/games/plan.md` "HIGH RISE — S3 (approved Nov 19)". The game's page: `docs/highrise.md` ("THE DAY LOOK",
"THE LOOK SWITCH", "THE FLYERS", "DEEP SPACE", "THE CARDS' ART — PREPARED", "THE SOUNDS"). Still: NOTHING COUNTS (no `/api`, no
Firebase write, THE DOOR shut), nothing registered, no rules change. The inbox held one entry TO HIGH RISE S3 (S2 FIX's hand-over:
THE LAG RULES for whatever S3 adds) — followed, marked done; none arrived during the pass.

## THE GROUPS (all built — nothing skipped)
| group | commit | what |
| --- | --- | --- |
| 0 | 3c0f202c | the owner's decisions → `docs/games/plan.md` |
| 1 + 2 | ce090047 | THE DAY LOOK + THE LOOK SWITCH |
| 3 | 347eec77 | THE FLYERS + DEEP SPACE + THE MOTHERSHIP (solo's moment · the match's finish) |
| 4 | 2fa2e42e | the sounds final (ALL A) + the 2 cards' art prepared |
| 5 | (the close) | the tests, the docs, the fresh-eyes review's fixes, the final run |

## GROUP 1 — THE DAY LOOK
- **The day set**: `assets/highrise/plates/day-1…5.webp` (251 KB; day 1 = `day-1-rooftops-v2`, the owner's approved redo — never the
  original) + `env-day.png` (the day HDRI's sky half, 256 × 64, 15 KB) — `python -P -E scripts/build-highrise-assets.py
  --only=plates,env --look=day`.
- **ONE set of programs for both looks** — every material carries `uDay` (0 … 1). Nothing is built per look: a switch compiles
  nothing (THE LAG RULES) and can cross-fade; at `uDay` 0 the night's own maths run as they did.
- **The glass by day**: frosted (a milky body), the band's pastel through the MIDDLE of each side face, ONE sun behind on the left +
  the sky's cool fill (the top the brightest, one side lit, one in cool shade), **the slab above throws its shadow on a ledge**
  (real geometry: each box is handed the slab lying on it), a chrome rim (a bright line + a darker line inside it), the day sky
  mirrored, a soft glint down the lit face, a light height haze in the band's own air. No bloom by day.
- **The sliding slab by day** = its band's ACCENT at full strength + a white-hot rim: the clearest thing on a sunlit screen.
- **The day's lights are PAINT** (one blend for both looks — alpha 0 by night = added light as before): sparks warm gold, the
  perfect's ring gold-white; the gold tape gets a darker outline.
- **The words by day**: dark navy on a light halo under a sunlit sky; LIGHT again from THE STARS up (the day plates 4 + 5 are dark).
  Measured on the real pixels (the letters against what is right round them): the number 8.7–8.9 : 1, the band's name 6.4–12 : 1.

## GROUP 2 — THE LOOK SWITCH
AUTO · DAY · NIGHT under the sign (three neon-underline choices, each its own press + lift; `hi:play:look`; `?look=` for a visit).
AUTO = the site's own sun rule (`games/kit/look.js` → `core/sky.js`), asked every minute. `night.js#setLook`: the other look's two
plates + its reflection map come in through the decode-ahead loader FIRST, then a 1.5 s cross-fade (the plate shader holds both
looks' pairs), then the old look's pictures go. **A switch mid-run, measured (`--s3`): 0 hitches, 0 new programs** (16 → 16), the
day files fetched only AT the switch.

## GROUP 3 — THE FLYERS
- **WHICH F-22 PATH: the real model.** The city's source `f22_raptor_free.glb` was found on the Beelink (`art/models/f22/`, 25 MB,
  git-ignored) → `assets/highrise/models/f22.glb`, **399 KB** (`node scripts/bake-model.mjs "<chromium>" highrise-f22`: the
  gear-retracted pose, the wheels + their discs + the ladder left out, the softened base maps baked into vertex colours, 42,019 →
  15,843 vertices by vertex clustering, the flyers' own GLB format). The baked-sprite fallback was not needed.
- **The plan is the seed's** (`flyplan.js`, pure): the flyby's floor 35–45, `flyerFor` = the Blackbird or the F-22 pair, the side.
- **Lazy + warm**: `flyers.js` from floor 20; each model + its sounds 15+ floors before its moment; the two programs (+ twins) in
  the warm frame on a stand-in triangle; a model's buffers uploaded in an ordinary frame; each flyer freed after its moment. **A
  model is read through typed arrays** (`readFlyer` — the flyers' one layout): blackbird 0.9 ms · ufo 0.2 ms · f22 0.35 ms, against
  4.2 · 1.3 · 6.0 ms through the general reader (the same numbers to 1e-8) — a slow phone parses a model mid-run too.
- **Never in the play zone**: a flyer is placed in the camera's own frame — its band of sky between the HUD's foot and THE DROP
  ZONE's upper edge. The pixel check (the canvas's own pixels, before a run — the tower stands still): **0 of 50,505 play-zone
  sample pixels changed** with the UFO, the Blackbird or the F-22 pair up, in both looks; each is SEEN in its band (2,800+ of its
  16,185 sample pixels changed).
- **THE MOTHERSHIP's hull is built in code** (a smooth 128-sided panelled disc): JAYWALK's `mothership.glb` is a 28-sided saucer
  with pale vertex colours — at 2.7 screen widths its rim read as a polygon and its belly as a flat beige plate (the pass's first
  shots). ~150 small lights in three turning rings + the rim's + a lens.
- **Floor 200**: SOLO = the camera glances up, the lights pulse, "THE MOTHERSHIP" in the announcer lane + the band-arrival sound,
  then it leaves and DEEP SPACE comes in (drifting stars in two depths + an aurora, floors 200–212). MATCH (`?mode=match`) = THE
  FINISH: the white-gold light pours onto the top slab → the gold end card 2.6 s later.

## GROUP 4 — THE SOUNDS FINAL + THE CARDS' ART
- The owner's picks (ALL A) are the table: ONE take a sound. `slice-b.mp3`, the two in-code variants, this phone's picks, PLAY A /
  PLAY B / USE + COPY MY PICKS are gone: nine MP3s, **117 KB**. **The call: the SOUNDS sheet stays** as a plain list (every sound,
  one PLAY) — PASS is not in play yet and can still be heard there.
- The 2 cards' art through JAYWALK's pipeline: masters copied to `art/highrise-cards/src/` → `assets/vault/hi/*.webp` (34 + 47 KB,
  1280 × 720) + `js/fx/hi-specs.js` (the slim + full crops in JAYWALK's format, the hero boxes). No catalog entry, nothing awarded.

## THE HITCH RUNS (the mini PC, alone on the machine — `--hitch`, 240 s, 390 × 844 @3, the bot playing; frames after the first second)
ONE long solo run a look (seed `hitch`: THE BLACKBIRD at floor 36, the UFO at 85, THE MOTHERSHIP + its moment at 200, on into deep
space — all flown in the run), a bot at each slab's perfect moment, every 9th drop late (a cut, its sparks, a falling piece).

| run | frames | over 25 ms | over 33 ms | programs | garbage | notes |
| --- | --- | --- | --- | --- | --- | --- |
| **NIGHT — Chromium 1×, 240 s, to floor 236** | 14,303 | **0** (+ the stall: 650 ms at 118.9 s) | **0** (+ the stall) | 16, none built after the warm frame | 605 KB/s, 205 collections | tier 2 the whole run; the page's own HITCH counter: 1 = the stall (`gc 650 ms @102`) |
| **DAY — Chromium 1×, 240 s, to floor 236** (`HITCH_Q='&look=day'`) | 14,302 | **0** (+ the stall: 667 ms at 119.2 s) | **0** (+ the stall) | 16 | 554 KB/s, 188 collections | the same run by day (no bloom pass) |

- **Zero frames over 33 ms after the first second in both looks, the flyers flown** — the one frame each run counts is headless
  Chromium's own stall, the SAME one S2 FIX found and proved to follow the browser's clock, not the game (`docs/games/passes/
  highrise-s2-fix.md` "THE STALL"): it lands ~119 s after launch in BOTH runs (118.9 · 119.2 s), on floor 102, whatever the look.
  (These are the FINAL code's runs, after the fresh-eyes fixes; the pair run before them read the same: 0 + the stall at 118.9 s.)
- 16 programs (S2 FIX: 12): + a flyer's body, the flyers' lights, and their two bloom twins — all four built in THE WARM FRAME on a
  stand-in triangle; none is built later (a program built in a frame would be tagged `compile`).
- A look SWITCH mid-run (`--s3`): **HITCH 0**, 16 → 16 programs, there and back.
- The garbage reads ≈ 550–600 KB/s in these runs (S2 FIX's long run: ≈ 450 KB/s; its shorter ones 440–570 — the figure moves
  with the run + includes the measure's own polling). The two things S3 allocated in a frame (a flyer's screen box, the day haze's
  colour) were made allocation-free; no collector's pause shows (0 frames over 25 ms). Worth a look on the phone if HITCH says `gc`.
- **WebKit**: Playwright's WebKit on this machine draws WebGL in software (~21 fps — S2 FIX's finding): it proves the code path
  (`--webkit`: the shaders build, the scene draws, real touches drop slabs — in the final run below), never the frame times. The
  owner's iPhone has the last word: `?fps=1` → the HITCH number, in both looks.

## THE FRAME RATE (`--perf` — the bot playing high in the clouds, 10 s a run)
| look | tier | cpu | fps | frame ms (p95 · worst) | draw calls | size |
| --- | --- | --- | --- | --- | --- | --- |
| night | 2 (bloom) | 1× · 4× | 60.0 · 60.0 | 17.1 · 18.1 — 16.8 · 16.9 | 10 | 390 × 844 @3 |
| night | 1 | 1× · 4× | 60.0 · 60.0 | 17.2 · 17.8 — 16.8 · 16.9 | 4 | @2 |
| night | 0 | 1× · 4× | 60.0 · 60.0 | 17.2 · 18.0 — 16.8 · 16.9 | 4 | @1.5 |
| **day** (`PERF_Q='&look=day'`) | 2 | 1× · 4× | 60.0 · 60.0 | 17.2 · 17.8 — 16.8 · 16.9 | **4** (no bloom by day) | @3 |
| day | 1 | 1× · 4× | 60.0 · 60.0 | 17.2 · 17.8 — 16.8 · 16.9 | 4 | @2 |
| day | 0 | 1× · 4× | 60.0 · 60.0 | 17.1 · 17.8 — 16.8 · 16.9 | 4 | @1.5 |

60.0 fps at every tier, both looks, at 1× and 4× CPU; no frame over 18.1 ms (the final code). The night numbers are S2 FIX's (the day
look's extra maths sit behind `uDay`: nothing of them runs at night). One run before the fast model reader showed ONE doubled frame
(33.3 ms) in two night rows at 4× CPU — the UFO's model was being parsed as the run passed floor 70; `readFlyer` (above) took it away. A flyer adds 2–6 calls only while it is in the sky (a body, its lights, +
their bloom twins by night). A desktop GPU's numbers — the tiers are the phone's margin.

## THE FRESH-EYES REVIEW (a subagent that did not build the pass — every shot at 390 × 844 against the quality bar + the day mockup)
It judged 68 shots (both looks at 390 × 844, the small phone, the desktop column, the flyers at their floors, the ship, the finish, the
switch) and made 390-px copies of six to judge them at true phone size. **THREE CLEAR PROBLEMS — all fixed:**
1. **The finish's light did not reach the slab** — it ended in mid-air a third of the way down as a soft rectangle, white with the
   aurora's cast, no gold ring in sight. (The cone was laid between the slab and the ship's far centre: seen in perspective its
   ends landed nowhere.) → the light's head is put where the ship's lens is SEEN, at the slab's own depth: a warm gold cone down to
   the slab, widest + brightest ON it, a gold pool on its top, gold rings running off it every 0.8 s.
2. **The gold end card was gold on gold** — the finish lit the hull tan, the lens sat behind "IT TO", the light behind "200". → the
   hull stays DARK at the finish (it gives no light of its own); when the card comes the lens + the light's head are turned down:
   the gold words stand on the dark ship.
3. **THE MOTHERSHIP read as a flat pale dish with polka dots** (lighter than the night sky, pie-wedge shading, ~30 big dots). → a
   near-black hull of fine steel PLATING (three bands of plates a terrace, a seam between two), ~225 small lights in four turning
   rings + the rim's, every 8th a brighter lamp.

**Minor — fixed:** the day glass was flat (the two sides the same brightness, the rim a thick white line, the top blown out) → the
shaded face clearly darker + more saturated, a thinner rim with a dark inner line that is seen, the top keeps its band's tint, less
haze · the day jets were pale grey cut-outs in haze → the Blackbird near-black, hardly any haze over a jet by day · the day "gold"
was a rust brown → a bright amber-gold with a NAVY EDGE (the mockup's own PERFECT ×7) · the gold tape by day was thin → twice as
thick, a wider dark outline · TAP TO START weaker than the rule under it → it breathes no lower than 84 % by day, a firmer halo ·
"LOOK" + AUTO over the left bank's buildings → the label is gone, the three choices sit over the open water · the UFO's lights
cream, not amber → lamps that keep their amber to the heart, a darker hull · a cut's day sparks weak → bigger + warmer · faint old
rings hanging behind the tower by day → the day ring goes sooner.
**Minor — left:** the announcer line fading over the ship (it is bright while it counts; the hull behind it is dark now) · "REPLAY =
LIVE ✓" (a debug line until go-live).
**Not a fault (checked):** "flyers at odd floors" in the `--look` shots (a jet at 70, 125, 185) = the shot harness jumping 50 floors
at a time while ONE 3.4 s flyby is in the air; in a run a flyer comes at its own floor (`--s3`: "at ITS floor").
**Fine:** the sliding slab by day is the most saturated thing on screen in every band · the flyers' size, place + read (35–45 % of
the width, always in the band, the pair a formation, the Blackbird's planform) · the UFO clearly its own (no beam, no ring, the
violet underglow) · no pills anywhere · 375 × 667 and 1440 × 900 sound · the cross-fade's mid frame a clean blend.

## THE CALLS MADE (obvious / established pattern — the owner may overrule)
- The words by day follow the SKY, not only the look: navy + a light halo up to floor ~108, light again from THE STARS up (the day
  plates 4 + 5 are dark — navy words would vanish there).
- The sliding slab by day takes its band's ACCENT (a white / silver step of the day set would wash out against a sunlit sky); when
  it lands it is its floor's pastel.
- THE MOTHERSHIP's hull built in code instead of JAYWALK's `mothership.glb` (above); the Blackbird + the UFO are JAYWALK's files.
- The UFO by day keeps its amber lights + violet underglow as paint; the flyers' lights by night are added light.
- A flyer still in the sky when the end card comes fades out (never behind the card's words); THE FINISH's ship + light stay.
- The look switch's own key `hi:play:look` (the test page's — as the JAYWALK lab's `jw:lab:look`); at go-live the game reads the
  console's GAME LOOK like every game.
- The SOUNDS sheet kept as a plain PLAY list (above).
- THE MOTHERSHIP's moment in solo: it leaves up and away (the tower passes its height; nothing crosses the play zone).
- The slab's ledge shadow by day (the slab above); the SLIDING slab throws none (its shadow on the tower would be an aiming aid the
  night look does not have — a phone on DAY and a phone on NIGHT play the same match).
- The day's gold words are a bright amber-gold `#ffb81f` with a navy edge (the reviewer; the mockup's own PERFECT ×7) — the page's
  night gold on a glow has no contrast on a bright sky.
- **`?floor=N` on the test page** (the JAYWALK lab's `?lane=N` pattern): the START tap plays N clean drops at once and the run goes
  on live from there — so the owner can SEE the flyby (`?floor=30`), the UFO (`?floor=80`), THE MOTHERSHIP + the solo moment
  (`?floor=190`) and the match's finish (`?mode=match&floor=193`) on his phone without minutes of near-perfect play. Real drops
  through the real engine (REPLAY = LIVE ✓); it never moves YOUR BEST; nothing counts on the page anyway.

## THE FINAL RUN (the Beelink, this pass's OWN servers — nothing else busy)
- unit `node --test tests/*.test.mjs`: **2,310 / 2,310** (was 2,305: `tests/highrise-play.test.mjs` 11 → 16 — + THE DAY LOOK · THE LOOK
  SWITCH · THE FLYERS' PLAN · THE FLYERS · THE CARDS' ART; the sounds' table = the final one) — the CLAUDE.md size test (33.4 KB),
  the docs' links, the file hashes, parse-all, unit-imports, the boot budget (the boot is untouched) all green
- the highrise tests: engine 21 · server 5 · sim 5 · lab 6 · play 16 (in the 2,310)
- `tests/integration/highrise-play.mjs` (the whole check): **217 / 217** (S2 FIX: 93) — S2's checks on the night look (the SOUNDS
  sheet now a plain list) + `s3()`; `--s3` alone on the last code: **125 / 125**
- `--perf`: **12 / 12** by night, **12 / 12** by day (the table above) · `--hitch`: the two runs above, each look · `--webkit`:
  **6 / 6** (16 programs build in WebKit, real touches drop slabs, REPLAY = LIVE ✓)
- `tests/integration/highrise-lab.mjs`: **45 / 45** (S1's lab, unchanged)
- THE PAGES LOAD (`kit/page-loads.mjs`, on this pass's own emulators + `serve.mjs --emu` on :5175): **16 / 16** — the eight pages
  incl. /highrise-play, Chromium + WebKit
- `/api` + the rules tests: not run — nothing under `/api` or the rules changed. No other game's file changed (JAYWALK's
  `models.js` is only imported).
- the shots: `Downloads/NEON/highrise-s3/final/` (the whole check's + S3's) · `…/review/` (what the fresh-eyes reviewer judged —
  before its fixes) · `…/cards/` (the two cards' slim + full previews) — out of git
- the servers this pass started (`serve.mjs` on :5173, `serve.mjs --emu` on :5175, the emulators) STOPPED at its end, each by its own
  PID; the owner's :5190 preview server untouched

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules-file change).
2. **YOUR PHONE CHECK** (nothing counts): https://neonspeakeasy.com/highrise-play — AUTO · DAY · NIGHT under the sign; the day glass,
   the sliding slab in sunlight. **`?fps=1`** → a long run in EACH look and the HITCH number (0 is the target; frame times cannot be
   measured in WebKit on the build machine). The late moments without minutes of near-perfect play: **`?floor=30`** (the flyby at
   35–45 — a new seed a run: the Blackbird or the F-22 pair) · **`?floor=80`** (the UFO at 85) · **`?floor=190`** (THE MOTHERSHIP, the
   moment at 200, deep space) · **`?mode=match&floor=193`** (THE FINISH + the gold card).
3. **Named calls, yours to overrule**: THE MOTHERSHIP's hull is built in code (JAYWALK's saucer model read as a pale polygon at that
   size) · the sliding slab's accent colour by day · by day the words turn light again from THE STARS up · the day's gold words =
   amber-gold with a navy edge · the SOUNDS sheet kept as a plain PLAY list · the flyers' sizes (`flyers.js#FLY`: the Blackbird 46 %
   of the width, each F-22 28 %, the UFO 36 %, the ship 2.7 screens) + their sounds' levels (`MIX` — a first mix, not measured) ·
   `?floor=N` on the test page.
4. **For S4**: the 2 cards' art is in (`assets/vault/hi/` + `js/fx/hi-specs.js`; previews in `Downloads/NEON/highrise-s3/cards/`) —
   the crops are a proposal until you see them on real cards in THE LAB · the site's Credits sheet needs its HIGH RISE group at
   go-live (CC BY: F22 Raptor FREE by NLM · Sr-71 by Kiiba · Flying saucer: Poly by Google — `assets/highrise/models/CREDITS.md`).
5. S2 FIX's open items stay open (your HITCH number on the phone, the tape's thickness, the bar's colour).
