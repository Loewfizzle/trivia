// CITY 2.0 — THE RADIO (CITY CONTROLS A; the owner, Nov 2 8:05–10:05 am — DECIDED; docs/harbor/passes/city-controls-a.md). PURE: the server
// (api/admin.js#radio) and the phones (screens/harbor/radio*.js, scene-radio.js) share it — the anti-cheat never depends on the code being
// secret: the SERVER checks every action with these same rules (the caller's ROLE, the jack, the audience, the dark, one-at-a-time, the
// crew's limits) and writes every result; a phone only draws what it is told.
//   THE JACKS      built FROM THE TIMETABLE: every row with a `jack` (core/harbor-schedule.js — plug and play: a new moment = its row)
//   THE ROLES      checked PER ACTION, never a plain "is admin": OWNER (ADMIN_PIDS) = every jack, every audience, the dial, the queue, the
//                  stats; CREW (THE CREW — CC-B grants it) = its jacks, THE ROOM ITS PHONE IS IN only, the per-night limits
//   AUDIENCES      THREE (the owner's CC-A review, Nov 2 3:21 pm): me = JUST ME (a preview on his phone) · room = LOBBY ONLY (one lobby
//                  from the live list) · everyone = EVERYONE (the city + every lobby); CITY ONLY dropped (an old 'city' moment still plays)
//   THE LANES      ONE legendary / ONE sky message / ONE show at a time per scope (the city, a room) — a second waits its turn (AMBER),
//                  a legendary never over a show; THE OWNER goes first (ahead of the crew's waiting ones) + may STOP anything
import { SCHEDULE, knob } from './harbor-schedule.js';
import { sunPosition } from './sky.js';
import { hasProfanity } from '../chat/logic.js';

export const AUDIENCES = Object.freeze(['me', 'room', 'everyone']);
export const AUD_LABEL = Object.freeze({ me: 'JUST ME', room: 'LOBBY ONLY', everyone: 'EVERYONE', city: 'EVERYONE' });
/** the moment's states: q = on its way / waiting its turn (AMBER), run = running (PINK), done, stopped */
export const STATES = Object.freeze(['q', 'run', 'done', 'stopped']);

/** THE JACKS (sorted by their place on the desk) — { id, label, order, card, dark, len, lenFull?, lane, start, crew, limit, note, row } */
export function jacks() {
  return SCHEDULE.filter(r => r.jack).map(r => ({ ...r.jack, row: r.id })).sort((a, b) => a.order - b.order);
}
let JMAP = null;
export const jackDef = id => { if (!JMAP) JMAP = new Map(jacks().map(j => [j.id, j])); return JMAP.get(id) || null; };

/** THE ROLES — what each may do (CC-B adds the crew's UI + the grant; the table is here now) */
export const ROLES = Object.freeze({
  owner: Object.freeze({ id: 'owner', label: 'THE OWNER', audiences: AUDIENCES, dial: true, queue: true, stats: true, stopAny: true, clearAll: true, limited: false, sightings: true }),
  crew: Object.freeze({ id: 'crew', label: 'THE CREW', audiences: Object.freeze(['room']), dial: false, queue: false, stats: false, stopAny: false, clearAll: false, limited: true, sightings: false }),
  // PROGRESSION B — CALL IN A FAVOR: a player's earned FAVOR token fires ONE of the crew's jacks for THE ROOM THEY'RE IN (the crew's limits;
  // never a sighting; one token a moment, spent only when the server accepts it — api/_lib/favors.js)
  favor: Object.freeze({ id: 'favor', label: 'A FAVOR', audiences: Object.freeze(['room']), dial: false, queue: false, stats: false, stopAny: false, clearAll: false, limited: true, sightings: false }),
});
/** may `role` use this jack? (the owner: every one; the crew: the rows marked crew — never the billboard, party, dance, the dial) */
export function roleJack(role, jackId) {
  const R = ROLES[role], j = jackDef(jackId);
  if (!R || !j) return false;
  return role === 'owner' ? true : !!j.crew;
}
/** PROGRESSION B — CALL IN A FAVOR: the jacks a favor can call (the crew's) */
export const favorJacks = () => jacks().filter(j => j.crew);
/** may `role` aim at this audience? */
export const roleAudience = (role, aud) => !!ROLES[role] && ROLES[role].audiences.includes(aud);
/** a role's other powers: 'dial' | 'queue' | 'stats' | 'stopAny' | 'clearAll' */
export const rolePower = (role, what) => !!(ROLES[role] && ROLES[role][what]);

// ------------------------------------------------------------------ THE DARK (the city's time ALWAYS follows the real clock)
const HOME = () => knob('radio').home;
/** is it after dark at `ms` (the sun's elevation ≤ the row's darkEl) at a place (default: the owner's city) */
export function darkAt(ms, place = HOME()) { return sunPosition(ms, place.lat, place.lon).el <= knob('radio').darkEl; }
/** the next moment it's dark (ms) from `ms` — a 5-minute walk over the next day (null: none — a polar summer) */
export function nextDark(ms, place = HOME()) {
  if (darkAt(ms, place)) return ms;
  const step = 300e3; for (let t = ms + step; t < ms + 864e5; t += step) if (darkAt(t, place)) return t;
  return null;
}
/** "6:12 pm" in a zone */
export function clockIn(ms, tz) {
  try { return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz || undefined }).format(new Date(ms)).toLowerCase().replace(/\s/g, ' '); } catch { return ''; }
}
/** can this jack run now? → { ok, why, when (ms), note ("TR-3B · after dark only — at 6:12 pm") } */
export function canRun(jackId, now, place = HOME()) {
  const j = jackDef(jackId);
  if (!j) return { ok: false, why: 'unknown', note: 'NOT A MOMENT' };
  if (j.dark && !darkAt(now, place)) { const w = nextDark(now, place); return { ok: false, why: 'dark', when: w, note: `${j.label} · AFTER DARK ONLY${w ? ` — AT ${clockIn(w, place.tz).toUpperCase()}` : ''}` }; }
  return { ok: true };
}

// ------------------------------------------------------------------ THE WORDS (SKYWRITE, BANNER, the BILLBOARD's lines)
const ALLOWED = /^[A-Z0-9 .,!?'&+#:\-♥★]*$/;
/** the letters a message may use, upper-case, single spaces, ≤ max → { text, bad } (bad: 'empty' · 'long' · 'chars' · 'words' · 'name') */
export function cleanWords(raw, o = {}) {
  const max = o.max || knob('radio').words;
  const text = String(raw == null ? '' : raw).toUpperCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
  if (!text) return { text, bad: 'empty' };
  if (text.length > max) return { text: text.slice(0, max), bad: 'long' };
  if (!ALLOWED.test(text)) return { text, bad: 'chars' };
  if (hasProfanity(text)) return { text, bad: 'words' };
  // BNAME: never another player's typed name in public (o.names: the names the server knows to keep out — a room's players); the owner's
  // own name is fine
  const words = ` ${text.replace(/[^A-Z0-9 ]/g, ' ')} `;
  for (const n of o.names || []) { const k = String(n || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').trim(); if (k.length >= 3 && words.includes(` ${k} `)) return { text, bad: 'name' }; }
  return { text, bad: null };
}
export const WORDS_WHY = Object.freeze({ empty: 'TYPE SOMETHING FIRST', long: 'TOO LONG', chars: 'LETTERS, NUMBERS + . , ! ? \' & ONLY', words: 'NOT THOSE WORDS', name: 'NO PLAYER NAMES IN THE SKY (HOUSE NICKNAMES ONLY)' });

/** the colours a message may take (the drone show's palette at night; CC-B: the skytypers' SMOKE by day too — the owner's pick) */
export const COLOURS = Object.freeze(['ff2e97', '2ee6ff', 'ffd25a', '7dff6a', 'b36bff', 'ffffff', 'rainbow']);
export const DANCES = Object.freeze(['mix', 'conga', 'bounce', 'wands', 'swing']);

// ------------------------------------------------------------------ A FIRE REQUEST (the server's whitelist; the phone shows the same)
/** body → { req: { jack, aud, room, text, colour, show ('short'|'full'), dance, local: { h, mi } | null, lines }, bad } */
export function cleanFire(body = {}, o = {}) {
  const j = jackDef(String(body.jack || ''));
  if (!j) return { req: null, bad: 'bad_jack' };
  const aud = AUDIENCES.includes(body.aud) ? body.aud : null;
  if (!aud) return { req: null, bad: 'bad_audience' };
  const room = aud === 'room' ? String(body.room || '').toUpperCase() : null;
  if (aud === 'room' && !/^[A-Z]{4}$/.test(room)) return { req: null, bad: 'bad_room' };
  const req = { jack: j.id, aud, room, text: null, colour: null, show: null, dance: null, local: null, lines: null };
  if (j.card === 'words') {
    const w = cleanWords(body.text, { names: o.names }); if (w.bad) return { req: null, bad: `words_${w.bad}` };
    req.text = w.text; req.colour = COLOURS.includes(body.colour) ? body.colour : 'ffffff';
  }
  if (j.card === 'fireworks') req.show = body.show === 'full' ? 'full' : 'short';
  if (j.card === 'dance') req.dance = DANCES.includes(body.dance) ? body.dance : 'mix';
  if (body.local != null) {
    const hx = Number(body.local.h), mi = Number(body.local.mi);
    if (!Number.isInteger(hx) || hx < 0 || hx > 23 || !Number.isInteger(mi) || mi < 0 || mi > 59) return { req: null, bad: 'bad_time' };
    req.local = { h: hx, mi };
  }
  return { req, bad: null };
}
/** a billboard message → { lines: [a, b], local, repeat: { dows } | null, until } or bad */
export function cleanBoard(body = {}, o = {}) {
  const max = knob('radio.billboard').line;
  const raw = Array.isArray(body.lines) ? body.lines : [body.a, body.b];
  const lines = [];
  for (const l of raw.slice(0, 2)) { if (l == null || String(l).trim() === '') continue; const w = cleanWords(l, { max, names: o.names }); if (w.bad) return { msg: null, bad: `words_${w.bad}` }; lines.push(w.text); }
  if (!lines.length) return { msg: null, bad: 'words_empty' };
  if (lines.length === 1) lines.push('');
  let local = null;
  if (body.local != null) { const hx = Number(body.local.h), mi = Number(body.local.mi); if (!Number.isInteger(hx) || hx < 0 || hx > 23 || !Number.isInteger(mi) || mi < 0 || mi > 59) return { msg: null, bad: 'bad_time' }; local = { h: hx, mi }; }
  let repeat = null;
  if (body.repeat != null) {
    const d = Array.isArray(body.repeat.dows) ? [...new Set(body.repeat.dows.map(Number))].filter(x => Number.isInteger(x) && x >= 0 && x <= 6).sort() : [];
    if (!d.length || !local) return { msg: null, bad: 'bad_repeat' };
    repeat = { dows: d };
  }
  return { msg: { lines, local, repeat }, bad: null };
}

// ------------------------------------------------------------------ THE QUEUE (one at a time per lane, per scope)
/** a moment's scope: 'city' (everyone + city share the city's sky) · 'room:<CODE>' · 'me:<pid>' (a preview — never queued with anyone) */
export const scopeOf = m => (m.aud === 'room' ? `room:${m.room}` : m.aud === 'me' ? `me:${m.by}` : 'city');
/** does a lane block another? (the same lane; a legendary + a show never together) */
const blocks = (a, b) => a !== 'free' && b !== 'free' && (a === b || (a === 'legend' && b === 'show') || (a === 'show' && b === 'legend'));
/** a moment's length (s) — a full fireworks show is longer */
export function lenOf(m) { const j = jackDef(m.jack); if (!j) return 30; return m.show === 'full' && j.lenFull ? j.lenFull : j.len; }
/**
 * WHEN does a new moment start? queue: the scope's moments still q / run ({ jack, at, until, role, state }); m: the new one ({ jack, role,
 * aud }); now (ms) → { at, until, wait (ms it waits behind another), moved: [{ id, at, until }] (the crew's waiting ones pushed back when the
 * OWNER goes first) }
 */
export function planStart(queue, m, now) {
  const K = knob('radio'), j = jackDef(m.jack), lane = j ? j.lane : 'free', len = lenOf(m) * 1000, gap = K.gap * 1000;
  const lead = (m.aud === 'room' ? K.lead.room : m.aud === 'me' ? K.lead.me : K.lead.city) * 1000;
  const live = (queue || []).filter(x => (x.state === 'q' || x.state === 'run') && x.until > now);
  const lanes = live.filter(x => { const jx = jackDef(x.jack); return jx && blocks(lane, jx.lane); });
  // THE OWNER goes first: only what is RUNNING (or the owner's own waiting ones) holds him; the crew's waiting ones move behind him
  const ahead = m.role === 'owner' ? lanes.filter(x => x.state === 'run' || x.at <= now || x.role === 'owner') : lanes;
  let at = now + lead;
  for (const x of ahead.sort((a, b) => a.at - b.at)) if (x.until + gap > at && x.at < at + len + gap) at = Math.max(at, x.until + gap);
  // (a second pass: the earliest gap that fits — a later one may now overlap after the move)
  for (let i = 0; i < 4; i++) for (const x of ahead) if (x.at < at + len + gap && x.until + gap > at) at = x.until + gap;
  const until = at + len, moved = [];
  if (m.role === 'owner') {
    let t = until + gap;
    for (const x of lanes.filter(y => !ahead.includes(y)).sort((a, b) => a.at - b.at)) {
      const L = x.until - x.at; if (x.at < t) { moved.push({ id: x.id, at: t, until: t + L }); t = t + L + gap; } else t = Math.max(t, x.until + gap);
    }
  }
  return { at, until, wait: Math.max(0, at - (now + lead)), moved };
}
/** the lamp for a jack on the desk: 'run' (PINK) · 'q' (AMBER) · 'grey' (can't run now) · 'cool' (the crew's cooldown) · '' (ready) */
export function lampOf(jackId, moments, now, place) {
  const mine = (moments || []).filter(m => m.jack === jackId && (m.state === 'q' || m.state === 'run') && m.until > now);
  if (mine.some(m => m.at <= now)) return 'run';
  if (mine.length) return 'q';
  return canRun(jackId, now, place).ok ? '' : 'grey';
}
/** a moment's phase at now: 'q' (before its start) · 'run' · 'done' (or its stored state when stopped) */
export function phaseOf(m, now) { if (m.state === 'stopped' || m.state === 'done') return m.state; return now < m.at ? 'q' : now < m.until ? 'run' : 'done'; }

// ------------------------------------------------------------------ THE CREW's LIMITS (loose: per room per night)
/** the night a moment counts in (the local date from `nightFrom` to the next day's) — 'YYYY-MM-DD' */
export function nightKey(ms, tz = HOME().tz) {
  const K = knob('radio').crew;
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ms)).map(x => [x.type, x.value]));
    const hx = +p.hour; if (hx >= K.nightFrom) return `${p.year}-${p.month}-${p.day}`;
    const d = new Date(Date.UTC(+p.year, +p.month - 1, +p.day) - 864e5); return d.toISOString().slice(0, 10);
  } catch { return new Date(ms).toISOString().slice(0, 10); }
}
/** may the crew fire this jack in this room tonight? log: { counts: { <limit>: n }, lastEnd (ms) } → { ok, why, note, until (ms — the cooldown's end) } */
export function crewCheck(jackId, log, now) {
  const K = knob('radio').crew, j = jackDef(jackId);
  if (!j || !j.crew) return { ok: false, why: 'not_crew_jack', note: 'NOT ON YOUR DESK' };
  const lg = log || {};
  if (lg.lastEnd && now < lg.lastEnd + K.cooldown * 1000) return { ok: false, why: 'cooldown', until: lg.lastEnd + K.cooldown * 1000, note: 'COOLING DOWN — A MINUTE BETWEEN MOMENTS' };
  const cap = K.perNight[j.limit], n = (lg.counts && lg.counts[j.limit]) || 0;
  if (cap != null && n >= cap) return { ok: false, why: 'limit', note: `THAT'S ENOUGH ${j.label}${/S$/.test(j.label) ? '' : 'S'} FOR TONIGHT — BACK TOMORROW` };
  return { ok: true };
}

// ------------------------------------------------------------------ WHAT THE CITY PLAYS (scene-radio.js reads it)
/** a moment → how the city plays it ONCE: { kind ('legend' · 'flyby' · 'blackbird' · 'fireworks' · 'words' · 'banner' · 'balloons' ·
 *  'lightning' · 'hold' · 'billboard'), arg (the legend's kind / the held force id), text, colour, show, dance } */
export function startOf(m) {
  const j = jackDef(m.jack); if (!j) return null;
  const [kind, arg] = String(j.start).split(':');
  return { kind, arg: arg || null, text: m.text || null, colour: m.colour || null, show: m.show || null, dance: m.dance || null };
}
/** the public copy of a moment a phone may see (no pid, no role): { id, jack, at, until, text, colour, show, dance, local, aud, by: 'owner' | 'crew' } */
export function publicMoment(id, m) {
  return { id, jack: m.jack, at: m.at, until: m.until, text: m.text || null, colour: m.colour || null, show: m.show || null, dance: m.dance || null, local: m.local || null, aud: m.aud, state: m.state, by: m.role === 'owner' ? 'owner' : m.role === 'favor' ? 'favor' : 'crew' };
}
/** AT A TIME: a local hour in EACH viewer's own time → this phone's start (ms) for a moment of `len` s set for { h, mi } on the day it
 *  was made (dayMs: the phone's local midnight of that day); a time already gone today → tomorrow's */
export function localStart(local, made, tzOffMin) {
  const off = (tzOffMin || 0) * 60e3, d0 = Math.floor((made + off) / 864e5) * 864e5 - off;
  let t = d0 + (local.h * 60 + local.mi) * 60e3;
  if (t < made - 60e3) t += 864e5;
  return t;
}

// ------------------------------------------------------------------ CC-B — THE CREW: ONE RADIO PER LOBBY
/**
 * who holds the lobby's radio: the HOST if a crew member, else the crew member who joined FIRST; it FOLLOWS THE HOST (host migration);
 * a HAND-OVER (`hand`: { uid, host } — granted while `host` hosted) holds until the host changes or that crew member leaves.
 * room: { hostId, players: { uid: { joinedAt } }, hand? }, crewUids: the uids in the room whose profile is crew → uid | null
 */
export function radioHolder(room, crewUids) {
  const P = (room && room.players) || {}, crew = [...new Set(crewUids || [])].filter(u => P[u]);
  if (!crew.length) return null;
  const hand = room.hand;
  if (hand && hand.uid && hand.host === room.hostId && crew.includes(hand.uid)) return hand.uid;
  if (crew.includes(room.hostId)) return room.hostId;
  return crew.sort((a, b) => ((P[a].joinedAt || 0) - (P[b].joinedAt || 0)) || a.localeCompare(b))[0];
}
/** a crew member's name tag ("MIKE#4821") → { name, tag } | null */
export function parseTag(raw) {
  const m = /^\s*(.{1,24}?)\s*#\s*(\d{4})\s*$/.exec(String(raw || ''));
  return m ? { name: m[1], tag: m[2] } : null;
}
