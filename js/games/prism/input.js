// PRISM DROP controls.
//
// GESTURES (default), on the whole play area:
//   drag sideways  -> the piece follows your finger cell by cell (no overshoot: the cell count comes from the
//                     finger's distance, not its speed)
//   tap            -> rotate (right half of the screen clockwise, left half counter-clockwise); a second
//                     finger's tap rotates too
//   slow drag down -> soft drop, the piece follows the finger down
//   SLAM button    -> hard drop (gesture mode's on-screen button: the piece lands exactly where its ghost shows)
//   fast flick down-> a hard drop ONLY with Settings → SWIPE-DOWN SLAM on (off by default: a flick drifted the piece a
//                     column just before locking). Off, a downward drag is a soft drop that never moves sideways.
//   swipe up       -> hold
// BUTTONS (Settings): left / right (auto-repeat), soft drop (hold), hard drop, rotate ⟲ ⟳, hold.
// Keyboard (desktop): ← → move, ↓ soft, space hard, ↑/X rotate CW, Z rotate CCW, C/shift hold.
//
// The gesture logic is a pure state machine (makeGesture) — tests feed it synthetic finger traces.

export const GESTURE = {
  SLOP: 9,            // px before a touch counts as a drag
  TAP_MS: 280,
  FLICK_WINDOW: 70,   // ms of history for the flick velocity
  FLICK_V: 1.15,      // px/ms (≈ 1150 px/s) — scaled by sensitivity
  FLICK_MIN_CELLS: 0.9,
  STEEP: 0.55,        // |vx| must stay under vy × this for a flick / swipe
  UP_CELLS: 1.2,
  UP_V: 0.55,
};

/**
 * cfg: { cell (px per board cell), sens (0..1, default .5), midX (screen x splitting CW/CCW taps), flick (default true: a
 *        fast flick down hard-drops; false: it only soft-drops and a downward drag keeps its column) }
 * Returns { down(x,y,t), move(x,y,t) -> actions[], up(x,y,t) -> actions[] }
 * actions: { a: 'move', dx } | { a: 'soft', n } | { a: 'hard' } | { a: 'hold' } | { a: 'rotate', dir }
 */
export function makeGesture(cfg) {
  const sens = cfg.sens == null ? 0.5 : cfg.sens;
  const hx = cfg.cell * (1.22 - 0.6 * sens);            // px per column
  const vy = cfg.cell * (1.05 - 0.3 * sens);             // px per soft-drop row
  const flickV = GESTURE.FLICK_V * (1.25 - 0.5 * sens);   // more sensitive = an easier flick
  const flick = cfg.flick !== false;
  let s = null;

  function velocity(t) {
    const hist = s.hist;
    let i = hist.length - 1;
    while (i > 0 && t - hist[i - 1].t <= GESTURE.FLICK_WINDOW) i--;
    const a = hist[Math.max(0, i - 1)], b = hist[hist.length - 1];
    const dt = Math.max(8, b.t - a.t);
    return { vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt, dy: b.y - a.y, dx: b.x - a.x };
  }

  return {
    down(x, y, t) {
      s = { x0: x, y0: y, t0: t, hist: [{ x, y, t }], mode: 'pending', cols: 0, rows: 0, baseX: x, baseY: y, done: false, acted: false, held: false };
    },
    move(x, y, t) {
      if (!s || s.done) return [];
      s.hist.push({ x, y, t });
      if (s.hist.length > 24) s.hist.shift();
      const out = [];
      const dx = x - s.x0, dy = y - s.y0;
      if (s.mode === 'pending') {
        if (Math.hypot(dx, dy) < GESTURE.SLOP) return out;
        s.mode = Math.abs(dx) >= Math.abs(dy) ? 'h' : dy > 0 ? 'v' : 'up';
        s.baseY = y;
      }
      const v = velocity(t);
      // hard drop: a fast, steep, downward flick
      if (flick && v.vy >= flickV && v.dy >= cfg.cell * GESTURE.FLICK_MIN_CELLS && Math.abs(v.vx) < v.vy * GESTURE.STEEP) {
        s.done = true;
        s.acted = true;
        out.push({ a: 'hard' });
        return out;
      }
      // hold: a swipe up
      if (!s.held && dy <= -cfg.cell * GESTURE.UP_CELLS && v.vy <= -GESTURE.UP_V * (1.2 - 0.4 * sens) && Math.abs(v.vx) < -v.vy * 0.8) {
        s.held = true;
        s.acted = true;
        s.done = true;
        out.push({ a: 'hold' });
        return out;
      }
      // horizontal: follow the finger (without the flick, a drag that is going down keeps its column)
      const cols = Math.round((x - s.x0) / hx);
      if (cols !== s.cols && (flick || s.mode !== 'v')) { out.push({ a: 'move', dx: cols - s.cols }); s.cols = cols; s.acted = true; }
      // a sideways drag turns into a free drag if the finger then clearly heads down
      if (s.mode === 'h' && v.dy > vy * 0.9 && Math.abs(v.dx) < v.dy * 0.5) { s.mode = 'v'; s.baseY = y - v.dy; s.rows = 0; }
      if (s.mode === 'v') {
        const rows = Math.floor(Math.max(0, y - s.baseY) / vy);
        if (rows > s.rows) { out.push({ a: 'soft', n: rows - s.rows }); s.rows = rows; s.acted = true; }
      }
      return out;
    },
    up(x, y, t) {
      if (!s) return [];
      const out = [];
      if (!s.done) {
        s.hist.push({ x, y, t });
        const moved = Math.hypot(x - s.x0, y - s.y0);
        if (!s.acted && moved < GESTURE.SLOP * 1.4 && t - s.t0 <= GESTURE.TAP_MS) out.push({ a: 'rotate', dir: x >= cfg.midX ? 1 : -1 });
      }
      s = null;
      return out;
    },
    get active() { return !!s; },
  };
}

/**
 * Wires gestures / buttons / keys to a target.
 * act(action) is called with the same action objects; softHeld(bool) for the soft-drop button / key.
 */
export function attachInput(area, { act, softHeld, cell, sens, enabled, midX, flick = () => true }) {
  const pointers = new Map(); // id -> { g (gesture) | tap: {x,y,t} }
  let primary = null;
  const opts = { passive: false };
  const onDown = e => {
    if (!enabled() || e.target.closest('[data-nogesture]')) return;
    if (e.cancelable) e.preventDefault();
    try { area.setPointerCapture(e.pointerId); } catch { /* fine */ }
    if (primary == null) {
      primary = e.pointerId;
      const g = makeGesture({ cell: cell(), sens: sens(), midX: midX(), flick: flick() });
      g.down(e.clientX, e.clientY, e.timeStamp);
      pointers.set(e.pointerId, { g });
    } else {
      pointers.set(e.pointerId, { tap: { x: e.clientX, y: e.clientY, t: e.timeStamp } });
    }
  };
  const onMove = e => {
    const p = pointers.get(e.pointerId);
    if (!p || !p.g) return;
    if (e.cancelable) e.preventDefault();
    // use coalesced events for precise velocity
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    for (const ev of (evs && evs.length ? evs : [e])) for (const a of p.g.move(ev.clientX, ev.clientY, ev.timeStamp || e.timeStamp)) act(a);
  };
  const onUp = e => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    pointers.delete(e.pointerId);
    if (p.g) { for (const a of p.g.up(e.clientX, e.clientY, e.timeStamp)) act(a); primary = null; }
    else if (p.tap && e.timeStamp - p.tap.t < GESTURE.TAP_MS && Math.hypot(e.clientX - p.tap.x, e.clientY - p.tap.y) < 14) {
      act({ a: 'rotate', dir: e.clientX >= midX() ? 1 : -1 });
    }
  };
  const onCancel = e => { pointers.delete(e.pointerId); if (e.pointerId === primary) primary = null; };
  area.addEventListener('pointerdown', onDown, opts);
  area.addEventListener('pointermove', onMove, opts);
  area.addEventListener('pointerup', onUp, opts);
  area.addEventListener('pointercancel', onCancel);
  const block = e => { if (e.cancelable && !e.target.closest('[data-nogesture], [data-btn]')) e.preventDefault(); };
  area.addEventListener('contextmenu', block);
  area.addEventListener('touchstart', block, opts);
  area.addEventListener('touchmove', block, opts);

  // keyboard
  const keys = new Set();
  const onKey = e => {
    if (!enabled() || e.target.closest('input, textarea')) return;
    const down = e.type === 'keydown';
    const k = e.key;
    const map = { ArrowLeft: 'L', ArrowRight: 'R', ArrowDown: 'D', ' ': 'H', ArrowUp: 'CW', x: 'CW', X: 'CW', z: 'CCW', Z: 'CCW', c: 'HOLD', C: 'HOLD', Shift: 'HOLD' };
    const m = map[k];
    if (!m) return;
    e.preventDefault();
    if (down && keys.has(m) && m !== 'L' && m !== 'R') return;
    if (down) keys.add(m); else keys.delete(m);
    if (m === 'D') { softHeld(down); return; }
    if (!down) { if (m === 'L' || m === 'R') stopRepeat(m); return; }
    if (m === 'L' || m === 'R') { if (!repeat[m]) startRepeat(m); return; }
    if (m === 'H') act({ a: 'hard' });
    if (m === 'CW') act({ a: 'rotate', dir: 1 });
    if (m === 'CCW') act({ a: 'rotate', dir: -1 });
    if (m === 'HOLD') act({ a: 'hold' });
  };
  // auto-repeat for held left/right (keys + buttons): 160 ms, then every 45 ms
  const repeat = {};
  function startRepeat(m) {
    stopRepeat(m);
    const dx = m === 'L' ? -1 : 1;
    act({ a: 'move', dx });
    repeat[m] = { t: setTimeout(function tick() { act({ a: 'move', dx }); repeat[m].t = setTimeout(tick, 45); }, 160) };
  }
  function stopRepeat(m) { if (repeat[m]) { clearTimeout(repeat[m].t); delete repeat[m]; } }
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);

  return {
    /** on-screen buttons: el with data-btn = L | R | SOFT | HARD | CW | CCW | HOLD */
    bindButtons(root) {
      const press = e => {
        const b = e.target.closest('[data-btn]');
        if (!b || !enabled()) return;
        e.preventDefault();
        e.stopPropagation();
        try { b.setPointerCapture(e.pointerId); } catch { /* fine */ }
        b.classList.add('is-down');
        const m = b.dataset.btn;
        if (m === 'L' || m === 'R') startRepeat(m);
        else if (m === 'SOFT') softHeld(true);
        else if (m === 'HARD') act({ a: 'hard' });
        else if (m === 'CW') act({ a: 'rotate', dir: 1 });
        else if (m === 'CCW') act({ a: 'rotate', dir: -1 });
        else if (m === 'HOLD') act({ a: 'hold' });
        if (navigator.vibrate) { try { navigator.vibrate(4); } catch { /* fine */ } }
      };
      const release = e => {
        const b = e.target.closest('[data-btn]');
        if (!b) return;
        b.classList.remove('is-down');
        const m = b.dataset.btn;
        if (m === 'L' || m === 'R') stopRepeat(m);
        if (m === 'SOFT') softHeld(false);
      };
      root.addEventListener('pointerdown', press, opts);
      root.addEventListener('pointerup', release);
      root.addEventListener('pointercancel', release);
      root.addEventListener('contextmenu', e => e.preventDefault());
    },
    destroy() {
      area.removeEventListener('pointerdown', onDown, opts);
      area.removeEventListener('pointermove', onMove, opts);
      area.removeEventListener('pointerup', onUp, opts);
      area.removeEventListener('pointercancel', onCancel);
      area.removeEventListener('contextmenu', block);
      area.removeEventListener('touchstart', block, opts);
      area.removeEventListener('touchmove', block, opts);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      for (const m of Object.keys(repeat)) stopRepeat(m);
    },
  };
}
