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
  { id: 'drones', label: 'DRONE SHOW', cat: 'sky', group: 'MESSAGES', oneShot: true, inputs: ['text', 'show', 'colours', 'colour', 'by', 'cycle'], text: 40, night: true },
  { id: 'drones-calm', label: 'DRONES · CALM', cat: 'sky', group: 'MESSAGES', hint: 'with DRONE SHOW: slower, steady lights' },
  { id: 'banner', label: 'BANNER PLANE', cat: 'sky', group: 'MESSAGES', oneShot: true, inputs: ['text'], text: 74, hint: 'A | B | C: up to 3 banners' },
  { id: 'skywrite', label: 'SKYWRITING', cat: 'sky', group: 'MESSAGES', oneShot: true, inputs: ['text'], text: 10 },
  { id: 'skytype', label: 'SKYTYPING', cat: 'sky', group: 'MESSAGES', oneShot: true, inputs: ['text'], text: 33 },
  { id: 'helicopter', label: 'HELICOPTER', cat: 'sky', group: 'AIRCRAFT', oneShot: true },
  { id: 'balloons', label: 'BALLOONS', cat: 'sky', group: 'AIRCRAFT', oneShot: true },
  { id: 'balloon-festival', label: 'BALLOON FESTIVAL', cat: 'sky', group: 'AIRCRAFT', oneShot: true },
  { id: 'planes', label: 'PLANES', cat: 'sky', group: 'AIRCRAFT' },
  { id: 'approach', label: 'PLANE ON APPROACH', cat: 'sky', group: 'AIRCRAFT' },
  { id: 'satellites', label: 'SATELLITE TRAIN', cat: 'sky', group: 'AIRCRAFT', night: true },
  { id: 'aurora', label: 'AURORA', cat: 'sky', group: 'UP HIGH', night: true },
  { id: 'meteor', label: 'METEORS', cat: 'sky', group: 'UP HIGH', night: true },
  { id: 'eclipse', label: 'MOON ECLIPSE', cat: 'sky', group: 'UP HIGH', night: true },
  { id: 'eclipse-sun', label: 'SOLAR ECLIPSE', cat: 'sky', group: 'UP HIGH' },
  { id: 'totality', label: 'TOTALITY', cat: 'sky', group: 'UP HIGH' },
  { id: 'fireworks', label: 'FIREWORKS', cat: 'sky', group: 'FIREWORKS + HOLIDAY SKY', night: true },
  { id: 'finale', label: 'PARTY FINALE', cat: 'sky', group: 'FIREWORKS + HOLIDAY SKY', night: true },
  { id: 'sleigh', label: 'SLEIGH', cat: 'sky', group: 'FIREWORKS + HOLIDAY SKY', night: true },
  { id: 'witch', label: 'WITCH', cat: 'sky', group: 'FIREWORKS + HOLIDAY SKY', night: true },
  { id: 'ufo', label: 'UFO', cat: 'sky', group: 'FIREWORKS + HOLIDAY SKY', night: true, ready: false },          // (ready: false — hidden in the panel until Part 6b
  { id: 'cat', label: 'THE MOON CAT', cat: 'sky', group: 'FIREWORKS + HOLIDAY SKY', night: true, ready: false },  //  builds them for the Harbor; still a valid id)
  { id: 'geese', label: 'GEESE', cat: 'sky', group: 'BIRDS' },
  { id: 'swifts', label: 'SWIFTS', cat: 'sky', group: 'BIRDS' },
  { id: 'bats-dusk', label: 'BATS AT DUSK', cat: 'sky', group: 'BIRDS' },
  { id: 'bats', label: 'HALLOWEEN BATS', cat: 'sky', group: 'BIRDS', night: true },
  { id: 'heron', label: 'HERON', cat: 'sky', group: 'BIRDS' },
  { id: 'rainbow', label: 'RAINBOW', cat: 'weather', group: 'RAINBOWS' },
  { id: 'rainbow2', label: 'DOUBLE RAINBOW', cat: 'weather', group: 'RAINBOWS' },
  { id: 'moonbow', label: 'MOONBOW', cat: 'weather', group: 'RAINBOWS', night: true },
  { id: 'neonbow', label: 'NEON BOW', cat: 'weather', group: 'RAINBOWS', night: true },
  { id: 'lightning', label: 'LIGHTNING', cat: 'weather', group: 'WEATHER FX', hint: 'with WEATHER = STORM' },
  { id: 'freeze', label: 'FROST', cat: 'weather', group: 'WEATHER FX' },
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
  { id: 'placeholders', label: 'PLACEHOLDER PEOPLE', cat: 'speakeasy', group: 'SPEAKEASY', hint: 'the promenade’s placeholder people (hidden until 8b walks the real ones)' },
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
