# Data model (RTDB)

Every node in the Realtime Database and every game's `game` shape.

## Data model (RTDB)
```
rooms/{CODE}/                                                ← CODE = the room's HUSH WORD (data/hushwords.json); old random codes still open
  meta:      { hostId, status: 'lobby'|'playing', createdAt, activeAt, hostBeat, hostBy?, locked?, settings/{gameId}: {...} }
             hostId (SHELL 2.0 B2 — MAKE HOST): the host may hand it to a LIVE, ONLINE, UNKICKED player of the room (the rule's .validate);
             a claim for yourself + the room's creation as before. hostBy = who handed it over (MAKE HOST — every phone says it once)
  radioCrew/role/{uid}: { on, at }                           ← SERVER (SHELL 2.0 B2 — THE CREW SWITCH LIVE): the owner flipped this player's
                                                               CREW on their card → their phone loads / drops its radio at once
             locked: true = LOCK THE DOOR (host): the rules refuse a NEW players/{uid}; existing nodes (refresh, rejoin,
             a dropped phone coming back, leaving) are untouched; kicked stays kicked either way
  players/{uid}:  { name, color, avatar, joinedAt }          ← written by that player only (a new node only while unlocked);
                                                               joinedAt set ONCE at the server's clock (APP FIXES — the claim order)
  presence/{uid}: { online, lastSeen, v: 2, c: { connId: ts } } ← ONE CHILD PER CONNECTION (APP FIXES): each socket adds c/{connId}
                  with onDisconnect().remove(); online = any child left (core/room-logic.js#presenceOnline — v 2 = the flag is
                  ignored; a node without v/c is the old shape: its flag). online:false + lastSeen still written by an onDisconnect
                  update (older clients). The client heals its own child while connected. Own node only, a live seat, not kicked.
  kicked/{uid}:   true                                       ← host only
  game:      host-only; per-game shape (CIPHER below)
  boards/{matchId}/{round}/{uid}: { g:[enc guesses], p:['01202',…], solved, done, solvedAt, at }  ← CIPHER, own, only during 'play'
                                  (public by design: every phone draws each opponent's coloured rows; the host RE-GRADES p +
                                  solved from g — cipher/logic.js#regradeBoards; game.sx/{round} keeps every round's obfuscated word)
  answers/{matchId}/{q}/{uid}:    { done: true, at }            ← SIGNAL, own, once, during 'question', alive only — the choice
                                  itself is in THE SEAL (below); the old { c, at } still accepted this pass
  targets/{matchId}/{uid}:        uid of another participant    ← SIGNAL, own, never in the final or once out (public: "N LOCKED ON YOU")
  oc/{matchId}/{ci}/{uid}:        { p, ok, n, done, at, doneAt } ← OVERCLOCK, own, during 'play', locked once done — the answers
                                  (o Timeline order '2031', g Closest Call guess, rw Rewire turns; w was LEXICON's word, cut in OC1 —
                                  the rule still takes it) are in THE SEAL; the host publishes them for the reveal as game/rv/{ci}/{uid}
  ocm/{matchId}/{ci}/{uid}:       { s, at }                     ← OVERCLOCK (OC1), own, during 'play': THE COMBO's marks, one char an
                                  answer ('1' right · '0' wrong · 'h' half · '-' no right or wrong; ≤ 24) — a write of its OWN beside the
                                  board, so older rules refuse it alone (the board falls back: logic.js#marksFor)
  ocnext/{matchId}/{ci}/{uid}:    { at }                        ← OVERCLOCK (OC1), own, during 'standings': "TAP WHEN READY" — everyone
                                  connected tapped (≥ 3 s in) = THE AFTER-CHALLENGE SKIP (director.js, kit/ready.js#readyState)
  lies/{matchId}/{round}/{uid}:   { done: true, at }            ← BLUFF, own, during 'write' — the text in THE SEAL (old { t, at } accepted)
  votes/{matchId}/{round}/{uid}:  { done: true, at }            ← BLUFF, own, during 'vote' — { k, like? } in THE SEAL (old shape accepted)
  night/{matchId}:   { g: gameId, p: { uid: 3|2|1|0 }, n: { uid: name }, at }  ← host; game-night scoreboard (at = the server's
                                  clock, required — /api/report age-caps by it; n is display only: credit needs a seat in players/)
  meta/used/bluff/{questionId}: true                            ← host; Bluff questions already used in this room
  meta/used/trivia/{qHash}: true                                ← host; trivia questions any match in this room has banked
  pulse/{matchId}/{uid}: { k: songIndex, ready, s, c, mc, p, g, o, m, n, e, er, at }  ← PULSE, own, current song only
seal/{CODE}/{node}/{matchId}/{key}/{uid}   ← THE SEAL (APP FIXES — Grok 4.1; games/kit/seal.js): a round's SECRETS out of rooms/.
  node lies / votes (BLUFF: { t, at } / { k, like?, at }) · answers (SIGNAL: { c, at }) · oc (OVERCLOCK: { w?, o?, g?, rw?, at }).
  Read: the owner; the HOST the whole {key} only once rooms/{CODE}/game/unseal/{node} === key ("pencils down" — the director
  writes it when the round closes; after it nobody writes that round). Write: the owner, the same gates as the room node + not
  unsealed. Wiped by the host at a match's start + end and with the room (room.js#closeRoom).
hush/{WORD}: { closedAt }               ← HUSH WORDS cooldown: written ONLY in the same update that deletes rooms/{WORD} (rules:
                                         the room existed before, is gone after; closedAt = server time) — a client can't rest
                                         words at will. Readable by any signed-in user (the host reads it to pick a word).
                                         Entries older than 24 h may be deleted by anyone (createRoom sweeps up to 50).
                                         Picking (js/core/hush.js): a random word with no entry younger than 24 h, claimed by a
                                         transaction on rooms/{WORD}/meta (two hosts never share one); all resting → the oldest
                                         rested word; no list → the old random code. Every close path (leave as the last one,
                                         idle close, the stale-room sweep) goes through room.js#closeRoom.
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
                                                  ← PRISM DROP, own; PFIX-B: PLAY (+ the countdown from GO − 2 s, + SCORE RUSH's END ≤ endAt + 4 s),
                                                    FROZEN once out (own st or game/out); at = now; sv CLOSED: { b, n, h, hd, lv, ln, sc, cb, mc, bb,
                                                    bc, se, fr, pd: [[n, gap, from, id, wait ms, risen ms]], sd, best, st: [pieces, quads, twists, pcs],
                                                    ct, pk 0–40, ak } — counts ≤ pieces ≤ 20/s of play; sc / ln / se bounded by the play clock (docs/prism.md)
  prismq/{matchId}/{target}/{uid}-{piece}: { f, n ≤ 30, g 0-9, at = now }   ← PRISM DROP junk attack: from yourself, ONE a piece (create-only),
                                                    battle + play only, never at / from a board that is out
  prismcall/{matchId}/{uid}: { w, at }            ← Call the Winner: only when out, ≤ 12 s after, a live player, once
  meta/slip: { seed, n }                          ← host; SLIPSTREAM room playlist
  glready/{matchId}/{uid}: { at }                 ← GRIDLOCK: fleet placed (own, during 'place')
  glshot/{matchId}/{rk}/{uid}: { t, r, c | x, at } ← GRIDLOCK: Classic = the current player on their turn (plain cell); Royale = anyone
                                                    alive while aiming (t public for TARGET LOCK, the cell obfuscated as x); once per volley
  glres/{matchId}/{rk}/{target}: { r: {shooter: [{h 0|1|2, s?}]}, k: {slot: "r,c,len,d"}, by?: 'host', at }  ← the HOST only, once
                                                    (APP FIXES — Grok 4.2: from the fleet it reads; glsonar the same)
  glcall/{matchId}/{uid}: { w, at }               ← GRIDLOCK Call the Winner (as prismcall)
  slip/{matchId}/{uid}: { st: ride|rewind|out, t, x, y, a, g ±1, v, n (on ground), l (lives), i (shimmer), c (combo), rd (ride code
                          b|c + r|s|w), d, bc, fl, ln, cl, bi, rg, at (out only) }  ← SLIPSTREAM, own, ~10 Hz, count/play/end; out is final
  slipcall/{matchId}/{uid}: { w, at }             ← SLIPSTREAM Call the Winner (same rules as prismcall)
fleets/{CODE}/{matchId}/{uid}: { s: "r,c,len,d;…", at }   ← top level, GRIDLOCK fleets. read: that player + the current host;
                                       write: the player — CREATED only while placing, never deleted, a RELOCATE keeps the ship
                                       count (the host checks the rest: abilities.js#legalRelocate) — or the host when none exists.
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
phase: ready|play|standings|final, phaseStartAt, phaseEndsAt, playStartAt, seen{type}, results{ci:{uid:{pts,ok,parts}}},
deal{ci:[int|id]}, dk{ci:'key key …'}, combo{uid:{c,m}}, rw{ci:{w,p}|{t:{uid:true},p}|{n:true}}, tm{ci:{uid:ms}}, cr{uid:int} }` (OC1: `deal` = THE ROOM's NIGHT MEMORY's deal — the bank rows / facts / words each
challenge shows, picked at start() around rooms/{CODE}/meta/used/overclock; `dk` = their keys, marked used by the step that opens the
challenge, with its type's `t-<type>` (docs/overclock.md, js/games/overclock/deal.js) — OC6: the four BUILT pools deal STABLE IDS, never an index
(truefalse `[4 fact ids]` · higherlower `["statId|itemId|itemId" × 10]` · timeline `[themeId, itemId × 4]` · sortit `[setId]`; keys `tf-<id>` ·
`hl-<stat>-<item>` · `tl-<theme>-<item>` · `so-<set>`), so a rebuilt pool keeps every deal + the night's memory; OC7: TRIVIA LIGHTNING, CLOSEST
CALL, MISSING LINK + SPELLCHECK the same (trivia `[3 question ids]` · closest `[id]` · missinglink `[2 ids]` · spellcheck `[5 ids]`; keys `tv-` ·
`cc-` · `ml-` · `sp-<id>`) — Overclock keeps NO question bank in the room any more (`bank`, `trivia`, `tq`, `tUsed` gone: its own built bank,
never the live trivia service); `combo` = right answers in a row now + the match's best
— the OVERDRIVE feat). OC2: `rw` = THE ROUND WIN stored as challenge ci closes (logic.js#roundWin — the highest + not
shared; a tie = nobody; the server's REDLINE calls the same function), `tm` = each player's ms from the challenge's start to their finish
(FASTEST's clock; 30 000 if they never finished), `cr` = when a player's best streak was set (ci × 100 + the mark — BEST STREAK's tie-break).
All host-written in the same patch as `results`; `results` itself is unchanged.
OC5 — DUMB LUCK: `dl{ci:{pk{uid:lane}, lk, w}}` = the race, stored ONCE by the host when the odds board closes (`pk` = every locked pick — no
pick = no ticket, `lk` = the lock's server ms, `w` = the drawn winning lane = luck.js#dlDraw(seed, ci, the field, pk, lk)); every phone races
the same script from it (luck.js#raceScript) on the server clock, a new host reads it and never re-draws, the server replays it (the
HORSESHOE). A PICK rides the board's EXISTING fields — `oc/{match}/{ci}/{uid}` `{ p: lane + 1, n: 6, ok: 0, done: false }`, changeable until the
lock (NO rules change); `results[ci]` = the payouts (20 × (odds + 1) for a winning ticket, else 0), in the same shape as every challenge's.
The daily plug-in (OC5, off) adds `daily{day, v}` to a daily's game (js/games/overclock/daily.js).
Every client regenerates challenge `ci` with `generate(order[ci], {seed, ci, level, deal: deal[ci]})`; no challenge content is stored.
Score = round(100·ok/parts) + (perfect ? up to 60 speed bonus); ×2 on the final challenge. `ok` may be fractional
(Quick Count: off by one = 0.5; Signal Lock: per-round reaction credit 0.1–1, scored as round(160·ok/parts) with no
separate speed bonus). **Order (`logic.js#buildOrder`, seeded): no type repeats** — up to 19 challenges are all different
(Quick = 6 — THE DEFAULT since OC1, Standard = 12 of the 19 — `MODES` in meta.js, picked from a list in the options sheet); Marathon (24) has every type once plus 5 repeats, never back to back, repeats ≥ 8 apart.
A rematch FAVOURS the types the room hasn't played tonight (`buildOrder(seed, total, played)`, ×12 weight — OC1).
**Category spread:** every type has a `CATEGORY` (words, numbers, memory, visual, knowledge, reflex); the order never puts two
of the same category next to each other unless impossible (`categoryClashes(order)` is 0 for every generated match — tested
over thousands of seeds). Short matches draw types on the fly so they can avoid clashes too.
Newer types (LEXICON was cut in OC1): **timeline** (4 parts, one per item in the right place; OC6: THEME POOLS — four items of one theme dealt
per round, every pair 10+ years apart, `tlDeal`), **closest** (1 part, credit = smooth curve: ≤ 5 % off = 1, ≥ 60 % = 0;
no speed bonus — the closest player(s) get +60 instead, decided in `computeResults` from `ok`), **rewire** (2 parts; ok = solved +
0.6·reach for the unsolved one; `genRewire` builds a solved path then scrambles, always solvable). Bank-backed types pick
the night's deal (`deal[ci]`), or — no deal (a bank that didn't load at the start) — `bankIndex(seed, type, occ)` from a shuffled
per-match deck so a repeat in Marathon never deals the same entry. Standings last 12 s for timeline/closest (`standingsMs`) to fit the reveal panel. Unscramble also gets a reveal (the word,
the scrambled letters, how many cracked it) within the normal 6 s.
Update 2 types (all reveal for 10 s): **missinglink** (2 parts, 50 each; typed answer via an invisible input over letter boxes,
`linkAccepts`: case/spaces ignored, plurals + listed variants accepted; the exact answer locks in as typed; SKIP on puzzle 1;
`.oc.kb-open` + `--kb` from visualViewport keep it above the iOS keyboard), **spellcheck** (5 parts, one tap each),
(**make24** was CUT in OC2 — the owner, Nov 5: its type, bank, solver, screen + reveal are gone), **compass** (5 rounds of 3→7 turns, generated; instructions
at 760→550 ms each so 25 turns fit in 30 s — `COMPASS_SCRIPT_MS` ≈ 22.5 s is the scripted time, and the speed bonus only counts
time past it; the reveal animates every round's turns on mini compasses), **sortit** (12 cards, 5–7 per side, card window
2.6 s → 1.2 s; swipe (pointer events, velocity or 70 px) or tap a screen half or ←/→; ok = right − ½·wrong ≥ 0, scored
round(100·min(1, ok/10)), speed bonus only for 12/12 — `ok` reaches `parts` only then), **higherlower** (10 pairs, ok = streak,
a miss ends the run with p = streak + 1; pairs only within one stat, ≥ 1.2× apart or ≥ 10 years; first 3 pairs ≥ 2× / 40 years,
from pair 7 on the closer ones). No new DB fields: everything fits `p/ok/n ≤ 12`.
Types (18 — LEXICON cut in OC1, MAKE 24 in OC2): unscramble, memory, oddone, math, pattern, trivia, stroop (Color Clash), reflex (Signal Lock), count (Quick Count),
timeline, closest (Closest Call), rewire, missinglink, spellcheck, compass, sortit, higherlower, truefalse (True or False — `TF_FACTS` pairs must stay unambiguous; math statements are verified by a unit test).
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
**Trivia bank (LAST SIGNAL — OVERCLOCK left it in OC7 for its own built bank, `data/oc/trivia.json`):** questions are appended to
`game/bank/{i}` (obfuscated with key `code:matchId:q{i}`). Signal question `q` = `bank[q]`. The host keeps it topped up (Open Trivia DB
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

PRISM DROP `game`: `{ id:'prism', matchId, settings{mode: battle|rush|survival}, participants, seed, songs[ids], sd[ms], pl0 (playlist
position), phase: count|play|end|final, songStartAt, playStartAt (= a downbeat of song 0), endAt (rush: the song's last beat),
n0, out{uid:{at,place,rem,by,gone}}, ko{uid}, bd{uid badges}, duelAt, winner, results{uid:{sc,ln,lv,mc,se,best,ko,bd,pc,pn (pieces — PFIX-B),dz?,t?}}, calls{uid:{w,ok,bonus}} }`
(PD-2: `pc` perfect clears, `dz: 1` BATTLE's danger zone — the stack reached the top 5 rows, `t` SURVIVAL's ms survived; a player's `sv` carries
`pk` = the stack's peak height — inside `sv`, whose extra keys the rules already allow: no rules change).

GRIDLOCK `game`: `{ id:'gridlock', matchId, settings{mode: classic|salvo|royale|arcade, placeSec, turnSec}, mode, participants, names, size
(10 for 2–3 players, 8 for 4+), fleet [lengths], n0, order[] (seeded Classic turn order), phase: place|turn|aim|resolve|show|end|final,
phaseStartAt, phaseEndsAt, v (volley number), rk (= String(v), the key under glshot/glres), round (simultaneous modes), ti, cur (Classic
shooter), fire{uid:[{t,r,c,k?:'cluster'} | {t,k:'torpedo',axis,idx,dir}]} (the volley being resolved / shown), acts{uid:{a,…}} (the cards
played this volley, public from resolve), ev[] (the volley's events: shield/relocate/sonar/shot/torpedo/sunk/elim/pts — every phone plays
them on the server clock), boards{uid:{cells{"r,c":{by,h}}, sunk{slot:"r,c,len,d"}, left}}, pts{uid}, stats{uid:{sh,hi,sk,el,ab,bl,bp}},
hand{uid:[card]} + cardN{uid} (Arcade; cards are public, their aim is not), out{uid:{at,place,rem,by,cap?}}, bounty (3+ fleets only),
done, winner, capped, results{uid:{pts,sh,hi,sk,el,acc,ab,bl,bp}}, calls }`. Unhit ships are never in it.
GRIDLOCK player nodes: `glready/{m}/{uid}`; `glshot/{m}/{rk}/{uid}` = Classic `{ t, r, c, at }` or simultaneous `{ ts{target:true}, x
(obfuscated shots + ability payload), a?, at }`; `glres/{m}/{rk}/{target}` = `{ r{shooter:[{h 0..3, s?, cr?, cc?}]}, k{slot:geo}, by?:'host', at }` (the host only);
`glcall/{m}/{uid}`. Top level: `fleets/{code}/{m}/{uid}` (owner + host read; owner writes while placing, or in Arcade `aim` with a RELOCATE
card before locking in) and `glsonar/{code}/{m}/{shooter}/{rk} = { n, at }` (written by the HOST only — APP FIXES — read by the shooter alone).

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


## Profiles + THE BOARD (top level, server-written — `docs/profiles.md`)
```
profiles/{pid}:   { n, nk (name key), t (tag "4821"), mn (THE VAULT 2B — the MEMBER Nº, server-only), a, c, x (XP), r (rank 0–4), at, h? (off the boards), m (counted matches — BNAME's
                    3-match floor) }   read: signed-in, ONE pid at a time (never the list — BNAME, Oct 28)
uids/{uid}:       pid                                     read: that uid. The device ↔ profile link
pstats/{pid}:     { xp, g{game:{p,w,…counters}}, wk, gw{game:{…}} (this week), b{board:{a, w, wk}} (records), day{k, g{}},
                    last, m{matchKey: at} (matches already counted),
                    dl{n, last, days{<day>: {g, x, sw?}} (DFIX2 — the two newest days' counters; day{k, …} = a mirror of the newest), early, ph (PENTHOUSE days — granted at THE DAY'S CLOSE),
                       sw, sr{d, n} (DM2 — swept days IN A ROW: PERFECT WEEK), sp{d, n} (DFIX2 — the run held while yesterday may still sweep), sb (the best run)},
                    ls{game: 1} (DM2 — a daily's first-time lesson seen: THE PRACTICE HARBOR),
                    xw{wk, x, bf?} (BOARD 2.0 A — the XP earned THIS WEEK: THE OVERALL BOARD; core/progress.js#payXp),
                    dp{d{<day>: {g{game: pts}, t}} (16 days), w{<wk>: {t, g{game: t}}} (2 weeks), a{t, n, f, l, g{game: {t, n, f, l}}}} (BOARD 2.0 A — DAILY POINTS) }       read: the profile's owner (written by /api only)
ppriv/{pid}:      { kh (key HMAC), keyAt, at, nameAt, opt? (opted out), ban? (admin), uids{uid: at} }  server only
pkeys/{keyHmac}:  pid          tags/{nameKey}/{tag}: pid          rl/{bucket}: { n, t } (restore attempts)   server only
lb/{board}/{period}/{pid}: sort value (higher is better; period 'all' | 'w20261012')                 server only (read via /api/board)
                  BOARD 2.0 A: + the OVERALL boards — lb/xp/… (XP: the week's / the total) · lb/daily/… + lb/daily-<game>/… (DAILY POINTS: the week's sum /
                  the average a day × 100 from 10 days)
results/{code}_{matchId}: { st: busy|done, at, g, mode, n, src: room|snap, by, rej?, o{pid: outcome} }   server only
audit/{push}:     { at, by (admin pid), act, pid, … }                                                  server only
flags/{boardId}:  { pid, n, why{score|name: n}, b{board: n}, first, last }  THE BOARD's REPORT (BNAME)      server only
rooms/{CODE}/players/{uid}/pid: the player's own profile id (rules: must equal uids/{auth.uid}; LOBBY FIXES: refused while seats/{pid} is ANOTHER uid's)
rooms/{CODE}/players/{uid}/dy:  true while this phone has a daily run OPEN or HELD (DFIX2 — THE MID-DAILY FLAG: the host's "N PLAYERS ARE MID-DAILY" reads it; a boolean, the player's own; js/daily/room-flag.js)
seats/{pid}:      { code, uid, at }                       read + write: the profile's own devices (uids/{auth.uid} === $pid; uid = the writer; at = now). ONE ACCOUNT, ONE ROOM (js/seat.js)
dly/{game}/{day}/  s/{pid} startedAt · r/{pid} score · x/{pid}: 1 (DM1 — a NON-COUNTING result: THE THROWAWAY GATE) · h/{bucket} · n · p/{pid} a judged run's record ·
                   b: the day's data (DM1 — THE 4 AM PICKER: THE PASSWORD's pair { v, w } · COAST CLEAR's board) ·
                   c: { at, st: 'busy' | 'done', n, w: [pid…] } (DFIX2 — THE DAY'S CLOSE marker: PENTHOUSE's winners, once)       server-only (the rules' default deny)
dsched/password:   { v, s: 'W,W,…', c, h } — DM1: THE FROZEN SCHEDULE (api/_lib/pw.js)                                       server-only — never a committed file
dsecret:           { v, k: { '<fromDay>': hex } } — DM1 ADD-ON: THE DAILY SECRET (api/_lib/daily-secret.js; never the pepper)     server-only — never a committed file
progress/dailies:  { on: true, at, by } — DM1: THE GO-LIVE SWITCH (absent = OFF; /api/admin dailySwitch, the owner)            server-only
rl/dc_{uid} · rl/np_{ipHash}: DM1 — the daily call budget (400 / 10 min) · new profiles per IP (20 a day)                     server-only
rooms/{CODE}/players/{uid}/ln: 'L' | 'R' — LOBBY 2.0 A: the side of the speakeasy's door this player queues on (the room in the city), picked once
  at the join (core/room-lines.js#pickLine — the shorter line) in a SEPARATE write (a join never depends on it); rules: L or R, your own node
rooms/{CODE}/meta/go: { at (the server's now), m (matchId), g (game id) } — LOBBY 2.0 B: THE GAME START's stamp, written by the host FIRST (before the
  match is prepared); every phone runs the 2.6 s walk inside from it (core/room-show.js#startShow); the game's clock = at + START_MS; cleared at the end
rooms/{CODE}/meta/back: { at, m, g, rm } — LOBBY 2.0 B: the match's end (host): the walk back out, THE WINNER's BANNER PLANE (bannerAt), the REMATCH
  ring while rm (false once the host picks another game); cleared by the next start
pfr/{pid}:        FRIENDS A — { f{pid: at} friends (both sides), in{pid: at} / out{pid: at} requests (30 days), b{pid: at} blocks,
                    rp{pid: at} recently played with (verified matches, the newest 40), inv{pid: { r (room), ca (its createdAt), at, until, n }} }
                    read: the profile's OWNER only (uids/{auth.uid} === $pid); written by the server only (/api/profile — docs/profiles.md "FRIENDS A")
ppriv/{pid}/ps/{k}: FRIENDS A — INVITE NOTIFICATIONS' push subscriptions { endpoint, keys{p256dh, auth}, at } (≤ 4)   server only
radio/crewIc:     FRIENDS A — THE CREW INTERCOM's switch { on, at, by } (default OFF); radio/limits/{room}/{night}/ic = the crew's clips tonight   server only
rooms/{CODE}/rv/{uid}: matchId — LOBBY 2.0 B: THE REMATCH VOTE — your own vote for the match just played (only while meta/back.rm, the room in the lobby,
  you a player); the host clears them all (a start, another game)
```

## THE CONNECTION (CONN, Oct 28)
The Realtime Database socket is PARKED until something wants it (`js/firebase.js#want` / `release`; CLAUDE.md → Multiplayer mechanics):
a phone on the title holds none (anonymous auth is HTTPS, not a socket); HOST / JOIN / a resumed room / an invite's check opens it; a
room keeps it the whole time (presence + onDisconnect + host election); 30 s after the room (QUIT, closed, kicked) it goes offline, and a
tab hidden 2 min with no room too. Nothing in this file needs the socket outside a room except `city2/live` for an admin. The before /
after socket table: docs/harbor/plan.md (the CONN row) · the proof: tests/integration/e2e-conn.mjs.

## CITY 2.0 — THE PREVIEW PANEL (top level, server-written — `docs/harbor.md#the-preview-panel`)
```
city2/live: { v: 1, kind: 'preview', state (core/harbor-remote.js: { force: [ids], text?, show?, colours?, when?, speed?, wx?, scene?,
              party?, hol?, debug?, … }), params (the same as URL flags), label (the status line), startAt (server ms), until, by (pid) }
              read: signed-in users · write: the server only (/api/admin cityLive / cityClear). Every phone on ?city=2 plays it from
              startAt until `until`; the default city never reads it. CONN (Oct 28): only ADMINS listen to it live (the panel open
              on the title); every other phone reads it through `GET /api/admin?live=1` ({ live: { state, startAt, until, by } | null,
              at }, edge-cached 15 s), polled ~45 s while visible — no database socket on the title.
```

## RUMRUNNER (`docs/rum.md`)
```
game: { id:'rum', matchId, participants, n0, settings{days, daySec}, day, dk (day as a string), phase: intro|dawn|day|night|final,
        phaseStartAt, phaseEndsAt, days{d: { w, f, news[{dist, good, k, m}], p{dist{good: price|0}}, at{uid: dist}, hot{uid: true}, m{dist{good: impact}} }},
        nw{uid}, nwh{d{uid}}, books{uid{d: log}} (after the last day), final[{uid, rank, nw}] }
rooms/{CODE}/rrpub/{m}/{d}/{uid}: { nw, done?: server time }                 ← own, during that day; public (the live board, the early end)
rrp/{CODE}/{m}/{uid}/{d}: { ev{i: choice}, a[[type, …]], dest, at }           ← top level; owner reads; the host at night / final; written only during that day
```

## HIGH STAKES (`docs/stakes.md`)
```
game: { id:'stakes', matchId, participants, n0, dplan[11], round, rk, phase: intro|cat|bet|q|show|stand|final, phaseStartAt, phaseEndsAt,
        qStartAt, plan{round:{i, cat, d}}, res{round:{uid:{b, a (-1 none), ok, d, t}}}, reveal{round: correctIndex}, order[] (final reveal),
        bank{i: enc}, qmeta{i: "cat|d"} (public), trivia{n, token, lastFetchAt, fails, seen} }
rooms/{CODE}/hslock/{m}/{rk}/{uid}: { b?: server time, a?: server time }   ← own, public flags only, only with the hidden value behind them
hsbet/{CODE}/{m}/{rk}/{uid}: { b: { b, at }, a: { a 0-3, at } }            ← top level; owner reads; the host from 'show' on; once each, in phase
```

## HOLD'EM — THE DEALER (HE2 — `docs/holdem.md` "THE DEALER"; HE3 — THE LEAN WIRE + the table screen)
```
hrec/{CODE}: { j, seq, due, id, ended, at }   ← THE RECORD — SERVER ONLY (the rules' default deny; HE5: j carries `lv` — the queued LEAVE AFTER THIS HAND, uid → hand; the public view's players[uid].after says it): j = the whole match as ONE JSON string (the deck,
                                                 every hole card, the hand log, the queued pre-actions, the pause stamps); due = the next moment
                                                 the server's clock acts (a poke with nothing due = 5 small reads: this, the room membership, the
                                                 kick, the two seqs); written by POST /api/report { holdem } only. HE10 (A16): DELETED (+ hole/{CODE})
                                                 8 s after the match's end once its result is sent, or on a poke from a NEW room with the same word
rooms/{CODE}/holdem: { seq, at, m/…, t/…, s/{i}/{f}, p/{uid}, e/{n} }   ← THE PUBLIC TABLE as THE LEAN WIRE's parts (HE3 — js/games/holdem/wire.js:
                                                 each part one JSON string; only the changed ones written) — any signed-in reader, NO client write
                                                 (the host included): publicOf(rec) (no deck, no unshown card); a late publish is HEALED by the next call
rooms/{CODE}/meta/activeAt                    ← HE3: the dealer stamps it with its writes (≤ once a minute) — a long match never idles out
hole/{CODE}/{uid}: { h, c?: [2 cards], pre? } ← a seat's PRIVATE VIEW — read by that uid only, never once kicked; no client write
```
A new match replaces `hole/{CODE}` whole; an abandoned record (the room closed, its HUSH WORD reused) is replaced by the next `start`.
Results: `results/{CODE}_{matchId}` (`src: 'dealer'`) like every room match.

## dly/ — THE DAILIES (server only — the rules' default deny; docs/progression.md "THE DAILY CONTRACT", docs/password.md, docs/coastclear.md)
```
dly/{game}/{day}/s/{pid}: startedAt    ← ONE OFFICIAL TRY (a refresh = the same try); day = the streak-day key (4 am Eastern)
dly/{game}/{day}/r/{pid}: score        ← the first finish (a transaction); h/{bucket}: count · n: finishers (THE STANDING)
dly/{game}/{day}/p/{pid}: record       ← a JUDGED daily's record: THE PASSWORD { g: { 0: [words], 1: [words] }, e? } · COAST CLEAR { st, mv, p?, e?, o? }
dly/coastclear/{day}/b: board          ← the day's board, built once from THE DAILY SECRET (never served)
dly/{game}/{day}/c: { at, st, n, w }   ← DFIX2 — THE DAY'S CLOSE (api/_lib/daily-close.js): claimed by the first start / today after 4 am Eastern (st 'busy' → 'done'),
                                          n = the counting finishers, w = PENTHOUSE's winners (rank ≤ max(1, ⌊n / 100⌋), n ≥ 50)
```
A run's calls name its own day (DFIX1): today's or yesterday's with a start there. Never pruned yet (THE DAILY MODULE's; before ~500 players a day).

## gifts/ (SHELL 2.0 B2 — server only)
```
gifts/{card id}: { pid, at, by }    ← THE GIFT TOOL's lock (api/_lib/gifts.js): a 1-of-1 gift card belongs to ONE profile EVER — taken in a
                                      transaction before the grant; nothing clears it. Read + written by nobody but the server.
ppriv/{pid}/gift: { id, at }        ← the reveal waiting ("A gift from the house" on the next open — /api/profile giftCheck / giftSeen)
```

## members/ (THE VAULT 2B — server only)
`members: { next, filled, claim }` — the MEMBER NUMBER counter (`next` = the next number; only moves forward), when the one-time back-fill ran, its
claim. Nobody reads or writes it but the server (the rules' default deny). Each profile's own number: `profiles/{pid}/mn` (api/_lib/members.js).

## THE RULES FROM CLAUDE.md (moved Nov 13)

THE CLAUDE.md DIET (FR7 FIXES C, Nov 13): CLAUDE.md keeps ONE line per rule with a pointer here; the full text it held for this area
is below, VERBATIM (as of `48e3e157`). New detail goes in the sections above, not back into CLAUDE.md.

### The data model block (as it stood)

## Data model (the shared core; every node and every game's `game` shape: `docs/data-model.md`)
```
rooms/{CODE}/       ← CODE = the HUSH WORD (a common 4-letter word; docs/content.md); hush/{WORD}: { closedAt } rests it 24 h after closing
  meta:      { hostId, status: 'lobby'|'playing', createdAt, activeAt, hostBeat, locked?, settings/{gameId}: {...}, go?, back? }   ← locked: LOCK THE DOOR; go / back: LOBBY 2.0 B's start + end stamps
  rv/{uid}:  matchId                                         ← THE REMATCH VOTE: your own vote, while meta/back.rm
  players/{uid}:  { name, color, avatar, joinedAt, pid?, ln?, dy? }    ← written by that player only (pid: their own profile id only, while seats/{pid} is theirs; dy: DFIX2's MID-DAILY flag)
  presence/{uid}: { online, lastSeen, v: 2, c: { connId } } ← ONE CHILD PER CONNECTION (APP FIXES): online = any c child left
  kicked/{uid}:   true                                       ← host only
  game:      host-only; per-game shape; totals are always DERIVED from results (never stored) so a replayed step can't double-score
  night/{matchId}:   { g, p: { uid: 3|2|1|0 }, n: { uid: name }, b?: { uid: bonus }, at }  ← host; game-night scoreboard
  <game nodes>/{matchId}/…/{uid}                              ← a player's own data for the current step, phase-gated by the rules
chats/{CODE}/   fleets/{CODE}/   glsonar/{CODE}/   spy/{CODE}/   hsbet/{CODE}/   rrp/{CODE}/   seal/{CODE}/   hole/{CODE}/   ← top level: rooms/{CODE} is readable by any signed-in user, these are not (seal = THE SEAL: a round's secrets; hole = HOLD'EM's own two cards — HE2; hrec/{CODE} = the dealer's record, server only)
city2/live      ← CITY 2.0's PREVIEW PANEL for EVERYONE (server-written via /api/admin; admins listen live, every other phone reads the cached GET /api/admin?live=1; docs/harbor.md)
seats/{pid} (the profile's own devices — ONE ACCOUNT, ONE ROOM)  profiles/{pid} (signed-in, one at a time)  uids/{uid} (own)  pstats/{pid} (owner)  lb/ results/ ppriv/ pkeys/ tags/ rl/ audit/ flags/ (server only)   ← docs/profiles.md
```
Rules of thumb: a player writes only under their own uid; anything secret (fleets, agent cards) lives outside `rooms/`; the host
wipes `ALL_PLAYER_NODES` (registry.js) at match start/end; obfuscate (`core/obfuscate.js`) what must not be readable in plain sight.

### Multiplayer mechanics (as they stood)

## Multiplayer mechanics
- **THE PARKED DATABASE (CONN, Oct 28 — the free plan's 100 SIMULTANEOUS connections):** anonymous sign-in still runs at boot, but the
  Realtime Database socket opens only when wanted: `firebase.js#want(reason)` / `release(reason)` (reference-counted by reason — `'join'`
  while HOST / JOIN / a resume / an invite check runs, `'room'` from `enterRoom` to `exitRoom`, `'admin'` for the preview panel's live
  listener). Once nothing wants it, it goes offline after a 30 s grace; a tab hidden 2 min with no room parks too — NEVER while in a room
  (presence, onDisconnect + host election need the socket: a locked phone in a game behaves exactly as before). `dbRef()` with nothing
  wanting the line wakes it for a grace by itself (`'touch'`), so an unlisted caller never hangs — but a new feature that reads the
  database OUTSIDE a room must `want()` / `release()` its own reason. `state.net` = `parked` · `waking` · `online` · `lost`: only `lost`
  shows the SIGNAL LOST banner (a parked title is never "offline"). `serverNow()` keeps the last offset per device while parked.
  City 2.0's EVERYONE preview reaches non-admins through the edge-cached `GET /api/admin?live=1` (polled ~45 s while visible), never a
  socket. THE BOARD + /admin are /api only. Proof: `tests/integration/e2e-conn.mjs` (the sockets in every state; in the cloud's tests job).
- **Identity:** anonymous Firebase user per *slot*. Each slot is a separately-named Firebase app, so its
  auth persists independently. Phones are slot 1.
- **Rejoin:** `localStorage na:{slot}:session` holds the room code. On boot `resumeSession()` re-enters the
  room (re-adding the player node if it vanished). Boards/score come back from the DB.
- **Presence — ONE CHILD PER CONNECTION** (APP FIXES, Nov 1 — Grok 5.1: a refresh's OLD socket's late onDisconnect marked the player
  offline for the rest of the match): each `.info/connected` = true adds `presence/{uid}/c/{connId}` with `onDisconnect().remove()` (registered
  before the child exists), then `{ online: true, lastSeen, v: 2 }`, then an `onDisconnect().update({online:false,lastSeen})` (registered after
  the node exists — the server checks it against the node as it is). Online = any `c` child (`core/room-logic.js#presenceOnline`); every
  reader goes through `normalizePresence` (store.state.presence keeps `{ online, lastSeen }`). The room code is captured before the first
  await; while connected the client HEALS its own child (≤ every 5 s, a timed retry); leaving drops it. Proof: `e2e-presence.mjs` (the
  cloud's tests job). Offline players remain in the room as "SIGNAL LOST". The director doesn't wait for offline players.
- **Host migration (`core/room-logic.js#shouldClaimHost`):** host considered gone if its player node is gone,
  or (in the lobby) its presence has no connection for ≥ 10 s, or — during a game — `meta.hostBeat` (every 2 s) is ≥ 10 s stale: while a
  game runs the BEAT ALONE decides (a fresh beat blocks a claim whatever presence says; a stale one deposes a frozen phone whose socket
  looks online). Online players in join order claim with a stagger (+4 s per rank) via a transaction on `meta/hostId`; the rules check
  the same (10 s, the beat during a game, the claimer a live online player — not the stagger); `joinedAt` is set once at server time.
  A KICK stops every game write + presence (the rules want a live `players/{uid}` + no `kicked/{uid}`).
- **Director:** `host.js` ticks every 250 ms; if host, calls `module.prepare()` (asset/trivia top-ups, private host duties) and
  `module.step(game, {code, now, live, online})`, writing the returned patch. A per-transition in-flight guard prevents duplicate writes.
  A step may carry `$room: { 'meta/used/…': true }` side writes (stripped and written in the same atomic room update). When a step
  enters `final`, `host.js` writes `night/{matchId}` from `module.finalRanks(game)` (+ `module.nightBonus(game)` → `b`).
- **Per-game minimum:** a module may export `MIN_PLAYERS` (DOUBLE AGENT: 4). An option with `when(onlineCount)` only shows/applies when true.
- **Idle rooms close after an hour without a game** (`ROOM_IDLE_MS`); `meta/activeAt` is stamped when a game starts / returns to the
  lobby and every 10 min while one runs. The lobby warns for the last 10 min (host: KEEP OPEN). Rules let anyone delete a room idle > 1 h.
- **Rematch / late joiners:** `rematch()` (host.js) restarts the same game with `meta.settings[gameId]` and every
  connected player — late joiners (who spectate the running game) are dealt in automatically.
- **Live player data:** each module's `livePaths(game)` names the player-written paths for the current step.
  `room.js` mirrors them into `state.live` and sets `state.liveKey` only once all have loaded.
  Directors and views must check `liveKey` before trusting `live` (a refresh must never look like "no progress").
- **Privacy pattern** (GRIDLOCK, DOUBLE AGENT, HIGH STAKES — whose host may read the hidden bets only once the phase is `show`; RUMRUNNER — private day logs the host reads only at night, and the server replays the whole city from the books): secrets in a top-level node readable by the owner (+ the host when it must act);
  the owner's client does the private computation and publishes only the public result; the host falls back after a few seconds
  or at once when the owner is offline; a rules test proves another player cannot read it. GRIDLOCK's results + sonar answers are
  written by the HOST only (it reads the fleets — a target could have answered "miss"). **THE SEAL** (APP FIXES — `games/kit/seal.js`,
  docs/data-model.md): a round's player-written SECRETS (BLUFF lies + votes, LAST SIGNAL answers, OVERCLOCK answers) live in
  `seal/{CODE}/{node}/{m}/{key}/{uid}` (owner-only), the room keeps `{ done, at }`; when the round closes the director writes
  `game/unseal/{node} = key` (PENCILS DOWN: no more writes, the host alone may read) — a module opts in with `export const sealed`;
  `sealGate` turns its director's "leave the phase" into "unseal first".

### The file layout (as it stood)

## File layout (top level; each game's files are listed in its doc)
```
index.html / sw.js / manifest.webmanifest / assets/     shell, service worker (network-first, same-origin static only, never /api), PWA, icons + og.jpg (+ og-board.jpg — /board's)
board.html admin.html                                    THE BOARD for anyone (/board, og-board.jpg) and the admin page (/admin)
api/ profile.js report.js board.js admin.js log.js sky.js time.js daily.js + _lib/   Vercel functions (firebase-admin): profiles, checked results, boards, moderation, errors + reports from phones (9e: SEND REPORT / the hang watch), live weather (+ NOAA's Kp), the server's clock (time.js: no imports, no-store)
package.json                                             only firebase-admin for /api (npm install at the root for local /api)
css/base.css components.css screens.css title.css        tokens + themes, the design system (+ NEON GLASS), setup/lobby, the title
css/kit.css                                              the match kit's default look (announcements, cards, Call the Winner, report)
css/board.css admin.css                                  THE BOARD, the membership card, podium plaques + rank-up; the admin page
css/<game>.css  (cipher signal overclock bluff pulse golf prism gridlock slip agent stakes rum holdem) + css/chat.css
js/config.js  firebase-config.js  firebase.js            APP_NAME, limits, colors, avatars, GAMES registry / the web config / init + db helpers + serverNow() + THE PARKED DATABASE (want / release)
js/identity.js store.js room.js host.js app.js wakelock.js   slots + saved session / state + subscribe / rooms, presence, listeners / host loop + director / router
js/core/  room-logic.js hush.js lobby-song.js party.js rainbow.js marks.js palette.js neon-ramp.js rng.js obfuscate.js night.js playlist.js sky.js weather.js insights.js tube-path.js   PURE: room codes + host election, HUSH WORDS, the lobby song, PARTY NIGHTS, RAINBOWS, the games' neon marks + the tube alphabet, the palette + the light timeline, THE NEON COMES ALIVE's plan, seeded RNG, XOR+base64, game-night standings, room playlists, the real sun / moon / seasons / holidays / eclipses (sky.js), Open-Meteo + NOAA's Kp → the weather, the admin STATS, SVG → neon tubes; harbor-*.js: City 2.0 (below)
          week.js ranks.js names.js nicknames.js pkey.js boards.js match-report.js   PURE (server + client): Eastern week keys, XP ranks, board-name filter, THE HOUSE NICKNAMES (BNAME), keys, board catalog, per-game results
js/profile/ api.js me.js queue.js public.js callouts.js events.js sheets.js keypop.js passkey.js passkey-ui.js  /api client, this device's profile, the results queue, room players' profiles, podium plaques (→ the end-of-round moment), the achievements' events
js/fx/ renderer.js gl.js kit.js index.js + one file per effect (gift.js + gift-specs.js: the gift cards' one engine + their layers)   THE EFFECT LIBRARY (THE VAULT 1A — docs/vault.md): ONE shared renderer (surfaces + slots) drawing through THE GL PAINTER (gl.js — WebGL2, a 2D look-alike: iOS rasterises a 2D canvas on the CPU call by call; 1B) with the 2D canvas as the fallback, the baked sprites, the effects
js/vault/ catalog.js strip.js emblems.js lab.js lab-views.js approved.js hero.js + css/vault.css + lab.html (/lab)   THE VAULT: the slim strips, the test emblems, THE CARD LAB (admins only, + its GIFTS), only-approved-ships, THE HERO-SPOT RULE
js/progress/ moment.js streak-card.js card.js profile.js flame-art.js look.js preview.js album-view.js extras.js sighting.js trophies.js + css/progress.css   PROGRESSION's screens (docs/progression.md; lazy): the end-of-round moment + level-up, the streak card, THE GILDED CARD + the profile's sections, the dock's flame, ?preview=
js/core/ levels.js streak.js items.js achievements.js daily.js progress.js   PURE (server + client): PROGRESSION — the curve, the streak, the items, the 33 achievements + the award engine, the daily contract, the server's steps · js/daily/contract.js (a daily's /api calls)
js/board/ view.js screen.js public.js audio.js  THE BOARD (scene.js = the old bar, shipped nowhere since BOARD 2.0 B): the board UI, app route, /board entry, its SFX
js/admin/admin.js                                        the /admin page
js/ui/    dom.js components.js final.js logo.js tube-logo.js game-art.js settings-panel.js help.js credits.js toast.js emblems.js debug-tools.js debug-strip.js word-neon.js   h(), the design system, the podium, the sign + City 2.0's SPEAKEASY tubes, game logos + lobby art, gear + settings, HOW TO PLAY, CREDITS (ADD A CREDIT = one entry in credits.js#CREDITS), toasts, emblems, the &debug=1 strips
js/audio/ settings.js engine.js music.js sfx.js ambience.js synced-songs.js mood.js lobby-music.js party-music.js beat.js diag.js tape-stop.js   prefs, the AudioContext + buses, music + playlists, SFX, ambience, songs on the server clock, MOOD MUSIC, the lobby's + City 2.0's PARTY song in sync (core/party-deck.js), the beat, the AUDIO panel, THE TAPE STOP (a decoded slice on a buffer source — the song element's playbackRate is NEVER changed: iOS stalls it). Session 'playback' with the music on, 'ambient' off; a dead graph hands the song to a plain <audio> (THE DIRECT PATH) — docs/audio.md
js/core/mp3-slice.js tape-math.js                        PURE: an MP3's frames → a byte slice in song time; the tape's rate schedule + its exact integral (docs/audio.md#the-tape-stop-in-web-audio)
js/trivia/                                               categories, API sources + filters, bundled bank, host feed (Last Signal / High Stakes / Bluff — never Overclock since OC7)
js/screens/ title.js title-neon.js title-taps.js title-dock.js setup.js profile.js backdrop.js   the front door in four files (the mount + the sequence · THE NEON COMES ALIVE + the race + the music's answer · the living city's taps · THE FLANK + its work — docs/title.md), name/avatar, the membership card, the menus' still of the city
js/screens/ room-city.js room-dock.js room-guests.js game-options.js room-banner.js   LOBBY 2.0 A + B — THE ROOM IN THE CITY (the roster → the city, the tags, the room dock, the guest list, the game's options, the game start, the banner + the champion; core/harbor-room.js + room-lines.js + room-show.js PURE)
js/games/cartridge.js  js/ui/layers.js                   THE CARTRIDGE PLUG (the contract + checkCartridge — docs/cartridge.md) · ONE SHEET STACK (every pop-up takes the next layer)
js/screens/harbor/ js/core/harbor-*.js + its sounds, bakes, canvas helpers   CITY 2.0 — THE HARBOR (?city=2): every file in docs/harbor.md#the-file-map (scene.js + its cuts: scene-fireworks / legend / holiday / weather / party / perf / panel)
js/daychart/  daychart.html                         THE DAY CHART (SCHED): the city's day + year from the planners — /daychart + a card in /admin (admins only)
js/chat/  logic.js chat.js ui.js                         PURE rules (locks, profanity) / data layer / the chat sheet + in-game button
js/games/registry.js lazy-view.js                        id → module (the contract), ALL_PLAYER_NODES; lazy view + stylesheet loading
js/errlog.js                                             errors from players' phones → /api/log → /admin (first import of app.js + board/public.js)
js/games/kit/                                            THE MATCH KIT: moments (announcer + cards), call, results, tiers, hook   → docs/match-kit.md
js/games/<id>/  logic.js director.js index.js view.js (+ scene/audio/…)   PURE rules / PURE state machine / contract + host duties / the screen
data/     trivia bluff oc words agent pulse prism slip    the banks and song analyses (formats in docs/content.md and each game's doc)
data/hushwords.json  scripts/hushwords/                  HUSH WORDS (room codes): built + checked by scripts/build-hushwords.mjs (docs/content.md)
audio/music/*.mp3  audio/pulse/*.mp3                     music (≤ 4 MB each; bump music.js#REV when replacing a file), PULSE songs; `c2-*.mp3` = the owner's City 2.0 mood songs (112 kbps, −16 LUFS)
audio/sfx/neon-*.wav  audio/weather/*.mp3                 City 2.0's recorded neon (scripts/build-neon-sfx.py; docs/audio.md), the thunder
scripts/  serve.mjs build-*.{mjs,py} add-city2-music.py validate-holes.mjs sim-gridlock.mjs split-closure.mjs   local server (:5173, `--emu` also runs /api on the emulators), THE CLOSURE SPLITTER (a run of a big closure → its own file, names rewired through live accessors — CITY 1.0 OUT; dev only), builders (build-synth-sfx.py: city sounds SYNTHESIZED — the hydrant's spray, the periscope's sonar ping — then imported by add-city-sfx.py; add-city2-music.py: the one command that imports the owner's mood folders), the NEON PAR hole bot, GRIDLOCK balance sim
database.rules.json                                      RTDB rules — paste into the Firebase console after every change
tests/*.test.mjs                                         unit + whole-match simulations (node --test, no deps)
tests/integration/  kit/harness.mjs e2e-*.mjs harbor-e2e/ (the Harbor suite: kit + one file per cloud job) title-perf.mjs pixdiff.mjs rules.test.mjs server.test.mjs *-preview.html   the E2E harness, per-game suites, rules tests, /api tests, no-Firebase look previews
tests/fixtures/finals.mjs                                finished matches of every game (profile/board tests)
```
