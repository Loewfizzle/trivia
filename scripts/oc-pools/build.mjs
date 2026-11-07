// OVERCLOCK POOLS (OC6 — docs/content.md "THE POOL BUILD", docs/overclock.md OC6) — builds the four big pools:
//   TRUE OR FALSE   data/oc/truefalse.json    { items: [{ id, t, f, src, cat }] }
//   HIGHER OR LOWER data/oc/higherlower.json  { stats: [{ id, stat, ask, unit, win, gap?, src?, items: [[label, value, shown|null, id, src?]] }] }
//   TIMELINE        data/oc/timeline.json     { themes: [{ id, theme, ask, dir, unit?, src?, items: [[label, value, shown|null, id, src?]] }] }
//   SORT IT         data/oc/sortit.json       { sets: [{ id, left, right, L, R, src }] }
// OC7 — and the last four (docs/overclock.md OC7):
//   TRIVIA          data/oc/trivia.json       { items: [{ id, cat, d, q, a, w: [3], src }] }        OVERCLOCK's OWN bank (no live Trivia API)
//   CLOSEST CALL    data/oc/closest.json      { questions: [{ id, cat, q, value (metric), unit, src }] }
//   MISSING LINK    data/oc/missinglink.json  { puzzles: [{ id, clues: [[WORD, side, sep] × 3], answer, accept, src }] }
//   SPELLCHECK      data/oc/spellcheck.json   { words: [{ id, right, wrong: [3], hard: [letter indexes], src }] }
// …and THE DAILY RESERVE (~20% of every pool, SERVER-ONLY — api/_data/oc-reserve/, never served, never dealt in a party) from:
//   parts/*.mjs — each adds rows to the pools: the hand content kept from OC1–OC5, the WIKIDATA pools (CC0, cached — wikidata.mjs), the
//   WRITTEN statements (each checked against its source — sources.mjs; unconfirmed = DROPPED).
// Deterministic: the same caches → byte-identical files. Values are METRIC (the screen converts to US units — js/games/overclock/units.js).
//   node scripts/oc-pools/build.mjs            (uses the caches; asks Wikidata / Wikipedia only for what isn't cached)
//   node scripts/oc-pools/build.mjs --offline  (the caches only)   --refresh (ask Wikidata again)
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HERE, ROOT, writeRows, norm, bannedIn, isReserve, hash36, TF_MAX, LABEL_MAX, Q_MAX, A_MAX, ML_WORD_MAX, ML_JOIN_MAX, SP_MAX, aliasOf } from './lib.mjs';
import { stats as wdStats } from './wikidata.mjs';
import { hlFair, tlFair, TRIVIA_CATS, TRIVIA_LEVELS, ML_SIDES, mlJoined, closestAnswer } from '../../js/games/overclock/challenges.js';
import { US_UNITS } from '../../js/games/overclock/units.js';

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const ctx = { tf: [], hl: [], tl: [], so: [], tv: [], cc: [], ml: [], sp: [], log: [], dropped: {} };
const drop = (pool, why, what) => { (ctx.dropped[pool] ||= {})[why] = ((ctx.dropped[pool] || {})[why] || 0) + 1; if (process.argv.includes('--verbose')) console.log(`  drop ${pool} ${why}: ${what}`); };
ctx.drop = drop;

const POOLS = ['tf', 'hl', 'tl', 'so', 'tv', 'cc', 'ml', 'sp'];
const skip = ((process.argv.find(a => a.startsWith('--skip=')) || '').slice(7)).split(',').filter(Boolean);   // --skip=40-sortit,…
const parts = readdirSync(join(HERE, 'parts')).filter(f => f.endsWith('.mjs') && !skip.some(k => f.startsWith(k))).sort();
for (const f of parts) {
  const m = await import(pathToFileURL(join(HERE, 'parts', f)).href);
  const before = Object.fromEntries(POOLS.map(k => [k, ctx[k].length]));
  await m.default(ctx);
  console.log(`${f}: ${POOLS.filter(k => ctx[k].length > before[k]).map(k => `+${ctx[k].length - before[k]} ${k}`).join(' · ') || 'nothing'}`);
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

// ---------------------------------------------------------------- OC7 — TRIVIA · CLOSEST CALL · MISSING LINK · SPELLCHECK
// (each row's own checks — its source, its dictionary words — happen in its part; here THE RULES every item of these pools must pass)
const uniq = (list, pool, what) => { const ids = new Set(); return list.filter(r => { if (!ID.test(String(r.id)) || ids.has(r.id)) { drop(pool, 'id', `${r.id} ${what(r)}`); return false; } ids.add(r.id); return true; }); };
const tv = [];
for (const r of uniq(ctx.tv, 'tv', r => r.q)) {
  const all = [r.a, ...(r.w || [])];
  if (!TRIVIA_CATS[r.cat]) { drop('tv', 'category', `${r.cat}: ${r.q}`); continue; }
  if (!TRIVIA_LEVELS.includes(r.d)) { drop('tv', 'difficulty', r.q); continue; }
  if (!r.q || r.q.length > Q_MAX) { drop('tv', 'question too long', r.q); continue; }
  if (!Array.isArray(r.w) || r.w.length !== 3 || all.some(x => typeof x !== 'string' || !x.trim() || x.length > A_MAX)) { drop('tv', 'answers', r.q); continue; }
  if (all.some((x, i) => all.some((y, j) => j > i && aliasOf(x, y)))) { drop('tv', 'answers alike', `${r.q} [${all.join(' / ')}]`); continue; }
  if (![r.q, ...all].every(clean)) { drop('tv', 'all-ages', r.q); continue; }
  if (!r.src) { drop('tv', 'no source', r.q); continue; }
  if (!claim(r.same ? `${r.q} :: ${r.a}` : r.q, `tv:${r.id}`, 'tv')) continue;
  tv.push({ id: r.id, cat: r.cat, d: r.d, q: r.q, a: r.a, w: r.w, src: r.src });
}
// the question names the US unit the screen + the scoring use (closestAnswer): "…, in feet?"
const UNIT_WORDS = { m: /\bfeet\b/, km: /\bmiles\b/, km2: /\bsquare miles\b/, kg: /\bpounds\b/, kmh: /\b(miles per hour|mph)\b/, c: /°F|\bdegrees Fahrenheit\b/ };
// ("How old was … when …?" names years by itself)
const namesUnit = (q, unit) => (US_UNITS[unit] ? UNIT_WORDS[unit].test(q) : !unit || (unit === 'years' && /^How old /.test(q)) || q.toLowerCase().includes(unit.split(' ')[0].toLowerCase().replace(/s$/, '')));
const cc = [];
for (const r of uniq(ctx.cc, 'cc', r => r.q)) {
  if (!r.q || r.q.length > Q_MAX) { drop('cc', 'question too long', r.q); continue; }
  if (typeof r.value !== 'number' || !Number.isFinite(r.value) || r.value <= 0) { drop('cc', 'value', r.q); continue; }
  if (typeof r.unit !== 'string' || !namesUnit(r.q, r.unit)) { drop('cc', 'the question must name its unit', `${r.q} (${r.unit})`); continue; }
  const { answer } = closestAnswer(r.unit, r.value);
  if (!(answer > 0) || String(Math.round(answer)).length > 9) { drop('cc', 'answer out of the pad', `${r.q} = ${answer}`); continue; }
  if (!clean(r.q)) { drop('cc', 'all-ages', r.q); continue; }
  if (!r.src) { drop('cc', 'no source', r.q); continue; }
  if (!claim(r.q, `cc:${r.id}`, 'cc')) continue;
  cc.push({ id: r.id, cat: r.cat, q: r.q, value: r.value, unit: r.unit, src: r.src });
}
const WORD = /^[A-Z]+$/;
const ml = [];
const mlAnswers = new Set();
// (OC8: a duplicate is decided AFTER the rules — a legacy row that dies on a rule (BLOODY NOSE: all-ages) used to claim its id first and block
//  every later puzzle with that answer; now the first row that PASSES keeps the answer, the rest are 'answer used')
for (const r of ctx.ml.filter(r => (ID.test(String(r.id)) ? true : (drop('ml', 'id', `${r.id} ${r.answer}`), false)))) {
  const ok = Array.isArray(r.clues) && r.clues.length === 3 && r.clues.every(c => Array.isArray(c) && WORD.test(c[0]) && c[0].length <= ML_WORD_MAX && ML_SIDES.includes(c[1]) && ['', ' '].includes(c[2] || ''));
  if (!ok || !WORD.test(r.answer || '') || r.answer.length > ML_WORD_MAX) { drop('ml', 'shape', JSON.stringify(r)); continue; }
  if (new Set(r.clues.map(c => c[0])).size !== 3 || r.clues.some(c => c[0] === r.answer)) { drop('ml', 'clues repeat', r.answer); continue; }
  if (r.clues.some(c => mlJoined(c[0], r.answer, c[1], c[2] || '').length > ML_JOIN_MAX)) { drop('ml', 'join too long', r.answer); continue; }
  if (![r.answer, ...r.clues.map(c => c[0])].every(clean)) { drop('ml', 'all-ages', r.answer); continue; }
  if (mlAnswers.has(r.answer)) { drop('ml', 'answer used', r.answer); continue; }
  if (!r.src) { drop('ml', 'no source', r.answer); continue; }
  mlAnswers.add(r.answer);
  ml.push({ id: r.id, clues: r.clues.map(c => [c[0], c[1], c[2] || '']), answer: r.answer, accept: (r.accept || []).filter(x => WORD.test(x)), src: r.src });
}
const LOWER = /^[a-z]+$/;
const sp = [];
const spWords = new Set();
for (const r of uniq(ctx.sp, 'sp', r => r.right)) {
  const all = [r.right, ...(r.wrong || [])];
  if (!Array.isArray(r.wrong) || r.wrong.length !== 3 || !all.every(x => LOWER.test(x) && x.length <= SP_MAX) || new Set(all).size !== 4) { drop('sp', 'shape', r.right); continue; }
  if (!Array.isArray(r.hard) || !r.hard.length || !r.hard.every(i => Number.isInteger(i) && i >= 0 && i < r.right.length)) { drop('sp', 'hard letters', r.right); continue; }
  if (!all.every(clean)) { drop('sp', 'all-ages', r.right); continue; }
  if (spWords.has(r.right)) { drop('sp', 'duplicate', r.right); continue; }
  if (!r.src) { drop('sp', 'no source', r.right); continue; }
  spWords.add(r.right);
  sp.push({ id: r.id, right: r.right, wrong: r.wrong, hard: [...new Set(r.hard)].sort((a, b) => a - b), src: r.src });
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
const [tvP, tvR] = split(tv, r => `tv:${r.id}`);
const [ccP, ccR] = split(cc, r => `cc:${r.id}`);
const [mlP, mlR] = split(ml, r => `ml:${r.id}`);
const [spP, spR] = split(sp, r => `sp:${r.id}`);

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
const head7 = what => ({ note: `OVERCLOCK ${what} — BUILT by scripts/oc-pools/build.mjs (OC7): do not edit by hand; edit its sources and rebuild (docs/content.md).` });
writeRows(join(OUT, 'trivia.json'), { ...head7("TRIVIA LIGHTNING — OVERCLOCK's own bank: { id, cat, d (easy|medium|hard), q, a (right), w (three wrong), src }"), v: 1 }, 'items', tvP);
writeRows(join(OUT, 'closest.json'), { ...head7('CLOSEST CALL: { id, cat, q (names the US unit), value (METRIC), unit (m km km2 kg kmh, or a plain count word), src }'), v: 3 }, 'questions', ccP);
writeRows(join(OUT, 'missinglink.json'), { ...head7("MISSING LINK: { id, clues: [[WORD, side (where the ANSWER goes: before|after), sep ('' one word | ' ' a phrase)] × 3], answer, accept, src }"), v: 2 }, 'puzzles', mlP);
writeRows(join(OUT, 'spellcheck.json'), { ...head7('SPELLCHECK (American spelling): { id, right, wrong: [the most common misspelling, wrong, wrong], hard: [letter indexes people get wrong], src }'), v: 2 }, 'words', spP);
if (RESERVE_ON) {
const rhead = what => ({ note: `OVERCLOCK DAILY RESERVE — ${what}. SERVER-ONLY (OC6): never served, never imported by a page, never dealt in a party. Built by scripts/oc-pools/build.mjs.` });
writeRows(join(RES, 'truefalse.json'), { ...rhead('TRUE OR FALSE'), v: 2 }, 'items', tfR);
writeGroups(join(RES, 'higherlower.json'), { ...rhead('HIGHER OR LOWER'), v: 2 }, 'stats', hlR);
writeGroups(join(RES, 'timeline.json'), { ...rhead('TIMELINE'), v: 2 }, 'themes', tlR);
writeRows(join(RES, 'sortit.json'), { ...rhead('SORT IT'), v: 2 }, 'sets', soR);
writeRows(join(RES, 'trivia.json'), { ...rhead('TRIVIA LIGHTNING'), v: 1 }, 'items', tvR);
writeRows(join(RES, 'closest.json'), { ...rhead('CLOSEST CALL'), v: 3 }, 'questions', ccR);
writeRows(join(RES, 'missinglink.json'), { ...rhead('MISSING LINK'), v: 2 }, 'puzzles', mlR);
writeRows(join(RES, 'spellcheck.json'), { ...rhead('SPELLCHECK'), v: 2 }, 'words', spR);
}

const n = groups => groups.reduce((a, g) => a + g.items.length, 0);
console.log(`\nTRUE OR FALSE   ${tf.length} pairs (party ${tfP.length} · reserve ${tfR.length})`);
console.log(`HIGHER OR LOWER ${hl.length} stats · ${n(hl)} items (party ${n(hlP)} · reserve ${n(hlR)})`);
console.log(`TIMELINE        ${tl.length} themes · ${n(tl)} items (party ${n(tlP)} · reserve ${n(tlR)})`);
console.log(`SORT IT         ${so.length} sets (party ${soP.length} · reserve ${soR.length})`);
const lv = list => TRIVIA_LEVELS.map(d => `${d} ${list.filter(r => r.d === d).length}`).join(' · ');
console.log(`TRIVIA          ${tv.length} questions (party ${tvP.length} · reserve ${tvR.length}) — ${lv(tv)}`);
console.log(`CLOSEST CALL    ${cc.length} questions (party ${ccP.length} · reserve ${ccR.length})`);
console.log(`MISSING LINK    ${ml.length} puzzles (party ${mlP.length} · reserve ${mlR.length})`);
console.log(`SPELLCHECK      ${sp.length} words (party ${spP.length} · reserve ${spR.length})`);
console.log(`wikidata: ${wdStats.cached} cached · ${wdStats.fetched} fetched`);
for (const [pool, d] of Object.entries(ctx.dropped)) console.log(`dropped ${pool}: ${Object.entries(d).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
for (const l of ctx.log) console.log(l);
