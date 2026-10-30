// CITY 2.0 — NIGHT-B Group 1: THE CITY TIMETABLE (core/harbor-schedule.js) + THE TIER TABLE (core/harbor-tiers.js).
// node --test tests/harbor-tables.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SCHEDULE, CONFLICTS, TRIGGERS, knob, scheduleRow, timetableText } from '../js/core/harbor-schedule.js';
import { TIERS, tierVal, tierTableText } from '../js/core/harbor-tiers.js';
import { TIER_CAP } from '../js/core/harbor-people.js';

// the code this pass wrote that must READ the tables (never a time of day or a per-phone count of its own)
const NEW_CODE = ['js/core/harbor-streetparty.js'];
const src = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

test('NIGHT-B — THE TIER TABLE: every knob has a value for tier 0 / 1 / 2, never fewer at a stronger tier; tierVal clamps; the walkers\' cap reads it', () => {
  for (const [k, v] of Object.entries(TIERS)) {
    assert.equal(v.length, 3, `${k}: three tiers`);
    assert.ok(v.every(x => Number.isFinite(x) && x >= 0), `${k}: numbers`);
    assert.ok(v[0] <= v[1] && v[1] <= v[2], `${k}: never fewer at a stronger tier (${v})`);
  }
  assert.equal(tierVal('conga', 0), TIERS.conga[0]); assert.equal(tierVal('conga', 9), TIERS.conga[2]); assert.equal(tierVal('conga', -3), TIERS.conga[0]); assert.equal(tierVal('conga'), TIERS.conga[2]);
  assert.throws(() => tierVal('nope', 1), /no tier row/);
  assert.equal(TIER_CAP, TIERS.walkers, 'core/harbor-people.js#TIER_CAP is the table\'s row');
  // (the owner's numbers: the conga ~20 / ~12 / ~6, up to THREE on the bench)
  assert.deepEqual([...TIERS.conga], [6, 12, 20]); assert.equal(TIERS.benchDancers[2], 3);
  assert.match(tierTableText(), /conga\s+6\s+12\s+20/);
});

test('NIGHT-B — THE CITY TIMETABLE: one row per timed thing (a trigger each, live or planned, where it lives); Rosie\'s bell at :00 FIXED; the conflicts in one place; a typo never reads undefined', () => {
  const ids = SCHEDULE.map(r => r.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  for (const r of SCHEDULE) {
    assert.ok(TRIGGERS.includes(r.trigger), `${r.id}: trigger ${r.trigger}`);
    assert.ok(r.src && r.what, `${r.id}: where it lives + what it is`);
    assert.ok(['live', 'planned'].includes(r.status), `${r.id}: status`);
    for (const c of r.conflicts || []) assert.ok(CONFLICTS.some(x => (x.a === r.id && x.b === c) || (x.b === r.id && x.a === c)) || ids.includes(c) || /^(traffic|traffic\.front|cabstand|storm|window\.party)$/.test(c), `${r.id}: its conflict ${c} is in the table`);
  }
  for (const id of ['party.night', 'party.crowd', 'party.songs', 'party.break', 'party.spill', 'party.bench', 'party.conga', 'cart.party', 'rosie.bell']) assert.ok(scheduleRow(id), `${id} registered`);
  assert.equal(scheduleRow('rosie.bell').fixed, true, 'the bell is a fixed point'); assert.equal(knob('rosie.bell').minute, 0);
  assert.throws(() => knob('party.brek'), /no timetable row/);
  // (the owner's party night: warm-up 8:30, the peak, thinning after 1, gone by 2; a break ~every 20 min; the cart packs up before the crowd)
  const C = knob('party.crowd'); assert.deepEqual([C.warm, C.thin, C.gone], [20.5, 25, 26]);
  assert.equal(knob('party.break').every_min, 20); assert.ok(knob('cart.party').partyTo <= C.warm, 'the cart packs up before the crowd');
  for (const c of CONFLICTS) assert.ok(c.a && c.b && c.rule && c.where, 'a conflict names both sides, the rule and where it lives');
  assert.ok(CONFLICTS.some(c => c.a === 'party.break' && c.b === 'traffic.front'), 'the street spill holds the front street');
  const txt = timetableText(); for (const id of ids) assert.ok(txt.includes(id), `the export lists ${id}`);
  assert.match(txt, /THE CONFLICTS/); assert.match(txt, /\(FIXED\)/);
});

test('NIGHT-B — THE RULE: the new code READS the tables — no time of day, no per-phone count of its own', () => {
  for (const f of NEW_CODE) {
    const s = src(f);
    assert.match(s, /from '\.\/harbor-schedule\.js'/, `${f} reads THE CITY TIMETABLE`);
    assert.match(s, /from '\.\/harbor-tiers\.js'/, `${f} reads THE TIER TABLE`);
    // (an hour literal turned into seconds — `21 * 3600` — or a comparison of an hour against a literal)
    assert.equal((s.match(/(?<![\w.])\d+(?:\.\d+)?\s*\*\s*3600/g) || []).length, 0, `${f}: an hour literal × 3600`);
    assert.equal((s.match(/\b(?:hour|hh|eh)\s*[<>]=?\s*\d/g) || []).length, 0, `${f}: an hour compared with a literal`);
    // (a tier's own number: `tier === 0`, `tt < 2`, or a [a, b, c] triplet)
    assert.equal((s.match(/\b(?:tier|tt)\s*[<>=!]=?=?\s*\d/g) || []).length, 0, `${f}: a tier compared with a literal`);
    assert.equal((s.match(/\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]/g) || []).length, 0, `${f}: a [t0, t1, t2]-looking triplet`);
  }
});
