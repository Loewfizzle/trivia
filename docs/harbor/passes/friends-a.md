# FRIENDS A — the friends list, invites that wait, YOUR TABLE, the crew intercom, the key in the phone's passwords (Nov 7–8 2026, late night)

Step 0 = plan.md "OWNER'S NOTES — NOV 7 (late)" (part 76, 4447036) + decisions.md (FRIENDS' questions round → A / B; Face ID → B).
**RULES CHANGED: `pfr/{pid}`** — a new node (its owner reads it, nobody writes it but the server); nothing old changed → **RE-PUBLISH**
`database.rules.json` (the whole file: it also carries OC1's `ocm` / `ocnext` + B2's `meta/hostId` / `meta/hostBy`, which
`tests/fixtures/rules-live.json` still predates — harmless if those are live already). The ack: `tests/fixtures/rules-live.ack.json`.
**Functions: still 8 of Hobby's 12** — every new piece is an ACTION on `api/profile.js` (friends, invites, invite notifications) or
`api/admin.js` (the radio's switch); YOUR TABLE stays on `api/daily.js`.
Commits: Group 1 f86da30 · Group 2 f65dadc · Group 3 f396993 · Group 4 6920bde · Group 5 8f7dd0e · Group 6 9336da7 · the end (the harbor tag).
**NOT this pass** (FRIENDS B — not started): the fix list (OVERCLOCK FABLE REVIEW Part B: B2 the double victory sound, B4 the podium's repeats,
B5 the NIGHT · LOCKED row, B6 game toasts under the corner; THE FLYBY under the clouds; the slow-3G match screen; the cloud reds) + FACE ID /
PASSKEY sign-in. WASTELANDER's terminal text: dropped (the owner, 11:24 pm — fine).
**Servers:** my own fresh emulators + `serve.mjs --emu` on :5173 (restarted once mid-pass: Node caches `/api` modules, so the radio's new
actions needed a fresh process) — all stopped at the end.

## Group 1 — THE FRIENDS CORE (server + rules)
- **The data** (`pfr/{pid}` — js/core/friends.js's header): `f` friends · `in` requests waiting for you · `out` your requests · `b` your blocks ·
  `rp` RECENTLY PLAYED WITH · `inv` waiting invites. Server-written only; `database.rules.json` lets its owner read it (`uids/{auth.uid} === $pid`)
  — another player never, not even a friend. The phones get their list from `/api` (never a socket).
- **ONE PURE STEP** (`core/friends.js#friendStep(kind, a, b, A, B, now)` → `{ ok, rel, up }` / `{ ok: false, why }`): add · accept · decline ·
  cancel · remove · block · unblock; `up`'s paths are `a/…` / `b/…` → ONE multi-path update (`api/_lib/friends.js#friendDo`).
  - ADD → a REQUEST (`a/out/b` + `b/in/a`); a request from them already → ADD = ACCEPT; a second ADD writes nothing.
  - ACCEPT → both sides' `f` (a friendship is both sides); DECLINE is QUIET (only your `in` goes — theirs still says REQUESTED until they cancel
    or it ages out, so asking again never spams); CANCEL clears both; REMOVE is QUIET (both sides' `f` + their invites go — nobody told).
  - BLOCK → your `b`, the friendship + your request + their request to you gone, they leave your suggestions; their request to you LOOKS sent
    afterwards (only their `out` is written — they never learn). UNBLOCK in the BLOCKED list (doesn't tell them).
- **The caps** (`FR`): 100 friends · 20 requests out · 50 in (more → "their requests are full") · 200 blocks · requests age out after 30 days ·
  the rate limit `rl/fr_h_{pid}` 30 an hour + `rl/fr_d_{pid}` 80 a day (a refusal counts nothing) · no self-friend · the profile must exist.
- **RECENTLY PLAYED WITH** (`noteRecent`, called by `api/_lib/stats.js#applyMatch` — VERIFIED matches only): every credited player gets the others
  (`rp`, the newest 40 kept); the suggestions = the last 12 distinct, not friends, not blocked.
- **The badge**: `me` → `fr.in` (+ `inviteCheck` → `frIn`) = the pending requests' count.
- Proof: `tests/friends.test.mjs` (the pure rules) · `tests/integration/friends.test.mjs` (request → accept → both; decline; cancel; remove; block;
  the caps; the rate limit; a refresh = the same state; recently played with; invites; the push; the crew intercom) · `rules.test.mjs` FRIENDS A.

## Group 2 — THE FRIENDS SCREENS (`js/profile/friends.js` the data · `friends-ui.js` the screens · `css/friends.css`, prefix `fr-`)
- **The profile card's FRIENDS section** (after LEVEL / GOAL / STATS / TROPHIES, before MASTERY): REQUESTS (the player + ACCEPT · DECLINE under
  them — a 12-letter name never squeezed), the list (5 + ALL n FRIENDS ›), each friend's ⋯ → REMOVE FRIEND (quietly) · BLOCK (a second tap confirms
  each), SENT (CANCEL), RECENTLY PLAYED WITH (ADD / REQUESTED / ACCEPT), BLOCKED › (UNBLOCK), INVITE NOTIFICATIONS, YOUR TABLE's placeholder.
  Empty: "No friends yet — tap a player's name tag after a game to add them." /api down: "Your friends show here when the membership office is open."
- **The badge on YOU** (title dock + room dock): the pink count of waiting requests (`title.js#frBadge`).
- **ADD FRIEND on any player's name tag**: the room's player card (the line + GUESTS — above MAKE HOST / CREW), the podium (any other player → their
  card + ADD FRIEND), THE BOARD's ⋯ (the sheet is now that player: ADD FRIEND, then REPORT — the public `/board` keeps REPORT only). The button
  follows the relation: ADD FRIEND (pink) · REQUESTED (a second tap cancels) · ACCEPT FRIEND · FRIENDS (a green dot) · UNBLOCK.
- **THE GREEN DOT** (ONLINE STATUS = NONE everywhere else): a friend IN THIS ROOM WITH YOU, online → a dot on their emblem (`.rc-tag.is-friend`,
  `--good` — colour-blind safe).
- **THE INVITE SHEET**: with friends on this card, the room's INVITE opens a sheet — FRIENDS on top (each INVITE / INVITED / HERE), the line about
  iPhone notifications, SHARE INVITE LINK under it; with none (or /api down) INVITE shares at once as before (decided from the cached list inside the
  tap — the system share sheet needs the tap's own gesture).
- Look review: 390 / 402 / 430 + 1440 (e2e-friends' shots) + WebKit 402×874 @3 (wk-keychain's shots); two refine passes (pass 1 found the tubes
  white — `kind: 'main'` is THE NEON TUBE's pink, not 'primary' — the request row squeezing the name, JOIN ROOM WISH wrapping, the desktop card on
  the dock).

## Group 3 — INVITES THAT WAIT
- `friendInvite { pid, room }`: only from a player SEATED in that room (not kicked), only to a FRIEND (a friendship = neither blocked); the same friend +
  room once a 90 s; 20 an hour. Writes `pfr/{friend}/inv/{me}` = `{ r, ca (the room's createdAt), at, until (+30 min), n }` + THE PUSH to the friend's
  phones (`ppriv/{pid}/ps` — INVITE NOTIFICATIONS, ≤ 4 phones, the oldest makes room; a 404 / 410 drops one): "<NAME> invited you · JOIN ROOM
  XXXX", its TTL = the invite's 30 min, opening `/?room=CODE&inv=1`.
- **The card on the next open** (`js/profile/invites.js`, from the title ~3.4 s after the reveal — ONE `/api` call with the badge's count; never a
  socket): "A FRIEND'S INVITE · <NAME> invited you · JOIN ROOM XXXX · the invite waits n more min" — NOT NOW · JOIN. Held while a match runs (shown
  after it), while a legendary or a sheet is up. JOIN = the normal join (LOCK THE DOOR, kicked, full answer as for any join; in another room → leave
  it first). The server prunes an invite whose room closed, whose hush word now belongs to ANOTHER room (`ca`), or that's past 30 min.
- **The push's link** `/?room=CODE&inv=1` knocks by itself once the app is ready + the phone has a name (`title.js` — the check sits BEFORE the
  title's repaint guard; the link cleans itself); no name → setup first.
- Proof: friends.test (only friends, only from the room, the card, gone with the room / the reused word / NOT NOW / 30 min, a block ends it; THE PUSH to
  a local receiver — VAPID + aes128gcm, the TTL, a gone phone dropped) · `e2e-friends.mjs` 13/13 (two browsers: ADD → REQUESTED → the badge → ACCEPT
  → the green dot → INVITE → the waiting card → JOIN → the push link → BLOCK) · CONN 21/21 (0 parked / 1 in a room / 0 after).

## Group 4 — YOUR TABLE's data (for THE DAILY MODULE)
- `api/daily.js` `today` now reads YOUR FRIENDS LIST on the server (before: any pids the phone named — a stranger's daily was readable by id): at most
  **12** — a PICKED list (the phone's `pids`) kept to the ones that ARE friends, in its order; with none picked, the friends you PLAYED WITH most
  recently first, then the newest friendships (`core/friends.js#tablePids`). The answer adds `table` (the pids it covered). A friend's score shows
  only once YOU have finished that daily (a tick before — `todayView`, unchanged). The dailies are still `on: false`; tested under `DAILY_TEST=1`
  (progression.test: strangers → nothing, friends → ticks → scores, the order, the 12 cap).
- The profile card: a quiet dashed YOUR TABLE placeholder ("Your friends' daily scores sit here — the dailies arrive soon"). BOARD 2.0 + THE DAILY
  MODULE draw the real table.

## Group 5 — THE CREW INTERCOM
- **THE SWITCH** — THE LEDGER (the owner's radio) → CREW INTERCOM ON / OFF (`radioCrewIntercom`, owner only, `radio/crewIc` = `{ on, at, by }`,
  audited; DEFAULT OFF). OFF = the crew's mic not shown + the server refuses a crew send (`crew_ic_off`).
- **ON** — the crew member HOLDING THE ROOM's RADIO (ONE RADIO PER LOBBY) gets THE INTERCOM's hold-to-talk on their desk: "your voice to this room",
  UP TO 15 S, PLAY BACK · DISCARD · SEND; NOW only, no headline, no UNSEND. The server: the room they're IN, the holder, `aud: 'room'`, ≤ 15 s, 4 a
  room a night (`radio/limits/{room}/{night}/ic` — taken only once everything else passed), the owner's intercom path for the rest (the clip in
  `radio/clips`, the room's copy `rooms/{CODE}/radio/{id}` → every phone in the room plays it ONCE through audio/intercom.js — polish, the iOS
  unlock as before), the clip gone after the hour (`keep` — pruned on every read; `clipOf` refuses one past its hour).
- The numbers in THE CITY TIMETABLE (`radio.intercom` knobs → `crew: { maxS: 15, perNight: 4 }`).
- Proof: friends.test THE CREW INTERCOM (OFF by default → refused; only the owner flips it; ON → their room only, holding the radio, ≤ 15 s, NOW, no
  headline, no unsend, the 4 a night, gone after the hour; OFF again → refused; both flips audited) · server.test's CC-B (a crew send now answers
  `crew_ic_off`) · harbor `crew` (the switch → the holder's mic shows → OFF → gone + refused; crew-intercom-on.png).

## Group 6 — THE KEY IN THE PHONE'S PASSWORDS (`js/profile/keychain.js`)
- **SAVE TO PASSWORDS** under YOUR KEY's COPY / SHARE: a real `<form method="post" action="#">` — "SAVES AS NAME#1234" (`autocomplete="username"`),
  the key in a `type=password autocomplete="current-password"` field (rendered — a display:none field is skipped by both engines), a real submit.
  The submit is handled on the page: `PasswordCredential` where it exists (Chrome / Android), and the form LEAVES the page (the signal Safari's
  "Save Password" reads) → "If it asked, tap Save Password. On a new phone, RESTORE YOUR ACCOUNT fills it in for you." (+ marks the key saved).
  The key goes nowhere new (no request carries it; POST, so never a URL); the server still stores only its HMAC.
- **RESTORE YOUR ACCOUNT** + **BRING YOUR CARD**: the key field = `type=password autocomplete="current-password"` in a real form with a
  `username` field beside it + SHOW (a pasted key can be checked) → a new phone's AutoFill offers the saved key.
- Proof: `wk-keychain.mjs` 10/10 in WebKit 402×874 @3 (the form's fields + method, the submit leaves the page, nothing sent, the restore field) ·
  e2e-profiles 109/109 (RESTORE + BRING still work). **The real Save prompt = the owner's iPhone** (a headless engine shows no prompt).

## The end
- Locally: unit 1357 ✓ · rules 67 ✓ · `/api` (server 39 · friends 8 · progression 10 · sightings 4 · password 9 · coastclear 12 · lab · vault) ✓ ·
  e2e-friends 13/13 · e2e-profiles 109/109 · CONN 21/21 · smoke 6/6 · wk-keychain 10/10 · harbor `crew` + `radio` ✓ · THE FULL HARBOR SUITE (4 shards) 1211 / 1216: the five reds re-run alone → THE ROOM IS BLUE,
  A2 THE REBUILD, SIGHTINGS (the fireball), THE WORD TOWERS all GREEN (load flakes of the full run — the towers a known one); THE ROOM's OWN COST at
  4× CPU stays red — the SAME before this pass (an A/B against a worktree of 1b4d4a1 on :5174: 35.8–38.4 ms vs 35.3–36.4 ms alone), the known
  display-less red. One final push with the harbor tag.
- **Known**: the real iPhone Save Password prompt + the Home Screen push are only checkable on the owner's phone. INVITE NOTIFICATIONS needs the
  VAPID keys in Vercel (they're set for THE LEDGER's push — the same keys). The crew radio sheet's header ("NEON SPEAKEASY · RADIO" beside THIS
  LOBBY ONLY) crowds at 390 — older than this pass, left as it was. The friend tag shows #digits to your friends (private; it tells two ALEXes apart).
