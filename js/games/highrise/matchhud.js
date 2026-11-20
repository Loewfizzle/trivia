// HIGH RISE — THE MATCH's HUD (S4B — docs/highrise.md "THE MATCH"): the DOM a match adds over the stage — nothing of it in a solo run.
//   · THE ALTIMETER — a slim strip at the LEFT edge, under ☰: EVERY player's height, the highest first: a dot in their colour · their
//     name · their floor. YOU = outlined. OUT = a cross in the dot's place + the name struck (a shape, never colour alone); the finish
//     = TOP; a phone that went silent = a dash. While YOU play it takes no touch (a thumb anywhere is a drop); once you WATCH each row
//     is a 44 pt tap target: tap a player = watch them.
//   · THE RIVALS' TAGS — a rival AT or OVER you = a right-edge tag "ALEX ▲3" in their colour, in the clear column (between the HUD's
//     foot and THE DROP ZONE's upper edge — never over the play zone): the 3 nearest, merged when they would overlap (rivals.js), DIM
//     while a slab slides. (A rival UNDER you is a height tape on your own tower: night.js#setRival.)
//   · THE ANNOUNCER (the match kit's `createAnnouncer` — one visible, a short queue): the passes + the rivals' streaks + who is out.
//   · the count (3 · 2 · 1 · GO) with the names lined up · the watcher's line at the foot · the overlay the OUT card + Call the Winner use.
// Written only when something changes (a floor, the order, a tag's place): never a style write a frame. DOM only — no rules, no fetch.
import { h } from '../../ui/dom.js';
import { createAnnouncer } from '../kit/moments.js';
import { altOrder } from './rivals.js';

/** the tags a match shows at once (the nearest rivals above — merged ones share a tag) */
export const RIVAL_TAGS = 3;

/** createMatchHud(stage, hud) → the match's HUD (its nodes are added to the stage once; `hud` = the stage's own HUD column: the lane sits under its call line) */
export function createMatchHud(stage, hud) {
  const alt = h('ol.hi-alt', { 'aria-label': 'The altimeter: every player’s height' });
  const tagBox = h('div.hi-rtags', { 'aria-hidden': 'true' });
  const tags = [];
  for (let i = 0; i < RIVAL_TAGS; i++) { const t = document.createTextNode(''), el = h('div.hi-tag.hi-rtag', { hidden: true }, h('span', t)); tags.push({ el, t, text: '', y: -1e9, hex: '', on: false, dim: false }); tagBox.append(el); }
  const lane = h('div.hi-ann', { 'aria-live': 'polite' });
  const roster = h('div.hi-roster', { 'aria-label': 'Who is playing' }), countT = document.createTextNode(''), count = h('div.hi-count', { 'aria-live': 'polite' }, countT);
  const watchT = document.createTextNode(''), watch = h('div.hi-watch', { 'aria-live': 'polite' }, watchT);
  const over = h('div.hi-over.mk-theme');
  hud.append(lane);
  stage.append(alt, tagBox, roster, count, watch, over);
  const ann = createAnnouncer(lane, { prefix: 'hi', holdMs: 1500, queueMax: 3 });
  const rows = new Map();   // uid → { li, nameT, floorT, name, floor, state, me }
  let orderKey = '', pick = null, countKey = '', rosterKey = '', watchKey = '', heldAt = 0, dimOn = false;   // (heldAt: a row is under a finger — never moved then)
  /** a tap on a player's row (only while watching — css: pointer-events) = watch them. Press + lift, never a click. */
  function rowFor(uid) {
    let r = rows.get(uid);
    if (r) return r;
    const nameT = document.createTextNode(''), floorT = document.createTextNode('0');
    const li = h('li', { 'data-uid': uid }, h('i.hi-alt-dot', { 'aria-hidden': 'true' }), h('span.hi-alt-n', nameT), h('b', floorT));
    let id = null;
    li.addEventListener('pointerdown', e => { id = e.pointerId; heldAt = performance.now(); e.stopPropagation(); });
    li.addEventListener('pointerup', e => { e.stopPropagation(); heldAt = 0; if (id === e.pointerId) { id = null; if (pick) pick(uid); } });
    li.addEventListener('pointercancel', () => { id = null; heldAt = 0; });
    r = { li, nameT, floorT, name: '', floor: -1, state: '', me: null, hex: '', seen: false };
    rows.set(uid, r);
    return r;
  }
  return {
    over, lane, alt, tagBox,
    onPick(fn) { pick = fn; },
    /** THE ALTIMETER: rows [{ uid, name, hex, floor, perfects, over, end, silent, me, watched }] — every player, any order */
    altimeter(list) {
      const sorted = altOrder(list);
      let key = '';
      for (const r of rows.values()) r.seen = false;
      for (let i = 0; i < sorted.length; i++) {
        const p = sorted[i], r = rowFor(p.uid);
        r.seen = true; key += `${p.uid}|`;
        if (r.name !== p.name) { r.name = p.name; r.nameT.data = p.name; }
        if (r.floor !== p.floor) { r.floor = p.floor; r.floorT.data = String(p.floor); }
        if (r.hex !== p.hex) { r.hex = p.hex; r.li.style.setProperty('--c', p.hex); }
        const state = `${p.me ? 'is-me ' : ''}${p.end === 'made' ? 'is-made ' : p.over ? 'is-out ' : p.silent ? 'is-silent ' : ''}${p.watched ? 'is-watched' : ''}`.trim();
        if (r.state !== state) { r.state = state; r.li.className = state; }
      }
      // (THE CLOSE's REVIEW — NEVER RE-RENDER UNDER A FINGER: while a row is pressed (≤ 1.5 s) the order waits for the next change)
      if (key !== orderKey && !(heldAt && performance.now() - heldAt < 1500)) {   // (the order changed — or a player came / went: the rows are put in place once)
        orderKey = key;
        for (const [uid, r] of rows) if (!r.seen) { r.li.remove(); rows.delete(uid); }
        for (let i = 0; i < sorted.length; i++) alt.append(rows.get(sorted[i].uid).li);
      }
    },
    /** THE TAGS: the merged tags [{ text, y, uids }] (rivals.js#mergeTags) + each lead's colour (`hexOf(uid)`) — written only when they change */
    setTags(list, hexOf) {
      for (let i = 0; i < RIVAL_TAGS; i++) {
        const g = list[i], t = tags[i];
        if (!g) { if (t.on) { t.on = false; t.el.hidden = true; } continue; }
        if (t.text !== g.text) { t.text = g.text; t.t.data = g.text; }
        const hex = hexOf(g.uids[0]);
        if (t.hex !== hex) { t.hex = hex; t.el.style.setProperty('--c', hex); }
        if (Math.abs(g.y - t.y) >= 0.25) { t.y = g.y; t.el.style.transform = `translate3d(0, ${g.y.toFixed(1)}px, 0)`; }
        if (!t.on) { t.on = true; t.el.hidden = false; }
        if (t.dim !== dimOn) { t.dim = dimOn; t.el.classList.toggle('is-dim', dimOn); }
      }
    },
    /** DIM while a slab slides — on the TAGS THEMSELVES (each is its own compositor layer already: opacity there paints nothing). THE
     *  CLOSE's LAG CHECK: the class sat on the tags' full-stage box — a layout + paints at every landing, with no rival on screen
     *  too (tests/integration/highrise-paint.mjs). A tag not shown is not written. */
    dim(on) { dimOn = !!on; for (let i = 0; i < RIVAL_TAGS; i++) { const t = tags[i]; if (t.on && t.dim !== dimOn) { t.dim = dimOn; t.el.classList.toggle('is-dim', dimOn); } } },
    announce(text, kind) { ann.announce(text, kind); },
    log: () => ann.log.slice(),
    /** 3 · 2 · 1 · GO (`text`; '' = gone) + the names lined up through the count (`names` = [{ name, hex, me }], null = as they are) */
    count(text, names) {
      if (names) { const k = names.map(n => `${n.name}${n.hex}`).join('|'); if (k !== rosterKey) { rosterKey = k; roster.replaceChildren(...names.map(n => h('span', { class: n.me ? 'is-me' : null, style: { '--c': n.hex } }, n.name))); } }
      if (text === countKey) return;
      countKey = text; countT.data = text;
      count.className = `hi-count${text === 'GO' ? ' is-go' : text.length > 2 ? ' is-wait' : ''}${text ? ' is-on' : ''}`;
      roster.classList.toggle('is-on', /^[123]$/.test(text) || text.length > 2);
    },
    /** the watcher's line at the foot: WATCHING BOB · 57 · TAP FOR THE NEXT ('' = none) */
    watching(text) { if (text === watchKey) return; watchKey = text; watchT.data = text; watch.classList.toggle('is-on', !!text); },
    /** a new match on the same stage: nothing of the last one stays */
    reset() {
      for (const t of tags) { t.on = false; t.el.hidden = true; t.y = -1e9; if (t.dim) { t.dim = false; t.el.classList.remove('is-dim'); } }
      dimOn = false;
      for (const r of rows.values()) r.li.remove();
      rows.clear(); orderKey = ''; ann.clear(); over.replaceChildren();
      countKey = ''; countT.data = ''; count.className = 'hi-count'; roster.classList.remove('is-on'); watchKey = ''; watchT.data = ''; watch.classList.remove('is-on');
    },
    state: () => ({ alt: [...alt.children].map(li => ({ uid: li.dataset.uid, text: li.textContent, cls: li.className })), tags: tags.filter(t => t.on).map(t => ({ text: t.text, y: t.y, hex: t.hex })), dim: dimOn, count: countKey, roster: [...roster.children].map(e => e.textContent), watch: watchKey, calls: ann.log.slice() }),
    destroy() { alt.remove(); tagBox.remove(); lane.remove(); roster.remove(); count.remove(); watch.remove(); over.remove(); },
  };
}
