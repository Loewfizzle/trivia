// CITY I — HOW TO PLAY OUT OF THE BOOT: help.js is a lazy chunk opened ONLY through here (the frame at the tap, TAP TO RETRY, the warm-up after the
// reveal) — docs/harbor.md "HOW TO PLAY OUT OF THE BOOT".
import { lazyImport } from './lazy-import.js';
import { openSheet } from './sheet.js';
import { h } from './dom.js';
import { reportError } from '../errlog.js';
import { onScreenWait } from './onscreen.js';

let mod = null, loading = null, tries = 0, frame = null, want = undefined;

function load() {
  if (mod) return Promise.resolve(mod);
  if (!loading) {
    const n = tries;
    loading = (n ? lazyImport(import(`./help.js?again=${n}`), './help.js') : lazyImport(import('./help.js'), './help.js'))
      .then(m => { if (!m || typeof m.openHelp !== 'function') throw new Error('help.js has no openHelp()'); mod = m; return m; })
      .finally(() => { loading = null; });
  }
  return loading;
}

/** the pre-warm (title.js, after the reveal): loads the rules quietly — a failure here is only retried by the tap (which reports it) */
export function warmHelp() { return load().then(() => true, () => false); }
/** title.js#reveal: `ms` of VISIBLE time after THE CITY's reveal, then an idle moment → warmHelp() */
export function warmHelpSoon(ms = 3000) {
  onScreenWait(ms).then(() => {
    const go = () => { warmHelp(); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 200);
  });
}
/** tests: loaded yet? */
export const helpLoaded = () => !!mod;

function fill() {
  const f = frame;
  load().then(m => {
    if (frame !== f || !f) return;   // (closed while it loaded — nothing opens later on its own)
    frame = null;
    m.openHelp(want, f);
  }, e => {
    console.warn('[help]', e);
    try { reportError(e instanceof Error ? e : new Error(String(e)), 'help'); } catch { /* reporting never throws */ }
    if (frame !== f || !f) return;
    f.body.replaceChildren(h('button.btn.btn-ghost.help-retry', { type: 'button', dataset: { retry: 'help' }, onclick: () => {
      tries++;
      f.body.replaceChildren(h('p.help-wait', 'LOADING…'));
      fill();
    } }, 'Couldn’t open HOW TO PLAY — TAP TO RETRY'));
  });
}

/** open HOW TO PLAY (on `gameId`'s tab when it has one) — at once when the rules are loaded, else the frame first */
export function openHelp(gameId) {
  if (mod) { frame = null; return mod.openHelp(gameId); }
  want = gameId;
  if (frame) return;   // (a second tap while it loads: the one frame stays — never a double open)
  // (every way the sheet closes — ×, ‹, the scrim, Esc, a swipe, closeAllSheets — runs onClose: help.js's cleanup rides it as f.whenClosed
  //  once the rules took the sheet over)
  const box = {};
  box.f = frame = openSheet({ title: 'HOW TO PLAY', kicker: ' ', cls: 'help-sheet', label: 'How to play', body: [h('p.help-wait', 'LOADING…')],
    onClose: () => { const f = box.f; if (frame === f) frame = null; if (f && typeof f.whenClosed === 'function') f.whenClosed(); } });
  fill();
}
