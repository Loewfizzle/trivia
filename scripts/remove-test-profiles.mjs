// ONE-OFF CLEANUP (Nov 4 2026 — LOBBY 2.0 B's hotfix): Claude's WebKit repro opened test rooms on the LIVE site and its test players got real
// profiles + MEMBER NUMBERS (WKA Nº 42, WKB Nº 43 — RULESCHECK, CHECKA, CHECKB most likely 44–46). This removes exactly those profiles and rolls
// the member-number counter back so the next REAL player gets the next real number.
//   DRY RUN (default — reads only, prints the plan):
//     FIREBASE_SERVICE_ACCOUNT='<the key JSON>' FIREBASE_DATABASE_URL='https://<db>.firebaseio.com' node scripts/remove-test-profiles.mjs
//   APPLY (after reading the dry run):   … node scripts/remove-test-profiles.mjs --apply
// SAFETY: a profile is a target only if its NAME is one of the five, it was CREATED in the repro's window (Nov 4, 15:30–17:30 UTC) and it
// has no XP and no counted match. The counter rolls back ONLY if no other profile holds a member number at or above the lowest target's
// (= the test players really are the newest); otherwise the profiles are still removed and the counter is left alone (said so).
import { ref, val } from '../api/_lib/fb.js';
import { encodeKey } from '../api/_lib/profiles.js';

const NAMES = new Set(['WKA', 'WKB', 'RULESCHECK', 'CHECKA', 'CHECKB']);
const FROM = Date.UTC(2026, 10, 4, 15, 30), TO = Date.UTC(2026, 10, 4, 17, 30);
const APPLY = process.argv.includes('--apply');

const all = (await val('profiles')) || {};
const targets = [];
for (const [pid, p] of Object.entries(all)) {
  if (!p || !NAMES.has(String(p.n || '').toUpperCase()) || !(p.at >= FROM && p.at <= TO) || (p.x || 0) > 0) continue;
  const stats = await val(`pstats/${pid}`);
  if (stats && (stats.m || 0) > 0) { console.log(`skip ${p.n}#${p.t} (${pid}): it has counted matches`); continue; }
  targets.push({ pid, p, priv: (await val(`ppriv/${pid}`)) || {} });
}
console.log(`${Object.keys(all).length} profiles on the live site; ${targets.length} test profiles found:`);
for (const t of targets) console.log(`  ${t.p.n}#${t.p.t}  ${t.pid}  member Nº ${t.p.mn ?? '—'}  created ${new Date(t.p.at).toISOString()}`);
if (!targets.length) process.exit(0);

// the counter: roll back only if the test players hold the newest numbers
const next = await val('members/next');
const mns = targets.map(t => t.p.mn).filter(n => typeof n === 'number');
const low = mns.length ? Math.min(...mns) : null;
const ids = new Set(targets.map(t => t.pid));
const later = low == null ? [] : Object.entries(all).filter(([pid, p]) => !ids.has(pid) && p && typeof p.mn === 'number' && p.mn >= low).map(([pid, p]) => `${p.n}#${p.t} Nº ${p.mn}`);
const rollback = low != null && !later.length;
console.log(`members/next is ${next}; the test players hold Nº ${mns.sort((a, b) => a - b).join(', ') || '—'}.`);
console.log(rollback ? `→ members/next back to ${low} (the next real player gets Nº ${low}).` : `→ the counter is LEFT ALONE: real players hold Nº ${low} or above (${later.join(', ')}).`);

// every node a profile has: the public card, its stats, its private side, its sign-ins, its key's hash, its name tag
const patch = {};
for (const { pid, p, priv } of targets) {
  patch[`profiles/${pid}`] = null; patch[`pstats/${pid}`] = null; patch[`ppriv/${pid}`] = null;
  for (const uid of Object.keys(priv.uids || {})) if ((await val(`uids/${uid}`)) === pid) patch[`uids/${uid}`] = null;
  if (priv.kh && (await val(`pkeys/${priv.kh}`)) === pid) patch[`pkeys/${priv.kh}`] = null;
  if (p.nk && p.t && (await val(`tags/${encodeKey(p.nk)}/${p.t}`)) === pid) patch[`tags/${encodeKey(p.nk)}/${p.t}`] = null;
}
if (rollback) patch['members/next'] = low;
console.log(`\n${Object.keys(patch).length} paths:`); for (const k of Object.keys(patch)) console.log(`  ${k} → ${patch[k] === null ? 'deleted' : patch[k]}`);
if (!APPLY) { console.log('\nDRY RUN — nothing written. Run again with --apply to do it.'); process.exit(0); }
await ref('/').update(patch);
console.log('\nDONE.');
process.exit(0);
