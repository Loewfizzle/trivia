# RUMRUNNER (Prohibition trading)

A modern multiplayer take on the calculator classic Drug Wars, re-themed as 1920s bootlegging in a neon-lit city. Everyone
plays the same days at the same time: buy contraband cheap in one district, sell it dear in another, dodge the feds, pay off
Mr. Vale, build the biggest fortune. 2–8 players; 15 / 20 (default) / 30 days; ≈ 12 / 16 / 24 min. No drugs, no guns:
smuggling, bribes, escapes and deals.

## Rules (`js/games/rum/logic.js` + every number in `tuning.js`, pure)
- Start: $3,000 cash, a truck for 100 units, a $5,500 debt to Mr. Vale compounding nightly (6 % / 5 % / 4.5 % by length).
  Day 1 everyone wakes up in the Old Quarter (`HOME`). (Every number here is `tuning.js`; the doc quotes the tuned values.)
- Goods: moonshine, rum, gin, whiskey, cigars, champagne (cheap → dear). Each day a city-wide base price per good
  (log-uniform in its range, from the CITY seed = matchId + a per-match secret, see Privacy), × the district's tendency, × the Strip's wildness, × storm delays on imports at
  the Docks / Rail Yard, × that day's news (spikes ×3–5, crashes ×¼–0.4), × the shared market. Each district has ≥ 3 goods on
  sale a day (`pricesOf`).
- Shared market: net units bought − sold by everyone in a district on day d move its price on d+1 (`impact = prev × fade +
  net / depth`, clamped), so dumping together crashes the local price.
- A day, in `replay` order: arrival (interest, the Heights' fee, the crooked cop's fee) → events (≤ 2, dice pre-rolled
  from `seed:e:uid:day`) → actions in the order taken (`['t', good, ±n]` trade, `['p', amt]` pay Vale at his office,
  `['s', ±amt]` stash at the office or anywhere with the warehouse, `['u', id]` upgrade where it is sold, `['x', uid]` one
  tip-off a day) → the destination (the Heights only with the fee in hand; none = stay). Invalid actions are skipped
  (`invalid` counts; the server rejects the record).
- Events: Vale's men (debt > 1.5× start, or after half the match with debt left; PAY / STALL — stalling is 50/50: he waits,
  or his men take 45 % of your cash and add 10 % to the debt), the feds (only with cargo, from day 2: district × weather × cop ×
  tipped-off; RUN (40 % base + fog + armour) / BRIBE (10 % of the cargo's value, ≥ $100, works 90 %) / DUMP; caught = a fine
  and 70 % of each good seized), hijackers (HAND OVER 30 % / FLOOR IT 30 % + armour), a lucky crate (5–16 units), a rumour (the
  host hands one out per player on days with news tomorrow, true 70 % of the time), a garage (an upgrade at −30 %). Hidden
  compartments halve what the feds / hijackers take. At most `MAX_ACTS` (60) actions a day.
- Upgrades (`UPGRADES`): BIGGER TRUCK +50 ($2,500) and FREIGHT TRUCK +100 ($10,000) at the Rail Yard, ARMORED TRUCK, HIDDEN
  COMPARTMENTS, HIDDEN WAREHOUSE (Old Quarter), CROOKED COP ($250 a day, halves fed odds). Buying everything blindly loses (sim).
- TIP OFF THE FEDS: `tipCost` = 4 % of the target's net worth (300–25,000); the target is `hot` tomorrow (+20 % fed odds) and
  sees "Word on the street…"; the tipster is named only in the newspaper.
- Final fortune = cash + stash − debt; unsold cargo is worth nothing (warned on the last two days). Ties by uid.
- Weather per day from the seed (clear / rain / fog / storm; the last morning is always `dawn`), with a true forecast.

## Match (`director.js`, pure) and the night (`index.js#prepare`, host)
intro (5.2 s) → per day: `dawn` (7.2 s; 5.2 s on day 1 — the trucks drive) → `day` (30/45/60 s, over early when every
connected player has tapped DONE: public flags in `rooms/{code}/rrpub/{m}/{d}/{uid} = { nw, done }`) → `night` (≥ 3.6 s, until
the host has written tomorrow) → … → `final`. `game.dk` is the day as a string (the rules compare it to `$d`).
At night the host reads every log (`rrp/{code}/{m}`, host-readable only in `night`/`final`), replays everyone
(`resolveNight`) and writes `days/{d+1}` `{ w, f, news, p, at, hot, m }`, `nwh/{d}` and `nw`; after the last day the `books`
(every log, now public) and `final` (standings). Deterministic: a new host repeats the same night.

## Privacy and the server's check
- **The city secret.** `start()` (host) writes a random string to `rrsec/{code}/{m}` (host-only read/write, once). Weather,
  news, base prices and the rumours are seeded by `citySeed(matchId, secret)`, so nobody can compute tomorrow's spikes from the
  room. The host (a new one reads it back) resolves every night with it and publishes it in `game.secret` at the final, which
  is what `verifyDays` needs. A player's event dice stay on `matchId:e:uid:day` so each phone rolls and shows its own events
  without a round trip to the host — a player with devtools can read their own dice (whether RUN will work); the big edge,
  future prices, is hidden. Rumours therefore come from the host (`days[d].rum[uid]`), never from the phone.
- Day logs live in `rrp/{code}/{m}/{uid}/{d} = { ev: { i: choice }, a: [[…]], dest, at }`: written by the owner only during
that day (`game.dk === $d && phase === 'day'`), readable by the owner (rejoin) and by the host at night. Net worth and DONE are
public per day. The server (`core/match-report.js#rumExtra`) recomputes every public day record from the seed and the books
(`verifyDays`, with the published secret), replays each player (`replay`), and rejects any fortune that doesn't match:
records `rum-f15/20/30` (BIGGEST FORTUNE per length), career wins. Comparisons are canonical (`same`): Firebase returns keys
sorted and drops empty objects, and day-keyed objects come back as arrays with a null at 0.

## The screen (`view.js`, `scene.js`, `css/rum.css`, `newspaper.js`, `text.js`, `icons.js`, `audio.js`)
- The city (three.js r160): a 64×44 diorama on a dark base with a gold frame. Streets every 6 units (the ground texture draws
  them); buildings sit on lots inside each block with a sidewalk's margin, and each block takes the style and skyline of its
  nearest district (Uptown one or two towers a block, the Strip low wide clubs, the Old Quarter tight brick, the Docks and the
  Rail Yard sheds, mansions on the hill, low filler between districts; the water, the tracks and the hill's slope stay clear).
  Instanced buildings in five styles with window emissive maps (walls only), Uptown's spired towers, the Strip's signs, the Old Quarter's gas lamps and Vale's green
  window, the Docks' cranes / ship / water, the Rail Yard's train and steam, the mansions on the Heights' hill; searchlights,
  neon point lights, haze sprites, rain points, fog (FogExp2 per weather), lightning (a light spike + a CSS flash + thunder),
  the blue-gold dawn on the last morning (the sky is a CSS gradient behind a transparent canvas). The camera is tilted,
  drifting, framed into the free rectangle (`setFrame`: between the board and the panel on phones, the left column on
  desktop — an off-centre projection), and swoops into a district for an event (`focus`). Trucks in player colours park at
  their districts and drive L-shaped routes at dawn. Tiers 2/1/0: DPR 2/1.5/1, rain 1400/800/320, haze, searchlights.
- Onboarding: the intro card carries a three-step primer and a HOW TO PLAY button; day 1's dawn card says what a day is; the
  first market shows a hint (buy moonshine here, pick a district under TRAVEL, DONE); HOW TO PLAY opens with YOUR FIRST DAY;
  the corner `?` (every game) opens the rules any time.
- UI: the top bar (day, weather chip with its effect, where you are, the day timer), the live net-worth board (leader gold,
  DONE ticks), the glass panel: wallet strip (cash, debt, stash, cargo bar) → tabs MARKET · VALE (Old Quarter) · STASH ·
  GARAGE (where upgrades are sold) · TRAVEL (+ TIP OFF THE FEDS) → DONE with tomorrow's district. Market cards: price, trend
  vs yesterday here, holdings and average cost, BUY / SELL drawers with a slider and ¼ ½ MAX. Overlays: the dawn card (day,
  weather, news, the hot hint, last-day warnings), event cards (the camera on your district; title / kicker / body / choices
  with their odds and costs; then the outcome), the night card (your day's totals, tomorrow, tonight's interest), the
  newspaper, the podium (+ THE LEDGER).
- `derive()`: your state today = `stateOnArrival` → the events you've answered → your actions, exactly what `replay` does;
  nothing is derived or allowed until your logs have loaded (a failed load retries). Every action is validated locally first
  (`applyAction` on a copy) and written as the whole day log (`set`, debounced; immediate in the last 2.5 s, refused in the last
  0.7 s). Each morning your replay's net worth is checked against the host's `nwh`: a mismatch (a write that never landed)
  re-reads your logs. The net worth alone is published with `update` so it never erases a DONE flag; DONE is re-synced from the
  live flags after a refresh. Bots (`bot.js#botDay`) play through the same hook for the E2E. (Gotcha: the view's own
  `update(state)` shadows Firebase's `update` — it is imported as `dbUpdate`.)
- The newspaper: `text.js#headlines(matchStory(game))` drawn on a 1200×1680 canvas (`drawNewspaper`): aged paper, THE NEON
  GAZETTE with a gold neon glow, a halftone hero, the lead, a story per player, BY THE NUMBERS; SAVE THE FRONT PAGE shares
  (Web Share with files) or downloads the PNG.
- Audio: `run1–4` (the owner's; loudness run1 −23.5 dB → run4 −11.8 dB) — `musicOrder(code)` plays a seeded calm pair first,
  then the driving pair, each once per cycle, crossfading; ducks for events; `FINAL_MUSIC = 'victory1'`. `audio.js`: rain /
  city murmur / engine ambience by weather and travel, thunder, the fed siren, the register and coins, Vale's typewriter and
  bell, the printing press and rustle for the paper, jazz stings, ticks.

## Balance
`node scripts/sim-rum.mjs [--days 15|20|30|all] [--n 200]` plays bot matches (trader / careful / gambler / random / idle /
mean; `flags` per bot for no-upgrades / all-upgrades / no-Heights / no-paying variants) on the real rules and reports fortunes,
win rates, fed frequency, upgrade payback, district visits and the net-worth curve. Tune `tuning.js`, re-run, then
`node --test tests/rum.test.mjs tests/rum-text.test.mjs` (the tests are tuning-relative).
Where it landed (200 matches × 6 bots, Oct 2026): trader median $68k / $410k / $3.3M at 15 / 20 / 30 days (careful a bit
under, gambler about half); trader and careful beat random and idle 93–100 % of the time; the gambler wins 33–40 % of
head-to-heads; idle and random end negative; a fed tail every ~5 carrying days, caught 35 % (trader) / 18 % (careful) / 60 %
(gambler); never paying Vale costs 20–55 % of the final fortune; trucks pay back even at 15 days, buying every upgrade blindly
loses; the Heights are worth it with a load. Known soft spots: luck is a big factor bot-vs-bot (fresh daily prices), 6–9 % of
traders bust on an early all-in catch, upgrades only break even at 15 days.

## Tests
`tests/rum.test.mjs` (prices and the market, weather, every action's checks, events and their dice, arrival, the night,
whole matches 2 and 8 players at every length with the server's check and forged books, the director, bots), `tests/rum-text.test.mjs`
(every line of text: lengths, no banned words, headlines from real matches). E2E: `node e2e-rum.mjs "<browser>" ./shots-rum`
(`FAST=1`: two phones, 15 days ≈ 5 min; full: refresh mid-day, host killed, late joiner, music + mute, frame pacing).
Preview: `tests/integration/rum-preview.html?at=day|dawn|night|intro|vale|stash|garage|travel|trade|done|final|podium|spec|event-feds|event-vale|event-hijack|event-find|event-garage|event-rumor&day=&n=&days=&w=`.
