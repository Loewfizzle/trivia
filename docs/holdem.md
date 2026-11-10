# HOLD'EM — Texas Hold'em, 2–8 players, play chips only

*(HE1, Nov 10 2026 — THE ENGINE + THE SIMULATIONS. HE2, Nov 10 2026 — THE SERVER DEALER (below: "THE DEALER"). Still no screen and no
`config.js` GAMES row: nothing a player can see. The owner's decisions: docs/games/plan.md "HOLD'EM — THE PLAN (Nov 10 2026)" + "HE1" +
"HE2 — THE SERVER DEALER". The next pass, HE3, builds the table screen on the dealer.)*

## The plan in short
- Texas Hold'em (no-limit), 2–8 players, one phone each, **PLAY CHIPS ONLY** — chips reset every match, no bankroll, nothing buyable becomes
  chips, no money words anywhere ("CASH" is only the mode's name). No solo, no bots in v1 (the robots here only test the rules).
- **THE SERVER IS THE DEALER (HE2 — built):** it shuffles with Node's crypto randomness (no secret, no env var — the plan's "new secret" became
  plain crypto: nothing needs to be reproducible), sends each phone only its own 2 cards, reveals the board, checks every action, runs the
  clock, settles every pot. The host holds no cards and has no power over another player's seat.
- **TOURNAMENT** (TURBO default · STANDARD · DEEP) and **CASH** (an open session). Showdown: everyone still in shows; a fold-win may SHOW.
- The passes: HE1 engine + sims → HE2 the server dealer → HE3–HE4 the table screen → HE5–HE6 skins → HE7 sideways → HE8 E2E + polish →
  HE9 Fable review → HE10 fixes. Live only when Ben flips its own `playable` switch.

## The files (`js/games/holdem/` — all PURE: no DOM, no database, no clock, no Math.random)
| file | what |
| --- | --- |
| `cards.js` | the 52 codes (`"As"`, `"Td"`, `"2c"`), `shuffleDeck(rng)` (Fisher–Yates on the INJECTED rng), code ↔ int |
| `rank.js` | THE HAND RANKER: `scoreInts` (best 5 of up to 7, one comparable number), `evaluate`, `compareHands`, `bestFive`, THE PLAIN LABELS (`labelOf`, `holeLabel`, `handLabel`) |
| `pots.js` | `buildPots` (main + side pots from every seat's contribution), `splitPot` (equal shares + the odd chips) |
| `structure.js` | THE BLIND LADDER, the speeds (stacks + level times), CASH's numbers, the shot clock + time bank, `blindsAt`, `levelAt` |
| `table.js` | ONE HAND as a reducer: `createTable`, `startHand`, `apply`, `legalActions` (+ THE PRESETS), `preAction`, `forceFold` |
| `views.js` | THE PRIVACY VIEWS: `publicView`, `seatView` |
| `match.js` | a TOURNAMENT or a CASH session around the table: `createMatch`, `nextHand`, `act`, `rebuy`, `join`, `leave`, `endSession`, `sitBack` (HE2), `ledgerOf`, `chipCount`, `summary` |

Every function takes a state and returns a NEW one (`{ state | match, events, error? }`) — the input is never changed; an illegal action
comes back with `error` (a plain sentence, e.g. "the smallest raise is to 100") and the SAME state object. All state is plain JSON.

## The structure
- **Stacks:** TURBO + STANDARD 1,500, DEEP 3,000. No antes.
- **THE BLIND LADDER:** 10/20 · 15/30 · 25/50 · 50/100 · 75/150 · 100/200 · 150/300 · 200/400 · 300/600 · 500/1,000 · 700/1,400 · 1,000/2,000 ·
  1,500/3,000 · 2,000/4,000 · 3,000/6,000 · 5,000/10,000, then ×2 a level.
- **Level time:** TURBO **90 s** (tuned from the plan's 2 min by THE LENGTH STUDY below) · STANDARD 6 min · DEEP **15 min** (HE2 — Ben; HE1 had
  12). The level = (now − the start) ÷ the level time; a new level applies from the NEXT hand, never mid-hand (`match.js#blindsFor`).
- **THE SHOT CLOCK (both modes since HE2):** 20 s a turn; then the player's 30 s TIME BANK (spent only after the 20 s, and only what they use —
  acting 10 s into it leaves 20 s); then TIMEOUT = CHECK if free, else FOLD. A TOURNAMENT's bank is one per player per MATCH; CASH's refills
  **+5 s per hand dealt in, up to 30 s** (`structure.js#BANK_REFILL_MS`).
- **CASH:** 1,000 chips, 5/10 fixed, a REBUY of 1,000 at zero, late joiners, no session END time ("no timer" never meant no shot clock — HE2).

## The rule choices (HE1 — the ones Ben might care about)
- **Standard no-limit rules:** before the flop the seat left of the big blind opens, after it the seat left of the button. **HEADS-UP** the
  button posts the SMALL blind, acts first before the flop and last after (it switches on by itself the hand only two are dealt in).
  Min bet = the big blind; min raise = the last FULL raise size; an uncalled bet goes back; everyone folds → the last player wins without showing.
- **THE REOPEN RULE:** an all-in short of a full raise does NOT reopen the betting for a player who already acted — but several short all-ins
  that ADD UP to a full raise do (the TDA rule): a player who acted may raise again only when the bet has grown by at least one full raise
  since they acted (`table.js#legalActions` — `reopened`). Nobody may raise when everyone else is all in (call or fold).
- **A short all-in below the big blind** (after the flop) counts as a short bet: the next raise must reach at least TWO big blinds.
- **A short big blind:** the others still owe the FULL big blind; the short stack can only win what it matched (a side pot forms).
- **Dead chips:** a folded seat's chips stay in the pot — the "uncalled bet" is only ever returned to a player still in.
- **SIDE POTS:** one layer per distinct all-in level among the players still in; each pot to the best hand among the players who reached it;
  ties split in whole chips, **the odd chip(s) to the first winner(s) left of the button**. Folded chips count in every layer they reached.
- **THE RUN-OUT:** once betting is over with players all in, the rest of the board deals by itself (a `runout` event, then each `street`
  event with `runout: true` — the screen will show it). A hand can even end INSIDE the deal (both blinds all in) — the match settles it there.
- **THE STEP RUN-OUT (HE2 — `stepRunout: true`, the dealer's tables):** when the betting is over with players all in, the live hands are turned up
  at once (`shown … runout: true` — the TDA way) and the board then comes ONE STREET per `{ type: 'deal' }` (the dealer's own action, on a poke
  after the reveal time); the river's deal settles the showdown. Upcoming cards stay in the deck — on the server only. A leaver mid-run-out stays
  in to the hand's end (like an all in). Off (HE1's default, the sims): the whole run-out deals inside the action that ended the betting.
- **SHOWDOWN:** everyone still in shows, in order from the first seat left of the button. A fold-win: the winner MAY `show` until the next deal.
- **THE BUTTON — the simple moving button:** the first hand's button is a random dealt-in seat (the injected rng); after that it moves to the
  NEXT DEALT-IN seat clockwise from where it was — empty or busted seats are skipped, even when the button's own seat just emptied; the blinds
  follow it (3+: the two seats after it; heads-up: the button = the small blind). A player may now and then skip a blind or pay the big blind
  twice in a row when a neighbour busts — casinos' dead-button rule isn't worth the confusion at a party.
- **AWAY:** two TIMEOUTs in a row → AWAY. A TOURNAMENT: from then on they check-if-free-else-fold AT ONCE (no clock) each turn, still dealt in +
  posting their blinds, until they act again (`{ type: 'back' }` — any real action also clears it). **CASH (HE2): AWAY = SAT OUT** — from the
  next deal they are skipped (`status: 'sitout'`, not dealt in, no blinds, no hand counted) until SIT BACK (`match.js#sitBack`); a table with
  fewer than 2 dealable players waits. The time bank is untouched either way.
- **Nobody acts for another player (HE2):** every action is the acting seat's own; the host can't fold, sit out or act for anyone — the clock
  handles walk-aways. The host's only extra powers: start the match, END SESSION (CASH).
- **THE PRESETS** (`legalActions(...).presets` — real "raise TO" amounts): before the flop **MIN · 3× · ALL IN** (3× = three times the current
  bet), after it **½ POT · POT · ALL IN** (½ POT = the bet + half of (the pot + the call); POT = the bet + the pot + the call). Rounded to the
  nearest 5 chips, never below the legal minimum (MIN itself is exact); one that reaches all in or repeats another is dropped (ALL IN stays).
  A player who can't raise gets none; a short stack whose only raise is all in gets ALL IN alone.
- **THE PRE-ACTIONS** (`preAction`): CHECK/FOLD checks when free, else folds — it never calls; CALL ANY calls whatever the bet is (all in
  included) or checks when free. A new street or hand cancels a toggle.
- **TOURNAMENT places:** 0 chips after a hand = OUT. Two or more out in the same hand → the one who STARTED that hand with more chips places
  higher; equal starts SHARE the better place (two out from 3 left with equal stacks → both 2nd). The KO goes to the winner(s) of the highest pot
  the busted player could win. One player left → the winner + the full order of finish. No late joiners, no leaving (a player who goes quiet
  is AWAY, blinded down).
- **CASH:** a REBUY at zero between hands — or while a hand runs that the player isn't in (they're dealt in next hand); a late joiner takes
  the first free seat with 1,000 and is dealt in from the next hand (no blind owed); a player who left may come back (a new buy-in). LEAVING:
  mid-hand they fold at once (out of turn); a player all in stays to the hand's end; the stack counts at the moment they leave. **END
  SESSION** (the host): between hands it closes at once; mid-hand it closes when that hand ends, or at once with `{ voidHand: true }` (every
  chip of the running hand back). **THE LEDGER:** per player everything bought in (rebuys included), the final stack, **net = final − bought
  in** (Σ net = 0, tested), hands played; the session's biggest pot. Chips only — no rates, no "owes".

## The state (plain JSON — on the server it lives inside THE RECORD, below)
```
table: { v, hand, street: 'idle'|'preflop'|'flop'|'turn'|'river'|'done', sb, bb, button, sbSeat, bbSeat,   ← seat NUMBERS (0–7)
         seats: [{ id, seat, stack, status: 'in'|'folded'|'allin'|'out'|'sitout', cards, bet, total, start,
                   acted, actedAt, shown, bank, timeouts, away }], awaySitsOut (CASH — HE2), stepRunout + runout (the dealer's — HE2),
         board, deck (SERVER ONLY), bet, minRaise, turn, deadline, bankOn, bankFrom, clock: { shot, bank } | null,
         pots: [{ amount, ids }] (settled at each street's close), result: { total, byFold, pots: [{ amount, ids, winners, label, cat }] },
         log: [this hand's events] }
match: { v, game: 'holdem', mode, speed, startAt, levelMs, level, table, players: { id: { seat, buyins, rebuys, banked, hands, won, kos,
         joinedAt, left, leaving } }, places: [{ id, place, hand, by }], hands, biggest, notable, ended, endAt, winner, ending, ledger }
```
`bet` = this street's bet in front of a seat, `total` = everything it put in this hand, `start` = its stack when the hand was dealt.

**THE EVENTS** (every one `{ t, hand, at, … }`, also kept in `table.log` for the hand — for HE3's animations + sounds; NEVER a hidden card):
`dealt { ids (deal order), button, sb, bb, heads }` · `posted { id, blind, amount, allin }` · `folded` · `checked` · `called { amount, to }` ·
`bet` / `raised { amount, to, full }` · `allin { kind: call|bet|raise, amount, to }` (an auto check / fold carries `auto`, an AWAY one `away`,
a leaver's fold `left`) · `returned { id, amount }` · `street { street, cards, board, runout }` · `runout { from, ids }` ·
`shown { id, cards, label, short, cat, best }` (a fold-win's SHOW: `byChoice`) · `pot { pot, side, amount, winners: [{ id, amount }], label,
cat, ids, byFold? }` · `timebank { id, ms, until }` · `timeout { id, action }` · `away` · `back` — and from the match: `level`, `out { id,
place, by }`, `ended`, `rebuy`, `joined`, `left`, `ending`, `voided`.

**THE MATCH SUMMARY** (`match.js#summary` — HE2: the dealer builds its result rows from it, `holdem-dealer.js#resultRows`): `{ game, v, mode, speed, startAt,
endAt, hands, winner, places (tournament, 1st first), ledger (cash), biggestPot: { amount, hand, ids }, notable: [{ hand, kind: 'strong' (four
of a kind or better shown) | 'knockout', … }], players: { id: { hands, won, kos } } }`.

## The views
- `publicView(table)` = everything ANY phone may see: the deck removed (`deckLeft` = a count), every seat's `cards` removed unless SHOWN
  (`held` says a seat still has cards). The events never carry a hidden card, so `log` is safe as it is.
- `seatView(table, id)` = publicView + `mine` (that seat's two cards) + `me`.
- `legalActions` reads only public fields — a phone runs it on its own view to draw the buttons + presets.
- THE LEAK TEST: `tests/fixtures/holdem-driver.mjs#assertNoLeak` scans every string (keys + values) of publicView after EVERY action of every
  simulated hand and fails on any unshown hole card.

## THE LENGTH STUDY
`node scripts/holdem-sim.mjs` (≈ 2 s; `--runs=N`, `--only=turbo`, `--turbo=<seconds>` = a "what if" for TURBO's level). Tournaments on the real
engine with THE TEST ROBOTS in a party mix (tight 30 % · loose 35 % · calling 20 % · wild 10 % · all-in 5 %), paced like people:
3–8 s a decision, 4 s a deal, 1.5 s a street, 4–6 s at a hand's end; a robot dozes past the shot clock now and then. Robots aren't people —
read it as the shape, not a promise.

Minutes, median / 90th percentile (40 TURBO, 24 STANDARD, 40 DEEP runs a cell — HE2 raised DEEP from 12 runs: at 12 its 6-player median came
out above the 8-player one):

| players | TURBO 2 min (the plan) | **TURBO 90 s (shipped)** | STANDARD 6 min | DEEP 12 min (HE1) | **DEEP 15 min (HE2)** |
| --- | --- | --- | --- | --- | --- |
| 2 | 13.0 / 18.5 | **11.3 / 14.3** | 30.7 / 47.1 | 37.0 / 54.1 | **41.5 / 86.6** |
| 4 | 19.3 / 24.3 | **15.3 / 19.3** | 41.4 / 54.4 | 67.8 / 120.3 | **66.9 / 101.7** |
| 6 | 22.2 / 25.0 | **18.5 / 22.3** | 45.5 / 56.6 | 75.7 / 132.4 | **94.6 / 132.6** |
| 8 | 24.6 / 28.5 | **19.7 / 24.8** | 53.7 / 64.4 | 99.4 / 130.2 | **111.4 / 144.7** |

- TURBO at 2 min sat ABOVE the 15–20 min target at 6–8 players → **its level time only** went to 90 s (80 s gave 17.6 / 18.2 — 90 s is the
  smallest change inside the target). The ladder is untouched.
- STANDARD lands in its 45–60 min target at 6–8. DEEP at 15 min (HE2) runs ~1½–1¾ h median at 6–8 (90th percentile ~2¼–2½ h) — closer to the
  plan's "2 h+"; TURBO + STANDARD unchanged by HE2 (the sim re-run gave the same numbers). CASH has a shot clock now but no length (no end time).

## The tests (npm test — ≈ 7 s for all four)
- `tests/holdem-rank.test.mjs` — THE CLASSIC PROOF: all 2,598,960 five-card hands → the exact category counts (1,302,540 high card … 40
  straight flushes incl. 4 royals) + the 7,462 distinct hand values (≈ 0.16 s); the tricky cases; 3,000 random 7-card hands = the best of
  their 21 five-card subsets; the labels.
- `tests/holdem-table.test.mjs` — one hand on rigged decks: the order (incl. heads-up), min bets + raises, THE REOPEN RULE (short + cumulative),
  the uncalled bet, the fold-win + SHOW, side pots + splits + the odd chip, THE PRESETS, THE PRE-ACTIONS, the clock + bank + AWAY, the views.
- `tests/holdem-match.test.mjs` — the structure, the level clock, simultaneous busts + shared places + KOs, the heads-up switch, a hand
  ended inside the deal, CASH (rebuy, join, leave, END SESSION, voidHand, THE LEDGER), the summary.
- `tests/holdem-sim.test.mjs` — ≈ 230 tournaments + ≈ 100 cash sessions (≈ 30,000 hands) by THE TEST ROBOTS (`tests/fixtures/holdem-bots.mjs`
  — tight, loose, maniac, calling, shover + the ALL-IN HAPPY "jammer" for the side-pot tables; never shipped) with THE INVARIANTS after
  EVERY action (`tests/fixtures/holdem-driver.mjs`): chips conserved (+ rebuys + leavers), no negative or fractional stack, every hand ends,
  illegal tries refused + nothing changed, 3–7 players all in at once, heads-up rules at 2, one winner + the full order, ledgers sum to 0,
  publicView never leaks, a seed replays exactly; plus a grep that the engine never reads a clock or Math.random.
- (`tests/holdem.test.mjs` is THE HOLD'EM BILLBOARD's — the city's roof poster, `core/harbor-holdem.js` — not this game.)

## THE DEALER (HE2 — Nov 10 2026)
The engine runs on the SERVER. **No new Vercel function (still 8): the ops ride `POST /api/report { holdem: <op>, room, … }`** — report.js is
the room-match function: it already reads `rooms/{CODE}` and credits a finished match through `api/_lib/stats.js#applyMatch`, which the dealer
calls itself at the match's end (no host relay, no client claim); its normal traffic is one call per player per match, so the dealer's calls never
crowd a hot path (daily.js's dig path stays alone). The hold'em branch answers with REAL statuses (a stale tap = 409, a flood = 429) + Server-Timing.

| file | what |
| --- | --- |
| `api/_lib/holdem-dealer.js` | PURE (no database, no clock, no randomness of its own): the record, every op, THE POKE's `advance` + `dueOf`, the pauses, the pre-actions, `publicOf` / `holeOf`, the result rows |
| `api/_lib/holdem-store.js` | the database half: `holdemAction` (the call budget, the room checks, ONE transaction, the writes, the result), crypto randomness, the emulator-only test hooks |
| `api/_lib/timing.js` | Server-Timing (moved out of daily.js — both share it) |

**THE OPS** (POST, a Firebase ID token — `requireUser`; the caller must be a player in the room, `rooms/{CODE}/players/{uid}`, and not kicked; the
uid is ALWAYS the caller — never a uid from the body):

| op | body | who | what |
| --- | --- | --- | --- |
| `start` | `{ room, mode: 'tournament'\|'cash', speed? }` | the host | seats = the room's players (≤ 8, not kicked), in an order the server's randomness picks; the first button is the engine's rng pick; hand 1 dealt at once. Refused while a match runs — unless it is ABANDONED (its room was closed + the HUSH WORD reused, or < 2 of its seats are still in the room) |
| `act` | `{ room, hand, seq, action, amount? }` | your seat | `fold` · `check` · `call` · `bet` / `raise` (TO `amount` — either word, the server picks by the table) · `allin`. `hand` + `seq` = the state the phone acted on: a stale or repeated tap → 409 `stale` with the current `seq` + `hand`, nothing written; an illegal one → 409 `illegal` (the engine's sentence) |
| `pre` | `{ room, hand, pre: 'checkfold'\|'callany'\|null }` | your seat | your queued PRE-ACTION, kept on the SERVER: it fires the moment your turn arrives (your phone asleep or not); a new street / hand drops it (HE1's rule). Private: it never moves the public view |
| `show` | `{ room, hand }` | the fold-winner | the optional SHOW, until the next deal |
| `poke` | `{ room }` | anyone in the room | whatever is DUE by the server's own clock (below); nothing due → ONE tiny read (`hrec/{CODE}/due`), no transaction, no write |
| `rebuy` · `back` · `leave` · `sit` | `{ room }` | you (CASH) | rebuy at zero · SIT BACK from AWAY / SAT OUT · leave (your stack counts then) · a LATE JOINER takes a free seat (dealt in next hand; a player who left may come back) |
| `endSession` | `{ room, voidHand? }` | the host (CASH) | between hands: closes at once; mid-hand: closes when the hand ends. `voidHand: true` (every chip of the running hand back) is the FALLBACK only — refused (`too_soon`) until the end has waited 2 min |

Answers: `{ ok, changed, seq, hand, due, now }` (`id` = the matchId on `start`). Refusals: 400 `bad_*` · 403 `not_in_room` / `kicked` / `not_host` /
`not_seated` · 404 `no_match` · 409 `stale` / `illegal` / `running` / `too_soon` / `ending` · 429 `slow_down`.

**THE POKE — the server's clock decides, never a phone's.** Everything time-based happens when a phone pokes and the server's OWN `now` has
passed the moment: a turn's deadline (the 20 s, then the time bank — a late poke still starts the bank at the ORIGINAL deadline), a run-out
street (`PAUSE.street` 1.5 s apart), the next hand (`PAUSE.fold` 3 s after a fold-win, `PAUSE.showdown` 6 s after a showdown — the new blind
level comes with that deal), a queued pre-action, a CASH seat whose player was kicked (it leaves). `dueOf(rec)` = the next such moment, stored
beside the record (`hrec/{CODE}/due`) and in the public view (`due`); `null` = nothing timed (a CASH table waiting for a second dealable player);
`0` = the match's result still to send (any poke retries it). Many phones poking at once apply a due event ONCE (the transaction).

**WHO POKES (HE3 builds it — keep invocations low):** the HOST's phone pokes at each `due` (+ ~100 ms); every other phone pokes only if the table
is still stuck ~2 s after `due` (+ a random 0–1 s jitter, so a dead host costs one or two extra calls, never eight). A phone's clock = the public
view's `now`-corrected server time (`serverNow()`), never its own.

**THE NODES** (docs/data-model.md):
- `hrec/{CODE}` = `{ j, seq, due, id, ended, at }` — THE RECORD (SERVER ONLY — the rules' default deny): `j` = the whole match as ONE JSON string (the
  deck, every hole card, the hand log, the queued pre-actions, the pause stamps, the last 16 public events) — one string, so Firebase never drops
  an empty array or a null the engine expects (HE1's flag).
- `rooms/{CODE}/holdem` = `{ seq, at, j }` — THE PUBLIC VIEW (any signed-in reader — the room's players + spectators like every room; written by
  the server only): `j` = `publicOf(rec)`: the engine's `publicView` (no deck, no unshown card; its `log` dropped) + `players` (seat, buy-ins,
  rebuys, hands, won, KOs, left), `places`, `ended` / `winner` / `ending` / `ledger` / `biggest`, `startAt` + `levelMs` + `level`, `due`, `rep`
  (the result sent), `ev` = the last **16** events numbered `n` (a phone that missed a write or two still animates them; further behind it redraws
  from the state). ~5 KB a write (measured). `seq` moves only when what a phone can see changed; the write is a transaction that never goes
  BACKWARDS in seq (two calls finishing out of order can't leave an older table up).
- `hole/{CODE}/{uid}` = `{ h: hand, c?: [2 cards], pre? }` — A SEAT's PRIVATE VIEW (that uid only, never once kicked; server-written): written only
  when it changes; a new match replaces the room's node whole.

**THE RANDOMNESS:** `crypto.randomInt` (seat order, the first button, every shuffle, the matchId). The tests' seeded rng + clock go in through
`setTestRng` / `setTestClock`, honoured ONLY under the emulators (`FIREBASE_DATABASE_EMULATOR_HOST`) — production can't be steered.

**ONE CALL** = the budget (in memory; the shared `rl/hd_{uid}` count written behind it) → the room checks + the record + the public view loaded in
parallel (both HELD in the SDK's cache by a listener for the call — DFIX3's trick: each transaction's first attempt sees the real value) → ONE
transaction on `hrec/{CODE}` (a refusal writes nothing; a no-op writes nothing) → the public view's transaction + the changed private nodes in
parallel → at the match's end, THE RESULT. Server-Timing: `auth · pre · load · tx;desc=attempts · write · report · total` (+ the region).

**THE CALL BUDGET:** 900 calls / 10 min per uid (`holdem-store.js#CALLS`) — a fast 8-player table's host (every poke + their own acts) uses ~25 a
minute; a flood gets cheap 429s.

**THE RESULT, ONCE:** at the match's end (one player left, or END SESSION) the server builds the rows from ITS OWN record (`resultRows`: a
TOURNAMENT's places — 1st = the win; CASH by net — ties share, the top net wins unless everyone tied; a player dealt no hand isn't credited) and
runs the same path every room match uses: `results/{CODE}_{matchId}` claimed by a transaction (`src: 'dealer'`), `stats.js#applyMatch` (XP, the
streak, the counters — exactly once per player by `pstats/{pid}/m/{key}`), `bumpPlayed('holdem')`. Then `rep: 'done'` in the record + the public
view. A failure leaves `rep` unset → due = now → the next poke retries. No new cards / achievements; no boards yet (`rec` is empty).
(For HE3: the phones' usual podium report (`/api/report { code, matchId }`) gets each player's outcome back once `results/{key}` is done — wait
for the public view's `rep`.)

**THE RULES** (database.rules.json — HE2 changed them: RE-PUBLISH): `rooms/{CODE}/holdem` `.write: false` (no client — the host included; the room's
own delete-the-whole-room close still takes it with the room); top-level `hole/{CODE}/{uid}` `.read` = that uid, signed in, not kicked; no write;
`hrec` has no rule (the root's deny). Proved in tests/integration/rules.test.mjs + read AS each phone in the full-match suite.

**THE FREE-PLAN COST** (measured on the emulators — tests/integration/holdem-server.test.mjs prints it): ≈ **2–4 ms of function CPU a call** (an
act ~2–3 ms, a poke that deals ~3–5 ms, a poke with nothing due ≈ 1 read); robot tables ran **6–7 calls a hand** — people, with more checks +
calls, ~**12 a hand** (≈ 10 acts + the deal / run-out pokes). An 8-player TURBO (~21 hands, ~20 min) ≈ **250 calls, ~1 s of CPU**; an 8-player
DEEP (~110 hands, ~2 h) ≈ **1,350 calls, ~5 s of CPU** — against Vercel Hobby's 1 M invocations + 4 h of active CPU a month that is ~4,000
TURBO matches. **Firebase's download is the tighter one:** each call downloads the record (~7 KB) + the public view (~5 KB) to the function and the
view to every phone watching (~5 KB × 8) ≈ 50–60 KB a call → ~15 MB a TURBO match, ~80 MB a DEEP one: the Spark plan's 10 GB a month ≈ 650 TURBO
or ~125 DEEP matches. Fine for parties; if HOLD'EM ever runs all night every night, slim the view first (HE3 note).

## THE TESTS (HE2)
- `tests/holdem-dealer.test.mjs` (npm test, ms): the dealer's pure core — start, stale + double taps, the clock + bank on pokes, pre-actions, the
  step run-out's timing, the pauses, CASH through the dealer (sit, END SESSION waits, the void fallback, a kicked seat), a tournament to the end
  with the leak check on every view.
- `tests/holdem-match.test.mjs` + `tests/holdem-sim.test.mjs` (HE2 additions): DEEP 15 min, CASH's clock + the bank refill, SAT OUT + SIT BACK,
  no act-for-another, a CASH sim with sleepy robots (~1,000 timeouts, ~700 sat-out seat-hands), THE STEP RUN-OUT sims (a street per deal).
- `tests/integration/holdem-server.test.mjs` (the emulators, ≈ 2 min, run ALONE): whole matches through `holdemAction` with 2–8 fake signed-in
  phones (a seeded rng + clock, emulator-only) — TURBO 2 / 4 / 8 to a winner, CASH (late join, rebuy, AWAY → SAT OUT → back, leave, END SESSION
  waits, THE LEDGER = 0), the run-out on pokes, pre-actions while a phone is silent, the bank then the fold, double taps + stale seq, refreshes,
  the host leaving (END SESSION moves), 8 pokes at once = one event, a kick, the budget, the HTTP layer (real tokens, statuses, Server-Timing).
  **THE LEAK SCAN:** at every step everything phone B may read (the whole room tree + its own node, read AS B through the real rules) is
  deep-scanned for any other seat's unshown card + every undealt card; every ~25 calls B also tries the forbidden paths (another seat, the
  room's private node, the whole tree, the record) and must fail. The result reported once + credited once per player is checked at the end.
- `tests/integration/rules.test.mjs` — three HE2 rule tests (only your own cards; no client writes; a kick closes your node).

## For HE3 (THE TABLE SCREEN) — flagged
- The phone side of THE POKE (WHO POKES above), on `serverNow()`; a 409 `stale` → redraw from the view (and re-offer the tap if it's still your turn).
- THE ROOM's IDLE CLOSE: rooms close after an hour without `meta/activeAt` — the host's console stamps it every 10 min while a game runs; HOLD'EM
  must keep doing that (a DEEP match is ~2 h), or the room (+ its table) can be deleted mid-match.
- The cartridge plug (meta/go etc.) is HE3's: `start` here doesn't touch `meta/status`. The public view's events are the animation feed (dedupe by `n`).
- Firebase download (above): the public view is the cost driver — keep it lean.
- The robots' length numbers are a guide; HE8's real play-tests should re-check TURBO (90 s) + DEEP (15 min) with people.
