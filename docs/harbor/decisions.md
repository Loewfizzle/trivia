# CITY 2.0 — THE DECISIONS (current)

**What this is:** the owner's CURRENT decisions for the Harbor (`?city=2`), the short list a pass reads. Superseded notes are left out; where
two notes conflicted, the LATER one is here. **The archive** is `docs/harbor/plan.md` (the dated diary since Oct 21); each bullet ends with its
source `[plan.md: <heading>]` or a pass log `[night-a2.md]` (= `docs/harbor/passes/…`). Rules + numbers stay in `docs/harbor.md` (size rules,
camera, budgets, the file map, KNOWN ISSUES, the pass INDEX) — pointed to, not repeated.
**Upkeep:** Step 0 of every pass appends the owner's new notes to plan.md AND updates this file — REPLACE a superseded bullet, never append history.
*Current as of Oct 29 2026 (late) — after NIGHT-B (its log: passes/night-b.md), before NIGHT-C.*

1 Build order · 2 Standing rules · 3 Layout · 4 Light · 5 Beat, music, sounds · 6 Party night · 7 Windows · 8 People + THE SOLIDS ·
9 Sky + legends · 10 Weather (ATM) · 11 Holidays · 12 Timetable + tier table · 13 Speed, memory, 3× · 14 Assets · 15 After the city ·
16 Open / parked · 17 Walk-away mode

---

## 1. The build order
Done: everything through **NIGHT-A2** (bb00ff2, live) — `docs/harbor.md` → THE PASS LOGS — INDEX.

**THE ORDER:** **NIGHT-A2 → NIGHT-B → NIGHT-C → SKY → ATM → 10 → FR5 → PERF → 11b → DESKTOP → SWITCH-OVER → 12 → SCHED → 13 → C3 → 11c**
(the app rows keep their own order; L anytime in the games chat). [plan.md: The build order + THE ORDER — REVISED (Oct 29, 8:11–8:26 pm) + NIGHT-B IS SPLIT (9:48 pm)]

| # | what | model · est. |
| --- | --- | --- |
| NIGHT-B | ✅ (Oct 29 — night-b.md) THE STREET PARTY: the tidy-up, THE SOLIDS, THE CITY TIMETABLE + THE TIER TABLE, the crowd all night in pockets, THE DANCE BREAKS (conga · bounce · wands up · swing pairs · a mix) + THE BIG CONGA + the street spill + the bench dancers, the crowd's sounds, THE STAGE LIGHT + the party dim behind `&stage=` (OFF) | done |
| NIGHT-C | ← NEXT: THE HELICOPTER (patrol + dance breaks — the breaks: core/harbor-streetparty.js#danceBreaks) + THE ROOF SIGNS AT 3× + THE QUIET BUILDING | Opus 5.5 high · ~2 h |
| SKY | THE LEGENDS: the Blackbird, the F-22 models, the TR-3B full res, the Mothman, the shadowboxer, the upper windows on the crisp layer — the owner wants to DISCUSS the prompt first | Opus 5.5 high · ~4–5 h |
| ATM | Fable: clouds, wind, fog, storm, freezing rain, the sun — before the real snow (mid-Nov) | Fable high · ~3 h |
| 10 | party nights + fireworks + the superyacht, built to a frame budget from the start | Opus 5.5 high · 60–90 min |
| FR5 | Fable read-only review before PERF: speed, memory, code health, scene.js cut lines | Fable · ~1 h |
| PERF | the speed pass (after 10 = the true worst case: 10 pm fireworks over a full street party + ATM's weather) | Opus 5.5 high · ~1–1.5 h |
| 11b | Christmas + NYE (discussed first; LIVE by ~Nov 20, the build-up from Nov 27) | Opus 5.5 high · 60–90 min |
| DESKTOP | the one-time desktop pass (+ a ~30–45 min follow-up); leaves automatic desktop checks | Opus 5.5 high · ~2 h |
| SWITCH-OVER | City 2.0 the default | Opus 5.5 high · ~1 h |
| 12 | easter eggs, sounds, desktop polish | Opus 5.5 medium · 60–90 min |
| SCHED | THE SCHEDULE REVIEW: export → GROK ↔ CLAUDE debate → the owner decides → a build pass (first: migrate the old planners into THE CITY TIMETABLE) | Grok + Claude, then Opus |
| 13 | CITY CONTROL | Opus 5.5 medium · 45–60 min |
| C3 | final cleanup | Opus 5.5 medium · 30–45 min |
| 11c | spring, summer + patriotic — at the END (the owner) | Opus 5.5 high · 60–90 min |

The app rows (table order): R-A → 14 LOBBY 2.0 → 16 BOARD 2.0 (rescoped) → DAILY 1 → L0 → 17 PROGRESSION 2.0 → R-B → 15 TV MODE → L → GO PRIVATE
(right before launch) → R-ALL. [plan.md: The build order; THE ROADMAP REORDERED (Oct 26); OCT 28 (after 9f)]

---

## 2. Standing rules
CLAUDE.md holds the one-line forms; `docs/harbor.md` the size rules, hero pieces, "the reference is the floor". Here: the owner's words + sources.
- **PHONE FIRST, UNZOOMED** — judged at 390 / 402 / 430 as-is (a window ~40 pt); can't be seen → bigger, bolder, "a clear silhouette + one bright accent", or not built. "If you can't tell what it is from a freaking iPhone, we can't use it." [plan.md: OCT 27 (after SP6); OCT 28 (the afternoon review) — the urns]
- **The night is the bar** for every look; "premium, crafted, never cheap"; holidays "TOP TIER, STUNNING — NO CLIP-ART LOOK". **Never quietly lower the look** — a visible sacrifice for speed → ask. [plan.md: Rules that apply to everything; OCT 26 (after SP3)]
- **THE WINDOW RULE** — every window scene enters + leaves by its own motion or the blind cycle (core/harbor-moments.js#ENTERS_BY_MOTION). **WINDOW RULE II** — long routines (hours) are the BASE, short rare moments the SPICE. [plan.md: OCT 27 (after 9b); OCT 28 (PROM's review) 5:20 pm]
- **THE PEOPLE RULE** — nobody appears or vanishes in view; after any clear-out the promenade refills only through entry points over ~1–2 min. [plan.md: OCT 28 (PROM's review) — PROM REVIEW DONE]
- **NO LAMPPOSTS** — the light comes from IMPLIED lamps below the screen behind the viewer, in ONE module (core/harbor-light.js). Older notes that hang things on lamp posts (holiday spots, 11c's flags, glaze, "a lamppost flickers", fog "cones") are void — new homes needed. [plan.md: OCT 28 (12:20 am); OCT 28 — THE PROMENADE, LOCKED]
- **NO TRAFFIC DURING THE LEGENDARIES** — on-screen cars finish or stop, "nothing pops out" (core/harbor-legend.js#trafficHold); the same hold serves the dance breaks' street spill. [plan.md: OCT 25 (after 8b2); OCT 29 (the evening)]
- **THE STANDING PROPS ARE SOLID** (standingFootprints → aroundSolids) → grows into THE SOLIDS (§8). [night-a2.md; plan.md: NIGHT-A2 REVIEW]
- **Every force flag has a panel row** (core/harbor-remote.js; a test greps for strays); a forced event starts AT ITS FIRE MOMENT; a legendary forced from a LINK waits for the reveal + the first tap (+4 s). [plan.md: OCT 25 (after C2); OCT 28 (the afternoon review)]
- **THE BASELINE GUARD** on in every pass until PERF; a cache keyed per frame holds its whole working set. [plan.md: THE ORDER — REVISED; hotfix-oct29.md]
- **3D only as BAKED sprites** (one bake tool, offline). **Lettering nothing passes in front of → THE CRISP LAYER** (§13). [plan.md: OCT 27 (after 9b + the UFO bake); 9c.md]
- **Light MODULATES surfaces** (lit faces, creases, a shadow side) — never an additive wash or "smoky" haze. [plan.md: OCT 27 (after 9c); Part 8 ~L1252]
- **The blackout kills EVERY light** — at its depth nothing in the foreground (props, benches' overlays, lamp-lit leaves, the shop, blinds, the crossing) is brighter than the dark city; every new light follows blackAt. [plan.md: OCT 29 (C4b's review) — THE TR-3B BLACKOUT STILL LEAKS]
- **"Does it make physical sense"** — every moving piece reviewed over its WHOLE path, its depth listed. **The glance test** — reads in 3 s from silhouette, pose, colour, motion. [plan.md: Rules that apply to everything]
- **Real phones decide** — the laptop at 4× is an early warning; the iPhone (`&debug=1`, `&bench=1`) the verdict; before/after in ONE run. [plan.md: Rules that apply to everything]
- **Weather only when real**; never tell players the city is live. **Fixed-time moments run on the clock**, not the dice. [plan.md: Rules that apply to everything]
- **"Always something happening"** — never stack routines; routines LAST; every event JOINS MID-WAY on load; "NEVER goes quiet at night", only quieter. **"NOTHING visible changes after the reveal"** (no tier judged in the first ~15 s; steps invisible). [plan.md: Part 7 ~L427–470; OCT 25 (after PEO); OCT 26 (after WIN)]
- **BIG HOLIDAY PIECES CHANGE OFF-CAMERA** (at a load / a return; people's own scenes excepted). **"Build now, polish later"** — a HOLIDAY POLISH pass after City 2.0. [plan.md: OCT 27 (after 11a-2)]
- **Finish the city, then the games** — mid-pass ideas → the POLISH BACKLOG unless a bug, a holiday deadline or "now". **Desktop = the same city, one better shot** — built + judged on the PHONE only, never a desktop-only piece; Claude checks desktop itself. [plan.md: OCT 27 (after 11a-2); OCT 27–28 (after 9d)]
- **Ask first** when rules conflict (numbers first). City 2.0 passes test the city only (+ one smoke check on a shared file). A bug not fixed in 2 real attempts → Known issues. [plan.md: TESTING SCOPE; How every part works]
- **Colour reservations**: red = beacons, the TR-3B's orb, the Mothman's + the haze-room's eyes; violet = the boss's spade; pale green = the UFO's beam. The logo: "pink is home most nights"; its redraw CANCELLED — "LEAVE IT AS IS". [plan.md: OCT 27 ~L2720; Part 3; OCT 26 (after HALLOWEEN)]
- **Signs**: the speakeasy "secret and unmarked"; every game a sign, never one changing while you watch; THE SLOT RULE (the blade one-word names; "never a shortened name anywhere"); none on a hero tower's face or clipped by the edge; ≤ 2 neon colours a building, never the outline colour of the one behind. [plan.md: Part 3 ~L211–235; Part 5c ~L371]

---

## 3. The layout + the camera
- Numbers, size rules, lanes: `docs/harbor.md`. The skyline squeezed: the tallest crown 10 pt under the tagline. [harbor.md: The owner's decisions]
- **THE PROMENADE, LOCKED** (built PROM + C4b; detail prom.md, c4b.md): no lampposts · the crosswalk dimly lit ("you can see people and see the white stripes", stripes ≥ 2:1) · the hydrant at the left curb · the compass bigger at ~f 0.515 (centrepieces at today's ON-SCREEN size unless marked) · the water bench ~f 0.42 facing the harbor · the cart ~f 0.69 · the maple + THE CAB STAND at the right edge (its own off-screen lamp lights the leaves) · the doorman opens the outward-swinging side door · the awning lit from below · holiday anchors = the RAILING, the TWO TREES, the SPEAKEASY front, the COMPASS (no urns). "We can always add stuff later." [plan.md: OCT 28 — THE PROMENADE, LOCKED; OCT 28 (FR4's answers); OCT 28 (C4a's review)]
- **The street under the dock is a stage only while the dock is hidden** — the ONE exception: the dance breaks' spill (§6). Dock fade 10 s on a first visit, 5 s after, 2 s during a street scene. [plan.md: OCT 26 (after SP5); OCT 28 — THE DOCK FADE; OCT 29 (the evening)]
- **The centrepiece**: a height cap below the blade's bottom + the wheel hub. The giant ₿ pumpkin DISABLED (not deleted) — next Halloween decides. [plan.md: Part 8 ~L1115; OCT 28 (FR4's answers)]
- **THE CONSTRUCTION TOWER** (built): implosion 3rd Sunday of April 10 am (the real building, complete) → rise June 1 → Sept 1 → topping Sept 1–8 → the crane down mid-Sept → GRAND OPENING the first Saturday of October, 7 pm; NO neon on the construction; the vertical words' seasonal gap accepted. **LATER (C3 or after):** the cycle moves to the far-left `empire`; the new tower the tallest, its top ~level with the tagline's left "——◇" line (never touching its glow), with word windows; `wordV` stays the permanent word tower. [plan.md: OCT 28 (the 9e review); OCT 28 (after 9f); OCT 28 (FR4's answers) 8:34–8:39 pm]

---

## 4. The light
- **THE NIGHT LIGHT = NIGHT-A's, the DEFAULT since NIGHT-A2** (`&light=old` + a TOOLS row for A/B): an even BASE ("never a dark lot"); the implied lamps "a DIRECTION, not lamp positions" — one broad soft warm wash, NO pools ("NOT two light poles at two spots"); only the SHOPFRONT (awning + door lamp) + the CAB STAND stand out; people lit on their fronts, soft faint shadows UP the screen, no black blobs; wet nights reflect softly, party nights tint faintly, the blackout takes it all down. [plan.md: OCT 29 (the afternoon) — THE NIGHT LIGHTING REWORK; NIGHT-A REVIEW; night-a.md]
- **THE BRIGHTNESS LADDER** (e2e `light`, max channel): neon sign + skyline neon > speakeasy windows > shopfront > promenade wash > base. [plan.md: OCT 29 (the afternoon)]
- The trees' night shadow as NIGHT-A2 left it ("it doesn't look bad"); the side-light idea DROPPED. [plan.md: NIGHT-A2 REVIEW (9:37 pm)]
- **THE STAGE LIGHT — BUILT, OFF until the owner picks** (`&stage=1|0` + TOOLS → THE STAGE LIGHT · ON; NIGHT-B): the promenade lit like a stage, the FOREGROUND STREET (below the curb) ~⅓ darker (×0.71 against today's light on the real screen), NOT black, a soft falloff across the curb, wet reflections kept, the neon still brightest (the ladder at 3×), the vehicles' lamps already lit at night. **THE PARTY DIM** (with it on): the wash −12 % + the street −16 % more × the crowd's curve (a cheap overlay). Open: the owner compares plain / party / wet / a bus + says ON as the default. [night-b.md; plan.md: THE DARKER STREET + THE PARTY DIM]
- **Timing**: the power-up WAITS for the blue hour (golden hour = sunlight, ~5–10 % windows), then a ~30 min wave; the logo follows the darkness input; City 1.0's light timeline kept exactly. [plan.md: Part 2 ~L286; Rules that apply to everything]
- **Sources**: the awning on at dusk (photocell), off 1 am Sun–Thu / 2 am Fri, Sat + holiday party nights; the barbershop a dim 2.5D room at night, HARBOR BARBERS gilt REMOVED; red beacons by photocell at sunset, never white strobes; the lighthouse STAYS WHITE on party nights ("the calm anchor"). [plan.md: OCT 28 (the afternoon review); OCT 28 (C4a's review); Part 8 ~L1150, L1209]
- **JOIN = HOST** an exact pair at night (only the colour differs); the corner buttons lit ~⅔ — "look great". [plan.md: OCT 29 (the afternoon); NIGHT-A REVIEW]

---

## 5. The beat, the music + the sounds
- **THE BEAT** (core/harbor-beat.js; docs/audio.md): the lights follow the grid, the kicks calibrate ONE lead; **A TRUSTED GRID ALWAYS PUNCHES** — half from the first bar, full once the kicks confirm; the saved lead never clamped (−80 … +120 ms), never learned after a return / restart / route change, PER OUTPUT (`bt` / `wired` / `unknown`). party9 (no kick to hear) HALF all song — expected; party3's grid fixed (**the owner listens once**). Closed on his iPhone ("1st punch bar 0, full bar 9"). [night-a2.md; plan.md: THE DARKER STREET (9:48 pm)]
- **The beat must be felt** (a fast attack, a clearly brighter peak, harder on downbeats; no full-screen flashing). The music-on race on the next beat, ~10 s cooldown. Dancers wind down over a song's last bars, pick up on the next first downbeat; tempo changes blend ~1 s. [plan.md: Rules that apply to everything; OCT 26 ~L2069, L2566]
- **iOS**: never touch the song element's playbackRate (THE TAPE STOP is Web Audio). [plan.md: OCT 25 (after 8b2)]
- **THE MUSIC**: City 2.0's day (core/city-mood.js) + the `city2` decks (data/mood-music.json); MUSIC MOOD in both cities; new songs via ~/Downloads/{mood}/ + `scripts/add-city2-music.py`. EVENING = 14 songs incl. c2-80s-retro-synthwave. Unassigned: rotate deck halves weekly once a mood has ~30+ songs; seasonal songs. [CLAUDE.md Audio; night-a2.md; plan.md: Part 6 ~L279]
- **"Felt not heard"**: never rely on a subtle sound — a music change, a duck or on-beat hits + a strong visual; BIG moments duck the music (noon whistle, the 7 pm cruise horn, the drone show), the hourly bell never; an EMPTY slot is silent. [harbor.md: The owner's decisions; plan.md: Part 7 ~L479; Part 8a ~L1090]
- **ROSIE ON THE HOUR — NO CHANGE**: her BELL docking at :00 is FIXED ("the bell's fine, that's what I liked"), the horn ~:03; the timetable records `rosie.bell = :00` untouchable. [plan.md: OCT 29 (the evening) — ROSIE ON THE HOUR]
- **Inside sounds**: the mirror door SILENT; the barbershop's SCISSOR SNIPS STAY. [plan.md: NIGHT-A REVIEW; THE DARKER STREET (9:48 pm)]
- **Every sound drop: pick, process, budget** — copy from ~/Downloads (never edit the originals), process through scripts/add-city-sfx.py (trimmed, mono, ~64–96 kbps), ship only what's used, list the rest + why in the pass log, credit in ☰ → CREDITS; listen-check: no words, melody or anything modern. [plan.md: OCT 29 (the evening) — A SIZE BUDGET; OCT 25 ~L1705]
- **Legends' sound defaults** (built): the UFO HUM A + DEPART LAYERED, loaded AHEAD; the implosion: siren → 10 s → HORN B ×3 → 5 s → the fall + ONE crash. [plan.md: OCT 28 (the 9g review)]
- The music-off soundscape → Part 12. [plan.md: Part 12]

---

## 6. The party night (Fri + Sat)
- **THE SHAPE** (Oct 29 4:08 pm; supersedes SP5's "every hour on the hour, two songs"): the STREET PARTY crowd is there ALL night, following the curve — warm-up **8:30 pm**, fullest at the peak (~9:30–11), thinning after **1 am**, gone by **2 am**; mostly MINGLING groups (talking, laughing, toasting — big gestures): "how it is outside a bar on a party night". (The old guardrail: never before the blue-hour power-up ends.) [plan.md: OCT 29 (the afternoon) — THE PARTY NIGHT's SHAPE; Part 8 ~L1278]
- **THE DANCE BREAKS** — BUILT (NIGHT-B, core/harbor-streetparty.js): ~every 20 min (21:00 → ~1:25, ± 3 min, ≥ 12 apart) ONE SONG where almost everyone dances, on THE PARTY's OWN SONG CLOCK (seeded songs back to back from 8 pm — every phone the same, joined mid-way the same, the music OFF too); each phone plays its own song, so the MOVES follow the phone's beat while the break keeps the shared clock (a break may begin mid-song on a phone — open below). Never the same kind twice; none during a raid / a legendary; the cheers rise as it starts. `&force=dance` (+ `&dance=conga|bounce|wands|swing|mix`) = a break every 5 min; the old hourly circle RETIRED (`&force=circle` keeps it). [night-b.md; plan.md: OCT 29 (the afternoon) 4:08 pm]
- **THE DANCE SET** (REVISED 5:08 pm): EVERY dancer holds a NEON WAND; all upbeat, NO sway — (1) THE CONGA (a hand on the shoulder in front, the other waving its wand), (2) THE BOUNCE (hops, fists pumping), (3) WANDS UP (swaying overhead), (4) SWING PAIRS (a twirl, the wand tracing it), (5) Charleston kicks only if they read; each break picks one (or two), by tempo + energy, never the same twice running. Big motions only. [plan.md: OCT 29 (the evening) — THE DANCES, REVISED]
- **THE BIG CONGA**: in from the RIGHT EDGE, across the whole promenade, off the LEFT (~20 long on strong phones, ~12 / ~8 lower). **THE STREET SPILL**: in a break the party spills into the street's UPPER BAND — front-street traffic HOLDS (trafficHold), dancers step down + up by their own motion; the dock's glass a touch darker behind them; never in the street outside a break. [plan.md: OCT 29 (the evening) — THE BIG CONGA + THE STREET]
- **THE CROWD's TEXTURE**: POCKETS of every size scattered unevenly, ALWAYS slightly moving ("never frozen statues"); WALKERS keep threading through (a test: a left ↔ right route always exists). ALWAYS CLEAR: the side door's landing + the doorman's swing + the guests' approach + the lobby line, the crosswalk's landing, the cab bench. Counts (Claude's; "even more if the bench allows"): tier 2 ~18–24 dancers + watchers, tier 1 ~10–12, tier 0 ~6–8; busy times walkers ~12 → ~18–20 at tier 2. The CART packs up before the dance hours. [plan.md: OCT 29 (the afternoon) — THE STREET PARTY, 4:06 pm; OCT 29 (the evening) — THE CROWD's TEXTURE]
- **DANCERS ON THE BENCH**: in a break up to THREE climb the cab-stand bench, wands up; on + off by their own motion; the bench's crisp overlay redraws them; the waiters + taxi pause. [plan.md: OCT 29 (the evening)]
- **THE CROWD's SOUNDS**: `C:\Users\benja\Downloads\Grok\city-sfx\party-crowd\` (29 files — read `party-crowd-claude-prompt.txt` FIRST; beds walla-5 then walla-1) → ship ~2 beds + ~10–14 one-shots, ≤ ~1.5 MB: a low-passed walla bed following the crowd + the curve, one-shots from the groups' positions; "Sound effects" in ☰ → CREDITS. [plan.md: OCT 29 (the evening) — THE PARTY CROWD SOUNDS]
- **FIREWORKS AT 10 PM** (supersedes "the midnight finale"): 10 pm local, or once dark enough if later (≥ ~30 min after sunset); the peak's moment + its biggest break (WANDS UP + cheering). **Midnight = a small burst** (~20–30 s, a "last call" salute) + a cheer / the windows' toast. [plan.md: OCT 29 (the afternoon) 4:10 + 4:12 pm]
- **Part 10's engine**: real shell types (peony, chrysanthemum, gold willow, palm, ring, crossette, crackle, comets), sparks cooling white → colour → ember, lighting buildings / smoke / water, doubled in the harbor, smoke on the real wind; fewer shells on weaker phones, "never ugly". Rosie's + the pier's bulbs CHASE. [plan.md: Part 10; Part 4 ~L245]
- **THE SUPERYACHT**: HUGE + modern ("the joke lands"), generic, a helipad, sunset / night only, turquoise underwater lights, the helicopter lands on it, gone before dawn; one random party night a month + the Wed before Thanksgiving, the last Sat before Christmas, NYE, July 4, Labor Day Saturday; never two nights running; yacht.glb from the start. [plan.md: OCT 26 (after SP5) ~L2595; OCT 27 ~L3090]
- **Special party nights**: the Wed before Thanksgiving (built), Valentine's (a softer jazz night), NYE. The barber pole NEON in the party colours; car underglow on party nights only. [plan.md: Part 10; Part 8 ~L1263, L546]
- **The window party** (built WIN3): rooms light one at a time, each its own colour, a raid cuts it; the boss never joins; the TV on from the party's start. [win3.md; plan.md: OCT 26 (after WIN2)]

---

## 7. The windows
- **THE QUIET BUILDING** (NIGHT-C; supersedes "something every ~10–20 s" + "the other rooms keep their life" at night): at NIGHT only the BOSS's TV room, the two CUT-OFF left-edge side rooms (top floor + below — candle / flicker / ambience — ALWAYS ON at night) and the UPPER MIDDLE window ONLY while the shadowboxer is active stay live. Every other window PARKED, not deleted: a drawn blind, a mix of warm-lit + dark, going out one by one as it gets later; reachable from the panel; rebuilt properly later. PARTY NIGHTS unchanged. Every live window PREMIUM: 3×, the lit 2.5D room kit, real light. [plan.md: THE QUIET BUILDING (5:52 pm)]
- **Still the rules**: MUST READ AS-IS (puppet-theatre staging, strong contrast, close figures ~60–70 % of the pane); lit rooms = lit coloured people; ONE star window; a moment belongs to ONE window (the party excepted); edge windows = light + shadow moods. [plan.md: OCT 26 (after 9a / SP4 / WIN2)]
- **THE BOSS's ROOM**: NEVER a person ("THE MYSTERY IS THE POINT"); the TV deep royal blue, brief amber now + then; an empty couch; the blind FULLY DOWN all day (the tap-peek lifts it a hair); the violet lamp + spade ♠ the night before the bootleggers. [plan.md: OCT 26 (after WIN2) ~L2434; OCT 27 ~L2771; NIGHT-A REVIEW]
- **THE SHADOWBOXER** (the room → SKY; a 1920s BOXER): **MON, WED, FRI, 7 → 11 pm**; a SET = 10 × 3-min ROUNDS + 1-min breaks (40 min) → a 10-min BREAK → again; rounds vary (shadowboxing side to side, the bag, footwork, duck + weave); in breaks he steps out + returns facing either way; at 11 he FINISHES his set, towels off, walks out. **FRIDAY** (party night): seeded ~50/50 — he WRAPS UP ~8:30 (finishes the round) or STAYS to 11 (his window sits out of the party). Never during a raid / a legendary. **HIS LOOK**: the blind UP; one bare bulb (the REAL light — it swings when he hits the bag, the pool + his + the bag's shadows swing with it); a warm amber wall; HIM black in profile ~70 % of the window, a warm rim ("not flat black paper"); the bag a second shape. Off-nights the blind down like its neighbours; the blind going UP is his entrance; after his last set it comes down lit, then dark. Panel: WINDOWS → THE SHADOWBOXER + skip-to-round. [plan.md: OCT 29 (the evening) — THE SHADOWBOXER's SCHEDULE, REVISED + FRIDAY + THE END + HIS LOOK; THE QUIET BUILDING]
- **EYES IN THE HAZE**: 2 weekend nights a month, 11 pm–4 am; never with a legendary, the eerie-red edge night or a Mothman night (needs SKY's `ctx.mothman`). [plan.md: OCT 26 (after WIN2) ~L2391]
- The spiders Halloween only; the morning paper REMOVED; the cash count + poker room PARKED ("don't touch"). [plan.md: OCT 26; OCT 28 (the 9e review); OCT 27 ~L2686]

---

## 8. People, workers, vehicles + THE SOLIDS
- **THE SOLIDS** — BUILT (NIGHT-B Group 0; a walker went through the chestnut cart): ONE registry, `core/harbor-solids.js` — both benches (their sitters + the bench dancers excepted), the two trunks, the hydrant, the crossing's poles, the CART (parked: its body + handles + the cider board; rolling: its corridor — people step aside), every holiday piece (standingFootprints). `aroundSolids` bends EVERY visit round them as it reaches the frame (never into a closed circle, never round the cart's front under the dock). The pumpkins on the speakeasy's steps stay OUT (they flank the door; the guests pass between). Adding a solid = one line there. [night-b.md]
- **Counts**: weekday 4–5 · lunch / after work 6–7 · nights 3–4 · weekend + party 8–12 · late 0–3 — "LINGER MORE, PASS THROUGH LESS"; party + busy times §6. Bench seats RESERVED; sitters read SEATED. [plan.md: Part 7 ~L607; OCT 25 (after 8b1); OCT 28 (PROM's review)]
- **Workers**: "EXTREMELY HIGH QUALITY", props "arrive and leave in hands, never pop"; regulars to the minute (milk 6:00, newsboy 7:00, barber 8:30, beat cop 9 am + 9 pm; sign painters Mon 1–4 pm — the blade never the same style two weeks running, bulbs warm white; window washers Tue + Fri; gardener Wed). LATER (a people polish near the end / SCHED — "I don't want to nitpick everything to death"): the window washers' jittery in-sync arms + cheap gear, the dog walk's look. [plan.md: OCT 25 (8b1/8b2); Part 7 ~L435; OCT 26 ~L2476; OCT 29 (the afternoon) — POLISH LATER]
- **THE RAID**: the night after a bootlegger delivery (~50 %), 9–11 pm; ~1 a week, ~1 party-night raid a month; never during holiday big moments (NYE countdown, Christmas Eve, the tree lighting), legendaries, worker shows — or the 10 pm fireworks / midnight burst. [plan.md: OCT 25 (after 8b1) ~L1633; Part 7 ~L955]
- **The abduction**: pose + timing a "HARD RULE"; background people only; witnesses FLEE, then the gradual return. [plan.md: OCT 27 ~L2725]
- **Vehicles**: ~1915–1935, varied, "never the same car twice in a row"; every door one smooth eased swing; the bus away ~1–2 s after its door shuts; the cab stand's waiters + taxi only while the dock rests. [plan.md: Part 7 ~L546; OCT 29 (C4b's + C4c's reviews); OCT 28 — THE CAB STAND]
- THE TRIPPING JOGGER (the one tap on people) → Part 12. [plan.md: Part 12]

---

## 9. The sky + the legends
- **THE DEPTH RULES**: everyday sky (planes, helicopters, birds, bats, balloons, UFOs, meteors) uses the whole sky BEHIND the corner buttons, the logo + tagline + the taller buildings, IN FRONT of the moon, sun, stars; MESSAGES (drones, skytyping, the banner plane) IN FRONT of the logo, which dims; never over the dock. (The barnstormer "through the letters" is removed.) [plan.md: Rules that apply to everything; OCT 25 (after POLISH 5)]
- **Sky messages** only on holidays or when sent (CITY CONTROL); 3 lines × ~16 letters, ≤ ~3 pages; "CLOUDS NEVER COVER A MESSAGE"; THE DRONE SHOW = A MESSAGE, NOTHING ELSE; skytyping only (skywriting CUT). [plan.md: Part 6 ~L263, L629, L687, L694]
- **Rarity**: the UFO ~1–2 a month, any night; the TR-3B + chase ~1–2 a month, PARTY NIGHTS only, peak ~22:00–00:30, never with the yacht / fireworks / a raid / the UFO, never two nights running (see §16); never two legendaries a night; the surprise flyby ~twice a MONTH. [plan.md: Part 6 ~L632–637; OCT 26 (after SP5) ~L2653]
- **THE HELICOPTER** (NIGHT-C): HOURLY dusk → ~2 am, every 2–3 h by day, the searchlight sweeping the water; on PARTY NIGHTS the beam takes the neon colours + sweeps on the beat — NO strobe, the anti-collision lights at their real slow pace; up for the WHOLE song of EVERY dance break, its beam over the crowd. [plan.md: OCT 29 (the afternoon) — THE HELICOPTER PATROL; OCT 29 (the evening); NIGHT-B IS SPLIT]
- **THE BLACKBIRD** (SKY) — ONE animation for every trigger: the radio-static tell ~3 s before; a VAPOR CONE (~0.4 s) + ONE pale SHOCK RING (~0.8 s); two long plumes (~1.5–2× the body) with 4–5 bold MACH DIAMONDS; a speed streak fading ~1 s; straight across in ~1–1.5 s in the strip ABOVE THE NEON SIGN (under the buttons; check ≥ ~28 pt first); ~60–75 pt long; full device dpr; `sonic-boom.wav` twice (0.15–0.3 s apart) ~0.8–1 s after the cone, then a tearing scream (not the F-22s' roar); the boom shakes the city a touch, never the logo; tap box = body + plumes. TRIGGERS: rare solo sightings (+ ~5 passes on July 4); THE WATCHER's REWARD (60 visible min; under 5 min away pauses, longer resets; personal, once a device a day, never announced); EVERY TR-3B chase (the F-22s ~⅓ across, same direction, faster — ACROSS the dark sign while the drain holds it, above it if it's powering back). [plan.md: OCT 28 (the afternoon review); OCT 28 (the 9g review); OCT 28 (PROM's review) 5:33–5:37 pm; OCT 29 (C4b's review)]
- **THE F-22s + THE TR-3B** (SKY): the F-22 model everywhere (gear up, stencils off), the chase a TIGHT TRIANGLE with a small unison bank, full dpr; the TR-3B on its own full-dpr overlay as ONE SOLID UNIT, NO shadow on the backdrop, still hand-drawn. [plan.md: OCT 28 (the 9g review); OCT 28 (PROM's review)]
- **THE MOTHMAN** (SKY): crouched ON THE SPIRE's TIP (talons on the point, never the spire through him), WINGS FOLDED like a cloak (two hooked peaks above the head, a ragged hem), head hunched forward; head + eyes may sit IN FRONT OF the tagline; ~70 pt at 402; near-black, the needle's pink rim from below + a cool moon edge; MENACING. A CODE-DRAWN STAND-IN first (better than the moth3 mock, crisp 3×) behind ONE ART SWITCH (drawn → Grok's PNG → the TUCKED Hunyuan model in `Downloads\Grok\models\mothman-folded\`); the behaviour fixed: eyes blinking out of sync, a slow head tilt (a separate head piece), the needle stuttering, 2 am → ~5 am (~twice a month, a silent glide in, gone ~5:00–5:30). DROPPED: the spread wings, the half-open moment. `&force=mothman` + a row. [plan.md: OCT 28 (FR4's answers) — REVISED; OCT 29 (C4b's review); OCT 29 (the afternoon) — A STAND-IN FIRST; OCT 25 ~L1944]
- The UFO: sebslom's model, green lights, the pale green beam, above the wheel. The air show (11c): formation flyby + the missing man only — "if they still don't look premium… CUT the air show". Skydivers → 11c; Santa's sleigh → 11b. [plan.md: OCT 27 ~L2783; Part 6 ~L599, L785, L798]
- **THE SUN LOOKS WRONG** (ATM): "a flat pale CREAM DISC … like a paper plate" → a near-WHITE core blowing out into its glow, no rim, warm only near the horizon, a smooth falloff + a wide bloom, never a cartoon starburst. [plan.md: OCT 29 (C4c's review + the phone bench)]

---

## 10. Weather — THE ATM PASS (all pending; detail: plan.md "OWNER'S NOTES — OCT 26 (after 9a)" ~L2010–2050)
- **CLOUDS**: speed from the real wind at their height but slowed (minutes across, never racing); CUMULONIMBUS storm decks; the veil by layers (high thin = bright, blue through; only low / mid greys); the day's light; lightning inside. [plan.md: OCT 26 (after 9a); OCT 27 (after 9c) ~L2976]
- **WIND AS ONE SYSTEM**: crowns + rolling gusts, leaves, flags, smoke, rain slant, coats, chop, balloons, snow drifts; the water never a mirror (a minimum roughness + a slow swell); the maple's sway must read. [plan.md: OCT 26 (after 9a); OCT 27 ~L2755, L2924; OCT 29 (the afternoon)]
- **FOG AS DEPTH**: far gone, middle ghostly, near clear; lights haloed; a broad lighthouse cone + the foghorn; drifting banks; dense vs mist distinct; beams broader + softer with density; beacons a breathing red halo. [plan.md: OCT 26 (after 9a); Part 6 ~L593, L1209]
- **THE STORM**: thick branching bolts, strikes on the skyline / water, intra-cloud flickers, thunder delayed by distance + a brief duck, THE NEEDLE struck ~1 in 6 close strikes. SAFETY: no full-screen white, ≤ 3 flashes / s, capped; reduced motion = dim + thunder. [plan.md: OCT 26 (after 9a); OCT 26 (after HALLOWEEN)]
- **FREEZING RAIN** "must read as ICE at a glance" (icicles on the awning, cornice, window heads, the signs' frames; glaze on the railing, benches, cart; careful steps; NO salt worker). **BLIZZARD MODE** (whiteout with depth, `&force=blizzard`). The street under the dock shows no snow (open). [plan.md: OCT 26 (after 9a) ~L2024; OCT 27 (after 9b) ~L2897]
- **Keep**: drizzle < rain < heavy rain distinct; the climate fallback (no invented snow); a live "none" never beats a real answer; frost on City 1.0's PANE only ("none on the buttons"); glass weather fades with its button; snow lands on the sign + goes dark with its power. [plan.md: OCT 25–28 (9a–9e notes)]

---

## 11. The holidays
- **The system** (built 11a): date-driven calendar + BUILD-UPS; THE SIGN DECORATION SYSTEM (no draped bunting, no glows behind); DRESSING SPOTS with BIG pieces at the anchors (§3); standing pieces register footprints. [plan.md: Parts 11a / 11b / 11c; OCT 26 (after WIN)]
- **HALLOWEEN** (built; Sat Oct 31 = Halloween + a party): the giant ₿ OFF; the GHOST SHIP from its model before next Halloween. **DAY OF THE DEAD**: skip this year. [plan.md: OCT 28 (FR4's answers); OCT 28 (PROM's review) 7:47 pm; OCT 27 ~L3065]
- **THANKSGIVING** (built): the harvest display DRAWN by default (`&prop=model`); a clearly better model becomes the template for key pieces. [plan.md: NIGHT-A REVIEW; OCT 29 (the afternoon)]
- **CHRISTMAS (11b)**: DISCUSS the whole look with the owner BEFORE the prompt (the trees, the compass, the railing, the door, when each arrives). Known: LIVE by ~Nov 20, the build-up from Nov 27, a little more each day; the speakeasy's C9 strings ("looks amazing"); the compass tree from the undecorated `christmas_tree.glb` (70 MB — bake in pieces) + our own lights / star, base within ±1.3 u, lighting at dusk bottom-up, the star last; the menu = plan.md Part 11's Christmas list. [plan.md: OCT 28 (PROM's review) 7:47 pm; THE ORDER — REVISED; OCT 27 ~L3079]
- **NYE (11b)**: each player's own midnight; a party night any weekday; the yacht + helicopter guaranteed; the countdown in the tagline (last 10 min), the ball drop (60 s), towers 10 → 1, "2027"; fireworks: a few from dusk, NONE in the last hour, a ~30 s finale at zero + every boat's horn, thinning to dawn; the morning after. HEAVY → the spectacle cap (§13). [plan.md: Parts 11a / 11b / 11c; Part 10]
- **11c** (at the END): Valentine's ("romantic + elegant, never cheesy"), St. Patrick's, Easter, Memorial Day, July 4th, September 11 (two beams, quiet), Veterans Day; a flagpole at the railing only on half-staff days; flags need new homes (no lamp posts). [plan.md: Parts 11a / 11b / 11c; Part 8 ~L1321]
- **Bitcoin nods** (rare, never explained): Jan 3, Oct 31, May 22, the ₿ balloon. [plan.md: After the city]

---

## 12. THE CITY TIMETABLE + THE TIER TABLE (BUILT in NIGHT-B — `core/harbor-schedule.js`, `core/harbor-tiers.js`; the older systems migrate at SCHED / PERF)
- **THE CITY TIMETABLE** `core/harbor-schedule.js`: every system's timing KNOBS as one plain table (when, how often, days, window, rarity, priority, never-overlaps) the planners READ (behaviour stays in them) + an export (a readable timetable + a "what you'd see" week) + a panel view. Every NEW timed thing registers (NIGHT-B: the crowd curve, the breaks; NIGHT-C: the helicopter; SKY: the legends); old systems migrate at SCHED; a test: nothing hard-codes a time outside it. [plan.md: OCT 29 (the evening) — ONE PLACE FOR THE CITY's SCHEDULE]
- **Lights + signs too**, each row with a TRIGGER: CLOCK, CALENDAR, DARKNESS, BEAT, EVENT (only CLOCK + CALENDAR have times to tune). **The conflicts live there**: legendaries hold traffic; the helicopter up for every break; the street party vs the cars; fireworks vs a storm; the boxer vs the window party. [plan.md: THE TIDY-UP + THE TABLES (9:11–9:15 pm)]
- **THE TIER TABLE** `core/harbor-tiers.js`: EVERY per-phone-strength number (walkers, the crowd + pockets, dancers, the conga, bench dancers, shells, the helicopter's beam, effects per tier 0 / 1 / 2 + the top tier's 3× pieces); everything READS it; a test: no tier number elsewhere; old systems migrate in PERF. [same]
- **SCHED** reviews the whole city's timing as one (gaps, pile-ups, dead hours, what a casual visitor catches); discussion only until the owner decides. [plan.md: OCT 29 (C4b's review) — THE SCHEDULE REVIEW]

---

## 13. Speed, memory + 3×
- **The iPhone 16 Pro bench** (Oct 29): every scene tier 2, 55–60 fps, work 3–9 ms → ~2× headroom: the SPECTACLE CAP ([1, 2, 2]) may rise for 10 / 11b on strong phones; ONE older-iPhone run still wanted. The full city at 3× drops frames → 3× for still / slow pieces only. [plan.md: OCT 29 (C4c's review + the phone bench)]
- **THE 3× PIECES** ("go with your gut"): already — the logo + SPEAKEASY, the blade, the date stone, the OVERCLOCK billboard, the hush sign, the benches. ADD: (1) the upper windows (SKY; the QUIET BUILDING's live ones, NIGHT-C) — anything crossing them draws above; (2) the legends' craft + THE MOTHMAN (SKY); (3) the shopfront glass + valance + BARBER POLE (a later pass); (4) the WAIT / WALK boxes; (5) THE MOON on the sky layer at full dpr. (4) + (5): no pass yet. [plan.md: OCT 29 (C4c's review) — THE 3× PIECES; OCT 28 (C4a's review)]
- **THE ROOF SIGNS AT 3× — BACK ON** (NIGHT-C; reverses Oct 28): THE WHOLE SIGN — lettering, frame AND THE STAND (a clean join at the roof line); every effect routes through; judged unzoomed at 402. The PRISM blade — NO. The hero outlines at 3× — MEASURE in PERF (top tier only if it fits). [plan.md: OCT 29 (the evening) — THE ROOF SIGNS AT 3× + FINAL CALL]
- **Memory**: the guard 64 / 96 / 160 MB counts every live canvas; softness only from the SPEED tier; the climb re-arms after each heavy moment. [c4c.md; plan.md: OCT 28 (C4a's review)]
- **PERF's list**: the party frame (~+22 ms at 4×: drawImage counts, 100 sign-tube canvases, crowd rigs), the UFO-over-a-crowd p95, the TR-3B's start hitch, the cheap wins (one glow-sprite cache, baked pools, the bar's repaint), the spectacle cap, the tier-table migration, **the scene.js SPLIT** (FR5's cut lines, a NO-LOOK-CHANGE refactor proven by pixdiff + the guard). The audio budget may rise for 10 / 11b; fireworks may get a WebGL layer. [night-a2.md; plan.md: OCT 28 (C4a's review); THE TIDY-UP — WAIT FOR FR5]

---

## 14. Assets, models + credits
- Sprites only; sources > ~20 MB git-ignored; one bake tool; credits in ☰ → CREDITS (`js/ui/credits.js`). [plan.md: OCT 27 ~L3093]
- **Hunyuan3D models MAY SHIP** ("it's a hobby project") with the AI-generated label in CREDITS; before any MONEY re-check every Hunyuan asset. [plan.md: OCT 29 (the afternoon) — THE HUNYUAN LICENSE — THE OWNER's CALL]
- **The deploy**: ~255 of ~264 MB is music → at the SWITCH-OVER drop City 1.0-only music + dropped games' songs. [plan.md: OCT 29 (the evening) — THE DEPLOY's WEIGHT]

---

## 15. After the city (decided, by owner pass — detail in plan.md "After the city" + the dated notes)
- **13 CITY CONTROL**: messages + the banner plane, words in windows, one-tap + scheduled events, a kill switch, the audit log, a PIN; **THE SHOWREEL** (~3–4 min of the best, any tap stops it); **THE INTERCOM** (push-to-talk ≤ 30 s → PLAY BACK · SEND · DISCARD, UNSEND ~1 min, a 1920s PA effect, waits for the lobby unless DON'T WAIT, never mid-round in a `NO_INTERCOM` game; EVERYONE · THE CITY · ONE ROOM, kept for launch). [plan.md: OCT 28 (after 9e); OCT 28 (PROM's review) — SPEAK TO THE CITY]
- **14 LOBBY 2.0**: the live city IS the lobby; the lobby line left of the door; THE WINNER'S BANNER PLANE (+ "LAST CALL — BEN WINS THE NIGHT"; shape pending); CONN's two-phone check in its review. [plan.md: After the city; OCT 28 (the afternoon review)]
- **17 PROGRESSION 2.0** (read `Downloads\grok\Progression\PROGRESSION-DECISIONS.md` + `Solo\SOLO-DECISIONS.md`): THE ARRIVAL LADDER (a daily-streak welcome moment, never explained; supersedes the per-visit ladder); CITY SIGHTINGS only by TAPPING the event, never from a preview; THE TINFOIL HAT; decor slots; "CALL IN A FAVOR" (remind him); birthdays (month + day, the room only). [plan.md: OCT 27–28 (after 9d); After the city]
- **15 TV MODE**: works in the XBOX's EDGE BROWSER (controller focus, big buttons, 1080p / 4K, ~5 % safe margins, audio on the TV, no hover-only); the TV a SCREEN, never a player. [plan.md: TV MODE ON THE XBOX; After the city]
- **DESKTOP**: a re-composed wide camera from the phone city's pieces only (lower + closer, more water, a shallow promenade, the sign bigger, no visible repeats, a billboard slot for the four billboard games); the owner's desktop questions first. [plan.md: OCT 27–28 (after 9d)]
- **GO PRIVATE** right before the launch; anti-cheat never depends on secret code. [plan.md: OCT 28 (after 9f)]

---

## 16. Open / parked
**Open (waiting for the owner)**
- **THE STAGE LIGHT as the default?** (`&stage=1` vs `0`: plain, party, wet, a bus, Halloween) [night-b.md]
- **The breaks on the HEARD song?** Today the party deck is per phone (its own bag): the break keeps a shared clock. Starting every break on the song each phone HEARS needs the party deck on the server clock (every phone the same song) — a music change, the owner's call. [night-b.md]
- **Veterans Day** (Nov 11): pull a small piece into NIGHT-B / SKY, or wait for 11c? (asked) [plan.md: THE ORDER — REVISED]
- **The TR-3B vs the 10 pm fireworks**: party-nights-only, peak ~22:00–00:30, "never on a fireworks night" — restate its window now that party nights have 10 pm fireworks. And: does EVERY Fri / Sat get the show, or only SP5's special nights (yacht / NYE / July 4 / birthday)? [plan.md: OCT 26 (after SP5) ~L2605, L2653 vs OCT 29 (the afternoon)]
- **The Saturday 10 pm drone show** (an old running order: a heart, logos, shapes): never built, contradicts "A MESSAGE, NOTHING ELSE", collides with the fireworks. [plan.md: Part 6 ~L416, L629]
- **The helicopter's yacht landing** (10) vs its NIGHT-C patrol + breaks — coordinate in the timetable. **Whose city in a lobby** (Claude: each phone its own — pending). The rarity colours' categories, the winner's banner plane's shape — pending OK. [plan.md: Part 10; OCT 28 (FR4's answers); OCT 26 ~L2666]
- Small: the sync line's "wired" label for the phone speaker; the party3 listen-check; the corner rings' brightness. Old conditionals: the date stone / the rooftop café lights / the squirrel "if still cheap → remove"; the empty tv-murmur slot (Freesound 475628 / 434508); the wall hush sign "for now"; PRISM vs PRISM DROP (→ the game-lineup talk); `deps/firebase-upgrade` unmerged. [night-a2.md; night-a.md; plan.md: Parts 5–8; OCT 26 (after WIN); OCT 25 ~L1748]

**Parked / deferred**
- The neon moon, TAP A WINDOW, SYNCHRONIZED DANCES (the breaks replace them), noctilucent clouds, riding the wheel, more daytime window moments; a TR-3B model re-search; Grok's taxi + police car models (cut from 9e). [plan.md: Parts 6–8; OCT 26 ~L2571; 9e.md]
- WELCOME MOMENTS' machinery (SKY builds the watcher; the ladder → Progression). The people / workers polish + the HOLIDAY POLISH pass (near the end). Game skins, MENUS 2.0, the game-list revamp, app stores + money (nothing decided). [plan.md: OCT 27–28 (after 9d); OCT 29 (the afternoon); After the city]

---

## 17. WALK-AWAY MODE — NOTHING DECIDED
The owner (9:29 pm): "don't make any decisions, we'll discuss it later" — his goal: "walk away and know it runs its own world". Claude's ideas
for that talk only: a C3 hardening step (fallbacks for every outside dependency, nothing tied to a year, pinned URLs, a MAINTENANCE.md) + a
monthly health check that needs no paid account ("I won't keep a Claude subscription forever": a GitHub scheduled workflow against the live
site + a free uptime monitor). Build nothing until he decides. [plan.md: WALK-AWAY MODE — TO DISCUSS LATER, NOTHING DECIDED]
