// Stage 3 end-to-end: 8 players in 8 separate browser contexts play a full game of
// all four games against the emulators, plus a late joiner, a rematch, the game-night
// scoreboard, Neural Bluff's every screen, and rendering-performance sampling.
//   node e2e-8p.mjs "<chrome/edge path>" ./shots
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2] || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SHOTS = process.argv[3] || './shots';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const EMU = BASE.includes('localhost') ? '?emu' : '';
mkdirSync(SHOTS, { recursive: true });
const SIZES = [[390, 844], [412, 915]];
const ONLY = (process.env.ONLY || 'cipher,signal,overclock,bluff').split(',');
const want = g => ONLY.includes(g);
const NAMES = ['ALICE', 'BOB', 'CHARLIE', 'DANA', 'EVE', 'FINN', 'GRACE', 'HAL'];
const COLORS = ['magenta', 'cyan', 'green', 'yellow', 'orange', 'violet', 'red', 'blue'];
const AVATARS = ['crown', 'eye', 'bolt', 'ghost', 'star', 'moon', 'cube', 'alien'];

const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const errors = [];
const perf = {};
const fail = m => { throw new Error(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: BROWSER, headless: true, protocolTimeout: 120000,
  args: ['--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--mute-audio'],
});

async function openPlayer(i, qs = '') {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const big = i < 2;
  page.size = big ? SIZES[i] : [360, 740];
  await page.setViewport({ width: page.size[0], height: page.size[1], isMobile: true, hasTouch: true, deviceScaleFactor: big ? 2 : 1 });
  page.on('pageerror', e => { errors.push(`${NAMES[i]} pageerror: ${e.message}`); log(`${NAMES[i]} PAGEERROR`, e.message); });
  page.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' && !/opentdb|the-trivia-api|ERR_|Failed to load resource/i.test(t)) { errors.push(`${NAMES[i]}: ${t}`); log(`${NAMES[i]} console.error`, t); }
  });
  const sep = EMU ? '&' : '?';
  await page.goto(`${BASE}/${EMU}${qs ? sep + qs : ''}`, { waitUntil: 'domcontentloaded' });
  page.idx = i;
  page.ctx = ctx;
  return page;
}
async function shotBoth(page, name) {
  await page.bringToFront();
  for (const [w, hgt] of SIZES) {
    await page.setViewport({ width: w, height: hgt, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await sleep(250);
    await page.screenshot({ path: `${SHOTS}/${name}-${w}.png` });
  }
  await page.setViewport({ width: page.size[0], height: page.size[1], isMobile: true, hasTouch: true, deviceScaleFactor: page.idx < 2 ? 2 : 1 });
}
const evalIn = (page, fn, arg) => page.evaluate(async (src, a) => {
  const { state } = await import('/js/store.js');
  const m = {
    obf: await import('/js/core/obfuscate.js'),
    cipher: await import('/js/games/cipher/logic.js'),
    feed: await import('/js/trivia/feed.js'),
    sig: await import('/js/games/signal/logic.js'),
    ch: await import('/js/games/overclock/challenges.js'),
    ocl: await import('/js/games/overclock/logic.js'),
    words: await import('/js/games/cipher/words.js'),
    bluff: await import('/js/games/bluff/index.js'),
    bl: await import('/js/games/bluff/logic.js'),
  };
  return new Function('state', 'm', 'arg', `return (${src})(state, m, arg)`)(state, m, a);
}, fn.toString(), arg);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try { if (await evalIn(page, fn, arg)) return; } catch { /* navigating */ }
    await sleep(200);
  }
  fail(`timeout: ${what} (${NAMES[page.idx]})`);
}
const click = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) return false; el.click(); return true; }, sel);
const all = (pages, fn) => Promise.all(pages.map(fn));

// Long tasks + frame pacing on the host page during a game.
async function startPerf(page) {
  await page.evaluate(() => {
    window.__perf = { long: 0, longMs: 0, frames: [] };
    try {
      new PerformanceObserver(list => { for (const e of list.getEntries()) { window.__perf.long++; window.__perf.longMs += e.duration; } }).observe({ type: 'longtask', buffered: false });
    } catch { /* unsupported */ }
  });
}
async function sampleFps(page, ms = 3000) {
  await page.bringToFront();
  return page.evaluate(ms => new Promise(res => {
    const times = [];
    const t = now => { times.push(now); if (now - times[0] < ms) requestAnimationFrame(t); else {
      const gaps = times.slice(1).map((x, i) => x - times[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      res({ fps: Math.round(1000 / avg), worstFrameMs: Math.round(Math.max(...gaps)), jank: gaps.filter(g => g > 50).length });
    } };
    requestAnimationFrame(t);
  }), ms);
}
async function endPerf(page, label) {
  const p = await page.evaluate(() => window.__perf || {});
  perf[label] = { ...(perf[label] || {}), longTasks: p.long, longTaskMs: Math.round(p.longMs || 0) };
  log(`perf ${label}`, JSON.stringify(perf[label]));
}

async function join(i, code) {
  const P = await openPlayer(i, `room=${code}`);
  await P.waitForSelector('.invite-card', { timeout: 20000 });
  await click(P, '.invite-card');
  await P.waitForSelector('.input-code');
  await P.type('.setup-screen input.input:not(.input-code)', NAMES[i]);
  await click(P, `.swatch[data-id="${COLORS[i]}"]`);
  await click(P, `.avatar-pick[data-id="${AVATARS[i]}"]`);
  await click(P, '.form-cta .btn-primary');
  await P.waitForSelector('.lobby-screen', { timeout: 20000 });
  return P;
}

async function openOptions(host, theme) {
  await host.bringToFront();
  await host.evaluate(t => document.querySelector(`.game-card[data-theme="${t}"]`).scrollIntoView({ block: 'center' }), theme);
  await sleep(250);
  await host.click(`.game-card[data-theme="${theme}"]`);
  await host.waitForSelector('.modal .options');
  await sleep(600);
}
async function initiate(host) {
  await click(host, '.modal .options .btn-primary');
}
async function backToLobby(host, pages) {
  await host.bringToFront();
  await host.waitForSelector('.final-actions .btn-ghost', { timeout: 30000 });
  await click(host, '.final-actions .btn-ghost');
  await all(pages, p => p.waitForSelector('.lobby-screen', { timeout: 30000 }));
}

// ---------------------------------------------------------------- games
async function playCipher(pages, label) {
  const host = pages[0];
  await startPerf(host);
  const rounds = await evalIn(host, s => s.game.rounds);
  for (let r = 0; r < rounds; r++) {
    await all(pages, p => waitFor(p, (s, m, want) => s.game && s.game.round === want && s.game.phase === 'play', `cipher r${r} play`, 40000, r));
    const answer = await evalIn(host, (s, m) => m.cipher.decodeWord(s.game.secret, m.cipher.secretKey(s.code, s.game.matchId, s.game.round)));
    if (r === 0) { const f = await sampleFps(host); perf[label] = { ...(perf[label] || {}), ...f }; }
    await all(pages, async (p, i) => {
      if (!(await evalIn(p, s => !!(s.game.participants && s.game.participants[s.uid])))) return;
      const word = i % 3 === 2 ? 'xxxxxxx'.slice(0, answer.length) : answer;
      for (const ch of (i % 3 === 2 ? (answer === 'crane' ? 'slate' : 'crane').slice(0, answer.length).padEnd(answer.length, 'e') : '')) void ch;
      const guess = async w => { await p.evaluate(word => { for (const ch of word) document.querySelector(`.key[data-k="${ch}"]`).click(); document.querySelector('.key[data-k=">"]').click(); }, w); await sleep(80); };
      if (i % 3 === 2) { await guess(answer); return; } // still solves, but last
      await guess(word);
    });
    await waitFor(host, (s, m, want) => s.game.round === want && s.game.phase !== 'play', `cipher r${r} closes`, 70000, r);
  }
  await waitFor(host, s => s.game.phase === 'final', 'cipher final', 60000);
  await endPerf(host, label);
}

async function playSignal(pages) {
  const host = pages[0];
  await startPerf(host);
  const uids = await all(pages, p => evalIn(p, s => s.uid));
  let q = -1;
  let sampled = false;
  for (let guard = 0; guard < 40; guard++) {
    await waitFor(host, (s, m, prev) => s.game && ((s.game.phase === 'question' && s.game.q > prev) || s.game.phase === 'final'), 'signal question', 60000, q);
    const phase = await evalIn(host, s => s.game.phase);
    if (phase === 'final') break;
    q = await evalIn(host, s => s.game.q);
    const correct = await evalIn(host, (s, m) => m.feed.decodeQuestion(s.game, s.code, s.game.q).c);
    const alive = await evalIn(host, (s, m) => m.sig.aliveUids(s.game));
    if (q === 0) {
      // everyone targets the next player round the table
      await all(pages, (p, i) => click(p, `.ls-card[data-uid="${uids[(i + 1) % pages.length]}"]`));
    }
    if (!sampled && q === 1) { sampled = true; await sleep(1200); const f = await sampleFps(host); perf.signal = { ...(perf.signal || {}), ...f }; }
    if (q === 1) { await sleep(300); await shotBoth(pages[1], 's3-20-signal-8p'); }
    // first four always right (fast); the rest wrong — keeps the battle short but dramatic
    await all(pages, async (p, i) => {
      if (!alive.includes(uids[i])) return;
      await sleep(i * 120);
      await click(p, `.ls-opt[data-i="${i < 4 ? correct : (correct + 1) % 4}"]`);
    });
    await waitFor(host, s => s.game.phase !== 'question', 'signal resolve', 30000);
  }
  await waitFor(host, s => s.game.phase === 'final', 'signal final', 60000);
  const ranks = await evalIn(host, (s, m) => m.sig.rankings(s.game).map(r => [s.players[r.uid].name, r.hp, r.out]));
  log('signal final', JSON.stringify(ranks), `after ${q + 1} questions`);
  await endPerf(host, 'signal');
}

async function solveOC(page, spec) {
  await page.evaluate(async spec => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const t = spec.type;
    if (t === 'unscramble') {
      for (const ch of spec.word) { const tile = [...document.querySelectorAll('.us-tile:not(.is-used)')].find(b => b.textContent === ch); tile && tile.click(); }
    } else if (t === 'memory') {
      for (let i = 0; i < 80 && !document.querySelector('.mem-grid.is-input'); i++) await sleep(150);
      for (const n of spec.seq) { document.querySelector(`.mem-node:nth-child(${n + 1})`).click(); await sleep(40); }
    } else if (t === 'oddone') {
      for (const g of spec.grids) { for (let i = 0; i < 20 && !document.querySelector('.odd-grid'); i++) await sleep(60); document.querySelector(`.odd-cell:nth-child(${g.idx + 1})`).click(); await sleep(420); }
    } else if (t === 'math' || t === 'pattern') {
      const answers = t === 'math' ? spec.problems.map(p => p.ans) : spec.seqs.map(s => s.ans);
      for (const v of answers) { const keys = [...document.querySelectorAll('.kp')]; for (const d of String(v)) keys.find(k => k.textContent === d).click(); keys.find(k => k.classList.contains('kp-go')).click(); await sleep(450); }
    } else if (t === 'trivia') {
      for (const q of spec.questions) { for (let i = 0; i < 20 && !document.querySelector('.tl-opt'); i++) await sleep(60); document.querySelector(`.tl-opt:nth-child(${q.c + 1})`).click(); await sleep(520); }
    } else if (t === 'stroop') {
      for (const it of spec.items) { for (let i = 0; i < 20 && !document.querySelector('.cc-opt'); i++) await sleep(50); document.querySelector(`.cc-opt[data-c="${it.ink}"]`).click(); await sleep(300); }
    } else if (t === 'reflex') {
      for (let r = 0; r < spec.delays.length; r++) { for (let i = 0; i < 200 && !document.querySelector('.rx-pad.is-go'); i++) await sleep(15); const pad = document.querySelector('.rx-pad.is-go'); pad && pad.click(); await sleep(400); }
    } else if (t === 'count') {
      for (const it of spec.items) { for (let i = 0; i < 80 && !document.querySelector('.qc-opt'); i++) await sleep(50); document.querySelector(`.qc-opt[data-v="${it.ans}"]`).click(); await sleep(520); }
    } else if (t === 'truefalse') {
      for (const it of spec.items) { for (let i = 0; i < 20 && !document.querySelector('.tf-btn'); i++) await sleep(50); document.querySelector(it.truth ? '.tf-true' : '.tf-false').click(); await sleep(340); }
    }
  }, spec);
}
async function playOverclock(pages) {
  const host = pages[0];
  await startPerf(host);
  const total = await evalIn(host, s => s.game.total);
  for (let ci = 0; ci < total; ci++) {
    await waitFor(host, (s, m, want) => s.game && s.game.ci === want && s.game.phase === 'play', `oc ${ci} play`, 40000, ci);
    await sleep(300);
    const spec = await evalIn(host, async (s, m) => {
      await m.words.loadLengths([5, 6, 7]);
      const g = s.game; const type = g.order[g.ci];
      const deps = { answersFor: m.words.answersFor };
      if (type === 'trivia') deps.triviaItems = [0, 1, 2].map(i => m.feed.decodeQuestion(g, s.code, g.tq[g.ci] + i));
      return m.ch.generate(type, { seed: g.seed, ci: g.ci, level: m.ocl.levelOf(g.ci, g.total) }, deps);
    });
    if (ci === 0) { const f = await sampleFps(host); perf.overclock = { ...(perf.overclock || {}), ...f }; }
    await all(pages, (p, i) => (i === 7 && ci % 2 ? Promise.resolve() : solveOC(p, spec)));
    await waitFor(host, (s, m, want) => !(s.game.ci === want && s.game.phase === 'play'), `oc ${ci} closes`, 45000, ci);
  }
  await waitFor(host, s => s.game.phase === 'final', 'oc final', 30000);
  log('overclock final', JSON.stringify(await evalIn(host, (s, m) => m.ocl.standings(s.game).map(r => [s.players[r.uid].name, r.score]))));
  await endPerf(host, 'overclock');
}

async function playBluff(pages) {
  const host = pages[0];
  const shooter = pages[1];
  await startPerf(host);
  const rounds = await evalIn(host, s => s.game.rounds);
  for (let r = 0; r < rounds; r++) {
    const last = r === rounds - 1;
    await waitFor(host, (s, m, want) => s.game && s.game.round === want && s.game.phase === 'intro', `bluff r${r} intro`, 60000, r);
    if (r === 0 || last) { await sleep(1300); await shotBoth(shooter, last ? 's3-31-bluff-intro-final' : 's3-30-bluff-intro'); }
    await waitFor(host, s => s.game.phase === 'write', `bluff r${r} write`, 20000);
    const q = await evalIn(host, (s, m) => m.bluff.decodeQuestion(s.game, s.code));
    if (r === 0) {
      await sleep(500);
      await shotBoth(shooter, 's3-32-bluff-write');
      // the truth is rejected, gently
      await shooter.bringToFront();
      await shooter.evaluate(a => { const i = document.querySelector('.nb-input'); i.value = a; i.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('.nb-file-btn').click(); }, q.a);
      await sleep(400);
      const hint = await shooter.$eval('.nb-hint', el => el.textContent);
      if (!/too close/i.test(hint)) fail(`truth was not rejected: "${hint}"`);
      await shotBoth(shooter, 's3-33-bluff-too-close');
      const filed = await evalIn(shooter, s => !!(s.live.lies && s.live.lies[s.uid]));
      if (filed) fail('the truth should never be filed');
    }
    // players 0-5 lie (two of them write the same lie to test merging); 6 misses WRITE entirely; 7 lies
    await all(pages, async (p, i) => {
      if (i === 6) return;
      const lie = i === 2 || i === 3 ? `Shared Fib ${r}` : `${NAMES[i]} fib number ${r}`;
      await p.evaluate(t => { const el = document.querySelector('.nb-input'); if (!el) return; el.value = t; el.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('.nb-file-btn').click(); }, lie);
    });
    if (r === 0) { await sleep(500); await shotBoth(shooter, 's3-34-bluff-filed'); }
    await waitFor(host, s => s.game.phase === 'vote', `bluff r${r} vote`, 80000);
    const options = await evalIn(host, s => s.game.options);
    if (options.filter(o => /shared fib/i.test(o.t)).length !== 1) fail('identical lies were not merged');
    const truthK = await evalIn(host, (s, m) => m.obf.decodeJSON(s.game.ox, `${s.game.matchId}:${s.game.round}:ox`).find(o => o.truth).k);
    // even players find the truth; odd players fall for ALICE's lie; everyone likes the shared fib
    const aliceK = options.find(o => /alice fib/i.test(o.t)) ? options.find(o => /alice fib/i.test(o.t)).k : truthK;
    const sharedK = options.find(o => /shared fib/i.test(o.t)).k;
    // HAL holds back on round 1 so the voting screen can be photographed before it closes
    const castVote = async (p, i) => {
      const k = i % 2 === 0 && i !== 0 ? truthK : i === 0 ? truthK : aliceK;
      await p.evaluate((k, like) => { const o = document.querySelector(`.nb-opt[data-k="${k}"]`); o && o.click(); const l = document.querySelector(`.nb-opt[data-k="${like}"] .nb-like`); l && !l.disabled && l.click(); }, k, sharedK);
    };
    await all(pages, (p, i) => (r === 0 && i === 7 ? null : castVote(p, i)));
    if (r === 0) { await sleep(600); await shotBoth(shooter, 's3-35-bluff-vote'); await castVote(pages[7], 7); }
    await waitFor(host, s => s.game.phase === 'reveal', `bluff r${r} reveal`, 40000);
    if (r === 0) {
      // time the shots from the server clock: a lie exhibit after its stamp lands, the truth, then the tally
      const at = ms => waitFor(host, async (s, m, want) => { const { serverNow } = await import('/js/firebase.js'); return serverNow() - s.game.phaseStartAt >= want; }, `reveal +${ms}`, 60000, ms);
      const steps = await evalIn(host, s => s.game.reveal.steps.length);
      await at(1400 + 2300); await shotBoth(shooter, 's3-36-bluff-reveal-lie');
      await at(1400 + (steps - 1) * 3400 + 2600); await shotBoth(shooter, 's3-37-bluff-reveal-truth');
      await at(1400 + (steps - 1) * 3400 + 4800 + 1600); await shotBoth(shooter, 's3-38-bluff-tally');
    }
    const res = await evalIn(host, (s, m, want) => s.game.results[want], r);
    const mult = last ? 3 : 1;
    const names = await evalIn(host, s => Object.fromEntries(Object.entries(s.players).map(([u, p]) => [p.name, u])));
    if (res[names.GRACE].pts !== 1000 * mult) fail(`GRACE missed WRITE but should still score the truth: ${res[names.GRACE].pts}`);
    // DANA co-wrote the shared fib and fooled nobody: her points are the 6 likes from everyone else (none may be lost
    // when the last vote closes the round)
    if (res[names.DANA].likes !== 6) fail(`shared fib should get 6 likes, got ${res[names.DANA].likes} (round ${r})`);
    log(`bluff r${r}`, JSON.stringify(Object.fromEntries(Object.entries(names).map(([n, u]) => [n, res[u] && res[u].pts]))));
    if (!last) {
      // the reveal screenshots above can run into (or past) the 7 s standings phase
      await waitFor(host, (s, m, want) => s.game.phase === 'standings' || s.game.round > want, `bluff r${r} standings`, 60000, r);
      if (r === 1) { await waitFor(host, s => s.game.phase === 'standings', 'bluff standings', 60000); await sleep(1500); await shotBoth(shooter, 's3-39-bluff-standings'); }
    }
  }
  await waitFor(host, s => s.game.phase === 'final', 'bluff final', 60000);
  await sleep(4200);
  await shotBoth(shooter, 's3-40-bluff-final');
  await endPerf(host, 'bluff');
}

// ---------------------------------------------------------------- run
try {
  const host = await openPlayer(0);
  await host.waitForSelector('.title-screen .logo', { timeout: 20000 });
  await sleep(900);
  await shotBoth(host, 's3-01-title');
  await click(host, '.title-actions .btn-primary');
  await host.waitForSelector('.setup-screen input.input');
  await host.type('.setup-screen input.input', NAMES[0]);
  await click(host, `.swatch[data-id="${COLORS[0]}"]`);
  await click(host, `.avatar-pick[data-id="${AVATARS[0]}"]`);
  await click(host, '.form-cta .btn-primary');
  await host.waitForSelector('.lobby-screen .room-code');
  const code = (await host.$eval('.room-code', el => el.textContent)).trim();
  log('room', code);

  // expired invite + full room messages
  const probe = await openPlayer(1, 'room=ZZZZ');
  await probe.waitForSelector('.invite-card.is-expired', { timeout: 20000 });
  await shotBoth(probe, 's3-02-invite-expired');
  await probe.ctx.close();

  const pages = [host];
  for (let i = 1; i < 7; i++) pages.push(await join(i, code));
  await waitFor(host, s => Object.values(s.presence).filter(p => p.online).length === 7, '7 online', 30000);
  log('7 players in the lobby');

  // ---- CIPHER (HAL joins mid-game as a spectator) ----
  if (!want('cipher')) { pages.push(await join(7, code)); }
  else {
  await openOptions(host, 'cipher');
  await click(host, '.modal .seg-btn[data-v="3"]');
  await click(host, '.modal .seg-btn[data-v="60"]');
  await initiate(host);
  await all(pages, p => p.waitForSelector('.cb', { timeout: 20000 }));
  const hal = await join(7, code).catch(async () => {
    // joining mid-game lands in the game view, not the lobby
    return null;
  });
  let late = hal;
  if (!late) {
    late = await openPlayer(7, `room=${code}`);
    await late.waitForSelector('.invite-card');
    await click(late, '.invite-card');
    await late.waitForSelector('.input-code');
    await late.type('.setup-screen input.input:not(.input-code)', NAMES[7]);
    await click(late, `.swatch[data-id="${COLORS[7]}"]`);
    await click(late, '.form-cta .btn-primary');
    await late.waitForSelector('.cb', { timeout: 20000 });
  }
  const spect = await evalIn(late, s => !(s.game.participants && s.game.participants[s.uid]));
  if (!spect) fail('late joiner should be a spectator');
  await sleep(800);
  await shotBoth(late, 's3-10-late-joiner-spectating');
  log('HAL joined mid-game as a spectator');
  await playCipher(pages, 'cipher');
  pages.push(late);

  // ---- REMATCH: same game, same settings, HAL now included ----
  await host.bringToFront();
  await host.waitForSelector('.final-actions .btn-primary', { timeout: 20000 });
  await sleep(3000);
  await shotBoth(host, 's3-11-final-rematch');
  const firstMatch = await evalIn(host, s => s.game.matchId);
  await click(host, '.final-actions .btn-primary');
  await waitFor(host, (s, m, prev) => s.game && s.game.matchId !== prev && s.game.id === 'cipher', 'rematch started', 20000, firstMatch);
  const n = await evalIn(host, s => Object.keys(s.game.participants).length);
  if (n !== 8) fail(`rematch should include all 8 players (got ${n})`);
  log('rematch started with all 8 players');
  await all(pages, p => p.waitForSelector('.cb', { timeout: 20000 }));
  await playCipher(pages, 'cipher-rematch');
  await backToLobby(host, pages);
  await sleep(1200);
  await shotBoth(host, 's3-12-lobby-night');
  }

  // ---- LAST SIGNAL ----
  if (want('signal')) {
  await openOptions(host, 'signal');
  await click(host, '.modal .seg-btn[data-v="75"]');
  await initiate(host);
  await all(pages, p => p.waitForSelector('.ls', { timeout: 30000 }));
  await playSignal(pages);
  await backToLobby(host, pages);
  }

  // ---- OVERCLOCK ----
  if (want('overclock')) {
  await openOptions(host, 'overclock');
  await click(host, '.modal .opt-row[data-v="standard"]');
  await initiate(host);
  await all(pages, p => p.waitForSelector('.oc', { timeout: 30000 }));
  await playOverclock(pages);
  await backToLobby(host, pages);
  }

  // ---- NEURAL BLUFF ----
  if (want('bluff')) {
  await openOptions(host, 'bluff');
  await click(host, '.modal .seg-btn[data-v="short"]');
  await shotBoth(host, 's3-29-bluff-options');
  await initiate(host);
  await all(pages, p => p.waitForSelector('.nb', { timeout: 30000 }));
  await playBluff(pages);
  await backToLobby(host, pages);
  }

  // ---- game night scoreboard ----
  const night = await evalIn(host, s => Object.keys(s.night || {}).length);
  const expected = (want('cipher') ? 2 : 0) + ['signal', 'overclock', 'bluff'].filter(want).length;
  if (night !== expected) fail(`expected ${expected} games on the night scoreboard, got ${night}`);
  await host.bringToFront();
  await host.evaluate(() => document.querySelector('.night').scrollIntoView({ block: 'center' }));
  await sleep(800);
  await shotBoth(host, 's3-50-night-scoreboard');
  log('night', JSON.stringify(await host.$$eval('.night-row', rows => rows.map(r => r.textContent.replace(/\s+/g, ' ').trim()))));

  // ---- connection banner ----
  await host.bringToFront();
  await host.setOfflineMode(true);
  await host.waitForSelector('.net.is-on', { timeout: 30000 });
  await shotBoth(host, 's3-60-reconnecting');
  await host.setOfflineMode(false);
  await host.waitForSelector('.net.is-back', { timeout: 40000 });
  await shotBoth(host, 's3-61-reconnected');
  log('connection banner: offline → reconnecting → restored');

  writeFileSync(`${SHOTS}/perf.json`, JSON.stringify(perf, null, 2));
  if (errors.length) fail(`browser errors:\n${errors.join('\n')}`);
  log('8-PLAYER E2E PASSED', JSON.stringify(perf));
} catch (e) {
  log('E2E FAILED:', e.message);
  for (const ctx of browser.browserContexts()) for (const p of await ctx.pages()) { try { await p.screenshot({ path: `${SHOTS}/zz-fail-${p.idx ?? 'x'}.png` }); } catch { /* closed */ } }
  process.exitCode = 1;
} finally {
  await browser.close();
}
