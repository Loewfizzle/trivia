// CITY B — GROUP 1 (+ the owner's answers, Nov 15): THE CITY's SIGNS (core/harbor-neon.js#signRoster + assignSigns; docs/harbor/passes/city-b.md).
//  - the signs name the PLAYABLE games + JAYWALK (on the signs now, as if released) — never a frozen game, over a simulated year
//  - NO NAMED SIGN IS EVER DARK (the hotel blade + both roof signs, every night, every phone size + the desktop)
//  - OVERCLOCK = OVER / CLOCK and JAYWALK = JAY / WALK — ALWAYS two stacked lines on every sign (never one line); every stacked word ≥ the
//    glance size (~9 pt on a phone); the one-word names ≥ 10 pt
//  - THE HOTEL BLADE cycles PRISM · HOLDEM only (CITY D), never the speakeasy blade's game that week; the speakeasy blade stacks them too
//  - CITY D — NO GAME TWICE: roof A · roof B · the hotel blade · the speakeasy blade's weekly game = four DIFFERENT games every night, every one shown
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { signSpots, assignSigns, billboardPick, signText, signRoster, hotelAvoid, SIGN_SPLIT } from '../js/core/harbor-neon.js';
import { ghostAdGame } from '../js/core/harbor-speakeasy.js';
import { signName, buildSign } from '../js/screens/harbor/signs.js';
import { bladeWords } from '../js/screens/harbor/speakeasy-blade.js';
import { GAMES } from '../js/config.js';

const SIZES = {
  '390x844': { W: 390, H: 844, tag: { y: 296, h: 14 }, dock: { x: 14, y: 728, w: 362, h: 76 }, safe: { top: 47, bottom: 34 } },
  '402x874': { W: 402, H: 874, tag: { y: 319, h: 14 }, dock: { x: 14, y: 758, w: 374, h: 76 }, safe: { top: 62, bottom: 34 } },
  '430x932': { W: 430, H: 932, tag: { y: 322, h: 14 }, dock: { x: 14, y: 816, w: 402, h: 76 }, safe: { top: 59, bottom: 34 } },
  '1440x900': { W: 1440, H: 900, tag: { y: 411, h: 14 }, dock: { x: 510, y: 794, w: 420, h: 70 }, safe: { top: 0, bottom: 0 } },
};
const signOf = s => { const wide = s.W > s.H, desk = wide && s.W >= 1000;
  return { neon: { x: s.W / 2 - 140, y: s.tag.y - (desk ? 205 : wide ? 121 : 141), w: 280, h: desk ? 125 : wide ? 72 : 85 }, word: { x: s.W / 2 - 150, y: s.tag.y - 34, w: 300, h: 21 }, corner: { x: s.W - 60, y: s.safe.top + 6, w: 52, h: 44 } }; };
const setup = k => { const s = SIZES[k]; const cam = cameraFor(s.W, s.H, { tag: s.tag, dock: s.dock, ...signOf(s) }, s.safe); return { cam, L: harborLayout(cam) }; };
const YEAR = Array.from({ length: 371 }, (_, i) => new Date(Date.UTC(2026, 10, 2) + i * 864e5).toISOString().slice(0, 10));
const ROSTER = signRoster(GAMES).map(g => ({ ...g, short: signName(g) }));
const IDS = ROSTER.map(g => g.id);
const FROZEN = new Set(GAMES.filter(g => !g.playable).map(g => g.id));
const PHONE = ['n-blade', 'n-roofA', 'n-roofB'];

test('the roster: the PLAYABLE games + JAYWALK (as if released) — never a frozen game or a daily; a row turning playable joins with no code change', () => {
  assert.deepEqual(IDS.slice().sort(), [...GAMES.filter(g => g.playable).map(g => g.id), 'jaywalk'].sort());
  assert.ok(ROSTER.every(g => g.id === 'jaywalk' || (!FROZEN.has(g.id) && !g.daily)));
  const later = [...GAMES, { id: 'jaywalk', name: 'JAYWALK', playable: true }];
  assert.equal(signRoster(later).filter(g => g.id === 'jaywalk').length, 1, 'its own row, never twice');
  assert.ok(!signRoster(GAMES, { jaywalk: false }).some(g => g.id === 'jaywalk'));
});

test('a year of nights at 390 / 402 / 430 + 1440: NO NAMED SIGN EVER DARK, no frozen name anywhere (the signs, the billboard, the speakeasy blade)', () => {
  for (const k of Object.keys(SIZES)) {
    const { L } = setup(k), spots = signSpots(L), named = spots.filter(s => s.kind === 'named');
    for (const id of PHONE) assert.ok(named.some(s => s.id === id), `${k}: ${id} hangs`);
    for (const n of YEAR) {
      const pk = assignSigns(ROSTER, spots, n);
      for (const s of named) assert.ok(pk.get(s.id), `${k} ${n}: ${s.id} is DARK`);
      for (const [sp, id] of pk) assert.ok(IDS.includes(id), `${k} ${n}: ${id} on ${sp}`);
      for (const id of PHONE) assert.equal(new Set(PHONE.map(x => pk.get(x))).size, 3, `${k} ${n}: the phone's three named signs, three games`);
      const bb = billboardPick(ROSTER, spots, pk, n);
      assert.ok(bb == null || IDS.includes(bb), `${k} ${n}: the billboard ${bb}`);
      assert.ok(IDS.includes(ghostAdGame(Date.UTC(...n.split('-').map((v, i) => +v - (i === 1 ? 1 : 0)), 23), IDS, null)), `${k} ${n}: the speakeasy blade`);
    }
  }
});

test('OVER / CLOCK + JAY / WALK ALWAYS stacked on two lines on every sign; every stacked word ≥ ~9 pt, every one-word name ≥ 10 pt; every letter spelled', () => {
  assert.deepEqual(Object.keys(SIGN_SPLIT).sort(), ['jaywalk', 'overclock']);
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), spots = signSpots(L).filter(s => s.kind === 'named'), seen = new Set();
    for (const n of YEAR) {
      const pk = assignSigns(ROSTER, spots, n);
      for (const sp of spots) {
        const g = ROSTER.find(x => x.id === pk.get(sp.id)), txt = signText(g, sp), key = `${sp.id}|${g.id}`;
        if (seen.has(key)) continue; seen.add(key);
        if (SIGN_SPLIT[g.id]) assert.equal(txt, SIGN_SPLIT[g.id].join(' '), `${k}: ${g.id} on ${sp.id} stacked (${txt})`);
        const sg = buildSign(sp, { ...(GAMES.find(x => x.id === g.id) || g), signText: txt }, { W: cam.W, s: cam.F / 600 });
        assert.equal(sg.nText, txt.replace(/ /g, '').length, `${k}: ${sp.id} spells all of ${txt}`);
        const p = sg.parts.find(q => q.boxes), lh = Math.min(...p.boxes.map(b => b.y1 - b.y0 - 1.2));
        assert.ok(lh >= (txt.includes(' ') ? 9 : 10), `${k}: ${txt} on ${sp.id} — letters ${lh.toFixed(2)} pt`);
        if (txt.includes(' ') && sp.type === 'box') assert.equal(p.lines, 2, `${k}: ${txt} on two lines on ${sp.id}`);
      }
    }
    // every game has hung on a skyline sign over the year, the split names stacked wherever they hung
    for (const id of IDS) assert.ok([...seen].some(x => x.endsWith(`|${id}`)), `${k}: ${id} never hung`);
  }
  // the speakeasy blade stacks them too (two columns side by side, each read top-down)
  assert.deepEqual(bladeWords('OVERCLOCK'), ['OVER', 'CLOCK']); assert.deepEqual(bladeWords('JAYWALK'), ['JAY', 'WALK']); assert.deepEqual(bladeWords('PRISM'), ['PRISM']);
});

test('THE HOTEL BLADE cycles PRISM · HOLDEM ONLY (CITY D — JAY / WALK too long there) — never the speakeasy blade’s game that week (every night, 52 weeks); seeded', () => {
  for (const k of ['390x844', '402x874', '430x932']) {
    const { L } = setup(k), spots = signSpots(L), seen = new Set();
    for (const n of YEAR) {
      const id = assignSigns(ROSTER, spots, n).get('n-blade');
      assert.notEqual(id, hotelAvoid(n, IDS)[0], `${k} ${n}: the hotel blade = the speakeasy blade's ${id}`);
      seen.add(id);
    }
    assert.deepEqual([...seen].sort(), ['holdem', 'prism'], `${k}: the names the hotel blade cycles (CITY D: PRISM / HOLDEM only)`);
  }
  const { L } = setup('402x874'), spots = signSpots(L);
  for (let w = 0; w < 52; w++) {
    const mon = new Date(Date.UTC(2026, 10, 16) + w * 7 * 864e5), ad = ghostAdGame(+mon + 20 * 3600e3, IDS, null);
    for (let d = 0; d < 7; d++) assert.notEqual(assignSigns(ROSTER, spots, new Date(+mon + d * 864e5).toISOString().slice(0, 10)).get('n-blade'), ad);
  }
  assert.deepEqual([...assignSigns(ROSTER, spots, '2026-12-01')], [...assignSigns(ROSTER, spots, '2026-12-01')]);
});

// CITY D — NO GAME TWICE (the owner saw roof A HOLD'EM · roof B OVER/CLOCK · the hotel blade PRISM · the speakeasy blade OVER/CLOCK — JAYWALK nowhere):
// the four named signs show four DIFFERENT games every night — the roster has four names, so none repeats and every one shows
test('CITY D — a year of nights: roof A · roof B · the hotel blade · the speakeasy blade’s game = FOUR DIFFERENT games, all four names up', () => {
  assert.equal(IDS.length, 4, 'the roster: PRISM · HOLD’EM · OVERCLOCK · JAYWALK');
  for (const k of ['390x844', '402x874', '430x932']) {
    const { L } = setup(k), spots = signSpots(L);
    for (const n of YEAR) {
      const pk = assignSigns(ROSTER, spots, n), [y, m, d] = n.split('-').map(Number);
      // (the speakeasy blade as the evening shows it — on a Monday morning its painters still show last week's, avoided too where possible)
      const blade = ghostAdGame(Date.UTC(y, m - 1, d, 23), IDS, null);
      const four = [pk.get('n-roofA'), pk.get('n-roofB'), pk.get('n-blade'), blade];
      assert.equal(new Set(four).size, 4, `${k} ${n}: ${four.join(' · ')} — a game twice`);
      assert.ok(['prism', 'holdem'].includes(pk.get('n-blade')), `${k} ${n}: the hotel blade ${pk.get('n-blade')}`);
    }
  }
});
