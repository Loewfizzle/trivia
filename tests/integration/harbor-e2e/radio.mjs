// CITY CONTROLS A — THE RADIO end to end (the `models` cloud job): the corner button ONLY for a profile with a radio (the server's role),
// the desk built from the timetable, a fire → amber → pink → STOP on JUST ME + a room's node, a greyed jack's note (or every jack ready
// after dark), the billboard jack's queue + a REPEAT on THE PROGRAM, THE LEDGER's nixies, a nobody refused at every action, the city
// behind keeps its tier while the radio is open. NEVER fires anything the other shards' pages would play (the emulators are shared
// locally): JUST ME, a test room, a city banner set AT A TIME hours away (then cancelled).
import { BASE, log, sleep, ok, okT, open, ev, waitFor, harborUp, dbPut, G, SHOTS, OUT } from './kit.mjs';
// (SHELL 2.0 B1: each face shot top + bottom — the neon desk's look review)
const shotFace = async (p, name) => { if (!SHOTS) return; await sleep(500); await p.screenshot({ path: `${OUT}radio-${name}.png` }); await p.evaluate(() => { const s = document.querySelector('.rd-sheet'); if (s) s.scrollTop = s.scrollHeight; }); await sleep(300); await p.screenshot({ path: `${OUT}radio-${name}-end.png` }); await p.evaluate(() => { const s = document.querySelector('.rd-sheet'); if (s) s.scrollTop = 0; }); };
import { readFileSync } from 'node:fs';
import * as RD from '../../../js/core/harbor-radio.js';
import * as RD_IC from '../../../js/core/radio-intercom.js';

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
  await shotFace(O.page, 'desk');
  const desk = await ev(O.page, `[...document.querySelectorAll('.rd-jack')].map(j => j.dataset.jack)`);
  ok(desk.join() === RD.jacks().map(j => j.id).join(), `RADIO: THE DESK's jacks = the timetable's rows with a jack (${desk.length}: ${desk.join(' ')})`);
  const faces = await ev(O.page, `[...document.querySelectorAll('.rd-bb')].map(b => b.textContent).join()`);
  ok(faces === 'DESK,PROGRAM,LEDGER', `RADIO: the band selector (${faces})`);
  // (SHELL 2.0 B1 — THE RADIO MATCHES THE REST: no brass left — the panels dark glass, the tabs + buttons neon tubes (the on tab PINK), the
  //  jacks neon rings, the dial dark with a neon needle, no gradient-filled letters, no cream paper)
  { const look = await ev(O.page, `(() => { const cs = s => { const e = document.querySelector(s); return e ? getComputedStyle(e) : null; }, lum = c => { const m = (c || '').match(/[\\d.]+/g); if (!m) return 1; const [r, g, b] = m.map(Number); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
      const on = cs('.rd-bb.is-on'), off = cs('.rd-bb:not(.is-on)'), face = cs('.rd-face'), tune = cs('.rd-tune'), hole = cs('.rd-jack:not(.is-grey) .rd-hole'), brand = cs('.rd-brand b'), plate = cs('.rd-plate'), arr = cs('.rd-done');
      const brass = [...document.querySelectorAll('.rd-modal *')].filter(e => /#e2b867|226, 184, 103|214, 178, 104|255, 243, 207/.test(getComputedStyle(e).backgroundImage)).length;
      return { onPink: /rgb\\(255, 79, 216\\) 0px 0px 0px 1\\.5px/.test(on.boxShadow) && !/255, 243, 207|226, 184, 103/.test(on.backgroundImage), offWhite: !/255, 79, 216/.test(off.boxShadow) && /rgb\\(147, 166, 204\\) 0px 0px 0px 1\\.5px/.test(off.boxShadow), tube: on.borderRadius, faceDark: lum(face.backgroundImage.match(/rgba?\\([^)]+\\)/)[0]) < 0.2, tuneDark: lum((tune.backgroundImage.match(/rgba?\\([^)]+\\)/g) || [])[1]) < 0.2,
        ring: /\\d+px/.test(hole.boxShadow) && !/90, 74, 42/.test(hole.backgroundImage), clipText: /text/.test(brand.backgroundClip + brand.webkitBackgroundClip), plateBg: plate.backgroundImage, arrTube: /147, 166, 204/.test(arr.boxShadow), brass }; })()`);
    ok(look.onPink && look.offWhite && look.faceDark && look.tuneDark && look.ring && !look.clipText && look.plateBg === 'none' && look.arrTube && look.brass === 0,
      `THE RADIO IN THE SHELL LOOK: the on tab a PINK tube (${look.onPink}), the others quiet white tubes (${look.offWhite}), ARRANGE a tube (${look.arrTube}), the panels dark glass (${look.faceDark}), the dial dark (${look.tuneDark}), the jacks neon rings (${look.ring}), no gradient letters (${!look.clipText}), no brass plates (${look.plateBg}), brass left: ${look.brass}`); }
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
    await waitFor(O.page, `import('/js/core/harbor-billboard.js').then(m => !!m.intercomHead())`, 'the headline (at its start)', 4000).catch(() => {});   // (FRIENDS C: the sound is scheduled a moment ahead — the headline goes up with its first chime)
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
  // ---- FRIENDS C — THE INTERCOM IN SYNC (the owner, Nov 5: two phones in one house heard it at different moments): EVERYONE is stamped
  // 10 s ahead (THE LOBBY GETS IT LIVE — was ~50 s) on the server clock (the one sent above: never played — unsent long before its time); two WATCHING phones given the city's
  // copy start a REAL clip at the same moment (< 150 ms apart — each fetched, decoded + scheduled it on its own audio clock); a phone that
  // learns of it LATE joins mid-way (its start = the same `at`), never from the top. (A JUST ME clip fed as the city's copy on those pages:
  // nothing goes out to the other shards' phones.)
  { const fs = await import('node:fs'), mp3 = fs.readFileSync(new URL('../../../audio/city/boxer-combo_4.mp3', import.meta.url)).toString('base64');
    const e2 = await call(O.page, { action: 'radioIntercom', aud: 'everyone', mime: 'audio/mpeg', dur: 1, b64: mp3, head: '' });
    const lead = e2.ok ? (e2.r.intercom.at - e2.r.intercom.made) / 1000 : null;
    if (e2.ok) await call(O.page, { action: 'radioUnsend', id: e2.r.intercom.id });
    const s = await call(O.page, { action: 'radioIntercom', aud: 'me', mime: 'audio/mpeg', dur: 1, b64: mp3, head: '' }), id = s.ok && s.r.intercom.id;
    const W = [];
    for (const k of ['ica', 'icb', 'icc']) { const P = await open({ slot: k, qs: 'when=2026-11-03T21:00', profile: false }); await harborUp(P.page); await P.page.keyboard.press('Shift'); await waitFor(P.page, `import('/js/audio/engine.js').then(m => m.isUnlocked())`, 'the audio unlocked (a key)', 8000).catch(() => {}); W.push(P); }
    const t0 = await ev(W[0].page, `import('/js/firebase.js').then(m => m.serverNow())`), at = Math.round(t0 + 9000);
    const m = { ...(s.ok ? s.r.intercom : {}), aud: 'everyone', at, until: at + RD_IC.icLen(1) * 1000, made: t0, state: 'q' };
    const feed = P => ev(P.page, `import('/js/audio/intercom.js').then(x => { x.intercomFeed('feed', [${JSON.stringify(m)}]); return true; })`);
    await feed(W[0]); await sleep(1300); await feed(W[1]);   // (the two learn of it at different times — like two polls)
    const startOf = P => ev(P.page, `import('/js/audio/intercom.js').then(x => ({ s: x.intercomDebug().starts['${id}'] || null, log: x.intercomDebug().log.filter(l => l.id === '${id}').map(l => l.what) }))`);
    for (const P of W.slice(0, 2)) await waitFor(P.page, `import('/js/audio/intercom.js').then(x => x.intercomDebug().log.some(l => l.id === '${id}' && /^(playing|done|could)/.test(l.what)))`, 'the clip scheduled', 12000).catch(() => {});
    await sleep(Math.max(0, at + 3000 - Date.now()));   // (the late one: told 3 s after its start)
    await feed(W[2]);
    await waitFor(W[2].page, `import('/js/audio/intercom.js').then(x => x.intercomDebug().log.some(l => l.id === '${id}' && /^playing/.test(l.what)))`, 'the late phone', 10000).catch(() => {});
    const [a, b, c] = [await startOf(W[0]), await startOf(W[1]), await startOf(W[2])];
    ok(Math.abs(lead - 10) < 2 && a.s && b.s && Math.abs(a.s - b.s) < 150 && Math.abs(a.s - at) < 150 && a.log.some(w => /^playing/.test(w)) && b.log.some(w => /^playing/.test(w)),
      `THE INTERCOM IN SYNC (FRIENDS C): EVERYONE stamped ${lead} s ahead; two phones start the clip together — ${a.s && b.s ? Math.abs(a.s - b.s) : '?'} ms apart, ${a.s ? a.s - at : '?'} ms from its time (${a.log.join(' · ')} | ${b.log.join(' · ')})`);
    ok(c.s && Math.abs(c.s - at) < 250 && c.log.some(w => /^playing .*late/.test(w)), `THE INTERCOM IN SYNC (FRIENDS C): a phone told 3 s late joins MID-WAY on the same timeline (start ${c.s ? c.s - at : '?'} ms from its time: ${c.log.join(' · ')})`);
    for (const P of W) await P.ctx.close();
    if (id) await call(O.page, { action: 'radioUnsend', id }); }
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
    const early = (await logOf(id1)).filter(w => !/^could not play/.test(w));   // (FRIENDS C: a fake clip fails its decode during the few seconds of PREP — the start itself is still on time)
    await waitFor(O.page, `import('/js/audio/intercom.js').then(m => m.intercomDebug().log.some(l => l.id === '${id1}' && !/held/.test(l.what)))`, 'the scheduled intercom', 25000).catch(() => {});
    const later = await logOf(id1), when = await ev(O.page, `import('/js/audio/intercom.js').then(m => m.intercomDebug().starts['${id1}'] || 0)`);   // (FRIENDS C: the start it was SCHEDULED for — the fetch begins a few seconds ahead)
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
  await shotFace(O.page, 'program');
  const prog = await ev(O.page, `({ heads: [...document.querySelectorAll('.rd-paper h4')].map(h => h.firstChild.textContent), rows: document.querySelectorAll('.rd-paper .rd-pr').length, queue: [...document.querySelectorAll('.rd-paper')][0].textContent, week: document.querySelectorAll('.rd-wk div').length })`);
  ok(prog.heads.length === 3 && prog.heads[0] === 'YOUR QUEUE' && prog.heads[1] === 'THE WEEK' && prog.rows >= 3 && prog.week === 7 && /GAME NIGHT · 8 PM/.test(prog.queue) && /FRI 19:45|FRI \d/.test(prog.queue) === /FRI/.test(prog.queue), `RADIO: THE PROGRAM — the order ${prog.heads.join(' · ')} (FRIENDS C: YOUR QUEUE first), tonight (${prog.rows} rows), the week (${prog.week}), YOUR QUEUE with the billboard REPEAT ("${prog.queue.slice(0, 90)}")`);
  // ---- THE LEDGER's nixies
  await ev(O.page, `[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === 'LEDGER').click()`);
  await waitFor(O.page, '!!document.querySelector(".rd-big3 .rd-nixie")', 'THE LEDGER', 10000);
  await shotFace(O.page, 'ledger');
  const led = await ev(O.page, `({ nix: document.querySelectorAll('.rd-big3 .rd-nixie').length, rows: document.querySelectorAll('.rd-lg').length, bars: document.querySelectorAll('.rd-chart > div').length })`);
  ok(led.nix === 3 && led.rows >= 6 && led.bars === 7, `RADIO: THE LEDGER — 3 nixies, TODAY's rows (${led.rows}), THIS WEEK's 7 bars`);
  // (FR7 FIXES C — NOW PLAYING under the nixies: what THIS phone plays — the engine's own state; MUSIC OFF / nothing sounding are honest answers here)
  { const npx = await ev(O.page, `(() => { const e = document.querySelector('.rd-big3 + .rd-np'); return e ? { t: e.textContent, w: Math.round(e.getBoundingClientRect().width), sw: e.scrollWidth, cw: e.clientWidth } : null; })()`);
    ok(npx && /^NOW PLAYING · (MUSIC OFF|nothing sounding|.+ · .+)/.test(npx.t) && npx.sw <= npx.cw + 1, `RADIO: THE LEDGER's NOW PLAYING under the nixies ("${npx && npx.t}")`); }
  // ---- FR7 FIXES C — THE SWITCHES INSIDE THEIR PANELS (the owner's iPhone, Nov 13: THE CREW INTERCOM's knob hung half outside THE LEDGER's card):
  // at 390 (the owner's own slot, a page of its own — a resize rebuilds the city + closes the radio), on every face, every lever + its knob —
  // OFF and ON (the class flipped for the measure only, no server call) — inside its panel's padding, 44 pt tall
  { const S = await open({ slot: 'rdsw', qs: 'when=2026-11-03T21:00', view: [390, 844] });
    await harborUp(S.page);
    { const spid = await pidOf(S.page); await dbPut(`testAdmins/${spid}`, true); await ev(S.page, 'sessionStorage.clear()'); await S.page.reload(); await harborUp(S.page); }
    await waitFor(S.page, '!!document.querySelector(".rd-btn")', 'the radio button at 390', 20000);
    await ev(S.page, `document.querySelector('.rd-btn').click()`);
    await waitFor(S.page, '!!document.querySelector(".rd-modal.is-in .rd-jack")', 'the desk at 390', 10000);
    const fit = () => ev(S.page, `(() => { const out = [];
      for (const l of document.querySelectorAll('.rd-modal .rd-lever')) {
        if (!l.getClientRects().length) continue;
        const panel = l.closest('.rd-paper, .rd-sec, .rd-card') || l.parentElement, arm = l.querySelector('.rd-lever-arm'), had = l.classList.contains('is-on');
        for (const on of [false, true]) {
          l.classList.toggle('is-on', on); arm.style.transition = 'none';
          const P = panel.getBoundingClientRect(), cs = getComputedStyle(panel), a = arm.getBoundingClientRect(), b = l.getBoundingClientRect();
          const x0 = P.left + parseFloat(cs.paddingLeft) - 0.5, x1 = P.right - parseFloat(cs.paddingRight) + 0.5;
          out.push({ id: (l.getAttribute('aria-label') || l.textContent || '').trim().slice(0, 18), on, ok: b.left >= x0 && b.right <= x1 && a.left >= b.left - 0.5 && a.right <= b.right + 0.5 && b.height >= 44,
            lever: [Math.round(b.left), Math.round(b.right)], knob: [Math.round(a.left), Math.round(a.right)], panel: [Math.round(x0), Math.round(x1)], h: Math.round(b.height) });
        }
        l.classList.toggle('is-on', had); arm.style.transition = '';
      }
      return out; })()`);
    const all = [];
    for (const face of ['DESK', 'PROGRAM', 'LEDGER']) {
      await ev(S.page, `(() => { const b = [...document.querySelectorAll('.rd-bb')].find(x => x.textContent.trim() === '${face}'); if (b) b.click(); return !!b; })()`); await sleep(1500);
      if (face === 'LEDGER') await waitFor(S.page, '!!document.querySelector(".rd-crewic .rd-lever")', 'THE LEDGER\'s levers', 10000).catch(() => {});
      for (const r of await fit()) all.push({ face, ...r });
    }
    await shotFace(S.page, 'ledger-390');
    const bad = all.filter(r => !r.ok);
    ok(all.length >= 4 && all.some(r => r.face === 'LEDGER') && !bad.length, `RADIO: THE SWITCH FIT at 390 — ${all.length / 2} lever(s) on the three faces, OFF + ON, every knob inside its lever, every lever inside its panel, 44 pt tall (${bad.length ? JSON.stringify(bad) : all.map(r => `${r.face}:${r.id}`).filter((v, i, a) => a.indexOf(v) === i).join(' · ')})`);
    await S.ctx.close(); }
  // ---- FR7 FIXES C2 — THE FACES PAINT (the owner's iPhone, Nov 13 7 am: radio → LEDGER sat on "Tuning in…" forever): a phone holding an OLDER
  // music.js (the deploy before FR7 FIXES C: no `musicFileOf` export) — the shipped LEDGER imported the players through NOW PLAYING and never
  // linked ("Importing binding name 'musicFileOf' is not found"). Now: DESK → PROGRAM → LEDGER each paints its REAL content within 3 s on that
  // phone (the LEDGER: nixies + NOW PLAYING + TODAY). And a face whose file FAILS (THE PROGRAM's first fetch a 503) shows "Couldn't open … TAP
  // TO RETRY" + reports it (errlog's ring); one tap = a fresh import → the face. (WebKit's twin: tests/integration/wk-radio-faces.mjs — the
  // shipped build fails its stale case.)
  { const STALE = readFileSync(new URL('../../../js/audio/music.js', import.meta.url), 'utf8').replace(/export const musicFileOf\b/, 'const musicFileOf');
    let progFails = 1; const seen = [];
    const F = await open({ slot: 'rdfp', qs: 'when=2026-11-03T21:00', view: [390, 844], intercept: u => {
      if (/\/js\/audio\/music\.js(\?|$)/.test(u)) return { status: 200, contentType: 'text/javascript', body: STALE };
      if (/\/js\/screens\/harbor\/radio-program\.js/.test(u)) seen.push(u.replace(/^.*\//, ''));
      if (/\/js\/screens\/harbor\/radio-program\.js$/.test(u) && progFails > 0) { progFails--; return { status: 503, contentType: 'text/plain', body: 'down' }; }
      return null; } });
    await harborUp(F.page);
    { const fpid = await pidOf(F.page); await dbPut(`testAdmins/${fpid}`, true); await ev(F.page, 'sessionStorage.clear()'); await F.page.reload(); await harborUp(F.page); }
    await waitFor(F.page, '!!document.querySelector(".rd-btn")', 'the radio button (stale music.js)', 20000);
    await ev(F.page, `document.querySelector('.rd-btn').click()`);
    const t = {}, paints = async (js, ms = 3000) => { const t0 = Date.now(); try { await waitFor(F.page, js, 'a face', ms); return Date.now() - t0; } catch { return null; } };
    t.DESK = await paints('!!document.querySelector(".rd-modal.is-in .rd-jack")');
    await ev(F.page, `[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === 'PROGRAM').click()`);
    const retry = await paints('!!document.querySelector(".rd-paperwrap[data-face=program] .rd-retry")', 8000);
    const retryTxt = await ev(F.page, `(document.querySelector('.rd-retry') || {}).textContent || ''`);
    const progTxt = retryTxt ? '' : await ev(F.page, `(document.querySelector('.rd-paperwrap') || {}).textContent || ''`);
    const reported = await ev(F.page, `import('/js/errlog.js').then(m => m.recentErrors().some(e => /radio-program/.test(e.m)))`);
    ok(retry != null && /Couldn.t open the program — TAP TO RETRY/.test(retryTxt) && reported, `RADIO: a face that fails to load → "${retryTxt}" + reported to /admin (errlog: ${reported})${retryTxt ? '' : ` — the face showed "${String(progTxt).slice(0, 60)}", requests ${seen.join(' ')}`}`);
    if (!retryTxt) { await F.ctx.close(); throw new Error('the retry never showed'); }
    await ev(F.page, `document.querySelector('.rd-retry').click()`);
    t.PROGRAM = await paints('!!document.querySelector(".rd-paperwrap[data-face=program] .rd-paper")');
    await ev(F.page, `[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === 'LEDGER').click()`);
    t.LEDGER = await paints('(() => { const w = document.querySelector(".rd-paperwrap[data-face=ledger]"); return !!(w && w.querySelector(".rd-big3 .rd-nixie") && /^NOW PLAYING · /.test((w.querySelector(".rd-np") || {}).textContent || "") && [...w.querySelectorAll(".rd-paper h4")].some(e => /^TODAY/.test(e.textContent))); })()');
    const still = t.LEDGER == null ? await ev(F.page, `(document.querySelector('.rd-paperwrap') || {}).textContent || ''`) : '';
    ok(t.DESK != null && t.PROGRAM != null && t.LEDGER != null, `RADIO: THE FACES PAINT on a phone holding an older music.js — DESK ${t.DESK} ms · PROGRAM ${t.PROGRAM} ms (after the retry) · LEDGER ${t.LEDGER} ms (nixies + NOW PLAYING + TODAY)${still ? ` — still "${still.slice(0, 60)}"` : ''}`);
    await shotFace(F.page, 'faces-stale');
    await F.ctx.close(); }
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
  // (FRIENDS C: counted from the LOOP's own drawn frames over the 3 s — the tiering's frame window (frames()) is emptied BY DESIGN while a
  //  bake is pending, and the radio's own billboard messages swap the roof board (a neon re-bake) in this very window: it read ~0 fps)
  { const t0 = await ev(O.page, '(window.__district.tiering() || {}).tier'), d0 = await ev(O.page, '({ n: window.__district.loop().drawn, t: performance.now() })');
    await sleep(3000);
    const t1 = await ev(O.page, '(window.__district.tiering() || {}).tier'), d1 = await ev(O.page, '({ n: window.__district.loop().drawn, t: performance.now() })');
    const fps = Math.round((d1.n - d0.n) * 1000 / Math.max(1, d1.t - d0.t));
    const lp = await ev(O.page, `JSON.stringify(window.__district.harbor().loadLog.rows.slice(-3).map(r => r.kind + ' ' + r.msg))`);
    okT((t1 == null || t0 == null || t1 >= t0) && fps >= 24, `RADIO: the city behind keeps drawing under the open radio (tier ${t0} → ${t1}, ~${fps} fps drawn; the load log's last: ${lp})`); }
  // ---- THE OWNER's CC-B REVIEW, fix 1 — THE SCROLL JUMP: scrolled to the bottom of THE LEDGER / THE PROGRAM / THE DESK, two refreshes
  // later (the 3-s poll) the sheet is still at the bottom (it used to jump back to the top on his iPhone); 402 wide, a short screen so
  // every face scrolls
  { const atBottom = () => ev(O.page, `(() => { const s = document.querySelector('.rd-sheet'); return { top: Math.round(s.scrollTop), max: Math.round(s.scrollHeight - s.clientHeight) }; })()`);
    const res = {};
    await O.page.setViewport({ width: 402, height: 560, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(600);   // (a short screen: every face scrolls)
    for (const face of ['LEDGER', 'PROGRAM', 'DESK']) {
      await ev(O.page, `[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === '${face}').click()`);
      // (FRIENDS C — GREEN MEANS GREEN, (f): red only in the full 4-shard run — the face still filling in (its poll's rows) after a fixed
      //  1.5 s, so "the bottom" moved under the finger. Now: the face's height steady for 0.8 s first, then the finger at the bottom)
      await waitFor(O.page, `(() => { const s = document.querySelector('.rd-sheet'), h = s ? s.scrollHeight : 0, w = window.__rdH || (window.__rdH = { h: -1, at: 0 }), n = performance.now(); if (h !== w.h) { w.h = h; w.at = n; } return h > 0 && n - w.at > 800; })()`, `THE ${face} settled`, 15000).catch(() => {});
      await ev(O.page, 'window.__rdH = null');
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
  // ---- FRIENDS C — A FIRED JACK PLAYS ONCE (the owner, Nov 5: SKYWRITE · EVERYONE, the UFO, the TR-3B "on a loop"): four one-shots of
  // different kinds at once (THE DRONE SHOW = skywrite after dark · a LEGENDARY · the BALLOONS · the BANNER — JUST ME, written straight into the
  // queue: the server's own after-dark check reads the REAL clock), watched for their whole window while the city is REBUILT in the middle
  // (YOUR CARD → back: the bug — a rebuilt city began each again). Each piece appears exactly once.
  { await O.page.keyboard.press('Escape'); await waitFor(O.page, '!document.querySelector(".rd-modal")', 'the radio closed', 6000).catch(() => {});
    const t0 = await ev(O.page, `import('/js/firebase.js').then(m => m.serverNow())`), shots = [['skywrite', 'drones'], ['ufo', 'legend'], ['balloons', 'balloons'], ['banner', 'banner']];
    for (const [jack] of shots) { const len = RD.jackDef(jack).len; await dbPut(`radio/q/e2eonce-${jack}`, { jack, aud: 'me', room: null, by: pid, role: 'owner', text: jack === 'balloons' || jack === 'ufo' ? null : 'ONCE', colour: null, show: null, dance: null, local: null, at: t0 + 2000, until: t0 + 2000 + len * 1000, made: t0, state: 'q', wait: 0 }); }
    const on = `(() => { const h = window.__district.harbor(), d = h.sky.state; return { drones: !!(d.drones && d.drones.lit), legend: !!h.legend.state.run, balloons: !!(d.balloons && d.balloons.n), banner: !!d.banner }; })()`;
    const n = { drones: 0, legend: 0, balloons: 0, banner: 0 }, was = {}, end = Date.now() + 100e3;
    let away = false, seen = '';
    while (Date.now() < end) {
      const s = await ev(O.page, on).catch(() => null);
      if (s) for (const k of Object.keys(n)) { if (s[k] && !was[k]) n[k]++; was[k] = s[k]; }
      if (!away && n.drones && n.legend) {   // (the city rebuilt mid-window: YOUR CARD, then back)
        away = true; await ev(O.page, `import('/js/store.js').then(m => m.setState({ view: 'profile' }))`); await sleep(2500);
        await ev(O.page, `import('/js/store.js').then(m => m.setState({ view: 'title' }))`); await harborUp(O.page).catch(() => {}); for (const k of Object.keys(was)) was[k] = false;
        seen = JSON.stringify(await ev(O.page, `import('/js/screens/harbor/scene-radio.js').then(m => Object.keys(m.radioSeen()).filter(k => /^e2eonce/.test(k)))`));
      }
      if (Object.values(n).every(v => v >= 1) && away && Date.now() > end - 40e3) break;
      await sleep(500);
    }
    ok(away && Object.values(n).every(v => v === 1), `RADIO (FRIENDS C): A FIRED JACK PLAYS ONCE — each piece shown once over its whole window, the city rebuilt in the middle (${JSON.stringify(n)}; kept for the tab: ${seen})`);
    for (const [jack] of shots) await dbPut(`radio/q/e2eonce-${jack}`, null);
    await ev(O.page, `document.querySelector('.rd-btn').click()`); await waitFor(O.page, '!!document.querySelector(".rd-modal.is-in .rd-jack")', 'the desk', 10000); }
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
    // (FRIENDS C — the crew's header crowded at 390: every piece whole + apart at 390 / 402 / 430)
    const fit = [];
    // (the sheet set to each phone's width — a resize of the page would close the radio + drop its button)
    for (const w of [390, 402, 430]) {
      fit.push(await ev(C.page, `(() => { const sh = document.querySelector('.rd-modal .rd-sheet'); if (!sh) return { w: ${w}, miss: ['.rd-sheet'] }; sh.style.width = '${w}px'; const q = s => sh.querySelector(s), r = s => q(s).getBoundingClientRect(), miss = ['.rd-brand', '.rd-x', '.rd-lobplate'].filter(s => !q(s)); if (miss.length) { sh.style.width = ''; return { w: ${w}, miss }; }
        const b = q('.rd-brand'), x = r('.rd-x'), p = r('.rd-lobplate'), br = r('.rd-brand'), S = sh.getBoundingClientRect();
        const o = { w: ${w}, whole: [...b.children].every(e => e.scrollWidth <= e.clientWidth + 1) && b.scrollWidth <= b.clientWidth + 1, apart: br.right <= x.left && p.right <= x.left, inside: x.right <= S.right && br.left >= S.left };
        sh.style.width = ''; return o; })()`));
    }
    ok(fit.every(f => f.whole && f.apart && f.inside), `CREW (FRIENDS C): the crew radio's header fits — nothing clipped or touching the ✕ (${JSON.stringify(fit)})`);
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
  // C fires into the lobby (recorded + queued + PLAYED on the lobby's phones — LOBBY 2.0 B); the lobby's limits: the cooldown greys the jack
  const f = await call(C.page, { action: 'radioFire', jack: 'balloons', aud: 'room', room: code });
  const node = f.ok ? await get(`rooms/${code}/radio/${f.r.moment.id}`) : null, fired = f.ok ? await get(`radio/fired/${f.r.moment.id}`) : null;
  const f2 = await call(C.page, { action: 'radioFire', jack: 'lightning', aud: 'room', room: code });
  const df = await call(D.page, { action: 'radioFire', jack: 'lightning', aud: 'room', room: code });
  ok(f.ok && node && node.by === 'crew' && fired && fired.sight === false && !f2.ok && f2.code === 'cooldown' && !df.ok && df.code === 'not_holder', `CREW: the holder fires into the lobby (recorded, never a sighting) → the COOLDOWN (${f2.code}: "${f2.msg}"); D refused — not the holder (${df.code})`);
  // (LOBBY 2.0 B — the owner's ADD-ON: the crew's moment PLAYS now — on every phone IN the lobby (C + D), never outside it (O isn't in yet))
  if (f.ok) {
    const id = f.r.moment.id, seen = x => ev(x, `(() => { const r = window.__district && window.__district.radio && window.__district.radio(); return !!(r && r.moments.some(m => m.id === '${id}')); })()`);
    const inC = await waitFor(C.page, `(() => { const r = window.__district.radio && window.__district.radio(); return !!(r && r.moments.some(m => m.id === '${id}')); })()`, 'C has it', 10000).then(() => true, () => false);
    const inD = await waitFor(D.page, `(() => { const r = window.__district.radio && window.__district.radio(); return !!(r && r.moments.some(m => m.id === '${id}')); })()`, 'D has it', 10000).then(() => true, () => false);
    ok(inC && inD && !(await seen(O.page)), `CREW → THE LOBBY: the crew's moment reaches EVERY phone in the lobby (C ${inC}, D ${inD}) — never outside it (the owner, not in it yet: ${await seen(O.page)})`);
  }
  // THE LOBBY GETS IT LIVE (Nov 12 night): the owner's EVERYONE moment reaches the lobby's phones over the ROOM's socket within ~2 s of FIRE (10 s
  // before its start); the city's poll copy + the room's = ONE moment on the phone (merged by id — played once). (STOPPED before its start: the other
  // shards' open rooms got a copy too — none of them plays it)
  { const t0 = Date.now(), f3 = await call(O.page, { action: 'radioFire', jack: 'banner', aud: 'everyone', text: 'LIVE LOBBY' });
    const id = f3.ok && f3.r.moment.id, has = `(() => { const r = window.__district.radio && window.__district.radio(); return !!(r && r.moments.some(m => m.id === '${id}')); })()`;
    const tC = await waitFor(C.page, has, 'C hears it', 6000).then(() => Date.now() - t0, () => null);
    const tD = await waitFor(D.page, has, 'D hears it', 6000).then(() => Date.now() - t0, () => null);
    await ev(C.page, 'window.__district.remote && window.__district.remote() && window.__district.remote().radioNow()').catch(() => {});   // (the city's poll copy as well)
    await sleep(1500);
    const n = await ev(C.page, `(window.__district.radio().moments || []).filter(m => m.id === '${id}').length`);
    const lead = f3.ok ? (f3.r.moment.at - t0) / 1000 : null;
    if (id) await call(O.page, { action: 'radioStop', id });
    const stC = await waitFor(C.page, `(() => { const r = window.__district.radio(); const m = r && r.moments.find(x => x.id === '${id}'); return !m || m.state === 'stopped'; })()`, 'C sees the STOP', 6000).then(() => true, () => false);
    ok(f3.ok && tC != null && tC < 2500 && tD != null && tD < 2500 && n === 1 && lead >= 9 && stC,
      `THE LOBBY GETS IT LIVE: EVERYONE's moment on both lobby phones ${tC} / ${tD} ms after FIRE (its start ${lead && lead.toFixed(1)} s ahead), the poll's copy + the room's = ${n} moment, STOP reached the room (${stC})`); }
  // …and THE INTERCOM on two ROOM phones: EVERYONE's room copy (stamped 10 s ahead) starts on both together; the clip fetched the moment the row lands
  // (THE CLIP AHEAD). (A JUST ME clip fed as the room's copy on these two pages — nothing goes out to the other shards' phones)
  { const fs = await import('node:fs'), mp3 = fs.readFileSync(new URL('../../../audio/city/boxer-combo_4.mp3', import.meta.url)).toString('base64');
    const s = await call(O.page, { action: 'radioIntercom', aud: 'me', mime: 'audio/mpeg', dur: 1, b64: mp3, head: '' }), id = s.ok && s.r.intercom.id;
    for (const P of [C, D]) { await P.page.keyboard.press('Shift'); await waitFor(P.page, `import('/js/audio/engine.js').then(m => m.isUnlocked())`, 'the audio unlocked', 8000).catch(() => {}); }
    const t0 = await ev(C.page, `import('/js/firebase.js').then(m => m.serverNow())`), at = Math.round(t0 + 10000);
    const m = { ...(s.ok ? s.r.intercom : {}), aud: 'everyone', wait: true, at, until: at + RD_IC.icLen(1) * 1000, made: t0, state: 'q' };
    const feed = P => ev(P.page, `import('/js/audio/intercom.js').then(x => { x.intercomFeed('room', [${JSON.stringify(m)}]); return true; })`);
    await feed(C); await sleep(700); await feed(D);
    const startOf = P => ev(P.page, `import('/js/audio/intercom.js').then(x => ({ s: x.intercomDebug().starts['${id}'] || null, log: x.intercomDebug().log.filter(l => l.id === '${id}').map(l => l.what) }))`);
    for (const P of [C, D]) await waitFor(P.page, `import('/js/audio/intercom.js').then(x => x.intercomDebug().log.some(l => l.id === '${id}' && /^(playing|done|could)/.test(l.what)))`, 'the clip scheduled', 16000).catch(() => {});
    const [a, b] = [await startOf(C), await startOf(D)];
    ok(a.s && b.s && Math.abs(a.s - b.s) < 150 && Math.abs(a.s - at) < 150 && a.log[0] === 'clip fetched ahead' && b.log[0] === 'clip fetched ahead' && a.log.some(w => /^playing/.test(w)) && b.log.some(w => /^playing/.test(w)),
      `THE LOBBY GETS IT LIVE — THE INTERCOM in a lobby: two room phones start it together ${a.s && b.s ? Math.abs(a.s - b.s) : '?'} ms apart, ${a.s ? a.s - at : '?'} ms from its time 10 s after SEND (${a.log.join(' · ')} | ${b.log.join(' · ')})`);
    if (id) await call(O.page, { action: 'radioUnsend', id }); }
  await ev(C.page, `window.__radio.open()`); await waitFor(C.page, '!!document.querySelector(".rd-modal.is-in .rd-jack")', 'the crew desk in the lobby', 10000);
  await ev(C.page, `window.__radio.refresh()`); await sleep(400);
  { const l = await ev(C.page, `(document.querySelector('.rd-jack[data-jack="lightning"]') || {}).dataset.lamp`); ok(l === 'grey', `CREW: the cooldown greys the jack (${l})`); }
  // ---- FRIENDS A — THE CREW INTERCOM: the owner's ONE switch (default OFF) → ON: the holder's desk gets the hold-to-talk (≤ 15 s, this lobby);
  //      OFF: gone again + the server refuses a crew send
  { const micOn = () => ev(C.page, `!!document.querySelector('.rd-modal.is-in .rd-mic-btn')`);
    const off0 = await micOn();
    const on = await call(O.page, { action: 'radioCrewIntercom', on: true });
    await ev(C.page, `window.__radio.refresh()`);
    const shown = await waitFor(C.page, `!!document.querySelector('.rd-modal.is-in .rd-mic-btn')`, 'the crew mic', 10000).then(() => true, () => false);
    const label = await ev(C.page, `(document.querySelector('.rd-mic-t') || {}).textContent || ''`);
    if (SHOTS) await C.page.screenshot({ path: `${OUT}crew-intercom-on.png` });
    await call(O.page, { action: 'radioCrewIntercom', on: false });
    await ev(C.page, `window.__radio.refresh()`);
    const hidden = await waitFor(C.page, `!document.querySelector('.rd-modal.is-in .rd-mic-btn')`, 'the crew mic gone', 10000).then(() => true, () => false);
    const refused = await call(C.page, { action: 'radioIntercom', aud: 'room', room: code, mime: 'audio/mp4', dur: 2, b64: 'A'.repeat(400) });
    ok(!off0 && on.ok && shown && /15 S/.test(label) && hidden && !refused.ok && refused.code === 'crew_ic_off', `CREW INTERCOM: OFF by default (no mic: ${!off0}) → the owner's switch ON → the holder's hold-to-talk ("${label}") → OFF → gone + a send refused (${refused.code})`); }
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
  // (SHELL 2.0 A: + body.rd-owner — the radio marks the owner's phone a moment AFTER its button appears; a tap before it opened a card
  //  without the CREW row: wait for the condition the row reads, crew-row.js#isOwnerPhone)
  await waitFor(O.page, `!!document.querySelector('.rd-btn') && document.body.classList.contains('rd-owner') && !!document.querySelector('.rc-tag[data-uid="${cuid}"], .chip.player[data-uid="${cuid}"]')`, 'the owner radio + the lobby list', 25000);
  // (SHELL 2.0 B2 — the "no row" half of the flake: a tap opens the NEAREST figure's card (THE TAP AREA), and the owner had just reloaded —
  //  his OWN figure, still walking in, could be nearer to the tag's corner than C → HIS card, no CREW row. Now: the three settled in their
  //  lines first, then the tap at the CENTRE of C's own hit box)
  await waitFor(O.page, "(() => { const r = window.__district.room(); return !!r && r.people && r.people.length === 3 && r.people.every(x => x.s && x.s.pose === 'wait'); })()", 'the three settled at the door', 40000).catch(() => {});
  let opened = '';
  for (let k = 0; k < 4; k++) {
    await ev(O.page, `(() => { const c = document.querySelector('.rc-tag[data-uid="${cuid}"], .chip.player[data-uid="${cuid}"]'), hb = (window.__district.room().hits || {})['${cuid}'], r = c.getBoundingClientRect();
      const x = hb ? (hb.x0 + hb.x1) / 2 : r.left + 20, y = hb ? (hb.y0 + hb.y1) / 2 : r.top + 10, o = { bubbles: true, clientX: x, clientY: y }; c.dispatchEvent(new PointerEvent('pointerdown', o)); c.dispatchEvent(new PointerEvent('pointerup', o)); return true; })()`);
    await waitFor(O.page, "!!document.querySelector('.sh.is-in .sh-t b, .vl-full')", 'a card', 8000).catch(() => {});
    // (BOARD 2.0 B: a player with a profile opens THE PLAYER PAGE — its name in the sheet's label, the CREW row under it)
    opened = await ev(O.page, `(() => { const pp = document.querySelector('.vl-full.pp'); if (pp) return pp.dataset.pid === '${cpid}' ? 'CREW HOST (player page)' : 'player ' + pp.dataset.pid; const t = document.querySelector('.sh.is-in .sh-t b'); return t ? t.textContent : document.querySelector('.vl-full') ? 'full' : ''; })()`);
    if (/CREW HOST/.test(opened)) break;
    // (a figure walking past was nearer: the wrong card — close it, tap again)
    await ev(O.page, "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(500);
  }
  // (SHELL 2.0 B2 — GREEN MEANS GREEN, CREW's flaky switch (B1: red on the pre-pass code too). THE CAUSE, reproduced 1 in 5 under load: the
  //  peek (radioCrewPeek) + the set (radioCrewSet) are /api round trips; the step gave them FIXED windows (10 s / 8 s) whose timeouts were
  //  SWALLOWED, then clicked a switch still disabled (the peek not back) or read the server before the set had answered — "no row" / "the
  //  click didn't take". Now it waits for THE CONDITIONS: the switch ready (ON + enabled), then its own answer (OFF + enabled — busy over),
  //  then the server's node gone; nothing swallowed.)
  const swJs = "([...document.querySelectorAll('.cr-row .cr-sw')].filter(x => !x.closest('.is-out')).pop())";
  await waitFor(O.page, `(() => { const b = ${swJs}; return !!b && b.getAttribute('aria-checked') === 'true' && !b.disabled; })()`, 'the card says CREW ON (the switch ready)', 30000).catch(() => {});
  const diag0 = opened, diag = await ev(O.page, "({ opened: '', sheets: [...document.querySelectorAll('.sh:not(.is-out)')].map(x => x.className).join('|'), full: !!document.querySelector('.vl-full'), rows: [...document.querySelectorAll('.cr-row')].map(r => (r.closest('.is-out') ? 'OUT:' : '') + r.textContent.slice(0, 60)).join('|'), owner: document.body.classList.contains('rd-owner') })");
  const on1 = await ev(O.page, `(() => { const l = ${swJs}; return l ? l.getAttribute('aria-checked') : null; })()`);
  if (on1 == null) log('CREW DIAG', JSON.stringify(diag));
  // (SHELL 2.0 B2 — THE CREW SWITCH LIVE: C's radio is up + its panel OPEN when the owner flips C's CREW off)
  await ev(C.page, 'window.__radio && window.__radio.open()'); await sleep(300);
  const cBefore = await ev(C.page, "({ btn: !!document.querySelector('.rd-btn'), open: !!document.querySelector('.rd-modal.is-in') })");
  await ev(O.page, `(() => { const b = ${swJs}; if (b) b.click(); })()`);
  await waitFor(O.page, `(() => { const b = ${swJs}; return !!b && b.getAttribute('aria-checked') === 'false' && !b.disabled; })()`, 'CREW OFF (the server answered)', 30000).catch(() => {});
  for (let i = 0; i < 50 && (await get(`radio/crew/${cpid}`)) !== null; i++) await sleep(200);
  const off = await get(`radio/crew/${cpid}`);
  const note1 = await ev(O.page, "(document.querySelector('.cr-row .cr-t') || {}).textContent || '(no row)'");
  ok(on1 === 'true' && off === null, `CREW: the owner taps a player in the lobby → their card's CREW switch (${on1}) → OFF (the server: ${JSON.stringify(off)}; the row: "${note1}"; ${JSON.stringify(diag)})`);
  // …C's phone: the radio + its open panel GONE at once (no reload, no rejoin); then ON again → C's radio button BACK
  const t0 = Date.now(); await waitFor(C.page, "!document.querySelector('.rd-btn') && !document.querySelector('.rd-modal')", 'C’s radio gone', 15000).catch(() => {});
  const gone = await ev(C.page, "({ btn: !!document.querySelector('.rd-btn'), modal: !!document.querySelector('.rd-modal'), radio: !!window.__radio })"), goneMs = Date.now() - t0;
  await waitFor(O.page, `(() => { const b = ${swJs}; return !!b && b.getAttribute('aria-checked') === 'false' && !b.disabled; })()`, 'the switch ready again', 20000).catch(() => {});
  await ev(O.page, `(() => { const b = ${swJs}; if (b) b.click(); })()`);
  const t1 = Date.now(); await waitFor(C.page, "!!document.querySelector('.rd-btn')", 'C’s radio back', 20000).catch(() => {});
  const back = await ev(C.page, "!!document.querySelector('.rd-btn')"), backMs = Date.now() - t1, reloads = await ev(C.page, 'performance.getEntriesByType("navigation").length');
  ok(cBefore.btn && cBefore.open && !gone.btn && !gone.modal && back, `THE CREW SWITCH LIVE (two phones): C's radio up + its panel open (${JSON.stringify(cBefore)}) → the owner's OFF → gone at once (${goneMs} ms: ${JSON.stringify(gone)}) → ON → C's radio back (${backMs} ms) — no reload (${reloads} navigation)`);
  // (back to OFF for what follows: the owner removes C below)
  await waitFor(O.page, `(() => { const b = ${swJs}; return !!b && b.getAttribute('aria-checked') === 'true' && !b.disabled; })()`, 'the switch ready', 20000).catch(() => {});
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
  // (SHELL 2.0 B2 — green means green: the server sends at most PUSH_LIMITS.perHour room pushes an HOUR in all (rl/push_all_<hour>, on the
  //  emulator it outlives a run) — repeated runs within the hour spent it and this step got 'limit', not a push. Each run starts it fresh.)
  { const hr = Math.floor(Date.now() / 3600e3); for (const k of [hr - 1, hr, hr + 1]) await dbPut(`rl/push_all_${k}`, null); }
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
    // (FR6 FIXES A: the push is asked ROOM_PUSH_MS (10 s) after the room opened, and only while its host is still in it — js/room.js#roomPushLater)
    //  (SHELL 2.0 B2 — green means green: it waits for THE PUSH, up to 40 s — the old 16 s window was the 10 s delay + one slow /api call)
    //  (FR7 FIXES B — FR7-A F: the push switch + its phones are GLOBAL on the ONE emulator database the local shards share, so a room another
    //   shard opens meanwhile is pushed here too — the check picks THIS room's push by its code, never "the second push")
    const opened = () => got.slice(1).map(g => { try { return open8291(g.body); } catch { return null; } }).filter(x => x && x.url === `/?room=${code2}`);
    for (let i = 0; i < 400 && !opened().length; i++) await sleep(100);
    const p2 = opened()[0] || null;
    const again = await call(D.page, { action: 'radioRoomOpened', room: code2 }); await sleep(300);
    ok(p2 && p2.title === 'A ROOM JUST OPENED' && p2.body === `${code2} · 1 player` && opened().length === 1 && again.ok, `PUSH (CC-B): a guest opens ${code2} → "${p2 && p2.body}" (once — a second call sends nothing; ${got.length - 1 - opened().length} other rooms' pushes from other shards ignored)`);
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
