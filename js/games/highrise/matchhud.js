// HIGH RISE — THE MATCH's HUD (S4B — docs/highrise.md "THE MATCH"): the DOM a match adds over the stage — nothing of it in a solo run.
//   · THE PLACE NUMBER (S5 — the owner: the altimeter's "moving text in the corner of your eye" is GONE): ONE big still number — since
//     REVIEW FIX A alone in the TOP-RIGHT corner, under the music button: "3RD" with "/ 8" small under it ("1ST" in gold) — written only
//     when YOUR place changes, with a short pulse (up = cyan, down = soft pink: an opacity + transform one-shot, never sliding text).
//     While you climb only. A place = the floor, then the most perfects (rivals.js#placeOf — the final ranking's rule).
//   · THE RANKED LIST (S5 — WATCH only, the altimeter's old WATCH role): the players, the highest first — at most LIST_MAX rows
//     (REVIEW FIX A: clear of the slab's way in — the leaders + the watched + YOU, "+N MORE"), big rows (≥ 44 pt): the place,
//     a bar in their colour, their name, their floor; the one you watch lit; YOU outlined; OUT = a cross + the name struck (a shape,
//     never colour alone); the finish = a gold diamond; a phone that went silent = a hollow bar. Tap a row = watch them (press + lift);
//     a tap anywhere else = the next player (the stage's own).
//   · THE RIVALS' TAGS — a rival AT or OVER you = a right-edge tag "ALEX ▲3" in their colour, in the clear column (between the HUD's
//     foot and THE DROP ZONE's upper edge — never over the play zone): the 3 nearest, merged when they would overlap (rivals.js), DIM
//     while a slab slides. (A rival UNDER you is a height tape on your own tower: night.js#setRival.)
//   · THE ANNOUNCER (the match kit's `createAnnouncer` — one visible, a short queue): the passes + who is out. S5: one short line, big
//     (16 px), held 1.5 s; the same words twice inside REPEAT_MS are said once (never a burst of one call).
//   · the count (3 · 2 · 1 · GO) with the names lined up · the watcher's line at the foot · the overlay the OUT card + Call the Winner use.
// Written only when something changes (a floor, the order, a tag's place, your place): never a style write a frame. DOM only — no rules, no fetch.
import { h } from '../../ui/dom.js';
import { createAnnouncer } from '../kit/moments.js';
import { rankInto, ordSuffix } from './rivals.js';

/** the tags a match shows at once (the nearest rivals above — merged ones share a tag) */
export const RIVAL_TAGS = 3;
/** the same call twice inside this = said once (S5 — THE ANNOUNCER CHECK: never a burst of one line) */
export const REPEAT_MS = 4000;
/** THE RANKED LIST's rows at most (REVIEW FIX A — the review's SHOULD 2: 8 rows of 44 pt ran to y 408, over where a slab slides in
 *  from the left in 83 % of its frames; 5 rows end at ~276, clear of THE DROP ZONE). Past 5 players: the leaders + the one you watch +
 *  YOU, the rest folded into a quiet "+N MORE" foot — a tap off the list still steps to the next player, every one of them. */
export const LIST_MAX = 5;
/** THE PLACE NUMBER's pulse (ms) */
export const PULSE_MS = 650;

// (the pulse's keyframes made ONCE — REVIEW FIX A: with ties by perfects the place moves at more landings; a pulse makes no lists)
const FX_CALM = [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }];
const FX_KEYS = [{ opacity: 0, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1.1)', offset: 0.22 }, { opacity: 0, transform: 'scale(1.16)' }];
const IN_KEYS = [{ transform: 'scale(1)' }, { transform: 'scale(1.1)', offset: 0.22 }, { transform: 'scale(1)' }];
const PULSE_OPT = { duration: PULSE_MS, easing: 'ease-out' };
/** createMatchHud(stage, hud) → the match's HUD (its nodes are added to the stage once; `hud` = the stage's own HUD column: the lane sits under its call line) */
export function createMatchHud(stage, hud) {
  const alt = h('ol.hi-alt', { 'aria-label': 'Every player, the highest first — tap a name to watch them' });
  const moreT = document.createTextNode(''), moreLi = h('li.hi-alt-more', { 'aria-hidden': 'true' }, moreT);
  let moreN = 0;
  // THE PLACE NUMBER: its text nodes made once (the ordinal's number · its suffix · "/ 8"), the pulse's glow a copy over it
  const placeN = document.createTextNode(''), placeS = document.createTextNode(''), placeOf_ = document.createTextNode('');
  const fxN = document.createTextNode(''), fxS = document.createTextNode('');
  const placeFx = h('div.hi-place-fx', { 'aria-hidden': 'true' }, h('b', fxN), h('i', fxS));
  const placeIn = h('div.hi-place-in', h('b', placeN), h('i', placeS), h('span', placeOf_));
  const place = h('div.hi-place', { 'aria-live': 'polite' }, placeIn, placeFx);
  let placeV = 0, placeT = 0, pulseA = null, fxA = null;
  const calm = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
  const tagBox = h('div.hi-rtags', { 'aria-hidden': 'true' });
  const tags = [];
  for (let i = 0; i < RIVAL_TAGS; i++) { const t = document.createTextNode(''), el = h('div.hi-tag.hi-rtag', { hidden: true }, h('span', t)); tags.push({ el, t, text: '', y: -1e9, hex: '', on: false, dim: false }); tagBox.append(el); }
  const lane = h('div.hi-ann', { 'aria-live': 'polite' });
  const roster = h('div.hi-roster', { 'aria-label': 'Who is playing' }), countT = document.createTextNode(''), count = h('div.hi-count', { 'aria-live': 'polite' }, countT);
  const watchT = document.createTextNode(''), watch = h('div.hi-watch', { 'aria-live': 'polite' }, watchT);
  const over = h('div.hi-over.mk-theme');
  hud.append(lane);
  stage.append(place, alt, tagBox, roster, count, watch, over);
  const ann = createAnnouncer(lane, { prefix: 'hi', holdMs: 1500, queueMax: 3 });
  const said = new Map();   // (a call's words → when they were last said: REPEAT_MS)
  const rows = new Map();   // uid → { li, nameT, floorT, name, floor, state, me }
  const order = [];   // (the ranked list's scratch: sorted in place)
  let lastList = null, rosterRef = null, orderKey = '', pick = null, countKey = '', rosterKey = '', watchKey = '', heldAt = 0, dimOn = false;   // (heldAt: a row is under a finger — never moved then)
  /** a tap on a player's row (only while watching — css: pointer-events) = watch them. Press + lift, never a click. */
  function rowFor(uid) {
    let r = rows.get(uid);
    if (r) return r;
    const nameT = document.createTextNode(''), floorT = document.createTextNode('0');
    const rankT = document.createTextNode('');
    const li = h('li', { 'data-uid': uid }, h('em', rankT), h('i.hi-alt-dot', { 'aria-hidden': 'true' }), h('span.hi-alt-n', nameT), h('b', floorT));
    let id = null;
    li.addEventListener('pointerdown', e => { id = e.pointerId; heldAt = performance.now(); e.stopPropagation(); });
    // (THE CLOSE's REVIEW: the order that waited under the finger is put right at the lift — nothing else may come to ask for it)
    li.addEventListener('pointerup', e => { e.stopPropagation(); heldAt = 0; if (id === e.pointerId) { id = null; if (pick) pick(uid); } if (lastList) api.altimeter(lastList); });
    li.addEventListener('pointercancel', () => { id = null; heldAt = 0; if (lastList) api.altimeter(lastList); });
    r = { li, nameT, floorT, rankT, rank: 0, name: '', floor: -1, state: '', me: null, hex: '', seen: false, show: true };
    rows.set(uid, r);
    return r;
  }
  const api = {
    over, lane, alt, tagBox, placeEl: place,
    onPick(fn) { pick = fn; },
    /** THE RANKED LIST (WATCH only — S5): rows [{ uid, name, hex, floor, perfects, over, end, silent, me, watched }] — every player, any
     *  order. The stage calls it only while you watch (a live climber's corner holds THE PLACE NUMBER alone). */
    altimeter(list) {
      lastList = list;
      const sorted = rankInto(list, order), n = sorted.length;
      let key = '', rank = 0, prevF = -1, prevP = -1, forced = 0, shown = 0;
      for (let i = 0; i < n; i++) if (sorted[i].me || sorted[i].watched) forced++;
      let lead = LIST_MAX - forced;   // (past LIST_MAX: the leaders' rows left once the watched one + YOU have theirs)
      for (const r of rows.values()) r.seen = false;
      for (let i = 0; i < n; i++) {
        const p = sorted[i], r = rowFor(p.uid), pf = p.perfects || 0;
        // (REVIEW FIX A — the owner's call: a place is shared only by the SAME floor AND the same perfects — the final ranking's rule,
        //  THE PLACE NUMBER's too; the review saw seven level bots all reading "1")
        if (p.floor !== prevF || pf !== prevP) { rank = i + 1; prevF = p.floor; prevP = pf; }
        r.seen = true;
        r.show = n <= LIST_MAX || p.me || p.watched || lead-- > 0;
        if (r.show) { key += `${p.uid}|`; shown++; }
        if (r.rank !== rank) { r.rank = rank; r.rankT.data = String(rank); }
        if (r.name !== p.name) { r.name = p.name; r.nameT.data = p.name; }
        if (r.floor !== p.floor) { r.floor = p.floor; r.floorT.data = String(p.floor); }
        if (r.hex !== p.hex) { r.hex = p.hex; r.li.style.setProperty('--c', p.hex); }
        const state = `${p.me ? 'is-me ' : ''}${p.end === 'made' ? 'is-made ' : p.over ? 'is-out ' : p.silent ? 'is-silent ' : ''}${p.watched ? 'is-watched' : ''}`.trim();
        if (r.state !== state) { r.state = state; r.li.className = state; }
      }
      const more = n - shown;
      // (THE CLOSE's REVIEW — NEVER RE-RENDER UNDER A FINGER: while a row is pressed (≤ 1.5 s) the order waits for the next change)
      if ((key !== orderKey || more !== moreN) && !(heldAt && performance.now() - heldAt < 1500)) {   // (the order changed — or a player came / went: the rows are put in place once)
        orderKey = key;
        for (const [uid, r] of rows) if (!r.seen) { r.li.remove(); rows.delete(uid); } else if (!r.show) r.li.remove();
        for (let i = 0; i < n; i++) { const r = rows.get(sorted[i].uid); if (r.show) alt.append(r.li); }
        if (more !== moreN) { moreN = more; moreT.data = more ? `+${more} MORE` : ''; }
        if (more) alt.append(moreLi); else moreLi.remove();
      }
    },
    /** THE PLACE NUMBER (S5): `rank` of `n` (0 = hidden). Written ONLY when it changes; a change after the first = the pulse — up (a
     *  better place) cyan, down soft pink; a WAAPI one-shot of opacity + transform (the glow copy) — nothing slides, nothing per frame */
    place(rank, n) {
      if (rank === placeV && n === placeT) return;
      const was = placeV;
      placeV = rank; placeT = n;
      if (!rank) { place.classList.remove('is-on'); return; }
      const sfx = ordSuffix(rank), num = String(rank);
      placeN.data = num; placeS.data = sfx; placeOf_.data = `/ ${n}`; fxN.data = num; fxS.data = sfx;
      place.className = `hi-place is-on${rank === 1 ? ' is-first' : ''}`;
      if (was && was !== rank && placeFx.animate) {
        placeFx.className = `hi-place-fx ${rank < was ? 'is-up' : 'is-down'}`;
        if (fxA) fxA.cancel();
        fxA = placeFx.animate(calm ? FX_CALM : FX_KEYS, PULSE_OPT);
        if (!calm) { if (pulseA) pulseA.cancel(); pulseA = placeIn.animate(IN_KEYS, PULSE_OPT); }
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
    /** a call — the same words inside REPEAT_MS are said once (S5: never a burst of one line) */
    announce(text, kind) {
      const now = performance.now(), at = said.get(text);
      if (at != null && now - at < REPEAT_MS) return;
      said.set(text, now);
      if (said.size > 40) for (const [k, t] of said) if (now - t >= REPEAT_MS) said.delete(k);
      ann.announce(text, kind);
    },
    log: () => ann.log.slice(),
    /** 3 · 2 · 1 · GO (`text`; '' = gone) + the names lined up through the count (`names` = [{ name, hex, me }], null = as they are) */
    count(text, names) {
      // (S5 — ZERO GARBAGE IN A MATCH: the same list handed again (the pump's, 10 × a second) is not looked at again)
      if (names && names !== rosterRef) { rosterRef = names; const k = names.map(n => `${n.name}${n.hex}`).join('|'); if (k !== rosterKey) { rosterKey = k; roster.replaceChildren(...names.map(n => h('span', { class: n.me ? 'is-me' : null, style: { '--c': n.hex } }, n.name))); } }
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
      rows.clear(); orderKey = ''; moreN = 0; moreT.data = ''; moreLi.remove(); rosterRef = null; lastList = null; ann.clear(); said.clear(); over.replaceChildren();
      placeV = 0; placeT = 0; place.className = 'hi-place'; if (fxA) { fxA.cancel(); fxA = null; } if (pulseA) { pulseA.cancel(); pulseA = null; }
      countKey = ''; countT.data = ''; count.className = 'hi-count'; roster.classList.remove('is-on'); watchKey = ''; watchT.data = ''; watch.classList.remove('is-on');
    },
    state: () => ({ place: placeV ? `${placeV}${ordSuffix(placeV)} / ${placeT}` : '', placeCls: place.className, alt: [...alt.children].filter(li => li !== moreLi).map(li => ({ uid: li.dataset.uid, text: li.textContent, cls: li.className })), more: moreN, tags: tags.filter(t => t.on).map(t => ({ text: t.text, y: t.y, hex: t.hex })), dim: dimOn, count: countKey, roster: [...roster.children].map(e => e.textContent), watch: watchKey, calls: ann.log.slice() }),
    destroy() { place.remove(); alt.remove(); tagBox.remove(); lane.remove(); roster.remove(); count.remove(); watch.remove(); over.remove(); },
  };
  return api;
}
