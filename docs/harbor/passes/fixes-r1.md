# FIXES R1 — THE BUGS: /admin back, the share card made safe, the crashes + the sound, the cloud back to green (Nov 15 2026, the mini PC)

From THE REVIEW (`docs/reviews/review-nov15.md`, committed as it is in Group 0) + the owner's notes from the city chat. **No rules change** (every
node touched is server-only under the default deny: `shr/ shrp/ shrx/`, `rl/shrup:*`). 8 functions (nothing new under `api/` but two `_lib`
pure modules). The lab export at the start: 222 marks, **no open FIX** (the two CITY E rebuilt — MOSTARAC + the horseshoe — now APPROVE).

**Step 0** — `decisions.md` (THE REVIEW's DECISIONS bullet: the split accepted · THE FROZEN GAMES = (b) "keep compatible", built in R2 · THE SOURCE's
"1 OF 1" stays · the share = the LINK ONLY · the ticket pop-up (R2) = today only) + `plan.md` "OWNER'S NOTES — NOV 15 (FIXES R1's Step 0)".

## Group 0 — /admin LOADS AGAIN (THE REVIEW A1; the inbox's Nov 15 5:09 pm entry ✓)
- **The cause:** `js/admin/admin.js` declared `async function backups()` TWICE (the progress-reset backups list, Nov 4, + CITY E's nightly BACKUPS
  row) — a module may not, so the whole file failed to parse and /admin sat on "Signing in…" for everyone. CITY E's is `nightlyBackups` now.
- **Every shipped file parses:** 808 `js/` `api/` `sw.js` files, 0 bad.
- **The guards:** `tests/parse-all.test.mjs` (every shipped file parsed in ONE child — `vm.SourceTextModule`, 0.3 s; red on the old file) +
  `tests/integration/kit/page-loads.mjs` — the app, /admin, /board, /lab, /daychart loaded in **Chromium AND WebKit**, failing on a page error or a
  page left on its placeholder (red on the old file in BOTH engines: Chromium "Identifier 'backups' has already been declared", WebKit "Cannot
  declare an async function that shadows a let/const/class/function variable 'backups'"); `e2e-smoke.mjs` runs it FIRST (WebKit where `~/wk` is
  installed — the cloud says "Chromium only").
- **The owner's /admin on the emulators** (`admin-probe.mjs BACKUPS=1` — signed in as the owner, a seeded BACKUPS state + a share card):
  `Downloads\NEON\fixes-r1\admin-backups-390.png` (GITHUB 3 h ago · THE PC 40 H AGO in red), `admin-sharecards-390.png`, `admin-top-*.png`.

## Group 1 — THE SHARE CARD MADE SAFE (A2, A4 1–2, A5 + the owner)
- **A2 — ONE CARD A PLAYER A DAY, under parallel uploads:** THE SLOT `shrp/{pid}/{day}` is claimed in a TRANSACTION (the first upload mints the day's
  code; every other — at once or later — gets the SAME code) + `SHARE_UPLOADS_A_DAY` = 6 uploads a player a day (`rl/shrup:{pid}:{day}` → 429
  `share_limit`). `share-card.test.mjs`: 12 at once + 4 waves of 3 (each a different picture) → ONE code, exactly ONE card, refused only by the cap
  (THE REVIEW measured 12 → 12 cards and 45 after the waves on the old code).
- **A4 — THE SAME DAY KEEPS ITS CODE:** a changed card replaces its picture in place (the link already sent still answers — its page names the new
  picture `?si=<code>&v=<sha>`); the same bytes again write nothing (`{ same: true }`). **The phone uploads ONLY a changed card**
  (`share.js#blobHash` + localStorage `ns:shr` = ONE entry `{ pid, day, h, url }`): `wk-share-standalone.mjs` A — the screen opened → 1 upload; two
  reloads → still 1.
- **A5 — A WHOLE PNG + a short cache:** `checkPng` walks every chunk to IEND (IHDR first at 13 bytes, every CRC, an IDAT, NOTHING after IEND) — a
  header-only file, a real card + HTML + random bytes behind it, a broken CRC: all `not_png`. Only a COUNTED finisher uploads (no `dly/{g}/{day}/x/
  {pid}` — THE THROWAWAY GATE → 403 `not_counted`; the phone shares the picture itself then, as before). The picture's edge cache **1 h** (was 7 days
  + immutable): a card the owner deletes stops showing within the hour; at once = Vercel → Settings → Caches → Purge CDN Cache (docs/progression.md).
- **THE OWNER — THE LINK ONLY:** `navigator.share({ url })`, no text (wk-press + wk-share-standalone B).
- **THE OWNER — the HOME-SCREEN app "crashed + reloaded" after SHARE TODAY → sending it to himself.** What it was, as far as this machine can show:
  **a CATCH-UP RELOAD, not a crash.** CITY E deployed while his app was open; ONE DEPLOY AT A TIME queues ONE reload "for the next return"
  (`ui/lazy-import.js`) — and handing the link to Messages + coming back IS a return (hidden → visible) with no sheet of ours open, so the page
  reloaded. Reproduced in WebKit as the standalone app (`wk-share-standalone.mjs` C: the worker's `ns:build-gone` queued, a share, the app leaves +
  returns): on the old rule the return RELOADED the page; now **THE SHARE HOLD** — `reloadAtReturn` never runs within 60 s of a share's start or end
  (`share.js#shareHold` stamps the hub `globalThis.__nsShareAt`) — no reload; a return a minute later still reloads (the rule works). If it was an
  iOS kill instead, the next load sends a `killed` row (PAGE KILLED (likely memory) · screen · device · build); the catch-up reload logs a `reload`
  row (A CATCH-UP RELOAD … this page's build → the live) — **both now readable in /admin's phone reports** (/admin was dead when it happened).
  Also lighter: no re-upload on every open (A4), the link-only share (no text body).

## Group 2 — THE CRASHES + THE SOUND
- **CUSTOMIZE's EMBLEMS crash (again):** CITY D made the CARD tiles stills, but every EMBLEM tile was still a stack of animated composited layers
  (measured: **91 animations running in the EMBLEM tab's tiles, 40 in GLOW**). `.vl-dr-still` (CUSTOMIZE's grid + the trophies' lists): no
  animation / will-change / transition on any tile (emblems, glows, tubes, gems), a glow tile = its letters' own light (the moving pieces hidden, as
  `.vg-still`), an off-screen tile skipped (`content-visibility: auto`). Only the PINNED strip moves. **The proof** (`scores-memory.mjs --case
  customize`, 390 @3, 4× CPU, EVERY tab — CARD · EMBLEM · GLOW · TUBE — scrolled end to end ×3): 0 tile animations in every sample, GPU contexts 4 →
  4, canvas pixels 0.38 MP flat, the browser 858 → 968 MB (the old grid: 858 → 993), no reload. Shots: `Downloads\NEON\fixes-r1\customize-*.png`.
  Chromium can't reproduce an iOS memory kill — what changed is the 131 per-tile animations (each a GPU layer at 3×) → 0.
- **THE SQUEAL IN THE HOME-SCREEN APP** (`js/audio/engine.js` — docs/audio.md "FIXES R1"): a standalone app gets iOS's leave / return signals in
  another order (often NO blur, a late or missing visibilitychange; the context INTERRUPTED as it goes, RESUMED by the OS before the page's JS runs).
  Now: the context's own **'interrupted' = a leave signal** (the master 0 at once, the beds stopped, the fade back waits for 'running'; no resume
  fought on the way out) · **'running' while off screen** = silenced + suspended at once (the sound only ever comes back through the return: visible
  → resume → running → the ramp from 0) · **A7** (a blur's return on a context that isn't running = a pending fade + a resume, not `resumeBeds()`
  alone — the master stayed at 0) · **A15** (running while hushed = hushed again). `navigator.audioSession` stays 'playback' with the music on — an
  'ambient' session is what left the graph dead after the background (M4).
  **The proof:** `tests/audio-standalone.test.mjs` — the REAL engine + a fake DOM / AudioContext through the standalone orders: 7 / 7 (6 red on the
  old engine) + `audio-leave.mjs` (Chromium) green. **Not provable off a real iPhone** (Playwright's WebKit on Windows has no Web Audio at all; no
  emulator plays Core Audio): what iOS does with its OWN output buffer at the app switch — the owner's ear in the home-screen app is the check.

## Group 3 — THE CLOUD BACK TO GREEN (A3)
- **The unit job:** `tests/backup.test.mjs` + `tests/killed-page.test.mjs` imported server files reaching `api/_lib/fb.js` → firebase-admin (not
  installed in the unit job): their pure halves are modules of their own — `api/_lib/backup-pure.js` (the lists, `tokenVerdict`, the slices, the
  packing; `backup.js` re-exports them) + `api/_lib/log-pure.js` (`cleanReport`; `api/log.js` re-exports it). The guard: `tests/unit-imports.test.mjs`
  walks every unit file's static graph (+ its own literal dynamic imports) → no path to fb.js or a package (red on the old killed-page import). +
  the CLAUDE.md line (THE UNIT JOB INSTALLS NOTHING). The proof: the whole unit suite run with the root `node_modules` renamed away — **2006 / 2006**.
- **`windows` (the cloud drew at 1.5×):** THE ONE-STALL RULE's step now runs only for a person's phone — never under automation unless
  `&stallstep=1` (like its memory's `&tiermem=1`); real visits unchanged. Locally `ONLY=windows,cameras` **72 / 72**.
- **`lobby` — NO TWO CAMERAS "HOURS hidden":** not reproduced as one bug — locally the group's FIRST run failed a DIFFERENT path (`no-observer-pre`,
  the known local flake) and the rerun was 13 / 13. **QUARANTINED** with a named reason (docs/testing.md "THE CAMERAS QUARANTINE"): a failed path
  runs once more, alone; a pass counts green and is NAMED in the warnings (`[quarantine]`); two fails stay red. Locally 13 / 13 (in that 72 / 72).

## Group 4 — THE SMALL ONES
- **The backup:** the PC's `checksums.sha256` written with LF, no BOM (`fetch.ps1` — `WriteAllLines` wrote CRLF: Git Bash's `sha256sum -c` failed
  EVERY line on the real 2026-11-15 folder; LF → all OK) + **A16** written down (docs/backup.md: the PC task runs only while Ben is signed in;
  GitHub is the main copy; how to make it run signed out — Ben's call).
- **A12** (`took = null` at the top of `onDown`) + **A13** (the twin lookup by every press rule — `TWIN_SEL`): `tests/fixes-r1.test.mjs` + wk-press's
  two new cases (a second tap's REAL click arrives · a share re-rendered mid-press acts at the lift, no rescue).
- **A10** — SCORES keeps the truth: a refresh that FAILS over a kept list says **COULDN'T UPDATE** (today · all time · each board), a fresh answer
  clears it (`Downloads\NEON\fixes-r1\scores-couldnt-update-390.png`). **A14** — the add-me link is forgotten only once the server ANSWERED (no
  answer — status 0 — keeps "ADD <NAME>?" for the next visit).

## The final local run (the emulators + `DAILY_TEST=1 serve.mjs --emu`, nothing else busy)
| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` | **2006 / 2006** (and 2006 / 2006 with the root `node_modules` renamed away — the cloud's unit job) |
| `/api` `server.test.mjs` | **62 / 62** · `share-card.test.mjs` 1 / 1 · `backup.test.mjs` 2 / 2 (rules untouched — not run) |
| smoke `e2e-smoke.mjs` | **18 / 18** — THE PAGES LOAD: /, /admin, /board, /lab, /daychart in Chromium + WebKit, then the three games |
| `e2e-daily.mjs` | **95 / 95** |
| `wk-press.mjs` (WebKit) | **39 / 39** (+ A12, A13 ×2 — red on the old tap watch) |
| `wk-share-standalone.mjs` (WebKit as the home-screen app) | **10 / 10** (C red on the old reload rule) |
| `audio-leave.mjs` (Chromium) · `tests/audio-standalone.test.mjs` | green · 7 / 7 (6 red on the old engine) |
| the memory proof `scores-memory.mjs --case customize` | 6 / 6 — 0 tile animations, flat, no reload |
| harbor `ONLY=windows,cameras` · `ONLY=vault,tapfit` | **72 / 72** · **82 / 82** |
| `build-file-hashes` · `build-boot-preload` · `build-preload-graph` | current (no import changed in the shipped graph) |

Servers: my own emulators + `DAILY_TEST=1 serve.mjs --emu` (restarted after the `/api` suites), both stopped at the end; Ben's `:5190` kept.

## Left for R2 (THE REVIEW's split)
A6 (the backup's deeper parts for `dly`), A8 (the scroll-stop tap — after an iPhone check), A9 (the held run's refusal re-read), A11 (the live
lane's forgotten record), A17 (the share page's host), A4 step 3 (a smaller card format), B1 option (b), B2 T1–T7, B3, Part C (CLAUDE.md's
corrections); + root-causing the cameras group's `no-observer-pre` "fit" frames (now quarantined).
