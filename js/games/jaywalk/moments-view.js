// JAYWALK J1 — THE MATCH MOMENTS, the screen (docs/jaywalk.md "THE MATCH MOMENTS"; the rules: moments.js — PURE). All of it sits at the TOP
// of the screen, under the lane numeral, pointer-events none — nothing covers the lanes ahead, nothing stays longer than its moment but the
// small duel strip. Transform + opacity only; Reduced motion = a steady glow, no pulse, no flash.
//   · THE OUT BANNER: "<NAME> IS OUT" (the name in the player's colour) + "87 LANES · 3 LEFT", ~1.5 s; outs within 1 s merge; the out sound
//     once a banner
//   · THE RED X → THE GRAVESTONE (the owner's add-on, Nov 21): where the out player's ghost fell — the see-through red X + their name for
//     X_MS (as before), then it SETTLES: a smaller, fainter X + the name, pinned to that spot until the match ends (it scrolls with the world —
//     the fallen ghost's own place, re-projected each frame; off the screen = hidden). Faded while it sits in the lane in front of the kid
//     on screen (graveAhead). DOM overlay only (no draw call); a transform written only when the spot moves; solo has none (match only)
//   · HEAD TO HEAD: the big words + "BEN 142 vs JUSTIN 138" → the screen's EDGES pulse red, faster with the siren → one flash at its peak →
//     the words shrink into THE DUEL STRIP (both players' lanes, live, the leader marked by a shape — never colour alone)
//   · LAST ONE STANDING: "+23 LANES AHEAD · KEEP GOING" + its sound — the run goes on
import { h } from '../../ui/dom.js';
import { createMoments, stepMoments, bannerWords, lastWords, graveAhead, OUT_MERGE_MS, BANNER_MS, X_MS, H2H_STRIP_MS, H2H_MS, LAST_MS } from './moments.js';

const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/**
 * root = the game's stage · o = { sound(id), nameOf(uid), colorOf(uid) → css colour } → { pump(s), frame(now, ghostAt), reset(), info() }
 * pump({ ids, me, ends, mine, lanes, quiet }) — the match's state, ~10× a second (quiet = this phone's own OUT card is up: no banner over it)
 * frame(now, ghostAt, kidAt) — every frame: the red X's follow their fallen ghost (ghostAt(uid) → [x, y, cellPx] on the stage | null); kidAt()
 *   → the kid on screen [x, y, cellPx] | null (a gravestone in the lane in front of it fades)
 */
export function createMomentsView(root, o) {
  const layer = h('div.jw-mom', { 'aria-live': 'polite' }), strip = h('div.jw-duel', { 'aria-label': 'The duel' });
  layer.append(strip);
  root.append(layer);
  let M = createMoments(), banner = null, bannerAt = 0, bannerList = [], h2h = null, h2hAt = 0, last = null, lastAt = 0, stripKey = '', ids0 = 0;
  const xs = [], pendingX = new Map();   // (uid → the moment its out was seen: its ghost's fall is drawn once the ghost is over — ≤ 3 s)
  const count = { out: 0, banners: 0, xs: 0, graves: 0, h2h: 0, last: 0, banner: '', duel: '' };
  const nameEl = u => h('span', { style: { color: o.colorOf(u) } }, o.nameOf(u));

  function showBanner(list, left, now) {
    const merge = banner && now - bannerAt < OUT_MERGE_MS;
    bannerList = merge ? [...bannerList, ...list] : list.slice();
    const W = bannerWords(bannerList.map(x => ({ name: o.nameOf(x.uid), l: x.l })), left);
    const head = h('b.jw-ban-h');
    bannerList.forEach((x, i) => { if (i) head.append(' + '); head.append(nameEl(x.uid)); });
    head.append(bannerList.length === 1 ? ' IS OUT' : ' OUT');
    const el = h('div.jw-ban', head, h('span.jw-ban-s', W.sub));
    if (banner) banner.remove();
    banner = el; layer.append(el); count.banner = `${W.head} · ${W.sub}`;
    if (!merge) { bannerAt = now; count.banners++; o.sound('out-drop'); }   // (the out sound ONCE a banner)
  }
  function showH2h(a, b, lanes, now) {
    if (h2h) h2h.remove();
    const rm = reduced();
    h2h = h('div.jw-h2hw', h('div.jw-edge', { class: rm ? 'is-still' : null }), rm ? null : h('div.jw-flash'),
      h('div.jw-h2h', h('b', 'HEAD TO HEAD'), h('span', nameEl(a), ` ${lanes[a] || 0} `, h('i', 'vs'), ' ', nameEl(b), ` ${lanes[b] || 0}`)));
    layer.append(h2h); h2hAt = now; count.h2h++;
    o.sound('h2h-siren');
  }
  function showLast(lead, now) {
    if (last) last.remove();
    last = h('div.jw-last', h('b', 'LAST ONE STANDING'), h('span', lastWords(lead)));
    layer.append(last); lastAt = now; count.last++;
    o.sound('last-standing');
  }
  function drawStrip(duel, lanes, now) {
    const on = !!duel && !(banner && now - bannerAt < BANNER_MS) && !(h2h && now - h2hAt < H2H_STRIP_MS);
    let key = '';
    if (on) { const [a, b] = duel, la = lanes[a] || 0, lb = lanes[b] || 0; key = `${a}:${la}|${b}:${lb}`; }
    if (key === stripKey) return;
    stripKey = key;
    if (!on) { strip.classList.remove('is-on'); count.duel = ''; return; }
    const [a, b] = duel, la = lanes[a] || 0, lb = lanes[b] || 0;
    const side = (u, n, lead) => h('span.jw-duel-p', { class: lead ? 'is-lead' : null }, nameEl(u), h('b', String(n)));
    strip.replaceChildren(side(a, la, la > lb), h('i', '·'), side(b, lb, lb > la));
    strip.classList.add('is-on');
    count.duel = `${o.nameOf(a)} ${la} · ${o.nameOf(b)} ${lb}`;
  }

  return {
    pump({ ids, me, ends, mine, lanes, quiet = false }) {
      const now = performance.now();
      if (ids.length !== ids0) { ids0 = ids.length; }
      const S = stepMoments(M, { ids, me, ends, mine, lanes });
      const outs = S.events.filter(e => e.k === 'out');
      if (outs.length) {
        count.out += outs.length;
        for (const e of outs) pendingX.set(e.uid, now);
        if (!quiet) showBanner(outs, S.alive.length, now);
      }
      for (const e of S.events) {
        if (e.k === 'h2h') showH2h(e.a, e.b, lanes, now);
        if (e.k === 'last') showLast(e.lead, now);
      }
      if (banner && now - bannerAt > BANNER_MS + 100) { banner.remove(); banner = null; }
      if (h2h && now - h2hAt > H2H_STRIP_MS) h2h.classList.add('is-shrink');
      if (h2h && now - h2hAt > H2H_MS) { h2h.remove(); h2h = null; }
      if (last && now - lastAt > LAST_MS) { last.remove(); last = null; }
      drawStrip(S.duel, lanes, now);
    },
    frame(now, ghostAt, kidAt = null) {
      const kid = kidAt ? kidAt() : null;
      for (const [u, at] of pendingX) {
        if (now - at > 3000) { pendingX.delete(u); continue; }
        const p = ghostAt(u);
        if (!p) continue;
        pendingX.delete(u);
        const el = h('div.jw-x', { style: { '--s': `${Math.round(Math.max(26, Math.min(64, p[2])))}px` } }, h('span', { style: { color: o.colorOf(u) } }, o.nameOf(u)), h('i'));
        layer.append(el); xs.push({ u, el, at: now, k: '', grave: false, ah: false }); count.xs++;
      }
      for (let i = xs.length - 1; i >= 0; i--) {
        const X = xs[i];
        // (THE GRAVESTONES: past X_MS the X settles — once — and stays for the rest of the match)
        if (!X.grave && now - X.at > X_MS) { X.grave = true; X.el.classList.add('is-grave'); count.graves++; }
        const p = ghostAt(X.u);
        if (!p) { X.el.style.visibility = 'hidden'; continue; }   // (visibility — the X's own animation owns its opacity)
        X.el.style.visibility = '';
        const key = `${Math.round(p[0])},${Math.round(p[1])}`;
        if (key !== X.k) { X.k = key; X.el.style.transform = `translate3d(${Math.round(p[0])}px,${Math.round(p[1])}px,0) translate(-50%,-50%)`; }
        const ah = graveAhead(p, kid);
        if (ah !== X.ah) { X.ah = ah; X.el.classList.toggle('is-ahead', ah); }
      }
    },
    /** a new match (a rematch remounts the view; the same view's next match id) */
    reset() { M = createMoments(); for (const X of xs) X.el.remove(); xs.length = 0; pendingX.clear(); for (const e of [banner, h2h, last]) if (e) e.remove(); banner = h2h = last = null; stripKey = ''; strip.classList.remove('is-on'); },
    info: () => ({ ...count, xsUp: xs.length, ahead: xs.filter(X => X.ah).length }),
    destroy() { layer.remove(); },
  };
}
