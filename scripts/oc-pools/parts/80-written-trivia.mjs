// OVERCLOCK POOLS (OC7 Group 2) — THE WRITTEN POOLS, sourced + checked the OC6 way (sources.mjs: the proof must be in the named Wikipedia
// article's text; a row its source doesn't confirm is DROPPED, never kept on trust):
//   TRIVIA         written/tv-<cat>.json   { cat, rows: [[question, right answer, "wrong|wrong|wrong", e|m|h, Wikipedia article, proof]] }
//   CLOSEST CALL   written/cc-<cat>.json   { cat, rows: [[question (names its US unit), value (METRIC: m km km2 kg kmh — or the count), unit, article, proof]] }
// The proof confirms the RIGHT answer (the wrong ones are written as believable mistakes that can't also be right). id = "w" + a hash of the
// question (stable while its words don't change).
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HERE, readJSON, hash36, norm } from '../lib.mjs';
import { checkRows, wpUrl } from '../sources.mjs';

const D = { e: 'easy', m: 'medium', h: 'hard' };

export default async function writtenOC7(ctx) {
  const dir = join(HERE, 'written');
  const rows = [];
  for (const f of readdirSync(dir).filter(f => /^(tv|cc)-.*\.json$/.test(f)).sort()) {
    const { cat, rows: list } = readJSON(join(dir, f));
    const kind = f.slice(0, 2);
    for (const r of list) {
      if (kind === 'tv') { const [q, a, w, d, title, proof] = r; rows.push({ kind, id: `w${hash36(norm(q))}`, q, a, w: String(w).split('|'), d: D[d], title, proof, cat, file: f }); }
      else { const [q, value, unit, title, proof] = r; rows.push({ kind, id: `w${hash36(norm(q))}`, q, value, unit, title, proof, cat, file: f }); }
    }
  }
  const verdicts = await checkRows(rows);
  const tally = { tv: [0, 0], cc: [0, 0] };
  const failed = [];
  for (const r of rows) {
    const v = verdicts.get(r.id);
    tally[r.kind][0]++;
    if (!v || !v.ok) { ctx.drop(r.kind, `written: ${v ? v.why : 'unchecked'}`, `${r.q} [${r.title} :: ${r.proof}]`); failed.push(r); continue; }
    tally[r.kind][1]++;
    if (r.kind === 'tv') ctx.tv.push({ id: r.id, cat: r.cat, d: r.d, q: r.q, a: r.a, w: r.w, src: wpUrl(r.title) });
    else ctx.cc.push({ id: r.id, cat: r.cat, q: r.q, value: r.value, unit: r.unit, src: wpUrl(r.title) });
  }
  ctx.writtenOC7 = { tally, failed };
  ctx.log.push(`WRITTEN TRIVIA: ${tally.tv[0]} written · ${tally.tv[1]} confirmed by their source · ${tally.tv[0] - tally.tv[1]} dropped`);
  ctx.log.push(`WRITTEN CLOSEST CALL: ${tally.cc[0]} written · ${tally.cc[1]} confirmed · ${tally.cc[0] - tally.cc[1]} dropped`);
  if (process.argv.includes('--failed')) for (const r of failed) ctx.log.push(`  ✗ ${r.file}: ${r.q}  [${r.title} :: ${r.proof}]`);
}
