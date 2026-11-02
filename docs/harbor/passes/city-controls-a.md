# CITY CONTROLS A — the owner's SCHED review + THE RADIO (Nov 2 2026)

The owner's plan notes: `docs/harbor/plan.md` "OWNER'S NOTES — NOV 2 (morning)" (PROGRESSION 2.0's look, CITY CONTROLS A + B, THE CREW,
DAYTIME FIREWORKS, the SCHED review, the finale's gap). The decisions in force: `docs/harbor/decisions.md` §1 + §15. Mockups (read-only):
`~\Downloads\NEON\city-controls\` (1 the desk, 2 the jack flow, 3 the three faces, 4 the background — #3 THE CITY BEHIND).

## What changed

### Group 0 — the owner's SCHED review
- **THE DAY CHART: the full 24 hours** — the city's own day, 4 am → 4 am (`core/harbor-daychart.js#DAY_FROM / DAY_TO`), every hour shown;
  the small hours now listed: the boss's blue TV (his lights-out → 3 am), his shade pull + the nightlight, each scene room's LIGHTS OUT
  (`harbor-scenes.js#shadesNight`, ~2–4 am), the milk truck at 6. The look unchanged ("great").
- **THE CHARLESTON**: the tall gold thing behind her arm was the phonograph's BRASS HORN → removed (the cabinet + a dark turntable stay);
  nothing bright behind her silhouette; the rosy lamp unchanged.
- **THE JUGGLER**: a deep, dim COPPER room (the back wall, the floor pool, the lamp's shade + glows, his rim, the pull's rim; the scene row's
  shade glow + `ROOM_GLOW.jazz`) — lower + redder than the boxer's gold, the neon balls the brightest thing in his window. Four distinct
  windows at 8:30 pm on a weeknight (boxer gold · juggler copper · Charleston pink · the boss's room). THE GOLDEN TABLE rewritten ON PURPOSE
  (only the scenes' glow colour changed — checked with `scripts/sched-golden.mjs --raw scenes`).
- **THE BILLBOARD's MESSAGES CRISP AT NIGHT**: a hint / the Sunday postcard / an owner's message is drawn at the phone's FULL dpr on THE CRISP
  LAYER (`signs.js#nightPoster`: the poster × its lamps' light map at the layer's resolution + the shades' glow), opaque at the lamps' own
  level as the city draws it (`neon.js#boardNightA`). A FIX found on the way: `neon.fresh()` never clears, so a day's first hint switched the
  DAY crisp poster off for the rest of the visit — the board now waits only for its own bake (scene.js `freshDone`). WebKit 402×874 @3: the
  letter edges + the silhouette clearly sharper, the same layout + colours (the message sits above the page vignette like the blade + the
  day poster — a touch brighter than the soft copy).
- **THE FINALE's GAP** (the owner's 11:56 am add-on): the gold willow curtain was snapped to a PHRASE after the dragon eggs (up to ~8 s of
  nothing). Now the willows LAUNCH on the next STRONG beat (half a bar) 0.5–1.25 s after the eggs' burst (`fireworks.party.curtainAfter`; the
  next beat if a half bar is later), their tails rising through the dying crackle (`curtainRise` 1.9 / 1.7 s) — one continuous close, never
  a bar later. Unit tests over 16 tempos + phases; `--cast` / a burst at 402 in Chromium + WebKit.

### Group 1 — THE SERVER (roles, actions, delivery, the audit log)
- `core/harbor-radio.js` (PURE, the server + the phones): THE JACKS from the timetable (a row with `jack: { id, label, order, card, dark, len,
  lane, start, crew, limit }` — 14: SKYWRITE · BANNER · FIREWORKS · LIGHTS · UFO · TR-3B · PARTY · BLACKBIRD · FLYBY · DANCE · BALLOONS ·
  BILLBOARD · LIGHTNING · SKY BEAMS), THE ROLES (owner · crew) checked PER ACTION, the audiences, the dark (`radio.darkEl` at the owner's city),
  the words (24 letters, the profanity filter, BNAME — no room player's name), ONE AT A TIME per lane (legend · words · show; a legend never
  over a show; the OWNER first — the crew's waiting ones move behind him), the crew's limits (per room per night + the cooldown), AT A TIME
  in each viewer's own time (`localStart`), the public copy (never a profile id).
- `api/_lib/radio.js` through `/api/admin` (radioWho · radioState · radioFire · radioStop · radioClearAll · radioBoard / Edit / Cancel ·
  radioDial · radioRooms · radioLedger · radioHello). Nodes (server only — no rules change): `radio/q` (the queue), `radio/fired` (THE
  RECORD — `sight` = the owner's to a real audience: Progression 2.0 counts a SPOTTED fired moment as a City Sighting once a day),
  `radio/board`, `radio/crew/{pid}` (CC-B grants it), `radio/limits/{room}/{night}`, `radio/visits/{day}`, `here/{uid}`, `city2/showcase`,
  `rooms/{CODE}/radio/{id}` (readable with the room, written by the server only — a rules test proves it). Every action → `audit/`.
- DELIVERY (CONN-safe): the city's moments + the billboard's messages + the dial ride the cached GET `/api/admin?live=1` (every phone polls it
  ~45 s; the city's lead is ~45 s); a room's go to its node (~2 s). The emulators only: `testAdmins/{pid}` = the E2E's owner.
- THE PHONES (`screens/harbor/scene-radio.js`): each fired moment plays ONCE at its start (never the preview panel's loop): legendaries,
  the flyby, the Blackbird, SKYWRITE (white smoke by day, the DRONE SHOW in its colour after dark), the banner, the balloons (already in
  view), a one-off fireworks show, LIGHTNING, the HOLDS (searchlights, sky beams, party, dance); a night-only one skipped where it's light;
  a late load joins mid-way; STOP stops it. The billboard's owner messages (`harbor-billboard.js#ownerAt`) win over the hints. The dial →
  `setServerShowcase` (a link's &showcase= still wins on its page).
- LIGHTNING (`radio.lightning`): on a clear sky the storm deck rolls in (`rollIn` 3.5 s), 1–3 CLOSE strikes on the spire (the city's rod;
  `lightning.js` manual + rod) at the flash pacing's own gaps (≥ 4.5 s — never a strobe; reduced motion: one soft pulse), the recorded
  thunder, then it rolls away (~20 s).

### Groups 2–3 — THE RADIO + THE DESK
- `radio-gate.js` asks radioWho after the app is up; ONLY a yes loads `radio.js` + `css/radio.css` (nobody else gets the button, not even in
  the DOM). THE CORNER BUTTON: a third 36 pt circle UNDER the ☰ (title + lobby), a brass radio, a PINK DOT while your moment runs / waits.
- THE RADIO over THE CITY BEHIND (the live harbor blurred behind the brass panels; the title's floating pieces step away while it's open):
  the header + the NIXIE count (people in the city — an estimate), THE BAND SELECTOR, close by ✕ / a swipe down / Esc.
- THE DESK: the tuning window = THE SHOWCASE DIAL (the needle swings — transform only), the AUDIENCE knob (+ the open rooms), the 14 JACKS
  (long-press → drag to arrange, saved on the device), THE PATCH CARD (words + colour + preview · short / full show · the dance · the billboard's
  two lines on a mini board + NOW / AT A TIME / REPEAT + the days · FIRE says who + how many), the LAMPS (amber blinking · pink + STOP ·
  greyed with why + when), CLEAR ALL under the red safety cover, DEV · THE WORKSHOP = the preview panel (ONE way in: the ☰ ADMIN row steps
  aside while the radio is on the page; without a radio — `&panel=1` tests — it stays).
- THE DESK's SOUNDS: Grok's picks (`art/city-sfx/radio/claude-notes.txt`) imported by `scripts/add-city-sfx.py` into 8 `radio-*` slots
  (25 takes, 79 KB; every take on the hit; quiet); the importer now reads Sonniss names with spaces + commas. The desk works silently.

### Group 4 — THE PROGRAM · Group 5 — THE LEDGER
- THE PROGRAM (`radio-program.js`): TONIGHT from the day chart (done greyed, ON NOW, LEGEND tags, YOURS pink), THE WEEK (legendaries a night,
  party nights red), YOUR QUEUE (CANCEL / STOP; a billboard message EDIT reopens its card).
- THE LEDGER (`radio-ledger.js` + radioLedger): the nixies (in the city · rooms open · games on), TODAY (visitors — an estimate; new players;
  matches; legendaries spotted — a dash until Progression 2.0; the longest streak alive; errors from phones → /admin), THIS WEEK's bars, a
  place for THE CREW.

## Decisions
- **ONE ROOM: BUILD IT, SHOW LATER** (the owner, mid-pass): a room's phones show a STILL of the city in the lobby until LOBBY 2.0 makes the
  lobby the live city — the room path is built + tested (rooms/{CODE}/radio, ~2 s) and plays once the lobby is the live city; the knob says
  so. THE CREW (room only, CC-B) waits for LOBBY 2.0 too → LOBBY 2.0 ahead of CC-B's crew.
- **SKYWRITE's colour**: skytyping is white smoke (the real thing) → the jack types in white by day and becomes the DRONE SHOW (the city's
  night version, in the colour picked) after dark.
- **ONE AT A TIME = per lane** (legend · words · show) + a legend never over a show; the free lane (lights, beams, party, dance, balloons,
  lightning, the billboard) never queues.
- **YACHT left off** the desk until the party yacht exists (a jack = a timetable row: it joins by its row).
- **A fired moment plays ONCE** through the city's own one-shot starters (the preview panel's forces loop + vanish when cleared).
- **The nixie's count is an ESTIMATE** (a visible city says hello every ~2 min — no socket) until Vercel Analytics; the ledger says so.

## Known issues
- ONE ROOM + THE CREW play once LOBBY 2.0 puts the live city in the lobby (by design — the owner's answer).
- The city's moments reach the other phones within ~45 s (the cached poll); the owner's own phone plays them at once.
- Headless WebKit draws no backdrop blur (a darker wash instead); on the iPhone the blur is the real thing — the owner confirms. Headless
  WebKit also showed the display face (Orbitron) thin in the radio's titles at shot time — check on the phone.
- The night billboard message on the crisp layer is a touch brighter than the soft copy (it sits above the page's vignette, like the blade).

## The hand-off to CITY CONTROLS B
THE INTERCOM (record → PLAY BACK · SEND · DISCARD → the ON THE BILLBOARD lever + the headline (`ownerAt` already plays text messages), the
vibraphone chime 419491 + the PA crackle (Grok's folder), audiences, wait / don't wait) · THE CREW (the role is checked now: `radio/crew/{pid}`,
the crew's 11 jacks, room only, the limits + the cooldown, STOP on their own — add: the grant (the CREW toggle on a player's card + THE CREW
on THE LEDGER by name tag, cap 10), the cut-down room radio, ONE RADIO PER ROOM, the dimmed button + ASK FOR THE RADIO) · PRESETS (tucked
away) · "A ROOM JUST OPENED" push. LOBBY 2.0 first for anything that plays in a room.
