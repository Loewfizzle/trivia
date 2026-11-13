# FR7 FIXES B — "the launch + the plumbing" (Nov 12 2026)

A fix pass after FR7 FIXES A + HE11, from FR7-A (`docs/harbor/review-7a.md` — D, E, the NICE lines, THE LAUNCH CHECKLIST), FR7-B
(`docs/games/review-7b.md` — its "FR7 FIXES B" plan) and `docs/harbor/passes/fr7-fixes-a.md` ("NOT DONE"), + the owner's three ADD-ONS (Grok's
second opinions, given mid-pass). ONLY what was listed — nothing else was started. The owner's decisions: plan.md "OWNER'S NOTES — NOV 12
(afternoon)" (+ decisions.md). **The repo stays PUBLIC** — this pass changed nothing about its visibility, rewrote no history, ran no RESEED, no
PROGRESS RESET, didn't close FOUNDING MEMBER. **ONE database rules change** (THE HONEST PLAYERS — the host deletes one match's proof node: RE-PUBLISH). Still 8 functions. The tests of this pass: `tests/fr7-fixes-b.test.mjs`
(+ the files named per finding — each failed before its fix unless said).

## Step 0
plan.md "OWNER'S NOTES — NOV 12 (afternoon)" appended unchanged + its BUILD TABLE line; decisions.md (FR7 FIXES B ← NOW, THE LAUNCH split from THE
PRIVATE FLIP, the owner's five decisions) — `57b58901`.

## Group 1 — THE LAUNCH's code (`d4f5669b`)

| finding | state | the fix | the test |
| --- | --- | --- | --- |
| E2 the freezes lost at the first play after the reset | FIXED | `core/streak.js` — a streak with no run yet carries `st0.f`, capped at the hold limit (2) | unit "E2" (`streakPlay({ f: 2 })` keeps 2; 9 → 2) |
| E3 the reset's founder sweep ignored a closed window | FIXED | `api/_lib/reset.js` — the sweep only while `founderOpen` (read fresh, never the 30 s cache) | `server.test` "FR7 FIXES B — E3 + E4" |
| E4 counted plays (the owner: RESET) | FIXED | `cp` in `RESET_STATS`; the dry run's line names the counted plays; the back-fill counts plays only after THE RESET EPOCH | unit "E4" + `server.test` (cp → null, `m` 0) |
| /board's link preview | FIXED | `assets/og-board.jpg` re-shot from the REAL velvet board (`scripts/seed-og-board.mjs` — eight made-up names on the emulators, approved card art → `tests/integration/og-board-shot.mjs`; 72 KB, 1200×630), `?v=2`; both pages' og:url / og:image on **www.neonspeakeasy.com — the PRIMARY host** (the bare domain answers 308 → www, measured) | unit "the link previews" |
| THE CHECKLIST | DONE | `docs/launch.md` — THE LAUNCH (the owner's taps) + THE PRIVATE FLIP (the exact commands), the growth rule, the minutes | — |

Seen while looking (NOT changed — not on the list): the home preview `assets/og.jpg` still shows GRIDLOCK's sign (HOLD'EM took its spot Nov 11); both
pages' description text still says "twelve party games".

## Group 2 — THE EDGE REQUESTS (D2) — **DEFERRED to THE LAUNCH (the owner, Nov 12)**

**The owner's ADD-ON (mid-pass):** skip it in this pass — he checks every pass on his iPhone right after it deploys and won't accept up to 5 min of an
older file while still building. It had been built, proven and deployed (`ffd32851`, live for a few hours on `8a37a88d`); it was taken out again in ONE
commit, **"THE EDGE CACHE out — deferred to THE LAUNCH"** (`224a241f`): `vercel.json` + the worker's cache mode exactly as before this pass, the two-tab
hang's store bounds KEPT (they're not cache-mode changes). `docs/launch.md` step 8 = `git revert 224a241f` + the proof to run. The next deploy's worker
deletes the per-deploy caches the few-hours worker left on phones (its activation keeps only `na-static-v1`); a phone that loaded during those hours may
reuse a 5-minute-fresh file once.

**MEASURED — TODAY (the restored worker, `tests/integration/wk-edge.mjs PROD=0`, WebKit 402×874 @3 through THE LINE, each visit a new tab):** a cold
visit 375–545 requests (two runs) / 7.5–11 MB; a **WARM visit 356 requests / 7.2 MB**, reveal ~3.9 s; every later visit the same 356. **WITH THE LAUNCH's
change** (measured while it was in): a warm visit **15 requests (4 static + 11 /api) / 260 KB**, reveal 2.6 s; the first visit after a deploy 357 (the
refill); the new code on screen at once, no mixed graph; on the live site (read-only, `&test=1`) a warm visit reached the edge ~8 times (FR7-A: 328).
The month at FR7-A's yardstick: ~61 % of Vercel's free million today → ~12–35 % with it. The design notes for the launch pass: the worker's network
fetches stay `no-cache` (a copy is only ever the network's, in its own build — the default mode + the 24 h stale-while-revalidate could hand back an
OLDER deploy's file), a copy is handed to the page `no-cache` (WebKit's memory cache otherwise reused an older `config.js` on a reload — `wk-edge`
caught it).

## Group 3 — THE DEPLOY + THE REPO SIZE (D3, D4 — `3d74d966`)

- **D3 THE FROZEN SONGS OUT OF DEPLOYS:** `.vercelignore` drops the ten frozen games' own songs (29 files — cipher-breach, last-signal, neural-bluff,
  golf-*, spy1–3, high1–3, run1–4, slip1–8, audio/pulse). The live set (City 2.0's five station decks — every mood has its own deck, so the old City 1.0
  decks that name the frozen songs are never reached —, the menu playlist, the victory list, OVERCLOCK's track, PRISM DROP's ten, the podium sounds)
  all ship: `tests/frozen-songs.test.mjs` fails if one doesn't (proved: dropping `c2-party1` → 2 reds). **The deploy: 299.1 → 232.5 MiB** (1,612 →
  1,583 files — `node scripts/deploy-size.mjs`).
- **D4 THE GROWTH STOPPED:** pass screenshots stay ON THE PC — `.gitignore` covers every picture under `docs/harbor/passes/`, `docs/games/`,
  `screenshots/` (chosen over "JPEG at 1×": a pass shoots many and they are looked at on the PC; a picture a doc must carry = a JPEG ≤ 150 KB added on
  purpose); `tests/repo-growth.test.mjs` fails on a new big one (the line: the 180 + 29 already committed). `git gc` on the local clone: 450 MiB pack +
  152 MiB loose → **549 MiB**. **GitHub: 573,690 KB (~560 MiB).** No history rewrite (THE PRIVATE FLIP — its commands in `docs/launch.md`; ~560 →
  ~300 MB estimated).
- Vercel → Settings → Deployment Retention: the owner sets it (not visible from here) — `docs/launch.md` says what.

## Group 4 — THE PRIVATE-REPO WORKFLOW (D1 — `9f8a3519`; ready, NOT switched on)

Both workflows read `github.event.repository.private`: PUBLIC = exactly as before; PRIVATE = a final push runs only `tests` (unit → rules → /api →
smoke; CONN + presence skipped), `harbor` skips itself on a push (`gh workflow run harbor` still works); `permissions: contents: read` on both.
`tests/workflows.test.mjs` evaluates both branches (red before). The real run: this pass's final push (public → both workflows, as today).
The minutes: a `tests` run ≈ 11 billed → 2,000 a month ≈ 180 runs ≈ 6 final pushes a day (Nov 8–12 ran 6–11 a day — over at that pace).

## Group 5 — THE TWO OWNER NOTES

1. **THE TWO-TAB HANG** (`3a38cb31` + ADD-ON 3 `b735a6da`). **Not reproduced as such — reproduced in kind.** Desktop WebKit's two tabs never hung by
   themselves (5 refreshes beside a background tab, a worker update landing with both open — every load the city in ~2.5 s). The suspect: Safari's
   storage process stopping, which only comes back once every tab of the site is closed (the owner's "closing both fixed it"). SIMULATED in the tab
   with IndexedDB + Cache Storage that never answer: the OLD code's sign-in waited forever (Firebase opens IndexedDB for Auth's migration store and for
   the app's heartbeat before every sign-in request), and the NEW worker's own waits on Cache Storage would have held every file. **Fixed:**
   - the probe opens what the SDK opens next (`firebaseLocalStorageDb` + `firebase-heartbeat-database`, no version — a missing one is never created —
     in parallel, 1.5 s); any one silent → IndexedDB hidden from the SDK for this page + the sign-in on localStorage alone;
   - every Cache Storage wait in the worker is bounded (0.8 s → the network), including its ACTIVATION — every fetch of a controlled page waits for
     it, so a stuck clean-up there means STEPPING INSIDE forever;
   - THE WATCHDOG ALWAYS ENDS IN A WAY OUT (ADD-ON 3);
   - the BOOT HANG report says **"other tabs open: n"** (a BroadcastChannel ping in index.html — never a socket).
   Proof: `tests/integration/wk-twotabs.mjs` 7 / 7 (5 / 7 on the old code: the stuck store's sign-in + the tab count; 6 / 7 on the first probe: ONLY
   Auth's database silent), the load group's WAY OUT check.
2. **UMBRELLAS IN THE RAIN** (`b91aba35`): `folk.js#rainGear` — none under 0.12; drizzle 0.22 ≈ 1 in 3 umbrellas; ≥ 0.3 ≈ 3 in 4 with the SAME
   draws as before (a real-rain look is unchanged); newspapers + collars up fill in (the collar on its own seeded stream — no later draw shifts). A
   walker's gear = the rain when THEIR VISIT started (`folk.js#entryRain` — the look key no longer flips everyone at 0.3: THE PEOPLE RULE). Unit
   tests: the shares (3,000 walkers), real-rain looks unchanged, a look never changes mid-visit. Shots `&force=drizzle|rain|storm`, day + night, 390 /
   402 / 430 + 1440 (`shots-review/umb-*` — on the PC).

## Group 6 — A's LEFTOVERS + THE TESTS + THE STALE DOCS

- **C5's two whole-tree reads** FIXED (`9410872f`): /admin STATS + the radio's open rooms read the LIVE rooms through the index
  (`api/_lib/rooms-live.js` — activeAt in the last hour, ≤ 120); `server.test` "C5" + a unit guard (no `/api` file reads the whole tree).
- **PD2 SCORE RUSH's margin** FIXED: a fresh `node scripts/sim-prism-rush.mjs 24 4` (24 runs a song). The best runs RISE with more seeds (prism4
  248,202, prism3 285,228), so the margin could only come **3 → 2.8**: every song's best stays ≥ 2.5× under the bound with ~5 % to spare (2.65× on
  prism4). A 12-run sim had suggested 2.4; PFIX-B's own pinned seeds refused that. Unit "PD2" (red before).
- **C4 — NOT DONE (said once):** the emulator never evaluates `query.endAt` as a comparable value, so a "stale rooms only" list rule can't be proved;
  an unproved rule could break the idle sweep on the live database. The owner's options: the idle sweep on the server (then the client query can be
  closed), or accept it in writing (the door has a LOCK).
- **The tests** (`cfe092c8`): the smoke's filter — a game that isn't playable stops RED (exit 2), never "5 / 5 with nothing started"; the four /api
  suites in the cloud (both dailies, FRIENDS, `holdem-server`); `crew`'s push picked by its room code (another shard's room no longer counts); the FAST
  `short` by the 3-hand rule; the vault's WebKit page `?emu` (it signed in on the PRODUCTION project) + `guardUrl` on every WebKit launcher + THE LINE's
  upstream (`tests/live-guard.test.mjs`); a no-WebGL PRISM mount (`tests/integration/prism-nowebgl.mjs` 3 / 3); `perfRun` pinned to the night look.
  Already done by FR7 FIXES A (no new work): the reload-then-chip line (DY1 — `e2e-daily`), OVERCLOCK's STANDARD bound (unit OC1).
- **The stale docs** (`f216a071`): og.jpg everywhere, 41 achievements, 8 functions, 13 games / 3 playable, the deploy size, the smoke filter, the
  suite's ~33 min / ~1,262 checks + the cloud budget, HOLD'EM playable, QUIT TO THE ROOM, `progress/flame-art.js`.

## Group 7 — THE NICE LINES (`1a20a671`)

FIXED: HOST at the 101st connection (raced against 20 s — "The city's full tonight — try again in a minute."; ONE attempt at a time, a late success
still walks in); the results queue's 425 backs off 2 s → 60 s; a `radioWho` NO remembered for the tab, per profile (a restore asks again).
**NOT DONE (dropped for time, as the prompt allows):** the SOLO SURVIVAL time (tried: stamping an AWAY / gone out at its silence also changes the OUT
ORDER — the last one out wins — and flipped two whole-match tests; it needs its own field for the podium's time); OVERCLOCK's combo marks after a
refresh; the TODAY ticket's cut name at 390.

## ADD-ON 1 — A SEAT IS NOT A PLAY (the owner, Grok's second opinion — `2741373a`)

EVERY credited uid (seated or not) needs its OWN node of THIS match in THIS room (`api/report.js#PROOF_TREES`): PRISM DROP's board; OVERCLOCK's
board of ANY challenge, its combo marks or its sealed picks. A uid without one is dropped from the rows BEFORE the real-player count (one real player
left = the solo rule). HOLD'EM untouched (the dealer). A report can land after BACK TO THE ROOM (the snapshot path), so the walk back now KEEPS the
proof nodes + the seal (`games/registry.js#PROOF_NODE_LIST`); the next start wipes them as before. `server.test` "A SEAT IS NOT A PLAY":
- a seated guest who wrote nothing → nothing, and the host gets a solo run (never a 2-player win);
- a real 2-player match → both credited, 95 XP as before;
- challenge 0 skipped (later combo marks / sealed picks only) → credited.
Red before. The fixtures of `server.test` + `progression.test` now leave each player's node as a real match does.

## ADD-ON 2 — SIGHTINGS NEED THE CITY OPEN (`f6fbdebc`)

A SKY claim counts only inside the server's own city-open stamp `ppriv/{pid}/co` (`{ a, b, p }` — written by `radioHello`, the call a visible city
already makes every ~2 min, + one hello on coming back on screen; a 30 s lead, a 150 s trail); the radio's claims keep their own record; `QUEUE_MS`
12 h → 15 min. **A SPEED BUMP, NOT A SEAL:** a script that keeps the city's hello going still can claim; it only stops a claim made with no city open.
Tests: `sightings.test` "NEED THE CITY OPEN" (no stamp → `closed`, an old opening → `closed`, 20 min late → `stale`, a real tap → granted) + the pure
stamp rules; the older sighting tests now open the city first. No rules change (`ppriv` is server-only by the root deny).

## ADD-ON 3 — Grok's second opinion on THE TWO-TAB HANG (`b735a6da`)

1. The probe opens what Firebase opens next (Group 5); hidden or not, a page whose IndexedDB didn't answer never keeps `indexedDBLocalPersistence` (a
   defineProperty that fails is logged). `wk-twotabs` 3b: ONLY `firebaseLocalStorageDb` silent → the city, signed in, HOST made a room (red on the
   first probe).
2. THE WATCHDOG ALWAYS ENDS IN A WAY OUT — once a reload is armed by ANY path, a boot screen still up 6 s on screen later → TAP TO TRY AGAIN, whatever
   `acted` says. The `load` group: `__boot.reload` armed with the reload stubbed (`window.__bootReloadStub` — the tests' seam; `location.reload` can't
   be replaced) → TAP TO TRY AGAIN in 5.9 s. (Before: `__boot.reload` set `acted = 2` and nothing acted again — read, not re-run.)
3. **NOT NOW — the plan:** a service-worker rescue for a FROZEN page thread (Grok's finding 1) — built only if /admin shows a "THE MAIN THREAD STOPPED
   ANSWERING" report during a boot; the hang watch already reports that case.

## THE HONEST PLAYERS (the owner's URGENT ADD-ON — Grok's "honest player" review of ADD-ONS 1 + 2, all three confirmed in the code — `d03b8f2c`)

**RULES CHANGED** (one row each at `rooms/{CODE}/prism/{m}`, `oc/{m}`, `ocm/{m}`: the host may delete ONE match's node — before, only the whole node).
`tests/fixtures/rules-live.json` synced to FR7 FIXES A's published rules first; the ack names this change (THE RULES-LAG).
1. **A RE-START KEEPS THE LAST MATCH's PROOF** (`host.js#startGameNow` → `pruneProofs`): the start no longer clears `prism` / `oc` / `ocm` in its atomic
   write; afterwards, best effort, it deletes every match's node EXCEPT the previous match's + the new one's (`core/room-logic.js#staleProofPaths`). On
   the rules as published that delete is refused → nothing deleted, the old matches' nodes stay until the room goes (the fallback — a rules test proves
   it). The seal is still wiped at each start: after fix 2 every present OVERCLOCK player has a board, so the seal isn't needed as proof. Test:
   `server.test` "a REMATCH started before A's report landed" (everyone in A credited, a 2-player win) + `rules.test` (the host deletes one match's node,
   a guest never; the previous one kept).
2. **PRESENT = PROVEN:** an OVERCLOCK phone writes its OWN board the moment a challenge opens (`view.js` — `{ p 0 · ok 0 · not done }`, never over a board
   that exists, never DUMB LUCK's pick board; it fits the existing rules — no rules change for it); PRISM DROP's phone already saves its board every
   ≤ 3 s while its frames run (the falling piece moves it). A present-but-silent player is credited as a loss and never turns the other's win into a solo
   run; a seated guest whose phone never entered play still gets nothing. Tests: `server.test` "PRESENT = PROVEN" (OVERCLOCK + PRISM: the winner keeps a
   2-player WIN, the silent one a counted loss) + the earlier "A SEAT IS NOT A PLAY" (the never-entered guest: nothing) + `rules.test` (the present
   board lands on the published rules). **Said plainly: a host can still fake the RESULT of a match the victim really played (the accepted host
   trust) — never credit one they weren't in.**
3. **SIGHTINGS — THE QUEUE + THE STAMP AGREE:** `CITY_GAP_MS` = `QUEUE_MS` (15 min — a hello after an outage of up to 15 min EXTENDS the same opening);
   a claim the stamp hasn't reached yet answers **`no_stamp`** (the phone keeps it — `profile/sightings.js`, `QAGE` 15 min — never dropped); the queue is
   flushed on `online` and after every successful hello (`harbor/remote.js` — which is also the city opening). Tests: `sightings.test` "THE QUEUE + THE
   STAMP AGREE" (hellos stop 5 min, a tap at minute 4 → `no_stamp`, the hellos resume → granted; a claim before the first hello → `no_stamp` → granted
   after it) + the pure rules (unit).
Fixture fixes the rule required (each a real match's shape): `e2e-profiles`' scripted finals now leave each player's own node.

## The end

**Local, on the mini PC — the FINAL run (after the deferral + the honest-player fixes; my own emulators + `serve.mjs --emu`, `DAILY_TEST=1` where
the dailies need it; Ben's :5190 left alone):** see the summary below (filled at the end of the run).
