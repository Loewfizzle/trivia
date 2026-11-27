# FREEFALL — THE FIX PASS, PART A: THE LOOK + THE FEEL (Nov 27 2026 · the Beelink · Opus 5.5)

The review (`docs/games/passes/freefall-review.md`) split into two fix passes: PART A (this) = the look + the feel; PART B = the match,
stability, scoring + the test page; then the go-live. FREEFALL stays HIDDEN (`config.js` `playable` untouched) and THE SWITCH stays OFF.

## GROUP 0 — MAKE ROOM (the review's M3)
- FREEFALL's line: 29 cartridge modules' long comment blocks (each module's header + every block of 4+ comment lines) moved VERBATIM to
  `docs/freefall.md` "MODULE NOTES"; each block keeps its first line + `(→ §n, docs/freefall.md MODULE NOTES)`. Proof: every file with its
  full-line comments stripped is byte-identical to before. **The game alone: 609 → 574 KB of 610 (1.4 KB → 36 KB of room).**
- THE BOOT: the FREEFALL row's comment in `config.js` trimmed + the long headers of three city modules (`harbor/boats.js`, `moon.js`,
  `jets.js` — comments only) moved to `docs/harbor/boot-headers.md` (CITY PART 2's pattern). **The boot: 21 B → 6,299 B of room.**

## STEP 0
`docs/games/plan.md` "FREEFALL — THE FIX PASS": the PART A / PART B split, Ben's four answers to THE REVIEW's OPEN FOR BEN (anti-cheat in
PART B, server-only · THE LOOK LOCK = the host's look on every phone · a silent phone: 18 s + a re-score in PART B · the budgets: trim),
the decided looks. THE ADD-ON INBOX: nothing open for this pass at the start, after each group, before the final tests. THE LAB: no FIX
marks (232 marks exported).

## GROUP 1 — THE TWO MUSTS
- **THE LOOK LOCK (M1).** Solo: `stage.js#lookHeld` (a run started and not over) — `setLook` keeps the asked look in `lookWant` and applies
  it at the end card / the opening; the poll every 15 frames does the same. Match: `index.js#start` stamps the host's look (its Game look;
  AUTO = `kit/look.js#sunUpNow` at its place) → `director.js#createGame` writes `game.look` for a MATCH only; `view.js` hands it to the
  stage as `o.lookLock` (it always wins — a refresh, a late joiner, a new host read the same stamp). The kit's `look.js` is untouched (the
  other games keep the console's live per-device look). No rules change: `rooms/$code/game` validates only `out` + `ps`.
- **THE DAY HUD (M2).** See the contrast table below.

## GROUP 2 — THE DECIDED LOOKS
- **THE WATER.** Five refine rounds beside the two mocks (`Downloads\NEON\freefall-fixa\water\v1 … v5` + the final `water\`). Found on
  the way: Grok's map is VERY soft (slopes ±0.09 — 8 bits = ~20 steps → terraced blobs at the shader's gain): baked with the slopes
  stretched × 10 (`RIP_K`), the shader divides back. The review's "the water's first frame 150–217 ms": measured again — the splashdown
  runs (the water's first show) were 16.8–17.8 ms worst at 1× and 4×; the long frame is the STAND row's run ending on floor 119 (its end
  card + its share frame) — not the water. The warm frame already draws the water (never frustum-culled).
- **THE CALLOUTS** (+ S14), **THE RAIL's NAMES**, **THE GHOSTS**, **THE MARK = D** — docs/freefall.md "THE FIX PASS A".

## GROUP 3 — SPEED
- `?fps=1` END-OF-RUN SUMMARY · THE SPIKE RULE (+ the kit's opt-in `ask(t, stay)`) · SHARE's card on an idle moment. The pre-warms the
  prompt named were checked one by one: the water (in the warm frame), the finish's firework (the bursts' program — the warm frame draws
  one), the breakthrough sounds (decoded with every sound before tick 0 — `snd.ready()` gates the start). The review's 4× "snd" / "pic"
  frames before each break came from `?floor=` starts (the page's pictures + sounds still landing a second after load) — a real run
  from the rooftop has them all long before.

## THE DAY HUD — THE CONTRAST (measured: `node tests/integration/freefall-play.mjs "<chromium>" <out> --contrast --looks=day,night`)
The frame FROZEN (`__slowmo(0)`), shot with the HUD and without it; the digits' own pixels (the HUD shot) against the pixels behind them
(the second shot): the WORST 10 % (the brightest behind) and the median. 390 × 844 @3, YOUR BEST 141. (The review, before: the pink number
1.13 rooftop · 2.3 rooftop-30 · 1.28 offices · 3.2 speakeasy · 3.2 water · 1.28 harbor · 4.4 deep.)

| area (day) | the number (worst / median) | NEW BEST's gold (worst) | the top line (worst / median) |
| --- | --- | --- | --- |
| rooftop | 7.7 / 9.3 | 4.8 | 8.1 / 8.9 |
| rooftop-30 | 9.3 / 14.8 | 5.7 | 10.1 / 11.4 |
| offices | 9.9 / 11.0 | 6.1 | 11.0 / 12.7 |
| speakeasy | 13.6 / 16.0 | 8.4 | 11.7 / 16.3 |
| water (the surface) | 14.0 / 16.5 | 8.7 | 17.1 / 17.8 |
| harbor | 7.3 / 8.7 | 4.5 | 9.1 / 10.1 |
| the deep | 16.2 / 17.1 | 10.0 | 16.9 / 17.3 |

Every text ≥ 4.5 : 1, the big number ≥ 7.3 : 1 (the bar: ≥ 3). Night unchanged (16.8+ : 1 on the rooftop). Shots: `Downloads\NEON\freefall-fixa\hud\`.

## GROUP 4 — POLISH
THE TITLE's GREY FLASH (a dark hold ≤ 1.6 s until the rooftop's pictures are in; the sky + roof fallbacks = the panoramas' own measured
colours — the grey was the roof's day fallback `0.3 / 0.33 / 0.38`) · S12 THE TAPPER (`is-teach`) · S13 THE DEEP + THE TRENCH lifted by
night · N3 the finish's share frame (600 ms, × 1.14 back, bloom 0.08) · N13 the day's gold YOU HIT THE BOTTOM + never "0 PLAYING" · the
mid-run NEW BEST moment from floor 10 · the test page's SHARE busy state (the cartridge's console footer already had one: `ui/final.js`).
**Not done (N13): THE DEEP's day lamps** — they are part of the deep's day WALL PAINTING (a re-bake of the art, not code); **the pillar's
end above the seabed at 199** — not reproduced in this pass's shots; both left for PART B / the go-live look check.

## THE FRESH-EYES REVIEW (a separate reviewer, the shots cold at phone size)
- **PASS:** the day HUD · the deep + the trench by night (S13) · the mark at 44 pt (borderline: "a burner more than a ball").
- **FAIL → FIXED + re-shot:** THE WATER (flat, blotches, wide faint rings, a wide night column) → a third fine ripple layer, the rings
  tightened to ~1.0–1.4 × the floor's radius, the night column 38 % narrower, smaller sharper glints (more of them by night) — `water\side.png`
  · LAST ONE STANDING clipped at 390 / 375 → one-line title, the sub-line wraps after its "·", a smaller card on short phones —
  `rail\v2\` · the rail's names hard to read over pale floors → a dark plate behind each name (square corners — never a pill).
- **NOT TAKEN (named):** the finish card "zoom in 2.5×" — the owner asked for the finish PULLED BACK a little (the prompt's N3), kept · the
  mark "ball 1.4× bigger, drop the cream lick" — the owner's D gave the paths ("the flames + core + ball exactly as now"), kept · the day
  finish's sand reads beige — it IS the seabed's sand (F5A's art).

## THE CALLS I MADE (named — yours to overrule)
- The look stamp is written for a MATCH only (a solo run is one phone: it locks its own run); the music still follows the phone's own
  look (`index.js#musicFor` reads the body) — only the picture is locked.
- THE SPIKE RULE's numbers: 4 hitches inside 20 s → one tier down, at most 2 a run, the tier left held for the page (never stepped back up).
- The LAST ONE STANDING words when several finished: "2 RIVALS HIT THE BOTTOM · KEEP FALLING FOR 3RD".
- The rail's names: 7 letters + "…", 12 px, a dark plate; the finisher's name gold.
- The mid-run NEW BEST: under floor 10 the crossing is QUIET (no gold, no call, no sound); the end card still says NEW BEST.
- The opening's dark hold: at most 1.6 s, then the title fades in whatever has landed.
- Boot room: three CITY modules' header comments moved (comments only) — the city's own byte room, not FREEFALL's code.

## SPEED (the Beelink, headless Chromium + ANGLE d3d11, 390 × 844; "4×" = CDP's CPU throttle) — logs `Downloads\NEON\freefall-fixa\speed\`
| what | result |
| --- | --- |
| `--perf` (68 rows: the areas · every tier · 1× + 4× · both looks · the water · each breakthrough) | 58.2–60.3 fps, p95 ≤ 17.2 ms. ONE red row (day · THE SPEAKEASY · tier 1 · 4×: one 250 ms frame — the machine's known headless stall ~2 min after launch): re-run ALONE three times → 60.0 fps, worst 16.9–17.0 ms |
| THE SKYLIGHT + THE SPLASHDOWN at 4× | **0 long frames**, worst ≤ 18.1 ms (the review: 33–67 ms `snd` / `dom` frames 3–4 floors before each break — those came from `?floor=` runs starting before the 13th picture had landed; every speed row now waits for all 13) |
| THE BOTTOM (a finish) at 4× | 58.8–59.3 fps through it, ONE 83–117 ms frame @196 (`snd` / `pic`) — as the review; not closed (OPEN FOR BEN) |
| THE WATER STANDING (8.8 s still on 119) | 58.3–59.7 fps; one 50–200 ms frame — the darkness ends that row's run inside its window: the end card (`--water`'s stand row tags it `dom @119`); the splashdown rows (the water's first show) 16.8–17.8 ms worst at 1× + 4× |
| `--perf8` (8 ghosts + tags, 24 rows) | 56.4–60.1 fps, p95 ≤ 17.1 — the one red row a single 250 ms frame (the same stall; re-run below) |
| `--stutters` — a WHOLE run, the roof to the trench, 4× | day **HITCH 0**, worst 17.0 ms · night HITCH 1 (one 250 ms frame @128 — the same machine stall the review logged at the same spot) |
The iPhone's own numbers: `?fps=1` now leaves THE END-OF-RUN SUMMARY on the end screen — Ben's next screenshot names what is left.

## THE TESTS (local — fresh emulators + this pass's own `serve.mjs --emu`, one suite at a time; logs in the session's scratchpad)
- Unit `node --test tests/*.test.mjs`: **2,840 / 2,840** (the budgets: the boot 6,650,007 B — **5,993 B of room**; FREEFALL alone 42
  modules / **580 KB of 610** — 30 KB of room).
- FREEFALL: the test page `freefall-play.mjs` **173 / 174** — the one red (by day THE TRENCH's band 5.85 s after the bottom's, its window
  4 s) re-run alone with its group (`--f4a`): **18 / 18** · `--f4b` 17 / 17 · `--contrast` 14 / 14 · `--watershot` 2 / 2 · the share
  cards `freefall-share.mjs` **255 / 255** · `e2e-freefall.mjs` (FAST) 63 / 64 → alone **64 / 64** (the red: the hold-cut probe right
  after the long page suite — a timing case) · `e2e-freefall-match.mjs --fast` **93 / 93** (THE LOOK LOCK: the host NIGHT, the guests
  DAY → every phone night; THE RAIL's NAMES on BOB's phone).
- The shared files changed (`js/core/marks.js`, `js/ui/game-art.js`, `js/games/kit/tiers.js`) → every game's suite once: OVERCLOCK
  `e2e-oc-2` (N=4) **27 / 27** · PRISM DROP **68 / 68** · HOLD'EM **25 / 25** · JAYWALK **123 / 123** · HIGH RISE **107 / 107** · smoke
  **28 / 28** (THE PAGES LOAD in Chromium + WebKit). Rules + /api: untouched (no rules or api change). THE HARBOR suite: not run — the
  city files changed are three header comments (THE LOCAL TESTING RULE: the cloud runs it).
- Speed: the table above.

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** — no rules-file change (`game.look` rides under `rooms/$code/game`, which has no child whitelist).
2. **Your phone checks** (the hidden cartridge / `/freefall-play`): the water at 117–119 in both looks · the day HUD on the rooftop + the
   harbor · `?fps=1` → a long run → screenshot the END-OF-RUN SUMMARY on the end screen (it names the worst frame + the top 3 causes) ·
   a TAP to start (the hint stays) · the title's fade-in (no grey flash) · a hidden match with a guest on the other look (both should
   play the HOST's look).
3. **Left open:** the finish's one 83–117 ms frame at 4× CPU (`snd` / `pic` @196 — as the review measured) · THE DEEP's day lamps (they
   are in the deep's day WALL PAINTING — a re-bake) · the pillar's end above the seabed at 199 (not reproduced in this pass's shots).
4. **The reviewer's two calls I did NOT take** (your instructions said otherwise): the finish card "zoom in 2.5×" (you asked: pulled
   back a little) · THE MARK's ball 1.4× bigger + the cream lick dropped (you gave the paths: "exactly as now").
5. **Named calls** (above, "THE CALLS I MADE") — the music still follows each phone's own look in a locked match; the spike rule's numbers.
