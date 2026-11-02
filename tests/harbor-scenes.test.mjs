// WINDOWS — THE WINDOW SCENES ON THE CITY TIMETABLE (core/harbor-scenes.js) + THE OLD SCENES RETIRED (core/harbor-moments.js#RETIRED).
// node --test tests/harbor-scenes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SCENE_IDS, SCENE_ROOMS, SCENE_TIMING, scenesTonight, sceneAt, scenePreview, shadesNight, shadeLevel, roomColour, sceneFreeFrom, sceneClashes, sceneRow, partyEvening } from '../js/core/harbor-scenes.js';
import { knob, scheduleRow, CONFLICTS } from '../js/core/harbor-schedule.js';
import { RETIRED, MOMENT, dayPlan, BOSS_ROOM } from '../js/core/harbor-moments.js';
import { boxerNight, boxerPlan } from '../js/core/harbor-boxer.js';

const keyOf = d => new Date(Date.UTC(2026, 10, 1) + d * 864e5).toISOString().slice(0, 10);
const NIGHTS = Array.from({ length: 70 }, (_, d) => keyOf(d));

test('WINDOWS — every scene is a ROW in THE CITY TIMETABLE (window, hours, nights, rarity, its glow); the owner\'s layout; no clashes', () => {
  for (const id of SCENE_IDS) { const r = sceneRow(id); assert.ok(r, `scene.${id} registered`); assert.ok(r.knobs.glow && r.knobs.glow.length === 3, `${id}: its glow`); assert.ok(SCENE_TIMING[id], `${id}: its timing`); }
  // (the owner, Nov 1 10:06 am + 10:54 am: the juggler bottom right 6:30–9:30 → the crate guy 9:45–midnight; the Charleston bottom middle 7–10)
  assert.deepEqual([knob('scene.juggler').win, knob('scene.juggler').from, knob('scene.juggler').to], ['jazz', 18.5, 21.5]);
  assert.deepEqual([knob('scene.crate').win, knob('scene.crate').from, knob('scene.crate').to], ['jazz', 21.75, 24]);
  assert.deepEqual([knob('scene.charleston').win, knob('scene.charleston').from, knob('scene.charleston').to], ['bar', 19, 22]);
  assert.equal(knob('scene.bookie').rotate, true, 'the bookie ROTATES');
  assert.deepEqual(sceneClashes(), [], 'no two fixed scenes in one window at once, none over the boxer');
  assert.ok(knob('windows.shades').outFrom === 26 && knob('windows.shades').outTo === 28, 'the lights out 2 → 4 am');
  assert.ok(CONFLICTS.some(c => c.a === 'scene.juggler' && c.b === 'scene.crate'), 'the one-scene-a-window rule is in THE CONFLICTS');
  assert.equal(knob('windows.old').on, false, 'the old scenes are OFF');
  assert.ok(!SCENE_ROOMS.includes(BOSS_ROOM), 'never the boss\'s room');
});

test('WINDOWS — tonight\'s scenes: the same on every phone; the bookie rotates his window + nights, never over a fixed slot or the boxer, never a party night', () => {
  const wins = new Set(), nights = [];
  for (const key of NIGHTS) {
    const S = scenesTonight(key, { all: true }), S2 = scenesTonight(key, { all: true });
    assert.deepEqual(S, S2, 'every phone the same');
    for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) if (S[i].win === S[j].win) assert.ok(S[i].end <= S[j].start || S[j].end <= S[i].start, `${key}: ${S[i].id} + ${S[j].id} never share ${S[i].win}`);
    for (const id of ['juggler', 'crate', 'charleston']) assert.ok(S.some(x => x.id === id), `${key}: the ${id} every night`);
    const b = S.find(x => x.id === 'bookie');
    if (partyEvening(key)) assert.ok(!b, `${key}: no bookie on a party night`);
    if (b) {
      wins.add(b.win); nights.push(key);
      const bp = boxerPlan(boxerNight(key));
      if (b.win === 'back' && bp) assert.ok(b.start > bp.end + 600, `${key}: the bookie after the boxer`);
    }
  }
  assert.ok(wins.size >= 2, `his window rotates (${[...wins].join(', ')})`);
  assert.ok(nights.length > 15 && nights.length < 50, `${nights.length} of 70 nights — a regular, not every night`);
  // (a legendary inside a scene's hours: no scene that night, as the boxer)
  const L = scenesTonight('2026-11-05', { all: true, legend: () => ({ h: 20 }) });
  assert.ok(!L.some(x => x.id === 'juggler' || x.id === 'charleston'), 'a legendary at 8 pm: the juggler + the Charleston sit it out');
  // (a planned row never plays until its painter ships)
  assert.ok(scenesTonight('2026-11-05').every(x => scheduleRow(`scene.${x.id}`).status === 'live'));
});

test('WINDOWS — a scene\'s parts: the shade up → he walks in → his work for hours → his exit ends with HIM pulling the shade down (eased)', () => {
  const sc = scenesTonight('2026-11-03', { all: true }).find(x => x.id === 'juggler'), T = SCENE_TIMING.juggler;
  assert.equal(sceneAt(sc, sc.start - 1), null); assert.equal(sceneAt(sc, sc.end), null);
  const up = sceneAt(sc, sc.start + 1); assert.equal(up.phase, 'up'); assert.ok(up.shade > 0.5 && !up.inView);
  const en = sceneAt(sc, sc.start + T.up + 1); assert.equal(en.phase, 'enter'); assert.equal(en.shade, 0); assert.ok(en.inView);
  const wk = sceneAt(sc, sc.start + 3600); assert.equal(wk.phase, 'work'); assert.ok(wk.workLen > 2.5 * 3600, `${wk.workLen} s of work`);
  const ex = sceneAt(sc, sc.end - T.exit + 1); assert.equal(ex.phase, 'exit'); assert.equal(ex.shade, 0);
  const pl = sceneAt(sc, sc.end - 0.3); assert.ok(pl.shade > 0.95 && pl.pull > 0.9, 'the shade nearly down as his exit ends');
  let prev = 0; for (let s = sc.end - T.pull; s < sc.end; s += 0.25) { const v = sceneAt(sc, s).shade; assert.ok(v >= prev - 1e-9, 'the pull only goes down'); prev = v; }
  // (the panel's preview: his entrance now, or N minutes into his work)
  const p0 = scenePreview('juggler', 1000, 0), p30 = scenePreview('juggler', 1000, 30);
  assert.equal(sceneAt(p0, 1000 + 1.5).phase, 'up'); assert.equal(Math.round(sceneAt(p30, 1000 + 1.5).work), 30 * 60);
});

test('WINDOWS — AFTER HOURS: the shades glow in their room\'s colour, the lights go out ONE AT A TIME 2–4 am (the click), the colour blends to the next scene', () => {
  const K = knob('windows.shades');
  for (const key of NIGHTS.slice(0, 30)) {
    const S = scenesTonight(key, { all: true }), O = shadesNight(key, { scenes: S }), t = Object.values(O).sort((a, b) => a - b);
    assert.equal(t.length, 5, 'the three scene rooms + the two edge windows');
    for (const v of t) assert.ok(v >= K.outFrom * 3600 && v <= K.outTo * 3600 + 1200, `${key}: ${v / 3600} h`);
    assert.ok(t[1] - t[0] >= 480, 'spread out');
    for (let i = 1; i < t.length; i++) assert.ok(t[i] - t[i - 1] >= K.gap - 1, `${key}: one at a time (${t[i] - t[i - 1]} s apart)`);
    for (const sc of S) assert.ok(O[sc.win] >= sc.end, `${key}: ${sc.win}'s light stays on till its scene's shade is down`);
  }
  assert.equal(shadeLevel(1000, 999), 1); assert.equal(shadeLevel(1000, 1000.15), 0.85); assert.equal(shadeLevel(1000, 1001), 0);
  const S = scenesTonight('2026-11-03', { all: true }), J = knob('scene.juggler'), C = knob('scene.crate');
  assert.deepEqual(roomColour(S, 'jazz', 20 * 3600).col, J.glow, 'the juggler\'s amber while he works');
  assert.deepEqual(roomColour(S, 'jazz', 21.6 * 3600).col, J.glow, 'amber behind his shade 9:30–9:45');
  assert.deepEqual(roomColour(S, 'jazz', 24.5 * 3600).col, C.glow, 'the crate guy\'s cold white after midnight');
  assert.equal(roomColour(S, 'jazz', 24.5 * 3600).sway, true, 'his bulb still swaying behind the shade');
  const mid = roomColour(S, 'jazz', 21.75 * 3600 - 30).col; assert.ok(mid.some((v, i) => v !== J.glow[i] && v !== C.glow[i]), 'the shade\'s colour blends over the last minute');
  assert.deepEqual(roomColour(S, 'bar', 18 * 3600).col, knob('scene.charleston').glow, 'before her rehearsal the bar is her rosy room');
});

test('WINDOWS — the window party: a scene room joins only after its last scene that overlaps the peak', () => {
  const S = scenesTonight('2026-11-06', { all: true });   // (a Friday)
  const p0 = 21.5 * 3600, p1 = 25 * 3600;
  assert.equal(sceneFreeFrom(S, 'jazz', p0, p1), knob('scene.crate').to * 3600 + 3, 'the bottom right after the crate guy');
  assert.equal(sceneFreeFrom(S, 'bar', p0, p1), knob('scene.charleston').to * 3600 + 3, 'the bottom middle after the Charleston');
  assert.equal(sceneFreeFrom(S, 'back', p0, p1), null, 'the top middle: the boxer\'s own rule');
});

test('WINDOWS — THE OLD SCENES RETIRED: off in the plan (ctx.retire), their code + rows kept; the kept moments still play', () => {
  for (const id of ['bartender', 'toast', 'sax', 'dance', 'tango', 'peek', 'cash', 'ghost', 'mummy', 'witchsil', 'costume', 'ofrenda', 'table', 'football']) assert.ok(RETIRED.includes(id) && MOMENT[id], `${id} retired, kept`);
  for (const id of ['wake', 'shop-open', 'lights-out', 'cat', 'fan', 'eyes', 'mirror']) assert.ok(!RETIRED.includes(id), `${id} kept`);
  for (const key of ['2026-10-31', '2026-11-26', '2026-11-07', '2026-11-04']) {
    const on = dayPlan(key, { dow: new Date(key).getUTCDay(), month: Number(key.slice(5, 7)), dark: [17.6, 7.3], retire: true, boot: true, hol: { id: 'halloween', stage: 1, eve: true, w: 1 } });
    assert.ok(!on.some(e => RETIRED.includes(e.id)), `${key}: no retired moment (${[...new Set(on.filter(e => RETIRED.includes(e.id)).map(e => e.id))]})`);
    assert.ok(on.some(e => e.id === 'lights-out') && on.some(e => e.id === 'wake'), `${key}: the routines kept`);
  }
  const old = dayPlan('2026-11-07', { dow: 6, month: 11, dark: [17.6, 7.3] });
  assert.ok(old.some(e => RETIRED.includes(e.id)), 'without retire (the old-windows switch) they come back');
  // (windows.js reads the switch from the timetable + the panel's row)
  const w = readFileSync(new URL('../js/screens/harbor/windows.js', import.meta.url), 'utf8');
  assert.match(w, /knob\('windows\.old'\)\.on/); assert.match(readFileSync(new URL('../js/core/harbor-remote.js', import.meta.url), 'utf8'), /id: 'old-windows'/);
});
