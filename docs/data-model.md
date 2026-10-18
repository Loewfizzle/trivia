# Data model (RTDB)

Every node in the Realtime Database and every game's `game` shape.

## Data model (RTDB)
```
rooms/{CODE}/
  meta:      { hostId, status: 'lobby'|'playing', createdAt, activeAt, hostBeat, settings/{gameId}: {...} }
  players/{uid}:  { name, color, avatar, joinedAt }          ← written by that player only
  presence/{uid}: { online, lastSeen }                       ← onDisconnect sets online:false
  kicked/{uid}:   true                                       ← host only
  game:      host-only; per-game shape (CIPHER below)
  boards/{matchId}/{round}/{uid}: { g:[enc guesses], p:['01202',…], solved, done, solvedAt, at }  ← CIPHER, own, only during 'play'
  answers/{matchId}/{q}/{uid}:    { c: 0-3, at: server time }   ← SIGNAL, own, once, during 'question', alive only
  targets/{matchId}/{uid}:        uid of another participant    ← SIGNAL, own
  oc/{matchId}/{ci}/{uid}:        { p, ok, n, done, at, doneAt, w?, o?, g?, rw? } ← OVERCLOCK, own, during 'play', locked once done
                                  (w Lexicon best word, o Timeline order '2031', g Closest Call guess, rw Rewire turns for resume)
  lies/{matchId}/{round}/{uid}:   { t ≤ 40 chars, at }          ← BLUFF, own, during 'write' (editable)
  votes/{matchId}/{round}/{uid}:  { k: optionKey, like?, at }   ← BLUFF, own, during 'vote' (changeable)
  night/{matchId}:   { g: gameId, p: { uid: 3|2|1|0 }, n: { uid: name }, at }  ← host; game-night scoreboard
  meta/used/bluff/{questionId}: true                            ← host; Bluff questions already used in this room
  meta/used/trivia/{qHash}: true                                ← host; trivia questions any match in this room has banked
  pulse/{matchId}/{uid}: { k: songIndex, ready, s, c, mc, p, g, o, m, n, e, er, at }  ← PULSE, own, current song only
chats/{CODE}/                          ← top level (rooms/{CODE} is readable by any signed-in user; chat isn't)
  m/{key}:      { u, n, t ≤ 300, at } player line (own uid, server time) | { s, x ≤ 80, at } system line (host only)
  rate/{uid}:   server time of that player's last message (rules: ≥ 800 ms apart; written in the same update)
  typing/{uid}: server time while typing (onDisconnect remove; readers ignore entries > 6.5 s old)
  (read/write: members only — player node exists and not kicked. Host: system lines, prune, clear.)
rooms/{CODE}/meta/settings/chat: { filter: bool }                 ← host; "Filter language" (default off)
  golf/{matchId}/{uid}:  { h, s, x, y, st, f?, sh?, b?, pu, pk, ls, le, ri?, rt?, sab?, ball, at }  ← NEON PAR, own, current hole, 'play' only
  agclue/{matchId}/{rk}/{pass}/{uid}: { t ≤ 20 letters/hyphen, at }  ← DOUBLE AGENT, own, only on your turn (game/cur), once
  agready/{matchId}/{rk}/{uid}: { b?, d? }      ← briefing READY (b) / debate READY TO VOTE (d)
  agpin/{matchId}/{rk}/{uid}:   suspect uid      ← debate + vote, movable, not yourself
  agvote/{matchId}/{rk}/{uid}:  { s, lock?, at }  ← vote phase, changeable until locked
  agguess/{matchId}/{rk}/{uid}: { t, at }         ← last chance, only a caught agent, once
  meta/used/agent/{wordKey}: true                 ← host; DOUBLE AGENT words already dealt in this room
  meta/prism: { seed, n }                         ← host; PRISM DROP room playlist (seeded shuffle, next position)
  prism/{matchId}/{uid}: { st: play|out, at, b (board string), h, p ("t,r,x,y"), sc, ln, lv, mc, se, pd, best, tg, by?, ev?, sv }
                                                  ← PRISM DROP, own, count/play/end; out is final (by = who KO'd you)
  prismq/{matchId}/{target}/{push}: { f, n ≤ 30, g 0-9, at }   ← PRISM DROP junk attack, from yourself, battle only, once
  prismcall/{matchId}/{uid}: { w, at }            ← Call the Winner: only when out, ≤ 12 s after, a live player, once
  meta/slip: { seed, n }                          ← host; SLIPSTREAM room playlist
  glready/{matchId}/{uid}: { at }                 ← GRIDLOCK: fleet placed (own, during 'place')
  glshot/{matchId}/{rk}/{uid}: { t, r, c | x, at } ← GRIDLOCK: Classic = the current player on their turn (plain cell); Royale = anyone
                                                    alive while aiming (t public for TARGET LOCK, the cell obfuscated as x); once per volley
  glres/{matchId}/{rk}/{target}: { r: {shooter: [{h 0|1|2, s?}]}, k: {slot: "r,c,len,d"}, by?: 'host', at }  ← the target (or the host), once
  glcall/{matchId}/{uid}: { w, at }               ← GRIDLOCK Call the Winner (as prismcall)
  slip/{matchId}/{uid}: { st: ride|rewind|out, t, x, y, a, g ±1, v, n (on ground), l (lives), i (shimmer), c (combo), rd (ride code
                          b|c + r|s|w), d, bc, fl, ln, cl, bi, rg, at (out only) }  ← SLIPSTREAM, own, ~10 Hz, count/play/end; out is final
  slipcall/{matchId}/{uid}: { w, at }             ← SLIPSTREAM Call the Winner (same rules as prismcall)
fleets/{CODE}/{matchId}/{uid}: { s: "r,c,len,d;…", at }   ← top level, GRIDLOCK fleets. read: that player + the current host;
                                       write: the player (while placing, or until they have one) or the host when none exists.
spy/{CODE}/                            ← top level, DOUBLE AGENT secrets (never inside rooms/{CODE})
  key/{matchId}: { seed }      read/write: the CURRENT host only (rules check rooms/{CODE}/meta/hostId)
  card/{uid}:    { m, rk, cat, word|null, agent }   read: that player only; write: host only
  (deleted by the host, or by anyone once the room is gone; room.js removes it with the room)
```
All player-writable nodes are listed in `ALL_PLAYER_NODES` (registry.js) and wiped by the host on match start/end.
CIPHER `game`: `{ id:'cipher', matchId, rounds, lengths[], roundMs, maxGuesses, participants{uid:true},
round, rk (round as string, for rules), phase: intro|play|reveal|standings|final, phaseStartAt, phaseEndsAt,
roundStartAt, secret (XOR+base64), used{len_idx:true}, reveal (plain word, only after the round), results{round:{uid:{pts,solved,n,t,speed,eff}}} }`.
Totals are always **derived** from `results` (never stored), so replaying a transition can't double-score.

SIGNAL `game`: `{ id:'signal', matchId, settings{hp,cats}, participants, hp{uid}, sh{uid}, out{uid:q}, q, qk, qStartAt,
phase: intro|question|reveal|final, phaseStartAt, phaseEndsAt, log{q:{c, ev:[hit|shield|burn|out]}}, bank{i:enc}, trivia{n,token,lastFetchAt,turn,fails,cats,seen} }`.
Resolution writes **absolute** hp/sh computed from the pre-question state, so a replayed transition is harmless.
Damage: strike = round((30 − 20·elapsed/15 s) × mult), burn = round(10 × mult), mult = 1 + 0.25·floor(q/5). Cap 35 questions.

OVERCLOCK `game`: `{ id:'overclock', matchId, settings{mode}, seed, total, order[], participants, ci, ck, brief,
phase: ready|play|standings|final, phaseStartAt, phaseEndsAt, playStartAt, seen{type}, tq{ci:bankIndex}, tUsed, results{ci:{uid:{pts,ok,parts}}}, bank, trivia }`.
Every client regenerates challenge `ci` with `generate(order[ci], {seed, ci, level})`; no challenge content is stored.
Score = round(100·ok/parts) + (perfect ? up to 60 speed bonus); ×2 on the final challenge. `ok` may be fractional
(Quick Count: off by one = 0.5; Signal Lock: per-round reaction credit 0.1–1, scored as round(160·ok/parts) with no
separate speed bonus). **Order (`logic.js#buildOrder`, seeded): no type repeats** — up to 20 challenges are all different
(Quick = 6, Standard = 12 of the 20 — `MODES` in logic.js, picked from a list in the options sheet); Marathon (24) has every type once plus 4 repeats, never back to back, repeats ≥ 8 apart.
**Category spread:** every type has a `CATEGORY` (words, numbers, memory, visual, knowledge, reflex); the order never puts two
of the same category next to each other unless impossible (`categoryClashes(order)` is 0 for every generated match — tested
over thousands of seeds). Short matches draw types on the fly so they can avoid clashes too.
Newer types: **lexicon** (6 parts; ok = 6 − (max − best length), only the longest word counts, speed bonus only at max),
**timeline** (4 parts, one per item in the right place), **closest** (1 part, credit = smooth curve: ≤ 5 % off = 1, ≥ 60 % = 0;
no speed bonus — the closest player(s) get +60 instead, decided in `computeResults` from `ok`), **rewire** (2 parts; ok = solved +
0.6·reach for the unsolved one; `genRewire` builds a solved path then scrambles, always solvable). Bank-backed types pick
`bankIndex(seed, type, occ)` from a shuffled per-match deck so a repeat in Marathon never deals the same entry. Standings
last 10 s for lexicon/timeline/closest (`standingsMs`) to fit the reveal panel. Unscramble also gets a reveal (the word,
the scrambled letters, how many cracked it) within the normal 6 s.
Update 2 types (all reveal for 10 s): **missinglink** (2 parts, 50 each; typed answer via an invisible input over letter boxes,
`linkAccepts`: case/spaces ignored, plurals + listed variants accepted; the exact answer locks in as typed; SKIP on puzzle 1;
`.oc.kb-open` + `--kb` from visualViewport keep it above the iOS keyboard), **spellcheck** (5 parts, one tap each),
**make24** (2 parts: an easy then a hard set from data/oc/make24.json; tiles merge with exact fractions `[n,d]` via `applyOp`,
UNDO/RESET, SKIP on puzzle 1; the reveal shows the stored solution), **compass** (5 rounds of 3→7 turns, generated; instructions
at 760→550 ms each so 25 turns fit in 30 s — `COMPASS_SCRIPT_MS` ≈ 22.5 s is the scripted time, and the speed bonus only counts
time past it; the reveal animates every round's turns on mini compasses), **sortit** (12 cards, 5–7 per side, card window
2.6 s → 1.2 s; swipe (pointer events, velocity or 70 px) or tap a screen half or ←/→; ok = right − ½·wrong ≥ 0, scored
round(100·min(1, ok/10)), speed bonus only for 12/12 — `ok` reaches `parts` only then), **higherlower** (10 pairs, ok = streak,
a miss ends the run with p = streak + 1; pairs only within one stat, ≥ 1.2× apart or ≥ 10 years; first 3 pairs ≥ 2× / 40 years,
from pair 7 on the closer ones). No new DB fields: everything fits `p/ok/n ≤ 12`.
Types: unscramble, memory, oddone, math, pattern, trivia, stroop (Color Clash), reflex (Signal Lock), count (Quick Count),
lexicon, timeline, closest (Closest Call), rewire, missinglink, spellcheck, make24, compass, sortit, higherlower, truefalse (True or False — `TF_FACTS` pairs must stay unambiguous; math statements are verified by a unit test).
Signal Lock times taps from the pointerdown event against the frame the flash painted (performance.now clock, local only).

BLUFF `game`: `{ id:'bluff', matchId, settings{mode}, rounds, participants, round, rk, phase: intro|write|vote|reveal|standings|final,
phaseStartAt, phaseEndsAt, qx (enc {id,q,a,v,cat}), hx (enc house lies), used{id}, options[{k,t}] (vote phase, no authorship),
ox (enc full options with authors/truth), reveal{steps,unpicked} (plain, from the reveal on), results{round:{uid:{pts,truth,fooled,likes,picked}}} }`.
Option keys are `optionKey(text)` = hash of the normalized text, so identical lies merge and a client can recognize its
own lie without authorship being public. The reveal is time-driven: `revealStepAt(script, serverNow - phaseStartAt)`.
Scoring: truth 1000, each victim of your lie 500 (every merged author), each like 100; final round ×3.
Voting ends early once everyone has voted, but only `VOTE_SETTLE_MS` (4 s) after the latest vote: a ♥ is a second tap, and
closing instantly used to drop the last voter's like.
**No formatting tells:** every option (truth, lies, house lies) is shown through `logic.js#displayText` — ALL CAPS, no
leading a/an/the, no trailing punctuation or quotes, number words as digits — so nobody can spot the truth by its casing
or grammar (a reported exploit). Never render raw option/answer text; `tests/bluff.test.mjs` checks the whole bank.

**Trivia sources (medium difficulty only):** The Trivia API first (categories mixed in each batch, best curated), then
Open Trivia DB (never its sports category — club nicknames and stats even at medium), then the bundled bank (medium
rows first). Every API question passes `sources.js#tooSpecific`: no all-years / all-big-number answer sets, no dated
results ("who won the 2016…"), no sports seasons / scores / drafts / stat records. Tests hold real examples of both.
**Trivia bank:** questions are appended to `game/bank/{i}` (obfuscated with key `code:matchId:q{i}`). Signal question
`q` = `bank[q]`; Overclock lightning challenge `ci` uses `bank[tq[ci]]..+2`. The host keeps it topped up (Open Trivia DB
batches of 20, ≥ 5.2 s apart, session token in `game.trivia.token`); if the API is slow the director waits ~2.5 s, then
appends from the fallback bank synchronously.
**No repeats across a night:** every question a match banks is also recorded in `meta/used/trivia/{qHash}` (the opening bank
via the start `$room`, top-ups in the same room update, director fallbacks via the step's `$room`), and every source skips
those hashes — so rematches and Last Signal ↔ Overclock never deal the same question twice in one room. The opening batch
starts at a random category/difficulty. Only if the bundled bank is exhausted does a match allow room repeats (never stall).
Check with `tests/integration/trivia-rematch.mjs` (six back-to-back matches against the live APIs).

PULSE `game`: `{ id:'pulse', matchId, settings{song,count,diff,echo}, seed, participants, songs[{id,title,artist,bpm,duration}],
si, sk, phase: load|song|echo|standings|final, songStartAt, echoStartAt, phaseStartAt, phaseEndsAt, results{si:{uid:{s,c,mc,p,g,o,m,n,e}}} }`.
Players publish their own stats (`pulse/…`, every 500 ms + on song end / Echo rounds); the host snapshots them into
`results/{si}` at the end of the song (and `results/{si}/{uid}/e` after Echo). Totals = Σ (s + e).

NEON PAR `game`: `{ id:'golf', matchId, settings{mode,power,sabotage}, holes[holeNumbers], participants, hi, hk,
phase: play|card|final, phaseStartAt, playStartAt, phaseEndsAt, cdEndsAt, wrapAt, results{hi:{uid:{s}}} }`.
Player node `golf/{matchId}/{uid}`: `h` hole index, `s` strokes, `x,y` rest spot, `st` aim|roll|done, `f` final score (locked
by the rules; = s, or 7), `sh` the current/last shot `{x,y,a,p,t,pu}` (t = hole clock seconds), `b` the latest ~10 Hz ball
sample `{x,y,z,vx,vy,t}`, `pu` held power-up, `pk` bitmask of pickups taken this hole, `ls/le` last shot start/end (server ms),
`ri/rt` riding a moving platform, `sab {h,to,k,at}` the sabotage this player sent this hole (once), `ball {c,f,t}` their look.
Totals are derived from `results` (lowest strokes wins).

PRISM DROP `game`: `{ id:'prism', matchId, settings{mode: battle|rush}, participants, seed, songs[ids], sd[ms], pl0 (playlist
position), phase: count|play|end|final, songStartAt, playStartAt (= a downbeat of song 0), endAt (rush: the song's last beat),
n0, out{uid:{at,place,rem,by,gone}}, ko{uid}, bd{uid badges}, duelAt, winner, results{uid:{sc,ln,lv,mc,se,best,ko,bd}}, calls{uid:{w,ok,bonus}} }`.

GRIDLOCK `game`: `{ id:'gridlock', matchId, settings{mode: classic|salvo|royale|arcade, placeSec, turnSec}, mode, participants, names, size
(10 for 2–3 players, 8 for 4+), fleet [lengths], n0, order[] (seeded Classic turn order), phase: place|turn|aim|resolve|show|end|final,
phaseStartAt, phaseEndsAt, v (volley number), rk (= String(v), the key under glshot/glres), round (simultaneous modes), ti, cur (Classic
shooter), fire{uid:[{t,r,c,k?:'cluster'} | {t,k:'torpedo',axis,idx,dir}]} (the volley being resolved / shown), acts{uid:{a,…}} (the cards
played this volley, public from resolve), ev[] (the volley's events: shield/relocate/sonar/shot/torpedo/sunk/elim/pts — every phone plays
them on the server clock), boards{uid:{cells{"r,c":{by,h}}, sunk{slot:"r,c,len,d"}, left}}, pts{uid}, stats{uid:{sh,hi,sk,el,ab,bl,bp}},
hand{uid:[card]} + cardN{uid} (Arcade; cards are public, their aim is not), out{uid:{at,place,rem,by,cap?}}, bounty (3+ fleets only),
done, winner, capped, results{uid:{pts,sh,hi,sk,el,acc,ab,bl,bp}}, calls }`. Unhit ships are never in it.
GRIDLOCK player nodes: `glready/{m}/{uid}`; `glshot/{m}/{rk}/{uid}` = Classic `{ t, r, c, at }` or simultaneous `{ ts{target:true}, x
(obfuscated shots + ability payload), a?, at }`; `glres/{m}/{rk}/{target}` = `{ r{shooter:[{h 0..3, s?, cr?, cc?}]}, k{slot:geo}, by?:'host', at }`;
`glcall/{m}/{uid}`. Top level: `fleets/{code}/{m}/{uid}` (owner + host read; owner writes while placing, or in Arcade `aim` with a RELOCATE
card before locking in) and `glsonar/{code}/{m}/{shooter}/{rk} = { n, at }` (written by the scanned player or the host, read by the shooter alone).

SLIPSTREAM `game`: `{ id:'slip', matchId, settings{lives}, participants, seed (the course), songs[ids], sd[ms], pl0, phase:
count|play|end|final, songStartAt, playStartAt (GO), phaseEndsAt (play: GO + 9 min), n0, out{uid:{at,place,rem,d,gone?,time?}},
lastAt (LAST RIDERS), winner, timeUp, results{uid:{d,bc,fl,ln,cl,bi,rg}}, calls{uid:{w,ok,bonus}} }`.

DOUBLE AGENT `game`: `{ id:'agent', matchId, settings{rounds,mode,agents,clueSec,debateSec,passes}, participants, seat[] (this
round's players), names{uid}, round, v (re-deals), rk = "round-v", phase: intro|briefing|clues|debate|vote|unmask|last|scores|final,
phaseStartAt, phaseEndsAt, order[], turn, cur, pass, turnEndsAt, board{pass:{uid:clue|''}}, debateEnd, tally, accused[],
agents, caught, ballots, word, cat, stolen, guesses, burned{wordKey}, voided, lastCat, history{round:{word,cat}},
results{round:{uid:{pts,agent,escaped?,stole?,caught?,spotted?}}} }`. The secret word and the agents are never in it until
they're revealed (agents at the vote's end, word/cat at the scores): they're **derived** from the host-only seed
(`logic.js#deal(seed, round, v, seat…)`), so a new host recomputes the same deal; each player's card is written to
`spy/{code}/card/{uid}`. Totals derive from `results`.

