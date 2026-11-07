// OVERCLOCK — THE DAILY RESERVE (OC6 + OC7 — docs/cartridge.md D2): ~20% of every pool lives SERVER-ONLY in api/_data/oc-reserve/. Proof:
// the local server (scripts/serve.mjs — it serves like Vercel: api/ is functions only) answers 404 for it; no file the site ships names it;
// party play never sees it (the shipped pools hold none of its ids — overclock-content.test.mjs); and the daily's content splits into what a
// phone may see (no answer in it) + the server's key.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';
import { dayContent, publicOf, answersOf, daySetProblems, POOLED } from '../js/games/overclock/daily.js';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const RES = 'api/_data/oc-reserve';
const FILES = ['truefalse.json', 'higherlower.json', 'timeline.json', 'sortit.json', 'trivia.json', 'closest.json', 'missinglink.json', 'spellcheck.json'];
const J = p => JSON.parse(readFileSync(p, 'utf8'));

test('THE RESERVE exists: eight server-only pools (OC6 four + OC7 four), the same shapes as the party files, ~20% of each', () => {
  for (const f of FILES) assert.ok(existsSync(`${RES}/${f}`), f);
  const share = (a, b) => a / (a + b);
  const tf = [J(`${RES}/truefalse.json`).items.length, J('data/oc/truefalse.json').items.length];
  const n = gs => gs.reduce((s, g) => s + g.items.length, 0);
  const hl = [n(J(`${RES}/higherlower.json`).stats), n(J('data/oc/higherlower.json').stats)];
  const tl = [n(J(`${RES}/timeline.json`).themes), n(J('data/oc/timeline.json').themes)];
  const so = [J(`${RES}/sortit.json`).sets.length, J('data/oc/sortit.json').sets.length];
  const len = (f, k) => [J(`${RES}/${f}`)[k].length, J(`data/oc/${f}`)[k].length];
  const tv = len('trivia.json', 'items'), cc = len('closest.json', 'questions'), ml = len('missinglink.json', 'puzzles'), sp = len('spellcheck.json', 'words');
  for (const [name, [r, p]] of Object.entries({ tf, hl, tl, so, tv, cc, ml, sp })) {
    const s = share(r, p);
    assert.ok(s > 0.12 && s < 0.28, `${name}: ${Math.round(s * 100)}% in the reserve`);
  }
});

test('NEVER SERVED: the local server (Vercel\'s rules) answers 404 for the reserve + api/_lib; the party pools stay reachable', async () => {
  const port = 40000 + Math.floor(Math.random() * 20000);
  const srv = spawn(process.execPath, ['scripts/serve.mjs', String(port)], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise((ok, bad) => { srv.stdout.on('data', d => { if (/serving/.test(String(d))) ok(); }); srv.on('exit', () => bad(new Error('server exited'))); setTimeout(() => bad(new Error('server start timeout')), 8000); });
    const get = p => fetch(`http://127.0.0.1:${port}${p}`).then(r => r.status);
    for (const f of FILES) {
      assert.equal(await get(`/api/_data/oc-reserve/${f}`), 404, f);
      assert.equal(await get(`/API/_data/oc-reserve/${f}`), 404, `${f} (upper case)`);
      assert.equal(await get(`/api/%5Fdata/oc-reserve/${f}`), 404, `${f} (encoded)`);
      assert.equal(await get(`/data/oc/${f}`), 200, `the party pool ${f}`);
    }
    assert.equal(await get('/api/_lib/catalog.js'), 404, 'api/_lib too');
  } finally { srv.kill(); }
});

test('NO PAGE IMPORTS IT: no file the site ships names the reserve; vercel.json has no rewrite that could expose api/', () => {
  const hits = [];
  const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (['.js', '.css', '.html', '.json', '.webmanifest'].includes(extname(p)) && /oc-reserve|_data\//.test(readFileSync(p, 'utf8'))) hits.push(p.slice(ROOT.length)); } };
  walk(join(ROOT, 'js')); walk(join(ROOT, 'css')); walk(join(ROOT, 'data'));
  for (const f of readdirSync(ROOT)) if (['.html', '.js', '.webmanifest'].includes(extname(f)) && /oc-reserve|_data\//.test(readFileSync(join(ROOT, f), 'utf8'))) hits.push(f);
  // (daily.js NAMES the folder in its doc comment for the daily module — a comment, never an import or a fetch)
  const real = hits.filter(h => !/games[\\/]overclock[\\/]daily\.js$/.test(h));
  assert.deepEqual(real, []);
  assert.doesNotMatch(readFileSync('js/games/overclock/daily.js', 'utf8'), /(import|fetch)[^\n]*oc-reserve/);
  const vercel = J('vercel.json');
  assert.ok(!vercel.rewrites && !vercel.routes && !vercel.redirects, 'no rewrite / route / redirect');
  assert.ok(!/^\/?api/m.test(readFileSync('.vercelignore', 'utf8')), 'api/ stays in the deploy (the daily module\'s functions read it)');
});

test('THE DAILY\'s content: a day set pointing into the reserve → SHOW (the texts only) + KEY (the answers) — the phone never gets an answer', () => {
  const pools = {
    truefalse: J(`${RES}/truefalse.json`).items, higherlower: J(`${RES}/higherlower.json`).stats,
    timeline: J(`${RES}/timeline.json`).themes, sortit: J(`${RES}/sortit.json`).sets,
  };
  // one per brain category: words · numbers · memory · visual · knowledge (TRUE OR FALSE) · reflex (SORT IT)
  const ds = {
    v: 1, day: '2026-11-07', seed: 'opaque-server-seed-xyz', order: ['unscramble', 'math', 'memory', 'oddone', 'truefalse', 'sortit'],
    deal: { 4: pools.truefalse.slice(0, 4).map(r => r.id), 5: [pools.sortit[0].id] },
  };
  assert.deepEqual(daySetProblems(ds), []);
  const { show, key } = dayContent(ds, pools);
  assert.deepEqual(Object.keys(show).sort(), ['4', '5']);
  // T/F: the reserve's facts, texts only
  const ids = new Set(pools.truefalse.slice(0, 4).flatMap(r => [r.t, r.f]));
  assert.equal(show[4].items.filter(it => ids.has(it.text)).length, 4, 'the four dealt reserve facts');
  for (const it of show[4].items) assert.deepEqual(Object.keys(it), ['text']);
  assert.equal(key[4].length, 8);
  assert.ok(key[4].every(x => typeof x === 'boolean'));
  // SORT IT: the cards, never their sides
  assert.equal(show[5].cards.length, 12);
  assert.ok(show[5].cards.every(c => typeof c === 'string'));
  assert.ok(key[5].every(s => s === 0 || s === 1));
  // no answer field anywhere in what a phone gets
  assert.doesNotMatch(JSON.stringify(show), /"(truth|s|ans|value|values|up)":/);
  // OC7 — TRIVIA (the questions + their four answers, never which is right) · SPELLCHECK (the four spellings, never the right one) ·
  // CLOSEST CALL (the question + its unit, never the number) · MISSING LINK (the three words, never the link) — from the reserve
  const p7 = {
    ...pools, trivia: J(`${RES}/trivia.json`).items, closest: J(`${RES}/closest.json`).questions,
    missinglink: J(`${RES}/missinglink.json`).puzzles, spellcheck: J(`${RES}/spellcheck.json`).words,
  };
  const ds1 = { v: 1, day: '2026-11-08', seed: 'opaque-server-seed-oc7a', order: ['spellcheck', 'math', 'memory', 'oddone', 'trivia', 'stroop'],
    deal: { 0: p7.spellcheck.slice(0, 5).map(r => r.id), 4: [p7.trivia[0].id, p7.trivia[1].id, p7.trivia[2].id] } };
  const ds2 = { v: 1, day: '2026-11-09', seed: 'opaque-server-seed-oc7b', order: ['missinglink', 'math', 'memory', 'count', 'closest', 'stroop'],
    deal: { 0: [p7.missinglink[0].id, p7.missinglink[1].id], 4: [p7.closest[0].id] } };
  for (const d of [ds1, ds2]) assert.deepEqual(daySetProblems(d), []);
  const c1 = dayContent(ds1, p7), c2 = dayContent(ds2, p7);
  assert.deepEqual(c1.show[4].questions.map(q => q.q), p7.trivia.slice(0, 3).map(r => r.q), 'the three reserve questions');
  assert.ok(c1.show[4].questions.every(q => q.a.length === 4 && q.c === undefined));
  assert.deepEqual(c1.key[4].map((c, i) => c1.show[4].questions[i].a[c]), p7.trivia.slice(0, 3).map(r => r.a), 'the key = the right answers');
  assert.deepEqual(c1.show[0].items.map(it => it.options.slice().sort()), p7.spellcheck.slice(0, 5).map(r => [r.right, ...r.wrong].sort()));
  assert.deepEqual(c1.key[0].map((k, i) => c1.show[0].items[i].options[k.ans]), p7.spellcheck.slice(0, 5).map(r => r.right));
  assert.equal(c2.show[4].q, p7.closest[0].q);
  assert.ok(c2.key[4].answer > 0);
  assert.deepEqual(c2.show[0].puzzles.map(p => p.words.slice().sort()), p7.missinglink.slice(0, 2).map(r => r.clues.map(c => c[0]).sort()));
  assert.deepEqual(c2.key[0].map(k => k.answer), p7.missinglink.slice(0, 2).map(r => r.answer));
  for (const c of [c1, c2]) assert.doesNotMatch(JSON.stringify(c.show), /"(truth|s|ans|c|answer|word|common|hard|joins|alt|value|values|up)":/);
  // the other two pooled challenges: shown without their values
  const pubTL = publicOf({ type: 'timeline', parts: 4, title: 'T', ask: 'a', dir: 'EARLIEST → LATEST', items: [{ label: 'a', value: '1900' }, { label: 'b', value: '1950' }, { label: 'c', value: '1990' }, { label: 'd', value: '2010' }], shown: [2, 0, 3, 1] });
  assert.deepEqual(pubTL.labels, ['c', 'a', 'd', 'b']);
  assert.doesNotMatch(JSON.stringify(pubTL), /19|20\d\d/);
  const pubHL = publicOf({ type: 'higherlower', parts: 1, pairs: [{ stat: 'S', ask: 'Q?', unit: 'm', a: { name: 'A', v: 10, shown: null }, b: { name: 'B', v: 30, shown: null }, ans: 1 }] });
  assert.equal(pubHL.pairs[0].b.v, undefined, 'the hidden value stays on the server');
  assert.deepEqual(answersOf({ type: 'higherlower', pairs: [{ a: { v: 10 }, b: { v: 30, shown: null } }] }), [{ up: true, v: 30, shown: null }]);
  assert.deepEqual(POOLED, ['truefalse', 'higherlower', 'timeline', 'sortit', 'trivia', 'closest', 'missinglink', 'spellcheck']);
});
