// THE GILDED LOOK (PROGRESSION A) — the shared pieces of the end-of-round moment, the level-up, the streak card + the membership card: the
// Art Deco fan crown, the level medal, the neon flame, a card's palette, a name glow, "X% OF PLAYERS HAVE THIS". THE ORIGINAL GILDED (black
// lacquer, brass foil, the fan, one hot-pink neon accent for what you just earned) is the default + final; the other card looks are level /
// achievement rewards (core/items.js#look — placeholder-grade until THE VAULT). css/progress.css (pg-*) loads with the first use.
import { h, reducedMotion } from '../ui/dom.js';
import { settings } from '../audio/settings.js';
import { ITEM, DEFAULT_CARD } from '../core/items.js';
import { api } from '../profile/api.js';
import { loadMe } from '../identity.js';
import { flameArt } from './flame-art.js';

export const reduced = () => !!settings.reducedFx || reducedMotion();
export const num = n => Math.round(n || 0).toLocaleString('en-US');

let sheet = null;
/** The stylesheet, once (resolves when it has loaded — the moment waits for it so it never paints unstyled). */
export function pgSheet() {
  if (sheet) return sheet;
  // (+ THE VAULT's sheet — the slim strips, the picker, the full cards: css/vault.css — the profile + the moments show them since VAULT 1B)
  const one = (href, key) => new Promise(res => {
    if (document.querySelector(`link[data-${key}]`) || [...document.styleSheets].some(x => x.href && x.href.endsWith(href))) { res(); return; }
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; l.dataset[key] = '1';
    l.onload = () => res(); l.onerror = () => res();
    document.head.append(l);
    setTimeout(res, 2500);
  });
  sheet = Promise.all([one('/css/progress.css', 'pg'), one('/css/vault.css', 'vl')]).then(() => {});
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

/** THE NEON FLAME — PROGRESSION B's add-on: the streak card's BIG FLAME's own shape, small (flame-art.js — one flame everywhere: the moment's
 *  streak line, the profile's row, the card's flame, the week); `state`: lit · waiting · frozen · out. */
export function flameIcon(state = 'lit', size = 28) { return flameArt(state, size); }

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
// (the owner's PROGRESSION A review — IVORY NAMES: the X% line pink, in sentence case)
export const pctLine = p => (p ? `${p}% of players have this` : '');
export const setPctForTest = v => { pctMemo = { at: Date.now(), ttl: 1e12, who: 'test', test: true, v }; };
