// CITY PART 1 — SILENT WITH MUSIC OFF, THE SWEEP, in the browser (the jaywalk-podcast.mjs pattern, widened): on the real app with the site's
// MUSIC OFF (`na:settings { musicOff: true }` — PODCAST MODE: the engine SUSPENDS the context between effects), a real touch unlocks the
// audio, the engine is let NAP, then each live player is asked for ONE typical sound through its own module — it must START a source on
// the shared context (engine.js#voiceStarts — every start counted, a start wakes the nap). Every live game (PRISM DROP · OVERCLOCK ·
// HOLD'EM · JAYWALK + a JAYWALK FLYER · HIGH RISE), the dailies (THE PASSWORD · COAST CLEAR), progress, the room, THE BOARD.
// Measured on the code before the sweep: 7 of these 11 started NOTHING with the music off (HOLD'EM, OVERCLOCK, PRISM DROP, both dailies,
// progress, the room — their gates asked for a RUNNING context); after it: 11 of 11.
//   node tests/integration/podcast-sweep.mjs "<chromium>"      (scripts/serve.mjs on :5173 — no emulators needed for the sounds)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const b = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await b.newPage(), errs = [];
p.on('pageerror', e => errs.push(String(e.message || e)));
const cdp = await p.createCDPSession();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(() => { try { localStorage.setItem('na:settings', JSON.stringify({ musicOff: true })); localStorage.setItem('nd:entered', '1'); } catch { /* fine */ } });
await p.goto(guardUrl(`${BASE}/?emu&slot=psw&test=1`, 'podcast-sweep'), { waitUntil: 'load' });
const waitFor = async (js, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(80); } return false; };
const tapAt = async (x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };

ok(await waitFor("!document.getElementById('boot')", 45000), 'the city is up');
await sleep(800);
await tapAt(195, 300); await sleep(400); await tapAt(195, 300);   // (real touches on the sky: the first unlocks the audio)
const health = () => p.evaluate(() => import('/js/audio/engine.js').then(E => { const h = E.audioHealth(); return { podcast: h.podcast, napping: h.napping, state: h.state, unlocked: h.unlocked }; }));
ok(await waitFor("import('/js/audio/engine.js').then(E => E.audioHealth().podcast && E.audioUnlocked())", 8000), `MUSIC OFF = PODCAST MODE, the audio unlocked (${JSON.stringify(await health())})`);

// each case: { name, prep (once: fetch + decode), go (ask for the sound) } — run INSIDE the page
const CASES = [
  ['HOLD\'EM', "const M = await import('/js/games/holdem/sfx.js'); await M.fetchSounds(); await M.decodeAll(); return () => M.playSound(M.FILES[0]);"],
  ['OVERCLOCK', "const M = await import('/js/games/overclock/sfx.js'); const n = Object.keys(M.OC_SOUNDS)[0]; return () => M.ocSfx(n);"],
  ['PRISM DROP', "const M = await import('/js/games/prism/audio.js'); const s = M.createSynth(); return () => s.play('move');"],
  ['JAYWALK', "const M = await import('/js/games/jaywalk/sfx.js'); await M.fetchSounds(); await M.decode(); const id = M.SOUNDS.find(x => x.play).id; return () => M.play(id);"],
  ['a JAYWALK FLYER (THE BLACKBIRD\'s boom)', "const M = await import('/js/games/jaywalk/flyers.js'); return () => M.playFlyerSound('sonic-boom');"],
  ['HIGH RISE', "const M = await import('/js/games/highrise/sfx.js'); await M.fetchSounds(); await M.decode(); const id = M.SOUNDS[0].id; return () => M.play(id);"],
  ['THE PASSWORD (a daily)', "const M = await import('/js/games/password/sfx.js'); return () => M.pwSfx('tap');"],
  ['COAST CLEAR (a daily)', "const M = await import('/js/games/coastclear/sfx.js'); const k = Object.keys(M.CC_SOUNDS)[0]; return () => M.ccSfx ? M.ccSfx(k) : null;"],
  ['progress (the XP tick)', "const M = await import('/js/audio/progress-sfx.js'); return () => M.pgSfx('xp-tick');"],
  ['the room (a card in)', "const M = await import('/js/audio/lobby-sfx.js'); return () => M.lobbySfx('card-in');"],
  ['THE BOARD (a tab)', "const M = await import('/js/board/audio.js'); return () => M.boardSfx('tab');"],
];
for (const [name, prep] of CASES) {
  await waitFor("import('/js/audio/engine.js').then(E => E.audioHealth().napping)", 4000);   // (let the engine nap first: the sound must wake it)
  const before = await health();
  const r = await p.evaluate(async src => {
    const E = await import('/js/audio/engine.js');
    let go;
    try { go = await (new Function(`return (async () => { ${src} })()`))(); } catch (e) { return { err: String(e && e.message || e) }; }
    const n0 = E.voiceStarts().length, t0 = performance.now();
    let started = false;
    while (!started && performance.now() - t0 < 4000) { try { go(); } catch (e) { return { err: String(e && e.message || e) }; } await new Promise(r => setTimeout(r, 220)); started = E.voiceStarts().length > n0; }
    return { started, ms: Math.round(performance.now() - t0) };
  }, prep);
  ok(!!r.started, `MUSIC OFF: ${name} — a sound STARTS${before.napping ? ' (woke the nap)' : ' (the context was awake)'}${r.err ? ` — error: ${r.err}` : ''}`);
}
ok(errs.length === 0, `no page error (${errs.join(' | ')})`);
await b.close();
console.log(`\n${checks - fails.length}/${checks} checks passed`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
