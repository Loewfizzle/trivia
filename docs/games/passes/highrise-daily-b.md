# HIGH RISE DAILY B — THE SCREENS + GO LIVE — Nov 21 2026

The owner's decisions: `docs/games/plan.md` "HIGH RISE DAILY B" (Step 0, 35083b2c) + the add-on line (THE GRAVESTONES). The area's docs:
`docs/highrise.md` "THE DAILY — THE SCREENS + GO LIVE" · `docs/progression.md` "HIGH RISE DAILY B — THE RECOLOUR · THE BIG FIVE · THE
SCHEDULED GO-LIVE IN CODE" · `docs/jaywalk.md` "THE MATCH MOMENTS" (THE GRAVESTONES). Built on DAILY A (5171dc2 / bc83528). The inbox: no
entry addressed to this pass (read at the start, after each group, before the final tests; the 8:32 / 8:34 pm GARDEN PARTY entries are the next
city pass's). The add-on (THE GRAVESTONES) came through the chat, built as the last group. The lab export (224 marks): no open FIX.

**RE-PUBLISH: nothing** (no rules change).

**GOES LIVE: Sunday Nov 22 2026, 4:00 am Eastern** — `config.js#DAILIES.highrise.liveFrom = 'd20261122'` (the first 4 am after this deploy;
no /admin step; /admin lists it "LIVE FROM … 4 AM — set by the deploy", no CANCEL). THE GO-LIVE SWITCH still gates everything.

## WHAT WAS BUILT
- **G1 — THE TICKETS + TODAY (4c67535d):** THE RECOLOUR in `ticket-art.js#TICKET_INK` (HIGH RISE `#4fd6ff` / `#007f9e` · JAYWALK RED
  `#ff4058` / `#d01f35` · COAST CLEAR `#9cff7a` / `#2e9a2a` · THE DROP `#a77bff` / `#6a3fd0` · THE PASSWORD unchanged) — the sweep segments,
  PLAY tubes, SCORES panels follow; JAYWALK's share bars + its daily end card; COAST CLEAR's touch pulse (it was documented as the ticket's
  colour). THE MARK ART (`markArt` — JAYWALK + HIGH RISE in their marks' own colours, near-white → navy by day). HIGH RISE's ticket in every
  state; the held run's "FLOOR 47 · ONE SHOT" from the SERVER's own log (`today { prog }` — the cartridge's `progress`, `held.js#floorsAfter`).
  5 TICKETS FIT (`kit/daily-fit.mjs`, in e2e-daily + e2e-jaywalk-daily-run).
- **G2 — THE SHARE CARDS (bd8443b2):** `js/games/highrise/daily-share.js` (the section: THE TOWER from `shareOf`'s w[] / x[] / pf[]; the own
  card = THE POSTER + "DAILY · ONE SHOT"; `fiveLine`) · THE BIG FIVE in `share-today.js` (`FIVE`, `fiveLayout`, every cartridge's `fiveLine`,
  `paintName`'s `ink`) · the server adds `c` (THE JUDGE's end word) to HIGH RISE's share inputs · ≤ 4 finished = pixel-identical to the card
  before the pass (share-same.html against `_old/share-today-dailyb.js` + `_old/jw-daily-share-dailyb.js`, JAYWALK's bars re-taken ON PURPOSE).
- **G3 — THE REST OF THE SCREENS (76978b34):** the daily END CARD = JAYWALK's (ADMITTED · HIGH RISE · ONE SHOT · how it ended · the SERVER's
  floors · the place / DAILY BEST / NEW DAILY BEST gold · SHARE — `prepDaily` · BACK TO THE DAILIES); SCORES generic (FLOORS, `daily-highrise`);
  the RESUME chip + THE ROOM WINS banner checked (the title preview's five real dailies).
- **G4 — GO LIVE + THE FRESH-EYES REVIEW (2e85ef7f · 5ed781fa):** THE SCHEDULED GO-LIVE IN CODE (`core/daily.js#schedOf`); the review's fixes
  (below). + `e2e-highrise-daily-b.mjs`.
- **THE ADD-ON — JAYWALK THE GRAVESTONES (3f63f455):** the red X bright for 1.5 s, then a smaller, fainter X + the name pinned where the rival
  fell until the match ends (it scrolls with the world); faded in the lane in front of the kid on screen (`moments.js#graveAhead`,
  `view.js#kidOnScreen`); DOM overlay, no draw call; solo none. The lab: **https://neonspeakeasy.com/jaywalk-lab.html?cv=2&j1=graves** (8
  players, 4 out). Shot: `Downloads\NEON\jaywalk-graves\graves-8-players-4-out-390x844.png`.

## THE FRESH-EYES REVIEW (a separate agent that never saw the build — emulators only)
Fixed:
- **HOLE — THE ROOM WINS faked alone** (a client-made room: status 'playing' + a 2nd uid paid 3 free holds = 6 undos). Now a FREE hold = ONE
  per REAL game start (`daily-room.js#roomGameProof` + `held.js#roomFree`): the start's own `meta/go` id, never used before by this run,
  stamped after the open leg's GO, with an OTHER player whose own profile is old enough to count (THE THROWAWAY GATE). /api test extended.
- **START after the phone's own end** (the fuse — not in the log — with FINISH blocked) revived the run as a hold → now the run ENDS there
  (`startHeld` reads the open leg: `e` without `x` = ended 'fin'); `closeLeg` writes `x` + `e` in ONE transaction, only on an open leg.
- The end card: the stage HUD showed through round the stamp → hidden under the card; the ‹ above it at full contrast; by day the run sat
  in a light frame (the stage's padding) → edge to edge.
Kept (named):
- HIGH RISE's mark by day stays pink + cyan on the cream (the owner's approved mockup; his rule turns only near-white tubes navy).
- A run ended by a hide with no hold left reads TOO SLOW on its poster (the judge's word: the log just stops — the server can't tell a hide
  from the fuse); the end card itself shows no cause for it.
- Two live devices on one profile: the second START closes the first's leg — the first phone's later taps are quietly refused, its end card
  shows the server's floors (bounded by the holds).
- The seed with START + the proof window (shared by every proof game) · `shareCard` takes any PNG from a finisher (all dailies, CITY E).
Held up: one shot (two STARTs at once → one run), the 4th hold (by START, by a real page), every rule refusal (records, scores, legs, chunks
before go / after `e` / after the server's close, other days), forged FINISH results, the undo bound (3), the share / prog / ended answers
(own run only, spoiler-free).

## THE VISUAL REVIEW (real size — 390 × 844 @3, 375 × 667, 430 × 932, 1440 × 900 via the stage's own column)
- TODAY: refine 1 — the five against the mockup (fits at 390 / 430, both looks; 375 scrolls) · the NIGHT PAIR (THE PASSWORD pink beside
  JAYWALK red): told apart — `#ff4058` kept. Refine 2 — every HIGH RISE state, both looks.
- SHARE: refine 1 — the sample bot was near-perfect (83 / 84 perfects: a plain block) → a real-looking run; refine 2 — THE BIG FIVE at 5 /
  both looks against the mockup (the names in Orbitron — the shipped name painter; the mockup's renderer fell back to Chakra Petch). The
  poster's longer mode line kept off the edges (`maxW` — SOLO / MATCH never reach it).
- END CARD: refine 1 — "24 FLOORS" wrapped → one line; the tubes were capsules on this page (jaywalk.css not loaded) → 10 px corners;
  refine 2 — the light frame by day + the HUD through the stamp (the review) → fixed.
- Shots for Ben (out of git — `docs/games/passes/shots/highrise-daily-b/` + `Downloads\NEON\highrise-daily-b\`): TODAY night + day, each
  HIGH RISE ticket state (both looks), SHARE TODAY at 4 + at 5 (both looks), the own card, the end card (both looks).

## THE CALLS I NAMED (yours to overrule)
1. The held ticket's floor comes from the SERVER (`today { prog }`) — another device shows the same line.
2. COAST CLEAR's in-game touch pulse follows the new green (its CSS named it "the ticket's colour").
3. THE DROP's pale night stamp ink went with its white — its stamp is the purple now.
4. JAYWALK's daily end card turned red with its ticket (its kick / note / glow / stamp ride `--tk`).
5. THE BIG FIVE: a failed PASSWORD's stat = its time; COAST CLEAR's stat drops the "+30 s"; a daily without share data = its result line.
6. The end card's SHARE = the HIGH RISE daily's own card (THE POSTER + tag) — SHARE TODAY stays on TODAY.
7. THE BIG FIVE's 5-finished check in `e2e-highrise-daily-b` writes the other four dailies' results straight to the database (their own runs
   are each daily's E2E); their lines + art are proven in share-same + the unit tests.
8. Tests that went stale outside this pass, fixed: rules.test's switch-over case now follows the re-published fixture (e532904a);
   daily-module's Nov–Dec timelines take HIGH RISE's liveFrom off in their own process.

## OPEN FOR BEN
- Nothing blocking. Phone check after 4 am: TODAY shows five tickets + five segments; play the one shot, hide once, come back; SHARE TODAY.
- JAYWALK's room line: 2,589 of 2,600 KB (THE GRAVESTONES + J4 — 11 KB left).

## THE FINAL RUN (the Beelink; fresh emulators + `scripts/serve.mjs --emu`)
- unit 2,534 / 2,534 · rules 101 / 101 · /api server 72 / 72 · daily-highrise 7 · daily-module 24 · daily-drop 15 · daily-jaywalk 8
- e2e-daily 152 / 152 (+ the 5-ticket FIT, 30 checks) · e2e-jaywalk-daily-run 67 / 67 · e2e-jaywalk-match (v2, FAST) 104 / 104 (+ THE
  GRAVESTONES) · e2e-highrise-daily 17 / 17 · e2e-highrise-daily-b 17 / 17 · e2e-highrise (FAST) 70 / 70 · e2e-highrise-match (FAST) 35 / 35 ·
  highrise-alloc 12 / 12 · highrise-share 120 / 120 · share-same 75 / 75 · smoke 24 / 24
- Budgets: HIGH RISE 2,543 of 2,600 KB · JAYWALK 2,589 of 2,600 · THE BOOT green (310 modules / 30 KB lines unchanged). CLAUDE.md 40.1 KB.
- Not run: the harbor groups (no city file touched — a test preview page only).
- Every server this pass started is stopped (the emulators, serve.mjs :5173); Ben's :5190 left running.
