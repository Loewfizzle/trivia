# APP FIXES — THE GROK REVIEW's FINDINGS (Nov 1 2026)

An APP pass (not the city's look): the bugs a real player would hit, from Grok's read-only review of commit cdecc33
(`plan/grok-review-REPORT.md`; the profile / admin / second-tab part was PERF-A). Every finding was re-verified against
today's code before the fix — the line it was found on is quoted below. Every fix has a test that FAILED on the bug first.

**THE RULES DEPLOY:** this pass changes `database.rules.json`. The new rules accept BOTH the old and the new shapes (old
clients keep working while phones update); the old paths go in a later cleanup. The owner publishes them by hand in the
Firebase console — see "Publishing the rules" at the end.

---

## Group 0 — Step 0 + PERF-B's unconfirmed test fixes
- plan.md: "OWNER'S NOTES — NOV 1 (late morning)" appended; the BUILD TABLE (WEATHER + SKY + PEOPLE, WINDOWS rows; PEOPLE
  POLISH folded in); decisions.md updated (§1, §6, §7 the windows' redesign + the retired scenes, §8, §9, §10, §11, §13, §14).
  Commit `docs: plan.md — the owner's notes, part 45`.
- PERF-B's two restored pauses (holiday.mjs + wild.mjs): the flake check + the cloud confirmation are recorded in Group 6.

## Group 1 — PRESENCE + THE HOST ("I refreshed and the game skipped me")

| finding (Grok) | found in today's code | fix | test (failed first) |
| --- | --- | --- | --- |
| 5.1 THE LATE onDisconnect: a refresh / radio handoff leaves `presence/{uid}` offline for the rest of the match | `room.js#armPresence`: `await onDisconnect(pRef).set({ online: false, lastSeen: serverTimestamp() }); await set(pRef, { online: true, … })` — the OLD socket's queued set lands after the new page's write, and armPresence only runs on `.info/connected`'s rising edge | **ONE CHILD PER CONNECTION**: `presence/{uid} = { online, lastSeen, v: 2, c: { connId: ts } }` — each connection's `c/{connId}` is removed by its own socket (`onDisconnect().remove()`, registered before the child exists); online = any child (`core/room-logic.js#presenceOnline`, `v: 2` = the flag is ignored); `online` still written for older clients; every reader goes through `normalizePresence` (room.js's listener → `store.state.presence` keeps its `{ online, lastSeen }` shape for every screen + director; `core/insights.js` for /admin) | unit `room-logic.test.mjs` "ONE CHILD PER CONNECTION"; rules "presence: one child per connection"; **E2E `e2e-presence.mjs`** (a guest refreshes mid-question + the late onDisconnect: still online, the question waits for them) — old code 5/12, new 12/12 |
| 4.5 (part) THE SELF-HEAL | (none) | while connected, our own `c/{connId}` missing → write it again (at most every 5 s, a timed retry when throttled); never after leaving (`myConn` null) or for another room; the room code is captured before armPresence's first await | E2E "SELF-HEAL" (the node wiped to the old offline shape → back online by itself) |
| 4.4 THE HOST CLAIM: a fresh beat must block a claim | `room-logic.js#hostGoneFor`: `gone = Math.max(gone, now - meta.hostBeat)` (presence's "offline" won); rules `meta/hostId`: `presence/<host>/online === false && lastSeen < now - 8000` OR a stale beat — 8 s, no online check on the claimer | while `playing` (with a numeric beat) the BEAT alone decides — client + rules; the rules' thresholds 10 s (= `HOST_TIMEOUT_MS`); the claimer must be a live, unkicked, ONLINE player (`c` or the old flag); a host is gone by presence only with no `c` left | unit "a FRESH hostBeat blocks a claim"; rules "a FRESH heartbeat blocks a claim", "allowed when host offline > 10 s; refused at 9 s", "the claimer must be online", "a v-2 host with no connection"; E2E "HOST REFRESH" (the host refreshes + the late onDisconnect: not deposed, no phone even tries) |
| 4.5 `joinedAt` rewritable (a client sorts itself first in the claim order) | rules `"joinedAt": { ".validate": "newData.isNumber()" }` | written once, at the server's clock: `(data.exists() && same) \|\| (!data.exists() && === now)` | rules "joinedAt: written once at the server clock" |
| 5.3 A KICK STOPS GAME WRITES | e.g. `boards/$match/$round/$uid`: `… && root.child('rooms/' + $code + '/game/participants/' + $uid).exists()` (a kicked player stays in `participants`) | every player-written game node (24 rules) + presence need a live `players/{uid}` row and no `kicked/{uid}` | rules "a kick stops game writes", "a kicked phone's late onDisconnect can't write it back" |
| THE LOBBY CHAT STRIP LEAK | `lobby.js`: `import('../chat/ui.js').then(m => { if (!els.chatSlot \|\| !els.chatSlot.isConnected) return; …` — but `app.js` removes the old screen 380 ms after unmount, so a strip arriving in that window was never destroyed (its subscribe + onChat + 1.5-s interval ran for the rest of the tab) | a `dead` flag set at unmount, checked in the import's then; a late strip is destroyed at once; `globalThis.__chatStrips` counts live strips (a test hook) | E2E "LOBBY STRIP" (the chat module held on a slow line until the game starts: old code 1 strip alive, new 0) |

Notes:
- The emulator check showed an `onDisconnect().update()` is validated against the node AS IT IS when registered — so it is
  registered AFTER the node exists (step 3 of armPresence); the `v: 2` marker keeps the short gap safe (a socket lost before
  step 3 still reads offline once its child goes).
- The rules can't express the join-order stagger (the client keeps it); they now check the threshold, the claimer online, and
  the beat.
- `e2e-presence.mjs` runs in the cloud's `tests` job (after CONN, ≈ 35 s).

## Group 2 — THE RADIO + THE SONGS (`audio/party-music.js`, `synced-songs.js`, `engine.js`, `music.js`, `games/pulse/clock.js`, `firebase.js`)

| finding (Grok) | found in today's code | fix | test (failed first) |
| --- | --- | --- | --- |
| 3.3 AFTER THE LOCK SCREEN the station plays the OLD bar for ~6 s | `pulse/clock.js#sample`: the median of 24 samples (`offs.push(o) … sorted[sorted.length >> 1]`) — the pre-suspension samples held the old ctx↔performance map; `resetClock` was never called on a resume | `core/sync-math.js#clockStep`: a sample > 0.5 s off the map throws the old samples away + SNAPS; `resetClock` on every resume (`engine.onResume`); the voice's origin check then re-places it | unit `sync-math.test.mjs` "THE LOCK SCREEN"; harbor `stations` "AFTER THE LOCK SCREEN" (hidden 6 s → back in step): old code **6011 ms, −5965 ms off**; new ~470 ms, 50 ms |
| 3.4 A SUSPENDED / INTERRUPTED CONTEXT IS DEAD | `party-music.js`: `dead = !!ac && (ac.state === 'closed' \|\| clockFrozen())`; `music.js#graphDead` the same; `synced-songs#now()` reported a place from any state; the 8-s cover counted only while `running` | **THE DEAD-GRAPH RULE** `engine.js#graphDead`: closed · `interrupted` · frozen · stuck (a `suspended` one asked to resume that didn't in 1.5 s) → the synced player stops, this phone's own player takes THE DIRECT PATH at `partyCue().at`; `now()` null unless running + not frozen; the cover counts on any state once the first tap happened (visible) | harbor `stations` "A CALL": old code — the synced player "playing" on an `interrupted` graph (silent), `out: web`; new — `out: direct`, the station's song at its place (195.2 s vs 194.99 s) |
| 3.1 THE TITLE's CLOCK (offset 0 with a parked socket) | `firebase.js`: the offset only from `.info/serverTimeOffset` (or the last saved one) — a phone that never opened a room ran on its own clock | NEW `api/time.js` (`{ t }`, no-store, no imports); `firebase.js#syncTimeNoSocket` samples it twice (the shortest round trip; `core/sync-math.js#serverOffsetFrom`, \|offset\| < 1 day) 1.5 s after a visible boot + on return from the background (≥ 60 s apart); never over the socket's own offset; never a socket | unit "THE TITLE's CLOCK"; `e2e-conn.mjs` "THE TITLE's CLOCK" (a stubbed server 5 s ahead → `serverNow() − Date.now() = 5000`, 0 sockets) |
| 3.2 / 3.6 `stop(fade)` ignored its fade; the gain node leaked | `synced-songs#stop()` took no argument (always 0.6 s); `party-music#stopPartyMusic(hold \|\| dead ? 0.25 : 0.6)` passed one anyway; the node `connect()` made stayed on the music bus after every station change | `stop(fade = 0.6)` honoured; the node disconnected once the fade is over; voices disconnect `onended` | harbor `stations` "stop(fade)" (an in-page player: old `cut 0`, new `cut 1`) |
| 3.5 A JOIN NEAR A SONG's END | `synced-songs#start`: the fade-out `g.setValueAtTime(1, x0)` could land inside a 1.2-s station fade-in (a jump to full volume); `src.start()` unguarded; a restart stopped the old voice before the new one started | `core/sync-math.js#songEnvelope` — ONE monotonic envelope (the fade-out after the fade-in; a late join turns over from the value reached); `start()` in try/catch (disconnect on failure, `failures` counted); a re-place starts the new voice first, the old fades only if it started | unit "A JOIN NEAR A SONG's END" + the ordinary envelopes unchanged |
| 3.7 THE DIRECT PLAYER's SEEK | `music.js#startTrack`: one `el.currentTime = at` (iOS drops a seek before the metadata); `switchNow`: `positions[t] = 0` zeroed the station's cue | a second seek on `loadedmetadata` / `canplay` while the element is still near 0 and the cue is past 0.3 s; `switchNow` keeps a cue made in the last 10 s; app.js's forced mood switch is skipped while a station timeline runs (the station places its own song) | Chromium never drops the first seek (an iOS behaviour) — covered by "A CALL" (the direct path lands at the station's place); the owner's two-device test after the deploy |
| 3.8 A BACKWARD JUMP | `synced-songs#setGame`: `done` cleared only on a new matchId — a song that "played to its end" never came back after the panel moved the clock back | the same queue moved > 100 ms → `done` cleared; voices whose song isn't wanted stop (0.3 s) | harbor `stations` "A BACKWARD JUMP" (old: `again: false`; new: the song plays again, the next leaves its old place) |

Also fixed while in there: `synced-songs#debug()` listed a rebuilt context's dead voices (their gain + a time measured against the
NEW context) — `e2e-lobbysong.mjs`'s "STUCK: from its first moment back …" read one (9.6 s vs the host's 16.5 s — it failed on the
old code too); 12/12 now.

Checked, unrelated to this pass (they fail the same on the code before it): `e2e-prism.mjs` FAST "GESTURE: a fast flick down
hard-drops"; `e2e-slip.mjs` FAST "MUSIC: the ride's songs stay faded out under the results" (the audio never unlocked in that run:
`ready: false`); `e2e-pulse.mjs` N=3 "tier did not step down under heavy load" (a speed check on this fast machine; N=2 PASSED).
Harbor `music,tape,partysync` 137/137, `stations` 9/9, CONN green, unit 963.

## Group 3 — THE RULES' SECRETS + GRIDLOCK (Grok 4.1–4.3, 4.6)

**THE SEAL** (`js/games/kit/seal.js`, docs/data-model.md "THE SEAL"): a game's in-round secrets live in
`seal/{CODE}/{node}/{match}/{key}/{uid}` — OUT of `rooms/` (readable by any signed-in user). The owner reads + writes their own;
the room's old path holds only a public `{ done: true, at }` (the ✓ the others see). When the round is over (time, or everyone
in) the host writes `game/unseal/{node} = key` — PENCILS DOWN: the rules stop every write to that round's envelopes and let only
the host read them; then the director carries on exactly as before. The pure directors are untouched (they accept `done` for
"has filed"); `sealGate` (pure) turns "leave the phase" into "unseal first"; `registry.js#livePathsFor` adds `my_<name>` (your own
envelope, every phone — a refresh restores your lie / answer) and `seal_<name>` (the round's envelopes, for the host once
unsealed); `room.js#watchLive` takes absolute paths and re-runs on a host change; `host.js`'s in-flight key includes `unseal`
(the real step follows at once); the host wipes `seal/{CODE}` at a match's start + end (and `closeRoom`).

| finding (Grok) | found in today's code | fix | test (failed first) |
| --- | --- | --- | --- |
| 4.1 BLUFF's lie text + votes readable in-round | `bluff/view.js`: `set(dbRef(\`rooms/${st.code}/lies/…/${me()}\`), { t, at })` — the author of every lie in plain sight (the options' authorship is obfuscated in `game.ox`: "authorship stays hidden until the reveal" — the lies node gave it away) | lies + votes in THE SEAL; unsealed at the end of `write` / `vote` | rules "THE SEAL (bluff)" (a stranger / the host can't read a lie while writing; unsealed → the host reads; no writes after), "…votes…" |
| 4.1 LAST SIGNAL's choice | `answers/…/{uid}: { c, at }` | the choice in THE SEAL (`{ done, at }` in the room); unsealed when the question closes | rules "…signal answers…" (one answer, the host can't peek before the close) |
| 4.1 SIGNAL's unphased `targets/` | `targets/$match/$uid` writable in any phase, out or not | refused in the `final` and once you're `out`. Targets stay PUBLIC: every phone counts "N LOCKED ON YOU" | rules "LAST SIGNAL targets…" |
| 4.1 OVERCLOCK's word / order / guess / rewire | `oc/…/{uid}` carried `w`, `o`, `g`, `rw` beside the progress (CLOSEST CALL: everyone's guess before you lock yours) | the answers in THE SEAL, the progress (p · ok · n · done) in the room; at the end of `play` the host publishes them for the reveal as `game/rv/{ci}` (the number line, the longest words) | rules "…overclock answers…" (hidden while others guess, pencils down after) |
| 4.1 CIPHER's patterns | `boards/…/p` | **NOT MOVED — by design**: every phone shows each opponent's coloured rows (the mini grids) and every phone holds the word to grade its own guesses (obfuscated, the project's standard). The real hole was the trusted grade → 4.6 | — |
| 4.6 THE PERFECT IN-RANGE SCORE | `cipher/logic.js#computeRoundResults` took the phone's `p` + `solved` | `regradeBoards`: the host recomputes every row from the GUESSES (`g`, obfuscated or plain; junk can't crash the host); no guesses = no rows | unit `seal.test.mjs` "CIPHER": a one-guess "solve" with a wrong word → 0 pts; colours with no guesses → 0; `%%%` → no crash |
| 4.6 PULSE writes any time | `pulse/$match/$uid` had no phase check | only while a song `load`s / plays / echoes (`load` keeps the READY handshake) | rules "…PULSE boards…" (no score after the song) |
| 4.6 (where the host can't recompute) | golf physics, PRISM, SLIPSTREAM, PULSE taps, OVERCLOCK's per-part credit (timing-based) | left as friends-level trust; docs/profiles.md no longer calls those results "server-verified" | — |
| 4.2 GRIDLOCK's results from the target | `glres/$match/$rk/$target`: `(auth.uid === $target \|\| host)` — the target's phone could answer "miss" to a hit; the same for the sonar answer | **the HOST writes every result + sonar answer** (it already reads the fleets): `gridlock/index.js#prepare` resolves at once (no 4-s wait for the owner), the view no longer writes them; the rules take glres + glsonar from the host only | rules "gridlock resolutions: the HOST only" (the target's own "miss" refused), "…sonar…" (the scanned player's 0 refused) |
| 4.3 a fleet created late / deleted / any relocate | fleets `.write`: `phase === 'place' \|\| !data.exists() \|\| (arcade relocate …)` — a fleet could be CREATED after placement (laid out where the shots missed) or deleted | the owner creates only while placing, never deletes; a relocate keeps the ship count (the string's length); the HOST checks the rest on its fresh read (`abilities.js#legalRelocate`: the same lengths, at most ONE moved, a valid relocation — undamaged, inside, no overlap, never onto a shot cell); an illegal placed layout is replaced in the host's copy | rules (create after placement / delete / fewer ships refused); unit "GRIDLOCK" (two moved, a damaged ship, a longer ship, onto a shot, off the board, a vanished ship) |
| the janitor's query | `rooms/.read`: `orderByChild == 'meta/activeAt' && limitToFirst <= 25` | + `query.endAt != null` (an end is required). "…must END IN THE PAST" can't be enforced: the emulator never treats `query.endAt` as a number (even `query.endAt > 0` is refused) — Known issues | rules "stale-room cleanup" (+ no end refused) |

Old-rules proof: the 7 new / changed rules cases fail on the rules before this group; rules 55/55 after.
Also found + fixed (a stale test): `e2e-8p.mjs`'s expired-invite probe waited for `.nd-msg[data-kind="warn"]` — the title's note
is `.nd-note` (it failed on the code before this pass too).

## Group 4 — /api/report: NO INVENTED MATCHES ON THE BOARD (Grok 2.2)

A host writes `rooms/{code}/game` + `night/{matchId}` itself, so a room is only as honest as its host.

| hole | found in today's code | fix | test (failed first) |
| --- | --- | --- | --- |
| a night record without `at` skipped the 6-h cap | `if (night && night.at && now - night.at > MAX_AGE_MS)` | the record is REQUIRED with a numeric `at`; always age-capped; one from the future (> 60 s) refused; the rules: `night/$match` needs `at` = the server's `now` | server "INVENTED MATCHES" (no `at`, a future `at`, 7 h old); rules "game night…" (a future / missing `at` refused) |
| `night.n` names credited uids that never sat in the room | `if (!(players && players[u]) && !(night && night.n && night.n[u])) delete ex.rows[u]` | credit ONLY a uid with `rooms/{code}/players/{uid}`; the reporter too (else 403) | server "…a ghost in night.n…" (not credited; can't report) |
| a profile minted for anyone | `ensureProfile(u, { name: p.name … })` for a uid with no profile | never minted here — a uid without a profile isn't counted (each phone makes its own when it joins) | server "a player with no profile is not given one" (replaces "…get one from their room name", the old rule) |
| the snapshot path scored a client's blob | `match = body.snap` → `extractMatch(body.snap)` (records + scores from the request) | PLACINGS ONLY from the night record (`placingsOnly`: 3/2/1 → 1st/2nd/3rd, 0 → after the podium; no records, no mode); the reporter must be in `night.p` | server "forged …": a snapshot with 9999 pts counts the placing, writes no score |
| a forged CIPHER final | `game.results` taken as written | the room path checks the night record's placings against the game's, and for CIPHER every round's `solved` + rows against the players' own signed boards (`cipherAgrees`: re-graded from the guesses — `game.sx` now keeps every round's obfuscated word; a final without it can't be checked → refused) | server "a forged CIPHER final" (the host's "solved in 1" vs the boards → 409 mismatch) |

Old `/api/report`: 3 of the server tests fail; new 26/26. The other games' finals can't be rebuilt from player-signed nodes
(their results are the host's arithmetic over sealed / private / timing data) — Known issues. The 45-s gap stays.

## Group 5 — CHAT LOCKS + THE SMALL ONES (Grok 5.2)

| finding | found in today's code | fix | test (failed first) |
| --- | --- | --- | --- |
| HIGH STAKES + RUMRUNNER never lock chat | `chat/logic.js#chatLocked`: no `stakes` / `rum` case → `default: return false` | HIGH STAKES: locked in `bet` / `q` until your lock flag (`hslock/…/{uid}/{b\|a}`); RUMRUNNER: locked through the `day` until you're DONE (`rrpub/…/{uid}.done`); not synced = locked (as every game) | unit `chat.test.mjs` "chat locks: HIGH STAKES … RUMRUNNER"; `e2e-stakes.mjs` + `e2e-rum.mjs` "CHAT: locked … / open once …" |

| (found here) HUSH WORDS with an I or an O never reached the boards | `api/report.js`: `/^[A-HJ-NP-Z]{4}$/.test(code)` — the old random codes' alphabet; a hush word uses every letter (MOON, DIET, COIN…) → `bad_match` | any A–Z | server "a HUSH WORD with an I or an O (MOON)…" (400 on the old code); e2e-profiles in room DIET 49/49 |

The rest of Grok's report, checked: 1.x + 2.1 + 5.4 were PERF-A; 2.4 is "not a bug" (the preview's `by`); **2.3 `KEY_PEPPER`** is a
Vercel setting — the owner confirms it is set (see "DO THIS NOW"); nothing else small turned up in these files.

---

## Decisions
- **Presence:** one child per connection (Grok's "real model"), not just the re-write — a late onDisconnect can only remove its own
  child. `store.state.presence` keeps the old `{ online, lastSeen }` shape through `normalizePresence`, so no screen changed.
- **During a game the heartbeat alone decides a claim** (client + rules). The rules can't express the join-order stagger; they check
  the threshold, the claimer online, and the beat.
- **CIPHER's boards stay in the room** (every phone draws the opponents' coloured rows; every phone must hold the word to grade its
  own guesses). The fix is the host + the server re-grading from the guesses.
- **SIGNAL's targets stay public** ("N LOCKED ON YOU"); only phase-gated.
- **THE SEAL, generic:** one mechanism (`kit/seal.js` + registry + rules) instead of four bespoke ones; the pure directors are
  untouched (a gate in each index.js).
- **GRIDLOCK:** the host writes every result (it already reads the fleets) rather than "the host may overwrite" — the rules can't
  check a hit against an opaque fleet string; relocates are checked by the host (`legalRelocate`), the rules keep the ship count.
- **/api/report's snapshot path** builds placings from the night record only (no client blob at all); a report never mints profiles.
- **Old shapes accepted** by the rules this pass (old room lies / votes / answers with their secret; presence without `c`) — remove in
  a later cleanup once every phone runs this code.

## Known issues
- **The janitor's query** can't be forced to end in the past in the rules (the emulator never compares `query.endAt` numerically); an
  `endAt` is required. Rooms stay readable one at a time by code (a guessable hush word) — by design (joining needs it).
- **OVERCLOCK's per-part credit, NEON PAR, PRISM DROP, SLIPSTREAM, PULSE taps** stay phone-graded (timing / physics the host can't
  replay) — friends-level trust within plausibility bounds; docs/profiles.md says so.
- **The other games' finals** (beyond CIPHER) aren't rebuilt from player-signed nodes at /api/report (their results come from sealed /
  private / timing data); their placings must still match the room's night record.
- Pre-existing test failures seen while checking (they fail the same on the code before this pass): `e2e-prism.mjs` FAST "GESTURE: a fast
  flick down hard-drops", `e2e-slip.mjs` FAST "MUSIC: … stay faded out under the results" (its audio never unlocked), `e2e-pulse.mjs`
  N=3 "tier did not step down" (a speed check), `e2e-8p.mjs`'s OVERCLOCK part (an old `generate()` call; OVERCLOCK's own suites pass).
- iOS's dropped first seek (3.7) can't be reproduced in Chromium — the owner's two-device test after the deploy.

## Group 6 — the end: the local runs (the mini PC, before the one final push)
- unit 968/968 · rules 55/55 · /api 27/27 · smoke 14/14 (every game) · CONN (0 sockets parked, 1 in a room; the title's clock) ·
  e2e-presence 12/12 · e2e-profiles 49/49 · e2e-8p CIPHER (+ rematch) / LAST SIGNAL / BLUFF PASSED · OVERCLOCK `e2e-oc-new` 19/19 +
  `e2e-oc-2` 29/29 · GRIDLOCK (full: CLASSIC + an 8-phone ROYALE, host killed, offline owner, Call the Winner) 56/56 · HIGH STAKES 23/23 ·
  RUMRUNNER 35/35 · lobby song 12/12 · PULSE (N=2) PASSED · harbor `stations` 9/9, `music,tape,partysync` 137/137.
- **PERF-B's two restored pauses (Group 0):** `ONLY=holiday,weather,music` three times in a row — 177/177, 177/177, 177/177.
- One GRIDLOCK run timed out waiting for the ROYALE's first elimination (5 min of random bot targeting; every volley resolved in
  seconds — watched volley by volley on the re-run, which eliminated the first fleet in ~95 s and passed 56/56): a slow-random test, not
  a stall.
- **THE FULL HARBOR SUITE, alone: 804/805 in 19.0 min** (4 shards + panel + perf). The one miss: `fireworks` "THE SHOW IS HEARD … every
  boom on time" (its boom-timing list came back empty under the full load) — green alone 2/2 (waits 0.45 s / 0.22 s); a timing race
  under load, not this pass's code (the fireworks' sounds don't use the synced player).
- `harbor-jobs.mjs`: `stations` 29 → 40 s in the shard table (+ the lock screen + the call + the in-page player checks).

## Publishing the rules (THE OWNER — do this as the deploy lands)
Firebase console → Realtime Database → Rules → paste the whole new `database.rules.json` → Publish. The new rules accept BOTH the old
shapes and the new ones (old room lies / votes / answers with their secrets, presence without connection children), so publishing a few
minutes before or after the deploy breaks nothing. What waits on it: THE SEAL's envelopes (`seal/…` — refused by the old rules, so the
new BLUFF / SIGNAL / OVERCLOCK would show "TOO LATE"), presence's connection children, the host-only GRIDLOCK results, the night
record's time, the claim / kick / joinedAt checks.
