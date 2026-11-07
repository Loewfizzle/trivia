// OVERCLOCK POOLS — the HAND content kept from OC1–OC5 (scripts/oc-pools/hand/*-legacy.json: migrated by OC6 — metric values, stable ids).
// A legacy stat / theme / set is kept only where hand/legacy-sources.json gives it a SOURCE (a Wikipedia list or article it was checked
// against); its items then carry that source. Data-built pools (Wikidata) replace the rest.
import { join } from 'node:path';
import { HERE, readJSON, readIf } from '../lib.mjs';

export default async function legacy(ctx) {
  const SRC = readIf(join(HERE, 'hand', 'legacy-sources.json'), { hl: {}, tl: {}, so: {}, drop: {} });
  const want = (kind, id) => (SRC.drop[kind] || []).includes(id) ? null : SRC[kind][id] || null;
  for (const s of readJSON(join(HERE, 'hand', 'higherlower-legacy.json')).stats) {
    const src = want('hl', s.id);
    if (SRC.strict && !src) { ctx.drop('hl', 'legacy stat without a source', s.id); continue; }
    ctx.hl.push({ ...s, ...(src ? { src } : {}), items: s.items.filter(it => !(SRC.dropItems || []).includes(`${s.id}:${it[3]}`)) });
  }
  for (const t of readJSON(join(HERE, 'hand', 'timeline-legacy.json')).themes) {
    const src = want('tl', t.id);
    if (SRC.strict && !src) { ctx.drop('tl', 'legacy theme without a source', t.id); continue; }
    ctx.tl.push({ ...t, ...(src ? { src } : {}), items: t.items.filter(it => !(SRC.dropItems || []).includes(`${t.id}:${it[3]}`)) });
  }
  for (const s of readJSON(join(HERE, 'hand', 'sortit-legacy.json')).sets) {
    const src = want('so', s.id);
    if (SRC.strict && !src) { ctx.drop('so', 'legacy set without a source', s.id); continue; }
    ctx.so.push({ ...s, src });
  }
}
