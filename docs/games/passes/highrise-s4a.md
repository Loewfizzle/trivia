# HIGH RISE S4A — THE SOUND SYNC + THE HIDDEN CARTRIDGE + COUNTING (built, switched OFF)

Nov 19 2026 · the Beelink · the owner's decisions: `docs/games/plan.md` "HIGH RISE — S4A" · the game's doc: `docs/highrise.md`
("THE SOUND SYNC" · "THE CARTRIDGE" · "THE PROOF" · "THE SWITCH" · "THE LINES" · "THE CARDS").

**RULES CHANGED: `rooms/$code/hr/$match/$uid` (HIGH RISE's proof node — go, c/$i chunks, e, k) — RE-PUBLISH `database.rules.json` in the
Firebase console** (the DAILY A change — `dly/jaywalk/$day/w/$uid/$try` — is still in the same pending re-publish: one publish covers
both). Until then a cartridge run plays UNPROVEN (its own seed, never counted, NOT COUNTED — NO LINE TO THE BOARD): nothing breaks.

## THE GROUPS (all built — nothing skipped)
| group | what | commit |
| --- | --- | --- |
| Step 0 | the decisions into `docs/games/plan.md`; the Lab's marks re-exported (no open FIX mark) | 3577a686 |
| 1 | THE SOUND SYNC — the engine's hold-awake lease, HIGH RISE + JAYWALK hold it, a drop's sounds in the touch, the decodes before the first tap; the test page's run loop → `stage.js` | 30e04529 |
| 2 + 3 | THE HIDDEN CARTRIDGE (owner-only, solo) + THE PROOF (`hr` node + rules) + THE JUDGE on the server + THE SWITCH (OFF); the board; THE NEXT FRIEND's pink tag + tape | 3bea081e |
| 4 + 5 | THE CARDS (catalog, hidden) + the pass's tests | a18fe3f7 |
| the close | THE FRESH-EYES REVIEW's fixes + their tests, the docs, the final run | this commit |

The inbox (`Downloads\NEON\ADDONS.md`) was read at the start, after each group's commit and before the final tests: **no entry TO HIGH
RISE S4A** (none open TO HIGH RISE S3 either). Written to it: the FYI **TO CITY** (the engine's hold-awake API + why) and this pass's
OPEN FOR BEN.

## GROUP 1 — THE SOUND SYNC
- **The cause, confirmed in the code:** with the site's MUSIC OFF (PODCAST MODE — CITY I) `engine.js` naps the context `NAP_MS` 150 ms
  after the last source ends; a drop comes every 1.4–2.4 s; so nearly every effect ran `wakeFor` → a resume. A touch's `unlock` runs
  at **touchend** on iOS — the drop's sound, asked at the pointerdown, sounded at the finger's LIFT.
- **The fix:** `holdAwake(on, who)` — a 3 s LEASE the game renews once a second from its frame loop (docs/audio.md "THE HOLD");
  HIGH RISE's `stage.js` holds it START → the end card, JAYWALK's `view.js` + `lab.js` the run's start → its end; a drop's own
  sounds are asked in the touch handler (`soundNow`); START waits ≤ 0.6 s for the nine decodes (`sfx.js#ready / whenReady`; the late
  path counted — `lates()`).
- **BEFORE / AFTER** (`tests/integration/sound-sync.mjs`, 390 × 844, headless Chromium, REAL touches — 14 taps HIGH RISE, 16 swipes
  JAYWALK; the gap = a landing sound asked → its source's start, the engine's own record):

| | BEFORE (the hold switched off in the page) | AFTER |
| --- | --- | --- |
| HIGH RISE · MUSIC OFF | 8 wake-ups · 4 naps · gap p50 0.2 ms · **max 13.2 ms** | **0 wake-ups · 0 naps** · gap p50 0.2 ms · max 0.3 ms |
| JAYWALK · MUSIC OFF | 9 wake-ups · 8 naps · gap **p50 9.8 ms** · max 12.9 ms | **0 wake-ups · 0 naps** · gap 0.0 ms |
| HIGH RISE · MUSIC ON | 0 · 0 · max 0.4 ms | 0 · 0 · max 0.3 ms (unchanged — the hold is a no-op) |
| JAYWALK · MUSIC ON | 0 · 0 · 0.0 ms | 0 · 0 · 0.0 ms |

  Desktop Chromium resumes a context in ~10 ms from anywhere; an iPhone waits for the gesture's end — the owner's phone is the proof
  (OPEN FOR BEN). After: 42/42 checks (every gap ≤ 20 ms, no wake-up / nap in a live run, the context naps again on the end card, a
  leave drops the hold, the session type never changes, no late sound).
- **The refactor:** the test page's `mount()` became `js/games/highrise/stage.js` (`createStage(app, o)`) so the page and the
  cartridge run ONE loop; `play.js` = the page (THE DOOR, its flags, its best). The page's 217 browser checks + its unit pins stayed
  green through it (the pins that named `play.js` now name `stage.js`).

## GROUPS 2 + 3 — THE HIDDEN CARTRIDGE, THE PROOF, THE JUDGE, THE SWITCH
- **How the owner starts it:** on his phone (the server's OWNER yes) — **PLAY → HIGH RISE · TEST → PLAY NOW**. Nobody else is offered
  it; a start from another phone is refused; the smoke test's HIDDEN GAMES check now counts it among the 11 that never start.
- **The boot:** 307 / 310 modules · 6,478 of 6,500 KB (+4.7 KB: the GAMES row, the stand-in mark, the loader line, the board's row,
  the engine's hold + its measure). No meta at boot. THE PER-GAME BUDGET: a new line (highrise 160 modules / 2,450 KB — its graph past
  the boot = 27 modules, 245 KB).
- **The proof + the judge:** `proof.js` (pure) — JAYWALK's node + clock rules, number for number; the rules mirrored from `jw`
  + "no chunk before GO, nothing after the end". `api/report.js`: JAYWALK's two branches generalised to `PROOF_GAMES` (JAYWALK's
  behaviour unchanged — its 99-check e2e + the server suite are green).
- **THE SWITCH:** `api/_lib/highrise.js#HIGHRISE_COUNTS = false`. OFF = judged → `status: 'would_count'` + the would-award; nothing
  written (the `/api` test compares the WHOLE database outside the rooms before / after).

## GROUP 4 — BESTS, YOUR TABLE, THE PINK TAPE, THE CARDS
- YOUR BEST in the cartridge: the server's once counting is ON (`hi:best`), this phone's while OFF. The board `highrise-solo`: a tower
  as ONE sort number (floor → perfects → the earlier tick; fmt `floor`).
- THE NEXT FRIEND: the pink right-edge tag + the pink tape (the gold tape's shader — the same program), PASSED LIAM. Empty while
  counting is OFF; the e2e shows it from a fixture.
- THE CARDS: in the catalog + THE LAB (225–228), hidden (nothing awarded while OFF).

## THE FRESH-EYES REVIEW (a subagent that did not build the pass — the rules diff, the switch, the hold, the owner gate, the view + the shots at 390 × 844)
Found sound: the rules (no write to another player's node, no chunk rewritten / deleted / re-stamped, GO once, nothing after `e`), the
switch (every HIGH RISE path ends before `credit()`; the `retry` resend can never credit it; the test flip is unreachable in
production), the hold (a lease: released, lapsed or dropped on every path; never the session, the music, the hush, the cut), the gate,
the chunk packing. **Fixed from it:**
| # | its finding | the fix |
| --- | --- | --- |
| 1 HIGH | a GO answer landing after the 4 s timeout flipped the running UNPROVEN run to "proven" on another seed + clock; the rejoin took `go` from the mirror (an estimate while a GO is unacknowledged) | every answer checks its own call first (`stale()`) and writes nothing; a late GO marks the match's one GO spent; a rejoin reads the node from the SERVER (`view.js#askGo`) |
| 2 MEDIUM | the host's podium judges its live mirror — a chunk in flight carries the phone's estimate of the server's time and could read as stamped before the one ahead of it: an honest run shown NOT COUNTED | `proof.js#judgeNode({ mirror })` — the podium's read takes the times as never running backwards; the SERVER stays strict; the end screen shows the server's answer whatever the host's row says |
| 3 | the end screen's YOUR BEST was read before the stage stored the new best | stored before the end screen is asked for; while OFF the screen says NEW BEST · WAS n from this run's own record |
| 4 | the hold was taken only after GO returned — outside the tap | taken in the START touch + renewed while GO is on its way |
| 6 | after NO SIGNAL the stage's card stayed armed under the podium (a key could restart) | `hideCard()` at the podium; a key never acts under it |
| 7 | "writes nothing": a match from before the progress reset sealed a `results/` record before the switch | the switch is asked ONCE, before that write; the `/api` test's snapshot = the whole database outside the rooms |
| 8 | the two tags stacked against the floors' order when both were held at the column's edge | the gold tag steps the other way: the higher floor stays above (the e2e measures it) |
| 9 | the sync measure's listener could pile up on a context that never runs; a hidden page's last taps waited for the return | capped at 8; flushed at hide |
Its #5 (rules, LOW — as `jw`: a host on a modified client can flip `game/phase` and delete his own live tree; self-harm in solo, a
griefing path for S4B) is NOT changed here (it is `jw`'s rule too) — carried to S4B's notes + the test gaps it named were added
(a kicked writer, the final phase, GO + chunk + end in one update, the bounds, index 9999 / `01`).

## THE CALLS MADE (obvious / established pattern — the owner may overrule)
- THE SWITCH lives in code (`api/_lib/highrise.js`, ONE line) — not in /admin: go-live is a pass, and a code flag can not be flipped
  by accident; the emulators get a test-only database flip.
- The cartridge shows **TAP TO START** on a first run (GO is written at that tap); **PLAY AGAIN starts at once** (the tap was the
  PLAY AGAIN) — JAYWALK starts with no tap, but a slab would be sliding before the owner looked.
- A room of two or more can not start it yet (the console's COULD NOT START) — THE MATCH is S4B.
- The board's value is ONE sort number (floor → perfects → earlier tick) so YOUR TABLE + the board rank by the game's own rule; every
  place a HIGH RISE record is shown decodes the floor (`floorOf` / fmt `floor`).
- PASSED LIAM in the announcer lane + the streak's sparkle a step up at a friend's crossing; the tag's words "LIAM 57 · ONE MORE" on
  their floor (the gold tag's own wording).
- The end screen's frame: the header HIGH RISE · SOLO; the console's SOLO RUN · NAME · n block gives way to the body.
- The cards are still pictures (no layer of their own) until go-live's polish; the tube mark is a stand-in (THE REVIEW's icon brief).
- `noteSeen` (the account's hashed address — SECOND ACCOUNTS) still runs on every report, HIGH RISE's too: it is not an award.

## THE FINAL RUN (the Beelink, this pass's OWN emulators + `serve.mjs --emu` on :5173 — nothing else busy; Ben's preview server on :5190 untouched)
| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` (incl. the CLAUDE.md size + THE BOOT BUDGET + THE PER-GAME BUDGET) | 2324 / 2324 |
| rules `rules.test.mjs` | 87 / 87 |
| /api `server.test.mjs` | 67 / 67 |
| `e2e-highrise.mjs` (the full run — counting ON by the test flip + the hitch run in the cartridge) | 59 / 59 · 0 frames over 33 ms in 63 floors (one 633 ms stall = headless Chromium's own, ~2 min after launch) |
| `highrise-play.mjs` (the test page, on the shared stage) | 217 / 217 |
| `highrise-lab.mjs` | 45 / 45 |
| `sound-sync.mjs` | 42 / 42 |
| `jaywalk-podcast.mjs` · `jaywalk-lab.mjs` · `e2e-jaywalk.mjs` (FAST) | 5 / 5 · 103 / 103 · 99 / 99 |
| `e2e-smoke.mjs` (THE PAGES LOAD — Chromium + WebKit: /, /admin, /board, /lab, /daychart, /jaywalk-lab, /highrise-lab, /highrise-play) | 25 / 25 |
Shots: `Downloads\NEON\highrise-s4a\` (the owner's shelf + card, the start, a run, the end card with WOULD COUNT, the pink tag +
tape, the counted end card). Found on the way (not this pass's): `e2e-jaywalk.mjs` run WITHOUT its shots folder taps PLAY NOW in the
card sheet's first moment and is dropped — run it with an outDir (as always); `e2e-highrise.mjs` waits 450 ms there itself.

## OPEN FOR BEN
1. **RE-PUBLISH `database.rules.json`** (the `hr` proof node — and DAILY A's still-pending `dly/jaywalk` node in the same publish).
2. **YOUR PHONE CHECK — THE SOUND SYNC** (MUSIC OFF, the speaker): `/highrise-play` and JAYWALK — does every drop / hop sound ON its
   slab / hop now? (Desktop Chromium can not show an iPhone's resume delay: your ear is the proof.)
3. **YOUR PHONE CHECK — THE CARTRIDGE** (after the re-publish): PLAY → HIGH RISE · TEST → PLAY NOW → a run → the end card's small
   line **WOULD COUNT · FLOOR n · +XP** → PLAY AGAIN. Before the re-publish the same path ends on NOT COUNTED — NO LINE TO THE BOARD.
4. Named calls, yours to overrule: the list above — above all TAP TO START on a first cartridge run (PLAY AGAIN starts at once), the
   switch as a code flag, and the pink tape on the rooftops' own pink slabs (floors 0–6 by night: the tape is the site's pink per your
   pick — it reads by its glow there; say if it should be lighter / white-cored).
