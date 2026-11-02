# CITY CONTROLS B — the owner's CC-A review + THE INTERCOM + THE CREW + PRESETS + "A ROOM JUST OPENED" (Nov 2 2026)

The owner's notes: `docs/harbor/plan.md` "OWNER'S NOTES — NOV 2 (afternoon)" (Progression 2.0 + THE VAULT decided, the CC-A review, THE
NO-TRAFFIC RULE: build it complete now, dormant where it must be). The decisions in force: `docs/harbor/decisions.md` §1, §2, §15. Mockups
(read-only): `~\Downloads\NEON\city-controls\` (the crew's desk = the same look, cut down).

## What changed

### Group 0 — the owner's CC-A review
- **THE AUDIENCE KNOB: three words** — JUST ME · LOBBY ONLY · EVERYONE (`core/harbor-radio.js#AUDIENCES`; CITY ONLY dropped — an old 'city'
  moment still plays). The knob lists all three, the current one lit; LOBBY ONLY's note: the sky moments play once LOBBY 2.0 puts the
  lobby in the city, the intercom plays there now. The patch cards' "goes to …", the strips + THE PROGRAM's tags use the same words.
- **SKYWRITE IN COLOURED SMOKE** by day too (`smoke.js` — a sprite per colour + light; RAINBOW by the letters' columns; `&colour=` on the
  skytype preview + its panel row); the card's preview takes the colour.
- **TAP A LIT JACK** → its card again with a big STOP (running) / CANCEL (queued) per moment + FIRE ANOTHER.
- **NO LONG-PRESS**: a tap is the button's own click (never a scroll); arranging only through a small ARRANGE button (off by default → DONE).
- **A BIGGER, BOLDER ✕** on every pop-up (48 pt, white on black, a cream ring).
- **THE FINALE's GOLD WILLOW SWEEP** — left → right, edge to edge (x 0.05 → 0.95): each willow launching after the one to its left
  (`fireworks.party.curtainStep` 0.26 s; on the song `curtainBeats` 0.5 — half a beat), the rises evened (1.85 / 1.75) so the bursts keep the
  order, the sweep's willows hang ×1.4 (`fireworks.js`) so the whole curtain stands together at the end; CC-A's eggs → willow gap kept.

### Group 1 — THE INTERCOM
- `core/radio-intercom.js` (PURE: the server's whitelist, the headline, WHEN a phone plays it), `api/_lib/radio.js#intercom / unsend /
  clipOf` (radio/ic + radio/clips, an hour; GET `/api/admin?clip=<id>` cached 60 s at the edge), `audio/intercom.js` (every phone's player),
  `screens/harbor/radio-intercom.js` (the owner's MIC, THE REVIEW, the sent strips), the `radio.intercom` timetable row.
- THE MIC: HOLD TO TALK (≤ 30 s, it stops itself), the ON AIR lamp + a level meter + the seconds; nothing leaves the phone before SEND.
  THE REVIEW: PLAY BACK (through the PA, his phone only) · the brass lever ON THE BILLBOARD (default ON, remembered) + the headline (≤ 24,
  a suggestion from the browser's own speech recognition) · WAIT FOR THE LOBBY / DON'T WAIT · DISCARD · SEND. UNSEND for 60 s.
- DELIVERY: JUST ME (his phone at once) · LOBBY ONLY (rooms/{CODE}/radio, kind 'intercom' — the room's socket: its phones start TOGETHER)
  · EVERYONE (the city's cached feed + every open lobby's node). A phone in a running game HOLDS it until the lobby / the title (≤ 1 h); DON'T
  WAIT plays over the game (its music ducked) — a game exporting NO_INTERCOM (true, or a function of the game) holds even that. Never over a
  legendary's own audio (the scene's `legendBusy`). The headline on the speakeasy's billboard while it plays (`harbor-billboard.js#
  setIntercomHead`, above every other message).
- THE SOUND: the vibraphone chime (419491, ~−14 LUFS) → the music ducks → the voice through a 1920s PA (320 Hz – 3.4 kHz, a presence bump,
  a touch of drive, a 110 ms slap echo) over the CFry crackle (~−34 LUFS) → the chime → the music back up (docs/audio.md#the-intercom).

### Group 2 — THE CREW (built complete; the sky moments dormant until LOBBY 2.0)
- THE GRANT (the owner only, server-side, follows the PROFILE): a tap on a player in a lobby → THEIR CARD with the brass CREW switch (the
  owner's radio listens for taps on the lobby's player list); THE CREW on THE LEDGER (emblem, name tag, when added, what they last fired ·
  REMOVE with a second tap · ADD BY NAME TAG); cap 10; no profile = no.
- THE CREW's DESK: the same desk cut down — their 11 jacks, a THIS LOBBY ONLY plate, no tuning window / mic / PROGRAM / LEDGER / CLEAR ALL;
  the audience locked to their lobby (none: every jack greyed "join a lobby"); the per-lobby limits + the 1-min cooldown grey a jack with a
  friendly note; the dormant note (queued + recorded now). Their moments are never sightings; the owner outranks them.
- ONE RADIO PER LOBBY (`core/harbor-radio.js#radioHolder`): the host if crew, else the crew member who joined first; it follows the host; a
  HAND-OVER holds until the host changes or that crew member leaves. The other crew's button DIMMED with a brass LOCK → THE RADIO'S WITH
  <NAME> TONIGHT (+ host your own lobby) + ASK FOR THE RADIO → the holder's "<NAME> WANTS THE RADIO · HAND IT OVER / KEEP IT" (on the
  page even with the radio closed — rooms/{CODE}/radioCrew on the room's socket) → THE RADIO'S YOURS. The server checks the holder on every
  fire. In a lobby the radio's backdrop is near-solid (the page behind is busy text, not the city).

### Group 3 — PRESETS (tucked away)
- "+ SAVE AS PRESET" under a patch card's FIRE → this card's set-up as a step of a new / an existing preset (radio/presets: ≤ 12, ≤ 6 steps,
  each re-checked by the live rules); each preset = one jack in its own last row → its card (the steps, ✕ each, the name, FIRE THE PRESET —
  each step through the server's own checks, one that can't go now is said, DELETE with a second tap).

### Group 4 — "A ROOM JUST OPENED"
- `api/_lib/push.js`: Web Push with no new service + no new dependency — VAPID (ES256) + the RFC 8291 aes128gcm encryption on node's own
  crypto; only the known push services' https endpoints; a dead subscription dropped. `createRoom` tells the server (fire and forget) →
  the room must be the caller's + brand new → once a room an hour, never the owner's own → "A ROOM JUST OPENED · <HUSH WORD> · 1 player"; a
  tap opens the site (sw.js `push` + `notificationclick`). THE LEDGER's paper: this phone ON / OFF (the permission asked inside the tap; an
  iPhone not on the Home Screen is told exactly how), the phones it goes to, SEND A TEST.

### Group 5 — the end
- Tests: unit (`radio-intercom.test.mjs`, the holder + tags, the sweep), rules (the crew's lobby node + radio/ic, clips, presets, push), /api
  (one CC-B test: the intercom, the crew, presets, the push + its encryption round trip), e2e `radio` (+ the knob, the colour, STOP / CANCEL,
  no long-press, the ✕, the intercom with a fake mic, presets) + the new `crew` group (the grant, the cut-down desk, refusals, one radio per
  lobby + ASK + hand-over, the cooldown, the owner's player card, the push to a local receiver — decrypted + its VAPID token verified).
- The thunder test seeded (a 1-in-3 flake: the lightning planner's Math.random).

## Decisions
- **LOBBY ONLY is shown, not hidden** — the intercom to a lobby works now; its note says the sky moments wait for LOBBY 2.0.
- **ARRANGE kept** as an explicit button (off by default) — reordering is still useful with 14 jacks + presets.
- **THE SWEEP = HALF A BEAT a willow** (the owner said "a beat after"): at a whole beat the sweep took ~4 s and each willow faded before the
  last one burst — the curtain never filled. Half a beat crosses the city in ~2 s, still on the song's grid, and the willows hang ×1.4 so
  the whole curtain stands at the end. One knob (`fireworks.party.curtainBeats`) if he wants the slower wave.
- **THE CLIP needs no new service**: base64 in the database through /api (~180 KB for 30 s at 48 kbps; an hour), a 60 s edge cache.
- **The chime is loaded by the intercom itself** (~−14 LUFS — it must read over music), never through the city's peak cap.
- **THE PLAYER CARD**: the app had no card to open on another player → the owner's tap on a player in a lobby opens THEIR CARD inside his
  radio (owner-only; nobody else's lobby changes).
- **THE PUSH says "1 player"** — a room has only its host at the moment it opens. Never for the owner's own rooms; once a room an hour.
- **THE VAPID KEYS** were generated on the mini PC into `vapid-keys.local.txt` (git-ignored) for the owner to paste into Vercel; the subject
  is `mailto:owner@neonspeakeasy.com`.

## Known issues
- THE CREW's sky moments + LOBBY ONLY's sky moments play once LOBBY 2.0 makes the lobby the live city (by design — the owner's rule).
- The intercom to EVERYONE reaches title phones within ~45 s (the cached poll — "NOW stays ~45 s"); lobbies ~2 s, together.
- Headless WebKit on Windows has no MediaRecorder / mic: the recording is proven in Chromium (a fake mic) and the review card shot in WebKit
  with a stub — the owner checks HOLD TO TALK on the iPhone (the first hold asks for the mic; a hold that ends before it's granted just
  asks again). The speech-recognition suggestion depends on the browser (iOS Safari: with Siri on).
- UNSEND: a phone that already fetched the clip (the edge keeps it ≤ 60 s) may still play it — the button stays for the minute it matters.
- The push needs the site ADDED TO THE HOME SCREEN on the iPhone (iOS 16.4+) + the Vercel env vars.
- THE FULL LOCAL RUN (the mini PC, alone, ~5 pm): 870/872 → the two re-run alone: the push paper's check read the "Checking…" placeholder
  under the 4-shard load (the test now waits for the paper's real words — green); LOAD WEATHER's soft timing check "a stored JUST ME jump
  into a holiday night: 0 changes after the reveal" fails at DUSK on CITY CONTROLS A's code too (a worktree of 45d9194, the same facade
  crossfade) — the suite loads on the REAL clock and 5 pm is the light's power-up; CC-A's run at 1 pm passed it. Not this pass's; the cloud
  treats it as a warning (TIMING). → a later pass: pin that load's real clock (or the light wave) before the jump.

## The hand-off to PROGRESSION A
The engine (levels 1–100 fitted to today's thresholds, the streak + freezes, YOUR TABLE, the daily contract, the achievements' counters,
"X% have this") — decisions.md §15 "PROGRESSION 2.0" + "THE DAILIES" + "THE ACHIEVEMENTS". The radio's record (`radio/fired`, `sight`) is
ready for the fired-moment sightings; CALL IN A FAVOR + BIRTHDAYS ride the crew's lobby system (one room, the same limits).
