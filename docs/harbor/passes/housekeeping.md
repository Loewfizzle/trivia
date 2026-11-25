# THE HOUSEKEEPING + AUDIO PASS (Nov 25, 2026)

Four groups: the boot bundle BUILT AT DEPLOY (the one narrow exception to "no build step"), screenshots out of git, the CLAUDE.md trim, the
audio fixes of an outside review. No rules change, no `/api` change. Commits: Group 1 `4f7f60c4` · Group 2 `260d0378` · Group 3 `119ced11` ·
Group 4 `7e7cfa27` · the docs `2a7c5e6d` · the close `53e3b6d8` (the tagged push) · the deploy hotfix `2331ca25` · THE DEAD START's fix (the last commit — pushed with NO deploy tag: **not live yet**).

## OPEN FOR BEN
0. **ONE FIX IS ON main BUT NOT LIVE — yours to release:** A START THAT DIES SAYS SO (the section "THE CLOUD's RUN … + THE DEAD START").
   Since JAYWALK LAST MILE's deploy (Nov 24) a start whose host drops out between the stamp and the match never comes down: the guests
   stay under the veil with no message until someone leaves. The fix is one line in `js/host.js`, tested, committed and pushed WITHOUT a
   deploy tag — a third production deploy in one pass was not this pass's to make. It goes live with the next tagged push of any pass, or
   say "deploy the dead-start fix" and it is one empty commit carrying the deploy tag.
1. **RE-PUBLISH: nothing** (no rules change).
2. **THE FIRST DEPLOY-BUILT BUNDLE IS LIVE** (2331ca25 — the section "THE FIRST REAL DEPLOY" below). What you see: on Vercel's page
   for a deployment the Build step now shows `Running "node scripts/deploy-build.mjs --prune"` and ONE line from it — `THE DEPLOY BUILD:
   boot-bundle.json 306 modules, 6669 KB (v …) · index.html asks for ?v=… · file-hashes.json 1404 files (the bundle's row in) · … ms` — and a
   deploy takes about a minute. On the site nothing looks different. **The first try (53e3b6d8) shows as a FAILED deployment in the list** —
   expected history, it shipped nothing: with a build command Vercel wanted its output folder named; the hotfix names the root. If a build
   ever fails again the deployment is red, its log says `THE DEPLOY BUILD FAILED — nothing ships:` and why, and the site stays on the deploy
   before it. **One small leftover, yours to call:** four config files are now readable on the site — `/vercel.json`, `/.vercelignore`,
   `/.gitignore`, `/.gitattributes` (Vercel hid them while there was no build step). All four are public in the GitHub repo already and hold
   no secret; a later pass can take the three dot-files out of the output if you want them gone (vercel.json has to stay where Vercel reads it).
3. **Named calls (overrule any):** a failed sound load is tried again 8 s later, not at once (a missing file would otherwise be asked for
   every time its sound is wanted) · THE SONG CAP counts the SONGS only (60 MB, the newest three always kept); the effects (≈ 35 MB in all)
   are not capped · the builder scripts are removed from the deployed output (`--prune`) · the AUDIO LEAVE row now reads
   `media after: voice … UNDER THE RAMP → after the ramp: all paused` (a routed voice is paused 30 ms after the cut, on purpose) ·
   the local server answers the bundle from memory (nothing is written to the working tree).
4. **`tests/integration/audio-cut.mjs` is flaky on the Beelink on BOTH codes** — ONE of its 33 checks red in 5 of 10 runs on the code
   before this pass, in 3 of 10 after it (a different check each time: THE ZEROS FIRST's −45…−78 dBFS, NO BURST by 8–14 %). Not a
   regression signal either way; your iPhone's ear is the proof for clicks (the list below).
5. **THE INBOX's Nov 19 entry "TO THE NEXT CITY PASS" (the crown flash on a solo end)** was already built by an earlier pass (the wash is
   gone for every game — css/components.css, tests/integration/end-flash.mjs); marked, nothing built here.
6. The 328 pictures already in git (125 MB on disk, 144 MB in history) stay until THE PRIVATE FLIP's history rewrite — the list of the
   biggest is at the end of this file.

## THE iPHONE CHECKS (the audio fixes — none of this ran on a real iPhone)
1. **Leave with the music ON:** a song playing in the city → swipe home → back, five times; then from the home-screen app. No click or pop
   at the leave, no squeal, the song goes on at the return.
2. **Leave with the music OFF (HEAR THE HARBOR):** the city's loops sounding → the same five leaves. No squeal, no click.
3. **ALL OFF:** leave + return — nothing sounds, nothing squeals. Then play a JAYWALK run MUTED (20 hops), unmute mid-run: the hop sounds
   are there at once (a muted run used to pile up work every hop).
4. **The silent switch:** flip it during a song and during a JAYWALK run, both ways.
5. **Siri / a call:** hold Siri (or take a call) during a JAYWALK run with a train passing, and during a HIGH RISE run; dismiss it. The
   effects come back by themselves or at the next tap, the train's bell with them; no sound stays stuck or silent for the rest of the run.
6. **JAYWALK's cues ON their moment:** the runway's tick + the out-drop, the leaf crunch, the area-arrive chime (they started 15–28 ms late).
7. **Clicks:** at the podium (the victory song) leave the app — that song is a routed voice: no click.
8. `/admin` → the phone reports → an AUDIO LEAVE row from your phone after any of the leaves: its end should read
   `media after: … UNDER THE RAMP … → after the ramp: all paused` (or `media after: all paused` when no routed voice was playing).

## GROUP 1 — THE BOOT BUNDLE BUILT AT DEPLOY
**Why:** `boot-bundle.json` (6.8 MB) was committed and rewritten on most deploys — 20 copies in four days, **51 MB of `.git`** (≈ 2.6 MB a
copy after compression, ≈ 13 MB a day).

**What changed**
- `boot-bundle.json` is no longer tracked (`git rm --cached` + `/boot-bundle.json` in `.gitignore`; history untouched, never a force-push).
- **`scripts/deploy-build.mjs`** = vercel.json's `buildCommand` (`node scripts/deploy-build.mjs --prune`). ONE step generates, into the repo
  root (still the served output): `/boot-bundle.json` · `/index.html` (THE BOOT PRELOAD's block written again from the same graph + the
  loader's `boot-bundle.json?v=<the bundle's own hash>`) · `/file-hashes.json` (hashed from the deploy's own bytes + the bundle's row).
  `checkDeploy()` checks the three against each other BEFORE and AFTER writing: the bundle parses, holds the boot list in order, every
  `@ns/…` import inside it is in it, its `z` is its size, the page's `?v=` is its hash, the list's row is its hash. Anything wrong → exit 1
  → the deploy fails (never a half deploy: nothing is written before the first check passes).
- `.vercelignore`: `scripts` → `/scripts/*` + `!` lines for the step and the three builders it imports (`build-boot-bundle`,
  `build-boot-preload`, `boot-bytes`, `build-file-hashes`); `--prune` removes `scripts/` from the output when the step is done.
- The committed `index.html` names the bundle with NO `?v=`; the committed `file-hashes.json` has no row for it. A page whose bundle is
  missing or refused boots from the modules (the loader's existing rule — Safari always takes that path).
- **Locally `scripts/serve.mjs` answers the same three files FROM MEMORY** through the same `deployFiles()` (rebuilt when a boot module,
  the page or the list changes on disk): the working tree stays clean and a test page never runs a stale bundle (the old trap: "rebuild
  the bundle before a Chromium E2E"). New flags: `--raw` (the files as they are on disk) · `--root <dir>` (another folder, its own `/api`).
- The builder reads every source with LF (`sourceOf` / `lf`): a CRLF working copy builds the same bundle (THE CRLF TRAP).
- THE DEPLOY TAGS rule is unchanged (`ignoreCommand`); the root `package.json` (firebase-admin for `/api`) is unchanged.

**Tests**
- `tests/boot-bundle.test.mjs`: "the bundle is current" → **the builder is deterministic + covers the whole boot graph** (built in the test).
- `tests/deploy-build.test.mjs` (new): not tracked + ignored; vercel.json runs the step; `.vercelignore` keeps exactly the step's import
  graph in the build; `deployFiles()` agrees; `checkDeploy` catches every way the three can disagree; the local server's in-memory path.
- `tests/integration/deploy-sim.mjs` (new) — **Vercel's step, simulated:** a clean copy of the tracked files → `.vercelignore` applied (git's
  own matcher) → the buildCommand run exactly as written → the output checked (every row of its hash list = its own bytes; every bundled
  module = its own `/js` file rewritten; `scripts/` gone; the page = the committed page + the `?v=`). A broken checkout (a boot module
  deleted) → exit 1, "THE DEPLOY BUILD FAILED … js/app.js imports js/store.js — NOT in the bundle", nothing written.
- `e2e-bundle.mjs`: `BUNDLE_MISSING=1` = no bundle on the server at all → every visit boots from the modules. `wk-edge.mjs` +
  `e2e-play-bounce.mjs` read the hash list AS SERVED (the bundle's row is the deploy's).

**Proven (Nov 25, the Beelink):** deploy-sim all green (2,020 of 3,764 tracked files uploaded, 243 MB; the build 2.9 s) · `e2e-bundle`
against the simulated output 24/24 (Chromium + WebKit) · `e2e-bundle` with no bundle on the server 24/24 · smoke against the simulated
output 24/24 · the in-memory bundle = the last committed one byte for byte (`v bfe25f4132a12642`, 6,829,982 bytes).

## GROUP 2 — SCREENSHOTS OUT OF GIT
- From now on a pass's screenshots go to `C:\Users\benja\Downloads\NEON\<pass>\` — never the repo.
- `.gitignore`: EVERY picture under `docs/` is ignored (it was only `docs/harbor/passes/` + `docs/games/`); `/screenshots/` as before.
- `tests/repo-growth.test.mjs`: a tracked picture under `docs/` or `screenshots/` must be LEGACY (the frozen Nov 25 list,
  `tests/fixtures/repo-images-before.txt`, 328 files — it only shrinks) or a named row of `REFERENCE` (the 11 pictures a doc links by name,
  each with its doc; a NEW one = a JPEG / WebP at 1×, ≤ 150 KB, `git add -f`). Anything else fails, whatever its size.
- Nothing was deleted (deleting does not shrink history).

## GROUP 3 — THE CLAUDE.md TRIM
39,751 → 35,696 bytes after the trim (the line: 40 KB; the target: 36 KB) — the pass's own audio line added after it. 31 long lines moved
VERBATIM into their docs' new section `THE RULES FROM CLAUDE.md (moved Nov 25 — THE HOUSEKEEPING PASS, THE CLAUDE.md TRIM …)` (jaywalk,
highrise, cartridge, harbor, profiles, match-kit, data-model, progression, audio, testing, title), one short pointer each.
`scripts/claude-md-coverage.mjs`: 0 missing against the diet's base and against the commit before the trim. Stale lines fixed: "No build
step" gains its ONE clause; THE CARRY's line no longer tells a pass to rebuild a committed bundle; the screenshots line.

## GROUP 4 — THE AUDIO FIXES (docs/audio.md "THE AUDIO FIXES (Nov 25)")
| # | the fix | how proven |
| --- | --- | --- |
| 1 | `onUnlock` ONE-SHOT; the games' sounds wait through ONE gate (`audio/sfx-kit.js#lateGate`): the first tap / the context's return (`onResume`, once, taken back) / MUTED = no wait; `decodeOnce` shares a decode in flight; HIGH RISE's `whenReady` takes its waiter back | `tests/audio-fixes.test.mjs` on the real engine + both games' sfx.js: 30 muted plays → 0 decodes, 0 listeners (it was 120 decodes for 10 hops); suspended → ONE wait a game; back → each file decoded once; ten asks before a decode lands → one decode a file |
| 2 | THE LEAVE CUT ORDER: the ramp scheduled first; direct at t = 0; routed voices at +30 ms and only while still left; the loops after; THE ZEROS FIRST; the suspend | the same test on the real engine + music.js (the order logged; a blur that comes straight back never pauses the routed voice; hidden: ramp → routed (≥ 24 ms) → suspend (≥ 125 ms)); `tests/audio-hush.test.mjs`, `audio-session`, `podcast-sweep` green; `audio-hush.mjs` 9/9, `audio-leave.mjs` 27/27 in Chromium; the harbor `mediacut` group |
| 3 | a failed fetch / decode forgotten 8 s later — flyers, ambience (ONE loader), the dailies, OVERCLOCK; decoded from a copy | source pins in the test |
| 4 | THE LATE CUES: JAYWALK starts at the first audible sample — ONE helper (`sfx-kit.js#leadIn`), HIGH RISE's too | the test: a 20 ms lead-in → `start(0, 0.019)` in both games; the buffer scanned once |
| 5 | JAYWALK + HIGH RISE after iOS's context rebuild (`onRebuild`) | the test: a stuck context → the tap's rebuild → 0 voices counted, decoded again, the bell loop back on the new context, a new sound's nodes all the new context's |
| 6 | JAYWALK's gain + panner disconnected on `ended` | the test: the nodes' `disconnect()` at the sound's end |
| 7 | the first tap blips once (and still asks); the lobby song through `musicInput()`; `ocLoop` re-reads the context + disconnects its gain; THE SONG CAP in sw.js | the test (one `createBuffer` at the first tap, `resume()` asked) + source pins + `tests/integration/sw-audio-cap.mjs` 11/11 in Chromium (LRU out first, a used song kept, the newest stay over the cap, an effect never counted, a kept song still answers a range) |

THE BOOT BUDGET was 3 KB over after the engine fixes (6,503 of 6,500 KB — it had been sitting at the line): five long comment blocks of
`js/audio/engine.js` moved verbatim into docs/audio.md ("engine.js — THE COMMENTS (moved Nov 25)") — 6,499 KB, no budget raised.

## THE FIRST REAL DEPLOY (Nov 25)
- **53e3b6d8 (the tagged push) — FAILED in about 13 s, shipped NOTHING.** The live site stayed on 3e5b798b (checked: `/api/time`'s `v`, the
  old page + its committed bundle still served) — never a half deploy. Vercel's log could not be read from here (it needs the owner's
  login); the cause by the timing + Vercel's rule: with a build command set, Vercel no longer falls back to the repo root as the output —
  it looks for a folder named `public`. Not catchable locally: deploy-sim runs the build command, not Vercel's own output step.
- **2331ca25 (the hotfix, the deploy tag) — `"outputDirectory": "."` in vercel.json → SUCCESS in about a minute.**
- **THE LIVE CHECK, read-only** (GETs only — nothing played, nothing written, no room opened): the live build is 2331ca25 · the live page
  asks for `boot-bundle.json?v=4c010e6eb4a17769` · the live bundle: 200, 306 modules, 6,669 KB, its `v` = the page's `?v=`, `z` = its size,
  `Cache-Control: public, max-age=31536000, immutable` · the live `file-hashes.json` (1,404 rows) carries the bundle's row `6577529d6276` =
  the bundle's own hash · **the bundle's hash, its size and that row are EXACTLY the local simulation's** (deploy-sim on the same tree) ·
  six sampled rows = the live files' own bytes · the bundled `engine.js` is the live file · `/js/audio/sfx-kit.js` is served, the live
  `sw.js` has THE SONG CAP · `/scripts/*`, `/package.json`, `/package-lock.json`, `/tests/*`, `/CLAUDE.md`, `/node_modules/*` → 404 ·
  `/board`, `/admin`, `/lab`, `/sw.js`, the manifest, a sound file → 200, `/api` answers.
- New on the site since the build step (named in OPEN FOR BEN 2): `/vercel.json`, `/.vercelignore`, `/.gitignore`, `/.gitattributes` → 200.

## THE CLOUD's RUN ON THE TAGGED PUSH + THE DEAD START (found there, fixed here)
- GitHub's `tests` job: **GREEN** on 53e3b6d8.
- The cloud's harbor run: 5 of 15 jobs red, ONE check each. Four are the SAME four that were red on THE CITY POLISH PASS's cloud run
  (d6c0afb5, Nov 24): `citydown` (the city job) · the `crew` timeout "D back in the lobby" (models) · THE ROOF BOARD "ONE face from the
  reveal" (show) · A7 "a preview link keeps its clock + flags in a room" (speed). The fifth was NEW: the audio job's `gameflows` **B2 — A
  START THAT DIES SAYS SO**.
- **B2 was a real bug, and not this pass's:** it reproduced locally 2 of 2 on the code BEFORE this pass (a worktree at 3e5b798b) and
  bisected to cf3d7271 — JAYWALK LAST MILE's THE REUSED START (Nov 24; that pass + HIGH RISE PAD + GO pushed with the ci tag, so no cloud
  harbor run saw it). `host.js#clearDeadStart` asked `|| starting ||` — `starting` had been "the start's promise, or null" and LAST MILE
  made it THE LOCK (`core/room-show.js#startLock`, an object that is always there): the cleanup never ran, so a start whose host died
  between the stamp and the match NEVER CAME DOWN — every guest stayed under the veil, no message. **Fixed on main, NOT DEPLOYED (OPEN FOR BEN 0):** the cleanup asks the lock for
  THIS ROOM's start in flight (`starting.of(state.code)`). `tests/dead-start.test.mjs` (new) + the harbor `gameflows` group: B2 **4/4
  twice** (the note after ~3.3 s on both phones), was 3/4.
- **`citydown` was a stale test** (red in the cloud since THE FIX PASS made the bundle boot every Chromium visit: the bundle SUPPLIES
  `scene.js`, so blocking its URL blocked nothing — "the module asked 0×"): its page now boots `&nobundle` — the failing-module path is
  the modules' path. Green locally.
- The guards after the fix: unit **2,714** · harbor `citydown,gameflows,gamestart,newstart,core` **47/47** · `e2e-play-bounce` JAYWALK
  **30/30**, HIGH RISE **22/22** (the reused start still holds) · smoke **24/24** · `e2e-bundle` all green.
- Left for the next city pass (not built — three cloud-only reds, none reproduced or looked at here): the `crew` timeout, THE ROOF BOARD's
  ONE face on a returning phone, A7.

## THE REPO's SIZE
- `.git` on the Beelink: 670 MB (the pack 575 MB); GitHub ≈ 586 MB.
- What stops growing: the bundle (51 MB in four days) and any new picture under `docs/` (the pictures already there: 144 MB of history).
- What still grows: source + docs (small), `file-hashes.json` (63 KB a change, it deltas well), audio / art added on purpose.

## THE BIGGEST PICTURES IN GIT (not deleted — for the history rewrite)
By folder: `screenshots/` 23.9 MB (29) · `docs/harbor/passes/holdem-city/` 18.0 MB (45) · `docs/harbor/refs/` 17.9 MB (39) ·
`passes/btc-card/` 9.1 MB (11) · `passes/buzzed-lightyear/` 8.8 MB (8) · `passes/overclock-cards/` 6.9 MB (14) · `passes/city-fixes/` 6.6 MB
(36) · `passes/card-fixes/` 5.8 MB (20) · `passes/load-fix-5/` 4.5 MB (4) · `passes/board-2b/` 4.5 MB (16) · `passes/load-fix/` 3.1 MB (10) ·
`passes/pd-2/` 2.9 MB (12) · `passes/pd-4/` 2.6 MB (16) · `docs/harbor/ref/` 2.4 MB (2).
The biggest files: `passes/buzzed-lightyear/buzzed-motion-402.png` 3.9 MB · `passes/load-fix-5/owner-iphone.png` 3.3 MB ·
`passes/btc-card/burst-402x874-strip.png` 2.7 MB · `refs/shell/shell-look.png` 2.1 MB · `refs/abduction.jpeg` 2.0 MB ·
`refs/shell/tier-gem-cards.png` 1.9 MB · `passes/overclock-cards/cards-webkit-402.png` 1.8 MB · `ref/city2-harbor.png` 1.7 MB ·
`passes/overclock-cards/cards-402.png` 1.6 MB · `passes/holdem-city/g2/roofB-night-1440x900.png` 1.5 MB.

## THE FINAL RUN (Nov 25, the Beelink, one suite at a time, nothing else busy; this pass's own emulators + `serve.mjs --emu`)
- unit **2,712 / 2,712** (`node --test tests/*.test.mjs`) · rules + `/api` tests not run (neither was touched).
- smoke **24/24** · `e2e-bundle` **all green** (Chromium + WebKit, 24 checks) · `wk-edge` **7/7** (the modules) + **7/7** (`--qs "&bundle=1"`:
  the bundle through the worker, a deploy, THE CARRY) · `e2e-play-bounce` JAYWALK **30/30**, HIGH RISE **22/22**.
- `e2e-jaywalk` **122/122** (it has no fast mode: the one run is the full one) · `e2e-highrise` **125/125** · the HIGH RISE zero-garbage
  guard: `tests/highrise-zero-garbage.test.mjs` in the unit run + `highrise-alloc.mjs` passed (the game's own code 6.0 KB of objects a
  second in the night run, three.js's own 31.8 — the play path of the sounds makes nothing new).
- the audio checks in Chromium: `audio-hush.mjs` **9/9** · `audio-leave.mjs` **27/27** · `sound-sync.mjs` **42/42** · `podcast-sweep.mjs` **14/14** ·
  `jaywalk-podcast.mjs` **5/5** · `sw-audio-cap.mjs` **11/11** · `audio-cut.mjs`: flaky on old and new code (OPEN FOR BEN 4).
- the harbor GROUPS (local): `core,load,bootfloor,weakstart` **63/63** · `gamestart,newstart` **23/23** ·
  `music,mediacut,sounds,tape,musiccache,rebuild` **157/157** on its second run — the first run's `tape` group timed out once
  ("the tape gives the song back after the jets"; its other 150 checks green), then `tape` alone **16/16** twice: a one-off, named.
- THE DEPLOY, SIMULATED once more on the pass's committed tree (a clean tree = the commit): `deploy-sim.mjs` all green (2,021 of 3,769
  tracked files uploaded; the build 3.0 s — `boot-bundle.json` 306 modules, 6,669 KB, v `4c010e6eb4a17769`; `file-hashes.json` 1,404 rows,
  every one = the output's own bytes; a broken checkout exits 1 and writes nothing) → that output served raw → `e2e-bundle` all green
  (Chromium + WebKit) + smoke **24/24**.
- Screenshots of this pass: `C:\Users\benja\Downloads\NEON\housekeeping\` (none in the repo).
