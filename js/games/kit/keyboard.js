// THE LETTER KEYBOARD (OC1 — docs/cartridge.md D9, the kit: `gk-`). QWERTY glass keys + ⌫ + a GO key — NEVER the phone's system keyboard
// (no focused input: the clues stay visible, no autocorrect, no suggestion bar, no layout jump). Keys ≥ 54 pt tall; ten across a phone is
// ~36 pt wide, so each key's HIT AREA is its whole cell (no dead gaps between keys — the face is drawn inset). POINTERDOWN, like the pad.
// A NEUTRAL BASE themed by --gk-* (css/kit.css); the game skins it.
//   createKeyboard({ go: 'GO', maxLen: 12, onChange(v), onGo(v), onKey(k) }) → { el, value, set(v), clear(), lock(on), key(e), setKeyStates(map), destroy() }
//   keyboardReduce(value, key, maxLen) → the next value (PURE)
// PW1 (THE PASSWORD — docs/password.md): an OPTIONAL per-key state — setKeyStates({ A: 'hit', B: 'near', C: 'miss' }) marks the letter keys
// like the game's tiles (css/kit.css: a solid --good face + a bar along the bottom · an outlined --close face + a dot · a dim face — never
// colour alone; the colour-blind swap rides the tokens); a key not in the map goes back to default. `go` is the GO key's label (THE PASSWORD
// shows ENTER). The delete key is a DRAWN icon for everyone (an inline SVG in currentColor — no "⌫" glyph on screen; KB_BACK stays the key's
// code). OVERCLOCK is unchanged otherwise (its tests + before / after shots: Downloads/neon/password/shots/kb-before + kb-after).
import { h } from '../../ui/dom.js';
import { flash } from './numpad.js';

export const KB_ROWS = Object.freeze(['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']);
export const KB_BACK = '⌫';
export const KB_GO = 'GO';
export const KEY_STATES = Object.freeze(['hit', 'near', 'miss']);
/** the delete key's DRAWN icon (currentColor): a left-pointing key shape with an ✕ inside — one path, no text glyph */
export const backIcon = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 28 20'); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('gk-kb-backsvg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M9.5 2.5h14.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9.5L2.5 10z M13.5 6.5l6 7 M19.5 6.5l-6 7');
  path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '2.2'); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
  svg.append(path);
  return svg;
};

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
  const rows = KB_ROWS.map((r, i) => h(`div.gk-kb-row.gk-kb-r${i}`, [...r].map(ch => key(ch)), i === 2 ? key(KB_BACK, backIcon(), '.is-back') : null));
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
    /** PW1 — the letter keys' marks: { A: 'hit' | 'near' | 'miss', … }; a letter not in the map = default */
    setKeyStates(map = {}) {
      for (const b of el.querySelectorAll('.gk-kb-key[data-k]')) {
        const k = b.dataset.k;
        if (!/^[A-Z]$/.test(k)) continue;
        const st = map && KEY_STATES.includes(map[k]) ? map[k] : null;
        if (st) b.dataset.st = st; else delete b.dataset.st;
      }
    },
    destroy() {},
  };
}
