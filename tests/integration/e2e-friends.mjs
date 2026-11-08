// FRIENDS A end to end (emulators + node scripts/serve.mjs --emu, which serves /api):
//   node tests/integration/e2e-friends.mjs "<browser>" ./shots-friends        (env SHOTS=0)
// Two players in a room: ALICE taps BOB's card → ADD FRIEND → REQUESTED; BOB's YOU shows the badge, his card's FRIENDS section the request →
// ACCEPT → both are friends (both cards; the green dot on the friend's emblem in the room); BOB leaves; ALICE's INVITE opens the sheet with
// FRIENDS on top → INVITE; BOB's next open shows the waiting card "ALICE invited you · JOIN ROOM XXXX" → JOIN → he's in the room; BLOCK from
// the ⋯ → both lists empty, a new request never lands. THE PARKED DATABASE: none of it opens a socket on a parked title (the checks are /api).
// Shots at 390 / 402 / 430 + 1440 (the look review).
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { createHarness } from './kit/harness.mjs';
import { val } from '../../api/_lib/fb.js';

const SIZES = [[390, 844], [402, 874], [430, 932], [1440, 900]];
const H = await createHarness({ name: 'friends', slot: 'q', sizes: SIZES });
const { pages, log, sleep, ok, evalIn, waitFor, uids, shotAll } = H;
const ev = (p, js) => p.evaluate(js);
const waitJs = (p, js, what, t = 15000) => p.waitForFunction(js, { timeout: t }).then(() => true, () => { ok(false, `timed out: ${what}`); return false; });
const pidOf = (p, i) => p.evaluate(s => (JSON.parse(localStorage.getItem(`na:${s}:me`) || 'null') || {}).pid, `q${i}`);
const closeAll = p => ev(p, "document.querySelectorAll('.sh-x, .vl-full-x').forEach(b => b.click())").then(() => sleep(500));

await H.run(async () => {
  await H.joinAll(2);
  const [A, B] = pages;
  for (const i of [0, 1]) await pages[i].waitForFunction(s => !!localStorage.getItem(`na:${s}:me`), { timeout: 25000 }, `q${i}`);
  await waitFor(A, s => Object.values(s.players).every(p => p.pid), 'the seats carry profile ids', 20000);
  const pa = await pidOf(A, 0), pb = await pidOf(B, 1);
  ok(pa && pb && pa !== pb, `two profiles (${pa}, ${pb})`);

  // ---- 1. ALICE: BOB's card (GUESTS → his strip) → ADD FRIEND → REQUESTED
  await ev(A, "document.querySelector('.rdk-guests').click()");
  await waitJs(A, `!!document.querySelector('.rg-row[data-uid="${uids[1]}"]')`, 'the guest list');
  await sleep(400);
  await ev(A, `document.querySelector('.rg-row[data-uid="${uids[1]}"]').click()`);
  await waitJs(A, "!!document.querySelector('.fr-btn-slot:not([hidden]) .fr-btn')", 'ADD FRIEND on his card');
  ok(/ADD FRIEND/.test(await ev(A, "document.querySelector('.fr-btn').textContent")), 'BOB\'s card offers ADD FRIEND');
  await shotAll(A, 'fr-01-card-add');
  await ev(A, "document.querySelector('.fr-btn').click()");
  await waitJs(A, "/REQUESTED/.test((document.querySelector('.fr-btn') || {}).textContent || '')", 'REQUESTED');
  ok(!!(await val(`pfr/${pb}/in/${pa}`)), 'the request is on BOB\'s side (the server wrote it)');
  await shotAll(A, 'fr-02-card-requested', SIZES.slice(1, 2));
  await closeAll(A);

  // ---- 2. BOB: the badge on YOU (his next open) → his card → REQUESTS → ACCEPT
  await B.reload();
  await waitJs(B, "!!document.querySelector('.fr-badge:not([hidden])')", 'the badge on YOU', 30000);
  ok((await ev(B, "document.querySelector('.fr-badge').textContent")) === '1', 'BOB\'s YOU shows 1 waiting request');
  await shotAll(B, 'fr-03-badge', SIZES.slice(1, 2));
  await ev(B, "document.querySelector('.nd-tab-you, .rdk-you') && (document.querySelector('.rdk-you') || document.querySelector('.nd-tab-you')).click()");
  await waitJs(B, "!!document.querySelector('.fr-sec .fr-row.is-req')", 'the request on his card', 20000);
  await ev(B, "document.querySelector('.fr-sec').scrollIntoView({ block: 'start' })");
  await shotAll(B, 'fr-04-profile-request');
  await ev(B, "document.querySelector('.fr-row.is-req .fr-acc').click()");
  await waitJs(B, "!!document.querySelector('.fr-sec .fr-row.is-friend') && !document.querySelector('.fr-row.is-req')", 'ALICE on his list');
  ok(!!(await val(`pfr/${pa}/f/${pb}`)) && !!(await val(`pfr/${pb}/f/${pa}`)), 'ACCEPT → friends on both sides');
  await ev(B, "document.querySelector('.fr-sec').scrollIntoView({ block: 'start' })");
  await shotAll(B, 'fr-05-profile-friends');
  // the ⋯ sheet (look only here; BLOCK is step 5)
  await ev(B, "document.querySelector('.fr-row.is-friend .fr-more').click()");
  await waitJs(B, "!!document.querySelector('.fr-more-sheet .fr-block')", 'the ⋯ sheet');
  await shotAll(B, 'fr-06-more-sheet', SIZES.slice(1, 2));
  await closeAll(B);
  await ev(B, "document.querySelector('.pf-back') && document.querySelector('.pf-back').click()");
  await sleep(600);

  // ---- 3. the green dot: a friend IN THE ROOM with you
  await A.reload();
  await waitJs(A, `!!document.querySelector('.rc-tag.is-friend[data-uid="${uids[1]}"]')`, 'the green dot on BOB', 30000);
  ok(true, 'ALICE sees the green dot on BOB\'s emblem (a friend in the room with her)');

  // ---- 4. BOB leaves; ALICE invites him (INVITE → FRIENDS on top → INVITE); BOB's next open → the waiting card → JOIN
  await evalIn(B, async () => { const R = await import('/js/room.js'); await R.leaveRoom(); return true; });
  await waitFor(A, (s, u) => !s.players[u], 'BOB left', 20000, uids[1]);
  await sleep(800);
  await ev(A, "document.querySelector('.rdk-invite, .nd-tab-join, .rdk-join') && (document.querySelector('.rdk-invite') || document.querySelector('.rdk-join') || document.querySelector('.nd-tab-join')).click()");
  await waitJs(A, "!!document.querySelector('.fr-invite-sheet .fr-inv')", 'the INVITE sheet with FRIENDS on top');
  await shotAll(A, 'fr-07-invite-sheet');
  await ev(A, "document.querySelector('.fr-invite-sheet .fr-inv').click()");
  await waitJs(A, "/INVITED/.test((document.querySelector('.fr-invite-sheet .fr-row.is-inv') || {}).textContent || '')", 'INVITED');
  ok(!!(await val(`pfr/${pb}/inv/${pa}`)), 'the invite waits on the server');
  await closeAll(A);
  await B.reload();
  await waitJs(B, "!!document.querySelector('.fr-wait .fr-wait-join')", 'the waiting card on BOB\'s open', 30000);
  ok(/ALICE invited you · JOIN ROOM/.test(await ev(B, "document.querySelector('.fr-wait').textContent")), 'BOB: "ALICE invited you · JOIN ROOM …"');
  await shotAll(B, 'fr-08-waiting-card');
  await ev(B, "document.querySelector('.fr-wait-join').click()");
  await waitFor(B, (s, c) => s.code === c, 'BOB joined from the card', 30000, H.code);
  ok(true, 'JOIN → BOB is in ALICE\'s room (the normal join)');
  await sleep(1500);
  ok(!(await val(`pfr/${pb}/inv/${pa}`)), 'the invite is used up');

  // ---- 4b. THE PUSH's tap: /?room=CODE&inv=1 opens straight into the room's join (the knock goes by itself)
  await evalIn(B, async () => { const R = await import('/js/room.js'); await R.leaveRoom(); return true; });
  await waitFor(A, (s, u) => !s.players[u], 'BOB left again', 20000, uids[1]);
  await B.goto(`${H.BASE}/?emu&slot=q1&room=${H.code}&inv=1`);
  await waitFor(B, (s, c) => s.code === c, 'the push link joined by itself', 40000, H.code);
  ok(!(await ev(B, 'location.search')).includes('inv=1'), 'THE PUSH LINK (/?room=…&inv=1): BOB is in the room without a tap; the link cleans itself');

  // ---- 5. BLOCK: BOB blocks ALICE from his card's ⋯ → both lists empty; her new request never lands
  await ev(B, "(document.querySelector('.rdk-you') || document.querySelector('.nd-tab-you')).click()");
  await waitJs(B, "!!document.querySelector('.fr-row.is-friend .fr-more')", 'his list', 20000);
  await ev(B, "document.querySelector('.fr-row.is-friend .fr-more').click()");
  await waitJs(B, "!!document.querySelector('.fr-more-sheet .fr-block')", 'the ⋯ sheet');
  await ev(B, "document.querySelector('.fr-block').click()"); await sleep(200); await ev(B, "document.querySelector('.fr-block').click()");
  await waitJs(B, "!document.querySelector('.fr-row.is-friend') && !!document.querySelector('.fr-blocked')", 'blocked');
  ok(!(await val(`pfr/${pa}/f/${pb}`)) && !!(await val(`pfr/${pb}/b/${pa}`)), 'BLOCK → the friendship gone on both sides, the block on his');
  await shotAll(B, 'fr-09-blocked', SIZES.slice(1, 2));
  const r = await evalIn(A, async (s, pid) => { const { api } = await import('/js/profile/api.js'); return api('profile', { action: 'friendAdd', pid }); }, pb);
  ok(r.rel === 'out' && !(await val(`pfr/${pb}/in/${pa}`)), 'ALICE\'s new request LOOKS sent, never lands');
});
