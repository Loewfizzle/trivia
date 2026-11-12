// HOLD'EM — THE CARTRIDGE's pure logic (HE3): the director's end, the podium's rows, the level line, WHO POKES, the seats' places on the
// portrait table. The RULES are the engine's (table.js · match.js — HE1) and run on the SERVER (the dealer — HE2); this is the phone's side.
// No DOM, no database, no clock (`now` comes in = serverNow()). tests/holdem-phone.test.mjs.
import { blindsAt, levelAt, CASH } from './structure.js';
// (THE THIN META: one source — the console's values live in meta.js)
export { DEFAULT_SETTINGS, chatLocked, cleanSettings } from './meta.js';

/** The match is over AND its result is in (`rep`) — the console's podium may show (its report then finds results/{CODE}_{matchId}). */
export const finished = pub => !!(pub && pub.ended && pub.rep);

/** HE10 (A3): the podium waits this long after the match's end — the last hand's river, showdown, pots + KO card play first (≈ 1.4 s of
 *  sound + motion; the KO card's 4 s mostly); a refresh later goes straight to the podium (the dealer's endAt + the host's server clock) */
export const FINAL_HOLD_MS = 4_500;

/**
 * THE DIRECTOR (pure): the console's frame only. The dealer's table (`pub` — the wire read back) says the match is over + its result was
 * sent (`rep`) + FINAL_HOLD_MS have passed since its end → the podium (the places + the rows stored, so finalRanks + the frame never
 * re-read the table). `short` (HE10 — A7) = the dealer credited nothing (too short to count): the end screen says so in one quiet line.
 */
export function directorStep(game, { now, pub }) {
  if (!game || game.phase !== 'play') return null;
  if (!pub || pub.id !== game.matchId || !finished(pub)) return null;
  if (now < (pub.endAt || 0) + FINAL_HOLD_MS) return null;
  return { phase: 'final', phaseStartAt: now, ranks: ranksOf(pub), rows: finalRowsOf(pub), endMode: pub.mode, sum: finalSummaryOf(pub), short: pub.rep === 'short' };
}

/** GAME NIGHT's places: a TOURNAMENT's order of finish; CASH by net (ties share). → [{ uid, rank }] best first. */
export function ranksOf(pub) {
  if (!pub) return [];
  if (pub.mode === 'cash') {
    const L = (pub.ledger || []).filter(r => r.hands > 0);
    return L.map(r => ({ uid: r.id, rank: 1 + L.filter(o => o.net > r.net).length })).sort((a, b) => a.rank - b.rank);
  }
  return [...(pub.places || [])].sort((a, b) => a.place - b.place).map(p => ({ uid: p.id, rank: p.place }));
}

const fmt = n => Math.round(n || 0).toLocaleString('en-US');
const plural = (n, w) => `${fmt(n)} ${w}${n === 1 ? '' : 'S'}`;
const signed = n => (n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(-n)}` : '±0');

/** The podium's rows (ui/final.js): { uid, rank, score, scoreText?, note } — a TOURNAMENT's KOs + hands won; CASH's net + bought in. */
export function finalRowsOf(pub) {
  if (!pub) return [];
  const pl = pub.players || {};
  if (pub.mode === 'cash') {
    const L = new Map((pub.ledger || []).map(r => [r.id, r]));
    return ranksOf(pub).map(r => {
      const x = L.get(r.uid) || {};
      return { ...r, score: x.net || 0, scoreText: signed(x.net || 0), note: `BOUGHT IN ${fmt(x.buyins)} · FINAL ${fmt(x.final)}` };
    });
  }
  const n = ranksOf(pub).length;
  return ranksOf(pub).map(r => {
    const p = pl[r.uid] || {};
    // (the place is the row's own number — the score at the right end = the KOs; hands won + played in the line under the card)
    return { ...r, score: n - r.rank + 1, scoreText: `${p.kos || 0} KO`, note: `${plural(p.won || 0, 'HAND')} WON · ${p.hands || 0} PLAYED` };
  });
}
/**
 * THE END SCREEN's numbers (HE4) — from the dealer's own record (the public view's players / biggest / hands), stored by the director with
 * the rows: { mode, hands, biggest: { amount, ids } | null, kos: { ids, n } | null (a tournament's MOST KOs — ties share; none → null) }.
 * Shown only — no new cards or achievements.
 */
export function finalSummaryOf(pub) {
  if (!pub) return null;
  const pl = pub.players || {};
  const b = pub.biggest && pub.biggest.amount > 0 ? { amount: pub.biggest.amount, ids: (pub.biggest.ids || []).slice() } : null;
  let kos = null;
  if (pub.mode !== 'cash') {
    const n = Math.max(0, ...Object.values(pl).map(p => p.kos || 0));
    if (n > 0) kos = { n, ids: Object.keys(pl).filter(id => (pl[id].kos || 0) === n) };
  }
  return { mode: pub.mode === 'cash' ? 'cash' : 'tournament', hands: pub.hands || 0, biggest: b, kos };
}
export const ordinal = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH'}`;

/**
 * THE LEVEL LINE (the header — TWO lines): TOURNAMENT "LVL 3 · BLINDS 50/100" over "NEXT 75/150 IN 1:42" (HE10 — A25: the countdown is
 * ALWAYS to the blinds it names — a level change waits for the next hand, so once the clock has passed it the second line says
 * "NEXT HAND · 75/150", never a countdown restarting under the old blinds); CASH "BLINDS 5/10". `now` = serverNow().
 */
export function levelLine(pub, now) {
  if (!pub) return '';
  if (pub.mode === 'cash') return `BLINDS ${CASH.sb}/${CASH.bb}`;
  const t = pub.table || {};
  const lv = pub.level || 0;
  const sb = t.sb || blindsAt(lv).sb, bb = t.bb || blindsAt(lv).bb;
  const head = `LVL ${lv + 1} · BLINDS ${fmt(sb)}/${fmt(bb)}`;
  if (!pub.levelMs || pub.startAt == null) return head;
  const at = levelAt(pub.startAt, now, pub.levelMs);
  if (at > lv) { const n = blindsAt(at); return `${head}\nNEXT HAND · ${fmt(n.sb)}/${fmt(n.bb)}`; }
  const n = blindsAt(lv + 1);
  const left = Math.max(0, pub.startAt + (lv + 1) * pub.levelMs - now);
  const s = Math.ceil(left / 1000);
  return `${head}\nNEXT ${fmt(n.sb)}/${fmt(n.bb)} IN ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * WHO POKES (docs/holdem.md — HE2's rule, HE3 builds it): the HOST pokes ~100 ms after `due`; any other phone only when the table is
 * still stuck ~2 s after it (+ its own 0–1 s jitter) — a dead host costs one or two extra calls, never eight. → ms to wait, or null
 * (nothing timed). `due` = 0 → now (a result still to send).
 */
export const HOST_POKE_MS = 100;
export const GUEST_POKE_MS = 2000;
export function pokeIn({ due, now, host, jitter = 0 }) {
  if (due == null) return null;
  const at = due + (host ? HOST_POKE_MS : GUEST_POKE_MS + Math.max(0, Math.min(1000, jitter)));
  return Math.max(0, at - now);
}
/** A poke that changed nothing while the table still says it's due: back off (the server's clock is a little behind ours). */
export const POKE_RETRY_MS = 700;
/**
 * FR7 FIXES A — HE2 (FR7-A's B2), THE HOST POKES FROM THE ROOM TOO (PURE): a host who QUIT TO THE ROOM (or busted out and went back) has no
 * table on screen — no view, no poke — and keeps beating, so nobody takes over: every timed step ran 2–3 s late for everyone. The cartridge's
 * prepare() (the host's 250 ms tick) asks this: the table's due moment + the host's 100 ms → poke; the same due again only after a back-off
 * (POKE_RETRY_MS × tries, ≤ 8 tries — the view's own rule). → { poke, last } (`last` = { key, at, tries } to keep for the next tick).
 */
export function hostPoke({ pub, now, last = null }) {
  if (!pub || pub.due == null) return { poke: false, last };   // (an ended match's due = its clean-up: poked too — no record left behind)
  if (pokeIn({ due: pub.due, now, host: true }) > 0) return { poke: false, last };
  const key = `${pub.seq}|${pub.due}`;
  if (!last || last.key !== key) return { poke: true, last: { key, at: now, tries: 0 } };
  if (last.tries >= 8 || now < last.at + POKE_RETRY_MS * (last.tries + 1)) return { poke: false, last };
  return { poke: true, last: { key, at: now, tries: last.tries + 1 } };
}

/**
 * THE SEATS ON THE RAIL (portrait — HE3's layout, docs/holdem.md "THE TABLE SCREEN"): the opponents in TABLE ORDER clockwise from your
 * left, UNIFORM and EVENLY SPACED — one at the top centre + up to three down each side; heads-up = the top seat alone. `k` = how many
 * opponents (1–7). → [{ x, y, side: 'top' | 'left' | 'right' }] in the table box's own 0–1 units (x across, y down).
 * The slots are fixed per count so a seat never jumps when someone folds; empty seats are not drawn.
 */
export function seatSlots(k) {
  const L = [0.62, 0.42, 0.22], R = [0.22, 0.42, 0.62];   // the side slots' heights, bottom → top on the left, top → bottom on the right
  const top = { x: 0.5, y: 0.02, side: 'top' };
  const left = y => ({ x: 0.02, y, side: 'left' }), right = y => ({ x: 0.98, y, side: 'right' });
  switch (k) {
    case 1: return [top];
    case 2: return [left(0.3), right(0.3)];
    case 3: return [left(0.36), top, right(0.36)];
    case 4: return [left(0.5), left(0.22), right(0.22), right(0.5)];
    case 5: return [left(0.52), left(0.27), top, right(0.27), right(0.52)];
    case 6: return [left(0.62), left(0.42), left(0.22), right(0.22), right(0.42), right(0.62)];
    default: return [...L.map(left), top, ...R.map(right)].slice(0, Math.max(0, k));
  }
}

/** The other seats in table order clockwise from the seat after yours (a spectator: from seat 0). */
export function othersInOrder(seats, me) {
  const list = (seats || []).filter(x => x && x.status !== 'gone');
  const i = list.findIndex(x => x.id === me);
  if (i < 0) return list.slice();
  return [...list.slice(i + 1), ...list.slice(0, i)];
}

/** The side pots' labels once a street has settled them: [{ label: 'MAIN' | 'SIDE 1' …, amount }] (only when there is more than one). */
export function sidePots(table) {
  const pots = (table && table.pots) || [];
  if (pots.length < 2) return [];
  return pots.map((p, i) => ({ label: i === 0 ? 'MAIN' : `SIDE ${i}`, amount: p.amount }));
}

/** The shot clock's bar: { frac 1 → 0, bank: in the time bank } from the table's deadline + the server's now (null = no clock). */
export function clockOf(table, now, shotMs = 20_000) {
  if (!table || table.deadline == null) return null;
  const bank = !!table.bankOn;
  const total = bank ? Math.max(1, table.deadline - (table.bankFrom || table.deadline)) : shotMs;
  const left = Math.max(0, table.deadline - now);
  return { frac: Math.max(0, Math.min(1, left / total)), left, bank };
}
