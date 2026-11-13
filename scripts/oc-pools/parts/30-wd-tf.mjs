// OVERCLOCK POOLS — TRUE OR FALSE built from WIKIDATA (the data half — right by construction). Natural templates, several phrasings each, no
// template over ~8% of the pool (TEMPLATE_CAP). Every false twin is a BELIEVABLE mistake: the wrong one of two real neighbours, a famous city
// that isn't the capital, a real symbol of another element, the painter / writer / director / singer of ANOTHER famous work of the same era, the
// next decade over. Nothing arguable: one-value facts only (a country with two capitals, a mountain on a border, a painting with two painters
// = out). id = d-<template>-<Q-ids> (stable); src = the Q-ids it was built from.
import { wd as wdRaw } from '../wikidata.mjs';
import { seeded, shuffled, TF_MAX } from '../lib.mjs';
import { TF_EXCLUDE, STAT_EXCLUDE, PEOPLE_EXCLUDE } from '../hand/wd-exclude.mjs';
import { CC_EXCLUDE_LABELS } from '../hand/oc7-exclude.mjs';
import { DIRECTOR_FAME, TF_MOUNTAIN_FAME, MAKER_FIX } from '../hand/oc8-exclude.mjs';
import { isShared, sharedTitleNoYear } from '../pool-rules.mjs';
import { REVIEW_DROP } from '../hand/pool-fixes.mjs';

// (OC8: 85 → 70 — the fame filter took the data half from ~1,240 to ~830 pairs; no template over ~8.5 % of it, as ever)
export const TEMPLATE_CAP = 70;
const CONT = { Q46: 'Europe', Q48: 'Asia', Q15: 'Africa', Q49: 'North America', Q18: 'South America', Q55643: 'Oceania', Q538: 'Oceania' };
// a believable wrong continent for each (never a coin flip between two a country really touches — those countries are out)
const WRONG_CONT = { Europe: 'Asia', Asia: 'Europe', Africa: 'Asia', 'North America': 'South America', 'South America': 'North America', Oceania: 'Asia' };
const L = '?x rdfs:label ?xl . FILTER(lang(?xl) = "en")';
// two forms of each question (wdq.mjs): Wikidata's planner, then the planner OFF — the patterns below are written fame-first for it
const both = q => [q, q.replace('WHERE {', 'WHERE { hint:Query hint:optimizer "None" .')];
const lab = (v, n) => `?${v} rdfs:label ?${n} . FILTER(lang(?${n}) = "en")`;

/** rows → Map(key → [rows]) */
const groupBy = (rows, k) => { const m = new Map(); for (const r of rows) { if (!m.has(r[k])) m.set(r[k], []); m.get(r[k]).push(r); } return m; };
const single = (rows, field) => { const vs = [...new Set(rows.map(r => r[field]))]; return vs.length === 1 ? rows[0] : null; };
const okText = s => s.length <= TF_MAX && !/\bQ\d+\b/.test(s);
// country names English says with "the" (The Netherlands, the Maldives …)
const THE = new Set(['United States', 'United Kingdom', 'Netherlands', 'Philippines', 'Bahamas', 'The Bahamas', 'Gambia', 'The Gambia', 'Dominican Republic',
  'Czech Republic', 'Central African Republic', 'Maldives', 'Marshall Islands', 'Solomon Islands', 'United Arab Emirates', 'Comoros', 'Seychelles',
  'Republic of the Congo', 'Democratic Republic of the Congo', 'Vatican City', 'Ivory Coast']);
const the = (name, start = false) => (THE.has(name) && !/^The /.test(name) ? `${start ? 'The' : 'the'} ${name}` : name);
const decade = y => `${Math.floor(y / 10) * 10}s`;
// (OC8 — THE FABLE REVIEW: "born in the 1900s" read as the DECADE — John Lennon, 1940, marked FALSE by most players) the century by its NAME:
// "the 20th century"
const century = y => { const c = Math.floor(y / 100) + 1; const s = c % 100 >= 11 && c % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[c % 10] || 'th'); return `${c}${s} century`; };

export default async function wikidataTF(ctx) {
  // a question the endpoint can't answer skips its template (logged), never the build
  const wd = (name, q) => wdRaw(name, q).catch(e => { ctx.log.push(`SKIPPED template query ${name}: ${e.message}`); return []; });
  const out = new Map();   // template → [{ id, t, f, src, cat }]
  const rand = seeded('oc6-tf');
  const add = (tpl, cat, ids, t, f) => {
    if (!okText(t) || !okText(f) || TF_EXCLUDE.some(q => ids.includes(q))) return;
    if (!out.has(tpl)) out.set(tpl, []);
    out.get(tpl).push({ id: `d-${tpl}-${ids.join('-')}`, t, f, src: ids.join(' '), cat });
  };
  const vary = (k, list) => list[k % list.length];

  // ---------------------------------------------------------------- CAPITALS: the famous city that isn't the capital
  const caps = await wd('tf-capitals', both(`SELECT ?item ?label ?cap ?capl ?sl WHERE { ?item wdt:P463 wd:Q1065 ; wdt:P36 ?cap ; wikibase:sitelinks ?sl .
    ${lab('item', 'label')} ${lab('cap', 'capl')} }`));
  const cities = await wd('tf-bigcities', both(`SELECT ?item ?city ?cityl ?csl WHERE { VALUES ?ct { wd:Q1549591 wd:Q200250 wd:Q1637706 }
    ?city wdt:P31 ?ct . ?city wikibase:sitelinks ?csl . FILTER(?csl >= 70) ?city wdt:P17 ?item . ?item wdt:P463 wd:Q1065 . ${lab('city', 'cityl')} }`));
  const bigBy = groupBy(cities, 'item');
  let k = 0;
  for (const [q, rows] of groupBy(caps, 'item')) {
    const c = single(rows, 'cap');
    if (!c || c.sl < 120) continue;
    const others = (bigBy.get(q) || []).filter(r => r.city !== c.cap && single((bigBy.get(q) || []).filter(x => x.city === r.city), 'city'))
      .sort((a, b) => b.csl - a.csl);
    const o = others[0];
    if (!o || o.cityl === c.capl) continue;
    const [t, f] = vary(k++, [
      [`${c.capl} is the capital of ${the(c.label)}.`, `${o.cityl} is the capital of ${the(c.label)}.`],
      [`The capital of ${the(c.label)} is ${c.capl}.`, `The capital of ${the(c.label)} is ${o.cityl}.`],
      [`${the(c.label, true)}'s capital city is ${c.capl}.`, `${the(c.label, true)}'s capital city is ${o.cityl}.`],
    ]);
    add('capital', 'geography', [q, c.cap, o.city], t, f);
  }

  // ---------------------------------------------------------------- CONTINENTS: one continent only (a country on two = out)
  const conts = await wd('tf-continents', both(`SELECT ?item ?label ?c ?sl WHERE { ?item wdt:P463 wd:Q1065 ; wdt:P30 ?c ; wikibase:sitelinks ?sl . ${lab('item', 'label')} }`));
  ctx.continents = conts;   // (SORT IT's continent sets read the same answer — parts/40)
  k = 0;
  for (const [q, rows] of groupBy(conts, 'item')) {
    const r = single(rows, 'c');
    if (!r || !CONT[r.c] || r.sl < 150) continue;
    const yes = CONT[r.c], no = WRONG_CONT[yes];
    const [t, f] = vary(k++, [[`${the(r.label, true)} is in ${yes}.`, `${the(r.label, true)} is in ${no}.`], [`${the(r.label, true)} is a country in ${yes}.`, `${the(r.label, true)} is a country in ${no}.`]]);
    add('continent', 'geography', [q], t, f);
  }

  // ---------------------------------------------------------------- ELEMENT SYMBOLS: another real symbol with the same first letter
  const els = await wd('tf-elements', both(`SELECT ?item ?label ?sym ?sl WHERE { ?item wdt:P31 wd:Q11344 ; wdt:P246 ?sym ; wikibase:sitelinks ?sl . FILTER(?sl >= 100) ${lab('item', 'label')} }`));
  const syms = [...new Set(els.map(e => e.sym))].sort();
  k = 0;
  for (const e of els.slice().sort((a, b) => b.sl - a.sl)) {
    const cands = syms.filter(s => s !== e.sym && s[0] === e.sym[0]);
    if (!cands.length) continue;
    const no = cands[Math.floor(rand() * cands.length)];
    const name = e.label.toLowerCase();
    const [t, f] = vary(k++, [[`The chemical symbol for ${name} is ${e.sym}.`, `The chemical symbol for ${name} is ${no}.`], [`${e.sym} is the chemical symbol for ${name}.`, `${no} is the chemical symbol for ${name}.`]]);
    add('symbol', 'science', [e.item], t, f);
  }

  // ---------------------------------------------------------------- WHO MADE IT: the maker of ANOTHER famous work of the same era
  // the works + makers the stats leave out stay out here too (a nude painting, an adult novel, an explicit band)
  const OUTW = { painter: STAT_EXCLUDE['painting-year'], author: STAT_EXCLUDE['novel-year'], director: STAT_EXCLUDE['film-year'], performer: STAT_EXCLUDE['band-year'] };
  // works = a list the stats already hold (parts/20 — famous, cleaned, excluded: { q, label, v (year), sl }) → only the makers are asked for
  // (a small VALUES query); without one, the class is queried fame-first
  const makers = async (tpl, cat, name, cls, minSl, prop, dateProp, span, phr, where = '', works0 = null) => {
    const out = [...(OUTW[tpl] || []), ...PEOPLE_EXCLUDE];
    let rows;
    if (works0 && works0.length) {
      const by = await wd(name, `SELECT ?item ?by ?byl WHERE { VALUES ?item { ${works0.map(w => `wd:${w.q}`).sort().join(' ')} } ?item wdt:${prop} ?by . ${lab('by', 'byl')} }`);
      const W0 = new Map(works0.map(w => [w.q, w]));
      rows = by.filter(r => W0.has(r.item)).map(r => ({ ...r, label: W0.get(r.item).label, y: W0.get(r.item).v, sl: W0.get(r.item).sl }));
    } else {
      rows = await wd(name, both(`SELECT ?item ?label ?by ?byl ?y ?sl WHERE { VALUES ?cls { ${cls.map(c => `wd:${c}`).join(' ')} } ?item wdt:P31 ?cls . ?item wikibase:sitelinks ?sl .
      FILTER(?sl >= ${minSl}) ${where} ?item wdt:${prop} ?by . ?item wdt:${dateProp} ?d . BIND(YEAR(?d) AS ?y) ${lab('item', 'label')} ${lab('by', 'byl')} }`));
    }
    // (OC8 — the directors people KNOW: the director's own Wikipedia count — never Robert Stromberg for Maleficent; the true one + the false twin)
    let fameOf = null;
    if (tpl === 'director') {
      const ids = [...new Set(rows.map(r => r.by))].sort();
      const fr = ids.length ? await wd('tf-director-fame', `SELECT ?by ?sl WHERE { VALUES ?by { ${ids.map(q => `wd:${q}`).join(' ')} } ?by wikibase:sitelinks ?sl . }`) : [];
      fameOf = new Map(fr.map(r => [r.by, r.sl]));
    }
    const works = [];
    for (const [q, rs] of groupBy(rows, 'item')) {
      const r = single(rs, 'by');
      // (a title that names its maker — "…Music by Queen" — or carries a subtitle gives the answer away)
      if (!r || out.includes(r.label) || out.includes(r.byl) || r.label.includes(r.byl) || / [–—-] /.test(r.label)) continue;
      if (fameOf && !((fameOf.get(r.by) || 0) >= DIRECTOR_FAME)) continue;
      // (OC8: the maker as people say it — "made by Sony", never "Sony Interactive Entertainment")
      const byl = tpl === 'maker' ? (MAKER_FIX[r.byl] || r.byl) : r.byl;
      works.push({ q, label: r.label, by: r.by, byl, y: Math.min(...rs.map(x => x.y)), sl: r.sl });
    }
    works.sort((a, b) => b.sl - a.sl);
    const n = new Map();
    let j = 0;
    for (const w of works) {
      const others = works.filter(o => o.by !== w.by && Math.abs(o.y - w.y) <= span && o.byl !== w.byl);
      if (!others.length) continue;
      const o = others[Math.floor(rand() * Math.min(6, others.length))];
      const [t, f] = phr(j++, w, o);
      add(tpl, cat, [w.q, o.by], t, f);
      n.set(tpl, (n.get(tpl) || 0) + 1);
    }
  };
  const W0 = ctx.wd || {};
  // (THE POOL FIXES — RULE 7: a SHARED TITLE carries its year — "The 2009 film Sherlock Holmes was directed by Guy Ritchie.", never the bare
  //  title another famous work shares (the 1992 Aladdin, the 1951 Alice in Wonderland))
  const T = (w, kind, cap) => (isShared(w.label, { film: 'screen', book: 'book', painting: 'painting' }[kind]) && w.y ? `${cap ? 'The' : 'the'} ${w.y} ${kind} ${w.label}` : w.label);
  await makers('painter', 'history', 'tf-painters', ['Q3305213'], 35, 'P170', 'P571', 80,
    (j, w, o) => vary(j, [[`${w.byl} painted ${T(w, 'painting')}.`, `${o.byl} painted ${T(w, 'painting')}.`], [`${T(w, 'painting', 1)} was painted by ${w.byl}.`, `${T(w, 'painting', 1)} was painted by ${o.byl}.`]]), '', W0['painting-year']);
  await makers('author', 'pop', 'tf-authors', ['Q7725634', 'Q8261', 'Q47461344'], 45, 'P50', 'P577', 60,
    (j, w, o) => vary(j, [[`${w.byl} wrote ${T(w, 'book')}.`, `${o.byl} wrote ${T(w, 'book')}.`], [`${T(w, 'book', 1)} was written by ${w.byl}.`, `${T(w, 'book', 1)} was written by ${o.byl}.`]]),
    '?item wdt:P7937 wd:Q8261 .', W0['novel-year']);
  await makers('director', 'pop', 'tf-film-directors', ['Q11424', 'Q202866'], 70, 'P57', 'P577', 12,
    (j, w, o) => vary(j, [[`${w.byl} directed ${T(w, 'film')}.`, `${o.byl} directed ${T(w, 'film')}.`], [`${T(w, 'film', 1)} was directed by ${w.byl}.`, `${T(w, 'film', 1)} was directed by ${o.byl}.`]]),
    'VALUES ?rating { wd:Q18665330 wd:Q18665334 wd:Q18665339 } ?item wdt:P1657 ?rating . MINUS { ?item wdt:P1657 wd:Q18665344 . }',
    [...(W0['film-year'] || []), ...(W0['animated-year'] || [])]);
  await makers('performer', 'pop', 'tf-albums', ['Q482994'], 40, 'P175', 'P577', 10,
    (j, w, o) => vary(j, [[`${w.label} is an album by ${w.byl}.`, `${w.label} is an album by ${o.byl}.`], [`${w.byl} released the album ${w.label}.`, `${o.byl} released the album ${w.label}.`]]));
  await makers('maker', 'pop', 'tf-console-makers', ['Q10929058', 'Q8076', 'Q941818'], 15, 'P176', 'P571', 30,
    (j, w, o) => vary(j, [[`The ${w.label} was made by ${w.byl}.`, `The ${w.label} was made by ${o.byl}.`], [`${w.byl} made the ${w.label}.`, `${o.byl} made the ${w.label}.`]]),
    '?item wdt:P279* ?k . VALUES ?k { wd:Q8076 wd:Q941818 } .', W0['console-year']);

  // ---------------------------------------------------------------- MOONS: which planet a famous moon circles
  const moons = await wd('tf-moons', both(`SELECT ?item ?label ?p ?pl ?sl WHERE { ?item wdt:P31 wd:Q2537 ; wdt:P397 ?p ; wikibase:sitelinks ?sl . FILTER(?sl >= 25)
    VALUES ?p { wd:Q319 wd:Q193 wd:Q324 wd:Q332 wd:Q111 } ${lab('item', 'label')} ${lab('p', 'pl')} }`));
  const giants = ['Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  k = 0;
  for (const [q, rows] of groupBy(moons, 'item')) {
    const r = single(rows, 'p');
    if (!r) continue;
    const wrong = giants.filter(g => g !== r.pl);
    const no = wrong[Math.floor(rand() * wrong.length)];
    const [t, f] = vary(k++, [[`${r.label} is a moon of ${r.pl}.`, `${r.label} is a moon of ${no}.`], [`${r.label} orbits ${r.pl}.`, `${r.label} orbits ${no}.`]]);
    add('moon', 'space', [q], t, f);
  }

  // ---------------------------------------------------------------- PLACES: a famous mountain / U.S. national park, and a real neighbour
  const nbr = await wd('tf-neighbours', both(`SELECT ?a ?b ?bl WHERE { ?a wdt:P463 wd:Q1065 ; wdt:P47 ?b . ?b wdt:P463 wd:Q1065 . ${lab('b', 'bl')} }`));
  const nb = groupBy(nbr, 'a');
  const mts = await wd('tf-mountain-country', both(`SELECT ?item ?label ?c ?cl ?sl WHERE { VALUES ?cls { wd:Q8502 wd:Q8072 } ?item wdt:P31 ?cls ; wikibase:sitelinks ?sl . FILTER(?sl >= 35)
    ?item wdt:P17 ?c . ?c wdt:P463 wd:Q1065 . ${lab('item', 'label')} ${lab('c', 'cl')} }`));
  k = 0;
  for (const [q, rows] of groupBy(mts, 'item')) {
    const r = single(rows, 'c');
    // (OC8 — a famous mountain only: Jebel Shams out — its own fame + OC7's by-hand OBSCURE peaks)
    if (!r || !(r.sl >= TF_MOUNTAIN_FAME) || CC_EXCLUDE_LABELS.peak.includes(r.label)) continue;
    const ns = (nb.get(r.c) || []).map(x => x.bl).filter(x => x !== r.cl).sort();
    if (!ns.length) continue;
    const no = ns[Math.floor(rand() * ns.length)];
    const [t, f] = vary(k++, [[`${r.label} is in ${the(r.cl)}.`, `${r.label} is in ${the(no)}.`], [`You'll find ${r.label} in ${the(r.cl)}.`, `You'll find ${r.label} in ${the(no)}.`]]);
    add('mountain-in', 'geography', [q], t, f);
  }
  const sn = await wd('tf-state-neighbours', both(`SELECT ?a ?b ?bl WHERE { ?a wdt:P31 wd:Q35657 ; wdt:P47 ?b . ?b wdt:P31 wd:Q35657 . ${lab('b', 'bl')} }`));
  const snb = groupBy(sn, 'a');
  const parks = await wd('tf-park-state', both(`SELECT ?item ?label ?s ?stl WHERE { ?item wdt:P31 wd:Q34918903 . ?item wdt:P131* ?s . ?s wdt:P31 wd:Q35657 .
    ${lab('item', 'label')} ${lab('s', 'stl')} }`));
  k = 0;
  for (const [q, rows] of groupBy(parks, 'item')) {
    const r = single(rows, 's');
    if (!r) continue;
    const ns = (snb.get(r.s) || []).map(x => x.bl).sort();
    if (!ns.length) continue;
    const no = ns[Math.floor(rand() * ns.length)];
    const name = /national park/i.test(r.label) ? r.label : `${r.label} National Park`;
    const [t, f] = vary(k++, [[`${name} is in ${r.stl}.`, `${name} is in ${no}.`], [`${r.stl} is home to ${name}.`, `${no} is home to ${name}.`]]);
    add('park-in', 'geography', [q], t, f);
  }

  // ---------------------------------------------------------------- FROM THE STATS (parts/20): decades, centuries + plain comparisons
  const W = ctx.wd || {};
  const pick = list => shuffled(rand, list);
  const DECADE = { 'film-year': 'came out in the', 'animated-year': 'came out in the', 'game-year': 'came out in the', 'album-year': 'came out in the', 'song-year': 'came out in the', 'cartoon-year': 'first aired in the' };
  k = 0;
  for (const [sid, verb] of Object.entries(DECADE)) for (const x of pick(W[sid] || [])) {
    const m = x.v % 10;
    if (m < 2 || m > 7) continue;       // a release-year wobble never crosses a decade
    const no = decade(x.v + (rand() < 0.5 ? -10 : 10));
    if (Number(no.slice(0, 4)) > 2020) continue;
    add('decade', 'pop', [x.q], `${x.label} ${verb} ${decade(x.v)}.`, `${x.label} ${verb} ${no}.`);
  }
  for (const sid of ['born']) for (const x of pick(W[sid] || [])) {
    const m = x.v % 100;
    if (m < 6 || m > 93) continue;
    const no = century(x.v + (rand() < 0.5 ? -100 : 100));
    add('century', 'history', [x.q], vary(k, [`${x.label} was born in the ${century(x.v)}.`]), `${x.label} was born in the ${no}.`);
    k++;
  }
  // comparisons: clear-cut pairs (2× apart, or 25+ years) — "A is taller than B" / the swap
  const CMP = [
    ['taller', 'mountain-height', (a, b) => `${a} is higher than ${b}.`],
    ['taller', 'skyscraper-height', (a, b) => `${a} is taller than ${b}.`],
    ['longer', 'river-length', (a, b) => `The ${a} is longer than the ${b}.`],
    ['bigger', 'country-area', (a, b) => `${a} covers more land than ${b}.`],
    ['bigger', 'state-area', (a, b) => `${a} is bigger than ${b}.`],
    ['bigger', 'island-area', (a, b) => `${a} is a bigger island than ${b}.`],
    ['bigger', 'lake-area', (a, b) => `${a} is bigger than ${b}.`],
    ['people', 'country-pop', (a, b) => `${a} has more people than ${b}.`],
    ['people', 'state-pop', (a, b) => `${a} had more people than ${b} in 2020.`],
    ['before', 'statehood', (a, b) => `${a} became a state before ${b}.`],
    ['before', 'president-start', (a, b) => `${a} took office before ${b}.`],
    ['before', 'novel-year', (a, b) => `${a} came out before ${b}.`],
    ['before', 'film-year', (a, b) => `${a} came out before ${b}.`],
    ['before', 'band-year', (a, b) => `${a} formed before ${b}.`],
    ['before', 'company-year', (a, b) => `${a} is older than ${b}.`],
  ];
  for (const [tpl, sid, say] of CMP) {
    const items = W[sid] || [];
    const year = /year|statehood|start/.test(sid);
    const list = pick(items);
    for (let i = 0; i + 1 < list.length; i += 2) {
      let [a, b] = [list[i], list[i + 1]];
      const clear = year ? Math.abs(a.v - b.v) >= 25 : Math.max(a.v, b.v) / Math.min(a.v, b.v) >= 2;
      if (!clear) continue;
      // the true one says the bigger / earlier first
      if (year ? a.v > b.v : a.v < b.v) [a, b] = [b, a];
      const A = /^country/.test(sid) ? [the(a.label, true), the(b.label)] : [a.label, b.label];
      const B = /^country/.test(sid) ? [the(b.label, true), the(a.label)] : [b.label, a.label];
      add(`${tpl}-${sid.split('-')[0]}`, sid.startsWith('born') ? 'history' : year ? 'history' : 'geography', [a.q, b.q], say(...A), say(...B));
    }
  }

  // ---------------------------------------------------------------- the cap (no template over ~8%), deterministic order
  let total = 0;
  for (const [tpl, rows] of [...out.entries()].sort()) {
    // (THE POOL FIXES: the review's drops + RULE 7 — a shared title without its year — leave BEFORE the cap, so the cap refills from good rows
    //  and the build's own checks find nothing here; the build still checks both)
    const ok = rows.filter(r => !REVIEW_DROP[r.id] && !sharedTitleNoYear(r.t) && !sharedTitleNoYear(r.f));
    const keep = shuffled(seeded(`oc6-tf-cap:${tpl}`), ok.length === rows.length ? rows : ok).slice(0, TEMPLATE_CAP);
    ctx.tf.push(...keep);
    total += keep.length;
    ctx.log.push(`  data T/F ${tpl}: ${keep.length} of ${rows.length}`);
  }
  ctx.log.push(`DATA T/F: ${total} pairs from ${out.size} templates`);
}
