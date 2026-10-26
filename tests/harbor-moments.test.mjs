// CITY 2.0 — PART 7b: THE SPEAKEASY'S LIFE — the window moments' catalogue + the day's schedule + the rooms' states (PURE:
// js/core/harbor-moments.js). Run: node --test tests/harbor-moments.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { MOMENTS, MOMENT, STARTERS, RARITIES, WINDOW_IDS, TANGO_PATH, MAX_AT_ONCE, hourPlan, dayPlan, fixedPlan, momentsAt, routineAt, legendNights, roomState, tvLight, lateTvK, inHours, partyAt, darkAt, windowsOf, dayKey, edgeMoods, EDGE_MOODS, redMoodNight, eyesNights, eyesPlaysOn } from '../js/core/harbor-moments.js';
import { legendNight } from '../js/core/harbor-legend.js';
import { ROOMS, roomLight } from '../js/core/harbor-speakeasy.js';
import { EVENTS, PANEL_EVENTS, CATS } from '../js/core/harbor-remote.js';

const OCT = { dow: 4, month: 10, dark: [19.15, 7.7] };            // a Thursday in October (Grand Rapids: dusk ~7:10 pm, dawn ~7:40 am)
const SAT = { dow: 6, month: 10, dark: [19.1, 7.7] };
const JUNE = { dow: 2, month: 6, dark: [21.6, 5.8] };

test('7b — THE CATALOGUE: one self-contained entry per moment — windows, rarity, length, cooldown, when; the starter ten cover the range', () => {
  const ids = new Set();
  for (const m of MOMENTS) {
    assert.ok(!ids.has(m.id), `${m.id}: unique`); ids.add(m.id);
    assert.ok(RARITIES.includes(m.rarity), `${m.id}: a rarity`);
    assert.ok(m.len > 3 && (m.len <= 60 || m.calendar === 'eyes'), `${m.id}: a length`);   // (WIN2: the eyes WATCH — a long presence, its own calendar)
    assert.ok(m.label && m.kind, `${m.id}: a label + what it is`);
    for (const w of windowsOf(m)) assert.ok(WINDOW_IDS.includes(w), `${m.id}: ${w} is a real window`);
    if (m.rarity === 'routine') assert.ok(m.at != null && m.at >= 0 && m.at < 24, `${m.id}: its hour`);
    else if (m.rarity !== 'legendary') assert.ok(m.cooldown > 0, `${m.id}: a cooldown`);
    // (no story moment in a cut EDGE window — only the cat's ledge, the owner's call)
    if (m.id !== 'cat' && m.windows !== 'all') assert.ok(!windowsOf(m).some(w => w.startsWith('edge')), `${m.id}: not in a cut window`);
  }
  assert.equal(STARTERS.length, 10, 'the starter set of ten (the mirror door is the speakeasy\'s own)');
  const by = r => STARTERS.filter(id => MOMENT[id].rarity === r).length;
  assert.equal(by('routine'), 4); assert.equal(by('common'), 2); assert.equal(by('uncommon'), 2); assert.equal(by('rare'), 1); assert.equal(by('legendary'), 1);
  assert.deepEqual(TANGO_PATH.slice().sort(), ROOMS.map(r => r.id).sort(), 'the tango passes every upper window');
});

test('7b — THE SCHEDULE: something starts every ~10–20 s at night, never two in one window, never more than two at once; seeded by the date', () => {
  for (const [name, ctx] of [['thu', OCT], ['sat', SAT], ['june', JUNE]]) {
    const plan = dayPlan(name === 'sat' ? '2026-10-24' : '2026-10-22', ctx);
    assert.deepEqual(plan, dayPlan(name === 'sat' ? '2026-10-24' : '2026-10-22', ctx), `${name}: the same plan for everyone`);
    // never two moments in the same window at once; never more than MAX_AT_ONCE
    for (let i = 0; i < plan.length; i++) {
      const e = plan[i], wins = e.win === 'all' ? TANGO_PATH : [e.win];
      for (let j = 0; j < plan.length; j++) {
        if (i === j) continue;
        const o = plan[j];
        if (!(o.t0 < e.t0 + e.len && o.t0 + o.len > e.t0)) continue;
        const ow = o.win === 'all' ? TANGO_PATH : [o.win];
        assert.ok(!ow.some(w => wins.includes(w)), `${name}: ${e.id} + ${o.id} in one window at ${(e.t0 / 3600).toFixed(2)} h`);
      }
      // (at the instant it starts, and just before it ends: never more than MAX_AT_ONCE running)
      for (const x of [e.t0, e.t0 + e.len - 0.05]) assert.ok(momentsAt(plan, x).length <= MAX_AT_ONCE, `${name}: ${momentsAt(plan, x).length} at once at ${(x / 3600).toFixed(3)} h`);
    }
    // the night's cadence: 9 pm → midnight, a new start every ≤ 30 s (the typical gap 10–20 s)
    const n0 = Math.max(21, ctx.dark[0] + 0.1) * 3600, night = plan.filter(e => e.t0 >= n0 && e.t0 < 24 * 3600).map(e => e.t0);
    const gaps = night.slice(1).map((t, i) => t - night[i]).sort((a, b) => a - b);
    const med = gaps[gaps.length >> 1];
    assert.ok(Math.max(...gaps) <= 40, `${name}: the longest night gap ${Math.max(...gaps).toFixed(1)} s`);
    assert.ok(med >= 7 && med <= 20, `${name}: the typical gap ${med.toFixed(1)} s`);
  }
  // a party night is busier
  const n = (k, c) => dayPlan(k, c).filter(e => e.t0 >= 21 * 3600 && e.t0 < 24 * 3600).length;
  assert.ok(n('2026-10-24', SAT) > n('2026-10-22', OCT) * 1.15, 'party nights busier');
  // different dates, different nights
  assert.notDeepEqual(dayPlan('2026-10-22', OCT).slice(400, 420), dayPlan('2026-10-29', OCT).slice(400, 420));
});

test('7b — THE SCHEDULE: hours, light, rarity — night moments only in the dark, the commons common, the rare rare; each hour builds on its own (< a few ms)', () => {
  const plan = dayPlan('2026-10-22', OCT);
  for (const e of plan) {
    const m = MOMENT[e.id], h = e.t0 / 3600;
    if (m.rarity === 'routine' || m.rarity === 'legendary') continue;
    assert.ok(inHours(h, m.hours), `${e.id} at ${h.toFixed(2)} h`);
    if (m.light === 'night') assert.ok(darkAt(h, OCT.dark), `${e.id} at ${h.toFixed(2)} h only in the dark`);
    assert.ok(Math.floor(e.t0 / 3600) === Math.floor((e.t0 + e.len - 1e-6) / 3600), `${e.id}: starts and ends inside its hour`);
  }
  const c = id => plan.filter(e => e.id === id).length;
  assert.ok(c('toast') > c('sax') * 3 && c('dance') > c('sax') * 3, 'the commons far more often than the uncommons');
  assert.ok(c('peek') >= 1 && c('peek') < c('cat'), 'the rare one: now and then');
  // by day: the cat (+ the rare peek) — never a night moment
  assert.ok(plan.some(e => e.id === 'cat' && e.t0 > 11 * 3600 && e.t0 < 15 * 3600), 'the cat by day');
  // an hour on its own: fast + the same as the day's
  const t0 = performance.now(); const h21 = hourPlan('2026-10-22', 21, OCT); const ms = performance.now() - t0;
  assert.deepEqual(h21, plan.filter(e => e.t0 >= 21 * 3600 && e.t0 < 22 * 3600));
  assert.ok(ms < 40, `an hour in ${ms.toFixed(1)} ms`);
});

test('7b — THE ROUTINES: fixed in the day (a few seeded minutes), every day, the same for everyone; they move their rooms on', () => {
  for (const key of ['2026-10-22', '2026-06-17', '2027-01-03']) {
    const f = fixedPlan(key);
    for (const id of ['wake', 'shop-open', 'bartender', 'lights-out']) {
      const e = f.find(o => o.id === id), m = MOMENT[id];
      assert.ok(e, `${key}: ${id}`);
      assert.equal(e.t0, routineAt(id, key));
      assert.ok(e.t0 >= m.at * 3600 && e.t0 <= (m.at * 3600) + m.jitter * 60, `${key}: ${id} at ${(e.t0 / 3600).toFixed(2)} h`);
    }
  }
  const r = { wake: 7 * 3600 + 120, 'shop-open': 9 * 3600 + 60, bartender: 16 * 3600 + 200, 'lights-out': 22 * 3600 + 300 };
  assert.equal(roomState('apartment', 6.5, r), 'dark', 'SP3: dark until the wake (the owner)');
  assert.equal(roomState('apartment', 12, r), 'lamp');
  assert.equal(roomState('apartment', 23, r), 'tv');
  assert.equal(roomState('apartment', 1.5, r), 'tv');
  assert.equal(roomState('apartment', 3 + 1 / 3600, r), 'tvoff', '3:00:01: the TV switching off');
  assert.equal(roomState('apartment', 3.5, r), 'dark', 'SP3: 3:30 — the TV room dark');
  assert.equal(roomState('bar', 12, r), 'closed');
  assert.equal(roomState('bar', 16.5, r), 'open');
  assert.equal(roomState('bar', 2.5, r), 'open');
  assert.equal(roomState('bar', 3.5, r), 'last');
  assert.equal(roomState('bar', 5, r), 'closed');
  assert.equal(roomState('shop', 8.5, r), 'closed');
  assert.equal(roomState('shop', 12, r), 'open');
  assert.equal(roomState('shop', 19, r), 'closed');
});

test('7b — NEVER FULLY DARK: at every minute of the night at least one speakeasy window is lit (the rooms, the TV, the night lamp, the bar\'s last light)', () => {
  const r = { wake: 7 * 3600 + 120, 'shop-open': 9 * 3600, bartender: 16 * 3600, 'lights-out': 22 * 3600 + 300 };
  for (let m = 0; m < 24 * 60; m += 5) {
    const h = m / 60;
    if (!darkAt(h, OCT.dark)) continue;
    const lit = ROOMS.some(rm => roomLight(rm.id, h) > 0.05 && !(rm.id === 'apartment')) || ['tv', 'tvoff'].includes(roomState('apartment', h, r)) || roomState('apartment', h, r) === 'lamp' || roomState('bar', h, r) === 'last';
    assert.ok(lit, `${Math.floor(h)}:${String(m % 60).padStart(2, '0')} — a light in the speakeasy`);
  }
});

test('7b — THE LEGENDARY TANGO: a few nights a year (one a season), three plays through the evening, all windows in turn', () => {
  const y = legendNights(2026), keys = Object.keys(y);
  assert.equal(keys.length, 4, 'four nights a year');
  assert.deepEqual(legendNights(2026), y, 'the same for everyone');
  assert.notDeepEqual(Object.keys(legendNights(2027)), keys, 'other nights next year');
  const months = keys.map(k => +k.slice(5, 7)).sort((a, b) => a - b);
  for (let q = 0; q < 4; q++) assert.ok(months[q] >= 1 + 3 * q && months[q] <= 3 + 3 * q, `one in quarter ${q + 1}`);
  for (const [k, starts] of Object.entries(y)) {
    assert.equal(starts.length, 3, `${k}: three plays`);
    for (const s of starts) assert.ok(s >= 20.5 * 3600 && s + MOMENT.tango.len <= 23.75 * 3600, `${k}: in the evening`);
    const p = dayPlan(k, { dow: new Date(k + 'T12:00Z').getUTCDay(), month: +k.slice(5, 7), dark: [19, 7] }).filter(e => e.id === 'tango');
    assert.equal(p.length, 3, `${k}: in the plan`);
    assert.ok(p.every(e => e.win === 'all'));
  }
  // an ordinary night: no tango
  assert.equal(dayPlan('2026-10-22', OCT).filter(e => e.id === 'tango').length, keys.includes('2026-10-22') ? 3 : 0);
});

test('7b — JOIN MID-WAY: the moment running at any second is the plan\'s (p from 0 to 1); the last hour\'s block carries over', () => {
  const plan = hourPlan('2026-10-22', 21, OCT), e = plan[5];
  const on = momentsAt(plan, e.t0 + e.len * 0.5);
  const me = on.find(o => o.n === e.n);
  assert.ok(me && Math.abs(me.p - 0.5) < 1e-9 && Math.abs(me.el - e.len / 2) < 1e-9, 'half-way through');
  assert.ok(!momentsAt(plan, e.t0 - 0.01).some(o => o.n === e.n) && !momentsAt(plan, e.t0 + e.len).some(o => o.n === e.n), 'not before, not after');
  // the routine at 22:0x still running into its next minute (its own block) — with the previous hour's block in the list
  const lo = routineAt('lights-out', '2026-10-22'), both = [...hourPlan('2026-10-22', 21, OCT), ...hourPlan('2026-10-22', 22, OCT)];
  assert.ok(momentsAt(both, lo + 5).some(o => o.id === 'lights-out'));
});

test('7b — THE TV GLOW: an IRREGULAR flicker — scenes of different lengths + levels, a fine flicker inside, now and then a bright cut', () => {
  const cuts = [], lv = [];
  let prev = null;
  for (let t = 0; t < 120; t += 0.05) {
    const v = tvLight(t);
    assert.ok(v.k >= 0.1 && v.k <= 1.25, `level ${v.k}`);   // (WIN: a wider swing — dim spells, bright cuts)
    if (prev && v.cut < prev.cut) cuts.push(t);
    prev = v; lv.push(v.k);
  }
  const lens = cuts.slice(1).map((t, i) => t - cuts[i]);
  assert.ok(lens.length > 30, `${lens.length} scene cuts in 2 min`);
  assert.ok(Math.min(...lens) < 0.8 && Math.max(...lens) > 2, `scenes of different lengths (${Math.min(...lens).toFixed(2)}–${Math.max(...lens).toFixed(2)} s): never a steady beat`);
  assert.ok(Math.max(...lv) - Math.min(...lv) > 0.7, 'a real swing in level');
  // (WIN — the owner: "flicker much more": a DIM spell somewhere in two minutes, and a jump of ≥ 0.3 in one step at a cut)
  assert.ok(lv.some(v => v < 0.3), 'a dim spell'); assert.ok(lv.some((v, i) => i && Math.abs(v - lv[i - 1]) >= 0.3), 'a hard jump at a cut');
  assert.deepEqual(tvLight(33.3, 7), tvLight(33.3, 7), 'a pure function of time');
  // the late TVs across the skyline: ~10 pm → ~3 am
  assert.equal(lateTvK(21.5), 0); assert.equal(lateTvK(23), 1); assert.equal(lateTvK(1.5), 1); assert.equal(lateTvK(3.5), 0); assert.equal(lateTvK(12), 0);
  assert.ok(lateTvK(22.15) > 0 && lateTvK(22.15) < 1, 'eased in');
});

test('7b — THE PREVIEW PANEL: a WINDOWS category, a row per moment (&force=window-<id>), the night ones marked; &force=window&moment= for links', () => {
  assert.ok(CATS.some(c => c.id === 'windows'));
  for (const m of MOMENTS) {
    const e = PANEL_EVENTS.find(o => o.id === `window-${m.id}`);
    assert.ok(e && e.cat === 'windows', `${m.id}: its row`);
    if (m.light === 'night') assert.ok(e.night, `${m.id}: ☾`);
  }
  assert.ok(EVENTS.some(e => e.id === 'window' && e.ready === false), 'the link id, hidden');
  assert.ok(partyAt(5, 21) && partyAt(6, 1) && !partyAt(4, 21) && !partyAt(5, 12));
});

test('SP3 — ONE STAR WINDOW AT A TIME: of the moments on now, the routines + the one that started first; the staging zooms close moments to the glass', async () => {
  const { starOnly, STAGE, STAGE_ROOM } = await import('../js/core/harbor-moments.js');
  const on = [{ id: 'dance', win: 'jazz', t0: 100 }, { id: 'toast', win: 'bar', t0: 90 }, { id: 'bartender', win: 'bar', t0: 50 }, { id: 'peek', win: 'apartment', t0: 95 }];
  const kept = starOnly(on).map(e => e.id).sort();
  assert.deepEqual(kept, ['bartender', 'toast'], 'the routine + the first-started star only');
  assert.deepEqual(starOnly([]), []);
  assert.ok(STAGE.peek > 1.4 && STAGE.toast > 1.3 && STAGE.dance >= 1.1 && STAGE_ROOM > 1, 'close moments bold at the glass, room moments a little deeper');
});

test("WIN2 — THE EDGE WINDOWS' MOODS: a seeded mood per edge window a night, never the same in both, every mood over a season; a party night turns one PARTY; the holidays tint them; lights-out near midnight", () => {
  const seen = new Set();
  for (let d = 0; d < 120; d++) { const t = new Date(Date.UTC(2026, 9, 1 + d)), key = dayKey(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()), m = edgeMoods(key);
    assert.ok(EDGE_MOODS.includes(m.edge2) && EDGE_MOODS.includes(m.edge3) && m.edge2 !== m.edge3, `${key}: ${m.edge2} / ${m.edge3}`); seen.add(m.edge2); seen.add(m.edge3);
    assert.ok(m.off >= 23.8 * 3600 && m.off <= 24.3 * 3600, 'lights out near midnight'); assert.deepEqual(edgeMoods(key), m, 'seeded: the same for everyone'); }
  assert.equal(seen.size, EDGE_MOODS.length, `every mood seen over a season (${[...seen].join(', ')})`);
  const p = edgeMoods('2026-10-24', { party: true }); assert.ok((p.edge2 === 'party') !== (p.edge3 === 'party'), 'a party night: one window on the party cycle');
  assert.equal(edgeMoods('2026-10-31', { hol: 'halloween' }).tint, 'halloween'); assert.equal(edgeMoods('2026-12-24', { hol: 'christmas' }).tint, 'christmas'); assert.equal(edgeMoods('2026-10-31').tint, null);
});

test("WIN2 — THE EYES IN THE HAZE: two weekend nights a month, three plays each between 11 pm and 4 am in ONE of the four full windows, never a legendary's night, never with the eerie-red mood; the small hours' plays land on the next day's plan", () => {
  let total = 0, red = 0;
  for (let mo = 1; mo <= 12; mo++) {
    const nights = eyesNights(2026, mo);
    for (const [key, starts] of Object.entries(nights)) {
      const [y, m, d] = key.split('-').map(Number), dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      assert.ok(dow === 5 || dow === 6, `${key}: a weekend night`); assert.equal(starts.length, 3, `${key}: three plays`);
      for (const s of starts) assert.ok(s >= 23 * 3600 && s + MOMENT.eyes.len <= 28 * 3600, `${key}: 11 pm → 4 am (${(s / 3600).toFixed(2)} h)`);
      assert.ok(!legendNight(y, m, d), `${key}: never a legendary's night`); assert.ok(!redMoodNight(key), `${key}: never with the eerie-red mood`);
      total++;
      // the plays on the day's plans: tonight's before midnight, the rest on the next day's, each in ONE window
      const today = eyesPlaysOn(key), next = eyesPlaysOn(`${y}-${String(m).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`);
      assert.equal(today.filter(p => p.t0 >= 23 * 3600).length + next.filter(p => p.t0 < 4 * 3600).length, 3, `${key}: every play lands on a day's plan (tonight's before midnight + the next day's small hours; a Friday's late plays may share the Saturday's plan)`);
      for (const p of [...today, ...next]) assert.ok(MOMENT.eyes.windows.includes(p.win), `${key}: in a full window (${p.win})`);
    }
    if (Object.keys(nights).length < 2) red++;
  }
  assert.equal(total, 24, `${total} eyes nights in 2026 (two a month, drawn from the eligible nights: ${red} months short)`);
  assert.deepEqual(eyesNights(2026, 10, { mothman: true }), {}, 'a Mothman night: none (the hook)');
  // the day's fixed plan carries them in one window; a play straddling midnight shows on both days' clocks
  const key = Object.keys(eyesNights(2026, 10))[0];
  if (key) { const fp = fixedPlan(key).filter(e => e.id === 'eyes'); assert.ok(fp.length >= 1 && fp.every(e => e.win !== 'all' && e.len === 150), `${key}: on the fixed plan in one window`); }
});
