# THE BEFORE-LAUNCH PASS (Nov 22, 2026 — app + console + server; the mini PC "beelink", Opus 5.5)

**RE-PUBLISH: database.rules.nov22-beforelaunch.json** (`Downloads\NEON\` — the same file as the repo's `database.rules.json`; also
`database.rules.LATEST.json`): `rooms/{CODE}/prism · oc · ocm` — the whole-node delete gone, a `{match}` deleted only when it is not the room's
game AND 10 min after its night record (THE REPORT LOCK); `seal/{CODE}` kept while an OVERCLOCK match is the room's game; `game/out/{uid}/at`
≤ now + 5 s; `game/ps/{ci}` = the server's now (kept); an OVERCLOCK board `oc/{m}/{c}/{uid}` closed at its unseal. The fallback on the old
rules: every write the code makes passes on them too (the prune + seal wipe ask only for what the new rules allow; `ps` is a plain write
there); the server's checks need no rule. Until the re-publish these locks simply aren't enforced.

## OPEN FOR BEN
1. **RE-PUBLISH** the rules (above).
2. **THE FIRST-VISIT BUNDLE ships for SLOW lines only** — measured, it loses ~0.4 s on 4G (the modules compile while they download) and wins
   ~2.5 s on Slow 4G; Chrome's own line estimate decides (Safari has none → the modules). Want it on for every first visit anyway? One line
   in index.html (`slow ||` → `true ||`). The numbers: below.

## GROUP 0 — the start
- THE GARDEN PARTY PASS's cloud run (44987058656): `tests` green; `harbor` red on ONE job — `perf`'s MEMORY (20 title↔setup cycles, heap
  +39.3 MB). Red since CITY I (+26.4) → CITY G / PART 2 (+38.7 / +38.8), "never reproduced here".
  **REPRODUCED + FIXED:** it was the BROWSER — the cloud runs stable Chrome, this machine Playwright's Chromium. Stable Chrome 157 here:
  +63 MB. The heap snapshot's retainers named two causes: (1) `screens/harbor/people.js#warm` — the next block's idle-time planner re-queued
  itself step by step; on a page that is never idle each step waits its whole 2.5 s timeout, so every closed city lived on in the queued
  closures (`IdleTask → run → ctx`); `destroy()` now ends the chain and cancels the queued callback. (2) `ui/canvas-safe.js` kept a WeakMap
  canvas → context — the context points back at its canvas inside Blink, so the value kept its key alive; a WeakSet now (the context asked for
  when needed). **+63 → +5.1 MB, flat at 40 cycles (+5.3).** In CI mode on Playwright's Chromium: 4.3 MB (as before).
- THE LAB: 226 marks, the owner re-approved every CHANGED row, **no open FIX**.
- The inbox: Nov 22 1:40 am (e2e-taps' TODAY'S SCORES = a run-setup red): green on `DAILY_TEST=1` (Chromium 31/31, WebKit 29/29) + CITY G's
  start-up guard (`kit/daily-mode.mjs`) — ✓ done (22aeb54f).

## GROUP 1 — HOST TRUST (console-fix.md items 1, 2, 3, 6 + OVERCLOCK's re-grade — docs/match-kit.md "HOST TRUST")
- **PRISM DROP** (`core/match-report.js#prismVerify`): SCORE RUSH capped at each player's own board; past THE RUSH BOUND = ranked 0 (loses
  the win); BATTLE / SURVIVAL refuse a `play` board put out within 10 s. The host's placings checked on the original, the credit from the
  corrected game.
- **OVERCLOCK — THE SERVER's RE-GRADE** (`games/overclock/regrade.js`, the pools `api/_lib/oc-banks.js`): `ok` = min(board, the graded sealed
  picks), `pts` from it + `doneAt` + the start read back from the host's `tm` (one start, the rounding window), THE HUMAN FLOOR, CLOSEST
  CALL, DUMB LUCK replayed. The picks now ride the board's own write (view.js) — THE ONE RACE ALLOWED for old phones (one part).
- **A REFUSAL** (`api/report.js#wreck`): 409 + `logstats/wreck`. **The snapshot path never pays a host-graded match of 2+**; the honest
  host's REMATCH / BACK waits ≤ 6 s for its own report (`host.js#settleFinal`). (The first draft sealed refusals + gave the move-on 5 s —
  THE FRESH-EYES REVIEW broke both: below.)
- **HOLD'EM's holdsRun** (view.js): seated, not out, the dealer's table not ended — LATCHED (the first try read the room's game: the room's
  game + table vanish in separate events, the router asked in between → every phone went to the city); its own table listener while held.
- **THE REPORT LOCK** (rules + `core/room-logic.js#reportLocked` + host.js's prune; the seal wiped from the lobby only).
- **THE CALLS MADE (overrule any):** the snapshot path never pays a host-graded match of 2+ (an honest match whose every report missed its
  final is lost — the host's move-on now waits for its own); a refusal is never sealed; a pool
  the server can't read = held only to the board; one part of slack only for an old phone's late picks; `testHostTrustOff` (emulators only) for
  e2e-profiles' hand-made podium finals; the fixtures (`tests/fixtures/finals.mjs`) are now an HONEST host's OVERCLOCK final (boards + clocks)
  and PRISM's boards carry their scores.

## GROUP 2 — THE FIRST-VISIT BUNDLE (docs/harbor.md "THE FIRST-VISIT BUNDLE")
`node scripts/build-boot-bundle.mjs` → `/boot-bundle.json` (304 modules, 6.65 MB raw, ~1.72 MB br); index.html's ONE loader + ONE import map
(`@ns/<path>` + the real URL → one blob — one instance). Measured with `scripts/serve.mjs --h2` (HTTP/2 + brotli, as Vercel) +
`boot-time.mjs --android --cpu 4 --net 4g|slow4g` (Chrome's Android profile; Lighthouse's Slow 4G = 150 ms, 1.6 Mbps), cold, 3 runs, medians:

| | before (the modules) | the bundle, every first visit | SHIPPED (slow lines only) |
| --- | --- | --- | --- |
| 4G | reveal 7,350 ms · 341 requests · 2,377 KB | 7,754 ms (+0.4 s) | **7,196 ms** (the modules) |
| Slow 4G | reveal 17,530 ms · 343 requests · 2,378 KB | 15,349 ms | **15,043 ms (−2.5 s)** |

(The bundle's ~300 blob loads still show as "requests" in CDP; its network requests ≈ 40. The 4G loss: the modules compile while they
download, the bundle only once all of it is in — its JSON parse is ~30 ms.) THE BOOT ROOM 22,094 → 19,109 B over the whole pass (no budget
raised). e2e-bundle (Chromium + WebKit) all green; errlog names a blob frame's real file.

## GROUP 3 — THE REVIEW's BEFORE-LAUNCH ITEMS (each checked first)
- **Already fixed by earlier passes:** A5 (the whole PNG + the 1 h picture cache + counted only — FIXES R1), A7, A8, A10, A12, A13, A14, A15,
  A16, B1 (b), Part C.
- **Built:** A6 THE DEEP SLICES (docs/backup.md — red on the old code) · A4 step 3 (a JPEG link card, 3 days; the Spark maths in
  docs/progression.md: ~650 → ~4,700 daily finishers before 1 GB) · A17 (ONE canonical origin) · A9 (a held run's no-op checked once by
  compare-and-set) · A11 · B2 T6 (PRISM's preload 61 → 54 modules, 642 → 616 KB) · B2 T7 · B3 F2 (`room.js#hostRoom`) · B3 F3.
- **Still open (named — M refactors of the console, each with regex pins):** B2 T4 (cartridges reading the store), B3 F1 (`entryVerdict`),
  B3 F7 (the pure extracts).

## THE FRESH-EYES REVIEW (a separate agent that wrote none of it — a modified host + a modified rival; proofs-of-concept as pure scripts)
**HIGH**
- **H1 — the snapshot path skipped every check** (a host-written `game.go`, or a real start 5 s after a night record he wrote without ever
  showing a final). **FIXED:** a host-graded match of 2+ is never paid from the snapshot; `movedOnAt` + the grace removed; the honest host's
  REMATCH / BACK waits for its own report (`settleFinal`).
- **H2 — the live-board check beaten by a future-dated `game/out/{uid}/at`.** **FIXED:** rules — the out's `at` a number ≤ now + 5 s.
- **H3 — SCORE RUSH: the host wrote a RIVAL's row low.** **FIXED:** the rows ARE the boards.
- **H4 — OVERCLOCK: the host chose a challenge's start one-sidedly** (a rival's clock set to 0 → under THE HUMAN FLOOR). **FIXED:** every
  finisher's clock holds (the clamped ones too) + the SERVER's stamp `game/ps/{ci}` (rules: === now) within 1.5 s.
- **H5 — a modified RIVAL could wreck honest matches** (a) PRISM: saying offline while saving → put out as "gone" with a fresh board;
  (b) OVERCLOCK: toggling `ok` between the unseal and the phase change. **FIXED:** (a) "gone" needs the board quiet; (b) rules — the board
  closes at the unseal; and no refusal is sealed any more.
**MEDIUM**
- **M1 — the seal's lock reads the host-written game/id (or a deleted meta):** wiping the seal gives back the boards' own ok. **NAMED** (an
  accepted limit — docs/overclock.md; a robust lock needs a per-match seal rule).
- **M2 — a pool edited between deploys:** **MITIGATED** — a deal naming an item the server's pool lacks = blind; an edited answer (same id)
  stays named.
- **M3 — sealing + a quick honest move-on lost matches for good:** **FIXED** (no seal; the host's move-on waits for its report).
- **M4 — a failed bundle boot reloaded into the bundle again (stuck):** **FIXED** — a tab with the watchdog's reload flag never takes it.
- **M5 — HOLD'EM's latch never cleared if the dealer replaced the table:** **FIXED** — the latch names its match; another table lets go.
**LOW** — the bundle fetch with no timeout before its headers: **FIXED** (8 s abort) · error lines off by one: **FIXED** (the prelude on
the first line) · the bundle never runs on an iPhone (no line estimate): **NAMED** (OPEN FOR BEN 2) · PLAY AGAIN's quiet proof deletes
within 10 min: **NAMED** (cleaned by a later start's prune or the room's deletion) · `refresh()` re-fetching real files in bundle mode: named.
**Sound (its list):** the rules vs the honest host's start / back / rematch / prune / seal wipe; the re-grade's arithmetic for honest
matches; the late-picks tolerance; the RUSH window; the trust switch emulator-only; the bundle rewrite on all 304 modules; one import map
before any module, one instance per module, the fallback before the map.
**Found by the final run (mine):** HOLD'EM's held listener answered from the cache INSIDE onValue and re-entered `update` before its handle
was set — "Maximum call stack size exceeded" on a guest when the room moved on (the smoke test). **FIXED** (the handle first).

## THE FINAL RUN (the mini PC, fresh emulators + `DAILY_TEST=1 node scripts/serve.mjs 5173 --emu`, nothing else busy)
- unit **2,558 / 2,558** · rules **103 / 103** · /api server **73 / 73** · progression **10** · coastclear **17** · daily-module **24** ·
  daily-drop **15** · daily-highrise **7** · daily-jaywalk **8** · password **11** · holdem-server **21** · backup **2** (+ unit 4) · share-card
  **4** · friends **11** · lab **2** · sightings **7** · vault-2b **3** · vault-2c **3**.
- smoke **24 / 24** (its HOLD'EM step now ends the table through the dealer first — the honest END GAME; a direct BACK mid-hand is the
  moved-on room THE TABLE hold protects) · e2e-profiles **148 / 148** (its retired-words check scoped off the TODAY table's own "NOT PLAYED
  YET" rows — date-driven: the 5th daily went live at 4 am) · e2e-prism FAST **67 / 67** · e2e-oc-2 **27 / 27** + e2e-oc-new **75 / 75**
  (real honest OVERCLOCK matches through THE SERVER's RE-GRADE) · e2e-holdem FAST **25 / 25** · e2e-bundle all green (Chromium + WebKit) ·
  e2e-taps Chromium **31 / 31** + WebKit **29 / 29** · harbor `load` + `bootfloor` green; `perf`: MEMORY **green (+3.3 / +3.6 MB)**, BATTERY's
  "visible again at 60 fps" 13–14 frames in 0.6 s on this machine (a timing check the cloud skips — `okT`; not this pass's code).
- daily-jaywalk went red 1 in 4 mid-pass with A9 reverted too (its timing-judged SLOWED → CUT cases) — green in the final run; named.
- THE BOOT ROOM 22,094 → **19,109 B** (304 modules; no budget raised). PRISM's preload 61 → 54 modules.
- Servers: every one this pass started is stopped (the emulators, :5173, :5443 — the owner's :5190 preview left running).
