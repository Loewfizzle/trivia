# FIXES R2 — THE SQUEAL (found), the background kills, the ticket pop-up, the room's BOARD, the owner's look notes, READY FOR JAYWALK (Nov 15 2026, the mini PC)

**No rules change.** 8 functions (nothing new under `api/` — the dailies' `ended` action rides `api/daily.js`). The lab export at the start: 222 marks, no
open FIX. Step 0 → `decisions.md` "FIXES R2 (the owner, Nov 15 — DECIDED)" + `plan.md` "OWNER'S NOTES — NOV 15 (FIXES R2's Step 0)".

## Group 0 — THE SQUEAL IS THE CUT (the owner's clue: switching SOUND EFFECTS off squeals by itself)
- **Recorded** (`tests/integration/audio-cut.mjs` — a ScriptProcessor on the MASTER + one on the SFX BUS, every rendered sample, the city's effects
  playing). The old engine: the effects toggle with the music off (= THE HUSH, and MUTE) asked the context to SUSPEND 60 ms into the master's 90-ms
  ramp — the output at −25 dBFS in the 100 ms before the suspend (one run: −51 dBFS in the last 20 ms rendered — what a phone's output keeps
  playing); with the music on the effects bus never reached 0 (setTargetAtTime: −66 dBFS a quarter-second later) and the loops were dropped
  mid-sound; on leaving, a bed was cut at full level.
- **THE CUT IN ONE ORDER** (`engine.js`): a linear ramp that arrives (effects bus `CUT_S` 80 ms · the hush 90 ms · the leave `LEAVE_S` 25 ms) → a
  loop stopped only once silent (`sfxSilent()` gates city-sound's drop; the beds after the leave's ramp) → **THE ZEROS FIRST** (the output exactly
  0 for 100 ms) → the suspend. **THE PHONE'S ROW** — kind `audio`, AUDIO CUT in /admin (the owner's phone or `&debug=1`; a leave's row waits for
  the return).
- **Proof:** audio-cut 33 / 33 (6 red on the old engine), audio-leave 22 / 22, audio-standalone 8 / 8. **Not provable off a real iPhone:** Core
  Audio's own output buffer — the owner's ear + the AUDIO CUT row.

## The owner's add-ons (the inbox, built as they arrived)
- **7:36 pm — A SCORES ROW OPENS THE PLAYER:** every SCORES slim card → THE BOARD's player page (an EVERYONE · TODAY row found server-side in the
  day's top — `api/_lib/player.js#pidOfDaily`); THE REVIEW A8 with it — a touch that only stops a flung list never acts (`tapwatch.js`
  `SCROLL_STOP_MS` + a finger drag within 3 s). wk-press + server.test.
- **7:40 pm — THE FOUNDER WINDOW only at the foot of /admin:** the radio ledger's paper + CSS + read removed; the server's switch + audit unchanged.
- **8:13 pm — THE PLAYER PAGE for a player with little to show:** a balanced column from the top, the RAREST block always there (NO ACHIEVEMENTS YET),
  CLOSE a neon tube (never gold), the gilded card for no card. Shots bare + full at 390.

## Group 1 — STAYING ALIVE IN THE BACKGROUND + the heads-up ✕
- **AWAY, LIGHT** (`scene.js#awayFree` / `awayBack`): at the hide (synchronously) the last frame kept as one half-resolution picture, both bakers
  (`bake.js#free`), the merged bands, the main canvas + the sky zeroed; back: the picture HELD, THE ONE RE-FIT PATH re-bakes, ONE cut. THE CANARY (a
  tracked 1×1 pixel) still catches iOS discarding canvases while away (FR7 FIXES A). `city-away.mjs` at 390 @3: **73 → 29.7 MB hidden (41 %)**,
  back in **491 ms**, 0 bare frames, every bake at its size; harbor `cameras` 13 / 13.
- **The heads-up ✕** (`toast.js`): `data-press` — wk-press (iOS's click dropped → it closes).

## Group 2 — TAP A TICKET (TODAY only)
- A finished ticket → its END SCREEN in a sheet (`js/daily/end-sheet.js`): THE PASSWORD (the doors' marks + words) + COAST CLEAR (the final harbor +
  every light + the phone's buoys) through the live end screen's OWN builders (`end-card.js` in each — the views use them too), THE DROP its share
  picture (final board + time / lines) as a still. **The server:** `api/daily.js` `ended` — only the caller's own run, only once finished (409
  `not_finished`, never a start, nothing written); THE DROP's `endView` = the share's replay (junk solid), never its log or seed. /api: password +
  coastclear + daily-drop 'TAP A TICKET'; `daily-tickets.mjs` 5 / 5 + three shots at 390.

## Group 3 — THE ROOM
- **BOARD in the room's dock** (5th tab, lit gold): the icons + labels unchanged, every tab 44 × 58 (48 from 420 pt), the pill + ring gaps tighter
  (the group was 394 pt at 390 — the rings clipped; now on screen); BOARD → THE BOARD's own screen while the room waits (`app.js` routes view
  'board'), its BACK → the room. **PICK A GAME** = the neon marks (`ui/mark-svg.js` — the PLAY sheet's ONE builder). `room-board.mjs` 21 / 21.

## Group 4 — THE OWNER'S LOOK NOTES
- **PRISM / DROP** stacked on the roof signs (`harbor-neon.js#SIGN_STACK`); the vertical blades keep PRISM. Shots: night Nov 30, day Dec 2.
- **THE SOURCE:** measured — the name plate covers x ≤ 0.74, y 0.31–0.59 — the prompt now sits centred over NEON in the band under the plate; NEON
  in the right half, clear of the bottom rows; 1 OF 1 as it was; `LAB_V` 7, the stills rebuilt. **CANDLELIGHT:** candle-gold letters + a steady
  amber halo (`LAB_V` 2). **STATS** opens on TODAY. **THE YOU SCREEN** reveals once (opacity) when painted: CLS on screen **0.46 → 0**
  (`you-open.mjs`).

## Group 5 — READY FOR JAYWALK
- **B2:** T5 (`cartridge.js` split → `contract.js`; boot `js/games` 35.0 → 26.2 KB, the cap lowered 36 → 30) · T1 (`tests/registration.test.mjs`)
  · T2 (the console's hooks in OPTIONAL; THE GAME FRAME + THE 3 S RULE in docs/cartridge.md) · T3 (`host.js` checks the start's frame before any
  write; localhost `loadGame` runs the checker).
- **B1 (b):** `config.js#FROZEN_IDS`; `loadGame` refuses a frozen id (`&frozen=1` on the emulators); the four exemption lists + the harbor
  `cartridge` group read it; the frozen views marked NOT MAINTAINED; 7 E2Es + 6 previews + 3 probes parked (`tests/integration/parked/`); the room's
  side nodes cleared in one round trip; the `sign` flag gone. **Left for later:** the `/api` suite off the CIPHER fixture (~a day).
- **B3:** F4 (`radioCrew` in EMPTY_ROOM + every listener key reset — a test) · F5 (the live presence line's comment + the equivalence test) · F6
  (`state.busy`, `soloPauseNow` / `soloResumeNow`, `KIT_PREFIX`, `getDb` + its stub, the `?city=2` pass-through).
- **THE CAMERAS FLAKE** (`no-observer-pre`, "fit … 85 ms after the reveal"): the reveal gate's `boxCheck` answers "fine" while a re-fit is
  already queued (`resizeT` / `wantBuild`) — under load the reveal went out on the OLD build and the re-fit landed frames later. The reveal now waits
  for a queued re-fit in the dark (`scene.js` — 'a re-fit on its way'). See the final run below.
- **Part C:** CLAUDE.md corrected (the sign flag, three dailies, the title row, the anchors → quoted headings, + THE FIREWORKS, the tri-vision's
  three faces, the tap rules merged on `PRESS_IMPLICIT`, two named exceptions, the harbor suite line, the service worker, `hostBy?`, the node list →
  `api/_lib/backup.js`, the env vars, `--sizes pass`, THE PASS LOGS, `config.js#NAME_MAX`); PRISM's skins, the share cards, the audio leave, the tap
  rules, the Firebase setup (docs/profiles.md "Setup (production)"), adding a game moved to their docs (each doc's "THE RULES FROM CLAUDE.md (moved
  Nov 15)"); 37.0 → 34.9 KB; `claude-md-coverage.mjs` 0 missing.

## The final local run (my own emulators + `DAILY_TEST=1 serve.mjs --emu`, restarted after the `/api` suites; nothing else busy)
| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` | **2020 / 2020** |
| `/api` | `server.test` **62 / 62** · `password` 11 · `coastclear` 17 · `daily-drop` 15 · `daily-module` 22 · `share-card` 1 · `backup` 2 — all green (rules untouched — not run) |
| smoke `e2e-smoke.mjs` | **18 / 18** (THE PAGES LOAD + the three games) |
| `e2e-daily.mjs` | **95 / 95** (its "no tap through" sweep now counts the new `[role=button]` controls) |
| the games, FAST | `e2e-prism` **67 / 67** · `e2e-oc-new` **75 / 75** · `e2e-holdem` **22 / 22** |
| `wk-press.mjs` (WebKit) | **43 / 43** |
| audio | `audio-cut` **33 / 33** · `audio-leave` **22 / 22** · `audio-standalone` 8 / 8 (unit) |
| the pass's new scripts | `city-away` 6 / 6 (×2) · `room-board` 21 / 21 · `daily-tickets` 5 / 5 · `you-open` 4 / 4 · `plate-hug` 24 / 24 |
| harbor (`ONLY=load,core,skyline,neon,trivision,longnight,room,cartridge,gamestart,radio,youpage,tapfit,vault,playercard,platefit,cardfit,stripfit`) | **304 / 311** → THE LAB's two counts fixed (my two Lab bumps: 38 / 37 NEED YOU) · the other **5 = frame-rate checks in `vault`** (A FULL LOBBY at 4× CPU) — **R1's commit fails the same five on this machine tonight** (run against it on :5174) = the machine's state, not this pass |
| `cameras` | **13 / 13 ×3** (one quarantined retry on `hours-dusk` in the run with extra load — named) |
| THE STRIP MATCH (`--still`, 402) | 13 over 9 — **pre-existing** (R1's commit: 14; THE SOURCE's rebuilt still dropped off) |
| `build-file-hashes` · `build-boot-preload` · `build-preload-graph` · `build-card-stills --check` · `claude-md-coverage` | current · current · current · current · 0 missing |

Servers: my own emulators + `serve.mjs --emu` (+ two short-lived :5174 servers for the R1 comparisons, their worktree removed) — all stopped at
the end; Ben's `:5190` kept.

## Known issues / left for the next pass
- The `vault` group's 5 frame-rate checks red on this machine tonight (R1's code too) — re-check on a cool machine / the cloud.
- THE STRIP MATCH's 13 pre-existing overs (aurora, marquee, frostbite, the BTC sighting, neonglass, century, noir, smoke, inferno, the switchboard,
  neoncamo, glitter, marquee-gold).
- The cameras group's `hours-*` family (an item's copy after the +10 h return) under load — quarantined, named.
- THE NAME PLATE: no empty tail reproduced here (Chromium + WebKit) — if the owner still sees one, a screenshot + the device.
- B1's `/api` suite off the CIPHER fixture (~a day); THE REVIEW's BEFORE LAUNCH list (A6, A8's iPhone check, A9, A11, A17, A4 step 3, T4 / T6 /
  T7, F1 / F2 / F3 / F7).
- Off-device only: the squeal's fix is proven on the graph (the recorded output) — the owner's ear + the AUDIO CUT row in /admin are the check.
