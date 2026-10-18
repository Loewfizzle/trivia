// Match kit — moments: the announcement lane (max one visible, queued) and full-screen title cards.
//
//   const ann = createAnnouncer(laneEl, { prefix: 'sl' });   ann.announce('FINAL TWO', 'world');   ann.log → tests
//   const cards = createCards(overlayEl, { prefix: 'sl' });   cards.card('VICTORY', 'LAST RIDER', 3600, 'win');
//
// Elements carry `mk-*` classes (styled by css/kit.css, themed through --mk-* on the game root) and, when a `prefix`
// is given, the game's own `${prefix}-*` classes too — an existing game keeps its look, a new game needs no CSS.
import { h } from '../../ui/dom.js';

const cls = (prefix, name) => (prefix && prefix !== 'mk' ? `${prefix}-${name}` : `mk-${name}`);

export function createAnnouncer(lane, { prefix = 'mk', holdMs = 1800, outMs = 400, queueMax = 4, logMax = 60 } = {}) {
  const q = [];
  const log = [];
  let busy = 0;
  function pump() {
    const now = performance.now();
    if (!q.length) return;
    if (busy > now) { setTimeout(pump, busy - now + 20); return; }
    const a = q.shift();
    const el = h(`div.${cls(prefix, 'ann-in')}.is-${a.kind}`, a.text);
    lane.replaceChildren(el);
    busy = now + holdMs;
    setTimeout(() => el.classList.add('is-out'), holdMs - 200);
    setTimeout(() => { if (el.isConnected) el.remove(); }, holdMs - 200 + outMs);
    if (q.length) setTimeout(pump, holdMs + 20);
  }
  return {
    announce(text, kind = 'info') {
      if (!text) return;
      log.push(text); if (log.length > logMax) log.shift();
      if (q.length >= queueMax) q.shift();
      q.push({ text, kind });
      pump();
    },
    log,
    clear() { q.length = 0; busy = 0; lane.replaceChildren(); },
  };
}

export function createCards(overlay, { prefix = 'mk' } = {}) {
  const sel = `.${cls(prefix, 'card')}`;
  return {
    /** One card at a time: a new one replaces the old. `kind` → is-<kind> (win, end, gone, crash…). */
    card(title, sub, ms = 2400, kind = 'info') {
      overlay.querySelectorAll(sel).forEach(e => e.remove());
      const el = h(`div.${cls(prefix, 'card')}.is-${kind}`, h('b', { 'data-text': title }, title), sub ? h('small', sub) : null);
      overlay.append(el);
      setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 500); }, ms);
      return el;
    },
    showing(kind) { return !!overlay.querySelector(kind ? `${sel}.is-${kind}` : sel); },
    clear() { overlay.querySelectorAll(sel).forEach(e => e.remove()); },
  };
}
