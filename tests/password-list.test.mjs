// THE PASSWORD's ANSWER LIST (PW1 — api/_data/pw/, docs/password.md "The list build"): server-only — never served (the local server answers
// 404 like Vercel), never imported by a page; ships with api/daily.js (vercel.json includeFiles); every answer is a word a phone can type
// (valid-5), five lower-case letters, no plural / past tense by the build's rules, nothing on the blocklists, nothing the reviewer cut; the
// server's spelling copy is byte-identical to the public one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';
import { BLOCK_SUB, BLOCK_WORD, KIDSAFE } from '../scripts/pw-words/blocklist.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const J = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const LIST = J('api/_data/pw/answers.json');

test('the list: ~2,000 common five-letter words, lower case, alphabetical, no duplicates; v 1', () => {
  assert.equal(LIST.v, 1);
  assert.ok(LIST.n >= 1300 && LIST.n <= 2600, `${LIST.n} answers`);
  assert.equal(LIST.words.length, LIST.n);
  assert.ok(LIST.words.every(w => /^[a-z]{5}$/.test(w)));
  assert.deepEqual(LIST.words, [...LIST.words].sort(), 'alphabetical — the order says nothing about the schedule');
  assert.equal(new Set(LIST.words).size, LIST.n);
});

test('every answer is a word a phone can type (data/words/valid-5.json), and the server\'s copy of valid-5 is byte-identical', () => {
  const pub = readFileSync(join(ROOT, 'data/words/valid-5.json'), 'utf8').trim();
  const srv = readFileSync(join(ROOT, 'api/_data/pw/valid-5.json'), 'utf8').trim();
  assert.equal(srv, pub);
  const valid = new Set(JSON.parse(pub).match(/.{5}/g));
  assert.deepEqual(LIST.words.filter(w => !valid.has(w)), []);
});

test('kid-safe + Wordle-shaped: nothing on the blocklists, no obvious plural / past tense, every reviewer cut gone, NOT the old answers-5 list', () => {
  const blocked = new Set([...BLOCK_WORD, ...KIDSAFE]);
  assert.deepEqual(LIST.words.filter(w => blocked.has(w) || BLOCK_SUB.some(s => w.includes(s)) || w.startsWith('sex')), []);
  assert.deepEqual(LIST.words.filter(w => /[^s]s$/.test(w) && !/(us|is|ous|ics)$/.test(w) && !['chaos', 'atlas', 'ethos', 'kudos', 'alias', 'basis', 'oasis', 'bonus', 'focus', 'virus', 'lotus', 'minus', 'genus'].includes(w)).filter(w => !/ss$/.test(w)), []);
  assert.deepEqual(LIST.words.filter(w => /[^e]ed$/.test(w) && !/eed$/.test(w)).slice(0, 10), []);
  const cuts = J('scripts/pw-words/cuts.json');
  assert.ok(Array.isArray(cuts.cut) && cuts.cut.length >= 100, `the reviewer cut ${cuts.cut.length}`);
  const cutSet = new Set(cuts.cut.map(w => w.toLowerCase()));
  assert.deepEqual(LIST.words.filter(w => cutSet.has(w)), []);
  const old = new Set(JSON.parse(readFileSync(join(ROOT, 'data/words/answers-5.json'), 'utf8')).match(/.{5}/g));
  assert.ok(LIST.words.some(w => !old.has(w)) && [...old].some(w => !LIST.words.includes(w)), 'its own list, not data/words/answers-5.json');
});

test('NEVER SERVED: the local server (Vercel\'s rules) answers 404 for api/_data/pw — and the look pages\' door never opens it', async () => {
  const port = 41000 + Math.floor(Math.random() * 20000);
  const srv = spawn(process.execPath, ['scripts/serve.mjs', String(port)], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise((ok, bad) => { srv.stdout.on('data', d => { if (/serving/.test(String(d))) ok(); }); srv.on('exit', () => bad(new Error('server exited'))); setTimeout(() => bad(new Error('server start timeout')), 8000); });
    const get = p => fetch(`http://127.0.0.1:${port}${p}`).then(r => r.status);
    for (const f of ['answers.json', 'valid-5.json']) {
      assert.equal(await get(`/api/_data/pw/${f}`), 404, f);
      assert.equal(await get(`/API/_data/pw/${f}`), 404, `${f} (upper case)`);
      assert.equal(await get(`/api/%5Fdata/pw/${f}`), 404, `${f} (encoded)`);
      assert.equal(await get(`/__dev/api-lib/../_data/pw/${f}`), 404, `${f} (through the door)`);
    }
    assert.equal(await get('/api/_lib/pw.js'), 404); assert.equal(await get('/api/_lib/pw-day.js'), 404);
    assert.equal(await get('/data/words/valid-5.json'), 200, 'the public spelling list stays reachable');
  } finally { srv.kill(); }
});

test('NO PAGE IMPORTS IT: no file the site ships names api/_data/pw or the server libs; vercel.json ships it with api/daily.js', () => {
  const hits = [];
  // (a page may NAME the server files in a comment — never import or fetch one)
  const bad = /(from\s+['"][^'"\n]*|import\(['"][^'"\n]*|fetch\([^\n]*)(_data\/pw|_lib\/pw|pw-day\.js)/;
  const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (['.js', '.css', '.html', '.json', '.webmanifest'].includes(extname(p)) && bad.test(readFileSync(p, 'utf8'))) hits.push(p.slice(ROOT.length)); } };
  walk(join(ROOT, 'js')); walk(join(ROOT, 'css')); walk(join(ROOT, 'data'));
  for (const f of readdirSync(ROOT)) if (['.html', '.js', '.webmanifest'].includes(extname(f)) && bad.test(readFileSync(join(ROOT, f), 'utf8'))) hits.push(f);
  assert.deepEqual(hits, []);
  // the game's own files name the list only in words (never an import or a fetch of it)
  for (const f of readdirSync(join(ROOT, 'js/games/password'))) assert.doesNotMatch(readFileSync(join(ROOT, 'js/games/password', f), 'utf8'), /(import|fetch)[^\n]*_data/, f);
  const vercel = J('vercel.json');
  assert.match(String(vercel.functions['api/daily.js'].includeFiles || ''), /api\/_data\/pw\//, 'includeFiles ships the list with the function');
  assert.ok(!vercel.rewrites && !vercel.routes, 'no rewrite that could expose api/');
  assert.ok(existsSync(join(ROOT, 'api/_data/pw/answers.json')));
});
