// THE LETTER KEYBOARD (OC1 — docs/cartridge.md D9, the kit: `gk-`). QWERTY glass keys + ⌫ + a GO key — NEVER the phone's system keyboard
// (no focused input: the clues stay visible, no autocorrect, no suggestion bar, no layout jump). Keys ≥ 54 pt tall; ten across a phone is
// ~36 pt wide, so each key's HIT AREA is its whole cell (no dead gaps between keys — the face is drawn inset). POINTERDOWN, like the pad.
// A NEUTRAL BASE themed by --gk-* (css/kit.css); the game skins it.
//   createKeyboard({ go: 'GO', maxLen: 12, onChange(v), onGo(v), onKey(k) }) → { el, value, set(v), clear(), lock(on), key(e), destroy() }
//   keyboardReduce(value, key, maxLen) → the next value (PURE)
import { h } from '../../ui/dom.js';
import { flash } from './numpad.js';

export const KB_ROWS = Object.freeze(['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']);
export const KB_BACK = '⌫';
export const KB_GO = 'GO';

export function keyboardReduce(value, key, maxLen = 12) {
  const v = String(value || '');
  if (key === KB_BACK) return v.slice(0, -1);
  if (!/^[A-Z]$/.test(key)) return v;
  return v.length >= maxLen ? v : v + key;
}

export function createKeyboard({ go = KB_GO, maxLen = 12, onChange = null, onGo = null, onKey = null } = {}) {
  let value = '', locked = false;
  const press = k => {
    if (locked) return;
    const next = keyboardReduce(value, k, maxLen);
    if (onKey) onKey(k, next !== value);
    if (next === value) return;
    value = next;
    if (onChange) onChange(value);
  };
  const fire = () => { if (!locked && onGo) onGo(value); };
  const key = (k, label = k, cls = '') => {
    const b = h(`button.gk-key.gk-kb-key${cls}`, { type: 'button', dataset: { k, sfx: 'none' }, 'aria-label': k === KB_BACK ? 'Delete' : label },
      h('span.gk-key-face'), h('span.gk-key-glow'), h('span.gk-key-label', label));
    b.addEventListener('pointerdown', e => { e.preventDefault(); flash(b); if (k === KB_GO) fire(); else press(k); });
    b.addEventListener('click', e => { if (e.detail === 0) { if (k === KB_GO) fire(); else press(k); } });
    return b;
  };
  const rows = KB_ROWS.map((r, i) => h(`div.gk-kb-row.gk-kb-r${i}`, [...r].map(ch => key(ch)), i === 2 ? key(KB_BACK, KB_BACK, '.is-back') : null));
  const goKey = key(KB_GO, go, '.gk-go');
  const el = h('div.gk-keyboard', rows, h('div.gk-kb-row.gk-kb-r3', goKey));
  return {
    el,
    get value() { return value; },
    set(v) { value = String(v || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, maxLen); },
    clear() { value = ''; },
    lock(on = true) { locked = !!on; el.classList.toggle('is-locked', locked); },
    key(e) {
      if (/^[a-z]$/i.test(e.key)) press(e.key.toUpperCase());
      else if (e.key === 'Backspace') press(KB_BACK);
      else if (e.key === 'Enter') fire();
      else return false;
      e.preventDefault();
      return true;
    },
    destroy() {},
  };
}
