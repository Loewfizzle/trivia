// BOARD 2.0 A — THE PLAYER PAGE's DATA: POST /api/profile { action: 'player', pid } | { action: 'player', b, bid } (THE BOARD's opaque row id + its
// board — the row on screen) | { action: 'player', id } (either) → ONE answer BOARD 2.0 B draws the page from (js/core/player.js — the owner's list):
//   { rel, card: { n, a, c, l, r, cd, g, tb, es, at, fd }, band, streak: { n, alive }, top: [{ id, name, group, item, tier, pct }], limited? }
//   rel = friend · out (request sent) · in (request received) · blocked (you blocked them) · none · self — from YOUR list only (pfr/{you}; theirs is
//   read on the server to see whether THEY blocked you, never returned).
//   THE APPROVED EXCEPTION to ITEM NAMES ONLY TO OWNERS (the owner, Nov 9): `top` = the player's TOP 3 RAREST achievements (the lowest X% of players —
//   pcount/; a tie → the newest) WITH their names — only these 3, only here, only ones that player holds (tests/vault-names.test.mjs allows exactly
//   this). Never: a pid, the key, the tag's digits, the member Nº, stats, the best game, matches, wins.
//   A hidden / banned / opted-out player, or one who BLOCKED you → `limited: true` + only what a room already shows (the name + the emblem); no card.
//   Signed-in only (the caller's ID token); rate-limited (PLAYER_LIMIT a uid per 10 min); each player's part cached PLAYER_TTL per warm instance.
import { ref, val } from './fb.js';
import { ApiError } from './http.js';
import { take } from './limit.js';
import { isPid, publicProfile, pidOf } from './profiles.js';
import { topRows, publicName, boardId } from './lb.js';
import { ownerCounts, pctOf } from './owners.js';
import { ACH_ROWS, ITEM_ROWS } from './catalog.js';
import { boardDef, OVERALL_IDS } from '../../js/core/boards.js';
import { relOf } from '../../js/core/friends.js';
import { bandOf } from '../../js/core/levels.js';
import { rarestThree, flameOf } from '../../js/core/player.js';

export const PLAYER_LIMIT = { max: 120, windowMs: 10 * 60_000 };
export const PLAYER_TTL = 30_000;
const AROW = Object.fromEntries(ACH_ROWS.map(a => [a.id, a])), IROW = Object.fromEntries(ITEM_ROWS.map(x => [x.id, x]));
const BID = /^[0-9a-f]{16}$/;

/** a board row's id → its pid: the board on screen (`b`), else THE OVERALL BOARDS' (this week, then all time) */
async function pidOfRow(b, bid, now) {
  const boards = boardDef(String(b || '')) ? [String(b)] : OVERALL_IDS;
  for (const bd of boards) for (const p of ['week', 'all']) {
    const data = await topRows(bd, p, now);
    const row = data && data.rows.find(r => r.id === bid);
    if (row) return row.pid;
  }
  return null;
}

const cache = new Map();
export const forgetPlayers = () => cache.clear();
/** the player's own part (the same for every viewer) — cached briefly */
async function partOf(pid, now) {
  const hit = cache.get(pid);
  if (hit && now - hit.at < PLAYER_TTL && now >= hit.at) return hit.v;
  const [p, held, oc] = await Promise.all([publicProfile(pid), val(`pstats/${pid}/ac`), ownerCounts(now)]);
  if (!p) return null;
  const top = rarestThree(held || {}, oc.a, oc.n).map(({ id }) => {
    const a = AROW[id]; if (!a) return null;
    return { id, name: a.name, group: a.group, item: a.item || null, tier: (IROW[a.item] || {}).tier || 'common', pct: pctOf(oc.a[id], oc.n) };
  }).filter(Boolean);
  const v = { p, top };
  cache.set(pid, { at: now, v });
  if (cache.size > 2000) cache.delete(cache.keys().next().value);
  return v;
}

export async function playerAnswer(uid, body = {}, now = Date.now()) {
  if (!(await take(`pv_${String(uid).replace(/[.#$[\]/]/g, '_')}`, PLAYER_LIMIT.max, PLAYER_LIMIT.windowMs, now))) throw new ApiError(429, 'slow_down', 'Too many looks — wait a minute.');
  const me = await pidOf(uid);   // (a viewer with no profile yet still sees the page — rel 'none')
  const id = String(body.pid || body.id || '');
  const bid = String(body.bid || (BID.test(id) ? id : ''));
  let pid = isPid(id) ? id : null;
  if (!pid && BID.test(bid)) pid = await pidOfRow(body.b, bid, now);
  if (!pid) throw new ApiError(404, 'no_profile', 'That player isn’t here.');
  const part = await partOf(pid, now);
  if (!part) throw new ApiError(404, 'no_profile', 'That player isn’t here.');
  const { p, top } = part;
  const [mine, theirsBlock, ban] = await Promise.all([me && me !== pid ? val(`pfr/${me}`) : null, me && me !== pid ? val(`pfr/${pid}/b/${me}`) : null, val(`ppriv/${pid}/ban`)]);
  const rel = !me ? 'none' : me === pid ? 'self' : relOf(mine || {}, me, pid, now);
  const id0 = boardId(pid), name = p.h || ban ? publicName(id0, p.n) : p.n;
  // a hidden / banned / opted-out player, or one who blocked YOU: only what a room already shows — the name + the emblem (never for yourself)
  if (rel !== 'self' && (p.h || ban || theirsBlock)) return { rel: theirsBlock && rel !== 'blocked' ? 'none' : rel, limited: true, card: { n: name, a: p.a, c: p.c, es: p.es || null } };
  return {
    rel,
    // (FR7 FIXES A — C6: the rude-name filter on THE PLAYER PAGE too — THE BOARD showed the HOUSE NICKNAME, a tap on the row the raw name;
    //  the real name only for the player themself + their friends)
    card: { n: rel === 'self' || rel === 'friend' ? p.n : publicName(id0, p.n), a: p.a, c: p.c, l: p.l, r: p.r || 0, cd: p.cd || null, g: p.g || null, tb: p.tb || null, es: p.es || null, at: p.at || 0, fd: !!p.fd },
    band: bandOf(p.l || 1).name,
    streak: flameOf(p.s, p.sd, now),
    top,
  };
}
