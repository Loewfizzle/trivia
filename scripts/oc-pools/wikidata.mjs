// OVERCLOCK POOLS (OC6) — WIKIDATA (CC0) through its public SPARQL endpoint, politely: one query at a time, a User-Agent naming the site,
// and every response CACHED under scripts/oc-pools/cache/wd/<name>.json (committed) so a rebuild works OFFLINE + gives the same output.
//   rows = await wd('mountains', `SELECT …`)       → [{ var: value }] (an entity → its Q-id, a number → a Number, a date → its year)
// A cached answer is reused while its query text is unchanged; `--refresh` (or a changed query) asks the endpoint again; `--offline` never
// does (a missing cache is then an error).
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { HERE, hash36 } from './lib.mjs';

const DIR = join(HERE, 'cache', 'wd');
const UA = 'NeonSpeakeasyPoolBuilder/1.0 (https://neonspeakeasy.com; content build for a party game; one query at a time)';
const ENDPOINT = 'https://query.wikidata.org/sparql';
const args = process.argv.slice(2);
export const OFFLINE = args.includes('--offline');
const REFRESH = args.includes('--refresh');
const PREFIX = 'PREFIX wd: <http://www.wikidata.org/entity/> PREFIX wdt: <http://www.wikidata.org/prop/direct/> PREFIX wikibase: <http://wikiba.se/ontology#> PREFIX p: <http://www.wikidata.org/prop/> PREFIX ps: <http://www.wikidata.org/prop/statement/> PREFIX pq: <http://www.wikidata.org/prop/qualifier/> PREFIX psv: <http://www.wikidata.org/prop/statement/value/> PREFIX bd: <http://www.bigdata.com/rdf#> PREFIX schema: <http://schema.org/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n';

const sleep = ms => new Promise(r => setTimeout(r, ms));
let last = 0;
export const stats = { cached: 0, fetched: 0 };

function value(b) {
  if (!b) return null;
  if (b.type === 'uri') { const m = /entity\/(Q\d+)$/.exec(b.value); return m ? m[1] : b.value; }
  const dt = b.datatype || '';
  if (/#(decimal|integer|double|float)$/.test(dt)) return Number(b.value);
  if (/#dateTime$/.test(dt)) { const m = /^(-?\d+)-/.exec(b.value); return m ? Number(m[1]) : null; }
  return b.value;
}

export async function wd(name, query) {
  mkdirSync(DIR, { recursive: true });
  const file = join(DIR, `${name}.json`);
  const qh = hash36(query.replace(/\s+/g, ' ').trim());
  if (existsSync(file) && !REFRESH) {
    const c = JSON.parse(readFileSync(file, 'utf8'));
    if (c.q === qh) { stats.cached++; return c.rows; }
  }
  if (OFFLINE) throw new Error(`wikidata ${name}: no cached answer for this query (run without --offline)`);
  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = Math.max(0, last + 1500 - Date.now());
    if (wait) await sleep(wait);
    last = Date.now();
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ query: PREFIX + query }),
    }).catch(e => ({ ok: false, status: String(e) }));
    if (res.ok) {
      const j = await res.json();
      const vars = j.head.vars;
      const rows = j.results.bindings.map(b => Object.fromEntries(vars.map(v => [v, value(b[v])])));
      writeFileSync(file, `{"name":${JSON.stringify(name)},"q":"${qh}","n":${rows.length},"rows":[\n${rows.map(r => JSON.stringify(r)).join(',\n')}\n]}\n`);
      stats.fetched++;
      console.log(`  wikidata ${name}: ${rows.length} rows`);
      return rows;
    }
    console.warn(`  wikidata ${name}: ${res.status} — retrying`);
    await sleep(5000 * (attempt + 1));
  }
  throw new Error(`wikidata ${name}: the endpoint kept failing`);
}
