// THE NEON TABS (CITY E — the owner, Nov 15: NO PILLS, NO GOLD): ONE builder for every tab row of THE BOARD (the games, THIS WEEK · ALL TIME,
// RECORDS · CAREER, a tab's boards) and the STATS sheet / /admin's stats (stats-view.js) — the words on the glass, the chosen one lit neon pink
// with a glowing line under it (a STATIC glow: nothing animates), a 44-pt tap area. css/components.css "THE NEON TABS" (.nt-tabs / .nt-tab).
// THE TAP WATCH: the buttons are built ONCE — set(v) only flips classes / aria / disabled IN PLACE (never a new node under a finger); a tap reads
// the value AT the tap. Every button acts on its own press + lift (data-press — ui/tapwatch.js); a fling's stop never acts (the tap watch's).
//
//   neonTabs([{ v, l, id? }], { onPick(v), value, label, tag = 'div', cls: 'a b', btnCls: 'x', scroll, even }) → { el, set(v, off = {}), btns, value }
//     cls / btnCls: extra classes (space-separated) on the row / every button · id → data-id on its button · scroll: one sideways-scrolling
//     row (THE BOARD's games, a tab's boards — THE CITY POLISH PASS: a soft fade on an edge with more tabs past it, the picked tab scrolled into
//     view when the row is first on screen and at every pick; momentum; never a page-level sideways scroll) · even: the buttons share the width
//     evenly — else each is its words' width (the STATS sheet)
import { h } from './dom.js';

const dots = s => (s ? `.${String(s).trim().split(/\s+/).join('.')}` : '');

export function neonTabs(opts, { onPick = null, value = null, label = '', tag = 'div', cls = '', btnCls = '', scroll = false, even = false } = {}) {
  let cur = null;
  const btns = opts.map(o => h(`button.nt-tab${dots(btnCls)}`, {
    type: 'button', 'data-press': true, role: 'tab', 'aria-selected': 'false', dataset: o.id != null ? { id: String(o.id), v: String(o.v) } : { v: String(o.v) },
    onclick: () => { if (o.v !== cur && onPick) onPick(o.v); },
  }, h('span', o.l)));
  const el = h(`${tag}.nt-tabs${scroll ? '.is-scroll' : ''}${even ? '.is-even' : ''}${dots(cls)}`, { role: 'tablist', 'aria-label': label || null }, ...btns);
  // (the edge fades: the first / last tab fully in view or not — an observer, never a layout read in a frame or a scroll handler)
  let seen = false;
  if (scroll && typeof IntersectionObserver === 'function' && btns.length > 1) {
    const io = new IntersectionObserver(es => {
      for (const e of es) {
        const full = e.intersectionRatio > 0.98;
        if (e.target === btns[0]) el.classList.toggle('is-fade-l', !full);
        if (e.target === btns[btns.length - 1]) el.classList.toggle('is-fade-r', !full);
      }
      if (!seen && es.some(e => e.rootBounds && e.rootBounds.width > 0)) { seen = true; reveal(false); }   // (first on screen: the picked tab in view)
    }, { root: el, threshold: [0, 0.98, 1] });
    io.observe(btns[0]); io.observe(btns[btns.length - 1]);
  }
  /** the picked tab into view (its centre, clamped by the browser) — read ONCE at a pick / the first showing, never per frame */
  function reveal(smooth = true) {
    if (!scroll || !el.isConnected) return;
    const i = opts.findIndex(o => o.v === cur), b = btns[i];
    if (!b || !(el.clientWidth > 0)) return;
    const left = b.offsetLeft - (el.clientWidth - b.offsetWidth) / 2;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { el.scrollTo({ left: Math.max(0, left), behavior: smooth && !reduce ? 'smooth' : 'auto' }); } catch { el.scrollLeft = Math.max(0, left); }
  }
  function set(v, off = {}) {
    const moved = v !== cur;
    cur = v;
    opts.forEach((o, i) => {
      const b = btns[i], on = o.v === v;
      if (b.classList.contains('is-on') !== on) b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
      const dis = !!off[o.v];
      if (b.disabled !== dis) b.disabled = dis;
    });
    if (moved && seen) reveal(true);
  }
  if (value != null) set(value);
  return { el, set, btns, reveal, get value() { return cur; } };
}
