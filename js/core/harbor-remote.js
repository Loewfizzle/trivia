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
export const REMOTE_KEYS = ['force', 'text', 'show', 'colours', 'colour', 'by', 'cycle', 'style', 'tower', 'scheme', 'game', 'scene', 'when', 'speed', 'wx', 'wxk', 'snow', 'snowman', 'mood', 'debug', 'grid', 'pulse'];
/** SP5 — CLEAR ALL = THE REAL CITY NOW (the owner): every PREVIEW flag a link may carry — the panel's keys (not the tools &debug / &grid)
 *  + the previews' own extras (&moment, &hush, &letter, &ad, &season, &n, &wind, &rained, &tagms) + &at (a place for the sun WITH A FORCED
 *  CLEAR SKY — core/sky.js#skyClock — so it is a preview too: the real city is the zone's city with its LIVE weather). &tz, &city,
 *  &emu, &slot, &panel stay: they are where + how you look, not what is forced. */
export const PREVIEW_KEYS = Object.freeze([...REMOTE_KEYS.filter(k => k !== 'debug' && k !== 'grid'), 'moment', 'hush', 'letter', 'ad', 'season', 'n', 'wind', 'rained', 'tagms', 'at']);
/** the page's search without its preview flags ('?city=2&debug=1' | '' ) + which flags were stripped */
export function realCitySearch(search) {
  const q = new URLSearchParams(search || ''), gone = [];
  for (const k of PREVIEW_KEYS) if (q.has(k)) { gone.push(k); q.delete(k); }
  const s = q.toString();
  return { search: s ? `?${s}` : '', gone };
}

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

/** C2 — THE PANEL REWORK (the owner, Oct 25: "very busy and unorganized"): the full-screen sheet's NINE SECTIONS, in this order. The
 *  CATS above stay the registry's AREAS (an event's `cat`: what part of the city it belongs to — the tests + the links know them);
 *  each area lands in one section (AREA_SECTION) and an event may move on its own with `sec` (the legendaries, the birds in the sky,
 *  the people on the promenade). Inside a section the rows sit in blocks: the panel's own controls + one block per event `group`. */
// (WIN — the owner: "the panel is cluttered again": a SPEAKEASY section of its own — windows / signs / door; the rarely used debug +
// compare rows in TOOLS at the bottom; PLAY ALL rows at the top of their section; the weather's rows in groups — rain / storm / fog / cold)
// 9d — THE ADMIN PANEL (the owner, Oct 27: "put TIME closer to the top, if not the top — I use that one more than anything"; DECIDED):
// TIME + the WEATHER's quick chips live in the PINNED "NOW" bar at the very top (always open: NOW_TIMES, NOW_WEATHER, the date's
// holiday chips — nearHolidays); the sections below, by use: HOLIDAYS · SPEAKEASY (the windows inside) · SKY (+ the rest of the
// weather) · LEGENDARY · PEOPLE + WORKERS · WINTER (the snow, the snowman, the plow) · WILDLIFE · HARBOR · LIGHTS + MUSIC · TOOLS
export const SECTIONS = [
  // (11a-1: THE HOLIDAYS — the date jump + every holiday moment on demand)
  { id: 'holidays', label: 'HOLIDAYS' },
  { id: 'speakeasy', label: 'SPEAKEASY' },
  { id: 'sky', label: 'SKY + WEATHER' },
  { id: 'legendary', label: 'LEGENDARY' },
  { id: 'people', label: 'PEOPLE + WORKERS' },
  { id: 'winter', label: 'WINTER' },
  { id: 'wildlife', label: 'WILDLIFE' },
  { id: 'harbor', label: 'HARBOR' },
  { id: 'lightsmusic', label: 'LIGHTS + MUSIC' },
  { id: 'tools', label: 'TOOLS' },
];
const SEC_IDS = new Set(SECTIONS.map(s => s.id));
/** each area's section (the panel's own blocks use the same ids: time, holidays, weather, party, lights = PULSE, music, sounds, tools) */
export const AREA_SECTION = {
  time: 'sky', holidays: 'holidays', weather: 'sky', sky: 'sky', lights: 'lightsmusic', signs: 'lightsmusic', party: 'lightsmusic',
  speakeasy: 'speakeasy', music: 'lightsmusic', harbor: 'harbor', promenade: 'harbor', windows: 'speakeasy', workers: 'people',
  wildlife: 'wildlife', sounds: 'tools', tools: 'tools',
};
/** an event's section (an unknown id → TOOLS, never lost) */
export const sectionOf = id => { const e = EV[id]; if (!e) return 'tools'; if (e.sec && SEC_IDS.has(e.sec)) return e.sec; return AREA_SECTION[catOf(id)] || 'tools'; };
/** a section id, or an area id (the old categories: the tests' + the shots' openCats(['lights'])), → its section id (null = unknown) */
export const toSection = id => (SEC_IDS.has(id) ? id : id === 'now' ? null : AREA_SECTION[id] || null);
/** the block heading an event sits under in its section (its group; a few areas name themselves first) */
const BLOCK_PREFIX = { workers: 'WORKERS', windows: 'WINDOWS' };
export const blockOf = id => { const e = EV[id]; if (!e) return ''; const p = BLOCK_PREFIX[e.cat]; return p && !(e.group || '').startsWith(p) ? `${p} · ${e.group}` : e.group || ''; };

/** SEARCH (the panel's box): lower case, no accents, no hyphens (F-22 = f22), one space — every word typed must START a word of the row's
 *  text ("rain" finds RAIN + RAINBOW, never the satellite tRAIN) */
export const normQ = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\u2018\u2019`]/g, "'").replace(/-/g, '').replace(/[^a-z0-9'+#\u00d7\u263e ]+/g, ' ').replace(/\s+/g, ' ').trim();
export const matchQuery = (q, text) => { const t = normQ(text).split(' '), w = normQ(q).split(' ').filter(Boolean); return w.length > 0 && w.every(x => t.some(y => y.startsWith(x))); };
/** an event's searchable text: its label, hint, keywords, group, area, section, id */
export function eventText(id) {
  const e = EV[id]; if (!e) return '';
  const area = CATS.find(c => c.id === e.cat), sec = SECTIONS.find(s => s.id === sectionOf(id));
  return [e.label, e.hint, e.kw, e.group, blockOf(id), area && area.label, sec && sec.label, e.id.replace(/-/g, ' '), e.night ? 'night' : ''].filter(Boolean).join(' ');
}

/** THE DELAY (C2): the panel's changes start this many seconds after the sheet closes (EVERYONE: the server's startAt is pushed by it,
 *  so every phone starts on the same beat) — NOW / 3 S / 5 S; the server takes 0–10 */
export const DELAYS = [0, 3, 5];
export const DEFAULT_DELAY = 3;
export const MAX_DELAY = 10;
/** a requested delay → whole seconds 0–MAX_DELAY, or null (not a delay) */
export const cleanDelay = v => { if (v == null || v === '') return 0; const n = Number(v); return Number.isInteger(n) && n >= 0 && n <= MAX_DELAY ? n : null; };

// THE EVENTS: every &force= preview that runs on ?city=2 (cat → its category in the panel, group → the sub-heading inside it). Each
// is a TOGGLE in `force` (several on at once, together with a time / weather / scene / holiday). text: the longest text it takes.
// oneShot: a sky piece started through harbor().sky — EVERYONE's phones start it at the same moment (startAt), a late arrival
// joins mid-flight; the rest are states (on while the remote is on). ready: false = not drawn on the Harbor yet: the panel hides the
// row (the id stays valid for the URL + the server) until the part that builds it flips it.
export const EVENTS = [
  { id: 'drones', label: 'DRONE SHOW', cat: 'sky', kw: 'message text words', group: 'MESSAGES', oneShot: true, inputs: ['text', 'colours', 'colour', 'by', 'cycle'], text: 140, night: true, hint: 'the night version of skytyping: the drones rise into your MESSAGE, a page at a time' },
  { id: 'drones-calm', label: 'DRONES · CALM', cat: 'sky', group: 'MESSAGES', hint: 'with DRONE SHOW: slower, steady lights' },
  { id: 'banner', label: 'BANNER PLANE', cat: 'sky', kw: 'message text words', group: 'MESSAGES', oneShot: true, inputs: ['text'], text: 74, hint: 'A | B | C: up to 3 banners' },
  { id: 'skywrite', label: 'SKYWRITING', cat: 'sky', group: 'MESSAGES', oneShot: true, inputs: ['text'], text: 140, ready: false },   // (6b: CUT — an old link types it)
  { id: 'skytype', label: 'SKYTYPING', cat: 'sky', kw: 'message text words smoke', group: 'MESSAGES', oneShot: true, inputs: ['text'], text: 140, hint: 'up to 3 lines × ~16 letters a page, 3 pages; | starts a page' },
  { id: 'helicopter', label: 'HELICOPTER', cat: 'sky', group: 'AIRCRAFT', oneShot: true },
  { id: 'jets', label: 'AIR SHOW (F-22s)', cat: 'sky', kw: 'fighter jets raptor formation', group: 'AIRCRAFT', oneShot: true, hint: 'a diamond of four stealth fighters: two straight formation flybys, smooth smoke trails by day — July 4th' },
  { id: 'flyby', label: 'SURPRISE FLYBY', cat: 'sky', kw: 'f-22 fighter jets raptor afterburner', group: 'AIRCRAFT', oneShot: true, hint: '2–4 F-22s straight across on afterburner — ~twice a month, golden hour → 11 pm' },
  { id: 'missing-man', label: 'MISSING MAN', cat: 'sky', group: 'AIRCRAFT', oneShot: true, hint: 'a finger-four, #3 pulls up + away — Memorial + Veterans Day' },
  { id: 'balloons', label: 'BALLOONS', cat: 'sky', group: 'AIRCRAFT', oneShot: true },
  { id: 'balloon-festival', label: 'BALLOON FESTIVAL', cat: 'sky', group: 'AIRCRAFT', oneShot: true },
  // (9a — the owner: the balloons STAY UP 45–90 min; the FAST rows show the whole crossing ×12, ~4–7 min)
  { id: 'balloons-fast', label: 'BALLOONS · FAST', cat: 'sky', group: 'AIRCRAFT', oneShot: true, hint: 'the whole slow crossing ×12 — ~4 min instead of 45–60' },
  { id: 'balloon-festival-fast', label: 'FESTIVAL · FAST', cat: 'sky', group: 'AIRCRAFT', oneShot: true, hint: 'the six launches + the crossing ×12' },
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
  { id: 'witch', label: 'WITCH', cat: 'holidays', group: 'HALLOWEEN', night: true, hint: 'she crosses the sky on her broom (the moon when it’s up), a trail of neon sparks + her cackle' },
  // (11a-1 — HALLOWEEN + DAY OF THE DEAD: the moments on demand; the build-up itself is DATE-driven — the HOLIDAY jump or &when=Oct 1 → Nov 3)
  { id: 'ghost-ship', label: 'THE GHOST SHIP', cat: 'holidays', sec: 'legendary', group: 'ON THE WATER', kw: 'halloween legendary galleon green', night: true, hint: 'Halloween night’s legendary: a translucent green ghost ship drifts across the harbor (~2½ min, on a loop)' },
  { id: 'trick-or-treat', label: 'TRICK-OR-TREATERS', cat: 'holidays', group: 'HALLOWEEN', kw: 'kids costumes candy', hint: 'kids in costumes + a grown-up, door to door along the promenade' },
  { id: 'zombies', label: 'ZOMBIES', cat: 'holidays', group: 'HALLOWEEN', kw: 'costume party shamble', night: true, hint: 'a costume party’s zombies shambling along the promenade (playful)' },
  { id: 'sign-web', label: 'THE WEB ON THE SIGN', cat: 'holidays', group: 'HALLOWEEN', kw: 'spider cobweb dew neon', hint: 'the finished web across NEON + its spider, any day (the real one grows Oct 1 → 31)' },
  { id: 'sign-dotd', label: 'THE SIGN · DAY OF THE DEAD', cat: 'holidays', group: 'DAY OF THE DEAD', kw: 'marigold papel picado candles neon', hint: 'the marigold garland, papel picado + candles on NEON, any day' },
  { id: 'black-cat', label: 'THE BLACK CAT', cat: 'holidays', group: 'HALLOWEEN', kw: 'cat hiss tap', hint: 'on the speakeasy’s step — tap it: it hisses + darts off' },
  { id: 'procession', label: 'CANDLELIGHT PROCESSION', cat: 'holidays', group: 'DAY OF THE DEAD', kw: 'dia de muertos catrina mariachi candles', hint: 'Nov 2 at dusk: candles, Catrinas with flower crowns, a mariachi trio along the waterside road' },
  { id: 'parade', label: 'THE BALLOON PARADE', cat: 'holidays', group: 'THANKSGIVING', kw: 'turkey pumpkin acorn cider balloons band handlers thanksgiving', hint: 'Thanksgiving morning 9 → ~11:25: giant balloons on ropes, a marching band, a harvest float down the waterside road; the crowd cheering at the kerb (from its start)' },
  { id: 'sign-thanks', label: 'THE SIGN · HARVEST WREATH', cat: 'holidays', group: 'THANKSGIVING', kw: 'wheat oak leaves gourds bulbs amber neon', hint: 'the harvest wreath round the O + the wheat swags on NEON, any day (the real one goes up Nov 15 → 25)' },
  { id: 'chimneys', label: 'CHIMNEY SMOKE', cat: 'holidays', group: 'THANKSGIVING', kw: 'smoke hearth ovens chimney winter', hint: 'wisps from the speakeasy’s chimney + the skyline’s roofs, leaning in the real wind (Thanksgiving from late morning)' },
  { id: 'xmas-lights', label: 'THE FIRST CHRISTMAS STRINGS', cat: 'holidays', group: 'BLACK FRIDAY', kw: 'christmas bulbs c9 sills cornice awning evening', hint: 'the strings the crew hung on Black Friday, on every evening after (here: up + lit at any hour after dark)' },
  { id: 'treestand', label: 'THE CHRISTMAS-TREE STAND', cat: 'holidays', group: 'BLACK FRIDAY', kw: 'fir trees vendor rack lantern', hint: 'by the bench from Black Friday morning → Christmas Eve: firs on the rack, FRESH TREES, the lantern' },
  { id: 'shoppers', label: 'THE BLACK FRIDAY RUSH', cat: 'holidays', group: 'BLACK FRIDAY', kw: 'shopping bags boxes busy crowd hurry', hint: 'more people out, hurrying, with bags + wrapped boxes (Black Friday by day)' },
  { id: 'monarchs', label: 'MONARCH BUTTERFLIES', cat: 'holidays', group: 'DAY OF THE DEAD', kw: 'butterfly', hint: 'the rare monarchs of Nov 1 + 2, by day' },
  // (PART 6b — THE LEGENDARY SKY: ~1–2 nights a month each for everyone; here on demand, repeating while on — JUST ME or EVERYONE, the same moment)
  { id: 'ufo', label: 'UFO ABDUCTION', cat: 'sky', sec: 'legendary', group: 'IN THE SKY', kw: 'alien saucer beam', oneShot: true, night: true, hint: 'the saucer, the beam, someone lifted off the compass (~30 s)' },
  { id: 'tr3b', label: 'TR-3B + JET CHASE', cat: 'sky', sec: 'legendary', group: 'IN THE SKY', kw: 'triangle ufo blackout power drain f-16 jets tape stop', oneShot: true, night: true, hint: 'the black triangle drains the city’s power, then F-16s chase it (~50 s)' },
  { id: 'cat', label: 'THE MOON CAT', cat: 'sky', group: 'FIREWORKS + HOLIDAY SKY', night: true, ready: false },  // (ready: false — not on the Harbor yet; still a valid id)
  { id: 'geese', sec: 'wildlife', label: 'GEESE', cat: 'sky', group: 'FLYING OVER' },
  { id: 'swifts', sec: 'wildlife', label: 'SWIFTS', cat: 'sky', group: 'FLYING OVER' },
  { id: 'bats-dusk', sec: 'wildlife', label: 'BATS AT DUSK', cat: 'sky', group: 'FLYING OVER' },
  { id: 'bats', label: 'HALLOWEEN BATS', cat: 'holidays', group: 'HALLOWEEN', night: true, hint: 'a colony pours out of a tower’s crown at dusk, then a few jink round the roofs' },
  { id: 'heron-sky', sec: 'wildlife', label: 'HERON (NIGHT CROSSING)', cat: 'sky', group: 'FLYING OVER', hint: 'the rare slow heron crossing a night sky, neck folded (spring → autumn)' },
  { id: 'rainbow', label: 'RAINBOW', cat: 'weather', group: 'RAINBOWS' },
  { id: 'rainbow2', label: 'DOUBLE RAINBOW', cat: 'weather', group: 'RAINBOWS' },
  { id: 'moonbow', label: 'MOONBOW', cat: 'weather', group: 'RAINBOWS', night: true },
  { id: 'neonbow', label: 'NEON BOW', cat: 'weather', group: 'RAINBOWS', night: true },
  { id: 'lightning', label: 'LIGHTNING', cat: 'weather', group: 'WEATHER FX', hint: 'with WEATHER = STORM' },
  { id: 'freeze', sec: 'winter', label: 'FROST', cat: 'weather', group: 'THE COLD' },
  { id: 'halo', label: '22° SUN HALO', cat: 'weather', group: 'WEATHER FX', hint: 'with the HIGH VEIL (a thin cirrostratus sky): the rare faint ring round the sun' },
  { id: 'plow', sec: 'winter', label: 'THE PLOW', cat: 'weather', group: 'SNOW DAYS', hint: '9b: the plow truck clears the waterside road now — in view ~1 s after the tap, the salt truck right behind it; with snow on the ground' },
  { id: 'salt', sec: 'winter', label: 'THE SALT TRUCK', cat: 'weather', group: 'SNOW DAYS', hint: '9b: the salt truck now — its fan of grains + the wet salted lane behind it' },
  { id: 'shovel', sec: 'winter', label: 'SHOVELLING', cat: 'weather', group: 'SNOW DAYS', hint: '9b: the doorman shovels + salts the speakeasy steps; a shoveller on the front walk' },
  { id: 'snowball', sec: 'winter', label: 'SNOWBALL FIGHT', cat: 'weather', group: 'SNOW DAYS', hint: '9b: kids on the plaza (snowy weekend afternoons)' },
  { id: 'slip', sec: 'winter', label: 'A SLIP', cat: 'weather', group: 'SNOW DAYS', hint: '9b: a walker slips + catches themselves (thaw nights)' },
  { id: 'snowman-build', sec: 'winter', label: 'SNOWMAN BUILDERS', cat: 'weather', group: 'SNOW DAYS', hint: '9b: the kids + a grown-up building the January snowman (with THE SNOWMAN at a stage)' },
  { id: 'sign-melt', sec: 'winter', label: 'SIGN SNOW MELTING', cat: 'weather', group: 'SNOW DAYS', hint: '9b: the NEON sign\u2019s snow melting off the lit tubes ×20 (at night, with SNOW ON THE GROUND)' },
  { id: 'awning-slab', sec: 'winter', label: 'AWNING SLAB', cat: 'weather', group: 'SNOW DAYS', hint: '9b: a slab of snow slides off the speakeasy awning (needs snow on the ground: SNOW ON THE GROUND in THE WEATHER)' },
  { id: 'climate', label: 'CLIMATE FALLBACK', cat: 'weather', group: 'WEATHER FX', hint: '9b: the weather as if the live ask failed — this date + place from the climate normals (+ its snow on the ground)' },
  { id: 'sundogs', label: 'SUN DOGS', cat: 'weather', group: 'WEATHER FX', hint: 'with the HIGH VEIL: the 22° halo + its two sun dogs (the rarer bonus)' },
  { id: 'beams', label: 'SKY BEAMS', cat: 'party', group: 'PARTY · ANY NIGHT', night: true, hint: 'the party’s vertical beams from the tall towers' },
  { id: 'searchlights', label: 'SEARCHLIGHTS', cat: 'lights', group: 'THE TOWERS', night: true },
  { id: 'spell', label: 'WORDS IN THE WINDOWS', cat: 'lights', kw: 'message text towers', group: 'THE TOWERS', inputs: ['text', 'style', 'tower'], text: 60, night: true, hint: 'type a message: one word per tower, a word too long for its tower scrolls on it' },
  { id: 'burnout', label: 'BURNT-OUT LETTER', cat: 'signs', group: 'THE CITY’S NEON', night: true },
  { id: 'neon-party', label: 'NEON PARTY', cat: 'party', group: 'PARTY · ANY NIGHT', night: true },
  { id: 'neon-flash', label: 'NEON FLASH', cat: 'signs', group: 'THE CITY’S NEON', inputs: ['game'], night: true },
  { id: 'neon-scheme', label: 'NEON SCHEME', cat: 'signs', group: 'THE CITY’S NEON', inputs: ['scheme'], night: true },
  // (SP3 + SP6 — THE ROOF SIGNS' HOURLY MODES, every named sign in one mode, its turn coming round fast: neon.js#planRoof)
  { id: 'roof-spell', label: 'ROOF SIGNS · SPELL', cat: 'signs', group: 'THE CITY’S NEON', night: true, hint: 'the letters light one by one, a hold, two flashes' },
  { id: 'roof-race', label: 'ROOF SIGNS · RACE', cat: 'signs', group: 'THE CITY’S NEON', night: true, hint: 'a bright pulse once round each sign’s frame' },
  { id: 'roof-breath', label: 'ROOF SIGNS · BREATH', cat: 'signs', group: 'THE CITY’S NEON', night: true, hint: 'a slow brighten / dim, never off' },
  { id: 'roof-wordflash', label: 'ROOF SIGNS · WORD FLASH', cat: 'signs', group: 'THE CITY’S NEON', night: true, hint: 'the 1920s drum flasher: word by word, then both held' },
  { id: 'roof-layers', label: 'ROOF SIGNS · LAYERS', cat: 'signs', group: 'THE CITY’S NEON', night: true, hint: 'built in stages: the border, the letters, the icon' },
  { id: 'roof-twotone', label: 'ROOF SIGNS · TWO-TONE', cat: 'signs', group: 'THE CITY’S NEON', night: true, hint: 'the border + the letters trade colours twice, then settle' },
  { id: 'spell-on', label: 'SPELL-ON ROUND', cat: 'signs', group: 'THE CITY’S NEON', night: true, hint: 'every named sign spells itself on in turn — the next one every 6 s' },
  // (DT1 — THE LIGHTS + SIGNS PASS: the power-up itself is TIME = POWER-UP / POWER-DOWN at SPEED 20)
  { id: 'flood-front', label: 'WATERFRONT FLOODLIGHTS', cat: 'lights', group: 'THE WATERFRONT', night: true, hint: 'the front row’s low warm uplight — compare on / off' },
  { id: 'lamps-on', label: 'BILLBOARD LAMPS ON', cat: 'signs', group: 'THE BILLBOARD', hint: 'its 4 gooseneck lamps held on (by day too)' },
  { id: 'lamps-off', label: 'BILLBOARD LAMPS OFF', cat: 'signs', sec: 'tools', group: 'COMPARE — OFF SWITCHES', night: true, hint: 'the night without them — compare' },
  { id: 'no-halo', label: 'SIGN HALO OFF', cat: 'signs', sec: 'tools', group: 'COMPARE — OFF SWITCHES', hint: 'the tagline + NEON’s dark halo off — compare (the moon behind it)' },
  { id: 'wheel-scheme', label: 'WHEEL SCHEME', cat: 'harbor', group: 'THE PIER + BOATS', inputs: ['scheme'] },
  { id: 'beam-green', label: 'GREEN BEAM', cat: 'harbor', group: 'THE PIER + BOATS', night: true },
  { id: 'rosie-lights', label: 'ROSIE’S LIGHTS', cat: 'harbor', group: 'THE PIER + BOATS', inputs: ['scheme'] },
  { id: 'taxi', label: 'WATER TAXI', cat: 'harbor', group: 'THE PIER + BOATS' },
  { id: 'rosie-turn', label: 'ROSIE’S TURN', cat: 'harbor', group: 'THE PIER + BOATS', hint: 'her homecoming swing on a loop — the 3D model turning in the open water, bow toward us' },
  // (PART 8a — THE PROMENADE: the trees + planters in each season (the real date otherwise); the owner's implied road (on by default)
  // switched off to compare; a car passing along it now (its headlights at night, its shadow by day, its sound))
  { id: 'season-spring', label: 'SPRING', cat: 'promenade', group: 'THE SEASON', hint: 'the crabapple in blossom, fresh light-green maples, tulips' },
  { id: 'season-summer', label: 'SUMMER', cat: 'promenade', group: 'THE SEASON', hint: 'full green trees, geraniums' },
  { id: 'season-autumn', label: 'AUTUMN', cat: 'promenade', group: 'THE SEASON', hint: 'the maples red / orange / gold, leaves falling, mums' },
  { id: 'season-winter', label: 'WINTER', cat: 'promenade', group: 'THE SEASON', hint: 'bare branches, evergreen boughs (snow comes with Part 9)' },
  { id: 'no-implied-road', label: 'IMPLIED ROAD OFF', cat: 'promenade', sec: 'tools', group: 'COMPARE — OFF SWITCHES', hint: 'the curb + the passing cars’ light gone — compare' },
  { id: 'road-pass', label: 'A CAR PASSING', cat: 'promenade', group: 'THE IMPLIED ROAD', hint: 'a car every ~13 s: headlights at night, a shadow by day, its sound — seen on the street while the dock rests' },
  { id: 'wet-street', label: 'WET STREET', cat: 'promenade', group: 'THE IMPLIED ROAD', hint: 'the street under the dock after rain: puddles, the lamps’ reflections (Part 9’s hook)' },
  // (PF: the centrepiece spot's EVENT RIG at work — a placeholder obelisk on the brick inlay, lit from below by its floor spots at night)
  { id: 'centrepiece-test', label: 'CENTREPIECE TEST', cat: 'promenade', sec: 'tools', group: 'DEBUG PIECES', hint: 'a test obelisk on the brick inlay, lit by its floor spots after dark (the holidays’ pieces stand here)' },
  { id: 'strings-party', label: 'CAFÉ LIGHTS · PARTY', cat: 'speakeasy', group: 'THE SIGNS + LIGHTS', night: true, hint: 'the speakeasy roof’s café-light canopy in party mode' },
  // (8P: THE PEOPLE — the lobby line at the door (&n= guests, 6 by default; Lobby 2.0 fills it), a bus every minute, everyone off to compare)
  { id: 'line', sec: 'speakeasy', label: 'THE LOBBY LINE', cat: 'promenade', group: 'THE DOOR', hint: 'guests lined up at the speakeasy’s door (6; &n=<guests>) — Lobby 2.0 fills it with the room' },
  { id: 'bus', sec: 'people', label: 'A BUS EVERY MINUTE', cat: 'promenade', group: 'ON THE PROMENADE', hint: 'the 1920s bus arriving, stopping at the curb, riders on + off, pulling away on green' },
  { id: 'joggers', sec: 'people', label: 'THE JOGGERS', cat: 'promenade', group: 'ON THE PROMENADE', kw: 'jogger run running runner', hint: 'a jogger through every ~20 s (their own hours: early, lunch 12–1, after work 5–7, weekend mornings 8–10 — one every 1–2 min)' },
  { id: 'dance', sec: 'people', label: 'THE DANCE CIRCLE', cat: 'promenade', group: 'ON THE PROMENADE', hint: 'the glow-wand dancers on the compass inlay — a circle every 5 minutes (best with PARTY ON)' },
  { id: 'doors', sec: 'speakeasy', label: 'THE DOORS', cat: 'promenade', group: 'THE DOOR', hint: 'every 24 s someone walks through a real door — the side door at night (its amber spill), the barbershop by day (FP3b)' },
  { id: 'no-dance', sec: 'tools', label: 'NO DANCE CIRCLE', cat: 'promenade', group: 'COMPARE — OFF SWITCHES', hint: 'a party night without the glow-wand circle — compare (its cost)' },
  { id: 'no-people', sec: 'tools', label: 'NO PEOPLE', cat: 'promenade', group: 'COMPARE — OFF SWITCHES', hint: 'the promenade + the roof empty — compare' },
  // PART 8b1 — THE WORKERS' SCHEDULE: each one on a loop (its own clock: a few minutes, the long shows joined mid-way); NO WORKERS: compare
  { id: 'work-xlights', label: 'THE CHRISTMAS LIGHTS CREW', cat: 'workers', group: 'MORNING', kw: 'black friday christmas strings bulbs electrician van stepladder rig', hint: 'Black Friday 9:45 → noon: the electrician’s van, the riggers on the washers’ platform hanging big bulbs along every sill + the cornice, a stepladder along the awning' },
  { id: 'work-raker', label: 'THE LEAF RAKER', cat: 'workers', group: 'MORNING', kw: 'leaves rake autumn thanksgiving', hint: 'Nov 4 → 22 late morning (Mon–Sat): a groundskeeper rakes the fallen leaves under the trees into piles, bags them + carries the sack off' },
  { id: 'work-sweeper', label: 'THE STREET SWEEPER', cat: 'workers', group: 'MORNING', hint: '~5:30 Mon–Sat: a white wing with his can cart, slow passes, a wet streak drying on the cobbles' },
  { id: 'work-milk', label: 'THE MILK TRUCK', cat: 'workers', group: 'MORNING', hint: '6:00 sharp: the milkman leaves his bottles on the barbershop step (they wait there till the barber, 8:30)' },
  { id: 'work-newsdrop', label: 'THE NEWSPAPER VAN', cat: 'workers', group: 'MORNING', hint: '~6:35: two bundles dropped at the vendor spot before the newsboy comes' },
  { id: 'work-trash', label: 'THE TRASH TRUCK', cat: 'workers', group: 'MORNING', hint: 'weekday mornings: the collector fetches the street’s cans from the curb off screen, tips them in at the truck’s tail' },
  { id: 'work-newsboy', label: 'THE NEWSBOY', cat: 'workers', group: 'MORNING', hint: '7:00 sharp (weekends 8:00): his folding stand, papers held up, buyers now + then' },
  { id: 'work-barber', label: 'THE BARBER', cat: 'workers', group: 'MORNING', hint: '8:30 sharp: the milk taken in, into the shop, out with his broom, the awning cranked' },
  { id: 'work-cop', label: 'THE BEAT COP', cat: 'workers', group: 'MORNING', hint: '9:00 am + 9:00 pm: a friendly stroll, the baton twirled, a tip of the hat' },
  { id: 'work-bulb', label: 'BULB REPAIR (THE BLADE)', cat: 'workers', group: 'MORNING', hint: 'the morning after a blade bulb dies: a tall ladder at the corner, the swap, a test flicker' },
  { id: 'work-lamp', label: 'LAMP REPAIR', cat: 'workers', group: 'MORNING', hint: 'the morning after a lamppost’s bad night: a stepladder at that lamp' },
  { id: 'work-ice', label: 'THE ICE MAN', cat: 'workers', group: 'MIDDAY', hint: 'mid-morning weekdays: an ice block on his shoulder to the side door' },
  { id: 'work-mail', label: 'THE MAILMAN', cat: 'workers', group: 'MIDDAY', hint: '~10:30: the post through the barbershop’s door' },
  { id: 'work-washers', label: 'THE WINDOW WASHERS', cat: 'workers', group: 'MIDDAY', hint: 'Tue + Fri late morning: their hanging platform, the upper floor then the one below' },
  { id: 'work-gardener', label: 'THE ROOFTOP GARDENER', cat: 'workers', group: 'MIDDAY', hint: 'Wednesdays: the roof beds tended, bed by bed' },
  { id: 'work-hydrant', label: 'THE HYDRANT (HOT DAY)', cat: 'workers', group: 'MIDDAY', hint: 'hot summer afternoons (≥ 29 °C / 85 °F, the real weather): a city worker opens the fire hydrant — the spray, a kid running through, the wet patch drying' },
  { id: 'hydrant', sec: 'people', label: 'THE HYDRANT SPRAY', cat: 'promenade', group: 'ON THE PROMENADE', hint: 'the hot-day hydrant on a loop (= WORKERS → THE HYDRANT): the worker in with his wrench, the spray, the kid, shut, away' },
  { id: 'work-soda', label: 'THE SODA WATER TRUCK', cat: 'workers', group: 'MIDDAY', hint: '~2 pm weekdays: crates of “soda water” in at the side door' },
  { id: 'work-painters', label: 'THE SIGN PAINTERS', cat: 'workers', group: 'MIDDAY', hint: 'Mondays 1–4 pm: the blade repainted for the new week (paint-out, chalk, letters, gilt) — compressed into 20 min' },
  { id: 'work-sweep2', label: 'THE EXTRA SWEEP', cat: 'workers', group: 'MIDDAY', hint: 'the morning after a party night' },
  { id: 'work-crew', label: 'THE ROOF CLEANUP CREW', cat: 'workers', group: 'MIDDAY', hint: 'the morning after a party night: the roof deck swept, the bottles gathered' },
  { id: 'work-bartender', label: 'THE BARTENDER', cat: 'workers', group: 'EVENING', hint: '~4 pm: in at the side door (the bar’s window lights up behind him)' },
  { id: 'work-patrol', label: 'THE 9 PM PATROL', cat: 'workers', group: 'EVENING', hint: 'the beat cop again at 9:00 pm, the other way along the promenade' },
  { id: 'work-evening', label: 'THE EVENING EDITION', cat: 'workers', group: 'EVENING', hint: '4:30 → 6:30 pm weekdays: the newsboy back at his stand' },
  { id: 'work-billposter', label: 'THE BILLPOSTER', cat: 'workers', group: 'EVENING', hint: '~5–6 pm daily: up on the catwalk, the new poster pasted sheet by sheet (a dead lamp fixed)' },
  { id: 'work-doorman', label: 'THE DOORMAN', cat: 'workers', group: 'EVENING', hint: 'from dusk: at his post by the side door' },
  { id: 'work-flowers', label: 'THE FLOWER SELLER', cat: 'workers', group: 'EVENING', hint: 'dusk, Wed–Sat: a basket of flowers for the couples heading in' },
  { id: 'work-musician', label: 'THE MUSICIAN', cat: 'workers', group: 'EVENING', hint: '~8 pm: the band’s bass player with his case, in at the side door' },
  { id: 'work-bootleg', label: 'THE BOOTLEGGERS', cat: 'workers', group: 'NIGHT', hint: '~11 pm, a few nights a month: a truck without lamps, crates down the cellar hatch, a lookout' },
  { id: 'work-delivery', label: 'THE BIG DELIVERY', cat: 'workers', group: 'NIGHT', hint: 'Saturdays ~6:30 pm: the bootleggers’ big load before the party night' },
  { id: 'work-staff', label: 'THE BAR STAFF LOCK UP', cat: 'workers', group: 'NIGHT', hint: '~2 am: out of the side door, the last one locks it' },
  { id: 'work-henchman', label: 'THE NIGHT SHIFT (HENCHMAN)', cat: 'workers', group: 'NIGHT', kw: 'security patrol flashlight guard boss', hint: '2 → 6 am every night + Sun–Thu 11:24 pm → 12:51 am: the boss’s henchman patrols the block with a flashlight — the beat, the corner, the door, a lap round the block' },
  { id: 'work-henchman2', label: 'THE NIGHT SHIFT · LATE WEEKNIGHTS', cat: 'workers', group: 'NIGHT', kw: 'security patrol flashlight guard', hint: 'Sun–Thu 11:24 pm → 12:51 am: the henchman’s earlier round (the same patrol)' },
  { id: 'work-hoser', label: 'THE WATER WAGON’S HOSE', cat: 'workers', group: 'NIGHT', kw: 'hydrant hose wash street flusher', hint: '~3 am while the water wagon washes the street (not after rain, below freezing or on snow): a crewman opens the hydrant + hoses the cobbles' },
  { id: 'flusher', label: 'THE WATER WAGON', cat: 'workers', group: 'NIGHT', kw: 'street flusher wash spray truck', hint: '~2:45 → 3:30 am (not after rain, below freezing or on snow): the street flusher’s slow passes on the back road, fans of spray caught in the lamps, the road left wet — on a loop' },
  { id: 'no-work', label: 'NO WORKERS', cat: 'workers', sec: 'tools', group: 'COMPARE — OFF SWITCHES', hint: 'every worker stays home — compare (their cost)' },
  // PART 8b1 — THE HARBOR'S TIMETABLE, heard (every 30 s while on)
  { id: 'ships-bell', label: 'THE SHIP’S BELL', cat: 'harbor', group: 'THE TIMETABLE', hint: 'the hourly bell (one ring, under the music) — every 30 s' },
  // 9e — THE CONSTRUCTION TOWER (core/harbor-tower.js): its stages + the implosion on a loop (the real cycle starts with April 2027's implosion)
  { id: 'implosion', label: 'THE IMPLOSION', cat: 'harbor', group: 'THE CONSTRUCTION TOWER', kw: 'demolition tower dust siren', hint: 'the third Sunday of April, 10 am: the siren, the horns, the charges down the floors, the drop, the dust over the harbor — every 5 min from the flag' },
  { id: 'build-rubble', label: 'TOWER · THE EMPTY LOT', cat: 'harbor', group: 'THE CONSTRUCTION TOWER', kw: 'construction rubble dust lot', hint: 'the days after the implosion: the gap in the skyline, the dust settling' },
  { id: 'build-rising', label: 'TOWER · RISING', cat: 'harbor', group: 'THE CONSTRUCTION TOWER', kw: 'construction crane frame steel', hint: 'June 1 → September 1: the steel frame climbing with the crane, work lights at night (&buildk=0..1: how far up)' },
  { id: 'build-topping', label: 'TOWER · TOPPING OUT', cat: 'harbor', group: 'THE CONSTRUCTION TOWER', kw: 'construction evergreen flag crane', hint: 'Sept 1–8: the full frame, a little evergreen + a flag on the top beam' },
  { id: 'build-finishing', label: 'TOWER · FINISHING (DARK)', cat: 'harbor', group: 'THE CONSTRUCTION TOWER', kw: 'construction shell dark', hint: 'September 8 → the opening: the new tower clad, dark — no neon yet; the crane down mid-September' },
  { id: 'build-opening', label: 'TOWER · THE GRAND OPENING', cat: 'harbor', group: 'THE CONSTRUCTION TOWER', kw: 'opening searchlights neon new tower', hint: 'the first Saturday of October from 7 pm: its neon lit for the first time, two searchlights' },
  { id: 'build-finished', label: 'TOWER · FINISHED (NEXT DESIGN)', cat: 'harbor', group: 'THE CONSTRUCTION TOWER', kw: 'new tower design', hint: 'the winter: the new design standing (each cycle a different one)' },
  { id: 'build-standing', label: 'TOWER · TODAY’S', cat: 'harbor', group: 'THE CONSTRUCTION TOWER', kw: 'tower original', hint: 'the tower as it stands today (until April 2027)' },
  { id: 'build-cleanup', label: 'TOWER · THE CLEANUP', cat: 'harbor', group: 'THE CONSTRUCTION TOWER', kw: 'construction lot excavator', hint: 'late April → June: the lot cleared behind JAZZ (the gap)' },
  { id: 'church-bells', label: 'SUNDAY’S CHURCH BELLS', cat: 'harbor', group: 'THE TIMETABLE', kw: 'church sunday bells peal', hint: 'Sundays 9:00 + 10:45 am: a far, soft peal across the harbor (40 s) — every 30 s' },
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
  { id: 'no-wildlife', label: 'NO WILDLIFE', cat: 'wildlife', sec: 'tools', group: 'COMPARE — OFF SWITCHES', hint: 'every animal off — compare (the speed A/B)' },
  // (8P: THE HUSH WORD SIGN in the barbershop window — JAZZ by default, &hush=<word> another; Lobby 2.0 lights the real word)
  // (8b2 — THE RAID: the patrol cars every 2½ minutes; RAID + PARTY = a party night's — the club comes back louder)
  { id: 'raid', label: 'THE RAID', cat: 'speakeasy', sec: 'legendary', group: 'ON THE STREET', kw: 'police cops patrol cars flashlight', night: true, hint: 'black-and-white patrol cars, red + blue on the walls — every light in the speakeasy cuts out, an officer sweeps the windows with his flashlight (every 2½ min)' },
  { id: 'hushsign', label: 'HUSH WORD SIGN', cat: 'speakeasy', group: 'THE SIGNS + LIGHTS', kw: 'password door plate', hint: 'the lobby’s password in ice-cyan neon on the door’s plate — the brick pier by the blade (JAZZ; &hush=<word>)' },
  // ---- THE FIRST-TAP SURGE (PART 7a §0 — the layout agent builds it: the NEON sign's surge at the first tap). Registered so the
  // URL flag + city2/live accept it; ready: false keeps the row hidden until its effect reads the Harbor clock's force Set
  // (harbor().flags.force / the scene's clock — a title-level regex on location.search can't be switched from the panel). Rename
  // the id here if the effect lands under another name; flip ready when it's drawn.
  // ---- PART 7b — THE WINDOWS: &force=window&moment=<id> (the links; hidden: the panel can't type a moment) + one row per moment
  // (&force=window-<id>), grouped by rarity — the catalogue's own list (core/harbor-moments.js#MOMENTS), so a new moment is a new row
  { id: 'window', label: 'WINDOW MOMENT', cat: 'windows', group: 'ROUTINES', ready: false, hint: 'with &moment=<id>' },
  // WIN3 — THE PARTY IN THE WINDOWS (&force=window-party): the peak's window party from the start, the rooms up one by one
  { id: 'window-party', label: 'THE PARTY IN THE WINDOWS', cat: 'windows', group: 'PARTY NIGHTS', kw: 'dance blinds neon crowd jump wands party', night: true, hint: 'the party’s peak in the windows: the blinds go up one room at a time (~every 10 s), each room a dance party in its own neon colour — silhouettes jumping on the beat, a few glow wands, the colour spilling onto the cobbles; the boss’s TV room never joins; a raid cuts it' },
  // SP5 — THE BOSS's ROOM: the bootleggers' tell (the violet lamp + the spade behind his drawn shade, lit the afternoon before a delivery
  // until the truck comes), him at the shade on a party night (the shade down, his shadow + the cigar's ember)
  { id: 'boss-signal', label: 'THE BOOTLEGGERS’ TELL', cat: 'windows', group: 'THE TV ROOM', kw: 'boss violet spade lamp shade bootleg signal tell', hint: 'the violet lamp + the dark spade behind the boss’s drawn shade — lit from 3 pm before Saturday’s delivery (5 pm before a weeknight run) until the truck arrives' },
  { id: 'boss-watch', label: 'THE BOSS AT THE SHADE', cat: 'windows', group: 'THE TV ROOM', kw: 'boss shadow shade party cigar ember watch', night: true, hint: 'a party night: his shade all the way down, glowing with the set’s light — now + then his shadow stands against it looking down at the street, the cigar’s ember glowing through' },
  { id: 'smoke', label: 'A HAZE IN THE TV ROOM', cat: 'windows', group: 'THE TV ROOM', kw: 'smoke cigarette haze blue boss', night: true, hint: 'a faint haze in the boss’s dark room catching the screen’s blue (the TV on: 10 pm → 3 am) — nobody is ever seen' },
  ...MOMENTS.map(m => ({ id: `window-${m.id}`, label: m.label.replace(' (LEGENDARY)', ''), cat: 'windows', sec: m.rarity === 'legendary' ? 'legendary' : undefined, group: m.holiday === 'thanksgiving' ? 'THANKSGIVING' : m.starter === false ? 'THE MIRROR DOOR' : m.rarity === 'routine' ? 'ROUTINES' : m.rarity.toUpperCase(), night: m.light === 'night' || m.id === 'lights-out' || undefined, hint: `${m.kind}${m.at != null ? ` — ~${m.at}:00 every day` : ''}` })),
  { id: 'first-tap', label: 'FIRST-TAP SURGE', cat: 'signs', sec: 'tools', group: 'DEBUG PIECES', hint: 'the NEON sign’s first-tap surge, as on the first tap (by day: a surge through the glass; at night: a brighter race)' },
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
    if (e.sec != null && !SEC_IDS.has(e.sec)) bad.push(`sec:${e.id}:${e.sec}`);
    if (!e.label || typeof e.label !== 'string') bad.push(`label:${e.id}`);
    for (const k of e.inputs || []) if (!INPUTS[k] || !REMOTE_KEYS.includes(k)) bad.push(`input:${e.id}:${k}`);
  }
  if (CAT_IDS.size !== CATS.length) bad.push('cats:dup');
  if (SEC_IDS.size !== SECTIONS.length) bad.push('sections:dup');
  // (9d: no duplicates — one label, one row, in one section)
  { const seen = new Map(); for (const e of PANEL_EVENTS) { const k = `${e.label}`; if (seen.has(k)) bad.push(`label:dup:${k}:${seen.get(k)}+${e.id}`); else seen.set(k, e.id); } }
  for (const c of CATS) if (!SEC_IDS.has(AREA_SECTION[c.id])) bad.push(`area:${c.id}`);
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
  // (9d: the NOW bar's two set hours)
  { id: '10pm', label: '10 PM', more: true },
];
// (9d: 2 AM first among the MORE rows — the list stays in the clock's order)
TIMES.splice(TIMES.findIndex(t => t.id === 'late'), 0, { id: '2am', label: '2 AM', more: true });
/** 9d — THE NOW BAR's time chips, in the day's order (the owner's list: dawn · morning · noon · golden hour · dusk · 10 pm · 2 am · TODAY —
 *  TODAY is the panel's own: back to the real clock); the rest of TIMES sits under MORE TIME */
export const NOW_TIMES = ['dawn', 'morning', 'noon', 'golden', 'dusk', '10pm', '2am'];
/** 9d — THE NOW BAR's weather chips (WEATHER ids; a tap on the one that's on = back to the real weather) + their short labels */
export const NOW_WEATHER = [['clear', 'CLEAR'], ['clouds', 'CLOUDS'], ['rain', 'RAIN'], ['storm', 'STORM'], ['snow', 'SNOW'], ['fog', 'FOG'], ['freezing', 'FREEZE'], ['windy', 'WINDY']];
export const SPEEDS = [1, 20, 60];
/** 9b: SNOW ON THE GROUND (&snow=; AUTO = the real ground — the live depth, the climate's on a preview clock) */
/** 9b: THE JANUARY SNOWMAN's stages (&snowman=; AUTO = the real one) */
export const SNOWMAN_STAGES = [{ id: 'base', label: 'BASE' }, { id: 'head', label: 'HEAD' }, { id: 'carrot', label: 'CARROT' }, { id: 'done', label: 'DONE' }, { id: 'slump', label: 'SLUMP' }, { id: 'melt', label: 'MELT' }];
export const SNOW_GROUND = [{ id: 'fresh', label: 'FRESH' }, { id: 'older', label: 'OLDER' }, { id: 'banks', label: 'PLOWED BANKS' }, { id: 'thaw', label: 'THAW' }, { id: 'spring', label: 'SPRING' }, { id: 'none', label: 'NONE' }];
/** 9a: the forced weather's INTENSITY (&wxk=; AUTO = the state's own) */
export const WX_INTENSITY = [{ id: 'light', label: 'LIGHT' }, { id: 'medium', label: 'MEDIUM' }, { id: 'heavy', label: 'HEAVY' }];
/** 8a — PULSE STRENGTH (LIGHTS): the beat punch × this, in percent — the state's `pulse` (absent = the default, core/harbor-beat.js
 *  #PULSE_DEFAULT: the owner's pick locks in there), the URL's &pulse=<percent> */
export const PULSE = { min: Math.round(PULSE_MIN * 100), max: Math.round(PULSE_MAX * 100), step: Math.round(PULSE_STEP * 100), def: Math.round(PULSE_DEFAULT * 100) };
/** CITY 2.0 MUSIC: the moods the panel can force (the same ids as audio/mood.js#MOODS; AUTO = no `mood` key) */
export const MUSIC_MOODS = [{ id: 'morning', label: 'MORNING' }, { id: 'day', label: 'DAY' }, { id: 'evening', label: 'EVENING' }, { id: 'late', label: 'LATE NIGHT' }, { id: 'party', label: 'PARTY' }];
// (WIN: each row in a GROUP the panel shows as a labelled run — the sky's cover, rain, storm, fog, cold)
export const WEATHER = [
  { id: 'clear', label: 'CLEAR', group: 'THE SKY' }, { id: 'clouds', label: 'CLOUDS', group: 'THE SKY' }, { id: 'cirrus', label: 'HIGH CIRRUS', group: 'THE SKY' }, { id: 'veil', label: 'HAZY VEIL', group: 'THE SKY' },
  { id: 'overcast', label: 'OVERCAST', group: 'THE SKY' },
  // (FP3a — the weather by layers: a 600 m MIST (no banks), a low STRATUS deck, a HIGH OVERCAST = a bright veil, never grey)
  { id: 'stratus', label: 'LOW STRATUS', group: 'THE SKY' }, { id: 'highovercast', label: 'HIGH OVERCAST', group: 'THE SKY' },
  // (9a — THE WEATHER: one row per state — each also a link flag: &force=drizzle|rain|heavy-rain|storm|fog|mist|windy|freezing-rain)
  { id: 'drizzle', label: 'DRIZZLE', group: 'RAIN' }, { id: 'rain', label: 'RAIN', group: 'RAIN' }, { id: 'heavy', label: 'HEAVY RAIN', group: 'RAIN' },
  { id: 'storm', label: 'STORM', group: 'STORM' }, { id: 'windy', label: 'WINDY', group: 'STORM' },
  { id: 'fog', label: 'FOG', group: 'FOG' }, { id: 'mist', label: 'MIST', group: 'FOG' },
  { id: 'freezing', label: 'FREEZING RAIN', group: 'COLD' }, { id: 'snow', label: 'SNOW', group: 'COLD' },
];
export const WEATHER_GROUPS = [...new Set(WEATHER.map(w => w.group))];
const lastMonday = (y, m) => { const d = new Date(Date.UTC(y, m, 0)); return d.getUTCDate() - ((d.getUTCDay() + 6) % 7); };
/** the holiday looks (core/sky.js#holidayOf + the holiday sky's own days, core/harbor-sky.js#SKY_HOLIDAYS) and their date */
export const HOLIDAYS = [
  { id: 'valentine', label: 'VALENTINE’S', date: () => ({ m: 2, d: 14 }) },
  { id: 'stpatrick', label: 'ST PATRICK’S', date: () => ({ m: 3, d: 17 }) },
  { id: 'easter', label: 'EASTER', date: y => easter(y) },
  { id: 'memorial', label: 'MEMORIAL DAY', date: y => ({ m: 5, d: lastMonday(y, 5) }) },
  { id: 'july4', label: 'JULY 4TH', date: () => ({ m: 7, d: 4 }) },
  { id: 'halloween-10', label: 'HALLOWEEN · OCT 10', date: () => ({ m: 10, d: 10 }) },
  { id: 'halloween-20', label: 'HALLOWEEN · OCT 20', date: () => ({ m: 10, d: 20 }) },
  { id: 'halloween-27', label: 'HALLOWEEN · OCT 27', date: () => ({ m: 10, d: 27 }) },
  { id: 'halloween', label: 'HALLOWEEN', date: () => ({ m: 10, d: 31 }) },
  { id: 'dotd', label: 'DAY OF THE DEAD · NOV 1', date: () => ({ m: 11, d: 1 }) },
  { id: 'dotd-2', label: 'DAY OF THE DEAD · NOV 2', date: () => ({ m: 11, d: 2 }) },
  { id: 'veterans', label: 'VETERANS DAY', date: () => ({ m: 11, d: 11 }) },
  // (11a-2: the November build-up by date, the homecoming party night, the day, Black Friday)
  { id: 'thanks-10', label: 'THANKSGIVING · NOV 10', date: () => ({ m: 11, d: 10 }) },
  { id: 'thanks-20', label: 'THANKSGIVING · NOV 20', date: () => ({ m: 11, d: 20 }) },
  { id: 'thanks-wed', label: 'THE HOMECOMING PARTY (WED)', date: y => { const t = thanksgiving(y); return { m: t.m, d: t.d - 1 }; } },
  { id: 'thanksgiving', label: 'THANKSGIVING', date: y => thanksgiving(y) },
  { id: 'blackfriday', label: 'BLACK FRIDAY', date: y => { const t = thanksgiving(y); return { m: t.m, d: t.d + 1 }; } },
  { id: 'christmas-eve', label: 'CHRISTMAS EVE', date: () => ({ m: 12, d: 24 }) },
  { id: 'christmas', label: 'CHRISTMAS', date: () => ({ m: 12, d: 25 }) },
  { id: 'nye', label: 'NEW YEAR’S EVE', date: () => ({ m: 12, d: 31 }) },
];
/**
 * 9d — THE DATE's HOLIDAY CHIPS (the NOW bar): the holidays coming up within `days` of `today` ({ y, m, d }) — this year's or next
 * year's — soonest first, at most `n` (PURE). Today's own holiday counts (0 days).
 */
export function nearHolidays(today, n = 3, days = 50) {
  const t0 = Date.UTC(today.y, today.m - 1, today.d), out = [];
  for (const hd of HOLIDAYS) for (const y of [today.y, today.y + 1]) {
    const dt = hd.date(y), dd = Math.round((Date.UTC(y, dt.m - 1, dt.d) - t0) / 864e5);
    if (dd >= 0 && dd <= days) { out.push({ id: hd.id, label: hd.label, days: dd }); break; }
  }
  return out.sort((a, b) => a.days - b.days || HOLIDAYS.findIndex(h => h.id === a.id) - HOLIDAYS.findIndex(h => h.id === b.id)).slice(0, n);
}
/** 9d: a row's hint as the line under its label — the build's tag (9b:, FP3b —, WIN:) left off */
export const shortHint = t => String(t || '').replace(/^\s*(?:[A-Z]{0,4}\d+[a-z]?\d?|[A-Z]+)\s*(?::|—|-)\s*/, '').trim();
/** WIN — PLAY ALL (the owner): ONE button per catalogue that plays every row in turn, each its full length, in its own window / spot,
 *  looping until stopped — a sequencer in the panel (remote.js#playAll) on THIS phone (JUST ME): the day rows by day, the night rows
 *  tonight (the clock jumps once per half), a holiday row on its holiday's night. The same idea for every catalogue below. */
export const PLAY_ALL = Object.freeze([
  { kind: 'windows', sec: 'speakeasy', label: 'PLAY ALL SCENES', hint: 'every window moment in turn, each its full length, in its own window — the day ones by day, the night ones tonight; a chip beside the pill says which (tap it to skip, ❚❚ to pause, ✕ to stop); looping until stopped' },
  { kind: 'holidays', sec: 'holidays', label: 'PLAY ALL HOLIDAY MOMENTS', hint: 'every holiday piece in turn on its holiday’s night, 45 s each' },
  { kind: 'wildlife', sec: 'wildlife', label: 'PLAY ALL ANIMALS', hint: 'every animal + behaviour in turn, 45 s each' },
  { kind: 'workers', sec: 'people', label: 'PLAY ALL WORKERS', hint: 'every worker’s show in turn, 60 s each' },
  { kind: 'winter', sec: 'winter', label: 'PLAY ALL WINTER', hint: '9c: the plow + the salt truck, the shovellers, the snowball fight, the slip, the snowman’s builders, the sign’s snow melting, the awning slab — each with its snow on the ground + at its own hour, 40 s each' },
]);
/** 9c — PLAY ALL WINTER: each winter row's own set-up (the snow on the ground it needs, snow falling, its hour) */
const WINTER_PLAY = {
  plow: { state: { snow: 'fresh', wx: 'snow' }, hour: 13 }, salt: { state: { snow: 'fresh' }, hour: 13.5 },
  shovel: { state: { snow: 'fresh' }, hour: 7.75 }, snowball: { state: { snow: 'older' }, hour: 14.5 }, slip: { state: { snow: 'thaw' }, hour: 20.5, night: true },
  'snowman-build': { state: { snow: 'fresh', snowman: 'head' }, hour: 12 }, 'sign-melt': { state: { snow: 'fresh' }, hour: 21.5, night: true }, 'awning-slab': { state: { snow: 'fresh' }, hour: 11 },
};
/** the playlist of a catalogue → [{ id (the force id), label, len (s), night, hol }] — the day rows first, then the night rows */
/** WIN2 — a window moment's OWN hour (decimal, 0–24): a routine's `at`; else the middle of its hours (wrapping past midnight — an hour
 *  under 6 belongs to the next day's small hours); a moment with no hours plays at 20:30 at night, 14:00 by day */
export function momentHour(m) {
  if (m.at != null) return m.at + 0.25;
  if (m.hours) { const [a, b] = m.hours, span = (b >= a ? b - a : b + 24 - a); return ((a + span / 2) % 24 + 24) % 24; }
  return m.light === 'night' ? 20.5 : 14;
}
export function playlistOf(kind) {
  let items;
  if (kind === 'windows') items = [...MOMENTS.map(m => ({ id: `window-${m.id}`, label: m.label.replace(' (LEGENDARY)', ''), len: Math.round((m.rarity === 'holiday' ? 75 : m.len) + 3.7), night: m.light === 'night' || m.id === 'lights-out', hol: m.holiday || null, hour: momentHour(m) })),
    { id: 'window-party', label: 'THE PARTY IN THE WINDOWS', len: 90, night: true, hol: null, hour: PARTY_HOUR }];   // (WIN3: the rooms up one by one over ~60 s, then the dancing)
  else {
    const holOf = e => (e.group === 'HALLOWEEN' || e.group === 'ON THE WATER' ? 'halloween' : e.group === 'DAY OF THE DEAD' ? 'dotd' : e.group === 'THANKSGIVING' ? 'thanksgiving' : null);
    const rows = PANEL_EVENTS.filter(e => !e.id.startsWith('no-') && (kind === 'holidays' ? e.cat === 'holidays' : kind === 'wildlife' ? e.cat === 'wildlife' : kind === 'workers' ? e.cat === 'workers' : kind === 'winter' ? e.group === 'SNOW DAYS' : false));
    if (kind === 'winter') return rows.map(e => { const w = WINTER_PLAY[e.id] || { state: { snow: 'fresh' }, hour: 13 }; return { id: e.id, label: e.label, len: 40, night: !!w.night, hol: null, hour: w.hour, state: w.state }; });   // (the plow first, in the catalogue's order)
    items = rows.map(e => ({ id: e.id, label: e.label, len: kind === 'workers' ? 60 : 45, night: !!e.night, hol: kind === 'holidays' ? holOf(e) : null, hour: e.night ? 22.5 : 14 }));
  }
  return [...items.filter(i => !i.night), ...items.filter(i => i.night)];
}
/** WIN3 — a WINDOW ROW's own wall time (the owner: the panel's window rows did nothing — a day moment by day, or a night moment while a
 *  chosen time held the clock by day): a `window-<id>` force id → that moment's own hour on the day (momentHour: a routine's `at`, else
 *  the middle of its hours; the small hours on the next day), or null for anything else. forceOn() jumps JUST ME's clock to it. */
export const PARTY_HOUR = 22.5;   // (WIN3: the window party's row + PLAY ALL item play at the peak)
export function momentWhen(id, day) {
  if (id === 'window-party') return itemWhen({ hour: PARTY_HOUR, night: true }, day);
  const m = typeof id === 'string' && id.startsWith('window-') ? MOMENTS.find(x => x.id === id.slice(7)) : null;
  return m ? itemWhen({ hour: momentHour(m), night: m.light === 'night' }, day) : null;
}
/** an item's wall time on a day ('YYYY-MM-DD') → 'YYYY-MM-DDTHH:MM' (an hour under 6 lands on the NEXT day — the small hours) */
export function itemWhen(item, day) {
  const h = item.hour == null ? (item.night ? 22.5 : 14) : item.hour, [y, m, d] = day.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + (h < 6 ? 1 : 0))), hh = Math.floor(h), mm = Math.round((h - hh) * 60) % 60;
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

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
    golden: set - 40, dusk: set + 16, night: 22 * 60 + 30, late: 3 * 60, powerup: set - 28, powerdown: rise - 52, '10pm': 22 * 60, '2am': 2 * 60 }[id];
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
  sel('wxk', WX_INTENSITY.map(w => w.id));
  sel('snow', SNOW_GROUND.map(w => w.id));
  sel('snowman', SNOWMAN_STAGES.map(w => w.id));
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
  for (const k of ['text', 'show', 'colours', 'colour', 'by', 'style', 'tower', 'scheme', 'game', 'scene', 'when', 'wx', 'wxk', 'snow', 'snowman', 'mood']) if (st[k] != null) p[k] = String(st[k]);
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
  if (st.wx) out.push(`${(WEATHER.find(w => w.id === st.wx) || { label: st.wx.toUpperCase() }).label}${st.wxk ? ` · ${st.wxk.toUpperCase()}` : ''}`);
  if (st.snowman) out.push(`SNOWMAN ${st.snowman.toUpperCase()}`);
  if (st.snow) out.push(`SNOW ${(SNOW_GROUND.find(w => w.id === st.snow) || { label: st.snow.toUpperCase() }).label}`);
  if (st.mood) out.push(`MUSIC ${MUSIC_MOODS.find(m => m.id === st.mood).label}`);
  if (st.debug) out.push('READOUT');
  if (st.grid) out.push('GRID');
  if (st.pulse) out.push(`PULSE ${st.pulse} %`);
  return out.join(' · ');
}
