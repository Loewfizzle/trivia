// CITY 2.0 — THE HARBOR end to end: the `city` cloud job's groups (core, skyline, water, load, promenade, light, streetparty, panel) — tests/integration/harbor-jobs.mjs#CI_JOBS.
// Registered with G() in their original order; run through ../e2e-harbor.mjs (JOB=city, or ONLY=<groups>). Shared helpers: ./kit.mjs.
// ADDING A GROUP: G('name', …) in its job's file (harbor-e2e/<job>.mjs) + the name in ../harbor-jobs.mjs (CI_JOBS).
import { normalize as wxNormalize } from '../../../js/core/weather.js';
import { OUT, BASE, SHOTS, t0, log, sleep, errors, ok, okT, okF, GR, NIGHT, launch, open, ev, waitFor, tapAt, tap, harborUp, dbPut, flags, settled, G } from './kit.mjs';

// ================================================================ THE PREVIEW PANEL (the owner's test remote; ONLY=panel runs just this)
async function panelSection() {
  // ---- JUST ME: 9d — no pill on the screen: the ☰ menu's ADMIN row (its bottom, admins only) opens the sheet (&panel=1 under ?emu: the
  // test switch — no admin profile here), live, no reload
  const O = await open({ slot: 'hp', qs: `${NIGHT}&panel=1` });
  await harborUp(O.page);
  await waitFor(O.page, 'window.__district.remote() && window.__district.remote().debug().admin', 'the admin panel ready', 10000);
  await tap(O.page, '.menu-btn');
  await waitFor(O.page, '!!document.querySelector(".gm-adm .gm-item")', 'the ADMIN row', 5000);
  const adm = await ev(O.page, `(() => { const a = document.querySelector('.gm-adm'), b = a.querySelector('.gm-item').getBoundingClientRect(); return { last: a === a.parentNode.lastElementChild, h: b.height, txt: a.textContent, pill: !!document.querySelector('.hr-pill'), cue: !document.querySelector('.menu-btn .mb-cue').hidden }; })()`);
  ok(adm.last && adm.h >= 44 && /ADMIN/.test(adm.txt) && !adm.pill && !adm.cue, `9d THE ADMIN ROW: the ☰ menu's last row (${Math.round(adm.h)} pt, "${adm.txt}"), no TEST pill on the screen, no cue while nothing is on`);
  await tap(O.page, '.gm-adm .gm-item');
  await waitFor(O.page, '!!document.querySelector(".hr-sheet")', 'the sheet', 5000); await waitFor(O.page, "document.querySelector('.hr-sheet').getAnimations().every(x => x.playState === 'finished')", 'the sheet up', 5000);
  await sleep(450);
  // SP4 (the owner: the readouts drew on top of the open panel): body.hr-sheet-open while the sheet is up — debug-strip.js hides the column
  const openCls = await ev(O.page, "document.body.classList.contains('hr-sheet-open')");
  // C2 — THE PANEL REWORK: the sheet FULL SCREEN; NINE SECTIONS in the owner's order, collapsed by default; each preview sits in its
  // registry section (core/harbor-remote.js#sectionOf — no positions hard-coded here); JUST ME marked green
  // (the C2 helpers: close = the queue starts — after the delay; NOW (0) for the steps that aren't about the delay)
  const R0 = await import('../../../js/core/harbor-remote.js');
  const sheetUp = async p => { await waitFor(p, '!!document.querySelector(".hr-sheet")', 'the sheet', 5000); await waitFor(p, "document.querySelector('.hr-sheet').getAnimations().every(x => x.playState === 'finished')", 'the sheet up', 5000); await sleep(300); };
  const closeSheet = async p => { await ev(p, 'window.__district.remote().close()'); await waitFor(p, '!document.querySelector(".hr-modal")', 'the sheet gone', 4000); };
  const openAdmin = async p => { await tap(p, '.menu-btn'); await waitFor(p, '!!document.querySelector(".gm-adm .gm-item")', 'the ADMIN row', 5000); await tap(p, '.gm-adm .gm-item'); };
  const reopen = async p => { await openAdmin(p); await sheetUp(p); };
  await ev(O.page, 'window.__district.remote().delay(0)');
  {
    const c = await ev(O.page, `(() => { const secs = [...document.querySelectorAll('.hr-sheet .hr-s')], sh = document.querySelector('.hr-sheet').getBoundingClientRect(); return { secs: secs.map(s => s.dataset.sec), open: secs.filter(s => s.classList.contains('is-open') || !s.querySelector('.hr-body').hidden).length,
      heads: secs.map(s => s.querySelector('.hr-cat').getBoundingClientRect().height).filter(h => h > 0), full: sh.top <= 1 && sh.height >= innerHeight - 1 && sh.width >= innerWidth - 1, edge: getComputedStyle(document.querySelector('.hr-top')).borderTopColor,
      ev: Object.fromEntries([...document.querySelectorAll('.hr-sheet .hr-b[data-ev]')].map(b => [b.dataset.ev, b.closest('.hr-s').dataset.sec])) }; })()`);
    const wrong = R0.PANEL_EVENTS.filter(e => c.ev[e.id] !== R0.sectionOf(e.id)).map(e => `${e.id}→${c.ev[e.id]}`);
    ok(c.open === 0 && !wrong.length && c.secs.join() === R0.SECTIONS.map(x => x.id).join() && c.heads.every(h => h >= 44) && c.full && /125, 255, 156/.test(c.edge),
      `PANEL: full screen (${c.full}), ${c.secs.length} sections (${c.secs.join(' · ')}), all collapsed at first, headers ≥ 44 pt (${Math.min(...c.heads)}), JUST ME's green edge (${c.edge}), every preview in its section${wrong.length ? ` — WRONG: ${wrong.join(', ')}` : ''}`);
  }
  // 8a — PULSE STRENGTH (LIGHTS + MUSIC): the slider, the number shown, QUEUED in the status; closing the sheet (delay NOW) sets the
  // city's punch; BACK TO 175 %
  {
    await ev(O.page, "window.__district.remote().openCats(['lights'])");
    await waitFor(O.page, "!!document.querySelector('.hr-sec[data-cat=\"lights\"] .hr-range')", 'the slider', 3000);
    const s0 = await ev(O.page, `(() => { const r = document.querySelector('.hr-range'), b = r.getBoundingClientRect(); return { v: r.value, min: r.min, max: r.max, h: b.height, w: b.width, num: document.querySelector('.hr-pv').textContent }; })()`);
    await ev(O.page, `(() => { const r = document.querySelector('.hr-range'); r.value = '180'; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await sleep(200);
    const held = await ev(O.page, 'window.__district.harbor().flags.q.pulse || null');
    const st = await ev(O.page, "document.querySelector('.hr-s[data-sec=\"lightsmusic\"] .hr-cat').textContent + ' | ' + document.querySelector('.hr-status').textContent");
    await closeSheet(O.page);
    ok(openCls && !(await ev(O.page, "document.body.classList.contains('hr-sheet-open')")), `PANEL: the debug strips step aside while the sheet is open (body.hr-sheet-open ${openCls} → off when it closes)`);
    await waitFor(O.page, "window.__district.harbor().flags.q.pulse === '180'", 'the pulse flag', 3000).catch(() => {});
    await waitFor(O.page, 'window.__district.party().pulse === 1.8', 'the scene read the flag (a frame)', 3000).catch(() => {});   // (the scene reads it once a frame: the cloud's machine needed one)
    const live = await ev(O.page, `({ q: window.__district.harbor().flags.q.pulse, pulse: window.__district.party().pulse })`);
    ok(s0.v === '175' && s0.min === '50' && s0.max === '250' && s0.num === '175 %' && s0.h >= 44 && held === null && /QUEUED/.test(st) && /PULSE 180 %/.test(st) && live.q === '180',
      `PANEL: PULSE STRENGTH — ${s0.min}–${s0.max} %, starts at ${s0.num} (${Math.round(s0.w)}×${Math.round(s0.h)} pt); 180 % QUEUED while the sheet is open (&pulse ${held}; "${st.slice(0, 90)}"), on as it closes (&pulse=${live.q})`);
    // (the scene reads the flag once a FRAME: on the cloud's loaded machine a frame can come after the 3-s wait — speed, not the rule)
    okT(live.pulse === 1.8, `PANEL: PULSE STRENGTH — the city's punch ×${live.pulse} (×1.8 expected)`);
    await reopen(O.page);
    const back = await O.page.evaluate(() => { const b = [...document.querySelectorAll('.hr-sec[data-cat="lights"] .hr-b')].find(x => /^BACK TO 175/.test(x.textContent)); if (b) b.click(); return !!b; });
    await closeSheet(O.page); await sleep(200);
    const q2 = await ev(O.page, 'window.__district.harbor().flags.q.pulse || null');
    ok(back && q2 === null && (await ev(O.page, 'window.__district.party().pulse')) === 1.75, `PANEL: BACK TO 175 % — the default again (no &pulse: ${q2})`);
    await reopen(O.page);
    await ev(O.page, 'window.__district.remote().openCats([])');
  }
  // FP — THE DEBUG TOOLS (TOOLS): READOUT + AUDIO PANEL on this phone, live on / off, remembered (no &debug=1 on this page)
  {
    await ev(O.page, "window.__district.remote().openCats(['tools'])");
    await waitFor(O.page, "!!document.querySelector('.hr-sec[data-cat=\"tools\"] [data-tool=\"audio\"]')", 'the tool switches', 3000);
    const st = () => ev(O.page, `({ ro: window.__district.harbor().flags.readout, diag: !!document.querySelector('.dbg-s[data-id=audio]'), on: [...document.querySelectorAll('.hr-sec[data-cat="tools"] [data-tool]')].filter(b => b.classList.contains('is-on')).map(b => b.dataset.tool), saved: localStorage.getItem('na:dbgtools'), h: Math.min(...[...document.querySelectorAll('.hr-sec[data-cat="tools"] [data-tool]')].map(b => b.getBoundingClientRect().height)) })`);
    const t0 = await st();
    const flipT = id => ev(O.page, `document.querySelector('.hr-sec[data-cat="tools"] [data-tool="${id}"]').click()`);
    await flipT('audio'); await flipT('readout');
    await waitFor(O.page, "!!document.querySelector('.dbg-s[data-id=audio]') && window.__district.harbor().flags.readout", 'both on', 4000).catch(() => {});
    const t1 = await st();
    await flipT('audio'); await flipT('readout');
    await waitFor(O.page, "!document.querySelector('.dbg-s[data-id=audio]') && !window.__district.harbor().flags.readout", 'both off', 4000).catch(() => {});
    const t2 = await st();
    ok(!t0.ro && !t0.diag && !t0.on.length && t0.h >= 44 && t1.ro && t1.diag && t1.on.join() === 'readout,audio' && /"audio":true/.test(t1.saved) && /"readout":true/.test(t1.saved) && !t2.ro && !t2.diag && !t2.on.length && /"audio":false/.test(t2.saved),
      `PANEL TOOLS: READOUT + AUDIO PANEL off → on live (readout ${t1.ro}, panel ${t1.diag}, saved ${t1.saved}) → off (${t2.saved}); buttons ≥ 44 pt`);
    // remembered: a fresh visit on this device (no &debug=1) shows both
    const M = await open({ slot: 'hpt', qs: NIGHT, init: { fn: () => { try { localStorage.setItem('na:dbgtools', JSON.stringify({ readout: true, audio: true })); } catch { /* fine */ } }, arg: null } });
    await harborUp(M.page);
    await waitFor(M.page, "!!document.querySelector('.dbg-s[data-id=audio]') && window.__district.harbor().flags.readout", 'remembered tools', 8000).catch(() => {});
    const m = await ev(M.page, "({ ro: window.__district.harbor().flags.readout, diag: !!document.querySelector('.dbg-s[data-id=audio]') })");
    ok(m.ro && m.diag, `PANEL TOOLS: remembered on this device — a visit without &debug=1 shows the readout (${m.ro}) + the AUDIO panel (${m.diag})`);
    await M.ctx.close();
    await ev(O.page, 'window.__district.remote().openCats([])');
  }
  // a row's section opens (a real tap on its header) before the row is tapped
  const reveal = async label => {
    const hd = await O.page.evaluate(l => { const b = [...document.querySelectorAll('.hr-sheet .hr-b')].find(x => x.textContent.replace('☾', '').trim() === l); const s = b && b.closest('.hr-s'); if (!s || s.classList.contains('is-open')) return null; const hh = s.querySelector('.hr-cat'); hh.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = hh.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, sec: s.dataset.sec }; }, label);
    if (!hd) return;
    await tapAt(O.page, hd.x, hd.y);
    await waitFor(O.page, `document.querySelector('.hr-s[data-sec="${hd.sec}"]').classList.contains('is-open')`, `${hd.sec} opens`, 3000);
  };
  const chip = async label => {
    // (9d: a row inside a closed fold — the NOW bar's MORE TIME — is unfolded first, as a person would)
    if (await O.page.evaluate(l => { const b = [...document.querySelectorAll('.hr-sheet .hr-b')].find(x => x.textContent.replace('☾', '').trim() === l); const d = b && b.closest('details'); if (!d || d.open) return false; d.open = true; return true; }, label)) await sleep(150);
    await reveal(label);
    const r = await O.page.evaluate(l => { const b = [...document.querySelectorAll('.hr-sheet .hr-b')].find(x => x.textContent.replace('☾', '').trim() === l); if (!b) return null; b.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; }, label);
    if (!r) throw new Error(`no chip ${label}`);
    await tapAt(O.page, r.x, r.y); await sleep(200);
  };
  const small = await ev(O.page, `[...document.querySelectorAll('.hr-sheet button')].filter(b => { const r = b.getBoundingClientRect(); return r.width && (r.height < 44 || r.width < 44); }).length`);
  ok(small === 0, `PANEL: every button in the sheet is a ≥ 44 pt target (${small} smaller)`);
  // C2 — THE SEARCH: one box over every row; "police" leaves THE RAID alone (in LEGENDARY); a clear button; ≥ 16 px
  { await O.page.focus('.hr-q'); await O.page.keyboard.type('police'); await sleep(150);
    const s = await ev(O.page, `({ vis: [...document.querySelectorAll('.hr-sheet .hr-b[data-ev]')].filter(b => b.offsetParent).map(b => b.dataset.ev + '@' + b.closest('.hr-s').dataset.sec), fs: parseFloat(getComputedStyle(document.querySelector('.hr-q')).fontSize), x: !document.querySelector('.hr-qx').hidden })`);
    await tap(O.page, '.hr-qx'); await sleep(150);
    const back = await ev(O.page, `({ q: document.querySelector('.hr-q').value, secs: [...document.querySelectorAll('.hr-sheet .hr-s')].filter(x => x.offsetParent).length })`);
    ok(s.vis.join() === 'raid@legendary' && s.fs >= 16 && s.x && back.q === '' && back.secs === R0.SECTIONS.length, `PANEL SEARCH: "police" → ${s.vis.join(', ')} (${s.fs} px, ✕ ${s.x}); cleared → all ${back.secs} sections back`); }
  // C2 — THE DELAY: taps QUEUE while the sheet is open (the city unchanged, the status says QUEUED); closing starts a 3-2-1 chip
  // in the pill's row (JUST ME's green); the whole queue starts after 3 s
  await ev(O.page, 'window.__district.remote().delay(3)');
  await chip('AURORA'); await chip('RAIN'); await chip('20×');
  let f1 = await flags(O.page);
  const q1 = await ev(O.page, "document.querySelector('.hr-status').textContent");
  ok(!f1.force.includes('aurora') && f1.wx !== 'rain' && f1.speed === 1 && /QUEUED.*AURORA.*20×.*RAIN.*STARTS 3 S AFTER YOU CLOSE/.test(q1), `THE DELAY: AURORA + RAIN + 20× queued, the city unchanged while the sheet is open ("${q1.slice(0, 80)}")`);
  await closeSheet(O.page);
  const tc = Date.now();
  await waitFor(O.page, '!!document.querySelector(".hr-cd")', 'the countdown chip', 2000);
  const cdc = await ev(O.page, `(() => { const c = document.querySelector('.hr-cd'), r = c.getBoundingClientRect(), p = document.querySelector('.menu-btn').getBoundingClientRect(); return { t: c.textContent, mode: c.dataset.mode, near: Math.abs(r.top + r.height / 2 - (p.top + p.height / 2)) < 30 }; })()`);
  await waitFor(O.page, "window.__district.harbor().flags.force.includes('aurora')", 'the queue starts', 6000);
  const dt = Date.now() - tc;
  f1 = await flags(O.page);
  ok(/^3JUST ME · AURORA · RAIN/.test(cdc.t) && cdc.mode === 'me' && cdc.near && f1.wx === 'rain' && f1.speed === 20, `THE DELAY: the chip "${cdc.t}" in the pill's row (${cdc.near}), then AURORA + RAIN + 20× together (wx ${f1.wx}, ${f1.speed}×)`);
  okT(dt > 2500 && dt < 4500, `THE DELAY: started ${dt} ms after the sheet closed (3 s)`);
  await waitFor(O.page, 'window.__district.scene().rain > 0', 'the rain falls', 6000);
  // reopening during the countdown CANCELS it — the queue stays queued; closing again starts it
  await reopen(O.page);
  await chip('SNOW'); await closeSheet(O.page); await sleep(600);
  await reopen(O.page);
  { const d = await ev(O.page, 'window.__district.remote().debug()'); await sleep(3300);
    const wx = (await flags(O.page)).wx;
    ok(!d.countdown && d.queued && d.pend.wx === 'snow' && wx === 'rain', `THE DELAY: reopening cancels the countdown (${JSON.stringify(d.countdown)}), SNOW still QUEUED, the city still rain after 3 s (${wx})`); }
  // RECENT: the rows fired (this device); one tap fires one again — the sheet closes, the countdown runs, the queued SNOW goes with it
  // (9d: RECENT sits under the NOW bar — below the first screen on a phone: scrolled to, like a thumb would)
  { const rc = await ev(O.page, `[...document.querySelectorAll('.hr-rc')].map(b => b.dataset.rk)`);
    const t = await ev(O.page, `(() => { const b = document.querySelector('.hr-rc[data-rk="ev:aurora"]'); if (!b) return null; b.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height }; })()`);
    if (t) await tapAt(O.page, t.x, t.y);
    await waitFor(O.page, '!document.querySelector(".hr-modal") && !!document.querySelector(".hr-cd")', 'RECENT → the countdown', 3000).catch(() => {});
    await waitFor(O.page, "window.__district.harbor().flags.wx === 'snow'", 'the queue with it', 6000).catch(() => {});
    const f = await flags(O.page);
    ok(['ev:aurora', 'wx:rain'].every(k => rc.includes(k)) && t && t.h >= 44 && f.wx === 'snow' && f.force.includes('aurora') && JSON.parse(await ev(O.page, "localStorage.getItem('nd:hr-recent')")).length >= 3,
      `RECENT: ${rc.join(' · ')} (remembered on this device); one tap fired AURORA again + the queued SNOW (wx ${f.wx})`); }
  await ev(O.page, 'window.__district.remote().delay(0)');
  await reopen(O.page);
  await chip('DAWN'); await closeSheet(O.page);
  await waitFor(O.page, 'window.__district.scene().w.night < 0.5', 'the clock at dawn', 8000);
  f1 = await flags(O.page);
  ok(/T0[5-8]:\d\d$/.test(f1.q.when || ''), `JUST ME: DAWN from the real sun (${f1.q.when}), the city's look follows (delay NOW: as the sheet closes)`);
  await reopen(O.page);
  // (9d: the NOW bar — TODAY = the real clock; the weather chip that's on (SNOW, from RECENT) tapped again = the real weather; 1× under MORE TIME)
  await chip('TODAY'); await chip('SNOW'); await chip('1×');
  await chip('WORDS IN THE WINDOWS');
  await waitFor(O.page, "!!document.querySelector('.hr-text')", 'the text box under its row', 6000);   // (8b1: the cloud once grabbed it before the panel drew it)
  await O.page.evaluate(() => { const i = document.querySelector('.hr-text'); i.scrollIntoView({ block: 'center', behavior: 'instant' }); i.focus(); });
  await O.page.keyboard.type('hey you');
  await sleep(400);
  await closeSheet(O.page);
  await waitFor(O.page, "window.__district.harbor().flags.q.text === 'HEY YOU'", 'the text applied', 5000);
  await waitFor(O.page, "!!window.__district.harbor().windows.spelling && window.__district.harbor().windows.spelling.text === 'HEY YOU'", 'the word in the windows', 8000);
  ok(true, 'JUST ME: WORDS IN THE WINDOWS + typed text ("hey you" → HEY YOU) lights on the word towers');
  if (SHOTS) await O.page.screenshot({ path: `${OUT}panel-me-390x844.png` });
  // the tab keeps it (like a preview link survives a refresh)
  await O.page.reload();
  await waitFor(O.page, '!!window.__district && window.__district.phase().done', 'reload', 25000);
  await harborUp(O.page);
  await waitFor(O.page, "window.__district.harbor().flags.remote && window.__district.harbor().flags.force.includes('spell')", 'JUST ME after a reload', 8000);
  ok((await flags(O.page)).q.text === 'HEY YOU', 'JUST ME: a refresh keeps it (this tab)');
  // CLEAR ALL: back to the real city at once, no countdown (the page's own flags: the link's &at keeps clear weather)
  await waitFor(O.page, 'window.__district.remote() && window.__district.remote().debug().admin', 'the admin panel again', 10000);
  // (9d: the cue on ☰ says a preview is on — JUST ME green)
  ok(await ev(O.page, "(() => { const c = document.querySelector('.menu-btn .mb-cue'); return !!c && !c.hidden && c.dataset.k === 'me'; })()"), '9d THE CUE: a JUST ME preview on → the green dot on ☰');
  await reopen(O.page);
  // (the sections opened before the reload are open again — this device remembers; the pinned top stays in view at the bottom)
  { const r = await ev(O.page, `(() => { const s = document.querySelector('.hr-sheet'); s.scrollTop = s.scrollHeight; const open = [...document.querySelectorAll('.hr-s.is-open')].map(x => x.dataset.sec).sort();
      const sb = s.getBoundingClientRect(), cb = document.querySelector('.hr-q').getBoundingClientRect(); return { open, pinned: s.scrollTop > 100 && cb.top >= sb.top && cb.bottom <= sb.top + sb.height * 0.3, stored: JSON.parse(localStorage.getItem('nd:hr-open') || '[]').sort() }; })()`);
    ok(['lightsmusic', 'sky'].every(c => r.open.includes(c) && r.stored.includes(c)) && r.pinned, `PANEL: the open sections remembered on this device (${r.open.join(', ')}); the title + the search pinned at the top when scrolled to the bottom (${r.pinned})`); }
  await ev(O.page, "document.querySelector('.hr-sheet').scrollTop = 0"); await sleep(200);
  await tap(O.page, '.hr-clear');
  await waitFor(O.page, '!window.__district.harbor().flags.remote', 'cleared', 5000);
  await waitFor(O.page, '!window.__district.harbor().windows.spelling', 'the word gone', 5000);
  f1 = await flags(O.page);
  ok(!f1.force.length && !f1.q.text && f1.speed === 1 && f1.wx === null, `JUST ME: CLEAR ALL — the real city again (force [${f1.force}], wx ${f1.wx}: SP5 — the link's &at (a forced clear sky) goes too, the live weather is back)`);
  // SP5 — CLEAR ALL = THE REAL CITY NOW (the owner: a preview LINK's flags kept forcing after CLEAR ALL): a link with &when + &force=drones
  // + a JUST ME change (the aurora) — ONE tap on CLEAR ALL: no force, the clock the real one (not the link's night), the live weather
  // path back (the zone's city: &at forces a clear sky, so it goes too — keepLive on the place-only clock), the URL stripped of &when /
  // &force / &at (&city, &panel, &tz kept), the toast naming what went
  { const P = await open({ slot: 'clearreal', qs: `when=2026-10-24T21:00&force=drones&panel=1${GR}`, view: [402, 874] });
    await harborUp(P.page);
    await waitFor(P.page, "window.__district.remote && window.__district.remote()", 'the panel', 15000);
    await ev(P.page, "window.__district.remote().setMine({ force: ['aurora'] })");
    await waitFor(P.page, "window.__district.harbor().flags.remote && window.__district.harbor().flags.force.includes('aurora')", 'JUST ME on', 8000);
    const f0 = await flags(P.page), night0 = Math.abs(f0.now - Date.now()) > 3600e3;
    await reopen(P.page); await tap(P.page, '.hr-clear');
    await waitFor(P.page, '!window.__district.harbor().flags.remote', 'cleared', 5000);
    await sleep(600);
    const f1 = await flags(P.page), url = await ev(P.page, 'location.search'), q = new URLSearchParams(url), toastT = await ev(P.page, "(() => { const t = [...document.querySelectorAll('.toast')].map(e => e.textContent).join(' | '); return t; })()");
    ok(night0 && !f1.force.length && !f1.q.when && !f1.q.force && f1.speed === 1 && (!f1.preview || f1.keepLive) && Math.abs(f1.now - Date.now()) < 120e3 && !q.has('when') && !q.has('force') && !q.has('at') && q.get('city') === '2' && q.get('panel') === '1' && q.has('tz') && /REAL CITY/.test(toastT) && /WHEN/.test(toastT) && /FORCE/.test(toastT),
      `CLEAR ALL = THE REAL CITY NOW: from a night link (${new Date(f0.now).toISOString().slice(11, 16)} UTC, forced [${f0.force}]) one tap → force [${f1.force}], the real clock (${Math.round((f1.now - Date.now()) / 1000)} s off now), the live weather back (preview ${f1.preview}, keepLive ${f1.keepLive}), the URL "${url}", the toast "${toastT.slice(0, 90)}"`);
    await P.ctx.close(); }
  // 7a §0 — THE WORD TOWERS from the panel: one word per tower, the one too long for its tower scrolls on it; the readout says so
  // (CONN: at night, like its EVERYONE twin — after CLEAR ALL the clock is the real one, and the words never light by day)
  await ev(O.page, "window.__district.remote().setMine({ force: ['spell'], text: 'HAPPY BIRTHDAY SAM', tower: 'wordA,wordB,wordV', when: '2026-10-24T23:00' })");
  await waitFor(O.page, "(() => { const s = window.__district.harbor().windows.spelling; return !!s && s.towers.length === 3; })()", 'three towers', 8000).catch(() => {});
  { const s = await ev(O.page, 'window.__district.harbor().windows.spelling');
    await ev(O.page, "window.__district.remote().open(), window.__district.remote().openCats(['lights'])");
    await waitFor(O.page, "!!document.querySelector('.hr-fit')", 'the readout', 4000).catch(() => {});
    const fit = await ev(O.page, "(() => { const f = document.querySelector('.hr-fit'); return f ? [...f.querySelectorAll('.hr-fit-row')].map(r => r.textContent).join(' | ') + ' || ' + [...f.querySelectorAll('.hr-fit-n')].map(r => r.textContent).join(' | ') : ''; })()");
    if (SHOTS) await O.page.screenshot({ path: `${OUT}panel-towers-390x844.png` });
    ok(s && ['wordA', 'wordB', 'wordV'].every(t => s.towers.includes(t)) && s.scrolls.join() === 'wordB' && /BIRTHDAY.*SCROLLS/.test(fit) && /ROOM/.test(fit),
      `THE WORD TOWERS (JUST ME): "${s && s.text}" on ${s && s.towers} — ${s && s.scrolls} scrolls; the readout: "${fit}"`);
    await ev(O.page, 'window.__district.remote().close(), window.__district.remote().setMine({})'); }
  await O.ctx.close();

  // ---- EVERYONE ON CITY 2: the server's node (written here with the emulator's owner rights; the /api path: server.test) —
  // phones on ?city=2 play it in sync from startAt; a late arrival joins mid-way; until → the real city; the default city never listens
  const B = await open({ slot: 'he1', qs: NIGHT });
  await harborUp(B.page);
  await waitFor(B.page, '!!window.__district.remote()', 'the listener up', 10000);
  const startAt = Date.now() - 3000;
  await dbPut('city2/live', { v: 1, kind: 'preview', state: { force: ['banner', 'spell'], text: 'HI ALL', when: '2026-10-24T23:00' }, params: {}, label: 'test', startAt, until: Date.now() + 120_000, by: 'ptest00000000' });
  await waitFor(B.page, "window.__district.harbor().flags.remote && window.__district.harbor().flags.force.includes('banner')", 'EVERYONE on phone 1', 8000);
  const C = await open({ slot: 'he2', qs: NIGHT, view: [430, 932] });
  await harborUp(C.page);
  await waitFor(C.page, "window.__district.harbor().flags.remote && window.__district.harbor().flags.force.includes('banner')", 'EVERYONE on a late arrival', 10000);
  await waitFor(B.page, '!!window.__district.harbor().sky.state.banner', 'the banner flies (1)', 10000);
  await waitFor(C.page, '!!window.__district.harbor().sky.state.banner', 'the banner flies (2)', 10000);
  const [b, c] = await Promise.all([B.page, C.page].map(p => ev(p, '({ f: window.__district.harbor().flags, at: window.__district.harbor().sky.state.banner.at, now: window.__district.harbor().flags.now })')));
  const expect = Date.UTC(2026, 9, 25, 3, 0) + (Date.now() - startAt);            // (23:00 in Detroit = 03:00 UTC, running since startAt)
  ok(b.f.q.text === 'HI ALL' && c.f.q.text === 'HI ALL' && Math.abs(b.now - c.now) < 2000 && Math.abs(b.now - expect) < 5000,
    `EVERYONE: two phones (one arriving late) on the same minute (clocks ${Math.round(Math.abs(b.now - c.now))} ms apart, ${Math.round((b.now - expect) / 1000)} s from startAt's 23:00)`);
  ok(Math.abs(b.at - c.at) < 1500 && Math.abs(b.at - Date.UTC(2026, 9, 25, 3, 0)) < 1500, `EVERYONE: the banner's first flight starts at startAt on both phones (${Math.round(Math.abs(b.at - c.at))} ms apart) — the late one joins mid-flight`);
  if (SHOTS) await C.page.screenshot({ path: `${OUT}panel-everyone-430x932.png` });
  // the default city never subscribes
  { const N = await open({ slot: 'he3', qs: NIGHT, city: false }); await sleep(2500);
    ok(!N.files.some(u => /remote\.js|harbor-remote/.test(u)) && (await ev(N.page, 'window.__district.harbor()')) === null && !(await ev(N.page, '!!document.querySelector(".hr-pill")')), 'EVERYONE: the default city never loads the panel or listens to city2/live');
    await N.ctx.close(); }
  // C2 — THE DELAY for EVERYONE: a node whose startAt is 3 s ahead — the phones keep what they show until then, then start together
  { const at = Date.now() + 3000;
    await dbPut('city2/live', { v: 1, kind: 'preview', state: { force: ['banner', 'spell'], text: 'HI ALL', when: '2026-10-24T23:00', wx: 'snow' }, params: {}, label: 'test', startAt: at, until: at + 120_000, by: 'ptest00000000' });
    await sleep(1200);
    const early = await Promise.all([B.page, C.page].map(p => ev(p, 'window.__district.harbor().flags.wx')));
    await Promise.all([B.page, C.page].map(p => waitFor(p, "window.__district.harbor().flags.wx === 'snow'", 'the delayed node', 8000).catch(() => {})));
    const late = Date.now() - at, wx = await Promise.all([B.page, C.page].map(p => ev(p, 'window.__district.harbor().flags.wx')));
    ok(early.every(w => w !== 'snow') && wx.every(w => w === 'snow'), `EVERYONE + THE DELAY: a startAt 3 s ahead — both phones waited (${early.join(', ')} at +1.2 s), then snow on both (${wx.join(', ')})`);
    okT(late > -200 && late < 4500, `EVERYONE + THE DELAY: the phones started ${late} ms after startAt (the 4-s tick is the backstop; the timer is exact)`); }
  // until passes → the real city again; CLEAR (the node removed) → the real city at once
  await dbPut('city2/live', { v: 1, kind: 'preview', state: { force: ['aurora'] }, params: {}, label: 'test', startAt: Date.now(), until: Date.now() + 2500, by: 'ptest00000000' });
  await waitFor(B.page, "window.__district.harbor().flags.force.includes('aurora')", 'the new state', 6000);
  await waitFor(B.page, '!window.__district.harbor().flags.remote', 'until passed', 12000);
  ok(true, 'EVERYONE: when `until` passes, the phone goes back to the real city on its own');
  await dbPut('city2/live', { v: 1, kind: 'preview', state: { force: ['searchlights'] }, params: {}, label: 'test', startAt: Date.now(), until: Date.now() + 120_000, by: 'ptest00000000' });
  await waitFor(C.page, "window.__district.harbor().flags.force.includes('searchlights')", 'searchlights', 6000);
  // (7a §0: THE WORD TOWERS from EVERYONE — one word per tower through city2/live; NIGHT too wide for B: it scrolls there)
  await dbPut('city2/live', { v: 1, kind: 'preview', state: { force: ['spell'], text: 'JAZZ NIGHT', tower: 'wordA,wordB', when: '2026-10-24T23:00' }, params: {}, label: 'test', startAt: Date.now(), until: Date.now() + 120_000, by: 'ptest00000000' });
  { const okk = await waitFor(C.page, "(() => { const s = window.__district.harbor().windows.spelling; return !!s && s.text === 'JAZZ NIGHT'; })()", 'the towers for everyone', 8000).then(() => true).catch(() => false);
    const s = await ev(C.page, 'window.__district.harbor().windows.spelling');
    ok(okk && s.towers.join() === 'wordA,wordB' && s.scrolls.join() === 'wordB', `THE WORD TOWERS (EVERYONE): "${s && s.text}" — JAZZ still on A, NIGHT scrolling on B (${s && s.scrolls})`); }
  await dbPut('city2/live', null);
  await waitFor(C.page, '!window.__district.harbor().flags.remote', 'cleared for everyone', 6000);
  ok(true, 'EVERYONE: CLEAR — the node removed, every phone back to the real city');
  await B.ctx.close(); await C.ctx.close();
}
// ================================================================ NEON PASS 5 — the panel: a link's own settings win, the JUST ME chip,
// PARTY ON = the party link, every sky event fired from the panel appears
async function neonPass5Panel() {
  // a JUST ME state left in the tab (PARTY OFF + rain) and a party link opened in it: the link wins
  const L1 = await open({ slot: 'hl', qs: `when=2026-10-24T23:00${GR}&panel=1`, view: [402, 874], init: { fn: st => { try { sessionStorage.setItem('nd:hr-me', JSON.stringify({ state: st, ui: {} })); } catch { /* fine */ } }, arg: { party: 'off', wx: 'rain' } } });
  await harborUp(L1.page);
  await waitFor(L1.page, '!!window.__district.remote()', 'the panel loaded', 10000);
  await waitFor(L1.page, 'window.__district.party().on > 0.5', 'the link\'s party', 10000).catch(() => {});
  const f1 = await flags(L1.page), p1 = await ev(L1.page, 'window.__district.party()');
  ok(!f1.remote && p1.on > 0.5 && f1.wx !== 'rain', `A LINK'S OWN SETTINGS WIN: a leftover JUST ME (party off, rain) dropped for the party link (party ${p1.on}, wx ${f1.wx})`);
  // 9d — JUST ME on → the cue on ☰ + the ADMIN row says what, its CLEAR back to the link in one tap
  await ev(L1.page, "window.__district.remote().setMine({ party: 'on', force: ['aurora'], when: '2026-10-27T22:30' })");
  await waitFor(L1.page, "(() => { const c = document.querySelector('.menu-btn .mb-cue'); return !!c && !c.hidden; })()", 'the cue on ☰', 6000);
  await tap(L1.page, '.menu-btn');
  await waitFor(L1.page, "!!document.querySelector('.gm-adm .gm-adm-x')", 'the ADMIN row + CLEAR', 5000);
  const chipTxt = await ev(L1.page, "document.querySelector('.gm-adm .gm-item').textContent"), xr = await ev(L1.page, "(() => { const r = document.querySelector('.gm-adm-x').getBoundingClientRect(); return { w: r.width, h: r.height }; })()");
  await tap(L1.page, '.gm-adm-x');
  await waitFor(L1.page, '!window.__district.harbor().flags.remote', 'cleared by the ADMIN row', 5000);
  ok(/JUST ME · 10\/27 22:30/.test(chipTxt) && xr.w >= 44 && xr.h >= 44, `9d THE ADMIN ROW while JUST ME is on: "${chipTxt}" + a ${Math.round(xr.w)}×${Math.round(xr.h)} pt CLEAR — one tap back to the link`);
  const linkParty = await ev(L1.page, '({ beams: window.__district.harbor().skyBeams.beams.length, pal: window.__district.harbor().neon.pal.on })');
  await L1.ctx.close();
  // PARTY ON by day (no time picked) = the party link: the clock jumps to tonight, the same show
  const D = await open({ slot: 'hd2', qs: `when=2026-10-22T13:00${GR}&panel=1`, view: [402, 874] });
  await harborUp(D.page);
  await waitFor(D.page, 'window.__district.remote() && window.__district.remote().debug().admin', 'the admin panel ready', 10000);
  await tap(D.page, '.menu-btn'); await waitFor(D.page, '!!document.querySelector(".gm-adm .gm-item")', 'the ADMIN row', 5000); await tap(D.page, '.gm-adm .gm-item');
  await waitFor(D.page, "!!document.querySelector('.hr-sheet') && document.querySelector('.hr-sheet').getAnimations().every(x => x.playState === 'finished')", 'the sheet up', 6000);
  // (C2: PARTY ON sits in LIGHTS + MUSIC → PARTY SHOW — the section collapsed at first: a tap on its header opens it; the sheet's
  // close starts it — the delay NOW here)
  await ev(D.page, 'window.__district.remote().delay(0)');
  const ph = await ev(D.page, `(() => { const h = document.querySelector('.hr-s[data-sec="lightsmusic"] .hr-cat'); h.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = h.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; })()`);
  await tapAt(D.page, ph.x, ph.y);
  await waitFor(D.page, `document.querySelector('.hr-s[data-sec="lightsmusic"]').classList.contains('is-open')`, 'LIGHTS + MUSIC opens', 3000);
  const on = await ev(D.page, `(() => { const b = [...document.querySelectorAll('.hr-sec[data-cat="party"] .hr-b')].filter(x => x.textContent.trim() === 'ON')[0]; if (!b) return null; b.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; })()`);
  await tapAt(D.page, on.x, on.y); await sleep(150);
  await ev(D.page, 'window.__district.remote().close()');
  await waitFor(D.page, "(() => { const p = window.__district.party(), n = window.__district.harbor().neon; return p.on > 0.5 && n.pal && n.pal.on && window.__district.harbor().skyBeams.beams.length > 0 && window.__district.scene().w.night > 0.6; })()", 'PARTY ON at night', 20000).catch(() => {});
  const fd = await flags(D.page), pd = await ev(D.page, '({ on: window.__district.party().on, name: window.__district.party().name, night: window.__district.scene().w.night, beams: window.__district.harbor().skyBeams.beams.length, pal: window.__district.harbor().neon.pal.on })');
  ok(pd.on > 0.5 && pd.night > 0.6 && pd.pal && pd.beams === linkParty.beams && /T2[0-3]:\d\d$/.test(fd.q.when || ''), `PARTY ON BY DAY = THE PARTY LINK: the clock jumps to tonight (${fd.q.when}), the show at its ${pd.name} — ${pd.beams} beams (the link: ${linkParty.beams}), the palette ${pd.pal ? 'on' : 'off'}`);
  await D.ctx.close();
  // every sky piece fired from the panel appears within a few seconds (JUST ME; the night pieces at night, the day ones by day)
  const SKY = [
    ['banner', 'st.banner'], ['skywrite', 'st.smoke && st.smoke.kind === "skytype"'], ['skytype', 'st.smoke && st.smoke.kind === "skytype"'], ['helicopter', 'st.air.heli'],
    ['balloons', 'st.balloons'], ['balloon-festival', 'st.balloons'], ['balloons-fast', 'st.balloons && st.balloons.fast > 1'], ['planes', 'st.air.planes.length > 0'], ['approach', 'st.air.planes.some(p => p.approach)'],
    ['geese', 'st.birds.geese > 0'], ['swifts', 'st.birds.swifts > 0'], ['bats-dusk', 'st.birds.bats > 0'], ['heron-sky', 'st.birds.heron'],   // (8b1: 'heron' is the heron on its piling now — the wildlife group)
  ];
  const NIGHT_SKY = [['satellites', 'st.air.train'], ['drones', 'st.drones']];
  for (const [when, list] of [[`when=2026-10-21T13:00${GR}&wind=2`, SKY], [NIGHT, NIGHT_SKY]]) {
    const P = await open({ slot: `hs${list.length}`, qs: `${when}&panel=1`, view: [402, 874] });
    await harborUp(P.page);
    await waitFor(P.page, '!!window.__district.remote() && !!window.__district.scene().textRects', 'the panel + the sign', 10000);
    const got = [], missing = [];
    for (const [id, cond] of list) {
      await ev(P.page, `window.__district.remote().setMine({ force: ['${id}'] })`);
      const okk = await waitFor(P.page, `(() => { const st = window.__district.harbor().sky.state; return !!(${cond}); })()`, id, 6000).then(() => true).catch(() => false);
      (okk ? got : missing).push(id);
      await ev(P.page, 'window.__district.remote().setMine({})');
      await waitFor(P.page, '!window.__district.harbor().flags.remote', 'cleared', 4000).catch(() => {});
    }
    ok(!missing.length, `THE PANEL'S SKY EVENTS (${/T13/.test(when) ? 'by day' : 'at night'}): ${got.join(', ')} each appeared within 6 s${missing.length ? ` — MISSING: ${missing.join(', ')}` : ''}`);
    await P.ctx.close();
  }
}
G('core', async () => {
  // ================================================================ 1. ?city=2: the Harbor, no errors, every size
  const A = await open({ slot: 'ha', qs: NIGHT });
  await harborUp(A.page);
  const d = await ev(A.page, 'window.__district.scene()');
  const hb = await ev(A.page, 'window.__district.harbor()');
  ok(d.city === 2 && hb && hb.shown && hb.bakes >= 1, `CITY 2: ?city=2 shows the Harbor (baked ${hb && hb.bakes}×, ${hb && hb.mem.mb} MB of ${hb && hb.mem.budget} MB)`);
  ok(hb.mem.mb <= hb.mem.budget, `MEMORY BUDGET: the baked layers fit the tier's budget (${hb.mem.mb} ≤ ${hb.mem.budget} MB; main canvas ${hb.main.mb} MB)`);
  ok(hb.mem.layers.every(l => l.dpr <= 2), 'MEMORY: baked layers capped at DPR 2 on a phone');
  ok(A.files.some(u => /\/js\/screens\/harbor\/scene\.js/.test(u)), 'CITY 2: the harbor modules load with the flag');
  // C4d — FIREBASE AUTH's POLLING GONE (FR4 B2): with IndexedDB first, auth polled it every 800 ms on every page (~18 transactions in
  // 15 s); localStorage first (js/firebase.js) → none. Counted on this (parked) title over 15 s
  // (NIGHT-A2 — the cloud read 4–5 in both of NIGHT-A's runs, 0 here: a RACE, not polling. Firebase starts AFTER the title's first paint
  // for a first-time visitor (app.js) from gstatic with a cold cache, and its start writes once — the auth persistence's probe + migration
  // check on firebaseLocalStorageDb (4) + the once-a-day heartbeat (firebase-heartbeat-database, 5 on a fresh profile) in one ~20 ms burst;
  // on GitHub's slower runner that burst landed inside the window. The window now opens after Firebase has started (state.ready — set on a
  // sign-in AND on a failure) and counts the AUTH store only, the one polling would hit; every database's count is in the message)
  { await waitFor(A.page, '!!(window.__arcade && window.__arcade.state && window.__arcade.state.ready)', 'Firebase started (signed in or failed)', 25000);
    await ev(A.page, `(() => { window.__idbTx = {}; const T = IDBDatabase.prototype.transaction; if (!T.__c4d) { IDBDatabase.prototype.transaction = function (...a) { window.__idbTx[this.name] = (window.__idbTx[this.name] || 0) + 1; return T.apply(this, a); }; IDBDatabase.prototype.transaction.__c4d = true; } return true; })()`);
    await sleep(15000);   // (a measurement window: the count over a fixed span is the check)
    const by = await ev(A.page, 'window.__idbTx'), n = (by && by.firebaseLocalStorageDb) || 0;
    ok(n < 3, `NO IndexedDB POLLING on a parked title: ${n} auth-store transactions in 15 s after Firebase's start (all: ${JSON.stringify(by)}; IndexedDB-first persistence: ~18)`); }
  if (SHOTS) for (const [w, h] of [[390, 844], [402, 874], [412, 915], [430, 932], [874, 402], [1440, 900]]) {
    await A.page.setViewport({ width: w, height: h, deviceScaleFactor: w < 1000 ? 2 : 1, isMobile: w < 1000, hasTouch: w < 1000 });
    await waitFor(A.page, `window.__district.harbor().cam.W === ${w}`, 'the re-layout', 8000); await settled(A.page);
    await A.page.screenshot({ path: `${OUT}night-${w}x${h}.png` });
  }
  await A.page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await waitFor(A.page, 'window.__district.harbor().cam.W === 390', 'back at 390', 8000); await settled(A.page);

  // ================================================================ 1b. the lanes (real rects); a re-layout never blanks the city
  { const h1 = await ev(A.page, 'window.__district.harbor()'), sc = await ev(A.page, 'window.__district.scene()');
    const tr = sc.textRects || {}, corners = (sc.clear || []).filter(r => r.w < 70 && r.h < 70);
    // (the tagline lane IS the tagline's band: the slot later parts bring a line back in — it is checked against the rest)
    const hit = Object.entries(h1.lanes).filter(([n, r]) => [tr.neon, tr.word, n === 'tagline' ? null : tr.tag, ...corners].some(z => z && r.x < z.x + z.w && z.x < r.x + r.w && r.y < z.y + z.h && z.y < r.y + r.h)).map(([n]) => n);
    ok(!!tr.neon && hit.length === 0 && h1.lanes['sky-high'].h >= 40 && h1.lanes['sky-low'].h >= 24, `LANES: ${Object.keys(h1.lanes).length} lane rects, clear of the real sign + corner buttons (sky-high ${Math.round(h1.lanes['sky-high'].h)} pt, sky-low ${Math.round(h1.lanes['sky-low'].h)} pt${hit.length ? `; over: ${hit}` : ''})`); }
  { const D = await open({ slot: 'hd', qs: `when=2026-10-21T13:00${GR}` });
    await harborUp(D.page);
    await waitFor(D.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled', 15000);
    // every frame from just before setTier(1) until the new bake has landed and faded: the speakeasy's wall (stage band) and
    // the bottom of the sky, sampled after the scene drew
    const run = await ev(D.page, `new Promise(res => {
      const cv = document.querySelector('.nd-scene canvas'), d = window.__district.door(), hb = window.__district.harbor();
      // (8a: a patch of the baked stage — the cobbles in front of the shop, averaged over 8 × 8 pt so the setts' texture doesn't read as a
      // change when the DPR does; Part 1's probe sat on the placeholder corner tree, gone in 8a)
      const f = d.w / 1.5, px = d.x - 6.3 * f, py = d.y + 1.1 * f, sy = hb.cam.VPY - 30;
      const x = cv.getContext('2d');
      const read = (X, Y) => { const k = cv.width / cv.clientWidth, w = Math.round(8 * k), d2 = x.getImageData(Math.round((X - 4) * k), Math.round((Y - 4) * k), w, w).data; let r = 0, g = 0, b = 0; const n = d2.length / 4; for (let i = 0; i < d2.length; i += 4) { r += d2[i]; g += d2[i + 1]; b += d2[i + 2]; } return [r / n, g / n, b / n].map(Math.round); };
      // (NEON PASS 5: the first sample inside a frame too — read between frames under load it could catch the canvas mid-commit)
      let before = null, sky = null, prevP = null, steadyN = 0, waitN = 0; const out = [];
      let n = 0, sawPending = false;
      const bakes0 = hb.bakes;
      const tick = () => {
        // (start once the pixel holds steady for 8 frames — the stage settling after the first bakes is not a re-layout)
        if (!before) { const p = read(px, py); steadyN = prevP && Math.abs(p[0] - prevP[0]) + Math.abs(p[1] - prevP[1]) + Math.abs(p[2] - prevP[2]) < 6 ? steadyN + 1 : 0; prevP = p; if (steadyN >= 8 || ++waitN > 240) { before = p; sky = read(4, sy); } requestAnimationFrame(tick); return; }
        out.push(read(px, py)); n++;
        if (n === 3) window.__district.setTier(1);
        const h = window.__district.harbor();
        if (n >= 3 && h.pending) sawPending = true;
        if ((n > 6 && h.bakes > bakes0 && !h.pending && !h.fading) || n > 900) return res({ before, sky, out, n, sawPending, baked: h.bakes > bakes0 && !h.pending, tier: window.__district.scene().tier, hist: (window.__district.tiering() || {}).hist, first: out.findIndex(p => p[0] + p[1] + p[2] < 24) });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    })`);
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const worst = Math.max(...run.out.map(p => dist(p, run.before))), nearSky = run.out.filter(p => dist(p, run.sky) < 12).length, black = run.out.filter(p => p[0] + p[1] + p[2] < 24).length;
    ok(run.baked && run.tier <= 1 && worst < 60 && !nearSky && !black, `RE-LAYOUT: setTier(1) mid-session (then t${run.tier}: the per-frame reads slow it, so the scene may step down again) — over ${run.n} frames (bake + crossfade) the stage-band pixel never went blank (worst Δ ${Math.round(worst)} from rgb(${run.before}); bare sky ${nearSky}×, black ${black}× — the tiers ${(run.hist || []).join("→")}, the first black frame ${run.first})`);
    await D.ctx.close(); }

  // ================================================================ 2. the flag is never saved; a normal visit is today's city
  const stored = await ev(A.page, `JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie`);
  ok(!/city/i.test(stored), 'NEVER SAVED: ?city=2 leaves nothing in localStorage, sessionStorage or cookies');
  { let files = []; A.page.on('request', r => files.push(r.url()));
    // (PF — the CI's slower machine: the ?city=2 page's late requests never count, and today's signs may come up after phase().done)
    await A.page.goto('about:blank'); files = [];
    await A.page.goto(`${BASE}/?emu&slot=ha&${NIGHT}`);
    await waitFor(A.page, '!!window.__district && window.__district.phase().done', 'reload without the flag');
    await waitFor(A.page, '(window.__district.scene().signs || []).length >= 4', "today's signs", 10000).catch(() => {});
    const d2 = await ev(A.page, 'window.__district.scene()'), hb = await ev(A.page, 'window.__district.harbor()'), hf = files.filter(u => /\/harbor\//.test(u));
    const good = d2.city !== 2 && d2.signs.length >= 4 && hb === null && !hf.length;
    ok(good, `NO FLAG: a reload without ?city=2 is today's city (its signs up, no harbor file loaded)${good ? '' : ` — city ${d2.city}, signs ${d2.signs.length}, harbor ${hb === null ? 'none' : 'up'}, harbor files: ${hf.slice(0, 3).join(' ')}`}`); }
  await A.ctx.close();
  { const N = await open({ slot: 'hn', qs: NIGHT, city: false });
    ok(!N.files.some(u => /\/harbor\//.test(u)) && (await ev(N.page, 'window.__district.scene()')).city !== 2, 'NORMAL VISIT: the default city, no harbor module requested');
    await N.ctx.close(); }
  // ---- FP3a → WIN2: THE DEBUG STRIPS — every strip FOLDED on every load (never remembered open); the column under the TEST pill + the
  // corner buttons, never over them; the readout's title cycles folded → open → EVERY OTHER STRIP HIDDEN (one tap hides them all) → folded;
  // the open LOAD log is capped + scrolls inside itself, its first lines on top; taps pass through
  for (const [w, h] of [[390, 844], [430, 932]]) {
    const D = await open({ slot: 'hdb', qs: `${NIGHT}&debug=1&panel=1`, view: [w, h] });
    await harborUp(D.page);
    await waitFor(D.page, "document.querySelectorAll('.dbg-s').length >= 3", 'the strips', 15000);
    const geo = () => ev(D.page, `(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; }, c = window.__district.harbor().cam, col = r('.dbg-col'), pill = r('.hr-bar');
      const btn = [...document.querySelectorAll('.menu-btn, .music-btn')].map(e => e.getBoundingClientRect());
      const over = b => !!b && b.bottom > col.top && b.top < col.bottom && b.right > col.left && b.left < col.right;
      return { col: { top: col.top, bottom: col.bottom, left: col.left, right: col.right }, limitY: c.limitY, dock: c.dock.y, H: innerHeight, pill: !!pill, overPill: over(pill), overBtn: btn.some(over),
        folded: [...document.querySelectorAll('.dbg-s')].map(s => s.classList.contains('dbg-fold')), fold: Object.fromEntries([...document.querySelectorAll('.dbg-s')].map(s => [s.dataset.id, s.classList.contains('dbg-fold')])), shown: [...document.querySelectorAll('.dbg-s')].filter(s => s.getBoundingClientRect().height > 0).length,
        load: (() => { const b = document.querySelector(".dbg-s[data-id='load'] .dbg-b"); if (!b) return null; const cs = getComputedStyle(b); return { h: b.clientHeight, sh: b.scrollHeight, st: b.scrollTop, first: b.firstElementChild ? b.firstElementChild.getBoundingClientRect().top >= b.getBoundingClientRect().top - 1 : null, touch: cs.overflowY === 'auto' && cs.pointerEvents === 'auto' && /pan-y/.test(cs.touchAction) }; })() }; })()`);
    const g0 = await geo();
    ok(g0.folded.every(Boolean) && !g0.overPill && !g0.overBtn && g0.col.top >= 50 && g0.col.bottom < g0.dock, `DEBUG STRIPS ${w}: every strip FOLDED on load, the column under the TEST pill (${g0.pill ? 'shown' : 'none'}) + the corner buttons (${Math.round(g0.col.top)}–${Math.round(g0.col.bottom)} pt; folded ${g0.folded.join('/')})`);
    const head = async (id, want) => { for (let k = 0; k < 2; k++) { const b = await ev(D.page, `(() => { const r = document.querySelector('.dbg-s[data-id=${id}] .dbg-h').getBoundingClientRect(); return { x: r.left + 20, y: r.top + r.height / 2 }; })()`); await tapAt(D.page, b.x, b.y); if (await waitFor(D.page, want, `${id} tapped`, 2000).then(() => true, () => false)) return true; } return false; };
    await head('readout', "!document.querySelector('.dbg-s[data-id=readout]').classList.contains('dbg-fold')");
    await sleep(300); const g1 = await geo();
    await head('readout', "document.querySelector('.dbg-col').classList.contains('dbg-min')");
    await sleep(300); const g2 = await geo();
    await head('readout', "!document.querySelector('.dbg-col').classList.contains('dbg-min')");
    await sleep(300); const g3 = await geo();
    ok(!g1.fold.readout && g1.shown >= 3 && g2.shown === 1 && g3.shown >= 3 && g3.folded.every(Boolean), `DEBUG STRIPS ${w}: the readout's title opens it (${g1.shown} shown), then HIDES EVERY OTHER STRIP (${g2.shown} shown), then brings them back folded (${g3.shown})`);
    await head('load', "!document.querySelector('.dbg-s[data-id=load]').classList.contains('dbg-fold')");
    await waitFor(D.page, "!!document.querySelector('.dbg-s[data-id=load] .dbg-b div')", 'the log rows', 5000).catch(() => {});
    await sleep(400); const g4 = await geo();
    // (NIGHT-A — the owner's iPhone: the strips were cut at a fixed height + didn't scroll on iOS: the open LOAD log capped at 260 pt + a TOUCH
    // scroller — overflow-y auto, its own taps, pan-y)
    ok(g4.load && g4.load.h <= 262 && g4.load.touch && g4.load.st === 0 && g4.load.first !== false && g4.col.bottom < g4.dock && !g4.overPill, `DEBUG STRIPS ${w}: the open LOAD log is capped (${g4.load && g4.load.h} pt of ${g4.load && g4.load.sh}) + scrolls inside by touch (${g4.load && g4.load.touch}), its first line on top, still under the pill`);
    if (SHOTS && w === 390) await D.page.screenshot({ path: `${OUT}debug-strips-load-390x844.png` });
    await D.page.reload(); await waitFor(D.page, "document.querySelectorAll('.dbg-s').length >= 3", 'the strips again', 15000);
    await sleep(300); const g5 = await geo();
    ok(g5.folded.every(Boolean), `DEBUG STRIPS ${w}: folded again after a reload — never remembered open (${g5.folded.join(' / ')})`);
    await D.ctx.close();
  }
});
G('skyline', async () => {
  // ================================================================ 3b. Part 2 (+ Part 5): the tagline rests with the dock, the words, the searchlights, the wheel
  { const T = await open({ slot: 'h7', qs: `${NIGHT}&force=spell,searchlights&text=2027` });
    // (the city laid out on the title's REAL text rects before the first reading: a sub-pt re-layout after it is not the bug; FP3a —
    // THE LOAD GATE re-lays the city only for a move over 2 pt (scene.js#maybeRelayout), so within 2 pt is "laid out on them")
    await harborUp(T.page);
    await waitFor(T.page, '(() => { const h = window.__district.harbor(), tr = window.__district.scene().textRects; return h && !h.pending && tr && Math.abs(h.cam.limitY - (tr.tag.y + tr.tag.h + 10)) <= 2.01; })()', 'the city laid out on the real text rects', 9000);
    const h0 = await ev(T.page, 'window.__district.harbor()');
    // PART 5 (the owner's call): the tagline stays while the dock is up — no timer — and rests WITH the dock
    await sleep(2500);
    const up = await ev(T.page, `(() => { const t = document.querySelector('.nd-tag'); return { o: +getComputedStyle(t).opacity, gone: window.__district.harbor().cam.tagGone }; })()`);
    ok(up.o > 0.9 && !up.gone, `TAGLINE ON ARRIVAL: shown with the dock (opacity ${up.o}), its band not the sky's`);
    await ev(T.page, 'window.__district.idle()');
    await waitFor(T.page, `(() => { const t = document.querySelector('.nd-tag'), d = document.querySelector('.nd-actions'); return t && getComputedStyle(t).opacity < 0.05 && getComputedStyle(d).opacity < 0.05 && window.__district.harbor().cam.tagGone; })()`, 'the tagline gone with the dock', 9000);
    await sleep(600);
    const h1 = await ev(T.page, 'window.__district.harbor()');
    // the real bug (fixed in Part 4): a re-layout forgetting the faded tagline — cam.tagGone off again, the lane shrunk back.
    // The positions get 1 pt (a sub-pt re-layout on a slow machine); the tagline's band is ≥ 10 pt, so the lane's move is clear.
    ok(h1.cam.tagGone && h1.lanes['sky-low'].y < h0.lanes['sky-low'].y - 8 && Math.abs(h1.cam.limitY - h0.cam.limitY) < 1 && Math.abs(h1.cam.VPY - h0.cam.VPY) < 1,
      `TAGLINE AT REST: fades out together with the dock; nothing in the city moves (limit ${h0.cam.limitY.toFixed(1)} → ${h1.cam.limitY.toFixed(1)}, horizon ${h0.cam.VPY.toFixed(1)} → ${h1.cam.VPY.toFixed(1)}), the freed band joins sky-low (${Math.round(h0.lanes['sky-low'].y)} → ${Math.round(h1.lanes['sky-low'].y)})`);
    // a touch brings the dock back — and the tagline with it (its band leaves sky-low again)
    await T.page.touchscreen.tap(20, 200);
    await waitFor(T.page, `(() => { const t = document.querySelector('.nd-tag'), d = document.querySelector('.nd-actions'); return t && getComputedStyle(t).opacity > 0.9 && getComputedStyle(d).opacity > 0.9 && !window.__district.harbor().cam.tagGone; })()`, 'the tagline back with the dock', 9000);
    ok(true, 'TAGLINE ON A TAP: back together with the dock, its band the tagline\'s again');
    await waitFor(T.page, '!!(window.__district.harbor().windows.spelling) && window.__district.harbor().beams > 0.3', 'the word + the searchlights', 9000);
    const h2 = await ev(T.page, 'window.__district.harbor()');
    ok(h2.windows.spelling.text === '2027' && h2.windows.spelling.cells > 30 && h2.beams > 0.3 && h2.windows.share > 0.9,
      `WORDS + SEARCHLIGHTS: "${h2.windows.spelling.text}" lit on ${h2.windows.spelling.towers} (${h2.windows.spelling.cells} windows), beams ${h2.beams}, the night's share ${h2.windows.share}`);
    const w = h2.wheel, sp = await ev(T.page, 'window.__district.door()');
    ok(w.legs[0] > 0 && w.deck > w.y && h2.mem.layers.some(l => l.name === 'nearLit') && h2.mem.mb <= h2.mem.budget,
      `WHEEL + LIT LAYER: the wheel's legs at ${Math.round(w.legs[0])}–${Math.round(w.legs[1])} pt, deck ${Math.round(w.deck)}; lit windows baked in their own layers (${h2.mem.mb} of ${h2.mem.budget} MB)`);
    if (SHOTS) await T.page.screenshot({ path: `${OUT}part2-words-390x844.png` });
    void sp;
    await T.ctx.close();
  }
});
G('water', async () => {
  // ================================================================ 3d. Part 4: the water — the mirror, the light columns, the wind, the paths
  { const N = await open({ slot: 'hw', qs: `${NIGHT}&wind=0.5` });
    await harborUp(N.page);
    await waitFor(N.page, '(() => { const h = window.__district.harbor(); return h.neon.signs.every(s => s.on) && h.neon.built >= h.neon.items && !h.neon.queued && h.water.copies > 0 && h.water.strips > 30; })()', 'the neon built + on, the mirror + its columns', 15000);
    await sleep(500);                                                       // (the mirror is rebuilt 10× a second: a few rebuilds with the lit neon)
    await waitFor(N.page, 'window.__district.harbor().rate.drawn > 0', 'a frame', 2000);
    const h = await ev(N.page, 'window.__district.harbor()');
    ok(h.water.strips > 30 && h.water.copies > 0, `THE WATER: the mirror rippled row by row (${h.water.strips} rows), the lights' columns at night (${h.water.copies} copies)`);
    ok(h.water.rough < 0.05, `A CALM NIGHT (wind 0.5 m/s): a glassy mirror (roughness ${h.water.rough})`);
    // THE GAME BLADE's neon + its chasing bulbs show in the water below it (Part 6a: it took the HOTEL's spot; its mirror image:
    // as far under the waterline as the sign is above it)
    const hot = h.neon.signs.find(s => s.id === 'n-blade');
    const red = await ev(N.page, `(() => { const cv = document.querySelector('canvas'), x = cv.getContext('2d'), k = cv.width / innerWidth, y0 = ${h.water.y0}, y1 = ${h.water.y1};
      const cx = ${hot.rect.x + hot.rect.w / 2}, my = Math.min(y1 - 4, 2 * y0 - (${hot.rect.y + hot.rect.h * 0.8}));
      let best = 0; for (let dx = -4; dx <= 4; dx += 2) for (let dy = -8; dy <= 8; dy += 2) { const d = x.getImageData((cx + dx) * k, (my + dy) * k, 1, 1).data; best = Math.max(best, (d[0] + d[1] + d[2]) / 3); }
      return best; })()`);
    ok(red > 80, `THE NEON IN THE WATER: the game blade mirrored under it (brightness ${Math.round(red)})`);
    ok(await ev(N.page, "['reflect', 'light', 'wake', 'set'].every(k => typeof window.__district.harbor().water[k] === 'function')"), 'THE HOOKS: reflect (boats, Part 5), light (fireworks, Part 10), wake (Part 5), set (rain + fog, Part 9)');
    ok(h.mem.mb + h.neon.mb <= h.mem.budget, `MEMORY (the water): ${h.mem.layers.find(l => /mirror/.test(l.name)).mb} MB in the ${h.mem.mb} MB of layers + the neon ${h.neon.mb} MB ≤ ${h.mem.budget}`);
    // NEON PASS 4 — THE THIN BLACK BARS (the owner's iPhone): every ripple strip on whole device rows (an edge at a fractional row
    // anti-aliased into a dark seam), and the pixels agree — in the lit water, the rows where two strips meet are no darker than
    // their neighbours, against every other row (tier 1, DPR 1.5, where the seams showed most here: 3 % darker before the fix)
    for (const tr of [2, 1]) {
      await ev(N.page, `window.__district.setTier(${tr})`);
      await waitFor(N.page, `window.__district.harbor().water.tier === ${tr}`, `the water at tier ${tr}`, 5000); await sleep(700);
      const sm = await ev(N.page, `(async () => { const cv = document.querySelector('canvas'), x = cv.getContext('2d'), k = cv.width / innerWidth, at = [], rest = [];
        for (let n = 0; n < 4; n++) { await new Promise(r => setTimeout(r, 130));
          const wt = window.__district.harbor().water, E = new Set(wt.rows.slice(2).map(r => wt.rows[0] + r)), r0 = Math.ceil(wt.y0 * k) + 1, r1 = Math.floor(wt.y1 * k) - 8, w = cv.width;
          const d = x.getImageData(0, r0 - 1, w, r1 - r0 + 2).data, Lm = (r, c) => { const i = ((r - r0 + 1) * w + c) * 4; return d[i] + d[i + 1] + d[i + 2]; };
          for (let r = r0 + 1; r < r1; r++) { let s = 0, m = 0; for (let c = 0; c < w; c += 2) { const a = Lm(r - 1, c), z = Lm(r + 1, c); if (Math.min(a, z) < 120) continue; s += 2 * Lm(r, c) / (a + z); m++; } if (m > 20) (E.has(r) ? at : rest).push(s / m); } }
        const mean = a => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length), wt = window.__district.harbor().water;
        return { grid: wt.grid, edge: mean(at), rest: mean(rest), n: at.length }; })()`);
      ok(sm.grid, `NO SEAMS IN THE WATER (tier ${tr}): every strip on whole device rows`);
      okF(sm.n > 20 && sm.edge >= sm.rest - 0.025, `NO SEAMS IN THE WATER (tier ${tr}): the rows where strips meet ${(100 * sm.edge).toFixed(1)} % of their neighbours' light, every other row ${(100 * sm.rest).toFixed(1)} % (${sm.n} meeting rows sampled)`);
    }
    await ev(N.page, 'window.__district.setTier(0)'); await waitFor(N.page, 'window.__district.harbor().water.tier === 0 && window.__district.harbor().water.strips > 0', 'the calm mirror', 8000);
    const h0 = await ev(N.page, 'window.__district.harbor()');
    ok(h0.water.tier === 0 && h0.water.strips > 0, `TIER 0: the calm baked mirror (${h0.water.strips} rows, re-drawn once a second)`);
    if (SHOTS) await N.page.screenshot({ path: `${OUT}part4-water-calm-390x844.png` });
    await N.ctx.close();
  }
  { const N = await open({ slot: 'hx', qs: `${NIGHT}&wind=13` });
    await harborUp(N.page); await waitFor(N.page, 'window.__district.harbor().water.rough > 0.85 && window.__district.harbor().water.copies >= 8', 'the chop', 10000).catch(() => {});
    const h = await ev(N.page, 'window.__district.harbor()');
    ok(h.water.rough > 0.85 && h.water.copies >= 8, `A WINDY NIGHT (13 m/s): choppy (roughness ${h.water.rough}), longer broken columns (${h.water.copies} copies)`);
    if (SHOTS) await N.page.screenshot({ path: `${OUT}part4-water-windy-390x844.png` });
    await N.ctx.close();
  }
  { const G = await open({ slot: 'hy', qs: `when=2026-10-20T18:30${GR}&wind=3` });
    await harborUp(G.page); await waitFor(G.page, "/sun/.test(window.__district.harbor().water.paths)", 'the sun\'s path', 10000).catch(() => {});
    const g = await ev(G.page, 'window.__district.harbor().water');
    ok(/sun/.test(g.paths), `GOLDEN HOUR: the sun's gold path on the water (${g.paths})`);
    await G.ctx.close();
    const D = await open({ slot: 'hz', qs: `when=2026-10-21T13:00${GR}` });
    await harborUp(D.page); await waitFor(D.page, "/glints/.test(window.__district.harbor().water.paths)", 'the glints', 10000).catch(() => {});
    const d = await ev(D.page, 'window.__district.harbor().water');
    ok(/glints/.test(d.paths) && d.copies === 0, `BY DAY: sun glints on the water, no light columns (${d.paths}; ${d.copies} copies)`);
    await D.ctx.close();
  }

});
// ================================================================ 3i. THE PREVIEW PANEL (JUST ME + EVERYONE ON CITY 2)
G('panel', async () => { await panelSection(); await neonPass5Panel(); });
// ================================================================ FP3a — THE LOAD GATE (FREV B1: the iPhone's "shrinks, enlarges, snaps" on load)
// A sampler installed BEFORE the page mounts records every frame: the canvas's backing size, the scene's opacity, the harbor's shown /
// bakes / fading; Safari's bars are played by two viewport changes in the load window (390×780 at 300 ms, back to 390×844 at 900 ms).
G('load', async () => {
  const ctx = await (await launch()).createBrowserContext();
  const p = await ctx.newPage();
  p.on('pageerror', e => { errors.push(`load pageerror: ${e.message}`); log('load', 'PAGEERROR', e.message); });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(() => {
    try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:ld:profile', JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ }
    const S = window.__ld = { s: [], resizes: [], px: [] };
    addEventListener('resize', () => S.resizes.push(performance.now()));
    let n = 0;
    const tick = () => {
      const now = performance.now(), cv = document.querySelector('.nd-scene canvas'), wrap = document.querySelector('.nd-scene');
      let hb = null; try { hb = window.__district && window.__district.harbor ? window.__district.harbor() : null; } catch { /* mounting */ }
      if (cv && wrap) S.s.push({ t: now, w: cv.width, h: cv.height, op: +getComputedStyle(wrap).opacity, shown: !!(hb && hb.shown), bakes: hb ? hb.bakes : 0, fading: !!(hb && hb.fading) });
      // (one stage pixel a few frames apart, from a second after the reveal: no stretch, no snap)
      if (hb && hb.shown && hb.reveal && S.revealT == null) S.revealT = now;
      if (S.revealT != null && now - S.revealT > 1000 && now - S.revealT < 4000 && ++n % 6 === 0 && cv) {
        const k = cv.width / cv.clientWidth, d = cv.getContext('2d').getImageData(Math.round(cv.clientWidth * 0.12 * k), Math.round(cv.clientHeight * 0.66 * k), 1, 1).data;
        S.px.push([d[0], d[1], d[2]]);
      }
      if (now < 15000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const t0 = Date.now();
  const nav = p.goto(`${BASE}/?emu&slot=ld&when=2026-10-23T13:00${GR}&force=no-people&city=2`);
  await sleep(300); await p.setViewport({ width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sleep(Math.max(0, 900 - (Date.now() - t0))); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await nav;
  await waitFor(p, '!!window.__district && !!window.__district.harbor() && window.__district.harbor().shown', 'the reveal', 20000);
  await sleep(4200);
  const S = await ev(p, 'window.__ld'), hb = await ev(p, 'window.__district.harbor()'), tr = await ev(p, 'window.__district.tiering()');
  const sizes = [...new Set(S.s.map(x => `${x.w}×${x.h}`))], last = S.s[S.s.length - 1];
  ok(sizes.length <= 2 && `${last.w}×${last.h}` === '780×1688', `LOAD: the canvas sized ≤ 2 times through the bars settling (${sizes.join(' → ')})`);
  const rv = S.s.find(x => x.shown), lastRs = Math.max(...S.resizes);
  ok(rv && rv.t >= lastRs + 400, `LOAD: revealed only once the viewport settled (the last resize ${Math.round(lastRs)} ms, the reveal ${rv ? Math.round(rv.t) : '—'} ms; ${hb.reveal && hb.reveal.why})`);
  const before = S.s.filter(x => !x.shown);
  ok(before.length > 0 && before.every(x => x.op === 0), `LOAD: DARK until the reveal (the canvas's opacity ${[...new Set(before.map(x => x.op))].join(' / ')} over ${before.length} frames)`);
  const after = S.s.filter(x => x.shown && x.t < rv.t + 3000);
  const bk = [...new Set(after.map(x => x.bakes))];
  ok(after.length > 20 && bk.length === 1 && after.every(x => !x.fading), `LOAD: no re-bake and no crossfade in the 3 s after the reveal (bakes ${bk.join(' → ')}, ${after.filter(x => x.fading).length} fading frames)`);
  const op = after.map(x => x.op);
  ok(op[op.length - 1] > 0.99 && op.every((v, i) => !i || v >= op[i - 1] - 0.001), `LOAD: one clean fade in (opacity ${op[0].toFixed(2)} → ${op[op.length - 1].toFixed(2)}, never back)`);
  const jump = S.px.length > 3 ? Math.max(...S.px.slice(1).map((c, i) => Math.max(...c.map((v, j) => Math.abs(v - S.px[i][j]))))) : 999;
  ok(S.px.length > 3 && jump <= 60, `LOAD: the stage holds still after the reveal — no stretch, no snap (${S.px.length} reads, the biggest step ${jump} levels)`);
  ok(tr.hist.length === 1 && !tr.wantStep, `LOAD: no tier step during the load (${tr.hist.join('→')}${tr.why.length ? ` · ${tr.why.join(', ')}` : ''})`);
  if (SHOTS) await p.screenshot({ path: `${OUT}load-revealed-390x844.png` });
  // a ROTATION after the load window: laid out again at once (not coalesced)
  await p.setViewport({ width: 874, height: 402, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  let rot = true; await waitFor(p, 'window.__district.harbor().cam.W === 874', 'the rotation', 8000).catch(() => { rot = false; });
  ok(rot, 'LOAD: a rotation re-lays the city within 8 s');
  // POLISH 5 — THE LOAD LOG (core/harbor-loadlog.js): from the reveal on, nothing the eye sees changes (no re-layout, no crossfade over
  // the city, no instant sky repaint, no clouds popping, no tier step) — the measured load above, then the live weather three ways
  { const LG = hb.loadLog;
    ok(LG && LG.rows.some(r => r.kind === 'reveal') && LG.visible.length === 0, `LOAD LOG: the bars settling → 0 changes after the reveal (${LG ? LG.visible.map(r => `${r.kind} ${r.msg}`).join(' | ') || 'none' : 'no log'})`); }
  await ctx.close();
  // THE WEATHER AT LOAD — the real clock (no &when), /api/sky answered by the test: overcast, after `delay` ms; cached = the answer
  // already on this device (localStorage nd:wx, fresh). The owner's iPhone faded clear → overcast after the city showed, EVERY load.
  const wxLoad = async (name, { delay, cached, intro, justme }) => {
    const c2 = await (await launch()).createBrowserContext();
    const q = await c2.newPage();
    q.on('pageerror', e => { errors.push(`load-wx pageerror: ${e.message}`); log('load', 'PAGEERROR', e.message); });
    await q.setViewport({ width: 402, height: 874, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const ans = { ...wxNormalize({ weather_code: 3, cloud_cover: 100, cloud_cover_low: 95, cloud_cover_mid: 40, cloud_cover_high: 10, visibility: 20000, wind_speed_10m: 12, wind_direction_10m: 250, temperature_2m: 9 }, { lat: 42.96, lon: -85.67 }, Date.now()), kp: [] };
    await q.evaluateOnNewDocument((cachedAns, jm) => {
      try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:lw:profile', JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); if (cachedAns) localStorage.setItem('nd:wx', JSON.stringify({ ...cachedAns, at: Date.now(), got: Date.now() })); else localStorage.removeItem('nd:wx'); } catch { /* fine */ }
      // (SP4: a JUST ME state the panel kept for the tab — the owner's "plain Safari load" that read "none (seeded)")
      try { if (jm) sessionStorage.setItem('nd:hr-me', JSON.stringify({ state: { when: jm }, ui: {} })); else sessionStorage.removeItem('nd:hr-me'); } catch { /* fine */ }
    }, cached ? ans : null, justme || null);
    await q.setRequestInterception(true);
    q.on('request', r => { if (r.url().includes('/api/sky')) setTimeout(() => r.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...ans, at: Date.now() }) }).catch(() => {}), delay); else r.continue().catch(() => {}); });
    await q.goto(`${BASE}/?emu&slot=lw${intro ? '&intro=1' : ''}&city=2`);
    await waitFor(q, '!!window.__district && !!window.__district.harbor() && window.__district.harbor().shown', 'the reveal', 20000);
    await sleep(Math.max(4000, delay + 4000 - 2000));
    const h = await ev(q, '(() => { const h = window.__district.harbor(); return { log: h.loadLog, wx: window.__district.scene().wxKind }; })()');
    const rv = h.log.rows.find(r => r.kind === 'reveal'), late = h.log.rows.filter(r => r.a != null && (r.kind === 'bake' || r.kind === 'sky' || r.kind === 'clouds'));
    await c2.close();
    return { ...h, rv, late };
  };
  { const r = await wxLoad('cached', { delay: 3000, cached: true });
    ok(/wx overcast/.test(r.rv.msg) && r.log.visible.length === 0, `LOAD WEATHER — kept on this device: the first frame is already overcast, 0 changes after (${r.rv.msg}; ${r.log.visible.map(x => `${x.kind} ${x.msg}`).join(' | ') || 'none'})`); }
  { const r = await wxLoad('fast', { delay: 1200, cached: false });
    ok(/wx overcast/.test(r.rv.msg) && r.log.visible.length === 0, `LOAD WEATHER — answered in 1.2 s: the reveal waits for it, revealed overcast, 0 changes after (${r.rv.msg}; ${r.log.visible.map(x => `${x.kind} ${x.msg}`).join(' | ') || 'none'})`); }
  { const r = await wxLoad('slow', { delay: 6000, cached: false });
    ok(r.wx === 'overcast' && r.log.visible.length === 0 && !/wx overcast/.test(r.rv.msg), `LOAD WEATHER — answered after 6 s (past the wait): revealed first, the weather then BLENDS slowly — 0 jumps (now ${r.wx}; seen after the reveal: ${r.log.visible.map(x => `${x.kind} ${x.msg}`).join(' | ') || 'none'}; the reveal: ${r.rv.msg}; after: ${r.late.map(x => `${x.kind} ${x.msg}`).join(' | ') || 'nothing re-baked'})`); }
  // SP4 — THE WEATHER STILL FLIPPED TO "SEEDED": a JUST ME time jump kept for the tab (the panel's sessionStorage) used to land 0.4 s
  // after the reveal and throw the live answer away for the seeded sky; now it is applied BEFORE the reveal and the clock it moves keeps
  // the live weather (the readout says so), 0 changes after
  { const r = await wxLoad('justme', { delay: 3000, cached: true, justme: '2026-10-31T21:30' });
    const pr = r.log.rows.find(x => x.kind === 'panel');
    const vis = r.log.visible, onlyHol = vis.every(x => x.kind === 'bake' && /^(neon|facade|neon, facade|facade, neon)$/.test((x.msg.match(/· ([a-z, ]+)$/) || [])[1] || ''));
    ok(/wx overcast/.test(r.rv.msg) && /the panel moved the clock, the weather is live/.test(r.rv.msg) && pr && /before the reveal/.test(pr.msg) && !r.log.rows.some(x => /none \(seeded\)/.test(x.msg)) && onlyHol,
      `LOAD WEATHER — a stored JUST ME time jump: applied before the reveal (${pr ? pr.msg : 'no panel row'}), the live overcast KEPT (${r.rv.msg}), never "none (seeded)", no sky / cloud / lit change after (${vis.map(x => `${x.kind} ${x.msg}`).join(' | ') || 'none'})`);
    // (SP4's known re-bake ~1 s after the reveal — the roof board's game + the party windows decided late — fixed in 9f: both are
    // decided before the reveal now; kept a timing check for CI's slow machine)
    okT(vis.length === 0, `LOAD WEATHER — a stored JUST ME jump into a holiday night: 0 changes after the reveal (${vis.map(x => `${x.kind} ${x.msg}`).join(' | ') || 'none'})`); }
  { const r = await wxLoad('intro', { delay: 300, cached: false, intro: true });
    ok(r.log.visible.length === 0, `LOAD — THE FULL POWER-ON (&intro=1: the screen's entrance, the fonts, the dock easing in): 0 changes after the reveal (${r.rv.msg}; ${r.log.visible.map(x => `${x.kind} ${x.msg}`).join(' | ') || 'none'})`); }
});
// ---- PART 8a: THE PROMENADE — the layout the owner approved, the season by the real date (+ forced), the lamps' pools baked into
// the setts at night, the implied road (a car's headlights; off by the owner's flag)
G('promenade', async () => {
  const px = (p, X, Y) => ev(p, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth; res(Array.from(cv.getContext('2d').getImageData(Math.round(${X} * k), Math.round(${Y} * k), 1, 1).data).slice(0, 3)); }))`);
  const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const settle = p => waitFor(p, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled', 20000);
  { const Q = await open({ slot: 'pr1', qs: `${NIGHT}&force=no-holiday-props`, view: [402, 874] });   // (WIN: Oct 21 is in the farm delivery's window — the hydrant's jack-o'-lantern glow would land on the pools' probe)
    await harborUp(Q.page); await settle(Q.page);
    await waitFor(Q.page, 'window.__district.harbor().promenade.lampK >= 0.99', 'the lamps fully on (baked)', 25000); await settle(Q.page);
    const pr = await ev(Q.page, 'window.__district.harbor().promenade');
    ok(pr.season === 'autumn' && !pr.flag && pr.impliedOn, `THE PROMENADE (Oct 21): autumn by the real date, no flag, the implied road on (${pr.season})`);
    // (PROM — NO LAMPPOSTS: the implied lamps only, below the screen, nothing of them drawn; the cab stand + the hydrant above the dock)
    ok(pr.lamps.length >= 4 && pr.lamps.every(l => l.kind === 'implied' && l.heads === 0 && l.at[1] > 874), `PROM — NO LAMPPOSTS: ${pr.lamps.length} implied lamps below the screen, none drawn`);
    { const dockY = await ev(Q.page, 'window.__district.harbor().cam.dock.y');
      ok(pr.cabStand && pr.cabStand[1] < dockY - 8 && pr.hydrant && pr.hydrant[0] < 26 && pr.hydrant[1] < dockY, `PROM — THE CAB STAND (${pr.cabStand}) + THE HYDRANT at the left curb (${pr.hydrant}) above the dock (${dockY})`); }
    // (FP2: the framing maple + the curb crabapple over the bench — the red maple by the blade is gone)
    ok(pr.trees.length >= 2 && pr.trees.some(t => t.kind === 'maple') && pr.trees.some(t => t.kind === 'crab') && pr.trees.every(t => t.at[0] - t.r >= 0 && t.at[0] + t.r <= 402), `THE TREES: ${pr.trees.map(t => t.kind).join(', ')} — none cut by the screen's edges`);
    const door = await ev(Q.page, 'window.__district.harbor().door');
    ok(pr.medallion[0] > door.x + 40 && pr.medallion[1] < 758, `THE MEDALLION in the open plaza, right of the door (${pr.medallion[0]} vs the door ${Math.round(door.x)})`);
    // (a patch's mean, 14 × 4 pt: the setts' joints + tops average out)
    // (a patch's mean, once two frames in a row agree — FP: right after the bake settles the city is still fading in)
    const patchOn = (p, X, Y) => ev(p, `new Promise(res => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth; let last = null, n = 0; const f = () => { const d = cv.getContext('2d').getImageData(Math.round((${X} - 7) * k), Math.round((${Y} - 2) * k), Math.round(14 * k), Math.round(4 * k)).data; let r = 0, g = 0, b = 0, m = d.length / 4; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; } const c = [r / m, g / m, b / m]; if ((last && Math.abs(c[0] + c[1] + c[2] - last[0] - last[1] - last[2]) < 3) || ++n > 40) res(c); else { last = c; requestAnimationFrame(f); } }; requestAnimationFrame(f); })`);
    const patch = (X, Y) => patchOn(Q.page, X, Y);
    const a = lum(await patch(pr.pool.lit[0], pr.pool.lit[1]));
    // the same patch with the lamps' pools switched off (&force=no-lamp-light, the A/B): the pool is the lamps' light, the ground dim
    const O = await open({ slot: 'pr1b', qs: `${NIGHT}&force=no-lamp-light,no-holiday-props`, view: [402, 874] });
    await harborUp(O.page); await settle(O.page);
    const b = lum(await patchOn(O.page, pr.pool.lit[0], pr.pool.lit[1]));
    await O.ctx.close();
    ok(a > b * 1.4 && b > 4, `THE POOLS (PROM: the implied lamps' at the front curb, at ${pr.pool.lit.join(",")}) ${a.toFixed(0)} lit vs ${b.toFixed(0)} unlit — a clear pool on a dim (never black) ground`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}promenade-night-402x874.png` });
    // FP — THE CROSSING: the stop lights + the WALK / WAIT lantern in step on the city's clock; the lit pane glowing, the other dark
    { await waitFor(Q.page, 'window.__district.harbor().crossing.lit', 'the lantern lit (not in a blink off half)', 5000);
      const cr = await ev(Q.page, 'window.__district.harbor().crossing'), ln = cr.lantern;
      const litP = ln && ln.panes[cr.walk === 'walk' ? 1 : 0], offP = ln && ln.panes[cr.walk === 'walk' ? 0 : 1];
      const maxLum = q => ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, d = cv.getContext('2d').getImageData(Math.round(${q.x} * k), Math.round(${q.y} * k), Math.max(1, Math.round(${q.w} * k)), Math.max(1, Math.round(${q.h} * k))).data; let m = 0; for (let i = 0; i < d.length; i += 4) m = Math.max(m, 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]); res(m); }))`);
      const lit = ln ? await maxLum(litP) : 0, dark = ln ? await maxLum(offP) : 0;
      ok(ln && cr.heads.every(h => h && h.state === cr.road) && (cr.walk !== 'walk' || cr.road === 'red') && ln.letter > 6, `THE CROSSING: both heads ${cr.road}, the lantern ${cr.walk.toUpperCase()}${cr.blink ? ' (blinking)' : ''} — letters ${ln && ln.letter.toFixed(1)} pt`);
      ok(lit > 170 && lit > dark + 60, `THE LANTERN: the lit ${litP && litP.word} pane glows (max ${lit.toFixed(0)}) over the unlit ${offP && offP.word} (${dark.toFixed(0)})`); }
    await Q.ctx.close(); }
  // the implied road: a car passing (forced); the owner's flag switches the road off; a forced season
  { const Q = await open({ slot: 'pr2', qs: `${NIGHT}&force=road-pass,season-winter`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, '!!window.__district.harbor().road.pass', 'a car passing on the implied road', 20000);
    const rd = await ev(Q.page, 'window.__district.harbor().road'), pr = await ev(Q.page, 'window.__district.harbor().promenade');
    ok(rd.pass && Math.abs(rd.pass.dir) === 1 && pr.season === 'winter', `THE IMPLIED ROAD: a car passing (${rd.pass && rd.pass.id}, dir ${rd.pass && rd.pass.dir}); &force=season-winter → ${pr.season}`);
    await Q.ctx.close(); }
  // FP2 — THE STREET UNDER THE DOCK (full-bleed) + THE MOTORCAR: with the dock shown no car is drawn; at rest the band is a finished
  // street (not the old flat asphalt) and the forced pass's car rolls across it, inside the band; the dock back → the car gone
  { const Q = await open({ slot: 'pr5', qs: `${NIGHT}&force=road-pass`, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    await waitFor(Q.page, '!!window.__district.harbor().road.pass', 'a pass under way', 20000);
    const r0 = await ev(Q.page, 'window.__district.harbor().road');
    ok(r0.vis === 0 && !r0.car, `FP2 — THE DOCK SHOWN: no car drawn (vis ${r0.vis}) — only the implied light`);
    await ev(Q.page, 'window.__district.idle()');
    // (9e — THE STREET IS A STAGE: the crossing already under way when the dock faded never pops in mid-street — the NEXT one, begun at rest,
    // is the one seen (a forced pass every slot: within ~40 s))
    const rIdle = await ev(Q.page, 'window.__district.harbor().road');
    ok(rIdle.vis < 0.05, `9e — a crossing begun under the dock stays hidden when it fades (vis ${rIdle.vis}) — never a car popping in mid-street`);
    await waitFor(Q.page, 'window.__district.isIdle() && window.__district.harbor().road.vis >= 0.99', 'the dock at rest, the car visible', 45000);
    const cam = await ev(Q.page, 'window.__district.harbor().cam');
    // the band's texture: the setts + the rails (the old asphalt was one flat tone: σ ≈ 2)
    const band = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, y0 = ${cam.dock.y} + 14, h = 874 - 8 - y0;
      const d = cv.getContext('2d').getImageData(Math.round(20 * k), Math.round(y0 * k), Math.round(362 * k), Math.round(h * k)).data; let s = 0, s2 = 0, n = 0;
      for (let i = 0; i < d.length; i += 16) { const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; s += l; s2 += l * l; n++; } const m = s / n; res({ m, sd: Math.sqrt(Math.max(0, s2 / n - m * m)) }); }))`);
    ok(band.sd > 5 && band.m > 14, `FP2 — THE STREET at rest: the band under the dock is cobbled (σ ${band.sd.toFixed(1)}, mean ${band.m.toFixed(0)}) — never the old flat grey, never black`);
    await waitFor(Q.page, '!!window.__district.harbor().road.car', 'the motorcar on screen', 16000);
    const car = (await ev(Q.page, 'window.__district.harbor().road')).car;
    ok(car.drawn && car.top >= cam.dock.y - 1 && car.y <= 874 && car.h > 26 && car.h < 56 && car.w / car.h > 2.0, `FP2 + POL4 — THE MOTORCAR (${car.model}): ${car.look}, dir ${car.dir}, ${car.w.toFixed(0)} × ${car.h.toFixed(0)} pt, roof ${car.top.toFixed(0)} under the dock's top ${cam.dock.y}, wheels ${car.y.toFixed(0)}`);
    const fast = await ev(Q.page, 'window.__district.harbor().rate.fast');
    ok(fast !== '', `FP2 — 60 fps while it shows (its wheels; the reason now: ${fast} — 'car' when nothing else asks)`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}street-car-night-402x874.png` });
    await tapAt(Q.page, 30, 300);
    // (9e — the owner, Oct 26 DECIDED: a scene ALREADY UNDER WAY is never cut, snapped or faded — the dock draws ON TOP and the car drives on
    // to its natural end (was FP2: the car gone at once); the tap's dock fades again in ~2 s — THE QUICK FADE)
    await sleep(300);
    const back = await ev(Q.page, '({ idle: window.__district.isIdle(), vis: window.__district.harbor().road.vis, quick: window.__district.quickIdle() })');
    ok(!back.idle && back.vis >= 0.99, `9e — THE DOCK BACK over a crossing: the car drives on under it (vis ${back.vis}) (the quick fade: the stage9e check — this page has no &idle=1)`);
    await Q.ctx.close(); }
  { const Q = await open({ slot: 'pr3', qs: `${NIGHT}&force=no-implied-road`, view: [402, 874] });
    await harborUp(Q.page);
    const pr = await ev(Q.page, 'window.__district.harbor().promenade');
    ok(pr.impliedOn === false, 'THE IMPLIED ROAD OFF (&force=no-implied-road): the setts run to the foot');
    await Q.ctx.close(); }
  // by day: the shot (the owner's review)
  { const Q = await open({ slot: 'pr4', qs: `when=2026-10-22T12:30${GR}`, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    const pr = await ev(Q.page, 'window.__district.harbor().promenade');
    ok(pr.lampK === 0, `BY DAY: no lamp light baked (${pr.lampK})`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}promenade-noon-402x874.png` });
    await Q.ctx.close(); }
});
// ================================================================ NIGHT-A — THE NIGHT LIGHT (core/harbor-light.js; docs/harbor/passes/night-a.md)
G('light', async () => {
  const P = 'window.__district.harbor()';
  // ---- THE BRIGHTNESS LADDER (the owner, Oct 29: "the neon sign + the skyline neon > the speakeasy windows > the shopfront > the
  // promenade wash > the base"), measured on the real composited screen at the owner's 402×660 at 3× (the DOM sign + every canvas): the
  // sign's tubes (p97 of its rect), the skyline's neon (p99.5 of the band right of the speakeasy), the lit windows (the 3 brightest panes'
  // p97 — the room's lit glass, not the dancers' silhouettes over it), the shopfront's ground, the open promenade, its back by the railing (means) — nobody on the promenade (no-people, no-wildlife).
  // BRIGHTNESS = the max channel (HSV's value): a light's colour counts — luma reads a saturated magenta pane (a party room) as ~75
  const measure = async (page, lad) => {
    const b64 = await page.screenshot({ encoding: 'base64' });
    return page.evaluate((b64, lad) => new Promise(res => { const im = new Image(); im.onload = () => {
      const o = document.createElement('canvas'); o.width = im.width; o.height = im.height; const x = o.getContext('2d'); x.drawImage(im, 0, 0); const d = im.width / innerWidth;
      const stat = (r, q) => { if (!r || !(r.w >= 1) || !(r.h >= 1)) return null; const X0 = Math.max(0, Math.round(r.x * d)), Y0 = Math.max(0, Math.round(r.y * d)), X1 = Math.min(o.width, Math.round((r.x + r.w) * d)), Y1 = Math.min(o.height, Math.round((r.y + r.h) * d)); if (X1 <= X0 || Y1 <= Y0) return null;
        const a = x.getImageData(X0, Y0, X1 - X0, Y1 - Y0).data, v = []; for (let i = 0; i < a.length; i += 4) v.push(Math.max(a[i], a[i + 1], a[i + 2])); v.sort((p, q2) => p - q2);
        return +(q == null ? v.reduce((s, y) => s + y, 0) / v.length : v[Math.min(v.length - 1, Math.floor(v.length * q))]).toFixed(1); };
      const wins = (lad.windows || []).map(r => stat(r, 0.97)).filter(v => v != null).sort((p, q) => q - p).slice(0, 3);
      // (the buttons: the ring band 0.6–0.9 of a dock ring's radius / 0.8–1.05 of a corner disc's — the mean LUMA; a word's p90 luma)
      const all = x.getImageData(0, 0, o.width, o.height).data, Yi = i => 0.2126 * all[i] + 0.7152 * all[i + 1] + 0.0722 * all[i + 2];
      const ann = (r, f0, f1) => { if (!r) return null; const cx = (r.x + r.w / 2) * d, cy = (r.y + r.h / 2) * d, R = r.w / 2 * d; let s = 0, n = 0; for (let yy = Math.floor(cy - R * f1); yy < cy + R * f1; yy++) for (let xx = Math.floor(cx - R * f1); xx < cx + R * f1; xx++) { const q = Math.hypot(xx - cx, yy - cy) / R; if (q < f0 || q > f1 || xx < 0 || yy < 0 || xx >= o.width || yy >= o.height) continue; s += Yi((yy * o.width + xx) * 4); n++; } return n ? +(s / n).toFixed(1) : null; };
      const word = r => { if (!r) return null; const v = []; for (let yy = Math.round(r.y * d); yy < (r.y + r.h) * d; yy++) for (let xx = Math.round(r.x * d); xx < (r.x + r.w) * d; xx++) v.push(Yi((yy * o.width + xx) * 4)); v.sort((a, b) => a - b); return v.length ? +v[Math.floor(v.length * 0.9)].toFixed(1) : null; };
      const B = lad.btns || {};
      const btn = B.join ? { join: { ring: ann(B.join, 0.6, 0.9), word: word(B.jl) }, host: { ring: ann(B.host, 0.6, 0.9), word: word(B.hl) }, menu: ann(B.menu, 0.8, 1.05), music: ann(B.music, 0.8, 1.05) } : null;
      res({ btn, sign: stat(lad.sign, 0.97), skyline: stat(lad.skyline, 0.995), windows: wins.length ? +(wins.reduce((s, v) => s + v, 0) / wins.length).toFixed(1) : null, shop: stat(lad.shop), wash: stat(lad.wash), base: stat(lad.base) }); };
      im.src = 'data:image/png;base64,' + b64; }), b64, lad);
  };
  // (plain September nights: no holiday dressing — Halloween week's glowing jack-o'-lanterns stand on the side door's steps, inside the
  // shopfront's probe)
  for (const [tag, when] of [['night', '2026-09-24T22:00'], ['party', '2026-09-26T23:00']]) {
    const got = {};
    // (NIGHT-B: + THE STAGE LIGHT — the new light with &stage=1: the neon must still be the brightest thing)
    for (const mode of ['old', 'new', 'stage']) {
      const Q = await open({ slot: `lad${tag}${mode}`, qs: `when=${when}${GR}&wx=clear&light=${mode === 'stage' ? 'new&stage=1' : mode}&force=no-people,no-wildlife`, view: [402, 660], dpr: 3 });
      await harborUp(Q.page);
      await waitFor(Q.page, `${P}.speakeasy.k > 0.9 && !${P}.pending && !${P}.fading`, 'the rooms lit + settled', 25000).catch(() => {});
      await sleep(700);
      const lad = await ev(Q.page, `(() => { const l = ${P}.ladder; return l ? { ...l, windows: ${P}.speakeasy.windows().map(q => q.rect) } : null; })()`);
      if (lad) lad.btns = await ev(Q.page, `(() => { const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }; return { join: r('.nd-joinring'), host: r('.nd-hostbtn'), jl: r('.nd-joinring .nd-host-label'), hl: r('.nd-hostbtn .nd-host-label'), menu: r('.menu-btn'), music: r('.music-btn') }; })()`);
      got[mode] = lad ? { mode: lad.mode, ...(await measure(Q.page, lad)) } : null;
      if (SHOTS) await Q.page.screenshot({ path: `${OUT}light-ladder-${tag}-${mode}-402x660.png` });
      await Q.ctx.close();
    }
    const n = got.new || {}, o = got.old || {}, top = Math.min(n.sign ?? 0, n.skyline ?? 0), row = v => `sign ${v.sign} · skyline ${v.skyline} · windows ${v.windows} · shop ${v.shop} · wash ${v.wash} · base ${v.base}`;
    ok(n.mode === 'new' && o.mode === 'old', `NIGHT-A THE LIGHT's SWITCH: &light=old → ${o.mode}, &light=new → ${n.mode} (${tag})`);
    if (tag === 'night') ok(n.btn && n.btn.host.ring >= n.btn.join.ring * 0.88 && n.btn.host.word >= n.btn.join.word * 0.88 && n.btn.menu >= n.btn.join.ring * 0.4 && n.btn.menu <= n.btn.join.ring * 0.8 && n.btn.music >= n.btn.join.ring * 0.4 && n.btn.music <= n.btn.join.ring * 0.8,
      `NIGHT-A THE BUTTONS AT NIGHT (402×660 at 3×, luma): JOIN ring ${n.btn && n.btn.join.ring} / word ${n.btn && n.btn.join.word} = HOST ring ${n.btn && n.btn.host.ring} / word ${n.btn && n.btn.host.word} (within 12 %); the corner rings ☰ ${n.btn && n.btn.menu} · ♫ ${n.btn && n.btn.music} at ~⅔ of the dock's`);
    ok(top > n.windows && n.windows > n.shop && n.shop > n.wash && n.wash > n.base, `NIGHT-A THE BRIGHTNESS LADDER (${tag}, 402×660 at 3×, the new light): ${row(n)} — the sign + the skyline > the windows > the shopfront > the wash > the base (the old light: ${row(o)})`);
    { const g = got.stage || {}, tg = Math.min(g.sign ?? 0, g.skyline ?? 0); ok(tg > g.windows && g.windows > g.shop && g.shop > g.wash && g.wash > g.base, `NIGHT-B THE BRIGHTNESS LADDER with THE STAGE LIGHT (${tag}, 402×660 at 3×): ${row(g)} — the neon still the brightest`); }
  }
});

// ================================================================ NIGHT-B — THE STREET PARTY (ONLY=streetparty; the `city` cloud job)
// core/harbor-streetparty.js: the party night's pockets, the dance breaks (a seeded party song clock — every phone the same), the conga,
// the spill into the street (the front street holds), the bench dancers. Saturday Oct 24's 21:43:50 break is a CONGA (the unit test
// lists the night); the page joins it ~55 s in.
G('streetparty', async () => {
  const P = 'window.__district.harbor()';
  { const Q = await open({ slot: 'sp1', qs: `when=2026-10-24T21:44:45${GR}&wx=clear`, view: [402, 660] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.people.party && ${P}.people.party.brk && ${P}.people.members.some(m => m.kind === 'conga')`, 'the conga break on', 30000);
    const pp = await ev(Q.page, `${P}.people`), ms = pp.members, br = pp.party.brk;
    const pockets = ms.filter(m => m.kind === 'mingler'), dancing = pockets.filter(m => m.pose === 'wands'), conga = ms.filter(m => m.kind === 'conga');
    ok(br.kind === 'conga' && pp.party.crowd > 0.5, `THE STREET PARTY: a ${br.kind} break at the warm-up's end (crowd ${pp.party.crowd.toFixed(2)})`);
    ok(pockets.length >= 8 && dancing.length >= pockets.length * 0.7, `ALMOST EVERYONE DANCES: ${dancing.length} of ${pockets.length} in the pockets on the beat`);
    ok(conga.length >= 6, `THE BIG CONGA: ${conga.length} in the line`);
    const street = ms.filter(m => m.kind === 'spiller' && m.z < 36), bench = ms.filter(m => m.kind === 'bencher' && m.y > 0.3);
    ok(street.length >= 2, `INTO THE STREET: ${street.length} dancing in the street's upper band`);
    ok(bench.length >= 1 && bench.length <= 3, `DANCERS ON THE BENCH: ${bench.length} up on the cab stand's bench`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}streetparty-conga-402x660.png` });
    // ---- THE CROWD's SOUNDS (screens/harbor/sounds.js + people.js#crowdSounds): after the first tap, the walla bed under the pockets
    // + one-shots from their places (a laugh every ~4–12 s; the cheers as a break starts) — through the city's own sound player
    const SND = 'window.__district.harbor().sounds';
    await tapAt(Q.page, 30, 300);
    await waitFor(Q.page, `${SND}.player.loops.some(l => l.slot === 'party-walla' && l.voices > 0)`, 'the walla sounding', 25000).catch(() => {});
    await waitFor(Q.page, "import('/js/audio/city-sound.js').then(m => m.cityLog.some(x => /^party-(laugh|cheer|clink|group)$/.test(x.slot)))", 'a crowd one-shot', 25000).catch(() => {});
    const au = await ev(Q.page, `import('/js/audio/city-sound.js').then(m => ({ loops: ${SND}.player.loops.filter(l => /^party-walla/.test(l.slot)).map(l => l.slot + ' ' + l.voices + ' ' + (+l.gain).toFixed(3)), shots: m.cityLog.filter(x => /^party-/.test(x.slot)).map(x => x.slot) }))`);
    okF(au.loops.some(l => l.startsWith('party-walla ')) && au.shots.length >= 1, `THE CROWD's SOUNDS: the walla (${au.loops.join(', ') || 'none'}) + ${au.shots.length} one-shots (${[...new Set(au.shots)].join(', ')})`);
    await Q.ctx.close(); }
  // ---- &force=dance&dance=bounce on a THURSDAY: the preview's own street party + a bounce break within ~10 s
  { const Q = await open({ slot: 'sp2', qs: `when=2026-10-22T21:30${GR}&wx=clear&force=dance&dance=bounce`, view: [402, 660] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.people.party && ${P}.people.party.brk && ${P}.people.party.k > 0.9`, 'the forced break on', 30000);
    const pp = await ev(Q.page, `${P}.people`);
    ok(pp.party.brk.kind === 'bounce' && pp.members.some(m => m.dance === 'bounce'), `&force=dance&dance=bounce: a ${pp.party.brk.kind} break, ${pp.members.filter(m => m.dance === 'bounce').length} bouncing`);
    await Q.ctx.close(); }
  // ---- NIGHT-B — THE STAGE LIGHT (&stage=1; OFF by default): on a plain night the street under the dock ~⅓ darker than the promenade's
  // front (luma means of the real screen — never black), today's light (&stage=0) about level
  { const lum = async page => { const b64 = await page.screenshot({ encoding: 'base64' }); return page.evaluate(b64 => new Promise(res => { const im = new Image(); im.onload = () => {
      const o = document.createElement('canvas'); o.width = im.width; o.height = im.height; const x = o.getContext('2d'); x.drawImage(im, 0, 0); const d = im.width / innerWidth;
      const m = (x0, y0, x1, y1) => { const a = x.getImageData(x0 * d, y0 * d, (x1 - x0) * d, (y1 - y0) * d).data; let s = 0; for (let i = 0; i < a.length; i += 4) s += 0.2126 * a[i] + 0.7152 * a[i + 1] + 0.0722 * a[i + 2]; return s / (a.length / 4); };
      res({ prom: m(150, 505, 260, 525), street: m(120, 628, 280, 656) }); }; im.src = 'data:image/png;base64,' + b64; }), b64); };
    const r = {};
    for (const v of ['0', '1']) { const Q = await open({ slot: `stg${v}`, qs: `when=2026-10-22T22:00${GR}&wx=clear&stage=${v}&force=no-people,no-wildlife`, view: [402, 660] }); await harborUp(Q.page); await settled(Q.page); await sleep(3500); r[v] = await lum(Q.page); await Q.ctx.close(); }
    const k0 = r['0'].street / r['0'].prom, k1 = r['1'].street / r['1'].prom;
    ok(k1 / k0 >= 0.55 && k1 / k0 <= 0.85 && r['1'].street > 25, `THE STAGE LIGHT: the street ~⅓ darker against the promenade's front — ${(k1 * 100).toFixed(0)} % with &stage=1 vs ${(k0 * 100).toFixed(0)} % today (×${(k1 / k0).toFixed(2)}; luma ${r['1'].street.toFixed(0)} — never black)`); }
  // ---- a plain Thursday: no street party
  { const Q = await open({ slot: 'sp3', qs: `when=2026-10-22T22:30${GR}&wx=clear`, view: [402, 660] });
    await harborUp(Q.page);
    const pp = await ev(Q.page, `${P}.people`);
    ok(!pp.members.some(m => m.sp) && !(pp.party && pp.party.crowd), `A THURSDAY: no street party (${pp.members.filter(m => m.sp).length})`);
    await Q.ctx.close(); }
});
