// PLAY NOW — Group 2: WHO'S ON (the owner, Nov 12 — DECIDED): who's online NOW — the radio's LEDGER (a tap on IN THE CITY) + /admin STATS,
// one list. PURE (the server builds it — api/_lib/radio.js#whosOn; tests/whos-on.test.mjs): no new call anywhere — the city's existing
// radioHello (every ~5 min, on screen + focused) carries WHERE the phone is (`w`: the city / a daily), the server keeps here/{uid} =
// { at, pid?, w }; a ROOM's members come from the rooms themselves (live, exact — presence online); a DAILY is confirmed by the daily's own
// record (started today, no score yet). The window = HERE_MS (6 min — the 5-min hello + slack). One account on two devices = one row (the
// most telling place wins: a room > a daily > the city). Guests (no profile) are only COUNTED.

/** PURE: a here/ entry → { at, pid, w } (the old shape was a bare timestamp) */
export function hereEntry(v) {
  if (typeof v === 'number') return { at: v, pid: null, w: null };
  if (!v || typeof v !== 'object' || typeof v.at !== 'number') return null;
  return { at: v.at, pid: typeof v.pid === 'string' ? v.pid : null, w: v.w && typeof v.w === 'object' ? v.w : null };
}
/** PURE: what a phone may say about where it is (the hello's `w`) — anything else = the city */
export function cleanWhere(w) {
  if (!w || typeof w !== 'object') return { k: 'city' };
  if (w.k === 'daily' && typeof w.d === 'string' && /^[a-z]{2,16}$/.test(w.d)) return { k: 'daily', d: w.d };
  if (w.k === 'room') return { k: 'room' };
  return { k: 'city' };
}
const RANK = { room: 0, solo: 0, daily: 1, city: 2 };
const online = p => !!(p && (p.c && typeof p.c === 'object' ? Object.keys(p.c).length > 0 : p.v === 2 ? false : p.online === true));
/**
 * PURE: the list.
 *   here      { uid: number | { at, pid, w } }      rooms  { CODE: { meta, players, presence, game } } (the live rooms)
 *   midDaily  (pid, dailyId) → boolean (the daily's own record: started today, no score yet)
 * → { rows: [{ pid, where: { k: 'room'|'solo'|'daily'|'city', code?, g?, p?, d? }, at }], guests: { city, rooms, daily, n } }
 */
export function whosOn({ here = {}, rooms = {}, now = Date.now(), hereMs = 360e3, midDaily = () => false } = {}) {
  const byPid = new Map(), guests = { city: 0, rooms: 0, daily: 0, n: 0 }, inRoom = new Set();
  const put = (pid, where, at) => {
    const cur = byPid.get(pid);
    if (!cur || RANK[where.k] < RANK[cur.where.k] || (RANK[where.k] === RANK[cur.where.k] && at > cur.at)) byPid.set(pid, { pid, where, at });
  };
  const H = {};
  for (const [uid, v] of Object.entries(here || {})) { const e = hereEntry(v); if (e) H[uid] = e; }
  // the rooms: every ONLINE member, from the room itself
  for (const [code, r] of Object.entries(rooms || {})) {
    if (!r || !r.meta || !/^[A-Z]{4}$/.test(code)) continue;
    const solo = !!(r.meta.settings && r.meta.settings.solo && r.meta.settings.solo.on === true);
    const g = (r.game && r.game.id) || (solo && r.meta.settings.solo.g) || null;
    const playing = r.meta.status === 'playing';
    for (const [uid, p] of Object.entries(r.players || {})) {
      if (!online((r.presence || {})[uid])) continue;
      inRoom.add(uid);
      const at = Math.max((H[uid] && H[uid].at) || 0, (r.presence[uid] && r.presence[uid].lastSeen) || 0, r.meta.activeAt || 0) || now;
      const pid = p && typeof p.pid === 'string' ? p.pid : null;
      if (!pid) { guests.rooms++; continue; }
      put(pid, solo ? { k: 'solo', g } : { k: 'room', code, g: playing ? g : null, p: playing ? 'playing' : 'lobby' }, at);
    }
  }
  // the city + the dailies: the hellos inside the window, not already in a room
  for (const [uid, e] of Object.entries(H)) {
    if (inRoom.has(uid) || e.at <= now - hereMs) continue;
    const w = cleanWhere(e.w);
    const where = w.k === 'daily' && e.pid && midDaily(e.pid, w.d) ? { k: 'daily', d: w.d } : { k: 'city' };
    if (!e.pid) { guests[where.k === 'daily' ? 'daily' : 'city']++; continue; }
    put(e.pid, where, e.at);
  }
  guests.n = guests.city + guests.rooms + guests.daily;
  const rows = [...byPid.values()].sort((a, b) => RANK[a.where.k] - RANK[b.where.k] || (a.where.code || '').localeCompare(b.where.code || '') || b.at - a.at);
  return { rows, guests };
}

/** PURE: a row's WHERE line — "THE CITY" · "ROOM MINT · PRISM DROP" (· IN THE LOBBY) · "SOLO · OVERCLOCK" · "THE DAILY · THE PASSWORD" */
export function whereLine(where, names = {}) {
  const N = id => (id && names[id]) || (id ? String(id).toUpperCase() : '');
  if (!where) return 'THE CITY';
  if (where.k === 'room') return `ROOM ${where.code}${where.g ? ` · ${N(where.g)}` : ' · IN THE LOBBY'}`;
  if (where.k === 'solo') return `SOLO${where.g ? ` · ${N(where.g)}` : ''}`;
  if (where.k === 'daily') return `THE DAILY · ${N(where.d)}`;
  return 'THE CITY';
}
/** PURE: "now" · "3 min ago" · "1 h ago" — the last check-in */
export function agoLine(at, now) {
  const s = Math.max(0, (now - at) / 1000);
  if (s < 60) return 'now';
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}
/** PURE: the guests' one line — "+ 3 guests in the city" · "+ 1 guest in a room" · null */
export function guestLine(G) {
  if (!G || !G.n) return null;
  const parts = [];
  if (G.city) parts.push(`${G.city} in the city`);
  if (G.rooms) parts.push(`${G.rooms} in ${G.rooms === 1 ? 'a room' : 'rooms'}`);
  if (G.daily) parts.push(`${G.daily} on a daily`);
  return `+ ${G.n} guest${G.n === 1 ? '' : 's'} — ${parts.join(' · ')}`;
}
