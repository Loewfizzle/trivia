// C2 — THE PREVIEW PANEL REWORK (core/harbor-remote.js, PURE): the nine sections, every row in one, the search, the delay.
// (The registry's own checks + the areas: tests/harbor.test.mjs; the sheet itself: e2e-harbor.mjs ONLY=panel.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { momentHour, itemWhen, EVENTS, PANEL_EVENTS, CATS, SECTIONS, AREA_SECTION, sectionOf, toSection, blockOf, normQ, matchQuery, eventText, DELAYS, DEFAULT_DELAY, cleanDelay, checkRegistry, cleanRemote, PLAY_ALL, playlistOf, eventDef, WEATHER, WEATHER_GROUPS } from '../js/core/harbor-remote.js';
import { MOMENTS } from '../js/core/harbor-moments.js';

test('the panel: eleven sections in the owner\'s order (WIN: SPEAKEASY of its own); every area + every row lands in one; nothing dropped', () => {
  assert.deepEqual(SECTIONS.map(s => s.label), ['SKY', 'LEGENDARY', 'SPEAKEASY', 'HOLIDAYS', 'PEOPLE + WORKERS', 'WILDLIFE', 'HARBOR', 'WEATHER', 'TIME', 'LIGHTS + MUSIC', 'TOOLS']);
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
  for (const id of ['bus', 'dance', 'work-milk']) assert.equal(sectionOf(id), 'people', id);
  // (WIN: THE SPEAKEASY's own section — the windows, the signs, the door; the off-switches + the debug pieces in TOOLS)
  for (const id of ['line', 'doors', 'hushsign', 'strings-party', 'smoke']) assert.equal(sectionOf(id), 'speakeasy', id);
  for (const id of ['no-people', 'no-work', 'no-wildlife', 'no-dance', 'no-halo', 'lamps-off', 'centrepiece-test', 'first-tap']) assert.equal(sectionOf(id), 'tools', id);
  for (const m of MOMENTS) assert.equal(sectionOf(`window-${m.id}`), m.rarity === 'legendary' ? 'legendary' : 'speakeasy', m.id);
  for (const id of ['taxi', 'rosie-turn', 'ships-bell', 'season-winter', 'road-pass', 'wet-street']) assert.equal(sectionOf(id), 'harbor', id);
  for (const id of ['rainbow', 'moonbow', 'lightning', 'sundogs']) assert.equal(sectionOf(id), 'weather', id);
  for (const id of ['spell', 'searchlights', 'neon-party', 'beams', 'burnout', 'lamps-on']) assert.equal(sectionOf(id), 'lightsmusic', id);
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

test('WIN — PLAY ALL: a playlist per catalogue — every window moment once (the day ones first, then the night ones), each its full length; the holidays on their night; the off-switches never in it', () => {
  const w = playlistOf('windows');
  assert.deepEqual(w.map(i => i.id).sort(), MOMENTS.map(m => `window-${m.id}`).sort(), 'every moment once');
  const firstNight = w.findIndex(i => i.night); assert.ok(firstNight > 0 && w.slice(firstNight).every(i => i.night) && w.slice(0, firstNight).every(i => !i.night), 'day first, then night');
  for (const i of w) { const m = MOMENTS.find(x => `window-${x.id}` === i.id); assert.ok(i.len >= m.len + 3 && i.len <= m.len + 5, `${i.id}: its full length + the loop's gap`); assert.equal(i.hol, m.holiday || null); }
  for (const kind of ['holidays', 'wildlife', 'workers']) { const l = playlistOf(kind); assert.ok(l.length >= 5, `${kind}: ${l.length} rows`); assert.ok(l.every(i => !i.id.startsWith('no-') && i.len > 0 && eventDef(i.id)), `${kind}: real rows, never an off-switch`); }
  assert.ok(playlistOf('holidays').filter(i => i.hol === 'halloween').length >= 4 && playlistOf('holidays').some(i => i.hol === 'dotd'), 'the holidays know their night');
  for (const p of PLAY_ALL) assert.ok(SECTIONS.some(s => s.id === p.sec) && playlistOf(p.kind).length > 0, `${p.kind} in ${p.sec}`);
  assert.deepEqual(playlistOf('nope'), []);
  // the weather's groups: every row in one, the groups in the owner's order
  assert.deepEqual(WEATHER_GROUPS, ['THE SKY', 'RAIN', 'STORM', 'FOG', 'COLD']); for (const x of WEATHER) assert.ok(WEATHER_GROUPS.includes(x.group), x.id);
});

test('WIN2 — PLAY ALL ON ITS OWN CLOCK: every window moment gets an hour inside its own allowed hours (a routine at its `at`), the TV room at night, the wake in the morning, the shop by day; the small hours land on the next day', () => {
  const MOMENT = Object.fromEntries(MOMENTS.map(m => [m.id, m]));
  for (const it of playlistOf('windows')) {
    const m = MOMENT[it.id.slice(7)], h = it.hour;
    assert.ok(h >= 0 && h < 24, `${it.id}: an hour (${h})`);
    if (m.at != null) assert.ok(Math.abs(h - m.at) < 0.5, `${it.id}: at its routine's time`);
    else if (m.hours) { const [a, b] = m.hours, inside = b >= a ? h >= a && h < b : h >= a || h < b; assert.ok(inside, `${it.id}: ${h} inside ${a}–${b}`); }
    assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(itemWhen(it, '2026-10-24')), `${it.id}: a wall time`);
  }
  assert.ok(momentHour(MOMENT['lights-out']) >= 20 || momentHour(MOMENT['lights-out']) < 3, 'the TV room at night');
  assert.ok(momentHour(MOMENT.wake) >= 5.5 && momentHour(MOMENT.wake) <= 9, 'the wake in the morning');
  assert.ok(momentHour(MOMENT.cash) >= 23 || momentHour(MOMENT.cash) < 5, 'the cash count late');
  assert.equal(itemWhen({ hour: 1.5 }, '2026-10-24'), '2026-10-25T01:30', 'the small hours land on the next day');
  assert.equal(itemWhen({ hour: 23 }, '2026-10-31'), '2026-10-31T23:00');
  for (const kind of ['holidays', 'wildlife', 'workers']) for (const it of playlistOf(kind)) assert.ok(it.hour != null && (it.night ? it.hour >= 19 : it.hour < 19), `${kind}/${it.id}: its own hour`);
});
