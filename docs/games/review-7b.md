# REVIEW #7, PART B (FR7-B, read-only, Nov 12 2026: THE THREE GAMES + THE TWO DAILIES — "ready for strangers?")

**FR7 FIXES A (Nov 12 — docs/harbor/passes/fr7-fixes-a.md): FIXED — PD1, OC1, DY1, DY2 in `12916c2e` (deployed early); PD3 (the rules) + PD4–PD7, OC3, HE1, HE2, DY5–DY7, the decisions (OC2 → HOST-GRADED, HE3 → THE DAILY CEILING, DY3, DY4 accepted, B1 → END GAME through the dealer) in this pass's later commits. NOT DONE: PD2's tighter `RUSH_PACE.margin` (FR7 FIXES B).**

Fresh eyes on PRISM DROP, OVERCLOCK, HOLD'EM, THE PASSWORD and COAST CLEAR (+ THE DAILY MODULE's shared kit) at commit `43903efc` (Step 0's
plan line, committed on its own). Nothing but this file and Step 0 was written — no code, no tests, no config, no data, no rules. **THE LIVE
SITE was not opened at all** (not even read): everything ran on the mini PC — my own emulators + `DAILY_TEST=1 serve.mjs --emu`, Chromium 1248.
Method: four read-only investigations in parallel (one per game; the two dailies + the kit as one) while the writer ran every game's real
browser suite one at a time — then **every MUST-FIX and SHOULD-FIX below was re-read in the code by the writer**, and every "it breaks" is
marked **REPRODUCED** (how — by the investigation's own run unless it says "the writer") or **READ** (not reproduced). FR7-A
(`docs/harbor/review-7a.md`) covered the city + the console; where one of its findings has a game as its cause, it says so here and is not
repeated. Sizes: **S** < 30 min · **M** 1–2 h · **L** half a day or more. The owner's rule applied throughout: NO TRAFFIC YET — real defects only.

One correction to the brief: OVERCLOCK HAS had a Fable review (Nov 7, `Downloads\neon\overclock\FABLE-REVIEW.md` — its play, look and content;
OC8 fixed it). It never looked at the rules, the cheats, the seal, a host change or the teardown — this is its first review of those, and it
got the most time. OC8's sixteen fixes were re-checked: all still fixed.

## In plain words (for the phone)

**PRISM DROP — nearly.** Solid: a whole 8-phone night passed 88 of 88 (battle, score rush, survival, solo, the host's phone dying, a
refresh mid-battle, a phone hidden 36 s, a day host with a night phone on slow 3G); every PFIX-A / PFIX-B fix is still there; the right
player wins; both looks read on the phone. Not ready: **a test tool ships to everyone** — one line typed in the browser's console turns on
a perfect robot player that wins every battle and tops the SCORE RUSH board, and nothing can tell it from a real player (a small fix). And
the bigger question you parked in the first PRISM review ("until the score board matters to strangers") is due now: **each phone reports
its own score**, so a modified phone can post up to 3–4× the best score a machine could really play. Could break for a real player: a
player who was counted out while their phone was asleep comes back to a dead board with no KO card (small fix); an iPhone in Low Power
Mode is read as a slow phone and drops to the plainest look for the whole match.

**OVERCLOCK — nearly.** Solid: the three 8-phone suites passed 27 / 27, 75 / 75 and 22 / 22 (host dying mid-challenge, refreshes landing
on the right beat, DUMB LUCK's lock and race); the director never double-scores; the seal hides other players' answers; 0 broken items in
a fuzz of every pool (no tie where an order is judged, no US-unit text that contradicts the judged answer); nothing regressed from OC8.
Not ready: **the STANDARD score boards accept 6,720 points where a perfect match is 2,080** (a small fix — the QUICK board already has the
right check). And the same trust question as PRISM: **every phone grades its own answers** — a guest with the console open scores a
perfect 160 on every challenge, wins the room and earns REDLINE (the legendary card) in one QUICK match. Friends won't; a stranger can.
Could break for a real player: rarely, SORT IT's finished screen keeps dealing cards in the background and can lock the NEXT challenge
with a zero (a small fix).

**HOLD'EM — ready.** The strongest of the five: no card leak, no wrong pot, no chips made or lost, no hand that stalls for good — by 300
fuzzed matches (210,699 dealer calls), the live rules, and the full 8-phone suite. Every HE9 / HE10 fix is still there. Small things: a tap
that arrives a moment after your clock ran out can land on the NEXT street (a bet you never meant); when the host leaves the table for the
room, every timed step runs 2–3 s late for everyone else (FR7-A found it; confirmed with numbers); END GAME still drops a match with no
result (FR7-A's B1, your decision). The win farm FR7-A named is ~80 tournament wins an hour for a script with two seats — your call.

**THE PASSWORD — nearly.** Solid: the server judges every guess, nothing about today's or tomorrow's word is computable from the repo, no
answer in any reply. Not ready: **on a weak line a guess can be counted twice** — the answer is lost, the phone says NO SIGNAL · TRY AGAIN,
and the retry is taken as your NEXT guess (a small fix). A resume in a dead spot shows an empty board that takes guesses.

**COAST CLEAR — nearly.** Solid: the board never leaves the server, a repeat tap is free, the clock is the server's. Not ready (shared with
THE PASSWORD): **RESUME YOUR DAILY on a freshly loaded page opens the run with no styling** — the title shows through, no back arrow, the
clock running (a one-line fix). Your decisions: "YOUR DAILY IS SAVED" is only true for 20 minutes and a HOLD'EM match runs 20–100; and
your own BEFORE PUBLIC item — a throwaway profile is still shown the whole harbor when it finishes, so a second profile clears it in 0:00.

**The verdict.** Nothing here needs a redesign and no game names the wrong winner in honest play. **4 MUST-FIX, all S.** About 17
SHOULD-FIX (most S; five are your decisions — they all come down to one question: how much do the public boards have to be worth?).

## THE MUST-FIXES

| # | game | finding | what happens | proof | size |
| --- | --- | --- | --- | --- | --- |
| **PD1** | PRISM DROP | **THE TEST HOOK SHIPS TO EVERYONE** — `js/games/prism/view.js:243` calls `setupTestHook()` unconditionally; `:1459–1464` `window.__prism = { …, bot: (opts = {}) => { bot = { skill: opts.skill ?? 0.9, every: opts.every ?? 60, … } } … topOut, junk, setTier }`. OVERCLOCK gates its hook on `?emu` (`overclock/view.js:119`), HOLD'EM on the kit's `installTestHook` (emu / localhost only); `prism/bot.js:3` itself says "never by real players" | On the live site anyone types `__prism.bot({ skill: 1, every: 40 })` (a desktop console, a bookmarklet on a phone). The robot plays through the REAL engine, so every write is honest-looking and inside every rule and bound — no replay could ever catch it. It wins BATTLE / SURVIVAL (XP, `prism-ko`, FIRST KO, the four-line flag) and sets the public SCORE RUSH record | **REPRODUCED** — the real view on `127.0.0.1` with no `?emu` (the kit's `testMode()` false, as on the live site): the hook is there, `bot()` placed 28 pieces in 6 s; the robot's loop on the real engine against `match-report.js`: 350,908 points (default) and 1,007,556 (`skill 1, every 40`) on a 230.8 s song, both ACCEPTED. The lines re-read by the writer | **S** — install through `installTestHook('__prism', api)` with an opt-in for `prism-preview.html` (the owner's phone previews on 192.168.x need it). Honest limit: it raises the bar from "one line" to "write a robot", not to "impossible" |
| **OC1** | OVERCLOCK | **THE STANDARD BOARDS ACCEPT 3× THE HIGHEST POSSIBLE SCORE** — `js/core/match-report.js:94` `const OC_CHALLENGE_MAX = 2 * (160 + 60 + 60);` and `:173–181`: the only check is `p < 0 \|\| p > OC_CHALLENGE_MAX` per challenge — no `ok` / `parts`, no order, no `matchMax`. The QUICK solo block right above it (`:157–171`) does all three | 560 a challenge × 12 = 6,720; a real STANDARD match tops out at 2,080 (2,180 with DUMB LUCK's 12-1). A solo player is its own host: ONE anonymous user writes its own `game` + `night` and lands 6,720 on STANDARD · SOLO (with a second seat, on STANDARD MATCH) — an impossible number at the top of OVERCLOCK's public tab. A forged 2-player QUICK with 1 point a round also earns the REDLINE flag | **REPRODUCED** (pure `extractMatch` on a forged final: `{"rec":{"overclock-std-solo":6720}} rejected []`; 12 × 561 → rejected; the HTTP path READ, not run) | **S** — STANDARD takes the QUICK block's checks: each result an integer ≤ `ptsCeiling(type, ok, parts, last)`, twelve real types, the total ≤ `matchMax(order)`; + the profiles test |
| **DY1** | THE DAILY MODULE (both dailies) | **RESUME YOUR DAILY ON A FRESH PAGE OPENS THE RUN WITH NO STYLESHEET** — `css/daily.css` is linked only by `dailySheet()`, called only from `openScreen` (`js/screens/daily.js:123–124`); `openRun` (`:373–374`) calls `overlay()` without it; the chip (`title-dock.js:210`) goes straight to `setState({ daily: { v: 'run', id } })` | The hold lives in localStorage, so the chip survives a reload. A player whose run was held by a room game and who comes back on a fresh page (iOS dropped the tab, a refresh, the site reopened later that day) taps the chip: the run mounts transparent over the title — the sign, the dock and BRING YOUR CARD show through the board / keyboard, no back arrow — with COAST CLEAR's clock running | **REPRODUCED** (a fresh profile, `start coastclear`, the hold set, reload, the chip, click: `.dy-overlay` computed `position: absolute; z-index: auto; background: none`; the same on THE PASSWORD). `e2e-daily` misses it — it opens THE DAILY SCREEN first on the same page | **S** — `dailySheet()` inside `overlay()` + `banner()`; one E2E line: reload, then the chip |
| **DY2** | THE PASSWORD | **A GUESS WHOSE ANSWER IS LOST IS COUNTED TWICE** — `js/games/password/view.js:142–147`: any error that isn't `not_a_word` / `out_of_step` / `finished` / `closed` / `not_started` shows `NO SIGNAL · TRY AGAIN` and keeps the typed word; `judge.js:22` sends `{ word }` with no row number; `api/_lib/pw.js:118–126` always appends (`serverGuess(run, g, …)`); the client's timeout is 9 s (`profile/api.js:15`) | The guess reaches the server, the answer doesn't come back (a weak line, the 9 s abort). ENTER again → the server takes the same word as the NEXT guess. If the lost answer was the one that opened THE FRONT DOOR, the retry lands as guess 1 in THE BACK ROOM. One guess burned in a once-a-day game with a public score; SAFECRACKER and the points are off | **REPRODUCED** twice — HTTP: `guess CRANE` twice → `n:1` then `n:2`; browser: the first answer dropped, ENTER again → rows `["SLATE","SLATE"]`. How often a real phone loses an answer after the commit is a judgement; COAST CLEAR was built for exactly this case, THE PASSWORD was not | **S** — client only: on a network error / 5xx run `resync()` (the server's record is the truth) instead of the note. Better: the guess carries `{ door, n }` and a repeat of the same word on a filled row is answered from the record, writing nothing |

## PRISM DROP

**What ran.** `e2e-prism.mjs` full, N = 8, on the emulators: **88 / 88** (359 s) — BATTLE with real touch gestures, junk attacks landing,
AUTO-TARGET, a refresh mid-battle (the board back, ONE attack a clear), the host killed (a new host in ~9 s), a phone gone > 30 s out
with no KO credit, a hidden tab AWAY after 30 s, Call the Winner, FINAL DUEL, SCORE RUSH to its final beat, SURVIVAL (the same rows on
every phone), a room of one (SOLO RUN, never a win), a day host + a night phone on slow 3G (audible 368 ms after GO), the look switch
(longest frame 17 ms), no board write refused. The podium's XP matches the server's table (an 8-player win: 30 + 76 + 25 = 131).
`e2e-prism-leak.mjs`: **6 / 6** (six matches: canvas memory 34.9 → 35 MB, DOM nodes + 4 a match, listeners + 0.5, one reverb a page).
Frame pacing at 4× CPU (`PERF_ONLY=1 N=2`): p50 16.7 ms, p95 16.7–16.8 ms at every tier — 60 frames a second; **the check itself went
red** on its second half ("no step-down": tier 0 read back as tier 3) — a test artefact, not the game: the run happened in the morning,
AUTO chose the DAY look, and by day a calm phone climbs 0 → 3 by design (`tiers.js#stepTier`) while the hook's `setTier` doesn't lock the
tier. SHOULD-FIX · S (tests): pin the look, or lock the tier, in `perfRun`. The unit suite: 98 / 98 (PRISM's files).

- **PD1 — MUST-FIX** (above).
- **PD2 · SHOULD-FIX (the owner's decision — review #1's question C, due now) · S stopgap / L real fix · REPRODUCED — any player, not
  only the host, forges the public SCORE RUSH record and three award flags with one write.** The results are each phone's own node
  copied by the director (`director.js:122–135`: `sc: b.sc || 0, ln: b.ln || 0, best: b.best …`); the bounds are loose: the rule
  `database.rules.json:687` `sc <= (now - playStartAt) / 1000 * 20000 + 50000`; the server `match-report.js:266` `ln > maxRushLines(sec)
  || sc > maxRushScore(ln, sec)`; the flags `:244` (`best === 'quad' && ln >= 4`), `:257` (perfect clear from `pc` / `ln` / `pn`),
  `:259` (comeback from `dz === 1`). Run (the real rules → the real `nextStep` → `extractMatch`): a non-host's `{ sc: 1,658,000, ln:
  520, best: 'quad', sv: { st: [600, 100, 0, 3] } }` in a 200 s SCORE RUSH → ACCEPTED → `{"rank":1,"win":true,"rec":{"prism-rush":
  1658000},"f":{"quad":1,"pc":1}}`; in BATTLE a forged save + a win → all three cards' flags but FIRST KO. The bound is 3.2–4.6× the
  best 4-pieces-a-second robot, so a forged row sits on top for good. Still refused: `sc` 999,999,999, extra fields, a write after out /
  outside play, a four-line flag with < 4 lines. This adds to FR7-A's C2: a RECORD board needs ONE match, not one every 45 s, and no
  host. The real fix is the replay pass (the inputs logged, the server re-runs the board — L). Stopgaps: tighten `RUSH_PACE.margin` to
  ~1.3× the sim's best (it only lowers the forged ceiling), keep `prism-rush` off THE BOARD's PRISM tab at launch, or accept it and rely
  on /admin's hide.
- **PD3 · SHOULD-FIX · S–M (A RULES CHANGE → a re-publish) · REPRODUCED — "one attack a piece" is one per KEY, and the key's number is
  free; a board never has to die.** `database.rules.json:841`: `$key.beginsWith(auth.uid + '-') && $key.replace(auth.uid + '-',
  '').matches(/^[0-9]{1,6}$/)` — nothing ties the number to the sender's piece count or the play clock. Run: a participant with NO
  board (0 pieces placed) wrote 201 attacks × 30 rows in ~350 ms, all ACCEPTED; the victim's honest phone was out after 5 pieces and the
  director credited the KO (`prism-ko`, FIRST KO). And a bare `{ st: 'play', at }` heartbeat with no board is accepted and never counted
  out (`director.js:86` reads only `b.at`) — a modified phone cannot lose a BATTLE or a SURVIVAL (the top-out is self-reported). Gain: a
  certain win + KOs against real players in any room it is dealt into (FR7-A's C4 lists the rooms). Fix (narrows it; closing it is PD2's
  replay): the receiver drops a sender whose rows pass a sane rate (`watchAttacks`); the rules take a numeric `i` in the attack, `$key
  === auth.uid + '-' + i`, `i <= prism/{m}/{uid}/sv/n` + a small margin — with the old key still accepted until the re-publish.
- **PD4 · SHOULD-FIX · S · REPRODUCED — a player the DIRECTOR put out (AWAY / SIGNAL LOST) whose screen mounts afterwards gets a dead
  board.** `view.js:168` `seenOut = { ...(game.out || {}) }` (their own out is "already seen", `showKO` never runs); `:354` handles only
  a SELF-reported out (`node.st === 'out'`); `koShownAt` stays 0, so spectating never starts. Who meets it: a rematch that dealt in a
  player whose phone was locked (back > 30 s after GO), a lost signal > 30 s then a reload, iOS discarding the tab. Run on the real
  view (re-mounted with `game.out[me] = { away: true }`): no KO card, no reason, no Call the Winner, the stack frozen, the header still
  "BATTLE · 4 LEFT" until the match ends; with no node at all an EMPTY board where SLAM does nothing. The match and its winner are
  right. Fix: `ensureEngine()` treats `game.out[me()]` like `node.st === 'out'`, with or without a node.
- **PD5 · SHOULD-FIX · S · REPRODUCED — no WebGL (an iPhone in Lockdown Mode, a blocklisted GPU): the night look throws every frame and
  HOLD + NEXT are never drawn.** `view.js:849–850` `if (nfx && look === 'neon') { light.setReduced(reduced());` — `createLight()` returns
  `null` without WebGL (`light.js:55`), and this line sits before `drawHud()`. Run (Chromium `--disable-3d-apis`): 243 × "Cannot read
  properties of null (reading 'setReduced')" in 4 s, the HOLD + NEXT boxes empty (the player can't see the next piece), the board itself
  plays; the day look is clean. Fix: `if (light) light.setReduced(…)`.
- **PD6 · SHOULD-FIX · S · REPRODUCED (the logic, under a simulated cap — not on an iPhone) — a 30 Hz frame cap (iOS Low Power Mode) is
  read as a slow phone.** `view.js:707` `if (p75 > 19.5 && down !== tier) { tierUpBlocked = tier; setTier(down); …` and `:711` needs
  `p75 < 17.5` to climb back — never true at 33 ms. With rAF held to every other vsync: night 3 → 0 in 5 s, day 3 → 0 in 1 s, never
  back, while the frame's own work was under 1 ms: the board at 2× on a 3× phone, no glow, no bloom. The city already has the fix
  ("tiering never treats a capped frame rate as a slow city" — docs/harbor.md); PRISM and `kit/tiers.js` don't. Fix: a steady ~33 ms
  cadence with little work is a cap, not a struggle — don't step down.
- **PD7 · SHOULD-FIX · S · MEASURED — FR7-A's A3, weighed: the sprite caches kept for the page's life are 19–26 MB on a 3× phone.**
  `board.js:271` (`neonSprites`; `:296 clearSprites` has no caller), `crayon-art.js:15` (`:490 clearCrayon`, no caller), `fx.js:5`
  (`shardCache`). The real view at 430 × 932 @3: after one night + one day match and `unmount()`, 437 canvases / **19.2 MB** stay; a
  second cell size adds a whole further set (the lowest tier's 2× board → **26.4 MB**) — and PD6 sends every Low Power Mode phone there.
  Not a crash by itself; it is memory the city never gets back. Fix: clear the four caches in `unmount()` (or a minute after, cancelled
  by the next mount, so a rematch doesn't redraw them).
- NICE · S each — an AWAY out is stamped `at: now`, not when the board fell silent (`director.js:89`): a SOLO SURVIVAL run of 20 s + a
  phone locked 10 minutes reads SURVIVED 10:20 on the podium (REPRODUCED, pure; cosmetic — no board); `match-report.js:245` caps `ko` at
  7, not `n − 1` (READ); the attack key is create-only per TARGET — a replayed piece that auto-targets someone else is accepted (READ, low
  confidence it is reachable); `logic.js:212` reads `r.sent` where the results carry `se` (a dead tie-break); a KO is credited by the
  attack's SEND stamp, so rows that waited long in the queue lose the credit; a host that dies inside the countdown leaves `count` for
  10–14 s while everyone plays (attacks made then are dropped — READ).

**Review #1 + PFIX-A / PFIX-B, checked one by one — nothing regressed.** THE LOCK (`engine.js:175–189`, its two tests) · AWAY at 30 s,
credited to nobody (`director.js:81–89`; the E2E's AWAY step, run) · a DOUBLE KO = the one out last (`director.js:48–52`) · the attack
key + the same-frame save (the E2E's REFRESH step, run: one refused replay, by design) · AUTO-TARGET's 20 s memory · THE TEARDOWN, one
reverb, `fit.js`'s weak list, the WebGL contexts lost at `unmount` (`light.js:362`, `worlds.js:415–419`) · the board node only in play
windows, frozen once out, `at` = now, `sv` closed (rules `:667–825` + the three PFIX-B rules tests) · KO credit only with the sender's
attack in the queue · the award flags from plausible numbers (as written — PD2 is what fits under them) · SCORE RUSH's bound = the sim's ·
the day tiers 3 → 0. The banned words: none in PRISM or on any PRISM screen (the one hit in shipped data is a frozen game's trivia row).

## OVERCLOCK (its first rules + cheats + toughness review)

**What ran.** `e2e-oc-2.mjs` N = 8: **27 / 27** (the host's phone dying mid-SORT IT, identical puzzles on every phone, the scores checked
against what the host wrote); `e2e-oc-new.mjs` N = 8: **75 / 75** (a refresh mid-REWIRE, a refresh mid-results landing on the same beat,
the host dying in the final standings, THE VICTORY); `e2e-oc-luck.mjs` N = 8: **22 / 22**; NO SIDEWAYS SCROLL at 390 / 402 / 430:
**312 / 312** screens. The podium's XP matches the server's table (2nd of 8: 30 + 35 + 25 = 90). Frame pacing at 4× CPU (the writer's scratch driver on the real view, 390 × 844 @2, 5 s each —
no suite measures OVERCLOCK's pacing): twelve moments (six challenges in play, the rules-card slam, the OVERDRIVE banner, DUMB LUCK's race
+ finish, the 8-row standings, the victory's power-up) — **p50 16.7 ms, p95 16.7–16.8 ms in all twelve**, 0.3–3.7 % of frames over 20 ms
(the mount's own). The unit suite: 146 / 146 (OVERCLOCK's files). A fuzz of the real pools (40,000 HIGHER OR LOWER pairs, 4,000 TIMELINE deals, 20,000 REWIRE puzzles, 6,000
seeds of the generated types, every row of the eight built pools): **0 broken items**.

- **OC1 — MUST-FIX** (above).
- **OC2 · SHOULD-FIX (the owner's decision) · the real fix L, a cheap bound S–M · REPRODUCED — every phone can compute every answer and
  grades itself.** By design, not a bug: every challenge is built on the phone from `rooms/{CODE}/game/{seed, order, deal}` + the public
  pools (`challenges.js:56`, `view.js:270`), and the phone writes its own count — `view.js:320` `const data = { p: chal.p, ok: chal.ok,
  n: chal.parts, done, at: serverTimestamp() }`; the host pays it — `logic.js:149` `okOf = uid => Math.min(parts, … boards[uid].ok …)`;
  the rules (`oc/$match/$c/$uid`) check only `ok <= p <= n <= 12` and `at === now`. THE SEAL protects what it was built for — other
  players' CLOSEST CALL guess, TIMELINE order, REWIRE turns — not the right answer. Run (the plain client SDK on the emulator's rules): a
  guest's `{ p: 3, ok: 3, n: 3, done: true, doneAt: now }` 0 ms after the challenge opened → ALLOWED → 160 points (an honest perfect
  8-second player: 144). And **the kept `doneAt`**: `{ p: 0, ok: 0, done: false, doneAt: now }` at the start, then the finish WITHOUT
  `doneAt` → the board keeps the start's stamp = the full +60 speed bonus however long the answers took (`doneAt` is validated only when
  it is in the write). A guest with the console open wins the room: the win's XP, DEAD ON, and **REDLINE (the legendary card) in ONE
  QUICK match as a guest**. The public gain is no bigger than FR7-A's C2; the new part is that it ruins a REAL room's result and needs no
  host. Refused, as they should be: another player's board / marks / skip, a rewrite after `done`, a spectator's board, any write in
  `standings`, the results, the combo, DUMB LUCK's picks, reading another envelope before or after the unseal. Cheap bound: a per-type
  human floor on `doneAt − playStartAt` in `computeResults` (under it no speed bonus, no REDLINE flag) + the rule "`doneAt` only together
  with `done === true`" (a rules change); the real fix: the choice challenges write the PICK into the envelope and the host grades it
  after the unseal. Or record it in writing beside C2 as accepted.
- **OC3 · SHOULD-FIX · S · REPRODUCED — SORT IT's dead screen keeps dealing; it can lock the NEXT challenge with a zero.**
  `ui/sortit.js:90` `if (i < s.cards.length) setTimeout(deal, 230);` and `:128` `setTimeout(deal, 300);` are never cleared — `:129
  destroy() { clearTimeout(timer); tach.destroy(); api.key = null; }` clears only the current card's window; and `view.js:450–451`
  `step()` guards on the view's CURRENT `chal`, not the one the screen was built for. If the play phase closes inside that gap with
  cards left, the removed screen keeps dealing: the wrong sound + the red edge + "TOO LATE — CHALLENGE CLOSED" every 1.2–2.6 s over THE
  ANSWER; if the chain outlives the after-screen it closes the next challenge. Run on the real view (one sort, then `standings` in the
  same tick, nobody touching the phone): `sortit p=2 → p=3 → p=4 → p=5`, then MEMORY opens: `p=0 … → p=6 ok=0 done=true · LOCKED IN`.
  Reach, honestly: an on-time player always finishes the deck, so it needs a deck still running at the close (a refresh, a phone locked
  a few seconds, a pool still SYNCING) AND the close landing in the gap — rare, but a silent wrong score. Fix: keep the two timer ids,
  clear them in `destroy()` + a `dead` flag; the view's `part / step / progress / pick` become no-ops unless their own `chal` is still
  the current one.
- NICE · S each — a refresh mid-challenge turns that challenge's right answers into misses for THE COMBO (`view.js:245` `marks: []` →
  `marksString()` writes `'0'`; the score is untouched — READ); the combo meter goes dark in the middle of REWIRE and for a CLOSEST CALL
  short of DEAD ON (`progress()` with a fractional `p` — REPRODUCED on the preview: ×5 coming in → ×0); `unmount()` never clears `st`,
  and three late promises call `update(st)` — a pool arriving after QUIT TO THE ROOM restarts the destroyed tach's ticks (READ); a
  12-letter name is cut to "MAXIMILI…" in the mid-game standings at 390 while ~60 px stay empty (measured); THE ANSWER's "CLOSEST IN THE
  ROOM" (the smallest absolute error) and the +60 (the highest credit) use different rules; `loadLengths(…).catch(() => {})` is never
  retried — one failed word-list fetch leaves UNSCRAMBLE on SYNCING for the match on that phone; every late answer is two refused writes
  → two "RULES REFUSED" reports to /admin, using up the page's six (the OVERCLOCK cause of FR7-A's C NICE line); TRIVIA has nine
  question texts shared by 9–33 rows each ("Which of these countries is the largest by area?" × 33).

**OC8's sixteen fixes (the Nov 7 review): all STILL FIXED** — A1–A10, A12, A13, A15, A16, A18, B1 (file + line for each in the
investigation's table; nine are look fixes with no automated test, so a later CSS pass could undo them unseen). A11 (DUMB LUCK's winner
readable at the lock) holds, with one correction to OC8's wording: a pick CAN still be written after the lock — it is simply never
honoured (the results come from `game/dl/{ci}.pk`, which no guest can write: REPRODUCED).

## HOLD'EM

**What ran.** `e2e-holdem.mjs` full, 8 phones: **52 / 52** (372 s) — every phone its own two cards, the LEAK CHECK at four moments
(each phone draws only its own cards + the board + the shown hands), a refresh mid-hand and mid-award (the state, no replay, no sound
replayed), a live skin switch, a rotation mid-hand, a whole hand sideways on 32 real taps, the host killed mid-hand 4 (the table moved
on by the guests' pokes + a new host), then CASH: a rebuy, LEAVE AFTER THIS HAND, the ledger (Σ net = 0; 3 hands → `short`). The busiest
moment (an 8-seat side-pot run-out + three awards) at 4× CPU in each skin, upright and sideways: p50 16.7 ms, p95 16.7–16.8 ms — 60
frames a second, six of six; 8 players on the rail at 4× CPU: p50 16.7 / p95 16.8 ms. The unit suite: 122 / 122 (HOLD'EM's
files). The investigation's own dealer fuzz with HE10's features (pre-actions, gone / kicked seats, leave / sit / rebuy, stale numbers,
bad amounts, time jumps to 80 s): 300 matches, 210,699 calls — 0 crashes, 0 chip errors, 0 unshown cards in a public view or another
seat's cards, every tournament ended on pokes alone. Not run: `holdem-server.test.mjs` (its setup wipes the shared emulator; FR7-A ran
it: 18 / 18) and the 400-hand endurance run.

- **No MUST-FIX.**
- **HE1 · SHOULD-FIX · S · REPRODUCED — a late tap is applied on the NEXT street.** `api/_lib/holdem-dealer.js:224–231`: `applyOp` runs
  `advance(rec, now, …)` FIRST (HE10's A14 — what's due runs first), THEN `opOn(…)`, whose stale guard (`:236–239` `if (body.hand !==
  t.hand || body.seq !== rec.seq) stale()`) compares against a `seq` that only moves after the op (`holdem-store.js:192`). Your clock
  runs out with your time bank at 0 and you tap a moment later, before any poke: the dealer auto-checks you; if every other seat then
  acts by itself (a queued CHECK, an AWAY opponent — heads-up against a player who left is the common case) the street closes, the next
  card is dealt, the turn is yours again — all in the same call — and then your tap lands on a street you never saw. Run live (HTTP + the
  emulators, heads-up): `act bet 100` 60 ms after the deadline on the TURN → `200 ok`; the table: `street river … P.bet 100`. A narrow
  window (the tap must beat the first poke), small stakes — but it is exactly a stale tap accepted. Fix: `applyOp` remembers hand |
  street | seat-to-act before the first `advance`; an `act` after any of them changed → 409 `stale` with `advanced: true`.
- **HE2 · SHOULD-FIX · S–M · READ + timed — FR7-A's B2, confirmed exactly: a host who QUIT TO THE ROOM stops poking; never a full
  stall.** `index.js:41` `export function prepare() {}`; `logic.js:107` the host pokes 100 ms after `due`, a guest 2,000 ms + 0–1,000.
  The quit host keeps beating, so nobody takes over: the next hand after a fold-win 3 s → ~5.3 s; after a showdown 6 s → ~8.3 s; an
  all-in run-out 4.5 s → ~11.4 s; a timeout fold 20 s → ~22.3 s — for the rest of the match. Thinking time is unchanged (the deadlines
  are the server's). It cannot stall for good: any phone with the table up pokes; a locked host loses the room in 10 s; when every phone
  sleeps the hand waits and the first one back pokes at once. The likely real case: a host who busts early and goes back to the room.
  Fix (FR7-A's): poke from `prepare()` on the host's tick.
- **HE3 · the owner's decision (FR7-A C2's HOLD'EM line, the numbers) · S · READ + timed.** A scripted heads-up tournament that counts
  (3 hands) takes ~10.5 s through the dealer, so the only brake is the 45 s gap per profile (`api/_lib/stats.js:18`): **80 counted
  tournaments an hour**. A win = 70 XP (30 + 40; +25 the day's first HOLD'EM), nothing caps it per day: one profile + one throwaway seat
  ≈ 5,600 XP an hour and +80 TOURNAMENT WINS / +80 KOs an hour on the public `holdem-tw` board; with 8 scripted seats ≈ 8,480 XP an
  hour. The throwaway seats need no profile. An honest TURBO heads-up is ~11 minutes. FR7-A's fix covers it (a daily ceiling in
  `matchStep`; a win only with ≥ 2 rows that have a profile); for the board alone, a higher floor for `tw` (3+ seats, or a minimum
  length).
- **FR7-A's B1 stands** (END GAME drops a HOLD'EM match with nothing; `hrec` + `hole` left). One refinement: even a NORMALLY finished
  match leaves `hrec/{CODE}` + `hole/{CODE}` when no phone still has the table up 8 s after the end (the clean-up is a poke). Default
  deny — litter, not a leak.
- NICE · S each — **ALL FIXED in HE11 (docs/holdem.md "HE11"; the 9-player start seats the first 8; the leftover record swept by the next start)** — a big blind all in for LESS than the small blind still shows the small blind FOLD / CALL (`table.js:96` `s.bet =
  s.bb` is the nominal blind): CALL is right and refunds itself, but FOLD, the clock or an AWAY seat forfeits a pot it had already covered
  (REPRODUCED pure: blinds 100 / 200, a 40-chip big blind → `byFold bb` instead of a showdown; chips conserved); HE10's "AWAY at once"
  waits for the next FULL dealer call (`holdem-store.js:124–130`: a poke that isn't due returns before the leavers are read — a kicked
  seat's first turn still costs up to 20 s; REPRODUCED live); at a match's end every phone pokes at once (`due: 0` — up to 8 wasted
  calls; no double credit); THE HEAL rewrites the public table but not the private card nodes (`holdem-store.js:210` — a publish lost
  right after a DEAL leaves that seat with no cards for the hand; READ); "SAT OUT" + I'M BACK flash on every seat for ~0.3–0.6 s at every
  match start, and a CASH seat that sat out without being away is offered SIT BACK IN whose tap is a silent 409 (`view.js:533`, `:862` —
  READ); 9 players in the room → `start` 409 `too_many` until someone leaves (FR7-A's line, REPRODUCED live); on an iPhone SE (375 × 667)
  at an 8-player showdown a side seat's hand tag overlaps a neighbour's card by ~21 × 10 px (clean at 390 / 402 / 430 and sideways).

**HE9 → HE10, checked one by one — nothing regressed.** A1 THE TRUE CHECK (live: queued, fired as a check) · A2 / B1 results only from
the dealer (live: a forged report → `not_reportable`) · A3 the podium's wait · A4 EV_KEEP 24 · A5–A7 (a 1-hand tournament → `short`,
live) · A8–A13 · A14 (and its fix is what opens HE1) · A15 (landed; HE10's "at once" is "at the next full call" — the NICE line) · A16
(for a finished match with a phone still on the table) · A18 the re-sit · A19–A45 · B2–B4 · B6. Open by decision: B5 (→ FR7-A's B1).

## THE PASSWORD + COAST CLEAR + THE DAILY MODULE

**What ran.** `e2e-daily.mjs`: **51 / 51** (the dock's states, SCORES, the hint once, THE SWEEP + its XP, THE ROOM WINS → the run held →
RESUME YOUR DAILY in the same page, 30 opens of SCORES with no surface left); `e2e-password.mjs`: **40 / 40**;
`e2e-coastclear.mjs`: **38 / 38** (the sweep, the catch + the lighthouse: 60 fps at 1×, 56 fps at 4× CPU with p95 16.8 ms; six taps on
a 150 ms line = 2 calls). The unit suite: 76 / 76 (the dailies' files). The investigation's HTTP probes against the local `/api/daily` (a fresh anonymous user each) and a light headless browser. The
teardown, measured for the first time (DevTools protocol, forced collections): 10 open / close cycles each of THE PASSWORD, COAST CLEAR
and THE DAILY SCREEN — nodes 1,647 → 1,657, listeners 134 → 134, animations 5 → 5, no overlay left; the heap 28.7 → 31.5 MB.

- **DY1, DY2 — MUST-FIX** (above).
- **DY3 · SHOULD-FIX (the owner's decision) · S · REPRODUCED (pure `serverAct` / `clockMs`) — "YOUR DAILY IS SAVED" is only true for 20
  minutes, and HOLD'EM runs 20–100.** `coastclear/logic.js:128–129` `MAX_PAUSES = 3; PAUSE_CAP_MS = 20 * 60_000` (DFIX1, Nov 7 — when
  the room games were OVERCLOCK and PRISM); `today-logic.js:15` `ROOM_BANNER = 'GAME STARTING · YOUR DAILY IS SAVED'`. A guest mid-COAST
  CLEAR when the host starts HOLD'EM: paused at 1:00, after a 45-minute match the clock reads 26:15 (40 points, the floor for a clear);
  after 90 minutes 71:15; a fourth game that night is refused a pause at all. Fix (your call): no stopped-time cap for a room-verified
  pause (it already needs a started game with 2+ players), or the banner + the chip say what is true.
- **DY4 · SHOULD-FIX (the owner's decision — his own BEFORE PUBLIC list, `docs/games/plan.md:150`) · S–M · REPRODUCED — learn it on a
  throwaway, play it for real: still open, and COAST CLEAR takes a 0:00 clear.** THE THROWAWAY GATE is enforced on every reward path
  traced (the histogram, YOUR TABLE, the points, the flags, the sweep, PENTHOUSE's finishers) — it stops a same-day profile from
  RANKING, not from LEARNING; "no reveal for a non-counting run" never landed (`coastclear/logic.js:157` `...(st.done ? { reveal:
  board.lights.slice() } : {})`; THE PASSWORD's `resp.word`). Run (HTTP, same-day profiles so nothing counted): a throwaway got the
  18-light reveal in 2 calls; a second profile with that map cleared the harbor in 9 calls / 126 ms — stored score 0, the share card
  "0:00". What an aged profile gains this way: COAST CLEAR 100 points + LIGHTHOUSE + GHOST RUN (rare) + rank 1; THE PASSWORD in 2 = 100
  points + KEYHOLE + SAFECRACKER (rare); PENTHOUSE (epic) on any day with 50+ counting finishers; a perfect 200 a day on the public
  `daily` boards. One learner a day serves any number of aged profiles. Inherent to a same-for-everyone daily; the cheap parts: (a) the
  planned no-reveal for a non-counting run, (b) /admin → TODAY'S PLAYERS flags the impossible (a counted PASSWORD in 2, a clear under
  ~15 s) so you can hide it, (c) a floor under which a clear earns no GHOST RUN / PENTHOUSE.
- **DY5 · SHOULD-FIX · S · READ — the room's pause is sent once and fails silently.** `js/screens/daily.js:439` `pause(code) { if
  (inner && typeof inner.pause === 'function') inner.pause(code).catch(() => {}); }` — if that one call fails as the game starts, the
  banner still says SAVED and COAST CLEAR's clock runs through the match. The server would take a retry for as long as the room is
  playing. Fix: retry with a back-off while the room plays, like `recordFinish`.
- **DY6 · SHOULD-FIX · S · REPRODUCED — COAST CLEAR: a lost answer to a flood dig leaves the phone showing 1 cell where the server opened
  33.** `coastclear/logic.js:109–110`: a repeat dig answers `cells: [[i, …]]` (the tapped cell only) or, on a light, `lit: []`; the view
  doesn't re-sync on `already` (`view.js:241–266`). The retry is free and safe, but the rest of the flood stays shut on screen until a
  refresh, the clock running (browser: the phone 15 open cells, the server 47; after `resync()` 47). Fix: on `already` return the cell's
  whole flood / `lit: [i]`, or the view calls `resync()`.
- **DY7 · SHOULD-FIX · S · REPRODUCED — THE PASSWORD: a resume in a dead spot shows an empty, unlocked board.** `password/view.js:258`
  `catch (e) { busy = false; if (!gone) { note('NO SIGNAL · TRY AGAIN', true); kb.lock(!!canGuess(run)); } return false; }` — `run` is
  the local empty shell, so the keys unlock; the note fades in 2.4 s and nothing retries. The player types what looks like a first
  guess; it lands as guess n + 1, unseen rows above it (browser: 3 guesses on the server, `start` blocked → `{ locked: false, rowsShown:
  0 }`; signal back, SLATE → rows `[CRANE, MOULD, PITHY, SLATE]`). Fix: keep the keys locked and retry `start`, as COAST CLEAR does.
- NICE · S unless said — the TODAY ticket's name is cut at 390 when the button reads RESUME ("THE PASSWOR…"; fine at 402 / 430;
  REPRODUCED); the streak across 4 am: finishing today's daily before yesterday's crossed-over run breaks the streak (5 → 1 with WIN IT
  BACK offered; the other order gives 7 — REPRODUCED pure, M); on the two DST nights the server's turn is 3 am / 5 am local while the
  phone's countdown assumes 4 am (known, in `clock.js`); `{ cell: null }` digs cell 0 (`Number(null) === 0`, `logic.js:200` — the
  shipped client never sends it; require an integer); a 429 says "wait a minute" where the window is 10; COAST CLEAR shows an empty dead
  board on a non-retryable `start` failure (`view.js:404–408`, READ); a `finish` that dies between the score claim and the `pstats`
  transaction is healed only by a retried finish the phone never sends (that day's streak + points lost — READ, a narrow crash window,
  M); `dly/` clean-up (the other BEFORE PUBLIC item) is not built; the one official clock starts on the first PLAY tap with no warning
  (the owner's taste).
- **Refining FR7-A.** The 503's internal string (`daily.js:148`) is on `start` only — no 500 and no stack in all the fuzzing. The 400
  calls / 10 min budget is per USER, not per IP (the 401st → 429, a second user from the same address → 200): eight phones on one Wi-Fi
  can't lock each other out. COAST CLEAR is still about one call per effective tap at a human pace (~50–110 a run; the batching only
  saves calls when taps outpace the round trip), THE PASSWORD ≤ 15.

**Reviews #1 + #2 → DFIX1–3, checked one by one — nothing regressed.** A run keeps its own day · the pause caps (now colliding with
HOLD'EM — DY3) · a stray move → 400 · the finish retried · the shared kit · the frozen schedule + the daily secret only in the database
(`tests/daily-secrets.test.mjs` green; nothing about a day is computable from the repo — `answers.json` is alphabetical) · the rate
limit · each day's own counters · PENTHOUSE at the day's close · the reseed before 4 am · THE 4 AM TURN · the chip only while its run
is resumable (its target is DY1) · the mid-daily flag · a room of one can't pause · the batched moves (13 → 400). Never landed, both on
the owner's BEFORE PUBLIC list: no reveal for a non-counting run (DY4), `dly/` clean-up.

## What was checked and found FINE (FR7 FIXES needn't re-check)

- **Whole matches on the real views** (the emulators): PRISM DROP 8 phones (88 / 88), OVERCLOCK 8 phones (27 + 75 + 22), HOLD'EM 8
  phones, the dailies' three suites, the smoke test (8 / 8: the three playable games started by a regular host, none of the ten hidden
  ones startable) — host killed, a refresh mid-match, a hidden / locked phone, a late joiner, the rematch, the podium; the unit suite
  1,653 / 1,653 (with this file in place — before it existed the docs-link test was the one red, naming it from Step 0's plan line).
- **The server's credit = what the phone shows**: the podium's XP rows read off the screenshots match `js/core/ranks.js` (PRISM 1st of
  8: +131; OVERCLOCK 2nd of 8: +90); the full profile path is FR7-A's `e2e-profiles` 142 / 142.
- **Teardown**: FR7-A's 30 cycles of each playable game (flat) stand; the dailies measured here (flat); PRISM's caches are PD7; OVERCLOCK's
  two paths that outlive a screen are OC3 + its NICE line.
- **PRISM DROP**: a new host never judges on unloaded data (`host.js:133`); every game clock on `serverNow()` (a wrong phone clock
  changes nothing); the game never waits on a write; a lost top-out is ended by AWAY; SCORE RUSH has no AWAY (a locked phone only loses
  time, the last saved score is credited); a 2-player BATTLE where one leaves → the other wins at 30 s and is credited; songs: no
  manifest / a failed fetch or decode = a silent, working match; only YOUR OWN effects sound (nothing stacks at 8 players), the per-song
  gains are cuts only; the layout at 390 / 402 / 430 / 375 × 667 / 360 × 640 / 320 × 568 (the board fits, SLAM 40 px in a 52 px tap
  area, nothing under the corner buttons, the rail shows initials); a paper that fails to load → the CSS colour; a refusal storm can't
  flood /admin (one report a path shape, ≤ 6 a page); the upload cost (≈ 52–91 KB a minute a player; an 8-player 5-minute BATTLE ≈
  14–25 MB of download at most).
- **OVERCLOCK**: every transition at 2 + 8, the same step twice = the same patch, totals derived; a host change mid-play / after the
  unseal / mid-race / in the standings (the lock + the draw read back, never re-drawn); `liveKey` not loaded → SYNCING, never an empty
  challenge; an offline player isn't waited for; the skip (own tap, ≥ 3 s, connected only); THE ROUND WIN one rule; EVERYONE TIED = a
  draw; SOLO (no DUMB LUCK, CLOSEST's +60 only DEAD ON); a late joiner spectates and is dealt in at the rematch; the board + its envelope
  are ONE update (no drop between them); DUMB LUCK never last / at most once / never solo (9,000 seeded orders); the pools (above); no
  banned colour word on screen; no input element; the timers on `serverNow()`; the sounds each behind the unlock with a minimum gap,
  gains 0.2–0.6 into the SFX bus, nothing per frame.
- **HOLD'EM**: ranking, the wheel, kickers, splits + the odd chip, 3+ side pots with dead chips, the uncalled bet; the min raise + the
  reopen rule; heads-up blinds; a blind all in inside the deal; two busts in one hand; CASH (rebuy, leave, END SESSION, the ledger sums to
  0); one transaction a call (a double CALL → `200 | 409`); out of turn / an outsider / a guest's start → refused; the rules (another
  seat's `hole`, `hrec`, any client write to the table — refused, the host too; a kicked player loses its own card read); no card-shaped
  string in the public node before it shows; THE CATCH-UP can't deadlock; the slider's bounds = the dealer's; a refresh / a lock = the
  state, never a replay; `holdem-tw` only from the dealer's rows; the sounds (one limiter, sources stopped on hidden / unmount); the
  teardown; the screens at 390 / 402 / 430 / 844 × 390 with 8 seats and 12-letter names.
- **The dailies**: no answer / board in any reply (a mid-run `start`, `today { share }`, the share cards, `Server-Timing`, every reply
  `no-store`); the rules (`dly`, `dsched`, `dsecret` under the root deny); the fuzz (6 letters, unicode, null, arrays, 100k characters →
  422; out-of-range cells → 422; garbage moves → 400; a 2.5 MB body → 413 — never a 500); a second `start` resumes; moves after the end
  refused; the day math on 11 days incl. both DST days and New Year; the go-live switch + RESEED behind the admin gate, audited; the sizes
  (a letter key 35.8 × 54 at 390, a COAST CLEAR cell 38 pt at 390 / 42.4 at 430, DIG / BUOY 179 × 58); the gestures (dig on
  pointer-up, a 12 px slide cancels, a 380 ms long-press = a buoy); the sounds (gains 0.40–0.62, one engine, the first-tap catch).
- **Not checked** (said plainly): anything on a real iPhone (a true 60 s lock, Safari's timers on wake, the audio unlock, Low Power
  Mode's real cap, Lockdown Mode, the touch feel of 36 pt keys and 38 pt cells); loudness BY EAR against the city's music (the gain
  numbers only); production's environment (the published rules, `DAILY_SECRET`, the `cle1` region); the day's close under real
  concurrency; the HOLD'EM 400-hand endurance run and `holdem-server.test.mjs` (FR7-A's run stands); the forged records end to end
  through the HTTP `/api/report` (the real rules + the real director + `extractMatch`, not the board write).

## The decisions FR7 FIXES needs from the owner first

They are one question asked five ways — **what do the public boards and the rare cards have to be worth once strangers play?**

1. **The self-reported scores** (PD2, PD3, OC2): accept in writing like C2 · the cheap bounds (PRISM's margin, OVERCLOCK's time floor +
   the `doneAt` rule, the attack's number) · or the real replay / host-graded picks (L each — after the launch).
2. **The farms** (FR7-A's C2 + HE3): a daily ceiling on XP-paying room matches, a win only with 2+ rows that have a profile, a higher
   floor for `holdem-tw`.
3. **The dailies' learn-then-play** (DY4): no reveal for a non-counting run + the impossible-result flag in /admin, or accept.
4. **COAST CLEAR's pause cap vs HOLD'EM** (DY3): lift the cap for a room pause, or change the words.
5. **END GAME on a HOLD'EM match** (FR7-A's B1): end it through the dealer, or say NO RESULT in the confirm.

## THE COMBINED MUST-FIX LIST (FR7-A + FR7-B) — the order for FR7 FIXES

| # | from | finding | size | state |
| --- | --- | --- | --- | --- |
| — | FR7-A C1 | a forged report pays unbounded XP | S | **FIXED** in `678395fe` (THE REAL PLAYER COUNT) |
| 1 | FR7-B PD1 | PRISM's test hook ships (the one-line robot) | S | open — first: it is usable today on the live site |
| 2 | FR7-B OC1 | OVERCLOCK's STANDARD boards accept 3× the max | S | open |
| 3 | FR7-B DY1 | RESUME YOUR DAILY on a fresh page: no stylesheet | S | open — the dailies are live |
| 4 | FR7-B DY2 | THE PASSWORD: a lost answer = a guess counted twice | S | open — the dailies are live |
| 5 | FR7-A E1 | the back-fill undoes THE LAUNCH RESET (no reset epoch) | S | open — before the reset; until then never back-fill after it |
| 6 | FR7-A D1 | the cloud tests vs a private repo (the runner) | M–L | open — rides THE LAUNCH, not FR7 FIXES |

**One pass or two? TWO.** The five open S must-fixes are about two hours with their tests; but the SHOULD-FIX lists are ~30 (FR7-A) + ~17
(here), and one of them is a rules pass. Split by what a player or a stranger can hit versus what only the launch needs:

- **FR7 FIXES A — "what a stranger or a player can hit" (~5 h; ONE rules re-publish; the first push deploy-tagged with must-fixes 1–4
  alone).**
  1. Must-fixes 1–5 (PD1, OC1, DY1, DY2, E1) + their tests.
  2. The games' real bugs: PD4 (the dead board), PD5 (no WebGL), PD6 (the 30 Hz cap), PD7 (the caches); OC3 (SORT IT's timers); HE1 (the
     late tap), HE2 (poke from `prepare()`), B1 as decided; DY5, DY6, DY7, DY3 as decided.
  3. The bounds, as decided: PRISM's margin + the flags, OVERCLOCK's time floor, the XP ceiling / the win rule (C2 + HE3), DY4's
     no-reveal + the /admin flag.
  4. THE RULES PASS — one re-publish: FR7-A's C3 (`activeAt`), C5's caps, C4 as decided; PD3 (the attack's number), OC2's "`doneAt` only
     with `done`" — each with a fallback that works on the old rules; then the fixture synced + the ack deleted.
  5. The console's four from FR7-A's B2 / C6: the INITIATE guard, the solo snapshot win, the names on the player page + a friend request.
- **FR7 FIXES B — "the launch + the plumbing" (~4–5 h; no rules change).** FR7-A's E2 (the freezes), E3 (the founder sweep), E4 as
  decided, the og image; D2 (the edge requests — its own group), D3 / D4; the tests (the smoke filter, the four `/api` suites in the
  cloud, `crew`, the FAST `short`, the vault's `?emu`, + from here: the reload-then-chip line, a no-WebGL PRISM mount, the STANDARD bound's
  case, PRISM's `perfRun` pinned to a look); the docs' stale lines; the NICE lines worth their minutes (the SOLO SURVIVAL time, the combo marks after a refresh, the short
  big blind, the hand-0 flash, the cut ticket name); D1's workflow rewrite proven while the repo is still public.

If only ONE pass is possible before telling people: FR7 FIXES A's steps 1, 2 and 4 — and the decisions written down for the rest.
