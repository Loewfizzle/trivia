# CITY 1.0 OUT (Nov 5 2026, after midnight → morning) — the pass log

**The owner (00:15 am):** "Why don't we just delete City 1.0 right now? No one goes to it." — DECIDED: City 1.0 out NOW (not at THE
SWITCH-OVER), before SHELL 2.0. Source: review-6.md H (H7, H8, H12 + the big files' markers) + the owner's Nov 5 notes (plan.md
"OWNER'S NOTES — NOV 5 (after midnight)"). THE RULE OF THE PASS: after Group 0, NOTHING CHANGES ON SCREEN. Run unattended (the owner asleep).

**No rules change** (no database node or rules branch belonged to City 1.0 alone — checked).

## Group 0 — THE STUCK JOIN (a live bug; deployed at once, 64d4fe1, the deploy tag)
- **What it was:** City 2.0's title is never unmounted by a room (the room lives in the city), so the JOIN (or HOST) that got you in left
  the title's `busy` flag true, the code boxes' `is-busy` (the BREATHING the owner saw) and the old word in the field. After a LEAVE, every
  `join()` returned at once — nothing could be typed in, nothing joined. A second cause: a reload inside a room left `?room=` as an "invite"
  that pre-filled JOIN after the leave. (HOST was dead the same way after hosting.)
- **The fix:** the room's edges (in AND out) reset the dock's JOIN + HOST (`title.js#freshDock`); an exit clears the invite + the REJOIN
  offer (`room.js#exitRoom`); a resumed room clears the `?room=` invite (`app.js`); a REJOIN to a room that's gone says "That room has closed".
- **Tests:** harbor `stuckjoin` (the `lobbyfix` job): a guest leaves by ☰ LEAVE ROOM, the HOST leaves (handed over), the last one out (the
  room closes), a reload in the room then a leave, a reload after a leave — each: JOIN fresh (empty, nothing breathing, no stale offer) and a
  TYPED word gets in; at 402 + 1440 (desktop: the guest's leave). It FAILS 3 of 4 on the old code (the field "WENT", breathing true —
  exactly the owner's screen). `wk-room.mjs` checks the leave → JOIN in WebKit (6/6).

## Group 1 — CITY 1.0's TIME CAPSULE (before anything was deleted)
- `C:\Users\benja\Downloads\NEON\museum\` (never in the repo): `video/` — four .webm clips recorded from the real page on the mini PC
  (a CDP screencast → 30 fps → Playwright's bundled ffmpeg, VP9; no ffmpeg on the PATH): `city1-night-phone` (32 s, 402 pt, 10:30 pm),
  `city1-neon-comes-alive-phone` (40 s, dusk 6:54 pm), `city1-day-phone` (22 s), `city1-night-desktop` (22 s, 1440 × 900); `shots/` —
  night, day, Halloween, Christmas Eve, rain, snow at 402 × 874 + 1440 × 900, the dock + the sign up close; `README.txt` (what it was,
  the dates, how to run it again).
- **The tag:** `city-1.0` ALREADY EXISTED (Oct 20 — "City 1.0: the district title city, before City 2.0", on c8b26af — City 1.0 BEFORE the
  Harbor began; City 1.0 kept changing after it). Moving a pushed tag was refused by the safety check (a destructive push), so the LAST
  commit with City 1.0 (64d4fe1 — Group 0 included) got **`city-1.0-final`** (annotated, pushed). Whether `city-1.0` should move there is
  the owner's call (one command — the summary asks).

## Group 2 — CITY 1.0 DELETED + THE BORROWED FILES MOVED
- **THE MOVE (42edf9f — git mv, bodies unchanged, 59 specifiers in 30 files rewritten):** `marks`, `palette`, `neon-ramp` (PURE) →
  `js/core/`; `backdrop` → `js/screens/` (the app, THE BOARD + a game share it); `fx`, `sun`, `stars`, `frost`, `rainbow`, `aircraft`,
  `weather-fx`, `live-weather` → `js/screens/harbor/`; `fireworks` → `harbor/fireworks-2d.js` (harbor/fireworks.js is the GPU show).
  review-6 H3 closed by the move: the force-flag test reads every file in `screens/harbor/`.
- **THE DELETION (7bacade):** the 9 City-1.0-only district files (scene, furniture, party-fx, people, rain, street, signs, sign-logic,
  wildlife) + the folder; `screens/lobby.js` (the old lobby screen); `core/street-life.js`, `core/people.js`, `core/trees.js` (City 1.0's
  street, PURE — the Harbor has its own); title.js's City 1.0 forks (the scene choice, the rain bed, the thunder, the plain SPEAKEASY, the
  Halloween web + spider, ~20 `createHarbor ?` branches); `core/city.js#isCity2 / cityFailed / CITY1_URL` + every caller (the app's routes,
  the mood, the party music, the podium's + the menu's wording); City 1.0's music rule (`mood.js#moodAt / autoMood`); the backdrop's City 1.0
  render; `chat/ui.js#createChatStrip`; `profile.js#promptKey` (+ its key card — see Known issues); `components.js#accessGranted`;
  `ambience.js#startRain`; `party.js#pickPartyWindows`; ~430 lines of City-1.0-only CSS (the lobby, the chat strip, the hush-word card,
  the key sheet, the web); City 1.0's suites (`e2e-title / sky / street / rainbow / people / party / chat`, `lobby-shot`, `ui-shots`,
  `brand.html` + `render-assets.mjs`) + their unit tests (the street, the people, the sign rotation + ticker, City 1.0's mood hours).
- **`?city=1`** (+ any old link) lands on the Harbor (a check in the harbor `core` group); `?city=2` still accepted (kept on the address bar,
  read by nothing).

## Group 3 — THE BIG FILES SPLIT + THE DEAD CODE SWEPT
- **title.js: 2,059 → 1,254 lines** (81e52f2): THE NEON COMES ALIVE + THE RACE + THE MUSIC STARTING → `title-neon.js` (408); the living
  city's taps + the screen at rest → `title-taps.js` (260); the dock's work (JOIN, HOST, the notes, the rings' light, the streak flame) →
  `title-dock.js#createDockWork` beside its markup (155 → 400). title.js keeps mount / unmount, the sequence, the sign's dress, the room's
  wiring, the screen's update. Done by **`scripts/split-closure.mjs`** (new, a dev tool on acorn): a run of whole statements moves AS-IS
  into a factory; every name it shares with the closure is rewired through live getters / setters (`T.<name>` in, `<inst>.<name>` out),
  scope-exact (its own resolver: function + block scopes, params, catch, var hoisting), refusing a cut that splits a statement or meets a TDZ.
- **scene.js: NOT split this pass** (3,144 lines — the part the owner allowed to wait). The tool is ready; but `drawHarbor` + the camera
  run every frame, and every shared name would go through an accessor — the split wants THE BASELINE GUARD's A/B (`ONLY=perf`) around it,
  a pass of its own.
- **THE DEAD CODE (3657b36):** `harbor/aircraft.js#createAircraft` (City 1.0's plane painter, ~230 lines), water.js's unused wakes queue,
  `config.js` APP_TAGLINE / APP_VERSION / signGames, `host.js#startBusy`, `ambience.js#startNeonHum`, `logo.js#monogramSvg`, stale
  comments; H12's dead CSS (`.title-help`, `.pf-streak / .pf-flame`, `.pf-goal*`, `.pf-holo`, `.fin-1…4`, the unused nd-pair / nd-board /
  nd-card-btn / nd-cb-* blocks, `.pf-acc-key`). **review-6 H7 was WRONG about signs.js's drawGooseneck / lampLightMap / lampGlows** —
  the billboard's bake calls all three (removing them blanked the title in the preview; caught by pixdiff, restored).

## THE NUMBERS
| | before (city-1.0-final) | after |
| --- | --- | --- |
| js + css lines | 138,713 | 133,235 (js/css diff: +1,292 −6,770) |
| js files | 572 | 561 |
| tests (diff) | | +116 −2,832 (City 1.0's suites) |
| title.js | 2,059 | 1,254 (+ title-neon 408, title-taps 260, title-dock 155 → 400) |
| scene.js | 3,144 | 3,144 (its split waits) |

## PROOF (nothing changed on screen)
- **pixdiff** against a worktree of the pre-pass commit (`city-1.0-final`) on :5174, at 402 + 1440, after each group: night, noon, golden-
  free scenes, Halloween, Christmas, a ROOM by night + by day (title-preview's new `&act=room`), a FULL CARD over CUSTOMIZE + the YOU page
  (pixdiff's new `page:` scenes). Every A-B pixel left sits on something that moves on its own clock (the shadowboxer's window, the walkers,
  the waiting figures' breathing, a flickering jack-o'-lantern); **an A-vs-A run (both sides the old commit) shows the same areas** — noise.
- **THE SPLIT's ONE SLIP (caught locally, never live):** `split-closure.mjs` rewrote BOTH halves of a shorthand property — `{ scene }`
  became `scene: T.scenene` (a sighting's moment got no scene: the parked print + the fast legendaries' photo failed in the first full
  harbor run) and the test hook's `note: dk.noteote`. Fixed (a24a12c); the tool leaves a shorthand's key alone now; a scan of every
  `T.` / `tap.` / `neon.` / `dk.` name against its accessors found no other.
- **The local run (the mini PC, quiet — THE BUSY-PC CHECK 2.4 %):** unit 1143/1143 · rules 64/64 · rules-live 4/4 · /api 36/36 · the profile
  E2E 63/63 · conn 21/21 · presence 12/12 · smoke 6/6 · WebKit `wk-room.mjs` 6/6 · THE FULL HARBOR SUITE at 4 shards: run 1 1149/1159
  (the 4 sighting reds — the parked print ×2, the fast legendaries' photo, WebKit's tap on the UFO — = the slip above; of the other 6, 5
  green when re-run alone — the vault's + the 8-card lobbies' 4× CPU frame checks under the shard load ×3, the speaker delay, the radio desk —
  and roomperf's own cost, red before this pass too); the failed groups alone after the
  fix 111/111; **run 2 (the fix in): 1155/1159** — every sighting green; the 4 reds all green ALONE (crew + desktop 29/29, the vault
  111/111 above): the resize's re-fit hitch 767 ms (< 750) + the 8-legendary lobby at 4× CPU (timing under the shard load), CREW's switch
  OFF + PUSH's guest call (the crew group; a race under load). The cloud run confirms.

## Decisions (made unattended — the owner was asleep)
- **A failed Harbor load** (was: City 1.0): the import is tried once more after 1.5 s, then THE CITY COULDN'T LOAD + RELOAD (a plain card on
  the boot dark — `title.js#cityDown`; the `citydown` group). Seen only on a failure.
- **The menus' still with no title before it** (was: City 1.0 rendered once in a hidden canvas): the plain dark backdrop. Every menu is
  reached from the title, so it doesn't happen on a normal visit.
- **The tag:** `city-1.0-final` (see Group 1) — the old `city-1.0` left where it was.
- **`window.__district`** (the test hook) and the `nd-` class prefix keep their names (hundreds of test lines; no value in the churn).
- **The music decks:** City 1.0's own decks (`data/mood-music.json#moods`) stay as the fallback `songsFor` already used for a City 2.0 mood
  with no deck — every City 2.0 mood has one, so City 1.0-only songs are now unused files (dropping them = a deploy-size job: Known issues).
- **docs/title.md** keeps its City 1.0 sections as HISTORY under a header that says so (+ the moved paths fixed); a rewrite = SHELL 2.0's.

## Known issues / carried
- **YOUR PREVIOUS KEY (FR6 FIXES A, C2) shows nowhere:** its row lived in `profile.js#keyCard`, reachable only from the old reminder sheet
  (`promptKey`) — so it was already invisible in City 2.0. Deleted with it; the data (`profile/me.js#previousKey`) stays. → SHELL 2.0: the
  YOU page's ACCOUNT block.
- **scene.js's split** (above) — its own pass, with the perf A/B.
- **City 1.0-only music + the link preview:** the mp3s only City 1.0's decks named are now unused (deploy size); `assets/og.png` + the
  icons were rendered from City 1.0's scene (`brand.html`, deleted) — a Harbor link preview = a later look job.
- **H7's long tail:** ~70 more exports nothing imports (many are console / test hooks reached as `module.name` — a scan can't tell them
  apart); `daily/contract.js` is THE DAILY plug-in (ships OFF — kept).
- Carried from SPEED PASS B (not this pass — no visible change allowed): the after-match freeze (~0.9 s at 4×), the party room's top 3
  costs, roomperf's red.
