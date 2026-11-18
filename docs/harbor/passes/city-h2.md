# CITY H2 — THE LISTS (THE BOARD, THE YOU ROW, STATS, the games list, the streak flame) — Nov 18 2026, the mini PC

After CITY H1; CITY I (HOW TO PLAY out of the boot, the CLAUDE.md trim, the second-account flags, the Chromebook's double close) is next.

**Step 0** — read CLAUDE.md, city-h1.md, docs/title.md (THE SHELL, THE NEON TABS), docs/vault.md (slim cards), docs/progression.md,
docs/profiles.md. THE LAB: `node scripts/lab-export.mjs https://www.neonspeakeasy.com` → 224 marks, **no open FIX**. The owner's picks copied to
`Downloads/NEON/city-h2/refs/` (board-layouts B · streak-flame-options A · you-row-options B · jaywalk-sneaker-mark). THE INBOX: three entries
to CITY H2 arrived before the pass started (3:52 · 4:00 · 4:03 pm — built FIRST, Group 0), the GO-LIVE reviewer's item (3) (THE BOARD's header
picture — Group 1), one more during the pass (4:48 pm — JAYWALK's sneaker, built as the LAST group before the final tests). Own servers: fresh
emulators + `serve.mjs --emu` (:5173) + a `DAILY_TEST=1` server (:5174). THE BOOT at the start: **room 14,882 B + 3 modules** (H1's close).

## Group 0 — THE INBOX (3:52 · 4:00 · 4:03 pm)
- **MUSIC OFF = ONLY THE MUSIC OFF (the owner overrules H1):** H1's EFFECTS ONLY + THE DOZE undone (engine.js `sleepy` / `doze` / `wake`, the
  `__nsBedsOff` hub, `citySound`'s `tap`) — the beds + the city's one-offs play with the music off; the 'ambient' session, THE SQUEAL's instant
  cut, THE ZEROS FIRST, no wake while hidden — all kept. docs/audio.md "CITY H2".
- **MUSIC MUTED AT LOAD = THE EFFECTS DEAD (4:03 pm item 2):** the cause WAS the doze: an asleep context said 'running', so the first tap's
  `unlock` resumed nothing, and the wake outside a gesture was refused on iOS. Gone with the doze — every tap resumes a suspended context in its
  gesture. audio-leave: + "MUSIC OFF AT LOAD → one tap → an effect SOUNDS" (23 / 23). **Proved in CHROMIUM, not WebKit**: Playwright's WebKit on
  Windows has no Web Audio (AudioContext is undefined there — audio-leave's own header), so Safari's engine can't play a sound on this machine.
- **THE FAST CYCLE (3:52 pm item 2, H1's OPEN item 4):** NOT a stuck engine. The city's song plays on the SYNCED STATION player
  (party-music.js); music.js's own `musicClock()` — what H1's check watched — reads -1 whenever the station holds the song. Harbor `mediacut`
  "THE FAST CYCLE" now hears the station's slot + the output's peak: OFF → ALL OFF → ON in ~1 s → back in ~240 ms.
- **NEVER A DEAD SCREEN (3:52 pm item 1):** `app.js#dead` — a screen whose mount throws, or a room code whose meta never comes past THE REJOIN
  LIMIT (on ANY route), → the city at once + COUNTED (quiet kind `dead` → /admin's errors). e2e-playnow `--only quit`: PRISM DROP / OVERCLOCK /
  JAYWALK solo ☰ → QUIT → LEAVE → the city + its PLAY shelf in ≤ 1.1 s; a meta-less room code → the city in ~8 s — **WebKit 4 / 4 + Chromium 4 / 4**.
  A room match's LEAVE / QUIT TO THE ROOM / END GAME untouched (harbor `leaveroom`).
- **THE ROOF BOARD FLICKERS (4:03 pm item 1):** the flash = a neon RE-LAYOUT in the first seconds rebuilding the board on its BASE face (HOLD'EM)
  while the load's quiet window kept the tri-vision from putting its face back. Fixed at the layout + ONE FACE FROM THE FIRST FRAME (the pick
  from all of today's faces by date, only its picture warmed early, the reveal holds for it, CUT in under the boot screen); JAYWALK's NOW OPEN
  without a stored day counts from 2026-11-17 (`faceDates`), /admin now stamps it. Harbor `trionce` (new): the owner's live feed, every frame
  10 s from the reveal — ONE face, JAYWALK NOW OPEN, at 390 + 402 × 4 CPU. docs/harbor.md "THE TRI-VISION".

## Group 1 — THE BOARD LAYOUT B + ITS HEADER PICTURE
docs/profiles.md "CITY H2". The short skyline strip (assets/board-sky.webp re-baked at 760 × 520 — every named sign in one line, all lit; the
GO-LIVE reviewer's item (3) done), ONE row (THIS WEEK | ALL TIME + THE PICKER sheet), the points under the medal, full-size cards, no heading,
no YOU / ⋯ line (REPORT → the player page's MORE; the public /board: a tap on a card), the page scrolls, YOUR rank = one slim line at the foot.
**Cards on screen: 7 at 390 × 844 (with the foot up too), 6 at 375 × 667.**

## Group 2 — THE YOU ROW
docs/vault.md "THE YOU ROW". ONE glow (`ui/strip-board.js#markMine` + css/vault.css `.vl-strip.sb-me::after` — opacity breathes 3.6 s, reduced
motion steady) in THE BOARD, SCORES, JAYWALK's YOUR TABLE and every results list; their own "me" styles removed.

## Group 3 — THE STATS SHEET
docs/profiles.md "CITY H2". Three tiles (PLAYERS who played + "N signed up, never played" · NEW THIS WEEK → its members' sheet · MATCHES
TODAY), the new order, MATCHES PER DAY's tap box, THE WEEK's bar inside a bar, NO GOLD (cyan + hot pink — /admin's charts too), every slim-card
list 3 + SHOW ALL (N) / SHOW LESS.

## Group 4 — THE GAMES LIST BY POPULARITY
docs/progression.md "THE GAMES LIST ORDER". `core/game-order.js` (pure) + the server's once-a-streak-day `progress/gameOrder`, served as the ORDER
only in the cached `?live=1`; JAYWALK (Nov 17) + HOLD'EM (Nov 8) both in their first 14 days today → on top with NEW, the newest first.

## Group 5 — THE STREAK FLAME = THE PINK TUBE
docs/progression.md "THE STREAK FLAME". Two tubes (pink outer + white-hot tongue), day deeper without glow, NOT PLAYED YET dimmed + a slow
flicker, FROZEN blue. SHARE TODAY reads at 360 px (shots `city-h2/flame/`).

## The inbox's 4:48 pm entry — JAYWALK's SNEAKER
docs/title.md "NEVER A DEAD SCREEN" (its JAYWALK paragraph). A vector tube mark in core/marks.js; ONE definition for the sheets, the signs, the
card art, the ticket, the share image. `tests/integration/marks-preview.html`.

## Named calls (obvious / the house's patterns — the owner may overrule)
- THE BOARD: REPORT moved into THE PLAYER PAGE's MORE (the ⋯ line is gone by the owner's pick); YOUR rank's foot is ONE slim line (no card) so the
  foot never costs a card; the YOU word under the medal (in mock B) left out — THE YOU ROW's glow + the pink rank mark you instead.
- THE PICKER on a game tab lists RECORDS + CAREER together (one sheet, two headings) — the same control on every tab.
- THE GAMES LIST: HOLD'EM's go-live = 2026-11-08 (the billboard's NOW OPEN day) → it shows NEW until Nov 21, under JAYWALK.
- STATS: every bar cyan (the games' bars too — "every bar"); /admin's own section headings keep their colour (only its charts follow).
- The marks preview's DAY band: the white sole (like PRISM DROP's white prism) is faint on a light background — the marks only ever sit on the
  dark sheets / the night city, so nothing was changed for it.

## FINAL
Fresh emulators + `serve.mjs --emu` (:5173) + a `DAILY_TEST=1` server (:5174). **Unit 2,249 / 2,249** · **/api server.test 66 / 66** (its JAYWALK
switch case moved to the new stamp: NOW OPEN with no day → today; an empty day stays cleared; + the cached ?live=1 carries the ORDER) ·
**e2e-jaywalk 99 / 99** · **e2e-prism 94 / 94** (two earlier runs 93 / 94 — each a DIFFERENT timing check: SPECTATE's "DUEL SOON" header read a
moment late, then THE HEARD BEAT 76 ms vs its 60-ms tolerance; each green in the other runs) · **e2e-daily 122 / 122** (its YOU check moved to
THE YOU ROW's glow — it read SCORES' old lit frame) · **smoke 21 / 21** · **wk-press 47 / 47** (WebKit) · **wk-board-taps 20 / 20** (WebKit) ·
**e2e-playnow 27 / 27** (WebKit: solo, friends, HOLD'EM, sign, quit) + `--only quit` Chromium 4 / 4 · audio-leave **23 / 23** · the harbor groups
`trionce, trivision, trivision-rebuild, mediacut, music, neon, sounds, stripfit, leaveroom, room, dock, newstart, keypop` **243 / 243**.
**PRE-EXISTING, not this pass:** e2e-profiles hangs after its 6th check at the CIPHER podium step (named since JAYWALK H2 — `jaywalk-h2.md`); its
first run here timed out even earlier (the room seats' pid, 20 s), its second at the known spot — the board checks moved to this pass's layout
(REPORT through MORE, the YOU ROW) sit after it and are not reached. strip-match `--still --size 402`: 13 strips over 9 — the SAME 13 on CITY
H1's code (d807a40a in a worktree on :5175) — not this pass.
**THE BOOT BUDGET: room 14,161 B + 3 modules** (H1's close 14,882 — this pass ~0.7 KB: the undone doze paid for the dead-screen net, the board's
pick + the order's one line; NEON PAR's ~6 KB + 1 file still fits; never raised). JAYWALK's per-game budget untouched (no JAYWALK module changed
but victory.js's one class). No rules change — nothing to re-publish. The FULL e2e-harbor runs in the cloud on the tagged push.
**Shots** (`Downloads/NEON/city-h2/`): `refs/` (the owner's picks) · `board-before/` · `board-r1`, `board-r2` (pass 1) · `pass1/`, `pass2/`,
`pass3/` (THE BOARD every tab + the picker + the public page, STATS scrolled, at 390 / 402 / 430 / 1440 + 375; pass 2 = the public page's PLAY NOW
pinned at the foot; pass 3 = the 375 × 667 header tightened — 6 full cards even with YOUR foot up) · `you/` · `stats-r1/` (the tap box, NEW THIS
WEEK's sheet) · `games/` (the PLAY sheet's order + NEW) · `flame/` (the streak card, the moment, SHARE TODAY night + day at 360) · `marks/`
(the four marks, 24–64, night + day, 390 + 375) · `quit/` (the solo quits) · `e2e/`. THE BOARD + STATS have one look (night) — no day look exists
for them. The roof board's first 10 s: harbor `trionce` records every frame from the reveal (the shots' scenes are dated before JAYWALK's
poster, so a screencast of them never shows the tri-vision).

## OPEN FOR BEN
- RE-PUBLISH: nothing (no rules change).
- Your phone checks: (1) the music button on MUSIC OFF → load the site → tap the city → an effect plays; the beds + the city's sounds play with
  the music off; a podcast keeps going under them; (2) the roof board on load: ONE face (JAYWALK NOW OPEN) — no flash.
- Named calls above (THE BOARD's REPORT in MORE, the slim YOU foot, the picker's RECORDS + CAREER together, HOLD'EM NEW until Nov 21, every STATS
  bar cyan) — yours to overrule.
