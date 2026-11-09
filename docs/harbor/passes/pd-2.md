# PD-2 — PRISM DROP: BATTLE MADE SIMPLE + SURVIVAL + SOLO (Nov 9 2026, night)

The second of PRISM DROP's rework passes (the owner's plan: docs/games/plan.md "PRISM DROP — THE REWORK PLAN" + "PD-2"). The battle made simple
(one automatic target rule, incoming junk as RISING GHOST ROWS, short callouts, a one-time tip, KO → Call the Winner → spectating), the new
SURVIVAL mode, and SOLO (SCORE RUSH + SURVIVAL for a room of one). The look stays today's (PD-3 night / PD-4 day restyle it — the ghost rows are
drawn through the look's hook). THE CARDS (FIRST KO, PERFECT CLEAR, COMEBACK) moved to PD-5; their facts are recorded from this pass.
**No rules change** (database.rules.json untouched — nothing to re-publish: the new facts ride inside the player's save `sv`, whose extra keys the
rules already allow; SURVIVAL sends no attacks, so `prismq`'s battle-only rule is untouched). **Still 8 functions.**

## Step 0
013e6726 — docs/games/plan.md "PD-2 — BATTLE MADE SIMPLE + SURVIVAL + SOLO", appended unchanged.

## Group 1 — AUTO-TARGET (rules first)
- `logic.js#autoTarget({ candidates, attackers, current, rnd })`: the most recent attacker still alive, else a random living opponent, KEPT while it
  stays valid. `attackersOf(hits)` = the senders of every attack you received, the most recent first. The view re-picks when an attack arrives
  and every ~0.6 s. The old `chooseTarget` / `TARGET_MODES` (RANDOM · ATTACKERS · DANGER) + the saved `na:prism:target` are gone (the UI had left
  in PD-1). Unit: 2 and 8 players, the attacker dying (→ the next most recent still alive), a KO mid-attack (→ a random living one, never the dead),
  nobody left (null), a replay with the same seeded stream = the same target; the whole-battle simulations now target with it.

## Group 5 (rules) — SURVIVAL + SOLO, before any pixel
- `meta.js`: `MODES = battle · rush · survival`, `SOLO: true`, BATTLE's choice `when: n => n >= 2`, `cleanSettings(s, players)` (one player → SCORE
  RUSH), SURVIVAL ≈ 3 min. The options sheet (screens/game-options.js) learned a per-CHOICE `when(players)` + falls back to the first shown choice.
- `logic.js`: `survivalEvery(t)` (10 s → 4 s, a smoothstep over 150 s), `survivalRowAt(k)` / `survivalRows(elapsed)` (the same moments everywhere),
  `survivalGap(seed, k)` (sudden death's rule); `DANGER_ZONE_ROWS = 16`; the standings: SURVIVAL's score = the seconds survived, the lines break a tie.
- `director.js`: SURVIVAL eliminates like BATTLE with no KO credit; the end = one left (a solo match: none); the results add `pc` (perfect clears —
  the save's `st[3]`), `dz` (BATTLE: the stack's saved peak `pk` ≥ 16 — the top 5 rows) and SURVIVAL's `t` (ms survived). `engine.js`: `peak` (the
  settled stack's tallest, visible rows only) saved as `pk`; pending junk records `t0` (when it arrived — the ghost rows' rise).
- `core/match-report.js#soloEmpty`: PRISM's empty solo run is decided by points / lines alone (a phone on the table "survives" a while). A SURVIVAL
  win counts as a PRISM DROP win (wins + win rate); a solo run feeds no board (PRISM has no `-solo` board) and is never a win.
- Whole-match simulations: SURVIVAL with 8 bots (no attacks, no KO credit, the order by time survived), 2 + a refresh mid-game + a host change (the
  same patch twice), solo (no winner, the score = the seconds), THE BOARD's view of each (a SURVIVAL win, a solo SURVIVAL, a solo SCORE RUSH).
- **The schedule's calibration** (a bot alone on the real rows, 12 seeds each): skill 0.5 → 46 s median · 0.7 → 50 s · 0.85 → 76 s · 0.95 → 103 s
  (65–147). The bot is a rough stand-in (at low skill it dies in ~60 s with NO junk); a 210 s ramp changed nothing measurable, so the 150 s ramp
  stays — it reaches the owner's 4 s pace inside a typical game, so a strong player can't drag it out. Real players: the owner's 2–4 min.

## Group 2 — THE RISING GHOST ROWS (the red bar gone)
- `incoming.js` (PURE): `ghostBands(pending, clock, { sched })` — bands from the bottom up (the newest attack at the bottom, the oldest on top: the
  order they land), 30 % of a fresh attack's rows at once, rising over its delay, HOT when due; ≤ 12 rows drawn. `incomingTag` = "INCOMING 3 · EVE"
  (the biggest sender, "+1" per other). The engine's attack math, cancelling + delays are untouched — this only SHOWS the queue.
- `board.js#LOOKS.glass.incoming` (THE LOOK's drawing hook — PD-3 / PD-4 add theirs): over the bottom rows, under the falling piece; an empty cell
  gets a hatched, see-through, glowing ghost (round 2 → 3: a plain red fill read too much like a ruby block), an occupied cell only a faint tint (the
  stack stays readable), the gap open, a bright leading edge + a red light above it, a gentle shake (faster when due; still with reduced motion).
- A cancel (the engine's counter, oldest first) SHATTERS the top rows on the board itself (`board.shatterGhost` — hatched shards with gravity + a spin
  + a flash, 0.52 s; the fx layer behind the glass couldn't be seen). SURVIVAL's next row + BATTLE's sudden-death rows rise as ghosts over their last
  3 s. The tag rides just above the ghost rows or your stack, whichever is higher — never over a block (round 1: it sat on the stack).

## Group 3 — CALLOUTS + THE TIP
- One callout per moment (a batch of engine events → one card): the headline big (PERFECT CLEAR · BACK-TO-BACK · TWIST +2 · 4 LINES · COMBO ×n ·
  BLOCKED! · +4 → DANA), the rest small under it; KO → EVE for the one who scored it. On the kit's announcer (`createAnnouncer(…, { fit: true })` —
  the kit puts `--len` on each element; the css sizes the headline to the board with container units: never a wrap — round 2: BACK-TO-BACK wrapped).
  Centred over the board's upper middle (30 %); BLOCKED! = `--good` (a word, never colour alone). Badges + KO bonuses keep working, no panel.
- THE TIP: "Clear lines to attack your friends." — the first BATTLE on this device (`na:prism:tip`; the console's one-time hint is the dailies'),
  at GO + 0.8 s, gone after ~5 s or on the first move.
- Found on the way: a refresh mid-match re-announced every old knockout ("BOBBY KO'd FINN" — `seenOut` wasn't primed at mount); fixed.

## Group 4 — KO → CALL THE WINNER → SPECTATE
- THE KO CARD on your board (KO · BY DANA / TOPPED OUT / THE JUNK GOT YOU / SIGNAL LOST · 5TH PLACE; solo SURVIVAL: SURVIVED 1:42), 1.8 s.
- Then the kit's Call the Winner with its new countdown RING (`showCall({ ring: true })` — 20 ticks out one by one + the seconds; opacity only); the
  line under a name = their stack (no badges); the KO card steps back under it (round 1: it showed through).
- Then SPECTATE: the two leaders' boards BIG side by side (the two lowest stacks, then the most KOs; SCORE RUSH: the top two scores; kept in seat
  order), the higher one outlined red from 12 rows, `DUEL SOON` in the header when two remain, the rest of the field as ONE line (initial · stack ·
  KO). A name opens THE PLAYER PAGE — only from this view. Chat opens once you're out (the lock, unchanged).

## Group 5 (UI) — SURVIVAL + SOLO on screen
- The top line: `SURVIVAL · 6 LEFT` + the time played; solo `SURVIVAL · 1:23`. The count card: SURVIVAL · LAST ONE STANDING / AS LONG AS YOU CAN. The
  end: VICTORY / X WINS · SURVIVAL OVER / SURVIVED 2:31 (solo). The podium (victory.js): SURVIVAL · FINAL, "AVA OUTLASTED EVERYONE", the winning
  board + SURVIVED 2:31 · 40 LINES, the rows' note the same; a solo run's frame line = SOLO RUN + "AVA · 2:31" (the console's `scoreText` — ui/final.js).
- HOW TO PLAY: THE MODES in three lines (BATTLE · SCORE RUSH · SURVIVAL) + CONTROLS in two.

## Group 6 — THE LOOK REVIEW
`prism-preview.html` gained the PD-2 states (`&mode=survival &solo=1 &state=kocard|ko|spec &inc=1|3|6 &rise= &shatter= &callout= &fresh=1&tip=1`);
`prism-shots.mjs` the `pd2` set (21 states; an entry may fire a line of JS just before its shot). Three rounds, looked at, at 390 / 402 / 430 + 1440:
1. The callouts missed their shots (a hold for the preview), the shatter drew behind the glass, the tag covered blocks, the ghosts too dim, the call
   let the KO card through, the podium shots caught the frame mid-entrance, the knockout re-announce.
2. The board-canvas shatter, the tag above the stack, a lit ghost (added light + a halo), the KO card hidden under the call, the headline fit
   (BACK-TO-BACK wrapped at 34 pt).
3. The hatched ghost (never a block look-alike); every state clean at the three widths (`pd-2/sheet-402-*.jpg`, `sheet-430-*.jpg`,
   `shatter-kocard-3sizes.jpg`) + 1440 × 900 (the phone column: `desk-1440.jpg`); PD-1's states unchanged (`pd1-states-390.jpg`).
Shots: `pd-2/ghost-rows-390.jpg` · `ghost-rows-crop-390.jpg` · `shatter-callouts-390.jpg` · `ko-call-spec-390.jpg` · `survival-390.jpg`.

**The frame rate** (prism-shots.mjs as PD-1: 390 × 844 @3, 7 opponents, a bot playing, 4× CPU, GPU): **60 fps at every tier (p50 16.7 / p95
16.8 ms)**; **2.1 ms CPU a frame** (PD-1: 1.7) and **2.3–2.5 ms with six ghost rows on screen**. No slower.

## Tests
All on the mini PC, on fresh emulators:
- unit `node --test tests/*.test.mjs` **1453 / 1453** (+ AUTO-TARGET, the SURVIVAL schedule, SOLO, the facts, the engine's `pk`, the ghost bands,
  SURVIVAL's 1 / 2 / 8-player simulations + a refresh + a host change, THE BOARD's view; shell-b1's solo test now expects PRISM's solo lane).
- `e2e-prism` FAST **39 / 39** (+ no target button / word / red bar, the ghost rows + their tag, BLOCKED!, ALICE → BOB with no button, the KO card,
  the results' facts, SURVIVAL — the same rows on both phones, no attacks, the next row's ghost, the last one standing — a room of one (the options =
  SCORE RUSH + SURVIVAL), a solo SURVIVAL (the time on the KO card + SOLO RUN), a solo BATTLE start → SCORE RUSH to the song's end).
- `e2e-prism` FULL (8 phones) **63 / 63** (AUTO-TARGET: a target with no button + a phone that was hit targets its most recent attacker still
  alive; the refresh, the host killed, the 30 s disconnect, Call the Winner with the RING + a refresh keeping the call, SPECTATE with DUEL SOON
  ("DUEL SOON · YOU'RE OUT · 6TH · YOUR CALL · CHARLIE", 6 more on the line), the FINAL DUEL, SCORE RUSH; then SURVIVAL on 7 phones — 5 rows on
  every one, no attacks — the room of one, the solo SURVIVAL + the solo SCORE RUSH).
- smoke **6 / 6** (both playable games; none of the ten hidden ones starts).
- `/api` server.test **44 / 44** (`match-report.js#soloEmpty` changed: the solo-lane test now expects a solo PRISM DROP to count — small XP, never a
  win, no board). Rules: unchanged — not run. The full harbor suite: not run (no city change — a game pass, the ci tag).
- The preload graph regenerated (`incoming.js`): prism 30 modules, 244 KB.

## Servers
Started fresh: the emulators (database + auth) + `scripts/serve.mjs --emu` on :5173. The owner's preview server on :5190 was left running. All
stopped at the end (the emulators' Java + node, serve.mjs).
