# THE CONSOLE FIX — "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST" (Nov 20, 2026)

**RE-PUBLISH: YES — `C:\Users\benja\Downloads\NEON\database.rules.nov20-console.json`** (identical to the repo's `database.rules.json`).
**THE ORDER:** the deploy first (it is live once Vercel shows this push), the rules **any time after** — Firebase console → Realtime Database →
Rules → paste → Publish. Nothing breaks in between or after:
- **new code + the rules as published now** (the proof pass's): the stamp + counter write is refused (the counter is unknown there), the
  phone falls back to the plain stamp it always wrote — GO, the log, the end as before. Tested (rules.test.mjs "THE TREE CAP" (1)).
- **new rules + a phone still on the old code**: its plain stamp is refused, its GO lands without one (THE PROOF PASS's window, until
  Nov 27 09:00 UTC) — it plays and counts. Tested (rules.test.mjs "THE TREE CAP" (2)). After Nov 27 a phone that old needs its reload —
  ONE DEPLOY AT A TIME does it at the next return. **So: publish within the week** (any day before Nov 27 is fine; today is best).
- Group 1 + Group 2 need no rules change at all: they work on either rules.

The pass in one line: a MODIFIED host could end a match for everyone but himself (write `final`, move the room on, kick the leader) — every
honest phone left its live run, he played on and won. Now a phone with a live proven run plays it to its own end and only then follows the
room, the server never counts a match while a run is live, and the podium waits the same way. Plus the other games' host audit and a cap on
the trees a room can open.

## STEP 0
`docs/games/plan.md` "THE CONSOLE FIX" — the proof pass shipped + re-published (Ben's phone checks: both solos count, THE BOARD lists the
solo-only friend, YOUR TABLE live); this pass's groups. The lab export: 224 marks, no open FIX.

## GROUP 1 — THE RULE (JAYWALK + HIGH RISE, one shared design)
**What counts as LIVE** (`js/core/proof.js#liveGoers`, each game's `liveOf` — `jaywalk/director.js`, `highrise/match.js`): an on-time GO
whose node has no `e`, whose proof moved within the idle-out (18 s; + THE DROPPED SIGNAL's 75 s while its player is offline), and the
match's cap (+ the 4 s grace) not passed. It reads only the players' OWN nodes (their GO, their chunks' server stamps, their `e`), their
own presence and the match's clock (THE FIRST GO) — nothing the host writes. It is EXACTLY the honest host's own "has it ended?" rule
(`endedFor`) plus the cap — `tests/console-fix.test.mjs` checks the two agree for every node at 8,000 random moments of random matches — so
an honest host writes `final` only once nothing is live, and **an honest match never waits for it.**

**THE SERVER** (`api/report.js#holdLive`): on both report paths (the room's game IS the match · the room moved on) a proof match with a live
run answers **425 `still_live` + retryAfter** (2–20 s: the soonest a live run could end with no new chunk). The phone's queue asks again;
a `still_live` answer never uses up its tries (`profile/queue.js` — the server's cap ends every wait). Every on-time GO's run is in the
result (the proof pass's replay). **Never forever:** a dead phone idles out exactly as the host's step does; a modified rival who keeps
writing can stall a report to the cap (6:00 + 4 s), never past it.

**THE PHONES:**
- **The same match (`final` early):** the screen never shows the podium over this phone's own live proven run (JAYWALK `view.js#endScreen`,
  HIGH RISE `view.js#pumpMatch`) — the run goes on, its chunks keep landing (the rules take them on the player's own GO alone), its end is
  written, THEN the podium. A phone that is already out keeps WATCHING while a rival's run is live (`kit/run-hold.js#createLiveWait` — the
  same `liveOf`, at most twice a second, never in a frame of play); once none is (or the cap), the podium — scored from the nodes as they
  stand (`director.js#finalPatch`, now exported; `ui/final.js#createFinal({ game })`), never the early `final`'s numbers.
- **The room moved on** (a new match id, a REMATCH, a new game, back to the lobby): **THE RUN HOLD** (`js/app.js`). A game screen that
  says it holds a live proven run (`screen.holdsRun()` — the cartridge's; `games/lazy-view.js` forwards it) STAYS, given the state it was
  playing in (frozen at the last render of its own route; the people, presence and signal kept fresh); the music, the theme, the look stay
  the game's. When the run is over and its end acknowledged (≤ 8 s on a dead line — Firebase keeps the write queued), the screen pings the
  router (`__nsRunHold.check()`) and the phone follows the room — and queues its OWN report of the match it played out (the host's phone
  never saw that match's podium). **Never against the phone's own way out:** a LEAVE (no room), a QUIT (st.quit changes), a move this
  phone made itself (`host.js#movedByMe` — start, rematch, END GAME / back to the room).
- **A kick / a lost seat mid-run** (`room.js#exitRoom`): while the run is held the exit WAITS (the self-heal never writes the phone back);
  the run is played out and written, then the phone leaves exactly as it would have (`runHoldDone`). A LEAVE, a closed room, a seat moved
  to another device: never held.
- **THE TREE SAYS WHO PLAYED, the seat too** (`api/report.js#seatOk`): in a proof match a player the server's own replay saw PLAY is
  credited seated or not — a kicked leader's run now plays out AND counts. A seat alone still never makes a player.
- Refresh / rejoin / host change: as before (a refresh is the player's own act: a held run in a room that moved on is not resumed — its
  node idles out and counts with what landed).

**Tests:** `tests/console-fix.test.mjs` (the rule = the host's `endedFor`, the writer's `owes`, the podium's wait, the wiring pinned) ·
`server.test.mjs` "THE CONSOLE FIX" (both games: the early `final` → 425 → the leader plays on → counted, HE wins; the room moved on; a dead
phone (online, 19 s silent) counted at once; offline → the 75 s; the cap ends the wait) · **`e2e-console-fix.mjs`** (two phones, each game:
A the early `final` — BOB plays on 5 s later with no podium, his chunks keep landing, ALICE's podium waits, nothing counted until his end,
then the podium on both scored from the nodes, BOB wins · C the room moved on — BOB stays on HIS match, then follows · B the kick — BOB
plays on, his end lands, THEN he leaves the room; counted, BOB wins).

## GROUP 2 — THE OTHER GAMES' MATCHES (the audit; a separate read-only agent + my checks)
Fixed (cheap, fits Group 1's rule):
- **HOLD'EM — the podium over a live dealer table:** a modified host's early `final` painted the podium over the table on `game.phase`
  alone; the honest players stopped acting, their seats went AWAY, his blinds bled them. Now the podium waits for the DEALER's own end
  (`pub.ended`) — `holdem/view.js#paintFinal`.
- **PRISM DROP + OVERCLOCK — THE DROPPED LEADER** (the proof pass closed it for the proof games): the host left the leader off the game's
  list + the night record at `final` → the leader got nothing. Participants are only written at a match's start (`host.js`) and the rules
  take a board only from one of them, so a seated player whose own board proves the match and who is missing from the result now voids the
  count (409 `mismatch` — `api/report.js#DROP_GUARD`). `server.test.mjs` "THE DROPPED LEADER (PRISM DROP + OVERCLOCK)".

NOT fixed — ranked by real risk (the site has little traffic: family rooms, a host you know — that lowers the urgency of every one):
1. **PRISM DROP + OVERCLOCK — a forged result at `final` · MEDIUM in kind, LOW urgency.** Their results are HOST-AUTHORED (report.js takes
   the host's `game` + night; the bounds only gate RECORDS). The owner's standing call: "the host stays trusted (a cheater must be the
   host)" (docs/harbor/passes/fr7-fixes-a.md). Fixes: PRISM rush — cap a row's score at the player's own board (S); PRISM battle / survival
   — refuse a placing whose non-winner board is still `play` and fresh (S–M); OVERCLOCK — the server re-grades from the seed + the sealed
   picks, as CIPHER's `cipherAgrees` does (M–L). No rules change.
2. **HOLD'EM — the room moved on mid-table · MEDIUM, fits Group 1.** The early `final` is closed above; a moved-on room still takes the
   honest players off the table (the dealer keeps acting for the host through `/api`). The fix: HOLD'EM's own `holdsRun` (seated, not out,
   the table not ended) + its table read by its own listener while held (the hold freezes `live`). S–M, no rules change.
3. **PRISM DROP rush — a modified RIVAL's score past the bound keeps the WIN · LOW–MEDIUM.** A rush score over `maxRushScore` loses only
   its record (match-report.js). Fix S: a rejected rush score loses its placing (or voids the match).
4. **PRISM DROP battle — a fake board that never goes out wins · LOW** (docs/prism.md accepts it). Fix L: a replay like THE DROP's judge.
5. **OVERCLOCK — self-graded `ok` on the 7 ungraded types · LOW** (an accepted limit — docs/overclock.md). Fix L: server-dealt answers.
6. **PRISM DROP + OVERCLOCK — the host deletes the match's boards · LOW** (a wreck, never a win: nobody is credited). Fix S + a rules
   change: the delete only when `$match !== game/matchId`.
7. **The other games — a kicked player loses the credit · LOW** (honest UI; the host gains nothing — the ranks stand). The proof games now
   credit a proven player seated or not; for the host-graded games that is a call (OPEN FOR BEN).

## GROUP 3 — THE TREE CAP (rules + tests)
`rooms/{CODE}/pt = { n, m, g }` — the room's stamped-tree counter. Every stamp advances it by one IN THE SAME WRITE (the rules take a `t0`
only with the counter's next step naming that tree, the counter only with a new stamp of a tree that did not exist); it is never deleted,
stepped back or moved alone; **full at 1,000** (`kit/proof-io.js#TREE_CAP`, pinned equal to the rules). The phone: read the count, write
the stamp + the next count in one update; refused (a race, the rules as published) → the plain stamp as before; **the GO now goes up behind
the stamp's answer** (the stamp needs the tree empty). Past the cap a room's runs play as before until Nov 27 (a GO without a stamp), then
unproven — a fresh room (BACK TO THE CITY → PLAY NOW) has its own 1,000; a solo player would need 1,000 runs in one room first.
Tests: rules.test.mjs "THE CONSOLE FIX — THE TREE CAP" (the counter's rules, full at 1,000 before / after the sunset, the switch-over both
ways) + every older stamp test now writes the counter with it (`stampAt`); `tests/console-fix.test.mjs` pins the numbers.

## THE CALLS MADE (obvious / established — overrule any)
- **A kicked proven player is credited** in a proof match (seated or not) — the proof pass's "the tree says who played" carried to the seat.
- **A held run's phone reports the match itself** when it follows a moved-on room (else nobody might — the host's phone never saw its podium).
- **THE TREE CAP = 1,000 a room**, and it counts SOLO runs too (they stamp a tree each).
- **An honest host's END GAME lets the others finish** their live runs (≤ 6:00) before they follow him back to the room — the rule as asked
  ("not the room moving on"); with no night record those matches still count for nobody, as before.
- **Once proven, a phone stays proven** in its match (`everProven`) — the host's participants / `unproven` can not stop its chunks.
- **The end's acknowledgement is waited ≤ 8 s** after the run (END_OWED_MS) before a held phone follows the room.
- **The podium re-scores from the nodes only when it waited** for a live run; an honest podium shows the host's numbers as before.
- **`GPU=off`** (`e2e-console-fix`, `e2e-jaywalk-match`, `e2e-highrise-match`): the software renderer for a machine whose real-GPU path is
  down (it was, mid-pass — the code before this pass hung the same way); the final numbers are all on the GPU.

## THE FRESH-EYES REVIEW (a separate agent that wrote none of it — a modified host, a modified rival, the honest flow)
It proved its attacks against the real rules on the emulator (its own namespace) and by calling `processReport`. What it found, and what was done:
1. **HIGH — the host deletes `meta` alone mid-match:** every phone's meta listener read ROOM CLOSED and left its run (the exit was not
   held); he re-created meta, played on, wrote `final`, and the idle-out cut the rival. **FIXED:** a `closed` exit is held too
   (`room.js#HELD_HOWS`); a room REALLY deleted lets it go at once (its game listener's null — the tree went with it); the meta back = nothing
   closed (the phone stays). The void variant (a host's `meta/activeAt` in the past → every phone's idle close) — the idle close never runs
   while a run is held (`host.js`). E2E case D (`--meta`): BOB plays on through the deletion, stays in the room, wins.
2. **MEDIUM — DROP_GUARD dodged by deleting the leader's seat too.** **FIXED:** seated or not (honest lists always name every participant).
3. **LOW–MEDIUM — the GO now waited the stamp's read + update** (a slow phone near the 5 s window). **FIXED:** a phone whose mirror shows the
   tree stamped or begun writes its GO at once (`writeMatchGo(…, mirror)`) — only the first phone pays the stamp.
4. **LOW — a dropped / kicked leader's own phone never queued its report** (app.js asked the host's list). **FIXED:** a phone with its own GO
   in the tree reports the match, named or not.
5. **LOW — `pt` self-exhaustion:** a host can stamp his OWN room's 1,000 trees by cycling match ids — it only bricks his own room after
   Nov 27 (a fresh room is the answer). Left (named).
6. **LOW (UX, by design) — an honest host's END GAME no longer ends the others' runs:** they play their run out (≤ 6:00), then follow; with
   no night record those reports are 409 as before. Named in THE CALLS.
- **Found while fixing 1–4 (mine): once PROVEN, the host's game could still take it back** — a participants list without the phone, or
  `unproven` written mid-run, flipped `proven` off and the phone STOPPED sending chunks + its end. **FIXED:** the views latch it
  (`everProven` — the tree says who played). (A host who marks a proven match `unproven` still VOIDS it at the server — a wreck, never a win.)
- What held (its list): the `pt` rules (jumps, deletes, a lone counter, a stranger's stamp), presence (the host can only make others
  offline — a longer wait, never shorter), stalling (bounded at the cap; rivals can not move THE FIRST GO), the kicked runner's writes, the
  seatless credit (needs a replayed move off a GO written while seated + named), DROP_GUARD from a rival (a non-participant writes no
  board), the honest 425 (= the director's endedFor; only a beat of presence lag), MAKE HOST to the leader, the double move (the 10-min lock).

## THE FINAL RUN (fresh emulators + this pass's own `serve.mjs --emu`, one at a time)
| check | result |
| --- | --- |
| unit (`node --test tests/*.test.mjs`) | **2411 / 2411** |
| rules (`rules.test.mjs` — all, + THE TREE CAP) | **98 / 98** |
| `/api` (`server.test.mjs` — + THE CONSOLE FIX, THE DROPPED LEADER) | **71 / 71** |
| the other server tests: dailies (module · jaywalk · drop) · HOLD'EM · progression · friends | **24 · 7 · 15 · 21 · 10 · 10** |
| smoke | **24 / 24** |
| `e2e-console-fix` — JAYWALK · HIGH RISE (A early final · C moved on · B kick) | **33 / 33 · 33 / 33** |
| `e2e-console-fix --meta` (D the meta deleted) — JAYWALK · HIGH RISE | **24 / 24 · 24 / 24** |
| `e2e-console-fix` JAYWALK on the rules AS PUBLISHED (the switch-over: new code, old rules) | **33 / 33** |
| `e2e-jaywalk-match` (full) · `e2e-highrise-match` (full · FAST again after the last change) | **92 / 92 · 59 / 59 · 35 / 35** |
| `e2e-jaywalk` · `e2e-highrise` (full) | **99 / 99 · 81 / 81** |
| `e2e-holdem` (FAST) · `e2e-prism` (FAST) · `e2e-rematch` (PRISM · OVERCLOCK · HOLD'EM · JAYWALK) | **21 / 21 · 67 / 67 · 25 / 25** |
| the presence test | **13 / 13** |
| the HIGH RISE test page `highrise-play.mjs` (REPLAY = LIVE ✓ on every run) | **237 / 237** |
| the city groups (`core, room, gamestart, cartridge, gameflows, sololook, oldrules, afterparty, makehost, tapfit`) | **109 / 109** |
- Found BY the final run and fixed: a refused stamp + counter update (the room's path) was not matched by its child-path expectations →
  `firebase.js` now treats an UPDATE whose every child path is expected as expected; the rematch suite ended JAYWALK's match by writing
  `final` over live runs (the attack itself) → it lets proof matches end the real way; two phones stamping in the same instant leave the
  loser's write refused (silent — a turn order was tried and reverted: it cost every other phone's GO a round trip) → the JAYWALK match +
  rematch suites ignore that one expected line; an old fixture (a GO "now" with no end) is a live run by the new rule → a GO 2 min before.
- The mini PC's real-GPU path was down for ~1.5 h mid-pass (the code before this pass hung the same way); the suites that force the GPU (the
  match + attack E2Es) ran on it once it was back; the others use their default renderer as always. The full harbor suite: the cloud's, on a harbor-tagged push (THE LOCAL TESTING RULE) — this is a ci-tagged pass.
- Every server this pass started was stopped at the end, by exact PID.

## OPEN FOR BEN
1. **RE-PUBLISH + the order:** `C:\Users\benja\Downloads\NEON\database.rules.nov20-console.json` → Firebase console → Realtime Database →
   Rules → paste → Publish — **any time AFTER the deploy is live, before Nov 27** (today is best). Nothing breaks in between or after: the
   new code falls back to the plain stamp on today's rules; a phone still on the old code GOes without a stamp on the new rules until Nov 27.
2. **Your phone checks** (after the deploy; the rules can be before or after):
   - A JAYWALK match with your brother: https://neonspeakeasy.com → HOST → PICK A GAME → JAYWALK — both play to the end, the podium, both counted.
   - A HIGH RISE match the same way: https://neonspeakeasy.com → HOST → PICK A GAME → HIGH RISE — both counted.
   - A quick solo of each: https://neonspeakeasy.com → PLAY → JAYWALK → PLAY NOW, then PLAY → HIGH RISE → PLAY NOW — XP shows (or "TODAY'S SOLO XP DONE").
   - Nothing should look different in an honest match: the podium comes when the last player is out, as before.
3. **The other games' audit, ranked (NOT fixed):** GROUP 2 above — (1) HOLD'EM when the room is moved on mid-table (S–M), (2) PRISM DROP +
   OVERCLOCK forged results at `final` (your "the host stays trusted" call — fixes S to L), (3) PRISM rush's out-of-bounds score keeps the win
   (S), (4) PRISM battle's fake board (L), (5) OVERCLOCK self-grading (L), (6) the boards' delete (S + rules), (7) a kicked player in the
   host-graded games (your call). All in the inbox for each game's next pass. Little traffic → none urgent before strangers host rooms.
4. **Notes to paste:**
   - **For the JAYWALK chat:**
     > THE CONSOLE FIX (Nov 20) touched JAYWALK's live code (+ HIGH RISE's): a live proven run is never taken away by the host — an early
     > `final`, a moved-on room, a kick or a deleted `meta` no longer pulls a phone out of its run; it plays to its own end, writes `e`, THEN
     > follows (view.js `holdsRun` + `runLive`; the router's RUN HOLD in app.js; room.js holds the exit). Once proven, a phone stays proven
     > (the host's participants / `unproven` can not stop its chunks). The out phone's podium waits for a rival's live run and is then scored
     > from the nodes (director.js#finalPatch exported, `liveOf` added). The server holds a match's report (425 still_live) while a run is
     > live — the host's own endedFor rule + the cap. The GO goes up behind the stamp, which now writes the room's tree counter
     > (`rooms/{CODE}/pt`, THE TREE CAP 1,000) — a phone that sees the tree begun skips the stamp. Rules re-publish pending (the console file).
     > The engine, the judge, the clock rules: untouched.
   - **For the CITY chat:**
     > THE CONSOLE FIX (Nov 20) changed the shared console: app.js THE RUN HOLD (a game screen with `holdsRun()` true stays through a
     > moved-on room on a frozen state — never against the phone's own LEAVE / QUIT / move: host.js#movedByMe), games/lazy-view.js forwards
     > `holdsRun`, room.js holds a kick / a lost seat / a meta-only close while a run is held (runHoldDone), host.js skips the idle close while
     > held, ui/final.js#createFinal takes an optional `game`, the report queue's `still_live` never runs out of tries. HOLD'EM's podium waits
     > for the dealer's end. **THE SIGN HOLD is still yours** (`core/harbor-neon.js#SIGN_HOLD` — untouched by this pass). The boot: no new
     > boot module (the hub lives in app.js).
5. **Calls you can overrule:** THE CALLS MADE above — the two most worth a look: a kicked proven player is credited (seated or not), and an
   honest host's END GAME now lets the others finish their runs (≤ 6:00) before they follow him. Plus: THE TREE CAP's 1,000 counts solo runs
   too; the build machine's GPU path was down for the last part of the pass (the match suites ran on the software renderer).
