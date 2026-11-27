// FREEFALL F4B — THE SHARE CARD (js/games/freefall/share.js + shot.js — docs/freefall.md "THE SHARE CARD"), on the LOCAL server (NEVER THE
// LIVE SITE; scripts/serve.mjs is enough — no emulators). REAL RUNS are played on the test page /freefall-play (the checks' own hand —
// window.__ffPlay.auto) to each end; the stage takes THE RUN's REAL END FRAME (shot.js — a beat after the end, per cause), and THE CARD is
// drawn IN THE PAGE by the same functions the cartridge's SHARE draws (share.js#drawFfCard + loadLogo — imported by THIS check: the page's
// own module graph never holds them, tests/freefall-play.test.mjs):
//   · every cause — HIT THE RED · THE LIGHTS WENT OUT · YOU HIT THE BOTTOM (the finish: GOLD) · TIME'S UP (`--cap`: a real 3-minute match
//     run to the bell — off by default) — + a MATCH place line (MATCH · 2ND OF 4, a 12-letter name) + the worst case (0 FLOORS on the
//     rooftop) + THE TRENCH (a 3-digit number), NIGHT + DAY, each at 1080 × 1350 AND downscaled to 360 px wide (+ the raw frame)
//   · checks: the frame is taken BEFORE the end card and is the run's own (its cause, its floor; the ball where shot.js puts it); the card
//     is 1080 × 1350; the words per cause; the edge teal (GOLD for the finish); the number white-hot; THE READABILITY AT 360 px — the
//     cause's tab, the number, FLOORS, the area, BLAZES, the name, NEONSPEAKEASY.COM, the mode line: big enough + bright on their ground;
//     the link's 540 × 675 picture fits the server's cap; the page asked the server NOTHING (0 requests to /api/).
//   node tests/integration/freefall-share.mjs "<chromium>" [outDir] [--cap] [--only=red,dark,…] [--looks=night,day]
//     outDir: C:\Users\benja\Downloads\NEON\freefall-f4b\share  (never the repo)      E2E_BASE=http://localhost:5183 for a pass's own server
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null, CAP = argv.includes('--cap');
const ONLY = (argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean), LOOKS = ((argv.find(a => a.startsWith('--looks=')) || '').slice(8) || 'night,day').split(',').filter(Boolean);
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 300000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (p, js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(40); } return false; };

async function open(q) {
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [], reqs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('request', r => { if (!r.url().startsWith('data:') && !r.url().startsWith('blob:')) reqs.push(r.url()); });
  const cdp = await p.createCDPSession();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await p.goto(guardUrl(`${BASE}/freefall-play${q}`, 'freefall-play'), { waitUntil: 'load' });
  const up = await waitFor(p, "!!window.__ffPlay && !!document.querySelector('canvas.ff-canvas') && window.__ffPlay.state().info.frames > 3");
  return { p, cdp, errs, reqs, up, close: () => ctx.close() };
}
/** a REAL finger: the first touch starts the run */
async function start(t) {
  const pt = { x: 195, y: 590, id: 1, radiusX: 4, radiusY: 4, force: 1 };
  await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
  await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  return waitFor(t.p, 'window.__ffPlay.state().started');
}
const auto = (p, mode) => p.evaluate(m => { window.__ffPlay.auto = m; }, mode);
/** `--beats=<run>:<ms>,<ms>,…` (TUNING shot.js#SHOT_AT — no checks): the SAME frame the stage would keep, taken at each of these beats
 *  after the run's end (a frame callback that runs right after the stage's own: the drawing buffer is still that frame's) → ONE contact
 *  sheet beats-<look>-<run>.jpg, the beats left to right, top to bottom */
const BEATS = Object.fromEntries(argv.filter(a => a.startsWith('--beats=')).map(a => { const [n, l] = a.slice(8).split(':'); return [n, String(l || '').split(',').map(Number).filter(x => x >= 0)]; }));
async function beats(t, id, list) {
  const sheet = await t.p.evaluate(async list => {
    const S = await import('/js/games/freefall/shot.js'), P = window.__ffPlay, got = [];
    await new Promise(done => {
      let t0 = 0, i = 0;
      const tick = now => {
        if (!t0 && P.state().over) t0 = now;
        if (t0 && i < list.length && now - t0 >= list[i]) { const cause = P.result().cause; got.push(P.view.snap(S.SHOT_BOX.w, S.SHOT_BOX.h, (sw, sh, bx, by, col) => S.shotCrop(sw, sh, bx, by, S.ballAt(cause), col))); i++; }
        if (i >= list.length) done(); else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const cols = Math.min(4, got.length), rows = Math.ceil(got.length / cols), w = 492, h = 396, cv = document.createElement('canvas');
    cv.width = cols * w; cv.height = rows * h;
    const c = cv.getContext('2d');
    got.forEach((g, k) => { const x = (k % cols) * w, y = Math.floor(k / cols) * h; if (g) c.drawImage(g, x, y, w, h); c.fillStyle = '#000'; c.fillRect(x, y, 96, 30); c.fillStyle = '#fff'; c.font = '700 22px monospace'; c.fillText(`${list[k]} ms`, x + 6, y + 23); });
    return cv.toDataURL('image/jpeg', 0.88);
  }, list);
  if (OUT) writeFileSync(join(OUT, `beats-${id}.jpg`), Buffer.from(sheet.split(',')[1], 'base64'));
  console.log(`     ${id}: the beats ${list.join(' · ')} ms → beats-${id}.jpg`);
}

/** THE RUNS — [name, the page's query, how the checks' hand plays it to its end, the card's own fields (the page knows no room: a match's
 *  place + the name are the card's inputs), what it must say] */
const RUNS = [
  ['red', l => `?seed=shareA&look=${l}`, async t => { await auto(t.p, 'gap'); await waitFor(t.p, 'window.__ffPlay.state().floor >= 46', 60000); await auto(t.p, 'red'); }, { mode: 'solo', name: 'BEN' }, { cause: 'red', line: 'HIT THE RED', mode: 'SOLO' }],
  ['dark', l => `?seed=shareB&look=${l}&floor=86`, async t => { await auto(t.p, 'safe'); }, { mode: 'solo', name: 'BEN' }, { cause: 'dark', line: 'THE LIGHTS WENT OUT', mode: 'SOLO', area: 'THE SPEAKEASY' }],
  ['made', l => `?seed=shareC&look=${l}&floor=198&mode=match`, async t => { await auto(t.p, 'gap'); }, { mode: 'match', place: 1, of: 4, name: 'BEN' }, { cause: 'made', line: 'YOU HIT THE BOTTOM', mode: 'MATCH · 1ST OF 4', gold: true, area: 'THE BOTTOM', floor: 200 }],
  ['match', l => `?seed=shareD&look=${l}&floor=128&mode=match`, async t => { await auto(t.p, 'play'); await waitFor(t.p, 'window.__ffPlay.state().floor >= 131', 60000); await auto(t.p, 'red'); }, { mode: 'match', place: 2, of: 4, name: 'CHRISTOPHERS' }, { cause: 'red', line: 'HIT THE RED', mode: 'MATCH · 2ND OF 4', area: 'UNDER THE HARBOR' }],
  ['zero', l => `?seed=shareF&look=${l}`, async t => { await auto(t.p, 'safe'); }, { mode: 'solo', name: 'BEN' }, { cause: 'dark', line: 'THE LIGHTS WENT OUT', mode: 'SOLO', area: 'THE ROOFTOP', floor: 0 }],
  ['trench', l => `?seed=shareG&look=${l}&floor=236`, async t => { await auto(t.p, 'play'); await waitFor(t.p, 'window.__ffPlay.state().floor >= 238', 60000); await auto(t.p, 'red'); }, { mode: 'solo', name: 'BEN' }, { cause: 'red', line: 'HIT THE RED', mode: 'SOLO', area: 'THE TRENCH' }],
  // TIME'S UP: a real match run played to the bell (3 minutes — `--cap`; night only). The hand plays 1.6 s, then stays on safe ground
  // 0.8 s, over and over: ahead of the darkness (a floor every 2 s), never at THE BOTTOM before the bell (plain 'play' got to floor 199)
  ...(CAP ? [['cap', l => `?seed=shareE&look=${l}&mode=match`, async t => { for (let k = 0; k < 90; k++) { await auto(t.p, 'play'); await sleep(1600); await auto(t.p, 'safe'); await sleep(800); if (await t.p.evaluate(() => window.__ffPlay.state().over)) break; } },{ mode: 'match', place: 3, of: 5, name: 'BEN' }, { cause: 'cap', line: 'TIME’S UP', mode: 'MATCH · 3RD OF 5' }, ['night'], 230000]] : []),
];

for (const [name, query, play, extra, want, looks = LOOKS, endMs = 60000] of RUNS) {
  if (ONLY.length && !ONLY.includes(name)) continue;
  for (const look of looks.filter(l => LOOKS.includes(l) || looks !== LOOKS)) {
    const id = `${look}-${name}`, t = await open(query(look));
    ok(t.up, `${id}: the page is up`);
    await start(t);
    await play(t);
    if (BEATS[name]) { await beats(t, id, BEATS[name]); await t.close(); continue; }
    const ended = await waitFor(t.p, 'window.__ffPlay.state().shown', endMs);
    const s = await t.p.evaluate(() => { const S = window.__ffPlay.state(), x = window.__ffPlay.shot(); return { cause: window.__ffPlay.result().cause, floor: S.floor, blazes: window.__ffPlay.result().blazes, look: S.look, shot: x ? { cause: x.cause, made: x.made, floor: x.floor, blazes: x.blazes, look: x.look, key: x.key, seed: S.seed, w: x.canvas.width, h: x.canvas.height, ballX: x.ballX, ballY: x.ballY } : null }; });
    ok(ended && s.cause === want.cause, `${id}: the run ended — ${s.cause} at floor ${s.floor} (${s.blazes} blazes)`);
    if (!ended || !s.shot) { ok(false, `${id}: THE FRAME was taken before the end card`); await t.close(); continue; }
    ok(s.shot.cause === s.cause && s.shot.floor === s.floor && s.shot.blazes === s.blazes && s.shot.look === look && s.shot.key === s.shot.seed, `${id}: THE FRAME is there as the end card comes — the run's own (${s.shot.cause} · floor ${s.shot.floor} · ${s.shot.look}), kept under the run's key`);
    ok(s.shot.w === 984 && s.shot.h === 792 && Math.abs(s.shot.ballX - 0.5) < 0.06 && s.shot.ballY > 0.2 && s.shot.ballY < 0.62, `${id}: the frame = the card's hero box (${s.shot.w} × ${s.shot.h}), the ball in it at ${s.shot.ballX.toFixed(2)}, ${s.shot.ballY.toFixed(2)}`);
    const before = t.reqs.length;
    const res = await t.p.evaluate(async extra => {
      const H = await import('/js/games/freefall/share.js'), K = await import('/js/games/kit/share-run.js'), D = await import('/js/daily/share.js');
      await D.shareFonts();
      const shot = window.__ffPlay.shot(), logo = await H.loadLogo();
      const run = { floor: shot.floor, blazes: shot.blazes, cause: shot.cause, made: shot.made, ...extra };
      const k = H.ffRunCard(run), cv = H.drawFfCard(run, shot, logo), bare = H.drawFfCard(run, null, logo), c = cv.getContext('2d'), c0 = bare.getContext('2d');
      const B = H.FF_CARD.box, T = H.TYPE, R = cv.ffRow, W = 1080;
      const avg = (g, x, y, w, h, min = 0) => { const d = g.getImageData(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))).data; let r = 0, gg = 0, bl = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] >= min) { r += d[i]; gg += d[i + 1]; bl += d[i + 2]; n++; } return n ? [r / n, gg / n, bl / n].map(Math.round) : [0, 0, 0]; };
      // the frame IS in the box: the picture's free zone differs from the card drawn with no frame
      const a = c.getImageData(B.x + 200, B.y + 120, 600, 260).data, z = c0.getImageData(B.x + 200, B.y + 120, 600, 260).data;
      let diff = 0; for (let i = 0; i < a.length; i += 4) diff += Math.abs(a[i] - z[i]) + Math.abs(a[i + 1] - z[i + 1]) + Math.abs(a[i + 2] - z[i + 2]);
      const out = { w: cv.width, h: cv.height, card: { line: k.line, mode: k.mode, area: k.area, blazes: k.blazes, big: k.big, unit: k.bigUnit, name: k.name, gold: k.gold }, row: R, logo: !!logo, frameDiff: diff / (a.length / 4) / 3 };
      // the edge's lit line (the frame's left side) · the number's hot core · the tab's words
      out.edge = avg(c, B.x - 2, B.y + 300, 5, 200, 300); out.num = avg(c, R.x0, B.y + B.h - T.bigUp - R.px * 0.66, R.bw, R.px * 0.6, 640); out.tab = avg(c, B.x + 36, B.y + 36, 420, 60, 420);
      const scaled = w => { const s = document.createElement('canvas'); s.width = w; s.height = Math.round(w * 1350 / 1080); const x = s.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cv, 0, 0, s.width, s.height); return s; };
      const small = scaled(360), t = small.getContext('2d'), sc = 360 / 1080;
      // THE READABILITY at 360 px: the lettering's lit core against the ground it stands on (a luminance ratio), its cap height in px
      const lum = (r, g, b2) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b2); };
      const ratio = (x, y, w, h) => { const d = t.getImageData(Math.round(x * sc), Math.round(y * sc), Math.max(1, Math.round(w * sc)), Math.max(1, Math.round(h * sc))).data, ls = []; for (let i = 0; i < d.length; i += 4) ls.push(lum(d[i], d[i + 1], d[i + 2])); ls.sort((p, q) => p - q); const hi = ls[Math.floor(ls.length * 0.97)], lo = ls[Math.floor(ls.length * 0.25)]; return (hi + 0.05) / (lo + 0.05); };
      const foot = B.y + B.h, rx = B.x + B.w - 36;
      out.read = {
        mode: { cap: H.HEAD.modePx * 0.72 * sc, ratio: ratio(W / 2 - 330, H.HEAD.modeY - H.HEAD.modePx * 0.8, 660, H.HEAD.modePx * 0.86) },
        cause: { cap: T.causePx * 0.72 * sc, ratio: ratio(B.x + 30, B.y + 88 - T.causePx * 0.8, 440, T.causePx * 0.86) },
        number: { cap: R.px * 0.7 * sc, ratio: ratio(R.x0, foot - T.bigUp - R.px * 0.7, R.bw, R.px * 0.72) },
        floors: { cap: T.unitPx * 0.72 * sc, ratio: ratio(R.x0, foot - T.unitUp - T.unitPx * 0.8, 250, T.unitPx * 0.86) },
        area: { cap: T.sidePx * 0.72 * sc, ratio: ratio(rx - Math.min(R.room, 380), foot - T.sideUp - T.sideLh - T.sidePx * 0.8, Math.min(R.room, 380), T.sidePx * 0.86) },
        blazes: { cap: T.sidePx * 0.72 * sc, ratio: ratio(rx - 300, foot - T.sideUp - T.sidePx * 0.8, 300, T.sidePx * 0.86) },
        name: { cap: H.FF_CARD.namePx * 0.72 * sc, ratio: ratio(W / 2 - 280, H.FF_CARD.nameY - H.FF_CARD.namePx * 0.8, 560, H.FF_CARD.namePx * 0.86) },
        site: { cap: 52 * 0.7 * sc, ratio: ratio(W / 2 - 330, 1284 - 24, 660, 48) },
      };
      const half = await D.halfPng(cv), fit = half ? await K.fitPng(half) : null;
      out.halfKb = half ? half.size / 1024 : -1; out.fitKb = fit ? fit.size / 1024 : -1; out.halfType = half ? half.type : '';
      out.full = cv.toDataURL('image/png'); out.small = small.toDataURL('image/png'); out.frame = shot.canvas.toDataURL('image/jpeg', 0.9);
      // (the card of a phone with NO frame + NO logo — a refresh on the podium, the lettering not loaded: the night's dark + the word in its two neons)
      out.none = H.drawFfCard(run, null, null).toDataURL('image/png');
      return out;
    }, extra);
    const C = res.card;
    ok(res.w === 1080 && res.h === 1350 && res.logo, `${id}: 1080 × 1350, the logo drawn — "${C.mode}" · "${C.line}" · ${C.big} ${C.unit} · "${C.area}" · "${C.blazes}" · ${C.name}`);
    ok(C.line === want.line && C.mode === want.mode && (!want.area || C.area === want.area) && (want.floor == null || C.big === String(want.floor)) && C.gold === !!want.gold, `${id}: the words — ${want.line} · ${want.mode}${want.area ? ` · ${want.area}` : ''}${want.gold ? ' · GOLD' : ''}`);
    ok(res.frameDiff > 3, `${id}: THE REAL FRAME fills the hero box (Δ ${res.frameDiff.toFixed(1)} a channel against the card with no frame)`);
    const isGold = c => c[0] > 200 && c[1] > 140 && c[2] < 170, isTeal = c => c[1] > 170 && c[2] > 170 && c[0] < 170;
    ok(want.gold ? isGold(res.edge) : isTeal(res.edge), `${id}: the frame's ONE neon edge is ${want.gold ? 'GOLD' : 'teal'} (${res.edge})`);
    ok(res.num[0] > 225 && res.num[1] > 225 && res.num[2] > 190, `${id}: the floors white-hot (${res.num})`);
    ok(want.gold ? res.tab[0] > 215 && res.tab[2] < 215 : res.tab[1] > 215 && res.tab[2] > 215, `${id}: the cause's words ${want.gold ? 'gold' : 'teal-white'} — never red (${res.tab})`);
    ok(res.row.room >= 300 && res.row.lines <= 2 && res.row.tab >= 1 && res.row.tab <= 2,`${id}: the number (${Math.round(res.row.bw)} px at ${res.row.px}) leaves the area + the blazes their room (${Math.round(res.row.room)} px, the area on ${res.row.lines} line${res.row.lines === 1 ? '' : 's'})`);
    const MIN = { mode: 9.5, cause: 14, number: 45, floors: 11, area: 11, blazes: 11, name: 13, site: 11.5 };
    for (const k of Object.keys(MIN)) ok(res.read[k].cap >= MIN[k] && res.read[k].ratio >= 3, `${id}: at 360 px wide the ${k} reads — ${res.read[k].cap.toFixed(1)} px caps, ${res.read[k].ratio.toFixed(1)} : 1 on its ground`);
    ok(res.fitKb > 0 && res.fitKb <= 390, `${id}: the link's 540 × 675 picture fits the server's cap (${res.halfType} ${res.halfKb.toFixed(0)} KB → ${res.fitKb.toFixed(0)} KB ≤ 390)`);
    ok(!t.reqs.some(u => new URL(u).pathname.startsWith('/api/')), `${id}: the page asked the server nothing — the run, the frame + the card drawn (${t.reqs.length - before} requests for the card's modules, 0 to /api/)`);
    // SHARE ITSELF, BEHIND THE SWITCH (once — the night's red run): the cartridge's own calls (warmShare while the end screen is read, then
    // shareRun at the tap) on a game made of this run's numbers, the server having said WOULD COUNT → THE PICTURE ALONE goes out (the
    // share sheet stubbed: what it was handed), no link, no text, the server asked NOTHING
    if (name === 'red' && look === 'night') {
      const sh = await t.p.evaluate(async () => {
        const H = await import('/js/games/freefall/share.js'), St = await import('/js/store.js');
        const shot = window.__ffPlay.shot(), uid = 'u-check';
        const game = { id: 'freefall', matchId: shot.key, mode: 'solo', phase: 'final', participants: { [uid]: true }, results: { [uid]: { f: shot.floor, bl: shot.blazes, w: shot.cause, go: 0 } } };
        const state = { uid, code: 'FALL', players: { [uid]: { name: 'Ben' } } };
        St.state.game = game;
        globalThis.__ffWould = game.matchId;
        const got = [], door = window.fetch;
        let asked = 0;
        window.fetch = (u, o) => { if (String((u && u.url) || u).includes('/api/')) asked++; return door(u, o); };
        navigator.share = async d => { got.push(d); }; navigator.canShare = () => true;
        H.warmShare(game, state);
        const a = await H.shareRun(game, state), b2 = a === 'shared' ? a : await H.shareRun(game, state);
        const d = got[0] || {}, f = d.files && d.files[0];
        let w = 0, h = 0;
        if (f) { const bm = await createImageBitmap(f); w = bm.width; h = bm.height; }
        return { a, b: b2, n: got.length, keys: Object.keys(d).sort().join(), text: d.text, file: f ? f.name : '', type: f ? f.type : '', w, h, kb: f ? f.size / 1024 : 0, asked };
      });
      ok(sh.b === 'shared' && sh.n === 1 && sh.keys === 'files,text' && sh.text === '' && sh.file === 'neon-speakeasy-freefall.png' && sh.type === 'image/png' && sh.w === 1080 && sh.h === 1350, `${id}: SHARE behind THE SWITCH (WOULD COUNT) → THE PICTURE ALONE (${sh.file}, ${sh.w} × ${sh.h}, ${sh.kb.toFixed(0)} KB) — no link, no text (the first tap: ${sh.a}${sh.a === 'shared' ? '' : ' — its activation spent; the next: shared'})`);
      ok(sh.asked === 0 && !t.reqs.some(u => new URL(u).pathname.startsWith('/api/')), `${id}: … and the server was asked nothing (${sh.asked} calls to /api/)`);
    }
    ok(t.errs.length === 0, `${id}: no page error (${t.errs.join(' | ')})`);
    if (OUT) {
      writeFileSync(join(OUT, `card-${id}-1080x1350.png`), Buffer.from(res.full.split(',')[1], 'base64'));
      writeFileSync(join(OUT, `card-${id}-360x450.png`), Buffer.from(res.small.split(',')[1], 'base64'));
      writeFileSync(join(OUT, `frame-${id}.jpg`), Buffer.from(res.frame.split(',')[1], 'base64'));
      if (name === 'red' && look === 'night') writeFileSync(join(OUT, `card-${id}-noframe-1080x1350.png`), Buffer.from(res.none.split(',')[1], 'base64'));
    }
    await t.close();
  }
}
await b.close();
console.log(`\n${checks - fails.length} / ${checks}${fails.length ? ` — FAILED: ${fails.join(' · ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
