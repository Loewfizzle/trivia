# The match kit (`js/games/kit/`, `css/kit.css`, `tests/integration/kit/harness.mjs`)

The shared pieces every real-time match needs, pulled out of PRISM DROP, SLIPSTREAM and GRIDLOCK (which now use them).
A new game is its pure rules + its one distinctive screen; everything below comes for free.

## In the page (`import { … } from '../kit/index.js'`)
| piece | what | how |
| --- | --- | --- |
| `createAnnouncer(lane, { prefix, holdMs, fit })` | the announcement lane: max one visible, a short queue, a log for tests; `fit: true` puts `--len` (the first line's letters) on each element so the css sizes it to the lane (PRISM DROP's callouts) | `ann.announce('FINAL TWO', 'world')`, kinds → `is-<kind>`; a `
` = a second, smaller line |
| `createCards(overlay, { prefix })` | full-screen title cards (VICTORY, YOU'RE OUT…), one at a time | `cards.card(title, sub, ms, kind)`; `cards.showing(kind)` |
| `showCall({ … })` | Call the Winner: an eliminated player picks who wins within `CALL_MS`; refresh-safe; writes `{ w, at }` to `path` | `candidates` (≥ 2), `line(uid)`, `intro(n)`, `ended()`, `onState(msg)`, `sfx()`, `ring: true` = a countdown RING (20 ticks + the seconds, opacity only) beside the title in place of the bar (PD-2) |
| `reportPanel({ title, head, rows, calls, player })` | the stats table under the podium + the calls list | rows: `{ uid, name, color, me, cells[] }`; `ordinal(n)` |
| `createTiers({ apply })` | quality tiers 2/1/0 from frame pacing (p75 > 19.5 ms steps down; 8 s of headroom steps up, never to a tier that failed; a step down is a PROBE — no faster after 4 s AND light work (≤ `CAP_WORK_MS`) = a 30 Hz cap → back up; a busy CPU is never read as a cap — JAYWALK VARIETY B1, the shadow pops) | per frame: `tiers.sample(now, workMs)`, `tiers.tick(now[, frameTimes])`; `get/set/fps/work` |
| `installTestHook(name, api)` / `removeTestHook` | `window.__<game>` for the E2E, only on `?emu` / localhost (`always: true` to force) | mount / unmount |

Styling: elements carry `mk-*` classes (css/kit.css; theme with `--mk-accent`, `--mk-accent-2`, `--mk-grad`, `--mk-dim`, `--mk-ink` on
the game root, which should also have class `mk-root`). A game that passes a `prefix` ('sl', 'pd', 'gl') gets `${prefix}-*` classes
instead and keeps its own CSS — that is how the three existing games adopted the kit with zero visual change.

**What a game EXPORTS + what the console GIVES it (the room, the game start, the city pause, the banner, the rematch vote, the chat's lock, the
DAILY plug-in): `docs/cartridge.md` (LOBBY 2.0 B — js/games/cartridge.js, checked by tests/cartridge.test.mjs).**

Not in the kit (already shared elsewhere): the podium + WINNER reveal (`ui/final.js#createFinal`), room playlists + Call the Winner
bonus (`core/playlist.js`), synced song playback (`audio/synced-songs.js`), toasts, `h()`, avatars, chips.

## THE PODIUM's FRAME (SHELL 2.0 A — `ui/final.js#createFinal`; review-6.md D8, agreed with the Overclock chat)
The CONSOLE owns the end-of-match screen's frame: the kicker + the WINNER line, the BODY, the XP box (`profile/callouts.js`) with the end-of-round
moment + THE CARD REVEAL after it (in their order), then ONE button — **BACK TO THE ROOM**, THE NEON TUBE's main, right under the XP box (in view
at 390; the host's tap brings the room back, a guest's walks them back alone) — then the results list. No REMATCH / lobby buttons on the podium:
the rematch vote + NEW GAME live in the room's dock. **A game's own body:** export `finalScene(el, game, state)` from its module (cartridge.js
OPTIONAL) and draw into `el` (OVERCLOCK's "OVERCLOCKED", a tube-sign name, its podium, award chips, SOLO's NEW PERSONAL BEST); without it the
console's podium rise. **The results rows** (every `leaderboard()` — the podium + a game's standings) are each player's SLIM CARD
(`ui/strip-board.js`): the place number beside the strip, the score over its top-right, ONE shared effect surface, every strip calm.

## THE READY HELPER, THE ROOM's LOOK + COLOUR-BLIND (SHELL 2.0 B1, Nov 5 — docs/cartridge.md "THE CONTRACT")
- **"Everyone tapped"**: `js/games/kit/ready.js#readyState({ taps, players, online, since, now, minMs = 1500, maxMs })` → `{ ready, n, of, waiting, why }`.
  PURE (call it in the director): only CONNECTED players count, the screen holds at least `minMs`, a DROPPED player never blocks, `maxMs`
  moves on anyway, a match where nobody is connected goes after `minMs`. `now` / `since` = the server clock.
- **The night's memory**: `js/games/kit/night.js` — `markUsed(gameId, keys)` in a step's `$room`, `usedOf(state.meta, gameId)` to read
  (`rooms/{CODE}/meta/used/{gameId}/{key}`: survives rematches + new games, gone with the room).
- **THE GAME LOOK** (`js/games/kit/look.js` — SHELL 2.0 B2; B1's sun / moon tube above PLAY is gone, the owner: "more confusing than
  helpful"): ☰ → Settings → **GAME LOOK: AUTO · DAY · NIGHT** (AUTO = the real sun, the default), in the room AND in a game, PER DEVICE (a
  multiplayer match too — it only changes your own screen), **NO LOCK**: a change mid-game re-themes your screen at once. While ANY match
  is on screen the console sets `body[data-look="day" | "night"]` (app.js#paintLook — the `ns-look` event + a minute's sun re-read). A game
  draws NO switch of its own: it READS the look LIVE (`body[data-look="day"] .xx-…` in its css; `document.body.dataset.look` in a canvas,
  re-read each frame or on the `ns-look` event). **A ONE-LOOK GAME** (OC1 — its meta's `LOOKS: ['night']`, OVERCLOCK) is painted in that
  look whatever the setting says, and the setting row says `NIGHT · LOCKED` while it's on screen (docs/cartridge.md `LOOKS`).
- **COLOUR-BLIND**: right + close are the shared tokens `--good` (green) and `--close` (gold) from css/base.css — EVERY game reads them,
  never its own greens / golds for right / close. SETTINGS → "Colour-blind colours" (per device + on the profile — `ui/colorblind.js`)
  sets `body[data-cb]`, which swaps them to BLUE + ORANGE. **Right / close are never shown by colour alone**: a shape or a mark too
  (✓ / ✕, a ring, a word), so a phone in the sun or a colour-blind player still reads them. OVERCLOCK's right / close lines read the tokens
  since B1; the hidden games come over when each comes back.
- **The kit's reserved pieces** (OVERCLOCK pass 1 builds them, prefix `gk-`): `numpad.js` · `keyboard.js` · `tach.js` · `slam.js` ·
  `answer.js` (docs/cartridge.md D9).

## THE PROOF TREE + THE PROOF WRITER (THE PROOF PASS, Nov 20 — the code JAYWALK + HIGH RISE share)

A **proof game** (JAYWALK `jw`, HIGH RISE `hr`) is counted ONLY from the server's replay of what each phone wrote into its own node. Three
shared files hold what both games used to copy — a new proof game takes them, it never writes its own:

| file | what |
| --- | --- |
| `js/core/proof.js` | PURE, no imports (phone · host · server). `firstGo` · `goOf` · `onTime` · `goUids` · `stampOf` · `inMatch` · `fullDraw`; the numbers `GO_WINDOW_MS` 5 s · `LEAF_MS` 3 h · `T0_SUNSET_MS` — each PINNED equal to `database.rules.json` by `tests/proof-pass.test.mjs` |
| `js/games/kit/proof-writer.js` | PURE, no imports. The chunk + end writer (below) |
| `js/games/kit/proof-io.js` | the writer's database half (`proofIo`) + GO: `stampT0(tree, label)` · `writeMatchGo(tree, uid, label)` |

**THE TREE** `rooms/{CODE}/{jw|hr}/{matchId}` = `{ t0, {uid}: { go, c/{i}, e, k?, rs? } }`.
- **THE STAMP `t0`**: whoever GOes first stamps the tree — the SERVER's time, once, only while the tree is EMPTY, by a seated un-kicked
  player of that match in the GO window. Nobody (not the host) moves or deletes it.
- **GO**: own uid, once, the server's time, only **within 5 s of the stamp** (+ the old seat / kick / participant / window checks — they
  can only refuse). Until **Nov 27 2026 09:00 UTC** (`T0_SUNSET_MS` — THE SWITCH-OVER) a GO is still taken in a tree WITHOUT a stamp: a
  phone that has not refreshed since the deploy never writes one, and its run must still count. After it every GO needs the stamp
  (nothing to re-publish: the date is in the rule).
- **The leaves** (`c/{i}` · `e` · `k` · `rs`): own uid, once, the player's OWN `go` there, within 3 h of it. **They read NOTHING the
  host writes** — not `game/phase`, not the match id, not the player list, not the kick list.
- **THE LOCK**: the host deletes ONE tree only once its stamp is 10 min old (a tree without a stamp: his own GO, as S4B) —
  `core/room-logic.js#proofUnlocked` asks only for what the rules allow.
- **THE SERVER's TWO GUARDS** (`api/_lib/jaywalk.js` · `highrise.js`, the host's podium too): a node counts only WITH its GO
  (`goUids` — `api/report.js#provenUids`); a GO later than `GO_WINDOW_MS` after THE FIRST GO is no run (`bad: 'late go'`). And **a GO
  alone is not a player**: a match's `played` = the uids with a MOVE in the server's own replay (a hop / a landed slab) — the report
  counts + credits only those.

**THE HOLES THESE CLOSE** (the review's MUST 2 — `docs/games/passes/highrise-review.md`; each pinned for BOTH nodes in
`tests/integration/rules.test.mjs` "THE PROOF PASS"): (a) THE LEAF WRITES — the host flipped the phase, a rival's chunk was refused, the
log had a hole; (b) THE PRE-DATED GO — the host's old GO under a future match id unlocked the live tree; (c) THE EARLY FIRST GO — the
host GOes alone, adds the rivals later, their runs have already timed out.

**THE WRITER** (`createProofWriter` — one a run): ONE BURST AT A TIME (the next chunk leaves once the one before is acknowledged — a
later chunk never lands before an earlier one) · A REFUSED CHUNK IS READ BACK + SENT AGAIN (0.4 · 0.8 · 1.6 · 3 s …, for 90 s) · NEVER
DROPPED ON THE MIRROR ALONE (a mirror that says "the match moved on" only makes a refusal expected; dropped after `LATE_TRIES`
refusals in that state — the quiet `late-proof` count) · A DEAD LINE (no answer for 1.5 s): the new moves queue behind the unanswered
chunk once a second and land TOGETHER (THE DROPPED SIGNAL: the judge wants a burst) · THE END behind the last chunk's
acknowledgement · `pipe: true` = the old way (JAYWALK's daily: its own node + rules). A view calls `W.reset({ sent, next, verify })`
at each adopt, `W.flush(force)` from its frame, `W.end(payload)` once, `W.close()` at unmount.

**THE FRESH-EYES REVIEW's fixes (the same pass):** the HOST names the players, so **the TREE says who played** — every uid with an
on-time GO is replayed + may report, named at the end or not (`api/report.js`: the host dropped the leader from `game.participants`; a
run is SOLO only when the tree holds no other player's GO) · **a refused log still PLAYED when its first chunk replays a move**
(`firstChunkHops` / `firstChunkFloor`: a sore loser breaking his own log after the podium stays a player who lost — the winner's win
stands) · a Call the Winner pick is a uid's shape, ≤ 64 (`k/w` had no bound) · `hr`'s `rs` only within 10 s of its player's GO.

**WHAT THIS DOES NOT CLOSE (named):**
- ~~THE HOST ENDS THE MATCH FOR EVERYONE BUT HIMSELF~~ — **CLOSED by THE CONSOLE FIX (Nov 20)**: the section below.
- The host can still WRECK his own room's match (never win by it): delete the whole room, pre-stamp a match id, never write `final`.
- Up to ~3 s of head start inside the 5 s GO window (tick 0 = THE FIRST GO + 2 s); until the sunset a host who never stamps keeps the
  old lock on his tree (the server's guards still refuse him the win).
- **The HOST-GRADED games (THE BEFORE-LAUNCH PASS, Nov 22 — the section HOST TRUST below):** CLOSED — PRISM DROP's forged rush score (capped
  at the player's own board), a rush rival past THE RUSH BOUND keeping the win (it loses its place), a live battle / survival board put out
  (refused), OVERCLOCK's forged totals (the server's re-grade), the boards deleted while a report is pending (THE REPORT LOCK), HOLD'EM's
  moved-on table (its `holdsRun`). STILL OPEN (accepted): PRISM BATTLE's fake board that never goes out (console-fix item 4 — a replay
  judge, L); OVERCLOCK's 7 self-graded types (the phone's own `ok`, item 5 — server-dealt answers, L); a challenge's START time is the
  host's within 1.5 s of the SERVER's stamp `game/ps/{ci}` (an old host with no stamp: his FASTEST clock only); DUMB LUCK is the host's
  draw; a host who WIPES the OVERCLOCK seal (flipping game/id, or deleting meta) before reporting gets the boards' own `ok` graded — the
  self-grading of console-fix item 5, for that match; a kicked player in the host-graded games (item 7, your call). A host-graded match of
  2+ whose every report missed its final game (the honest host's move-on waits ≤ 6 s for its own) is NOT paid (the snapshot path).

**THE CHUNK CEILING + THE REPORT BUDGET (THE FIX PASS, Nov 22 — THE FABLE REVIEW's S3 a + b; no rules change).** A node may hold at most
`seconds from its GO to its NEWEST chunk's server stamp × perSec + CHUNK_SLACK (10)` chunks (`core/proof.js#overChunkCeiling` — one key
count + one stamp read a chunk, BEFORE any string is unpacked); past it the node is a REFUSED log (`bad` / `why` = 'too many chunks') in
BOTH judges — the host's director and the server (`jaywalk/logic.js#scoreNode`, `highrise/proof.js#judgeNode`). `perSec` is each game's
own writer bound (a match sends each move within its flush interval, stop-and-wait: JAYWALK `ceil(1000 / CLOCK.flushMatchMs)` = 9,
HIGH RISE 7 — the review's "× 2" would have refused an honest fast match). The review's burst (2,000 chunks in one 0.3 s write at second 5)
is refused at once; the rules still take the writes (10,000 chunks, the stamp = now) — what changed is that nobody unpacks them. A NEW
proof game: its own `CHUNKS_PER_SEC` beside its judge, the ceiling first. `/api/report` has a per-uid CALL BUDGET (`api/_lib/budget.js`
— api/daily.js's, one helper: 240 calls / 10 min, an honest 6-minute live hold retries ≤ 180 times) → 429 `slow_down`, `retry`.

## HOST TRUST — THE HOST-GRADED GAMES (THE BEFORE-LAUNCH PASS, Nov 22 — `docs/harbor/passes/before-launch.md`)
PRISM DROP + OVERCLOCK (`api/report.js#DROP_GUARD`) are host-authored at `final`; the server now checks the result against what ONLY each
player could write, on the room path (the match still the room's game):
- **PRISM DROP** (`core/match-report.js#prismVerify`, docs/prism.md "HOST TRUST"): SCORE RUSH — every row's score + lines ARE that
  player's own signed board (`prism/{m}/{uid}`; a lowered or missing row too); a row past THE RUSH BOUND ranked with 0 (loses its win /
  place, not only its record). BATTLE / SURVIVAL — a player put out (any place) whose board still says `play`, saved within
  PRISM_FRESH_MS (10 s) of the out → refused (the director only puts out a topped-out board or one QUIET 30 s — "gone" needs the board quiet
  too, so a phone that only SAYS offline is never put out); the out's stamp can't be future-dated (rules: `game/out/{uid}/at ≤ now + 5 s`). The host's placings are still checked against the night record on the
  ORIGINAL; the credit uses the corrected game.
- **OVERCLOCK** (`games/overclock/regrade.js`, docs/overclock.md "THE SERVER's RE-GRADE"): every challenge rebuilt — `ok` = min(the
  board, the server's grade of the SEALED picks), the points from that `ok` + the board's server-stamped `doneAt` + the challenge's start
  read back from the host's `tm` — EVERY finisher's clock (a clamped 0 / 30 s too) and the SERVER's stamp of the start (`game/ps/{ci}` —
  the cartridge's step writes it at the challenge's open; the rules: === now) within 1.5 s; DUMB LUCK's race replayed. The board closes at
  its challenge's unseal (rules — the host grades what was there).
- **A REFUSAL** of a DROP_GUARD match (the re-grade, a live board put out, the placings, the game id, a dropped player) = 409 'mismatch' +
  the quiet count `logstats/wreck` (never sealed — a rival could cause one). **THE SNAPSHOT PATH never pays a DROP_GUARD match of 2+** (its
  checks need the final game; the night record's placings are the host's own): the honest host's REMATCH / BACK first lets its own report of
  the podium's match land (`host.js#settleFinal` — `profile/queue.js#settle`, ≤ 6 s). (The first draft's "sealed wreck" + a 5 s grace on the
  move-on stamps: THE FRESH-EYES REVIEW broke both — a host-written `game.go`, a final never shown.)
- **THE REPORT LOCK** (`database.rules.json` prism · oc · ocm `{match}` — console-fix item 6): never the room's own match, never within
  10 min of its night record (`core/room-logic.js#reportLocked` — the host's prune skips it, never one refused path), no whole-node delete;
  `seal/{CODE}` is kept while an OVERCLOCK match is the room's game (its sealed picks are the re-grade's evidence — host.js wipes the seal
  only from the lobby). RULES CHANGED (the re-publish: the pass summary).
- **HOLD'EM** (docs/holdem.md "THE TABLE IS NEVER TAKEN AWAY"): its own `holdsRun` — seated, not out, the dealer's table not ended (LATCHED
  from the last table the screen showed as its match: the room's game + table vanish in separate events) — and its table by its own listener
  while held (the router freezes `live`).
- Tests: `tests/before-launch.test.mjs` (the pure halves), server.test "THE BEFORE-LAUNCH PASS — HOST TRUST" (a modified host / rival
  on the emulators), rules.test "THE REPORT LOCK", e2e-holdem FAST "THE TABLE IS NEVER TAKEN AWAY". A scripted UI suite's hand-made finals
  (e2e-profiles) switch it off on the EMULATORS only — `testHostTrustOff`, never honoured in production.

## A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST (THE CONSOLE FIX, Nov 20 — `docs/games/passes/console-fix.md`)
A modified host wrote `final` / moved the room on / kicked the leader mid-match — every honest phone left its live run, he played on and won.
- **LIVE** = an on-time GO, no `e`, its proof moved within the idle-out (+ the drop wait offline), the cap (+ grace) not passed —
  `core/proof.js#liveGoers` + each game's `liveOf`: the honest host's own `endedFor` + the cap (an honest match never waits for it).
- **THE SERVER** holds the report (425 `still_live` + retryAfter, both paths — `api/report.js#holdLive`); the queue never runs out of tries
  on it; the cap ends every wait. A proven player is credited seated or not (`seatOk` — a kicked leader).
- **THE PHONES**: no podium over this phone's own live proven run; the out phone keeps watching while a rival's run is live, then the podium
  scored from the nodes (`kit/run-hold.js`, `director.js#finalPatch`, `createFinal({ game })`). **THE RUN HOLD** (`app.js`): a screen whose
  `holdsRun()` is true (forwarded by `games/lazy-view.js`) stays through a moved-on room on a frozen state, plays the run out, writes its end,
  pings the router (`__nsRunHold.check()`) and follows — reporting its own match; never against the phone's own LEAVE / QUIT / move
  (`host.js#movedByMe`). A kick / a lost seat waits the same way (`room.js#runHoldDone`).
- **A NEW GAME ON THE PROOF TREE** gets it by exporting `holdsRun` from its view + a `liveOf` for its server entry (`api/report.js#PROOF_GAMES.live`).
- **THE TREE CAP**: `rooms/{CODE}/pt` counts a room's stamped trees (1,000 — `kit/proof-io.js#TREE_CAP`); the stamp goes up only with it.
- Tests: `tests/console-fix.test.mjs` · `server.test.mjs` "THE CONSOLE FIX" · `rules.test.mjs` "THE TREE CAP" · `e2e-console-fix.mjs`.

**THE ORDER OF A RULES CHANGE HERE**: the phones' code first, the rules whenever after — the new code's stamp is refused silently on
the old rules (`expectRefusal(…, 'none')`) and GO works as before; the old code's GO is taken on the new rules until the sunset.
Tests: `tests/proof-writer.test.mjs` (the writer on a fake line — 300 random host-flip matches: never a hole) · `tests/proof-pass.test.mjs`
· `rules.test.mjs` "THE PROOF PASS" (8 blocks, both nodes, + THE SWITCH-OVER against three copies of the rules).

## THE CONTROLLER (JAYWALK JT2, Nov 22 — `js/games/kit/gamepad.js`; the owner: a SHARED kit piece any game plugs into with one line)
`wirePad({ dir, a, b, say })` → off(): polls `navigator.getGamepads()` once a frame ONLY while wired (a game screen), standard mapping (the
face buttons by position — a Nintendo-labelled pad's A = its right button, `nintendo(id)`), the D-pad 12–15 (+ a hat axis 9 for a pad without
the standard mapping), the left stick (deadzone 0.5, re-armed under 0.3) → ONE `dir('u'|'d'|'l'|'r')` per press, no auto-repeat; A / B press
the page's newest visible `[data-pad="a" | "b"]` control (an end card) else call `a()` / `b()`. A pad's first frame (Safari shows it only after
a press) only LEARNS what is held and says "🎮 CONNECTED" once a page (`say`); a disconnect says CONTROLLER DISCONNECTED. Lazy-load it (the
game's `gamepadconnected` listener — JAYWALK's `view.js#padOn`), never in a start bundle. `ui/final.js` marks REMATCH / PLAY AGAIN `a` and ROOM /
CITY `b`. Plugged in: JAYWALK (JT2). HIGH RISE + the next games: one line each, later. Test: `e2e-jaywalk.mjs` 6d — a FAKE pad on the API.

## The E2E harness (`tests/integration/kit/harness.mjs`)
```js
import { createHarness, REVIEW_SIZES } from './kit/harness.mjs';
const H = await createHarness({ name: 'gridlock', slot: 'g', hook: '__gridlock', sizes: REVIEW_SIZES });
const { pages, log, ok, sleep, waitFor, evalIn, game, G, alive, join, shotAll } = H;
let fatal = null;
try {
  const host = await H.joinAll(4);                              // create a room + 3 joiners, uids filled
  await H.startGame(host, 'gridlock', { mode: 'classic' });
  await waitFor(host, s => s.game && s.game.phase === 'turn', 'first turn');
  await shotAll(host, 'gl-02-turn');                            // 390×844, 412×915, 1440×900 (SHOTS=0 skips)
  await H.cleanText(host, 'turn', '.gl');                       // no "null"/"undefined" on screen
  const hi = await H.killHost();                                // the host's phone dies; a new host claims
  await H.refresh(pages[1]);                                    // rejoin
  await H.perfRun(pages[hi], { extra: p => G(p, 'window.__gridlock.stats()') });   // 60 fps median at every tier at CPU× throttling
} catch (e) { fatal = e; }
await H.finish(fatal);                                          // checks n/m, result.json, exit code
```
Also: `H.touch(page, pts)` / `H.press(page, ms)` / `H.tap` (real CDP fingers), `H.line(x0, y0, x1, y1, n)`, `H.hostIdx()`, `H.kill(i)`,
`H.backToLobby(page)`, `H.rematch(page)`, `H.nameOf(uid)`, `H.FAST` (env `FAST=1`: the suite's own two-minute path), `H.code`.
Env: `N`, `SHOTS=0`, `GPU=1`, `CPU=4`, `PERF=0/1`, `E2E_BASE`.

**Fast lane.** Every suite should have a `FAST=1` path that plays one short match with 2 players and no screenshots (≈ 2 min) —
run it after every fix, and the full suite once before committing. Twenty-minute suites re-run for one change are the single
biggest waste in a session.

## THE RULES FROM CLAUDE.md (moved Nov 13)

THE CLAUDE.md DIET (FR7 FIXES C, Nov 13): CLAUDE.md keeps ONE line per rule with a pointer here; the full text it held for this area
is below, VERBATIM (as of `48e3e157`). New detail goes in the sections above, not back into CLAUDE.md.

### The doc table row

| `docs/match-kit.md` | **any real-time game** (the shared HUD pieces + the E2E harness) — read this before building or changing a game |

### Presentation tech

- **Presentation tech:** Canvas 2D (+ a WebGL fragment shader for a sky/world) unless 3D *is* the game (RUMRUNNER's city diorama is three.js, but it is a backdrop and a map: every button, price and card is DOM over it). Every polish pass on a three.js
  scene costs several times a 2D one, and a tilted 3D board on a phone fights readability and tap targets (GRIDLOCK Part 1 shipped
  on three.js, failed the play-test and was rebuilt flat in Canvas 2D a week later — straight-on, labels inside the frame, one board up).

### Adding a game (the checklist as it stood)

## Adding a game (checklist)
1. **Rules:** `js/games/<id>/logic.js` + `director.js` (pure) → `createGame()` and `nextStep(game, ctx)`; a `tests/<id>.test.mjs` with
   whole-match simulations (2 and 8 players, host-migration replay = the same step twice gives the same patch) **before any UI**.
2. **Contract:** `index.js` exporting what `registry.js` lists (start, prepare, step, livePaths, MUSIC, DEFAULT_SETTINGS, OPTIONS,
   estimateMinutes, finalRanks, nightBonus?, MIN_PLAYERS?) and `createView = lazyView(() => import('./view.js'), gameSheets('<id>'))` (its sheet loads with its screen — anything two games share goes in components.css); register it; add player
   nodes to `ALL_PLAYER_NODES`; `GAMES` in `js/config.js`; `css/<id>.css` + `<link>` in `index.html`; lobby art in `ui/game-art.js`;
   rules in `ui/help.js`; a theme in `css/base.css`; a music id or playlist in `audio/music.js`; THE BOARD: its standings + records in
   `js/core/match-report.js` (with plausibility bounds), its boards in `js/core/boards.js`, its colours in `js/board/view.js#GAME_LIGHT`; its neon mark + blade word for the title city's signs in `js/core/marks.js`.
3. **View on the match kit** (`docs/match-kit.md`): announcer, cards, Call the Winner, the report, tiers, the test hook. The view renders
   purely from `state` (`mount/update/unmount`); write only your own node; check `liveKey`.
4. **Rules file:** `database.rules.json` (own data only, phase/round-gated) + cases in `tests/integration/rules.test.mjs`. **Remind the owner
   to re-publish the rules in the Firebase console.**
5. **E2E on the harness:** `tests/integration/e2e-<id>.mjs` with a `FAST=1` path (2 players, 2 min) and the full path (8 players, host killed,
   refresh, offline player, late joiner, Call the Winner, finish, rematch, frame pacing at 4× CPU). Add it to the smoke test's game list.
6. **Screens** at 390×844, 412×915, 1440×900: three refine passes, looked at, before calling it done. Update ROADMAP.md, this file's
   counts, and write `docs/<id>.md`.

## THE RULES FROM CLAUDE.md (moved Nov 15 — FIXES R2 Part C: the text CLAUDE.md held, verbatim)
## Adding a game (the full checklist: docs/match-kit.md (moved))
1. **Rules:** pure `logic.js` + `director.js` + `tests/<id>.test.mjs` whole-match sims (2 + 8 players, a replayed step = the same patch) BEFORE any UI.
2. **Contract:** `meta.js` + `index.js` (docs/cartridge.md), registered; `ALL_PLAYER_NODES`; `GAMES` in config.js; its css, art, help, theme, music,
   THE BOARD's standings (`core/match-report.js` with plausibility bounds) + boards (`core/boards.js`), its neon mark (`core/marks.js`).
3. **View on the match kit** (`docs/match-kit.md`) — renders purely from `state`, writes only its own node, checks `liveKey`.
4. **Rules file** + cases in `tests/integration/rules.test.mjs` — remind the owner to re-publish.
5. **E2E** `tests/integration/e2e-<id>.mjs` (`FAST=1` + the full path); add it to the smoke test. 6. **Screens** at three sizes, three refine passes; docs.

## THE END NEON (CITY PART 2, Nov 21 — the owner's Nov 19 6:55 pm item 2; passes: docs/harbor/passes/city-part2.md "GROUP 2")
HIGH RISE's approved end look, now EVERY game's — through ONE builder, `js/ui/fin-neon.js` (DOM only: the /highrise-play page builds its card
with it too), the colours from ONE row per game: `js/games/metas.js` `NEON` = `{ name: [[word, colour, outer glow]…], mode: [colour, glow],
line: [colour, glow], day?: { name: [...], mode, line, gold } }` (a NEW GAME = its row; never a per-screen copy).
- **THE HEADER** — `createFinal({ …, mode: 'SOLO' | 'MATCH' })` turns the frame's kicker into `<GAME> · <MODE>` (`finHeader`): the name in its
  sign's colours (HIGH pink + RISE cyan · JAYWALK pink · OVERCLOCK orange · PRISM DROP ice blue · HOLD'EM casino red), the mode softer; shrunk
  to fit between the corner buttons (`fitHeader` — a ResizeObserver + the fonts, never a frame loop). Without `mode` (or a NEON row) the kicker
  as given. **J1 (the owner's call, Nov 21): a game WITH modes shows its MODE in place of SOLO / MATCH** — the row's `modes` through
  `endMode(id, key, solo)`: PRISM DROP · SCORE RUSH / BATTLE / SURVIVAL, HOLD'EM · CASH / TOURNAMENT; JAYWALK, HIGH RISE, OVERCLOCK (QUICK only)
  keep SOLO / MATCH (a new game with modes = its `modes` map, nothing else).
- **THE RESULT LINE** — `finLine(el, id, gold)`: the colour IS the letter (a hair-thin core, its own glow, a deeper outer glow, a dark keyline —
  css/components.css `.fn-*`); a win / finish line GOLD (`.is-gold` through `--c` — the row's colours sit INLINE, a stylesheet can't override
  `--fn`). The console frame's own title (`finFrame` → `.final.has-neon`): WINNER + DEADLOCK gold, SOLO RUN + ALL TIED the accent; a match's
  winner line gold. JAYWALK's cause + YOUR BEST gold; HIGH RISE's card + its in-match OUT card ARE the builder's (A/B on
  `tests/integration/endneon-preview.html` against the old tree: within 8 / 255 at 3×).
- **BY DAY** an end on a light ground (PRISM DROP's crayon paper) wears PAINT — the row's `day` inks, no glow (`body[data-look='day'] .has-day`);
  JAYWALK + HIGH RISE stand on their dark veil in both looks. Contrast ≥ 4.5 : 1, the words carry the meaning: `tests/city-part2-endneon.test.mjs`.
- Called a call: the header's mode is SOLO / MATCH for every game (the owner's format) — PRISM's BATTLE / SCORE RUSH, OVERCLOCK's N CHALLENGES,
  HOLD'EM's CASH / TOURNAMENT left the header (OPEN FOR BEN in the pass log).
- The shared no-flash guard `end-flash.mjs` stays every game's.

## THE RULES FROM CLAUDE.md (moved Nov 22 — THE FIX PASS, THE FABLE REVIEW's M3: the text CLAUDE.md held, verbatim)

- THE PROOF TREE (THE PROOF PASS, Nov 20 — `jw` + `hr`, ONE shared copy: `core/proof.js` + `games/kit/proof-writer.js` + `proof-io.js`): a rule never trusts what the HOST writes (`game/*`) to guard a proof tree — THE STAMP `t0` (the tree's first write, the server's time) · a GO only within 5 s of it · the leaves (c / e / k / rs) on the player's OWN `go` + 3 h · THE LIVE LOCK by the stamp's age, 10 min (`core/room-logic.js#proofUnlocked` — the clients ask only for what the rules allow); the server counts a node only WITH its GO and a match player only with a MOVE in its own replay (a GO alone is not a play); the phone sends ONE burst at a time, re-sends a refused chunk, never drops a move on the mirror alone → docs/match-kit.md "THE PROOF TREE + THE PROOF WRITER" · docs/highrise.md "THE LIVE LOCK".
- A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST (THE CONSOLE FIX, Nov 20): no podium / route / kick over a phone's own live proven run (`screen.holdsRun` · app.js THE RUN HOLD · room.js#runHoldDone); the server holds a proof match's report while a run is live (`core/proof.js#liveGoers` = the host's own endedFor + the cap); THE TREE CAP (`rooms/{CODE}/pt`, 1,000); HOLD'EM's own `holdsRun` → docs/match-kit.md.
