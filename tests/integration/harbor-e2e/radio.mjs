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
  { const acts = ['radioState', 'radioFire', 'radioStop', 'radioClearAll', 'radioBoard', 'radioDial', 'radioRooms', 'radioLedger', 'radioIntercom', 'radioUnsend'], res = [];
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
  await ev(O.page, `document.querySelector('.rd-btn').click()`);
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
    for (let i = 0; i < 4; i++) { seen.add((await ev(O.page, `(document.querySelector('.rd-who b') || {}).textContent || ''`)).replace(/^● /, '').replace(/ · [A-Z]{4}$/, '')); await ev(O.page, `document.querySelector('.rd-kw:last-child .rd-knob').click()`); await sleep(250); if (await ev(O.page, '!!document.querySelector(".rd-cardwrap")')) { const x = await sizeOf(O.page, '.rd-cardwrap .rd-cx'); if (x) seen.add(`✕${x.w >= 44 && x.h >= 44 ? 'ok' : 'small'}`); await O.page.keyboard.press('Escape'); await sleep(200); } }
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
  for (let i = 0; i < 4; i++) { const a = await ev(O.page, `(document.querySelector('.rd-who b') || {}).textContent || ''`); if (/JUST ME/.test(a)) break; await ev(O.page, `document.querySelector('.rd-kw:last-child .rd-knob').click()`); await sleep(250); if (await ev(O.page, '!!document.querySelector(".rd-cardwrap")')) { await O.page.keyboard.press('Escape'); await sleep(200); } }
  ok(/JUST ME/.test(await ev(O.page, `document.querySelector('.rd-who b').textContent`)), 'RADIO: the AUDIENCE knob turned to JUST ME');
  await tapJack(O.page, 'blackbird'); await waitFor(O.page, '!!document.querySelector(".rd-cardwrap.is-in .rd-fire")', 'the patch card', 5000);
  const who = await ev(O.page, `document.querySelector('.rd-who2').textContent`);
  ok(/this phone only/i.test(who), `RADIO: the card's FIRE says who it goes to ("${who}")`);
  await ev(O.page, `document.querySelector('.rd-fire').click()`);
  await waitFor(O.page, '!document.querySelector(".rd-cardwrap")', 'the card closed', 6000);
  await waitFor(O.page, `['q', 'run'].includes((document.querySelector('.rd-jack[data-jack="blackbird"]') || {}).dataset.lamp)`, 'the lamp lit', 6000);
  await waitFor(O.page, `(document.querySelector('.rd-jack[data-jack="blackbird"]') || {}).dataset.lamp === 'run'`, 'PINK', 8000);
  const played = await ev(O.page, `(window.__district.radio() || { moments: [] }).moments.some(m => m.jack === 'blackbird' && m.played === 'on')`);
  ok(played, 'RADIO: JUST ME → AMBER → PINK, and the city plays it on this phone (once)');
  // CC-B — TAP A LIT JACK → its card again with a big STOP (the owner: "easier to turn off")
  await tapJack(O.page, 'blackbird'); await waitFor(O.page, '!!document.querySelector(".rd-cardwrap.is-in .rd-bigstop")', 'the lit card', 5000);
  { const b = await ev(O.page, `(() => { const el = document.querySelector('.rd-cardwrap .rd-bigstop'), r = el.getBoundingClientRect(); return { t: el.textContent, h: r.height, w: r.width }; })()`);
    ok(b.t === 'STOP' && b.h >= 56 && b.w >= 300, `RADIO (CC-B): a LIT jack's card → a big STOP (${JSON.stringify(b)})`); }
  await ev(O.page, `document.querySelector('.rd-cardwrap .rd-bigstop').click()`);
  await waitFor(O.page, `!(document.querySelector('.rd-jack[data-jack="blackbird"]') || {}).dataset.lamp`, 'the lamp dark after STOP', 8000);
  ok(true, 'RADIO: STOP → the lamp dark again');
  // ...and a QUEUED one (AT A TIME, hours away) → CANCEL
  { const hAway = (new Date().getHours() + 5) % 24, f = await call(O.page, { action: 'radioFire', jack: 'flyby', aud: 'me', local: { h: hAway, mi: 0 } });
    await waitFor(O.page, `(document.querySelector('.rd-jack[data-jack="flyby"]') || {}).dataset.lamp === 'q'`, 'AMBER', 8000).catch(() => {});
    await tapJack(O.page, 'flyby'); await waitFor(O.page, '!!document.querySelector(".rd-cardwrap.is-in .rd-bigstop")', 'the lit card', 5000).catch(() => {});
    const t = await ev(O.page, `(document.querySelector('.rd-cardwrap .rd-bigstop') || {}).textContent || ''`);
    if (t) await ev(O.page, `document.querySelector('.rd-cardwrap .rd-bigstop').click()`);
    await waitFor(O.page, `!(document.querySelector('.rd-jack[data-jack="flyby"]') || {}).dataset.lamp`, 'the lamp dark after CANCEL', 8000).catch(() => {});
    ok(f.ok && t === 'CANCEL' && !(await lampOf(O.page, 'flyby')), `RADIO (CC-B): a QUEUED jack's card → CANCEL ("${t}") → dark`); }
  // ---- CC-B — THE INTERCOM on JUST ME: a FAKE MIC (an oscillator) → HOLD TO TALK → the review → SEND → the chime + the PA here → UNSEND
  await ev(O.page, `(() => { navigator.mediaDevices.getUserMedia = async () => { const c = new AudioContext(), o = c.createOscillator(), g = c.createGain(), d = c.createMediaStreamDestination(); o.frequency.value = 220; g.gain.value = 0.4; o.connect(g); g.connect(d); o.start(); return d.stream; }; return true; })()`);
  // (THE OWNER's CC-B REVIEW, fix 2 — the iPhone's audio session: a stand-in navigator.audioSession — Chromium has none — logs every type
  // the page sets; the hold must switch it to play-and-record, the release put it back)
  await ev(O.page, `(() => { let t = 'playback'; const log = []; window.__sess = log; Object.defineProperty(navigator, 'audioSession', { configurable: true, value: { get type() { return t; }, set type(v) { t = v; log.push(v); } } }); })()`);
  { const mic = await sizeOf(O.page, '.rd-mic-btn');
    ok(mic && mic.h >= 56 && mic.w >= 300, `RADIO (CC-B): THE MIC strip on the desk — HOLD TO TALK (${mic && Math.round(mic.w)}×${mic && Math.round(mic.h)} pt)`);
    await ev(O.page, `document.querySelector('.rd-mic-btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }))`);
    await waitFor(O.page, `!!document.querySelector('.rd-mic-btn.is-on')`, 'ON AIR', 5000);
    await sleep(300);
    const lvl = await ev(O.page, `[...document.querySelectorAll('.rd-meter i')].filter(i => i.style.opacity === '1').length`);
    await ev(O.page, `window.__sessOn = navigator.audioSession.type`);   // (mid-hold)
    await sleep(1400);
    await ev(O.page, `document.querySelector('.rd-mic-btn').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }))`);
    await waitFor(O.page, '!!document.querySelector(".rd-cardwrap.is-in .rd-miccard")', 'the review card', 6000);
    const t = await ev(O.page, `window.__radio && window.__radio.debug().ic.take`);
    const lever = await ev(O.page, `(() => { const l = document.querySelector('.rd-miccard .rd-lever'); return l ? { on: l.getAttribute('aria-checked'), h: l.getBoundingClientRect().height } : null; })()`);
    ok(t && t.dur > 1 && t.bytes > 200 && /^audio\//.test(t.mime) && lever && lever.on === 'true' && lever.h >= 44 && lvl > 0, `RADIO (CC-B): HOLD TO TALK → a ${t && t.dur.toFixed(1)} s take (${t && t.bytes} B, ${t && t.mime}; the meter lit ${lvl} bars) → THE REVIEW: the ON THE BILLBOARD lever on (${JSON.stringify(lever)})`);
    await O.page.type('.rd-miccard .rd-inp', 'test night');
    await ev(O.page, `document.querySelector('.rd-miccard .rd-fire').click()`);
    await waitFor(O.page, '!document.querySelector(".rd-cardwrap")', 'sent', 8000);
    const st = await call(O.page, { action: 'radioState' }), sent = st.ok && st.r.intercom && st.r.intercom.slice(-1)[0];
    ok(sent && sent.aud === 'me' && sent.head === 'TEST NIGHT' && sent.unsend === true, `RADIO (CC-B): SEND → the server's announcement (${JSON.stringify(sent && { aud: sent.aud, head: sent.head, dur: sent.dur, unsend: sent.unsend })})`);
    // the clip through the cached GET; the chime + the voice on this phone; the headline on the billboard while it plays
    const g = await ev(O.page, `fetch('/api/admin?clip=${sent && sent.id}').then(r => ({ s: r.status, t: r.headers.get('content-type'), c: r.headers.get('cache-control') }))`);
    ok(g.s === 200 && /^audio\//.test(g.t) && /s-maxage=60/.test(g.c), `RADIO (CC-B): the clip through GET ?clip= (${JSON.stringify(g)})`);
    await waitFor(O.page, `import('/js/audio/intercom.js').then(m => m.intercomDebug().log.some(l => l.id === '${sent && sent.id}' && /^playing|silent/.test(l.what)))`, 'the intercom plays', 10000).catch(() => {});
    const head = await ev(O.page, `import('/js/core/harbor-billboard.js').then(m => m.intercomHead())`);
    const dbg = await ev(O.page, `import('/js/audio/intercom.js').then(m => m.intercomDebug())`);
    ok(dbg.log.some(l => l.id === (sent && sent.id) && /^playing/.test(l.what)) && JSON.stringify(head) === '["TEST NIGHT",""]', `RADIO (CC-B): the owner's phone plays it (the chime → the PA voice: ${JSON.stringify(dbg.log.filter(l => l.id === (sent && sent.id)).map(l => l.what))}) + the headline on the billboard (${JSON.stringify(head)})`);
    const un = await sizeOf(O.page, '.rd-icsent .rd-stop');
    await ev(O.page, `document.querySelector('.rd-icsent .rd-stop').click()`); await sleep(1500);
    const g2 = await ev(O.page, `fetch('/api/admin?clip=${sent && sent.id}&n=2').then(r => r.status)`), node = await get(`radio/ic/${sent && sent.id}`), clipNode = await get(`radio/clips/${sent && sent.id}`);
    const after = await ev(O.page, `import('/js/audio/intercom.js').then(m => m.intercomDebug().playing)`);
    ok(un && un.h >= 40 && g2 === 404 && node && node.state === 'stopped' && clipNode === null && !after, `RADIO (CC-B): UNSEND → stopped here, the clip deleted (GET ${g2}), the announcement stopped`); }
  // ---- THE OWNER's CC-B REVIEW, fix 2 — the session went play-and-record for the hold, then back; the messages say what really happened
  { const log = await ev(O.page, 'window.__sess || []'), now = await ev(O.page, 'navigator.audioSession.type'), mid = await ev(O.page, 'window.__sessOn');
    ok(mid === 'play-and-record' && log.includes('play-and-record') && now !== 'play-and-record', `RADIO (CC-B review): HOLD TO TALK switches iOS's audio session to play-and-record (it was 'playback' — a session that can't record: the iPhone's "no mic"), then back (${log.join(' → ')}; now ${now})`);
    const why = async name => {
      await ev(O.page, `(() => { navigator.mediaDevices.getUserMedia = async () => { throw Object.assign(new Error('test'), { name: '${name}' }); }; })()`);
      await ev(O.page, `document.querySelector('.rd-mic-btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 2 }))`);
      await waitFor(O.page, '!!document.querySelector(".rd-mic .rd-err")', 'the message', 4000).catch(() => {});
      const m = await ev(O.page, '(document.querySelector(".rd-mic .rd-err") || {}).textContent || ""');
      await ev(O.page, `document.querySelector('.rd-mic-btn').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 2 }))`);
      return m;
    };
    const blocked = await why('NotAllowedError'), none = await why('NotFoundError'), other = await why('NotReadableError'), back = await ev(O.page, 'navigator.audioSession.type');
    ok(/^MICROPHONE BLOCKED/.test(blocked) && none === 'NO MICROPHONE FOUND ON THIS DEVICE' && /DIDN’T START \(NotReadableError\) — HOLD AGAIN/.test(other) && back !== 'play-and-record',
      `RADIO (CC-B review): honest mic messages — "${blocked}" · "${none}" · "${other}" (the session back to ${back})`); }
  // ---- THE INTERCOM to a LOBBY: a second phone IN the lobby gets it on the room's socket + plays it (one start on the server clock)
  { const P = await open({ slot: 'rdp', qs: 'when=2026-11-03T21:00' });
    await harborUp(P.page);
    // (CC-B — the cloud's run 2: the room was opened before this phone had signed in — a real phone's HOST waits for it: so does the test)
    await pidOf(P.page); await waitFor(P.page, `import('/js/store.js').then(s => !!s.state.ready)`, 'signed in', 20000).catch(() => {});
    const code = await ev(P.page, `import('/js/room.js').then(m => m.createRoom({ name: 'LOBBY GUEST', color: 'cyan', avatar: 'bolt' })).then(() => import('/js/store.js')).then(s => s.state.code).catch(e => 'ERR ' + e.message)`);
    await waitFor(P.page, `import('/js/store.js').then(s => !!(s.state.meta && s.state.code))`, 'the lobby', 15000).catch(() => {});
    await ev(P.page, `document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); true`);
    const b64 = Buffer.alloc(3000, 3).toString('base64');
    const r = await call(O.page, { action: 'radioIntercom', aud: 'room', room: code, mime: 'audio/mp4', dur: 2, b64, head: '' });
    const node = r.ok ? await get(`rooms/${code}/radio/${r.r.intercom.id}`) : null;
    await waitFor(P.page, `import('/js/audio/intercom.js').then(m => m.intercomDebug().log.some(l => l.id === '${r.ok && r.r.intercom.id}'))`, 'the lobby phone got it', 15000).catch(() => {});
    const pl = await ev(P.page, `import('/js/audio/intercom.js').then(m => m.intercomDebug().log.filter(l => l.id === '${r.ok && r.r.intercom.id}').map(l => l.what))`);
    ok(r.ok && node && node.kind === 'intercom' && !JSON.stringify(node).includes(pid) && pl.length > 0 && !pl.includes('skipped'), `RADIO (CC-B): LOBBY ONLY → rooms/${code}/radio (no profile id) → the lobby's phone took it on its socket (${JSON.stringify(pl)})`);
    // EVERYONE: every open lobby gets its copy + the city's cached GET carries it
    const e = await call(O.page, { action: 'radioIntercom', aud: 'everyone', mime: 'audio/mp4', dur: 2, b64, wait: false });
    const en = e.ok ? await get(`rooms/${code}/radio/${e.r.intercom.id}`) : null, live = await (await fetch(`${BASE}/api/admin?live=1&ic=${Date.now()}`)).json();
    ok(e.ok && en && en.wait === false && live.radio && live.radio.intercom.some(m => m.id === e.r.intercom.id), `RADIO (CC-B): EVERYONE → every open lobby's node + the city's feed`);
    for (const id of [r.ok && r.r.intercom.id, e.ok && e.r.intercom.id].filter(Boolean)) await call(O.page, { action: 'radioUnsend', id });
    await ev(P.page, `import('/js/room.js').then(m => m.leaveRoom()).catch(() => {})`); await P.ctx.close(); }
  // ---- PROGRESSION B's add-on — THE INTERCOM's WHEN: JUST ME, AT A TIME ~35 s ahead → kept + queued (THE PROGRAM's YOURS + CANCEL), it
  // plays THEN — not before; a second one CANCELLED before its time never plays
  { const b64 = Buffer.alloc(3000, 4).toString('base64'), t0 = await ev(O.page, `import('/js/firebase.js').then(m => m.serverNow())`);
    const s1 = await call(O.page, { action: 'radioIntercom', aud: 'me', mime: 'audio/mp4', dur: 2, b64, head: '', when: 'at', at: t0 + 35e3 });
    const s2 = await call(O.page, { action: 'radioIntercom', aud: 'me', mime: 'audio/mp4', dur: 2, b64, head: '', when: 'in10' });
    const bad = await call(O.page, { action: 'radioIntercom', aud: 'me', mime: 'audio/mp4', dur: 2, b64, head: '', when: 'at', at: t0 + 30 * 3600e3 });
    const id1 = s1.ok && s1.r.intercom.id, id2 = s2.ok && s2.r.intercom.id;
    ok(s1.ok && Math.abs(s1.r.intercom.at - (t0 + 35e3)) < 2000 && s2.ok && Math.abs(s2.r.intercom.at - (t0 + 600e3)) < 5000 && !bad.ok && bad.code === 'bad_time',
      `RADIO (the WHEN): AT A TIME ${s1.ok && Math.round((s1.r.intercom.at - t0) / 1000)} s ahead · IN 10 MIN ${s2.ok && Math.round((s2.r.intercom.at - t0) / 1000)} s · 30 h ahead refused (${bad.code})`);
    await ev(O.page, `import('/js/audio/intercom.js').then(m => m.intercomFeed('desk', ${JSON.stringify([s1.ok && s1.r.intercom, s2.ok && s2.r.intercom].filter(Boolean))}))`);
    // CANCEL the second before its time (THE PROGRAM's CANCEL = the unsend)
    const c2 = id2 ? await call(O.page, { action: 'radioUnsend', id: id2 }) : { ok: false };
    const logOf = id => ev(O.page, `import('/js/audio/intercom.js').then(m => m.intercomDebug().log.filter(l => l.id === '${id}').map(l => l.what))`);
    await sleep(Math.max(0, t0 + 25e3 - (await ev(O.page, `import('/js/firebase.js').then(m => m.serverNow())`))));
    const early = await logOf(id1);
    await waitFor(O.page, `import('/js/audio/intercom.js').then(m => m.intercomDebug().log.some(l => l.id === '${id1}' && !/held/.test(l.what)))`, 'the scheduled intercom', 25000).catch(() => {});
    const later = await logOf(id1), when = await ev(O.page, `import('/js/audio/intercom.js').then(m => (m.intercomDebug().log.find(l => l.id === '${id1}') || {}).at || 0)`);
    const st2 = await get(`radio/ic/${id2}`), clip2 = await get(`radio/clips/${id2}`);
    ok(early.length === 0 && later.length > 0 && !later.includes('skipped') && when >= t0 + 33e3 && c2.ok && st2 && st2.state === 'stopped' && !clip2 && !(await logOf(id2)).some(w => /playing/.test(w)),
      `RADIO (the WHEN): the JUST ME one played at its time, not before (${((when - t0) / 1000).toFixed(1)} s after the send: ${JSON.stringify(later)}); the cancelled one never (${st2 && st2.state}, its clip ${clip2 ? 'kept' : 'gone'})`); }
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
  await ev(O.page, `document.querySelector('.rd-fire').click()`);
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
  // ---- PROGRESSION A — THE FOUNDER WINDOW on THE LEDGER: OPEN by default; a tap arms it, a second tap CLOSES it (the server, audited);
  // the same two taps reopen it (the test leaves it open)
  { const sw = () => ev(O.page, `(() => { const b = document.querySelector('.rd-fsw'); return b ? { state: b.querySelector('.rd-fsw-state').textContent, armed: b.classList.contains('is-armed'), h: b.getBoundingClientRect().height } : null; })()`);
    const tap = () => ev(O.page, `document.querySelector('.rd-fsw').click()`);
    await waitFor(O.page, '!!document.querySelector(".rd-fsw")', 'the FOUNDER switch', 10000);
    const s0 = await sw();
    await tap(); await sleep(150);
    const s1 = await sw();
    await tap();
    await waitFor(O.page, '(document.querySelector(".rd-fsw-state") || {}).textContent === "CLOSED"', 'CLOSED', 10000).catch(() => {});
    const s2 = await sw(), node = await get('progress/founder');
    ok(s0 && s0.state === 'OPEN' && s0.h >= 44 && s1.armed && s2 && s2.state === 'CLOSED' && node && node.open === false && node.by === pid,
      `RADIO: THE FOUNDER WINDOW — OPEN by default, a tap arms it, the second CLOSES it on the server (${JSON.stringify({ s0, s1, s2, node })})`);
    const log = Object.values((await get('audit')) || {}).filter(x => x && x.act === 'founderClose' && x.by === pid);
    ok(log.length >= 1, `RADIO: the FOUNDER switch is audited (${log.length})`);
    await tap(); await sleep(150); await tap();
    await waitFor(O.page, '(document.querySelector(".rd-fsw-state") || {}).textContent === "OPEN"', 'OPEN again', 10000).catch(() => {});
    ok((await get('progress/founder')) === null, 'RADIO: … and reopened (the test leaves it OPEN)'); }
  // ---- THE CITY BEHIND keeps running at its tier while the radio is open (a warning on a slow machine)
  { const t0 = await ev(O.page, '(window.__district.tiering() || {}).tier');
    await sleep(3000);
    const t1 = await ev(O.page, '(window.__district.tiering() || {}).tier'), dts = (await ev(O.page, 'window.__district.frames()')) || [], last = dts.slice(-60);
    const fps = last.length ? Math.round(1000 / (last.reduce((a, b) => a + b, 0) / last.length)) : 0;
    okT((t1 == null || t0 == null || t1 >= t0) && fps >= 24, `RADIO: the city behind keeps drawing under the open radio (tier ${t0} → ${t1}, ~${fps} fps)`); }
  // ---- THE OWNER's CC-B REVIEW, fix 1 — THE SCROLL JUMP: scrolled to the bottom of THE LEDGER / THE PROGRAM / THE DESK, two refreshes
  // later (the 3-s poll) the sheet is still at the bottom (it used to jump back to the top on his iPhone); 402 wide, a short screen so
  // every face scrolls
  { const atBottom = () => ev(O.page, `(() => { const s = document.querySelector('.rd-sheet'); return { top: Math.round(s.scrollTop), max: Math.round(s.scrollHeight - s.clientHeight) }; })()`);
    const res = {};
    await O.page.setViewport({ width: 402, height: 560, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(600);   // (a short screen: every face scrolls)
    for (const face of ['LEDGER', 'PROGRAM', 'DESK']) {
      await ev(O.page, `[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === '${face}').click()`);
      await sleep(1500);
      await ev(O.page, `(() => { const s = document.querySelector('.rd-sheet'); s.scrollTop = s.scrollHeight; })()`);
      await sleep(7000);   // (two of the radio's 3-s polls — a fixed wait: the refreshes ARE timed)
      const b = await atBottom();
      res[face] = b;
      ok(b.max > 40 && b.top >= b.max - 2, `RADIO (CC-B review): THE ${face} stays where the finger left it through two refreshes (${b.top} of ${b.max})`);
    }
    await O.page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(400); }
  // ---- CC-B — PRESETS, as the owner's CC-B review asked (fix 4): "SAVE AS A ONE-TAP JACK" under a card's FIRE → a small sheet (a NAME
  // prefilled GAME NIGHT + one line + SAVE) → the desk scrolls to the new jack in the bottom row + it flashes once → its card → FIRE → DELETE
  { await ev(O.page, `[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === 'DESK').click()`); await sleep(400);
    const hAway = (new Date().getHours() + 7) % 24, hh = String(hAway).padStart(2, '0');
    const setAt = async () => { await ev(O.page, `[...document.querySelectorAll('.rd-cardwrap .rd-seg button')].find(b => b.textContent === 'AT A TIME').click()`); await sleep(200); await ev(O.page, `(() => { const t = document.querySelector('.rd-cardwrap .rd-time'); t.value = '${hh}:15'; t.dispatchEvent(new Event('change', { bubbles: true })); t.dispatchEvent(new Event('input', { bubbles: true })); })()`); await sleep(200); };
    await ev(O.page, 'document.querySelector(".rd-sheet").scrollTop = 0');
    await tapJack(O.page, 'billboard'); await waitFor(O.page, '!!document.querySelector(".rd-cardwrap.is-in .rd-line")', 'the billboard card', 5000);
    const L = await O.page.$$('.rd-line'); await L[0].type('PRESET'); await L[1].type('NIGHT'); await setAt();
    const label = await ev(O.page, `(document.querySelector('.rd-cardwrap .rd-savepre') || {}).textContent || ''`);
    await ev(O.page, `document.querySelector('.rd-cardwrap .rd-savepre').click()`); await sleep(250);
    const sheetUi = await ev(O.page, `(() => { const s = document.querySelector('.rd-saveto'); return s ? { name: s.querySelector('.rd-inp').value, line: (s.querySelector('.rd-hint') || {}).textContent || '', save: [...s.querySelectorAll('.rd-done')].map(b => b.textContent).join() } : null; })()`);
    ok(label === 'SAVE AS A ONE-TAP JACK' && sheetUi && sheetUi.name === 'GAME NIGHT' && /^Fires this exact card again with one tap — it becomes a jack in the bottom row\.$/.test(sheetUi.line) && sheetUi.save === 'SAVE',
      `RADIO (CC-B review): "${label}" → a small sheet: NAME "${sheetUi && sheetUi.name}" · "${sheetUi && sheetUi.line}" · ${sheetUi && sheetUi.save}`);
    await ev(O.page, `(() => { const i = document.querySelector('.rd-saveto .rd-inp'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await O.page.type('.rd-saveto .rd-inp', 'E2E NIGHT');
    await ev(O.page, `[...document.querySelectorAll('.rd-saveto .rd-done')].find(b => b.textContent === 'SAVE').click()`);
    await waitFor(O.page, '!!document.querySelector(".rd-presets .rd-jack.is-preset.is-flash")', 'the new jack flashes', 6000).catch(() => {});
    await sleep(900);   // (the smooth scroll to it — measured once it has settled, still inside the 1.4-s flash)
    const seen = await ev(O.page, `(() => { const j = document.querySelector('.rd-presets .rd-jack.is-preset'); if (!j) return null; const r = j.getBoundingClientRect(), s = document.querySelector('.rd-sheet').getBoundingClientRect(); return { flash: j.classList.contains('is-flash'), inView: r.top >= s.top - 1 && r.bottom <= s.bottom + 1, card: !!document.querySelector('.rd-cardwrap') }; })()`);
    await sleep(1600);
    const once = await ev(O.page, `!document.querySelector('.rd-presets .rd-jack.is-flash')`);
    const st = await call(O.page, { action: 'radioState' }), pr = st.ok && (st.r.presets || []).find(x => x.name === 'E2E NIGHT');
    ok(pr && pr.steps.length === 1 && pr.steps[0].kind === 'board' && seen && seen.flash && seen.inView && !seen.card && once,
      `RADIO (CC-B review): SAVE → a one-tap jack in the bottom row, scrolled into view, flashing once (${JSON.stringify(seen)}; then still: ${once})`);
    await ev(O.page, `document.querySelector('.rd-presets .rd-jack.is-preset').click()`); await waitFor(O.page, '!!document.querySelector(".rd-cardwrap.is-in .rd-precard")', 'the preset card', 5000);
    const steps = await ev(O.page, `document.querySelectorAll('.rd-precard .rd-step').length`);
    await ev(O.page, `[...document.querySelectorAll('.rd-precard .rd-fire')].find(b => /FIRE THE PRESET/.test(b.textContent)).click()`);
    await waitFor(O.page, `[...document.querySelectorAll('.rd-precard p')].some(p => /✓/.test(p.textContent))`, 'the result', 8000).catch(() => {});
    const res = await ev(O.page, `[...document.querySelectorAll('.rd-precard p')].map(p => p.textContent).filter(t => /[✓✗]/.test(t))`);
    await ev(O.page, `[...document.querySelectorAll('.rd-precard .rd-cancel')].find(b => /DELETE/.test(b.textContent)).click()`); await sleep(150);
    await ev(O.page, `[...document.querySelectorAll('.rd-precard .rd-cancel')].find(b => /SURE/.test(b.textContent)).click()`); await sleep(1000);
    const after = await call(O.page, { action: 'radioState' });
    ok(steps === 1 && res.length === 1 && res.every(t => /✓/.test(t)) && !(after.r.presets || []).some(x => x.name === 'E2E NIGHT'), `RADIO (CC-B): the jack's card (${steps} step) → FIRE THE PRESET (${res.join(' | ')}) → DELETE (a second tap)`); }
  // ---- CLEAR ALL under the cover: the cover first, then the button
  await ev(O.page, `[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === 'DESK').click()`); await sleep(400);
  await ev(O.page, `document.querySelector('.rd-cover').click()`); await sleep(400);
  ok(await ev(O.page, '!!document.querySelector(".rd-clear.is-open")'), 'RADIO: CLEAR ALL — the safety cover lifts first');
  await ev(O.page, `document.querySelector('.rd-cbtn').click()`); await sleep(1500);
  { const st = await call(O.page, { action: 'radioState' }); ok(st.ok && !st.r.board.length && !st.r.moments.some(m => m.mine && (m.state === 'q' || m.state === 'run')), 'RADIO: CLEAR ALL stopped his moments + emptied the billboard queue'); }
  // the audit log: every action
  { const all = (await get('audit')) || {}, acts = new Set(Object.values(all).filter(l => l && l.by === pid).map(l => l.act));
    ok(['radioFire', 'radioStop', 'radioBoard', 'radioClearAll', 'radioIntercom', 'radioUnsend', 'radioPreset', 'radioPresetFire'].every(x => acts.has(x)), `RADIO: the audit log has every action (${[...acts].join(' ')})`); }
  await dbPut(`testAdmins/${pid}`, null); await dbPut(`rooms/${ROOM}`, null);
  await O.ctx.close();
  log('radio', 'done');
});

// CITY CONTROLS B — THE CREW end to end: the owner grants it (from a player's card + THE LEDGER by name tag; cap 10), the crew's cut-down
// desk (11 jacks, THIS LOBBY ONLY, no tuning / mic / program / ledger), a crew member refused beyond the role, ONE RADIO PER LOBBY (the
// host's; the other crew member's button locked → THE RADIO'S WITH … → ASK → the holder's HAND IT OVER → THE RADIO'S YOURS), the lobby's
// limits (the cooldown greys the jack with a friendly note), the owner removes them. Fires only into its own test lobby.
G('crew', async () => {
  const uidOf = p => ev(p, `import('/js/store.js').then(s => s.state.uid)`);
  const O = await open({ slot: 'cro', qs: 'when=2026-11-03T21:00' }); await harborUp(O.page);
  const opid = await pidOf(O.page); await dbPut(`testAdmins/${opid}`, true);
  const C = await open({ slot: 'crc', qs: 'when=2026-11-03T21:00' }); await harborUp(C.page);
  const D = await open({ slot: 'crd', qs: 'when=2026-11-03T21:00' }); await harborUp(D.page);
  const [cpid, dpid] = [await pidOf(C.page), await pidOf(D.page)], [cuid, duid] = [await uidOf(C.page), await uidOf(D.page)];
  ok(!!(cpid && dpid && cuid && duid), `CREW: two friends with profiles (${cpid}, ${dpid})`);
  // ---- THE OWNER grants: by the uid he tapped (the player's card) + by name tag (THE LEDGER)
  const peek = await call(O.page, { action: 'radioCrewPeek', uid: cuid });
  const g1 = await call(O.page, { action: 'radioCrewSet', uid: cuid, on: true });
  const dprof = await get(`profiles/${dpid}`);
  const g2 = await call(O.page, { action: 'radioCrewSet', tag: `${dprof.n}#${dprof.t}`, on: true });
  const bad = await call(O.page, { action: 'radioCrewSet', tag: 'NOBODY#0000', on: true });
  ok(peek.ok && peek.r.pid === cpid && peek.r.on === false && g1.ok && g1.r.on && g2.ok && g2.r.crew.some(c => c.pid === dpid) && !bad.ok && bad.code === 'no_tag', `CREW: the owner's switch (peek → ON by the player's card) + ADD BY NAME TAG (${dprof.n}#${dprof.t}); an unknown tag refused (${bad.code})`);
  { // CAP 10
    const fake = {}; for (let i = 0; i < 8; i++) fake[`pzzzzzzzzzz${'abcdefgh'[i]}`] = { at: 1, by: opid, n: 'FAKE', t: '000' + i };
    for (const [k, v] of Object.entries(fake)) await dbPut(`radio/crew/${k}`, v);
    const third = await open({ slot: 'cre', qs: 'when=2026-11-03T21:00' }); await harborUp(third.page); await pidOf(third.page); const euid = await uidOf(third.page);
    const full = await call(O.page, { action: 'radioCrewSet', uid: euid, on: true });
    for (const k of Object.keys(fake)) await dbPut(`radio/crew/${k}`, null);
    await third.ctx.close();
    ok(!full.ok && full.code === 'crew_full', `CREW: CAP 10 — the 11th refused (${full.code}: "${full.msg}")`); }
  // ---- THE CREW's cut-down desk (C): the corner button, 11 jacks, THIS LOBBY ONLY, no tuning / mic / program / ledger; not in a lobby → greyed
  await ev(C.page, 'sessionStorage.clear()'); await C.page.reload(); await harborUp(C.page);
  await waitFor(C.page, '!!document.querySelector(".rd-btn")', 'the crew button', 20000);
  await ev(C.page, `document.querySelector('.rd-btn').click()`); await waitFor(C.page, '!!document.querySelector(".rd-modal.is-in .rd-jack")', 'the crew desk', 10000);
  { const d = await ev(C.page, `({ jacks: [...document.querySelectorAll('.rd-jack')].map(j => j.dataset.jack), grey: [...document.querySelectorAll('.rd-jack')].every(j => j.dataset.lamp === 'grey'), tune: !!document.querySelector('.rd-tune'), mic: !!document.querySelector('.rd-mic'), band: !!document.querySelector('.rd-bb'), plate: (document.querySelector('.rd-lobplate') || {}).textContent || '', clear: !!document.querySelector('.rd-clear') })`);
    const want = RD.jacks().filter(j => j.crew).map(j => j.id);
    ok(d.jacks.length === 11 && d.jacks.every(j => want.includes(j)) && d.grey && !d.tune && !d.mic && !d.band && !d.clear && /THIS LOBBY ONLY/.test(d.plate), `CREW: the cut-down desk — 11 jacks (${d.jacks.join(' ')}), THIS LOBBY ONLY, no tuning / mic / program / ledger / clear-all; not in a lobby → every jack greyed`);
    await tapJack(C.page, 'banner'); await sleep(300);
    const bub = await ev(C.page, `(document.querySelector('.rd-bub') || {}).textContent || ''`);
    ok(/join a lobby/i.test(bub), `CREW: a greyed jack says why ("${bub}")`);
    await C.page.keyboard.press('Escape'); }
  // ---- refused beyond the role
  { const tries = [{ action: 'radioFire', jack: 'ufo', aud: 'everyone' }, { action: 'radioFire', jack: 'billboard', aud: 'room', room: 'ABCD' }, { action: 'radioDial', level: 'low' }, { action: 'radioIntercom', aud: 'me', mime: 'audio/mp4', dur: 2, b64: 'AAAA' }, { action: 'radioCrewSet', uid: duid, on: false }, { action: 'radioLedger' }, { action: 'radioClearAll' }, { action: 'radioBoard', lines: ['HI'] }, { action: 'radioRooms' }];
    const res = []; for (const b of tries) res.push(await call(C.page, b));
    ok(res.every(r => !r.ok && r.status === 403), `CREW: refused beyond the role (${res.map(r => r.code).join(' ')})`); }
  // ---- ONE RADIO PER LOBBY: C hosts → C holds it; D joins → D's button locked → ASK → C hands it over
  const code = await ev(C.page, `import('/js/room.js').then(m => m.createRoom({ name: 'CREW HOST', color: 'cyan', avatar: 'bolt' })).then(() => import('/js/store.js')).then(s => s.state.code)`);
  await ev(D.page, `import('/js/room.js').then(m => m.joinRoom('${code}', { name: 'CREW TWO', color: 'pink', avatar: 'star' })).catch(e => e.message)`);
  await waitFor(D.page, `import('/js/store.js').then(s => s.state.code === '${code}' && !!s.state.meta)`, 'D in the lobby', 15000);
  await ev(D.page, 'sessionStorage.clear()');
  await D.page.reload(); await waitFor(D.page, `import('/js/store.js').then(s => s.state.code === '${code}' && !!s.state.meta)`, 'D back in the lobby', 20000);
  await waitFor(D.page, '!!document.querySelector(".rd-btn")', 'the crew button (D)', 20000);
  await waitFor(D.page, '!!document.querySelector(".rd-btn.is-locked")', 'the button locked (D)', 15000).catch(() => {});
  const Cst = await call(C.page, { action: 'radioState', room: code }), Dst = await call(D.page, { action: 'radioState', room: code });
  ok(Cst.ok && Cst.r.lobby.mine && Dst.ok && !Dst.r.lobby.mine && Dst.r.lobby.holder === cuid && await ev(D.page, '!!document.querySelector(".rd-btn.is-locked .rd-lockg")'), `CREW: ONE RADIO PER LOBBY — the host (C) holds it; D's button DIMMED with a brass lock`);
  // C fires into the lobby (dormant — recorded + queued); the lobby's limits: the cooldown greys the jack
  const f = await call(C.page, { action: 'radioFire', jack: 'balloons', aud: 'room', room: code });
  const node = f.ok ? await get(`rooms/${code}/radio/${f.r.moment.id}`) : null, fired = f.ok ? await get(`radio/fired/${f.r.moment.id}`) : null;
  const f2 = await call(C.page, { action: 'radioFire', jack: 'lightning', aud: 'room', room: code });
  const df = await call(D.page, { action: 'radioFire', jack: 'lightning', aud: 'room', room: code });
  ok(f.ok && node && node.by === 'crew' && fired && fired.sight === false && !f2.ok && f2.code === 'cooldown' && !df.ok && df.code === 'not_holder', `CREW: the holder fires into the lobby (recorded, never a sighting) → the COOLDOWN (${f2.code}: "${f2.msg}"); D refused — not the holder (${df.code})`);
  await ev(C.page, `window.__radio.open()`); await waitFor(C.page, '!!document.querySelector(".rd-modal.is-in .rd-jack")', 'the crew desk in the lobby', 10000);
  await ev(C.page, `window.__radio.refresh()`); await sleep(400);
  { const l = await ev(C.page, `(document.querySelector('.rd-jack[data-jack="lightning"]') || {}).dataset.lamp`); ok(l === 'grey', `CREW: the cooldown greys the jack (${l})`); }
  // D: the lock face → ASK FOR THE RADIO
  await ev(D.page, `window.__radio.open()`); await waitFor(D.page, '!!document.querySelector(".rd-modal.is-in .rd-lockface")', 'the lock face', 10000);
  const lockT = await ev(D.page, `document.querySelector('.rd-lockface').textContent`);
  await ev(D.page, `document.querySelector('.rd-askbtn').click()`);
  await waitFor(C.page, '!!document.querySelector(".rd-askcard")', 'the holder ask card', 10000);
  const askT = await ev(C.page, `document.querySelector('.rd-askcard').textContent`);
  await ev(C.page, `[...document.querySelectorAll('.rd-askcard button')].find(b => b.textContent === 'HAND IT OVER').click()`);
  await waitFor(D.page, `window.__radio.lobby() && window.__radio.lobby().mine`, 'D holds it', 15000).catch(() => {});
  const Dafter = await call(D.page, { action: 'radioState', room: code }), Cafter = await call(C.page, { action: 'radioState', room: code });
  ok(/THE RADIO’S WITH CREW HOST TONIGHT/.test(lockT) && /CREW TWO WANTS THE RADIO/.test(askT) && Dafter.r.lobby.mine && !Cafter.r.lobby.mine, `CREW: D's lock note ("${lockT.slice(0, 40)}…") → ASK → C's "${askT.slice(0, 26)}" → HAND IT OVER → D holds the radio`);
  // ---- THE OWNER in the lobby: a tap on a player → their card with the brass CREW switch (ON) → OFF
  await ev(O.page, `import('/js/room.js').then(m => m.joinRoom('${code}', { name: 'THE OWNER', color: 'yellow', avatar: 'bolt' })).catch(e => e.message)`);
  await waitFor(O.page, `import('/js/store.js').then(s => s.state.code === '${code}' && !!s.state.meta)`, 'the owner in the lobby', 15000);
  await ev(O.page, 'sessionStorage.clear()'); await O.page.reload();
  await waitFor(O.page, `!!document.querySelector('.rd-btn') && !!document.querySelector('.rc-tag[data-uid="${cuid}"], .chip.player[data-uid="${cuid}"]')`, 'the owner radio + the lobby list', 25000);
  await ev(O.page, `(() => { const c = document.querySelector('.rc-tag[data-uid="${cuid}"], .chip.player[data-uid="${cuid}"]'), r = c.getBoundingClientRect(), o = { bubbles: true, clientX: r.left + 20, clientY: r.top + 10 }; c.dispatchEvent(new PointerEvent('pointerdown', o)); c.dispatchEvent(new PointerEvent('pointerup', o)); return true; })()`);
  await waitFor(O.page, `(document.querySelector('.rd-pcard .rd-lever') || {}).getAttribute && document.querySelector('.rd-pcard .rd-lever').getAttribute('aria-checked') === 'true'`, 'the card says CREW ON', 10000).catch(() => {});
  const on1 = await ev(O.page, `(() => { const l = document.querySelector('.rd-pcard .rd-lever'); return l ? l.getAttribute('aria-checked') : null; })()`);
  await ev(O.page, `document.querySelector('.rd-pcard .rd-lever').click()`);
  await waitFor(O.page, `document.querySelector('.rd-pcard .rd-lever').getAttribute('aria-checked') === 'false'`, 'CREW OFF', 8000).catch(() => {});
  const off = await get(`radio/crew/${cpid}`);
  ok(on1 === 'true' && off === null, `CREW: the owner taps a player in the lobby → their card's CREW switch (${on1}) → OFF (the server: ${JSON.stringify(off)})`);
  await ev(O.page, `import('/js/room.js').then(m => m.leaveRoom()).catch(() => {})`);
  // ---- the owner removes them; the audit log
  await call(O.page, { action: 'radioCrewSet', pid: cpid, on: false }); await call(O.page, { action: 'radioCrewSet', pid: dpid, on: false });
  const who = await call(C.page, { action: 'radioWho' });
  const acts = new Set(Object.values((await get('audit')) || {}).filter(l => l && (l.by === opid || l.by === cpid || l.by === dpid)).map(l => l.act));
  ok(who.ok && who.r.role === null && ['radioCrewAdd', 'radioCrewRemove', 'radioAsk', 'radioHandOver', 'radioFire'].every(a => acts.has(a)), `CREW: REMOVE → no radio; the audit log has it all (${[...acts].filter(a => /Crew|Ask|Hand|Fire/.test(a)).join(' ')})`);
  for (const p of [C, D]) await ev(p.page, `import('/js/room.js').then(m => m.leaveRoom()).catch(() => {})`);
  await dbPut(`rooms/${code}`, null);
  // ---- CC-B — "A ROOM JUST OPENED": a FAKE subscription (keys made here) at a local receiver → the owner's switch ON → SEND A TEST + a new
  // room → each push arrives ENCRYPTED (aes128gcm) with a VAPID header, decrypted here to its words; THE LEDGER's paper; OFF
  { const { createServer } = await import('node:http'), C2 = await import('node:crypto');
    const got = [];
    const srv = createServer((req, res) => { const ch = []; req.on('data', c => ch.push(c)); req.on('end', () => { got.push({ h: req.headers, body: Buffer.concat(ch) }); res.statusCode = 201; res.end(); }); });
    await new Promise(r => srv.listen(0, '127.0.0.1', r));
    const ua = C2.createECDH('prime256v1'); ua.generateKeys(); const auth = C2.randomBytes(16);
    const sub = { endpoint: `http://127.0.0.1:${srv.address().port}/push/e2e`, keys: { p256dh: ua.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } };
    const hk = (salt, ikm, info, n) => { const prk = C2.createHmac('sha256', salt).update(ikm).digest(); return C2.createHmac('sha256', prk).update(Buffer.concat([info, Buffer.from([1])])).digest().subarray(0, n); };
    const open8291 = body => { const salt = body.subarray(0, 16), idl = body[20], as = body.subarray(21, 21 + idl), ct = body.subarray(21 + idl);
      const ikm = hk(auth, ua.computeSecret(as), Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), as]), 32);
      const d = C2.createDecipheriv('aes-128-gcm', hk(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), hk(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12));
      d.setAuthTag(ct.subarray(-16)); const pt = Buffer.concat([d.update(ct.subarray(0, -16)), d.final()]); return JSON.parse(pt.subarray(0, pt.lastIndexOf(2)).toString()); };
    const on = await call(O.page, { action: 'radioPush', op: 'sub', sub });
    const t = await call(O.page, { action: 'radioPush', op: 'test' });
    for (let i = 0; i < 40 && got.length < 1; i++) await sleep(100);
    const p1 = got[0] ? open8291(got[0].body) : null, vap = got[0] ? String(got[0].h.authorization || '') : '';
    // the VAPID JWT verifies against its own k= key (ES256)
    let jwtOk = false; try { const [, tk, k] = /^vapid t=([^,]+), k=(.+)$/.exec(vap); const [hh, bb, sg] = tk.split('.'), pub = Buffer.from(k, 'base64url');
      const key = C2.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33, 65).toString('base64url') }, format: 'jwk' });
      jwtOk = C2.verify('sha256', Buffer.from(`${hh}.${bb}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(sg, 'base64url')) && JSON.parse(Buffer.from(bb, 'base64url')).aud === `http://127.0.0.1:${srv.address().port}`; } catch { jwtOk = false; }
    ok(on.ok && on.r.on && t.ok && t.r.sent === 1 && got[0] && got[0].h['content-encoding'] === 'aes128gcm' && jwtOk && p1 && p1.title === 'A ROOM JUST OPENED', `PUSH (CC-B): the owner's switch ON (a subscription) → SEND A TEST → an encrypted push with a valid VAPID token → "${p1 && p1.title} · ${p1 && p1.body}"`);
    // a new room by a guest → the owner's phone hears of it (once)
    const code2 = await ev(D.page, `import('/js/room.js').then(m => m.createRoom({ name: 'MIKE', color: 'pink', avatar: 'star' })).then(() => import('/js/store.js')).then(s => s.state.code)`);
    for (let i = 0; i < 60 && got.length < 2; i++) await sleep(100);
    const p2 = got[1] ? open8291(got[1].body) : null;
    const again = await call(D.page, { action: 'radioRoomOpened', room: code2 }); await sleep(300);
    ok(p2 && p2.title === 'A ROOM JUST OPENED' && p2.body === `${code2} · 1 player` && p2.url && got.length === 2 && again.ok, `PUSH (CC-B): a guest opens ${code2} → "${p2 && p2.body}" (once — a second call sends nothing)`);
    // THE LEDGER's paper on the owner's phone
    await ev(O.page, 'window.__radio && window.__radio.open()'); await sleep(500); await ev(O.page, `window.__radio.setBand('ledger')`);
    await waitFor(O.page, `/Phones it goes to/.test((document.querySelector('.rd-push') || {}).textContent || '')`, 'the push paper (read)', 15000).catch(() => {});
    const paper = await ev(O.page, `(document.querySelector('.rd-push') || {}).textContent || ''`);
    ok(/A ROOM JUST OPENED/.test(paper) && /Phones it goes to\s*1/.test(paper) && /SEND A TEST/.test(paper), `PUSH (CC-B): THE LEDGER's paper — the switch, the phones (1), SEND A TEST ("${paper.slice(0, 90)}")`);
    await call(O.page, { action: 'radioPush', op: 'unsub', endpoint: sub.endpoint });
    const after = await call(O.page, { action: 'radioPush', op: 'state' });
    ok(after.ok && after.r.subs === 0 && after.r.on === false, 'PUSH (CC-B): OFF — the subscription gone');
    await ev(D.page, `import('/js/room.js').then(m => m.leaveRoom()).catch(() => {})`); await dbPut(`rooms/${code2}`, null);
    srv.close(); }
  await dbPut(`testAdmins/${opid}`, null);
  for (const p of [O, C, D]) await p.ctx.close();
  log('crew', 'done');
});
