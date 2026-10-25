// CITY 2.0 — THE PREVIEW PANEL's registry (PURE: the panel, the scene and /api/admin share it; docs/harbor.md#the-preview-panel).
// ONE list of everything the owner's test remote can switch: every &force= preview that works on ?city=2, the party show's
// scenes, the time jumps, the weather, the holiday looks, the tools. A new &force= preview is one row in EVENTS and it appears in
// the panel (and is accepted by the server) with no other change.
//
//   the state   { force: [ids], text, show, colours, colour, by, cycle, style, tower, scheme, game, scene, party: 'on'|'off',
//                 when: 'YYYY-MM-DDTHH:MM' (wall time in the city's zone), speed: 1|20|60, wx, hol, mood: a MUSIC MOOD, debug, grid }
//               — plain values only (ids from these lists, short upper-case text, numbers); cleanRemote() validates them (the
//               server refuses anything it had to drop)
//   toParams    the state → the URL flags the preview links use (&force=a,b&text=…&when=…) — the scene applies them live
//   describe    the state → the panel's one-line status ("DRONE SHOW “HI” · RAIN · SAT 23:00 · 20×")
//   timeAt      a TIME preset (dawn, noon, golden hour …) → a wall time from the real sun at that place + day
//   holidayDay  a HOLIDAY look → its next date (YYYY-MM-DD)
// Part 13's CITY CONTROL grows from this: the same rows, scheduled + previewed before GO LIVE.
import { sunTimes, localParts, easter, thanksgiving } from './sky.js';
import { SHOW_SCENES } from './harbor-show.js';
import { DRONE_SHAPES } from './harbor-sky.js';
import { TOWER_CHOICES } from './harbor-windows.js';
import { PULSE_DEFAULT, PULSE_MIN, PULSE_MAX, PULSE_STEP } from './harbor-beat.js';
import { MOMENTS } from './harbor-moments.js';

/** the URL flags the remote owns (while a remote state is on, the page's own values of these are replaced) */
export const REMOTE_KEYS = ['force', 'text', 'show', 'colours', 'colour', 'by', 'cycle', 'style', 'tower', 'scheme', 'game', 'scene', 'when', 'speed', 'wx', 'mood', 'debug', 'grid', 'pulse'];

const GAME_IDS = ['cipher', 'signal', 'overclock', 'bluff', 'pulse', 'golf', 'prism', 'gridlock', 'slip', 'agent', 'stakes', 'rum'];
const NEON_SCHEMES = ['halloween', 'christmas', 'july4', 'valentine', 'stpatrick', 'nye', 'thanksgiving', 'easter', 'party'];
const ROSIE_SCHEMES = ['parade', 'valentine', 'party', 'halloween', 'christmas'];

/** an event's inputs (the panel draws them under the event while it is on; several events may share one — like the links) */
export const INPUTS = {
  text: { kind: 'text', label: 'TEXT' },
  show: { kind: 'multi', label: 'SHAPES', options: [...DRONE_SHAPES, ...GAME_IDS.map(g => `mark:${g}`)], max: 4 },
  colours: { kind: 'colours', label: 'COLOURS', options: ['ff2e97', '2ee6ff', 'ffd25a', '7dff6a', 'b36bff', 'ffffff', 'ff8a2a'], max: 4 },
  colour: { kind: 'select', label: 'ONE COLOUR', options: ['', 'rainbow', 'ff2e97', '2ee6ff', 'ffd25a', '7dff6a', 'ffffff'] },
  by: { kind: 'select', label: 'COLOUR BY', options: ['', 'word', 'letter'] },
  cycle: { kind: 'bool', label: 'COLOURS DRIFT' },
  style: { kind: 'select', label: 'STYLE', options: ['wipe', 'steady', 'twinkle', 'scroll'], default: 'wipe' },
  // (7a §0: one tower, or one word per tower across a list — core/harbor-windows.js#TOWER_CHOICES; AUTO = the best layout)
  tower: { kind: 'select', label: 'TOWERS', options: TOWER_CHOICES, labels: { '': 'AUTO', wordA: 'A', wordB: 'B', wordV: 'VERTICAL', 'wordA,wordB': 'A + B', 'wordA,wordB,wordV': 'A + B + V' } },
  scheme: { kind: 'select', label: 'SCHEME', options: [...new Set([...NEON_SCHEMES, ...ROSIE_SCHEMES])], default: 'halloween' },
  game: { kind: 'select', label: 'GAME', options: GAME_IDS, default: 'pulse' },
};

/** THE PANEL'S CATEGORIES (PART 7a §0 — the owner: "it's getting so cluttered"): collapsible sections, in this order, collapsed by
 *  default. Every EVENT names its `cat` (one of these ids); the sheet's own controls (the times, the weather list, the party's
 *  switches + scenes, the holidays, the music, the tools) sit in theirs. A new preview = a row with a `cat`; checkRegistry() and
 *  harbor.test.mjs fail on an unknown one (the panel would put it in TOOLS rather than lose it). */
export const CATS = [
  { id: 'time', label: 'TIME' },
  { id: 'weather', label: 'WEATHER' },
  { id: 'sky', label: 'SKY EVENTS' },
  { id: 'lights', label: 'LIGHTS' },
  { id: 'signs', label: 'SIGNS' },
  { id: 'party', label: 'PARTY SHOW' },
  { id: 'harbor', label: 'HARBOR' },
  { id: 'speakeasy', label: 'SPEAKEASY' },
  // (PART 7b: THE WINDOWS — every window moment of core/harbor-moments.js, one row each: it plays on a loop; adding a moment adds its row)
  { id: 'windows', label: 'WINDOWS' },
  // (PART 8a: THE PROMENADE — the trees' seasons, the implied road on / off, a car passing now)
  { id: 'promenade', label: 'PROMENADE' },
  // (PART 8b1: THE WORKERS — each worker's show on a loop, any day: core/harbor-workers.js)
  { id: 'workers', label: 'WORKERS' },
  // (PART 8b1: THE WILDLIFE — every animal + behaviour on a loop: screens/harbor/wildlife.js#WILD_FORCES)
  { id: 'wildlife', label: 'WILDLIFE' },
  { id: 'holidays', label: 'HOLIDAYS' },
  { id: 'music', label: 'MUSIC' },
  // (PART 8a: every CITY SOUND slot — filled / empty, ▶ plays it on this phone; core/city-sounds.js. No events: its rows are the panel's own)
  { id: 'sounds', label: 'SOUNDS' },
  { id: 'tools', label: 'TOOLS' },
];
const CAT_IDS = new Set(CATS.map(c => c.id));
export const catOf = id => { const e = EV[id]; return e && CAT_IDS.has(e.cat) ? e.cat : 'tools'; };

// THE EVENTS: every &force= preview that runs on ?city=2 (cat → its category in the panel, group → the sub-heading inside it). Each
// is a TOGGLE in `force` (several on at once, together with a time / weather / scene / holiday). text: the longest text it takes.
// oneShot: a sky piece started through harbor().sky — EVERYONE's phones start it at the same moment (startAt), a late arrival
// joins mid-flight; the rest are states (on while the remote is on). ready: false = not drawn on the Harbor yet: the panel hides the
// row (the id stays valid for the URL + the server) until the part that builds it flips it.
export const EVENTS = [
  { id: 'drones', label: 'DRONE SHOW', cat: 'sky', group: 'MESSAGES', oneShot: true, inputs: ['text', 'colours', 'colour', 'by', 'cycle'], text: 140, night: true, hint: 'the night version of skytyping: the drones rise into your MESSAGE, a page at a time' },
  { id: 'drones-calm', label: 'DRONES · CALM', cat: 'sky', group: 'MESSAGES', hint: 'with DRONE SHOW: slower, steady lights' },
  { id: 'banner', label: 'BANNER PLANE', cat: 'sky', group: 'MESSAGES', oneShot: true, inputs: ['text'], text: 74, hint: 'A | B | C: up to 3 banners' },
  { id: 'skywrite', label: 'SKYWRITING', cat: 'sky', group: 'MESSAGES', oneShot: true, inputs: ['text'], text: 140, ready: false },   // (6b: CUT — an old link types it)
  { id: 'skytype', label: 'SKYTYPING', cat: 'sky', group: 'MESSAGES', oneShot: true, inputs: ['text'], text: 140, hint: 'up to 3 lines × ~16 letters a page, 3 pages; | starts a page' },
  { id: 'helicopter', label: 'HELICOPTER', cat: 'sky', group: 'AIRCRAFT', oneShot: true },
  { id: 'jets', label: 'AIR SHOW (F-22s)', cat: 'sky', group: 'AIRCRAFT', oneShot: true, hint: 'a diamond of four stealth fighters: two straight formation flybys, smooth smoke trails by day — July 4th' },
  { id: 'flyby', label: 'SURPRISE FLYBY', cat: 'sky', group: 'AIRCRAFT', oneShot: true, hint: '2–4 F-22s straight across on afterburner — ~twice a month, golden hour → 11 pm' },
  { id: 'barnstormer', label: 'BARNSTORMER', cat: 'sky', group: 'AIRCRAFT', oneShot: true, hint: 'a red 1920s biplane threading THROUGH the NEON letters + a loop (~3 days a week)' },
  { id: 'missing-man', label: 'MISSING MAN', cat: 'sky', group: 'AIRCRAFT', oneShot: true, hint: 'a finger-four, #3 pulls up + away — Memorial + Veterans Day' },
  { id: 'balloons', label: 'BALLOONS', cat: 'sky', group: 'AIRCRAFT', oneShot: true },
  { id: 'balloon-festival', label: 'BALLOON FESTIVAL', cat: 'sky', group: 'AIRCRAFT', oneShot: true },
  { id: 'planes', label: 'PLANES', cat: 'sky', group: 'AIRCRAFT' },
  { id: 'approach', label: 'PLANE ON APPROACH', cat: 'sky', group: 'AIRCRAFT' },
  { id: 'satellites', label: 'SATELLITE TRAIN', cat: 'sky', group: 'AIRCRAFT', night: true },
  { id: 'aurora', label: 'AURORA', cat: 'sky', group: 'UP HIGH', night: true },
  { id: 'meteor', label: 'METEORS', cat: 'sky', group: 'UP HIGH', night: true },
  { id: 'fireball', label: 'FIREBALL', cat: 'sky', group: 'UP HIGH', night: true, hint: 'the rare bright green-white one that breaks up (a few a year)' },
  { id: 'eclipse', label: 'MOON ECLIPSE', cat: 'sky', group: 'UP HIGH', night: true },
  { id: 'eclipse-sun', label: 'SOLAR ECLIPSE', cat: 'sky', group: 'UP HIGH' },
  { id: 'totality', label: 'TOTALITY', cat: 'sky', group: 'UP HIGH' },
  { id: 'fireworks', label: 'FIREWORKS', cat: 'sky', group: 'FIREWORKS + HOLIDAY SKY', night: true },
  { id: 'finale', label: 'PARTY FINALE', cat: 'sky', group: 'FIREWORKS + HOLIDAY SKY', night: true },
  { id: 'sleigh', label: 'SLEIGH', cat: 'sky', group: 'FIREWORKS + HOLIDAY SKY', night: true },
  { id: 'witch', label: 'WITCH', cat: 'sky', group: 'FIREWORKS + HOLIDAY SKY', night: true },
  // (PART 6b — THE LEGENDARY SKY: ~1–2 nights a month each for everyone; here on demand, repeating while on — JUST ME or EVERYONE, the same moment)
  { id: 'ufo', label: 'UFO ABDUCTION', cat: 'sky', group: 'LEGENDARY', oneShot: true, night: true, hint: 'the saucer, the beam, someone lifted off the compass (~30 s)' },
  { id: 'tr3b', label: 'TR-3B + JET CHASE', cat: 'sky', group: 'LEGENDARY', oneShot: true, night: true, hint: 'the black triangle drains the city’s power, then F-16s chase it (~50 s)' },
  { id: 'cat', label: 'THE MOON CAT', cat: 'sky', group: 'FIREWORKS + HOLIDAY SKY', night: true, ready: false },  // (ready: false — not on the Harbor yet; still a valid id)
  { id: 'geese', label: 'GEESE', cat: 'sky', group: 'BIRDS' },
  { id: 'swifts', label: 'SWIFTS', cat: 'sky', group: 'BIRDS' },
  { id: 'bats-dusk', label: 'BATS AT DUSK', cat: 'sky', group: 'BIRDS' },
  { id: 'bats', label: 'HALLOWEEN BATS', cat: 'sky', group: 'BIRDS', night: true },
  { id: 'heron-sky', label: 'HERON (NIGHT CROSSING)', cat: 'sky', group: 'BIRDS', hint: 'the rare slow heron crossing a night sky, neck folded (spring → autumn)' },
  { id: 'rainbow', label: 'RAINBOW', cat: 'weather', group: 'RAINBOWS' },
  { id: 'rainbow2', label: 'DOUBLE RAINBOW', cat: 'weather', group: 'RAINBOWS' },
  { id: 'moonbow', label: 'MOONBOW', cat: 'weather', group: 'RAINBOWS', night: true },
  { id: 'neonbow', label: 'NEON BOW', cat: 'weather', group: 'RAINBOWS', night: true },
  { id: 'lightning', label: 'LIGHTNING', cat: 'weather', group: 'WEATHER FX', hint: 'with WEATHER = STORM' },
  { id: 'freeze', label: 'FROST', cat: 'weather', group: 'WEATHER FX' },
  { id: 'halo', label: '22° SUN HALO', cat: 'weather', group: 'WEATHER FX', hint: 'with the HIGH VEIL (a thin cirrostratus sky): the rare faint ring round the sun' },
  { id: 'sundogs', label: 'SUN DOGS', cat: 'weather', group: 'WEATHER FX', hint: 'with the HIGH VEIL: the 22° halo + its two sun dogs (the rarer bonus)' },
  { id: 'beams', label: 'SKY BEAMS', cat: 'party', group: 'ANY NIGHT', night: true, hint: 'the party’s vertical beams from the tall towers' },
  { id: 'searchlights', label: 'SEARCHLIGHTS', cat: 'lights', group: 'THE TOWERS', night: true },
  { id: 'spell', label: 'WORDS IN THE WINDOWS', cat: 'lights', group: 'THE TOWERS', inputs: ['text', 'style', 'tower'], text: 60, night: true, hint: 'type a message: one word per tower, a word too long for its tower scrolls on it' },
  { id: 'burnout', label: 'BURNT-OUT LETTER', cat: 'signs', group: 'THE CITY’S NEON', night: true },
  { id: 'neon-party', label: 'NEON PARTY', cat: 'party', group: 'ANY NIGHT', night: true },
  { id: 'neon-flash', label: 'NEON FLASH', cat: 'signs', group: 'THE CITY’S NEON', inputs: ['game'], night: true },
  { id: 'neon-scheme', label: 'NEON SCHEME', cat: 'signs', group: 'THE CITY’S NEON', inputs: ['scheme'], night: true },
  { id: 'spell-on', label: 'SPELL-ON ROUND', cat: 'signs', group: 'THE CITY’S NEON', night: true, hint: 'every named sign spells itself on in turn — the next one every 6 s' },
  // (DT1 — THE LIGHTS + SIGNS PASS: the power-up itself is TIME = POWER-UP / POWER-DOWN at SPEED 20)
  { id: 'flood-front', label: 'WATERFRONT FLOODLIGHTS', cat: 'lights', group: 'THE WATERFRONT', night: true, hint: 'the front row’s low warm uplight — compare on / off' },
  { id: 'lamps-on', label: 'BILLBOARD LAMPS ON', cat: 'signs', group: 'THE BILLBOARD', hint: 'its 4 gooseneck lamps held on (by day too)' },
  { id: 'lamps-off', label: 'BILLBOARD LAMPS OFF', cat: 'signs', group: 'THE BILLBOARD', night: true, hint: 'the night without them — compare' },
  { id: 'no-halo', label: 'SIGN HALO OFF', cat: 'signs', group: 'THE NEON SIGN', hint: 'the tagline + NEON’s dark halo off — compare (the moon behind it)' },
  { id: 'wheel-scheme', label: 'WHEEL SCHEME', cat: 'harbor', group: 'HARBOR', inputs: ['scheme'] },
  { id: 'beam-green', label: 'GREEN BEAM', cat: 'harbor', group: 'HARBOR', night: true },
  { id: 'rosie-lights', label: 'ROSIE’S LIGHTS', cat: 'harbor', group: 'HARBOR', inputs: ['scheme'] },
  { id: 'taxi', label: 'WATER TAXI', cat: 'harbor', group: 'HARBOR' },
  { id: 'rosie-turn', label: 'ROSIE’S TURN', cat: 'harbor', group: 'HARBOR', hint: 'her homecoming swing on a loop — the 3D model turning in the open water, bow toward us' },
  // (PART 8a — THE PROMENADE: the trees + planters in each season (the real date otherwise); the owner's implied road (on by default)
  // switched off to compare; a car passing along it now (its headlights at night, its shadow by day, its sound))
  { id: 'season-spring', label: 'SPRING', cat: 'promenade', group: 'SEASON', hint: 'the crabapple in blossom, fresh light-green maples, tulips' },
  { id: 'season-summer', label: 'SUMMER', cat: 'promenade', group: 'SEASON', hint: 'full green trees, geraniums' },
  { id: 'season-autumn', label: 'AUTUMN', cat: 'promenade', group: 'SEASON', hint: 'the maples red / orange / gold, leaves falling, mums' },
  { id: 'season-winter', label: 'WINTER', cat: 'promenade', group: 'SEASON', hint: 'bare branches, evergreen boughs (snow comes with Part 9)' },
  { id: 'no-implied-road', label: 'IMPLIED ROAD OFF', cat: 'promenade', group: 'THE IMPLIED ROAD', hint: 'the curb + the passing cars’ light gone — compare' },
  { id: 'road-pass', label: 'A CAR PASSING', cat: 'promenade', group: 'THE IMPLIED ROAD', hint: 'a car every ~13 s: headlights at night, a shadow by day, its sound — seen on the street while the dock rests' },
  { id: 'wet-street', label: 'WET STREET', cat: 'promenade', group: 'THE IMPLIED ROAD', hint: 'the street under the dock after rain: puddles, the lamps’ reflections (Part 9’s hook)' },
  // (PF: the centrepiece spot's EVENT RIG at work — a placeholder obelisk on the brick inlay, lit from below by its floor spots at night)
  { id: 'centrepiece-test', label: 'CENTREPIECE TEST', cat: 'promenade', group: 'THE CENTREPIECE', hint: 'a test obelisk on the brick inlay, lit by its floor spots after dark (the holidays’ pieces stand here)' },
  { id: 'strings-party', label: 'CAFÉ LIGHTS · PARTY', cat: 'speakeasy', group: 'SPEAKEASY', night: true, hint: 'the speakeasy roof’s café-light canopy in party mode' },
  // (8P: THE PEOPLE — the lobby line at the door (&n= guests, 6 by default; Lobby 2.0 fills it), a bus every minute, everyone off to compare)
  { id: 'line', label: 'THE LOBBY LINE', cat: 'promenade', group: 'THE PEOPLE', hint: 'guests lined up at the speakeasy’s door (6; &n=<guests>) — Lobby 2.0 fills it with the room' },
  { id: 'bus', label: 'A BUS EVERY MINUTE', cat: 'promenade', group: 'THE PEOPLE', hint: 'the 1920s bus arriving, stopping at the curb, riders on + off, pulling away on green' },
  { id: 'dance', label: 'THE DANCE CIRCLE', cat: 'promenade', group: 'THE PEOPLE', hint: 'the glow-wand dancers on the compass inlay — a circle every 5 minutes (best with PARTY ON)' },
  { id: 'doors', label: 'THE DOORS', cat: 'promenade', group: 'THE PEOPLE', hint: 'every 24 s someone walks through a real door — the side door at night (its amber spill), the barbershop by day (FP3b)' },
  { id: 'no-dance', label: 'NO DANCE CIRCLE', cat: 'promenade', group: 'THE PEOPLE', hint: 'a party night without the glow-wand circle — compare (its cost)' },
  { id: 'no-people', label: 'NO PEOPLE', cat: 'promenade', group: 'THE PEOPLE', hint: 'the promenade + the roof empty — compare' },
  // PART 8b1 — THE WORKERS' SCHEDULE: each one on a loop (its own clock: a few minutes, the long shows joined mid-way); NO WORKERS: compare
  { id: 'work-sweeper', label: 'THE STREET SWEEPER', cat: 'workers', group: 'MORNING', hint: '~5:30 Mon–Sat: a white wing with his can cart, slow passes, a wet streak drying on the cobbles' },
  { id: 'work-milk', label: 'THE MILK TRUCK', cat: 'workers', group: 'MORNING', hint: '6:00 sharp: the milkman leaves his bottles on the barbershop step (they wait there till the barber, 8:30)' },
  { id: 'work-newsdrop', label: 'THE NEWSPAPER VAN', cat: 'workers', group: 'MORNING', hint: '~6:35: two bundles dropped at the vendor spot before the newsboy comes' },
  { id: 'work-trash', label: 'THE TRASH TRUCK', cat: 'workers', group: 'MORNING', hint: 'weekday mornings: the can by the front-left lamppost carried to the truck + tipped in' },
  { id: 'work-newsboy', label: 'THE NEWSBOY', cat: 'workers', group: 'MORNING', hint: '7:00 sharp (weekends 8:00): his folding stand, papers held up, buyers now + then' },
  { id: 'work-barber', label: 'THE BARBER', cat: 'workers', group: 'MORNING', hint: '8:30 sharp: the milk taken in, into the shop, out with his broom, the awning cranked' },
  { id: 'work-cop', label: 'THE BEAT COP', cat: 'workers', group: 'MORNING', hint: '9:00 am + 9:00 pm: a friendly stroll, the baton twirled, a tip of the hat' },
  { id: 'work-patrol', label: 'THE 9 PM PATROL', cat: 'workers', group: 'EVENING', hint: 'the beat cop again at 9:00 pm, the other way along the promenade' },
  { id: 'work-bulb', label: 'BULB REPAIR (THE BLADE)', cat: 'workers', group: 'MORNING', hint: 'the morning after a blade bulb dies: a tall ladder at the corner, the swap, a test flicker' },
  { id: 'work-lamp', label: 'LAMP REPAIR', cat: 'workers', group: 'MORNING', hint: 'the morning after a lamppost’s bad night: a stepladder at that lamp' },
  { id: 'work-ice', label: 'THE ICE MAN', cat: 'workers', group: 'MIDDAY', hint: 'mid-morning weekdays: an ice block on his shoulder to the side door' },
  { id: 'work-mail', label: 'THE MAILMAN', cat: 'workers', group: 'MIDDAY', hint: '~10:30: the post through the barbershop’s door' },
  { id: 'work-washers', label: 'THE WINDOW WASHERS', cat: 'workers', group: 'MIDDAY', hint: 'Tue + Fri late morning: their hanging platform, the upper floor then the one below' },
  { id: 'work-gardener', label: 'THE ROOFTOP GARDENER', cat: 'workers', group: 'MIDDAY', hint: 'Wednesdays: the roof beds tended, bed by bed' },
  { id: 'work-soda', label: 'THE SODA WATER TRUCK', cat: 'workers', group: 'MIDDAY', hint: '~2 pm weekdays: crates of “soda water” in at the side door' },
  { id: 'work-painters', label: 'THE SIGN PAINTERS', cat: 'workers', group: 'MIDDAY', hint: 'Mondays 1–4 pm: the blade repainted for the new week (paint-out, chalk, letters, gilt) — compressed into 20 min' },
  { id: 'work-sweep2', label: 'THE EXTRA SWEEP', cat: 'workers', group: 'MIDDAY', hint: 'the morning after a party night' },
  { id: 'work-crew', label: 'THE ROOF CLEANUP CREW', cat: 'workers', group: 'MIDDAY', hint: 'the morning after a party night: the roof deck swept, the bottles gathered' },
  { id: 'work-bartender', label: 'THE BARTENDER', cat: 'workers', group: 'EVENING', hint: '~4 pm: in at the side door (the bar’s window lights up behind him)' },
  { id: 'work-evening', label: 'THE EVENING EDITION', cat: 'workers', group: 'EVENING', hint: '4:30 → 6:30 pm weekdays: the newsboy back at his stand' },
  { id: 'work-billposter', label: 'THE BILLPOSTER', cat: 'workers', group: 'EVENING', hint: '~5–6 pm daily: up on the catwalk, the new poster pasted sheet by sheet (a dead lamp fixed)' },
  { id: 'work-doorman', label: 'THE DOORMAN', cat: 'workers', group: 'EVENING', hint: 'from dusk: at his post by the side door' },
  { id: 'work-flowers', label: 'THE FLOWER SELLER', cat: 'workers', group: 'EVENING', hint: 'dusk, Wed–Sat: a basket of flowers for the couples heading in' },
  { id: 'work-musician', label: 'THE MUSICIAN', cat: 'workers', group: 'EVENING', hint: '~8 pm: the band’s bass player with his case, in at the side door' },
  { id: 'work-bootleg', label: 'THE BOOTLEGGERS', cat: 'workers', group: 'NIGHT', hint: '~11 pm, a few nights a month: a truck without lamps, crates down the cellar hatch, a lookout' },
  { id: 'work-delivery', label: 'THE BIG DELIVERY', cat: 'workers', group: 'NIGHT', hint: 'Saturdays ~6:30 pm: the bootleggers’ big load before the party night' },
  { id: 'work-staff', label: 'THE BAR STAFF LOCK UP', cat: 'workers', group: 'NIGHT', hint: '~2 am: out of the side door, the last one locks it' },
  { id: 'no-work', label: 'NO WORKERS', cat: 'workers', group: 'COMPARE', hint: 'every worker stays home — compare (their cost)' },
  // PART 8b1 — THE HARBOR'S TIMETABLE, heard (every 30 s while on)
  { id: 'ships-bell', label: 'THE SHIP’S BELL', cat: 'harbor', group: 'THE TIMETABLE', hint: 'the hourly bell (one ring, under the music) — every 30 s' },
  { id: 'steam-whistle', label: 'THE NOON WHISTLE', cat: 'harbor', group: 'THE TIMETABLE', hint: 'the noon steam whistle off Rosie’s stacks (a white plume, the music dipped) — every 30 s' },
  { id: 'dinner-horn', label: 'THE DINNER CRUISE HORN', cat: 'harbor', group: 'THE TIMETABLE', hint: 'Rosie’s long blast as she casts off at 7 pm (the music dipped) — every 30 s' },
  // ---- PART 8b1 — THE WILDLIFE (screens/harbor/wildlife.js#WILD_FORCES; each on a loop, any hour — the light is the hour's)
  { id: 'pigeons', label: 'PIGEONS', cat: 'wildlife', group: 'THE PIGEONS', hint: 'the whole flock of 8 on the cobbles + the ledges (they flush when people walk close)' },
  { id: 'pigeons-scatter', label: 'PIGEONS SCATTER', cat: 'wildlife', group: 'THE PIGEONS', hint: 'a scare every 25 s: they burst up — some to a ledge, some away a while and back from another side' },
  { id: 'dog-pigeons', label: 'A DOG CHASES THEM', cat: 'wildlife', group: 'THE PIGEONS', hint: 'every dog walking past the flock lunges at it (its owner’s leash goes taut) — best by day' },
  { id: 'cat-out', label: 'THE CAT OUTSIDE', cat: 'wildlife', group: 'THE CAT', hint: 'the speakeasy’s black cat out on the barbershop’s sill / the side door’s step (every ~3 min)' },
  { id: 'cat-stalk', label: 'THE CAT STALKS', cat: 'wildlife', group: 'THE CAT', hint: 'the cat drops down, creeps up on a pigeon, pounces — the flock bursts' },
  { id: 'gulls-land', label: 'GULLS LANDING', cat: 'wildlife', group: 'THE BIRDS', hint: 'three gulls land on the roof billboard + the waterside railing, preen, take off' },
  { id: 'snowy-owl', label: 'SNOWY OWL', cat: 'wildlife', group: 'THE BIRDS', hint: 'the winter visitor on the billboard / the date stone / a lamp — moving perch every ~70 s' },
  { id: 'heron', label: 'HERON ON THE PILING', cat: 'wildlife', group: 'THE BIRDS', hint: 'the great blue heron glides in to its piling, stands, strikes at the water, flies off (every 80 s)' },
  { id: 'squirrel', label: 'THE SQUIRREL', cat: 'wildlife', group: 'ON THE GROUND', hint: 'down the big maple, hops across the cobbles, sits up — dashes back up if someone comes' },
  { id: 'coyote', label: 'THE COYOTE', cat: 'wildlife', group: 'ON THE GROUND', night: true, hint: 'across the empty promenade, a stop under the lamp, the eye-flash — every 70 s (a howl every third)' },
  { id: 'fireflies', label: 'FIREFLIES', cat: 'wildlife', group: 'ON THE GROUND', night: true, hint: 'summer nights round the trees + the bench' },
  { id: 'fish', label: 'FISH JUMPING', cat: 'wildlife', group: 'ON THE WATER', hint: 'a fish jumps in the near water every 45 s — the ripple rings' },
  { id: 'no-wildlife', label: 'NO WILDLIFE', cat: 'wildlife', group: 'ON THE GROUND', hint: 'every animal off — compare (the speed A/B)' },
  // (8P: THE HUSH WORD SIGN in the barbershop window — JAZZ by default, &hush=<word> another; Lobby 2.0 lights the real word)
  // (8b2 — THE RAID: the patrol cars every 2½ minutes; RAID + PARTY = a party night's — the club comes back louder)
  { id: 'raid', label: 'THE RAID', cat: 'speakeasy', group: 'THE RAID', night: true, hint: 'black-and-white patrol cars, red + blue on the walls — every light in the speakeasy cuts out, an officer sweeps the windows with his flashlight (every 2½ min)' },
  { id: 'hushsign', label: 'HUSH WORD SIGN', cat: 'speakeasy', group: 'SPEAKEASY', hint: 'the lobby’s password in neon in the barbershop window (JAZZ; &hush=<word>)' },
  // ---- THE FIRST-TAP SURGE (PART 7a §0 — the layout agent builds it: the NEON sign's surge at the first tap). Registered so the
  // URL flag + city2/live accept it; ready: false keeps the row hidden until its effect reads the Harbor clock's force Set
  // (harbor().flags.force / the scene's clock — a title-level regex on location.search can't be switched from the panel). Rename
  // the id here if the effect lands under another name; flip ready when it's drawn.
  // ---- PART 7b — THE WINDOWS: &force=window&moment=<id> (the links; hidden: the panel can't type a moment) + one row per moment
  // (&force=window-<id>), grouped by rarity — the catalogue's own list (core/harbor-moments.js#MOMENTS), so a new moment is a new row
  { id: 'window', label: 'WINDOW MOMENT', cat: 'windows', group: 'ROUTINES', ready: false, hint: 'with &moment=<id>' },
  ...MOMENTS.map(m => ({ id: `window-${m.id}`, label: m.label.replace(' (LEGENDARY)', ''), cat: 'windows', group: m.starter === false ? 'THE MIRROR DOOR' : m.rarity === 'routine' ? 'ROUTINES' : m.rarity.toUpperCase(), night: m.light === 'night' || m.id === 'lights-out' || undefined, hint: `${m.kind}${m.at != null ? ` — ~${m.at}:00 every day` : ''}` })),
  { id: 'first-tap', label: 'FIRST-TAP SURGE', cat: 'signs', group: 'THE NEON SIGN', hint: 'the NEON sign’s first-tap surge, as on the first tap (by day: a surge through the glass; at night: a brighter race)' },
];
export const EVENT_GROUPS = [...new Set(EVENTS.map(e => e.group))];
/** the rows the panel shows (not the ones a later part still has to build) */
export const PANEL_EVENTS = EVENTS.filter(e => e.ready !== false);
const EV = Object.fromEntries(EVENTS.map(e => [e.id, e]));
export const eventDef = id => EV[id] || null;
/** the registry's own checks (harbor.test.mjs): [] = fine; else what's wrong (an unknown category, a duplicate id, an unknown input) */
export function checkRegistry() {
  const bad = [], seen = new Set();
  for (const e of EVENTS) {
    if (!/^[a-z0-9-]+$/.test(e.id || '')) bad.push(`id:${e.id}`);
    if (seen.has(e.id)) bad.push(`dup:${e.id}`); seen.add(e.id);
    if (!CAT_IDS.has(e.cat)) bad.push(`cat:${e.id}:${e.cat}`);
    if (!e.label || typeof e.label !== 'string') bad.push(`label:${e.id}`);
    for (const k of e.inputs || []) if (!INPUTS[k] || !REMOTE_KEYS.includes(k)) bad.push(`input:${e.id}:${k}`);
  }
  if (CAT_IDS.size !== CATS.length) bad.push('cats:dup');
  return bad;
}

/** the party show's scenes, from the show's own lists (NEON PASS 3) */
export const SHOW_SCENE_LIST = Object.entries(SHOW_SCENES).flatMap(([list, scenes]) => scenes.map(s => ({ id: s.name, list })));

// PART 7a §0 (the owner): the day in time order — SUNRISE (5 min after today's real sunrise) · MORNING · NOON · AFTERNOON · GOLDEN HOUR
// · SUNSET (5 min before the real sunset) · DUSK · NIGHT; then the rest (more: true — the panel's second row), in time order too.
// Each becomes a concrete `when` at tap time (timeAt, from the real sun at the city's place that day) — EVERYONE gets that minute.
export const TIMES = [
  { id: 'sunrise', label: 'SUNRISE' }, { id: 'morning', label: 'MORNING' }, { id: 'noon', label: 'NOON' }, { id: 'afternoon', label: 'AFTERNOON' },
  { id: 'golden', label: 'GOLDEN HOUR' }, { id: 'sunset', label: 'SUNSET' }, { id: 'dusk', label: 'DUSK' }, { id: 'night', label: 'NIGHT' },
  // (DT1: the blue hour's power-up from late golden hour; the power-down before sunrise — watch them at SPEED 20)
  { id: 'late', label: '3 AM', more: true }, { id: 'powerdown', label: 'POWER-DOWN', more: true }, { id: 'dawn', label: 'DAWN', more: true }, { id: 'powerup', label: 'POWER-UP', more: true },
];
export const SPEEDS = [1, 20, 60];
/** 8a — PULSE STRENGTH (LIGHTS): the beat punch × this, in percent — the state's `pulse` (absent = the default, core/harbor-beat.js
 *  #PULSE_DEFAULT: the owner's pick locks in there), the URL's &pulse=<percent> */
export const PULSE = { min: Math.round(PULSE_MIN * 100), max: Math.round(PULSE_MAX * 100), step: Math.round(PULSE_STEP * 100), def: Math.round(PULSE_DEFAULT * 100) };
/** CITY 2.0 MUSIC: the moods the panel can force (the same ids as audio/mood.js#MOODS; AUTO = no `mood` key) */
export const MUSIC_MOODS = [{ id: 'morning', label: 'MORNING' }, { id: 'day', label: 'DAY' }, { id: 'evening', label: 'EVENING' }, { id: 'late', label: 'LATE NIGHT' }, { id: 'party', label: 'PARTY' }];
export const WEATHER = [
  { id: 'clear', label: 'CLEAR' }, { id: 'clouds', label: 'CLOUDS' }, { id: 'cirrus', label: 'HIGH CIRRUS' }, { id: 'veil', label: 'HAZY VEIL' },
  { id: 'overcast', label: 'OVERCAST' }, { id: 'rain', label: 'RAIN' }, { id: 'storm', label: 'STORM' }, { id: 'snow', label: 'SNOW' }, { id: 'fog', label: 'FOG' },
  // (FP3a — the weather by layers: a 600 m MIST (no banks), a low STRATUS deck, a HIGH OVERCAST = a bright veil, never grey)
  { id: 'mist', label: 'MIST' }, { id: 'stratus', label: 'LOW STRATUS' }, { id: 'highovercast', label: 'HIGH OVERCAST' },
];
const lastMonday = (y, m) => { const d = new Date(Date.UTC(y, m, 0)); return d.getUTCDate() - ((d.getUTCDay() + 6) % 7); };
/** the holiday looks (core/sky.js#holidayOf + the holiday sky's own days, core/harbor-sky.js#SKY_HOLIDAYS) and their date */
export const HOLIDAYS = [
  { id: 'valentine', label: 'VALENTINE’S', date: () => ({ m: 2, d: 14 }) },
  { id: 'stpatrick', label: 'ST PATRICK’S', date: () => ({ m: 3, d: 17 }) },
  { id: 'easter', label: 'EASTER', date: y => easter(y) },
  { id: 'memorial', label: 'MEMORIAL DAY', date: y => ({ m: 5, d: lastMonday(y, 5) }) },
  { id: 'july4', label: 'JULY 4TH', date: () => ({ m: 7, d: 4 }) },
  { id: 'halloween', label: 'HALLOWEEN', date: () => ({ m: 10, d: 31 }) },
  { id: 'veterans', label: 'VETERANS DAY', date: () => ({ m: 11, d: 11 }) },
  { id: 'thanksgiving', label: 'THANKSGIVING', date: y => thanksgiving(y) },
  { id: 'christmas-eve', label: 'CHRISTMAS EVE', date: () => ({ m: 12, d: 24 }) },
  { id: 'christmas', label: 'CHRISTMAS', date: () => ({ m: 12, d: 25 }) },
  { id: 'nye', label: 'NEW YEAR’S EVE', date: () => ({ m: 12, d: 31 }) },
];
/** how long EVERYONE's remote lasts (minutes) */
export const DURATIONS = [15, 30, 60, 120];
export const DEFAULT_MINS = 30;
export const MAX_MINS = 240;

const pad = n => String(n).padStart(2, '0');
/** the next date of a holiday on or after a local day ({ y, m, d }) → 'YYYY-MM-DD' */
export function holidayDay(id, today) {
  const h = HOLIDAYS.find(x => x.id === id);
  if (!h) return null;
  for (const y of [today.y, today.y + 1]) {
    const { m, d } = h.date(y);
    if (y > today.y || m > today.m || (m === today.m && d >= today.d)) return `${y}-${pad(m)}-${pad(d)}`;
  }
  return null;
}

/** a TIME preset on a local day ('YYYY-MM-DD') → 'YYYY-MM-DDTHH:MM' from the real sun there (fixed hours where it never sets) */
export function timeAt(id, day, tz, lat, lon) {
  const [y, m, d] = day.split('-').map(Number);
  // (noon UTC of that day is inside the local day for every zone that matters; sunTimes works from the local midnight)
  const st = sunTimes(Date.UTC(y, m - 1, d, 12), tz, lat, lon);
  const wall = ms => { const lp = localParts(ms, tz); return lp.h * 60 + lp.mi; };
  const rise = st.rise != null ? wall(st.rise) : 7 * 60, set = st.set != null ? wall(st.set) : 19 * 60;
  const mins = { dawn: rise - 22, sunrise: rise + 5, sunset: set - 5, morning: rise + 100, noon: Math.round((rise + set) / 2), afternoon: Math.round((rise + set) / 2) + 180,
    golden: set - 40, dusk: set + 16, night: 22 * 60 + 30, late: 3 * 60, powerup: set - 28, powerdown: rise - 52 }[id];
  if (mins == null) return null;
  const v = Math.max(0, Math.min(23 * 60 + 59, Math.round(mins)));
  return `${day}T${pad(Math.floor(v / 60))}:${pad(v % 60)}`;
}

// ------------------------------------------------------------------ validation (the client before sending, the server always)
const WHEN_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const HEX_RE = /^[0-9a-f]{6}$/;
// the letters every piece can draw (the pixel font of the windows, the smoke, the banner, the drones): A–Z 0–9, a few marks
const TEXT_RE = /[^A-Z0-9 !?.,'&+\-#@:♥★⚑|]/g;
// (7a §0: the window font's symbols typed the easy way — <3 ♥, * ★, [flag] ⚑ — become the symbol before the filter)
export const cleanText = (t, max = 74) => String(t == null ? '' : t).toUpperCase().replace(/[‘’]/g, "'").replace(/<3|\[HEART\]/g, '♥').replace(/\*|\[STAR\]/g, '★').replace(/\[FLAG\]/g, '⚑').replace(TEXT_RE, '').replace(/\s+/g, ' ').trim().slice(0, max);
/** the longest text the state's text events all accept (the shortest of their limits) */
export const textMax = force => Math.min(74, ...force.map(id => (EV[id] && EV[id].text) || 74));
export function validWhen(s) {
  const m = WHEN_RE.exec(String(s || ''));
  if (!m) return false;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  return y >= 2020 && y <= 2040 && mo >= 1 && mo <= 12 && d >= 1 && d <= new Date(Date.UTC(y, mo, 0)).getUTCDate() && h <= 23 && mi <= 59;
}

/** a raw state (from the panel or a request) → { state (only the valid parts), bad: [what was dropped] } */
export function cleanRemote(raw) {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const bad = [], out = {};
  const fl = Array.isArray(r.force) ? r.force : r.force == null ? [] : String(r.force).split(',');
  const force = [];
  for (const id of fl) { const s = String(id); if (EV[s]) { if (!force.includes(s)) force.push(s); } else bad.push(`force:${s.slice(0, 20)}`); }
  if (force.length > 12) { bad.push('force:too-many'); force.length = 12; }
  if (force.length) out.force = force;
  const uses = new Set(force.flatMap(id => EV[id].inputs || []));
  const sel = (k, list) => { if (r[k] == null || r[k] === '') return; const v = String(r[k]); if (list.includes(v)) out[k] = v; else bad.push(k); };
  if (r.text != null && r.text !== '') {
    const t = cleanText(r.text, textMax(force.filter(id => (EV[id].inputs || []).includes('text'))));
    if (t) out.text = t; else bad.push('text');
    if (String(r.text).length > 200) bad.push('text:too-long');
  }
  if (r.show != null && r.show !== '') {
    const v = (Array.isArray(r.show) ? r.show : String(r.show).split(',')).map(String);
    const ok = v.filter(x => INPUTS.show.options.includes(x)).slice(0, INPUTS.show.max);
    if (ok.length !== v.length) bad.push('show');
    if (ok.length) out.show = ok.join(',');
  }
  if (r.colours != null && r.colours !== '') {
    const v = (Array.isArray(r.colours) ? r.colours : String(r.colours).split(',')).map(x => String(x).replace('#', '').toLowerCase());
    const ok = v.filter(x => HEX_RE.test(x)).slice(0, INPUTS.colours.max);
    if (ok.length !== v.length) bad.push('colours');
    if (ok.length) out.colours = ok.join(',');
  }
  if (r.colour != null && r.colour !== '') { const v = String(r.colour).replace('#', '').toLowerCase(); if (v === 'rainbow' || HEX_RE.test(v)) out.colour = v; else bad.push('colour'); }
  sel('by', ['word', 'letter']); sel('style', INPUTS.style.options); sel('tower', TOWER_CHOICES.filter(Boolean));
  sel('scheme', INPUTS.scheme.options); sel('game', GAME_IDS);
  if (r.cycle) out.cycle = true;
  sel('scene', SHOW_SCENE_LIST.map(s => s.id));
  sel('party', ['on', 'off']);
  if (r.when != null && r.when !== '') { if (validWhen(r.when)) out.when = String(r.when); else bad.push('when'); }
  if (r.speed != null && r.speed !== '' && Number(r.speed) !== 1) { const v = Number(r.speed); if (SPEEDS.includes(v)) out.speed = v; else bad.push('speed'); }
  sel('wx', WEATHER.map(w => w.id));
  sel('hol', HOLIDAYS.map(h => h.id));
  sel('mood', MUSIC_MOODS.map(m => m.id));
  if (r.debug) out.debug = true;
  if (r.grid) out.grid = true;
  // (8a: PULSE STRENGTH — a whole percent on the slider's steps; the default itself is no change: dropped quietly)
  if (r.pulse != null && r.pulse !== '') {
    const v = Number(r.pulse);
    if (Number.isInteger(v) && v >= PULSE.min && v <= PULSE.max && v % PULSE.step === 0) { if (v !== PULSE.def) out.pulse = v; } else bad.push('pulse');
  }
  // (an input no event on the list uses is dropped quietly: the panel keeps its fields filled while an event is off)
  for (const k of ['text', 'show', 'colours', 'colour', 'by', 'cycle', 'style', 'tower', 'game']) if (k in out && !uses.has(k)) delete out[k];
  if ('scheme' in out && !uses.has('scheme')) delete out.scheme;
  return { state: out, bad };
}
export const isEmpty = st => !st || !Object.keys(st).length;

/** the state → the preview links' URL flags ({ key: value }; '' = a bare flag) */
export function toParams(st) {
  const p = {};
  if (!st) return p;
  const force = [...(st.force || [])];
  // (a held scene needs a party: a real party night, PARTY ON, or the neon party preview)
  if (st.scene && st.party !== 'on' && !force.includes('neon-party')) force.push('neon-party');
  if (st.party === 'on') force.push('party');
  if (st.party === 'off') force.push('no-party');
  if (force.length) p.force = force.join(',');
  for (const k of ['text', 'show', 'colours', 'colour', 'by', 'style', 'tower', 'scheme', 'game', 'scene', 'when', 'wx', 'mood']) if (st[k] != null) p[k] = String(st[k]);
  if (st.cycle) p.cycle = '1';
  if (st.speed && st.speed !== 1) p.speed = String(st.speed);
  if (st.debug) p.debug = '1';
  if (st.grid) p.grid = '1';
  if (st.pulse) p.pulse = String(st.pulse);
  return p;
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
/** the panel's status: what's on, in a line */
export function describe(st) {
  if (isEmpty(st)) return 'THE REAL CITY';
  const out = [];
  for (const id of st.force || []) {
    const e = EV[id];
    const t = (e.inputs || []).includes('text') && st.text ? ` “${st.text}”` : '';
    const x = ['scheme', 'game'].filter(k => (e.inputs || []).includes(k) && st[k]).map(k => ` ${st[k].toUpperCase()}`).join('');
    out.push(e.label + t + x);
  }
  if (st.scene) out.push(`SCENE ${st.scene.toUpperCase()}`);
  if (st.party) out.push(`PARTY ${st.party.toUpperCase()}`);
  if (st.hol) out.push(HOLIDAYS.find(h => h.id === st.hol).label);
  if (st.when) { const [y, m, d] = st.when.slice(0, 10).split('-').map(Number); out.push(`${DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${m}/${d} ${st.when.slice(11)}`); }
  if (st.speed > 1) out.push(`${st.speed}×`);
  if (st.wx) out.push(st.wx.toUpperCase());
  if (st.mood) out.push(`MUSIC ${MUSIC_MOODS.find(m => m.id === st.mood).label}`);
  if (st.debug) out.push('READOUT');
  if (st.grid) out.push('GRID');
  if (st.pulse) out.push(`PULSE ${st.pulse} %`);
  return out.join(' · ');
}
