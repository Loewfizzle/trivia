# PLAY NOW + WHO'S ON (+ GROUP 0: ONE DEPLOY AT A TIME, the C2 leftovers) — Nov 13 2026

The owner's notes: plan.md "OWNER'S NOTES — NOV 13 10 am (after FR7 FIXES C2)" (+ decisions.md: ONE DEPLOY AT A TIME, PLAY NOW, WHO'S ON). On the
beelink. **No database rules change** (82 / 82 — the solo room fits the published rules). Still 8 functions. Each group committed on its own; ONE
deployment (the final push's top commit carries the harbor tag).

## Step 0 — `2c430502`
plan.md's notes appended unchanged + the BUILD TABLE line; decisions.md: the current line, ONE DEPLOY AT A TIME (standing), PLAY NOW, WHO'S ON.

## Group 0a — ONE DEPLOY AT A TIME (`963181d7`)

C2 found the owner's iPhone running an OLD cached `js/audio/music.js` beside the NEW `radio-ledger.js`. **The paths that could hand a phone two
deploys' files**, found in `sw.js` + `vercel.json`:
1. **The worker forgot a page's build** — the pins lived in memory only; iOS stops an idle worker, the next file of an open page had no pin and fell
   back to the LATEST page load's mode (or the network).
2. **A new build deleted the old build's cache under a page still on it** (any new navigation — a second tab, a reload elsewhere).
3. **A lazy chunk missing from a page's copy came from the network's NEWER deploy** — and was then KEPT as the old build's copy.
4. **The edge header's stale-while-revalidate (one day) on /js + /css** — a load the worker didn't control (a hard reload, a worker Safari
   evicted, the first visit after an update) could boot on a day-old file beside a fresh one. (C2's likely path for the owner's phone.)

**The fix — the worker pins every page (no build step; build-stamped URLs would need one + rewrites):** each page (clientId) is pinned to the
build it booted on (in memory + META `/__pins`, so a restarted worker still knows; a page it never saw boot — the first visit, a worker update —
is adopted by the live build at its first file). EVERY `/js` + `/css` file of that page, the boot graph and every lazy chunk any time later,
comes from THAT build: a copy held → served; a miss → the network ONLY while the network is still that build (an `/api/time` answer ≤ 3 s old),
and each burst of misses is checked again once it settles (2.5 s) — a deploy that landed mid-burst = those copies dropped + the page told.
**The build gone** → the page is asked (`ns:build-gone`): no match on screen → ONE reload (THE SKEW WRAPPER's guard, never a loop) and the file
refused; **a match on screen** → it answers `mix`: the network's files for that page until the podium (a match never dies for it), then the
reload. An old build's cache stays while a page is on it. The page learns its build from the worker (truer than `/api/time`'s first answer).
`/js` + `/css`: `max-age=300`, **no** stale-while-revalidate (a `max-age=0` header doubled a cold visit's requests — the boot preload's links +
their imports — 533 vs 397 static; 300 without SWR keeps the cold visit at 410).

**Proof** — `tests/integration/wk-onebuild.mjs` (THE LINE with production's headers + a build id; the worker registered; as the owner), **WebKit
15 / 15 (×3) + Chromium 15 / 15**: a page on build A opens the radio DESK; build B is published under it (music.js gains an export, the LEDGER +
PRISM DROP's cartridge import it — C2's exact shape); PRISM DROP's cartridge on the A page → ONE clean reload to B, no link error; on B: DESK →
PROGRAM → LEDGER paint, the LEDGER + the cartridge are B's, the profile + THE BOARD load; a match on screen + build C: the next chunk loads (the
network's), no reload until the hold ends, then ONE reload to C; a refresh → all C; the old caches gone. The FIRST run found the 3-s rule: with a
15-s trust in the last build answer, B's files reached the A page right after a deploy (only the burst check caught it). `wk-edge` 6 / 6 — a warm
visit 15 requests (4 static + 11 /api; the shipped build 14 — the extra is a whoami the emulator's profile state asks for in both trees: reverting
the worker + the skew changes left it the same; `remote.js` now asks one whoami at a time anyway). Unit: `tests/one-build.test.mjs`.

## Group 0b–0e (+ 0f) (`4b200a22`, `57cfbbbf`)

- **0b — THE RANDOM BOOT HANG** ("stuck on STEPPING INSIDE after a refresh"): **/admin's reports could not be read from this machine** (no
  service-account key here; /admin needs the owner's sign-in) — the evidence is the code: 0a's paths 1 + 4 can hand a refresh a mixed graph; a
  mixed STATIC graph is a link error the watchdog catches at once (refresh + ONE reload — a recovery, not a hang), so a mix explains a slow
  STEPPING INSIDE + a reload, not a stall past 12 s. Not conclusive. **What's new for the next one:** every boot report (BOOT HANG, THE LAST BOOT
  DIDN'T FINISH) now carries THE WORKER's own counts — its mode, the build it serves the page, copies / misses / network, gone / refused / dropped —
  so the next report says whether the worker was in it. **Owner: paste the reports since C2 (THE LAST BOOT DIDN'T FINISH from your iPhone) and
  they can be read against this.**
- **0c — THE ROOF BOARD STOPPED TURNING:** found — the JAYWALK poster art (`jaywalk-art.js#warmJaywalk`) that failed to load ONCE (a refresh on a
  blip) left `tri.warmed` set and the art never asked again: HOLD'EM alone for the life of the page. Now a failed art / painter is retried (3 s,
  15 s, 1 min, then every 5 min) + reported ('trivision art'). `tests/integration/wk-trivision.mjs` (WebKit, a PLAIN load — no flags): both faces
  within 2 min ✓, after a reload ✓, after **10 min hidden** ✓, the art failing twice → retried, both faces, /admin told ✓ — 5 / 5.
- **0d — THE SUPPORTED FLOOR → iOS / Safari 15.4** (C2's 16 turned away iPhones that run the app). Feature by feature (docs/harbor.md#the-supported-floor):
  `Array#at` / `structuredClone` / BroadcastChannel / `:has` / `dvh` set 15.4; the canvas **`roundRect`** (Safari 16 · Chrome 99 · Firefox 112 —
  ~56 unguarded calls) is **filled in** (`ui/canvas-safe.js`); `color-mix` (16.2) + `@property` (16.4) only change the look. `tests/safari-floor.test.mjs`
  (the UA table — iOS 15.3 old · 15.4 / 15.4.1 / 15.8 / 16 / 17 not; Chrome 91 / 92; Instagram on 15.4 not, Facebook on 15.2 old; Mac Safari 15.3 / 15.4;
  the fill's radii) + `wk-floor.mjs` (WebKit with `roundRect` + the 16.x APIs taken away: the city up + 8 s, no page error — **the shipped build never
  reached its reveal that way**; `&oldua=` 15.4 → the city, 15.3 → "too old") — 3 / 3.
- **0e — A REAL ZEBRA:** not the date — **the 22:30 BUS pulls away through the crossing in the first second after the reveal** (x 7.1 → 12.6; the far
  stripes 112 → 202 once it's past); a faster boot read the zebra under its body (2 or 4 bars, the near ones exact — `zebra` debug: the profile + a
  rider beside it). The probe now judges a frame with the crossing CLEAR (no bus within 7 u, `frontBusy()` false, in the same frame) — the five-bar
  rule untouched; the people group 20 / 20.
- **0f — the C2 cloud runs** (pushed 10:10 am): `tests` ✅; `harbor` ❌ ×3, each checked locally:
  - **THE BENCH OVER THE TAXI** (mean diff 9.84): the overlay WAS out (opacity −1); the two shots, ~1 s apart on the cloud, caught the waiter
    boarding. The city's frame loop is held for the pair (`vl-cover` — the full card's pause): the same frame twice, only the overlays differ.
  - **THE DANCERS' ARMS NEVER JUMP** (1 in 295 frames): the trace stamped each drawn frame with the SAMPLER's time; a late sample beside a prompt
    one read a normal swing as 1 rad in a short frame. A frame is now timed by the city's own draw (`loop().drawnAt`); the rule unchanged. Locally
    0 jumps, 7 / 7 (before + after).
  - **NO TWO CAMERAS — the LATE WEATHER** (the roof board's copy 17,-47 pt away, 10:16 am): `wx-late@HH:MM` (both clocks set — `kit/two-cameras.mjs`)
    replayed 10:14 / 10:16 / 10:18 / 10:20 ×2 + the real clock ×4 — **12 / 12 clean**; not reproduced. Left as found (no change made blind).
  - Found on the way: **the radio loaded a face twice** — a poll's re-render while the first import was out started a second; its answer hid the
    failure (THE PROGRAM's TAP TO RETRY check red locally) → ONE load a face at a time.

## Group 1 — PLAY NOW (`b7d87e82`)

- **THE DOCK:** the FLANK's GAMES → **PLAY** (same spot, a play-triangle tube): `[ JOIN ] [ DAILY · BOARD · PLAY · YOU ] [ HOST ]`.
- **THE GAMES SHELF** (THE SHEET): one ROW a playable game — its neon mark (`core/marks.js`), its name, "solo · 2–8" / "2–8", the minutes.
- **THE GAME CARD** (THE SHEET, nested ‹ to the shelf — it replaced the old preview): the art + name, one line, players + minutes; **PLAY NOW** (SOLO
  games — the pink MAIN) + **PLAY WITH FRIENDS** (HOST with the game picked: the options sheet opens on it in the new room); HOLD'EM → PLAY WITH
  FRIENDS the main + "Needs 2+ players"; in a room the host's **PICK THIS GAME** (the room's own path), a guest's "The host picks the game"; HOW TO
  PLAY a quiet link (the first review: a third full tube competed with the two PLAY actions); THE BOARD's top three.
- **THE SKYLINE SIGNS + the speakeasy's blade** open the card. The split: NEON SPEAKEASY's own gestures (a letter's tap, THE RACE, THE SURGE) live
  on the logo's letters and are answered BEFORE any city hit (`logoRect`); a game sign is only a city hit; the blade (`scene.js#bladeHit` — this
  week's game) never over the door (the knock wins).
- **THE SOLO ROOM** (`room.js#createSoloRoom`): a private one-seat room — flagged `meta.settings.solo` (the rules take any settings key; `meta`
  refuses a new one), **LOCKED once seated** (the rules refuse even the host's own first player write into a locked room — found by the e2e),
  its code 4 random letters that are **not** a hush word (`core/room-logic.js#soloCode`): never on screen, never `?room=`, the REJOIN offer says
  RESUME, never "A ROOM JUST OPENED", never listed (the radio's open rooms skip it), its close writes no `hush/` entry. ONE ACCOUNT, ONE ROOM holds.
- **PLAY NOW = `host.js#playSolo`:** the room → this phone its host + online → the cartridge's one-player defaults (SCORE RUSH / QUICK —
  `soloSettings`) → **THE SOLO START** (~2 s, the sign lit at once — the match id's leading `s`, `core/room-show.js#START.solo`); a failed start
  closes the room. THE SOLO LANE unchanged. A guest without a name: setup's SOLO mode → straight into the run.
- **THE END:** the podium's foot = **PLAY AGAIN** (the same game + options, THE SOLO START) + **BACK TO THE CITY** (the room closed like a QUIT);
  no REMATCH VOTE / banner plane / night standings. `ui/final.js` (a lazy chunk) reads `globalThis.__nsPlayNow` (host.js's hub) — THE STALE-MODULE RULE.
- **Proof:** `tests/integration/e2e-playnow.mjs` — **13 / 13 in WebKit AND Chromium**: PLAY → PRISM DROP → PLAY NOW → playing **2.2–2.9 s** after the
  tap; locked + flagged + the solo id + SCORE RUSH; no hush word on screen / in the URL / rested; the podium's foot; PLAY AGAIN → the solo start
  again (2.1 s); BACK TO THE CITY → the room node gone, no word rested, the line PARKED; PLAY WITH FRIENDS → a normal room with PRISM DROP's
  options; HOLD'EM's card → no PLAY NOW + PLAY WITH FRIENDS → HOLD'EM's options; a tap on the PRISM DROP sign → its card. Unit `play-now.test` 7 / 7.
- **Look review** (`shots.mjs` scenes `pn-shelf` / `pn-prism` / `pn-overclock` / `pn-holdem` / `pn-podium`, 390 / 402 / 430 / 1440 — git-ignored
  `tests/integration/shots-review/`): two passes (HOW TO PLAY quieted; the card + the shelf at 1440 centred).

## Group 2 — WHO'S ON (`3ae70234`)

- **Where:** the radio → LEDGER → **IN THE CITY** is a door → THE SHEET; /admin → STATS: the same list (ONE builder — `ui/whos-on.js`).
- **A row:** the slim card (`ui/strip-board.js`; THE BOARD's public fields — `publicRow`: never a pid / key / tag digits) · WHERE (THE CITY · ROOM
  CODE · GAME (IN THE LOBBY) · SOLO · GAME · THE DAILY · NAME) · the last check-in; rooms → dailies → the city; one row an account; guests counted on
  one line.
- **The data — no new idle poll:** the existing ~5-min `radioHello` carries `w` (the city / a daily); the server keeps `here/{uid}` = `{ at, pid, w }`
  (THE NIXIE reads both shapes); a room's members from the LIVE rooms (online, exact); a daily confirmed by its own record (`dly/{game}/{day}/s|r`).
  Built by the SERVER on the owner's ask (`radioWhosOn` — `ROLES.whoson`), refreshed every 30 s only while the sheet is open + on screen.
- **Proof:** `server.test` (the city + a room + a solo run + a daily, sorted; a guest; an old hello dropped; a finished daily = the city; a nobody
  403 `not_radio`, THE CREW 403 `not_owner`; no pid / uid in the answer); unit `whos-on.test` 4 / 4; the harbor `radio` group 55 / 55 (IN THE CITY →
  THE SHEET with the owner's own row); `cdn-hotfix` (the same hello).

## THE ADD-ON — ALONE IN A ROOM + SHARE YOUR RUN (the owner, Nov 13 noon — his PRISM DROP solo podium)

- **A ROOM OF ONE = the solo foot too:** the podium of a room with ONE player (HOST → play alone, the old way) offers **PLAY AGAIN** (the same
  game + options, the quick start — a `q…` match) beside **BACK TO THE ROOM**; PLAY NOW's room keeps PLAY AGAIN + BACK TO THE CITY (`ui/final.js`).
- **SHARE YOUR RUN:** a SHARE tube on both solo podiums for a cartridge with `shareRun` (PRISM DROP, OVERCLOCK). A tap draws ONE 1080 × 1350 image
  on the phone (`js/games/kit/share-run.js` through `ctx2d`; the dailies' SHARE CARD sender): the NEON SPEAKEASY sign, the game · mode, PRISM DROP's
  FINAL BOARD (the same published board YOUR LAST BOARD draws — night tubes, the day's crayon when that's the look played) / OVERCLOCK's score, the
  NAME, the result (SURVIVED 1:04 · 42 LINES / 5 OF 6 CHALLENGES RIGHT), NEONSPEAKEASY.COM. The share sheet gets the image + "My PRISM DROP run —
  … · https://neonspeakeasy.com"; no file sharing → the line + the image saved. No server, no /api call; the inputs pass `runCard` (public fields only).
- **Proof:** `e2e-playnow.mjs` `solo` + `one` — the solo podium's SHARE hands the share sheet ONE PNG (266 KB with a board) + the line; a room of one's
  podium = PLAY AGAIN + BACK TO THE ROOM + SHARE, PLAY AGAIN → a quick-start match; unit `share-run.test` 3 / 3 (the drawn inputs = public fields
  only). **Look review** (`shots.mjs` pn-share-night / -day / -oc / -oc-day — the card at Messages size beside full size, at 390): two passes —
  the game · mode line deepened on the day's paper, the name + the result bigger; the haze under the sign filled the whole card (a hard edge
  showed behind OVERCLOCK's score).

## PD-6 (Nov 13 — docs/games/passes/pd-6.md)
THE GAME CARD draws a cartridge's `SOLO_RUNS` (PRISM DROP: SCORE RUSH · ONE SONG the MAIN + SURVIVAL · UNTIL YOU TOP OUT; OVERCLOCK keeps PLAY
NOW); the solo podium's title is a heading + the foot fits with no MORE BELOW in Safari with its toolbars; the solo podium says what it paid
(the server's `so`). Found on the way: a report that beat the host's night record was refused for good — now 425, retried.

## The close — local runs (the beelink; my own servers: fresh emulators + `serve.mjs --emu` on :5173 — restarted after the `/api` change —
## a `DAILY_TEST` server on :5179 for e2e-daily; a worktree of `68ef0fc3` on :5174 for the BEFORE runs)

| suite | result |
| --- | --- |
| unit | 1786 / 1786 |
| rules | 82 / 82 (no rules change) |
| `/api` server.test | 55 / 55 (+ WHO'S ON) |
| the dealer (holdem-server.test, alone) | 21 / 21 |
| e2e-profiles · e2e-daily | 144 / 144 · 53 / 53 |
| smoke | 8 / 8 |
| CONN | 21 / 21 |
| wk-edge · wk-load · wk-twotabs | 6 / 6 · 4 loads, 0 problems · 7 / 7 |
| wk-onebuild (WebKit + Chromium) · wk-trivision · wk-floor · e2e-playnow (both, + the add-on's `one` + SHARE) | 15 + 15 · 5 · 3 · 17 + 17 (WebKit's PLAY NOW 2.8 s quiet — 4.6 s once while the full harbor suite loaded the machine) |
| harbor groups touched | people 20 / 20 · motion 7 / 7 · radio 55 / 55 · trivision 7 / 7 (×2) · shell 8 / 8 |
| **FULL e2e-harbor** (4 shards + the tails, ~35 min) | **1300 / 1305** — each red checked: THE TITLE DOCK's LABELS (the check still said GAMES → PLAY; `shell` 8 / 8); THE WALKERS NEVER JUDDER (my first motion-trace fix timed the WALKERS by the draw too — now only the arms use the draw time; motion 7 / 7); WHO'S ON's own row (the owner's account was also in another shard's room — ROOM CUBE, a room outranks the city: the check now takes any place; radio 55 / 55); THE TRI-VISION at the reveal (face A jaywalk — green alone 7 / 7 ×2: another shard's billboard switch overlapped it); THE ROOM's OWN COST at 4× CPU (55 → 72 ms — the known timing red of the last passes under four shards) |

All my servers stopped at the end (the emulators, `serve.mjs` :5173, :5179, :5174 + its worktree removed); the owner's :5190 preview wasn't running.
