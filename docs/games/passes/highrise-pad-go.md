# HIGH RISE PAD + GO — THE CONTROLLER · THE SOLO GO · THE BOUNCE CHECK (Nov 24–25, 2026)

The owner's decisions: `docs/games/plan.md` "HIGH RISE PAD + GO". No rules change, no `/api` change. The game's look and feel are
unchanged; touch plays byte for byte as before (`stage.js#touch` is untouched); REPLAY = LIVE stays exact (solo, match, daily).

**RE-PUBLISH: nothing.**

## GROUP 1 — THE CONTROLLER (`js/games/kit/gamepad.js` → `js/games/highrise/stage.js`)
- **ONE WIRING, IN THE STAGE** (named call): the prompt said `view.js`; the pad is wired in `stage.js` instead — the one module the
  cartridge (solo + match), the daily AND the test page mount — so all three get the same wiring from one place, and the owner can try
  a pad on `/highrise-play` where nothing counts. `view.js` + `daily-run.js` only add what is theirs (the end cards' marks, `padOk`).
  `tests/city-polish.test.mjs` reads the flag's proof from `view.js` + `stage.js`.
- **A = A TAP**, through `touch` itself: the drop · TAP TO START (a held daily run's RESUME is that same tap on its welcome) · the stage's
  own card's PLAY AGAIN (its own 600 ms wait). The podium's PLAY AGAIN / REMATCH = A and HOME / ROOM = B are the kit's (`ui/final.js`'s
  `data-pad` marks); the stage's own way out (BACK HOME / BACK TO THE ROOM) and the daily's BACK TO THE DAILIES are marked B.
- **B does nothing in a run; Start, Back, the D-pad, the stick, the bumpers are not mapped at all** — no pause in solo / match, a daily
  hold is never spent by a button. While WATCHING (a match's spectate) a pad does nothing. With a sheet open over the game (the ☰ menu,
  HOW TO PLAY) a press is not a drop under it (`padOk` — the cartridge: no layer open; the daily: no layer over its own overlay).
- **THE PODIUM's MARKS ARM AFTER 600 ms** (`view.js#PAD_ARM_MS` — the stage's own `RETRY_MS`): a rhythm's next press never wipes the end
  screen unread. (Named call — JAYWALK's podium has no such wait; HIGH RISE's A is pressed every second.)
- **"🎮 CONNECTED"** on the first press, ONCE a page — the stage's own quiet line (`.hi-padl`): on the start + the end screens in the free
  row between the corner buttons; in a run at the left, 164 px down.
- **LAZY**: `kit/gamepad.js` is fetched on the first `gamepadconnected` (or a pad already there at the mount) — not in THE FIRST-VISIT
  BUNDLE, not in any cartridge's preload graph (`tests/highrise-pad-go.test.mjs`; the E2E checks the page's own resource list).
- `metas.js` `CONTROLLER: true` — the PLAY sheet's mark.

### EXACT PAD TIMING — the approach
The kit polls once a frame, so it notices a press up to a frame late. The browser's Gamepad object carries the time the press reached
it (`timestamp`, the page's performance clock). The kit now hands `a()` / `b()` two numbers — that stamp and the time of ITS previous poll
(the press lies between the two); JAYWALK's `a()` takes no argument and is untouched. HIGH RISE's `logic.js#padTime(stamp, prev, now,
floor)` takes the stamp ONLY inside that window (+ 34 ms before the previous poll), never in the future, never before the last logged
tap — anything else (no stamp, an older Safari whose Gamepad clock counts seconds) falls back to `now`, the frame it was noticed, which
is what a pad would have got without this. The chosen time is handed to `touch()` exactly as a finger's `event.timeStamp` is: the same
tick mapping, the same engine `tap()`, the same log — the tick logged is the one the server replays.
Measured with a fake pad that keeps its own clock (as a real one does): Chromium — the kit noticed presses 5–14 ms after their stamp,
every drop logged at the stamp's tick; WebKit here (software GL, ~10 fps) — noticed up to 48–104 ms late, still logged at the stamp's
tick: presses made dead on landed 5 PERFECTS of 5.
`/highrise-play?fps=1` shows it on a real phone: the fps line ends `· PAD −12.4 ms` (counted that long before the frame that noticed
it) or `· PAD = FRAME` (no usable stamp on this browser — the old behaviour).

## GROUP 2 — THE SOLO GO (`js/games/highrise/go.js#soloGo`, PURE)
- Was: ONE write, ONE 4 s wait → UNPROVEN. Now THE MATCH's PATTERN: up to 7 tries 420 ms apart when a write is REFUSED (looked at and
  tried again), THE SERVER's copy of the node read again every 1.25 s while an answer is owed, 9 s in all. A late answer still PROVES
  the run. A write still in the air (queued behind a dead line — it lands when the line is back) is NEVER sent twice. A refusal that
  took ≥ 4.5 s to come back is the rules' own 5 s window after THE STAMP — never retried, never the re-publish alarm: "no answer".
- No answer → the run plays UNPROVEN and SAYS SO: **NOT COUNTED / NO CONNECTION** on screen for as long as the run is on (the stage's
  `.hi-nc`: two short plain lines, left, 164 px down — under the console's SIGNAL LOST banner, clear of a three-digit floor number; no
  pill) and as its end card's reason line. Any other unproven run (the rules refused it, a replay on that card) says NOT COUNTED — NO LINE
  TO THE BOARD the same way (named call: "once it's known" = every unproven solo run).
- **THE MATCH's ONE GO IS SPENT** the moment a run goes on unproven (named call): PLAY AGAIN on that card starts at once, NOT COUNTED —
  never a second 9 s wait, never a run on a minutes-old GO that landed late. BACK HOME → PLAY NOW is the counted way back.
- THE DAILY's GO is untouched (the server's START).

## GROUP 3 — THE BOUNCE (verify) + THE INITIATE MESSAGE
- `e2e-play-bounce.mjs --game highrise` (bounce + quick): **Chromium at 4× CPU 34/34** — 10 of 10 PLAY NOW → leave → 6.5 s → PLAY NOW
  land on `game:highrise:*` with no wake at the gate and no red line; 10 of 10 quick re-plays inside the start's walk land in the NEW room.
- **WebKit found one leftover of the console's** (JAYWALK showed it too: 5 of 6): the new game landed, but the DROPPED first start still
  said COULDN'T START over it. `host.js#playSoloNow` now says it (and leaves) only while the phone is still in that start's room — a
  start the player left was dropped, not failed. After: WebKit highrise 22/22, JAYWALK quick 12/12. The wake hold is untouched.
- `game-options.js`: INITIATE + MOST WANTED's one tap — a start that comes back `false` having said nothing (the cartridge would not
  load, the host-write gate held it) says **COULDN'T START — TAP PLAY AGAIN** (`saidNothing`: only when host.js showed no message of its
  own — THE MESSAGE is one at a time). `playSoloNow` has no silent leave left. `tests/city-part1-host.test.mjs` green.

## GROUP 4 — SMALL + LAB ONLY
- `night.js#upRange`: nothing to send (`cnt` ≤ 0) = no upload at all (it used to mark the attribute and re-send its last range);
  `_updateRange` still written in place, never `addUpdateRange` (the zero-garbage tests green).
- `/highrise-play`: `&dpr=2` (the pixel ratio capped at 2 at every tier) · `&stutter=1` (the tier rule's STUTTER half). The cartridge + the
  daily never pass them: LIVE DEFAULTS UNCHANGED.
- **THE LAB NUMBERS — THE BEELINK, NOT AN iPHONE** (headless Chromium on the box's own GPU, 390 × 844 @3, `?floor=80`, the bot playing
  10 s; `PERF_CLIMB=0 PERF_Q='&look=…&floor=80[&dpr=2]' highrise-play.mjs --perf`): every case — tier 2 / 1 / 0, night + day, 1× + 4×
  CPU, with and without `&dpr=2`, and `&dpr=2&stutter=1` — reads **60.0 fps, p95 16.8–17.1 ms** (three single 33 ms frames in 30 runs).
  The box is pinned at its display's 60 and cannot tell the cases apart: no fps claim for a phone comes from it. What it does show:
  `&dpr=2` takes effect (tier 2 draws 390 × 844 @2, not @3), and the draw calls are as before (night tier 2: 14 calls · 8,504 tris;
  day / tier 1 / tier 0: 6 calls · ~4,250 tris).

## THE LOOK (three passes on the two quiet lines; `Downloads\NEON\highrise-pad-go\`)
1. top left under the ☰ (56 px): collided with the console's SIGNAL LOST banner — which is up exactly when the line matters — and with a
   three-digit floor number. 2. one line → TWO short lines ("NOT COUNTED" amber / "NO CONNECTION" white), 104 px wide, in a run at 164 px
   (below the number, the banner, the band's name + the announcer's lane); on the start + end screens the free row between the corner
   buttons. 3. by day (the bright sky's ink + halo), at 390 / 402 / 430 + 1440 × 900.

## TESTS
- Unit 2,691 (new: `tests/highrise-pad-go.test.mjs` — 13: `padTime`'s window, the kit's hand-off on a stubbed Gamepad API, `soloGo` on
  a fake line (late answer · dead line · refusals · a rejoin · the late refusal · the GO guard), the pins).
- `e2e-highrise.mjs` (+ step 7 THE CONTROLLER, step 8 THE SOLO GO; `HI_ONLY=padgo` = those alone) · `wk-highrise-pad.mjs` (the same pad
  checks in WebKit — `kit/highrise-pad.mjs`) · `e2e-highrise-daily.mjs` (+ the pad's daily case) · `e2e-play-bounce.mjs --game highrise`.
- **THE FINAL RUN (the Beelink, one suite at a time, on this pass's own emulators + server):** unit 2,691 · rules 104/104 (untouched —
  run anyway) · `e2e-highrise` 125/125 (the long run in it) · the pad case in WebKit 22/22 · `e2e-highrise-match` 59/59 ·
  `e2e-highrise-daily` ALL GREEN (37) · `e2e-highrise-daily-b` ALL GREEN (16) · `e2e-play-bounce --game highrise` 34/34 (Chromium 4× CPU;
  WebKit 22/22) + JAYWALK's quick 12/12 in both · `e2e-jaywalk` 122/122 (the kit + `host.js` changed) · smoke 24/24 · harbor
  `ONLY=gamestart,newstart` 23/23. Budgets: THE BOOT 306 modules (unchanged — the limit 310; the pad kit is not in it), HIGH RISE's graph
  42 modules / 487 KB of 48 / 560 (+ `go.js`). `/api` untouched: `server.test.mjs` not run.

## OPEN FOR BEN
1. **RE-PUBLISH: nothing.**
2. **A REAL PAD ON YOUR iPHONE** (the pass had only a fake one): `https://neonspeakeasy.com/highrise-play?fps=1` — connect the pad,
   press A: "🎮 CONNECTED", A again starts, A drops. The fps line's end says `PAD −n ms` (exact timing is on: the press counted n ms
   before the frame that noticed it) or `PAD = FRAME` (this Safari's pad clock is not usable — a pad then plays as it would have
   without this, never worse). Then a counted run from the city, and the daily.
3. **THE LAB FLAGS** (night + day, your call): `…/highrise-play?fps=1&floor=80` against `…&dpr=2`, and `…&dpr=2&stutter=1`.
4. **CALLS TO OVERRULE**: the pad wired in the stage (the test page + the daily get it) · the podium's A / B count 600 ms after it shows ·
   no pad action while watching or under a sheet · an unproven run spends its match's GO (replays on that card start at once, NOT
   COUNTED) · NOT COUNTED — NO LINE TO THE BOARD shows on screen for the other unproven reasons too.
5. **A NEW CALL, NOT BUILT**: with no line, TAP TO START can now sit dimmed for up to 9 s before the run starts NOT COUNTED (it was
   4 s). A "CONNECTING…" word under it after a second or two would say why — your look, your call.
6. `host.js` (the console's, every game's PLAY NOW): a start you LEFT no longer says COULDN'T START over the next run.
