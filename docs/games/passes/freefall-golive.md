# FREEFALL — THE GO-LIVE — Nov 28 2026 · the Beelink · Opus 5.5

**RE-PUBLISH: NO.** No rules change (`database.rules.json` untouched — the live rules already carry FIX C's `ff` + `rs`; THE HELD LIST's
`ffheld/` is server-only: the rules' root denies every client). The owner's calls: `docs/games/plan.md` "FREEFALL — THE GO-LIVE (Nov 28)".
The bible: `docs/freefall.md` "THE GO-LIVE" + "THE HELD LIST". The checklist followed: `docs/games/passes/freefall-review.md` § THE GO-LIVE
CHECKLIST (HIGH RISE's go-live, `highrise-golive.md`, the pattern).

| commit | what |
| --- | --- |
| `9d1488f5` | Step 0 — plan.md (speed solved on Ben's iPhone; the go-live calls) |
| `28c3dddd` | Group 0 — the three fixes from Ben's iPhone shots |
| (Groups 1–3) | THE TWO FLIPS + the checklist · THE HELD LIST + RELEASE on /admin · the counting-ON cases |
| the close (top) | the fresh-eyes review's fixes, this log, the final run (the ci tag) |

THE ADD-ON INBOX: read at the start, after each group's commit and before the final run — nothing addressed to this pass. This pass ADDS
two entries: TO THE CITY CHAT (install FREEFALL's sign + day face + billboard, lift THE SIGN HOLD) and OPEN FOR BEN.
THE LAB EXPORT (the start): 232 marks, no FIX (the six FREEFALL cards APPROVED by the owner on Nov 26).

## GROUP 0 — THREE SMALL FIXES (Ben's iPhone shots)
1. **THE TOP LINE** ("YOUR BEST 145 · 7 PLAYING" ran under ☰ / SOUNDS — "SOYUNDS"): the GL HUD lays the line in the span RIGHT of the
   stage's left buttons (the test page's ☰ + SOUNDS: `stage.js#edge` hands the HUD that edge at a STATE CHANGE only — the opening, the end,
   a run's start — never in a frame) up to the source's right side (`.ff-best`'s 60 px sides already clear the console's 36 pt corners:
   `--cb-room` 56); too wide → TWO lines, split at the last ' · ', round the line's middle (`hudgl.js#topLines`). Measured at 375 / 390 /
   430 × solo (the opening + the run) + match (the fall) + spectate (WATCHING — ☰ + SOUNDS back), both looks: 30 / 30, no overlap, and
   every line inside the console's corner room.
2. **THE DEPTH RAIL's names** (AVA over CHARLIE): the gap was 14 px for a 14.4 px box → `NAME_GAP` 17; and the GL HUD eased each name on
   its own, so two names passing each other CROSSED mid-ease → `hudgl.js#apart` keeps the EASED names a gap apart too (an insertion sort
   on a kept array — no garbage in the frame). 8 players: 17.0 px at the closest, settled and eased, both looks.
3. **THE SPIKE RULE flapped 2 → 1 → 2 → 1 → 2:** after the spike rule's NO HELP → back, the kit's TIMING rule (p75 > 19.5 ms) stepped it
   down again and its cap probe back up. Now nothing steps the tier for the page once the spike rule rests (`stage.js`: `tiers.tick` only
   while `!spikeOff`). The check (`freefall-play.mjs --golive`) runs a CONTROL first (the page's clock at 2× — frames read 33 ms — the
   timing rule steps), then NO HELP → 15 s of 33-ms frames: path 2→1→2 and stays. On the old code the same check read 2→1→2→1→0→2.

## GROUP 1 — THE GO-LIVE CHECKLIST (item by item)
1. **THE TWO FLIPS:** `config.js` FREEFALL `playable: true, live: '2026-11-28'` (no `preview`) · `api/_lib/freefall.js#FREEFALL_COUNTS =
   true`. THE KILL SWITCH: the would-count path kept; the emulators' `testFreefallCounts` was already two-way (true / false over the code) —
   `server.test.mjs` + `e2e-freefall.mjs` now run the OFF path by forcing `false`.
2. **CHECKED, nothing built:** the owner gate (`report.js#reportableGame` — playable = anyone's report) · a PLAIN host's REMATCH
   (`e2e-freefall-match.mjs` section 3 — it was "Coming soon") · HOW TO PLAY's tab (`help.js` lists playable games) · the Credits group
   (`credits.js` — `isPlayable`) · the games-list order (`activity.js` — today's cached order lacks FREEFALL until the next streak day; the
   phone's `shelfOrder` puts any game the order lacks after it, and NEW puts it on top) · the PLAY shelf + the room's list.
3. **THE BOARD:** `TABS` + `'freefall'` (EIGHT), `HIDDEN_TABS = []`. The row already scrolled with seven (694 px of tabs in a 358-px row
   at 390, the right edge faded): eight scroll the same way, every tab 44 px tall, no word cut; opened on FREEFALL the row scrolls it into
   view. The harbor `tapfit` check: one row of EIGHT. Shots: `board\`.
4. **THE CITY:** `SIGN_HOLD = ['freefall']` — + a harbor `neon` check (no FREEFALL sign, blade or billboard tonight). The inbox entry TO
   THE CITY CHAT asks for the sign (the mark D), its day face, the billboard (`assets/city/freefall/billboard.webp`, 848 × 448, OPEN NOW)
   and the lift.
5. **THE ACCENTS:** `freefall: '#27e0e6'` in `LOGO_ACC` (tube-logo.js), `ACC` (title.js), `SIGN_ACC` (signs.js). Boot room: THE BOOT
   BUDGET + THE PER-GAME BUDGET green, nothing raised (the boot graph 123 modules · 2,081 KB).
6. **THE SMOKE START:** `['freefall', {}]` in `e2e-smoke.mjs` (six playable, ten hidden); `FREEFALL_WAITS` empty.
7. **THE WEEKLY GOAL:** `boards.js#GOAL_FROM = { freefall: 'w20261130' }` + `goalGames(wk)` — the server's step (`progress.js`) and the
   phone's card (`progress/profile.js`) read the SAME list; FREEFALL joins at the Monday 4 am line. This week's goal: "Win 3 matches"
   either way (checked).
8. **THE CARDS out of THE LAB:** all six APPROVED by the owner (Nov 26) → `approved.js#SHIPPED` + `catalog.js#SHIPPED_TIERS`; their six
   lab rows + lab text gone (the "HIDDEN until FREEFALL goes live" lines with them).
9. **THE TESTS THAT FLIP** — each rewritten to the playable truth, none deleted but the lab's: unit (cartridge · registration · freefall-
   cartridge / -play / -server / -share / -fixc · harbor · city-b-signs · city-part1-signs · city-part2-endneon (FREEFALL's joined two-
   colour word + its createFinal) · highrise-golive / -cartridge · holdem-board (EIGHT) · jaywalk-cartridge · lobby-2a) · `e2e-freefall`
   (A STRANGER: the shelf, the card, PLAY NOW, COUNTED; the kill switch OFF = WOULD COUNT + nothing written) · `e2e-freefall-match` (a
   PLAIN host, COUNTED for all, a plain host's REMATCH) · `server.test` (the kill switch forced OFF first — a stranger's run judged — then
   the code's ON) · `e2e-smoke` · the harbor `room` (PICK A GAME = 6) + `tapfit` (eight tabs) + `neon` (THE SIGN HOLD) groups.
10. **/freefall-lab DELETED** (the page, `lab.js`, `graybox.js`, `css/freefall-lab.css`, `freefall-lab.test.mjs` + `freefall-lab.mjs`;
    `serve.mjs` + THE PAGES LOAD). /freefall-play stays and never counts.
11. **THE DOCS:** CLAUDE.md (SIX PLAYABLE + one FREEFALL line) · ROADMAP · `docs/freefall.md` (THE GO-LIVE, THE HELD LIST) ·
    `docs/data-model.md` (`ffheld/`) · `docs/testing.md` · the meta row's comment.

## GROUP 2 — THE /admin HELD LIST + RELEASE (no pattern existed — a small new list)
See `docs/freefall.md` "THE HELD LIST". `match-report.js#heldNode` + `ffHoldWhy` (pure) · `progress.js#releaseStep` (pure) ·
`api/_lib/held.js` (record · list · RELEASE · REJECT) · `api/report.js#credit` records · `api/admin.js` `heldList` / `heldRelease` /
`heldReject` (owner-only, audited) · `/admin` → **Held runs**.

## GROUP 3 — THE CASES NOT YET TESTED WITH COUNTING ON (the emulators)
(filled at the close)

## THE FRESH-EYES REVIEW
(filled at the close)

## THE FINAL RUN
(filled at the close)

## THE CALLS MADE (obvious / established — overrule any)
(filled at the close)

## OPEN FOR BEN
(filled at the close)
