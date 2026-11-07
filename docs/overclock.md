# OVERCLOCK — the game's doc (the OVERDRIVE rebuild)

The approved design plan from the Overclock chat (copied in at OC1's Step 0, Nov 5 2026 — `Downloads/neon/overclock/OVERCLOCK-PLAN.md`).
Each pass appends its decisions + its pass log at the bottom (## Pass log). Code: `js/games/overclock/` (meta.js = the thin meta,
index.js = the cartridge, logic.js + director.js = the pure rules, challenges.js = the deterministic generators, view.js + ui/*.js =
the screens, reveals.js = the panels after a challenge); the shared pieces in `js/games/kit/` (docs/cartridge.md). The rebuild runs in
7 passes: OC1 foundation + kit · OC2 results flow · OC3 challenges A · OC4 challenges B · OC5 Dumb Luck + solo + daily plug-in ·
OC6 content A · OC7 content B.

## THE PLAN — Premium Redesign (decisions so far)

Status: planning only — nothing is being built yet. Builds on the mini PC ("beelink") in Claude Code. All design questions settled Nov 1; next step = the pass plan when Ben asks.

## HOUSE RULES (city chat, Nov 3) — Downloads\neon\overclock\OVERCLOCK-HOUSE-RULES.md
Read that file before writing EVERY Overclock prompt. What it changes / adds for this plan:
- ORDER: VAULT 2C → LOBBY 2.0 → the OVERCLOCK passes → WORDLE-type → COAST CLEAR → THE DAILY MODULE → BOARD 2.0. The first Overclock pass starts only AFTER LOBBY 2.0 is done. ONE pass at a time on the beelink (never alongside a city pass). Ben sends each Overclock pass's summary to the city chat.
- Every prompt: Opus 5.5 high, /clear first, one session, groups in order, no helper agents, each group committed + pushed untagged; ONE final tagged push (ci tag; harbor tag if City 2.0 files changed); full local test run first; Ben's review add-ons done as the LAST group; ends with the push-notification line.
- READ FIRST in every prompt: CLAUDE.md, docs/match-kit.md, docs/data-model.md, docs/testing.md, docs/vault.md + docs/progression.md, LOBBY 2.0's pass log (docs/harbor/passes/lobby-2*.md — how a game plugs into the new lobby).
- STEP 0 (pass 1): this plan file goes into the repo as docs/overclock.md + a ROADMAP.md line; later passes append their new decisions to docs/overclock.md.
- OVERCLOCK = a LOBBY 2.0 "cartridge" (no hard-wiring). WHILE A MATCH IS ON SCREEN THE CITY IS PAUSED (stops drawing, frees its canvases) and comes back after — checked with the memory guard every pass.
- RULES FIRST for new features (DUMB LUCK, SOLO, DAILY MODE, the no-repeat deal): pure logic + director + whole-match simulation tests before any pixel.
- 60 FPS: animate ONLY transform + opacity — NO animated shadows/filters on many elements. → All glows/pulses in this plan (pulsing horse, breathing lanes, tile glows, white-hot timer) are built as pre-rendered glow layers whose OPACITY/scale animates, or drawn on Canvas 2D. Canvas 2D (+ WebGL shader if needed), no three.js. Reduced motion respected.
- STABILITY: everything renders from database state; timers on serverNow(); host holds no private state; THE SEAL keeps answers (and the Dumb Luck result) secret until the round closes.
- CSS: Overclock's own class prefix only.
- LOOK REVIEW: every new screen screenshot-reviewed at 390×844 + 412×915 (+ 1440×900), THREE refine passes, via tests/integration/shots.mjs + a no-Firebase preview page.
- PROFILES ARE POLISH: the game must fully work with /api down. (No-repeat memory no longer touches profiles at all — see "No repeats" below.) Clients never write scores/XP — the server checks + replays every result (incl. SOLO).
- LOADING + SIZE: everything Overclock needs (code, stylesheet, question pools, sounds) loads ONLY when Overclock is played. → The big pools are split per challenge and fetched lazily; watch repo size (~400 MB of ~1 GB) + Vercel bandwidth; say any big new asset in the summary.
- SOUNDS: short, quiet, compressed mp3/m4a (no wav shipped); game works silently. Music ≤ 4 MB a song (reusing the evening tracks = no new music).
- NEW CONTENT BRINGS NEW CARDS: the rebuild (+ DUMB LUCK, SOLO, the DAILY) adds new collectible player cards / emblems / name glows where they fit, at THE LAB's bar → server catalog + THE LAB for Ben's APPROVE / FIX / CUT; only approved art ships. Existing Overclock achievements (DEAD ON, OVERCLOCKED) keep working. Results feed the existing XP / levels / streak via /api only. (Which cards — FINAL below: REDLINE + PHOTO FINISH built, the HORSESHOE emblem in OC5.)
- DAILY MODE SHIPS OFF: only the clean plug-in ("today's date in → today's six + questions, one try, resume after a lock"). Overclock never builds its own daily screen, rankings or streak hooks — THE DAILY MODULE (city chat) does.
- Summary for Ben: short + plain, decisions, cloud run GREEN or exactly why not, known issues, rules re-publish reminder if database.rules.json changed, FULL tappable https://neonspeakeasy.com/… links with taps in bold.

## THE BAR (Ben, Nov 1 — applies to everything below)
"Premium neon, premium everything." Mockups are only the floor. Every screen, logo, sign, horse, tile and effect is built to a high standard — crafted neon (real tube glass, uneven light, glow, highlights), never text-with-a-glow or placeholder art.

## Desktop (Nov 1)
- Desktop layout comes from the shared game rules (match kit) — no separate desktop design. Ben tests on the phone ONLY.
- On a computer OVERCLOCK stays a centred column at about phone width; the OVERDRIVE background fills the rest. Nothing stretched across a wide screen.
- Every pass: Claude Code checks it itself at 1440×900, fixes anything off, and includes a screenshot in its summary.

## Goals
1. Premium visuals for all challenges (same gameplay), judged on iPhone upright, unzoomed.
2. A massive question supply + a ROOM NIGHT MEMORY so a group never sees the same question twice in one game night.
3. Solo play (Nov 1).
4. One NEW challenge: DUMB LUCK (Nov 1).

## Lineup + match length — decided (Nov 1)
- DEFAULT MODE = QUICK (6 challenges, ~3–4 min). Standard (12) and Marathon (24) stay as options for big nights.
- Challenge clock: each challenge has a 30 s MAX (CHALLENGE_MS) and ends early once everyone has finished.
- CUT: LEXICON only (slowest, wordiest; Unscramble covers letter play).
- KEEP: PATTERN LOCK (Ben: different from Quick Math, "refreshing"). Give it a crystal-clear ~3 s rules demo and make the first sequence in a match an easy one. Uses the custom number pad.
- ADD: DUMB LUCK (see below). → 19 challenge types (18 kept + Dumb Luck).
- CUT: MAKE 24 (the owner, Nov 5 after OC1: "I don't like that challenge") — cut cleanly in OC2 (Marathon = the 18 once + 6 repeats).
  - Lexicon removal must be clean: TYPES, CATEGORY, INFO, partsFor, generator, ui file, reveal, data/oc/lexicon.json, tests, docs/content.md, and Marathon's "every type once + repeats" multiset.
- The ROOM NIGHT MEMORY also covers challenge TYPES: on a rematch the deal favours types this room hasn't played yet tonight, so back-to-back matches feel different.
- No kids/family changes and no difficulty tagging for kids (Ben: "don't change anything for them").

## Rules kept as they are (Ben, Nov 1)
- HIGHER OR LOWER: strict — one wrong answer ends your run (the streak is the point).
- SIGNAL LOCK: tapping too early counts as a miss — keep.
- MEMORY SEQUENCE: one wrong tap ends your turn, points kept for every step before the slip (current behaviour) — no change.
- QUICK COUNT timing UNCHANGED (Ben's favourite — "hard but fun"): flash 1.8 s early → 1.2 s late (1800 − level×600 ms), grid 4×4 → 5×5, 4 number options, off-by-one = half. BUILD RULE: the new glow/animation must NOT eat into the look time — shapes appear INSTANTLY at full brightness and the flash clock starts only once they're fully visible.

## Custom keypads — decided (Ben, Nov 1: "looks great")
- No iPhone system keyboard anywhere in OVERCLOCK. Built-in kit keypads instead:
  - NUMBER PAD (Quick Math, Closest Call, Pattern Lock): 3×4 glass keys ~54–58 pt tall (1–9, ⌫, 0, and "." or "−" as the challenge needs), big orange LOCK IT IN / ENTER; answer display = slanted orange-edged field with cursor.
  - LETTER KEYBOARD (Missing Link): QWERTY glass keys, ⌫ + orange GO. (Unscramble keeps its letter tiles.)
- Why: the question stays visible (system keyboard covers half the screen), no autocorrect / suggestion bar, no layout jumps, matches the look.
- (Chat keyboard problem → city chat; NOT a custom keyboard there — proper keyboard handling + quick-reply chips. Note handed to Ben Nov 1.)

## QUICK COUNT look — decided (Ben, Nov 1)
- Each shape is its own neon tube in its own colour: triangle PINK, circle CYAN, square YELLOW, diamond GREEN (shapes stay clearly different → colour-blind safe). A blue bar drains during the flash.
- Question: "HOW MANY [glowing shape] ?" with the shape big as a neon tube, four big slanted number tiles below; "OFF BY ONE STILL EARNS HALF".

## DUMB LUCK — new challenge (Ben's idea, Nov 1) — PICKS WITH ODDS — LOCKED ("keep everything as is")
- Inspired by the old-Vegas arcade horse-race machines: a pure game of chance, a nail-biter, everyone screaming at their phone. "This is a party game."
- NOT in solo and NOT in the daily — it never appears in a solo match or the daily OVERCLOCK.
- Premium: the "DUMB LUCK" title is a real crafted NEON SIGN (not styled text); horses, odds board and finish all at the full premium bar.
- Flow (v2 mocked Nov 1, Ben: "looks good"): ODDS BOARD (pick, ~7 s) → CLASSIC TRACK (race, ~16 s) → THE FINISH (photo-finish freeze, LONG SHOT! blast in the winning horse's colour, payouts, ~4 s). ≈ 27 s total, fits one challenge slot (it can't end early — everyone watches). Bird's-eye oval rejected.
- HAND-OFF: Dumb Luck owns ONLY pick → race → finish. THE FINISH is its "answer reveal". Then OVERCLOCK's shared flow takes over: ROUND WINNER banner becomes "WINNING TICKETS: YOU · LEO" (several can win together) — or "THE HOUSE WINS" if nobody backed the winner (nobody scores) — then OVERALL standings with ▲/▼; after a long shot the big rank jump animates a little slower/bigger. All scores/ranks come from the shared OVERCLOCK system. XP / levels / streak happen once at match end via the existing Progression system (/api).
- A FIXED FIELD OF 6 HORSES every race (any player count), each with its colour name + odds shown big (e.g. 2-1, 3-1, 4-1, 5-1, 8-1, 12-1) and "PAYS n×". ANY NUMBER of players can pick the same horse. Names ride as a tag in that horse's lane ("MAYA +1").
- HONEST ODDS: each horse really wins with the probability its odds show, and payouts are set so every pick has the same expected value — favourite vs long shot is only a risk choice, never exploitable.
- PAYOUTS (Ben: a long-shot win should be HUGE): roughly, in units of one normal challenge — 2-1 ≈ 0.5 · 3-1 ≈ 0.8 · 4-1 ≈ 1 · 5-1 ≈ 1.2 · 8-1 ≈ 1.8 · 12-1 ≈ 2.5. Payouts SCALE TO MATCH LENGTH.
- Placement: at most once per match, NEVER the last challenge.
- Long-shot win (8-1 / 12-1) = its own celebration in the winning horse's colour.
- HORSE COLOURS — RULE: every horse keeps the SAME colour on EVERY phone so a room can yell colours. Picking never turns a horse orange. The six: PINK, GREEN, CYAN, YELLOW, PURPLE, ICE WHITE — NO orange horse.
- YOUR horse: PULSES (brighter, breathing glow), soft pulsing lane wash in its own colour, white ring on its lane number; your odds-board card fills with its colour; CHEER button + finish payout row in its colour. Small white "YOU" tag ON TRIAL.
- NO marquee lights / bulbs. Normal OVERCLOCK header.
- Look: neon-tube running horses on a night track, horizontal lanes (~58–62 pt per lane, horses ~60 pt long), checkered neon finish line. Source: trace Eadweard Muybridge's 1878 "Horse in Motion" (public domain) into neon-tube gallop frames.
- Race is scripted for drama: result drawn FIRST by the host AFTER picks lock (seal-protected), then animated with lead changes, the leader fading, a charge from the back, occasional photo finish.
- OPTIONAL: CHEER button to mash — no effect on the result, sparks above your horse's lane that everyone sees.

## ODD ONE OUT — more variety (Nov 1)
- Today only 23 look-alike pairs. Build 4 FAMILIES; each of the 3 grids in a match pulls from a different family:
  1. Letters / numbers — grow to ~60 fair pairs, monospace "coding" font so pairs are subtle but fair.
  2. Rotation — one arrow / chevron / key shape turned 20–45°.
  3. Mirror — one flipped shape.
  4. Neon shapes — crafted tube icons in the kit's style (gap in a different spot, star missing a point, die showing 5 among 6s).
- NO "slightly different colour" family (colour-blind players).
- Phone check: at 6×6 cells are ~50 pt — differences must be a thick stroke or a clear angle.
- Look (mocked Nov 1): glass cells, three slanted pips for the 3 grids, found cell blazes white-hot and pops while the rest dim; wrong tap cracks red.

## Solo + the DAILY — decided (Nov 1, daily confirmed Nov 3)
- Build SOLO into this redesign: the same match flow with one player, against your own bests (score, best streak, fastest times). No Dumb Luck in solo. Results go through /api (server-checked) like any match.
- Solo uses the same big pools; a solo session gets the same room night memory (its own one-player room).
- THE DAILIES (city chat, Nov 3): the site's 3 daily solo puzzles are a Wordle-type, COAST CLEAR (Minesweeper-type) and the SMALLEST OVERCLOCK game = a QUICK 6-challenge solo run. NO PRISM DROP daily.
- OVERCLOCK builds only its DAILY MODE plug-in, SWITCHED OFF (see house rules). Its rules:
  - INPUT = THE SERVER-PICKED, SEALED DAY SET (confirmed Nov 5 with the dailies chat): the DAILY MODULE picks the day's six challenges + exact item IDs server-side once per day (seed + a SERVER SECRET — NEVER computable from the date, the repo is public), stores it, and passes it in. Overclock's daily start() is fully deterministic from that day set: no Math.random, no live Trivia API (own bank only), never Dumb Luck. Answers stay sealed; the server checks/replays the run.
  - SAME six challenges + SAME content for everyone that day, so friends can compare.
  - OUTPUT = ONE COMPARABLE SCORE PER RUN: the normal Overclock score for the six (points incl. speed bonus, exactly as the server replays it) + a tie-break (total answer time, lower wins). Reported through /api; the daily module reads it for the daily screen's ticket row, YOUR TABLE rank and percentiles. Overclock builds no daily screen, rankings or streak hooks.
  - The day's six must be a good spread (no two from the same brain category) and include at least one knowledge challenge.
  - Daily items come from the big pools via the server-picked day set and need NO memory. If simple, a room that played today's daily keeps those items in its night memory; otherwise ignore it.
  - One attempt per day; a refresh / app switch mid-run resumes, never restarts.
- THE DAILY MODULE (later — after Wordle-type + Coast Clear) picks + seals the day set, passes it in, unlocks it, feeds the streak, owns daily results + percentiles, and switches all three dailies on together.

## Look — decided
- NIGHT look only for now (exception to the DAY+NIGHT rule); built so a DAY skin can be added later.
- Palette: OVERDRIVE — molten orange #FF6A1A (YOUR actions) + electric blue #2E8BFF (letter badges, other players) on deep carbon. Exceptions: DUMB LUCK horses, QUICK COUNT shapes.
- Style: "arcade loud" but premium.
  - Fonts: Barlow Condensed Black Italic (titles / numbers / score), Chakra Petch (answers). SPELLCHECK spellings use the plain UPRIGHT font (no slant) so letters are easy to compare.
  - TEXT WEIGHT RULE: no thin / small / grey body text. Questions bold white (Chakra Petch 700, ~19–25 pt). Grey only for tiny labels.
  - Answer tiles: style C — slanted solid graphite glass tiles (≥56 pt), blue letter badges, tapped tile turns hot orange.
  - Press sinks + flashes. Tachometer timer bar (last 3 s white-hot). Correct: burst + sparks + rolling score + combo meter. Wrong: crack + shake + red edge flash (visual + sound only; no vibration on iPhone web).
  - Between challenges: slanted title card slam + 3-2-1 stamps.
  - Right/wrong feedback keeps its own colours; NO tinted "pill" panels.
  - Rank arrows: ▲ blue, ▼ dim steel grey.
  - NO stock icons / clip-art.
- ONE shared OVERDRIVE kit used by ALL challenges.
- UI copy in American spelling ("color").

## Challenge looks — approved direction (ALL mocked Nov 1)
- REWIRE: glass neon tubes, unlit until connected; live light flow; surge source → core on completion; stage 1 orange, stage 2 blue; 4×4 tiles ≈ 75 pt.
- MEMORY: 3×3 glass nodes, played one blazes orange with its own tone, slanted step bar.
- COLOR CLASH: huge word, 4 solid color tiles; text says "TAP THE COLOR OF THE TEXT" (never "ink").
- SORT IT: big tilting card; target side glows (blue left / orange right).
- HIGHER OR LOWER: stat chip, two stacked cards, orange VS slam, 10-segment streak bar.
- TIMELINE: four slanted rows, tapped rows orange with order badge, LOCK IT IN.
- MISSING LINK: three big words, glowing orange answer slot, custom letter keyboard.
- CLOSEST CALL / QUICK MATH / PATTERN LOCK: bold question / huge sum, orange answer field, custom number pad (Quick Math has a "−" key for negatives).
- UNSCRAMBLE: dashed answer slots fill with hot-orange letters; big glass letter tiles below fade out once used; CLEAR + SHUFFLE keys.
- TRUE OR FALSE: one big statement card (blue-edged glass), two huge ~110 pt buttons ✓ TRUE / ✕ FALSE — both neutral graphite until tapped, the tapped one turns orange; "WRONG ANSWERS COST POINTS".
- SPELLCHECK: "WHICH ONE IS RIGHT?" + four style-C tiles with the spellings in the upright font; 5-segment progress bar.
- COMPASS: ring with four big N/E/S/W buttons, glowing orange arrow, "you started facing …".
- SIGNAL LOCK: whole screen flashes white-hot orange with giant "TAP!", times as slanted chips.
- TRIVIA LIGHTNING: the first Overdrive mockup (question, style-C tiles, tach bar, combo).
- QUICK COUNT / ODD ONE OUT / DUMB LUCK: see their sections.

## After every challenge — REQUIRED
1. THE ANSWER (v2): question bold white; right answer as a white-hot slanted tile labelled "THE ANSWER" with an orange→blue laser underline; your wrong pick below as a dim graphite tile struck through in red, "YOUR PICK". Every challenge gets one (challenge-specific shapes).
   - Have a reveal today: Missing Link, Spellcheck, Compass, Sort It, Higher/Lower, Timeline, Closest Call, Unscramble.
   - MISSING: Trivia Lightning, True or False, Quick Math, Pattern Lock, Memory, Odd One Out, Quick Count, Color Clash, Signal Lock, Rewire.
   - NO "flag this question" button.
2. ROUND WINNER banner (Dumb Luck: WINNING TICKETS / THE HOUSE WINS).
3. OVERALL standings with ▲/▼; your row outlined orange.
- A "NEXT IN …" countdown + "TAP WHEN READY" — skips ahead once EVERYONE has tapped (min 3 s), else runs the full current time.

## End of match — decided
1. Last round's results.
2. FINAL STANDINGS — every player (2–8), top 3 styled, round wins, totals counting up as rows race in, YOUR BEST / WORST strip; all 8 rows fit without scrolling.
3. VICTORY — "OVERCLOCKED", slanted WINNER stamp, winner's name as a crafted NEON TUBE sign that powers up, score, rotating light rays; podium 2-1-3 slamming up; 2 award chips (FASTEST, BEST STREAK, LONG SHOT…). SOLO: "NEW PERSONAL BEST" instead of a podium.
   - SHELL 2.0 CONTRACT (Nov 5): Overclock draws only this BODY via the cartridge's finalScene(el, game, state). The CONSOLE owns the frame: the ONE button BACK TO THE ROOM under the XP box (rematch vote + NEW GAME live in the room's dock — NO Rematch/Lobby buttons in Overclock), the XP box, "Already yours"/next unlock, and THE CARD REVEAL + their order.
- THE BOARD (site-wide) = Board 2.0 / city chat; OVERCLOCK only reports through /api.

## Timing — DECIDED Nov 4 (Ben): DO NOT CHANGE ANY TIMINGS
- Ben: "I was barely keeping up as it was." Every existing timing stays exactly as it is today: READY_MS 3.2 s, BRIEF_MS 7 s (the rules card, shown as today), STANDINGS_MS 8 s, REVEAL_STANDINGS_MS 12 s, OVERALL_STAGE_MS, CHALLENGE_MS 30 s, FINAL_MS, PLAY_GRACE_MS — and every per-challenge timing (Quick Count flash, memory step speed, etc.).
- No shortened rules card. The new look's animations must FIT INSIDE the existing times — never stretch or shrink them.
- ONE ADDITION (Ben, Nov 4): the after-challenge screen (answer → round winner → overall standings) keeps its CURRENT max (12 s, REVEAL_STANDINGS_MS — every challenge has a reveal after the redesign) but SKIPS AHEAD once EVERY connected player has tapped, never before a 3 s minimum (so the answer always lands first). Solo: your own tap skips (after 3 s). Host-authoritative + server time like every phase; a dropped player doesn't block the skip.
- Only change to pacing: QUICK (6 challenges) becomes the default match length.
- Hard challenges (Rewire, Compass, Missing Link, Higher/Lower, Pattern Lock) get a ~3 s looping animated demo.

## No repeats + content — decided
- CHANGED Nov 4 (Ben, via city chat): NO per-player "never seen" memory — nothing saved to profiles, no merging every player's history at match start.
- (1) BIG POOLS as planned — cheap (≈10,000 questions ≈ 2.5 MB of text), split per challenge, loaded only when OVERCLOCK is played.
- (2) THE ROOM'S NIGHT MEMORY — every question / puzzle used in a room during this game night is remembered WITH THE ROOM and never comes up again that night (across rematches and challenges). No profiles involved; it ends when the room closes. This kills the repeat players notice ("we just had this one"). If a pool is ever exhausted in one night, it reshuffles rather than stalls.
- (3) The DAILY needs no memory (server-picked day set) — see Solo + the DAILY.
- (4) Per-player cross-night memory = a LATER option only if cross-night repeats bother real players once there's traffic — not now.
- Why: a few repeats a week apart are normal in trivia; the annoying repeat is the same group the same night — the room memory fixes that for a fraction of the work.
- We BUILD OUR OWN pools; content growth = its own pass(es). Every row: automated checks + independent reviewer agent. Pools split per challenge, loaded lazily.
- Targets: TRUE OR FALSE 32 → 2,000+ (data file) · TRIVIA own bank 333 → 4,000+ · CLOSEST ~1,000 · MISSING LINK ~1,000 · SPELLCHECK ~1,500 · TIMELINE / HIGHER-LOWER / SORT IT → big item pools dealt as fresh combos · ODD ONE OUT → 4 families.
- The Trivia API: extra source while non-commercial; swap if a paid shop ever comes. Open Trivia DB: credit (share-alike). Never depend on either.

## Housekeeping for pass 1
- Fix the stale generate() calls in the OVERCLOCK tests (tests/overclock.test.mjs, tests/overclock-new.test.mjs).
- Keep the seal.

## Assets
- SFX: ARRIVED Nov 3 — 33 MP3s (~1 MB) in Downloads\grok\overclock-sfx\ (+ credits.txt, MD5SUMS.txt); all CC0 / Sonniss GDC (no credit required — keep credits.txt anyway). The pass imports compressed copies (mono, lower bitrate). Ben's first listen (Nov 3): 17-winner-fanfare first version REJECTED ("cheap") → Grok's layered replacement (4.3 s) APPROVED Nov 3 ("A sounds better than B") — use 17-winner-fanfare.mp3; do NOT import the backup 17-winner-fanfare-b.mp3; 08 + 23 OK (23 great for a long shot); 21 crowd roar OK; the rest judged in-game during the pass review. Builder tips in credits.txt: gapless hooves via Web Audio loop points (not <audio loop>), unlock audio on first tap, mute toggle.
- Muybridge "Horse in Motion" (public domain) for the neon horses.
- MUSIC — decided (Ben, Nov 1): until OVERCLOCK gets its own night tracks, it plays a RANDOM track from the site's EVENING soundtrack each match (no new music files).

## Open
- NEW CARDS / EMBLEMS — FINAL (the owner, Nov 5 10:18 + 10:37 pm — replaces the Nov 3 list). Built by the CITY chat (the Overclock chat's attempt was "embarrassingly bad"); server-checked from the room's OWN record of the match; THE REVEAL = the console's end-of-round moment on the podium (the achievement row: the card's tile + "X % of players have this"), never mid-match.
  1. **REDLINE** — LEGENDARY card (`card-redline`) — achievement `redline`: alone on top of EVERY challenge of a QUICK match (all 6 played, strictly the most points in each, > 0; a tied challenge = not won), ≥ 2 players. Flag `overclock-sweep` (core/match-report.js#overclockExtra). **BUILT (OVERCLOCK CARDS, Nov 5 night)** — Grok's tachometer + the game's needle slamming into the red + shaking, the heat, the sparks (docs/vault.md "OVERCLOCK CARDS").
  2. **PHOTO FINISH** — RARE card (`card-photofinish`) — achievement `photo-finish`: the win ALONE in first by exactly ONE point over second (any mode), ≥ 2 players. Flag `overclock-photo`. **BUILT** — Grok's top-down finish + the game's laser, flash + sparks.
  3. **The neon HORSESHOE emblem** — STAYS — any Dumb Luck win (OC5 builds it).
  - **DROPPED** (the owner, Nov 5 10:18 pm): the LONG SHOT card, the OVERDRIVE card, the SOLO card. OVERDRIVE stays the look's + the x4 banner's name; the max-streak feat may still be reported — it unlocks nothing. NO daily card in the Overclock passes (THE DAILY MODULE's).
- Keep or drop the "YOU" tag on Dumb Luck after seeing it in play. (OC5 built it as a white pill in your lane — still on trial.)
## PASS PLAN — proposed Nov 4 (awaiting Ben). Starts only after LOBBY 2.0. One pass at a time on the beelink; Opus 5.5 high; /clear first; ~3–4 h each.
- OC1 FOUNDATION + THE KIT: Step 0 (docs/overclock.md + ROADMAP line); fix stale tests; cut Lexicon; Quick = default (ALL timings unchanged); room night memory (rules first + sim tests); LOBBY 2.0 cartridge + city pause/memory guard; sounds imported (compressed) + audio unlock + mute; evening-music rotation; THE OVERDRIVE KIT (fonts self-hosted, palette tokens, style-C tiles, tach timer, combo meter x2→x4 OVERDRIVE→x10, right/wrong feedback, title-card slam + 3-2-1, custom number pad + letter keyboard) + no-Firebase preview page; kit proven on TRIVIA LIGHTNING + TRUE OR FALSE.
- OC2 THE RESULTS FLOW: answer reveal frame (v2) + reveals for every challenge that lacks one; round winner; overall standings (▲ blue / ▼ grey) + skip-when-everyone-taps (min 3 s, max unchanged); FINAL STANDINGS; VICTORY body via finalScene (neon-tube winner name, podium, award chips; console owns button/XP/card reveal); OVERDRIVE x10 tracking may be reported as a feat (it unlocks nothing — the OVERDRIVE card was dropped, Nov 5).
- OC3 CHALLENGES A (answer + keypad): Quick Math, Pattern Lock, Closest Call, Missing Link, Unscramble, Spellcheck, Higher or Lower, Timeline, Sort It.
- OC4 CHALLENGES B (visual / reflex): Rewire (neon tubes + surge), Memory, Color Clash, Odd One Out (4 families), Quick Count, Signal Lock, Compass + the ~3 s animated rules demos (MAKE 24 cut in OC2).
- OC5 DUMB LUCK + SOLO + DAILY PLUG-IN: Dumb Luck rules first (odds, payouts, seal, sim tests) then the look (neon sign, odds board, track, finish); SOLO mode; daily mode plug-in (OFF); the HORSESHOE emblem → server catalog + THE LAB (the only new collectible left for OC5 — the cards are built: REDLINE + PHOTO FINISH, OVERCLOCK CARDS; LONG SHOT / SOLO / OVERDRIVE dropped).
- OC6 CONTENT A (structured / generated): True or False → 2,000+; Timeline / Higher-Lower / Sort It item pools; per-challenge lazy split.
- OC7 CONTENT B (written + fact-checked): own trivia bank → 4,000+; Closest Call ~1,000; Missing Link ~1,000; Spellcheck ~1,500. (SHIPPED Nov 7:
  4,184 · 989 · 650 · 1,557 — the pass log below.)
- Assets before OC5: the Muybridge "Horse in Motion" frames (public domain) — Grok prompt before that pass.

## SHELL 2.0 contract — Overclock chat's answers (Nov 5)
- D1 split cartridge meta/logic: AGREE. D2 daily = solo room: AGREE with a CHANGE (server-picked, sealed day set — see below). D3 solo counts: Ben's decision. D7: room night memory only. D8 console owns the podium frame, game draws finalScene: AGREE. D9 shared kit pieces in js/games/kit/: AGREE — OC1 builds them there (neutral base + skin hooks), Overclock adds the OVERDRIVE skin. D12 contract text: AGREE + additions.
- Shell look applies to console buttons/menus/messages; Overclock's in-game controls keep the OVERDRIVE skin.
- NO CHAT DURING OVERCLOCK (Ben, Nov 5 — too fast-paced): the cartridge sets chatLocked for the whole match and has NO chat chips in its meta; the console hides the in-game chat button + the ☰ CHAT row while chat is locked; the room's chat stays open between games.

## SHELL 2.0 B1 is LIVE (Nov 5) — what Overclock pass 1 builds on
- docs/cartridge.md = the contract: thin meta + lazy logic; READY helper in js/games/kit/ready.js ("everyone tapped" → the after-challenge skip); MUSIC: 'mood:evening'; ROOM-NIGHT PATH rooms/{CODE}/meta/used/{gameId}/{key} via kit/night.js markUsed()/usedOf() (host writes in a step's $room; survives rematches, cleared with the room); ~1.5 MB preload budget; finalScene(el, game, state); daily = { on: false, create, resumeKey }.
- Kit folder + prefix reserved for OC1's shared pieces (number pad, letter keyboard, tach timer, title slam + 3-2-1, THE ANSWER frame).
- SOLO lane: OVERCLOCK already marked SOLO; solo match = streak + 15 XP (first 4 a day), no win / night points / banner / champion, own solo board.
- LOOK: the room's AUTO / DAY / NIGHT (kit/look.js, body[data-look]) is the console's — games draw no switch. OVERCLOCK is NIGHT-ONLY for now → DECIDED (Ben, Nov 5): it always shows the night look, AND the console hides/disables the AUTO / DAY / NIGHT button while OVERCLOCK is the chosen game. OC1 adds a meta flag LOOKS: ['night'] to OVERCLOCK's cartridge; the CONSOLE (city chat) reads it and hides the switch for any game whose LOOKS has one entry. When a DAY skin is added later, the flag becomes ['day','night'] and the button comes back by itself.
- COLOUR-BLIND: right / close use the shared --good (green→blue) / --close (gold→orange) tokens, never colour alone (✓ / ✕ / half shapes) — Overclock's right/wrong + Quick Count's "off by one" use them.
- Flag for the city chat: docs/cartridge.md line ~53 still says the daily is "a seed from the date" — contradicts its own D2 section (server-picked day set).

## Pass log

### OC1 — FOUNDATION + THE KIT (Nov 5, 2026)
**What shipped**
- **Step 0:** this plan in the repo (docs/overclock.md), linked from CLAUDE.md; the OVERCLOCK REBUILD line in ROADMAP.md.
- **THE RULES (Group 1):** QUICK (6) is the default (`meta.js`); LEXICON cut cleanly (type, category, rules card, parts, generator, screen,
  reveal, bank + `data/oc/lexicon.json`, `scripts/build-lexicon.mjs`, its tests; Marathon = the 19 once + 5 repeats, its spacing kept).
  **THE ROOM's NIGHT MEMORY** (`js/games/overclock/deal.js`): the host deals the WHOLE match at `start()` around the room's
  `meta/used/overclock` (read once there — the contract's new optional `start({ used })`, docs/cartridge.md); every phone rebuilds the same
  challenge from `game.deal[ci]`; the step that opens challenge ci writes its type key `t-<type>` + its items' keys (`game.dk[ci]`) with
  `markUsed('overclock', …)` in its `$room`; a rematch favours the types the room hasn't played tonight (`buildOrder(seed, total, played)`,
  ×12); a used-up pool reshuffles. Keys hash the item's TEXT (a growing bank keeps the night's memory). The trivia pool keeps its own
  `meta/used/trivia`. **THE AFTER-CHALLENGE SKIP**: the screen after a challenge ends once every CONNECTED participant tapped READY
  (`rooms/{CODE}/ocnext`, `kit/ready.js#readyState`), never before 3 s, its max unchanged. **THE COMBO** in the game: each answer's mark
  (`rooms/{CODE}/ocm` — '1' '0' 'h' '-') folds into `game/combo/{uid} = { c, m }` as a challenge closes (`m` = maxStreak, OC2's feat).
  **No chat** the whole match (until the podium). **MUSIC** `mood:evening`. **LOOKS ['night']** + the console's lock (app.js paints night,
  ☰ → Settings → GAME LOOK shows `NIGHT · LOCKED` + "OVERCLOCK plays at night"). e2e-8p reads each phone's own spec (its stale `generate()`
  copy is gone). The owner's timings are pinned by `tests/overclock-oc1.test.mjs`.
- **THE KIT (Group 2):** `js/games/kit/` numpad · keyboard · tach · slam · answer — a neutral base skinned through `--gk-*` (docs/cartridge.md D9).
- **THE OVERDRIVE SKIN (Group 3):** the self-hosted fonts (+ OFL), the palette as `oc-` tokens, the frame (the carbon background, the header +
  rolling score, THE TACH, the combo meter + the progress strip), the feedback (`fx.js`), the slam + 3-2-1, the sounds (`sfx.js`,
  `scripts/build-oc-sfx.py` → `audio/sfx/overclock/`), `preload()` (~480 KB of the 1.5 MB budget).
- **TRIVIA LIGHTNING + TRUE OR FALSE (Group 4)** fully in the new look, each with THE ANSWER after the round (`answers.js`).
- **THE LOOK REVIEW (Group 5):** `tests/integration/overclock-preview.html` (+ `kit-preview.html`), three rounds at 390 / 412 / 1440, the real
  app's shots from e2e-oc-new; `shots.mjs --fps` — every scene 60 fps at 390 × 844 (dpr 3), also at 4× CPU.
- **THE OWNER's ADD-ON (Group 6):** the after-challenge screen's NEXT line + countdown in a footer of its own (no row ever under it — 2, 4 and
  8 players at 390 / 412 / 1440); "NEXT IN 599" fixed at the source (`logic.js#nextInSec`: the screen's own max on the server clock, 0–12,
  tested); the light rows (below).

- **THE OWNER's ADD-ONs 3 + 4:** the filled-circle ✓ / ✕ badges are gone everywhere — a NEON-TUBE ✓ (`--good`) in a small slanted
  DARK-GLASS SOCKET at the tile's right end (`kit/answer.js#tubeMark`: the letter badge's slant, a static glow path under the tube), + an orange
  YOU tag beside it when it was your pick; a wrong YOUR PICK wears a thin red tube ✕ in the same socket beside the red strike; the playing tiles
  use the same marks. Each question + its answer is one group with ≥ 16 pt after it (the laser never runs into the next question); the answer
  stack slightly tighter so the board starts sooner.
- **THE RULES-LAG, caught by the harbor's `oldrules` group:** the start + the return clear every player node in ONE atomic write — on the rules
  as published a delete of `ocm` / `ocnext` (paths they don't know) refused the whole write, so OVERCLOCK would not have started until the
  re-publish. Those two now live in `registry.js#NEW_PLAYER_NODES`, cleared in a write of their own (best effort); a test pins it.

**Decisions (OC1)**
- **Mid-game standings use LIGHT slanted rows on purpose, NOT the console's slim player cards** (the owner, Nov 5): 8 animated cards every
  round would be heavy + busy. Each light row shows the player's OWN EMBLEM (30 pt) + their name, so they're recognisably the same person as on
  their card. The FINAL podium uses the console's real slim cards (contract D8).
- The deal happens ONCE at the start (not per challenge): the used set is frozen for the match, so a host change mid-match replays the same
  steps; a challenge marks its items when it OPENS (an END GAME leaves the unplayed ones fresh).
- The combo's marks are a write of their own (`ocm`) beside the board — on rules older than OC1 it's refused alone and the board falls back
  (a perfect challenge adds all its parts, anything less resets). A half (Quick Count's off-by-one) and SIGNAL LOCK hold the combo.
- YOUR PICK lives on your device only (sessionStorage): nobody else needs it, and no rules change for it.
- The 3-2-1 sound is the Grok file SLICED: its beeps are 0.35 s apart, the stamps 1 s — each number plays the beep, GO plays the hit.
- The OVERDRIVE frame applies to every challenge; the ones OC3 / OC4 haven't rebuilt keep their own screens inside it (their keypads take the
  graphite palette). Their old purple / magenta details stay until then.
- The challenge's name moved to the header; the stage keeps a slim row of the parts' marks (✓ / half / ✕ colours).
- `nextInSec` counts to `phaseStartAt + standingsMs(type)` — never to whatever end the state carries.

**The local run before the final push (the mini PC, nothing else busy):** unit 1198/1198 · rules 66/66 · /api 38/38 · smoke 6/6 ·
e2e-oc-2 29/29 · e2e-oc-new 21/21 (8 players) · the full e2e-harbor 1196/1200 — its four misses are city timing / look checks that passed in the
pass's first full run and pass alone (windows, stations, rebuild — 1127 ms worst vs 1069 on the pre-OC1 build) except `roomperf`'s guest-list
cost at 4× CPU, which fails the same way on the pre-OC1 build on this machine (not OC1's).

**Known issues / held back**
- On a desktop a 1-px compositing seam can show along the column's right edge over the background (dark grey on near-black; no element draws it).
- Missing Link still uses the system keyboard and the old keypad screens remain until OC3 rebuilds them on the kit's pad + keyboard.
- The round board's slide into the overall order + the round winner keep OC1's light restyle only — OC2 rebuilds the results flow.

### OC2 — THE RESULTS FLOW (Nov 6, 2026)
**What shipped**
- **Group 0 — the owner's carried fixes (ADD-ON 5 + his notes after playing OC1):** the WRONG tile is never flat red (dark glass + a red
  edge flash + glowing hairline cracks under the text + a shake → it rests dark with a red edge / tint + the ✕ in its socket; `.oc-tile-bad`);
  the RIGHT tile rests with the `--good` edge + a soft inner glow + the ✓ (`.oc-tile-ok`; the press still flashes orange on the way); the combo
  meter hidden at ×0 / ×1 (it slams in at ×2); the progress bar under the emblems ORANGE (your progress — right / wrong is the tiles'); no dead
  gap under the header (the rebuilt screens start under the progress row); the background's grid (a fine + a coarse one), the haze + the
  vignette deeper; the desktop's 1-px line = base.css's column frame (`#stage::before/::after`) — gone while OVERCLOCK is on.
  **THE COMBO CUES NEVER BLOCK PLAY:** x4 OVERDRIVE + x10 live in the header band only — the meter IGNITES (slams up a size, OVERDRIVE inside
  it, a white-hot flare) while a hot light streak runs along the screen's top + side edges; pointer-events none, 0.76 s, never stacked, then
  the meter stays lit (a steady glow). **MAKE 24 CUT** cleanly (type, category, rules, parts, generator, screen, reveal, bank, solver, data,
  build script, help, docs, the E2Es, the tests; Marathon = the 18 once + 6 repeats; the deal + buildOrder unchanged otherwise).
- **Group 1 — THE RULES (tests first, `tests/overclock-oc2.test.mjs`):** THE ROUND WIN (`logic.js#roundWin`) stored per challenge as it
  closes (`game/rw/{ci}` — `{ w, p }` · `{ t: {uid}, p }` · `{ n }`); the server's REDLINE (`core/match-report.js` sweep) calls the SAME
  function. FASTEST's clock (`game/tm/{ci}/{uid}` — ms to the finish) + BEST STREAK's tie-break (`game/cr/{uid}` — when the best was set);
  `game.combo` and the record the server reads (results' pts, total, mode) unchanged. THE AWARD CHIPS (`awardChips`) + YOUR BEST / WORST
  (`bestWorst`). Whole simulated QUICK matches through the director → `extractMatch`: sweep 6/6 ✓, 5/6 ✗, a tied round ✗, a blank round ✗, solo
  never; photo by 1 ✓, by 2 ✗, a tie at the top ✗; the helper = the original server rule over 3,000 random matches.
- **Group 2 — THE ANSWER for every challenge (`answers.js`):** the eight with no reveal get one in the kit's frame (QUICK MATH, PATTERN LOCK,
  MEMORY as numbered mini nodes, ODD ONE OUT + why, QUICK COUNT with off-by-one = close, COLOR CLASH, SIGNAL LOCK vs the room's best, REWIRE);
  the eight older reveals move into THE ANSWER's panel as they are (`kit/answer.js#answerPanel`). The screens save YOUR PICK on the device.
- **Group 3 — THE ROUND WINNER + THE OVERALL STANDINGS:** the after-challenge screen = three BEATS inside its own time
  (`logic.js#resultBeats`): THE ANSWER (≥ 3 s), the ROUND WINNER banner (the slanted orange stamp + the winner's emblem on a halo in their color
  + name; DEAD HEAT · NO WINNER), the OVERALL standings (the light rows slide from the old order to the new, ▲ blue / ▼ dim steel with the places,
  the totals rolling up, your row orange) with a lit READY mark on each row that tapped. Timed from the phase start on the server clock.
- **Group 4 — THE END:** inside the final phase (`finalBeats`): the last round's beats → FINAL STANDINGS (every player, the top three on
  gold-orange / steel / bronze edges, ROUND WINS, the totals counting up as the rows race in, YOUR BEST / WORST) → THE VICTORY: the console's
  frame (`ui/final.js` — untouched) + `finalScene` (`victory.js`): OVERCLOCKED, the WINNER stamp, the winner's name as a NEON TUBE SIGN that
  powers up letter by letter (the city's tube alphabet + digits; each letter's lit tube an HTML-wrapped layer, opacity only), rotating rays,
  the score, the 2-1-3 PODIUM on the real slim cards (`leaderboard()` → `strip-board.js`, one shared surface), the award chips; CO-WINNERS
  share the sign + the top step; SOLO = the score as the hero (NEW PERSONAL BEST only from the server's outcome). The fanfare (17) as the sign
  powers up. SKIP › moves only your phone on (remembered for the match).
- **Group 5 — THE LOOK REVIEW:** `overclock-preview.html` covers every new screen (`&beat=`, `&win=`, `&ready=1`, `&final=1`, `&cowin=1`,
  `&n=1…8`, `&hold=1`); three rounds at 390 / 412 / 1440; 60 fps at 390 × 844 (dpr 3), also at 4× CPU. `shots.mjs`: `--cast` on a `--page` +
  `--strip N` + `--webm` (THE MOTION PROOF — `Downloads/neon/overclock/shots/`).

**Decisions (OC2)**
- **THE ROUND WIN** (one rule everywhere — the banner, ROUND WINS, the server's REDLINE): a player wins a challenge when their points in it
  are the HIGHEST and NOT SHARED. A tie for the top = nobody wins it (the banner's DEAD HEAT); nobody above 0 = NO WINNER. Stored in the game
  state as the challenge closes (a new host + every phone read the same).
- **THE AWARD CHIPS:** BEST STREAK = the highest maxStreak, at least ×3 (ties → the one who reached it first). FASTEST = the lowest average
  time per RIGHT answer (the time from the challenge's start to your finish — the whole 30 s if you never finished — over your right answers
  in it), at least 3 right answers; COMPASS, MEMORY, SORT IT, SIGNAL LOCK + QUICK COUNT don't count (their clock isn't the player's); ties → the
  one who reached it first. A chip that doesn't apply is skipped (LONG SHOT comes with DUMB LUCK).
- **YOUR BEST / WORST:** your points in each challenge vs the room's best in it (alone: vs the most it could score).
- **MAKE 24 cut** (the owner, Nov 5).
- **THE COMBO CUES:** header band + the screen's edges only, never a tap taken, ≤ 0.8 s, one at a time; the meter then stays lit.
- **The beats** live inside the existing times: 8-s screen = answer 0–3 s · winner 3–4.3 s · standings 4.3–8 s; 12-s = 0–7 · 7–8.3 · 8.3–12.
  The final: + FINAL STANDINGS 9 s, then the victory (FINAL_MS 120 s unchanged). No `standings` phase exists for the last challenge, so the
  final's beats can't take the room-wide READY skip — a per-phone SKIP › instead (no rules change).
- **The podium 2-1-3 on slim cards:** three strips side by side don't fit a phone, so the top step is full width and 2nd / 3rd sit lower
  left / lower right (88 % wide) — 2-1-3 reading left → right, nothing overlapping; they slam up 3rd → 2nd → 1st.
- **The console's own WINNER line** (`.winner`) is hidden inside Overclock's frame — the body's stamp + sign say it (no console file changed).
- **SIGNAL LOCK's room best** is an EFFECTIVE time (its reaction credit turned back into ms, shown with ≈); your own taps are exact.
- **SOLO's personal best:** the server keeps only a STANDARD solo board, so a QUICK solo run shows YOUR SCORE.

**The local run before the final push (the mini PC, nothing else busy):** unit **1216 / 1216** · rules **66 / 66** (database.rules.json
unchanged — nothing to re-publish) · `/api` server.test **38 / 38** · smoke **6 / 6** · e2e-oc-2 **22 / 22** (8 phones; Make 24's seven checks
went with it) · e2e-oc-new **39 / 39** (8 phones, to the end of the match) · the profile E2E **91 / 91** (REDLINE + PHOTO FINISH still unlock
through the server's shared round-win rule) · the harbor's `room2` job **52 / 52** (cartridge, city pause, the solo look …). No City 2.0 or
console file changed (ui/final.js untouched; match-report.js = the server's report, proven equal over 3,000 random matches) → the ci tag; the
full harbor suite was not run.

**Known issues / held back**
- The eight older reveals sit in THE ANSWER's panel in their pre-OVERDRIVE look (their dressing is OC3 / OC4's, as decided).
- The challenges OC3 / OC4 haven't rebuilt keep their old screens (and their old layout spacing).
- The console's victory jingle (`sfx('victory')`, ui/final.js) still plays at 2.5 s beside the sign's fanfare; the victory music starts with
  the final phase (the console's), i.e. during the last round's answer.
- No /api on the look-review page: the XP box's height under the victory body was checked only on the E2E's room (no /api there either).

### OC3 — THE TYPING CHALLENGES (Nov 6, 2026)
**What shipped**
- **Group 0 — the owner's phone (OC2's victory slid sideways):** the console's podium frame scrolls DOWN (`overflow-y: auto`), which made it a
  SIDEWAYS scroller too, and the victory's turning rays (640 px) spilled past the phone's edges. The rays now turn inside a clip of their own
  (`.oc-vic-rays-clip` — exactly the panel's width, out through its side padding, up over the kicker), every Overclock panel says
  `overflow-x: hidden`, the award chips can shrink (`minmax(min(140px, 100%), 1fr)`, names ellipsis), Signal Lock's answer row no longer leans
  2 px past the column. **THE GUARD:** `tests/integration/e2e-oc-sideways.mjs` — every challenge playing + its answer, the typing states, both
  demos, the round winner (+ a dead heat), the standings at 8, the final standings, the victory at 2 / 8 / co-winners / solo, at 390 / 402 / 430:
  the document's scrollWidth ≤ the viewport, no scroll box wider inside than out, and a real sideways swipe (Chromium's touch gesture + a
  sideways wheel) moves nothing.
- **Group 1 — THE RULES (tests first, `tests/overclock-oc3.test.mjs`):** PATTERN LOCK's first sequence in a match is an EASY one — a plain +n / −n
  step (n 2–9; −n only up to 6), numbers 1–65 — drawn from its OWN seeded stream (`seed:ci:pattern:easy`) so the second sequence and every later
  Pattern Lock are exactly the old generator's (the test keeps a frozen copy and compares 400 seeds × 5 positions). Every sequence carries its
  RULE in one short line (`say` — `patternSay`: "+3 each time", "×2 each time", "add the two before" …). Whole simulated matches with two
  Pattern Locks at 2 + 8 players; a replayed step = the same patch; the record the server reads unchanged.
- **Group 2 — THE NUMBER CHALLENGES on the kit's NUMBER PAD** (`ui/numeric.js` · `ui/closest.js`): no input element anywhere; the kit pad's glass
  keys (56 pt, 52 on a phone under 800 pt tall), a big orange LOCK IT IN, the slanted orange-edged answer field + its cursor (the cursor blinks
  at the START of the placeholder, never on it), dressed with OC2's resting tiles (`dressField`: right = the --good edge + ✓ + the burst and
  the sparks; wrong = dark glass + a red edge + ✕ + the cracks + a shake, your number struck → the right one white-hot). QUICK MATH: a HUGE
  one-line sum (its font follows its length — container units), "= ?" hot, the "−" key. PATTERN LOCK: big slanted number chips (two rows of
  three for 4-digit numbers), the missing slot glowing orange "?" (a pre-rendered glow, its opacity breathing); a right answer DROPS into it.
  CLOSEST CALL: the category chip + the UNIT chip, the bold question, the unit inside the field once you type, the "." key. A computer's
  keyboard types into the pads (digits, "-", ".", Backspace, Enter). THE ANSWER: the sum = the answer; the whole sequence with the number
  dropped into its slot + the rule; CLOSEST CALL's answer + YOUR GUESS + a slanted scale between them (how far off: "−305 km/h · 14 % OFF",
  DEAD ON at full credit) + the room's closest named (ties together). PATTERN LOCK's DEMO in the rules card (`demos.js` → the kit's new `demo`
  slot in `kit/slam.js`): 3 · 6 · 9 come in with "+3" between them, 12 drops into the glowing slot, a green flash — a 3 s loop.
- **Group 3 — THE WORD CHALLENGES:** MISSING LINK on the kit's LETTER KEYBOARD (`ui/missinglink.js`): three big clue cards, the glowing orange
  answer slot (a dash a letter, your letters hot orange, a white caret), QWERTY glass keys + GO (+ SKIP on the first puzzle, as before); the old
  hidden `<input>` + the view's iOS-keyboard tracking are GONE. The exact answer still locks in by itself; after a wrong GO the next letter starts
  a fresh word (⌫ edits the one you had). Its DEMO: SUN · CORN · WALL, FLOWER types itself into the slot, the three joins (→ FLOWER) slide in +
  light. UNSCRAMBLE (`ui/unscramble.js`, its tiles — no keyboard): dashed slots fill with hot-orange letters, big glass tiles fade out when used
  (tap a filled slot to take it back), CLEAR + SHUFFLE glass keys; a full word = white-hot + ✓, a wrong one = a red shake, then empty. THE
  ANSWER: Missing Link's clues each JOINED to the link (CLUE → LINK) + the link white-hot, your last guess struck; Unscramble's scrambled tiles
  FLY into the word (each from its scrambled place). The old panels (reveals.js — the number line, the links, the word) + every old style of the
  five screens (the purple keypad, `.ml-*`, `.us-*`, `.nl-*`, `kb-open`) removed.
- **Group 4 — THE LOOK REVIEW:** `overclock-preview.html` — `type=math|pattern|closest|missinglink|unscramble` `&at=play|typing|right|wrong|answer`,
  `&at=brief&still=1` (the demos), `__preview.typePad / typeKeys / typeTiles / lock`; three rounds at 390 × 844 + 412 × 915 + 1440 × 900.

**Decisions (OC3)**
- **NO SIDEWAYS SCROLL, EVER:** a box that scrolls down scrolls sideways too unless it says otherwise — every Overclock panel says
  `overflow-x: hidden`; anything that moves past the edges (the rays) lives in a clip of its own. The guard (`e2e-oc-sideways.mjs`) reads every
  screen at 390 / 402 / 430 — run it after touching any Overclock screen.
- **PATTERN LOCK's EASY OPENER:** only the match's FIRST Pattern Lock, only its first sequence; its own seeded stream (nothing else moves).
- **THE PADS REPLACE THE SYSTEM KEYBOARD** in all five: no input element anywhere (the E2Es check it); a computer's keyboard still types into
  the pads. Unscramble keeps its tiles (the plan).
- **CLOSEST CALL's "." key is on every question** — showing it only when the answer has a decimal would be a hint.
- **PATTERN LOCK's pad has the "−" key too** (like Quick Math): a 3 × 4 pad with no gap, and a sequence may step down.
- **MISSING LINK's joins read CLUE → LINK** for all three (the bank doesn't say which side the link goes; the arrow is the join, not the order).
- **The demos** run on the Web Animations API — every piece its own keyframes on ONE shared 3 s loop (transform + opacity; reduced motion = the
  finished picture, still); BRIEF_MS 7 s unchanged.
- **No timing changed:** CHALLENGE_MS 30 s, every per-challenge time (the next part 380 ms after a right answer / 900 ms after a wrong one,
  Missing Link 950 / 1300 ms, Unscramble 420 ms, Closest Call's 350 ms) — `tests/overclock-oc1.test.mjs` passes unchanged.
- **Every rule on a kit piece is prefixed `.oc-od`:** in the real app `css/kit.css` can load AFTER `css/overclock.css`, so an equal-weight rule
  loses (the real-app E2E caught Missing Link's SKIP key squeezed to the kit's 10 % width — the preview loads the sheets the other way round).

**The local run before the final push (the mini PC, nothing else busy):** unit **1223 / 1223** · rules **66 / 66** (database.rules.json
unchanged — nothing to re-publish) · `/api` server.test **38 / 38** · smoke **6 / 6** · e2e-oc-2 **23 / 23** (8 phones; again with 4 after the
selector fix) · e2e-oc-new **47 / 47** (8 phones — Closest Call's "no input element" is checked on every phone) · the no-sideways guard **144 / 144**
(48 screens × 390 / 402 / 430) · 60 fps at 390 × 844 (dpr 3) on all five pads with a key every 60 ms, both demos, Closest Call's answer —
also at 4× CPU (16.7 ms p50 / ≤ 16.8 ms p95, 0 long frames). No City 2.0 or console file changed (`kit/slam.js` is used by Overclock only) →
the ci tag; the harbor suite was not run.

**THE MOTION PROOF:** `Downloads/neon/overclock/shots/oc3-proof-*` — 8-frame strips + recordings: a key press + LOCK IT IN (right), a wrong lock,
Missing Link typed to its auto-lock, both demos, Closest Call's scale.

**Known issues / held back**
- Missing Link's joins all read CLUE → LINK; the bank doesn't record which side the link goes (CAKE → CHEESE for "cheesecake").
- No E2E plays Unscramble through the UI (as before — e2e-oc-2 / e2e-oc-new cover the other four); its tiles are checked on the preview.
- OC3B next: Spellcheck, Higher or Lower, Timeline, Sort It (their older panels still sit in THE ANSWER's frame).

### OC3B — THE CARD + LIST CHALLENGES (Nov 6, 2026)
**What shipped**
- **Group 0 — carried from OC3:** MISSING LINK's joins are NEUTRAL — each clue and the link word joined by a short LIT TUBE (`shared.js#joinTube`:
  dark glass ends, a white-hot core, a static glow that flickers on — opacity only), no arrow, in THE ANSWER and in its demo, so FIRE + WORK can
  never read "WORK → FIRE". UNSCRAMBLE end to end with REAL TAPS (e2e-oc-new, challenge 5): CDP finger taps fill the slots, a tap on a filled slot
  takes its letter back, CLEAR empties them, SHUFFLE moves the tiles (the letters + the filled slot kept); BOB submits a wrong word (a red shake,
  then empty, nothing scored) then the right one (full + speed); CHARLIE only a wrong word (0); THE ANSWER on both phones (BOB: the word
  white-hot + YOU · CHARLIE: his word struck under it).
- **Group 1 — SPELLCHECK + HIGHER OR LOWER** (`ui/spellcheck.js` · `ui/higherlower.js`): SPELLCHECK = "WHICH ONE IS RIGHT?", its own slanted
  5-segment bar, four style-C tiles with the spellings in the plain UPRIGHT face, letter-spaced, sized to the word (15 letters fit at 390); THE
  ANSWER = each right spelling white-hot with the letters people usually get wrong on a --good bar (`spell.js#trickyLetters` — an LCS against
  the bank's most common misspelling), YOUR PICK struck with ITS wrong letters marked (a ✕ over them + a red zigzag; a red caret where a letter
  is missing). HIGHER OR LOWER = the stat chip, a 10-segment streak bar, two stacked glass cards (the known one blue-edged with its number, the
  hidden one hot-edged with a "?"), the orange VS slamming in between, HIGHER / LOWER as the big style-C buttons (years: LATER / EARLIER under
  them); right = the number FLIPS in + a segment lights; a miss = the number SLAMS in, the card cracks red, the BAR CRACKS — the run is over. THE
  ANSWER = YOUR STREAK as the hero (its bar, cracked where it ended), YOUR RUN as chips, THE ONE THAT ENDED IT with both numbers (or WHERE THE
  TIME RAN OUT), the room's longest run. Its ~3 s DEMO in the rules card (`demos.js#hlDemo`): BIG BEN 96 m · VS · EIFFEL TOWER ?, a finger taps
  HIGHER, 330 m flips in, the card goes green, the first segment lights.
- **Group 2 — TIMELINE + SORT IT** (`ui/timeline.js` · `ui/sortit.js`): TIMELINE = the set's chip, the question, the direction on a rail
  (1 = EARLIEST ━ 4 = LATEST), four slanted glass rows — a tap turns one HOT ORANGE with its order badge, a tap again takes it back — and LOCK IT
  IN (the kit's GO key) once all four are numbered; locked rows rest ✓ / ✕ with their values (a wrong one shows where it belongs). THE ANSWER =
  the rows SLIDE from your order into the right one beside the VALUE RAIL (the values light as they land), your number + ✓ / ✕ on each.
  SORT IT = the two sides on slanted glass plates (BLUE left · ORANGE right) + their edges down the table, ONE BIG TILTING GLASS CARD (a sheen,
  the item sized to its length), the card's shrinking window as THE TACH under it; drag = the card tilts + that side's edge and plate glow;
  right = it flies into its side and the edge flashes (the burst + the sparks); wrong = it BOUNCES BACK off the side with a red edge flash + the
  cracks, then drops out; too slow = it sinks. THE ANSWER = two columns under the plates, every card where it BELONGS, ✓ / ✕ / SLOW — a miss
  SLIDES IN from the side you put it on. The old panels (`reveals.js` — only COMPASS's is left) + every old style of the four screens removed.
- **Group 3 — THE LOOK REVIEW:** `overclock-preview.html` — `type=spellcheck|higherlower|timeline|sortit&at=play|right|wrong|answer`,
  higherlower `&run=miss|time|perfect`, `&at=brief&still=1&type=higherlower` (the demo), `__preview.tap(k, right)` / `__preview.swipe(right)`;
  three rounds at 390 × 844 + 412 × 915 + 1440 × 900.

**Decisions (OC3B)**
- **THE NEUTRAL JOIN** (Missing Link): a lit tube between each clue and the link, never an arrow (the bank doesn't record the side). OC7 records
  the side per puzzle and shows the whole compound word (DONE in OC7 — `shared.js#joinedWord`; the tube stays only for a row with no side).
- **UNSCRAMBLE's real-tap E2E** lives in e2e-oc-new (challenge 5, after Rewire): real CDP touches, not dispatched events.
- **HIGHER OR LOWER is asked as "is the hidden one HIGHER or LOWER than the known one"** (the approved mockup): the same pairs, the same
  winner, the same strict rule — HIGHER is right exactly when the hidden value is the bigger one (`hlFair` never deals equal values), so the
  answer check, the scoring and the record the server reads are unchanged (`tests/overclock-oc3b.test.mjs` proves it on 3,000 dealt pairs).
  The rules card + HOW TO PLAY lines were reworded to say it.
- **A challenge with its own bar** (`.oc-ownbar` — Spellcheck's 5 words, Higher or Lower's streak) hides the frame's slim pips; the ×2 FINAL
  tag stays.
- **SPELLCHECK's tricky letters** come from the bank's own most-common misspelling (`spell.js`): the letters the misspelling lacks or changes, the
  letter before one it adds, a doubled letter as its pair (acco[mm]odate, h[ie]rarchy, basic[all]y); every row of the bank reads (the test).
- **SORT IT's card window** runs THE TACH on this phone's own clock (`performance.now`) — the card's window always was this phone's own pacing (a
  local timer), never the room's; the challenge's 30 s stays on the server clock.
- **No timing changed:** Spellcheck 480 / 1100 ms, Higher or Lower 1250 ms to the next pair (1200 / 1700 to the done screen), Timeline 2200 ms,
  Sort It's windows (2.6 → 1.2 s), its 230 ms to the next card + 300 ms to the first — pinned from the screens' own source by
  `tests/overclock-oc3b.test.mjs` (and OC1's timing test passes unchanged).
- **Never name a state `.is-hidden`:** components.css hides `.screen .is-hidden` (the hidden Higher or Lower card vanished) — `is-unknown`.
- **The players' strip never scrolls sideways** (the guard found it: 8 players + a lit combo meter at 390 made the strip scroll) — the emblem
  chips shrink and the strip says `overflow-x: hidden`.

**The local run before the final push (the mini PC, nothing else busy):** unit **1228 / 1228** · rules **66 / 66** (database.rules.json
unchanged — nothing to re-publish) · `/api` server.test **38 / 38** · smoke **6 / 6** · e2e-oc-2 **26 / 26** (8 phones — Spellcheck's upright
tiles, Higher or Lower's buttons + its demo, Sort It's touch swipes + its answer columns) · e2e-oc-new **65 / 65** (8 phones — Timeline's rows +
LOCK IT IN + its answer, Unscramble's real taps) · the no-sideways guard **177 / 177** (59 screens × 390 / 402 / 430) · 60 fps at 390 × 844
(dpr 3) with fast Higher or Lower taps, fast Sort It swipes, fast Spellcheck taps, the demo and the three moving answers — also at 4× CPU
(16.7 ms p50 / ≤ 16.8 ms p95; one frame over 25 ms in the Spellcheck run). No City 2.0 or console file changed (`js/ui/help.js` = one HOW TO PLAY
line) → the ci tag; the harbor suite was not run.

**THE MOTION PROOF:** `Downloads/neon/overclock/shots/oc3b-proof-*` — 8-frame strips + recordings: a Higher or Lower miss, a Sort It swipe
right + wrong, the Higher or Lower demo, Timeline's answer sliding into order.

**Known issues / held back**
- SPELLCHECK's underlined letters come from the bank's ONE most-common misspelling — a few read a little wide (succ[eed] vs "succede"); OC7's
  bigger bank can record the tricky letters per word (DONE in OC7 — each row's `hard`).
- HIGHER OR LOWER now shows the known card's number (the approved mockup) — the call is the same question, but the number is on screen.
- COMPASS's old panel is the last one inside THE ANSWER (OC4 rebuilds it).
- `tests/integration/e2e-stage2.mjs` (a retired suite, not in any run) still taps the pre-OC3 screens.

### OC4 — THE REAL-GLASS CRACK + THE VISUAL / REFLEX CHALLENGES (Nov 6, 2026)
**What shipped**
- **Group 0 — THE REAL-GLASS CRACK** (`crack.js`, everywhere the kit's wrong feedback is used — fx.js#wrong: a tile, a True-or-False button,
  the number pad's field, a Higher or Lower card, Sort It's card, a Timeline row, Unscramble's slots, and OC4's nodes / cells / buttons). The
  owner after OC3: the drawn hairlines were "too cheap… basic". The fracture is a REAL PHOTO — **"RadialCracksB by Keith333
  (https://opengameart.org/users/keith333), licensed under CC-BY 3.0"** — shipped as `assets/overclock/crack.webp` (1024 px, ~95 KB: the
  seamless photo rolled so the impact is centred, brightness → alpha with a HIGH-PASS so the long thin cracks survive the dark glass's haze, the
  crushed centre held at 60 % so a word under it stays readable, faded out toward a circle) + `crack-glow.webp` (192 px, the same blurred ONCE,
  tinted red — the emissive layer); built by `scripts/build-oc-crack.py`; credited on the site (☰ → CREDITS, `js/ui/credits.js`, ART) and in
  `assets/overclock/CREDITS.md`; in the preload (still inside the 1.5 MB budget). PER TAP: centred on the TAP POINT (fx.js reads the last
  pointerdown in the capture phase; a key / a timeout → the left third, never dead centre), a seeded rotation + a slight scale (the challenge
  key + part = the seed), clipped to the host's own shape (`--oc-gc-skew` = the tile's slant, `--oc-gc-r` for round nodes). LIGHT, NOT LINES:
  the photo's bright crack edges; the red emissive layer (only its opacity moves); a thin highlight SWEEP seen only THROUGH the cracks (the
  texture is its mask). REFRACTION: the label splits along three of the photo's main crack lines from the impact — three clipped copies, each
  1–2 px out of line. MOTION (≤ 0.45 s, transform + opacity, pointer-events none): a crushed white flash, the cracks running out in 120 ms (a
  round window scaling up while the texture inside it counter-scales — it never zooms), the glow flaring then settling faint, 3–5 GENERATED
  shards (thin slivers + a glint) spinning off, ONE knockback (2–3 px back + a hair of rotation). At rest: dim, a faint red glow, the red edge.
  Reduced motion: the finished fracture just appears. Three refine rounds on 8-frame strips at real phone size (`shots.mjs --cast-el` crops a
  strip to an element); 60 fps at 390 × 844 dpr 3, also at 4× CPU with five wrong taps in a row.
- **Group 1 — ODD ONE OUT's FOUR FAMILIES (rules first — `odd.js`, `tests/overclock-oc4.test.mjs`):** LETTERS / NUMBERS (60 fair look-alike
  pairs in the monospace "coding" face, three tiers by the level as before — O/0, l/1, rn/m, vv/w, 8/B, ;/: …), ROTATION (an arrow / chevron /
  key / bracket / pin turned 25–45°; bigger turns early in a match), MIRROR (a flag / note / boot / bolt flipped), NEON SHAPES (a ring's gap
  moved ≥ 90°, a star missing a point, a die's 5 among 6s / 4 among 5s). Each of the three grids from a DIFFERENT family (seeded); the host
  DEALS them around THE ROOM's NIGHT MEMORY (`deal.js` — `[fam, item] × 3`, keys `od-g… / od-r… / od-m… / od-s…`); a stale deal falls back to the
  seeded draw; the seeded stream is spent the same either way. Whole simulated matches with two Odd One Outs at 2 + 8 players (dealt, marked as
  each opens, a replayed step = the same patch, the record unchanged).
- **Group 2 — REWIRE · MEMORY · COLOR CLASH.** REWIRE (`ui/rewire.js`): dark glass tiles (≈ 72–75 pt at 4×4) holding GLASS NEON TUBE — bent
  like real neon (an L is a quarter arc round the tile's corner), unlit until connected; a tap turns it (a snappy transform); a connected tube
  lights in the stage's colour (1 ORANGE · 2 BLUE) with a LIVE FLOW (each tube's flow layer pulses, delayed by its distance from the source — a
  wave along the circuit, restarted in step on every turn); on completion THE SURGE (every lit tube white-hot in order from the source, its
  step shortened on a long path so the core always blazes by 0.76 s — inside the unchanged 1100 ms) and THE CORE BLAZES. Its answer: both
  circuits solved + lit on two small boards, your time / NOT SOLVED + how far the power got. Its ~3 s DEMO: two tiles turn, the tube lights,
  the surge reaches the core. MEMORY (`ui/memory.js`): a 3 × 3 of round glass nodes; the played node BLAZES orange (a pre-rendered blaze + a
  white-hot core) with its OWN TONE (Grok's nine memory tones, mem0…mem8 — already in audio/sfx/overclock/; the synth tone if they can't play);
  a slanted step bar. **The owner, mid-pass:** no ✓ / ✕ on the nodes — the right node glows GREEN, the wrong one RED and CRACKED. Its answer:
  the sequence replayed on a node board (each step's node blazes with its number, inside the 8-s screen's answer beat), the steps as numbered
  mini grids, the slip marked. COLOR CLASH (`ui/stroop.js`): one huge word (Barlow 900 italic) in a different colour, "TAP THE COLOR OF THE
  TEXT", four big SOLID colour tiles (no names, no ✓ / ✕ on them — right = a green outline, wrong = cracked + a red edge); its answer: the word in its colour, the text colour named on a solid chip.
- **Group 3 — ODD ONE OUT · QUICK COUNT · SIGNAL LOCK · COMPASS.** ODD ONE OUT (`ui/oddone.js` + `ui/oddart.js` — the tube icons, one static SVG
  per token): glass cells, three slanted pips, a family line ("ONE IS TURNED"); the found cell blazes white-hot + pops, the rest dim; a miss
  cracks red, the odd one shows green. Its answer: each grid small with the odd one ringed + its one-line why (`odd.js#oddWhy` — "the arrow
  turned 30°", "a 5 among 6s", "the O is round"). QUICK COUNT (`ui/count.js`): each shape its own neon tube in its own colour (triangle PINK ·
  circle CYAN · square YELLOW · diamond GREEN), a blue bar drains during the flash, "HOW MANY [the shape, big] ?", four big slanted number tiles,
  OFF BY ONE STILL EARNS HALF (the close tile --close + ½). Its answer: the grid again with the asked shape lit + counted 1, 2, 3 … SIGNAL LOCK
  (`ui/reflex.js`): the dim tense wait (the pad's rim pulsing), on GO the WHOLE SCREEN white-hot orange with a giant TAP! (a tap anywhere on it
  counts), the red EARLY stamp (a miss, as before), the rounds as slanted chips with your best lit. COMPASS (`ui/compass.js`): the glass ring, N /
  E / S / W round it, the glowing orange arrow, the heading card; its dressed answer (the turns replayed on a small ring, the arrow sweeping to the
  heading, your pick) replaces the LAST old panel (`reveals.js` is empty now); its ~3 s DEMO (FACING N → TURN RIGHT → TURN RIGHT, the arrow sweeps,
  S lights).
- **Group 4 — THE LOOK REVIEW:** `overclock-preview.html` — the seven at `at=play|right|wrong|answer` (+ `count&at=close`), `type=oddone&fams=0,1,3
  &item=n` (any families), `at=brief&still=1&type=rewire|compass` (the demos), `__preview.wire(m)` / `mem(n)` / `tap(k, right)`, `&tx= &ty=` (where
  the finger lands — the crack's impact); the JetBrains Mono face loaded like the site does. Three rounds at 390 / 412 / 1440.

**Decisions (OC4)**
- **THE REAL-GLASS CRACK** is a real photo (CC-BY 3.0, credited) — never hand-drawn lines; never `crack.png` (a contained CG ball) or the Pexels
  shards (outside the CC0 / CC BY rule). The shards are GENERATED. The split label rides ON the cracks (readable through the fracture).
- **GREEN + RED, NO MARKS on the new buttons** (the owner, Nov 6, looking at Memory): Memory's nodes, Odd One Out's cells, Quick Count's numbers,
  Compass's N / E / S / W show right = green, wrong = red + the real-glass crack (the crack is the shape that tells them apart without colour);
  Quick Count's half = --close + ½. COLOR CLASH too (the owner, after the pass: "drop them"): its right tile wears a green OUTLINE (its face is
  its colour), a wrong one the crack + a red edge. THE ANSWER keeps its ✓ / ✕ marks (the kit's frame).
- **ODD ONE OUT's FAMILIES:** a different family per grid; no colour family (colour-blind players); every difference a thick stroke or a clear
  angle at the 6 × 6 grid's ~54-pt cells on a 390-pt phone (the turn ≥ 25°, the gap moved ≥ 90°, the tube 7.5 % of the cell).
- **QUICK COUNT's EXACT FLASH:** the shapes are on screen at full brightness the moment they're shown (nothing on the grid animates or fades in)
  and the flash clock (1800 − level × 600 ms, unchanged) starts only once they've PAINTED (two animation frames — `count.js#afterPaint`); the
  look time can only run a frame long, never short (pinned by the test).
- **COLOR CLASH = the four colours only** (red · blue · green · yellow, full saturation — the prompt's "as today"): the generator no longer swaps
  in purple / orange at higher levels (too close to blue / red for many eyes). Scoring + answer checks unchanged.
- **SIGNAL LOCK's GO** covers the whole screen, so a tap anywhere on it counts (the pad under it can't be reached); the time is still measured
  from the frame the flash paints; an early tap is still a miss.
- **COMPASS** keeps its memory load: the start heading shows only on the start card ("YOU'RE FACING …"), as before; "YOU STARTED FACING" heads
  the answer's replay.
- **REWIRE's class prefix is `oc-wire-`** — `oc-rw-` is the ROUND WINNER banner's.
- **No timing changed** (pinned in `tests/overclock-oc4.test.mjs` from the screens' own source): Memory 700 ms / stepMs / +150 ms, 260 ms taps;
  Color Clash 220 / 650; Odd One Out 350 / 750; Quick Count flashMs + 420 / 900; Signal Lock 900 / the seeded waits / 1200 / 950; Rewire 400 /
  1100 / 1300; Compass's constants. The answers' animations fit inside the existing beats (Memory's replay inside the 8-s screen's 3 s).

**The local run before the final push (the mini PC, nothing else busy):** unit **1242 / 1242** · rules **66 / 66** (database.rules.json
unchanged — nothing to re-publish) · `/api` server.test **38 / 38** · smoke **6 / 6** · e2e-oc-2 **27 / 27** (8 phones — Compass's N / E / S / W
+ its new answer) · e2e-oc-new **75 / 75** (8 phones — REWIRE + ODD ONE OUT with REAL finger taps: the blue stage 2, a refresh mid-circuit, the
found cell white-hot, a wrong cell's real crack at the finger + the odd one green, THE ANSWER's rows + why) · the no-sideways guard **258 / 258**
(86 screens × 390 / 402 / 430) · 60 fps at 390 × 844 (dpr 3) on Rewire's flow + surge, Quick Count's flash, Signal Lock's GO, five cracks in a row,
Odd One Out's misses, Memory's playback — also at 4× CPU (16.7 ms p50 / ≤ 16.8 ms p95; 1 frame over 25 ms in Rewire, 2 in Odd One Out as a new
36-cell grid is built) · the harbor's `shell` group **8 / 8** (☰ → SETTINGS → CREDITS — the one console file touched is `js/ui/credits.js`, a
credit line of data) → the ci tag; the full harbor suite was not run (no City 2.0 file changed).

**THE MOTION PROOF:** `Downloads/neon/overclock/shots/` — `oc4-crack-*` (the crack's refine strips at real size: a tile, True or False + a
recording) and `oc4-proof-*` (8-frame strips + recordings): the crack on a tile, on a cell (Odd One Out), Rewire's surge, Memory's playback,
Signal Lock's GO, the Rewire + Compass demos.

**Known issues / held back**
- The crack's refraction splits the tile's LABEL only; a big number on a Higher or Lower card or a pad's field splits too, but a badge / an icon
  never does. Odd One Out's cells + Memory's nodes have no label (the crack + the red glow carry it).
- At 4× CPU a new 6 × 6 Odd One Out grid (36 cells of SVG) can cost a frame or two as it's built (between grids, never during a tap).
- `shots.mjs --until` doesn't apply to a `--page` cast (the cast films from the page's ready) — a moment that comes by itself is filmed with a
  wider cast window + `--cast-from`.
- `tests/integration/e2e-stage2.mjs` + `e2e-8p.mjs` (retired suites, not in any run) still tap the pre-OC3 / pre-OC4 screens.

### OC5 — DUMB LUCK + SOLO + THE DAILY PLUG-IN (Nov 6, 2026)
**What shipped**
- **Group 0 — housekeeping:** `tests/integration/e2e-8p.mjs` + `e2e-stage2.mjs` (retired, in no run, tapping the pre-OC3 / pre-OC4 screens)
  DELETED — `e2e-oc-2` + `e2e-oc-new` already play OVERCLOCK on 8 phones (+ OC5's `e2e-oc-luck`); docs/testing.md updated.
- **Group 1 — DUMB LUCK's RULES (no pixels; `luck.js`, `tests/overclock-oc5.test.mjs`):** the fixed field of SIX (PINK · GREEN · CYAN · YELLOW
  · PURPLE · ICE WHITE — no orange), the odds 2-1 3-1 4-1 5-1 8-1 12-1 shuffled across the colours per race (seeded). HONEST ODDS: the implied
  chances 1/(n+1) normalised to 1 = the real win chances; PAYOUTS 20 × (n+1) = 60 · 80 · 100 · 120 · 180 · 260 — every pick EXACTLY the same
  expected value (≈ 17.6), proven on a 200,000-race simulation. THE DRAW after the lock (the seed + the challenge + every locked pick + the
  lock's ms), stored ONCE (`game/dl/{ci}: { pk, lk, w }`) — a new host never re-draws. THE RACE SCRIPT (pure: the winner + the seed → every
  horse's position, 10,000 scripts: the winner first, nobody teleports or runs backwards, a lead change in > 90 %, ~20–25 % photo finishes, the
  early leader fades). PLACEMENT in `buildOrder(…, { luck })`: at most once, never last, never solo (one participant) or the daily; Quick /
  Standard / Marathon like any type (Marathon = the 19 once + 5 skill repeats; solo = the 18 + 6). The combo + FASTEST ignore it; LONG SHOT =
  the victory's first award chip. THE HORSESHOE: `core/match-report.js#overclockExtra` → `horseshoe` (→ `overclock-horseshoe`) when this player
  backed the winner of a race the server REPLAYS from the record (`luck.js#dlVerify`: the draw + every payout), 2+ players; its achievement +
  its emblem `emb-horseshoe` in `api/_lib/catalog.js` (33 achievements).
- **Group 2 — DUMB LUCK's SCREENS (`ui/dumbluck.js`, `dlsign.js`, `horse-frames.js`):** THE SIGN — DUMB (pink) over LUCK (amber) in the city's
  tube alphabet on the title slam (the kit's slam took an optional `nameEl`), each letter its own stutter, the unlit glass first, a synthesized
  neon HUM (`sfx.js#ocHum`). THE ODDS BOARD — six slanted cards in the horses' own colours: the lane, the name, the odds BIG, PAYS n, a small
  neon horse (the same traced frame), name tags ("ALICE +3"); your card FILLS with its colour + breathes; the gate's countdown + bar. THE HORSES —
  `scripts/build-dl-horses.py` traces Muybridge's 1878 photos (public domain): a threshold, an opening that wipes the grid + the numerals, the
  ground cut, the horse's own component, its outline + the gaps between crossed legs, simplified → 12 frames (11 the gallop, 1 standing) in one
  shared box (27 KB). At 60 pt a leg's outline is narrower than the tube, so it draws as ONE thick bright tube. Each frame pre-rendered ONCE per
  colour (a sprite sheet: the glass fill, the soft glow, the tube, a white-hot core) + a breathing halo for yours + a white one for the winner.
  THE RACE — Canvas 2D, the camera on the leader (the track ≈ 10 screens long, its posts scrolling), six lanes ~58–62 pt, the frame flips with the
  distance run, the gate stalls at the start, the checkered neon finish line; your horse pulses, your lane breathes in its colour, your number
  wears a white ring, the YOU tag (on trial); the RUNNING ORDER strip + the callouts (AND THEY'RE OFF! · PINK LEADS · THE FINAL STRETCH). THE
  FINISH — the freeze, the white flash, PHOTO FINISH, the winner's colour over the whole screen, LONG SHOT! + the rays for an 8-1 / 12-1, the
  result under the track (in a reserved slot — nothing jumps): WINS · the odds, the payouts (yours in your horse's colour), YOUR TICKET PAYS / YOUR
  HORSE · 4TH. The shared flow: THE ANSWER (the winner, YOUR HORSE struck when it lost, the finishing order with who backed each), WINNING
  TICKETS: YOU · LEO / THE HOUSE WINS, the standings (HAD PINK / NO TICKET; a long shot's rank jump slower + bigger). Spectators watch the race.
  The sounds 19–23 (lazy, `DL_FILES`; the hooves a gapless buffer loop, the crowd swelling down the stretch). HOW TO PLAY's lines.
- **Group 3 — SOLO:** THE QUICK SOLO PERSONAL BEST — the new board `overclock-quick-solo` (`core/boards.js`), computed by the server from the
  room's record (`match-report.js`): a solo QUICK run, all six, six real skill challenges, every result ≤ THE SCORING TABLE's ceiling for its
  ok / parts (`logic.js#ptsCeiling`, ×2 on the last) — else refused. STANDARD's solo board unchanged. The report's outcome now carries `bests`
  (`api/_lib/stats.js`) → the solo victory: NEW PERSONAL BEST (beaten) · YOUR SCORE + YOUR BEST (not) · just the score (/api down).
- **Group 4 — THE DAILY PLUG-IN, OFF (`daily.js`):** `daily = { on: false, create, resumeKey, result, replay, problems }`. `create({ date, uid,
  now, daySet, code })` — the NEW `daySet` slot (docs/cartridge.md): `{ v: 1, day, seed (opaque — the module's secret, never the date), order (six
  skill challenges, ONE PER BRAIN CATEGORY — a knowledge one, never DUMB LUCK), deal?, trivia? (three own-bank questions) }` → a solo QUICK match,
  fully deterministic (no Math.random, no live Trivia API). `resumeKey` = one try a day; a lock / a refresh resumes the stored run. `result` =
  the points + the total answer time (lower wins) + ONE comparable rank number; `replay` = the server re-scores a finished record.
- **Group 5 — THE LOOK REVIEW:** `overclock-preview.html` (`type=dumbluck` · `at=brief|play|race|finish|answer` · `&picks=none|mine|crowd` ·
  `&t=` · `&win=long|house|you` · `&photo=1` · `&freeze=1` (the fake server clock held) · the solo victory's `&pb=new|best`); three rounds at
  390 / 412 / 1440; the no-sideways guard's `luck` group; the motion proof.

**Decisions (OC5)**
- **HONEST ODDS + THE PAYOUTS:** payout = 20 × (n + 1) — the only whole-point table with EXACTLY equal EV; in challenge units (100) 0.6 · 0.8 · 1
  · 1.2 · 1.8 · 2.6 (the plan's 0.5 / 2.5 ends can't be honest). They don't change with the match's length — like every challenge's points,
  so Dumb Luck weighs one challenge in any mode. The card shows **PAYS 260** (points — what the finish + the standings show) where the plan's
  mock said "PAYS n×" (a multiplier of nothing a player sees).
- **THE DRAW** = a hash of the match seed + the challenge + every locked pick + the lock's server ms (the host's tick after the 7-s board):
  nothing a phone sees before the lock fixes it (the test: over every ms a lock could land on, each horse comes up at its odds; one ms later
  is a fresh draw). Stored once; the server replays it. (A hacked HOST could re-roll inside its own tick — the same trust as every result
  a host writes; the plausibility bounds stay.)
- **A PICK RIDES THE BOARD's EXISTING FIELDS** (`p = lane + 1, n = 6, ok 0, done false`) — no rules change, nothing to re-publish, works on the
  published rules. The board is public (the name tags need it); the race's result lives in the game only after the lock.
- **THE SLOT:** the odds board 7 s → the race 16 s (from the lock) → THE FINISH 4 s = 27 s, `phaseEndsAt = start + DL_MS` (inside CHALLENGE_MS;
  it never ends early); then the shared 8-s after-screen (THE ANSWER → WINNING TICKETS → the standings). No existing timing changed.
- **PLACEMENT:** at most once (a long match's repeats are skill challenges), never last (the ×2 final stays skill), never with one player, never
  the daily. Its night key `t-dumbluck` joins the rematch preference.
- **THE HAND-OFF:** WINNING TICKETS for one or many (the OVERDRIVE stamp); the ROUND WIN rule is unchanged — a shared ticket is a tie (no
  sole round win; REDLINE counts it the same), nobody = THE HOUSE WINS.
- **THE HORSESHOE's ART is THE LAB's (the city chat):** the emblem ships as a catalog item with a placeholder glyph (∩) and NO lab row —
  `tests/vault-2b.test.mjs#PENDING_ART` names it; Grok's `04-horseshoe.jpg` is in `Downloads/grok/overclock-cards/` for that pass.
- **THE QUICK SOLO BOARD's BOUND** = the scoring table per result (not a flat 560): a solo QUICK record no real run makes is refused.
- **THE DAILY's SCORE** = the points, the tie-break = the total answer time (a challenge never finished = its 30 s); `rankOf(score, time)` = ONE
  number for the module's percentiles. `replay` re-scores from ok / parts / time (what every match's server bound trusts: the per-part answers
  stay the module's to seal).
- **The horses:** traced from the PHOTOS (never the tiny reversed silhouettes); outlines, not a skeleton — at 60 pt a thin part's outline IS a
  thick tube. Lanes in a FIXED colour order (lane 1 PINK … 6 ICE WHITE) so the room can yell colours + lane numbers.
- **The YOU tag** in the lane = a white pill ("YOU" / "YOU +2") — still ON TRIAL (the owner judges it in play).

**The local run before the final push (the mini PC, one suite at a time):** unit **1261 / 1261** · rules **66 / 66** (database.rules.json
unchanged — nothing to re-publish) · `/api` server.test **38 / 38** · smoke **6 / 6** · e2e-oc-2 **27 / 27** (8 phones) · e2e-oc-new **75 / 75**
(8 phones) · e2e-oc-luck **20 / 20** (8 phones — a whole race, a refresh + the host killed mid-race) · the profile E2E **98 / 98** (REDLINE +
PHOTO FINISH still unlock; THE HORSESHOE granted to the backer only; THE QUICK SOLO BOARD + NEW PERSONAL BEST / YOUR BEST) · the no-sideways
guard **312 / 312** (104 screens × 390 / 402 / 430 — 18 of them Dumb Luck's) · 60 fps at 390 × 844 (dpr 3): the race 0 long frames at 1× and 4×
CPU, the odds board 0 at 4× · the FULL e2e-harbor suite **1203 / 1204**: `roomperf`'s guest-list cost at 4× CPU (40 → 44 ms alone — the same
red OC1 logged on this machine before any Overclock change; no room / city file changed in OC5) + the `motion` group timed out under the
four shards' load ("the circle formed") and passes alone (7 / 7). Console-side files changed (core/boards.js — THE BOARD's new QUICK · SOLO
board, api/_lib/stats.js's `bests`, kit/slam.js's `nameEl`, the contract's comment, HOW TO PLAY, the shared fake-firebase's clock hook) → the
harbor tag.

**THE MOTION PROOF:** `Downloads/neon/overclock/shots/oc5-proof-*` — 8-frame strips + recordings: the sign powering up, a full race (19.5 s, 60
fps cast), a photo finish, a LONG SHOT!.

**Known issues / held back**
- At 4× CPU THE FINISH's own instant (the freeze + the result's DOM) costs one frame over 25 ms; the race itself 0.
- THE HORSESHOE emblem shows its placeholder glyph until THE LAB draws + approves its art.
- No CHEER button (optional in the plan, not this pass); no marquee bulbs (by design).
- The daily's `replay` re-scores from the per-challenge record (ok / parts / time) — answer-level replay is the daily module's (it seals them).

### OC6 — CONTENT A: TRUE OR FALSE + THE FACT POOLS (Nov 6, 2026)
**What shipped**
- **Group 0 — THE BUILD SCRIPT + THE SHAPES:** `scripts/oc-pools/` (docs/content.md "THE POOL BUILD") — `build.mjs` + its parts, WIKIDATA through the
  public SPARQL endpoint with a polite User-Agent and every answer CACHED (`cache/wd/` — a rebuild works offline, the output byte-identical), THE
  SOURCE CHECK for written rows (`sources.mjs` — the proof must be in the named Wikipedia article; verdicts in `cache/checks.json`). TRUE OR FALSE
  left `challenges.js` for `data/oc/truefalse.json` (`{ id, t, f, src, cat }`; `genTrueFalse` keeps its 4 fact + 4 math slots and the pair-based
  truth flip). TIMELINE became THEME POOLS (`{ theme, ask, dir, unit?, items: [[label, value, shown?, id]] }` — `tlDeal` deals four, pairwise
  10+ years apart (a size theme 1.3×), seeded; the screen + scoring as OC3B built them). HIGHER OR LOWER + SORT IT became objects with ids.
  STABLE IDS everywhere a deal or the night memory points (`deal.js`: `tf-<id>` · `hl-<stat>-<item>` · `tl-<theme>-<item>` · `so-<set>`; an old
  night's keys simply stop matching); the daily's day set takes ids. US UNITS on screen from metric data (`units.js`). `scripts/build-timeline.mjs`
  retired.
- **Group 1 — THE DATA-BUILT POOLS (Wikidata, CC0):** HIGHER OR LOWER's stats (heights, lengths, areas, depths, the 2020 census, temperatures,
  years; the FAME FILTER in every query — the owner's add-on); the YEAR stats feed TIMELINE too (each item to ONE of the two, a hash of its Q-id)
  + SIZE themes (a third of a quantity stat's items order by size); TRUE OR FALSE's data half from natural templates (capitals, continents,
  element symbols, who painted / wrote / directed / recorded it, moons, places, decades, centuries, comparisons — several phrasings each, a cap per
  template).
- **Group 2 — THE WRITTEN POOLS (sourced):** TRUE OR FALSE's written half in 13 batches (`written/tf-<cat>.json`), every row checked against its
  Wikipedia article; SORT IT's computed sets (`sortcheck.mjs`), data sets (Wikidata with a margin round every cut-off) and written sets.
- **Group 3 — THE DAILY RESERVE:** ~20% of every pool SERVER-ONLY in `api/_data/oc-reserve/` (docs/cartridge.md D2); `daily.js#dayContent`
  (show = the texts, key = the answers); the local server answers 404 for every non-function `/api/` path, as Vercel does.
- **Group 4 — THE CHECKS:** `tests/overclock-content.test.mjs` + `tests/overclock-reserve.test.mjs`; the spot-check sheet
  (`Downloads/neon/overclock/oc6-spotcheck.md`); five deals of each challenge looked at on the preview at 390 (`&seed=`); the no-sideways guard.
- **Group 5 — THE OWNER's ADD-ON (Nov 6, during the pass):** the Wikidata timeouts → THE FAME FILTER inside every query (sitelinks ~30+ for
  creative works, ~15+ for places, tuned per stat) + a fame-first second form of each query (`hint:Query hint:optimizer "None"`) that the
  million-item classes need; the skipped stats re-run (albums, novels, paintings, companies came back).

**THE POOLS (before → after; the party files + THE DAILY RESERVE)**
| | before OC6 | after OC6 | shipped (party) | reserve |
|---|---|---|---|---|
| TRUE OR FALSE | 36 pairs | **2,398** (1,229 data-built from 27 templates · 1,169 written) | 1,907 | 491 |
| HIGHER OR LOWER | 18 stats · 597 items | **46 stats · 1,727 items** | 1,403 items | 324 items |
| TIMELINE | 190 fixed sets of 4 | **32 theme pools · 917 items** (four dealt per round) | 726 items | 191 items |
| SORT IT | 48 sets | **178 sets** (36 computed — 6 of them OC1–OC5's · 18 data · 85 written · 39 more kept from OC1–OC5) | 146 | 32 |

THE WRITTEN STATEMENTS: 1,207 written → **1,181 confirmed** by their source → **26 dropped** (the proof not in the article — never kept on trust);
the all-ages filter dropped 7 more, 11 were duplicates of another statement. The hand items kept from OC1–OC5: 86 of 99 confirmed.
SIZES: the shipped pools ≈ 480 KB raw (TRUE OR FALSE 317 KB, ≈ 75 KB gzipped) — NOT in `preload()` any more: each loads only for a match that
deals it; the preload is 605 KB of its 1.5 MB. The reserve 123 KB. The committed caches ≈ 1 MB (`cache/wd` 0.9 MB + `checks.json`).

**Decisions (OC6)** — the owner's four (Nov 6): DATA FIRST (Wikidata CC0; written rows each checked against a source, unconfirmed = dropped) ·
US-FIRST (metric data, US units on screen) · POP CULTURE YES, LASTING ONLY · ALL AGES. Plus THE DAILY RESERVE (~20% server-only).
- **"Checked against its source" = automated + honest:** each written row names its Wikipedia article and the words that article must contain (the
  proof — `"eight legs"`, `"canberra&capital"`); the build fetches the article's text and DROPS a row whose proof isn't there. A proof may be
  re-worded when the article says the same fact in other words; the fact itself is never forced through. (It confirms the TRUE statement; each
  false twin is written as an exclusive swap of it — eight legs → six — so it can't also be true.)
- **Wikidata's values come NORMALIZED to SI** (metres, square metres, kelvin) — stored as m / km / km² / °C; an item whose best-ranked values
  disagree by more than 3% (years: more than 3 apart) or whose date is less precise than a year is ARGUABLE → out.
- **THE FAME FILTER (the owner's add-on):** sitelinks in every query, tuned per stat; each query in two forms (the planner, then fame-first with the
  planner OFF) — the cache keeps whichever answered. Kept: one query at a time, 3 s apart, a 429 waits as long as the server asks.
- **What the data forced out (read by hand, `hand/wd-exclude.mjs`):** Wikidata's occupations are broad (a "scientist" who was a prime minister, a
  "writer" who ruled a country) → the six people lists became ONE (BIRTHDAYS / WHO WAS BORN FIRST?) and anyone also listed as a politician,
  ruler, soldier, revolutionary or cleric is out; the songs class holds anthems + chants of hate → no songs; nude paintings, adult cartoons,
  explicit bands, a death-themed ride, Holocaust sites (the museums stat — dropped), a fictional president, a film called "2012", future launches;
  stats whose numbers proved arguable or obscure: waterfalls, deserts, dams, lighthouses, statues, universities' founding years, capital-city
  populations (city limits counted differently), the planets + moons diameter (only catalogue numbers came through). Films + games only with a
  family rating (G / PG / PG-13 · E / E10+ / T).
- **THE YEAR STATS FEED TWO CHALLENGES** — each item to ONE (a stable hash of its Q-id): HIGHER OR LOWER never shows what a TIMELINE showed.
  TIMELINE also orders SIZES (as OC1–OC5's pools did): a third of a quantity stat's items, by height / length / area / population.
- **THE TEMPLATE CAP:** 85 statements a template (< 8.5% of the data half) — a template's several phrasings rotate.
- **THE BIG POOLS LOAD WHEN DEALT:** `preload()` no longer fetches TRUE OR FALSE / HIGHER OR LOWER / TIMELINE / SORT IT (≈ 500 KB) — the host's
  `start()` and every phone's view at mount load exactly the pools the match's order deals, during the rules card + the 3-2-1.
- **THE RESERVE's PLACE:** `api/_data/` — Vercel serves `api/` as functions only (the repo's precedent: the item catalog in `api/_lib/`); the
  local server now does the same (404). The repo is PUBLIC until the launch, so GitHub shows the reserve: the site never serves it, and before
  the dailies go on the repo goes private (the owner's plan) or the module keeps the reserve elsewhere.
- **ALL AGES in Sort It:** COFFEE DRINK / COCKTAIL (alcohol), CHESS / POKER (gambling) and WON BEST PICTURE (R-rated films) left the pool.

**The local run before the final push (the mini PC, one suite at a time):** unit **1276 / 1276** (incl. the new `overclock-content` +
`overclock-reserve`) · rules **66 / 66** (database.rules.json unchanged — nothing to re-publish) · `/api` server.test **38 / 38** · smoke
**6 / 6** · e2e-oc-2 **27 / 27** (8 phones) · e2e-oc-new **75 / 75** (8 phones) · the no-sideways guard **57 / 57** (TRUE OR FALSE, HIGHER OR
LOWER, TIMELINE, SORT IT × 390 / 402 / 430) · the offline rebuild byte-identical (8 / 8 files). No City 2.0 / console file changed (Overclock's
own files, the pool scripts + data, the dev server's /api rule, tests, docs) → the harbor suite not needed; the ci tag.

**Known issues / held back**
- THE RESERVE is in the PUBLIC repo until the launch (the site never serves it; GitHub shows it) — the repo goes private before the dailies go
  on, or the daily module keeps it elsewhere (docs/cartridge.md D2).
- The answer-less daily path (the phone gets `show`, the server judges each item with `key`) is THE DAILY MODULE's to wire: today's challenge
  screens still judge on the phone, as every party match does.
- 26 written statements didn't pass their source check and are out (`node scripts/oc-pools/build.mjs --offline --failed` lists them) — some
  are true but the article words them differently; a later pass may re-word their proofs.
- Wikidata's moons sit under sub-classes the query doesn't reach → the "X is a moon of Y" template is empty; iron + gold are missing from the
  temperature stats (their values disagree across sources → arguable → out).
- A few data-built items are better known abroad than in the U.S. (a stadium, a bridge, a cartoon); the fame filter keeps the best-known — the
  spot-check sheet is the place to flag any.
- One small look change, kept to what Group 4 asked for: a SORT IT card sizes its text to fit the longest WORD too (never a mid-word break).


### OC7 — CONTENT B: THE OWN TRIVIA BANK + CLOSEST CALL, MISSING LINK, SPELLCHECK (Nov 7, 2026)
**What shipped**
- **Group 0 — THE SHAPES + THE IDS:** TRIVIA LIGHTNING left the live trivia service — its OWN bank (`data/oc/trivia.json`), dealt by id like
  every pool: no question bank in the room (`game.bank` / `trivia` / `tq` / `tUsed` gone), no top-up, `prepare()` empty, the director's
  wait-for-trivia fallback gone. `js/trivia/` + `data/trivia/fallback.json` UNCHANGED for LAST SIGNAL, HIGH STAKES, BLUFF (hash-pinned by
  `tests/overclock-oc7.test.mjs`). The four OC7 shapes (docs/content.md "THE POOL BUILD"); the deal + THE NIGHT MEMORY by id (`tv-` `cc-` `ml-`
  `sp-`); TRIVIA's three questions = an easy, a medium and a medium-or-hard over three categories, fresh ones first (`deal.js#tvPick`); the
  daily's trivia = three ids in the day set; every pool lazy. The build gained the OC7 rules + reserve split, the dictionaries (SCOWL Hunspell
  en_US + en_GB, ENABLE — `scripts/oc-pools/dict/`), the join check (`phrases.mjs`), the hard letters (`spell-rules.mjs`).
- **Group 1 — THE DATA-BUILT POOLS (Wikidata, CC0, the fame filter inside every query):** CLOSEST CALL from 17 stats; TRIVIA's data half from 26
  templates — wrong answers from the SAME CLASS at a similar fame, never an alias of the right one, one-value facts only; by-hand exclusions in
  `hand/oc7-exclude.mjs` (obscure, arguable, not all-ages, ambiguous names; whitelists for the noisy templates).
- **Group 2 — THE WRITTEN POOLS (sourced + checked, dropped when unconfirmed):** TRIVIA's written half in 20 files (`written/tv-<cat>.json`), each
  row checked against the Wikipedia article it names; SPELLCHECK from a candidate generator (`spell-gen.mjs` — everyday words with a real trap,
  believable misspellings; Wikipedia's list of common misspellings ranks them) read by hand + the dictionary checks; MISSING LINK written by
  hand (+ the best of `ml-gen.mjs`), every join checked, each clue's side recorded, THE ONE-ANSWER RULE.
- **Group 3 — THE RESERVE + THE ANSWER SCREENS:** the reserve covers all eight pools (docs/cartridge.md D2 — the eight files, the id shapes,
  what a phone may see per challenge); MISSING LINK's answer + its rules-card demo show the WHOLE word or phrase with the link LIT
  (`shared.js#joinedWord` — SUN|FLOWER · FIRE|WORK · DINNER BELL; the neutral tube only for a row with no side, and the bank has none);
  SPELLCHECK's underlines from the row's `hard` (`answers.js#hardMarks`). The look: five deals of each of the four challenges (play + answer) at
  390 on the preview (`Downloads/neon/overclock/shots/oc7/` — the contact sheets); the read dropped 35 lifespan questions (obscure writers +
  thinkers, a living actor with a death date on file, a pope, political figures).
- **Group 4 — THE CHECKS:** `tests/overclock-content.test.mjs` + 10 OC7 checks (sizes + the mix; ids, prefixes + sources; the reserve's
  ~20% agreeing with the build's split; no duplicates within + across the pools; the phone limits; trivia wrongs never an alias; every MISSING
  LINK side recorded + every join real; SPELLCHECK's dictionary checks + `hard`; all-ages; US units); the spot-check sheet
  (`Downloads/neon/overclock/oc7-spotcheck.md` — 60 items) + what its read turned up (the Empire State Building's height + Tower Bridge's
  "main span" = arguable → out; HAPPY HOUR → LUNCH HOUR / HAPPY CAMPER; Efteling out). The checks also caught: 8 legacy Spellcheck rows with
  a rude run of letters (passtime, assend …) → the legacy part now runs that check too; the WHICH OF THESE IS THE LARGEST template repeating
  its winner (dropped as duplicates) → each set's winner once per stat. The preload test's fallback still listed OC6's small banks → none.

**THE POOLS (before → after; the party files + THE DAILY RESERVE)**
| | before OC7 | after OC7 | shipped (party) | reserve |
|---|---|---|---|---|
| TRIVIA LIGHTNING | the live service + a 333-row bundled bank | **4,184** own (2,001 data-built from 26 templates · 2,183 written; 41% easy · 40% medium · 19% hard) | 3,362 | 822 |
| CLOSEST CALL | 175 | **989** (17 Wikidata stats) | 806 | 183 |
| MISSING LINK | 283 | **650** (245 kept from OC1–OC5 · 405 new) | 539 | 111 |
| SPELLCHECK | 434 | **1,557** (426 kept from OC1–OC5 · 1,131 new) | 1,263 | 294 |

WRITTEN vs KEPT: TRIVIA 2,293 written → **2,225 confirmed** by their Wikipedia article (64 the proof not there · 4 no such article) → 2,183 after
the build's rules (duplicates of a data row + the all-ages filter). MISSING LINK 606 written → **491** with every join on record (115 dropped:
a join with no dictionary word / Wiktionary entry) → 405 new after the duplicates of a kept legacy answer; the OC1–OC5 rows 283 → 245 (38 a join
not on record). SPELLCHECK 1,150 picked → **1,132** (18 excluded by the read); the OC1–OC5 rows 434 → 426 (8 a rude run of letters).
SIZES: the party files trivia 668 KB (150 KB gzipped) · closest 116 KB · missinglink 92 KB · spellcheck 184 KB — all LAZY (each loads only for a
match that deals it); `preload()` = 560 KB of its 1.5 MB (sounds 305 · fonts 65 · words 190 · no bank) + the crack textures. The reserve
≈ 380 KB (all eight files).

**Decisions (OC7)** — the owner's three (Nov 6): the live trivia service OUT of Overclock ONLY · MISSING LINK = compound words AND two-word
phrases, each side recorded, the WHOLE word on the answer · SPELLCHECK = American, every right one in a dictionary list, every wrong one NOT a
word, `hard` drives the underlines.
- **The dictionary lists (SPELLCHECK + MISSING LINK):** Hunspell en_US (the RIGHT spelling — American) + en_GB from SCOWL (`dictionary-en`
  4.0.0 / `dictionary-en-gb` 3.0.0, MIT-like licence committed), expanded with their .aff rules; ENABLE (public domain). A wrong spelling may be
  a word in NONE of the three; a right one with a second accepted American spelling (judgment / judgement) is out.
- **A MISSING LINK join is real when:** a one-word join is in en_US or ENABLE; a two-word join has its own Wiktionary entry (the titles dump —
  31 MB, uncommitted — re-downloaded on a rebuild; every verdict committed in `cache/phrases.json`, so the tests need no download).
- **THE ONE-ANSWER RULE:** another word that fits all three clues as one-word compounds is ACCEPTED (`accept`) — never a wrong answer for a
  right idea.
- **THE HARD LETTERS:** the letters the row's MOST COMMON misspelling gets wrong (an edit script against the right word) — the first wrong
  option is that misspelling.
- **TRIVIA's mix:** ≈ 40 / 40 / 20 easy / medium / hard; a match deals one easy, one medium, one medium-or-hard (60% hard), three categories.
- **ONE FACT ONCE:** a written trivia row that only repeats a data template (a capital, a city's country) was left to the data half; no question
  twice across TRIVIA + CLOSEST CALL, never a TRUE OR FALSE statement as a question.
- **The lifespans (CLOSEST CALL):** both dates to the day, a natural death, no politicians / clerics, no one a casual American wouldn't know
  (the read's list in `hand/oc7-exclude.mjs#LIVED_EXCLUDE`); Wikidata's death dates on living people are caught by hand (Dolly Parton, Chuck
  Norris).

**The local run before the final push (the mini PC, one suite at a time):** unit **1294 / 1294** (incl. the 10 new OC7 content checks + `overclock-oc7`; HIGH STAKES · LAST SIGNAL · BLUFF · the shared trivia **49 / 49**) · rules **66 / 66** (database.rules.json unchanged — nothing to re-publish) · `/api` server.test **38 / 38** · smoke **6 / 6** · e2e-oc-2 **27 / 27** · e2e-oc-new **75 / 75** · e2e-oc-luck **20 / 20** (8 phones each; its REFRESH check's floor was 4 s into the race — the test waits 2.5 s, and OC7's lighter preload brings the phone back at 3 s: the floor = the wait now) · the no-sideways guard **312 / 312** (every Overclock screen × 390 / 402 / 430) · the offline rebuild byte-identical. HIGH STAKES' E2E can't start its match (the game is hidden since WINDOWS — the console refuses it, as designed); SIGNAL + BLUFF have no E2E since WINDOWS — their code + `js/trivia/` + `data/trivia/fallback.json` are untouched and hash-pinned. Nothing outside Overclock's own files, the pool scripts + data, tests and docs changed (+ .gitignore) → the harbor suite not needed; the ci tag.

**Known issues / held back**
- MISSING LINK is **650**, short of the ~1,000 target: every puzzle must have three real joins + one answer, and the generator's phrases were
  poor (web jargon, rude words), so the pool is hand-written; the next ~350 are a writing job for a later pass (the format + the checks are ready).
- THE RESERVE is still in the PUBLIC repo (as OC6): the site never serves it; the repo goes private before the dailies go on, or the daily module
  keeps it elsewhere. **For the city chat:** the daily module's server reads all EIGHT files now and calls `dayContent` — trivia arrives as three
  ids in the day set (no question text), and missing link's `show` holds only the three clues (the answer's length is the module's to send if
  its screen wants the "N LETTERS" hint).
- 68 written trivia rows didn't pass their source check (`node scripts/oc-pools/build.mjs --offline --failed`) — some are true but worded
  differently from their article.
- MISSING LINK's `accept` lists come from the dictionary and include a few odd forms (TIDE + EST, PROOF + PROOFED) — they only ever ACCEPT a
  typed word, never show one.
- A few data-built questions are better known abroad (a European city, a park) — the spot-check sheet is the place to flag any; the read so far
  dropped 37.

### OC8 — THE FIX PASS (THE FABLE REVIEW) + THE MISSING LINK TOP-UP + THE OWNER's ADD-ON (Nov 7, 2026)
THE FABLE REVIEW (`Downloads/neon/overclock/FABLE-REVIEW.md`, Nov 7) found OVERCLOCK "close to the bar, not at it": 0 game-breaking, 10 serious,
22 polish, 4 broken content templates. OC8 fixed PART A (the game) + the CONTENT section, topped MISSING LINK up, and did the owner's mid-pass
ADD-ON (the corner buttons split on every screen). PART B (console / cards / board / profile) stays the city chat's — except B1's Overclock half.

**What shipped**
- **Group 0 — THE PREVIEW TELLS THE TRUTH (A21):** `overclock-preview.html` gained the real app's two corner buttons (the console's markup,
  placed by components.css; `&corner=0` hides them), `&beat=victory` lands AT REST (the podium's slim cards + the award chips in place; `&anim=1`
  = the live power-up), `at=right|wrong|close` HOLD the feedback (the screen's ≥ 400-ms timers wait, the motion pauses mid-way — the shot lands
  after the tap; `__preview.release()`), `&zero=1` (nobody scored), `&lost=1` (this device lost its picks).
- **Group 1 — SERIOUS:** A1 the after-challenge screen starts below the corner buttons · A4 THE ANSWER centred in its box (auto margins — the
  long ones still scroll from the top) · A2 NOBODY SCORED (no sign, no stamp, no fanfare, no podium, no rays; a solo 0 = no personal-best line) ·
  B1 (Overclock's half) a solo run with nothing answered / a total of 0 is never a record (and never a cheat) · A3 Dumb Luck's LOCK GRACE (the
  phone closes the cards at 7.0 s, the host locks at 7.7 s — `DL_LOCK_MS`; `DL_MS` 27.7 s) · A5 the rematch deals ONLY fresh types while a whole
  match of them remains · A6 the ORDER from the match id (`deal.js#orderFor` — every phone predicts the first challenge from meta/go and its
  `preload()` fetches that pool in the walk), `start()` waits for each bank on its own up to the walk, THE LATE DEAL (`prepare()`) deals a pool
  that missed `start()` before its challenge opens · A7 THE FINISH draws its frozen frame once and stops the race's loop.
- **Group 2 — POLISH:** A8 ANSWERED (never NO ANSWER) when this device lost its picks · A9 one sound palette (no console synth inside Overclock;
  the stage opts out of the console's button tap; a perfect finish plays one sound) · A10 YOUR WORST never a challenge nobody scored / a worst that
  topped the room · A12 solo Closest Call's +60 only for a DEAD ON guess · A13 Sort It "a wrong or missed card" · A15 no `vibrate()` · A16 a lane
  tag with no room behind its horse rides above it · A18 Higher or Lower's chips wrap (two lines, a smaller face past 12 letters).
- **Group 3 — CONTENT (the template, not the row; rebuilt through scripts/oc-pools/):** athletes by occupation, the instrument template cut,
  "the 20th century", episodes cut, THE FAME FILTER tightened (hand/oc8-exclude.mjs), directors + inventors by their own fame, the review's items by
  id, the four awkward written rows reworded — docs/content.md "OC8".
- **Group 4 — MISSING LINK 650 → 977:** 344 hand-written (hand/missinglink-written-6…10.json) → 323 kept; the build decides a duplicate AFTER the
  rules (+4 older puzzles freed); 13 older clues that weren't words replaced; every clue must be a word on its own (the content test).
- **Group 5 — THE LOOK CHECK:** three rounds on the fixed preview WITH the corner buttons — every after-challenge beat of all 19 at 390 + 412,
  1440 once, NOBODY SCORED, the Dumb Luck finish (60 fps at 4×), the lane tags, the Higher or Lower chips; what it caught went back into the
  content (skyscrapers + mountains by hand, everyday elements, "Go board").
- **Group 6 — THE OWNER's ADD-ON (Nov 7, 8:29 am):** the corner buttons SPLIT ON EVERY SCREEN — ☰ top-left, music top-right (components.css
  "SPLIT ON EVERY SCREEN"); every header makes room on both sides (`--cb-room`); OVERCLOCK's challenge name shrinks to fit (`view.js#fitName`);
  PRISM DROP's top line, setup, THE BOARD, the podium's kicker; the profile keeps its own rule (no ☰). Proof: `Downloads/neon/overclock/shots/oc8-addon/`.

**Decisions (OC8)**
- **THE LOCK GRACE is OC5's own timing, not an owner timing** (the prompt): `DL_PICK_MS` stays 7 s (what the phone shows), `DL_LOCK_GRACE_MS`
  700 (like `PLAY_GRACE_MS`), `DL_MS` 27.7 s; the pinned OC1 / OC3 / OC3B / OC4 timing tests pass unchanged (OC1's whole-match helper locks at
  `DL_LOCK_MS` now; OC5's slot test reads 27.7 s).
- **A11 — the Dumb Luck winner is readable at the lock:** `game/dl/{ci}.w` is written when the odds board closes — every phone needs it to run
  the race script — so a signed-in phone could read the winner ~16 s before the finish. NOT exploitable: the picks are locked in the same write
  and the payouts use them (`d.pk`); nobody can change a ticket after it. A true seal would need the script to run from a value revealed only at
  the finish (a bigger change than a fix pass; the plan's "seal-protected" means the PICKS).
- **A17 — THE YOU TAG is KEPT** (the review: the white pill is the only thing that finds your horse at a glance — the halo is subtle at 60 pt):
  no longer "on trial".
- **A6 — the order is predictable from the match id** (the deal + the race keep their own random seed): nothing a player gains — the order is
  public the moment the match is written, ~5 s later; a phone that guesses wrong (the night memory or the mode changed in the same second) only
  fetched a pool for nothing. `?emu` + `window.__ocFirst` puts a type first (the slow-network E2E). On Fast 3G the bank arrives in the walk on
  every phone (the host ~3.7 s, a joiner ~6.5 s; the challenge opens at ~12.3 s).
- **B1's line:** OVERCLOCK never writes a 0 or an unanswered solo run to a board; the solo XP + streak minimum is the console's (the city chat).
- **A9 — the mount sound:** the slam's GO is the challenge's opening sound (the console's synth `challenge` beside it is gone, not replaced).
- **A10:** a challenge nobody scored is nobody's worst; no tiles at all when you scored nothing.
- **The fame filter (content):** sitelinks can't rank a class Americans don't know (coasters, warplanes, Soviet probes, foreign zoos, obscure
  consoles) — those stats keep ONLY a by-hand list or are cut; the country questions ask only about the ~100 countries a player knows.
- **Not changed (owner decisions, as the prompt says):** A14 Compass's scripted time · A19 the answer tiles' height · A20 (no fix needed).
- **The ADD-ON's limits:** the frozen games (gridlock / slip / stakes / rum) still pin the old stacked pair in their own CSS — fix each when it
  comes back (CLAUDE.md says so); THE LAB (`/lab`) has no corner buttons.

**THE FABLE REVIEW → OC8, finding by finding**
| finding | | what OC8 did |
|---|---|---|
| A1 the after-screen under the corner | FIXED | every beat starts below the corner buttons (one row after the ADD-ON) |
| A2 a 0–0 match celebrated | FIXED | NOBODY SCORED body; solo 0 = no PB line (+ B1 server half) |
| A3 a last-second pick after the lock | FIXED | THE LOCK GRACE (+700 ms); E2E: a 6.9-s tap through a 300-ms-late phone gets its ticket |
| A4 the void under THE ANSWER | FIXED | centred (auto margins), long ones scroll |
| A5 the rematch repeated a type as its ×2 final | FIXED | fresh types only while a whole match of them remains |
| A6 a first pool on a slow line | FIXED | the predictable order + the walk's preload + per-bank waits + THE LATE DEAL; e2e-oc-slow.mjs |
| A7 THE FINISH ~45 fps at 4× | FIXED | the frozen frame drawn once — 60.1 / 60.2 / 60.2 fps, 0 long frames |
| A8 NO ANSWER after a lost tab | FIXED | ANSWERED |
| A9 two sound palettes | FIXED | one palette; a perfect finish plays one sound |
| A10 YOUR WORST "+0 · 0%" / "TOP OF THE ROOM" | FIXED | hidden in both cases |
| A11 the winner readable at the lock | DOCUMENTED | not exploitable (payouts use the locked picks) — above |
| A12 solo Closest Call's +60 | FIXED | only for DEAD ON |
| A13 Sort It's help line | FIXED | "a wrong or missed card" (HOW TO PLAY + the rules card) |
| A14 Compass's scripted time | NOT CHANGED | the owner's rule |
| A15 vibrate() | FIXED | gone |
| A16 a lane tag on its horse | FIXED | above it when there's no room behind |
| A17 the YOU tag on trial | KEPT | no longer on trial |
| A18 Higher or Lower chips truncated | FIXED | two lines / a smaller face |
| A19 the tiles sit high | NOT CHANGED | the owner's call |
| A20 a late rejoin's rules card | NOT CHANGED | no fix needed (the review) |
| A21 the preview's gaps | FIXED | corner buttons, the podium + chips at rest, the held feedback |
| B1 (Overclock's half) | FIXED | no 0 / unanswered solo record |
| C t-athlete (~17 of 39 wrong) | FIXED | athletes only, by occupation: 52 → 18 |
| C t-instrument | CUT | with musicians only it found nobody but composers |
| C d-century "the 1900s" | FIXED | "the 20th century" |
| C c-episodes | CUT | arguable counts |
| C the fame filter (places + people) | FIXED | hand lists + smaller top-n + known countries; directors + inventors by their own fame |
| C the flagged items by id | FIXED | every one gone or reworded (London Bridge + Rialto spans, Fleetwood Mac, m-base, m-fox, Imagine, Nils, The Castle, the 1938 Cup, Jebel Shams, White Nile vs Gambia, Robert Stromberg, Eswatini vs Togo, Nauru, Tuvalu, Gamla bron, Hiiumaa, Lake Neuchâtel, Alpenexpress Enzian, Kazbek, Baekdu, Donghai, the inventor wrongs, "made by Sony", the Four Corners, Roblox, the earthquake + watercolor wrongs) |

**THE POOLS (OC7 → OC8; party + reserve)**
| | OC7 | OC8 | what moved it |
|---|---|---|---|
| TRUE OR FALSE | 2,398 | **1,998** | century reworded (kept), director 85 → 29, mountain-in 85 → 17, maker 24 → 7, the comparisons on the tighter stats, the template cap 85 → 70 |
| HIGHER OR LOWER | 46 stats · 1,727 | **43 · 1,124** | coasters ×2 + airplanes cut; hand lists for 14 stats; smaller top-n; known countries |
| TIMELINE | 32 themes · 917 | **18 · 496** | the same stats feed it — a theme needs 30 (years) / 40 (sizes) items |
| SORT IT | 178 | **176** | the Beatles set without Imagine; one set too small after the fame filter |
| TRIVIA | 4,184 | **3,759** | athlete 52 → 18, instrument 36 → 0, director 183 → 38, inventor 29 → 14, cup-host 21 → 14, capital + capital-of 159 → 74, continent 144 → 73, language 66 → 35 |
| CLOSEST CALL | 989 | **889** | episodes 43 → 0, spans 20 → 12, peaks / towers / lakes / islands / atomic on the tighter lists |
| MISSING LINK | 650 | **977** | +323 hand-written, +4 freed |
| SPELLCHECK | 1,557 | 1,557 | — |
The reserve re-split (~20 % of each, server-only). Offline rebuild byte-identical.

**The local run before the final push (the mini PC, one suite at a time):** unit 1298 / 1298 · rules 66 / 66 · /api 38 / 38 · smoke 6 / 6 · e2e-oc-2 27 / 27 · e2e-oc-new 75 / 75 · e2e-oc-luck (8 phones) 22 / 22 · e2e-oc-slow 10 / 10 (+ LATE=1 10 / 10) · NO SIDEWAYS SCROLL 312 / 312 · e2e-profiles **98 / 98** · the FULL e2e-harbor suite 1201 / 1206 on its first run — four of the five reds were THE STALE LOCAL /api (the `serve.mjs --emu` process had run since Nov 6, 1:24 pm — before OC5's quick solo board — and keeps each /api handler as first loaded: e2e-profiles' QUICK SOLO BOARD read null on it the same way): `radio`, `crew`, `panel`, `rebuild` rerun on a fresh server (:5175) → all green (108 / 109); the fifth, `roomperf`'s own cost at 4× CPU (40 → 45 ms with the guest list), is the same red OC5–OC7 carried (skipped in the cloud — no GPU path).

**Known issues / held back**
- On Fast 3G a phone that isn't the host mounts the match screen ~7 s after the walk's end (the cartridge's view + its ~40 modules load in a
  waterfall at ~560 ms a round trip; unthrottled it mounts at the walk's end) — the first challenge's rules card is shortened there. The pool is
  never the wait (e2e-oc-slow.mjs). A bundle / modulepreload is the console's.
- THE RACE at 4× CPU: 52–54 fps (the same before OC8 — measured on the untouched code); THE FINISH 60.
- Every Wikidata stat still trusts sitelinks first; a stat without a hand list may still deal an item a casual player doesn't know — the spot
  check is the place to flag them.
- MISSING LINK's auto-accepted second answers can be generic for a phrase family (TAKE also accepts CAST, PLAY, RUN …; KNOCK, WRITE) — they only
  ever ACCEPT a typed word, never show one.
- The old `serve.mjs --emu` + the emulators from Nov 6 were still running on this machine; stopping them was refused by this session's
  permission check — the suites ran against them (they serve the files on disk; the emulators were idle).
