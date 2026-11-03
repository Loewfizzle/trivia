# PROGRESSION B — CITY SIGHTINGS + BIRTHDAYS + CALL IN A FAVOR (Nov 2 2026)

Tap a legendary → its REACTION → the press-camera FLASHBULB + a REAL POLAROID of the player's own city → SPOTTED → the reveal of its MATCHED
PAIR (server-verified, no hint ever); THE ALBUM; BIRTHDAYS; CALL IN A FAVOR — and, as its last work group, the owner's PROGRESSION A review
(THE PIPELINE's add-on, with its extra lines). The whole system: **docs/progression.md** (CITY SIGHTINGS · BIRTHDAYS · CALL IN A FAVOR). The
decisions: decisions.md §15 (PROGRESSION B — DECIDED, THE OWNER's PROGRESSION A REVIEW), plan.md "OWNER'S NOTES — NOV 2 (night)" + "OWNER's
REVIEW OF PROGRESSION A — Nov 2, 8:46 pm EST".

## What changed
- **Step 0:** plan.md part 53 (the holiday signs built on the real sign before Nov 26, PROGRESSION A done, THE ARRIVAL LADDER dropped, the tap
  reactions, the real polaroid, birthdays) + decisions.md.
- **Group 1 — THE SIGHTING ENGINE:** `core/sightings.js` (PURE: one row per sighting; `verifySighting` = the seeded timetable — the showcase's
  legendaries, the TR-3B's chase for the F-22s + the Blackbird, THE WATCHER's Blackbird, the ghost ship, the aurora's nights + a real Kp
  storm after dark at the place, the fireball, the balloon flights replayed at the place — or the radio's record: the OWNER's moment to a real
  audience once a day per player; JUST ME, the CREW + every force never; forged / future / stale / far-zone claims refused); THE FIREBALL
  SEEDED (`core/harbor-fireball.js`, row `sky.fireball` — it was `Math.random` per phone); a balloon flight's line-up moved to
  `core/harbor-balloon-kinds.js` (the server replays it); `POST /api/profile 'sighting'` (`api/_lib/sightings.js`: the place + zone by IP,
  ONE count per appearance, the pair through A's award engine); the radio's record keeps until / len / made / local; the phone's claim +
  its offline queue; 16 unit tests.
- **Group 2 — THE TAP + THE REACTIONS:** `screens/harbor/sight-react.js` (the live tap boxes + the reactions' clock); nine reactions on the
  SAME sprites (below); the title asks the legendaries first (the aurora never steals a letter's tap). WebKit 402×874 @3 frame strips.
- **Group 3 — THE FLASHBULB, THE REAL POLAROID, SPOTTED + THE REVEAL, THE ALBUM:** `scene.snapshot` → `screens/harbor/snapshot.js` (the city's
  own canvases composed right after it draws); `js/progress/sighting.js` + `css/sightings.css` (the moment, held until a tap); THE ALBUM
  (`js/profile/album.js` IndexedDB bytes; `js/progress/album-view.js` on the profile); the owner's `&sgdemo` / `&sgagain` previews.
- **Group 4 — BIRTHDAYS + CALL IN A FAVOR:** `core/birthday.js` + `api/_lib/birthday.js` (private, once a year, the day in the zone; the city's
  HAPPY BDAY skywrite via `remote.js#localMoments`; MANY HAPPY RETURNS; the room's dormant copy); the radio's `favor` role +
  `api/_lib/favors.js` (the token reserved + handed back on a refusal); the profile's YOUR BIRTHDAY + A FAVOR (`js/progress/extras.js`).
- **THE ADD-ON (the owner's PROGRESSION A review + its extra lines):** the INTERCOM's WHEN; the moment on one screen (no pinned CONTINUE; "+N
  MORE"); the level-up held until a tap; the preview profile's ✕ bar; IVORY NAMES; THE PROGRAM in three sections; THE STREAK CARD = THE BIG
  FLAME (`js/progress/flame-art.js`, the same flame small everywhere).

## The reactions (how each legendary is built — all done on its own sprite + lights; none needed new art)
- **UFO** (legends.js, the baked model / the drawn saucer): the craft's transform wobbles (tilt + a small x / y shake) + the beam's level
  strobes. **TR-3B** (its full-res overlay): the three corner orbs light one after another round the points (+ the edge lamps + the hub ring
  speed up). **F-22s** (jets.js — the flyby + the TR-3B's chase): each jet's y + nose angle offset by its slot (the lead + #3 up, #2 + #4
  down), the burners up. **BLACKBIRD** (its page-frame overlay): the craft + plumes rotated nose-up about the tail, the plumes longer +
  hotter. **GHOST SHIP**: the lantern sprites flared (the stern's ×5 + a big halo). **SKULL**: the burner's flame ×2.5 + its warm light
  thrown over the envelope's face. **₿**: the burner flares, the balloon lifts, its lit glow pulsed gold twice. **AURORA**: the strength up +
  a travelling bump in the curtain from the tap's x. **FIREBALL**: its flare ×3.8 + a wide bloom + a shower of sparks.

## Decisions (what a feasibility check / the code made me choose)
- **THE CAPTURE (checked in WebKit @3 before building):** every city canvas composes into one with no taint (all same-origin) — the crisp
  lettering included; the compose costs ~1 ms on the main thread (the GPU does the copies) and the JPEG encodes async after the flash, so
  the frame loop never hitches (the harbor `sightings` group measures it). It runs INSIDE the city's frame, right after it draws, so the GPU
  fireworks' buffer is still that frame's. **The NEON sign + the tagline are not in the photo** — they're the title's SVG / text over the city
  (like the dock); rasterising the live SVG with its CSS glows isn't reliable on Safari, so the crop keeps below them where it can.
- **WHERE THE POLAROIDS LIVE: on the device** (IndexedDB — the JPEG's bytes, not a Blob: WebKit's private / ephemeral storage refuses Blobs),
  the first + the latest two per legendary (≤ 27 photos ≈ 8 MB); **the sighting record on the server**. Another device shows the card + the
  date. A server copy would need Firebase Storage (a new service, its rules, its bill) — not added, as asked.
- **THE FIREBALL WAS RANDOM PER PHONE** — no server could ever verify it. Now seeded by the evening's date (row `sky.fireball`: ~3 nights a year,
  one minute after dark, the same rate as before per watching visitor) — the same for every phone in a time zone.
- **THE PLACE:** the server judges "on screen" in the phone's own zone only when it's within an hour of the IP's (carriers are often a zone off;
  a VPN anywhere further is refused), the sun / the balloons at the IP's area (the same 0.5° area the city's weather uses).
- **THE BALLOONS are verified leniently:** the server replays the sky scheduler without the helicopter patrol (its planner needs the party
  deck) — a patrol only ever TAKES a slot, so the server's flights are a superset; the weather gate at the flight's start is the phone's.
- **THE AURORA's clouds are taken on trust** (the server can't see the phone's sky): its seeded night / the real Kp + the sun well down at the place.
- **A queued claim** (offline / `/api` down) is accepted up to 12 h later (the timetable decides as if live); a determined cheater who reads the
  open timetable could time a fake claim — cosmetic only (anti-cheat never depends on secret code; noted below).
- **THE RADIO's once a day = one owner-fired sighting a day per player, any legendary** (not one per legendary) — the owner's fires can't farm.
- **THE WATCHER's Blackbird** counts when the server's own watch clock (THE WATCHER's `ws`) says 55 min — once a day.
- **The tap order on the title:** the legendaries are asked before the sign's letters (a near balloon / the Blackbird fly in front of it) —
  except the aurora, which is behind the sign.
- **A BIG legendary's print waits in the corner** until the craft has left the screen (the UFO, the TR-3B, the ghost ship) — "never over its own
  moment"; the others open the polaroid at once (the balloons + the aurora last for minutes / all night).
- **Birthdays:** a CLEAR counts as a change (no clear + set farming); the first set is free (setting it on the day gets MANY HAPPY RETURNS that
  day — one cosmetic, once).
- **Favors:** the room button sleeps until LOBBY 2.0 (spending a token on a room whose phones can't show it yet would waste it); the preview
  is local (nothing written).
- **THE INTERCOM's WHEN:** AT A TIME is the owner's own clock (one moment for everyone, unlike the patch cards' "each viewer's own time" — a
  voice announcement is one event); a lobby's copy is written to the rooms open at the send (a room opened later gets it from the city's feed
  only when it's on the title). The free plans: a clip ≤ 600 KB (~800 KB as base64) in the database, ≤ 12 kept at once, each deleted an hour
  after it plays (≤ 25 h) → ≤ ~10 MB of the free 1 GB; phones fetch it through the cached GET (Vercel's edge), not the database.

## Known issues
- **The item + achievement names ship in the site's code** (A's known issue — THE VAULT 1's fix: the server sends names + art only for what a
  player owns); the sighting pairs' names too.
- **A sighting can be faked by someone who reads the open timetable** and claims a real appearance's minute without watching (cosmetic; the
  repo goes private before launch).
- **The polaroid has no NEON sign** (see Decisions); a balloon high in the sky can share the frame with the sign's area (the photo shows the sky
  there).
- **The intercom on a real iPhone:** HOLD TO TALK proven by the owner; the WHEN's scheduled play is proven in Chromium (headless WebKit has no
  audio) — his iPhone confirms.
- **Headless WebKit on Windows has no AudioContext:** the sequence's sounds (flash · polaroid · card-reveal) are silent in the WebKit runs.

## THE FULL LOCAL RUN (the mini PC, Nov 2 late night)
Unit 1067/1067 · rules 58/58 (+ PROGRESSION B's case; **the rules file unchanged — no re-publish**) · /api `server.test` 29/29 + `progression.test`
9/9 + `sightings.test` 4/4 (each alone — they wipe their own nodes) · the profile E2E 66/66 · smoke (`GAMES=prism,overclock`) 6/6 · **THE FULL
HARBOR SUITE 893/895** in 1,250 s → the two misses = TIMING checks (`weather`'s busy-storm thunder 0.69 s late, `desktop`'s resize gap 450 ms)
in the minutes a WebKit link check ran beside the suite (against the "alone" rule — my slip); the two groups alone: **47/47**. The new groups:
`sightings` 5/5, `radio` (+ THE WHEN) + `progress` green. No new Vercel env vars; no new function (still 8 of 12).

## THE CLOUD
**Run 1** (the final push): tests ✅ · harbor **8 / 10** — `holiday` red on the new `sightings` group: (1) its frame-gap check (116 ms worst
on the 2-core runner at 30 fps — it was a plain check, now `okT` like every frame budget: hard on the mini PC, a warning there) and, looking
for the cause, **a real one**: the album's JPEG encode ran WHILE the polaroid slid (~110 ms on Safari's main thread) → it now runs after
the moment closes; (2) the close-tap landed inside the reveal's 1-s guard on the slow runner (the test now waits for the hold to arm). `show`
red on `quietbuilding` (untouched this pass): its 4:30 am check read the windows' state before the first decision → it waits for it now.
Locally: `sightings` + `quietbuilding` 14/14. **Run 2** (this push) — its result is in the summary.

## The hand-off — THE VAULT 1 (its questions round first: the card list + the Card Lab)
- The sighting pairs are `card-sg-<id>` / `emb-sg-<id>` in `core/items.js` (placeholders: the card palette + a glyph) — THE VAULT 1 draws the
  cards from the city's own baked models (decisions §15 THE SIGHTING CARDS' BAR); the reveal (`js/progress/sighting.js#pairCard`) + the album
  (`album-view.js#cardArt`) read them.
- The names-in-the-code fix (the server sends names + art only for what a player owns) — THE VAULT 1.
- LOBBY 2.0 wakes: the room's birthday skywrite (`rooms/{CODE}/radio`, `by: 'bday'`), CALL IN A FAVOR's room button (`FAVOR_ROOMS_LIVE`), the
  crew's sky moments.
