// OVERCLOCK — THE CONTENT CHECKS (OC6): every item of the four big pools (TRUE OR FALSE, HIGHER OR LOWER, TIMELINE, SORT IT) — the shipped
// party pools AND the server-only DAILY RESERVE — against the pass's rules: an id + a source on everything, no duplicates, the phone limits,
// fair pairs, solvable timelines, disjoint sides (the computed sets re-computed), the all-ages words, no template over ~8%, US units that
// read naturally. Built by scripts/oc-pools/build.mjs (docs/content.md "THE POOL BUILD").
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { hlFair, tlFair, tlDeal, TL_GAP_YEARS } from '../js/games/overclock/challenges.js';
import { fmtStat } from '../js/games/overclock/shared.js';
import { rngFrom } from '../js/core/rng.js';
import { SORT_CHECKS } from '../scripts/oc-pools/sortcheck.mjs';
import { bannedIn, norm, TF_MAX, LABEL_MAX } from '../scripts/oc-pools/lib.mjs';

const J = p => JSON.parse(readFileSync(p, 'utf8'));
const RES = 'api/_data/oc-reserve';
const R = f => (existsSync(`${RES}/${f}`) ? J(`${RES}/${f}`) : null);
const P = {
  tf: J('data/oc/truefalse.json').items, hl: J('data/oc/higherlower.json').stats, tl: J('data/oc/timeline.json').themes, so: J('data/oc/sortit.json').sets,
};
const RV = { tf: (R('truefalse.json') || { items: [] }).items, hl: (R('higherlower.json') || { stats: [] }).stats, tl: (R('timeline.json') || { themes: [] }).themes, so: (R('sortit.json') || { sets: [] }).sets };
const ALL = { tf: [...P.tf, ...RV.tf], hl: [...P.hl, ...RV.hl], tl: [...P.tl, ...RV.tl], so: [...P.so, ...RV.so] };
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const URL_RE = /^https:\/\/[^\s]+$/;
const QIDS = /^Q\d+( Q\d+)*$/;
const groupItems = groups => groups.flatMap(g => g.items.map(it => ({ g, it })));

// (OC8 — THE FABLE REVIEW's fame filter cut the obscure on purpose: H/L 1,727 → ~1,150 items, TIMELINE 32 → 21 themes; the floors follow —
//  docs/overclock.md OC8 has every cut)
test('POOL SIZES (OC8 floors): T/F 2,000+ · H/L 40+ stats + 1,100+ items · TIMELINE 20+ themes + 500+ items · SORT IT 150+ sets', () => {
  const n = gs => gs.reduce((a, g) => a + g.items.length, 0);
  const statIds = new Set(ALL.hl.map(s => s.id)), themeIds = new Set(ALL.tl.map(t => t.id)), setIds = new Set(ALL.so.map(s => s.id));
  console.log(`[oc6] T/F ${ALL.tf.length} (party ${P.tf.length}) · H/L ${statIds.size} stats ${n(ALL.hl)} items (party ${n(P.hl)}) · TIMELINE ${themeIds.size} themes ${n(ALL.tl)} items (party ${n(P.tl)}) · SORT IT ${setIds.size} sets (party ${P.so.length})`);
  assert.ok(ALL.tf.length >= 2000, `T/F ${ALL.tf.length}`);
  assert.ok(statIds.size >= 40 && n(ALL.hl) >= 1100, `H/L ${statIds.size} / ${n(ALL.hl)}`);
  assert.ok(themeIds.size >= 20 && n(ALL.tl) >= 500, `TIMELINE ${themeIds.size} / ${n(ALL.tl)}`);
  assert.ok(setIds.size >= 150, `SORT IT ${setIds.size}`);
});

test('every item has a stable, database-safe id + a SOURCE (a Wikidata Q-id or a URL — or "computed" for a Sort It rule)', () => {
  const tfIds = new Set();
  for (const r of ALL.tf) {
    assert.match(r.id, ID); assert.ok(!tfIds.has(r.id), `duplicate id ${r.id}`); tfIds.add(r.id);
    assert.ok(URL_RE.test(r.src) || QIDS.test(r.src), `${r.id}: source ${r.src}`);
    assert.ok(r.cat, `${r.id}: a category`);
  }
  for (const kind of ['hl', 'tl']) {
    for (const g of ALL[kind]) {
      assert.match(g.id, ID);
      const ids = new Set();
      for (const it of g.items) {
        const [label, v, shown, id, src] = it;
        assert.match(String(id), ID, `${g.id}: ${label}`);
        assert.ok(!ids.has(id), `${g.id}: duplicate item id ${id}`); ids.add(id);
        assert.ok(/^Q\d+$/.test(id) || URL_RE.test(src || '') || URL_RE.test(g.src || ''), `${g.id}: ${label} has no source`);
        assert.ok(typeof v === 'number' && Number.isFinite(v), `${g.id}: ${label} value`);
        if (shown != null) assert.equal(typeof shown, 'string');
      }
    }
  }
  for (const s of ALL.so) { assert.match(s.id, ID); assert.ok(s.src === 'computed' || s.src === 'wikidata' || URL_RE.test(s.src), `${s.id}: source ${s.src}`); }
});

test('the party pools and the reserve never share an item (party play never deals a reserve item)', () => {
  const tf = new Set(P.tf.map(r => r.id));
  for (const r of RV.tf) assert.ok(!tf.has(r.id), r.id);
  for (const kind of ['hl', 'tl']) {
    const party = new Set(groupItems(P[kind]).map(({ g, it }) => `${g.id}:${it[3]}`));
    for (const { g, it } of groupItems(RV[kind])) assert.ok(!party.has(`${g.id}:${it[3]}`), `${kind} ${g.id}:${it[3]}`);
  }
  const so = new Set(P.so.map(s => s.id));
  for (const s of RV.so) assert.ok(!so.has(s.id), s.id);
});

test('no duplicates: a statement (normalized) appears once across TRUE OR FALSE; no T/F statement is just an H/L or timeline label', () => {
  const seen = new Map();
  for (const r of ALL.tf) for (const t of [r.t, r.f]) {
    const k = norm(t);
    assert.ok(!seen.has(k) || seen.get(k) === r.id, `"${t}" twice (${seen.get(k)} · ${r.id})`);
    seen.set(k, r.id);
  }
  for (const { it } of [...groupItems(ALL.hl), ...groupItems(ALL.tl)]) assert.ok(!seen.has(norm(it[0])), `label "${it[0]}" is also a statement`);
  for (const kind of ['hl', 'tl']) for (const g of ALL[kind]) {
    const labels = g.items.map(it => norm(it[0]));
    assert.equal(new Set(labels).size, labels.length, `${g.id}: a label twice`);
  }
});

test('READABLE ON THE PHONE: statements ≤ 90 characters, item labels + cards ≤ 32, the twins differ', () => {
  for (const r of ALL.tf) {
    assert.ok(r.t.length <= TF_MAX && r.f.length <= TF_MAX, `${r.id}: ${r.t.length}/${r.f.length} chars`);
    assert.notEqual(norm(r.t), norm(r.f), r.id);
    assert.ok(/[.?!]['"’”]?$/.test(r.t) && /[.?!]['"’”]?$/.test(r.f), `${r.id}: a full sentence`);
  }
  for (const { g, it } of [...groupItems(ALL.hl), ...groupItems(ALL.tl)]) assert.ok(it[0].length <= LABEL_MAX, `${g.id}: "${it[0]}"`);
  for (const s of ALL.so) for (const c of [...s.L, ...s.R]) assert.ok(c.length <= LABEL_MAX, `${s.id}: "${c}"`);
});

test('THE ALL-AGES RULE: no banned word anywhere (statements, labels, cards, set names)', () => {
  const hits = [];
  const check = (where, t) => { const b = bannedIn(t); if (b.length) hits.push(`${where}: "${t}" (${b.join(', ')})`); };
  for (const r of ALL.tf) { check(r.id, r.t); check(r.id, r.f); }
  for (const { g, it } of [...groupItems(ALL.hl), ...groupItems(ALL.tl)]) check(g.id, it[0]);
  for (const s of ALL.so) for (const c of [s.left, s.right, ...s.L, ...s.R]) check(s.id, c);
  assert.deepEqual(hits, []);
});

test('NO TEMPLATE OVER ~8%: the data-built statements spread over many templates', () => {
  const data = ALL.tf.filter(r => r.id.startsWith('d-'));
  const by = new Map();
  for (const r of data) { const t = /^d-(.+?)-Q\d/.exec(r.id)[1]; by.set(t, (by.get(t) || 0) + 1); }
  console.log(`[oc6] data T/F ${data.length} from ${by.size} templates · written ${ALL.tf.length - data.length}`);
  assert.ok(data.length >= 850, `${data.length} data-built pairs`);   // (OC8: the fame filter — was 1,000)
  assert.ok(ALL.tf.length - data.length >= 1000, `${ALL.tf.length - data.length} written pairs`);
  for (const [t, n] of by) assert.ok(n / data.length <= 0.085, `template ${t}: ${n} of ${data.length} (${Math.round((n / data.length) * 100)}%)`);
});

test('HIGHER OR LOWER: every item has a fair partner (1.2× / the stat\'s gap; years 10+; °C 100°+) — never a near call', () => {
  for (const s of ALL.hl) {
    assert.ok(['max', 'min'].includes(s.win) && s.ask.endsWith('?'), s.id);
    for (const [name, v] of s.items) assert.ok(s.items.some(([n2, w]) => n2 !== name && hlFair(s.unit, v, w, s.gap)), `${s.id}: ${name} has no fair partner`);
    if (s.unit === 'year') assert.ok(s.items.every(it => Number.isInteger(it[1])), `${s.id}: whole years`);
  }
});

test('US UNITS read naturally: every shown value is a clean number + a US unit (never "1,640.42 ft")', () => {
  const OK = /^(c\. )?-?−?[\d,]+(\.\d{1,2})?( (thousand|million|billion))?( (ft|mi|sq mi|lb|mph|°F|players|Oscars|spaces))?( BC)?$/;
  for (const kind of ['hl', 'tl']) for (const g of ALL[kind]) {
    if (kind === 'tl' && !g.unit) continue;
    for (const it of g.items) {
      if (it[2]) continue;
      const t = fmtStat(g.unit || 'year', it[1], null);
      assert.match(t, OK, `${g.id}: ${it[0]} → "${t}"`);
      const m = /([\d,]+)\.(\d+)/.exec(t);
      if (m) assert.ok(Number(m[1].replace(/,/g, '')) < 100, `${g.id}: ${it[0]} → "${t}" (decimals only on small numbers)`);
    }
  }
  assert.equal(fmtStat('m', 828), '2,717 ft');
  assert.equal(fmtStat('km', 6650), '4,132 mi');
  assert.equal(fmtStat('km2', 17098246), '6.6 million sq mi');
  assert.equal(fmtStat('people', 331449281), '331 million');
  assert.equal(fmtStat('c', -38.83), '−38 °F');
  assert.equal(fmtStat('kmh', 120), '75 mph');
});

test('TIMELINE: every theme deals four distinct, pairwise-fair items (10+ years apart) on many seeds — always solvable', () => {
  for (const t of ALL.tl) {
    assert.ok(t.theme && t.ask && /→/.test(t.dir), t.id);
    const unit = t.unit || 'year';
    for (let s = 0; s < 25; s++) {
      const idx = tlDeal(rngFrom(`${t.id}:${s}`), t);
      assert.ok(idx && idx.length === 4 && new Set(idx).size === 4, `${t.id}: no fair four`);
      const vals = idx.map(i => t.items[i][1]);
      assert.equal(new Set(vals).size, 4, `${t.id}: distinct values`);
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) assert.ok(tlFair(unit, vals[a], vals[b]), `${t.id}: ${vals}`);
    }
  }
  assert.equal(TL_GAP_YEARS, 10);
});

test('SORT IT: two clear sides, disjoint, 7+ cards a side, 25+ a set; every computed set re-computed card by card', () => {
  let computed = 0;
  for (const s of ALL.so) {
    assert.ok(s.left && s.right && s.left !== s.right, s.id);
    assert.ok(s.L.length >= 7 && s.R.length >= 7 && s.L.length + s.R.length >= 25, `${s.id}: ${s.L.length} + ${s.R.length}`);
    const l = new Set(s.L.map(norm));
    for (const c of s.R) assert.ok(!l.has(norm(c)), `${s.id}: "${c}" on both sides`);
    const f = SORT_CHECKS[s.left];
    if (s.src === 'computed') assert.ok(f, `${s.id}: a computed set needs its rule`);
    if (f) {
      computed++;
      for (const c of s.L) assert.ok(f(c), `${s.left}: ${c}`);
      for (const c of s.R) assert.ok(!f(c), `${s.right}: ${c}`);
    }
  }
  assert.ok(computed >= 20, `${computed} computed sets`);
});

// ============================================================================================ OC7 — TRIVIA · CLOSEST CALL · MISSING LINK · SPELLCHECK
// The four OC7 pools (party + reserve) against the pass's rules: an id + a source, no duplicates within + across the pools, the phone limits,
// fair trivia wrongs (never an alias of the right one), MISSING LINK's sides recorded + every join a real word / phrase (the committed verdicts —
// no download needed), SPELLCHECK's dictionary checks (SCOWL Hunspell en_US / en_GB + ENABLE — scripts/oc-pools/dict/), the all-ages words,
// US units that read naturally, the ~20% reserve.
const O7 = {
  tv: { party: J('data/oc/trivia.json').items, res: (R('trivia.json') || { items: [] }).items },
  cc: { party: J('data/oc/closest.json').questions, res: (R('closest.json') || { questions: [] }).questions },
  ml: { party: J('data/oc/missinglink.json').puzzles, res: (R('missinglink.json') || { puzzles: [] }).puzzles },
  sp: { party: J('data/oc/spellcheck.json').words, res: (R('spellcheck.json') || { words: [] }).words },
};
const A7 = Object.fromEntries(Object.entries(O7).map(([k, v]) => [k, [...v.party, ...v.res]]));
const SRC7 = s => typeof s === 'string' && (URL_RE.test(s) || QIDS.test(s) || /^[a-z-]+ Q\d+( Q\d+)+$/.test(s) || /^wiktionary:[a-z ,'_-]+$/.test(s));

test('OC7 POOL SIZES: TRIVIA 4,000+ (written 2,000+ · data 2,000+, ≈ 40/40/20) · CLOSEST CALL ~1,000 · SPELLCHECK ~1,500 · MISSING LINK 600+', () => {
  const tv = A7.tv, d = { easy: 0, medium: 0, hard: 0 };
  for (const r of tv) d[r.d]++;
  const pc = k => Math.round((d[k] / tv.length) * 100);
  const written = tv.filter(r => r.id.startsWith('w')).length;
  console.log(`[oc7] TRIVIA ${tv.length} (party ${O7.tv.party.length}; written ${written} · data ${tv.length - written}; ${pc('easy')}% easy · ${pc('medium')}% medium · ${pc('hard')}% hard) · CLOSEST ${A7.cc.length} (party ${O7.cc.party.length}) · MISSING LINK ${A7.ml.length} (party ${O7.ml.party.length}) · SPELLCHECK ${A7.sp.length} (party ${O7.sp.party.length})`);
  // (OC8: the broken templates cut + the fame filter for places + people — 4,184 → ~3,770; the data half ~1,590)
  assert.ok(tv.length >= 3600, `TRIVIA ${tv.length}`);
  assert.ok(written >= 2000 && tv.length - written >= 1500, `written ${written} · data ${tv.length - written}`);
  assert.ok(pc('easy') >= 30 && pc('easy') <= 50 && pc('medium') >= 30 && pc('medium') <= 50 && pc('hard') >= 12 && pc('hard') <= 28, `mix ${pc('easy')}/${pc('medium')}/${pc('hard')}`);
  assert.ok(A7.cc.length >= 900, `CLOSEST ${A7.cc.length}`);
  assert.ok(A7.sp.length >= 1400, `SPELLCHECK ${A7.sp.length}`);
  assert.ok(A7.ml.length >= 600, `MISSING LINK ${A7.ml.length} (the ~1,000 target is a known gap — docs/overclock.md OC7)`);
});

test('OC7: every item has a stable, database-safe, prefixed id + a SOURCE; ids unique within + across the four pools', () => {
  const seen = new Map();
  const PREFIX = { tv: /^(t-|w)/, cc: /^c/, ml: /^m-/, sp: /^s-/ };
  for (const [k, rows] of Object.entries(A7)) for (const r of rows) {
    assert.match(r.id, ID, `${k}: id ${r.id}`);
    assert.match(r.id, PREFIX[k], `${k}: prefix ${r.id}`);
    assert.ok(!seen.has(r.id), `${r.id} twice (${seen.get(r.id)} · ${k})`); seen.set(r.id, k);
    assert.ok(SRC7(r.src), `${k} ${r.id}: source ${r.src}`);
  }
});

test('OC7: the party pools and the reserve never share an item; the reserve is ~20% of each pool + agrees with the build\'s split', async () => {
  const { isReserve } = await import('../scripts/oc-pools/lib.mjs');
  for (const [k, { party, res }] of Object.entries(O7)) {
    const p = new Set(party.map(r => r.id));
    for (const r of res) assert.ok(!p.has(r.id), `${k}: ${r.id} in both`);
    const share = res.length / (party.length + res.length);
    assert.ok(share >= 0.14 && share <= 0.26, `${k}: reserve ${Math.round(share * 100)}%`);
    for (const r of party) assert.ok(!isReserve(`${k}:${r.id}`), `${k}: ${r.id} belongs in the reserve`);
    for (const r of res) assert.ok(isReserve(`${k}:${r.id}`), `${k}: ${r.id} belongs in the party pool`);
  }
});

test('OC7 NO DUPLICATES: a question once across TRIVIA + CLOSEST CALL (+ never a TRUE OR FALSE statement) · a MISSING LINK answer + a SPELLCHECK word once', () => {
  const q = new Map();
  // (a WHICH OF THESE … question shares its wording — its four choices make it: keyed by the question + its answer, as the build claims it)
  for (const r of [...A7.tv, ...A7.cc]) { const k = /^Which of these /.test(r.q) ? `${norm(r.q)} :: ${norm(r.a)}` : norm(r.q); assert.ok(!q.has(k), `"${r.q}" twice (${q.get(k)} · ${r.id})`); q.set(k, r.id); }
  for (const r of ALL.tf) for (const t of [r.t, r.f]) assert.ok(!q.has(norm(t)), `T/F "${t}" is also a question`);
  const ml = new Set();
  for (const r of A7.ml) { assert.ok(!ml.has(r.answer), `MISSING LINK ${r.answer} twice`); ml.add(r.answer); }
  const sp = new Set(A7.sp.map(r => r.right));
  assert.equal(sp.size, A7.sp.length, 'a SPELLCHECK word twice');
  for (const r of A7.sp) for (const w of r.wrong) assert.ok(!sp.has(w), `${w} is a right word too`);
});

test('OC7 READABLE ON THE PHONE: questions ≤ 110, answers ≤ 28; clues ≤ 10, joins ≤ 20; spellings ≤ 16', async () => {
  const { Q_MAX, A_MAX, ML_WORD_MAX, ML_JOIN_MAX, SP_MAX } = await import('../scripts/oc-pools/lib.mjs');
  for (const r of A7.tv) {
    assert.ok(r.q.length <= Q_MAX && /\?['"’”]?$/.test(r.q), `${r.id}: "${r.q}"`);
    for (const a of [r.a, ...r.w]) assert.ok(a.length >= 1 && a.length <= A_MAX, `${r.id}: answer "${a}"`);
  }
  for (const r of A7.cc) assert.ok(r.q.length <= Q_MAX && /\?$/.test(r.q), `${r.id}: "${r.q}"`);
  for (const r of A7.ml) {
    assert.ok(r.answer.length <= ML_WORD_MAX, r.id);
    for (const [w, , sep] of r.clues) assert.ok(w.length <= ML_WORD_MAX && w.length + sep.length + r.answer.length <= ML_JOIN_MAX, `${r.id}: ${w}`);
  }
  for (const r of A7.sp) for (const w of [r.right, ...r.wrong]) assert.ok(w.length <= SP_MAX, `${r.id}: ${w}`);
});

test('OC7 TRIVIA: a known category + level, three distinct wrongs, none an ALIAS of the right answer (or of each other)', async () => {
  const { aliasOf } = await import('../scripts/oc-pools/lib.mjs');
  const { TRIVIA_CATS, TRIVIA_LEVELS } = await import('../js/games/overclock/challenges.js');
  for (const r of A7.tv) {
    assert.ok(TRIVIA_CATS[r.cat], `${r.id}: category ${r.cat}`);
    assert.ok(TRIVIA_LEVELS.includes(r.d), `${r.id}: level ${r.d}`);
    assert.equal(r.w.length, 3, r.id);
    const all = [r.a, ...r.w];
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) assert.ok(!aliasOf(all[i], all[j]), `${r.id}: "${all[i]}" ~ "${all[j]}"`);
  }
  assert.ok(aliasOf('Washington', 'George Washington') && aliasOf('The Nile', 'Nile') && !aliasOf('1,860', '1,860,000') && !aliasOf('-10 degrees', '10 degrees'));
});

test('OC7 MISSING LINK: three clues, EVERY side recorded (no neutral join in the bank), every join a real word (en_US / ENABLE) or phrase (Wiktionary)', async () => {
  const { joinOk } = await import('../scripts/oc-pools/phrases.mjs');
  const { ML_SIDES } = await import('../js/games/overclock/challenges.js');
  for (const r of A7.ml) {
    assert.match(r.answer, /^[A-Z]+$/, r.id);
    assert.equal(r.clues.length, 3, r.id);
    assert.equal(new Set(r.clues.map(c => c[0])).size, 3, `${r.id}: a clue twice`);
    assert.ok(Array.isArray(r.accept) && !r.accept.includes(r.answer), `${r.id}: accept`);
    for (const [w, side, sep] of r.clues) {
      assert.match(w, /^[A-Z]+$/, `${r.id}: ${w}`);
      assert.notEqual(w, r.answer, r.id);
      assert.ok(ML_SIDES.includes(side) && (sep === '' || sep === ' '), `${r.id}: ${w} has no side (${side}/${JSON.stringify(sep)})`);
      assert.ok(joinOk(w, r.answer, side, sep), `${r.id}: ${side === 'before' ? r.answer + sep + w : w + sep + r.answer} is not on record`);
    }
  }
});

test('OC7 SPELLCHECK (American): the right one is in Hunspell en_US (SCOWL), no wrong one is a word in en_US / en_GB / ENABLE, hard = the common slip', async () => {
  const { dictionaries } = await import('../scripts/oc-pools/dict.mjs');
  const { hardLetters } = await import('../scripts/oc-pools/spell-rules.mjs');
  const { rudeIn } = await import('../scripts/oc-pools/spell-gen.mjs');
  const { isWord, anyWord } = dictionaries();
  for (const r of A7.sp) {
    assert.match(r.right, /^[a-z]+$/, r.id);
    assert.ok(isWord(r.right), `${r.right}: not in en_US`);
    assert.equal(r.wrong.length, 3, r.id);
    assert.equal(new Set([r.right, ...r.wrong]).size, 4, `${r.id}: a spelling twice`);
    for (const w of r.wrong) {
      assert.match(w, /^[a-z]+$/, `${r.id}: ${w}`);
      assert.ok(!anyWord(w), `${r.id}: "${w}" is a word`);
      assert.ok(!rudeIn(w, r.right), `${r.id}: "${w}" rude`);
    }
    assert.ok(Array.isArray(r.hard) && r.hard.length >= 1 && r.hard.every(i => Number.isInteger(i) && i >= 0 && i < r.right.length), `${r.id}: hard ${r.hard}`);
    assert.deepEqual(r.hard, hardLetters(r.right, r.wrong[0]), `${r.id}: hard ≠ the common misspelling's letters`);
  }
});

test('OC7 THE ALL-AGES RULE: no banned word in any question, answer, clue, join or spelling', () => {
  const hits = [];
  const check = (where, t) => { const b = bannedIn(t); if (b.length) hits.push(`${where}: "${t}" (${b.join(', ')})`); };
  for (const r of A7.tv) for (const t of [r.q, r.a, ...r.w]) check(r.id, t);
  for (const r of A7.cc) check(r.id, r.q);
  for (const r of A7.ml) { check(r.id, r.answer); for (const [w, side, sep] of r.clues) check(r.id, side === 'before' ? `${r.answer}${sep}${w}` : `${w}${sep}${r.answer}`); }
  for (const r of A7.sp) for (const t of [r.right, ...r.wrong]) check(r.id, t);
  assert.deepEqual(hits, []);
});

test('OC7 CLOSEST CALL in US units: the question names its unit, the answer is a clean US number (whole; one decimal under 10)', async () => {
  const { closestAnswer } = await import('../js/games/overclock/challenges.js');
  const { US_UNITS } = await import('../js/games/overclock/units.js');
  const NAMES = { m: /in feet\?$/, km: /in miles\?$/, km2: /in square miles\?$/, people: /^How many people/, years: /^How old /, minutes: /minutes/, episodes: /episodes/ };
  for (const r of A7.cc) {
    assert.ok(['m', 'km', 'km2', 'people', 'years', 'minutes', 'episodes', ''].includes(r.unit), `${r.id}: unit ${r.unit}`);
    assert.ok(typeof r.value === 'number' && Number.isFinite(r.value) && r.value > 0, `${r.id}: value ${r.value}`);
    if (NAMES[r.unit]) assert.match(r.q, NAMES[r.unit], `${r.id}: "${r.q}" doesn't name its unit`);
    const { answer, unit } = closestAnswer(r.unit, r.value);
    if (US_UNITS[r.unit]) assert.equal(unit, US_UNITS[r.unit][0], r.id);
    assert.ok(Number.isFinite(answer) && answer > 0 && String(answer).replace('.', '').length <= 9, `${r.id}: → ${answer}`);
    if (answer >= 10) assert.ok(Number.isInteger(answer), `${r.id}: → ${answer}`);
    else assert.equal(Math.round(answer * 10) / 10, answer, `${r.id}: → ${answer}`);
  }
  assert.deepEqual(closestAnswer('m', 8848.86), { answer: 29032, unit: 'ft' });
  assert.deepEqual(closestAnswer('km2', 342000), { answer: 132047, unit: 'sq mi' });
  assert.deepEqual(closestAnswer('years', 67), { answer: 67, unit: 'years' });
});
