# HOLD'EM — Texas Hold'em, 2–8 players, play chips only

*(HE1, Nov 10 2026 — THE ENGINE + THE SIMULATIONS. No screen, no database, no `/api`, no `config.js` GAMES row yet: nothing a player can
see. The owner's decisions: docs/games/plan.md "HOLD'EM — THE PLAN (Nov 10 2026)" + "HE1". The next pass, HE2, puts this engine on the
server as THE DEALER.)*

## The plan in short
- Texas Hold'em (no-limit), 2–8 players, one phone each, **PLAY CHIPS ONLY** — chips reset every match, no bankroll, nothing buyable becomes
  chips, no money words anywhere ("CASH" is only the mode's name). No solo, no bots in v1 (the robots here only test the rules).
- **THE SERVER IS THE DEALER (HE2):** it shuffles with a NEW server secret (never KEY_PEPPER), sends each phone only its own 2 cards, reveals
  the board, checks every action, settles every pot. The host holds no cards.
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
| `match.js` | a TOURNAMENT or a CASH session around the table: `createMatch`, `nextHand`, `act`, `rebuy`, `join`, `leave`, `endSession`, `ledgerOf`, `chipCount`, `summary` |

Every function takes a state and returns a NEW one (`{ state | match, events, error? }`) — the input is never changed; an illegal action
comes back with `error` (a plain sentence, e.g. "the smallest raise is to 100") and the SAME state object. All state is plain JSON.

## The structure
- **Stacks:** TURBO + STANDARD 1,500, DEEP 3,000. No antes.
- **THE BLIND LADDER:** 10/20 · 15/30 · 25/50 · 50/100 · 75/150 · 100/200 · 150/300 · 200/400 · 300/600 · 500/1,000 · 700/1,400 · 1,000/2,000 ·
  1,500/3,000 · 2,000/4,000 · 3,000/6,000 · 5,000/10,000, then ×2 a level.
- **Level time:** TURBO **90 s** (tuned from the plan's 2 min by THE LENGTH STUDY below) · STANDARD 6 min · DEEP 12 min. The level = (now − the
  start) ÷ the level time; a new level applies from the NEXT hand, never mid-hand (`match.js#blindsFor`).
- **THE SHOT CLOCK (tournament only):** 20 s a turn; then the player's 30 s TIME BANK (one per player per MATCH, spent only after the 20 s, and
  only what they use — acting 10 s into it leaves 20 s); then TIMEOUT = CHECK if free, else FOLD.
- **CASH:** 1,000 chips, 5/10 fixed, a REBUY of 1,000 at zero, late joiners, no timer.

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
- **SHOWDOWN:** everyone still in shows, in order from the first seat left of the button. A fold-win: the winner MAY `show` until the next deal.
- **THE BUTTON — the simple moving button:** the first hand's button is a random dealt-in seat (the injected rng); after that it moves to the
  NEXT DEALT-IN seat clockwise from where it was — empty or busted seats are skipped, even when the button's own seat just emptied; the blinds
  follow it (3+: the two seats after it; heads-up: the button = the small blind). A player may now and then skip a blind or pay the big blind
  twice in a row when a neighbour busts — casinos' dead-button rule isn't worth the confusion at a party.
- **AWAY:** two TIMEOUTs in a row → AWAY: from then on they check-if-free-else-fold AT ONCE (no clock) each turn, and in a tournament they're
  still dealt in + post their blinds, until they act again (`{ type: 'back' }` — any real action also clears it). Their time bank is untouched.
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

## The state (plain JSON — the database shape is HE2's)
```
table: { v, hand, street: 'idle'|'preflop'|'flop'|'turn'|'river'|'done', sb, bb, button, sbSeat, bbSeat,   ← seat NUMBERS (0–7)
         seats: [{ id, seat, stack, status: 'in'|'folded'|'allin'|'out'|'sitout', cards, bet, total, start,
                   acted, actedAt, shown, bank, timeouts, away }],
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

**THE MATCH SUMMARY** (`match.js#summary` — HE2 reports it to `/api` for XP; the shape only, not wired): `{ game, v, mode, speed, startAt,
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

Minutes, median / 90th percentile (40 TURBO, 24 STANDARD, 12 DEEP runs a cell):

| players | TURBO 2 min (the plan) | **TURBO 90 s (shipped)** | STANDARD 6 min | DEEP 12 min |
| --- | --- | --- | --- | --- |
| 2 | 13.0 / 18.5 | **11.3 / 14.3** | 30.7 / 47.1 | 37.0 / 54.1 |
| 4 | 19.3 / 24.3 | **15.3 / 19.3** | 41.4 / 54.4 | 67.8 / 120.3 |
| 6 | 22.2 / 25.0 | **18.5 / 22.3** | 45.5 / 56.6 | 75.7 / 132.4 |
| 8 | 24.6 / 28.5 | **19.7 / 24.8** | 53.7 / 64.4 | 99.4 / 130.2 |

- TURBO at 2 min sat ABOVE the 15–20 min target at 6–8 players → **its level time only** went to 90 s (80 s gave 17.6 / 18.2 — 90 s is the
  smallest change inside the target). The ladder is untouched.
- STANDARD lands in its 45–60 min target at 6–8. DEEP runs ~1¼–1⅔ h at 6–8 (the target was 2 h+) — reported as it is, not tuned (HE1's rule).

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

## For HE2 (THE DEALER) — flagged
- **Firebase drops empty arrays + nulls** (`cards: []`, `board: []`, `button: null` vanish on a write): read the table back through a small
  normaliser before `apply` — or store it as one JSON string per node. The engine expects the fields present.
- The deck + every unshown card must live ONLY server-side; phones read `seatView` copies the server writes (one per seat, owner-read).
- The server drives `nextHand` (with its own seeded rng from the NEW secret), TIMEOUT at `deadline`, and AWAY seats need nothing (they act inside
  `apply`). Pauses between streets / hands are the screen's (HE3) — the engine has none.
- **CASH has no clock** (the plan): a player who walks away stalls the table — HE2 needs the host's "fold for them" / sit-out (`forceFold` +
  `leave` exist) or a long idle clock; a question for Ben.
- The robots' length numbers are a guide; HE8's real play-tests should re-check TURBO (90 s) with people.
