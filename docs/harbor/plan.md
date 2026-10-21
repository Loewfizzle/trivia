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
- **Premium, crafted, never cheap** — above all the lighting (Christmas lights, neon, fireworks are LIGHT). EVERY moving part and
  every eye-catching item MUST be rendered premium and stunning; if it can't be made to look great at phone size, say so to the
  owner instead of shipping something mediocre, and never let it crowd something more important (word towers, needle, wheel).
- **Never quietly lower the look:** if staying inside the speed budget would mean a visible sacrifice (especially on older phones /
  tier 1), stop and tell the owner what you'd simplify and let her decide.
- **Real phones decide the budget:** the laptop's 4×-CPU, no-GPU test is an EARLY WARNING, not the verdict. On the owner's iPhone
  (Oct 21, &debug=1) a party night costs 1–3 ms of work at a steady 60 fps, while the laptop said ~6.4 — so when the laptop says
  "slightly over", check a real phone (&debug=1) before cutting anything. Measure once while building + ONE careful A-B-B-A round
  at the end (only the scenes that changed); if over, one fix attempt + one re-measure, then report and ask — no loops.
- **Performance + battery:** every part stays within the frame and memory budgets; the cleanup passes double as performance
  checks; cleanup pass 1 adds battery/heat care (a lower frame rate when little is moving, a full stop when the page is hidden).
  New ideas fit the existing systems (lanes, events, windows, holidays) rather than adding big new machinery.
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
- The tagline "YOUR FRIENDS ARE ALREADY INSIDE." (the owner likes it): shown on arrival, fades out TOGETHER WITH THE DOCK when the
  title's screen goes to rest, comes back with the dock on a tap; on special days the TAGLINE SLOT shows the special message
  instead (holidays, the NYE countdown, CITY CONTROL's custom-typed messages). The skyline never grows into its space.
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
- The neon boot-up sequence + flicker timing = City 1.0's. THE CATCH must FLOW on like City 1.0's (the owner: City 2.0's catch
  goes dark for half a second then snaps on — fix in cleanup pass 1); every TIME stays exactly as it is, only the animation.
- NEON BUZZ: crisp, high-quality buzz / tick sounds on each flicker during the dusk warm-up and morning fade, a soft hum at the
  catch — always when sound effects are on (never relied on; the visual stays the moment).
- THE LOGO'S COLOUR: pink is home most nights (the brand: app icon, link previews); other colours (purple, electric blue…) only on
  special nights — holidays, party peaks, game starts, CITY CONTROL.
- **Signs (asked + decided Oct 21 2026):** 12 readable named signs don't fit a phone's skyline (the word faces, the wheel, the
  lighthouse take the wall space) — so MIXED SIZES: every game always has its own sign; ~4–5 big NAMED spots whose games rotate
  (a new pick each night or visit, never a sign changing while you watch); the other games as tube ICON signs (mark + colours).
  Built so games can be added or removed without redesigning the skyline.
- **Building neon (the owner, Oct 21 2026):** real tubes tracing the Deco shapes, LAYERED (heroes + landmarks fully outlined,
  the middle tier on rooflines / setbacks, the far bands a few faint threads); THE NEON NEEDLE (the needle's spire one tall
  glowing tube, its synced beacon at the tip); COLOUR like Shenzhen but designed — ~8 colours in roles: base ~60 % (electric
  blue, cyan, ice white), heat ~30 % (the NEON pink, violet; mostly heroes), accent ~10 % (amber, signal red, acid green);
  max 2 colours a building, colour by cluster, a brightness hierarchy, the word faces clear; the two glass towers' LED
  facades (slow, smooth gradients); a calm steady glow most nights with hooks for MOMENTS (party chasers + the beat, holiday
  schemes, a game's colours flashing across the skyline at a game's start, a CITY CONTROL scheme).
- Word towers (Part 3 fix): both faces fully visible at every phone size, bold bright letters on a dimmed face, a SCROLL
  (ticker) style for messages of any length. Aircraft beacons on every tall top incl. spire tips, blinking IN SYNC.
- Owner review notes for the next pass (Part 4 section 0): outlines must follow the Deco setbacks / fins / crown steps, not
  plain outer rectangles (esp. the cyan towers on the right); the right-hand billboard + small icon signs are too small to read
  on a phone → bigger or moved onto the stage; give the busy skyline centre (needle, CIPHER, wheel, HOTEL blade) breathing room.

- SIGN PLACEMENT RULE (Oct 21): no sign may cover a hero tower's face or neon outline. The vertical named game sign that sat on
  the central hero tower moves into the HOTEL blade's spot (the HOTEL sign is removed — its thin letters don't read on a phone);
  the game blade takes over the projecting build + chasing bulbs, glance-tested. Game signs never go on the speakeasy (it stays
  secret and unmarked).

## Part 4 — water
- Reflections in perspective; a gold sun path at sunset and a silver moon path at night broken by ripples; every light smeared
  in the water; fireworks doubled in the harbor (Part 11).

## Part 5 — harbor hero pieces
- Ferris wheel (turning, bulbs; seasonal/holiday colours; its A-frame legs must stand ON the pier deck — today they stick out past
  both sides of the pier; widen the pier under the wheel or bring the feet in), lighthouse (beam; keeper's cottage), pier, boats: Rosie the
  riverboat with bulbs, a water taxi, a tug, sailboats by day; lit boats for holidays.
- AN ELEVATED TRAIN along the far waterfront (City 1.0 had one) — DESKTOP + TV ONLY (decided after Part 5: on a phone its cars
  would be ~7 pt and ~60% hidden by the wheel and Rosie); built with the desktop pass in Part 12; a warm ribbon of lit windows at night reflected in the harbor, a sleek crafted shape by day,
  rush-hour / late-night timing like City 1.0 (trainGap), a lit holiday train in December, maybe a rare vintage steam train.

- Part 5 built: the wheel on a pier platform (legs on the deck), the lighthouse + beam (a cone in real fog), Rosie (bulb strings,
  paddlewheel, a lit "ROSIE" name board), the water taxi, the tug, sailboats, wakes; tier 0 calmer; the heavy-event quiet thins
  extra boats during big shows. Note: on a normal night the wheel's warm bulbs blend into the windows behind it — give it more
  contrast (Part 6 section 0).

## Part 6 — sky hero pieces (existing behaviour, new art) — SPLIT into 6a (everyday sky) + 6b (special-occasion sky)
- Planes, the BANNER PLANE (1–3 banners: daily challenges, holiday messages, game announcements, CITY CONTROL messages),
  helicopter, jets, birds/gulls, the UFO, satellites.
- The sun and moon art: big amber moonrise turning silver, earthshine on the crescent, a halo only in real haze; rare harvest
  moon / supermoon / lunar eclipse (red) on the real nights.
- Jets: a four-jet demonstration team (our own unbranded team, diamond formation, smoke trails, loops — July 4th air show);
  F-16 flyovers on Memorial Day and Veterans Day incl. the missing man formation; July 4th F-16s.
- Skydivers: a plane drops jumpers who float down and GROW with depth to land on the promenade (crafted canopies; flare,
  a stumble, gather chutes, walk into the speakeasy); smoke flares + canopy lights at night; a giant flag under a jumper on
  July 4th / Memorial / Veterans Day; rare on calm clear days; maybe neon canopies on a legendary party night.
- HOT AIR BALLOONS: on calm, clear mornings and summer evenings (only when the real wind is low) a crafted striped balloon
  drifts slowly across the sky; at dusk the burner flame flares and lights it from inside; rarely a small festival of several.
- THE AURORA must be REAL: today's sky shows it on ~1 night in 5 at random (core/sky.js#auroraNight) — tie it to the real
  space-weather forecast (NOAA's Kp index) or make it very rare (a few nights a year at Grand Rapids' latitude).
- Cap the planes' contrail cost (Known issues, Part 2).
- SKYWRITING + SKYTYPING: on clear, low-wind days a plane writes a word or two in huge smoke letters stroke by stroke; for longer
  messages (HAPPY BIRTHDAY STEVE, HAPPY NEW YEAR, MERRY CHRISTMAS, HAPPY THANKSGIVING) a line of planes SKYTYPES dot-matrix
  letters (~16 a line, up to 2 lines on a phone); the real wind drifts and blurs them until they fade. Flies in the sky-high /
  sky-low lanes, never over the sign or tagline. Selectable from CITY CONTROL; used by holidays and birthdays.
- The Halloween witch (crafted, good-looking, cloak + hat + broom, a trail of drifting neon sparkles; crosses a real full moon).
- Santa's sleigh across the moon on Christmas Eve. Bats at summer dusk + from a tower crown on Halloween.

## Part 7 — the speakeasy
- Windows you see into (rooms read as warm glow + big silhouettes), the unmarked door + the knock, the awning "EST. 1924".
- The ROOFTOP: summer weekend rooftop parties (string lights, dancing figures, a bar cart, someone at the railing); a rooftop
  garden through the year (spring seedlings + a gardener with a watering can, summer lush green with tall sunflowers and red
  tomato clusters, autumn pumpkins, winter beds under snow, string lights left up).
- THE SPEAKEASY WINDOWS (its own section — the closest, biggest windows in the city, ~25 pt on a phone; figures inside are
  12–16 pt SILHOUETTES, so they read by light, shape and big motion — the glance test on every window):
  - Rooms (share the ~6 visible windows; assign by what's visible at every iPhone size): THE BAR (the one CLEAR window straight
    in: glowing bottle shelves as colour, the bartender's big arm-pump shake, patrons leaning on the bar); THE JAZZ ROOM (a sax
    player swaying behind the shade, couples dancing on busy nights); THE BACK ROOM (a pool of lamplight over a table with 3–4
    heads around it — no cards; at most a soft haze, no smoke detail); THE UPSTAIRS APARTMENT (the cat as a LARGE sitting
    silhouette with a flicking tail on the sill; the TV). Everything else silhouettes behind warm amber shades.
  - THE TV GLOW (an owner favourite): a soft, IRREGULAR blue flicker like real TV light changing scenes, from ~10 pm until
    ~3 am — on above the still-busy bar from 10, then as City 1.0's bedtime turns the city's windows off it stands out more and
    more; late at night the speakeasy is dark except that window (now and then a head on a couch, the cat beside it). Plus a
    handful of lone blue-flickering windows across the dark skyline at the same hours (Part 2's window system).
  - Day vs night: by day the shades up, the glass reflecting the sky and street, rooms dim, someone stocking the bar, the cat
    sunning; at night the amber glow and silhouettes; a daily rhythm (quiet day → filling evening → packed party nights → one
    lamp and someone sweeping late).
  - Real weather (only when real): frost creeping in from the corners below freezing, steamed edges on cold busy nights, snow on
    the sills; raindrops running down the panes, catching the inside light and blurring the silhouettes; on hot days a sash
    raised halfway, a curtain blowing out, a fan turning.
  - Taps: a curtain twitches / a head peeks out; tap the cat → it leaps off the sill.
  - THE RAID: a convoy of 4 premium-crafted 1920s-style black-and-white patrol cars rolls down the waterside road, red/blue light
    washing over the facades, the wet road and the harbor; the instant they appear EVERY speakeasy light cuts out and the shades
    snap shut; they slow outside, one stops and an officer's flashlight beam sweeps the dark windows; they roll on; a beat later
    one window flickers back, then another, and the party returns (on a party night, even louder). SCHEDULE: 2 raid nights a
    week (the same for everyone, seeded by the date) — one guaranteed party night (Fri or Sat at random) + one random weeknight;
    on a raid night the first raid at a random moment 6–10 pm, then about every 3 hours until ~5 am; NEVER during big holiday
    moments (NYE countdown, Christmas Eve, the tree lighting, the Day of the Dead procession) or a party night's midnight finale.
    The car bodies come with the other vehicles (Part 8); the raid with the speakeasy (Part 7).
  - Plus what's planned elsewhere: holiday window scenes, the password sign, busier windows when more players are online.
- WINDOW WASHERS: some weekday mornings, two washers on a hanging platform squeegee the speakeasy's windows (tap → they wave).
- Leave room for Lobby 2.0's password sign in a window ("TONIGHT'S PASSWORD: <hush word>", letters 14–16 pt).

## Part 8 — the stage + wildlife
- Road, bus, cars, two BIG bright stop lights, the promenade, lamps (rich light at night), trees, bench, planters, the seasonal
  vendor cart, people (hats/coats readable), a FLAGPOLE with an American flag (waves in the real wind, lit at night,
  half-staff on official days — see Part 10).
- THE PROMENADE LAYOUT PLAN FIRST (the owner approves grey-box screenshots at her iPhone size before anything is built): three
  bands — THE CURB by the road (tall double-head Art Deco street lamps, trees in iron grates between them, the two stop lights, a
  glass BUS STOP SHELTER), THE PLAZA in the middle (open ground in front of the speakeasy door for Lobby 2.0's up-to-8 guests,
  the party-night line, crowds; a reserved CENTREPIECE SPOT just right of the door marked by an Art Deco medallion inlaid in the
  paving, where the BIG seasonal pieces go — the giant Christmas tree, a towering jack-o'-lantern pyramid, a harvest display, a
  July 4th stage, a Valentine's arch of roses — big but never covering the word towers or the needle; no fountain), THE FRONT
  WALK nearest the viewer (short warm globe lamps, ~5–6 trees in total big enough to read the seasons and never cut off at the
  corners, the bench under one, the cart, big stone FLOWER PLANTERS that change with the seasons); nothing under the dock;
  COBBLESTONE + PAVER ground that catches lamplight and shows rain, puddles and snow.
- NIGHT LIGHT: clear pools from the two kinds of lamps (tall cooler street lamps by the road, short warm globes on the paths),
  OVERLAPPING enough that every walking path is lit, DIM (never black) shadows between; warm spill from the speakeasy's windows
  and door, the cart's string lights and the neon; people always readable as silhouettes with a rim of lamplight.
- PEOPLE (crafted 2D figures placed in the 3D stage): they move in ALL directions — left/right, toward/away (scaling ~15–25 pt),
  crossing the road at the crosswalk waiting for the green, walking up to the door / bench (sitting) / cart / railing — with
  FOUR facing views (left, right, toward, away); correct overlap with lamps, trees, the bench and each other; walkable zones +
  paths (never through the cart, into the water or under the dock). The crowd FOLLOWS THE CLOCK (quiet early morning, a lunch
  rush, busy evening, near-empty ~3 am) plus more when more real players are online. Behaviours: groups walking together,
  stopping to chat, waving across; errands (the cart, a jogger, a delivery worker with a dolly); weather (umbrellas, hurrying in
  snow, coats + scarves in the cold, slower in heat); watching the view (leaning on the railing, photographing the skyline,
  pointing at boats) — all as big readable poses. Reactions: everyone stops and looks up at fireworks, the implosion, skywriting,
  the UFO; during the raid they casually freeze or scatter; they nod or step aside when your own figure walks to the door. No tap
  reaction on people. DOGS: 1–2 dog walkers at a time, medium/big breeds with clear silhouettes (big shaggy, a greyhound, a
  dachshund), drawn ~1.3× real size, trotting / sniffing a lamp post / pulling ahead, a contrasting leash line, on the nearer
  promenade.
- Wildlife: pigeons that strut/peck and scatter (bus, walkers, a tap); gulls on the railing by day (huddled in real rain); a rare
  late-night coyote (1–4 am) whose eyes catch the lamplight; a raccoon raiding a trash can late at night; squirrels burying
  acorns in autumn; fireflies around the trees on summer nights; ducks near the railing, a heron on the pilings at dawn, fish
  jumping (ripple rings); a black cat on the speakeasy step (Halloween; maybe a tabby other times).
- THE TRASH TRUCK: early weekday mornings it stops on the road, a worker tips the curb bins into it, it rumbles off (the raccoon
  bolts if it's out).

## Part 9 — seasons + weather (only when real)
- Trees through the year; snow piling up on everything, snowball fights, snow plows leaving visible plowed lanes + snowbanks,
  visible road salting; rain + puddles; fog; frost; a snowman that grows through a real snowy day and melts when it warms.
- WEATHER AROUND THE NEON SIGN (only when real): falling SNOW lit by the sign's glow as it drifts past (flakes turning pink near
  the tubes); RAIN as lit streaks near the tubes; raindrops dripping off the bottom of the tubes with glints, day or night.
- SNOW LIKE A REAL WINTER (the owner is in Michigan): snow STAYS on the ground until it really melts — never only on the days
  it snows. Use the real SNOW ON THE GROUND at the player's place (Open-Meteo's snow depth, through the existing /api/sky), with
  a fallback snowpack model from the real snowfall + temperatures (adds when it snows, melts slowly only above freezing). The
  stages read by COLOUR + COVERAGE over big areas (the glance test): FRESH = bright pure white on everything incl. branches and
  sign tops; OLDER = duller off-white, mostly off the branches, wide darker footpaths worn into the promenade; PLOWED BANKS =
  grey-brown mounds along the road that last longest; THAW = slush, a dark shiny wet road, puddles reflecting the lights,
  icicles on the speakeasy's roof edge; SPRING = white patches on dark ground, the last dirty piles in the shade. No snow
  anywhere it isn't really on the ground (Florida never, Colorado comes and goes). Don't build texture differences (crusty vs
  fluffy) or drips — too small to read.

## THE CONSTRUCTION TOWER (slot in the layout now; the cycle with the calendar in Part 9; the grand opening uses Part 10's
## searchlights + neon)
- ONE dedicated skyline spot: the owner's pick is the tall tower LEFT of the Ferris wheel, behind the JAZZ building (about a
  quarter across on the iPhone, fully in the clear, its base hidden behind JAZZ + the speakeasy). If that tower is the vertical
  word tower (wordV), move the vertical-word job to another tall narrow tower that is never demolished first.
- A ~one-year cycle on the real calendar, the same for everyone: SPRING the old building comes down by IMPLOSION — always — a
  fixed-time spectacle (the banner plane announces it a few days before, e.g. "DEMOLITION SUNDAY 10 AM"; a siren, flashes down
  the floors, it drops straight down, a huge dust cloud rolls over the harbor; anyone who missed it sees the rubble + settling
  dust later); late spring cleanup (excavator, fence, a hole); SUMMER → FALL the new tower rises a few floors a week (a crane
  swinging by day, work lights at night); TOPPING OUT (a small evergreen + flag on the top beam); LATE FALL the grand-opening
  night (its neon lights for the first time, searchlights); WINTER it stands finished. Each cycle a different design, so the
  skyline evolves over the years.
- The crane may overlap the sign / tagline area (the owner is fine with it) — the sign always draws on top and stays readable;
  keep the crane's red beacon from blinking right beside the NEON letters.
- THE SUN MUST NOT BREAK when the building is gone (the owner's catch): the sun's arch fit (`archFor`), the sign's catch time
  (catchAt: the sun going behind the rooftops) and the god-ray corridors use a FIXED skyline envelope that treats the
  construction slot as always full height; the actual drawing hides the sun naturally; the slot stays out of SUN_GAPS; beacons,
  outlines, windows and any searchlight on it follow the building's stage. Test at every stage (standing, rubble/empty lot,
  half-built frame, finished): the arch, the catch time and the rays stay stable and correct.
- Small renovations now and then elsewhere: facade scaffolding, a crown being re-tubed with new neon, a billboard repainted.

## Parts 11a / 11b / 11c — holidays (+ the banner plane's messages)
- THE SIGN DECORATION SYSTEM (built in 11a, used by every holiday + special event; hangs on Part 3's LOGO_ANCHORS):
  WRAPPED + GROWING (garlands, string lights, cobwebs, spring ivy / flowers wound round the tubes, growing day by day where a
  build-up calls for it); PERCHED ON TOP (snow caps, a pumpkin on the O, a hat on the N, a bird landing); ADD-ON TUBE PIECES (a
  heart, a shamrock, "2027", a firework burst, a crown — built like the logo's tubes); SPARKLE + PARTICLES (glitter, confetti);
  VISITORS (a cat walking along the top, a bird perching, the spider, the witch flying past). Anything that dangles has VARYING
  lengths. (Not a general system: tube makeovers — but the Christmas candy-cane tubes stay; no draped bunting; no glows behind.)
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
  gliding across), a submarine periscope that rises, turns to look at you and sinks, THE UFO ABDUCTION (late at night the
  promenade lamps flicker and dim, pigeons scatter, the UFO glides in low over the harbor and stops above the promenade, a
  tractor beam snaps on and 2–3 people float up spinning, arms flailing, one hat falls off and stays on the ground for a while
  as the only evidence, the UFO zips away, the lamps come back; ONLY background people, never a real player's figure or room
  guests); the ghost ship (Halloween). A few subtle, rare Grand Rapids nods (e.g. the October salmon run leaping).
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
- **LOBBY CHAT BUBBLES (Lobby 2.0):** a sent chat message pops up as a speech bubble above that guest's figure and fades after
  ~5 s (longer for long messages, up to ~8 s); crisp app text ~13–15 pt, never covering the figure, clear of the dock; first line
  or two then "…", tap → the chat at that message; one bubble per person (a new one replaces the old), older ones fade faster when
  many are up and bubbles nudge apart; the profanity setting applies; the full history stays in the chat window; builds on the
  existing typing dots.
- **TV MODE (after Lobby 2.0):** neonspeakeasy.com/tv shows a short code + QR; the host pairs via SHARE TO TV on their phone (no
  typing on the TV); the TV is a viewer, phones are controllers; the TV plays the music + big moments, phones go quiet (tiny
  taps only); a TV camera with a bigger stage so people read from the couch, gentle slow drift, push-ins on moments; step 1 the
  lobby, walk-in, standings + podium; step 2 per-game TV views (trivia games, HIGH STAKES first); a lighter tier for weak
  smart-TV browsers (best on a laptop/HDMI, Mac/iPad AirPlay, a cast tab).
- **BOARD 2.0** (the bar inside the speakeasy, an Art Deco brass + enamel honor board, a live bartender, windows onto the live
  Harbor) and **PROGRESSION 2.0** (levels 1–100, a wardrobe whose pieces turn neon at night, entrances, a birthday on the
  profile so the towers can spell "HAPPY BDAY <NAME>").
- **MENUS 2.0 (after Part 12's switch-over, judged over the real Harbor — the menus' glass sits over a still of today's city
  until then):** one pass for settings, chat, help, the game list, the profile card and toasts together: calm, classy warm glass +
  brass + a touch of neon that lets the city shine through; readable and fast, never as flashy as the city.
- **THE GAME LIST REVAMP:** quick filters SOLO · ON TV · SAME ROOM · FOR TWO (each game tagged with every way it plays; FOR TWO
  stars the planned nightly two-player bedtime game).
- **NEXT NEW GAME IDEA (follow up with the owner):** a multiplayer memory SHOOTING GALLERY — a 3×3 → 4×4 → 5×5 grid of targets
  flips to show pictures for ~5 s (shorter later), flips back, a picture is called (later 2–3 at once) and the fastest correct
  tap scores; wrong taps lock you out briefly; twists (swaps, decoys, a golden target); server-clock timing; a 1920s shooting
  gallery in the speakeasy's back room; fits SAME ROOM, FOR TWO, ON TV (grid on the TV, phones as triggers) and SOLO daily.
- **BITCOIN NODS (the owner is a big fan; subtle, rare, never explained, never prices or ads):** a ₿ glyph in the window font;
  JAN 3 (the genesis block, Bitcoin's birthday) an orange ₿ glows on a word tower at night; OCT 31 (the whitepaper's anniversary)
  one jack-o'-lantern on the speakeasy steps is carved with a ₿; MAY 22 (Bitcoin Pizza Day) a pizza delivery scooter pulls up to
  the speakeasy door and a small ₿ glows in one window.
- **BIRTHDAYS (once a player can add one, Progression 2.0):** celebrated ONLY for that player and their room — HAPPY BDAY <NAME>
  skytyped or lit on the word towers on their screen and their friends' screens in the room; never public.
- **DAY + NIGHT GAME SKINS (after City 2.0, game by game where it makes sense — GRIDLOCK, NEON PAR, SLIPSTREAM first):** night =
  super neon and bright, day = calmer and sunlit; a GLOBAL setting AUTO (default: follows the real day/night and respects ALWAYS
  NIGHT) / ALWAYS DAY / ALWAYS NIGHT with a per-game override; on AUTO the skin LOCKS at match start (never switches mid-game);
  light seasonal / holiday touches that never change gameplay; gameplay identical in both, both readable, each player sees their
  own; one shared day/night helper from the city's sky code; the walk-in from the city into a game matches the skin.
- **Later:** single-player / vs-AI modes and the 3 daily challenges (morning Wordle-style, afternoon Minesweeper, evening
  Overclock ×6) announced by the banner plane; profile pages for other players.
