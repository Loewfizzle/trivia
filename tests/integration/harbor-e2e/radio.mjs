// CITY CONTROLS A — THE RADIO end to end (the `models` cloud job): the corner button ONLY for a profile with a radio (the server's role),
// the desk built from the timetable, a fire → amber → pink → STOP on JUST ME + a room's node, a greyed jack's note (or every jack ready
// after dark), the billboard jack's queue + a REPEAT on THE PROGRAM, THE LEDGER's nixies, a nobody refused at every action, the city
// behind keeps its tier while the radio is open. NEVER fires anything the other shards' pages would play (the emulators are shared
// locally): JUST ME, a test room, a city banner set AT A TIME hours away (then cancelled).
import { BASE, log, sleep, ok, okT, open, ev, waitFor, harborUp, dbPut, G } from './kit.mjs';
import * as RD from '../../../js/core/harbor-radio.js';

const DB = 'http://127.0.0.1:9000', get = async p => (await fetch(`${DB}/${p}.json?ns=demo-arcade-default-rtdb`, { headers: { Authorization: 'Bearer owner' } })).json();
const call = (p, body) => ev(p, `(async () => { const m = await import('/js/profile/api.js'); try { return { ok: true, r: await m.api('admin', ${JSON.stringify(body)}) }; } catch (e) { return { ok: false, status: e.status, code: e.code, msg: e.message }; } })()`);
const pidOf = async p => { for (let i = 0; i < 60; i++) { const r = await call(p, { action: 'whoami' }); if (r.ok && r.r.pid) return r.r.pid; await sleep(500); } return null; };
const tapJack = (p, id) => ev(p, `(() => { const el = document.querySelector('.rd-jack[data-jack="${id}"]'); if (!el) return false; el.click(); return true; })()`);
const sizeOf = (p, sel) => ev(p, `(() => { const el = document.querySelector('${sel}'); if (!el) return null; const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return { w: r.width, h: r.height, fg: cs.color, bw: parseFloat(cs.borderTopWidth) }; })()`);
const lampOf = (p, id) => ev(p, `(() => { const el = document.querySelector('.rd-jack[data-jack="${id}"]'); return el ? el.dataset.lamp : null; })()`);

G('radio', async () => {
  // ---- A NOBODY: no button, nothing loaded, every action refused (the server's role check)
  const N = await open({ slot: 'rdn', qs: 'when=2026-11-03T21:00' });
  await harborUp(N.page); await sleep(4500);
  const nob = await ev(N.page, `({ btn: !!document.querySelector('.rd-btn'), css: !!document.querySelector('link[data-rd]'), mod: performance.getEntriesByType('resource').some(e => /screens\\/harbor\\/radio(-program|-ledger|-sound)?\\.js|radio\\.css/.test(e.name)) })`);   // (core/harbor-radio.js + radio-gate.js load for every phone: the city plays fired moments)
  ok(!nob.btn && !nob.css && !nob.mod, `RADIO: a nobody gets nothing — no button, no radio.js / radio.css loaded (${JSON.stringify(nob)})`);
  { const acts = ['radioState', 'radioFire', 'radioStop', 'radioClearAll', 'radioBoard', 'radioDial', 'radioRooms', 'radioLedger'], res = [];
    for (const a of acts) res.push(await call(N.page, { action: a, jack: 'ufo', aud: 'everyone', level: 'low', lines: ['HI'], id: 'x'.repeat(20) }));
    ok(res.every(r => !r.ok && r.status === 403 && r.code === 'not_radio'), `RADIO: a nobody refused at every action (${res.map(r => r.code).join(' ')})`); }
  await N.ctx.close();

  // ---- THE OWNER (the emulators' testAdmins/{pid}): the button under the ☰, the desk from the timetable
  const O = await open({ slot: 'rdo', qs: 'when=2026-11-03T21:00' });
  await harborUp(O.page);
  const pid = await pidOf(O.page);
  ok(!!pid, `RADIO: the owner's profile (${pid})`);
  await dbPut(`testAdmins/${pid}`, true);
  await ev(O.page, 'sessionStorage.clear()');
  await O.page.reload(); await harborUp(O.page);
  await waitFor(O.page, '!!document.querySelector(".rd-btn")', 'the radio button', 20000);
  const btn = await ev(O.page, `(() => { const b = document.querySelector('.rd-btn').getBoundingClientRect(), m = document.querySelector('.menu-btn').getBoundingClientRect(), a = getComputedStyle(document.querySelector('.rd-btn'), '::after'); return { w: b.width, top: b.top, mBot: m.bottom, dl: Math.abs(b.left - m.left), dw: Math.abs(b.width - m.width), tap: parseFloat(a.width) || 0 }; })()`);
  ok(btn.top > btn.mBot && btn.dl < 1 && btn.dw < 1 && btn.tap >= 44, `RADIO: the corner button UNDER the ☰ — the same size + left edge, a 44 pt tap area (${JSON.stringify(btn)})`);
  await O.page.click('.rd-btn');
  await waitFor(O.page, '!!document.querySelector(".rd-modal.is-in .rd-jack")', 'the desk', 10000);
  const desk = await ev(O.page, `[...document.querySelectorAll('.rd-jack')].map(j => j.dataset.jack)`);
  ok(desk.join() === RD.jacks().map(j => j.id).join(), `RADIO: THE DESK's jacks = the timetable's rows with a jack (${desk.length}: ${desk.join(' ')})`);
  const faces = await ev(O.page, `[...document.querySelectorAll('.rd-bb')].map(b => b.textContent).join()`);
  ok(faces === 'DESK,PROGRAM,LEDGER', `RADIO: the band selector (${faces})`);
  // ---- a greyed jack's note (by day) — or every night jack ready (after dark at the owner's city, the real clock)
  { const st = await call(O.page, { action: 'radioState' }), grey = st.r.jacks.filter(j => !j.run.ok);
    if (grey.length) { await tapJack(O.page, grey[0].id); await sleep(300); const bub = await ev(O.page, `(document.querySelector('.rd-bub') || {}).textContent || ''`);
      ok(/NOT NOW/.test(bub) && /after dark only — at \d/.test(bub), `RADIO: a GREYED jack says why + when ("${bub}")`); }
    else ok(st.r.jacks.every(j => j.run.ok), 'RADIO: after dark — every jack ready'); }
  // ---- CC-B GROUP 0 (the owner's CC-A review): the knob's THREE words, the big ✕, no long-press (an explicit ARRANGE)
  { const seen = new Set();
    for (let i = 0; i < 4; i++) { seen.add((await ev(O.page, `(document.querySelector('.rd-who b') || {}).textContent || ''`)).replace(/^● /, '').replace(/ · [A-Z]{4}$/, '')); await O.page.click('.rd-kw:last-child .rd-knob'); await sleep(250); if (await ev(O.page, '!!document.querySelector(".rd-cardwrap")')) { const x = await sizeOf(O.page, '.rd-cardwrap .rd-cx'); if (x) seen.add(`✕${x.w >= 44 && x.h >= 44 ? 'ok' : 'small'}`); await O.page.keyboard.press('Escape'); await sleep(200); } }
    ok(['JUST ME', 'LOBBY ONLY', 'EVERYONE'].every(w => seen.has(w)) && ![...seen].some(w => /CITY ONLY|ONE ROOM/.test(w)) && seen.has('✕ok'), `RADIO (CC-B): the AUDIENCE knob = JUST ME · LOBBY ONLY · EVERYONE, the lobby list's ✕ ≥ 44 pt (${[...seen].join(' | ')})`); }
  { const x = await sizeOf(O.page, '.rd-x'); ok(x && x.w >= 44 && x.h >= 44 && x.bw >= 2 && /255, 255, 255/.test(x.fg), `RADIO (CC-B): the radio's ✕ big + bold (${JSON.stringify(x)})`); }
  { // a held thumb (a scroll that lingers) never starts arranging: pointerdown, 900 ms, pointerup — no wiggle, no card
    await ev(O.page, `(() => { const el = document.querySelector('.rd-jack[data-jack="banner"]'); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); window.__rdHold = el; })()`);
    await sleep(900);
    await ev(O.page, `window.__rdHold.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))`); await sleep(250);
    const held = await ev(O.page, `({ arr: !!document.querySelector('.rd-jacks.is-arrange'), card: !!document.querySelector('.rd-cardwrap') })`);
    await ev(O.page, `[...document.querySelectorAll('.rd-done')].find(b => b.textContent === 'ARRANGE').click()`); await sleep(200);
    const arr = await ev(O.page, `!!document.querySelector('.rd-jacks.is-arrange')`), ab = await sizeOf(O.page, '.rd-done');
    await ev(O.page, `[...document.querySelectorAll('.rd-done')].find(b => b.textContent === 'DONE').click()`); await sleep(200);
    ok(!held.arr && !held.card && arr && ab.h >= 44 && !(await ev(O.page, `!!document.querySelector('.rd-jacks.is-arrange')`)), `RADIO (CC-B): NO long-press (held 0.9 s: ${JSON.stringify(held)}) — the ARRANGE button (${ab.h} pt) turns arranging on + DONE off`); }
  { // THE SKYWRITE's colour by day (coloured smoke): the card's swatches + the skytypers carry it
    const r = await ev(O.page, `(() => { const ok = window.__district.harbor().sky.skytype('PINK SMOKE', { colour: 'ff2e97' }); const st = window.__district.harbor().sky.state; return { ok, c: st.smoke && st.smoke.colour }; })()`);
    await tapJack(O.page, 'skywrite'); await waitFor(O.page, '!!document.querySelector(".rd-cardwrap.is-in .rd-sw")', 'the skywrite card', 5000);
    const sw = await ev(O.page, `document.querySelectorAll('.rd-cardwrap .rd-sw button').length`), x = await sizeOf(O.page, '.rd-cardwrap .rd-cx');
    await O.page.keyboard.press('Escape'); await sleep(200);
    ok(r.ok && r.c === 'ff2e97' && sw === RD.COLOURS.length && x.w >= 44, `RADIO (CC-B): SKYWRITE in COLOURED SMOKE (${JSON.stringify(r)}), ${sw} swatches on its card, its ✕ ${x.w} pt`);
    await ev(O.page, `window.__district.harbor().sky.stop && window.__district.harbor().sky.stop()`); }
  // ---- JUST ME: FIRE → amber → pink → STOP (the Blackbird: any time)
  // (the audience knob: turn to JUST ME — me · room · everyone)
  for (let i = 0; i < 4; i++) { const a = await ev(O.page, `(document.querySelector('.rd-who b') || {}).textContent || ''`); if (/JUST ME/.test(a)) break; await O.page.click('.rd-kw:last-child .rd-knob'); await sleep(250); if (await ev(O.page, '!!document.querySelector(".rd-cardwrap")')) { await O.page.keyboard.press('Escape'); await sleep(200); } }
  ok(/JUST ME/.test(await ev(O.page, `document.querySelector('.rd-who b').textContent`)), 'RADIO: the AUDIENCE knob turned to JUST ME');
  await tapJack(O.page, 'blackbird'); await waitFor(O.page, '!!document.querySelector(".rd-cardwrap.is-in .rd-fire")', 'the patch card', 5000);
  const who = await ev(O.page, `document.querySelector('.rd-who2').textContent`);
  ok(/this phone only/i.test(who), `RADIO: the card's FIRE says who it goes to ("${who}")`);
  await O.page.click('.rd-fire');
  await waitFor(O.page, '!document.querySelector(".rd-cardwrap")', 'the card closed', 6000);
  await waitFor(O.page, `['q', 'run'].includes((document.querySelector('.rd-jack[data-jack="blackbird"]') || {}).dataset.lamp)`, 'the lamp lit', 6000);
  await waitFor(O.page, `(document.querySelector('.rd-jack[data-jack="blackbird"]') || {}).dataset.lamp === 'run'`, 'PINK', 8000);
  const played = await ev(O.page, `(window.__district.radio() || { moments: [] }).moments.some(m => m.jack === 'blackbird' && m.played === 'on')`);
  ok(played, 'RADIO: JUST ME → AMBER → PINK, and the city plays it on this phone (once)');
  // CC-B — TAP A LIT JACK → its card again with a big STOP (the owner: "easier to turn off")
  await tapJack(O.page, 'blackbird'); await waitFor(O.page, '!!document.querySelector(".rd-cardwrap.is-in .rd-bigstop")', 'the lit card', 5000);
  { const b = await ev(O.page, `(() => { const el = document.querySelector('.rd-cardwrap .rd-bigstop'), r = el.getBoundingClientRect(); return { t: el.textContent, h: r.height, w: r.width }; })()`);
    ok(b.t === 'STOP' && b.h >= 56 && b.w >= 300, `RADIO (CC-B): a LIT jack's card → a big STOP (${JSON.stringify(b)})`); }
  await O.page.click('.rd-cardwrap .rd-bigstop');
  await waitFor(O.page, `!(document.querySelector('.rd-jack[data-jack="blackbird"]') || {}).dataset.lamp`, 'the lamp dark after STOP', 8000);
  ok(true, 'RADIO: STOP → the lamp dark again');
  // ...and a QUEUED one (AT A TIME, hours away) → CANCEL
  { const hAway = (new Date().getHours() + 5) % 24, f = await call(O.page, { action: 'radioFire', jack: 'flyby', aud: 'me', local: { h: hAway, mi: 0 } });
    await waitFor(O.page, `(document.querySelector('.rd-jack[data-jack="flyby"]') || {}).dataset.lamp === 'q'`, 'AMBER', 8000).catch(() => {});
    await tapJack(O.page, 'flyby'); await waitFor(O.page, '!!document.querySelector(".rd-cardwrap.is-in .rd-bigstop")', 'the lit card', 5000).catch(() => {});
    const t = await ev(O.page, `(document.querySelector('.rd-cardwrap .rd-bigstop') || {}).textContent || ''`);
    if (t) await O.page.click('.rd-cardwrap .rd-bigstop');
    await waitFor(O.page, `!(document.querySelector('.rd-jack[data-jack="flyby"]') || {}).dataset.lamp`, 'the lamp dark after CANCEL', 8000).catch(() => {});
    ok(f.ok && t === 'CANCEL' && !(await lampOf(O.page, 'flyby')), `RADIO (CC-B): a QUEUED jack's card → CANCEL ("${t}") → dark`); }
  // ---- ONE ROOM: the room's node (the lobby plays it once it is the live city — LOBBY 2.0)
  const ROOM = 'RDTE';
  await dbPut(`rooms/${ROOM}`, { meta: { hostId: 'rdhost', status: 'lobby', createdAt: Date.now(), activeAt: Date.now() }, players: { rdhost: { name: 'HOSTY', color: 'cyan', avatar: 'bolt', joinedAt: 1 } } });
  const rf = await call(O.page, { action: 'radioFire', jack: 'balloons', aud: 'room', room: ROOM });
  const node = rf.ok ? await get(`rooms/${ROOM}/radio/${rf.r.moment.id}`) : null;
  ok(rf.ok && node && node.jack === 'balloons' && node.by === 'owner' && !JSON.stringify(node).includes(pid), `RADIO: ONE ROOM → rooms/${ROOM}/radio (${JSON.stringify(node)})`);
  // ---- THE CITY, AT A TIME (hours away — nothing plays during the run): in the cached GET, then cancelled
  { const hAway = (new Date().getHours() + 6) % 24, cf = await call(O.page, { action: 'radioFire', jack: 'banner', aud: 'everyone', text: 'E2E HELLO', local: { h: hAway, mi: 0 } });
    const live = await (await fetch(`${BASE}/api/admin?live=1`)).json(), mine = cf.ok && live.radio && live.radio.moments.find(m => m.id === cf.r.moment.id);
    ok(cf.ok && mine && mine.text === 'E2E HELLO' && mine.local && !JSON.stringify(live.radio).includes(pid), `RADIO: a city moment AT A TIME in the cached GET (no profile id) — ${JSON.stringify(mine)}`);
    if (cf.ok) await call(O.page, { action: 'radioStop', id: cf.r.moment.id }); }
  // ---- THE BILLBOARD jack: two lines + REPEAT every Friday → THE PROGRAM's queue
  await tapJack(O.page, 'billboard'); await waitFor(O.page, '!!document.querySelector(".rd-cardwrap.is-in .rd-line")', 'the billboard card', 5000);
  const lines = await O.page.$$('.rd-line'); await lines[0].type('GAME NIGHT'); await lines[1].type('8 PM');
  await ev(O.page, `[...document.querySelectorAll('.rd-seg button')].find(b => b.textContent === 'REPEAT').click()`);
  await sleep(200);
  await ev(O.page, `[...document.querySelectorAll('.rd-dows button')].forEach(b => { if (b.classList.contains('is-on') !== (b.textContent === 'FR')) b.click(); })`);
  await sleep(200);
  await O.page.click('.rd-fire');
  await waitFor(O.page, '!document.querySelector(".rd-cardwrap")', 'the billboard posted', 6000);
  await ev(O.page, `[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === 'PROGRAM').click()`);
  await waitFor(O.page, `[...document.querySelectorAll('.rd-paper h4')].some(h => /YOUR QUEUE/.test(h.textContent))`, 'THE PROGRAM', 8000);
  const prog = await ev(O.page, `({ heads: [...document.querySelectorAll('.rd-paper h4')].map(h => h.firstChild.textContent), rows: document.querySelectorAll('.rd-paper .rd-pr').length, queue: [...document.querySelectorAll('.rd-paper')].pop().textContent, week: document.querySelectorAll('.rd-wk div').length })`);
  ok(prog.heads.length === 3 && prog.rows >= 3 && prog.week === 7 && /GAME NIGHT · 8 PM/.test(prog.queue) && /FRI 19:45|FRI \d/.test(prog.queue) === /FRI/.test(prog.queue), `RADIO: THE PROGRAM — tonight (${prog.rows} rows), the week (${prog.week}), YOUR QUEUE with the billboard REPEAT ("${prog.queue.slice(0, 90)}")`);
  // ---- THE LEDGER's nixies
  await ev(O.page, `[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === 'LEDGER').click()`);
  await waitFor(O.page, '!!document.querySelector(".rd-big3 .rd-nixie")', 'THE LEDGER', 10000);
  const led = await ev(O.page, `({ nix: document.querySelectorAll('.rd-big3 .rd-nixie').length, rows: document.querySelectorAll('.rd-lg').length, bars: document.querySelectorAll('.rd-chart > div').length })`);
  ok(led.nix === 3 && led.rows >= 6 && led.bars === 7, `RADIO: THE LEDGER — 3 nixies, TODAY's rows (${led.rows}), THIS WEEK's 7 bars`);
  // ---- THE CITY BEHIND keeps running at its tier while the radio is open (a warning on a slow machine)
  { const t0 = await ev(O.page, '(window.__district.tiering() || {}).tier');
    await sleep(3000);
    const t1 = await ev(O.page, '(window.__district.tiering() || {}).tier'), dts = (await ev(O.page, 'window.__district.frames()')) || [], last = dts.slice(-60);
    const fps = last.length ? Math.round(1000 / (last.reduce((a, b) => a + b, 0) / last.length)) : 0;
    okT((t1 == null || t0 == null || t1 >= t0) && fps >= 24, `RADIO: the city behind keeps drawing under the open radio (tier ${t0} → ${t1}, ~${fps} fps)`); }
  // ---- CLEAR ALL under the cover: the cover first, then the button
  await ev(O.page, `[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === 'DESK').click()`); await sleep(400);
  await O.page.click('.rd-cover'); await sleep(400);
  ok(await ev(O.page, '!!document.querySelector(".rd-clear.is-open")'), 'RADIO: CLEAR ALL — the safety cover lifts first');
  await O.page.click('.rd-cbtn'); await sleep(1500);
  { const st = await call(O.page, { action: 'radioState' }); ok(st.ok && !st.r.board.length && !st.r.moments.some(m => m.mine && (m.state === 'q' || m.state === 'run')), 'RADIO: CLEAR ALL stopped his moments + emptied the billboard queue'); }
  // the audit log: every action
  { const all = (await get('audit')) || {}, acts = new Set(Object.values(all).filter(l => l && l.by === pid).map(l => l.act));
    ok(['radioFire', 'radioStop', 'radioBoard', 'radioClearAll'].every(x => acts.has(x)), `RADIO: the audit log has every action (${[...acts].join(' ')})`); }
  await dbPut(`testAdmins/${pid}`, null); await dbPut(`rooms/${ROOM}`, null);
  await O.ctx.close();
  log('radio', 'done');
});
