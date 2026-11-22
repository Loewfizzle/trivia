// JAYWALK J1 — THE MATCH MOMENTS, the PURE half (docs/jaywalk.md "THE MATCH MOMENTS"; the screen: moments-view.js). Every "out" keys off
// that player's OWN end of run — their proof node's `e` (this phone's own: its own engine's end) — NEVER the host's word: an honest END GAME,
// a host's early `final` or a moved-on room never shows a fake OUT (THE CONSOLE FIX's rule). THE MOTHERSHIP's `taken` is a finish, not an out.
//   · OUT — another player's own end: a banner (merged when outs land within OUT_MERGE_MS), a red X where their ghost fell, the out sound
//     (THE GRAVESTONES, the owner's add-on Nov 21: the X STAYS — bright for X_MS, then a smaller, fainter X + the name pinned where they fell
//     for the rest of the match, scrolling with the world; faded while it sits in the lane in front of this phone's kid — graveAhead)
//   · HEAD TO HEAD — a match of 3+ players narrows TO two (an out leaves exactly two in) — ONCE; never at the start; never in a 2-player match
//   · THE DUEL STRIP — while exactly two are in: a 2-player match from the start; a 3+ match after its HEAD TO HEAD (at once after a rejoin)
//   · LAST ONE STANDING — everyone else is out and THIS phone's run goes on (the 2-player case too) — ONCE, for the survivor
// A refresh / rejoin takes the state as it stands as its BASELINE (no moment replayed); the strip is drawn from the state itself.
export const OUT_MERGE_MS = 1000;      // (outs closer than this share ONE banner — "MIA + LIAM OUT")
export const BANNER_MS = 1500;         // (the OUT banner: in · hold · out)
export const X_MS = 1500;              // (the red X where a ghost fell: bright this long, then it SETTLES into its gravestone — never removed before the match ends)
export const H2H_STRIP_MS = 3000;      // (HEAD TO HEAD: the big text holds to here, then shrinks into the duel strip)
export const H2H_MS = 5000;            // (… gone by here: the strip stays for the rest of the duel)
export const LAST_MS = 2600;           // (LAST ONE STANDING's card)

/** THE GRAVESTONES — the lane in front of the kid stays clear (PURE): a mark at p = [x, y, cell] (stage px) sits in the band from half a lane
 *  behind the kid's middle to GRAVE_AHEAD lanes in front of it (forward = up the screen), the whole width → faded there. kid = [x, y, cell] | null */
export const GRAVE_AHEAD = 2.5;
export function graveAhead(p, kid) {
  if (!p || !kid) return false;
  const c = Math.max(8, Number(kid[2]) || 40);
  return p[1] > kid[1] - c * GRAVE_AHEAD && p[1] < kid[1] + c * 0.5;
}

export const createMoments = () => ({ base: false, seen: {}, h2h: false, last: false });

/** a player's end as the moments read it: null (still in) · { out: bool (false = THE MOTHERSHIP took them), l (lanes) } */
const endOf = e => (e && typeof e === 'object' ? { out: e.w !== 'taken' && e.w !== 'quiet', l: Math.max(0, Math.floor(Number(e.l) || 0)) } : null);   // ('quiet' — view.js: a run the host's own rule calls over with no `e`: it leaves the count, no moment)

/**
 * ONE STEP (PURE): `ids` = the match's players · `me` = this phone (a watcher: not among ids) · `ends` = { uid: their node's `e` | null } ·
 * `mine` = this phone's own end ({ w, l } from its engine — null while it runs) · `lanes` = { uid: lanes now } (the lead's words) →
 * { events: [{ k: 'out', uid, l, left } | { k: 'h2h', a, b } | { k: 'last', lead }], alive: [uids still in], duel: [a, b] | null }
 */
export function stepMoments(M, { ids, me, ends = {}, mine = null, lanes = {} }) {
  const end = u => endOf(u === me ? mine : ends[u]);
  const alive = ids.filter(u => !end(u)), n0 = ids.length, events = [];
  if (!M.base) {   // (the first look — a fresh match, or a refresh / rejoin mid-match: what has happened is the baseline, nothing replayed)
    M.base = true;
    for (const u of ids) if (end(u)) M.seen[u] = 1;
    M.h2h = alive.length <= 2; M.last = alive.length <= 1;
    return { events, alive, duel: duelOf(M, alive, n0) };
  }
  let outs = 0;
  for (const u of ids) {
    const e = end(u);
    if (!e || M.seen[u]) continue;
    M.seen[u] = 1;
    if (!e.out) continue;   // (THE MOTHERSHIP's finish is no out)
    outs++;
    if (u !== me) events.push({ k: 'out', uid: u, l: e.l, left: alive.length });
  }
  if (outs && !M.h2h && n0 >= 3 && alive.length === 2) { M.h2h = true; events.push({ k: 'h2h', a: alive[0], b: alive[1] }); }
  if (alive.length < 2) M.h2h = true;
  if (outs && !M.last && n0 >= 2 && alive.length === 1 && alive[0] === me) {
    M.last = true;
    const other = Math.max(0, ...ids.filter(u => u !== me).map(u => Number(lanes[u]) || 0));
    events.push({ k: 'last', lead: (Number(lanes[me]) || 0) - other });
  }
  if (alive.length < 1 || (alive.length === 1 && alive[0] !== me)) M.last = true;
  return { events, alive, duel: duelOf(M, alive, n0) };
}
/** the duel strip's two (null = none): exactly two still in — a 2-player match always, a 3+ match once it has narrowed (its HEAD TO HEAD) */
const duelOf = (M, alive, n0) => (alive.length === 2 && n0 >= 2 && (n0 === 2 || M.h2h) ? [alive[0], alive[1]] : null);

/** the OUT banner's words: names → "MIA IS OUT" · "MIA + LIAM OUT"; the line under it: one out "87 LANES · 3 LEFT", merged "2 LEFT" */
export function bannerWords(list, left) {
  const names = list.map(x => x.name), one = list.length === 1;
  const sub = `${one ? `${list[0].l} ${list[0].l === 1 ? 'LANE' : 'LANES'} · ` : ''}${left} LEFT`;
  return { head: one ? `${names[0]} IS OUT` : `${names.join(' + ')} OUT`, sub };
}
/** LAST ONE STANDING's line: "+23 LANES AHEAD · KEEP GOING" — behind the farthest out: "12 LANES TO THE LEAD · KEEP GOING" */
export const lastWords = lead => (lead > 0 ? `+${lead} ${lead === 1 ? 'LANE' : 'LANES'} AHEAD · KEEP GOING` : lead === 0 ? 'LEVEL WITH THE LEAD · KEEP GOING' : `${-lead} ${lead === -1 ? 'LANE' : 'LANES'} TO THE LEAD · KEEP GOING`);
