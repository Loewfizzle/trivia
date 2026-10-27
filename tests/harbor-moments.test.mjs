// CITY 2.0 — PART 7b: THE SPEAKEASY'S LIFE — the window moments' catalogue + the day's schedule + the rooms' states (PURE:
// js/core/harbor-moments.js). Run: node --test tests/harbor-moments.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { windowParty, windowPartyAt, partyRoomK, PARTY_ROOMS, PARTY_COLS, PARTY_DOWN, tvShadow, tvHolidayTint, quietNight, bedtimes, bedLevel, BED_ROOMS, MOMENTS, MOMENT, STARTERS, RARITIES, WINDOW_IDS, TANGO_PATH, MAX_AT_ONCE, hourPlan, dayPlan, fixedPlan, momentsAt, routineAt, legendNights, roomState, tvLight, lateTvK, inHours, partyAt, darkAt, windowsOf, dayKey, edgeMoods, EDGE_MOODS, redMoodNight, eyesNights, eyesPlaysOn } from '../js/core/harbor-moments.js';
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
    assert.ok(m.len > 3 && (m.len <= 60 || m.calendar === 'eyes' || m.rarity === 'holiday'), `${m.id}: a length`);   // (WIN2: the eyes WATCH — a long presence, its own calendar; 11a-2: a holiday's room life plays in long chunks)
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
  assert.deepEqual(TANGO_PATH.slice().sort(), ROOMS.map(r => r.id).filter(id => id !== 'apartment').sort(), 'the tango passes every window but the boss\'s (SP5)');
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

test("WIN3 — THE BOSS's TV: the flicker IRREGULAR, never periodic (the cut intervals spread, no one interval dominating), LONG STEADY DIM STRETCHES, a CHANNEL-FLIPPING BURST only late; a rare shadow across the ceiling; the holiday film's tint", () => {
  const cuts = (o, T = 600) => { const ts = []; let prev = tvLight(0, 11, o).k; for (let t = 1 / 60; t < T; t += 1 / 60) { const k = tvLight(t, 11, o).k; if (Math.abs(k - prev) > 0.22) ts.push(t); prev = k; } return ts; };
  const early = cuts({}), iv = early.slice(1).map((t, i) => t - early[i]).filter(d => d > 0.05);
  const mean = iv.reduce((a, b) => a + b, 0) / iv.length, sd = Math.sqrt(iv.reduce((a, b) => a + (b - mean) ** 2, 0) / iv.length);
  const hist = new Map(); for (const d of iv) { const q = Math.round(d / 0.35); hist.set(q, (hist.get(q) || 0) + 1); }
  const top = Math.max(...hist.values()) / iv.length;
  assert.ok(early.length > 150 && sd / mean > 0.5 && top < 0.45, `irregular: ${early.length} cuts in 10 min, the intervals' spread ${(sd / mean).toFixed(2)} of the mean, the commonest interval ${(top * 100).toFixed(0)} %`);
  // a long steady dim stretch: ≥ 6 s with no jump and a low level
  let run = 0, best = 0, lowRun = false; { let prev = tvLight(0, 11).k; for (let t = 1 / 60; t < 600; t += 1 / 60) { const v = tvLight(t, 11); if (Math.abs(v.k - prev) < 0.05 && v.quiet) run += 1 / 60; else { if (run > best) { best = run; lowRun = v.k < 0.4 || lowRun; } run = 0; } prev = v.k; } }
  assert.ok(best >= 6, `a steady dim stretch of ${best.toFixed(1)} s`);
  // the burst: ≥ 12 cuts inside 2 s somewhere in 10 min — only late
  const burstIn = ts => ts.some((t, i) => ts[i + 12] != null && ts[i + 12] - t < 2);
  assert.ok(burstIn(cuts({ late: true })), 'a channel-flipping burst late');
  assert.ok(!burstIn(early), 'no burst early in the evening');
  // the shadow: a few crossings an hour, each a smooth 0 → 1 → 0, never more than one at a time
  let crossings = 0, on = false, maxA = 0; for (let t = 0; t < 3600; t += 0.1) { const sh = tvShadow(t, 11); if (sh) { maxA = Math.max(maxA, sh.a); assert.ok(sh.u >= 0 && sh.u < 1 && sh.a >= 0 && sh.a <= 1); if (!on) crossings++; on = true; } else on = false; }
  assert.ok(crossings >= 8 && crossings <= 24 && maxA > 0.95, `${crossings} shadows an hour`);
  assert.deepEqual(tvHolidayTint('halloween').col.length, 3); assert.equal(tvHolidayTint(null), null); assert.ok(tvHolidayTint('christmas').w < 0.3);
});

test("WIN3 — THE QUIET NIGHTS: ~1 in 6 over a year, mostly Sun–Wed, never Friday / Saturday nor a party night; the bedtimes one by one after midnight (~00:20 → ~01:35, a seeded order, every phone the same); the lamp CLICKS off", () => {
  let n = 0, early = 0, days = 0; const seen = new Set();
  for (let d = new Date(Date.UTC(2026, 0, 1)); d.getUTCFullYear() === 2026; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = dayKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()), dow = d.getUTCDay(); days++;
    if (quietNight(key, {})) { n++; assert.ok(dow !== 5 && dow !== 6, `${key}: never Friday / Saturday`); if (dow <= 3) early++; seen.add(dow); }
    assert.equal(quietNight(key, { party: true }), false, 'never a party night');
  }
  assert.ok(n / days > 1 / 9 && n / days < 1 / 4, `${n} quiet nights in ${days} days (1 in ${(days / n).toFixed(1)})`);
  assert.ok(early / n >= 0.75 && seen.has(4), `${(100 * early / n).toFixed(0)} % on Sun–Wed, a few Thursdays`);
  const b = bedtimes('2026-10-27'), b2 = bedtimes('2026-10-28'), ts = Object.values(b);
  assert.deepEqual(Object.keys(b).sort(), [...BED_ROOMS].sort());
  assert.ok(Math.min(...ts) >= 20 * 60 && Math.max(...ts) <= 96 * 60, `all between 00:20 and 01:36 (${ts.map(v => (v / 60).toFixed(0)).join(' ')})`);
  const sorted = [...ts].sort((p, q) => p - q); for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i] - sorted[i - 1] >= 7 * 60, 'one by one, ≥ 7 min apart');
  assert.deepEqual(bedtimes('2026-10-27'), b, 'the same for everyone'); assert.notDeepEqual(Object.entries(b2).sort((p, q) => p[1] - q[1]).map(e => e[0]), Object.entries(b).sort((p, q) => p[1] - q[1]).map(e => e[0]).concat(['x']), 'another night differs');
  assert.equal(bedLevel(b, 'bar', -3600), 1); assert.equal(bedLevel(b, 'bar', b.bar - 1), 1); assert.ok(bedLevel(b, 'bar', b.bar + 0.05) < 0.5 && bedLevel(b, 'bar', b.bar + 0.15) > 0.5 && bedLevel(b, 'bar', b.bar + 1) === 0, 'a click: off, a flash back, off');
  assert.equal(bedLevel(b, 'apartment', 7200), 1, 'the apartment never goes to bed');
  assert.equal(bedLevel(b, 'bar', 3 * 3600 + 1), 1, 'the beds end at 3 am with the TV (never fully dark after)');
});

test('WIN3 — THE PARTY IN THE WINDOWS: a seeded order a night (every phone the same, another night differs), one room at a time ~every 8–13 s — all up within ~60 s — each its own colour (never two alike), the TV room never; down in the same order over the last minute; a raid cuts it dead', () => {
  const P = windowParty('2026-10-24'), Q = windowParty('2026-10-31');
  assert.deepEqual([...P.order].sort(), [...PARTY_ROOMS].sort()); assert.ok(!P.order.includes('apartment'), 'the boss never joins');
  assert.deepEqual(windowParty('2026-10-24'), P, 'the same for everyone'); assert.notDeepEqual(Q.order, P.order);
  const ats = P.order.map(id => P.at[id]); for (let i = 1; i < ats.length; i++) assert.ok(ats[i] - ats[i - 1] >= 8 && ats[i] - ats[i - 1] <= 13, `one by one: ${ats.join(' ')}`);
  assert.ok(ats[0] <= 4 && ats[ats.length - 1] <= 60, `the whole building within ~60 s (${ats.join(' ')})`);
  assert.equal(new Set(P.order.map(id => P.col[id].join())).size, P.order.length, 'never two rooms alike'); for (const id of P.order) assert.ok(PARTY_COLS.some(c => c.join() === P.col[id].join()));
  // the shape through the peak: nothing before, the first room up by 6 s, all up by 62 s, held, then down first-up-first over the last minute, all off at the end
  assert.equal(windowPartyAt(P, -5, 3000).on, false);
  const k6 = windowPartyAt(P, ats[0] + 2, 3000).k; assert.ok(k6[P.order[0]] === 1 && k6[P.order[1]] === 0, 'the first room up alone at first');
  const kAll = windowPartyAt(P, 62, 3000).k; assert.ok(P.order.every(id => kAll[id] === 1), 'all up by 62 s');
  const kDown = windowPartyAt(P, 3000, PARTY_DOWN - 2).k; assert.ok(kDown[P.order[0]] < 0.2 && kDown[P.order[4]] === 1, 'the first up is the first down');
  assert.equal(windowPartyAt(P, 3000, 0).on, false, 'all off at the peak\'s end');
  for (let i = 1; i < 300; i++) { const a = windowPartyAt(P, i * 0.2, 3000).k, b = windowPartyAt(P, (i + 1) * 0.2, 3000).k; for (const id of P.order) assert.ok(b[id] >= a[id] - 1e-9, 'monotonic on the way up'); }
  const cut = windowPartyAt(P, 200, 3000, 0.5); assert.ok(cut.cut && !cut.on && P.order.every(id => cut.k[id] === 0), 'a raid cuts it dead');
  assert.equal(partyRoomK(P, 'apartment', 500, 3000), 0);
});

// ---------------------------------------------------------------- SP5 — THE BOSS's ROOM
test('SP5 — NO MOMENT EVER IN THE BOSS\'S ROOM: not in the catalogue, not the tango, not a year of schedules with every holiday + gate on', async () => {
  const M = await import('../js/core/harbor-moments.js');
  assert.equal(M.BOSS_ROOM, 'apartment');
  // (the one routine left there, LIGHTS OUT, is the room's own state change — the lamp off, the set on — with NO figure: the e2e proves nobody is drawn)
  for (const m of M.MOMENTS) if (m.id !== 'lights-out') assert.ok(!M.windowsOf(m).includes('apartment'), `${m.id} never plays in the boss's room (${M.windowsOf(m).join(',')})`);
  assert.ok(!M.TANGO_PATH.includes('apartment'), 'the tango skips it');
  assert.deepEqual(M.MOMENT.wake.windows, ['back'], 'THE UPSTAIRS WAKES moved to the back room (the owner saw it in the boss\'s window)');
  // a year of days, the holidays at full stage on their eve, the bootleggers + a raid, hot + rain, party nights: never an entry in the apartment
  let n = 0;
  for (let d = 0; d < 366; d += 3) {
    const day = new Date(Date.UTC(2026, 0, 1 + d)), key = M.dayKey(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate()), dow = day.getUTCDay();
    for (const hol of [null, { id: 'halloween', stage: 1, eve: true, w: 1 }, { id: 'dotd', stage: 1, eve: true, w: 1, ofrendas: 1 }]) {
      for (const e of M.dayPlan(key, { dow, month: day.getUTCMonth() + 1, dark: [19, 7], hol, boot: d % 2 === 0, raid: d % 4 === 0, wx: d % 3 === 0 ? 'hot' : 'rain', seed: 1924 })) { n++; if (e.id !== 'lights-out') assert.notEqual(e.win, 'apartment', `${key} ${e.id} in the boss's room`); if (e.win === 'all') assert.ok(!M.windowsOf(M.MOMENT[e.id]).includes('apartment')); }
    }
  }
  assert.ok(n > 20000, `${n} entries checked`);
});

test('SP5 — THE TV LIGHT\'S SMALL NUDGE: calmer than WIN3 (the owner: mostly steady blue; fewer, gentler jumps; the yellow flashes much rarer) — not a redesign', async () => {
  const { tvLight } = await import('../js/core/harbor-moments.js');
  // WIN3 measured over the same ten minutes (seed 11): hard jumps (> 0.25 a frame) 86 / min, warm flashes 85, the mean frame change 0.034, steady stretches 2 %
  for (const late of [false, true]) {
    let warm = 0, dk = 0, n = 0, big = 0, quiet = 0, lastWarm = 0, lastK = null, lo = 2, hi = 0;
    for (let t = 0; t < 600; t += 1 / 60) { const v = tvLight(t, 11, { late }); if (v.quiet) quiet++; if (v.warm && !lastWarm) warm++; lastWarm = v.warm; lo = Math.min(lo, v.k); hi = Math.max(hi, v.k); if (lastK != null) { const d = Math.abs(v.k - lastK); dk += d; n++; if (d > 0.25) big++; } lastK = v.k; }
    assert.ok(big / 10 < 45 && big / 10 > 5, `${late ? 'late' : 'early'}: hard jumps ${(big / 10).toFixed(1)} / min (WIN3: 86 — fewer, still some)`);
    assert.ok(warm >= 3 && warm <= 30, `warm flashes ${warm} in ten minutes (WIN3: 85 — much rarer, not gone)`);
    assert.ok(dk / n < 0.024 && dk / n > 0.008, `the mean frame change ${(dk / n).toFixed(4)} (WIN3: 0.034 — gentler, still alive)`);
    assert.ok(quiet / n > 0.08, `steady stretches ${(100 * quiet / n).toFixed(0)} % of the time (WIN3: 2 %)`);
    assert.ok(lo >= 0.12 && hi > 0.9, `the range kept: ${lo.toFixed(2)} – ${hi.toFixed(2)} (the cuts still swing)`);
  }
});

test('SP5 — THE BOSS\'S DAY: 5–8 seeded events between 7:30 and 21:30, never two at once, shadows only on an overcast day, the same for everyone', async () => {
  const { bossDayPlan, bossDayAt } = await import('../js/core/harbor-moments.js');
  for (let d = 1; d <= 30; d++) {
    const key = `2026-11-${String(d).padStart(2, '0')}`;
    for (const overcast of [false, true]) {
      const P = bossDayPlan(key, { overcast });
      assert.ok(P.length >= 5 && P.length <= 8, `${key}: ${P.length} events`);
      for (let i = 0; i < P.length; i++) { const e = P[i]; assert.ok(e.t0 >= 7.5 * 3600 && e.t0 + e.len <= 21.6 * 3600, `${key} ${e.id} at ${(e.t0 / 3600).toFixed(2)}`); assert.ok(['peek', 'smoke', 'shadow'].includes(e.id)); if (i) assert.ok(e.t0 > P[i - 1].t0 + P[i - 1].len + 60, 'never two at once'); }
      if (!overcast) assert.ok(!P.some(e => e.id === 'shadow'), 'no shadow behind the lit shade on a clear day');
      assert.deepEqual(P, bossDayPlan(key, { overcast }), 'seeded');
    }
  }
  const P = bossDayPlan('2026-11-03', { overcast: true }), e = P[0];
  assert.deepEqual(bossDayAt(P, e.t0 - 1), null); assert.equal(bossDayAt(P, e.t0 + 1).id, e.id); assert.ok(bossDayAt(P, e.t0 + 1).p > 0);
  assert.ok([...Array(30)].some((_, d) => bossDayPlan(`2026-11-${String(d + 1).padStart(2, '0')}`, { overcast: true }).some(x => x.id === 'shadow')), 'overcast days do get a shadow');
});

test('SP5 — THE BOOTLEGGERS\' TELL: the violet spade from 3 pm on a Saturday / 5 pm before a weeknight run until the truck arrives, never on another day', async () => {
  const { bossSignal, SIGNAL_FROM } = await import('../js/core/harbor-moments.js');
  assert.deepEqual(SIGNAL_FROM, { sat: 15, week: 17 });
  assert.equal(bossSignal(16 * 3600, { boot: false, sat: true }), 0, 'not a bootleg day: dark');
  assert.equal(bossSignal(14.9 * 3600, { boot: true, sat: true, truckAt: 18.6 * 3600 }), 0, 'Saturday 2:54 pm: not yet');
  assert.ok(bossSignal(15.01 * 3600, { boot: true, sat: true, truckAt: 18.6 * 3600 }) > 0.9, 'Saturday 3:00:36 pm: lit (a 25-s fade)');
  assert.equal(bossSignal(18.5 * 3600, { boot: true, sat: true, truckAt: 18.6 * 3600 }), 1, 'Saturday 6:30 pm: still lit');
  assert.equal(bossSignal(18.6 * 3600, { boot: true, sat: true, truckAt: 18.6 * 3600 }), 0, 'the truck arrives: off at once');
  assert.equal(bossSignal(16.5 * 3600, { boot: true, sat: false, truckAt: 22.8 * 3600 }), 0, 'a weeknight run: dark at 4:30 pm');
  assert.equal(bossSignal(21 * 3600, { boot: true, sat: false, truckAt: 22.8 * 3600 }), 1, 'a weeknight run: lit at 9 pm');
  assert.equal(bossSignal(23 * 3600, { boot: true, sat: false, truckAt: 22.8 * 3600 }), 0, 'off after the truck');
  assert.equal(bossSignal(18 * 3600, { boot: true, sat: true }), 1, 'without the schedule: the delivery window\'s middle');
});

test('11a-2 — THE BOSS AT THE SHADE: he walks up, stands ~15 min (a weight shift, the ember on a draw, a slow head turn), walks away ~10 min, back… ~1 h 45 min at the peak, then done', async () => {
  const { bossWatchPlan, bossWatchAt, BOSS_WATCH } = await import('../js/core/harbor-moments.js');
  for (const seed of [11, 1924, 7, 99]) {
    const P = bossWatchPlan(seed);
    assert.deepEqual(P, bossWatchPlan(seed), 'seeded');
    assert.equal(P.length, BOSS_WATCH.stands);
    const stands = P.map(p => (p.t1 - p.t0) / 60), aways = P.slice(1).map((p, i) => (p.t0 - P[i].t1) / 60), end = P[P.length - 1].t1 / 60;
    assert.ok(stands.every(m => m >= 15 && m <= 18.5) && aways.every(m => m >= 10 && m <= 13) && end >= 95 && end <= 115, `seed ${seed}: stands ${stands.map(v => v.toFixed(1))}, aways ${aways.map(v => v.toFixed(1))}, done at ${end.toFixed(0)} min`);
    // the walk-up: the shadow sharpens + darkens over the first seconds; the walk away the reverse; nothing after the last stand
    const p = P[1], w0 = bossWatchAt(P, p.t0 + 0.5, seed), w1 = bossWatchAt(P, p.t0 + 3.5, seed), w2 = bossWatchAt(P, p.t0 + 30, seed), wa = bossWatchAt(P, p.t1 - 1, seed);
    assert.ok(w0.phase === 'up' && w1.phase === 'up' && w0.near < w1.near && w1.near < 1 && w2.phase === 'stand' && w2.near === 1 && wa.phase === 'away' && wa.near < 0.5, 'up → stand → away');
    assert.equal(bossWatchAt(P, p.t1 + 60, seed), null, 'gone between stands');
    assert.equal(bossWatchAt(P, P[P.length - 1].t1 + 10, seed), null, 'done for the night');
    // the tiny life over a stand: the weight + the head move (slowly), the ember flares on a few draws
    let draws = 0, prev = 0, shifts = new Set(), heads = new Set(), maxStep = 0, last = null;
    for (let s = p.t0 + BOSS_WATCH.up; s < p.t1 - BOSS_WATCH.off; s += 0.1) { const w = bossWatchAt(P, s, seed); if (w.ember > 0.5 && prev <= 0.5) draws++; prev = w.ember; shifts.add(Math.round(w.shift * 4)); heads.add(Math.round(w.head * 4)); if (last) maxStep = Math.max(maxStep, Math.abs(w.shift - last.shift), Math.abs(w.head - last.head)); last = w; }
    assert.ok(draws >= 12 && draws <= 40 && shifts.size >= 3 && heads.size >= 3 && maxStep < 0.2, `a stand: ${draws} draws, ${shifts.size} weights, ${heads.size} head turns, the biggest step ${maxStep.toFixed(3)} a tenth of a second (smooth)`);
  }
  // the preview's demo cycle: a stand within a few seconds of the flag, walking away within a minute
  const D = bossWatchPlan(11, { demo: true });
  assert.ok(bossWatchAt(D, 6, 11) && bossWatchAt(D, 6, 11).phase === 'up' && bossWatchAt(D, 20, 11).phase === 'stand' && bossWatchAt(D, D[0].t1 - 1, 11).phase === 'away' && D[0].t1 < 60);
});

test('SP5 — THE EDGE WINDOWS\' ROLLER SHADES: a seeded height a night (up / half / down), the two never alike, every height seen over a season', async () => {
  const { edgeShades, SHADE_HEIGHTS } = await import('../js/core/harbor-moments.js');
  const seen = { edge2: new Set(), edge3: new Set() };
  for (let d = 1; d <= 90; d++) {
    const dt = new Date(Date.UTC(2026, 9, d)), key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
    const S = edgeShades(key);
    assert.ok(SHADE_HEIGHTS.includes(S.edge2) && SHADE_HEIGHTS.includes(S.edge3) && S.edge2 !== S.edge3, `${key}: ${S.edge2} / ${S.edge3}`);
    assert.deepEqual(S, edgeShades(key), 'seeded');
    seen.edge2.add(S.edge2); seen.edge3.add(S.edge3);
  }
  assert.equal(seen.edge2.size + seen.edge3.size, 6, 'every height on both windows over 90 nights');
});

test("11a-2 — THANKSGIVING's ROOM LIFE: the family table (back) 3 pm → 9:30 pm + the game on TV (jazz) 12:30 → 7 pm, back-to-back on the day only, never the boss's room", async () => {
  const M = await import('../js/core/harbor-moments.js');
  const TG = { dow: 4, month: 11, dark: [17.6, 7.6] };
  for (const [key, ok] of [['2026-11-26', true], ['2027-11-25', true], ['2026-11-25', false], ['2026-11-27', false], ['2026-11-19', false], ['2027-11-26', false]]) {
    const plan = M.dayPlan(key, TG), tb = plan.filter(e => e.id === 'table'), fb = plan.filter(e => e.id === 'football');
    if (!ok) { assert.equal(tb.length + fb.length, 0, `${key}: not Thanksgiving`); continue; }
    for (const [list, win, from, to] of [[tb, 'back', 15, 21.5], [fb, 'jazz', 12.5, 19]]) {
      assert.ok(list.length >= 20, `${key}: ${list.length} chunks`);
      assert.ok(list.every(e => e.win === win && e.win !== M.BOSS_ROOM), `${key}: in ${win}`);
      // back-to-back: no gap between chunks, the first one flagged (they arrive), the last (they leave)
      for (let i = 1; i < list.length; i++) assert.equal(list[i].t0, list[i - 1].t0 + list[i - 1].len, `${key}: seamless at ${i}`);
      assert.ok(list[0].first && list[list.length - 1].last && !list[1].first);
      assert.ok(list[0].t0 >= from * 3600 && list[0].t0 < from * 3600 + 400, `${key}: starts ~${from}`);
      const end = list[list.length - 1].t0 + list[list.length - 1].len; assert.ok(Math.abs(end - to * 3600) < 900, `${key}: ends ~${to}`);
      // anyone opening the city at 4 pm / 6 pm sees it running (the windows read the hour's block + the last)
      for (const h of [16, 18]) {
        const sec = h * 3600 + 7 * 60; if (sec < from * 3600 || sec >= end) continue;
        const on = M.starOnly(M.momentsAt([...M.hourPlan(key, h - 1, TG), ...M.hourPlan(key, h, TG)], sec)); assert.ok(on.some(e => e.win === win), `${key} ${h}:07 → ${win} on`);
      }
    }
    // the random draws keep out of their windows while they run
    for (const e of plan) if (e.id !== 'table' && e.id !== 'football' && e.win !== 'all') for (const o of [...tb, ...fb]) assert.ok(!(e.win === o.win && e.t0 < o.t0 + o.len && e.t0 + e.len > o.t0), `${key}: ${e.id} clear of ${o.id}`);
  }
  assert.equal(M.MOMENT.table.rarity, 'holiday'); assert.ok(!M.MOMENTS.filter(m => m.rarity === 'holiday').some(m => M.RARITY[m.rarity]), 'never in the random pool');
  assert.equal(M.WINDOW_LOOKS.table, 'lit'); assert.equal(M.WINDOW_LOOKS.football, 'lit');
});

// SP6 — THE BLUE TV WINDOW's colours: the owner's picked set, cut between like scenes
test('SP6 tvScene: the picked blues, cuts every ~3–8 s (long steady stretches), F + W brief + back to B, mostly B, deterministic', async () => {
  const { tvScenes, tvScene, TV_PAL } = await import('../js/core/harbor-moments.js');
  const ids = Object.keys(TV_PAL);
  assert.deepEqual(ids.sort(), ['A', 'B', 'F', 'H', 'N', 'W']);
  for (const id of ids) if (id !== 'W') { const [r, g, b] = TV_PAL[id][0]; assert.ok(b === 255 && r <= 90 && g <= 110, `${id} deep + saturated (no white)`); }
  let time = { B: 0 }, total = 0, longs = 0;
  for (let slot = 0; slot < 400; slot++) {
    const L = tvScenes(slot, 11);
    assert.equal(L[0].t0, 0);
    for (let i = 0; i < L.length; i++) {
      const s = L[i], last = i === L.length - 1;
      if (i) assert.notEqual(s.id, L[i - 1].id, 'a cut is a change');
      if (i && (L[i - 1].id === 'F' || L[i - 1].id === 'W')) assert.equal(s.id, 'B', 'a brief scene settles on B');
      if (!last) { if (s.id === 'F' || s.id === 'W') assert.ok(s.len >= 1.2 && s.len <= 2.2); else assert.ok(s.len >= 3 && s.len <= 20); }
      if (s.len >= 12) longs++;
      time[s.id] = (time[s.id] || 0) + s.len; total += s.len;
    }
  }
  assert.ok(time.B / total > 0.45, `B is home: ${(time.B / total).toFixed(2)} of the time`);
  assert.ok((time.W || 0) / total < 0.05 && (time.F || 0) / total < 0.06, 'F + W only now + then');
  assert.ok(longs > 100, 'long steady stretches');
  assert.deepEqual(tvScene(1234.5, 11), tvScene(1234.5, 11));
});
