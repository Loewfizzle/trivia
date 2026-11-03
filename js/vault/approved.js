// THE VAULT — ONLY APPROVED ART SHIPS (THE VAULT 1A; the owner: "only approved items ship to players"). The site asks the lab's public
// export (GET /api/admin?lab=export — ids + marks, edge-cached a minute) once a visit; a card / emblem draws its NEW art (its strip, its
// effect) only when the owner has marked it APPROVE in THE CARD LAB — anything else keeps today's placeholder. The lab itself always
// shows everything (it's where the marks are made). Profiles are polish: /api down → nothing new ships (the placeholders stand).
let marksP = null;
export function labMarks() {
  if (marksP) return marksP;
  marksP = fetch('/api/admin?lab=export', { cache: 'no-store' }).then(r => (r.ok ? r.json() : { marks: {} })).then(j => j.marks || {}).catch(() => ({}));
  return marksP;
}
/** is this item's new art approved? */
export async function isApproved(id) { const m = await labMarks(); return !!(m[id] && m[id].m === 'approve'); }
/** the approved ids (a set) */
export async function approvedIds() { const m = await labMarks(); return new Set(Object.entries(m).filter(([, v]) => v && v.m === 'approve').map(([k]) => k)); }
