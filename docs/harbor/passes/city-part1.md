# CITY PART 1 — BUGS + MUST-HAVES (Nov 20–21, 2026)

**RE-PUBLISH: NOTHING NEW** — no rules change in this pass. (THE CONSOLE FIX's `Downloads\NEON\database.rules.nov20-console.json` is still
the owner's to publish before Nov 27; this pass builds on top of it and works on either.)

The pass in one line: ADD FRIEND works again (every message over the player page was frozen invisible), a slow first visit is no hang, the
site's sounds play with the music off, HIGH RISE is on the city's signs (THE SIGN HOLD lifted) and JAYWALK's day signs read as paint,
OVERCLOCK has ONE board, the pink flash is gone for every game, the boot has room again, and three small /admin rows are fixed.

## OPEN FOR BEN
1. **Press /admin → THE BOARDS → BACK-FILL once after the deploy** (PREVIEW, then BACK-FILL NOW): it seeds each player's new OVERCLOCK
   **BEST QUICK RUN** from their old QUICK · SOLO best (idempotent — a second press changes nothing; the preview line says how many). THE PROOF
   PASS's own back-fill (verified solo runs as counted plays) rides the same press, if not pressed yet.
2. **Phone checks** (after the deploy):
   - ADD FRIEND: https://neonspeakeasy.com/board → any player's card → ADD FRIEND → "Friend request sent" on top + REQUESTED; and from a
     daily's SCORES (DAILY → SCORES → a player).
   - Music OFF (♪ → MUSIC OFF): a HOLD'EM / OVERCLOCK / PRISM DROP match, a daily, the room's sounds, THE BOARD's tabs — the effects play.
   - The city by night + by day: HIGH / RISE on a roof (pink over cyan at night, raspberry + teal paint by day), the roof billboard opens on
     HIGH RISE · OPEN NOW, the speakeasy's blade says HIGH over RISE the week it is HIGH RISE's; JAYWALK's roof sign by day = cream on raspberry.
   - THE BOARD → OVERCLOCK: THIS WEEK / ALL TIME, no picker.
3. **Calls you can overrule** (THE CALLS MADE below) — the two most worth a look: THE DUMB LUCK CHECK (the board leaves DUMB LUCK's points out)
   and the speakeasy blade's HIGH RISE in ONE column (two columns read across as HR · II · GS · HE).
4. **A NEW CALL for you:** the roof billboard's HIGH RISE poster is the same picture by day — the one lit-looking thing in a sunlit skyline
   (THE DAY PAINT). A day variant of B1 (the games chat's build script) — or keep it? (Also: a HIGH RISE blade week shows three HIGH RISE signs
   on one screen — fine, or keep it off a roof that week?)
5. **Not checkable from this machine:** /admin's rows (the 2:40 pm LOST TAP / error on ADD FRIEND, the other 6 LOST TAPs for the radio pair) —
   no owner sign-in here; the fixes stand on the reproductions.

## GROUP 0
The lab export: 224 marks, no open FIX. THE CONSOLE FIX's cloud run: green.

## GROUP 1 — PRIORITY BUGS
**ADD FRIEND ON THE PLAYER PAGE DOES NOTHING** (cf3d2ee1) — TWO causes, both fixed:
- **THE COVER froze every message.** `css/vault.css` `body.vl-covered *:not(.vl-full …)` pauses every CSS animation behind a full card (SPEED
  PASS B) — THE MESSAGE's entrance too (`sh-msg-in … both` at frame 0 = opacity 0): every toast over the player page — success AND refusal —
  stood invisible. The pause now leaves `.sh-msgs` alone and any pop-up opened OVER the card (THE LAYER STACK marks it `data-over-cover` —
  `ui/layers.js`).
- **SCORES sent an empty target.** A SCORES row opens the page with `{ id, dg }`; the friend button kept only `{ b, bid }` → the server got
  nothing and refused. THE ONE TARGET RESOLVER: `api/_lib/player.js#pidOfQuery` — the page's own query resolves the same way for the page and
  for every friend action (`api/_lib/friends.js#friendDo`).
- Found by the E2E: the bar read the phone's CACHED friends list — a request that arrived since showed ADD FRIEND over an ACCEPT. The bar now
  starts from the server's own `rel` (the page's answer) and asks for a fresh list when they disagree. A slow /api: the tube is busy at once.
- **Tests:** `tests/integration/e2e-friend-page.mjs` — REAL touch taps; a room → ADD · CANCEL · MORE → Add · ACCEPT, THE BOARD row, the SCORES
  target on a 2.5 s /api (busy first), a 429 refusal — every message checked SEEN (opacity 1, its animation running, above every layer):
  **41 / 41; with the cover fix reverted 35 / 41** (all six messages invisible). `friends.test.mjs` + the resolver case. (WebKit: puppeteer has
  none here — the CSS pause is engine-independent.)

**A FIRST VISIT THAT NEVER LOADED (Android)** (f22e01e1) — the cause: on a slow first visit the watchdog's 12 s came while the page's files were
**still arriving**, and it RELOADED — beginning the ~2.8 MB again (the slow-line boot clock: **674 requests / 4.7 MB = two loads**; now 345 /
2.8 MB) — the "×2". And the city's network gates (the people's sprites, the roof poster, the fonts, the weather) counted their caps from the
SCENE's start, not the page's (live, 4G: the people + the poster held the reveal 1.3 s after the bake).
- **A SLOW LINE IS NO HANG** (index.html): at 12 s a load whose files still arrive (a file in the last 4 s, the city not started, < 45 s on
  screen) = the quiet `slow-boot` — no BOOT HANG row, no reload; a 4 s stall or 45 s acts as before.
- **THE PAGE'S CLOCK** (scene.js): the network's gates let go at 5 s of the PAGE on screen; a BAKED city reveals from 6.5 s. Live 4G before:
  6.9 s reveal (scene start ~3.6 s + bake 1.9 s + 1.3 s of network gates) → ≈ 5.5 s by the same numbers.
- **The row names every gate** — `Gates: bake 1501 · fonts 867 · … · board CLOSED · the scene 2300 ms on screen · wx asked: …` + `The line:
  n requests done · KB · the slowest <file> <ms> · this load is the watchdog's reload: yes/no`.
- The 8da9372 moment: a first visit (SW none) — no pinned chunk involved; a cold edge right after a deploy is a likely extra on that phone.
- THE BOOT BUDGET unchanged. `tests/boot-watchdog.test.mjs` pins the rule, the lines, the page's clock.

**SILENT WITH MUSIC OFF — THE SWEEP** (40b196bc) — 12 effect gates moved to `isUnlocked()` (running OR napping — a source's own start wakes the
nap, `engine.js#wakeFor`): HOLD'EM, the JAYWALK flyers ×2, OVERCLOCK ×3, PRISM DROP's effects, the dailies ×2, progress, the room, THE BOARD.
KEPT (music / clock): `prism/audio.js`'s synced-song voice line (named on its line), engine · music · beat · synced-songs · tape-stop · diag ·
pulse/clock. THE GUARD `tests/podcast-sweep.test.mjs`; the browser check `tests/integration/podcast-sweep.mjs`: **14 / 14 (7 of 11 silent
before)**.

## GROUP 2 — HIGH RISE IN THE CITY + THE DAY PAINT (7cf97863)
- **THE TRI-VISION:** HIGH RISE's OPEN NOW face — the B1 poster (`assets/city/highrise/billboard.webp`, 848 × 448, 35 KB) drawn WHOLE by the
  lazy `screens/harbor/highrise-art.js` (never the boot graph; a face only once decoded). Lit by HIGH RISE's own GAMES row (`playable` + its
  `live` day — `core/harbor-trivision.js#highriseShow`), judged on the streak day. The rotation **HIGH RISE → JAYWALK → HOLD'EM**; the board
  OPENS on HIGH RISE (its go-live = the newest switch date); **THE DROP's face removed** (its feed pieces kept).
- **THE ROOF TUBE SIGN:** HIGH / RISE stacked (`SIGN_SPLIT`), HIGH #ff4fd8 + RISE #35e3ff at night (`signs.js#SIGN_ACC2` — a two-tone name);
  by day enamel paint, HIGH raspberry + RISE teal on cream with a dark keyline (`DAY_PAINT.highrise` + `ink2`).
- **THE BLADES:** the SPEAKEASY blade = **ONE column, HIGH over RISE with a gap** (`speakeasy-blade.js#BLADE_COLUMN`) — the first shot showed
  two side-by-side columns reading across as HR · II · GS · HE (the refine pass). The HOTEL blade stays PRISM / HOLDEM (8 letters can't).
- **Five games on four signs:** roof A · roof B · the hotel blade · the speakeasy blade = four DIFFERENT games a night, the fifth rests (on the
  tri-vision); every one up each week (tests).
- **JAYWALK's DAY ENAMEL:** cream on sun-faded raspberry, gold leaf (was pink-white + a hot-pink keyline on near-black — lit-looking). The
  speakeasy blade's neon kind by day = pale unlit glass. **THE DAY PAINT GUARD** `tests/city-part1-signs.test.mjs` (catches the old face).
- **SIGN_HOLD = []** in the same commit; the pinned tests flipped; **THE GOLDEN TABLE rewritten ON PURPOSE** — only `workers.day`: from HIGH
  RISE's go-live the board always turns, so THE BILLPOSTER stays home (the established rule; live, JAYWALK's switch already kept him home).
- **Shots** (`tests/integration/shots-cp1/`, not in git): `hrnight-390x844-skyline.png` · `hrday-390x844-skyline.png` (HIGH / RISE + JAY /
  WALK + the PRISM blade + the B1 face, Nov 23) · `jw-day-before-after.png` · `blade-hr-night-day.png` · `blade-hr-day.png` · `adnight-375x667`
  · `adday-1440x900` · `sizes-375-1440.png`. Two refine passes: (1) the blade's columns → one column; (2) 375 + 1440 checked — nothing clipped.

## GROUP 3 — THE BOARD + THE END-SCREEN FLASH
**OVERCLOCK = ONE BOARD** (21686d2d + the server test) — `overclock-quick` **BEST QUICK RUN** (short BEST SCORE): a QUICK run of all six, SOLO
OR IN A ROOM (the board's `both` — the solo lane keeps the id), the plausibility bound, a 0 never a record; its tab = that one board (no picker).
**THE DUMB LUCK CHECK:** a 12-1 long shot pays `luck.js#DL_MAX` = **260**; a skill challenge's ceiling is **160** (DUMB LUCK is never the ×2
final) → the BOARD score leaves DUMB LUCK out (`match-report.js#ocBoardScore`); the match's total + podium unchanged. STANDARD + MARATHON:
XP, no board. The three old boards RETIRED (`core/boards.js#RETIRED_BOARDS` — no definition: never written, never shown; rows kept). THE SEED
= `core/board-fill.js#seedOcQuick` in /admin's BACK-FILL. Tests: `city-part1-overclock.test.mjs` + `server.test.mjs` "OVERCLOCK = ONE BOARD".

**THE PINK FLASH** (0b236f3c, item 1 only — item 2 the coloured neon is PART 2's): the console's crown wash (`.final.crowned::before` — the
game's accent at 55 % over the whole screen, 2.5 s after the end frame stood) **removed for every game** at the shared console. THE GUARD every
game runs: `tests/integration/end-flash.mjs` — every PLAYABLE game by its GAMES row (a new game joins by its row), the REAL console end frame
with the game's cartridge, SOLO + MATCH, BOTH LOOKS, every presented frame through the crown (`kit/flash-watch.mjs`'s new COLOUR-FREE diff
mode — a wash of any colour); **the old wash injected is caught (76–82 % of the screen); every game now ≤ 6 %** — 24 / 24. The real paths:
`e2e-rematch` (the crown + REMATCH → the next start) and `e2e-highrise` (solo end + PLAY AGAIN).

## GROUP 4 — THE BOOT's ROOM (ceacafe8)
**THE ONE META MODULE:** `js/games/metas.js` = every playable game's boot meta as ONE row; a game's `meta.js` = a one-line re-export of its row
(the cartridge, core + the server import it as before — the same names + values, checked against the old files). A NEW GAME = A ROW + its
one-line meta.js, never a boot module (docs/cartridge.md "THE ONE META MODULE").

| the boot | before (37be19fb) | after (this pass, all groups in) |
| --- | --- | --- |
| modules | 308 / 310 | **304 / 310** (6 free) |
| module bytes | 6,645,368 / 6,656,000 | 6,654,396 / 6,656,000 (this pass's own growth in — the signs, the gates, the wake hold) |
| js/games at boot | 29.5 / 30 KB | **25.0 / 30 KB** |
No budget raised. The pass's own boot comments were trimmed to stay under the line (their text lives here + in docs/harbor.md).

## GROUP 5 — THE SMALL FIXES
- **A STALLED CHROMEBOOK KEEPS WRITING AS HOST** (f4efc4c2): after a long stall the phone's MIRROR is as old as the stall (the socket froze
  too) — it still said "you are the host". **THE WAKE HOLD** (host.js): a tick gap ≥ 5 s (or a 5 s hide) holds every host write until a FRESH
  read of `meta/hostId` + this phone's seat confirms it, else it follows; the hold ends early once the mirror moves. **`hostWriteOk` = the ONE
  gate** for every host write. The ROOM STAMP blames the rules only for a confirmed host IN the room, else the quiet `not-host`; a room / chat
  refusal within 30 s of a wake = `not-host` (a chat after leaving was already `gone`). Built WITH THE RUN HOLD. `e2e-stall-host.mjs` (the host
  paused + offline 16 s, another phone claims, she wakes) 8 / 8 — **named: the old code passed this reproduction too** (the SDK re-synced the
  mirror before its next write); the hold covers the stale-mirror case the Chromebook hit.
- **THE LATE REMATCH VOTE, AGAIN** (88dc0168): `ui/final.js#writeVote` (+ the room ring's vote) — a vote landing after the room left `final` is
  an EXPECTED refusal → the quiet `late-vote`; e2e-rematch: a vote held back past the next start → 0 alarm rows, 1 quiet count.
- **THE RADIO BUTTON UNDER ☰** (86612c20): the two 44 × 44 areas met edge to edge (50 / 50) → the radio 8 pt lower; the guard in the harbor
  `tapfit` group (the title + the room's dock, 390 / 375 / 1440; the old position fails: SHARED rd-btn ↔ menu-btn).
- /admin's quiet line now shows `slow-boot` · `late-vote` · `not-host` · `late-proof` (the last was counted but never shown).

## THE CALLS MADE (obvious / established — overrule any)
- THE DUMB LUCK CHECK → the BOARD score leaves DUMB LUCK out (260 > 160).
- OVERCLOCK's old boards retired by removing their definitions (rows kept); THE SEED rides the existing BACK-FILL (an owner press, like THE
  PROOF PASS's).
- The speakeasy blade's HIGH RISE = ONE column with a gap.
- HIGH RISE's day enamel = raspberry + teal paint on cream (its night pink + cyan as paint).
- The board opens on HIGH RISE (its go-live = the newest switch date); THE DROP's face out of the rotation.
- The watchdog's slow line: a file in the last 4 s = still arriving; 45 s on screen = acts anyway.
- The page's clock: the network gates at 5 s, a baked city at 6.5 s.
- A refusal from a phone not confirmed as the host IN the room = the quiet `not-host` — a SEATED guest's own-node refusal still rings the
  re-publish alarm (THE RULES-LAG stands).

## THE FINAL RUN (this pass's own emulators + `serve.mjs --emu`, one suite at a time; the rules + /api on FRESH emulators after the browsers)
| check | result |
| --- | --- |
| unit (`node --test tests/*.test.mjs`) | **2428 / 2428** |
| rules (`rules.test.mjs`) · `/api` (`server.test.mjs` — + OVERCLOCK = ONE BOARD) · friends · dailies module · progression · HOLD'EM server | **98 / 98 · 72 / 72 · 11 / 11 · 24 / 24 · 10 / 10 · 21 / 21** |
| smoke | **24 / 24** |
| e2e-profiles (moved to OVERCLOCK's ONE board) | **148 / 148** |
| e2e-friend-page (after the review's fixes) | **41 / 41** |
| OVERCLOCK: e2e-oc-luck · e2e-oc-2 (N=4) | **22 / 22 · 27 / 27** |
| JAYWALK `e2e-jaywalk` (FAST) · HIGH RISE `e2e-highrise --fast` | **99 / 99 · 70 / 70** |
| audio-leave · audio-hush · podcast-sweep | **28 / 28 · 9 / 9 · 14 / 14** |
| end-flash (every game) · e2e-stall-host · e2e-rematch (4 games: the crown watch, REMATCH → next, the late vote) | **24 / 24 · 8 / 8 · 34 / 34** |
| the harbor groups this pass touches (`core, neon, load, tapfit, room, gamestart`) | **153 / 153** |
| THE BOOT CLOCK (boot-time.mjs, cold, 390 × 844, cpu 2×): local 4G 7.0 s (HTTP/1.1: 6 connections — the module graph's arrival dominates); local slow line 17.3 s, ONE load (was two: 674 req) · live 4G (old code, HTTP/2) 6.9 s |
- The full harbor suite: the cloud's, on this harbor-tagged push (THE LOCAL TESTING RULE).
- Found by the final run + fixed: e2e-profiles leaned on the old STANDARD record's plaque + the QUICK · SOLO board (now the ONE board); my own
  friends.test expected the pid back for a SCORES target (the review's privacy fix removed it).
- Every server this pass started was stopped at the end, by exact PID.

## THE FRESH-EYES REVIEW (a separate agent that wrote none of it — read the code + the shots; 29b419f0 fixed what it found)
1. **HIGH — the page's clock never stopped:** `__boot.onScreen` kept counting after the first reveal, so every LATER scene (back from a match,
   /board, a menu) let every network gate go at once and revealed as "late" on its first bake — skipping the people's first plan, the roof
   poster's pick, the weather re-bake (THE PEOPLE RULE + ONE FACE FROM THE FIRST FRAME broken on every return). **FIXED:** `onScreen` = NaN once
   revealed — a later scene keeps its own clock.
2. **MEDIUM-HIGH — the slow-line hold ended with an instant false alarm:** a city that started after 12 s got a BOOT HANG + the forced reveal
   (or the reload) on the next tick. **FIXED:** a started city gets its own 8 s (`CITY_OWN_MS`, still under HARD_MS); progress counts only the
   boot's own same-origin js / css (an idle poll never keeps a hung boot "arriving").
3. **MEDIUM — a page-late reveal could show a stale bake.** **FIXED:** only a CURRENT bake (the camera's, nothing pending).
4. **LOW-MEDIUM / LOW — the friend bar's server rel was thrown away by a FAILED list load (the stale label back), and MORE's actions never
   cleared it.** **FIXED:** the hint goes only once a list NEWER than the page's answer is in (`friends.js#friendsAt`).
5. **LOW — privacy widened:** a SCORES / board / link target got the pid back in `friendDo`'s answer. **FIXED:** only a pid target gets it.
6. **LOW — the 4 am line broke a SCORES target** (a page opened before it, tapped after). **FIXED:** yesterday's list too.
7. **LOW — the wake hold's fresh read had no timeout** (a `get()` that never settles = a hold forever). **FIXED:** 5 s, then asked again.
8. **LOW — `data-over-cover` marks were never removed.** **FIXED:** they go with the cover.
- Named, not changed: HIGH RISE shares the tri-vision's retry / backoff with JAYWALK (harmless today); a HIGH RISE blade week shows three HIGH
  RISE signs on one screen (board, roof, blade); **the B1 poster is the same picture by day — the one lit-looking thing in a sunlit skyline
  (THE DAY PAINT) → OPEN FOR BEN** (a day variant of the games chat's build, or keep it).
- What held (its list): `pidOfQuery` can't befriend the wrong player (the board id is an HMAC of the pid, the same on every board); THE ONE META
  MODULE's names + values match the old metas, nothing uses `this`, THE STALE-MODULE RULE holds; the HIGH RISE art stays out of the boot, the
  reveal's board gate lets go on a failure or at REVEAL_MAX − 0.5 s; the watchdog is bounded by HARD_MS; a false wake check + a later claim
  clears; the shots: every word reads at 390 / 375, the day signs read as paint, the night two-tone reads.
