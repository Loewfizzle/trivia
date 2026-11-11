# HOLD'EM — Texas Hold'em, 2–8 players, play chips only

*(HE1, Nov 10 2026 — THE ENGINE + THE SIMULATIONS. HE2, Nov 10 2026 — THE SERVER DEALER (below: "THE DEALER"). HE3, Nov 10 2026 — THE
LEAN WIRE + THE TABLE SCREEN A (below): a cartridge + the portrait table, playable end to end in a LOCAL test room — its `config.js` GAMES row is
`playable: false` + `preview: true` (never offered, no sign; only a local emulator page that asks — `&preview=1` — can start it). The owner's
decisions: docs/games/plan.md "HOLD'EM — THE PLAN (Nov 10 2026)" + "HE1" + "HE2 — THE SERVER DEALER" + "HE3 — THE TABLE SCREEN A" + "HE4 — THE TABLE
SCREEN B". HE4, Nov 10 2026 — THE TABLE SCREEN B (below: "THE MOTION", "THE SHOWDOWN", "KO + SPECTATING", "CASH: LEAVE + THE LEDGER", "THE END SCREEN"). HE5, Nov 10
2026 — BEN'S FIXES + THE SOUNDS + THE REAL CHIPS + THE SKINS / NEON CASINO (below: "HE5"). HE6–HE7 below. HE8, Nov 11 2026 — YOUR TURN TIMER, THE OWNER'S LIVE TEST, REAL-WORLD TOUGHNESS, LONG NIGHTS (below: "HE8").)*

## The plan in short
- Texas Hold'em (no-limit), 2–8 players, one phone each, **PLAY CHIPS ONLY** — chips reset every match, no bankroll, nothing buyable becomes
  chips, no money words anywhere ("CASH" is only the mode's name). No solo, no bots in v1 (the robots here only test the rules).
- **THE SERVER IS THE DEALER (HE2 — built):** it shuffles with Node's crypto randomness (no secret, no env var — the plan's "new secret" became
  plain crypto: nothing needs to be reproducible), sends each phone only its own 2 cards, reveals the board, checks every action, runs the
  clock, settles every pot. The host holds no cards and has no power over another player's seat.
- **TOURNAMENT** (TURBO default · STANDARD · DEEP) and **CASH** (an open session). Showdown: everyone still in shows; a fold-win may SHOW.
- The passes: HE1 engine + sims → HE2 the server dealer → HE3–HE4 the table screen → HE5–HE6 skins → HE7 sideways → HE8 E2E + polish →
  HE9 Fable review → HE10 fixes + **ON for everyone** (Nov 11 2026 — its own `playable` switch, flipped once every finding was fixed + green).

## The files — THE ENGINE (`js/games/holdem/`'s seven rules files — all PURE: no DOM, no database, no clock, no Math.random)
(The folder holds 28 modules: these seven are the rules; the phone's side — the cartridge, its PURE helpers `logic.js` · `layout.js` · `layout-wide.js` ·
`wire.js` · `motion-plan.js` · `sound-plan.js` · `chips.js` · `skins.js`, and the screen `view.js` · `motion.js` · `sfx.js` · `card-art.js` · `chip-art.js` ·
`picker.js` · `rankings.js` · `final.js` — is listed under "THE TABLE SCREEN" and HE4–HE8.)
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
| `start` | `{ room, mode: 'tournament'\|'cash', speed?, matchId?, uids?, at? }` | the host (HE8: while `playable: false` only the owner — 403 `not_open`) | seats = the room's players (≤ 8, not kicked), in an order the server's randomness picks; the first button is the engine's rng pick; hand 1 dealt at once. Refused while a match runs — unless it is ABANDONED (its room was closed + the HUSH WORD reused, or < 2 of its seats are still in the room) |
| `act` | `{ room, hand, seq, action, amount? }` | your seat | `fold` · `check` · `call` · `bet` / `raise` (TO `amount` — either word, the server picks by the table) · `allin`. `hand` + `seq` = the state the phone acted on: a stale or repeated tap → 409 `stale` with the current `seq` + `hand`, nothing written; an illegal one → 409 `illegal` (the engine's sentence) |
| `pre` | `{ room, hand, pre: 'checkfold'\|'check'\|'callany'\|null }` | your seat | your queued PRE-ACTION, kept on the SERVER: it fires the moment your turn arrives (your phone asleep or not); a new street / hand drops it (HE1's rule). HE10 (Ben's A1): `check` = a TRUE CHECK — refused while you owe chips, DROPPED the moment anyone bets (it never calls). Private: it never moves the public view |
| `show` | `{ room, hand }` | the fold-winner | the optional SHOW, until the next deal |
| `poke` | `{ room }` | anyone in the room | whatever is DUE by the server's own clock (below); nothing due → 5 small reads in parallel (the due, your seat in the room, your kick, the two seqs), no transaction, no write |
| `rebuy` · `back` · `leave` · `sit` | `{ room }` (`leave`: `after?` — HE5's LEAVE AFTER THIS HAND, `false` cancels) | you (CASH) | rebuy at zero · SIT BACK from AWAY / SAT OUT · leave (your stack counts then) · a LATE JOINER takes a free seat (dealt in next hand; a player who left comes back WITH THE CHIPS THEY LEFT WITH — HE10, Ben's A18; at zero a fresh 1,000) |
| `endSession` | `{ room }` | the host (CASH) | between hands: closes at once; mid-hand: closes when the hand ends (a second tap → 409 `ending`). HE10 (A17): the old "void the hand" fallback is gone — a hand always ends by itself, on the clock's timeouts at the latest |

Answers: `{ ok, changed, seq, hand, due, now }` (`id` = the matchId on `start`). Refusals: 400 `bad_*` · 403 `not_in_room` / `kicked` / `not_host` /
`not_open` / `not_seated` · 404 `no_match` · 409 `stale` / `illegal` / `running` / `ending` · 429 `slow_down`. HE10 (A14): what the server's clock made
due runs FIRST on every op — a late tap never beats its own timeout, the time bank is charged from the deadline; a refusal after that catch-up still writes the caught-up table.

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
- `rooms/{CODE}/holdem` = THE PUBLIC VIEW as THE LEAN WIRE's parts (HE3 — below): `publicOf(rec)` = the engine's `publicView` (no deck, no unshown
  card; its `log` dropped) + `players` (seat, buy-ins, rebuys, hands, won, KOs, left), `places`, `ended` / `winner` / `ending` / `ledger` / `biggest`,
  `startAt` + `levelMs` + `level`, `due`, `rep` (the result sent), `ev` = the last **16** events numbered `n` (a phone that missed a write or two still
  animates them; further behind it redraws from the state). Any signed-in reader (the room's players + spectators like every room); written by the
  server only. `seq` moves only when what a phone can see changed. (HE2 wrote it as ONE JSON string `j`, ~5 KB re-sent to every phone a move.)
- `hole/{CODE}/{uid}` = `{ h: hand, c?: [2 cards], pre? }` — A SEAT's PRIVATE VIEW (that uid only, never once kicked; server-written): written only
  when it changes; a new match replaces the room's node whole.

**THE RANDOMNESS:** `crypto.randomInt` (seat order, the first button, every shuffle, the matchId). The tests' seeded rng + clock go in through
`setTestRng` / `setTestClock`, honoured ONLY under the emulators (`FIREBASE_DATABASE_EMULATOR_HOST`) — production can't be steered.

**ONE CALL** = the budget (in memory; the shared `rl/hd_{uid}` count written behind it) → the room checks + the record + the public view loaded in
parallel (both HELD in the SDK's cache by a listener for the call — DFIX3's trick: each transaction's first attempt sees the real value) → ONE
transaction on `hrec/{CODE}` (a refusal writes nothing — unless the clock's catch-up moved the table first; a no-op writes nothing) → ONE multi-path
update: the changed public parts (THE LEAN WIRE — HE3) + the changed private nodes → at the match's end, THE RESULT. Server-Timing: `auth · pre · load · tx;desc=attempts · write · report · total` (+ the region).

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
act ~2–3 ms, a poke that deals ~3–5 ms, a poke with nothing due = 5 small reads in parallel); robot tables ran **6–7 calls a hand** — people, with more checks +
calls, ~**12 a hand** (≈ 10 acts + the deal / run-out pokes). An 8-player TURBO (~21 hands, ~20 min) ≈ **250 calls, ~1 s of CPU**; an 8-player
DEEP (~110 hands, ~2 h) ≈ **1,350 calls, ~5 s of CPU** — against Vercel Hobby's 1 M invocations + 4 h of active CPU a month that is ~4,000
TURBO matches. **Firebase's download** (HE3 — THE LEAN WIRE): a call now downloads the record (~6 KB) to the function (+ two numbers) and only the
CHANGED parts to every phone watching (~1 KB a publish on average, ~0.4–0.6 KB a fold / check / call / raise) ≈ **14 KB a call** at 8 phones (HE2:
≈ 48 KB) → **~3.5 MB a TURBO match, ~19 MB a DEEP one: the Spark plan's 10 GB a month ≈ 2,900 TURBO or ~530 DEEP matches** (HE2: ~650 / ~125). The
record's download to the function is now the biggest piece — the next thing to slim if HOLD'EM ever runs all night every night.

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

## THE LEAN WIRE (HE3 — the dealer writes only what changed)
The public table at `rooms/{CODE}/holdem` is a tree of small PARTS (`js/games/holdem/wire.js` — PURE, the server + every phone share it), each one value
as its own JSON string (a string, so Firebase never drops a null or an empty array the engine reads):
```
rooms/{CODE}/holdem = { seq, at,  m/{key}      every top-level field of the public view (id, mode, due, places, ledger, rep …)
                                  t/{key}      every table field (street, board, bet, turn, deadline, pots, result …)
                                  s/{i}/{f}    one seat's field (i = its index in table.seats) — a call writes stack, bet, total, acted: never the seat
                                  p/{uid}      one player's match numbers        e/{n}   one recent event (the animation feed) }
```
- **ONE multi-path update a call** (`holdem-store.js#publish`): the public parts that changed (`wireDiff`) + `seq` + `at`, every seat's private node that
  changed, and `rooms/{CODE}/meta/activeAt` (at most once a minute — a 2 h DEEP match is never closed by the 1 h idle rule; the rules unchanged: the
  server's admin write). A start writes the node whole. Phones listen to the whole node as before (the room's live path `table`) and rebuild the view
  with `fromWire` — a refresh reads exactly the server's view (tested). The function no longer downloads the public view — only its `seq`.
- **THE HEAL:** two calls racing could land their publishes out of order (a transaction no longer guards the write). Every update carries its `seq`,
  so a late one leaves the published `seq` BEHIND the record's: the next call — ANY op, a poke included (it reads both numbers on its cheap path) —
  sees the gap and writes the whole view again. Proved on the emulators (a stale `seq` + a wrong part → one poke heals it).
- **Measured (bytes a publish, the median; `tests/holdem-wire.test.mjs` + the emulator suite's `# holdem wire` line):** a fold ~440 B · a check ~360 B ·
  a call ~530 B · a raise ~580 B · a new street ~760 B · a hand's end ~1.3 KB · a new hand ~1.9–2.3 KB — every one of them ~4.1–5.7 KB before.
  All publishes averaged **≈ 1.0 KB (was ≈ 4.8 KB)**.
- **start's HE3 options:** `matchId` (the console's — the podium's report finds `results/{CODE}_{matchId}`), `uids` (the console's CONNECTED players —
  each still checked: in the room, not kicked), `at` (the moment the match begins after the walk inside: hand 1 is dealt then, on a poke, and the level
  clock starts then — at most 10 s ahead). A start replaces an unfinished match when the CONSOLE stamped this very start (`meta/go/m` = its matchId)
  and the room's game is no longer that match (END GAME / BACK TO THE ROOM) — still never a running match a second start would steal.

## THE TABLE SCREEN (HE3 — A: portrait, wired to the dealer)
**THE CARTRIDGE** (`js/games/holdem/` — docs/cartridge.md): `meta.js` (TOURNAMENT · CASH, SPEED for a tournament — the sheet's `when` reads only the
player count, so CASH shows it with the hint TOURNAMENT ONLY and ignores it; `estimateMinutes` ~20 / 50 / 100, CASH → the word "OPEN"; MIN 2, no SOLO;
`LOOKS ['night']`; `CHAT_CHIPS` NICE HAND · NO WAY · WELL PLAYED · UNLUCKY; never chat-locked; `ACCENT` the casino gold `#f2c14e`; BANNER "HOLD'EM"; MUSIC
the LATE station) · `index.js` (`start` = the dealer's start; `livePaths` = `{ table: 'holdem' }`; `step` = the console's frame only: once the dealer's
table says `ended` AND `rep` (the result is in) AND (HE10 — A3) 4.5 s have passed since the end → `final` with the places + the podium's rows, so the podium's
report finds the dealer's result; `preload` = the 17 sounds (365 KB) + this phone's deck's court sprite (~199 KB) + the chips (36 KB) + the chosen skin's
art (88–150 KB) ≈ 700–750 KB, about half the 1.5 MB budget) · `logic.js` (the phone's PURE side: the ranks, the podium rows, the level line, WHO POKES, the seats' order) ·
`layout.js` (THE TABLE's numbers) · `view.js` (the screen) · `card-art.js` (the faces) · `rankings.js` (the sheet) · `final.js` (the podium body).
The view renders ONLY from the database: the public table (`fromWire(live.table)`) + its own `hole/{CODE}/{uid}` (its own listener) + `serverNow()`.

**THE LAYOUT** (`layout.js#tableLayout` — the design target 390 × 844; set once per resize by a ResizeObserver, never in a frame loop):
- THE TABLE: a tall STADIUM ≈ x 18–372, y 100–752 (the header row above: 54 pt under the safe top; 58 pt under it for your plate) — a black rail with a
  thin gold line, the real felt (`assets/holdem/<skin>/felt.webp`, a 512² tile of ambientCG's Fabric030, CC0 — lit + recoloured per skin) + a vignette, a cream betting line,
  the quiet print NEON SPEAKEASY under the board. On a shorter phone everything scales with the table's height (`s`, 0.74–1.08); the seat blocks shrink
  with it (`ss` ≤ 1). Desktop: HE7's sideways table (a tall window keeps this one) — see "HE7".
- THE SEATS (anchors at the emblem's centre): the top seat 0.028 of the table's height (on the rail). **HE4 (Ben's preview fixes):** the side rows are
  placed in PX (`layout.js#sideRowsPx` — the seats' blocks are fixed sizes × `ss`, the band scales with the table): from just under the top seat (5, 7:
  the row's bet between the top seat's plate and its bet) or 0.128 / 0.16 of the height (6 / 4) down to just above the pot line (its bet clear of a side
  pot stacked over the pot, its block clear of the board) — evenly: **96 pt between rows at 6–8 players (HE3: 80)**; 2–3 opponents one row at the
  band's middle; heads-up = the top seat alone, bigger (56 pt). The top seat's TAG sits LEFT of its plate (the side rows tuck in under it). Clockwise from your
  left: the left side bottom → top, the top, the right side top → bottom (`logic.js#seatSlots`, `othersInOrder`). Each: the EMBLEM (44 pt) on the
  rail, the dark plate under it (name ≤ 12 letters, stack in gold), the status tag (FOLD = the whole seat dimmed; ALL IN red; AWAY / SAT OUT / OUT /
  LEFT grey), two small backs inward, the bet (a placeholder chip + the amount) further inward, the D button, WHOSE TURN = a gold ring + the draining
  bar under the plate (the time bank turns it red-orange). Watching with 8 at the table: the first seat takes the bottom.
- THE BOARD by the player count (HE4 — `layout.js#BOARD`): heads-up CENTRED between the opponent and your buttons (0.44, up to 64 pt cards — as big as
  the felt allows: ~60 on a 390, 64+ on a 430), 3–4 players RAISED toward the middle (0.54 / 0.55), 5–8 HE3's place (0.6); the POT line just above the
  board wherever it is, the SIDE POTS stacked ABOVE the main pot (each one short — they never reach the side seats' columns); THE ACTION AREA below the board —
  the presets at 0.714, the round buttons at 0.8 (≥ 56 pt, 66 at the design size); YOUR two cards at 0.95 (78 × 108, over the bottom rail — the
  biggest thing on screen), your plate under them (YOU · stack · the hand label in gold — a tap opens THE RANKINGS SHEET).
- At a showdown a seat's label is the hand's CATEGORY (STRAIGHT, TWO PAIR — short, so a full table's labels never run into each other) and a winner's
  "+n" sits where its bet was, in gold; your own label is the full one (STRAIGHT · SEVEN HIGH · WINS 40). Checked: `tests/holdem-phone.test.mjs` (no seat
  blocks overlap at 2–8 players on 375 × 667 … 430 × 932; the board above the presets, the buttons above your cards). HE4: `layout.js#blocks` = every
piece's RECTANGLE (`SEAT_BOX` = the CSS's own offsets — keep the two in step): the test checks no seat block / cards / bet / tag overlaps another seat's,
the board, the pot, a side pot or the presets at 375 / 390 / 402 / 430 + an SE height; the felt print NEON SPEAKEASY a little more visible.

**THE CONTROLS:** your turn — the one-tap PRESETS with their real amounts (MIN · 3× · ALL IN before the flop, ½ POT · POT · ALL IN after — the
engine's) + FOLD · RAISE (BET when nothing's bet) · CALL n / CHECK / ALL IN n; RAISE opens THE SLIDER (min → all in, the amount big, CONFIRM / BACK)
above your cards. Not your turn — the PRE-ACTIONS (HE10, Ben's A1: nothing owed → CHECK / FOLD · CHECK · CALL ANY — CHECK a TRUE check the dealer drops the moment anyone
bets; a bet to face → FOLD · CALL ANY; `pre` → the server; lit while queued, a second tap clears) + "<NAME> IS THINKING…". Your own buttons between turns: SHOW YOUR CARDS (a fold-win, 2.6 s — HE10: inside the dealer's 3 s pause), REBUY 1,000 (CASH at zero — between hands too),
SIT BACK IN / I'M BACK (AWAY · SAT OUT), TAKE A SEAT / SIT BACK DOWN (CASH: a late joiner / a leaver); the host's END SESSION (CASH, top-left, the
second tap confirms). A refused tap (409 stale / illegal, 429) just waits for the redraw; no signal → "NO SIGNAL — TRY AGAIN". THE TAP WATCH: the
controls are rebuilt only when what they say changed (never under a finger).

**THE CLOCK + THE POKE on the phone:** every timer from the table's `deadline` + `serverNow()` (the frame loop moves ONE bar by `transform` + the level
line's seconds by text); WHO POKES = `logic.js#pokeIn`: the HOST 100 ms after `due`, everyone else 2 s after it + their own 0–1 s jitter (from the uid);
a poke that changed nothing while the table still says it's due retries 0.7 s, 1.4 s … (8 at most, then the next update re-arms). A locked phone
never blocks the table (the server's pre-actions + its clock).

**THE CARD FACES** (HE3's — HE6 made them REAL cards: see "THE REAL CARDS") (`card-art.js` — one small SVG per card, crisp at 3×): the FOUR-COLOUR deck (spades black · hearts red · diamonds BLUE · clubs GREEN)
by default, ☰ → Settings → HOLD'EM → CARD COLOURS: FOUR · CLASSIC (`settings.heDeck`, this phone only); the suits are drawn paths (never a font
glyph); a big corner index + a large suit; the casino back (`assets/holdem/cardback-casino.webp`, 240 × 336, from Downloads\grok\holdem — generated
with Grok, credited). **THE RANKINGS SHEET** (`rankings.js` — your hand label, or HOW TO PLAY's link): the ten hands best → worst, a tiny example each.

**THE PODIUM** (HE3 — simple + correct; HE4 makes it premium): the console's frame (`ui/final.js`) with the director's rows (`logic.js#finalRowsOf` —
a TOURNAMENT's places, KOs + hands won; CASH's net as +n / −n with the final chips + bought in) + `final.js#finalScene` (the winner's line + the top 3).

**THE PREVIEW** (no Firebase — `tests/integration/holdem-preview.html`: the dealer's own pure core played to the moment with a seeded deck, sent
through THE LEAN WIRE as a phone reads it, + this phone's own hole node through `fake-firebase.js`'s `window.__fakeDb`):
`?n=2..8&state=waiting|myturn|preflop|flop|turn|river|allin|showdown|foldwin|away|slider|final` (+ `&mode=cash`, `&broke=1`, `&deck=two`,
`&hand=AsKd`, `&seed=x`, `&host=0`, `&st=&sb=` the safe areas). Shots: `node tests/integration/holdem-shots.mjs "<browser>" --sizes 390x844,402x874,430x932`
(16 states through `shots.mjs --page`; E2E_BASE = any local server).

**THE E2E** (`tests/integration/e2e-holdem.mjs` — the emulators + `scripts/serve.mjs --emu`): FAST=1 = 3 phones, a whole TURBO match to its podium
(≈ 35 s); FULL = 8 phones: the real CALL / CHECK buttons to a showdown, a refresh mid-hand (the same cards back), THE LEAK CHECK (a phone draws only
its own cards + the board + the shown hands), a phone LOCKED through its turn (20 s → the 30 s time bank → the auto check / fold, ≈ 52 s), 60 fps at
4× CPU with 8 on the rail (p50 16.7 ms, ~1 ms of work a frame), the host killed mid-hand (a guest's poke moves it on, a new host), then a CASH session:
a REBUY from zero + END SESSION → the ledger Σ 0 (≈ 3.5 min). `CASH_ONLY=1` = the CASH part alone. The game starts there because the suite sets
`window.__nsPreview` (config.js#isPlayable — a game being built starts only on a local emulator page that asks).

## THE MOTION (HE4 — `motion-plan.js` PURE + `motion.js` the player)
**ANIMATIONS COME FROM THE STATE.** The view paints the state FIRST (exactly what a refresh shows); the motion only plays OVER it. Each phone keeps the
number of the last dealer event it showed (`ev[].n` — THE LEAN WIRE's last 16): `freshEvents` hands over only the events after it, only when the whole run
is there (no gap) and the newest is ≤ 2.5 s old by the server's clock (`MAX_AGE_MS`) — a refresh / a rejoin / a phone that slept (a hidden page) / a gap
jumps straight to the state, never a replay; the first look (a mount) animates nothing. `schedule(list, { bets, heroId, k })` turns the run into ONE
timeline (ms from now), `motion.js#run` plays it: every move transform + opacity through the Web Animations API (the individual `translate` / `scale`
properties so a piece's own transform stays), ghosts in `.he-fx` (over the felt, under your buttons + your cards, `pointer-events: none`); a piece the
state already shows but the motion hasn't reached waits invisible on its first keyframe (`fill: backwards`). The number roll-ups (the stacks, the pot)
are HOLDS the view's ONE frame loop lets go of (`motion.tick` — text only). Nothing waits on the motion: the dealer's pauses run on the server.

| the dealer's event(s) | the motion (`BEAT` — every one ≤ ~0.5 s) |
| --- | --- |
| `dealt` | the backs fly from the button's D to each dealt seat, round by round (110 ms a card — HE5 — 260 ms a flight); YOUR two fly in, then flip face up (a 3D flip, rotateY — the back on the reverse); your hand's name waits for the flip; HEADS UP (the table down to two: a word in the felt's middle) |
| `posted` · `called` · `bet` · `raised` · `allin` | a chip from the seat to its bet spot (the amount appears as it lands; several 110 ms apart); ALL IN = a stamp on the seat's tag (yours: the ALL IN on your plate) |
| `street` (a new street) | every bet in front SWEEPS into the pot together (the POT number rolls up — the pot line = the chips COLLECTED), then the new cards flip (the flop 90 ms apart, a tiny settle); an all-in run-out: each street as the dealer reveals it |
| `folded` | the seat's backs slide toward the middle + fade; the seat dims |
| `shown` | the hand turns up at its seat (a fold-win's SHOW: your own two flip once) |
| `pot` (one per pot) | after the hands are up: ONE AT A TIME — the side pots smallest first, the main pot last, 900 ms apart: the pot's line ("SIDE POT · 1,320 → BO" · "MAIN POT · …" · "POT · …" · a split "→ ALEX & BO"), its winners' five lifted, chips pot → winner(s), each winner's stack rolling up; the whole showdown < the dealer's 6 s pause (a fold-win < 3 s) |
| `returned` | the uncalled chip back to its seat |
| `level` | BLINDS UP · 25/50 — a short gold word under the level line |
| `out` | the seat: OUT, then it fades (`.is-busted` — a delayed transition: a refresh paints it faded); YOUR bust: THE KO CARD (below) |

Your turn: the action row rises in ONCE a turn (a new hand / street / bet to face — never rebuilt under a finger), your plate's glow; the timer bar
drains (the time bank red-orange). THE RE-SPREAD: a busted seat is drawn to its hand's end (`drawnSeats`), then at the next deal the seats that stay
glide to their new places (+ the board + the pot with them). prefers-reduced-motion = the states at once (only the words: BLINDS UP, HEADS UP, the KO card).
Measured: 60 fps at 4× CPU with 8 seats during the busiest moment (the side-pot run-out + three awards): p50 16.7 ms (e2e-holdem.mjs FULL).

## THE SHOWDOWN (HE4)
**SHOWN HANDS READ** (Ben's ADD-ON, the split-pot shot): a shown hand = two 30 pt cards SIDE BY SIDE, no overlap — both corner indexes whole on an iPhone
unzoomed — raised clear of the plate (`SEAT_BOX.side.cards` [22, −21, 83, 22]; the top seat's plate ≤ 100 pt so the first side row's cards tuck in beside it).
**THE WINNINGS** = a gold "+n" INSIDE the winner's plate beside the stack (never under or behind cards, at every player count — it pops in with the
winner's first pot). **THE AWARD BOX**: at a hand's end the winning hand in gold + the pot's line sit UNDER the board (`.he-awardbox` — the band the buttons
leave free then), never across the bottom row's seats; the between-hands buttons (SHOW YOUR CARDS, REBUY) drop to the buttons' row, NEXT HAND… + the felt
print give way; `layout.js#blocks().award` is checked against every seat, the buttons + your cards. A seat that won ANY pot never dims. The winning board
cards lift 3 pt. THE FELT PRINT is Chakra Petch (Orbitron's A read as an R: "SPEAKERSY").
Shown hands face up at their seats; the WINNING FIVE (on the board + in the winner's hand — `rank.js#bestFive`) lift with a gold edge, the rest of the
board dims, the losing hands dim; THE AWARD BOX then reads the main pot's line + the winning hand in gold ("STRAIGHT · SEVEN HIGH"; a tie "SPLIT POT") —
state-driven (`paintShowdown`), so a refresh lands on it; during the awards each pot lifts ITS winners' five. Your own result in your plate (HE3). The
next hand starts on the dealer's pause — nothing waits on an animation.

## KO + SPECTATING (HE4)
YOUR bust (a tournament — a FRESH `out` for you): THE KO CARD over the middle of the table (never the whole table): KNOCKED OUT · "5TH OF 8" · "BO TOOK
YOUR LAST CHIPS" · the hands you played; it shrinks toward your plate after ~4 s or a tap (pointerdown + pointerup). Then SPECTATING: the table plays on
live, your area says SPECTATING (from the next deal — the busted hand's cards stay until then), your plate "OUT · 5TH", the chat open. An opponent's bust:
its seat OUT, fades, gone at the next deal (the re-spread).

## CASH: LEAVE + THE LEDGER (HE4)
LEAVE TABLE: a small button right of your cards — (HE5: ALWAYS there in CASH — in a hand it's LEAVE AFTER THIS HAND, see "HE5") — between hands it opens a confirm (THE SHEET: "LEAVE THE
TABLE? Your 2,140 chips count in the ledger." · LEAVE THE TABLE · STAY) → the dealer's `leave` (your stack counts then) → SPECTATING (SIT BACK DOWN
stays). END SESSION (the host) → THE LEDGER = the podium body in CASH (`final.js`): one SLIM CARD a player who played (the console's `leaderboard()` →
`ui/strip-board.js` — never a second strip system), BOUGHT IN · FINAL under the card, the NET at its right end (HE5: + green, − red, 0 white — the shared --good / --bad), sorted by
net; the foot: hands played · the biggest pot (who, how much). Chips only. All 8 rows + the console's button fit at 390 × 844 (the strips 50 pt there).

## THE END SCREEN (HE4 — the tournament's `finalScene` body)
Inside the console's frame (`ui/final.js` — its BACK TO THE ROOM, XP box + card reveal; its WINNER line, its confetti + its full-screen flash OFF for
HOLD'EM: "premium but calm"): THE WINNER (their emblem, the name big in the casino gold, WINS HOLD'EM — a short gold reveal), then EVERY PLACE as slim
cards (1st … last; KOs at the right end, hands won · played under) — the body says `podium = 'all'` so the frame draws no second list (docs/cartridge.md)
— then two AWARD CHIPS: BIGGEST POT (who + how much) · MOST KOs (who + n) from the server's record (`logic.js#finalSummaryOf` → the director stores
`game.sum` beside the rows; shown only — no new cards or achievements).

## THE PREVIEW (HE4 additions — tests/integration/holdem-preview.html)
`&state=headsup` (the board centred) · `raised&n=3|4` · `split` (a board straight — every hand still in splits) · `sidepots` (3 short stacks + a caller,
a rigged deal: the side pots awarded one at a time to three different players, one busts) · `levelup` (BLINDS UP at the next deal) · `ko` (you bust →
the KO card) · `spectate` (after it) · `out` (an opponent busts: OUT, the fade, the re-spread) · `leave` (CASH's confirm) · `ledger` · `final` —
`sidepots` / `levelup` / `ko` / `out` play their last step LIVE ~0.6 s after the page shows (the real clock: the real motion). **`&play=1` = THE MOTION
DEMO**: a scripted table on a loop through the real dealer core + THE LEAN WIRE (a showdown with bets every street, an all in with side pots + busts, a
fold-win; the blinds up every `&lv` s (40); down to two → HEADS UP; a winner → a new match; `&ko=1` = you're a short stack). HE4 ADD-ON (Ben): every fake
player wears a REAL public face (an approved card each — two legendaries, ZEBRA, GLITTER BOMB, VELVET ROOM, MARBLE … — its emblem + tube + name glow +
level, served as `profiles/{pid}` through `fake-firebase.js`; `&labmarks=` added when missing), so the end screen + the ledger show the real strips.
Shots: `node tests/integration/holdem-shots.mjs "<browser>" --only he4` (a wait per staged state).

## HE5 — BEN'S FIXES + THE SOUNDS + THE REAL CHIPS + THE SKINS (Nov 10 2026 — the decisions: docs/games/plan.md "HE5")

### BEN'S FIXES (Group 0)
- **SPECTATING** is a straight, level plate (the fan's tilt came from `.he-hand > :first-child` — the label now opts out), full strength (never the
  folded dim), no dashed box.
- **THE ACTION AREA is built UP from your cards** (`layout.js#ACT`): the round buttons (56 pt, 30 pt apart × s — `BTN_GAP`) 4 pt above your cards →
  **≥ 12 pt of air** → the presets (44 pt) → **YOUR BET's stack on the felt above them** (`L.myBet` — never on a button; the felt print gives way
  while it shows). The 5–8 player board rises only as much as that needs (390: 2 pt; the side rows 95 pt apart — HE4: 96). A short phone with
  8 seats (375 × 812, the SE height) can't fit the bet row without crushing the rows below a seat's height (`ROW_MIN` 94.5 × ss): there your bet
  sits LEFT of your cards, under FOLD (`myBet.above: false`); the SE height with 8 seats also takes the seats a hair smaller (ss 0.82 → 0.80).
  k = 6's first row 0.128 → 0.11 (still on the rail's curve). `tests/holdem-phone.test.mjs` checks every size + count.
- **EVERY SIDE POT on ONE line** just above the pot ("SIDE 1,320 · 480", more than fit → "3 SIDE POTS · 2,140" — `view.js#sideLine`):
  `layout.js#potSideTop` is the line's top and a bottom-row bet ends 3 pt above it — no side pot can touch a bet chip (the SE overlap is gone).
- **THE LEDGER's net**: + GREEN · − RED · 0 white on the shared `--good` + a NEW `--bad` (css/base.css — the colour-blind set swaps both:
  blue / orange); the signs stay.
- **LEAVE IS ALWAYS THERE (CASH)** — the button reads LEAVE TABLE (not in a running hand: a confirm, then at once — as HE4) · LEAVE AFTER THIS HAND
  (you're IN the hand: the dealer QUEUES it — `rec.lv[uid] = hand`, you play the hand out) · LEAVING AFTER THIS HAND · CANCEL (a second tap =
  `{ after: false }`). The dealer (`holdem-dealer.js#advance`) lets a queued leaver go at the next deal's moment (the showdown stays on screen till
  then) — or at once when no next hand can be dealt; `dueOf` stays armed for it. The public view says it (`players[uid].after`). `leave
  { after: true | false }` on the same op (a TOURNAMENT refuses it); `tests/holdem-dealer.test.mjs`. No rules change.

### THE SOUNDS (Group 1 — `sfx.js` the player, `sound-plan.js` PURE)
The approved set in `audio/holdem/` (17 MP3s, **356 KB** — copied unchanged: they are 192 kbps mono already, a re-encode would only lose
quality): the NEW real recordings (Downloads\grok\holdem\sfx2 — shuffle, deal, flip, fold, check, chip-bet, chip-raise, chip-stack, all-in,
pot-win; deal-b / chip-bet-b / all-in-b stay on Ben's PC) + the KEPT stings (sfx — your-turn, timer-tick, showdown, hand-win, knockout,
blinds-up, champion). **NO AMBIENT BEDS** (Ben cancelled them — none shipped, none referenced).

**THE ENGINE** (the site's pattern — docs/audio.md "HOLD'EM's SOUNDS"): the bytes fetched in the cartridge's `preload()`, decoded ONCE at the
unlock (the console's unlock-on-tap) or at a mount after it, each cue an AudioBufferSourceNode scheduled on the AUDIO clock → its gain →
HOLD'EM's soft limiter → the console's SFX bus (the slider, ☰ SOUND EFFECTS, THE ONE MUTE). Locked / muted / missing = silent, nothing throws.

**THE GAIN TABLE** (Ben's balance — `sfx.js#GAIN`): the new set **2.2** (+7 dB) · the kept stings **1.0** · the deals **1.1** (≈ −6 dB from the new
set) with **±4 % rate + 0.85–1.0 volume** each. **THE LIMITER**: threshold −6 dB, knee 4, ratio 8, attack 2 ms, release 180 ms, then **TRIM 0.76**
(Web Audio's compressor adds its own make-up gain — the trim takes it out, so a sound under the threshold plays at exactly its level).
MEASURED (`node tests/integration/he-sfx-measure.mjs "<browser>"`): every file's lead-in ≤ 6 ms (the browsers strip the MP3 encoder delay —
`OFFSET` stays empty; a new file with an audible lead-in gets its row), a kept sting alone = 1.00 of its level, **THE BUSIEST MOMENT** (your
turn + a raise + an all in + a pot win + a hand win + a bet + the showdown inside 150 ms) **2.43 → 0.87 — no clip**.

**THE EVENT MAP** (`sound-plan.js#soundPlan` — from the MOTION's own timeline: the same fresh events, so a sound lands with its animation and
NEVER replays after a refresh / a rejoin / a sleep):
| the dealer's event(s) | the sound |
| --- | --- |
| a new hand (`dealt`) | shuffle, then **deal** per card — a card every **110 ms** after a 450 ms shuffle lead (the motion's `BEAT.dealLead` / `dealGap` — HE4 dealt every 45 ms; each deal is its own sound, never smeared) |
| your two flip · a board card · a fold-win's SHOW | flip |
| `folded` · `checked` | fold · check |
| `posted` (a blind, 0.75 ×) · `called` · `bet` | chip-bet |
| `raised` · `allin` | chip-raise · all-in |
| each `pot` (side pots too) | pot-win (+ **hand-win** once a run when YOU win one) |
| the showdown's reveal (the first `shown`) | showdown (the hands turn up under it — no flip clatter) |
| `out` (anyone) · `level` · YOUR `rebuy` | knockout · blinds-up · chip-stack |
| (the view) YOUR turn begins · the last 5 s of YOUR clock (the shot clock + your bank still to come) · the tournament's podium | your-turn · timer-tick a second (`tickSecond`) · **champion** (`OWN_VICTORY_SOUND` — the console's sting skipped; never on a later refresh) |

**THE PREVIEW**: `holdem-preview.html?play=1` plays WITH THE SOUNDS after **TAP FOR SOUND** (the PRISM pattern; `&mute=1` silent; a test browser
gets none unless `&sound=1`). `node tests/integration/he-sound-demo.mjs "<browser>" [s]` = the demo on a REAL audio context: every planned cue
started (57 / 57), the deals ≥ 110 ms apart. The test hook: `__holdem.sounds()` (started) · `__holdem.planned()` (asked for — the E2E checks the
plan silently: known sounds, the table's gains, the spacing, champion once, nothing replayed after a refresh). `tests/holdem-sound.test.mjs`.
**CREDITS**: ☰ → CREDITS → HOLD'EM SOUNDS (the three CC BY lines verbatim from sfx2\credits.txt + the CC0 sources + the stings).

### THE CHIPS (Group 2 — `chips.js` PURE, `chip-art.js` the drawing)
Grok's clay chips (`assets/holdem/chips/` — a TOP 128² + a SIDE 128 × 24 per colour, WebP, **36 KB** for 12). **THE ARITHMETIC** (`chips.js#chipStacks`):
an amount → the fewest chips in the six colours (**5 red · 25 green · 100 black · 500 purple · 1K yellow · 5K orange** — a canonical set, so the
biggest first IS the fewest), the biggest value left; a value past `maxPer` splits into more stacks of it. A bet ≤ 3 stacks of ≤ 6; **a SEAT's bet
≤ 2** (the rail's room: the two bottom rows' bets nearly meet in the middle — the amount label always whole); the pot ≤ 3 of ≤ 8 (5–8 players: 2 —
the pot's width between the side rows). Seats 13 pt · yours 15 pt · the pot 13 pt. The AMOUNT always beside the stacks (the exact number).
**THE DRAWING** (3/4 view, once per stack, cached ≤ 160; a bet's canvas redrawn only when its amount changes — never per frame): the side band
(the source's x 4–508, y 28–68 — spaced by the BAND, never the canvas) sampled by ANGLE across each chip (a cylinder — the spots compress at the
silhouette), following the ellipse's lower curve. **THE THREE FIXES**: (1) a soft CONTACT SHADOW + a dark OUTLINE round the silhouette + a light
RIM on the top edge — the green reads on green felt; (2) the cylinder LIGHT across the edge + a SHEEN on the top, from ONE light direction (the
skin's — `setLight`); (3) each chip its own ROTATION (a full-circumference band = the visible half + its mirror, sampled at a random offset) +
0.5–1 pt of sideways JITTER (seeded per stack: a redraw never shimmers). **THE MOTION** flies the real stacks (`motion.js` — the chip ghost = the
amount's stacks: a bet in, the sweep, back, each winner's share of a pot). Close-ups: `tests/integration/holdem-chips.html` (every colour at 13 /
15 pt on the felt, bets, a big pot, side-pot shares). `tests/holdem-chips.test.mjs`.

### THE SKINS (Group 3 — `skins.js` PURE data; HE6 adds two — see "HE6" below)
**A SKIN = ONE DEFINITION in `skins.js#SKINS` + its art in `assets/holdem/<id>/` + its living touches' CSS** (`.he[data-skin='<id>'] .he-live-<k>`). The
view consumes it through CSS variables (`skinVars`) + a few settings: the light direction (the chips), the card back, the backdrop, the living
touches' list (the view makes one `.he-live-<k>` per entry) — NO skin-specific code path. A per-PHONE choice: `settings.heSkin` (the console's
settings storage; default `casino`), applied LIVE (even mid-hand — `onSettings` → `applySkin`); **only the chosen skin's art loads** (its
variables + `skinAssets` → the preload name only its files). The shape:
```
{ id, name, line,
  felt: { img, tile, tint }, rail: { img, tile, base, trim, trimHi, trimLo },
  light: { dir: { x, y }, color: 'r, g, b', strength, pool, vignette },      ← ONE light: the pool on the felt + the chips' shading
  print: { color, hi }, accent: { main, hi, ink },
  plate: { bg, rim, rimHi }, button: { glass, glassHi, rim, rimHi, rimLo },
  back, backdrop: { portrait, square (HE7's sideways), dim }, living: ['neon', 'haze', 'slots'] }
```
**A new skin** (HE6 did two — the full recipe: "ADDING A 4TH SKIN" below): bake its art (`scripts/build-holdem-skin.py` — add its rows: the felt + rail lit by their normal maps, the backdrop at phone
size), add its entry, add its living touches' CSS, + the picker (☰ → Settings → HOLD'EM, writing `settings.heSkin`). `tests/holdem-skins.test.mjs`
checks every skin's shape, its files, its touches' CSS and that only its own files are named.

### NEON CASINO (a real high-roller table at night)
**THE LAYERS** (back → front): **THE BACKDROP** (`.he-bd` — `casino/backdrop.webp` 645 × 1398, **12 KB**, dimmed 0.18; its accents land exactly where the
layout leaves it visible: the ceiling's neon strips + the slots up top, the pink / cyan floor glow under your plate) + **THE LIVING TOUCHES** (the neon
strips breathe + a rare flicker · the slots' glow pulses in the top corners · a slow haze drifts — opacity / transform only) · **THE RAIL** (padded
black leather — `casino/rail.webp`, **1.6 KB**, its grain lit by its normal map — the roll's light from above, a sheen line round the top curve, a
dark crease where it tucks under) · **THE TRIM** (a thin gold line where the rail meets the felt: a dark edge, the gold, a light edge, a crease) ·
**THE FELT** (`casino/felt.webp` 512², **52 KB** — Fabric030 lit by its own normal map: the weave reads as real fabric at zero per-frame cost) under
**THE LIGHT** (a warm overhead pool on the centre fading to the rail + a vignette — static gradients, painted once) · the printed NEON SPEAKEASY ·
the pieces: black glass + gold rims on every button, preset, plate + toggle (a lit top, the rim catching the light above), FOLD's red rim, CALL's
gold, YOUR plate's gold glow. The card back: `cardback-casino.webp` (HE3's — every opponent's cards + the deal).
**THE QUALITY TIERS** (kit/tiers.js — from the frame pacing; `data-tier` on `.he`): **2** everything · **1** the living touches off (the FIRST thing to go)
· **0** the light layer plain too (the felt's texture alone). The cards + the text are SVG / DOM — crisp at 3× at every tier. prefers-reduced-motion:
the living touches hold still. NEON CASINO's art in all: **~82 KB** (felt 52 + backdrop 12 + rail 1.6 + the back 15).

## HE6 — REAL CARDS + COZY CABIN + CYBERPUNK APARTMENT + THE PICKER (Nov 10 2026 — the decisions: docs/games/plan.md "HE6")

### THE REAL CARDS (Group 0 — `card-art.js` + the GENERATED `card-data.js`)
Ben: the HE3 faces read as "digital" (one big index + one big suit). Now they are REAL playing cards, still readable on a phone:
- **THE ART** — Byron Knoll's **"Vector Playing Cards"**, PUBLIC DOMAIN in the author's own words (his blog, Mar 2011: "I am releasing the images into
  the public domain"; the Google Code record: "attribution is appreciated but not required" — credited in ☰ → CREDITS anyway). Downloaded from the GitHub
  mirror (github.com/notpeter/Vector-Playing-Cards); the sources live on Ben's PC in `Downloads\neon\holdem\cards-src\` (+ its `SOURCE.txt`), never
  shipped at full size (the court SVGs are 0.4–1.1 MB each). **His AS.svg is NOT used** — he says its art is traced from another artist's (Suzanne Tyson)
  work, licence unknown — so the ace of spades is OUR OWN (a big spade in a fine engraved ring, drawn in code).
- **WHAT SHIPS** (`node scripts/build-holdem-cards.mjs` — Chromium rasterises, `scripts/holdem-card-glyphs.py` extracts the glyphs):
  - his four **PIP shapes** (from his 2-of-each-suit) → `card-data.js#PIP` (path + box + the aspect his cards draw them at), laid out in the CLASSIC pip
    layouts in code (`card-art.js#LAYOUT` — the lower half's pips upside down);
  - his twelve **COURT FIGURES** cropped to their frame (the frame line drawn in code — crisp) → ONE SPRITE PER DECK, `assets/holdem/cards/courts-four.webp`
    + `courts-two.webp` (504 × 1088, rows s · h · d · c, columns J Q K, each tile 168 × 272 = 3× a hero card's frame; **~195 KB each — only this phone's
    deck loads**, `index.js#preload` → `courtUrl(settings.heDeck)`). THE FOUR-COLOUR RECOLOUR: diamonds — the figure's red → blue (only the red: the
    blue is the faces' line-work too, a swap turned the faces red); clubs — red → green; the big pips in the suit's ink (found by his pip path inside
    each court SVG); the CLASSIC sprite = his robes + our ink on the pips;
  - **THE CORNER INDEX** in a classic serif — **Libre Baskerville** (SIL OFL 1.1) at weight 700, its glyphs as PATHS (`card-data.js#GLYPH`, cap height
    = 100): never a font the phone loads; the 10 condensed (0.8), J + Q a touch smaller (their descenders).
- **THREE SIZES** (`faceSvg(code, deck, size)` — a 70 × 98 box, the view sizes it):
  | size | where | what |
  | --- | --- | --- |
  | `full` | YOUR two cards | the index in BOTH corners (top-left + its twin rotated bottom-right), every pip, the court figure in its frame, our ace of spades |
  | `board` | the board | a BIG index in two corners + one centre suit; a court's figure small between the indexes |
  | `mini` | an opponent's shown hand · the rankings sheet | a big index + its suit, a big suit low-right |
- **THE CARD STOCK** = the view's, not the face's (`.he-card` in css/holdem.css): the skin's paper colour (`skins.js#stock` — CASINO crisp white `#fbfaf6`,
  CABIN warm ivory `#f7efde`, APARTMENT cool bright white `#fcfdff`) with a faint grain MULTIPLIED over it (`cards/stock.webp`, 128² near-white noise,
  0.6 KB — made by the same build), rounded like the face's hairline, a HAIR OF EDGE under it (the card's thickness) + a soft shadow. The INK never
  changes with the skin. The deal + the flip use the new faces as they are (the motion flips the real elements).
- Close-ups: `tests/integration/holdem-cards.html` (`&deck=two`, `&skin=`, `&all=1` = all 52 in every size). `tests/holdem-cards.test.mjs`.

### THE SKINS' NEW FIELDS (Group 1 — still ONE data shape, still no skin code path)
HE6 turned every look that was a fixed casino colour into data → CSS variables (`skins.js#skinVars`; `tests/holdem-skins.test.mjs` checks the CSS reads
every variable): `accent.lo` + `accent.rgb` (EVERY accent glow — the turn ring, your plate, the winners, the toasts, the end screen — reads
`rgba(var(--he-gold-rgb), a)`; only the rankings sheet, a sheet outside the table, keeps its gold), `light.at` (where the pool sits), `print.glow`,
`betline { color, glow }`, `rail.led` (a glow along the trim) + `rail.sheen` (the roll's highlight colour), `button.glassLo` + `button.glow` +
`button.tex` (a texture under the plates + buttons — the cabin's wood), `button.call` + `button.fold` (THE MAIN button + FOLD as data), `stock`,
`backdrop.pos` + `backdrop.size`, `thumb` (THE PICKER's mini table). NEON CASINO diffed after the refactor: only the trim's light edge + the plates'
bottom rim moved (by a hair).

### COZY CABIN (a mountain cabin card night by the fire)
**THE LAYERS**: **THE BACKDROP** (`cabin/backdrop.webp` 860 × 1864, **51 KB** — the portrait original lifted ×1.18, its **WINDOW MOVED LEFT** + 0.86 smaller so
its right edge sits at ~334 pt of a 390 phone, clear of the music button (342 pt) and of the level line; the logs it leaves filled from the same rows further
left — `build-holdem-skin.py#move_window`), dim 0.06 · **THE LIVING TOUCHES**: the FIRE's glow flickers low-left (stepped opacity + a soft inner pulse), SNOW
drifts past the window (two dot layers in the glass's box, transform only), the LAMP's warmth breathes top-left · **THE RAIL**: polished WALNUT
(Poly Haven's american_walnut_veneer, CC0, lit by its normal map from the fire's side — `cabin/rail.webp` **2.2 KB**) with the roll's warm sheen · **THE
TRIM**: a thin BRASS line · **THE FELT**: Fabric030 warmed to FOREST green (`cabin/felt.webp` **39 KB**) under a warm ORANGE firelight pool from the
lower left (`light.at` 30 % 66 %) + a softer vignette (0.52); the print in CREAM · **THE PIECES**: DARK-WOOD plates + buttons (`cabin/wood.webp` **22 KB** — the
same walnut, its even grain stretched ×4.5 so it reads at plate size) under a warm glass with BRASS rims, a brass / amber CALL, FOLD a muted red;
AMBER accent `#f2a541` (your plate's glow, the winners, the clock) · the PLAID card back (`cardback-cabin.webp` **4.8 KB**) · warm ivory stock.

### CYBERPUNK APARTMENT (a high-rise card table above a rainy neon city)
**THE LAYERS**: **THE BACKDROP** (`apartment/backdrop.webp` 860 × 1864, **77 KB** — the square original CENTRE-CROPPED for portrait: its rainy skyline window
behind the table's top; the room's cyan + pink neon PILLARS, which a centre crop cuts, pasted back at the screen's edges with soft inner edges —
`build-holdem-skin.py#pillars` — so they glow in the slivers beside the table, their reflections on the floor), dim 0.1 · **THE LIVING TOUCHES**: RAIN
streaks run down the glass (two angled streak layers, masked into drops), a NEON SIGN in the city flickers, a slow LIGHT SWEEP crosses the window ·
**THE RAIL**: brushed dark METAL (ambientCG Metal009, CC0, lit by its normal map — `apartment/rail.webp` **1.7 KB**) · **THE TRIM**: a thin CYAN LED edge
glowing both ways where the rail meets the felt (`rail.led`) · **THE FELT**: Fabric030 in near-black TEAL (`apartment/felt.webp` **40 KB** — q 80 + a stronger
relief: at q 66 the weave compressed away) under a cool light pool + a strong vignette (0.82); the print GLOWING cyan; a thin PINK NEON betting line round
the inner felt (its glow inside + out) · **THE PIECES**: navy-glass plates, every button dark glass with a glowing PINK rim (`button.glow`), CALL the brightest
rim + its label cyan, FOLD a red-pink; CYAN accent `#3bd9ff` · the HOLOGRAPHIC card back (`cardback-apartment.webp` **14 KB**) · cool white stock.

### THE PICKER (Group 3 — `picker.js`)
☰ → Settings → HOLD'EM → **TABLE**: three small LIVE thumbnails — a mini table in each skin drawn in CSS from the skin's OWN data (the room's mood `thumb.room`,
the rail + trim + LED, the felt + where its light sits, the betting line, the stock, the back's colour `thumb.back`, YOUR plate in the accent) — **so
nothing of a skin you haven't chosen downloads** (no thumbnail images); the chosen one outlined + glowing in its accent. A tap = `settings.heSkin` (this
phone only, default NEON CASINO) → `view.js#applySkin` on the settings' change: the variables, `data-skin`, the living touches, the chips' light (their
cache cleared) — LIVE, even mid-hand during the motion (the backs re-key by their URL; no reload). `ui/settings-panel.js` loads the picker LAZILY (the
boot graph never names a game); the picker injects its own small CSS (`hep-`) because the sheet can open where css/holdem.css isn't loaded. Preloading
the other two skins on Wi-Fi + idle (optional in the plan) is left out: a switch loads ~120–140 KB on demand. The preview: `&settings=1`.

### ADDING A 4TH SKIN
1. Its art: a row in `scripts/build-holdem-skin.py#SKINS` (a function: `lit(...)` the felt + the rail by their normal maps from the skin's light, the
   `backdrop(...)` at 860 × 1864 with any composition `edit`, an optional `wood.webp`-style texture, `cardback(...)` 240 × 336) → `assets/holdem/<id>/`.
2. Its data: ONE entry in `skins.js#SKINS` with EVERY field the casino has (the test compares the nested shape) — `light.dir` matches the bake's light.
3. Its living touches: `.he[data-skin='<id>'] .he-live-<k>` rules in css/holdem.css for each name in `living` (opacity / transform only; the tiers hide
   `.he-live` at tier 1; reduced motion holds them still).
4. `tests/holdem-skins.test.mjs` (≤ 200 KB of art, only its own files named, every variable read) + `holdem-shots.mjs --skin <id>` at 390 / 402 / 430 + 1440.
   THE PICKER shows it by itself (a 4th thumbnail — the grid may want 2 × 2 then).

### THE NUMBERS (HE6)
New art: the cards **400 KB** in the repo (courts-four 195 + courts-two 195 + stock 0.6 — a phone loads ONE sprite), COZY CABIN **122 KB** (backdrop 51 +
felt 39 + wood 22 + rail 2.2 + back 4.8), CYBERPUNK APARTMENT **133 KB** (backdrop 77 + felt 40 + rail 1.7 + back 14), the casino backdrop re-exported
12 → **28 KB** (860 × 1864: HE5's 645-wide export blurred the slots' lights into blocks). Per phone: the chosen skin (82–133 KB) + one deck sprite (195 KB).

## HE7 — THE SIDEWAYS VIEW + DESKTOP (Nov 11 2026 — the decisions: docs/games/plan.md "HE7")
Ben's exception for HOLD'EM: **wider than tall → the SIDEWAYS table**; a desktop / any wide window uses it too (scaled). The portrait table
(`layout.js`, its CSS, its DOM) is untouched — proved pixel for pixel (`holdem-pixdiff.mjs`, below). Same game, same pieces; no rules, server or
data change; still 8 functions, no rules change, `playable: false`.

### THE SIDEWAYS LAYOUT (`layout-wide.js` — PURE, the same shape as `tableLayout` + `wide: true`)
- **THE TABLE**: a WIDE STADIUM (rounded ends left / right) filling the screen LEFT of THE COLUMN — its emblems on the rail stay inside the safe
  areas (the notch side + its twin), the table's top ~4 pt under the screen's top, its bottom rail under your cards. 844×390: ≈ 503 × 299.
- **THE SEATS**: YOU at the bottom centre; the others **FULLY EVENLY SPACED BY ARC LENGTH** round the rail's middle line (`onStadium(…, i / N)`,
  clockwise on screen — the bottom-left first; heads-up = straight across, top-centre). Every seat is ONE block (`wideSeatBox`): the emblem (44 pt
  · heads-up 56) on the rail, the plate under it (`pl`: centred · `l` its left edge with the emblem's · `r` its right — a seat at an END keeps it
  inward, a seat LEVEL WITH YOUR CARDS keeps it on its OUTER side so the felt by your cards is your bet's), the tag under the plate (`tl` — its
  own alignment: a long "THREE OF A KIND" centres when the outer side runs off the screen), the cards beside the emblem (`cs` +1 right · −1 left · 0
  above — toward the middle; outward for a seat level with your cards), the bet toward the board's centre on the nearest clear spot along that line
  (then a little either side, up to ±1.7 rad), the D button on the emblem's edge away from the cards. The first choice that's on screen, off the
  column + the corner buttons + your cards, clear of the seats already placed. A STRAIGHT-ACROSS seat's bet sits beside its plate when there's room
  (the middle keeps the height — heads-up's big board), else under its tag.
- **THE MIDDLE**: the side-pot line (3+ players) + the pot + the board, the BIGGEST board that fits between the seats and your hand's name (WBOARD:
  heads-up 66 · 3–4 players 60 · 5–8 56 pt; the stack centred in the longest free band); **your hand's name ABOVE your cards** (a gold line on the
  felt — still THE RANKINGS SHEET's button; the felt print gives way to it); YOUR two cards bottom-centre over the rail (64 × 89 at a 390-tall phone),
  your plate under them (YOU · stack · ALL IN / OUT); **your bet** beside your cards, its chips over its amount (≤ 2 stacks, a 50 × 42 column).
- **THE COLUMN** (the right, under the right thumb): the music button (the console's) at its top, the LEVEL LINE under it (two balanced lines when
  long), BLINDS UP + END SESSION under that; low: LEAVE (CASH) · the status ("BO IS THINKING…") · YOUR CLOCK (a bar over the presets) · the
  PRESETS (3 × 56 pt) above FOLD / RAISE / CALL (≥ 50 pt rounds, ≥ 12 pt between the rows); the SLIDER, the two PRE-ACTIONS (stacked), the
  between-hands buttons (SHOW · REBUY · SIT BACK IN · I'M BACK — above the pre-actions when both show) all in the same place. Nothing over the board,
  your cards or a seat.
- **THE HAND'S END**: the award box ON THE POT'S SPOT above the board (heads-up one row, else two compact rows), as wide as the seats there allow;
  a line too long for it shrinks to fit (never under the 10 pt minimum — measured only when it changes). THE KO CARD centred on the table.
- **THE END SCREEN + THE LEDGER**: the slim cards in TWO columns (1st–4th · 5th–8th) when the screen gives each a phone strip's width
  (`min-width: 820px`) + a tighter winner line → all 8 places in view on an 844×390 (the award chips + the console's buttons below scroll); the SE
  on its side keeps ONE column and scrolls. The frame centred in a wide window.
- **THE SEATS' SCALE** steps down (0.9·s → never below 0.78) only while something misfits or the board's cards are under 50 pt (`misfits` = 0 on
  every phone). **The numbers** (board · your cards, pt): 844×390 50–66 · 63.8; 844×340 (Safari's bars) 50–64 · 58.8; 932×430 56–66 · 70.7;
  874×402 54.5–66 · 65.9; **the SE** 667×375 46–59 · 64.9 and 667×320 45–60 · 55.4 — the ONE COMPROMISE: the SE at 7–8 players gets a 45–49 pt
  board (its seats at 0.78–0.79); every iPhone since the X ≥ 50.
- `tests/holdem-wide.test.mjs`: those six sizes × 2–8 players — no piece overlaps another (every seat's block, cards, bet, tag; the board, the pot,
  the side line, your bet, cards, plate + name, the column, the corner buttons, the award box), the even spacing (measured along the track), the
  sizes, THE STAGE, the motion's spots.

### ROTATE ANY TIME
The view picks the layout by aspect on every size change (a ResizeObserver + `orientationchange` + `visualViewport` resize — `onTurn`). A turn
mid-hand: the layout swaps at once (no reload — the state is the same state); anything the motion has in flight **SNAPS TO ITS END**
(`motion.js#snap` — the painted state is the end; a KO card still due shows now); the events stay seen, so nothing replays and no sound is planned
by the turn (the sounds already planned keep their times); an open SLIDER closes; a sheet (☰, the rankings, LEAVE's confirm, THE TABLE picker)
stays open — they're the console's centred sheets; YOUR CLOCK moves between your plate (upright) and the column (sideways). Safari's bars
showing / hiding is the same path. **The console's TURN YOUR PHONE UPRIGHT card** (index.html `#ns-turn` — every phone held sideways) is hidden
while HOLD'EM's table is up (`body.he-on #ns-turn` — Ben's exception; the room + the walk inside keep it).

### DESKTOP (any wide window — `stageOf`)
THE STAGE (`.he-stage`, every table piece inside it): a phone on its side = the screen itself (z 1); a wider window = the same sideways layout
SCALED (one transform; every coordinate the motion uses stays the stage's): z = min(W / 900, H / 400), ≤ 2.4; the frame no flatter than 2 : 1 and
no wider than 2.4 : 1, centred, 20 stage pt of air at the sides — 1440×900 → × 1.6 (frame 860 × 430), 1920×1080 → × 2.13, 1280×720 → × 1.42,
2560×1440 → × 2.4. Outside it, at the window's size: THE SQUARE BACKDROP + the podium. A TALL desktop window keeps the portrait table (the room
filling the window now — the end screen keeps the phone column's width). Hover: a brightness lift on the buttons (`@media (hover: hover)`). The
screen spans the window (`.screen.he-screen` — no phone column) and the console's ☰ / music pin to the window's corners (`body.he-on`).

### THE SQUARE BACKDROPS
`assets/holdem/<skin>/square.webp` (`build-holdem-skin.py#square` — Ben's 2800² originals at 1280², WebP q 72; the cabin lifted × 1.18 like its
portrait): **casino 19 KB · cabin 80 KB · apartment 31 KB (130 KB in all)**. Sideways the square is as wide as the window (`.he-sq`: its
`backdrop.sqY` row at the window's top — casino 0.1 · cabin 0.16 · apartment 0; darkened by `sqDim`); **only the chosen skin's square loads**, and
only sideways (the preload names it by the screen's shape — `skinAssets(skin, wide)`; upright the portrait backdrop). The living touches live in
the square's box (upright `.he-sq` is `display: contents` — their places as before) and sit on their spots in the square art: the casino's ceiling
neon, the slots' glow left + right, the floor haze; the cabin's snow in the window glass (the flakes tiled denser — a far bigger window), the fire on
the hearth, the lamp; the apartment's rain + light sweep over the skyline window, its sign in the city. The tiers drop them first, as upright.

### THE PREVIEW + THE CHECKS
- `tests/integration/holdem-preview.html` honours the viewport: wider than tall = the sideways table. A REAL phone with a notch keeps its own safe
  areas (turn it and the table turns); a computer's window gets the simulated iPhone's re-applied on every resize (sideways 47 / 47 / 21, an
  SE-sized window < 700 wide none, a desktop-sized one none — `&st=&sb=&sl=&sr=` set them); `&rankings=1` = THE RANKINGS SHEET open.
- `holdem-shots.mjs` at sideways + desktop sizes (the SE sizes one at a time); the review set `Downloads\neon\holdem\shots\he7-*` (17 states ×
  3 skins × 844×390 · 932×430 · 667×375 · 1440×900 · 1920×1080 · 1280×720).
- `holdem-rotate.mjs` (any local server): the MOTION DEMO turned sideways + back 10 times MID-MOTION — the layout follows, the motion snaps, no
  sound planned by a turn, the seats where the layout says, the next events still play; a 1440×900 window (× 1.6) and back; no page error.
- `holdem-pixdiff.mjs` (A = the commit before on :5174 in a worktree, B = the working tree): THE PORTRAIT UNCHANGED — held still (reduced motion,
  the preview's clock), A-A = the noise floor, A-B must not exceed it. HE7: 10 states × 390×844 + 430×932 (casino) + 3 states at 402×874 in the
  other two skins — every one at the floor (0 % but the end screen, whose animated legendary card moves ~3 %).
- `holdem-probe.mjs`: an element's box + computed styles in the preview at a size (debugging a layout).
- The FULL E2E (emulators): ROTATE MID-HAND (the same hand + cards, nothing in flight, no sound replayed; RAISE's slider open → turned → closed,
  the buttons back; a REAL tap on CALL / CHECK sideways acts), ONE WHOLE HAND SIDEWAYS at 8 phones (one a 1440×900 desktop) on real taps, each
  proved uncovered first (`elementFromPoint` — that is how the TURN YOUR PHONE card was found), the busiest moment's 60 fps SIDEWAYS in each skin
  (p50 16.7 / p95 16.8 ms at 4× CPU, 8 seats).

### FOUND, NOT CHANGED (portrait must not change this pass)
- **YOUR own clock bar in PORTRAIT is below the screen** (it rides in your plate at `--plate-y − --hand-y + 40` from the plate's top: y 880 on an 844
  phone) — since HE3 you never see your own shot clock drain upright (the seats' bars + the tick sound work; sideways it's the bar over the presets).
  Ben's call for HE8: where it goes upright (over the presets as sideways, or a ring on your plate). **HE8: a bar across the top of your plate — "HE8".**

## HE8 — YOUR TURN TIMER + THE OWNER'S LIVE TEST + REAL-WORLD TOUGHNESS + LONG NIGHTS (Nov 11 2026 — the decisions: docs/games/plan.md "HE8")
Still 8 functions, no rules change, `playable: false` (for everyone but the owner's own room — below).

### YOUR TURN TIMER (upright — the HE3 miss fixed)
A bar across the TOP edge of YOUR plate (inside its rim, clear of the text — `.he-plate > .he-clock`, 4 pt, the skin's accent: gold · amber · cyan),
draining over your 20 s from the table's `deadline` + `serverNow()` like every clock; **red-orange once it dips into your time bank** (`.is-bank`);
**the last 5 s your plate pulses softly** with the existing tick (`.is-hurry` — `scale` + the ring's opacity; reduced motion = no pulse). Sideways
keeps HE7's bar over the presets (the clock is the hero's child there, never the plate's). The preview: `&clk=<ms left>` + `&bank=1`.

### THE OWNER'S LIVE TEST (Ben plays a real match on the live site while HOLD'EM is `playable: false`)
- **THE SERVER DECIDES** (`api/_lib/holdem-store.js#startOpen`, on the dealer's `start` only): `playable: true` → any host; else the host's uid →
  `uids/{uid}` (their profile) → **ADMIN_PIDS** — the same owner test as the radio's roles (`api/_lib/radio.js#roleOf`); anyone else → **403
  `not_open`**, nothing written (a guest still gets `not_host` first). Never a client flag. On the LOCAL EMULATORS the table stays open (the E2E, the
  passes' `&preview=1` play-tests) unless the test switch `testHoldemGate` is set — then the live rule runs (the owner = ADMIN_PIDS or
  `testAdmins/{pid}`, as roleOf).
- **THE OWNER'S PHONE** learns it from the radio's existing server check (`radioWho` → role `owner` → `config.js#setOwnerPhone` in
  `screens/harbor/radio-gate.js` — never the crew): his room's HOST game list shows **HOLD'EM** with a small **TEST** tag (`isOwnerTest` — read ONLY
  by `room-city.js`), and his host start passes `isPlayable`. The options sheet loads HOLD'EM's cartridge first (it has no thin meta at boot).
  Guests in his room play normally (they never start it). Nobody else's lists, signs, THE BOARD, HOW TO PLAY, the city or any catalog changes —
  `tests/holdem-owner.test.mjs` greps that only the radio gate sets it + only the room's host list reads it.
- **RESULTS COUNT:** a TEST match is a real match — the dealer credits it through the same `applyMatch` path (XP, the streak, the counters, once
  per player); no board yet (HOLD'EM has none). Flipping `playable: true` later simply opens it to all (the server gate + the list follow the one switch).
- Proof: `holdem-server.test.mjs` (a normal host refused, a host with no profile refused, a guest `not_host`, the owner via ADMIN_PIDS starts and
  his guests act, `testAdmins`, `playable: true` opens it) · e2e-holdem FAST starts the match AS the owner's live test (the gate on: the dealer
  refuses the plain host, the owner's list shows HOLD'EM · TEST after the radio's yes, a guest's list unchanged).

### REAL-WORLD TOUGHNESS (`view.js`)
- **INSTANT FEEDBACK:** the control under your finger presses at once (`pointerdown` → `.is-press`, before any network — iOS's `:active` needs a
  touch listener, so it's ours); the one you SENT stays pressed with a soft pending glow (`.is-sent`) until THIS phone's table shows the server's
  answer (**THE CATCH-UP**: the answer's `seq` reached by the listener, ≤ 5 s); the others wait dimmed taking no taps (`.is-busy` — one move at a
  time: a double tap sends ONCE). A PRE-ACTION is lit the moment you tap it (`preWant`) until your own node agrees (or the tap is refused). The old
  `disabled: busy` buttons are gone: a re-render during a move had left them dead once the answer came back.
- **NO SIGNAL:** your buttons wait (`.he.is-offline` — the browser's offline event or the console's `st.net === 'lost'`; part of the render's
  signature, so the reconnect lights them at once — ~0.6 s after the socket is back, was ~10 s before the fix); the console's SIGNAL LOST banner
  says why; the clock keeps draining from the server's numbers; the server's clock applies the bank + the timeout meanwhile; back online the phone
  lands on the latest table — the events older than 2.5 s are history (no motion, no sound), only what's NEW plays (your turn's chime if the table
  reached you). A move whose answer was lost says NO SIGNAL only while the table hasn't moved.
- **APP SWITCH:** a hidden page animates + sounds nothing (as HE4); the console's engine fades + suspends the audio and resumes it on return / the
  next tap (HOLD'EM's buffers re-decode for a rebuilt context — `sfx.js#decodeAll`).
- **THE SCREEN STAYS AWAKE** while you're SEATED in a LIVE match (`wakelock.js#gameAwake` narrows the console's room rule): not OUT (spectating),
  not LEFT, not AWAY / SAT OUT, not after the end; the browser drops the lock on a hidden page, it is taken again on return; nothing where the API
  is missing.
- Proof (e2e-holdem FULL, or `TOUGH_ONLY=1 N=4` alone ≈ 2.5 min): A SLOW LINE (300 ms + 400 kbps on one phone — a pre-action lit at once, CALL pressed
  at once + an impatient double tap = ONE act, the slider + a preset), NO SIGNAL 10 s on someone else's turn + on your own (a tap sends nothing,
  the bar keeps draining, back → a real tap acts), NO SIGNAL 40 s on your turn (back INSIDE the bank, ~9 s left by the server's clock, the bar red-orange,
  then the server's timeout), a 30 s APP SWITCH (the latest table, nothing replayed, the audio suspended → running on a tap), THE WAKE LOCK (seated on,
  busted off, the end off, LEFT off; given back on a hidden page + taken again — a counted stub of the API).

### LONG NIGHTS
- **THE FRAME LOOP SLEEPS:** it runs only while something moves — a turn's clock bar, the motion (a roll-up, or its timeline still to come:
  `motion.js#pending`), the last 5 s' tick; otherwise no frames at all (`wake()` on every update + the page shown again) and the level line's
  countdown is a 1 s timer (text only — `armLevel`). The living touches are CSS, paused on a hidden page (`.he[data-page='hidden']`).
- **THE ENDURANCE RUN** (`node tests/integration/holdem-endurance.mjs "<browser>" --hands 400` — the preview's MOTION DEMO at `&speed=12`: the dealer's
  clock AND the phone's ×12, the motion at its real durations so it overlaps + cancels like a fast table, a new match each time one ends; 8 players,
  390 × 844, NEON CASINO) — **400 hands in 9 min**, sampled after a forced GC:

  | | start (hand 20) | 100 | middle (200) | 300 | end (400) |
  | --- | --- | --- | --- | --- | --- |
  | JS heap | 4.33 MB | 4.06 | 4.21 | 4.28 | **4.28 MB** |
  | DOM nodes (the table's) | 778 (410) | 400 (164) | 378 (150) | 698 (333) | 701 (380) |
  | JS listeners | 132 | 129 | 95 | 171 | 127 |
  | canvases (pixels) | 18 (0.7 MB) | 15 (0.6) | 10 (0.6) | 13 (0.7) | 15 (0.7 MB) |
  | the motion's ghosts · running animations | 21 · 49 | 27 · 48 | 17 · 33 | 26 · 61 | 21 · 47 |

  FLAT — the numbers follow the seats at the table (a match down to 2–3 players, then a fresh 8) and the motion in flight at the sample, never the
  hands played. **THE IDLE PROOF:** a hand's end, a showdown on screen, the waiting table, CASH between hands, sideways: **0 animation frames in 3 s**
  (the view's loop AND every `requestAnimationFrame` on the page counted); the podium: the table's loop asleep (the console's moving legendary
  cards draw their own); a TURN draws its clock (~60 a second); the living touches 0 running on a hidden page.

### THE POLISH
- A probe of every button + text across 16 states × 390 / 430 / 844×390 / the SE both ways: every tap target ≥ 44 pt (END SESSION's 36 pt button got a
  44 pt tap area; your hand's name sideways too), no clipped text, nothing off the screen (the SE upright: your plate ran 2–3 pt off → `layout.js#plate`
  ≤ h − 38; the SE sideways: the plate ran 2 pt off → sideways it is the 26 pt `layout-wide.js` counts). HOW TO PLAY: the 20 s + the time bank, the
  pre-actions, CASH's REBUY · LEAVE · the ledger, AWAY — one plain line each; the rankings sheet: A-2-3-4-5, ties.
- THE PORTRAIT DIFF vs HE7 (`holdem-pixdiff.mjs`): only the new timer strip on your plate (your turn) + the SE plate; the rest at the noise floor.
- THE REVIEW SET: 555 shots (37 states × 3 skins × 390×844 · 430×932 · 844×390 · the SE both ways) + contact sheets in `Downloads/neon/holdem/shots/he8-*`.

### THE RUN (local, before the final push)
unit 1629/1629 · rules 76/76 · /api 44/44 · dealer 14/14 · smoke 6/6 · e2e-holdem FAST 23/23 + FULL 52/52 (60 fps at 4× CPU, 8 seats, the busiest moment:
p50 16.7 / p95 ≤ 16.8 ms in all three skins, upright + sideways) · holdem-rotate ALL GOOD · holdem-endurance ALL GOOD · the City groups the shared files touch
(room, afterparty, sheetstack, playercard, gamestart, crewsky, radiorest) 59/59.

## Flagged for HE9+
- The robots' length numbers are a guide; Ben's live test should re-check TURBO (90 s) + DEEP (15 min) with people.
- The KO card shows only on a FRESH bust (a phone that slept through it lands on SPECTATING). (A bust in the match's last hand: HE10's A3 — the podium now waits 4.5 s for it.)
- The SE on its side at 7–8 players: a 45–49 pt board. The desktop podium is the console's frame at its own size (not the stage's scale).
- When it becomes playable: `scripts/build-preload-graph.mjs` (+ its CARTRIDGES list) — DONE in HE10; a day face + a sign scheme, THE BOARD's catalog — DONE in HOLD'EM IN THE CITY (below).

## HE10 — THE FIX PASS + SWITCH ON (Nov 11 2026 — the Fable review, `Downloads\neon\holdem\FABLE-REVIEW.md`; Ben's decisions: docs/games/plan.md "HE10")
- **THE TRUE CHECK (A1):** the pre-actions = CHECK / FOLD · CHECK · CALL ANY when nothing is owed, FOLD · CALL ANY facing a bet. `pre: 'check'` checks
  when free and is DROPPED by the dealer the moment anyone bets (`table.js#preVoid` — `advance` drops it at once, the toggle goes dark); it is refused
  while chips are owed. It never calls. Sideways the three take two rows (CHECK / FOLD across; CHECK | CALL ANY).
- **THE RESULTS (A2 / B1 + A7):** a HOLD'EM result exists ONLY from the dealer's record (`src: 'dealer'`): `/api/report`'s room + snapshot paths refuse a
  dealer game and any non-playable game (`api/report.js#reportableGame` — 409 `not_reportable`; the frozen games' checks run on the emulators behind the
  emulator-only switch `testReportAll`); `reportMatch` overwrites a result under its key that isn't its own. A match COUNTS only after real play
  (`holdem-dealer.js#COUNTS`: CASH ≥ 10 hands AND ≥ 5 min, a TOURNAMENT ≥ 3 hands) — else `rep: 'short'`, nothing credited, the end screen's quiet line.
- **THE DEALER:** EV_KEEP 24 (A4 — the biggest call measured 18 events) + no second `shown` at the showdown for a hand the run-out turned up (A6); what's
  due runs FIRST on every op (A14); a seat whose player left the room / was kicked goes AWAY at once (A15 — the dealer's own `{ type: 'away' }`; a CASH
  kick still leaves); the record + `hole/{CODE}` deleted `CLEAN_AFTER_MS` (8 s) after the end — `dueOf` gives that one last moment — and a record from an
  EARLIER room with the word (its `roomAt` ≠ the room's createdAt) is deleted, never advanced (A16); no void path (A17); SIT BACK DOWN with the chips you
  left with (A18); `speed` must be a real key (A13); `wireStats` emulator-only (A19); the call budget's shared count in batches of 20 (A20).
- **THE SCREEN:** the podium waits `FINAL_HOLD_MS` (4.5 s) after the end (A3 — `logic.js#directorStep`); a missed run whose OLDEST event is > 3.5 s old
  is history (A5 — `OLDEST_SLACK_MS`); every seat's clock on its own plate's top edge (A8); the top seat's tag UNDER its plate once a hand is over
  (A9 — `SEAT_BOX.top.tagDone`); the end screen tighter + solid + SCROLL FOR MORE when it overflows (A10); your bet hidden while the slider is open
  (A11); the queued LEAVE on two lines sideways, anchored above your plate (A12); the level line two lines — the NEXT blinds + the countdown to them
  (A25); folded / losing seats keep their text readable (A26); a 10 px floor for tags, pills, the D, bet amounts, side pots (A27); the first side row
  takes 66–72 pt under the top seat (A28 — `FIRST_UNDER_TOP`); BLINDS UP on the level line (A31); the rest of A21–A34 + A43 (the orientation from the
  first style pass; a skin switch keeps the old art until the new decodes). `estimateMinutes(settings, _, { players })` from THE LENGTH STUDY (A45).
- **THE SOUNDS:** one KNOCKOUT a run (A35); scheduled sources tracked + stopped on a hidden page / a new match / unmount (A36); a failed load / decode
  retried (A37); primed only with a table (A38); YOUR TURN at the run's last cue (A39); CASH's champion for the biggest winner (net > 0) only (A40, Ben);
  `HE_SFX_REV` cache-bust (A41); the blinds at the approved gain, the first batch after an engine rebuild waits for its buffers, decode failures caught (A42).
- **THE PAPERWORK:** `assets/holdem/CREDITS.md` (`node scripts/build-holdem-credits.mjs` — Ben's four credits.txt verbatim + a summary + Libre
  Baskerville's OFL line); `scripts/build-holdem-skin.py`'s `chips` row + the casino back (every image that ships reproducible); "AI-generated with Grok"
  everywhere; Fabric030 = both felts (A47). The dead exports gone (A49). The preview: `&stress=1` (12-letter names, ×667 chips), `&short=1`.
- **PROOF:** `tests/holdem-he10.test.mjs` (A1 · A3 · A4 · A5 · A6 · A7 · A9 · A13 · A14 · A15 · A16 · A18 · A35 · A41 · A42) + holdem-server's HE10 cases (A2 / B1,
  A7, A15, A16 on the emulators); every Fable repro re-run (scenarios, attack, race, fuzz, evcount, stale, prelabel, reflip).
- **THE SWITCH (Group 7):** `config.js` holdem `playable: true` — every host sees + starts it (no TEST tag: `isOwnerTest` is false for a playable game; the
  HE8 gate's code stays for the next game being built); `js/games/registry.js` imports its thin `meta.js` at boot; `preload-graph.js` (27 modules, 265 KB)
  + index.html's BOOT PRELOAD regenerated; the smoke test starts HOLD'EM from a regular host. NOT here (the city's — the MAILBOX note): its city sign + day
  face, THE BOARD's catalog entry (`tests/harbor.test.mjs#CITY_PENDING`, `profiles.test.mjs` skip it until then), B2 / B3 / B4 / B5.

## HOLD'EM IN THE CITY (Nov 11 2026 — the city's pass: docs/harbor/passes/holdem-city.md)
- **THE CITY**: the roof BILLBOARD says **NOW OPEN** (the timetable's default from Nov 11); HOLD'EM's **skyline SIGN** took GRIDLOCK's spot (`config.js`
  `sign: true` — THE FIVE SIGNS = PRISM DROP · OVERCLOCK · HOLD'EM + NEON PAR · HIGH STAKES): a roof sign spelling HOLD'EM whole (the apostrophe tube),
  its night tube casino red, its day face gold on felt with a cream keyline; on the speakeasy's painted blade in GRIDLOCK's weeks. A tap = its preview
  + HOW TO PLAY, like the other playable signs.
- **THE BOARD** (`core/boards.js` `holdem-tw`): **TOURNAMENT WINS** this week / all time, **KNOCKOUTS the tie-break**, then the earlier to reach it — one
  sort value (`tieSort`), shown "3 WINS · 5 KOs". The counters come ONLY from the dealer's record: `holdem-dealer.js#resultRows` → `match-report.js#
  holdemCounters` (bounded; CASH counts for neither; under `COUNTS` nothing reports); each result (`results/{key}`) keeps `ko` per profile for the
  back-fill (/admin → THE BOARDS). Its tab on THE BOARD = its one board + "TOURNAMENTS ONLY (NOT CASH) · KOs BREAK A TIE". The generic `holdem-wins` /
  `holdem-wr` boards still exist (the profile's game card), never on the tab.
- **THE END SCREEN**: HE10's SCROLL FOR MORE replaced by the console's sticky BACK TO THE ROOM + MORE BELOW (B3, `ui/final.js`; HOLD'EM's backing
  `--fin-bg: rgb(6, 5, 10)`); a CASH session where every net is equal = a draw on game night (B4 — 2 points each; no champion as before).
- B5 (the host's END GAME / kick reach a HOLD'EM match) is FR7's.
