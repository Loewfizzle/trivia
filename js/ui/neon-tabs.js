// THE NEON TABS (CITY E — the owner, Nov 15: NO PILLS, NO GOLD): ONE builder for every tab row of THE BOARD (the games, THIS WEEK · ALL TIME,
// RECORDS · CAREER, a tab's boards) and the STATS sheet / /admin's stats (stats-view.js) — the words on the glass, the chosen one lit neon pink
// with a glowing line under it (a STATIC glow: nothing animates), a 44-pt tap area. css/components.css "THE NEON TABS" (.nt-tabs / .nt-tab).
// THE TAP WATCH: the buttons are built ONCE — set(v) only flips classes / aria / disabled IN PLACE (never a new node under a finger); a tap reads
// the value AT the tap. Every button acts on its own press + lift (data-press — ui/tapwatch.js).
//
//   neonTabs([{ v, l, id? }], { onPick(v), value, label, tag = 'div', cls: 'a b', btnCls: 'x', scroll, even }) → { el, set(v, off = {}), btns, value }
//     cls / btnCls: extra classes (space-separated) on the row / every button · id → data-id on its button · scroll: one sideways-scrolling
//     row (a tab's boards) · even: the buttons share the width evenly (THE BOARD's rows) — else each is its words' width (the STATS sheet)
import { h } from './dom.js';

const dots = s => (s ? `.${String(s).trim().split(/\s+/).join('.')}` : '');

export function neonTabs(opts, { onPick = null, value = null, label = '', tag = 'div', cls = '', btnCls = '', scroll = false, even = false } = {}) {
  let cur = null;
  const btns = opts.map(o => h(`button.nt-tab${dots(btnCls)}`, {
    type: 'button', 'data-press': true, role: 'tab', 'aria-selected': 'false', dataset: o.id != null ? { id: String(o.id), v: String(o.v) } : { v: String(o.v) },
    onclick: () => { if (o.v !== cur && onPick) onPick(o.v); },
  }, h('span', o.l)));
  const el = h(`${tag}.nt-tabs${scroll ? '.is-scroll' : ''}${even ? '.is-even' : ''}${dots(cls)}`, { role: 'tablist', 'aria-label': label || null }, ...btns);
  function set(v, off = {}) {
    cur = v;
    opts.forEach((o, i) => {
      const b = btns[i], on = o.v === v;
      if (b.classList.contains('is-on') !== on) b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
      const dis = !!off[o.v];
      if (b.disabled !== dis) b.disabled = dis;
    });
  }
  if (value != null) set(value);
  return { el, set, btns, get value() { return cur; } };
}
