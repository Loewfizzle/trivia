// THE GILDED LOOK (PROGRESSION A) — the shared pieces of the end-of-round moment, the level-up, the streak card + the membership card: the
// Art Deco fan crown, the level medal, the neon flame, a card's palette, a name glow, "X% OF PLAYERS HAVE THIS". THE ORIGINAL GILDED (black
// lacquer, brass foil, the fan, one hot-pink neon accent for what you just earned) is the default + final; the other card looks are level /
// achievement rewards (core/items.js#look — placeholder-grade until THE VAULT). css/progress.css (pg-*) loads with the first use.
import { h, reducedMotion } from '../ui/dom.js';
import { settings } from '../audio/settings.js';
import { ITEM, DEFAULT_CARD } from '../core/items.js';
import { api } from '../profile/api.js';
import { loadMe } from '../identity.js';

export const reduced = () => !!settings.reducedFx || reducedMotion();
export const num = n => Math.round(n || 0).toLocaleString('en-US');

let sheet = null;
/** The stylesheet, once (resolves when it has loaded — the moment waits for it so it never paints unstyled). */
export function pgSheet() {
  if (sheet) return sheet;
  sheet = new Promise(res => {
    if (document.querySelector('link[data-pg]')) { res(); return; }
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/css/progress.css'; l.dataset.pg = '1';
    l.onload = () => res(); l.onerror = () => res();
    document.head.append(l);
    setTimeout(res, 2500);
  });
  return sheet;
}

const NS = 'http://www.w3.org/2000/svg';
const S = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };

/** THE FAN CROWN: a half sunburst in brass over the panel's top edge (the Art Deco fan of the mockup). */
export function fanCrown() {
  const rays = [];
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI + (Math.PI * i) / 18;
    rays.push(S('line', { x1: 80 + Math.cos(a) * 14, y1: 44 + Math.sin(a) * 14, x2: 80 + Math.cos(a) * 40, y2: 44 + Math.sin(a) * 40 }));
  }
  return h('span.pg-fan', { 'aria-hidden': 'true' }, S('svg', { viewBox: '0 0 160 46' },
    S('path', { d: 'M38 44 A42 42 0 0 1 122 44', class: 'o' }),
    S('path', { d: 'M52 44 A28 28 0 0 1 108 44', class: 'i' }),
    S('g', { class: 'r' }, ...rays),
    S('line', { x1: 0, y1: 44.5, x2: 160, y2: 44.5, class: 'b' })));
}

/** THE LEVEL MEDAL: a struck gold coin with the number (flips on a level-up — css). */
export function medal(lvl, size = 64) {
  return h('span.pg-medal', { style: { '--m': `${size}px` }, 'aria-label': `Level ${lvl}` },
    h('span.pg-medal-face', h('b', String(lvl))));
}

/** THE NEON FLAME (a tube flame: a coloured outer tube + a white-hot core) — an SVG; `state`: lit · waiting · frozen · out. */
export function flameIcon(state = 'lit', size = 28) {
  const outer = 'M12 2.2c.6 3.1 3.6 4.9 4.9 7.7 1.6 3.3.6 7.7-2.6 9.7-1.1.7-2.4 1-3.6 1-3.9-.1-6.6-3.5-6.1-7.3.3-2.3 1.7-3.9 2.8-5.6.2 1.6.9 2.8 2.1 3.5C9 8.6 10 5.1 12 2.2z';
  const inner = 'M12.1 11.2c.4 1.6 1.9 2.4 2.1 4.1.2 1.8-1.1 3.3-2.8 3.3-1.6 0-2.8-1.3-2.7-2.9.1-1 .7-1.7 1.2-2.4.2.7.6 1.2 1.1 1.4-.1-1.3.3-2.4 1.1-3.5z';
  return h('span.pg-flame', { class: `is-${state}`, style: { '--f': `${size}px` }, 'aria-hidden': 'true' },
    S('svg', { viewBox: '0 0 24 24' }, S('path', { d: outer, class: 'g' }), S('path', { d: outer, class: 't' }), S('path', { d: inner, class: 'c' })));
}

/** A card's palette → CSS variables (the GILDED unless the player wears another). */
export function cardVars(id) {
  const it = ITEM[id] || ITEM[DEFAULT_CARD];
  const L = it.look || ITEM[DEFAULT_CARD].look;
  return { '--lac': L.lac, '--foil': L.foil, '--ink': L.ink, '--acc': L.acc };
}
/** A name glow's class (the old VAULT's five drawn glows; a new glow borrows the nearest until THE VAULT 2 draws it). */
export const glowClass = id => { const it = id && ITEM[id]; return it && it.kind === 'glow' ? `nm-glow-${it.old || 'neon'}` : ''; };

// "X% OF PLAYERS HAVE THIS" — the server's numbers for what this player OWNS (a minute's cache per profile — a restore or a new award asks
// again; a failure is retried after 5 s; polish: '' when unknown)
let pctMemo = null;
const pidNow = () => { try { const m = loadMe(); return (m && m.pid) || ''; } catch { return ''; } };
export async function pctFor({ fresh = false } = {}) {
  const who = pctMemo && pctMemo.test ? pctMemo.who : pidNow();
  if (!fresh && pctMemo && pctMemo.who === who && Date.now() - pctMemo.at < pctMemo.ttl) return pctMemo.v;
  try { const r = await api('profile', { action: 'pct' }); pctMemo = { at: Date.now(), ttl: 60e3, who, v: r.pct || { i: {}, a: {} } }; }
  catch { pctMemo = { at: Date.now(), ttl: 5e3, who, v: { i: {}, a: {} } }; }
  return pctMemo.v;
}
export const pctLine = p => (p ? `${p}% OF PLAYERS HAVE THIS` : '');
export const setPctForTest = v => { pctMemo = { at: Date.now(), ttl: 1e12, who: 'test', test: true, v }; };
