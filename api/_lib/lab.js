// THE CARD LAB's MARKS (THE VAULT 1A — docs/vault.md): the owner's APPROVE · FIX (+ a note) · CUT per collectible, server-written only
// (`vault/lab/{id}` — the rules' default deny: no client reads or writes it), each change audited by the caller (api/admin.js) + kept in
// a history (`vault/labLog`). THE EXPORT (GET /api/admin?lab=export — edge-cached a minute): ids + marks + notes + when, no names, no
// profile ids — what the next pass reads first (scripts/lab-export.mjs → docs/vault-lab-marks.md) and what the site reads to ship ONLY
// approved art (js/vault/approved.js).
import { ref, val } from './fb.js';
import { cleanMark, LAB_IDS } from '../../js/vault/catalog.js';
import { ApiError } from './http.js';

export async function labMarks() {
  const v = (await val('vault/lab')) || {};
  const out = {};
  for (const id of LAB_IDS) if (v[id]) out[id] = { m: v[id].m || null, note: v[id].note || '', at: v[id].at || 0, by: v[id].by || null };
  return out;
}
/** one mark (null clears it) → the marks */
export async function labMark(me, body, now = Date.now()) {
  const c = cleanMark(String(body.id || ''), body.mark == null ? null : String(body.mark), body.note);
  if (!c) throw new ApiError(400, 'bad_mark', 'Not a lab item or not a mark (approve · fix · cut).');
  const id = String(body.id);
  const row = { m: c.m, note: c.note, at: now, by: me };
  await ref(`vault/lab/${id}`).set(row);
  await ref('vault/labLog').push({ id, ...row });
  return labMarks();
}
/** the public export: no names, no profile ids */
export async function labExport(now = Date.now()) {
  const m = await labMarks();
  const marks = {};
  for (const [id, r] of Object.entries(m)) marks[id] = { m: r.m, note: r.note, at: r.at };
  return { marks, at: now, v: 1 };
}
export const LAB_CACHE = 'public, max-age=0, s-maxage=60';
