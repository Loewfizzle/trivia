// CITY CONTROLS A — THE RADIO (core/harbor-radio.js): the jacks FROM THE TIMETABLE, the roles per action, the dark, the words, ONE at a
// time per lane (the owner first), the crew's limits, AT A TIME in each viewer's own time
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jacks, jackDef, roleJack, roleAudience, rolePower, canRun, darkAt, cleanWords, cleanFire, cleanBoard, planStart, crewCheck, nightKey, lampOf, startOf, localStart, publicMoment, scopeOf, AUDIENCES, AUD_LABEL } from '../js/core/harbor-radio.js';
import { SCHEDULE, knob } from '../js/core/harbor-schedule.js';

const NIGHT = Date.UTC(2026, 10, 3, 3, 0, 0), DAY = Date.UTC(2026, 10, 3, 17, 0, 0);   // (10 pm + noon, Grand Rapids)

test('THE JACKS come FROM THE TIMETABLE: one per row marked with a jack (plug and play), in the desk\'s order', () => {
  const J = jacks();
  assert.deepEqual(J.map(j => j.id), ['skywrite', 'banner', 'fireworks', 'lights', 'ufo', 'tr3b', 'party', 'blackbird', 'flyby', 'dance', 'balloons', 'billboard', 'lightning', 'beams', 'blackhelo']);   // (FRIENDS C: THE BLACK HELICOPTER — medium.heli's jack)
  assert.equal(J.length, SCHEDULE.filter(r => r.jack).length);
  for (const j of J) { assert.ok(j.label && j.card && j.len >= 0 && ['legend', 'words', 'show', 'free'].includes(j.lane) && j.start, j.id); assert.ok(j.order > 0); }
  assert.ok(J.length <= 16, 'four rows of four (more → the rows scroll)');
  // each one's DAY / NIGHT rule (the owner, Nov 2 9:59 am): fireworks, UFO, TR-3B, searchlights, sky beams after dark; the rest any time
  for (const id of ['fireworks', 'ufo', 'tr3b', 'lights', 'beams']) assert.equal(jackDef(id).dark, true, id);
  for (const id of ['skywrite', 'banner', 'balloons', 'blackbird', 'flyby', 'lightning', 'billboard']) assert.equal(jackDef(id).dark, false, id);
});

test('THE ROLES per action: the owner every jack + audience; THE CREW its 11 jacks, the room only, no dial / queue / stats / clear all', () => {
  for (const j of jacks()) assert.ok(roleJack('owner', j.id));
  assert.deepEqual(jacks().filter(j => roleJack('crew', j.id)).map(j => j.id).sort(), ['balloons', 'banner', 'beams', 'blackbird', 'fireworks', 'flyby', 'lightning', 'lights', 'skywrite', 'tr3b', 'ufo']);
  for (const a of ['me', 'everyone', 'room']) { assert.ok(roleAudience('owner', a)); assert.equal(roleAudience('crew', a), a === 'room'); }
  // CC-B — THE KNOB's THREE WORDS (the owner, 3:21 pm): JUST ME · LOBBY ONLY · EVERYONE; CITY ONLY dropped
  assert.deepEqual(AUDIENCES.map(a => AUD_LABEL[a]), ['JUST ME', 'LOBBY ONLY', 'EVERYONE']); assert.equal(roleAudience('owner', 'city'), false);
  for (const p of ['dial', 'queue', 'stats', 'stopAny', 'clearAll']) { assert.ok(rolePower('owner', p)); assert.ok(!rolePower('crew', p)); }
  assert.ok(!roleJack('nobody', 'ufo') && !roleAudience('nobody', 'room') && !rolePower('nobody', 'dial'));
});

test('THE DARK: the city follows the real clock — a night jack greyed by day with when it can run', () => {
  assert.ok(darkAt(NIGHT) && !darkAt(DAY));
  const r = canRun('tr3b', DAY);
  assert.equal(r.ok, false); assert.equal(r.why, 'dark'); assert.ok(r.when > DAY && darkAt(r.when)); assert.match(r.note, /^TR-3B · AFTER DARK ONLY — AT \d{1,2}:\d\d PM$/);
  assert.ok(canRun('tr3b', NIGHT).ok && canRun('blackbird', DAY).ok && canRun('lightning', DAY).ok);
});

test('THE WORDS: ≤ 24 letters, upper case, the profanity filter, no player names (BNAME)', () => {
  assert.deepEqual(cleanWords('  happy   birthday! '), { text: 'HAPPY BIRTHDAY!', bad: null });
  assert.equal(cleanWords('').bad, 'empty');
  assert.equal(cleanWords('X'.repeat(25)).bad, 'long');
  assert.equal(cleanWords('<script>').bad, 'chars');
  assert.equal(cleanWords('holy shit').bad, 'words');
  assert.equal(cleanWords('GO JESSICA GO', { names: ['Jessica'] }).bad, 'name');
  assert.equal(cleanWords('JESSICAS TACOS', { names: ['Jessica'] }).bad, null, 'whole words only');
  assert.equal(cleanFire({ jack: 'skywrite', aud: 'everyone', text: 'hi', colour: 'zzz' }).req.colour, 'ffffff');
  assert.equal(cleanFire({ jack: 'fireworks', aud: 'everyone', show: 'full' }).req.show, 'full');
  assert.equal(cleanFire({ jack: 'ufo', aud: 'room', room: 'ab' }).bad, 'bad_room');
  assert.equal(cleanFire({ jack: 'ufo', aud: 'everyone', local: { h: 25, mi: 0 } }).bad, 'bad_time');
  assert.deepEqual(cleanBoard({ lines: ['game night', '8 pm'], local: { h: 19, mi: 45 }, repeat: { dows: [5, 5, 9] } }).msg, { lines: ['GAME NIGHT', '8 PM'], local: { h: 19, mi: 45 }, repeat: { dows: [5] } });
  assert.equal(cleanBoard({ lines: ['A'], repeat: { dows: [5] } }).bad, 'bad_repeat', 'a repeat needs a time');
  assert.equal(cleanBoard({ lines: ['X'.repeat(knob('radio.billboard').line + 1)] }).bad, 'words_long');
});

test('ONE AT A TIME: a second legendary waits its turn; another lane doesn\'t; a legendary never over a show; the owner goes first', () => {
  const K = knob('radio'), now = NIGHT;
  const ufo = { id: 'a', jack: 'ufo', role: 'owner', state: 'q', at: now + 45e3, until: now + 85e3 };
  assert.equal(planStart([], { jack: 'ufo', role: 'owner', aud: 'everyone' }, now).at, now + K.lead.city * 1000);
  assert.equal(planStart([ufo], { jack: 'tr3b', role: 'owner', aud: 'everyone' }, now).at, ufo.until + K.gap * 1000);
  assert.equal(planStart([ufo], { jack: 'banner', role: 'owner', aud: 'everyone' }, now).at, now + K.lead.city * 1000);
  assert.equal(planStart([ufo], { jack: 'fireworks', role: 'owner', aud: 'everyone' }, now).at, ufo.until + K.gap * 1000, 'a show waits for the legendary');
  assert.equal(planStart([ufo], { jack: 'lights', role: 'owner', aud: 'everyone' }, now).at, now + K.lead.city * 1000, 'the free lane');
  // the crew's waiting one moves behind the owner's
  const crew = { id: 'c', jack: 'flyby', role: 'crew', state: 'q', at: now + 2000, until: now + 24000 };
  const P = planStart([crew], { jack: 'ufo', role: 'owner', aud: 'room' }, now - 500);
  assert.equal(P.at, now - 500 + K.lead.room * 1000);
  assert.deepEqual(P.moved.map(m => m.id), ['c']); assert.ok(P.moved[0].at >= P.until);
  // ...but a RUNNING one holds even the owner
  assert.equal(planStart([{ ...crew, at: now - 1000, state: 'run' }], { jack: 'ufo', role: 'owner', aud: 'room' }, now).at, crew.until + K.gap * 1000);
  assert.equal(lampOf('ufo', [ufo], now, undefined), 'q'); assert.equal(lampOf('ufo', [ufo], now + 50e3), 'run'); assert.equal(lampOf('tr3b', [], DAY), 'grey'); assert.equal(lampOf('tr3b', [], now), '');
  assert.equal(scopeOf({ aud: 'everyone' }), 'city'); assert.equal(scopeOf({ aud: 'room', room: 'ABCD' }), 'room:ABCD');
});

test('THE CREW\'s limits (loose, per room per night): the cooldown, each legendary ≤ 3, the words ≤ 10, the fireworks ≤ 3', () => {
  const K = knob('radio').crew;
  assert.ok(crewCheck('ufo', null, NIGHT).ok);
  assert.equal(crewCheck('ufo', { lastEnd: NIGHT - 10e3 }, NIGHT).why, 'cooldown');
  assert.ok(crewCheck('ufo', { lastEnd: NIGHT - K.cooldown * 1000 - 1 }, NIGHT).ok);
  assert.match(crewCheck('ufo', { counts: { legend: 3 } }, NIGHT).note, /THAT'S ENOUGH UFOS FOR TONIGHT — BACK TOMORROW/);
  assert.ok(crewCheck('banner', { counts: { words: 9 } }, NIGHT).ok); assert.equal(crewCheck('banner', { counts: { words: 10 } }, NIGHT).why, 'limit');
  assert.equal(crewCheck('fireworks', { counts: { fireworks: 3 } }, NIGHT).why, 'limit');
  assert.equal(crewCheck('party', null, NIGHT).why, 'not_crew_jack');
  // the night: from noon to the next noon (local) — 1 am counts in the evening before
  assert.equal(nightKey(Date.UTC(2026, 10, 3, 6, 0), 'America/Detroit'), '2026-11-02');
  assert.equal(nightKey(Date.UTC(2026, 10, 3, 18, 0), 'America/Detroit'), '2026-11-03');
});

test('WHAT THE CITY PLAYS (once) + AT A TIME in each viewer\'s own time + the public copy (no profile id)', () => {
  assert.deepEqual(startOf({ jack: 'tr3b' }), { kind: 'legend', arg: 'tr3b', text: null, colour: null, show: null, dance: null });
  assert.equal(startOf({ jack: 'beams' }).kind, 'hold'); assert.equal(startOf({ jack: 'beams' }).arg, 'beams');
  assert.equal(startOf({ jack: 'skywrite', text: 'HI' }).text, 'HI');
  // 7:45 pm local: Detroit (−300) vs Los Angeles (−480) — the same local clock, three hours apart
  const made = Date.UTC(2026, 10, 3, 12, 0), det = localStart({ h: 19, mi: 45 }, made, -300), la = localStart({ h: 19, mi: 45 }, made, -480);
  assert.equal(det, Date.UTC(2026, 10, 4, 0, 45)); assert.equal(la - det, 3 * 3600e3);
  assert.equal(localStart({ h: 6, mi: 0 }, made, -300), Date.UTC(2026, 10, 4, 11, 0), 'a time already gone today → tomorrow');
  const pub = publicMoment('x', { jack: 'ufo', by: 'pSECRET', role: 'crew', aud: 'room', room: 'ABCD', at: 1, until: 2, state: 'q' });
  assert.ok(!JSON.stringify(pub).includes('pSECRET')); assert.equal(pub.by, 'crew');
});

test('CC-B — ONE RADIO PER LOBBY: the host if crew, else the crew member who joined first; it follows the host; a hand-over holds until the host changes', async () => {
  const { radioHolder, parseTag } = await import('../js/core/harbor-radio.js');
  const players = { h: { joinedAt: 1 }, a: { joinedAt: 5 }, b: { joinedAt: 3 }, x: { joinedAt: 2 } };
  assert.equal(radioHolder({ hostId: 'h', players }, []), null, 'no crew: nobody');
  assert.equal(radioHolder({ hostId: 'h', players }, ['a', 'b']), 'b', 'the crew member who joined first');
  assert.equal(radioHolder({ hostId: 'h', players }, ['a', 'b', 'h']), 'h', 'the host if crew');
  assert.equal(radioHolder({ hostId: 'a', players }, ['a', 'b']), 'a', 'it follows the host');
  assert.equal(radioHolder({ hostId: 'h', players, hand: { uid: 'a', host: 'h' } }, ['a', 'b', 'h']), 'a', 'a hand-over');
  assert.equal(radioHolder({ hostId: 'x', players, hand: { uid: 'a', host: 'h' } }, ['a', 'b', 'h']), 'h', 'the host changed: the rule again');
  assert.equal(radioHolder({ hostId: 'h', players: { h: players.h, b: players.b }, hand: { uid: 'a', host: 'h' } }, ['a', 'b', 'h']), 'h', 'the one handed to left');
  assert.equal(radioHolder({ hostId: 'h', players }, ['zz']), null, 'a crew uid not in the lobby');
  assert.deepEqual(parseTag('mike#4821'), { name: 'mike', tag: '4821' }); assert.deepEqual(parseTag(' Big Al # 0042 '), { name: 'Big Al', tag: '0042' });
  assert.equal(parseTag('mike'), null); assert.equal(parseTag('#1234'), null);
});
