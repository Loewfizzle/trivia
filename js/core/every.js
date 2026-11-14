// DFIX5 — EVERYONE ON SCORES (the owner, Nov 14: "show everyone playing the dailies, friends or not" — docs/progression.md "EVERYONE ON SCORES").
// PURE (server + client + the unit tests): the day's TOP counting finishers of one daily, kept as ONE small node beside the day's data —
//   dly/{game}/{day}/t = { v: 1, rows: [{ k: pid, s: score, at?: finish time, e?: the cartridge's extra (COAST CLEAR: { sp: spots }) }] }
// best first, at most TOP_KEEP rows; updated by ONE transaction at every COUNTING finish (api/daily.js#finishRun → _lib/every.js#addTop) —
// never a scan per request. A same-day profile (THE THROWAWAY GATE) and a run before the reset epoch never count, so never enter it.
// THE ORDER: the daily's own number + its `better` ('low' — COAST CLEAR's time, THE DROP's packed number per its row — or 'high'); a TIE →
// the EARLIER finish ranks higher (THE PASSWORD's guesses tie often — no timer added); a row from before DFIX5 (no `at`) after the timed ones.
// Every rank is that row's place in the WHOLE kept list — distinct places (the ties are broken), so "4TH OF 12" is exact inside the top.

export const TOP_KEEP = 50;   // the kept rows (SHOW ALL lists up to these)
export const TOP_SHOW = 10;   // the rows a panel shows before SHOW ALL

const num = x => (Number.isFinite(Number(x)) ? Number(x) : null);
/** the comparator: better score first, then the earlier finish (no time = last), then the pid (a stable order) */
export function cmpRows(better = 'high') {
  const sign = better === 'low' ? 1 : -1;
  return (a, b) => sign * (a.s - b.s) || ((a.at ?? Infinity) - (b.at ?? Infinity)) || (String(a.k) < String(b.k) ? -1 : String(a.k) > String(b.k) ? 1 : 0);
}
const clean = r => {
  const s = num(r && r.s);
  if (!r || typeof r.k !== 'string' || !r.k || s == null) return null;
  const at = num(r.at);
  return { k: r.k, s, ...(at != null ? { at } : {}), ...(r.e && typeof r.e === 'object' ? { e: r.e } : {}) };
};
/** a stored node → its rows, sorted + cut (a broken node reads as empty — never a throw) */
export function topRows(node, better = 'high', keep = TOP_KEEP) {
  const rows = (node && Array.isArray(node.rows) ? node.rows : node && node.rows && typeof node.rows === 'object' ? Object.values(node.rows) : []).map(clean).filter(Boolean);
  const seen = new Set();
  return rows.sort(cmpRows(better)).filter(r => (seen.has(r.k) ? false : (seen.add(r.k), true))).slice(0, keep);
}
/** ONE counting finish into the node (the transaction's body): the player's row replaced (a retried finish = the same node), sorted, cut */
export function insertTop(node, row, better = 'high', keep = TOP_KEEP) {
  const r = clean(row);
  const rows = topRows(node, better, Infinity).filter(x => !r || x.k !== r.k);
  if (r) rows.push(r);
  return { v: 1, rows: rows.sort(cmpRows(better)).slice(0, keep) };
}
/** THE BACKFILL (a day that had finishers before DFIX5): the node built once from the day's scores (r/), less the non-counting ones (x/) */
export function buildTop(scores, notCounted, extras = {}, better = 'high', keep = TOP_KEEP) {
  const rows = Object.entries(scores || {}).filter(([k, s]) => num(s) != null && !(notCounted && notCounted[k])).map(([k, s]) => ({ k, s: Number(s), ...(extras && extras[k] ? { e: extras[k] } : {}) }));
  return { v: 1, rows: rows.sort(cmpRows(better)).slice(0, keep) };
}
/** a player's place in the kept list (1-based) | null (not in it) */
export const placeIn = (rows, pid) => { const i = (rows || []).findIndex(r => r.k === pid); return i < 0 ? null : i + 1; };

/**
 * THE EVERYONE VIEW one player gets (api/daily.js `every`): the first `limit` rows (+ the caller's own row when below them), each with its
 * PLACE; the scores only once the caller has finished that daily (the YOUR TABLE rule — "play it to see their scores"); friends marked; the
 * hidden profiles (the boards' opt-out) left out of the list (their places stay — the list never re-ranks around them).
 *   rows: the kept rows · { pid, friends: Set, played, hidden: Set, limit }
 *   → { list: [{ k, rank, s?, e?, me?, f? }], mine: { rank, s?, e? } | null, more }   (more = how many rows SHOW ALL would list)
 */
export function everyView(rows, { pid = null, friends = new Set(), played = false, hidden = new Set(), limit = TOP_SHOW } = {}) {
  const all = (rows || []).map((r, i) => ({ r, rank: i + 1 })).filter(x => !hidden.has(x.r.k));
  const face = ({ r, rank }) => ({ k: r.k, rank, ...(played ? { s: r.s, ...(r.e ? { e: r.e } : {}) } : {}), ...(r.k === pid ? { me: 1 } : {}), ...(friends.has(r.k) && r.k !== pid ? { f: 1 } : {}) });
  const list = all.slice(0, limit).map(face);
  const meAt = all.findIndex(x => x.r.k === pid);
  const mine = meAt >= limit ? face(all[meAt]) : null;
  return { list, mine, more: all.length };
}

/** TODAY's ticket line (the everyone place among the day's COUNTING finishers): "4TH OF 12 TODAY" */
export function everyPlaceLine(place, of, ordinal) {
  if (!(place > 0) || !(of > 0)) return '';
  return `${ordinal(place)} OF ${Math.max(of, place)} TODAY`;
}
