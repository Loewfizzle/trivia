// THE CITY POLISH PASS (Nov 24) — the pass's pinned facts that are not THE PLAY BOUNCE's (tests/play-bounce.test.mjs): THE BOOT's cache line,
// the first bakes held under the boot screen, the people's staged plan, three.js's readable build.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { htmlV } from '../scripts/build-boot-bundle.mjs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('THE BOOT CACHE: /boot-bundle.json is fetched by its own hash and kept a year (immutable); /js /css /assets — fetched by plain paths — stay ≤ 5 min', () => {
  const b = JSON.parse(read('boot-bundle.json'));
  assert.equal(htmlV(read('index.html')), b.v, "index.html's loader asks for boot-bundle.json?v=<the bundle's own hash> (node scripts/build-boot-bundle.mjs)");
  const rules = JSON.parse(read('vercel.json')).headers;
  const cc = src => ((rules.find(r => r.source === src) || {}).headers || []).find(h => h.key === 'Cache-Control');
  assert.equal(cc('/boot-bundle.json').value, 'public, max-age=31536000, immutable');
  for (const src of ['/js/(.*)', '/css/(.*)', '/assets/(.*)']) assert.match(cc(src).value, /max-age=300\b/, `${src}: the modules / sheets / pictures are asked for WITHOUT a version — never immutable`);
  assert.ok(!/import\([^)]*\?v=/.test(read('js/app.js')), 'the modules carry no ?v= (why /js stays at 300)');
});

test('THE SCHOOL CHROMEBOOKS: a late reveal waits (≤ REVEAL_MAX + 2 s) for the FIRST bakes under the boot screen', () => {
  const s = read('js/screens/harbor/scene.js');
  assert.match(s, /const firstBakeDue = \(\) => baker\.bakes < 1 \|\| litBaker\.bakes < 1 \|\| \(baker\.bakes <= 1 && baker\.pending\) \|\| \(litBaker\.bakes <= 1 && litBaker\.pending\);/);
  assert.match(s, /let late = on > REVEAL_MAX && !\(\(\(baker\.bakes >= 1 && bakeCamShown !== camSig\) \|\| firstBakeDue\(\) \|\|[^\n]*&& on < REVEAL_MAX \+ 2000\);/, 'bounded like every other hold');
});

test('THE BOOT: the people\'s staged first plan runs its blocks back to back (a task each), never one a frame', () => {
  const p = read('js/screens/harbor/people.js');
  const fn = p.slice(p.indexOf('function stageRun('), p.indexOf('function stageRun(') + 900);
  assert.match(fn, /if \(step\) stageRun\(t, ctx, Mw\); else stageBusy = false;/);
  assert.match(p, /if \(!stageBusy\) \{ stageBusy = true; stageRun\(t, ctx, M\); \}/);
});

test('three.js stays the READABLE r160 build everywhere (the minified one allocates a closure every draw — HIGH RISE zero-garbage)', () => {
  for (const f of ['index.html', 'highrise-play.html', 'jaywalk-lab.html']) {
    const t = read(f);
    assert.ok(!/three\.module\.min\.js/.test(t), `${f}: never three.module.min.js`);
    if (/three@/.test(t)) assert.match(t, /three@0\.160\.0\/build\/three\.module\.js/, `${f}: three@0.160.0/build/three.module.js`);
  }
});

test('THE RETURN-VISIT POWER-ON: DEFAULT OFF — the full power-on on every return unless this phone asked ?poweron=short (remembered; ?poweron=full undoes it)', () => {
  const t = read('js/screens/title.js');
  assert.match(t, /return localStorage\.getItem\(RET\) === 'short';/, 'only an explicit ask turns it on');
  assert.match(t, /const back = store\(sessionStorage, BACK\) === '1' \|\| shortReturn\(\);/);
  assert.match(t, /else \{ if \(!reduced\(\)\) cityPowerOn\(\); run\(FULL, 'full'\); \}/, 'the full sequence stays the default');
});
