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
| case | where | result |
| --- | --- | --- |
| TERMINAL VELOCITY + ROCK BOTTOM actually awarded | `server.test` (a 'great' run to 200 whose replay earns 15 floors without a bounce — a seed tried until it does, never too perfect) | the three cards + their achievements + the feat flags |
| THE TIE-BREAK / a shared first place through the report | `freefall-golive.test` (`extractMatch`) | the same floor → the earlier tick wins alone · floor AND tick = a SHARED first (both win in a room of 3) · a room of 2 all tied = a DRAW |
| THE AVERAGE from the 5th run | `server.test` | runs 2–4 answer `null` (AVG —), the 5th a number |
| THE DAILY CEILING + countedPlays for a FREEFALL row | `freefall-golive.test` (`matchStep`) | 20 room matches pay, the 21st pays nothing + moves no board · a verified solo run = a counted play, a held one never |
| THE FREEFALL tab on public /board | `server.test` (`boardQuery`) | the player's row by username from the 3rd counted play — never a pid |
| the run's share-card upload | — | NOT a FREEFALL path: SHARE = THE PICTURE ONLY (F5B — the owner: the card is drawn on the phone and handed to the share sheet; nothing uploaded — `freefall-share.test.mjs`). `share-card.js#RUN_GAMES` keeps `freefall` for a later run card |
| a held run, end to end | `server.test` + `e2e-freefall-match` + /admin by hand | a script's run held → `ffheld/` → /admin lists it → RELEASE once (the board, the average, SPLASHDOWN; 409 the second time; audited) → a second held run REJECTED (nothing moves). In the browser match THE DIVER's dive to 200 (10 bounces · a 118-floor no-bounce run) is HELD: XP paid, no win for anyone, no best, the row waits with ROCK BOTTOM. /admin by hand (emulators): the card, RELEASE from the button → best 200, ROCK BOTTOM, `rl` marked, audited |

## THE FRESH-EYES REVIEW (a separate read-only agent that wrote none of it — the whole diff + the checklist cold + the shots)
"No HIGH defects." The unit suite 2866 / 2866 on its read. Its finds — fixed unless named:
1. **MEDIUM** — a held row written AFTER `results/` was sealed `done` could be lost for good if that write failed (every resend finds
   `done`) → the rows are written BEFORE the seal; a failure fails the report and the resend writes them (once each).
2. **MEDIUM** — G0.3 switched the WHOLE tier controller off after a NO HELP (a phone that later gets CPU-bound could never step down) →
   `kit/tiers.js#rest()`: only the TIMING rule + its cap probe rest (`capped`); a step forced by real WORK still happens; nothing steps
   back up to a failed tier. The `--golive` check: still 2→1→2 and stays (the control still steps).
3. **LOW-MEDIUM (tests)** — RELEASE was never shown to reach the PUBLIC board (the player was under the listing floor) → the server case
   gives SCRIPT two honest counted runs first (the real floor of 3 for the block): the release is the 3rd counted play → the lb row,
   `profiles/{pid}/m`, PUBLIC /board. + a CRASH re-release (the row put back) = `skip: 'released'`, the stats untouched.
4. **LOW** — RELEASE never updated `profiles/{pid}/m` nor put every game's boards up when it crossed the listing floor → both, as
   `stats.js` does for a counted run. (A release of a run from an EARLIER week sets that week's best in the stats; the weekly board row of
   a past week is not rewritten — named, as the reviewer suggested.)
5. **LOW** — REJECT during an in-flight RELEASE (two admin tabs) → refused (409) while the claim is fresh.
6. **LOW** — the held row's feats skipped the own-key guard the line below uses → the same guard.
7. **LOW (design)** — a held row still places first, so nobody wins that match: a scripter can deny an honest room its win (keeping
   XP) → NOT changed (FIX C's rule, the owner's anti-cheat) — OPEN FOR BEN 3.
8. **LOW (tests / shots)** — the match's ROCK BOTTOM-at-count branch rarely runs (THE DIVER is held) — it is proven by `server.test`'s
   'great' run instead; `golive-counted-match-podium.png` caught the LEVEL UP moment → the counted podium reviewed on `match-podium.png`
   (BOB's — the body, THIS MATCH, the XP box).
9. **LOW** — `topLines` wraps once and the edge is read at state changes only → kept: the longest top line is "YOUR BEST nnn · 8
   PLAYING" (two short lines), the console's edge is 0 (its corners sit inside the 60 px sides), the test page's SOUNDS never moves on a
   phone (a rotate re-runs the state's edge on the next state change). Measured fine at every size.
10. **LOW (docs)** — the file map still listed the deleted lab files → marked DELETED.
Also found while shooting /admin by hand: the first Held-runs card wiped its own header (its list shared the card's id) — and the
**Second accounts** card has had the same slip (its title + Refresh vanished after loading) → one id each.

## THE FINAL RUN
(filled at the close)

## THE CALLS MADE (obvious / established — overrule any)
- THE TOP LINE: TWO lines (split at the last ' · ') when it can't fit between the corners — never a smaller font; on the test page it
  centres in the space right of ☰ + SOUNDS (in the console the corners sit inside its 60 px sides, so it stays centred on the screen).
- THE RAIL's gap 17 px (a 14.4 px name box + air); the eased names kept apart in the frame (the targets already were).
- THE SPIKE RULE: after its NO HELP the WHOLE tier rule rests for the page (the timing rule + its cap probe too) — "never steps again".
- `live: '2026-11-28'` as you wrote it: NEW on top from the 4 am line of Nov 28 for 14 days. Before 4 am (if the deploy lands earlier)
  FREEFALL sits last on the shelf — today's served order was made before it existed; tomorrow's includes it.
- THE WEEKLY GOAL: pinned by a week key (`GOAL_FROM`) rather than a date — the server's step and the phone's card read ONE helper.
- THE CARDS: out of THE LAB and shipped as they are (all six APPROVED by you on Nov 26) — HIGH RISE's pattern; their lab text removed.
- THE HELD LIST: a new top-level `ffheld/` (server-only, DURABLE) rather than a field on results/ — RELEASE writes the BEST, this week's
  best, THE AVERAGE (+ its counted play) for a SOLO run, and the cards — never XP, the streak or a MATCH WIN (the podium's win is not
  re-dealt after the fact). Each tap audited; two taps (THE CONFIRM button — the site's pattern).
- A HELD first place in a MATCH: nobody is given the win (FIX C's rule, kept) — the podium still shows the replay's order.
- /admin's Second accounts card lost its header + Refresh after loading (its list shared the card's id — the same slip my first Held-runs
  card made): fixed with it (one id each).
- THE MATCH podium scrolling under the shared XP box once counted: left to THE CITY PASS ("THE XP LINE AS THE FOOTER", your Nov 27 entry —
  the shared frame); the E2E checks FREEFALL's own part (the body + THIS MATCH above the bar).

## OPEN FOR BEN
1. **RE-PUBLISH: NO** — no rules change (FIX C's file, already published, is enough; `ffheld/` needs no client rule).
2. **YOUR CHECKS ON THE iPHONE (after the deploy):** https://neonspeakeasy.com — PLAY → FREEFALL (NEW on top from 4 am New York; a teal
   icon) → its card → PLAY NOW: a counted solo run (YOUR BEST + AVG on the end screen; the AVG from your 5th run) · a room: PICK A GAME
   lists FREEFALL for any host; REMATCH works on a guest-turned-host's phone · https://neonspeakeasy.com/board → the FREEFALL tab (the
   eighth — swipe the tab row) · ☰ → HOW TO PLAY → the FREEFALL tab · ☰ → CREDITS → the FREEFALL group · https://neonspeakeasy.com/admin
   → **Held runs** (empty until THE HOLD keeps a run off; each row: RELEASE · REJECT — both ask a second tap) · the city: NO FREEFALL sign
   yet (THE SIGN HOLD — the city chat's pass).
3. **A HELD WINNER in a match:** a run too perfect for a human that places FIRST takes the win from nobody — nobody wins that match (FIX
   C's rule, unchanged here). RELEASE later gives the board, the average and the cards, NOT the win. Say if a released match run should
   also get its win back (the wins board + the XP difference — a bigger change).
4. **THE XP BOX on a counted MATCH podium** pushes FREEFALL's (taller, logo-headed) end screen into a ~25–55 px scroll at 390 × 844 —
   your Nov 27 entry "THE XP LINE AS THE FOOTER" (the city pass, the shared frame) fixes it for every game; nothing per-game was added.
5. Noticed, not built (not this pass's game): on the PLAY shelf JAYWALK's + HIGH RISE's icon accent falls back to #d6f0ff (`title.js`
   `ACC` has no row for either — FREEFALL's is in now).
