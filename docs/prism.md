# PRISM DROP (falling-block battle)

Deep-dive for PRISM DROP: engine, battle rules, songs, musical SFX, visuals, controls, adding songs. Never use the words "Tetris", "tetromino" or "T-spin" anywhere.

## PRISM DROP (falling-block battle)
**Never use the words "Tetris", "tetromino" or "T-spin" anywhere** (UI, text, assets, code comments shown to players). Pieces are
"pieces"/"prisms", spins are "twists". Own identity: luminous glass jewels, white light with spectral edges.
- **Every phone runs its own board** (`engine.js`, pure, fixed 1/120 s steps — frame rate never changes play). Same pieces for
  everyone: `pieceAt(game.seed, n)` = 7-bags shuffled from the match seed. What leaves the phone: a ~5 Hz snapshot (`prism/…`: board
  string "0–8" per cell from the bottom row, active piece, stats, target), a full save every 3 s (`sv`: board, queue position n,
  hold, combo/b2b, pending junk, last attack key) — a refresh restores from it — and attacks (`prismq/{target}`, pushed at once
  with server time; the target's phone applies them: `receive()` with delay = 1 s, or 2.5 s when its stack is ≥ 16 rows tall,
  minus how long the attack was in flight). Junk lands on the next lock without a clear; a clear cancels pending junk first.
- **Battle:** attack table 1→0, 2→1, 3→2, 4→4; twist single/double/triple 2/4/6; mini twist (double) 1; back-to-back +1;
  combo bonus `COMBO_ATTACK`; perfect clear 10 (+b2b) + combo; × (1 + badge bonus) with the fraction carried (`frac`).
  Speed: level = 1 + minutes played (cap 12). Sudden death: after 5 min, one junk row every 10 s (gap from the seed). A top-out
  writes `st:'out'` + `by` (the sender of the last junk received = KO credit); the director orders knockouts by time, moves badges
  (`applyKo`: killer gets victim's + 1), counts KOs, sets `duelAt` when 2 of ≥ 3 remain, ends when ≤ 1. Offline > 30 s = out.
  **PFIX-A (Nov 10 2026 — FABLE REVIEW #1's play-breaking fixes; docs/games/review-prism-1.md):**
  - **THE LOCK (finding 1 + question A — `engine.js`):** once the piece has touched down on its lowest row, EVERY move / rotation spends one of
    the 15 resets — grounded or kicked up off the floor (`touched`); "lowest" is the piece's lowest CELL (it was the box's origin: a rotation of
    the long piece "descended" and won its resets back). Spent: in the air the lock delay is used up, so the next touch-down LOCKS AT ONCE. A
    spin can no longer hang a piece: the review's matrix (levels 1–20 × a turn every 100–400 ms × both patterns × I / T / S / J + the long piece
    over a 4-wide pit) locks every piece within 7.1 s of touching down (the pin's limit: 8.5 s = LOCK_MS × 17; before: never, 258 of 320).
  - **AWAY (finding 2 + question E — `director.js`):** a board silent ≥ `OFFLINE_OUT_MS` (30 s) during play is OUT whatever presence says (a hidden
    tab keeps its socket but runs no frames — its board froze, no row could land): `out.away` + `gone`, credited to nobody; the KO card says
    AWAY, everyone sees "X — AWAY". THE HEARTBEAT = the view's save (every ≤ 3 s while its frames run; a board never written counts from GO).
    The view saves at once on `visibilitychange → hidden` + `pagehide`; a board the director put out stops (no play under the KO card).
  - **THE DOUBLE KO (finding 4 + question B — `director.js#outOrder`):** the boards that go out in one tick are ordered by their server stamp `at`,
    an exact tie → fewer rows SENT first, then the LATER joiner (`players/{uid}/joinedAt`, passed by `index.js#step`), then the uid. When they
    are the last ones, the one that went out LAST WINS (no out entry — place 1): never "no survivors" in a match of 2+; Call the Winner is
    judged on it.
  - **A REFRESH NEVER ATTACKS TWICE (finding 5):** an attack is SAVED in the same frame it is sent (`pubForce` → the frame's `publish`), so a
    refresh comes back after the clear; its key = the sender + the piece that made it (`prismq/{m}/{target}/{uid}-{n}` — the engine's `send`
    event carries `i`; create-only in the CURRENT rules, so a replayed piece can't land twice); the receiver takes attacks in the order of
    their SERVER stamps (`at` — the keys no longer sort by time) and a restored board skips every attack stamped ≤ its save's mark (`sv.ak =
    '@<ms>'`). Each pending row keeps its rise across a refresh (`pd` = [n, gap, from, id, ms still to wait, ms risen]; an old save: due at once).
  - **AUTO-TARGET FORGETS (question D — `logic.js`):** an attacker is remembered `TARGET_MEMORY_MS` (20 s — the KO credit's window) after
    their last hit (`attackersOf(hits, now)`); a target picked BECAUSE they hit you goes back to THE RANDOM PICK once forgotten (`currentHit`),
    a random pick is kept while valid. 8 equal players × 400 attacks (40 seeds): the biggest share 1.89 × an even split (worst 4.28) → 1.37
    (worst 1.77). Feuds that keep hitting each other inside 20 s still trade (the rule's nature).
  **PFIX-B (Nov 10 2026 — FABLE REVIEW #1's MUST FIX 6–7 + SHOULD FIX 8–10 + the polish; docs/harbor/passes/pfix-b.md). THE ANTI-CHEAT RULES a
  later pass must KEEP (question C's CHEAP BOUNDS — they narrow forgery; nothing replays the board: a server replay is a later pass, only if
  PRISM's scores ever matter to strangers):**
  - **THE BOARD NODE (`database.rules.json` prism/{m}/{uid}):** written only in PLAY, the countdown from GO − 2 s (GO lands before the host's
    tick), and SCORE RUSH's END for its final save — never past the song's `endAt` + 4 s; FROZEN once out (its own `st: 'out'` or the director's
    `game/out/{uid}` — gone / away): no field changes after a KO. `at` = the server's `now`. `sv` is CLOSED (every field typed + bounded:
    `st` = four counts, quads / twists / perfect clears ≤ pieces, pieces ≤ 20 a second of play + 40; `ln` ≤ 4 × pieces; `pk` 0–40; `pd` rows
    6 fields, n 1–30; strings capped); the published stats bounded by the play clock (`sc` ≤ 20 000 a second + 50 000, `ln` ≤ 10 a second +
    40, `se` ≤ 10 a second + 60); `best: 'quad'` needs `ln ≥ 4` in the same node. The view writes only inside that window
    (`logic.js#boardWritable` — the same window, a little inside it), so an honest phone never sends a refused write.
  - **THE ATTACK (prismq/{m}/{target}/{uid}-{piece}):** the key = the sender + a piece number (one attack per piece, create-only — a push key
    is refused), `at` = the server's `now` (never back-dated), never at or from a board that says out / the director put out, BATTLE + PLAY
    only, never yourself (as before). The receiver drops an attack that would take its queue past `QUEUE_MAX` (40 rows — a flood can't bury).
  - **THE KO CREDIT (`logic.js#creditedBy`):** `by` counts only if the victim's queue holds an attack FROM that player sent in the last
    `KO_CREDIT_MS` (20 s) + the longest rise before the KO (`index.js#livePaths` mirrors `prismq/{m}` as `queues`); else nobody. A KO by a
    player already out is fair (the rows they sent before they fell still landed).
  - **THE AWARD FLAGS (`match-report.js#prismExtra`):** FOUR ON THE FLOOR needs `ln ≥ 4`; PERFECT CLEAR needs `ln ≥ 2 × pc` (a one-line
    perfect clear can't happen — a piece is 4 cells, a row 10) + enough pieces (`pn` — the results carry it: 5 a clear in SCORE RUSH, 2 with junk
    under you); both only from a match the player PLAYED ≥ 15 s (`PRISM_AWARD_MIN_MS`) with ≤ 10 pieces a second. PERFECT CLEAR in SOLO stays.
  - **THE SCORE RUSH BOUND (finding 9 — `match-report.js#maxRushScore`):** from a SIM (`node scripts/sim-prism-rush.mjs [runs] [pps]` —
    full-skill bot runs on the real engine, every song, at `RUSH_PACE.pps` 4 pieces a second): the best runs clear ≈ 1.4 lines a second at
    ≈ 130 points a line a level → the bound = 3 × 130 × (L + L² / 20), L = 1.4 × the song's seconds — 3.2–4.6 × the best run of each song (it
    holds against a 5-pieces-a-second bot too: 1.6 ×) — and never more than the lines can be worth (`rushLineCeiling`); lines ≤ 2.5 a second
    + 20 (`maxRushLines`). The longest song's bound ≈ 2.2 M (was ≈ 222 M). THE BOARD's `prism-rush` had no rows when it changed (none above).
  - **THE GHOST ROWS (finding 8 + optional 13 — `incoming.js#ghostBands`):** the 12 drawn rows are the first 12 to LAND (the scheduled row,
    then the queue from its OLDEST band); a band never rises past the one in front of it (the engine lands the head first — a later band is
    never HOT before it). Drawn only where every stack row a rising ghost row overlaps is empty (`board.js#ghostBlocked` — no half ghost cell
    over a block); the INCOMING tag also stays above the landing preview.
  - **THE DAY TIERS (finding 10 — `tiers.js#stepTier`):** by day a step goes straight to the next tier whose BOARD ratio differs (3 → 0,
    0 → 3 — the day look draws no world and no light layer, so only the board's 3× moves its frame time); by night one tier at a time as
    before. The view judges 90 frames OR ~1.5 s of them (a 15-fps phone is helped in ~1.5 s, not ~6 s + 15 s of steps).
  - **THE POLISH:** a lock / landed rows inside the clear hold END it (`neonfx.js#endsHold` → `board.endHold`); the playlist moves past the
    first song at START (`logic.js#playlistAdvance` — END GAME no longer repeats it); SURVIVAL's final rows show the time "2:31" (the
    console's `scoreText` — `ui/final.js` + `components.js#leaderboard`); the header comes back as an announcement fades (no blank line); the
    day art warmed at night in idle slices after GO (`view.js#warmDayArt` — the crayon tooth noise a few rows a slice, the doodle, SLAM's
    streak + the scribble + the star's tiles; the scribble punched with a repeated 256-px tile, no longer a 970 × 970 one per combo level) —
    the first switch to day: 3–4 frames of 100 ms → 2 at 4× CPU (`tests/integration/prism-lookswitch.mjs`; what is left = the day paper
    arriving + the compositor: the papers + the marker font still load only when the day look shows).
  **AUTO-TARGET (PD-2 — `logic.js#autoTarget`, no button, no setting):** your attacks go to whoever is attacking you (the most recent attacker
  still alive — `attackersOf` over the attacks you received in the last 20 s: PFIX-A), otherwise a random living opponent, KEPT while it stays valid; re-picked when an
  attack arrives and every ~0.6 s. The old RANDOM / ATTACKERS / DANGER modes + `na:prism:target` are gone. Badges + KO bonuses work as before,
  behind the scenes (no panel). Call the Winner: 10 s after you're out (rules: 12 s); bonus = `callBonus(rem)` = 0.4 × (players left − 1).
- **Score Rush:** no attacks; the match = one song (`endAt` = the song's analysed last strong beat); levels every 10 lines; a
  top-out clears the board (score kept); the finale (chord + the board shattering) is scheduled on that beat. (REBOOT — `view.js#onTopOut`:
  after 1.4 s the well empties, the queue + combo + back-to-back reset and the NEXT piece of the bag comes in — the piece that topped out is
  skipped (`eng.n++`), so every phone still deals from the same seeded sequence.)
- **SURVIVAL (PD-2):** no attacks (the engine runs in mode `survival`: it sends + counters nothing); junk rows rise for EVERYONE on one seeded
  schedule — `logic.js#survivalRows` / `survivalRowAt` (the k-th row's time, ms after GO: one every 10 s, a smoothstep over `SURV_RAMP_MS`
  150 s to one every 4 s), the gap = `survivalGap(seed, k)` (sudden death's rule), each phone inserting them at the server-clock moment
  (`eng.sd` counts them — saved, so a refresh keeps the count). Speed = battle's (`battleLevel`). Last one standing wins (no KO credit, no
  badges); the results' `t` = the time survived (ms); the standings' score = the seconds survived, then the lines. Calibration (bots on the real
  schedule, solo): the strongest bot ~100 s median (65–147 s), a weak one ~45 s — real players outlast the bots; typical 2–4 min.
- **SOLO (PD-2 — meta `SOLO: true`, the console's solo lane):** ONE player may start SCORE RUSH or SURVIVAL (the streak + a small capped XP, never
  a win). BATTLE needs 2: its choice carries `when: n => n >= 2` (the options sheet's per-choice filter — screens/game-options.js), and
  `cleanSettings(s, players)` deals SCORE RUSH to a room of one whatever was asked. A solo SURVIVAL plays until you top out (the KO card + the
  podium show the time: `scoreText` on the console's SOLO RUN line); a solo SCORE RUSH plays the song. Neither feeds a board (no `-solo` board
  exists for PRISM); `match-report.js#soloEmpty` decides PRISM's empty run by points / lines only (a phone on the table "survives" a while).
  THE BOARD's PRISM DROP tab: SURVIVAL wins count as PRISM DROP wins + win rate (no new board).
- **THE FACTS FOR PD-5's CARDS (the results, written by the director at the end):** `ko` (KOs), `pc` (perfect clears — the save's `st[3]`),
  `dz: 1` (BATTLE only: your stack reached the TOP 5 ROWS — the engine's `peak` ≥ `DANGER_ZONE_ROWS` 16, saved as `sv.pk`; the save is written at
  once when it first happens + at the end, so a winner's flag is never 3 s stale) — FIRST KO, PERFECT CLEAR, COMEBACK (= the winner + `dz`).
- **THE THREE CARDS (PD-5B, Nov 9 2026 — docs/harbor/passes/pd-5b.md):** the server's flags from the room's own record (`core/match-report.js#prismExtra`):
  `firstko` (BATTLE 2+, a KO + an elimination credited in `game.out`), `pc` (any mode — a solo run too), `comeback` (won a BATTLE with `dz`) → FIRST KO
  (common) · PERFECT CLEAR (rare) · COMEBACK (epic) — never COMEBACK KID (that flag stays OVERCLOCK's). The art DRAWN IN CODE in the night's neon
  (`js/fx/pd-cards.js` + `pd-specs.js`; the material = the still frame, `scripts/build-pd-cards.mjs`) — docs/vault.md "PRISM DROP's CARDS".
- **THE BURST BEFORE THE COLLAPSE (PD-5B):** the engine removes cleared rows at once; the NEON board holds the stack as it was before the clear
  (`neonfx.js#preClear` → `board.js#holdClear`, `holdMs` = the race + 70 ms, ≤ 0.3 s, none with reduced effects) so the race + the burst read on the
  cleared rows, then it collapses — the game itself never waits. Preview: `&fx=clear1…4` shows it, `&collapse=now` = the old look.
- **THE HOLIDAY HOOK (PD-5B — `holiday.js`, PURE):** a variant name (`core/sky.js#holidayOf`) → night `{ palette: { edge, frame, well, sparks, flash } }`
  (never the pieces' colours) · day `{ paper, world }`; `withHoliday(look, base, name)` = base itself without a variant; picked once at mount
  (`holidayNow` — full days). `VARIANTS` is EMPTY (no holiday art — the owner cut the touches): a new holiday = one row (+ its doodle in page.js).
- **THE RISING GHOST ROWS (PD-2 — the red bar is gone):** the engine's pending junk drawn ON your board — `incoming.js#ghostBands` (PURE) turns
  the queue into bands from the bottom up (the newest attack at the bottom, the oldest on top — the order they will really land): a fresh attack
  shows 30 % of its rows at once and slides up from below the board's edge as its delay runs out; due = fully up + HOT (a faster shake, a brighter
  glow); it goes SOLID exactly when the engine lands it (the next lock without a clear — unchanged). Drawn by the LOOK's hook
  (`board.js#LOOKS.glass.incoming` — PD-3 / PD-4 add their own) OVER the bottom rows: an empty cell gets a hatched see-through ghost (never
  mistaken for a block), an occupied cell is only tinted (the stack stays readable), the gap stays open, a bright leading edge on top, ≤ 12 rows
  drawn. A clear that cancels them (the engine's counter, oldest first) SHATTERS the top rows on the board itself (`board.shatterGhost` —
  ~0.5 s of hatched shards + a flash). The tag `INCOMING 3 · EVE` (`incomingTag` — the biggest sender, "+1" per other) rides just above the ghost
  rows' top edge or your stack, whichever is higher (never over a block; a transform). SURVIVAL's next row (and BATTLE's sudden-death rows) rise
  the same way over their last 3 s (`sched`, no tag, can't be cancelled).
- **THE CALLOUTS (PD-2):** the kit's announcer (`createAnnouncer(…, { fit: true })` — `--len` sizes the headline to the board: never a wrap) in
  `.pd-callout`, centred over the board's upper middle (never the bottom rows / the incoming rows), ~1.1 s each: one per moment (a batch of engine
  events → `part()` → `flushCallout()`): the headline big (PERFECT CLEAR · BACK-TO-BACK · TWIST +2 · 4 LINES · COMBO ×3 · BLOCKED! · +4 → DANA)
  and the rest small under it; `KO → EVE` for the one who scored it (the others see the top line's "X KO'd Y"). BLOCKED! = the shared `--good`
  (a word too). The rail tile you hit flashes (PD-1's `rail.hit`).
- **THE TIP (PD-2):** "Clear lines to attack your friends." — the first BATTLE on this device (`na:prism:tip`; the console's one-time hint is the
  dailies'), at GO + 0.8 s, gone after ~5 s or on the first move.
- **KO → CALL THE WINNER → SPECTATE (PD-2):** the KO card on your board (KO · BY DANA / TOPPED OUT / THE JUNK GOT YOU / SIGNAL LOST · 5TH PLACE;
  solo SURVIVAL: SURVIVED 1:42) for 1.8 s (`KO_CARD_MS`), then the kit's Call the Winner (`ring: true` — 20 ticks round a circle go out one by one
  + the seconds, opacity only; big tap targets; the line under a name = their stack) with the KO card stepped back, then SPECTATE: the two
  leaders' boards BIG side by side (live; SCORE RUSH: the top two scores, else the two lowest stacks then the most KOs, kept in seat order), the
  higher one outlined red from 12 rows, `DUEL SOON` in the header when two remain, the rest of the field as one line (initial · stack · KO). A
  name opens THE PLAYER PAGE — only here, never during live play. A refresh after the KO goes straight to the call / spectating.
- **Songs:** `meta/prism` holds the room's playlist seed + position. `playlistAt(seed, k, ids)` = per-cycle seeded shuffles, a cycle
  never starts with the song the last one ended on, so nothing repeats until all have played. A match takes the next song(s)
  (battle deals 5 in a row; if it outlasts a song the next crossfades in over 4 s and the world transforms); the final step
  advances `meta/prism/n` by the songs used. Like PULSE, each song is decoded once into an AudioBuffer and scheduled on the audio clock
  (`pulse/clock.js#ctxAtServer`) — never streamed through an <audio> element and "corrected" (that version warbled and
  stuttered on phones). Only the playing song + the next (≤ 45 s before its turn) stay decoded; after a suspension the song
  is restarted once at the right spot. It plays through a low-pass (DANGER: stack ≥ 13 rows sinks it toward 600 Hz) and a lift gain (DUEL).
  Menu music is off during the match (`MUSIC = null`); the podium plays victory. **The song file is NOT preloaded** (1.8–3.2 MB) — it streams in
  at the start, QUICK-STARTED (PD-5A, below); the match never waits for it (everything runs on the server clock).
- **THE TWO SETS — THE HOST's SET (PD-5A, Nov 9 2026):** NIGHT = the original five (`prism1-5`, unchanged: no `look` in the manifest) · DAY =
  five lo-fi songs (`prismd1-5`, manifest `look: 'day'` + a HAND-SET world, never the mood picker): Roof Tops → sunset · Summer Felt Longer Then
  → city · The Last Long Day → crystal · Feeling Human Again → aurora (HoliznaCC0, CC0 — ☰ → CREDITS) · the owner's City song c2-day8 → nebula
  (encoded from his ORIGINAL `Downloads/day/day8.mp3` — the md5 the city's import recorded). At `start` the HOST's resolved look (THE GAME LOOK
  — AUTO = the host's sun: `kit/look.js#resolveLook` + `sunUpNow`) picks the room's set → `game.set`; EVERY phone plays that set's songs in
  sync whatever look it draws (the view reads `game.songs` only); a host change keeps it (the director never touches it); a refresh rejoins the
  same song at its place. Each set its own no-repeat shuffle (`logic.js#dealSongs`): NIGHT on `meta/prism/n` (the deal is byte-for-byte the
  old one — a test proves it), DAY on the seed `<roomSeed>:day` + its position in THE NIGHT's MEMORY (`meta/used/prism/dn<N>` = the day
  playlist has reached N, the highest counts — `dayPos` / `dayKey`; no rules change). A day song's CUE-IN (`cue`, s — a soft intro skipped:
  the room's schedule starts the FILE there; the file untouched) → `game.cu` (ms, only when a song has one); its slot ends at its LAST STRONG
  BEAT (`slotOf`: `sd` = lastBeat − cue + the 4 s crossfade) — BATTLE / SURVIVAL crossfade into the next day song FROM that beat (the night
  set keeps its whole-song slots). SCORE RUSH = one song, its end = `lastBeat` after the cue (`logic.js#matchTiming` — GO on a downbeat ≥ 3.2 s
  into the schedule, both on the song's own grid). The preload predicts the set from THIS phone's look (most rooms' phones share a clock).
- **QUICK START (PD-5A — `audio/synced-songs.js` `quick: true`, docs/audio.md "QUICK START"):** the song is STREAMED (one request); as its bytes
  arrive SLICES are decoded from the stream's first frame — 12 s, 30 s, 75 s, each at least where the song will be (its place now + 6 s); when
  the song is due + nothing sounds, whatever has arrived (if it covers the moment + 1 s); a slice running low (< 3 s left, in the first 45 s)
  re-cut from what has arrived (≤ 8 slices). Every slice's samples ARE the whole decode's (`core/mp3-slice.js#prefixCut` — a frame boundary;
  the E2E compares all ten files: the difference 0) → the player SWAPS slice → longer slice → whole on ONE SAMPLE (`core/sync-math.js#envelopeFrom`
  carries the gain on): no seam, no double play, no re-place. **A CUE-IN = RANGE MODE:** the stream starts at a frame ~0.5 s before the cue — ONE
  Range request, placed from the file's first audio frame's byte the build measured (`ff`, dealt in `game.ff` beside `game.cu`; without it a
  second request for the first 4 KB places it); a headerless decode lands `LAME_DELAY` 1105 samples later than the
  whole file's trimmed one — the same samples otherwise (measured: 0) — so each buffer carries its sample 0's FILE time (`bufferT0`). The intro
  is never fetched (Feeling Human Again: ~500 KB). A slice only while the rest is > 1.2 s away (good signal = one decode, as before). Slow 3G
  (50 KB/s, 2 s latency): AUDIBLE AT GO (e2e — incl. Feeling Human Again from 34.19 s, and an 8-board room sharing the line at ~17–24 KB/s).
- **THE BEAT FIX — THE HEARD BEAT (PD-5A — `sync.js` PURE + `audio.js#createHeardBeat`; tests/prism-sound.test.mjs):** before, the beat-timed
  visuals ran on the SERVER clock beside the song's AUDIO clock — an iPhone reports no output latency, and SETTINGS → SPEAKER DELAY moved the song
  earlier but not the lights → the lights ran AHEAD of what you hear. Now ONE clock, `view.js#songClock`: `pos` = the song AS HEARD = (the audio
  clock's heard time − the SOUNDING voice's origin — `synced-songs.js#voice`) − SPEAKER DELAY − what the browser can't report (an iPhone's built-
  in speaker: 20 ms, the city's figure — 0 when it reports a latency) − the measured lead; before a voice sounds, the same place from the room's
  clock (`serverSongPos` — the two agree: e2e 0–1 ms). The world's pulse (`beatPulse`), the countdown's numbers + ticks, the musical SFX (the
  next 16th: `atCtx(songT)` = the voice's origin + songT + the lead — the song's own clock, so a SPEAKER DELAY no longer puts every clear late),
  SCORE RUSH's finale — all read it. **THE MEASURED LEAD** (the city's approach — core/harbor-beat.js): a listener on PRISM's song chain (the
  city's own: a 150 Hz low-pass → a 1024 analyser's time-domain RMS, its KICK_LAG) hears the strong kicks; `leadKick` turns their distance from
  the grid into ONE number per song, slowly + bounded; a trusted grid ALWAYS punches — the kicks only trim it, and only up to `LEAD_CAP` 60 ms:
  kicks that pull it further sit OFF the beats (a syncopated groove — Summer Felt Longer Then's) → that song is the grid alone (DEAF, lead 0 — never a
  wrong shift); a lead still settling isn't applied. Measured in Chrome: c2-day8's kicks land within ±10 ms of the grid (lead −3 ms, locked); prism1
  + Summer Felt Longer Then → deaf (the grid as built). What no page can hear: a Bluetooth / TV delay iOS doesn't report → SETTINGS → SPEAKER DELAY
  (☰ → Settings, in a match too) — the song plays that much earlier AND the lights hold back the same. THE BEAT CHECK on a phone:
  `prism-preview.html?beat=1&song=<id>` (a big flash on every beat as heard + the readout: the lead, the delays, the slice).
- **THE NIGHT GAIN (PFIX-A):** the night songs were mastered hot (prism1 −8.7 · prism2 −12.5 · prism3 −15.0 · prism4 −8.9 · prism5 −7.6 LUFS) beside
  the day set's −14.4: each plays through a PLAYBACK gain — prism1 −5.7 dB · prism2 −1.9 · prism3 0 (a cut only, never a boost) · prism4 −5.5 ·
  prism5 −6.8 — measured from the files (`python scripts/build-prism.py --night-gain`: ebur128 → the song's JSON `lufs` / `tp` / `gain` →
  the manifest's `gain`; a new night song is measured on its build). The files are untouched. Applied PER VOICE (`audio/synced-songs.js`
  `levelOf` — a gain node after the voice's envelope, so a crossfade keeps each song's level + every envelope reading is as before; the
  listener's kick detector is level-relative). `__prism.audio().levels` shows each sounding voice's level.
- **THE TEARDOWN (PFIX-A — FABLE REVIEW finding 3):** every match left its whole screen in memory (+12 MB of canvas, +327 DOM nodes, +17
  listeners, a reverb a match). Two causes, both fixed: the console's `ui/fit.js` late-font list held each podium name's fit (and its element)
  — now WEAKLY (a fit lives as long as its element: `fits` + `anchors` WeakMaps); and PRISM's `unmount()` now destroys EVERYTHING `mount()`
  made (`board.destroy` — the board + its two offscreens, `fx.destroy`, `nfx.destroy`, the callouts, `synth.destroy`, the root's
  ResizeObserver, the hide / pagehide listeners) and sizes every canvas under its root to 0 × 0. ONE reverb a page (`audio.js#chainFor` —
  the synth's bus + dry + convolver are the AudioContext's; optional 18). Proof: `tests/integration/e2e-prism-leak.mjs` (below — docs/testing.md).
- **Musical SFX** (`audio.js#createSynth`): every note comes from the current song's scale (`tonic` + `mode`); line-clear phrases,
  twists, KO, level-up are quantized to the song's next 16th note (beat clock from the analysis); combos climb the scale; the
  countdown ticks are scheduled on the beats before GO. Synth: soft plucks, FM bells, a detuned pad, one convolver reverb (ONE a page — PFIX-A).
  `window.__prism.synthLog()` records every note (the E2E checks key + grid).
- **THE LAYOUT — THE MAX BOARD (PD-1, Nov 9 2026; the owner's plan in docs/games/plan.md "PRISM DROP — THE REWORK PLAN"):** `layout.js` (PURE —
  `tests/prism-layout.test.mjs`) sizes everything from the screen + the real safe areas (the view reads `.pd-ui`'s resolved paddings once per
  layout change, never in the frame loop): the corner row (☰ top-left · THE TOP LINE · the music top-right — the shared OC8 buttons, PRISM draws
  nothing of its own up there) = 52 pt under the safe area; under it THE FIELD, centred: `[12 pt][THE BOARD 10 × 20][8 pt][THE RAIL 34 pt][12 pt]`.
  The cell is as wide as the phone allows, checked against the height (20 rows always fit — never clipped, never scrolled), snapped to the device's
  pixels (thirds of a point on an iPhone): **32.3 pt at 390, 33.3 at 402, 36.3 at 430** (was ~25), capped at 44 (a desktop's phone column: 41.3).
  - **THE TOP LINE** (between the buttons, `var(--cb-room)` both sides, centred): `BATTLE · 5 LEFT` / `SCORE RUSH · <your score>` + the world's
    name (SCORE RUSH: the time left first); its font sized from the text's length + the room (no measuring), never wrapping; an announcement takes
    the line for a moment (`.pd-top.has-ann`).
  - **HOLD + NEXT** float INSIDE the board's top corners (HOLD 2 × 1.6 cells, NEXT 4.5 × 1.6 with THREE pieces): slim see-through glass; when the
    falling piece or the stack is under one (`layout.js#panelCells` — the cells it covers) it fades to 0.3 (`.is-under`), so the piece reads.
  - **THE SLIM RAIL** (`rail.js`): one tile per opponent (54 pt, shrinking to fit 7): their colour (a left stripe + the border), their initial,
    their stack height as a fill (a scaleY layer — `is-high` from 65 % turns its edge red), KO when out, a white outline flash when your attack
    lands on them (`rail.hit`), the current target's thin white ring, a red notch on whoever is hitting you; SCORE RUSH: score order + the rank. A
    FINAL DUEL: the one tile grows and shows their board (`drawMini`). The old side columns (badges, TARGET, the stats) + the mini-board row are
    GONE — their data stays in the game state (the podium, THE BOARD, PD-2's cards); targeting keeps its saved mode (PD-2 makes it automatic).
  - **THE SLAM BUTTON** (gestures — the default): a glossy RED PUSH BUTTON at the rail's foot (36 + 8 × button size pt — 40 by default, a 52 pt tap
    area), leaning OUT into the screen margin so it never comes within 5 pt of the board: a chrome bezel (light top → dark bottom), a red dome (bright
    top-left → deep red edge), a gloss, SLAM in white; the press sinks + darkens the dome (`.is-down` from `input.js#bindButtons`), the release
    flashes (`.is-flash`); its sound = the hard drop's. transform + opacity only. Nothing like a shell DANGER tube. The LEFT setting (Settings →
    SLAM BUTTON) mirrors the rail + SLAM to the board's left (the junk meter moves to the right edge).
  - **THE BUTTONS scheme** (Settings → CONTROLS): the board shrinks to fit the button bar under it (27.7 pt at 390); no SLAM (its own DROP); the
    rail stays on the right.
  - **The countdown** card + numbers sit over THE BOARD (the overlay padded by the rail + gap), not the screen's centre.
- **Visuals:** the board is Canvas 2D with pre-rendered sprites (`board.js` — THE LOOKS: the glass jewels by DAY, the neon tubes by NIGHT, PD-3) at the
  phone's **FULL pixel ratio** (PD-1: 3× on an iPhone — was capped at 2; the HOLD / NEXT pieces + the minis too); the world is one WebGL fragment shader
  per world at 0.24–0.45 of screen resolution (`worlds.js`; uniforms: beat, energy, bloom, hue, combo, wave, danger, duel, glitch + PD-3's calm, board)
  and shards are a capped canvas particle layer (`fx.js`) between them; PD-3's LIGHT LAYER (`light.js`) sits ABOVE the board. FOUR quality tiers (PD-3
  — `tiers.js`, below) step down when the p75 frame > 19.5 ms. Measured (PD-1,
  `prism-shots.mjs` at 390 × 844 @3, 7 opponents, a bot playing, 4× CPU, GPU): **60 fps at every tier (p95 16.8 ms), 1.7 ms of CPU a frame** —
  the same 60 fps as the view before PD-1 on the same page. "Reduced effects" (settings) + prefers-reduced-motion
  turn off shards, hue drift, beat pulses and camera pulses.
- **THE NIGHT LOOK (PD-3, Nov 9 2026 — the owner's decisions: docs/games/plan.md "PD-3"; the pass log: docs/harbor/passes/pd-3.md).** THE GAME
  LOOK (`body[data-look]`, ☰ → Settings, read LIVE — `view.js#watchLook`): `day` = THE CRAYON LOOK (PD-4 — below), anything else = NEON
  (`.pd[data-look='neon']`). A look = sprites + effects behind one interface (`board.js#LOOKS` + the draw's `look` / `pal`); the engine never changes.
  - **THE NEON TUBES** (`board.js#neonSprite`): a solid DARK core (a deep tint of the colour), a crisp HOT EDGE tube in the piece's colour with a
    near-white core line down its middle, a fine glass sheen, the tube's light baked into the core's edges; the static glow PRE-RENDERED (a soft ring
    sprite drawn 'lighter' under the stack — never a per-frame shadowBlur); THREE variants per colour (a hotter stretch of tube — real neon is never
    even; the stack picks by place, the falling piece by cell). The landing ghost = an UNLIT tube (a thin pale line); junk = a cool grey tube; the
    danger drain the same grey sprite as before. HOLD / NEXT, the rail's duel mini, spectating's boards + the podium's winning board draw the same tubes
    (`drawPiece` / `drawMini` take `look` + `pal`; a mini under 18 device px a cell = a lit edge + a dark core).
  - **THE PALETTES** (`neon.js` — PURE): each piece keeps its COLOUR FAMILY in every world (JEWEL's hues: the long piece cyan, the square yellow…); a
    world (`WORLD_SHIFT`) pulls every hue toward its own by a capped share (`PIECE_PULL`: yellow + orange barely move — 15° apart), shades the
    saturation + lightness, leans the glow toward its colour, and brings its frame tube (`edge`), the frame's light (`frame`), the walls' line (`well`)
    + two spark colours. AURORA → teal · NEON CITY → magenta · DEEP NEBULA → violet · CRYSTAL CAVE → icier + lighter · SYNTH SUNSET → warmer. Never a
    swap. `tests/prism-neon.test.mjs`: every world keeps each hue within ±15° of its JEWEL hue, every pair of pieces ≥ ΔE 18 (CIE76), junk ≥ 25
    from every piece, sunset warms + crystal cools ≥ 5 of 7. The view sets `--pd-edge` / `--pd-frame` / `--pd-well` on a world change (the CSS: the
    board's frame = a neon tube with a white-hot core, HOLD / NEXT, the rail tiles, the top line, the callouts, the incoming tag, the cards).
  - **THE CALMER WORLD** (`worlds.js` — uCalm + uBoard): behind the BOARD only the world is dimmed to ~50 % under a soft dark glass (its HUE kept, the
    brights compressed, a little less colour — a grey wash turned a bright sky into a flat brown panel, round 1), feathered ~2 cells; a lighter
    vignette keeps the top + the edges round the board vivid. The board's own glass is thinner in the neon look (0.3).
  - **THE LIGHT ENGINE** (`light.js` + `neonfx.js`): ONE low-res WebGL canvas ABOVE the board (`.pd-light`, z 3 — the overlays at 4), pure ADDED light:
    it writes premultiplied (rgb, a = max(rgb)), so the page composites `light + below × (1 − a)` (no CSS blend mode). Soft light quads (a blob, a
    streak with a tapering tail, a soft rect, a frame ring) in ONE vertex batch, then THE BLOOM on the GPU: a bright-pass (only light above 0.42
    blooms — a wide wash would lift the board's blacks: round 2) + a dual-filter chain at ½ → ¼ → ⅛ and back up. The canvas hides itself when nothing
    is lit. **Why not bloom the whole board:** copying the 3× board canvas (970 × 1940, 7.5 MB) into a texture every frame MEASURED 0.7 ms to issue and
    2.4–4 ms to finish on the mini PC's Chrome at 4× CPU (`tests/integration/prism-upload-cost.mjs`) — and on an iPhone that 2D canvas is rasterised on
    the CPU; the light layer's whole cost is ~0.5 ms a frame (the A/B below). The effects (each big but SHORT, never covering the stack or the incoming rows):
    - THE SPILL — the falling piece's coloured light on the empty well + the blocks near it, the nearer WALL catching more at its height, a faint pool
      on the floor when it's near the bottom (top two tiers only).
    - THE LANDING PULSE — the cells that lock surge (their tubes ring with light + a soft fill), ~0.26 s; stronger after a SLAM.
    - SLAM — a light trail per column from where the piece was to where it landed (the tail catches up), then an impact flash along its foot + sparks.
    - LINE CLEARS — light RACES along each clearing row's tubes (rows alternate direction; each cell's tube surges as the head passes, 150 + 20 × lines
      ms), then the rows BURST: a white-hot flash, sparks with glowing trails (more per line + per combo step) and the shards (`fx.js`, behind the
      board, flying out into the world — every clear now, fewer for one line). 4 LINES / a perfect clear: a breath of light over the board + the frame
      flares; a combo lifts the frame's light (0.2 + 0.16 × combo), settling over ~1 s. A cancel (BLOCKED!) adds a faint red flash.
    - "Reduced effects" + prefers-reduced-motion: no motion (the race is instant, no trail, no sparks, no shards), every light × 0.35, the flash × 0.3.
    - Sounds: PRISM's own synth SFX as before (in the song's key, on its beat) — no new files.
- **THE CRAYON LOOK (PD-4, Nov 9 2026 — the owner's decisions: docs/games/plan.md "PD-4"; the pass log: docs/harbor/passes/pd-4.md).** THE GAME LOOK's
  DAY = a COLORING BOOK (`.pd[data-look='crayon']`; night = NEON; the glass look is RETIRED as the day look — kept in board.js as a look of its own, nothing
  picks it). The engine never changes; a look = sprites + moments + the page behind one interface.
  - **THE CRAYONS** (`crayon.js` — PURE): the SAME colour families as the night (JEWEL's hues — the long piece turquoise, the square yellow…) in crayon
    shades (`CRAYON`) + each one's outline = the same crayon pressed harder (`CRAYON_LINE`); junk = a graphite crayon. `tests/prism-crayon.test.mjs`: every
    crayon ±15° of its JEWEL hue (PD-3's family test), every pair ≥ ΔE 18, junk ≥ 25 from every piece, and on EVERY paper every fill ≥ ΔE 25 off it +
    every outline ≥ 3:1, the page's ink ≥ 4.5:1, the pencil ≥ 3:1.
  - **THE BLOCKS** (`crayon-art.js` — all PRE-DRAWN ONCE into cached sprites at the board's full ratio; the frame loop only blits): a waxy FILL (diagonal
    strokes pressed unevenly, the wax building up at the edges, the paper's TOOTH punched through — two octaves of value noise, thresholded), a bold
    slightly WOBBLY outline in the darker shade drawn TWICE (the second pass a little off), a few broken light strokes for the wax's sheen. SIX variants
    a colour — the stack picks one by place, the falling piece by its own cell (it keeps its drawing while it falls). The landing ghost = a light pencil
    outline; the danger drain = the same block in grey; HOLD / NEXT, the rail's duel tile, spectating's boards + the podium's winning board draw the same
    (`drawPiece` / `drawMini` take `look: 'crayon'`; a mini under 18 device px = a crayon fill + its outline). The view warms every block for the board's
    size + HOLD / NEXT's in ≤ 4 ms slices between frames (`warmCrayon`), so a live switch never draws one mid-frame.
  - **THE PAPERS** (`crayon.js#PAPERS`, `assets/prism/paper/*.webp` — CC0, the grain only, ~81 KB in all, built by `scripts/build-prism-paper.py`):
    NOTEPAD (ruled blue lines + a doubled red margin) · GRAPH PAPER (a 13 px grid, every 5th darker) · CONSTRUCTION PAPER (a fibrous slate-blue sheet) ·
    a COLORING PAGE (a thick hand-drawn frame; the doodle in black outlines like a coloring book). THE HOST DEALS ONE PER MATCH (`index.js#start` →
    `game.pp` = `crayon.js#pickPaper(seed, used)`): the SAME page on every phone, a rotation through all four, never the same twice in a row — remembered
    in THE NIGHT'S MEMORY (`meta/used/prism/pp<k>-<i>` — kit/night.js; no rules change). A game from before PD-4 takes its seed's (`paperOf`).
  - **THE PAGE** (`page.js` — ONE canvas, `.pd-page`, under everything; redrawn only when the paper / the song's world / the screen / the board's place
    changes — never in the frame loop): the grain tiled, the rulings DRAWN IN CODE, THE WORLD DOODLE (each song's world as a faint crayon line drawing —
    SYNTH SUNSET a striped half sun over a road + mountains, NEON CITY a skyline in the rain, CRYSTAL CAVE crystal clusters + stalactites, DEEP NEBULA a
    swirl of stars + a ringed planet, AURORA OCEAN wavy ribbons over waves; drawn once per song into its own canvas, the tooth punched through, at 0.24),
    then the board: its well washed with the paper (the doodle only faintly through it) + a hand-drawn PENCIL frame (two passes, the corners
    overshooting); the board's own canvas adds a faint PENCIL grid. Spectating + the podium: no board on the page. The WebGL world is NOT drawn by day
    (its work skipped) and the light layer stays off.
  - **THE PANELS GO PAPER** (css/prism.css "PD-4"): the paper's colour, ink + grain arrive as `--pd-paper` / `--pd-ink` / `--pd-grain`; HOLD / NEXT =
    slim paper cards a touch askew with a pencil border (still fading when a piece passes under), the rail = paper tiles with a hatched crayon fill for
    the stack, a red X scribble for a KO, a crayon circle for the hit flash, a pencil ring for the target; the top line in dark pencil-grey marker; the
    KO card, the count, the tip, Call the Winner, spectating, the podium's body (+ the console frame's kicker + winner line + the results rows' text),
    the BUTTONS scheme = paper. SLAM stays the glossy red push button (a paper shadow); the ☰ / music buttons stay the console's.
  - **THE MOMENTS** (`crayonfx.js`, on the board's own canvas — all short, from pre-drawn sprites): LANDING = the boing (the piece's crayon outline
    squashes + springs back, bounce marks at its foot, 0.26 s) · CLEARS = the rows SCRIBBLED OUT (a zig-zag crayon stroke races across each, rows
    alternating — the rows held on the page for the race, 120 + 20 × lines ms) then they crumble into crayon CRUMBS that pop up, fall + fade; bigger
    clears = thicker scribbles + more crumbs; a combo's scribbles in more colours; 4 LINES / a perfect clear = a big crayon STAR BURST (drawn BEHIND the
    stack — it never covers a block) · SLAM = crayon speed lines down to the landing + impact ticks · INCOMING (`LOOKS.crayon.incoming`) = grey PENCIL
    SKETCH rows (hatched both ways, never a crayon block; an occupied cell only tinted; shaking pencil marks at both sides; a pressed pencil leading edge)
    + a paper tag `INCOMING 3 · EVE`; a cancel = the pencil rows crumble into pink ERASER crumbs · the finale / a victory's board breaks into crayon
    crumbs (`fx.js` `crayon: true` — paint on paper, not light). Reduced effects / reduced motion: nothing moves (no race, no crumbs, no squash, no
    streaks) — the scribble + the star just show + fade. The crumbs' cap = the tier's sparks.
  - **THE LETTERING** = Permanent Marker (Font Diner — **Apache License 2.0**, not OFL: Google Fonts lists it under apache/; self-hosted latin woff2,
    30 KB, `assets/fonts/prism/` + `LICENSE-PermanentMarker.txt` + a CREDITS line) as `'PD Marker'`, loaded by `page.js#warmDay` through the FontFace API
    ONLY when the day look shows (never in the boot graph, never by night); the UI font until it's in. It has no `→` (the callouts' arrow falls back to
    the UI font). THE CALLOUTS: the marker with the crayon's tooth as a CSS mask (`--pd-tooth` — `crayon-art.js#toothMaskURL`) + a paper-coloured edge
    (8 offsets of `--pd-paper`) so they read over any block; BLOCKED! = the shared `--good` darkened by `color-mix` (colour-blind mode follows) + the word.
  - **Measured (PD-4 — `prism-shots.mjs` PERF with `PERF_LOOK=day`, 390 × 844 @3, 7 opponents, a bot, 4× CPU, GPU; each tier locked, ~300 frames):**
    REST — 60 fps at every tier (p95 16.8 ms), CPU a frame (p75 / p95) 2.0 / 2.8 ms (tier 3), 2.0 / 2.8 (2), 2.1 / 2.8 (1), 2.0 / 2.7 (0). HEAVY (a
    4-line clear every 650 ms with the combo climbing + six incoming rows + 7 rail tiles) — 60 fps at every tier, CPU 4.8 / 6.0 (3), 4.3 / 5.4 (2),
    3.7 / 4.9 (1), 3.0 / 3.8 (0). (The night: 3.5 / 5.7 at the top tier — the day skips the WebGL world.) A LIVE SWITCH night ↔ day mid-match: the
    longest frame 17 ms both ways (e2e-prism).
- **THE TIERS (PD-3 — `tiers.js`, `tests/prism-layout.test.mjs`):** the view starts at the TOP tier (3) and steps down while the p75 frame > 19.5 ms.
  The light goes FIRST, the board's full 3× LAST:
  | tier | board | world | light layer | bloom | spill | sparks | shards | glow |
  |---|---|---|---|---|---|---|---|---|
  | 3 | 3× | 0.45, 4 oct | 1× CSS | 3 levels | on | 260 | 200 | on |
  | 2 | 3× | 0.34, 3 oct | 0.75× | 2 levels | on | 160 | 130 | on |
  | 1 | 3× | 0.28, 2 oct | 0.5× | off | off | 90 | 80 | on |
  | 0 | **2×** | 0.24, 1 oct | 0.5× | off | off | 40 | 40 | off |
- **Measured (PD-3, `prism-shots.mjs` PERF — 390 × 844 @3, 7 opponents, a bot playing, 4× CPU, GPU on; each tier LOCKED, ~300 frames recorded):**
  REST (the bot) — 60 fps at every tier, p95 16.8 ms; CPU a frame (p75 / p95) 3.5 / 4.2 ms (tier 3), 3.5 / 4.0 (2), 2.6 / 3.6 (1), 2.7 / 4.0 (0).
  HEAVY (`&heavy=1`: a 4-line clear every 650 ms with the combo climbing + six ghost rows + the bot + 7 rail tiles) — 60 fps at every tier, p95 16.8
  ms; CPU 5.7 / 6.6 ms (3), 5.3 / 6.2 (2), 4.8 / 5.7 (1), 4.0 / 4.7 (0). A/B against PD-2 on the same page (:5174): rest 2.7 vs 2.2 ms, with six ghost
  rows 3.8 vs 3.0 ms — both 60 fps.
- **Checking a real phone:** add `?pdperf` to the address (it survives joining a room): a corner readout of fps, frame
  CPU time, quality tier, world resolution, audio state/latency and the songs playing.
- **THE PODIUM (PD-1 — the console's, docs/cartridge.md D8):** `index.js` exports `finalScene` (`victory.js`) — PRISM draws ONLY the BODY inside the
  console's frame (`ui/final.js#createFinal`: the WINNER line, BACK TO THE ROOM, the XP box, the card reveal, the results list from 4th, the
  console's winner sting — no `OWN_VICTORY_SOUND`): THE WINNING BOARD (the winner's last published board, frozen — `drawMini`) + one line
  (BATTLE: "3 KNOCKOUTS · 31 LINES SENT"; SCORE RUSH: points · lines · the best combo), then the TOP 3 as the console's slim cards (`leaderboard()`);
  a name with a profile opens THE PLAYER PAGE (`profile/player-page.js#openPlayer` — the podium only, never during live play). The old BATTLE REPORT
  table is gone. `ACCENT = '#8fd8ff'` (meta.js — the theme's spectral cyan) lights the frame's main tube. THE BOARD's PRISM DROP tab is fed as
  before (`core/match-report.js` / `core/boards.js` unchanged).
- **THE PRELOAD (PD-1):** `preload()` (every phone, the walk inside): the manifest + the FIRST song's analysis (~5 KB, predicted from the room's
  `meta/prism` playlist; a room's first match — no playlist yet — all five, ~25 KB). The worlds are shaders in code (in the view's module graph, already
  preloaded — `js/games/preload-graph.js`, 29 modules / 213 KB; PD-4: 40 modules / 370 KB). Far under the 1.5 MB budget (the day's papers + font load
  only when the day look shows — `page.js#warmDay`, ~110 KB); the song file is not preloaded (above).
- **THE PREVIEW's SOUND (PD-5B):** every state that plays the song (all but `&state=final`) shows TAP FOR SOUND (the engine's tap listeners —
  as in the app; a test browser gets none unless `&sound=1`; `&mute=1` = none). The day set: −14.4 LUFS each through one gain (no per-set gain).
- **THE PREVIEW (PD-1 + PD-2):** `tests/integration/prism-preview.html` mounts the REAL view (the fake database) with a scripted state — `&n=1..7`
  `&state=play|count|ko|duel|final|spec` `&rush=1` `&scheme=buttons` `&slam=left` `&world=` `&bot=1` `&under=1` `&down=1` (SLAM pressed) `&hit=1`
  `&st=47&sb=34` (the safe areas); PD-2: `&mode=survival&t=` `&solo=1` `&state=kocard|ko|spec` `&inc=1|3|6&rise=fresh|mid|hot` `&shatter=n`
  `&callout=send|blocked|twist|b2b|ko|pc` `&fresh=1&tip=1` `&after=ms`; PD-3: `&look=day|night` (default night) `&reduced=1` `&heavy=1`; PD-4: `&paper=notepad|graph|construction|coloring` (by day) + from a shot's js:
  `__prism.fire('slam' | 'lock' | 'clear', { lines, combo, pc })` + `__prism.freeze(ms)` (the light layer held at that age) — the `pd3` set (35 states); PD-4's `pd4` set (the day — 43 states) + `sheet` (`prism-crayon-sheet.html`: every crayon drawing on each paper; an entry may name its own `page`). `node tests/integration/prism-shots.mjs "<chrome>" ./shots-prism [cpu]`
  shoots every state at 390 / 402 / 430 with each phone's real safe areas (`SIZES=`, `ONLY=`, `SETS=look,states,worlds,pd2`; an entry may be
  `{ q, js, w }` — a line of JS fired just before the shot) + the frame timing per tier (`PERF=0` skips it; `Q=` adds to every URL).
- **Measured (PD-2, prism-shots.mjs, 390 × 844 @3, 7 opponents, a bot, 4× CPU, GPU):** 60 fps at every tier (p95 16.8 ms); 2.1 ms CPU a frame
  (PD-1: 1.7), 2.3–2.5 ms with six ghost rows on screen.
- **Controls** (`input.js#makeGesture`, pure + unit-tested with 2000 random swipes): drag = follow the finger by distance (no
  overshoot), tap = rotate by screen half, slow drag down = soft drop row by row, flick (≥ ~1.15 px/ms over 70 ms, steep, ≥ 0.9
  cell) = hard drop, swipe up = hold. Settings: GESTURES/BUTTONS, swipe sensitivity, button size, reduced effects (`audio/settings.js`
  `prismScheme/prismSens/prismBtn/prismReduced`). Keys: ← → ↓ space ↑/X Z C/shift. (PD-1: the gestures are UNCHANGED — the owner: "the controls
  are really good"; the flick slams only with SWIPE-DOWN SLAM on — `prismFlick`; by default THE SLAM BUTTON drops.)

**THE DAY SET** (PD-5A — `python scripts/build-prism.py --day [--only prismd2]`): the five sources are fixed in `build-prism.py#DAY` (id, source,
world, title, artist, Claude (chat)'s measured BPM); the originals are only read. Each: a two-pass `loudnorm` (−14 LUFS integrated, −1 dBTP — the
target pulled down until the ENCODE holds −1 dBTP) → 112 kbps stereo 44.1 kHz; then the analysis of the encode decoded back: THE DAY SEARCH
(`beat_grid_near` — the night search folds into 90–180 BPM: an 80 BPM song came out at 160) + the checks — the BPM within 0.1 of the measured one,
NO DRIFT (the four quarters' best phase: trend ≤ 25 ms, scatter ≤ 45 ms — a groove may swing, a tempo error grows), NOT ON THE HALF-BEATS (the
grid's onsets ≥ 1.15 × the half-beat grid's). A song that fails STOPS (nothing written) and prints its numbers — never a guess. Then the cue-in
(`cue_in`: the first downbeat where the song's energy has arrived and stays — 30 ms before it; 0 when it's strong from the top or under 2 s in),
the last strong beat, the key, `lufs` / `tp` / `check` in the song's JSON; `write_manifest` (night rows untouched, then the day rows with
`look` + `cue`). The numbers: docs/harbor/passes/pd-5a.md.

**Adding PRISM DROP songs** (the owner drops `prism6.mp3`, `prism7.mp3`, … into ~/Downloads and asks to "add the new PRISM DROP songs"):
1. PULSE's Python venv (see PULSE step 1).
2. `~/.cache/neural-arcade/pyenv/Scripts/python scripts/build-prism.py` — encodes new/changed songs to `audio/music/prismN.mp3`
   (112 kbps stereo, full length), analyses beat grid / key / energy / last beat, picks a world from the song's mood (tempo,
   energy, brightness, major/minor; unused worlds first) and rewrites `data/prism/manifest.json`. A file named just `prism.mp3`
   gets the lowest free number. `--only 6,7`, `--force`, `--reworld` (re-pick all worlds).
3. Worlds: five exist (aurora, city, nebula, crystal, sunset) × 3 variants. Once every world is taken, a new song reuses the
   best-fitting one. For a song that deserves its own world, add a shader body to `worlds.js#BODY` + an entry with 3 variants
   in `WORLDS` + its mood target in `build-prism.py#WORLDS`, then `--reworld`. Override by editing `"world"` in the song's JSON (kept on rebuilds).
4. `node --test tests/prism.test.mjs`; look at it in `prism-preview.html?world=…`; play a Score Rush (`?emu`, two slots).
5. Commit `audio/music/prism*.mp3` + `data/prism/` and push.

## FR7 FIXES A (Nov 12 2026 — docs/harbor/passes/fr7-fixes-a.md)
- **PD1**: the test hook (`window.__prism` — its `bot()` is a perfect robot) installs only on a test page (`kit/hook.js#testMode`: `?emu`, localhost,
  a `/tests/` preview — never deployed), never on the live site.
- **PD3** (a rules change): an attack carries its piece number `i`; the key = `{uid}-{i}` and `i` ≤ the sender's saved pieces + 15 — no board, no
  attacks. The rules-lag fallback: refused on the old rules → the same attack once more without `i` (the page stops sending it once that lands).
- **PD4** an out by the director (AWAY / SIGNAL LOST) before the screen mounted → the KO card, the call, spectating (the preview's `&state=away`).
  **PD5** no WebGL: no throw, HOLD + NEXT drawn. **PD6** A CAPPED FRAME RATE IS NOT A SLOW PHONE (the city's probe — `kit/tiers.js`). **PD7** the
  sprite caches go `DROP_MS` (60 s) after the match's screen (a rematch keeps them).
- Not changed: `RUSH_PACE.margin` (it wants a fresh `sim-prism-rush.mjs` against the tighter number — FR7 FIXES B).

## PD-6 (Nov 13 2026 — docs/games/passes/pd-6.md)
- **THE SPARE-WIDTH COLUMN** (`layout.js`, PURE): HEIGHT-bound (Safari WITH its toolbars — 20 square rows can't get wider without getting taller)
  → the board at the 12-pt margin, the spare width to the rail + SLAM column: `railW` = the spare, 34 → `COL_MAX` 72 pt (device pixels); SLAM =
  the column − `SLAM_PAD` (10), between today's 40 and `SLAM_MAX` 56 pt, CENTRED at the column's foot (`.pd.is-wide`); the tiles as wide as the
  column (initial 19 px); a duel tile's board up to 5-pt cells. WIDTH-bound (a home-screen app / fullscreen / a desktop's `MAX_CELL`) = PD-1's
  34-pt rail + today's SLAM exactly (`L.wide` false). LEFT mirrors it; BUTTONS: the bar shrinks the board as before, the rail takes the column.
  | screen | cell | column | SLAM |
  | --- | --- | --- | --- |
  | 390 × 650 (Safari, the owner's screenshot) | 29 | 68 | 56 |
  | 402 × 690 (Safari) | 31 | 60 | 50 |
  | 430 × 746 (Safari) | 33.67 | 61.33 | 51 |
  | 390 / 402 / 430 home-screen app (safe areas) | 32.33 / 33.33 / 36.33 | 34 | 40 |
  The plan said SLAM = column − 16: on the real Safari columns (60–68 pt) that left SLAM ~45 pt, not the ~56 asked for — −10 gives 50–56.
- **THE SOLO PODIUM** (`victory.js`): a solo run on a screen under 760 pt draws YOUR LAST BOARD at 7-pt cells (140 pt, not 160) — with the
  console's solo heading (ui/final.js `.is-solo`) it all fits above the foot in Safari with its toolbars.
- **TWO SOLO BUTTONS**: `meta.js#SOLO_RUNS` — SCORE RUSH · ONE SONG (the pink MAIN) + SURVIVAL · UNTIL YOU TOP OUT (docs/cartridge.md). THE DROP
  (the planned daily) is never a card button.
- **THE SLAM's WEIGHT**: `audio.js#hard` — the thump 100 → 32 Hz over 0.28 s (was 130 → 42, 0.22), gain 0.23; the tonic pluck darker + longer; a
  soft tonic an octave up (0.035) so a phone speaker feels the low note. **THE BOARD KICK** (`view.js#kick`): a 2.5-pt dip + a −0.5-pt spring
  back over 0.12 s — a Web Animation on `.pd-board` (+ the night look's `.pd-light` in step), transform only, no reflow; OFF under Reduced
  effects + prefers-reduced-motion (the old `.pd-thud` CSS dip — restarted with a forced reflow, the light left behind — is gone). Test hook:
  `__prism.kicks()`. 60 fps at 4× CPU with SLAM spammed: `prism-shots.mjs` `PERF_SETS=slam`.
- No "TIME!" moment at a SCORE RUSH song's end (the owner). Look review: `prism-shots.mjs` `SETS=pd6` (+ `NOSAFE=1 SIZES=390x650,402x690,430x746`).

## THE DROP — PRISM DROP's DAILY (THE DROP A, Nov 13 2026 — docs/games/passes/drop-a.md; the owner's plan: docs/games/plan.md "THE DROP")
SURVIVAL on the day's pieces + rising rows (the same for everyone), ONE counted run a day, score = TIME SURVIVED (lines break a tie). **Ships
OFF** (`config.js#DAILIES` `on: false`) — THE DROP B (below) brought the ticket, TODAY's third row, SHARE TODAY, the hide pause, PRISM's songs,
and THE SCHEDULED GO-LIVE (docs/progression.md — the owner turns it on from /admin, no deploy).

| file | what |
| --- | --- |
| `js/games/prism/drop.js` (PURE) | THE RUN — `createDropRun(seed)` (`createEngine({ mode: 'survival' })` + the schedule on the engine's 1/120 s TICK: inputs at k → one tick → k + 1 → the level + the rows due), `input` / `stepTo` (the phone: play + record), `replay(log, seed, { from, to, final, cut })` (the server), `snapshot` / `fromSnapshot` (EXACT — one JSON string), `scoreOf` / `dropLine` |
| `js/games/prism/drop-judge.js` (PURE) | THE SERVER's JUDGE — the small record, `upload` (a chunk SIZE- / ORDER- / TIME-bounded — never replayed), `act` (checkpoint · ppause · pause · resume), `begin` (the start: fresh / a RESUME that costs a pause), `abandoned`, `judgeFinish` (THE RE-PLAY CHECK — once a run), `joinChunks` |
| `api/_lib/drop.js` | `SERVER_CARTS.drop` on THE DAILY MODULE's generic path (`begin` · `stash` · async `resume` + `verify` · `abandon`) — the seed = HMAC(THE DAILY SECRET, `daily:drop:<day>`), nothing stored for the day |
| `js/games/drop/` | the DAILY-ONLY cartridge (meta · logic · daily · judge · index · view): `view.js` = THE DRIVER around PRISM's REAL view in its DROP MODE |
| `js/games/prism/view.js` | THE DROP MODE (`state.drop`): the engine = the run's, every input through the recorder (L R C W H X D S U), no publishing, no room watcher, no KO card, the top line `THE DROP · m:ss` |

- **THE SCHEDULE** (`dropEvery`): SURVIVAL's rows (10 s → 4 s over 150 s — `survivalEvery`) until **4:00**, then a smoothstep over 3 min down to
  one every **0.6 s** (7:00), held; **THE END at 8:00** (`END_TICK` 57 600): the run is over whatever the board (a bot at the floor tops out
  well before). The level = SURVIVAL's (`battleLevel`); each row's gap = `survivalGap(seed, k)`.
- **THE LOG**: one event per input that DID something — `<ticks since the last event><code>`; a natural lock writes `K` (the replay asserts it).
  THE HUMAN FLOOR: ≤ 24 inputs a tick, ≤ 160 a second, a slam ≥ 12 ticks (0.1 s — ≤ 10 pieces a second) after the last; the phone keeps it (a quick
  slam WAITS for its tick), the server refuses a log that doesn't. `LOG_MAX` 120 K chars (the heaviest bot run: 24.6 K).
- **THE REFUSALS** (`replay`): bad_log · too_big · out_of_order · illegal (an input that does nothing there) · lock_mismatch (a K with no lock / a
  lock with no K) · too_fast · past_end · not_over. A refused chunk changes nothing.
- **THE ADD-ON (the city chat's cost check — it overrides the lines below where they differ):** a CHECKPOINT every **30 s of play** + a pause +
  the page hiding / pagehide (the phone side — no auto-pause: the 3 are the player's) — ≲ 30 calls for an 8-minute run (start + 16 + the final
  upload + finish = 19, + 2 a pause); a checkpoint is only SIZE- / ORDER- / TIME-bounded, **NEVER replayed** — THE RE-PLAY CHECK runs ONCE per run
  (the finish; the close of an abandoned run at its last checkpoint); **THE PRUNE** (`api/_lib/drop.js#prune`, from THE DAY'S CLOSE's sweep, its
  own `pr` marker): 2 days on (the board final) only the top `PRUNE_KEEP` 10 runs keep their record + log, for `KEEP_LOG_DAYS` 7; everyone else the
  score row (`s` + `r`) — from the day's own keys, never a profile scan. A run's stored size: ≈ 250 B of record + its log (≈ 2–4 KB a minute of
  play) while it runs → ≈ 60 B (the score row) once pruned; a top-10 run ≈ 10–30 KB for a week.
- **THE RECORD** (`dly/drop/{day}/p/{pid}`, ≈ 250 B): `st, go (= st + 3 s: tick 0), len, k, t, ca, pz { n, ms, at?, kd 'p'|'r', rf? }, rz, e? o
  ('fin' | 'abandoned' | 'late' | 'pause_over') fa`; the log's CHUNKS at `dly/drop/{day}/l/{pid}/{offset}` — written once beside each move (`stash`), the finish
  joins them up to the CHECKED length (a resend at an old offset may be longer — the join takes the furthest). A checkpoint never re-sends the log.
- **THE CLOCK CHECK** on every upload: the engine time due = now − go − every pause; a tick AHEAD of it + 4 s → 422 `too_early` (a log built faster
  than real time); 20 s+ BEHIND (slow motion / a finish that arrived late) → the run ENDS at its last checkpoint + 15 s of play (`o: 'late'`).
  THE SLOW-MOTION CHECK again at the finish (the wall clock start → the last upload ≥ the engine time − the pauses − 4 s).
- **PAUSES**: 3 PLAYER pauses (`ppause`), 20 min in all, server-timed, the board + HOLD + NEXT + the light HIDDEN; over 20 min → ended at the
  checkpoint (`pause_over`). **A REFRESH** (a start on a run in flight — `begin`) = back at the LATEST checkpoint, the time since a player pause
  (backdated — the clock never runs ahead of the board): one of the 3 ("LAST CHECKPOINT · 1 PAUSE USED"); none left → ended there. **THE ROOM
  WINS** (`pause { room }`, checked like COAST CLEAR's — 409 `no_room_game`) uses none of the 3 (its own 60-min cap); its call carries the freshest
  chunk (`judge.bind`).
- **ABANDONED**: silent past every budget / no resume possible → scored at its last checkpoint by the player's next `today` (`api/daily.js#settleRun`
  — an ENDED run whose finish never came too) and by THE DAY'S CLOSE's sweep (`daily-close.js#sweepRuns`: yesterday's that can't come back; the
  day before's all — its run window is over).
- **THE SCORE**: `round(t / 100) × 1000 + lines` (`better: 'high'`, 5-s buckets) — YOUR TABLE, PENTHOUSE, the band + DAILY POINTS rank alike
  (lines capped at 999 — a tie-break only). **DAILY POINTS**: 10 + 90 × (t / 8:00)^0.6 — 0:30 → 27 · 2:00 → 49 · 4:00 → 69 · 6:00 → 85 · THE END 100.
- **THE COST** (measured): a whole-log replay 4–17 ms in node (the heaviest bot run: 351 s, 2 747 pieces) — once a run; a checkpoint does no
  replay at all; a finish over /api on the emulators ≈ 25–36 ms in all. Server-Timing names the replay (`replay;desc="8.1 ms"`).
- **Tests**: `tests/prism-drop.test.mjs` · `tests/prism-drop-judge.test.mjs` · `tests/integration/daily-drop.test.mjs` (/api) · `e2e-drop.mjs`
  (needs `DAILY_TEST=1 DAILY_TEST_OFF=drop` on the server — `DAILY_TEST_OFF` opens an OFF row on the emulators only).
- **THE DROP A's Group 0 (PD-6's review):** SLAM = the column − 6 (`SLAM_PAD`; 62 / 54 / 55 pt at 390 / 402 / 430 in Safari, `SLAM_MAX` 66);
  THE DUCK (`audio.js#duck` — its own gain in the song chain: −4 dB, 20 ms down, 0.1 s held, 0.12 s back, one per 0.32 s; none with the music
  off); THE LOST RUN (docs/profiles.md).

### THE DROP B (Nov 13 2026 — docs/games/passes/drop-b.md; plan.md "THE DROP — PASS B")
- **HIDING THE PAGE = AN AUTOMATIC PLAYER PAUSE** (it replaces pass A's hide-without-pause): `visibilitychange → hidden` / `pagehide` during a run
  = a `ppause` carrying the freshest chunk, sent with keepalive — one of the 3, server-timed; back on the page the board stays hidden behind RESUME
  (ONE line `PAUSED · n LEFT` — a tap's pause, a hide's and a refresh's alike). An unconfirmed hide pause is asked again on the return. **No pause
  left** → the hide sends a checkpoint, the clock runs: back within `SLOW_TOL_MS` (20 s) the run catches up; later → the phone steps at most
  `MAX_TAIL_MS` (15 s) of gravity past the hide and uploads with **`aw: 1`** — `drop-judge.js#upload` checks the gap on ITS clock (due − the last
  checkpoint's t > 20 s) and ends the run `late` at the checkpoint + 15 s (a short hide's `aw` is just a checkpoint; ending your own run early is
  only a loss). A reload's own pagehide pauses it first (that is its one pause — the start resumes into it; the LAST CHECKPOINT line). The driver
  runs no frame while hidden (`hiddenNow`).
- **THE SONGS**: a run deals PRISM DROP's own set — the DAY or the NIGHT set by the phone's look (`setForLook(body[data-look])`), 10 songs from the
  day's seed (`drop/view.js#DROP_SONGS`) — onto the view's synced player (the quick start, the heard-beat clock, the night gains) from the 3-2-1;
  the row's `ownMusic: true` keeps the console's music silent (`app.js#musicFor` → `[null]`); the meta's `MUSIC = null`, `musicFor` → `[null]`.
- **THE ONE-TIME HINT**: the row's `lesson: true` + `drop/index.js#HINT` ("Survive as long as you can — the rows keep rising. One run a day.") —
  one line at the board's top through the 3-2-1 (`.dr-hint`), gone at the first move or 6 s of play (`HINT_MS`), seen once (`pstats/{pid}/ls/drop`).
- **THE SHARE** (`js/games/drop/share.js`): SHARE YOUR RUN's card (`kit/share-run.js` + `prism/share.js#drawBoardMiddle`, both looks) with THE
  DROP's final board — **every junk row drawn SOLID** (`solidJunk` — the day's holes never reach a picture; the server runs it too) — THE DROP · the
  day, the time big (m:ss.t / 8:00), the lines; SHARE on the run's end card (the phone's own engine board); SHARE TODAY's section
  (`paintSection(c, { inputs, look, W, H, P })` — the board + the time pair; `P` = prism/board.js); the server's spoiler-free inputs
  (`api/_lib/drop.js#share` — the finished run replayed once, on the tap only: `{ t, ln, b, day }`). share-same.html proves the card is
  pixel-identical inside SHARE TODAY.
- **THE TICKET**: `ticket-art.js#TICKET_ART.drop` (the prism + its split light — three spectral tubes `.sp` that keep their colours) + THE INK
  TABLE `TICKET_INK.drop` — night PRISM DROP's white light `#eef1ff` (its ice-blue accent would twin COAST CLEAR's cyan), day a spectral violet
  `#6a3fd0`, the stamp `#d9ccff` by night.
- **THE SLAM ADD-ON** (Ben, Nov 13 9:56 pm — `layout.js`, PURE): in EVERY layout SLAM = the whole strip from the board's edge to the screen's safe
  edge − `SLAM_RIM` 4 pt each side (whole points), centred across that strip at the column's foot (`slamX` → css `--slamX`, LEFT mirrors it); the
  board + the rail tiles never change; capped at `SLAM_CAP` 84 (a desktop). The home-screen app 40 → **46 / 47 / 46** pt at 390 / 402 / 430 (the
  real strip is 54.3–55.3 pt); Safari with its toolbars 62 / 54 / 55 → **80 / 72 / 73**. The BUTTON SIZE slider now sizes the BUTTONS bar only.
- **A SOLO RUN PAUSES WHILE HIDDEN** (Ben, Nov 13 9:59 pm — "SURVIVED 2:04 · 0 LINES": the multiplayer AWAY rule had put his solo SURVIVAL out
  when he came back, its time = wall time): a room of ONE (PLAY NOW or a room of one), SCORE RUSH + SURVIVAL, both looks — the page hiding
  (visibilitychange / pagehide) → `host.js` (this phone IS the host) writes the cartridge's PURE `soloPause(game, { at })` = `{ pz }` at once;
  back on the page `soloResume(game, { now })` shifts EVERY clock (`playStartAt`, `songStartAt`, `endAt`, `phaseEndsAt`, …) by the time away +
  `RESUME_MS` (3 s) and sets `rz` (GO again) + `pms` (the paused total) — the rows' schedule, the song, SCORE RUSH's end + SURVIVAL's time
  (`out.at − playStartAt`) resume exactly where they stopped: **the time = time PLAYED** on the result, the podium + the report. The director
  holds a paused run (no end, no AWAY / SIGNAL LOST, 30 s of grace after the 3-2-1); `direct()` also resumes a paused run on a visible page (a
  rejoin). The view holds the engine + input (`logic.js#soloHeld`), freezes the clock where it stopped, and draws the 3-2-1 in the count's own look
  (`.pd-resume` — PAUSED WHILE YOU WERE AWAY · BACK IN · 3 2 1 GO). A room of 2+ is untouched (the AWAY rule stands). **The server agrees**
  (`match-report.js#survivalCap`): a solo SURVIVAL's time past the row after the next its engine took (results `sd`, + 5 s) = EMPTY (no XP,
  streak or lane count) — and nothing was ever paid by time. **YOUR LAST BOARD** always draws its well now (an empty board's string is `''` —
  it used to draw no frame at all). Tests: `tests/prism-solo-pause.test.mjs`, `e2e-playnow --only pause`.
- **Tests**: `tests/drop-share.test.mjs` (the solid junk, the inputs, the line, the ink table) · `prism-drop-judge` (+ `aw`) · `daily-drop.test`
  (+ the hides, the share inputs) · `prism-layout` (+ the strip, both viewports) · `e2e-drop.mjs` (+ the songs, the console silent, the hint, a 10 s
  hide, 3 hides then a 30 s hide → ended late at checkpoint + 15 s).

## THE RULES FROM CLAUDE.md (moved Nov 13)

THE CLAUDE.md DIET (FR7 FIXES C, Nov 13): CLAUDE.md keeps ONE line per rule with a pointer here; the full text it held for this area
is below, VERBATIM (as of `48e3e157`). New detail goes in the sections above, not back into CLAUDE.md.

### PRISM DROP (PD-1 … PFIX-B)

- **PRISM DROP:** never use the words "Tetris", "tetromino" or "T-spin" anywhere (pieces/prisms, twists). PD-1 (Nov 9 — docs/prism.md "THE LAYOUT"; the
  rework plan: docs/games/plan.md): THE MAX BOARD's sizes are ONE pure module (`prism/layout.js` — the real safe areas, the cell snapped to device
  pixels, the board at the FULL 3×), HOLD + NEXT inside the board's corners, the other players on THE SLIM RAIL (`rail.js`), SLAM = the red push
  button at the rail's foot (LEFT mirrors it); the podium = the console's frame + `victory.js#finalScene` (PRISM draws no frame, no report table);
  `prism-preview.html` mounts the REAL view (`prism-shots.mjs`). PD-2 (Nov 9 — docs/prism.md): AUTO-TARGET is ONE pure rule (`logic.js#autoTarget` —
  the most recent attacker still alive, else a random opponent kept while valid; no button, no setting); incoming junk = THE RISING GHOST ROWS
  (`incoming.js` PURE + the look's hook `board.js#LOOKS` — the engine's attack math + delays untouched; an occupied cell only tinted, never
  covered; no red bar); callouts on the kit's announcer (`fit`); KO card → Call the Winner (the kit's `ring`) → SPECTATE (names → THE PLAYER PAGE
  only there); SURVIVAL (the seeded 10 s → 4 s rows, `survivalRows`) + SOLO (`SOLO: true` — SCORE RUSH + SURVIVAL; BATTLE needs 2: a CHOICE's
  `when(players)` in the options sheet + `cleanSettings(s, players)`); the results carry `ko` / `pc` / `dz` / `t` for PD-5's cards. PD-3 (Nov 9 — docs/prism.md "THE NIGHT
  LOOK"): THE GAME LOOK picks the board's look LIVE (`view.js#watchLook` — day = the glass placeholder until PD-4, night = THE NEON TUBES,
  `board.js#neonSprite`); each piece keeps its COLOUR FAMILY in every world (`neon.js` PURE — `tests/prism-neon.test.mjs`); every MOVING light is the
  LIGHT LAYER's (`light.js` — one low-res WebGL canvas above the board, pure added light + a GPU bloom; never a full-res 2D blur, never the board
  copied to a texture: measured); effects short, never over the stack or the incoming rows; FOUR TIERS (`tiers.js`) — the light steps down FIRST,
  the board's 3× LAST. PD-4 (Nov 9 — docs/prism.md "THE CRAYON LOOK"): DAY = THE CRAYON LOOK (the glass look retired as the day look); the crayons keep
  the night's COLOUR FAMILIES + read on every paper (`crayon.js` PURE — `tests/prism-crayon.test.mjs`); every crayon drawing PRE-DRAWN once (`crayon-art.js`
  — never a stroke per frame; warmed in slices); THE PAPER = the HOST's deal per match (`game.pp` — `crayon.js#pickPaper`, the night's memory: a rotation,
  never twice in a row — the same page on every phone); the page + the world doodle = ONE canvas redrawn only on a change (`page.js`), the WebGL world
  skipped by day; the papers (CC0) + Permanent Marker (Apache 2.0) load ONLY when the day look shows (`page.js#warmDay`). PD-5A (Nov 9 — docs/prism.md "THE TWO SETS" + "THE BEAT FIX"): EVERY beat-timed
  thing (visuals, the countdown, the musical SFX, the finale) reads `view.js#songClock` = THE HEARD BEAT (`sync.js` PURE — the sounding voice's clock − SPEAKER
  DELAY − an unreported iPhone speaker − the measured lead; the SFX on the song's own clock), never `serverNow()` beside it; the lead = the city's
  listener + estimator, bounded ±60 ms (kicks off the beats → the grid alone); QUICK START = `synced-songs.js` `quick` (slices from the stream's start, the
  swap on one sample; a cue-in streams from ~0.5 s before its cue — ONE Range request placed by `game.ff`, `bufferT0` = a buffer's file time); TWO SETS — NIGHT `prism1-5` (unchanged) + DAY `prismd1-5` (`look: 'day'`, hand-set worlds, cue-ins), the HOST's look at
  `start` = `game.set` (every phone plays it), DAY's playlist in the night's memory (`meta/used/prism/dn<N>`); a day song = `build-prism.py --day`
  (it STOPS a song off its measured BPM by > 0.1, drifting or on the half-beats — never a guess). PD-5B (Nov 9 — docs/harbor/passes/pd-5b.md): THE THREE CARDS'
  flags from the room's own record (`match-report.js#prismExtra` — `firstko` · `pc` · `comeback`; PRISM's `comeback` never raises COMEBACK KID), the art
  DRAWN IN CODE (`fx/pd-cards.js` + PURE `pd-specs.js`; the material = its baked still frame — `scripts/build-pd-cards.mjs` after an art edit); FIRST KO is
  the ONE moving common (`vault.test.mjs#COMMON_MOVES`); THE BURST BEFORE THE COLLAPSE (the neon board holds the pre-clear stack until the burst —
  `neonfx.js#preClear`; the game never waits); THE HOLIDAY HOOK = `holiday.js` (one row a holiday — empty now). PFIX-A (Nov 10 — docs/prism.md
  "PFIX-A", the review's `PFIX-A:` lines): THE LOCK = every move / turn after the first touch-down spends a reset, spent → the next touch-down
  locks AT ONCE (`engine.js` — the lowest CELL counts); AWAY = a board silent ≥ 30 s in play is out, credited to nobody (`director.js`; the
  view's save = the heartbeat + a save on hidden / pagehide); a DOUBLE KO = the one out LAST wins (`director.js#outOrder`); an attack's key =
  `{uid}-{piece}` + the board saved in the same frame (a refresh never attacks twice — the receiver orders by `at`); AUTO-TARGET forgets
  after 20 s (`TARGET_MEMORY_MS`); THE NIGHT GAIN (`build-prism.py --night-gain` → the manifest's `gain`, per voice through
  `synced-songs.js#levelOf`); THE TEARDOWN — `unmount()` destroys + zeroes everything `mount()` made, ONE reverb a page, `ui/fit.js`'s
  late-font list is WEAK (a podium no longer pins a match's screen; proof `e2e-prism-leak.mjs`). PFIX-B (Nov 10 — docs/prism.md "PFIX-B" —
  THE ANTI-CHEAT RULES A PASS MUST KEEP): the board node `prism/{m}/{uid}` is written only in PLAY (+ GO − 2 s, + SCORE RUSH's end ≤ endAt + 4 s),
  FROZEN once out (own `st` or `game/out`), `at` = the server's now, `sv` CLOSED + bounded by the play clock (a new saved field = its rule row +
  a rules test, or every save is refused); the view writes only inside that window (`logic.js#boardWritable` — keep the two in step); an attack's
  key = `{uid}-{piece}` (one a piece), `at` = now, never at / from a board that's out, the receiver's queue ≤ `QUEUE_MAX` 40; a KO counts only with
  the sender's attack in the victim's queue (`creditedBy`, 20 s); the award flags only from plausible numbers (`prismExtra` — `pn` in the
  results); SCORE RUSH's bound = the SIM's (`scripts/sim-prism-rush.mjs` — re-run it after a scoring change); by day the tiers step 3 → 0
  (`tiers.js#stepTier`); the ghost rows = the first 12 to land.
