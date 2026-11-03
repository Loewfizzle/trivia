# PROGRESSION A — THE ENGINE (Nov 2 2026)

Levels 1–100, THE STREAK + the daily contract, THE UNLOCK SYSTEM + THE 30 ACHIEVEMENTS + THE FOUNDER switch, THE SCREENS (the end-of-round
moment, the level-up, the streak card, the Gilded card + profile, the dock's flame) + their 9 sounds — and, as its last work group, the owner's
CITY CONTROLS B review (THE PIPELINE's first ADD-ON). The whole system: **docs/progression.md**. The decisions: decisions.md §15
(PROGRESSION 2.0), plan.md "OWNER'S NOTES — NOV 2 (evening)" + "OWNER's REVIEW OF CITY CONTROLS B — Nov 2, 6:14 pm EST".

## What changed
- **Step 0:** plan.md part 52 (the sighting cards' bar, the slim strips' FLARE BY TIER, THE PIPELINE, the dock flame, the end-of-round after the
  podium, the A / B split) + decisions.md.
- **Group 0 — THE DUSK FLAKE:** the harbor `load` group's LOAD WEATHER loads run on a page clock pinned to 1 pm Eastern (the page's Date +
  `/api/time` shifted together; `&when=` would have turned the live weather off). At dusk the 1.2-s answer case failed too — all pinned.
- **Group 1 — LEVELS 1–100:** `core/levels.js` (the curve fitted to the old thresholds; OWNER 45,000), THE YEAR SIM on the server's own step
  (`core/progress.js#matchStep`, moved out of `api/_lib/stats.js`), the streak's XP bonus dropped, `core/items.js` + THE LEVEL REWARDS (31) +
  THE CARRY-OVER, `style` wears only what you own, `pct` = X%, LEVEL + BAND on every screen that showed a rank.
- **Group 2 — THE STREAK + THE DAILY CONTRACT:** `core/streak.js` (the 4 am day, freezes, WIN IT BACK, the outage, the milestones), the
  /admin OUTAGE button, `core/daily.js` + `POST /api/daily` (a secret seed, one official try, the server's score, the percentile + bands from 50,
  YOUR TABLE's TODAY, the streak) proven with a TEST-ONLY fake daily.
- **Group 3 — THE AWARD ENGINE + THE 30 + FOUNDER:** `core/achievements.js` (the checks, the counters, `awardAll`), wired: matches, wins, hosting,
  8 players, last places, party nights, 2–4 am, holidays, the same friend, THE KNOCK, THE WATCHER (the server's hour), the REAL weather (the
  server's own sky by IP, after a counted match), the games' flags (match-report's `f`: PRISM DROP's quad, OVERCLOCK's exact + comeback);
  sightings / dailies / the birthday dormant + fake-triggered; THE FOUNDER WINDOW on THE LEDGER (closing sweeps).
- **Group 4 — THE SCREENS + THE SOUNDS:** `js/progress/*` + `css/progress.css` (lazy), the moment after the podium (it replaced the RANK UP),
  the streak card, the Gilded card + profile (the old holographic card + its VAULT folded in), the dock flame (full dpr), `?preview=` links,
  Grok's 9 sounds (`scripts/build-progression-sfx.py`) + CREDITS. Looks: 390 / 402 / 430, WebKit 402×874 @3, 1440×900 — three refine passes on
  the moment (fit with the real font; CONTINUE sticky; the WebKit coin) + the card (the grid-row collapse; the foil per card).
- **THE ADD-ON (the owner's CC-B review):** (1) the radio's papers never jump to the top (in-place repaints, nothing under a finger); (2) the
  intercom's mic (iOS's audio session → play-and-record inside the hold; honest messages); (3) the willows a fast rolling curtain (PART 10's
  timing); (4) SAVE AS A ONE-TAP JACK (a small sheet; the new jack scrolled to + flashed once).

## Decisions (what a feasibility check / the code made me choose)
- **OWNER at 45,000 XP + "regular play" = every other night:** real match XP is ~240 a night of 3 matches (the old streak bonus gone) and the
  old thresholds fix LEGEND at 25,000 — every-night play would reach LEGEND in ~3.5 months. At every other night the bands land where the owner
  set them (REGULAR night one · INSIDER ~2 weeks · MADE ~2 months · LEGEND ~7 months · OWNER ~a year). 45,000 is the lowest OWNER where no
  level costs less than the one before.
- **The streak's +10 %/night XP is gone** (the owner kept "no XP bonus — milestones only"); the weekly goal's +200 stays (not a streak bonus).
- **NIGHT OWL, PARTY ANIMAL, the 4 am day, the holidays use EASTERN time** (the server's clock — the owner's own).
- **RAINMAKER / SNOWED IN read the server's weather for the phone's IP area** (never the phone's word), right after a counted match.
- **THE WATCHER's hour on the server's clock** (watchStart → watch ≥ 55 min); **THE KNOCK is taken on the phone's word** — the knock is the
  city's own public secret and the emblem is cosmetic (anti-cheat never depends on the code being secret: nothing of value rides on it).
- **X% = `pcount/` counters** (one node, a minute's cache) — never a scan of profiles; free-plan cheap. One more function (`api/daily.js`, 8 of 12).
- **THE LEVEL REWARDS' 60 = SAPPHIRE & SILVER**, a 4th Gilded-family name (three family looks exist; the owner set four slots) — THE VAULT designs it.
- **Item art = placeholders** (each card the Gilded card in its palette; emblem shapes a glyph) — THE VAULT replaces the art, never the ids.
- **The end-of-round moment opens over the podium** (the podium waits for the host): CONTINUE comes back to it; REMATCH / LOBBY as today.
- **The live previews:** `?preview=moment | card | streak | flame&streak=N` (scripted data, nothing sent).
- **The willows:** 0.115 s apart (PART 10's 9 in ~0.9 s), strictly left → right; on the song only the first takes the beat.

## Known issues
- **The catalog ships in the client JS** (item + achievement names in `js/core/`): a player reading the code could see what exists — the
  screens never list it (the owner's "keep them guessing"); the repo goes private before launch.
- **The streak day + NIGHT OWL are Eastern** — a player far from Eastern gets the 4 am turn at their own odd hour.
- **The founder sweep reads all of `pstats`** (as THE LEDGER already does) — fine now; at thousands of players it wants a paged walk.
- **Headless WebKit on Windows has no AudioContext / MediaRecorder / mic:** the intercom's WebKit run used a stand-in mic + recorder
  (`C:\Users\benja\wk\wk-intercom.mjs` — the gesture, the session, the review, PLAY BACK, SEND on JUST ME); the real capture is proven in
  Chromium's fake mic. **The owner tries HOLD TO TALK on his iPhone** (Safari + the Home Screen app).
- **`&force=finale`** starts the party show at its finale: the willows land ~37 s after the load.
- **THE PROGRAM** fits a tall phone without scrolling at some hours — the scroll test runs on a short screen (402 × 560).

## THE FULL LOCAL RUN (the mini PC, alone, Nov 2 night)
Unit 1044/1044 · rules 57/57 (the file unchanged — no re-publish) · /api `server.test` 29/29 + `progression.test` 9/9 · the profile E2E 64/64
(its first run missed one check in the unchanged BNAME board section — the other rows not yet listed; green on the re-run) · smoke
(`GAMES=prism,overclock`) 6/6 · **THE FULL HARBOR SUITE 887/888** in 1,199 s → the one miss = LOAD WEATHER's "a stored JUST ME jump into a holiday
night: 0 changes after the reveal" (a TIMING check — a warning in the cloud): under the 4-shard load the neon's bake landed after the reveal
once; the `load` group alone, twice: 15/15 (Group 0 pinned its clock — the dusk part is gone; this is load timing).

## THE CLOUD
The final push was docs-only (the workflows' path filters skipped it; Vercel built from its tag) → both started by hand on main: **tests ✅**;
**harbor run 1: 9 / 10** (the `models` job green = **CC-B's fixed intercom lobby test CONFIRMED**) — the `city` job red on the `load` group's
`&intro=1` load: Group 0's pin put the page at 1 pm EASTERN, which the runner's UTC page clock read as ~6 pm (the lights' power-up) → pinned to
10 am Eastern → **run 2 (`-f job=city`): ✅**. Two runs — the cap.

## The hand-off
- **PROGRESSION B** (its questions round first): CITY SIGHTINGS (the tap → the reaction → `pgSfx('flash')` + `'polaroid'` → SPOTTED → the pair's
  reveal `'card-reveal'`; server-verified; `eventStep({k:'sighting', id})` already counts them + STARGAZER / FREQUENT FLYER / THE WITNESS; a new
  legendary = an id in `LEGENDARIES`), BIRTHDAYS (`{k:'birthday'}` → MANY HAPPY RETURNS), CALL IN A FAVOR (`pstats/fv` tokens — the 100-night
  milestone grants one), THE ARRIVAL LADDER (`streakView` has the run).
- **THE VAULT 1 / 2:** the item ids in `core/items.js` are the slots — draw each (THE CARD LAB), replace `look` / `glyph`; the profile's VAULT rows,
  the moment's swatches + the card read them. The sighting cards' bar (the real baked models) + the slim strips' flare by tier (decisions §15).
- **A daily's pass:** `registerDaily` its cartridge in `api/_lib/dailies.js`, `startDaily` / `finishDaily` on the phone; the bands, the streak +
  DAILY BREAD / THE TRIPLE / EARLY BIRD / PENTHOUSE SUITE come with it.
- **A game's rework:** its 2–3 achievements in `ACHIEVEMENTS` (`game`) + its flags in its match report's `f`.
