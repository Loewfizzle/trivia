// LOAD FIX 4 — THE SKEW WRAPPER (Grok's boot audit #7 + #8): every module loaded AFTER the boot goes through js/ui/lazy-import.js, which
// reloads ONCE onto a new deploy when a lazy import can't link (never mid-match, never a loop); the city's graph (title.js#tryHarbor)
// treats a link error as SKEW at once (no retries) → the watchdog's skew path. The E2E proof: tests/integration/wk-skew.mjs (WebKit,
// THE LINE's deploy switch).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { maySkew, skewVerdict, lazyImport } from '../js/ui/lazy-import.js';
import { GAMES } from '../js/config.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = f => readFileSync(join(ROOT, f), 'utf8');
const files = [];
const scan = d => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) scan(p); else if (n.endsWith('.js')) files.push(relative(ROOT, p).split('\\').join('/')); } };
scan(join(ROOT, 'js'));
// the code without its comments (block comments; full-line // comments; a trailing "// " comment after code)
const code = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').split('\n').map(l => l.replace(/^\s*\/\/.*$/, '').replace(/(^|[\s;,{}()])\/\/ .*$/, '$1')).join('\n');

// THE ALLOW-LIST — the boot's own dynamic imports that skip the wrapper, each for a reason:
const FROZEN = GAMES.filter(g => !g.playable && !g.preview).map(g => `js/games/${g.id}/`);   // (hidden + frozen: never started — their code untouched)
const ALLOWED = [
  { file: 'js/firebase.js', re: /^import\(`\$\{SDK\}\//, why: 'the gstatic SDK — another host, no deploy skew (THE REJOIN LIMIT bounds its wait)' },
  { file: 'js/screens/title.js', re: /^import\('\.\/harbor\/scene\.js'\)/, why: "the city's graph — title.js#tryHarbor's own skew path (#7)" },
  { file: 'js/games/registry.js', re: /^import\('\.\/\w+\/index\.js'\)/, why: 'the cartridges — wrapped where they load (loadGame)' },
];

test('THE SKEW WRAPPER: every dynamic import in js/ goes through lazyImport (the boot\'s own on the allow-list)', () => {
  const strays = [];
  let wrapped = 0;
  for (const f of files) {
    if (FROZEN.some(p => f.startsWith(p)) || f === 'js/ui/lazy-import.js') continue;
    const t = code(read(f));
    const re = /(?<![\w$.])import\(/g;
    let m;
    while ((m = re.exec(t))) {
      if (t.slice(Math.max(0, m.index - 11), m.index) === 'lazyImport(') { wrapped++; continue; }
      const rest = t.slice(m.index, m.index + 80);
      if (ALLOWED.some(a => a.file === f && a.re.test(rest))) continue;
      strays.push(`${f}: ${rest.split('\n')[0]}`);
    }
  }
  assert.deepEqual(strays, [], 'a dynamic import outside the wrapper: write it as lazyImport(import(\'./x.js\'), \'x\') (js/ui/lazy-import.js)');
  assert.ok(wrapped > 250, `the wrapped imports (${wrapped})`);
  assert.match(read('js/games/registry.js'), /lazyImport\(LOADERS\[id\]\(\)/, 'the cartridges load through the wrapper (loadGame)');
});

test('maySkew: link / parse errors + failed fetches may be skew (the deploy id decides); other errors are not', () => {
  assert.ok(maySkew(new SyntaxError("The requested module './dom.js' does not provide an export named 'x'")));
  assert.ok(maySkew(Object.assign(new Error("Importing binding name 'x' is not found."), { name: 'SyntaxError' })));   // (Safari)
  assert.ok(maySkew(new TypeError('Failed to fetch dynamically imported module: http://x/a.js')));
  assert.ok(maySkew(new TypeError('Importing a module script failed.')));   // (Safari's failed fetch)
  assert.ok(!maySkew(new RangeError('x')));
  assert.ok(!maySkew(null));
});

test('skewVerdict: ONE reload per new deploy, never a loop, never without both ids', () => {
  assert.equal(skewVerdict('a1', 'b2', null), 'reload');
  assert.equal(skewVerdict('a1', 'b2', 'b2'), 'done', 'already reloaded for this deploy this session');
  assert.equal(skewVerdict('a1', 'a1', null), 'same', 'the same deploy: the caller reports it as before');
  assert.equal(skewVerdict(null, 'b2', null), 'unknown', 'this page never learned its deploy (local dev / no answer)');
  assert.equal(skewVerdict('a1', null, null), 'unknown', 'no answer now (offline)');
  assert.equal(skewVerdict('b2', 'c3', 'b2'), 'reload', 'a LATER deploy in the same tab gets its own one reload');
});

test('lazyImport passes the import through unchanged (a value in, the same error out)', async () => {
  assert.equal((await lazyImport(Promise.resolve({ x: 1 }), 't')).x, 1);
  const e = new RangeError('boom');
  await assert.rejects(lazyImport(Promise.reject(e), 't'), err => err === e);
});

test("the deploy's id: /api/time answers it (Vercel's commit, none locally); the first answer is the page's (firebase.js#syncTimeNoSocket)", async () => {
  assert.match(read('api/time.js'), /VERCEL_GIT_COMMIT_SHA/);
  assert.doesNotMatch(read('api/time.js'), /^import /m, 'still no imports (a cold start in a few ms)');
  assert.match(read('js/firebase.js'), /noteDeploy\(j && j\.v\)/);
  const prev = process.env.VERCEL_GIT_COMMIT_SHA;
  process.env.VERCEL_GIT_COMMIT_SHA = 'abcdef1234567890';
  const { default: h } = await import(`../api/time.js?v=${Date.now()}`);
  let body = '', heads = {};
  h({ method: 'GET' }, { setHeader: (k, v) => { heads[k] = v; }, end: b => { body = b; } });
  if (prev === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA; else process.env.VERCEL_GIT_COMMIT_SHA = prev;
  const j = JSON.parse(body);
  assert.equal(j.v, 'abcdef123456');
  assert.ok(j.t > 0);
  assert.match(heads['Cache-Control'], /no-store/);
});

test("#7 — the city's graph: a LINK error skips the retries → the watchdog's skew path (the boot's files asked for afresh, then ONE reload)", () => {
  const t = read('js/screens/title.js'), ix = read('index.html');
  assert.match(t, /if \(n >= 3 \|\| linkError\(e\)\) throw e;/);
  assert.match(t, /window\.__boot\.reload\([^;]*\{ skew \}\)/);
  assert.match(ix, /reload: function \(why, o\) \{[^\n]*if \(o && o\.skew\) \{[^\n]*refresh\(\)\.then\(reloadOnce\)/);
  assert.match(ix, /refresh: refresh,/);
});

test('never mid-match: app.js holds the skew reload while a match is on screen (until the room or the podium)', () => {
  assert.match(read('js/app.js'), /holdSkewReload\(\(\) => roomGameOn\(state\) && state\.game\.phase !== 'final' && !!GAME_MODULES\[state\.game\.id\]\)/);
  assert.match(read('js/ui/lazy-import.js'), /while \(hold\(\)\) await/);
});
