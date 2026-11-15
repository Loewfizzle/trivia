// CITY E — THE TAPPABLE SHARE CARD on the emulators (database :9000 + auth :9099): the upload's accept / refuse rules (no finish · wrong size ·
// not a PNG · too big · a second card replaces the first), the link-preview page + the picture's GETs (the edge cache, an unknown code → the
// site's home), the owner's /admin delete, and THE SWEEP after 7 days.
//   cd tests/integration && npm run emulators   ·   node --test share-card.test.mjs
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync, crc32 } from 'node:zlib';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';
import { dailyAction, shareGet } from '../../api/daily.js';
import { adminAction } from '../../api/admin.js';
import { CARD_W, CARD_H, MAX_BYTES, sweepShares, forgetShareSweep } from '../../api/_lib/share-card.js';
import { streakDay, dayNum, dayOf } from '../../js/core/streak.js';
import { DAILIES } from '../../js/config.js';
import { clearSwitchCache } from '../../api/_lib/dailies.js';

after(async () => { await deleteApp(fb().app); });

/** a REAL PNG of w × h (RGB, one flat colour + `noise` random rows to grow it) */
function png(w, h, noise = 0) {
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'latin1'), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td) >>> 0); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h, 40);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; if (y < noise) for (let x = 1; x <= w * 3; x++) raw[y * (w * 3 + 1) + x] = (Math.random() * 256) | 0; }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
/** a GET through the handler → { status, headers, body } */
async function get(url) {
  const H = {}; let body = Buffer.alloc(0);
  const res = { statusCode: 200, setHeader: (k, v) => { H[k.toLowerCase()] = v; }, end: b => { if (b) body = Buffer.isBuffer(b) ? b : Buffer.from(String(b)); } };
  await shareGet({ url, headers: { host: 'www.neonspeakeasy.com' } }, res);
  return { status: res.statusCode, headers: H, body };
}
const ensure = (uid, name) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', T0);
const T0 = Date.UTC(2026, 10, 15, 18);   // (Sun Nov 15, 1 pm Eastern)
const today = streakDay(T0), G = DAILIES[0].id, G2 = DAILIES[1].id;

test('CITY E — THE TAPPABLE SHARE CARD: accept / refuse, ONE a day (a re-share replaces it), the page + the picture, /admin delete, the sweep', async () => {

  const was = await val('progress/dailies'); await ref('progress/dailies').set({ on: true, at: Date.UTC(2026, 9, 1) }); clearSwitchCache();
  const a = await ensure('u-shr-a', 'ShareAmy'), b = await ensure('u-shr-b', 'ShareBob');
  const ok = png(CARD_W, CARD_H).toString('base64');
  const call = (uid, extra) => dailyAction(uid, { action: 'shareCard', day: today, games: [G], png: ok, ...extra }, T0 + 1000);
  const refused = async (p, code) => { await assert.rejects(p, e => e.code === code, `refused: ${code}`); };
  try {
    await ref(`dly/${G}/${today}/r/${a.pid}`).set(4);
    // REFUSED: no judged finish of that daily that day · a second daily named that isn't finished · wrong size · not a PNG · too big
    await refused(call('u-shr-b'), 'no_finish');
    await refused(call('u-shr-a', { games: [G, G2] }), 'no_finish');
    await refused(call('u-shr-a', { png: png(1080, 1350).toString('base64') }), 'wrong_size');
    await refused(call('u-shr-a', { png: Buffer.from('GIF89a not a png at all, padded out to look plausible').toString('base64') }), 'not_png');
    const big = png(CARD_W, CARD_H, CARD_H);
    assert.ok(big.length > MAX_BYTES, `the noisy card is over the cap (${big.length})`);
    await refused(call('u-shr-a', { png: big.toString('base64') }), 'too_big');
    await refused(call('u-shr-a', { day: dayOf(dayNum(today) - 3) }), 'bad_day');
    assert.equal(await val('shr'), null, 'nothing stored by a refusal');
    // ACCEPTED: a server-made code (never the pid), stored server-side; the page + the picture
    const r1 = await call('u-shr-a');
    assert.match(r1.code, /^[A-Za-z0-9_-]{12}$/); assert.ok(!r1.code.includes(a.pid)); assert.equal(r1.path, `/api/daily?s=${r1.code}`);
    assert.equal(await val(`shrp/${a.pid}/${today}`), r1.code);
    const page = await get(`/api/daily?s=${r1.code}`);
    assert.equal(page.status, 200); assert.match(page.headers['content-type'], /text\/html/);
    const html = page.body.toString();
    assert.match(html, /<meta property="og:title" content="SHAREAMY · [A-Z' ]+ · Nov 15">/, 'og:title = <NAME> · <DAILY> · <day>');
    assert.ok(html.includes(`<meta property="og:image" content="https://www.neonspeakeasy.com/api/daily?si=${r1.code}">`));
    assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'));
    assert.ok(html.includes('/?daily=1'), 'a person goes straight on to the daily');
    assert.ok(!html.includes(a.pid), 'no pid on the page');
    const pic = await get(`/api/daily?si=${r1.code}`);
    assert.equal(pic.status, 200); assert.equal(pic.headers['content-type'], 'image/png');
    assert.match(pic.headers['cache-control'], /s-maxage=\d{6,}/, 'a long EDGE cache'); assert.deepEqual([...pic.body.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
    // a re-share REPLACES it (one a player a day): the old code gone → the home; the new one live
    const r2 = await call('u-shr-a');
    assert.notEqual(r2.code, r1.code); assert.equal(await val(`shr/${r1.code}`), null, 'the first card is gone');
    assert.equal((await get(`/api/daily?s=${r1.code}`)).headers.location, '/', 'an old / unknown code → the site\'s home, never an error');
    assert.equal((await get('/api/daily?s=nope')).status, 302);
    assert.equal((await get(`/api/daily?si=${r1.code}`)).headers.location, '/assets/og.jpg', 'a gone picture → the site\'s link picture');
    assert.equal(Object.keys(await val('shrx/' + today)).length, 1);
    // /admin → THE DAILIES: the owner lists + deletes ONE (a non-admin refused)
    await assert.rejects(adminAction('u-shr-b', { action: 'shareDelete', code: r2.code }, T0), e => e.code === 'not_admin');
    process.env.ADMIN_PIDS = b.pid;
    const L = await adminAction('u-shr-b', { action: 'shareCards' }, T0);
    assert.equal(L.cards.length, 1); assert.equal(L.cards[0].code, r2.code); assert.equal(L.cards[0].n, 'ShareAmy'); assert.ok(!('img' in L.cards[0]), 'never the picture');
    const D = await adminAction('u-shr-b', { action: 'shareDelete', code: `https://www.neonspeakeasy.com/api/daily?s=${r2.code}` }, T0);
    assert.equal(D.gone, true); assert.equal(D.cards.length, 0); assert.equal(await val(`shr/${r2.code}`), null); assert.equal(await val(`shrp/${a.pid}/${today}`), null);
    process.env.ADMIN_PIDS = '';
    // THE SWEEP (THE DAY'S CLOSE): a card 8 days old is gone, yesterday's stays
    const r3 = await call('u-shr-a');
    const old = dayOf(dayNum(today) - 8), yday = dayOf(dayNum(today) - 1);
    await ref().update({ [`shr/OLDcard00001`]: { p: a.pid, d: old, g: [G], n: 'X', at: T0 - 8 * 864e5, img: 'AA==' }, [`shrx/${old}/OLDcard00001`]: a.pid, [`shrp/${a.pid}/${old}`]: 'OLDcard00001',
      [`shr/YDAcard00001`]: { p: a.pid, d: yday, g: [G], n: 'X', at: T0 - 864e5, img: 'AA==' }, [`shrx/${yday}/YDAcard00001`]: a.pid });
    forgetShareSweep();
    assert.equal(await sweepShares({ now: T0 }), 1);
    assert.equal(await val('shr/OLDcard00001'), null); assert.equal(await val(`shrx/${old}`), null); assert.equal(await val(`shrp/${a.pid}/${old}`), null);
    assert.ok(await val('shr/YDAcard00001/p'), 'a day-old card stays'); assert.ok(await val(`shr/${r3.code}/p`), 'today\'s stays');
    assert.equal(await sweepShares({ now: T0 }), 0, 'once a day per warm function');
    // a day-old card still answers its page (readShare refuses only past 7 days)
    assert.equal((await get('/api/daily?s=YDAcard00001')).status, 200);
  } finally {
    process.env.ADMIN_PIDS = '';
    await ref().update({ shr: null, shrx: null, shrp: null, [`dly/${G}/${today}`]: null });
    await ref('progress/dailies').set(was); clearSwitchCache();
  }
});
