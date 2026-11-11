// COLOUR-BLIND colours (SHELL 2.0 B1 — the dailies chat, Nov 5 8:35 am): ONE setting (SETTINGS → "Colour-blind colours") — saved on this
// device (audio/settings.js#colorBlind) AND on the profile (ppriv/{pid}/cb through /api/profile 'prefs' — a new device with your card
// starts on it) — sets body[data-cb], which swaps the two shared answer tokens every game reads: --good (right: green → BLUE) + --close
// (close: gold → ORANGE). css/base.css. The city is untouched.
import { settings, onSettings, updateSettings } from '../audio/settings.js';
import { loadMe } from '../identity.js';
import { lazyImport } from './lazy-import.js';

const SET_KEY = 'ns:cb:set';   // (this device chose it itself — the profile's copy never overrides a local choice)
export function paintCb() { if (settings.colorBlind) document.body.dataset.cb = '1'; else delete document.body.dataset.cb; }
export function installColorBlind() {
  paintCb();
  let was = !!settings.colorBlind;
  onSettings(() => {
    paintCb();
    const now = !!settings.colorBlind;
    if (now === was) return;
    was = now;
    try { localStorage.setItem(SET_KEY, '1'); } catch { /* fine */ }
    // (on the profile too — quietly: no profile / /api down = this device only)
    if (loadMe()) lazyImport(import('../profile/api.js'), '../profile/api.js').then(a => a.api('profile', { action: 'prefs', cb: now })).catch(() => {});
  });
}
/** the profile's copy (fetchMe's priv.cb) → this device, unless this device chose for itself */
export function adoptProfileCb(cb) {
  if (typeof cb !== 'boolean') return;
  try { if (localStorage.getItem(SET_KEY)) return; } catch { /* fine */ }
  if (!!settings.colorBlind !== cb) updateSettings({ colorBlind: cb });
}
