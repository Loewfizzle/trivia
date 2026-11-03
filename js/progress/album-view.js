// CITY SIGHTINGS on the profile = THE ALBUM (PROGRESSION B — the owner, Nov 2: an album of the player's own polaroids; only what they
// own — no list of what's out there, no ???, no totals). Each legendary they've spotted: THIS DEVICE's polaroid of it (js/profile/album.js
// — the first one, the discovery) with its date + time in hand, its name, "X% OF PLAYERS HAVE THIS"; on another device (no photo here)
// the LEGENDARY CARD + the date it was first spotted (the server's grant time). Tap one → it big (+ this device's later prints of it).
import { h } from '../ui/dom.js';
import { ITEM } from '../core/items.js';
import { cardVars, pctFor, pctLine } from './look.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
let sheetP = null;
const sheet = () => sheetP || (sheetP = new Promise(res => {
  if (document.querySelector('link[data-sg]')) { res(); return; }
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/sightings.css'; l.dataset.sg = '1'; l.onload = () => res(); l.onerror = () => res(); document.head.append(l); setTimeout(res, 2500);
  if (!document.querySelector('link[data-sg-font]')) { const f = document.createElement('link'); f.rel = 'stylesheet'; f.dataset.sgFont = '1'; f.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap'; document.head.append(f); }
}));
const capOf = t => { const d = new Date(t); const hr = d.getHours(); return { date: `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`, time: `${(hr % 12) || 12}:${String(d.getMinutes()).padStart(2, '0')} ${hr < 12 ? 'am' : 'pm'}` }; };
/** the sightings a player owns (their LEGENDARY card — granted by the server on the first counted sighting), oldest first */
export function ownedSightings(stats) {
  const it = (stats && stats.it) || {};
  return Object.values(ITEM).filter(x => x.kind === 'card' && x.sg && it[x.id]).map(x => ({ id: x.sg, card: x.id, name: x.name, at: it[x.id], emblem: ITEM[`emb-sg-${x.sg}`] || null, n: (stats.sg && stats.sg[x.sg]) || 1 }))
    .sort((a, b) => a.at - b.at);
}
const cardArt = s => h('div.sg-card', { style: cardVars(s.card), dataset: { item: s.card } }, h('i', s.emblem ? s.emblem.glyph : '✦'), h('span', 'LEGENDARY'));
function print(src, cap, tilt) {
  return h('div.sg-pol', { style: { '--r': `${tilt}deg` } }, h('div.sg-photo', h('img', { src, alt: '', loading: 'lazy' })), h('div.sg-cap', h('b', cap.date), h('span', cap.time)));
}

/** → the section element (or null: nothing spotted yet — the profile shows no empty album, no hint) */
export function albumSection(stats) {
  const own = ownedSightings(stats);
  if (!own.length) return null;
  sheet();
  const grid = h('div.sg-album');
  const tiles = new Map();
  own.forEach((s, i) => {
    const tilt = [-2.2, 1.6, -1, 2.4, -1.8, 1.1][i % 6];
    const art = h('div.sg-al-art', cardArt(s));
    const pct = h('div.sg-al-pct', '');
    const when = h('div.sg-al-pct', capOf(s.at).date);
    const b = h('button.sg-al', { type: 'button', dataset: { id: s.id }, 'aria-label': `${s.name}` }, art, h('div.sg-al-name', s.name), pct, when);
    b.addEventListener('click', () => openBig(s, tiles.get(s.id)));
    tiles.set(s.id, { s, art, pct, when, tilt, photos: [] });
    grid.append(b);
  });
  // this device's photos (IndexedDB — async; a tile keeps its card until its photo arrives)
  Promise.all([import('../profile/album.js'), sheet()]).then(([A]) => A.photos().then(list => {
    for (const T of tiles.values()) {
      const mine = list.filter(p => p.id === T.s.id).sort((a, b) => a.t - b.t);
      if (!mine.length) continue;
      T.photos = mine;
      const first = mine.find(p => p.first) || mine[0];
      T.art.replaceChildren(print(A.photoUrl(first), capOf(first.t), T.tilt));
      T.when.textContent = mine.length > 1 ? `${mine.length} PRINTS` : '';
    }
  })).catch(() => {});
  pctFor().then(P => { for (const T of tiles.values()) { const v = P && P.i ? P.i[T.s.card] : null; T.pct.textContent = pctLine(v); } }).catch(() => {});
  return h('section.pg-panel.sg-sec',
    h('div.pg-prof-h', h('span', 'CITY SIGHTINGS'), h('em', 'your own photos')),
    grid);
}

/** one sighting big: this device's print(s) — or its card + the date */
async function openBig(s, T) {
  await sheet();
  let A = null; try { A = await import('../profile/album.js'); } catch { /* fine */ }
  const photos = (T && T.photos) || [];
  const show = h('div.sg-big-show');
  const pick = p => show.replaceChildren(p ? (() => { const el = print(A.photoUrl(p), capOf(p.t), -1.5); return el; })() : cardArt(s));
  pick(photos[0] || null);
  const thumbs = photos.length > 1 ? h('div.sg-big-thumbs', ...photos.map(p => h('button.sg-big-th', { type: 'button', onclick: () => pick(p), 'aria-label': `the print from ${capOf(p.t).date}` }, h('img', { src: A.photoUrl(p), alt: '' })))) : null;
  const x = h('button.btn.btn-primary.sg-x', { type: 'button' }, 'CLOSE');
  const el = h('div.sg-big', { role: 'dialog', 'aria-label': s.name },
    h('div.sg-head', { style: { opacity: 1 } }, photos.length ? 'SPOTTED OVER THE HARBOR' : `FIRST SPOTTED ${capOf(s.at).date.toUpperCase()}`), show,
    h('div.sg-big-name', s.name), h('div.sg-al-pct', (T && T.pct.textContent) || ''), h('div.sg-al-pct', s.n > 1 ? `SPOTTED ${s.n} TIMES` : ''), thumbs, x);
  const close = () => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 260); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  x.addEventListener('click', close);
  el.addEventListener('click', e => { if (e.target === el) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
}
