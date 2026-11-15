// Errors from players' phones → POST /api/log → the /admin page ("Errors from phones", docs/testing.md).
// Like audio, this is polish and never a dependency: a few reports per page load at most, each distinct error once,
// nothing from browser extensions or other sites, the usual audio / network noise skipped, sent with sendBeacon (it
// survives the page closing). No names, ids or room codes are sent — only the message, where in our code, and which
// screen was up. Installed by importing it (first import of js/app.js and js/board/public.js, so it sees boot errors).

import { quietBot } from './core/bot-ua.js';
const MAX_PER_PAGE = 8;
const SEND_AFTER_MS = 1500;

// Expected noise: audio that wasn't allowed / was interrupted (audio is polish), lost connections (phones drop signal),
// a browser-internal ResizeObserver warning, and cross-origin errors that carry no information at all.
const IGNORE = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /NotAllowedError|AbortError/,
  /play\(\) (request was interrupted|failed because)/i,
  /^(TypeError: )?(Load failed|Failed to fetch|NetworkError when attempting to fetch resource\.?|cancelled|The network connection was lost\.?)$/i,
];

const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// CITY A — item 28, EXTENSION NOISE ("Invalid call to runtime.sendMessage(). Tab not found." — iPhone Safari, build 87cffc6): an error whose
// message or stack points at a BROWSER EXTENSION is not ours to fix — dropped, COUNTED only (countQuiet('ext') — /admin's errors, one number)
const EXTENSION = /runtime\.sendMessage|chrome\.runtime|browser\.runtime|safari-web-extension:\/\/|safari-extension:\/\/|chrome-extension:\/\/|moz-extension:\/\//i;
/** PURE: does this message / stack come from a browser extension? */
export const extensionNoise = (m, stack = '') => EXTENSION.test(String(m || '')) || EXTENSION.test(String(stack || ''));

/** PURE: a file URL as a short path in our code ('js/app.js'), or null when it isn't ours (extensions, CDNs). */
export function ownPath(url, origin) {
  if (!url) return '';
  try {
    const u = new URL(url, origin);
    if (u.origin !== origin) return null;
    return u.pathname.replace(/^\//, '') || '/';
  } catch { return null; }
}

/** PURE: a stack trace with our origin stripped, query strings removed, at most 5 lines. */
export function shortStack(stack, origin) {
  if (!stack) return '';
  return clip(String(stack).split('\n').slice(0, 6)
    .map(l => l.split(origin).join('').replace(/\?[^:)\s]*/g, '').trim())
    .filter(Boolean).slice(0, 5).join('\n'), 700);
}

/** PURE: an error event or rejection reason → { m, s, l, c, k } to report, or null to skip it.
 *  input: { message, filename, lineno, colno, error } (a window 'error' event) or { reason } (an unhandled rejection). */
export function normalizeError(input, origin) {
  const err = 'reason' in input ? input.reason : input.error;
  let m = input.message || '';
  if (err && typeof err === 'object') m = err.message ? `${err.name && err.name !== 'Error' ? `${err.name}: ` : ''}${err.message}` : m || String(err);
  else if (err != null && !m) m = String(err);
  m = String(m || '').replace(/^Uncaught (\w*Error: )?/, (x, t) => t || '').trim();
  if (!m) m = 'reason' in input ? 'Unhandled rejection' : 'Unknown error';
  if (IGNORE.some(re => re.test(m))) return null;
  // the file the error came from: the event's own, else the stack's first frame
  const stack = err && err.stack ? String(err.stack) : '';
  if (extensionNoise(m, stack) || extensionNoise('', input.filename)) return { ext: true };   // (CITY A — item 28: counted, never a row)
  const firstFrame = /(https?:\/\/[^\s)]+?):(\d+):(\d+)/.exec(stack);
  const file = input.filename || (firstFrame && firstFrame[1]) || '';
  const s = ownPath(file, origin);
  if (s === null) return null;                     // an extension or another site's script — not ours to fix
  return {
    m: clip(m, 300),
    s: clip(s, 120),
    l: Number(input.lineno || (firstFrame && firstFrame[2]) || 0) || 0,
    c: Number(input.colno || (firstFrame && firstFrame[3]) || 0) || 0,
    k: shortStack(stack, origin),
  };
}

/** PURE: the key two reports of the same error share (one report per page load). */
export const errorKey = e => `${e.m}|${e.s}|${e.l}`;

// ---------------------------------------------------------------- the page side
let where = () => '';
let page = 'app';
const seen = new Set();
let queue = [];
let timer = 0;
let sent = 0;

// 9e — the last 20 errors on this page (every one, repeats counted — the per-page send limit doesn't apply): City 2.0's SEND REPORT
// + the hang watch put them in their snapshot (screens/harbor/report.js)
const ring = [];
export const recentErrors = () => ring.map(e => ({ ...e }));
function remember(e) {
  const last = ring[ring.length - 1];
  if (last && last.m === e.m && last.s === e.s && last.l === e.l) { last.n++; last.t = Date.now(); return; }
  ring.push({ m: e.m, s: e.s, l: e.l, k: e.k ? e.k.split(String.fromCharCode(10)).slice(0, 3).join(' ← ') : '', n: 1, t: Date.now() });
  if (ring.length > 20) ring.shift();
}

/** Which screen is up (no ids): 'title', 'lobby', 'game:golf/play'… — set by the page's entry module. */
export function setErrorContext(fn, pageName) { where = fn; if (pageName) page = pageName; }

// THE ERRORS GROUP (Nov 12 night): BOTS OUT OF /admin — a robot browser (navigator.webdriver, HeadlessChrome, Vercel's screenshot robot, Lighthouse)
// sends nothing; a local / emulator page still does (the tests' own reports). The server drops them too (api/log.js — an old cached page).
const BOT = (() => { try { return quietBot({ ua: navigator.userAgent, webdriver: navigator.webdriver, host: location.hostname, search: location.search }); } catch { return false; } })();
function flush() {
  clearTimeout(timer); timer = 0;
  if (!queue.length) return;
  if (BOT) { queue = []; return; }
  const body = JSON.stringify({ p: page, e: queue });
  queue = [];
  try {
    const blob = new Blob([body], { type: 'text/plain' });   // text/plain: a "simple" request, no preflight
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/log', blob))) {
      fetch('/api/log', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
    }
  } catch { /* never let reporting throw */ }
}

function record(input, label = '') {
  try {
    if (typeof location === 'undefined') return;
    const e = normalizeError(input, location.origin);
    if (!e) return;
    if (e.ext) { countQuiet('ext'); return; }
    if (label) e.m = clip(`${label}: ${e.m}`, 300);
    remember(e);
    if (sent >= MAX_PER_PAGE) return;
    const key = errorKey(e);
    if (seen.has(key)) return;
    seen.add(key);
    sent++;
    let w = '';
    try { w = String(where() || ''); } catch { /* the context itself failed */ }
    queue.push({ ...e, w: clip(w, 60), t: Date.now() });
    if (!timer) timer = setTimeout(flush, SEND_AFTER_MS);
  } catch { /* never let reporting throw */ }
}

// CITY A — THE QUIET COUNTS (api/log.js#QUIET_KINDS): a kind of noise that is COUNTED, never a row — once a page per kind (a page that saw it,
// not every write): 'gone' = a room write the rules refused after this phone left / lost the host / saw its room close (firebase.js), 'ext' = a
// browser extension's error. /admin's errors shows the two numbers.
const QUIET = new Set(['gone', 'ext']), quietSent = new Set();
const quietN = { gone: 0, ext: 0 };
export function countQuiet(kind) {
  try {
    if (!QUIET.has(kind)) return;
    quietN[kind]++;
    if (quietSent.has(kind) || BOT || typeof navigator === 'undefined') return;
    quietSent.add(kind);
    const body = JSON.stringify({ p: 'report', r: { kind, text: kind } });
    const blob = new Blob([body], { type: 'text/plain' });
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/log', blob))) fetch('/api/log', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  } catch { /* never let reporting throw */ }
}
export const quietCounts = () => ({ ...quietN });

// CITY D — 1, A KILLED-PAGE MARKER (CUSTOMIZE + SCORES reloaded themselves on the owner's iPhone and NOTHING reached /admin — iOS kills the
// tab's process for memory: no error, no pagehide). While the page is ON SCREEN it keeps a note of the screen it's on (sessionStorage
// ns:alive — a tab's own, it survives the kill's reload); a clean exit (pagehide · hidden — iOS may evict a hidden tab, that's not a crash)
// clears it. A load that finds it still there sends ONE quiet report: "PAGE KILLED (likely memory) · screen · device · build" (a row in
// /admin's phone reports, grouped + counted — never a toast). app.js calls markScreen(where, build) on each screen change.
const ALIVE = 'ns:alive';
/** PURE: the note a load found → the report's text, or null (none / unreadable / older than a day — a stale tab) */
export function killedText(note, now = Date.now()) {
  if (!note || typeof note !== 'object' || typeof note.s !== 'string' || !(now - (note.at || 0) < 864e5)) return null;
  const secs = Math.max(0, Math.round((now - (note.at0 || note.at)) / 1000));
  return clip(`PAGE KILLED (likely memory) · ${note.s || '?'} · ${note.d || '?'} · build ${note.b || '?'}\nthe page reloaded itself with no clean exit (iOS ends a tab that runs out of memory); it had been on that screen ${secs} s`, 600);
}
let aliveNote = null;
const deviceShort = () => { try { const u = navigator.userAgent; const m = u.match(/(iPhone|iPad|Android[^;)]*|Macintosh|Windows NT [\d.]+|CrOS)/); const v = u.match(/OS (\d+)_(\d+)/) || u.match(/Version\/([\d.]+)/); return `${m ? m[1] : 'device'}${v ? ` ${v[1]}${v[2] ? `.${v[2]}` : ''}` : ''}`; } catch { return '?'; } };
function writeAlive() { try { if (aliveNote && document.visibilityState !== 'hidden') sessionStorage.setItem(ALIVE, JSON.stringify(aliveNote)); } catch { /* private mode: no marker */ } }
const clearAlive = () => { try { sessionStorage.removeItem(ALIVE); } catch { /* fine */ } };
/** the screen this page is on (no ids, no names) + the build it runs — written only when it changes */
export function markScreen(where, build) {
  const s = clip(String(where || '?'), 120), b = String(build || '?').slice(0, 9);
  if (aliveNote && aliveNote.s === s && aliveNote.b === b) return;
  const now = Date.now();
  aliveNote = { s, b, d: deviceShort(), at: now, at0: aliveNote && aliveNote.s === s ? aliveNote.at0 : now };
  writeAlive();
}
function checkKilled() {
  let note = null;
  try { note = JSON.parse(sessionStorage.getItem(ALIVE) || 'null'); } catch { note = null; }
  clearAlive();
  const text = killedText(note);
  if (!text || BOT) return;
  try {
    const body = JSON.stringify({ p: 'report', r: { kind: 'killed', text } });
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/log', new Blob([body], { type: 'text/plain' })))) fetch('/api/log', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  } catch { /* the log is polish */ }
}

/** Report an error by hand (a caught failure that leaves the player stuck: a game screen that couldn't load…). */
export const reportError = (error, label = '') => record({ error: error instanceof Error ? error : new Error(String(error)) }, label);
const onEvent = input => record(input);

if (typeof window !== 'undefined' && typeof location !== 'undefined' && !window.__errlog) {
  window.__errlog = { reportError, pending: () => queue.slice(), seen: () => [...seen], quiet: quietCounts };
  window.addEventListener('error', ev => {
    // resource load errors (an <img>, <link>) have no message and target an element: not code errors
    if (ev.target && ev.target !== window && !ev.message) return;
    onEvent({ message: ev.message, filename: ev.filename, lineno: ev.lineno, colno: ev.colno, error: ev.error });
  });
  window.addEventListener('unhandledrejection', ev => onEvent({ reason: ev.reason }));
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  // (CITY D — the killed-page marker: checked once at load, cleared on every clean exit, back on screen = written again)
  checkKilled();
  window.addEventListener('pagehide', clearAlive);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') clearAlive(); else writeAlive(); });
  window.__errlog.killed = () => { try { return sessionStorage.getItem(ALIVE); } catch { return null; } };
}
