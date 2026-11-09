// PRISM DROP — THE SLIM RAIL (PD-1, the owner's plan: "the other players = a SLIM RAIL beside the board: colour + stack height + a KO mark +
// a highlight when you hit them"). One tile per opponent (~54 pt tall, shrinking to fit 7): their colour, their initial, their stack as a
// fill rising from the tile's foot, KO when they're out, a bright outline flash when your attack lands on them. The current target wears a
// thin white ring (the target picker leaves the screen in PD-2); who's hitting you a red notch. SCORE RUSH: the tiles in score order + the rank.
// A DUEL (one opponent left): their tile grows and shows their board (drawMini).
// Cheap: a tile is rebuilt only when its own signature changes; the fill is a transform (scaleY) on one layer — never a layout property.
import { h } from '../../ui/dom.js';
import { colorHex } from '../../config.js';
import { drawMini } from './board.js';
import { VISIBLE } from './engine.js';

const initialOf = name => {
  const ch = [...String(name || '?').trim()][0] || '?';
  return ch.toUpperCase();
};

export function createRail(host) {
  const tiles = new Map();   // uid → { el, sig, mini }
  const box = h('div.pd-tiles');
  host.prepend(box);
  let hitT = new Map();

  function tileFor(uid) {
    let t = tiles.get(uid);
    if (!t) {
      const el = h('div.pd-tile', { dataset: { uid } },
        h('i.pd-tile-fill', { 'aria-hidden': 'true' }),
        h('i.pd-tile-hit', { 'aria-hidden': 'true' }),
        h('b.pd-tile-ini'),
        h('span.pd-tile-rank'),
        h('span.pd-tile-ko', 'KO'));
      t = { el, sig: '', fill: -1, mini: null };
      tiles.set(uid, t);
      box.append(el);
    }
    return t;
  }

  return {
    el: box,
    /**
     * list: [{ uid, name, color, height (0–20 rows), ko, off, target, attacker, rank?, board?, piece? }] in display order
     * o: { duel (one opponent: draw their board), duelCell, look + pal (PD-3: the mini in the night look's tubes) }
     */
    update(list, o = {}) {
      const keep = new Set();
      list.forEach((p, i) => {
        keep.add(p.uid);
        const t = tileFor(p.uid);
        t.el.style.order = String(i);
        const sig = [p.name, p.color, p.ko, p.off, p.target, p.attacker, p.rank || '', o.duel ? 1 : 0].join('|');
        if (sig !== t.sig) {
          t.sig = sig;
          t.el.style.setProperty('--c', colorHex(p.color));
          t.el.querySelector('.pd-tile-ini').textContent = initialOf(p.name);
          t.el.querySelector('.pd-tile-rank').textContent = p.rank ? String(p.rank) : '';
          t.el.classList.toggle('is-ko', !!p.ko);
          t.el.classList.toggle('is-off', !!p.off);
          t.el.classList.toggle('is-target', !!p.target);
          t.el.classList.toggle('is-attacker', !!p.attacker);
          t.el.classList.toggle('is-duel', !!o.duel);
          t.el.setAttribute('aria-label', `${p.name}${p.ko ? ' — out' : ''}`);
          if (o.duel && !t.mini) { t.mini = h('canvas.pd-tile-mini'); t.el.append(t.mini); t.miniSig = ''; }
          if (!o.duel && t.mini) { t.mini.remove(); t.mini = null; }
        }
        const f = Math.max(0, Math.min(1, (p.height || 0) / VISIBLE));
        const fq = Math.round(f * 40) / 40;
        if (fq !== t.fill) { t.fill = fq; t.el.style.setProperty('--fill', String(fq)); t.el.classList.toggle('is-high', fq >= 0.65); }
        if (t.mini) {
          const ms = `${p.board}|${p.piece}|${p.ko}|${o.duelCell}|${o.look}|${o.pal ? o.pal.id : ''}`;
          if (ms !== t.miniSig) { t.miniSig = ms; drawMini(t.mini, p.board, p.piece, { cell: o.duelCell || 3, ko: !!p.ko, look: o.look, pal: o.pal }); }
        }
      });
      for (const [uid, t] of tiles) if (!keep.has(uid)) { t.el.remove(); tiles.delete(uid); }
    },
    /** your attack landed on uid: the tile's outline flashes (an opacity animation on its own layer) */
    hit(uid) {
      const t = tiles.get(uid);
      if (!t) return null;
      t.el.classList.remove('is-hit');
      void t.el.offsetWidth;   // (restart the flash — a one-off on a tap's attack, never in the frame loop)
      t.el.classList.add('is-hit');
      clearTimeout(hitT.get(uid));
      hitT.set(uid, setTimeout(() => t.el.classList.remove('is-hit'), 650));
      return t.el;
    },
    tile: uid => (tiles.get(uid) || {}).el || null,
    destroy() { for (const x of hitT.values()) clearTimeout(x); hitT = new Map(); box.remove(); tiles.clear(); },
  };
}
