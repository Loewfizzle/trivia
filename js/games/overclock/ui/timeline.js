// OVERCLOCK — TIMELINE: tap four items into order. OC3B — THE OVERDRIVE LOOK (docs/overclock.md "Challenge looks"): the set's chip + the
// question in bold white, the direction as a slanted rail (1 = EARLIEST ━ 4 = LATEST), FOUR SLANTED GLASS ROWS (one item each, bold white —
// the style-C tile skin); a tap turns a row HOT ORANGE with its order badge (1–4), a tap again takes it back (the later ones close up, as
// before); LOCK IT IN (big orange — the kit's GO key) lights once all four are numbered. Locked: each row rests ✓ (--good edge) or ✕ (red edge
// + its right place) with its value; the burst for a perfect order. Timings unchanged (2200 ms to the done screen). Your order is kept for
// THE ANSWER (api.pick — this device only) beside the sealed one (game record `o`).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { timelineCorrect } from '../challenges.js';
import { tubeMark } from '../../kit/answer.js';

export default function uiTimeline(s, api) {
  const { chal } = api;
  let picks = [];
  const [from, to] = s.dir.split('→').map(x => x.trim());
  const lock = h('button.gk-key.gk-go.oc-tl-lock', { type: 'button', dataset: { sfx: 'none' }, disabled: true, 'aria-label': 'Lock it in' },
    h('span.gk-key-face'), h('span.gk-key-glow'), h('span.gk-key-label', 'LOCK IT IN'));
  lock.addEventListener('pointerdown', e => { e.preventDefault(); submit(); });
  lock.addEventListener('click', e => { if (e.detail === 0) submit(); });
  const rows = s.shown.map((pos, idx) => {
    const it = s.items[pos];
    const b = h('button.oc-tile.oc-tl-row', { type: 'button', dataset: { sfx: 'none', i: String(idx) }, 'aria-label': it.label },
      h('span.oc-tile-face'), h('span.oc-tile-ok'), h('span.oc-tile-bad'), h('span.oc-tile-glow'),
      h('i.oc-tl-badge', { 'aria-hidden': 'true' }), h('span.oc-tile-t.oc-tl-t', it.label), h('span.oc-tl-val'), h('i.oc-tile-mark', { 'aria-hidden': 'true' }));
    b.addEventListener('pointerdown', e => { e.preventDefault(); tap(idx); });
    b.addEventListener('click', e => { if (e.detail === 0) tap(idx); });
    return b;
  });
  const list = h('div.oc-tiles.oc-tl-list', rows);
  const paint = () => {
    rows.forEach((r, idx) => {
      const k = picks.indexOf(idx);
      r.classList.toggle('is-picked', k >= 0);
      r.querySelector('.oc-tl-badge').textContent = k >= 0 ? String(k + 1) : '';
      r.setAttribute('aria-label', `${s.items[s.shown[idx]].label}${k >= 0 ? ` — number ${k + 1}` : ''}`);
    });
    lock.disabled = picks.length < 4;
    lock.classList.toggle('is-ready', picks.length === 4);
  };
  const tap = idx => {
    if (chal.done) return;
    const k = picks.indexOf(idx);
    if (k >= 0) picks.splice(k, 1); else if (picks.length < 4) picks.push(idx);
    else return;
    api.sfx('tap');
    paint();
    if (k < 0) pulseClass(rows[idx].querySelector('.oc-tl-badge'), 'is-pop', 400);
  };
  const submit = () => {
    if (chal.done || picks.length < 4) return;
    const right = timelineCorrect(s, picks);
    api.pick(0, picks.slice());
    let firstWrong = null;
    rows.forEach((r, idx) => {
      const pos = s.shown[idx];
      const ok = picks.indexOf(idx) === pos;
      r.classList.add('is-locked', ok ? 'is-right' : 'is-wrong');
      r.querySelector('.oc-tile-mark').replaceChildren(tubeMark(ok ? 'check' : 'cross', ok ? 'In place' : `Belongs at ${pos + 1}`));
      r.querySelector('.oc-tl-val').replaceChildren(...(ok ? [] : [h('small', `#${pos + 1}`)]), h('b', s.items[pos].value));
      if (!ok && !firstWrong) firstWrong = r;
    });
    lock.disabled = true;
    lock.classList.add('is-sent');
    if (right === 4) api.fx(list, true); else if (firstWrong) api.fx(firstWrong, false);
    api.sfx(right >= 2 ? 'correct' : 'wrong');
    api.progress(right, 4, { o: picks.join('') }, true, 2200);
  };
  api.key = e => {
    const n = Number(e.key);
    if (n >= 1 && n <= 4) tap(n - 1);
    else if (e.key === 'Enter') { e.preventDefault(); submit(); }
  };
  paint();
  const el = h('div.ch.oc-tl',
    h('div.oc-qhead', h('span.oc-chip', s.title), h('span.oc-qn', 'TAP ', h('b', '1'), ' → ', h('b', '4'))),
    h('p.oc-q.oc-tl-q', s.ask),
    h('div.oc-tl-dir', { 'aria-label': `1 is ${from}, 4 is ${to}` }, h('span.oc-tl-end', h('b', '1'), from), h('i.oc-tl-rail', { 'aria-hidden': 'true' }), h('span.oc-tl-end.is-to', h('b', '4'), to)),
    list,
    lock);
  return { el, destroy() { api.key = null; } };
}
