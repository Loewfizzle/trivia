# OVERCLOCK — the game's doc (the OVERDRIVE rebuild)

The approved design plan from the Overclock chat (copied in at OC1's Step 0, Nov 5 2026 — `Downloads
eon\overclock\OVERCLOCK-PLAN.md`).
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
- NEW CONTENT BRINGS NEW CARDS: the rebuild (+ DUMB LUCK, SOLO, the DAILY) adds new collectible player cards / emblems / name glows where they fit, at THE LAB's bar → server catalog + THE LAB for Ben's APPROVE / FIX / CUT; only approved art ships. Existing Overclock achievements (DEAD ON, OVERCLOCKED) keep working. Results feed the existing XP / levels / streak via /api only. (Which cards — open, see below.)
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
- ADD: DUMB LUCK (see below). → 20 challenge types (19 kept + Dumb Luck).
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
- MAKE 24: big orange 24, graphite number tiles, round glass operators, merged number glows blue.
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
   - Have a reveal today: Missing Link, Spellcheck, Make 24, Compass, Sort It, Higher/Lower, Timeline, Closest Call, Unscramble.
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
- Hard challenges (Rewire, Make 24, Compass, Missing Link, Higher/Lower, Pattern Lock) get a ~3 s looping animated demo.

## No repeats + content — decided
- CHANGED Nov 4 (Ben, via city chat): NO per-player "never seen" memory — nothing saved to profiles, no merging every player's history at match start.
- (1) BIG POOLS as planned — cheap (≈10,000 questions ≈ 2.5 MB of text), split per challenge, loaded only when OVERCLOCK is played.
- (2) THE ROOM'S NIGHT MEMORY — every question / puzzle used in a room during this game night is remembered WITH THE ROOM and never comes up again that night (across rematches and challenges). No profiles involved; it ends when the room closes. This kills the repeat players notice ("we just had this one"). If a pool is ever exhausted in one night, it reshuffles rather than stalls.
- (3) The DAILY needs no memory (server-picked day set) — see Solo + the DAILY.
- (4) Per-player cross-night memory = a LATER option only if cross-night repeats bother real players once there's traffic — not now.
- Why: a few repeats a week apart are normal in trivia; the annoying repeat is the same group the same night — the room memory fixes that for a fraction of the work.
- We BUILD OUR OWN pools; content growth = its own pass(es). Every row: automated checks + independent reviewer agent. Pools split per challenge, loaded lazily.
- Targets: TRUE OR FALSE 32 → 2,000+ (data file) · TRIVIA own bank 333 → 4,000+ · CLOSEST ~1,000 · MISSING LINK ~1,000 · SPELLCHECK ~1,500 · TIMELINE / HIGHER-LOWER / SORT IT → big item pools dealt as fresh combos · MAKE 24 → every solvable set via solver · ODD ONE OUT → 4 families.
- The Trivia API: extra source while non-commercial; swap if a paid shop ever comes. Open Trivia DB: credit (share-alike). Never depend on either.

## Housekeeping for pass 1
- Fix the stale generate() calls in the OVERCLOCK tests (tests/overclock.test.mjs, tests/overclock-new.test.mjs).
- Keep the seal.

## Assets
- SFX: ARRIVED Nov 3 — 33 MP3s (~1 MB) in Downloads\grok\overclock-sfx\ (+ credits.txt, MD5SUMS.txt); all CC0 / Sonniss GDC (no credit required — keep credits.txt anyway). The pass imports compressed copies (mono, lower bitrate). Ben's first listen (Nov 3): 17-winner-fanfare first version REJECTED ("cheap") → Grok's layered replacement (4.3 s) APPROVED Nov 3 ("A sounds better than B") — use 17-winner-fanfare.mp3; do NOT import the backup 17-winner-fanfare-b.mp3; 08 + 23 OK (23 great for a long shot); 21 crowd roar OK; the rest judged in-game during the pass review. Builder tips in credits.txt: gapless hooves via Web Audio loop points (not <audio loop>), unlock audio on first tap, mute toggle.
- Muybridge "Horse in Motion" (public domain) for the neon horses.
- MUSIC — decided (Ben, Nov 1): until OVERCLOCK gets its own night tracks, it plays a RANDOM track from the site's EVENING soundtrack each match (no new music files).

## Open
- NEW CARDS / EMBLEMS — DECIDED (city chat + Ben, Nov 3). All built to THE LAB's bar → server catalog (names there; only owners see names) + THE LAB for Ben's APPROVE / FIX / CUT; only approved art ships. Server-checked via /api like every unlock.
  1. DUMB LUCK LONG-SHOT card — EPIC — win on the 12-1 horse.
  2. Neon HORSESHOE emblem — any Dumb Luck win (the entry-level Dumb Luck reward).
  3. SOLO card — NOT "beat your best" (too easy early): a real HIGH SOLO SCORE threshold in a Quick solo run. Threshold set from whole-match simulation + the scoring table so only a strong run hits it (proposed ~top 10% of a good player's runs), stated in the pass summary for Ben to OK.
  4. NO daily card in the Overclock passes — daily rewards belong to THE DAILY MODULE so all three dailies match (top 1% = the PENTHOUSE card, already planned).
  5. OVERDRIVE card in the new molten-orange + electric-blue look — DECIDED (Ben, Nov 3): earned by 10 RIGHT ANSWERS IN A ROW in one match (the combo meter's x10). Not a wins count (OVERCLOCKED: 10 wins → card CIRCUIT already exists and stays as it is). The streak carries across challenges; one wrong answer resets it; challenges with no right/wrong (Signal Lock reflex taps, Dumb Luck) neither add nor break it.
     - DURING THE MATCH: only the combo meter's own quick x10 flash (≤ ~1.5 s, never blocks taps, NO "card unlocked" text, NEVER pauses the timer — everyone shares one clock).
     - THE CARD REVEAL comes AFTER THE MATCH via the CONSOLE's card reveal (SHELL 2.0), only once the server (/api) has confirmed the streak. Overclock only reports the feat (max streak) for the server to replay.
  - Naming: "OVERDRIVE" = the name of the new look (colour scheme), the x4 combo banner and this card — Ben confirmed Nov 3 he wants to keep it.
- Keep or drop the "YOU" tag on Dumb Luck after seeing it in play.
## PASS PLAN — proposed Nov 4 (awaiting Ben). Starts only after LOBBY 2.0. One pass at a time on the beelink; Opus 5.5 high; /clear first; ~3–4 h each.
- OC1 FOUNDATION + THE KIT: Step 0 (docs/overclock.md + ROADMAP line); fix stale tests; cut Lexicon; Quick = default (ALL timings unchanged); room night memory (rules first + sim tests); LOBBY 2.0 cartridge + city pause/memory guard; sounds imported (compressed) + audio unlock + mute; evening-music rotation; THE OVERDRIVE KIT (fonts self-hosted, palette tokens, style-C tiles, tach timer, combo meter x2→x4 OVERDRIVE→x10, right/wrong feedback, title-card slam + 3-2-1, custom number pad + letter keyboard) + no-Firebase preview page; kit proven on TRIVIA LIGHTNING + TRUE OR FALSE.
- OC2 THE RESULTS FLOW: answer reveal frame (v2) + reveals for every challenge that lacks one; round winner; overall standings (▲ blue / ▼ grey) + skip-when-everyone-taps (min 3 s, max unchanged); FINAL STANDINGS; VICTORY body via finalScene (neon-tube winner name, podium, award chips; console owns button/XP/card reveal); OVERDRIVE x10 tracking reported as a feat for /api.
- OC3 CHALLENGES A (answer + keypad): Quick Math, Pattern Lock, Closest Call, Missing Link, Unscramble, Spellcheck, Higher or Lower, Timeline, Sort It.
- OC4 CHALLENGES B (visual / reflex): Rewire (neon tubes + surge), Memory, Color Clash, Odd One Out (4 families), Quick Count, Signal Lock, Compass, Make 24 + the ~3 s animated rules demos.
- OC5 DUMB LUCK + SOLO + DAILY PLUG-IN: Dumb Luck rules first (odds, payouts, seal, sim tests) then the look (neon sign, odds board, track, finish); SOLO mode; daily mode plug-in (OFF); new cards/emblems (long-shot card, horseshoe emblem, solo card, OVERDRIVE card) → server catalog + THE LAB.
- OC6 CONTENT A (structured / generated): True or False → 2,000+; Timeline / Higher-Lower / Sort It item pools; Make 24 solver sets; per-challenge lazy split.
- OC7 CONTENT B (written + fact-checked): own trivia bank → 4,000+; Closest Call ~1,000; Missing Link ~1,000; Spellcheck ~1,500.
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
