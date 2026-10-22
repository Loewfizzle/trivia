// CITY 2.0 — THE PREVIEW PANEL's registry (PURE: the panel, the scene and /api/admin share it; docs/harbor.md#the-preview-panel).
// ONE list of everything the owner's test remote can switch: every &force= preview that works on ?city=2, the party show's
// scenes, the time jumps, the weather, the holiday looks, the tools. A new &force= preview is one row in EVENTS and it appears in
// the panel (and is accepted by the server) with no other change.
//
//   the state   { force: [ids], text, show, colours, colour, by, cycle, style, tower, scheme, game, scene, party: 'on'|'off',
//                 when: 'YYYY-MM-DDTHH:MM' (wall time in the city's zone), speed: 1|20|60, wx, hol, debug, grid }
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

/** the URL flags the remote owns (while a remote state is on, the page's own values of these are replaced) */
export const REMOTE_KEYS = ['force', 'text', 'show', 'colours', 'colour', 'by', 'cycle', 'style', 'tower', 'scheme', 'game', 'scene', 'when', 'speed', 'wx', 'debug', 'grid'];

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
  style: { kind: 'select', label: 'STYLE', options: ['wipe', 'steady', 'twinkle'], default: 'wipe' },
  tower: { kind: 'select', label: 'TOWER', options: ['', 'wordA', 'wordB', 'wordV'], labels: { '': 'ANY', wordA: 'TOWER A', wordB: 'TOWER B', wordV: 'TOWER V' } },
  scheme: { kind: 'select', label: 'SCHEME', options: [...new Set([...NEON_SCHEMES, ...ROSIE_SCHEMES])], default: 'halloween' },
  game: { kind: 'select', label: 'GAME', options: GAME_IDS, default: 'pulse' },
};

// THE EVENTS: every &force= preview that runs on ?city=2 (group → the panel's sub-heading). text: the longest text it takes.
// oneShot: a sky piece started through harbor().sky — EVERYONE's phones start it at the same moment (startAt), a late arrival
// joins mid-flight; the rest are states (on while the remote is on).
export const EVENTS = [
  { id: 'drones', label: 'DRONE SHOW', group: 'SKY', oneShot: true, inputs: ['text', 'show', 'colours', 'colour', 'by', 'cycle'], text: 40, night: true },
  { id: 'drones-calm', label: 'DRONES · CALM', group: 'SKY', hint: 'with DRONE SHOW: slower, steady lights' },
  { id: 'banner', label: 'BANNER PLANE', group: 'SKY', oneShot: true, inputs: ['text'], text: 74, hint: 'A | B | C: up to 3 banners' },
  { id: 'skywrite', label: 'SKYWRITING', group: 'SKY', oneShot: true, inputs: ['text'], text: 10 },
  { id: 'skytype', label: 'SKYTYPING', group: 'SKY', oneShot: true, inputs: ['text'], text: 33 },
  { id: 'helicopter', label: 'HELICOPTER', group: 'SKY', oneShot: true },
  { id: 'balloons', label: 'BALLOONS', group: 'SKY', oneShot: true },
  { id: 'balloon-festival', label: 'BALLOON FESTIVAL', group: 'SKY', oneShot: true },
  { id: 'planes', label: 'PLANES', group: 'SKY' },
  { id: 'approach', label: 'PLANE ON APPROACH', group: 'SKY' },
  { id: 'satellites', label: 'SATELLITE TRAIN', group: 'SKY', night: true },
  { id: 'aurora', label: 'AURORA', group: 'SKY', night: true },
  { id: 'meteor', label: 'METEORS', group: 'SKY', night: true },
  { id: 'eclipse', label: 'MOON ECLIPSE', group: 'SKY', night: true },
  { id: 'eclipse-sun', label: 'SOLAR ECLIPSE', group: 'SKY' },
  { id: 'totality', label: 'TOTALITY', group: 'SKY' },
  { id: 'fireworks', label: 'FIREWORKS', group: 'SKY', night: true },
  { id: 'finale', label: 'PARTY FINALE', group: 'SKY', night: true },
  { id: 'sleigh', label: 'SLEIGH', group: 'SKY', night: true },
  { id: 'witch', label: 'WITCH', group: 'SKY', night: true },
  { id: 'ufo', label: 'UFO', group: 'SKY', night: true },
  { id: 'cat', label: 'THE MOON CAT', group: 'SKY', night: true },
  { id: 'geese', label: 'GEESE', group: 'BIRDS' },
  { id: 'swifts', label: 'SWIFTS', group: 'BIRDS' },
  { id: 'bats-dusk', label: 'BATS AT DUSK', group: 'BIRDS' },
  { id: 'bats', label: 'HALLOWEEN BATS', group: 'BIRDS', night: true },
  { id: 'heron', label: 'HERON', group: 'BIRDS' },
  { id: 'rainbow', label: 'RAINBOW', group: 'RAINBOWS' },
  { id: 'rainbow2', label: 'DOUBLE RAINBOW', group: 'RAINBOWS' },
  { id: 'moonbow', label: 'MOONBOW', group: 'RAINBOWS', night: true },
  { id: 'neonbow', label: 'NEON BOW', group: 'RAINBOWS', night: true },
  { id: 'lightning', label: 'LIGHTNING', group: 'WEATHER FX' },
  { id: 'freeze', label: 'FROST', group: 'WEATHER FX' },
  { id: 'beams', label: 'SKY BEAMS', group: 'CITY', night: true, hint: 'the party’s vertical beams from the tall towers' },
  { id: 'searchlights', label: 'SEARCHLIGHTS', group: 'CITY', night: true },
  { id: 'spell', label: 'WORDS IN THE WINDOWS', group: 'CITY', inputs: ['text', 'style', 'tower'], text: 10, night: true },
  { id: 'burnout', label: 'BURNT-OUT LETTER', group: 'CITY', night: true },
  { id: 'neon-party', label: 'NEON PARTY', group: 'CITY', night: true },
  { id: 'neon-flash', label: 'NEON FLASH', group: 'CITY', inputs: ['game'], night: true },
  { id: 'neon-scheme', label: 'NEON SCHEME', group: 'CITY', inputs: ['scheme'], night: true },
  { id: 'wheel-scheme', label: 'WHEEL SCHEME', group: 'HARBOR', inputs: ['scheme'] },
  { id: 'beam-green', label: 'GREEN BEAM', group: 'HARBOR', night: true },
  { id: 'rosie-lights', label: 'ROSIE’S LIGHTS', group: 'HARBOR', inputs: ['scheme'] },
  { id: 'taxi', label: 'WATER TAXI', group: 'HARBOR' },
  { id: 'strings-party', label: 'STRING LIGHTS · PARTY', group: 'HARBOR', night: true, hint: 'the speakeasy roof’s string lights in party mode' },
];
export const EVENT_GROUPS = [...new Set(EVENTS.map(e => e.group))];
const EV = Object.fromEntries(EVENTS.map(e => [e.id, e]));
export const eventDef = id => EV[id] || null;

/** the party show's scenes, from the show's own lists (NEON PASS 3) */
export const SHOW_SCENE_LIST = Object.entries(SHOW_SCENES).flatMap(([list, scenes]) => scenes.map(s => ({ id: s.name, list })));

export const TIMES = [
  { id: 'dawn', label: 'DAWN' }, { id: 'morning', label: 'MORNING' }, { id: 'noon', label: 'NOON' }, { id: 'afternoon', label: 'AFTERNOON' },
  { id: 'golden', label: 'GOLDEN HOUR' }, { id: 'dusk', label: 'DUSK' }, { id: 'night', label: 'NIGHT' }, { id: 'late', label: '3 AM' },
];
export const SPEEDS = [1, 20, 60];
export const WEATHER = [
  { id: 'clear', label: 'CLEAR' }, { id: 'clouds', label: 'CLOUDS' }, { id: 'rain', label: 'RAIN' }, { id: 'storm', label: 'STORM' },
  { id: 'snow', label: 'SNOW' }, { id: 'fog', label: 'FOG' },
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
  const mins = { dawn: rise - 22, morning: rise + 100, noon: Math.round((rise + set) / 2), afternoon: Math.round((rise + set) / 2) + 180,
    golden: set - 40, dusk: set + 16, night: 22 * 60 + 30, late: 3 * 60 }[id];
  if (mins == null) return null;
  const v = Math.max(0, Math.min(23 * 60 + 59, Math.round(mins)));
  return `${day}T${pad(Math.floor(v / 60))}:${pad(v % 60)}`;
}

// ------------------------------------------------------------------ validation (the client before sending, the server always)
const WHEN_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const HEX_RE = /^[0-9a-f]{6}$/;
// the letters every piece can draw (the pixel font of the windows, the smoke, the banner, the drones): A–Z 0–9, a few marks
const TEXT_RE = /[^A-Z0-9 !?.,'&+\-#@:♥★|]/g;
export const cleanText = (t, max = 74) => String(t == null ? '' : t).toUpperCase().replace(/[‘’]/g, "'").replace(TEXT_RE, '').replace(/\s+/g, ' ').trim().slice(0, max);
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
  sel('by', ['word', 'letter']); sel('style', INPUTS.style.options); sel('tower', ['wordA', 'wordB', 'wordV']);
  sel('scheme', INPUTS.scheme.options); sel('game', GAME_IDS);
  if (r.cycle) out.cycle = true;
  sel('scene', SHOW_SCENE_LIST.map(s => s.id));
  sel('party', ['on', 'off']);
  if (r.when != null && r.when !== '') { if (validWhen(r.when)) out.when = String(r.when); else bad.push('when'); }
  if (r.speed != null && r.speed !== '' && Number(r.speed) !== 1) { const v = Number(r.speed); if (SPEEDS.includes(v)) out.speed = v; else bad.push('speed'); }
  sel('wx', WEATHER.map(w => w.id));
  sel('hol', HOLIDAYS.map(h => h.id));
  if (r.debug) out.debug = true;
  if (r.grid) out.grid = true;
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
  for (const k of ['text', 'show', 'colours', 'colour', 'by', 'style', 'tower', 'scheme', 'game', 'scene', 'when', 'wx']) if (st[k] != null) p[k] = String(st[k]);
  if (st.cycle) p.cycle = '1';
  if (st.speed && st.speed !== 1) p.speed = String(st.speed);
  if (st.debug) p.debug = '1';
  if (st.grid) p.grid = '1';
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
  if (st.debug) out.push('READOUT');
  if (st.grid) out.push('GRID');
  return out.join(' · ');
}
