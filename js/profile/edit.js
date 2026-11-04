// LOBBY FIXES — YOUR NAME + YOUR COLOUR, ONE PLACE (the owner, Nov 4 — his ADD-ON 3): two plain rows at the TOP of CUSTOMIZE YOUR CARD
// ("NAME   LOEWFIZZLE ✎", "COLOUR   ● ✎" — vault/dress.js), each opening its editor here (a sheet ON TOP — the layer stack; ‹ = one step
// back); the small ✎ beside the name on the profile's card opens the same name editor. NOT in ACCOUNT (the key / restore / sign-in only).
// Saving: this device's sign-up profile first (identity.js — the room + the chat read it), in a room your name + colour in the line follow at
// once, then the server's profile (me.js#syncMe — a rename once a day, the board's name filter).
import { h } from '../ui/dom.js';
import { loadProfile, saveProfile } from '../identity.js';
import { state } from '../store.js';
import { sanitizeName } from '../core/room-logic.js';
import { NAME_MAX, COLORS, colorHex } from '../config.js';
import { toast } from '../ui/toast.js';
import { sfx } from '../audio/sfx.js';

/** the name as it would be saved ('' = not a name) */
export const cleanName = v => sanitizeName(v, NAME_MAX) || '';
/** what this device has now: { name, color, hex } */
export function youNow() { const q = loadProfile() || {}; return { name: (q.name || '').toUpperCase(), color: q.color || 'magenta', hex: colorHex(q.color) }; }

/** save { name?, color? } → resolves once the server has it */
export async function saveYou(patch) {
  const q = { ...(loadProfile() || {}), ...patch };
  saveProfile(q);
  sfx('lock');
  if (state.code) import('../room.js').then(m => m.updateMyProfile(q)).catch(() => {});
  try { window.dispatchEvent(new CustomEvent('ns:you', { detail: { ...patch } })); } catch { /* fine */ }
  try { const m = await import('./me.js'); await m.syncMe(); } catch { /* the server catches up on the next visit */ }
  return q;
}

/** THE NAME EDITOR (a sheet) → onDone(name) after a save */
export async function openNameEditor(onDone) {
  const { openPfSheet } = await import('./sheets.js');
  const q = loadProfile() || {};
  let s = null;
  const input = h('input.input.input-name.pf-name-in', { type: 'text', maxLength: NAME_MAX, value: q.name || '', autocomplete: 'nickname', autocapitalize: 'off', spellcheck: false, 'aria-label': 'Your name' });
  const go = () => {
    const name = cleanName(input.value);
    if (!name) { toast('ENTER A NAME', 'err'); input.focus(); return; }
    const done = saveYou({ name });
    if (onDone) onDone(name, done);
    s.close();
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  s = openPfSheet({ kicker: 'CUSTOMIZE', title: 'YOUR NAME', cls: 'pf-name-sheet', body: [
    h('label.field', h('span.label', 'NAME'), input),
    h('p.pf-public', 'This name shows on the public board — don’t use your full real name.'),
    h('button.btn.btn-primary.btn-block.pf-save', { type: 'button', onclick: go }, h('span', 'SAVE'))] });
  setTimeout(() => input.focus(), 320);
  return s;
}

/** THE COLOUR EDITOR (a sheet) → onDone(color) after a save */
export async function openColourEditor(onDone) {
  const { openPfSheet } = await import('./sheets.js');
  let pick = (loadProfile() || {}).color, s = null;
  const sw = h('div.swatches.pf-swatches', { role: 'radiogroup', 'aria-label': 'Colour' });
  const paint = () => { for (const b of sw.children) b.setAttribute('aria-checked', String(b.dataset.id === pick)); };
  for (const c of COLORS) sw.append(h('button.swatch', { type: 'button', role: 'radio', 'aria-label': c.id, dataset: { id: c.id }, style: { '--c': c.hex }, onclick: () => { pick = c.id; paint(); } }));
  paint();
  s = openPfSheet({ kicker: 'CUSTOMIZE', title: 'YOUR COLOUR', cls: 'pf-colour-sheet', body: [
    h('p.pfs-note', 'Your colour lights your emblem, your ring in the line and your name in the room.'), sw,
    h('button.btn.btn-primary.btn-block.pf-save', { type: 'button', onclick: () => { const done = pick ? saveYou({ color: pick }) : null; if (pick && onDone) onDone(pick, done); s.close(); } }, h('span', 'SAVE'))] });
  return s;
}
