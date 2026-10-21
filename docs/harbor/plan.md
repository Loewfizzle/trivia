# CITY 2.0 — THE MASTER PLAN (the owner's decisions, every part)

**READ-ONLY REFERENCE. Build ONLY what your part's prompt asks.** This file is the big picture so each part leaves room for
what comes later and never contradicts it. If your prompt and this file disagree, the prompt wins — then tell the owner.
The rules (size rules, hero pieces, the floor-not-ceiling reference, budgets) live in `docs/harbor.md`; this file is the WHAT.

## The build order (model · estimate)
| # | prompt | model | estimate |
| --- | --- | --- | --- |
| 1 | foundation + blockout ✅ | Opus 5.5 medium | done |
| — | Fable read-only review ✅ | Fable | done |
| 1.5 | foundation fixes ✅ | Opus 5.5 medium | done |
| 2 | skyline | Opus 5.5 high | 60–90 min |
| 3 | neon + signs + billboards + the NEON logo | Opus 5.5 high (or Fable) | 60–90 min |
| 4 | water | Opus 5.5 medium | 30–50 min |
| C1 | cleanup pass 1 (Known issues + the full title suite) | Opus 5.5 medium | 15–30 min |
| 5 | harbor hero pieces | Opus 5.5 high | 60–90 min |
| 6 | sky hero pieces | Opus 5.5 high | 60–90 min |
| 7 | the speakeasy + rooftop | Opus 5.5 high | 45–75 min |
| 8 | the stage + wildlife | Opus 5.5 high | 60–90 min |
| C2 | cleanup pass 2 | Opus 5.5 medium | 15–30 min |
| 9 | seasons + weather | Opus 5.5 medium | 45–75 min |
| 10 | party nights + fireworks (the "Part 11" section below) | Opus 5.5 high | 60–90 min |
| 11a | autumn holidays: the shared holiday system (calendar, build-ups, sign dressings), the parade system, the banner plane's messages, Halloween, Day of the Dead, Thanksgiving | Opus 5.5 high | 60–90 min |
| 11b | winter holidays: the Christmas build-up, the tree lighting, the Christmas sign, New Year's Eve (ball drop, window countdown, the finale on Part 10's fireworks) | Opus 5.5 high | 60–90 min |
| 11c | spring, summer + patriotic: Valentine's, St. Patrick's, Easter, Memorial Day, July 4th (air show + fireworks), September 11, Veterans Day | Opus 5.5 high | 60–90 min |
| 12 | easter eggs, sounds, desktop, switch-over | Opus 5.5 medium | 60–90 min |
| C3 | final cleanup | Opus 5.5 medium | 30–45 min |
| 13 | CITY CONTROL (admin) | Opus 5.5 medium | 45–60 min |
| 14 | Lobby 2.0 + the public crowd | Opus 5.5 high | 90–120 min |
| 15 | TV mode, step 1 | Opus 5.5 high | 60–90 min |
| 16 | Board 2.0 | Opus 5.5 high | 60–90 min |
| 17 | Progression 2.0 | Opus 5.5 high | 90–120 min |

**How every part works:** a "work efficiently" block (a bug not fixed after 2 real attempts → logged in docs/harbor.md
"Known issues", move on; never polish what a later part rebuilds; while working only the part's own tests; at the end the unit
suite + e2e-harbor + a quick default-city smoke check — the full 5-minute title suite only at the cleanup passes and Part 12;
two screenshot refine passes; subagents for wide reading; ask the owner at once on a conflict). Every part updates
docs/harbor.md (what it built, the stubs table, the handoff note) and gives preview links on neonspeakeasy.com with
?city=2&tz=America/Detroit&at=42.96,-85.67.

## Rules that apply to everything
- **The glance test:** anything meant to be seen must read on an iPhone held upright in 3 seconds, from silhouette, pose,
  colour and motion, at the size rules (people ~20 pt). Small props are exaggerated, key moments get a visual cue, nothing that
  matters happens on the far pier or out on the water (boats and the wheel read by their lights). Every holiday / story list is
  triaged by size before building: make it bigger or cut it. Never write code for something that can't be seen.
- **Premium, crafted, never cheap** — above all the lighting (Christmas lights, neon, fireworks are LIGHT).
- **Weather effects only when it is really happening** where the player is. Never tell players the city is live.
- **Fixed-time moments run on the clock, not the scheduler's dice** (the NYE countdown + finale, the tree lighting at dusk,
  the Day of the Dead procession, the 9/11 beams, half-staff times) — the scheduler is for random events.
- **City 1.0's light timeline is kept exactly** (dusk boot-up order, flicker + stagger, window lights-on, bedtime thinning,
  morning off). Only the art improves.

## Part 2 — skyline
- Hierarchy: 2–3 dominant hero towers, a middle tier in clusters, a dense low base; only 1–2 gold crowns; one Empire-State-style
  stepped tower (our own design); 2 modern glass towers in the back/haze layers only. Sun gaps only in the TOPS — no holes.
- The Ferris wheel ~45% across, a bit smaller, its legs + pier + water visible (never reads as on a roof), clear of the word
  towers and hero crowns. Same skyline on every phone; taller phones get extra sky (no stretching). Water strip: camera kept.
- The tagline "YOUR FRIENDS ARE ALREADY INSIDE." fades after ~15 s and stays gone; its band = sky-low + a TAGLINE SLOT for
  special messages only (holidays, the NYE countdown, CITY CONTROL).
- Thousands of glitter windows; ADDRESSABLE windows on every building; 2–3 word towers (horizontal + vertical) with a pixel font
  (letters, digits, heart, star, flag) — used for "2027", the 10→1 countdown, a heart, "BOO", "JOY", birthdays, admin words.
- Searchlights: 2–3 crafted rooftop searchlights (party nights, holidays, rare "grand opening" nights; dramatic in real fog/cloud).
- Golden-hour god rays through the gaps; day and night = two different cities; sun + moon arch re-fit (rise/set behind the
  skyline, clear the logo, may pass behind the wheel/lighthouse), real timing unchanged.

## Part 3 — neon, signs, billboards
- Every game has its own tube-neon sign in the city (and a tube logo reused by Lobby 2.0's sign swap). Signs built like real
  sign-shop neon; beautiful unlit by day.
- The NEON logo premium pass, letter shapes identical: uneven light along the tube (hotter on bends, dimmer at the electrodes,
  a faint core flutter), real glass thickness + a moving highlight, its glow tinting the night haze; by day (it is OFF by day)
  clear sunlit glass, glints, caps/clips, soft shadow. Shown only with ?city=2 until the switch-over. Position + night look kept.
- The neon boot-up sequence + flicker timing = City 1.0's.

## Part 4 — water
- Reflections in perspective; a gold sun path at sunset and a silver moon path at night broken by ripples; every light smeared
  in the water; fireworks doubled in the harbor (Part 11).

## Part 5 — harbor hero pieces
- Ferris wheel (turning, bulbs; seasonal/holiday colours), lighthouse (beam; keeper's cottage), pier, boats: Rosie the
  riverboat with bulbs, a water taxi, a tug, sailboats by day; lit boats for holidays.

## Part 6 — sky hero pieces (existing behaviour, new art)
- Planes, the BANNER PLANE (1–3 banners: daily challenges, holiday messages, game announcements, CITY CONTROL messages),
  helicopter, jets, birds/gulls, the UFO, satellites.
- The sun and moon art: big amber moonrise turning silver, earthshine on the crescent, a halo only in real haze; rare harvest
  moon / supermoon / lunar eclipse (red) on the real nights.
- Jets: a four-jet demonstration team (our own unbranded team, diamond formation, smoke trails, loops — July 4th air show);
  F-16 flyovers on Memorial Day and Veterans Day incl. the missing man formation; July 4th F-16s.
- Skydivers: a plane drops jumpers who float down and GROW with depth to land on the promenade (crafted canopies; flare,
  a stumble, gather chutes, walk into the speakeasy); smoke flares + canopy lights at night; a giant flag under a jumper on
  July 4th / Memorial / Veterans Day; rare on calm clear days; maybe neon canopies on a legendary party night.
- The Halloween witch (crafted, good-looking, cloak + hat + broom, a trail of drifting neon sparkles; crosses a real full moon).
- Santa's sleigh across the moon on Christmas Eve. Bats at summer dusk + from a tower crown on Halloween.

## Part 7 — the speakeasy
- Windows you see into (rooms read as warm glow + big silhouettes), the unmarked door + the knock, the awning "EST. 1924".
- The ROOFTOP: summer weekend rooftop parties (string lights, dancing figures, a bar cart, someone at the railing); a rooftop
  garden through the year (spring seedlings + a gardener with a watering can, summer lush green with tall sunflowers and red
  tomato clusters, autumn pumpkins, winter beds under snow, string lights left up).
- Leave room for Lobby 2.0's password sign in a window ("TONIGHT'S PASSWORD: <hush word>", letters 14–16 pt).

## Part 8 — the stage + wildlife
- Road, bus, cars, two BIG bright stop lights, the promenade, lamps (rich light at night), trees, bench, planters, the seasonal
  vendor cart, people (hats/coats readable), a FLAGPOLE with an American flag (waves in the real wind, lit at night,
  half-staff on official days — see Part 10).
- Wildlife: pigeons that strut/peck and scatter (bus, walkers, a tap); gulls on the railing by day (huddled in real rain); a rare
  late-night coyote (1–4 am) whose eyes catch the lamplight; a raccoon raiding a trash can late at night; squirrels burying
  acorns in autumn; fireflies around the trees on summer nights; ducks near the railing, a heron on the pilings at dawn, fish
  jumping (ripple rings); a black cat on the speakeasy step (Halloween; maybe a tabby other times).

## Part 9 — seasons + weather (only when real)
- Trees through the year; snow piling up on everything, snowball fights, snow plows leaving visible plowed lanes + snowbanks,
  visible road salting; rain + puddles; fog; frost; a snowman that grows through a real snowy day and melts when it warms.

## Parts 11a / 11b / 11c — holidays (+ the banner plane's messages)
(Built AFTER party nights + fireworks, which is now Part 10. 11a = autumn + the shared systems, 11b = Christmas + NYE,
11c = Valentine's, St. Patrick's, Easter, Memorial Day, July 4th, 9/11, Veterans Day.)
- **Halloween (Oct 1→31 build-up):** the spider's web on the NEON sign grows every day over the tubes (hero-quality silk, dew
  drops catching the pink neon), fully woven by Halloween night, gone Nov 1; jack-o'-lanterns multiplying + carved on the
  speakeasy steps through October; ghosts behind curtains, mummy silhouettes in windows; zombies shambling + costumed
  trick-or-treaters on the promenade on Halloween night; the witch (Part 6); bats; the black cat (tap: hisses, darts off); the
  lighthouse beam eerie green; the wheel orange/purple; spooky LIGHT (deeper shadows, green-tinted windows, flickering lamps;
  fog only when really foggy); LEGENDARY: a translucent green ghost ship drifting across the harbor on Halloween night.
  Comes down overnight into Day of the Dead.
- **Day of the Dead (Nov 1–2; warm, colourful remembrance, not spooky):** marigolds in the planters + garlands on the lamp
  posts, a marigold petal path to the speakeasy door, papel picado strung across the promenade fluttering in the real wind,
  candlelit ofrendas in windows (read as warm flickering glow); the NEON sign: a crafted marigold garland on the tubes, papel
  picado between the letters, candles at the base, tubes warming to marigold/pink; Nov 2 at dusk a candlelight PROCESSION
  along the waterside road (candles, Catrinas with flower crowns, a mariachi trio); rare monarch butterflies by day. Nov 3 down.
- **Thanksgiving:** a cozy November (cornstalks on lamp posts, hay bales, pumpkins + gourds, mums, cider + chestnuts at the
  cart, geese in V's, peak autumn trees); the Wednesday before = a homecoming party night at the speakeasy; Thanksgiving
  morning a BIG balloon parade down the waterside road (original unbranded giant balloons — turkey, pumpkin, acorn, cider cup —
  with handlers on ropes, a marching band, reacting to the real wind) — build the parade system reusable; afternoon/evening
  quiet + warm (people carrying pies, candlelit family tables in windows, a TV with a football game, a kid tossing a football,
  chimney smoke, an amber skyline); the NEON sign in amber tubes with a crafted harvest wreath (wheat, oak leaves, gourds,
  warm bulbs; no cartoon turkey); Black Friday: the first Christmas crew arrives, shoppers with bags.
- **Christmas (the day after Thanksgiving → Christmas Eve, a little more each day):** visible crews on ladders/roofs stringing
  lights now and then; the speakeasy's windowsills, roof and water tower first, then building after building; lights mixed by
  building (the speakeasy + sign in multicolour C9s, some buildings warm white, others colour); wreaths + garland on every lamp
  post; a Christmas tree vendor cart; carolers; a giant tree on the pier/promenade that LIGHTS EVERY NIGHT AT DUSK in a
  bottom-up wave, the star last (the first night a full ceremony with a crowd and a ripple across the skyline); the Ferris wheel
  lit like a giant ornament; a lit boat parade; the water tower wrapped/outlined; a classic lit wire-frame sleigh + reindeer on
  the speakeasy roof with chase lights that make the reindeer gallop; Santa's sleigh across the moon on Christmas Eve.
  THE NEON SIGN: a real fir garland with glowing multicolour glass C9 bulbs (more each December night), snow on the letter tops
  + icicles only when really snowing/freezing, twisted red-and-white candy-cane tubes on Christmas Eve/Day, "MERRY CHRISTMAS
  EVE." in the tagline slot. Must be MUCH more realistic than docs mockup neon-christmas.png (photo-real tubes, faceted bulbs
  with filaments casting coloured light on tubes/garland/snow, layered needles, sparkling snow). Every bulb lights its
  surroundings and reflects in the wet street and the harbor. Down from New Year's Day over a few days.
- **New Year's Eve (each player's own midnight):** the biggest night of the year, a party night whatever the weekday; balloons +
  a HAPPY NEW YEAR banner at the speakeasy; the banner plane in the afternoon ("SEE YOU AT MIDNIGHT"); a dressed-up crowd, the
  door line, gold/silver windows, searchlights; the party yacht + helicopter landing GUARANTEED; the countdown in the tagline
  slot (last 10 min); a glittering BALL drops down a landmark tower's mast in the last 60 s; the towers count down 10→1 in
  windows; at zero "2027" across the towers, fireworks + every boat's horn at once; the NEON sign's midnight sequence. New
  Year's Day morning-after: confetti in the gutters, a street sweeper, people in sunglasses with coffee.
- **Valentine's (romantic + elegant, never cheesy):** Feb 1–13 hearts/roses in some windows, the cart sells roses, a florist
  delivery bike, heart displays in shop windows; the day: couples arm in arm, the nervous-date story told by big poses (waiting,
  pacing, an oversized red bouquet, the date arrives, a hug); at night candlelit tables for two in windows, the speakeasy a softer
  jazz date night, the wheel rose/red, a heart on a tower, Rosie as a dinner cruise (string lights, a violinist, tables); the
  NEON sign in rose tubes with a crafted heart tube. No Cupid, no proposal.
- **St. Patrick's, Easter:** in kind (to be detailed); **July 4th:** the air show + fireworks show + flags; **Memorial Day:**
  flags in windows + on buildings, F-16 flyover with the missing man formation, the promenade flag at half-staff until noon then
  raised; **Veterans Day:** flags + a flyover; **September 11:** the flag at half-staff and at night two searchlight beams straight
  up (a tribute in light), quiet and respectful.
- The banner plane carries holiday messages.

## Part 10 — party nights + fireworks (built BEFORE the holidays)
- Fri/Sat build all night: classy warm-up → spectacle at the peak → the midnight finale. Special party nights also on the
  Wednesday before Thanksgiving (homecoming), Valentine's (a softer jazz date night) and NYE (the biggest).
- The party yacht + helicopter: legendary-rare on party nights, guaranteed on NYE.
- FIREWORKS (one premium engine, also used for July 4th): real shell types (peony, chrysanthemum with trails, gold willow,
  palm, ring, crossette, crackling glitter/strobe, comets), sparks that cool white→colour→ember and fall with gravity + drag,
  every burst lighting the buildings, smoke and water, reflections in the harbor, smoke drifting on the real wind lit from
  inside, depth (small far ones behind the skyline, bigger near). NYE timeline: from dusk one or two random fireworks now and then
  around the city; NONE in the hour before midnight; at zero a ~30 s grand finale (opening salvo from barges → building layers →
  a full sky of crackle → a huge gold willow curtain raining over the skyline, boat horns); then random fireworks for the rest
  of the night, thick the first hour, thinning to a last pop before dawn. The finale is a HEAVY event; weaker phones get fewer
  sparks, never ugly.

## Part 12 — easter eggs, sounds, memory, desktop, switch-over
- Tap eggs (never explained): the door knock; pigeons scatter; the black cat; a lit window → someone appears and waves; the
  lighthouse 3× → the beam spins; the bus / a boat → its horn; the Ferris wheel → a gondola rocks; the night sky 7× → a shooting
  star; the full moon → the coyote howls. Common → legendary. LEGENDARY once a year: a harbor monster (a dark shape + a fin
  gliding across), a submarine periscope that rises, turns to look at you and sinks, the UFO hovering over the lighthouse
  borrowing its light; the ghost ship (Halloween). A few subtle, rare Grand Rapids nods (e.g. the October salmon run leaping).
- The music-off soundscape (foghorn, gulls, a far honk, light traffic, a soft city hum; a night version). Sound never relies on
  subtlety (the music is loud): moments use a music change, a duck or crisp on-beat hits, always with a strong visual.
- The desktop/wide panorama; also make room for a TV camera (see TV mode).

## After the city
- **CITY CONTROL (/admin, phone-first):** global messages with a "just my devices" preview before GO LIVE; "send now" = everyone
  on the title within a minute + anyone opening later until it expires; the banner plane (type ≤ ~24 chars, colour, live preview,
  schedule incl. each player's local time, passes, expiry, edit, cancel); words in the windows for a time window; one-tap events
  (searchlights, a surprise weeknight party, a fireworks show, the party yacht); a short tagline message; a clear-all kill switch;
  the audit log. Written to a public read-only DB node only the server writes.
- **LOBBY 2.0:** no separate lobby screen — the live city IS the lobby; dock in a room: INVITE · GUESTS · GAMES · BOARD · CHAT ·
  PLAY. On host/join the strangers drift off your screen, your figure arrives (walks in / bus / cab) at the host spot by the
  door, friends arrive and walk up; the same spots on every phone (join order); a guest whose signal drops walks to the bench
  and sits, dimmed (or stands faded if the bench is full) and returns on reconnect; leaving = waves + walks off / hails a cab;
  game start = the NEON sign powers down and the game's tube logo powers up ("TONIGHT"), everyone walks inside, the view pushes
  through the door; after the match they walk back out. The password sign in the speakeasy window (the hush word); the real
  word always big in INVITE / the dock. THE PUBLIC TITLE CROWD: a background crowd generated on each phone (clock-seeded,
  dressed for the season/weather) + a once-a-minute server summary (online count + ~a dozen random online players' name, emblem
  colour, outfit) every phone reads; those players appear as figures in their outfits, tap → name + card; players in a game
  are "inside" (busier windows); picks rotate every few minutes; density follows how many are online, never dead; an "Appear in
  the city" setting (on by default); only public BOARD info. Readable: ~20–30 people on a phone, 40–60 as a packed crowd.
- **TV MODE (after Lobby 2.0):** neonspeakeasy.com/tv shows a short code + QR; the host pairs via SHARE TO TV on their phone (no
  typing on the TV); the TV is a viewer, phones are controllers; the TV plays the music + big moments, phones go quiet (tiny
  taps only); a TV camera with a bigger stage so people read from the couch, gentle slow drift, push-ins on moments; step 1 the
  lobby, walk-in, standings + podium; step 2 per-game TV views (trivia games, HIGH STAKES first); a lighter tier for weak
  smart-TV browsers (best on a laptop/HDMI, Mac/iPad AirPlay, a cast tab).
- **BOARD 2.0** (the bar inside the speakeasy, an Art Deco brass + enamel honor board, a live bartender, windows onto the live
  Harbor) and **PROGRESSION 2.0** (levels 1–100, a wardrobe whose pieces turn neon at night, entrances, a birthday on the
  profile so the towers can spell "HAPPY BDAY <NAME>").
- **Later:** single-player / vs-AI modes and the 3 daily challenges (morning Wordle-style, afternoon Minesweeper, evening
  Overclock ×6) announced by the banner plane; profile pages for other players.
