// OVERCLOCK POOLS (OC7 Group 1) — CLOSEST CALL from WIKIDATA (CC0). One number a player can ESTIMATE, where "close" means something (the
// score is the relative error — closestCredit: within 5% = full marks, nothing past 60%): heights, lengths, areas, depths, the 2020 census, how
// long a famous person lived, a movie's running time, a finished show's episodes, the straight-line distance between two famous cities. Every
// question NAMES its unit in US terms ("…, in feet?"); the data stays METRIC (the pad converts — challenges.js#closestAnswer). Fame = sitelinks
// (THE FAME FILTER inside every query). ARGUABLE = OUT: values that disagree by > 3% (wdq.mjs), river lengths + total bridge lengths (measured
// differently by every source — the main span instead), a city that shares its name, anything still changing (a show still running).
// id = c-<stat>-<Q-ids>; src = the Q-ids.
import { wd as wdRaw } from '../wikidata.mjs';
import { numeric } from '../wdq.mjs';
import { STAT_EXCLUDE, PEOPLE_EXCLUDE } from '../hand/wd-exclude.mjs';
import { CC_EXCLUDE, CC_EXCLUDE_LABELS, LIVED_EXCLUDE, DIST_US, DIST_WORLD } from '../hand/oc7-exclude.mjs';

const THE = new Set(['United States', 'United Kingdom', 'Netherlands', 'Philippines', 'Bahamas', 'Gambia', 'Dominican Republic', 'Czech Republic',
  'Central African Republic', 'Maldives', 'Marshall Islands', 'Solomon Islands', 'United Arab Emirates', 'Comoros', 'Seychelles',
  'Republic of the Congo', 'Democratic Republic of the Congo', 'Vatican City', 'Ivory Coast']);
const theCountry = n => (/^The /.test(n) ? n.replace(/^The /, 'the ') : THE.has(n) ? `the ${n}` : n);
// a building / a bridge / a sea says "the" in English (the Eiffel Tower, the Golden Gate Bridge, the Caspian Sea); a name alone doesn't (Burj Khalifa)
const GENERIC = /\b(Building|Tower|Towers|Center|Centre|Bridge|Needle|Monument|Arch|Plaza|Spire|Tunnel|Hotel|Wheel|Palace|Place|Point|Square|Sea|Shard|Gherkin|Pyramid|Exchange|Hall|Gate|Dam|Mall)$/;
const theThing = n => (/^The /.test(n) ? n.replace(/^The /, 'the ') : /^(\d|One )/.test(n) ? n : GENERIC.test(n) || /^Great /.test(n) ? `the ${n}` : n);
// an island's name says what it is (Easter Island, the Isle of Wight) — else "the island of …" (the island of Ireland, not the country)
const LABEL_FIX = { Titicaca: 'Lake Titicaca', 'Cotopaxi volcano': 'Cotopaxi', 'Bali Island': 'Bali', 'Jeju Island': 'Jeju', 'North Island': 'New Zealand\'s North Island', 'South Island': 'New Zealand\'s South Island' };
const fix = l => LABEL_FIX[l] || l;
const island = n => (/^New Zealand/.test(n) ? n : /^Isle of /.test(n) ? `the ${n}` : /\bIsland$/.test(n) ? n : `the island of ${n}`);
const both = q => [q, q.replace('WHERE {', 'WHERE { hint:Query hint:optimizer "None" .')];
const lab = (v, n) => `?${v} rdfs:label ?${n} . FILTER(lang(?${n}) = "en")`;
const FILM_OK = 'VALUES ?rating { wd:Q18665330 wd:Q18665334 wd:Q18665339 wd:Q29841078 } ?item wdt:P1657 ?rating . MINUS { ?item wdt:P1657 wd:Q18665344 . } MINUS { ?item wdt:P1657 wd:Q18665349 . }';
const BRIDGES = ['Q12280', 'Q12570', 'Q158438', 'Q158218', 'Q537127', 'Q3397526'];
const top = (list, n) => list.slice().sort((a, b) => b.sl - a.sl || Number(a.q.slice(1)) - Number(b.q.slice(1))).slice(0, n);

/** the great-circle distance in km between two "Point(lon lat)" coordinates */
function km(a, b) {
  const p = s => { const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(s); return m ? [Number(m[2]), Number(m[1])] : null; };
  const A = p(a), B = p(b);
  if (!A || !B) return null;
  const r = d => (d * Math.PI) / 180, R = 6371.0088;
  const dl = r(B[0] - A[0]), dn = r(B[1] - A[1]);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(r(A[0])) * Math.cos(r(B[0])) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default async function closestWikidata(ctx) {
  const wd = (name, q) => wdRaw(name, q).catch(e => { ctx.log.push(`SKIPPED closest query ${name}: ${e.message}`); return []; });
  const W = ctx.wd || {};
  const out = [];
  const seen = new Set();
  const add = (stat, cat, ids, q, value, unit) => {
    if (!q || !(value > 0) || ids.some(x => CC_EXCLUDE.includes(x))) return;
    const id = `c-${stat}-${ids.join('-')}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ id, cat, q, value: Number(value.toPrecision(6)), unit, src: ids.join(' '), stat });
  };
  const ex = id => x => !(STAT_EXCLUDE[id] || []).includes(x.q) && !(STAT_EXCLUDE[id] || []).includes(x.label);
  const keep = (stat, list) => { const no = new Set((CC_EXCLUDE_LABELS[stat] || []).map(s => s.toLowerCase())); return list.filter(x => !no.has(String(x.label).toLowerCase())).map(x => ({ ...x, label: fix(x.label) })); };

  // ---------------------------------------------------------------- from OC6's lists (ctx.wd — parts/20: famous, cleaned, excluded, metric)
  for (const x of keep('peak', top((W['mountain-height'] || []).filter(ex('mountain-height')), 110))) add('peak', 'GEOGRAPHY', [x.q], `How high is ${x.label} above sea level, in feet?`, x.v, 'm');
  for (const id of ['skyscraper-height', 'tower-height']) for (const x of keep('tall', top((W[id] || []).filter(ex(id)), 80))) add('tall', 'LANDMARKS', [x.q], `How tall is ${theThing(x.label)}, in feet?`, x.v, 'm');
  for (const x of keep('country-area', top(W['country-area'] || [], 130))) add('country-area', 'GEOGRAPHY', [x.q], `How big is ${theCountry(x.label)}, in square miles?`, x.v, 'km2');
  for (const x of W['state-area'] || []) add('state-area', 'U.S.A.', [x.q], `How big is the state of ${x.label}, in square miles?`, x.v, 'km2');
  for (const x of keep('island-area', top(W['island-area'] || [], 60))) add('island-area', 'GEOGRAPHY', [x.q], `How big is ${island(x.label)}, in square miles?`, x.v, 'km2');
  for (const x of keep('lake-area', top(W['lake-area'] || [], 50))) add('lake-area', 'GEOGRAPHY', [x.q], `How big is ${theThing(x.label)}, in square miles?`, x.v, 'km2');
  for (const x of keep('lake-depth', top(W['lake-depth'] || [], 40))) add('lake-depth', 'GEOGRAPHY', [x.q], `How deep is ${theThing(x.label)} at its deepest point, in feet?`, x.v, 'm');
  for (const x of keep('park-area', top(W['park-area'] || [], 60))) add('park-area', 'U.S.A.', [x.q], `How big is ${x.label}, in square miles?`, x.v, 'km2');
  for (const x of keep('atomic', top(W['element-number'] || [], 70))) add('atomic', 'SCIENCE', [x.q], `What is the atomic number of ${x.label.toLowerCase()}?`, x.v, '');
  for (const x of W['state-pop'] || []) add('state-pop', 'U.S.A.', [x.q], `How many people lived in the state of ${x.label} at the 2020 census?`, x.v, 'people');

  // ---------------------------------------------------------------- U.S. CITIES at the 2020 census — named with their state (two Portlands)
  const cities = top(W['uscity-pop'] || [], 90);
  if (cities.length) {
    const st = await wd('cc-city-state', `SELECT ?item ?s ?sl2 ?stl WHERE { VALUES ?item { ${cities.map(c => `wd:${c.q}`).sort().join(' ')} }
      ?item wdt:P131+ ?s . ?s wdt:P31 wd:Q35657 . ${lab('s', 'stl')} }`);
    const stateOf = new Map();
    for (const r of st) stateOf.set(r.item, stateOf.has(r.item) && stateOf.get(r.item) !== r.stl ? null : r.stl);
    for (const c of cities) {
      const s = stateOf.get(c.q);
      if (!s || c.label.includes(',')) continue;
      add('city-pop', 'U.S.A.', [c.q], c.label === 'New York City' ? 'How many people lived in New York City at the 2020 census?' : `How many people lived in ${c.label}, ${s}, at the 2020 census?`, c.v, 'people');
    }
  }

  // ---------------------------------------------------------------- BRIDGES — the MAIN SPAN (one measured number), never the total length
  const spans = await numeric('cc-bridge-span', { cls: BRIDGES, prop: 'P2787', minSl: 18, not: ['wdt:P576'] });
  for (const x of keep('span', top(spans, 50))) add('span', 'LANDMARKS', [x.q], `How long is the main span of ${theThing(x.label)}, in feet?`, x.v, 'm');

  // ---------------------------------------------------------------- HOW LONG THEY LIVED — famous people, both dates to the day, a natural death
  // (no politicians, rulers, soldiers, clerics — OC6's rule; no violent death; born 1600+ so both calendars agree)
  const OCC = ['Q901', 'Q169470', 'Q593644', 'Q170790', 'Q11063', 'Q864503', 'Q1028181', 'Q36834', 'Q36180', 'Q49757', 'Q205375', 'Q11900058',
    'Q33999', 'Q177220', 'Q639669', 'Q11631', 'Q2526255', 'Q81096', 'Q42973', 'Q1622272'];
  const BAD_OCC = ['Q82955', 'Q189290', 'Q116', 'Q250867', 'Q3242115', 'Q193391', 'Q47064', 'Q372436', 'Q1097498', 'Q15995642', 'Q1234713', 'Q2259532'];
  const lived = await wd('cc-lifespan', both(`SELECT ?item ?label ?age ?sex ?sl WHERE { VALUES ?occ { ${OCC.map(o => `wd:${o}`).join(' ')} }
    ?item wdt:P106 ?occ ; wdt:P31 wd:Q5 ; wikibase:sitelinks ?sl . FILTER(?sl >= 110)
    ?item p:P569/psv:P569 ?bv . ?bv wikibase:timeValue ?b ; wikibase:timePrecision 11 .
    ?item p:P570/psv:P570 ?dv . ?dv wikibase:timeValue ?d ; wikibase:timePrecision 11 . FILTER(YEAR(?b) >= 1600)
    BIND(YEAR(?d) - YEAR(?b) - IF(MONTH(?d) < MONTH(?b) || (MONTH(?d) = MONTH(?b) && DAY(?d) < DAY(?b)), 1, 0) AS ?age)
    OPTIONAL { ?item wdt:P21 ?sex . }
    MINUS { ?item wdt:P1196 ?how . VALUES ?how { wd:Q149086 wd:Q10737 wd:Q8454 wd:Q171558 wd:Q18663901 } }
    MINUS { ?item wdt:P106 ?bad . VALUES ?bad { ${BAD_OCC.map(o => `wd:${o}`).join(' ')} } }
    ${lab('item', 'label')} }`));
  const ppl = new Map();
  for (const r of lived) {
    const e = ppl.get(r.item) || { q: r.item, label: r.label, sl: r.sl, ages: new Set(), sex: new Set() };
    e.ages.add(r.age); if (r.sex) e.sex.add(r.sex); ppl.set(r.item, e);
  }
  const PRON = { Q6581097: 'he', Q6581072: 'she' };
  const people = [...ppl.values()].filter(p => p.ages.size === 1 && p.sex.size === 1 && PRON[[...p.sex][0]] && !PEOPLE_EXCLUDE.includes(p.label) && !LIVED_EXCLUDE.includes(p.label) && [...p.ages][0] >= 20)
    .map(p => ({ ...p, v: [...p.ages][0] }));
  for (const p of top(people, 220)) add('lived', 'PEOPLE', [p.q], `How old was ${p.label} when ${PRON[[...p.sex][0]]} died?`, p.v, 'years');

  // ---------------------------------------------------------------- MOVIES — the running time (a family rating; the cuts must agree within 3%)
  // (the YEAR goes with the title — a remake shares it: Cinderella (1950), The Lion King (1994))
  const films = keep('runtime', await numeric('cc-film-runtime', { cls: ['Q11424', 'Q202866'], prop: 'P2047', minSl: 70, where: FILM_OK }));
  const fy = films.length ? await wd('cc-film-year', `SELECT ?item ?y WHERE { VALUES ?item { ${films.map(f => `wd:${f.q}`).sort().join(' ')} } ?item wdt:P577 ?d . BIND(YEAR(?d) AS ?y) }`) : [];
  const yearOf = new Map();
  for (const r of fy) yearOf.set(r.item, Math.min(yearOf.get(r.item) ?? 9999, r.y));
  for (const x of top(films.filter(ex('film-year')), 110)) if (yearOf.get(x.q) < 2026) add('runtime', 'MOVIES', [x.q], `How long is the movie ${x.label} (${yearOf.get(x.q)}), in minutes?`, x.v / 60, 'minutes');

  // ---------------------------------------------------------------- FINISHED TV SHOWS — how many episodes (an end date: nothing still running)
  const shows = await wd('cc-tv-episodes', both(`SELECT ?item ?label ?v ?sl WHERE { VALUES ?cls { wd:Q5398426 wd:Q581714 wd:Q117467246 }
    ?item wdt:P31 ?cls ; wikibase:sitelinks ?sl . FILTER(?sl >= 55) ?item wdt:P582 ?end . FILTER(YEAR(?end) <= 2022)
    ?item p:P1113 ?st . ?st a wikibase:BestRank ; ps:P1113 ?v . ${lab('item', 'label')} }`));
  const eps = new Map();
  for (const r of shows) { const e = eps.get(r.item) || { q: r.item, label: r.label, sl: r.sl, vs: new Set() }; e.vs.add(r.v); eps.set(r.item, e); }
  for (const s of top(keep('episodes', [...eps.values()].filter(s => s.vs.size === 1).map(s => ({ ...s, v: [...s.vs][0] }))), 80)) {
    if (s.v >= 6) add('episodes', 'TV', [s.q], `How many episodes of ${s.label} were made?`, s.v, 'episodes');
  }

  // ---------------------------------------------------------------- AS THE CROW FLIES — two famous cities, the straight-line distance
  // (the famous cities only — hand/oc7-exclude.mjs#DIST_US / DIST_WORLD; each Q-id checked against Wikidata's own label)
  const US = Object.keys(DIST_US), WORLD = Object.keys(DIST_WORLD);
  const ids = [...new Set([...US, ...WORLD])].sort();
  const coords = ids.length ? await wd('cc-city-coords', `SELECT ?item ?label ?p WHERE { VALUES ?item { ${ids.map(q => `wd:${q}`).join(' ')} } ?item wdt:P625 ?p . ${lab('item', 'label')} }`) : [];
  const at = new Map();
  const NAME = { ...DIST_WORLD, ...DIST_US };
  const same = (a, b) => a.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 6) === b.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 6);
  for (const r of coords) {
    if (!same(r.label, NAME[r.item])) { ctx.log.push(`  closest: ${r.item} is "${r.label}", not ${NAME[r.item]} — skipped`); continue; }
    at.set(r.item, at.has(r.item) ? null : { p: r.p, label: NAME[r.item] });     // two coordinates = arguable → out
  }
  const pairs = (list, n, minKm, salt) => {
    const got = [];
    for (let i = 0; i < list.length && got.length < n; i++) for (let j = i + 1 + (i % 3); j < list.length && got.length < n; j += 4) {
      const a = at.get(list[i]), b = at.get(list[j]);
      if (!a || !b) continue;
      const d = km(a.p, b.p);
      if (d && d >= minKm) got.push([list[i], list[j], d]);
    }
    void salt;
    return got;
  };
  for (const [a, b, d] of pairs(US, 60, 300, 'us')) add('miles-us', 'U.S.A.', [a, b], `How far is it from ${at.get(a).label} to ${at.get(b).label} in a straight line, in miles?`, d, 'km');
  for (const [a, b, d] of pairs(WORLD, 110, 800, 'world')) add('miles-world', 'GEOGRAPHY', [a, b], `How far is it from ${at.get(a).label} to ${at.get(b).label} in a straight line, in miles?`, d, 'km');

  for (const r of out) { delete r.stat; ctx.cc.push(r); }
  const by = {};
  for (const r of out) { const s = r.id.split('-').slice(1, -1).join('-').replace(/-Q\d+$/, ''); by[s] = (by[s] || 0) + 1; }
  ctx.log.push(`CLOSEST CALL (Wikidata): ${out.length} questions — ${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
}
