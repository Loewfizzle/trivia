// DOUBLE AGENT end to end with N players (default 8), each in their own browser context.
//   node e2e-agent.mjs "<browser path>" ./shots          (env N=8, SHOTS=0 to skip screenshots)
// Match A — REMOTE, 1 agent, 3 rounds: options sheet from the lobby, every phone gets exactly one file and only theirs,
//   press-and-hold reveals (agent jolt vs clean), READY, clue turns through the real input (a blocked secret word,
//   a timeout, a disconnect on their turn), refresh mid-clues, debate chat + pins + READY + host START THE VOTE,
//   votes, unmasking, last chance (wrong, later right = stolen), the host's phone dying mid-debate, a tie (agent
//   escapes), an agent leaving the room mid-round (void + re-deal), round scores, podium.
// Match B — SAME ROOM, 2 agents: the agent's reveal must match a normal player's (size, panel colour, brightness,
//   animation, sound, haptic), TALK IT OUT, two unmasked.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const N = Number(process.env.N || 8);
const SHOTS = process.env.SHOTS !== '0';
const NAMES = ['ALICE', 'BOB', 'CHARLIE', 'DANA', 'EVE', 'FINN', 'GRACE', 'HAL'];
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const fail = m => { throw new Error(m); };
const VIEW = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const pages = [];
const ctxs = [];
const dead = new Set();
let uids = [];
let code = '';

async function openPlayer(i, qs = '') {
  const ctx = ctxs[i] || (ctxs[i] = await browser.createBrowserContext());
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'warning' && /game view/.test(m.text())) errors.push(`game view failed to load: ${m.text()}`); });
  page.on('pageerror', e => { errors.push(`${NAMES[i]} pageerror: ${e.message}`); log(`${NAMES[i]} PAGEERROR`, e.message); });
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load resource|favicon|permission_denied|PERMISSION_DENIED|TOO LATE|Client is offline/i.test(t)) { errors.push(`${NAMES[i]}: ${t}`); log(`${NAMES[i]} console.error`, t); } });
  await page.setViewport(VIEW);
  await page.goto(`${BASE}/?emu&slot=a${i}${qs ? '&' + qs : ''}`);
  pages[i] = page;
  return page;
}
async function shotBoth(page, name) {
  if (!SHOTS) return;
  for (const [w, h] of [[390, 844], [412, 915]]) {
    await page.setViewport({ ...VIEW, width: w, height: h, deviceScaleFactor: 2 });
    await sleep(320);
    await page.screenshot({ path: `${OUT}${name}-${w}.png` });
  }
  await page.setViewport(VIEW);
  await sleep(100);
}
const shot = (page, name) => (SHOTS ? page.screenshot({ path: `${OUT}${name}-390.png` }) : null);
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await evalIn(page, fn, arg)) return true; } catch { /* busy */ } await sleep(120); }
  fail(`timeout: ${what}`);
}
const alive = () => pages.map((p, i) => i).filter(i => pages[i] && !dead.has(i));
const idx = uid => uids.indexOf(uid);
const pageOf = uid => pages[idx(uid)];
const game = page => evalIn(page, s => s.game);
const anyPage = () => pages[alive()[0]];
const hostIdx = async () => { for (const i of alive()) { try { if (await evalIn(pages[i], s => s.meta && s.meta.hostId === s.uid)) return i; } catch { /* */ } } return alive()[0]; };
const waitPhase = (phase, round, timeout = 60000) => waitFor(anyPage(), (s, a) => s.game && s.game.phase === a.phase && (a.round == null || s.game.round === a.round), `phase ${phase} r${round}`, timeout, { phase, round });
const cardOf = page => page.evaluate(() => window.__da && window.__da.card());
const press = (page, sel, nth = 0) => page.evaluate(([s, n]) => { const el = document.querySelectorAll(s)[n]; if (!el) throw new Error(`no ${s}[${n}]`); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 7 })); }, [sel, nth]);
const release = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (el) el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 7 })); }, sel);
const click = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no ' + s); el.click(); }, sel);
const clickTile = (page, uid) => page.evaluate(u => { const el = document.querySelector(`.da-tile[data-uid="${u}"]`); if (!el) throw new Error('no tile ' + u); el.click(); }, uid);
// average luminance of a PNG (0–255), measured in a scratch page with a canvas
let lumaPage = null;
async function luma(buf) {
  if (!lumaPage) lumaPage = await browser.newPage();
  const b64 = Buffer.from(buf).toString('base64');
  return lumaPage.evaluate(async src => {
    const img = new Image(); img.src = `data:image/png;base64,${src}`; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return s / (d.length / 4);
  }, b64);
}

// ---------------------------------------------------------------- per-phase bots
async function briefAll({ shotsPrefix = null, beforeReady = null } = {}) {
  await waitFor(anyPage(), s => s.game && s.game.phase === 'briefing', 'briefing');
  const g = await game(anyPage());
  await Promise.all(alive().map(i => pages[i].waitForFunction(rk => window.__da && window.__da.card() && window.__da.card().rk === rk, { timeout: 15000 }, g.rk)));
  const cards = await Promise.all(alive().map(async i => ({ i, uid: uids[i], card: await cardOf(pages[i]) })));
  const seatCards = cards.filter(c => g.seat.includes(c.uid));
  const agents = seatCards.filter(c => c.card.agent).map(c => c.uid);
  const words = new Set(seatCards.filter(c => !c.card.agent).map(c => c.card.word));
  const readyUp = cs => Promise.all(cs.map(async c => {
    const p = pages[c.i];
    await press(p, '.da-file'); await sleep(150); await release(p, '.da-file');
    await click(p, '.da-ready');
  }));
  if (shotsPrefix) {
    const a = pageOf(agents[0]);
    const n = pageOf(seatCards.find(c => !c.card.agent).uid);
    await readyUp(seatCards.filter(c => pages[c.i] !== a && pages[c.i] !== n)); // everyone else first: the 20 s briefing keeps running
    await shotBoth(n, `${shotsPrefix}-file-sealed`);
    await press(n, '.da-file'); await sleep(450); await shotBoth(n, `${shotsPrefix}-file-normal`); await release(n, '.da-file');
    await press(a, '.da-file'); await sleep(200); await shot(a, `${shotsPrefix}-file-agent-jolt`); await sleep(500); await shotBoth(a, `${shotsPrefix}-file-agent`); await release(a, '.da-file');
  }
  const result = { g, cards: seatCards, agents, word: [...words][0], words };
  if (beforeReady) await beforeReady(result);
  const waiting = await Promise.all(seatCards.map(c => pages[c.i].evaluate(() => !!document.querySelector('.da-ready:not([disabled])'))));
  await readyUp(seatCards.filter((c, k) => waiting[k]));
  return result;
}

const SAFE = ['shiny', 'famous', 'classic', 'popular', 'everyday', 'common', 'useful', 'simple', 'favorite', 'familiar', 'ordinary', 'typical', 'handy', 'trendy'];
async function typeClue(page, text) {
  await page.waitForSelector('.da-input', { timeout: 8000 });
  await page.evaluate(() => { const i = document.querySelector('.da-input'); i.value = ''; });
  await page.type('.da-input', text);
  await press(page, '.da-turn .btn-primary');
}
async function cluesAll(info, { timeoutUid = null, blockedUid = null, offlineUid = null, refreshUid = null, shotsPrefix = null } = {}) {
  const res = { skipped: [], blocked: false, refreshed: false, offline: false };
  let shots = 0;
  for (let guard = 0; guard < 80; guard++) {
    const g = await game(anyPage());
    if (g.phase !== 'clues') break;
    const cur = g.cur;
    const p = pageOf(cur);
    if (shotsPrefix && shots === 0 && g.turn >= 1) {
      shots++;
      const watcher = pages[alive().find(i => uids[i] !== cur)];
      await sleep(300);
      await shotBoth(watcher, `${shotsPrefix}-board`);
      await p.waitForSelector('.da-input', { timeout: 8000 });
      await shotBoth(p, `${shotsPrefix}-myturn`);
      // the keyboard up: input and TRANSMIT stay above it
      await p.evaluate(() => { const r = document.querySelector('.screen.da'); r.style.setProperty('--kb', '330px'); r.classList.add('kb-open'); });
      await sleep(250);
      ok(await p.evaluate(() => document.querySelector('.da-turn .btn-primary').getBoundingClientRect().bottom <= innerHeight - 330 + 2), 'CLUES: with the keyboard up, the input and TRANSMIT stay above it');
      await shot(p, `${shotsPrefix}-myturn-keyboard`);
      await p.evaluate(() => { const r = document.querySelector('.screen.da'); r.style.removeProperty('--kb'); r.classList.remove('kb-open'); });
    }
    if (cur === refreshUid && !res.refreshed) {
      res.refreshed = true;
      await p.reload();
      await p.waitForSelector('.da-input', { timeout: 25000 });
      const c = await p.waitForFunction(() => window.__da && window.__da.card(), { timeout: 15000 });
      ok(!!c, 'REJOIN mid-clues: the file and my turn come back after a refresh');
    }
    if (cur === timeoutUid && !res.skipped.includes(cur)) {
      res.skipped.push(cur);
      await waitFor(anyPage(), (s, t) => s.game.phase !== 'clues' || s.game.turn !== t, 'timeout skip', 40000, g.turn);
      continue;
    }
    if (cur === offlineUid && !res.offline) {
      res.offline = true;
      await p.setOfflineMode(true);
      await waitFor(anyPage(), (s, t) => s.game.phase !== 'clues' || s.game.turn !== t, 'offline skip', 40000, g.turn);
      await p.setOfflineMode(false);
      continue;
    }
    const card = await cardOf(p);
    if (cur === blockedUid && card && !card.agent && !res.blocked) {
      res.blocked = true;
      await typeClue(p, card.word.replace(/[^A-Za-z]/g, ''));
      await sleep(250);
      const msg = await p.$eval('.da-err', e => e.textContent);
      ok(/gives the word away/.test(msg), `CLUES: saying the secret word is blocked inline ("${msg}")`);
      if (shotsPrefix) await shot(p, `${shotsPrefix}-blocked`);
    }
    const word = card && card.word ? card.word.toLowerCase() : '';
    const clue = SAFE.find(w => !w.includes(word.replace(/[^a-z]/g, '')) && !Object.values(g.board || {}).some(x => Object.values(x || {}).includes(w))) || 'mystery';
    await typeClue(p, card && card.agent ? 'mystery' : clue);
    await waitFor(anyPage(), (s, t) => s.game.phase !== 'clues' || s.game.turn !== t, 'next turn', 20000, g.turn);
  }
  return res;
}

async function debateAll(info, { chat = true, shotsPrefix = null, killHost = false } = {}) {
  await waitFor(anyPage(), s => s.game && s.game.phase === 'debate', 'debate');
  for (const i of alive()) await pages[i].waitForSelector('.da-board.is-debate', { timeout: 10000 });
  const g = await game(anyPage());
  const agent = info.agents[0];
  const seat = alive().filter(i => g.seat.includes(uids[i]));
  // pins: the first three pin the agent, one pins someone innocent
  for (const [k, i] of seat.slice(0, 4).entries()) {
    const target = k === 3 ? g.seat.find(u => u !== uids[i] && u !== agent) : agent;
    if (target !== uids[i]) await clickTile(pages[i], target);
  }
  if (chat && g.settings.mode === 'remote') {
    const talk = [[seat[0], 'Who said mystery? That was suspiciously vague.'], [seat[1], 'Agreed. Felt like a guess.'], [seat[2], 'I am innocent, I promise!']];
    for (const [i, text] of talk) { await pages[i].type('.da-chat-input', text); await pages[i].keyboard.press('Enter'); await sleep(950); }
  }
  await sleep(500);
  if (shotsPrefix) await shotBoth(pages[seat[1]], `${shotsPrefix}-debate`);
  if (killHost) {
    const h = await hostIdx();
    const old = uids[h];
    dead.add(h);
    await pages[h].close();
    log(`killed the host (${NAMES[h]}) mid-debate`);
    await waitFor(anyPage(), (s, o) => s.meta.hostId !== o, 'host migrated', 45000, old);
    ok(true, 'HOST MIGRATION mid-debate');
  }
  for (const i of alive().filter(i => g.seat.includes(uids[i]))) await click(pages[i], '.da-vote-ready').catch(() => {});
  const h = await hostIdx();
  await pages[h].waitForFunction(() => { const b = document.querySelector('.da-end'); return b && !b.disabled; }, { timeout: 20000 });
  if (shotsPrefix) await shot(pages[h], `${shotsPrefix}-debate-host`);
  await click(pages[h], '.da-end');
  await waitFor(anyPage(), s => s.game.phase === 'vote', 'vote', 15000);
}

async function voteAll(info, { split = false, shotsPrefix = null } = {}) {
  for (const i of alive()) await pages[i].waitForSelector('.da-board.is-vote', { timeout: 10000 });
  const g = await game(anyPage());
  const seat = alive().filter(i => g.seat.includes(uids[i]));
  for (const [k, i] of seat.entries()) {
    const me = uids[i];
    // innocents split between the agents; each agent votes for a different innocent (no ties at the cut)
    const inno = g.seat.filter(u => !info.agents.includes(u));
    let s = split ? g.seat[(g.seat.indexOf(me) + 1) % g.seat.length]
      : info.agents.includes(me) ? inno[info.agents.indexOf(me)] : info.agents[inno.indexOf(me) % info.agents.length];
    if (s === me) s = g.seat.find(u => u !== me && !info.agents.includes(u));
    await clickTile(pages[i], s);
  }
  await sleep(400);
  if (shotsPrefix) await shotBoth(pages[seat[0]], `${shotsPrefix}-vote`);
  for (const i of seat) await click(pages[i], '.da-lock');
  await waitFor(anyPage(), s => s.game.phase === 'unmask', 'unmask', 20000);
}

// wait until `ms` after the phase began (server time — the unmasking runs on it)
async function atT(page, ms) {
  for (let k = 0; k < 400; k++) {
    const t = await page.evaluate(() => import('/js/firebase.js').then(m => m.serverNow() - window.__arcade.state.game.phaseStartAt));
    if (t >= ms) return;
    await sleep(Math.min(120, ms - t));
  }
}
async function unmaskWatch(shotsPrefix, n = 1) {
  const p = anyPage();
  if (!shotsPrefix) return waitFor(p, s => s.game.phase !== 'unmask', 'unmask ends', 30000);
  await atT(p, 250); await shot(p, `${shotsPrefix}-unmask-static`);
  await atT(p, 1500); await shotBoth(p, `${shotsPrefix}-unmask-zoom`);
  await atT(p, 2350); await shotBoth(p, `${shotsPrefix}-unmask-verdict`);
  if (n > 1) { await atT(p, 2350 + 2600); await shot(p, `${shotsPrefix}-unmask-verdict2`); }
  await atT(p, 900 + Math.max(1, n) * 2600 + 1200); await shotBoth(p, `${shotsPrefix}-unmask-agents`);
  await waitFor(p, s => s.game.phase !== 'unmask', 'unmask ends', 30000);
}

async function lastChance(info, { right, shotsPrefix = null }) {
  const g = await game(anyPage());
  if (g.phase !== 'last') return false;
  const caught = Object.keys(g.caught);
  const watcher = pages[alive().find(i => !caught.includes(uids[i]))];
  for (const u of caught) {
    const p = pageOf(u);
    if (!p || dead.has(idx(u))) continue;
    await p.waitForSelector('.da-last .da-input', { timeout: 10000 });
    if (shotsPrefix) { await shotBoth(p, `${shotsPrefix}-last-agent`); await shotBoth(watcher, `${shotsPrefix}-last-watch`); }
    await p.type('.da-last .da-input', right ? info.word.toUpperCase() : 'wrongword');
    await press(p, '.da-last .btn-primary');
  }
  await waitFor(anyPage(), s => s.game.phase === 'scores', 'scores', 25000);
  return true;
}

try {
  // ---------------------------------------------------------------- lobby
  const host = await openPlayer(0);
  await host.waitForSelector('.title-actions .btn-primary', { timeout: 20000 });
  for (let k = 0; k < 5 && !(await host.$('.setup-screen input.input')); k++) {
    await host.click('.title-actions .btn-primary').catch(() => {});
    await host.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {});
  }
  await host.type('.setup-screen input.input', NAMES[0]);
  await host.click('.form-cta .btn-primary');
  await host.waitForSelector('.lobby-screen .room-code', { timeout: 20000 });
  code = await evalIn(host, s => s.code);
  log('room', code);
  for (let i = 1; i < N; i++) {
    const p = await openPlayer(i, `room=${code}`);
    await p.waitForSelector('.invite-card', { timeout: 20000 });
    await p.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 });
    await p.click('.invite-card');
    await p.waitForSelector('.input-code');
    await p.type('.setup-screen input.input:not(.input-code)', NAMES[i]);
    await p.click('.form-cta .btn-primary');
    await p.waitForSelector('.lobby-screen', { timeout: 20000 });
  }
  await waitFor(host, (s, n) => Object.keys(s.players).length === n, `${N} players`, 30000, N);
  for (let i = 0; i < N; i++) uids[i] = await evalIn(pages[i], s => s.uid);

  // the lobby card + the options sheet
  await host.evaluate(() => document.querySelector('.game-card[data-theme="agent"]').scrollIntoView({ block: 'center' }));
  await sleep(400);
  await shotBoth(host, 'd-00-lobby-card');
  await host.evaluate(() => document.querySelector('.game-card[data-theme="agent"]').click());
  await host.waitForSelector('.modal .sheet.options', { timeout: 8000 });
  await sleep(500);
  ok(await host.evaluate(() => [...document.querySelectorAll('.modal .label')].some(l => l.textContent.includes('DOUBLE AGENTS'))) === (N >= 7), `OPTIONS: the 2-agent option shows only with 7+ players (${N})`);
  await shotBoth(host, 'd-01-options');
  await host.evaluate(() => document.querySelector('.modal .btn-text.btn-block').click());
  await sleep(400);

  // ================================================================ MATCH A — REMOTE, 1 agent
  await host.evaluate(() => import('/js/host.js').then(m => m.startGame('agent', { rounds: 3, mode: 'remote', agents: 1, clueSec: 15, debateSec: 60, passes: 1 })));
  await waitFor(host, s => s.game && s.game.id === 'agent', 'agent started', 20000);
  await sleep(700);
  await shotBoth(pages[1], 'd-02-intro');
  const pub = await evalIn(pages[2], s => s.game);
  ok(pub.word == null && pub.agents == null && pub.cat == null && !JSON.stringify(pub).includes('seed'), 'PRIVACY: the public game state holds no word, agents or seed');

  // ---- round 1
  let info = await briefAll({ shotsPrefix: 'd-03' });
  ok(info.agents.length === 1 && info.words.size === 1, `DEAL: exactly one agent; everyone else has the same word ("${info.word}")`);
  ok(info.cards.every(c => c.card.agent ? c.card.word == null && !!c.card.cat : !!c.card.word), 'DEAL: the agent sees only the category');
  const spy = info.agents[0];
  const other = uids.find(u => u !== spy && u !== uids[0]);
  const denied = await pageOf(other).evaluate(([c, u]) => import('/js/firebase.js').then(m => m.get(m.dbRef(`spy/${c}/card/${u}`)).then(() => 'read', e => String(e.message || e))), [code, spy]);
  ok(/permission/i.test(denied), `PRIVACY: a player cannot read another player's file (${denied.slice(0, 40)})`);
  const reveals = await Promise.all([pageOf(spy), pageOf(other)].map(p => p.evaluate(() => window.__da.reveal)));
  ok(reveals[0] && reveals[0].sound === 'daAgent' && reveals[0].shake && reveals[1].sound === 'daReveal', 'REMOTE: the agent gets the jolt (dark hit + shake), others a clean reveal');
  await waitFor(anyPage(), s => s.game.phase === 'clues', 'clues r1', 30000);
  const g1 = await game(anyPage());
  ok(!info.agents.includes(g1.order[0]), 'TURN ORDER: the agent does not go first');
  const innocents = g1.order.filter(u => u !== spy);
  const c1 = await cluesAll(info, { timeoutUid: innocents[2], blockedUid: innocents[1], refreshUid: innocents[3], shotsPrefix: 'd-04' });
  ok(c1.skipped.length === 1, 'CLUES: a player who runs out of time is skipped');
  const b1 = (await game(anyPage())).board[0];
  ok(b1[innocents[2]] === '', 'CLUES: their tile shows — NO SIGNAL —');
  ok(Object.values(b1).every(t => !t || !t.toLowerCase().includes(info.word.toLowerCase().replace(/[^a-z]/g, ''))), 'CLUES: the secret word never reaches the board');
  await debateAll(info, { shotsPrefix: 'd-05' });
  const pins = await evalIn(anyPage(), s => s.live.pins || {});
  ok(Object.values(pins).filter(x => x === spy).length >= 3, 'DEBATE: pins land and are shared');
  await voteAll(info, { shotsPrefix: 'd-06' });
  await unmaskWatch('d-07');
  await lastChance(info, { right: false, shotsPrefix: 'd-08' });
  await sleep(1600);
  await shotBoth(anyPage(), 'd-09-scores');
  let res = (await game(anyPage())).results[0];
  ok(res[spy].pts === 0 && innocents.every(u => res[u].pts === 150), `SCORES r1: caught + wrong guess → agent 0, every innocent 100 + 50 (${res[spy].pts}/${res[innocents[0]].pts})`);

  // ---- round 2: the host's phone dies mid-debate; a split vote → the agent escapes; a disconnect on a turn
  info = await briefAll();
  await waitFor(anyPage(), s => s.game.phase === 'clues', 'clues r2', 30000);
  const g2 = await game(anyPage());
  const off2 = g2.order.find((u, k) => k >= 1 && u !== info.agents[0] && idx(u) !== 0);
  const c2 = await cluesAll(info, { offlineUid: off2 });
  ok(c2.offline, 'CLUES: a player who disconnects on their turn is skipped');
  await debateAll(info, { killHost: true, chat: false });
  await voteAll(info, { split: true });
  await unmaskWatch(null);
  await waitFor(anyPage(), s => s.game.phase === 'scores', 'scores r2', 30000);
  res = (await game(anyPage())).results[1];
  ok(res[info.agents[0]].pts === 200, 'TIE: nobody accused → the agent escapes (+200)');
  await sleep(1200);
  await shot(anyPage(), 'd-10-scores-escape');
  // the old host's phone comes back
  const back = [...dead][0];
  await openPlayer(back);
  dead.delete(back);
  await pages[back].waitForSelector('.screen.da', { timeout: 30000 });
  ok(true, 'REJOIN: the old host is back in the match');

  // ---- round 3: an agent leaves the room mid-clues → void + re-deal; then the caught agent names the word
  info = await briefAll();
  await waitFor(anyPage(), s => s.game.phase === 'clues', 'clues r3', 30000);
  const leaver = info.agents[0];
  const li = idx(leaver);
  await pages[li].evaluate(() => import('/js/room.js').then(m => m.leaveRoom()));
  dead.add(li);
  log(`agent ${NAMES[li]} left the room mid-round`);
  await waitFor(anyPage(), s => s.game.phase === 'briefing' && s.game.voided === 1, 'void + re-deal', 20000);
  ok(true, 'AGENT LEFT: the round is void and the files are re-issued');
  info = await briefAll();
  ok(!info.agents.includes(leaver) && info.cards.length === N - 1, 'RE-DEAL: a new agent among those still here');
  await waitFor(anyPage(), s => s.game.phase === 'clues', 'clues r3b', 30000);
  await cluesAll(info);
  await debateAll(info, { chat: false });
  await voteAll(info);
  await unmaskWatch(null);
  await lastChance(info, { right: true });
  await sleep(1400);
  await shotBoth(anyPage(), 'd-11-scores-stolen');
  res = (await game(anyPage())).results[2];
  ok(res[info.agents[0]].pts === 150, 'LAST CHANCE: the caught agent named the word and stole the round (+150)');
  await waitFor(anyPage(), s => s.game.phase === 'final', 'final', 30000);
  await sleep(3500);
  await shotBoth(anyPage(), 'd-12-final');
  const night = await evalIn(anyPage(), s => Object.values(s.night || {}).some(n => n.g === 'agent'));
  ok(night, 'GAME NIGHT: the match counts toward the night scoreboard');

  // ================================================================ MATCH B — SAME ROOM, 2 agents
  const h2 = pages[await hostIdx()];
  await h2.evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
  await waitFor(anyPage(), s => s.meta.status === 'lobby', 'lobby', 15000);
  await h2.evaluate(() => import('/js/host.js').then(m => m.startGame('agent', { rounds: 3, mode: 'room', agents: 2, clueSec: 15, debateSec: 60, passes: 1 })));
  let A = null, B = null;
  info = await briefAll({ beforeReady: async inf => {
    const ag = pageOf(inf.agents[0]);
    const nm = pageOf(inf.cards.find(c => !c.card.agent).uid);
  const measure = async p => {
    await press(p, '.da-file');
    await sleep(700);
    const m = await p.evaluate(() => {
      const f = document.querySelector('.da-file');
      const b = f.querySelector('.da-file-body');
      const r = f.getBoundingClientRect();
      const cs = getComputedStyle(b);
      return { w: Math.round(r.width), h: Math.round(r.height), x: r.x, y: r.y, bg: cs.backgroundColor, anim: `${cs.animationName}|${cs.animationDuration}`, reveal: window.__da.reveal };
    });
    const card = await p.screenshot({ clip: { x: m.x, y: m.y, width: m.w, height: m.h } });
    const screen = await p.screenshot();
    if (SHOTS) await p.screenshot({ path: `${OUT}d-13-room-${p === ag ? 'agent' : 'normal'}-390.png` });
    await release(p, '.da-file');
    return { ...m, cardL: await luma(card), screenL: await luma(screen) };
  };
    A = await measure(ag);
    B = await measure(nm);
    if (SHOTS) { await press(ag, '.da-file'); await sleep(500); await shotBoth(ag, 'd-14-room-agent'); await release(ag, '.da-file'); await press(nm, '.da-file'); await sleep(500); await shotBoth(nm, 'd-14-room-normal'); await release(nm, '.da-file'); }
  } });
  ok(info.agents.length === (N - 1 >= 7 ? 2 : 1), `SAME ROOM: ${info.agents.length} agents dealt (they don't know about each other: no names on their files)`);

  log('same room', JSON.stringify({ A, B }));
  ok(A.w === B.w && A.h === B.h, `SAME ROOM: same card size (${A.w}×${A.h} vs ${B.w}×${B.h})`);
  ok(A.bg === B.bg && /134, 140, 151/.test(A.bg), `SAME ROOM: same mid-gray panel (${A.bg})`);
  ok(A.anim === B.anim, `SAME ROOM: same reveal animation (${A.anim})`);
  ok(A.reveal.sound === B.reveal.sound && JSON.stringify(A.reveal.buzz) === JSON.stringify(B.reveal.buzz) && !A.reveal.shake, 'SAME ROOM: same sound and haptic, no shake');
  ok(Math.abs(A.cardL - B.cardL) < 8 && Math.abs(A.screenL - B.screenL) < 3, `SAME ROOM: same brightness at a glance (card ${A.cardL.toFixed(1)} vs ${B.cardL.toFixed(1)}, screen ${A.screenL.toFixed(1)} vs ${B.screenL.toFixed(1)})`);
  await waitFor(anyPage(), s => s.game.phase === 'clues', 'clues B', 30000);
  await cluesAll(info);
  await waitFor(anyPage(), s => s.game.phase === 'debate', 'debate B', 20000);
  await sleep(800);
  ok(await anyPage().$('.da-talk') && !(await anyPage().$('.da-chat')), 'SAME ROOM: TALK IT OUT, no chat');
  await shotBoth(anyPage(), 'd-15-room-talk');
  await debateAll(info, { chat: false });
  await voteAll(info);
  await unmaskWatch('d-16', info.agents.length);
  const gb = await game(anyPage());
  ok(Object.keys(gb.caught || {}).length === info.agents.length, `2 AGENTS: the top two are unmasked (${Object.keys(gb.caught || {}).length})`);
  await lastChance(info, { right: false });
  await sleep(1200);
  await shotBoth(anyPage(), 'd-17-room-scores');

  log('checks', `${checks.filter(c => c.ok).length}/${checks.length} passed`);
  log('errors', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
} catch (e) {
  log('FAILED', e.message);
  errors.push(e.message);
  try { await anyPage().screenshot({ path: `${OUT}d-fail.png` }); } catch { /* */ }
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}agent-report.json`, JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
