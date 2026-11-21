// CITY PART 2 — NEVER A GAME TWICE AS A SIGN THE SAME NIGHT (the owner, Nov 21 1:05 am item 2 — HIGH RISE showed three times on one screen:
// billboard + roof + blade): the SPEAKEASY's side blade (the weekly game) SKIPS any game lit on tonight's named tube signs (the roofs, the hotel
// blade) — ONE pure rule (core/harbor-neon.js#litSigns + #bladeGame); the roof billboard is a rotating ad and may repeat a roof sign.
// Over every week of a year at every phone size + the desk, the evening AND a Monday morning (the painters still show last week's blade).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { signSpots, assignSigns, signRoster, litSigns, bladeGame } from '../js/core/harbor-neon.js';
import { ghostAdGame } from '../js/core/harbor-speakeasy.js';
import { signName } from '../js/screens/harbor/signs.js';
import { GAMES } from '../js/config.js';

const SIZES = {
  '390x844': { W: 390, H: 844, tag: { y: 296, h: 14 }, dock: { x: 14, y: 728, w: 362, h: 76 }, safe: { top: 47, bottom: 34 } },
  '402x874': { W: 402, H: 874, tag: { y: 319, h: 14 }, dock: { x: 14, y: 758, w: 374, h: 76 }, safe: { top: 62, bottom: 34 } },
  '430x932': { W: 430, H: 932, tag: { y: 322, h: 14 }, dock: { x: 14, y: 816, w: 402, h: 76 }, safe: { top: 59, bottom: 34 } },
  '1440x900': { W: 1440, H: 900, tag: { y: 411, h: 14 }, dock: { x: 510, y: 794, w: 420, h: 70 }, safe: { top: 0, bottom: 0 } },
};
const signOf = s => { const wide = s.W > s.H, desk = wide && s.W >= 1000;
  return { neon: { x: s.W / 2 - 140, y: s.tag.y - (desk ? 205 : wide ? 121 : 141), w: 280, h: desk ? 125 : wide ? 72 : 85 }, word: { x: s.W / 2 - 150, y: s.tag.y - 34, w: 300, h: 21 }, corner: { x: s.W - 60, y: s.safe.top + 8, w: 52, h: 44 } }; };
const setup = k => { const s = SIZES[k]; const cam = cameraFor(s.W, s.H, { tag: s.tag, dock: s.dock, ...signOf(s) }, s.safe); return harborLayout(cam); };
const YEAR = Array.from({ length: 371 }, (_, i) => new Date(Date.UTC(2026, 10, 2) + i * 864e5).toISOString().slice(0, 10));
const ROSTER = signRoster(GAMES).map(g => ({ ...g, short: signName(g) }));
const IDS = ROSTER.map(g => g.id);

test('a year of nights: the speakeasy blade NEVER names a game lit on a roof (or the hotel blade) that night — the evening + a Monday morning\'s last-week blade', () => {
  let moved = 0, nights = 0;
  for (const k of Object.keys(SIZES)) {
    const spots = signSpots(setup(k));
    for (const n of YEAR) {
      const pk = assignSigns(ROSTER, spots, n), lit = litSigns(pk, spots), [y, m, d] = n.split('-').map(Number);
      const roofs = spots.filter(s => s.kind === 'named' && s.type === 'box').map(s => pk.get(s.id)).filter(Boolean);
      assert.ok(roofs.every(g => lit.includes(g)), `${k} ${n}: every roof sign is lit (${roofs.join(' · ')})`);
      for (const ms of [Date.UTC(y, m - 1, d, 23), Date.UTC(y, m - 1, d, 8) - 2 * 864e5]) {
        const b = bladeGame(ms, IDS, lit);
        nights++;
        if (b !== ghostAdGame(ms, IDS, null)) moved++;
        if (lit.length < IDS.length) assert.ok(!lit.includes(b), `${k} ${n}: the blade ${b} is lit tonight (${lit.join(' · ')})`);
        else assert.equal(b, ghostAdGame(ms, IDS, null), `${k} ${n}: every name lit → the week's own`);
        if (k !== '1440x900') assert.ok(!roofs.includes(b), `${k} ${n}: the blade ${b} = a roof sign (${roofs.join(' · ')})`);
      }
    }
  }
  assert.ok(moved > 0 && moved < nights, `the rule moves the blade only on a clash (${moved} of ${nights})`);
});

test('the rule: the next game in the ad\'s order that is not lit; no clash = the week\'s own game; the scene reads it (all three blade picks)', () => {
  const ms = Date.UTC(2026, 10, 25, 23), wk = ghostAdGame(ms, IDS, null);
  assert.equal(bladeGame(ms, IDS, []), wk);
  assert.notEqual(bladeGame(ms, IDS, [wk]), wk);
  assert.equal(bladeGame(ms, IDS, IDS), wk, 'all lit → the week\'s own');
  const scene = readFileSync(new URL('../js/screens/harbor/scene.js', import.meta.url), 'utf8');
  assert.equal((scene.match(/ghostAdGame\(.*litTonight\(/g) || []).length, 3, 'speakCtx · speakCtxFor · bladeGameOn');
});
