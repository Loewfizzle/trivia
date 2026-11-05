// YOUR NAME + YOUR COLOUR, ONE PLACE (LOBBY FIXES' ADD-ON 3 → THE SPEED PASS, the owner's FINAL, Nov 4 6:25 pm): ONE row "EDIT USERNAME"
// (the name + its colour dot) at the VERY TOP of CUSTOMIZE YOUR CARD (vault/dress.js) opens ONE editor here — the name + the colour together
// (a sheet ON TOP — the layer stack; ‹ = one step back). No ✎ on the profile's card, nothing in ACCOUNT (the key / restore / sign-in only).
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

/** THE SPEED PASS — ONE EDITOR, THE NAME + THE COLOUR (the owner, Nov 4 6:25 pm FINAL): CUSTOMIZE's one EDIT USERNAME row opens this sheet —
 *  the name field, the colour swatches under it, SAVE (only what changed is saved) → onDone({ name, color }, done) */
export async function openYouEditor(onDone) {
  const { openPfSheet } = await import('./sheets.js');
  const q = loadProfile() || {};
  let pick = q.color, s = null;
  const input = h('input.input.input-name.pf-name-in', { type: 'text', maxLength: NAME_MAX, value: q.name || '', autocomplete: 'nickname', autocapitalize: 'off', spellcheck: false, 'aria-label': 'Your username' });
  const sw = h('div.swatches.pf-swatches', { role: 'radiogroup', 'aria-label': 'Colour' });
  const paint = () => { for (const b of sw.children) b.setAttribute('aria-checked', String(b.dataset.id === pick)); };
  for (const c of COLORS) sw.append(h('button.swatch', { type: 'button', role: 'radio', 'aria-label': c.id, dataset: { id: c.id }, style: { '--c': c.hex }, onclick: () => { pick = c.id; paint(); } }));
  paint();
  const go = () => {
    const name = cleanName(input.value);
    if (!name) { toast('ENTER A NAME', 'err'); input.focus(); return; }
    const patch = {};
    if (name !== q.name) patch.name = name;
    if (pick && pick !== q.color) patch.color = pick;
    const done = Object.keys(patch).length ? saveYou(patch) : null;
    if (done && onDone) onDone({ name, color: pick || q.color }, done);
    s.close();
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  s = openPfSheet({ kicker: 'CUSTOMIZE', from: 'CUSTOMIZE', title: 'EDIT USERNAME', cls: 'pf-name-sheet', body: [   // (SHELL 2.0 B1: opened FROM CUSTOMIZE — its ‹ back)
    h('label.field', h('span.label', 'USERNAME'), input),
    h('p.pf-public', 'This name shows on the public board — don’t use your full real name.'),
    h('div.field', h('span.label', 'COLOUR'), sw),
    h('p.sh-note', 'Your colour lights your emblem, your ring in the line and your name in the room.'),
    h('button.btn.btn-primary.btn-block.pf-save', { type: 'button', onclick: go }, h('span', 'SAVE'))] });
  setTimeout(() => input.focus(), 320);
  return s;
}
