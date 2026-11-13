// THE POOL FIXES — the owner's add-on 3 (Nov 13, 1:41–2:10 pm): WHO'S ON in both places (the LEDGER's sheet + /admin STATS) = STATIC CARDS
// (each strip its baked still / CSS art — no effect surface, no CSS animation), ONE card width with a fixed place column, /admin's section on
// its OWN class (it borrowed the player block's flex row), and GAMES PLAYED = the playable games + any game with plays in the period.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const R = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('WHO\'S ON draws STATIC cards: no effect surface, no stripFx; the list stops every CSS animation inside it', () => {
  const js = R('js/ui/whos-on.js'), css = R('css/components.css');
  assert.doesNotMatch(js, /stripFx\(|createSurface\(/);
  assert.match(js, /stripFor\(/, 'still the ONE strip system (ui/strip-board.js)');
  assert.match(js, /classList\.add\('is-still'\)/);
  assert.match(css, /\.wo-list\.is-still \*[^{]*\{[^}]*animation: none !important/);
});

test('ONE card width: the PLACE column is the fixed one, every card takes the same rest (never a fixed narrow card — the hero spot needs room)', () => {
  const css = R('css/components.css');
  assert.match(css, /\.wo-row \{ --wo-meta-w: \d+px; display: grid; grid-template-columns: minmax\(0, 1fr\) var\(--wo-meta-w\)/);
  assert.match(css, /\.wo-part \{ display: inline-block; \}/);
});

test('/admin STATS: WHO\'S ON on its own class (a block — the heading over full-width rows); GAMES PLAYED = playable + any with plays', () => {
  const js = R('js/admin/admin.js'), css = R('css/admin.css');
  assert.match(js, /section\.ad-whoson/);
  assert.doesNotMatch(js, /h\('section\.ad-who',/);
  assert.match(css, /\.ad-whoson \{ display: block;/);
  assert.match(js, /\.filter\(r => r\.on \|\| r\.n > 0\)/);
});
