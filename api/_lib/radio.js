// CITY CONTROLS A — THE RADIO on the server (POST /api/admin { action: 'radio…' }; docs/profiles.md "THE RADIO"). The ROLE is checked PER
// ACTION (core/harbor-radio.js#ROLES — the owner = ADMIN_PIDS; THE CREW = radio/crew/{pid}, granted in CC-B): the jack, the audience, the
// moment's own rules (after dark, one at a time per lane), the crew's limits — then the SERVER writes every result. A phone never writes a
// moment, the queue, the dial or a room's radio node (database.rules.json: server only). Every action → audit/ (who, what, the audience,
// the words).
//   radio/q/{id}          every moment fired (q · run · done · stopped) — the queue; pruned after `keep` s
//   radio/fired/{id}      THE RECORD (what, when, the audience, who, sight: the owner's to a real audience — PROGRESSION 2.0 counts a
//                         fired moment a player SPOTS as a City Sighting once a day; previews + the crew's never)
//   radio/board/{id}      the owner's BILLBOARD messages (now · at a time · every week)
//   radio/crewIc          FRIENDS A — THE CREW INTERCOM's master switch { on, at, by } (the owner's; default OFF = the crew's mic hidden + every crew
//                         send refused); the crew's clips count under radio/limits/{room}/{night}/ic
//   radio/crew/{pid}      THE CREW (CC-B — the owner grants it: { at, by, n, t }; cap 10); radio/limits/{room}/{night} the crew's counts +
//                         the cooldown; rooms/{CODE}/radioCrew { hand: { uid, host, at }, ask: { uid, name, at }, nope } — ONE RADIO PER
//                         LOBBY (core/harbor-radio.js#radioHolder): the server writes the hand-over + the ask, the room's phones see them
//   rooms/{CODE}/radio/{id}  a room's moments (its phones listen on the room's socket — ~1–2 s)
//   city2/showcase        the TUNING WINDOW's level (every phone reads it through GET /api/admin?live=1, with the city's moments)
//   here/{uid}            THE NIXIE's count: a visible title says hello every ~5 min (THE CDN HOTFIX, Nov 12 — was ~2) (an ESTIMATE until Vercel Analytics)
//   radio/presets/{id}    CC-B — PRESETS (the owner's saved combos: { name, steps: [{ kind: 'fire' | 'board', body }], at }) — one jack each
//   radio/push/{on, subs/{hash}, sent/{CODE}}  CC-B — "A ROOM JUST OPENED": the owner's push switch, his phones' Web Push subscriptions
//                         (api/_lib/push.js), a room notified once
//   radio/ic/{id}         CC-B — THE INTERCOM's announcements (who, the audience, wait, the headline, the clip's length + type, at / until,
//                         state); radio/clips/{id} the clip itself (base64 — served by GET /api/admin?clip=<id>, cached a minute); both
//                         pruned after `keep` s (an hour); a lobby's copy at rooms/{CODE}/radio/{id} (kind 'intercom')
import { cleanHoldem } from '../../js/core/harbor-holdem.js';
import { cleanJaywalk } from '../../js/core/harbor-trivision.js';
import { ApiError } from './http.js';
import { ref, val, adminPids, emulated } from './fb.js';
import { liveRoomsRead } from './rooms-live.js';
import { openStep } from '../../js/core/sightings.js';
import { knob } from '../../js/core/harbor-schedule.js';
import { jacks, jackDef, roleJack, roleAudience, rolePower, canRun, cleanFire, cleanBoard, planStart, lenOf, scopeOf, publicMoment, crewCheck, nightKey, localStart, phaseOf, AUD_LABEL, WORDS_WHY, radioHolder, parseTag, cleanWords } from '../../js/core/harbor-radio.js';
import { nameKey } from '../../js/core/names.js';
import { presenceOnline } from '../../js/core/room-logic.js';
import { take } from './limit.js';
/** THE ROOM PUSH's limits (FR6 FIXES A, C4): per sender an hour, and in all an hour */
export const PUSH_LIMITS = Object.freeze({ perUid: 1, perHour: 10 });
import { encodeKey, pidOf, isPid } from './profiles.js';
import { vapid, sendPush, okEndpoint } from './push.js';
import { createHash } from 'node:crypto';
import { SHOWCASE_LEVELS } from '../../js/core/harbor-showcase.js';
import { cleanIntercom, icPublic, icLen, canUnsend, IC_WHY, icWhen } from '../../js/core/radio-intercom.js';
import { setFounder, founderState } from './founder.js';
import { dayKey } from '../../js/core/week.js';

const HERE_MS = 360e3;   // (THE CDN HOTFIX: the hello every ~5 min (≤ 5.5) → 6 min — was 3 for the ~2-min hello)
const tzOffAt = (ms, tz) => { try { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(new Date(ms)).map(x => [x.type, x.value])); return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(ms / 60e3) * 60e3) / 60e3); } catch { return 0; } };

/** the caller's role: 'owner' (ADMIN_PIDS) · 'crew' (radio/crew/{pid}) · null */
export async function roleOf(pid) {
  if (!pid) return null;
  if (adminPids().includes(pid)) return 'owner';
  // (the LOCAL EMULATORS only — the E2E's owner: testAdmins/{pid}; production never runs with the emulator's env, so this is never read there)
  if (emulated() && (await val(`testAdmins/${pid}`))) return 'owner';
  return (await val(`radio/crew/${pid}`)) ? 'crew' : null;
}
const need = (ok, code, msg) => { if (!ok) throw new ApiError(403, code, msg); };

/** the queue, pruned (moments older than `keep` s go) → [{ id, ...m }] */
async function queue(now) {
  const all = (await val('radio/q')) || {}, keep = knob('radio').keep * 1000, out = [], gone = {};
  for (const [id, m] of Object.entries(all)) { if (!m || !(m.until > now - keep)) gone[id] = null; else out.push({ id, ...m, state: phaseOf(m, now) }); }
  if (Object.keys(gone).length) await ref('radio/q').update(gone);
  return out.sort((a, b) => a.at - b.at);
}
async function roomNames(code) {
  const p = (await val(`rooms/${code}/players`)) || {};
  return Object.values(p).map(x => x && x.name).filter(Boolean);
}
async function audit(by, act, detail = {}) { await ref('audit').push({ at: Date.now(), by, act, pid: null, ...detail }); }
const words = m => `${m.jack}${m.text ? ` “${m.text}”` : ''}${m.show ? ` (${m.show})` : ''}${m.dance ? ` (${m.dance})` : ''} → ${AUD_LABEL[m.aud]}${m.room ? ` ${m.room}` : ''}`;

/** FIRE: { jack, aud, room?, text?, colour?, show?, dance?, local? } → { moment } */
async function fire(me, role, uid, body, now) {
  const pre = cleanFire(body);
  if (pre.bad && !pre.req) { const why = pre.bad.startsWith('words_') ? WORDS_WHY[pre.bad.slice(6)] : null; throw new ApiError(400, pre.bad, why || undefined); }
  need(roleJack(role, pre.req.jack), 'not_your_jack', 'That moment is not on your desk.');
  need(roleAudience(role, pre.req.aud), 'not_your_audience', role === 'crew' ? 'The crew fires for the room they are in only.' : 'Not allowed.');
  // (a room: it must be open; the crew's phone must be IN it; BNAME — none of its players' typed names in the words)
  let names = [];
  if (pre.req.aud === 'room') {
    const meta = await val(`rooms/${pre.req.room}/meta`);
    if (!meta) throw new ApiError(404, 'no_room', 'That room is closed.');
    if (role === 'favor') need(!!(await val(`rooms/${pre.req.room}/players/${uid}`)), 'not_in_room', 'A favor is for the room you are in.');
    if (role === 'crew') {
      need(!!(await val(`rooms/${pre.req.room}/players/${uid}`)), 'not_in_room', 'You can only fire in the lobby you are in.');
      const R = await crewOfRoom(pre.req.room);
      need(R.holder === uid, 'not_holder', `THE RADIO’S WITH ${R.holder ? (R.players[R.holder] || {}).name || 'ANOTHER CREW MEMBER' : 'NOBODY'} TONIGHT — whoever hosts runs the show in this lobby.`);
    }
    names = await roomNames(pre.req.room);
  }
  const { req, bad } = cleanFire(body, { names });
  if (bad) { const why = bad.startsWith('words_') ? WORDS_WHY[bad.slice(6)] : null; throw new ApiError(400, bad, why || undefined); }
  const K = knob('radio'), home = K.home;
  // AT A TIME: a local hour in each viewer's own time — the server plans it at the owner's city's (home) time
  const want = req.local ? localStart(req.local, now, tzOffAt(now, home.tz)) : now;
  const run = canRun(req.jack, Math.max(now, want), home);
  if (!run.ok) throw new ApiError(409, 'cant_now', run.note);
  // THE CREW's limits (loose, per room per night)
  const night = nightKey(now, home.tz), limPath = req.aud === 'room' ? `radio/limits/${req.room}/${night}` : null;
  if (role === 'crew' || role === 'favor') { const c = crewCheck(req.jack, await val(limPath), now); if (!c.ok) throw new ApiError(429, c.why, c.note); }
  const Q = await queue(now);
  if (Q.filter(m => m.state === 'q' || m.state === 'run').length >= K.queueMax) throw new ApiError(429, 'queue_full', 'The queue is full — wait for one to finish.');
  const m0 = { jack: req.jack, aud: req.aud, room: req.room, by: me, role };
  const scope = scopeOf(m0), sameScope = Q.filter(x => scopeOf(x) === scope);
  const P = planStart(sameScope, m0, Math.max(now, want - (req.aud === 'room' ? K.lead.room : req.aud === 'me' ? K.lead.me : K.lead.city) * 1000));
  const id = ref('radio/q').push().key;
  const m = { ...m0, text: req.text, colour: req.colour, show: req.show, dance: req.dance, local: req.local, at: P.at, until: P.at + lenOf(req) * 1000, made: now, state: 'q' };
  const up = { [`radio/q/${id}`]: m };
  for (const mv of P.moved) up[`radio/q/${mv.id}/at`] = mv.at, up[`radio/q/${mv.id}/until`] = mv.until;
  if (req.aud === 'room') up[`rooms/${req.room}/radio/${id}`] = publicMoment(id, m);
  // THE LOBBY GETS IT LIVE (Nov 12 night): EVERYONE's / the city's moment ALSO into every OPEN room (the same public shape the LOBBY ONLY ones use)
  // — its phones get it live over the room's own socket (lobby or mid-match), 10 s ahead; the poll's copy + the room's = ONE moment (merged by id,
  // played once — scene-radio.js); `rooms` kept on the queue's record so STOP / CLEAR ALL / the planner's moves reach the copies
  const wide = req.aud === 'everyone' || req.aud === 'city', open = wide || P.moved.length ? new Set((await openRooms(now)).map(r => r.code)) : new Set();
  if (wide) {
    m.rooms = [...open];
    up[`radio/q/${id}`] = m;
    for (const code of m.rooms) up[`rooms/${code}/radio/${id}`] = publicMoment(id, m);
  }
  for (const mv of P.moved) { const x = Q.find(y => y.id === mv.id); if (x) for (const code of copiesOf(x)) if (x.aud === 'room' || open.has(code)) { up[`rooms/${code}/radio/${mv.id}/at`] = mv.at; up[`rooms/${code}/radio/${mv.id}/until`] = mv.until; } }   // (a closed room's copy is left alone)
  up[`radio/fired/${id}`] = { jack: m.jack, at: m.at, until: m.until, len: lenOf(req), made: now, local: m.local || null, aud: m.aud, room: m.room || null, role, by: me, sight: role === 'owner' && m.aud !== 'me' };   // (PROGRESSION B: + until / len / made / local — core/sightings.js#radioWindows reads them)
  if ((role === 'crew' || role === 'favor') && limPath) {
    const lg = (await val(limPath)) || {}, j = jackDef(m.jack);
    up[`${limPath}/counts/${j.limit}`] = ((lg.counts && lg.counts[j.limit]) || 0) + 1;
    up[`${limPath}/lastEnd`] = m.until;
  }
  await ref('/').update(up);
  await audit(me, 'radioFire', { b: words(m).slice(0, 140), role, aud: m.aud });
  return { moment: { id, ...m, wait: P.wait } };
}

/** the rooms holding a copy of a queued moment: a LOBBY ONLY moment's room, or EVERYONE's / the city's copies (THE LOBBY GETS IT LIVE) */
function copiesOf(m) { return m.aud === 'room' ? (m.room ? [m.room] : []) : Array.isArray(m.rooms) ? m.rooms.filter(c => /^[A-Z]{4}$/.test(c)) : []; }
/** …only those still open (a write to a closed room's path would make a stray node there — unsend's rule) */
async function liveCopies(m) { const out = []; for (const code of copiesOf(m)) if (await val(`rooms/${code}/meta`)) out.push(code); return out; }

/** PROGRESSION B — CALL IN A FAVOR: fire ONE crew jack for the caller's room as role 'favor' (the token: api/_lib/favors.js) */
export async function favorMoment(me, uid, body, now = Date.now()) { return fire(me, 'favor', uid, { ...body, aud: 'room' }, now); }

/** STOP { id } — the owner: anything; the crew: their own */
async function stop(me, role, body, now) {
  const id = String(body.id || '');
  if (!/^[-_A-Za-z0-9]{10,40}$/.test(id)) throw new ApiError(400, 'bad_id');
  const m = await val(`radio/q/${id}`);
  if (!m) throw new ApiError(404, 'no_moment');
  need(rolePower(role, 'stopAny') || m.by === me, 'not_yours', 'You can stop your own moments only.');
  const up = { [`radio/q/${id}/state`]: 'stopped', [`radio/q/${id}/until`]: Math.min(m.until, now) };
  for (const code of await liveCopies(m)) { up[`rooms/${code}/radio/${id}/state`] = 'stopped'; up[`rooms/${code}/radio/${id}/until`] = Math.min(m.until, now); }   // (a LOBBY ONLY moment's room + THE LOBBY GETS IT LIVE's copies)
  await ref('/').update(up);
  await audit(me, 'radioStop', { b: words(m).slice(0, 140), role });
  return { ok: true };
}

/** CLEAR ALL (the owner, under the red cover): every running + waiting moment HE fired stops; his billboard queue empties */
async function clearAll(me, role, now) {
  need(rolePower(role, 'clearAll'), 'not_owner');
  const Q = await queue(now), up = {};
  for (const m of Q) if (m.by === me && (m.state === 'q' || m.state === 'run')) {
    up[`radio/q/${m.id}/state`] = 'stopped'; up[`radio/q/${m.id}/until`] = Math.min(m.until, now);
    for (const code of await liveCopies(m)) { up[`rooms/${code}/radio/${m.id}/state`] = 'stopped'; up[`rooms/${code}/radio/${m.id}/until`] = Math.min(m.until, now); }
  }
  up['radio/board'] = null;
  await ref('/').update(up);
  await audit(me, 'radioClearAll', { b: `${Object.keys(up).length - 1} writes` });
  return { ok: true };
}

/** THE BILLBOARD (the owner): add { lines, local?, repeat? } · cancel { id } · edit { id, lines, local?, repeat? } */
async function board(me, role, body, now, act) {
  need(rolePower(role, 'queue'), 'not_owner', 'The billboard is the owner’s.');
  if (act === 'cancel') {
    const id = String(body.id || ''); if (!/^[-_A-Za-z0-9]{10,40}$/.test(id)) throw new ApiError(400, 'bad_id');
    const b = await val(`radio/board/${id}`); if (!b) throw new ApiError(404, 'no_message');
    await ref(`radio/board/${id}`).remove(); await audit(me, 'radioBoardCancel', { b: b.lines.join(' / ') }); return { ok: true };
  }
  const { msg, bad } = cleanBoard(body);
  if (bad) { const why = bad.startsWith('words_') ? WORDS_WHY[bad.slice(6)] : null; throw new ApiError(400, bad, why || undefined); }
  const B = knob('radio.billboard');
  const rec = { ...msg, made: now, by: me, at: msg.local ? null : now, until: msg.local || msg.repeat ? null : now + B.len * 60e3 };
  const id = act === 'edit' ? String(body.id || '') : ref('radio/board').push().key;
  if (act === 'edit') { if (!/^[-_A-Za-z0-9]{10,40}$/.test(id) || !(await val(`radio/board/${id}`))) throw new ApiError(404, 'no_message'); }
  if (act !== 'edit' && Object.keys((await val('radio/board')) || {}).length >= 20) throw new ApiError(429, 'queue_full', 'Twenty messages are queued — cancel one first.');
  await ref(`radio/board/${id}`).set(rec);
  await audit(me, act === 'edit' ? 'radioBoardEdit' : 'radioBoard', { b: `${msg.lines.join(' / ')}${msg.local ? ` at ${msg.local.h}:${String(msg.local.mi).padStart(2, '0')}` : ' now'}${msg.repeat ? ` every ${msg.repeat.dows.join(',')}` : ''}`.slice(0, 140) });
  return { message: { id, ...rec } };
}
/** the board's messages still to show (a once-only one past its window is pruned) */
async function boardList(now) {
  const all = (await val('radio/board')) || {}, B = knob('radio.billboard'), out = [], gone = {};
  for (const [id, b] of Object.entries(all)) {
    if (!b || !Array.isArray(b.lines)) { gone[id] = null; continue; }
    if (!b.repeat && b.until && b.until < now) { gone[id] = null; continue; }
    if (!b.repeat && b.local && b.made + 2 * 864e5 < now) { gone[id] = null; continue; }
    out.push({ id, lines: b.lines, local: b.local || null, repeat: b.repeat || null, at: b.at || null, until: b.until || null, made: b.made, len: B.len });
  }
  if (Object.keys(gone).length) await ref('radio/board').update(gone);
  return out.sort((a, b) => a.made - b.made);
}

/** THE DIAL (the owner): city2/showcase */
async function dial(me, role, body) {
  need(rolePower(role, 'dial'), 'not_owner');
  const lv = SHOWCASE_LEVELS.includes(body.level) ? body.level : null;
  if (!lv) throw new ApiError(400, 'bad_level');
  await ref('city2/showcase').set(lv);
  await audit(me, 'radioDial', { b: lv });
  return { showcase: lv };
}

/** the open rooms (the AUDIENCE knob's ONE ROOM — the owner): hush word, players, lobby / game */
export async function openRooms(now) {
  const rooms = await liveRoomsRead(now), out = [];   // (FR7 FIXES B — C5: the live rooms by the index, never the whole tree)
  for (const [code, r] of Object.entries(rooms)) {
    if (!r || !r.meta || !/^[A-Z]{4}$/.test(code)) continue;
    const pres = r.presence || {}, players = Object.keys(r.players || {});
    const online = players.filter(u => { const p = pres[u]; return p && (p.c ? Object.keys(p.c).length > 0 : p.online); }).length;
    if (!(r.meta.activeAt > now - 3600e3 || r.meta.createdAt > now - 3600e3)) continue;
    out.push({ code, players: players.length, online, status: r.meta.status === 'playing' ? 'playing' : 'lobby', game: r.game && r.game.id ? r.game.id : null });
  }
  return out.sort((a, b) => b.online - a.online || a.code.localeCompare(b.code));
}
/** THE NIXIE: people in the city now (an estimate — visible titles say hello every ~5 min) + in rooms */
export async function cityCount(now) {
  const here = (await val('here')) || {}, gone = {};
  let n = 0; for (const [u, t] of Object.entries(here)) { if (t > now - HERE_MS) n++; else gone[u] = null; }
  if (Object.keys(gone).length) await ref('here').update(gone);
  return n;
}
export async function hello(uid, now, me = null) {
  if (/^[A-Za-z0-9]{10,40}$/.test(uid)) await ref('/').update({ [`here/${uid}`]: now, [`radio/visits/${dayKey(now)}/${uid}`]: true });   // (THE LEDGER's visitors a day: an estimate — a visible city)
  // (FR7 FIXES B — SIGHTINGS NEED THE CITY OPEN: the profile's city-open stamp, server-written — core/sightings.js#openStep / #cityOpenAt)
  if (me && /^[-_A-Za-z0-9]{6,40}$/.test(me)) await ref(`ppriv/${me}/co`).transaction(cur => openStep(cur, now)).catch(() => {});
  return { ok: true };
}

/** THE LEDGER (the owner): the nixies (in the city · rooms open · games on), TODAY (visitors — an estimate, new players, matches, the
 *  legendaries spotted — Progression counts them, null until then —, the longest streak alive, errors from phones today), THIS WEEK (visits
 *  + games a day). o: { stats (admin.js's STATS), errors () → the error list } */
async function ledger(me, role, now, o) {
  need(rolePower(role, 'stats'), 'not_owner');
  const [S, here, rooms, errs, pst, visits] = await Promise.all([o.stats(now), cityCount(now), openRooms(now), o.errors(now), val('pstats'), val('radio/visits')]);
  const today = dayKey(now), days = [];
  for (let k = 6; k >= 0; k--) days.push(dayKey(now - k * 864e5));
  // (the visits a day: keep 8 days)
  const V = visits || {}, gone = {}; for (const d of Object.keys(V)) if (d < dayKey(now - 8 * 864e5)) gone[d] = null;
  if (Object.keys(gone).length) await ref('radio/visits').update(gone);
  const yest = dayKey(now - 864e5);
  let streak = 0; for (const s of Object.values(pst || {})) { const st = s && s.st; if (st && (st.d === today || st.d === yest) && st.n > streak) streak = st.n; }
  const daily = Object.fromEntries((S.games && S.games.daily || []).map(x => [x.k, x.n]));
  const t0 = new Date(now); const dayStart = now - ((t0.getUTCHours() * 60 + t0.getUTCMinutes()) * 60e3);   // (errors: the last 24 h — the list's own clock)
  return {
    now: { here, rooms: rooms.length, games: rooms.filter(r => r.status === 'playing').length },
    today: { visitors: Object.keys(V[today] || {}).length, newPlayers: (S.today && S.today.newPlayers) || 0, matches: (S.today && S.today.matches) || 0, spotted: null, streak,
      errors: (errs || []).filter(e => e.last > now - 864e5).length },
    week: days.map(d => ({ d, visits: Object.keys(V[d] || {}).length, games: daily[d] || 0 })),
    estimate: true, since: dayStart,
    crew: await crewList(), crewCap: knob('radio').crew.cap, crewIc: { on: !!((await val('radio/crewIc')) || {}).on },
    founder: await founderState().catch(() => null),
  };
}

/** the desk's state (polled every few seconds while it's open): { role, jacks, moments (the caller may see), board, showcase, rooms, here } */
async function state(me, role, uid, body, now) {
  const Q = await queue(now);
  const room = body.room && /^[A-Z]{4}$/.test(String(body.room)) ? String(body.room) : null;
  const mine = role === 'owner' ? Q : Q.filter(m => m.aud === 'room' && m.room === room);
  const out = {
    role, now,
    jacks: jacks().filter(j => roleJack(role, j.id)).map(j => ({ id: j.id, label: j.label, card: j.card, dark: j.dark, len: j.len, lenFull: j.lenFull || null, lane: j.lane, note: j.note, run: canRun(j.id, now) })),
    moments: mine.map(m => ({ ...publicMoment(m.id, m), mine: m.by === me, made: m.made })),
  };
  if (role === 'owner') {
    const [b, sc, rooms, here, ics] = await Promise.all([boardList(now), val('city2/showcase'), openRooms(now), cityCount(now), icList(now)]);
    Object.assign(out, { board: b, showcase: SHOWCASE_LEVELS.includes(sc) ? sc : knob('showcase').level, rooms, here,
      intercom: ics.filter(m => m.by === me).map(m => ({ ...icPublic(m.id, m), unsend: canUnsend(m, now) })), presets: await presetList(), crewIc: { on: !!((await val('radio/crewIc')) || {}).on } });
  } else if (room) {
    out.limits = (await val(`radio/limits/${room}/${nightKey(now, knob('radio').home.tz)}`)) || {};
    // (FRIENDS A — THE CREW INTERCOM: shown only while the owner's switch is ON; their own clips going out; the room's count tonight)
    const cic = !!((await val('radio/crewIc')) || {}).on, KC = knob('radio.intercom').crew;
    out.crewIc = cic ? { on: true, maxS: KC.maxS, left: Math.max(0, KC.perNight - ((out.limits && out.limits.ic) || 0)) } : { on: false };
    if (cic) out.intercom = (await icList(now)).filter(m => m.by === me && m.room === room).map(m => icPublic(m.id, m));
    // CC-B — ONE RADIO PER LOBBY: who holds it here (+ an ask / a refusal for this phone)
    if (await val(`rooms/${room}/players/${uid}`)) {
      const R = await crewOfRoom(room), name = u => (R.players[u] || {}).name || null;
      out.lobby = { code: room, holder: R.holder, holderName: name(R.holder), mine: R.holder === uid, ask: R.ask && R.ask.at > now - 120e3 ? R.ask : null, nope: R.nope && R.nope.uid === uid && R.nope.at > now - 60e3 ? R.nope : null };
    } else out.lobby = { code: room, holder: null, mine: false, out: true };
  }
  return out;
}

/** the radio's actions (adminAction routes every 'radio…' action here BEFORE its admin-only gate: the crew may use some) */
export async function radioAction(me, uid, body, now = Date.now(), o = {}) {
  if (body.action === 'radioHello') return hello(uid, now, me);
  // CC-B — "A ROOM JUST OPENED": any signed-in host tells the server its room is open (the server checks it + notifies the owner once)
  if (body.action === 'radioRoomOpened') return roomOpened(me, uid, body, now);
  const role = await roleOf(me);
  if (body.action === 'radioWho') return { role };
  need(!!role, 'not_radio', 'This profile has no radio.');
  switch (body.action) {
    case 'radioState': return state(me, role, uid, body, now);
    case 'radioCrewSet': return crewSet(me, role, body, now);
    case 'radioCrewList': need(role === 'owner', 'not_owner'); return { crew: await crewList(), cap: knob('radio').crew.cap };
    case 'radioCrewPeek': {   // (the owner's player card: is this player crew? — by the uid he tapped)
      need(role === 'owner', 'not_owner');
      const pid = /^[-_A-Za-z0-9]{3,128}$/.test(String(body.uid || '')) ? await pidOf(String(body.uid)) : null;
      if (!pid) return { pid: null, on: false, why: 'No profile yet — they get one after their first match. Add them then.' };
      const [c, p] = await Promise.all([val(`radio/crew/${pid}`), val(`profiles/${pid}`)]);
      return { pid, on: !!c, n: (p && p.n) || null, t: (p && p.t) || null, owner: pid === me || (await roleOf(pid)) === 'owner', n10: Object.keys((await val('radio/crew')) || {}).length, cap: knob('radio').crew.cap };
    }
    case 'radioAsk': return crewAsk(me, role, uid, body, now);
    case 'radioHand': return crewHand(me, role, uid, body, now);
    case 'radioFire': return fire(me, role, uid, body, now);
    case 'radioStop': return stop(me, role, body, now);
    case 'radioClearAll': return clearAll(me, role, now);
    case 'radioBoard': return board(me, role, body, now, 'add');
    case 'radioBoardEdit': return board(me, role, body, now, 'edit');
    case 'radioBoardCancel': return board(me, role, body, now, 'cancel');
    case 'radioDial': return dial(me, role, body);
    case 'radioRooms': need(role === 'owner', 'not_owner'); return { rooms: await openRooms(now) };
    case 'radioLedger': return ledger(me, role, now, o);
    // PROGRESSION A — THE FOUNDER WINDOW (the owner only; closing sweeps every player who already played first; audited)
    case 'radioFounder': {
      need(role === 'owner', 'not_owner');
      const open = body.open !== false;
      const r = await setFounder(me, open, now);
      await audit(me, open ? 'founderOpen' : 'founderClose', { b: open ? 'FOUNDER WINDOW: OPEN' : `FOUNDER WINDOW: CLOSED · ${r.holders} founders (${r.swept} swept now)` });
      return { founder: r };
    }
    case 'radioIntercom': return intercom(me, role, body, now, uid);
    case 'radioCrewIntercom': {   // (FRIENDS A — the owner's master switch: CREW INTERCOM ON / OFF; server-stored, audited)
      need(role === 'owner', 'not_owner', 'Only the owner turns the crew intercom on.');
      const on = body.on === true;
      await ref('radio/crewIc').set({ on, at: now, by: me });
      await audit(me, on ? 'crewIcOn' : 'crewIcOff', { b: `CREW INTERCOM: ${on ? 'ON' : 'OFF'}` });
      return { crewIc: { on, at: now } };
    }
    case 'radioPreset': return preset(me, role, uid, body, now);
    case 'radioPresetFire': return presetFire(me, role, uid, body, now);
    case 'radioPush': return push(me, role, body, now);
    case 'radioUnsend': return unsend(me, role, body, now);
    default: throw new ApiError(400, 'bad_action');
  }
}

/** the public part of the radio for GET /api/admin?live=1 (every phone, cached): the CITY's moments (everyone + city), the billboard's
 *  messages, the dial — never who fired them */
export async function radioPublic(now) {
  const [Q, b, sc, ics, base] = await Promise.all([queue(now), boardList(now), val('city2/showcase'), icList(now), val('city2/billboard')]);
  return {
    moments: Q.filter(m => (m.aud === 'everyone' || m.aud === 'city') && m.until > now && m.state !== 'stopped').map(m => publicMoment(m.id, m)),
    stopped: [...Q.filter(m => (m.aud === 'everyone' || m.aud === 'city') && m.state === 'stopped' && m.until > now - 600e3).map(m => m.id),
      ...ics.filter(m => m.aud === 'everyone' && m.state === 'stopped').map(m => m.id)],
    // CC-B — THE INTERCOM to EVERYONE: the city's copy (a title phone plays it when it arrives; a phone in a game holds it — audio/intercom.js)
    intercom: ics.filter(m => m.aud === 'everyone' && m.state !== 'stopped').map(m => icPublic(m.id, m)),
    board: b.map(x => ({ id: x.id, lines: x.lines, local: x.local, repeat: x.repeat, at: x.at, until: x.until, made: x.made })),
    showcase: SHOWCASE_LEVELS.includes(sc) ? sc : null,
    // CITY FIXES + HOLD'EM — the roof board's BASE POSTER switch (/admin → THE BILLBOARD); null = the timetable's default (ON · NOW OPEN from its `open` day — HOLD'EM IN THE CITY)
    // (THE TRI-VISION: + JAYWALK's switch — the roof board's second face: ON / OFF · COMING SOON / NOW OPEN · its OPEN DAY)
    base: base && (base.holdem || base.jaywalk) ? { ...(base.holdem ? { holdem: cleanHoldem(base.holdem) } : {}), ...(base.jaywalk ? { jaywalk: cleanJaywalk(base.jaywalk) } : {}) } : null,
  };
}

// ------------------------------------------------------------------ CITY CONTROLS B — THE INTERCOM (the owner only)
/** the intercom's announcements, pruned (an hour: `keep` — the clips go with them) → [{ id, ...m, state }] */
async function icList(now) {
  const all = (await val('radio/ic')) || {}, keep = knob('radio.intercom').keep * 1000, out = [], gone = {};
  for (const [id, m] of Object.entries(all)) {
    // (PROGRESSION B's add-on — THE WHEN: a scheduled clip is kept until it plays + its usual hour, then goes with its clip)
    if (!m || !(Math.max(m.made || 0, m.at || 0) > now - keep)) { gone[`radio/ic/${id}`] = null; gone[`radio/clips/${id}`] = null; continue; }
    out.push({ id, ...m, state: m.state === 'stopped' ? 'stopped' : now < m.at ? 'q' : now < m.until ? 'run' : 'done' });
  }
  if (Object.keys(gone).length) await ref('/').update(gone);
  return out.sort((a, b) => a.at - b.at);
}
/** SEND { aud, room?, wait, head?, mime, dur, b64 } → { intercom } — the clip + the announcement written by the SERVER, every lobby's copy */
async function intercom(me, role, body, now, uid = null) {
  // FRIENDS A — THE CREW INTERCOM: the crew's hold-to-talk for THEIR OWN ROOM — only while the owner's switch is ON (OFF: refused, the mic
  // isn't shown); the room they're IN + hold its radio (ONE RADIO PER LOBBY); NOW only (no schedule), no headline, ≤ crew.maxS s, crew.perNight
  // a room a night. The owner's own intercom is unchanged.
  const KC = knob('radio.intercom').crew;
  if (role === 'crew') {
    need(!!((await val('radio/crewIc')) || {}).on, 'crew_ic_off', 'The crew intercom is off.');
    need(body.aud === 'room', 'not_your_audience', 'The crew talks to the room they’re in only.');
    if (body.when && body.when !== 'now') throw new ApiError(400, 'bad_time', 'The crew intercom plays right away.');
    if (Number(body.dur) > KC.maxS + 0.5) throw new ApiError(400, 'bad_length', `Up to ${KC.maxS} seconds.`);
    body = { ...body, head: '', when: 'now' };
    const code = String(body.room || '').toUpperCase();
    if (!/^[A-Z]{4}$/.test(code) || !(await val(`rooms/${code}/meta`))) throw new ApiError(404, 'no_room', 'That lobby is closed.');
    need(!!uid && !!(await val(`rooms/${code}/players/${uid}`)), 'not_in_room', 'You can only talk in the lobby you are in.');
    const R = await crewOfRoom(code);
    need(R.holder === uid, 'not_holder', `THE RADIO’S WITH ${R.holder ? (R.players[R.holder] || {}).name || 'ANOTHER CREW MEMBER' : 'NOBODY'} TONIGHT — whoever hosts runs the show in this lobby.`);
  } else need(role === 'owner', 'not_owner', 'The intercom is the owner’s.');
  const pre = cleanIntercom(body);
  if (pre.bad) throw new ApiError(400, pre.bad, IC_WHY[pre.bad] || undefined);
  let names = [], rooms = [];
  if (pre.req.aud === 'room') {
    if (!(await val(`rooms/${pre.req.room}/meta`))) throw new ApiError(404, 'no_room', 'That lobby is closed.');
    names = await roomNames(pre.req.room); rooms = [pre.req.room];
  } else if (pre.req.aud === 'everyone') rooms = (await openRooms(now)).map(r => r.code);
  const { req, bad } = cleanIntercom(body, { names });
  if (bad) throw new ApiError(400, bad, IC_WHY[bad] || undefined);
  const K = knob('radio.intercom');
  if ((await icList(now)).filter(m => m.state !== 'stopped').length >= 12) throw new ApiError(429, 'queue_full', 'Twelve announcements this hour — wait a little.');
  const W = icWhen(body, now);
  if (W.bad) throw new ApiError(400, W.bad, IC_WHY[W.bad]);
  // (the crew's per-room-per-night count — taken only once the clip passed every check; a refusal counts nothing)
  if (role === 'crew') {
    const lim = `radio/limits/${req.room}/${nightKey(now, knob('radio').home.tz)}/ic`;
    const t = await ref(lim).transaction(cur => ((cur || 0) >= KC.perNight ? undefined : (cur || 0) + 1));
    if (!t.committed) throw new ApiError(429, 'ic_limit', `${KC.perNight} crew clips in this room tonight — that’s the lot.`);
  }
  const id = ref('radio/ic').push().key, at = W.at || now + K.lead[req.aud] * 1000;
  const m = { aud: req.aud, room: req.room, wait: req.wait, head: req.head, mime: req.mime, dur: req.dur, bytes: req.bytes, by: me, role, made: now, at, until: at + icLen(req.dur) * 1000, state: 'q', rooms };
  const up = { [`radio/ic/${id}`]: m, [`radio/clips/${id}`]: { b64: req.b64, mime: req.mime, made: now } };
  for (const code of rooms) up[`rooms/${code}/radio/${id}`] = icPublic(id, m);
  await ref('/').update(up);
  await audit(me, 'radioIntercom', { b: `${req.dur.toFixed(1)} s → ${AUD_LABEL[req.aud]}${req.room ? ` ${req.room}` : ''}${req.aud === 'everyone' ? ` (+${rooms.length} lobbies)` : ''}${req.head ? ` “${req.head}”` : ''}${req.wait ? '' : ' · don’t wait'}${W.at ? ` · at ${new Date(W.at).toISOString().slice(11, 16)} UTC` : ''}`.slice(0, 140), role, aud: req.aud });
  return { intercom: { ...icPublic(id, m), unsend: true } };
}
/** UNSEND { id } — the announcement stopped everywhere + the clip deleted (a phone that hasn't fetched it never plays it) */
async function unsend(me, role, body, now) {
  need(role === 'owner', 'not_owner');
  const id = String(body.id || '');
  if (!/^[-_A-Za-z0-9]{10,40}$/.test(id)) throw new ApiError(400, 'bad_id');
  const m = await val(`radio/ic/${id}`);
  if (!m) throw new ApiError(404, 'no_message');
  const up = { [`radio/ic/${id}/state`]: 'stopped', [`radio/ic/${id}/until`]: Math.min(m.until, now), [`radio/clips/${id}`]: null };
  for (const code of m.rooms || []) if (/^[A-Z]{4}$/.test(code) && (await val(`rooms/${code}/meta`))) up[`rooms/${code}/radio/${id}/state`] = 'stopped';   // (a lobby closed since: skipped)
  await ref('/').update(up);
  await audit(me, 'radioUnsend', { b: `${(m.dur || 0).toFixed(1)} s → ${AUD_LABEL[m.aud]}${m.room ? ` ${m.room}` : ''}${canUnsend(m, now) ? '' : ' (late)'}` });
  return { ok: true };
}
/** GET ?clip=<id> — the clip's bytes (null: gone, unsent or past its hour) */
export async function clipOf(id, now = Date.now()) {
  if (!/^[-_A-Za-z0-9]{10,40}$/.test(String(id || ''))) return null;
  const [m, c] = await Promise.all([val(`radio/ic/${id}`), val(`radio/clips/${id}`)]);
  if (!m || !c || m.state === 'stopped' || !(Math.max(m.made || 0, m.at || 0) > now - knob('radio.intercom').keep * 1000)) return null;
  return { mime: c.mime, buf: Buffer.from(c.b64, 'base64') };
}

// ------------------------------------------------------------------ CITY CONTROLS B — THE CREW (the owner grants; the crew's lobby radio)
/** a lobby's crew + who holds its radio → { meta, players, crewUids, holder, hand, ask, nope } */
async function crewOfRoom(code) {
  const [meta, players, rc] = await Promise.all([val(`rooms/${code}/meta`), val(`rooms/${code}/players`), val(`rooms/${code}/radioCrew`)]);
  const P = players || {}, crewUids = [];
  await Promise.all(Object.keys(P).map(async u => { const pid = await val(`uids/${u}`); if (isPid(pid) && (await val(`radio/crew/${pid}`))) crewUids.push(u); }));
  const R = rc || {};
  return { meta: meta || {}, players: P, crewUids, holder: meta ? radioHolder({ hostId: meta.hostId, players: P, hand: R.hand || null }, crewUids) : null, hand: R.hand || null, ask: R.ask || null, nope: R.nope || null };
}
/** THE CREW (THE LEDGER + the toggle): [{ pid, n, t, a, c, at, last: { jack, at } | null }] — newest first */
async function crewList() {
  const all = (await val('radio/crew')) || {}, fired = (await val('radio/fired')) || {}, out = [];
  const last = {}; for (const f of Object.values(fired)) if (f && f.role === 'crew' && f.by && (!last[f.by] || f.at > last[f.by].at)) last[f.by] = { jack: f.jack, at: f.at };
  for (const [pid, c] of Object.entries(all)) {
    if (!c) continue;
    const p = (await val(`profiles/${pid}`)) || {};
    out.push({ pid, n: p.n || c.n || '?', t: p.t || c.t || '', a: p.a || null, c: p.c || null, at: c.at || 0, last: last[pid] || null });
  }
  return out.sort((a, b) => b.at - a.at);
}
/** THE CREW TOGGLE (the owner): { uid (a player he tapped) | tag ("MIKE#4821") | pid, on } — follows the PROFILE; cap 10; no profile = no */
async function crewSet(me, role, body, now) {
  need(role === 'owner', 'not_owner', 'Only the owner picks the crew.');
  let pid = null;
  if (body.uid) { if (!/^[-_A-Za-z0-9]{3,128}$/.test(String(body.uid))) throw new ApiError(400, 'bad_uid'); pid = await pidOf(String(body.uid)); if (!pid) throw new ApiError(404, 'no_profile', 'No profile yet — they get one after their first match. Add them then.'); }
  else if (body.tag) { const t = parseTag(body.tag); if (!t) throw new ApiError(400, 'bad_tag', 'Type a name tag like MIKE#4821.'); pid = await val(`tags/${encodeKey(nameKey(t.name))}/${t.tag}`); if (!isPid(pid)) throw new ApiError(404, 'no_tag', 'No player with that name tag.'); }
  else if (isPid(String(body.pid || ''))) pid = String(body.pid);
  if (!pid) throw new ApiError(400, 'bad_player');
  const on = body.on !== false, prof = await val(`profiles/${pid}`);
  if (on) {
    if (!prof) throw new ApiError(404, 'no_profile', 'No profile yet — they get one after their first match.');
    if (pid === me || (await roleOf(pid)) === 'owner') throw new ApiError(400, 'is_owner', 'That’s you — the owner outranks the crew.');
    const all = (await val('radio/crew')) || {};
    if (!all[pid] && Object.keys(all).length >= knob('radio').crew.cap) throw new ApiError(429, 'crew_full', `THE CREW IS FULL (${knob('radio').crew.cap}) — remove someone first.`);
    if (!all[pid]) await ref(`radio/crew/${pid}`).set({ at: now, by: me, n: prof.n || '', t: prof.t || '' });
  } else await ref(`radio/crew/${pid}`).remove();
  await audit(me, on ? 'radioCrewAdd' : 'radioCrewRemove', { b: `${(prof && prof.n) || '?'}#${(prof && prof.t) || ''}`, pid });
  // (SHELL 2.0 B2 — THE CREW SWITCH LIVE: flipped from a player's card in a room → a stamp on the room's node, so THEIR phone loads / drops its
  //  radio at once — app.js#paintCrew → radio-gate.js; only for a uid that really is in that room)
  const room = String(body.room || '').toUpperCase();
  if (body.uid && /^[A-Z]{4}$/.test(room) && (await val(`rooms/${room}/players/${String(body.uid)}`))) await ref(`rooms/${room}/radioCrew/role/${String(body.uid)}`).set({ on, at: now });
  return { pid, on, crew: await crewList() };
}
/** ASK FOR THE RADIO (a crew member who doesn't hold it) → the holder's phone sees it on the room's node */
async function crewAsk(me, role, uid, body, now) {
  need(role === 'crew', 'not_crew');
  const room = String(body.room || '').toUpperCase(); if (!/^[A-Z]{4}$/.test(room)) throw new ApiError(400, 'bad_room');
  need(!!(await val(`rooms/${room}/players/${uid}`)), 'not_in_room', 'Join the lobby first.');
  const R = await crewOfRoom(room);
  if (R.holder === uid) throw new ApiError(400, 'is_holder', 'The radio’s already yours.');
  await ref(`rooms/${room}/radioCrew`).update({ ask: { uid, name: (R.players[uid] || {}).name || 'A CREW MEMBER', at: now }, nope: null });
  await audit(me, 'radioAsk', { b: `${room} → ${(R.players[R.holder] || {}).name || '?'}` });
  return { ok: true };
}
/** HAND IT OVER / KEEP IT (the holder) */
async function crewHand(me, role, uid, body, now) {
  need(role === 'crew', 'not_crew');
  const room = String(body.room || '').toUpperCase(); if (!/^[A-Z]{4}$/.test(room)) throw new ApiError(400, 'bad_room');
  const R = await crewOfRoom(room);
  need(R.holder === uid, 'not_holder', 'The radio isn’t yours to hand over.');
  if (!R.ask) throw new ApiError(404, 'no_ask', 'Nobody asked.');
  const give = body.give === true && R.crewUids.includes(R.ask.uid);
  await ref(`rooms/${room}/radioCrew`).update(give ? { hand: { uid: R.ask.uid, host: R.meta.hostId, at: now, from: uid }, ask: null, nope: null } : { ask: null, nope: { uid: R.ask.uid, at: now } });
  await audit(me, give ? 'radioHandOver' : 'radioKeep', { b: `${room} → ${R.ask.name}` });
  return { ok: true, give };
}

// ------------------------------------------------------------------ CITY CONTROLS B — PRESETS (the owner's saved combos — built, tucked away)
const PRESET_MAX = 12, STEP_MAX = 6;
/** a saved step, re-checked with the same rules as a live fire → the clean body | null */
function cleanStep(st) {
  if (!st || typeof st !== 'object') return null;
  if (st.kind === 'board') { const { msg, bad } = cleanBoard(st.body || {}); return bad ? null : { kind: 'board', body: { lines: msg.lines, local: msg.local, repeat: msg.repeat } }; }
  if (st.kind === 'fire') { const { req, bad } = cleanFire(st.body || {}); if (bad) return null; const { jack, aud, room, text, colour, show, dance, local } = req; return { kind: 'fire', body: { jack, aud, room, text, colour, show, dance, local } }; }
  return null;
}
async function presetList() {
  const all = (await val('radio/presets')) || {};
  return Object.entries(all).filter(([, x]) => x && Array.isArray(x.steps)).map(([id, x]) => ({ id, name: x.name, steps: x.steps, at: x.at || 0 })).sort((a, b) => a.at - b.at);
}
/** SAVE / ADD A STEP / DELETE A STEP / RENAME / DELETE: { op: 'add' (id? | name), step } · { op: 'drop', id, i } · { op: 'name', id, name } · { op: 'delete', id } */
async function preset(me, role, uid, body, now) {
  need(role === 'owner', 'not_owner', 'Presets are the owner’s.');
  const op = String(body.op || ''), all = (await val('radio/presets')) || {};
  const cleanName = n => { const w = cleanWords(n, { max: 16 }); if (w.bad) throw new ApiError(400, `words_${w.bad}`, WORDS_WHY[w.bad]); return w.text; };
  const idOk = id => { if (!/^[-_A-Za-z0-9]{10,40}$/.test(String(id || '')) || !all[id]) throw new ApiError(404, 'no_preset'); return String(id); };
  if (op === 'add') {
    const step = cleanStep(body.step); if (!step) throw new ApiError(400, 'bad_step', 'That card isn’t set up right.');
    let id = body.id ? idOk(body.id) : null;
    if (!id) { if (Object.keys(all).length >= PRESET_MAX) throw new ApiError(429, 'presets_full', `${PRESET_MAX} presets — delete one first.`); id = ref('radio/presets').push().key; await ref(`radio/presets/${id}`).set({ name: cleanName(body.name || 'PRESET'), steps: [step], at: now }); }
    else { const steps = all[id].steps || []; if (steps.length >= STEP_MAX) throw new ApiError(429, 'steps_full', `${STEP_MAX} steps a preset.`); await ref(`radio/presets/${id}/steps`).set([...steps, step]); }
    await audit(me, 'radioPreset', { b: `add ${step.kind} ${step.body.jack || 'billboard'} → ${id}` });
  } else if (op === 'drop') { const id = idOk(body.id), steps = (all[id].steps || []).filter((_, i) => i !== Number(body.i)); if (steps.length) await ref(`radio/presets/${id}/steps`).set(steps); else await ref(`radio/presets/${id}`).remove(); await audit(me, 'radioPreset', { b: `drop step ${body.i} of ${id}` }); }
  else if (op === 'name') { const id = idOk(body.id); await ref(`radio/presets/${id}/name`).set(cleanName(body.name)); await audit(me, 'radioPreset', { b: `rename ${id}` }); }
  else if (op === 'delete') { const id = idOk(body.id); await ref(`radio/presets/${id}`).remove(); await audit(me, 'radioPreset', { b: `delete ${all[id].name}` }); }
  else throw new ApiError(400, 'bad_op');
  return { presets: await presetList() };
}
/** FIRE A PRESET: each step through the SAME checks as a live fire (one that can't go now is reported, the rest still go) */
async function presetFire(me, role, uid, body, now) {
  need(role === 'owner', 'not_owner');
  const id = String(body.id || ''), p = /^[-_A-Za-z0-9]{10,40}$/.test(id) ? await val(`radio/presets/${id}`) : null;
  if (!p) throw new ApiError(404, 'no_preset');
  const results = [];
  for (const st of p.steps || []) {
    const c = cleanStep(st);
    try {
      if (!c) throw new ApiError(400, 'bad_step');
      if (c.kind === 'board') { const r = await board(me, role, c.body, now, 'add'); results.push({ ok: true, kind: 'board', id: r.message.id }); }
      else { const r = await fire(me, role, uid, c.body, now); results.push({ ok: true, kind: 'fire', jack: c.body.jack, id: r.moment.id }); }
    } catch (e) { results.push({ ok: false, kind: c ? c.kind : 'bad', jack: c && c.body.jack, why: e.message || e.code }); }
  }
  await audit(me, 'radioPresetFire', { b: `${p.name}: ${results.map(r => `${r.jack || r.kind}${r.ok ? '' : ' ✗'}`).join(', ')}`.slice(0, 140) });
  return { results };
}

// ------------------------------------------------------------------ CITY CONTROLS B — "A ROOM JUST OPENED" (a push to the owner's phone)
const subKey = ep => createHash('sha256').update(String(ep)).digest('hex').slice(0, 24);
/** push to every phone the owner turned it on for → { sent, gone } (a subscription the service says is gone is dropped) */
export async function notifyOwner(data) {
  const subs = (await val('radio/push/subs')) || {}, out = { sent: 0, gone: 0, codes: [] };
  await Promise.all(Object.entries(subs).map(async ([k, sub]) => {
    const st = await sendPush(sub, data);
    out.codes.push(st);
    if (st >= 200 && st < 300) out.sent++;
    else if (st === 404 || st === 410) { out.gone++; await ref(`radio/push/subs/${k}`).remove(); }
  }));
  return out;
}
/** THE LEDGER's switch: { op: 'state' (+ endpoint) · 'sub' { sub } · 'unsub' { endpoint } · 'set' { on } · 'test' } */
async function push(me, role, body, now) {
  need(role === 'owner', 'not_owner', 'The push is the owner’s.');
  const V = vapid(), op = String(body.op || 'state');
  const subs = async () => (await val('radio/push/subs')) || {};
  if (op === 'sub') {
    if (!V) throw new ApiError(503, 'no_vapid', 'The push keys aren’t set up on the server yet (Vercel → VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY).');
    const sub = body.sub || {}, k = sub.keys || {};
    if (!okEndpoint(sub.endpoint) || !/^[A-Za-z0-9_-]{80,100}$/.test(String(k.p256dh || '')) || !/^[A-Za-z0-9_-]{16,30}$/.test(String(k.auth || ''))) throw new ApiError(400, 'bad_sub', 'That phone’s subscription doesn’t look right.');
    if (Object.keys(await subs()).length >= 6 && !(await subs())[subKey(sub.endpoint)]) throw new ApiError(429, 'subs_full', 'Six phones already get it — turn one off first.');
    await ref('radio/push').update({ [`subs/${subKey(sub.endpoint)}`]: { endpoint: sub.endpoint, keys: { p256dh: k.p256dh, auth: k.auth }, at: now, ua: String(body.ua || '').slice(0, 80) }, on: true });
    await audit(me, 'radioPushOn', { b: new URL(sub.endpoint).hostname });
  } else if (op === 'unsub') {
    if (body.endpoint) await ref(`radio/push/subs/${subKey(body.endpoint)}`).remove();
    if (!Object.keys(await subs()).length) await ref('radio/push/on').set(false);
    await audit(me, 'radioPushOff', { b: body.endpoint ? new URL(String(body.endpoint)).hostname : 'all' });
  } else if (op === 'set') { await ref('radio/push/on').set(body.on === true); await audit(me, body.on === true ? 'radioPushOn' : 'radioPushOff', { b: 'switch' }); }
  else if (op === 'test') {
    const r = await notifyOwner({ title: 'A ROOM JUST OPENED', body: 'TEST · this is how it looks', url: '/?city=2', tag: 'ns-test' });
    await audit(me, 'radioPushTest', { b: `${r.sent} sent · ${r.gone} gone` });
    return { sent: r.sent, gone: r.gone, codes: r.codes };
  } else if (op !== 'state') throw new ApiError(400, 'bad_op');
  const S = await subs();
  return { key: V ? V.pub : null, on: !!(await val('radio/push/on')), subs: Object.keys(S).length, mine: body.endpoint ? !!S[subKey(body.endpoint)] : null };
}
/** a host's room just opened (room.js#roomPushLater — ~10 s after createRoom): the room must be theirs + brand new + STILL OPEN with a
 *  player and its host online (FR6 FIXES A: the owner's pushes for rooms that were empty when he went); once a room; never the owner's own.
 *  The push opens THAT room's join (/?room=CODE); a room closed by then lands on "That room has closed" (app.js#inviteExpired) */
async function roomOpened(me, uid, body, now) {
  const code = String(body.room || '').toUpperCase();
  if (!/^[A-Z]{4}$/.test(code)) throw new ApiError(400, 'bad_room');
  const meta = await val(`rooms/${code}/meta`);
  if (!meta || meta.hostId !== uid || !(meta.createdAt > now - 120e3)) return { ok: true, sent: 0 };
  const players = (await val(`rooms/${code}/players`)) || {};
  if (!players[uid] || !presenceOnline(await val(`rooms/${code}/presence/${uid}`))) return { ok: true, sent: 0, why: 'not_open' };
  if (!(await val('radio/push/on')) || (me && (await roleOf(me)) === 'owner')) return { ok: true, sent: 0 };
  const t = await ref(`radio/push/sent/${code}`).transaction(cur => (cur && cur > now - 3600e3 ? undefined : now));
  if (!t.committed) return { ok: true, sent: 0 };
  // (FR6 FIXES A — G7: a TEST room (the tab's &test=1 — js/identity.js#testMode) is marked, never pushed)
  if (body.silent === true) return { ok: true, sent: 0, silent: true };
  // (C4: a create → push → close loop could ping the owner's phone + watch once per hush word (~1,400). Now ONE per sender an hour and
  //  PUSH_LIMITS.perHour in all — the room's mark above stays, so a refused one never pings later)
  if (!(await take(`push_u_${uid}`, PUSH_LIMITS.perUid, 3600e3, now)) || !(await take(`push_all_${Math.floor(now / 3600e3)}`, PUSH_LIMITS.perHour, 3600e3, now))) return { ok: true, sent: 0, why: 'limit' };
  const n = Object.keys(players).length || 1;
  const r = await notifyOwner({ title: 'A ROOM JUST OPENED', body: `${code} · ${n} player${n === 1 ? '' : 's'}`, url: `/?room=${code}`, tag: `room-${code}` });
  // (the once-a-room marks: a day kept)
  const sent = (await val('radio/push/sent')) || {}, gone = {}; for (const [c, at] of Object.entries(sent)) if (!(at > now - 864e5)) gone[c] = null;
  if (Object.keys(gone).length) await ref('radio/push/sent').update(gone);
  return { ok: true, sent: r.sent };
}
