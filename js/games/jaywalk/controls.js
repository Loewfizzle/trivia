// JAYWALK — THE CONTROLS (H1 — docs/jaywalk.md "THE CONTROLS"): tap = hop forward · swipe = sideways · swipe down = back. EVERY TAP ACTS:
// The long notes: docs/games/jaywalk-notes.md
export const TAP_PX = 12;
export const SWIPE_PX = 18;

/** which way a movement points: 'l' | 'r' | 'u' | 'd' (a swipe UP is a hop forward too) */
export const dirOf = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : dy > 0 ? 'd' : 'u');

/** PURE — one touch's story → the hops it fires. start(x, y) → { move(x, y) → dir | null, end(x, y) → dir | null } */
export function touchStory(x0, y0) {
  let fired = false;
  return {
    move(x, y) {
      if (fired) return null;
      const dx = x - x0, dy = y - y0;
      if (dx * dx + dy * dy < SWIPE_PX * SWIPE_PX) return null;
      fired = true;
      return dirOf(dx, dy);
    },
    end(x, y) {
      if (fired) return null;
      fired = true;
      const dx = x - x0, dy = y - y0;
      return dx * dx + dy * dy < TAP_PX * TAP_PX ? 'u' : dirOf(dx, dy);
    },
  };
}

/** LAST MILE — THE CROUCH ON TOUCH (visual only): how many touches are still ARMED — down, and not yet spent on a hop. PURE. */
export function pressCount() {
  const armed = new Set();
  return { down(id) { armed.add(id); return armed.size; }, spent(id) { armed.delete(id); return armed.size; }, n: () => armed.size };
}

/** wire a play area: onHop(dir) for every hop, onAny() for any finished touch (the end screen's HOP AGAIN), onPress(on) while a touch is
 *  down and unspent (the kid's crouch — it ends when the touch fires its hop, lifts, or is cancelled). → off() */
export function wireControls(el, { onHop, onAny, onPress }) {
  const touches = new Map(), P = pressCount();
  const press = n => { if (onPress) onPress(n > 0); };
  el.setAttribute('data-tap-own', '');
  const down = e => { if (e.pointerType === 'mouse' && e.button !== 0) return; touches.set(e.pointerId, touchStory(e.clientX, e.clientY)); press(P.down(e.pointerId)); try { el.setPointerCapture(e.pointerId); } catch { /* fine */ } e.preventDefault(); };
  const move = e => { const t = touches.get(e.pointerId); if (!t) return; const d = t.move(e.clientX, e.clientY); if (d) { press(P.spent(e.pointerId)); onHop(d); } };
  const up = e => { const t = touches.get(e.pointerId); if (!t) return; touches.delete(e.pointerId); press(P.spent(e.pointerId)); const d = t.end(e.clientX, e.clientY); if (d) onHop(d); if (onAny) onAny(); e.preventDefault(); };
  const cancel = e => { touches.delete(e.pointerId); press(P.spent(e.pointerId)); };
  const no = e => e.preventDefault();
  const KEYS = { ArrowUp: 'u', ArrowLeft: 'l', ArrowRight: 'r', ArrowDown: 'd', w: 'u', a: 'l', d: 'r', s: 'd', ' ': 'u' };
  const key = e => { const d = KEYS[e.key]; if (!d || e.repeat) return; e.preventDefault(); onHop(d); if (onAny) onAny(); };
  el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', cancel);
  el.addEventListener('contextmenu', no); el.addEventListener('gesturestart', no); el.addEventListener('touchmove', no, { passive: false });
  window.addEventListener('keydown', key);
  return () => {
    el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel);
    el.removeEventListener('contextmenu', no); el.removeEventListener('gesturestart', no); el.removeEventListener('touchmove', no);
    window.removeEventListener('keydown', key);
  };
}
