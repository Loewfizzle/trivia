// C2 — THE PREVIEW PANEL REWORK (core/harbor-remote.js, PURE): the nine sections, every row in one, the search, the delay.
// (The registry's own checks + the areas: tests/harbor.test.mjs; the sheet itself: e2e-harbor.mjs ONLY=panel.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS, PANEL_EVENTS, CATS, SECTIONS, AREA_SECTION, sectionOf, toSection, blockOf, normQ, matchQuery, eventText, DELAYS, DEFAULT_DELAY, cleanDelay, checkRegistry, cleanRemote } from '../js/core/harbor-remote.js';
import { MOMENTS } from '../js/core/harbor-moments.js';

test('the panel: nine sections in the owner\'s order; every area + every row lands in one; nothing dropped', () => {
  assert.deepEqual(SECTIONS.map(s => s.label), ['SKY', 'LEGENDARY', 'HOLIDAYS', 'PEOPLE + WORKERS', 'WILDLIFE', 'HARBOR', 'WEATHER', 'TIME', 'LIGHTS + MUSIC', 'TOOLS']);
  const ids = new Set(SECTIONS.map(s => s.id));
  for (const c of CATS) assert.ok(ids.has(AREA_SECTION[c.id]), `${c.id}: its section`);
  for (const e of EVENTS) assert.ok(ids.has(sectionOf(e.id)), `${e.id}: a section`);
  assert.deepEqual(checkRegistry(), []);
  // every section holds rows (its own controls: time, holidays, weather, party, music, pulse, tools, sounds — or events)
  const own = { time: 1, weather: 1, lightsmusic: 1, tools: 1 };
  for (const s of SECTIONS) assert.ok(own[s.id] || PANEL_EVENTS.some(e => sectionOf(e.id) === s.id), `${s.id}: not empty`);
  assert.equal(sectionOf('nope'), 'tools', 'an unknown id → TOOLS, never lost');
});

test('the panel: the mapping — the legendaries together, the birds with the wildlife, the people + the windows with the workers', () => {
  for (const id of ['ufo', 'tr3b', 'raid', 'window-tango']) assert.equal(sectionOf(id), 'legendary', id);
  for (const id of ['geese', 'swifts', 'bats-dusk', 'heron-sky', 'pigeons', 'coyote']) assert.equal(sectionOf(id), 'wildlife', id);
  // (11a-1: THE HOLIDAYS — Halloween's + Day of the Dead's moments together; the ghost ship with the legendaries)
  for (const id of ['bats', 'witch', 'trick-or-treat', 'zombies', 'black-cat', 'procession', 'monarchs']) assert.equal(sectionOf(id), 'holidays', id);
  assert.equal(sectionOf('ghost-ship'), 'legendary');
  for (const id of ['line', 'bus', 'dance', 'doors', 'no-people', 'work-milk', 'no-work']) assert.equal(sectionOf(id), 'people', id);
  for (const m of MOMENTS) assert.equal(sectionOf(`window-${m.id}`), m.rarity === 'legendary' ? 'legendary' : 'people', m.id);
  for (const id of ['taxi', 'rosie-turn', 'ships-bell', 'season-winter', 'road-pass', 'wet-street', 'centrepiece-test']) assert.equal(sectionOf(id), 'harbor', id);
  for (const id of ['rainbow', 'moonbow', 'lightning', 'sundogs']) assert.equal(sectionOf(id), 'weather', id);
  for (const id of ['spell', 'searchlights', 'neon-party', 'beams', 'burnout', 'first-tap', 'strings-party', 'hushsign', 'lamps-on']) assert.equal(sectionOf(id), 'lightsmusic', id);
  for (const id of ['drones', 'banner', 'jets', 'flyby', 'aurora', 'fireworks', 'satellites']) assert.equal(sectionOf(id), 'sky', id);
  // the old category ids still open their section (the shots' + the tests' openCats(['lights']))
  assert.equal(toSection('lights'), 'lightsmusic'); assert.equal(toSection('sounds'), 'tools'); assert.equal(toSection('holidays'), 'holidays');
  assert.equal(toSection('promenade'), 'harbor'); assert.equal(toSection('legendary'), 'legendary'); assert.equal(toSection('nope'), null);
  // the block headings name their area where a group alone would be unclear
  assert.equal(blockOf('work-milk'), 'WORKERS · MORNING'); assert.equal(blockOf('window-cat'), 'WINDOWS · UNCOMMON'); assert.equal(blockOf('ufo'), 'IN THE SKY');
  // the ids, the links and the server are untouched: every row still validates
  assert.deepEqual(cleanRemote({ force: ['ufo', 'raid', 'geese', 'line'] }).bad, []);
});

test('the panel SEARCH: case, accents and hyphens ignored; every word must START a word (rain ≠ train)', () => {
  assert.equal(normQ('  Café  F-22 ’s '), "cafe f22 's");
  assert.ok(matchQuery('rain', 'RAIN weather'));
  assert.ok(matchQuery('rain', eventText('rainbow')));
  assert.ok(!matchQuery('rain', eventText('satellites')), 'the satellite tRAIN is not rain');
  assert.ok(matchQuery('f22', eventText('flyby')) && matchQuery('F-22', eventText('jets')));
  assert.ok(matchQuery('police', eventText('raid')) && matchQuery('alien', eventText('ufo')));
  assert.ok(matchQuery('legend', eventText('tr3b')), 'a section name finds its rows');
  assert.ok(matchQuery('milk truck', eventText('work-milk')) && !matchQuery('milk boat', eventText('work-milk')), 'every word must match');
  assert.ok(!matchQuery('', 'anything') && !matchQuery('   ', 'anything'), 'an empty box matches nothing (the panel shows everything then)');
});

test('the panel DELAY: NOW / 3 S / 5 S, 3 by default; the server takes whole seconds 0–10', () => {
  assert.deepEqual(DELAYS, [0, 3, 5]); assert.equal(DEFAULT_DELAY, 3);
  assert.equal(cleanDelay(undefined), 0); assert.equal(cleanDelay(''), 0); assert.equal(cleanDelay(3), 3); assert.equal(cleanDelay('5'), 5); assert.equal(cleanDelay(10), 10);
  for (const bad of [-1, 11, 1.5, 'x', 60, {}]) assert.equal(cleanDelay(bad), null, String(bad));
});
