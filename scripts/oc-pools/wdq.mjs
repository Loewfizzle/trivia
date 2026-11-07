// OVERCLOCK POOLS — Wikidata query builders + the rules every data-built item passes (OC6). Node only.
//   numeric(def) / yearOf(def) → [{ q, label, v, sl }]: one row per item, the item's value (best-ranked statements; values that disagree
//   by more than 3% — or years more than 3 apart — = an ARGUABLE item, dropped), its English label, its sitelinks (how well known it is).
import { wd } from './wikidata.mjs';
import { LABEL_MAX } from './lib.mjs';

const vals = list => list.map(v => `wd:${v}`).join(' ');

/**
 * class + filters → the WHERE lines that pick the items — THE FAME FILTER INSIDE THE QUERY (the owner's add-on, Nov 6: sitelinks ≥ ~30 for
 * creative works, ≥ ~15 for places, tuned per stat): every item is one a casual player or a kid can recognise. Two forms of the same query:
 *   'plain' — Wikidata's own planner (fast for most classes: mountains 13 s);
 *   'fame'  — the planner OFF (hint:Query hint:optimizer "None"): class → its sitelinks → the fame filter → only then the values. The big
 *             classes (albums, songs, novels — a million items) need it: the plain planner fetches every album's dates first and times out.
 * wikidata.mjs tries them in that order; the cache keeps whichever answered.
 */
function pick({ cls, minSl = 20, where = '', not = [] }, form = 'plain') {
  const head = form === 'fame' ? 'hint:Query hint:optimizer "None" .' : '';
  return `${head} VALUES ?cls { ${vals(cls)} } ?item wdt:P31 ?cls . ?item wikibase:sitelinks ?sl . FILTER(?sl >= ${minSl})
  ${where}
  ${not.map(n => `MINUS { ?item ${n} [] . }`).join(' ')}
  ?item rdfs:label ?label . FILTER(lang(?label) = "en")`;
}
const both = f => [f('plain'), f('fame')];

function group(rows, { years = false } = {}) {
  const by = new Map();
  for (const r of rows) {
    if (r.v == null || !Number.isFinite(r.v)) continue;
    const e = by.get(r.item) || { q: r.item, label: r.label, sl: r.sl, vs: [] };
    e.vs.push(r.v);
    by.set(r.item, e);
  }
  const out = [];
  for (const e of by.values()) {
    const vs = [...new Set(e.vs)].sort((a, b) => a - b);
    if (years) { if (vs.at(-1) - vs[0] > 3) continue; e.v = vs[0]; }
    else { if (vs[0] <= 0 || vs.at(-1) / vs[0] > 1.03) continue; e.v = vs[Math.floor(vs.length / 2)]; }
    out.push(e);
  }
  return out;
}

/** labels a phone can show: short, not a bare id, no two the same (an ambiguous label drops both) */
export function labelled(items, fix = l => l) {
  const ok = items.map(x => ({ ...x, label: fix(String(x.label || '').trim()) }))
    .filter(x => x.label && !/^Q\d+$/.test(x.label) && x.label.length <= LABEL_MAX);
  const count = new Map();
  for (const x of ok) count.set(x.label.toLowerCase(), (count.get(x.label.toLowerCase()) || 0) + 1);
  return ok.filter(x => count.get(x.label.toLowerCase()) === 1);
}

/** a quantity (normalized to SI by Wikidata: metres, km², kelvin, kg …) */
export async function numeric(name, def) {
  const q = both(f => `SELECT ?item ?label ?v ?sl WHERE { ${pick(def, f)}
  ?item p:${def.prop} ?st . ?st a wikibase:BestRank ; psn:${def.prop}/wikibase:quantityAmount ?v . }`);
  return group(await wd(name, q));
}
/** a plain number (no unit to normalize: atomic number, a count) */
export async function plain(name, def) {
  // (also a count with no unit to normalize — a population)
  const q = both(f => `SELECT ?item ?label ?v ?sl WHERE { ${pick(def, f)}
  ?item p:${def.prop} ?st . ?st a wikibase:BestRank ; ps:${def.prop} ?v . }`);
  return group(await wd(name, q));
}
/** a year from a date property (precision a year or finer — a "1500s" date never passes) */
export async function yearOf(name, def) {
  const props = Array.isArray(def.prop) ? def.prop : [def.prop];
  const one = p => `{ ?item p:${p} ?st . ?st a wikibase:BestRank ; psv:${p} ?tv . }`;
  const q = both(f => `SELECT ?item ?label ?v ?sl WHERE { ${pick(def, f)}
  ${props.map(one).join(' UNION ')}
  ?tv wikibase:timeValue ?v ; wikibase:timePrecision ?prec . FILTER(?prec >= 9) }`);
  const rows = (await wd(name, q)).filter(r => r.v != null);
  return group(rows, { years: true });
}

/** the top n by fame (sitelinks), ties by Q-number — deterministic */
export const top = (items, n) => items.slice().sort((a, b) => b.sl - a.sl || Number(a.q.slice(1)) - Number(b.q.slice(1))).slice(0, n);
