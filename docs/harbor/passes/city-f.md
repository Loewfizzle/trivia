# CITY F — THE GO-LIVE PREP (City 2.0 + the console) — Nov 17 2026, the mini PC

Everything JAYWALK's go-live waits on from the city (`docs/games/passes/jaywalk-golive-checklist.md` §0 "THE CITY CHAT has done" 1–5 + the audit's
console / boot items). JAYWALK's own go-live (the flip) is NOT this pass. **RULES CHANGED** — `rooms/{CODE}/rv/{uid}` (a guest's REMATCH vote on
the podium) — RE-PUBLISH `database.rules.json` (the earlier GO-LIVE REVIEW change is in the same publish).

**Step 0** — read CLAUDE.md, decisions.md (+ three bullets: END-SCREEN STANDARD A, THE OPEN NOW BILLBOARD, A WEAK DEVICE), the go-live checklist,
the review, the cartridge / progression / title docs. THE LAB: `node scripts/lab-export.mjs https://www.neonspeakeasy.com` → 224 marks, **no open
FIX**. The inbox: built "Nov 17 — TO THE CITY — NEXT PASS — from JAYWALK H6A" + "Nov 17 2:50 pm — TO THE CITY" items (1) (2) (3) (5) (6); left
OPEN for CITY G: that entry's (4) (results/ never pruned), "Nov 16 5:55 pm" (SAVE YOUR KEY over a running daily), "Nov 16 8:05 pm" + "Nov 17
2:50 pm" (the dailies' red tests). Own servers: fresh emulators + `scripts/serve.mjs --emu` (:5173) + the A/B worktree on :5174.
**The start:** `node --test tests/boot-budget.test.mjs` green at **310 / 310 modules · 6,655,933 of 6,656,000 B — room 0 modules, 67 B.**

## Group 1 — THE BOOT TRIM (ce1f12c2) — never by raising the budget
| | modules | bytes | room |
| --- | --- | --- | --- |
| before (806a57b0) | 310 | 6,655,933 | 0 modules · 67 B |
| after group 1 | 306 | 6,622,477 | 4 modules · 33,523 B |
| at the pass's end (every group's own boot bytes in) | 306 | 6,629,581 | **4 modules · 26,419 B** |

What moved (behaviour unchanged):
- **`js/ui/vv.js` folded into `app.js#installVV`** (−1 module) — the same code, called where the import ran.
- **the colour-blind module loaded on demand** (`app.js` → `lazyImport(import('./ui/colorblind.js'))`, −1 module, −1,739 B) — it only swaps the
  games' answer tokens; no game is on screen before it lands.
- **the meteors + THE FIREBALL left the boot** (`screens/harbor/skyfx.js#lazyMeteors` → `meteors.js` + `core/harbor-fireball.js`, −2 modules,
  −10,742 B): loaded at the city's reveal (`scene.js` → `sky.afterReveal()`), or at once for `&force=meteor / fireball`; until then the piece
  draws nothing (a streak is never on screen at a reveal). The harbor `load` group's stalled-module case moved from meteors.js to aurora.js.
- **every separator ruler in a boot file's comment** (8+ dashes / equals / box lines → 4): −22,236 B in 107 files, comments only — every code
  line checked identical (`git diff` of non-comment lines = the intended edits alone).
- Proof: **pixdiff** A/B vs 806a57b0 (`--pin`, 402 × 874): noon 0 px · golden 5 px · night 103 px · party 4,662 px = the dancing crowd's glow
  sticks (the same limbs move in the A-vs-A noise — `Downloads\NEON\city-f\pixdiff\`). **title-perf --ab** (4× CPU, 390 × 844): "same" on
  np-party + np-night at tiers 2 and 0. THE BOOT PRELOAD + THE CARRY regenerated.

**For the JAYWALK chat:** **CITY F freed 26,352 B + 4 modules net (the trim 33,456 B; the pass's own groups then added 7,104 B) — the boot now has 26,419 B / 4 modules of room (306 of 310 · 6,629,581 of 6,656,000 B; ce1f12c2 + 57b5e5b2)** — the go-live's measured need is ≈ 6,200 B + 1 module.

## Group 2 — THE CHROMEBOOK (ce1f12c2)
The owner's nephew's school Chromebook (/admin STALL Nov 17 2:14 pm, build a6f885e: Linux aarch64 Chrome, 1 core, 4 GB, 1600 × 1200 @ 1 — a
1650 ms frame before the reveal stepped t2 → t1, a 2033 ms gap at +2.9 s in the 1200 ms bake crossfade, the reveal at 5531 ms, ~56 MB canvases).
- **`core/harbor-tiers.js#weakDevice`** — ≤ 2 cores OR ≤ 4 GB → the city starts on the LOWEST tier BEFORE the first bake (`scene.js` — `weak`).
  NEVER an iPhone / iPad (an iPhone UA / iPadOS's desktop UA with touch) — title.js's own note: iOS reports a capped core count. Under
  automation only with `&weakdev=1`; a tier a test sets by hand wins; the guard's step up still lifts a phone that turns out fine (Chrome's
  deviceMemory 4 also covers a 6 GB Android phone — it climbs back after 20 s of steady 60 fps).
- At that tier on such a device: **no bake / lit-window crossfade** (a straight swap), **the backing store capped** (`weakDpr`: ≤ 1 MP, never
  under 0.6 × — 1600 × 1200 draws at 0.72 ×), **bigger bake slices before the reveal** (90 ms — nothing is on screen yet), **a painted frame
  between the city's construction and its first frame** (the trace: `createHarbor` 1.18 s then the first frame 0.63 s, back to back — no paint).
- Measured (the same profile — 1 core / 4 GB / 1600 × 1200 @ 1, the probe in the harbor `weakstart` group):

  | | the reveal | the worst frame (start → reveal + 15 s) | the bakes |
  | --- | --- | --- | --- |
  | before, 4× CPU | 5,508 ms | 2,117 ms | 39.9 MB |
  | after, 4× CPU | 5.4–6.1 s | 1,367–1,967 ms (five runs) | 20.9 MB |
  | before, 2× CPU | 3,092 ms | 867 ms | |
  | after, 2× CPU | 2,566–3,085 ms | 600–667 ms | |

  **NOT DONE — the reveal under 4 s at 4×** (≈ the real Chromebook): it is held by THE LOAD's own gates — the city re-lays out once the title's
  rects land (a second full bake + the clouds re-planned) and reveals "late" at REVEAL_MAX. The next step (CITY G): the weak device's first
  build waits for the title's first rect report, so the one bake is the right one. At 2× it is 2.6 s.
- The iPhone profile (an iPhone UA reporting 2 cores, 402 × 874 @3): weak false, tier 2 — untouched. Pinned: `tests/weak-device.test.mjs` +
  the harbor `weakstart` group (in the `lobby` job): the 4× profile (lowest tier, the capped store, no crossfade, no frame over 1.5 s), the 2×
  profile (the reveal under 4 s), the iPhone profile.

## Group 3 — END-SCREEN STANDARD A (2d3747b5)
The owner's pick (`Downloads\NEON\endscreen-standard-A.jpg`, copied to `city-f\`). ONE foot for EVERY game's end screen, built in `ui/final.js`:
THE BAR (solid, full width inside the 16 pt gutters, 66 pt, 12 px corners — never a pill — in the cartridge's `ACCENT`, a static glow) + THE
QUIET LINKS (an icon + a word, no box, a thin divider; 48 pt tall, data-press / SHARE data-gesture). SOLO = PLAY AGAIN · SHARE · CITY (a room of one:
BACK TO THE ROOM); A MATCH = REMATCH (the host: `host.js#rematch`; a guest: their vote → WAITING FOR THE HOST + "N OF M WANT A REMATCH", a
second tap takes it back) · BACK TO THE ROOM · SHARE. No share → the way out alone, centred (HOLD'EM).
- **The text on the bar:** `core/fin-ink.js` — dark where ≥ 4.5 : 1, else white. **No game needs white text:** PRISM #8fd8ff 12.6 : 1 · OVERCLOCK
  #ff6a1a 6.9 · HOLD'EM #f2c14e 11.7 · JAYWALK #ff4fc4 6.7 · the console's pink 6.1 (`tests/endscreen.test.mjs`).
- **The podium vote — RULES CHANGED:** `rooms/{CODE}/rv/{uid}` also while `meta/status` is playing and `game/phase` is final, the vote =
  `game/matchId` (`rules.test.mjs` 85 / 85 with the new case). On the old rules the vote is refused → it waits on the phone (`ns:rv-wait`) and
  goes in once the room's ring is up (`room-city.js`). The walk back KEEPS the votes (host.js — a vote counts only for `meta/back/m`).
- JAYWALK's in-body SHARE MY RUN moved to the foot. PRISM's paper look: the links take the frame's `--fin-cue` / `--fin-ico` ink.
- THE SHELL: CLAUDE.md's THE SHELL line names the ONE exception; `tests/shell.test.mjs` knows it. e2e-jaywalk + e2e-jaywalk-match's foot
  assertions are the standard's (the order, the bar's colour / ink / size / corners, the links' no-box + 44 pt).
- Shots (`city-f\foot\`): PRISM solo night + day (paper) at 390 + 375, OVERCLOCK solo, the match foot host (OVERCLOCK, a vote in) · a voted guest
  (JAYWALK) · a no-share guest (HOLD'EM) at 390 + 375, 1440 × 900 once; JAYWALK solo + match from the E2Es' own shots. Refine passes: (1) the
  layout against the mockup, (2) PRISM's paper — the links were cream on cream → the frame's own ink, (3) the desktop column.

## Group 4 — THE RESULTS PLAQUES (f20c5550)
`profile/callouts.js` + `css/board.css`: every plaque a THIN NEON LINE FRAME in the game's accent over dark glass + an icon with meaning — NEW
PERSONAL BEST = a rising arrow (the value big + "was N" on the right), a worldwide rank = a globe, ENTERED THE TOP 10 = a laurel, this week's
(#1 THIS WEEK included — no longer gold) = a calendar. **#1 WORLDWIDE is the ONE gold moment:** a crown, a thin gold neon frame, a foil sweep + six
sparks on arrival (once — transform + opacity; reduced motion = the still), the existing fanfare. The brown box + the compass are gone; 12 px
corners. Shots (`city-f\plaques\`): gold (#1 + PB, the mockup's pair), kinds (TOP 10 · PB · THIS WEEK), week (#1 THIS WEEK + #5), world at 375.

## Group 5 — THE PODIUM's MOMENT (dd19b7b9)
`progress/moment.js` + `css/progress.css` — (a) the sheet builds WITH its rows (every line at +0 then counting; the level there; a row not
arrived takes no space — the sheet hangs from the top and grows down); (b) THE LEVEL UP's backdrop opaque + above CONTINUE (z 5 over 2 — the
sticky CONTINUE used to sit ON the takeover), the sheet fading under it; (c) EVERY achievement shows its card (no slice(0, 3)) + an EPIC /
LEGENDARY item earned gets ITS OWN BEAT (the takeover, its tier's colour, the real tile big, its name + the achievement; held until a tap,
its first second ignored); (d) the veil a neutral dark up AT ONCE (no purple fade-in washing the end screen; on close the sheet first); (e)
CONTINUE = the non-pill tube (10 px), the level bar squared (2 px). Shots (`city-f\moment\`): the first frame, the build, the level-up, the EPIC
beat, the four cards (results-preview.html `case=four`); the real 4-card JAYWALK match's beats from e2e-jaywalk-match (`cityf-moment-2-beat-*`).

## Group 6 — THE OPEN NOW BILLBOARD (ca12b48a)
The owner's poster (`Downloads\NEON\jaywalk-billboard-open-now.png`, 1696 × 896 — COPIED to `city-f\`, the original untouched) →
`scripts/build-jaywalk-opennow.py` → `assets/city/jaywalk/open-now.webp`, **848 × 448, 24.4 KB** (the poster box — the original's exact half).
From the OPEN DAY (the `jaywalk-open` face) the board draws it WHOLE (its words baked in, no lettering over it); until then the COMING SOON face as
today. Fetched lazily after the reveal, only once that face is wanted (`needOpen` / `tri.jwOpen`) — not in the boot graph. Shots (`city-f\billboard\`,
`&force=billboard-jaywalk,trivision&jaywalk=open`, 390 × 844): night (under the board's lamps), day, mid-turn (the slats still turn).

## Group 7 — JAYWALK AT 8 PHONES + THE QUEUED PROOF (57b5e5b2)
- **`--eight`** (`e2e-jaywalk-match.mjs`): 8 phones (the owner hosts), a bot on each, a sample every 30 s — each phone's frame p50 / p95 / worst, its JS
  heap, the live tree it mirrors + what a copy of it costs (room.js's listener re-exports it on every hop); the host under a 4× CPU throttle
  once all eight are sampled in at 1 min. **Minute 5 is NOT reachable with bots** (four runs: the greedy bots all out by 1.5 min; the
  wall-pacing ones by 1.2–3.5 min — the wall speeds up from ~3 min — so the host's 4× check never had all eight in). **The best run, to 3.5 min:**
  every phone p50 16.7 / p95 16.8–16.9 ms (60 fps) at every sample; the worst frames 33 ms, 83–100 ms at 3.0 min, 117–184 ms at the end (the
  deaths), one 250 ms on all eight at 1.5 min (the same moment everywhere — a shared event, not the listener); heaps 52–121 MB with NO upward
  trend; the live tree 7 → 13 → 23 → 28 → 34 → 41 → 49 KB, a copy of it 0.15 → 1.0 ms. **No slip → the per-player listener was NOT built**
  (room.js's onValue stays; the cost grows with the tree: ≈ 1 ms a hop at 49 KB on this PC, several × that on a phone — the next step if a real
  8-phone night shows it: listen per player, child-added on `c`).
- **A QUEUED REPORT's PROOF:** `games/kit/again.js#pruneRuns` never prunes a run whose report is still in the console's queue (it is tried again
  at the next run); BACK TO THE CITY's last-one-out (`room.js#leaveRoom`) KEEPS a room whose report is still queued after the ≤ 3 s settle — it
  just leaves — and `room.js#sweepKeptRooms` closes it once the queue has answered (`profile/queue.js#done` → the hub). `tests/queued-proof.test.mjs`.

## FINAL
Fresh emulators + `serve.mjs --emu`, nothing else busy. **Unit 2,199 / 2,199** (+ 12 new: weak-device, endscreen, queued-proof; the
  file-hashes / preload-graph / play-now / jaywalk-solo lines updated) · **rules 85 / 85** (the podium vote) · **the api: not touched** ·
  **smoke 21 / 21** (THE PAGES LOAD — Chromium + WebKit) · **prism 67 / 67** · **OVERCLOCK `e2e-oc-new` 69 / 69** (its victory check now asks for
  ONE REMATCH bar in its orange) · **holdem 22 / 22** · **jaywalk (solo) 83 / 83** (the foot; the final screen 7.6 MB × 5 — the budget 20) ·
  **jaywalk-match --four 87 / 87** (the foot; the moment's beats: level-up → RIGHT OF WAY → BEAM ME UP, all three cards; finals 7.6–10 MB) ·
  **jaywalk-match --eight 3 / 3** (above) · **the harbor groups** `weakstart, load, trivision, billboard, cartridge, gameflows, afterparty, shell,
  sgfast`: 83 / 85 on the first run → the two reds fixed (the `shell` podium check pinned the old BACK TO THE ROOM main → the standard's foot;
  THE CHROMEBOOK's 4× frame: 1,967 ms that run — see below) → `weakstart, shell` 14 / 14. **THE BOOT BUDGET** green: 306 / 310 modules,
  6,629,581 of 6,656,000 B — **room 26,419 B + 4 modules** (≥ 9,216 B + 2). The FULL e2e-harbor runs in the cloud on the tagged push.
  **THE CHROMEBOOK at 4× (≈ the real one), honestly:** the worst frame runs 1.37–1.97 s from run to run (was 2.12) and the reveal ~5.4–6.1 s —
  the 1.5 s / 4 s targets are met at 2× (the reveal 2.6–3.1 s, the worst frame 0.6–0.7 s), NOT at 4×. The group pins: at 4× never worse than
  before; at 2× the reveal under 4 s + no frame over 1.5 s.

## OPEN FOR BEN
- **RE-PUBLISH `database.rules.json`** (Firebase console → Realtime Database → Rules → paste the whole file → Publish) — CITY F's podium vote +
  the GO-LIVE REVIEW's proof-tree rule. Until then a guest's podium vote waits on the phone and goes in once the room is back (nothing breaks).
- Nothing new needs your call. NOT DONE (the next city pass, CITY G): THE CHROMEBOOK at 4× CPU — the reveal under 4 s + no frame over 1.5 s (the
  weak device's first build should wait for the title's rects: one bake, not two); a real 8-phone match past 3.5 min (bots can't get there).
- The inbox's open items for CITY G: results/ never pruned (Nov 17 2:50 pm (4)), SAVE YOUR KEY over a running daily (Nov 16 5:55 pm), the
  dailies' red tests (Nov 16 8:05 pm + Nov 17 2:50 pm). Your "Updated roadmap." note arrived mid-pass: no change to the repo's ROADMAP.md was
  found (only CITY F's own line was added).
