# HIGH STAKES (wager trivia)

The high-roller back room of the speakeasy. Each round shows only the category and difficulty; everyone secretly bets chips,
then answers one multiple-choice question. Right = +bet × payout, wrong or no answer = −bet. 2–8 players, ≈ 9 min.

## Rules (`js/games/stakes/logic.js`, pure)
- 1,000 chips each; 10 rounds + ALL IN. Payout MEDIUM 1×, HARD 2×; DOUBLE DOWN (rounds 4 and 8) doubles it.
- Bet: minimum 10 % of the stack rounded, at least 10 (all of it under 10); maximum everything (`minBet`, `clampBet`).
  No bet in 15 s = the minimum. No answer in 20 s = wrong. No speed bonus; total answer time only breaks final ties.
- HOUSE LOAN: a stack at 0 or below gets +200 (any number of times); loans are subtracted at the end (`ledger` → `net`).
- ALL IN (round 11): always HARD, bet up to everything; the showdown goes from last place to first (`finalOrder`).
- Stacks, loans, best hands are DERIVED from `game.res` by replaying rounds (`ledger`); never stored.
- `difficultyPlan(seed)`: round 1 MEDIUM, 4–6 HARD in rounds 2–10, never three alike in a row, the final HARD.
  `pickQuestion`: never the previous round's category, the least-used categories first, the planned difficulty (else the other one).

## Match (`director.js`, pure)
intro (4.2 s) → per round: `cat` (4.6 s; + 3.4 s DOUBLE DOWN card; + 5.2 s ALL IN dimming) → `bet` (15 s, ends 0.7 s after the
last connected player locks) → `q` (20 s, ends when everyone connected answered) → `show` (waits for the host's resolution,
then 2.4 s + 0.65 s/player + 2.6 s; ALL IN 2.6 s + 2.6 s/player + 2.2 s) → `stand` (5.2 s) → … → `final`.
`showPatch(game, hidden, correct, now)` (host) writes `res/{r}` `{ uid: { b, a, ok, d, t } }`, `reveal/{r}`, `phaseEndsAt`
(+ `order` on the final). Offline players aren't waited for (they bet the minimum and miss).

## Privacy
Bets and answers live in a top-level node: `hsbet/{code}/{m}/{rk}/{uid}` = `{ b: { b, at }, a: { a, at } }`, readable by the
owner, and by the host only once the game is in `show`/`stand`/`final` (to resolve). Written once each, in their phase, `at` = server
time (answer time = `a.at − qStartAt`). The public `rooms/{code}/hslock/{m}/{rk}/{uid}` = `{ b, a }` (server times only — who has
locked / answered, never what); the rules only accept a lock flag when its hidden value exists. Rules tests: `rules.test.mjs`.

## Questions (`questions.js` pure + `feed.js` host)
The room's bank: `game/bank/{i}` (XOR + base64, key `code:matchId:hs{i}`) and a public index `game/qmeta/{i}` = `"science|hard"`.
Sources: Open Trivia DB (session token in `game/trivia/token`, 50 a batch, ≥ 5.2 s apart, medium + hard) → The Trivia API → the
bundled bank (`data/trivia/fallback.json`, also synchronously via `fallbackPatch` when a round would have no question). Shared filters
(`sources.js#acceptable`, `#tooSpecific`); no easy questions; unsuitable OTDB categories (video games, anime, comics…) are dropped.
Categories: SCIENCE, HISTORY, GEOGRAPHY, FILM & TV, MUSIC, SPORTS, ART & LITERATURE, TECHNOLOGY, NATURE, MYTHOLOGY, GENERAL KNOWLEDGE.
`nextWant(game)` tops up the scarcer difficulty between rounds. Questions used are remembered in `meta/used/trivia` like the other trivia games.

## The look (`scene.js`, `view.js`, `css/stakes.css`)
- Room (baked Canvas 2D per size): a frosted-glass wall with neon (martini, spade, diamond, a tube) glowing through, brass mullions,
  the table from above — emerald felt with grain + weave, printed gold lines and the pot ring with "HARD PAYS TWO TO ONE…" on an arc —
  the polished wood rail with the lamp's highlight, a vignette. A 70 s drift on the compositor.
- The lamp: its warm pool (`.hs-pool`, screen blend) and shade (`.hs-lamp`); DOUBLE DOWN flares it + a gold sweep (fx); ALL IN dims
  the room (`.hs-dim`), sways the lamp, and a spotlight (`.hs-spot`) follows each reveal.
- Effects canvas: haze sheets and motes in the lamplight, chips flying in weighted arcs (sprites drawn by `drawChip`, turning over in the
  air, with shadows), the winner's slow chip rain. Tiers 2/1/0 (DPR, haze, motes, shadows, rain) from the kit's frame pacing.
- DOM: seats (avatar, name, rank emblem, glowing chip count; gold rim on the leader; IOU marker for loans; ✓ when locked/answered), the
  3D category card (gold-foil frame, emblem per category — `icons.js`, a light glint), the cream-and-gold question card (Playfair
  Display, loaded on first entry), the pot (a pile per bettor, amounts secret), the bet dock (amount, slider with a chip thumb, MIN ¼ ½
  ALL IN, 10/25/100/500 chips to tap or drag into the pot, LOCK IN), your stack as side-view chip columns, showdown bet cards that
  flip in sequence, standings, the podium + THE BOOKS report.
- The showdown is a timeline from `phaseEndsAt − showMs`: a refresh mid-way shows what's already turned, without replaying sounds.

## Audio
- Music: `high1–3` (the owner's lo-fi, 112 kbps), playlist `stakes` re-ordered per room by `musicOrder(code)` (seeded, each once before
  repeats, crossfades). Ducks during showdowns, near silence for the ALL IN reveals, `FINAL_MUSIC = 'victory1'` (victory.mp3) on the podium.
- SFX (`audio.js`): chip clack (two resonant transients + felt), chip cascades, card flip, deal, lock-in, the correct-answer bell, wrong,
  losing chips sliding away, DOUBLE DOWN swell + shimmer, the ALL IN drone (on/off), the reveal tick.

## Boards
Records `stakes-chips` (best final stack, chips − loans) and `stakes-big` (biggest single round); career wins / win rate.
`match-report.js#stakesExtra` replays every round and refuses a bet outside the limits or a result that isn't bet × payout.

## Tests
`tests/stakes.test.mjs` (limits, timeouts, payouts, DOUBLE DOWN, loans, tie-break, ALL IN order, difficulty plan, categories, source
fallbacks, whole matches 2 and 8 players with a host replay, forged results). E2E: `node e2e-stakes.mjs "<browser>" ./shots-stakes`
(`FAST=1` two phones ≈ 4 min; full: refresh mid-bet, host killed, late joiner, music + mute, frame pacing). Preview:
`tests/integration/stakes-preview.html?at=intro|cat|dd|allin|bet|locked|q|answered|show|final-show|stand|final|spec&n=&round=&loan=1&t=`.
