// THE CDN HOTFIX (Nov 12 — Vercel's edge requests at 1M / 1M on the free plan): THE EDGE CACHE back early (docs/launch.md step 8) + the city's
// idle polls cut — each poll is one edge request. These pin the numbers so a later pass can't drift them back up by accident.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const remote = fs.readFileSync('js/screens/harbor/remote.js', 'utf8');

test('the preview panel / radio feed poll: 5 min (not 45 s), only visible + focused, a return re-asks only after 60 s', () => {
  assert.match(remote, /const POLL_MS = EMU_POLL \? 1500 : 300_000;/);
  assert.match(remote, /const BACK_MIN_MS = EMU_POLL \? 0 : 60_000;/);
  assert.match(remote, /export const onScreen = \(\) => \{ try \{ return document\.visibilityState === 'visible' && \(typeof document\.hasFocus !== 'function' \|\| document\.hasFocus\(\)\)/);
  const poll = remote.slice(remote.indexOf('async function poll()'), remote.indexOf('function listenLive()'));
  assert.match(poll, /if \(onScreen\(\)\) \{\s*polledAt = Date\.now\(\);\s*try \{\s*const r = await fetch\('\/api\/admin\?live=1'/, 'the fetch only on screen');
  assert.match(poll, /Date\.now\(\) - polledAt >= BACK_MIN_MS\) poll\(\)/, 'a return re-asks only when the last read is old');
  assert.match(poll, /window\.addEventListener\('focus', onVis\)/);
});

test('the city\'s hello: 5 min (not 2), only on screen; back on screen still says hello (≥ 60 s since the last)', () => {
  assert.match(remote, /const HELLO_MS = 300e3, HELLO_BACK_MS = 60e3;/);
  assert.match(remote, /if \(onScreen\(\) && api\) \{ helloAt = Date\.now\(\); api\('admin', \{ action: 'radioHello', w: whereNow\(\) \}\)\.then\(afterHello/, 'PLAY NOW — WHO IS ON: the same hello carries where the phone is (no new call)');
  assert.match(remote, /helloT = setTimeout\(hello, HELLO_MS \* \(0\.9 \+ Math\.random\(\) \* 0\.2\)\)/);
  assert.match(remote, /const helloBack = \(\) => \{ if \(!destroyed && !TEST_PANEL && onScreen\(\) && helloT && Date\.now\(\) - helloAt >= HELLO_BACK_MS\) \{ clearTimeout\(helloT\); helloT = setTimeout\(hello, 1500\); \} \};/);
  assert.ok(!/120e3 \* \(0\.9/.test(remote), 'the old ~2-min hello is gone');
});

test('the server windows follow the 5-min hello: the NIXIE 6 min, the sightings\' city-open trail 6 min (≥ the longest gap, 5.5 min)', async () => {
  assert.match(fs.readFileSync('api/_lib/radio.js', 'utf8'), /const HERE_MS = 360e3;/);
  const { OPEN_TRAIL_MS, CITY_GAP_MS, openStep, cityOpenAt, stampBehind } = await import('../js/core/sightings.js');
  assert.ok(OPEN_TRAIL_MS >= 300e3 * 1.1, 'a tap just before the next hello is covered at once (no no_stamp wait)');
  assert.ok(CITY_GAP_MS > 300e3 * 1.1);
  let co = openStep(null, 0); co = openStep(co, 330e3);
  assert.deepEqual([co.a, co.b], [0, 330e3], 'two hellos 5.5 min apart = one opening');
  assert.ok(cityOpenAt(co, 330e3 + 320e3) && !stampBehind(co, 330e3 + 320e3), 'a tap 5 min 20 s after the latest hello: covered, answered at once');
});

test('THE EDGE CACHE is live again (reverted early): /assets 5 min at the edge; /js + /css revalidate (ONE BUILD PER PAGE); the worker one copy per deploy', () => {
  const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const cc = src => { const r = cfg.headers.find(x => x.source === src); const h = r && r.headers.find(x => x.key === 'Cache-Control'); return h ? h.value : null; };
  assert.equal(cc('/assets/(.*)'), 'public, max-age=300, stale-while-revalidate=86400');
  // (PLAY NOW — Group 0a: the code's stale-while-revalidate let a load the worker didn't control boot on a day-old music.js beside a new
  //  file; a warm visit is the worker's (no request leaves the phone) — the header only reaches an uncontrolled load: 5 min fresh, never a day-old copy)
  for (const d of ['js', 'css']) assert.equal(cc(`/${d}/(.*)`), 'public, max-age=300', d);
  const sw = fs.readFileSync('sw.js', 'utf8');
  assert.match(sw, /const BUILD_PREFIX = 'na-b-'/);
  assert.match(sw, /const STORE_WAIT_MS = 800, ACTIVATE_STORE_MS = 2000;/, 'the two-tab bounds kept');
});
