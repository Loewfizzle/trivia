// THE VAULT — ONLY APPROVED ART SHIPS (THE VAULT 1A; the owner: "only approved items ship to players"). The site asks the lab's public
// export (GET /api/admin?lab=export — ids + marks, edge-cached a minute) once a visit; a card / emblem draws its NEW art (its strip, its
// effect) only when the owner has marked it APPROVE in THE CARD LAB — anything else keeps today's placeholder. The lab itself always
// shows everything (it's where the marks are made). Profiles are polish: /api down → nothing new ships (the placeholders stand).
import { ONE_OF_ONE_CARDS } from '../core/dev-cards.js';
let marksP = null;
// (the look previews on THIS machine only — localhost / 127.0.0.1, never the live site: &labmarks=all = every lab item approved, so a
//  preview page with no /api shows the real strips)
const previewAll = () => { try { return /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).get('labmarks') === 'all'; } catch { return false; } };
export function labMarks() {
  if (marksP) return marksP;
  if (previewAll()) { marksP = import('./catalog.js').then(C => Object.fromEntries(C.LAB_IDS.map(id => [id, { m: 'approve' }]))); return marksP; }
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
