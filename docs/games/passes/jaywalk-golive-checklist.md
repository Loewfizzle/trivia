# JAYWALK — THE GO-LIVE CHECKLIST (written by THE GO-LIVE REVIEW, Nov 17 2026 — nothing here is done yet)

**THE GO-LIVE PASS** takes these steps, in this order, in ONE pass with ONE tagged push. It flips `playable` — nothing else about the
game changes in it (a look / rules / server change belongs to a pass of its own, before). The review that wrote this:
`docs/games/passes/jaywalk-review.md` (its verdict + what is still open). The game's bible: `docs/jaywalk.md`.

## 0. BEFORE THE PASS STARTS — what must already be true

### THE CITY CHAT has done (each in its own city pass, its log named in the go-live prompt)
1. **THE CHROMEBOOK TRIM — the boot has room.** Measured today (`node --test tests/boot-budget.test.mjs`; the list =
   `js/app.js` + `scripts/build-boot-preload.mjs#preloadList()`): **310 of 310 modules · 6,655,933 of 6,656,000 B (6,499.93 of 6,500 KB)
   — room: 0 modules, 67 bytes.** JAYWALK's go-live adds to the boot (measured off the files as they are today):

   | what joins the boot | bytes | modules |
   | --- | --- | --- |
   | `js/games/jaywalk/meta.js` (its thin meta — registry META at boot, like every playable game) | 2,092 | +1 |
   | `js/games/registry.js` — the import line + its META entry | ≈ 130 | — |
   | `js/ui/help.js` — `RULES.jaywalk` + `TAB.jaywalk` (the content of `js/games/jaywalk/help.js` from `export const RULES` on: 2,774 B; HOLD'EM's block is 1,794, PRISM's 923) | ≈ 2,800 | — |
   | `js/ui/game-art.js` — its tile (the neon SIGNAL mark is already in the boot: `core/marks.js#MARKS.jaywalk`; HOLD'EM's tile function is 436 B) | ≈ 700 | — |
   | `js/config.js` — the row loses `preview: true` | − 15 | — |
   | **the measured need** | **≈ 5,700 B** | **+1** |

   **THE BOOT MUST FREE AT LEAST 8,192 B (8 KB — the need + a 40 % margin) AND 2 MODULES (1 + one spare)** before the go-live pass
   starts — never by raising `tests/integration/boot-budget.json` (the owner, Nov 16). The go-live prompt names the trim's log + its
   own measured room; the go-live pass re-measures FIRST and stops (OPEN FOR BEN) if the room is under 6 KB / 1 module.
2. **END-SCREEN STANDARD A** (the owner's pick "A — the hero bar": a big solid PLAY AGAIN / REMATCH bar in the game's accent + quiet
   SHARE · CITY links — `docs/games/plan.md` "JAYWALK … DECIDED, H5B"; the picture: `Downloads\NEON\endscreen-standard-A.jpg`) built in
   the console's frame (`js/ui/final.js`) for every game. JAYWALK builds none of its own: its end screen (`victory.js#finalScene`)
   sits inside that frame. After the city pass: re-run `e2e-jaywalk` + `e2e-jaywalk-match` (both assert the foot's three buttons +
   their order + the 10 px corners — update those lines to the standard's) and THE FINAL SCREEN's BUDGET (`JW_FINAL_BUDGET_MB` 20).
3. **THE OPEN NOW BILLBOARD** — the owner's real-game poster (`Downloads\NEON\jaywalk-billboard-open-now.png`) installed as the
   TRI-VISION's JAYWALK face (`js/screens/harbor/jaywalk-art.js`, `core/harbor-trivision.js`): today the face says COMING SOON.
   The switch to NOW OPEN is the owner's OPEN DAY (`/admin` → the radio's `jaywalk` — `harbor-trivision.js#jaywalkShow`): set on the
   go-live day, not by the go-live pass's code.
4. **THE RESULTS PLAQUES** (the city chat's item — the podium's plaques in the console's frame) built + JAYWALK's podium re-shot on them.
5. **THE CARD-REVEAL ITEMS in the inbox** — "Nov 17 — TO THE CITY — NEXT PASS — from JAYWALK H6A" (`js/progress/moment.js`): the beat
   where the sheet shows only TOTAL, the LEVEL UP overlay's backdrop, a 4th achievement in a match + an EPIC / LEGENDARY card's own
   beat. JAYWALK is the first game whose match can earn four cards at once (SONIC BOOM · CLOSE ENCOUNTER · RIGHT OF WAY · BEAM ME UP).
6. The two older inbox entries "TO THE DAILIES / THE CITY — NEXT PASS — from JAYWALK H4B / H5A" (the SAVE-YOUR-KEY pop-up over a
   running daily; the dailies' evening red) are NOT JAYWALK's go-live blockers — named here so the go-live prompt does not lose them.

### THE OWNER has done
- Played the review's build on his phone, DAY + NIGHT, solo + a match: his EAR on THE MIX (never heard on a phone's speaker — the
  train's bell + horn, the area chime, NEW BEST, the three moments' ducks); `/admin` shows **no `killed` row on `game:jaywalk/final`**
  since H6B's build (if one shows: `docs/jaywalk.md` "THE END SCREEN's MEMORY" names the next two steps — they come BEFORE go-live).
- Answered the review's OPEN FOR BEN (`docs/games/passes/jaywalk-review.md`).
- Approved the four JAYWALK cards in THE LAB (done Nov 17 — re-check `node scripts/lab-export.mjs <live>` shows no FIX on them).

## 1. THE STEPS (the go-live pass)

1. **Re-measure the boot** (0.1 above). Read the inbox; `node scripts/lab-export.mjs <live>`.
2. **THE META JOINS THE BOOT** — `js/games/registry.js`: `import * as jaywalkMeta from './jaywalk/meta.js';` + `jaywalk: jaywalkMeta`
   in `META` (the loader row `jaywalk: () => import('./jaywalk/index.js')` is already there). `metaOf('jaywalk')` then answers before
   the cartridge loads (the shelf's row, the card's players / minutes).
3. **HOW TO PLAY** — move `RULES` + `TAB` from `js/games/jaywalk/help.js` into `js/ui/help.js` (`RULES.jaywalk = …`, `TAB.jaywalk = 'JW'`),
   in the shared help's own shape (it was written in it). Delete `js/games/jaywalk/help.js` + the cartridge's registration with the
   help hub (`globalThis.__nsHelp.jaywalk` — `index.js` / `view.js`); `ui/help.js#hub` stays for the next game being built. The text
   stays as the owner read it: one line + HOW TO MOVE · WATCH OUT, seven short lines a kid can read, one small drawing each — check
   it against the rules ONE more time (ONE LIFE; the Mothership = a finish line at 6:00 in a match, never in solo).
4. **THE TILE** — `js/ui/game-art.js`: `ART.jaywalk` (the tile on the shelf, the room's game list, THE BOARD, the profile's stats).
   Built on its neon mark THE SIGNAL (`core/marks.js#MARKS.jaywalk` — the walk signal's kid); baked if it needs more than an SVG
   frame (HOLD'EM's way: `assets/holdem/tile.webp` + `scripts/build-holdem-tile.mjs`). Phone first: it must read at 72 pt.
5. **EMPTY `JAYWALK_WAITS`** — `tests/registration.test.mjs`: `meta`, `help`, `art` removed as each lands (a stale entry fails); the
   list ends `Object.freeze({})`; the test "today: being built, with waits" is rewritten to "JAYWALK is playable, no waits".
6. **FLIP THE ONE SWITCH** — `js/config.js` GAMES row: `playable: true`, `preview` removed. Everything keyed on `g.playable` follows by
   itself: the shelf (`title-taps.js` — no more `· TEST`), the room's game list (`room-city.js`), PLAY NOW (`host.js#playSolo` /
   `startGame` — no more COMING SOON), the sign's tap (its card for everyone), `api/report.js#startable` (everyone's reports counted —
   the owner-only branch stops matching), THE BOARD's tabs + the profile's stats (`core/boards.js` has its rows since H3).
7. **THE CITY's SIGNS** — `core/harbor-neon.js#signRoster` already carries JAYWALK (the owner, Nov 15); line 924's "JAYWALK's sign row
   until its own GAMES row exists" stand-in goes if it is still used; the sign's day face + `tests/harbor.test.mjs` lines 419 / 1834
   (`GAMES.filter(g => !g.preview)` — the walks that skip a game being built) now include it: give it what they ask (its day face).
8. **THE TESTS THAT FLIP** (each named — none deleted, each rewritten to the playable truth):
   - `tests/cartridge.test.mjs`: `BUILDING = []`, JAYWALK into `PLAYABLE`.
   - `tests/registration.test.mjs`: step 5.
   - `tests/jaywalk-cartridge.test.mjs` "HIDDEN: its GAMES row is playable: false + preview" → "PLAYABLE".
   - `tests/jaywalk-solo.test.mjs` line ≈ 244 (the owner-only report branch) — the branch stays in `api/report.js` for the NEXT game
     being built; the test pins it as generic, no longer as JAYWALK's.
   - `tests/holdem-owner.test.mjs` (the loop over every GAMES row: JAYWALK is no longer a TEST).
   - `tests/play-now.test.mjs` line ≈ 106 (JAYWALK's sign: "a quiet COMING SOON" → its card).
   - `tests/preload-graph.test.mjs` (unchanged in effect: `playable || preview`) · `tests/trivision.test.mjs` (unchanged: the face's
     words follow the owner's OPEN DAY, not the code).
   - `tests/integration/e2e-jaywalk.mjs` step 1 ("a stranger's PLAY shelf has no JAYWALK and PLAY NOW refuses it") → a STRANGER plays
     it; the `testAdmins/{pid}` set-up goes (keep ONE check that the report of a stranger's run is counted). `e2e-jaywalk-match.mjs`
     lines ≈ 83–89 the same (a plain host starts it; a guest sees it). `wk-jaywalk-mem.mjs` (the WebKit memory check): the
     `testAdmins` lines go.
   - `tests/integration/e2e-smoke.mjs`: JAYWALK is in `GAMES=` since H4 as the owner's start — now a plain start, like the three.
   - the harbor suite: the `cartridge` group (JAYWALK playable), the groups that walk the signs / the shelf / THE BOARD.
9. **THE SHARE + THE OG IMAGE** — the run's card (`share.js`, 540 × 675, uploaded at prepare — `api/_lib/share-card.js`) is done and
   tested; at go-live: (a) the SITE's own link preview (`index.html` og:image / the manifest's description) names three games —
   add JAYWALK where the games are listed; (b) `shareAddress` / the card's foot unchanged (ONE FOOT); (c) one real share from a
   non-owner phone on the emulators (step 8's stranger) proves the card is made for everyone.
10. **THE ROOM LIST + THE CARD** — the game card's blurb / tag (`config.js`: "HOP THE HARBOR" · "Hop the lanes. Farthest wins."), its
    players + minutes (`meta.js`), SOLO on the card (`SOLO: true` + `SOLO_OK`), the room's game options (none — ONE LIFE, no options):
    shot at `--sizes pass`, three refine passes (a new game's screens in the city).
11. **THE CARTRIDGE REGISTRATION** — `tests/registration.test.mjs` names every place; all green with an empty waits list. The
    per-game budget (`tests/integration/game-budget.json` — jaywalk 2,450 KB: today **the review's number is in
    `jaywalk-review.md`**) is measured AGAIN after the boot grew by its meta + help + tile (the city's boot graph counts in it): if it
    is over, trim JAYWALK's eager graph (its comments first — the review cut 12 KB of them from `night.js`), never the line.
12. **THE BUILDERS** — `node scripts/build-boot-preload.mjs` (the boot's imports changed) · `node scripts/build-preload-graph.mjs` ·
    `node scripts/build-file-hashes.mjs` · `node scripts/claude-md-coverage.mjs`.
13. **THE DOCS** — `CLAUDE.md` (the header: FOUR PLAYABLE; the JAYWALK lines lose "BEING BUILT" / "owner-only until go-live"),
    `ROADMAP.md` (one line), `docs/jaywalk.md` (the header + "WHAT WAITS FOR GO-LIVE" → gone), `docs/cartridge.md` (JAYWALK went
    playable — the second game through the whole road), `docs/testing.md`, `docs/games/passes/jaywalk-golive.md` (its log).
14. **THE CHECKS** (fresh emulators, NEVER THE LIVE SITE): unit · rules · `/api` · smoke (THE PAGES LOAD) · registration · cartridge +
    the harbor `cartridge` group + the harbor groups the signs / the shelf touch · achievements · `e2e-jaywalk` · `e2e-jaywalk-match`
    (3 + 4 phones) · the lab check (+ `--perf`) · `jaywalk-mix.mjs` · **`wk-jaywalk-mem.mjs`** (WebKit: 10 solo runs + a 4-phone
    match's final under `JW_FINAL_BUDGET_MB`) · THE BOOT BUDGET (static + the harbor `load` group's real boot) · the three other
    games' own E2Es (`FAST=1` — the boot changed under them).
15. **A FRESH-EYES REVIEWER** over the full DAY + NIGHT shot set (every JAYWALK pass ends with one — CLAUDE.md), its report verbatim
    in the log.
16. **ONE tagged push** (the ci tag). The summary's first line: RE-PUBLISH only if `database.rules.json` changed (it should not).
17. **AFTER THE DEPLOY — the owner's steps** (the summary lists them): `/admin` → the radio → JAYWALK's OPEN DAY (the billboard says
    NOW OPEN from it) · a solo run + a 2-phone match on the live site from a NON-owner phone · watch `/admin`'s errors for `killed`
    rows + refused reports for a day.

## 2. WHAT THE DAILIES CHAT BUILDS AFTER (not the go-live pass)
`docs/games/plan.md` "JAYWALK (the owner, Nov 12–16 — DECIDED)": **DAILY A · DAILY B** — JAYWALK's daily on the dailies' kit
(`js/daily/`, a row in `config.js#DAILIES` + its server half in `api/_lib/dailies.js#SERVER_CARTS`): `tuning.js#MODES.daily` is built
and simulated since H1 (the wall speeds up from ≈ 3 min, THE MOTHERSHIP = the finish line at 5:00 — its text is already "MADE IT TO
THE MOTHERSHIP", never "TAKEN"); ONE seeded course a day for everyone (the daily's own secret picks the seed — THE DAILY SECRET, never
in the code), THE SERVER REPLAYS the hop log (`api/_lib/jaywalk.js#verifyNode` — the same judge as a solo run), EVERYONE ON SCORES
(`dly/{g}/{day}/t`), THE SHARE CARD (the run's card machinery is shared with it), the day line (the 4 am streak day), THE SCHEDULED
GO-LIVE (an OFF daily opens only at a 4 am turn the owner schedules). DAILY A = the rules + the server half + its sims; DAILY B =
the phone side + its look + the share + its E2E. The dailies chat reads `docs/jaywalk.md` "THE MODES" + "THE REPLAY + THE PROOF" first.

## 3. WHAT GO-LIVE DOES NOT TOUCH
The rules, the course, the replay, the proof nodes, the database rules, the look, the sounds, the moments, the cards — all as the
review left them (REPLAY = LIVE green on every seed the sims run). A change to any of those = its own pass, with the sims + both
E2Es, before the flip.
