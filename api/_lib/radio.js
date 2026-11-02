// CITY CONTROLS A — THE RADIO on the server (POST /api/admin { action: 'radio…' }; docs/profiles.md "THE RADIO"). The ROLE is checked PER
// ACTION (core/harbor-radio.js#ROLES — the owner = ADMIN_PIDS; THE CREW = radio/crew/{pid}, granted in CC-B): the jack, the audience, the
// moment's own rules (after dark, one at a time per lane), the crew's limits — then the SERVER writes every result. A phone never writes a
// moment, the queue, the dial or a room's radio node (database.rules.json: server only). Every action → audit/ (who, what, the audience,
// the words).
//   radio/q/{id}          every moment fired (q · run · done · stopped) — the queue; pruned after `keep` s
//   radio/fired/{id}      THE RECORD (what, when, the audience, who, sight: the owner's to a real audience — PROGRESSION 2.0 counts a
//                         fired moment a player SPOTS as a City Sighting once a day; previews + the crew's never)
//   radio/board/{id}      the owner's BILLBOARD messages (now · at a time · every week)
//   radio/crew/{pid}      THE CREW (CC-B); radio/limits/{room}/{night} the crew's counts + the cooldown
//   rooms/{CODE}/radio/{id}  a room's moments (its phones listen on the room's socket — ~1–2 s)
//   city2/showcase        the TUNING WINDOW's level (every phone reads it through GET /api/admin?live=1, with the city's moments)
//   here/{uid}            THE NIXIE's count: a visible title says hello every ~2 min (an ESTIMATE until Vercel Analytics)
import { ApiError } from './http.js';
import { ref, val, adminPids, emulated } from './fb.js';
import { knob } from '../../js/core/harbor-schedule.js';
import { jacks, jackDef, roleJack, roleAudience, rolePower, canRun, cleanFire, cleanBoard, planStart, lenOf, scopeOf, publicMoment, crewCheck, nightKey, localStart, phaseOf, AUD_LABEL, WORDS_WHY } from '../../js/core/harbor-radio.js';
import { SHOWCASE_LEVELS } from '../../js/core/harbor-showcase.js';
import { dayKey } from '../../js/core/week.js';

const HERE_MS = 180e3;
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
    if (role === 'crew') need(!!(await val(`rooms/${pre.req.room}/players/${uid}`)), 'not_in_room', 'You can only fire in the room you are in.');
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
  if (role === 'crew') { const c = crewCheck(req.jack, await val(limPath), now); if (!c.ok) throw new ApiError(429, c.why, c.note); }
  const Q = await queue(now);
  if (Q.filter(m => m.state === 'q' || m.state === 'run').length >= K.queueMax) throw new ApiError(429, 'queue_full', 'The queue is full — wait for one to finish.');
  const m0 = { jack: req.jack, aud: req.aud, room: req.room, by: me, role };
  const scope = scopeOf(m0), sameScope = Q.filter(x => scopeOf(x) === scope);
  const P = planStart(sameScope, m0, Math.max(now, want - (req.aud === 'room' ? K.lead.room : req.aud === 'me' ? K.lead.me : K.lead.city) * 1000));
  const id = ref('radio/q').push().key;
  const m = { ...m0, text: req.text, colour: req.colour, show: req.show, dance: req.dance, local: req.local, at: P.at, until: P.at + lenOf(req) * 1000, made: now, state: 'q' };
  const up = { [`radio/q/${id}`]: m };
  for (const mv of P.moved) up[`radio/q/${mv.id}/at`] = mv.at, up[`radio/q/${mv.id}/until`] = mv.until;
  if (req.aud === 'room') {
    up[`rooms/${req.room}/radio/${id}`] = publicMoment(id, m);
    for (const mv of P.moved) { const x = Q.find(y => y.id === mv.id); if (x && x.aud === 'room') { up[`rooms/${x.room}/radio/${mv.id}/at`] = mv.at; up[`rooms/${x.room}/radio/${mv.id}/until`] = mv.until; } }
  }
  up[`radio/fired/${id}`] = { jack: m.jack, at: m.at, aud: m.aud, room: m.room || null, role, by: me, sight: role === 'owner' && m.aud !== 'me' };
  if (role === 'crew' && limPath) {
    const lg = (await val(limPath)) || {}, j = jackDef(m.jack);
    up[`${limPath}/counts/${j.limit}`] = ((lg.counts && lg.counts[j.limit]) || 0) + 1;
    up[`${limPath}/lastEnd`] = m.until;
  }
  await ref('/').update(up);
  await audit(me, 'radioFire', { b: words(m).slice(0, 140), role, aud: m.aud });
  return { moment: { id, ...m, wait: P.wait } };
}

/** STOP { id } — the owner: anything; the crew: their own */
async function stop(me, role, body, now) {
  const id = String(body.id || '');
  if (!/^[-_A-Za-z0-9]{10,40}$/.test(id)) throw new ApiError(400, 'bad_id');
  const m = await val(`radio/q/${id}`);
  if (!m) throw new ApiError(404, 'no_moment');
  need(rolePower(role, 'stopAny') || m.by === me, 'not_yours', 'You can stop your own moments only.');
  const up = { [`radio/q/${id}/state`]: 'stopped', [`radio/q/${id}/until`]: Math.min(m.until, now) };
  if (m.aud === 'room' && m.room) { up[`rooms/${m.room}/radio/${id}/state`] = 'stopped'; up[`rooms/${m.room}/radio/${id}/until`] = Math.min(m.until, now); }
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
    if (m.aud === 'room' && m.room) { up[`rooms/${m.room}/radio/${m.id}/state`] = 'stopped'; up[`rooms/${m.room}/radio/${m.id}/until`] = Math.min(m.until, now); }
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
  const rooms = (await val('rooms')) || {}, out = [];
  for (const [code, r] of Object.entries(rooms)) {
    if (!r || !r.meta || !/^[A-Z]{4}$/.test(code)) continue;
    const pres = r.presence || {}, players = Object.keys(r.players || {});
    const online = players.filter(u => { const p = pres[u]; return p && (p.c ? Object.keys(p.c).length > 0 : p.online); }).length;
    if (!(r.meta.activeAt > now - 3600e3 || r.meta.createdAt > now - 3600e3)) continue;
    out.push({ code, players: players.length, online, status: r.meta.status === 'playing' ? 'playing' : 'lobby', game: r.game && r.game.id ? r.game.id : null });
  }
  return out.sort((a, b) => b.online - a.online || a.code.localeCompare(b.code));
}
/** THE NIXIE: people in the city now (an estimate — visible titles say hello every ~2 min) + in rooms */
export async function cityCount(now) {
  const here = (await val('here')) || {}, gone = {};
  let n = 0; for (const [u, t] of Object.entries(here)) { if (t > now - HERE_MS) n++; else gone[u] = null; }
  if (Object.keys(gone).length) await ref('here').update(gone);
  return n;
}
export async function hello(uid, now) {
  if (/^[A-Za-z0-9]{10,40}$/.test(uid)) await ref('/').update({ [`here/${uid}`]: now, [`radio/visits/${dayKey(now)}/${uid}`]: true });   // (THE LEDGER's visitors a day: an estimate — a visible city)
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
  };
}

/** the desk's state (polled every few seconds while it's open): { role, jacks, moments (the caller may see), board, showcase, rooms, here } */
async function state(me, role, body, now) {
  const Q = await queue(now);
  const room = body.room && /^[A-Z]{4}$/.test(String(body.room)) ? String(body.room) : null;
  const mine = role === 'owner' ? Q : Q.filter(m => m.aud === 'room' && m.room === room);
  const out = {
    role, now,
    jacks: jacks().filter(j => roleJack(role, j.id)).map(j => ({ id: j.id, label: j.label, card: j.card, dark: j.dark, len: j.len, lenFull: j.lenFull || null, lane: j.lane, note: j.note, run: canRun(j.id, now) })),
    moments: mine.map(m => ({ ...publicMoment(m.id, m), mine: m.by === me, made: m.made })),
  };
  if (role === 'owner') {
    const [b, sc, rooms, here] = await Promise.all([boardList(now), val('city2/showcase'), openRooms(now), cityCount(now)]);
    Object.assign(out, { board: b, showcase: SHOWCASE_LEVELS.includes(sc) ? sc : knob('showcase').level, rooms, here });
  } else if (room) {
    out.limits = (await val(`radio/limits/${room}/${nightKey(now, knob('radio').home.tz)}`)) || {};
  }
  return out;
}

/** the radio's actions (adminAction routes every 'radio…' action here BEFORE its admin-only gate: the crew may use some) */
export async function radioAction(me, uid, body, now = Date.now(), o = {}) {
  if (body.action === 'radioHello') return hello(uid, now);
  const role = await roleOf(me);
  if (body.action === 'radioWho') return { role };
  need(!!role, 'not_radio', 'This profile has no radio.');
  switch (body.action) {
    case 'radioState': return state(me, role, body, now);
    case 'radioFire': return fire(me, role, uid, body, now);
    case 'radioStop': return stop(me, role, body, now);
    case 'radioClearAll': return clearAll(me, role, now);
    case 'radioBoard': return board(me, role, body, now, 'add');
    case 'radioBoardEdit': return board(me, role, body, now, 'edit');
    case 'radioBoardCancel': return board(me, role, body, now, 'cancel');
    case 'radioDial': return dial(me, role, body);
    case 'radioRooms': need(role === 'owner', 'not_owner'); return { rooms: await openRooms(now) };
    case 'radioLedger': return ledger(me, role, now, o);
    default: throw new ApiError(400, 'bad_action');
  }
}

/** the public part of the radio for GET /api/admin?live=1 (every phone, cached): the CITY's moments (everyone + city), the billboard's
 *  messages, the dial — never who fired them */
export async function radioPublic(now) {
  const [Q, b, sc] = await Promise.all([queue(now), boardList(now), val('city2/showcase')]);
  return {
    moments: Q.filter(m => (m.aud === 'everyone' || m.aud === 'city') && m.until > now && m.state !== 'stopped').map(m => publicMoment(m.id, m)),
    stopped: Q.filter(m => (m.aud === 'everyone' || m.aud === 'city') && m.state === 'stopped' && m.until > now - 600e3).map(m => m.id),
    board: b.map(x => ({ id: x.id, lines: x.lines, local: x.local, repeat: x.repeat, at: x.at, until: x.until, made: x.made })),
    showcase: SHOWCASE_LEVELS.includes(sc) ? sc : null,
  };
}
