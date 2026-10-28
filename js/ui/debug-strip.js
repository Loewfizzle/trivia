// THE DEBUG STRIPS (FP3a, FREV B4 — the owner couldn't see the people behind the overlays): the frame-time READOUT (City 2.0,
// screens/harbor/scene.js) and THE AUDIO PANEL (audio/diag.js) as DOM strips in ONE column at the TOP, under the corner buttons
// (the sky + the far skyline — never the promenade, never the dock), each FOLDABLE to ONE short line by a tap on its title
// (pointerdown + pointerup with a 6 px move guard: iOS Safari never sends 'click' to plain page areas), the fold remembered on
// this DEVICE (ui/debug-tools.js#debugFold). Everything but the titles lets taps through. Text is set only when it changed.
import { debugFold, setDebugFold } from './debug-tools.js';

const CSS = `
.dbg-col { position: fixed; z-index: 39; left: calc(var(--safe-l, 0px) + 8px); right: calc(var(--safe-r, 0px) + 56px);
  top: calc(var(--safe-t, env(safe-area-inset-top, 0px)) + 6px + 44px + 10px); max-width: 460px; max-height: calc(40vh - 56px - var(--safe-t, env(safe-area-inset-top, 0px))); max-height: calc(40svh - 56px - var(--safe-t, env(safe-area-inset-top, 0px)));
  display: flex; flex-direction: column; gap: 4px; pointer-events: none; overflow: hidden; }
/* SP4 (the owner: the readouts drew on top of the open PREVIEW PANEL): hidden while its sheet is open (remote.js toggles the class) */
body.hr-sheet-open .dbg-col { visibility: hidden; }
/* WIN2 (the owner, frustrated: the strips covered the TEST pill): the column starts UNDER the pill's + the corner buttons' 44-pt row
   (z-index under the pill's 40); every strip starts FOLDED on every load; one tap on the READOUT's title hides every other strip (and
   folds it); the open LOAD log is capped + scrolls inside itself, its FIRST lines on top */
.dbg-col.dbg-min .dbg-s:not([data-id='readout']) { display: none; }
.dbg-s[data-id='load']:not(.dbg-fold) .dbg-b { max-height: min(26vh, 220px); overflow-y: auto; -webkit-overflow-scrolling: touch; justify-content: flex-start; pointer-events: auto; }
.dbg-s { align-self: flex-start; max-width: 100%; box-sizing: border-box; background: rgba(0, 0, 0, 0.72); color: #c9f7de; border-radius: 7px; padding: 2px 7px 3px; min-height: 0;
  font: 600 9px/12px ui-monospace, "JetBrains Mono", monospace; white-space: pre-wrap; word-break: break-all; overflow: hidden; }
.dbg-s .dbg-h { pointer-events: auto; display: block; width: 100%; text-align: left; background: none; border: 0; margin: 0;
  padding: 3px 0; color: #fff; font: inherit; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.dbg-s.dbg-fold .dbg-b { display: none; }
/* SP3 (the owner: the open LOAD log covered the fps + AUDIO strips): the LOAD log goes LAST and gives way first (every title stays in
   view, tappable) — its body clipped from the top, the newest lines kept */
.dbg-s { flex-shrink: 1; min-height: 19px; }
.dbg-s[data-id='load'] { flex-shrink: 6; display: flex; flex-direction: column; }
.dbg-s[data-id='load'] .dbg-b { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden; }
.dbg-s[data-id='load'] .dbg-b > div { flex-shrink: 0; }
/* (9e: a FOLDED load log shows its title only — the rule above out-ranked the fold) */
.dbg-s.dbg-fold[data-id='load'] .dbg-b { display: none; }
/* 9e — SEND REPORT: one big-enough button on top of the column (44 pt tall tap area), never hidden by the readout's fold */
.dbg-btn { order: -1; align-self: flex-start; pointer-events: auto; min-height: 30px; padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(0, 0, 0, 0.78); color: #fff; font: 700 11px/14px ui-monospace, "JetBrains Mono", monospace; letter-spacing: 0.06em; position: relative;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation; cursor: pointer; }
.dbg-btn::after { content: ''; position: absolute; inset: -7px -4px; }
.dbg-btn.dbg-busy { opacity: 0.6; }
.dbg-btn.dbg-done { border-color: #7ef0b0; color: #9ff0c8; }
.dbg-btn.dbg-fail { border-color: #ff9a9a; color: #ffb0b0; }
.dbg-s .dbg-bad { color: #ffb0b0; }
.dbg-s .dbg-ok { color: #9ff0c8; }
.dbg-s .dbg-ev { color: #d6dbe6; }
`;

let col = null, st = null, count = 0;
function ensureCol() {
  if (col) return;
  st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  col = document.createElement('div'); col.className = 'dbg-col'; document.body.append(col);
}
const ORDER = { readout: 0, audio: 1, load: 2 };   // (POLISH 5: the LOAD LOG's strip — screens/harbor/scene.js#loadStrip; SP3: last, it gives way first)

/**
 * a strip in the shared column. id: 'readout' | 'audio' (its fold is remembered by id).
 * → { el, folded, set({ head, rows: [[cls, text]…] | [text…], ok }), remove() }
 */
export function createDebugStrip(id) {
  ensureCol();
  count++;
  const box = document.createElement('div'); box.className = 'dbg-s'; box.dataset.id = id; box.style.order = String(ORDER[id] ?? 5);
  const head = document.createElement('div'); head.className = 'dbg-h'; head.setAttribute('role', 'button'); head.tabIndex = 0;
  const body = document.createElement('div'); body.className = 'dbg-b';
  box.append(head, body); col.append(box);
  let fold = true, down = null, lastHead = '', lastBody = '', last = null;   // (WIN2: FOLDED on every load — never remembered open)
  box.classList.toggle('dbg-fold', fold);
  const flip = () => {
    // (the readout's title cycles: folded → OPEN → every other strip HIDDEN (one tap hides them all) → folded again, all shown)
    if (id === 'readout') { const min = col.classList.contains('dbg-min'); if (min) { col.classList.remove('dbg-min'); fold = true; } else if (fold) fold = false; else { col.classList.add('dbg-min'); fold = true; } box.classList.toggle('dbg-fold', fold); if (last) api.set(last, true); return; }
    fold = !fold; box.classList.toggle('dbg-fold', fold); setDebugFold(id, fold); if (last) api.set(last, true); };
  head.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; e.stopPropagation(); });
  head.addEventListener('pointerup', e => { e.stopPropagation(); if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (moved <= 6) flip(); });
  head.addEventListener('pointercancel', () => { down = null; });
  head.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  const api = {
    el: box,
    get folded() { return fold; },
    /** o: { head (the expanded title), line (the folded one-liner), rows, ok } */
    set(o, force = false) {
      last = o;
      const h = fold ? (o.line || o.head) : o.head;
      const hc = 'dbg-h ' + (o.ok === false ? 'dbg-bad' : 'dbg-ok');
      if (force || h !== lastHead || head.className !== hc) { lastHead = h; head.textContent = h; head.className = hc; }
      // (WIN2: the rows are kept up to date while FOLDED too — the CSS hides them; the AUDIO panel's e2e reads them from the DOM, and a
      // strip opened by a tap shows its last state at once. Text is set only when it changed: a folded strip costs nothing visible.)
      const rows = (o.rows || []).map(r => (Array.isArray(r) ? r : ['dbg-ok', r]));
      const text = rows.map(r => r.join('\u0001')).join('\n');
      if (!force && text === lastBody) return;
      lastBody = text;
      body.replaceChildren(...rows.map(([cls, t]) => { const s = document.createElement('div'); s.className = cls; s.textContent = t; return s; }));
    },
    remove() {
      box.remove();
      if (--count <= 0) { count = 0; if (col) col.remove(); if (st) st.remove(); col = null; st = null; }
    },
  };
  return api;
}

/**
 * 9e — a BUTTON on top of the column (SEND REPORT): onTap() → Promise<bool | string> (true = done, false = failed, a string = its
 * own label). pointerdown + pointerup with the 6 px move guard (iOS sends no 'click' to plain page areas; this is a <button>, but the
 * column above lets taps through). → { el, remove() }
 */
export function createDebugButton(label, onTap) {
  ensureCol();
  count++;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'dbg-btn'; b.textContent = label; b.dataset.id = 'report';
  let down = null, busy = false, resetT = 0;
  const fire = () => {
    if (busy) return;
    busy = true; clearTimeout(resetT); b.className = 'dbg-btn dbg-busy'; b.textContent = 'SENDING…';
    Promise.resolve().then(onTap).catch(() => false).then(r => {
      busy = false;
      b.className = 'dbg-btn ' + (r ? 'dbg-done' : 'dbg-fail');
      b.textContent = typeof r === 'string' ? r : r ? 'SENT ✓ — see /admin' : 'NOT SENT — try again';
      resetT = setTimeout(() => { b.className = 'dbg-btn'; b.textContent = label; }, 6000);
    });
  };
  b.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; e.stopPropagation(); });
  b.addEventListener('pointerup', e => { e.stopPropagation(); if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (moved <= 6) fire(); });
  b.addEventListener('pointercancel', () => { down = null; });
  b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  col.append(b);
  return {
    el: b,
    remove() { clearTimeout(resetT); b.remove(); if (--count <= 0) { count = 0; if (col) col.remove(); if (st) st.remove(); col = null; st = null; } },
  };
}
