// CITY E — THE TAPPABLE SHARE CARD on the emulators (database :9000 + auth :9099): the upload's accept / refuse rules (no finish · wrong size ·
// not a PNG · too big · a second card replaces the first), the link-preview page + the picture's GETs (the edge cache, an unknown code → the
// site's home), the owner's /admin delete, and THE SWEEP after 7 days.
// FIXES R1 (THE REVIEW A2 / A4 / A5): 12 uploads AT ONCE + 4 more waves → exactly ONE card stored; a re-upload KEEPS THE CODE (the sent link
// still answers, its picture replaced) and the same bytes write nothing; a header-only "PNG", a real PNG with a trailing payload, a bad CRC are
// refused; a NOT COUNTED finisher is refused; the picture's edge cache ≤ 1 h; the daily cap on uploads.
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
const cards = async pid => Object.values((await val('shr')) || {}).filter(c => c.p === pid).length;

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
    // FIXES R1 A5 — THE WHOLE FILE IS A PNG: the header alone · a real card + HTML + random bytes behind IEND · a broken CRC
    const real = png(CARD_W, CARD_H);
    await refused(call('u-shr-a', { png: real.subarray(0, 33).toString('base64') }), 'not_png');
    await refused(call('u-shr-a', { png: Buffer.concat([real, Buffer.from('<html><script>alert(1)</script></html>'), Buffer.alloc(3000, 7)]).toString('base64') }), 'not_png');
    const badCrc = Buffer.from(real); badCrc[badCrc.length - 20] ^= 0xff;
    await refused(call('u-shr-a', { png: badCrc.toString('base64') }), 'not_png');
    // FIXES R1 A5 — THE THROWAWAY GATE: a finish that doesn't count (dly/{g}/{day}/x/{pid}) shares no link of ours
    await ref(`dly/${G}/${today}/r/${b.pid}`).set(5); await ref(`dly/${G}/${today}/x/${b.pid}`).set(1);
    await refused(call('u-shr-b'), 'not_counted');
    assert.equal(await val('shr'), null, 'nothing stored by a refusal');
    // ACCEPTED: a server-made code (never the pid), stored server-side; the page + the picture
    const r1 = await call('u-shr-a');
    assert.match(r1.code, /^[A-Za-z0-9_-]{12}$/); assert.ok(!r1.code.includes(a.pid)); assert.equal(r1.path, `/api/daily?s=${r1.code}`);
    assert.equal(await val(`shrp/${a.pid}/${today}`), r1.code);
    const page = await get(`/api/daily?s=${r1.code}`);
    assert.equal(page.status, 200); assert.match(page.headers['content-type'], /text\/html/);
    const html = page.body.toString();
    assert.match(html, /<meta property="og:title" content="SHAREAMY · [A-Z' ]+ · Nov 15">/, 'og:title = <NAME> · <DAILY> · <day>');
    assert.ok(html.includes(`<meta property="og:image" content="https://www.neonspeakeasy.com/api/daily?si=${r1.code}&amp;v=${r1.v}">`), 'og:image = the picture by its hash');
    assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'));
    assert.ok(html.includes('/?daily=1'), 'a person goes straight on to the daily');
    assert.ok(!html.includes(a.pid), 'no pid on the page');
    const pic = await get(`/api/daily?si=${r1.code}`);
    assert.equal(pic.status, 200); assert.equal(pic.headers['content-type'], 'image/png');
    const sm = Number((/s-maxage=(\d+)/.exec(pic.headers['cache-control']) || [])[1]);
    assert.ok(sm > 0 && sm <= 3600 && !/immutable/.test(pic.headers['cache-control']), `the picture's EDGE cache ≤ 1 h (${pic.headers['cache-control']}) — a deleted card stops within the hour`);
    assert.deepEqual([...pic.body.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
    // FIXES R1 A4 — the same bytes again (a reload): the same code, nothing written
    const at1 = await val(`shr/${r1.code}/at`);
    const again = await dailyAction('u-shr-a', { action: 'shareCard', day: today, games: [G], png: ok }, T0 + 5000);
    assert.equal(again.code, r1.code); assert.equal(again.same, true); assert.equal(await val(`shr/${r1.code}/at`), at1, 'nothing written');
    // FIXES R1 A4 — a CHANGED card (a re-share) KEEPS ITS CODE: the sent link still answers, its picture replaced, a new picture URL
    const r2 = await call('u-shr-a', { png: png(CARD_W, CARD_H, 3).toString('base64') });
    assert.equal(r2.code, r1.code, 'the same day keeps its code'); assert.notEqual(r2.v, r1.v, 'a new picture hash');
    assert.equal((await get(`/api/daily?s=${r1.code}`)).status, 200, 'the link already sent still answers');
    assert.ok((await get(`/api/daily?s=${r1.code}`)).body.toString().includes(`v=${r2.v}`), 'its page names the NEW picture');
    assert.equal((await get('/api/daily?s=nope')).status, 302);
    assert.equal((await get('/api/daily?s=AAAAAAAAAAAA')).headers.location, '/', 'an unknown code → the site\'s home, never an error');
    assert.equal((await get('/api/daily?si=AAAAAAAAAAAA')).headers.location, '/assets/og.jpg', 'a gone picture → the site\'s link picture');
    assert.equal(Object.keys(await val('shrx/' + today)).length, 1);
    assert.equal(await cards(a.pid), 1);
    // FIXES R1 A2 — ONE CARD UNDER PARALLEL UPLOADS: a second finisher (Cat) — 12 at once (each a different picture), then 4 more waves →
    // exactly ONE card stored; the daily cap refuses the rest (share_limit), nothing else
    const c = await ensure('u-shr-c', 'ShareCat'); await ref(`dly/${G}/${today}/r/${c.pid}`).set(6);
    const wave = (n, k) => Promise.allSettled(Array.from({ length: n }, (_, i) => dailyAction('u-shr-c', { action: 'shareCard', day: today, games: [G], png: png(CARD_W, CARD_H, 1 + ((k * 13 + i) % 40)).toString('base64') }, T0 + 9000 + k * 100 + i)));
    const all = [...await wave(12, 0)];
    for (let k = 1; k <= 4; k++) all.push(...await wave(3, k));
    const codes = new Set(all.filter(x => x.status === 'fulfilled').map(x => x.value.code));
    const why = new Set(all.filter(x => x.status === 'rejected').map(x => x.reason && x.reason.code));
    assert.equal(codes.size, 1, `ONE code for every accepted upload (${[...codes].join(', ')})`);
    assert.deepEqual([...why].filter(w => w !== 'share_limit'), [], `refused only by the daily cap (${[...why].join(', ')})`);
    assert.equal(await cards(c.pid), 1, 'exactly ONE card stored for the player');
    assert.equal(await val(`shrp/${c.pid}/${today}`), [...codes][0]);
    // /admin → THE DAILIES: the owner lists + deletes ONE (a non-admin refused)
    await assert.rejects(adminAction('u-shr-b', { action: 'shareDelete', code: r2.code }, T0), e => e.code === 'not_admin');
    process.env.ADMIN_PIDS = b.pid;
    const L = await adminAction('u-shr-b', { action: 'shareCards' }, T0);
    const amy = L.cards.find(x => x.code === r2.code);
    assert.equal(L.cards.length, 2, 'two cards: Amy + Cat'); assert.ok(amy); assert.equal(amy.n, 'ShareAmy'); assert.ok(L.cards.every(x => !('img' in x)), 'never the picture');
    const D = await adminAction('u-shr-b', { action: 'shareDelete', code: `https://www.neonspeakeasy.com/api/daily?s=${r2.code}` }, T0);
    assert.equal(D.gone, true); assert.equal(D.cards.length, 1); assert.equal(await val(`shr/${r2.code}`), null); assert.equal(await val(`shrp/${a.pid}/${today}`), null);
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
    await ref().update({ shr: null, shrx: null, shrp: null, [`dly/${G}/${today}`]: null, ...Object.fromEntries(Object.keys((await val('rl')) || {}).filter(k => k.startsWith('shrup:')).map(k => [`rl/${k}`, null])) });
    await ref('progress/dailies').set(was); clearSwitchCache();
  }
});

// JAYWALK H4B's ADD-ON (the owner, Nov 16) — A RUN's CARD: SHARE MY RUN sends the same kind of link. The server takes the picture ONLY from
// a player its own COUNTED result of that match names (results/{ROOM}_{m} — st 'done', the game, o[pid]); ONE run card a player a game a
// day in ITS OWN slot (the day's DAILIES card keeps its own), replaced in place under the same code; the page says the game + opens the
// site's home; the owner's delete + the sweep clear its slot too.
test('JAYWALK H4B — A RUN\'s CARD: only a counted result\'s player, its own slot (never the day\'s scorecard), replaced in place, the page opens the site', async () => {
  const a = await ensure('u-run-a', 'RunAmy'), b = await ensure('u-run-b', 'RunBob');
  const ok = png(CARD_W, CARD_H).toString('base64'), at = T0 + 500;
  const call = (uid, extra = {}) => dailyAction(uid, { action: 'shareCard', games: ['jaywalk'], run: { room: 'MOON', m: 'm1abc' }, png: ok, ...extra }, T0 + 1000);
  const refused = async (p, code) => { await assert.rejects(p, e => e.code === code, `refused: ${code}`); };
  try {
    // REFUSED: no result at all · a result still being made · another game's · a result that doesn't name this player · a game with no run card
    await refused(call('u-run-a'), 'no_run');
    await ref('results/MOON_m1abc').set({ st: 'retry', at, g: 'jaywalk', o: { [a.pid]: { xp: 1 } } });
    await refused(call('u-run-a'), 'no_run');
    await ref('results/MOON_m1abc').set({ st: 'done', at, g: 'overclock', o: { [a.pid]: { xp: 1 } } });
    await refused(call('u-run-a'), 'no_run');
    await ref('results/MOON_m1abc').set({ st: 'done', at, g: 'jaywalk', mode: 'solo', n: 1, o: { [a.pid]: { xp: 12 } } });
    await refused(call('u-run-b'), 'no_run');
    await refused(call('u-run-a', { games: ['prism'] }), 'bad_game');
    await refused(call('u-run-a', { run: { room: 'moon/../x', m: 'm1abc' } }), 'bad_game');
    await refused(call('u-run-a', { png: png(1080, 1350).toString('base64') }), 'wrong_size');
    // ACCEPTED: the counted player — the code, the page (the game's name, the site's home), the picture
    const r1 = await call('u-run-a');
    assert.match(r1.code, /^[A-Za-z0-9_-]{12}$/); assert.equal(r1.path, `/api/daily?s=${r1.code}`);
    const card = await val(`shr/${r1.code}`);
    assert.deepEqual({ p: card.p, d: card.d, g: card.g, k: card.k, s: card.s, n: card.n }, { p: a.pid, d: today, g: ['jaywalk'], k: 'run', s: `${a.pid}:jaywalk`, n: 'RunAmy' });
    assert.equal(await val(`shrp/${a.pid}:jaywalk/${today}`), r1.code, 'ITS OWN slot');
    assert.equal(await val(`shrp/${a.pid}/${today}`), null, 'the day\'s DAILIES slot is untouched — a run never replaces a scorecard already sent');
    const page = (await get(`/api/daily?s=${r1.code}`)).body.toString();
    assert.match(page, /<meta property="og:title" content="RUNAMY · JAYWALK · Nov 15">/); assert.match(page, new RegExp(`og:image" content="https://www.neonspeakeasy.com/api/daily\\?si=${r1.code}&amp;v=`));
    assert.match(page, /<meta http-equiv="refresh" content="0; url=\/">/, 'a tap on the picture opens the site\'s home'); assert.doesNotMatch(page, /daily=1|dailies/i);
    assert.match(page, /summary_large_image/, 'the BIG picture card');
    const pic = await get(`/api/daily?si=${r1.code}`);
    assert.equal(pic.status, 200); assert.equal(pic.headers['content-type'], 'image/png'); assert.equal(pic.body.length, Buffer.from(ok, 'base64').length);
    // the same picture again: nothing written; ANOTHER run that day (a new match, a new picture): the SAME code, the picture replaced
    assert.equal((await call('u-run-a')).same, true);
    await ref('results/MOON_m2xyz').set({ st: 'done', at: at + 60000, g: 'jaywalk', mode: 'solo', n: 1, o: { [a.pid]: { xp: 9 } } });
    const r2 = await call('u-run-a', { run: { room: 'MOON', m: 'm2xyz' }, png: png(CARD_W, CARD_H, 4).toString('base64') });
    assert.equal(r2.code, r1.code, 'one run card a player a day — replaced in place'); assert.notEqual(r2.v, r1.v);
    assert.equal(Object.values((await val('shr')) || {}).filter(c => c.p === a.pid && c.k === 'run').length, 1);
    // a guest the result names has their own card; the day's DAILIES card lives beside the run's
    await ref('results/MOON_m3mat').set({ st: 'done', at, g: 'jaywalk', mode: 'match', n: 2, o: { [a.pid]: { xp: 5 }, [b.pid]: { xp: 3 } } });
    const rb = await call('u-run-b', { run: { room: 'MOON', m: 'm3mat' } });
    assert.notEqual(rb.code, r1.code);
    await ref(`dly/${G}/${today}/r/${a.pid}`).set(4);
    const rd = await dailyAction('u-run-a', { action: 'shareCard', day: today, games: [G], png: png(CARD_W, CARD_H, 2).toString('base64') }, T0 + 2000);
    assert.notEqual(rd.code, r1.code, 'the scorecard has its own code'); assert.equal(await val(`shrp/${a.pid}/${today}`), rd.code); assert.equal(await val(`shrp/${a.pid}:jaywalk/${today}`), r1.code);
    assert.match((await get(`/api/daily?s=${rd.code}`)).body.toString(), /url=\/\?daily=1/, 'the scorecard\'s page still opens the dailies');
    // an old result (two days back) → that day isn't open
    await ref('results/MOON_m4old').set({ st: 'done', at: T0 - 3 * 864e5, g: 'jaywalk', n: 1, o: { [a.pid]: { xp: 1 } } });
    await refused(call('u-run-a', { run: { room: 'MOON', m: 'm4old' }, png: png(CARD_W, CARD_H, 5).toString('base64') }), 'bad_day');
    // the owner's delete clears the run's own slot; the sweep (8 days on) clears the rest
    process.env.ADMIN_PIDS = b.pid;
    const D = await adminAction('u-run-b', { action: 'shareDelete', code: r1.code }, T0);
    assert.equal(D.gone, true); assert.equal(await val(`shr/${r1.code}`), null); assert.equal(await val(`shrp/${a.pid}:jaywalk/${today}`), null, 'the run\'s slot is cleared with its card');
    process.env.ADMIN_PIDS = '';
    forgetShareSweep();
    await sweepShares({ now: T0 + 9 * 864e5 });
    assert.equal(await val(`shr/${rb.code}`), null); assert.equal(await val(`shrp/${b.pid}:jaywalk/${today}`), null, 'the sweep clears a run card + its slot');
  } finally {
    process.env.ADMIN_PIDS = '';
    await Promise.all(['MOON_m1abc', 'MOON_m2xyz', 'MOON_m3mat', 'MOON_m4old'].map(k => ref(`results/${k}`).remove()));
    await Promise.all([ref(`dly/${G}/${today}/r/${a.pid}`).remove(), ref(`shrp/${a.pid}`).remove(), ref(`shrp/${a.pid}:jaywalk`).remove(), ref(`shrp/${b.pid}:jaywalk`).remove(), ref(`shrx/${today}`).remove()]);
    for (const [code, c] of Object.entries((await val('shr')) || {})) if (c.p === a.pid || c.p === b.pid) await ref(`shr/${code}`).remove();
    forgetShareSweep();
  }
});

// HIGH RISE S5 — ITS RUN CARD on the same machinery, BEHIND THE SWITCH: with HIGHRISE_COUNTS off a run has NO counted result
// (results/{ROOM}_{m} is never written) → the card is refused (no_run: the phone shares the picture itself); with a counted result (the
// go-live) it is taken into HIGH RISE's own slot, like JAYWALK's.
test('HIGH RISE S5 — A RUN\'s CARD: refused with no counted result (counting OFF), taken into its own slot once counted', async () => {
  const a = await ensure('u-hi-run-a', 'HiAmy');
  const ok = png(CARD_W, CARD_H).toString('base64'), at = T0 + 500;
  const call = uid => dailyAction(uid, { action: 'shareCard', games: ['highrise'], run: { room: 'TOWR', m: 'm1hi5' }, png: ok }, T0 + 1000);
  try {
    await assert.rejects(call('u-hi-run-a'), e => e.code === 'no_run', 'counting OFF: no result, no link');
    await ref('results/TOWR_m1hi5').set({ st: 'done', at, g: 'jaywalk', mode: 'solo', n: 1, o: { [a.pid]: { xp: 3 } } });
    await assert.rejects(call('u-hi-run-a'), e => e.code === 'no_run', 'another game\'s result never opens HIGH RISE\'s card');
    await ref('results/TOWR_m1hi5').set({ st: 'done', at, g: 'highrise', mode: 'solo', n: 1, o: { [a.pid]: { xp: 3 } } });
    const r = await call('u-hi-run-a');
    assert.ok(r.code && r.path, 'counted: the link is made');
    assert.equal(await val(`shrp/${a.pid}:highrise/${today}`), r.code, 'ITS OWN slot (never JAYWALK\'s or the day\'s scorecard)');
    const card = await val(`shr/${r.code}`);
    assert.deepEqual({ g: card.g, k: card.k, s: card.s }, { g: ['highrise'], k: 'run', s: `${a.pid}:highrise` });
  } finally {
    await ref('results/TOWR_m1hi5').remove();
    await ref(`shrp/${a.pid}:highrise`).remove();
    await ref(`shrx/${today}`).remove();   // (the sweep's index — left behind, the CITY E test's count of today's cards saw two)
    for (const [code, c] of Object.entries((await val('shr')) || {})) if (c.p === a.pid) await ref(`shr/${code}`).remove();
    forgetShareSweep();
  }
});
