// OVERCLOCK POOLS — THE WRITTEN TRUE OR FALSE statements (scripts/oc-pools/written/tf-*.json: { cat, rows: [[true, false twin, Wikipedia
// article, proof]] }). Every row is checked against its article (sources.mjs — the proof must be in the article's text); a row that can't be
// confirmed is DROPPED, never kept on trust. id = "w" + a hash of the true text (stable while its words don't change).
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HERE, readJSON, hash36, norm } from '../lib.mjs';
import { checkRows, wpUrl } from '../sources.mjs';

export default async function written(ctx) {
  const dir = join(HERE, 'written');
  const files = readdirSync(dir).filter(f => /^tf-.*\.json$/.test(f)).sort();
  const rows = [];
  for (const f of files) {
    const { cat, rows: list } = readJSON(join(dir, f));
    for (const [t, fl, title, proof] of list) rows.push({ id: `w${hash36(norm(t))}`, t, f: fl, title, proof, cat, file: f });
  }
  const verdicts = await checkRows(rows);
  let kept = 0;
  const failed = [];
  for (const r of rows) {
    const v = verdicts.get(r.id);
    if (!v || !v.ok) { ctx.drop('tf', `written: ${v ? v.why : 'unchecked'}`, `${r.t} [${r.title} :: ${r.proof}]`); failed.push(r); continue; }
    ctx.tf.push({ id: r.id, t: r.t, f: r.f, src: wpUrl(r.title), cat: r.cat });
    kept++;
  }
  ctx.written = { total: rows.length, kept, failed };
  ctx.log.push(`WRITTEN T/F: ${rows.length} written · ${kept} confirmed by their source · ${rows.length - kept} dropped`);
  if (process.argv.includes('--failed')) for (const r of failed) ctx.log.push(`  ✗ ${r.file}: ${r.t}  [${r.title} :: ${r.proof}]`);
}
