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
| 2 | skyline ✅ | Opus 5.5 high | done |
| 3 | neon + signs + billboards + the NEON logo ✅ | Opus 5.5 high | done |
| 4 | water ✅ | Opus 5.5 medium | done |
| C1 | cleanup pass 1 ✅ | Opus 5.5 medium | done |
| 5 | harbor hero pieces ✅ | Opus 5.5 high | done |
| 6a | the everyday sky ✅ | Opus 5.5 high | done |
| N2 | Neon Pass 2 (clean tubes, midsection + waterfront, drone colours, real neon sounds) ✅ | Opus 5.5 high | done |
| N3 | Neon Pass 3 — the wow pass (neon on every building, depth, lighthouse, party show v1) ✅ | Opus 5.5 high | done |
| — | RUMRUNNER: Mr. Vale → Mr. Balboni ✅ | Sonnet 5.5 medium | done |
| P | the PREVIEW PANEL (JUST ME / EVERYONE ON CITY 2) ✅ | Opus 5.5 high | done |
| N4 | Neon Pass 4 — the neon in motion (racing party lights, the hard beat, sky beams, string lights, the wheel, fixes) ✅ | Opus 5.5 high | done |
| N5 | Neon Pass 5 — Safari (WebKit) fix + testing, the real beat, party colours, the wheel showpiece, sign sizes, faster tests, panel fixes ✅ | Opus 5.5 high | done |
| N6 | Neon Pass 6 — night touch-ups (flowing racing, soft beams, the wheel's glow + its backdrop, 3D outlines, ledge bands, icons removed, the lighthouse, the NEON logo race, the iOS beat) ✅ | Opus 5.5 high | done |
| D | the Day Pass (the city by daylight, painted day signs, sunlit 3D skyline, sky, sun, water) ✅ | Opus 5.5 high | done |
| R2 | ✅ (done Oct 22 — docs/harbor/review-2.md) FABLE READ-ONLY REVIEW #2 (after the Day Pass): a fresh-eyes audit of everything since Part 1 — code health + leftovers from the many passes, Safari / iPhone risks, performance, tests, docs vs reality, the plan vs what's built; FOCUS (the owner): the laptop perf check has failed every pass since Neon Pass 4 — is the party night really too costly, is the budget / the benchmark wrong for this laptop, or is it noise? Find out and recommend; a report only, then a cleanup prompt for what it finds | Fable | ~45–60 min |
| C1.5 | ✅ (7c58e32) CLEANUP + SPEED (from review-2.md): the O's core fix, wheel d live, Safari floor (top-level await, getContext guards), the new perf gate (relative A/B; the phone decides) + a slow-frame count on the readout, the party's 3 fill costs trimmed, one shared "how dark is it" input, the sign-dim hook, panel rows hidden, playwright reverted — NO visual changes | Opus 5.5 high | 45–75 min |
| DT1 | ✅ (Oct 23) THE LIGHTS + SIGNS PASS (Day touch-up part 1): the blue-hour power-up on the shared darkness value, floodlights (wheel roof accent, behind the lighthouse, landmarks, the waterfront flag), the signs rethink (left roof slot removed, the slot rule, roof-sign steel frames, the blade bolder, the billboard built on a frame + its 4 lamps), the glass tower + its beam, the tagline's dark halo, load hitches never cost a tier | Opus 5.5 high | 90–120 min |
| DT2 | ✅ (1d2dd08, Oct 23) THE DAY LOOK (Day touch-up part 2): real clouds (a full rework), stronger sunlit / shaded faces, windows less grid-like — three refine passes | Opus 5.5 high | 75–100 min |
| SP | ✅ (254eda7, Oct 23) SKY POLISH (the owner: clouds 7/10): cirrus streaks rebuilt (not speed lines), cumulus bases, a real overcast deck + the pink 1 pm tint + the logo lit by day under cloud, the moon halo softer, the sun's colour by altitude, beams lighting clouds (not passing through), the cloudy party's cost, smooth contrails, one more push on the day buildings | Opus 5.5 high | 75–100 min |
| M | ✅ (563cdb2, Oct 23) City 2.0 music (her 35 mood songs, the MUSIC MOOD setting) | Sonnet 5.5 high | 30–45 min |
| FA | ✅ (b87e589 — the owner: fixed, "even better": music returns by itself after the home screen / another app; one tap after a podcast or another app's music, as iOS requires. OPEN: in her screenshots the Web Audio context stays FROZEN after returning and the music runs on the DIRECT element — check the beat lights + SFX still work in that state; fold into 7a section 0) FABLE: THE iPHONE MUSIC BUG on evidence (the AUDIO panel: a new context "running" with a frozen clock, session ambient, gain 0, 6 rebuilds) | Fable high | 45–75 min |
| F1 | ✅ (294e105) FIX PASS: the iPhone music bug (still broken — a diagnostic first), the billboard lit at night, the beat lead, brick texture at noon | Opus 5.5 high | 45–75 min |
| DB | ✅ (ed141a3, Oct 23) MUSIC FIXES (drop slip8, the iOS music-dies-after-leaving bug, party beat latency) + DAY BUILDINGS (the owner: "a little flat", 7–8 / 10): cast shadows between buildings, ambient occlusion, recessed windows, materials — the "BUILDINGS BY DAY" notes | Opus 5.5 high | 60–90 min |
| 7 | ✅ 7a (12a4f9c, Oct 23 — the owner: 7–8 / 10 at night, cozy; the ghost ad = the BLADE, not the corner turn; the smaller corner buttons feel better) ( add-ons sent: the sun's colour by altitude — golden hour too white; SUNRISE + SUNSET presets in the panel's TIME category; the AUDIO panel's header says "sounding" while the detail says NO) REORDERED (Oct 23 — the owner: the placeholder foreground is ~half the phone screen and skews every judgement of the city's look; 6b's sky doesn't depend on it): the speakeasy + rooftop, day and night (the ghost ad + the corner-turn preview) — ask the owner a few look questions first | Opus 5.5 high | 60–90 min |
| FP2 | ← NEXT FOREGROUND POLISH 2: the beat SKEW after returning (re-converge the output lead), the promenade tweaks (far-left tree + urn removed, the medallion to the middle with a height cap, cart left of it, bench + a crabapple shifted left, the bus removed until 8b, the framing maple fixed), grout in the cobbles at night, the finished street under the dock, crisp lights (no smoke), the barber pole (bright LED-like, smooth, neon on party nights), party timing 8:30 / 9:30 | Opus 5.5 high | 75–100 min |
| FP | ✅ (fb332a1, Oct 23 — the owner: "a big jump", ~8 / 10) FOREGROUND POLISH (Oct 23): the beat-after-returning fix (count beats from the song's position, not the context clock — the owner's evidence: ~1.3 s drift), the promenade re-layout (approved sketch), the billboard on a short frame, the blade in front of the tree, the barber pole (smooth + brighter), the stop lights + a WALK/WAIT lantern, one crafted planter, the bench at night, quieter water + varied gulls, pulse default 175, readout + AUDIO toggles in the panel | Opus 5.5 high | 75–100 min |
| 8a | ✅ (2aecda7, Oct 23) (+ the 7a follow-ups in section 0; a grey-box STOP for the owner's OK; then a FOREGROUND POLISH pass for the speakeasy + promenade together) (+ the owner's idea, Oct 23: a second road along the bottom edge, behind the dock — Claude's counter, AGREED by the owner ("let's try it, we can remove it later" — build it behind a preview flag): NO visible traffic behind the dock (moving cars behind JOIN / HOST would be the busiest thing right behind the most important buttons, and the biggest, most detailed objects on screen); instead an IMPLIED road just below the frame: a curb + the lamp posts' bases along the bottom edge of the promenade, and passing cars shown only as LIGHT — headlight sweeps gliding across the paving at night, a soft passing shadow now and then by day, the raid's red / blue washing across the promenade from the front) THE PROMENADE'S LOOK (static scenery, day + night): real trees, street lamps, benches, railing, paving, the waterfront edge — designed around the dock; no people / routines yet | Opus 5.5 high | 60–90 min |
| 6b | the special sky (+ section 0: the moon, geese, meteors, contrails, helicopter depth, drones in front of the moon + the sign fading for sky messages) | Opus 5.5 high | 90–120 min |
| 8b | THE LIFE (after 6b): people, vehicles, wildlife, Rosie + the boats in 3D, the billposter + sign painters, the CITY SCHEDULE routines | Opus 5.5 high | 60–90 min |
| C2 | cleanup pass 2 | Opus 5.5 medium | 15–30 min |
| 9 | seasons + weather | Opus 5.5 medium | 45–75 min |
| 10 | party nights + fireworks (the "Part 11" section below) | Opus 5.5 high | 60–90 min |
| 11a | autumn holidays: the shared holiday system (calendar, build-ups, sign dressings), the parade system, the banner plane's messages, Halloween, Day of the Dead, Thanksgiving | Opus 5.5 high | 60–90 min |
| 11b | winter holidays: the Christmas build-up, the tree lighting, the Christmas sign, New Year's Eve (ball drop, window countdown, the finale on Part 10's fireworks) | Opus 5.5 high | 60–90 min |
| 11c | spring, summer + patriotic: Valentine's, St. Patrick's, Easter, Memorial Day, July 4th (air show + fireworks), September 11, Veterans Day | Opus 5.5 high | 60–90 min |
| 12 | easter eggs, sounds, desktop, switch-over | Opus 5.5 medium | 60–90 min |
| C3 | final cleanup | Opus 5.5 medium | 30–45 min |
| 13 | CITY CONTROL (admin) | Opus 5.5 medium | 45–60 min |
| L | GAME LINEUP SESSION (a chat with Claude, no build — the owner, Oct 23): which games stay / go / are new, final names (e.g. PRISM vs PRISM DROP), how each roughly plays — BEFORE Lobby 2.0 + Progression 2.0, which are built around the games. The owner's order: finish the city → this session → lobby, progression, City Control, settings → the games; release once ~5 games are complete, no date | chat | ~1 h |
| 14 | Lobby 2.0 + the public crowd | Opus 5.5 high | 90–120 min |
| 15 | TV mode, step 1 | Opus 5.5 high | 60–90 min |
| 16 | Board 2.0 | Opus 5.5 high | 60–90 min |
| 17 | Progression 2.0 | Opus 5.5 high | 90–120 min |
| R-ALL | FABLE WHOLE-APP READ-ONLY REVIEW (the very end — the games, lobby + rooms + sync, profiles + progression, every /api, City 1.0 / the Harbor, security before app stores + payments); a report, then a cleanup prompt | Fable | ~60–90 min |

**TESTING SCOPE (the owner, Oct 22 — no traffic yet, the games will be reworked):** City 2.0 passes test the CITY only. No
game-by-game or every-phone game sweeps. Only when a pass touches files the whole app shares (title.js / title.css, the
router, shared helpers, /api): one quick smoke check — the default city loads at 402×874 and one game opens — then stop.
The full game suites wait for the games' own rework and the final whole-app review.

**How every part works:** a "work efficiently" block (a bug not fixed after 2 real attempts → logged in docs/harbor.md
"Known issues", move on; never polish what a later part rebuilds; while working only the part's own tests; at the end the unit
suite + e2e-harbor + a quick default-city smoke check — the full 5-minute title suite only at the cleanup passes and Part 12;
two screenshot refine passes; subagents for wide reading; ask the owner at once on a conflict). Every part updates
docs/harbor.md (what it built, the stubs table, the handoff note) and gives preview links on neonspeakeasy.com with
?city=2&tz=America/Detroit&at=42.96,-85.67.

## Rules that apply to everything
- **The night is the bar for everything (the owner, Oct 22):** the night + party city after Neon Passes 2–6 is "stunningly
  beautiful, crisp, colorful, high detail, premium". Every other look — day, golden hour, rain, snow, holidays, the desktop,
  the promenade, the speakeasy — must reach that same level, checked side by side with the night at phone size.
- **The whole sky is free — behind the sign (the owner, Oct 22; replaces "never across the NEON sign or the tagline"):**
  every sky object (planes, the banner plane, helicopters, jets, birds, bats, balloons, UFOs, drones, smoke, meteors) may use
  the WHOLE sky from the top safe area down to the skyline, passing BEHIND the NEON sign and the tagline (they always draw
  on top, so the sign stays readable) and in front of the sun, moon and stars. Never over the dock or the corner buttons.
  The lanes stay only for depth (high = small + far, low = bigger + behind the taller roofs) and to keep events from
  colliding. The one planned exception: the barnstormer threading THROUGH the letters (6b). Sky messages dim the sign.
  THE THREE DEPTH RULES (the owner, confirmed): (1) EVERYDAY SKY (planes, contrails, helicopters, birds, bats, balloons,
  UFOs, meteors, satellites) — the whole sky, BEHIND the corner buttons, the NEON logo + tagline and the taller buildings,
  IN FRONT of the moon, sun and stars; (2) MESSAGES (the drone show, skywriting, skytyping, the banner plane) — IN FRONT of
  the logo, which dims / the tagline fades while they fly (the banner under SPEAKEASY through the tagline's band); (3) THE
  BARNSTORMER — THROUGH the letters.
- **The beat must be felt (the owner):** anything that pulses to the music pulses HARD — a fast attack to a clearly brighter
  peak (a big swing in brightness + glow, not a few percent), then a quick decay, harder on downbeats / drops — obvious on an
  iPhone at a glance; still never full-screen flashing or hard on/off across large areas.
- **The "does it make physical sense" check (every moving piece):** review each one across its WHOLE path (a burst of frames
  from start to end, not one still), and check depth: what it passes in front of / behind, and that its light, beam, shadow,
  reflection and glow land where the thing really is (a helicopter behind the towers can't light the water in front of them;
  drones can't fly behind the moon). List each piece's depth in the review notes.
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

- NEON PASS 2 (after 6a, the owner's zoomed iPhone review): outlines hidden by nearer buildings (no drawing over them), clean end
  caps, one tube bent around the MAIN setbacks with rounded corners (no 8-bit stair-steps), no tube through a sign, no icon on a
  tube, NO signs on any hero tower's face (EMPIRE + the white tower too — icon spots added elsewhere), no sign/icon/tube clipped by
  the screen edge, the billboard's small second line fixed or dropped; MORE NEON IN THE MIDSECTION (mid-building rooflines +
  setbacks, Deco ledge bands, fins + corner trims, and a WATERFRONT STRIP of ground-level bars/diners/theatres along the far shore
  reflected in the harbor; nearer buildings warmer — pink, amber, red — towers cooler); drone colours; real neon SFX from the
  owner's picks.

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

## Part 6 — sky hero pieces (existing behaviour, new art) — SPLIT into 6a (everyday sky, DONE Oct 21) + 6b (special-occasion sky)
- 6a built: tier 2 on modern iPhones (iOS reports capped cores), white wheel bulbs + a glow ring, the game blade in HOTEL's spot,
  airliners, the banner plane (lit at night), skywriting + skytyping, the helicopter, birds, balloons, the moon art, the aurora
  (~2 nights a month for everyone + real Kp ≥ 7), the drone show (barge launch) as the night form of sky messages — sky messages
  only on holidays or when sent (CITY CONTROL), never random.
- 6b: the jets + air show (our own team) + the F-16 missing man; TWO UFOs, realistic not cartoonish — a classic metallic saucer
  (rotating rim lights, an underglow lighting the haze/water, slow silent hover; it does the promenade abduction) and the TR-3B
  (matte black triangle, a glowing red orb at the belly's centre + three orbs at its points, slow silent glide, then impossibly fast
  and gone; a rare night flyover); skydivers (colourful canopies by day, ankle flares + canopy lights at night); the witch; Santa's
  sleigh. Every piece gets day + night versions (golden-hour touches where they help).
- POLISH LIST (small things, for the cleanup passes): the NEON logo at night — a white-hot glass core inside each pink tube
  (the colour in the glow around it), a faint pink cast of its light on the haze / clouds behind it, the tiniest uneven
  brightness along each tube; SPEAKEASY's letters as real thin tubes. Size stays.
- CITY 2.0 MUSIC (after the Day Pass, before 6b): import ALL the owner's mood songs — she has added more since (more than 35
  now) — from the ~/Downloads mood folders (morning, day, evening, late, party — check the exact folder names; use every
  audio file in them); IGNORE the victory and neon folders as City 2.0's mood lists (City 1.0 keeps its own; victory + game music stay as they are); neighbouring moods may
  share songs (bigger decks) — the owner's first: morning10.mp3 (in the morning folder) plays in BOTH the MORNING and the LATE
  NIGHT rotation, one file shared by both lists (never uploaded twice); seasonal songs later; a MUSIC MOOD setting (in BOTH cities — the owner's call): AUTO (default, follows the time of day) / MORNING /
  DAY / EVENING / LATE NIGHT / PARTY — in a lobby the room's synced song follows the HOST's setting. Later, once a mood has
  ~30+ songs: rotate halves week by week (the owner's idea — not before, it would make repeats worse).
- BUILD ORDER NOW (Oct 22): the Balboni rename → THE PREVIEW PANEL (the owner's test remote: JUST ME / EVERYONE ON CITY 2,
  admin-only via /api/admin, a server-written city2/live node — the seed of Part 13's CITY CONTROL, which later adds the PIN,
  the confirm tap and MY ROOM once City 2.0 is the real city) → Neon Pass 4 → the Day Pass → City 2.0 music → 6b.
- DAY TOUCH-UP PASS (after the Day Pass; notes so far): (1) the CLOUDS look like cartoon bubbles in rows with flat bottoms —
  real varied cumulus, soft edges, real shading; (2) the sunlit vs shaded sides too subtle at phone size — more contrast so
  buildings read as solid 3D; (3) windows still grid-like from a distance; (4) THE POWER-UP WAITS FOR THE BLUE HOUR (the
  owner): golden hour = pure sunlight (warm facades, gold glass, long shadows), NO building neon; only a FEW warm windows
  come on (~5–10 %, first on the shaded sides, the sunlit faces show gold reflections instead); at sunset the city powers
  up in a staggered ~30-min wave through the blue hour — more windows, the signs flicker on, the outlines cluster by
  cluster — fully lit against a deep-blue sky; the NEON logo keeps its own timing; party nights the same power-up first;
  + the owner's iPhone notes on the Day Pass.
  (5) DECIDED (Oct 22): THE WHEEL BACKDROP = d (floodlit stone) + a NEON ROOF ACCENT on that building (a thin Deco roofline,
  calm, never brighter than the wheel); remove a / b / c. FLOODLIGHTING ELSEWHERE — the owner hands the picks to us:
  reuse it around the city for depth — AND (the owner, Oct 22) try a soft FLOODLIT WATERFRONT ROW: the front buildings
  along the water get a low uplight wash (the bottom third of each facade, fading upward), warm, uneven (some brighter,
  a few gaps — never one even band), dimmer than the wheel's backdrop building so that one stays the brightest; it shows
  in the water's reflections. Build it behind a preview flag (on / off) so the owner compares and decides — maybe not on
  all of them (the owner agreed). FOR SURE: THE BUILDINGS BEHIND THE LIGHTHOUSE get the wheel-backdrop treatment (the
  owner, Oct 22): soft floodlight on the BRICK so it reads as a real building behind; KEEP THE WINDOWS as they are (at most
  ~10 % fewer, the owner likes them), so the lighthouse pops
  against a calm lit wall like the wheel does — a touch softer than the wheel's backdrop (the wheel stays the focal
  point); nothing boxy behind the tower (the earlier rule); the lighthouse beam brightens the wall as it sweeps past. Also: uplit facades on a few chosen landmark / mid-distance buildings (not every one), so
  the skyline reads in layers. Night + it switches on as part of the blue-hour power-up; NOT by day (the sun's lit / shaded
  faces do that job in the morning and golden hour). Party nights may tint the floodlights.
  (5b) The owner's iPhone check (Oct 22): buildings now read solid + 3D ("more polish passes needed"); clouds need a lot
  of work; party night 60 fps, work 1.6 / 2.0 ms but 4–7 % slow (was 0–3 % before the Day Pass — R2 looks at why). At
  night the DOUBLE AGENT billboard (left, under BLUFF) reads as a dull grey board — its night face must glow like the others.
  (5b-2) The owner's iPhone, party 23:00 (Oct 22, 10 pm): mostly 0 % slow, peaks of 4 % (the 7 % was right after load) —
  not a big problem. The readout showed "2→1→2": the city dropped to tier 1 and back, probably on the load spikes. Check
  the tier logic ignores the first seconds after load (bakes / fonts / images) so a load hitch never costs a downgrade,
  and the slow-frame count can skip the first ~10 s (or show both).
  (5b-3) THE TAGLINE OVER THE MOON (the owner): when the moon sits behind SPEAKEASY the pink letters get hard to read.
  The pro fix (titles / subtitles over changing backgrounds): a soft DARK HALO hugging each letter of the tagline (and the
  NEON word) — a blurred dark shadow, always on, invisible against the dark night sky, so it only shows where something
  bright is behind (the moon, the day sky, the sun, fireworks, beams). Plus the moon dims ~20–30 % softly while it's behind
  the tagline band. NOT a light haze (that lowers contrast). Never a box or visible panel. Check at night with the moon
  behind each part of the tagline, and by day. The halo + dim read the sign's LIVE position (6b raises the sign ~20–30 pt
  and then re-fits the sun / moon arch — that re-fit should also keep the moon's path out of the tagline band where it
  can, crossing it quickly when it must; re-check this fix after 6b).
  (5b-4) THE OWNER'S DT2 PHONE CHECK (Oct 23, in progress): the PLANE CONTRAILS look jagged / skippy / jumpy — investigate
  (likely the trail drawn as segments at fractional / frame-stepped positions, or sampled per frame so it steps at 60 Hz;
  fix: a smooth continuous path, sub-pixel, eased spread + fade) — folds into 6b's "fluffy contrails like City 1".
  The HIGH STREAKS (cirrus / long thin streaks): the owner loves the idea, "not there yet" — needs tweaking (in her
  screenshot they read like hard speed lines; softer, feathered, varied, following the wind). Claude's notes from her
  OVERCAST screenshot (13:00 &wx=overcast, to raise with her): it shows separate puffy clouds with blue-violet gaps, not an
  overcast deck; the whole sky is pink-violet like dusk at 1 pm; the clouds still read a bit cartoon-round; the NEON
  letters E-O-N look lit pink by day (N unlit) — check whether the darkness value turned the logo on under cloud;
  30 fps there (Low Power Mode?). From her MORNING (9:00) screenshot: the sun is a flat orange-peach ball with no bloom
  at 9 am (should be near-white with a soft bloom ~20° up; orange only right at the horizon); the high streaks again read
  as hard speed lines; small cumulus still a bit cartoon-round; windows on the mid towers still grid-like; buildings'
  3D reads OK; readout says 30 fps by day while frame shows 17 ms (a day frame cap? ask the builder).
  NIGHT (22:00, &wx=clouds): the owner — cumulus look OK, the high-altitude streaks do NOT. Claude's notes: a big faint
  RING around the moon cuts through the tagline (a moon halo? reads like a stray circle — check what it is); the
  billboard glows warm under its lamps (good); the clouds' violet underglow reads well.
  PARTY + CLOUDS (23:00, &wx=clouds): the owner — the MOON HALO is too concentrated (soften: wider, fainter, no hard ring
  edge, never a circle cutting the tagline). Claude's notes: 4.2 % slow (3.1 % after 10 s), work 5.1 / 8.0 ms — a cloudy
  party costs ~3× a clear one (1.2 %): trim the clouds + beams-on-clouds cost; HIGH STAKES stacked on the roof sign reads
  well; the billboard showed "PRISM DROP" — so PRISM's full name is PRISM DROP and the blade's "PRISM" alone breaks the
  never-shortened rule (ask her about SIGNAL / CIPHER / BLUFF too).
  REAL MORNING (Fri 8:52 am, live): the sun here IS a white bloom (good — so the 9:00 orange ball was the preview's
  low-sun colour, recheck); cumulus read much better (soft, shaded, varied); a few still have flat grey slab bases; the
  streaks again cross behind SPEAKEASY like speed lines; overall the day now reads like a poster.
  (5b-5) THE SPELL-ON (the owner loves it, Oct 23): a neon sign going dark, then lighting back up one letter at a time and
  staying on (Neon Pass 4's normal-night "spell" effect). Make sure EVERY neon sign (both roof signs + the blade) does it
  now and then on normal nights — staggered, never two at once, every ~few minutes somewhere — and keep it on party nights
  between show scenes.
  (5c) THE SIGNS RETHINK (Oct 22 — the owner: one-word signs like "STAKES" tell nobody anything; let the CITY be the neon and
  the billboards be old-school painted billboards, lit at night). Being decided one by one:
    - BLUFF (the neon box on the top-left roof): REMOVE (agreed) — it frees that tower's pink neon crown and un-stacks the
      left side.
    - DOUBLE AGENT (the billboard under it): AGREED — repainted properly as a 1920s painted billboard: the game's ICON + the
      FULL NAME, big, filling the board (no tagline — no room); the gooseneck lamps (6) on it; fixes its dull grey night look.
    - SIGNAL (the neon blade on the gold tower): KEEP as neon (the owner) — a little bolder / brighter, it's hard to read
      today; its marquee chase bulbs a touch bigger / brighter / more prominent.
    - THE BILLBOARD MUST BE BUILT, NOT FLOATING (the owner can't tell what holds it up): it sits on the ROOF of the mid
      building it's on (not the speakeasy) on a real steel structure — lattice legs / an A-frame, a catwalk along its
      bottom with a thin railing, the gooseneck lamps' arms rising from the catwalk — cast in the same sun / shade and dark
      at night except where the lamps light it. Check it makes physical sense (the depth check) at 390 / 402 / 430.
    - PART 8 EVENT — THE BILLPOSTER (the owner's idea): when the billboard changes game (once a day, with the nightly sign
      rotation), a worker climbs the ladder onto the catwalk and pastes up the new poster on a fixed daily schedule (e.g.
      mid-morning): a long-handled paste brush, the new poster going up in strips over the old one, the lamps' arms
      in the way, then he climbs down. Goes on the CITY SCHEDULE. Decide in Part 8 when the "day's games" flip so the
      board never shows a game before he pastes it.
    - THE THIN GLASS TOWER (back, left of the wheel) is the only building with no neon or lit windows on ANY night (the
      owner): EVERY NIGHT give it a FINE, dim outline like the other far buildings + a few lit floors / a soft glow in its
      glass; on party nights its outline joins the show and its glass picks up the party colours (beam / sweep
      reflections) — still the calmest tower, so it reads as far away. PARTY NIGHTS: it gets a SKY BEAM too (the owner: the
      gap in the row of beams looks odd) — thinner and fainter than the others since it's the farthest tower, a cool ice /
      white to suit the glass, joining the beams' colour sweeps; it may pass in front of the moon (physically right).
    - BLUFF's removal, the owner's rule: the building behind it must be FULLY finished where the box was — its whole
      outline traced in neon, its crown, windows and roof built out — never a black gap or a cut-off shape where the sign sat.
    - TWO-WORD NAMES (the owner: the blade showed just "STAKES", the left roof sign just "AGENT"): the blade is only ~20 pt
      wide on a phone, so a header word won't fit readably (dropped the T-header idea). THE SLOT RULE: the nightly rotation
      assigns games to slots by name — the vertical BLADE takes ONE-WORD names only (SIGNAL, CIPHER, BLUFF, PULSE, PRISM,
      OVERCLOCK…); TWO-WORD names (HIGH STAKES, DOUBLE AGENT, NEON PAR…) go to a ROOF SIGN (stacked on two lines) or the
      BILLBOARD (one line). Never a shortened name anywhere.
    - "REMOVE BLUFF" means REMOVE THE LEFT ROOF-SIGN SLOT (whatever game it shows that night — tonight it showed AGENT);
      every game keeps its turn in the other slots.
    - CIPHER + STAKES (neon roof signs, right): AGREED (the owner) —
      keep as the neon landmarks; always the FULL real name (HIGH STAKES stacked on two lines); visible steel lattice frames
      + a catwalk under the roof signs so their size reads as deliberate; any game whose name won't fit a roof sign gets the
      billboard that night. (4 sign slots a night instead of 5.)
    - The rule for every sign: never a shortened game name.
    - BUILT (DT1, Oct 23): 3 named signs a night + the billboard; long one-word names (OVERCLOCK, GRIDLOCK, SLIPSTREAM,
      RUMRUNNER) only fit the BILLBOARD (each once a week). PART 12 DESKTOP: the desktop layout drops the billboard today —
      it MUST keep a billboard (or give those games another readable slot), or those four games never show on desktop.
  (6) BILLBOARD LAMPS (the owner): every billboard / painted ad gets 1920s gooseneck lamps on arms over its top edge —
  the layout: TWO lamps on each side of the logo at top centre (four per board, the logo between them, the word below),
  warm old-school incandescent tone (~2700 K amber-gold),
  visible as hardware all day. They switch ON at late golden hour (the first thing in the power-up, a warm pool of light
  down the poster, before the windows and neon) and in the morning from dawn until a little after sunrise; off at midday
  (sunlight). At NIGHT they drop to a soft, dim wash once the neon is fully on (never competing with the neon; judge night
  side by side with / without — if they still distract, switch them off when the neon is up). Same lamps Part 7's ghost ad uses.
- CITY SOUNDS — THE HUNT LIST (the owner collects real recordings; CC0 / royalty-free, e.g. Freesound CC0, Sonniss GDC bundles;
  WAV 44.1 kHz; the builder trims + levels them like the neon set). The city NEVER goes quiet at night — it gets naturally
  quieter because it's less busy (fewer cars, people, boats; the hourly bell still rings, just sounding over a calmer city).
  Loops must be seamless, 1–2 min. Grouped by when they're needed:
  - PART 7 (the speakeasy + the raid): a muffled club through a wall (crowd murmur + laughter, a party version louder) — the
    jazz itself is our own music, low-passed; a door opening/closing (heavy wood, a moment of loud jazz); a cat's meow; a TV
    murmur through a window (late night); 1920s police cars (old engines rolling by, tyres on wet road); a soft distant
    1920s siren wail (rising and falling).
  - PART 8 (the promenade, people, vehicles, the city schedule): harbor water lapping at the quay (loop); a distant city hum,
    day and night versions (loops); light far-off traffic (loop) + single cars passing; a bus's air-brake hiss + idle + pulling
    away; the HOURLY SHIP'S BELL; the NOON STEAM WHISTLE (1920s steamboat / factory); a big ship's horn (the 7 pm dinner
    cruise); gulls (several distant calls); a friendly distant dog bark or two; a farmers' market murmur (Saturday); milk
    bottles clinking / a delivery truck (dawn); a trash truck (Monday).
  - PART 9 (seasons + weather): morning birdsong (spring/summer); summer-night crickets; autumn wind through leaves; winter
    wind; snow's muffled hush; a distant FOGHORN (real fog); rain on pavement + on the water (rain + thunder exist already).
  - PART 10 (party nights + fireworks): real fireworks (launch whoosh, bursts near + far, crackle / glitter); a crowd cheer
    (fireworks, the NYE countdown); the party yacht's music + a helicopter landing.
  - 6b + THE SKY: a helicopter (distant + flyby); airliners far up; a prop plane drone (the banner plane, skywriting); jets
    flyby (the air show); a hot air balloon's burner whoosh; geese honking; the UFO saucer's low hum + the abduction beam; the
    TR-3B's deep drone + electrical crackle / power-down (the blackout); witch cackle + sleigh bells (holidays).
  - PART 9's CONSTRUCTION TOWER: a warning siren + horn blasts, the implosion's charges + a long rumble, distant hammering /
    a crane.
  - LEGENDARY EVENTS: the ghost ship (creaking wood, a ghostly bell), the harbor monster (a big splash), the party yacht.
- THE SATURDAY 10 PM DRONE SHOW (the city schedule; ~4–5 min, a different running order each week, the player's local time):
  the show opens with "NEON SPEAKEASY"; then 3–4 picks from a rotating set — a heart, a star burst, two or three game logos
  (a different few each week), the week's season (a pumpkin in October, a snowflake + a tree in December, a shamrock in March,
  a flag on July weekends, flowers in spring), the ₿ now and then (rarely, a nod), a cocktail glass, the lighthouse, a
  Ferris wheel that turns, "SEE YOU INSIDE" to close; colours per Neon Pass 2. CITY CONTROL can override the running order.
- THE CITY SCHEDULE (the owner's idea — set-your-watch routines on the player's own clock; built in Part 8 with the people and
  vehicles, Part 10 adds party nights + the weekly drone show; sounds join the soundscape). iPHONE-FIRST — only what reads on
  a phone (near promenade, the big skyline, light changes, sound); far-shore detail is desktop / TV only.
  (Owner decisions after review #2, Oct 22: perf gate = relative A/B in one run only, absolute budgets are per-tier
  warnings, her iPhone decides; the Harbor's Safari floor = iOS 16 (the games + City 1.0 must still run on older iOS);
  revert the playwright change; hide the UFO + MOON CAT panel rows until 6b.)
  THE "ALWAYS SOMETHING HAPPENING" RULE (the owner, Oct 22): whenever anyone opens the city, they should be able to catch
  something cool already IN PROGRESS. So: (1) never stack the routines at the same time — spread them across the day and
  week so no hour is empty (e.g. the billposter, the ghost-ad sign painters on Monday 8–11 am, the tower construction,
  the speakeasy window scenes, the steamer's whistle, the planes, the wildlife each in their own slots); (2) make the
  routines LAST — painting, pasting, building take minutes to hours, in visible stages, so you arrive mid-way; (3) every
  event (incl. the rare + legendary ones) JOINS MID-WAY on load, never only from the start; (4) a planning table in
  docs/harbor.md: each hour of the week vs what's running, so gaps are visible; Part 13's CITY CONTROL shows it.
  Includes sunrise / sunset, seasons, weather, holidays — the whole city, not just Part 8.
  - PHONE: the street lamps switch ON one by one at sunset and OFF one by one at sunrise; a ship's bell rings each hour; the
    paddle steamer's STEAM WHISTLE at noon (a white steam plume + the sound); dog walkers at sunrise + sunset (more on
    weekends); the morning rush (more buses, people with coffee on the promenade); the lunch crowd at the food cart; the
    office towers going dark in waves after 5–6 pm; the dinner cruise leaving the pier at 7 pm, lit up; the line at the
    speakeasy door; the last bus at midnight; a few stragglers wandering home after 2 am last call; a newspaper / milk truck
    on the road at dawn; the Saturday-morning FARMERS' MARKET on the plaza (stalls + awnings); Monday trash day.
  - PHONE BY LIGHT ONLY: the theatre marquee on the far shore chases brighter at 8 pm showtime and dims after 10:30; the
    waterfront shops light up in the morning; the fishing boats' lights heading out at dawn and back at dusk.
  - DESKTOP / TV ONLY: the theatre crowd, shop shutters rolling up, people on the far quay.
  - THE BIG MOMENTS DUCK THE MUSIC (the owner): for the prominent routine sounds — the noon steam whistle first, also the
    dinner cruise's horn at 7 pm and the Saturday drone show — the music dips gently (duckMusic) just before, the sound plays
    clearly, then the music slowly ramps back up over several seconds. The small ones (the hourly bell) play under the music
    without ducking. Only a few ducks a day, so it stays special.
- THE DAY PASS (after Neon Pass 2, before 6b; the owner: by day, high noon especially, "it looks pretty rough"): signs read by
  day through PAINTED faces (enamel boards, bold solid letters, tubes faint on top), the skyline lit by the real sun (lit vs
  shaded sides, soft setback shadows, bright ledge lines), real aerial depth, windows reflecting the sky, a real daytime sky +
  clouds, a white-hot sun with bloom, the water by day. Night / dusk / party unchanged.
- 6b section 0 — THE SIGN MAKES ROOM FOR SKY MESSAGES (the owner's idea): for a drone show or skytyping/skywriting, the NEON
  sign (and tagline) power down on purpose — a soft dim with a flicker or two, the dropout sound — AND its glass then fades to a
  faint ghost (~15%), so unlit tubes never cut through the message (by day the sign is already off: the glass just fades out
  and back in); the message fills the open sky, big and high, readable at a glance; drone shows are night only; it stays fully readable ~15 s after it's complete, then the sign re-ignites (the
  warm-up + the power-on, the hum fading in 10 s) and the message carries on fading behind it (smoke drifting, drones
  scattering / landing). The dock never changes. Not for the banner plane (it has its own lane), never during the NYE countdown
  or the catch; re-scale the drone formations / skytyping for the full sky — after Neon Pass 3 the formation sits in the
  small band between the skyline and the tagline (the owner: "it only uses a very small part of the sky"); with the sign
  gone it fills the sky from the crowns up to near the top safe area, big. DRAW ORDER BUG: drones (and smoke, planes,
  balloons) must draw IN FRONT of the moon, the sun and the stars — never behind them (the moon is far away).
- 6b — THE TR-3B's EFFECT ON THE MUSIC (the owner's idea): as it nears, the music "loses power" — a TAPE-STOP slowdown (the
  pitch and speed sagging), a closing low-pass, a little crackle / warble of interference — sinking to near silence under the
  craft's deep drone; it stays down while it passes; after the CHASE jets leave the screen the music powers back up — filter
  opening, volume fading back in over a few seconds. Lobby / synced songs re-sync to the room's clock when they return (no
  drift). Title + lobby only (never in a game); with music off, only the drone + the crackle play. Uses the existing
  duckMusic / filterMusic + a playback-rate ramp.
- 6b — LEGENDARY SKY RARITY (the owner): the UFO abduction ~1–2 a month, the TR-3B + its jet chase ~1–2 a month (the same
  nights for everyone, seeded), never two legendaries the same night; the barnstormer a few times a week.
- 6b — THE TR-3B BENDS THE MUSIC (the owner's idea): as it nears, the music POWERS DOWN like a record player losing
  power — the pitch and speed sag (a "tape stop"), it goes muffled (filterMusic low-pass) with a faint warble and electrical
  crackle; while it's overhead the music is almost gone, only a low hum. After the jets of the chase leave the screen, the
  music comes back — a soft power-on, then a smooth fade back up to normal over a few seconds. With music off, the
  soundscape gets the same treatment. Title / lobby screens only; never in a game; follows the music setting.
- 6b — THE TR-3B's CHASE (the owner's idea): a few seconds after the TR-3B leaves the screen, 2–3 military jets in tight
  formation SCREAM across in a straight line after it — afterburners blazing, green formation lights at night, a roar that
  rises and Dopplers away (the sound list), the city's lights still flickering back on in their wake. Every TR-3B pass ends
  with the chase.
- 6b — THE TR-3B's POWER INTERFERENCE: it affects EVERY power source within its range — windows, neon outlines, signs, the
  NEON sign, street lamps / lamp posts, string lights, searchlights + sky beams, the wheel's bulbs, the lighthouse, the
  HEADLIGHTS + lights of cars, the bus and the boats — like the energy is being SUCKED OUT: a gradient by distance (the edge
  of its range dims and flickers, anything close shuts off COMPLETELY), moving with the craft, then restoring unevenly as it
  moves away (details below).
- 6b — THE TR-3B's POWER INTERFERENCE (the owner's idea): the black triangle crosses the WHOLE screen, big and slow, and the
  city's lights under it fail as it passes — a moving zone below and around it where windows flicker and go dark, neon
  stutters and dies, street lamps buzz down, the NEON sign glitches if it passes over; a soft electrical crackle / the hum
  dropping out, then everything flickers back on behind it, a few lights slow to recover. At night the dark craft is noticed
  BY the lights dying under it (its three orbs + the red centre the only lights of its own). IT MUST BE CLEARLY VISIBLE (the
  owner): fly it through the band just above the skyline where the city's coloured glow lights the haze, so it stands out as a
  sharp black silhouette against the glow; a thin rim of city light along its edges; it blots out stars and the moon as it
  passes; its orbs bright and pulsing; best at the blue hour or on a hazy / low-cloud night (lit cloud base behind it), never
  against plain black sky. Cheap: a moving dimming mask
  over the baked layers + a few individual flickers.
- 6b section 0 — SHOOTING STARS RARER (the owner: "they happen pretty frequently"): today core/sky.js#meteorsOf gives 0.1 a
  minute on ANY clear night (one every ~10 min) and 3.2 a minute on a shower's peak, 1.1 a day either side (the Orionids peaked
  Oct 21, so she saw a lot). City 2.0 only: a normal clear night ~1 every 30–45 min; a shower's peak night ~1 every 2–3 min,
  ±1 day ~1 every 8–10 min; plus a RARE bright FIREBALL (a big slow green-white streak that breaks up, a few times a year — a
  City Sightings badge later). Keep the moon's three-tap shooting star. REBUILD THE ART (City 2.0 still uses City 1.0's thin
  line + dot, district/fx.js): a tapered streak with a hot bright head, a faint colour tint (green, blue-white, a touch of
  orange), varied speed / length / angle / brightness, the odd one flaring and breaking into sparks, a faint glowing trail that
  lingers a moment; on a shower night they all fly out from the shower's real radiant point; the bright ones glint on the water.
- 6b section 0 — THE HELICOPTER's DEPTH (the owner): it flies in sky-low, the lane that passes BEHIND the taller towers, yet
  its searchlight lands on the harbor in FRONT of the skyline — impossible. Fix: the helicopter flies OVER THE HARBOR, in front
  of the skyline (a real depth between the far quay and the pier, drawn after the skyline, sized for that distance), so it never
  slips behind a tower; the beam drops straight down from it to the water below it in perspective, its pool + glint where it
  lands, reflected; when it leaves it climbs away over the city (smaller) with the light off, or exits past a side.
- 6b section 0 — FLUFFY CONTRAILS BACK (the owner loved City 1.0's): City 2.0's capped contrails (air.js: 6 batched strokes,
  ≤ 60 samples, a 22 s life) are cheaper but read thinner / smoother. Bring back City 1.0's soft FLUFFY look — puffy, billowy
  edges that slowly spread, drift on the real wind and dissolve, a little longer life (~30 s) — while keeping the cost capped
  (e.g. a soft puff sprite stamped along the path into a small layer, refreshed a few times a second). Same rules (high planes,
  dry, not overcast, by day / golden hour, pink-gold at sunset).
- 6b — THE BARNSTORMER THROUGH THE SIGN (the owner's idea): a rare stunt (a few times a week) — a 1920s barnstormer biplane
  THREADS THROUGH THE LETTERS: behind one stroke of the O and in front of the other, weaving round the N, maybe a loop; the
  one planned exception to "nothing flies across the sign" — the plane is drawn BETWEEN the sign's layers using the letters'
  mapped paths (LOGO_ANCHORS / the tube paths), so the right strokes sit in front of it. By day a bright red biplane with a
  thin smoke trail; at night wingtip lights glinting on the tubes and the sign's pink glow lighting the plane; the letters
  wobble / flicker a touch in its wake. &force=barnstormer; a City Sightings badge later.
- 6b section 0 — SKY MESSAGES: LONGER, BIGGER, IN FRONT (the owner): skytyping (day) and the drone show (night) share ONE
  message layout. While a message flies, the NEON sign + tagline DIM (not vanish) and the message draws IN FRONT of the dim
  sign, using the whole sky from just above the crowns up to the top safe area. Words wrap at word boundaries into up to
  3 LINES (~16 letters a line) per "page", letters as big as the space allows (much bigger than today); longer messages play
  as PAGES in sequence (the drones re-form / the jets type the next page), up to ~3 pages (≈ 140 characters, a couple of short
  sentences). Examples that must work: "HAPPY BIRTHDAY JESSICA", "HAPPY NEW YEAR FROM NEON SPEAKEASY", "GAME NIGHT TONIGHT ·
  9 PM · BRING FRIENDS". Banner-plane messages keep their own limits. Check every example at 390 / 402 / 430 by day and night.
- 6b section 0 — SKYWRITING IS CUT (the owner, Oct 23: "if we're already doing the dot-matrix thing, let's not double up"):
  remove the single-plane smoke-cursive skywriting (code, the &force= preview, the panel row, its schedule); every sky text
  message is SKYTYPING (+ the banner plane, the drones). Messages that used skywriting move to skytyping. THE SKYTYPING
  PLANES REBUILT (the owner: "very jagged", "they look very cheap"): SKYTYPING by a formation of sleek JETS (the owner's
  call) with glowing AFTERBURNERS (a hot cone + heat shimmer, brighter at dusk / night), crisp nav lights, the formation
  sweeping in tight, holding perfect spacing, puffing the dot letters, peeling off with style.
- 6b — THE MILITARY JETS (the air show + the F-16 missing man, already planned): they must look BADASS — sharp F-16 silhouettes,
  grey camo, wingtip MISSILES + pylons, glowing AFTERBURNERS on the pull-ups, green FORMATION (slime) LIGHTS + nav lights at
  dusk / night, vapour cones on high-g turns, tight formations (diamond, the missing-man pull-up), a low rumble that follows
  them (sound list).
- 6b section 0 — THE BATS' JITTER (a bug the owner saw): the night bats' flight looks jittery — find the cause (frame-time
  steps, random per-frame direction, rounding) and make it the real fluttering, swooping bat flight: smooth paths with quick
  erratic darts, not per-frame noise.
- 6b section 0 — CLOUD LEFTOVERS FROM THE SKY POLISH (the owner's iPhone, Oct 23: cirrus 8/10, cumulus 8–9/10, overcast
  "looks great", morning sun OK; beams now light the clouds; the moon ring gone; cloudy party 0.2 % slow after 10 s):
  (a) the SMALL cumulus still look like little cartoon clip-art clouds (flat bottom + three round bumps, similar sizes,
  evenly scattered) — make the small ones irregular broken fragments / wisps of varied shape, fewer of them, never the
  icon shape; (b) OVERCAST: the small dark floating puffs at the tagline height look off — make them ragged, soft, darker
  fractus that melt into the deck (or drop them); (c) OVERCAST cost: 3.7 % slow after 10 s at noon (work 1.9 ms) — find
  the stall (the deck's drift / a large layer upload?) and trim; (d) cirrus: a touch more feathered and fewer
  straight-ish strands (the owner: better, "not quite there"). (Contrails: smooth now ✅.)
  BUILDINGS BY DAY: the owner rates them 7–8 / 10 (night is the bar) — they look "a little FLAT". By night the neon draws
  every edge; by day nothing does. The fixes, biggest first: (1) CAST SHADOWS between buildings — a taller tower shading
  the face of its neighbour / the one behind it, along the sun's real direction (the strongest 3D cue, missing today);
  (2) AMBIENT OCCLUSION — darker where setbacks meet walls, under ledges / cornices, in inside corners, at the street;
  (3) RECESSED WINDOWS — a thin shadow line on the sill / reveal on the sun side, so the facade has depth instead of
  printed squares; (4) MATERIAL — rusticated stone bases, brick tone variation, terracotta bands, a slight gradient up
  each facade (darker at the base, brighter toward the top); (5) a bit more lit / shaded contrast still. → the DB pass.
  + THE BILLBOARD'S GOOSENECK LAMPS (the owner, Oct 23): bolder, more prominent — today they're tiny specks. Bigger
  dark-enamel shades (~6–8 pt at 402) on clear curved arms that read by day; when on, a bright warm bulb point in each
  shade + a visible soft cone of light down the poster; still four, framing the logo, never covering it.
- 6b section 0 — THE RAINBOWS' ARC TOO LOW (the owner: "the neon rainbow arc is way too low"): City 2.0 still draws City
  1.0's bows (district/rainbow.js, fitted to the district's horizon) — re-fit every bow (the rainbow, the double, the moonbow,
  the NEON BOW) to the Harbor: a big, tall arc rising from behind the skyline / the far shore into the open sky, its real
  geometry (opposite the sun / moon) kept, never over the NEON word, glance-tested at 390 / 402 / 430. &force=rainbow,
  rainbow2, moonbow, neonbow.
- 6b section 0 — THE BALLOONS RE-RENDERED, PREMIUM (the owner: "render them really good, make them cool"): crafted envelopes
  with real gores (the vertical panels), fabric shading + a soft highlight, the mouth, the basket, ropes and tiny passengers;
  THE BURNER FLARE kept and made beautiful — the flame jets up and the whole envelope glows from the inside (warm light
  through the fabric, brightest near the mouth), lighting the basket and the air around it; at night the flare is the show.
  SPECIAL BALLOONS (sometimes in a normal flight, always at the festival):
  - THE ₿ BALLOON: all black with a big orange ₿ by day; at night it reads all ORANGE with a black ₿ (lit from inside) —
    a subtle nod, never explained (the Bitcoin rule).
  - THE ALIEN HEAD: a special-shape balloon of a classic grey alien head — green, with big glossy black almond eyes — a
    real special-shape balloon (puffy, seamed fabric), not a flat cartoon.
- 6b section 0 — BALLOONS USE THE WHOLE SKY (the owner): the hot air balloons and the balloon festival may drift anywhere in
  the sky, from the top safe area down to the skyline — passing BEHIND the NEON letters and the tagline (the sign always
  draws on top) and IN FRONT of the sun, the moon and the stars; slow, real wind-driven drift at different heights and sizes
  (nearer = bigger, lower), a festival spread across the whole sky. Never over the dock or the corner buttons.
- 6b section 0 — THE AURORA: BACK TO CITY 1.0's (the owner: 6a's aurora is jittery, slowed-down, with hard vertical shafts;
  City 1.0's "looked really good"): drop 6a's aurora art (moon.js / s.auroraArt) and use City 1.0's aurora (district/fx.js
  #aurora) on the Harbor — re-fitted to the Harbor's sky (the whole sky, behind the NEON sign), smooth at 60 fps, with its
  soft reflection in the harbor water as the one addition. Keep 6a's timing (~2 nights a month + Kp ≥ 7).
- 6b section 0 — SPLIT CORNERS ON THE TITLE + LOBBY (the owner): the MENU button moves to the TOP-LEFT corner and the MUSIC
  button stays TOP-RIGHT, framing the NEON sign symmetrically — on the title screen and the lobby only (the TEST pill moves
  out of the way, e.g. below the menu); the games keep both on the right for now (Menus 2.0 decides per game).
- 6b section 0 — THE SIGN UP A LITTLE + SMALLER CORNER BUTTONS (the owner): raise the NEON sign (+ SPEAKEASY + the tagline)
  ~20–30 pt so the city gets more sky (never into the status bar / Dynamic Island; the N may sit level with the corner buttons
  — it already does). [MOVED TO 7a SECTION 0 (Oct 23): the sign raise, the smaller buttons, the split corners — 6b keeps
  only the banner plane's path + the arch re-fit below.] Shrink the MENU + MUSIC corner buttons a little EVERYWHERE (title, lobby, every game, THE BOARD): the
  visible circle ~15–20 % smaller, but the TAP AREA stays ≥ 44 pt (the ground rule — invisible padding). Re-fit everything
  that hangs off them (the games' header padding-right, the +10 / +58 offsets, the chat badge, the full-width games' pinned
  columns); THE BANNER PLANE keeps its full size (plane, banner, lettering — never shrunk): its path moves to just under
  SPEAKEASY, through the tagline's band — the tagline ("YOUR FRIENDS ARE ALREADY INSIDE.") fades out softly as the plane
  arrives and fades back after it has gone (like the sign dimming for sky messages); the banner stays tappable, clear of
  the moon's disc when it can. Then re-fit the sun / moon arch, the drone + sky-
  message layout and the lanes once. Check every phone size + a couple of games.
- 6b section 0 — ROSIE'S TURN, QUICK FIX (the owner: when the big paddle steamer turns around it looks super weird — a flat
  2D picture flipping / squashing): until she's rebuilt, she turns OUT OF SIGHT — behind the pier, the lighthouse's
  breakwater or past the screen edge — never on open water in view.
- PART 8 — ROSIE (and every boat) AS A REAL 3D MODEL in the Harbor's own 3D camera, like the buildings: hull, paddle
  wheels, decks, cabins, funnels — so she turns naturally on the water (bow, three-quarter, side views all true), her wake
  curving with the turn, her lights / bulbs on the model (and they CHASE on party nights — the Part 10 note); the water
  taxi and the other boats the same — and THE PARTY YACHT (Part 10) is built as a 3D model from the start (the owner).
- 6b section 0 — THE GEESE MORE REAL (the owner): a V is never perfect — one or two stragglers trail behind with a gap, flapping
  a little harder to catch up; arms of uneven length, birds shifting places, the odd one dropping back now and then.
- 6b section 0 — THE MOON REDONE (the owner: "the craters look off"): today it reads as a ball with round dark spots. A real
  moon seen from the ground shows no distinct round craters — it reads by the MARIA (large soft irregular dark-grey seas, the
  "man in the moon"), bright highlands, Tycho's bright rays near the bottom, a gently soft edge and a soft glow. Use a real
  photographic lunar map (NASA's public-domain CGI Moon Kit / LRO), not drawn craters, at the right orientation for the
  player's sky and in its real phase with a soft terminator; keep earthshine, the amber moonrise, the eclipse red.
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
- SKYTYPING (skywriting CUT, Oct 23 — no doubling up): on clear, low-wind days, for short words AND longer
  messages (HAPPY BIRTHDAY STEVE, HAPPY NEW YEAR, MERRY CHRISTMAS, HAPPY THANKSGIVING) a line of planes SKYTYPES dot-matrix
  letters (~16 a line, up to 2 lines on a phone); the real wind drifts and blurs them until they fade. Flies in the sky-high /
  sky-low lanes, never over the sign or tagline. Selectable from CITY CONTROL; used by holidays and birthdays.
- The Halloween witch (crafted, good-looking, cloak + hat + broom, a trail of drifting neon sparkles; crosses a real full moon).
- Santa's sleigh across the moon on Christmas Eve. Bats at summer dusk + from a tower crown on Halloween.

## Part 7 — the speakeasy
- SPLIT (Oct 23): 7a = THE LOOK (the building day + night: facade, materials, the barbershop front + pole, windows with glow
  + shades, the awning, the rooftop + string lights, the ghost ad + the corner-turn preview) — before 8a + 6b; 7b = THE LIFE
  (the moments catalogue + starter 10, the hidden mirror door, the TV glow, the raid, taps, rooftop seasons) — with 8b.
- 7a SECTION 0 — THE LAYOUT, MOVED UP FROM 6b (the owner, Oct 23 — the top's final place matters for judging the whole
  picture): raise the NEON sign ~20–30 pt; shrink the round corner buttons ~15–20 % EVERYWHERE (title, lobby, every game,
  THE BOARD) with the tap area ≥ 44 pt and everything hanging off them re-fitted; SPLIT THE CORNERS on the title + lobby
  (menu top-left, music top-right). The banner plane's path + the sun / moon arch re-fit stay in 6b.
  + THE MUSIC'S FIRST TAP (the owner, Oct 23 — no "tap for music" hint): when the music starts on a visit's first tap, the
  NEON sign answers it — BY DAY (tubes unlit) a bright SURGE races through the tubes letter by letter, N → E → O → N, then
  they fade back to unlit daytime glass; AT NIGHT (already lit) a quick brighter race / pulse through the lit tubes. Once per
  visit, only when the music actually starts; never fights the evening warm-up / tap-to-light "catch" (if the sign is in its
  warm-up, the first tap does what the catch does today). + the open FA item: check the beat lights + SFX still work while
  the music runs on the DIRECT element (the Web Audio context frozen after returning).
- THE OWNER'S LOOK DECISIONS (Oct 23): FANCIER — a once-grand 1920s Deco corner building (cream terracotta trim, Deco
  ornament at the roofline, a decorative cornice, carved panels between floors, gold-leaf lettering) over warm brick;
  the MOOD cozy and a bit worn (chipped terracotta, faded gilt, weathered brick, some ivy, a patched awning) — "it is a
  speakeasy after all"; KEEP ITS SIZE on screen as today; the BARBERSHOP front stays (striped turning pole, a big shop window
  with the chair, the "EST. 1924" awning).
  THE BILLBOARD MOVES ONTO THE SPEAKEASY'S ROOF (the owner, Oct 23 — it still looks like it's floating): stands on the
  speakeasy roof's BACK-LEFT corner on its steel frame (legs bolted to the roof deck, a catwalk + ladder, the four lamps),
  set back so the rooftop deck in front stays open — rooftop party guests (7b) walk IN FRONT of it, the sign painters /
  billposter (8b) work on the roof instead of a ladder. Conditions: never cut by the left screen edge at 390 / 402 / 430,
  never covering the wheel or the word towers, the daily game rotation + full name + lit at night unchanged; check the
  speakeasy doesn't feel crowded with the ghost ad on its side wall (if it does, tell the owner and propose an option).
  THE BARBER POLE AT NIGHT (the owner, Oct 23 — replaces "the pole stops at night"): from DUSK until MORNING the pole is LIT
  from inside — a soft, warm old-school incandescent yellow glow through the glass (not LED-bright), turning SLOWLY; by day
  it turns unlit in daylight. The story: the shop shows CLOSED, yet the pole keeps turning — the secret signal that the
  speakeasy is open. During a RAID it snaps dark and stops (7b), back on when the coast is clear.
- 7a ALSO — THE SKYLINE'S NEAR BRICK STILL READS FLAT (the owner's noon crop, Oct 23, after F1's brick pass): the red-brick
  waterfront blocks (by the lighthouse, under the billboard) are smooth salmon slabs + a window grid. Real-scale brick
  courses are sub-pixel at that distance, so they vanish. Fix like an illustrator, the same material system as the
  speakeasy's brick: (1) CHECK THE BAKE RESOLUTION — the near layer must bake at the device's full pixel ratio (F1/DB
  noted the bakes looked soft — sub-point detail is lost below it); (2) STYLISED readable brick: exaggerated courses every
  ~2 device px with a darker mortar tint, panel-to-panel colour variation, soldier-course bands above the windows,
  stone quoins at the corners, a cornice line, faint weathering streaks under sills; (3) the side faces / returns of the
  blocks in shade so they read as volumes. Judge zoomed at 3× AND at phone size.
  + THE LIGHTHOUSE (the owner): give the tower texture + roundness by day — strong CYLINDRICAL shading (lit side → soft
  core shadow → a thin bounce light on the far edge), faint painted-masonry courses, subtle weathering (rust streaks under
  the gallery and the windows, a slightly darker salt-worn base), a rough stone foundation on the breakwater; the red /
  white stripes stay crisp and bold (it's a hero piece); the night look unchanged.
- 6b section 0 — THE DIRECTOR (can a phone handle the whole plan? — the owner, Oct 23): yes, IF only what's on screen
  costs. Build ONE scheduler that every event / moment / weather / holiday goes through, with a per-tier SPECTACLE BUDGET:
  at most N heavy effects at once (fireworks, drones, the raid, storms, the party show…), the rest queued or skipped,
  priorities (holidays > party > legendary > rare > routine); assets for seasons / holidays / rare events LAZY-loaded and
  released after; a MEMORY budget per tier (today 35.7 of 64 MB); a PASSIVE LONG-SESSION CHECK — no build time: after the
  big parts only (6b, 10, the holiday parts), the owner just leaves her iPhone on the city (&debug=1, plugged in or not)
  while doing something else, then reads the session line (slow % over 30 min, any tier drop) and feels if the phone is
  hot. The readout can add a "since 10 min" slow % so the creep is visible.
- FUTURE IDEAS (PARKED — not in any part yet; the owner, Oct 23: "let's not spend time on that right now"):
  NOCTILUCENT CLOUDS (a RARE sky event, true to life): the highest clouds there are
  (~80 km), glowing electric blue-silver because they're still lit by the sun after it has set. Only when real-ish:
  SUMMER (late May → early August), only in deep TWILIGHT (the sun ~6–16° below the horizon — ~45–100 min after sunset or
  before sunrise), never in full night or by day; low over the horizon behind the skyline; delicate rippled, wavy bands
  and herringbone streaks, faintly luminous, slowly shifting. Rare at Grand Rapids' latitude, so: a few evenings a
  summer at most (seeded, the same for everyone) → a City Sightings badge candidate. A preview + panel row.
- 6b section 0 — CLOUD LAYERING BUG (the owner, Oct 23, at night with the city's pink underglow): a high CIRRUS behind a
  CUMULUS showed THROUGH the cumulus — the near cloud reads see-through. Likely the night underglow / tint drawn as a
  translucent layer, the cumulus' body too transparent at night, or the draw order (cirrus after cumulus). Rule: a
  cumulus' body is OPAQUE — nothing behind it shows through (only its thin edges let the sky through); high clouds always
  draw first. Check at night, party night and by day.
- 6b section 0 — CIRRUS SOFTER + LONGER (the owner, Oct 23): the high streaks are too sharp — more diffusion (soft,
  blurred, feathered edges, lower contrast) and longer, more stretched strands.
- 6b section 0 — CLOUDS EVOLVE (the owner said OK, Oct 23 — she'll judge the clouds only once 6b's full system is in): clouds slowly swell, change shape and dissipate over minutes,
  new ones form; each 6-hour re-roll picks a varied MIX (a towering one or two / many medium / nearly clear), never the
  same blend.
- Windows you see into (rooms read as warm glow + big silhouettes), the unmarked door + the knock, the awning "EST. 1924".
- The ROOFTOP: summer weekend rooftop parties (string lights, dancing figures, a bar cart, someone at the railing); a rooftop
  garden through the year (spring seedlings + a gardener with a watering can, summer lush green with tall sunflowers and red
  tomato clusters, autumn pumpkins, winter beds under snow, string lights left up).
- THE SPEAKEASY WINDOWS (its own section — the closest, biggest windows in the city, ~25 pt on a phone; figures inside are
  12–16 pt SILHOUETTES, so they read by light, shape and big motion — the glance test on every window):
  - THE MOST BEAUTIFUL, MOST ALIVE PART OF THE CITY (the owner): it's the most detailed and readable thing on screen, so it
    is VERY ACTIVE around the clock — something visibly happening in at least one window every ~10–20 s, never all at once.
    BY DAY the speakeasy hides behind an innocent front and the upstairs lives: the apartment's morning routine (blinds up, a
    figure stretching, watering a window box, the cat sunbathing on the sill), a laundry line, someone reading by the window,
    a delivery of "crates" being carried in, the front shop open — a BARBERSHOP (the owner's pick: the classic speakeasy
    cover, a striped barber pole turning by the door that reads on a phone, a chair + a barber in the window) with customers;
    AT NIGHT the barbershop "closes" — the pole stops, a CLOSED card, the chair empty under one dim lamp — but its back wall
    (a big mirror) is a HIDDEN DOOR: every so often it swings open and you glimpse the bar behind it — warm amber light,
    bottle shelves, silhouettes, a burst of muffled jazz — before it swings shut again (more often on party nights; never
    during a raid). The secret, in plain sight, on the most readable window; AFTERNOON: the
    bartender setting up behind half-drawn shades — polishing glasses, lights on one by one; EVENING → NIGHT: the full bar,
    jazz room and card game (below), a couple dancing past, a toast with raised glasses, someone at the piano, a curtain
    drawn and opened, a silhouette peeking out, lights switching room to room; LATE: the TV glow upstairs, the cat, the last
    patrons leaving; the raid nights as planned. A scheduler picks the next small moment by the hour (busier on party nights).
  - THE GHOST AD (the owner's idea): the speakeasy's angled RIGHT side wall carries a big faded, hand-painted 1920s GHOST
    AD for one of our games (worn paint on brick, the bricks showing through, sun-faded colours) — hiding in plain sight: it's
    an old ad, not the speakeasy's own sign (the speakeasy stays unmarked). It rotates WEEKLY to another game (the neon signs
    rotate nightly). Clear by day; AT NIGHT lit by a row of 2–3 vintage GOOSENECK LAMPS mounted above it (the classic
    painted-billboard lamps), each throwing a warm cone of light down the wall — pools of light on the brick, brightest at
    the top, fading down, the ad glowing in their wash. The lamps flicker off with the raid and with the TR-3B's power drain.
    ONE GHOST AD PER GAME (12), a new one each week (each game about every 12 weeks, the same for everyone). THE CHANGE:
    Part 7 swaps it quietly at ~4 am Monday (nobody watching). Part 8 (once people exist) adds THE SIGN PAINTERS as a
    weekly routine: Monday ~8–11 am, two painters on a hanging scaffold paint the new ad in stages — the old one whitewashed,
    then the outline, the colour fill, the lettering — readable on the phone (the wall is close); the ad then starts its
    week fresh and slowly "ages" back to a faded ghost by the weekend.
    SIZE CHECK FIRST (Oct 22): today the angled right wall is only a thin slice on a phone (~15–20 pt wide at 402) — too
    narrow, the same reason the Day Pass skipped the skyline ghost signs. The ad needs ≥ ~70 pt of wall width to read. In
    order of preference: (1) Part 7's rebuild turns the corner so the angled wall shows wide enough — the owner: overlapping
    a little of the wheel is OK (it adds depth); TRY IT and show her both (a preview flag, turned vs today) so she decides; (2) if not, the ghost ad goes on a wide brick band of the FRONT facade; (3) the owner's fallback: a BIG
    painted vertical BLADE SIGN on the building (a wooden board on iron brackets, same weekly game rotation, the same
    gooseneck lamps, the painters repaint it on a ladder) — only if it never covers the wheel, the pier or the dock.
  - THE EDGE WINDOWS (the owner's call, revised): keep the windows the left screen edge cuts — a solid brick edge would make
    the building feel suffocating. Lay the facade out per phone width so the edge cuts each edge window at a CONSISTENT,
    deliberate point (about half a window showing — never a thin sliver), and make those edge windows AMBIENT ONLY: curtains
    (drawn by night, tied back by day), warm light spilling through at night to make the foreground pop, a plant on the
    sill, and THE CAT now and then jumping up onto that ledge, sitting in the visible half (never cut). No story moments in a
    cut window — those live in the fully visible ones.
  - BUILT AS A "MOMENTS CATALOGUE" so new ones are easy to add any time (the owner will keep adding): every window moment is
    ONE self-contained entry — which window(s), its little animation (a small module drawing the silhouettes / light), when it
    may happen (hours, weekday / weekend, season, weather, party night, holidays), its RARITY (routine / common / uncommon /
    rare / legendary — e.g. legendary ≈ a few times a year), its length and a cooldown. ROUTINES are fixed in the day (the
    upstairs wakes ~7 am, the shop opens 9, the bartender arrives 4 pm, lights out ~midnight / the TV glow later); the rest
    are random draws weighted by rarity, never two in the same window at once, seeded so everyone in a room sees the same.
    A &force=window&moment=<id> preview + a button in the preview panel for every moment. Part 7 builds the system + a
    STARTER SET OF 10 (the owner's call — she reviews them on her phone before any more get made), chosen to cover the range:
    3–4 routines (waking up, the shop opening, the bartender arriving, lights out / the TV glow), then common, uncommon, rare
    and one legendary, across different windows and different kinds of animation (a light change, a big silhouette motion, a
    prop, the cat). What reads on the phone becomes the template for the rest; adding one later = one small prompt (~15–30 min). Legendary window
    moments can become City Sightings badges (Progression 2.0).
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
- 8a SECTION 0 — CARRIED OVER: only (6) the billboard move was NOT sent to 7a (the owner sent (1)–(5) + the barber pole —
  check 7a's summary that they landed; anything missing carries here too):
  (1) THE SUN'S COLOUR BY ALTITUDE — golden hour too white (her iPhone at 17:57, ≈ 5–6° up): above ~15° white; ~6–15° warm
  yellow-white; ~2–6° clearly golden amber (the city's light warmer too); the last ~2° deep orange-red, slightly squashed;
  the same at sunrise. (2) The panel's TIME presets in order: SUNRISE (~5 min after the real sunrise) · MORNING · NOON ·
  AFTERNOON · GOLDEN HOUR · SUNSET (~5 min before) · DUSK · NIGHT. (3) The AUDIO panel's header says "sounding" while its
  detail says "sounding NO · locked (no tap yet)" — match them. (4) THE SPELL-ON on EVERY neon sign (both roof signs + the
  blade), staggered, never two at once, every few minutes on normal nights, between scenes on party nights. (5) The window
  WORD TOWERS: a text box in the panel (type a message, pick tower(s), each tower's max letters shown live; long messages
  spread one word per tower or scroll); report the exact limits. (6) THE BILLBOARD ONTO THE SPEAKEASY'S ROOF — over the left
  half-plus of the roof, fully inside the left edge at 390 / 402 / 430, raised on a visible steel lattice frame (legs on the
  roof deck, ~¼ of the board's height of open frame so the city shows through), catwalk + ladder + the four lamps; guests /
  painters can walk under it; never covering the wheel or the word towers; flag it if the speakeasy feels crowded with the
  ghost ad. (6b) THE FIRST-TAP SURGE whenever the sign is NOT on (the owner): not only "by day" — morning, day, golden
  hour, dusk, any moment the NEON sign isn't lit, the first tap's surge races N→E→O→N then fades back; only during the
  evening warm-up window does the tap do the catch instead (it lights the sign for good). (6c) THE PULSE DOESN'T COME BACK
  AFTER RETURNING (the owner's iPhone, Oct 23, after 7a): this time Web Audio DID recover (ctx running, clock advancing,
  out WEB AUDIO, the beat line "grid 100.0 · bar 30 · kick 0.66", music sounding) — yet the city's lights didn't pulse. So
  the bug is on the LIGHTS side: find the stuck state after hidden → visible (the "calm" latch from the frozen-graph state
  never cleared? the beat clock / punch envelope paused on visibilitychange and not restarted? a huge rAF time jump
  clamping the envelope?) and fix it; add "pulse" (the punch level now, 0–1) to the readout's beat line so it's visible.
  (6d) THE PULSE STRONGER AGAIN (the owner: "crank it up higher") — and stop guessing: add a PULSE STRENGTH slider to the
  preview panel (LIGHTS) so the owner dials it live on her iPhone, then the chosen value becomes the default; start ~+30 %
  above 7a's; still no full-screen flashing. (7) THE NEON TAP SOUNDS ~25 % QUIETER (the owner): the on / off sounds when you TAP the NEON sign's tubes drop
  ~25 % in volume (gain × 0.75, ≈ −2.5 dB); the start-up surge / power-on sound stays as loud as it is.
  (8) SOUND SLOTS (the owner will collect the recordings later): ONE sound registry — every planned city sound (the CITY
  SOUNDS hunt list, by part) gets a named SLOT now (e.g. club-murmur-calm, door-heavy, cat-meow, water-lapping,
  city-hum-night, car-1920s-pass, flag-flap…); every event calls its slot; an EMPTY slot is simply silent (never an error,
  never a placeholder beep). Adding a sound later = drop the file into a folder (e.g. ~/Downloads/city-sfx/<slot name>.wav)
  + run one script (trim, level to the city's loudness, encode, register) — like add-city2-music.py. The preview panel's
  SOUNDS category lists every slot: filled / empty, with a play button. + anything the owner
  finds when she checks 7a.
- THE LINE AT THE SPEAKEASY (the owner, Oct 23 — for Lobby 2.0 + 8b): friends in a lobby line up LEFT of the left globe lamp —
  along the barbershop front, to the left of the door, toward the bottom-left corner. Space check (Claude): that corner holds
  ~4–5 figures in a single file at phone size, so the line runs along the shopfront and bends down toward the corner (two-deep
  if needed); guests 6–8 wait in the open floor beside it; never cut by the left screen edge, never under the dock, the door
  always clear.
- THE BAND UNDER THE DOCK (the owner, Oct 23): with the dock showing, the promenade's curb lines up neatly against it; when
  the dock fades away (rest), an empty grey band shows below the curb. DECIDED (Claude's recommendation): NO camera slide (it
  would move the sign + sky on every tap / rest and cost a re-layout) — instead the scene is FULL-BLEED to the bottom of the
  screen and the band under the dock becomes a FINISHED STREET (the implied road made real): the near granite curb, a
  cobbled street with streetcar rails, a storm drain / manhole, puddle sheen when wet, the headlight sweeps on it; while the
  dock is hidden, an occasional 1920s car may visibly roll across (the same pass + sound); when the dock returns it simply
  covers the street again. Check at 390 / 402 / 430 (the band's height differs per phone).
- THE COBBLES AT NIGHT (the owner, Oct 23): the joints read as hard black gaps between bright stone tops (a "piano key"
  look) — fill them with a mid-tone GROUT / packed sand that catches some of the lamplight, lower the top-vs-joint contrast
  at night (soft, rounded falloff on each stone, no sharp black shadows), keep the lit tops' sheen; check by day too.
- THE SHOPFRONT LIGHT LOOKS SMOKY (the owner, Oct 23, night close-up): the light around the barbershop reads as a big soft
  warm FOG over the facade instead of light. The pro fix — light shows as three things, never a translucent wash: (1) the
  SOURCE (a bright core), (2) a TIGHT halo / bloom, small, (3) light LANDING on surfaces — the brick, the awning, the door
  frame, the cobbles near each lamp, with a clear falloff. Remove the big warm haze behind / around the barber pole; the
  POLE becomes a crisp, BRIGHT, cool-white "LED-like" glow — the glass tube lit from within, red / blue stripes vivid, a
  small tight halo, a little light on the wall beside it; the door sconce and the shop's inside lamp keep their warmth and
  level but get the same treatment (tight bloom + light on the surfaces, no smoky cloud). Apply the rule to every light on
  the promenade (globes, curb lamps, the cart).
  THE POLE'S TURNING IS STILL JITTERY on her iPhone (FP said smooth at 60 / 30 Hz): drive the stripe offset by real TIME
  (not frames), draw it at fractional positions with anti-aliasing (never snapped to whole pixels), keep it drawing every
  frame even under the day's 30 fps battery saver if that's what steps it; verify with a frame burst at phone dpr.
  PARTY NIGHTS (the owner's idea — agreed, kept classy): the pole's stripes turn NEON in the party colours (magenta /
  electric blue / gold instead of red / blue), a gentle punch on the beat, the same slow turn (never spinning fast); back to
  red / white / blue after the 2 am wind-down.
- AFTER FP — MORE (the owner's screenshot, Oct 23): the BENCH TREE becomes a FLOWERING CRABAPPLE (pink-white spring blossom;
  golden autumn with small red fruit) — the owner said yes; REMOVE THE PARKED BUS until 8b brings moving vehicles (a bus
  frozen behind the stop lights hides the crossing and looks stuck); the CART moves left of the medallion (it blocks the
  crosswalk today); the WAIT / WALK lantern FLOATS in the air over the road — mount it on a proper cast-iron post on the far
  curb (base visible); THE BIG FRAMING MAPLE (bottom right) looks off — a dark brown-black blob inside / behind its crown,
  a lopsided crown on a thin trunk: shade its inner leaves as a deeper orange-red (never a brown-black mass), a fuller rounder
  crown, the trunk visibly branching up into it, lit from the sun's side; the car sounds play with no car visible — fine
  while the dock covers the street; once the street under the dock exists, the car is visible when the dock is hidden.
- AFTER FP — CLAUDE'S + THE OWNER'S TWEAKS (Oct 23): REMOVE the red tree behind the DOUBLE AGENT blade (keep the orange
  maple); REMOVE the urn planter at the speakeasy's corner; MOVE THE MEDALLION to the middle of the promenade — the cart
  rolls across it on normal days, people walk over it; during an event the cart stops short / stays away; every seasonal
  centrepiece gets a HEIGHT CAP (below the vertical neon blade's bottom and the wheel's hub).
- PARTY-NIGHT TIMING MOVED EARLIER (the owner, Oct 23 — "so beautiful, I don't want it missed"): warm-up from 8:30 pm,
  PEAK from 9:30 pm, the midnight fireworks finale (Part 10), calming after 1 am, back to normal at 2 am. GUARDRAIL (Claude):
  the show needs darkness — in summer Grand Rapids' sunset is ~9:20 pm — so the warm-up starts at 8:30 OR when the blue-hour
  power-up has finished, whichever is LATER, and the peak at 9:30 OR ~45 min after that; the shared darkness value decides.
- THE PROMENADE RE-LAYOUT (APPROVED by the owner, Oct 23 — Claude's sketch promenade-layout.png): FURNITURE ON THE EDGES,
  AN OPEN FLOOR IN THE MIDDLE, THE FRONT EDGE CLEAR. Back row along the curb by the waterside road: tree · tall double lamp ·
  tree (the bench under it) · a planter · tall double lamp; the open walking floor in the middle with the MEDALLION at its
  centre (roughly under the wheel); the CART in the open right side with room around it; ONE big framing maple at the far
  right edge (framing, not covering the cart); the front edge above the dock clear — only two short warm globe lamps at the
  corners; ONE crafted planter tucked against the speakeasy's corner (open cobbles in front of the door + shop window).
  NIGHT LIGHT PLAN: cool pools under the tall curb lamps (the back row, the road edge, the bench); warm pools from the two
  corner globes across the front of the open floor; the speakeasy's warm spill across the cobbles in front of it; the
  cart's string-light glow; the medallion where pools overlap; headlight sweeps across the front edge; dim, never black,
  between the pools; no haze.
- THE BARBER POLE AT NIGHT, FIXES (the owner, Oct 23, after 8a): its glow is glitchy — the stripes / light look jagged and
  not continuous (fix the rotation: smooth, sub-pixel, continuous stripes, no stepping); it must POP more — a brighter, whiter
  glow than before (the owner now wants it brighter than the "soft yellow"), the clear hero light of the shopfront; the two
  lights beside it (the door sconce + the shop window's lamp) must not fight it — tone them down / fix their diffusion
  (soft, round, no hard-edged blobs).
- AFTER 8a — THE OWNER'S NOTES (Oct 23, collecting): (a) the billboard doesn't read as standing on the speakeasy's roof —
  it looks attached to the tall buildings behind (its frame / legs must visibly stand on the speakeasy's roof deck, in front
  of the skyline, the depth check) — her close-up shows why: the board's bottom sits ~a storey ABOVE the speakeasy's
  parapet and the gap between is filled by the brick buildings behind, with no legs crossing it, so it reads as bolted to
  them. Fix: steel lattice legs + diagonal bracing running DOWN in front of the far buildings to the speakeasy's roof deck
  (feet on the roof, just behind the parapet / string lights), drawn in the near layer, plus its shadow on the roof; or
  lower the board so its frame meets the roof. THE OWNER: "that space between the roof and the billboard looks chaotic —
  do what looks best". CLAUDE'S CALL: LOWER the board onto a SHORT, CLEAN steel frame — a simple lattice with a couple of
  diagonals and a catwalk, its feet on the roof deck just behind the string lights, the board's bottom only a little above
  them; the frame drawn DARK and solid enough to read as one structure (no busy city pattern showing through a tall gap);
  a soft shadow on the roof; the lamps on the catwalk. Never cut by the left edge, never covering the wheel; (c) THE STOP
  LIGHTS look wrong (the owner): today both face the camera, but the cars drive left ↔ right — the signal heads should face
  ALONG the road (seen from the side / at an angle, toward the drivers), and on the far side, facing the camera, a
  PEDESTRIAN signal for the crosswalk (a lit WALK / WAIT lantern, 1920s-style, the "WAIT" blinking before it changes) — or
  a period 1920s STOP / GO semaphore with arms; make the crossing read logically; (d) THE PLANTERS (the owner): the one
  in front of the barbershop needs MUCH higher quality (or something else instead), and both planters move out "toward the
  road" so there's open walking space between the planter and the shopfront (which road — the owner is explaining next);
  (b) the DOUBLE AGENT blade sign must be IN FRONT of the tree next to it (draw order).
- 8a DECISIONS (the owner, Oct 23): CUT the glass bus stop shelter (the bus stops at the curb). GROUND mostly COBBLESTONE —
  rounded granite setts that catch lamplight on their tops; rain = a wet sheen + reflections of the lamps / neon in the
  stones and puddles collecting in the joints; snow settles in the joints first, then covers; a smooth granite CURB edge
  and a ring of smooth stone around the centrepiece medallion. TREES (Claude's pick, the seasons must read at a glance):
  mostly SUGAR MAPLES (Michigan; full green summer, blazing red-orange-gold autumn, bare branches holding snow in winter)
  + 1–2 FLOWERING CRABAPPLES for a pink-white spring blossom; real trunks + branches (no round balls), ~5–6 in all.
  THE FLAG — REMOVED as a permanent piece (the owner, Oct 23): no everyday flagpole. On patriotic holidays / special events
  (Memorial Day, July 4th, Veterans Day, Flag Day…) the city DECORATES: flags on the street-lamp posts + red-white-blue
  bunting on the speakeasy; on half-staff days (Sept 11, official days) a flagpole appears for the day at the railing
  (base visible on the promenade, never over the lighthouse). Built with the holiday parts (11), not 8a. The bench, the cart and the planters in the clearly
  visible middle band, never low by the dock. THE GREY-BOX STEP STAYS (quick): 8a builds the rough layout first, sends the
  owner screenshots and WAITS for her OK before the real art — not an overnight run.
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
- GULLS ON THE BILLBOARD (the owner, Oct 23): by day a couple of seagulls fly in and LAND on the top edge of the speakeasy
  roof's billboard (and its catwalk railing) — settle, preen, look around, the odd call (the gulls sound slot), then take
  off; more on windy / stormy days huddled, none at night. PREMIUM RENDER (the owner): the gulls must be crafted wildlife,
  not icons — a real gull silhouette and plumage (white body, grey wings, black wingtips, yellow bill), a proper landing
  (wings spread, legs down, a hop), folded wings at rest, readable on a phone — the bar for all the wildlife.
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
- WEATHER ON THE NEON LOGO ITSELF (the owner, Oct 22 — only when real): RAIN = drops beading on the tubes, catching the glow,
  running down and dripping off the bottoms; SNOW = collects on the top edges of the letters + the mounting while the sign is
  OFF (by day); once lit, the warm tubes melt it — wet, glistening tubes, drips, and small ICICLES forming under the
  letters on freezing nights (real neon runs warm, so snow never buries a lit tube); ICE / FREEZING RAIN = a clear glaze
  and icicles on the frame and brackets, the lit tubes shedding it. Readability first: the word always reads.
- WEATHER ON THE DOCK + THE MENU / MUSIC BUTTONS (the owner: RAIN and ICE only, no snow): the glass UI shows rain drops on its
  glass (a few beading, the odd one running down) and, below freezing, a light frost creeping in from the edges. Subtle,
  at the edges only — never over the text or icons, never lowering contrast, taps unaffected; off with reduced motion.
  City 2.0 only. (The same weather lives on the lobby later.)
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
- Rosie's + the pier's bulbs CHASE on party nights (Neon Pass 4 could only pulse them — Rosie's bulbs are baked into her picture).
- (MOVED UP to Neon Pass 3 — the owner's call; Part 10 keeps the midnight finale + fireworks on its hook.)
  PARTY NEON WITH VARIETY (the owner: today it only turns the outlines into dashes running round the border): a choreographed
  light show across the skyline, different by building and changing through the night — tubes pulsing on the beat, colour
  sweeps across clusters, ledge bands lighting floor by floor up a tower, fins strobing in sequence, crowns flashing on the
  drops, call-and-response between towers, a few buildings holding steady so it never looks like one effect everywhere; the
  chasers stay as one effect among many. Builds with the night (classy → spectacle → finale).
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
- The desktop/wide panorama; also make room for a TV camera (see TV mode). The owner's laptop review (Oct 22, 1440-ish
  Chrome): today it looks "kind of weird" — a huge EMPTY beige promenade plane fills the bottom third with tiny people,
  the skyline is a thin squashed band, the same buildings repeat across the width, the speakeasy is small in the corner,
  and the sign floats small. The desktop camera must be composed as its own cinematic shot (not the phone camera
  stretched): a lower, closer camera so the skyline is big and tall, more water + reflections, the promenade a shallow
  foreground band (not a parking lot), the speakeasy a proud corner, varied buildings across the panorama (no visible
  repeats), the sign bigger; the same care at 1920×1080 and on a TV. BEFORE writing this prompt, ask the owner her
  questions about the desktop view first (her request).

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
- **LATER — APP STORES + MONEY (a brainstorm for after City 2.0 + the big features are done; nothing decided):** keep the
  option open to ship NEON SPEAKEASY in the App Store / Google Play (Google: a Trusted Web Activity wrapper, ~a day, $25 once;
  Apple: a Capacitor wrapper + real app touches — push notifications, haptics, maybe Game Center — $99/yr; store purchases
  take 15–30 % and need the stores' own payments). The owner's ideas to brainstorm then: launch FREE with ~20 games, the
  complete city and progression; then a GAME PACK (~$3 for 10 more games), or a paid CITY 3.0, or a yearly "SEASON CITY"
  subscription where the city and the games change every year. Keep building nothing that blocks a store wrapper.
- **TV MODE (after Lobby 2.0):** neonspeakeasy.com/tv shows a short code + QR; the host pairs via SHARE TO TV on their phone (no
  typing on the TV); the TV is a viewer, phones are controllers; the TV plays the music + big moments, phones go quiet (tiny
  taps only); a TV camera with a bigger stage so people read from the couch, gentle slow drift, push-ins on moments; step 1 the
  lobby, walk-in, standings + podium; step 2 per-game TV views (trivia games, HIGH STAKES first); a lighter tier for weak
  smart-TV browsers (best on a laptop/HDMI, Mac/iPad AirPlay, a cast tab).
  THE TV IS NOT A PLAYER (decided): it joins the room as a SCREEN, not a player — its own node (e.g. rooms/{CODE}/screens/
  {id}), never in players/: it takes no player slot (8 players + the TV), never counts toward a game's minimum (DOUBLE
  AGENT's 4), never becomes host, never gets a figure in the lobby crowd, a card or a score; read-only by the rules; it
  shows a small "ON TV" chip in the lobby so everyone knows it's connected.
  MANY TVs AT ONCE (decided): friends playing from different houses can each put the game on their OWN TV at the same time —
  ANY player (not only the host) can SHARE TO TV from their phone; a room holds several screens (up to ~8, one per household),
  all showing the same synced moment on the server clock, each playing the music + big moments. A phone goes quiet only when
  ITS OWN TV is paired (its household's), so a friend without a TV still hears everything on their phone. The lobby chip
  shows how many TVs are on.
- **BOARD 2.0** (the bar inside the speakeasy, an Art Deco brass + enamel honor board, a live bartender, windows onto the live
  Harbor) and **PROGRESSION 2.0** (levels 1–100, a wardrobe whose pieces turn neon at night, entrances, a birthday on the
  profile so the towers can spell "HAPPY BDAY <NAME>").
  - MY CITY — UNLOCKABLE DECOR (the owner's idea): achievements, holiday challenges, streaks and sightings unlock decor a
    player places on THEIR OWN promenade and the speakeasy's ROOF to give the city their flair — e.g. finish the Halloween
    challenge → a special carved pumpkin they can keep out all year. Placed in FIXED DECOR SLOTS (not free-form — keeps the
    composition, the glance test and the speed safe): ~6–8 slots (the roof corners + edge, the plaza's planters, beside
    the bench, by the door, a lamp post). Shown only on the owner's own screen — and in a lobby, the HOST's decor is what the
    room sees (so friends see your flair when you host). Saved on the profile (server), across devices. Parts 7 + 8 must
    RESERVE these slots (hooks only); Progression 2.0 builds the unlocks + a simple "decorate" sheet.
  - THE TINFOIL HAT (the owner's idea): seeing EITHER UFO event (the TR-3B or the saucer abduction) unlocks a big crinkly
    TINFOIL HAT for the player's wardrobe — shiny, catching the light, glinting under the neon at night; a bonus for seeing
    BOTH (e.g. a glowing pair of alien antennae). Unlocked only by a real sighting (never a &force= preview).
  - STREAKS ARE BIG (the owner): they bring people back, so streak rewards are generous and visible — milestone rewards
    (wardrobe pieces, finishes, glows) at real streak lengths, built on the existing streaks + weekly goal (docs/profiles.md).
  - CITY SIGHTINGS (the owner): badges / achievements for SEEING legendary city moments — the periscope, the UFO abduction,
    and the other rare events and easter eggs (the aurora, the raid, a lunar eclipse…). The city reports a sighting when the
    event is really on the player's screen (the scheduler already knows); a collection on the profile shows found + "???".
    REVISED (the owner, Oct 23 — a passive award feels wrong: "they don't even see it and get an achievement… I already
    missed that"): a sighting counts only when the player TAPS THE EVENT while it's happening ("spotted!"): a generous tap
    area, a small camera-flash / polaroid moment, then the badge. Missed ones stay "???" in the collection, with a vague
    hint ("something strange over the harbor at night…"), so a miss becomes a reason to come back, never a confusing award.
  - "CALL IN A FAVOR" (REMIND THE OWNER when Progression 2.0's prompt is written — her OK, Oct 23): players earn a few
    favors by playing; one favor triggers a moment for THEIR ROOM while friends are in the lobby — fireworks, a sky
    message, the party yacht passing, a song request at the bar — limited (e.g. about once a week), so the world stays
    shared and the moment stays special. (Rejected: per-player control of the city schedule — it breaks the shared world.)
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
