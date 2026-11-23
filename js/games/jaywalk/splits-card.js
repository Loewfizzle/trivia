// JAYWALK J1 — YOUR SPLITS on every run's end card (solo · match · the daily — docs/jaywalk.md "SPLIT TIMES"): one box per split REACHED
// The long notes: docs/games/jaywalk-notes.md
import { h } from '../../ui/dom.js';
import { cleanSplits, splitLane, splitClock, splitGain } from '../../core/splits.js';
import { getPref, setPref } from './lab-prefs.js';

// THIS PHONE's own run's splits, by its match (the end card is drawn by the console a moment later — victory.js reads them back)
let own = null;
export const keepOwnSplits = (matchId, sp) => { own = { m: String(matchId || ''), sp: cleanSplits(sp) }; };
export const ownSplits = matchId => (own && own.m === String(matchId || '') ? own.sp : null);

/** the bests the SERVER last told this phone (shown under the boxes until this run's answer lands; never a guess of the phone's own) */
const known = () => { try { return cleanSplits(JSON.parse(getPref('splits', '[]'))); } catch { return []; } };
export const rememberBests = b => { const v = cleanSplits(b); if (v.length) setPref('splits', JSON.stringify(v)); };

/** … */
export function splitsCard(ticks) {
  let shown = cleanSplits(ticks);
  if (!shown.length) return { el: null, server() {} };
  const row = h('div.jw-sp-row', { role: 'list' });
  const el = h('div.jw-sp', h('div.jw-sp-k', 'YOUR SPLITS'), row);
  let boxes = [];
  const build = list => {
    boxes = list.map((t, i) => {
      const best = h('span.jw-sp-best', ''), box = h('div.jw-sp-box', { role: 'listitem' }, h('b.jw-sp-t', splitClock(t)), h('span.jw-sp-at', `TO ${splitLane(i)}`), best);
      return { box, best, t };
    });
    row.replaceChildren(...boxes.map(b => b.box));
  };
  const bests = (b, news) => {
    boxes.forEach((x, i) => {
      const n = (news || []).find(q => q.i === i);
      if (n) { x.box.classList.add('is-new'); x.best.replaceChildren('NEW BEST', h('b', splitGain(n.tick, n.prev))); return; }
      x.box.classList.remove('is-new');
      x.best.textContent = b[i] != null ? `BEST ${splitClock(b[i])}` : '';
    });
  };
  build(shown);
  bests(known(), null);
  return {
    el,
    server(sp) {
      if (!sp || !el.isConnected) return;
      const r = cleanSplits(sp.r), b = sp.b != null ? cleanSplits(sp.b) : known();
      if (Array.isArray(sp.r) && !r.length) { el.hidden = true; return; }
      if (r.length && (r.length !== shown.length || r.some((t, i) => t !== shown[i]))) { shown = r; build(r); }   // (the server's numbers win)
      rememberBests(b);
      bests(b, Array.isArray(sp.n) ? sp.n : []);
    },
  };
}
