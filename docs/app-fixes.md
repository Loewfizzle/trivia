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
