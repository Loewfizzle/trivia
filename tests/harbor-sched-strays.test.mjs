// SCHED — NOTHING HARD-CODES A TIME OUTSIDE THE CITY TIMETABLE (the plan's long-standing test; core/harbor-schedule.js). Every timed
// planner of City 2.0 reads its hours / days / months / chances / slots / gaps from knob(row); this test greps the planners for a stray
// one — an object key with a timing name + a number, an hour compared with a number, an UPPER_CASE constant set to a number — and allows
// ONLY the non-timing numbers named below (animation lengths, geometry, physics, light thresholds, a forced preview's own loop, the
// evening clock's wrap at noon). A new timed thing → a row in the timetable + knob(row) in its planner, never a number here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const DIR = new URL('../js/core/', import.meta.url);
const KEY = /\b(from|to|at|hours?|days|months|chance|p|perMonth|every(?:_min)?|slot|rarity|gap|until|untilEve|after|party|partyP|start|len)\s*:\s*-?\d/g;
const HOUR = /\b(h|hr|hour|lh|loc\.h|L\.h|local\.h)\s*(<|>|<=|>=)\s*\d+(\.\d+)?/g;
const CONST = /^\s*(?:export )?const ([A-Z][A-Z0-9_]*) = -?\d/;
/** the structural clock: the day's length, the evening's wrap at noon / midnight — the same in every planner */
const EVERYWHERE = ['DAY', 'H', 'DAYMS', 'HOUR', 'h < 12', 'hr < 12', 'loc.h < 12', 'lc.h < 12', 'h < 24', 'hr >= 12', 'h >= 24'];
/** per planner: the non-timing numbers it may name (why in the comment) */
const ALLOW = {
  'harbor-events.js': ['QUIET', 'RECENT_MS', 'REPLAY_SLOTS'],                                   // (a density; the scheduler's own look-back + replay window)
  'harbor-legend.js': ['TR3B_CROSS', 'CHASE_BANK'],                                             // (the craft's crossing (s), a bank angle)
  'harbor-blackbird.js': ['len:'],                                                              // (its body's length on screen)
  'harbor-workers.js': ['HOT_C', 'slot:', 'from:'],                                             // (a temperature; the forced preview's slot; the billposter's sheets' stroke)
  'harbor-people.js': ['every:', 'CART_IN_Z', 'len:', 'start:', 'DOG_EASE', 'DOG_DT', 'FOLK_CACHE', 'HB', 'B', 'loc.h >= 9', 'loc.h < 18'],   // (the force previews' loops, the bus's length, the turn's start, the dog's easing, a cache, the plan blocks; &force=doors' day)
  'harbor-moments.js': ['len:', 'STAGE_ROOM', 'TV_OFF', 'SHADE_LEN', 'from:', 'to:', 'TV_STEP', 'TV_SLOT', 'start:', 'PARTY_DOWN'],   // (a moment's own length inside its draw, a scale, the 3 am pull's beats, the TV's flicker grid, the boss's demo watch, the party's wind-down)
  'harbor-holiday.js': ['days:', 'PUMPKINS_MAX', 'GHOST_LEN'],                                  // (holidayAt's empty state, a count, the crossing's length)
  'harbor-holidayprops.js': ['gap:', 'SOLID_PAD'],                                              // (the garlands' spacing, a pad)
  'harbor-boats.js': ['to:', 'ROSIE_IN'],                                                       // (the routes' legs, her approach (s))
  'harbor-traffic.js': ['gap:'],                                                                // (the car-following gap, s)
  'harbor-cabs.js': ['len:'],                                                          // (the cab's length)
  'harbor-raid.js': ['len:', 'gap:'],                                                           // (the convoy's car length + gap)
  'harbor-wildlife.js': ['WILD_SCALE', 'len:', 'SEG'],                                          // (sizes, a hop's length)
  'harbor-routines.js': ['at:', 'loc.h < 3'],                                                   // (the ring's step; the evening's wrap at 3 am)
  'harbor-tower.js': ['FIRST_YEAR'],                                                            // (the first cycle's year)
  'harbor-parade.js': ['gap:'],                                                                 // (the units' spacing)
  'harbor-xmas.js': ['from:'],                                                                  // (the strings' hanging order)
  'harbor-ghost.js': ['len:', 'WITCH_LEN', 'COLONY_LEN', 'SP'],                                 // (the crossings' lengths, a spin)
  'harbor-holidayfolk.js': ['len:'],                                                            // (the procession's chunk)
  'harbor-streetparty.js': ['gap:', 'start:'],                                                  // (the pockets' walking gap, the conga's set-off in its song)
  'harbor-fireworks.js': ['from:', 'to:'],                                                      // (the shows' scripts: shells in a show)
  'harbor-scenes.js': ['at:'],                                                                  // (a shade plan's first step)
  'harbor-boxer.js': ['BAG_SIDE', 'BAG_X', 'GAP', 'p:', 'LAND', 'BOXER_DUCK'],                  // (geometry, the punches' mix, a duck level)
  'harbor-show.js': ['h > 0.55', 'ATTACK_S', 'DECAY_S', 'gap:', 'h <= 27', 'every:', 'after:', 'h < 0.85', 'h < 0.5', 'P', 'SPELL_DUR'],   // (light levels named h, the beat's envelope, the motions' periods, the party-ready search window)
  'harbor-witness.js': ['len:'],                                                                // (the reactions' lengths)
  'harbor-crew.js': ['len:', 'gap:'],                                                           // (the trucks' length + spacing)
  'harbor-juggler.js': ['FETCH', 'T'],                                                          // (the routine's own beats)
  'harbor-dance.js': ['BLEND_S', 'gap:'],                                                       // (the dance clock's blend)
};
/** THE TIMED PLANNERS (each has its rows in the timetable) — a new one joins this list */
const PLANNERS = ['events', 'legend', 'blackbird', 'mothman', 'workers', 'people', 'moments', 'holiday', 'holidayprops', 'boats', 'traffic', 'cabs', 'raid', 'wildlife', 'routines',
  'tower', 'parade', 'xmas', 'lamps', 'roofmodes', 'heli', 'ghost', 'holidayfolk', 'snowwork', 'snowman', 'streetparty', 'fireworks', 'scenes', 'boxer', 'show', 'witness',
  'crew', 'juggler', 'crate', 'charleston', 'bookie', 'dance', 'dark'].map(f => `harbor-${f}.js`);
const tokens = code => {
  const out = [...code.matchAll(KEY)].map(m => `${m[1]}:`).concat([...code.matchAll(HOUR)].map(m => m[0].replace(/\s+/g, ' ')));
  const c = code.match(CONST); if (c) out.push(c[1]);
  return out;
};

test('NO STRAY TIMES: every timed planner reads THE CITY TIMETABLE (only the named non-timing numbers stay in the code)', () => {
  const bad = [];
  for (const f of PLANNERS) {
    const ok = new Set([...EVERYWHERE, ...(ALLOW[f] || [])]);
    readFileSync(new URL(f, DIR), 'utf8').split('\n').forEach((l, i) => {
      if (/^\s*(\*|\/\*|\/\/)/.test(l) || /knob\(/.test(l)) return;
      const code = l.replace(/\/\/.*$/, '').replace(/'[^']*'|`[^`]*`/g, "''");
      for (const t of tokens(code)) if (!ok.has(t) && !ok.has(t.replace(/ /g, ''))) bad.push(`${f}:${i + 1} ${t}`);
    });
  }
  assert.deepEqual(bad, [], `a time outside the timetable — move it into core/harbor-schedule.js (a row's knobs) and read knob(row):\n${bad.join('\n')}`);
});
test('the timetable: every row a trigger + a source; knob() refuses a typo', async () => {
  const { SCHEDULE, TRIGGERS, knob } = await import('../js/core/harbor-schedule.js');
  for (const r of SCHEDULE) { assert.ok(TRIGGERS.includes(r.trigger), r.id); assert.ok(r.src, r.id); }
  assert.throws(() => knob('no.such.row'));
  assert.equal(new Set(SCHEDULE.map(r => r.id)).size, SCHEDULE.length, 'row ids are unique');
});
