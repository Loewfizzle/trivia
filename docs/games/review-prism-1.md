# FABLE REVIEW — PRISM DROP (Nov 10 2026, read-only)

> **PFIX-A (Nov 10 2026) fixed MUST FIX 1–5, question D, the night gain and OPTIONAL 18 (+ half of 22) — each carries its `PFIX-A:` line.
> MUST FIX 6–7 (a rules change → RE-PUBLISH), SHOULD FIX 8–10 and the other optionals are PFIX-B's (docs/games/plan.md "PFIX-A").**

A fresh reviewer who did not build PRISM DROP's rework (PD-1 … PD-5B), over `main` at `1a245b06` (the game's last commit: `609e1a64`, PD-5B).
Nothing in the game, the server, the rules, the tests or the styles was changed. Every finding below was proved with a probe on the pure
modules (node, the way `tests/prism*.test.mjs` call them), a browser run on the emulators (`node scripts/serve.mjs 5173 --emu` — two to eight
real phones, or the real view in `tests/integration/prism-preview.html`), or a file + line. The probe scripts were deleted after the run; what
each did is written beside its finding so the fix pass can turn it into a test. The live site was not touched. Scope: THE GAME (rules, edge
cases, both looks, speed, sound, the awards) — the console's hookups are FR7's, named here only where they break PRISM DROP itself (finding 3).
Safari / iOS can't run on the build machine: everything said about the iPhone is reasoned from the code, and listed for Ben at the end.

## The verdict

**Not yet — close. The game is good to look at, fast and well covered by its own suites, but five things would spoil a night with friends,
and two more must close before strangers play.** For Ben + friends: (1) a piece that is rotated a few times a second NEVER locks — a player
can hang a piece for minutes and no attack row ever lands on them; (2) a phone whose tab is hidden (the app switched, a call) is an unlimited
pause that cannot lose — it WON a match by waiting; (3) every match leaves its whole screen in memory (≈ 12 MB of canvas a match measured at
2×, ≈ 25 MB estimated on a 3× iPhone; 377 MB after 30 rematches, nothing released back in the room) — on an iPhone that is blank boards or a
page reload inside one game night; (4) two players topping out in the same quarter second (the likely end of an even duel under sudden death)
gives NO WINNER; (5) a refresh replays the last ≤ 3 seconds, and a clear made there attacks TWICE. Before the public: (6) the three cards'
flags, QUAD and the scores are whatever a phone says they are, and (7) the attack queue accepts 1 200 back-dated rows in one burst. What is
solid is most of the game: the bag, the scoring + attack tables, the host change (the same patch twice), the schedules, the ghost rows up to
their 12-row cap, both looks at 390 / 402 / 430, 60 fps at 4× CPU in the heaviest moment in both looks, the tiers' order, the WebGL contexts,
the song cache, the suites (unit 84 / 84, FAST 56 / 56, the 8-phone FULL 81 / 81).

## MUST FIX (breaks play, cheatable or crashes)

### 1. A piece that keeps being rotated never locks — and the queued rows never land
- **What:** `engine.js:443–448` adds to `lockT` only while the piece is grounded and ZEROES it whenever the piece is not (`else if (g.cur) {
  g.lockT = 0; }`, line 447). The 15-reset limit (`MAX_RESETS`, `afterMove` 172–176) stops a MOVE from resetting the timer, but a rotation
  whose kick lifts the piece off the floor un-grounds it for a tick — line 447 then resets the timer anyway, for free, forever. Attack rows
  land only at a lock (`landJunk`), so while the piece hangs nothing queued ever arrives. Only the scheduled rows (sudden death at 10:00,
  SURVIVAL's) still come.
- **Proved (the probe):** a node matrix on the real engine — eight levels from 1 to 20 × a rotation every 100 / 150 / 250 / 400 ms × two patterns, the I, T, S
  and J pieces (Z and L are their mirrors), 90 s each. Alternating clockwise / counter-clockwise every 100 ms: all four NEVER lock, at any
  level; clockwise only: the long piece never at 100 / 150 ms; left / right wiggling DOES lock (the reset limit works for moves). In BATTLE with
  8 rows pending: spinning for 240 s → 0 pieces locked, `pending` still 8. On the real view with REAL TOUCH TAPS (a two-phone match, 270
  taps in 45 s — one every 167 ms, a thumb's pace): pieces locked 0, `resets` 15 the whole time.
- **Fix:** once `g.resets >= MAX_RESETS`, never zero `lockT` when ungrounded (line 447: `else if (g.cur && g.resets < MAX_RESETS)`), or lock
  at once on the next ground contact (question A). Pin: the matrix as `tests/prism-engine.test.mjs` — every piece locks within
  `LOCK_MS × (MAX_RESETS + 2)` of first touching down, whatever the input pattern, + the long piece over a 4-wide pit.
- **Size:** tiny (one condition + the test).

**PFIX-A: FIXED (question A — locks at once)** — `engine.js`: once the piece has touched down (`touched`), every move / rotation spends a reset,
grounded or kicked up; with the resets spent, the lock delay is used up in the air → it locks on the tick it touches down again. A second
cause the matrix found: "lowest" was the box's origin, which a rotation moves without the piece going lower — the long piece won its 15
resets back on every turn; now the lowest CELL. Pin: `tests/prism-engine.test.mjs` — the matrix (320 cases: levels 1, 3, 5, 8, 10, 12, 15,
20 × 100 / 150 / 250 / 400 ms × alternating + CW only × I, T, S, J + the long piece over a 4-wide pit): before 258 of 320 never locked, now
every one within 7.1 s of first touching down (the limit 8.5 s), the queued rows land on that lock; + "the next touch-down locks at once".

### 2. A hidden tab is an unlimited pause — and it can win
- **What:** the view's only clock is its frame loop (`frame()` is the one caller of `E.update`, the scheduled rows and `publish`). A tab that
  is hidden stops its frames but keeps its socket: presence stays online, so the director — which throws a player out by PRESENCE only
  (`director.js:67–68`, offline ≥ 30 s; the board's own `at` is never read) — never counts them gone. Their board freezes: no gravity, no
  attack row lands, no sudden-death row rises.
- **Proved (the probe):** two real phones on the emulators. BOB's tab hidden 36 s (a second tab brought to the front): never out, the 4 rows
  ALICE sent never land. Then the play clock moved to 10:00: ALICE topped out under the sudden-death rows, the hidden BOB was declared THE
  WINNER. In the director's own simulation an ONLINE player whose board stays silent for 340 s is never thrown out.
- **Fix:** the director also counts a player gone when their board's `at` is ≥ `OFFLINE_OUT_MS` stale during `play` (the view already
  publishes while frames run — make the 3 s save a heartbeat); and the view saves on `visibilitychange → hidden` + `pagehide` (see 5). Pin:
  a director simulation (online, silent 31 s → out, credited to nobody) + the e2e's hidden-tab step.
- **Size:** small.

**PFIX-A: FIXED (question E — 30 s, AWAY)** — `director.js`: a board whose `at` is ≥ `OFFLINE_OUT_MS` stale during play (a board never written:
from GO) is out, `away: true` + `gone`, credited to nobody; the KO card says AWAY, the others "X — AWAY"; the view's save is the heartbeat
(≤ 3 s apart while frames run) and it saves at once on `visibilitychange → hidden` + `pagehide`; a board the director put out stops. Pins: the
director simulation in `tests/prism.test.mjs` (online + silent 31 s → out, no credit, never the winner; the review's 340-s probe → out at 30 s)
+ `e2e-prism.mjs`'s AWAY step (both paths: a tab hidden 36 s — presence online the whole time — out after 30 s, the KO card "KO · AWAY · 2ND
PLACE", the other phone wins).

### 3. Every match leaves its whole screen in memory — nothing is ever released
- **What:** two causes, both needed. (a) THE RETAINER is the console's `js/ui/fit.js:16` — the module-level `live` Set holds every fitted
  name's `fit` closure (which holds its element) until a font next finishes loading, and one whose element was not in the page when a fit
  ran is "kept" forever (line 33). After the first minute no font ever loads again. The podium's names sit inside PRISM's own root
  (`.pd → .pd-overlay → .pd-final → .final → .pod-name`), so each kept `fit` pins the whole old `.pd` tree. (b) PRISM's `unmount()`
  (`view.js`, after line 228) destroys `world`, `light`, `page`, `rail`, `input` — but not `board`, `fx`, `nfx`, `calls`, `synth`,
  `heardBeat`, nor the anonymous `ResizeObserver` of line 228, and no canvas is sized to zero; so the pinned tree keeps every pixel: the
  board canvas + its two offscreens (`board.js:455` / `459`), `pd-light`, `pd-world`, `pd-page`, HOLD / NEXT, the fx sprites, the podium's
  `pd-fs-board`.
- **Proved (the probe):** two real phones, the host's `startGame('prism')` then `rematch()` × 29 (each match: both bots play 2.5 s, one is
  topped out, the podium). Counters injected before the page's scripts (every canvas by WeakRef + its pixels, WebGL contexts, ResizeObservers,
  convolvers, audio buffers) + CDP's heap / node / listener counts after two forced collections. The host's phone, at 390 × 844 @2:

  | after match | 1 | 2 | 5 | 10 | 20 | 30 | back in the room |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | live canvas pixels, MB | 26 | 38.7 | 75.1 | 135.4 | 256.2 | **377** | 431 (the city on top) |
  | DOM nodes | 4 296 | 5 611 | 6 605 | 8 236 | 11 498 | 14 770 | 15 406 |
  | listeners | 232 | 270 | 321 | 406 | 580 | 750 | 813 |

  ≈ +12.1 MB, +327 nodes, +17 listeners a match, the same on the second phone; canvases in the page: 13 throughout (the rest are detached
  but alive). A second probe recorded each leaked canvas's creating line — exactly one PRISM screen a match (the lines above). A heap
  snapshot's shortest path from the roots to match 1's detached `.pd`: `FontFaceSet` listener → `live` (Set) → `fit` → the `.pod-name`
  text → … → `.pd`. THE CAUSE EXPERIMENT: after five matches the probe emptied that Set by hand → all four old screens were collected at
  once (nodes 6 592 → 5 288); disconnecting the left-over ResizeObservers instead changed nothing. On a 3× iPhone the board's three
  canvases are 2.25× larger: ≈ 25 MB a match (an estimate). Safari caps a page's total canvas memory in the low hundreds of MB.
- **Fix:** (a) `fit.js`: `live` holds `WeakRef`s (or the fit drops out the first time it runs on an element that is not connected after
  its first frame) — a console fix, but PRISM pays for it, and so will every game with a podium; (b) PRISM's `unmount()` destroys
  everything `mount()` made and sets every canvas it owns to `width = height = 0` (the pixels go even if a node lingers); give `board.js`,
  `fx.js`, `neonfx.js`, `audio.js#createSynth` a `destroy()`. Pin: this probe as `tests/integration/e2e-prism-leak.mjs` (6 rematches: the
  old roots' WeakRefs collected, live canvas MB flat within one match's worth).
- **Size:** small (the retainer is one line; the destroys are mechanical).

**PFIX-A: FIXED (both causes) + OPTIONAL 18** — (a) `ui/fit.js`: the late-font list holds WeakRefs; a fit lives as long as its element (the
`fits` + `anchors` WeakMaps — `vault/full.js` anchors its own); nothing else changes. (b) PRISM's `unmount()` destroys everything `mount()` made
(`board.destroy` — its canvas + both offscreens, `fx.destroy`, `nfx.destroy`, the callouts, `synth.destroy`, the ResizeObserver, the hide /
pagehide listeners) and zeroes every canvas under its root; an update after the unmount does nothing. ONE reverb a page (`audio.js#chainFor`).
Pin: `tests/integration/e2e-prism-leak.mjs` (two phones, 6 rematches, the host's phone at 390 × 844 @2 after two forced collections) — on the
OLD code: canvas 34.3 → 50.1 → 67.7 → 83.4 MB, nodes +335 / match, listeners +16.5, a convolver a match, no old screen ever collected (all
red); now: 34.3 MB flat, nodes 2 990 → 2 994, listeners 194 → 195, the old match roots collected, no convolver after the first match (all
green). The probe's own trap, found on the way: a puppeteer `waitForSelector` handle is a DevTools global handle — it pinned the podium (the
test now never keeps one). The 30-rematch run + OVERCLOCK's numbers: docs/harbor/passes/pfix-a.md.

### 4. Two players out in the same host tick = no winner at all
- **What:** `director.js:92` — `patch.winner = alive[0] || null`. When the last two boards say `out` inside one 250 ms tick, `alive` is
  empty: `winner: null`. The end step (`:117`, `:120`) then finds no winner — the podium says NO SURVIVORS, EVERY Call the Winner pick is
  marked wrong, and the server still credits a win to whoever ranks first. Sudden death raises the same rows at the same server moments on
  both phones, so a near-simultaneous top-out is the LIKELY end of a long even duel, not a freak.
- **Proved (the probe):** the director's simulation, 2 and 8 players, the last two boards set `out` between two steps: `winner: null`,
  `calls` all `ok: false`; through `extractMatch` rank 1 gets `win` and both get `firstko` when each named the other.
- **Fix:** when a tick empties `alive`, the winner is the board that went out LAST (`at`; an exact tie → more rows sent, then join order) —
  question B. Pin: the simulation above in `tests/prism.test.mjs` (a winner always exists in a 2+ BATTLE; exactly one `win`).
- **Size:** tiny.

**PFIX-A: FIXED (question B)** — `director.js#outOrder`: the boards out in one tick in the order of their server stamp, an exact tie → fewer rows
sent first, then the later joiner (`players/{uid}/joinedAt`), then the uid; when they are the last, the one out LAST is the winner (no out
entry — place 1). Pin: `tests/prism.test.mjs` — 2 and 8 players, the last two out in one step: the later one wins, exactly one first place,
Call the Winner right for it; the tie rules; the same patch twice.

### 5. A refresh replays the last ≤ 3 seconds — a clear made there attacks twice
- **What:** `publish()` (`view.js:563`) saves the board every 3 s (or when forced: out, the rush end); an attack is pushed the moment it
  happens (`:505`). There is no save on `pagehide` / `visibilitychange`. A refresh restores a board up to 3 s old: the same pieces come
  again, the player repeats the clear, and its rows go out a second time. `restore` also drops each pending row's delay (they are due at
  once — on screen a rising band turns HOT) and puts the piece back at the top.
- **Proved (the probe):** two real phones; ALICE's bot makes a 4-line clear, the page is reloaded 400 ms later, the bot plays on: BOB's
  queue holds `[4, 4]` from one clear. The node probe on `save` / `restore`: `pending[].at` all equal the clock after a restore.
- **Fix:** force a save in the same frame as every attack push and on `pagehide` + `visibilitychange → hidden`; better, key each attack
  by the sender's piece index (`prismq/{match}/{target}/{uid}-{n}`, create-only) so a replay cannot push it twice (it also closes most of
  7); save `at − clock` for each pending row. Pin: the e2e's refresh step asserts the target's queue after a clear + reload.
- **Size:** small.

**PFIX-A: FIXED (no rules change)** — the attack is SAVED in the same frame it is sent, the board is saved on `pagehide` / hidden; the attack's
key = `{uid}-{piece index}` (create-only in the CURRENT rules — a replayed piece is refused; the receiver orders by the server stamp `at`, a
restored board skips every attack stamped ≤ its save's mark `sv.ak = '@<ms>'`); each pending row keeps its remaining delay + its rise
(`pd` gets two numbers). The rest of 7 (the server's `now`, one attack per piece in the RULES, the target not out, `sv` closed) is PFIX-B's.
Pin: `e2e-prism.mjs`'s REFRESH step (both paths: a 4-line clear, a reload 400 ms later → the board comes back after the clear; the same
piece's clear replayed → refused; the queues hold ONE [4] from it).

### 6. The awards, QUAD and the scores are whatever a phone writes
- **What:** the ground rule is that anti-cheat never depends on a secret and the server replays results. PRISM's results are not replayed:
  the director copies each phone's own node into `results`, and `match-report.js#prismExtra` (`:203`) bounds them only loosely. The rules
  for `prism/{match}/{uid}` (`database.rules.json:665`) check `sv.b`, `sv.n`, `sv.ak` and nothing else, at any time.
- **Proved (the probe):** a plain participant on the emulators with the REAL rules, every write ALLOWED: `sv.st = [1, 1, 1, 99]` + `sv.pk =
  40`; `best: 'quad'` with `ln: 1`; `sc: 999 999 999`; a 1 MB string in `sv.x`; topping out with `by` = a player who never sent a row;
  rewriting `by`, `sv.st[3]` and `sc` AFTER the KO and again in the END phase. Run through the real director + `extractMatch`: the player
  who never sent a row holds FIRST KO; the one who never emptied the board holds QUAD + PERFECT CLEAR; a SOLO run's forged count gives
  `f: { pc: 1 }`. COMEBACK needs a real win, but its danger-zone half (`dz` from `sv.pk`) is the phone's word.
- **Fix (the cheap half — it narrows, it does not close; question C):** rules — `sv` closed (`$other: false`; `st` four bounded numbers;
  `pk` 0–40; `sc` bounded), a node frozen once its `st` is `out` and whenever the phase is not `play`; the director credits `by` only if
  the victim's queue (rule-checked sender) holds a row from that player in the last 20 s; `prismExtra`: `quad` needs `ln ≥ 4`, `pc` needs
  `ln ≥ 2 × pc` and a plausible piece count, both only from a match that lasted long enough. Pin: the forged writes as
  `rules.test.mjs` refusals + the forged match in `tests/profiles.test.mjs` (no flag).
- **Size:** medium (a rules change → RE-PUBLISH).

### 7. The attack queue takes 1 200 rows in one burst, at a player already out, and `sv` has no size limit
- **What:** `prismq` (`database.rules.json:743`) is create-only with `n` 1–30 and `at` newer than a minute — no rate, no tie to a clear, no
  check that the target is still in. The engine lands at most 12 rows a lock, so a flood is a certain KO a few pieces later.
- **Proved (the probe):** one participant, the real rules: 40 pushes × 30 rows, each back-dated 59 s (due at once) — all 40 accepted
  (1 200 rows); a push at a target already `out`; a push from a player whose own node says `out` before the director's next tick; a
  1 MB `sv` (every phone in the room downloads it). Refused, as they should be: `f` = someone else, your own queue, from a player the
  director marked out, in SURVIVAL, during the COUNTDOWN.
- **Fix:** `at` must be the server's `now`; one attack per piece (the key of finding 5); the target's node must not be `out`; the view
  ignores what would take its queue past ~40 rows; `sv` closed (finding 6). Pin: `rules.test.mjs`.
- **Size:** small (the same rules change as 6).

## SHOULD FIX (before the public)

### 8. More than 12 rows queued: the rows that land FIRST are the ones not drawn
- **What:** `incoming.js:21–27` (`ghostBands`) gives the 12 rows of room (`GHOST_MAX`) to the NEWEST band first. With more queued, the
  oldest band — due first — is left off the board, and the tag's "+n" names the wrong band.
- **Proved (the probe):** the pure module against the engine's real queue. Under the cap: 400 random queues, 0 disagreements (count, gap,
  sender, order). Above it — 4 rows (old, due) + 6 + 6: drawn NEW 6 + MID 6, the tag "INCOMING 16 · MID +2"; what the next lock really
  lands: OLD 4, MID 6, NEW 2.
- **Fix:** fill the room from the OLDEST band. Pin: that queue beside `incoming.js`'s cases in `tests/prism.test.mjs` (the drawn rows = the first 12 to land).
- **Size:** tiny.

### 9. The SCORE RUSH bound is 100–200 × above honest play
- **What:** `maxRushScore(lines, seconds)` (`match-report.js:59`) with `ln ≤ sec × 4`: the server accepts 60 000 000 points / 900 lines for
  one song; `maxRushScore(923, 230.8)` ≈ 222 M. The bot at full skill scores in the hundreds of thousands. A forged score just under the
  bound tops `prism-score` for good. (The cap against the new, longer day songs is right: the longest, 230.8 s + 10 ≤ `RUSH_MAX_S` 241,
  pinned by `tests/profiles.test.mjs:188`.)
- **Proved (the probe):** `extractMatch` on forged finals, stepping the score until refused.
- **Fix:** a bound from a sim — the best of N full-skill bot runs per song length × a margin (≈ 3 ×), and lines ≤ what the level curve
  can drop in the time. Pin: the sim's number in `tests/profiles.test.mjs`.
- **Size:** small.

### 10. By day a slow phone waits ~15 s for the one tier that helps
- **What:** the tiers step 3 → 2 → 1 → 0 one at a time (`view.js:647–651`); 2 and 1 only shrink the LIGHT layer — which the day look does
  not draw. Only tier 0's 2× board helps by day.
- **Proved (the probe):** the preview's heaviest loop (`&heavy=1`, 7 rail tiles, the bot) at 4× CPU under SOFTWARE compositing (a stand-in
  for a weak GPU — not an iPhone): DAY HEAVY 15 / 17 / 19 / 38.5 fps at tiers 3 / 2 / 1 / 0; on AUTO it took 15.5 s to reach tier 0
  (19.8 fps on average until then). NIGHT under the same: 25.6 / 28.5 / 30.6 / 58.2. The order was always 3 → 2 → 1 → 0, never skipped,
  never bounced.
- **Fix:** by day a step down goes straight to the tier that changes something (a `day` column in `tiers.js`, or skip tiers whose only
  change is the light layer). Pin: a unit test on `tiers.js` — each day step changes at least one thing the day look draws.
- **Size:** small.

## OPTIONAL (label: polish)

11. **A fast lock inside the clear hold is not drawn until the hold ends (night):** `board.js:565` draws the held pre-clear stack for
    240–300 ms (`view.js:455`); a piece locked or rows landed inside it appear only when it ends, and the landing preview is
    off for as long (`board.js:620`). End the hold on the next lock. Pin in `tests/prism-pd5b.test.mjs`.
12. **END GAME / everyone leaving repeats the song:** the playlist advances only in the director's end step (`director.js:126–129`);
    `host.js#backToLobby` mid-match leaves it, so the next match deals the same first song. Advance at `start`.
13. **A later-due band behind a not-due head is drawn HOT but cannot land** (the engine's head-of-line rule in `landJunk`); draw it rising
    until the head is due.
14. **The INCOMING tag can sit on the landing ghost piece** (the preview's `&inc=1&rise=hot`, day `&inc=3`); a half-risen row shows a half
    cell at the bottom-left.
15. **SURVIVAL's final row** says "SURVIVED 2:31 · 40 LINES" with the raw seconds "151" as the number at the right — show 2:31 there too.
16. **The header is blank ~0.4 s** when an announcement fades (`.has-ann` hides `.pd-info` until the fade ends).
17. **The first night → day switch** at 4× CPU hitches once (frames of 100 / 83 / 100 / 100 ms ≈ 0.4 s — the day art warming); warm
    switches 17–33 ms, ten flips in a row: no canvas growth. Warm the day art in idle slices after GO. (pd-4.md's "17 ms" was measured
    with the throttle off.)
18. **PFIX-A: FIXED** — **One reverb a match:** `createSynth` (`audio.js:219`) builds a convolver + a ~1 MB impulse per mount (31 after 30 matches); build it
    once per page.
19. **A KO credited to a player already out** (`director.js:40` checks only that `by` is a participant): fair for rows sent before they
    fell — say so in a comment, or drop it.
20. **REBOOT** (SCORE RUSH's top-out, `view.js:539–549`) skips one piece of the bag (`eng.n++`) — harmless, undocumented.
21. **Any signed-in user can read a room's boards + another player's queue** (rooms are readable by design; nothing secret is in them).
22. **(PFIX-A: the preview's attack goes through `set` now — a promise; the rest PFIX-B's)** **Test tools:** the FAST e2e prints "FAILED FAST done" on a pass (the label, exit 0); `prism-shots.mjs:184`'s PERF section waits for
    `networkidle0`, which never comes on the `--emu` server; `fake-firebase.js:19`'s `push` returns no promise, so the preview throws on
    every attack (`view.js:505`'s `.catch`).
23. **For FR7 (the console, seen in passing):** four `fit.js:69` ResizeObservers (the podium + the strips) and one `canvas-safe.js:111`
    (the city's crisp layer) are never disconnected, per match; harmless once finding 3 is fixed, but they are the same pattern.

## QUESTIONS FOR BEN (the code can't decide these)

- **A. When the 15 lock resets are spent, what locks the piece?** Recommended: it locks AT ONCE the next time it touches down (what
  players of the genre expect; no stall of any kind). The other choice: the 0.5 s keeps counting whatever the piece does.
- **B. Two boards out in the same instant — who wins?** Recommended: the one that went out LAST by its server stamp; an exact tie → more
  rows sent. Never "no survivors" in a match of 2+.
- **C. How much anti-cheat for PRISM DROP?** Recommended now: the cheap bounds of findings 6 + 7 + 9 (they stop the lazy forgeries, and
  the cards are cosmetic). A real answer — the phone logging its inputs and the server replaying the board, as OVERCLOCK's results are
  re-checked — is a pass of its own; worth it only once `prism-score` matters to strangers. Until then PERFECT CLEAR in a SOLO run has
  no witness at all: keep it (recommended — it is one common card) or make it room-only.
- **D. AUTO-TARGET never forgets.** **PFIX-A: DONE** (`logic.js#TARGET_MEMORY_MS` 20 s; a grudge target → the random pick once forgotten).
  The probe as a test (8 equal players, 400 attacks, 40 seeds): the biggest share 1.89 × an even split on average (worst 4.28) → 1.37 (worst 1.77). Your rule (the most recent attacker still alive) is what the code does — a hit four minutes old still
  picks the target. With 8 equal bots and 400 attacks the rows received were 46 / 23 / 34 / 20 / 44 / 23 / 96 / 114: two players take
  half of everything. Recommended: forget an attacker after ~20 s (the KO credit's own window) and fall back to the random pick.
- **E. A phone away from the game — how long before it is out?** Recommended: the same 30 s as a lost signal, with the KO card saying
  why. (Finding 2 needs a number.)

## WHAT'S SOLID (checked; the fix pass need not re-check)

- **The engine:** the 7-bag (every 7 pieces one of each; the longest long-piece drought 12); the fixed tick (the same result at 30 / 60 /
  120 fps and with 250 ms frames); hold (once a piece, no hold-spam path); the kicks; twists, back-to-back, combos, perfect clears and
  the scoring + attack tables against the plan; the counter cancels the OLDEST rows first; 300 000 random actions (inputs during a clear,
  a lock, at the top) — no bad state, no negative, no cell outside the well.
- **The director:** the same step twice = the same patch (a new host differs only in `duelAt`); offline 30 s → out; SURVIVAL's and sudden
  death's rows the same on every phone from the seed + the server clock; a rush tie = both rank 1, neither a win; SOLO is never a win
  (`win = !solo && …`), no solo board, as documented; COMEBACK KID stays OVERCLOCK-only (`achievements.js:71`, `catalog.js:201`).
- **Real phones (the FULL e2e + the probes):** identical pieces on all 8; a refresh, a killed host, an offline player, a late joiner,
  Call the Winner, the rematch; the rules refuse another player's `f`, your own queue, an out player, SURVIVAL, the COUNTDOWN.
- **The ghost rows up to 12:** count, gap, sender, order and the shatter on a cancel always match the engine's queue.
- **The look, both looks, at 390 / 402 / 430 unzoomed (+ 1440 × 900):** readable at full speed; nothing under the corner buttons; HOLD /
  NEXT fade under a piece; the rail with 7; SLAM right + left; the BUTTONS scheme; every callout; the KO card; Call the Winner;
  spectating; the podium body; Reduced effects; right / wrong never by colour alone. The day's star burst is drawn UNDER the stack; no
  effect covers the stack or the incoming rows.
- **Speed (390 × 844 @3, 7 rail tiles, the bot, 4× CPU, the GPU on):** NIGHT + DAY, rest + the heaviest loop: 59–60 fps at every tier, the
  frame's CPU p95 ≤ 6.7 ms; on AUTO it never leaves tier 3. The order under load: the light first, the board's 3× last.
- **Memory, apart from finding 3:** WebGL contexts 90 made / 3 alive after 30 matches; the song cache steady (2 held); no listener growth
  on window / document / body.
- **Sound, by the code + the muted suites:** every beat-timed thing reads the one heard-beat clock; the listener's lead is capped at ±60 ms
  and falls back to the grid; the listener is silent-safe (gain 0); a missing file, a locked or muted context = a silent, working game;
  the host's look at `start` is `game.set`, in the room, so a new host or a refresh keeps it; no repeat within a night (but see 12).

## THE SUITES (run as they are, nothing changed)

`node --test tests/prism*.test.mjs` 84 / 84 · `FAST=1 e2e-prism.mjs` 56 / 56 (exit 0) · the FULL 8-phone `e2e-prism.mjs` 81 / 81, errors
none, 353 s. None of them reaches findings 1–7: no test rotates a grounded piece for longer than the lock delay, hides a tab, tops two
boards out in one tick, checks the target's queue after a reload, writes a forged node, or plays more than one rematch.

## WHAT BEN SHOULD CHECK ON HIS iPHONE (Safari can't run here)

The preview is the REAL view with a scripted room (tap once for sound). `&pdperf` adds the live speed readout.

1. **The beat, as heard — the day songs that start mid-file** (their start is ONE byte-range request placed by an assumed 112 kbps; Safari's
   MP3 decoder may trim the start differently from Chrome's, and the swap from the quick slice to the whole song is on one sample). The
   flash must land on the kick, the readout must not say `deaf`, and there must be no click or jump a few seconds in:
   - http://192.168.1.187:5190/tests/integration/prism-preview.html?beat=1&song=prismd4 (the cue 35.7 s in — the riskiest)
   - http://192.168.1.187:5190/tests/integration/prism-preview.html?beat=1&song=prismd1
   - http://192.168.1.187:5190/tests/integration/prism-preview.html?beat=1&song=prismd2
   - http://192.168.1.187:5190/tests/integration/prism-preview.html?beat=1&song=prism1 (a night song, from the top — the reference)
2. **The same link with AirPods / a Bluetooth speaker:** the flash will lead the sound until SPEAKER DELAY (☰ → Settings) is set; check the
   slider can bring it in. iOS reports no output delay — the code assumes 20 ms for the built-in speaker.
3. **The stall (finding 1):** tap rotate about five times a second on a piece that has landed — it never locks:
   http://192.168.1.187:5190/tests/integration/prism-preview.html?n=3&st=47&sb=34
4. **The heaviest moment, both looks** (a 4-line clear every 0.65 s + six incoming rows + 7 tiles) — it should hold 60 and stay on the top tier:
   - http://192.168.1.187:5190/tests/integration/prism-preview.html?n=7&stack=6&bot=1&heavy=1&look=night&pdperf
   - http://192.168.1.187:5190/tests/integration/prism-preview.html?n=7&stack=6&bot=1&heavy=1&look=day&set=day&pdperf
5. **A live look switch** on either link above: ☰ → Settings → THE GAME LOOK, day ↔ night, twice — the first change to day may hitch once.
6. **Fast thumbs:** hammer SLAM and the board — no page zoom, no text-selection bubble, no magnifier, no missed first tap; then the
   mirrored rail: http://192.168.1.187:5190/tests/integration/prism-preview.html?n=7&slam=left&look=day
7. **The corners on your own phone** (the real safe areas, the Dynamic Island): nothing under ☰ / the music button, HOLD / NEXT clear:
   http://192.168.1.187:5190/tests/integration/prism-preview.html?n=7&inc=6&look=night
8. **On the live site, with a second phone** — https://neonspeakeasy.com/?pdperf — one BATTLE each:
   - switch apps for a minute mid-match, then come back (finding 2: you were paused; the song must be back on the beat within a bar);
   - lock the phone 10 s and unlock (the song resumes, in time; the board did not fall);
   - pull down to refresh right after a big clear (finding 5: the other phone gets the rows twice);
   - the ring switch on silent, then Low Power Mode: the game plays, silently / at its speed;
   - **ten rematches in a row** (finding 3): watch for a blank board, a blank rail tile or the page reloading itself.
