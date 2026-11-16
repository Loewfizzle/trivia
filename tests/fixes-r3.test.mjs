// FIXES R3 — the pass's pins (the browser proofs: tests/integration/city-away-race.mjs, audio-modes.mjs, plate-hug.mjs, room-board.mjs + the
// shots in docs/harbor/passes/fixes-r3.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('GROUP 3 — THE PLAYER PAGE\'s ACTION BAR (the owner\'s option B): ONE bar at the bottom — the friend tube / INVITE · MORE · CLOSE; nothing over the card', () => {
  const pp = read('js/profile/player-page.js'), css = read('css/player.css');
  assert.match(pp, /const bar = h\('div\.pp-bar', \{ role: 'group', 'aria-label': 'Actions' \}, closeBtn\);/, 'loading / limited: CLOSE alone');
  assert.match(pp, /const box = h\('div\.vl-full-in\.pp-in', stage, foot, bar\);/, 'the bar under the card + the blocks — never over the card');
  assert.match(pp, /bar\.replaceChildren\(\.\.\.actions\(D\), closeBtn\);/, 'the card in: the friend tube · MORE · CLOSE');
  assert.match(pp, /const more = tubeButton\('MORE', \{ kind: 'secondary', size: 'sm', cls: 'pp-more', attrs: \{ 'data-press': true/, 'MORE opens the ⋯ menu (press + lift)');
  assert.match(pp, /tubeButton\('INVITE', \{ kind: 'main', size: 'sm', block: true, cls: 'pp-invite'/, 'INVITE in a room');
  assert.match(pp, /BAR_LABELS = Object\.freeze\(\{ none: '\+ FRIEND', out: 'REQUESTED', in: 'ACCEPT', friend: 'FRIENDS', blocked: 'UNBLOCK' \}\)/);
  assert.match(read('js/profile/friends-ui.js'), /const L = o\.labels \|\| LABEL;/, 'the friend tube takes the bar\'s labels');
  assert.doesNotMatch(pp, /pp-dots|pp-acts|DOTS/, 'the separate ⋯ button is gone');
  assert.doesNotMatch(css, /\.pp-dots|\.pp-acts|\.pp-close \{ min-width/, 'its CSS too');
  const bar = css.slice(css.indexOf('.pp-bar {'), css.indexOf('.pp-extra:empty'));
  assert.match(bar, /\.pp-bar \.btn \{[^}]*min-height: 44px;[^}]*border-radius: 9px;/, '44 px tall, squared-off corners (no pills)');
  assert.match(bar, /\.pp-bar \{ position: sticky; bottom: calc\(env\(safe-area-inset-bottom, 0px\) \+ 10px\);/, 'reachable while the page scrolls, above the home bar');
  assert.match(bar, /\.pp-bar > \.pp-main \{ flex: 1\.45 1 0;/, 'the main pink tube a little wider');
  assert.doesNotMatch(bar, /999px/, 'NO PILLS');
});
