# FIXES R3 — THE SQUEAL ON LEAVING (the owner's phone as the bench), R2's canvas error, THE STEPPED NAME PLATE, THE PASSWORD's share score, THE PLAYER PAGE's action bar, PICK A GAME's clean marks (Nov 16 2026, the mini PC)

**No rules change.** 8 functions (nothing new under `api/`; `api/_lib/log-pure.js` gains the report kind `leave`). The lab export at the start: 222
marks, no open FIX. Step 0 → `decisions.md` "FIXES R3 (the owner, Nov 15 — DECIDED)". CLAUDE.md: NEVER STOP TO ASK (the inbox's 11:30 pm version).

## Group 0 — R2's cloud + the vault re-run
- **R2's cloud (62212dd8): both runs red, one job each, both R2's own removals with old tests:** `tests` → `progression.test.mjs` "THE FOUNDER
  WINDOW" read the radio ledger's `founder` (R2 took it off the ledger on purpose) → reads `founderState` (the foot of /admin) + checks the ledger
  has none (10 / 10). `harbor` → the `dock` group's two "THE FLAG IN THE URL" checks of the `?city=2` pass-through (R2's F6) → updated per the
  owner: the room in the address + a refresh in the lobby still rejoins (dock 7 / 7; no pass-through restored).
- **The vault group's 5 frame-rate checks** (red on this machine on Nov 15, R1's code too): **58 / 58 alone on the restarted machine** (55–60 fps).
- **Lesson:** when a pass removes a feature, grep the harbor + E2E + /api suites for its old checks before the push (docs/testing.md).

## The 11:19 pm add-on (PRIORITY) — THE AWAY RACE
- "harbor frame: InvalidStateError: The object is in an invalid state." @ scene.js:2019 = `drawImage(skyCv)` of the SKY that R2's AWAY, LIGHT
  zeroes while hidden. **Cause:** iOS makes the page visible and runs a timer / a focus (the 1 s watchdog → `wakeLoop` → a frame) BEFORE it
  dispatches `visibilitychange` — the only signal that called `awayBack`. **Fix:** any frame that finds the page back with the away state set
  runs the return itself (the picture held, the re-build in that frame); a freed (0 × 0) sky is never drawn (a re-build asked instead).
- `tests/integration/city-away-race.mjs` (WebKit, 390 @3): **14 failed frames on R2's code, the owner's exact message → 0 (11 / 11)**; the
  returns' canvas peak +19 % (the held half-size picture — never two cities). The 11:14 pm PAGE KILLED's screen + seconds never reached this
  pass — the return's memory is guarded by the same test.

## Group 1 — THE SQUEAL ON LEAVING THE HOME-SCREEN APP (docs/audio.md "FIXES R3")
- **What actually runs** with the music OFF + effects ON at an idle city moment (`audio-modes.mjs`, the real graph): the context nonstop; **a
  station song (`synced-songs.js`, a 257-s buffer) playing on through the 0 music bus**; **six or seven city ambience LOOPS** (water, the night
  hum, the club, the TV, two winds, the boat) — none a BED (`beds 0`), so R2's beds-after-the-ramp never stopped them; a city one-shot ~every
  0.7 s. No media element plays. Nothing is ever silent between effects — every leave freezes a sounding graph: the prime suspect. And R2 wrote
  a leave's AUDIO CUT row ~125 ms after the leave, in a timer — the missing row.
- **(1) THE LEAVE RECORD:** every leave signal written to localStorage in its own handler with what was sounding → ONE **AUDIO LEAVE** row
  (kind `leave`) at the return, or at the next load ("NEVER CAME BACK"); a blur that stays on screen is no leave.
- **(2) THE LEAVE MODES** (☰ → **LEAVE MODE**, admins, this phone): **A IDLE SILENCE (the default)** — the music off rests the elements, the
  station song and the city's loops; the context sleeps after 1.5 s unheard and the next source made on it wakes it · **B CLOSE AT ONCE** — the
  first leave signal closes the context, a fresh one on the return · **C1 / C2** — the session 'ambient' / 'playback' from the boot + R2's cut.
  MUTED = NOTHING RUNS in all four.
- **Proof:** `tests/audio-leave-mode.test.mjs` 14 / 14 · `audio-modes.mjs` 36 / 36 · `audio-cut` 33 / 33 · `audio-leave` 22 / 22 ·
  `audio-hush` 9 / 9. **Only his iPhone proves** which mode is silent. engine.js's ~10 KB history header moved verbatim to docs/audio.md and the
  row's text builder loads only to send — THE BOOT BUDGET held at 6500 KB, not raised.

## Group 2 — THE PASSWORD's share score
- Each DAILIES row declares its `measure` ('guesses' | 'time'); THE PASSWORD's big line = its GUESSES ("8 GUESSES", `paintBig` fitted), its
  time the grey stat line; COAST CLEAR + THE DROP unchanged. share-rhythm 13 / 13, share-same 60 / 60 (`_old/pw-share.js` re-taken ON PURPOSE).
  Shots `Downloads/NEON/fixes-r3/share-today-{night,day}-390x844.png`.

## Group 3 — THE PLAYER PAGE's ACTION BAR (+ the 12:19 am add-on)
- ONE compact bar at the bottom in a quiet framed strip: **[ ADD FRIEND ] [ MORE ] [ CLOSE ]** — 44 px, squared corners, the main tube wider
  (1.75 of the bar — the add-on: "+" read too small → the full words, one line at 390, the same 11 px). It follows the relation (REQUESTED ·
  ACCEPT · FRIENDS · INVITE in a room); MORE = the ⋯ menu; loading / limited = CLOSE alone; nothing over the card. Shots `pp-*` (a stranger, a
  friend, a pending request, in a room; 390 / 402 / 430; limited).

## Group 4 — PICK A GAME's marks
- **The cause:** R2's svg wore `rc-mark` — THE BOARD's plaque class (its background = a gold compass ring + 4-point star). Now the PLAY row's own
  markup + ONE size rule in `css/title.css` (44 px slot, 40 px mark, its colour glow), nothing behind it. room-board 21 / 21; shots
  `pick-a-game-390.png` beside `play-sheet/night-390x844-idle.png`.

## The 11:16 pm add-on — THE STEPPED NAME PLATE
- `vault/strip.js#layStep` (the ONE place, full + slim, every material): the top step behind the emblem + NAME, the bottom step one padding
  after the LV line, an inner radius + the plate's own edge line along the step; plain when the LV line is as wide (never the reverse step).
  plate-hug 64 / 64; the stills current. Shot `plate-rylen-390x844.png` (HALL OF FAME 1 OF 1, GILDED, VELVET ROOM — full + slim).

## The final local run (my own emulators + `DAILY_TEST=1 serve.mjs --emu`, the emulators restarted after the `/api` suites; nothing else busy)
| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` | **2037 / 2037** |
| `/api` | `server.test` **62 / 62** · `progression.test` **10 / 10** (rules untouched — not run) |
| smoke `e2e-smoke.mjs` | **18 / 18** |
| `e2e-daily.mjs` | **95 / 95** |
| `wk-press.mjs` (WebKit) | **43 / 43** |
| audio | `audio-cut` **33 / 33** · `audio-leave` **22 / 22** · `audio-hush` **9 / 9** · `audio-modes` **36 / 36** · unit `audio-*` **27 / 27** |
| the pass's scripts | `city-away-race` **11 / 11** · `city-away` 6 / 6 · `plate-hug` **64 / 64** · `room-board` 21 / 21 · share-same 60 / 60 |
| harbor (`ONLY=load,core,longnight,cameras,dock,music,harbor,room,radio,youpage,tapfit,playercard,platefit,cardfit,stripfit,vault`) | **348 / 352** → fixed + re-run: NEVER SAVED (the leave record listed the city's loop slots — now only a reporting phone records) + `music`'s direct-path OFF check (mode A releases the element) → `core,music` **128 / 128**; the 3 `vault` frame-rate checks (run after 15 groups) → `vault` alone **58 / 58**. One quarantined retry on `cameras`' `no-observer-pre` (passed on the retry — the known flake) |
| `build-file-hashes` · `build-boot-preload` · `build-preload-graph` · `build-card-stills --check` · `claude-md-coverage` | current · current · current · current · 0 missing (CLAUDE.md 35.5 KB) |

Servers: my own emulators + `serve.mjs --emu` — stopped at the end. Ben's `:5190` was not running (the restart) and was not started.

## Known issues / left for the next pass
- THE LEAVE MODES: the winner (the owner's ear + the AUDIO LEAVE rows) becomes the only path in the next pass. Mode A with the music off also
  quiets the city's ambience beds + the station song (the owner's spec: "no loops / beds"); the radio's NOW PLAYING shows nothing then.
- The player page's bar sits right under the blocks (sticky at the bottom on a long page) — not pinned to the screen's bottom edge on a short
  page (no empty band between the blocks and the bar).
- `audio-resume.mjs` is a City 1.0 test (red since City 1.0 went) — retire or rewrite it.
- THE STRIP MATCH's pre-existing overs (R2's list).
