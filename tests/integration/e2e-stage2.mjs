// Stage 2 end-to-end against the emulators (see CLAUDE.md → Testing):
//   node e2e-stage2.mjs "<chrome/edge path>" ./shots [signal|overclock|all]
// - LAST SIGNAL: 3 players, targeting, hits, eliminations, host killed mid-battle, audio unlock + crossfades
// - OVERCLOCK: 3 players, identical seeded challenges on every client, every challenge UI driven,
//   a player refreshes mid-challenge and resumes, standings, final
// Screenshots of every new screen at 390x844 and 412x915.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BROWSER = process.argv[2] || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SHOTS = process.argv[3] || './shots';
const WHICH = process.argv[4] || 'all';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const EMU = BASE.includes('localhost') ? 'emu&' : '';
mkdirSync(SHOTS, { recursive: true });

const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const errors = [];
const fail = msg => { throw new Error(msg); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SIZES = [[390, 844], [412, 915]];

const browser = await puppeteer.launch({
  executablePath: BROWSER, headless: true, protocolTimeout: 90000,
  args: ['--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
});

async function open(slot, qs = '', size = SIZES[0]) {
  const page = await browser.newPage();
  await page.setViewport({ width: size[0], height: size[1], isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  page.on('pageerror', e => { errors.push(`slot${slot} pageerror: ${e.message}`); log(`slot${slot} PAGEERROR`, e.message); });
  page.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' && !/opentdb|the-trivia-api|ERR_|Failed to load resource/i.test(t)) { errors.push(`slot${slot}: ${t}`); log(`slot${slot} console.error`, t); }
  });
  await page.goto(`${BASE}/?${EMU}slot=${slot}${qs}`, { waitUntil: 'domcontentloaded' });
  page.slot = slot;
  page.size = size;
  return page;
}
async function shotBoth(page, name) {
  await page.bringToFront();
  for (const [w, hgt] of SIZES) {
    await page.setViewport({ width: w, height: hgt, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await sleep(220);
    await page.screenshot({ path: `${SHOTS}/${name}-${w}.png` });
  }
  await page.setViewport({ width: page.size[0], height: page.size[1], isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
}
const evalIn = (page, fn, arg) => page.evaluate(async (src, a) => {
  const { state } = await import('/js/store.js');
  const mods = {
    feed: await import('/js/trivia/feed.js'),
    sig: await import('/js/games/signal/logic.js'),
    ch: await import('/js/games/overclock/challenges.js'),
    ocl: await import('/js/games/overclock/logic.js'),
    words: await import('/js/games/cipher/words.js'),
  };
  return new Function('state', 'm', 'arg', `return (${src})(state, m, arg)`)(state, mods, a);
}, fn.toString(), arg);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try { if (await evalIn(page, fn, arg)) return; } catch { /* reloading */ }
    await sleep(150);
  }
  fail(`timeout: ${what} (slot ${page.slot})`);
}
const clickSel = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) return false; el.click(); return true; }, sel);
const clickText = async (page, text) => { await page.bringToFront(); return page.locator(`::-p-text(${text})`).click(); };

async function makeRoom(sizes, slots = ['a', 'b', 'c']) {
  const A = await open(slots[0], '', sizes[0]);
  await A.waitForSelector('.title-screen .logo', { timeout: 15000 });
  await A.bringToFront();
  await A.click('.title-actions .btn-primary');
  await A.waitForSelector('.setup-screen input.input');
  await sleep(1500);
  const menuAtSetup = await A.evaluate(() => (window.__arcade.musicDebug().voices.find(v => v.id === 'menu') || {}).t || 0);
  await A.type('.setup-screen input.input', 'ALICE');
  await A.click('.avatar-pick[data-id="crown"]');
  await A.click('.swatch[data-id="magenta"]');
  await clickText(A, 'CREATE ROOM');
  await A.waitForSelector('.lobby-screen .room-code');
  await sleep(600);
  const menuAtLobby = await A.evaluate(() => (window.__arcade.musicDebug().voices.find(v => v.id === 'menu') || {}).t || 0);
  // title → setup → lobby share the menu track: it must keep playing, never restart
  if (!(menuAtSetup > 0.3 && menuAtLobby > menuAtSetup)) fail(`menu track restarted between screens: setup t=${menuAtSetup}, lobby t=${menuAtLobby}`);
  log(`menu track continuous across screens (setup t=${menuAtSetup}s → lobby t=${menuAtLobby}s)`);
  const code = (await A.$eval('.room-code', el => el.textContent)).trim();
  const join = async (slot, name, size) => {
    const P = await open(slot, `&room=${code}`, size);
    await P.waitForSelector('.invite-card');
    await P.bringToFront();
    await P.click('.invite-card');
    await P.waitForSelector('.input-code');
    await P.type('.setup-screen input.input:not(.input-code)', name);
    await clickText(P, 'CONNECT');
    await P.waitForSelector('.lobby-screen');
    return P;
  };
  const B = await join(slots[1], 'BOB', sizes[1]);
  const C = await join(slots[2], 'CHARLIE', sizes[2]);
  await waitFor(A, s => Object.values(s.presence).filter(p => p.online).length === 3, '3 online');
  return { A, B, C, code };
}

async function startFromLobby(host, theme, configure) {
  await host.bringToFront();
  await host.evaluate(t => document.querySelector(`.game-card[data-theme="${t}"]`).scrollIntoView({ block: 'center' }), theme);
  await sleep(250);
  await host.click(`.game-card[data-theme="${theme}"]`);
  await host.waitForSelector('.modal .options');
  await sleep(600);
  if (configure) await configure(host);
  await clickText(host, 'INITIATE');
}

// =====================================================================
async function signalE2E() {
  log('=== LAST SIGNAL ===');
  const { A, B, C } = await makeRoom([SIZES[0], SIZES[0], SIZES[1]]);

  // --- audio: unlocked by the taps above, menu track playing ---
  await A.bringToFront();
  await waitFor(A, () => window.__arcade.musicDebug().playing === 'menu', 'menu music playing', 10000);
  // the menu track started on the first tap (title) and was never restarted through setup → lobby
  const menuVoices = await A.evaluate(() => window.__arcade.musicDebug().voices.filter(v => v.id === 'menu'));
  if (menuVoices.length !== 1) fail(`expected one menu voice, got ${JSON.stringify(menuVoices)}`);
  // A was hidden while the others joined (audio suspends in background) and resumes when visible again
  await waitFor(A, async () => (await import('/js/audio/engine.js')).getContext().state === 'running', 'audio resumes when tab visible', 5000);
  const hiddenState = await (async () => {
    await B.bringToFront();
    await sleep(400);
    return A.evaluate(async () => (await import('/js/audio/engine.js')).getContext().state);
  })();
  if (hiddenState === 'running') fail('audio should suspend when the tab is hidden');
  await A.bringToFront();
  await waitFor(A, async () => (await import('/js/audio/engine.js')).getContext().state === 'running', 'audio resumes again', 5000);
  log(`audio unlocked, menu playing; hidden → ${hiddenState}, visible → running`);

  // --- settings panel ---
  await A.click('.gear');
  await A.waitForSelector('.sheet.settings');
  await sleep(500);
  await shotBoth(A, 's2-01-settings');
  await A.evaluate(() => document.querySelector('.sheet.settings .set-head .icon-btn').click());
  await sleep(400);

  await startFromLobby(A, 'signal', async host => {
    await host.click('.modal .seg-btn[data-v="75"]');
    await host.click('.modal .chip-btn[data-v="science"]');
    await host.click('.modal .chip-btn[data-v="geography"]');
    await sleep(300);
    await shotBoth(host, 's2-02-signal-options');
  });
  for (const p of [A, B, C]) await p.waitForSelector('.ls', { timeout: 20000 });
  await sleep(900);
  await shotBoth(B, 's2-03-signal-intro');
  log('signal started');

  // --- crossfade: menu -> signal ---
  await A.bringToFront();
  await waitFor(A, () => {
    const d = window.__arcade.musicDebug();
    const sig = d.voices.find(v => v.id === 'signal' && !v.paused);
    const menu = d.voices.find(v => v.id === 'menu');
    return d.playing === 'signal' && sig && sig.gain > 0.95 && (!menu || menu.paused);
  }, 'crossfade to signal track completes', 8000);
  log('crossfade menu → signal OK', JSON.stringify(await A.evaluate(() => window.__arcade.musicDebug().voices)));

  const players = { A, B, C };
  const uids = {};
  for (const [k, p] of Object.entries(players)) uids[k] = await evalIn(p, s => s.uid);
  let host = A;
  let qCount = 0;
  let killed = false;
  let shotsTaken = new Set();
  while (true) {
    const ref = killed ? B : A;
    await waitFor(ref, s => s.game && (s.game.phase === 'question' || s.game.phase === 'final'), 'question or final', 40000);
    if ((await evalIn(ref, s => s.game.phase)) === 'final') break;
    const q = await evalIn(ref, s => s.game.q);
    const correct = await evalIn(ref, (s, m) => m.feed.decodeQuestion(s.game, s.code, s.game.q).c);
    const alive = await evalIn(ref, (s, m) => m.sig.aliveUids(s.game));
    // targets: A ⟶ C, B ⟶ C (until C falls), then B ⟶ A, A ⟶ B
    if (q === 0) {
      await B.bringToFront();
      await B.click(`.ls-card[data-uid="${uids.C}"]`);
      await A.bringToFront();
      await A.click(`.ls-card[data-uid="${uids.C}"]`);
    }
    if (!alive.includes(uids.C) && !shotsTaken.has('retarget')) {
      shotsTaken.add('retarget');
      await B.bringToFront();
      await B.click(`.ls-card[data-uid="${uids.A}"]`);
    }
    if (!killed && alive.includes(uids.A)) { await A.bringToFront(); await A.click(`.ls-opt[data-i="${correct}"]`); }
    await sleep(500);
    if (alive.includes(uids.B)) { await B.bringToFront(); await B.click(`.ls-opt[data-i="${correct}"]`); }
    if (alive.includes(uids.C)) { await C.bringToFront(); await C.click(`.ls-opt[data-i="${(correct + 1) % 4}"]`); }
    if (q === 0) { await sleep(300); await shotBoth(C, 's2-04-signal-question'); }
    await waitFor(ref, s => s.game.phase === 'reveal' || s.game.phase === 'final', 'reveal', 30000);
    if (!shotsTaken.has('reveal')) { shotsTaken.add('reveal'); await sleep(1300); await shotBoth(C, 's2-05-signal-reveal-victim'); await shotBoth(A, 's2-06-signal-reveal-attacker'); }
    const out = await evalIn(ref, s => Object.keys(s.game.out || {}));
    if (out.includes(uids.C) && !shotsTaken.has('flatline')) {
      shotsTaken.add('flatline');
      await C.bringToFront();
      await sleep(1600);
      await shotBoth(C, 's2-07-signal-flatline');
      await sleep(2200);
      await shotBoth(B, 's2-08-signal-decay');
      log(`C eliminated at Q${q + 1}`);
    }
    qCount++;
    if (!killed && q >= 2) {
      log('killing host tab mid-battle');
      killed = true;
      const tk = Date.now();
      await A.close();
      await waitFor(B, s => s.meta.hostId === s.uid, 'B takes over as host', 40000);
      log(`host migrated to B after ${((Date.now() - tk) / 1000).toFixed(1)}s`);
      host = B;
    }
    if (qCount > 30) fail('battle did not end');
  }
  await sleep(1200);
  await shotBoth(B, 's2-09-signal-final-early');
  await sleep(3000);
  await shotBoth(B, 's2-10-signal-final');
  const ranks = await evalIn(B, (s, m) => m.sig.rankings(s.game).map(r => [s.players[r.uid] && s.players[r.uid].name, r.hp, r.out]));
  log('final', JSON.stringify(ranks), 'after', qCount, 'questions');
  if (ranks[0][0] !== 'BOB') fail('expected BOB to win');
  // victory track
  await B.bringToFront();
  await waitFor(B, () => {
    const d = window.__arcade.musicDebug();
    const v = d.voices.find(x => x.id === 'victory' && !x.paused);
    return d.playing === 'victory' && v && v.gain > 0.95;
  }, 'victory music fully faded in', 8000);
  log('victory track playing (crossfaded in)');
  await clickText(B, 'BACK TO LOBBY');
  await B.waitForSelector('.lobby-screen', { timeout: 15000 });
  await waitFor(B, () => {
    const d = window.__arcade.musicDebug();
    const v = d.voices.find(x => x.id === 'menu' && !x.paused);
    return d.playing === 'menu' && v && v.gain > 0.95 && d.voices.filter(x => x.id && x !== v).every(x => x.paused);
  }, 'menu music back in lobby', 8000);
  log('back in lobby, menu music again');
  for (const p of [B, C]) await p.close();
}

// =====================================================================
async function solve(page, spec, { mistakes = false } = {}) {
  const t = spec.type;
  if (t === 'unscramble') {
    await page.evaluate(word => {
      for (const ch of word) {
        const tile = [...document.querySelectorAll('.us-tile:not(.is-used)')].find(b => b.textContent === ch);
        tile && tile.click();
      }
    }, spec.word);
  } else if (t === 'memory') {
    await waitFor(page, () => document.querySelector('.mem-grid.is-input') || document.querySelector('.oc-done'), 'memory input', 15000);
    const seq = mistakes ? [spec.seq[0], (spec.seq[1] + 1) % 9] : spec.seq;
    for (const n of seq) { await clickSel(page, `.mem-node:nth-child(${n + 1})`); await sleep(60); }
  } else if (t === 'oddone') {
    for (let gi = 0; gi < spec.grids.length; gi++) {
      const g = spec.grids[gi];
      await page.waitForSelector('.odd-grid', { timeout: 5000 });
      const idx = mistakes && gi === 1 ? (g.idx + 1) % (g.size * g.size) : g.idx;
      await clickSel(page, `.odd-cell:nth-child(${idx + 1})`);
      await sleep(mistakes && gi === 1 ? 900 : 450);
    }
  } else if (t === 'math' || t === 'pattern') {
    const answers = t === 'math' ? spec.problems.map(p => p.ans) : spec.seqs.map(s => s.ans);
    for (let i = 0; i < answers.length; i++) {
      const v = mistakes && i === 0 ? answers[i] + 1 : answers[i];
      await page.evaluate(val => {
        const keys = [...document.querySelectorAll('.kp')];
        for (const d of String(val)) keys.find(k => k.textContent === d).click();
        keys.find(k => k.classList.contains('kp-go')).click();
      }, v);
      await sleep(mistakes && i === 0 ? 1000 : 480);
    }
  } else if (t === 'trivia') {
    for (let i = 0; i < spec.questions.length; i++) {
      await page.waitForSelector('.tl-opt', { timeout: 5000 });
      const c = spec.questions[i].c;
      const pick = mistakes && i === spec.questions.length - 1 ? (c + 1) % 4 : c;
      await clickSel(page, `.tl-opt:nth-child(${pick + 1})`);
      await sleep(mistakes && i === spec.questions.length - 1 ? 1000 : 550);
    }
  }
}

const specOf = page => evalIn(page, async (s, m) => {
  await m.words.loadLengths([5, 6, 7]);
  const g = s.game;
  const type = g.order[g.ci];
  const deps = { answersFor: m.words.answersFor };
  if (type === 'trivia') deps.triviaItems = [0, 1, 2].map(i => m.feed.decodeQuestion(g, s.code, g.tq[g.ci] + i));
  return m.ch.generate(type, { seed: g.seed, ci: g.ci, level: m.ocl.levelOf(g.ci, g.total) }, deps);
});

async function overclockE2E() {
  log('=== OVERCLOCK ===');
  const { A, B, C } = await makeRoom([SIZES[1], SIZES[1], SIZES[0]], ['d', 'e', 'f']);
  await startFromLobby(A, 'overclock', async host => {
    await host.click('.modal .seg-btn[data-v="standard"]');
    await sleep(250);
    await shotBoth(host, 's2-20-oc-options');
  });
  for (const p of [A, B, C]) await p.waitForSelector('.oc', { timeout: 20000 });
  const total = await evalIn(A, s => s.game.total);
  const shotTypes = new Set();
  let rejoined = false;
  for (let ci = 0; ci < total; ci++) {
    await waitFor(A, (s, m, want) => s.game && s.game.ci === want && s.game.phase === 'ready', `ready ${ci}`, 40000, ci);
    const brief = await evalIn(A, s => s.game.brief);
    const type = await evalIn(A, s => s.game.order[s.game.ci]);
    if (brief) { await sleep(900); await shotBoth(C, `s2-21-oc-brief-${type}`); }
    await waitFor(A, s => s.game.phase === 'play', `play ${ci}`, 20000);
    await sleep(300);
    // identical challenge on every client
    const specs = await Promise.all([A, B, C].map(specOf));
    const j = specs.map(x => JSON.stringify(x));
    if (j[0] !== j[1] || j[1] !== j[2]) fail(`challenge ${ci} differs between clients`);
    const spec = specs[0];
    if (!shotTypes.has(type)) {
      shotTypes.add(type);
      if (type === 'memory') await sleep(1200);
      await shotBoth(C, `s2-22-oc-play-${type}`);
    }
    // C refreshes mid-challenge once, on a multi-part challenge
    if (!rejoined && ['math', 'oddone', 'trivia'].includes(type) && ci >= 2) {
      rejoined = true;
      const partial = { ...spec };
      if (type === 'math') partial.problems = spec.problems.slice(0, 2);
      if (type === 'oddone') partial.grids = spec.grids.slice(0, 2);
      if (type === 'trivia') partial.questions = spec.questions.slice(0, 2);
      await solve(C, partial);
      await waitFor(C, (s, m, want) => (s.live.boards && s.live.boards[s.uid] && s.live.boards[s.uid].p) === want, 'C progress saved', 8000, 2);
      log(`C refreshes mid-challenge (${type}, 2 parts done)`);
      await C.reload({ waitUntil: 'domcontentloaded' });
      await C.waitForSelector('.oc', { timeout: 15000 });
      await waitFor(C, s => s.game && s.game.phase === 'play' && s.liveKey, 'C back in challenge', 15000);
      await sleep(700);
      await shotBoth(C, 's2-23-oc-after-refresh');
      const prompt = await C.evaluate(() => (document.querySelector('.ch-prompt') || {}).textContent || '');
      if (!/3\/(4|3)/.test(prompt)) fail(`C did not resume at part 3: "${prompt}"`);
      const rest = { ...spec };
      if (type === 'math') rest.problems = spec.problems.slice(2);
      if (type === 'oddone') rest.grids = spec.grids.slice(2);
      if (type === 'trivia') rest.questions = spec.questions.slice(2);
      // re-index trivia/oddone helpers expect full arrays from position 0
      await solve(C, rest);
      log('C resumed and finished');
    } else {
      solve(C, spec, { mistakes: true }).catch(() => {});
    }
    await Promise.all([solve(A, spec), solve(B, spec)]);
    await waitFor(A, s => s.game.phase !== 'play', `challenge ${ci} closes`, 40000);
    if (ci === 1) { await sleep(1500); await shotBoth(B, 's2-24-oc-standings'); }
    const res = await evalIn(A, (s, m, want) => s.game.results && s.game.results[want], ci);
    log(`C${ci + 1} ${type}`, JSON.stringify(Object.values(res).map(r => `${r.ok}/${r.parts}:${r.pts}`)));
  }
  await waitFor(A, s => s.game.phase === 'final', 'final');
  await sleep(4200);
  await shotBoth(A, 's2-25-oc-final');
  const final = await evalIn(A, (s, m) => m.ocl.standings(s.game).map(r => [s.players[r.uid].name, r.score]));
  log('final', JSON.stringify(final));
  if (!rejoined) fail('rejoin scenario never ran');
  await clickText(A, 'BACK TO LOBBY');
  await A.waitForSelector('.lobby-screen', { timeout: 15000 });
  await shotBoth(A, 's2-26-lobby-unlocked');
}

try {
  if (WHICH === 'all' || WHICH === 'signal') await signalE2E();
  if (WHICH === 'all' || WHICH === 'overclock') await overclockE2E();
  if (errors.length) fail(`browser errors:\n${errors.join('\n')}`);
  log('STAGE 2 E2E PASSED');
} catch (e) {
  log('E2E FAILED:', e.message);
  for (const p of await browser.pages()) { try { await p.screenshot({ path: `${SHOTS}/zz-fail-${p.slot || 'x'}.png` }); } catch { /* closed */ } }
  process.exitCode = 1;
} finally {
  await browser.close();
}
