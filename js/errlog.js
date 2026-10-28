// Errors from players' phones → POST /api/log → the /admin page ("Errors from phones", docs/testing.md).
// Like audio, this is polish and never a dependency: a few reports per page load at most, each distinct error once,
// nothing from browser extensions or other sites, the usual audio / network noise skipped, sent with sendBeacon (it
// survives the page closing). No names, ids or room codes are sent — only the message, where in our code, and which
// screen was up. Installed by importing it (first import of js/app.js and js/board/public.js, so it sees boot errors).

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

function flush() {
  clearTimeout(timer); timer = 0;
  if (!queue.length) return;
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

/** Report an error by hand (a caught failure that leaves the player stuck: a game screen that couldn't load…). */
export const reportError = (error, label = '') => record({ error: error instanceof Error ? error : new Error(String(error)) }, label);
const onEvent = input => record(input);

if (typeof window !== 'undefined' && typeof location !== 'undefined' && !window.__errlog) {
  window.__errlog = { reportError, pending: () => queue.slice(), seen: () => [...seen] };
  window.addEventListener('error', ev => {
    // resource load errors (an <img>, <link>) have no message and target an element: not code errors
    if (ev.target && ev.target !== window && !ev.message) return;
    onEvent({ message: ev.message, filename: ev.filename, lineno: ev.lineno, colno: ev.colno, error: ev.error });
  });
  window.addEventListener('unhandledrejection', ev => onEvent({ reason: ev.reason }));
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
}
