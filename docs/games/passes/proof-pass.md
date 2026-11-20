# THE PROOF PASS — JAYWALK + HIGH RISE (Nov 20 2026 · the Beelink · Fable 5.2)

**RE-PUBLISH the rules — any time AFTER the deploy is live.** The file: `C:\Users\benja\Downloads\NEON\database.rules.nov20-proof.json`
(identical to the repo's `database.rules.json` at the final push). Firebase console → Realtime Database → Rules → paste → Publish.
THE ORDER, in plain words:
- The new phone code works on the OLD rules (today's): nothing breaks between the deploy and your publish.
- A phone still running the OLD code works on the NEW rules: nothing breaks after your publish.
- So: let the deploy finish, then publish whenever you like. Both directions were played end to end on the emulator, both games (below).
- Until you publish, the three holes are closed by the server + the phones only (a cheater is not paid); the rules close them for good.

The owner's calls: `docs/games/plan.md` "THE PROOF PASS". The design it built from: `docs/games/passes/highrise-review.md` (MUST 2 a / b / c,
"THE RULES AUDITOR'S DESIGN", SHOULD 9). The shared code + rules in one page: `docs/match-kit.md` "THE PROOF TREE + THE PROOF WRITER".

| commit | what |
| --- | --- |
| `8e9d3f48` | Step 0 — the owner's decisions into plan.md |
| `588b0140` | Groups 1 + 2 — THE HOST-TRUST HOLES (`jw` + `hr`) + JAYWALK'S GO FIXES (one commit: the same lines) |
| `d25530b6` | Group 3 — GitHub's `tests` job (the two reds' causes) + THE PER-GAME BUDGET's named raise |
| `bd6e163c` | Group 4 — A VERIFIED SOLO RUN IS A COUNTED PLAY |
| `1d709f46` | THE SWITCH-OVER WINDOW, end to end (old rules + new code · new rules + old code) |
| `a15866b6` | the close — THE FRESH-EYES REVIEW's fixes |
| the close (top) | this log, the docs, the final run (the ci tag) |

THE ADD-ON INBOX: read at the start, after each group's commit and before the final run. Built + marked done: the Nov 20 2:17 pm entry
(Group 4), the Nov 20 ~12:49 am entry's (1) (2) (3) (the leaf writes · JAYWALK's refresh mid-match · Call the Winner's no-run case), the
Nov 20 ~10:30 am entry (the host hiccup + a GO alone), the Nov 20 ~4:45 am entry (e2e-jaywalk's PLAY NOW red — a test fault, fixed). Left
untouched: every entry to THE NEXT CITY PASS (four new ones arrived during the pass), the 12:49 am entry's (4) (the 18 s number — yours).
THE LAB EXPORT (the start): 224 marks, no FIX.

## GROUP 1 — THE HOST-TRUST HOLES (the review's MUST 2 — `jw` + `hr`, one shared design)
The three ways a MODIFIED HOST could win or wreck a match, and how each is closed:
- **(a) THE LEAF WRITES** — he flipped the game's phase for a moment; a rival's chunk was refused, the next one landed, the log had a hole,
  the judge refused the whole run. → The chunks, the end, the call (+ HIGH RISE's rule set) hang on the player's OWN `go` + 3 h. They read
  nothing the host writes (not the phase, the match id, the player list, the kick list). And the phone no longer forgets a refused chunk.
- **(b) THE PRE-DATED GO** — he wrote his GO under a future match id, waited 10 min, started that match and deleted its live proof. → A tree
  is locked by its STAMP's age (10 min); nobody can GO into a tree whose stamp is old, so a pre-dated tree never holds a rival's proof.
- **(c) THE EARLY FIRST GO** — he GOed alone, added the rivals 20 s later; their runs had already timed out. → THE STAMP `t0` (the tree's
  first write, the server's time, once) and a GO only within 5 s of it. On the server: a GO later than 5 s after the first GO is no run.

**STEP 1 (works on the rules as they were):**
- **THE PROOF WRITER** — `js/games/kit/proof-writer.js` (PURE) + `proof-io.js`, ONE copy for both games (each had its own, 24 % the same):
  one burst at a time (the next chunk leaves once the one before is acknowledged), a refused chunk read back + sent again (0.4 · 0.8 · 1.6
  · 3 s …, for 90 s), never dropped on the mirror alone, a dead line still queues a chunk a second so the burst lands together (THE DROPPED
  SIGNAL keeps working), the end behind the last chunk. JAYWALK's daily keeps the old way.
- **THE SERVER's TWO GUARDS** (`api/_lib/jaywalk.js` · `highrise.js`; the host's podium says the same): a node counts only WITH its GO; a GO
  later than 5 s after THE FIRST GO is no run (`late go`).

**STEP 2 (the rules — `database.rules.json` `jw` + `hr`, the same text for both):** the stamp `t0` · GO within 5 s of it · the leaves on the
player's own go · the lock by the stamp's age · only real match ids (a–z 0–9, 3 … 16) · `js/core/proof.js` (PURE) holds the shared numbers,
PINNED equal to the rules by `tests/proof-pass.test.mjs`. `core/room-logic.js#proofUnlocked` reads the stamp.

**THE SWITCH-OVER (my call — see THE CALLS):** until **Nov 27 2026, 09:00 UTC** a GO is still taken in a tree WITHOUT a stamp, so a phone that
has not refreshed since the deploy still plays AND counts. After that date every GO needs the stamp — nothing to re-publish, the date is in
the rule. (The review's own plan was "an old phone on the new rules plays NOT COUNTED".)

**RULES TESTS (the review's SHOULD 9):** `rules.test.mjs` 89 → **97** — 8 new blocks, every one for BOTH nodes: the stamp · hole (c) · hole (a)
(the host's own flips through the real rules: phase, match id, game, players, a kick, the game gone — the rival's chunk still lands) ·
hole (b) + the lock · odd match ids + GO's own checks (a kicked player, an unseated player, a stranger) · the count window (`hr`'s own) ·
Call the Winner's pick · THE SWITCH-OVER against three more copies of the rules (before the sunset · after it · the rules as published
before the pass). Three old expectations changed on purpose (a kick / a phase flip / a rematch no longer refuses a player's own chunk).

**The match-id check (the review's "if cheap"):** the FORMAT is checked (a tree only under a real match id). A cap on HOW MANY trees a host
opens in his own room is not built — the rules cannot count; it needs a server-side sweep. Low urgency, listed.

## GROUP 2 — JAYWALK'S GO FIXES (+ HIGH RISE's missed GO)
- **A HOST HICCUP AT GO** (REVIEW FIX A's fix, ported): a FIRST GO the server stamped before the host gave up keeps every phone on the GO's
  course and the director takes the NOT COUNTED mark back; a run that ended in that window sends its end once proven again.
- **A GO ALONE IS NOT A PLAYER:** the server counts a JAYWALK match player only with at least ONE HOP in its own replay (`played`) — a seat
  that only wrote GO (a spare tab) no longer makes a "2-player match". HIGH RISE's rule (a landed slab) now goes the same way.
- **A refresh mid-match** never adopts the match from the game alone while the proof nodes are still on their way.
- **Call the Winner** (both games): a player with no run is never "still in"; a full draw pays nobody.
- **HIGH RISE — "your own phone missed the GO":** a phone that reaches the match's real clock with no taps of its own, after the fuse has
  ended a tower nobody touched, no longer restarts and goes "TOO SLOW" at floor 0 — it WATCHES, told **YOU MISSED THE START — NOT COUNTED**.
  In JAYWALK the same case already went straight to watching (a kid that is still alive on the real clock plays on — fair).
- **JAYWALK plays + counts as before for an honest player — proven:** `e2e-jaywalk` 99 / 99 · `e2e-jaywalk-match` 92 / 92 · the lab
  (`jaywalk-lab.mjs`, REPLAY = LIVE) 108 / 108 · the replay / judge / dropped-signal sims in the unit suite, untouched and green. The engine,
  the judge and the clock rules were not changed (one field added to the judge's answer: the hops it played).

## GROUP 3 — CLEANUP
- **GitHub's `tests` job:**
  - "MUSIC OFF = PODCAST MODE" (red in the cloud since REVIEW FIX B; it failed here too with the whole suite running beside it): the nap is
    two chained timers and the test slept a fixed 120 ms past them. It now waits for the actual condition after the time the nap should
    take (≤ 4 s — the runner's speed, named) and makes the same assertion. A context that never suspends still fails.
  - `e2e-presence.mjs:55` (red since the go-live): the THIRD phone's boot on the cloud runner (two cities already drawing, no GPU) takes
    ~13 s — in the last green run it scraped under the 15 s wait. One named allowance, `kit/harness.mjs#BOOT_WAIT_MS` = 45 s (the harness,
    presence, smoke). Here the same boot takes 2.3 s; 5.9 s at 3× CPU. The check is unchanged.
- **THE PER-GAME BUDGET:** JAYWALK 2,450 → **2,600 KB** (it was full: 2,449.7; now 2,471) · HIGH RISE 2,500 → **2,600** (2,513) — the shared
  proof modules took ~21 KB; the room left is for the next game's listing at boot. In CLAUDE.md. **Also near their lines (not raised — the
  city's):** THE BOOT 308 of 310 modules · `js/games` at boot 29.2 of 30 KB. The other games sit ~90 KB under theirs.

## GROUP 4 — A VERIFIED SOLO RUN IS A COUNTED PLAY (the inbox's Nov 20 2:17 pm entry, as written)
- A solo run THE SERVER replayed itself from the player's proof node AND counted now counts toward THE BOARD's 3 plays: **JAYWALK**
  (verifyNode) + **HIGH RISE** (its judge). **THE DROP** (and JAYWALK's daily) are dailies — a counted daily finish counted already.
- Refused / unproven runs, and a solo run of a game the host grades (OVERCLOCK, PRISM DROP): never. DON'T COUNT still hides.
- **THE RE-COUNT** = the existing `/admin → THE BOARDS → BACK-FILL` (preview, then BACK-FILL NOW). It now counts those solo records;
  idempotent (a second run writes the same numbers). **You press it once** — see OPEN FOR BEN. No rules change in this group.
- Tests: `tests/proof-solo.test.mjs` · `server.test.mjs` "A VERIFIED SOLO RUN IS A COUNTED PLAY" (3 verified runs → listed; 2 → not; a
  refused, an unproven, a host-graded run → not counted; DON'T COUNT hides + UNDO; the back-fill twice = the same).

## THE SWITCH-OVER WINDOW — played on the emulator, both games, both ways
| the state | HIGH RISE solo | JAYWALK solo | HIGH RISE match | JAYWALK match |
| --- | --- | --- | --- | --- |
| OLD rules + NEW code (between the deploy and your publish) | 70 / 70 | 99 / 99 | 35 / 35 | 92 / 92 |
| NEW rules + OLD code (a phone that has not refreshed; the new server) | 70 / 70 | 98 / 99 | 34 / 34 | 89 / 91 |
- The old-code reds are the OLD tests' own: one stale count ("four playable games" — there are five since the go-live) and two checks that
  expected a dropped player's late hops to be REFUSED — on the new rules they LAND (the intended change).
- How: `kit/swap-rules.mjs` loads the rules as published before the pass into the running emulator (`OLD_RULES=1`); the old code = a
  worktree of `8da9372a` served on its own port behind one origin whose `/api` is the new server.
- Logs: `Downloads\NEON\proof-pass\logs\window-*.txt`.

## THE FRESH-EYES REVIEW (a separate agent that wrote none of it — a modified host, a modified rival, a solo farmer)
Its verdict: the stamp, the GO window, the leaf rules, the lock and Group 4 held (it proved its attacks against the real rules on the
emulator). What it found, and what was done:
1. **HIGH — the host ends the match for everyone but himself** (older than this pass): he writes `phase: 'final'` (or moves the room on);
   every honest phone leaves its run for the podium; he plays on, then reports. **NOT CLOSED** — the phones follow the host's state out of
   a live run. The fix is a console rule of its own (OPEN FOR BEN 5).
2. **HIGH — the host drops the leader from the player list at the end** (older than this pass). **FIXED:** the tree says who played —
   every uid with an on-time GO is replayed, credited and may report, named or not; a run is solo only when the tree holds no other GO.
3. **MEDIUM — a sore loser voids the winner's win by breaking his own log after the podium** (new with this pass's rules). **FIXED:** a
   refused log still played when its first chunk replays a move — he stays a player who lost.
4. **MEDIUM — Call the Winner's pick had no length bound** (megabytes fitted behind a uid). **FIXED** in the rules (a uid's shape, ≤ 64).
5. LOW — up to ~3 s of head start inside the 5 s window (tick 0 = the first GO + 2 s). Left — a call (THE CALLS).
6. LOW — until the sunset a host who never stamps keeps the old lock on his tree (wreck only: the server refuses him the win). By design.
7. LOW / NOTES — the host can delete his whole room, or pre-stamp a match id (wreck only, never a win): written into the doc. HIGH RISE's
   rule set could be written for 3 h → **FIXED**: only within 10 s of the player's GO. Group 4: three one-lane solo runs list a player —
   the owner's rule as written.

## THE FINAL RUN (fresh emulators + this pass's own `serve.mjs --emu`, one at a time; logs `Downloads\NEON\proof-pass\logs\final\`)
| check | result |
| --- | --- |
| unit (`node --test tests/*.test.mjs`) | **2404 / 2404** |
| rules (`rules.test.mjs` — all old + the 8 new blocks) | **97 / 97** |
| `/api` (`server.test.mjs`) | **69 / 69** |
| the other server tests: dailies (module · jaywalk · drop) · HOLD'EM · progression · friends | **24 · 7 · 15 · 21 · 10 · 10** |
| smoke | **24 / 24** |
| `e2e-highrise` (full) | **81 / 81** |
| `e2e-highrise-match` (3 phones + a late joiner, the dead host) | **59 / 59** |
| `e2e-jaywalk` (full) · `e2e-jaywalk-match` (full) | **99 / 99 · 92 / 92** |
| the HIGH RISE test page `highrise-play.mjs` (REPLAY = LIVE ✓ on every run) · `--webkit` | **237 / 237 · 6 / 6** |
| the JAYWALK lab `jaywalk-lab.mjs` (REPLAY = LIVE) | **108 / 108** |
| ZERO GARBAGE `highrise-alloc.mjs` | **12 / 12** (solo 5.4 night · 10.6 day · MATCH 10.4 — the line is 12) |
| the presence test (+ at 3× CPU) | **13 / 13** |
| the city groups (`core, room, gamestart, cartridge, gameflows, sololook, oldrules, afterparty, makehost, tapfit`) | **109 / 109** |
- The full harbor suite: the cloud's, on a harbor-tagged push (THE LOCAL TESTING RULE) — this is a ci-tagged games pass.
- Every server this pass started was stopped at the end, by exact PID.

## THE CALLS MADE (obvious / established — overrule any)
- **THE SWITCH-OVER's date:** a GO without the stamp is taken until Nov 27 2026 09:00 UTC, then never. The review's plan was simpler (an old
  phone on the new rules plays NOT COUNTED until it refreshes); this way no live player loses a run in the hand-over.
- **The GO window = 5 s** (the review's number), the same on the server (it said "~8 s"). **A late GO drops THAT player's run** — the review
  said "the match is refused"; that would have voided an honest match because one phone was slow.
- **A JAYWALK match player = at least one hop the server replayed.** An AFK player who never hops now gets nothing — no "match played", no
  loss (before: a counted loss). The one who hopped beside only AFK seats is paid as a solo run, never a win.
- **A chunk after the host ended the match now LANDS.** The server's count reads the whole honest log (a dropped player's queued hops); the
  podium shows what had landed at the host's end. The two can differ in that one case.
- **HIGH RISE's missed GO:** WATCH + the line "YOU MISSED THE START — NOT COUNTED" (my words).
- **Call the Winner:** a full draw pays nobody; a player with no run is never "still in" (the inbox's item + the review's NICE).
- **The budget:** 2,600 KB for both games. **The cloud allowances:** 45 s for a boot, 4 s for the audio nap.
- **Group 4:** the re-count is your BACK-FILL button (the established way: an owner step, never a pass's). A proof game's match with ONE
  real player (the solo rule) counts as a verified solo run too.
- **Groups 1 + 2 share a commit** (the same lines of the same files).
- **Call the Winner's pick ≤ 64 letters + digits; HIGH RISE's rule set within 10 s of GO** (the review's two rule fixes).

## OPEN FOR BEN
1. **RE-PUBLISH + the order:** `C:\Users\benja\Downloads\NEON\database.rules.nov20-proof.json` → Firebase console → Realtime Database → Rules →
   Publish — any time AFTER the deploy is live. Nothing breaks before or after.
2. **Your phone checks (after the re-publish):**
   - A JAYWALK solo run: https://neonspeakeasy.com → PLAY → JAYWALK → PLAY NOW — it counts, XP shows.
   - A HIGH RISE solo run: https://neonspeakeasy.com → PLAY → HIGH RISE → PLAY NOW — it counts, XP shows.
   - **THE BOARD's re-count:** https://neonspeakeasy.com/admin → THE BOARDS → BACK-FILL (the preview says how many more players are
     listed) → BACK-FILL NOW. Then https://neonspeakeasy.com/board — your friend is listed once he has 3 verified solo runs.
   - A match of each game with your brother: https://neonspeakeasy.com → HOST → PICK A GAME → JAYWALK, then HIGH RISE — counted for both.
3. **For the JAYWALK chat (paste):**
   > THE PROOF PASS (Nov 20) changed JAYWALK's proof code + the `jw` rules; the engine, the judge and the clock rules are untouched.
   > (1) view.js no longer writes chunks / the end / the match GO itself — the shared `js/games/kit/proof-writer.js` + `proof-io.js` do
   > (HIGH RISE's too): one burst at a time, a refused chunk sent again, never dropped on the mirror alone; the daily keeps the old way.
   > (2) The `jw` rules (re-publish pending): THE STAMP `t0`, a GO only within 5 s of it, the chunks / end / call on the player's own go +
   > 3 h (nothing the host writes), the tree's lock by the stamp's age. A chunk after the host ended the match now LANDS.
   > (3) The server: a node counts only with its GO; a GO later than 5 s after the first GO is no run; **a GO alone is not a player** (a hop
   > in the server's replay is — an AFK seat gets nothing now); every uid with an on-time GO is replayed even if the host left it off the
   > list. (4) director.js: a host hiccup at GO no longer voids the match (logic.js#goBeforeGiveUp). (5) Call the Winner: no run = never
   > "still in"; a full draw pays nobody. (6) A verified solo run counts toward THE BOARD's 3 plays. (7) e2e-jaywalk's "PLAY NOW red" was
   > the test tapping a sheet that was still sliding in — fixed in the test. Why: the HIGH RISE review's MUST 2 (three ways a modified
   > host could win or wreck a match) — true of live JAYWALK too. The doc: docs/jaywalk.md "THE PROOF PASS".
4. **For the CITY chat (paste):**
   > THE PROOF PASS (Nov 20): the inbox's "A VERIFIED SOLO RUN IS A COUNTED PLAY" (Nov 20 2:17 pm) is DONE (bd6e163c) — part 1 skips it;
   > Ben presses /admin → THE BOARDS → BACK-FILL once for the players who already have their runs. THE SIGN HOLD is still in force
   > (`core/harbor-neon.js#SIGN_HOLD`) — it waits for THE CITY PASS. The per-game budget for JAYWALK + HIGH RISE is 2,600 KB now; THE BOOT's
   > own lines are tight (308 of 310 modules, `js/games` at boot 29.2 of 30 KB) — the next game's listing needs your trim or a named raise.
   > Not built, the console's: a modified host can still end a match for everyone but himself (the phones follow the host's state out of a
   > live run — docs/match-kit.md "WHAT THIS DOES NOT CLOSE").
5. **Calls you can overrule + what is NOT done:**
   - THE CALLS MADE above — the two most worth a look: the switch-over's date (Nov 27), and "an AFK JAYWALK player gets nothing".
   - **NOT CLOSED — the host ends the match for everyone but himself** (the review's finding 1; older than this pass, true of both games):
     the fix is a console rule — a phone never leaves a LIVE proven run because the host's state says so, and the server holds a report
     while a run is still live. A design of its own; my recommendation: its own short pass, before strangers are invited.
   - Not built: a cap on how many match trees a host can open in his own room (low urgency). The 5 s GO window leaves a host ~3 s of head
     start at most; cutting the window to 2–3 s would close it and cost a slow phone its GO — your call.
   - Still yours from before: the 18 s number for a silent-but-online phone.
