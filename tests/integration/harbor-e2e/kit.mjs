// CITY 2.0 — THE HARBOR end to end: THE KIT (NIGHT-B Group 0 split the one 4,400-line e2e-harbor.mjs into this kit + one file per
// cloud job). The old file's harness block as it was: the shared state (checks / errors / warnings + ok / okT / okF / skipCI), the
// browser + open(), waitFor / tap / harborUp / settled / dbPut / flags, the constants (GR, NIGHT, GUARD_SCENES, BUDGET_MS…), then
// G() + GROUPS and runGroup(). The entry point + the runner:
// ../e2e-harbor.mjs (the same CLI + env as ever). A helper only one job uses lives in that job's file; one a second job needs moves here.
// ADDING A GROUP: G('name', …) in its job's file (harbor-e2e/<job>.mjs) + the name in ../harbor-jobs.mjs (CI_JOBS).
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

export const BROWSER = process.argv[2];
export const OUT = (process.argv[3] || './shots-harbor').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
export const BASE = process.env.E2E_BASE || 'http://localhost:5173';
export const SHOTS = process.env.SHOTS !== '0';
export const CPU = Number(process.env.CPU || 4);
// City 2.0's absolute budgets per tier (ms of scene work a frame): WARNINGS only since C1.5 — this laptop's no-GPU number is
// not the phone's (docs/harbor.md#performance). The gate is a relative A/B (title-perf.mjs --ab) + the owner's iPhone.
export const BUDGET_MS = { 2: 8, 1: 6, 0: 4 };
export const t0 = Date.now();
export const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const errors = [], checks = [];
export const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
// THE CLOUD'S SLOWER MACHINE (Oct 24): a check that measures pure SPEED — frames drawn in a window, a bake finished in time, a sound's
// peak landing in a window, a punch sampled while the loop restarts — is a WARNING there (CI=true, which GitHub sets; or TIMING=warn
// locally): it is logged, counted (`warnings N`, each tagged [timing]) and shown in the summary, but never fails the run. A red cloud run always
// means a real problem. Everything else (layout, colours, memory, data, the rules of the city) stays a hard check everywhere.
// KNOWN-FLAKY VISUAL CHECKS (Oct 24, section 0 m): a pixel probe that caught a frame mid-punch / mid-flutter on the cloud's machine
// and passed on the next run with the code unchanged (the wall-washers' hot spot, the water's seam limit, the O's flutter landing) is
// `okF`: a warning on CI like the timing checks, each listed in the job's summary as "flaky". The half of such a check that proves the
// RULE (the strips on whole rows, every letter keeping its core) stays hard. (The barber pole's party colours are hard again since FP3a:
// the probe read the lit glass's white LED core — FREV B5 — and now reads two columns either side of it.)
const TIMING_WARN = process.env.TIMING === 'warn' || (!!process.env.CI && process.env.TIMING !== 'strict');
export const warnings = [];
const soft = kind => (cond, what) => { if (cond || !TIMING_WARN) return ok(cond, what); checks.push({ what, ok: true, warn: kind }); warnings.push(`[${kind}] ${what}`); log('WARN', `${what} (a ${kind} check: a warning on this machine)`); };
export const okT = soft('timing'), okF = soft('flaky');
// C4d — NOT A CHECK ON THE CLOUD (FR4's F14 + F15: the 2-core runner's p75 is 50–67 ms and it draws 8–20 frames in 0.6 s on every run —
// these speed questions are never answered there, only warned about): skipped on CI with a named reason (listed in the summary), run
// as before on a real machine. TIMING=strict runs them anyway.
export const ON_CI = !!process.env.CI && process.env.TIMING !== 'strict';
export const skipCI = (what, why) => { checks.push({ what, ok: true, warn: 'skipped' }); warnings.push(`[skipped] ${what} — on CI: ${why}`); log('SKIP', `${what} (on CI: ${why})`); };
export const GR = '&tz=America/Detroit&at=42.96,-85.67';
// (HOTFIX Oct 29: THE BASELINE GUARD's scenes — the perf group; the owner's forced-bus link at its stop, a plain night, the forced dog walk)
export const GUARD_SCENES = {
  night: { label: 'a plain night', qs: 'when=2026-10-22T21:30&wx=clear' },
  bus: { label: 'the forced bus (&force=bus, at its stop)', qs: 'when=2026-10-30T11:00&wx=clear&force=bus', wait: 'window.__district.harbor().people.buses.some(b => b.door)', waitWhat: 'a bus at the stop' },
  dog: { label: 'the forced dog walk (&force=dogwalk)', qs: 'when=2026-10-30T19:12&wx=clear&force=dogwalk' },
};
export const NIGHT = `when=2026-10-21T22:00${GR}`;
export let browser = null;               // (launched when this process first runs a group itself: a parent that only shards never opens one)
// (C2 — HARDENED, the cloud's own flakes: the `wild` job once lost its group to Chrome taking > 30 s to hand over its endpoint ("waiting
// for the WS endpoint URL") — the launch gets 90 s on CI and ONE retry of the launch itself (only that error: a page or a check that
// fails is never retried))
const LAUNCH_MS = process.env.CI ? 90000 : 30000;
const launchOnce = () => puppeteer.launch({ executablePath: BROWSER, headless: true, timeout: LAUNCH_MS, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', ...(process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11'] : [])] });
export const launch = async () => {
  if (browser) return browser;
  try { browser = await launchOnce(); } catch (e) {
    if (!/WS endpoint|Timed out|timeout|Failed to launch/i.test(e.message)) throw e;
    const first = String(e.message).split(String.fromCharCode(10))[0].trim();
    log('LAUNCH', `the browser didn't start (${first}) — one more try`); warnings.push(`[launch] the browser's first launch failed: ${first}`);
    browser = await launchOnce();
  }
  return browser;
};
// (C2 — the `street` job passed 75/75 but its page's EMULATOR dropped afterwards (auth/network-request-failed + the RTDB websocket) and the
// harness counted those as errors. A Firebase NETWORK error is a warning [net] — every group but `panel` (the one that needs city2/live)
// renders the city without Firebase, and a real dependence on it fails its own hard check. On this laptop (no emulators) they're the
// console noise every run printed as errors.)
const NET_NOISE = /auth\/network-request-failed|WebSocket connection to .* failed|FIREBASE WARNING: .*(?:websocket|transport|connection)/i;
let curGroup = '';
export async function open({ slot = 'h', qs = '', city = true, view = [390, 844], profile = true, dpr = 0, cores = 0, init = null, wait = true } = {}) {
  const ctx = await (await launch()).createBrowserContext();
  const p = await ctx.newPage();
  const files = [];
  p.on('pageerror', e => { errors.push(`${slot} pageerror: ${e.message}`); log(slot, 'PAGEERROR', e.message); });
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/favicon|ERR_|Failed to load|permission_denied|PERMISSION_DENIED|Client is offline/i.test(t)) {
    if (curGroup !== 'panel' && NET_NOISE.test(t)) { const w = `[net] ${slot}: ${t.slice(0, 160)}`; if (!warnings.includes(w)) warnings.push(w); return; }
    errors.push(`${slot}: ${t}`); log(slot, 'console.error', t); } });
  p.on('request', r => files.push(r.url()));
  const [w, h] = view, mobile = w < 1000;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr || (mobile ? 2 : 1), isMobile: mobile, hasTouch: mobile });
  // (an iPhone: DPR 3, and iOS reports a capped core count — Part 6a's tier check)
  if (cores) await p.evaluateOnNewDocument(n => { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => n }); }, cores);
  if (init) await p.evaluateOnNewDocument(init.fn, init.arg);
  await p.evaluateOnNewDocument((slotName, prof) => {
    try { localStorage.setItem('nd:entered', '1'); if (prof) localStorage.setItem(`na:${slotName}:profile`, JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ }
  }, slot, profile);
  await p.goto(`${BASE}/?emu&slot=${slot}&${qs}${city ? '&city=2' : ''}`);
  await waitFor(p, wait ? '!!window.__district && window.__district.phase().done' : '!!window.__district', `title ${slot}`, 25000);
  return { ctx, page: p, files };
}
export const ev = (p, js) => p.evaluate(js);
export async function waitFor(p, js, what, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await ev(p, js)) return true; } catch { /* navigating */ } await sleep(100); }
  throw new Error(`timeout: ${what}`);
}
export async function tapAt(p, x, y) {
  const c = await p.target().createCDPSession();
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await c.detach();
}
export async function tap(p, sel) {
  const r = await p.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, sel);
  if (!r) throw new Error(`no ${sel}`);
  await tapAt(p, r.x, r.y);
}
export const harborUp = p => waitFor(p, '!!(window.__district.harbor() && window.__district.harbor().shown)', 'the harbor baked', 15000);
const DB = 'http://127.0.0.1:9000';
export const dbPut = (path, v) => fetch(`${DB}/${path}.json?ns=demo-arcade-default-rtdb`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(v) });
export const flags = p => ev(p, 'window.__district.harbor().flags');
export const settled = (p, what = 'settled', ms = 15000) => waitFor(p, '!window.__district.harbor().pending && !window.__district.harbor().fading', what, ms);
export const GROUPS = new Map();
export const G = (name, fn) => { if (!GROUPS.has(name)) GROUPS.set(name, []); GROUPS.get(name).push(fn); };
export async function runGroup(name) {
  const fns = GROUPS.get(name);
  if (!fns) { errors.push(`unknown group ${name} (known: ${[...GROUPS.keys()].join(', ')})`); return; }
  const g0 = Date.now(); curGroup = name;
  for (const fn of fns) { try { await fn(); } catch (e) { errors.push(`FATAL [${name}] ${e.message}`); log('FAILED', name, e.message); } }
  log(`group ${name}: ${((Date.now() - g0) / 1000).toFixed(1)} s`);
}
