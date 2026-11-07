// OVERCLOCK POOLS — the HAND items kept from OC1–OC5 (hand/checked.json): each one CHECKED against the Wikipedia article it names (the proof
// must be in the article — sources.mjs); unconfirmed = dropped. src = the article's URL.
import { join } from 'node:path';
import { HERE, readJSON } from '../lib.mjs';
import { checkRows, wpUrl } from '../sources.mjs';

export default async function handChecked(ctx) {
  const H = readJSON(join(HERE, 'hand', 'checked.json'));
  const rows = [];
  for (const kind of ['hl', 'tl']) for (const g of H[kind]) for (const it of g.items) rows.push({ id: `${kind}:${g.id}:${it[3]}`, title: it[4], proof: it[5] });
  const v = await checkRows(rows);
  let kept = 0, all = 0;
  for (const kind of ['hl', 'tl']) for (const g of H[kind]) {
    const items = [];
    for (const it of g.items) {
      all++;
      const ok = v.get(`${kind}:${g.id}:${it[3]}`);
      if (!ok || !ok.ok) { ctx.drop(kind, `hand: ${ok ? ok.why : 'unchecked'}`, `${g.id} ${it[0]} [${it[4]} :: ${it[5]}]`); continue; }
      items.push([it[0], it[1], it[2], it[3], wpUrl(it[4])]);
      kept++;
    }
    const { items: _, ...rest } = g;
    ctx[kind].push({ ...rest, items });
  }
  ctx.log.push(`HAND (checked): ${kept} of ${all} items confirmed`);
}
