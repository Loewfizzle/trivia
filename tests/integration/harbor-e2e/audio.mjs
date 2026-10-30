// CITY 2.0 — THE HARBOR end to end: the `audio` cloud job's groups (music, flags, harbor, dock, tape) — tests/integration/harbor-jobs.mjs#CI_JOBS.
// Registered with G() in their original order; run through ../e2e-harbor.mjs (JOB=audio, or ONLY=<groups>). Shared helpers: ./kit.mjs.
// ADDING A GROUP: G('name', …) in its job's file (harbor-e2e/<job>.mjs) + the name in ../harbor-jobs.mjs (CI_JOBS).
import { OUT, BASE, SHOTS, t0, sleep, errors, ok, okT, GR, NIGHT, open, ev, waitFor, tapAt, tap, harborUp, G } from './kit.mjs';

G('flags', async () => {
  // ================================================================ 3. every title flag works with ?city=2
  { const X = await open({ slot: 'hf', qs: `when=2026-10-14T13:00${GR}&wx=rain&speed=60&force=demo&grid=1&debug=1` });
    await harborUp(X.page);
    await waitFor(X.page, "window.__district.harbor().events.some(e => e.id === 'demo')", 'the demo event', 10000).catch(() => {});
    const s = await ev(X.page, 'window.__district.scene()'), h2 = await ev(X.page, 'window.__district.harbor()');
    const sp = await ev(X.page, 'window.__district.neon().now');
    await sleep(1200);
    const sp2 = await ev(X.page, 'window.__district.neon().now');
    ok(s.rain > 0 && Math.abs(s.w.day - 1) < 0.5 && h2.events.some(e => e.id === 'demo') && sp2 - sp > 30000,
      `FLAGS: &when &tz &at (day), &wx=rain (rain ${s.rain}), &speed=60 (+${Math.round((sp2 - sp) / 1000)} s of clock in ~1.2 s), &force=demo (the demo event in lane ${h2.events.map(e => e.lanes).join()}), &grid=1, &debug=1 — no errors`);
    if (SHOTS) await X.page.screenshot({ path: `${OUT}flags-grid-390x844.png` });
    await X.ctx.close(); }

});
G('harbor', async () => {
  // ================================================================ 3e. Part 5: the harbor's hero pieces — the wheel, the lighthouse, the boats, the roof signs
  { const H = await open({ slot: 'h9', qs: `${NIGHT}&force=taxi` });
    await harborUp(H.page);
    await waitFor(H.page, '(() => { const n = window.__district.harbor().neon; return n.items > 20 && n.built >= n.items && !n.queued; })()', 'the neon built', 15000);
    await waitFor(H.page, "window.__district.harbor().boats.boats.some(b => b.on && b.id === 'taxi')", 'the taxi out', 10000).catch(() => {});
    await waitFor(H.page, 'window.__district.harbor().wheel.mb > 0', "the wheel's lazy sprites baked", 15000).catch(() => {});   // (C4d — F11: wheel.js sets mb at the END of its lazy bake)
    const h = await ev(H.page, 'window.__district.harbor()');
    const w = h.wheel;
    ok(w.legs[0] > w.head[0] && w.legs[1] < w.head[1] && w.r > 40 && w.mb > 0,
      `THE WHEEL ON ITS PIER: the A-frame's feet at ${Math.round(w.legs[0])} + ${Math.round(w.legs[1])} pt stand on the platform (${Math.round(w.head[0])}..${Math.round(w.head[1])}); r ${Math.round(w.r)} pt, its sprites ${w.mb} MB`);
    const on = h.boats.boats.filter(b => b.on).map(b => b.id);
    ok(on.includes('taxi') && !on.includes('sail') && !on.includes('sail2') && h.rate.fast !== '' && h.mem.layers.some(l => /harbor sprites/.test(l.name)) && h.mem.mb <= h.mem.budget,
      `THE BOATS AT NIGHT: ${on.join(', ')} on the water (no sailboats after dark); the taxi keeps 60 fps (${h.rate.fast}); memory ${h.mem.mb} of ${h.mem.budget} MB`);
    // the lighthouse: three quick taps spin the beam (Part 12's egg hook)
    const lx = h.lighthouse.x, ly = h.lighthouse.y + 40;
    const taps = [];
    for (let i = 0; i < 3; i++) taps.push(await ev(H.page, `window.__district.hit(${lx}, ${ly})`));
    const spin = await ev(H.page, 'window.__district.harbor().lighthouse');
    ok(taps.every(t => t && t.kind === 'lighthouse') && taps[2].spun && spin.spinning, `THE LIGHTHOUSE: tapped 3× → the beam spins (${taps.map(t => t && t.kind).join(', ')})`);
    // the roof signs' frames carry the word towers' beacons; the wheel's colour hook
    const rs = h.neon.signs.filter(s => /^n-roof[AB]$/.test(s.id));
    const bc = rs.map(s => h.beacons.find(b => Math.abs(b.x - (s.rect.x + s.rect.w / 2)) < 2 && b.y < s.rect.y && b.y > s.rect.y - 12));
    const sch = await ev(H.page, `window.__district.harbor().wheel.scheme('halloween')`);
    ok(rs.length === 2 && bc.every(Boolean) && rs.every(s => s.rect.y > h.cam.limitY) && sch === 'halloween',
      `ROOF SIGNS + HOOKS: ${rs.map(s => `${s.id} ${s.game}`).join(', ')} over the word towers, under the limit, their towers' beacons on top; the wheel's scheme hook → ${sch}`);
    if (SHOTS) await H.page.screenshot({ path: `${OUT}part5-harbor-390x844.png` });
    await H.ctx.close();
  }
});
G('dock', async () => {
  // ================================================================ 4. the dock: HOST, JOIN, the knock on the door
  const H = await open({ slot: 'hh', qs: NIGHT });
  await harborUp(H.page);
  await tap(H.page, '.nd-hostbtn');
  await waitFor(H.page, '!!window.__arcade.state.code && !!document.querySelector(".lobby-screen")', 'lobby after HOST', 20000);
  const code = await ev(H.page, 'window.__arcade.state.code');
  ok(!!code, `HOST (city 2): one tap opens room ${code}`);
  ok(/[?&]city=2(&|$)/.test(await ev(H.page, 'location.search')) && /room=/.test(await ev(H.page, 'location.search')), `THE FLAG IN THE URL: the room's address keeps city=2 (${await ev(H.page, 'location.search')})`);
  await H.page.reload();
  await waitFor(H.page, '!!window.__arcade && window.__arcade.state.code === ' + JSON.stringify(code), 'rejoin after a refresh', 20000);
  ok(/[?&]city=2(&|$)/.test(await ev(H.page, 'location.search')), 'THE FLAG IN THE URL: a refresh in the lobby rejoins and stays on city=2');
  const B = await open({ slot: 'hb', qs: NIGHT, view: [402, 874] });
  await harborUp(B.page);
  const door = await ev(B.page, 'window.__district.door()');
  const blocked = await ev(B.page, `(() => { const d = ${JSON.stringify(door.rect)}; return [...document.querySelectorAll('.nd-ringbtn, .nd-tab, .nd-bar, .menu-btn, .music-btn')].map(e => e.getBoundingClientRect()).filter(r => r.width && d.x < r.right && d.x + d.w > r.left && d.y < r.bottom && d.y + d.h > r.top).length; })()`);
  ok(door.rect.w >= 44 && door.rect.h >= 44 && !blocked, `THE DOOR: a ${Math.round(door.rect.w)}×${Math.round(door.rect.h)} pt tap target, clear of the dock and the corner buttons`);
  await tapAt(B.page, door.rect.x + door.rect.w / 2, door.rect.y + door.rect.h / 2);
  await waitFor(B.page, "document.querySelector('.nd-actions').classList.contains('is-join')", 'JOIN from the knock', 4000).catch(() => {});
  ok((await ev(B.page, "document.querySelector('.nd-actions').classList.contains('is-join')")) && (await ev(B.page, 'window.__district.street().people.knocks')) === 1, 'KNOCK (city 2): a tap on the speakeasy\'s door opens JOIN');
  await tap(B.page, '.nd-codebox'); await sleep(250);
  await B.page.keyboard.type(code.toLowerCase(), { delay: 90 });
  await waitFor(B.page, '!!window.__arcade.state.code', 'B joined', 20000);
  ok((await ev(B.page, 'window.__arcade.state.code')) === code, 'JOIN (city 2): typing the hush word joins the room');
  await H.ctx.close(); await B.ctx.close();
  // ---- 9g — THE DOCK FADE (the owner, DECIDED Oct 28): 10 s on a device's FIRST visit (it never went through the door), 5 s on every
  // visit after; the dock rests 5 s after the last touch on a returning device (&idle=1: the local runs' own switch)
  { const blockSeen = { fn: () => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'nd:entered') return; return o.call(this, k, v); }; }, arg: null };
    const F = await open({ slot: 'df1', qs: `${NIGHT}&idle=1`, view: [402, 874], init: blockSeen });
    const R = await open({ slot: 'df2', qs: `${NIGHT}&idle=1`, view: [402, 874] });
    await Promise.all([harborUp(F.page), harborUp(R.page)]);
    const fm = await ev(F.page, 'window.__district.idleMs()'), rm = await ev(R.page, 'window.__district.idleMs()');
    await tapAt(R.page, 200, 300); await sleep(3800);
    const at4 = await ev(R.page, 'window.__district.isIdle()');
    await waitFor(R.page, 'window.__district.isIdle()', 'the returning device at rest', 4000).catch(() => {});
    const at6 = await ev(R.page, 'window.__district.isIdle()');
    ok(fm === 10000 && rm === 5000 && !at4 && at6, `9g THE DOCK FADE: a first visit ${fm / 1000} s, a returning device ${rm / 1000} s (up at 3.8 s: ${!at4}, at rest by ~5 s: ${at6})`);
    await F.ctx.close(); await R.ctx.close(); }
});
// ================================================================ CITY 2.0 MUSIC (the owner's mood songs, the MUSIC MOOD setting; docs/audio.md#city-20-music)
G('music', async () => {
  const songs = await (await fetch(`${BASE}/data/mood-music.json`)).json();
  const deck = m => songs.city2.moods[m];
  const NOW = `(() => { const d = window.__arcade.musicDebug(); return d.list === 'mood' && d.playing ? String(d.playing).replace(/^m:/, '') : null; })()`;
  const unlock = p => tapAt(p, 30, 300);
  const start = async p => { await unlock(p); await waitFor(p, NOW, 'a mood song playing', 25000); return ev(p, NOW); };
  const setMood = (p, v) => ev(p, `import('/js/audio/settings.js').then(m => m.updateSettings({ musicMood: '${v}' }))`);
  const voices = p => ev(p, 'window.__arcade.musicDebug().voices.filter(v => v.gain > 0.03).length');
  const changed = (p, from, what, ms = 20000) => waitFor(p, `(() => { const id = ${NOW}; return !!id && id !== '${from}'; })()`, what, ms);

  // ---- 1. the five preview links: the mood follows the city's own clock, the song comes from that mood's City 2.0 deck
  for (const [when, mood] of [['2026-10-23T08:00', 'morning'], ['2026-10-23T13:00', 'day'], ['2026-10-23T19:30', 'evening'], ['2026-10-22T23:45', 'late'], ['2026-10-24T23:00', 'party']]) {
    const P = await open({ slot: 'mu', qs: `when=${when}${GR}&debug=1`, view: [402, 874] });
    const m = await ev(P.page, 'window.__arcade.mood()');
    const id = await start(P.page);
    ok(m === mood && deck(mood).includes(id), `MUSIC ${when} → ${mood}: plays ${id} from City 2.0's ${mood} deck (${deck(mood).length} songs)`);
    ok(!songs.moods[mood].includes(id) && songs.songs[id].c2,`MUSIC ${mood}: not one of City 1.0's songs (${id})`);
    // (7a §0 — THE MUSIC'S FIRST TAP: the sign answered the music's start — a surge through the daytime glass, a race through the lit tubes)
    { await waitFor(P.page, '!!window.__district.surge().last', 'the sign answers the music', 4000).catch(() => {});
      const sg = await ev(P.page, 'window.__district.surge()');
      // (8a: from the sign's real state — unlit: 'surge', lit: 'first', the warm-up window: 'catch')
      const want = mood === 'day' ? ['surge'] : mood === 'late' || mood === 'party' ? ['first'] : ['surge', 'first', 'catch'];
      ok(sg && sg.last && sg.last.why === 'music' && want.includes(sg.last.did), `FIRST TAP ${mood}: the music started → the NEON sign answered (${sg && sg.last ? sg.last.did : 'nothing'})`); }
    await sleep(1500);
    const b = await ev(P.page, 'window.__arcade.beat()'), line = await ev(P.page, 'window.__district.harbor().music');
    const s = songs.songs[id];
    ok(b && b.id === id && ((s.grid.trusted === false && b.untrusted && !b.grid) || (s.grid.trusted !== false && b.grid && Math.abs(b.grid.bpm - s.grid.bpm) < 0.01)), `MUSIC ${mood}: the beat follows ${id}'s ${s.grid.trusted === false ? 'kicks (grid not trusted)' : `grid (${s.grid.bpm} bpm)`}`);
    ok(/music/i.test(line) && line.includes(id), `MUSIC ${mood}: the readout names it ("${line}")`);
    if (mood === 'party') { const sl = await ev(P.page, 'window.__district.harbor().sync'); ok(/^sync out \d+ ms.* · lead [+−-]?\d+( → [+−-]?\d+)? ms \([^)]*\) · lag \d+ ms · (bt|wired|unknown)( · not saved \(after [^)]+\))?$/.test(sl || ''), `SYNC: the readout says what the beat subtracts + the output (NIGHT-A2) ("${sl}")`); }
    if (SHOTS && mood === 'party') await P.page.screenshot({ path: `${OUT}music-party-402x874.png` });
    await P.ctx.close();
  }

  // ---- 2. MUSIC MOOD (the setting): a forced change is a ~4 s crossfade into the new mood's deck, AUTO goes back without a cut
  { const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00${GR}`, view: [402, 874] });
    const first = await start(P.page);
    ok(deck('day').includes(first), `SETTING: AUTO at 1 pm plays DAY (${first})`);
    await setMood(P.page, 'late');
    let peak = 0; const t0 = Date.now();
    while (Date.now() - t0 < 14000) { peak = Math.max(peak, await voices(P.page)); const id = await ev(P.page, NOW); if (id && id !== first && peak >= 2 && (await voices(P.page)) === 1) break; await sleep(150); }
    const now = await ev(P.page, NOW);
    ok(now && now !== first && deck('late').includes(now), `SETTING: LATE NIGHT crossfades to ${now} (late deck) without waiting for the song to end`);
    ok(peak >= 2, `SETTING: it is a crossfade — two voices sounding at once (${peak}), never a cut`);
    ok(await ev(P.page, `JSON.parse(localStorage.getItem('na:settings')).musicMood === 'late'`), 'SETTING: saved on this device');
    await setMood(P.page, 'auto');
    await changed(P.page, now, 'AUTO again');
    ok(deck('day').includes(await ev(P.page, NOW)), 'SETTING: AUTO again — back to the time of day (a crossfade into the DAY deck)');
    // the settings sheet row
    await ev(P.page, `document.querySelector('button.gear').click()`);
    await waitFor(P.page, `document.querySelectorAll('.set-mood-seg .seg-btn').length === 6`, 'the MUSIC MOOD row', 5000);
    const labels = await ev(P.page, `[...document.querySelectorAll('.set-mood-seg .seg-btn')].map(b => b.textContent)`);
    ok(labels.join(',') === 'AUTO,MORNING,DAY,EVENING,LATE NIGHT,PARTY', `SETTING: the row reads ${labels.join(' · ')}`);
    if (SHOTS) for (const [w, h] of [[390, 844], [412, 915], [1440, 900]]) { await P.page.setViewport({ width: w, height: h, deviceScaleFactor: w < 1000 ? 2 : 1, isMobile: w < 1000, hasTouch: w < 1000 }); await sleep(500); await P.page.screenshot({ path: `${OUT}music-setting-${w}x${h}.png` }); }
    await P.ctx.close(); }

  // ---- 3. a natural change waits for the song; a link's &mood= plays that mood; the party starting is forced
  { const P = await open({ slot: 'mu', qs: `when=2026-10-22T10:59:00&speed=20${GR}`, view: [402, 874] });
    const first = await start(P.page);
    await waitFor(P.page, `window.__arcade.mood() === 'day'`, 'the clock reaching 11 am', 12000);
    await sleep(2500);
    ok((await ev(P.page, NOW)) === first, `NATURAL CHANGE: MORNING → DAY at 11 am — ${first} plays on (never cut)`);
    await ev(P.page, 'window.__arcade.musicSeek(44)');
    await waitFor(P.page, `!!window.__arcade.musicDebug().next`, 'the next song chosen', 8000);
    const nx = String(await ev(P.page, 'window.__arcade.musicDebug().next')).replace(/^m:/, '');
    ok(deck('day').includes(nx) && nx !== first, `NATURAL CHANGE: the next song (${nx}) comes from the DAY deck`);
    await P.ctx.close(); }
  { const P = await open({ slot: 'mu', qs: `when=2026-10-23T20:28:30&speed=20${GR}`, view: [402, 874] });
    const first = await start(P.page);
    ok(deck('evening').includes(first), `PARTY START: evening plays ${first}`);
    await waitFor(P.page, `window.__arcade.mood() === 'party'`, 'the party starting (FP2: 8:30 pm)', 15000);
    await changed(P.page, first, 'the forced switch');
    const now = await ev(P.page, NOW);
    ok(deck('party').includes(now), `PARTY START: 8:30 pm (FP2) switches at once to the PARTY deck (${now}) — the evening song did not have to end`);
    await P.ctx.close(); }
  { const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00&mood=late${GR}`, view: [402, 874] });
    const id = await start(P.page);
    ok(deck('late').includes(id), `LINK &mood=late at 1 pm plays the LATE NIGHT deck (${id})`);
    await P.ctx.close(); }

  // ---- 4. THE PREVIEW PANEL's MUSIC row: force a mood (the state), SKIP, the song + its grid status
  { const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00${GR}&panel=1`, view: [402, 874] });
    await waitFor(P.page, '!!window.__district.remote()', 'the panel', 10000);
    const first = await start(P.page);
    await ev(P.page, "window.__district.remote().setMine({ mood: 'party' })");
    await changed(P.page, first, 'the panel forces PARTY');
    const now = await ev(P.page, NOW);
    ok(deck('party').includes(now), `PANEL: MOOD = PARTY plays the party deck (${now}); the cue on ☰: ${await ev(P.page, "window.__district.remote().debug().cue")}`);
    await ev(P.page, 'window.__district.remote().open()');
    await waitFor(P.page, `[...document.querySelectorAll('.hr-h')].some(h => h.textContent === 'MUSIC')`, 'the MUSIC section', 5000);
    const btns = await ev(P.page, `[...[...document.querySelectorAll('.hr-sec')].find(s => s.querySelector('.hr-h').textContent === 'MUSIC').querySelectorAll('.hr-b')].map(b => b.textContent)`);
    ok(btns.join(',') === 'AUTO,MORNING,DAY,EVENING,LATE NIGHT,PARTY,SKIP TO THE NEXT SONG', `PANEL: the MUSIC row (${btns.join(' · ')})`);
    await waitFor(P.page, `document.querySelector('.hr-music') && /GRID/.test(document.querySelector('.hr-music').textContent)`, 'the song line', 5000);
    const txt = await ev(P.page, "document.querySelector('.hr-music').textContent");
    ok(txt.includes(now) && /PLAYING PARTY/.test(txt) && /GRID (TRUSTED|NOT TRUSTED|NONE)/.test(txt), `PANEL: shows the song + its grid status ("${txt}")`);
    if (SHOTS) { await ev(P.page, `window.__district.remote().openCats(['music'])`); await ev(P.page, `[...document.querySelectorAll('.hr-sec')].find(s => s.querySelector('.hr-h').textContent === 'MUSIC').scrollIntoView({ block: 'start' })`); await sleep(400); await P.page.screenshot({ path: `${OUT}music-panel-402x874.png` }); }
    await ev(P.page, `[...document.querySelectorAll('.hr-b')].find(b => b.textContent === 'SKIP TO THE NEXT SONG').click()`);
    await changed(P.page, now, 'SKIP');
    const after = await ev(P.page, NOW);
    ok(deck('party').includes(after), `PANEL: SKIP moves to the next party song (${now} → ${after})`);
    await ev(P.page, 'window.__district.remote().setMine({})');
    await changed(P.page, after, 'AUTO again');
    ok(deck('day').includes(await ev(P.page, NOW)), 'PANEL: clearing the mood goes back to the time of day (DAY)');
    await P.ctx.close(); }

  // ---- 5b. NIGHT-A — THE PANEL's PARTY PLAYS A PARTY SONG + THE PULSE LOCKS TO IT (the owner's test: "beat grid", no pulse with the
  // music): a MUSIC MOOD saved on the device (EVENING) used to win over the forced show — the party's lights then ran on a calm song
  { const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00${GR}&panel=1`, view: [402, 660] });
    await waitFor(P.page, '!!window.__district.remote()', 'the panel', 10000);
    await setMood(P.page, 'evening'); await unlock(P.page);
    await waitFor(P.page, `(${NOW}) && ${JSON.stringify(deck('evening'))}.includes(${NOW})`, 'an EVENING song (the saved setting)', 25000);
    const first = await ev(P.page, NOW);
    await ev(P.page, "window.__district.remote().setMine({ party: 'on' })");
    if (!deck('party').includes(first)) await changed(P.page, first, 'PARTY ON');
    const now = await ev(P.page, NOW);
    ok(deck('party').includes(now), `PANEL PARTY ON plays a PARTY song over a saved MUSIC MOOD (EVENING: ${first} → ${now})`);
    await waitFor(P.page, "window.__district.party().on > 0.9 && window.__district.party().src === 'grid'", 'the pulse on the song’s grid', 15000);
    const pk = []; for (let i = 0; i < 24; i++) { pk.push(await ev(P.page, 'window.__district.party().punch')); await new Promise(r => setTimeout(r, 90)); }
    okT(Math.max(...pk) - Math.min(...pk) > 0.25, `PANEL PARTY ON: the pulse beats on ${now}'s grid (punch ${Math.min(...pk).toFixed(2)} → ${Math.max(...pk).toFixed(2)}, src ${await ev(P.page, 'window.__district.party().src')})`);
    // NIGHT-A2 — A TRUSTED GRID ALWAYS PUNCHES (the owner: party9 breathed a whole song; party4 punched only after 24 kicks): the lights
    // punch from the song's first bar — half until the kicks confirm the lead, full once they do
    { const sf = await ev(P.page, 'window.__district.harbor().safety'), line = await ev(P.page, 'window.__district.harbor().safeLine');
      ok(sf && sf.mode === 'punch' && sf.punchAt != null && sf.punchAt <= 1 && sf.k > 0.5, `NIGHT-A2 A TRUSTED GRID PUNCHES FROM ITS FIRST BAR (${now}): ${line}`); }
    await ev(P.page, 'window.__district.remote().setMine({})'); await setMood(P.page, 'auto');
    await P.ctx.close(); }

  // ---- 6. THE MUSIC COMES BACK (the owner's iPhone: leaving Safari killed it; the music button didn't help; only a reload did)
  { const els = { fn: () => { window.__els = new Set(); const o = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__els.add(this); return o.call(this); }; } };
    const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00${GR}`, view: [402, 874], init: els });
    const p = P.page;
    const H = () => ev(p, 'window.__arcade.musicDebug().health');
    const cur = () => ev(p, `(() => { const d = window.__arcade.musicDebug(); const v = d.voices.find(x => x.id === d.playing); return { id: d.playing, t: v ? v.t : -1, paused: v ? v.paused : true, ctx: d.health.state }; })()`);
    const vis = v => ev(p, `(() => { Object.defineProperty(document, 'visibilityState', { value: '${v}', configurable: true }); Object.defineProperty(document, 'hidden', { value: ${v === 'hidden'}, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); })()`);
    const PLAYING = `(() => { const d = window.__arcade.musicDebug(); const v = d.voices.find(x => x.id === d.playing); return !!d.playing && d.health.sounding && (d.out === 'direct' || (!!v && !v.paused && d.health.state === 'running')); })()`;
    const playingOn = async (what, ms = 8000) => { try { await waitFor(p, PLAYING, what, ms); return true; } catch { return false; } };
    const first = await start(p);
    await sleep(2500);
    // a) leave the browser + come back (no tap): the same song goes on from where it was
    const a0 = await cur();
    await vis('hidden'); await sleep(1200);
    const hid = await cur();
    ok(hid.paused && hid.ctx === 'suspended', `RESUME: hidden — the song pauses + the context sleeps (${JSON.stringify(hid)})`);
    await vis('visible');
    ok(await playingOn('back on screen'), 'RESUME: back on screen — it plays again with no tap');
    const a1 = await cur();
    ok(a1.id === a0.id && Math.abs(a1.t - a0.t) < 4, `RESUME: the same song (${first}) from the same place (${a0.t} → ${a1.t} s)`);
    // b) iOS won't give the context back (resume refused, "interrupted"): ONE tap anywhere rebuilds it — the same song plays on
    await vis('hidden'); await sleep(400);
    await ev(p, `import('/js/audio/engine.js').then(e => e.simulateStuck('interrupted'))`);
    await vis('visible'); await sleep(1900);
    const sh = await H();
    ok(sh.stuck && !sh.sounding, `STUCK: back on screen, the context won't run (${sh.state}) — marked stuck, waiting for a tap`);
    const b0 = await cur();
    await tapAt(p, 30, 300);
    ok(await playingOn('one tap after a stuck context'), 'STUCK: one tap — a fresh context, the music plays again (no reload)');
    const b1 = await cur(), bh = await H();
    ok(bh.rebuilds === 1 && b1.id === b0.id && Math.abs(b1.t - b0.t) < 4, `STUCK: rebuilt once (${bh.why}); the same song ${b1.id} from ${b0.t} → ${b1.t} s`);
    await ev(p, `import('/js/audio/sfx.js').then(m => m.sfx('tap'))`);
    ok(!errors.some(e => /different audio context|InvalidAccessError/i.test(e)), 'STUCK: the effects follow the new context (no cross-context errors)');
    // c) stuck again — this time the tap is ON THE MUSIC BUTTON: it must end with music playing, never switch the music off
    await vis('hidden'); await sleep(400);
    await ev(p, `import('/js/audio/engine.js').then(e => e.simulateStuck('suspended'))`);
    await vis('visible'); await sleep(1900);
    const mb = await ev(p, `(() => { const r = document.querySelector('.music-btn').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
    await tapAt(p, mb[0], mb[1]);
    ok(await playingOn('the music button after a stuck context'), 'MUSIC BUTTON: one tap on it brings the music back');
    ok(await ev(p, `!JSON.parse(localStorage.getItem('na:settings') || '{}').musicOff`), 'MUSIC BUTTON: that tap meant "play" — the music is still ON (not switched off)');
    await sleep(1700);        // (a second tap within 1.5 s of a rescue is part of the same "play")
    await tapAt(p, mb[0], mb[1]); await sleep(300);
    ok(await ev(p, `JSON.parse(localStorage.getItem('na:settings') || '{}').musicOff === true`), 'MUSIC BUTTON: with the music playing, a tap switches it off as before');
    await tapAt(p, mb[0], mb[1]);
    ok(await playingOn('music on again') && await ev(p, `!JSON.parse(localStorage.getItem('na:settings')).musicOff`), 'MUSIC BUTTON: and on again — playing');
    // d) the connection dropped while the phone slept (the element errors): reloaded from its place, never marked "missing"
    const d0 = await cur();
    await ev(p, `(() => { const d = window.__arcade.musicDebug(); const f = String(d.playing).replace(/^m:/, ''); const el = [...window.__els].find(a => a.src.includes(f)); el.dispatchEvent(new Event('error')); })()`);
    await waitFor(p, `/error/.test(window.__arcade.musicDebug().health.last)`, 'the reload after the error', 6000);
    ok(true, 'NETWORK: the error is seen as "reload", not "missing"');
    ok(await playingOn('reloaded after a network error', 9000), 'NETWORK: reloaded + playing again');
    const d1 = await cur(), st = await ev(p, 'window.__arcade.musicDebug().status');
    ok(d1.id === d0.id && st[d0.id] !== 'missing' && Math.abs(d1.t - d0.t) < 6, `NETWORK: the same song (${d0.t} → ${d1.t} s), not marked missing (${st[d0.id]})`);
    // e) the OS pauses the element behind our back (a call, Siri, another app's audio) while we're on screen: the watchdog restarts it
    await ev(p, '[...window.__els].forEach(a => a.pause())');
    ok(await playingOn('the watchdog after an OS pause', 5000), 'OS PAUSE: restarted with no tap');
    // f) the back-forward cache: pagehide → pageshow (no visibilitychange)
    await ev(p, `window.dispatchEvent(new Event('pagehide'))`); await sleep(600);
    const fh = await cur();
    await ev(p, `window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))`);
    ok(fh.paused && await playingOn('after a bfcache restore'), 'BFCACHE: pagehide pauses, pageshow plays again');
    // g) the voice "plays" but nothing comes out (WebKit after the lock screen): seen by the probe, the next tap makes new voices
    const g0 = await cur();
    await ev(p, `import('/js/audio/music.js').then(m => m.musicSimulateDead())`);
    await waitFor(p, 'window.__arcade.musicDebug().health.dead', 'the dead voice seen', 9000);
    await tapAt(p, 30, 300);
    ok(await playingOn('new voices after a dead one'), 'DEAD VOICE: seen by the probe; one tap — new voices, playing');
    const g1 = await cur(), gh = await H();
    ok(g1.id === g0.id && !gh.dead && /new voices/.test(gh.last), `DEAD VOICE: the same song goes on (${g0.id}, ${g0.t} → ${g1.t} s; ${gh.last})`);
    await P.ctx.close(); }

  // ---- 7. iOS's GESTURE RULE, emulated (the owner's iPhone: "the music still doesn't come back, even when I tap"). Chrome here lets
  // anything play; Safari only lets a media element / an AudioContext START inside touchend / click / keydown (a touch's pointerdown is
  // NOT a gesture there). This page refuses play() and resume() outside those — the engine must still bring the music back in ONE tap.
  { const iosRule = { fn: () => {
      let g = 0;
      const gesture = e => { if ((e.type === 'pointerdown' || e.type === 'mousedown') && e.pointerType !== 'mouse' && e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return; if (e.type === 'pointerdown' && e.pointerType !== 'mouse') return; g++; setTimeout(() => { g--; }, 0); };
      for (const t of ['touchend', 'click', 'keydown', 'pointerdown']) window.addEventListener(t, gesture, { capture: true });
      const okEl = new WeakSet(), okCtx = new WeakSet();
      window.__iosRefused = 0;
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        if (g > 0) okEl.add(this);
        if (!okEl.has(this)) { window.__iosRefused++; return Promise.reject(new DOMException('not in a gesture (emulated iOS)', 'NotAllowedError')); }
        return play.call(this);
      };
      const AC = window.AudioContext, resume = AC.prototype.resume;
      AC.prototype.resume = function () { if (g > 0) okCtx.add(this); return okCtx.has(this) ? resume.call(this) : new Promise(() => {}); };
      window.AudioContext = class extends AC { constructor(o) { super(o); if (g > 0) okCtx.add(this); else AC.prototype.suspend.call(this); } };
    } };
    const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00${GR}&debug=1`, view: [402, 874], init: iosRule });
    const p = P.page;
    const vis = v => ev(p, `(() => { Object.defineProperty(document, 'visibilityState', { value: '${v}', configurable: true }); Object.defineProperty(document, 'hidden', { value: ${v === 'hidden'}, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); })()`);
    const PLAYING = `(() => { const d = window.__arcade.musicDebug(); const v = d.voices.find(x => x.id === d.playing); return !!d.playing && d.health.sounding && (d.out === 'direct' || (!!v && !v.paused && d.health.state === 'running')); })()`;
    const playingOn = async (what, ms = 6000) => { try { await waitFor(p, PLAYING, what, ms); return true; } catch { return false; } };
    await tapAt(p, 30, 300);
    ok(await playingOn('iOS rule: the first tap'), 'iOS RULE: the FIRST tap starts the music (play() + resume() only count inside touchend / click)');
    // stuck after leaving Safari + ONE tap anywhere
    await vis('hidden'); await sleep(400);
    await ev(p, `import('/js/audio/engine.js').then(e => e.simulateStuck('interrupted'))`);
    await vis('visible'); await sleep(1900);
    await tapAt(p, 30, 300);
    ok(await playingOn('iOS rule: one tap after a stuck context'), `iOS RULE: stuck after leaving Safari — ONE tap brings it back (${JSON.stringify(await ev(p, 'window.__arcade.musicDebug().health'))})`);
    // stuck + the tap is on the MUSIC BUTTON: music, never a silent "MUSIC ON"
    await vis('hidden'); await sleep(400);
    await ev(p, `import('/js/audio/engine.js').then(e => e.simulateStuck('interrupted'))`);
    await vis('visible'); await sleep(1900);
    const mb = await ev(p, `(() => { const r = document.querySelector('.music-btn').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
    ok(await ev(p, `!!document.elementFromPoint(${mb[0]}, ${mb[1]}).closest('.music-btn')`), 'iOS RULE: the tap lands on the music button itself (the AUDIO block keeps clear of it)');
    await tapAt(p, mb[0], mb[1]);
    ok(await playingOn('iOS rule: the music button') && await ev(p, `!JSON.parse(localStorage.getItem('na:settings') || '{}').musicOff`), 'iOS RULE: stuck — one tap on the MUSIC BUTTON plays (and leaves it ON)');
    // a FROZEN context: it says "running" but its clock has stopped (a WebKit bug after the background) — seen; ONE tap gives music
    // (M4: through the direct element if it is armed, else a rebuilt context), the tap rebuilds the context; a tap once the new one
    // has run for 2 s has the song on a voice through the graph (its fades, the kick listener). (§8 covers the no-tap case.)
    const f0 = await ev(p, 'window.__arcade.musicDebug().at');
    await ev(p, `import('/js/audio/engine.js').then(e => e.simulateFrozen())`);
    await waitFor(p, 'window.__arcade.musicDebug().health.frozen', 'the frozen clock seen', 6000).catch(() => {});
    const fz = await ev(p, 'window.__arcade.musicDebug().health');
    ok(fz.frozen, `FROZEN: a "running" context whose clock stopped is seen (${fz.state}, frozen ${fz.frozen})`);
    await tapAt(p, 30, 300);
    ok(await playingOn('iOS rule: one tap after a frozen clock', 3000), `FROZEN: one tap — music (${JSON.stringify(await ev(p, '(() => { const d = window.__arcade.musicDebug(); return { out: d.out, at: d.at, rebuilds: d.health.rebuilds, last: d.health.last }; })()'))}, was at ${f0} s)`);
    // (this context was itself born of a rebuild seconds ago: the tap makes NO third one within 20 s — the loop her readout showed — the
    // direct element carries the music meanwhile; §8 has the way back onto a voice once a context's clock runs)
    const fr = await ev(p, 'window.__arcade.musicDebug().health.rebuilds');
    await sleep(1500); await tapAt(p, 30, 300); await sleep(600);
    const fh = await ev(p, '(() => { const d = window.__arcade.musicDebug(); return { out: d.out, rebuilds: d.health.rebuilds, sounding: d.health.sounding, last: d.health.last }; })()');
    ok(fh.rebuilds === fr && fh.out === 'direct' && fh.sounding, `FROZEN: a rebuilt context that froze is not rebuilt again within 20 s (rebuilds ${fr} → ${fh.rebuilds}); the direct element plays on (${fh.out}, sounding ${fh.sounding})`);
    // the readout's AUDIO block (&debug=1): states + the last events, so one screenshot after the bug says where it died
    await sleep(700);
    const diag = await ev(p, `(() => { const d = document.querySelector('.dbg-s[data-id=audio]'); return d ? d.textContent : ''; })()`);
    ok(/ctx running/.test(diag) && /el .*playing/.test(diag) && /touchend|click/.test(diag) && /rebuild/.test(diag), `DIAGNOSTIC: the AUDIO block shows the context, the element + the events ("${diag.slice(0, 160)}…")`);
    if (SHOTS) await p.screenshot({ path: `${OUT}music-diag-402x874.png` });
    await P.ctx.close(); }

  // ---- 8. THE EVIDENCE (M4 — the owner's iPhone, Oct 23, after leaving the app and coming back): every NEW AudioContext, made inside a
  // real touchend, says 'running' (resume ok) and its clock NEVER moves (0.00), the song element plays on (its clock advancing), the
  // probe hears nothing — six rebuilds, none ever started. Emulated on §7's gesture rule: once __deadGraph is on, every new context's
  // clock reads 0 for ever (the real one runs underneath); navigator.audioSession is given (iOS 17+). Expected: the music through the
  // DIRECT element within ~2 s of coming back (one tap or none), ONE rebuild, no loop; the session type 'playback' with the music on,
  // 'ambient' off; back onto a voice once a context's clock really runs; the AUDIO panel saying all of it.
  { const evidence = { fn: () => {
      let g = 0;
      const gesture = e => { if (e.type === 'pointerdown' && e.pointerType !== 'mouse') return; g++; setTimeout(() => { g--; }, 0); };
      for (const t of ['touchend', 'click', 'keydown', 'pointerdown']) window.addEventListener(t, gesture, { capture: true });
      const okEl = new WeakSet(), okCtx = new WeakSet();
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        if (g > 0) okEl.add(this);
        if (!okEl.has(this)) return Promise.reject(new DOMException('not in a gesture (emulated iOS)', 'NotAllowedError'));
        return play.call(this);
      };
      const AC = window.AudioContext, resume = AC.prototype.resume;
      const realTime = Object.getOwnPropertyDescriptor(BaseAudioContext.prototype, 'currentTime').get;
      window.__deadGraph = false; window.__contexts = 0;
      AC.prototype.resume = function () { if (g > 0) okCtx.add(this); return okCtx.has(this) ? resume.call(this) : new Promise(() => {}); };
      window.AudioContext = class extends AC { constructor(o) {
        super(o); window.__contexts++;
        if (g > 0) okCtx.add(this); else AC.prototype.suspend.call(this);
        // the evidence: a context born while the session is dead renders nothing, ever — its clock stays at 0.00 (while 'running')
        if (window.__deadGraph) { const me = this; Object.defineProperty(this, 'currentTime', { get: () => (window.__deadGraph ? 0 : realTime.call(me)), configurable: true }); }
      } };
      const session = { type: 'auto', state: 'active', log: [], addEventListener() {} };
      Object.defineProperty(navigator, 'audioSession', { get: () => session, configurable: true });
      const t = Object.getOwnPropertyDescriptor(session, 'type');
      let type = 'auto';
      Object.defineProperty(session, 'type', { get: () => type, set: v => { type = v; session.log.push(v); }, configurable: true });
      void t;
    } };
    const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00${GR}&debug=1`, view: [402, 874], init: evidence });
    const p = P.page;
    const vis = v => ev(p, `(() => { Object.defineProperty(document, 'visibilityState', { value: '${v}', configurable: true }); Object.defineProperty(document, 'hidden', { value: ${v === 'hidden'}, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); })()`);
    const D = () => ev(p, `(() => { const d = window.__arcade.musicDebug(); return { id: d.playing, at: d.at, out: d.out, sounding: d.health.sounding, rebuilds: d.health.rebuilds, frozen: d.health.frozen, alive: d.health.alive, made: d.health.made, time: d.health.time, last: d.health.last, session: navigator.audioSession.type, set: d.health.sessionSet.type, contexts: window.__contexts }; })()`);
    const SOUND = `(() => { const d = window.__arcade.musicDebug(); return !!d.playing && d.health.sounding; })()`;
    await tapAt(p, 30, 300);
    await waitFor(p, SOUND, 'the first song', 25000);
    const e0 = await D();
    ok(e0.out === 'web' && e0.session === 'playback' && e0.set === 'playback', `EVIDENCE: music on, through the graph; the audio session asked for 'playback' before the context was made (session ${e0.session}, set ${e0.set})`);
    await sleep(2000);
    // leave: the old context's clock stops; the session is dead for every context made from now on
    const a0 = await D();
    await vis('hidden'); await sleep(400);
    await ev(p, `import('/js/audio/engine.js').then(e => e.simulateFrozen())`);
    await ev(p, 'window.__deadGraph = true');
    await vis('visible');
    // a tap (the owner's first tap, a moment after coming back): the old clock, seen stopped AT THE TAP → the direct element inside it;
    // the tap rebuilds the context; the new one never starts (its clock 0.00) — seen within a second, no second rebuild
    await sleep(800); await tapAt(p, 30, 300);
    const t0 = Date.now();
    ok(await waitFor(p, `${SOUND} && window.__arcade.musicDebug().out === 'direct'`, 'the direct element', 4000).catch(() => false), `EVIDENCE: back + one tap — the music sounds through the DIRECT element within ${((Date.now() - t0) / 1000).toFixed(1)} s (${JSON.stringify(await D())})`);
    const a1 = await D();
    ok(a1.id === a0.id && Math.abs(a1.at - a0.at) < 5, `EVIDENCE: the same song (${a0.id}) from its place (${a0.at} → ${a1.at} s)`);
    await waitFor(p, 'window.__arcade.musicDebug().health.frozen && window.__arcade.musicDebug().health.rebuilds >= 1', 'the rebuilt context seen frozen', 4000).catch(() => {});
    const a2 = await D();
    ok(a2.rebuilds === 1 && a2.frozen && a2.time === 0, `EVIDENCE: the tap rebuilt ONCE; the new context never started (t ${a2.time}, frozen ${a2.frozen}) — seen within a second, not 1.5 s`);
    // a second tap 2 s later (the owner's, 8 s later): NO new context — the direct element keeps playing
    await sleep(2000); await tapAt(p, 30, 300); await sleep(800);
    const a3 = await D();
    ok(a3.rebuilds === 1 && a3.out === 'direct' && a3.sounding && a3.at > a1.at, `EVIDENCE: a second tap makes no third context (rebuilds ${a3.rebuilds}, contexts made ${a3.contexts}); still sounding, direct, the song advancing (${a1.at} → ${a3.at} s)`);
    ok(a3.alive <= 2, `EVIDENCE: the old contexts are closed (alive ${a3.alive}, made ${a3.made})`);
    // the panel says it
    const diag = await ev(p, `(() => { const d = document.querySelector('.dbg-s[data-id=audio]'); return d ? d.textContent : ''; })()`);
    ok(/out DIRECT ELEMENT/.test(diag) && /alive \d/.test(diag) && /set playback at/.test(diag) && /FROZEN/.test(diag), `PANEL: the AUDIO block shows the output path, the contexts alive, the session type set + the frozen clock ("${diag.slice(0, 200)}…")`);
    // the music button on the direct path: OFF mutes it (+ the session goes 'ambient'); ON again plays (+ 'playback')
    const mb = await ev(p, `(() => { const r = document.querySelector('.music-btn').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
    await sleep(1600);        // (a tap within 1.5 s of a rescue is part of the same "play")
    await tapAt(p, mb[0], mb[1]); await sleep(500);
    const off = await ev(p, `import('/js/audio/music.js').then(m => ({ off: JSON.parse(localStorage.getItem('na:settings') || '{}').musicOff, gain: m.musicDiag().el.gain, session: navigator.audioSession.type }))`);
    ok(off.off === true && off.gain === 0 && off.session === 'ambient', `MUSIC BUTTON on the direct path: OFF (${off.off}, the element muted: gain ${off.gain}) — the session back to 'ambient' (${off.session})`);
    await tapAt(p, mb[0], mb[1]);
    ok(await waitFor(p, `${SOUND} && !JSON.parse(localStorage.getItem('na:settings')).musicOff && navigator.audioSession.type === 'playback'`, 'music on again', 4000).catch(() => false), `MUSIC BUTTON on the direct path: ON again — sounding, 'playback' (${JSON.stringify(await D())})`);
    // the session comes back (the direct element's playback re-activated it): the rebuilt context's clock starts moving → back onto a voice at a tap
    await ev(p, 'window.__deadGraph = false');
    await waitFor(p, 'window.__arcade.musicDebug().health.ok', 'the graph seen running for 2 s', 6000).catch(() => {});
    const b0 = await D();
    await tapAt(p, 30, 300);
    ok(await waitFor(p, `${SOUND} && window.__arcade.musicDebug().out === 'web'`, 'back to web audio', 5000).catch(() => false), `RECOVERY: the clock moving again for 2 s + one tap — the song back on a voice through the graph (${JSON.stringify(await D())})`);
    const b1 = await D();
    ok(b1.id === b0.id && Math.abs(b1.at - b0.at) < 4 && b1.rebuilds === 1, `RECOVERY: the same song from its place (${b0.at} → ${b1.at} s), no extra context`);
    if (SHOTS) await p.screenshot({ path: `${OUT}music-evidence-402x874.png` });
    await P.ctx.close();

  // ---- 9. 7a — THE BEAT IN DIRECT MODE (the owner, iPhone: back from the home screen the music plays on the direct element, but the
  // city's lights no longer pulse). §8's dead graph on a PARTY NIGHT, plus what a frozen graph's analyser really does: it keeps its LAST
  // window (the music that was playing when it froze) — a steady RMS the kick listener read as "live, no kicks" = a breakdown, calm.
  // Expected: with no tap (the direct element takes over by itself) and after a tap (the rebuilt context, dead too) the beat follows the
  // song's GRID on the direct element's clock ('direct-grid'), punching as hard as before; an untrusted song a gentle pulse ('tempo').
    const stale = { fn: () => {
      const AN = AnalyserNode.prototype, gf = AN.getFloatTimeDomainData, last = new WeakMap();
      AN.getFloatTimeDomainData = function (a) { const s = last.get(this); if (window.__deadGraph && s) { a.set(s); return; } gf.call(this, a); if (!window.__deadGraph) last.set(this, Float32Array.from(a)); };
    } };
    const Q = await open({ slot: 'mu', qs: `when=2026-10-24T23:00${GR}&debug=1`, view: [402, 874], init: { fn: new Function(`(${evidence.fn})(); (${stale.fn})();`) } });
    const q = Q.page;
    const PUNCH = ms => ev(q, `new Promise(res => { let lo = 9, hi = 0; const t0 = performance.now(); const tick = () => { const v = window.__district.party().punch; lo = Math.min(lo, v); hi = Math.max(hi, v); if (performance.now() - t0 < ${ms}) requestAnimationFrame(tick); else res({ lo: +lo.toFixed(3), hi: +hi.toFixed(3), src: window.__district.party().src, level: window.__district.party().level, live: window.__district.party().live, line: window.__district.harbor().beatLine, out: window.__arcade.musicDebug().out }); }; requestAnimationFrame(tick); })`);
    const qvis = v => ev(q, `(() => { Object.defineProperty(document, 'visibilityState', { value: '${v}', configurable: true }); Object.defineProperty(document, 'hidden', { value: ${v === 'hidden'}, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); })()`);
    // THE PANEL'S ONE STATUS (the owner: its header said "sounding" over a row saying "sounding NO · locked (no tap yet)"): the header
    // and the want row print the same verdict — before the first tap LOCKED, after it sounding
    const PANEL = () => ev(q, `(() => { const h = document.querySelector('.dbg-s[data-id=audio] .dbg-h'), w = [...document.querySelectorAll('.dbg-s[data-id=audio] .dbg-b div')].find(d => d.textContent.startsWith('want ')); return { h: h ? h.textContent : '', w: w ? w.textContent : '' }; })()`);
    await waitFor(q, `!!document.querySelector('.dbg-s[data-id=audio] .dbg-h')`, 'the AUDIO panel', 8000).catch(() => {});
    await sleep(600);
    const pn0 = await PANEL();
    ok(/LOCKED \(no tap yet\)/.test(pn0.h) && /LOCKED \(no tap yet\)/.test(pn0.w) && !/sounding/.test(pn0.h + pn0.w), `PANEL before a tap: the header + the want row agree — LOCKED ("${pn0.h.replace(/ · \d\d:\d\d:\d\d$/, '')}" / "${pn0.w}")`);
    await tapAt(q, 30, 300);
    await waitFor(q, `(() => { const d = window.__arcade.musicDebug(); return !!d.playing && d.health.sounding; })()`, 'the party song', 25000);
    await waitFor(q, 'window.__district.party().on > 0.5', 'the party on', 25000);
    // whichever song the deck dealt: trusted for this part (the grid), untrusted below (the tempo)
    const sid = await ev(q, NOW);
    const sg = songs.songs[sid].grid;
    await ev(q, `import('/js/audio/mood.js').then(m => { const g = m.moodData().songs['${sid}'].grid; delete g.trusted; g.agree = 0.9; })`);
    await sleep(600);
    const pn1 = await PANEL();
    ok(/ sounding · ctx/.test(pn1.h) && / · sounding · heals/.test(pn1.w), `PANEL playing: the header + the want row both say sounding ("${pn1.h.replace(/ · \d\d:\d\d:\d\d$/, '')}" / "${pn1.w}")`);
    const before = await PUNCH(2600);
    ok(before.out === 'web' && before.src === 'grid' && before.hi - before.lo > 0.3, `DIRECT BEAT: before leaving, through the graph — '${before.src}', the punch ${before.lo} → ${before.hi} (${sid}, "${before.line}")`);
    await qvis('hidden'); await sleep(400);
    await ev(q, `import('/js/audio/engine.js').then(e => e.simulateFrozen())`);
    await ev(q, 'window.__deadGraph = true');
    await qvis('visible');
    // no tap: the direct element takes the song by itself (armed in the first tap); the old context's analyser repeats its last window
    ok(await waitFor(q, `window.__arcade.musicDebug().out === 'direct' && window.__arcade.musicDebug().health.sounding`, 'the direct element (no tap)', 6000).catch(() => false), 'DIRECT BEAT: back, no tap — the song on the direct element');
    await sleep(2500);    // (past the listener's 2 s "live" window: the stale analyser would have calmed it by now)
    const d1 = await PUNCH(2600);
    ok(d1.src === 'direct-grid' && d1.hi - d1.lo > 0.3 && !d1.live, `DIRECT BEAT (no tap): '${d1.src}', (8b1's safety rule: the direct path can't confirm its offset, so it BREATHES — still visible) ${d1.lo} → ${d1.hi} (before ${before.hi}), level ${d1.level}, the dead listener ignored (live ${d1.live})`);
    ok(/^beat direct-grid \d+\.\d · bar \d+ · [1-4]\/4 · drift [+−]\d+ ms · pulse \d\.\d\d$/.test(d1.line || ''), `READOUT: the beat line says direct-grid ("${d1.line}")`);
    const pn2 = await PANEL();
    ok(/ sounding DIRECT · ctx/.test(pn2.h) && / · sounding DIRECT · heals/.test(pn2.w), `PANEL on the direct element: the header + the want row both say sounding DIRECT ("${pn2.h.replace(/ · \d\d:\d\d:\d\d$/, '')}" / "${pn2.w}")`);
    // a tap: the context rebuilt (dead too — its clock 0.00); still the grid on the direct element
    await tapAt(q, 30, 300);
    await waitFor(q, 'window.__arcade.musicDebug().health.rebuilds >= 1 && window.__arcade.musicDebug().health.frozen', 'the rebuilt context seen frozen', 4000).catch(() => {});
    await sleep(2500);
    const d2 = await PUNCH(2600);
    ok(d2.out === 'direct' && d2.src === 'direct-grid' && d2.hi - d2.lo > 0.3, `DIRECT BEAT (after a tap, the rebuilt context dead too): '${d2.src}', the punch ${d2.lo} → ${d2.hi}`);
    // the bars land where the grid says on the direct element's clock (beat 0 mod 4 = a downbeat)
    const ph = await ev(q, `(() => { const b = window.__arcade.beat(), p = window.__district.party(); const g = b.grid; const k = (b.pos - (g.t0 || 0)) * g.bpm / 60 - (g.down || 0); let d = ((k - p.beatsF) % 4 + 4) % 4; return { d: Math.min(d, 4 - d), direct: b.direct }; })()`);
    ok(ph.direct && ph.d < 0.15, `DIRECT BEAT: on the grid's bars on the direct element's clock (${ph.d.toFixed(3)} beats off)`);
    // an untrusted song (party3's kind) on the direct element: a gentle steady pulse at its tempo
    await ev(q, `import('/js/audio/mood.js').then(m => { m.moodData().songs['${sid}'].grid.trusted = false; })`);
    await sleep(1500);
    const d3 = await PUNCH(3000);
    const bpmNow = await ev(q, 'window.__district.party().bpm');
    ok(d3.src === 'tempo' && Math.abs(bpmNow - songs.songs[sid].bpm) < 0.5 && d3.hi - d3.lo > 0.3 && d3.hi < d2.hi, `DIRECT BEAT (untrusted grid): '${d3.src}' at ${bpmNow} bpm (the song's ${songs.songs[sid].bpm}), a gentler pulse ${d3.lo} → ${d3.hi} ("${d3.line}")`);
    void sg;
    if (SHOTS) await q.screenshot({ path: `${OUT}music-direct-beat-402x874.png` });
    await Q.ctx.close(); }

  // ---- 10. 8a — THE PULSE COMES BACK (the owner's iPhone after 7a: back from the home screen Web Audio recovered — the AUDIO panel
  // live — but the city's lights didn't pulse; the readout's beat line is drawn by the city's loop, so it froze with it). The loop had
  // one way back (a visibilitychange to 'visible' while it thought it was stopped). Emulated here: WebKit dropping the pending rAF
  // across the suspension with the hidden event missed (the loop "running" with no frame coming), a return with no event at all, a
  // page restored with only a pageshow, and the plain return. Expected: the watchdog / the events restart it; the punch swings
  // again; the readout's pulse; the AUDIO panel's city row. + PULSE STRENGTH live through JUST ME.
  { const drop = { fn: () => {
      const raf = window.requestAnimationFrame.bind(window);
      window.__suspend = false;
      window.__raf = { ran: 0, dropped: 0 };
      window.requestAnimationFrame = cb => raf(ts => { if (!window.__suspend) { window.__raf.ran++; cb(ts); } else window.__raf.dropped++; });     // (suspended: the callback is dropped, never run)
    } };
    const R = await open({ slot: 'mu', qs: `when=2026-10-24T23:00${GR}&debug=1`, view: [402, 874], init: drop });
    const r = R.page;
    const PUNCH = ms => ev(r, `new Promise(res => { let lo = 9, hi = 0, n = 0, gap = 0, lt = 0; const t0 = performance.now(); const tick = () => { const tn = performance.now(); n++; if (lt) gap = Math.max(gap, tn - lt); lt = tn; const v = window.__district.party().punch; lo = Math.min(lo, v); hi = Math.max(hi, v); if (performance.now() - t0 < ${ms}) requestAnimationFrame(tick); else res({ lo: +lo.toFixed(3), hi: +hi.toFixed(3), n, gap: Math.round(gap), line: window.__district.harbor().beatLine, loop: window.__district.loop() }); }; requestAnimationFrame(tick); })`);
    const setVis = v => ev(r, `(() => { Object.defineProperty(document, 'visibilityState', { value: '${v}', configurable: true }); Object.defineProperty(document, 'hidden', { value: ${v === 'hidden'}, configurable: true }); })()`);
    // (headless Chrome here can sit seconds without serving a rAF once a page stopped drawing — a frame nudge after each return; an
    // iPhone runs rAF at the display's rate, and the city's own watchdog is what this section tests)
    const nudge = () => r.screenshot({ type: 'jpeg', quality: 10, clip: { x: 0, y: 0, width: 8, height: 8 } }).catch(() => {});
    const fire = async t => { await ev(r, t === 'pageshow' ? `window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))` : `document.dispatchEvent(new Event('visibilitychange'))`); await nudge(); };
    await tapAt(r, 30, 300);
    await waitFor(r, `(() => { const d = window.__arcade.musicDebug(); return !!d.playing && d.health.sounding; })()`, 'the party song', 25000);
    await waitFor(r, 'window.__district.party().on > 0.5', 'the party on', 25000);
    await sleep(800);
    const p0 = await PUNCH(2600);
    ok(p0.hi - p0.lo > 0.3 && / · pulse \d/.test(p0.line || ''), `RETURN: before leaving the punch swings ${p0.lo} → ${p0.hi}; the readout's beat line carries the pulse ("${p0.line}")`);
    // (a) the plain return: hidden → visible (the loop stops, the 'visible' event restarts it)
    await setVis('hidden'); await fire('vis'); await sleep(600);
    const l1 = await ev(r, 'window.__district.loop()');
    await setVis('visible'); await fire('vis'); await sleep(900);
    const p1 = await PUNCH(2600);
    ok(!l1.running && p1.loop.running && p1.loop.restarts >= 1, `RETURN (plain): stopped while hidden, restarted by 'visible' (${JSON.stringify(p1.loop)})`);
    okT(p1.loop.drawn > l1.drawn + 20, `RETURN (plain): drawing again after the return (${p1.loop.drawn - l1.drawn} frames)`);
    okT(p1.hi - p1.lo > 0.3, `RETURN (plain): the punch swings again ${p1.lo} → ${p1.hi}`);
    // THE BEAT-SYNC PASS — a return never costs a tier: the first seconds back are held out of the tiering (RETURN_GRACE), the frame window emptied
    { const ti = await ev(r, 'window.__district.tiering()');
      ok(ti.returns >= 1 && ti.hist.length === 1 && ti.hist[0] === ti.tier, `RETURN never costs a tier: still t${ti.tier} (${ti.hist.join('→')}; ${ti.returns} return(s) seen, the grace ${ti.holdMs} ms left)`); }
    // (b) iOS: the hidden event missed + the pending rAF dropped across the suspension — "running", no frame ever coming
    const d0 = (await ev(r, 'window.__district.loop()')).drawn;
    await ev(r, 'window.__suspend = true'); await sleep(2600);
    const l2 = await ev(r, 'window.__district.loop()');
    ok(l2.running && l2.drawn <= d0 + 2 && l2.stalls >= 1, `RETURN (rAF dropped): "running" yet not one frame drawn in 2.6 s (${d0} → ${l2.drawn}) — the old loop's dead end (start() saw running and did nothing); the watchdog saw it stall (${l2.stalls})`);
    await ev(r, 'window.__suspend = false'); await fire('vis');
    await sleep(900);
    const p2 = await PUNCH(2600);
    ok(p2.loop.running && p2.loop.drawn > l2.drawn + 20 && ['visible', 'watchdog'].includes(p2.loop.why) && p2.loop.stalls >= 2 && p2.hi - p2.lo > 0.3 && p2.hi > p0.hi * 0.7, `RETURN (rAF dropped): restarted (${JSON.stringify(p2.loop)} · rAF ${JSON.stringify(await ev(r, 'window.__raf'))} · suspend ${await ev(r, 'window.__suspend')} · ticks ${p2.n}, max gap ${p2.gap} ms), the punch swings again ${p2.lo} → ${p2.hi} (before ${p0.hi})`);
    // (b2) the same with NO event at all on return: the watchdog (once a second) finds it
    await ev(r, 'window.__suspend = true'); await sleep(2000); await ev(r, 'window.__suspend = false'); await nudge();
    ok(await waitFor(r, `window.__district.loop().ago < 300 && window.__district.loop().why === 'watchdog'`, 'the watchdog', 4500).catch(() => false), `RETURN (no event): the watchdog restarts it (${JSON.stringify(await ev(r, 'window.__district.loop()'))})`);
    // (c) a page restored with only a pageshow (no visibilitychange): hidden fired, the return didn't
    await setVis('hidden'); await fire('vis'); await sleep(500);
    await setVis('visible'); await fire('pageshow');
    ok(await waitFor(r, `window.__district.loop().running && window.__district.loop().ago < 300`, 'pageshow', 2000).catch(() => false), `RETURN (pageshow only): running again (${JSON.stringify(await ev(r, 'window.__district.loop()'))})`);
    const p3 = await PUNCH(2000);
    ok(p3.hi - p3.lo > 0.3, `RETURN (pageshow only): the punch ${p3.lo} → ${p3.hi}`);
    // the AUDIO panel (the DOM, live while the canvas froze) names the loop
    await sleep(600);
    const row = await ev(r, `(() => { const d = [...document.querySelectorAll('.dbg-s[data-id=audio] .dbg-b div')].find(x => x.textContent.startsWith('city ')); return d ? d.textContent : ''; })()`);
    ok(/^city running · last frame 0\.\d s ago · restarts \d+/.test(row), `PANEL: the AUDIO block shows the city's loop ("${row}")`);
    // PULSE STRENGTH, live (JUST ME's flag through the scene): 250 % punches clearly harder than 50 %, the cap holds
    const at = async v => { await ev(r, `window.__district.remote() && window.__district.remote().setMine(${v == null ? '{}' : `{ pulse: ${v} }`})`); await sleep(400); return PUNCH(2600); };
    const hasRemote = await waitFor(r, '!!window.__district.remote()', 'the panel', 8000).catch(() => false);
    if (hasRemote) {
      const lo = await at(50), hi = await at(250);
      const pl = await ev(r, 'window.__district.party().pulse');
      ok(hi.hi > lo.hi * 1.6 && hi.hi < 2.05 && pl === 2.5 && / ×2\.50/.test(hi.line || ''), `PULSE STRENGTH: 50 % peaks ${lo.hi}, 250 % ${hi.hi} (under the cap 2), the readout says ×2.50 ("${hi.line}")`);
      await at(null);
      ok((await ev(r, 'window.__district.party().pulse')) === 1.75, 'PULSE STRENGTH: cleared → the default 175 %');
    } else ok(false, 'PULSE STRENGTH: the preview panel module loaded');
    await R.ctx.close(); }

  // ---- 11. FP — THE SONG CLOCK (the owner, iPhone: after the home screen "the lights pulse to random beats"). The beat's position must
  // come from the SONG (the element's currentTime), re-anchored whenever the song and the frame clock can part: the element paused while
  // the context runs on, the context suspended while the element plays on, a seek. Expected after each: the lights' beat (party().beatsF)
  // on the element's grid position within a frame or two, the readout's beat line with the song's bar + `drift`, the clock line.
  { const F = await open({ slot: 'mu', qs: `when=2026-10-24T23:00${GR}&debug=1`, view: [402, 874] });
    const f = F.page;
    await tapAt(f, 30, 300);
    await waitFor(f, `(() => { const d = window.__arcade.musicDebug(); return !!d.playing && d.health.sounding; })()`, 'the party song', 25000);
    await waitFor(f, 'window.__district.party().on > 0.5', 'the party on', 25000);
    const fid = await ev(f, NOW);
    await ev(f, `import('/js/audio/mood.js').then(m => { const g = m.moodData().songs['${fid}'].grid; delete g.trusted; g.agree = 0.9; })`);
    // the lights vs the element, sampled inside a frame: the element's clock → the grid's beat; the lights' beats; the readout
    const PHASE = () => ev(f, `import('/js/audio/music.js').then(m => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => {
      const np = m.nowPlaying(), b = window.__arcade.beat(), p = window.__district.party(), hb = window.__district.harbor();
      if (!np || !b || !b.grid) return res(null);
      const g = b.grid, k = (b.pos - (g.t0 || 0)) * g.bpm / 60 - (g.down || 0);
      let d = ((k - p.beatsF) % 4 + 4) % 4; d = Math.min(d, 4 - d);
      res({ d: +d.toFixed(3), lag: +(np.at - b.pos).toFixed(3), src: p.src, line: hb.beatLine, clock: hb.clock });
    }))))`);
    await sleep(1500);
    const f0 = await PHASE();
    ok(f0 && f0.src === 'grid' && f0.d < 0.12 && f0.lag >= 0 && f0.lag < 0.5, `SONG CLOCK: playing — the lights on the element's grid (${f0 && f0.d} beats off; the element − heard ${f0 && f0.lag} s)`);
    ok(/ · bar \d+ · [1-4]\/4 · drift [+−]\d+ ms · pulse /.test((f0 && f0.line) || '') && /^clock el [+−]\d+ ms · anchors \d+/.test((f0 && f0.clock) || ''), `READOUT: the beat line has the song's bar + drift ("${f0 && f0.line}"), the clock line ("${f0 && f0.clock}")`);
    // (a) the ELEMENT paused for 2 s while the context runs on, then played again
    await ev(f, `import('/js/audio/music.js').then(m => { const np = m.nowPlaying(); window.__pausedEl = np && np.el; if (window.__pausedEl) window.__pausedEl.pause(); })`);
    await sleep(2000);
    await ev(f, 'window.__pausedEl && window.__pausedEl.play().catch(() => {})');
    await waitFor(f, `(() => { const d = window.__arcade.musicDebug(); return !!d.playing && d.health.sounding; })()`, 'playing again', 8000).catch(() => {});
    await sleep(500);
    const f1 = await PHASE();
    ok(f1 && f1.d < 0.12, `SONG CLOCK: the element paused 2 s (the context running on) → back on its grid (${f1 && f1.d} beats off, "${f1 && f1.clock}")`);
    // (b) the CONTEXT suspended for 2 s while the element plays on, then resumed
    await ev(f, `import('/js/audio/engine.js').then(e => e.getContext().suspend())`);
    await sleep(2000);
    await ev(f, `import('/js/audio/engine.js').then(e => e.getContext().resume())`);
    await sleep(500);
    const f2 = await PHASE();
    ok(f2 && f2.d < 0.12, `SONG CLOCK: the context suspended 2 s (the element on) → the lights on the element's grid (${f2 && f2.d} beats off, "${f2 && f2.clock}")`);
    // (c) a seek of 17.3 s with no event the clock is told about (a reading jump)
    await ev(f, `import('/js/audio/music.js').then(m => { const np = m.nowPlaying(); if (np) np.el.currentTime = np.at + 17.3; })`);
    await sleep(600);
    const f3 = await PHASE();
    ok(f3 && f3.d < 0.12, `SONG CLOCK: a 17 s seek → re-locked (${f3 && f3.d} beats off, "${f3 && f3.clock}")`);
    await F.ctx.close(); }

  // ---- 5. City 1.0 (no flag) is untouched: its own decks, and the same setting
  { const P = await open({ slot: 'mu', qs: 'when=2026-10-22T13:00&tz=America/Detroit', view: [402, 874], city: false });
    const id = await start(P.page);
    ok(songs.moods.day.includes(id) && !songs.songs[id].c2, `CITY 1.0: 1 pm plays its own DAY deck (${id}), none of the owner's c2 songs`);
    await setMood(P.page, 'party');
    await changed(P.page, id, 'City 1.0 forced');
    const p2 = await ev(P.page, NOW);
    ok(songs.moods.party.includes(p2) && !songs.songs[p2].c2, `CITY 1.0: the setting PARTY plays City 1.0's party deck (${p2})`);
    await P.ctx.close(); }
});
// ================================================================ THE TAPE STOP IN WEB AUDIO (Oct 25 — the owner's iPhone: the TR-3B's bend ALONE
// killed the song; docs/audio.md#the-tape-stop-in-web-audio). The TR-3B on the title with the music playing: the element's playbackRate is
// NEVER assigned (a setter trap on every media element), the song is carried by a decoded slice through the graph — sounding, its clock
// moving at the bent speed, the element paused on purpose, the AUDIO panel saying so; after the jets the element is back at the tape's
// time with its clock moving; a stalled element (its play() swallowed once, as iOS does) is loaded again by the watchdog; a second run
// back to back bends again and comes back; the panel's loop never leaves the music dead.
G('tape', async () => {
  const P = 'window.__district.harbor()';
  const trap = { fn: () => {
    const d = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
    window.__rateSets = [];
    Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', { configurable: true, get() { return d.get.call(this); }, set(v) { window.__rateSets.push(v); return d.set.call(this, v); } });
    // (the stall: the next `n` play() calls on a SONG element do nothing but resolve — the element stays paused, its clock still)
    window.__swallowPlays = 0;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { if (window.__swallowPlays > 0 && !String(this.src).startsWith('blob:')) { window.__swallowPlays--; window.__swallowed = (window.__swallowed || 0) + 1; return Promise.resolve(); } return play.call(this); };
  } };
  const Q = await open({ slot: 'tp', qs: `${NIGHT}&debug=1&force=no-people`, view: [402, 874], init: trap });
  const p = Q.page;
  await harborUp(p);
  const D = 'window.__arcade.musicDebug()';
  const PLAYING = `(() => { const d = ${D}; return !!d.playing && d.health.sounding && d.health.state === 'running' && d.at > 0.5; })()`;
  await tapAt(p, 30, 300);
  await waitFor(p, PLAYING, 'the music playing', 15000);
  const at0 = await ev(p, `${D}.at`);
  // (9f — THE TAPE ON THE DRAIN: the owner's iPhone, "the audio slowdown effect was lagging" — measured, the lights dipped at 2.7 s and
  // the tape audibly at 4.6 s; a sampler of the run's second, the city's darkness + the tape's rate, every 40 ms)
  await ev(p, `(() => { window.__TS = []; window.__TSi = setInterval(() => { try { const h = ${P}, l = h.legend.state, b = h.legend.blackout(), d = ${D}; if (l && l.run) window.__TS.push([l.s, b ? b.k : 0, d.tape.rate]); } catch { /* fine */ } }, 40); window.__TF = []; let lt = 0; const fr = t => { if (!window.__TSi) return; try { const l = ${P}.legend.state; if (lt && l && l.run) window.__TF.push([l.s, t - lt]); } catch { /* fine */ } lt = t; requestAnimationFrame(fr); }; requestAnimationFrame(fr); })()`);
  // the TR-3B started by the API (the forced flag would start it at the load, before the music): its slice is prepared as it arrives
  await ev(p, `${P}.legend.start('tr3b')`);
  await waitFor(p, `${D}.tape.phase === 'bent'`, 'the tape takes the song (the sag at ~3 s)', 20000);
  const on = await ev(p, `(() => { const d = ${D}; return { phase: d.tape.phase, rate: d.tape.rate, at: d.tape.at, sounding: d.health.sounding, peak: d.health.peak, elPaused: (d.voices.find(v => v.id === d.playing) || {}).paused }; })()`);
  ok(on.phase === 'bent' && on.sounding, `THE TAPE STOP: the tape carries the song as the craft arrives (rate ${on.rate}, song ${on.at} s, sounding ${on.sounding})`);
  await waitFor(p, `${D}.tape.rate < 0.55`, 'the sag deep', 12000);
  const a = await ev(p, `(() => { const d = ${D}; return { rate: d.tape.rate, at: d.tape.at, t: performance.now(), sounding: d.health.sounding, peak: d.health.peak, elPaused: (d.voices.find(v => v.id === d.playing) || {}).paused, frozen: d.health.frozen }; })()`);
  await sleep(2000);
  const b = await ev(p, `(() => { const d = ${D}; return { rate: d.tape.rate, at: d.tape.at, t: performance.now(), sounding: d.health.sounding, peak: d.health.peak, lost: d.tape.lost }; })()`);
  const slope = (b.at - a.at) / ((b.t - a.t) / 1000);
  ok(a.sounding && b.sounding && a.elPaused && a.rate < 0.55 && a.rate > 0.4, `HELD DEEP: ~0.5 × (${a.rate}), the element paused on purpose, the music SOUNDING (${a.sounding}, probe ${a.peak})`);
  ok(slope > 0.35 && slope < 0.65, `THE SONG CLOCK MOVES AT THE TAPE'S SPEED: ${a.at} → ${b.at} s over ${((b.t - a.t) / 1000).toFixed(1)} s (×${slope.toFixed(2)}), ${b.lost} s behind real time`);
  okT(a.peak > 0.002 && b.peak > 0.002, `SOUND FLOWS THROUGH THE BEND: the probe hears the slice (${a.peak.toFixed(3)}, ${b.peak.toFixed(3)})`);
  { await waitFor(p, `window.__TS.some(x => x[1] > 0.97)`, 'the city all dark', 15000).catch(() => {});
    const { TS, TF } = await ev(p, '(() => { clearInterval(window.__TSi); window.__TSi = 0; return { TS: window.__TS, TF: window.__TF }; })()');
    const drainF = TF.filter(x => x[0] > 2 && x[0] < 7).map(x => x[1]), worst = drainF.length ? Math.max(...drainF) : 0;
    const dip = TS.find(x => x[1] > 0.02), tape = TS.find(x => x[2] < 0.98), dark = TS.find(x => x[1] > 0.97);
    const f = x => (x ? `${x[0].toFixed(2)} s` : '—');
    ok(dip && tape && tape[0] < dip[0] + 1.0, `9f — THE TAPE ON THE DRAIN: the slow-down starts with the lights' first dip (the lights ${f(dip)}, the tape under 0.98 × at ${f(tape)}; before 9f ~2 s after)`);
    okT(dip && tape && Math.abs(tape[0] - dip[0]) < 0.5 && dark && dark[2] < 0.6, `9f — THE TAPE ON TIME: within 0.5 s of the first dip (${f(dip)} → ${f(tape)}) + deep as the city goes dark (${dark ? `${dark[2].toFixed(2)} × at ${f(dark)}` : 'never all dark'})`);
    okT(drainF.length > 30 && worst < 200, `9f — THE DRAIN's FIRST SECONDS SMOOTH: ${drainF.length} frames from 2 to 7 s, the longest ${Math.round(worst)} ms (no heavy work at the drain's start)`); }
  const strip = await ev(p, `(() => { const d = document.querySelector('.dbg-s[data-id=audio]'); return d ? d.textContent : ''; })()`);
  ok(/AUDIO [▾▸] sounding/.test(strip) && /ON THE TAPE 0\.[45]\d×/.test(strip) && !/NOT SOUNDING/.test(strip), `THE AUDIO PANEL reads "sounding" + ON THE TAPE through the drain ("${strip.slice(0, 120)}…")`);
  ok((await ev(p, 'window.__rateSets.length')) === 0, 'THE ELEMENT\'S playbackRate IS NEVER ASSIGNED (the setter trap saw 0 writes)');
  // the way back, with the element STALLED once (its play() swallowed: paused, its clock still — what iOS did): the watchdog reloads it
  await ev(p, 'window.__swallowPlays = 1');
  await waitFor(p, `${D}.tape.phase === 'idle' && ${D}.tape.runs === 1`, 'the tape gives the song back after the jets', 50000);
  await waitFor(p, PLAYING, 'the element playing again', 6000).catch(() => {});
  const back = await ev(p, `(() => { const d = ${D}; return { at: d.at, t: performance.now(), sounding: d.health.sounding, tape: d.tape, swallowed: window.__swallowed || 0, last: d.health.last, heals: d.health.heals, events: d.health && window.__arcade.musicDebug ? undefined : undefined }; })()`);
  await sleep(1500);
  const back2 = await ev(p, `(() => { const d = ${D}; return { at: d.at, t: performance.now(), sounding: d.health.sounding, playing: d.playing }; })()`);
  ok(back.sounding && back2.sounding && back2.at > back.at + 1.0 && back2.at - back.at < 2.2, `BACK ON THE ELEMENT after the jets: sounding, its clock moving (${back.at} → ${back2.at} s)`);
  ok(back.swallowed === 1 && back.tape.reloads === 1, `THE WATCHDOG: the stalled element (its play() swallowed ${back.swallowed}×) was loaded again at the right time (reloads ${back.tape.reloads}, last heal "${back.last}")`);
  ok(back.at > at0 + 20 && back.at < at0 + 60, `THE SONG WENT ON from where the tape got to (${at0.toFixed(1)} → ${back.at.toFixed(1)} s: ~27 s of song in ~47 s of event — no skip ahead on the title)`);
  ok((await ev(p, 'window.__rateSets.length')) === 0, 'THE ELEMENT\'S playbackRate still never assigned (through the release + the reload)');
  const strip2 = await ev(p, `(() => { const d = document.querySelector('.dbg-s[data-id=audio]'); return d ? d.textContent : ''; })()`);
  ok(/AUDIO [▾▸] sounding/.test(strip2) && !/ON THE TAPE/.test(strip2), `THE AUDIO PANEL reads "sounding" after it ("${strip2.slice(0, 100)}…")`);
  // BACK TO BACK (the panel's loop): a second run right away bends again; stopped early it comes straight back
  await ev(p, `${P}.legend.start('tr3b')`);
  await waitFor(p, `${D}.tape.phase === 'bent' && ${D}.tape.runs === 2`, 'the second run bends again', 20000);
  await waitFor(p, `${D}.tape.rate < 0.7`, 'the second sag', 10000);
  const two = await ev(p, `(() => { const d = ${D}; return { rate: d.tape.rate, sounding: d.health.sounding, runs: d.tape.runs }; })()`);
  ok(two.sounding && two.rate < 0.7, `BACK TO BACK: the second run bends the song again (${two.rate}×), sounding`);
  await ev(p, `${P}.legend.stop()`);
  await waitFor(p, `${D}.tape.phase === 'idle'`, 'stopped early: the song straight back', 12000);
  await waitFor(p, PLAYING, 'the element playing after the stop', 6000).catch(() => {});
  const end = await ev(p, `(() => { const d = ${D}; return { sounding: d.health.sounding, at: d.at, tape: d.tape, rateSets: window.__rateSets.length }; })()`);
  ok(end.sounding && end.tape.phase === 'idle' && end.rateSets === 0, `NEVER LEFT DEAD: after two runs the music sounds on the element (${end.at} s), ${end.tape.runs} runs, ${end.tape.reloads} reload, ${end.tape.aborts} aborts, 0 rate writes`);
  if (SHOTS) await p.screenshot({ path: `${OUT}tape-402x874.png` });
  await Q.ctx.close();
});
