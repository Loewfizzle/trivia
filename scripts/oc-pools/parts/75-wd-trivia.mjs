// OVERCLOCK POOLS (OC7 Group 1) — TRIVIA LIGHTNING's DATA HALF from WIKIDATA (CC0): multiple choice, right by construction. Every WRONG answer
// comes from the SAME CLASS at a SIMILAR FAME (a wrong capital is another capital on that continent; a wrong director made another famous
// film of that era) and is never ALSO right (one-value facts only: a city in two countries, a book with two authors, a film with two
// directors = out). Fame = sitelinks — it orders the rows and sets the difficulty (each template's best-known third or so EASY, its least
// known ~20% HARD). One fact, one question: a country is asked its capital OR named from its capital, never both. id = t-<template>-<Q-ids>;
// src = the Q-ids it was built from.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { wd as wdRaw } from '../wikidata.mjs';
import { HERE } from '../lib.mjs';
import { seeded, shuffled, hash36, norm, aliasOf, Q_MAX, A_MAX } from '../lib.mjs';
import { TF_EXCLUDE, STAT_EXCLUDE, PEOPLE_EXCLUDE } from '../hand/wd-exclude.mjs';
import { TV_EXCLUDE_LABELS, TV_EXCLUDE_IDS, TITLE_FIX, NAME_FIX, DISSOLVED, TRANSCONTINENTAL, US_AMBIGUOUS, COMPOSERS, EVERYDAY_ELEMENTS, CC_EXCLUDE_LABELS,
  INVENTIONS_OK, STORIES_OK, SITES_OK, ISLANDS_OK, ATHLETES_OUT } from '../hand/oc7-exclude.mjs';

const both = q => [q, q.replace('WHERE {', 'WHERE { hint:Query hint:optimizer "None" .')];
/** an answer OC6 asked + cached (parts/20 + 30 run first) — read from its file, never asked again under OC6's name */
const oc6 = n => JSON.parse(readFileSync(join(HERE, 'cache', 'wd', `${n}.json`), 'utf8')).rows;
const cached = n => { try { return oc6(n); } catch { return []; } };
const lab = (v, n) => `?${v} rdfs:label ?${n} . FILTER(lang(?${n}) = "en")`;
const groupBy = (rows, k) => { const m = new Map(); for (const r of rows) { if (!m.has(r[k])) m.set(r[k], []); m.get(r[k]).push(r); } return m; };
const single = (rows, field) => { const vs = [...new Set(rows.map(r => r[field]))]; return vs.length === 1 ? rows[0] : null; };
const CONT = { Q46: 'Europe', Q48: 'Asia', Q15: 'Africa', Q49: 'North America', Q18: 'South America', Q55643: 'Oceania', Q538: 'Oceania' };
const THE = new Set(['United States', 'United Kingdom', 'Netherlands', 'Philippines', 'Bahamas', 'Gambia', 'Dominican Republic', 'Czech Republic',
  'Central African Republic', 'Maldives', 'Marshall Islands', 'Solomon Islands', 'United Arab Emirates', 'Comoros', 'Seychelles',
  'Republic of the Congo', 'Democratic Republic of the Congo', 'Vatican City', 'Ivory Coast']);
const fixName = n => NAME_FIX[n] || n;
const the = n => { n = fixName(n); return /^The /.test(n) ? n.replace(/^The /, 'the ') : THE.has(n) ? `the ${n}` : n; };
const The = n => { n = fixName(n); return THE.has(n) ? `The ${n}` : n; };
const FILM_OK = 'VALUES ?rating { wd:Q18665330 wd:Q18665334 wd:Q18665339 wd:Q29841078 } ?item wdt:P1657 ?rating . MINUS { ?item wdt:P1657 wd:Q18665344 . } MINUS { ?item wdt:P1657 wd:Q18665349 . }';
const GAME_OK = 'VALUES ?esrb { wd:Q14864328 wd:Q14864329 wd:Q14864330 wd:Q14864334 wd:Q14864327 } ?item wdt:P852 ?esrb . MINUS { ?item wdt:P852 wd:Q14864331 . } MINUS { ?item wdt:P852 wd:Q14864332 . }';
const title = t => TITLE_FIX[t] || t;
const name = n => NAME_FIX[n] || n;
const okLabel = s => s && s.length <= A_MAX && !/\bQ\d+\b/.test(s) && !/[()]/.test(s);
// each template's difficulty profile: [share EASY, share MEDIUM] by fame rank (the rest HARD)
const PROFILE = {
  capital: [0.4, 0.4], 'capital-of': [0.35, 0.4], continent: [0.5, 0.35], 'state-capital': [0.3, 0.45], 'city-country': [0.35, 0.4],
  'mountain-country': [0.25, 0.45], 'park-state': [0.25, 0.45], 'city-state': [0.4, 0.4], author: [0.35, 0.4], director: [0.3, 0.45],
  painter: [0.35, 0.4], album: [0.2, 0.45], composer: [0.3, 0.45], symbol: [0.3, 0.4], team: [0.6, 0.3], olympics: [0.2, 0.45],
  'cup-host': [0.25, 0.45], 'cup-winner': [0.25, 0.45], animal: [0.55, 0.35], compare: [0.3, 0.45], language: [0.4, 0.4], decade: [0.2, 0.45],
  developer: [0.3, 0.45], band: [0.25, 0.45], athlete: [0.45, 0.4], instrument: [0.35, 0.45], president: [0.3, 0.45], 'site-country': [0.35, 0.4], 'island-country': [0.3, 0.45], character: [0.35, 0.4], inventor: [0.3, 0.45],
};
export const TV_TEMPLATE_CAP = 220;
const SITES_OFF = true;

export default async function wikidataTrivia(ctx) {
  const wd = (name, q) => wdRaw(name, q).catch(e => { ctx.log.push(`SKIPPED trivia query ${name}: ${e.message}`); return []; });
  const rand = seeded('oc7-tv');
  const pick = (list, n) => shuffled(rand, list).slice(0, n);
  const out = new Map();   // template → [{ …row, sl }]
  const add = (tpl, cat, ids, q, a, wrong, sl, extra = {}) => {
    if (!q || q.length > Q_MAX || !okLabel(a) || wrong.length !== 3 || !wrong.every(okLabel)) return false;
    const all = [a, ...wrong];
    if (all.some((x, i) => all.some((y, j) => j > i && aliasOf(x, y)))) return false;
    if (ids.some(x => TF_EXCLUDE.includes(x) || TV_EXCLUDE_IDS.includes(x)) || TV_EXCLUDE_LABELS.includes(a)) return false;
    if (!out.has(tpl)) out.set(tpl, []);
    out.get(tpl).push({ id: `t-${tpl}-${ids.join('-')}`, cat, q, a, w: wrong, src: ids.join(' '), sl: sl || 0, ...extra });
    return true;
  };
  /** three wrong answers from the same class, the nearest in fame first (a little shuffle among the nearest eight) — never the right one */
  const near = (pool, item, n = 3, keyOf = x => x.label, avoid = []) => {
    const ok = pool.filter(x => x.q !== item.q && keyOf(x) !== keyOf(item) && !avoid.includes(keyOf(x)) && !aliasOf(keyOf(x), keyOf(item)));
    const byFame = ok.sort((a, b) => Math.abs((a.sl || 0) - (item.sl || 0)) - Math.abs((b.sl || 0) - (item.sl || 0)));
    const got = [];
    for (const x of shuffled(rand, byFame.slice(0, 8)).concat(byFame.slice(8))) {
      if (got.length >= n) break;
      if (!got.some(g => aliasOf(keyOf(g), keyOf(x)))) got.push(x);
    }
    return got.length === n ? got.map(keyOf) : null;
  };
  const oneWay = q => parseInt(hash36(`oc7-dir:${q}`), 36) % 2 === 0;

  // ---------------------------------------------------------------- COUNTRIES: the capital (or the country from its capital) · the continent
  const caps = oc6('tf-capitals');
  const conts = oc6('tf-continents');
  const contOf = new Map();
  for (const [q, rs] of groupBy(conts, 'item')) { const r = single(rs, 'c'); if (r && CONT[r.c]) contOf.set(q, CONT[r.c]); }
  const countries = [];
  for (const [q, rs] of groupBy(caps, 'item')) {
    const c = single(rs, 'cap');
    if (!c || c.sl < 120 || !contOf.has(q) || c.capl === c.label || DISSOLVED.includes(c.label) || DISSOLVED.includes(c.capl)) continue;
    countries.push({ q, label: c.label, cap: c.cap, capl: c.capl, sl: c.sl, cont: contOf.get(q) });
  }
  for (const c of countries) {
    const same = countries.filter(x => x.cont === c.cont);
    if (oneWay(c.q)) {
      const w = near(same.map(x => ({ q: x.q, label: x.capl, sl: x.sl })), { q: c.q, label: c.capl, sl: c.sl });
      if (w) add('capital', 'geography', [c.q, c.cap], `What is the capital of ${the(c.label)}?`, c.capl, w, c.sl);
    } else {
      const w = near(same, c, 3, x => The(x.label));
      if (w) add('capital-of', 'geography', [c.q, c.cap], `${c.capl} is the capital of which country?`, The(c.label), w, c.sl);
    }
  }
  // the continent — one continent only (a country on two = out); Oceania's countries left out ("Australia" or "Oceania" — two answers)
  const CONTS = ['Africa', 'Asia', 'Europe', 'North America', 'South America'];
  for (const [q, rs] of groupBy(conts, 'item')) {
    const r = single(rs, 'c');
    if (!r || !CONT[r.c] || CONT[r.c] === 'Oceania' || r.sl < 120 || DISSOLVED.includes(r.label) || TRANSCONTINENTAL.includes(r.label)) continue;
    const a = CONT[r.c];
    add('continent', 'geography', [q], `On which continent is ${the(r.label)}?`, a, pick(CONTS.filter(x => x !== a), 3), r.sl);
  }

  // ---------------------------------------------------------------- U.S. STATES: the capital (the big city that ISN'T it — the classic trap)
  const st = await wd('tv-state-capitals', `SELECT ?item ?label ?cap ?capl ?sl WHERE { ?item wdt:P31 wd:Q35657 ; wdt:P36 ?cap ; wikibase:sitelinks ?sl . ${lab('item', 'label')} ${lab('cap', 'capl')} }`);
  const bigUS = await wd('tv-us-cities', both(`SELECT ?city ?cityl ?s ?sl WHERE { ?city wdt:P31 wd:Q1093829 ; wikibase:sitelinks ?sl . FILTER(?sl >= 45)
    ?city wdt:P131 ?co . ?co wdt:P131* ?s . ?s wdt:P31 wd:Q35657 . ${lab('city', 'cityl')} }`));
  const citiesIn = groupBy(bigUS, 's');
  const stateCaps = [...groupBy(st, 'item')].map(([q, rs]) => single(rs, 'cap')).filter(Boolean);
  for (const s of stateCaps) {
    const traps = [...new Map((citiesIn.get(s.item) || []).filter(c => c.city !== s.cap && c.cityl !== s.capl).map(c => [c.city, c])).values()]
      .sort((a, b) => b.sl - a.sl).map(c => c.cityl.replace(/,.*$/, '')).filter(okLabel);
    const others = stateCaps.filter(x => x.item !== s.item).map(x => ({ q: x.item, label: x.capl, sl: x.sl }));
    const w = [...new Set(traps)].slice(0, 2);
    const fill = near(others, { q: s.item, label: s.capl, sl: s.sl }, 3 - w.length, x => x.label, w);
    if (fill) add('state-capital', 'geography', [s.item, s.cap], `What is the capital of ${s.label === 'Washington' ? 'the state of Washington' : s.label}?`, s.capl, [...w, ...fill], s.sl);
  }

  // ---------------------------------------------------------------- WHERE IS IT: a big city → its country · a peak → its country (one country)
  const neighbours = groupBy(oc6('tf-neighbours'), 'a');
  const countryName = new Map(countries.map(c => [c.q, c.label]));
  for (const r of caps) if (!countryName.has(r.item)) countryName.set(r.item, r.label);
  const nb = (q, extra = []) => {
    const n = (neighbours.get(q) || []).map(r => fixName(r.bl)).filter(x => x !== fixName(countryName.get(q)) && !DISSOLVED.includes(x));
    const pool = [...new Set([...n, ...extra])].filter(x => x !== countryName.get(q));
    return pool.length >= 3 ? pick(pool, 3).map(The) : null;
  };
  const sameCont = q => countries.filter(c => c.cont === contOf.get(q) && c.q !== q).sort((a, b) => b.sl - a.sl).slice(0, 12).map(c => fixName(c.label));
  const cities = oc6('tf-bigcities');
  const capIds = new Set(countries.map(c => c.cap).concat(caps.map(c => c.cap)));
  const cityRows = [...groupBy(cities, 'city')].map(([, rs]) => single(rs, 'item')).filter(r => r && !capIds.has(r.city));
  const cityCount = new Map();
  for (const r of cityRows) cityCount.set(r.cityl, (cityCount.get(r.cityl) || 0) + 1);
  for (const r of cityRows.sort((a, b) => b.csl - a.csl).slice(0, 220)) {
    if (cityCount.get(r.cityl) > 1 || r.cityl === countryName.get(r.item) || r.item === 'Q30') continue;
    const w = nb(r.item, sameCont(r.item));
    if (w) add('city-country', 'world', [r.city, r.item], `In which country is the city of ${r.cityl}?`, The(countryName.get(r.item) || ''), w, r.csl);
  }
  const peaks = oc6('tf-mountain-country');
  for (const [q, rs] of groupBy(peaks, 'item')) {
    const r = single(rs, 'c');
    if (!r || r.sl < 55 || (STAT_EXCLUDE['mountain-height'] || []).includes(r.label) || CC_EXCLUDE_LABELS.peak.includes(r.label) || ['Mount Pelée', 'Piton des Neiges'].includes(r.label)) continue;
    const w = nb(r.c, sameCont(r.c));
    if (w) add('mountain-country', 'geography', [q, r.c], `In which country is ${r.label}?`, The(r.cl), w, r.sl);
  }
  // a national park / a famous U.S. city → its state (one state; the wrong ones its neighbours)
  const stNb = groupBy(oc6('tf-state-neighbours'), 'a');
  const stName = new Map(st.map(s => [s.item, s.label]));
  const stWrong = s => { const n = [...new Set((stNb.get(s) || []).map(r => r.bl))]; return n.length >= 3 ? pick(n, 3) : null; };
  const parks = oc6('tf-park-state');
  for (const [q, rs] of groupBy(parks, 'item')) {
    const r = single(rs, 's');
    const w = r && stWrong(r.s);
    if (w) add('park-state', 'geography', [q, r.s], `In which state is ${r.label}?`, r.stl, w, 0);
  }
  const capCities = new Set(stateCaps.map(s => s.cap));
  const usCity = [...groupBy(bigUS, 'city')].map(([, rs]) => single(rs, 's')).filter(r => r && !capCities.has(r.city) && r.sl >= 90);
  const usCount = new Map();
  for (const r of usCity) usCount.set(r.cityl, (usCount.get(r.cityl) || 0) + 1);
  for (const r of usCity) {
    if (usCount.get(r.cityl) > 1 || r.cityl.includes(',') || US_AMBIGUOUS.includes(r.cityl) || (stName.get(r.s) && r.cityl.includes(stName.get(r.s)))) continue;
    const w = stWrong(r.s);
    if (w) add('city-state', 'geography', [r.city, r.s], `In which state is the city of ${r.cityl}?`, stName.get(r.s), w, r.sl);
  }

  // ---------------------------------------------------------------- WHO MADE IT: the maker of ANOTHER famous work of the same era
  const makers = async (tpl, cat, qname, def, ask, span = 30) => {
    const rows = await wd(qname, both(`SELECT ?item ?label ?by ?byl ?y ?sl WHERE { VALUES ?cls { ${def.cls.map(c => `wd:${c}`).join(' ')} } ?item wdt:P31 ?cls ;
      wikibase:sitelinks ?sl . FILTER(?sl >= ${def.minSl}) ${def.where || ''} ?item wdt:${def.prop} ?by . ${def.human === false ? '' : '?by wdt:P31 wd:Q5 .'}
      OPTIONAL { ?item wdt:${def.date} ?d . } BIND(YEAR(?d) AS ?y) ${lab('item', 'label')} ${lab('by', 'byl')} }`));
    const ex = [...(def.exclude || []), ...PEOPLE_EXCLUDE];
    const RELIGIOUS = /\b(Gospel|Bible|Quran|Qur'an|Epistle|Book of|Psalm|Torah|Talmud|Veda|Sutra|Upanishad|Madonna|Annunciation|Crucifixion|Christ|Saint|Virgin|Nativity|Adoration)\b/;
    const works = [];
    for (const [q, rs] of groupBy(rows, 'item')) {
      const r = single(rs, 'by');
      if (!r || ex.includes(r.label) || ex.includes(r.byl) || norm(r.label).includes(norm(r.byl)) || norm(r.byl).includes(norm(r.label)) || / [–—-] /.test(r.label) || (def.generic && def.generic.test(r.label)) || RELIGIOUS.test(r.label) || (def.only && !def.only.includes(r.byl)) || r.sl < (def.atLeast || 0)) continue;
      const ys = rs.map(x => x.y).filter(Number.isFinite);
      works.push({ q, label: title(r.label), by: r.by, byl: name(r.byl), y: ys.length ? Math.min(...ys) : null, sl: r.sl });
    }
    const people = [...new Map(works.map(w => [w.by, { q: w.by, label: w.byl, sl: Math.max(...works.filter(x => x.by === w.by).map(x => x.sl)), y: w.y, n: works.filter(x => x.by === w.by).length }])).values()]
      .filter(p => p.y != null && p.y >= (def.since || 0) && (p.n >= 2 || p.sl >= (def.famous || 0)));
    let n = 0;
    for (const w of works.sort((a, b) => b.sl - a.sl)) {
      if (n >= (def.keep || 200) || !okLabel(w.byl) || w.y == null || w.y < (def.since || 0)) continue;
      const era = people.filter(p => p.q !== w.by && Math.abs(p.y - w.y) <= span);
      const wr = near(era, { q: w.by, label: w.byl, sl: w.sl });
      if (wr && add(tpl, cat, [w.q, w.by], ask(w), w.byl, wr, w.sl)) n++;
    }
  };
  await makers('author', 'books', 'tv-authors', { cls: ['Q7725634', 'Q8261', 'Q47461344', 'Q571'], prop: 'P50', date: 'P577', minSl: 45, keep: 170,
    exclude: STAT_EXCLUDE['novel-year'], since: 1600, famous: 70 }, w => `Who wrote ${w.label}?`, 60);
  await makers('director', 'screen', 'tv-directors', { cls: ['Q11424', 'Q202866'], prop: 'P57', date: 'P577', minSl: 55, where: FILM_OK, keep: 220,
    exclude: STAT_EXCLUDE['film-year'], famous: 90 }, w => `Who directed the movie ${w.label}${w.y ? ` (${w.y})` : ''}?`, 20);
  await makers('painter', 'art', 'tv-painters', { cls: ['Q3305213'], prop: 'P170', date: 'P571', minSl: 35, keep: 90, exclude: STAT_EXCLUDE['painting-year'], atLeast: 38 },
    w => `Who painted ${w.label}?`, 120);
  await makers('composer', 'music', 'tv-composers2', { cls: ['Q105543609', 'Q1344'], prop: 'P86', date: 'P577', minSl: 30, keep: 90, only: COMPOSERS,
    generic: /^(Symphony|Piano|Concerto|Violin|Cello|Sonata|String|Mass|Requiem|Te Deum|Magnificat|Stabat|Prelude|Nocturne|Étude|Etude|Waltz|Ballade|Mazurka|Polonaise|Impromptu|Fugue|Overture|Suite|Cantata|Serenade|Rhapsody|Fantasia|Variations|Trio|Quartet|Quintet|Opus|No\.|Op\.|BWV|K\.)/ },
    w => `Who composed ${w.label}?`, 120);
  await makers('album', 'music', 'tv-albums', { cls: ['Q482994'], prop: 'P175', date: 'P577', minSl: 45, keep: 110, human: false, exclude: STAT_EXCLUDE['band-year'] },
    w => `Who released the album ${w.label}${w.y ? ` (${w.y})` : ''}?`, 15);
  // (DEVELOPER is out: a remaster's studio listed as the game's only developer — Age of Empires II — and a pool of studios nobody knows)
  if (false) await makers('developer', 'games', 'tv-developers', { cls: ['Q7889'], prop: 'P178', date: 'P577', minSl: 45, where: GAME_OK, keep: 90, human: false },
    w => `Which company developed the video game ${w.label}?`, 25);

  // ---------------------------------------------------------------- THE CHEMICAL SYMBOL (believable wrong ones: real symbols, the name's letters)
  const els = oc6('tf-elements');
  const syms = new Set(els.map(e => e.sym));
  for (const e of els.slice().sort((a, b) => b.sl - a.sl).filter(e => EVERYDAY_ELEMENTS.includes(e.label.toLowerCase()))) {
    const nm = e.label.toLowerCase();
    const guess = [nm.slice(0, 2), nm[0] + nm[2], nm[0] + nm[nm.length - 1]].map(s => s[0].toUpperCase() + s.slice(1)).filter(s => s !== e.sym && !syms.has(s));
    const real = [...syms].filter(s => s !== e.sym && (s[0] === e.sym[0] || s[0] === nm[0].toUpperCase()));
    const w = [...new Set([...pick(real, 2), ...guess])].slice(0, 3);
    if (w.length === 3) add('symbol', 'science', [e.item], `What is the chemical symbol for ${nm}?`, e.sym, w, e.sl);
  }

  // ---------------------------------------------------------------- SPORTS: the sport a famous team plays · Olympic hosts · World Cups
  const LEAGUE = { Q1215884: 'Football', Q155223: 'Basketball', Q1163715: 'Baseball', Q1215892: 'Ice hockey' };
  const teams = await wd('tv-teams2', `SELECT ?item ?label ?lg ?sl WHERE { VALUES ?lg { ${Object.keys(LEAGUE).map(l => `wd:${l}`).join(' ')} } ?item wdt:P118 ?lg ;
    wikibase:sitelinks ?sl . FILTER(?sl >= 25) MINUS { ?item wdt:P31 wd:Q5 . } MINUS { ?item wdt:P576 [] . } ${lab('item', 'label')} }`);
  for (const [q, rs] of groupBy(teams, 'item')) {
    const r = single(rs, 'lg');
    if (!r || r.sl < 25) continue;
    const a = LEAGUE[r.lg];
    add('team', 'sports', [q], `Which sport do the ${r.label} play?`, a, Object.values(LEAGUE).filter(x => x !== a), r.sl);
  }
  const games = [];   // (the Olympics are written: written/tv-sports.json — Wikidata keeps no one class for the editions)
  const og = [...groupBy(games, 'item')].map(([, rs]) => single(rs, 'city')).filter(Boolean);
  for (const g of og) {
    const kind = g.kind === 'Q159821' ? 'Summer' : 'Winter';
    const pool = og.filter(x => x.kind === g.kind && x.cityl !== g.cityl).map(x => ({ q: x.city, label: x.cityl, sl: Math.abs(x.y - g.y) }));
    const w = near(pool, { q: g.city, label: g.cityl, sl: 0 });
    if (w) add('olympics', 'sports', [g.item], `Which city hosted the ${g.y} ${kind} Olympics?`, g.cityl, w, 200 - Math.abs(2000 - g.y));
  }
  const cups = await wd('tv-worldcups2', `SELECT ?item ?y ?host ?hostl ?win ?winl WHERE { ?item wdt:P3450 wd:Q19317 ; rdfs:label ?il . FILTER(lang(?il) = "en")
    BIND(xsd:integer(SUBSTR(?il, 1, 4)) AS ?y) FILTER(?y > 1925 && ?y < 2025)
    OPTIONAL { ?item wdt:P17 ?host . ${lab('host', 'hostl')} } OPTIONAL { ?item wdt:P1346 ?win . ?win wdt:P31 wd:Q6979593 . ${lab('win', 'winl')} } }`);
  const cupBy = [...groupBy(cups, 'item')].map(([q, rs]) => ({ q, y: rs[0].y, hosts: [...new Set(rs.map(r => r.hostl).filter(Boolean))], wins: [...new Set(rs.map(r => r.winl).filter(Boolean))] }));
  const hostPool = [...new Set(cupBy.flatMap(c => c.hosts.map(h => (h === 'United Kingdom' ? 'England' : h))))], winPool = [...new Set(cupBy.flatMap(c => c.wins))];
  for (const c of cupBy) {
    c.hosts = c.hosts.map(h => (h === 'United Kingdom' ? 'England' : h));
    if (c.hosts.length === 1) add('cup-host', 'sports', [c.q], `Which country hosted the ${c.y} FIFA World Cup?`, The(c.hosts[0]), pick(hostPool.filter(h => h !== c.hosts[0]), 3).map(The), 150 - Math.abs(2000 - c.y));
    const wn = c.wins.map(w => w.replace(/ national (association )?football team$/, '').replace(/ men's$/, ''));
    if (wn.length === 1 && !/team/.test(wn[0])) add('cup-winner', 'sports', [c.q], `Which country won the ${c.y} FIFA World Cup?`, wn[0],
      pick(winPool.map(w => w.replace(/ national (association )?football team$/, '').replace(/ men's$/, '')).filter(h => h !== wn[0]), 3), 150 - Math.abs(2000 - c.y));
  }

  // ---------------------------------------------------------------- ANIMALS: what kind of animal (a bird is never offered "reptile" — or the other way)
  const KIND = { Q7377: 'A mammal', Q5113: 'A bird', Q10811: 'A reptile', Q10908: 'An amphibian', Q1390: 'An insect', Q127282: 'A fish', Q25371: 'A fish' };
  const an = [];      // (the taxonomy query times out — P171+ over every species: the animal kinds are written in written/tv-animals.json)
  const ORDER = ['A bird', 'A mammal', 'An amphibian', 'A fish', 'An insect', 'A reptile'];
  const ALL = ['A mammal', 'A bird', 'A reptile', 'An amphibian', 'A fish', 'An insect'];
  for (const [q, rs] of groupBy(an, 'item')) {
    const ks = [...new Set(rs.map(r => KIND[r.k]))];
    const a = ORDER.find(k => ks.includes(k));
    const r = rs[0];
    if (!a || (ks.length > 1 && !(ks.includes('A bird') && ks.length === 2 && ks.includes('A reptile'))) || !/^[a-z][a-z' -]+$/.test(r.label)) continue;
    const no = { 'A bird': ['A reptile'], 'A reptile': ['A bird'] }[a] || [];
    const w = pick(ALL.filter(x => x !== a && !no.includes(x)), 3);
    const art = /^[aeiou]/.test(r.label) ? 'an' : 'a';
    add('animal', 'animals', [q], `What kind of animal is ${art} ${r.label}?`, a, w, r.sl);
  }

  // ---------------------------------------------------------------- WHICH OF THESE IS THE …: four of one stat, clearly apart (pairwise ≥ 1.25×)
  const W = ctx.wd || {};
  const LFIX = { Titicaca: 'Lake Titicaca', 'Cotopaxi volcano': 'Cotopaxi', 'Bali Island': 'Bali', 'Jeju Island': 'Jeju' };
  const compare = (stat, what, ask, cat, n, fixLabel = x => x, exKey = null) => {
    const no = new Set(((exKey && CC_EXCLUDE_LABELS[exKey]) || []).map(s => s.toLowerCase()));
    const items = (W[stat] || []).filter(x => x.v > 0 && !no.has(x.label.toLowerCase()) && !DISSOLVED.includes(x.label)).map(x => ({ ...x, label: LFIX[x.label] || x.label }))
      .filter(x => okLabel(fixLabel(x.label))).sort((a, b) => b.sl - a.sl).slice(0, 80);
    // each set's WINNER once per stat (the same question with the same answer twice is a duplicate — the build drops it: OC7 Group 4)
    let made = 0;
    const won = new Set();
    for (let tries = 0; tries < n * 30 && made < n; tries++) {
      const four = [];
      for (const x of shuffled(rand, items)) {
        if (four.length === 4) break;
        if (four.every(y => Math.max(x.v, y.v) / Math.min(x.v, y.v) >= 1.25)) four.push(x);
      }
      if (four.length < 4) break;
      const best = four.reduce((m, x) => (x.v > m.v ? x : m));
      if (won.has(best.q)) continue;
      const ids = four.map(x => x.q).sort();
      const key = `t-compare-${stat}-${ids.join('-')}`;
      if ((out.get('compare') || []).some(r => r.id === key)) continue;
      if (add('compare', cat, [stat, ...ids], ask, fixLabel(best.label), four.filter(x => x !== best).map(x => fixLabel(x.label)), Math.min(...four.map(x => x.sl)), { same: true })) { made++; won.add(best.q); }
    }
    void what;
  };
  compare('mountain-height', 'peak', 'Which of these mountains is the highest?', 'geography', 18, x => x, 'peak');
  compare('country-area', 'country', 'Which of these countries is the largest by area?', 'geography', 40, The, 'country-area');
  compare('island-area', 'island', 'Which of these islands is the largest?', 'geography', 12, x => x, 'island-area');
  compare('skyscraper-height', 'building', 'Which of these skyscrapers is the tallest?', 'world', 10, x => x, 'tall');
  compare('state-area', 'state', 'Which of these U.S. states is the largest by area?', 'geography', 32);
  compare('state-pop', 'state', 'Which of these states had the most people in 2020?', 'geography', 32);
  compare('lake-area', 'lake', 'Which of these lakes is the largest?', 'geography', 8, x => x, 'lake-area');
  compare('uscity-pop', 'city', 'Which of these U.S. cities had the most people in 2020?', 'geography', 25, x => x, null);
  compare('park-area', 'park', 'Which of these national parks is the largest?', 'geography', 15, x => x, 'park-area');

  // ---------------------------------------------------------------- THE OFFICIAL LANGUAGE (one official language only; the English-speaking big
  // four left out — the U.S. has no official language in law, two careful people could argue the U.K.'s)
  const langs = await wd('tv-languages', both(`SELECT ?item ?label ?l ?ll ?sl WHERE { ?item wdt:P463 wd:Q1065 ; wdt:P37 ?l ; wikibase:sitelinks ?sl . FILTER(?sl >= 150)
    ${lab('item', 'label')} ${lab('l', 'll')} }`));
  const BIG = ['Spanish', 'French', 'Portuguese', 'English', 'Arabic', 'German', 'Russian', 'Italian', 'Dutch', 'Turkish', 'Japanese', 'Korean', 'Persian', 'Greek', 'Polish', 'Swedish'];
  for (const [q, rs] of groupBy(langs, 'item')) {
    const r = single(rs, 'l');
    if (!r || ['Q30', 'Q145', 'Q408', 'Q664', 'Q16'].includes(q)) continue;
    const a = r.ll.replace(/ language$/, '');
    if (!okLabel(a) || !BIG.includes(a)) continue;
    add('language', 'world', [q, r.l], `What is the official language of ${the(r.label)}?`, a, pick(BIG.filter(x => x !== a), 3), r.sl);
  }

  // ---------------------------------------------------------------- THE DECADE (a year that ends in 9 or 0 is out — a release a year apart
  // across two countries would move it)
  const decadeOf = y => `The ${Math.floor(y / 10) * 10}s`;
  const DEC = [['game-year', 'games', x => `In which decade did the video game ${x} first come out?`], ['console-year', 'games', x => `In which decade did the ${x} first come out?`],
    ['cartoon-year', 'screen', x => `In which decade did the cartoon ${x} first air?`], ['boardgame-year', 'games', x => `In which decade did the board game ${x} first come out?`],
    ['themepark-year', 'world', x => `In which decade did ${x} open?`], ['car-year', 'inventions', x => `In which decade did the ${x} first come out?`],
];   // (aircraft out: the famous ones are warplanes)
  for (const [stat, cat, ask] of DEC) {
    for (const x of (W[stat] || []).slice().sort((a, b) => b.sl - a.sl).slice(0, 60)) {
      if (!(x.v >= 1800) || x.v > 2024 || x.v % 10 === 9 || x.v % 10 === 0) continue;
      const d = Math.floor(x.v / 10) * 10;
      const w = shuffled(rand, [d - 20, d - 10, d + 10, d + 20, d + 30].filter(y => y <= 2020 && y >= 1800)).slice(0, 3).map(y => `The ${y}s`);
      add('decade', cat, [x.q], ask(x.label), decadeOf(x.v), w, x.sl);
    }
  }

  // ---------------------------------------------------------------- BANDS: where they come from (one country of origin)
  const bands = await wd('tv-bands', both(`SELECT ?item ?label ?c ?cl ?sl WHERE { VALUES ?cls { wd:Q215380 wd:Q5741069 } ?item wdt:P31 ?cls ; wikibase:sitelinks ?sl .
    FILTER(?sl >= 55) ?item wdt:P495 ?c . ${lab('item', 'label')} ${lab('c', 'cl')} }`));
  const bandEx = STAT_EXCLUDE['band-year'] || [];
  const BAND_COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Sweden', 'Ireland', 'Germany', 'Japan', 'South Korea', 'Norway', 'France'];
  for (const [q, rs] of groupBy(bands, 'item')) {
    const r = single(rs, 'c');
    if (!r || bandEx.includes(r.label) || bandEx.includes(q) || !BAND_COUNTRIES.includes(r.cl) || ['The Pussycat Dolls', 'Sex Pistols', 'Dead Kennedys', 'Guns N\' Roses', 'Rage Against the Machine', 'Slayer', 'Cannibal Corpse', 'Bloodhound Gang'].includes(r.label)) continue;
    add('band', 'music', [q, r.c], `Which country does the band ${fixName(r.label)} come from?`, The(r.cl), pick(BAND_COUNTRIES.filter(x => x !== r.cl), 3).map(The), r.sl);
  }

  // ---------------------------------------------------------------- WHERE IS IT (2): a World Heritage Site → its country · an island → its country
  const sites = await wd('tv-heritage', both(`SELECT ?item ?label ?c ?cl ?sl WHERE { ?item wdt:P1435 wd:Q9259 ; wikibase:sitelinks ?sl . FILTER(?sl >= 70)
    ?item wdt:P17 ?c . ?c wdt:P463 wd:Q1065 . ${lab('item', 'label')} ${lab('c', 'cl')} }`));
  const SITE_OUT = /\b(Church|Cathedral|Mosque|Temple|Abbey|Monastery|Basilica|Chapel|Shrine|Holocaust|Concentration|Camp|Prison|Memorial|Cemetery|Tomb|Necropolis|Battle|Historic Centre|Historic Center|City of|Old Town|Old City)\b/i;
  for (const [q, rs] of groupBy(sites, 'item')) {
    const r = single(rs, 'c');
    // (OFF: the written world file asks these landmarks itself — one fact, one question)
    if (SITES_OFF || !r || SITE_OUT.test(r.label) || !SITES_OK.includes(r.label) || r.c === 'Q30' || DISSOLVED.includes(r.cl)) continue;
    const w = nb(r.c, sameCont(r.c));
    if (w) add('site-country', 'world', [q, r.c], `In which country is ${/^(The |Mount |Lake )/.test(r.label) ? r.label.replace(/^The /, 'the ') : r.label}?`, The(r.cl), w, r.sl);
  }
  const isl = await wd('tv-islands', both(`SELECT ?item ?label ?c ?cl ?sl WHERE { ?item wdt:P31 wd:Q23442 ; wikibase:sitelinks ?sl . FILTER(?sl >= 75)
    ?item wdt:P17 ?c . ?c wdt:P463 wd:Q1065 . ${lab('item', 'label')} ${lab('c', 'cl')} }`));
  for (const [q, rs] of groupBy(isl, 'item')) {
    const r = single(rs, 'c');
    if (!r || r.label === r.cl || !ISLANDS_OK.includes(r.label) || r.c === 'Q30' || DISSOLVED.includes(r.cl)) continue;
    const w = nb(r.c, sameCont(r.c));
    const nm = /^(North|South) Island$/.test(r.label) ? `New Zealand's ${r.label}` : /Island$|^Isle /.test(r.label) ? (/^Isle /.test(r.label) ? `the ${r.label}` : r.label) : `the island of ${r.label}`;
    if (w && !/^New Zealand/.test(nm)) add('island-country', 'geography', [q, r.c], `Which country does ${nm} belong to?`, The(r.cl), w, r.sl);
  }

  // ---------------------------------------------------------------- STORIES: a famous character → the story they come from (one work only)
  const chars = await wd('tv-characters', both(`SELECT ?item ?label ?w ?wl ?sl ?wsl WHERE { VALUES ?cls { wd:Q95074 wd:Q15632617 wd:Q15773347 wd:Q15711870 wd:Q4271324 }
    ?item wdt:P31 ?cls ; wikibase:sitelinks ?sl . FILTER(?sl >= 35) ?item wdt:P1441 ?w . ?w wikibase:sitelinks ?wsl . FILTER(?wsl >= 40)
    ${lab('item', 'label')} ${lab('w', 'wl')} }`));
  const works = new Map();
  for (const r of chars) works.set(r.w, { q: r.w, label: title(r.wl), sl: r.wsl });
  for (const [q, rs] of groupBy(chars, 'item')) {
    const r = single(rs, 'w');
    if (!r) continue;
    const giveaway = norm(r.wl).split(' ').filter(x => x.length >= 4).some(x => norm(r.label).split(' ').some(y => y.startsWith(x.replace(/s$/, ''))));
    if (!r || !STORIES_OK.includes(r.wl) || giveaway || norm(r.wl).includes(norm(r.label)) || norm(r.label).includes(norm(r.wl)) || /[()]/.test(r.label)) continue;
    const pool = [...works.values()].filter(x => x.q !== r.w && STORIES_OK.includes(x.label));
    const wr = near(pool, { q: r.w, label: title(r.wl), sl: r.wsl });
    if (wr) add('character', 'books', [q, r.w], `Which story features the character ${r.label}?`, title(r.wl), wr, r.sl);
  }

  // ---------------------------------------------------------------- THE DECADE (2): a famous movie / book — the ones the director + author
  // questions don't ask about (one fact, one question)
  const askedWorks = new Set([...(out.get('director') || []), ...(out.get('author') || [])].map(r => r.src.split(' ')[0]));
  const decadeRows = (rows, kind) => {
    const by = groupBy(rows.filter(r => Number.isFinite(r.y)), 'item');
    const list = [];
    for (const [q, rs] of by) {
      const ys = [...new Set(rs.map(r => r.y))];
      if (askedWorks.has(q) || Math.max(...ys) - Math.min(...ys) > 1) continue;
      const y = Math.min(...ys);
      if (y % 10 === 9 || y % 10 === 0 || y < 1900 || y > 2024 || / [–—-] /.test(rs[0].label) || /[()]/.test(rs[0].label)) continue;
      list.push({ q, label: title(rs[0].label), y, sl: rs[0].sl });
    }
    return list.sort((a, b) => b.sl - a.sl).slice(0, 110).map(x => ({ ...x, kind }));
  };
  for (const x of [...decadeRows(cached('tv-directors'), 'movie'), ...decadeRows(cached('tv-authors'), 'book')]) {
    const d = Math.floor(x.y / 10) * 10;
    const w = shuffled(rand, [d - 20, d - 10, d + 10, d + 20].filter(y => y <= 2020 && y >= 1890)).slice(0, 3).map(y => `The ${y}s`);
    add('decade', x.kind === 'movie' ? 'screen' : 'books', [x.q], x.kind === 'movie' ? `In which decade did the movie ${x.label} come out?` : `In which decade was the book ${x.label} first published?`, `The ${d}s`, w, x.sl);
  }

  // ---------------------------------------------------------------- INVENTIONS: who invented it (one inventor on record — read by hand)
  const inv = await wd('tv-inventions', both(`SELECT ?item ?label ?by ?byl ?sl WHERE { ?item wdt:P61 ?by ; wikibase:sitelinks ?sl . FILTER(?sl >= 70) ?by wdt:P31 wd:Q5 .
    MINUS { ?item wdt:P31 wd:Q11344 . } MINUS { ?item wdt:P31 wd:Q523 . } MINUS { ?item wdt:P31 wd:Q3863 . } ${lab('item', 'label')} ${lab('by', 'byl')} }`));
  const inventors = [...new Map(inv.map(r => [r.by, { q: r.by, label: r.byl, sl: r.sl }])).values()];
  for (const [q, rs] of groupBy(inv, 'item')) {
    const r = single(rs, 'by');
    if (!r || !INVENTIONS_OK.includes(r.label) || TV_EXCLUDE_LABELS.includes(r.label)) continue;
    const wr = near(inventors, { q: r.by, label: r.byl, sl: r.sl });
    if (wr) add('inventor', 'inventions', [q, r.by], `Who is credited with inventing the ${r.label}?`, r.byl, wr, r.sl);
  }

  // ---------------------------------------------------------------- PEOPLE: a famous athlete's sport · a famous musician's instrument
  const SPORT = { Q2736: 'Soccer', Q5372: 'Basketball', Q5369: 'Baseball', Q41323: 'Football', Q41466: 'Ice hockey', Q847: 'Tennis', Q5377: 'Golf',
    Q32112: 'Boxing', Q542: 'Track and field', Q31920: 'Swimming', Q43450: 'Gymnastics', Q3609: 'Cycling', Q5378: 'Cricket', Q5849: 'Rugby' };
  const ath = await wd('tv-athletes', both(`SELECT ?item ?label ?s ?sl WHERE { VALUES ?s { ${Object.keys(SPORT).map(s => `wd:${s}`).join(' ')} } ?item wdt:P641 ?s ;
    wdt:P31 wd:Q5 ; wikibase:sitelinks ?sl . FILTER(?sl >= 110) ${lab('item', 'label')} }`));
  const allAth = [...groupBy(ath, 'item')];
  for (const [q, rs] of allAth) {
    const r = single(rs, 's');
    if (!r || ATHLETES_OUT.includes(r.label) || PEOPLE_EXCLUDE.includes(r.label)) continue;
    const a = SPORT[r.s];
    const pool = Object.values(SPORT).filter(x => x !== a);
    add('athlete', 'sports', [q], `Which sport is ${r.label} famous for?`, a, pick(pool, 3), r.sl);
  }
  const INSTR = { Q6607: 'Guitar', Q5994: 'Piano', Q8355: 'Violin', Q11404: 'Drums', Q8338: 'Trumpet', Q9798: 'Saxophone', Q8371: 'Cello', Q46185: 'Bass guitar' };
  const mus = await wd('tv-instruments', both(`SELECT ?item ?label ?i ?sl WHERE { VALUES ?i { ${Object.keys(INSTR).map(s => `wd:${s}`).join(' ')} } ?item wdt:P1303 ?i ;
    wdt:P31 wd:Q5 ; wikibase:sitelinks ?sl . FILTER(?sl >= 90) ${lab('item', 'label')} }`));
  const allInstr = await wd('tv-instruments-all', both(`SELECT ?item (COUNT(DISTINCT ?i) AS ?n) WHERE { ?item wdt:P1303 ?i ; wdt:P31 wd:Q5 ; wikibase:sitelinks ?sl . FILTER(?sl >= 90) } GROUP BY ?item`));
  const nInstr = new Map(allInstr.map(r => [r.item, Number(r.n)]));
  for (const [q, rs] of groupBy(mus, 'item')) {
    const r = single(rs, 'i');
    if (!r || nInstr.get(q) !== 1 || PEOPLE_EXCLUDE.includes(r.label)) continue;
    const a = INSTR[r.i];
    add('instrument', 'music', [q], `Which instrument is ${r.label} famous for playing?`, a, pick(Object.values(INSTR).filter(x => x !== a && !aliasOf(x, a)), 3), r.sl);
  }

  // ---------------------------------------------------------------- U.S. PRESIDENTS: who took office in a year (the ones before 1990 — history)
  const pres = [...groupBy(oc6('president-start'), 'item')].map(([q, rs]) => ({ q, label: rs[0].label, y: Math.min(...rs.map(r => r.v)), sl: rs[0].sl }))
    .filter(p => p.y < 1990 && !/ Jr\.$/.test(p.label));
  for (const p of pres) {
    const others = pres.filter(o => o.q !== p.q).sort((a, b) => Math.abs(a.y - p.y) - Math.abs(b.y - p.y)).slice(0, 6);
    if (others.length < 3) continue;
    add('president', 'us', [p.q], `Who became president of the United States in ${p.y}?`, p.label, pick(others, 3).map(o => o.label), p.sl);
  }

  // ---------------------------------------------------------------- the difficulty (fame rank inside each template) + THE TEMPLATE CAP
  let total = 0;
  const per = [];
  for (const [tpl, rows] of out) {
    const [e, m] = PROFILE[tpl] || [0.3, 0.45];
    const sorted = rows.slice().sort((a, b) => b.sl - a.sl || a.id.localeCompare(b.id)).slice(0, TV_TEMPLATE_CAP);
    sorted.forEach((r, i) => {
      const f = i / Math.max(1, sorted.length);
      const { sl, ...row } = r;
      void sl;
      ctx.tv.push({ ...row, d: f < e ? 'easy' : f < e + m ? 'medium' : 'hard' });
    });
    total += sorted.length;
    per.push(`${tpl} ${sorted.length}`);
  }
  ctx.log.push(`TRIVIA (Wikidata): ${total} questions from ${out.size} templates — ${per.join(' · ')}`);
}
