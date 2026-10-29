// SP6 — THE CREDITS SHEET (a CC BY work needs its credit ON the site): a glass sheet from the menu (☰ → CREDITS on the title, in the lobby
// and in a game). ADD A CREDIT: one entry in CREDITS below — { group, title, by, licence, link? } — copy a model's / a recording's line
// exactly as its credits.txt gives it (e.g. art/models/<name>/credits.txt). Groups show in the order they first appear.
import { h } from './dom.js';

// C4c — the harvest display's 3D model (art/models/harvest/credits.txt). Its licence (Tencent Hunyuan 3D 2.1 Community License) asks
// AI-generated content shown publicly to be identified as AI-generated, and does not cover the EU, the UK + South Korea.
// NIGHT-A — LISTED (the owner, Oct 29 4:34 pm: "we don't care about those few countries — it's a hobby project": Hunyuan3D models MAY
// SHIP, with the AI-generated label here). Before any MONEY (the app stores, payments, a paid pack): re-check every Hunyuan asset's terms.
export const HARVEST_MODEL_CREDIT = Object.freeze({ group: '3D MODELS', title: 'Harvest display (AI-generated)', by: 'Generated with Tencent Hunyuan3D 2.1 from a Grok Imagine reference image', licence: 'Tencent Hunyuan 3D 2.1 Community License — AI-generated', link: 'https://huggingface.co/tencent/Hunyuan3D-2.1' });
export const CREDITS = [
  HARVEST_MODEL_CREDIT,   // (NIGHT-A: live — the AI-generated label the licence asks for)
  // 3D MODELS (rendered offline into sprites — scripts/bake-model.mjs + scripts/bake/<recipe>.mjs; the raw models never ship) — word for word from its credits.txt
  // (art/models/<name>/credits.txt): the title, the author, the link, the licence
  { group: '3D MODELS', title: '"UFO" by sebslom', by: 'https://sketchfab.com/3d-models/ufo-75655f43c4fc4c56ab60746caf7119fe', licence: 'Licensed under CC BY 4.0 (http://creativecommons.org/licenses/by/4.0/)', link: 'https://sketchfab.com/3d-models/ufo-75655f43c4fc4c56ab60746caf7119fe' },
  // BNAME: the construction tower's crane (art/models/crane/credits.txt: "Crane by J-Toastie, CC BY 3.0 (poly.pizza)")
  { group: '3D MODELS', title: 'Crane by J-Toastie', by: 'J-Toastie (poly.pizza)', licence: 'CC BY 3.0 (poly.pizza)', link: 'https://poly.pizza/m/gCcpjaxFdv' },
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
