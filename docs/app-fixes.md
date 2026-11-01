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
