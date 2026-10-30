// CITY 2.0 — THE CITY SOUNDS: the slot registry (PURE; Part 8a — docs/audio.md#the-city-sounds). ONE list of every sound the
// city will ever make (the owner's CITY SOUNDS hunt list, docs/harbor/plan.md, grouped by the part that needs it): each a named
// SLOT with stable kebab-case id. A slot is FILLED when scripts/add-city-sfx.py has imported a recording for it (its takes are in
// city-sounds-files.js, generated — no network probe needed to know); an EMPTY slot is simply silent (audio/city-sound.js returns
// nothing and does nothing — never an error, never a placeholder beep). Every event that exists in the city already calls its
// slot (screens/harbor/sounds.js), so a recording dropped in later just starts sounding.
//   kind   'loop' — a bed that runs as long as its thing lasts (crossfaded into itself at runtime: the file holds the loop + a tail)
//          'once' — a one-shot; a slot may hold several TAKES (one picked at random, weighted, never the same twice running)
//   gain   the slot's mix level on top of the file's own loudness (the importer levels loops to −24 LUFS, one-shots to −20 LUFS)
//   by     what calls it today ('' = nothing yet: the part that builds its event wires it)
// Adding a sound = drop <slot>.wav (or <slot>-2.wav … for more takes; any common format) into ~/Downloads/city-sfx/ and run
// `~/.cache/neural-arcade/pyenv/Scripts/python -I scripts/add-city-sfx.py` (it trims, levels, encodes, registers + credits).
// A NEW slot = one row here (the importer reads the ids from this file).
import { FILES } from './city-sounds-files.js';

export const PARTS = [
  { id: '7', label: 'PART 7 · THE SPEAKEASY + THE RAID' },
  { id: '8', label: 'PART 8 · THE PROMENADE + THE CITY SCHEDULE' },
  { id: '9', label: 'PART 9 · SEASONS + WEATHER' },
  { id: 'tower', label: 'PART 9 · THE CONSTRUCTION TOWER' },
  { id: '10', label: 'PART 10 · PARTY NIGHTS + FIREWORKS' },
  { id: '11', label: 'PART 11 · THE HOLIDAYS' },
  { id: 'sky', label: '6b + THE SKY' },
  { id: 'legend', label: 'LEGENDARY EVENTS' },
];

// (o: extras — lp: a low-pass in Hz on a loop's voice, the highs softened at playback: FP, the water heard from the promenade)
const S = (id, part, kind, gain, what, by = '', o = null) => ({ id, part, kind, gain, what, by, ...(o || {}) });
export const SLOTS = [
  // ---- PART 7 — the speakeasy + the raid
  // (8P: filled — the owner's speakeasy + people sounds; their mix: one-shots −20 LUFS, loops −24, × the gain: a window's sound ≈ −43 …
  // −49 LUFS into the bus (felt, through glass), the club through the wall ≈ −44 / −42.4, the knock — the player's own tap — ≈ −36)
  S('club-murmur-calm', '7', 'loop', 0.1, 'a muffled club through a wall: a crowd’s murmur + laughter, low-passed 1 kHz (the jazz is our own music)', 'the bar open at night (7b: sounds.js#speakeasy, ducked under the music)'),
  S('club-murmur-party', '7', 'loop', 0.12, 'the party-night version: livelier, a brighter wall (1.4 kHz)', 'the bar open on a party night (7b)'),
  S('door-heavy', '7', 'once', 0.1, 'the hidden mirror door swinging open: its latch + a short wooden creak', 'the hidden MIRROR DOOR swinging open (7b: windows.js#sound)'),
  S('door-heavy-close', '7', 'once', 0.09, 'the mirror door swinging shut: a softened creak, the thud as it meets its frame at `hit` s', 'the mirror door shutting (8P: sounds.js#life — its thud on the moment’s close)'),
  S('bar-open', '7', 'once', 0.1, 'the bar heard through the open mirror door: chatter + glasses, ~7 s, faded in + out', 'the mirror door open (8P: sounds.js#life)'),
  S('glasses-clink', '7', 'once', 0.07, 'glasses clinking (three takes: two glasses, a table of three, a wine glass)', 'the toast at the bar (8P: sounds.js#life — on the clink)'),
  S('shop-bell', '7', 'once', 0.06, 'the barbershop door’s bell (three jingles)', 'the barbershop’s customers in + out, the first one at the opening (8P: sounds.js#life)'),
  S('scissors-snip', '7', 'once', 0.08, 'a barber’s scissors: 2–4 snips (four takes; all transient — the files sit at ≈ −28 LUFS, so a higher gain: ≈ −49 into the bus)', 'the haircuts (8P: sounds.js#life — now and then while the barber works)'),
  S('broom-sweep', '7', 'loop', 0.07, 'a broom sweeping, through the bar’s glass (3 am)', 'the bar’s last light, 3 → 4 am (8P: sounds.js#life)'),
  S('window-sash-up', '7', 'once', 0.05, 'a sash window pushed up (a juddering slide, a soft stop at `hit` s)', '(unused since POLISH 5: the wake no longer waters the window box)'),
  S('window-sash-down', '7', 'once', 0.05, 'a sash window let down (a short slide, the rail on the sill at `hit` s)', '(unused since POLISH 5)'),
  S('roller-blind', '7', 'once', 0.05, 'a roller blind going up', 'the upstairs wakes: the blind up (8P)'),
  // (FP3b — REAL DOORS: the speakeasy's unmarked side door swinging as someone walks through — empty until a recording is imported)
  S('street-door', '7', 'once', 0.08, 'a heavy 1920s street door of oak on iron hinges opening: the latch, a short creak', 'the speakeasy’s side door swinging open as someone walks through (FP3b: people.js#doorSounds; at night with bar-open’s burst)'),
  S('street-door-close', '7', 'once', 0.07, 'the same door swinging shut: a soft creak, the latch catching', 'the side door shutting behind them (FP3b: people.js#doorSounds)'),
  S('door-knock', '7', 'once', 0.16, 'THE SECRET KNOCK on the speakeasy’s door — knock … knock-knock … knock — then the peephole slot sliding open', 'tapping the door (ambience.js#knock; the synthesized knock if it were ever empty)'),
  S('cat-meow', '7', 'once', 0.1, 'the alley cat’s meow', 'the cat jumping up onto a sill + a tap on the cat (7b)'),
  S('cat-land', '7', 'once', 0.05, 'the cat landing (soft)', 'the cat landing on the sill + hopping down (8P: sounds.js#life)'),
  // (8b1: filled — Grok's second try, a house party's indistinct walla heard through the upstairs glass: 300 Hz–1.8 kHz, no word readable)
  S('tv-murmur', '7', 'loop', 0.08, 'a murmur of voices through the upstairs window (late night): indistinct walla, through glass (300 Hz–1.8 kHz)', 'the TV glow upstairs, ~10 pm → 3 am (7b: sounds.js#speakeasy)'),
  S('line-murmur', '7', 'loop', 0.05, 'the line at the speakeasy’s door: a few people murmuring, low-passed (no word readable)', 'the lobby line (8P: sounds.line(level))'),
  S('rooftop-party', '7', 'loop', 0.06, 'a party up on the roof, heard from the street (low-passed)', 'the rooftop guests (8P: sounds.rooftop(level))'),
  // (6b — the life + workers + wildlife sounds: the police cars cut from the 1929 Volvo's whole passes (as loud as the road's cars);
  // the siren + the whistle FAR + SOFT — low-passed, low gains: ≈ −47 / −49 LUFS into the bus, under a car)
  S('police-car-1920s', '7', 'once', 0.1, '1920s police cars: an old engine rolling in from far, by, and away (~40 s — the 1929 Volvo’s whole passes)'),
  S('siren-1920s', '7', 'once', 0.045, 'a soft distant 1920s siren wail, rising and falling (low-passed 1.8 kHz; two takes)'),
  S('police-whistle', '7', 'once', 0.035, 'a policeman’s whistle, far off (one blast, low-passed)'),
  // ---- PART 8 — the promenade, people, vehicles, the city schedule
  // (FP, the owner on her iPhone: "it sounds like you're right next to a lake" — 0.125 → 0.07 (−5.0 dB) + a 1.6 kHz low-pass (−4.8 LU
  // more, measured: the lapping's splashy highs were most of its loudness) ≈ −9.8 dB in all: a harbor quay heard from the promenade,
  // not a beach; the city hum leads the bed now)
  S('water-lapping', '8', 'loop', 0.07, 'harbor water lapping at the quay, far + soft', 'always, quietly under the city hum', { lp: 1600 }),
  // (POLISH 5: the hot-day hydrant — synthesized: scripts/build-synth-sfx.py)
  S('hydrant-spray', '8', 'loop', 0.075, 'an open fire hydrant: the stream’s hiss + its splash on the cobbles (synthesized)', 'the hot-day hydrant while it sprays (sounds.js#tick: hydrant)'),
  S('city-hum-day', '8', 'loop', 0.11, 'a distant city hum by day', 'by day (crossfades with the night hum on the darkness)'),
  S('city-hum-night', '8', 'loop', 0.09, 'a distant city hum at night (calmer, never silent)', 'at night (crossfades with the day hum on the darkness)'),
  S('traffic-far', '8', 'loop', 0.08, 'light far-off traffic — EMPTY: both tries were MODERN traffic (8b1: the second a continuous wash — its cut is ready in the importer)'),
  S('car-1920s-pass', '8', 'once', 0.1, 'a single 1920s car passing, far → near → far', 'the road’s cars (harbor().sounds.play / citySound — Part 8’s headlight sweeps)'),
  S('bus-brake-hiss', '8', 'once', 0.12, 'the bus’s air-brake hiss (an air brake is post-1920s: kept empty — bus-arrive brings it to a stop)'),
  // (8P — THE BUS: the 1945 Mercedes truck's own takes — its approach + stop, its idle, its slow pull-away — rather than the diesel
  // stand-ins; sounds.bus(event, o))
  S('bus-arrive', '8', 'once', 0.12, 'the bus coming up the street and stopping: settled into its idle at `hit` s', 'the bus arriving (8P: sounds.bus("arrive", { stopIn }))'),
  S('bus-idle', '8', 'loop', 0.1, 'the bus idling at the curb (a short engine loop)', 'the bus at the curb (8P: sounds.bus("idle"))'),
  S('bus-door', '8', 'once', 0.08, 'the bus’s door (an old truck door)', 'the door opening / closing (8P: sounds.bus("door"))'),
  S('bus-pull-away', '8', 'once', 0.12, 'the bus pulling away (revs, then slowly off, fading)', 'the bus leaving (8P: sounds.bus("depart"))'),
  // (8P — THE PEOPLE: very soft — the nearest walking figure's steps only, now and then a laugh from a group, the chestnut cart's bell)
  S('footsteps-cobble', '8', 'once', 0.03, 'one footstep on the cobbles (six takes)', 'the nearest walking figure (8P: sounds.step("cobble", o))'),
  S('footsteps-heels', '8', 'once', 0.03, 'one step in heels (six takes)', 'the nearest walking figure in heels (8P: sounds.step("heels", o))'),
  S('laugh-distant', '8', 'once', 0.04, 'a group laughing, distant (two takes)', 'a group of people (8P: sounds.laugh(o))'),
  S('cart-bell', '8', 'once', 0.05, 'the chestnut cart’s hand bell (one ring)', 'the cart, now and then (8P: sounds.cart({ on, pan }) / sounds.cartBell(o))'),
  S('ships-bell', '8', 'once', 0.14, 'the HOURLY SHIP’S BELL (one ring)'),
  S('church-bells', '8', 'once', 0.07, 'SUNDAY MORNING’s distant church bells (9e — far + soft: 9:00 + 10:45 on Sundays, sounds.js#life)'),
  // (8b2 — the owner: the boat whistle ~10 % louder: the noon whistle + Rosie's horn 0.16 → 0.18, +1 dB)
  S('steam-whistle', '8', 'once', 0.18, 'the NOON STEAM WHISTLE (a 1920s steamboat / factory; a steam engine’s whistle, low-passed)'),
  S('ship-horn', '8', 'once', 0.18, 'a big ship’s horn, distant (the 7 pm dinner cruise)'),
  S('gulls', '8', 'once', 0.11, 'a gull’s call, distant (several takes)', 'the gulls over the harbor by day: mostly one call, now and then two or three in a row (sounds.js#gullCalls)'),
  // (6b — the life + workers + wildlife sounds, Grok's Oct 24 set: filled, waiting for their events (8b's people + workers, the city
  // schedule) — soft: one-shots ≈ −46 … −49 LUFS into the bus, the market's bed ≈ −48)
  S('dog-bark', '8', 'once', 0.06, 'a friendly distant dog bark (a small dog far off: a double bark + a single, with their echo)'),
  S('market-murmur', '8', 'loop', 0.06, 'a farmers’ market murmur (Saturday morning; low-passed 1.4 kHz: no word readable)'),
  S('milk-bottles', '8', 'once', 0.05, 'milk bottles clinking (dawn; two takes)'),
  S('truck-delivery', '8', 'once', 0.12, 'a delivery truck (dawn)'),
  S('trash-truck', '8', 'once', 0.14, 'the trash truck (Monday) — EMPTY: the file was a modern diesel standing still (no arrival / departure to cut) — 8b1: see trash-truck-arrive / -depart'),
  // (8b1 — Grok's second try: an OLD large truck, no air brakes, no beeps — the weekday trash round's arrival + departure (Group 1 wires it))
  S('trash-truck-arrive', '8', 'once', 0.12, 'the trash truck coming in + stopping (an old truck: its pull-out played backwards into its idle; stopped at `hit` s)'),
  S('trash-truck-depart', '8', 'once', 0.12, 'the trash truck idling, revving + pulling away, fading off (the pull-out at `hit` s)'),
  S('trash-can-lid', '8', 'once', 0.05, 'a metal trash-can lid dropped + rattling (the trash round)'),
  S('crates-clink', '8', 'once', 0.05, 'a crate of bottles clinking (deliveries; three takes)'),
  S('newspaper-rustle', '8', 'once', 0.04, 'a newspaper opened (a reader on the bench)'),
  S('ladder-clank', '8', 'once', 0.05, 'a ladder set down / climbed: metal clanks (the lamplighter, the billposter; two takes)'),
  S('squeegee', '8', 'once', 0.04, 'a window washer’s squeegee squeaking on glass (four strokes)'),
  S('jogger-trip', '8', 'once', 0.05, 'a jogger tripping: a soft body-fall on the cobbles (`hit` = the landing)'),
  S('flag-flap', '8', 'loop', 0.08, 'the flag flapping in the wind'),
  S('boat-putter', '8', 'loop', 0.07, 'a small boat’s engine putting across the water (low-passed 1.8 kHz)', 'the water taxi while it crosses'),
  // (6b — the wildlife: soft, far)
  S('pigeon-flutter', '8', 'once', 0.04, 'pigeons fluttering up'),
  S('pigeon-coo', '8', 'once', 0.04, 'pigeons cooing (two takes)'),
  S('squirrel-chatter', '8', 'once', 0.035, 'a squirrel chattering in a tree'),
  S('coyote-howl', '8', 'once', 0.04, 'coyotes howling far off (late night; two takes)'),
  S('coyote-yip', '8', 'once', 0.035, 'a coyote’s yips, distant (three takes)'),
  // ---- PART 9 — seasons + weather
  S('birdsong-morning', '9', 'loop', 0.08, 'morning birdsong (spring / summer)'),
  S('crickets-night', '9', 'loop', 0.07, 'summer-night crickets'),
  S('wind-leaves', '9', 'loop', 0.08, 'autumn wind through leaves'),
  S('wind-winter', '9', 'loop', 0.08, 'winter wind'),
  S('snow-hush', '9', 'loop', 0.06, 'snow’s muffled hush', '9b: while snow lies at night (sounds.js THE WEATHER)'),
  // (9b — THE WINTER WORK + PLAY: the doorman's shovel at the steps; the plow's blade on the road, the salt off the spinner, footsteps in
  // the snow — each slot waits for its recording, silent until then)
  S('snow-shovel', '9', 'loop', 0.07, 'a snow shovel scraping + tossing (the doorman at the steps, the shoveller on the walk)', '9b: winterfolk.js — while someone shovels'),
  S('plow-scrape', '9', 'loop', 0.08, 'a plow blade scraping the road + the truck’s engine', '9b: the plow on the waterside road'),
  S('salt-spread', '9', 'loop', 0.05, 'salt hissing off a spinner onto the road', '9b: the salt truck'),
  S('snow-steps', '9', 'loop', 0.04, 'footsteps crunching in fresh snow', '9b: fresh snow + people walking'),
  S('foghorn', '9', 'once', 0.14, 'a distant FOGHORN (real fog)', 'the lighthouse in real fog: every ~40–80 s'),
  S('rain-pavement', '9', 'loop', 0.1, 'rain on the pavement'),
  S('rain-water', '9', 'loop', 0.09, 'rain on the water'),
  // (9a — THE WEATHER's beds by where you "stand": the awning close, the pavement, the water far; the thunder after its flash; the gutter after the rain)
  S('rain-drizzle', '9', 'loop', 0.08, 'a light drizzle'),
  S('rain-awning', '9', 'loop', 0.08, 'rain drumming on the awning (close)'),
  S('thunder-far', '9', 'once', 0.16, 'distant thunder rolling (two takes)', 'after the lightning, delayed by its distance'),
  S('gutter-drip', '9', 'loop', 0.06, 'drips from the gutter + the eaves after the rain'),
  // ---- PART 9 — the construction tower
  // (9g — the owner: the siren "louder … carries over the music like a real distant air-raid siren, still far off": 0.07 → 0.16 (+7 dB),
  // the music dipped under it (sounds.js#ducked); the horn's three takes are the panel's HORN A / B / C (&horn=a|b|c — core: hornTake))
  S('tower-siren', 'tower', 'once', 0.176, 'the demolition’s warning siren — one slow distant wail (9f: craigsmith, CC0)'),
  S('tower-horn', 'tower', 'once', 0.14, 'the warning horn blasts (A: craigsmith’s destroyer horn · B: the old warning horn · C: synthesized compressed air)'),
  S('implosion-charges', 'tower', 'once', 0.16, 'the implosion’s charges'),
  S('implosion-rumble', 'tower', 'once', 0.16, 'the long rumble as it comes down'),
  S('hammering', 'tower', 'loop', 0.07, 'distant hammering'),
  S('crane', 'tower', 'loop', 0.07, 'a crane at work'),
  // (9g — the owner: "short, infrequent bursts … it almost sounds like a bug in the background": a ONE-SHOT of four 1.5–4 s bursts,
  // fired now + then (sounds.js: a couple a minute at most, long seeded gaps), louder: −20 LUFS × 0.075 ≈ −42.5 LUFS, a touch over the
  // hammering bed's −24 × 0.07 ≈ −47)
  S('rivet-gun', 'tower', 'once', 0.075, 'a rivet gun on the steel — short bursts now + then over the hammering (9g: four takes)', 'the site by day while the hammering plays (sounds.js — rivetDue)'),
  S('crane-lift', 'tower', 'once', 0.06, 'a period crane lifting a big load — now + then over the crane (9f)'),
  // ---- PART 10 — party nights + fireworks
  S('firework-launch', '10', 'once', 0.12, 'a firework’s launch whoosh'),
  S('firework-burst', '10', 'once', 0.14, 'a firework bursting (near)', 'the party’s finale (the synthesized burst until it’s filled)'),
  S('firework-burst-far', '10', 'once', 0.1, 'a firework bursting far off'),
  S('firework-crackle', '10', 'once', 0.1, 'crackle / glitter after a burst'),
  S('crowd-cheer', '10', 'once', 0.12, 'a crowd cheering (the fireworks, the NYE countdown)'),
  // (6b — THE DANCE CIRCLE heard, quiet: the wands' swish on a few big moves, a burst of clapping while the watchers clap, a rare whoop)
  S('glow-wand-swish', '10', 'once', 0.03, 'a glow wand swished through the air (four takes)', 'a few dancers’ big moves in the dance circle (people.js#danceSounds — on the beat, quiet)'),
  S('crowd-clap', '10', 'once', 0.04, 'a few people clapping + cheering round the dance circle (low-passed 3 kHz; three takes)', 'the circle’s watchers clapping (people.js#danceSounds — every ~18–40 s)'),
  S('crowd-whoop', '10', 'once', 0.04, 'a whoop + a little applause (low-passed 4 kHz)', 'the dance circle, rarely (people.js#danceSounds — a new phrase, ≥ 60 s apart)'),
  // ---- NIGHT-B — THE STREET PARTY's CROWD (the owner's party-crowd folder, Oct 29: copies only — docs/audio.md#the-street-partys-crowd):
  // the walla beds under the pockets (their level the crowd's size + the party's curve, panned where they stand: core/harbor-streetparty.js
  // via people.js#crowdSounds), one-shots from the pockets' own places — quiet, felt not heard; the cheers rise as a dance break starts
  S('party-walla', '10', 'loop', 0.06, 'the street party’s walla: a real outdoor patio party (German, no word readable), low-passed 2.8 kHz — across the street', 'the party night’s pockets (people.js#crowdSounds)'),
  S('party-walla-b', '10', 'loop', 0.045, 'a second, denser walla (an exterior crowd of adults, Spanish) under it at the peak (tier 1 +)', 'the party’s peak (people.js#crowdSounds)'),
  S('party-laugh', '10', 'once', 0.04, 'a burst of laughter from a group (six takes, low-passed 4 kHz)', 'a mingling pocket, every ~4–12 s (people.js#crowdSounds)'),
  S('party-cheer', '10', 'once', 0.05, 'a small crowd cheering (two takes, low-passed 4 kHz)', 'a dance break starting (people.js#crowdSounds)'),
  S('party-clink', '10', 'once', 0.035, 'glasses clinking in a toast (three takes)', 'a drinker in a pocket, in little clusters (people.js#crowdSounds)'),
  S('party-group', '10', 'once', 0.04, 'a closer group talking + laughing (two takes, low-passed 3 kHz: no word readable)', 'the nearest talking pocket, now + then (people.js#crowdSounds)'),
  S('party-yacht-music', '10', 'loop', 0.1, 'the party yacht’s music across the water'),
  S('helicopter-landing', '10', 'once', 0.14, 'a helicopter landing (on the party yacht)'),
  // ---- 6b + THE SKY (Oct 24: filled. The aircraft are FLYBYS — one-shots with their own swell, chained take after take while
  // their thing is up (harbor/sounds.js#run), panned with it. Their mix (each file's LUFS × its gain) — SP2, the owner: LOUDER, clearly
  // heard over the music yet still distant (low-passed takes; the player's peak cap): the jets, the helicopter + the burner +6 dB (≈ the
  // day hum's −43.6 LUFS: −43 to −43.5), the airliners, the banner plane, the geese + the drone hum +3.5 dB (an airliner ≈ −49.3, the
  // banner plane ≈ −46.5, the swarm ≈ −51.5) — and ducked with the bed under the music (bedMix's k))
  S('helicopter', 'sky', 'once', 0.117, 'a helicopter, distant + a flyby (two takes)', 'the helicopter while it’s up: its flybys chained, panned with it, louder while it hovers'),
  S('airliner-far', 'sky', 'once', 0.051, 'an airliner far up (a long, slow flyby)', 'the airliners while one crosses (the nearest: its flyby from the start of its crossing, panned, swelling with it)'),
  S('prop-plane', 'sky', 'once', 0.071, 'a vintage prop plane overhead (two swells: a plane circling)', 'the banner plane, the skywriters'),
  // (FP3b, the owner's 8P note 10 — "sound great, a bit louder still": +3 dB (0.14 → 0.198) + a slightly deeper dip of the music (−3.6 →
  // −5 dB); the peaks still under the player's cap — audio/city-sound.js#CAP)
  S('jet-flyby', 'sky', 'once', 0.198, 'jets flying by right → left (the air show) — REALLY loud: the music ducks for the pass (`duck`)', 'the jets’ pass (8P: sounds.jets(o) — panned right → left over its swell, the music dipped ~5 dB round its peak)', { duck: 0.56 }),
  S('balloon-burner', 'sky', 'once', 0.111, 'a hot air balloon’s burner whoosh, far off (five bursts, low-passed)', 'the balloons while they’re up: a burn every ~6–18 s'),
  S('geese', 'sky', 'once', 0.075, 'a skein of geese honking overhead (~28 s: one crossing)', 'the geese while a V crosses: one flyover a V, panned with it'),
  // (11a-2 — a SHORT V passing over (5.2 s: the honks swell + fade, its fades baked in) — a moment, not a crossing: mono, so the caller
  // pans it L → R with the V (run('geese-v', g, panX(x), { chain: false }) or the handle's set({ pan }, ramp)); ~4 dB under the cheer)
  S('geese-v', 'sky', 'once', 0.06, 'a V of geese passing over: a few honks swelling + fading (5.2 s, low-passed 4 kHz, a hall)', ''),
  // (POLISH 4, the owner: "the drones have NO SOUND" — at −51.5 LUFS under the music's duck it was never heard: +7.4 dB (0.064 → 0.15),
  // a soft hum under the helicopter, clearly there while the fleet flies)
  S('drone-swarm', 'sky', 'loop', 0.15, 'the drone show’s soft swarm hum (five quadcopters layered + detuned, low-passed)', 'the drone show while it flies'),
  // (9g — THE UFO's REAL SOUNDS (Grok's brief, the owner: "too beautiful not to have some sound effects"): before, a 0.06 hum (≈ −48 LUFS
  // into the bus, its energy under 150 Hz — nothing a phone plays) + one riser. Now the whole film: the hover (A / B: &hum=), its
  // spin-up + spin-down, the beam's activation + idle + stop, the lift, the departure (A / B / LAYERED: &depart=), the crowd fleeing.
  // Levels against the music's dip + muffle while the craft is here (core/harbor-legend.js#ufoAt: 0.42 + a 900 Hz low-pass): the beds
  // ≈ −38 LUFS, the one-shots ≈ −36 … −39 — the mid-range carried (each take checked through a 300 Hz–8 kHz phone band, docs/audio.md#9g)
  S('ufo-hum', 'sky', 'loop', 0.2, 'the UFO’s hover: a pulsing engine throb (A: the hover engine, 1.54 Hz · B: BlueZone’s 1.0 Hz throb, harmonics added)', 'the abduction while the craft is here (sounds.js#legendSounds)'),
  S('ufo-hum-up', 'sky', 'once', 0.16, 'the hover engine spinning up (5 s)', 'the craft arriving (hum A)'),
  S('ufo-hum-down', 'sky', 'once', 0.12, 'the hover engine spinning down (8 s)', 'the craft leaving, under the departure (hum A)'),
  S('ufo-beam', 'sky', 'once', 0.1, 'the abduction beam (a riser, its peak ~6 s in) — 9g: replaced by ufo-beam-on / idle / off + ufo-lift', ''),
  S('ufo-beam-on', 'sky', 'once', 0.13, 'the tractor beam switching on (a 4 s activation)', 'the beam opening (5.3 s in)'),
  S('ufo-beam-idle', 'sky', 'loop', 0.13, 'the tractor beam held: a 246 Hz tone + a slow throb, a slight warble', 'the beam while it’s open'),
  S('ufo-beam-off', 'sky', 'once', 0.13, 'the tractor beam switching off', 'the beam closing (21.6 s in)'),
  S('ufo-lift', 'sky', 'once', 0.15, 'the figure rising up the beam: a flutter riser bending up, an airy top', 'the last 6 s of the lift (peaks as he’s taken)'),
  S('ufo-depart', 'sky', 'once', 0.2, 'the craft shooting away (A: a falling flyby · B: a fast pass-by whoosh; LAYERED: both)', 'the craft leaving (24.4 s in)'),
  S('crowd-flee', 'sky', 'once', 0.085, 'a distant muffled crowd fleeing in fright (wordless) + quiet running steps', 'the witnesses scattering as the beam opens (only with people on the promenade)'),
  S('tr3b-drone', 'sky', 'loop', 0.08, 'the TR-3B’s deep drone (low-mids kept: a phone still hears it)'),
  S('tr3b-crackle', 'sky', 'once', 0.1, 'electrical crackle (an electric arc + its reverb, ~3.6 s)'),
  S('tr3b-power-down', 'sky', 'once', 0.12, 'the power-down (the blackout): the hum cut dead with a thump at `hit` s, a turbine winding down'),
  // (8b1 — the TR-3B HEARD ON A PHONE (Grok's second try): its electromagnetic presence (saturated so its harmonics carry it), the city's
  // power spinning down as the lights die, a tube hum swelling back as the power stutters on — each checked through a phone-speaker
  // filter (HPF 200 Hz + LPF 4 kHz) against the drained music: docs/audio.md#8b1)
  S('tr3b-presence', 'sky', 'loop', 0.22, 'the TR-3B’s presence: a real electromagnetic hum, saturated (its harmonics carry it on a phone), ominous', 'the TR-3B while it crosses (sounds.js#legendSounds)'),
  S('power-failure', 'sky', 'once', 0.2, 'the city’s power failing: a big machine spinning down (~9 s)', 'the TR-3B’s blackout as the lights die (sounds.js#legendSounds)'),
  S('power-restore', 'sky', 'once', 0.2, 'the power coming back: a tube hum swelling up (~9 s, saturated + a high-passed layer for a phone)', 'the lights stuttering back after the jets (sounds.js#legendSounds)'),
  S('witch-cackle', 'sky', 'once', 0.1, 'a witch’s cackle (Halloween)', 'the witch crossing the moon (11a-1: witch.js)'),
  // (11a-1 — HALLOWEEN: the haunted wind under Halloween night; the black cat's hiss when tapped — synthesized, scripts/build-synth-sfx.py)
  S('haunted-wind', '11', 'loop', 0.05, 'a haunted wind: a hollow moaning wind through the streets (Halloween night)', 'Halloween night, low under the city (sounds.js#holiday)'),
  S('cat-hiss', '11', 'once', 0.12, 'a cat’s hiss: a sharp breathy spit + hold (synthesized)', 'the black cat on the speakeasy’s step, tapped (11a-1)'),
  // (11a-2 — THANKSGIVING + THE PARADE: heard from across the street (low-passed + a hall, never brighter). Grok's brief: beds at −30
  // LUFS, one-shots at −20 — the files keep the house levels (−24 / −20), so the brief's balance is in these gains: the beds 0.05 =
  // 10 dB under the cheer's 0.1 (≈ −50 LUFS into the bus, the market's / the line's family); the band a ONE-SHOT (a 90 s pass:
  // chain it while the parade runs — run('parade-band', g, pan) — a looped march would blend two bars at its seam) at −20 LUFS
  // × 0.032 = the beds' −50)
  S('parade-crowd', '11', 'loop', 0.05, 'the parade crowd across the street: kids cheering + clapping over an adult murmur 4.5 LU under (one loop; de-essed, low-passed 6 / 3 kHz: no word readable)', ''),
  S('parade-cheer', '11', 'once', 0.1, 'a crowd’s big cheer as a float passes, far back (a stadium surge folded from 5.1, 8.5 s)', ''),
  S('parade-band', '11', 'once', 0.032, 'a brass band two blocks away: the US Marine Band’s 1923 "Washington Post March" from a 78, a 90 s pass (2 s in, 4 s out; the crackle’s trace kept, low-passed 3.5 kHz)', ''),
  S('balloon-flap', '11', 'loop', 0.05, 'a giant parade balloon’s fabric flapping in the wind (a big flag, low-passed 7 kHz)', ''),
  S('leaves-rake', '11', 'loop', 0.05, 'someone raking leaves: a stroke every ~1.5 s (an 18 s loop, a short street hall)', ''),
  S('sleigh-bells', 'sky', 'once', 0.1, 'sleigh bells (Christmas)'),
  // ---- LEGENDARY EVENTS
  S('ghost-ship-creak', 'legend', 'loop', 0.08, 'the ghost ship: creaking wood'),
  S('ghost-bell', 'legend', 'once', 0.12, 'the ghost ship’s ghostly bell'),
  S('monster-splash', 'legend', 'once', 0.16, 'the harbor monster’s big splash'),
  // (POLISH 5 — the owner: ONE realistic sonar ping as the periscope breaks the surface; synthesized — scripts/build-synth-sfx.py; played
  // DUCKED over the music (sounds.js#periscope: a brief dip so it cuts through, never a startle) by the periscope's legendary when it lands)
  S('periscope-ping', 'legend', 'once', 0.15, 'a submarine sonar ping: a clean ~1.25 kHz ping + a long underwater echo (~3.6 s), mid-range (synthesized)', 'the periscope breaking the surface (the legendary egg, a later part): sounds.js#periscope'),
];

const BY_ID = new Map(SLOTS.map(s => [s.id, s]));
export const slotOf = id => BY_ID.get(id) || null;
/** the recorded takes of a slot ([] = empty: silent) — each { f, d, v, w?, loop?, xf?, peak?, lufs, src } */
export const takesOf = id => (BY_ID.has(id) && Array.isArray(FILES[id]) ? FILES[id] : []);
export const isFilled = id => takesOf(id).length > 0;
/** 9g — a take by its SOURCE's name (the registry's order follows the imports) → its index, or null */
export function takeBySrc(id, src) { const i = takesOf(id).findIndex(t => t.src === src); return i < 0 ? null : i; }
/** 9g — THE PANEL's A / B / C picks (the owner decides by ear): &horn= (the implosion's warning horn), &hum= (the UFO's hover),
 *  &depart= (the UFO leaving; 'layered' = A + B at once). The first of each is the default (today's horn; the brief's picks) */
export const SOUND_PICKS = Object.freeze({
  // (PROM — the owner's picks, Oct 28: HORN B (warning-horn), HUM A, DEPART LAYERED are the DEFAULTS (`def`); the rest stay as alternates)
  horn: Object.freeze({ slot: 'tower-horn', def: 'b', a: 'tower-horn-2', b: 'warning-horn', c: 'tower-horn-3' }),
  hum: Object.freeze({ slot: 'ufo-hum', def: 'a', a: 'ufo-hum-2', b: 'ufo-hum-3' }),
  depart: Object.freeze({ slot: 'ufo-depart', def: 'layered', a: 'ufo-depart', b: 'ufo-depart-2', layered: null }),
});
/** 9g — THE RIVET GUN's gaps (s) after burst n (seed: the page's own start — irregular, never a beat): mostly 20–50 s of quiet, now +
 *  then (1 in 4) a quick second burst 3–7 s on — a riveter driving a few rivets, then moving along. Mean ≈ 28 s: a couple a minute at most */
export function rivetGap(seed, n) {
  let h = (Math.floor(seed * 1000) ^ Math.imul(n + 1, 0x9e3779b1)) >>> 0;
  const r = () => { h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0; return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
  return r() < 0.25 ? 3 + 4 * r() : 20 + 30 * r();
}
/** a pick's value ('a' | 'b' | 'c' | 'layered' | anything else = the pick's default, `def`) → [take index …] in its slot (null entries dropped) */
export function pickTakes(kind, v) {
  const P = SOUND_PICKS[kind]; if (!P) return [];
  const key = v && Object.prototype.hasOwnProperty.call(P, v) && v !== 'slot' && v !== 'def' ? v : P.def || 'a';
  const srcs = key === 'layered' ? [P.a, P.b] : [P[key]];
  return srcs.map(src => takeBySrc(P.slot, src)).filter(i => i != null);
}
/** the slots with something in them / still waiting for a recording */
export const filledSlots = () => SLOTS.filter(s => isFilled(s.id)).map(s => s.id);

/** a take of a slot: weighted at random (w, default 1), never the same as `last` when there is another → { take, i } or null */
export function pickTake(id, rnd = Math.random, last = -1) {
  const t = takesOf(id);
  if (!t.length) return null;
  if (t.length === 1) return { take: t[0], i: 0 };
  // (9f: a take of weight 0 is a BACKUP — kept, never picked while another take is there)
  const live = t.map((_, i) => i).filter(i => (t[i].w ?? 1) > 0);
  if (live.length === 1) return { take: t[live[0]], i: live[0] };
  const idx = (live.length ? live : t.map((_, i) => i)).filter(i => i !== last);
  const tot = idx.reduce((a, i) => a + (t[i].w ?? 1), 0);
  let r = rnd() * tot;
  for (const i of idx) { r -= t[i].w ?? 1; if (r < 0) return { take: t[i], i }; }
  const i = idx[idx.length - 1];
  return { take: t[i], i };
}

/** the registry's own checks (city-sounds.test.mjs): [] = fine */
export function checkSlots() {
  const bad = [], seen = new Set(), parts = new Set(PARTS.map(p => p.id));
  for (const s of SLOTS) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) bad.push(`id:${s.id}`);
    if (seen.has(s.id)) bad.push(`dup:${s.id}`); seen.add(s.id);
    if (!parts.has(s.part)) bad.push(`part:${s.id}:${s.part}`);
    if (s.kind !== 'loop' && s.kind !== 'once') bad.push(`kind:${s.id}`);
    if (!(s.gain > 0 && s.gain <= 1)) bad.push(`gain:${s.id}`);
    if (!s.what) bad.push(`what:${s.id}`);
    if (s.lp != null && !(s.kind === 'loop' && s.lp >= 200 && s.lp <= 16000)) bad.push(`lp:${s.id}`);
    if (s.duck != null && !(s.kind === 'once' && s.duck >= 0.4 && s.duck < 1)) bad.push(`duck:${s.id}`);
  }
  for (const [id, takes] of Object.entries(FILES)) {
    const s = BY_ID.get(id);
    if (!s) { bad.push(`files:unknown-slot:${id}`); continue; }
    for (const t of takes) {
      if (!t || typeof t.f !== 'string' || !/^[a-z0-9_.-]+\.(mp3|m4a|wav)$/.test(t.f)) bad.push(`files:${id}:name`);
      if (!(t.d > 0)) bad.push(`files:${id}:${t.f}:d`);
      if (s.kind === 'loop' && !(t.loop > 1 && t.xf > 0 && t.loop + t.xf <= t.d + 0.05)) bad.push(`files:${id}:${t.f}:loop`);
      if (t.w != null && !(t.w >= 0)) bad.push(`files:${id}:${t.f}:w`);   // (9f: 0 = a BACKUP take, kept, never picked)
      if (s.kind === 'once' && t.sw != null && !(Array.isArray(t.sw) && t.sw[0] >= 0 && t.sw[0] <= t.peak && t.peak <= t.sw[1] && t.sw[1] <= t.d)) bad.push(`files:${id}:${t.f}:sw`);
      if (t.hit != null && !(t.hit > 0 && t.hit < t.d)) bad.push(`files:${id}:${t.f}:hit`);
    }
  }
  return bad;
}

// ---------------------------------------------------------------- FP — THE BED'S MIX + THE GULLS (the owner listened on her iPhone)
// The bed (the water + the city hum) sits UNDER the music: while the music is ON (wanted: not off, not muted, its slider up) the
// whole bed is ducked by BED_DUCK; with the music OFF it is the main sound, at its own (calm) level. It never comes in before the
// music: with the music on, the bed waits for the song to really sound (at most BED_WAIT_MS after audio unlocks — a song that
// can't load never keeps the city silent), then fades in slowly (BED_FADE_IN s) — the city never starts louder than the music.
export const BED_DUCK = 0.71;           // −3 dB while the music is on (the bed then ~18 dB under the default music)
export const BED_WAIT_MS = 6000;
export const BED_FADE_IN = 5;           // s
export const BED_RAMP = 3;              // s: music switched on / off → the bed eases to its new level
/** the bed's level now: { k (× every bed slot's gain), hold (true = don't START the bed yet) } — started: whether it ever began */
export function bedMix({ musicOn = false, sounding = false, sinceMs = 0, started = false } = {}) {
  if (!musicOn) return { k: 1, hold: false };
  return { k: BED_DUCK, hold: !started && !sounding && sinceMs < BED_WAIT_MS };
}
/**
 * THE GULLS — one "moment": mostly ONE call, now and then two or three in a row (the takes differ: pickTake never repeats one), each
 * its own small level / pitch / pan, the gaps between them natural and uneven. → [{ delay (s from now), gain, rate, pan }]
 */
export function gullCalls(rnd = Math.random, pan = 0) {
  const r = rnd(), n = r < 0.66 ? 1 : r < 0.9 ? 2 : 3;
  const out = [];
  let t = 0;
  for (let i = 0; i < n; i++) {
    out.push({ delay: +t.toFixed(3), gain: +(0.5 + rnd() * 0.5).toFixed(3), rate: +(0.95 + rnd() * 0.1).toFixed(3), pan: Math.max(-0.85, Math.min(0.85, pan + (rnd() - 0.5) * 0.3)) });
    t += 0.35 + rnd() * rnd() * 1.1 + (rnd() < 0.25 ? 0.6 : 0);     // (calls overlap their tails: a gull answering, never a beat)
  }
  return out;
}
/** ms until the next gull moment: 14–66 s, skewed toward the shorter end, fewer when fewer gulls fly (g 0..1); a burst of three
 *  rests a little longer — random every time, never a rhythm */
export function gullGap(g = 1, rnd = Math.random, calls = 1) {
  const k = Math.max(0.5, Math.min(1, g));
  return Math.round((14000 + 52000 * Math.pow(rnd(), 1.4)) / k + (calls >= 3 ? 8000 : 0));
}

// ---------------------------------------------------------------- FP3 — A PASS IN SYNC: the motorcar + its sound (the owner's iPhone:
// "the sound came 5–6 s after the car had passed"). The car is drawn on the city's clock (nearest at the pass's centre); its sound
// used to start whenever its file had been fetched + decoded after the pass began — every ms of that wait (a fresh fetch each new
// take, iOS's decode) put the sound behind the car. Now the sound is placed ON THE CLOCK when its buffer is ready: its take's
// PEAK (the loudest 0.3 s of its RMS envelope, measured by the importer) lands on the car's centre, wherever the wait ended —
// joining part-way with a fade when the buffer came late, silent when the car has already passed (never out of sync). The take is
// the pass's own (the same on every phone: takeAt), the car's speed comes from its take's SWELL (it crosses the visible street
// within the audible rise and fall), and the sound pans gently with the car's x.
export const CAR_CROSS = Object.freeze([2.6, 7]);      // s: the car's crossing of the visible street (entering → leaving) — its take's swell, within
export const CAR_LEAD = 1.5;                            // s: the sound starts this long before the car enters
export const CAR_PAN = 0.6;                             // the pan's ceiling (gentle: never hard left / right)
/** a take picked by a number u in 0..1 (weighted like pickTake — but the SAME on every phone: the pass's `take` from the clock)
 *  → { take, i } or null (an empty slot) */
export function takeAt(id, u) {
  const t = takesOf(id);
  if (!t.length) return null;
  const tot = t.reduce((a, x) => a + (x.w ?? 1), 0);
  let r = Math.max(0, Math.min(0.999999, +u || 0)) * tot;
  for (let i = 0; i < t.length; i++) { r -= t[i].w ?? 1; if (r < 0) return { take: t[i], i }; }
  return { take: t[t.length - 1], i: t.length - 1 };
}
/** the car's crossing of the visible street for a take (s): its swell's width, within CAR_CROSS; null = no take (the old speed) */
export function crossFor(take) {
  if (!take || !Array.isArray(take.sw)) return null;
  return Math.max(CAR_CROSS[0], Math.min(CAR_CROSS[1], take.sw[1] - take.sw[0]));
}
/** how much of a take plays before its peak for the car (s): from just before the car enters (CAR_LEAD) */
export const carPre = cross => (cross == null ? Infinity : cross / 2 + CAR_LEAD);
/**
 * Where to start a take so its PEAK sounds `peakIn` s from now (PURE): { delay (s from now), offset (s into the take), fade (s,
 * 0 = the take's own start) } — or null when it's too late (the peak is under `late` s away: silence beats a sound out of sync).
 * pre: at most this many s of the take before its peak (the head before that is skipped, faded in).
 */
export function syncStart(take, peakIn, { pre = Infinity, fade = 0.8, late = 1 } = {}) {
  if (!take || !Number.isFinite(peakIn)) return null;
  const peak = Math.max(0, Math.min(take.d ?? Infinity, take.peak ?? 0));
  const head = Math.min(peak, Math.max(0, pre));
  const startIn = peakIn - head;
  if (startIn >= 0) return { delay: +startIn.toFixed(4), offset: +(peak - head).toFixed(4), fade: head < peak - 0.01 ? fade : 0 };
  if (peakIn < late) return null;
  return { delay: 0, offset: +(peak - peakIn).toFixed(4), fade };
}
/** the pan of a sound at x (world) where the visible street is ±half wide at its depth: gentle, smooth, ±max (CAR_PAN) */
export const panOf = (x, half, max = CAR_PAN) => +(max * Math.tanh(x / Math.max(1e-6, half))).toFixed(4);

// ---------------------------------------------------------------- THE SKY's flybys (harbor/sounds.js#run)
/** a flyby chained while its thing is up: the next take starts when the one playing has `xf` s left (its baked fade-out overlaps
 *  the next one's fade-in) — elapsed / dur in s (dur: the take's length ÷ its rate) */
export const chainDue = (elapsed, dur, xf = 2.5) => elapsed >= Math.max(0.5, dur - xf);

// ---------------------------------------------------------------- 8P — THE JETS' DUCK (the owner: the F-16s REALLY loud, the music
// never overpowered): a slot with `duck` (its level, linear) dips the MUSIC round its take's peak, like a real flyover — eased down
// DUCK_IN s before the peak (over DUCK_ATTACK s), held DUCK_HOLD s past it, eased back over DUCK_RELEASE s (≈ 3 s in all). The jets'
// own peak stays under the player's cap (audio/city-sound.js#CAP): loud, never a startle.
export const DUCK_IN = 1.4, DUCK_ATTACK = 0.8, DUCK_HOLD = 1.2, DUCK_RELEASE = 2;
/** the music's level (1 = untouched) `el` s into a take that ducks to `depth` round its peak (PURE) */
export function duckAt(el, take, depth) {
  if (!take || !(depth > 0 && depth < 1) || !Number.isFinite(el)) return 1;
  const pk = take.peak ?? 0, a = pk - DUCK_IN, b = a + DUCK_ATTACK, c = pk + DUCK_HOLD, d = c + DUCK_RELEASE;
  if (el <= a || el >= d) return 1;
  const k = el < b ? (el - a) / DUCK_ATTACK : el <= c ? 1 : 1 - (el - c) / DUCK_RELEASE;
  return +(1 - (1 - depth) * k).toFixed(4);
}
/** POLISH 4 — THE JETS IN SYNC (jet-flyby, jets-formation.mp3 — its loudness measured in 0.2 s windows: the roar's plateau
 *  3.8 → 5.6 s, its middle 4.8): `at` the moment placed where the jets cross the screen's centre, `pre` s of the take kept before it
 *  (it starts ~0.6 s before they enter — the head's quiet build trimmed), a short `fade` in, joined part-way unless under `late` s
 *  from the peak (then silent: a roar after they've gone is worse than none) */
export const JET_SYNC = Object.freeze({ at: 4.8, pre: 2.2, fade: 0.25, late: 0.35 });
/** the jets' pan from their place on the screen (x: 0 = the left edge … 1 = the right), gentle at the edges */
export const jetPan = x => +Math.max(-0.85, Math.min(0.85, ((Number.isFinite(x) ? x : 0.5) - 0.5) * 1.7)).toFixed(3);
/** the jets' pan over their pass: right → left across the take's swell (the recording's own direction), ±`w` */
export function sweepPan(el, take, w = 0.55, dir = -1) {
  if (!take || !Array.isArray(take.sw)) return 0;
  const [a, b] = take.sw, k = Math.max(0, Math.min(1, (el - a) / Math.max(0.1, b - a)));
  return +(-dir * w + dir * 2 * w * k).toFixed(3);
}

// ---------------------------------------------------------------- 8P — THE SPEAKEASY'S MOMENTS, HEARD (core/harbor-moments.js#MOMENTS)
// Each window moment's sounds, placed where its painter (screens/harbor/windows.js#PAINT) shows them: `p` = the moment's progress
// (el / len); hit: true = the take's `hit` (its latch, its thud, the sash's stop — measured by the importer) lands on `p`, else
// the take STARTS at `p`. The moment's first sound (the mirror door's opening, the cat's meow) is windows.js#sound's, at its start.
// Pans: the speakeasy's corner, left.
export const MOMENT_CUES = Object.freeze({
  // the clink over the middle (patrons(): the glasses meet at p 0.33–0.44)
  toast: [{ slot: 'glasses-clink', p: 0.38, hit: true, gain: 0.9, pan: -0.5 }],
  // the blind rolls up (p 0.02–0.16) (POLISH 5: the window box is gone — no watering, so no sash up + down)
  wake: [{ slot: 'roller-blind', p: 0.02, gain: 0.8, pan: -0.58 }],
  // the leap up lands on the sill (p 0.07); the hop down lands behind it (p 0.98), softer
  cat: [{ slot: 'cat-meow', p: 0.01, gain: 0.7, pan: -0.6 }, { slot: 'cat-land', p: 0.07, hit: true, gain: 0.7, pan: -0.6 }, { slot: 'cat-land', p: 0.98, hit: true, gain: 0.45, pan: -0.6 }],
  // NIGHT-A2 (the owner, Oct 29 7:12 pm): THE MIRROR DOOR IS SILENT — it swings INSIDE the barbershop, behind its glass: the street
  // can't hear its creak, its thud or the bar beyond it (FP3a's door-heavy open + 8P's bar burst + the close's thud — all gone; the
  // motion stays). The slots stay filled (door-heavy*, bar-open: the speakeasy's SIDE door onto the street still uses bar-open)
  mirror: [],
  // the opening: the first customer through the door (p 0.48), the first snips (from p 0.74)
  'shop-open': [{ slot: 'shop-bell', p: 0.48, gain: 0.9, pan: -0.45 }, { slot: 'scissors-snip', p: 0.77, gain: 0.8, pan: -0.45 },
    { slot: 'scissors-snip', p: 0.9, gain: 0.7, pan: -0.45 }],
});
/** a moment's cues still to come, `el` s into it (PURE): [{ slot, in (s from now until its mark), mark: 'hit' | 'start', gain, pan }]
 *  — a cue more than `late` s past is dropped */
export function momentCues(id, el, len, late = 0.3) {
  const out = [];
  for (const c of MOMENT_CUES[id] || []) {
    const at = c.p * len - el;
    if (at < -late) continue;
    out.push({ slot: c.slot, in: +at.toFixed(3), mark: c.hit ? 'hit' : 'start', gain: c.gain ?? 1, pan: c.pan ?? -0.5 });
  }
  return out;
}
/**
 * THE BARBERSHOP'S DAY, heard (windows.js#barberDay — the same cycle): a customer every BARBER_CYCLE s — in through the door (the
 * bell), the haircut (snips now and then), out (the bell) — from the opening's end. → { n (the customer), ph (s into the cycle),
 * cutting } for local second `sec`; shopStart = today's opening (core/harbor-moments.js#routineAt), its length `len` (44 s)
 */
export const BARBER_CYCLE = 480, BARBER_BELLS = Object.freeze([0.6, 345]), BARBER_CUT = Object.freeze([24, 336]);
export function barberAt(sec, shopStart, len = 44) {
  const el = sec - shopStart - len + 40, n = Math.floor(el / BARBER_CYCLE), ph = el - n * BARBER_CYCLE;
  return { n, ph: +ph.toFixed(3), cutting: ph >= BARBER_CUT[0] && ph <= BARBER_CUT[1] };
}
/** the bells crossed between two looks at the cycle (PURE): a > b in the same customer, or across a new one; none on the first look */
export function bellsBetween(a, b) {
  if (!a || !b) return 0;
  if (b.n === a.n) return BARBER_BELLS.filter(t => a.ph < t && t <= b.ph).length;
  if (b.n === a.n + 1) return BARBER_BELLS.filter(t => a.ph < t).length + BARBER_BELLS.filter(t => t <= b.ph).length;
  return 0;                                   // (a jump — the clock moved, a long pause: nothing rung for what was missed)
}
