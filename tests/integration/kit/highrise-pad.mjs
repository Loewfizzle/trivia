// HIGH RISE PAD + GO — THE CONTROLLER's checks on a FAKE PAD (the Gamepad API: an Xbox pad's standard mapping — e2e-jaywalk.mjs 6d's
// pattern), written against a plain page handle so the SAME checks run in Chromium (puppeteer — e2e-highrise.mjs, e2e-highrise-daily.mjs) and in
// WebKit (Playwright — wk-highrise-pad.mjs): P = { ev(js) → the page's value · waitFor(js, ms) → true | false }, both taking a JS expression.
//   installPad(P)                     the fake pad + `window.__pad` — a DEVICE ON ITS OWN CLOCK: a press is planned for a moment; the first
//                                     getGamepads() at / after it shows the button down with THAT moment as its timestamp (two reads), then up —
//                                     so the check knows the press's true time whatever the page's frame rate (WebKit here: ~10 a second)
//   padPress(P, i, { back, stamp })   button i pressed `back` ms ago (or with a stamp of its own) → { stamp, at, seenAt }
//   padDrop(P, hook)                  A at the moment the sliding slab is dead on → { stamp, seenAt, before, after, last, pad: hook.pad() }
//   tickOfStamp(stamp, t0)            the tick a press at `stamp` must be logged at (logic.js#tickOf — the ONE mapping)
import { tickOf } from '../../../js/games/highrise/logic.js';

export const PAD_ID = 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)';
export const BTN = Object.freeze({ a: 0, b: 1, start: 9, back: 8, up: 12, down: 13, left: 14, right: 15 });
export const tickOfStamp = (stamp, t0) => tickOf(stamp, t0);

export async function installPad(P) {
  await P.ev(`(() => {
    const b = () => ({ pressed: false, value: 0 });
    const pad = { id: ${JSON.stringify(PAD_ID)}, index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, b) };
    // THE FAKE PAD IS A DEVICE ON ITS OWN CLOCK (as a real one is: the browser stamps a press when it happens, whatever the page is doing): a
    // press is PLANNED for a moment \`at\`; the first getGamepads() at / after it shows the button down with timestamp = \`at\` (or the plan's own
    // \`stamp\`), for two reads; then it is up again. A page drawing 10 frames a second sees the press late — with its true time on it.
    let plan = null;
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => {
      if (plan && !plan.done) {
        const now = performance.now();
        if (now >= plan.at) {
          if (plan.reads < 2) { if (!plan.reads) plan.seenAt = now; plan.reads++; pad.buttons[plan.i] = { pressed: true, value: 1 }; pad.timestamp = plan.stamp == null ? plan.at : plan.stamp; }
          else { pad.buttons[plan.i] = b(); pad.timestamp = now; plan.done = true; }
        }
      }
      return [pad, null, null, null];
    } });
    const frame = () => new Promise(res => requestAnimationFrame(() => res()));
    const run = async (i, at, stamp) => { plan = { i, at, stamp, reads: 0, done: false, seenAt: 0 }; const P = plan, from = performance.now(); while (!P.done && performance.now() - from < 8000) await frame(); await frame(); return { stamp: stamp == null ? at : stamp, at, seenAt: P.seenAt, done: P.done }; };
    window.__pad = {
      pad, said: [],
      /** button i pressed \`back\` ms ago (a report that reached the browser a little before the page looks) — or with a stamp of its own */
      press: (i, back = 8, stamp = null) => run(i, performance.now() - back, stamp),
      /** A at the moment the sliding slab is DEAD ON (planned ahead: hook.msToPerfect() ≤ lead ms away) → what the stage logged for it */
      async drop(hookName, lead = 140, ms = 9000) {
        const L = window[hookName], from = performance.now();
        let m = null;
        for (;;) {
          if (L.state().over) return { over: true };
          m = L.msToPerfect();
          if (m != null && m <= lead && m > 4) break;
          if (performance.now() - from > ms) return { timeout: true };
          await new Promise(res => setTimeout(res, m != null && m - lead > 14 ? Math.min(40, m - lead - 8) : 2));
        }
        const before = L.taps().length, r = await run(0, performance.now() + m, null);
        const tp = L.taps();
        return { stamp: r.stamp, seenAt: r.seenAt, before, after: tp.length, last: tp.length ? tp[tp.length - 1] : -1, pad: L.pad(), floor: L.state().floor };
      },
    };
    // (every line the stage's pad line ever shows — "🎮 CONNECTED" is said ONCE a page)
    new MutationObserver(() => { const e = document.querySelector('.hi-padl'); if (e && e.classList.contains('is-on')) { const t = e.textContent, s = window.__pad.said; if (s[s.length - 1] !== t || !window.__pad.on) s.push(t); window.__pad.on = true; } else window.__pad.on = false; }).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    window.dispatchEvent(new Event('gamepadconnected'));
  })()`);
}
export const padPress = (P, i, { back = 8, stamp = null } = {}) => P.ev(`window.__pad.press(${i}, ${back}, ${stamp == null ? 'null' : stamp})`);
export const padDrop = (P, hook, { lead = 140 } = {}) => P.ev(`window.__pad.drop(${JSON.stringify(hook)}, ${lead})`);

/**
 * THE RUN's checks, the same in every mode + browser: `n` pad drops climb the tower, each LOGGED AT THE PRESS's OWN TICK (the injected
 * timestamp — before the frame that noticed it); a stamp on another clock (an older Safari: seconds) still drops, at the frame it was
 * noticed; B, Start, Back + the D-pad do NOTHING; a touch still drops, at its own event time. → { drops, floor }
 */
export async function padRunChecks(P, ok, hook, { n = 5, label = 'solo', touchSel = '.hi-play' } = {}) {
  const H = `window[${JSON.stringify(hook)}]`;
  const f0 = await P.ev(`${H}.state().floor`), list = [];
  for (let i = 0; i < n; i++) { const d = await padDrop(P, hook); if (!d || d.over || d.timeout) break; list.push(d); await new Promise(r => setTimeout(r, 200)); }
  const good = list.filter(d => d.after === d.before + 1 && d.pad.dropped);
  const f1 = await P.ev(`${H}.state().floor`);
  ok(good.length === n && f1 >= f0 + n - 1, `${label}: A = THE DROP — ${good.length} of ${n} presses dropped a slab (floor ${f0} → ${f1})`);
  const exact = good.filter(d => d.pad.ts === d.stamp && d.last === tickOfStamp(d.stamp, d.pad.t0) && d.pad.tick === d.last);
  const lead = good.map(d => +(d.pad.at - d.stamp).toFixed(1));
  ok(exact.length === good.length && good.length > 0, `${label}: EXACT TIMING — every drop is logged at THE PRESS's OWN TICK (the pad's timestamp → the run's clock), ${exact.length} of ${good.length}; the kit noticed them ${Math.min(...lead)}–${Math.max(...lead)} ms later`);
  ok(good.every(d => d.pad.at >= d.stamp) && good.some(d => d.pad.at - d.stamp >= 1), `${label}: … never in the future, and earlier than the frame that noticed it (${lead.join(' · ')} ms)`);
  const perfects = await P.ev(`${H}.state().perfects`);
  ok(perfects >= Math.max(1, good.length - 1), `${label}: … so presses made DEAD ON land dead on — ${perfects} PERFECTS of ${good.length} (a press counted at the frame that noticed it would be a cut on a slow frame)`);
  // a pad whose clock is NOT the page's (an older Safari stamps in seconds): the drop still counts — at the frame it was noticed
  const odd = await P.ev(`(async () => { const L = ${H}; for (let i = 0; i < 2000; i++) { const m = L.msToPerfect(); if (L.state().over) return null; if (m != null && m <= 60) break; await new Promise(r => setTimeout(r, 4)); } const before = L.taps().length; await window.__pad.press(0, 0, 123.456); return { before, after: L.taps().length, pad: L.pad() }; })()`);
  ok(!!odd && odd.after === odd.before + 1 && odd.pad.stamp === 123.456 && odd.pad.ts === odd.pad.at, `${label}: a pad on ANOTHER CLOCK (stamp 123.456) still drops — counted at the frame it was noticed, never at a stamp that is not this page's time`);
  await new Promise(r => setTimeout(r, 200));
  // a TOUCH still drops the same (now — each drop gives the fuse a fresh slab: a slow renderer never runs out of run under the checks)
  if (touchSel) await touchStillDrops(P, ok, hook, touchSel, label);
  // B · Start · Back · the D-pad: nothing — no drop, no pause, the run goes on
  const s0 = await P.ev(`({ taps: ${H}.taps().length, n: ${H}.pad().n, over: ${H}.state().over, held: ${H}.held() })`);
  for (const i of [BTN.b, BTN.start, BTN.back, BTN.up, BTN.left]) await padPress(P, i);
  const s1 = await P.ev(`({ taps: ${H}.taps().length, n: ${H}.pad().n, over: ${H}.state().over, held: ${H}.held(), started: ${H}.state().started })`);
  ok(s1.taps === s0.taps && s1.n === s0.n && !s1.held && s1.started, `${label}: B · START · BACK · the D-pad do NOTHING in a run (no drop, no pause, no hold: ${s1.taps} taps before + after)`);
  return { drops: good.length + (odd && odd.after > odd.before ? 1 : 0), floor: await P.ev(`${H}.state().floor`), over: s1.over };
}

/** a TOUCH still drops the same: a pointerdown on the play area at the slab's dead-on moment → one tap, logged at the event's own time */
export async function touchStillDrops(P, ok, hook, sel = '.hi-play', label = 'solo') {
  const H = `window[${JSON.stringify(hook)}]`;
  const r = await P.ev(`(async () => { const L = ${H}, play = document.querySelector(${JSON.stringify(sel)}); for (let i = 0; i < 2000; i++) { if (L.state().over) return null; const m = L.msToPerfect(); if (m != null && m <= 10) break; await new Promise(r => setTimeout(r, 4)); }
    const before = L.taps().length, padN = L.pad().n, e = new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 }); play.dispatchEvent(e);
    const tp = L.taps(); return { before, after: tp.length, last: tp[tp.length - 1], ts: e.timeStamp, t0: L.pad().t0, padN, padN2: L.pad().n }; })()`);
  ok(!!r && r.after === r.before + 1 && r.last === tickOfStamp(r.ts, r.t0) && r.padN2 === r.padN, `${label}: TOUCH STILL DROPS THE SAME — one tap, logged at the touch's own event time (tick ${r && r.last}), nothing of the pad's in its way`);
}

const S = 'window.__arcade.state', G = 'window.__hiGame', ST = '__hiStage', H = `window.${ST}`;
/**
 * THE CARTRIDGE's SOLO CASE (a solo HIGH RISE match on screen, at TAP TO START — the caller got there): the first press only CONNECTS ·
 * A = TAP TO START · A drops (exact timing) · B / Start nothing · touch the same · the run's proof node replayed by THE JUDGE = the phone's
 * run (pad taps are ordinary taps) · the podium: its marks wait PAD_ARM_MS, then A = PLAY AGAIN (the next run on at once), B = HOME.
 * `io`: { nodeOf(code, m, uid) → the proof node, verifyNode, sleep, shot?(name) }
 */
export async function padSoloCase(P, ok, io, tag = '') {
  const L = t => `${tag}THE CONTROLLER — ${t}`, { sleep } = io;
  await P.ev(`(() => { window.__fin = { at: 0, armed: 0 }; new MutationObserver(() => { const f = document.querySelector('.hi-final'), w = window.__fin; if (!f) { w.at = 0; w.armed = 0; return; } if (!w.at) w.at = performance.now(); if (!w.armed && f.querySelector('[data-pad="a"]')) w.armed = performance.now(); }).observe(document.body, { subtree: true, childList: true, attributes: true }); })()`);
  await installPad(P);
  await padPress(P, BTN.a);   // (Safari shows a pad only after a press: this one CONNECTS it)
  ok(await P.waitFor("window.__pad.said.includes('🎮 CONNECTED')", 20000), L('its first press → "🎮 CONNECTED" (the stage\'s quiet line, ~2 s)'));
  if (io.shot) await io.shot('pad-connected');
  ok(await P.ev(`!${H}.state().started && !${H}.state().starting && ${H}.pad().wired && ${H}.pad().n === 0`), L('… and nothing else: the connecting press is not TAP TO START (the kit, fetched lazily, is wired)'));
  await sleep(300);
  await padPress(P, BTN.a);
  ok(await P.waitFor(`${H}.state().started && ${G}.state().proven`, 15000), L('A = TAP TO START → GO → the run is on, PROVEN'));
  const g = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId, uid: ${S}.uid })`);
  const R = await padRunChecks(P, ok, ST, { n: 5, label: `${tag}solo` });
  if (io.shot) await io.shot('pad-run');
  // the fuse ends it → the podium; THE JUDGE's replay of the node = the phone's run
  ok(await P.waitFor(`${S}.game && ${S}.game.phase === 'final' && !!document.querySelector('.hi-final .hi-fin .hi-ec-cause')`, 40000), L('the run ends (the fuse) → the console\'s podium'));
  const mine = await P.ev(`${H}.result()`), node = await io.nodeOf(g.code, g.m, g.uid), V = io.verifyNode({ code: g.code, matchId: g.m, node });
  ok(V.ok && V.floor === mine.floor && V.perfects === mine.perfects && V.tick === mine.tick && mine.floor >= R.drops, L(`REPLAY = LIVE — the server's replay of the proof node = the phone's pad run (floor ${V.ok ? V.floor : V.why} · ${V.perfects} perfects · tick ${V.tick})`));
  // THE END CARD: the marks wait, then A = PLAY AGAIN
  ok(await P.waitFor('window.__fin.armed > 0', 5000), L('the podium\'s A / B marks are on'));
  const fin = await P.ev('({ gap: window.__fin.armed - window.__fin.at, a: document.querySelector(\'.hi-final [data-pad="a"]\').textContent, b: document.querySelector(\'.hi-final [data-pad="b"]\').textContent })');
  ok(fin.gap >= 450 && /PLAY AGAIN/.test(fin.a) && /HOME/.test(fin.b), L(`… ${Math.round(fin.gap)} ms AFTER it showed (a rhythm's next press never wipes the end screen unread): A = "${fin.a.trim()}", B = "${fin.b.trim()}"`));
  await sleep(400);
  await padPress(P, BTN.a);
  ok(await P.waitFor(`${S}.game && ${S}.game.matchId !== '${g.m}' && ${S}.game.phase === 'play' && !!${G} && ${G}.state().matchId === ${S}.game.matchId && ${H}.state().started`, 20000), L('END CARD: A = PLAY AGAIN → the next run on at once (that press was its start)'));
  const d2 = await padDrop(P, ST);   // (at once — the new run's first slab is on the fuse)
  ok(!!d2 && d2.after === d2.before + 1 && d2.last === tickOfStamp(d2.stamp, d2.pad.t0), L('… the pad still drops in the new run (the stage kept its wiring over PLAY AGAIN), at the press\'s own tick'));
  ok(await P.waitFor(`${G}.state().proven`, 12000), L('… PROVEN again'));
  ok(await P.ev("window.__pad.said.filter(t => t === '🎮 CONNECTED').length === 1"), L('"🎮 CONNECTED" was said ONCE this page'));
  const m2 = await P.ev(`${S}.game.matchId`);
  ok(await P.waitFor(`${S}.game && ${S}.game.matchId === '${m2}' && ${S}.game.phase === 'final' && !!document.querySelector('.hi-final [data-pad="b"]')`, 40000), L('the second run ends → the podium, its marks on'));
  await sleep(300);
  await padPress(P, BTN.b);
  ok(await P.waitFor(`!${S}.code && !${S}.game`, 20000), L('END CARD: B = HOME → the solo room is left (back in the city)'));
  return { g, floor: mine.floor };
}
