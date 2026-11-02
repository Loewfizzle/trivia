// THE FOUNDER WINDOW (PROGRESSION A): while it's OPEN (the default — no node), every player with a counted match (or a daily) gets the
// FOUNDING MEMBER card, forever. The owner flips it CLOSED on launch day from THE LEDGER (radioFounder — owner only, server-checked,
// audited). Closing first SWEEPS every player who already played (anyone the match-by-match award or the `me` carry-over hasn't reached
// yet), so "everyone who played before the launch" is exact. progress/founder: { open: false, at, by } (server only).
import { ref, val } from './fb.js';
import { bumpOwners } from './owners.js';
import { matchCount } from './lb.js';

let cache = null;
const TTL_MS = 30_000;
export async function founderOpen(now = Date.now()) {
  if (cache && now - cache.at < TTL_MS) return cache.open;
  const v = await val('progress/founder');
  const open = !(v && v.open === false);
  cache = { at: now, open };
  return open;
}
export const clearFounderCache = () => { cache = null; };

/** Grant FOUNDING MEMBER to every player with a counted match / daily who lacks it → how many got it now. */
export async function founderSweep(now = Date.now()) {
  const all = (await val('pstats')) || {};
  let got = 0;
  for (const [pid, s] of Object.entries(all)) {
    if (!s || (s.it && s.it['card-founder'])) continue;
    if (!(matchCount(s) >= 1 || (s.dl && s.dl.n >= 1))) continue;
    let did = false;
    await ref(`pstats/${pid}/it/card-founder`).transaction(cur => { if (cur) return undefined; did = true; return now; });
    if (did) { got++; await ref(`profiles/${pid}/fd`).set(true); await bumpOwners(['card-founder']).catch(() => {}); }
  }
  return got;
}

/** The ledger's view: { open, at, holders } */
export async function founderState() {
  const [v, n] = await Promise.all([val('progress/founder'), val('pcount/i/card-founder')]);
  return { open: !(v && v.open === false), at: (v && v.at) || null, holders: n || 0 };
}

/** The owner's switch (the caller checks the role + audits). Closing sweeps first. → { open, at, holders, swept } */
export async function setFounder(me, open, now = Date.now()) {
  let swept = 0;
  if (!open) swept = await founderSweep(now);
  await ref('progress/founder').set(open ? null : { open: false, at: now, by: me });
  clearFounderCache();
  return { ...(await founderState()), swept };
}
