// OVERCLOCK POOLS (OC6 — docs/content.md "THE POOL BUILD", docs/overclock.md OC6) — builds the four big pools:
//   TRUE OR FALSE   data/oc/truefalse.json    { items: [{ id, t, f, src, cat }] }
//   HIGHER OR LOWER data/oc/higherlower.json  { stats: [{ id, stat, ask, unit, win, gap?, src?, items: [[label, value, shown|null, id, src?]] }] }
//   TIMELINE        data/oc/timeline.json     { themes: [{ id, theme, ask, dir, unit?, src?, items: [[label, value, shown|null, id, src?]] }] }
//   SORT IT         data/oc/sortit.json       { sets: [{ id, left, right, L, R, src }] }
// …and THE DAILY RESERVE (~20% of every pool, SERVER-ONLY — api/_data/oc-reserve/, never served, never dealt in a party) from:
//   parts/*.mjs — each adds rows to the pools: the hand content kept from OC1–OC5, the WIKIDATA pools (CC0, cached — wikidata.mjs), the
//   WRITTEN statements (each checked against its source — sources.mjs; unconfirmed = DROPPED).
// Deterministic: the same caches → byte-identical files. Values are METRIC (the screen converts to US units — js/games/overclock/units.js).
//   node scripts/oc-pools/build.mjs            (uses the caches; asks Wikidata / Wikipedia only for what isn't cached)
//   node scripts/oc-pools/build.mjs --offline  (the caches only)   --refresh (ask Wikidata again)
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HERE, ROOT, writeRows, norm, bannedIn, isReserve, hash36, TF_MAX, LABEL_MAX } from './lib.mjs';
import { stats as wdStats } from './wikidata.mjs';
import { hlFair, tlFair } from '../../js/games/overclock/challenges.js';

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const ctx = { tf: [], hl: [], tl: [], so: [], log: [], dropped: {} };
const drop = (pool, why, what) => { (ctx.dropped[pool] ||= {})[why] = ((ctx.dropped[pool] || {})[why] || 0) + 1; if (process.argv.includes('--verbose')) console.log(`  drop ${pool} ${why}: ${what}`); };
ctx.drop = drop;

const skip = ((process.argv.find(a => a.startsWith('--skip=')) || '').slice(7)).split(',').filter(Boolean);   // --skip=40-sortit,…
const parts = readdirSync(join(HERE, 'parts')).filter(f => f.endsWith('.mjs') && !skip.some(k => f.startsWith(k))).sort();
for (const f of parts) {
  const m = await import(pathToFileURL(join(HERE, 'parts', f)).href);
  const before = { tf: ctx.tf.length, hl: ctx.hl.length, tl: ctx.tl.length, so: ctx.so.length };
  await m.default(ctx);
  console.log(`${f}: +${ctx.tf.length - before.tf} T/F · +${ctx.hl.length - before.hl} stats · +${ctx.tl.length - before.tl} themes · +${ctx.so.length - before.so} sets`);
}

// ---------------------------------------------------------------- THE RULES (a row that breaks one is dropped + counted — the test checks again)
const texts = new Map();   // normalised text → where (no duplicates within or across pools)
const claim = (text, where, pool) => {
  const k = norm(text);
  if (!k) return false;
  if (texts.has(k) && texts.get(k) !== where) { drop(pool, 'duplicate', text); return false; }
  texts.set(k, where);
  return true;
};
const clean = s => !bannedIn(s).length;

const tf = [];
const tfIds = new Set();
for (const r of ctx.tf) {
  if (!ID.test(r.id) || tfIds.has(r.id)) { drop('tf', 'id', r.id); continue; }
  if (r.t.length > TF_MAX || r.f.length > TF_MAX) { drop('tf', 'too long', r.t); continue; }
  if (!clean(r.t) || !clean(r.f)) { drop('tf', 'all-ages', r.t); continue; }
  if (norm(r.t) === norm(r.f)) { drop('tf', 'twins equal', r.t); continue; }
  if (!r.src) { drop('tf', 'no source', r.t); continue; }
  if (!claim(r.t, `tf:${r.id}`, 'tf') || !claim(r.f, `tf:${r.id}`, 'tf')) continue;
  tfIds.add(r.id);
  tf.push({ id: r.id, t: r.t, f: r.f, src: r.src, cat: r.cat });
}

function cleanItems(pool, list, where, unit, fair) {
  const seen = new Set(), ids = new Set();
  const out = [];
  for (const it of list) {
    const [label, value, , id] = it;
    if (!ID.test(String(id)) || ids.has(id)) { drop(pool, 'id', `${where} ${label}`); continue; }
    if (typeof value !== 'number' || !Number.isFinite(value)) { drop(pool, 'value', `${where} ${label}`); continue; }
    if (!label || label.length > LABEL_MAX) { drop(pool, 'label too long', label); continue; }
    if (!clean(label)) { drop(pool, 'all-ages', label); continue; }
    const k = norm(label);
    if (seen.has(k)) { drop(pool, 'duplicate in its set', `${where} ${label}`); continue; }
    seen.add(k); ids.add(id);
    out.push(it);
  }
  // HIGHER OR LOWER needs pairs: an item no other item is fair against is useless
  return fair ? out.filter(a => out.some(b => b !== a && fair(unit, a[1], b[1]))) : out;
}
const hl = [];
for (const s of ctx.hl) {
  if (!ID.test(s.id) || hl.some(x => x.id === s.id)) { drop('hl', 'stat id', s.id); continue; }
  const items = cleanItems('hl', s.items, s.id, s.unit, (u, a, b) => hlFair(u, a, b, s.gap || 1.2));
  if (items.length < 8) { drop('hl', 'stat too small', `${s.id} (${items.length})`); continue; }
  hl.push({ ...s, items });
}
const tl = [];
for (const t of ctx.tl) {
  if (!ID.test(t.id) || tl.some(x => x.id === t.id)) { drop('tl', 'theme id', t.id); continue; }
  const items = cleanItems('tl', t.items, t.id, t.unit, null).sort((a, b) => a[1] - b[1]);
  // solvable: four pairwise-fair items exist (greedy from the smallest picks the most spread set)
  let n = 0, lastV = null;
  for (const it of items) if (lastV == null || tlFair(t.unit || 'year', it[1], lastV)) { n++; lastV = it[1]; }
  // (12+ items, and 5+ of them pairwise fair — four to deal + a spare)
  if (items.length < 12 || n < 5) { drop('tl', 'theme too small', `${t.id} (${items.length}, ${n} spread)`); continue; }
  tl.push({ ...t, items });
}
const so = [];
for (const s of ctx.so) {
  if (!ID.test(s.id) || so.some(x => x.id === s.id)) { drop('so', 'set id', s.id); continue; }
  const L = [...new Set(s.L)].filter(x => x.length <= LABEL_MAX && clean(x)), R = [...new Set(s.R)].filter(x => x.length <= LABEL_MAX && clean(x));
  const both = new Set(L.map(norm).filter(k => R.map(norm).includes(k)));
  const L2 = L.filter(x => !both.has(norm(x))), R2 = R.filter(x => !both.has(norm(x)));
  if (L2.length < 7 || R2.length < 7 || L2.length + R2.length < 25) { drop('so', 'set too small', s.id); continue; }
  so.push({ ...s, L: L2, R: R2 });
}

// ---------------------------------------------------------------- THE DAILY RESERVE (~20% of every pool — server-only)
const RESERVE_ON = !process.env.OC6_NO_RESERVE;    // THE DAILY RESERVE (OC6 Group 3; OC6_NO_RESERVE=1 builds without it)
const split = (list, keyOf) => (RESERVE_ON ? [list.filter(x => !isReserve(keyOf(x))), list.filter(x => isReserve(keyOf(x)))] : [list, []]);
const [tfP, tfR] = split(tf, r => r.id);
// a stat / a theme splits only when BOTH sides can still be dealt (a stat: 8+ items with fair partners; a theme: 12+ items, 5 of them pairwise
// fair) — otherwise the whole set stays on the party side
const dealable = (kind, p, items) => {
  if (kind === 'hl') return items.length >= 8 && items.every(a => items.some(b => b !== a && hlFair(p.unit, a[1], b[1], p.gap || 1.2)));
  const v = items.map(it => it[1]).sort((x, y) => x - y);
  let n = 0, last = null;
  for (const x of v) if (last == null || tlFair(p.unit || 'year', x, last)) { n++; last = x; }
  return items.length >= 12 && n >= 5;
};
const splitItems = (pools, kind) => {
  if (!RESERVE_ON) return [pools, []];
  const party = [], reserve = [], whole = [];
  for (const p of pools) {
    const [a, b] = split(p.items, it => `${p.id}:${it[3]}`);
    if (b.length && dealable(kind, p, a) && dealable(kind, p, b)) { party.push({ ...p, items: a }); reserve.push({ ...p, items: b }); }
    else whole.push(p);
  }
  // THE BALANCE: sets too small to split go WHOLE — to the reserve, in a stable order (a hash of the id), until it holds ~20% of the items
  const count = list => list.reduce((n, g) => n + g.items.length, 0);
  const total = count(pools);
  for (const p of whole.slice().sort((x, y) => hash36(`oc6-bal:${x.id}`).localeCompare(hash36(`oc6-bal:${y.id}`)))) {
    if (count(reserve) < total * 0.18) reserve.push(p); else party.push(p);
  }
  const order = new Map(pools.map((p, i) => [p.id, i]));
  return [party.sort((a, b) => order.get(a.id) - order.get(b.id)), reserve.sort((a, b) => order.get(a.id) - order.get(b.id))];
};
const [hlP, hlR] = splitItems(hl, 'hl');
const [tlP, tlR] = splitItems(tl, 'tl');
const [soP, soR] = split(so, s => s.id);

const OUT = join(ROOT, 'data', 'oc');
const RES = join(ROOT, 'api', '_data', 'oc-reserve');
const head = what => ({ note: `OVERCLOCK ${what} — BUILT by scripts/oc-pools/build.mjs (OC6): do not edit by hand; edit its sources and rebuild (docs/content.md).` });
const stat = s => { const { items, ...rest } = s; return [rest, items]; };
// stats / themes: one stat per line, its items one per line below it
function writeGroups(path, h, key, groups) {
  const rows = groups.map(g => { const [rest, items] = stat(g); return { ...rest, items }; });
  writeRows(path, h, key, rows);
}
writeRows(join(OUT, 'truefalse.json'), { ...head('TRUE OR FALSE: { id, t (true), f (its false twin), src, cat }'), v: 2 }, 'items', tfP);
writeGroups(join(OUT, 'higherlower.json'), { ...head('HIGHER OR LOWER: [{ id, stat, ask, unit (metric: m km km2 kg kmh c people year …), win, gap?, items: [[label, value, shown|null, id, src?]] }]'), v: 2 }, 'stats', hlP);
writeGroups(join(OUT, 'timeline.json'), { ...head('TIMELINE theme pools: [{ id, theme, ask, dir, unit?, items: [[label, value, shown|null, id, src?]] }] — four dealt per round'), v: 2 }, 'themes', tlP);
writeRows(join(OUT, 'sortit.json'), { ...head('SORT IT: [{ id, left, right, L, R, src }]'), v: 2 }, 'sets', soP);
if (RESERVE_ON) {
const rhead = what => ({ note: `OVERCLOCK DAILY RESERVE — ${what}. SERVER-ONLY (OC6): never served, never imported by a page, never dealt in a party. Built by scripts/oc-pools/build.mjs.` });
writeRows(join(RES, 'truefalse.json'), { ...rhead('TRUE OR FALSE'), v: 2 }, 'items', tfR);
writeGroups(join(RES, 'higherlower.json'), { ...rhead('HIGHER OR LOWER'), v: 2 }, 'stats', hlR);
writeGroups(join(RES, 'timeline.json'), { ...rhead('TIMELINE'), v: 2 }, 'themes', tlR);
writeRows(join(RES, 'sortit.json'), { ...rhead('SORT IT'), v: 2 }, 'sets', soR);
}

const n = groups => groups.reduce((a, g) => a + g.items.length, 0);
console.log(`\nTRUE OR FALSE   ${tf.length} pairs (party ${tfP.length} · reserve ${tfR.length})`);
console.log(`HIGHER OR LOWER ${hl.length} stats · ${n(hl)} items (party ${n(hlP)} · reserve ${n(hlR)})`);
console.log(`TIMELINE        ${tl.length} themes · ${n(tl)} items (party ${n(tlP)} · reserve ${n(tlR)})`);
console.log(`SORT IT         ${so.length} sets (party ${soP.length} · reserve ${soR.length})`);
console.log(`wikidata: ${wdStats.cached} cached · ${wdStats.fetched} fetched`);
for (const [pool, d] of Object.entries(ctx.dropped)) console.log(`dropped ${pool}: ${Object.entries(d).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
for (const l of ctx.log) console.log(l);
