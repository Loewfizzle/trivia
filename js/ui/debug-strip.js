// THE DEBUG STRIPS (FP3a, FREV B4 — the owner couldn't see the people behind the overlays): the frame-time READOUT (City 2.0,
// screens/harbor/scene.js) and THE AUDIO PANEL (audio/diag.js) as DOM strips in ONE column at the TOP, under the corner buttons
// (the sky + the far skyline — never the promenade, never the dock), each FOLDABLE to ONE short line by a tap on its title
// (pointerdown + pointerup with a 6 px move guard: iOS Safari never sends 'click' to plain page areas), the fold remembered on
// this DEVICE (ui/debug-tools.js#debugFold). Everything but the titles lets taps through. Text is set only when it changed.
import { debugFold, setDebugFold } from './debug-tools.js';

const CSS = `
.dbg-col { position: fixed; z-index: 2147483000; left: calc(var(--safe-l, 0px) + 8px); right: calc(var(--safe-r, 0px) + 56px);
  top: calc(var(--safe-t, env(safe-area-inset-top, 0px)) + 10px + var(--cb, 36px) + 8px); max-width: 460px; max-height: calc(40vh - 56px - var(--safe-t, env(safe-area-inset-top, 0px))); max-height: calc(40svh - 56px - var(--safe-t, env(safe-area-inset-top, 0px)));
  display: flex; flex-direction: column; gap: 4px; pointer-events: none; overflow: hidden; }
/* SP4 (the owner: the readouts drew on top of the open PREVIEW PANEL): hidden while its sheet is open (remote.js toggles the class) */
body.hr-sheet-open .dbg-col { visibility: hidden; }
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
.dbg-s .dbg-bad { color: #ffb0b0; }
.dbg-s .dbg-ok { color: #9ff0c8; }
.dbg-s .dbg-ev { color: #d6dbe6; }
`;

let col = null, st = null, count = 0;
const ORDER = { readout: 0, audio: 1, load: 2 };   // (POLISH 5: the LOAD LOG's strip — screens/harbor/scene.js#loadStrip; SP3: last, it gives way first)

/**
 * a strip in the shared column. id: 'readout' | 'audio' (its fold is remembered by id).
 * → { el, folded, set({ head, rows: [[cls, text]…] | [text…], ok }), remove() }
 */
export function createDebugStrip(id) {
  if (!col) {
    st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
    col = document.createElement('div'); col.className = 'dbg-col'; document.body.append(col);
  }
  count++;
  const box = document.createElement('div'); box.className = 'dbg-s'; box.dataset.id = id; box.style.order = String(ORDER[id] ?? 5);
  const head = document.createElement('div'); head.className = 'dbg-h'; head.setAttribute('role', 'button'); head.tabIndex = 0;
  const body = document.createElement('div'); body.className = 'dbg-b';
  box.append(head, body); col.append(box);
  let fold = debugFold(id), down = null, lastHead = '', lastBody = '', last = null;
  box.classList.toggle('dbg-fold', fold);
  const flip = () => { fold = !fold; box.classList.toggle('dbg-fold', fold); setDebugFold(id, fold); if (last) api.set(last, true); };
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
      if (fold) return;
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
