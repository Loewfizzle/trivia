// LOBBY 2.0 A — THE SAVE-YOUR-KEY POP-UP (the owner's ADD-ON, Nov 3 10:07 pm). A player whose card could be lost — a key on this device,
// not marked saved, at least one COUNTED match — sees a glass pop-up ONCE: their card + "Save your key so you never lose your card" +
// COPY · SHARE (either one marks the key saved) · LATER. A RETURNING player meets it the first time they open the site after this update
// (on the city); a NEW player right after their FIRST counted match (back in the room). Once saved it never shows again; after LATER (or
// closing it) it does NOT pop up again — a small dot sits on YOU (the title dock + the room dock) until the key is saved. Never over a
// running game, the end-of-round moment, another sheet, or a legendary in the sky (it waits, then shows). Replaces the old reminder after
// the 3rd + 10th match (screens/profile.js#promptKey — gone with City 1.0's lobby, CITY 1.0 OUT).
//   keyPopDecide({ key, saved, kp, matches }) → 'show' | 'dot' | 'none'   (PURE)
//   keyPopState() → the same for this device · maybeKeyPop({ why, busy }) → shows it when it should · onKeyPop(fn) → unsubscribe
import { loadKey, loadMe } from '../identity.js';
import { state } from '../store.js';
import { notes, setNotes } from './me.js';

import { keyPopDecide } from '../core/keypop.js';
import { lazyImport } from '../ui/lazy-import.js';
export { keyPopDecide };
const matchesNow = () => { const m = loadMe(), n = notes(); const server = m && m.uid === state.uid && m.profile && typeof m.profile.m === 'number' ? m.profile.m : 0; return Math.max(server, n.games || 0); };
export const keyPopState = () => { const n = notes(); return keyPopDecide({ key: loadKey(), saved: !!n.saved, kp: n.kp || null, matches: matchesNow() }); };

const subs = new Set();
export function onKeyPop(fn) { subs.add(fn); return () => subs.delete(fn); }
const emit = () => { for (const f of subs) { try { f(keyPopState()); } catch { /* fine */ } } };
// (any change to the notes — the profile's "I saved it", COPY / SHARE anywhere — repaints the dot)
if (typeof window !== 'undefined') window.addEventListener('ns:notes', () => emit());

/** every pop-up the save-your-key sheet must never open over (tests/keypop + the harbor keypop group read it) */
export const KEYPOP_COVERED = '.pg-moment, .modal:not(.out), .sh:not(.is-out), .final, .vl-dress, .vl-full, .pf-overlay, .gm, .sg-modal, .sg-fly, .pg-sc, .pg-pv, .sg-big';
let open = null, waitT = 0;
/** busy() → true while something must not be covered (the title passes its scene's legendary) */
export function maybeKeyPop({ why = '', busy = null } = {}) {
  clearTimeout(waitT);
  if (open || keyPopState() !== 'show') return false;
  const playing = !!(state.code && state.meta && state.meta.status === 'playing' && state.game && state.quit !== state.game.matchId);
  // (FR6 FIXES A — B5 / H1: never over a card the player is looking at — `.sg-shot` + `.vl-full-open` never existed; now CUSTOMIZE, the
  //  full card, the room's profile overlay, the ☰ menu, the sighting moment, the streak card + the album too; SHELL 2.0 A — H1: + the
  //  sighting's flying photo + the streak preview, and THE SHEET's own class)
  const covered = document.querySelector(KEYPOP_COVERED);
  if (playing || covered || (busy && busy())) { waitT = setTimeout(() => maybeKeyPop({ why, busy }), 2500); return false; }
  show(why);
  return true;
}

async function show(why) {
  const [{ openPfSheet }, { memberCard }, B, { h }] = await Promise.all([lazyImport(import('./sheets.js'), './sheets.js'), lazyImport(import('../screens/profile.js'), '../screens/profile.js'), lazyImport(import('./bring.js'), './bring.js'), lazyImport(import('../ui/dom.js'), '../ui/dom.js')]);
  if (open || keyPopState() !== 'show') return;
  B.bringCss();
  setNotes({ kp: 'shown' });   // (once: from here on, closing it any way = the dot until it's saved)
  const m = loadMe(), pub = m && m.uid === state.uid ? m.profile : null;
  let saved = false;
  const done = () => { if (saved) return; saved = true; setNotes({ saved: true }); emit(); if (open) open.close(); };   // (copyKey / shareKey say so themselves)
  const copy = h('button.btn.btn-primary.kp-copy', { type: 'button', 'data-act': 'copy', onclick: async () => { if (await B.copyKey(loadKey())) done(); } }, 'COPY');
  const share = typeof navigator.share === 'function' ? h('button.btn.btn-ghost.kp-share', { type: 'button', 'data-act': 'share', onclick: async () => { if (await B.shareKey(loadKey())) done(); } }, 'SHARE') : null;
  const later = h('button.btn.btn-text.btn-block.kp-later', { type: 'button', onclick: () => { setNotes({ kp: 'later' }); open && open.close(); } }, 'LATER');
  open = openPfSheet({ kicker: 'YOUR MEMBERSHIP', title: 'SAVE YOUR KEY', cls: 'kp-sheet',
    body: [h('div.kp-card', memberCard(pub, {}, pub ? pub.x : 0)),
      h('p.kp-line', 'Save your key so you never lose your card.'),
      h('p.sh-note', 'Send it to yourself — Notes, Mail or a password manager. It brings this card back on any device; never give it to anyone else.'),
      h('div.kp-acts', copy, share), later],
    onClose: () => { open = null; if (!saved) setNotes({ kp: 'later' }); emit(); } });
  open.el.dataset.why = why;
  emit();
}

// test hook (emulator runs only)
if (typeof location !== 'undefined' && /[?&]emu\b/.test(location.search)) window.__keypop = { state: keyPopState, maybe: o => maybeKeyPop(o || {}), open: () => !!open };
