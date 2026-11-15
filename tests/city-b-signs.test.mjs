// CITY B — GROUP 1: THE SIGNS ADVERTISE PLAYABLE GAMES ONLY (core/harbor-neon.js#signRoster + assignSigns' hotel blade; docs/harbor/passes/city-b.md).
//  - over a simulated year, no FROZEN game's name on any sign: the named signs, the roof billboard's pick, the speakeasy blade's ghost ad
//  - THE HOTEL BLADE's words always fit — one word ≥ 10 pt, JAY / WALK stacked ≥ 9 pt (the glance size) at 390 / 402 / 430
//  - the hotel blade never names the speakeasy blade's game that week (+ Monday morning's last week's when it can)
//  - &force=sign-jaywalk's roster: JAYWALK hangs (the hotel blade JAY / WALK some nights); a GAMES row turning playable joins with no code change
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { signSpots, assignSigns, billboardPick, signText, signRoster, hotelAvoid, SIGN_SPLIT } from '../js/core/harbor-neon.js';
import { ghostAdGame } from '../js/core/harbor-speakeasy.js';
import { signName, buildSign } from '../js/screens/harbor/signs.js';
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
const rosterOf = jay => signRoster(GAMES, { jaywalk: jay }).map(g => ({ ...g, short: signName(g) }));
const FROZEN = new Set(GAMES.filter(g => !g.playable).map(g => g.id));

test('CITY B: the sign roster is the PLAYABLE games only (+ JAYWALK under its force) — a row turning playable joins with no code change', () => {
  assert.deepEqual(signRoster(GAMES).map(g => g.id).sort(), GAMES.filter(g => g.playable).map(g => g.id).sort());
  assert.ok(signRoster(GAMES).every(g => !FROZEN.has(g.id) && !g.daily));
  assert.deepEqual(signRoster(GAMES, { jaywalk: true }).map(g => g.id).filter(id => id === 'jaywalk'), ['jaywalk']);
  // its future row: playable → on the roster by itself; frozen → only under the force
  const later = [...GAMES, { id: 'jaywalk', name: 'JAYWALK', playable: true }], frozen = [...GAMES, { id: 'jaywalk', name: 'JAYWALK', playable: false }];
  assert.ok(signRoster(later).some(g => g.id === 'jaywalk'));
  assert.ok(!signRoster(frozen).some(g => g.id === 'jaywalk') && signRoster(frozen, { jaywalk: true }).some(g => g.id === 'jaywalk'));
  assert.equal(signRoster(later, { jaywalk: true }).filter(g => g.id === 'jaywalk').length, 1, 'never twice');
});

test('CITY B: over a year no FROZEN game names any sign — the named signs, the billboard, the speakeasy blade', () => {
  for (const k of Object.keys(SIZES)) {
    const { L } = setup(k), spots = signSpots(L);
    for (const jay of [false, true]) {
      const R = rosterOf(jay), ids = R.map(g => g.id);
      for (const n of YEAR) {
        const pk = assignSigns(R, spots, n);
        for (const [sp, id] of pk) assert.ok(!FROZEN.has(id) || id === 'jaywalk', `${k} ${n}: ${id} on ${sp}`);
        const bb = billboardPick(R, spots, pk, n);
        assert.ok(bb == null || ids.includes(bb), `${k} ${n}: the billboard ${bb}`);
        const ad = ghostAdGame(Date.UTC(...n.split('-').map((v, i) => +v - (i === 1 ? 1 : 0)), 23), ids, null);
        assert.ok(ids.includes(ad), `${k} ${n}: the speakeasy blade ${ad}`);
      }
    }
  }
});

test('CITY B: THE HOTEL BLADE cycles the playable names that fit (PRISM · HOLDEM · JAY / WALK), never the speakeasy blade’s game that week', () => {
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), spots = signSpots(L), blade = spots.find(s => s.id === 'n-blade');
    assert.ok(blade && blade.rot === 'hotel');
    for (const jay of [false, true]) {
      const R = rosterOf(jay), ids = R.map(g => g.id), seen = new Map();
      for (const n of YEAR) {
        const pk = assignSigns(R, spots, n), id = pk.get('n-blade');
        assert.ok(id, `${k} ${n}: the hotel blade is lit`);
        const ad = hotelAvoid(n, ids);
        assert.notEqual(id, ad[0], `${k} ${n}: the hotel blade = the speakeasy blade's ${id}`);
        seen.set(id, (seen.get(id) || 0) + 1);
        // never the same game on two signs a night
        assert.equal(new Set(pk.values()).size, pk.size, `${k} ${n}: a game twice`);
      }
      assert.deepEqual([...seen.keys()].sort(), jay ? ['holdem', 'jaywalk', 'prism'] : ['holdem', 'prism'], `${k}: the names the hotel blade cycles (jaywalk ${jay})`);
      // the words fit + read: one word ≥ 10 pt, a split name ≥ 9 pt (the glance size); every letter spelled
      for (const id of seen.keys()) {
        const g = R.find(x => x.id === id), txt = signText(g, blade);
        assert.equal(txt, { prism: 'PRISM', holdem: 'HOLDEM', jaywalk: 'JAY WALK' }[id], `${k}: the hotel blade spells ${txt}`);
        assert.ok(txt.split(' ').every(w => w.length <= 6), `${k}: ${txt} — each word ≤ 6`);
        const sg = buildSign(blade, { ...GAMES.find(x => x.id === id) || g, signText: txt }, { W: cam.W, s: cam.F / 600 });
        assert.equal(sg.nText, txt.replace(/ /g, '').length);
        const p = sg.parts.find(q => q.boxes), lh = Math.min(...p.boxes.map(b => b.y1 - b.y0 - 1.2));
        assert.ok(lh >= (txt.includes(' ') ? 9 : 10), `${k}: ${txt} letters ${lh.toFixed(2)} pt`);
        if (txt.includes(' ')) {
          // the two words read as two: a clear break between Y and W, inside the panel
          const gap = p.boxes[3].y0 - p.boxes[2].y1;
          assert.ok(gap > 1.2, `${k}: JAY / WALK break ${gap.toFixed(2)} pt`);
          assert.ok(p.boxes[p.boxes.length - 1].y1 <= sg.panel.y + sg.panel.h + 0.6, `${k}: WALK inside the panel`);
        }
      }
    }
  }
});

test('CITY B: the hotel blade ≠ the speakeasy blade EVERY WEEK (Monday 9 am UTC → Monday), the rotation seeded (the same on every call)', () => {
  const { L } = setup('402x874'), spots = signSpots(L), R = rosterOf(false), ids = R.map(g => g.id);
  for (let w = 0; w < 52; w++) {
    const mon = new Date(Date.UTC(2026, 10, 16) + w * 7 * 864e5);
    const week = Array.from({ length: 7 }, (_, d) => new Date(+mon + d * 864e5).toISOString().slice(0, 10));
    const ad = ghostAdGame(+mon + 20 * 3600e3, ids, null);
    for (const n of week) assert.notEqual(assignSigns(R, spots, n).get('n-blade'), ad, `week of ${week[0]}: ${n}`);
  }
  assert.deepEqual([...assignSigns(R, spots, '2026-12-01')], [...assignSigns(R, spots, '2026-12-01')]);
  assert.deepEqual(Object.keys(SIGN_SPLIT), ['jaywalk']);
});
