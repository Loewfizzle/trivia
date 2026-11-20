# HIGH RISE — THE REVIEW (Nov 20 2026 — REVIEW ONLY, no code changed)

**RE-PUBLISH: nothing new from this pass** (no rules change, no code change).
Still pending from S4B if you have not done it: `Downloads\NEON\database.rules.nov20-s4b.json` (see MUST 1).

What this is: a fresh read-only audit of the whole game before go-live.
Four separate auditors read the code (engine + judge · the rules · the code · go-live).
I ran the game at 390 × 844, measured, and shot it. Nothing was fixed.
Sizes: **S** under 30 min · **M** about 1 h · **L** 2 h or more.

**The short version**
- The engine, the judge and the replay are SOLID. 6,900 simulated runs, 36 hostile tap logs: nothing got through, no honest run refused.
- Speed is SOLID. Floor 474 solo: memory flat (8.8 → 9.4 MB), 60 fps, 0 slow frames.
- Your two play notes are real and measured (the HUD cluster, the spectate snap).
- The weak side is the MATCH's trust in the host (3 ways a modified host can win or wreck a match). Low risk today (family only). It matters the day strangers share a room.
- The full local suite: everything green except three reds that are test problems, not the game (the end of this report).

---

## BEN'S DECIDED CHANGES — what I measured

### (1) THE TOP HUD IS BUNCHED UP — confirmed
Measured at 390 × 844, night and day the same:
- "8TH / 8" ends at x 113. "THE ROOFTOPS" starts at x 117. **A 4 px gap.** The "/ 8" sits 2 px above the band's line. They read as one line.
- Top to bottom, five things in 198 px: the floor (12 → 89) · the band (95 → 112) · the clock (112 → 129) · PERFECT ×5 (141 → 175) · "3 PASSED YOU" (179 → 210).
- The gaps between them: 6 · 0 · 12 · 4 px. That is the "one cluster".
- Shots: `Downloads\NEON\highrise-review\match\ben1-hud-both-calls-night-top-crop.png` · `ben1-hud-crowding-night-390x844.png` (+ `-day-`) · numbers in `hud-measure.json`.

The fix (your layout):
- The floor big + centred (as now).
- The band + the clock on ONE narrow line under it ("THE ROOFTOPS · 5:37", tighter letter spacing — about 150 px wide).
- THE PLACE NUMBER alone top-right: "8TH" big, "/ 8" small UNDER it. It must sit under the music button (the cartridge's top-right corner), from about y 56. The rival tags start at y 284 — clear.
- The callouts under everything: at least 16 px under the band line, 10 px between the two lanes. There is room: the drop zone starts at y 324.
- WATCH: the ranked list (top-left) then no longer fights the place number — see SHOULD 2 for the list itself.
- Tests to move with it: `highrise-place.mjs` (it pins "top-left"), the pixel test's allowed map.
- **Size M (≈ 45 min). JAYWALK: no. Rules: no.**

### (2) SPECTATE IS OUT OF SYNC — confirmed, in numbers
Watching GUS, 11 landings in a row, every frame recorded:
- His slab was drawn **10 to 15 frames (167 – 266 ms) PAST his tap**.
- By then it stood **27 – 47 px away from where he tapped (20 – 35 % of a full slab)**.
- Then his tap arrived: the slab **jumped back** to the tap spot and dropped. Every single landing.
- The next slab then appears 0 – 4 ticks into its sweep (a small second jump).
- Why: the watcher draws GUS's slab on the watcher's OWN clock. GUS's tap arrives late. Until it arrives the slab keeps sliding.
- This was the test page's bots (a fixed 150 ms delay). **A real match is worse**: 150 ms send + the network + a 100 ms pump ≈ 0.25 – 0.5 s → roughly 40 – 90 px.
- Shots: `…\match\ben2-snap-strip-night-00.png … -13.png` (one landing, frame by frame) · numbers in `match-measure.json` ("snap").

The fix (yours): WATCH plays the watched player back about 1 s late, each tap applied at ITS OWN tick. The slab then slides and drops exactly where they tapped.
- If a tap arrives later than the delay (a bad line): hold the slab at its last drawn spot and grow the delay — never draw past a tap again.
- The watched tower's floor number then runs 1 s behind the ranked list. Fix: the list shows the watched player's row from the same delayed tower.
- Files: `stage.js` (the watch feed + the draw tick), `matchsim.js` (the bots), `view.js`. A new check: the slab's spot on the landing frame = its tap spot (≤ 1 tick).
- **Size M–L (≈ 75 min with its test). JAYWALK: no. Rules: no.**

### (3) THE SHARE CARD → B · THE POSTER
Today's card (re-shot: `…\share\card-day-miss-540x675.png`) is what you described: a pale day stack in a framed box.
- What the new card needs: 6 pre-rendered hero shots (rooftops · skyline · clouds · stars · deep space · the gold Mothership), always night.
- The billboard's poster pipeline can make them (`poster.js#runPoster`: seed → climb → cut → freeze → copy). Today it stages ONE fixed moment — it needs one row per band + the gold finish.
- The card's drawing is rewritten full-bleed (no frame box): HIGH pink + RISE cyan · the floor huge · FLOORS · BAND · the tower · the cause in pink · N PERFECTS · NAME · the foot.
- What dies with it: `shot.js` whole, the live-frame hooks in `stage.js`, the frame's crop code in `share.js`, 4 tests to rewrite. What stays: the card's text layer, the link upload, `fitPng`.
- Cost on the phone: the 6 pictures load only at SHARE (lazy), about 100 KB each — one per card.
- **Size L (≈ 2 – 2.5 h). JAYWALK: no. Rules: no.**

### (4) THE PLACE NUMBER'S TIES — my rec stands: floor → most perfects
Today: your place = 1 + the players strictly over your floor. Level players all share it.
- Seen in WATCH with 7 level bots: the list shows **"1" beside all seven** (`…\match\watch-list-8-players-night-390x844.png`). And "1ST / 8" for everyone while the room climbs in step.
- The fix: the same rule as the podium — the floor, then the most perfects. Used by the place number AND the list's numbers.
- It will not flicker: a rival's floor reaches you a beat late, and perfects only move at a landing.
- **Size S (≈ 20 min). JAYWALK: no. Rules: no.**

---

## MUST (breaks play, fairness, security or go-live)

### MUST 1 — The `hr` rules must be published before anything can count
- What: without the published `hr` node every GO is refused. Every run plays "NOT COUNTED".
- Evidence: the repo's record of the live rules (`tests/fixtures/rules-live.json`) has no `hr` node; the pending note is still there. I cannot see the live database — you may already have published it.
- Fix: publish `database.rules.nov20-s4b.json`; the go-live pass then updates the record.
- **Size S (yours). JAYWALK: the same publish carries its LIVE LOCK. Rules: YES, a re-publish.**

### MUST 2 — A modified HOST can still win or wreck a match (3 ways)
All three need a host on a modified phone with honest players in his room. Solo is not affected.
**Risk today: low** (no traffic, family rooms, HIGH RISE hidden and not counting). **It matters once a match win pays XP to strangers.** JAYWALK is live and has the same three.
I ran all three against the real rules on the emulator: **all three work on `hr`**. On JAYWALK's `jw`: (c) works too; (a) and (b) are read in its rules (the same wording) — my quick test used HIGH RISE's chunk format there, so they were not run.
- **(a) THE LEAF WRITES** (known since S4B). The host flips the game's phase for a moment. An honest rival's chunk is refused. The phone moves on: the log has a hole, the judge refuses the whole run. Worse: the honest phone DROPS its own unsent taps when it sees the flip.
- **(b) THE PRE-DATED GO** (new). The host writes his GO under a FUTURE match id, waits 10 min, starts that match — and THE LIVE LOCK lets him delete the live tree (his own GO in it is "10 min old").
- **(c) THE EARLY FIRST GO** (new). The host GOes alone, adds the rivals 20 s later. Tick 0 is his GO: their towers have already timed out. Floor 0, TOO SLOW. It looks like lag.
- Fix, step 1 (no re-publish, works on today's rules): the phone sends one chunk at a time, re-sends a refused one, never drops taps on the mirror alone. The server: a match whose GOs are more than ~8 s apart is refused; a node counts only with a GO.
- Fix, step 2 (a re-publish): one `t0` stamp per match that no host value can move; chunks gated on the player's OWN go + a time bound. The design is written out by the rules auditor (kept in this pass's notes below).
- **Size: step 1 M per game · step 2 L. JAYWALK: YES (both steps, its live code). Rules: step 2 YES.**

### MUST 3 — A phone that only writes GO counts as a real player
- What: one person with spare tabs opens 7 seats that GO and never tap. The server counts 8 players. He wins an "8-player match" on 3 floors. XP grows with the player count.
- Evidence: run through the server's own match function: 7 GO-only nodes → 8 players, the tab owner wins. Bounded only by the 45 s gap and 20 matches a day.
- JAYWALK has the same rule today ("a silent player included").
- Fix: for HIGH RISE a player counts only with at least one landed tap (a seat is not a play — a GO is not one either).
- **Size S–M. JAYWALK: the file is shared (`api/report.js`); a HIGH-RISE-only branch leaves it alone. Rules: no.**

### MUST 4 — Two things break the moment the game is switched to playable
(They are go-live pass work, listed here so they are not a surprise.)
- The city grows a HIGH RISE sign at once — with no day face, no colour, no split. Two city tests go red. **The CITY pass must land first.** (Already queued: the inbox's Nov 20 8:12 am entry to the next city pass — the billboard, the roof sign, the blade, lit only by the go-live switch.)
- JAYWALK's boot budget has 2.4 KB of room. HIGH RISE's listing adds about 2.7 KB. It goes red. Fix: trim comments, or a named raise.
- **Size M (the city's) + S. JAYWALK: comments only. Rules: no.**

---

## SHOULD (clearly worse on the phone, or risky)

### SHOULD 1 — A host hiccup at GO turns the whole match "NOT COUNTED"
- What: if the host's line stalls 5 – 10 s around GO, his phone sees no GO and marks the match unproven — AFTER everyone started. Every phone restarts on a new seed 3.6 s into the climb. Nothing counts. No way back.
- Evidence: the director's steps run by script. The real-world trigger (an app switch, a dead socket) is likely but not reproduced on phones. JAYWALK's director has the same step.
- Fix: the proof nodes are the truth here too — a GO in the nodes cancels "unproven".
- **Size M. JAYWALK: its copy has the same hole (fix both or HIGH RISE first). Rules: no.**

### SHOULD 2 — WATCH: the 8-player list covers where the slab comes in
- What: the list is 142 × 352 px top-left (to y 408). A slab that enters from the LEFT slides in behind rows 6 – 8.
- Evidence: 40 s of watching, every frame: a left-entering slab was under the list in **83 % of its frames**, up to **140 × 100 px** covered. Other directions: 15 – 35 % of frames, a small corner. With 5 players or fewer the list ends at y 276: no overlap.
- Fix (with the HUD work): 36 px rows past 5 players, or the list folds to the top 5 + YOU while a slab slides.
- **Size S. JAYWALK: no. Rules: no.**

### SHOULD 3 — A full match may make heavy garbage on every phone
- What: the room re-reads the WHOLE proof tree every time any player's chunk lands. 8 players ≈ 8 re-reads a second.
- Evidence: the mechanism is in the code (`room.js`). The size is an estimate: ≈ 650 KB/s at 8 players late in a match (the solo budget is 12). 2 players: ≈ 36 KB/s. S5 left this unmeasured — it needs two real phones.
- Fix: first measure (a match with your brother + `?trace=1`). If real: read chunks one by one, or one read every 250 ms.
- **Size M–L. JAYWALK: YES (the shared room code is its live path). Rules: no.**

### SHOULD 4 — YOUR BEST can be set by runs that never counted
- What: the cartridge reads the test page's best. A run on /highrise-play, or an unproven run, becomes YOUR BEST in the real game until the server answers.
- Fix: with counting ON, show the server's best only.
- **Size S. JAYWALK: no. Rules: no.**

### SHOULD 5 — A rival can stay "GHOST" for a whole match
- What: a rival's name + colour are read once. If their entry lands late they stay GHOST.
- Fix: refresh them when the player list changes.
- **Size S. JAYWALK: no. Rules: no.**

### SHOULD 6 — A silent phone that still reads "online" loses the rest of its climb after 18 s
- What: the 75 s grace only starts once the database notices the drop. A dead socket can take longer than 18 s to show. Run by script: the last climber stopped at floor 30 on a climb heading for 120.
- Your number (18 s, JAYWALK's). Option: wait the 75 s when the silent player could still change 1st place.
- **Size S (a number) or M (a rule). JAYWALK: no. Rules: no.**

### SHOULD 7 — The first tap waits on 1.1 MB of flyer files most runs never see
- What: the pre-warm downloads the F-22 (389 KB — 24,000 triangles; the Blackbird is 5,000), the UFO hum (259 KB, 33 s) and the jet formation (180 KB) before the first tap — even for a run that ends at floor 10.
- Fix: thin the F-22 to about 100 KB; cut short copies of the two long sounds.
- **Size M. JAYWALK: no. Rules: no.**

### SHOULD 8 — Tests that are missing
- A MATCH with counting ON in a browser (only the server side is tested). I ran it by hand this pass — see GO-LIVE READINESS.
- SHARE with a counted run (the link path).
- A lost WebGL context inside the cartridge / a match / WATCH (only the test page has it).
- More than 3 phones + a late joiner. The cartridge on WebKit. A WebKit memory check (JAYWALK had one before its flip).
- **Size M each. JAYWALK: no. Rules: no.**

### SHOULD 9 — Rules tests that are missing
- `hr`'s own count window, its Call the Winner pick, a kicked player, an unseated player, odd match ids. None of MUST 2's three holes is pinned by a test.
- **Size M. Rules: tests only.**

### SHOULD 10 — Does a MATCH set YOUR BEST? The phone and the server disagree
- What: the docs + the phone say "YOUR BEST is the solo best — a match never sets it". The server writes a match's floor to the same best (TALLEST TOWER), as JAYWALK does.
- Evidence: the counting-ON match this pass: both players' floors went on the board, the winner's podium said NEW BEST.
- Why it matters: with counting ON the gold tape then sits at a match's floor in your next solo run.
- Fix: pick ONE rule. My rec: JAYWALK's — any counted run raises YOUR BEST (a match stops at 200, so it can never beat a serious solo run). Then only the docs + one comment change.
- **Size S. JAYWALK: no. Rules: no. YOUR CALL.**

---

## NICE (polish)
- **The end screen's tower is nearly black.** The docs say "the tower stays lit under it". On the test page the lower half is an empty dark band (`…\look\play-390-day-out.png`, `…\look\end\`). In the cartridge YOUR TABLE fills it. S.
- **TAP TO START reads dim**: grey letters with the tower's lines running through them (`…\look\play-390-start.png`). A darker fade behind it, or brighter letters. S.
- **At the Mothership the floor number + "DEEP SPACE" sit on the ship's bright belly** (`…\look\fly\fly-night-ship-199.png`). Readable, busy. S.
- **The rival tag "ALEX +2 ▲1"** — "+2" means two more players merged in. Not obvious. Words, S.
- **Call the Winner pays in a full draw** and counts players who never played (both games' copies). S.
- **A tap stamped before the fuse is lost if a frame stall ran the fuse first** (needs a 0.2 – 1.2 s stall). The cap has a grace; the fuse has none. S.
- **Podium and server can disagree** when a phone's clock runs 1.4 s fast (host says floor 60, server says 0). S.
- **No "too good" line for you**: a 487-floor run is not flagged. A bot playing in real time cannot be told from a great player — a warn line in /admin above floor ~430 would at least show it. S.
- **At 200 / 200 perfects** the "earlier tick" tie-break rewards tapping at the first perfect tick (3.1 s ahead over a run). For you to know; no fix.
- **Leftovers**: the altimeter is gone as code, its names remain (`altimeter`, `.hi-alt`, `altOrder`) + stale comments; a spent sound key; one spent build script. S.
- **The S1 graybox lab** (/highrise-lab, 26 KB + 36 KB of tests) is superseded by /highrise-play. Delete at go-live? Your call.
- **HIGH RISE imports two JAYWALK modules** (its numerals, its model reader). Move both to the kit. S, touches JAYWALK's import paths.
- **Copied from JAYWALK, not shared**: the proof writes (24 %), the share link (48 %), the end wiring (42 %), the director (49 %). Unify the proof writes WITH the MUST 2 fix, the share link WITH the poster card; the rest later.
- **The test page's note wraps to two lines** under PLAY AGAIN in the match look. Test page only.
- **No pills found** (radii are 6 and 8 px). Every animation is opacity / transform. No dead CSS class. No unused asset.

---

## WHAT I CHECKED, PIECE BY PIECE

### 1 · Correctness + fairness — SOLID
- REPLAY = LIVE: 6,900 simulated phone runs (frame stalls, early touches, every kind of end) + 40 tick-by-tick runs past floor 200. **0 differences. 0 honest runs refused.**
- 36 hostile tap logs (strings, floats, negatives, huge, duplicates, out of order, in the beat, past the cap, too many, wrong mode, bad seed, unknown rule set): **all refused, each by name.**
- The fuse never lands a slab. The 6:00 cap ends the match at +364 s. Floor 200 finishes. A full tie is nobody's win. A match always ends.
- A claimed floor is never read (a claimed 999 scored 6). A log made in advance is refused. The seed cannot be picked.
- `?floor=N` cannot reach the cartridge (the test page's flag only).
- What a modified phone CAN still do: play through a bot in real time (not detectable — the same for every game of this kind); about 8 s of slow motion spread over a run; deliver the last stretch 75 s late behind one fake "dropped signal".

### 2 · The rules
- SOLID: nobody writes another player's node. GO, each chunk, the end are write-once and server-stamped. A chunk is bounded. A guest cannot write for a match he is not in. The server reads no number the host writes.
- The gaps: MUST 2 (a, b, c). Smaller: no check on match ids — a host can open unlimited trees in his own room, one node up to 4.3 MB (about 230 such nodes fill the free plan; low urgency).
- The rules tests: 89 / 89 (the full run below).

### 3 · The match on a phone (390 × 844, day + night)
- Your (1) and (2): above.
- The place number, tags, tapes: the pixel test is green — 0 rival pixels in the play zone, 8 players, both looks.
- The WATCH list: SHOULD 2.
- The announcer: 16 px, one line, on screen 1.3 s, never over the stack; the same words twice in 4 s said once (the place check, green).

### 4 · The look (390 × 844, day + night)
- Shots of everything: `Downloads\NEON\highrise-review\look\` (the welcome, every band, the cut, the perfect, YOUR BEST, the end; 375 × 667, 430 × 932, 1440 × 900) · `…\look\end\` (every cause + NEW BEST + the gold finish, both looks) · `…\look\fly\` · `…\share\`.
- Play reads well unzoomed in both looks. The words flip to dark ink over a bright sky.
- Against JAYWALK: the end screen is its standard (the same builder, footer and order). The share card is the piece that differs — your (3).
- Findings: the three NICE look notes above.

### 5 · The billboard
- **Why S5's close-up was blank: a capture glitch in that one screenshot, not the board.** S5's full city shot from the same run shows the board lit. I took the same crop 24 more times (both ways of capturing): never blank.
- The proof's weak spot: it measured the letters in the picture FILE, then multiplied. It never looked at the screen. It would pass with the board missing.
- Re-shot in the city, local only, nothing committed: `…\billboard\billboard-board-3x-wide-highrise.png` beside `…-jaywalk.png` · the full city `billboard-city-390x844-highrise.png`.
- Measured ON SCREEN this time: **HIGH ≈ 12 pt** against JAYWALK's word 9.3 pt. S5's sizes hold (11.2 / 10.9 / 6.1 pt against 9.0 / 3.7 — the glow adds about half a point).
- One note: at this size the tower in the art cannot be seen. The words carry it.
- Fix for the test (S): cut the close-up out of the full shot, fail if it is blank, measure the screen's own pixels.

### 6 · Speed + stability — SOLID
- A long solo run to floor 474, night and day: memory 8.8 → 9.4 MB (flat), 40 – 46 slabs kept, 60 fps, **0 frames over 33 ms**, 0 hitches. `…\speed\long-run.json`.
- Zero garbage, repaint, pre-warm, landing, the flyers' path, the sound sync: in the full run below.
- A lost context, an app switch, a lock, a signal drop, a refresh, the host's phone dying: tested (the test page + the 3-phone match E2E). Not tested inside the cartridge on WebKit (SHOULD 8).

### 7 · The code
- Clean on the project's rules: no pills, no layout read in a frame, no `Date.now()` for timing, every storage call guarded, listeners all removed at unmount.
- Dead code + duplication: the NICE list.
- **Free plan, one good run (floor 151 in 165 s):** one player ≈ 155 writes, 28 KB up. The host ≈ 88 writes. **8 players ≈ 1,330 writes, 225 KB up, about 1.2 MB down for the room.** The free plan's 10 GB a month ≈ 8,000 such full matches. 100 players connected at once, site-wide.
- **Files:** HIGH RISE's own = 1.08 MB in 26 files. A first-time player downloads about 2.0 MB (JS 480 KB · plates 266 KB · models 566 KB · sounds 639 KB). The budget line is 2,500 KB.

---

## GO-LIVE READINESS

### What I ran with the switch ON (local only — the emulator's own test key, nothing committed)
- **A SOLO run, counting ON** (the full solo E2E, 85 / 85): a real run past floor 60 → counted, XP paid, the streak day counted, the best on the board, ABOVE THE CLOUDS awarded (card + achievement), TOP OF THE WORLD not, the end screen says NEW BEST with no "would count" line. **Works.**
- **A 2-PHONE MATCH, counting ON, in a browser — never run before this pass.** 29 of 31 checks green; the 2 reds are the "nothing counts" pins (expected). The server counted it: the winner +95 XP (match played 30 · victory 40 · new game tonight 25), second place +55, both streak days counted, both levelled up. **Works.** Log: `…\logs\e2e-highrise-match-SWITCH-ON.txt` · shots `…\e2e-match-switch-on\`.
- **One thing it showed — see SHOULD 10:** the match wrote each player's floor to TALLEST TOWER, and the winner's podium said NEW BEST. The docs say a match never sets YOUR BEST.
- The switch was cleared again afterwards. Nothing was committed.

### Would break at the flip (beyond MUST 1 and 4)
- **The weekly goal changes kind.** With five games, "Play 5 different games" switches on from the week of Dec 7 — it needs a ROOM match of all five, HOLD'EM included. Your call (4 of 5?).
- **Seven tabs on THE BOARD.** Six only just fit. A short tab name or your call.
- **THE DAILY CEILING** (20 counted room matches a day): a HIGH RISE match is 1 – 3 min — one evening reaches it. Your call; it touches every game.
- **The OFF-switch tests must be rewritten** ("WOULD COUNT" → "counted"): the unit pins, two blocks in the server test, the E2E's checks.
- **Dead code after the flip**: the "would count" path (server + the end screen's line). Remove in the pass.
- **The NEW tag**: the game's first day must be the 4 am streak day; the cached games order misses HIGH RISE until the next 4 am (NEW puts it on top anyway).
- **The cards** are still pictures; TOP OF THE WORLD is legendary and the docs promise "the cards' own motion". Two lab rows are unmarked. Your call.

### THE GO-LIVE CHECKLIST
Before the pass:
1. YOU: publish the rules (MUST 1).
2. THE CITY chat, its own pass: the sign's rows (day face, colour, the HIGH / RISE split) + the B1 billboard installed (no city code names the file yet) + its OPEN NOW switch.
3. YOU: mark the two cards in THE LAB; answer the calls above.
4. REVIEW FIX is done.

The pass, in order:
1. The inbox, the lab export, re-measure the boot + the per-game budgets.
2. The live-rules record updated, the pending note deleted.
3. The surfaces: the registry (meta), HOW TO PLAY (the text must be WRITTEN — none exists), the game tile, THE BOARD's tab, the logo colour, the credits group.
4. THE FLIP — two lines: the game's row → playable + its live day; `HIGHRISE_COUNTS` → on.
5. The pinned tests flipped (about 10 unit files, the server test's two blocks, three E2Es, the harbor groups cartridge / room / tapfit).
6. The builders: boot preload, preload graph, file hashes, CLAUDE.md coverage.
7. The docs: CLAUDE.md (FIVE PLAYABLE), ROADMAP, the bible, the pass log; the lab text's "hidden until".
8. Fresh emulators, the full run, a fresh-eyes review, ONE tagged push.

You, after the deploy:
- A solo run + a 2-phone match from a phone that is NOT yours.
- The billboard's OPEN NOW switch.
- Watch /admin for a day (page kills, refused reports).
- No Vercel setting changes: the switch is a line of code.

---

## THE SUGGESTED REVIEW FIX LIST

Your four changes alone are about 4 h 20. **They do not fit one 4-hour pass with the fixes.** My split:

### REVIEW FIX A — THE MATCH (≈ 4 h)
1. Your (1) the top HUD — M, 45 min.
2. Your (2) WATCH on a delay — M–L, 75 min.
3. Your (4) the place ties (number + list) — S, 20 min.
4. SHOULD 2 the list over the slab — S, 15 min (with 1).
5. SHOULD 1 a host hiccup → not counted — M, 45 min.
6. MUST 3 a GO alone is not a player — S–M, 30 min.
7. SHOULD 4 YOUR BEST from uncounted runs — S, 15 min.
8. SHOULD 5 GHOST names — S, 15 min.
9. SHOULD 10 does a match set YOUR BEST — S, 10 min, once you pick the rule.
10. The match E2E's daytime red (the look check) — S, 10 min.
≈ 4 h 40 with its tests. If it runs long: 7, 8 and 9 move to the go-live pass.

### REVIEW FIX B — THE SHARE CARD (≈ 2.5 – 3 h)
- Your (3) B · THE POSTER + the 6 hero shots + the old live-frame code out.
- With room: the billboard test's fix, the flyers' shot script, SHOULD 7 (the F-22's size).

### THE PROOF PASS — JAYWALK + HIGH RISE together (≈ 3 – 4 h, touches LIVE JAYWALK, ends in a re-publish)
- MUST 2 step 1 (the phones re-send; the server's two guards) then step 2 (the `t0` stamp, the rules, ~25 rules tests).
- My recommendation: **go live for family first; run this pass before you invite strangers.** It is the one finding that pays a cheater, and it is already true of live JAYWALK.

### Left for later
SHOULD 3 (measure with two phones first) · SHOULD 6 (your number) · SHOULD 8 / 9 (tests) · the NICE list.

---

## THE FULL LOCAL SUITE — run once, nothing fixed
This pass's own emulators + its own server, nothing else running. Every log: `Downloads\NEON\highrise-review\logs\`.

**GREEN**
- Unit: 2372 / 2372.
- The rules: 89 / 89. The `/api` tests: 68 / 68 + the share card's 3 / 3.
- The smoke test: 26 / 26.
- The solo E2E (with the counting-ON step): 85 / 85.
- JAYWALK's match E2E: 91 / 91. **JAYWALK's solo E2E: 99 / 99 — PLAY NOW is green** (2.8 s). S5 saw it red between 3:47 and 4:30 am; at 8:40 am it passes on the same code. That fits your read: a test problem round the 4 am day line. Not HIGH RISE's.
- The test page: 237 / 237 (REPLAY = LIVE ✓, a lost context survived) · the end screens 52 / 52 · the flyers + deep space 125 / 125 · WebKit 6 / 6 · the look shots 10 / 10.
- The place number + the announcer: 82 / 82. The 8-player pixel test: 10 / 10 (0 rival pixels in the play zone).
- Zero garbage: 12 / 12 — the game's own code 5.7 KB/s by night, 5.1 by day, **10.6 in a match (the line is 12; S5 measured 8.0 — little room left)**.
- The flyers' path 26 / 26 · the landing 7 / 7 · the pre-warm 35 / 35 · what repaints 13 / 13 + the bisect 2 / 2 · the sound sync 42 / 42 · the lab 45 / 45 · the share image 28 / 28 · the billboard 6 / 6.

**RED — three, none of them the game**
1. **The 3-phone match E2E: 54 / 55.** The red: "CHARLIE switches to DAY mid-match — his screen alone". The check expects the other phones to be in the NIGHT look. I ran it at 8:40 am: the AUTO look is DAY on every phone, so "his alone" is false. S5 ran it at 4 am (night) — green. Cause: the test assumes it is night. Fix: the test pins the other phones' look first. S.
2. **The flyers' look-shot script (`--fly`): 8 / 12.** It asks for the F-22 while the Blackbird is still in the sky; the game (rightly) flies one at a time. Flown alone the F-22 pair flies (`…\look\fly-alone\`). The real flyer checks (125 / 125, 26 / 26) are green. Cause: the script's waits are shorter than a flyby. S.
3. **Unit, first run only: 2371 / 2372** — my own Step 0 line named this report before the file existed. Green once it was written (the run above).

Not run: the harbor suite (nothing in the city changed — the cloud runs it on the tagged push).

---

## FOR YOUR PHONE
- The HUD + the place number + WATCH (the snap): https://neonspeakeasy.com/highrise-play?mode=match&rivals=7
  Climb a little, then let a slab drop: WATCH. Tap a name. Watch the slab go past, jump back, drop.
- The same by day: https://neonspeakeasy.com/highrise-play?mode=match&rivals=7&look=day
- The Mothership finish (the number over the ship): https://neonspeakeasy.com/highrise-play?mode=match&floor=193
- The welcome's TAP TO START: https://neonspeakeasy.com/highrise-play?look=night
- Every screenshot + number: `C:\Users\benja\Downloads\NEON\highrise-review\` (match · look · share · billboard · speed · logs).

## YOUR CALLS (nothing was decided for you)
1. Confirm (4): place ties by floor → most perfects.
2. SHOULD 10: does a counted MATCH raise YOUR BEST? (my rec: yes, as JAYWALK)
3. THE PROOF PASS before or after go-live? (my rec: after, before strangers)
4. SHOULD 6: keep 18 s for a silent phone, or wait longer for a possible winner?
5. At go-live: the weekly "5 different games" goal · the 7th BOARD tab's name · the 20-a-day ceiling · delete /highrise-lab · the two cards' lab marks.

## THE CALLS MADE
- Only three files were written in the repo: `docs/games/plan.md` (Step 0), this report, nothing else. So the bible's pass index, ROADMAP and CLAUDE.md were NOT updated — REVIEW FIX adds this pass's line.
- No rules or game code was touched to prove MUST 2: a scratch test ran against the rules on the emulator in its own test database, then was deleted.
- The lab export (every pass's first step) was skipped: this pass may change no art.
- The harbor suite was not run: nothing in the city changed (the cloud runs it on the tagged push).
- THE ADD-ON INBOX: read at the start and before the push. Nothing was addressed to this pass. One new entry arrived at 8:12 am — to the next CITY pass (HIGH RISE's city signage): not this pass's, left untouched. Its three open HIGH RISE entries (the leaf writes, Call the Winner's no-run case, the 2-phone mirror measure) are in this report: MUST 2 · NICE · SHOULD 3.

## THE RULES AUDITOR'S DESIGN (for THE PROOF PASS)
- `t0`: one fixed key per match tree. The first seated, un-kicked phone writes it once, at the server's time. It reads nothing the host writes.
- GO: own uid, once, server time, only within 5 s of `t0`. Today's seat / kick / participant checks stay (they can only refuse).
- Chunks, the end, the rule set: own uid, once, own GO there, within 3 h of it. No read of the game's phase, the player list or the kick list.
- Call the Winner: own end there; the named player has a GO and no end.
- The lock: a tree may go once its `t0` is 10 min old.
- Order: ship the phones' code first, publish once phones run it (an old phone on the new rules plays NOT COUNTED). On the old rules the `t0` write is refused quietly and GO works as today — the fallback.
