# THE HOUSEKEEPING + AUDIO PASS (Nov 25, 2026)

Four groups: the boot bundle BUILT AT DEPLOY (the one narrow exception to "no build step"), screenshots out of git, the CLAUDE.md trim, the
audio fixes of an outside review. No rules change, no `/api` change. Commits: Group 1 `4f7f60c4` · Group 2 `260d0378` · Group 3 `119ced11` ·
Group 4 `7e7cfa27` · the docs + the close (the tagged push).

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules change).
2. **THE FIRST DEPLOY-BUILT BUNDLE** — what you will see: on Vercel's page for this deployment the Build step shows
   `Running "node scripts/deploy-build.mjs --prune"` and ONE line from it — `THE DEPLOY BUILD: boot-bundle.json 306 modules, 6670 KB (v …) ·
   index.html asks for ?v=… · file-hashes.json … files (the bundle's row in) · … ms` — and the build is a few seconds longer. On the site
   nothing looks different. If the step ever fails the deployment is red, its log says `THE DEPLOY BUILD FAILED — nothing ships:` and why,
   and the site stays on the deploy before it. NOT PROVEN before the push (no preview deploy): that Vercel keeps the five builder scripts in
   the build after `.vercelignore` (`/scripts/*` + five `!` lines) and serves a file the build writes into the root — both simulated locally
   (deploy-sim), both checked read-only on the live site after the deploy (the summary says what was found).
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
