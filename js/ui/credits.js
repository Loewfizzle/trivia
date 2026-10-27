// SP6 — THE CREDITS SHEET (a CC BY work needs its credit ON the site): a glass sheet from the menu (☰ → CREDITS on the title, in the lobby
// and in a game). ADD A CREDIT: one entry in CREDITS below — { group, title, by, licence, link? } — copy a model's / a recording's line
// exactly as its credits.txt gives it (e.g. art/models/<name>/credits.txt). Groups show in the order they first appear.
import { h } from './dom.js';

export const CREDITS = [
  // 3D MODELS (rendered offline into sprites — scripts/bake-*.mjs; the raw models never ship): the UFO's line goes here when its model
  // (art/models/ufo/) is baked — word for word from its credits.txt
  { group: 'THE CITY SOUNDS', title: 'Field recordings + effects', by: 'Freesound contributors (CC0), the Sonniss GDC Game Audio Bundles, Mixkit, Pixabay', licence: 'CC0 · royalty-free licences (edited, cut + re-encoded for the city)' },
  { group: 'THE TYPE', title: 'Orbitron', by: 'Matt McInerney', licence: 'SIL Open Font License 1.1', link: 'https://fonts.google.com/specimen/Orbitron' },
  { group: 'THE TYPE', title: 'Chakra Petch', by: 'Cadson Demak', licence: 'SIL Open Font License 1.1', link: 'https://fonts.google.com/specimen/Chakra+Petch' },
  { group: 'THE TYPE', title: 'JetBrains Mono', by: 'JetBrains', licence: 'SIL Open Font License 1.1', link: 'https://fonts.google.com/specimen/JetBrains+Mono' },
];

let sheet = null;
export function openCredits() {
  closeCredits();
  const groups = [];
  for (const c of CREDITS) { let g = groups.find(x => x.name === c.group); if (!g) groups.push(g = { name: c.group, items: [] }); g.items.push(c); }
  const body = h('div.cr-body', ...groups.map(g => h('section.cr-group', h('h3.cr-head', g.name), ...g.items.map(c =>
    h('div.cr-item', h('b.cr-title', c.link ? h('a', { href: c.link, target: '_blank', rel: 'noopener' }, c.title) : c.title), h('span.cr-by', c.by), h('span.cr-lic', c.licence))))));
  sheet = h('div.modal.cr-modal', { onclick: e => { if (e.target === sheet) closeCredits(); } },
    h('div.sheet.cr-sheet', { role: 'dialog', 'aria-label': 'Credits' },
      h('div.sheet-grip'),
      h('div.set-head', h('div', h('div.sheet-kicker', 'NEON SPEAKEASY'), h('h2.sheet-title', 'CREDITS')),
        h('button.icon-btn', { type: 'button', 'aria-label': 'Close', onclick: closeCredits }, '×')),
      body,
      h('button.btn.btn-primary.btn-block', { type: 'button', onclick: closeCredits }, h('span', 'CLOSE'))));
  document.body.append(sheet);
}
export function closeCredits() {
  if (!sheet) return;
  const s = sheet; sheet = null;
  s.classList.add('out');
  setTimeout(() => s.remove(), 260);
}
