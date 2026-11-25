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

test('THE BOARD\'s tab row (the owner\'s Nov 22 11:15 am entry): full names on one line, a sideways row through THE NEON TABS', () => {
  const v = read('js/board/view.js'), nt = read('js/ui/neon-tabs.js'), css = read('css/board.css'), comp = read('css/components.css');
  assert.match(v, /const TAB_NAMES = Object\.freeze\(\{ xp: 'XP', dailies: 'DAILIES' \}\);/, 'PRISM DROP by its full name (no PRISM short)');
  assert.match(v, /cls: 'bd-tabs', btnCls: 'bd-tab', scroll: true,/, 'the games row scrolls sideways');
  assert.ok(!/\.bd-tabs \.nt-tab\[data-id='highrise'\] span/.test(css), 'HIGH RISE no longer stacked HIGH / RISE');
  assert.match(css, /\.bd-tabs \.nt-tab \{ padding: 0 11px; font-size: 13px;/, 'the labels a size up (10.5 → 13 px)');
  assert.match(comp, /\.nt-tabs\.is-scroll \{ overflow-x: auto;[^}]*overscroll-behavior-x: contain;/, 'never a page-level sideways scroll');
  assert.match(comp, /\.nt-tabs\.is-scroll\.is-fade-r \{/, 'a fade where more tabs sit');
  assert.match(nt, /new IntersectionObserver\(/, 'the fades from an observer — never a layout read in a scroll handler');
  assert.match(nt, /if \(moved && seen\) reveal\(true\);/, 'the picked tab scrolled into view at a pick');
  assert.match(nt, /'data-press': true/, 'THE TAP WATCH (a fling\'s stop never acts)');
});

test('a SOLO end screen\'s way out reads HOME (the house icon stays); a match keeps ROOM', () => {
  const f = read('js/ui/final.js');
  assert.match(f, /finIcon\('city'\), h\('span', 'HOME'\)\) : back;/);
  assert.match(f, /finIcon\('room'\), h\('span', 'ROOM'\)\);/);
});

test('THE CONTROLLER MARK (the owner\'s Nov 24 7:20 pm entry): ONE flag a game in metas.js, ONE svg; JAYWALK on, HIGH RISE not yet', async () => {
  const { META } = await import('../js/games/metas.js');
  assert.equal(META.jaywalk.CONTROLLER, true);
  assert.ok(!META.highrise.CONTROLLER, 'HIGH RISE has no wirePad yet — its own chat sets the flag');
  for (const [id, row] of Object.entries(META)) if (row.CONTROLLER) assert.match(read(`js/games/${id}/view.js`), /wirePad/, `${id}: the flag only with a wired pad`);
  assert.match(read('js/ui/components.js'), /^  pad: svg\('/m, 'the ONE mark (ICONS.pad)');
  const t = read('js/screens/title-taps.js');
  assert.match(t, /function padOk\(g\) \{ return !!\(META\[g\.id\] && META\[g\.id\]\.CONTROLLER === true\); \}/);
  assert.match(t, /'One phone per player\. Play solo now, or open a room for friends\.'/);
  assert.match(t, /games\.some\(padOk\) \? h\('p\.sh-note\.is-small\.nd-shelf-pad', padMark\(\), h\('span', 'Controller ready — pair a Bluetooth or USB controller to play\.'\)\) : null/);
});
