# FR7 FIXES C — THE CLAUDE.md DIET + THE ONE DAY LINE + THANKSGIVING's MAPLE LEAVES + THE SMALL ONES (Nov 13 2026)

The owner's notes: plan.md "OWNER'S NOTES — NOV 13 (after JAYWALK CARDS + THE TRI-VISION)" (+ decisions.md). On the beelink. **No database
rules change.** Still 8 functions. Each group committed on its own; ONE deployment (the final push's top commit carries the harbor tag).

## Step 0
plan.md's notes appended unchanged + the BUILD TABLE line; decisions.md: the current line, THANKSGIVING's SIGN = THE MAPLE LEAVES + THE GOLD
WEEK (the wreath + swags + the one-day amber retired), THE CLAUDE.md DIET as a standing rule, the reset Monday, the JAYWALK poster add-on
(the owner's iPhone, 3:12 am) — `2efe4737`.

## Group 1 — THE CLAUDE.md DIET (docs only — `72745e71`)

- **CLAUDE.md 106,522 → 28,446 bytes** (the target ≤ 36 KB; the guard 40 KB). It keeps the intro, the doc table, the ground rules, ONE line per
  standing rule by area (City 2.0 · the console + the room · profiles / progression / THE BOARD · THE VAULT · the dailies · the games · deploy +
  launch + safety), working efficiently, a short file layout, the data model, short multiplayer / audio / design system, the add-a-game
  checklist, the testing short version, the Firebase notes.
- **MOVED, VERBATIM** — every per-pass paragraph into the doc that owns its area, under **"THE RULES FROM CLAUDE.md (moved Nov 13)"** (17 docs:
  harbor, overclock, prism, holdem, progression, vault, profiles, launch, testing, title, audio, data-model, cartridge, match-kit, coastclear,
  password, roadmap-history — the doc-table rows each with their doc; the full old file layout + multiplayer mechanics in data-model.md).
- **NOTHING LOST:** `node scripts/claude-md-coverage.mjs` (the old CLAUDE.md from git `48e3e157` — 900 backticked names + 690 ALL-CAPS names —
  each found in the new CLAUDE.md or a `docs/*.md`) → **0 missing**.
- **THE GUARD:** `tests/claude-md-size.test.mjs` — fails above 40 KB ("move the detail to its doc, keep one line") + every "(moved)" pointer has
  its section. CLAUDE.md's first section says the rule: a pass adds AT MOST one line per new standing rule.

## Group 2 — THE ONE DAY LINE (Grok's PROGRESSION + CALENDAR review — the detail: docs/progression.md#the-one-day-line)

Every finding checked against the code first — all nine were real, all fixed:

| finding | state | the fix | the test |
| --- | --- | --- | --- |
| M1 credited at REPORT time | FIXED | the MATCH TIME (`night.at` / the dealer's end, ≤ now) through `applyMatch(…, at)` → `matchStep({ at })`; before `progress/resetAt` → sealed `pre`, `before_reset` (both paths); the queue never drops by its own clock | unit `one-day-line` M1 ×4; `server.test` "THE ONE DAY LINE (M1)" ×2 |
| M2 the ceiling / +25 / +10 / solo cap at midnight; a capped match no streak | FIXED | all on the streak day; `day` + `pd` boxes; `ceilingStep` marks the streak | unit M2 ×3 |
| M3 the 4 am line drifts with DST | FIXED | `week.js#turnAt` / `turnDay` (4:00 wall clock); `msToTurn(instant)` | unit M3 ×4 (TZ unset, UTC, Los Angeles) |
| M4 a 2nd match inside 45 s sealed done | FIXED | `too_soon` / `busy` → `results st: 'retry'` + 425 `retryAfter`; the queue resends (≤ 8) | `server.test` "offline retries…" (the forged-quick match now counts on the resend); unit M4 |
| S1 the week at Monday 00:00 | FIXED | `weekKey` / `weekEndsAt` on the 4 am day (Monday 4 am); an older week's match → `xw.p`, never resets this week | unit S1 ×2 + `board-xp` / `profiles` week tests moved to 4 am |
| S2 PENTHOUSE closes before a late honest run | FIXED | `daily-close.js#recloseDay` (union — only adds) | `daily-module` "FR7 FIXES C — S2" |
| S3 WIN IT BACK → a second FAVOR | FIXED | milestones only above the lost run | unit S3 |
| S4 a pre-reset daily paid; the back-fill could take a counted play away | FIXED | a start before the epoch not paid (`pre: true`, out of the count); `cp` = max(live, rebuilt) | `daily-module` "FR7 FIXES C — S4" |
| S5 0 freezes shown after the reset | FIXED | `streakView` reads `st.f` | unit S5 |

THE RESET MORNING (Grok's order) → `docs/launch.md` §1 (a MONDAY a few minutes after 4 am ET); the back-fill line re-checked (true after S4).
No rules change (the new fields — `pd`, `xw.p`, `results/{key}.st: 'retry' / pre` — are server-written under the root deny).

## Group 3 — THANKSGIVING's SIGN: THE MAPLE LEAVES + THE GOLD WEEK (the wreath + the swags RETIRED)

The detail: docs/harbor.md "THANKSGIVING's SIGN — THE MAPLE LEAVES + THE GOLD WEEK".
- **The art:** `art/thanksgiving-sign/src/` (copies of Downloads\grok\thanksgiving-sign) → `scripts/build-thanksgiving-leaves.mjs` → ONE atlas
  `assets/city/thanksgiving/leaves.webp` (680×510, 86 KB) + `leaves.json`. The source matte turned out HARD (no partial-alpha edge pixels — Grok's
  "bold matte"), its outermost ring a dark OLIVE: the key (alpha from greenness) + the un-mix + `g ≤ r`, then the rim's three rings RE-COLOURED
  from the leaf's own colour inside (ring 1 at a low alpha) — the olive outline gone, the thin stems kept. QA at 4× on dark AND light
  (`fr7-fixes-c/leaves-qa-{dark,light}-4x.png`): 0 green-cast pixels; looked at, leaf by leaf. (A first try ERODED ring 1 — it cut leaf 1's stem; undone.)
- **The bank:** `screens/harbor/leafbank.js` (the old `dress-thanksgiving.js` deleted; `signdress.js` lost its `thanks` piece). ONE seeded layout,
  92 leaves, ~24–42 pt at 390, centre-out order; baked once per look + stage; behind the tubes (`.nd-leafbank` z −1 in the wrap — the harbor
  `thanks` group checks it). Its timetable row `thanksgiving.leaves` { from −11, full −4, gold −3, turnH 4, fadeS 2 }; THE DAY CHART rows; the golden
  table + that one key.
- **THE GOLD WEEK:** Mon Nov 23 4 am → Fri Nov 27 4 am (`thanksLeaves().gold` → `titleHoliday().full`): the gold neon by night, GOLD GLASS by day
  (new: `.nd-sign.sg-thanksgiving.is-day` — the day's tubes were clear glass first). The one-day amber retired.
- **The forces:** every holiday sign force shows the FULL look in or out of season (`&force=sign-thanks` was the reported bug: no leaves before
  Nov 15); the panel rows' hints say so.
- **THE NEON STAYS READABLE — measured** (WCAG luminance, the tube cores vs the 90th / 50th percentile of what sits ~5–14 pt outside them; 390 / 402 /
  430): NIGHT with the full bank + the halo **3.4 : 1** median (a plain night, no leaves, Nov 14: 3.5–4.4 : 1); DAY gold glass over the bank 3.4 : 1
  median / 1.7 : 1 against the brightest 10 % (a plain day's clear glass over sky: 4.4–5.5 / 1.7–2.1) — the day halo raised 0.22 → 0.4 for that.
- **The look reviews** (the shots: `docs/harbor/passes/fr7-fixes-c/` — git-ignored): review1 = the calendar at 390 / 402 / 430 / 1440 (Nov 15 · 18 · 22,
  Nov 24 night + day, the homecoming party Nov 25 9 pm, Thanksgiving night Nov 26 7:30 pm — `review1/sheet-390.png`, `sheet-1440.png`); refine 1:
  the night bank too bright under the tubes (the O + E lost their edge over yellow) → the far leaves darker + the halo 0.5 → 0.72; the day tubes
  clear glass → GOLD glass; refine 2: the bank's top edge a straight band → a waving rim + fewer, attached stragglers; the leaves 28–48 pt → 24–42 pt;
  one lone floater off the right end → an edge leaf must touch the bank (review3–5). **The cast** (`cast/` — Nov 18 3:59:51, every painted frame for
  7 s): the day's new leaves fade in over ~2.7 s (the largest single-frame change 16 % of the whole) — no pop.
- **Proof:** unit (`harbor-holiday` — the stages Nov 14 → 27, gold from Mon 4 am, two more years; the golden table); the harbor `thanks` group 14/14
  (Nov 20 leaves ¾ behind the tubes, Nov 24 full + gold, the force on Nov 1 + IN season Nov 16) + `holiday` + `panelrows` (81/81 together).

## Group 4 — THE SMALL ONES (+ the owner's JAYWALK add-on)

1. **THE LEDGER: NOW PLAYING** — one line under the NIXIE row: `NOW PLAYING · <source> · <file> · m:ss left` / `MUSIC OFF` (`js/audio/now-playing.js` —
   the room's lobby song, else the station / the party deck on the server clock, else the plain player; `music.js#musicFileOf` the one new export).
   From the engine's own state — no poll, no /api; refreshed once a second only while the LEDGER face is on the page (its timer ends itself when
   the face leaves). Seen in the harbor `radio` group: "NOW PLAYING · STATION · EVENING · c2-evening7.mp3 · 0:35 left".
2. **THE SWITCHES THAT HANG OFF THEIR PANEL** — the cause: THE CREW INTERCOM's lever sits in a flex row with a long label; the row SHRANK the lever (112 →
   74 pt at 390) while its knob's travel stayed 62 pt — the knob ended at 390 pt, the card's padding at 361. Fix (`css/radio.css`): the lever never
   shrinks (`flex: 0 0 auto`, 112 pt), the label wraps, the row centres. Every switch checked: the radio's levers are `.rd-lever` (THE LEDGER's crew
   intercom + A ROOM JUST OPENED; the DESK's mic card when it shows) — /admin has NO pill switches (its ON / OFF are buttons). **THE GUARD**: the harbor
   `radio` group's SWITCH FIT — at 390, all three faces, every lever OFF and ON: the knob inside its lever, the lever inside its panel's padding, 44 pt
   tall. **Proved**: with the fix taken out it FAILS on exactly the owner's case (`{"face":"LEDGER","id":"Crew intercom","on":true,"lever":[285,359],
   "knob":[354,390],"panel":[30,361]}`); with it, 52 / 52.
3. **THE STALE COUNT** — nothing stale left in the link previews: index.html's description / og / twitter text + manifest.webmanifest already read
   "Neon multiplayer party games for 2–8 players. One phone each …" (FR7 FIXES B fixed the pages' text); board.html + 404.html name no count; the
   in-app counts are computed from GAMES. Changed: one stale code comment (title.js — "12 PARTY GAMES"). og.jpg's GRIDLOCK sign left (the owner
   remakes it).
4. **THE JAYWALK POSTER READABLE** (the owner's ADD-ON, his iPhone Nov 13 3:12 am). Before (390, measured from the old layout): JAYWALK 5.5 pt vs HOLD'EM
   10.3, COMING SOON 3.3 vs NOW OPEN 5.9, squeezed into the art's left half. Now (`jaywalk-art.js` rebuilt): the face in HOLD'EM's own poster box —
   JAYWALK across ~92 % (cap 0.235 H = HOLD'EM's), white-hot pink, a heavy dark outline + drop; COMING SOON on a SOLID hot-pink band (0.145 H ≥ NOW OPEN's
   0.135 H); the art re-cropped tight on the kid (right of centre, between the word + the band) + the headlights, lifted (gamma 0.72, contrast 1.12,
   saturation 1.28) → `billboard.webp` 848 × 448, 40.5 KB. **The live board's caps (pt)**: 390 — JAYWALK 10.5 ≥ 10.3, the band 6.3 ≥ 5.9; 402 — 10.8 ≥ 10.6,
   6.5 ≥ 6.1; 430 — 11.6 ≥ 11.3, 7.0 ≥ 6.5. Proof: `tests/trivision.test.mjs` (four board sizes, both bars) + the harbor `trivision` group (12 / 12 with
   `billboard`). Shots: `fr7-fixes-c/jw-before2/` → `jw-after2/side-by-side.png` (night + day × 390 / 402 / 430), `jw-after2/turn-sheet.png` (a burst
   through the turns), `jw-after2/cast/` (the full-screen cast). Nothing else on the board changed (`holdem-art.js` only gained the pure `holdemCaps`).

## The close — local runs (the beelink, my own servers: fresh emulators + `serve.mjs --emu` on :5173 + a `DAILY_TEST=1` one on :5176)

| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` | 1757 / 1757 (+ `one-day-line` 17, the size guard, the poster + harvest tests) |
| rules `rules.test.mjs` | 82 / 82 (no rules change) |
| `/api` `server.test.mjs` | 53 / 53 (+ M1 match time, the pre-reset refusal on both paths, M4 425 + the resend; `progress` now wiped at the suite's start; the reset tests press RESET on the test's clock) |
| the dealer `holdem-server.test.mjs` (alone) | 21 / 21 |
| `daily-module.test.mjs` | 20 / 20 (+ S2, S4) |
| `e2e-profiles` | 144 / 144 (+ the 5.5 h queue item SENT, the 425 resend) — a first run with `SHOTS=0` died on a passkey sheet click's timing (64 / 64 before it); with shots it ran whole |
| `e2e-daily` (`DAILY_TEST=1` server) | 53 / 53 |
| smoke | 8 / 8 |
| CONN | 21 / 21 |
| **FULL `e2e-harbor`** (4 shards, ~34 min, nothing else busy) | **1295 / 1297** — the two reds both timing checks: SIGHTINGS' capture hitch (green alone: compose 7.1 ms, median 16.8 ms) + THE ROOM's OWN COST at 4× CPU (alone: red 41 → 45.2 standing, red 42.9 → 46.3, then GREEN 36.2 → 35.6 — the base swings 36 → 43 ms run to run on this machine; its date is Oct 21, nothing of this pass in its frame; the last pass measured 36.4). The long night's MB floor a warning as before. |

The cloud: the harbor tag on the final push's top commit (one deployment) — its result in the summary.
All my servers stopped at the end (the emulators, `serve.mjs` :5173 + :5176); the owner's :5190 preview left running.
