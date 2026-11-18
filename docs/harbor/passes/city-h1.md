# CITY H1 — THE FIXES + THE CITY (City 2.0 + the console) — Nov 18 2026, the mini PC

The squeal for real, MUSIC OFF = EFFECTS ONLY, LEAVE on the dock, the sign's leaves + the roof board's first face, CITY G's four cloud reds, the
small looks. CITY H2 (THE BOARD, THE YOU ROW, STATS, the games list, the flame) is next; CITY I after.

**Step 0** — read CLAUDE.md, decisions.md, city-g.md, the audio / title / harbor docs. THE LAB: `node scripts/lab-export.mjs https://www.neonspeakeasy.com`
→ 224 marks, **no open FIX**. THE SOLO-QUIT HOTFIX the prompt builds on was **not in the repo** (not on origin either) — its ☰ piece (a solo
game's single QUIT — BACK TO THE CITY) is built here, on THE LEAVE SHEET. The inbox: "Nov 18 — TO THE CITY — NEXT PASS — from JAYWALK THE POLISH
PASS" (1) + (2) built; "Nov 17 10:30 pm — TO THE CITY" (3) (THE BOARD's header) left for CITY H2. Own servers: fresh emulators +
`serve.mjs --emu` (:5173). THE BOOT at the start: **room 10,085 B + 3 modules**.

## Group 0 — CITY G's CLOUD REDS (89d1cc41)
| red | cause | fix |
| --- | --- | --- |
| `show` — THE MUSIC BUTTON surge | **the TEST** (stale): CITY G made the corner button THREE-WAY; "back ON" tapped once from MUSIC OFF = ALL SOUND OFF, so no music start, no surge (reproduced locally, the same 2 reds) | back ON = tap until the button reads `on` (MUSIC OFF → ALL OFF → ON); the cooldown step uses the music's own switch — the toggle it was written for. 39 / 39 |
| `perf` — MEMORY 20 cycles (heap +38.7 MB) | **not reproduced**: locally +3.3 MB (`perf` alone) and +3.4 MB (`matchreturn` → `perf`, the cloud's order); the cloud read +2.0 MB on CITY F, +38.7 on CITY G (Linux, no GPU) | the check now NAMES what grew when it's red (`kit.mjs#heapGrowth` — the top constructors between the two snapshots) — this push's cloud run answers it |
| `lobbyfix` — THE ROOM NOTE — IDLE | **the TEST** (a timing edge): `activeAt` 52:00 ago left exactly 8:00 — a phone whose server offset ran a few hundred ms behind ceil'd it to 9 MIN | 52.5 min ago → 7:30 left → 8 MIN on every phone |
| `audio` — THE ROOM IN THE URL | **the TEST** (a race): the room code came back before the city had mounted on the slow runner; the check read `__district` at once | wait for BOTH (the room + the city) |
| (+ the `tests` job on df294b6d — `e2e-presence` FATAL at the join) | a 15 s boot wait on the 2-core runner (the DAILY FIX push; acc77f7a's was green) | run again on this push's `[harbor]` — named, not changed |

## Group 1 — THE SQUEAL, FOR REAL + MUSIC OFF = EFFECTS ONLY
See docs/audio.md "CITY H1". **The real cause:** CITY G's hard cut only SCHEDULED the zero (`setValueAtTime(0, t)` on the timeline) — the
master's value (what the report reads, and what the hardware gets) moves only when the render thread runs a quantum; leaving an 'ambient'
session on iOS it didn't, so the master stayed 1.000 with live beds until iOS froze the app mid-buffer. **Fix:** the VALUE set at once
(`engine.js#silence(c, v)`); `tests/audio-session.test.mjs` "THE SQUEAL, FOR REAL" (a spec-accurate fake param — red on CITY G's engine, green
now). **MUSIC OFF = EFFECTS ONLY:** no beds, no city ambience (only tapped city sounds), THE DOZE (asleep 300 ms after the last effect, an effect
wakes it). Harbor `mediacut`: the real city 8 voices → 0, asleep in ~1 s; an effect wakes it in ~50 ms; asleep again; a leave while asleep finds
the master at 0.
**THE OWNER's PHONE TEST:** podcast on → the site → the music button ONCE (the note slashed) → play → leave the app: the podcast keeps going, no
squeal; the AUDIO LEAVE row reads "ctx asleep", or m 0.000 on the line right after the cut.

## Group 2 — THE SIGN + THE ROOF BOARD
- **THE LEAVES BEFORE THE LETTERS:** until the sign has lit fully once, the leaves' night layer × lit² (the sign leads); then the 0.72 floor.
  The same hold on every holiday dressing (`signdress.js`). docs/harbor.md "THANKSGIVING's SIGN".
- **THE BOARD OPENS ON THE NEWEST GAME:** the first frame the tri-vision is up it turns at once to the face switched on most recently
  (`newestFace`) — today JAYWALK — then the shared clock. docs/harbor.md "THE TRI-VISION".

## Group 3 — LEAVING
LEAVE on the dock's left ring + at the very top of ☰ (in a game too) → THE LEAVE SHEET (`ui/leave-sheet.js`); a solo game: ONE row, QUIT — BACK
TO THE CITY (the same sheet); INVITE at the top of GUESTS; the GUESTS tab glows while you're alone; ☰'s DAILIES row gone OUTSIDE a room (kept in
a room — the room's dock has no DAILIES). docs/title.md "CITY H1".

## Group 4 — THE SMALL LOOKS
The chat's quick replies squared (9 px) · the dock's labels: NEW GAME → GAMES, a gap check at 390 × 844 + 375 × 667 (harbor `newstart`) ·
REMATCH → RE / MATCH, bigger · the blade sign's letters crisp (the neon glow 2.2 → 0.45 × BLADE_GLOW, the bulb letters' halo tighter) · THE
RADIO's LOST TAP (`data-press` on the ledger's doors; its + the push paper's answers painted after the lift) · THE FADE NEVER SLICES A BOX
(`ui/final.js#unslice` + e2e-jaywalk's check).

## THE BOOT BUDGET
CITY H1's code cost ~7 KB of boot bytes (the doze, the board's pick, the leave wiring). Paid back without touching code: three long comment blocks
moved word for word into the docs (`harbor-promenade.js` 4.3 KB, `remote.js` 4.2 KB → docs/harbor.md "THE BOOT TRIM (CITY H1)"; `tapwatch.js`
3.6 KB → docs/title.md "THE TAP WATCH — the header"). JAYWALK's per-game budget (the city + the game) back under its 2,450 KB.

**Found in the final run (audio-leave):** while HIDDEN an asleep context still said 'running', so a timer-driven sound in the background could
have woken it — now it pretends only while on screen and is never woken off screen (`engine.js#sleepy` getter + `wake`). audio-leave's music-off
case moved to the new truth: no bed starts, a 3-s effect is sounding when the leave lands, back on screen it may already be asleep.

## FINAL
Fresh emulators + `serve.mjs --emu` (:5173) + a `DAILY_TEST=1` server (:5174). **Unit 2,241 / 2,241** · prism **67 / 67** · OVERCLOCK `e2e-oc-new`
**75 / 75** · HOLD'EM **22 / 22** · jaywalk **99 / 99** (+ THE FADE NEVER SLICES A BOX — its first shot still showed the plaque cut by the solid foot (the rule watched only the fade line; a sliding-in transform fooled the measure): now any box the foot cuts, at its laid-out place; e2e-rematch 25 / 25 again after it) · jaywalk-match `--four` **89 / 89** · e2e-rematch **25 / 25** ·
e2e-daily **122 / 122** · smoke **21 / 21** · e2e-presence **13 / 13** (the df294b6d cloud FATAL didn't reproduce) · e2e-friends **15 / 15** ·
the harbor groups `room, leaveroom, hostcard, newstart, trivision, trivision-rebuild, keypop, thanks, sheetstack, neon, mediacut, music, sounds,
dock, roomnote` **277 / 277** (+ `mediacut, music` again after the last engine fix 118 / 118; `perf` + `matchreturn` 17 / 17 earlier) · audio-hush
**9 / 9** · audio-leave **22 / 22** (19 / 22 first — the stale music-off case + the wake-while-hidden gap, both fixed). THE DOCK's LABELS: the
tightest gap 6.1 pt (GUESTS | GAMES) at 390 + 375 in every state. **THE BOOT BUDGET**: 307 / 310 modules, **room 14,882 B + 3 modules** (10,085 at
the start — NEON PAR's ~6 KB + 1 file fit); JAYWALK's per-game budget 2,449.4 of 2,450 KB (591 B left — not raised). No rules change. The FULL e2e-harbor runs in the cloud on
the tagged push. Shots: `Downloads/NEON/city-h1/` — `room/` (pass 1, 390), `room-pass/` (pass 2: the phones + 1440, night + day), `leaves/`
(the reveal's screencast, night + day, + the contact sheets), `jaywalk/` (the end screen).

## OPEN FOR BEN
- **Your phone test (the squeal):** a podcast on → the site → the music button ONCE (the note slashed) → play → leave the app: the podcast keeps
  going, no squeal; the AUDIO LEAVE row reads "ctx asleep" or m 0.000 right after the cut.
- **Named calls (yours to overrule):** with the music off the city's OWN ambience one-shots (gulls, gusts, traffic, its moments) are off too, not
  just the loops — they kept the context awake every second; a tapped city sound (the knock, a radio jack) still plays · ☰'s DAILIES row is gone
  outside a room but KEPT in a room — the room's dock has no DAILIES, so it's the only way in from a room.
- **Found, not fixed (pre-existing, HEAD's engine too):** the music started, then OFF → ALL OFF → ON inside about a second, did not come back
  within 15 s (harbor `neon` reproduced it; the test now uses the music's own switch). A next pass can look at the station's re-join after a hush.
- `perf`'s cloud MEMORY red never reproduced here — this push's cloud run names what grew if it's red again.
- RE-PUBLISH: nothing (no rules change).
