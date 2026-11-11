// THE VAULT 2B — CUSTOMIZE (built as DRESS YOUR CARD; THE VAULT 2C renamed it — the owner, Nov 3 6:08 pm: "doesn't sound right" → the
// profile's button CUSTOMIZE YOUR CARD, the screen CUSTOMIZE). The owner's fix for the picker's long lists ("all listed, hard to understand"),
// APPROVED 3:27 pm — Downloads\NEON\vault\dress-your-card.png. 2C — ONE EMBLEM SYSTEM, ONE PLACE: the 12 sign-up shapes are COMMON emblems
// in the EMBLEM tab with the earned ones (core/items.js#SIGN_EMBLEMS); the emblem, card, glow + tube change ONLY here. Two pieces:
//   THE PROFILE's PANEL  your strip as it is now (live — exactly what the lobby sees), the worn pieces' names under it, a big DRESS YOUR
//                        CARD button; + YOUR COLLECTION (a count line: cards · emblems · glows · tubes — what you OWN, never a total
//                        of what exists). The long VAULT lists are gone from the profile.
//   THE DRESS SCREEN     your strip PINNED at the top, live ("THE LOBBY SEES THIS" · VIEW FULL ›); 4 tabs CARD · EMBLEM · GLOW · TUBE
//                        (one list at a time); COMPACT TILES 3 across, each edged in its TIER colour (core/rarity.js — the one palette),
//                        the worn one ticked ✓; TAP a tile → the strip above changes AT ONCE (worn — nothing to save; the server is
//                        told, and a refusal puts it back); LONG-PRESS a card tile (or VIEW FULL ›) → the full card. Only owned items.
// SPEED: the pinned strip is its own effect surface (it LEADS); the tiles are one more surface inside the scrolling list — only the
// tiles on screen draw (js/fx/renderer.js), every emblem a stack of composited layers (emblem-art.js), the calmer cut on the tiles.
//   dressPanel(data, o) → [panel, collection]     o = { name, wear(slot, id) → Promise<boolean>, view(id, who) }
//   openDress(data, o) → { close() }
import { tapHandled, afterTap } from '../ui/tapwatch.js';
import { row } from '../ui/components.js';
import { h } from '../ui/dom.js';
import { createSurface } from '../fx/renderer.js';
import { FX } from '../fx/index.js';
import { TIER_NAMES, TIERS, ITEM, ownedOf, signOf, signName } from '../core/items.js';
import { levelInfo } from '../core/levels.js';
import { memberLabel } from '../core/member.js';
import { isDevCard, isOneOfOne, ONE_OF_ONE, DEV_CARDS, ONE_OF_ONE_CARDS } from '../core/dev-cards.js';
import { gemEl } from './gems.js';
import { emblemEl, hasArt, tubeApplies, TUBE_STYLES } from './emblem-art.js';
import { applyGlow, GLOW_ART } from './glows.js';
import { stripEl, LOOKS, vaultSheet, fxOpts, embTier } from './strip.js';
import { takeLayer, onCloseAll } from '../ui/layers.js';
import { prominence } from './emblems.js';
import { approvedIds } from './approved.js';
import { cardVars } from '../progress/look.js';
import { fitName } from '../ui/fit.js';
import { colorHex } from '../config.js';
import { openYouEditor } from '../profile/edit.js';
import { lazyImport } from '../ui/lazy-import.js';

const SLOT = { card: 'card', emblem: 'shape', glow: 'glow', tube: 'tube' };
const TABS = [['card', 'CARD'], ['emblem', 'EMBLEM'], ['glow', 'GLOW'], ['tube', 'TUBE']];
const NONE = { glow: 'NO GLOW', tube: 'PLAIN TUBE' };   // (2C: no "YOUR SHAPE" tile — the 12 sign-up shapes are emblems of their own)
/** the sign-up shape's name ('alien' → NEON ALIEN) */
const shapeName = a => signName(a || 'bolt');
const nameOf = id => (ITEM[id] || {}).name || '';
/** dev cards first (ONE OF ONE), then the rarest, then the newest (ownedOf's order) */
const devAt = id => (isOneOfOne(id) ? ONE_OF_ONE_CARDS.indexOf(id) : 99);   // (B2: the dev cards, then the gift cards, lead)
const order = list => list.map((x, i) => [x, i]).sort(([a, i], [b, j]) => (devAt(a.id) - devAt(b.id)) || (TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier)) || i - j).map(([x]) => x);

/** what the profile says you wear */
const wornOf = p => ({ card: p.cd || 'card-gilded', shape: p.es || null, tube: p.tb || null, glow: p.g || null });
const whoOf = (data, name) => { const p = data.profile || {}, s = data.stats || {}; return { name: (name || p.n || 'YOU').toUpperCase(), lv: levelInfo(s.xp || p.x || 0).lvl, avatar: p.a || 'bolt', color: p.c || 'magenta', no: memberLabel(p.mn), at: p.at, fd: !!p.fd, pub: p }; };

/** a strip wearing W (approved art — else the card's plain palette); its effect a slot on `surface` */
function wornStrip(surface, W, who, approved, seed = 1) {
  const card = W.card || 'card-gilded', tier = (ITEM[card] || {}).tier || 'common';
  const real = !!(approved && approved.has(card) && LOOKS[card]);
  const s = stripEl({ card: real ? card : null, tier, name: who.name, lv: who.lv, plain: real ? null : cardVars(card),
    emblem: hasArt(W.shape) ? W.shape : null, avatar: who.avatar, color: who.color, tube: W.tube, glow: W.glow, no: who.no });
  if (isOneOfOne(card)) oneOfOne(s);
  if (real && LOOKS[card].fx && FX[LOOKS[card].fx]) surface.add(s, FX[LOOKS[card].fx], fxOpts(card, { seed, calm: 0, radius: 12 }));
  return s;
}
/** a DEV card's strip (a tier above legendary in look): THE DEV GEM in its corner (THE VAULT 2C — no words on a strip) */
export function oneOfOne(el) {
  el.classList.add('vl-dev1');
  const g = el.querySelector(':scope > .vl-gem'); if (g && !g.classList.contains('vl-gem-dev')) g.replaceWith(gemEl(null, { dev: true }));
  return el;
}
/** the worn pieces in words: INFERNO · THE ALIEN · EMBER (+ the tube style) */
const wornLine = (W, who) => [nameOf(W.card) || 'GILDED', W.shape && ITEM[W.shape] ? nameOf(W.shape) : shapeName(who.avatar), W.glow ? nameOf(W.glow) : null, W.tube ? nameOf(W.tube) : null].filter(Boolean).join(' · ');

/** a surface whose slots are tracked: clear() drops them all (a repaint), the canvas stays (it lives in `host`; the content goes in a
 *  child box — replacing the host's own children would take the canvas with them) */
function tracked(host, label) {
  const S = createSurface(host, { label }), on = new Set();
  return { add: (el, fx, opts) => { on.add(el); return S.add(el, fx, opts); }, clear() { for (const e of on) S.remove(e); on.clear(); }, destroy() { S.destroy(); } };
}

// ---------------------------------------------------------------- THE PROFILE's PANEL
export function dressPanel(data, o = {}) {
  vaultSheet();
  const who = whoOf(data, o.name), W = wornOf(data.profile || {}), owned = (data.stats || {}).it || {};
  const box = h('div.vl-dp-box'), host = h('div.vl-dp-strip.fx-host', box);
  const surface = tracked(host, 'dress-panel');
  let approved = null;
  const paint = () => { surface.clear(); box.replaceChildren(wornStrip(surface, W, who, approved)); };
  paint();
  approvedIds().then(a => { approved = a; paint(); }).catch(() => {});
  const panel = h('section.pg-panel.vl-dp', { dataset: { worn: W.card } },
    h('div.vl-dp-k', 'YOUR CARD'),
    host,
    h('p.vl-dp-worn', wornLine(W, who)),
    h('button.btn.btn-primary.btn-block.vl-dp-go', { type: 'button', onclick: () => openDress(data, o) }, 'CUSTOMIZE YOUR CARD'));
  const n = k => ownedOf(owned, k).length;
  const cnt = (v, one, many) => h('span', h('b', String(v)), ` ${v === 1 ? one : many}`);
  const coll = h('section.pg-panel.vl-dc',
    h('div.vl-dp-k', 'YOUR COLLECTION'),
    h('div.vl-dc-row', cnt(n('card'), 'card', 'cards'), cnt(n('emblem'), 'emblem', 'emblems'), cnt(n('glow'), 'glow', 'glows'), cnt(n('tube'), 'tube', 'tubes')));
  return [panel, coll];
}

// ---------------------------------------------------------------- THE DRESS SCREEN
let openNow = null;
onCloseAll(() => { if (openNow) openNow.close(); });   // (FR6 FIXES A — B1)
export function openDress(data, o = {}) {
  if (openNow) openNow.close();
  vaultSheet();
  const who = whoOf(data, o.name), W = wornOf(data.profile || {}), owned = (data.stats || {}).it || {};
  let approved = null, tab = 'card', closed = false;

  // the pinned strip (its own surface — it leads)
  const pinBox = h('div.vl-dr-pinbox'), pin = h('div.vl-dr-pin.fx-host', pinBox);
  const pinSurf = tracked(pin, 'dress-pin');
  const paintPin = () => { pinSurf.clear(); pinBox.replaceChildren(wornStrip(pinSurf, W, who, approved)); pin.dataset.card = W.card; };
  const view = () => (o.view ? o.view(W.card, { ...who, shape: W.shape, tube: W.tube, glow: W.glow }) : lazyImport(import('./full.js'), './full.js').then(m => m.openFullCard(W.card, { ...who, shape: W.shape, tube: W.tube, glow: W.glow })));

  // the tabs + the grid (one surface for the tiles, inside the scrolling list)
  const tabBtns = TABS.map(([k, label]) => h('button.vl-dr-tab', { type: 'button', role: 'tab', dataset: { tab: k }, 'aria-selected': String(k === tab), onclick: () => { if (tab !== k) { tab = k; paintGrid(); } } }, label));
  const note = h('p.vl-dr-note');
  const grid = h('div.vl-dr-grid', { role: 'tabpanel' }), gridHost = h('div.vl-dr-gridhost.fx-host', grid);
  const gridSurf = tracked(gridHost, 'dress-tiles');
  const scroll = h('div.vl-dr-scroll', note, gridHost);

  /** one tile: its art (a card's live mini · an emblem · the name in a glow · a tube style on your neon), its name, its tier edge */
  function tile(kind, it, i) {
    const id = it ? it.id : '', slot = SLOT[kind], sign = signOf(id);
    const on = sign ? !W.shape && who.avatar === sign : (W[slot] || '') === id || (kind === 'card' && !id);
    const tier = it ? it.tier : 'common';
    const art = h('div.vl-dt-art');
    if (kind === 'card') {
      const real = !!(approved && approved.has(id) && LOOKS[id]);
      const m = h('div.vl-strip.vl-dt-mini', { class: `vl-t-${tier} vl-s-${real ? LOOKS[id].mat : 'plain'}`, style: real ? undefined : cardVars(id) }, h('i.vl-mat', { 'aria-hidden': 'true' }), h('i.vl-frame', { 'aria-hidden': 'true' }));
      art.append(m);
      if (real && LOOKS[id].fx && FX[LOOKS[id].fx]) gridSurf.add(m, FX[LOOKS[id].fx], fxOpts(id, { seed: 2 + i, calm: 1, radius: 8, tile: true }));
    } else if (kind === 'emblem') {
      art.append(emblemEl({ id: it && hasArt(id) ? id : null, avatar: sign || who.avatar, color: who.color, tube: W.tube, mode: 'even', size: 46 }));
    } else if (kind === 'glow') {
      const b = h('b.vl-dt-name', who.name);
      art.append(fitName(applyGlow(b, id || null), { min: 9 }));
    } else {
      const shape = tubeApplies(W.shape) ? W.shape : null;
      art.append(emblemEl({ id: hasArt(shape) ? shape : null, avatar: who.avatar, color: who.color, tube: id || null, mode: 'lead', size: 46 }));
    }
    const label = it ? it.name : NONE[kind];
    const t = h('button.vl-dt', { type: 'button', class: `vl-dt-${tier}${on ? ' is-on' : ''}${it && isOneOfOne(id) ? ' is-one' : ''}${it ? '' : ' is-none'}`,
      dataset: { id: id || 'none', tier: it ? tier : '' }, 'aria-pressed': String(on), 'aria-label': `${on ? 'Equipped' : 'Equip'} ${label}${it ? ` (${isOneOfOne(id) ? ONE_OF_ONE : TIER_NAMES[tier]})` : ''}` },
      art, h('span.vl-dt-n', label), on ? h('i.vl-dt-on', { 'aria-hidden': 'true' }, '✓') : null);
    press(t, () => wear(kind, id), kind === 'card' && it ? () => (o.view ? o.view(id, { ...who, shape: W.shape, tube: W.tube, glow: W.glow }) : lazyImport(import('./full.js'), './full.js').then(m => m.openFullCard(id, { ...who, shape: W.shape, tube: W.tube, glow: W.glow }))) : null);
    return t;
  }
  // THE SPEED PASS — EDIT USERNAME (the owner's FINAL, Nov 4 6:25 pm): ONE row at the VERY TOP of CUSTOMIZE — your name + its colour dot —
  // opening ONE editor with the name + the colour together (profile/edit.js — on top, ‹ = one step back); your strip follows
  // (SHELL 2.0 A: THE ROW — the user icon lit in your colour (the old colour dot), your name as its value)
  const youRow = row({ icon: 'user', ic: colorHex(who.color), label: 'Edit username', value: who.name, cls: 'vl-yr-row vl-yr-name', attrs: { 'aria-label': 'Edit your username and colour' },
    onClick: () => openYouEditor((v, done) => { who.name = v.name.toUpperCase(); who.color = v.color; youChanged(done); }) });
  const paintYou = () => { youRow.style.setProperty('--ic', colorHex(who.color)); const v = youRow.querySelector('.sh-row-v'); if (v) v.textContent = who.name; };
  // (CITY FIXES — THE TAP WATCH: the repaints that land LATER (the server's answer, the approved list) never replace a tile under a finger)
  const youChanged = done => afterTap(() => { paintYou(); paintPin(); paintGrid(); line.textContent = wornLine(W, who); if (done && o.onYou) done.then(() => o.onYou()).catch(() => {}); });
  const youRows = h('div.vl-yr', youRow);
  function paintGrid() {
    for (const b of tabBtns) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
    gridSurf.clear();
    const items = order(ownedOf(owned, tab));
    const list = tab === 'card' || tab === 'emblem' ? items : [null, ...items];
    grid.dataset.tab = tab;
    grid.replaceChildren(...list.map((it, i) => tile(tab, it, i)));
    // (a tube style lights NEON emblems — said when a special finish is worn; the tiles show it on your own shape)
    const special = tab === 'tube' && !tubeApplies(W.shape);
    note.textContent = special ? `Tube styles light NEON emblems — ${nameOf(W.shape)} keeps its own light. Shown on your own shape.`
      : tab === 'card' ? 'Hold a card to see it full size.' : '';
    note.hidden = !note.textContent;
  }
  async function wear(kind, id) {
    const slot = SLOT[kind], sign = signOf(id);
    // (2C — a sign-up shape: it becomes your shape + takes a worn earned emblem off; the server does the same — profiles/{pid}/a)
    if (sign) {
      if (!W.shape && who.avatar === sign) return;
      const was = [W.shape, who.avatar];
      W.shape = null; who.avatar = sign;
      paintPin(); paintGrid(); line.textContent = wornLine(W, who);
      const ok = o.wear ? await o.wear('shape', id) : true;
      if (!ok && !closed) { [W.shape, who.avatar] = was; paintPin(); paintGrid(); line.textContent = wornLine(W, who); }
      return;
    }
    if ((W[slot] || '') === (id || '') || (kind === 'card' && !id)) return;
    const was = W[slot];
    W[slot] = id || (kind === 'card' ? 'card-gilded' : null);
    paintPin(); paintGrid(); line.textContent = wornLine(W, who);
    const ok = o.wear ? await o.wear(slot, id) : true;
    if (!ok && !closed) { W[slot] = was; paintPin(); paintGrid(); line.textContent = wornLine(W, who); }
  }

  const line = h('p.vl-dr-worn', wornLine(W, who));
  let release = null;
  const close = () => { if (closed) return; closed = true; pinSurf.destroy(); gridSurf.destroy(); el.classList.remove('is-in'); setTimeout(() => el.remove(), 220); openNow = null; if (release) release(); if (o.onClose) o.onClose(); };
  const el = h('div.vl-dress', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Customize your card' },
    h('div.vl-dr-in',
      h('header.vl-dr-head', h('button.vl-dr-back', { type: 'button', 'aria-label': 'Back', onclick: close }, '‹'), h('h2', 'CUSTOMIZE')),
      youRows,
      pin,
      h('div.vl-dr-sub', h('span', 'THE LOBBY SEES THIS'), h('button.vl-dr-view', { type: 'button', onclick: view }, 'VIEW FULL ›')),
      line,
      h('div.vl-dr-tabs', { role: 'tablist' }, ...tabBtns),
      scroll));
  // (THE LAYER STACK — the owner's room test, Nov 4: it opened BEHIND the room's profile overlay; now always on top of what opened it)
  release = takeLayer(el, { close: () => close() });   // (SHELL 2.0 A: the one Esc — ui/layers.js — closes it when it's on top)
  document.body.append(el);
  paintPin(); paintGrid(); paintYou();
  requestAnimationFrame(() => el.classList.add('is-in'));
  approvedIds().then(a => afterTap(() => { if (closed) return; approved = a; paintPin(); paintGrid(); })).catch(() => {});
  openNow = { close, el };
  return openNow;
}

/** a tap (pointerdown + pointerup, never `click` alone — iOS) + an optional long-press (~0.5 s, no movement) */
function press(el, onTap, onHold) {
  let t = 0, x = 0, y = 0, held = false, down = false;
  // (the hold: our own timer — iOS (its callout is off on the tiles) — or the browser's own long-press, a `contextmenu` (Android /
  //  Chromium take the pointer at ~500 ms with a pointercancel), whichever comes first; once a press)
  const hold = () => { clearTimeout(t); if (held || !onHold) return; held = true; onHold(); };
  el.addEventListener('pointerdown', e => {
    down = true; held = false; x = e.clientX; y = e.clientY;
    if (onHold) t = setTimeout(hold, 450);
  });
  el.addEventListener('pointermove', e => { if (down && Math.hypot(e.clientX - x, e.clientY - y) > 10) { down = false; clearTimeout(t); } });
  // (CITY FIXES — THE TAP WATCH: a tap it took says so (ui/tapwatch.js#tapHandled — never a lost tap, never rescued twice); a CLICK that
  //  no lift of ours answered (THE RESCUE's click on a tile a re-render replaced mid-tap — its new copy never saw the pointerdown) taps too)
  let tookAt = -1e9;
  el.addEventListener('pointerup', () => { clearTimeout(t); if (down && !held) { tookAt = performance.now(); tapHandled(); onTap(); } down = false; });
  el.addEventListener('click', () => { if (held || performance.now() - tookAt < 800) return; tookAt = performance.now(); onTap(); });
  el.addEventListener('pointercancel', () => { clearTimeout(t); down = false; });
  el.addEventListener('contextmenu', e => { if (!onHold) return; e.preventDefault(); if (!held) hold(); });
  // (a HOLD's lift must not click what opened under the finger — the full card's backdrop closed it at once)
  el.addEventListener('touchend', e => { if (held) e.preventDefault(); });
  // (the keyboard: Enter / Space = a tap)
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } });
}
export { GLOW_ART, prominence, embTier };
