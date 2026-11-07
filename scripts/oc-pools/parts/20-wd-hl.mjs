// OVERCLOCK POOLS — HIGHER OR LOWER from WIKIDATA (CC0). Every item = a Wikidata entity (its Q-id is its id + its source); values METRIC as
// Wikidata normalizes them (m, km², kelvin → °C …); the screen shows US units (units.js). Lasting stats only: no box office, no follower counts,
// no records that keep changing; populations rounded (the 1.2× rule — 1.3× / 1.5× where a count drifts — absorbs a new estimate).
// Fame = sitelinks (how many Wikipedias have the article): each stat keeps its best-known items.
import { numeric, plain, yearOf, top, labelled } from '../wdq.mjs';
import { wd } from '../wikidata.mjs';
import { STAT_EXCLUDE, cleanLabel, PEOPLE_EXCLUDE } from '../hand/wd-exclude.mjs';
import { hash36 } from '../lib.mjs';
import { CC_EXCLUDE_LABELS } from '../hand/oc7-exclude.mjs';
import { OC8_CUT, OC8_ONLY, OC8_OUT, OC8_KEEP, FAMOUS_COUNTRIES } from '../hand/oc8-exclude.mjs';

// OC8 (THE FABLE REVIEW) — THE FAME FILTER, TIGHTENED (hand/oc8-exclude.mjs): OC7's by-hand OBSCURE lists (read for CLOSEST CALL) now apply to
// the same stats here too; the stats sitelinks can't rank keep ONLY the items Americans know; the rest keep a smaller top-n; the country stats
// only the countries a player knows by name; coasters + airplanes are cut
const OBSCURE_CC = { 'mountain-height': CC_EXCLUDE_LABELS.peak, 'skyscraper-height': CC_EXCLUDE_LABELS.tall, 'skyscraper-year': CC_EXCLUDE_LABELS.tall,
  'island-area': CC_EXCLUDE_LABELS['island-area'], 'lake-area': CC_EXCLUDE_LABELS['lake-area'], 'lake-depth': CC_EXCLUDE_LABELS['lake-depth'] };
const lc = s => String(s || '').toLowerCase();
function famous(id, items) {
  const label = x => [lc(x.label), lc(cleanLabel(id, x.label))];
  const out = new Set([...(OBSCURE_CC[id] || []), ...(OC8_OUT[id] || [])].map(lc));
  let list = items.filter(x => !label(x).some(l => out.has(l)));
  if (OC8_ONLY[id]) { const only = new Set(OC8_ONLY[id].map(lc)); list = list.filter(x => label(x).some(l => only.has(l))); }
  if (/^country-/.test(id)) { const ok = new Set(FAMOUS_COUNTRIES.map(lc)); list = list.filter(x => label(x).some(l => ok.has(l))); }
  return list;
}

// THE YEAR STATS FEED TWO CHALLENGES (OC6): each item goes to ONE of them — HIGHER OR LOWER or that subject's TIMELINE theme (a stable hash
// of its Q-id) — so a night never shows "Jaws" in both. [theme, ask] per year stat (the timeline's direction: EARLIEST → LATEST).
const TIMELINE = {
  'film-year': ['MOVIES', 'Put these movies in order of release'],
  'animated-year': ['ANIMATED MOVIES', 'Put these animated movies in order'],
  'novel-year': ['BOOKS', 'Put these books in order of publication'],
  'game-year': ['VIDEO GAMES', 'Put these games in order of release'],
  'console-year': ['GAME CONSOLES', 'Put these consoles in order of release'],
  'cartoon-year': ['CARTOONS', 'Put these shows in order of their first episode'],
  'painting-year': ['PAINTINGS', 'Put these paintings in the order they were made'],
  'company-year': ['BRANDS', 'Put these companies in order of founding'],
  'band-year': ['BANDS', 'Put these bands in the order they formed'],
  'park-year': ['NATIONAL PARKS', 'Put these parks in the order they were created'],
  'statehood': ['STATEHOOD', 'Put these states in the order they joined the U.S.'],
  'themepark-year': ['THEME PARKS', 'Put these parks in the order they opened'],
  'bridge-year': ['BRIDGES', 'Put these bridges in the order they opened'],
  'skyscraper-year': ['SKYSCRAPERS', 'Put these in the order they were finished'],
  'probe-year': ['SPACE PROBES', 'Put these probes in order of launch'],
  'born': ['BIRTHDAYS', 'Put these people in order of birth'],
  'boardgame-year': ['BOARD GAMES', 'Put these games in order of release'],
  'aircraft-year': ['AIRPLANES', 'Put these planes in order of first flight'],
  'coaster-year': ['ROLLER COASTERS', 'Put these rides in the order they opened'],
  'zoo-year': ['ZOOS', 'Put these zoos in the order they opened'],
  'stadium-year': ['STADIUMS', 'Put these stadiums in the order they opened'],
  'car-year': ['CARS', 'Put these cars in order of release'],
  'president-start': ['PRESIDENTS', 'Put these presidents in the order they took office'],
};
const toTimeline = q => parseInt(hash36(`oc6-tl:${q}`), 36) % 2 === 0;
// THE SIZE THEMES (TIMELINE orders more than years — the OC1–OC5 pools did too): ~a third of a quantity stat's items order by size there
const SIZE_TL = {
  'mountain-height': ['MOUNTAINS', 'Order these peaks by height', 'LOWEST → HIGHEST'],
  'skyscraper-height': ['SKYSCRAPERS', 'Order these by height', 'SHORTEST → TALLEST'],
  'river-length': ['RIVERS', 'Order these rivers by length', 'SHORTEST → LONGEST'],
  'bridge-length': ['BRIDGES', 'Order these bridges by length', 'SHORTEST → LONGEST'],
  'country-area': ['COUNTRY SIZE', 'Order these countries by area', 'SMALLEST → LARGEST'],
  'country-pop': ['POPULATION', 'Order these countries by population', 'FEWEST → MOST PEOPLE'],
  'state-area': ['STATE SIZE', 'Order these states by area', 'SMALLEST → LARGEST'],
  'state-pop': ['STATE POPULATION', 'Order these states by 2020 population', 'FEWEST → MOST PEOPLE'],
  'island-area': ['ISLANDS', 'Order these islands by area', 'SMALLEST → LARGEST'],
  'lake-area': ['LAKES', 'Order these lakes by area', 'SMALLEST → LARGEST'],
  'uscity-pop': ['U.S. CITIES', 'Order these cities by 2020 population', 'FEWEST → MOST PEOPLE'],
  'country-highpoint': ['HIGHEST POINTS', 'Order these countries by their highest point', 'LOWEST → HIGHEST'],
  'element-number': ['ATOMIC NUMBER', 'Order these elements by atomic number', 'LOWEST → HIGHEST'],
};
const toSizeTimeline = q => parseInt(hash36(`oc6-tls:${q}`), 36) % 3 === 0;

const UN = '?item wdt:P463 wd:Q1065 .';                 // a UN member state (no disputed states)
const FILM_OK = 'VALUES ?rating { wd:Q18665330 wd:Q18665334 wd:Q18665339 wd:Q29841078 } ?item wdt:P1657 ?rating . MINUS { ?item wdt:P1657 wd:Q18665344 . } MINUS { ?item wdt:P1657 wd:Q18665349 . }';
const GAME_OK = 'VALUES ?esrb { wd:Q14864328 wd:Q14864329 wd:Q14864330 wd:Q14864334 wd:Q14864327 } ?item wdt:P852 ?esrb . MINUS { ?item wdt:P852 wd:Q14864331 . } MINUS { ?item wdt:P852 wd:Q14864332 . }';
const DEAD = '?item wdt:P570 [] .';
const occ = list => `VALUES ?occ { ${list.map(x => `wd:${x}`).join(' ')} } ?item wdt:P106 ?occ . ${DEAD}`;

// [id, STAT, QUESTION, unit, win, how, def, keep (top n), gap?]
const STATS = [
  ['mountain-height', 'MOUNTAINS', 'WHICH PEAK IS HIGHER?', 'm', 'max', numeric, { cls: ['Q8502', 'Q8072'], prop: 'P2044', minSl: 40 }, 100],
  ['skyscraper-height', 'SKYSCRAPER HEIGHT', 'WHICH IS TALLER?', 'm', 'max', numeric, { cls: ['Q11303'], prop: 'P2048', minSl: 22, not: ['wdt:P576'] }, 80],
  ['tower-height', 'TOWERS', 'WHICH TOWER IS TALLER?', 'm', 'max', numeric, { cls: ['Q12518', 'Q11166728', 'Q1440476'], prop: 'P2048', minSl: 30, not: ['wdt:P576'] }, 50],
  ['river-length', 'RIVERS', 'WHICH RIVER IS LONGER?', 'km', 'max', numeric, { cls: ['Q4022'], prop: 'P2043', minSl: 45 }, 100, 1.3],
  ['bridge-length', 'BRIDGE LENGTH', 'WHICH BRIDGE IS LONGER?', 'm', 'max', numeric, { cls: ['Q12280', 'Q12570', 'Q158438', 'Q158218', 'Q537127', 'Q3397526'], prop: 'P2043', minSl: 15, not: ['wdt:P576'] }, 70],
  ['country-area', 'COUNTRY SIZE', 'WHICH COUNTRY IS BIGGER?', 'km2', 'max', numeric, { cls: ['Q3624078'], prop: 'P2046', minSl: 0, where: UN }, 180],
  ['country-pop', 'POPULATION', 'WHICH COUNTRY HAS MORE PEOPLE?', 'people', 'max', plain, { cls: ['Q3624078'], prop: 'P1082', minSl: 0, where: UN }, 180, 1.3],
  ['state-area', 'STATE SIZE', 'WHICH STATE IS BIGGER?', 'km2', 'max', numeric, { cls: ['Q35657'], prop: 'P2046', minSl: 0 }, 50],
  ['lake-area', 'LAKES', 'WHICH LAKE IS BIGGER?', 'km2', 'max', numeric, { cls: ['Q23397'], prop: 'P2046', minSl: 35 }, 70],
  ['lake-depth', 'LAKE DEPTH', 'WHICH LAKE IS DEEPER?', 'm', 'max', numeric, { cls: ['Q23397'], prop: 'P4511', minSl: 30 }, 45],
  ['island-area', 'ISLANDS', 'WHICH ISLAND IS BIGGER?', 'km2', 'max', numeric, { cls: ['Q23442'], prop: 'P2046', minSl: 60 }, 80],
  ['park-area', 'PARK SIZE', 'WHICH PARK IS BIGGER?', 'km2', 'max', numeric, { cls: ['Q34918903'], prop: 'P2046', minSl: 0 }, 63],
  ['coaster-height', 'COASTER HEIGHT', 'WHICH COASTER IS TALLER?', 'm', 'max', numeric, { cls: ['Q204832', 'Q2389789'], prop: 'P2048', minSl: 4, not: ['wdt:P576', 'wdt:P582'] }, 70],
  ['element-number', 'ATOMIC NUMBER', 'WHICH HAS THE HIGHER ATOMIC NUMBER?', '', 'max', plain, { cls: ['Q11344'], prop: 'P1086', minSl: 80 }, 90],
  ['element-melt', 'MELTING POINT', 'WHICH MELTS AT A HIGHER TEMPERATURE?', 'c', 'max', numeric, { cls: ['Q11344'], prop: 'P2101', minSl: 90 }, 60],
  ['element-boil', 'BOILING POINT', 'WHICH BOILS AT A HIGHER TEMPERATURE?', 'c', 'max', numeric, { cls: ['Q11344'], prop: 'P2102', minSl: 90 }, 60],
  // years — the earlier one "wins" (the screen asks LATER / EARLIER)
  ['film-year', 'MOVIES', 'WHICH CAME OUT FIRST?', 'year', 'min', yearOf, { cls: ['Q11424'], prop: 'P577', minSl: 60, where: FILM_OK }, 80],
  ['animated-year', 'ANIMATED MOVIES', 'WHICH CAME OUT FIRST?', 'year', 'min', yearOf, { cls: ['Q202866'], prop: 'P577', minSl: 40, where: FILM_OK }, 60],
  ['novel-year', 'BOOKS', 'WHICH BOOK CAME OUT FIRST?', 'year', 'min', yearOf, { cls: ['Q7725634', 'Q8261', 'Q47461344'], prop: 'P577', minSl: 40, where: '?item wdt:P7937 wd:Q8261 .' }, 60],
  ['game-year', 'VIDEO GAMES', 'WHICH GAME CAME OUT FIRST?', 'year', 'min', yearOf, { cls: ['Q7889'], prop: 'P577', minSl: 45, where: GAME_OK }, 70],
  ['console-year', 'GAME CONSOLES', 'WHICH CAME OUT FIRST?', 'year', 'min', yearOf, { cls: ['Q10929058', 'Q8076', 'Q941818'], prop: ['P577', 'P571'], minSl: 22, where: '?item wdt:P279* ?k . VALUES ?k { wd:Q8076 wd:Q941818 } .' }, 45],
  ['cartoon-year', 'CARTOONS', 'WHICH SHOW STARTED FIRST?', 'year', 'min', yearOf, { cls: ['Q117467246', 'Q581714'], prop: ['P580', 'P577'], minSl: 30 }, 55],
  ['painting-year', 'PAINTINGS', 'WHICH WAS PAINTED FIRST?', 'year', 'min', yearOf, { cls: ['Q3305213'], prop: 'P571', minSl: 30 }, 55],
  ['company-year', 'COMPANIES', 'WHICH COMPANY IS OLDER?', 'year', 'min', yearOf, { cls: ['Q4830453', 'Q6881511', 'Q891723'], prop: 'P571', minSl: 80, not: ['wdt:P576'] }, 70],
  ['band-year', 'BANDS', 'WHICH BAND FORMED FIRST?', 'year', 'min', yearOf, { cls: ['Q215380', 'Q5741069'], prop: 'P571', minSl: 70 }, 60],
  ['park-year', 'NATIONAL PARKS', 'WHICH PARK CAME FIRST?', 'year', 'min', yearOf, { cls: ['Q34918903'], prop: ['P1619', 'P571'], minSl: 0 }, 63],
  ['statehood', 'STATEHOOD', 'WHICH BECAME A STATE FIRST?', 'year', 'min', yearOf, { cls: ['Q35657'], prop: 'P571', minSl: 0 }, 50],
  ['themepark-year', 'THEME PARKS', 'WHICH OPENED FIRST?', 'year', 'min', yearOf, { cls: ['Q2416723'], prop: ['P1619', 'P571'], minSl: 18, not: ['wdt:P576'] }, 45],
  ['bridge-year', 'BRIDGES', 'WHICH OPENED FIRST?', 'year', 'min', yearOf, { cls: ['Q12280', 'Q12570', 'Q158438', 'Q158218', 'Q537127', 'Q3397526'], prop: ['P1619', 'P571'], minSl: 15, not: ['wdt:P576'] }, 40],
  ['skyscraper-year', 'SKYSCRAPERS', 'WHICH WAS FINISHED FIRST?', 'year', 'min', yearOf, { cls: ['Q11303'], prop: ['P1619', 'P571'], minSl: 22, not: ['wdt:P576'] }, 55],
  ['boardgame-year', 'BOARD GAMES', 'WHICH CAME OUT FIRST?', 'year', 'min', yearOf, { cls: ['Q131436'], prop: ['P571', 'P577'], minSl: 18 }, 60],
  ['aircraft-year', 'AIRPLANES', 'WHICH FLEW FIRST?', 'year', 'min', yearOf, { cls: ['Q15056995'], prop: 'P606', minSl: 30 }, 70],
  ['coaster-year', 'ROLLER COASTERS', 'WHICH OPENED FIRST?', 'year', 'min', yearOf, { cls: ['Q204832', 'Q2389789'], prop: 'P1619', minSl: 5, not: ['wdt:P576', 'wdt:P582'] }, 70],
  ['zoo-year', 'ZOOS', 'WHICH OPENED FIRST?', 'year', 'min', yearOf, { cls: ['Q43501'], prop: ['P1619', 'P571'], minSl: 22 }, 50],
  ['stadium-year', 'STADIUMS', 'WHICH OPENED FIRST?', 'year', 'min', yearOf, { cls: ['Q483110'], prop: 'P1619', minSl: 60, not: ['wdt:P576'] }, 50],
  ['car-year', 'CARS', 'WHICH CAME OUT FIRST?', 'year', 'min', yearOf, { cls: ['Q3231690'], prop: ['P577', 'P571'], minSl: 35 }, 70],
  ['probe-year', 'SPACE PROBES', 'WHICH LAUNCHED FIRST?', 'year', 'min', yearOf, { cls: ['Q26529', 'Q2133344'], prop: 'P619', minSl: 25 }, 45],
  ['born-scientist', 'SCIENTISTS', 'WHO WAS BORN FIRST?', 'year', 'min', yearOf, { cls: ['Q5'], prop: 'P569', minSl: 110, where: occ(['Q901', 'Q169470', 'Q593644', 'Q170790', 'Q11063', 'Q864503']) }, 70],
  ['born-painter', 'PAINTERS', 'WHO WAS BORN FIRST?', 'year', 'min', yearOf, { cls: ['Q5'], prop: 'P569', minSl: 90, where: occ(['Q1028181']) }, 60],
  ['born-composer', 'COMPOSERS', 'WHO WAS BORN FIRST?', 'year', 'min', yearOf, { cls: ['Q5'], prop: 'P569', minSl: 80, where: occ(['Q36834']) }, 60],
  ['born-writer', 'WRITERS', 'WHO WAS BORN FIRST?', 'year', 'min', yearOf, { cls: ['Q5'], prop: 'P569', minSl: 130, where: occ(['Q6625963', 'Q49757', 'Q214917']) }, 70],
  ['born-explorer', 'EXPLORERS', 'WHO WAS BORN FIRST?', 'year', 'min', yearOf, { cls: ['Q5'], prop: 'P569', minSl: 45, where: occ(['Q11900058']) }, 45],
  ['born-inventor', 'INVENTORS', 'WHO WAS BORN FIRST?', 'year', 'min', yearOf, { cls: ['Q5'], prop: 'P569', minSl: 55, where: occ(['Q205375']) }, 50],
];

/** the special ones (a value through another entity, or a dated statement) */
async function specials() {
  const out = [];
  // state + city populations at the 2020 CENSUS (one dated, official count — never "now")
  const census = async (name, pickWhere, minSl) => {
    const rows = await wd(name, `SELECT ?item ?label ?v ?sl WHERE { ${pickWhere} ?item wikibase:sitelinks ?sl . FILTER(?sl >= ${minSl})
      ?item p:P1082 ?st . ?st ps:P1082 ?v ; pq:P585 ?d . FILTER(YEAR(?d) = 2020)
      ?item rdfs:label ?label . FILTER(lang(?label) = "en") }`);
    return rows;
  };
  out.push(['state-pop', 'STATE POPULATION', 'WHICH STATE HAD MORE PEOPLE IN 2020?', 'people', 'max', await census('state-pop-2020', '?item wdt:P31 wd:Q35657 .', 0), 50, 1.2, 'num']);
  out.push(['uscity-pop', 'U.S. CITIES', 'WHICH CITY HAD MORE PEOPLE IN 2020?', 'people', 'max', await census('uscity-pop-2020', '?item wdt:P31 wd:Q1093829 .', 55), 60, 1.2, 'num']);
  // the highest point of each state / country (its elevation, named for the state / country)
  const high = (name, where) => wd(name, `SELECT ?item ?label ?v ?sl WHERE { ${where} ?item wdt:P610 ?hp . ?item wikibase:sitelinks ?sl .
      ?hp p:P2044 ?st . ?st a wikibase:BestRank ; psn:P2044/wikibase:quantityAmount ?v . ?item rdfs:label ?label . FILTER(lang(?label) = "en") }`);
  out.push(['state-highpoint', 'STATE HIGH POINTS', 'WHOSE HIGHEST POINT IS HIGHER?', 'm', 'max', await high('state-highpoint', '?item wdt:P31 wd:Q35657 .'), 50, 1.2, 'num']);
  out.push(['country-highpoint', 'HIGHEST POINTS', 'WHOSE HIGHEST POINT IS HIGHER?', 'm', 'max', await high('country-highpoint', '?item wdt:P31 wd:Q3624078 ; wdt:P463 wd:Q1065 .'), 100, 1.2, 'num']);
  // presidents: the year each first took office (started before 1990 — nothing current)
  out.push(['president-start', 'PRESIDENTS', 'WHO TOOK OFFICE FIRST?', 'year', 'min',
    await wd('president-start', `SELECT ?item ?label ?v ?sl WHERE { ?item wdt:P31 wd:Q5 ; p:P39 ?st . ?st ps:P39 wd:Q11696 ; pq:P580 ?v . ?item wikibase:sitelinks ?sl .
      ?item rdfs:label ?label . FILTER(lang(?label) = "en") }`), 45, 1.2, 'firstyear']);
  return out;
}

function groupRows(rows, mode) {
  const by = new Map();
  for (const r of rows) {
    if (r.v == null || !Number.isFinite(r.v)) continue;
    const e = by.get(r.item) || { q: r.item, label: r.label, sl: r.sl, vs: [] };
    e.vs.push(r.v); by.set(r.item, e);
  }
  const out = [];
  for (const e of by.values()) {
    const vs = [...new Set(e.vs)].sort((a, b) => a - b);
    if (mode === 'firstyear') e.v = vs[0];
    else { if (vs[0] <= 0 || vs.at(-1) / vs[0] > 1.03) continue; e.v = vs[Math.floor(vs.length / 2)]; }
    out.push(e);
  }
  return out;
}

const round = (unit, v) => (unit === 'year' || unit === '' ? Math.round(v)
  : unit === 'people' ? Number(v.toPrecision(3))
    : unit === 'c' ? Math.round(v * 10) / 10 : Number(v.toPrecision(5)));

const BORN = ['born-scientist', 'born-painter', 'born-composer', 'born-writer', 'born-explorer', 'born-inventor'];
const THIS_YEAR = 2025;   // nothing later (a planned launch, a coming film)

export default async function wikidataHL(ctx) {
  const made = [];
  const people = new Map();
  for (const [id, stat, ask, unit, win, how, def, keep, gap] of STATS) {
    let items;
    try { items = await how(`hl-${id}`, def); } catch (e) { ctx.log.push(`SKIPPED stat ${id}: ${e.message}`); continue; }
    // Wikidata NORMALIZES to SI: metres, square metres, kelvin — the pools store km / km² / °C
    const SI = { c: v => v - 273.15, km: v => v / 1000, km2: v => v / 1e6 };
    if (SI[unit] && how === numeric) items = items.map(x => ({ ...x, v: SI[unit](x.v) }));
    if (unit === 'year') items = items.filter(x => x.v <= THIS_YEAR);
    // THE PEOPLE: Wikidata's occupations are broad (a "scientist" who was a prime minister) — the six lists become ONE (FAMOUS PEOPLE), and
    // anyone who was also a politician, ruler, soldier, revolutionary or cleric is out (below)
    if (BORN.includes(id)) { for (const x of items) if (!people.has(x.q) || people.get(x.q).sl < x.sl) people.set(x.q, x); continue; }
    made.push([id, stat, ask, unit, win, items, keep, gap]);
  }
  if (people.size) {
    const ids = [...people.keys()].sort();
    const roles = await wd('people-roles', `SELECT DISTINCT ?item WHERE { VALUES ?item { ${ids.map(q => `wd:${q}`).join(' ')} }
      ?item wdt:P106 ?o . VALUES ?o { wd:Q82955 wd:Q189290 wd:Q116 wd:Q250867 wd:Q3242115 wd:Q193391 wd:Q47064 wd:Q372436 wd:Q1097498 wd:Q15995642 wd:Q1234713 wd:Q2259532 } }`);
    const out = new Set(roles.map(r => r.item));
    made.push(['born', 'BIRTHDAYS', 'WHO WAS BORN FIRST?', 'year', 'min', [...people.values()].filter(x => !out.has(x.q)), 140, 1.2]);
  }
  for (const [id, stat, ask, unit, win, rows, keep, gap, mode] of await specials()) made.push([id, stat, ask, unit, win, groupRows(rows, mode).filter(x => unit !== 'year' || x.v <= THIS_YEAR), keep, gap]);
  // the element temperatures: the elements up to uranium only (the superheavy ones' points are estimates)
  const z = new Map(((made.find(m => m[0] === 'element-number') || [])[5] || []).map(x => [x.q, x.v]));
  // …and the everyday ones only (by atomic number): a kid knows iron + gold, not holmium
  const EVERYDAY = new Set([1, 2, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 27, 28, 29, 30, 35, 47, 50, 53, 74, 78, 79, 80, 82, 92]);
  for (const m of made) if (m[0] === 'element-melt' || m[0] === 'element-boil') m[5] = m[5].filter(x => z.has(x.q) && EVERYDAY.has(z.get(x.q)));
  for (const [id, stat, ask, unit, win, raw, keep0, gap] of made) {
    if (OC8_CUT.includes(id)) { ctx.log.push(`  OC8: stat ${id} CUT (obscure as a class)`); continue; }
    const ex = STAT_EXCLUDE[id] || [];
    let items = raw.filter(x => !ex.includes(x.q) && !ex.includes(x.label) && !PEOPLE_EXCLUDE.includes(x.label));
    if (id === 'president-start') items = items.filter(x => x.v < 1990);
    const was = labelled(top(labelled(items, l => cleanLabel(id, l)), keep0)).length;
    items = famous(id, items);
    const keep = OC8_KEEP[id] ?? keep0;
    items = labelled(top(labelled(items, l => cleanLabel(id, l)), keep));
    if (items.length !== was) ctx.log.push(`  OC8: ${id} ${was} → ${items.length} (the fame filter)`);
    (ctx.wd ||= {})[id] = items;      // (the data-built TRUE OR FALSE + SORT IT read these — parts/30, 40)
    // a year stat big enough feeds TIMELINE too — each item to ONE of the two
    const tl = TIMELINE[id] && items.length >= 30 ? TIMELINE[id] : null;
    const sz = SIZE_TL[id] && items.length >= 40 ? SIZE_TL[id] : null;
    const goesTl = x => (tl ? toTimeline(x.q) : sz ? toSizeTimeline(x.q) : false);
    ctx.hl.push({ id, stat, ask, unit, win, ...(gap && gap !== 1.2 ? { gap } : {}), src: 'wikidata',
      items: items.filter(x => !goesTl(x)).map(x => [x.label, round(unit, x.v), null, x.q]) });
    if (tl) ctx.tl.push({ id: `wd-${id}`, theme: tl[0], ask: tl[1], dir: 'EARLIEST → LATEST', src: 'wikidata',
      items: items.filter(goesTl).map(x => [x.label, round(unit, x.v), null, x.q]) });
    if (sz) ctx.tl.push({ id: `wd-${id}`, theme: sz[0], ask: sz[1], dir: sz[2], unit, src: 'wikidata',
      items: items.filter(goesTl).map(x => [x.label, round(unit, x.v), null, x.q]) });
  }
}
