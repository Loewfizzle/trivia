// THE VAULT — ONLY APPROVED ART SHIPS (THE VAULT 1A; the owner: "only approved items ship to players"). The site asks the lab's public
// export (GET /api/admin?lab=export — ids + marks, edge-cached a minute) once a visit; a card / emblem draws its NEW art (its strip, its
// effect) only when the owner has marked it APPROVE in THE CARD LAB — anything else keeps today's placeholder. The lab itself always
// shows everything (it's where the marks are made). Profiles are polish: /api down → nothing new ships (the placeholders stand).
import { ONE_OF_ONE_CARDS } from '../core/dev-cards.js';
import { lazyImport } from '../ui/lazy-import.js';
let marksP = null;
// (the look previews on a LOCAL server only — localhost / 127.0.0.1 / a private LAN address (the Beelink's preview links on the owner's phone),
//  never the live site: &labmarks=all = every lab item approved, so a preview page with no /api shows the real strips; DFIX2: &labmarks=<id,id,…>
//  = exactly those approved — a preview can show one UNAPPROVED card beside real ones)
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;
const previewMarks = () => { try { return LOCAL_HOST.test(location.hostname) ? new URLSearchParams(location.search).get('labmarks') || null : null; } catch { return null; } };
export function labMarks() {
  if (marksP) return marksP;
  const pm = previewMarks();
  if (pm === 'all') { marksP = lazyImport(import('./catalog.js'), './catalog.js').then(C => Object.fromEntries(C.LAB_IDS.map(id => [id, { m: 'approve' }]))); return marksP; }
  if (pm) { marksP = Promise.resolve(Object.fromEntries(pm.split(',').filter(Boolean).map(id => [id, { m: 'approve' }]))); return marksP; }
  marksP = fetch('/api/admin?lab=export', { cache: 'no-store' }).then(r => (r.ok ? r.json() : { marks: {} })).then(j => j.marks || {}).catch(() => ({}));
  return marksP;
}
/** is this item's new art approved? */
export async function isApproved(id) { const m = await labMarks(); return !!(m[id] && m[id].m === 'approve'); }
/** the approved ids (a set) — + THE TWO DEV CARDS (THE VAULT 2B: only the owner can ever hold them, and he IS the lab — his own card shows
 *  its art while he marks it; their lab rows still carry his marks) */
export async function approvedIds() {
  const m = await labMarks();
  const out = new Set(Object.entries(m).filter(([, v]) => v && v.m === 'approve').map(([k]) => k));
  // (SHELL 2.0 B2: + THE GIFT CARDS — a 1-of-1 is given only once the owner has picked it in THE LAB: its one owner always sees its art)
  for (const id of ONE_OF_ONE_CARDS) { out.add(id); out.add(`full-${id}`); }
  return out;
}
